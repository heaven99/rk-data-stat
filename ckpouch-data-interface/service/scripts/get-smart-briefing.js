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
            "data": []
        },
        {
            "type": "BRIEFING_GAS_DETAIL",
            // "data": {
            //     "total": "이번주 가스 사용량은 총 9㎡이며,",
            //     "heating": "난방에 6㎡,",
            //     "hotWater": "온수에 3㎡ 사용했어요!"
            // },
            "data": []
        },
        {
            "type": "BRIEFING_TEMPERATURE_COMBINED",
            "data": {
                // "heating": {
                //     "title": "난방(실내온도) 평균",
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
                "heating": [],
                "hotWater": []
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

        return {
            startDate: start,
            endDate: end,
            startStr: sUtils.formatDateString(start),
            endStr: sUtils.formatDateString(end),
        };
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

    makePage: (ctx, cd, data, lhd) => {
        if (cd === sValues.PAGE_CD_SMART_BRIEFING_MAIN) {
            return sUtils.makePageForSmartBriefingMain(ctx, data.serialNum, data.briefDate, lhd);
        }

        ctx.log.warn(`makePage failed. not supported page cd. expected [${sValues.PAGE_CD_SMART_BRIEFING_MAIN}], actual [${cd}]`);
        return [];
    },

    makePageForSmartBriefingMain: async (ctx, serialNum, briefDate, lhd) => {
        const { log, utils, modules } = ctx;
        // 1) 기본 세팅
        const pageData = JSON.parse(JSON.stringify(sValues.PAGE_META_SMART_BRIEFING_MAIN));
        const { startDate, endDate, startStr, endStr } = sUtils.getBriefWeekRange(briefDate);

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

        // // 4) BRIEFING_GAS_COMPARISON
        // const gasComparisonItem = pageData.find(item => item.type === 'BRIEFING_GAS_COMPARISON');
        // if (gasComparisonItem && Array.isArray(gasComparisonItem.data)) {
        //     const arr = gasComparisonItem.data;
        //     if (arr.length === 12) {
        //         gasComparisonItem.data = arr[mockIdx] || arr[0];
        //     }
        // }
        //
        // // 5) BRIEFING_GAS_DETAIL
        // const gasDetailItem = pageData.find(item => item.type === 'BRIEFING_GAS_DETAIL');
        // if (gasDetailItem && Array.isArray(gasDetailItem.data)) {
        //     const arr = gasDetailItem.data;
        //     if (arr.length === 12) {
        //         gasDetailItem.data = arr[mockIdx] || arr[0];
        //     }
        // }
        //
        // // 6) BRIEFING_TEMPERATURE_COMBINED
        // const temperatureCombinedItem = pageData.find(item => item.type === 'BRIEFING_TEMPERATURE_COMBINED');
        // if (temperatureCombinedItem && temperatureCombinedItem.data) {
        //     const td = temperatureCombinedItem.data;
        //
        //     if (Array.isArray(td.heating) && td.heating.length === 12) {
        //         td.heating = td.heating[mockIdx] || td.heating[0];
        //     }
        //     if (Array.isArray(td.hotWater) && td.hotWater.length === 12) {
        //         td.hotWater = td.hotWater[mockIdx] || td.hotWater[0];
        //     }
        // }

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

    output.data = await sUtils.makePage(ctx, cd, { serialNum, briefDate }, lhd);

    log.info(`${lhd} << complete get smart briefing`);
    return modules.ckpush4.makeResponse('success', output, tid);
};
