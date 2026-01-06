/**
 * tbl_device
 * device master table (backup/sync capable)
 */

-- drop table
DROP TABLE IF EXISTS public.tbl_device;

-- create table
CREATE TABLE public.tbl_device (
    id              BIGINT GENERATED ALWAYS AS IDENTITY,
    sync_date       TIMESTAMP,
    group_cd        CHAR(3) DEFAULT '',
    group_type_cd   CHAR(2) DEFAULT '',
    device_id       INTEGER NOT NULL DEFAULT 0,
    serial_num      CHAR(17) NOT NULL,
    lat             DOUBLE PRECISION,
    lon             DOUBLE PRECISION,
    c_date          TIMESTAMP
);

-- table comment
COMMENT ON TABLE public.tbl_device IS 'device master table (created from source table backup/sync purpose)';

-- column comments
COMMENT ON COLUMN public.tbl_device.id IS 'surrogate key (identity)';
COMMENT ON COLUMN public.tbl_device.sync_date IS 'backup/sync datetime copied from source table';
COMMENT ON COLUMN public.tbl_device.group_cd IS 'device group cd';
COMMENT ON COLUMN public.tbl_device.group_type_cd IS 'device group type cd';
COMMENT ON COLUMN public.tbl_device.device_id IS 'device numeric id (non-negative)';
COMMENT ON COLUMN public.tbl_device.serial_num IS 'device serial number';
COMMENT ON COLUMN public.tbl_device.lat IS 'latitude (unsigned semantics)';
COMMENT ON COLUMN public.tbl_device.lon IS 'longitude (unsigned semantics)';
COMMENT ON COLUMN public.tbl_device.c_date IS 'device created datetime (timestamp without timezone)';

-- index
CREATE INDEX idx_tbl_device_sync_date_serial_num ON public.tbl_device (sync_date,serial_num);

COMMENT ON INDEX public.idx_tbl_device_sync_date_serial_num IS 'index for device lookup by serial number';

-- primary key
ALTER TABLE public.tbl_device ADD CONSTRAINT pk_tbl_device PRIMARY KEY (id);

/**
 * tbl_device_his_inf
 */
DROP TABLE public.tbl_device_his_inf;

-- create table
CREATE TABLE public.tbl_device_his_inf (
    id         BIGINT GENERATED ALWAYS AS IDENTITY,
    device_id  INTEGER NOT NULL DEFAULT 0,
    serial_num CHAR(17) NOT NULL,
    topic      VARCHAR(128) NOT NULL,
    orig_data  JSONB,
    c_date     TIMESTAMP
);

-- add comment for column
COMMENT ON TABLE public.tbl_device_his_inf IS 'device history information raw log table';
COMMENT ON COLUMN public.tbl_device_his_inf.id IS 'surrogate key (identity), primary key will be added later';
COMMENT ON COLUMN public.tbl_device_his_inf.device_id IS 'device numeric id (non-negative)';
COMMENT ON COLUMN public.tbl_device_his_inf.serial_num IS 'device serial number';
COMMENT ON COLUMN public.tbl_device_his_inf.topic IS 'mqtt topic';
COMMENT ON COLUMN public.tbl_device_his_inf.orig_data IS 'original raw payload data';
COMMENT ON COLUMN public.tbl_device_his_inf.c_date IS 'log created datetime (timestamp without timezone)';

-- add index
CREATE INDEX idx_tbl_device_his_inf_c_date_serial_num ON public.tbl_device_his_inf (c_date, serial_num);

-- add comment for index
COMMENT ON INDEX public.idx_tbl_device_his_inf_c_date_serial_num IS 'index for device history query by c_date, serial_num';

-- add pk
-- check pk uniqueness
SELECT COUNT(*) AS total_cnt, COUNT(DISTINCT id) AS distinct_id_cnt FROM public.tbl_device_his_inf;

-- add pk
ALTER TABLE public.tbl_device_his_inf ADD CONSTRAINT pk_tbl_device_his_inf PRIMARY KEY (id);




/**
 * create enum (db 에 귀속되며 모든 enum은 여기에 정의된다.
 */
