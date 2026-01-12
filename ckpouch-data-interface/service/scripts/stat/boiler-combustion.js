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
    const op = 'POST /stat/get-boiler-combustion -';
    const lhd = `[${src}:${tid}] ${op}`;
    log.info(`${lhd} >> start get boiler combustion`);

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
        isYear = false,
    } = packet.dt;

    if (!startDate || !endDate || !serialNum) {
        log.warn(`${lhd} << failed get boiler combustion. invalid params. startDate=[${startDate}], endDate=[${endDate}], serialNum=[${serialNum}]`);
        return modules.ckpush4.makeResponse('wrong_request', null, tid);
    }

    // 연간 모드가 아닌데 8자리가 아니면 팅겨낸다.
    if (!isYear && (startDate.length !== 8 || endDate.length !== 8)) {
        log.warn(`${lhd} << failed get boiler combustion. invalid startDate format. startDate=[${startDate}]`);
        return modules.ckpush4.makeResponse('wrong_request', null, tid);
    }

    // 연간 모드가 아닌데 7주일치를 넘겨 조회하면 팅겨낸다.
    const days = diffDaysInclusive(startDate, endDate);
    if (!isYear && days > 7) {
        log.warn(`${lhd} << failed get boiler combustion. startDate and endDate must be within 7 days`);
        return modules.ckpush4.makeResponse('wrong_request', null, tid);
    }

    if (!isYear && !isWithinSingleWeek(startDate, endDate)) {
        log.warn(`${lhd} << failed get boiler combustion. startDate and endDate must be in single week`);
        return modules.ckpush4.makeResponse('wrong_request', null, tid);
    }

    // 연간 모드인데 length 가 YYYY가 아니면 팅겨냄
    if (isYear && (startDate.length !== 4 || endDate.length !== 4)) {
        log.warn(`${lhd} << failed get boiler combustion. invalid startDate format. startDate=[${startDate}]`);
        return modules.ckpush4.makeResponse('wrong_request', null, tid);
    }

    // 같은 년도를 조회하는게 아니면 팅겨낸다.
    if (isYear && startDate !== endDate) {
        log.warn(`${lhd} << failed get boiler combustion. startDate and endDate must be same year`);
        return modules.ckpush4.makeResponse('wrong_request', null, tid);
    }

    const subLength = isYear ? 6 : 8;

    let startDt = `${startDate}000000`;
    let endDt = `${endDate}235959`;

    let lastWeekStartDt = null;
    let lastWeekEndDt = null;
    if (!isYear) {

        let lwStart = getLastWeekRange(startDate, endDate).startDate;
        let lwEnd = getLastWeekRange(startDate, endDate).endDate;

        lastWeekStartDt = `${lwStart}000000`;
        lastWeekEndDt = `${lwEnd}235959`;
    }

    if (isYear) {
        startDt = `${startDate}0101000000`;
        endDt = `${endDate}1231235959`;
    }

    let queryInfo;
    try {
        queryInfo = await utils.postgresql.query('stat', `
            SELECT
                substring(stat_date, 1, ${subLength}) AS yyyymmdd,

                -- 1) HEAT_COMBUSTION (시간 누적) : value 합
                sum(value) FILTER (WHERE data_type = 'HEATING_COMBUSTION') AS heat_combustion_sum,

                -- 2) HOT_WATER_COMBUSTION (시간 누적) : value 합
                sum(value) FILTER (WHERE data_type = 'HOT_WATER_COMBUSTION') AS hot_water_combustion_sum
            FROM public.tbl_stat_src2
            WHERE serial_num = $1
              AND stat_date >= $2
              AND stat_date <= $3
              AND data_type IN ('HEATING_COMBUSTION', 'HOT_WATER_COMBUSTION')
            GROUP BY substring(stat_date, 1, ${subLength})
            ORDER BY yyyymmdd;
        `, [serialNum, startDt, endDt], lhd);
    } catch (error) {
        log.error(`${lhd} failed to get boiler combustion. error: ${error.message}`);
        return modules.ckpush4.makeResponse('failed', null, tid);
    }

    if (!queryInfo.succ) {
        log.warn(`${lhd} << failed get boiler combustion. failed to query stat data. err=[${queryInfo.err}]`);
        return modules.ckpush4.makeResponse('failed', null, tid);
    }

    log.debug(`${lhd} query result [${JSON.stringify(queryInfo)}]`);

    const chartData = [];
    for (let i= 0; i < queryInfo.data.rows.length; i += 1) {
        const { yyyymmdd, heat_combustion_sum, hot_water_combustion_sum } = queryInfo.data.rows[i];
        const ret = {
            ymd: yyyymmdd,
            heating: heat_combustion_sum,
            hotWater: hot_water_combustion_sum,
        }
        chartData.push(ret);
    }

    const output = {
        chartData,
    };

    // compare with last week
    if (!isYear) {
        try {
            queryInfo = await utils.postgresql.query('stat', `
                SELECT
                    -- 지난 주
                    sum(value) FILTER (
                    WHERE stat_date >= $1
                      AND stat_date <= $2
                    ) AS last_week_total,

                    -- 조회 기간
                    sum(value) FILTER (
                    WHERE stat_date >= $3
                      AND stat_date <= $4
                    ) AS target_week_total

                FROM public.tbl_stat_src2
                WHERE serial_num = $5
                  AND data_type IN ('HEATING_COMBUSTION', 'HOT_WATER_COMBUSTION');
        `, [lastWeekStartDt, lastWeekEndDt, startDt, endDt, serialNum], lhd);
        } catch (error) {
            log.error(`${lhd} failed to get boiler total combustion. error: ${error.message}`);
            return modules.ckpush4.makeResponse('failed', null, tid);
        }

        if (!queryInfo.succ) {
            log.warn(`${lhd} << failed get boiler total combustion. failed to query stat data. err=[${queryInfo.err}]`);
            return modules.ckpush4.makeResponse('failed', null, tid);
        }

        const { last_week_total, target_week_total } = queryInfo.data.rows[0];
        const ret = {
            title: isInThisWeek(endDate) ? "이번 주 전체 연소 시간" : "이 주의 전체 연소 시간은",
            message: last_week_total > target_week_total ? "지난 주 보다 줄었어요."
                : last_week_total === target_week_total ? "지난 주와 같아요." : "지난 주 보다 늘었어요.",
            lastWeekValue: last_week_total,
            thisWeekValue: target_week_total,
        }

        output.comparison = ret;
    }

    log.info(`${lhd} << complete get boiler combustion`);
    return modules.ckpush4.makeResponse('success', output, tid);
};
