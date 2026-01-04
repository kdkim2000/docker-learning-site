# Chapter 05. 컨테이너 생명주기와 관리

---

## 1. 이 챕터의 목표

이 챕터를 마치면 다음을 **실제로 할 수 있어야 합니다.**

- 컨테이너의 생명주기(Lifecycle) 상태를 이해한다
- create / start / stop / restart / rm 명령을 자유롭게 사용한다
- docker logs로 컨테이너 로그를 분석한다
- docker exec로 실행 중인 컨테이너에 접속한다
- docker inspect로 컨테이너 상세 정보를 확인한다
- 장애 발생 시 기본적인 분석을 수행한다

> ❗ 이 챕터는
> **Docker 운영의 기본기**를 다룬다.

---

## 2. 컨테이너 생명주기(Lifecycle) 개요

### 2.1 컨테이너 상태 전이도

Docker 컨테이너는 다음과 같은 상태를 가진다:

```text
                docker create
                     │
                     ▼
┌────────────────────────────────────────┐
│              Created                   │
│         (생성됨, 실행 대기)            │
└────────────────┬───────────────────────┘
                 │ docker start
                 ▼
┌────────────────────────────────────────┐
│              Running                   │◄──────┐
│           (실행 중)                    │       │
└────────┬───────────────┬───────────────┘       │
         │               │                       │
docker stop│        docker pause                 │ docker restart
         │               │                       │ docker start
         ▼               ▼                       │
┌─────────────┐  ┌─────────────┐                 │
│   Exited    │  │   Paused    │                 │
│  (종료됨)   │  │  (일시정지) │                 │
└──────┬──────┘  └──────┬──────┘                 │
       │                │ docker unpause         │
       │                └────────────────────────┘
       │
       │ docker rm
       ▼
┌─────────────┐
│   Deleted   │
│   (삭제됨)  │
└─────────────┘
```

---

### 2.2 컨테이너 상태 종류

| 상태 | 설명 |
|---|---|
| Created | 컨테이너가 생성되었지만 시작되지 않음 |
| Running | 컨테이너가 실행 중 |
| Paused | 컨테이너가 일시 정지됨 |
| Restarting | 컨테이너가 재시작 중 |
| Exited | 컨테이너가 종료됨 |
| Dead | 컨테이너가 비정상 종료됨 |

---

## 3. 컨테이너 생성과 실행

### 3.1 docker run vs docker create + start

**docker run = docker create + docker start**

```text
┌─────────────────────────────────────────────────────┐
│                    docker run                       │
│  ┌─────────────────┐     ┌─────────────────┐        │
│  │  docker create  │ ──► │  docker start   │        │
│  │ (컨테이너 생성) │     │ (컨테이너 시작) │        │
│  └─────────────────┘     └─────────────────┘        │
└─────────────────────────────────────────────────────┘
```

---

### 3.2 docker create - 컨테이너 생성만

```bash
docker create [옵션] 이미지명[:태그] [명령]
```

예시:

```bash
docker create --name mycontainer nginx:alpine
```

특징:
- 컨테이너를 생성만 하고 시작하지 않음
- 상태: Created
- 나중에 docker start로 시작

---

### 3.3 docker start - 컨테이너 시작

```bash
docker start [옵션] 컨테이너명|컨테이너ID
```

예시:

```bash
docker start mycontainer
```

옵션:
- `-a`, `--attach`: 표준 출력/에러에 연결
- `-i`, `--interactive`: 표준 입력 활성화

---

### 3.4 docker run - 생성과 동시에 실행

```bash
docker run [옵션] 이미지명[:태그] [명령]
```

**자주 사용하는 옵션:**

| 옵션 | 설명 |
|---|---|
| `-d`, `--detach` | 백그라운드 실행 |
| `-it` | 대화형 터미널 모드 |
| `--name` | 컨테이너 이름 지정 |
| `-p`, `--publish` | 포트 매핑 |
| `-v`, `--volume` | 볼륨 마운트 |
| `-e`, `--env` | 환경 변수 설정 |
| `--rm` | 종료 시 자동 삭제 |
| `--restart` | 재시작 정책 |