-- create enum
CREATE TYPE enum_on_off AS ENUM ('OFF', 'ON');
CREATE TYPE enum_lock_unlock AS ENUM ('Lock', 'Unlock');
CREATE TYPE enum_mode AS ENUM ('OFF', 'SAVE', 'AUTO', '정음', '정음+SAVE', '정음+AUTO', '살균');
CREATE TYPE enum_heating_type AS ENUM ('온돌', '실온');
CREATE TYPE enum_exist AS ENUM ('없음', '있음');
CREATE TYPE enum_control_action AS ENUM ('조작없음', 'ON', 'OFF');
CREATE TYPE enum_control_action2 AS ENUM ('조작없음', '조작&변경있음');
CREATE TYPE enum_control_action3 AS ENUM ('조작없음', 'AUTO ON', 'AUTO OFF', 'SAVE ON', 'SAVE OFF', '정음+SAVE ON', '정음+SAVE OFF', '정음+AUTO ON', '정음+AUTO OFF', '정음 ON', '정음 OFF');
CREATE TYPE enum_reserve_info AS ENUM ('미사용', '표준', '공동', '절약', '개인설정1', '개인설정2');
CREATE TYPE enum_reserve_type AS ENUM ('일반예약', '24시간예약');
CREATE TYPE enum_heating_on_mode AS ENUM ('라디에이터', '바닥난방', '난방전용', 'TH', 'TS');
CREATE TYPE enum_device_type AS ENUM ('온수건조기', '가스렌지', '보일러', '정수기', '식기소독보관고');
CREATE TYPE enum_user_status AS ENUM ('통상', '등록정보Reset');
CREATE TYPE enum_gas_measure_unit AS ENUM ('m3', 'kg');




/**
 * tbl_device_his_inf
 */
DROP TABLE public.tbl_his_inf_parsed;

-- create table
CREATE TABLE public.tbl_his_inf_parsed (
   serial_num                                       CHAR(17) NOT NULL,
   stat_date                                        CHAR(14) NOT NULL,
   power_status                                     public.enum_on_off NOT NULL DEFAULT 'OFF',
   test_status                                      public.enum_on_off NOT NULL DEFAULT 'OFF',
   heating_status                                   public.enum_on_off NOT NULL DEFAULT 'OFF',
   hotwater_status                                  public.enum_on_off NOT NULL DEFAULT 'OFF',
   boost_status                                     public.enum_on_off NOT NULL DEFAULT 'OFF',
   pre_heating_status                               public.enum_on_off NOT NULL DEFAULT 'OFF',
   lock_status                                      public.enum_lock_unlock NOT NULL DEFAULT 'Unlock',
   heating_mode                                     public.enum_heating_type NOT NULL DEFAULT '온돌',
   heating_combustion                               public.enum_on_off NOT NULL DEFAULT 'OFF',
   hotwater_combustion                              public.enum_on_off NOT NULL DEFAULT 'OFF',
   hotwater_setting_integer                         CHAR(5) NOT NULL,
   hotwater_setting_decimal                         CHAR(10) NOT NULL,
   heating_setting_floor_temp                       CHAR(10) NOT NULL,
   heating_setting_room_temp                        CHAR(10) NOT NULL,
   current_room_temp                                CHAR(10) NOT NULL,
   outing_status                                    public.enum_on_off NOT NULL DEFAULT 'OFF',
   error_status                                     public.enum_on_off NOT NULL DEFAULT 'OFF',
   error_data                                       CHAR(20) NOT NULL,
   heating_eco_detect                               public.enum_exist NOT NULL DEFAULT '없음',
   water_flow_detect                                public.enum_exist NOT NULL DEFAULT '없음',
   mode_status                                      public.enum_mode NOT NULL DEFAULT 'OFF',
   freeze_alarm_noti                                public.enum_on_off NOT NULL DEFAULT 'OFF',
   freeze_buzzer_alarm                              public.enum_on_off NOT NULL DEFAULT 'OFF',
   setting_temp_limit_range                         CHAR(10) NOT NULL,
   sw_control_power                                 public.enum_control_action NOT NULL DEFAULT '조작없음',
   sw_control_heating                               public.enum_control_action NOT NULL DEFAULT '조작없음',
   sw_control_hotwater                              public.enum_control_action NOT NULL DEFAULT '조작없음',
   sw_control_outing                                public.enum_control_action NOT NULL DEFAULT '조작없음',
   sw_control_mode                                  public.enum_control_action3 NOT NULL DEFAULT '조작없음',
   sw_control_reserve                               public.enum_control_action NOT NULL DEFAULT '조작없음',
   sw_control_chg_heating                           public.enum_control_action2 NOT NULL DEFAULT '조작없음',
   sw_control_chg_hotwater                          public.enum_control_action2 NOT NULL DEFAULT '조작없음',
   reserve_status                                   public.enum_on_off NOT NULL DEFAULT 'OFF',
   reserve_type                                     public.enum_reserve_type NOT NULL DEFAULT '일반예약',
   reserve_info_normal                              CHAR(20) NOT NULL,
   reserve_info_type                                public.enum_reserve_info NOT NULL DEFAULT '미사용',
   reserve_info_24                                  CHAR(12) NOT NULL,
   user_info_reset                                  public.enum_user_status NOT NULL DEFAULT '통상',
   control_type_heating_hotwater                    public.enum_heating_on_mode NOT NULL DEFAULT '라디에이터',
   energy_saving_heating_setting_floor_temp         CHAR(10) NOT NULL,
   energy_saving_heating_setting_room_temp          CHAR(10) NOT NULL,
   gas_measure_unit                                 public.enum_gas_measure_unit NOT NULL DEFAULT 'm3',
);

