// startDate/endDate: 'YYYYMMDD'
function diffDaysInclusive(startDate, endDate) {
    const parse = (yyyymmdd) => {
        if (!/^\d{8}$/.test(yyyymmdd)) throw new Error(`Invalid date: ${yyyymmdd}`);
        const y = Number(yyyymmdd.slice(0, 4));
        const m = Number(yyyymmdd.slice(4, 6));
        const d = Number(yyyymmdd.slice(6, 8));
        // 로컬 자정 기준 (KST 환경이면 그대로 OK)
        return new Date(y, m - 1, d);
    };

    const s = parse(startDate);
    const e = parse(endDate);

    // end < start 방지
    if (e < s) return -1;

    const msPerDay = 24 * 60 * 60 * 1000;
    // inclusive: 20250101~20250107 => 7일
    return Math.floor((e - s) / msPerDay) + 1;
}

/**
 * startDate, endDate(YYYYMMDD)를 받아
 * endDate가 속한 주의 "지난 주(일~토)" 범위를 반환
 *
 * @param {string} startDate - YYYYMMDD (형식 검증용)
 * @param {string} endDate   - YYYYMMDD (기준일)
 * @returns {{ startDate: string, endDate: string }}
 */
function getLastWeekRange(startDate, endDate) {
    const isValid = (d) => /^\d{8}$/.test(d);
    if (!isValid(startDate) || !isValid(endDate)) {
        throw new Error(`Invalid date format`);
    }

    const parse = (yyyymmdd) => {
        const y = Number(yyyymmdd.slice(0, 4));
        const m = Number(yyyymmdd.slice(4, 6));
        const d = Number(yyyymmdd.slice(6, 8));
        return new Date(y, m - 1, d);
    };

    const base = parse(endDate);

    // JS: 일=0, 월=1, ... 토=6
    const dayOfWeek = base.getDay();

    // 이번 주 일요일
    const thisSunday = new Date(base);
    thisSunday.setDate(base.getDate() - dayOfWeek);

    // 지난 주 일요일
    const lastSunday = new Date(thisSunday);
    lastSunday.setDate(thisSunday.getDate() - 7);

    // 지난 주 토요일
    const lastSaturday = new Date(lastSunday);
    lastSaturday.setDate(lastSunday.getDate() + 6);

    const format = (date) =>
        date.getFullYear().toString() +
        String(date.getMonth() + 1).padStart(2, '0') +
        String(date.getDate()).padStart(2, '0');

    return {
        startDate: format(lastSunday),
        endDate: format(lastSaturday),
    };
}

/**
 * startDate~endDate(YYYYMMDD)가
 * 하나의 주(일~토)에 전부 포함되는지 판단
 *
 * @returns {boolean}
 */
function isWithinSingleWeek(startDate, endDate) {
    const isValid = (d) => /^\d{8}$/.test(d);
    if (!isValid(startDate) || !isValid(endDate)) {
        throw new Error('Invalid date format');
    }

    const parse = (d) => {
        const y = Number(d.slice(0, 4));
        const m = Number(d.slice(4, 6));
        const day = Number(d.slice(6, 8));
        const date = new Date(y, m - 1, day);
        date.setHours(0, 0, 0, 0);
        return date;
    };

    const s = parse(startDate);
    const e = parse(endDate);

    if (e < s) return false;

    // startDate가 속한 주의 일요일
    const sDow = s.getDay(); // 일=0
    const weekStart = new Date(s);
    weekStart.setDate(s.getDate() - sDow);

    // 같은 주의 토요일
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    return s >= weekStart && e <= weekEnd;
}

/**
 * YYYYMMDD 날짜가 "이번 주(일~토)"에 속하는지 판단
 *
 * @param {string} yyyymmdd - YYYYMMDD
 * @returns {boolean}
 */
