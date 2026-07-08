module.exports = async (ctx, src, packet, listener) => {
    const { log, utils } = ctx;
    const tid = packet?.hd?.tid || `${Date.now()}`;
    const op = 'POST /aiot/energy/get-energy-monthly';
    const lhd = `[${src}:${tid}] ${op} -`;

    const { serialNum, lastMonthStart, thisMonthStart, lastMonthEnd, thisMonthEnd } = packet.dt || {};

    if (!serialNum || !lastMonthStart || !thisMonthStart) {
        log.warn(`${lhd} << failed. missing required params. serialNum=[${serialNum}] lastMonthStart=[${lastMonthStart}] thisMonthStart=[${thisMonthStart}]`);
        return { result: 'FAIL', err: 'missing required params' };
    }

    // '2026-06-01 00:00:00' → '20260601000000'
    const toStatDate = (ts) => ts.replace(/[-: ]/g, '');
    const lastStartStr = toStatDate(lastMonthStart);
    const thisStartStr = toStatDate(thisMonthStart);
    // 종료 시점(exclusive). 미지정 시 기존 동작 유지: 지난달 전체(=이번달 시작), 이번달 무제한
    const lastEndStr = toStatDate(lastMonthEnd || thisMonthStart);
    const thisEndStr = thisMonthEnd ? toStatDate(thisMonthEnd) : null;

    // 이번달 구간 상한(exclusive). 지정된 경우에만 조건 추가
    const params = [serialNum, lastStartStr, lastEndStr, thisStartStr];
    let thisUpper = '';
    if (thisEndStr) {
        params.push(thisEndStr);
        thisUpper = 'AND stat_date < $5';
    }

    log.info(`${lhd} >> start. serialNum=[${serialNum}] last=[${lastStartStr}~${lastEndStr}] this=[${thisStartStr}~${thisEndStr || '∞'}]`);

    let queryInfo;
    try {
        queryInfo = await utils.postgresql.query('stat', `
            SELECT
                sum(value) FILTER (WHERE stat_date >= $2 AND stat_date < $3 AND data_type = 'HEATING_GAS_USAGE')    AS last_heating_gas,
                sum(value) FILTER (WHERE stat_date >= $2 AND stat_date < $3 AND data_type = 'HOT_WATER_GAS_USAGE')  AS last_hotwater_gas,
                sum(value) FILTER (WHERE stat_date >= $2 AND stat_date < $3 AND data_type = 'HEATING_COMBUSTION')   AS last_heating_comb,
                sum(value) FILTER (WHERE stat_date >= $2 AND stat_date < $3 AND data_type = 'HOT_WATER_COMBUSTION') AS last_hotwater_comb,
                sum(value) FILTER (WHERE stat_date >= $4 ${thisUpper} AND data_type = 'HEATING_GAS_USAGE')          AS this_heating_gas,
                sum(value) FILTER (WHERE stat_date >= $4 ${thisUpper} AND data_type = 'HOT_WATER_GAS_USAGE')        AS this_hotwater_gas,
                sum(value) FILTER (WHERE stat_date >= $4 ${thisUpper} AND data_type = 'HEATING_COMBUSTION')         AS this_heating_comb,
                sum(value) FILTER (WHERE stat_date >= $4 ${thisUpper} AND data_type = 'HOT_WATER_COMBUSTION')       AS this_hotwater_comb
            FROM public.tbl_stat_src
            WHERE serial_num = $1
              AND stat_date  >= $2
              AND data_type  IN ('HEATING_GAS_USAGE', 'HOT_WATER_GAS_USAGE', 'HEATING_COMBUSTION', 'HOT_WATER_COMBUSTION')
        `, params, lhd);
    } catch (e) {
        log.error(`${lhd} failed query. error: ${e.message}`);
        return { result: 'FAIL', err: e.message };
    }

    if (!queryInfo.succ) {
        log.warn(`${lhd} << failed query. err=[${queryInfo.err}]`);
        return { result: 'FAIL', err: queryInfo.err };
    }

    const row = queryInfo.data.rows[0] || {};
    const toInt = (v) => Number(v) || 0;

    const data = {
        lastMonth: {
            gas:        toInt(row.last_heating_gas)  + toInt(row.last_hotwater_gas),
            combustion: toInt(row.last_heating_comb) + toInt(row.last_hotwater_comb),
        },
        thisMonth: {
            gas:        toInt(row.this_heating_gas)  + toInt(row.this_hotwater_gas),
            combustion: toInt(row.this_heating_comb) + toInt(row.this_hotwater_comb),
        },
    };

    log.info(`${lhd} << complete. lastGas=[${data.lastMonth.gas}] lastCombustion=[${data.lastMonth.combustion}] thisGas=[${data.thisMonth.gas}] thisCombustion=[${data.thisMonth.combustion}]`);
    return { result: 'OK', data };
};