---

## 4. 실습 1 - 컨테이너 생성과 실행 분리

### 4.1 create로 컨테이너 생성

```bash
docker create --name web1 nginx:alpine
```

상태 확인:

```bash
docker ps -a
```

출력:

```text
CONTAINER ID   IMAGE          COMMAND                  CREATED         STATUS    NAMES
abc123...      nginx:alpine   "/docker-entrypoint.…"   5 seconds ago   Created   web1
```

👉 STATUS가 **Created** 상태

---

### 4.2 start로 컨테이너 시작

```bash
docker start web1
```

상태 확인:

```bash
docker ps
```

출력:

```text
CONTAINER ID   IMAGE          STATUS         NAMES
abc123...      nginx:alpine   Up 3 seconds   web1
```

👉 STATUS가 **Up** (Running) 상태

---

### 4.3 정리

```bash
docker stop web1
docker rm web1
```

---

## 5. 컨테이너 중지와 재시작

### 5.1 docker stop - 컨테이너 정상 종료

```bash
docker stop [옵션] 컨테이너명|컨테이너ID
```

예시:

```bash
docker stop web1
```

특징:
- SIGTERM 신호 전송 (graceful shutdown)
- 기본 10초 대기 후 SIGKILL
- `-t` 옵션으로 대기 시간 조절 가능

```bash
# 5초 대기 후 강제 종료
docker stop -t 5 web1
```

---

### 5.2 docker kill - 컨테이너 강제 종료

```bash
docker kill [옵션] 컨테이너명|컨테이너ID
```

예시:

```bash
docker kill web1
```

특징:
- SIGKILL 신호 전송 (즉시 종료)
- 데이터 손실 가능성 있음
- 비정상 상황에서만 사용 권장

---

### 5.3 docker restart - 컨테이너 재시작

```bash
docker restart [옵션] 컨테이너명|컨테이너ID
```

예시:

```bash
docker restart web1
```

특징:
- stop + start를 순차적으로 수행
- `-t` 옵션으로 stop 대기 시간 조절

---

### 5.4 docker pause / unpause - 일시 정지

```bash
# 일시 정지
docker pause web1

# 재개
docker unpause web1
```

특징:
- 컨테이너 프로세스를 일시 중단 (SIGSTOP)
- 메모리 상태 유지
- 디버깅이나 리소스 일시 확보에 유용

---

## 6. 실습 2 - 컨테이너 상태 전이 체험

### 6.1 컨테이너 생성 및 실행

```bash
docker run -d --name lifecycle-test nginx:alpine
```

### 6.2 상태 확인

```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
```

출력:

```text
NAMES            STATUS
lifecycle-test   Up 5 seconds
```

---

### 6.3 일시 정지

```bash
docker pause lifecycle-test
docker ps --format "table {{.Names}}\t{{.Status}}"
```

출력:

```text
NAMES            STATUS
lifecycle-test   Up 30 seconds (Paused)
```

---

### 6.4 재개

```bash
docker unpause lifecycle-test
docker ps --format "table {{.Names}}\t{{.Status}}"
```

---

### 6.5 중지

```bash
docker stop lifecycle-test
docker ps -a --format "table {{.Names}}\t{{.Status}}"
```

출력:

```text
NAMES            STATUS
lifecycle-test   Exited (0) 5 seconds ago
```

---

### 6.6 재시작

```bash
docker start lifecycle-test
docker ps --format "table {{.Names}}\t{{.Status}}"
```

---

### 6.7 정리

```bash
docker rm -f lifecycle-test
```

---

## 7. 컨테이너 삭제

### 7.1 docker rm - 컨테이너 삭제

```bash
docker rm [옵션] 컨테이너명|컨테이너ID
```

**옵션:**

| 옵션 | 설명 |
|---|---|
| `-f`, `--force` | 실행 중인 컨테이너도 강제 삭제 |
| `-v`, `--volumes` | 연결된 익명 볼륨도 함께 삭제 |

