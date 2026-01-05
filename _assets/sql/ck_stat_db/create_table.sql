-- stat src
-- DROP TABLE `ck_stat_db`.`tbl_stat_src`;
-- TODO partition
CREATE TABLE public.tbl_stat_src (
    stat_date  CHAR(14) NOT NULL,
    serial_num CHAR(17) NOT NULL,
    data_type  VARCHAR(16) NOT NULL,
    value      INTEGER
);

-- add comment
COMMENT ON TABLE public.tbl_stat_src IS 'stat source raw table';
COMMENT ON COLUMN public.tbl_stat_src.stat_date IS 'statistic date. YYYYMMDDHHmmss';
COMMENT ON COLUMN public.tbl_stat_src.serial_num IS 'boiler serial number';
COMMENT ON COLUMN public.tbl_stat_src.data_type IS 'statistic type';
COMMENT ON COLUMN public.tbl_stat_src.value IS 'statistic value';
-- TODO index query 별도 분리
-- 전체 장비도 조회할 수 있으니 일단 순서를 data_type 에 serial_num 으로 변경
CREATE INDEX idx_tbl_stat_src_stat_date_data_type_serial_num ON public.tbl_stat_src (stat_date, data_type, serial_num);

COMMENT ON INDEX public.idx_tbl_stat_src_stat_date_data_type_serial_num IS 'index for statistic query by stat_date, data_type, serial_num';

