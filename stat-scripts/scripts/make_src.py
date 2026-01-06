import requests
import sys
import time

from datetime import datetime, timedelta
from modules.array_runner import run_array
from common.logger import get_logger
from common.config import load_config
from modules.postgresql import init_postgres, query, Fetch

config = load_config()

log = get_logger()

tid = None
lhd = None

STAT_TIME_STR = None
STAT_TIME_DT = None
    
WINDOW_START = None
WINDOW_END = None

def init_lhd():
    global tid, lhd

    tid = int(time.time() * 1000)
    lhd = f"[make-src:{tid}] - "

    # log.info("%s start job", lhd)


def init_stat_time():
    global STAT_TIME_STR, STAT_TIME_DT, WINDOW_START, WINDOW_END

    # python -m scripts.make_src [YYYYMMDDHH]
    arg = sys.argv[1] if len(sys.argv) > 1 else None

    if arg:
        # YYYYMMDDHH → YYYYMMDDHH0000
        stat_str = arg + "0000"
        STAT_TIME_DT = datetime.strptime(stat_str, "%Y%m%d%H%M%S")
        STAT_TIME_STR = stat_str
    else:
        now = datetime.now().replace(minute=0, second=0, microsecond=0)
        STAT_TIME_DT = now
        STAT_TIME_STR = now.strftime("%Y%m%d%H%M%S")
    
    WINDOW_START = STAT_TIME_DT
    WINDOW_END = STAT_TIME_DT + timedelta(hours=1)

    log.info("%sset stat time. parameter [%s]. stat time [%s]", lhd, arg, STAT_TIME_STR)

def parse_stat_datetime(yyyymmddhhmmss: str | None) -> tuple[str, datetime]:
    """
    YYYYMMDDHHmmss → (정규화된 문자열, datetime)
    mmss는 항상 0000
    """
    if yyyymmddhhmmss:
        base = yyyymmddhhmmss[:10]  # YYYYMMDDHH
        stat_str = base + "0000"
        stat_dt = datetime.strptime(stat_str, "%Y%m%d%H%M%S")
    else:
        now = datetime.now()
        stat_dt = now.replace(minute=0, second=0, microsecond=0)
        stat_str = stat_dt.strftime("%Y%m%d%H%M%S")

    return stat_str, stat_dt


def make_src_packet_count_inf(device: dict, cnt: int):
    serial_num = device.get("serial_num")
    if not serial_num:
        return

    query(
        "stat",
        """
        INSERT INTO tbl_stat_src (
            stat_date,
            serial_num,
            data_type,
            value
        )
        VALUES (%s, %s, %s, %s)
        """,
        (
            STAT_TIME_STR,
            serial_num,
            "PACKET_COUNT_INF",
            cnt,
        ),
    )


def process(device):
    serial_num = device.get("serial_num")
    if not serial_num:
        log.warn("%sdevice.serial_num missing", lhd)
        return False

    # TODO history his inf 를 보는게 아니라 parsed 를 봐야함
    # 데이터 어차피 1시간에 장비단위로하면 몇개 없을것 같아서 그냥 전체 조회해버리자.
    rows = query(
        "history",
        """
        SELECT id
        FROM public.tbl_device_his_inf
        WHERE serial_num = %s
          AND c_date >= %s
          AND c_date <  %s
        """,
        (serial_num, WINDOW_START, WINDOW_END),
        fetch=Fetch.ALL,
    )

    cnt = len(rows)

    make_src_packet_count_inf(device, cnt)
    return True



def fetch_device_list():
    """
    device list API 호출
    """
    api_host = config["data-interface"]["host"]
    api_conf = config["data-interface"]["api"]["device-list"]

    url = api_host + api_conf["path"]
    method = api_conf.get("method", "POST").upper()
    timeout = api_conf.get("timeout", 5)
    headers = api_conf.get("headers", {})

    log.info("%sfetch device list from [%s]", lhd, url)

    try:
        if method == "GET":
            resp = requests.get(url, headers=headers, timeout=timeout)
        else:
            resp = requests.request(method, url, headers=headers, timeout=timeout)

        resp.raise_for_status()

        data = resp.json()

        # 응답 형태 방어
        if isinstance(data, dict):
            devices = data.get("list") or []
        elif isinstance(data, list):
            devices = data
        else:
            raise ValueError("unexpected response format")

        # log.info("%sfetched %d devices", lhd, len(devices))
        return devices

    except Exception as e:
        log.error("%sfailed to fetch device list: %s", lhd, e)
        return []


def main():
    init_lhd()
    init_stat_time()
    init_postgres(config["databases"], lhd)

    fetch_start = time.monotonic()
    devices = fetch_device_list()
    fetch_elapsed = time.monotonic() - fetch_start

    log.info(
        "%sfetched %d devices, elapsed [%.3fs]",
        lhd,
        len(devices),
        fetch_elapsed,
    )

    if not devices:
        log.warn("no devices to process")
        return

    run_array(devices, process, lhd)

    log.info("%sprocessed %d devices", lhd, len(devices))


if __name__ == "__main__":
    main()
