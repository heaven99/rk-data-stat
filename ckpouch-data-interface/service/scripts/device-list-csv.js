// import dependencies
const fs = require('node:fs');
const readline = require('node:readline');

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
const sValues = {
    DATE_FORMAT: 'YYYYMMDDHHmm',
    // DEFAULT_LIMIT: 100,
    // MAX_LIMIT: 10000,  // 최대 10,000개로 제한
    DEFAULT_LIMIT: Infinity,
    MAX_LIMIT: Infinity,  // 최대 10,000개로 제한
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

    /**
     * Stream CSV lines directly to response
     * @param {object} ctx
     * @param {object} res - Express response object
     * @param {string} filePath 
     * @param {number} offset - starting line number (0-based, excluding header)
     * @param {number} limit - number of lines to read
     * @param {string[]} columns - optional array of column names to include
     * @param {string} dateFormatted - formatted date string
     * @returns {Promise<number>} - number of objects written
     */
    streamCsvToResponse: async (ctx, res, filePath, offset, limit, columns, dateFormatted) => {
        const { log } = ctx;
        return new Promise((resolve, reject) => {
            let header = null;
            let columnIndices = null;
            let lineNumber = 0;
            let itemCount = 0;
            let isSettled = false; // Promise가 이미 resolve/reject 되었는지 추적
            const startLine = offset + 1; // +1 because line 0 is header
            const endLine = startLine + limit;

            const fileStream = fs.createReadStream(filePath, { 
                encoding: 'utf8',
                highWaterMark: 16 * 1024 
            });
            const rl = readline.createInterface({
                input: fileStream,
                crlfDelay: Infinity
            });

            // 응답 헤더 및 JSON 시작 부분 전송 (result는 마지막에)
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.write(`{"date":"${dateFormatted}","list":[`);

            rl.on('line', (line) => {
                try {
                    if (lineNumber === 0) {
                        // First line is header
                        header = line.split(',');
                        
                        // 필요한 컬럼의 인덱스만 미리 계산
                        if (columns && columns.length > 0) {
                            columnIndices = new Map();
                            for (let i = 0; i < header.length; i++) {
                                const key = header[i];
                                if (key !== 'sync_date' && columns.includes(key)) {
                                    columnIndices.set(i, key);
                                }
                            }
                        } else {
                            columnIndices = new Map();
                            for (let i = 0; i < header.length; i++) {
                                const key = header[i];
                                if (key !== 'sync_date') {
                                    columnIndices.set(i, key);
                                }
                            }
                        }
                    } else if (lineNumber >= startLine && lineNumber < endLine) {
                        if (line.trim()) {  // Skip empty lines
                            // Parse and write to response immediately
                            const obj = sUtils.parseCsvLineOptimized(line, columnIndices);
                            
                            // 첫 번째 아이템이 아니면 콤마 추가
                            if (itemCount > 0) {
                                res.write(',');
                            }
                            
                            // JSON 객체를 문자열로 변환해서 전송
                            res.write(JSON.stringify(obj));
                            itemCount++;
                        }
                    }
                    
                    lineNumber += 1;
                    
                    // Close stream when we have enough lines
                    if (lineNumber >= endLine) {
                        rl.close();
                        fileStream.destroy();
                    }
                } catch (err) {
                    log.error(`Error processing line ${lineNumber}: ${err.message}`);
                    
                    if (isSettled) return; // 이미 처리된 경우 무시
                    isSettled = true;
                    
                    // 파싱 에러 발생 시 스트림 종료
                    rl.close();
                    fileStream.destroy();
                    
                    // valid JSON으로 종료 (result를 마지막에)
                    res.write(`],"error":"${err.message.replace(/"/g, '\\"')}","partial":true,"failedAtLine":${lineNumber},"result":"FAIL"}`);
                    res.end();
                    reject(err);
                }
            });

            rl.on('close', () => {
                if (isSettled) return; // 이미 처리된 경우 무시
                isSettled = true;
                
                // JSON 종료 부분 전송 (result를 마지막에)
                res.write('],"result":"OK"}');
                res.end();
                
                log.debug(`Finished streaming CSV file [${filePath}]. Total objects sent: ${itemCount}`);
                resolve(itemCount);
            });

            rl.on('error', (err) => {
                log.error(`Error reading CSV file [${filePath}]: ${err.message}`);
                
                if (isSettled) return; // 이미 처리된 경우 무시
                isSettled = true;
                
                // 에러 발생시에도 valid JSON으로 종료
                if (!res.headersSent) {
                    // 헤더가 아직 전송되지 않았으면 에러 응답
                    res.status(500).json({ result: 'FAIL', err: err.message });
                } else {
                    // 이미 부분적으로 전송되었으면 JSON을 닫고 에러 정보 추가 (result를 마지막에)
                    res.write(`],"error":"${err.message.replace(/"/g, '\\"')}","partial":true,"result":"FAIL"}`);
                    res.end();
                }
                reject(err);
            });

            fileStream.on('error', (err) => {
                log.error(`Error with file stream [${filePath}]: ${err.message}`);
                
                if (isSettled) return; // 이미 처리된 경우 무시
                isSettled = true;
                
                // 에러 발생시에도 valid JSON으로 종료
                if (!res.headersSent) {
                    res.status(500).json({ result: 'FAIL', err: err.message });
                } else {
                    // 이미 부분적으로 전송되었으면 JSON을 닫고 에러 정보 추가 (result를 마지막에)
                    res.write(`],"error":"${err.message.replace(/"/g, '\\"')}","partial":true,"result":"FAIL"}`);
                    res.end();
                }
                reject(err);
            });
        });
    },

    /**
     * Parse CSV line to object (optimized version)
     * @param {string} line 
     * @param {Map<number, string>} columnIndices - Map of column index to column name
     * @returns {object}
     */
    parseCsvLineOptimized: (line, columnIndices) => {
        const values = line.split(',');
        const obj = {};
        
        // 필요한 컬럼만 처리
        for (const [index, key] of columnIndices) {
            const value = values[index];
            
            // 빈 값 또는 'null' 문자열 체크를 먼저
            if (!value || value === 'null') {
                obj[key] = null;
                continue;
            }
            
            // 숫자형 필드 처리 - 한 번에 체크
            if (key === 'id' || key === 'c_date' || key === 'nx' || key === 'ny' || 
                key === 'station_id' || key === 'temperature' || key === 'humidity' || 
                key === 'wind_speed' || key === 'pty' || key === 'sky_state') {
                obj[key] = Number(value);
            } else if (key === 'latitude' || key === 'longitude') {
                obj[key] = parseFloat(value);
            } else {
                obj[key] = value;
            }
        }
        
        return obj;
    },
};

