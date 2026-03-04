// import dependencies
const fs = require('node:fs');
const readline = require('node:readline');

// script conf
const sConf = {
    SELECT_WEATHER_HIS_COLUMNS: [
        'sync_date', 'file_path', 'expire_date', 'c_date',
    ],
    SELECT_WEATHER_HIS_SORT: [
        { col: 'sync_date', dir: 'DESC' },
        { col: 'c_date',    dir: 'DESC' },
    ],
    HEADER_MAP: [
        { header: 'base_date', key: 'baseDate', type: 'string' },
        { header: 'base_time', key: 'baseTime', type: 'string' },
        { header: 'fcst_date', key: 'fcstDate', type: 'string' },
        { header: 'fcst_time', key: 'fcstTime', type: 'string' },
        { header: 'nx', key: 'nx', type: 'number' },
        { header: 'ny', key: 'ny', type: 'number' },
        { header: 'temperature', key: 'temperature', type: 'number' },
        { header: 'humidity', key: 'humidity', type: 'number' },
        { header: 'wind_speed', key: 'windSpeed', type: 'number' },
        { header: 'pty', key: 'pty', type: 'number' },
        { header: 'sky_state', key: 'skyState', type: 'number' },
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
     * @param {object?} filter - filter object with camelCase keys (values can be single or array)
     * @param {number} offset - starting position in filtered results (0-based)
     * @param {number} limit - number of filtered items to read
     * @param {string[]} columns - optional array of camelCase column names to include
     * @param {string} dateFormatted - formatted date string
     * @returns {Promise<number>} - number of objects written
     */
    streamCsvToResponse: async (ctx, res, filePath, filter, offset, limit, columns, dateFormatted) => {
        const { log } = ctx;
        return new Promise((resolve, reject) => {
            let header = null;
            let columnIndices = null;
            let filterIndexMap = new Map(); // key -> {index, type, values[]}
            let lineNumber = 0;
            let filteredCount = 0; // 필터 조건을 만족하는 항목 수
            let itemCount = 0; // 실제로 응답에 포함된 항목 수
            let isSettled = false; // Promise가 이미 resolve/reject 되었는지 추적

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
                // log.debug(`Read line ${lineNumber}: ${line}`);
                try {
                    if (lineNumber === 0) {
                        // First line is header
                        header = line.split(',');
                        
                        // HEADER_MAP 기반으로 header -> key 매핑 생성
                        const headerToKeyMap = new Map();
                        const keyToIndexMap = new Map();
                        const keyToMappingMap = new Map(); // key -> mapping 객체
                        
                        for (const mapping of sConf.HEADER_MAP) {
                            const headerIndex = header.indexOf(mapping.header);
                            keyToMappingMap.set(mapping.key, mapping);
                            if (headerIndex !== -1) {
                                headerToKeyMap.set(mapping.header, mapping.key);
                                keyToIndexMap.set(mapping.key, headerIndex);
                            }
                        }
                        
                        // 필터 조건을 위한 인덱스 맵 생성
                        if (filter) {
                            for (const [key, value] of Object.entries(filter)) {
                                const mapping = keyToMappingMap.get(key);
                                if (!mapping) continue; // HEADER_MAP에 없는 key는 무시
                                
                                const index = keyToIndexMap.get(key);
                                if (index === undefined) {
                                    throw new Error(`Filter key '${key}' column not found in CSV header`);
                                }
                                
                                // 값을 배열로 정규화하고 타입에 맞게 변환
                                const values = Array.isArray(value) ? value : [value];
                                const convertedValues = mapping.type === 'number' 
                                    ? values.map(v => Number(v))
                                    : values.map(v => String(v));
                                
                                filterIndexMap.set(key, {
                                    index,
                                    type: mapping.type,
                                    values: convertedValues
                                });
                            }
                        }
                        
                        // 응답에 포함할 컬럼 인덱스 계산 (camelCase key + type 포함)
                        columnIndices = new Map();
                        if (columns && columns.length > 0) {
                            // 특정 컬럼만 선택
                            for (const key of columns) {
                                const mapping = keyToMappingMap.get(key);
                                if (!mapping) continue; // HEADER_MAP에 없는 key는 무시
                                
                                const index = keyToIndexMap.get(key);
                                if (index !== undefined) {
                                    columnIndices.set(index, { key, type: mapping.type });
                                } else {
                                    // HEADER_MAP에 정의되어 있지만 CSV에는 없는 경우, null 응답을 위해 -1로 설정
                                    columnIndices.set(-1, { key, type: mapping.type }); // 특수 처리: CSV에 없는 컬럼
                                }
                            }
                        } else {
                            // 모든 매핑된 컬럼 포함
                            for (const [key, index] of keyToIndexMap) {
                                const mapping = keyToMappingMap.get(key);
                                if (mapping) {
                                    columnIndices.set(index, { key, type: mapping.type });
                                }
                            }
                        }
                    } else {
                        if (line.trim()) {  // Skip empty lines
                            // 모든 필터 조건 체크
                            let shouldInclude = true;
                            
                            if (filterIndexMap.size > 0) {
                                const values = line.split(',');
                                
                                for (const [key, filterInfo] of filterIndexMap) {
                                    const cellValue = values[filterInfo.index];
                                    
                                    // 타입에 맞게 변환 후 비교
                                    const convertedValue = filterInfo.type === 'number' 
                                        ? Number(cellValue)
                                        : String(cellValue);
                                    
                                    // 필터 값 배열에 포함되는지 확인
                                    if (!filterInfo.values.includes(convertedValue)) {
                                        shouldInclude = false;
                                        break;
                                    }
                                }
                            }
                            
                            if (shouldInclude) {
                                // 필터 조건을 만족하는 경우
                                if (filteredCount >= offset && filteredCount < offset + limit) {
                                    // offset과 limit 범위 내에 있는 경우만 응답에 포함
                                    const obj = sUtils.parseCsvLineOptimized(line, columnIndices);
                                    
                                    // 첫 번째 아이템이 아니면 콤마 추가
                                    if (itemCount > 0) {
                                        res.write(',');
                                    }
                                    
                                    // JSON 객체를 문자열로 변환해서 전송
                                    res.write(JSON.stringify(obj));
                                    itemCount++;
                                }
                                
                                filteredCount++;
                                
                                // offset + limit에 도달하면 스트림 종료
                                if (filteredCount >= offset + limit) {
                                    rl.close();
                                    fileStream.destroy();
                                }
                            }
                        }
                    }
                    
                    lineNumber += 1;
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
                
                log.debug(`Finished streaming CSV file [${filePath}]. Filtered items: ${filteredCount}, Objects sent: ${itemCount}`);
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
     * Parse CSV line to object (optimized version with HEADER_MAP)
     * @param {string} line 
     * @param {Map<number, {key: string, type: string}>} columnIndices - Map of column index to {key, type}
     * @returns {object}
     */
    parseCsvLineOptimized: (line, columnIndices) => {
        const values = line.split(',');
        const obj = {};
        
        // 필요한 컬럼만 처리
        for (const [index, {key, type}] of columnIndices) {
            // index가 -1이면 CSV에 없는 컬럼이므로 null
            if (index === -1) {
                obj[key] = null;
                continue;
            }
            
            const value = values[index];
            
            // 빈 값 또는 'null' 문자열 체크를 먼저
            if (!value || value === 'null') {
                obj[key] = null;
                continue;
            }
            
            // type 기반 변환
            if (type === 'number') {
                obj[key] = Number(value);
            } else { // type === 'string'
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
    const op = 'POST /api/weather/list -';
    const lhd = `[${src}:${tid}] ${op}`;
    log.info(`${lhd} >> start list weather data. data [${JSON.stringify(packet.dt)}]`);

    // define variables
    let { filter, offset = 0, limit = sValues.DEFAULT_LIMIT, columns } = packet.dt;
    const authHeader = listener.req.get('Authorization');

    if (authHeader !== 'abc') {
        log.warn(`${lhd} unauthorized access attempt with Authorization [${authHeader}]`);
        return { result: 'FAIL', err: 'Unauthorized' };
    }
    
    // Enforce maximum limit to prevent memory issues (스트리밍이므로 Infinity도 가능)
    if (limit > sValues.MAX_LIMIT) {
        log.warn(`${lhd} limit [${limit}] exceeds max limit [${sValues.MAX_LIMIT}]. Using max limit.`);
        limit = sValues.MAX_LIMIT;
    }

    const selectWeatherFcstSyncHisFilter = [{ col: 'delete_date', op: 'IS', val: null }];

    // 필터 로깅
    if (filter && Object.keys(filter).length > 0) {
        const filterStr = Object.entries(filter)
            .map(([key, value]) => {
                const valueStr = Array.isArray(value) ? value.join(',') : value;
                return `${key}: [${valueStr}]`;
            })
            .join(', ');
        log.debug(`${lhd} filtering by ${filterStr}`);
    }

    // select last sync date
    const selectWeatherFcstSyncHisInfo = await utils.postgresql.select('history', null, 'tbl_weather_fcst_sync_his', sConf.SELECT_WEATHER_HIS_COLUMNS, selectWeatherFcstSyncHisFilter, sConf.SELECT_WEATHER_HIS_SORT, null, 0, 1, lhd);
    if (!selectWeatherFcstSyncHisInfo.succ) {
        log.error(`${lhd} << failed list weather data. failed select weather forecast sync his. err [${selectWeatherFcstSyncHisInfo.err}]`);
        return { result: 'FAIL', err: 'failed to select last sync date' };
    }
    log.debug(`${lhd} selected weather forecast sync his info [${JSON.stringify(selectWeatherFcstSyncHisInfo)}]`);

    if (selectWeatherFcstSyncHisInfo.data.length <= 0) {
        log.warn(`${lhd} << success list weather data with nothing. no data found`);
        return { result: 'OK', date: null, list: [] };
    }

    const filePath = selectWeatherFcstSyncHisInfo.data[0].file_path;
    const syncDate = selectWeatherFcstSyncHisInfo.data[0].sync_date;
    
    // Convert sync_date to YYYYMMDDHHmm format
    const syncDateObj = new Date(syncDate);
    const dateFormatted = utils.timestampToString(syncDateObj.getTime(), sValues.DATE_FORMAT);
    
    log.debug(`${lhd} reading CSV file [${filePath}], offset [${offset}], limit [${limit}]`);
    if (columns && columns.length > 0) {
        log.debug(`${lhd} selecting columns [${columns.join(',')}]`);
    }

    try {
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            log.error(`${lhd} << failed list weather data. file not found [${filePath}]`);
            return { result: 'FAIL', err: 'file not found' };
        }

        // Stream CSV directly to response
        const itemCount = await sUtils.streamCsvToResponse(ctx, res, filePath, filter, offset, limit, columns, dateFormatted);
        
        log.info(`${lhd} << complete list weather data. count [${itemCount}], offset [${offset}], limit [${limit}]`);
        
        // 스트리밍 방식이므로 return하지 않음 (이미 res.end() 호출됨)
    } catch (error) {
        log.error(`${lhd} << failed list weather data. error [${error.message}]`);
        
        // 응답이 아직 전송되지 않았다면 에러 응답
        if (!res.headersSent) {
            return { result: 'FAIL', err: error.message };
        }
    }
};