---

### 7.2 실행 중인 컨테이너 삭제 시도

```bash
docker run -d --name running-web nginx:alpine
docker rm running-web
```

출력:

```text
Error response from daemon: cannot remove container "/running-web": container is running
```

👉 실행 중인 컨테이너는 삭제 불가

---

### 7.3 강제 삭제

```bash
docker rm -f running-web
```

또는:

```bash
docker stop running-web && docker rm running-web
```

---

### 7.4 여러 컨테이너 한번에 삭제

```bash
# 특정 컨테이너들 삭제
docker rm container1 container2 container3

# 종료된 모든 컨테이너 삭제
docker rm $(docker ps -aq -f status=exited)

# 모든 컨테이너 강제 삭제 (주의!)
docker rm -f $(docker ps -aq)
```

---

### 7.5 컨테이너 자동 삭제 옵션

```bash
docker run --rm -it ubuntu:22.04 bash
```

특징:
- 컨테이너 종료 시 자동으로 삭제
- 일회성 작업에 유용
- 테스트나 빌드 환경에서 자주 사용

---

## 8. 컨테이너 목록 조회

### 8.1 docker ps - 컨테이너 목록

```bash
# 실행 중인 컨테이너만
docker ps

# 모든 컨테이너 (종료된 것 포함)
docker ps -a

# 최근 생성된 n개
docker ps -n 5

# 컨테이너 ID만 출력
docker ps -q
docker ps -aq
```

---

### 8.2 필터링 옵션

```bash
# 특정 이름으로 필터
docker ps -f name=web

# 특정 상태로 필터
docker ps -f status=running
docker ps -f status=exited
docker ps -f status=paused

# 특정 이미지 기반 컨테이너
docker ps -f ancestor=nginx

# 레이블로 필터
docker ps -f label=env=prod
```

---

### 8.3 출력 형식 지정

```bash
# 테이블 형식
docker ps --format "table {{.ID}}\t{{.Names}}\t{{.Status}}\t{{.Ports}}"

# JSON 형식
docker ps --format "{{json .}}"

# 커스텀 형식
docker ps --format "{{.Names}}: {{.Status}}"
```

**사용 가능한 플레이스홀더:**

| 플레이스홀더 | 설명 |
|---|---|
| `.ID` | 컨테이너 ID |
| `.Image` | 이미지명 |
| `.Command` | 실행 명령 |
| `.CreatedAt` | 생성 시간 |
| `.Status` | 상태 |
| `.Ports` | 포트 매핑 |
| `.Names` | 컨테이너명 |
| `.Size` | 디스크 사용량 |

---

## 9. 실습 3 - 컨테이너 로그 분석

### 9.1 docker logs - 로그 조회

```bash
docker logs [옵션] 컨테이너명|컨테이너ID
```

**주요 옵션:**

| 옵션 | 설명 |
|---|---|
| `-f`, `--follow` | 실시간 로그 스트리밍 |
| `--tail n` | 마지막 n줄만 출력 |
| `-t`, `--timestamps` | 타임스탬프 표시 |
| `--since` | 특정 시간 이후 로그 |
| `--until` | 특정 시간까지 로그 |

---

### 9.2 로그 조회 실습

```bash
# 테스트용 컨테이너 실행
docker run -d --name log-test nginx:alpine

# 기본 로그 조회
docker logs log-test

# 마지막 10줄
docker logs --tail 10 log-test

# 실시간 스트리밍
docker logs -f log-test

# 타임스탬프 포함
docker logs -t log-test

# 최근 5분 로그
docker logs --since 5m log-test

# 특정 시간 범위
docker logs --since 2024-01-01T00:00:00 --until 2024-01-01T23:59:59 log-test
```

---

### 9.3 로그 발생시키기

새 터미널에서:

```bash
# HTTP 요청 발생
curl http://localhost:80
```

원래 터미널에서 실시간 로그 확인 (docker logs -f 실행 중이라면)

---

### 9.4 정리

```bash
docker rm -f log-test
```

---