-- add comment for column
COMMENT ON TABLE public.tbl_his_inf_parsed IS 'device history parsed information table';
COMMENT ON COLUMN public.tbl_his_inf_parsed.serial_num IS 'device serial number';
COMMENT ON COLUMN public.tbl_his_inf_parsed.stat_date IS 'YYYYMMDDhhmmss';
COMMENT ON COLUMN public.tbl_his_inf_parsed.power_status IS '전원상태';
COMMENT ON COLUMN public.tbl_his_inf_parsed.test_status IS '시운전';
COMMENT ON COLUMN public.tbl_his_inf_parsed.heating_status                                IS '난방 상태';
COMMENT ON COLUMN public.tbl_his_inf_parsed.hotwater_status                               IS '온수 상태';
COMMENT ON COLUMN public.tbl_his_inf_parsed.boost_status                                  IS '급속 상태';
COMMENT ON COLUMN public.tbl_his_inf_parsed.pre_heating_status                            IS '예열 상태';
COMMENT ON COLUMN public.tbl_his_inf_parsed.lock_status                                   IS 'Lock 상태';
COMMENT ON COLUMN public.tbl_his_inf_parsed.heating_mode                                  IS '난방모드';
COMMENT ON COLUMN public.tbl_his_inf_parsed.heating_combustion                            IS '난방연소상태';
COMMENT ON COLUMN public.tbl_his_inf_parsed.hotwater_combustion                           IS '온수연소상태';
COMMENT ON COLUMN public.tbl_his_inf_parsed.hotwater_setting_integer                      IS '온수설정온도(정수)';
COMMENT ON COLUMN public.tbl_his_inf_parsed.hotwater_setting_decimal                      IS '온수설정온도(소수점)';
COMMENT ON COLUMN public.tbl_his_inf_parsed.heating_setting_floor_temp                    IS '난방설정온도(온돌모드)';
COMMENT ON COLUMN public.tbl_his_inf_parsed.heating_setting_room_temp                     IS '난방설정온도(실온)';
COMMENT ON COLUMN public.tbl_his_inf_parsed.current_room_temp                             IS '현재실온';
COMMENT ON COLUMN public.tbl_his_inf_parsed.outing_status                                 IS '외출상태';
COMMENT ON COLUMN public.tbl_his_inf_parsed.error_status                                  IS '에러상태';
COMMENT ON COLUMN public.tbl_his_inf_parsed.error_data                                    IS '에러데이터';
COMMENT ON COLUMN public.tbl_his_inf_parsed.heating_eco_detect                            IS '난방에코검지';
COMMENT ON COLUMN public.tbl_his_inf_parsed.water_flow_detect                             IS '수류검지';
COMMENT ON COLUMN public.tbl_his_inf_parsed.mode_status                                   IS '모드상태';
COMMENT ON COLUMN public.tbl_his_inf_parsed.freeze_alarm_noti                             IS '동결알림통지';
COMMENT ON COLUMN public.tbl_his_inf_parsed.freeze_buzzer_alarm                           IS '동결부저알림';
COMMENT ON COLUMN public.tbl_his_inf_parsed.setting_temp_limit_range                      IS '설정온도 제한범위';
COMMENT ON COLUMN public.tbl_his_inf_parsed.sw_control_power                              IS 'SW 조작정보 (전원)';
COMMENT ON COLUMN public.tbl_his_inf_parsed.sw_control_heating                            IS 'SW 조작정보 (난방)';
COMMENT ON COLUMN public.tbl_his_inf_parsed.sw_control_hotwater                           IS 'SW 조작정보 (온수)';
COMMENT ON COLUMN public.tbl_his_inf_parsed.sw_control_outing                             IS 'SW 조작정보 (외출)';
COMMENT ON COLUMN public.tbl_his_inf_parsed.sw_control_mode                               IS 'SW 조작정보 (모드상태)';
COMMENT ON COLUMN public.tbl_his_inf_parsed.sw_control_reserve                            IS 'SW 조작정보 (예약)';
COMMENT ON COLUMN public.tbl_his_inf_parsed.sw_control_chg_heating                        IS 'SW 조작정보 (난방온도)';
COMMENT ON COLUMN public.tbl_his_inf_parsed.sw_control_chg_hotwater                       IS 'SW 조작정보 (온수온도)';
COMMENT ON COLUMN public.tbl_his_inf_parsed.reserve_status                                IS '예약상태';
COMMENT ON COLUMN public.tbl_his_inf_parsed.reserve_type                                  IS '예약종류';
COMMENT ON COLUMN public.tbl_his_inf_parsed.reserve_info_normal                           IS '예약정보(일반예약_시각설정)';
COMMENT ON COLUMN public.tbl_his_inf_parsed.reserve_info_type                             IS '예약정보(유형예약_시각설정)';
COMMENT ON COLUMN public.tbl_his_inf_parsed.reserve_info_24                               IS '예약정보(24시간예약_시각설정)';
COMMENT ON COLUMN public.tbl_his_inf_parsed.user_info_reset                               IS '유저 정보 초기화';
COMMENT ON COLUMN public.tbl_his_inf_parsed.control_type_heating_hotwater                 IS '난방(온돌모드) 제어정보 및 온수제어 방식';
COMMENT ON COLUMN public.tbl_his_inf_parsed.energy_saving_heating_setting_floor_temp      IS '난방(온돌모드) 설정온도 (에너지 절약)';
COMMENT ON COLUMN public.tbl_his_inf_parsed.energy_saving_heating_setting_room_temp       IS '실온설정온도(에너지절약)';
COMMENT ON COLUMN public.tbl_his_inf_parsed.gas_measure_unit                              IS '가스사용량 단위정보';

-- add index
CREATE INDEX idx_tbl_his_inf_parsed_serial_num_stat_date ON public.tbl_his_inf_parsed (serial_num, stat_date);

-- add comment for index
COMMENT ON INDEX public.idx_tbl_his_inf_parsed_serial_num_stat_date IS 'index for parsed device inf history query by serial_num, stat_date';

-- add pk
-- check pk uniqueness
-- SELECT COUNT(*) AS total_cnt, COUNT(DISTINCT id) AS distinct_id_cnt FROM public.tbl_his_inf_parsed;

-- add pk
-- ALTER TABLE public.tbl_his_inf_parsed ADD CONSTRAINT pk_tbl_his_inf_parsed PRIMARY KEY (id);
