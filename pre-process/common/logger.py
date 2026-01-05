"""
logger.py
- Winston-style custom log levels for Python logging
- Levels (Node winston compatible):
    alarm:   0
    error:   1
    warn:    2
    info:    3
    debug:   4
    verbose: 5
    silly:   6
"""

import logging

# -------------------------------------------------
# Winston levels (mapped to Python numeric levels)
# Python: 숫자 클수록 중요 → 역방향 매핑
# -------------------------------------------------
WINSTON_LEVELS = {
    "alarm": 60,    # highest
    "error": 50,
    "warn": 40,
    "info": 30,
    "debug": 20,
    "verbose": 15,
    "silly": 10,    # lowest
}


# -------------------------------------------------
# Register winston levels into logging
# -------------------------------------------------
def register_winston_levels():
    """
    Call once at application startup
    """
    for name, level in WINSTON_LEVELS.items():
        logging.addLevelName(level, name.upper())

        def log_for_level(self, message, *args, _level=level, **kwargs):
            if self.isEnabledFor(_level):
                self._log(_level, message, args, **kwargs)

        setattr(logging.Logger, name, log_for_level)


# -------------------------------------------------
# Create logger (level only, transport-agnostic)
# -------------------------------------------------
def get_logger(
    name: str,
    default_level: str = "info",
):
    """
    Equivalent to winston.createLogger({ levels, level })
    """
    logger = logging.getLogger(name)
    logger.setLevel(WINSTON_LEVELS[default_level])
    return logger


# -------------------------------------------------
# Optional: basic console formatter (Node printf style)
# -------------------------------------------------
def setup_basic_console_logger():
    """
    Console output style similar to Node winston printf
    MM/DD HH:mm:ss.SSS [LEVEL] message
    """
    handler = logging.StreamHandler()
    formatter = logging.Formatter(
        fmt="%(asctime)s.%(msecs)03d [%(levelname)5s] %(message)s",
        datefmt="%m/%d %H:%M:%S",
    )
    handler.setFormatter(formatter)

    root = logging.getLogger()
    if not root.handlers:
        root.addHandler(handler)
