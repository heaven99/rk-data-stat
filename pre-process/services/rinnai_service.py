from common.logger import get_logger

log = get_logger("rinnai_service")

class RinnaiService:
    def handle_message(self, topic: str, data: dict):
        if topic.endswith("/inf"):
            self.handle_inf(data)
        elif topic.endswith("/cmd"):
            self.handle_cmd(data)

    def handle_inf(self, data):
        log.info("handle inf %s", data)

    def handle_cmd(self, data):
        log.info("handle cmd %s", data)