function isInThisWeek(yyyymmdd) {
    if (!/^\d{8}$/.test(yyyymmdd)) {
        throw new Error(`Invalid date format: ${yyyymmdd}`);
    }

    const parse = (d) => {
        const y = Number(d.slice(0, 4));
        const m = Number(d.slice(4, 6));
        const day = Number(d.slice(6, 8));
        return new Date(y, m - 1, day);
    };

    const target = parse(yyyymmdd);
    const today = new Date();

    // 시간 제거 (날짜 비교용)
    target.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    // JS 기준: 일=0, 월=1, ... 토=6
    const todayDow = today.getDay();

    // 이번 주 일요일
    const thisSunday = new Date(today);
    thisSunday.setDate(today.getDate() - todayDow);

    // 이번 주 토요일
    const thisSaturday = new Date(thisSunday);
    thisSaturday.setDate(thisSunday.getDate() + 6);

    return target >= thisSunday && target <= thisSaturday;
}

module.exports = async (ctx, src, packet, listener) => {
    const { log, utils, modules } = ctx;
    const tid = packet?.hd?.tid || `${Date.now()}`;
    const op = 'POST /stat/get-boiler-setting-temp -';
    const lhd = `[${src}:${tid}] ${op}`;
    log.info(`${lhd} >> start get boiler setting temp`);

    // define params
    // list
    /*
     * startDate : {number}
     * endDate : {string}
     * serialNum : {string}
     */
    const {
        startDate,
        endDate,
        serialNum,
    } = packet.dt;

    if (!startDate || !endDate || !serialNum) {
        log.warn(`${lhd} << failed get boiler setting temp. invalid params. startDate=[${startDate}], endDate=[${endDate}], serialNum=[${serialNum}]`);
        return modules.ckpush4.makeResponse('wrong_request', null, tid);
    }

    let startDt = `${startDate}000000`;
    let endDt = `${endDate}235959`;

    let queryInfo;
    try {
        queryInfo = await utils.postgresql.query('stat', `
            SELECT
                avg(value::numeric) FILTER (WHERE data_type='HEATING_ROOM_TEMP_AVG') AS heat_room_temp_avg,
                avg(value::numeric) FILTER (WHERE data_type='HEATING_FLOOR_TEMP_AVG') AS heat_floor_temp_avg,
                avg((value::numeric + coalesce(fvalue,0)::numeric/10))
                    FILTER (WHERE data_type='HOT_WATER_TEMP_AVG') AS hot_water_tmp_avg
            FROM public.tbl_stat_src2
            WHERE serial_num = $1
              AND stat_date >= $2
              AND stat_date <= $3
              AND data_type IN ('HEATING_ROOM_TEMP_AVG', 'HEATING_FLOOR_TEMP_AVG', 'HOT_WATER_TEMP_AVG');
        `, [serialNum, startDt, endDt], lhd);
    } catch (error) {
        log.error(`${lhd} failed to get boiler setting temp avg. error: ${error.message}`);
        return modules.ckpush4.makeResponse('failed', null, tid);
    }

    if (!queryInfo.succ) {
        log.warn(`${lhd} << failed get boiler setting temp avg. failed to query stat data. err=[${queryInfo.err}]`);
        return modules.ckpush4.makeResponse('failed', null, tid);
    }

    log.debug(`${lhd} query result [${JSON.stringify(queryInfo)}]`);

    const { heat_room_temp_avg, heat_floor_temp_avg, hot_water_tmp_avg } = queryInfo.data.rows[0];

    try {
        queryInfo = await utils.postgresql.query('history', `
            SELECT group_type_cd FROM public.tbl_device
                WHERE serial_num = $1 ORDER BY id DESC LIMIT 1;
        `, [serialNum], lhd);
    } catch (error) {
        log.error(`${lhd} failed to get boiler setting temp avg. error: ${error.message}`);
        return modules.ckpush4.makeResponse('failed', null, tid);
    }

    if (!queryInfo.succ) {
        log.warn(`${lhd} << failed get boiler setting temp avg. failed to query device model data. err=[${queryInfo.err}]`);
        return modules.ckpush4.makeResponse('failed', null, tid);
    }

    log.debug(`${lhd} query result [${JSON.stringify(queryInfo)}]`);

    const { group_type_cd } = queryInfo.data.rows[0];

    // 실온 온도 min, max
    const roomMin = 5;
    const roomMax = 40;

    // 온돌 온도 min, max
    let floorMin = 35, floorMax = 85;
    if (['04', '05', '06', '0b', '0c', '21', '24', '25', '31', '33', '28', '29', '35', '37', '39', '0e', '2b', '40', '41', '42'].includes(group_type_cd)) {
        floorMin = 35;
        floorMax = 85;
    } else if (['00', '01', '02', '03', '07', '08', '09', '0a', '20', '22', '23', '30', '32', '26', '27', '34', '36', '38', '2a'].includes(group_type_cd)) {
        floorMin = 40;
        floorMax = 85;
    }

    // 온수 온도 min, max
    let waterMin = 30, waterMax = 60;
    if (['06', '29', '39', '42', '04', '05', '0c', '21', '25', '31', '33', '2b', '28', '35', '37', '40', '41'].includes(group_type_cd)) {
        waterMin = 30;
        waterMax = 60;
    } else if (['03', '27', '38', '00', '01', '02', '0a', '20', '30', '23', '32', '0e', '2a', '26', '34', '36'].includes(group_type_cd)) {
        waterMin = 35;
        waterMax = 60;
    } else if (['07', '08', '09', '0b', '22', '24', '0e'].includes(group_type_cd)) {
        waterMin = 0;
        waterMax = 3;
    }

    const judgementRoom = Number(heat_room_temp_avg) == null ? '' : (Number(heat_room_temp_avg) >= 30 ? '많이 높아요!' : Number(heat_room_temp_avg) >= 25 ? '조금 높아요!' : '적당해요!');
    const judgementFloor = Number(heat_floor_temp_avg) == null ? '' : (Number(heat_floor_temp_avg) >= 70 ? '많이 높아요!' : Number(heat_floor_temp_avg) >= 60 ? '조금 높아요!' : '적당해요!');
    const judgementHotWater =  Number(hot_water_tmp_avg) > 3 ? ( Number(hot_water_tmp_avg) >= 50 ? '많이 높아요!' :  Number(hot_water_tmp_avg) >= 40 ? '조금 높아요!' : '적당해요!') : '';

    const gaugeRoom = heat_room_temp_avg == null ? 0 : Math.round( (Number(heat_room_temp_avg) - roomMin) / (roomMax - roomMin) * 100 );
    const gaugeFloor = heat_floor_temp_avg == null ? 0 : Math.round( (Number(heat_floor_temp_avg) - floorMin) / (floorMax - floorMin) * 100 );

    log.debug(`${lhd} hot_water_tmp_avg=[${hot_water_tmp_avg}], waterMin=[${waterMin}], waterMax=[${waterMax}]`);
    const gaugeHotWater = Math.round( (Number(hot_water_tmp_avg) - waterMin) / (waterMax - waterMin) * 100 );

    const output = {
        heatingRoom: {
            title: "난방(실내) 평균",
            subtitle: "사용 온도는",
            temperature: heat_room_temp_avg == null ? '기록이 없어요!' : `${Number(heat_room_temp_avg).toFixed(1)}°C`,
            status: `${judgementRoom}`,
            gaugeValue: gaugeRoom
        },
        heatingFloor: {
            title: "난방(온돌) 평균",
            subtitle: "사용 온도는",
            temperature: heat_floor_temp_avg == null ? '기록이 없어요!' : `${Number(heat_floor_temp_avg).toFixed(1)}°C`,
            status: `${judgementFloor}`,
            gaugeValue: gaugeFloor
        },
        hotWater: {
            title: "온수 평균",
            subtitle: "사용 온도는",
            temperature: hot_water_tmp_avg == null ? '기록이 없어요!' : Number(hot_water_tmp_avg) > 3 ? `${Number(hot_water_tmp_avg).toFixed(1)}°C` : `${Math.floor(Number(hot_water_tmp_avg))}단`,
            status: `${judgementHotWater}`,
            gaugeValue: gaugeHotWater
        }
    };

    log.info(`${lhd} << complete get boiler setting temp`);
    return modules.ckpush4.makeResponse('success', output, tid);
};
