const http = require('http');
const https = require('http');

// script conf
const sConf = {
    WARNING_ELAPSED_MS: 10 * 60 * 1000, // 10 minutes
    BULK_INSERT_COLUMNS: [
        'sync_date', 'group_cd', 'group_type_cd', 'device_id', 'serial_num',
        'lat', 'lon', 'c_date',
    ],
    BULK_INSERT_CHUNK_SIZE: 1000,
};

// script values
const sValues = {
    STATE_IDLE: 'IDLE',
    STATE_WORKING: 'WORKING',
};

// script state
const sState = {
    working: sValues.STATE_IDLE,
    started: null,
};

module.exports = async (ctx, src, packet, listener) => {
    const { log, utils, conf } = ctx;
    const tid = packet?.hd?.tid || `${Date.now()}`;
    const op = 'sync-device-list -';
    const lhd = `[${src}:${tid}] ${op}`;
    log.info(`${lhd} >> start sync device list`);

    if (sState.working !== sValues.STATE_IDLE) {
        const logLevel = !sState.started || (Date.now() - sState.started) < sConf.WARNING_ELAPSED_MS ? 'warn' : 'error';
        log[logLevel](`${lhd} << complete sync device list with nothing. job already working. elapsed [${Date.now() - sState.started}ms]`);
        return;
    }

    // set script state
    sState.working = sValues.STATE_WORKING;
    sState.started = Date.now();

    // define variables
    const proxyModule = conf.stat.interface.protocol === 'https' ? https : http;
    // TODO complete query
    const selectQuery = ''
        + 'SELECT '
        + 'd.id AS id, d.serial_num AS serial_num, dg.group_cd AS group_cd, dg.group_type_cd AS group_type_cd, d.latitude AS latitude, '
        + 'd.longitude AS longitude, d.c_date AS c_date '
        + 'FROM tbl_device d '
        + 'LEFT JOIN tbl_device_group dg ON d.device_group_id = dg.id '
        + 'WHERE dg.group_cd = ? '
        + 'ORDER BY d.id ASC'
        // + ' LIMIT 10'
    const selectParam = ['f06'];

    // select device
    const selectInfo = await utils.mysql.query('core', selectQuery, selectParam, lhd);
    if (!selectInfo.succ) {
        log.error(`${lhd} << failed sync device list. failed select device from mysql. err [${selectInfo.err}]`);
        sState.working = sValues.STATE_IDLE;
        sState.started = null;
        return { result: 'FAIL', reason: 'DB_SELECT_FAILED' };
    }
    log.debug(`${lhd} selected device. cnt [${selectInfo.data.length}]`);

    // TODO http
    log.debug(JSON.stringify(selectInfo.data[0]));
    log.debug(JSON.stringify(conf));

    // execute proxy
    let _body = JSON.stringify({ list: selectInfo.data });

    const proxyOptions = {
        // hostname: 'http://localhost:11003',
        hostname: conf.stat.interface.host,
        port: conf.stat.interface.port,
        path: '/api/sync/device/list',
        method: 'POST',
        headers: {
            // 'Content-Type': 'application/json',
            // 'Content-Length': _body.length
            'Content-Type': 'application/json; charset=utf-8',
            'Content-Length': Buffer.byteLength(_body, 'utf8'),
        },
    };

    let isBuffer = false;
    const handleProxyRes = (r, proxyRes) => {
        let body = '';
        const chunks = [];
    
        proxyRes.on('data', (chunk) => {
            body += chunk;
            chunks.push(chunk);
        });
    
        proxyRes.on('end', () => {
            const bodyBuffer = Buffer.concat(chunks);
            const contentType = proxyRes.headers['content-type'] || '';

            // handle json response
            if (contentType.includes('application/json')) {
                // JSON 응답이 확실할 경우 utf8로 문자열 변환
                const bodyString = bodyBuffer.toString('utf8');
                let json;
                try {
                    json = JSON.parse(bodyString);
                    return r({ succ: true, data: json });
                } catch (e) {
                    return r({ succ: false, err: 'JSON parse failed', raw: bodyString });
                }
            }
            // handle other response
            else {
                log.debug(`${lhd} check proxy res headers [${JSON.stringify(proxyRes.headers)}]`);
                isBuffer = true;
                Object.entries(proxyRes.headers).forEach(([key, value]) => {
                    if (
                        key === 'content-type'
                        || key === 'content-disposition'
                        || key === 'content-length'
                    ) {
                        log.debug(`${lhd} [out] response header. key [${key}], value [${value}]`);
                        // res.set(key, value);
                    }
                });

                // JSON이 아닌 경우는 바이너리로 처리
                return r({ succ: true, data: bodyBuffer });
            }
        });
    };
    const proxyInfo = await new Promise((r) => {
        const proxyReq = proxyModule.request(proxyOptions, (proxyRes) => handleProxyRes(r, proxyRes));

        proxyReq.on('error', (e) => {
            console.error(`Error: ${e.message}`);
            r({
                succ: false,
                err: e,
            });
        });

        proxyReq.write(_body, 'utf8');
        proxyReq.end();
    });

    log.info(`${lhd} << complete sync device list, processed device count [${selectInfo.data.length}], elapsed [${Date.now() - sState.started}ms]`);
    sState.working = sValues.STATE_IDLE;
    sState.started = null;

    return { result: 'OK', count: selectInfo.data.length };
};
