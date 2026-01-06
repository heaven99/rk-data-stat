from common.logger import get_logger

log = get_logger()

log.alarm("SYSTEM ALARM")
log.error("db error")
log.warn("cache miss")
log.info("server started")
log.debug("debug detail")
log.verbose("very verbose log")
log.silly("silly detail")
