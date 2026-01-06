from modules.array_runner import run_array
from common.logger import get_logger

# app.conf.log["default-level"]
log = get_logger()

def process(x):
    return x + 10

arr = [10, 20, 30]
result = run_array(arr, process)
log.debug(result)
