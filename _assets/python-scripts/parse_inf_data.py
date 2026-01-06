#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
ck_history_db.public.tbl_device_his_inf -> public.tbl_his_inf_parsed
사용법: python parse_his_inf.py 20241231
"""

import os
import sys
import json
from datetime import datetime, timedelta

import psycopg2
import psycopg2.extras


# ====== DB 접속 정보(환경변수로도 OK) ======
PG_DSN = os.getenv(
    "PG_DSN",
    "dbname=ck_history_db user=ckstack password=abcd1234 host=127.0.0.1 port=5432",
)

SRC_TABLE = 'public.tbl_device_his_inf'
DST_TABLE = 'public.tbl_his_inf_parsed'

# ====== 맵(네가 준 boilerDataMap 그대로) ======
BOILER_DATA_MAP = [
    {"key": "opStatus",                     "offset":  0,  "length":  1},
    {"key": "trialMode",                    "offset":  1,  "length":  1},
    {"key": "heatingState",                 "offset":  2,  "length":  1},
    {"key": "hotWaterState",                "offset":  3,  "length":  1},
    {"key": "boostHeatingState",            "offset":  4,  "length":  1},
    {"key": "hotWaterReservationState",     "offset":  5,  "length":  1},
    {"key": "lockState",                    "offset":  6,  "length":  1},
    {"key": "heatingMode",                  "offset":  7,  "length":  1},
    {"key": "heatingCombustionState",       "offset":  8,  "length":  1},
    {"key": "hotWaterCombustionState",      "offset":  9,  "length":  1},
    {"key": "hotWaterTempInt",              "offset": 10,  "length":  2},
    {"key": "hotWaterTempDecimal",          "offset": 12,  "length":  1},
    {"key": "heatingFloorTemp",             "offset": 13,  "length":  2},
    {"key": "heatingRoomTemp",              "offset": 15,  "length":  2},
    {"key": "currentRoomTemp",              "offset": 17,  "length":  2},
    {"key": "awayState",                    "offset": 19,  "length":  1},
    {"key": "errorState",                   "offset": 20,  "length":  1},
    {"key": "errorData",                    "offset": 21,  "length":  3},
    {"key": "heatingEcoDetected",           "offset": 24,  "length":  1},
    {"key": "waterFlowDetected",            "offset": 25,  "length":  1},
    {"key": "modeState",                    "offset": 26,  "length":  1},
    {"key": "freezeAlarmNotify",            "offset": 27,  "length":  1},
    {"key": "freezeBoozerAlarm",            "offset": 28,  "length":  1},
    {"key": "tempLimitRange",               "offset": 29,  "length":  2},
    {"key": "controlInfoPower",             "offset": 31,  "length":  1},
    {"key": "controlInfoHeating",           "offset": 32,  "length":  1},
    {"key": "controlInfoHotWater",          "offset": 33,  "length":  1},
    {"key": "controlInfoAway",              "offset": 34,  "length":  1},
    {"key": "controlInfoModeState",         "offset": 35,  "length":  1},
    {"key": "controlInfoReserve",           "offset": 36,  "length":  1},
    {"key": "controlInfoHeatingTemp",       "offset": 37,  "length":  1},
    {"key": "controlInfoHotWaterTemp",      "offset": 38,  "length":  1},
    {"key": "scheduleState",                "offset": 39,  "length":  1},
    {"key": "scheduleType",                 "offset": 40,  "length":  1},
    {"key": "scheduleInfoGeneral",          "offset": 41,  "length":  2},
    {"key": "scheduleInfoType",             "offset": 43,  "length":  1},
    {"key": "scheduleInfo24h",              "offset": 44,  "length": 12},
    {"key": "resetUserInfo",                "offset": 56,  "length":  2},
    {"key": "controlType",                  "offset": 58,  "length":  1},
    {"key": "settingTempSavingEnergy",      "offset": 59,  "length":  2},
    {"key": "currentTempSavingEnergy",      "offset": 61,  "length":  2},
    {"key": "gasMeasurementUnit",           "offset": 63,  "length":  1},
    {"key": "patternReserveInfo",           "offset": 64,  "length":  1},
    {"key": "pattern1ExtinguishedTime",     "offset": 65,  "length":  1},
    {"key": "pattern1CombustionTime",       "offset": 66,  "length":  1},
    {"key": "pattern2ExtinguishedTime",     "offset": 67,  "length":  1},
    {"key": "pattern2CombustionTime",       "offset": 68,  "length":  1},
    {"key": "pattern3ExtinguishedTime",     "offset": 69,  "length":  1},
    {"key": "pattern3CombustionTime",       "offset": 70,  "length":  1},
    {"key": "heatingSupplyTH",              "offset": 71,  "length":  3},
    {"key": "hotwaterSupplyTH",             "offset": 74,  "length":  3},
    {"key": "freezeTH",                     "offset": 77,  "length":  3},
    {"key": "waterCirculationTH",           "offset": 80,  "length":  3},
    {"key": "emissionTH",                   "offset": 83,  "length":  3},
    {"key": "heatingAiStatus",              "offset": 86,  "length":  1},
    {"key": "hotwaterAiStatus",             "offset": 87,  "length":  1},
    {"key": "otaStatus",                    "offset": 88,  "length":  1},
    {"key": "smartDiagnosisStatus",         "offset": 89,  "length":  1},
    {"key": "progressRate",                 "offset": 90,  "length":  2},
    {"key": "sensorDiagnosisStatus",        "offset": 92,  "length":  1},
    {"key": "roomTHErrorState",             "offset": 93,  "length":  2},
    {"key": "heatingSupplyTHErrorState",    "offset": 95,  "length":  2},
    {"key": "hotwaterSupplyTHErrorState",   "offset": 97,  "length":  2},
    {"key": "freezeTHErrorState",           "offset": 99,  "length":  2},
    {"key": "waterCirculationTHErrorState", "offset": 101, "length":  2},
    {"key": "emissionTHErrorState",         "offset": 103, "length":  2},
    {"key": "ignitionUnitDiagnosisState",   "offset": 105, "length":  1},
    {"key": "ignitionUnitDiagnosisError",   "offset": 106, "length":  2},
    {"key": "circularUnitDiagnosisState",   "offset": 108, "length":  1},
    {"key": "circularUnitDiagnosisError",   "offset": 109, "length":  2},
    {"key": "fanUnitDiagnosisState",        "offset": 111, "length":  1},
    {"key": "fanError",                     "offset": 112, "length":  2},
    {"key": "emissionBlockError",           "offset": 114, "length":  2},
    {"key": "commStateDiagnosisState",      "offset": 116, "length":  1},
    {"key": "commStateDiagnosisError",      "offset": 117, "length":  2},
]

# ====== ENUM/코드 매핑 ======
ONOFF = {'0': 'OFF', '1': 'ON'}
UNLOCK_LOCK = {'0': 'UNLOCK', '1': 'LOCK'}
HEATING_MODE = {'0': '온돌', '1': '실온'}
EXIST = {'0': '없음', '1': '있음'}
EXIST2 = {'0': '없음', '1': '버블 OFF', '2': '버블 ON'}
MODE_STATUS = {
    '0': 'OFF',
    '1': 'SAVE',
    '2': 'AUTO',
    '3': '정음',
    '4': '정음+SAVE',
    '5': '정음+AUTO',
    '8': '살균',
}
CONTROL_ACTION = {'0': '조작없음', '1': 'ON', '2': 'OFF'}
CONTROL_ACTION2 = {'0': '조작없음', '1': '조작&변경있음'}
CONTROL_ACTION3 = {
    '0': '조작없음',
    '1': 'AUTO ON',
    '2': 'AUTO OFF',
    '3': 'SAVE ON',
    '4': 'SAVE OFF',
    '5': '정음+SAVE ON',
    '6': '정음+SAVE OFF',
    '7': '정음+AUTO ON',
    '8': '정음+AUTO OFF',
    '9': '정음 ON',
    'A': '정음 OFF',
}
RESERVE_STATUS = ONOFF
RESERVE_TYPE = {'0': '일반예약', '1': '24시간예약', '2': '패턴예약'}
RESERVE_INFO = {'0': '미사용', '1': '유형1', '2': '유형2', '3': '유형3', '4': '유형4', '5': '유형5'}
RESERVE_INFO2 = {'0': '미사용', '1': '패턴1', '2': '패턴2', '3': '패턴3'}
USER_STATUS = {'0': '통상', '1': '등록정보Reset'}
HEATING_ON_MODE = {'0': '라디에이터', '1': '바닥난방', '2': '난방전용', '3': 'TH', '4': 'TS'}
GAS_UNIT = {'0': 'm3', '1': 'kg'}
PROGRESS = {'0': '지시없음', '1': '진행중', '2': '완료', '3': '실패'}
RESULT = {'0': '시작전', '1': '이상없음', '2': '이상있음'}

def require_str(s):
    return '' if s is None else str(s)

def slice_field(payload: str, offset: int, length: int) -> str:
    """HEX 한 글자 단위로 슬라이스(대문자 통일). 부족하면 자동 패드(오른쪽은 잘리지 않음)."""
    if payload is None:
        return ''
    if offset < 0 or length <= 0:
        return ''
    if offset >= len(payload):
        return ''
    return payload[offset: offset + length].upper()

def to_onoff(ch: str) -> str:
    return ONOFF.get((ch or '0')[:1], 'OFF')

def to_unlock_lock(ch: str) -> str:
    return UNLOCK_LOCK.get((ch or '0')[:1], 'UNLOCK')

def to_mode_status(ch: str) -> str:
    return MODE_STATUS.get((ch or '0')[:1], 'OFF')

def to_control_action(ch: str) -> str:
    return CONTROL_ACTION.get((ch or '0')[:1], '조작없음')

def to_control_action2(ch: str) -> str:
    return CONTROL_ACTION2.get((ch or '0')[:1], '조작없음')

def to_control_action3(ch: str) -> str:
    return CONTROL_ACTION3.get((ch or '0')[:1], '조작없음')

def to_exist(ch: str) -> str:
    return EXIST.get((ch or '0')[:1], '없음')

def to_exist2(ch: str) -> str:
    return EXIST2.get((ch or '0')[:1], '없음')

def to_reserve_type(ch: str) -> str:
    return RESERVE_TYPE.get((ch or '0')[:1], '일반예약')

def to_reserve_info(ch: str) -> str:
    return RESERVE_INFO.get((ch or '0')[:1], '미사용')

def to_reserve_info2(ch: str) -> str:
    return RESERVE_INFO2.get((ch or '0')[:1], '미사용')

def to_user_status(ch: str) -> str:
    return USER_STATUS.get((ch or '0')[:1], '통상')

def to_heating_on_mode(ch: str) -> str:
    return HEATING_ON_MODE.get((ch or '0')[:1], '라디에이터')

def to_gas_unit(ch: str) -> str:
    return GAS_UNIT.get((ch or '0')[:1], 'm3')

def to_progress(ch: str) -> str:
    return PROGRESS.get((ch or '0')[:1], '지시없음')

def to_result(ch: str) -> str:
    return RESULT.get((ch or '0')[:1], '시작전')


def th_code_to_char4(code3: str) -> str:
    """
    3-hex TH code -> Celsius string or '미사용'
      - 'FFF' => '미사용'
      - 0x000..0x078 => 0..120  (e.g., '078' -> '120')
      - 0x101..0x114 => -1..-20 (e.g., '101' -> '-1', '114' -> '-20')
      - 그 외 범위/에러 => '미사용'
    """
    s = (code3 or '').strip().upper()
    if not s:
        return '미사용'
    if s == 'FFF':
        return '미사용'
    try:
        v = int(s, 16)
    except Exception:
        return '미사용'

    if 0x000 <= v <= 0x078:        # 0..120
        return str(v)
    if 0x101 <= v <= 0x114:        # -1..-20  (0x100 기준 음수)
        return str(-(v - 0x100))

    return '미사용'

def to_progress_rate(chars2: str) -> str:
    """진행률 '00'~'64' (hex) → '0%'~'100%' 형태 문자열"""
    chars2 = (chars2 or '00').upper()
    try:
        val = int(chars2, 16)  # 0x64 == 100
    except Exception:
        val = 0
    return f"{val}%"

def parse_topic(topic: str):
    """
    예: 'rinnai/RK/01/RK/f06/07/A8:.../inf'
    group_cd = 다섯 번째 세그먼트('f06'), group_type_cd = 여섯 번째('07')
    """
    try:
        parts = (topic or '').split('/')
        group_cd = (parts[4] if len(parts) > 1 else '').upper()[:3].ljust(3)  # CHAR(3)
        group_type_cd = (parts[5] if len(parts) > 2 else '').upper()[:2].ljust(2)  # CHAR(2)
        return group_cd, group_type_cd
    except Exception:
        return '   ', '  '

def parse_lat_lon(orig_data: dict):
    """orig_data.lt 가 유효하면 (lat, lon) 튜플 반환. 없으면 (None, None)"""
    try:
        lt = orig_data.get('lt')
        if isinstance(lt, dict):
            lat = lt.get('lat')
            lon = lt.get('lon')
            return (float(lat) if lat is not None else None,
                    float(lon) if lon is not None else None)
    except Exception:
        pass
    return (None, None)

def extract(payload: str, key: str) -> str:
    m = next((m for m in BOILER_DATA_MAP if m['key'] == key), None)
    if not m:
        return ''
    return slice_field(payload, m['offset'], m['length'])

def to_int_from_hex(chars: str) -> int:
    """HEX 문자열(예: '28', '0A', '55') → 10진수 정수(예: 40, 10, 85). 실패 시 0."""
    try:
        s = (chars or '').strip()
        if not s:
            return 0
        return int(s, 16)
    except Exception:
        return 0

def to_hour_from_hex(chars: str) -> int:
    """HEX 문자열(예: '28', '0A', '55') → 10진수 정수(예: 40, 10, 85). 실패 시 0."""
    try:
        s = (chars or '').strip()
        if not s:
            return '미사용'
        return f"{int(s, 16)}H"
    except Exception:
        return '미사용'

def to_minute_from_hex(chars: str) -> int:
    """HEX 문자열(예: '28', '0A', '55') → 10진수 정수(예: 40, 10, 85). 실패 시 0."""
    try:
        s = (chars or '').strip()
        if not s:
            return '미사용'
        return f"{int(s, 16)}M"
    except Exception:
        return '미사용'

def parse_payload(payload: str) -> dict:
    """HEX 문자열(각 글자 1칸) → 타깃 컬럼 dict"""
    g = lambda k: extract(payload, k)

    # 기본 on/off & 상태값
    return {
        "power_status":               to_onoff(g("opStatus")),
        "test_status":                to_onoff(g("trialMode")),
        "heating_status":             to_onoff(g("heatingState")),
        "hotwater_status":            to_onoff(g("hotWaterState")),
        "boost_status":               to_onoff(g("boostHeatingState")),
        "pre_heating_status":         to_onoff(g("hotWaterReservationState")),
        "lock_status":                to_unlock_lock(g("lockState")),
        "heating_mode":               HEATING_MODE.get(g("heatingMode")[:1] if g("heatingMode") else '0', '온돌'),
        "heating_combustion":         to_onoff(g("heatingCombustionState")),
        "hotwater_combustion":        to_onoff(g("hotWaterCombustionState")),

        "hotwater_setting_integer":   to_int_from_hex(g("hotWaterTempInt")),
        "hotwater_setting_decimal":   to_int_from_hex(g("hotWaterTempDecimal")),
        "heating_setting_floor_temp": to_int_from_hex(g("heatingFloorTemp")),
        "heating_setting_room_temp":  to_int_from_hex(g("heatingRoomTemp")),
        "current_room_temp":          to_int_from_hex(g("currentRoomTemp")),

        "outing_status":              to_onoff(g("awayState")),
        "error_status":               to_onoff(g("errorState")),
        "error_data":                 (g("errorData") or '000').upper().rjust(3, '0')[:3],

        "heating_eco_detect":         to_exist(g("heatingEcoDetected")),
        "water_flow_detect":          to_exist2(g("waterFlowDetected")),
        "mode_status":                to_mode_status(g("modeState")),
        "freeze_alarm_noti":          to_onoff(g("freezeAlarmNotify")),
        "freeze_buzzer_alarm":        to_onoff(g("freezeBoozerAlarm")),

        "setting_temp_limit_range":   to_int_from_hex(g("tempLimitRange")),  # '28'~'55' 등

        "sw_control_power":           to_control_action(g("controlInfoPower")),
        "sw_control_heating":         to_control_action(g("controlInfoHeating")),
        "sw_control_hotwater":        to_control_action(g("controlInfoHotWater")),
        "sw_control_outing":          to_control_action(g("controlInfoAway")),
        "sw_control_mode":            to_control_action3(g("controlInfoModeState")),
        "sw_control_reserve":         to_control_action(g("controlInfoReserve")),
        "sw_control_chg_heating":     to_control_action2(g("controlInfoHeatingTemp")),
        "sw_control_chg_hotwater":    to_control_action2(g("controlInfoHotWaterTemp")),

        "reserve_status":             to_onoff(g("scheduleState")),
        "reserve_type":               to_reserve_type(g("scheduleType")),

        "reserve_info_normal":        to_hour_from_hex(g("scheduleInfoGeneral")),
        "reserve_info_type":          to_reserve_info(g("scheduleInfoType")),
        "reserve_info_24":            (g("scheduleInfo24h") or '000000000000').ljust(12, '0')[:12],

        "user_info_reset":            to_user_status(g("resetUserInfo")[:1] if g("resetUserInfo") else '0'),

        "control_type_heating_hotwater": to_heating_on_mode(g("controlType")),

        # 에너지절약 설정온도들: 원시값 저장(후처리까지 필요하면 매핑 추가)
        "energy_saving_heating_setting_floor_temp": to_int_from_hex(g("settingTempSavingEnergy")),
        "energy_saving_heating_setting_room_temp":  to_int_from_hex(g("currentTempSavingEnergy")),

        "gas_measure_unit":           to_gas_unit(g("gasMeasurementUnit")),

        "pattern_reserve_info":       to_reserve_info2(g("patternReserveInfo")),
        "pattern1_extinguished_time": to_hour_from_hex(g("pattern1ExtinguishedTime")),
        "pattern1_combustion_time":   to_minute_from_hex(g("pattern1CombustionTime")),
        "pattern2_extinguished_time": to_hour_from_hex(g("pattern2ExtinguishedTime")),
        "pattern2_combustion_time":   to_minute_from_hex(g("pattern2CombustionTime")),
        "pattern3_extinguished_time": to_hour_from_hex(g("pattern3ExtinguishedTime")),
        "pattern3_combustion_time":   to_minute_from_hex(g("pattern3CombustionTime")),

        "heating_supply_th":          th_code_to_char4(g("heatingSupplyTH")),
        "hotwater_supply_th":         th_code_to_char4(g("hotwaterSupplyTH")),
        "freeze_th":                  th_code_to_char4(g("freezeTH")),
        "water_circulation_th":       th_code_to_char4(g("waterCirculationTH")),
        "emission_th":                th_code_to_char4(g("emissionTH")),

        "heating_ai_status":          to_onoff(g("heatingAiStatus")),
        "hotwater_ai_status":         to_onoff(g("hotwaterAiStatus")),
        "ota_status":                 to_progress(g("otaStatus")),
        "smart_diagnosis_status":     to_progress(g("smartDiagnosisStatus")),
        "progress_rate":              to_progress_rate(g("progressRate")),

        "sensor_diagnosis_status":            to_result(g("sensorDiagnosisStatus")),
        "room_th_error_state":                (g("roomTHErrorState") or 'FF')[:2],
        "heating_supply_th_error_state":      (g("heatingSupplyTHErrorState") or 'FF')[:2],
        "hotwater_supply_th_error_state":     (g("hotwaterSupplyTHErrorState") or 'FF')[:2],
        "freeze_th_error_state":              (g("freezeTHErrorState") or 'FF')[:2],
        "water_circulation_th_error_state":   (g("waterCirculationTHErrorState") or 'FF')[:2],
        "emission_th_error_state":            (g("emissionTHErrorState") or 'FF')[:2],
        "ignition_unit_diagnosis_state":      to_result(g("ignitionUnitDiagnosisState")),
        "ignition_unit_diagnosis_error":      (g("ignitionUnitDiagnosisError") or 'FF')[:2],
        "circular_unit_diagnosis_state":      to_result(g("circularUnitDiagnosisState")),
        "circular_unit_diagnosis_error":      (g("circularUnitDiagnosisError") or 'FF')[:2],
        "fan_unit_diagnosis_state":           to_result(g("fanUnitDiagnosisState")),
        "fan_error":                          (g("fanError") or 'FF')[:2],
        "emission_block_error":               (g("emissionBlockError") or 'FF')[:2],
        "comm_state_diagnosis_state":         to_result(g("commStateDiagnosisState")),
        "comm_state_diagnosis_error":         (g("commStateDiagnosisError") or 'FF')[:2],
    }


# def fetch_src_rows(conn, yyyymmdd: str):
#     """해당 일자 00:00:00~23:59:59"""
#     dt = datetime.strptime(yyyymmdd, "%Y%m%d")
#     t0 = dt
#     t1 = dt + timedelta(days=1)
#
#     sql = f"""
#         SELECT id, device_id, serial_num, topic, orig_data, c_date
#         FROM {SRC_TABLE}
#         WHERE c_date >= %s AND c_date < %s
#           AND orig_data IS NOT NULL
#     """
#     with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
#         cur.execute(sql, (t0, t1))
#         for row in cur:
#             yield row

