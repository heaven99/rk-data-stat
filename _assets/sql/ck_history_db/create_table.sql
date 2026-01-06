/**
 * tbl_device_sync_his
 * device master table (backup/sync capable)
 */
-- drop table
-- DROP TABLE IF EXISTS public.tbl_device_sync_his;

-- create table
CREATE TABLE public.tbl_device_sync_his (
    sync_date       TIMESTAMP,
    file_path       VARCHAR(255) DEFAULT '',
    expire_date     TIMESTAMP,
    delete_date     TIMESTAMP,
    c_date          TIMESTAMP
);

-- table comment
COMMENT ON TABLE public.tbl_device_sync_his IS 'device sync hist';

-- column comments
COMMENT ON COLUMN public.tbl_device_sync_his.sync_date IS 'backup/sync datetime copied from source table';
COMMENT ON COLUMN public.tbl_device_sync_his.file_path IS 'file path';
COMMENT ON COLUMN public.tbl_device_sync_his.expire_date IS 'file expire date. if null, never expire';
COMMENT ON COLUMN public.tbl_device_sync_his.delete_date IS 'file delete date. if null, not deleted yet';
COMMENT ON COLUMN public.tbl_device_sync_his.c_date IS 'create date';

-- index
CREATE INDEX idx_tbl_device_sync_his_sync_date ON public.tbl_device_sync_his (sync_date);

COMMENT ON INDEX public.idx_tbl_device_sync_his_sync_date IS 'index for device lookup by sync date';

/**
 * tbl_device_his_inf
 */
-- DROP TABLE public.tbl_device_his_inf;

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
CREATE TYPE enum_lock_unlock AS ENUM ('UNLOCK', 'LOCK');
CREATE TYPE enum_mode AS ENUM ('OFF', 'SAVE', 'AUTO', '정음', '정음+SAVE', '정음+AUTO', '살균');
CREATE TYPE enum_heating_type AS ENUM ('온돌', '실온');
CREATE TYPE enum_exist AS ENUM ('없음', '있음');
CREATE TYPE enum_exist2 AS ENUM ('없음', '버블 OFF', '버블 ON');
CREATE TYPE enum_control_action AS ENUM ('조작없음', 'ON', 'OFF');
CREATE TYPE enum_control_action2 AS ENUM ('조작없음', '조작&변경있음');
CREATE TYPE enum_control_action3 AS ENUM ('조작없음', 'AUTO ON', 'AUTO OFF', 'SAVE ON', 'SAVE OFF', '정음+SAVE ON', '정음+SAVE OFF', '정음+AUTO ON', '정음+AUTO OFF', '정음 ON', '정음 OFF');
-- CREATE TYPE enum_reserve_info AS ENUM ('미사용', '표준', '공동', '절약', '개인설정1', '개인설정2');
CREATE TYPE enum_reserve_info AS ENUM ('미사용', '유형1', '유형2', '유형3', '유형4', '유형5');
CREATE TYPE enum_reserve_type AS ENUM ('일반예약', '24시간예약', '패턴예약');
CREATE TYPE enum_heating_on_mode AS ENUM ('라디에이터', '바닥난방', '난방전용', 'TH', 'TS');
CREATE TYPE enum_device_type AS ENUM ('온수건조기', '가스렌지', '보일러', '정수기', '식기소독보관고');
CREATE TYPE enum_user_status AS ENUM ('통상', '등록정보Reset');
CREATE TYPE enum_gas_measure_unit AS ENUM ('m3', 'kg');
CREATE TYPE enum_pattern_reserve AS ENUM ('미사용', '패턴1', '패턴2', '패턴3');
CREATE TYPE enum_progress AS ENUM ('지시없음', '진행중', '완료', '실패');
CREATE TYPE enum_result AS ENUM ('시작전', '이상없음', '이상있음');




/**
 * tbl_device_his_inf
 */
DROP TABLE public.tbl_his_inf_parsed;

