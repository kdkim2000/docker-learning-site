# Chapter 03. Docker 엔진 관리와 업데이트

---

## 1. 이 챕터의 목표

이 챕터를 완료하면 다음을 **실제로 수행할 수 있어야 합니다.**

- Docker Engine의 역할을 운영 관점에서 이해한다
- Docker 버전을 확인하고 관리할 수 있다
- Docker 엔진 업데이트 시 **위험 요소를 사전에 차단**할 수 있다
- Docker 서비스 장애 발생 시 **원인을 파악하고 복구**할 수 있다

> ❗ 이 장은 “개발자용”이 아니라  
> **운영자 / 인프라 담당자 시점**에서 매우 중요하다.

---

## 2. Docker 엔진이란 무엇인가? (운영 관점)

### 2.1 Docker 엔진의 정의

Docker Engine =  
**컨테이너를 생성·실행·중지·삭제하는 핵심 런타임**

구성:
- Docker Daemon (`dockerd`)
- REST API
- containerd / runc

---

### 2.2 Docker 엔진이 멈추면 벌어지는 일

Docker 엔진이 중단되면:

- ❌ 새 컨테이너 생성 불가
- ❌ 기존 컨테이너 제어 불가
- ⭕ 이미 실행 중인 컨테이너는 유지됨

👉 **제어 plane 중단, 데이터 plane 유지**

---

## 3. Docker 엔진 버전 관리의 중요성

### 3.1 왜 버전 관리가 필요한가?

- 보안 취약점 패치
- Kernel / OS 호환성
- Kubernetes / Compose 호환성
- Dockerfile 문법 변화

---

### 3.2 최신 Docker 엔진을 사용해야 하는 7가지 이유

Docker 버전이 20.x에서 23.x를 거쳐 24.x까지 빠르게 업데이트되고 있다.
모든 software의 new version은 새로운 기능과 버그수정 및 보안 패치 등을 포함한다.

#### 1) 기존 기능의 개선 및 new feature

Docker는 플랫폼의 기능과 유용성을 개선하는 새로운 기능 및 개선 사항이 포함된 업데이트를 정기적으로 릴리스한다. 새로운 Docker 기능을 도입하여 **모든 작업의 workflow를 단순화**할 수 있다.

#### 2) 버그 수정

Docker에도 다른 소프트웨어처럼 버그 또는 예기치 못한 버그가 발생할 수 있다. 발견된 버그를 해결하여 안정성 및 성능을 개선하는 수정사항을 제공하기 때문에 Docker를 최신 상태로 유지하면 보다 **원활한 Docker 작업을 보장**받을 수 있다.

#### 3) 보안 패치

널리 사용되고 있는 컨테이너화 플랫폼인 Docker는 보안 취약성에 대해 지속적으로 inspect된다. 최신 버전의 Docker을 사용하면 **최신 보안 패치를 사용하여 잠재적 악용 위험을 최소화**하고 컨테이너화 된 애플리케이션의 전반적인 보안 태세를 개선할 수 있다.

#### 4) 성능 개선

Docker 업데이트에 종종 성능 최적화가 포함되어 있기 때문에 작업을 더 빠르고 효율적으로 만든다. 이러한 개선 사항은 컨테이너 시간 단축, 네트워킹 및 I/O 성능 향상, 전반적인 리소스 활용도 향상으로 이어질 수 있다. 따라서 최신성을 갖는 Docker는 **컨테이너화 된 애플리케이션을 최적화**할 수 있다.

#### 5) 최신 기술과의 호환성

기술 환경은 지속적으로 발전하고 있으며 새로운 도구와 프레임워크가 새롭게 생겨나고 있다. 최신 버전의 Docker를 사용하여 최신기술과의 호환성이 보장되어 **컨테이너 환경에서 새로운 최신 tool들을 활용**할 수 있다.

#### 6) 커뮤니티 및 생태계 지원

