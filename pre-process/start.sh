#!/bin/bash
export DB_PASSWORD_CK_STAT_DB=abcd1234
export DB_PASSWORD_CK_HISTORY_DB=abcd1234

source venv/bin/activate

APP_ENV=dev python3 -m app.main