-- create table
CREATE TABLE public.tbl_his_inf_parsed (
   serial_num                                       CHAR(17) NOT NULL,
   c_date                                           TIMESTAMP NOT NULL,
   group_cd                                         CHAR(3) NOT NULL,
   group_type_cd                                    CHAR(2) NOT NULL,
   lat                                              double precision,
   lon                                              double precision,
   power_status                                     public.enum_on_off NOT NULL DEFAULT 'OFF',
   test_status                                      public.enum_on_off NOT NULL DEFAULT 'OFF',
   heating_status                                   public.enum_on_off NOT NULL DEFAULT 'OFF',
   hotwater_status                                  public.enum_on_off NOT NULL DEFAULT 'OFF',
   boost_status                                     public.enum_on_off NOT NULL DEFAULT 'OFF',
   pre_heating_status                               public.enum_on_off NOT NULL DEFAULT 'OFF',
   lock_status                                      public.enum_lock_unlock NOT NULL DEFAULT 'UNLOCK',
   heating_mode                                     public.enum_heating_type NOT NULL DEFAULT '온돌',
   heating_combustion                               public.enum_on_off NOT NULL DEFAULT 'OFF',
   hotwater_combustion                              public.enum_on_off NOT NULL DEFAULT 'OFF',
   hotwater_setting_integer                         SMALLINT NOT NULL,
   hotwater_setting_decimal                         SMALLINT NOT NULL,
   heating_setting_floor_temp                       SMALLINT NOT NULL,
   heating_setting_room_temp                        SMALLINT NOT NULL,
   current_room_temp                                SMALLINT NOT NULL,
   outing_status                                    public.enum_on_off NOT NULL DEFAULT 'OFF',
   error_status                                     public.enum_on_off NOT NULL DEFAULT 'OFF',
   error_data                                       CHAR(3) NOT NULL DEFAULT '000',
   heating_eco_detect                               public.enum_exist NOT NULL DEFAULT '없음',
   water_flow_detect                                public.enum_exist2 NOT NULL DEFAULT '없음',
   mode_status                                      public.enum_mode NOT NULL DEFAULT 'OFF',
   freeze_alarm_noti                                public.enum_on_off NOT NULL DEFAULT 'OFF',
   freeze_buzzer_alarm                              public.enum_on_off NOT NULL DEFAULT 'OFF',
   setting_temp_limit_range                         SMALLINT NOT NULL,
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
   reserve_info_24                                  CHAR(12) NOT NULL DEFAULT '000000000000',
   user_info_reset                                  public.enum_user_status NOT NULL DEFAULT '통상',
   control_type_heating_hotwater                    public.enum_heating_on_mode NOT NULL DEFAULT '라디에이터',
   energy_saving_heating_setting_floor_temp         CHAR(10) NOT NULL,
   energy_saving_heating_setting_room_temp          CHAR(10) NOT NULL,
   gas_measure_unit                                 public.enum_gas_measure_unit NOT NULL DEFAULT 'm3',
   pattern_reserve_info                             public.enum_pattern_reserve NOT NULL DEFAULT '미사용',
   pattern1_extinguished_time                       CHAR(3) NOT NULL DEFAULT '미사용',
   pattern1_combustion_time                         CHAR(3) NOT NULL DEFAULT '미사용',
   pattern2_extinguished_time                       CHAR(3) NOT NULL DEFAULT '미사용',
   pattern2_combustion_time                         CHAR(3) NOT NULL DEFAULT '미사용',
   pattern3_extinguished_time                       CHAR(3) NOT NULL DEFAULT '미사용',
   pattern3_combustion_time                         CHAR(3) NOT NULL DEFAULT '미사용',
   heating_supply_th                                CHAR(4) NOT NULL DEFAULT '미사용',
   hotwater_supply_th                               CHAR(4) NOT NULL DEFAULT '미사용',
   freeze_th                                        CHAR(4) NOT NULL DEFAULT '미사용',
   water_circulation_th                             CHAR(4) NOT NULL DEFAULT '미사용',
   emission_th                                      CHAR(4) NOT NULL DEFAULT '미사용',
   heating_ai_status                                public.enum_on_off NOT NULL DEFAULT 'OFF',
   hotwater_ai_status                               public.enum_on_off NOT NULL DEFAULT 'OFF',
   ota_status                                       public.enum_progress NOT NULL DEFAULT '지시없음',
   smart_diagnosis_status                           public.enum_progress NOT NULL DEFAULT '지시없음',
   progress_rate                                    CHAR(4) NOT NULL DEFAULT '0%',
   sensor_diagnosis_status                          public.enum_result NOT NULL DEFAULT '시작전',
   room_th_error_state                              CHAR(2) NOT NULL DEFAULT 'FF',
   heating_supply_th_error_state                    CHAR(2) NOT NULL DEFAULT 'FF',
   hotwater_supply_th_error_state                   CHAR(2) NOT NULL DEFAULT 'FF',
   freeze_th_error_state                            CHAR(2) NOT NULL DEFAULT 'FF',
   water_circulation_th_error_state                 CHAR(2) NOT NULL DEFAULT 'FF',
   emission_th_error_state                          CHAR(2) NOT NULL DEFAULT 'FF',
   ignition_unit_diagnosis_state                    public.enum_result NOT NULL DEFAULT '시작전',
   ignition_unit_diagnosis_error                    CHAR(2) NOT NULL DEFAULT 'FF',
   circular_unit_diagnosis_state                    public.enum_result NOT NULL DEFAULT '시작전',
   circular_unit_diagnosis_error                    CHAR(2) NOT NULL DEFAULT 'FF',
   fan_unit_diagnosis_state                         public.enum_result NOT NULL DEFAULT '시작전',
   fan_error                                        CHAR(2) NOT NULL DEFAULT 'FF',
   emission_block_error                             CHAR(2) NOT NULL DEFAULT 'FF',
   comm_state_diagnosis_state                       public.enum_result NOT NULL DEFAULT '시작전',
   comm_state_diagnosis_error                       CHAR(2) NOT NULL DEFAULT 'FF'
);

