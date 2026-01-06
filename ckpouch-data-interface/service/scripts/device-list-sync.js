// import dependencies
const fs = require('fs');
const path = require('path');

// script conf
// const sConf = {};

// script values
const sValues = {
    DATE_FORMAT: 'YYYYMMDDHHmm',
};

// script state
// const sState = {};

// script utils
const sUtils = {
    /**
     * make file path
     * @param {object} ctx 
     * @param {string} date YYYYMMDDHHmm formatted
     * @param {string?} lhd log header
     */
    makeFilePath: (ctx, date, lhd) => {
        const { conf, log } = ctx;
        log.debug(JSON.stringify(conf));

        if (date.length !== sValues.DATE_FORMAT.length) {
            log.warn(`${lhd} failed make file path. invalid date format [${date}]. expected [${sValues.DATE_FORMAT}]`);
            return null;
        }


        const filePathTemplate = conf['device-list']?.['save-path'] || '';
        log.debug(`${lhd} file path template [${filePathTemplate}]`);

        const YYYY = date.slice(0, 4);
        const MM = date.slice(4, 6);
        const DD = date.slice(6, 8);
        const HH = date.slice(8, 10);
        const mm = date.slice(10, 12);
        return filePathTemplate
            .replace(/YYYY/g, YYYY)
            .replace(/MM/g, MM)
            .replace(/DD/g, DD)
            .replace(/HH/g, HH)
            .replace(/mm/g, mm)
            .replace(/ss/g, '00');
    },

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
    const op = 'POST /api/device/list/sync -';
    const lhd = `[${src}:${tid}] ${op}`;
    log.info(`${lhd} >> start sync device list`);

    // define variables
    // list 
    /*
     * id : {number}
     * group_cd : {string}
     * group_type_cd : {string}
     * serial_num : {string}
     * latitude : {number}
     * longitude : {number}
     * c_date : {number} unix timestamp
     */
    const {
        date = utils.timestampToString(Date.now(), sValues.DATE_FORMAT),
        list,
    } = packet.dt;
    const dateObj = sUtils.convertDateFormatToDate(date);
    const syncDate = utils.timestampToString(dateObj.getTime(), 'YYYY-MM-DD HH:mm:ss');
    const filePath = sUtils.makeFilePath(ctx, date, lhd);
    let expireDate = null;
    log.debug(`${lhd} created file path from data [${date}] to [${filePath}]`);
    if (!filePath) {
        log.warn(`${lhd} << failed sync device list. invalid file path. skip saving device list to file. date [${date}]`);
        return { result: 'FAIL', reason: 'INVALID_FILE_PATH' };
    }

    // 디렉토리 생성 및 파일 저장
    try {
        const dir = path.dirname(filePath);
        
        // 디렉토리가 없으면 생성
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            log.info(`${lhd} created directory [${dir}]`);
        }
        
        // 파일 존재 여부 확인
        const fileExists = fs.existsSync(filePath);
        if (fileExists) {
            log.info(`${lhd} file already exists. will overwrite [${filePath}]`);
        }
        
        // list를 JSON 문자열로 변환하여 파일에 저장
        const jsonData = JSON.stringify(list);
        fs.writeFileSync(filePath, jsonData, 'utf8');
        log.info(`${lhd} saved device list to file [${filePath}], count [${list.length}]`);
    } catch (error) {
        log.error(`${lhd} failed to save device list to file [${filePath}]. error: ${error.message}`);

        log.warn(`${lhd} << failed sync device list. failed to save device list to file. err [${error.message}]`);
        return { result: 'FAIL', reason: 'SERVER_ERROR' };

    }

    // set expire date
    if (ctx.conf['device-list']?.['retention-days']) {
        let timestamp = Date.now();
        const retentionDays = parseInt(ctx.conf['device-list']?.['retention-days'], 10);
        timestamp += retentionDays * 24 * 60 * 60 * 1000;
        expireDate = utils.timestampToString(timestamp, 'YYYY-MM-DD HH:mm:ss');
        log.info(`${lhd} set expire date [${expireDate}], retension days [${retentionDays}]`);
    }
    
    // insert history
    const insertData = {
        sync_date: syncDate,
        file_path: filePath,
        device_count: list.length,
        expire_date: expireDate,
        delete_date: null,
        c_date: utils.timestampToString(Date.now(), 'YYYY-MM-DD HH:mm:ss'),
    };
    const insertInfo = await utils.postgresql.insert('history', null, 'tbl_device_sync_his', insertData, null, lhd);
    if (!insertInfo.succ) {
        log.warn(`${lhd} << failed sync device list. failed to insert sync history. err=[${insertInfo.err}]`);
        return { result: 'FAIL', reason: 'SERVER_ERROR' };
    }

    log.info(`${lhd} << complete sync device list, processed device count [${list.length}], elapsed [${Date.now() - started}ms]`);
    return { result: 'OK', count: list.length };
};
