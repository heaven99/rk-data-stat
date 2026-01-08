from common.logger import get_logger
from modules.postgresql import get_conn, query
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
        insert_raw_query = """
            INSERT INTO tbl_device_his_inf (
                serial_num,
                topic,
                orig_data,
                c_date
            )
            VALUES (%s, %s, %s, now())
        """
        insert_raw_param = (serial_num, topic, Json(data))
        insert_raw_info = query("history", insert_raw_query, insert_raw_param)

        log.info("saved raw history. serial num [%s], row count [%d]", serial_num, insert_raw_info)

        # TODO data parse
        # TODO insert into parsed table