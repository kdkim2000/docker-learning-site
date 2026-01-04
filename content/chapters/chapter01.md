# Chapter 01. 컨테이너 가상화 이해

---

## 0. 강의 클립 구성

| Clip | 내용 | 설명 |
| ---- | --- | --- |
| Clip 1 | 컨테이너 기술 이란? | 컨테이너 기술에 대한 why, what, when |
| Clip 2 | docker 컨테이너 가상화와 VM 가상화 비교 | 컨테이너 가상화와 VM을 비교하고 가상화 기술에 대해 알아보기 |
| Clip 3 | PWD (Play with Docker) | PWD 사용해 보기 |

---

## 1. 이 챕터의 목표 (반드시 달성해야 할 것)

이 챕터를 끝내면 다음 질문에 **명확히 답할 수 있어야 합니다.**

- 컨테이너는 VM과 무엇이 다른가?
- 컨테이너는 “가상머신”이 아니라 왜 “프로세스”인가?
- 컨테이너는 실제로 어디까지 격리되는가?
- 컨테이너 내부에서 보는 OS는 진짜 OS인가?

👉 **개념 이해 + 직접 눈으로 확인하는 실습**이 핵심입니다.

---

## 2. 컨테이너 기술이란? (Why Container?)

### 2.1 컨테이너 기술의 정의

컨테이너는 **애플리케이션을 언제든 실행 가능하도록 필요한 모든 요소를 하나의 런타임 환경으로 패키징한 논리적 공간**을 말합니다.

포함되는 요소:
- 소스코드
- 구성요소
- 종속성 (라이브러리, 프레임워크 등)

> Docker에서는 **Dockerfile build**를 통해 이러한 패키징 기술을 구현합니다.

### 2.2 컨테이너의 본질

한마디로, **애플리케이션과 종속 항목을 하나로 묶어, 실행하게 해주는 운영 시스템을 가상화한 경량의 격리된 프로세스**라고 볼 수 있습니다.

- **microVM**이라고도 함
- **운영체제 수준의 가상화** 제공
- 독립성을 갖기 때문에 다른 컨테이너에 영향을 주지 않는 **stateless 환경** 제공

### 2.3 컨테이너의 장점

이 기술은 개인 데스크탑 뿐만 아니라 기업 내의 온프레미스 서버에서 AWS와 같은 퍼블릭 클라우드까지 **언제 어디서든 빠르고 효율적으로 배포 가능**하며, **확장성** 또한 가지고 있습니다.

이를 통해 서버구성, OS 설치, 네트워크, 개발 도구 구성 등의 반복적이고 불편한 작업에 시간을 낭비하지 않고 개발자는 **애플리케이션 개발 그 자체에 집중**할 수 있게 됩니다.

---

## 3. 컨테이너 특징 (What Container?)

### 3.1 경량성

- 컨테이너는 우리가 개발한 **최소한의 Image**를 통해 실행되므로 경량이다.
- 컨테이너 이미지 생성의 Best practice 중 하나는 **이미지 경량화**다.

### 3.2 빠른 실행 속도

- 일반 서버 환경에서의 애플리케이션 실행과 달리 언제든 **프로세스 수준의 속도**로 빠르게 실행(run)할 수 있다.
- 한번에 **여러 개의 컨테이너를 동시에 실행** 가능하다.
- Docker에서는 **docker compose** 기술을 통해 구현한다.

### 3.3 이식성 (Portability)

- 개인 환경이던 클라우드 환경이던 **어떤 OS, 어떤 환경에서도 동작 가능**한 이식성을 보유하고 있다.

### 3.4 비용 절감

- 컨테이너 자체 애플리케이션 환경에 대한 관리만 요구되므로, **지속적 서버관리 비용을 절감**할 수 있다.

### 3.5 DevOps 최적화

- 개발팀과 운영팀의 업무 분리로 각자의 업무와 세분화된 관리에 집중할 수 있다.
- 즉, 컨테이너는 **DevOps workflow 구성에 최적**이다.

---

