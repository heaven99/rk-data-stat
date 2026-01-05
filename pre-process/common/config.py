import os
import yaml

def load_config():
    env = os.getenv("APP_ENV", "dev")
    base_path = os.path.dirname(__file__) + "/../config"

    def load_yaml(name):
        with open(f"{base_path}/{name}.yaml") as f:
            return yaml.safe_load(f)

    config = load_yaml("dev")
    env_config = load_yaml(env)

    # merge (env overrides base)
    for k, v in env_config.items():
        if isinstance(v, dict):
            config.setdefault(k, {}).update(v)
        else:
            config[k] = v

    # secrets from ENV

    config["databases"]["stat"]["password"] = os.getenv("DB_PASSWORD_CK_STAT_DB")
    config["databases"]["history"]["password"] = os.getenv("DB_PASSWORD_CK_HISTORY_DB")
    config["mqtt"]["password"] = os.getenv("MQTT_PASSWORD")

    return config
