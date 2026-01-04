# Chapter 04. Docker 이미지 관리

---

## 1. 이 챕터의 목표

이 챕터를 마치면 다음을 **실제로 할 수 있어야 합니다.**

- Docker 이미지와 컨테이너의 관계를 명확히 설명한다
- Docker 이미지가 Layer 구조임을 이해한다
- 이미지를 Pull / Build / Tag / Delete 할 수 있다
- Dockerfile을 작성하여 이미지를 직접 생성한다
- 운영 환경에서 이미지 관리 전략을 이해한다

> ❗ 이 챕터는  
> **Docker 실무의 핵심 중 핵심**이다.

---

## 2. Docker 이미지란 무엇인가?

### 2.1 이미지 vs 컨테이너 (다시 정리)

| 구분 | Docker Image | Docker Container |
|---|---|---|
| 개념 | 실행 설계도 | 실행 인스턴스 |
| 상태 | Read-Only (Immutable) | Read/Write |
| 생성 시점 | Build / Pull (Build-time) | Run (Run-time) |
| 수명 | 반영구 | 휘발성 |

👉 **이미지 = 클래스, 컨테이너 = 객체**

Docker image는 Container runtime에 필요한 바이너리, 라이브러리 및 설정 값 등을 포함하고, 변경되는 상태 값을 보유하지 않고(stateless) 변하지 않는다. (Immutable, RO)

---

### 2.2 이미지가 필요한 이유

- 동일한 환경 보장
- 어디서든 동일 실행
- 배포 자동화
- 버전 관리 가능

---

### 2.3 컨테이너 애플리케이션 개발 workflow

일반적인 컨테이너 애플리케이션 서비스 개발 과정:

```text
(1) 애플리케이션 코드 개발
        ↓
(2) 베이스이미지를 이용한 Dockerfile 작성
        ↓
(3) Dockerfile build를 통한 새로운 이미지 생성
        ↓
(4-1) 생성된 이미지를 이용한 컨테이너 실행
(4-2) 도커컴포즈를 이용한 다중 컨테이너 실행
        ↓
(5-1) 컨테이너 애플리케이션 서비스 테스트
(5-2) 마이크로서비스 테스트
        ↓
(6) 로컬 및 원격 저장소에 이미지 저장 (push)
        ↓
(7) Github 등을 활용한 Dockerfile 관리
        ↓
(8) 동일환경에서의 지속적 애플리케이션 개발 수행
```

👉 이 모든 작업을 자동화한다면? → **CI/CD 파이프라인**

---

### 2.4 Docker image 관련 명령어 workflow

```text
                    <Local Server>
                        save
  DOCKERFILE ──build──→  ┌─────┐  ←──load──
       │                 │image│
       │     ls, rm, tag │     │  docker login
       │     inspect     └──┬──┘       ↓
       ↓     history        │       ┌─────────────┐
    GitHub                  │  push │ Docker Hub  │
                           run  ←──pull── Registry│
                            │       │             │
                            ↓    search           │
                      ┌──────────┐  └─────────────┘
                      │container │
                      └──────────┘    Automated Build
```

---

## 3. Docker 이미지의 내부 구조 (Layer 개념)

### 3.1 이미지 Layer 구조

Docker 이미지는 **여러 개의 Layer**로 구성된다.

```text
┌─────────────────────┐
│  Application Layer  │  ← 웹소스
├─────────────────────┤
│   httpd (서버)      │  ← httpd 서버
├─────────────────────┤
│    Library Layer    │  ← OS 계층
├─────────────────────┤
│  Base Image Layer   │  ← OS 계층
└─────────────────────┘
      Docker Image
```

특징:

* 각 Layer는 Read-Only
* 변경 시 새로운 Layer 추가
* 재사용 가능 → 속도/용량 최적화

---

### 3.2 UFS (Union FileSystem) 개념

- 이미지는 불변 즉, **read only 형태**로 만들어진다
- `docker run` 명령으로 컨테이너를 생성하면 **[Container layer]가 read write로 추가**된다
- 하나의 이미지는 **원하는 만큼의 컨테이너를 생성**할 수 있다
- 여러 개의 layer를 하나의 FS으로 사용하게 해주는 기능을 **UFS(union filesystem)**이라고 함

