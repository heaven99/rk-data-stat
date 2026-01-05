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