# Chapter 12. Docker CI (Continuous Integration)

## 목차

- [Clip 1. CI/CD 개념 이해](#1-cicd-개념-이해)
- [Clip 2. Docker CI 동작 흐름](#2-docker-ci-동작-흐름)
- [Clip 3. GitHub Actions 개요](#3-github-actions-개요)
- [Clip 4. Workflow 기본 구조](#4-workflow-기본-구조)
- [Clip 5. Event 트리거와 Matrix 전략](#5-event-트리거와-matrix-전략)
- [Clip 6. [실습] GitHub Actions Demo](#6-실습-github-actions-demo)
- [Clip 7. [실습] Docker CI 환경 준비](#7-실습-docker-ci-환경-준비)
- [Clip 8. [실습] Docker Hub 연동](#8-실습-docker-hub-연동)
- [Clip 9. [실습] Docker CI Workflow 작성](#9-실습-docker-ci-workflow-작성)
- [Clip 10. [실습] CI 동작 확인 및 자동 배포](#10-실습-ci-동작-확인-및-자동-배포)

---

## 1. CI/CD 개념 이해

> CI/CD의 기본 개념과 Docker 기반 CI의 필요성 이해하기

### 1.1 CI/CD 개요

```
┌───────────────────────────────────────────────────────────────────┐
│                        CI/CD 파이프라인                           │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│   ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐        │
│   │  Code   │ →  │  Build  │ →  │  Test   │ →  │ Deploy  │        │
│   │ Commit  │    │         │    │         │    │         │        │
│   └─────────┘    └─────────┘    └─────────┘    └─────────┘        │
│        │                                            │             │
│        └──────────── CI ────────────┘               │             │
│                                                     │             │
│        └────────────────── CD ──────────────────────┘             │
│                                                                   │
│   CI (Continuous Integration)    CD (Continuous Delivery/Deploy)  │
│   - 코드 통합                    - 배포 자동화                    │
│   - 자동 빌드                    - 운영 환경 반영                 │
│   - 자동 테스트                  - 롤백 전략                      │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

### 1.2 CI (Continuous Integration, 지속적 통합)

| 특징 | 설명 |
|------|------|
| **빈번한 통합** | 개발자가 코드 변경사항을 자주(하루 수회) 중앙 저장소에 병합 |
| **자동 빌드** | 코드 변경 시 자동으로 빌드 프로세스 실행 |
| **자동 테스트** | 빌드 후 자동으로 단위/통합 테스트 수행 |
| **빠른 피드백** | 문제 발생 시 즉시 개발자에게 알림 |

### 1.3 CD (Continuous Delivery / Deployment)

| 구분 | Continuous Delivery | Continuous Deployment |
|------|---------------------|----------------------|
| **의미** | 지속적 전달 | 지속적 배포 |
| **범위** | 배포 **준비** 상태까지 자동화 | 운영 환경까지 **완전 자동** 배포 |
| **승인** | 수동 승인 후 배포 | 자동 배포 (승인 불필요) |
| **위험도** | 낮음 | 높음 (철저한 테스트 필요) |

### 1.4 Docker CI의 필요성

전통적인 CI와 Docker CI의 차이:

| 항목 | 전통적 CI | Docker CI |
|------|----------|-----------|
| **빌드 결과물** | JAR, WAR, 바이너리 | Docker Image |
| **환경 일관성** | 환경 차이 발생 가능 | 컨테이너로 일관된 환경 |
| **배포 단위** | 애플리케이션 파일 | 이미지 (앱 + 환경 포함) |
| **의존성 관리** | 별도 관리 필요 | 이미지에 포함 |
| **롤백** | 복잡 | 이전 이미지로 간단히 복구 |

---

## 2. Docker CI 동작 흐름

> Docker 기반 CI 파이프라인의 전체 흐름 이해하기

### 2.1 Docker CI 아키텍처

```
┌────────────────────────────────────────────────────────────────────┐
│                      Docker CI 동작 흐름                           │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│   Developer                                                        │
│       │                                                            │
│       │ 1. git commit & push                                       │
│       ↓                                                            │
│   ┌───────────────┐                                                │
│   │    GitHub     │                                                │
│   │  Repository   │                                                │
│   └───────┬───────┘                                                │
│           │                                                        │
│           │ 2. Webhook (push event)                                │
│           ↓                                                        │
│   ┌───────────────┐                                                │
│   │    GitHub     │                                                │
│   │    Actions    │ ← 3. Workflow 실행                             │
│   │   (CI Tool)   │                                                │
│   └───────┬───────┘                                                │
│           │                                                        │
│           │ 4. docker build (Dockerfile)                           │
│           ↓                                                        │
│   ┌───────────────┐                                                │
│   │ Docker Image  │                                                │
│   │    Build      │                                                │
│   └───────┬───────┘                                                │
│           │                                                        │
│           │ 5. docker push                                         │
│           ↓                                                        │
│   ┌───────────────┐                                                │
│   │  Docker Hub   │                                                │
│   │  (Registry)   │                                                │
│   └───────┬───────┘                                                │
│           │                                                        │
│           │ 6. docker pull & run                                   │
│           ↓                                                        │
│   ┌───────────────┐                                                │
│   │   Container   │                                                │
│   │   (Runtime)   │                                                │
│   └───────────────┘                                                │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### 2.2 Docker CI 단계별 설명

| 단계 | 설명 | 도구 |
|------|------|------|
| 1 | 애플리케이션 코드 변경 (git commit & push) | Git |
| 2 | GitHub 이벤트 발생 (push / pull request) | GitHub |
| 3 | CI 도구(GitHub Actions) 실행 | GitHub Actions |
| 4 | Dockerfile 기반 이미지 빌드 | Docker |
| 5 | Docker Image 생성 완료 | Docker |
| 6 | Docker Registry에 push | Docker Hub |
| 7 | 테스트/운영 환경에서 pull & run | Docker |

### 2.3 Docker CI 구성 요소

```
┌────────────────────────────────────────────────────────────────────┐
│                      Docker CI 구성 요소                           │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│   ┌──────────────────┐    ┌──────────────────┐                     │
│   │ Version Control  │    │     CI Tool      │                     │
│   │     (GitHub)     │    │ (GitHub Actions) │                     │
│   └──────────────────┘    └──────────────────┘                     │
│                                                                    │
│   ┌──────────────────┐    ┌──────────────────┐                     │
│   │  Image Registry  │    │ Container Runtime│                     │
│   │   (Docker Hub)   │    │    (Docker)      │                     │
│   └──────────────────┘    └──────────────────┘                     │
│                                                                    │
│   DevOps 협업 구조:                                                │
│   - Developer → Commit & Push                                      │
│   - CI Tool   → Image Build & Push                                 │
│   - QA/Tester → docker pull & run                                  │
│   - Ops       → Production Deploy                                  │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## 3. GitHub Actions 개요

> GitHub에서 제공하는 CI/CD 자동화 도구 이해하기

### 3.1 GitHub Actions란?

GitHub Actions는 GitHub에서 제공하는 **CI/CD 자동화 플랫폼**으로, 코드 저장소에서 직접 빌드, 테스트, 배포 워크플로우를 자동화할 수 있다.

**주요 특징:**

| 특징 | 설명 |
|------|------|
| **통합** | GitHub 저장소에 내장, 별도 설치 불필요 |
| **이벤트 기반** | push, PR, schedule 등 다양한 트리거 |
| **YAML 설정** | `.github/workflows/*.yml` 파일로 정의 |
| **무료 제공** | Public 저장소 무제한, Private 제한적 무료 |
| **Marketplace** | 다양한 Actions 재사용 가능 |

### 3.2 GitHub Actions 핵심 개념

```
┌────────────────────────────────────────────────────────────────────┐
│                   GitHub Actions 구성 요소                         │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│   Workflow (.github/workflows/*.yml)                               │
│   └── 자동화 전체 과정 정의                                        │
│                                                                    │
│       Event (on:)                                                  │
│       └── 실행 트리거 (push, pull_request, schedule 등)            │
│                                                                    │
│           Job (jobs:)                                              │
│           └── 실행 단위 (병렬 또는 순차 실행 가능)                 │
│                                                                    │
│               Runner (runs-on:)                                    │
│               └── Job 실행 환경 (ubuntu-latest, windows 등)        │
│                                                                    │
│                   Step (steps:)                                    │
│                   └── Job 내부의 개별 작업 단계                    │
│                                                                    │
│                       Action (uses:)                               │
│                       └── 재사용 가능한 작업 단위                  │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### 3.3 주요 개념 상세

| 개념 | 설명 | 예시 |
|------|------|------|
| **Workflow** | 자동화 전체 과정 | CI/CD 파이프라인 |
| **Event** | 워크플로우 실행 트리거 | push, pull_request, schedule |
| **Job** | 동일 Runner에서 실행되는 Step 집합 | build, test, deploy |
| **Runner** | Job을 실행하는 서버 | ubuntu-latest, self-hosted |
| **Step** | Job 내의 개별 작업 | checkout, build, push |
| **Action** | 재사용 가능한 작업 단위 | actions/checkout@v3 |

---

## 4. Workflow 기본 구조

> GitHub Actions Workflow YAML 파일 구조 이해하기

### 4.1 기본 Workflow 구조

```yaml
# 워크플로우 이름
name: My CI Workflow

# 트리거 이벤트
on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main ]

# 작업 정의
jobs:
  # Job 이름
  build:
    # 실행 환경
    runs-on: ubuntu-latest

    # 실행 단계
    steps:
      # Step 1: 코드 체크아웃
      - name: Checkout code
        uses: actions/checkout@v3

      # Step 2: 빌드 실행
      - name: Build
        run: echo "Building..."

      # Step 3: 테스트 실행
      - name: Test
        run: echo "Testing..."
```

### 4.2 Workflow 파일 위치

```
repository/
├── .github/
│   └── workflows/
│       ├── ci.yml           # CI 워크플로우
│       ├── cd.yml           # CD 워크플로우
│       └── test.yml         # 테스트 워크플로우
├── src/
├── Dockerfile
└── README.md
```

### 4.3 주요 키워드 설명

| 키워드 | 설명 |
|--------|------|
| `name` | 워크플로우 이름 (GitHub UI에 표시) |
| `on` | 트리거 이벤트 정의 |
| `jobs` | 실행할 작업 목록 |
| `runs-on` | Runner 환경 지정 |
| `steps` | 실행할 단계 목록 |
| `uses` | 외부 Action 사용 |
| `run` | 쉘 명령어 실행 |
| `env` | 환경 변수 설정 |
| `with` | Action에 전달할 파라미터 |

### 4.4 간단한 예제

```yaml
name: Simple CI

on:
  push:
    branches: [ main ]

jobs:
  hello:
    runs-on: ubuntu-latest
    steps:
      - name: Say Hello
        run: echo "Hello, GitHub Actions!"

      - name: Show Date
        run: date

      - name: List Files
        run: ls -la
```

---

## 5. Event 트리거와 Matrix 전략

> 다양한 트리거 조건과 병렬 테스트 전략 이해하기

### 5.1 Event 트리거 종류

| 이벤트 | 설명 | 사용 예 |
|--------|------|---------|
| `push` | 브랜치에 push 시 | 코드 통합 시 빌드 |
| `pull_request` | PR 생성/업데이트 시 | 코드 리뷰 전 테스트 |
| `schedule` | 정해진 시간에 실행 (cron) | 야간 빌드, 주기적 테스트 |
| `workflow_dispatch` | 수동 실행 | 필요 시 수동 배포 |
| `release` | 릴리스 생성 시 | 버전 배포 |

### 5.2 Push / Pull Request 트리거

```yaml
on:
  push:
    branches:
      - main
      - master
      - 'release/**'    # release/로 시작하는 모든 브랜치
    tags:
      - 'v*'            # v로 시작하는 모든 태그

  pull_request:
    branches:
      - main
    types:
      - opened
      - synchronize
      - reopened
```

### 5.3 Path 조건 (특정 파일 변경 시만 실행)

```yaml
on:
  push:
    branches: [ main ]
    paths:
      - 'src/**'        # src 폴더 내 파일 변경 시
      - '**.js'         # 모든 JS 파일 변경 시
      - 'Dockerfile'    # Dockerfile 변경 시
    paths-ignore:
      - 'docs/**'       # docs 폴더는 무시
      - '**.md'         # 마크다운 파일 무시
```

### 5.4 Schedule (Cron 표현식)

```yaml
on:
  schedule:
    # 매일 자정 (UTC) 실행
    - cron: '0 0 * * *'

    # 매주 월요일 오전 9시 (UTC) 실행
    - cron: '0 9 * * 1'

    # 매시간 30분에 실행
    - cron: '30 * * * *'
```

**Cron 표현식:**

```
┌───────────── 분 (0-59)
│ ┌───────────── 시 (0-23)
│ │ ┌───────────── 일 (1-31)
│ │ │ ┌───────────── 월 (1-12)
│ │ │ │ ┌───────────── 요일 (0-6, 0=일요일)
│ │ │ │ │
* * * * *
```

### 5.5 Matrix 전략 (병렬 테스트)

여러 환경에서 동시에 테스트를 실행할 수 있다.

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [14.x, 16.x, 18.x]
        os: [ubuntu-latest, windows-latest]

    steps:
      - uses: actions/checkout@v3

      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}

      - run: npm install
      - run: npm test
```

**Matrix 실행 결과:**

```
┌───────────────────────────────────────────────────────────────────┐
│                       Matrix 병렬 실행                            │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐              │
│   │ Node 14.x    │ │ Node 16.x    │ │ Node 18.x    │              │
│   │ Ubuntu       │ │ Ubuntu       │ │ Ubuntu       │              │
│   └──────────────┘ └──────────────┘ └──────────────┘              │
│                                                                   │
│   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐              │
│   │ Node 14.x    │ │ Node 16.x    │ │ Node 18.x    │              │
│   │ Windows      │ │ Windows      │ │ Windows      │              │
│   └──────────────┘ └──────────────┘ └──────────────┘              │
│                                                                   │
│   총 6개의 Job이 병렬로 실행됨                                    │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

---

## 6. [실습] GitHub Actions Demo

> 간단한 GitHub Actions 워크플로우 생성 및 실행

### 6.1 Demo 워크플로우 작성

GitHub 저장소에서 `.github/workflows/demo.yml` 파일 생성:

```yaml
name: GitHub Actions Demo

on:
  push:
    branches: [ main, master ]
  workflow_dispatch:  # 수동 실행 가능

jobs:
  demo-job:
    runs-on: ubuntu-latest

    steps:
      - name: Print Event Info
        run: |
          echo "Event name: ${{ github.event_name }}"
          echo "Repository: ${{ github.repository }}"
          echo "Branch: ${{ github.ref }}"
          echo "Commit SHA: ${{ github.sha }}"

      - name: Print Runner Info
        run: |
          echo "Runner OS: ${{ runner.os }}"
          echo "Runner Arch: ${{ runner.arch }}"

      - name: Checkout Code
        uses: actions/checkout@v3

      - name: List Files
        run: |
          echo "=== Repository Files ==="
          ls -la

      - name: Print Environment
        run: |
          echo "=== Environment Variables ==="
          env | sort
```

### 6.2 워크플로우 실행 확인

1. GitHub 저장소 → Actions 탭 이동
2. 워크플로우 실행 상태 확인
3. Job 로그 확인

```
┌────────────────────────────────────────────────────────────────────┐
│                    GitHub Actions 실행 결과                        │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│   Workflow: GitHub Actions Demo                                    │
│   Status: ✓ Success                                                │
│   Duration: 15s                                                    │
│                                                                    │
│   Jobs:                                                            │
│   └── demo-job ✓                                                   │
│       ├── Print Event Info ✓                                       │
│       ├── Print Runner Info ✓                                      │
│       ├── Checkout Code ✓                                          │
│       ├── List Files ✓                                             │
│       └── Print Environment ✓                                      │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### 6.3 Context 변수

GitHub Actions에서 사용 가능한 주요 Context:

| Context | 설명 | 예시 |
|---------|------|------|
| `github.event_name` | 트리거 이벤트 이름 | push, pull_request |
| `github.repository` | 저장소 이름 | owner/repo |
| `github.ref` | 브랜치/태그 참조 | refs/heads/main |
| `github.sha` | 커밋 SHA | abc123... |
| `runner.os` | Runner OS | Linux |
| `secrets.XXX` | 저장된 시크릿 | ${{ secrets.TOKEN }} |

---

## 7. [실습] Docker CI 환경 준비

> Node.js 애플리케이션으로 Docker CI 환경 구성하기

### 7.1 프로젝트 구조 준비

```bash
kevin@hostos1:~$ mkdir -p ~/fastcampus/ch12/nodejs-ci && cd $_
kevin@hostos1:~/fastcampus/ch12/nodejs-ci$ pwd
/home/kevin/fastcampus/ch12/nodejs-ci
```

### 7.2 Node.js 애플리케이션 작성

**package.json:**

```bash
kevin@hostos1:~/fastcampus/ch12/nodejs-ci$ vi package.json
```

```json
{
  "name": "nodejs-ci-demo",
  "version": "1.0.0",
  "description": "FastCampus Docker CI Demo",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "test": "echo \"Running tests...\" && exit 0"
  },
  "dependencies": {
    "express": "^4.18.2"
  }
}
```

**server.js:**

```bash
kevin@hostos1:~/fastcampus/ch12/nodejs-ci$ vi server.js
```

```javascript
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy', version: '1.0.0' });
});

app.get('/api/info', (req, res) => {
    res.json({
        app: 'FastCampus Docker CI Demo',
        version: '1.0.0',
        hostname: require('os').hostname(),
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
```

**public/index.html:**

```bash
kevin@hostos1:~/fastcampus/ch12/nodejs-ci$ mkdir public
kevin@hostos1:~/fastcampus/ch12/nodejs-ci$ vi public/index.html
```

```html
<!DOCTYPE html>
<html>
<head>
    <title>FastCampus Docker CI</title>
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
            padding: 40px;
            background: rgba(255,255,255,0.1);
            border-radius: 10px;
        }
        h1 { font-size: 2.5em; margin-bottom: 10px; }
        p { font-size: 1.2em; }
        .version {
            margin-top: 20px;
            padding: 10px;
            background: rgba(0,0,0,0.2);
            border-radius: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Welcome to FastCampus</h1>
        <p>Node.js App using Docker CI v1.0</p>
        <div class="version">
            Built with GitHub Actions + Docker
        </div>
    </div>
</body>
</html>
```

### 7.3 Dockerfile 작성

```bash
kevin@hostos1:~/fastcampus/ch12/nodejs-ci$ vi Dockerfile
```

```dockerfile
FROM node:18-alpine

LABEL maintainer="fastcampus"
LABEL description="Docker CI Demo Application"

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY . .

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["npm", "start"]
```

### 7.4 .dockerignore 작성

```bash
kevin@hostos1:~/fastcampus/ch12/nodejs-ci$ vi .dockerignore
```

```
node_modules
npm-debug.log
.git
.gitignore
.github
Dockerfile
.dockerignore
README.md
```

### 7.5 로컬 빌드 테스트

```bash
kevin@hostos1:~/fastcampus/ch12/nodejs-ci$ docker build -t nodejs-ci:v1.0 --no-cache .
Sending build context to Docker daemon  5.632kB
Step 1/9 : FROM node:18-alpine
...
Successfully built abc123def456
Successfully tagged nodejs-ci:v1.0

kevin@hostos1:~/fastcampus/ch12/nodejs-ci$ docker run -d -p 3001:3000 --name nodejs-ci-test nodejs-ci:v1.0
def456ghi789...

kevin@hostos1:~/fastcampus/ch12/nodejs-ci$ curl localhost:3001/health
{"status":"healthy","version":"1.0.0"}

kevin@hostos1:~/fastcampus/ch12/nodejs-ci$ curl localhost:3001/api/info
{"app":"FastCampus Docker CI Demo","version":"1.0.0","hostname":"def456ghi789","timestamp":"2023-06-25T10:00:00.000Z"}

# 테스트 후 정리
kevin@hostos1:~/fastcampus/ch12/nodejs-ci$ docker stop nodejs-ci-test && docker rm nodejs-ci-test
```

---

## 8. [실습] Docker Hub 연동

> GitHub 저장소와 Docker Hub 연동 설정

### 8.1 Docker Hub 로그인 확인

```bash
kevin@hostos1:~/fastcampus/ch12/nodejs-ci$ docker login
Login with your Docker ID to push and pull images from Docker Hub.
Username: <your-username>
Password:
Login Succeeded
```

### 8.2 이미지 태그 및 Push

```bash
# 이미지 태그
kevin@hostos1:~/fastcampus/ch12/nodejs-ci$ docker tag nodejs-ci:v1.0 <username>/nodejs-ci:v1.0

# Docker Hub에 Push
kevin@hostos1:~/fastcampus/ch12/nodejs-ci$ docker push <username>/nodejs-ci:v1.0
The push refers to repository [docker.io/<username>/nodejs-ci]
...
v1.0: digest: sha256:abc123... size: 1234
```

### 8.3 Git 저장소 구성

```bash
# Git 초기화
kevin@hostos1:~/fastcampus/ch12/nodejs-ci$ git init
Initialized empty Git repository in /home/kevin/fastcampus/ch12/nodejs-ci/.git/

# .gitignore 작성
kevin@hostos1:~/fastcampus/ch12/nodejs-ci$ vi .gitignore
```

```
node_modules/
npm-debug.log
.env
*.log
```

```bash
# 파일 추가 및 커밋
kevin@hostos1:~/fastcampus/ch12/nodejs-ci$ git add .
kevin@hostos1:~/fastcampus/ch12/nodejs-ci$ git commit -m "Initial commit: FastCampus Docker CI"

# GitHub 원격 저장소 연결
kevin@hostos1:~/fastcampus/ch12/nodejs-ci$ git remote add origin https://github.com/<username>/docker-ci.git

# Push (Personal Access Token 사용)
kevin@hostos1:~/fastcampus/ch12/nodejs-ci$ git branch -M main
kevin@hostos1:~/fastcampus/ch12/nodejs-ci$ git push -u origin main
Username: <username>
Password: <personal-access-token>
```

### 8.4 GitHub Personal Access Token 생성

1. GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token (classic) 선택
3. 권한 설정:
   - `repo` (Full control of private repositories)
   - `workflow` (Update GitHub Action workflows)
4. Token 생성 후 복사 (다시 볼 수 없음)

### 8.5 GitHub Secrets 설정

GitHub 저장소에서 Docker Hub 인증 정보를 안전하게 저장:

1. GitHub 저장소 → Settings → Secrets and variables → Actions
2. New repository secret 클릭
3. 다음 시크릿 추가:

| Name | Value |
|------|-------|
| `DOCKER_HUB_USERNAME` | Docker Hub 사용자명 |
| `DOCKER_HUB_PASSWORD` | Docker Hub 비밀번호 또는 Access Token |

```
┌───────────────────────────────────────────────────────────────────┐
│                    GitHub Secrets 설정                            │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│   Repository: <username>/docker-ci                                │
│                                                                   │
│   Secrets:                                                        │
│   ┌────────────────────────────────────────────────────────────┐  │
│   │ DOCKER_HUB_USERNAME    ••••••••                            │  │
│   │ DOCKER_HUB_PASSWORD    ••••••••                            │  │
│   └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│   사용: ${{ secrets.DOCKER_HUB_USERNAME }}                        │
│         ${{ secrets.DOCKER_HUB_PASSWORD }}                        │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

---

## 9. [실습] Docker CI Workflow 작성

> Docker 이미지 빌드 및 Push를 자동화하는 Workflow 작성

### 9.1 Workflow 디렉토리 생성

```bash
kevin@hostos1:~/fastcampus/ch12/nodejs-ci$ mkdir -p .github/workflows
```

### 9.2 Docker CI Workflow 작성

```bash
kevin@hostos1:~/fastcampus/ch12/nodejs-ci$ vi .github/workflows/docker-ci.yml
```

```yaml
name: Docker CI - Build and Push

on:
  push:
    branches:
      - main
      - master
    tags:
      - 'v*'
  pull_request:
    branches:
      - main

env:
  DOCKER_IMAGE: ${{ secrets.DOCKER_HUB_USERNAME }}/nodejs-ci

jobs:
  build-and-push:
    runs-on: ubuntu-latest

    steps:
      # Step 1: 코드 체크아웃
      - name: Checkout code
        uses: actions/checkout@v3

      # Step 2: Docker 메타데이터 설정
      - name: Docker metadata
        id: meta
        uses: docker/metadata-action@v4
        with:
          images: ${{ env.DOCKER_IMAGE }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha,prefix=sha-

      # Step 3: QEMU 설정 (멀티 아키텍처 빌드용)
      - name: Set up QEMU
        uses: docker/setup-qemu-action@v2

      # Step 4: Docker Buildx 설정
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      # Step 5: Docker Hub 로그인
      - name: Login to Docker Hub
        if: github.event_name != 'pull_request'
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_HUB_USERNAME }}
          password: ${{ secrets.DOCKER_HUB_PASSWORD }}

      # Step 6: Docker 이미지 빌드 및 Push
      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: .
          push: ${{ github.event_name != 'pull_request' }}
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      # Step 7: 이미지 정보 출력
      - name: Image digest
        run: echo ${{ steps.meta.outputs.digest }}
```

### 9.3 Workflow 구성 요소 설명

| Step | Action | 설명 |
|------|--------|------|
| 1 | `actions/checkout@v3` | 저장소 코드 체크아웃 |
| 2 | `docker/metadata-action@v4` | 이미지 태그 자동 생성 |
| 3 | `docker/setup-qemu-action@v2` | 멀티 아키텍처 빌드 지원 |
| 4 | `docker/setup-buildx-action@v2` | Docker Buildx 설정 |
| 5 | `docker/login-action@v2` | Docker Hub 로그인 |
| 6 | `docker/build-push-action@v4` | 이미지 빌드 및 Push |

### 9.4 태그 전략

```
┌─────────────────────────────────────────────────────────────────────┐
│                        이미지 태그 전략                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   Event                      생성되는 태그                          │
│   ─────────────────────────────────────────────────────────────    │
│   push to main              → username/nodejs-ci:main              │
│   push tag v1.2.3           → username/nodejs-ci:1.2.3             │
│                             → username/nodejs-ci:1.2               │
│   pull request #123         → username/nodejs-ci:pr-123 (빌드만)   │
│   모든 push                  → username/nodejs-ci:sha-abc123       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 9.5 Workflow 파일 커밋

```bash
kevin@hostos1:~/fastcampus/ch12/nodejs-ci$ git add .github/
kevin@hostos1:~/fastcampus/ch12/nodejs-ci$ git commit -m "Add Docker CI workflow"
kevin@hostos1:~/fastcampus/ch12/nodejs-ci$ git push
```

---

## 10. [실습] CI 동작 확인 및 자동 배포

> 코드 변경 시 자동 빌드 및 배포 확인

### 10.1 소스 코드 변경

```bash
kevin@hostos1:~/fastcampus/ch12/nodejs-ci$ vi public/index.html
```

```html
<!DOCTYPE html>
<html>
<head>
    <title>FastCampus Docker CI</title>
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
            padding: 40px;
            background: rgba(255,255,255,0.1);
            border-radius: 10px;
        }
        h1 { font-size: 2.5em; margin-bottom: 10px; }
        p { font-size: 1.2em; }
        .version {
            margin-top: 20px;
            padding: 10px;
            background: rgba(0,0,0,0.2);
            border-radius: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Welcome to FastCampus</h1>
        <p>Node.js App using Docker CI v2.0</p>  <!-- 버전 변경 -->
        <div class="version">
            Auto-deployed with GitHub Actions + Docker CI
        </div>
    </div>
</body>
</html>
```

### 10.2 변경사항 커밋 및 Push

```bash
kevin@hostos1:~/fastcampus/ch12/nodejs-ci$ git add .
kevin@hostos1:~/fastcampus/ch12/nodejs-ci$ git commit -m "Update to v2.0 - Docker CI test"
kevin@hostos1:~/fastcampus/ch12/nodejs-ci$ git push
```

### 10.3 GitHub Actions 실행 확인

GitHub 저장소 → Actions 탭에서 워크플로우 실행 상태 확인:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    GitHub Actions 실행 결과                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   Workflow: Docker CI - Build and Push                             │
│   Trigger: push to main                                            │
│   Status: ✓ Success                                                │
│   Duration: 2m 15s                                                 │
│                                                                     │
│   Jobs:                                                            │
│   └── build-and-push ✓                                             │
│       ├── Checkout code ✓ (2s)                                     │
│       ├── Docker metadata ✓ (1s)                                   │
│       ├── Set up QEMU ✓ (5s)                                       │
│       ├── Set up Docker Buildx ✓ (3s)                              │
│       ├── Login to Docker Hub ✓ (2s)                               │
│       ├── Build and push Docker image ✓ (1m 50s)                   │
│       └── Image digest ✓ (1s)                                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 10.4 Docker Hub 확인

Docker Hub에서 새 이미지 확인:

```bash
# 새 이미지 Pull
kevin@hostos1:~$ docker pull <username>/nodejs-ci:main
main: Pulling from <username>/nodejs-ci
...
Digest: sha256:xyz789...
Status: Downloaded newer image for <username>/nodejs-ci:main

# 컨테이너 실행
kevin@hostos1:~$ docker run -d -p 3001:3000 --name nodejs-ci-v2 <username>/nodejs-ci:main

# 확인
kevin@hostos1:~$ curl localhost:3001
<!DOCTYPE html>
<html>
...
<p>Node.js App using Docker CI v2.0</p>
...
```

### 10.5 태그 기반 배포 (버전 릴리스)

```bash
# 버전 태그 생성
kevin@hostos1:~/fastcampus/ch12/nodejs-ci$ git tag v2.0.0
kevin@hostos1:~/fastcampus/ch12/nodejs-ci$ git push origin v2.0.0
```

태그 Push 시 자동으로:
- `<username>/nodejs-ci:2.0.0`
- `<username>/nodejs-ci:2.0`

이미지가 생성되어 Docker Hub에 Push됨

### 10.6 CI 결과 확인 명령어

```bash
# Docker Hub에서 이미지 태그 확인
kevin@hostos1:~$ docker search <username>/nodejs-ci

# 특정 버전 Pull
kevin@hostos1:~$ docker pull <username>/nodejs-ci:2.0.0

# 이미지 정보 확인
kevin@hostos1:~$ docker inspect <username>/nodejs-ci:2.0.0 | grep -A5 Labels
```

---

## 요약

### 핵심 개념

1. **CI/CD 개념**
   - CI: 지속적 통합 (빌드, 테스트 자동화)
   - CD: 지속적 전달/배포 (배포 자동화)
   - Docker CI: 컨테이너 이미지 빌드/배포 자동화

2. **GitHub Actions 구성**
   - Workflow: 자동화 전체 과정
   - Event: 실행 트리거
   - Job: 실행 단위
   - Step: 개별 작업 단계

3. **Docker CI 파이프라인**
   - 코드 Push → Workflow 실행 → 이미지 빌드 → Registry Push

### 주요 명령어 정리

```bash
# Git 관련
git init
git add .
git commit -m "message"
git push origin main
git tag v1.0.0
git push origin v1.0.0

# Docker 관련
docker build -t <image>:<tag> .
docker push <image>:<tag>
docker pull <image>:<tag>
docker run -d -p <host>:<container> <image>

# Docker Hub 로그인
docker login
```

### Workflow YAML 구조

```yaml
name: Docker CI
on:
  push:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: docker/login-action@v2
      - uses: docker/build-push-action@v4
```

---

## 체크리스트 (통과 필수)

- [ ] CI/CD의 개념과 차이점을 설명할 수 있다
- [ ] Docker CI의 동작 흐름을 이해하고 설명할 수 있다
- [ ] GitHub Actions의 핵심 개념 (Workflow, Event, Job, Step)을 이해한다
- [ ] Workflow YAML 파일의 기본 구조를 작성할 수 있다
- [ ] Event 트리거 (push, pull_request, schedule)를 설정할 수 있다
- [ ] GitHub Secrets를 설정하고 Workflow에서 사용할 수 있다
- [ ] Docker 이미지 빌드 및 Push Workflow를 작성할 수 있다
- [ ] 코드 변경 시 자동으로 CI가 실행되는 것을 확인할 수 있다
- [ ] Docker Hub에 이미지가 자동으로 Push되는 것을 확인할 수 있다
- [ ] 태그 기반 버전 배포를 수행할 수 있다

---

## 다음 챕터 예고

### Chapter 13. Docker CD (Continuous Deployment)

다음 장에서는:

- CD 파이프라인 구성
- Kubernetes 연동 배포
- ArgoCD를 활용한 GitOps
- Blue/Green, Canary 배포 전략

를 **실습 중심**으로 다룹니다.