```text
Docker Image                          httpd Container
┌───────────┐   ┌───────────────┐     ┌─────────────┐
│ web source│   │  web source   │     │ Read write  │ ← Container Layer
├───────────┤   ├───────────────┤  ┌──┼─────────────┤
│  httpd    │   │    httpd      │  │  │  web app    │
├───────────┤ → ├───────────────┤ →│  │  Image      │ ...
│  Layer 3  │   │   Layer 3     │  │  │  Layers     │
├───────────┤   ├───────────────┤  │  └─────────────┘
│  Layer 2  │   │   Layer 2     │  │
├───────────┤   ├───────────────┤  │  ┌─────────────┐
│  Layer 1  │   │   Layer 1     │  │  │ Read write  │
├───────────┤   ├───────────────┤  └──┼─────────────┤
│Debian Linux│  │   Web App.    │     │  web app    │
└───────────┘   └───────────────┘     │  Image      │
Apache httpd                          │  Layers     │
                                      └─────────────┘
```

---

### 3.3 Layer 구조 확인 실습

```bash
docker image history nginx
```

출력 포인트:

* 각 Layer의 생성 명령
* 용량 변화

---

## 4. 실습 1 – 이미지 Pull과 확인

### 4.1 이미지 내려 받기 (docker pull)

Docker는 hub.docker.com(docker.io)으로 부터 이미지를 제공 받거나 제공한다.
또는, 기업의 인프라에 개별적인 Private registry 서버를 두고, 이곳에 이미지를 pull/push 하기도 한다.

```bash
docker [image] pull [options] name:[tag]

# 기본적으로 docker.io가 default registry로 등록되어 있다.
docker pull debian[:latest]
docker pull library/debian:10
docker pull docker.io/library/debian:10
docker pull index/docker.io/library/debian:10

# 만일, private registry 나 클라우드의 저장소(ECR, GCR 등)의 이미지를 받는다면,
docker pull 192.168.56.101:5000/debian:10
docker pull gcr.io/google-samples/hello-app:1.0
```

---

### 4.2 이미지 다운로드 실습

```bash
docker pull ubuntu:22.04
docker pull nginx:alpine
```

이미지를 내려 받는 과정에서 이미지가 계층(layer) 구조라는 것을 보여 준다:

```bash
docker pull httpd:2.4
# 2.4: Pulling from library/httpd
# f03b40093957: Pull complete ... layer 5 → 웹소스
# abaf8619eb1c: Pull complete ... layer 4 → httpd 서버
# e3fe37d0c2ad: Pull complete ... layer 3 → OS 계층
# 52a1e37affe5: Pull complete ... layer 2 → OS 계층
# 49d8a68fd903: Pull complete ... layer 1 → OS 계층
# Digest: sha256:1bb3f7669a85713906e695599d29c58ab40d4e6409907946609d92a428e95b49
# Status: Downloaded newer image for httpd:2.4
# docker.io/library/httpd:2.4
```

---

### 4.3 로컬 이미지 목록 확인

```bash
docker images
```

확인 포인트:

* REPOSITORY
* TAG
* IMAGE ID
* SIZE

---

### 4.4 태그(Tag)의 의미

```text
nginx:alpine
```

* nginx → 이미지 이름
* alpine → 버전 + OS 의미

👉 `latest` 사용은 **운영에서 위험**

---

### 4.5 이미지 구조 확인 (docker image inspect)

`docker image inspect`: 생성된 image의 내부 구조 정보를 JSON 형태로 제공.

```bash
docker image inspect httpd:2.4
```

**주요 정보:**
- image ID: "Id"
- 생성일: "Created"
- Docker 버전: "DockerVersion"
- CPU 아키텍처: "Architecture"
- 이미지 다이제스트 정보: "RootFS"
- 이미지 레이어 저장 정보: "GraphDriver"

**--format 옵션으로 특정 정보만 추출:**

```bash
# OS 정보 확인
docker image inspect --format="{{.Os}}" httpd:2.4
# linux

# 태그 정보 확인
docker image inspect --format="{{.RepoTags}}" httpd:2.4
# [httpd:2.4]

# 노출 포트 확인
docker image inspect --format="{{.ContainerConfig.ExposedPorts}}" httpd:2.4
# map[80/tcp:{}]

# 여러 정보 동시 확인
docker image inspect --format="{{.RepoTags}} {{.Os}}" httpd:2.4
# [httpd:2.4] linux
```

---

### 4.6 이미지 히스토리 확인 (docker history)

