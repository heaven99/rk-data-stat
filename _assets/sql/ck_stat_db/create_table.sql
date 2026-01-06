/**
 * tbl_stat_src
 * stat source raw table (backup/sync capable)
 */
-- stat src
-- DROP TABLE public.tbl_stat_src;
-- TODO partition
-- create table
CREATE TABLE public.tbl_stat_src (
    stat_date  CHAR(14) NOT NULL,
    serial_num CHAR(17) NOT NULL,
    data_type  VARCHAR(16) NOT NULL,
    value      DOUBLE PRECISION,
    c_date     TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- add comment for column
COMMENT ON TABLE public.tbl_stat_src IS 'stat source raw table';
COMMENT ON COLUMN public.tbl_stat_src.stat_date IS 'statistic date. YYYYMMDDHHmmss';
COMMENT ON COLUMN public.tbl_stat_src.serial_num IS 'boiler serial number';
COMMENT ON COLUMN public.tbl_stat_src.data_type IS 'statistic type';
COMMENT ON COLUMN public.tbl_stat_src.value IS 'statistic value';
COMMENT ON COLUMN public.tbl_stat_src.c_date IS 'creation datetime';

-- TODO index query 별도 분리
-- ad index
-- 전체 장비도 조회할 수 있으니 일단 순서를 data_type 에 serial_num 으로 변경
CREATE INDEX idx_tbl_stat_src_serial_num_stat_date_data_type ON public.tbl_stat_src (serial_num, stat_date, data_type);

-- add comment for index
COMMENT ON INDEX public.idx_tbl_stat_src_serial_num_stat_date_data_type IS 'index for statistic query by serial_num, stat_date, data_type';
