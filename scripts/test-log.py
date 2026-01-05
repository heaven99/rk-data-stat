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

log.alarm("SYSTEM ALARM")
log.error("db error")
log.warn("cache miss")
log.info("server started")
log.debug("debug detail")
log.verbose("very verbose log")
log.silly("silly detail")
