"""
common/logger.py

CK project logging core
- Custom log levels
- Default log level from config
- Safe for multi-threaded environments
"""

import logging
from typing import Dict, List, Optional

from common.config import load_config  # 👈 config 연동

_INITIALIZED = False
_DEFAULT_LEVEL: Optional[str] = None


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
        _DEFAULT_LEVEL = (
            config.get("log", {}).get("default-level", "info")
        )
    except Exception:
        # config 로딩 실패 시 안전 fallback
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
        # Level 결정 로직 (FIXED)
        # -------------------------------------------------
        if level is None:
            # config default-level은 항상 적용
            default_level = _load_default_level()
            self._logger.setLevel(self._levels[default_level])
        else:
            # 명시적 override
            self._logger.setLevel(self._levels[level])


        # -------------------------------------------------
        # Handler 처리
        # -------------------------------------------------
        if handlers is not None:
            self._logger.handlers.clear()
            for h in handlers:
                self._logger.addHandler(h)

        # 기본 console handler 보장
        if not self._logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                "%(asctime)s.%(msecs)03d [%(levelname)5s] %(message)s",
                "%m/%d %H:%M:%S",
            )
            handler.setFormatter(formatter)
            self._logger.addHandler(handler)

        self._bind_methods()

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
    return CKLogger(name=name, level=level)


def create_logger(
    name: str = "",
    level: Optional[str] = None,
    handlers: List[logging.Handler] = None,
) -> CKLogger:
    return CKLogger(name=name, level=level, handlers=handlers)
