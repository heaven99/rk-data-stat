function getMonthWeekRange(year, month, week) {
    // month: 1~12
    const firstDayOfMonth = new Date(year, month - 1, 1);

    // 해당 월의 첫 주 일요일 찾기
    const firstSunday = new Date(firstDayOfMonth);
    firstSunday.setDate(
        firstDayOfMonth.getDate() - firstDayOfMonth.getDay()
    );

    // week 번째 주의 시작(일)과 끝(토)
    const startDate = new Date(firstSunday);
    startDate.setDate(firstSunday.getDate() + (week - 1) * 7);

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    const format = (d) =>
        `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;

    return [format(startDate), format(endDate)];
}

function dayFormatter (yyyymmdd) {
    return yyyymmdd.slice(0, 4) + '-' + yyyymmdd.slice(4, 6) + '-' + yyyymmdd.slice(6, 8) + ' 00:00:00';
}

function getCalendarMonthRange(year, month) {
    // month: 1~12
    const firstOfMonth = new Date(year, month - 1, 1);
    const lastOfMonth = new Date(year, month, 0); // 다음달 0일 = 이번달 마지막날

    // 달력상 맨 앞(그 달이 속한 첫 주의 일요일)
    const start = new Date(firstOfMonth);
    start.setDate(firstOfMonth.getDate() - firstOfMonth.getDay()); // day: 0(일)~6(토)

    // 달력상 맨 뒤(그 달이 속한 마지막 주의 토요일)
    const end = new Date(lastOfMonth);
    end.setDate(lastOfMonth.getDate() + (6 - lastOfMonth.getDay()));

    const format = (d) =>
        `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;

    return [format(start), format(end)];
}

