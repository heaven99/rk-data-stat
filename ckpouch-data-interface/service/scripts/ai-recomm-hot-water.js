// import dependencies
// - no dependencies

// script conf
const sConf = {
    SELECT_DEVICE_SYNC_HIS_COLUMNS: [
        'sync_date', 'file_path', 'expire_date', 'c_date',
    ],
    SELECT_DEVICE_SYNC_HIS_SORT: [
        { col: 'sync_date', dir: 'DESC' },
        { col: 'c_date',    dir: 'DESC' },
    ],

    VALIDATION_META: [
        { key: ['filter', 'sn'],    required: true,  type: 'string', data: { length: 17 } },
    ],
};

// script values
const sValues = {
    DATE_FORMAT: 'YYYYMMDDHHmm',
    // DEFAULT_LIMIT: 100,
    // MAX_LIMIT: 10000,  // 최대 10,000개로 제한
    DEFAULT_LIMIT: Infinity,
    MAX_LIMIT: Infinity,  // 최대 10,000개로 제한

    ERR_CODE: {
        WRONG_REQUEST: 'E000005',
    },
};

// script state
// const sState = {};

// script utils
const sUtils = {
    /**
     * convert date format to Date object
     * @param {string} input YYYYMMDDHHmm formatted date string
     */
    convertDateFormatToDate: (input) => {
        const YYYY = Number.parseInt(input.slice(0, 4), 10);
        const MM = Number.parseInt(input.slice(4, 6), 10) - 1;
        const DD = Number.parseInt(input.slice(6, 8), 10);
        const HH = Number.parseInt(input.slice(8, 10), 10);
        const mm = Number.parseInt(input.slice(10, 12), 10);
        return new Date(YYYY, MM, DD, HH, mm);
    },
};

module.exports = async (ctx, src, packet, listener) => {
    const { log, utils } = ctx;
    const { res } = listener;
    const tid = packet?.hd?.tid || `${Date.now()}`;
    const op = 'POST /api/ai/recomm/hot-water -';
    const lhd = `[${src}:${tid}] ${op}`;
    log.info(`${lhd} >> start list ai recomm hot water. data [${JSON.stringify(packet.dt)}]`);

    // check auth
    const authHeader = listener.req.get('Authorization');

    if (authHeader !== 'abc') {
        log.warn(`${lhd} unauthorized access attempt with Authorization [${authHeader}]`);
        // return { result: 'FAIL', err: 'Unauthorized' };
    }

    // validate packet
    const validatePacketInfo = utils.validatePacket(sConf.VALIDATION_META, packet.dt);
    if (!validatePacketInfo.succ) {
        log.warn(`${lhd} << failed list ai recomm hot water. invalid packet.${validatePacketInfo.data.message ? ` ${validatePacketInfo.data.message}` : ''}`);
        return sUtils.makeCkpush4Response(sValues.ERR_CODE.WRONG_REQUEST, 'Wrong request', packet.hd.tid);
    }

    // define variables
    const { filter, fcstDate } = packet.dt;
    const { sn } = packet.dt.filter;
    const selectAnalysisFilter = [{ col: 'serial_num', op: '=', val: sn }];

    // set filter
    if (fcstDate) {
        selectAnalysisFilter.push({ col: 'forecast_date', op: 'LIKE', val: `${fcstDate}%` });
    }

    // select last sync date
    const selectAnalysisSort = [{ col: 'forecast_date', dir: 'DESC' }];
    const selectAnalysisInfo = await utils.postgresql.select('analysis', null, 'tbl_hotwater_forecast', null, selectAnalysisFilter, selectAnalysisSort, null, 0, 1, lhd);
    if (!selectAnalysisInfo.succ) {
        log.error(`${lhd} << failed list ai recomm hot water. failed select device sync his. err [${selectAnalysisInfo.err}]`);
        return { result: 'FAIL', err: 'failed to select last sync date' };
    }
    log.debug(`${lhd} selected device sync his info [${JSON.stringify(selectAnalysisInfo.data)}]`);

    if (selectAnalysisInfo.data.length <= 0) {
        log.warn(`${lhd} << success list list ai recomm hot water with nothing. no data found`);
        return { result: 'OK', date: 0, mode: -1, list: [] };
    }

    log.info(`${lhd} << list ai recomm hot water`);
    return {
        result: 'OK',
        date: Math.floor(sUtils.convertDateFormatToDate(selectAnalysisInfo.data[0].forecast_date).getTime() / 1000),
        mode: selectAnalysisInfo.data[0].heating_mode,
        list: selectAnalysisInfo.data[0].forecast_data,
        topSlots: selectAnalysisInfo.data[0].top_slots || [],
    };
};