Docker가 발전은 주변 생태계의 발전에 영향을 준다. 인기있는 도구 및 라이브러리들은 Docker 기능 및 버전을 지원하도록 업데이트되고, 최신버전의 Docker를 사용하여 **Docker 기반 플러그인 및 통합을 활용**해 컨테이너화 된 application을 build 및 관리하기 위한 옵션을 사용 가능하다.

#### 7) 유지 관리 및 오랜 기간 동안의 지원 (Long Term Support)

Docker는 일부 release를 장기지원 (LTS) 버전으로 지정하는 관리체계를 따른다. LTS 버전은 버그 수정 및 보안 패치를 포함하여 확장된 유지 관리 및 지원을 받아 중요한 프로덕션 환경에 적합하기 때문에 최신 Docker를 사용하면 **장기적인 요구 사항에 대해 안정적이고 잘 지원되는 Docker 환경을 보장**받을 수 있다.

> **참고 문서**
> - https://docs.docker.com/engine/release-notes/23.0/
> - https://docs.docker.com/engine/release-notes/24.0/

---

### 3.3 무작정 업데이트하면 안 되는 이유

- 기존 이미지 실행 실패
- 네트워크 드라이버 충돌
- 볼륨 마운트 오류
- 서비스 중단 사고

👉 **운영 서버에서 Docker 업데이트 = 배포 작업**

---

## 4. 실습 1 – Docker 엔진 상태 점검

### 4.1 Docker 버전 확인

```bash
docker version
````

확인 포인트:

* Client 버전
* Server(Daemon) 버전

---

### 4.2 Docker 데몬 상태 확인

```bash
systemctl status docker
```

또는:

```bash
ps -ef | grep dockerd
```

---

### 4.3 Docker 환경 정보 확인

```bash
docker info
```

운영 시 특히 중요한 항목:

* Storage Driver
* Cgroup Driver
* Kernel Version

---

## 5. 실습 2 – 운영 서버 사전 점검 시나리오

> **상황**
> 운영 서버에서 Docker 엔진 업데이트 요청이 들어왔다.

### 5.1 실행 중인 컨테이너 확인

```bash
docker ps
```

---

### 5.2 전체 컨테이너 목록 확인

```bash
docker ps -a
```

---

### 5.3 사용 중인 이미지 목록 확인

```bash
docker images
```

👉 **이 목록이 백업 대상**

---

## 6. 실습 3 – Docker 엔진 중지와 영향 확인

> ⚠️ 실습 서버에서만 수행

### 6.1 Docker 서비스 중지

```bash
sudo systemctl stop docker
```

---

### 6.2 Docker 명령 실행 시도

```bash
docker ps
```

출력:

```text
Cannot connect to the Docker daemon
```

---

### 6.3 기존 컨테이너 상태 확인

```bash
ps -ef | grep nginx
```

👉 컨테이너 프로세스는 **여전히 실행 중**

---

### 6.4 Docker 서비스 재시작

```bash
sudo systemctl start docker
```

---

## 7. Docker 엔진 업데이트 절차 (Ubuntu 기준)

### 7.1 실습 시나리오

> **[시나리오]**
> 현재 F사는 Ubuntu 18.04 운영체제에 Docker 19.x 버전을 사용 중이다.
> 새로운 기능의 호환성을 맞추고 성능 향상을 위해 최신 버전 업데이트를 결정했다.

**작업 절차:**
1. 기존에 실행 중인 컨테이너들을 stop 한다.
2. 현재 사용 중인 19.x 버전의 Docker 엔진을 삭제한다.
3. 최신 버전의 Docker 엔진을 설치한다.
4. 기존 버전에서 운영 중이 였던 컨테이너 기동(start)!
5. If, error 발생 시 원인 파악, 문제 해결 → 중지되었던 컨테이너 start
6. 필요에 따라 Ubuntu Linux도 18.04 → 22.04 로 upgrade 수행 (실습에서는 제외)

---

### 7.2 현재 시스템 및 Docker 버전 확인

```bash
# 시스템 정보 확인
uname -ar
# 출력 예: Linux hostos3 4.15.0-66-generic #75-Ubuntu SMP ...

