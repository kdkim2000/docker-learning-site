# Chapter 10. Docker Compose

## 목차

- [Clip 1. 멀티 컨테이너 서비스와 Docker Compose 개요](#1-멀티-컨테이너-서비스와-docker-compose-개요)
- [Clip 2. Docker CLI vs Docker Compose 비교](#2-docker-cli-vs-docker-compose-비교)
- [Clip 3. Docker Compose 설치 및 버전 확인](#3-docker-compose-설치-및-버전-확인)
- [Clip 4. docker-compose.yaml 기본 구조](#4-docker-composeyaml-기본-구조)
- [Clip 5. [실습] WordPress + MySQL 구성](#5-실습-wordpress--mysql-구성)
- [Clip 6. Docker Compose 주요 명령어](#6-docker-compose-주요-명령어)
- [Clip 7. [실습] Flask + Redis 서비스](#7-실습-flask--redis-서비스)
- [Clip 8. 서비스 스케일링](#8-서비스-스케일링)
- [Clip 9. [실습] Nginx + Flask 다중 앱 (ALB 구조)](#9-실습-nginx--flask-다중-앱-alb-구조)
- [Clip 10. [실습] 3-Tier 웹 애플리케이션](#10-실습-3-tier-웹-애플리케이션)
- [Clip 11. Docker Compose vs Kubernetes](#11-docker-compose-vs-kubernetes)

---

## 1. 멀티 컨테이너 서비스와 Docker Compose 개요

> 멀티 컨테이너 환경의 한계와 Docker Compose의 역할 이해하기

### 1.1 멀티 컨테이너 서비스란?

현대의 애플리케이션은 단일 컨테이너가 아닌 **여러 컨테이너의 조합**으로 구성된다.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    멀티 컨테이너 서비스 예시                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐   │
│  │  Nginx   │ ──→ │   App    │ ──→ │  Redis   │     │  MySQL   │   │
│  │ (Proxy)  │     │ (Flask)  │     │ (Cache)  │     │   (DB)   │   │
│  └──────────┘     └──────────┘     └──────────┘     └──────────┘   │
│       ↑                ↑                ↑               ↑          │
│       └────────────────┴────────────────┴───────────────┘          │
│                      하나의 애플리케이션                             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 Docker CLI 기반 멀티 컨테이너 구성의 한계

Docker CLI만으로 멀티 컨테이너를 관리할 때의 문제점:

| 문제점 | 설명 |
|--------|------|
| **복잡한 명령어** | 다수의 컨테이너 실행 시 긴 `docker run` 명령 증가 |
| **의존성 관리** | 컨테이너 간 시작 순서, 연결 관계 수동 관리 필요 |
| **네트워크/볼륨** | 네트워크와 볼륨을 개별적으로 생성/관리해야 함 |
| **재현성 부족** | 동일한 환경 재구성이 어려움 |
| **문서화 한계** | 설정이 코드로 남지 않아 공유/협업이 어려움 |

**Docker CLI 방식 예시 (복잡함):**

```bash
# 1. 네트워크 생성
docker network create backend-net

# 2. 볼륨 생성
docker volume create mydb_data
docker volume create myweb_data

# 3. MySQL 컨테이너 실행
docker run -d --name mysql_app \
  --network backend-net \
  -v mydb_data:/var/lib/mysql \
  -e MYSQL_ROOT_PASSWORD=password# \
  -e MYSQL_DATABASE=wpdb \
  -e MYSQL_USER=wpuser \
  -e MYSQL_PASSWORD=wppassword \
  mysql:8.0-debian

# 4. WordPress 컨테이너 실행
docker run -d --name wordpress_app \
  --network backend-net \
  -p 8888:80 \
  -v myweb_data:/var/www/html \
  -e WORDPRESS_DB_HOST=mysql_app:3306 \
  -e WORDPRESS_DB_USER=wpuser \
  -e WORDPRESS_DB_PASSWORD=wppassword \
  -e WORDPRESS_DB_NAME=wpdb \
  wordpress:5.7
```

### 1.3 Docker Compose의 역할

Docker Compose는 위의 문제를 해결하는 **멀티 컨테이너 오케스트레이션 도구**이다.

**Docker Compose의 특징:**

- 멀티 컨테이너 애플리케이션을 **YAML 파일 하나로 정의**
- 서비스, 네트워크, 볼륨을 **선언적(Declarative)**으로 관리
- 단일 명령으로 전체 애플리케이션 스택 관리
- 개발/테스트/소규모 배포 환경에 적합

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Docker Compose 동작 흐름                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌──────────────────┐         ┌──────────────────────────────┐    │
│   │ docker-compose   │         │    Docker Compose Engine     │    │
│   │     .yaml        │  ────→  │  (서비스/네트워크/볼륨 생성)   │    │
│   └──────────────────┘         └──────────────────────────────┘    │
│                                            │                        │
│                                            ↓                        │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │                    Docker Engine                             │  │
│   │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │  │
│   │  │Container1│  │Container2│  │Container3│  │Container4│    │  │
│   │  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │  │
│   │                                                             │  │
│   │  ┌──────────────────────┐  ┌────────────────────────────┐  │  │
│   │  │      Network         │  │         Volumes            │  │  │
│   │  └──────────────────────┘  └────────────────────────────┘  │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Docker CLI vs Docker Compose 비교

> Docker CLI와 Docker Compose의 차이점 이해하기

### 2.1 비교 표

| 항목 | Docker CLI | Docker Compose |
|------|------------|----------------|
| **관리 단위** | 개별 컨테이너 | 애플리케이션(서비스 묶음) |
| **설정 방식** | 명령어 옵션 | docker-compose.yaml |
| **재현성** | 낮음 (명령어 기억 필요) | 높음 (파일로 관리) |
| **멀티 컨테이너** | 복잡 (개별 실행) | 간단 (한 번에 실행) |
| **버전 관리** | 어려움 | Git으로 관리 가능 |
| **의존성 관리** | 수동 | `depends_on`으로 자동 |
| **사용 목적** | 단일 컨테이너, 학습 | 멀티 컨테이너 서비스 |

### 2.2 명령어 비교

```
┌────────────────────────────────────────────────────────────────────┐
│                    Docker CLI vs Docker Compose                     │
├──────────────────────────────┬─────────────────────────────────────┤
│        Docker CLI            │          Docker Compose             │
├──────────────────────────────┼─────────────────────────────────────┤
│ docker run                   │ docker compose up                   │
│ docker stop                  │ docker compose stop                 │
│ docker rm                    │ docker compose down                 │
│ docker ps                    │ docker compose ps                   │
│ docker logs                  │ docker compose logs                 │
│ docker build                 │ docker compose build                │
│ docker network create        │ (yaml에서 자동 생성)                 │
│ docker volume create         │ (yaml에서 자동 생성)                 │
└──────────────────────────────┴─────────────────────────────────────┘
```

### 2.3 사용 시나리오

**Docker CLI 사용:**
- 단일 컨테이너 빠른 테스트
- 일회성 작업
- 학습/실험 목적

**Docker Compose 사용:**
- 멀티 컨테이너 애플리케이션
- 개발 환경 구성
- 테스트 환경 구성
- 소규모 운영 환경

---

## 3. Docker Compose 설치 및 버전 확인

> Docker Compose 설치 방법과 버전 확인하기

### 3.1 Docker Compose 버전 확인

```bash
kevin@hostos1:~$ docker compose version
Docker Compose version v2.19.1
```

> **참고:** Docker Desktop에는 Docker Compose가 기본 포함되어 있다.

### 3.2 Docker Compose V1 vs V2

| 항목 | V1 (Legacy) | V2 (현재) |
|------|-------------|-----------|
| **명령어** | `docker-compose` | `docker compose` |
| **설치 방식** | 별도 바이너리 | Docker CLI 플러그인 |
| **성능** | 보통 | 개선됨 |
| **상태** | Deprecated | 권장 |

### 3.3 최신 버전 설치 (Linux)

Docker Compose V2가 설치되어 있지 않은 경우:

```bash
# Docker CLI 플러그인 디렉토리 생성
DOCKER_CONFIG=${DOCKER_CONFIG:-$HOME/.docker}
mkdir -p $DOCKER_CONFIG/cli-plugins

# Docker Compose 바이너리 다운로드
curl -SL https://github.com/docker/compose/releases/download/v2.19.1/docker-compose-linux-x86_64 \
  -o $DOCKER_CONFIG/cli-plugins/docker-compose

# 실행 권한 부여
chmod +x $DOCKER_CONFIG/cli-plugins/docker-compose

# 버전 확인
docker compose version
```

### 3.4 설치 확인

```bash
kevin@hostos1:~$ docker compose version
Docker Compose version v2.19.1

kevin@hostos1:~$ which docker
/usr/bin/docker

kevin@hostos1:~$ ls ~/.docker/cli-plugins/
docker-compose
```

---

## 4. docker-compose.yaml 기본 구조

> docker-compose.yaml 파일의 구조와 문법 이해하기

### 4.1 기본 구조

```yaml
version: "3.8"              # Compose 파일 버전

services:                   # 서비스 정의 (필수)
  service_name:             # 서비스 이름
    image: image_name       # 사용할 이미지
    build: .                # 또는 Dockerfile 빌드
    ports:                  # 포트 매핑
      - "HOST:CONTAINER"
    volumes:                # 볼륨 마운트
      - volume_name:/path
    environment:            # 환경 변수
      - KEY=value
    networks:               # 네트워크 연결
      - network_name
    depends_on:             # 의존성 (시작 순서)
      - other_service

networks:                   # 네트워크 정의
  network_name: {}

volumes:                    # 볼륨 정의
  volume_name: {}
```

### 4.2 YAML 문법 특징

| 특징 | 설명 | 예시 |
|------|------|------|
| **들여쓰기** | 스페이스 사용 (탭 불가) | 2칸 또는 4칸 |
| **주석** | `#`으로 시작 | `# 이것은 주석` |
| **리스트** | `-`로 항목 표시 | `- item1` |
| **맵(딕셔너리)** | `key: value` 형식 | `name: myapp` |
| **문자열** | 따옴표 선택적 | `image: nginx` |

### 4.3 주요 설정 항목

```
┌────────────────────────────────────────────────────────────────────┐
│                docker-compose.yaml 주요 설정 항목                    │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  services:                                                         │
│  ├── image          : 사용할 Docker 이미지                          │
│  ├── build          : Dockerfile 빌드 설정                          │
│  ├── container_name : 컨테이너 이름 지정                            │
│  ├── ports          : 포트 매핑 (호스트:컨테이너)                    │
│  ├── volumes        : 볼륨 마운트                                   │
│  ├── environment    : 환경 변수                                    │
│  ├── env_file       : 환경 변수 파일                                │
│  ├── networks       : 연결할 네트워크                               │
│  ├── depends_on     : 서비스 의존성                                 │
│  ├── restart        : 재시작 정책                                   │
│  ├── command        : 실행 명령어 오버라이드                         │
│  └── healthcheck    : 헬스체크 설정                                 │
│                                                                    │
│  networks:                                                         │
│  ├── driver         : 네트워크 드라이버 (bridge, overlay 등)         │
│  └── external       : 외부 네트워크 사용 여부                        │
│                                                                    │
│  volumes:                                                          │
│  ├── driver         : 볼륨 드라이버                                 │
│  └── external       : 외부 볼륨 사용 여부                            │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### 4.4 버전별 차이

| 버전 | 특징 |
|------|------|
| 2.x | 단일 호스트, `depends_on` 조건 지원 |
| 3.x | Swarm 호환, `deploy` 설정 지원 |
| 3.8 | 현재 가장 널리 사용 |

> **참고:** Docker Compose V2에서는 `version` 필드가 선택 사항이다.

---

## 5. [실습] WordPress + MySQL 구성

> Docker CLI와 Docker Compose 방식 비교 실습

### 5.1 프로젝트 구조

```bash
kevin@hostos1:~$ mkdir -p ~/fastcampus/ch10/wordpress && cd $_
kevin@hostos1:~/fastcampus/ch10/wordpress$ pwd
/home/kevin/fastcampus/ch10/wordpress
```

### 5.2 아키텍처

```
┌─────────────────────────────────────────────────────────────────────┐
│                    WordPress + MySQL 아키텍처                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                         ┌──────────────┐                           │
│                         │    Client    │                           │
│                         └──────┬───────┘                           │
│                                │ :8888                             │
│                                ↓                                   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                      Docker Host                             │   │
│  │                                                             │   │
│  │   ┌─────────────────┐          ┌─────────────────┐          │   │
│  │   │    WordPress    │          │      MySQL      │          │   │
│  │   │  (wordpress_app)│ ───────→ │   (mysql_app)   │          │   │
│  │   │    Port: 80     │  :3306   │    Port: 3306   │          │   │
│  │   └────────┬────────┘          └────────┬────────┘          │   │
│  │            │                            │                   │   │
│  │            ↓                            ↓                   │   │
│  │   ┌─────────────────┐          ┌─────────────────┐          │   │
│  │   │   myweb_data    │          │   mydb_data     │          │   │
│  │   │    (Volume)     │          │    (Volume)     │          │   │
│  │   └─────────────────┘          └─────────────────┘          │   │
│  │                                                             │   │
│  │   ┌───────────────────────────────────────────────────┐     │   │
│  │   │        backend-net / frontend-net (Network)       │     │   │
│  │   └───────────────────────────────────────────────────┘     │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.3 Docker CLI 방식 (비교용)

```bash
# 네트워크 생성
docker network create backend-net
docker network create frontend-net

# 볼륨 생성
docker volume create mydb_data
docker volume create myweb_data

# MySQL 컨테이너
docker run -d --name mysql_app \
  --network backend-net \
  -v mydb_data:/var/lib/mysql \
  -p 3306:3306 \
  -e MYSQL_ROOT_PASSWORD=password# \
  -e MYSQL_DATABASE=wpdb \
  -e MYSQL_USER=wpuser \
  -e MYSQL_PASSWORD=wppassword \
  --restart always \
  mysql:8.0-debian

# WordPress 컨테이너
docker run -d --name wordpress_app \
  --network backend-net \
  -p 8888:80 \
  -v myweb_data:/var/www/html \
  -e WORDPRESS_DB_HOST=mysql_app:3306 \
  -e WORDPRESS_DB_USER=wpuser \
  -e WORDPRESS_DB_PASSWORD=wppassword \
  -e WORDPRESS_DB_NAME=wpdb \
  wordpress:5.7

# frontend-net 추가 연결
docker network connect frontend-net wordpress_app
```

### 5.4 Docker Compose 방식

**docker-compose.yaml 작성:**

```bash
kevin@hostos1:~/fastcampus/ch10/wordpress$ vi docker-compose.yaml
```

```yaml
version: "3.9"

services:
  mydb:
    image: mysql:8.0-debian
    container_name: mysql_app
    volumes:
      - mydb_data:/var/lib/mysql
    restart: always
    ports:
      - "3306:3306"
    environment:
      MYSQL_ROOT_PASSWORD: password#
      MYSQL_DATABASE: wpdb
      MYSQL_USER: wpuser
      MYSQL_PASSWORD: wppassword
    networks:
      - backend-net

  myweb:
    image: wordpress:5.7
    container_name: wordpress_app
    depends_on:
      - mydb
    ports:
      - "8888:80"
    volumes:
      - myweb_data:/var/www/html
    restart: always
    environment:
      WORDPRESS_DB_HOST: mydb:3306
      WORDPRESS_DB_USER: wpuser
      WORDPRESS_DB_PASSWORD: wppassword
      WORDPRESS_DB_NAME: wpdb
    networks:
      - backend-net
      - frontend-net

networks:
  frontend-net: {}
  backend-net: {}

volumes:
  mydb_data: {}
  myweb_data: {}
```

### 5.5 서비스 실행

```bash
kevin@hostos1:~/fastcampus/ch10/wordpress$ docker compose up -d
[+] Running 5/5
 ⠿ Network wordpress_backend-net   Created                              0.1s
 ⠿ Network wordpress_frontend-net  Created                              0.1s
 ⠿ Volume "wordpress_mydb_data"    Created                              0.0s
 ⠿ Volume "wordpress_myweb_data"   Created                              0.0s
 ⠿ Container mysql_app             Started                              1.2s
 ⠿ Container wordpress_app         Started                              2.1s
```

### 5.6 상태 확인

```bash
kevin@hostos1:~/fastcampus/ch10/wordpress$ docker compose ps
NAME             IMAGE             COMMAND                  SERVICE   CREATED          STATUS          PORTS
mysql_app        mysql:8.0-debian  "docker-entrypoint.s…"   mydb      30 seconds ago   Up 28 seconds   0.0.0.0:3306->3306/tcp, 33060/tcp
wordpress_app    wordpress:5.7     "docker-entrypoint.s…"   myweb     30 seconds ago   Up 27 seconds   0.0.0.0:8888->80/tcp

kevin@hostos1:~/fastcampus/ch10/wordpress$ docker network ls | grep wordpress
a1b2c3d4e5f6   wordpress_backend-net    bridge    local
b2c3d4e5f6g7   wordpress_frontend-net   bridge    local

kevin@hostos1:~/fastcampus/ch10/wordpress$ docker volume ls | grep wordpress
local     wordpress_mydb_data
local     wordpress_myweb_data
```

### 5.7 서비스 접속 테스트

```bash
kevin@hostos1:~/fastcampus/ch10/wordpress$ curl -I localhost:8888
HTTP/1.1 302 Found
Date: Tue, 20 Jun 2023 10:30:00 GMT
Server: Apache/2.4.38 (Debian)
X-Powered-By: PHP/7.4.29
Location: http://localhost:8888/wp-admin/install.php
```

웹 브라우저에서 `http://<호스트IP>:8888` 접속하여 WordPress 설치 화면 확인

### 5.8 서비스 종료 및 정리

```bash
# 컨테이너 중지 및 삭제 (볼륨 유지)
kevin@hostos1:~/fastcampus/ch10/wordpress$ docker compose down
[+] Running 4/4
 ⠿ Container wordpress_app         Removed                              1.2s
 ⠿ Container mysql_app             Removed                              2.1s
 ⠿ Network wordpress_backend-net   Removed                              0.1s
 ⠿ Network wordpress_frontend-net  Removed                              0.1s

# 볼륨까지 삭제
kevin@hostos1:~/fastcampus/ch10/wordpress$ docker compose down -v
```

---

## 6. Docker Compose 주요 명령어

> Docker Compose CLI 명령어 완전 정복

### 6.1 명령어 요약

| 명령어 | 설명 |
|--------|------|
| `docker compose up` | 서비스 생성 및 시작 |
| `docker compose down` | 서비스 중지 및 삭제 |
| `docker compose ps` | 서비스 상태 확인 |
| `docker compose logs` | 서비스 로그 확인 |
| `docker compose build` | 서비스 이미지 빌드 |
| `docker compose pull` | 서비스 이미지 풀 |
| `docker compose start` | 중지된 서비스 시작 |
| `docker compose stop` | 서비스 중지 |
| `docker compose restart` | 서비스 재시작 |
| `docker compose exec` | 실행 중인 컨테이너에 명령 실행 |
| `docker compose config` | Compose 파일 검증 및 출력 |
| `docker compose top` | 실행 중인 프로세스 표시 |

### 6.2 상세 명령어

**docker compose up:**

```bash
# 기본 실행 (포그라운드)
docker compose up

# 백그라운드 실행
docker compose up -d

# 이미지 재빌드 후 실행
docker compose up --build

# 특정 서비스만 실행
docker compose up -d mydb

# 스케일링과 함께 실행
docker compose up -d --scale web=3
```

**docker compose down:**

```bash
# 컨테이너와 네트워크 삭제
docker compose down

# 볼륨까지 삭제
docker compose down -v

# 이미지까지 삭제
docker compose down --rmi all

# 볼륨과 이미지 모두 삭제
docker compose down -v --rmi all
```

**docker compose logs:**

```bash
# 전체 로그
docker compose logs

# 실시간 로그 (follow)
docker compose logs -f

# 특정 서비스 로그
docker compose logs mydb

# 최근 100줄만
docker compose logs --tail=100
```

**docker compose exec:**

```bash
# 컨테이너 셸 접속
docker compose exec mydb bash

# 명령어 실행
docker compose exec mydb mysql -uroot -p

# 환경 변수 확인
docker compose exec myweb env
```

**docker compose config:**

```bash
# Compose 파일 검증
docker compose config

# 환경 변수 치환 결과 확인
docker compose config --resolve-image-digests
```

### 6.3 명령어 옵션 정리

```
┌────────────────────────────────────────────────────────────────────┐
│                Docker Compose 주요 명령어 옵션                       │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  docker compose up                                                 │
│  ├── -d, --detach      : 백그라운드 실행                           │
│  ├── --build           : 시작 전 이미지 빌드                        │
│  ├── --force-recreate  : 컨테이너 강제 재생성                       │
│  ├── --no-deps         : 의존 서비스 시작 안 함                     │
│  └── --scale SERVICE=N : 서비스 인스턴스 수 지정                    │
│                                                                    │
│  docker compose down                                               │
│  ├── -v, --volumes     : 볼륨도 함께 삭제                          │
│  ├── --rmi all         : 모든 이미지 삭제                          │
│  └── --rmi local       : 커스텀 태그 이미지만 삭제                  │
│                                                                    │
│  docker compose logs                                               │
│  ├── -f, --follow      : 실시간 로그 출력                          │
│  ├── --tail=N          : 마지막 N줄만 출력                         │
│  └── -t, --timestamps  : 타임스탬프 표시                           │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## 7. [실습] Flask + Redis 서비스

> Python Flask와 Redis를 Docker Compose로 구성하기

### 7.1 프로젝트 구조

```bash
kevin@hostos1:~$ mkdir -p ~/fastcampus/ch10/flask-redis && cd $_
kevin@hostos1:~/fastcampus/ch10/flask-redis$ pwd
/home/kevin/fastcampus/ch10/flask-redis
```

```
flask-redis/
├── docker-compose.yaml
├── Dockerfile
├── app.py
└── requirements.txt
```

### 7.2 애플리케이션 파일 작성

**requirements.txt:**

```bash
kevin@hostos1:~/fastcampus/ch10/flask-redis$ vi requirements.txt
```

```
flask==2.3.2
redis==4.5.5
```

**app.py:**

```bash
kevin@hostos1:~/fastcampus/ch10/flask-redis$ vi app.py
```

```python
from flask import Flask
from redis import Redis
import os

app = Flask(__name__)
redis = Redis(host='redis', port=6379)

@app.route('/')
def hello():
    count = redis.incr('hits')
    hostname = os.environ.get('HOSTNAME', 'unknown')
    return f'Hello FastCampus Docker! I have been seen {count} times. (Host: {hostname})\n'

@app.route('/health')
def health():
    return 'OK\n'

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=9000)
```

**Dockerfile:**

```bash
kevin@hostos1:~/fastcampus/ch10/flask-redis$ vi Dockerfile
```

```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 9000

CMD ["python", "app.py"]
```

### 7.3 docker-compose.yaml 작성

```bash
kevin@hostos1:~/fastcampus/ch10/flask-redis$ vi docker-compose.yaml
```

```yaml
version: '3.8'

services:
  redis:
    image: redis:6-alpine
    container_name: redis_server
    ports:
      - "6379:6379"
    restart: always
    volumes:
      - redis_data:/data

  flask:
    build: .
    container_name: flask_app
    ports:
      - "9000:9000"
    depends_on:
      - redis
    restart: always
    environment:
      - FLASK_ENV=development

volumes:
  redis_data: {}
```

### 7.4 서비스 실행

```bash
kevin@hostos1:~/fastcampus/ch10/flask-redis$ docker compose up -d --build
[+] Building 15.2s (10/10) FINISHED
 => [internal] load build definition from Dockerfile                   0.0s
 => [internal] load .dockerignore                                      0.0s
 => [internal] load metadata for docker.io/library/python:3.9-slim     1.2s
...
[+] Running 3/3
 ⠿ Network flask-redis_default  Created                                0.1s
 ⠿ Container redis_server       Started                                0.8s
 ⠿ Container flask_app          Started                                1.2s
```

### 7.5 테스트

```bash
kevin@hostos1:~/fastcampus/ch10/flask-redis$ curl localhost:9000
Hello FastCampus Docker! I have been seen 1 times. (Host: flask_app)

kevin@hostos1:~/fastcampus/ch10/flask-redis$ curl localhost:9000
Hello FastCampus Docker! I have been seen 2 times. (Host: flask_app)

kevin@hostos1:~/fastcampus/ch10/flask-redis$ curl localhost:9000
Hello FastCampus Docker! I have been seen 3 times. (Host: flask_app)

kevin@hostos1:~/fastcampus/ch10/flask-redis$ curl localhost:9000/health
OK
```

### 7.6 Redis 데이터 확인

```bash
kevin@hostos1:~/fastcampus/ch10/flask-redis$ docker compose exec redis redis-cli
127.0.0.1:6379> GET hits
"3"
127.0.0.1:6379> exit
```

### 7.7 로그 확인

```bash
kevin@hostos1:~/fastcampus/ch10/flask-redis$ docker compose logs -f flask
flask_app  |  * Serving Flask app 'app'
flask_app  |  * Debug mode: off
flask_app  |  * Running on all addresses (0.0.0.0)
flask_app  |  * Running on http://127.0.0.1:9000
flask_app  | 172.18.0.1 - - [20/Jun/2023 10:45:00] "GET / HTTP/1.1" 200 -
```

### 7.8 정리

```bash
kevin@hostos1:~/fastcampus/ch10/flask-redis$ docker compose down -v
```

---

## 8. 서비스 스케일링

> Docker Compose로 서비스 인스턴스 확장하기

### 8.1 스케일링 개념

Docker Compose의 `--scale` 옵션을 사용하면 동일한 서비스의 컨테이너를 여러 개 실행할 수 있다.

```
┌─────────────────────────────────────────────────────────────────────┐
│                      서비스 스케일링 개념                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   Before (scale=1):              After (scale=3):                   │
│                                                                     │
│   ┌──────────────┐               ┌──────────────┐                  │
│   │   flask_1    │               │   flask_1    │                  │
│   └──────────────┘               ├──────────────┤                  │
│                                  │   flask_2    │                  │
│                                  ├──────────────┤                  │
│                                  │   flask_3    │                  │
│                                  └──────────────┘                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 8.2 스케일링 실습

**docker-compose.yaml 수정 (포트 제거):**

```yaml
version: '3.8'

services:
  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"
    restart: always

  flask:
    build: .
    # ports 제거 (스케일링 시 포트 충돌 방지)
    expose:
      - "9000"
    depends_on:
      - redis
    restart: always
```

**스케일링 실행:**

```bash
kevin@hostos1:~/fastcampus/ch10/flask-redis$ docker compose up -d --scale flask=3
[+] Running 4/4
 ⠿ Container redis_server           Running                            0.0s
 ⠿ Container flask-redis-flask-1    Started                            1.0s
 ⠿ Container flask-redis-flask-2    Started                            1.0s
 ⠿ Container flask-redis-flask-3    Started                            1.0s
```

**상태 확인:**

```bash
kevin@hostos1:~/fastcampus/ch10/flask-redis$ docker compose ps
NAME                    IMAGE                COMMAND              SERVICE   CREATED          STATUS          PORTS
flask-redis-flask-1     flask-redis-flask    "python app.py"      flask     30 seconds ago   Up 28 seconds   9000/tcp
flask-redis-flask-2     flask-redis-flask    "python app.py"      flask     30 seconds ago   Up 28 seconds   9000/tcp
flask-redis-flask-3     flask-redis-flask    "python app.py"      flask     30 seconds ago   Up 28 seconds   9000/tcp
redis_server            redis:6-alpine       "docker-entrypoint…" redis     5 minutes ago    Up 5 minutes    0.0.0.0:6379->6379/tcp
```

### 8.3 스케일링 주의사항

| 주의사항 | 설명 |
|----------|------|
| **포트 충돌** | `ports` 대신 `expose` 사용 필요 |
| **컨테이너 이름** | `container_name` 지정 시 스케일링 불가 |
| **로드밸런싱** | 별도 구성 필요 (Nginx, HAProxy 등) |
| **상태 저장** | 각 인스턴스는 독립적, 외부 저장소 필요 |

### 8.4 스케일 조정

```bash
# 스케일 업
docker compose up -d --scale flask=5

# 스케일 다운
docker compose up -d --scale flask=2

# 스케일 초기화 (1개)
docker compose up -d --scale flask=1
```

---

## 9. [실습] Nginx + Flask 다중 앱 (ALB 구조)

> Nginx Reverse Proxy를 활용한 로드밸런싱 구성

### 9.1 아키텍처

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Nginx + Flask ALB 아키텍처                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                         ┌──────────────┐                           │
│                         │    Client    │                           │
│                         └──────┬───────┘                           │
│                                │ :80                               │
│                                ↓                                   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                      Docker Host                             │   │
│  │                                                             │   │
│  │                    ┌──────────────┐                         │   │
│  │                    │    Nginx     │                         │   │
│  │                    │   (Proxy)    │                         │   │
│  │                    └──────┬───────┘                         │   │
│  │                           │                                 │   │
│  │           ┌───────────────┼───────────────┐                 │   │
│  │           ↓               ↓               ↓                 │   │
│  │   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       │   │
│  │   │   Flask_1    │ │   Flask_2    │ │   Flask_3    │       │   │
│  │   │  (App:5001)  │ │  (App:5002)  │ │  (App:5003)  │       │   │
│  │   └──────────────┘ └──────────────┘ └──────────────┘       │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 9.2 프로젝트 구조

```bash
kevin@hostos1:~$ mkdir -p ~/fastcampus/ch10/nginx-flask && cd $_
kevin@hostos1:~/fastcampus/ch10/nginx-flask$ mkdir app nginx
```

```
nginx-flask/
├── docker-compose.yaml
├── app/
│   ├── Dockerfile
│   └── app.py
└── nginx/
    ├── Dockerfile
    └── nginx.conf
```

### 9.3 Flask 앱 작성

**app/app.py:**

```bash
kevin@hostos1:~/fastcampus/ch10/nginx-flask$ vi app/app.py
```

```python
from flask import Flask
import os

app = Flask(__name__)

@app.route('/')
def hello():
    hostname = os.environ.get('HOSTNAME', 'unknown')
    server_port = os.environ.get('SERVER_PORT', '5000')
    return f'Hello from Flask App! Server Port: {server_port}, Hostname: {hostname}\n'

@app.route('/health')
def health():
    return 'OK\n'

if __name__ == '__main__':
    port = int(os.environ.get('SERVER_PORT', 5000))
    app.run(host='0.0.0.0', port=port)
```

**app/Dockerfile:**

```bash
kevin@hostos1:~/fastcampus/ch10/nginx-flask$ vi app/Dockerfile
```

```dockerfile
FROM python:3.9-slim

WORKDIR /app

RUN pip install flask

COPY app.py .

CMD ["python", "app.py"]
```

### 9.4 Nginx 설정 작성

**nginx/nginx.conf:**

```bash
kevin@hostos1:~/fastcampus/ch10/nginx-flask$ vi nginx/nginx.conf
```

```nginx
events {
    worker_connections 1024;
}

http {
    upstream flask_backend {
        server flask_app1:5001;
        server flask_app2:5002;
        server flask_app3:5003;
    }

    server {
        listen 80;

        location / {
            proxy_pass http://flask_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        location /health {
            return 200 'Nginx OK\n';
            add_header Content-Type text/plain;
        }
    }
}
```

**nginx/Dockerfile:**

```bash
kevin@hostos1:~/fastcampus/ch10/nginx-flask$ vi nginx/Dockerfile
```

```dockerfile
FROM nginx:alpine

COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
```

### 9.5 docker-compose.yaml 작성

```bash
kevin@hostos1:~/fastcampus/ch10/nginx-flask$ vi docker-compose.yaml
```

```yaml
version: '3.8'

services:
  flask_app1:
    build:
      context: ./app
      dockerfile: Dockerfile
    container_name: flask_app1
    environment:
      - SERVER_PORT=5001
    expose:
      - "5001"
    restart: always

  flask_app2:
    build:
      context: ./app
      dockerfile: Dockerfile
    container_name: flask_app2
    environment:
      - SERVER_PORT=5002
    expose:
      - "5002"
    restart: always

  flask_app3:
    build:
      context: ./app
      dockerfile: Dockerfile
    container_name: flask_app3
    environment:
      - SERVER_PORT=5003
    expose:
      - "5003"
    restart: always

  nginx:
    build:
      context: ./nginx
      dockerfile: Dockerfile
    container_name: nginx_proxy
    ports:
      - "80:80"
    depends_on:
      - flask_app1
      - flask_app2
      - flask_app3
    restart: always
```

### 9.6 서비스 실행

```bash
kevin@hostos1:~/fastcampus/ch10/nginx-flask$ docker compose up -d --build
[+] Building 8.5s (15/15) FINISHED
...
[+] Running 5/5
 ⠿ Network nginx-flask_default  Created                                0.1s
 ⠿ Container flask_app1         Started                                0.8s
 ⠿ Container flask_app2         Started                                0.8s
 ⠿ Container flask_app3         Started                                0.8s
 ⠿ Container nginx_proxy        Started                                1.2s
```

### 9.7 로드밸런싱 테스트

```bash
kevin@hostos1:~/fastcampus/ch10/nginx-flask$ curl localhost
Hello from Flask App! Server Port: 5001, Hostname: flask_app1

kevin@hostos1:~/fastcampus/ch10/nginx-flask$ curl localhost
Hello from Flask App! Server Port: 5002, Hostname: flask_app2

kevin@hostos1:~/fastcampus/ch10/nginx-flask$ curl localhost
Hello from Flask App! Server Port: 5003, Hostname: flask_app3

kevin@hostos1:~/fastcampus/ch10/nginx-flask$ curl localhost
Hello from Flask App! Server Port: 5001, Hostname: flask_app1

# 여러 번 호출하여 Round Robin 확인
kevin@hostos1:~/fastcampus/ch10/nginx-flask$ for i in {1..6}; do curl localhost; done
Hello from Flask App! Server Port: 5002, Hostname: flask_app2
Hello from Flask App! Server Port: 5003, Hostname: flask_app3
Hello from Flask App! Server Port: 5001, Hostname: flask_app1
Hello from Flask App! Server Port: 5002, Hostname: flask_app2
Hello from Flask App! Server Port: 5003, Hostname: flask_app3
Hello from Flask App! Server Port: 5001, Hostname: flask_app1
```

### 9.8 정리

```bash
kevin@hostos1:~/fastcampus/ch10/nginx-flask$ docker compose down
```

---

## 10. [실습] 3-Tier 웹 애플리케이션

> Frontend + Backend + Database 구조 실습

### 10.1 아키텍처

```
┌─────────────────────────────────────────────────────────────────────┐
│                    3-Tier 웹 애플리케이션 아키텍처                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                         ┌──────────────┐                           │
│                         │    Client    │                           │
│                         └──────┬───────┘                           │
│                                │ :3000 (Frontend)                  │
│                                ↓                                   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                      Docker Host                             │   │
│  │                                                             │   │
│  │   ┌─────────────────────────────────────────────────────┐   │   │
│  │   │                  frontend-net                        │   │   │
│  │   │                                                     │   │   │
│  │   │  ┌──────────────┐          ┌──────────────┐        │   │   │
│  │   │  │   Frontend   │ ───────→ │   Backend    │        │   │   │
│  │   │  │   (React)    │   API    │  (Node.js)   │        │   │   │
│  │   │  │   :3000      │          │   :8080      │        │   │   │
│  │   │  └──────────────┘          └──────┬───────┘        │   │   │
│  │   │                                   │                │   │   │
│  │   └───────────────────────────────────┼────────────────┘   │   │
│  │                                       │                     │   │
│  │   ┌───────────────────────────────────┼────────────────┐   │   │
│  │   │                  backend-net      │                │   │   │
│  │   │                                   ↓                │   │   │
│  │   │                          ┌──────────────┐          │   │   │
│  │   │                          │   Database   │          │   │   │
│  │   │                          │   (MySQL)    │          │   │   │
│  │   │                          │   :3306      │          │   │   │
│  │   │                          └──────┬───────┘          │   │   │
│  │   │                                 │                  │   │   │
│  │   └─────────────────────────────────┼──────────────────┘   │   │
│  │                                     ↓                       │   │
│  │                            ┌──────────────┐                 │   │
│  │                            │   db_data    │                 │   │
│  │                            │   (Volume)   │                 │   │
│  │                            └──────────────┘                 │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 10.2 프로젝트 구조

```bash
kevin@hostos1:~$ mkdir -p ~/fastcampus/ch10/three-tier && cd $_
kevin@hostos1:~/fastcampus/ch10/three-tier$ mkdir frontend backend
```

```
three-tier/
├── docker-compose.yaml
├── frontend/
│   ├── Dockerfile
│   └── index.html
└── backend/
    ├── Dockerfile
    ├── package.json
    └── server.js
```

### 10.3 Backend 작성

**backend/package.json:**

```bash
kevin@hostos1:~/fastcampus/ch10/three-tier$ vi backend/package.json
```

```json
{
  "name": "backend-api",
  "version": "1.0.0",
  "main": "server.js",
  "dependencies": {
    "express": "^4.18.2",
    "mysql2": "^3.3.3",
    "cors": "^2.8.5"
  }
}
```

**backend/server.js:**

```bash
kevin@hostos1:~/fastcampus/ch10/three-tier$ vi backend/server.js
```

```javascript
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const dbConfig = {
  host: process.env.DB_HOST || 'database',
  user: process.env.DB_USER || 'appuser',
  password: process.env.DB_PASSWORD || 'apppassword',
  database: process.env.DB_NAME || 'appdb'
};

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', service: 'backend' });
});

app.get('/api/data', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT NOW() as current_time');
    await connection.end();
    res.json({
      message: 'Hello from Backend!',
      database_time: rows[0].current_time,
      hostname: require('os').hostname()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
```

**backend/Dockerfile:**

```bash
kevin@hostos1:~/fastcampus/ch10/three-tier$ vi backend/Dockerfile
```

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package.json .
RUN npm install

COPY . .

EXPOSE 8080

CMD ["node", "server.js"]
```

### 10.4 Frontend 작성

**frontend/index.html:**

```bash
kevin@hostos1:~/fastcampus/ch10/three-tier$ vi frontend/index.html
```

```html
<!DOCTYPE html>
<html>
<head>
    <title>3-Tier App - FastCampus Docker</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 { color: #333; }
        button {
            background: #007bff;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
        }
        button:hover { background: #0056b3; }
        #result {
            margin-top: 20px;
            padding: 15px;
            background: #e9ecef;
            border-radius: 5px;
            white-space: pre-wrap;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>FastCampus Docker - 3-Tier Application</h1>
        <p>Frontend (Nginx) -> Backend (Node.js) -> Database (MySQL)</p>
        <button onclick="fetchData()">Fetch Data from Backend</button>
        <div id="result">Click the button to fetch data...</div>
    </div>
    <script>
        async function fetchData() {
            try {
                const response = await fetch('/api/data');
                const data = await response.json();
                document.getElementById('result').textContent = JSON.stringify(data, null, 2);
            } catch (error) {
                document.getElementById('result').textContent = 'Error: ' + error.message;
            }
        }
    </script>
</body>
</html>
```

**frontend/Dockerfile:**

```bash
kevin@hostos1:~/fastcampus/ch10/three-tier$ vi frontend/Dockerfile
```

```dockerfile
FROM nginx:alpine

COPY index.html /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
```

**frontend/nginx.conf:**

```bash
kevin@hostos1:~/fastcampus/ch10/three-tier$ vi frontend/nginx.conf
```

```nginx
server {
    listen 80;

    location / {
        root /usr/share/nginx/html;
        index index.html;
    }

    location /api/ {
        proxy_pass http://backend:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 10.5 docker-compose.yaml 작성

```bash
kevin@hostos1:~/fastcampus/ch10/three-tier$ vi docker-compose.yaml
```

```yaml
version: '3.8'

services:
  database:
    image: mysql:8.0-debian
    container_name: mysql_db
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: appdb
      MYSQL_USER: appuser
      MYSQL_PASSWORD: apppassword
    volumes:
      - db_data:/var/lib/mysql
    networks:
      - backend-net
    restart: always
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: backend_api
    environment:
      DB_HOST: database
      DB_USER: appuser
      DB_PASSWORD: apppassword
      DB_NAME: appdb
    depends_on:
      database:
        condition: service_healthy
    networks:
      - frontend-net
      - backend-net
    restart: always

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: frontend_web
    ports:
      - "3000:80"
    depends_on:
      - backend
    networks:
      - frontend-net
    restart: always

networks:
  frontend-net:
    driver: bridge
  backend-net:
    driver: bridge

volumes:
  db_data:
```

### 10.6 서비스 실행

```bash
kevin@hostos1:~/fastcampus/ch10/three-tier$ docker compose up -d --build
[+] Building 25.3s (20/20) FINISHED
...
[+] Running 5/5
 ⠿ Network three-tier_frontend-net  Created                            0.1s
 ⠿ Network three-tier_backend-net   Created                            0.1s
 ⠿ Volume "three-tier_db_data"      Created                            0.0s
 ⠿ Container mysql_db               Healthy                           15.2s
 ⠿ Container backend_api            Started                           16.0s
 ⠿ Container frontend_web           Started                           16.5s
```

### 10.7 테스트

```bash
kevin@hostos1:~/fastcampus/ch10/three-tier$ docker compose ps
NAME            IMAGE                   COMMAND                  SERVICE    STATUS
backend_api     three-tier-backend      "docker-entrypoint.s…"   backend    Up 30 seconds
frontend_web    three-tier-frontend     "/docker-entrypoint.…"   frontend   Up 29 seconds
mysql_db        mysql:8.0-debian        "docker-entrypoint.s…"   database   Up 45 seconds (healthy)

kevin@hostos1:~/fastcampus/ch10/three-tier$ curl localhost:3000
<!DOCTYPE html>
<html>
<head>
    <title>3-Tier App - FastCampus Docker</title>
...

kevin@hostos1:~/fastcampus/ch10/three-tier$ curl localhost:3000/api/health
{"status":"OK","service":"backend"}

kevin@hostos1:~/fastcampus/ch10/three-tier$ curl localhost:3000/api/data
{"message":"Hello from Backend!","database_time":"2023-06-20T11:30:00.000Z","hostname":"backend_api"}
```

웹 브라우저에서 `http://<호스트IP>:3000` 접속하여 확인

### 10.8 데이터 영속성 확인

```bash
# 서비스 종료
kevin@hostos1:~/fastcampus/ch10/three-tier$ docker compose down

# 볼륨 확인 (유지됨)
kevin@hostos1:~/fastcampus/ch10/three-tier$ docker volume ls | grep three-tier
local     three-tier_db_data

# 다시 시작
kevin@hostos1:~/fastcampus/ch10/three-tier$ docker compose up -d

# 데이터 유지 확인
kevin@hostos1:~/fastcampus/ch10/three-tier$ curl localhost:3000/api/data
```

### 10.9 정리

```bash
# 볼륨 포함 전체 삭제
kevin@hostos1:~/fastcampus/ch10/three-tier$ docker compose down -v
```

---

## 11. Docker Compose vs Kubernetes

> Docker Compose와 Kubernetes의 차이점 이해하기

### 11.1 비교 표

| 항목 | Docker Compose | Kubernetes |
|------|----------------|------------|
| **범위** | 단일 호스트 | 멀티 호스트 클러스터 |
| **확장성** | 수동 스케일링, 제한적 | 자동 스케일링 (HPA) |
| **로드밸런싱** | 미지원 (별도 구성 필요) | 내장 지원 (Service) |
| **배포 전략** | 단순 (재시작) | Rolling / Blue-Green / Canary |
| **자가 치유** | 제한적 (restart) | 자동 복구 |
| **설정 관리** | 환경 변수, 파일 | ConfigMap, Secret |
| **서비스 디스커버리** | Docker DNS | 내장 DNS, Service |
| **학습 곡선** | 낮음 | 높음 |
| **사용 목적** | 개발/테스트 환경 | 프로덕션 환경 |

### 11.2 사용 시나리오

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Docker Compose vs Kubernetes                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Docker Compose:                     Kubernetes:                    │
│  ┌───────────────────────┐           ┌───────────────────────┐     │
│  │ - 로컬 개발 환경       │           │ - 프로덕션 배포        │     │
│  │ - CI/CD 테스트        │           │ - 대규모 트래픽 처리   │     │
│  │ - 소규모 프로젝트      │           │ - 고가용성 요구       │     │
│  │ - 빠른 프로토타이핑    │           │ - 멀티 클라우드        │     │
│  │ - 단일 서버 배포       │           │ - 마이크로서비스       │     │
│  └───────────────────────┘           └───────────────────────┘     │
│                                                                     │
│  개발 → 테스트 → 스테이징 → 프로덕션                                 │
│   └── Docker Compose ──┘     └── Kubernetes ──┘                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 11.3 Docker Compose에서 Kubernetes로

Docker Compose를 사용해 개발한 애플리케이션을 Kubernetes로 마이그레이션하는 것이 일반적인 패턴이다.

**마이그레이션 도구:**
- `kompose`: docker-compose.yaml을 Kubernetes 매니페스트로 변환
- Docker Desktop: Kubernetes 통합 지원

```bash
# kompose를 사용한 변환 예시
kompose convert -f docker-compose.yaml
```

### 11.4 선택 가이드

| 질문 | Docker Compose | Kubernetes |
|------|----------------|------------|
| 단일 서버인가? | O | |
| 로컬 개발 환경인가? | O | |
| 빠른 프로토타이핑이 필요한가? | O | |
| 자동 스케일링이 필요한가? | | O |
| 무중단 배포가 필요한가? | | O |
| 멀티 호스트 운영인가? | | O |
| 고가용성이 필수인가? | | O |

---

## 요약

### 핵심 개념

1. **Docker Compose 역할**
   - 멀티 컨테이너 애플리케이션을 YAML 파일로 정의
   - 서비스, 네트워크, 볼륨을 선언적으로 관리
   - 개발/테스트 환경에 최적화

2. **docker-compose.yaml 구조**
   - `services`: 컨테이너 서비스 정의
   - `networks`: 네트워크 정의
   - `volumes`: 볼륨 정의

3. **주요 명령어**

| 명령어 | 설명 |
|--------|------|
| `docker compose up -d` | 서비스 시작 (백그라운드) |
| `docker compose down` | 서비스 종료 및 삭제 |
| `docker compose ps` | 서비스 상태 확인 |
| `docker compose logs -f` | 실시간 로그 확인 |
| `docker compose build` | 이미지 빌드 |
| `docker compose exec` | 컨테이너 명령 실행 |

4. **핵심 설정 옵션**
   - `depends_on`: 서비스 의존성 (시작 순서)
   - `restart`: 재시작 정책
   - `healthcheck`: 헬스체크 설정
   - `build`: Dockerfile 빌드 설정

### 주요 명령어 정리

```bash
# 서비스 시작
docker compose up -d

# 서비스 종료
docker compose down

# 볼륨 포함 삭제
docker compose down -v

# 이미지 재빌드 후 시작
docker compose up -d --build

# 스케일링
docker compose up -d --scale web=3

# 로그 확인
docker compose logs -f [서비스명]

# 컨테이너 접속
docker compose exec [서비스명] bash

# 설정 검증
docker compose config
```

---

## 체크리스트 (통과 필수)

- [ ] Docker Compose의 역할과 장점을 설명할 수 있다
- [ ] docker-compose.yaml 파일을 작성할 수 있다
- [ ] services, networks, volumes 섹션을 이해하고 사용할 수 있다
- [ ] docker compose up/down 명령을 사용할 수 있다
- [ ] depends_on으로 서비스 의존성을 설정할 수 있다
- [ ] 환경 변수와 볼륨을 설정할 수 있다
- [ ] 서비스 스케일링을 수행할 수 있다
- [ ] Nginx를 활용한 로드밸런싱을 구성할 수 있다
- [ ] 3-Tier 아키텍처를 Docker Compose로 구성할 수 있다
- [ ] Docker Compose와 Kubernetes의 차이점을 설명할 수 있다

---

## 다음 챕터 예고

### Chapter 11. Docker Swarm

다음 장에서는:

- Docker Swarm 개념과 아키텍처
- Swarm 클러스터 구성
- 서비스 배포와 스케일링
- Overlay 네트워크
- 롤링 업데이트

를 **실습 중심**으로 다룹니다.
