# Chapter 07. 컨테이너 자원관리

---

## 1. 이 챕터의 목표

이 챕터를 마치면 다음을 **실제로 할 수 있어야 합니다.**

- cAdvisor를 활용한 컨테이너 리소스 모니터링
- CPU 자원 소비 제어 (--cpu-shares, --cpuset-cpus, --cpus)
- Memory 자원 소비 제어 (--memory, --memory-swap)
- Disk I/O 자원 소비 제어 (--device-read-bps, --device-write-bps, --device-read-iops, --device-write-iops)
- docker update를 통한 실행 중인 컨테이너 자원 조정

> ❗ 이 챕터는
> **컨테이너 운영의 안정성과 효율성**을 확보하기 위한 필수 기술이다.

---

## 2. 컨테이너 리소스 모니터링 개요

### 2.1 Monitoring이란?

- 모니터링은 시간의 흐름에 따른 시스템 및 여러 구성 요소의 동작과 출력 등을 관찰하고 확인하는 작업을 통해 자원의 효율적인 사용을 식별, 평가한다.
- 모니터링 전략을 세우려면 **무엇을, 왜, 어떻게** 모니터링해야 하는지 우선 고려해야 한다.
- 모니터링은 활용률 및 처리량 같은 **Metric(지표)**에 중점을 두고 시스템 전반의 성능을 알 수 있다.
  - 예로, 메모리 사용량 급증, 캐시 적중률 감소, CPU 사용량 증가 등을 관찰한다.

### 2.2 Observability (관찰 가능성)

- 다만, 모니터링은 애플리케이션 중심의 MSA 같은 복잡한 아키텍처를 진단하기에 어려움이 있다.
- 몇 가지 Metric 간의 상관 관계는 애플리케이션 장애 진단에 충분한 정보를 제공하지 못하기 때문에 복잡한 MSA 환경의 애플리케이션에 대한 가시성 있는 관찰을 위해서는 **Observability** 도구가 요구 된다.

**Observability의 4가지 요소:**

| 요소 | 설명 |
|---|---|
| Monitoring | 인프라 로그 메트릭을 검사하여 작업 및 인사이트를 수행 |
| Logging | 특정 시간에 발생한 이벤트 기록 |
| Tracing | 원인 관련 이벤트의 요청 흐름을 캡처하는 데 사용 |
| Visualization | 이 모든 정보를 차트 등의 시각적 효과를 통해 제시하여 빠른 인사이트 제공 |

---

## 3. 컨테이너 리소스 Metric 수집, cAdvisor

### 3.1 cAdvisor 소개

cAdvisor (Container Advisor)는 **Google에서 제공하고 관리하는 "오픈 소스 컨테이너 모니터링 도구"**이다.

특징:
- Docker 컨테이너와 다른 컨테이너 플랫폼에도 기본적으로 지원 가능
- cAdvisor는 Docker HostOS에서 실행 중인 컨테이너에 대한 정보를 수집하고 해당 데이터를 처리한 후 내보내는 **"단일 컨테이너 데몬"**으로 구성
- cAdvisor는 이전 리소스 사용량, 리소스 격리 매개 변수 및 각 컨테이너 머신 전체에 대한 네트워크 통계 등을 기록한다.

---

### 3.2 cAdvisor가 수집하는 정보

- 각 컨테이너는 독립적인 개별 환경이고, 이를 모니터링하여 각 애플리케이션의 정보를 수집하여 현재의 성능과 개선점을 진단할 수 있다.
- cAdvisor는 컨테이너에 포함된 애플리케이션 Metric을 수집하여 활성 및 읽기 연결 수, 애플리케이션에 적절한 CPU 및 메모리 할당이 있는지를 알 수 있다.
- 이 정보(metric data)는 **"전용 웹 인터페이스"** 또는 Google Big Query, ElasticSearch, Kafka, Prometheus, Redis 와 같은 다른 수집 데이터 분석 가능 도구와 연동할 수 있다.

공식: https://github.com/google/cadvisor#quick-start-running-cadvisor-in-a-docker-container

---

### 3.3 cAdvisor와 연동 가능한 Observability tool

**Prometheus + Grafana** 조합이 대표적이다:

| 도구 | 설명 |
|---|---|
| Prometheus | Kubernetes 지표 형식의 오픈 소스 도구 |
| PromQL | Prometheus 쿼리 언어 |
| Grafana | 시각화 대시보드 도구 |

---

## 4. 실습 1 - cAdvisor 컨테이너 실행

### 4.1 cAdvisor 컨테이너 생성

```bash
# cadvisor 컨테이너 생성 (Google에서 제공하고 관리하는 오픈 소스 컨테이너 모니터링 도구)
docker run \
  --restart=always \
  --volume=/:/rootfs:ro \
  --volume=/var/run:/var/run:rw \
  --volume=/sys/fs/cgroup:/sys/fs/cgroup:ro \
  --volume=/var/lib/docker/:/var/lib/docker:ro \
  --volume=/dev/disk/:/dev/disk:ro \
  --publish=9559:8080 \
  --detach=true \
  --name=cadvisor \
  --privileged \
  --device=/dev/kmsg \
  gcr.io/cadvisor/cadvisor:latest
```

### 4.2 컨테이너 상태 확인

```bash
docker ps -a
```

출력:

```text
CONTAINER ID   IMAGE                              COMMAND                  CREATED        STATUS
PORTS                                       NAMES
0c8ced5f9d21   gcr.io/cadvisor/cadvisor:latest   "/usr/bin/cadvisor -…"   3 seconds ago  Up 1 second (health: starting → healthy)
0.0.0.0:9559->8080/tcp, :::9559->8080/tcp   cadvisor
```

---

### 4.3 샘플 컨테이너 생성하여 모니터링 테스트

```bash
# 샘플 컨테이너를 생성하여 cadvisor에서 실시간 스트림 출력을 확인해 본다.
docker run -d --name=mywebserver -p 8001:80 nginx:1.25.0-alpine

docker ps -a
```

출력:

```text
CONTAINER ID   IMAGE                 COMMAND                  CREATED         STATUS
PORTS                                   NAMES
21907685c394   nginx:1.25.0-alpine   "/docker-entrypoint.…"   5 seconds ago   Up 4 seconds
0.0.0.0:8001->80/tcp, :::8001->80/tcp   mywebserver
```

### 4.4 웹 브라우저에서 cAdvisor 접속

```bash
curl localhost:8001
```

웹 브라우저에서 `http://<호스트IP>:9559/containers/` 접속하면:
- Docker Containers 링크에서 현재 실행 중인 컨테이너 목록 확인
- 각 컨테이너의 CPU, Memory, Network, Disk I/O 등의 실시간 Metric 확인 가능
- 이 스트림은 표준 Metric(지표)를 출력한다

---

## 5. 컨테이너 리소스에 대한 런타임 제한 (Resource Limit)

### 5.1 리소스 제한의 필요성

- `docker run`(or create)을 통해 컨테이너 생성 시 주요 자원(CPU, Memory, Disk)에 대한 자원 할당 조정이 가능하다.
- 이러한 옵션을 사용하지 않는 경우 Docker HostOS의 자원이 제한 없이(unlimited) 사용 된다.
- 따라서, 자원 소비 제한을 하지 않으면 상대적으로 다른 컨테이너의 자원 사용에 제한을 주어 전반적인 성능에 영향을 줄 수 있다.
- 사용중인 컨테이너에 과도한 `docker update`를 통해 소비 제한을 할 수 있다.

---

### 5.2 htop - 리소스 측정 도구

htop은 각 코어수를 확인해서 각 프로세스 정보를 좀더 자세히 보여주는 실시간 모니터링 도구다.

```bash
# 자원 소비 측정을 위한 htop 도구를 설치한다.
sudo apt -y install htop
htop
```

**htop 단축키:**

| 키 | 기능 | 설명 |
|---|---|---|
| F1 | Help | 단축키 기능 확인 |
| F2 | Setup | htop 설정메뉴 |
| F3 | Search | 프로세스 검색 |
| F4 | Filter | 프로세스 필터링 (ps -ef \| grep [프로세스] 랑 같은 의미) -> 필터링할 키워드 입력 |
| F5 | Tree | 부모-자식 관계 보여줌 -> 트리관계로 변화 |
| F6 | Sort | 정렬 -> sort by 기준 선택 |
| F7 | Nice (+) | 우선순위 올림 |
| F8 | Nice (-) | 우선순위 내림 |
| F9 | Kill | 프로세스 종료 (kill -9 [pid] 랑 같은 의미) |
| F10 | Quit | htop 종료 |