def fetch_src_rows(conn, yyyymmdd: str):
    dt = datetime.strptime(yyyymmdd, "%Y%m%d")
    t0 = dt
    t1 = dt + timedelta(days=1)

    sql = f"""
        SELECT id, device_id, serial_num, topic, orig_data, c_date
        FROM {SRC_TABLE}
        WHERE c_date >= %s AND c_date < %s
          AND orig_data IS NOT NULL
    """

    # ✅ 서버사이드 커서
    with conn.cursor(name="his_inf_cursor", cursor_factory=psycopg2.extras.DictCursor) as cur:
        cur.itersize = 5000  # ✅ 서버에서 5000개씩 끊어서 가져옴
        cur.execute(sql, (t0, t1))
        for row in cur:
            yield row


def insert_parsed(conn, rows):
    """rows: list of dict(타깃 컬럼들 + serial_num, c_date, group_cd, group_type_cd, lat, lon)"""
    if not rows:
        return 0

    cols = [
        "serial_num","c_date","group_cd","group_type_cd","lat","lon",
        "power_status","test_status","heating_status","hotwater_status","boost_status",
        "pre_heating_status","lock_status","heating_mode","heating_combustion","hotwater_combustion",
        "hotwater_setting_integer","hotwater_setting_decimal","heating_setting_floor_temp",
        "heating_setting_room_temp","current_room_temp","outing_status","error_status","error_data",
        "heating_eco_detect","water_flow_detect","mode_status","freeze_alarm_noti","freeze_buzzer_alarm",
        "setting_temp_limit_range","sw_control_power","sw_control_heating","sw_control_hotwater",
        "sw_control_outing","sw_control_mode","sw_control_reserve","sw_control_chg_heating",
        "sw_control_chg_hotwater","reserve_status","reserve_type","reserve_info_normal",
        "reserve_info_type","reserve_info_24","user_info_reset","control_type_heating_hotwater",
        "energy_saving_heating_setting_floor_temp","energy_saving_heating_setting_room_temp",
        "gas_measure_unit","pattern_reserve_info","pattern1_extinguished_time","pattern1_combustion_time",
        "pattern2_extinguished_time","pattern2_combustion_time","pattern3_extinguished_time",
        "pattern3_combustion_time","heating_supply_th","hotwater_supply_th","freeze_th",
        "water_circulation_th","emission_th","heating_ai_status","hotwater_ai_status","ota_status",
        "smart_diagnosis_status","progress_rate","sensor_diagnosis_status","room_th_error_state",
        "heating_supply_th_error_state","hotwater_supply_th_error_state","freeze_th_error_state",
        "water_circulation_th_error_state","emission_th_error_state","ignition_unit_diagnosis_state",
        "ignition_unit_diagnosis_error","circular_unit_diagnosis_state","circular_unit_diagnosis_error",
        "fan_unit_diagnosis_state","fan_error","emission_block_error","comm_state_diagnosis_state",
        "comm_state_diagnosis_error"
    ]
    placeholders = ", ".join(["%s"] * len(cols))
    sql = f"INSERT INTO {DST_TABLE} ({', '.join(cols)}) VALUES ({placeholders})"
    with conn.cursor() as cur:
        psycopg2.extras.execute_batch(
            cur,
            sql,
            [[r.get(c) for c in cols] for r in rows],
            page_size=1000,
        )
    return len(rows)