## 4. 컨테이너 사용 사례 (When Container?)

앞서 설명한 컨테이너의 특징을 활용할 수 있는 대규모 애플리케이션 서비스부터 앱 서비스까지 여러 기업의 다양한 애플리케이션 환경에서 사용 중입니다.

| 기업 | 서비스 |
| --- | ----- |
| 구글 | 웹·앱 서비스 |
| 에어비앤비 | 추천 서비스 |
| 넷플릭스 | 추천 서비스 |
| 당근마켓 | 딥러닝 기반 추천 서비스 |
| 엔씨소프트 | 게임 서비스 |
| 삼성전자 | 헬스 케어 서비스 |
| 타다 | 배차 서비스 |
| 토스 | 금융 서비스 |

---

## 5. 컨테이너 타입 (Type Container?)

### 5.1 컨테이너 패키징 메커니즘

컨테이너는 다음 세 가지 타입으로 분류됩니다:
- **시스템 컨테이너**
- **애플리케이션 컨테이너**
- **라우터 컨테이너**

### 5.2 시스템 (OS) 컨테이너

- 호스트OS 위에 **Ubuntu와 같은 배포판 리눅스 Image**를 통해 배포되는 컨테이너
- 또다른 VM의 형태이고, 내부에 다양한 애플리케이션 및 라이브러리 도구를 설치, 실행 가능
- 대표적으로 **LXC, LXD, OpenVZ, Linux VServer, BSD Jails** 등이 있다.

```text
HostOS
 ├─ Ubuntu 20.04 container
 ├─ CentOS 7 container
 └─ RHEL 8 container
```

### 5.3 애플리케이션 컨테이너

- **단일 애플리케이션 실행**을 위해 해당 서비스를 패키징하고 실행하도록 설계된 컨테이너
- 3-tier 애플리케이션과 같은 경우 각 tier (frontend-backend-DB)를 **개별 컨테이너로 실행하여 연결**
- 대표적으로 **Docker container runtime, Rocket** 등이 있다.

```text
HostOS
 ├─ Nginx container (Frontend)
 ├─ Python container (Backend)
 └─ MySQL container (Database)
```

---

## 6. Docker란?

### 6.1 Docker의 탄생

Open source에 힘입어 전세계적으로 큰 인기를 얻고 있는 Docker는 **2013년 3월 Docker, Inc (PYCON)**에서 발표한 **"Open Source Container Project"**로 공개하였고, 컨테이너를 실행하고 관리하는 **container runtime 도구**입니다.

- 발표자: **솔로몬 하익스(Solomon Hykes)**
- 참고: https://www.youtube.com/watch?v=wW9CAH9nSLs

### 6.2 Docker는 무엇인가요?