---

## 6. CPU 자원 소비 제어

### 6.1 CPU 리소스 제한 개념

- CPU 자원을 어떤 프로세스(컨테이너)에 얼마나 할당하는지를 정책으로 만드는 것을 **CPU 스케줄링**이라고 한다.
- CPU 사용량 제한을 위해 **CFS(Completely Fair Scheduler)** 스케줄러를 사용한다.
  말 그대로 모든 프로세스가 공평하게 CPU 사용 시간을 제공 받도록 하는 OS 알고리즘이다.

### 6.2 CPU 제한 옵션

| 옵션 | 설명 |
|---|---|
| `--cpu-shares` | 컨테이너가 사용할 수 있는 CPU 사용 시간에 대한 **가중치**를 설정. 기본값 1024. 2048 설정 시 다른 컨테이너에 비해 2배의 사용 시간 할당. |
| `--cpuset-cpus` | 보유한 CPU core#를 지정하여 컨테이너가 해당 core만 사용하도록 설정한다. 예로, 0 / 1-2 / 0,2,3 으로 지정 가능 |
| `--cpus` | 컨테이너가 사용할 수 있는 CPU 사용 **비율(%)** 지정. 예로, --cpus=0.25 설정 시 지정된 core 수의 25% 사용 가능 |

---

## 7. 실습 2 - CPU time scheduling, --cpu-shares

### 7.1 stress 이미지를 이용한 CPU 부하 테스트

```bash
# container CPU 부하 테스트 (leecloudo/stress:1.0 는 미리 만들어 둔 stress image)
docker run -d --name cpu_1024 --cpu-shares 1024 leecloudo/stress:1.0 stress --cpu 4
docker run -d --name cpu_512 --cpu-shares 512 leecloudo/stress:1.0 stress --cpu 4
```

### 7.2 프로세스 확인

```bash
ps -auxf | grep stress
```

출력:

```text
root    29863  0.4 0.0  7480  952 ?  Ss  13:24  0:00  | \_ stress --cpu 4
root    29903 70.4 0.0  7480   96 ?  R   13:24  0:38  |     \_ stress --cpu 4
root    29904 70.0 0.0  7480   96 ?  R   13:24  0:38  |     \_ stress --cpu 4
root    29905 70.4 0.0  7480   96 ?  R   13:24  0:38  |     \_ stress --cpu 4
root    29906 70.7 0.0  7480   96 ?  R   13:24  0:38  |     \_ stress --cpu 4
root    29967  0.5 0.0  7480  816 ?  Ss  13:24  0:00  \_ stress --cpu 4
root    30002 33.2 0.0  7480   92 ?  R   13:24  0:16      \_ stress --cpu 4
root    30003 33.2 0.0  7480   92 ?  R   13:24  0:16      \_ stress --cpu 4
root    30004 33.3 0.0  7480   92 ?  R   13:24  0:16      \_ stress --cpu 4
root    30005 32.9 0.0  7480   92 ?  R   13:24  0:16      \_ stress --cpu 4
```

👉 cpu_1024 컨테이너가 cpu_512 컨테이너에 비해 약 2배의 CPU 시간을 사용한다.

### 7.3 htop으로 확인

htop을 실행하면 4개의 CPU 코어 모두 100% 사용량을 확인할 수 있다.

### 7.4 cAdvisor에서 확인

cAdvisor 웹 UI에서 cpu_1024 컨테이너를 선택하면:
- Isolation 섹션에서 **Shares 1024 shares**, **Allowed Cores 0 1 2 3** 확인 가능
- Usage per Core 그래프에서 각 코어별 사용량 확인

### 7.5 컨테이너 정지

```bash
docker stop cpu_512 cpu_1024
```

정지 후 htop에서 CPU 사용량이 정상으로 돌아오는 것 확인

---

## 8. 실습 3 - CPU 지정, --cpuset-cpus

### 8.1 특정 CPU 코어 지정

