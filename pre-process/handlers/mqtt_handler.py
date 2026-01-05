import json
import paho.mqtt.client as mqtt
from common.logger import get_logger
from services.rinnai_service import RinnaiService

log = get_logger("mqtt_handler")

class MQTTHandler:
    def __init__(self, config):
        self.service = RinnaiService()

        self.client = mqtt.Client(client_id=config["client_id"])

        # 🔥 반드시 콜백 먼저 등록
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message

        if config.get("username"):
            self.client.username_pw_set(
                config["username"], config["password"]
            )

        log.info(
            "connecting to mqtt broker %s:%s",
            config["host"], config["port"]
        )
        self.client.connect(config["host"], config["port"])

    def start(self):
        self.client.loop_forever()

    # 🔥 여기서 subscribe
    def on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            log.info("mqtt connected, subscribing")
            client.subscribe("rinnai/#", qos=1)
        else:
            log.error("mqtt connect failed rc=%s", rc)

    def on_message(self, client, userdata, msg):
        payload = msg.payload.decode("utf-8", errors="ignore")
        log.info("recv topic=%s payload=%s", msg.topic, payload)

        try:
            data = json.loads(payload)
        except Exception:
            log.warn("invalid json")
            return

        self.service.handle_message(msg.topic, data)
