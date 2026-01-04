# Chapter 11. Docker Swarm

## 목차

- [Clip 1. Docker Swarm 이란?](#1-docker-swarm-이란)
- [Clip 2. Swarm Cluster 핵심 개념](#2-swarm-cluster-핵심-개념)
- [Clip 3. [실습] Swarm Cluster 구성](#3-실습-swarm-cluster-구성)
- [Clip 4. Swarm 네트워크](#4-swarm-네트워크)
- [Clip 5. [실습] Swarm 모니터링 도구](#5-실습-swarm-모니터링-도구)
- [Clip 6. [실습] Swarm Service 생성 및 관리](#6-실습-swarm-service-생성-및-관리)
- [Clip 7. Service 배포 모드 (Replicated vs Global)](#7-service-배포-모드-replicated-vs-global)
- [Clip 8. [실습] Rolling Update와 Rollback](#8-실습-rolling-update와-rollback)
- [Clip 9. [실습] 장애 복구와 Node Drain](#9-실습-장애-복구와-node-drain)
- [Clip 10. Docker Stack 개념](#10-docker-stack-개념)
- [Clip 11. [실습] HAProxy + Nginx Stack 배포](#11-실습-haproxy--nginx-stack-배포)
- [Clip 12. [실습] Node Label 기반 배치](#12-실습-node-label-기반-배치)

---

## 1. Docker Swarm 이란?

> 컨테이너 오케스트레이션을 위한 Docker의 기본 기능 이해하기

### 1.1 Docker Swarm 개요

Docker Swarm은 여러 Docker Host를 하나의 **클러스터**로 묶어 컨테이너를 **자동 배포, 확장, 복구**하는 Docker의 기본 오케스트레이션 기능이다.

```
┌───────────────────────────────────────────────────────────────────┐
│                    Docker Swarm 클러스터 개념                     │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│   단일 호스트 (Docker)              Swarm 클러스터                │
│                                                                   │
│   ┌──────────────┐                 ┌─────────────────────────┐    │
│   │  Docker Host │                 │      Swarm Cluster      │    │
│   │              │                 │                         │    │
│   │ ┌──────────┐ │                 │  ┌────────┐ ┌────────┐  │    │
│   │ │Container │ │      ────→      │  │Manager │ │Manager │  │    │
│   │ └──────────┘ │                 │  └────────┘ └────────┘  │    │
│   │ ┌──────────┐ │                 │                         │    │
│   │ │Container │ │                 │  ┌────────┐ ┌────────┐  │    │
│   │ └──────────┘ │                 │  │ Worker │ │ Worker │  │    │
│   └──────────────┘                 │  └────────┘ └────────┘  │    │
│                                    └─────────────────────────┘    │
│                                                                   │
│   - 수동 관리                       - 자동 배포                   │
│   - 단일 장애점                     - 고가용성                    │
│   - 수동 스케일링                   - 자동 스케일링               │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

### 1.2 Docker Swarm의 특징

| 특징 | 설명 |
|------|------|
| **기본 내장** | Docker Engine에 포함, 별도 설치 불필요 |
| **선언적 서비스** | 원하는 상태(Desired State)를 정의 |
| **자동 복구** | 컨테이너/노드 장애 시 자동 재배치 |
| **로드밸런싱** | 내장 로드밸런서 제공 |
| **롤링 업데이트** | 무중단 서비스 업데이트 지원 |
| **보안 통신** | TLS를 통한 노드 간 암호화 통신 |

### 1.3 Docker Swarm vs Kubernetes

| 항목 | Docker Swarm | Kubernetes |
|------|--------------|------------|
| **설치 복잡도** | 간단 | 복잡 |
| **학습 곡선** | 낮음 | 높음 |
| **기능** | 기본적 | 풍부함 |
| **확장성** | 중소규모 | 대규모 |
| **커뮤니티** | 작음 | 큼 |
| **사용 목적** | 빠른 구축, 학습 | 프로덕션, 엔터프라이즈 |

> **참고:** Docker Swarm은 Kubernetes 학습 전 오케스트레이션 개념을 익히기에 좋은 도구이다.

---

## 2. Swarm Cluster 핵심 개념

> Swarm의 주요 용어와 구조 이해하기

### 2.1 주요 용어 정리

| 용어 | 설명 |
|------|------|
| **Node** | Swarm 클러스터를 구성하는 Docker Host |
| **Manager Node** | 클러스터 관리, 스케줄링, 상태 유지 담당 |
| **Worker Node** | 실제 컨테이너(Task)가 실행되는 노드 |
| **Service** | 배포 단위, 실행할 작업의 정의 |
| **Task** | Service에 의해 생성되는 최소 실행 단위 (컨테이너 1개) |
| **Stack** | 여러 Service를 묶은 애플리케이션 단위 |
| **Scheduling** | Service 명세에 따라 Task를 노드에 분배 |

### 2.2 Node 역할

```
┌────────────────────────────────────────────────────────────────────┐
│                        Swarm Node 역할                             │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                     Manager Node                            │   │
│  │  - 클러스터 상태 관리 (Raft Consensus)                      │   │
│  │  - 서비스 스케줄링                                          │   │
│  │  - API 엔드포인트 제공                                      │   │
│  │  - 워커 노드도 겸할 수 있음                                 │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                     │
│                              │ 관리/조정                           │
│                              ↓                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                      Worker Node                            │   │
│  │  - 실제 컨테이너(Task) 실행                                 │   │
│  │  - Manager로부터 Task 할당 받음                             │   │
│  │  - 상태를 Manager에게 보고                                  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### 2.3 Service / Task / Stack 구조

```
┌─────────────────────────────────────────────────────────────────────┐
│                   Stack / Service / Task 계층 구조                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   Stack (애플리케이션)                                              │
│   └── docker-stack.yaml                                             │
│       │                                                             │
│       ├── Service: web                                              │
│       │   ├── Task 1 (Container) → Worker Node 1                    │
│       │   ├── Task 2 (Container) → Worker Node 2                    │
│       │   └── Task 3 (Container) → Worker Node 3                    │
│       │                                                             │
│       ├── Service: api                                              │
│       │   ├── Task 1 (Container) → Worker Node 1                    │
│       │   └── Task 2 (Container) → Worker Node 2                    │
│       │                                                             │
│       └── Service: db                                               │
│           └── Task 1 (Container) → Worker Node 3                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.4 Service의 특징

- Service는 하나의 **VIP (Virtual IP)**를 가진다
- Task는 replica 수에 따라 여러 개 생성
- 내부 DNS로 Service 이름으로 접근 가능
- 자동 로드밸런싱 제공

---

## 3. [실습] Swarm Cluster 구성

> 3대의 Docker Host로 Swarm 클러스터 구성하기

### 3.1 실습 환경

```
┌────────────────────────────────────────────────────────────────────┐
│                        실습 환경 구성                              │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│   ┌─────────────────┐                                              │
│   │    hostos1      │  192.168.56.201  (Manager)                   │
│   │  Manager Node   │                                              │
│   └────────┬────────┘                                              │
│            │                                                       │
│   ┌────────┴────────────────────────────────┐                      │
│   │                 │                       │                      │
│   ↓                 ↓                       ↓                      │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐                         │
│   │ hostos2  │  │ hostos3  │  │ hostos4  │  (선택)                 │
│   │  Worker  │  │  Worker  │  │  Worker  │                         │
│   │ .56.202  │  │ .56.203  │  │ .56.204  │                         │
│   └──────────┘  └──────────┘  └──────────┘                         │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### 3.2 필요 포트

| 포트 | 프로토콜 | 용도 |
|------|----------|------|
| 2377 | TCP | 클러스터 관리 통신 |
| 7946 | TCP/UDP | 노드 간 통신 (Control Plane) |
| 4789 | UDP | Overlay 네트워크 트래픽 |

### 3.3 방화벽 설정

```bash
# 모든 노드에서 실행
kevin@hostos1:~$ sudo ufw allow 2377/tcp
kevin@hostos1:~$ sudo ufw allow 7946/tcp
kevin@hostos1:~$ sudo ufw allow 7946/udp
kevin@hostos1:~$ sudo ufw allow 4789/udp
kevin@hostos1:~$ sudo ufw reload
```

### 3.4 Swarm 초기화 (Manager Node)

```bash
kevin@hostos1:~$ docker swarm init --advertise-addr 192.168.56.201
Swarm initialized: current node (abc123def456) is now a manager.

To add a worker to this swarm, run the following command:

    docker swarm join --token SWMTKN-1-xxxxx-yyyyy 192.168.56.201:2377

To add a manager to this swarm, run 'docker swarm join-token manager' and follow the instructions.
```

### 3.5 Worker Node Join

**Worker Node (hostos2, hostos3)에서 실행:**

```bash
kevin@hostos2:~$ docker swarm join --token SWMTKN-1-xxxxx-yyyyy 192.168.56.201:2377
This node joined a swarm as a worker.

kevin@hostos3:~$ docker swarm join --token SWMTKN-1-xxxxx-yyyyy 192.168.56.201:2377
This node joined a swarm as a worker.
```

### 3.6 Join Token 확인

```bash
# Worker 토큰 확인
kevin@hostos1:~$ docker swarm join-token worker
To add a worker to this swarm, run the following command:

    docker swarm join --token SWMTKN-1-xxxxx-yyyyy 192.168.56.201:2377

# Manager 토큰 확인
kevin@hostos1:~$ docker swarm join-token manager
To add a manager to this swarm, run the following command:

    docker swarm join --token SWMTKN-1-xxxxx-zzzzz 192.168.56.201:2377
```

### 3.7 클러스터 상태 확인

```bash
kevin@hostos1:~$ docker node ls
ID                            HOSTNAME   STATUS    AVAILABILITY   MANAGER STATUS   ENGINE VERSION
abc123def456 *                hostos1    Ready     Active         Leader           24.0.2
def456ghi789                  hostos2    Ready     Active                          24.0.2
ghi789jkl012                  hostos3    Ready     Active                          24.0.2

kevin@hostos1:~$ docker info | grep -A 20 Swarm
Swarm: active
  NodeID: abc123def456
  Is Manager: true
  ClusterID: cluster123456
  Managers: 1
  Nodes: 3
  Default Address Pool: 10.0.0.0/8
  SubnetSize: 24
  Data Path Port: 4789
  Orchestration:
   Task History Retention Limit: 5
  Raft:
   Snapshot Interval: 10000
   Number of Old Snapshots to Retain: 0
   Heartbeat Tick: 1
   Election Tick: 10
  Dispatcher:
   Heartbeat Period: 5 seconds
```

### 3.8 Swarm 해제

```bash
# Worker 노드에서 (해당 노드만 떠남)
kevin@hostos2:~$ docker swarm leave

# Manager 노드에서 (클러스터 해제)
kevin@hostos1:~$ docker swarm leave --force
```

---

## 4. Swarm 네트워크

> Swarm 클러스터의 네트워크 구조 이해하기

### 4.1 Swarm 기본 네트워크

Swarm 초기화 시 자동으로 생성되는 네트워크:

| 네트워크 | 드라이버 | 용도 |
|----------|----------|------|
| **ingress** | overlay | Service 외부 노출, 로드밸런싱 |
| **docker_gwbridge** | bridge | 컨테이너와 호스트 간 통신 |

### 4.2 네트워크 확인

```bash
kevin@hostos1:~$ docker network ls
NETWORK ID     NAME              DRIVER    SCOPE
abc123def456   bridge            bridge    local
def456ghi789   docker_gwbridge   bridge    local
ghi789jkl012   host              host      local
jkl012mno345   ingress           overlay   swarm
mno345pqr678   none              null      local
```

### 4.3 ingress 네트워크 상세

```bash
kevin@hostos1:~$ docker network inspect ingress
[
    {
        "Name": "ingress",
        "Id": "jkl012mno345...",
        "Created": "2023-06-20T10:00:00.000000000Z",
        "Scope": "swarm",
        "Driver": "overlay",
        "EnableIPv6": false,
        "IPAM": {
            "Driver": "default",
            "Options": null,
            "Config": [
                {
                    "Subnet": "10.0.0.0/24",
                    "Gateway": "10.0.0.1"
                }
            ]
        },
        "Internal": false,
        "Attachable": false,
        "Ingress": true,
        ...
    }
]
```

### 4.4 Swarm 네트워크 구조

```
┌───────────────────────────────────────────────────────────────────┐
│                      Swarm 네트워크 구조                          │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│   ┌────────────────────────────────────────────────────────────┐  │
│   │                      ingress (overlay)                     │  │
│   │                                                            │  │
│   │  ┌─────────────────────────────────────────────────────┐   │  │
│   │  │              Routing Mesh (VIP)                     │   │  │
│   │  │                   10.0.0.x                          │   │  │
│   │  └─────────────────────────────────────────────────────┘   │  │
│   │                                                            │  │
│   └──────────────────────────┬─────────────────────────────────┘  │
│                              │                                    │
│   ┌──────────────────────────┼──────────────────────┐             │
│   │                          │                      │             │
│   ↓                          ↓                      ↓             │
│   ┌──────────┐          ┌──────────┐          ┌──────────┐        │
│   │ hostos1  │          │ hostos2  │          │ hostos3  │        │
│   │          │          │          │          │          │        │
│   │ ┌──────┐ │          │ ┌──────┐ │          │ ┌──────┐ │        │
│   │ │Task 1│ │          │ │Task 2│ │          │ │Task 3│ │        │
│   │ └──────┘ │          │ └──────┘ │          │ └──────┘ │        │
│   │          │          │          │          │          │        │
│   │docker_   │          │docker_   │          │docker_   │        │
│   │gwbridge  │          │gwbridge  │          │gwbridge  │        │
│   └──────────┘          └──────────┘          └──────────┘        │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

### 4.5 사용자 정의 Overlay 네트워크

```bash
# Overlay 네트워크 생성
kevin@hostos1:~$ docker network create --driver overlay --attachable my-overlay
pqr678stu901...

# 네트워크 확인
kevin@hostos1:~$ docker network ls | grep overlay
jkl012mno345   ingress      overlay   swarm
pqr678stu901   my-overlay   overlay   swarm
```

---

## 5. [실습] Swarm 모니터링 도구

> Visualizer와 Swarmpit으로 클러스터 시각화하기

### 5.1 Visualizer 배포

Visualizer는 Swarm 클러스터 상태를 시각적으로 보여주는 간단한 도구이다.

```bash
kevin@hostos1:~$ docker service create \
  --name=viz_swarm \
  --publish=8082:8080 \
  --constraint=node.role==manager \
  --mount=type=bind,src=/var/run/docker.sock,dst=/var/run/docker.sock \
  dockersamples/visualizer

overall progress: 1 out of 1 tasks
1/1: running   [==================================================>]
verify: Service converged
```

### 5.2 Visualizer 확인

```bash
kevin@hostos1:~$ docker service ls
ID             NAME        MODE         REPLICAS   IMAGE                             PORTS
abc123def456   viz_swarm   replicated   1/1        dockersamples/visualizer:latest   *:8082->8080/tcp

kevin@hostos1:~$ docker service ps viz_swarm
ID             NAME          IMAGE                             NODE      DESIRED STATE   CURRENT STATE
def456ghi789   viz_swarm.1   dockersamples/visualizer:latest   hostos1   Running         Running 30 seconds ago
```

웹 브라우저에서 `http://192.168.56.201:8082` 접속

### 5.3 Visualizer 화면 예시

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Docker Swarm Visualizer                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   hostos1 (Manager)     hostos2 (Worker)     hostos3 (Worker)       │
│   ┌─────────────┐       ┌─────────────┐      ┌─────────────┐        │
│   │ viz_swarm   │       │ myweb.1     │      │ myweb.2     │        │
│   │ (running)   │       │ (running)   │      │ (running)   │        │
│   └─────────────┘       ├─────────────┤      ├─────────────┤        │
│                         │ myweb.3     │      │             │        │
│                         │ (running)   │      │             │        │
│                         └─────────────┘      └─────────────┘        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.4 Swarmpit 배포 (선택)

Swarmpit은 더 풍부한 기능을 제공하는 Swarm 관리 UI이다.

```bash
kevin@hostos1:~$ docker run -it --rm \
  --name swarmpit-installer \
  --volume /var/run/docker.sock:/var/run/docker.sock \
  swarmpit/install:edge
```

설치 완료 후 `http://192.168.56.201:888` 접속

### 5.5 Swarmpit 기능

| 기능 | 설명 |
|------|------|
| **Dashboard** | 클러스터 전체 상태 요약 |
| **Services** | 서비스 생성/수정/삭제 |
| **Stacks** | Stack 배포 및 관리 |
| **Tasks** | Task 상태 모니터링 |
| **Nodes** | 노드 관리 및 상태 확인 |
| **Networks** | 네트워크 관리 |
| **Volumes** | 볼륨 관리 |

---

## 6. [실습] Swarm Service 생성 및 관리

> Swarm Service의 생성, 조회, 스케일링 실습

### 6.1 기본 Service 생성

```bash
kevin@hostos1:~$ docker service create --name hello-service ubuntu:14.04 \
  /bin/sh -c "while true; do echo 'Welcome to Docker Swarm!'; sleep 3; done"

overall progress: 1 out of 1 tasks
1/1: running   [==================================================>]
verify: Service converged
```

### 6.2 Service 상태 확인

```bash
kevin@hostos1:~$ docker service ls
ID             NAME            MODE         REPLICAS   IMAGE          PORTS
ghi789jkl012   hello-service   replicated   1/1        ubuntu:14.04

kevin@hostos1:~$ docker service ps hello-service
ID             NAME              IMAGE          NODE      DESIRED STATE   CURRENT STATE
jkl012mno345   hello-service.1   ubuntu:14.04   hostos2   Running         Running 30 seconds ago

kevin@hostos1:~$ docker service logs hello-service
hello-service.1.jkl012mno345@hostos2    | Welcome to Docker Swarm!
hello-service.1.jkl012mno345@hostos2    | Welcome to Docker Swarm!
hello-service.1.jkl012mno345@hostos2    | Welcome to Docker Swarm!
```

### 6.3 Nginx Service 생성 (Port 노출)

```bash
kevin@hostos1:~$ docker service create \
  --name myweb \
  --replicas 3 \
  -p 8001:80 \
  nginx:1.25.0-alpine

overall progress: 3 out of 3 tasks
1/3: running   [==================================================>]
2/3: running   [==================================================>]
3/3: running   [==================================================>]
verify: Service converged
```

### 6.4 Service 상세 확인

```bash
kevin@hostos1:~$ docker service ls
ID             NAME     MODE         REPLICAS   IMAGE                 PORTS
mno345pqr678   myweb    replicated   3/3        nginx:1.25.0-alpine   *:8001->80/tcp

kevin@hostos1:~$ docker service ps myweb
ID             NAME      IMAGE                 NODE      DESIRED STATE   CURRENT STATE
pqr678stu901   myweb.1   nginx:1.25.0-alpine   hostos1   Running         Running 20 seconds ago
stu901vwx234   myweb.2   nginx:1.25.0-alpine   hostos2   Running         Running 20 seconds ago
vwx234yza567   myweb.3   nginx:1.25.0-alpine   hostos3   Running         Running 20 seconds ago
```

### 6.5 Service 접속 테스트

Swarm의 **Routing Mesh** 기능으로 어느 노드에서든 접속 가능:

```bash
# Manager 노드에서
kevin@hostos1:~$ curl localhost:8001
<!DOCTYPE html>
<html>
<head>
<title>Welcome to nginx!</title>
...

# Worker 노드에서도 접속 가능
kevin@hostos2:~$ curl localhost:8001
<!DOCTYPE html>
...

kevin@hostos3:~$ curl localhost:8001
<!DOCTYPE html>
...
```

### 6.6 Service 스케일링

```bash
# 스케일 업 (3 → 6)
kevin@hostos1:~$ docker service scale myweb=6
myweb scaled to 6
overall progress: 6 out of 6 tasks
1/6: running   [==================================================>]
2/6: running   [==================================================>]
3/6: running   [==================================================>]
4/6: running   [==================================================>]
5/6: running   [==================================================>]
6/6: running   [==================================================>]
verify: Service converged

kevin@hostos1:~$ docker service ps myweb
ID             NAME      IMAGE                 NODE      DESIRED STATE   CURRENT STATE
pqr678stu901   myweb.1   nginx:1.25.0-alpine   hostos1   Running         Running 2 minutes ago
stu901vwx234   myweb.2   nginx:1.25.0-alpine   hostos2   Running         Running 2 minutes ago
vwx234yza567   myweb.3   nginx:1.25.0-alpine   hostos3   Running         Running 2 minutes ago
yza567bcd890   myweb.4   nginx:1.25.0-alpine   hostos1   Running         Running 10 seconds ago
bcd890efg123   myweb.5   nginx:1.25.0-alpine   hostos2   Running         Running 10 seconds ago
efg123hij456   myweb.6   nginx:1.25.0-alpine   hostos3   Running         Running 10 seconds ago

# 스케일 다운 (6 → 2)
kevin@hostos1:~$ docker service scale myweb=2
myweb scaled to 2
```

### 6.7 Service 삭제

```bash
kevin@hostos1:~$ docker service rm myweb hello-service
myweb
hello-service

kevin@hostos1:~$ docker service ls
ID        NAME      MODE      REPLICAS   IMAGE     PORTS
```

---

## 7. Service 배포 모드 (Replicated vs Global)

> Service 배포 모드의 차이점 이해하기

### 7.1 배포 모드 비교

| 모드 | 설명 | 사용 사례 |
|------|------|----------|
| **Replicated** | 지정된 수의 replica 생성 (기본값) | 웹 애플리케이션, API 서버 |
| **Global** | 모든 노드에 하나씩 Task 배치 | 모니터링 에이전트, 로그 수집기 |

```
┌─────────────────────────────────────────────────────────────────────┐
│                  Replicated vs Global Mode                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   Replicated Mode (replicas=3)       Global Mode                   │
│                                                                     │
│   hostos1   hostos2   hostos3        hostos1   hostos2   hostos3   │
│   ┌─────┐   ┌─────┐   ┌─────┐        ┌─────┐   ┌─────┐   ┌─────┐  │
│   │Task1│   │Task2│   │Task3│        │Task │   │Task │   │Task │  │
│   └─────┘   └─────┘   └─────┘        └─────┘   └─────┘   └─────┘  │
│                                                                     │
│   - 지정 개수만큼 배치               - 노드당 1개씩 자동 배치        │
│   - 어느 노드든 배치 가능            - 새 노드 추가 시 자동 배포     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 7.2 Replicated Mode 예시

```bash
kevin@hostos1:~$ docker service create \
  --name replicated-web \
  --replicas 4 \
  -p 8002:80 \
  nginx:1.25.0-alpine

kevin@hostos1:~$ docker service ps replicated-web
ID             NAME               IMAGE                 NODE      DESIRED STATE   CURRENT STATE
abc123def456   replicated-web.1   nginx:1.25.0-alpine   hostos1   Running         Running 10 seconds ago
def456ghi789   replicated-web.2   nginx:1.25.0-alpine   hostos2   Running         Running 10 seconds ago
ghi789jkl012   replicated-web.3   nginx:1.25.0-alpine   hostos3   Running         Running 10 seconds ago
jkl012mno345   replicated-web.4   nginx:1.25.0-alpine   hostos1   Running         Running 10 seconds ago
```

### 7.3 Global Mode 예시

```bash
kevin@hostos1:~$ docker service create \
  --name global-agent \
  --mode global \
  nginx:1.25.0-alpine

kevin@hostos1:~$ docker service ls
ID             NAME           MODE      REPLICAS   IMAGE                 PORTS
mno345pqr678   global-agent   global    3/3        nginx:1.25.0-alpine

kevin@hostos1:~$ docker service ps global-agent
ID             NAME                                    IMAGE                 NODE      DESIRED STATE   CURRENT STATE
pqr678stu901   global-agent.abc123def456              nginx:1.25.0-alpine   hostos1   Running         Running 10 seconds ago
stu901vwx234   global-agent.def456ghi789              nginx:1.25.0-alpine   hostos2   Running         Running 10 seconds ago
vwx234yza567   global-agent.ghi789jkl012              nginx:1.25.0-alpine   hostos3   Running         Running 10 seconds ago
```

### 7.4 Global Mode 활용 사례

```bash
# 로그 수집 에이전트 (모든 노드에 배포)
docker service create \
  --name log-collector \
  --mode global \
  --mount type=bind,src=/var/log,dst=/var/log \
  fluent/fluentd

# 노드 모니터링 에이전트
docker service create \
  --name node-exporter \
  --mode global \
  --publish mode=host,target=9100,published=9100 \
  prom/node-exporter
```

---

## 8. [실습] Rolling Update와 Rollback

> 서비스 무중단 업데이트 및 롤백 실습

### 8.1 Rolling Update 개념

```
┌─────────────────────────────────────────────────────────────────────┐
│                      Rolling Update 과정                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   Step 1: 초기 상태 (nginx:1.24)                                    │
│   ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                             │
│   │v1.24 │ │v1.24 │ │v1.24 │ │v1.24 │                             │
│   └──────┘ └──────┘ └──────┘ └──────┘                             │
│                                                                     │
│   Step 2: 첫 번째 Task 업데이트                                     │
│   ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                             │
│   │v1.25 │ │v1.24 │ │v1.24 │ │v1.24 │  ← 1개씩 순차 업데이트       │
│   └──────┘ └──────┘ └──────┘ └──────┘                             │
│                                                                     │
│   Step 3: 두 번째 Task 업데이트                                     │
│   ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                             │
│   │v1.25 │ │v1.25 │ │v1.24 │ │v1.24 │                             │
│   └──────┘ └──────┘ └──────┘ └──────┘                             │
│                                                                     │
│   Step 4: 완료                                                      │
│   ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                             │
│   │v1.25 │ │v1.25 │ │v1.25 │ │v1.25 │  ← 무중단 업데이트 완료      │
│   └──────┘ └──────┘ └──────┘ └──────┘                             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 8.2 테스트 Service 생성

```bash
kevin@hostos1:~$ docker service create \
  --name rollup-web \
  --replicas 4 \
  -p 8003:80 \
  nginx:1.24-alpine

kevin@hostos1:~$ docker service ps rollup-web
ID             NAME           IMAGE               NODE      DESIRED STATE   CURRENT STATE
abc123def456   rollup-web.1   nginx:1.24-alpine   hostos1   Running         Running 10 seconds ago
def456ghi789   rollup-web.2   nginx:1.24-alpine   hostos2   Running         Running 10 seconds ago
ghi789jkl012   rollup-web.3   nginx:1.24-alpine   hostos3   Running         Running 10 seconds ago
jkl012mno345   rollup-web.4   nginx:1.24-alpine   hostos1   Running         Running 10 seconds ago
```

### 8.3 Rolling Update 실행

```bash
kevin@hostos1:~$ docker service update --image nginx:1.25-alpine rollup-web
rollup-web
overall progress: 4 out of 4 tasks
1/4: running   [==================================================>]
2/4: running   [==================================================>]
3/4: running   [==================================================>]
4/4: running   [==================================================>]
verify: Service converged
```

### 8.4 업데이트 결과 확인

```bash
kevin@hostos1:~$ docker service ps rollup-web
ID             NAME               IMAGE               NODE      DESIRED STATE   CURRENT STATE
mno345pqr678   rollup-web.1       nginx:1.25-alpine   hostos1   Running         Running 30 seconds ago
abc123def456    \_ rollup-web.1   nginx:1.24-alpine   hostos1   Shutdown        Shutdown 35 seconds ago
pqr678stu901   rollup-web.2       nginx:1.25-alpine   hostos2   Running         Running 25 seconds ago
def456ghi789    \_ rollup-web.2   nginx:1.24-alpine   hostos2   Shutdown        Shutdown 30 seconds ago
stu901vwx234   rollup-web.3       nginx:1.25-alpine   hostos3   Running         Running 20 seconds ago
ghi789jkl012    \_ rollup-web.3   nginx:1.24-alpine   hostos3   Shutdown        Shutdown 25 seconds ago
vwx234yza567   rollup-web.4       nginx:1.25-alpine   hostos1   Running         Running 15 seconds ago
jkl012mno345    \_ rollup-web.4   nginx:1.24-alpine   hostos1   Shutdown        Shutdown 20 seconds ago
```

### 8.5 Rolling Update 옵션

| 옵션 | 설명 | 기본값 |
|------|------|--------|
| `--update-parallelism` | 동시에 업데이트할 Task 수 | 1 |
| `--update-delay` | Task 업데이트 간 대기 시간 | 0s |
| `--update-failure-action` | 실패 시 동작 (pause/continue/rollback) | pause |
| `--update-order` | 업데이트 순서 (start-first/stop-first) | stop-first |

```bash
# 세부 옵션을 지정한 업데이트
kevin@hostos1:~$ docker service update \
  --image nginx:1.25-alpine \
  --update-parallelism 2 \
  --update-delay 10s \
  --update-failure-action rollback \
  rollup-web
```

### 8.6 Rollback 실행

```bash
kevin@hostos1:~$ docker service rollback rollup-web
rollup-web
rollback: manually requested rollback
overall progress: rolling back update: 4 out of 4 tasks
1/4: running   [==================================================>]
2/4: running   [==================================================>]
3/4: running   [==================================================>]
4/4: running   [==================================================>]
verify: Service converged

kevin@hostos1:~$ docker service ps rollup-web | grep Running
yza567bcd890   rollup-web.1       nginx:1.24-alpine   hostos1   Running   Running 10 seconds ago
bcd890efg123   rollup-web.2       nginx:1.24-alpine   hostos2   Running   Running 10 seconds ago
efg123hij456   rollup-web.3       nginx:1.24-alpine   hostos3   Running   Running 10 seconds ago
hij456klm789   rollup-web.4       nginx:1.24-alpine   hostos1   Running   Running 10 seconds ago
```

---

## 9. [실습] 장애 복구와 Node Drain

> Swarm의 자동 복구 기능과 노드 유지보수 모드 실습

### 9.1 장애 복구 동작 원리

```
┌─────────────────────────────────────────────────────────────────────┐
│                      Swarm 장애 복구 과정                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   정상 상태                          장애 발생                       │
│   hostos1   hostos2   hostos3        hostos1   hostos2   hostos3   │
│   ┌─────┐   ┌─────┐   ┌─────┐        ┌─────┐   ┌─────┐   ┌─────┐  │
│   │Task1│   │Task2│   │Task3│        │Task1│   │  X  │   │Task3│  │
│   └─────┘   └─────┘   └─────┘        └─────┘   └─────┘   └─────┘  │
│                                           (hostos2 장애)            │
│                                                 │                   │
│                                                 ↓                   │
│                                      자동 재배치                     │
│                                      hostos1   hostos2   hostos3   │
│                                      ┌─────┐   ┌─────┐   ┌─────┐  │
│                                      │Task1│   │  X  │   │Task3│  │
│                                      │Task2│   │     │   │     │  │
│                                      └─────┘   └─────┘   └─────┘  │
│                                           (Task2 자동 복구)         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 9.2 컨테이너 장애 복구 테스트

**Service 생성:**

```bash
kevin@hostos1:~$ docker service create \
  --name recovery-test \
  --replicas 4 \
  -p 8004:80 \
  nginx:1.25.0-alpine

kevin@hostos1:~$ docker service ps recovery-test
ID             NAME              IMAGE                 NODE      DESIRED STATE   CURRENT STATE
abc123def456   recovery-test.1   nginx:1.25.0-alpine   hostos1   Running         Running 10 seconds ago
def456ghi789   recovery-test.2   nginx:1.25.0-alpine   hostos2   Running         Running 10 seconds ago
ghi789jkl012   recovery-test.3   nginx:1.25.0-alpine   hostos3   Running         Running 10 seconds ago
jkl012mno345   recovery-test.4   nginx:1.25.0-alpine   hostos2   Running         Running 10 seconds ago
```

**Worker 노드에서 컨테이너 강제 종료:**

```bash
kevin@hostos2:~$ docker ps
CONTAINER ID   IMAGE                 COMMAND                  CREATED          STATUS
abc123def456   nginx:1.25.0-alpine   "/docker-entrypoint.…"   30 seconds ago   Up 29 seconds

kevin@hostos2:~$ docker rm -f abc123def456
abc123def456
```

**자동 복구 확인 (Manager에서):**

```bash
kevin@hostos1:~$ docker service ps recovery-test
ID             NAME                  IMAGE                 NODE      DESIRED STATE   CURRENT STATE
mno345pqr678   recovery-test.2       nginx:1.25.0-alpine   hostos2   Running         Running 5 seconds ago
def456ghi789    \_ recovery-test.2   nginx:1.25.0-alpine   hostos2   Shutdown        Failed 10 seconds ago
...
```

### 9.3 Node Drain (유지보수 모드)

노드 유지보수가 필요할 때 해당 노드의 Task를 다른 노드로 이동시킨다.

**노드 Drain 설정:**

```bash
kevin@hostos1:~$ docker node ls
ID                            HOSTNAME   STATUS    AVAILABILITY   MANAGER STATUS
abc123def456 *                hostos1    Ready     Active         Leader
def456ghi789                  hostos2    Ready     Active
ghi789jkl012                  hostos3    Ready     Active

kevin@hostos1:~$ docker node update --availability drain hostos2
hostos2
```

**Drain 후 상태 확인:**

```bash
kevin@hostos1:~$ docker node ls
ID                            HOSTNAME   STATUS    AVAILABILITY   MANAGER STATUS
abc123def456 *                hostos1    Ready     Active         Leader
def456ghi789                  hostos2    Ready     Drain
ghi789jkl012                  hostos3    Ready     Active

kevin@hostos1:~$ docker service ps recovery-test
ID             NAME                  IMAGE                 NODE      DESIRED STATE   CURRENT STATE
pqr678stu901   recovery-test.1       nginx:1.25.0-alpine   hostos1   Running         Running 5 minutes ago
stu901vwx234   recovery-test.2       nginx:1.25.0-alpine   hostos3   Running         Running 10 seconds ago
mno345pqr678    \_ recovery-test.2   nginx:1.25.0-alpine   hostos2   Shutdown        Shutdown 15 seconds ago
vwx234yza567   recovery-test.3       nginx:1.25.0-alpine   hostos3   Running         Running 5 minutes ago
yza567bcd890   recovery-test.4       nginx:1.25.0-alpine   hostos1   Running         Running 10 seconds ago
jkl012mno345    \_ recovery-test.4   nginx:1.25.0-alpine   hostos2   Shutdown        Shutdown 15 seconds ago
```

### 9.4 Node 복구 (Active)

```bash
kevin@hostos1:~$ docker node update --availability active hostos2
hostos2

kevin@hostos1:~$ docker node ls
ID                            HOSTNAME   STATUS    AVAILABILITY   MANAGER STATUS
abc123def456 *                hostos1    Ready     Active         Leader
def456ghi789                  hostos2    Ready     Active
ghi789jkl012                  hostos3    Ready     Active
```

> **참고:** Drain에서 Active로 변경해도 기존 Task가 자동으로 돌아오지는 않는다. 새로운 Task 배치 시 해당 노드도 대상이 된다.

### 9.5 Node Availability 옵션

| 옵션 | 설명 |
|------|------|
| **active** | 새로운 Task 할당 가능 (기본값) |
| **pause** | 새로운 Task 할당 불가, 기존 Task 유지 |
| **drain** | 모든 Task를 다른 노드로 이동, 새 Task 할당 불가 |

---

## 10. Docker Stack 개념

> Compose 파일을 활용한 Swarm 서비스 배포

### 10.1 Docker Stack이란?

Docker Stack은 Docker Compose 파일을 사용하여 Swarm 클러스터에 여러 서비스를 한 번에 배포하는 기능이다.

### 10.2 docker-compose vs docker stack

| 구분 | docker-compose | docker stack |
|------|----------------|--------------|
| **실행 환경** | 단일 호스트 | Swarm 클러스터 |
| **관리 대상** | 멀티 컨테이너 | 멀티 서비스 |
| **기능** | 개발/테스트용 | 프로덕션 배포 |
| **deploy 섹션** | 무시됨 | 적용됨 |
| **build** | 지원 | 미지원 (이미지 필요) |

### 10.3 Stack 관련 명령어

| 명령어 | 설명 |
|--------|------|
| `docker stack deploy` | Stack 배포 |
| `docker stack ls` | Stack 목록 조회 |
| `docker stack ps` | Stack의 Task 목록 |
| `docker stack services` | Stack의 Service 목록 |
| `docker stack rm` | Stack 삭제 |

### 10.4 간단한 Stack 예제

**webapi-stack.yaml:**

```yaml
version: "3.8"

services:
  webAPI:
    image: nginx:1.25.1-alpine
    ports:
      - "8888:80"
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
```

**Stack 배포:**

```bash
kevin@hostos1:~$ docker stack deploy -c webapi-stack.yaml webapp
Creating network webapp_default
Creating service webapp_webAPI

kevin@hostos1:~$ docker stack ls
NAME      SERVICES   ORCHESTRATOR
webapp    1          Swarm

kevin@hostos1:~$ docker stack services webapp
ID             NAME           MODE         REPLICAS   IMAGE                 PORTS
abc123def456   webapp_webAPI  replicated   3/3        nginx:1.25.1-alpine   *:8888->80/tcp

kevin@hostos1:~$ docker stack ps webapp
ID             NAME             IMAGE                 NODE      DESIRED STATE   CURRENT STATE
def456ghi789   webapp_webAPI.1  nginx:1.25.1-alpine   hostos1   Running         Running 10 seconds ago
ghi789jkl012   webapp_webAPI.2  nginx:1.25.1-alpine   hostos2   Running         Running 10 seconds ago
jkl012mno345   webapp_webAPI.3  nginx:1.25.1-alpine   hostos3   Running         Running 10 seconds ago
```

---

## 11. [실습] HAProxy + Nginx Stack 배포

> 로드밸런서와 웹 서버를 Stack으로 배포하기

### 11.1 아키텍처

```
┌─────────────────────────────────────────────────────────────────────┐
│                    HAProxy + Nginx Stack 아키텍처                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                         ┌──────────────┐                           │
│                         │    Client    │                           │
│                         └──────┬───────┘                           │
│                                │ :80                               │
│                                ↓                                   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                      Swarm Cluster                           │   │
│  │                                                             │   │
│  │   ┌─────────────────────────────────────────────────────┐   │   │
│  │   │                  haproxy-web (overlay)               │   │   │
│  │   │                                                     │   │   │
│  │   │  ┌─────────────────────────────────────────────┐   │   │   │
│  │   │  │              HAProxy (Global)                │   │   │   │
│  │   │  │           Manager Node에만 배치              │   │   │   │
│  │   │  └────────────────────┬────────────────────────┘   │   │   │
│  │   │                       │                             │   │   │
│  │   │        ┌──────────────┼──────────────┐             │   │   │
│  │   │        ↓              ↓              ↓             │   │   │
│  │   │  ┌──────────┐   ┌──────────┐   ┌──────────┐       │   │   │
│  │   │  │  Nginx   │   │  Nginx   │   │  Nginx   │       │   │   │
│  │   │  │ (Task 1) │   │ (Task 2) │   │ (Task 3) │       │   │   │
│  │   │  └──────────┘   └──────────┘   └──────────┘       │   │   │
│  │   │     Worker         Worker         Worker          │   │   │
│  │   │                                                     │   │   │
│  │   └─────────────────────────────────────────────────────┘   │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 11.2 프로젝트 준비

```bash
kevin@hostos1:~$ mkdir -p ~/fastcampus/ch11/haproxy-stack && cd $_
kevin@hostos1:~/fastcampus/ch11/haproxy-stack$ pwd
/home/kevin/fastcampus/ch11/haproxy-stack
```

### 11.3 Overlay 네트워크 생성

```bash
kevin@hostos1:~/fastcampus/ch11/haproxy-stack$ docker network create \
  --driver overlay \
  --attachable \
  haproxy-web
pqr678stu901vwx234yza567...

kevin@hostos1:~/fastcampus/ch11/haproxy-stack$ docker network ls | grep haproxy
pqr678stu901   haproxy-web   overlay   swarm
```

### 11.4 HAProxy 설정 파일

```bash
kevin@hostos1:~/fastcampus/ch11/haproxy-stack$ vi haproxy.cfg
```

```
global
    log stdout format raw local0 info

defaults
    mode http
    timeout client 10s
    timeout connect 5s
    timeout server 10s
    timeout http-request 10s
    log global

frontend http_front
    bind *:80
    default_backend http_back

backend http_back
    balance roundrobin
    server-template nginx- 10 nginx:80 check resolvers docker init-addr libc,none

resolvers docker
    nameserver dns 127.0.0.11:53
    resolve_retries 3
    timeout resolve 1s
    timeout retry 1s
    hold other 10s
    hold refused 10s
    hold nx 10s
    hold timeout 10s
    hold valid 10s
    hold obsolete 10s
```

### 11.5 Stack 파일 작성

```bash
kevin@hostos1:~/fastcampus/ch11/haproxy-stack$ vi haproxy-web-stack.yaml
```

```yaml
version: '3.8'

services:
  nginx:
    image: nginx:1.25.0-alpine
    deploy:
      replicas: 4
      placement:
        constraints:
          - node.role != manager
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
    networks:
      - haproxy-web

  proxy:
    image: haproxy:2.8-alpine
    ports:
      - "80:80"
      - "8404:8404"
    configs:
      - source: haproxy_config
        target: /usr/local/etc/haproxy/haproxy.cfg
    deploy:
      mode: global
      placement:
        constraints:
          - node.role == manager
      restart_policy:
        condition: on-failure
    networks:
      - haproxy-web

networks:
  haproxy-web:
    external: true

configs:
  haproxy_config:
    file: ./haproxy.cfg
```

### 11.6 Stack 배포

```bash
kevin@hostos1:~/fastcampus/ch11/haproxy-stack$ docker stack deploy -c haproxy-web-stack.yaml haproxy-web
Creating config haproxy-web_haproxy_config
Creating service haproxy-web_nginx
Creating service haproxy-web_proxy
```

### 11.7 배포 상태 확인

```bash
kevin@hostos1:~/fastcampus/ch11/haproxy-stack$ docker stack ls
NAME          SERVICES   ORCHESTRATOR
haproxy-web   2          Swarm

kevin@hostos1:~/fastcampus/ch11/haproxy-stack$ docker stack services haproxy-web
ID             NAME                MODE         REPLICAS   IMAGE                PORTS
abc123def456   haproxy-web_nginx   replicated   4/4        nginx:1.25.0-alpine
def456ghi789   haproxy-web_proxy   global       1/1        haproxy:2.8-alpine   *:80->80/tcp, *:8404->8404/tcp

kevin@hostos1:~/fastcampus/ch11/haproxy-stack$ docker stack ps haproxy-web
ID             NAME                                        IMAGE                NODE      DESIRED STATE   CURRENT STATE
ghi789jkl012   haproxy-web_proxy.abc123def456             haproxy:2.8-alpine   hostos1   Running         Running 30 seconds ago
jkl012mno345   haproxy-web_nginx.1                        nginx:1.25.0-alpine  hostos2   Running         Running 30 seconds ago
mno345pqr678   haproxy-web_nginx.2                        nginx:1.25.0-alpine  hostos3   Running         Running 30 seconds ago
pqr678stu901   haproxy-web_nginx.3                        nginx:1.25.0-alpine  hostos2   Running         Running 30 seconds ago
stu901vwx234   haproxy-web_nginx.4                        nginx:1.25.0-alpine  hostos3   Running         Running 30 seconds ago
```

### 11.8 로드밸런싱 테스트

```bash
kevin@hostos1:~/fastcampus/ch11/haproxy-stack$ for i in {1..6}; do curl -s localhost | grep -o "Welcome to nginx"; done
Welcome to nginx
Welcome to nginx
Welcome to nginx
Welcome to nginx
Welcome to nginx
Welcome to nginx
```

### 11.9 Stack 삭제

```bash
kevin@hostos1:~/fastcampus/ch11/haproxy-stack$ docker stack rm haproxy-web
Removing service haproxy-web_nginx
Removing service haproxy-web_proxy
Removing config haproxy-web_haproxy_config
```

---

## 12. [실습] Node Label 기반 배치

> Node Label을 활용한 서비스 배치 제어

### 12.1 Node Label 개념

Node Label을 사용하면 특정 노드에만 서비스를 배치할 수 있다.

```
┌─────────────────────────────────────────────────────────────────────┐
│                      Node Label 기반 배치                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   hostos1              hostos2              hostos3                 │
│   (Manager)            (Worker)             (Worker)                │
│                                                                     │
│   Labels:              Labels:              Labels:                 │
│   - role=manager       - zone=fastzone1     - zone=fastzone2       │
│                        - tier=frontend      - tier=backend         │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │  constraint: node.labels.zone == fastzone1                  │  │
│   │  → hostos2에만 배치                                          │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │  constraint: node.labels.tier == backend                    │  │
│   │  → hostos3에만 배치                                          │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 12.2 Node Label 추가

```bash
kevin@hostos1:~$ docker node update --label-add zone=fastzone1 hostos2
hostos2

kevin@hostos1:~$ docker node update --label-add zone=fastzone2 hostos3
hostos3

kevin@hostos1:~$ docker node update --label-add tier=frontend hostos2
hostos2

kevin@hostos1:~$ docker node update --label-add tier=backend hostos3
hostos3
```

### 12.3 Label 확인

```bash
kevin@hostos1:~$ docker node inspect hostos2 --format '{{ .Spec.Labels }}'
map[tier:frontend zone:fastzone1]

kevin@hostos1:~$ docker node inspect hostos3 --format '{{ .Spec.Labels }}'
map[tier:backend zone:fastzone2]
```

### 12.4 Label 기반 배치 Stack

```bash
kevin@hostos1:~$ mkdir -p ~/fastcampus/ch11/label-stack && cd $_
kevin@hostos1:~/fastcampus/ch11/label-stack$ vi label-stack.yaml
```

```yaml
version: '3.8'

services:
  frontend:
    image: nginx:1.25.0-alpine
    deploy:
      replicas: 2
      placement:
        constraints:
          - node.labels.tier == frontend
    ports:
      - "8080:80"

  backend:
    image: nginx:1.25.0-alpine
    deploy:
      replicas: 2
      placement:
        constraints:
          - node.labels.tier == backend
    ports:
      - "8081:80"

  zone1-service:
    image: nginx:1.25.0-alpine
    deploy:
      replicas: 2
      placement:
        constraints:
          - node.labels.zone == fastzone1
    ports:
      - "8082:80"
```

### 12.5 Stack 배포 및 확인

```bash
kevin@hostos1:~/fastcampus/ch11/label-stack$ docker stack deploy -c label-stack.yaml label-test
Creating network label-test_default
Creating service label-test_frontend
Creating service label-test_backend
Creating service label-test_zone1-service

kevin@hostos1:~/fastcampus/ch11/label-stack$ docker stack ps label-test
ID             NAME                       IMAGE                 NODE      DESIRED STATE   CURRENT STATE
abc123def456   label-test_frontend.1      nginx:1.25.0-alpine   hostos2   Running         Running 10 seconds ago
def456ghi789   label-test_frontend.2      nginx:1.25.0-alpine   hostos2   Running         Running 10 seconds ago
ghi789jkl012   label-test_backend.1       nginx:1.25.0-alpine   hostos3   Running         Running 10 seconds ago
jkl012mno345   label-test_backend.2       nginx:1.25.0-alpine   hostos3   Running         Running 10 seconds ago
mno345pqr678   label-test_zone1-service.1 nginx:1.25.0-alpine   hostos2   Running         Running 10 seconds ago
pqr678stu901   label-test_zone1-service.2 nginx:1.25.0-alpine   hostos2   Running         Running 10 seconds ago
```

### 12.6 Label 삭제

```bash
kevin@hostos1:~$ docker node update --label-rm zone hostos2
hostos2

kevin@hostos1:~$ docker node update --label-rm tier hostos2
hostos2
```

### 12.7 Stack 정리

```bash
kevin@hostos1:~/fastcampus/ch11/label-stack$ docker stack rm label-test
```

---

## 요약

### 핵심 개념

1. **Docker Swarm**
   - Docker 기본 오케스트레이션 도구
   - 클러스터 구성, 자동 배포, 복구 기능 제공
   - Manager Node + Worker Node 구조

2. **Service / Task / Stack**
   - Service: 배포 단위, 원하는 상태 정의
   - Task: Service의 최소 실행 단위 (컨테이너 1개)
   - Stack: 여러 Service를 묶은 애플리케이션 단위

3. **배포 모드**
   - Replicated: 지정 수만큼 Task 생성
   - Global: 모든 노드에 1개씩 Task 생성

4. **주요 기능**
   - Rolling Update: 무중단 서비스 업데이트
   - Rollback: 이전 버전으로 복구
   - Node Drain: 유지보수 모드
   - Label 기반 배치: 특정 노드에 배치 제어

### 주요 명령어 정리

```bash
# Swarm 관리
docker swarm init --advertise-addr <IP>
docker swarm join --token <token> <manager-ip>:2377
docker swarm leave [--force]

# Node 관리
docker node ls
docker node inspect <node>
docker node update --availability drain/active <node>
docker node update --label-add <key>=<value> <node>

# Service 관리
docker service create --name <name> --replicas <n> <image>
docker service ls
docker service ps <service>
docker service scale <service>=<n>
docker service update --image <new-image> <service>
docker service rollback <service>
docker service rm <service>

# Stack 관리
docker stack deploy -c <yaml> <stack-name>
docker stack ls
docker stack services <stack>
docker stack ps <stack>
docker stack rm <stack>

# 네트워크
docker network create --driver overlay <name>
```

---

## 체크리스트 (통과 필수)

- [ ] Docker Swarm의 개념과 구조를 설명할 수 있다
- [ ] Manager Node와 Worker Node의 역할을 이해한다
- [ ] Swarm 클러스터를 초기화하고 노드를 추가할 수 있다
- [ ] Service를 생성하고 스케일링할 수 있다
- [ ] Replicated와 Global 모드의 차이를 설명할 수 있다
- [ ] Rolling Update와 Rollback을 수행할 수 있다
- [ ] Node Drain을 사용하여 유지보수 모드로 전환할 수 있다
- [ ] Docker Stack을 사용하여 여러 서비스를 배포할 수 있다
- [ ] Overlay 네트워크를 생성하고 활용할 수 있다
- [ ] Node Label을 사용하여 서비스 배치를 제어할 수 있다

---

## 다음 챕터 예고

### Chapter 12. Container CI/CD

다음 장에서는:

- CI/CD 파이프라인 개념
- Jenkins를 활용한 Docker 빌드 자동화
- GitHub Actions와 Docker Hub 연동
- GitOps 워크플로우

를 **실습 중심**으로 다룹니다.