function getLastWeekOfMonth(year, month) {
    // 해당 월 1일
    const firstDay = new Date(year, month - 1, 1);
    // 해당 월 마지막 날
    const lastDay = new Date(year, month, 0);

    // 1일이 속한 주의 일요일
    const firstWeekStart = new Date(firstDay);
    firstWeekStart.setDate(firstDay.getDate() - firstDay.getDay());

    // 마지막 날이 속한 주의 토요일
    const lastWeekEnd = new Date(lastDay);
    lastWeekEnd.setDate(lastDay.getDate() + (6 - lastDay.getDay()));

    // 주 단위 차이 계산
    const diffDays = (lastWeekEnd - firstWeekStart) / (1000 * 60 * 60 * 24);

    return Math.floor(diffDays / 7) + 1;
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
    const op = 'POST /stat/get-boiler-combustion/week -';
    const lhd = `[${src}:${tid}] ${op}`;
    log.info(`${lhd} >> start get boiler combustion week`);

    // define params
    // list
    /*
     * month : {number}
     * week : {number}
     * year : {number}
     * deviceId : {string}
     */
    const {
        week,
        month,
        deviceId,
        year,
        devMode,   // ✅ 추가
    } = packet.dt;

    if (!deviceId || !year || !month || !week) {
        log.warn(`${lhd} << failed get boiler combustion. invalid params. week=[${week}], month=[${month}], year=[${year}], deviceId=[${deviceId}]`);
        return modules.ckpush4.makeResponse('wrong_request', null, tid);
    }

    const [startDate, endDate] = getMonthWeekRange(year, month, week);
    const [calendarStartDate, calendarEndDate] = getCalendarMonthRange(year, month);

    let startDt = `${startDate}000000`;
    let endDt = `${endDate}235959`;

    let lwStart = getLastWeekRange(startDate, endDate).startDate;
    let lwEnd = getLastWeekRange(startDate, endDate).endDate;

    let lastWeekStartDt = `${lwStart}000000`;
    let lastWeekEndDt = `${lwEnd}235959`;

    // =========================================================
    // ✅ devMode=true면 "기간별로 다르게" + "동일 input이면 동일 output" mock
    // =========================================================
    if (devMode === true) {
        const parseYmd = (yyyymmdd) => {
            const y = Number(yyyymmdd.slice(0, 4));
            const m = Number(yyyymmdd.slice(4, 6));
            const d = Number(yyyymmdd.slice(6, 8));
            return new Date(y, m - 1, d);
        };

        const formatYmd = (d) =>
            d.getFullYear().toString() +
            String(d.getMonth() + 1).padStart(2, '0') +
            String(d.getDate()).padStart(2, '0');

        // ---- 1) seed 만들기 (입력값만 사용) ----
        // (같은 input -> 같은 seed -> 같은 결과)
        const seedStr = [
            String(deviceId || ''),
            String(year),
            String(month),
            String(week),
            String(startDate),
            String(endDate),
        ].join('|');

        // 간단한 문자열 해시 (FNV-1a 32bit)
        const hash32 = (str) => {
            let h = 2166136261;
            for (let i = 0; i < str.length; i += 1) {
                h ^= str.charCodeAt(i);
                // h *= 16777619 (32bit overflow)
                h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
            }
            return h >>> 0;
        };

        // 결정적 PRNG: mulberry32
        const mulberry32 = (a) => function () {
            let t = (a += 0x6D2B79F5);
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };

        const seed = hash32(seedStr);
        const rand = mulberry32(seed);

        // 정수/실수 유틸
        const randInt = (min, max) => Math.floor(rand() * (max - min + 1)) + min;
        const randFloat = (min, max) => rand() * (max - min) + min;

        // ---- 2) "기간별 패턴" 파라미터를 seed 기반으로 고정 ----
        // 주차마다 다르게 보이도록 amplitude/trend/base를 seed로 결정
        const baseHeat = randInt(5, 40);          // 난방 기본치
        const baseHot = randInt(3, 25);           // 온수 기본치
        const ampHeat = randInt(5, 35);           // 난방 변동폭
        const ampHot = randInt(3, 20);            // 온수 변동폭
        const trendHeat = randFloat(-3, 3);       // 주간 추세(증가/감소)
        const trendHot = randFloat(-2, 2);

        // 요일별 가중치(일~토)도 seed로 고정
        const weekdayW = [];
        for (let i = 0; i < 7; i += 1) {
            weekdayW.push(randFloat(0.8, 1.25));
        }

        // ---- 3) 7일치 생성 (일~토) ----
        const s = parseYmd(startDate);

        const dates = [];
        const heating = [];
        const hotWater = [];

        // 7일치 mock 생성 (일~토)
        for (let i = 0; i < 7; i += 1) {
            const dd = new Date(s);
            dd.setDate(s.getDate() + i);
            const ymd = formatYmd(dd);

            dates.push(dayFormatter(ymd));

            // 사인파 + 요일 가중 + 추세 + 약간의 noise (모두 seed 기반 rand)
            const phase = (i / 7) * Math.PI * 2;
            const noiseHeat = randFloat(-3, 3);
            const noiseHot = randFloat(-2, 2);

            let heatVal = (baseHeat + ampHeat * (0.5 + 0.5 * Math.sin(phase)) + trendHeat * i + noiseHeat) * weekdayW[i];
            let hotVal = (baseHot + ampHot * (0.5 + 0.5 * Math.cos(phase)) + trendHot * i + noiseHot) * weekdayW[i];

            // 음수 방지 + 소수점 처리(너희 쿼리는 sum(value)이니까 정수로 내려도 OK)
            heatVal = Math.max(0, Math.round(heatVal));
            hotVal = Math.max(0, Math.round(hotVal));

            heating.push(heatVal);
            hotWater.push(hotVal);
        }

        const total = heating.reduce((a, b) => a + b, 0) + hotWater.reduce((a, b) => a + b, 0);

        const output = {
            dates,
            heating,
            hotWater,
            total,
            // devMode에서는 비교 기준이 없으니 그냥 "증가" 카드로 고정하거나
            // endDate가 이번 주면 8/9/10 중 하나, 아니면 11/12/13 중 하나로 고정
            cardType: isInThisWeek(endDate) ? 8 : 11,
            // 디버깅 필요하면 아래 주석 해제
            // _mockSeed: seed,
            // _mockKey: seedStr,
        };

        log.info(`${lhd} << complete get boiler combustion (devMode seeded mock). range=[${startDate}~${endDate}] seed=[${seed}]`);
        return modules.ckpush4.makeResponse('success', output, tid);
    }

    // =========================================================
    // ✅ 아래는 기존 로직 그대로 (DB 조회)
    // =========================================================
    let queryInfo;
    try {
        queryInfo = await utils.postgresql.query('stat', `
            SELECT
                substring(stat_date, 1, 8) AS yyyymmdd,

                -- 1) HEAT_COMBUSTION (시간 누적) : value 합
                sum(value) FILTER (WHERE data_type = 'HEATING_COMBUSTION') AS heat_combustion_sum,

                -- 2) HOT_WATER_COMBUSTION (시간 누적) : value 합
                sum(value) FILTER (WHERE data_type = 'HOT_WATER_COMBUSTION') AS hot_water_combustion_sum
            FROM public.tbl_stat_src
            WHERE serial_num = $1
              AND stat_date >= $2
              AND stat_date <= $3
              AND data_type IN ('HEATING_COMBUSTION', 'HOT_WATER_COMBUSTION')
            GROUP BY substring(stat_date, 1, 8)
            ORDER BY yyyymmdd;
        `, [deviceId, startDt, endDt], lhd);
    } catch (error) {
        log.error(`${lhd} failed to get boiler combustion. error: ${error.message}`);
        return modules.ckpush4.makeResponse('failed', null, tid);
    }

    if (!queryInfo.succ) {
        log.warn(`${lhd} << failed get boiler combustion. failed to query stat data. err=[${queryInfo.err}]`);
        return modules.ckpush4.makeResponse('failed', null, tid);
    }

    log.debug(`${lhd} query result [${JSON.stringify(queryInfo)}]`);

    const dates = [];
    const heating = [];
    const hotWater = [];
    for (let i = 0; i < queryInfo.data.rows.length; i += 1) {
        const { yyyymmdd, heat_combustion_sum, hot_water_combustion_sum } = queryInfo.data.rows[i];
        dates.push(dayFormatter(yyyymmdd));
        heating.push(heat_combustion_sum);
        hotWater.push(hot_water_combustion_sum);
    }

    const output = {
        dates,
        heating,
        hotWater,
    };

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
                    ) AS target_week_total,
                
                    -- 월 전체
                    sum(value) FILTER (
                    WHERE stat_date >= $5
                    AND stat_date <= $6
                    ) AS monthly_total

                FROM public.tbl_stat_src
                WHERE serial_num = $7
                  AND data_type IN ('HEATING_COMBUSTION', 'HOT_WATER_COMBUSTION');
        `, [lastWeekStartDt, lastWeekEndDt, startDt, endDt, `${calendarStartDate}000000`, `${calendarEndDate}235959`, deviceId], lhd);
    } catch (error) {
        log.error(`${lhd} failed to get boiler total combustion. error: ${error.message}`);
        return modules.ckpush4.makeResponse('failed', null, tid);
    }

    if (!queryInfo.succ) {
        log.warn(`${lhd} << failed get boiler total combustion. failed to query stat data. err=[${queryInfo.err}]`);
        return modules.ckpush4.makeResponse('failed', null, tid);
    }

    const { last_week_total, target_week_total, monthly_total } = queryInfo.data.rows[0];
    if (isInThisWeek(endDate)) {
        output.cardType = target_week_total > last_week_total ? 8
            : target_week_total === last_week_total ? 10 : 9;
    } else {
        const avg = monthly_total / getLastWeekOfMonth(year, month);
        output.cardType = target_week_total > avg ? 11
            : target_week_total === avg ? 13 : 12;
    }

    output.total = target_week_total;

    log.info(`${lhd} << complete get boiler combustion`);
    return modules.ckpush4.makeResponse('success', output, tid);
};