-- add comment for column
COMMENT ON TABLE public.tbl_his_inf_parsed IS 'device history parsed information table';
COMMENT ON COLUMN public.tbl_his_inf_parsed.serial_num IS 'device serial number';
COMMENT ON COLUMN public.tbl_his_inf_parsed.c_date IS 'create_date';
COMMENT ON COLUMN public.tbl_his_inf_parsed.group_cd                                      IS '장비그룹';
COMMENT ON COLUMN public.tbl_his_inf_parsed.group_type_cd                                 IS '모델타입';
COMMENT ON COLUMN public.tbl_his_inf_parsed.lat                                           IS '위도';
COMMENT ON COLUMN public.tbl_his_inf_parsed.lon                                           IS '경도';
COMMENT ON COLUMN public.tbl_his_inf_parsed.power_status                                  IS '전원상태';
COMMENT ON COLUMN public.tbl_his_inf_parsed.test_status                                   IS '시운전';
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
COMMENT ON COLUMN public.tbl_his_inf_parsed.pattern_reserve_info                          IS '패턴예약 정보';
COMMENT ON COLUMN public.tbl_his_inf_parsed.pattern1_extinguished_time                    IS '패턴1 예약 소화시간';
COMMENT ON COLUMN public.tbl_his_inf_parsed.pattern1_combustion_time                      IS '패턴1 예약 연소시간';
COMMENT ON COLUMN public.tbl_his_inf_parsed.pattern2_extinguished_time                    IS '패턴2 예약 소화시간';
COMMENT ON COLUMN public.tbl_his_inf_parsed.pattern2_combustion_time                      IS '패턴2 예약 연소시간';
COMMENT ON COLUMN public.tbl_his_inf_parsed.pattern3_extinguished_time                    IS '패턴3 예약 소화시간';
COMMENT ON COLUMN public.tbl_his_inf_parsed.pattern3_combustion_time                      IS '패턴3 예약 연소시간';
COMMENT ON COLUMN public.tbl_his_inf_parsed.heating_supply_th                             IS '난방출탕 TH';
COMMENT ON COLUMN public.tbl_his_inf_parsed.hotwater_supply_th                            IS '온수출탕 TH';
COMMENT ON COLUMN public.tbl_his_inf_parsed.freeze_th                                     IS '동결 TH';
COMMENT ON COLUMN public.tbl_his_inf_parsed.water_circulation_th                          IS '환수 TH';
COMMENT ON COLUMN public.tbl_his_inf_parsed.emission_th                                   IS '배기 TH';
COMMENT ON COLUMN public.tbl_his_inf_parsed.heating_ai_status                             IS '난방AI 상태';
COMMENT ON COLUMN public.tbl_his_inf_parsed.hotwater_ai_status                            IS '온수AI 상태';
COMMENT ON COLUMN public.tbl_his_inf_parsed.ota_status                                    IS 'OTA 상태';
COMMENT ON COLUMN public.tbl_his_inf_parsed.smart_diagnosis_status                        IS '스마트진단 상태';
COMMENT ON COLUMN public.tbl_his_inf_parsed.progress_rate                                 IS '진행률';
COMMENT ON COLUMN public.tbl_his_inf_parsed.sensor_diagnosis_status                       IS '센서부 진단 상태';
COMMENT ON COLUMN public.tbl_his_inf_parsed.room_th_error_state                           IS '실내온도 TH 에러상태';
COMMENT ON COLUMN public.tbl_his_inf_parsed.heating_supply_th_error_state                 IS '난방출탕 TH 에러상태';
COMMENT ON COLUMN public.tbl_his_inf_parsed.hotwater_supply_th_error_state                IS '온수출탕 TH 에러상태';
COMMENT ON COLUMN public.tbl_his_inf_parsed.freeze_th_error_state                         IS '동결 TH 에러상태';
COMMENT ON COLUMN public.tbl_his_inf_parsed.water_circulation_th_error_state              IS '환수 TH 에러상태';
COMMENT ON COLUMN public.tbl_his_inf_parsed.emission_th_error_state                       IS '배기 TH 에러상태';
COMMENT ON COLUMN public.tbl_his_inf_parsed.ignition_unit_diagnosis_state                 IS '점화부 진단 상태';
COMMENT ON COLUMN public.tbl_his_inf_parsed.ignition_unit_diagnosis_error                 IS '점화부 진단 에러';
COMMENT ON COLUMN public.tbl_his_inf_parsed.circular_unit_diagnosis_state                 IS '순환부 진단 상태';
COMMENT ON COLUMN public.tbl_his_inf_parsed.circular_unit_diagnosis_error                 IS '순환부 진단 에러';
COMMENT ON COLUMN public.tbl_his_inf_parsed.fan_unit_diagnosis_state                      IS '송풍장치 진단';
COMMENT ON COLUMN public.tbl_his_inf_parsed.fan_error                                     IS 'FAN 에러';
COMMENT ON COLUMN public.tbl_his_inf_parsed.emission_block_error                          IS '배기폐쇄 에러';
COMMENT ON COLUMN public.tbl_his_inf_parsed.comm_state_diagnosis_state                    IS '통신 상태 진단 상태';
COMMENT ON COLUMN public.tbl_his_inf_parsed.comm_state_diagnosis_error                    IS '통신 상태 진단 에러';

-- add index
CREATE INDEX idx_tbl_his_inf_parsed_serial_num_c_date ON public.tbl_his_inf_parsed (serial_num, c_date);

-- add comment for index
COMMENT ON INDEX public.idx_tbl_his_inf_parsed_serial_num_c_date IS 'index for parsed device inf history query by serial_num, c_date';

-- add pk
-- check pk uniqueness
-- SELECT COUNT(*) AS total_cnt, COUNT(DISTINCT id) AS distinct_id_cnt FROM public.tbl_his_inf_parsed;

-- add pk
-- ALTER TABLE public.tbl_his_inf_parsed ADD CONSTRAINT pk_tbl_his_inf_parsed PRIMARY KEY (id);