`docker history`: docker image는 Dockerfile을 통해 build 됨. history는 이 정보를 제공.

```bash
docker image history httpd:2.4
# IMAGE          CREATED      CREATED BY                                      SIZE      COMMENT
# d1676199e605   8 days ago   /bin/sh -c #(nop)  CMD ["httpd-foreground"]     0B
# <missing>      8 days ago   /bin/sh -c #(nop)  EXPOSE 80                    0B
# <missing>      8 days ago   /bin/sh -c #(nop)  COPY file:c432ff61c4993ecd…  138B
# <missing>      8 days ago   /bin/sh -c set -eux;   savedAptMark="$(apt-m…   59.9MB
# <missing>      8 days ago   /bin/sh -c #(nop)  ENV HTTPD_VERSION=2.4.57     0B
# <missing>      8 days ago   /bin/sh -c #(nop)  CMD ["bash"]                 0B
# <missing>      8 days ago   /bin/sh -c #(nop) ADD file:88252a7f118b4d6f5…   80.5MB
```

---

### 4.7 Layer 저장 경로 확인

download된 layer들은 distribution ID를 부여 받고 docker 전용 경로에 저장된다.

```bash
sudo su -
cd /var/lib/docker/image/overlay2/distribution/diffid-by-digest/sha256/

# 이 경로에는 docker pull 된 각 layer들이 각각 저장된다.
ls 49d*
```

---

## 5. 실습 2 – 이미지로 컨테이너 실행

### 5.1 nginx 컨테이너 실행

```bash
docker run -d -p 8080:80 --name web nginx:alpine
```

---

### 5.2 서비스 확인

```bash
curl http://localhost:8080
```

또는 브라우저 접속

---

### 5.3 컨테이너와 이미지 관계 확인

```bash
docker ps
docker images
```

👉 **이미지 1개 → 컨테이너 여러 개 가능**

---

## 6. 실습 3 – Dockerfile 개념 이해

### 6.1 Dockerfile이란?

Dockerfile =
**이미지를 만들기 위한 설계도**

특징:

* 위에서 아래로 실행
* 각 줄 = 하나의 Layer
* 명령 결과가 이미지에 반영됨

---

### 6.2 기본 Dockerfile 구조

```dockerfile
FROM nginx:alpine
COPY index.html /usr/share/nginx/html/index.html
```

---

## 7. 실습 4 – 나만의 이미지 만들기

### 7.1 실습 디렉토리 준비

```bash
mkdir image-lab
cd image-lab
```

---

### 7.2 HTML 파일 생성

```bash
cat > index.html <<EOF
<h1>Hello Docker Image</h1>
<p>Chapter 04 Image Build Test</p>
EOF
```

---

### 7.3 Dockerfile 작성

```bash
cat > Dockerfile <<EOF
FROM nginx:alpine
COPY index.html /usr/share/nginx/html/index.html
EOF
```

---

### 7.4 이미지 빌드

```bash
docker build -t my-nginx:v1 .
```

---

### 7.5 이미지 확인

```bash
docker images
```

---

### 7.6 컨테이너 실행

```bash
docker run -d -p 8081:80 --name myweb my-nginx:v1
```

---

### 7.7 결과 확인

```bash
curl http://localhost:8081
```

---

## 8. 실습 5 – 이미지 태그 관리

### 8.1 이미지 태그 추가

```bash
docker tag my-nginx:v1 my-nginx:latest
```

---

### 8.2 태그 확인

```bash
docker images my-nginx
```

---

## 9. 실습 6 – 이미지 삭제와 의존성

### 9.1 이미지 삭제 실패 확인

```bash
docker rmi my-nginx:v1
```

출력 예:

```text
image is being used by running container
```

---

### 9.2 컨테이너 중지 및 삭제

```bash
docker stop myweb
docker rm myweb
```

---

### 9.3 이미지 삭제 성공

```bash
docker rmi my-nginx:v1 my-nginx:latest
```

---

## 10. Docker Hub에 이미지 Push

### 10.1 이미지 올리기 (push) 개념

- Dockerfile을 통해 생성된 이미지나 docker commit을 통해 생성된 이미지를 저장하는 곳을 **registry**라고 한다.
- Registry는 공개적으로 사용하는 **Public registry**와 회사 내부에서만 접근되도록 하는 **Private registry**가 있다.

