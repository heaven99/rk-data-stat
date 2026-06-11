/* OBSOLETE: 2026-06-11 로그 확인 결과 호출 이력 없음. 사용처 없는 dead API. */

// 페이지 데이터 조회
// 데이터는 API 호출시점, device Id 기준으로 1주전 일요일부터 생성 현재는 mock

// script values
const sValues = {
    // MOCK_DATA_INDEX: 0, // 0 ~ 11;
    REDIS_KEY_PREFIX_MOCK_DEVICE_DATA: 'cms.aiot.device-data.',
    // ${REDIS_KEY_PREFIX_WEATHER_DATA}${deviceId}.${YYYYMMDD}
    REDIS_KEY_PREFIX_WEATHER_DATA: 'cms.aiot.weather-data.',

    REDIS_TTL_MOCK_DEVICE_DATA: 86400 * 7, // 7 days

    SET_TEMP_RANGE_HEATING_MIN: 22,
    SET_TEMP_RANGE_HEATING_MAX: 40,

    SET_TEMP_RANGE_HOT_WATER_MIN: 40,
    SET_TEMP_RANGE_HOT_WATER_MAX: 60,

    SCHEDULE_COUNT_MIN: 1,
    SCHEDULE_COUNT_MAX: 6,

    RESERVE_SCHEDULE_OPTIONS: [
        '매일', '일', '월', '화', '수', '목', '금', '토'
    ],

    RESERVE_MODE_OPTIONS: [
        '난방', '온수',
    ],

    PAGE_CD_SMART_BRIEFING_MAIN: 'SMART_BRIEFING/MAIN',

    PAGE_META_SMART_BRIEFING_MAIN: [
        {
            "type": "BRIEFING_HEADER",
            "data": {
                "title": "이번 주\n보일러 사용 브리핑",
                "dateRange": "1월 11일 - 1월 17일"
            }
        },
        {
            "type": "BRIEFING_BADGE",
            "data": {
                "subtitle": "이번 주 나의 난방 습관은",
                "title": "현명한 절약가에요!",
                "actionText": "나의 배지 현황 보기 >"
            }
        },
        {
            "type": "BRIEFING_USAGE_CHART",
            "data": {
                "title": "이번 주 데이터 분석 결과",
                "message": "오후 5시에 보일러를\n자주 사용했어요!",
                // "chartData": [{"hour":0,"value":5},{"hour":1,"value":7},{"hour":2,"value":9},{"hour":3,"value":5},{"hour":4,"value":7},{"hour":5,"value":9},{"hour":6,"value":20},{"hour":7,"value":25},{"hour":8,"value":30},{"hour":9,"value":35},{"hour":10,"value":7},{"hour":11,"value":9},{"hour":12,"value":5},{"hour":13,"value":7},{"hour":14,"value":9},{"hour":15,"value":5},{"hour":16,"value":7},{"hour":17,"value":50},{"hour":18,"value":30},{"hour":19,"value":27},{"hour":20,"value":24},{"hour":21,"value":21},{"hour":22,"value":18},{"hour":23,"value":9}],
                "chartData": [],
                "peakHourIndex": 17
            }
        },
        {
            "type": "BRIEFING_GAS_COMPARISON",
            // "data": {
            //     "title": "이번 주 전체 가스 사용량은",
            //     "message": "지난 주 보다 줄었어요",
            //     "lastWeekValue": 9,
            //     "thisWeekValue": 7
            // },
            "data": {}
        },
        {
            "type": "BRIEFING_GAS_DETAIL",
            // "data": {
            //     "total": "이번주 가스 사용량은 총 9㎡이며,",
            //     "heating": "난방에 6㎡,",
            //     "hotWater": "온수에 3㎡ 사용했어요!"
            // },
            "data": {}
        },
        {
            "type": "BRIEFING_TEMPERATURE_COMBINED",
            "data": {
                // "heating": {
                //     "title": "난방(실내) 평균",
                //     "subtitle": "사용 온도는",
                //     "temperature": "25°C",
                //     "status": "적당해요!",
                //     "gaugeValue": 65
                // },
                // "floor": {
                //     "title": "난방(온돌) 평균",
                //     "subtitle": "사용 온도는",
                //     "temperature": "25°C",
                //     "status": "적당해요!",
                //     "gaugeValue": 65
                // },
                // "hotWater": {
                //     "title": "온수 평균",
                //     "subtitle": "사용 온도는",
                //     "temperature": "48°C",
                //     "status": "많이 높아요!",
                //     "gaugeValue": 80
                // },
                "heating": {},
                "floor": {},
                "hotWater": {}
            }
        },
        // {
        //     "type": "BRIEFING_AI_MODE",
        //     "data": {
        //         "subtitle": "AI 패턴 분석이 끝났어요",
        //         "message": "AI가 분석한 패턴으로\n보일러를 사용해볼까요?",
        //         "actionText": "AI 모드 켜기 >"
        //     }
        // },
        // {
        //     "type": "BRIEFING_ADDITIONAL_INFO",
        //     "data": {
        //         "text": "추가 안내"
        //     }
        // },
        // {
        //     "type": "BRIEFING_RESERVATION",
        //     "data": {
        //         "title": "다음주 보일러 예약이 1건 있습니다",
        //         "actionText": "예약 확인하기 >",
        //         "reservations": [{"timeRange":"07:00 - 14:00","schedule":"매일","mode":"난방","temperature":"25°C"}]
        //     }
        // },
        // {
        //     "type": "BRIEFING_RESERVATION",
        //     "data": {
        //         "title": "다음주 보일러 예약이 1건 있습니다",
        //         "actionText": "예약 확인하기 >",
        //         "reservations": [{"timeRange":"07:00 - 14:00","schedule":"매일","mode":"난방","temperature":"25°C"}]
        //     }
        // },
        // {
        //     "type": "BRIEFING_RESERVATION",
        //     "data": {
        //         "title":"다음주 보일러 예약이 6건 있습니다",
        //         "actionText":"예약 확인 하기 >",
        //         "reservations":[
        //             {"timeRange":"07:00-14:00","schedule":"매일","mode":"난방","temperature":"25℃"},
        //             {"timeRange":"07:00-14:00","schedule":"매일","mode":"난방","temperature":"25℃"},
        //             {"timeRange":"07:00-14:00","schedule":"매일","mode":"난방","temperature":"25℃"},
        //             {"timeRange":"07:00-14:00","schedule":"매일","mode":"난방","temperature":"25℃"},
        //             {"timeRange":"07:00-14:00","schedule":"매일","mode":"난방","temperature":"25℃"},
        //             {"timeRange":"07:00-14:00","schedule":"매일","mode":"난방","temperature":"25℃"}
        //         ]
        //     }
        // }
    ],
};

