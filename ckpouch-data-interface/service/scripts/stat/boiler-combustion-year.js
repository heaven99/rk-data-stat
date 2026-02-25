function dayFormatter (yyyymm) {
    return yyyymm.slice(0, 4) + '년 ' + yyyymm.slice(4, 6) + '월 ';
}

function isThisYear(year) {
    const currentYear = new Date().getFullYear();
    return Number(year) === currentYear;
}

module.exports = async (ctx, src, packet, listener) => {
    const { log, utils, modules } = ctx;
    const tid = packet?.hd?.tid || `${Date.now()}`;
    const op = 'POST /stat/get-boiler-combustion/year -';
    const lhd = `[${src}:${tid}] ${op}`;
    log.info(`${lhd} >> start get boiler combustion year`);

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
        log.warn(`${lhd} << failed get boiler combustion. invalid params. year=[${year}], deviceId=[${deviceId}]`);
        return modules.ckpush4.makeResponse('wrong_request', null, tid);
    }

    // =========================================================
    // ✅ devMode=true면 mock 내려주고 종료 (DB 조회 안 함)
    // =========================================================
    if (devMode === true) {
        const months = [];
        const heating = [];
        const hotWater = [];

        for (let m = 1; m <= 12; m += 1) {
            const yyyymm = `${year}${String(m).padStart(2, '0')}`;
            months.push(dayFormatter(yyyymm));

            // 보기 좋은 고정 mock (원하면 규칙 바꿔도 됨)
            // "sum(value)"라 숫자만
            heating.push(10 + m);           // 11..22
            hotWater.push(5 + (m % 4));     // 6,7,8,5 반복
        }

        const totalVal = heating.reduce((a, b) => a + b, 0) + hotWater.reduce((a, b) => a + b, 0);

        const output = {
            months,
            heating,
            hotWater,
            total: totalVal,
            cardType: isThisYear(year) ? 14 : 15,
        };

        log.info(`${lhd} << complete get boiler combustion year (devMode mock). year=[${year}]`);
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

                -- 1) HEAT_COMBUSTION (시간 누적) : value 합
                sum(value) FILTER (WHERE data_type = 'HEATING_COMBUSTION') AS heat_combustion_sum,

                -- 2) HOT_WATER_COMBUSTION (시간 누적) : value 합
                sum(value) FILTER (WHERE data_type = 'HOT_WATER_COMBUSTION') AS hot_water_combustion_sum
            FROM public.tbl_stat_src2
            WHERE serial_num = $1
              AND stat_date >= $2
              AND stat_date <= $3
              AND data_type IN ('HEATING_COMBUSTION', 'HOT_WATER_COMBUSTION')
            GROUP BY substring(stat_date, 1, 6)
            ORDER BY yyyymm;
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

    const months = [];
    const heating = [];
    const hotWater = [];
    const total = [];

    for (let i = 0; i < queryInfo.data.rows.length; i += 1) {
        const { yyyymm, heat_combustion_sum, hot_water_combustion_sum } = queryInfo.data.rows[i];
        months.push(dayFormatter(yyyymm));
        heating.push(heat_combustion_sum);
        hotWater.push(hot_water_combustion_sum);
        total.push(Number(heat_combustion_sum) + Number(hot_water_combustion_sum));
    }

    const output = {
        months,
        heating,
        hotWater,
        total: total.reduce((acc, cur) => acc + cur, 0)
    };

    output.cardType = isThisYear(year) ? 14 : 15;

    log.info(`${lhd} << complete get boiler combustion`);
    return modules.ckpush4.makeResponse('success', output, tid);
};
