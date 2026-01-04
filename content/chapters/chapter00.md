# Chapter 00. Docker 컨테이너 빌드업

---

## 0. 강의 소개

**한 번에 끝내는 CI/CD Docker 컨테이너 빌드업!**

이 강의는 Docker 엔진에 대한 이해와 CLI를 통해 컨테이너 기술을 습득하고, 컨테이너 MSA 구성에 대한 실무를 익히는 것을 목표로 합니다.

### 강의 구성

| Chapter | 내용 |
| ------- | --- |
| Chapter 1 | Docker 빌드업 |
| Chapter 2 | Docker 실전 |
| Chapter 3 | Docker 마스터 |

---
## 1. 이 챕터의 목적

이 챕터는 **Docker를 왜 배우는지**,
그리고 **앞으로 1~14장에서 무엇을 어떻게 실습하게 되는지**를 명확히 이해하는 것이 목표입니다.

> ❗ 이 챕터를 이해하지 못하면
> 이후 실습에서 "이걸 왜 하는지"를 계속 잃어버리게 됩니다.

---

## 2. 왜 Docker를 배우는가? (실무 관점)

### 2.1 전통적인 개발·운영의 문제

아래 상황을 한 번이라도 겪었다면 Docker가 필요합니다.

- 내 PC에서는 정상 동작
- 서버에 배포하면 오류 발생
- 개발자 / 운영자 환경이 다름
- 라이브러리 버전 충돌
- 서버 재설치 시 동일 환경 재구성 불가

👉 **환경 불일치(Environment Drift)** 문제

---

### 2.2 Docker가 해결하는 핵심 문제

Docker는 다음을 **하나의 패키지**로 묶습니다.

- 애플리케이션
- 실행에 필요한 라이브러리
- OS 환경 일부
- 실행 명령

즉,

> **“이 환경 그대로 어디서든 실행”**

---

## 3. Docker가 사용되는 실제 위치

### 3.1 서비스 전체 흐름에서의 Docker 위치

```text
개발자 코드 작성
        ↓
Git Commit / Push
        ↓
CI (Build / Test)
        ↓
Docker Image 생성
        ↓
Image Registry (Docker Hub, ECR)
        ↓
운영 서버에서 Container 실행
````

Docker는 **중앙 연결 고리** 역할을 합니다.

---

### 3.2 실무 사용 사례

* 웹 서비스 배포 (Nginx, Spring, Node.js)
* DB 테스트 환경 (MySQL, PostgreSQL)
* CI/CD 파이프라인
* MSA 환경
* Kubernetes 기반 운영

---

## 4. 이 교재의 학습 방식

### 4.1 이론 비중

* 최소한의 이론
* 반드시 실습에 필요한 개념만 설명

### 4.2 실습 비중

* **모든 챕터는 명령어 실습 포함**
* 복사 → 실행 → 결과 확인 구조
* 실습 실패 시 점검 포인트 제공

---

## 5. 전체 커리큘럼 구성 안내 (1~14장 로드맵)

### Chapter 1. Docker 빌드업 (입문~실무)

| 단계 | Chapter | 내용 | 학습 목표 |
| --- | ------- | --- | ------- |
| 입문 | 01 | 컨테이너 가상화 이해 | 컨테이너 가상화 기술 리뷰 |
| 입문 | 02 | Docker 플랫폼 구성 | Docker 엔진 구성을 위한 환경 구성 |
| 기본 | 03 | Docker 엔진 | 최신 Docker 엔진 사용 |
| 실무 | 04 | Docker 이미지 관리 | 이미지 pull / push와 registry 이해 |
| 실무 | 05 | Docker 컨테이너 관리 | 컨테이너 관리를 위한 CLI |

### Chapter 2. Docker 실전 (입문~실무)

| 단계 | Chapter | 내용 | 학습 목표 |
| --- | ------- | --- | ------- |
| 입문 | 06 | Docker network | 컨테이너 서비스를 위한 네트워크 |
| 입문 | 07 | 컨테이너 자원관리 | 컨테이너 자원관리와 모니터링 |
| 기본 | 08 | Docker Volume | 데이터 지속성을 위한 Docker Volume |
| 실무 | 09 | Dockerfile | 컨테이너 인프라 구성, Dockerfile |
| 실무 | 10 | docker compose | 멀티컨테이너 서비스, docker compose |

### Chapter 3. Docker 마스터 (입문~실무)

| 단계 | Chapter | 내용 | 학습 목표 |
| --- | ------- | --- | ------- |
| 입문 | 11 | Docker swarm | 컨테이너 orchestration 도구 활용 |
| 입문 | 12 | Docker CI | Docker CI를 위한 Gitaction workflow |
| 기본 | 13 | AWS ECS 서비스 | AWS ECS와 ECR 구성 |
| 실무 | 14-1 | My Diary pilot project | VM 기반의 3-tier pilot project |
| 실무 | 14-2 | My Diary pilot project | AWS ECS 기반의 3-tier pilot project |

---

## 6. 프로젝트 개요

### 6.1 "My Diary" 애플리케이션 서비스 프로젝트

이 강의의 최종 목표는 **"My Diary"** 애플리케이션을 컨테이너 기반으로 구축하고 배포하는 것입니다.

- Frontend를 통해 입력된 데이터는 Backend를 거쳐 Database에 기록됩니다.

### 6.2 프로젝트 구성 - VM based

```text
[개발자] → [GitHub] → [Jenkins (Build/Test/Deploy)] → [VirtualBox]
                ↓                    ↓                      ↓
           git commit           CI/CD 상태점검          Frontend
           git push                  ↓                 Backend
                              Image Registry           Database
                                    ↓
                         Private Registry 또는
                         Public Registry (hub.docker.com)
