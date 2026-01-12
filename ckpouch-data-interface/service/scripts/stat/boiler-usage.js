const sUtils = {
    /**
     * Date 객체를 YYYYMMDD 문자열로 변환
     * @param {Date} date
     * @returns {string} YYYYMMDD
     */
    formatDateYYYYMMDD: (date) => {
        if (!(date instanceof Date) || isNaN(date.getTime())) {
            throw new Error('Invalid Date object');
        }

        const yyyy = date.getFullYear();
        let mm = date.getMonth() + 1; // 0~11 → 1~12
        let dd = date.getDate();

        // node 8 호환 zero-padding
        if (mm < 10) mm = '0' + mm;
        if (dd < 10) dd = '0' + dd;

        return '' + yyyy + mm + dd;
    }

}

module.exports = async (ctx, src, packet, listener) => {
    const { log, utils, modules } = ctx;
    const tid = packet?.hd?.tid || `${Date.now()}`;
    const op = 'POST /stat/get-boiler-usage -';
    const lhd = `[${src}:${tid}] ${op}`;
    log.info(`${lhd} >> start get boiler usage`);

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
        log.warn(`${lhd} << failed get boiler usage. invalid params. startDate=[${startDate}], endDate=[${endDate}], serialNum=[${serialNum}]`);
        return modules.ckpush4.makeResponse('wrong_request', null, tid);
    }

    let queryInfo;
    try {
        queryInfo = await utils.postgresql.query('stat', `
            SELECT
                substring(stat_date, 9, 2) AS hh,
                sum(value) AS total_value
            FROM public.tbl_stat_src2
            WHERE serial_num = $1
              AND stat_date >= $2
              AND stat_date <= $3
              AND data_type  IN ('HOT_WATER_COMBUSTION', 'HEATING_COMBUSTION')
            GROUP BY substring(stat_date, 9, 2)
            ORDER BY hh;
        `, [serialNum, `${startDate}000000`, `${endDate}235959`], lhd);
    } catch (error) {
        log.error(`${lhd} failed to get boiler usage. error: ${error.message}`);
        return modules.ckpush4.makeResponse('failed', null, tid);
    }

    if (!queryInfo.succ) {
        log.warn(`${lhd} << failed get boiler usage. failed to query stat data. err=[${queryInfo.err}]`);
        return modules.ckpush4.makeResponse('failed', null, tid);
    }

    log.debug(`${lhd} query result [${JSON.stringify(queryInfo)}]`);

    // const hours = [];
    // const values = [];
    let maxhh = null;
    let maxVal = 0;
    const chartData = [];
    for (let i= 0; i < queryInfo.data.rows.length; i += 1) {
        const { hh, total_value } = queryInfo.data.rows[i];
        // hours.push(hh);
        // values.push(total_value);
        if (total_value > maxVal) {
            maxVal = total_value;
            maxhh =hh;
        }
        const ret = {
            hour: hh,
            value: total_value,
        }
        chartData.push(ret);
    }

    const output = {
        message: `${maxhh}시에 보일러를\n자주 사용했어요!`,
        chartData,
    };

    log.info(`${lhd} << complete get boiler usage`);
    return modules.ckpush4.makeResponse('success', output, tid);
};
