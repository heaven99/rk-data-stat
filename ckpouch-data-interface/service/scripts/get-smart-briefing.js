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

    makePage: (ctx, cd, data) => {
        if (cd === sValues.PAGE_CD_SMART_BRIEFING_MAIN) {
            return sUtils.makePageForSmartBriefingMain(ctx, data.deviceId);
        }

        ctx.log.warn(`makePage failed. not supported page cd. expected [${sValues.PAGE_CD_SMART_BRIEFING_MAIN}], actual [${cd}]`);
        return [];
    },

    // makePageForSmartBriefingMain: async (ctx, deviceId) => {
    //     // define variables
    //     const pageData = JSON.parse(JSON.stringify(sValues.PAGE_META_SMART_BRIEFING_MAIN));
    //     const { sunday: startDate, saturday: endDate } = sUtils.getThisWeekRange();
    //
    //     // set date range
    //     // 이번 주 범위 계산
    //     const includeEndDayMonth = startDate.getMonth() !== endDate.getMonth();
    //     let weekDayString = '';
    //     weekDayString += `${startDate.getMonth() + 1}월 ${startDate.getDate()}일`;
    //     weekDayString += ' - ';
    //     weekDayString += includeEndDayMonth ? `${endDate.getMonth() + 1}월 ${endDate.getDate()}일` : `${endDate.getDate()}일`;
    //
    //     pageData[0].data.dateRange = weekDayString;
    //
    //     // mock 데이터 추출
    //     const deviceData = await sUtils.getMockDeviceData(ctx, deviceId);
    //
    //     // 데이터를 기반으로 BRIEFING_USAGE_CHART 항목을 채운다.
    //     // 사용 횟수는 시간별 데이터의 used 가 true 이면 1회로 간주하여 합산한다.
    //     const usageChartItem = pageData.find(item => item.type === 'BRIEFING_USAGE_CHART');
    //     if (usageChartItem) {
    //         const chartData = [];
    //         const hourUsedMap = {};
    //         let peakHourIndex = 0;
    //         let peakHourValue = 0;
    //
    //         // 이게 왜 1 만 나오지?
    //         for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    //             const dateKey = ctx.utils.timestampToString(d, 'YYYYMMDD');
    //             for (let h = 0; h < 24; h++) {
    //                 const hourKey = String(h).padStart(2, '0');
    //                 if (!hourUsedMap[hourKey]) {
    //                     hourUsedMap[hourKey] = 0;
    //                 }
    //                 const hourData = deviceData.history?.[dateKey]?.[hourKey] || { used: false };
    //                 const value = hourData.used ? 1 : 0;
    //                 hourUsedMap[hourKey] += value;
    //                 // ctx.log.debug(`hourUsedMap update. hourKey [${hourKey}], orig [${hourData.used}], value [${value}], hourUsedMap[hourKey] [${hourUsedMap[hourKey]}]`);
    //             }
    //         }
    //
    //         for (let h = 0; h < 24; h++) {
    //             const hourKey = String(h).padStart(2, '0');
    //             const value = hourUsedMap[hourKey];
    //             chartData.push({ hour: h, value });
    //
    //             if (value > peakHourValue) {
    //                 peakHourValue = value;
    //                 peakHourIndex = h;
    //             }
    //         }
    //
    //         usageChartItem.data.chartData = chartData;
    //         usageChartItem.data.peakHourIndex = peakHourIndex;
    //     }
    //
    //     // TODO 데이터를 기반으로 BRIEFING_GAS_COMPARISON 항목을 채운다.
    //     // 이번 주 전체 가스 사용량과 지난 주 전체 가스 사용량을 계산하여 채운다.
    //     const gasComparisonItem = pageData.find(item => item.type === 'BRIEFING_GAS_COMPARISON');
    //     if (gasComparisonItem) {
    //         let thisWeekTotal = 0;
    //         let lastWeekTotal = 0;
    //
    //         // 이번 주 계산
    //         for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    //             const dateKey = ctx.utils.timestampToString(d, 'YYYYMMDD');
    //             for (let h = 0; h < 24; h++) {
    //                 const hourKey = String(h).padStart(2, '0');
    //                 const hourData = deviceData.history?.[dateKey]?.[hourKey] || { heatingGasUsage: 0, hotWaterGasUsage: 0 };
    //                 thisWeekTotal += hourData.heatingGasUsage + hourData.hotWaterGasUsage;
    //             }
    //         }
    //
    //         // 지난 주 계산
    //         const lastWeekSunday = new Date(startDate);
    //         lastWeekSunday.setDate(startDate.getDate() - 7);
    //         const lastWeekSaturday = new Date(endDate);
    //         lastWeekSaturday.setDate(endDate.getDate() - 7);
    //
    //         for (let d = new Date(lastWeekSunday); d <= lastWeekSaturday; d.setDate(d.getDate() + 1)) {
    //             const dateKey = ctx.utils.timestampToString(d, 'YYYYMMDD');
    //             for (let h = 0; h < 24; h++) {
    //                 const hourKey = String(h).padStart(2, '0');
    //                 const hourData = deviceData.history?.[dateKey]?.[hourKey] || { heatingGasUsage: 0, hotWaterGasUsage: 0 };
    //                 lastWeekTotal += hourData.heatingGasUsage + hourData.hotWaterGasUsage;
    //             }
    //         }
    //
    //         gasComparisonItem.data.thisWeekValue = thisWeekTotal;
    //         gasComparisonItem.data.lastWeekValue = lastWeekTotal;
    //     }
    //
    //     // TODO 데이터를 기반으로 BRIEFING_GAS_DETAIL 항목을 채운다.
    //     // 이번 주 난방 가스 사용량과 온수 가스 사용량을 계산하여 채운다.
    //     const gasDetailItem = pageData.find(item => item.type === 'BRIEFING_GAS_DETAIL');
    //     if (gasDetailItem) {
    //         let heatingTotal = 0;
    //         let hotWaterTotal = 0;
    //
    //         // 이번 주 계산
    //         for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    //             const dateKey = ctx.utils.timestampToString(d, 'YYYYMMDD');
    //             for (let h = 0; h < 24; h++) {
    //                 const hourKey = String(h).padStart(2, '0');
    //                 const hourData = deviceData.history?.[dateKey]?.[hourKey] || { heatingGasUsage: 0, hotWaterGasUsage: 0 };
    //                 heatingTotal += hourData.heatingGasUsage;
    //                 hotWaterTotal += hourData.hotWaterGasUsage;
    //             }
    //         }
    //         gasDetailItem.data.total = `이번주 가스 사용량은 총 ${heatingTotal + hotWaterTotal}㎡이며,`;
    //         gasDetailItem.data.heating = `난방에 ${heatingTotal}㎡,`;
    //         gasDetailItem.data.hotWater = `온수에 ${hotWaterTotal}㎡ 사용했어요!`;
    //     }
    //
    //
    //     // TODO 데이터를 기반으로 BRIEFING_TEMPERATURE_COMBINED 항목을 채운다.
    //     const temperatureCombinedItem = pageData.find(item => item.type === 'BRIEFING_TEMPERATURE_COMBINED');
    //     if (temperatureCombinedItem) {
    //         let heatingTempSum = 0;
    //         let heatingTempCount = 0;
    //         let hotWaterTempSum = 0;
    //         let hotWaterTempCount = 0;
    //
    //         // 이번 주 계산
    //         for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    //             const dateKey = ctx.utils.timestampToString(d, 'YYYYMMDD');
    //             for (let h = 0; h < 24; h++) {
    //                 const hourKey = String(h).padStart(2, '0');
    //                 const hourData = deviceData.history?.[dateKey]?.[hourKey];
    //                 if (hourData) {
    //                     if (hourData.heatingSetTemp) {
    //                         heatingTempSum += hourData.heatingSetTemp;
    //                         heatingTempCount++;
    //                     }
    //                     if (hourData.hotWaterSetTemp) {
    //                         hotWaterTempSum += hourData.hotWaterSetTemp;
    //                         hotWaterTempCount++;
    //                     }
    //                 }
    //             }
    //         }
    //
    //         const heatingAvgTemp = heatingTempCount ? Math.round(heatingTempSum / heatingTempCount) : 0;
    //         const hotWaterAvgTemp = hotWaterTempCount ? Math.round(hotWaterTempSum / hotWaterTempCount) : 0;
    //
    //         temperatureCombinedItem.data.heating.temperature = `${heatingAvgTemp}°C`;
    //         temperatureCombinedItem.data.hotWater.temperature = `${hotWaterAvgTemp}°C`;
    //     }
    //
    //     // TODO 데이터를 기반으로 BRIEFING_RESERVATION 항목을 채운다.
    //     const reservationItemIdx = pageData.findIndex(item => item.type === 'BRIEFING_RESERVATION');
    //     if (reservationItemIdx !== -1) {
    //         if (!deviceData.reserve || deviceData.reserve.length <= 0) {
    //             // 예약이 없으면 항목 자체를 제거
    //             pageData.splice(reservationItemIdx, 1);
    //         } else {
    //             const reservationItem = pageData[reservationItemIdx];
    //             const reservations = deviceData.reserve.map(reserve => ({
    //                 timeRange: reserve.timeRange,
    //                 schedule: reserve.schedule,
    //                 mode: reserve.mode,
    //                 temperature: `${reserve.temperature}℃`,
    //             }));
    //             reservationItem.data.reservations = reservations;
    //             reservationItem.data.title = `다음주 보일러 예약이 ${reservations.length}건 있습니다`;
    //         }
    //     }
    //
    //     // get weather data
    //     // 내일 날짜의 날씨 데이터를 가져온다.
    //     const getWeatherDataInfo = await ctx.utils.redis.sendCommand('mock', 'GET', [`${sValues.REDIS_KEY_PREFIX_WEATHER_DATA}${deviceId}.${ctx.utils.timestampToString(Date.now() + 86400 * 1000, 'YYYYMMDD')}`], true, '');
    //     if (getWeatherDataInfo.succ && getWeatherDataInfo.data) {
    //         ctx.log.debug(`get weather data from redis. deviceId [${deviceId}]`);
    //         const weatherData = getWeatherDataInfo.data;
    //         if (weatherData.data.length > 0) {
    //             for (const weatherInfo of weatherData.data) {
    //                 if (weatherInfo.category !== 'T1H') {
    //                     continue;
    //                 }
    //
    //                 if (Number(weatherInfo.obsrValue) < 0) {
    //                     pageData.push({
    //                         "type": "BRIEFING_FREEZE",
    //                         "data": {
    //                             "title": `내일은 영하 ${Math.abs(Number(weatherInfo.obsrValue))}˚C까지 떨어져요`,
    //                             "actionText": "동결 방지 모드 켜기>",
    //                             "text": "동결 방지 모드를 켜두시면\n동파를 예방할 수 있습니다."
    //                         }
    //                     })
    //                 }
    //
    //                 break;
    //             }
    //         }
    //         // TODO 날씨 데이터를 기반으로 페이지의 일부 항목을 수정할 수 있다.
    //     } else {
    //         ctx.log.warn(`getWeatherDataInfo failed to read redis data. deviceId [${deviceId}], error [${getWeatherDataInfo.errMsg}]`);
    //     }
    //
    //     return pageData;
    // },

    makePageForSmartBriefingMain: async (ctx, deviceId) => {
        // 1) 기본 세팅
        const pageData = JSON.parse(JSON.stringify(sValues.PAGE_META_SMART_BRIEFING_MAIN));
        const { startDate, endDate } = sUtils.getBriefWeekRange();

        // 2) 헤더 날짜 범위 표시
        const includeEndDayMonth = startDate.getMonth() !== endDate.getMonth();
        let weekDayString = '';
        weekDayString += `${startDate.getMonth() + 1}월 ${startDate.getDate()}일`;
        weekDayString += ' - ';
        weekDayString += includeEndDayMonth ? `${endDate.getMonth() + 1}월 ${endDate.getDate()}일` : `${endDate.getDate()}일`;
        if (pageData[0]?.type === 'BRIEFING_HEADER') {
            pageData[0].data.dateRange = weekDayString;
        }

        // 3) BRIEFING_USAGE_CHART: 12개 중 mockIdx 하나만 사용 + 해당 데이터로 peakHourIndex 재계산
        const usageChartItem = pageData.find(item => item.type === 'BRIEFING_USAGE_CHART');
        if (usageChartItem && usageChartItem.data && Array.isArray(usageChartItem.data.chartData)) {
            const raw = usageChartItem.data.chartData;
            // 메타가 [ [24시간], [24시간], ... x12 ] 형태일 때만 처리
            if (Array.isArray(raw) && raw.length === 12 && Array.isArray(raw[0])) {
                const selected = raw[mockIdx] || raw[0];
                usageChartItem.data.chartData = selected;

                // 피크 시간 재계산
                let peakHourIndex = 0;
                let peakHourValue = -1;
                for (const { hour, value } of selected) {
                    if (value > peakHourValue) {
                        peakHourValue = value;
                        peakHourIndex = hour;
                    }
                }
                usageChartItem.data.peakHourIndex = peakHourIndex;


                // ✅ peakHourIndex에 맞춰 메시지도 갱신
                const toKoreanHour = (h) => {
                    const period = h < 12 ? '오전' : '오후';
                    const h12 = h % 12 === 0 ? 12 : h % 12;
                    return `${period} ${h12}시`;
                };
                usageChartItem.data.message = `${toKoreanHour(peakHourIndex)}에 보일러를\n자주 사용했어요!`;
            }
        }

        // 4) BRIEFING_GAS_COMPARISON: 12개 배열 중 mockIdx 하나만 남김
        const gasComparisonItem = pageData.find(item => item.type === 'BRIEFING_GAS_COMPARISON');
        if (gasComparisonItem && Array.isArray(gasComparisonItem.data)) {
            const arr = gasComparisonItem.data;
            if (arr.length === 12) {
                gasComparisonItem.data = arr[mockIdx] || arr[0];
            }
        }

        // 5) BRIEFING_GAS_DETAIL: 12개 배열 중 mockIdx 하나만 남김
        const gasDetailItem = pageData.find(item => item.type === 'BRIEFING_GAS_DETAIL');
        if (gasDetailItem && Array.isArray(gasDetailItem.data)) {
            const arr = gasDetailItem.data;
            if (arr.length === 12) {
                gasDetailItem.data = arr[mockIdx] || arr[0];
            }
        }

        // 6) BRIEFING_TEMPERATURE_COMBINED: heating/hotWater 각각 12개 배열 → mockIdx 단일 객체
        const temperatureCombinedItem = pageData.find(item => item.type === 'BRIEFING_TEMPERATURE_COMBINED');
        if (temperatureCombinedItem && temperatureCombinedItem.data) {
            const td = temperatureCombinedItem.data;

            if (Array.isArray(td.heating) && td.heating.length === 12) {
                td.heating = td.heating[mockIdx] || td.heating[0];
            }
            if (Array.isArray(td.hotWater) && td.hotWater.length === 12) {
                td.hotWater = td.hotWater[mockIdx] || td.hotWater[0];
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

// no script state
const sState = {};

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

    // get ckp4 data
    const { req } = listener;
    const getRequestInfo = await modules.ckpush4.getRequestInfo(req, lhd);
    const { apiType, app, user, group, company, token } = getRequestInfo;
    if (apiType !== modules.values.API_TYPE_BEARER) {
        log.warn(`${lhd} << failed get smart briefing. not support api type. expected [${modules.values.API_TYPE_BEARER}], actual [${apiType}]`);
        return { ckError: 'E001', ckMessage: 'Wrong request', data: [] };
    }

    // reset lhd
    lhd = `[${user?.user_id || src}:${tid}] ${op} -`;
    log.info(`${lhd} >> start get smart briefing. data [${JSON.stringify(packet.dt)}]`);

    const { filter = {} } = packet.dt;
    const { cd, serialNum, briefDate } = filter;
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

    output.data = await sUtils.makePage(ctx, cd, { serialNum });

    log.info(`${lhd} << complete get smart briefing`);
    return modules.ckpush4.makeResponse('success', output, tid);
};
