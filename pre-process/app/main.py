from handlers.mqtt_handler import MQTTHandler
from common.logger import (
    register_winston_levels,
    setup_basic_console_logger,
)

def main():
    register_winston_levels()
    setup_basic_console_logger()

    config = {
        "host": "192.168.0.249",
        "port": 1883,
        "client_id": "rinnai-preprocess",
    }

    handler = MQTTHandler(config)
    handler.start()

if __name__ == "__main__":
    main()