## 10. 실습 4 - 실행 중인 컨테이너 접속

### 10.1 docker exec - 컨테이너 내부 명령 실행

```bash
docker exec [옵션] 컨테이너명 명령어 [인자...]
```

**주요 옵션:**

| 옵션 | 설명 |
|---|---|
| `-i`, `--interactive` | 표준 입력 활성화 |
| `-t`, `--tty` | 가상 터미널 할당 |
| `-d`, `--detach` | 백그라운드 실행 |
| `-e`, `--env` | 환경 변수 설정 |
| `-w`, `--workdir` | 작업 디렉토리 지정 |
| `-u`, `--user` | 실행 사용자 지정 |

---

### 10.2 컨테이너 내부 접속 실습

```bash
# 테스트용 컨테이너 실행
docker run -d --name exec-test nginx:alpine

# 단일 명령 실행
docker exec exec-test ls -la /usr/share/nginx/html

# 대화형 셸 접속
docker exec -it exec-test /bin/sh
```

---

### 10.3 셸 접속 후 내부 탐색

```bash
# 컨테이너 내부에서
pwd
ls -la
cat /etc/nginx/nginx.conf
ps aux
exit
```

---

### 10.4 실용적인 exec 사용 예시

```bash
# 프로세스 확인
docker exec exec-test ps aux

# 환경 변수 확인
docker exec exec-test env

# 설정 파일 확인
docker exec exec-test cat /etc/nginx/nginx.conf

# 네트워크 상태 확인
docker exec exec-test netstat -tlnp

# 디스크 사용량 확인
docker exec exec-test df -h

# 특정 사용자로 명령 실행
docker exec -u root exec-test whoami
```

---

### 10.5 정리

```bash
docker rm -f exec-test
```

---

## 11. 실습 5 - 컨테이너 상세 정보 확인

### 11.1 docker inspect - 상세 정보 조회

```bash
docker inspect [옵션] 컨테이너명|컨테이너ID
```

출력: JSON 형식의 상세 정보

---

### 11.2 전체 정보 조회

```bash
docker run -d --name inspect-test -p 8080:80 nginx:alpine
docker inspect inspect-test
```

---

### 11.3 --format으로 특정 정보 추출

```bash
# 컨테이너 IP 주소
docker inspect --format '{{.NetworkSettings.IPAddress}}' inspect-test

# 컨테이너 상태
docker inspect --format '{{.State.Status}}' inspect-test

# 포트 매핑 정보
docker inspect --format '{{.NetworkSettings.Ports}}' inspect-test

# 마운트 정보
docker inspect --format '{{.Mounts}}' inspect-test

# 환경 변수
docker inspect --format '{{.Config.Env}}' inspect-test

# 시작 시간
docker inspect --format '{{.State.StartedAt}}' inspect-test

# 이미지 ID
docker inspect --format '{{.Image}}' inspect-test

# 호스트명
docker inspect --format '{{.Config.Hostname}}' inspect-test
```

---

### 11.4 여러 정보 한번에 추출

```bash
docker inspect --format 'Name: {{.Name}}, IP: {{.NetworkSettings.IPAddress}}, Status: {{.State.Status}}' inspect-test
```

---

### 11.5 JSON 파싱과 조합

```bash
# jq와 조합 (jq 설치 필요)
docker inspect inspect-test | jq '.[0].NetworkSettings.IPAddress'

# 모든 컨테이너 IP 출력
docker inspect --format '{{.Name}} - {{.NetworkSettings.IPAddress}}' $(docker ps -q)
```

---

### 11.6 정리

```bash
docker rm -f inspect-test
```

---

## 12. 실습 6 - 컨테이너 리소스 모니터링

### 12.1 docker stats - 실시간 리소스 사용량

```bash
docker stats [옵션] [컨테이너명...]
```

---

### 12.2 리소스 모니터링 실습

