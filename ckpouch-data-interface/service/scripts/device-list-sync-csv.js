// import dependencies
const fs = require('node:fs');
const path = require('node:path');

// script conf
// const sConf = {};

// script values
const sValues = {
    DATE_FORMAT: 'YYYYMMDDHHmm',

    CSV_HEADER: [
        { key: 'sync_date', label: 'sync_date' },
        { key: 'id', label: 'id' },
        { key: 'serial_num', label: 'serial_num' },
        { key: 'latitude', label: 'latitude' },
        { key: 'longitude', label: 'longitude' },
        { key: 'c_date', label: 'c_date' },
        { key: 'group_cd', label: 'group_cd' },
        { key: 'group_type_cd', label: 'group_type_cd' },
        { key: 'nx', label: 'nx' },
        { key: 'ny', label: 'ny' },
        { key: 'station_id', label: 'station_id' },
        // { key: 'temperature', label: 'temperature' },
        // { key: 'humidity', label: 'humidity' },
        // { key: 'wind_speed', label: 'wind_speed' },
        // { key: 'pty', label: 'pty' },
        // { key: 'sky_state', label: 'sky_state' },
    ],

    // for test
    SAMPLE_DEVICE_LIST: [
        {
            "id": 11057,
            "serial_num": "ab:cd:ef:12:34:56",
            "latitude": 37.5112,
            "longitude": 126.9741,
            "c_date": 1747645482,
            "group_cd": "f06",
            "group_type_cd": "05",
            "nx": 60,
            "ny": 126,
            "station_id": 90,
            "temperature": 2,
            "humidity": 70,
            "wind_speed": 1,
            "pty": null,
            "sky_state": 1
        }
    ]
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


        const filePathTemplate = conf['device-list']?.['save-path-csv'] || '';
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
    const tid = packet?.hd?.tid || `${Date.now()}`;
    const op = 'POST /api/device/list/sync/csv -';
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
    const started = Date.now();
    let expireDate = null;

    log.debug(`${lhd} created file path from data [${date}] to [${filePath}]`);
    if (!filePath) {
        log.warn(`${lhd} << failed sync device list. invalid file path. skip saving device list to file. date [${date}]`);
        return { result: 'FAIL', reason: 'INVALID_FILE_PATH' };
    }

    // 디렉토리 생성 및 CSV 파일 저장
    try {
        const dir = path.dirname(filePath);
        
        // 디렉토리가 없으면 생성
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            log.info(`${lhd} created directory [${dir}]`);
        }
        
        // 파일 존재 여부 확인 및 초기화
        const fileExists = fs.existsSync(filePath);
        if (fileExists) {
            log.info(`${lhd} file already exists. will overwrite [${filePath}]`);
            fs.unlinkSync(filePath); // 기존 파일 삭제
        }

        // CSV 헤더 작성
        const headerLine = sValues.CSV_HEADER.map(h => h.label).join(',') + '\n';
        fs.appendFileSync(filePath, headerLine, 'utf8');
        log.debug(`${lhd} wrote CSV header to file`);

        // 각 디바이스 데이터를 CSV 라인으로 변환하여 append
        let count = 0;
        for (const device of list) {
            const cDate = device.c_date ? utils.timestampToString(device.c_date * 1000, 'YYYY-MM-DD HH:mm:ss', false) : '';
            const row = [
                syncDate,
                device.id || '',
                device.serial_num || '',
                device.latitude || '',
                device.longitude || '',
                cDate,
                device.group_cd || '',
                device.group_type_cd || '',
                typeof device.nx === 'number' ? device.nx : '',
                typeof device.ny === 'number' ? device.ny : '',
                typeof device.station_id === 'number' ? device.station_id : '',
                // typeof device.temperature === 'number' ? device.temperature : '',
                // typeof device.humidity === 'number' ? device.humidity : '',
                // typeof device.wind_speed === 'number' ? device.wind_speed : '',
                // typeof device.pty === 'number' ? device.pty : '',
                // typeof device.sky_state === 'number' ? device.sky_state : '',
            ];
            const csvLine = row.join(',') + '\n';
            fs.appendFileSync(filePath, csvLine, 'utf8');
            count++;

            if (count % 1000 === 0) {
                log.info(`${lhd} wrote [${count}/${list.length}] devices to CSV file`);
            }
        }
        
        log.info(`${lhd} saved device list to CSV file [${filePath}], count [${count}]`);
    } catch (error) {
        log.error(`${lhd} failed to save device list to CSV file [${filePath}]. error: ${error.message}`);

        log.warn(`${lhd} << failed sync device list. failed to save device list to file. err [${error.message}]`);
        return { result: 'FAIL', reason: 'SERVER_ERROR' };
    }

    // set expire date
    if (ctx.conf['device-list']?.['retention-days']) {
        let timestamp = Date.now();
        const retentionDays = Number.parseInt(ctx.conf['device-list']?.['retention-days'], 10);
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