**docker push를 수행하려면 다음과 같은 작업이 전제 된다:**
1. `docker login`: hub.docker.com에 가입된 본인ID와 암호로 현재 로컬에 계정을 등록한다. (해제는 docker logout)
2. `docker tag`: hub.docker.com에 본인 계정의 Repositories에 넣기 위한 태그를 수행한다. (tag는 이미지의 새로운 참조명을 넣는 방법. 간혹, OS, 버전 표시로 활용하기도 한다.)

---

### 10.2 docker login/logout

hub.docker.com에 회원가입 후 서버에서 docker login을 통해 본인 저장소에 업로드 한다.

**"암호"로 접근 하는 방법:**

```bash
docker login
# Login with your Docker ID to push and pull images from Docker Hub.
# Username: (본인계정)
# Password: (본인암호)
# WARNING! Your password will be stored unencrypted in /home/kevin/.docker/config.json.
# Login Succeeded

docker info | grep Username
# Username: (본인계정확인)
```

> ⚠️ 경고! 입력한 암호는 암호화 되지 않는다. 제공되는 경로를 열어보면 암호코드처럼 생긴 값이 있지만, base64 인코딩 값이다.

**"Token"으로 접근하는 방법:**

Docker Hub > Account Settings > Security > New Access Token에서 토큰 생성 후:

```bash
vi .access_token
# DOCKER_TOKEN=<YOUR_DOCKER_TOKEN>


cat .access_token | docker login --username 본인계정 --password-stdin
# Login Succeeded

docker info | grep Username
# Username: (본인계정확인)
```

---

### 10.3 docker tag → push

hub.docker.com에 본인 계정의 Repositories에 생성한 이미지를 업로드하기 위해서는 **본인계정을 이미지명 앞에 붙여야** docker push 수행 시 계정으로 찾아가 저장된다.

```bash
docker images
# REPOSITORY   TAG    IMAGE ID       CREATED       SIZE
# myweb        v1.1   533b0d9189d6   3 days ago    41.4MB
# myweb        v1.0   ed199951117d   3 days ago    41.4MB

# 본인계정/이미지명:태그 형태로 tag 추가
docker image tag myweb:v1.0 dbgurum/myweb:v1.0

docker images
# REPOSITORY       TAG    IMAGE ID       CREATED       SIZE
# myweb            v1.1   533b0d9189d6   3 days ago    41.4MB
# dbgurum/myweb    v1.0   ed199951117d   3 days ago    41.4MB

# Docker Hub에 push
docker push dbgurum/myweb:v1.0
# The push refers to repository [docker.io/dbgurum/myweb]
# 0e09aaca8f2d: Pushed
# v1.0: digest: sha256:1e2580f9199d54738823cda8a79d154080ecbfb93bdedf4325baf4e1dea20168 size: 2198
```

---

### 10.4 push된 이미지 확인

hub.docker.com에 push된 이미지를 다른 위치에서 pull 해보고, docker run 으로 정상 이미지인지 확인해 본다.

```bash
# 다른 서버에서
docker pull dbgurum/myweb:v1.0
docker run -d -p 8001:80 --name=myweb dbgurum/myweb:v1.0
curl localhost:8001
```

**이미지를 공유하는 방법:**
- registry에 push하여 공유
- 이미지를 생성하는 Dockerfile과 소스를 Github에 올려 공유
- 이미지를 docker save를 통해 파일로 백업하여 전달 후 docker load를 통해 공유

---

## 11. Docker 이미지 백업 및 이전 (save/load)

### 11.1 docker save - 이미지 백업

docker save 명령을 통해 Layer로 구성된 이미지를 *.tar 파일로 묶어 파일로 저장한다.

```bash
mkdir save_lab && cd $_

# tar 파일로 저장
docker image save phpserver:1.0 > phpserver1.tar
ls -lh
# -rw-rw-r-- 1 kevin kevin 331M 06월 15 11:49 phpserver1.tar

# gzip 압축으로 저장
docker image save phpserver:1.0 | gzip > phpserver1.tar.gz
ls -lh
# -rw-rw-r-- 1 kevin kevin 331M 06월 15 11:49 phpserver1.tar
# -rw-rw-r-- 1 kevin kevin 102M 06월 15 11:50 phpserver1.tar.gz

# bzip2 압축으로 저장
docker image save phpserver:1.0 | bzip2 > phpserver1.tar.bz2
ls -lh
# -rw-rw-r-- 1 kevin kevin 331M 06월 15 11:49 phpserver1.tar
# -rw-rw-r-- 1 kevin kevin 102M 06월 15 11:50 phpserver1.tar.gz
# -rw-rw-r-- 1 kevin kevin  93M 06월 15 11:51 phpserver1.tar.bz2
```

