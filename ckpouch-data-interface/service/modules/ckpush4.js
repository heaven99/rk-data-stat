const http = require('http');
const crypto = require('crypto');

const mValues = {
    CONTENT_TYPE_FORM_DATA: 'multipart/form-data',
};

module.exports = (ctx) => ({
    // ckpush4 signature
    checkSignature: async (apiSecret, signature, date, contentType, body, lhd) => {
        const { conf, log, utils } = ctx;
        if (
            conf['signature-backdoor']
            && conf['signature-backdoor'] === signature
        ) {
            return true;
        }

        const now = new Date();
        const nowTm = Math.floor(now.getTime() / 1000);
        let reqTm = null;

        try {
            reqTm = Math.floor(new Date(date).getTime() / 1000);
        } catch (e1) {
            log.warn(`${lhd} invalid date format. date [${date}]`);
            return false;
        }

        if (Math.abs(nowTm - reqTm) > Number(conf['request-time-period'])) {
            log.warn(`${lhd} compare client request time and server request time is too big. limit interval [${Number(conf['request-time-period'])}], request interval [${Math.abs(nowTm - reqTm)}], client request time [${utils.time.timestampToString(reqTm, 'YYYY/MM/DD HH:mm:ss', true)}], server time [${utils.time.timestampToString(nowTm, 'YYYY/MM/DD HH:mm:ss', true)}]`);
            return false;
        }

        // TODO check body

        return true;
    },

    // ckpush4 app
    findAppByApiKey: async (apiKey, lhd) => {
        const { log, utils, redis } = ctx;

        let app = null;

        const getMdbAppKey = `ckp4.app.${apiKey}`;
        const getMdbAppInfo = await utils.redis.sendCommand('core', 'GET', [getMdbAppKey], lhd);
        if (!getMdbAppInfo.succ) {
            log.error(`${lhd} failed find app from redis. err [${getMdbAppInfo.err}]`);
        }

        app = getMdbAppInfo.data;

        if (!app) {
            log.debug(`${lhd} not found app in redis. find app from mysql`);
            redisExist = false;

            const selectRdbAppFilter = [{ col: 'api_key', op: '=', val: apiKey }];
            const selectRdbAppInfo = await utils.mysql.select('core', 'ckpush4_core_db', 'tbl_app', null, selectRdbAppFilter, null, null, null, null, lhd);
            if (!selectRdbAppInfo.succ) {
                log.error(`${lhd} << failed find app. failed select tbl_app from mysql. err [${selectRdbAppInfo.err}]`);
                return selectRdbAppInfo;
            }

            app = selectRdbAppInfo.data[0];

            if (app) {
                const setMdbAppKey = `ckp4.app.${apiKey}`;
                const setMdbAppData = JSON.stringify(app);
                const setMdbAppInfo = await utils.redis.sendCommand('core', 'SET', [setMdbAppKey, setMdbAppData], lhd);
                if (!setMdbAppInfo.succ) {
                    log.warn(`${lhd} failed set app cache. err [${setMdbAppInfo.err}]`);
                }
            }
        }

        return {
            succ: true,
            data: app,
        };
    },

    // get request info
    getRequestInfo: async (req, lhd) => {
        const { utils, log } = ctx;
        const data = {
            apiType: null,
        };

        // validation
        if (!(req instanceof http.IncomingMessage)) {
            log.info(`${lhd} invalid req instance. expected [IncommingMessage], actual [${req?.constructor?.name}]`);
            return data;
        }

        // redis 에서 가져올 값 정리
        const keyMap = [];
        const getKeys = [];
        const appKey = req.headers['ck-tmp-app'];
        if (appKey) {
            keyMap.push('app');
            getKeys.push(appKey);
        }

        const userKey = req.headers['ck-tmp-user'];
        if (userKey) {
            keyMap.push('user');
            getKeys.push(userKey);
        }

        const companyKey = req.headers['ck-tmp-company'];
        if (companyKey) {
            keyMap.push('company');
            getKeys.push(companyKey);
        }

        const groupKey = req.headers['ck-tmp-group'];
        if (groupKey) {
            keyMap.push('group');
            getKeys.push(groupKey);
        }

        const tokenKey = req.headers['ck-tmp-rtoken'];
        if (tokenKey) {
            keyMap.push('token');
            getKeys.push(`ckp4.atoken.${tokenKey}`);
        }

        // get redis
        const getPromises = [];
        for (const key of getKeys) {
            getPromises.push(utils.redis.sendCommand('core', 'GET', [key], true, lhd));
        }
        const getDataInfo = await Promise.all(getPromises);
        log.verbose(`${lhd} get ckpush4 data from redis`);

        for (let i = 0; i < getDataInfo.length; i += 1) {
            const key = keyMap[i];
            const getKey = getKeys[i];
            const item = getDataInfo[i];
            if (!item.succ) {
                log.warn(`${lhd} failed get data from redis. key [${getKey}], err [${item.err}]`);
                continue;
            }

            if (
                key === 'app'
                && data.apiType !== 'Bearer'
            ) {
                data.apiType = 'Open';
            }

            if (key === 'token') {
                data.apiType = 'Bearer';
            }

            data[keyMap[i]] = item.data;
        }

        // if (!getDataInfo.succ) {
        //     log.error(`${lhd} failed get ckpush4 request info. failed get data from redis. err [${getDataInfo.err}]`);
        //     return data;
        // }


        // for (const item of getDataInfo.data) {
        //     console.log(item);
        // }

        return data;
    },

    /**
     * @name makeResponse
     * @description web server api response 를 생성한다
     * @param {string} code error code defined in ckpouch-codes
     * @param {object | null} resBody response body
     * @param {string?} tid transaction id
     * @param {object?} option
     * @param {string?} option.lang language for error message. default en
     * @param {string?} option.message custom message
     * @return {{ckTid: string, ckError: string, ckMessage: string, data: object | null}}
     */
    makeResponse: (code, resBody, tid, option = {}) => {
        const { log } = ctx;
        const { codes } = ctx.modules;
        const lhd = `[${tid}] makeResponse -`;
        let _lang = option.lang || 'en';
        let _code = codes[code];
        let _message = option.message;
        if (!_code) {
            log.warn(`${lhd} invalid error code. code [${code}], set code to success`);
            _code = codes.success;
        }

        if (!_message) {
            if (!_code.message[_lang]) {
                if (_.has(_code.message, 'en')) {
                    _lang = 'en';
                } else if (_.size(_code.message) > 0) {
                    [_lang] = _.keys(_code.message);
                } else {
                    _lang = '';
                }

                log.warn(`${lhd} no message found. set language [${_lang}], code [${code}]`);
            }

            if (_lang) {
                _message = _code.message[_lang];
            }
        }

        return {
            ckTid: tid,
            ckError: _code.code,
            ckMessage: _message,
            data: resBody,
            //...resBody,
        };
    },

    /**
     * @name convertUTC
     * @description DB에서 넘어올때 UTC 시간으로 중복 변환된 것을 다시 변환함.
     * @param utcDate
     */
    convertUTC: (utcDate) => {
        if (utcDate == null || utcDate == undefined) {
            return null;
        }

        const dateObj = new Date(utcDate);
        const seoulTime = new Date(dateObj.getTime() + (9 * 60 * 60 * 1000));

        return seoulTime;
    },

    unixToTimestamp: (dateVal) => {
        if (!dateVal) return null;
        if (typeof dateVal === 'number') {
            return new Date(dateVal * 1000).toISOString();
        }
        const d = new Date(dateVal);
        return d.toISOString();
    },

    generateShortUUID: () => {
        return crypto.randomBytes(8).toString('hex');
    },

    ras: {
        /**
         * send push to user
         * @param {string} tid transaction id
         * @param {string} type push type
         * @param {string} countryGb country code
         * @param {object} filter filter
         * @param {string} title title
         * @param {string} message message
         * @param {string} lhd log header
         * @returns 
         */
        sendPush: async (tid, groupCd, typeCd, agentKey, filter, title, msg, extra, lhd) => {
            const { utils } = ctx;
            const data = {
                app_id: 'rinnai',
                pid: 'ES',
                et: 'push-send',
                tid,
                ctime: Math.floor(Date.now() / 1000),
                ud: {
                    groupCd,
                    typeCd,
                    agentKey,
                    filter,
                    title,
                    msg,
                    extra,
                },
            };

            const sendPushInfo = await utils.redis.sendCommand('ras', 'rpush', ['queue.event', JSON.stringify(data)], lhd);
            return sendPushInfo;
        },

        pushEvent: async (appId, et, tid, ud, lhd) => {
            const { utils } = ctx;
            const data = {
                app_id: appId,
                pid: 'ES',
                et,
                tid,
                ctime: Math.floor(Date.now() / 1000),
                ud,
            };

            const sendPushInfo = await utils.redis.sendCommand('ras', 'rpush', ['queue.event', JSON.stringify(data)], lhd);
            return sendPushInfo;
        },
    },
});