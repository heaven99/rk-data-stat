"""
common/logger.py

CK project logging core
- Custom log levels
- Default log level from config
- Safe for multi-threaded environments
"""

import logging
import sys
from typing import Dict, List, Optional

from common.config import load_config  # config 연동

_INITIALIZED = False
_DEFAULT_LEVEL: Optional[str] = None
_LOGGER_CACHE = {}  # type: Dict[tuple, CKLogger]


# -------------------------------------------------
# CK log levels (lower = more important)
# -------------------------------------------------
LOG_LEVELS = {
    "alarm": 0,
    "error": 1,
    "warn": 2,
    "info": 3,
    "debug": 4,
    "verbose": 5,
    "silly": 6,
}


def _map_levels(levels: Dict[str, int]) -> Dict[str, int]:
    base = 60
    return {name: base - priority for name, priority in levels.items()}


# -------------------------------------------------
# Load default level from config (once)
# -------------------------------------------------
def _load_default_level() -> str:
    global _DEFAULT_LEVEL
    if _DEFAULT_LEVEL is not None:
        return _DEFAULT_LEVEL

    try:
        config = load_config()
        _DEFAULT_LEVEL = config.get("log", {}).get("default-level", "info")
    except Exception:
        _DEFAULT_LEVEL = "info"

    return _DEFAULT_LEVEL


# -------------------------------------------------
# One-time automatic setup
# -------------------------------------------------
def _auto_setup():
    global _INITIALIZED
    if _INITIALIZED:
        return

    py_levels = _map_levels(LOG_LEVELS)

    for name, lvl in py_levels.items():
        logging.addLevelName(lvl, name.upper())

        def log_method(self, message, *args, _lvl=lvl, **kwargs):
            if self.isEnabledFor(_lvl):
                self._log(_lvl, message, args, **kwargs)

        setattr(logging.Logger, name, log_method)

    _INITIALIZED = True


# -------------------------------------------------
# CK Logger
# -------------------------------------------------
class CKLogger:
    def __init__(
        self,
        name: str = "",
        level: Optional[str] = None,
        handlers: List[logging.Handler] = None,
    ):
        _auto_setup()

        self._levels = _map_levels(LOG_LEVELS)
        self._logger = logging.getLogger(name)
        self._logger.propagate = False

        # -------------------------------------------------
        # Logger level 결정
        # -------------------------------------------------
        if level is None:
            default_level = _load_default_level()
            self._logger.setLevel(self._levels[default_level])
        else:
            self._logger.setLevel(self._levels[level])

        # -------------------------------------------------
        # Handler 처리
        # -------------------------------------------------
        if handlers is not None:
            self._logger.handlers.clear()
            for h in handlers:
                self._logger.addHandler(h)

        # 기본 console handler 세팅
        if not self._logger.handlers:
            formatter = logging.Formatter(
                "%(asctime)s.%(msecs)03d [%(levelname)5s] %(message)s",
                "%m/%d %H:%M:%S",
            )

            # stdout: info 이하 (debug, verbose, silly 포함)
            stdout_handler = logging.StreamHandler(sys.stdout)
            stdout_handler.setLevel(self._logger.level)  # Logger level과 동일하게
            stdout_handler.setFormatter(formatter)

            # stderr: warn 이상 (warn, error, alarm)
            stderr_handler = logging.StreamHandler(sys.stderr)
            stderr_handler.setLevel(self._levels["warn"])
            stderr_handler.setFormatter(formatter)

            self._logger.addHandler(stdout_handler)
            self._logger.addHandler(stderr_handler)

        self._bind_methods()

    # -------------------------------------------------
    # Custom level methods
    # -------------------------------------------------
    def _bind_methods(self):
        for name, lvl in self._levels.items():

            def log_method(message, *args, _lvl=lvl, **kwargs):
                if self._logger.isEnabledFor(_lvl):
                    self._logger._log(_lvl, message, args, **kwargs)

            setattr(self, name, log_method)

    # helpers
    def set_level(self, level: str):
        self._logger.setLevel(self._levels[level])

    def add_handler(self, handler: logging.Handler):
        self._logger.addHandler(handler)


# -------------------------------------------------
# Public factory functions
# -------------------------------------------------
def get_logger(
    name: str = "",
    level: Optional[str] = None,
) -> CKLogger:
    cache_key = (name, level)
    if cache_key not in _LOGGER_CACHE:
        _LOGGER_CACHE[cache_key] = CKLogger(name=name, level=level)
    return _LOGGER_CACHE[cache_key]


def create_logger(
    name: str = "",
    level: Optional[str] = None,
    handlers: List[logging.Handler] = None,
) -> CKLogger:
    return CKLogger(name=name, level=level, handlers=handlers)
