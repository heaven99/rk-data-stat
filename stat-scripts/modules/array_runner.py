#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
array_runner.py
- array(list)와 function(callable)을 받아
  array를 loop 돌며 function을 실행하는 유틸 모듈
"""

from typing import Callable, Iterable, List, Any, Optional
from common.logger import get_logger
import time

log = get_logger()

def calc_progress_step(total: int) -> int:
    """
    total 개수에 따라 진행률 로그 단위를 결정
    """
    if total >= 100_000:
        return 5      # 5%
    elif total >= 10_000:
        return 10     # 10%
    else:
        return 20     # 20%

"""
items 를 순회하면서 fn(item)을 실행한다.

:param collect_result:
    True  -> fn(item) 결과를 list 로 반환 (index == items index)
    False -> 결과를 저장하지 않음 (None 반환)
"""
def run_array(
    items,
    fn,
    lhd: str = "",
    *,
    stop_on_error: bool = False,
    collect_result: bool = False,
):
    items = list(items)
    total = len(items)

    log.debug("%sstart run_array. total [%d]", lhd, total)

    start_ts = time.monotonic()

    step = calc_progress_step(total)
    next_mark = step

    results = [] if collect_result else None

    for idx, item in enumerate(items, start=1):
        try:
            ret = fn(item)
            if collect_result:
                results.append(ret)
        except Exception as e:
            log.error("%sindex=%d, item=%s, error=%s", lhd, idx-1, item, e)
            if collect_result:
                results.append(None)
            if stop_on_error:
                raise

        current_percent = (idx * 100) // total

        if current_percent >= next_mark:
            elapsed = time.monotonic() - start_ts
            log.debug(
                "%sprogress [%d%%] (%d/%d), elapsed [%.2fs]",
                lhd,
                next_mark,
                idx,
                total,
                elapsed,
            )
            next_mark += step

    elapsed = time.monotonic() - start_ts

    log.debug(
        "%send run_array. elapsed [%.3fs]", lhd, elapsed
    )

    return results




# ---------------------------
# 테스트용 실행 코드
# ---------------------------
if __name__ == "__main__":

    def sample_func(x):
        time.sleep(0.1)
        return x * 2

    data = list(range(1, 21))

    run_array(
        data,
        sample_func,
        lhd="[TEST]",
    )