function isPlainObject(value) {
    return Object.prototype.toString.call(value) === '[object Object]';
}

// script utils
const sUtils = {
    /**
     * briefDate(YYYYMMDD)를 받아
     * briefDate 기준 "7일 전 ~ 1일 전" 범위를 반환
     *
     * @param {string} briefDate - YYYYMMDD (기준일)
     * @returns {{ startDate: object, endDate: object }}
     */
    getBriefWeekRange: (briefDate) => {
        const isValid = (d) => /^\d{8}$/.test(d);
        if (!isValid(briefDate)) {
            throw new Error(`Invalid date format`);
        }

        const parse = (yyyymmdd) => {
            const y = Number(yyyymmdd.slice(0, 4));
            const m = Number(yyyymmdd.slice(4, 6));
            const d = Number(yyyymmdd.slice(6, 8));
            return new Date(y, m - 1, d);
        };

        const base = parse(briefDate);

        // briefDate - 7일
        const start = new Date(base);
        start.setDate(base.getDate() - 7);

        // briefDate - 1일
        const end = new Date(base);
        end.setDate(base.getDate() - 1);

        // briefDate - 7일
        const lastStart = new Date(base);
        lastStart.setDate(base.getDate() - 14);

        // briefDate - 1일
        const lastEnd = new Date(base);
        lastEnd.setDate(base.getDate() - 8);

        return {
            startDate: start,
            endDate: end,
            startStr: sUtils.formatDateString(start),
            endStr: sUtils.formatDateString(end),
            lastStartStr: sUtils.formatDateString(lastStart),
            lastEndStr: sUtils.formatDateString(lastEnd),
        };
    },

    /**
     * YYYYMMDD 날짜가 "이번 주(일~토)"에 속하는지 판단
     *
     * @param {string} yyyymmdd - YYYYMMDD
     * @returns {boolean}
     */
    isInThisWeek: (yyyymmdd) => {
        if (!/^\d{8}$/.test(yyyymmdd)) {
            throw new Error(`Invalid date format: ${yyyymmdd}`);
        }

        const parse = (d) => {
            const y = Number(d.slice(0, 4));
            const m = Number(d.slice(4, 6));
            const day = Number(d.slice(6, 8));
            return new Date(y, m - 1, day);
        };

        const target = parse(yyyymmdd);
        const today = new Date();

        // 시간 제거 (날짜 비교용)
        target.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        // JS 기준: 일=0, 월=1, ... 토=6
        const todayDow = today.getDay();

        // 이번 주 일요일
        const thisSunday = new Date(today);
        thisSunday.setDate(today.getDate() - todayDow);

        // 이번 주 토요일
        const thisSaturday = new Date(thisSunday);
        thisSaturday.setDate(thisSunday.getDate() + 6);

        return target >= thisSunday && target <= thisSaturday;
    },

    parseDateString: (yyyymmdd) => {
        const year = Number(yyyymmdd.slice(0, 4));
        const month = Number(yyyymmdd.slice(4, 6));
        const day = Number(yyyymmdd.slice(6, 8));
        return {year, month, day};
    },

    formatDateString: (date) =>
        date.getFullYear().toString() +
        String(date.getMonth() + 1).padStart(2, '0') +
        String(date.getDate()).padStart(2, '0'),

    makePage: (ctx, cd, data, lhd, tid) => {
        if (cd === sValues.PAGE_CD_SMART_BRIEFING_MAIN) {
            return sUtils.makePageForSmartBriefingMain(ctx, data.serialNum, data.briefDate, lhd, tid);
        }

        ctx.log.warn(`makePage failed. not supported page cd. expected [${sValues.PAGE_CD_SMART_BRIEFING_MAIN}], actual [${cd}]`);
        return [];
    },

    makePageForSmartBriefingMain: async (ctx, serialNum, briefDate, lhd, tid) => {
        const { log, utils, modules } = ctx;
        // 1) 기본 세팅
        const pageData = JSON.parse(JSON.stringify(sValues.PAGE_META_SMART_BRIEFING_MAIN));
        const { startDate, endDate, startStr, endStr, lastStartStr, lastEndStr } = sUtils.getBriefWeekRange(briefDate);

        // 2) 헤더 날짜 범위 표시
        const notIncludeEndDayMonth = startDate.getMonth() !== endDate.getMonth();
        let weekDayString = '';
        weekDayString += `${startDate.getMonth() + 1}월 ${startDate.getDate()}일`;
        weekDayString += ' - ';
        weekDayString += notIncludeEndDayMonth ? `${endDate.getMonth() + 1}월 ${endDate.getDate()}일` : `${endDate.getDate()}일`;
        if (pageData[0]?.type === 'BRIEFING_HEADER') {
            pageData[0].data.dateRange = weekDayString;
        }

        // 3) BRIEFING_USAGE_CHART
        const usageChartItem = pageData.find(item => item.type === 'BRIEFING_USAGE_CHART');
        if (usageChartItem && usageChartItem.data && Array.isArray(usageChartItem.data.chartData)) {
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
                `, [serialNum, `${startStr}000000`, `${endStr}235959`], lhd);
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
                usageChartItem.data.chartData.push(ret);
            }

            usageChartItem.data.peakHourIndex = maxhh;

            const toKoreanHour = (h) => {
                const period = h < 12 ? '오전' : '오후';
                const h12 = h % 12 === 0 ? 12 : h % 12;
                return `${period} ${h12}시`;
            };

            usageChartItem.data.message = `${toKoreanHour(maxhh)}에 보일러를\n자주 사용했어요!`;
        }

        // 4) BRIEFING_GAS_COMPARISON
        const gasComparisonItem = pageData.find(item => item.type === 'BRIEFING_GAS_COMPARISON');
        if (gasComparisonItem && isPlainObject(gasComparisonItem.data)) {
            let queryInfo;
            try {
                queryInfo = await utils.postgresql.query('stat', `
                    SELECT
                        -- 지난 주
                        sum(value) FILTER (
                    WHERE stat_date >= $1
                      AND stat_date <= $2
                    ) AS last_week_total,

                    -- 조회 기간
                        sum(value) FILTER (
                    WHERE stat_date >= $3
                      AND stat_date <= $4
                    ) AS target_week_total

                    FROM public.tbl_stat_src2
                    WHERE serial_num = $5
                      AND data_type IN ('HEATING_GAS_USAGE', 'HOT_WATER_GAS_USAGE');
                `, [`${lastStartStr}000000`, `${lastEndStr}235959`, `${startStr}000000`, `${endStr}235959`, serialNum], lhd);
            } catch (error) {
                log.error(`${lhd} failed to get boiler total gas usage. error: ${error.message}`);
                return modules.ckpush4.makeResponse('failed', null, tid);
            }

            if (!queryInfo.succ) {
                log.warn(`${lhd} << failed get boiler total gas usage. failed to query stat data. err=[${queryInfo.err}]`);
                return modules.ckpush4.makeResponse('failed', null, tid);
            }

            const { last_week_total, target_week_total } = queryInfo.data.rows[0];
            const ret = {
                title: sUtils.isInThisWeek(endStr) ? "이번 주 전체 가스 사용량은" : "이 주의 전체 가스 사용량은",
                message: last_week_total > target_week_total ? "지난 주 보다 줄었어요."
                    : last_week_total === target_week_total ? "지난 주와 같아요." : "지난 주 보다 늘었어요.",
                lastWeekValue: last_week_total,
                thisWeekValue: target_week_total,
            }

            gasComparisonItem.data = ret;
        }

        // 5) BRIEFING_GAS_DETAIL
        const gasDetailItem = pageData.find(item => item.type === 'BRIEFING_GAS_DETAIL');
        if (gasDetailItem && isPlainObject(gasDetailItem.data)) {
            let queryInfo;
            try {
                queryInfo = await utils.postgresql.query('stat', `
                    SELECT
                        -- 1) HEAT_GAS_USAGE (시간 누적) : value 합
                        sum(value) FILTER (WHERE data_type = 'HEATING_GAS_USAGE') AS heat_gas_usage_sum,
        
                        -- 2) HOT_WATER_GAS_USAGE (시간 누적) : value 합
                        sum(value) FILTER (WHERE data_type = 'HOT_WATER_GAS_USAGE') AS hot_water_gas_usage_sum
                    FROM public.tbl_stat_src2
                    WHERE serial_num = $1
                      AND stat_date >= $2
                      AND stat_date <= $3
                      AND data_type IN ('HEATING_GAS_USAGE', 'HOT_WATER_GAS_USAGE');
                `, [serialNum, `${startStr}000000`, `${endStr}235959`], lhd);
            } catch (error) {
                log.error(`${lhd} failed to get boiler gas usage. error: ${error.message}`);
                return modules.ckpush4.makeResponse('failed', null, tid);
            }

            if (!queryInfo.succ) {
                log.warn(`${lhd} << failed get boiler gas usage. failed to query stat data. err=[${queryInfo.err}]`);
                return modules.ckpush4.makeResponse('failed', null, tid);
            }

            log.debug(`${lhd} query result [${JSON.stringify(queryInfo)}]`);

            const { heat_gas_usage_sum, hot_water_gas_usage_sum } = queryInfo.data.rows[0];
            gasDetailItem.data = {
                total: `이번주 가스 사용량은 총 ${Number(heat_gas_usage_sum) + Number(hot_water_gas_usage_sum)}㎡이며,`,
                heating: `난방에 ${heat_gas_usage_sum}㎡,`,
                hotWater: `온수에 ${hot_water_gas_usage_sum}㎡ 사용했어요!`
            }
        }

        // 6) BRIEFING_TEMPERATURE_COMBINED
        const temperatureCombinedItem = pageData.find(item => item.type === 'BRIEFING_TEMPERATURE_COMBINED');
        if (temperatureCombinedItem && isPlainObject(temperatureCombinedItem.data)) {
            let queryInfo;
            try {
                queryInfo = await utils.postgresql.query('stat', `
                    SELECT
                        -- 1) HEAT room 평균
                        avg(value) FILTER (WHERE data_type = 'HEATING_ROOM_TEMP_AVG' AND value is not null) AS heating_room_temp_avg,
        
                        -- 1) HEAT floor 평균
                        avg(value) FILTER (WHERE data_type = 'HEATING_FLOOR_TEMP_AVG' AND value is not null) AS heating_floor_temp_avg,
        
                        -- 2) HOT_WATER 평균
                        avg(value) FILTER (WHERE data_type = 'HOT_WATER_TEMP_AVG' and value is not null ) AS hot_water_temp_avg
                    FROM public.tbl_stat_src2
                    WHERE serial_num = $1
                      AND stat_date >= $2
                      AND stat_date <= $3
                      AND data_type IN ('HEATING_ROOM_TEMP_AVG', 'HEATING_FLOOR_TEMP_AVG', 'HOT_WATER_TEMP_AVG');
                `, [serialNum, `${startStr}000000`, `${endStr}235959`], lhd);
            } catch (error) {
                log.error(`${lhd} failed to get avg setting temp. error: ${error.message}`);
                return modules.ckpush4.makeResponse('failed', null, tid);
            }

            if (!queryInfo.succ) {
                log.warn(`${lhd} << failed get avg setting temp. failed to query stat data. err=[${queryInfo.err}]`);
                return modules.ckpush4.makeResponse('failed', null, tid);
            }

            log.debug(`${lhd} query result [${JSON.stringify(queryInfo)}]`);

            const { heating_room_temp_avg, heating_floor_temp_avg, hot_water_temp_avg } = queryInfo.data.rows[0];


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

            const gaugeRoom = heating_room_temp_avg == null ? 0 : Math.round( (Number(heating_room_temp_avg) - roomMin) / (roomMax - roomMin) * 100 );
            const gaugeFloor = heating_floor_temp_avg == null ? 0 : Math.round( (Number(heating_floor_temp_avg) - floorMin) / (floorMax - floorMin) * 100 );

            log.debug(`${lhd} hot_water_temp_avg=[${hot_water_temp_avg}], waterMin=[${waterMin}], waterMax=[${waterMax}]`);
            const gaugeHotWater = Math.round( (Number(hot_water_temp_avg) - waterMin) / (waterMax - waterMin) * 100 );


            let floorText;
            let roomText;
            let hotwaterText;
            if (heating_floor_temp_avg) {
                if (heating_floor_temp_avg >= 30 && heating_floor_temp_avg < 41) {
                    floorText = '절약에 좋아요';
                } else if (heating_floor_temp_avg >= 41 && heating_floor_temp_avg < 51) {
                    floorText = '겨울에 따뜻한 온도에요';
                } else if (heating_floor_temp_avg >= 51) {
                    floorText = '주의! 너무 뜨거워요!';
                }
            }

            if (heating_room_temp_avg) {
                if (heating_room_temp_avg >= 18 && heating_room_temp_avg < 21) {
                    roomText = '절약에 좋아요';
                } else if (heating_room_temp_avg >= 21 && heating_room_temp_avg < 25) {
                    roomText = '겨울에 따뜻한 온도에요';
                } else if (heating_room_temp_avg >= 25) {
                    roomText = '주의! 너무 뜨거워요!';
                }
            }

            if (hot_water_temp_avg) {
                if (hot_water_temp_avg >= 30 && hot_water_temp_avg < 41) {
                    hotwaterText = '절약에 좋아요';
                } else if (hot_water_temp_avg >= 41 && hot_water_temp_avg < 46) {
                    hotwaterText = '피부 자극이 적은 온도에요';
                } else if (hot_water_temp_avg >= 46) {
                    hotwaterText = '주의! 너무 뜨거워요!';
                }
            }



            temperatureCombinedItem.data = {
                heating: heating_room_temp_avg ? {
                    title: "난방(실내) 평균",
                    subtitle: "사용 온도는",
                    temperature: `${Number(heating_room_temp_avg).toFixed(1)}°C`,
                    status: roomText,
                    gaugeValue: gaugeRoom
                } : undefined,
                floor: heating_floor_temp_avg ? {
                    title: "난방(온돌) 평균",
                    subtitle: "사용 온도는",
                    temperature: `${Number(heating_floor_temp_avg).toFixed(1)}°C`,
                    status: floorText,
                    gaugeValue: gaugeFloor
                } : undefined,
                hotWater: hot_water_temp_avg ? {
                    title: "온수 평균",
                    subtitle: "사용 온도는",
                    temperature: `${Number(hot_water_temp_avg).toFixed(1)}°C`,
                    status: hotwaterText,
                    gaugeValue: gaugeHotWater
                } : undefined,
            }
        }

        // 7) 예약/날씨 처리를 위해 mock 장비 데이터 로드 (메타 치환과는 무관)
        // const deviceData = await sUtils.getMockDeviceData(ctx, deviceId);
        //
        // // 8) BRIEFING_RESERVATION: 실제(모의) 예약 데이터 반영. 없으면 섹션 제거
        // const reservationItemIdx = pageData.findIndex(item => item.type === 'BRIEFING_RESERVATION');
        // if (reservationItemIdx !== -1) {
        //     if (!deviceData.reserve || deviceData.reserve.length <= 0) {
        //         pageData.splice(reservationItemIdx, 1);
        //     } else {
        //         const reservationItem = pageData[reservationItemIdx];
        //         const reservations = deviceData.reserve.map(reserve => ({
        //             timeRange: reserve.timeRange,
        //             schedule: reserve.schedule,
        //             mode: reserve.mode,
        //             temperature: `${reserve.temperature}℃`,
        //         }));
        //         reservationItem.data.reservations = reservations;
        //         reservationItem.data.title = `다음주 보일러 예약이 ${reservations.length}건 있습니다`;
        //     }
        // }
        //
        // // 9) 날씨 데이터: 내일 T1H < 0 이면 BRIEFING_FREEZE 추가
        // const getWeatherDataInfo = await ctx.utils.redis.sendCommand(
        //     'mock',
        //     'GET',
        //     [`${sValues.REDIS_KEY_PREFIX_WEATHER_DATA}${deviceId}.${ctx.utils.timestampToString(Date.now() + 86400 * 1000, 'YYYYMMDD')}`],
        //     true,
        //     ''
        // );
        // if (getWeatherDataInfo.succ && getWeatherDataInfo.data) {
        //     ctx.log.debug(`get weather data from redis. deviceId [${deviceId}]`);
        //     const weatherData = getWeatherDataInfo.data;
        //     if (Array.isArray(weatherData.data) && weatherData.data.length > 0) {
        //         for (const weatherInfo of weatherData.data) {
        //             if (weatherInfo.category !== 'T1H') continue;
        //
        //             if (Number(weatherInfo.obsrValue) < 0) {
        //                 pageData.push({
        //                     type: "BRIEFING_FREEZE",
        //                     data: {
        //                         title: `내일은 영하 ${Math.abs(Number(weatherInfo.obsrValue))}˚C까지 떨어져요`,
        //                         actionText: "동결 방지 모드 켜기>",
        //                         text: "동결 방지 모드를 켜두시면\n동파를 예방할 수 있습니다."
        //                     }
        //                 });
        //             }
        //             break;
        //         }
        //     }
        // } else {
        //     ctx.log.warn(`getWeatherDataInfo failed to read redis data. deviceId [${deviceId}], error [${getWeatherDataInfo.errMsg}]`);
        // }

        // 10) 완료
        return pageData;
    },
};

module.exports = async (ctx, src, packet, listener) => {
    const { log, modules, utils } = ctx;
    const tid = packet?.hd?.tid || `${Date.now()}`;
    const op = 'POST /aiot/stat/get-smart-briefing';
    let lhd = `[${src}:${tid}] ${op} -`;

    // listener는 http만 지원한다.
    if (listener.interface !== 'http') {
        log.info(`${lhd} << complete get smart briefing with nothing. not supported interface. exepected [http], actual [${listener.interface}]`);
        return { ckError: 'E001', ckMessage: 'Not supported interface' };
    }

    // reset lhd
    lhd = `[${src}:${tid}] ${op} -`;
    log.info(`${lhd} >> start get smart briefing. data [${JSON.stringify(packet.dt)}]`);

    const { cd, serialNum, briefDate } = packet.dt;
    const output = {
        data: [],
    };

    if (!cd) {
        log.warn(`${lhd} << failed get smart briefing. no mandatory value. key [cd]`);
        return modules.ckpush4.makeResponse('wrong_request', {
            message: 'no mandatory value. key [cd]',
        }, tid);
    }

    if (!serialNum) {
        log.warn(`${lhd} << failed get smart briefing. no mandatory value. key [serialNum]`);
        return modules.ckpush4.makeResponse('wrong_request', {
            message: 'no mandatory value. key [serialNum]',
        }, tid);
    }

    if (!briefDate) {
        log.warn(`${lhd} << failed get smart briefing. no mandatory value. key [briefDate]`);
        return modules.ckpush4.makeResponse('wrong_request', {
            message: 'no mandatory value. key [briefDate]',
        }, tid);
    }

    output.data = await sUtils.makePage(ctx, cd, { serialNum, briefDate }, lhd, tid);

    log.info(`${lhd} << complete get smart briefing`);
    return modules.ckpush4.makeResponse('success', output, tid);
};