# OS 버전 확인
cat /etc/os-release
# NAME="Ubuntu"
# VERSION="18.04.3 LTS (Bionic Beaver)"

# Docker 버전 확인
docker version
# Client: Docker Engine - Community
#  Version:           19.03.4
#  API version:       1.40
# ...
# Server: Docker Engine - Community
#  Engine:
#   Version:          19.03.4
```

---

### 7.3 업데이트 전 체크리스트

* [ ] 실행 중인 컨테이너 목록 확보
* [ ] 서비스 중단 시간 협의
* [ ] 이미지 백업 가능 여부
* [ ] OS / Kernel 버전 확인

---

### 7.4 샘플 컨테이너 실행 (테스트용)

```bash
# 샘플 컨테이너 실행
docker run -d -p 9001:80 --name=nginx-web nginx:1.19
docker run -d -p 9002:80 --name=httpd-web httpd:2.4

# 컨테이너 상태 확인
docker ps
# CONTAINER ID   IMAGE        COMMAND                  CREATED          STATUS          PORTS                  NAMES
# 890debd538ef   httpd:2.4    "httpd-foreground"       17 seconds ago   Up 16 seconds   0.0.0.0:9002->80/tcp   httpd-web
# 94fd834f8b8e   nginx:1.19   "/docker-entrypoint…"    32 seconds ago   Up 31 seconds   0.0.0.0:9001->80/tcp   nginx-web
```

---

### 7.5 현재 Docker 버전 삭제

> ⚠️ Docker 엔진 update 전에 해당 컨테이너를 stop 하거나, Docker 삭제 시 자동 강제 stop 됨.

```bash
# 패키지 정보 갱신
sudo apt update

# 현재 사용중인 docker-ce 19 버전 삭제
sudo apt -y remove docker-ce
```

---

### 7.6 최신 버전 Docker 설치를 위한 준비

```bash
# 필수 패키지 설치
sudo apt -y install apt-transport-https ca-certificates curl gnupg-agent software-properties-common
```

---

### 7.7 GPG key download 및 repository 등록

```bash
# gpg key download (방법 1)
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# gpg key download (방법 2)
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
# OK

# Docker repository 등록
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 패키지 정보 갱신
sudo apt update
```

---

### 7.8 최신 버전 Docker 설치 및 확인

```bash
# 최신 버전 Docker 설치
sudo apt -y install docker-ce docker-ce-cli containerd.io

# 버전 확인
docker --version
# Docker version 24.0.2, build cb74dfc

docker version
# Client: Docker Engine - Community
#  Version:           24.0.2
#  API version:       1.43
# ...
# Server: Docker Engine - Community
#  Engine:
#   Version:          24.0.2
#   API version:      1.43 (minimum version 1.12)
#   Go version:       go1.20.4
#   Git commit:       659604f
#   Built:            Thu May 25 21:52:13 2023

# 컨테이너 상태 확인 (Exited 상태)
docker ps -a
# CONTAINER ID   IMAGE        COMMAND              CREATED           STATUS                      NAMES
# 890debd538ef   httpd:2.4    "httpd-foreground"   17 minutes ago    Exited (0) 12 minutes ago   httpd-web
# 94fd834f8b8e   nginx:1.19   "/docker-entrypoint…" 17 minutes ago   Exited (0) 12 minutes ago   nginx-web
```

---

## 8. 실습 4 – 업데이트 후 컨테이너 복구 점검

### 8.1 이전 버전에서 실행 중이던 컨테이너 재시작

```bash
# 이전 버전에서 실행 중이던 컨테이너를 실행 시킨다.
docker start nginx-web
# Nginx-web

docker start httpd-web
# Httpd-web

# 컨테이너 상태 확인
docker ps -a
# CONTAINER ID   IMAGE        COMMAND                CREATED           STATUS         PORTS                   NAMES
# 890debd538ef   httpd:2.4    "httpd-foreground"     21 minutes ago    Up 2 seconds   0.0.0.0:9002->80/tcp    httpd-web
# 94fd834f8b8e   nginx:1.19   "/docker-entrypoint…"  22 minutes ago    Up 9 seconds   0.0.0.0:9001->80/tcp    nginx-web
```

---

### 8.2 서비스 정상 동작 확인

```bash
# nginx 컨테이너 확인
curl localhost:9001