- 여러 계층의 Application을 container로 분리, 연결하여 실행하는 **MSA (MicroService Architecture)** 프로젝트에 유용하다.
- Application의 Infra(runtime)는 **Image**를 통해 제공하고 **Public or Private** 하게 공유 가능
- Github과 유사한 방식(open share)으로 **Docker Hub**에서 제공 함 (https://hub.docker.com)
- 이렇게 제공된 Image를 기반으로 Application 서비스를 제공, 이를 **컨테이너화(Containerization)**할 수 있다.

### 6.3 Docker 워크플로우

```text
[Dockerfile]  →  Build  →  [Docker Image]  →  Push  →  [Docker Hub]
     ↓                                                        ↓
Application                                                 Pull
Infra 구성                                                    ↓
                                            docker run  →  [Docker Container]
                                                              ↓
                                                        Application 배포
```

---

## 7. 컨테이너 기술 역사 (Trend History)

### 7.1 컨테이너 기술 타임라인

| 시기 | 기술 | 설명 |
| --- | --- | --- |
| 1991~ | Linux 프로세스 격리 | cgroup, namespace, chroot, LXC |
| 2010~ | Virtual Machine 가상화 기술 | VMware, VirtualBox, Xen, KVM |
| 2013~ | Container 가상화 기술 | dotCloud → Docker |
| 2015~ | Container Orchestration tool | Kubernetes, Docker Swarm, AWS, Azure, GCP → CI/CD |

---

## 8. 가상화(Virtualization)란?

### 8.1 가상화의 정의

- 일반적으로 **서버, 스토리지, 네트워크, 애플리케이션** 등을 가상화하여 하드웨어 리소스를 효율적으로 사용하는데 그 목적이 있다.
- 이를 통해 기업은 **효율적인 자원 활용, 자동화된 IT 관리, 빠른 재해 복구** 등의 장점을 갖을 수 있다.
- 물리적 하드웨어 유지 관리 대신 소프트웨어적으로 추상화된 가상화를 통해 제한된 부분을 쉽게 관리하고 유지할 수 있다.
- **하이퍼바이저 기반의 가상머신(VM, Virtual Machine)**을 통해 수행한다.
  - VMware, VirtualBox 등

### 8.2 컨테이너 가상화 vs. VM 가상화

두 가지 가상화 모두 실행하고자 하는 **애플리케이션 프로세스 및 종속 요소와 소스 등을 패키지, 즉 이미지화**하여 **HostOS와 격리된 환경**을 제공한다.

| 구분 | VM 가상화 | 컨테이너 가상화 |
| --- | -------- | ------------ |
| 가상화 수준 | **하드웨어 수준** | **운영체제(OS) 수준** |
| Guest OS | 별도의 GuestOS 필요 | Host 커널 공유 |
| 무게 | 무거움 (GB 단위) | 경량 (MB 단위) |
| 속도 | 부팅 느림 (수십 초) | 빠름 (수 ms) |

- **VM 가상화**: 실제 호스트 운영체제와 같이 별도의 GuestOS를 두고 원하는 애플리케이션을 설치하는 **하드웨어 수준의 가상화**를 구현
- **컨테이너 가상화**: VM 가상화에 비해 경량이면서 호스트 운영체제의 커널을 공유하는 **운영체제(OS) 수준의 가상화**를 구현
- 따라서, 컨테이너 가상화는 원하는 애플리케이션 환경을 빠르게 번들링하여 패키징한다.

---

## 9. 애플리케이션 배포 방식 비교

### 9.1 세 가지 배포 방식

```text
┌─────────────────┐  ┌─────────────────────────────┐  ┌─────────────────────────────┐
│  일반 서버      │  │      가상머신 (GB)          │  │      컨테이너 (MB)          │
│  (온프레미스)   │  │                             │  │                             │
├─────────────────┤  ├─────────────────────────────┤  ├─────────────────────────────┤
│ App.1 App.2 App.3│ │ VM1      VM2      VM3       │  │Container Container Container│
│                 │  │ App.1    App.2    App.3     │  │ App.1    App.2    App.3     │
│                 │  │Bins/Libs Bins/Libs Bins/Libs│  │Bins/Libs Bins/Libs Bins/Libs│
│                 │  │ Guest OS Guest OS Guest OS  │  │                             │
│                 │  ├─────────────────────────────┤  ├─────────────────────────────┤
│                 │  │        Hypervisor           │  │       Docker engine         │
├─────────────────┤  ├─────────────────────────────┤  ├─────────────────────────────┤
│     Host OS     │  │     Host OS (Yes / No)      │  │         Host OS             │
├─────────────────┤  ├─────────────────────────────┤  ├─────────────────────────────┤
│ Server HW       │  │     Server Infrastructure HW│  │   Server Infrastructure HW  │
└─────────────────┘  └─────────────────────────────┘  └─────────────────────────────┘
```

---

## 10. 컨테이너화 (Containerization) 기술

### 10.1 LXC에서 Docker로

- 리눅스 컨테이너 기술은 **LXC(LinuX Container)**를 이용한 시스템 컨테이너화로 시작
  - OS 수준의 가상화 도구
  - cgroup, namespace 등의 커널 기술을 공유하여 컨테이너에 제공
- 이후 애플리케이션 컨테이너 기반의 **Docker 출시**가 되었고, 초기 Docker 버전은 **LXC를 활용**해 컨테이너를 생성

### 10.2 Docker 엔진의 발전

지속된 컨테이너 엔진의 발전으로 Docker는 **containerd, runC**를 이용하는 방식으로 변경

| 구성요소 | 역할 |
| ------- | --- |
| **runC** | 커널 기술의 공유를 통해 컨테이너 생성을 지원 |
| **containerd** | 생성된 컨테이너의 라이프사이클 관리를 지원 |
| **dockerd** | 사용자 환경에서의 명령을 전달 |

```text
[LXC 기반]              [libcontainer 기반]        [containerd, runC 기반]
┌──────────────┐        ┌──────────────┐          ┌──────────────┐
│  Container   │        │  Container   │          │  Container   │
│  App + Libs  │        │  App + Libs  │          │  App + Libs  │
├──────────────┤        ├──────────────┤          ├──────────────┤
│     LXC      │        │ libcontainer │          │containerd,runC│
├──────────────┤        ├──────────────┤          ├──────────────┤
│   Kernel     │        │   Kernel     │          │   Kernel     │
│  (cgroup,ns) │        │  (cgroup,ns) │          │  (cgroup,ns) │
├──────────────┤        ├──────────────┤          ├──────────────┤
│   Host OS    │        │   Host OS    │          │   Host OS    │
└──────────────┘        └──────────────┘          └──────────────┘
```

### 10.3 dockerd 기능

dockerd는 다음과 같은 기능을 제공합니다:

| 기능 | 설명 |
| --- | --- |
| Docker CLI API | 사용자 명령 처리 |
| swarmkit | 클러스터 관리 |
| Logs mgmt | 로그 관리 |
| Storage mgmt | 스토리지 관리 |
| libnetwork | 네트워크 관리 |
| buildkit | 이미지 빌드 |
| DCT | Docker Content Trust (보안) |
| Image mgmt | 이미지 관리 |

---

## 11. 가상화의 역사 (왜 컨테이너가 등장했는가)

### 11.1 물리 서버 시대

```text
물리 서버 1대
 └─ OS 1개
     └─ Application 1개
````

문제점:

* 서버 자원 낭비
* 환경 변경 어려움
* 확장 불가능

---

### 11.2 가상머신(Virtual Machine) 등장

```text
물리 서버
 └─ Hypervisor
     ├─ VM1 (OS + App)
     ├─ VM2 (OS + App)
     └─ VM3 (OS + App)
```

장점:

* 서버 통합
* OS 단위 격리

단점:

* OS 포함 → 무거움
* 부팅 느림
* 자원 낭비

---

### 11.3 컨테이너(Container)의 등장

```text
물리 서버
 └─ Host OS (Kernel)
     ├─ Container A (Process)
     ├─ Container B (Process)
     └─ Container C (Process)
```

핵심:

* OS Kernel 공유
* 프로세스 단위 격리
* 매우 빠름
* 가볍다

---

## 12. 컨테이너 격리 기술

### 12.1 컨테이너의 기술적 본질

> 컨테이너 =
> **격리된 네임스페이스에서 실행되는 리눅스 프로세스**

Docker는:

* 프로세스를 생성하고
* 네임스페이스로 격리하고
* 리소스를 제한한다

### 12.2 컨테이너 격리 기술 (개념)

| 기술        | 역할              |
| --------- | --------------- |
| Namespace | 프로세스 격리         |
| Cgroups   | CPU / Memory 제한 |
| RootFS    | 파일시스템 분리        |

👉 **컨테이너는 OS가 아니라 "프로세스"**

---

## 13. PWD (Play with Docker)

### 13.1 Docker 컨테이너 놀이터

Docker는 웹에서 제공하는 인스턴스 형태의 **Docker 랩실**을 제공합니다.

- 한 인스턴스 당 **4시간의 시간**을 제공하며, 언제든 무료로 사용 가능
- **외부에서 접근 가능한 웹 주소** 제공
- URL: https://www.docker.com/play-with-docker/

### 13.2 PWD 사용 방법

1. https://www.docker.com/play-with-docker/ 접속
2. **Lab Environment** 선택 (hub.docker.com 계정 요구)
3. **Get Started** 클릭
4. **+ ADD NEW INSTANCE** 클릭하여 인스턴스 생성
5. 터미널에서 Docker 명령어 실습

### 13.3 PWD 실습 예시

```bash
# nginx 이미지 다운로드
docker pull nginx:1.19

# nginx 컨테이너 실행 (포트 8000 매핑)
docker run -d -p 8000:80 nginx:1.19

# 웹 브라우저에서 접근 확인
curl localhost:8000
```

### 13.4 Docker Swarm 실습

PWD에서는 Docker Swarm 클러스터 실습도 가능합니다.

- URL: https://training.play-with-docker.com/swarm-mode-intro/

```bash
# Swarm 초기화
docker swarm init --advertise-addr $(hostname -i)

# 노드 목록 확인
docker node ls

# 서비스 생성
docker service create -p 80:80 --name web nginx:latest
docker service ls
```

---

## 14. 실습 1 – 컨테이너는 정말 프로세스인가?

### 14.1 컨테이너 실행

```bash
docker run -it alpine sh
```

* `alpine`: 초경량 Linux
* `sh`: 쉘 실행

---

### 14.2 컨테이너 내부에서 프로세스 확인

```bash
ps
```

출력 예:

```text
PID   USER     COMMAND
1     root     sh
```

❗ 놀라운 점:

* PID 1부터 시작
* init 프로세스처럼 보임

---

### 14.3 Host에서 프로세스 확인

컨테이너를 **열어둔 상태에서**, Host 터미널에서:

```bash
ps -ef | grep sh
```

👉 **컨테이너 프로세스가 Host에 존재함**

---

## 15. 실습 2 – 컨테이너와 Host의 경계 확인

### 15.1 Host OS 확인

```bash
uname -a
```

---

### 15.2 컨테이너 내부에서 OS 확인

```bash
uname -a
```

✔ 결과가 **거의 동일**

👉 Kernel은 Host 것임을 확인

---

### 15.3 파일 시스템 격리 확인

컨테이너 내부:

```bash
ls /
```

Host에서:

```bash
ls /
```

👉 서로 다름 (RootFS 격리)

---

## 16. 실습 3 – 컨테이너는 격리되었는가?

### 16.1 컨테이너에서 네트워크 확인

```bash
ip addr
```

---

### 16.2 Host 네트워크와 비교

```bash
ip addr
```

👉 인터페이스 구조가 다름
→ 네트워크 네임스페이스 격리

---

## 8. 실습 4 – 컨테이너는 얼마나 가벼운가?

### 8.1 실행 시간 측정

```bash
time docker run --rm alpine echo "hello"
```

출력 예:

```text
real    0.2s
```

VM에서는 불가능한 속도

---

## 9. 실습 5 – 컨테이너 삭제 확인

```bash
exit
docker ps -a
```

컨테이너 없음 확인

👉 컨테이너는 **휘발성**

---

## 10. 반드시 이해해야 할 핵심 정리

### 컨테이너 핵심 요약

* 컨테이너는 VM이 아니다
* 컨테이너는 프로세스다
* Kernel은 Host 것
* 파일시스템은 격리됨
* 빠르고 가볍다

---

## 11. 체크리스트 (미통과 시 다음 장 금지)

* [ ] VM과 컨테이너 차이를 설명할 수 있다
* [ ] 컨테이너 = 프로세스임을 이해했다
* [ ] Kernel 공유 개념을 이해했다
* [ ] `docker run -it alpine sh` 실습 성공
* [ ] Host/Container 차이를 직접 확인했다

---

## 12. 다음 챕터 예고

### Chapter 02. Docker 플랫폼 구성

다음 장에서는:

* Docker 내부 구조
* Client / Daemon 관계
* docker run 명령의 실제 흐름

을 **아키텍처 + 실습**으로 파헤칩니다.