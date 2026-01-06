import os
import yaml

_CONFIG_CACHE = None

def resolve_env_value(value):
    if isinstance(value, str) and value.startswith("env://"):
        env_key = value[len("env://"):]
        return os.getenv(env_key)
    return value


def resolve_env_config(obj):
    """
    config dict 전체를 순회하면서 env:// 값을 env 값으로 치환
    """
    if isinstance(obj, dict):
        for k, v in obj.items():
            obj[k] = resolve_env_config(v)
        return obj

    if isinstance(obj, list):
        return [resolve_env_config(v) for v in obj]

    return resolve_env_value(obj)


def load_config():
    global _CONFIG_CACHE
    if _CONFIG_CACHE is not None:
        return _CONFIG_CACHE

    env = os.getenv("APP_ENV", "dev")
    base_path = os.path.join(os.path.dirname(__file__), "../config")

    def load_yaml(name):
        path = os.path.join(base_path, f"{name}.yaml")
        if not os.path.exists(path):
            return {}
        with open(path) as f:
            return yaml.safe_load(f) or {}

    # 1. load base config
    config = load_yaml("base")

    # 2. load env override
    env_config = load_yaml(env)

    # 3. merge (env overrides base)
    for k, v in env_config.items():
        if isinstance(v, dict):
            config.setdefault(k, {}).update(v)
        else:
            config[k] = v

    # 4. secrets from ENV (optional)
    config.setdefault("databases", {})
    config.setdefault("mqtt", {})

    # 5. resolve env:// values
    config = resolve_env_config(config)

    _CONFIG_CACHE = config
    return config