```bash
# Host가 보유한 CPU 수에서 몇 번째를 사용하도록 할 것인지 지정
# --cpuset-cpus="0,3" → 1, 4번째 CPU 사용
# --cpuset-cpus="0-2" → 1,2,3번째 CPU 사용

docker run -d --name cpuset_1 --cpuset-cpus=2 leecloudo/stress:1.0 stress --cpu 1
```

htop에서 확인하면 **3번째 CPU(인덱스 2)만 100%** 사용되는 것을 확인할 수 있다.

### 8.2 여러 CPU 코어 지정

```bash
docker run -d --name cpuset_2 --cpuset-cpus=0,3 leecloudo/stress:1.0 stress --cpu 2
```

htop에서 확인하면 **1번째(인덱스 0)와 4번째(인덱스 3) CPU가 100%** 사용되는 것을 확인할 수 있다.

---

## 9. 실습 4 - CPU 사용 비율 지정, --cpus

### 9.1 docker update로 CPU 사용량 제한

```bash
docker run -d --name cpuset_1 --cpuset-cpus=2 leecloudo/stress:1.0 stress --cpu 1
```

기본 상태에서는 지정된 CPU 코어가 100% 사용된다.

```bash
# 기존에 실행 중인 컨테이너의 자원을 조정하고자 한다면 docker update 이용
# 특정 container의 CPU 사용량을 20%로 제한하고자 한다면?
docker update --cpus=0.2 cpuset_1
```

htop에서 확인하면 해당 CPU 코어가 약 **20%** 정도만 사용되는 것을 확인할 수 있다.

### 9.2 여러 CPU에 대한 비율 제한

```bash
docker run -d --name cpuset_2 --cpuset-cpus=0,3 leecloudo/stress:1.0 stress --cpu 2

# 특정 container의 CPU 사용량을 20%로 제한하고자 한다면?
# 여러 개의 CPU 사용 비율 조정인 경우는 각각이 아닌 모든 CPU에 대한 합산 비율이다.
docker update --cpus=0.2 cpuset_2
```

👉 0,3번 CPU 합산 사용량이 20%로 제한된다.

### 9.3 cAdvisor에서 변화 확인

cAdvisor의 Usage per Core 그래프에서:
1. 컨테이너 실행 시 해당 코어들이 100% 사용
2. docker update 적용 후 사용량이 크게 감소하는 것을 시각적으로 확인

---

## 10. Memory 자원 소비 제어

### 10.1 Memory 리소스 제한 개념

- 메모리는 프로세스들의 작업 공간이다. Docker HostOS의 총 메모리 양과 작업에 사용될 예상되는 메모리 크기를 사전에 파악하여 메모리 최적화를 유지해야 한다.
- 만일 특정 컨테이너가 과도한 메모리 사용 시 메모리 부족(**OOM, out of memory**)으로 인해 프로세스, 즉 다른 컨테이너의 예기치 않은 강제 종료가 발생할 수 있다.
  - OOM Killer가 프로세스를 kill하지 못하도록 보호: `--oom-kill-disable`
- 특히 컨테이너들의 과도한 메모리 사용으로 인해 Docker Daemon이 커널에 의해 강제 종료되면 전체 컨테이너 서비스들에 영향을 주게 된다.

[참고] https://docs.docker.com/config/containers/resource_constraints/

---

### 10.2 Memory 제한 옵션

| 옵션 | 설명 |
|---|---|
| `--memory (-m)` | **(hard limit)** 컨테이너가 사용하는 최대 메모리 사용량 제한. 설정 값을 초과해서 사용하면 OOM 발생. **최소 6MB**. |
| `--memory-reservation` | **(soft limit)** Docker가 contention을 감지하거나 HostOS의 메모리 가용율이 현저히 떨어지는 경우 활성화되어 최소한의 보장 값으로 사용. 예: `-m=1g --memory-reservation=500m` (최대 1g 사용 가능하고, 적어도 500m 사용 보장) |
| `--memory-swap` | 컨테이너가 사용할 수 있는 swap memory 사용량 제한 (-1은 무제한). `-m=300m` 설정 시 자동으로 `--memory-swap=600m` 설정됨. 이는 전체 600m에서 -m 값을 뺀 나머지만큼 swap이 사용된다는 의미. |

---

## 11. 실습 5 - Memory hard limit, --memory(-m)

### 11.1 물리적 메모리 제한 설정