---

### 11.2 docker load - 이미지 복원

해당 파일을 전달 받은 컴퓨터에서 docker load를 통해 이미지로 등록한다.

```bash
# hostos1에서 hostos2로 파일 전송
scp phpserver1.tar.gz kevin@hostos2:/home/kevin/backup/phpserver1.tar.gz

# hostos2에서 이미지 로드
cd ~/backup
docker image load < phpserver1.tar.gz
# Loaded image: phpserver:1.0

docker images
docker run -itd -p 8200:80 phpserver:1.0
curl localhost:8200
```

---

## 12. 이미지 삭제 고급 기법

### 12.1 이미지 삭제 명령

Docker Hub를 통해 다운로드(pull) 받은 이미지는 종류에 따라 용량이 다르다. 작게는 몇 MB부터 크게는 몇 GB가 넘는 것도 있다. 이미지를 계속 다운로드만 받게 되면 로컬 서버의 저장 용량을 많이 차지하여 공간 부족과 같은 문제를 야기하기도 한다.

```bash
docker image rm [옵션] {이미지명[:태그] | 이미지ID}
docker rmi [옵션] {이미지명[:태그] | 이미지ID}
```

---

### 12.2 이미지 일괄 삭제 기법

```bash
# 이미지 전체 삭제
docker rmi $(docker images -q)

# 특정 이미지명이 포함된 것만 삭제
docker rmi $(docker images | grep debian)

# 반대로 특정 이미지명이 포함된 것만 제외하고 모두 삭제
docker rmi $(docker images | grep -v centos)
```

---

### 12.3 유용한 alias 설정

```bash
vi .bashrc

# 상태가 exited 인 container를 찾아서 모두 삭제
alias cexrm='docker rm $(docker ps --filter 'status=exited' -a -q)'

# 설정한 alias를 적용하고 확인
source .bashrc
alias
# alias cexrm='docker rm $(docker ps --filter 'status=exited' -a -q)'
```

---

### 12.4 사용 중인 이미지 삭제 시 오류

```bash
# 현재 centos:7 이미지를 사용 중인 컨테이너가 있다.
docker ps -a
# CONTAINER ID   IMAGE      COMMAND   CREATED          STATUS          NAMES
# 0b5612583dfa   centos:7   "bash"    8 minutes ago    Up 8 minutes    mycontainer

# 이미지를 삭제하면?
docker image rm centos:7
# Error response from daemon: conflict: unable to remove repository reference "centos:7"
# (must force) - container 0b5612583dfa is using its referenced image eeb6ee3f44bd

# 해당 컨테이너 stop 후 rm으로 컨테이너 삭제
docker stop 0b5612583dfa
docker rm 0b5612583dfa
```

---

## 13. Private Docker Registry 구성

### 13.1 Private Registry 필요성

- 기업 내부에서 생성한 프로젝트용 이미지를 public registry에 올리는 경우는 없다.
- image에 네트워크나 OS 및 미들웨어 설정 등의 정보가 포함되어 있으므로 보안상 Docker Hub와 같이 인터넷을 통해 불특정 다수에게 공개되는 곳에는 올릴 수 없는 경우에는 **"Private Registry"**를 구축한다.
- Docker registry는 docker image를 회사 서버에서 개별적으로 구축 관리하는 서비스다.
- 회사 인프라내에 private docker registry를 구축하기 위해서는, Docker Hub에 공개되어 있는 공식 image인 **"registry"**를 사용한다.

---

### 13.2 Private Registry 구성

```bash
# registry 이미지 다운로드
docker pull registry
docker images | grep registry
# registry   latest   65f3b3441f04   3 weeks ago   24MB

# registry 컨테이너 실행
docker run -d \
  -v /home/kevin/registry_data:/var/lib/registry \
  -p 5000:5000 \
  --restart=always \
  --name=local-registry \
  registry

docker ps | grep registry
# 36a452a303e1   registry   "/entrypoint.sh /etc…"   13 seconds ago   Up 12 seconds
# 0.0.0.0:5000->5000/tcp, :::5000->5000/tcp   local-registry

sudo netstat -nlp | grep 5000
# tcp   0   0 0.0.0.0:5000   0.0.0.0:*   LISTEN   58135/docker-proxy
```

