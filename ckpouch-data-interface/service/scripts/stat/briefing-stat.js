module.exports = async (ctx, src, packet, listener) => {
    const { log, utils, modules } = ctx;
    const tid = packet?.hd?.tid || `${Date.now()}`;
    const op = 'POST /aiot/stat/get-briefing-stat';
    const lhd = `[${src}:${tid}] ${op} -`;

    if (listener.interface !== 'http') {
        return { ckError: 'E001', ckMessage: 'Not supported interface' };
    }

    const { serialNum, startYmd, endYmd, lastStartYmd, lastEndYmd } = packet.dt || {};

    if (!serialNum || !startYmd || !endYmd) {
        log.warn(`${lhd} << failed. missing required params. serialNum=[${serialNum}] startYmd=[${startYmd}] endYmd=[${endYmd}]`);
        return modules.ckpush4.makeResponse('wrong_request', null, tid);
    }

    const startStr = `${startYmd}000000`;
    const endStr   = `${endYmd}235959`;

    log.info(`${lhd} >> start. serialNum=[${serialNum}] range=[${startYmd}~${endYmd}]`);

    // 1) 시간대별 연소 합계 (차트용)
    let chartQueryInfo;
    try {
        chartQueryInfo = await utils.postgresql.query('stat', `
            SELECT
                substring(stat_date, 9, 2)   AS hh,
                sum(value)                    AS total_value
            FROM public.tbl_stat_src
            WHERE serial_num = $1
              AND stat_date  >= $2
              AND stat_date  <= $3
              AND data_type  IN ('HEATING_COMBUSTION', 'HOT_WATER_COMBUSTION')
            GROUP BY substring(stat_date, 9, 2)
            ORDER BY hh
        `, [serialNum, startStr, endStr], lhd);
    } catch (e) {
        log.error(`${lhd} failed chart query. error: ${e.message}`);
        return modules.ckpush4.makeResponse('failed', null, tid);
    }
    if (!chartQueryInfo.succ) {
        log.warn(`${lhd} << failed chart query. err=[${chartQueryInfo.err}]`);
        return modules.ckpush4.makeResponse('failed', null, tid);
    }

    // 2) 가스 사용량 합계
    let gasQueryInfo;
    try {
        gasQueryInfo = await utils.postgresql.query('stat', `
            SELECT
                sum(value) FILTER (WHERE data_type = 'HEATING_GAS_USAGE')   AS heating_gas,
                sum(value) FILTER (WHERE data_type = 'HOT_WATER_GAS_USAGE') AS hotwater_gas
            FROM public.tbl_stat_src
            WHERE serial_num = $1
              AND stat_date  >= $2
              AND stat_date  <= $3
              AND data_type  IN ('HEATING_GAS_USAGE', 'HOT_WATER_GAS_USAGE')
        `, [serialNum, startStr, endStr], lhd);
    } catch (e) {
        log.error(`${lhd} failed gas query. error: ${e.message}`);
        return modules.ckpush4.makeResponse('failed', null, tid);
    }
    if (!gasQueryInfo.succ) {
        log.warn(`${lhd} << failed gas query. err=[${gasQueryInfo.err}]`);
        return modules.ckpush4.makeResponse('failed', null, tid);
    }

    // 3) 온도 평균
    let tempQueryInfo;
    try {
        tempQueryInfo = await utils.postgresql.query('stat', `
            SELECT
                round(avg(value) FILTER (WHERE data_type = 'HEATING_ROOM_TEMP_AVG'),  1) AS room_avg,
                round(avg(value) FILTER (WHERE data_type = 'HEATING_FLOOR_TEMP_AVG'), 1) AS floor_avg,
                round(avg(value) FILTER (WHERE data_type = 'HOT_WATER_TEMP_AVG'),     1) AS hotwater_avg
            FROM public.tbl_stat_src
            WHERE serial_num = $1
              AND stat_date  >= $2
              AND stat_date  <= $3
              AND data_type  IN ('HEATING_ROOM_TEMP_AVG', 'HEATING_FLOOR_TEMP_AVG', 'HOT_WATER_TEMP_AVG')
        `, [serialNum, startStr, endStr], lhd);
    } catch (e) {
        log.error(`${lhd} failed temp query. error: ${e.message}`);
        return modules.ckpush4.makeResponse('failed', null, tid);
    }
    if (!tempQueryInfo.succ) {
        log.warn(`${lhd} << failed temp query. err=[${tempQueryInfo.err}]`);
        return modules.ckpush4.makeResponse('failed', null, tid);
    }

    const output = {
        chartRows:    chartQueryInfo.data.rows,
        gasUsage:     gasQueryInfo.data.rows[0]  || {},
        tempAvg:      tempQueryInfo.data.rows[0] || {},
    };

    // 4) 지난 주 가스 (optional — lastStartYmd/lastEndYmd 있을 때만)
    if (lastStartYmd && lastEndYmd) {
        let lastGasQueryInfo;
        try {
            lastGasQueryInfo = await utils.postgresql.query('stat', `
                SELECT
                    sum(value) FILTER (WHERE data_type = 'HEATING_GAS_USAGE')   AS heating_gas,
                    sum(value) FILTER (WHERE data_type = 'HOT_WATER_GAS_USAGE') AS hotwater_gas
                FROM public.tbl_stat_src
                WHERE serial_num = $1
                  AND stat_date  >= $2
                  AND stat_date  <= $3
                  AND data_type  IN ('HEATING_GAS_USAGE', 'HOT_WATER_GAS_USAGE')
            `, [serialNum, `${lastStartYmd}000000`, `${lastEndYmd}235959`], lhd);
        } catch (e) {
            log.warn(`${lhd} lastWeekGas query failed (non-fatal). error: ${e.message}`);
        }
        if (lastGasQueryInfo?.succ) {
            output.lastWeekGasUsage = lastGasQueryInfo.data.rows[0] || {};
        }
    }

    log.info(`${lhd} << complete`);
    return modules.ckpush4.makeResponse('success', output, tid);
};