```bash
# 컨테이너에 물리적 메모리 크기를 제한한다.
docker run -d --memory=1g --name=nginx_mem_1g nginx

docker inspect nginx_mem_1g | grep -i memory
```

출력:

```text
"Memory": 1073741824,
"MemoryReservation": 0,
"MemorySwap": 2147483648,
"MemorySwappiness": null,
```

👉 Memory: 1GB, MemorySwap: 2GB (memory의 2배로 자동 설정)

### 11.2 cAdvisor에서 확인

cAdvisor 웹 UI에서 nginx_mem_1g 컨테이너 선택 시:
- Memory 섹션에서 **Reservation unlimited**, **Limit 1.00 GB**, **Swap Limit 2.00 GB** 확인

---

## 12. 실습 6 - Swap memory limit, --memory-swap

### 12.1 물리 메모리와 Swap 메모리 함께 제한

```bash
# 컨테이너에 물리적 메모리 크기를 제한한다.
docker run -m=200m --memory-swap=300m -itd --name=mem-test ubuntu:14.04

docker inspect mem-test | grep -i memory
```

출력:

```text
"Memory": 209715200,
"MemoryReservation": 0,
"MemorySwap": 314572800,
"MemorySwappiness": null,
```

👉 Memory: 200MB, MemorySwap: 300MB (실제 swap 사용량은 300-200=100MB)

### 12.2 cAdvisor에서 확인

- **Limit 200.00 MB**, **Swap Limit 300.00 MB** 확인

---

## 13. 실습 7 - docker update로 메모리 조정

### 13.1 메모리 부족으로 실패하는 컨테이너

```bash
docker run -itd --memory=6m --name=mydb -e MYSQL_ROOT_PASSWORD=pass123# mysql:5.7-debian

docker ps -a | grep mydb
```

출력:

```text
1e21c9132a28   mysql:5.7-debian   "docker-entrypoint.s…"   8 seconds ago   Exited (1) 7 seconds ago   mydb
```

👉 MySQL은 최소 6MB로는 실행 불가

### 13.2 로그 확인

```bash
docker logs mydb
```

출력:

```text
2023-06-14 11:27:27+00:00 [Note] [Entrypoint]: Entrypoint script for MySQL Server 5.7.42-1debian10 started.
2023-06-14 11:27:28+00:00 [ERROR] [Entrypoint]: mysqld failed while attempting to check config
        command was: mysqld --verbose --help --log-bin-index=/tmp/tmp.KescTycSGH
```

### 13.3 docker update로 메모리 증가

```bash
docker update --memory=300m --memory-swap=600m mydb
```

### 13.4 컨테이너 재시작

```bash
docker start mydb

docker ps -a | grep mydb
```

출력:

```text
8808a2d0820e   mysql:5.7-debian   "docker-entrypoint.s…"   About a minute ago   Up 2 seconds   3306/tcp, 33060/tcp   mydb
```

### 13.5 변경된 메모리 설정 확인

```bash
docker inspect mydb | grep -i memory
```

출력:

```text
"Memory": 314572800,
"MemoryReservation": 0,
"MemorySwap": 629145600,
"MemorySwappiness": null,
```

---

## 14. 실습 8 - Memory 과부하 테스트

### 14.1 메모리와 Swap 동일하게 설정 (Swap 비활성화)

```bash
# memory와 memory-swap을 동일하게 설정하면 swap을 사용하지 않음
docker run -it --rm --memory=200m --memory-swap=200m leecloudo/stress:1.0 stress --vm 1 --vm-bytes 250m -t 10s
```

출력:

```text
stress: info: [1] dispatching hogs: 0 cpu, 0 io, 1 vm, 0 hdd
stress: FAIL: [1] (415) <-- worker 7 got signal 9
stress: WARN: [1] (417) now reaping child worker processes
stress: FAIL: [1] (421) kill error: No such process
stress: FAIL: [1] (451) failed run completed in 0s
```

👉 200m 물리 메모리만 있는 상태에서 250m 사용 시도 → **실패 (OOM Kill)**

### 14.2 물리 메모리 범위 내 테스트

```bash
docker run -it --rm --memory=200m --memory-swap=200m leecloudo/stress:1.0 stress --vm 1 --vm-bytes 150m -t 10s
```

출력:

