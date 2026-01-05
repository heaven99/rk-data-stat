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