```bash
# 테스트 컨테이너 실행
docker run -d --name stats-test1 nginx:alpine
docker run -d --name stats-test2 nginx:alpine

# 실시간 모니터링
docker stats

# 특정 컨테이너만
docker stats stats-test1

# 한 번만 출력 (스냅샷)
docker stats --no-stream

# 형식 지정
docker stats --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

출력 예시:

```text
CONTAINER ID   NAME          CPU %   MEM USAGE / LIMIT     MEM %   NET I/O       BLOCK I/O   PIDS
abc123...      stats-test1   0.00%   3.441MiB / 7.773GiB   0.04%   1.05kB / 0B   0B / 0B     3
def456...      stats-test2   0.00%   3.512MiB / 7.773GiB   0.04%   1.05kB / 0B   0B / 0B     3
```

---

### 12.3 docker top - 컨테이너 내 프로세스 확인

```bash
docker top stats-test1
```

출력:

```text
UID     PID     PPID    C   STIME   TTY   TIME      CMD
root    12345   12300   0   10:00   ?     00:00:00  nginx: master process
nginx   12346   12345   0   10:00   ?     00:00:00  nginx: worker process
```

---

### 12.4 정리

```bash
docker rm -f stats-test1 stats-test2
```

---

## 13. 컨테이너 재시작 정책

### 13.1 재시작 정책 종류

| 정책 | 설명 |
|---|---|
| `no` | 재시작 안 함 (기본값) |
| `on-failure[:max]` | 비정상 종료 시 재시작 (최대 횟수 지정 가능) |
| `always` | 항상 재시작 (수동 중지 제외) |
| `unless-stopped` | 수동 중지 전까지 항상 재시작 |

---

### 13.2 재시작 정책 설정

```bash
# 컨테이너 생성 시 설정
docker run -d --restart=always --name restart-test nginx:alpine

# 실행 중인 컨테이너에 설정 변경
docker update --restart=on-failure:3 restart-test
```

---

### 13.3 재시작 정책 비교

**always vs unless-stopped:**

- `always`: Docker 데몬 재시작 시에도 자동 시작
- `unless-stopped`: 수동으로 stop한 경우 Docker 재시작 후에도 시작 안 함

---

### 13.4 실습 - 재시작 정책 테스트

```bash
# always 정책으로 컨테이너 생성
docker run -d --restart=always --name restart-always nginx:alpine

# 컨테이너 강제 종료 (kill)
docker kill restart-always

# 상태 확인 - 자동 재시작됨
docker ps
```

---

## 14. 장애 분석 기본기

### 14.1 컨테이너가 시작되지 않을 때

**1단계: 상태 확인**

```bash
docker ps -a
```

**2단계: 로그 확인**

```bash
docker logs 컨테이너명
```

**3단계: 상세 정보 확인**

```bash
docker inspect 컨테이너명
```

---

### 14.2 컨테이너가 계속 재시작될 때

```bash
# 재시작 횟수 확인
docker inspect --format '{{.RestartCount}}' 컨테이너명

# 마지막 종료 이유 확인
docker inspect --format '{{.State.ExitCode}}' 컨테이너명
docker inspect --format '{{.State.Error}}' 컨테이너명
```

---

### 14.3 일반적인 Exit Code 의미

| Exit Code | 의미 |
|---|---|
| 0 | 정상 종료 |
| 1 | 일반적인 에러 |
| 125 | Docker 데몬 에러 |
| 126 | 명령 실행 불가 |
| 127 | 명령을 찾을 수 없음 |
| 137 | SIGKILL로 종료 (OOM 등) |
| 139 | 세그먼테이션 폴트 |
| 143 | SIGTERM으로 종료 |

---

### 14.4 OOM (Out of Memory) 확인

```bash
docker inspect --format '{{.State.OOMKilled}}' 컨테이너명
```

출력이 `true`면 메모리 부족으로 종료됨

---

### 14.5 디버깅을 위한 컨테이너 실행

```bash
# 실패하는 컨테이너를 대화형으로 실행
docker run -it --entrypoint /bin/sh 이미지명

