from psycopg_pool import ConnectionPool
from common.logger import get_logger

log = get_logger("postgresql")

_pools = {}

def init_postgres_all(db_configs: dict):
    """
    db_configs:
      {
        "stat": {...},
        "history": {...}
      }
    """
    for name, conf in db_configs.items():
        dsn = (
            f"host={conf['host']} "
            f"port={conf['port']} "
            f"dbname={conf['dbname']} "
            f"user={conf['user']} "
            f"password={conf['password']}"
        )

        log.info("init postgres pool [%s]", name)

        _pools[name] = ConnectionPool(
            conninfo=dsn,
            min_size=conf["pool"]["min"],
            max_size=conf["pool"]["max"],
            open=True,
        )

def get_conn(name: str):
    if name not in _pools:
        raise RuntimeError(f"postgres pool not initialized: {name}")
    return _pools[name].connection()
