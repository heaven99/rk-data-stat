import os
import yaml

_CONFIG_CACHE = None


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

    if "stat" in config["databases"]:
        pw = os.getenv("DB_PASSWORD_CK_STAT_DB")
        if pw:
            config["databases"]["stat"]["password"] = pw

    if "history" in config["databases"]:
        pw = os.getenv("DB_PASSWORD_CK_HISTORY_DB")
        if pw:
            config["databases"]["history"]["password"] = pw

    mqtt_pw = os.getenv("MQTT_PASSWORD")
    if mqtt_pw:
        config["mqtt"]["password"] = mqtt_pw

    _CONFIG_CACHE = config
    return config
