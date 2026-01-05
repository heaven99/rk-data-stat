import paho.mqtt.client as mqtt

class MQTTClient:
    def __init__(self, host, port, client_id, username=None, password=None):
        self.client = mqtt.Client(client_id=client_id, clean_session=True)

        if username:
            self.client.username_pw_set(username, password)

        self.client.connect(host, port, keepalive=60)

    def set_message_handler(self, handler):
        self.client.on_message = handler

    def subscribe(self, topic, qos=0):
        self.client.subscribe(topic, qos)

    def start(self):
        self.client.loop_forever()