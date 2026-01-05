#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
array_runner.py
- array(list)와 function(callable)을 받아
  array를 loop 돌며 function을 실행하는 유틸 모듈
"""

from typing import Callable, Iterable, List, Any


def run_array(
    items: Iterable[Any],
    fn: Callable[[Any], Any],
    *,
    stop_on_error: bool = False
) -> List[Any]:
    """
    items 를 순회하면서 fn(item)을 실행한다.

    :param items: iterable (list, tuple 등)
    :param fn: item 하나를 인자로 받는 함수
    :param stop_on_error: True 면 에러 발생 시 즉시 중단
    :return: fn 실행 결과 리스트
    """
    results = []

    for idx, item in enumerate(items):
        try:
            result = fn(item)
            results.append(result)
        except Exception as e:
            print(f"[ERROR] index={idx}, item={item}, error={e}")
            if stop_on_error:
                raise
            results.append(None)

    return results


# ---------------------------
# 테스트용 실행 코드
# ---------------------------
if __name__ == "__main__":

    def sample_func(x):
        return x * 2

    data = [1, 2, 3, 4, 5]

    print("[START] run_array")
    output = run_array(data, sample_func)
    print("[RESULT]", output)
