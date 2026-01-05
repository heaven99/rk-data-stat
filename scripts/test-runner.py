from modules.array_runner import run_array
from common.logger import (
    register_winston_levels,
    get_logger,
    setup_basic_console_logger,
)

# 앱 시작 시 1회
register_winston_levels()
setup_basic_console_logger()

# app.conf.log["default-level"]
log = get_logger("app", default_level="debug")

def process(x):
    return x + 10

arr = [10, 20, 30]
result = run_array(arr, process)
log.debug(result)