# 또는 명령을 sleep으로 오버라이드
docker run -d --entrypoint sleep 이미지명 infinity
docker exec -it 컨테이너명 /bin/sh
```

---

### 14.6 컨테이너 파일 시스템 확인

```bash
# 컨테이너에서 파일 복사
docker cp 컨테이너명:/path/to/file ./local_file

# 로컬에서 컨테이너로 복사
docker cp ./local_file 컨테이너명:/path/to/file

# 변경된 파일 확인
docker diff 컨테이너명
```

**docker diff 출력 의미:**
- A: 추가됨 (Added)
- C: 변경됨 (Changed)
- D: 삭제됨 (Deleted)

---

## 15. 실습 7 - 종합 장애 분석 시나리오

### 15.1 시나리오: 웹 서버가 응답하지 않음

```bash
# 테스트 환경 구성
docker run -d --name troubled-web -p 8888:80 nginx:alpine
```

### 15.2 문제 분석 순서

**1. 컨테이너 상태 확인**

```bash
docker ps -f name=troubled-web
```

**2. 로그 확인**

```bash
docker logs --tail 50 troubled-web
```

**3. 프로세스 확인**

```bash
docker top troubled-web
```

**4. 리소스 사용량 확인**

```bash
docker stats --no-stream troubled-web
```

**5. 네트워크 확인**

```bash
docker inspect --format '{{.NetworkSettings.Ports}}' troubled-web
```

**6. 내부 접속하여 상세 확인**

```bash
docker exec -it troubled-web /bin/sh
# 내부에서
curl localhost:80
cat /var/log/nginx/error.log
exit
```

---

### 15.3 정리

```bash
docker rm -f troubled-web
```

---

## 16. 유용한 컨테이너 관리 명령어 모음

### 16.1 일괄 작업 명령어

```bash
# 모든 컨테이너 중지
docker stop $(docker ps -q)

# 종료된 컨테이너 모두 삭제
docker rm $(docker ps -aq -f status=exited)

# 모든 컨테이너 삭제 (강제)
docker rm -f $(docker ps -aq)

# 사용하지 않는 리소스 정리
docker system prune

# 컨테이너, 이미지, 볼륨, 네트워크 모두 정리
docker system prune -a --volumes
```

---

### 16.2 별칭(alias) 설정 추천

```bash
# ~/.bashrc 또는 ~/.zshrc에 추가
alias dps='docker ps'
alias dpsa='docker ps -a'
alias dimg='docker images'
alias dlog='docker logs -f'
alias dexec='docker exec -it'
alias dstop='docker stop $(docker ps -q)'
alias dclean='docker rm $(docker ps -aq -f status=exited)'
```

---

## 17. 반드시 이해해야 할 핵심 요약

* 컨테이너 상태: Created → Running → Paused/Exited → Deleted
* docker run = docker create + docker start
* docker stop: 정상 종료 (SIGTERM → SIGKILL)
* docker kill: 강제 종료 (SIGKILL)
* docker logs: 로그 분석의 시작점
* docker exec -it: 컨테이너 내부 접속
* docker inspect: 모든 정보 조회
* docker stats: 실시간 리소스 모니터링
* 재시작 정책으로 고가용성 확보
* Exit Code로 종료 원인 파악

---

## 18. 체크리스트 (통과 필수)

* [ ] 컨테이너 생명주기 상태를 설명할 수 있다
* [ ] create / start / stop / rm 구분하여 사용 가능
* [ ] docker logs로 로그 분석 가능
* [ ] docker exec로 컨테이너 내부 접속 가능
* [ ] docker inspect로 필요한 정보 추출 가능
* [ ] docker stats로 리소스 모니터링 가능
* [ ] 재시작 정책 설정 및 차이점 이해
* [ ] Exit Code 의미 파악 가능
* [ ] 기본적인 장애 분석 절차 수행 가능

---

## 19. 다음 챕터 예고

### Chapter 06. Docker 네트워크

다음 장에서는:

* Docker 네트워크 종류 (bridge, host, none)
* 컨테이너 간 통신
* 포트 포워딩 심화
* 사용자 정의 네트워크

를 **실습 중심**으로 다룹니다.
