# Chapter 02. Docker 플랫폼 구성과 동작 원리
---

## 1. 이 챕터의 목표

이 챕터를 마치면 반드시 다음을 설명할 수 있어야 합니다.

- `docker run` 명령이 내부에서 어떤 순서로 처리되는가
- Docker Client와 Daemon의 역할 차이
- Image / Container / Runtime의 관계
- Docker가 단순한 실행 도구가 아닌 **플랫폼**인 이유

> ❗ 이 장을 이해하지 못하면  
> Dockerfile, Compose, Kubernetes는 **암기 과목**이 됩니다.

---

## 2. Docker는 “단일 프로그램”이 아니다

### 2.1 흔한 오해

- Docker = 하나의 실행 파일 ❌
- Docker = 단일 데몬 ❌

### 2.2 실제 Docker 구성 요소

Docker는 **여러 컴포넌트가 조합된 플랫폼**입니다.

```text
┌────────────────────┐
│   Docker Client    │  ← docker 명령어
└─────────┬──────────┘
          │ REST API
┌─────────▼──────────┐
│   Docker Daemon    │  ← dockerd
└─────────┬──────────┘
          │
┌─────────▼──────────┐
│    containerd      │  ← 컨테이너 수명 관리
└─────────┬──────────┘
          │
┌─────────▼──────────┐
│       runc         │  ← 실제 프로세스 실행
└────────────────────┘
````

---

## 3. Docker Client

### 3.1 역할

Docker Client는:

* 사용자의 명령을 입력받고
* Docker Daemon에 **요청만 전달**
* 실제 작업은 수행하지 않음

예:

```bash
docker run nginx
```

👉 Client는 “명령 전달자”

---

### 3.2 Client ↔ Daemon 통신 방식

* REST API 기반
* Unix Socket (`/var/run/docker.sock`)
* TCP (원격 Docker)

---

## 4. Docker Daemon (dockerd)

### 4.1 역할

Docker Daemon은 Docker의 **두뇌** 역할

* 이미지 관리
* 컨테이너 생명주기 관리
* 네트워크 / 볼륨 관리
* 보안 정책 적용

---

### 4.2 데몬 상태 확인 실습

```bash
ps -ef | grep dockerd
```

또는:

```bash
systemctl status docker
```

---

## 5. containerd 와 runc

### 5.1 containerd

* 컨테이너 **생성, 시작, 중지** 담당
* CNCF 프로젝트
* Kubernetes도 사용

---

### 5.2 runc

* 실제 컨테이너 프로세스 실행
* Linux namespace / cgroup 적용
* OCI Runtime 표준 구현체

---

## 6. docker run 명령의 내부 흐름 (핵심)

### 6.1 docker run 한 줄로 벌어지는 일

```bash
docker run -d -p 8080:80 nginx
```

실제 내부 동작 순서:

1. Docker Client → Daemon 요청
2. 이미지 존재 여부 확인
3. 없으면 Registry에서 Pull
4. 컨테이너 생성
5. 네트워크 할당
6. 볼륨 마운트
7. runc 실행
8. 프로세스 실행

👉 단순 실행 명령이 아님

---

## 7. 실습 1 – Client / Daemon 분리 체감

### 7.1 Client 명령 실행

```bash
docker ps
```

---

### 7.2 Docker 서비스 중지 (주의)

> ❗ 실습 서버에서만 수행

```bash
sudo systemctl stop docker
```

---

### 7.3 다시 명령 실행

```bash
docker ps
```

출력:

```text
Cannot connect to the Docker daemon
```

👉 Client는 있지만 Daemon이 없음

---

### 7.4 Docker 서비스 복구

```bash
sudo systemctl start docker
```

---

## 8. 실습 2 – Image와 Container의 관계

### 8.1 이미지 목록 확인

```bash
docker images
```

---

### 8.2 컨테이너 생성 및 실행

```bash
docker run -d --name web1 nginx
docker run -d --name web2 nginx
```

---

### 8.3 컨테이너 목록 확인

```bash
docker ps
```

👉 **하나의 이미지 → 여러 컨테이너**

---

## 9. 실습 3 – 컨테이너 생명주기 직접 제어

### 9.1 중지

```bash
docker stop web1
```

---

### 9.2 시작

```bash
docker start web1
```

---

### 9.3 삭제

```bash
docker rm -f web2
```

---

## 10. 실습 4 – Docker 객체 정리

### 10.1 컨테이너 / 이미지 관계 확인

```bash
docker ps -a
docker images
```

---

### 10.2 이미지 삭제 실패 확인

```bash
docker rmi nginx
```

출력:

```text
image is being used by stopped container
```

👉 컨테이너가 남아 있기 때문

---

### 10.3 전체 정리

```bash
docker rm -f web1
docker rmi nginx
```

---

## 11. Docker 플랫폼이 중요한 이유

Docker는:

* 실행 도구 ❌
* 컨테이너 플랫폼 ⭕
* Kubernetes의 기반 ⭕
* CI/CD 핵심 구성요소 ⭕

---

## 12. 반드시 이해해야 할 핵심 요약

* Docker Client ≠ Docker Daemon
* docker run = 다단계 작업
* containerd / runc 존재 이유
* Image는 설계도, Container는 인스턴스

---

## 13. 체크리스트 (통과 필수)

* [ ] Docker 아키텍처를 그림으로 설명할 수 있다
* [ ] docker run 내부 흐름을 단계별로 설명 가능
* [ ] Image와 Container 차이를 이해했다
* [ ] Docker 데몬 중지/복구 실습 성공
* [ ] 컨테이너 생명주기 제어 가능

---

## 14. 다음 챕터 예고

### Chapter 03. Docker 엔진 관리와 업데이트

다음 장에서는:

* Docker 버전 관리
* 운영 서버 업데이트 전략
* 장애 발생 시 복구 절차

를 **운영 관점 실습**으로 다룹니다.

