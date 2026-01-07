-- (선택) 기존 데이터 제거
-- DELETE FROM public.tbl_stat_src2 WHERE serial_num = 'CK:BO:IL:ER:00:01';

WITH params AS (
    SELECT 'CK:BO:IL:ER:00:01'::char(17) AS sn
),
-- 1시간 타임라인
     hours AS (
         SELECT
             gs AS ts,
             to_char(gs, 'YYYYMMDDHH24MISS')::char(14) AS stat_date,
             extract(month from gs)::int AS mon,
             extract(hour  from gs)::int AS hh,
             extract(dow   from gs)::int AS dow
         FROM generate_series(
                      timestamp '2025-01-01 00:00:00',
                      timestamp '2026-01-31 23:00:00',
                      interval  '1 hour'
              ) gs
     ),
-- 결정론 난수(0~1)
     rnd AS (
         SELECT
             h.*,
             -- 0..2^32-1 범위의 '부호 없는' 정수
             (('x'||substr(md5(to_char(h.ts,'YYYYMMDDHH24MISS')||'seed'),1,8))::bit(32)::bigint) AS rraw,
    -- 0.0 ~ 1.0 범위의 실수 (가중치용)
    ( (('x'||substr(md5(to_char(h.ts,'YYYYMMDDHH24MISS')||'seed'),1,8))::bit(32)::bigint)::double precision
      / 4294967295.0 ) AS r01
FROM hours h
    ),

/* =========================
   누적 “증분 -> 누적합” 방식
   ========================= */

-- 난방 누적은 10~4월에만 단조 증가, 최종 600
    heat_mark AS (
SELECT r.*,
    CASE WHEN r.mon IN (1,2,3,4,10,11,12) THEN 1 ELSE 0 END AS q
FROM rnd r
    ),
    heat_rank AS (
SELECT *,
    SUM(q) OVER ()                        AS H,      -- 증가 대상 총 시간
    SUM(q) OVER (ORDER BY ts)             AS rn      -- 지금까지의 대상 카운트
FROM heat_mark
    ),
    heat_step AS (
-- 현재 목표치 - 직전 목표치 = 이번 시간 증가량 (대상 아니면 0)
SELECT *,
    ( FLOOR(600.0 * rn / NULLIF(H,0))
    - FLOOR(600.0 * (rn - CASE WHEN q=1 THEN 1 ELSE 0 END) / NULLIF(H,0))
    )::int AS step
FROM heat_rank
    ),
    heat_acc AS (
SELECT stat_date, ts,
    SUM(step) OVER (ORDER BY ts) AS acc600   -- 0부터 서서히 증가, 절대 감소/리셋 X
FROM heat_step
    ),

-- 온수 누적은 피크시간(6~9, 18~22)에만 증가, 최종 200
    hw_mark AS (
SELECT r.*,
    CASE WHEN (r.hh BETWEEN 6 AND 9 OR r.hh BETWEEN 18 AND 22) THEN 1 ELSE 0 END AS q
FROM rnd r
    ),
    hw_rank AS (
SELECT *,
    SUM(q) OVER ()                        AS H,
    SUM(q) OVER (ORDER BY ts)             AS rn
FROM hw_mark
    ),
    hw_step AS (
SELECT *,
    ( FLOOR(200.0 * rn / NULLIF(H,0))
    - FLOOR(200.0 * (rn - CASE WHEN q=1 THEN 1 ELSE 0 END) / NULLIF(H,0))
    )::int AS step
FROM hw_rank
    ),
    hw_acc AS (
SELECT stat_date, ts,
    SUM(step) OVER (ORDER BY ts) AS acc200
FROM hw_step
    ),

/* ==========
   나머지 지표
   ========== */

-- 패킷(1~60) : 아침/저녁/주말 가중
    pk AS (
SELECT
    r.stat_date, r.ts,
    GREATEST(1, LEAST(60,
    ROUND(
    10
    + 40 * r.r01
    + CASE WHEN (r.hh BETWEEN 6 AND 9 OR r.hh BETWEEN 18 AND 22) THEN 8 ELSE -4 END
    + CASE WHEN r.dow IN (0,6) THEN 3 ELSE 0 END
    )
    ))::int AS v
FROM rnd r
    ),

-- 난방(실온) 평균온도: 10~4월=24, 5~9월=16
    heat_room AS (
SELECT r.stat_date, r.ts,
    CASE WHEN r.mon IN (5,6,7,8,9) THEN 16 ELSE 24 END::int AS t
FROM rnd r
    ),

-- 온수 평균온도: 정수부 36~38, 소수부 0~9
    hotwater_t AS (
SELECT
    r.stat_date, r.ts,
    (36 + (r.rraw % 3))::int      AS t_int,   -- 36~38
    (r.rraw % 10)::int            AS t_frac   -- 0~9
FROM rnd r
    )

-- ================== INSERT: 매 시간 7행 ==================
INSERT INTO public.tbl_stat_src2 (stat_date, serial_num, data_type, value, fvalue)
SELECT x.stat_date,
       p.sn,
       x.data_type::char(32),
    x.value::int,
    x.fvalue::int
FROM (
         SELECT r.stat_date, r.ts,
                v.data_type, v.value, v.fvalue
         FROM rnd r
                  JOIN heat_acc   ha ON ha.ts = r.ts
                  JOIN hw_acc     wa ON wa.ts = r.ts
                  JOIN pk         pk ON pk.ts = r.ts
                  JOIN heat_room  hr ON hr.ts = r.ts
                  JOIN hotwater_t ht ON ht.ts = r.ts
                  CROSS JOIN LATERAL (
             VALUES
                 ('PACKET_COUNT_INF',        pk.v,        0),
                 ('HEATING_COMBUSTION_ACC',  ha.acc600,   0),
                 ('HOT_WATER_COMBUSTION_ACC',wa.acc200,   0),
                 ('HEATING_GAS_USAGE_ACC',   ha.acc600,   0),
                 ('HOT_WATER_GAS_USAGE_ACC', wa.acc200,   0),
                 ('HEATING_ROOM_TEMP_AVG',   hr.t,        0),
                 ('HOT_WATER_TEMP_AVG',      ht.t_int,    ht.t_frac)
                 ) AS v(data_type, value, fvalue)
     ) x
         JOIN params p ON true;
