from common.logger import get_logger
from modules.postgresql import get_conn
from psycopg.types.json import Json

log = get_logger("rinnai_service")

class RinnaiService:
    def handle_message(self, topic: str, data: dict):
        device_id = data.get("sn")
        
        # rinnai/RK/01/RK/f06/28/CK:BO:IL:ER:00:01/inf
        device_type = ''
        serial_num = ''
        try:
            device_type = topic.split('/')[4]
            serial_num = topic.split('/')[6]
        except IndexError:
            log.error("invalid topic format: %s", topic)
            return

        if device_type != 'f06':
            log.debug("unsupported device type: %s", device_type)
            return

        # id         BIGINT GENERATED ALWAYS AS IDENTITY,
        # serial_num CHAR(17) NOT NULL,
        # topic      VARCHAR(128) NOT NULL,
        # orig_data  TEXT,
        # c_date     TIMESTAMP
        with get_conn("history") as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO tbl_device_his_inf (
                        serial_num,
                        topic,
                        orig_data,
                        c_date
                    )
                    VALUES (%s, %s, %s, now())
                    """,
                    (serial_num, topic, Json(data)),
                )

        log.info("saved history event %s", serial_num)

        # TODO data parse
        # TODO insert into parsed table