```text
stress: info: [1] dispatching hogs: 0 cpu, 0 io, 1 vm, 0 hdd
stress: info: [1] successful run completed in 10s
```

👉 150m은 200m 범위 내이므로 **성공**

### 14.3 Swap 활성화 상태에서 테스트

```bash
# --memory-swap을 지정하지 않으면 memory의 2배로 자동 설정
docker run -it --rm --memory=200m leecloudo/stress:1.0 stress --vm 1 --vm-bytes 150m -t 10s
# 성공

docker run -it --rm --memory=200m leecloudo/stress:1.0 stress --vm 1 --vm-bytes 250m -t 10s
# 성공 (swap 사용)

docker run -it --rm --memory=200m leecloudo/stress:1.0 stress --vm 1 --vm-bytes 300m -t 10s
# 성공 (swap 사용)

docker run -it --rm --memory=200m leecloudo/stress:1.0 stress --vm 1 --vm-bytes 400m -t 10s
# 실패 (400m > 200m memory + 200m swap = 400m 한계 초과)
```

👉 memory=200m일 때 memory-swap=400m이 자동 설정되어, 총 400m까지 사용 가능

---

## 15. Disk 자원 소비 제어

### 15.1 Disk 리소스 제한 개념

- Docker image는 기본적으로 Docker Host의 공간을 사용하므로 지속적인 사용량 관찰이 요구된다.
- 컨테이너 I/O 제한을 설정하지 않으면 컨테이너 내부 I/O bandwidth(대역폭)에 제한이 설정되지 않기 때문에 옵션을 통해 **Block I/O 제한**이 필요하다.
- 단, **Direct I/O의 경우에만** Block I/O가 제한되며, Buffered I/O는 해당되지 않는다.

---

### 15.2 Disk I/O 제한 옵션

| 옵션 | 설명 |
|---|---|
| `--blkio-weight` / `--blkio-weight-device` | Block I/O의 할당량(Quota)을 10~1000으로 설정. 기본값 500 |
| `--device-read-bps` / `--device-write-bps` | 특정 Device에 **MBPS**를 제한한다. 초당 Block throughput (처리량)을 의미. b, kb, mb, gb 단위로 제한 |
| `--device-read-iops` / `--device-write-iops` | 특정 Device에 **IOPS**를 제한한다. 초당 Block I/O 횟수를 의미. 0 이상의 정수로 표기. |

---

### 15.3 Disk I/O 측정 도구, iostat

```bash
sudo apt install sysstat
iostat 2 1000
```

출력 예시:

```text
avg-cpu:  %user   %nice %system %iowait  %steal   %idle
           0.51    0.00    0.25   24.75    0.00   74.49

Device            tps    kB_read/s    kB_wrtn/s    kB_dscd/s    kB_read    kB_wrtn    kB_dscd
sda              0.00         0.00         0.00         0.00          0          0          0
sdb              1.00         0.00      1024.00         0.00          0       1024          0
```

---

## 16. 실습 9 - MBPS (Mega Byte per second), 초당 처리량

### 16.1 제한 없이 테스트

```bash
docker run -it --rm ubuntu:14.04 bash
root@ed37bddb71c8:/# dd if=/dev/zero of=blkmb.out bs=1M count=10 oflag=direct
```

출력:

```text
10+0 records in
10+0 records out
10485760 bytes (10 MB) copied, 0.0128923 s, 813 MB/s
```

👉 제한 없이 **813 MB/s**의 속도

### 16.2 1MB/s로 제한

```bash
# Docker가 설치된 Disk device로 테스트 (예: /dev/sdb)
docker run -it --rm --device-write-bps /dev/sdb:1mb ubuntu:14.04 bash
root@ed346382ffe7:/# dd if=/dev/zero of=blkmb.out bs=1M count=10 oflag=direct
```

출력:

```text
10+0 records in
10+0 records out
10485760 bytes (10 MB) copied, 10.0274 s, 1.0 MB/s
```

👉 **1.0 MB/s**로 제한됨 (10MB 쓰는데 10초 소요)

### 16.3 10MB/s로 제한

```bash
docker run -it --rm --device-write-bps /dev/sdb:10mb ubuntu:14.04 bash
root@2a8b1c431c73:/# dd if=/dev/zero of=blkmb.out bs=1M count=10 oflag=direct
```

