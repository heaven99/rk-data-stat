# 최초

## 가상 환경 생성

```shell
python3 -m venv venv
```

## 가상 환경 설정

```shell
source venv/bin/activate
```

## 라이브러리 설치

```shell
pip install -r requirements.txt
```

# 이후

## 가상 환경 설정

```shell
source venv/bin/activate
```

## M/W password 셋업

M/W 패스워드는 환경변수로 처리한다.

```shell
export DB_PASSWORD_CK_STAT_DB=xxxx
export DB_PASSWORD_CK_HISTORY_DB=xxxx
```

## 실행

```shell
APP_ENV=dev python3 -m scripts.make_src
APP_ENV=dev python3 -m scripts.make_src YYYYMMDDHH
```

# crontab 설정

```shell
# 매 5분마다 실행
5 * * * * /home/ckstack/bin/stat/make-src.sh
```