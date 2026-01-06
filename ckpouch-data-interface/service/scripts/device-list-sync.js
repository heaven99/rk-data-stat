// script conf
const sConf = {
    BULK_INSERT_COLUMNS: [
        'sync_date', 'group_cd', 'group_type_cd', 'device_id', 'serial_num',
        'lat', 'lon', 'c_date',
    ],
    BULK_INSERT_CHUNK_SIZE: 1000,
};

// script values
const sValues = {};

// script state
const sState = {};

module.exports = async (ctx, src, packet, listener) => {
    const { log, modules, utils } = ctx;
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
    const { list } = packet.dt;     // device list
    // TODO complete query
    const bulkInsertQuery = `INSERT INTO tbl_device (${sConf.BULK_INSERT_COLUMNS.join(', ')}) VALUES `;
    const started = Date.now();
    let bulkInsertData = [];
    const colCnt = sConf.BULK_INSERT_COLUMNS.length;
    const syncDate = utils.timestampToString(Date.now(), 'YYYY-MM-DD HH:mm:ss');
    let deviceCnt = 0;
    log.debug(utils.postgresql)

    for (let i = 0; i < list.length; i += 1) {
        const row = list[i];

        bulkInsertData.push([
            syncDate,
            row.group_cd || '',
            row.group_type_cd || '',
            row.id || 0,
            row.serial_num,
            row.latitude ?? null,
            row.longitude ?? null,
            row.c_date
                ? utils.timestampToString(row.c_date * 1000, 'YYYY-MM-DD HH:mm:ss')
                : null,
        ]);

        // chunk reached or last row
        if (
            bulkInsertData.length === sConf.BULK_INSERT_CHUNK_SIZE ||
            i === list.length - 1
        ) {
            const placeholders = bulkInsertData
                .map((r, rowIdx) => {
                    const base = rowIdx * colCnt;
                    const cols = r.map((_, colIdx) => `$${base + colIdx + 1}`);
                    return `(${cols.join(', ')})`;
                })
                .join(', ');

            const values = [].concat.apply([], bulkInsertData);
            const sql = bulkInsertQuery + placeholders;

            await utils.postgresql.query('history', sql, values, lhd);

            deviceCnt += bulkInsertData.length;
            bulkInsertData = [];
        }
    }

    log.info(
        `${lhd} << complete sync device list, processed device count [${deviceCnt}], elapsed [${Date.now() - started}ms]`
    );

    return { result: 'OK', count: deviceCnt };
};