def main():
    if len(sys.argv) < 2:
        print("Usage: python parse_his_inf.py YYYYMMDD")
        sys.exit(1)
    yyyymmdd = sys.argv[1]
    try:
        _ = datetime.strptime(yyyymmdd, "%Y%m%d")
    except ValueError:
        print("Invalid date format. Use YYYYMMDD")
        sys.exit(1)

    conn_r = psycopg2.connect(PG_DSN)  # ✅ read 전용
    conn_w = psycopg2.connect(PG_DSN)  # ✅ write 전용
    conn_w.autocommit = False
    inserted = 0
    batch = []
    seen = 0  # 진행용

    try:
        for row in fetch_src_rows(conn_r, yyyymmdd):
            serial_num = require_str(row["serial_num"]).strip()
            topic = require_str(row["topic"])
            group_cd, group_type_cd = parse_topic(topic)
            if group_cd.strip().upper() != 'F06':
                continue
            c_date = row["c_date"]

            # orig_data: {"rpc":[{"id":"70","data":"..."}], "lt": {...} ...}
            try:
                od = row["orig_data"] if isinstance(row["orig_data"], dict) else json.loads(row["orig_data"])
            except Exception:
                od = {}

            # lat, lon = parse_lat_lon(od)

            rpc_list = od.get("rpc") if isinstance(od, dict) else None
            if not rpc_list or not isinstance(rpc_list, list):
                continue
            payload = None
            for item in rpc_list:
                if isinstance(item, dict) and "data" in item:
                    payload = require_str(item["data"]).strip()
                    break
            if not payload:
                continue

            parsed = parse_payload(payload)

            out = {
                "serial_num": serial_num,
                "c_date": c_date,
                "group_cd": group_cd,
                "group_type_cd": group_type_cd,
                "lat": 0,
                "lon": 0,
                **parsed
            }
            batch.append(out)
            seen += 1

            if len(batch) >= 5000:
                inserted += insert_parsed(conn_w, batch)
                batch.clear()
                conn_w.commit()

                # ✅ 배치 단위로만 로그 (원하면 삭제 가능)
                print(f"[{yyyymmdd}] scanned={seen:,} inserted={inserted:,}")

        if batch:
            inserted += insert_parsed(conn_w, batch)
            conn_w.commit()

        print(f"OK - inserted rows: {inserted}")

    except Exception as e:
        conn_w.rollback()  # ✅ write 커넥션만 롤백
        print(f"FAILED: {e}")
        raise
    finally:
        conn_r.close()
        conn_w.close()


if __name__ == "__main__":
    main()
