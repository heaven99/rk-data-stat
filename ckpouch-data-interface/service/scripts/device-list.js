// import dependencies
const fs = require('fs');

// script conf
const sConf = {
    SELECT_DEVICE_SYNC_HIS_COLUMNS: [
        'sync_date', 'file_path', 'expire_date', 'c_date',
    ],
    SELECT_DEVICE_SYNC_HIS_SORT: [
        { col: 'sync_date', dir: 'DESC' },
        { col: 'c_date',    dir: 'DESC' },
    ],
};

// script values
// const sValues = {};

// script state
// const sState = {};

// script utils
const sUtils = {
    /**
     * convert date format to Date object
     * @param {string} input YYYYMMDDHHmm formatted date string
     */
    convertDateFormatToDate: (input) => {
        const YYYY = parseInt(input.slice(0, 4), 10);
        const MM = parseInt(input.slice(4, 6), 10) - 1;
        const DD = parseInt(input.slice(6, 8), 10);
        const HH = parseInt(input.slice(8, 10), 10);
        const mm = parseInt(input.slice(10, 12), 10);
        return new Date(YYYY, MM, DD, HH, mm);
    },
};

module.exports = async (ctx, src, packet, listener) => {
    const { log, utils } = ctx;
    const tid = packet?.hd?.tid || `${Date.now()}`;
    const op = 'POST /api/device/list -';
    const lhd = `[${src}:${tid}] ${op}`;
    log.info(`${lhd} >> start list device. data [${JSON.stringify(packet.dt)}]`);

    // define variables
    const { res } = listener;
    const { filter } = packet.dt;
    const selectDeviceSyncHisFilter = [{ col: 'delete_date', op: 'IS', val: null }];

    // set filter
    if (filter.date && filter.date.length === 12) {
        const dateObj = sUtils.convertDateFormatToDate(filter.date);
        const dateStr = utils.timestampToString(dateObj.getTime(), 'YYYY-MM-DD HH:mm:ss');
        selectDeviceSyncHisFilter.push({ col: 'sync_date', op: '=', val: dateStr });
        log.debug(`${lhd} set filter date [${filter.date}] to [${dateStr}]`);
    }

    // select last sync date
    const selectDeviceSyncHisInfo = await utils.postgresql.select('history', null, 'tbl_device_sync_his', sConf.SELECT_DEVICE_SYNC_HIS_COLUMNS, selectDeviceSyncHisFilter, sConf.SELECT_DEVICE_SYNC_HIS_SORT, null, 0, 1, lhd);
    if (!selectDeviceSyncHisInfo.succ) {
        log.error(`${lhd} << failed list device. failed select device sync his. err [${selectDeviceSyncHisInfo.err}]`);
        return { result: 'FAIL', err: 'failed to select last sync date' };
    }
    log.debug(`${lhd} selected device sync his info [${JSON.stringify(selectDeviceSyncHisInfo)}]`);

    if (selectDeviceSyncHisInfo.data.length <= 0) {
        log.warn(`${lhd} << success list device with nothing. no data found`);
        return { result: 'OK', data: output };
    }

    const filePath = selectDeviceSyncHisInfo.data[0].file_path;

    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    const stream = fs.createReadStream(filePath);
    log.debug(`${lhd} check file path [${filePath}]`);

    stream.on('error', (err) => {
        log.error(`${lhd} file read error: ${err.message}`);
        res.status(500).json({ result: 'FAIL', err: 'file read error' });
    });

    stream.pipe(res);

    await new Promise((resolve) => {
        stream.on('end', () => {
            log.info(`${lhd} << complete file download`);
            resolve();
        });
    });
};