# httpd 컨테이너 확인
curl localhost:9002
```

---

### 8.3 전체 컨테이너 일괄 재시작

```bash
docker start $(docker ps -aq)
```

---

### 8.4 로그 확인

```bash
docker logs <container_id>
```

---

### 8.5 cgroup mountpoint 오류 해결

> **[참고]** 만약 이전 버전에서 실행 중이던 컨테이너 start 시 간혹 아래와 같은 오류가 발생한다.

```bash
docker start nginx-web
# docker: Error response from daemon: cgroups: cgroup mountpoint does not exist: unknown.

docker start httpd-web
# docker: Error response from daemon: cgroups: cgroup mountpoint does not exist: unknown.
```

**[solution]** 에러 메시지 내용처럼 cgroup mountpoint가 없는 문제다. 따라서, cgroup path에 디렉터리를 만들어주고 mount 해준다. 이후 docker start ~ 수행하면 해결 된다.

```bash
# cgroup systemd 디렉터리 생성
sudo mkdir /sys/fs/cgroup/systemd

# cgroup mount
sudo mount -t cgroup -o none,name=systemd cgroup /sys/fs/cgroup/systemd

# 이후 컨테이너 start 수행
docker start nginx-web
docker start httpd-web
```

---

## 9. 실습 5 – Docker 장애 상황 트러블슈팅

### 9.1 Docker 데몬이 기동되지 않을 때

```bash
journalctl -u docker
```

---

### 9.2 자주 발생하는 원인

| 증상         | 원인              |
| ---------- | --------------- |
| 데몬 기동 실패   | 설정 파일 오류        |
| 컨테이너 실행 실패 | cgroup mismatch |
| 네트워크 오류    | 커널 모듈 문제        |

---

### 9.3 임시 복구 전략

```bash
sudo systemctl restart docker
```

또는:

```bash
sudo reboot
```

---

## 10. 운영자가 반드시 알아야 할 팁

* Docker 업데이트는 **배포 작업**이다
* 무중단을 원하면 Compose / Swarm / K8s 필요
* 버전 고정 전략 고려
* 테스트 서버에서 선검증 필수

---

## 11. 핵심 요약 (운영 관점)

* Docker 엔진은 컨테이너 제어의 핵심
* 데몬 중단 ≠ 컨테이너 즉시 중단
* 최신 Docker 사용 이유: 새 기능, 버그 수정, 보안 패치, 성능 개선, 호환성, 커뮤니티 지원, LTS
* 업데이트 전 점검이 사고를 막는다
* GPG key 등록 → repository 등록 → apt install 순서로 업데이트
* cgroup mountpoint 오류 시 디렉터리 생성 및 mount로 해결
* 로그 확인 능력이 중요하다

---

## 12. 체크리스트 (미통과 시 다음 장 금지)

* [ ] Docker 엔진 역할을 설명할 수 있다
* [ ] 최신 Docker 엔진을 사용해야 하는 이유를 3가지 이상 설명할 수 있다
* [ ] docker / systemctl 상태 점검 가능
* [ ] GPG key 등록 및 repository 설정을 할 수 있다
* [ ] Docker 엔진 업데이트 절차를 이해했다
* [ ] cgroup mountpoint 오류 발생 시 해결 가능
* [ ] 장애 발생 시 로그 확인 가능
* [ ] 운영 서버 주의사항을 이해했다

---

## 13. 다음 챕터 예고

### Chapter 04. Docker 이미지 관리 (실전 핵심)

다음 장에서는:

* 이미지 구조 (Layer)
* Pull / Build / Tag / Push
* 이미지 용량 최적화
* 운영 환경 이미지 전략

을 **가장 많이 쓰는 실무 패턴 중심**으로 다룹니다.
