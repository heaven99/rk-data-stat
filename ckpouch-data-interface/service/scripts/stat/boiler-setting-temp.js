module.exports = async (ctx, src, packet, listener) => {
    const { log, utils, modules } = ctx;
    const tid = packet?.hd?.tid || `${Date.now()}`;
    const op = 'POST /stat/get-boiler-setting-temp -';
    const lhd = `[${src}:${tid}] ${op}`;
    log.info(`${lhd} >> start get boiler setting temp`);

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
        log.warn(`${lhd} << failed get boiler setting temp. invalid params. startDate=[${startDate}], endDate=[${endDate}], serialNum=[${serialNum}]`);
        return modules.ckpush4.makeResponse('wrong_request', null, tid);
    }

    let startDt = `${startDate}000000`;
    let endDt = `${endDate}235959`;

    let queryInfo;
    try {
        queryInfo = await utils.postgresql.query('stat', `
            SELECT
                avg(value::numeric) FILTER (WHERE data_type='HEATING_ROOM_TEMP_AVG') AS heat_room_temp_avg,
                avg(value::numeric) FILTER (WHERE data_type='HEATING_FLOOR_TEMP_AVG') AS heat_floor_temp_avg,
                avg((value::numeric + coalesce(fvalue,0)::numeric/10))
                    FILTER (WHERE data_type='HOT_WATER_TEMP_AVG') AS hot_water_tmp_avg
            FROM public.tbl_stat_src2
            WHERE serial_num = $1
              AND stat_date >= $2
              AND stat_date <= $3
              AND data_type IN ('HEATING_ROOM_TEMP_AVG', 'HEATING_FLOOR_TEMP_AVG', 'HOT_WATER_TEMP_AVG');
        `, [serialNum, startDt, endDt], lhd);
    } catch (error) {
        log.error(`${lhd} failed to get boiler setting temp avg. error: ${error.message}`);
        return modules.ckpush4.makeResponse('failed', null, tid);
    }

    if (!queryInfo.succ) {
        log.warn(`${lhd} << failed get boiler setting temp avg. failed to query stat data. err=[${queryInfo.err}]`);
        return modules.ckpush4.makeResponse('failed', null, tid);
    }

    log.debug(`${lhd} query result [${JSON.stringify(queryInfo)}]`);

    const { heat_room_temp_avg, heat_floor_temp_avg, hot_water_tmp_avg } = queryInfo.data.rows[0];

    try {
        queryInfo = await utils.postgresql.query('history', `
            SELECT group_type_cd FROM public.tbl_device
                WHERE serial_num = $1 ORDER BY id DESC LIMIT 1;
        `, [serialNum], lhd);
    } catch (error) {
        log.error(`${lhd} failed to get boiler setting temp avg. error: ${error.message}`);
        return modules.ckpush4.makeResponse('failed', null, tid);
    }

    if (!queryInfo.succ) {
        log.warn(`${lhd} << failed get boiler setting temp avg. failed to query device model data. err=[${queryInfo.err}]`);
        return modules.ckpush4.makeResponse('failed', null, tid);
    }

    log.debug(`${lhd} query result [${JSON.stringify(queryInfo)}]`);

    const { group_type_cd } = queryInfo.data.rows[0];

    // 실온 온도 min, max
    const roomMin = 5;
    const roomMax = 40;

    // 온돌 온도 min, max
    let floorMin = 35, floorMax = 85;
    if (['04', '05', '06', '0b', '0c', '21', '24', '25', '31', '33', '28', '29', '35', '37', '39', '0e', '2b', '40', '41', '42'].includes(group_type_cd)) {
        floorMin = 35;
        floorMax = 85;
    } else if (['00', '01', '02', '03', '07', '08', '09', '0a', '20', '22', '23', '30', '32', '26', '27', '34', '36', '38', '2a'].includes(group_type_cd)) {
        floorMin = 40;
        floorMax = 85;
    }

    // 온수 온도 min, max
    let waterMin = 30, waterMax = 60;
    if (['06', '29', '39', '42', '04', '05', '0c', '21', '25', '31', '33', '2b', '28', '35', '37', '40', '41'].includes(group_type_cd)) {
        waterMin = 30;
        waterMax = 60;
    } else if (['03', '27', '38', '00', '01', '02', '0a', '20', '30', '23', '32', '0e', '2a', '26', '34', '36'].includes(group_type_cd)) {
        waterMin = 35;
        waterMax = 60;
    } else if (['07', '08', '09', '0b', '22', '24', '0e'].includes(group_type_cd)) {
        waterMin = 0;
        waterMax = 3;
    }

    const judgementRoom = Number(heat_room_temp_avg) == null ? '' : (Number(heat_room_temp_avg) >= 30 ? '많이 높아요!' : Number(heat_room_temp_avg) >= 25 ? '조금 높아요!' : '적당해요!');
    const judgementFloor = Number(heat_floor_temp_avg) == null ? '' : (Number(heat_floor_temp_avg) >= 70 ? '많이 높아요!' : Number(heat_floor_temp_avg) >= 60 ? '조금 높아요!' : '적당해요!');
    const judgementHotWater =  Number(hot_water_tmp_avg) > 3 ? ( Number(hot_water_tmp_avg) >= 50 ? '많이 높아요!' :  Number(hot_water_tmp_avg) >= 40 ? '조금 높아요!' : '적당해요!') : '';

    const gaugeRoom = heat_room_temp_avg == null ? 0 : Math.round( (Number(heat_room_temp_avg) - roomMin) / (roomMax - roomMin) * 100 );
    const gaugeFloor = heat_floor_temp_avg == null ? 0 : Math.round( (Number(heat_floor_temp_avg) - floorMin) / (floorMax - floorMin) * 100 );

    log.debug(`${lhd} hot_water_tmp_avg=[${hot_water_tmp_avg}], waterMin=[${waterMin}], waterMax=[${waterMax}]`);
    const gaugeHotWater = Math.round( (Number(hot_water_tmp_avg) - waterMin) / (waterMax - waterMin) * 100 );

    const output = {
        heatingRoom: {
            title: "난방(실내) 평균",
            subtitle: "사용 온도는",
            temperature: heat_room_temp_avg == null ? '기록이 없어요!' : `${Number(heat_room_temp_avg).toFixed(1)}°C`,
            status: `${judgementRoom}`,
            gaugeValue: gaugeRoom
        },
        heatingFloor: {
            title: "난방(온돌) 평균",
            subtitle: "사용 온도는",
            temperature: heat_floor_temp_avg == null ? '기록이 없어요!' : `${Number(heat_floor_temp_avg).toFixed(1)}°C`,
            status: `${judgementFloor}`,
            gaugeValue: gaugeFloor
        },
        hotWater: {
            title: "온수 평균",
            subtitle: "사용 온도는",
            temperature: hot_water_tmp_avg == null ? '기록이 없어요!' : Number(hot_water_tmp_avg) > 3 ? `${Number(hot_water_tmp_avg).toFixed(1)}°C` : `${Math.floor(Number(hot_water_tmp_avg))}단`,
            status: `${judgementHotWater}`,
            gaugeValue: gaugeHotWater
        }
    };

    log.info(`${lhd} << complete get boiler setting temp`);
    return modules.ckpush4.makeResponse('success', output, tid);
};