---

### 13.3 insecure-registry 설정

```bash
# registry에 이미지 목록 확인
curl -X GET http://192.168.56.101:5000/v2/_catalog
# {"repositories":[]}

# 이미지 태그 및 push 시도
docker image tag myweb:v1.0 192.168.56.101:5000/myweb:v1.0
docker push 192.168.56.101:5000/myweb:v1.0
# Get "https://192.168.56.101:5000/v2/": http: server gave HTTP response to HTTPS client
```

HTTP 접근을 허용하기 위해 insecure-registry 설정:

```bash
# /etc/docker/daemon.json 파일 수정
sudo vi /etc/docker/daemon.json
{ "insecure-registries": ["192.168.56.101:5000"] }

# Docker 서비스 재시작
sudo systemctl restart docker.service

# 설정 확인
docker info
# ...
# Insecure Registries:
#   192.168.56.101:5000
#   127.0.0.0/8
```

---

### 13.4 Private Registry에 이미지 Push/Pull

```bash
# 이미지 push
docker push 192.168.56.101:5000/myweb:v1.0
# The push refers to repository [192.168.56.101:5000/myweb]
# 0e09aaca8f2d: Pushed
# v1.0: digest: sha256:1e2580f9199d54738823cda8a79d154080ecbfb93bdedf4325baf4e1dea20 size: 2198

# registry 목록 확인
curl -X GET http://192.168.56.101:5000/v2/_catalog
# {"repositories":["myweb"]}

curl -X GET http://192.168.56.101:5000/v2/myweb/tags/list
# {"name":"myweb","tags":["v1.0"]}
```

---

### 13.5 다른 서버에서 Private Registry 사용

```bash
# hostos2 (client)에서 registry 확인
curl -X GET http://192.168.56.101:5000/v2/_catalog
# {"repositories":["myweb"]}

curl -X GET http://192.168.56.101:5000/v2/myweb/tags/list
# {"name":"myweb","tags":["v1.0","v1.1"]}

# 이미지 pull 및 실행
docker pull 192.168.56.101:5000/myweb:v1.0
docker image tag 192.168.56.101:5000/myweb:v1.0 dev_http:1.1
docker images
docker run -d -p 8100:80 --name myweb-server dev_http:1.1
```

> 기본 docker registry는 http 접근으로 별도의 인증 절차가 없다.
> 보안 구성을 위해 별도로 SSL(openssl)로 인증서를 만들어 보안 인증 구성도 가능하다.

---

## 14. 운영 관점 이미지 관리 전략

### 14.1 운영에서 지켜야 할 원칙

* `latest` 사용 금지
* 명확한 버전 태그 사용
* 이미지 크기 최소화
* 불필요한 이미지 주기적 정리

---

### 14.2 이미지 정리 명령

```bash
docker image prune
docker system prune
```

⚠️ 운영 서버에서는 주의

---

## 15. 반드시 이해해야 할 핵심 요약

* 이미지는 Layer 구조
* Dockerfile 한 줄 = 한 Layer
* Image는 Read-Only (Immutable)
* Container는 Image 기반 실행 인스턴스 (Read/Write Layer 추가)
* UFS(Union FileSystem)로 여러 Layer를 하나의 FS로 사용
* docker login → tag → push 로 Docker Hub에 업로드
* docker save/load로 이미지 백업 및 이전
* Private Registry로 사내 이미지 관리
* 이미지 관리 = Docker 실무의 핵심

---

## 16. 체크리스트 (통과 필수)

* [ ] Image와 Container 차이를 설명할 수 있다
* [ ] docker pull / run / build 사용 가능
* [ ] Dockerfile을 직접 작성했다
* [ ] 이미지 태그 개념을 이해했다
* [ ] 이미지 삭제 시 의존성 이해
* [ ] docker login / push 수행 가능
* [ ] docker save / load로 이미지 백업 및 복원 가능
* [ ] Private Registry 구성 및 활용 방법 이해

---

## 17. 다음 챕터 예고

### Chapter 05. 컨테이너 생명주기와 관리

다음 장에서는:

* create / start / stop / rm
* 컨테이너 상태 전이
* 로그 / exec / inspect
* 장애 분석 기본기

를 **실습 중심**으로 다룹니다.

