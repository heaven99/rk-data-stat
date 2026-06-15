module.exports = async (ctx, src, packet, listener) => {
    const { log, utils, modules } = ctx;
    const tid = packet?.hd?.tid || `${Date.now()}`;
    const op = 'POST /aiot/energy/get-energy-monthly';
    const lhd = `[${src}:${tid}] ${op} -`;

    if (listener.interface !== 'http') {
        return { ckError: 'E001', ckMessage: 'Not supported interface' };
    }

    const { serialNum, lastMonthStart, thisMonthStart } = packet.dt || {};

    if (!serialNum || !lastMonthStart || !thisMonthStart) {
        log.warn(`${lhd} << failed. missing required params. serialNum=[${serialNum}] lastMonthStart=[${lastMonthStart}] thisMonthStart=[${thisMonthStart}]`);
        return modules.ckpush4.makeResponse('wrong_request', null, tid);
    }

    // '2026-06-01 00:00:00' → '20260601000000'
    const toStatDate = (ts) => ts.replace(/[-: ]/g, '');
    const lastMonthStr = toStatDate(lastMonthStart);
    const thisMonthStr = toStatDate(thisMonthStart);

    log.info(`${lhd} >> start. serialNum=[${serialNum}] lastMonth=[${lastMonthStr}] thisMonth=[${thisMonthStr}]`);

    let queryInfo;
    try {
        queryInfo = await utils.postgresql.query('stat', `
            SELECT
                sum(value) FILTER (WHERE stat_date >= $2 AND stat_date < $3 AND data_type = 'HEATING_GAS_USAGE')    AS last_heating_gas,
                sum(value) FILTER (WHERE stat_date >= $2 AND stat_date < $3 AND data_type = 'HOT_WATER_GAS_USAGE')  AS last_hotwater_gas,
                sum(value) FILTER (WHERE stat_date >= $2 AND stat_date < $3 AND data_type = 'HEATING_COMBUSTION')   AS last_heating_comb,
                sum(value) FILTER (WHERE stat_date >= $2 AND stat_date < $3 AND data_type = 'HOT_WATER_COMBUSTION') AS last_hotwater_comb,
                sum(value) FILTER (WHERE stat_date >= $3 AND data_type = 'HEATING_GAS_USAGE')                       AS this_heating_gas,
                sum(value) FILTER (WHERE stat_date >= $3 AND data_type = 'HOT_WATER_GAS_USAGE')                     AS this_hotwater_gas,
                sum(value) FILTER (WHERE stat_date >= $3 AND data_type = 'HEATING_COMBUSTION')                      AS this_heating_comb,
                sum(value) FILTER (WHERE stat_date >= $3 AND data_type = 'HOT_WATER_COMBUSTION')                    AS this_hotwater_comb
            FROM public.tbl_stat_src
            WHERE serial_num = $1
              AND stat_date  >= $2
              AND data_type  IN ('HEATING_GAS_USAGE', 'HOT_WATER_GAS_USAGE', 'HEATING_COMBUSTION', 'HOT_WATER_COMBUSTION')
        `, [serialNum, lastMonthStr, thisMonthStr], lhd);
    } catch (e) {
        log.error(`${lhd} failed query. error: ${e.message}`);
        return modules.ckpush4.makeResponse('failed', null, tid);
    }

    if (!queryInfo.succ) {
        log.warn(`${lhd} << failed query. err=[${queryInfo.err}]`);
        return modules.ckpush4.makeResponse('failed', null, tid);
    }

    const row = queryInfo.data.rows[0] || {};
    const toInt = (v) => Number(v) || 0;

    const output = {
        lastMonth: {
            gas:        toInt(row.last_heating_gas)  + toInt(row.last_hotwater_gas),
            combustion: toInt(row.last_heating_comb) + toInt(row.last_hotwater_comb),
        },
        thisMonth: {
            gas:        toInt(row.this_heating_gas)  + toInt(row.this_hotwater_gas),
            combustion: toInt(row.this_heating_comb) + toInt(row.this_hotwater_comb),
        },
    };

    log.info(`${lhd} << complete. lastGas=[${output.lastMonth.gas}] lastCombustion=[${output.lastMonth.combustion}] thisGas=[${output.thisMonth.gas}] thisCombustion=[${output.thisMonth.combustion}]`);
    return modules.ckpush4.makeResponse('success', output, tid);
};
