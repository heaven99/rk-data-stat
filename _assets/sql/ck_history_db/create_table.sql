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
CREATE TYPE enum_on_off AS ENUM ('ON', 'OFF');
CREATE TYPE enum_lock_unlock AS ENUM ('Lock', 'Unlock');
CREATE TYPE enum_mode AS ENUM ('OFF', 'SAVE', 'AUTO');
CREATE TYPE enum_heating_type AS ENUM ('온돌', '실온');
CREATE TYPE enum_exist AS ENUM ('없음', '있음');
CREATE TYPE enum_control_action AS ENUM ('조작없음', 'ON', 'OFF');
CREATE TYPE enum_control_action2 AS ENUM ('조작없음', '조작&변경있음');
CREATE TYPE enum_reserve_info AS ENUM ('미사용', '표준', '공동', '절약', '개인설정1', '개인설정2');
CREATE TYPE enum_reserve_type AS ENUM ('일반예약', '24시간예약');
CREATE TYPE enum_heating_on_mode AS ENUM ('라디에이터', '바닥난방');
CREATE TYPE enum_device_type AS ENUM ('온수건조기', '가스렌지', '보일러', '정수기', '식기소독보관고');
CREATE TYPE enum_user_status AS ENUM ('통상', '등록정보Reset');




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
   mode_status                                      public.enum_on_off NOT NULL DEFAULT 'OFF',
   freeze_alarm_noti                                public.enum_on_off NOT NULL DEFAULT 'OFF',
   freeze_buzzer_alarm                              public.enum_on_off NOT NULL DEFAULT 'OFF',
   setting_temp_limit_range                         CHAR(10) NOT NULL,
   sw_control_power                                 public.enum_on_off NOT NULL DEFAULT 'OFF',
   sw_control_heating                               public.enum_on_off NOT NULL DEFAULT 'OFF',
   sw_control_hotwater                              public.enum_on_off NOT NULL DEFAULT 'OFF',
   sw_control_outing                                public.enum_on_off NOT NULL DEFAULT 'OFF',
   sw_control_mode                                  public.enum_on_off NOT NULL DEFAULT 'OFF',
   sw_control_reserve                               public.enum_on_off NOT NULL DEFAULT 'OFF',
   sw_control_chg_heating                           public.enum_on_off NOT NULL DEFAULT 'OFF',
   sw_control_chg_hotwater                          public.enum_on_off NOT NULL DEFAULT 'OFF',
   reserve_status                                   public.enum_on_off NOT NULL DEFAULT 'OFF',
   reserve_type                                     public.enum_on_off NOT NULL DEFAULT 'OFF',
   reserve_info_normal                              public.enum_on_off NOT NULL DEFAULT 'OFF',
   reserve_info_type                                public.enum_on_off NOT NULL DEFAULT 'OFF',
   reserve_info_24                                  public.enum_on_off NOT NULL DEFAULT 'OFF',
   user_info_reset                                  public.enum_on_off NOT NULL DEFAULT 'OFF',
   control_type_heating_hotwater                    public.enum_on_off NOT NULL DEFAULT 'OFF',
   energy_saving_heating_setting_floor_temp         public.enum_on_off NOT NULL DEFAULT 'OFF',
   energy_saving_heating_setting_room_temp          public.enum_on_off NOT NULL DEFAULT 'OFF',
   gas_measure_unit                                 public.enum_on_off NOT NULL DEFAULT 'OFF',
);

-- add comment for column
COMMENT ON TABLE public.tbl_device_his_inf IS 'device history information raw log table';
COMMENT ON COLUMN public.tbl_his_inf_parsed.id IS 'surrogate key (identity), primary key will be added later';
COMMENT ON COLUMN public.tbl_his_inf_parsed.device_id IS 'device numeric id (non-negative)';
COMMENT ON COLUMN public.tbl_his_inf_parsed.serial_num IS 'device serial number';
COMMENT ON COLUMN public.tbl_his_inf_parsed.topic IS 'mqtt topic';
COMMENT ON COLUMN public.tbl_his_inf_parsed.orig_data IS 'original raw payload data';
COMMENT ON COLUMN public.tbl_his_inf_parsed.c_date IS 'log created datetime (timestamp without timezone)';

-- add index
CREATE INDEX idx_tbl_device_his_inf_c_date_serial_num ON public.tbl_device_his_inf (c_date, serial_num);

-- add comment for index
COMMENT ON INDEX public.idx_tbl_device_his_inf_c_date_serial_num IS 'index for device history query by c_date, serial_num';

-- add pk
-- check pk uniqueness
SELECT COUNT(*) AS total_cnt, COUNT(DISTINCT id) AS distinct_id_cnt FROM public.tbl_device_his_inf;

-- add pk
ALTER TABLE public.tbl_device_his_inf ADD CONSTRAINT pk_tbl_device_his_inf PRIMARY KEY (id);
