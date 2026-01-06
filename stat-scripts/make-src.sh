#!/bin/bash

# ==========================
# config
# ==========================
BASE_DIR="/home/ckstack/rk-data-stat/stat-scripts"
LOG_DIR="/data/log/stat/scripts"

APP_ENV="dev"

# secrets (운영에서는 .env 파일로 분리 추천)
export DB_PASSWORD_CK_STAT_DB="abcd1234"
export DB_PASSWORD_CK_HISTORY_DB="abcd1234"

# ==========================
# date / log
# ==========================
TODAY=$(date +"%Y%m%d")
LOG_FILE="${LOG_DIR}/make-src-${TODAY}.log"

# ==========================
# prepare
# ==========================
mkdir -p "${LOG_DIR}"

cd "${BASE_DIR}" || exit 1

# venv 활성화
source venv/bin/activate

# ==========================
# run
# ==========================
echo "[$(date '+%Y-%m-%d %H:%M:%S')] start make_src" >> "${LOG_FILE}"

APP_ENV=${APP_ENV} python3 -m scripts.make_src \
    >> "${LOG_FILE}" 2>&1

RET=$?

echo "[$(date '+%Y-%m-%d %H:%M:%S')] end make_src (exit=${RET})" >> "${LOG_FILE}"

exit ${RET}