module.exports = async (ctx, src, packet, listener) => {
    const { log, utils } = ctx;
    const { res } = listener;
    const tid = packet?.hd?.tid || `${Date.now()}`;
    const op = 'POST /api/device/list -';
    const lhd = `[${src}:${tid}] ${op}`;
    log.info(`${lhd} >> start list device. data [${JSON.stringify(packet.dt)}]`);

    // define variables
    let { filter, offset = 0, limit = sValues.DEFAULT_LIMIT, columns } = packet.dt;
    
    // Enforce maximum limit to prevent memory issues (스트리밍이므로 Infinity도 가능)
    if (limit > sValues.MAX_LIMIT) {
        log.warn(`${lhd} limit [${limit}] exceeds max limit [${sValues.MAX_LIMIT}]. Using max limit.`);
        limit = sValues.MAX_LIMIT;
    }
    
    const selectDeviceSyncHisFilter = [{ col: 'delete_date', op: 'IS', val: null }];

    // set filter
    if (filter?.date?.length === 12) {
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
        return { result: 'OK', date: null, list: [] };
    }

    const filePath = selectDeviceSyncHisInfo.data[0].file_path;
    const syncDate = selectDeviceSyncHisInfo.data[0].sync_date;
    
    // Convert sync_date to YYYYMMDDHHmm format
    const syncDateObj = new Date(syncDate);
    const dateFormatted = utils.timestampToString(syncDateObj.getTime(), sValues.DATE_FORMAT);
    
    log.debug(`${lhd} reading CSV file [${filePath}], offset [${offset}], limit [${limit}]`);
    if (columns && columns.length > 0) {
        log.debug(`${lhd} filtering columns [${columns.join(',')}]`);
    }

    try {
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            log.error(`${lhd} << failed list device. file not found [${filePath}]`);
            return { result: 'FAIL', err: 'file not found' };
        }

        // Stream CSV directly to response
        const itemCount = await sUtils.streamCsvToResponse(ctx, res, filePath, offset, limit, columns, dateFormatted);
        
        log.info(`${lhd} << complete list device. count [${itemCount}], offset [${offset}], limit [${limit}]`);
        
        // 스트리밍 방식이므로 return하지 않음 (이미 res.end() 호출됨)
    } catch (error) {
        log.error(`${lhd} << failed list device. error [${error.message}]`);
        
        // 응답이 아직 전송되지 않았다면 에러 응답
        if (!res.headersSent) {
            return { result: 'FAIL', err: error.message };
        }
    }
};