```

**구성 요소:**
- **VCS:** GitHub
- **CI/CD:** Jenkins (Build → Test → Deploy)
- **Registry:** Private Registry 또는 Docker Hub (hub.docker.com)
- **Runtime:** VirtualBox + Docker

### 6.3 프로젝트 구성 - AWS based

```text
[개발자] → [AWS CodeCommit] → [SNS → SQS] → [Jenkins] → [AWS ECS]
                ↓                              ↓            ↓
          git push                    Build/Test/Deploy  Frontend
               ↓                              ↓          Backend
         AWS Cloud9                     Amazon ECR       Database
```

**구성 요소:**
- **개발환경:** AWS Cloud9
- **VCS:** AWS CodeCommit
- **Trigger:** CodeCommit Trigger (SNS → SQS)
- **CI/CD:** Jenkins (Build → Test → Deploy)
- **Registry:** Amazon ECR
- **Runtime:** AWS ECS (Docker 컨테이너)

---

## 7. 실습 환경 준비 (필수)

> ⚠️ 이후 모든 실습은 **Linux 기준**으로 설명합니다.
> (Windows 사용자는 WSL2 또는 VM 권장)

### 7.1 강의 소스코드

- **GitHub:** https://github.com/hylee-kevin/fastcampus

### 7.2 강의에 사용하는 기술 스택

* Oracle VM + Ubuntu 22.04 + Docker latest
* hub.docker.com 기반의 다양한 "application base image" 활용
* 각종 Client tools
* AWS Cloud ECS & ECR
* Github + GitAction + Jenkins CI/CD

---

### 7.3 실습 환경 옵션

#### 권장 환경

* Ubuntu 20.04 / 22.04
* CentOS 7 / Rocky Linux
* 클라우드 VM (AWS, GCP)

#### 대안 환경

* Windows + WSL2
* Docker Desktop

---

## 8. Docker 설치 확인 실습

### 8.1 Docker 설치 여부 확인

```bash
docker --version
```

정상 출력 예:

```text
Docker version 24.0.x, build xxxx
```

---

### 8.2 Docker 데몬 동작 확인

```bash
docker info
```

확인 포인트:

* Server 정보 출력
* 오류 메시지 없음

---

### 8.3 Docker 권한 문제 점검

아래 오류가 발생한다면:

```text
permission denied while trying to connect to the Docker daemon
```

해결:

```bash
sudo usermod -aG docker $USER
```

> 이후 **로그아웃 후 재접속 필수**

---

## 9. 첫 번째 Docker 실습 (중요)

### 9.1 hello-world 컨테이너 실행

```bash
docker run hello-world
```

이 명령이 의미하는 것:

1. 로컬에 이미지 존재 여부 확인
2. 없으면 Docker Hub에서 자동 다운로드
3. 컨테이너 생성
4. 실행
5. 종료

---

### 9.2 결과 해석

정상 출력 시:

* Docker Engine 정상
* 네트워크 정상
* 이미지 Pull 정상
* 컨테이너 실행 성공

👉 **이 실습이 실패하면 이후 모든 실습이 불가**

---

## 10. 실습 디렉토리 구조 준비

앞으로의 실습을 위해 디렉토리를 하나 만듭니다.

```bash
mkdir docker-labs
cd docker-labs
```

이 디렉토리는:

* Dockerfile
* 실습 소스
* 설정 파일

을 저장하는 공간입니다.

---

## 11. 이 챕터 체크리스트

반드시 아래 항목을 모두 만족해야 다음 챕터로 이동하세요.

- [ ] Docker가 설치되어 있다
- [ ] docker 명령이 sudo 없이 실행된다
- [ ] docker info 오류 없음
- [ ] hello-world 컨테이너 실행 성공
- [ ] 실습 디렉토리 생성 완료

---

## 12. 다음 챕터 예고

### Chapter 01에서는 다음을 직접 확인합니다.

* VM과 컨테이너의 **실제 차이**
* 컨테이너가 **프로세스**라는 의미
* 컨테이너 내부와 Host의 경계

> 👉 다음 장부터는 **이론 + 실습 비중이 더 커집니다.**