출력:

```text
10+0 records in
10+0 records out
10485760 bytes (10 MB) copied, 1.01432 s, 10.3 MB/s
```

👉 **10.3 MB/s**로 제한됨

---

## 17. 실습 10 - IOPS (IO per second), 초당 I/O 횟수

### 17.1 제한 없이 테스트

```bash
docker run -it --rm ubuntu:14.04 bash
root@c0ae1a27580b:/# dd if=/dev/zero of=blkio.out bs=1M count=10 oflag=direct
```

출력:

```text
10+0 records in
10+0 records out
10485760 bytes (10 MB) copied, 0.0102204 s, 1.0 GB/s
```

### 17.2 10 IOPS로 제한

```bash
docker run -it --rm --device-write-iops /dev/sdb:10 ubuntu:14.04 bash
root@0f19255ec1a2:/# dd if=/dev/zero of=blkio.out bs=1M count=10 oflag=direct
```

출력:

```text
10+0 records in
10+0 records out
10485760 bytes (10 MB) copied, 1.90632 s, 5.5 MB/s
```

👉 초당 데이터 전송량 = IOPS * 블럭크기(단위 데이터 용량)
   10 IOPS * 1MB = 약 10 MB/s 이론값, 실제 약 **5.5 MB/s**

### 17.3 1 IOPS로 제한

```bash
docker run -it --rm --device-write-iops /dev/sdb:1 ubuntu:14.04 bash
root@e72f0c39b5c3:/# dd if=/dev/zero of=blkio.out bs=1M count=10 oflag=direct
```

출력:

```text
10+0 records in
10+0 records out
10485760 bytes (10 MB) copied, 37.0094 s, 283 kB/s
```

👉 1 IOPS * 1MB = 약 1 MB/s 이론값, 실제 약 **283 kB/s** (오버헤드로 인해 더 낮음)

---

## 18. 반드시 이해해야 할 핵심 요약

* **cAdvisor**: Google 제공 오픈소스 컨테이너 모니터링 도구
* **Observability**: Monitoring, Logging, Tracing, Visualization의 조합
* **CPU 제한 옵션**:
  - `--cpu-shares`: CPU 시간 가중치 (기본 1024)
  - `--cpuset-cpus`: 특정 CPU 코어 지정
  - `--cpus`: CPU 사용 비율 제한
* **Memory 제한 옵션**:
  - `--memory (-m)`: 최대 메모리 hard limit
  - `--memory-swap`: swap 포함 총 메모리 제한
  - `--memory-reservation`: soft limit (최소 보장)
* **Disk I/O 제한 옵션**:
  - `--device-read/write-bps`: 초당 처리량(MBPS) 제한
  - `--device-read/write-iops`: 초당 I/O 횟수(IOPS) 제한
* **docker update**: 실행 중인 컨테이너의 자원 제한 동적 변경
* 자원 제한을 하지 않으면 다른 컨테이너에 영향을 줄 수 있음
* OOM(Out of Memory) 발생 시 컨테이너가 강제 종료될 수 있음

---

## 19. 체크리스트 (통과 필수)

* [ ] cAdvisor를 설치하고 웹 UI에서 컨테이너 메트릭을 확인할 수 있다
* [ ] --cpu-shares로 CPU 시간 가중치를 설정할 수 있다
* [ ] --cpuset-cpus로 특정 CPU 코어를 지정할 수 있다
* [ ] --cpus로 CPU 사용 비율을 제한할 수 있다
* [ ] --memory로 메모리 hard limit을 설정할 수 있다
* [ ] --memory-swap으로 swap 메모리를 제한할 수 있다
* [ ] docker update로 실행 중인 컨테이너의 자원을 조정할 수 있다
* [ ] --device-write-bps로 Disk 쓰기 속도를 제한할 수 있다
* [ ] --device-write-iops로 Disk I/O 횟수를 제한할 수 있다
* [ ] htop, iostat으로 시스템 리소스를 모니터링할 수 있다

---

## 20. 다음 챕터 예고

### Chapter 08. Docker Compose

다음 장에서는:

* Docker Compose 개념과 필요성
* docker-compose.yml 파일 작성
* 다중 컨테이너 애플리케이션 관리
* 서비스 스케일링

를 **실습 중심**으로 다룹니다.
