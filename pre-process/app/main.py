from handlers.mqtt_handler import MQTTHandler
from common.config import load_config
from modules.postgresql import init_postgres

config = load_config()
init_postgres(config["databases"])

def main():
    config = {
        "host": "192.168.0.249",
        "port": 1883,
        "client_id": "rinnai-preprocess",
    }

    handler = MQTTHandler(config)
    handler.start()

if __name__ == "__main__":
    main()
