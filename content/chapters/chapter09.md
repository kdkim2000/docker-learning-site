# Chapter 09. Dockerfile

## 목차

- [Clip 1. Dockerfile 이란?](#1-dockerfile-이란)
- [Clip 2. Dockerfile 기본 구조와 작성 규칙](#2-dockerfile-기본-구조와-작성-규칙)
- [Clip 3. FROM - 베이스 이미지](#3-from---베이스-이미지)
- [Clip 4. RUN - 명령 실행](#4-run---명령-실행)
- [Clip 5. COPY vs ADD](#5-copy-vs-add)
- [Clip 6. WORKDIR, ENV, EXPOSE](#6-workdir-env-expose)
- [Clip 7. CMD vs ENTRYPOINT](#7-cmd-vs-entrypoint)
- [Clip 8. [실습] Nginx 이미지 만들기](#8-실습-nginx-이미지-만들기)
- [Clip 9. [실습] Node.js 앱 이미지](#9-실습-nodejs-앱-이미지)
- [Clip 10. Dockerfile 캐시와 Best Practices](#10-dockerfile-캐시와-best-practices)

---

## 1. Dockerfile 이란?

> 컨테이너 이미지를 생성하기 위한 설계도(Recipe) 이해하기

### 1.1 Dockerfile 개요

- Dockerfile은 **컨테이너 이미지를 생성하기 위한 설계도(Recipe)**이다.
- 사람이 수동으로 하던 설치/설정 과정을 **코드로 정의**한다.
- 동일한 환경을 **재현 가능(Reproducible)**하게 만든다.
- CI/CD 파이프라인에서 자동 빌드가 가능하다.

### 1.2 Dockerfile 기반 이미지 빌드 흐름

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Dockerfile 빌드 흐름                          │
│                                                                     │
│   ┌──────────────┐     ┌──────────────┐     ┌──────────────────┐   │
│   │  Dockerfile  │ ──→ │ docker build │ ──→ │   Docker Image   │   │
│   │   작성       │     │   실행       │     │      생성        │   │
│   └──────────────┘     └──────────────┘     └──────────────────┘   │
│                                                      │              │
│                                                      ↓              │
│                                              ┌──────────────────┐   │
│                                              │    Container     │   │
│                                              │      실행        │   │
│                                              └──────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

**빌드 과정:**

1. Dockerfile 작성
2. `docker build` 실행
3. Docker daemon이 명령어를 **위에서 아래로 순차 실행**
4. 각 명령은 **레이어(Image Layer)** 생성

> **참고:** chapter08에서 학습한 **Image Layer / Cache 구조**가 그대로 적용된다.

### 1.3 Dockerfile의 장점

| 장점 | 설명 |
|-----|------|
| **재현성** | 동일한 Dockerfile로 언제 어디서나 같은 이미지 생성 |
| **버전 관리** | Git 등으로 Dockerfile 변경 이력 추적 가능 |
| **자동화** | CI/CD 파이프라인에서 자동 빌드 가능 |
| **문서화** | 이미지 구성 과정이 코드로 명확히 기록됨 |
| **공유 용이** | 이미지 대신 Dockerfile만 공유해도 동일 환경 구축 가능 |

---

## 2. Dockerfile 기본 구조와 작성 규칙

> Dockerfile의 기본 구조와 문법 이해하기

### 2.1 Dockerfile 기본 구조

```dockerfile
# 베이스 이미지 지정
FROM base-image

# 메타데이터
LABEL key=value

# 환경 변수
ENV key=value

# 패키지 설치
RUN command

# 소스 코드 복사
COPY src dest

# 포트 노출
EXPOSE 8080

# 실행 명령
CMD ["executable", "param"]
```

### 2.2 Dockerfile 작성 규칙

| 규칙 | 설명 |
|------|------|
| **대소문자** | 명령어는 대소문자 구분 없음 (관례적으로 **대문자** 사용) |
| **한 줄 한 명령** | 한 줄에 하나의 명령어 작성 |
| **주석** | `#`으로 시작하는 줄은 주석 |
| **순차 실행** | 위에서 아래로 순차적으로 실행 |
| **레이어 생성** | 대부분의 명령은 새로운 레이어를 생성 |

### 2.3 Dockerfile 명령어 종류

```
┌────────────────────────────────────────────────────────────────────┐
│                     Dockerfile 명령어 분류                          │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │
│  │   빌드 단계      │  │   설정 단계      │  │   실행 단계      │    │
│  ├─────────────────┤  ├─────────────────┤  ├─────────────────┤    │
│  │ FROM            │  │ ENV             │  │ CMD             │    │
│  │ RUN             │  │ ARG             │  │ ENTRYPOINT      │    │
│  │ COPY            │  │ WORKDIR         │  │ EXPOSE          │    │
│  │ ADD             │  │ LABEL           │  │ VOLUME          │    │
│  └─────────────────┘  │ USER            │  │ HEALTHCHECK     │    │
│                       └─────────────────┘  └─────────────────┘    │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## 3. FROM - 베이스 이미지

> 모든 Dockerfile의 시작점, 베이스 이미지 지정하기

### 3.1 FROM 명령어 개요

```dockerfile
FROM ubuntu:22.04
```

- Dockerfile **최초 명령은 반드시 FROM**이어야 한다.
- 베이스 이미지 위에 새로운 레이어를 쌓는다.
- 태그를 명시하지 않으면 `latest` 태그가 사용된다.

### 3.2 FROM 문법

```dockerfile
# 기본 형식
FROM <image>

# 태그 지정
FROM <image>:<tag>

# 다이제스트 지정 (정확한 버전 보장)
FROM <image>@<digest>

# AS를 이용한 빌드 스테이지 명명 (Multi-stage build)
FROM <image> AS <stage-name>
```

### 3.3 베이스 이미지 선택 Best Practice

| 이미지 유형 | 특징 | 예시 |
|------------|------|------|
| **alpine** | 가장 경량 (약 5MB), musl libc 사용 | `node:18-alpine` |
| **slim** | Debian 기반 경량화 버전 | `python:3.11-slim` |
| **standard** | 기본 이미지, 대부분의 도구 포함 | `ubuntu:22.04` |
| **scratch** | 빈 이미지, Go 바이너리 등에 사용 | `FROM scratch` |

**권장 사항:**

```dockerfile
# 권장: 경량 이미지 사용
FROM node:18-alpine

# 권장: 태그 명시로 재현성 확보
FROM python:3.11-slim

# 비권장: latest 태그 사용
FROM ubuntu
```

---

## 4. RUN - 명령 실행

> 이미지 빌드 시 명령어 실행하기

### 4.1 RUN 명령어 개요

```dockerfile
RUN apt-get update && apt-get install -y nginx
```

- 이미지 빌드 시 실행되는 명령어
- 실행 결과가 **새로운 레이어로 저장**된다.
- Shell 형식과 Exec 형식 두 가지 방식이 있다.

### 4.2 RUN 문법

```dockerfile
# Shell 형식 (/bin/sh -c 로 실행)
RUN <command>

# Exec 형식 (직접 실행)
RUN ["executable", "param1", "param2"]
```

**Shell 형식 예시:**

```dockerfile
RUN apt-get update && apt-get install -y nginx
RUN echo "Hello World" > /tmp/hello.txt
```

**Exec 형식 예시:**

```dockerfile
RUN ["apt-get", "update"]
RUN ["/bin/bash", "-c", "echo Hello"]
```

### 4.3 RUN 최적화

**잘못된 예 (레이어가 많아짐):**

```dockerfile
RUN apt-get update
RUN apt-get install -y nginx
RUN apt-get install -y curl
RUN rm -rf /var/lib/apt/lists/*
```

**권장 예 (단일 레이어, 캐시 정리 포함):**

```dockerfile
RUN apt-get update && \
    apt-get install -y \
        nginx \
        curl \
    && rm -rf /var/lib/apt/lists/*
```

### 4.4 RUN 최적화 원칙

```
┌────────────────────────────────────────────────────────────────────┐
│                      RUN 명령어 최적화 원칙                          │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  1. 관련 명령어는 하나의 RUN으로 통합 (&&로 연결)                    │
│                                                                    │
│  2. 패키지 캐시 정리 포함                                           │
│     - apt: rm -rf /var/lib/apt/lists/*                            │
│     - yum: yum clean all                                          │
│     - apk: rm -rf /var/cache/apk/*                                │
│                                                                    │
│  3. 버전을 명시하여 재현성 확보                                     │
│     - apt-get install nginx=1.18.0-0ubuntu1                       │
│                                                                    │
│  4. --no-install-recommends로 불필요 패키지 제외                    │
│     - apt-get install --no-install-recommends                     │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## 5. COPY vs ADD

> 파일 복사 명령어의 차이점과 사용법

### 5.1 COPY 명령어 (권장)

```dockerfile
COPY ./app /app
```

- **단순 파일/디렉토리 복사**
- 명확하고 예측 가능한 동작
- 실무에서 **권장**되는 방식

**COPY 문법:**

```dockerfile
# 기본 형식
COPY <src> <dest>

# 여러 파일 복사
COPY file1.txt file2.txt /app/

# 와일드카드 사용
COPY *.txt /app/

# 소유권 지정
COPY --chown=user:group <src> <dest>
```

### 5.2 ADD 명령어 (특수 목적)

```dockerfile
ADD app.tar.gz /app
```

- **자동 압축 해제** 기능 (tar, gzip, bzip2, xz)
- **URL 다운로드** 기능 (권장하지 않음)
- 동작이 복잡하여 예측이 어려울 수 있음

**ADD 문법:**

```dockerfile
# 압축 파일 자동 해제
ADD app.tar.gz /app

# URL 다운로드 (비권장)
ADD https://example.com/file.txt /app/
```

### 5.3 COPY vs ADD 비교

| 기능 | COPY | ADD |
|------|------|-----|
| 파일/디렉토리 복사 | O | O |
| 압축 파일 자동 해제 | X | O |
| URL 다운로드 | X | O |
| 동작 예측성 | 높음 | 낮음 |
| **실무 권장** | **O** | 특수 목적만 |

**권장 사용법:**

```dockerfile
# 일반 파일 복사 - COPY 사용
COPY ./src /app/src
COPY package.json /app/

# 압축 파일 해제가 필요한 경우만 ADD 사용
ADD archive.tar.gz /app/

# URL 다운로드는 RUN + curl 권장
RUN curl -O https://example.com/file.txt
```

---

## 6. WORKDIR, ENV, EXPOSE

> 작업 디렉토리, 환경 변수, 포트 설정하기

### 6.1 WORKDIR - 작업 디렉토리

```dockerfile
WORKDIR /app
```

- 이후 명령의 **기준 경로** 설정
- 디렉토리가 없으면 **자동 생성**
- 여러 번 사용 가능 (상대 경로 지원)

**WORKDIR 예시:**

```dockerfile
WORKDIR /app
COPY . .
RUN npm install

# 상대 경로로 이동
WORKDIR src
RUN ls -la
```

**WORKDIR vs RUN cd:**

```dockerfile
# 권장: WORKDIR 사용
WORKDIR /app
RUN npm install

# 비권장: RUN cd 사용 (다음 RUN에 영향 없음)
RUN cd /app
RUN npm install  # 이전 경로에서 실행됨
```

### 6.2 ENV - 환경 변수

```dockerfile
ENV NODE_ENV=production
ENV PORT=3000
```

- **빌드 시와 컨테이너 실행 시** 모두 유지
- 애플리케이션 설정에 활용
- docker run -e 옵션으로 덮어쓰기 가능

**ENV 문법:**

```dockerfile
# 단일 변수
ENV NODE_ENV=production

# 여러 변수 (한 줄)
ENV NODE_ENV=production PORT=3000

# 여러 변수 (여러 줄)
ENV NODE_ENV=production \
    PORT=3000 \
    DEBUG=false
```

### 6.3 ARG vs ENV 비교

| 특성 | ARG | ENV |
|------|-----|-----|
| 빌드 시 사용 | O | O |
| 컨테이너 실행 시 사용 | X | O |
| docker build --build-arg로 전달 | O | X |
| docker run -e로 전달 | X | O |

**ARG와 ENV 조합 예시:**

```dockerfile
# 빌드 시 전달받아 ENV로 설정
ARG NODE_VERSION=18
ENV NODE_VERSION=${NODE_VERSION}
```

### 6.4 EXPOSE - 포트 명시

```dockerfile
EXPOSE 3000
```

- **문서적 의미** (실제 포트 개방 아님)
- 어떤 포트를 사용하는지 **명시**
- 실제 포트 매핑은 `docker run -p` 필요

**EXPOSE 예시:**

```dockerfile
# 단일 포트
EXPOSE 3000

# 여러 포트
EXPOSE 80 443

# 프로토콜 지정 (기본: TCP)
EXPOSE 80/tcp
EXPOSE 53/udp
```

**EXPOSE와 docker run -p:**

```bash
# EXPOSE 3000이 있어도 실제 접근을 위해서는 -p 필요
docker run -p 8080:3000 my-app
```

---

## 7. CMD vs ENTRYPOINT

> 컨테이너 실행 명령 설정하기

### 7.1 CMD - 기본 실행 명령

```dockerfile
CMD ["node", "app.js"]
```

- 컨테이너 시작 시 **기본 실행 명령**
- `docker run` 시 **인자로 덮어쓰기 가능**
- Dockerfile에서 **마지막 CMD만 유효**

**CMD 문법:**

```dockerfile
# Exec 형식 (권장)
CMD ["executable", "param1", "param2"]

# Shell 형식
CMD command param1 param2

# ENTRYPOINT의 기본 인자로 사용
CMD ["param1", "param2"]
```

### 7.2 ENTRYPOINT - 고정 실행 파일

```dockerfile
ENTRYPOINT ["node", "app.js"]
```

- 컨테이너의 **고정 실행 파일** 지정
- `docker run` 시 **파라미터만 추가** 가능
- --entrypoint 옵션으로만 덮어쓰기 가능

**ENTRYPOINT 문법:**

```dockerfile
# Exec 형식 (권장)
ENTRYPOINT ["executable", "param1", "param2"]

# Shell 형식
ENTRYPOINT command param1 param2
```

### 7.3 CMD vs ENTRYPOINT 비교

| 특성 | CMD | ENTRYPOINT |
|------|-----|------------|
| 목적 | 기본 명령 제공 | 고정 실행 파일 지정 |
| docker run 인자 | 완전히 덮어씀 | 추가 인자로 전달 |
| 덮어쓰기 방법 | docker run 인자 | --entrypoint 옵션 |
| 단독 사용 | O | O |
| 조합 사용 | ENTRYPOINT의 기본 인자 | CMD와 조합하여 유연성 확보 |

### 7.4 CMD와 ENTRYPOINT 조합 패턴 (권장)

```dockerfile
# ENTRYPOINT: 고정 실행 파일
# CMD: 기본 인자 (덮어쓰기 가능)
ENTRYPOINT ["node"]
CMD ["app.js"]
```

**실행 예시:**

```bash
# 기본 실행: node app.js
docker run my-app

# 인자 변경: node server.js
docker run my-app server.js

# ENTRYPOINT 변경: /bin/sh
docker run --entrypoint /bin/sh my-app
```

### 7.5 실행 명령 동작 흐름

```
┌──────────────────────────────────────────────────────────────────────┐
│                    CMD / ENTRYPOINT 동작 흐름                         │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Case 1: CMD만 사용                                                  │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ Dockerfile: CMD ["node", "app.js"]                          │    │
│  │ docker run my-app         →  node app.js                    │    │
│  │ docker run my-app test.js →  test.js (CMD 완전 대체)         │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  Case 2: ENTRYPOINT만 사용                                           │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ Dockerfile: ENTRYPOINT ["node", "app.js"]                   │    │
│  │ docker run my-app              →  node app.js               │    │
│  │ docker run my-app --version    →  node app.js --version     │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  Case 3: ENTRYPOINT + CMD 조합 (권장)                                │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ Dockerfile: ENTRYPOINT ["node"]                             │    │
│  │             CMD ["app.js"]                                  │    │
│  │ docker run my-app         →  node app.js                    │    │
│  │ docker run my-app test.js →  node test.js (유연한 인자 변경) │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 8. [실습] Nginx 이미지 만들기

> Dockerfile로 커스텀 Nginx 이미지 빌드하기

### 8.1 프로젝트 구조

```bash
kevin@hostos1:~$ mkdir -p ~/fastcampus/ch09/nginx-custom && cd $_
kevin@hostos1:~/fastcampus/ch09/nginx-custom$ pwd
/home/kevin/fastcampus/ch09/nginx-custom
```

### 8.2 index.html 작성

```bash
kevin@hostos1:~/fastcampus/ch09/nginx-custom$ vi index.html
```

```html
<!DOCTYPE html>
<html>
<head>
    <title>FastCampus Docker</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .container {
            text-align: center;
        }
        h1 { font-size: 3em; }
        p { font-size: 1.5em; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Welcome to FastCampus Docker!</h1>
        <p>Custom Nginx Image - Chapter 09</p>
    </div>
</body>
</html>
```

### 8.3 Dockerfile 작성

```bash
kevin@hostos1:~/fastcampus/ch09/nginx-custom$ vi Dockerfile
```

```dockerfile
# 베이스 이미지 (경량 알파인 버전)
FROM nginx:alpine

# 메타데이터
LABEL maintainer="fastcampus"
LABEL description="Custom Nginx Image for Docker Course"

# 커스텀 HTML 복사
COPY index.html /usr/share/nginx/html/index.html

# 포트 명시 (문서 목적)
EXPOSE 80

# nginx는 기본 CMD가 있으므로 별도 지정 불필요
```

### 8.4 이미지 빌드

```bash
kevin@hostos1:~/fastcampus/ch09/nginx-custom$ docker build -t my-nginx:1.0 .
Sending build context to Docker daemon  3.072kB
Step 1/5 : FROM nginx:alpine
 ---> 2bc7edbc3cf2
Step 2/5 : LABEL maintainer="fastcampus"
 ---> Running in 3f4d5e6a7b8c
Removing intermediate container 3f4d5e6a7b8c
 ---> 4a5b6c7d8e9f
Step 3/5 : LABEL description="Custom Nginx Image for Docker Course"
 ---> Running in 1a2b3c4d5e6f
Removing intermediate container 1a2b3c4d5e6f
 ---> 5b6c7d8e9f0a
Step 4/5 : COPY index.html /usr/share/nginx/html/index.html
 ---> 6c7d8e9f0a1b
Step 5/5 : EXPOSE 80
 ---> Running in 7d8e9f0a1b2c
Removing intermediate container 7d8e9f0a1b2c
 ---> 8e9f0a1b2c3d
Successfully built 8e9f0a1b2c3d
Successfully tagged my-nginx:1.0
```

### 8.5 이미지 확인

```bash
kevin@hostos1:~/fastcampus/ch09/nginx-custom$ docker images | grep my-nginx
my-nginx   1.0       8e9f0a1b2c3d   10 seconds ago   23.5MB
```

### 8.6 컨테이너 실행 및 테스트

```bash
kevin@hostos1:~/fastcampus/ch09/nginx-custom$ docker run -d -p 8080:80 --name my-nginx-container my-nginx:1.0
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0

kevin@hostos1:~/fastcampus/ch09/nginx-custom$ docker ps | grep my-nginx
a1b2c3d4e5f6   my-nginx:1.0   "/docker-entrypoint.…"   5 seconds ago   Up 4 seconds   0.0.0.0:8080->80/tcp   my-nginx-container

kevin@hostos1:~/fastcampus/ch09/nginx-custom$ curl localhost:8080
<!DOCTYPE html>
<html>
<head>
    <title>FastCampus Docker</title>
...
```

### 8.7 정리

```bash
kevin@hostos1:~/fastcampus/ch09/nginx-custom$ docker stop my-nginx-container
kevin@hostos1:~/fastcampus/ch09/nginx-custom$ docker rm my-nginx-container
```

---

## 9. [실습] Node.js 앱 이미지

> Node.js 애플리케이션을 Dockerfile로 컨테이너화하기

### 9.1 프로젝트 구조

```bash
kevin@hostos1:~$ mkdir -p ~/fastcampus/ch09/node-app && cd $_
kevin@hostos1:~/fastcampus/ch09/node-app$ pwd
/home/kevin/fastcampus/ch09/node-app
```

### 9.2 Node.js 애플리케이션 작성

**package.json:**

```bash
kevin@hostos1:~/fastcampus/ch09/node-app$ vi package.json
```

```json
{
  "name": "fastcampus-docker-app",
  "version": "1.0.0",
  "description": "FastCampus Docker Course - Node.js App",
  "main": "app.js",
  "scripts": {
    "start": "node app.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  }
}
```

**app.js:**

```bash
kevin@hostos1:~/fastcampus/ch09/node-app$ vi app.js
```

```javascript
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to FastCampus Docker!',
        hostname: require('os').hostname(),
        timestamp: new Date().toISOString()
    });
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
```

### 9.3 Dockerfile 작성

```bash
kevin@hostos1:~/fastcampus/ch09/node-app$ vi Dockerfile
```

```dockerfile
# 베이스 이미지 (경량 알파인 버전)
FROM node:18-alpine

# 메타데이터
LABEL maintainer="fastcampus"
LABEL description="Node.js App for Docker Course"

# 작업 디렉토리 설정
WORKDIR /app

# 의존성 파일 먼저 복사 (캐시 최적화)
COPY package*.json ./

# 의존성 설치
RUN npm install --production

# 소스 코드 복사
COPY . .

# 환경 변수 설정
ENV NODE_ENV=production
ENV PORT=3000

# 포트 명시
EXPOSE 3000

# 실행 명령
CMD ["npm", "start"]
```

### 9.4 .dockerignore 작성

```bash
kevin@hostos1:~/fastcampus/ch09/node-app$ vi .dockerignore
```

```
node_modules
npm-debug.log
Dockerfile
.dockerignore
.git
.gitignore
README.md
```

### 9.5 이미지 빌드

```bash
kevin@hostos1:~/fastcampus/ch09/node-app$ docker build -t my-node-app:1.0 .
Sending build context to Docker daemon  4.096kB
Step 1/10 : FROM node:18-alpine
 ---> a1b2c3d4e5f6
Step 2/10 : LABEL maintainer="fastcampus"
 ---> Running in 1a2b3c4d5e6f
...
Step 7/10 : RUN npm install --production
 ---> Running in 7d8e9f0a1b2c
npm WARN deprecated ...
added 57 packages in 3s
...
Successfully built 9f0a1b2c3d4e
Successfully tagged my-node-app:1.0
```

### 9.6 이미지 확인 및 레이어 분석

```bash
kevin@hostos1:~/fastcampus/ch09/node-app$ docker images | grep my-node
my-node-app   1.0       9f0a1b2c3d4e   30 seconds ago   118MB

kevin@hostos1:~/fastcampus/ch09/node-app$ docker history my-node-app:1.0
IMAGE          CREATED          CREATED BY                                      SIZE
9f0a1b2c3d4e   30 seconds ago   /bin/sh -c #(nop)  CMD ["npm" "start"]          0B
a1b2c3d4e5f6   30 seconds ago   /bin/sh -c #(nop)  EXPOSE 3000                  0B
b2c3d4e5f6g7   31 seconds ago   /bin/sh -c #(nop)  ENV PORT=3000                0B
c3d4e5f6g7h8   31 seconds ago   /bin/sh -c #(nop)  ENV NODE_ENV=production      0B
d4e5f6g7h8i9   31 seconds ago   /bin/sh -c #(nop) COPY dir:... in .             1.5kB
e5f6g7h8i9j0   32 seconds ago   /bin/sh -c npm install --production             15.2MB
...
```

### 9.7 컨테이너 실행 및 테스트

```bash
kevin@hostos1:~/fastcampus/ch09/node-app$ docker run -d -p 3000:3000 --name my-node-container my-node-app:1.0
f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5

kevin@hostos1:~/fastcampus/ch09/node-app$ docker ps | grep my-node
f6g7h8i9j0k1   my-node-app:1.0   "docker-entrypoint.s…"   5 seconds ago   Up 4 seconds   0.0.0.0:3000->3000/tcp   my-node-container

kevin@hostos1:~/fastcampus/ch09/node-app$ curl localhost:3000
{"message":"Welcome to FastCampus Docker!","hostname":"f6g7h8i9j0k1","timestamp":"2023-06-20T10:30:00.000Z"}

kevin@hostos1:~/fastcampus/ch09/node-app$ curl localhost:3000/health
{"status":"healthy"}
```

### 9.8 로그 확인

```bash
kevin@hostos1:~/fastcampus/ch09/node-app$ docker logs my-node-container
Server running on port 3000
```

### 9.9 정리

```bash
kevin@hostos1:~/fastcampus/ch09/node-app$ docker stop my-node-container
kevin@hostos1:~/fastcampus/ch09/node-app$ docker rm my-node-container
```

---

## 10. Dockerfile 캐시와 Best Practices

> 빌드 최적화를 위한 캐시 이해와 실무 권장 사항

### 10.1 Docker 빌드 캐시 이해

- Docker는 **명령 단위로 캐시**를 생성한다.
- 변경된 라인 이후의 모든 명령은 **재빌드**된다.
- 캐시를 효과적으로 활용하면 빌드 시간을 크게 단축할 수 있다.

```
┌────────────────────────────────────────────────────────────────────┐
│                      Docker 빌드 캐시 동작                          │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  첫 번째 빌드:                                                     │
│  ┌─────────────────┐                                              │
│  │ FROM node:18    │ → 캐시 생성                                  │
│  │ WORKDIR /app    │ → 캐시 생성                                  │
│  │ COPY package*   │ → 캐시 생성                                  │
│  │ RUN npm install │ → 캐시 생성 (시간 소요)                       │
│  │ COPY . .        │ → 캐시 생성                                  │
│  │ CMD ["npm"...]  │ → 캐시 생성                                  │
│  └─────────────────┘                                              │
│                                                                    │
│  두 번째 빌드 (소스 코드만 변경):                                   │
│  ┌─────────────────┐                                              │
│  │ FROM node:18    │ → 캐시 사용 ✓                                │
│  │ WORKDIR /app    │ → 캐시 사용 ✓                                │
│  │ COPY package*   │ → 캐시 사용 ✓ (변경 없음)                     │
│  │ RUN npm install │ → 캐시 사용 ✓ (변경 없음)                     │
│  │ COPY . .        │ → 재빌드 (소스 변경됨)                        │
│  │ CMD ["npm"...]  │ → 재빌드 (이전 단계 변경됨)                   │
│  └─────────────────┘                                              │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### 10.2 캐시 최적화 순서

**비효율적인 순서:**

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .                    # 모든 파일 복사 (소스 변경 시 캐시 무효화)
RUN npm install             # 매번 재설치
CMD ["npm", "start"]
```

**최적화된 순서:**

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./       # 의존성 파일만 먼저 복사
RUN npm install             # 의존성 변경 없으면 캐시 사용
COPY . .                    # 소스 코드는 마지막에 복사
CMD ["npm", "start"]
```

### 10.3 Best Practices 요약

| 항목 | 권장 사항 |
|------|----------|
| **베이스 이미지** | 경량 이미지 사용 (alpine, slim) |
| **태그 명시** | 버전 태그 명시하여 재현성 확보 |
| **RUN 최적화** | 관련 명령 통합, 캐시 정리 포함 |
| **COPY vs ADD** | 단순 복사는 COPY 사용 |
| **캐시 순서** | 변경 적은 항목을 위에 배치 |
| **불필요 파일** | .dockerignore로 제외 |
| **CMD** | 하나만 사용, Exec 형식 권장 |
| **USER** | root 대신 일반 사용자 권장 |
| **HEALTHCHECK** | 컨테이너 상태 체크 설정 |

### 10.4 .dockerignore 활용

```bash
# .dockerignore 예시
node_modules
npm-debug.log
.git
.gitignore
.env
*.md
Dockerfile
.dockerignore
```

### 10.5 Multi-stage Build (고급)

이미지 크기를 최소화하기 위한 멀티 스테이지 빌드:

```dockerfile
# 빌드 스테이지
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 프로덕션 스테이지
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 요약

### 핵심 개념

1. **Dockerfile 기본**
   - 이미지 생성을 위한 설계도(Recipe)
   - 위에서 아래로 순차 실행
   - 각 명령이 레이어를 생성

2. **주요 명령어**

| 명령어 | 용도 | 예시 |
|--------|------|------|
| FROM | 베이스 이미지 지정 | `FROM node:18-alpine` |
| RUN | 빌드 시 명령 실행 | `RUN npm install` |
| COPY | 파일 복사 | `COPY . /app` |
| ADD | 파일 복사 + 압축해제 | `ADD app.tar.gz /app` |
| WORKDIR | 작업 디렉토리 설정 | `WORKDIR /app` |
| ENV | 환경 변수 설정 | `ENV NODE_ENV=production` |
| EXPOSE | 포트 문서화 | `EXPOSE 3000` |
| CMD | 기본 실행 명령 | `CMD ["npm", "start"]` |
| ENTRYPOINT | 고정 실행 파일 | `ENTRYPOINT ["node"]` |

3. **캐시 최적화**
   - 변경 적은 항목을 위에 배치
   - 의존성 파일 먼저 복사
   - 소스 코드는 마지막에 복사

### 주요 명령어 정리

```bash
# 이미지 빌드
docker build -t <이미지명>:<태그> .
docker build -t my-app:1.0 .

# 빌드 캐시 없이 빌드
docker build --no-cache -t my-app:1.0 .

# 특정 Dockerfile 지정
docker build -f Dockerfile.prod -t my-app:prod .

# 빌드 인자 전달
docker build --build-arg VERSION=1.0 -t my-app:1.0 .

# 이미지 히스토리 확인
docker history <이미지명>

# 이미지 상세 정보
docker inspect <이미지명>
```

---

## 체크리스트 (통과 필수)

- [ ] Dockerfile의 역할과 빌드 흐름을 설명할 수 있다
- [ ] FROM, RUN, COPY, CMD 등 주요 명령어를 사용할 수 있다
- [ ] COPY와 ADD의 차이점을 설명할 수 있다
- [ ] CMD와 ENTRYPOINT의 차이점과 조합 방법을 알고 있다
- [ ] Nginx 커스텀 이미지를 Dockerfile로 빌드할 수 있다
- [ ] Node.js 앱을 Dockerfile로 컨테이너화할 수 있다
- [ ] Docker 빌드 캐시의 동작 원리를 이해하고 최적화할 수 있다
- [ ] .dockerignore 파일을 활용할 수 있다
- [ ] Dockerfile Best Practices를 적용할 수 있다
- [ ] docker build 명령의 주요 옵션을 사용할 수 있다

---

## 다음 챕터 예고

### Chapter 10. .dockerignore와 이미지 최적화

다음 장에서는:

- .dockerignore 상세 문법
- 이미지 크기 최적화 전략
- Multi-stage Build 심화
- 보안을 위한 Dockerfile 작성법

를 **실습 중심**으로 다룹니다.
