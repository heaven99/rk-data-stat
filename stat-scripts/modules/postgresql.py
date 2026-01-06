import logging
from psycopg_pool import ConnectionPool
from common.logger import get_logger
from enum import Enum

# 🔥 psycopg 관련 모든 로그 완전 차단
for logger_name in ["psycopg", "psycopg.pool", "psycopg_pool"]:
    logger = logging.getLogger(logger_name)
    logger.handlers.clear()
    logger.propagate = False
    logger.setLevel(logging.CRITICAL)
    logger.disabled = True


log = get_logger("postgresql")

_pools = {}

class Fetch(Enum):
    NONE = "none"   # fetch 없음 (rowcount)
    ONE  = "one"    # fetchone()
    ALL  = "all"    # fetchall()

def init_postgres(db_configs: dict, lhd : str = ""):
    """
    db_configs:
      {
        "stat": {...},
        "history": {...}
      }
    """
    for name, conf in db_configs.items():
        if not conf.get("host"):
            raise RuntimeError(f"[config error] db.host missing for {name}")
        if not conf.get("user"):
            raise RuntimeError(f"[config error] db.user missing for {name}")
        if not conf.get("password"):
            raise RuntimeError(f"[config error] db.password missing for {name}")

        dsn = (
            f"host={conf['host']} "
            f"port={conf['port']} "
            f"dbname={conf['dbname']} "
            f"user={conf['user']} "
            f"password={conf['password']}"
        )

        log.info("%sinit postgres pool [%s]", lhd, name)

        pool = ConnectionPool(
            conninfo=dsn,
            min_size=conf["pool"]["min"],
            max_size=conf["pool"]["max"],
            open=True,
        )

        # 🔑 핵심: 커넥션이 실제로 열릴 때까지 대기
        with pool.connection() as conn:
            pass

        log.info("%spostgres pool [%s] ready", lhd, name)
        _pools[name] = pool

def get_conn(name: str):
    if name not in _pools:
        raise RuntimeError(f"postgres pool not initialized: {name}")
    return _pools[name].connection()

def query(db_name, sql, params=None, fetch=Fetch.NONE):
    # log.debug(
    #     "query fetch=%r (%s), Fetch.ONE=%r (%s)",
    #     fetch, type(fetch),
    #     Fetch.ONE, type(Fetch.ONE),
    # )

    with get_conn(db_name) as conn:
        with conn.cursor() as cur:
            cur.execute(sql, params)

            if fetch == Fetch.ONE:
                row = cur.fetchone()
                # COUNT(*) 같은 경우를 위해 단일 컬럼이면 값으로 정규화
                return row[0] if row and len(row) == 1 else row

            if fetch == Fetch.ALL:
                return cur.fetchall()

            return cur.rowcount

def execute(db, sql, params=None):
    return query(db, sql, params)

def fetch_one(db, sql, params=None):
    return query(db, sql, params, fetch=Fetch.ONE)

def fetch_all(db, sql, params=None):
    return query(db, sql, params, fetch=Fetch.ALL)