-- (선택) 기존 데이터 제거
-- DELETE FROM public.tbl_stat_src2 WHERE serial_num = 'CK:BO:IL:ER:00:01';

WITH params AS (
    SELECT 'CK:BO:IL:ER:00:01'::char(17) AS sn
),

/* 1시간 타임라인 */
     hours AS (
         SELECT
             gs AS ts,
             to_char(gs, 'YYYYMMDDHH24MISS')::char(14) AS stat_date,
             extract(month from gs)::int AS mon,
             extract(hour  from gs)::int AS hh,
             extract(dow   from gs)::int AS dow,
             extract(doy   from gs)::int AS doy
         FROM generate_series(
                      timestamp '2025-01-01 00:00:00',
                      timestamp '2026-01-31 23:00:00',
                      interval  '1 hour'
              ) gs
     ),

/* 결정론 난수: 같은 ts면 항상 같은 값 */
     rnd AS (
         SELECT
             h.*,

             -- 0..2^32-1 범위의 '부호 없는' 정수
             (('x'||substr(md5(to_char(h.ts,'YYYYMMDDHH24MISS')||'seed1'),1,8))::bit(32)::bigint) AS rraw1,
        (('x'||substr(md5(to_char(h.ts,'YYYYMMDDHH24MISS')||'seed2'),1,8))::bit(32)::bigint) AS rraw2,

        -- 0.0 ~ 1.0 실수
        ((('x'||substr(md5(to_char(h.ts,'YYYYMMDDHH24MISS')||'seed1'),1,8))::bit(32)::bigint)::double precision
          / 4294967295.0) AS r01,

        ((('x'||substr(md5(to_char(h.ts,'YYYYMMDDHH24MISS')||'seed2'),1,8))::bit(32)::bigint)::double precision
          / 4294967295.0) AS r02
FROM hours h
    ),

/* =========================
   난방 (10~3월만 사용)
   - 추울수록(겨울 피크) 확률↑
   - 새벽/저녁에 약간↑
   - 결과는 시간당 0/1
   ========================= */
    heating_prob AS (
SELECT
    r.*,

    -- 겨울(1월 중순) 최대, 여름(7월 중순) 최소로 만드는 "추움 지수" 0~1
    -- cos는 1월중순쯤(약 doy=15)에서 1, 7월중순쯤에서 -1
    ((1.0 + cos(2.0*pi() * ((r.doy - 15)::double precision / 365.0))) / 2.0) AS cold01,

    -- 시간대 가중치: 새벽/저녁 약간 가산
    CASE
    WHEN r.hh BETWEEN 5 AND 8  THEN 0.10
    WHEN r.hh BETWEEN 18 AND 23 THEN 0.15
    ELSE 0.00
    END AS tod_w
FROM rnd r
    ),

    heating_use AS (
SELECT
    stat_date, ts,

    CASE
    WHEN mon IN (10,11,12,1,2,3) THEN
    CASE
    -- 기본확률 = 추움지수 기반 + 시간대 가중 + 바닥확률
    WHEN r01 < LEAST(0.95, GREATEST(0.00, (0.05 + (cold01 * 0.75) + tod_w)))
    THEN 1 ELSE 0
    END
    ELSE 0
    END::int AS v
FROM heating_prob
    ),

/* =========================
   온수 (아침/저녁 위주)
   - 0이 쭉 가다가, "샤워가 몰리는 시간대"에 1이 가끔 뜨는 패턴
   - 결과는 시간당 0/1
   ========================= */
    hotwater_use AS (
SELECT
    r.stat_date, r.ts,

    CASE
    WHEN (r.hh BETWEEN 6 AND 9) THEN
    CASE WHEN r02 < (CASE WHEN r.dow IN (0,6) THEN 0.35 ELSE 0.25 END) THEN 1 ELSE 0 END
    WHEN (r.hh BETWEEN 18 AND 22) THEN
    CASE WHEN r02 < (CASE WHEN r.dow IN (0,6) THEN 0.28 ELSE 0.18 END) THEN 1 ELSE 0 END
    ELSE
    -- 비피크 시간은 거의 0 (가끔 설거지/손씻기 같은 이벤트)
    CASE WHEN r02 < 0.01 THEN 1 ELSE 0 END
    END::int AS v
FROM rnd r
    ),

/* =========================
   평균온도 (기존 방식 유지)
   ========================= */
    heat_room AS (
SELECT r.stat_date, r.ts,
    CASE WHEN r.mon IN (5,6,7,8,9) THEN 16 ELSE 24 END::int AS t
FROM rnd r
    ),

    hotwater_t AS (
SELECT
    r.stat_date, r.ts,
    (36 + (r.rraw1 % 3))::int AS t_int,   -- 36~38
    (r.rraw1 % 10)::int       AS t_frac   -- 0~9
FROM rnd r
    )

-- ================== INSERT: 매 시간 6행 ==================
INSERT INTO public.tbl_stat_src2 (stat_date, serial_num, data_type, value, fvalue)
SELECT
    x.stat_date,
    p.sn,
    x.data_type::char(32),
    x.value::int,
    x.fvalue::int
FROM (
         SELECT r.stat_date, r.ts, v.data_type, v.value, v.fvalue
         FROM rnd r
                  JOIN heating_use hu ON hu.ts = r.ts
                  JOIN hotwater_use wu ON wu.ts = r.ts
                  JOIN heat_room  hr ON hr.ts = r.ts
                  JOIN hotwater_t ht ON ht.ts = r.ts
                  CROSS JOIN LATERAL (
             VALUES
                 ('HEATING_COMBUSTION',     hu.v,     0),
                 ('HOT_WATER_COMBUSTION',   wu.v,     0),
                 ('HEATING_GAS_USAGE',      hu.v,     0),
                 ('HOT_WATER_GAS_USAGE',    wu.v,     0),
                 ('HEATING_ROOM_TEMP_AVG',  hr.t,     0),
                 ('HOT_WATER_TEMP_AVG',     ht.t_int, ht.t_frac)
                 ) AS v(data_type, value, fvalue)
     ) x
         JOIN params p ON true;
