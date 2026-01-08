module.exports = () => ({
    // 성공
    success: {
        code: 'S000001',
        message: {
            en: 'Success',
            ko: '성공',
        },
    },
    // 실패 - 특별한 사유를 보낼게 아니면 기본적으로 사용
    failed: {
        code: 'E000001',
        message: {
            en: 'Failed',
            ko: '실패',
        },
    },
    // 인증 실패
    invalid_auth: {
        code: 'E000004',
        message: {
            en: 'Authorization failed',
            ko: '인증 실패',
        },
    },
    // 잘못된 요청
    wrong_request: {
        code: 'E000005',
        message: {
            en: 'Wrong request',
            ko: '잘못된 요청입니다',
        },
    },
    payload_too_large: {
        code: 'E000006',
        message: {
            en: 'Payload too large',
            ko: '요청 데이터 용량 초과',
        },
    },
    db_error: {
        code: 'E000007',
        message: {
            en: 'Server error',
            ko: '서버 에러',
        },
    },
    redis_error: {
        code: 'E000008',
        message: {
            en: 'Server error',
            ko: '서버 에러',
        },
    },
    pause_user: {
        code: 'E000009',
        message: {
            en: 'Pause user',
            ko: '정지된 유저',
        },
    },
    // Too many request
    too_many_request: {
        code: 'E000013',
        msg: {
            en: 'Too many request',
            ko: '요청이 너무 많습니다.',
        },
    },
    // 데이터 없음
    not_found_data: {
        code: 'E000021',
        message: {
            en: 'Not found data',
            ko: '데이터를 찾을 수 없습니다',
        },
    },
    // 데이터 중복
    duplicate_data: {
        code: 'E000022',
        message: {
            en: 'Duplicated data',
            ko: '중복된 데이터입니다',
        },
    },
});