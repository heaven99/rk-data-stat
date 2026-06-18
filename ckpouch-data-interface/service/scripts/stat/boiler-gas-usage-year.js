function dayFormatter (yyyymm) {
    return yyyymm.slice(0, 4) + '-' + yyyymm.slice(4, 6);
}

function isThisYear(year) {
    const currentYear = new Date().getFullYear();
    return Number(year) === currentYear;
}

module.exports = async (ctx, src, packet, listener) => {
    const { log, utils, modules } = ctx;
    const tid = packet?.hd?.tid || `${Date.now()}`;
    const op = 'POST /stat/get-boiler-gas-usage/year -';
    const lhd = `[${src}:${tid}] ${op}`;
    log.info(`${lhd} >> start get boiler gas usage year`);

    // define params
    // list
    /*
     * month : {number}
     * week : {number}
     * year : {number}
     * deviceId : {string}
     */
    const {
        deviceId,
        year,
        devMode, // ✅ 추가
    } = packet.dt;

    if (!deviceId || !year) {
        log.warn(`${lhd} << failed get boiler gas usage. invalid params. year=[${year}], deviceId=[${deviceId}]`);
        return modules.ckpush4.makeResponse('wrong_request', null, tid);
    }

    // =========================================================
    // ✅ devMode=true면 "연도별로 다르게" + "동일 input이면 동일 output" mock
    // =========================================================
    if (devMode === true) {
        // ---- 1) seed 만들기 (입력값만 사용) ----
        const seedStr = [
            String(deviceId || ''),
            String(year),
            'YEAR_GAS_USAGE',
        ].join('|');

        // FNV-1a 32bit
        const hash32 = (str) => {
            let h = 2166136261;
            for (let i = 0; i < str.length; i += 1) {
                h ^= str.charCodeAt(i);
                h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
            }
            return h >>> 0;
        };

        // mulberry32 PRNG
        const mulberry32 = (a) => function () {
            let t = (a += 0x6D2B79F5);
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };

        const seed = hash32(seedStr);
        const rand = mulberry32(seed);

        const randInt = (min, max) => Math.floor(rand() * (max - min + 1)) + min;
        const randFloat = (min, max) => rand() * (max - min) + min;

        // ---- 2) 연간 패턴 파라미터 (seed 기반 고정) ----
        // gas-usage는 combustion보다 "작은 스케일"이 자연스러워서 범위를 낮게 잡음
        const baseHeat = randInt(30, 120);     // 월 난방 가스 기본
        const baseHot = randInt(15, 70);       // 월 온수 가스 기본
        const ampHeat = randInt(20, 110);      // 난방 계절 변동폭
        const ampHot = randInt(10, 70);        // 온수 변동폭
        const noiseHeatAmp = randInt(3, 18);   // 월별 노이즈
        const noiseHotAmp = randInt(2, 14);

        // 연도/기기별 스케일
        const yearScale = randFloat(0.85, 1.25);

        // ---- 3) 12개월 생성 ----
        const months = [];
        const heating = [];
        const hotWater = [];

        // ✅ 올해면 현재월까지만 값 생성, 이후 월은 null 처리
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1; // 1~12

        for (let m = 1; m <= 12; m += 1) {
            const yyyymm = `${year}${String(m).padStart(2, '0')}`;
            months.push(dayFormatter(yyyymm));

            const isFutureMonth = (Number(year) === currentYear) && (m > currentMonth);

            // 미래 달(올해 기준)이면 값 채우지 않음
            if (isFutureMonth) {
                heating.push(null);
                hotWater.push(null);
                continue;
            }

            // 계절성(겨울↑): cos(0)=1이라 1월이 최대
            const theta = ((m - 1) / 12) * Math.PI * 2;

            const seasonHeat = (0.5 + 0.5 * Math.cos(theta));  // 0~1
            const seasonHot = (0.55 + 0.45 * Math.cos(theta)); // 조금 덜 흔들리게

            const noiseHeat = randFloat(-noiseHeatAmp, noiseHeatAmp);
            const noiseHot = randFloat(-noiseHotAmp, noiseHotAmp);

            let heatVal = (baseHeat + ampHeat * seasonHeat + noiseHeat) * yearScale;
            let hotVal = (baseHot + ampHot * seasonHot + noiseHot) * yearScale;

            heatVal = Math.max(0, Math.round(heatVal));
            hotVal = Math.max(0, Math.round(hotVal));

            heating.push(heatVal);
            hotWater.push(hotVal);
        }

        // ✅ total은 null 제외하고 합산
        const sumNonNull = (arr) =>
            arr.reduce((acc, v) => (typeof v === 'number' ? acc + v : acc), 0);

        const totalVal = sumNonNull(heating) + sumNonNull(hotWater);

        const output = {
            months,
            heating,
            hotWater,
            total: totalVal,
            cardType: isThisYear(year) ? 6 : 7,
            // 디버깅 필요하면 아래 주석 해제
            // _mockSeed: seed,
            // _mockKey: seedStr,
        };

        log.info(`${lhd} << complete get boiler gas usage year (devMode seeded mock). year=[${year}] seed=[${seed}]`);
        return modules.ckpush4.makeResponse('success', output, tid);
    }

    // =========================================================
    // ✅ 아래는 기존 로직 그대로 (DB 조회)
    // =========================================================
    const startDate = `${year}0101`;
    const endDate = `${year}1231`;

    let startDt = `${startDate}000000`;
    let endDt = `${endDate}235959`;

    let queryInfo;
    try {
        queryInfo = await utils.postgresql.query('stat', `
            SELECT
                substring(stat_date, 1, 6) AS yyyymm,

                -- 1) HEAT_GAS_USAGE (시간 누적) : value 합
                sum(value) FILTER (WHERE data_type = 'HEATING_GAS_USAGE') AS heat_gas_usage_sum,

                -- 2) HOT_WATER_GAS_USAGE (시간 누적) : value 합
                sum(value) FILTER (WHERE data_type = 'HOT_WATER_GAS_USAGE') AS hot_water_gas_usage_sum
            FROM public.tbl_stat_src
            WHERE serial_num = $1
              AND stat_date >= $2
              AND stat_date <= $3
              AND data_type IN ('HEATING_GAS_USAGE', 'HOT_WATER_GAS_USAGE')
            GROUP BY substring(stat_date, 1, 6)
            ORDER BY yyyymm;
        `, [deviceId, startDt, endDt], lhd);
    } catch (error) {
        log.error(`${lhd} failed to get boiler gas usage. error: ${error.message}`);
        return modules.ckpush4.makeResponse('failed', null, tid);
    }

    if (!queryInfo.succ) {
        log.warn(`${lhd} << failed get boiler gas usage. failed to query stat data. err=[${queryInfo.err}]`);
        return modules.ckpush4.makeResponse('failed', null, tid);
    }

    log.debug(`${lhd} query result [${JSON.stringify(queryInfo)}]`);

    const months = [];
    const heating = [];
    const hotWater = [];
    const total = [];

    for (let i = 0; i < queryInfo.data.rows.length; i += 1) {
        const { yyyymm, heat_gas_usage_sum, hot_water_gas_usage_sum } = queryInfo.data.rows[i];
        months.push(dayFormatter(yyyymm));
        heating.push(heat_gas_usage_sum ?? "0");
        hotWater.push(hot_water_gas_usage_sum ?? "0");
        total.push(Number(heat_gas_usage_sum) + Number(hot_water_gas_usage_sum));
    }

    const output = {
        months,
        heating,
        hotWater,
        total: total.reduce((acc, cur) => acc + cur, 0)
    };

    output.cardType = isThisYear(year) ? 6 : 7;

    log.info(`${lhd} << complete get boiler gas usage`);
    return modules.ckpush4.makeResponse('success', output, tid);
};
