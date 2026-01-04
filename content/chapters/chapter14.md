# 한 번에 끝내는 CI/CD Docker 컨테이너 빌드업

## Clip1: [실습] 컨테이너 배포 자동화를 위한 CI/CD 구성
컨테이너 배포 자동화 위한 CI/CD(Jenkins)를 구성해 보기

## 컨테이너 배포 자동화(CI/CD) 프로젝트

### 지속적 통합과 배포 (CI/CD)
- **CI/CD**는 애플리케이션 개발 단계를 자동화하여 보다 짧은 주기로 변경을 제공하여 전반적인 개발 프로세스의 효율성과 지속성 보장.
  - 반복적 작업의 자동화를 통해 업무 효율성을 올리고, 실수를 줄일 수 있다.
  - 개발 업무에 집중할 수 있는 환경을 제공한다.
  - "빌드-테스트-배포"의 자동화 프로세스를 통해 수동 작업을 줄여 오류 위험을 최소화한다.
  - 일관된 빌드 및 배포를 보장할 수 있다.

- **CI/CD 과정**을 묶어서 CI/CD 파이프라인을 구축하면 애플리케이션의 통합 및 테스트 단계에서부터 제공 및 배포에 이르는 애플리케이션의 라이프사이클 전체에 걸쳐 지속적인 자동화 및 모니터링을 제공하여 안정적인 배포를 수행하는데 도움이 된다.

### 지속적 통합(CI, Continuous Integration)
- **CI**는 코드 변경 사항을 지정된 Repository(registry)에 정기적으로 통합하고 자동화된 빌드와 테스트를 실행한다.
  1. Code Repository 사용 → GitHub 등에서 코드 무결성 및 최신 작업 빌드 유지
  2. 일관되고 반복 가능한 환경에서 코드를 빌드(빌드→패키징→등록)하고 테스트
  3. 지속적으로 배포 준비상태의 Artifact(docker image)를 확보
  4. 지속적으로 빌드 실패 시 feedback loop 종료

### 지속적 전달과 배포 (CD, Continuous Delivery & Deployment)
- **CD**는 실제 운영에 배포하기 위해 코드 변경이 자동으로 빌드, 테스트, 준비되는 단계다.
- 지속적 전달은 스테이징 환경에서 모든 코드 변경을 자동으로 배포하고 테스트하여 지속적 통합을 확장하고, 이후 운영에 배포하기 위한 수동 승인 단계를 거친다. 즉, 코드 베이스가 항상 배포 가능한 상태를 유지하는 단계다.
- 지속적 배포는 수동 승인 단계를 배제한 전체 end to end 주기가 자동화되는 과정이다.
  - 소프트웨어 릴리스 프로세스를 자동화
  - 개발자 생산성 향상
  - 버그를 더 빠르게 찾아 해결
  - 업데이트를 더 빠르게 제공

### 지속적 통합과 배포 (CI/CD) 파이프라인
- **CI/CD**는 애플리케이션 개발 프로세스에서 자동화된 빌드, 테스트, 배포를 위해 사용되는 방법론으로 애플리케이션의 품질 향상 및 릴리스 주기를 단축시키는데 도움이 되는 중요한 역할을 수행한다. → CI/CD/CT/CM

[그림: CI/CD 파이프라인]
- 코드(code) → 빌드(build) → 테스트(test) → 프로비저닝(provision) → 배포(deploy) → 모니터(monitor)

### 좋은 선택
좋은 선택은 사용자 요구사항(경험, 선호도)과 프로젝트의 특성을 고려하여 안정적인 서비스를 유지할 수 있는 도구를 선택하는 것이다.

- **Jenkins** (open source, 다양한 plugin, 설정관리 복잡, 높은 커뮤니티 지원)
- **GitHub Action** (GitHub 자체 CI/CD, workflow 기반 작업 수행)
- **GitLab** (코드 저장 및 관리와 CI/CD 플랫폼 통합으로 편리)
- **CircleCI** (설정간단, 클라우드 호스팅, 빠른 빌드 및 테스트 속도 제공)
- **Travis CI** (Github과 연동, 사용 간편)

### Jenkins
- **Jenkins**는 Java runtime 환경으로 구성된 소프트웨어 구축, 테스트, 전달 또는 배포와 관련된 모든 종류의 작업을 자동화를 목적으로 사용할 수 있는 독립형 오픈 소스 CI 서버다.
  - 웹 기반 콘솔로 다양한 plugin 설정(1800여개)이 가능한 편리한 설정 지원
  - 소스 버전 관리 도구와 연동하여 코드 변경을 감지, 자동 테스트, 빌드를 수행하는 안정적인 빌드/배포 환경 지원
  - 오픈 소스로 다양한 소프트웨어 활용에 대한 문서화 구성이 잘되어 있고, plugin 개발도 가능

### Jenkins plugin (https://plugins.jenkins.io)
- 다양한 plugin(각 기능의 모듈화)을 활용한 자동화 작업 처리가 가능하다.
  - credentials plugin: 인증 관련으로 VM 환경에서는 ssh key, AWS/Git 등은 token을 활용
  - git plugin: GitHub source code 접근을 통해 빌드를 수행할 수 있도록 지원
  - pipeline plugin: 파이프라인 구축의 핵심인 CI 구축 plugin
  - docker plugin & pipeline: docker agent를 통해 Jenkins가 docker를 사용하도록 지원
  - blue/ocean plugin: CD pipeline의 자세한 시각화 지원으로 모든 상황에 대한 파악이 빠름
  - Amazon EC2 plugin: EC2 인스턴스 스케일링 가능한 빌드 클러스터 구성 가능
  - Metric plugin: 운영 환경의 중요 성능 metric(지표) 측정을 위한 java library 제공

### Jenkins pipeline
- **Jenkins의 pipeline**은 용도에 맞게 plugin을 조합하여 원하는 Jenkins CI/CD 자동화를 구성하는 것이다.
  - **Pipeline**은 자동화 작업의 순서를 정의한 스크립트 언어
  - Declarative (선언적) 방식과 scripted pipeline 구성 방식

```groovy
# Declarative (빠른 업데이트 및 가독성)
pipeline {
    agent { docker 'node:6.3' }
    stages {
        stage('build') {
            steps {
                sh 'npm version'
            }
        }
    }
}
```

```groovy
# scripted pipeline
node('docker') {
    checkout scm
    stage('Build') {
        docker.image('node:6.3').inside {
            sh 'npm version'
        }
    }
}
```
## Jenkins Pipeline Section

- **Agent Section**
  - 여러 Slave node 사용할 경우, 어떤 노드에 일을 시킬 것인지 지정
  - 또한, node 뿐만 아니라 Jenkins 내부 docker container 에서 수행할 명령 지정도 가능

- **Stage Section**
  - 어떤 일들을 처리할 것인지 정의 (category)
  - 예로, backend 배포를 위한 stage 정의

- **Steps Section**
  - 특정 stage 안에서의 작업 순서(단계, step)를 정의
  - plugin 설치 시 사용 가능한 step 생성

- **Post Section**
  - stage 종료 후 결과에 따른 후속 조치
  - 성공이면 Email 전송, 실패 시 중단 및 skip 등의 작업 결과에 따른 조치 지정

## Jenkins Pipeline Section 예

```groovy
# GitHub에 등록한 access token을 Pipeline Project의 Script 적용
pipeline {
    agent any
    stages {
        stage('Prepare') {
            agent any
            steps {
                git branch: 'main',
                credentialsId: 'github_access_token',
                url: 'https://github.com/hylee-kevin/fastcampus.git'
            }
            post {
                failure {
                    error "Fail Git Cloned Repository"
                }
            }
        }
    }
}
```

## [실습] Jenkins 환경 구성

```bash
~$ docker pull jenkins/jenkins:lts
~$ docker run -itd --name=fc-jenkins -p 18080:8080 -p 50000:50000 \
> --privileged=true -u root \
> --restart=always \
> -v /var/run/docker.sock:/var/run/docker.sock \
> -v /home/kevin/fastcampus/jenkins:/var/jenkins_home \
> jenkins/jenkins:lts
```

- **port1**: (필수) 외부 연결을 위한 기본 port(8080)
- **port2**: 여러 노드에 Jenkins를 구성한 경우 Jenkins agent를 통해 노드간 통신을 위한 port(50000)
- **--privileged=true**: 컨테이너 내부 시스템의 주요 자원에 접근할 가능하도록 권한 부여
- **-u root**: 여러 권한 문제 및 명령어 수행을 위해 지정. (일반 사용자 지정 시 권한 부여 후 사용)
- **/var/run/docker.sock 공유**: Jenkins에서 docker build 사용을 위해 host에 설치된 docker.sock을 같이 사용하기 위해 볼륨을 구성해야 한다. 또는 docker in docker(dind) 사용.
- **Jenkins home과 애플리케이션 소스가 제공될 볼륨 설정.**

```bash
~$ sudo chown -R kevin.kevin /home/kevin/jenkins
~$ sudo netstat -nltp | grep docker-proxy
```

## [실습] Jenkins 환경 구성

외부 접근: `VM_hostos1_IP:18080` → `192.168.56.101:18080`

Jenkins 내부에서 암호 확인 가능

```bash
~$ docker exec fc-jenkins cat /var/jenkins_home/secrets/initialAdminPassword
23b222d9a02c4c218150badffa324e66
~$ docker logs fc-jenkins
...
Jenkins initial setup is required. An admin user has been created and a password generated.
Please use the following password to proceed to installation:
23b222d9a02c4c218150badffa324e66
...
```

## [실습] Jenkins 환경 구성

- 널리 사용되는 **Jenkins plugin 설치 권장**

## [실습] Jenkins 환경 구성

- **Jenkins plugin 설치 2~3분**
- `$ docker logs -f fc-jenkins` 확인

## [실습] Jenkins 환경 구성

- (필수) 모두 채워 넣고 **[Save and Finish]**

## [실습] Jenkins 환경 구성

- Jenkins URL 확인 후 **[Save and Finish]**

## [실습] Jenkins 환경 구성

- Jenkins에 오신 것을 환영합니다.

## [실습] Jenkins + GitHub 연결 구성

### Jenkins Credential을 위한 SSH Key 설정

```bash
# Docker 컨테이너에 접속
docker exec -it fc-jenkins bash

# Jenkins 홈 디렉토리로 이동
cd /var/jenkins_home/

# .ssh 디렉토리 생성 및 이동
mkdir .ssh && cd $_

# SSH 키 생성
ssh-keygen -t rsa -f /var/jenkins_home/.ssh/fc-jenkins
```

### Public Key와 Private Key 생성 확인

```bash
# 생성된 키 파일 확인
ls /var/jenkins_home/.ssh
# 출력 결과: fc-jenkins fc-jenkins.pub

# Private Key 내용 확인
cat /var/jenkins_home/.ssh/fc-jenkins

# Public Key 내용 확인
cat /var/jenkins_home/.ssh/fc-jenkins.pub
```

### Jenkins에서 Credential 생성

1. **Jenkins 관리** 메뉴로 이동
2. **Credentials** 선택
3. **Add Credentials** 클릭
4. **Kind**: SSH Username with private key
   - **Username**: Jenkins 생성 시 만든 계정
   - **Private key**: Enter directly 입력
5. **Create** 버튼 클릭

### GitHub에서 Public Key 등록

1. GitHub Repository의 **Settings** 선택
2. **Deploy keys** 메뉴로 이동
3. **Add deploy key** 클릭
4. **Title**: fc-jenkins
5. **Key**: `fc-jenkins.pub` 파일의 키 값 입력
6. **Add key** 버튼 클릭

### 결과 확인

- Jenkins와 GitHub 간의 SSH 연결이 정상적으로 설정되었음을 확인합니다.

### 실습: Jenkins + GitHub 연결 구성 - Webhook 설정

**Webhooks**란 특정 이벤트(git push, commit 등)가 발생했을 때 서비스나 응용 프로그램으로 알림을 보내주는 기능입니다. (GitHub 플러그인이 설치되어 있으면 사용 가능)

#### Webhook 설정

1. **ngrok 활용**
   - Jenkins가 설치된 VM 주소를 입력하면 연결되지 않기 때문에 **ngrok** 애플리케이션을 사용하여 외부에서 접근할 수 있는 도메인을 사용해야 합니다.

   ```bash
   # ngrok 설치 및 설정
   ch14$ mkdir ngrok && cd $_
   ch14/ngrok$ wget -c https://bin.equinox.io/c/4VmDzA7iaHb/ngrok-stable-linux-amd64.zip
   ch14/ngrok$ unzip ngrok-stable-linux-amd64.zip
   ch14/ngrok$ sudo snap install ngrok
   ```

   - [https://ngrok.com](https://ngrok.com) 회원 가입하여 개인 토큰(add-authtoken)을 받고 사용합니다.

   ```bash
   ch14/ngrok$ ngrok config add-authtoken <your-token>
   ch14/ngrok$ ngrok http 18080
   ```

   - ngrok 주소로 Jenkins에 접속합니다: `https://<ngrok-subdomain>.ngrok-free.app`

2. **Jenkins 설정**
   - Jenkins 관리 > 시스템 설정에서 ngrok 주소를 입력하여 git webhook 연결을 위한 설정을 합니다.

3. **GitHub Webhook 설정**
   - GitHub 저장소의 Settings > Webhooks에서 ngrok 주소를 입력합니다.
   - Payload URL: `https://<ngrok-subdomain>.ngrok-free.app/github-webhook/`
   - Content type: `application/json` 선택
   - SSL verification 활성화

### 실습: Jenkins 환경 구성 - Jenkins Plugin 설치

1. **Jenkins Plugin 설치**
   - Jenkins 관리 > Plugins에서 **Publish Over SSH** 패키지를 검색하여 설치합니다.
   - 설치 후 재시작 시 적용되도록 설정합니다.

   ```bash
   # Jenkins에서 이후 구축할 Production에 접근하기 위해 Publish Over SSH 패키지를 설치
   # Publish Over SSH 검색 → check → Download now and install after restart
   ```

## Jenkins 환경 구성

### Jenkins Plugin 설치

- Jenkins를 재시작하여 **plugin**을 적용합니다.
- 만약 Jenkins가 재시작되지 않으면 다음 명령어를 사용하여 확인 후 시작합니다.

```bash
docker ps -a
docker start fc-jenkins
```

- 동일한 방식으로 **"docker pipeline plugin"**도 설치합니다.

### Docker Credentials 생성

1. **Docker Hub**에서 **Access Token**을 생성합니다.
   - **Account Settings** > **Security** > **New Access Token** 클릭
   - **Access Token Description**에 "docker jenkins" 입력 후 생성

2. Jenkins에서 **Credentials** 추가
   - **Jenkins 관리** > **Credentials** > **System** > **Global credentials (unrestricted)**
   - **Add Credentials** 클릭
   - **Username**: 본인 Docker-ID
   - **Password**: 발급된 token
   - **ID**: docker-access
   - **Description**: DOCKER-CREDENTIALS

### GitHub Credentials 생성

1. **GitHub**에서 **Personal Access Token** 생성
   - **Settings** > **Developer Settings** > **Personal access tokens** > **Generate new token (classic)**
   - **Token** 이름: docker-jenkins

2. Jenkins에서 **Credentials** 추가
   - **Jenkins 관리** > **Credentials** > **System** > **Global credentials (unrestricted)**
   - **Add Credentials** 클릭
   - **Username**: 본인 github-ID
   - **Password**: 발급된 token
   - **ID**: github_access_token

### Jenkins 활용, Image Build 및 자동 배포

- Jenkins에서 Docker Compose를 사용하여 컨테이너를 실행합니다.

```bash
/home/kevin/fastcampus/jenkins/web-count$ cp -r /home/kevin/fastcampus/ch10/web-count .
jenkins/web-count$ ls
app.py docker-compose.yml Dockerfile requirements.txt static templates

jenkins/web-count$ docker compose up -d
```

- 실행 중인 컨테이너 확인

```bash
jenkins/web-count$ docker compose ps
jenkins/web-count$ docker ps
```

## 컨테이너 배포 자동화

컨테이너 배포 자동화를 위한 **Jenkins CI/CD** 구성을 해본다.

### [실습] Jenkins 활용, image build 및 자동 배포

#### Jenkins Container 내부에 Docker 설치

```bash
jenkins/web-count$ docker exec -it -u root fc-jenkins bash
root@1fdd4610161f:/# curl https://get.docker.com/ > dockerinstall && chmod 777 dockerinstall && ./dockerinstall
```

- 설치가 끝나고, `docker ps`를 실행하면 host에서 수행한 결과와 같은 것을 확인할 수 있다.

```bash
root@1fdd4610161f:/# docker ps
```

#### Git webhook 사용을 위한 ngrok 설정

```bash
kevin@hostos1:~$ ngrok http 18080
```

- **Jenkins URL 재설정** (ngrok 유효시간 2h → 따라서 테스트용으로 사용 권장)
- Jenkins Dashboard → Jenkins 관리 → System Configure → System → Jenkins Location

#### 필요한 plugin 설치 list

1. Publish Over SSH
2. Docker Pipeline
3. Generic Webhook Trigger
4. GitHub integration

- Jenkins 관리 → Plugins → Available plugins에서 검색 후 설치
- 설치 완료 후 **Jenkins restart** → Installed plugins에서 확인.

#### GitHub webhook 설정

```bash
jenkins/web-count$ git init
web-count$ git config --global user.email "hylee-kevin@naver.com"
web-count$ git config --global user.name "kevin.lee"
web-count$ git add .
web-count$ git commit -m "web-count first commit"
web-count$ git branch -M master
web-count$ git remote add origin https://github.com/hylee-kevin/web-count
web-count$ git push -u origin master
```

#### Jenkins 환경 구성: docker credentials 생성

- Docker Hub에서 **New Access Token** 생성
  - Access Token Description: docker jenkins
  - Access permissions: Read, Write, Delete

- Jenkins에서 **Add credentials**
  - Username: 본인 Docker-ID
  - Password: docker에서 발급된 token
  - ID: docker-access
  - Description: DOCKER-CREDENTIALS

## Jenkins 환경 구성: GitHub Credentials 생성

GitHub에서 **Personal Access Token**을 생성합니다. 이 토큰은 GitHub API에 접근하기 위해 사용됩니다.

- **Token 이름**: docker-jenkins
- **만료일**: 2023년 8월 17일

Jenkins에서 **New Credentials**를 추가합니다.

- **Username**: 본인 GitHub-ID
- **Password**: GitHub에서 발급된 token
- **ID**: github_access_token
- **Description**: GITHUB-CREDENTIALS

## Jenkins Pipeline 생성 (Docker Build & Docker Push Test)

### Pipeline 생성

1. **새로운 Item** 생성
   - **이름**: web_count_pipeline
   - **종류**: Pipeline

2. **General 설정**
   - **설명**: web count web application CI/CD Test
   - **GitHub 프로젝트**: 체크
   - **Project URL**: `https://github.com/hylee-kevin/web-count.git`

3. **Build Triggers 설정**
   - **GitHub hook trigger for GITScm polling**: 체크

4. **Pipeline 설정**
   - **Definition**: Pipeline script from SCM
   - **SCM**: Git
   - **Repository URL**: `https://github.com/hylee-kevin/web-count.git`
   - **Credentials**: hylee-kevin/******

5. **Branches to build**
   - **Branch Specifier**: `*/master`

6. **Script Path**
   - **Jenkinsfile**

### Jenkinsfile 내용

```groovy
node {
    stage('Clone repository') {
        git credentialsId: 'github_access_token', url: 'https://github.com/hylee-kevin/web-count.git'
    }

    stage('Build image') {
        dockerImage = docker.build("leecloudo/web_count:v1.0")
    }

    stage('Push image') {
        withDockerRegistry([ credentialsId: "docker-access", url: "" ]) {
            dockerImage.push()
        }
    }
}
```

## Jenkins Project 생성 (Docker Build & Docker Push Test)

1. **새로운 Item** 생성
   - **이름**: VM-web-count-deploy
   - **종류**: Freestyle project

## Jenkins Project 설정

### General 설정

- **설명**: base on VM. web count Deployment.
- **GitHub 프로젝트**: 
  - **Project URL**: `https://github.com/hylee-kevin/web-count.git`

### 소스 코드 관리

- **Git** 사용
  - **Repository URL**: `https://github.com/hylee-kevin/web-count.git`
  - **Credentials**: `hylee-kevin/*****`
  - **Branches to build**: `*/master`

### 빌드 유발

- **Build after other projects are built**: 
  - **Projects to watch**: `web_count_pipeline`
  - **Trigger only if build is stable**

### Build Steps

```shell
cd /var/jenkins_home/web-count
docker compose down
docker pull leecloudo/web_count:v1.0
docker compose up -d
```

## Jenkins에서 자동 Build & Deploy 확인

### docker-compose.yml 코드 수정

```yaml
version: '3.3'
services:
  webserver:
    image: leecloudo/web_count:v1.0
    ports:
      - "8899:8899"
    depends_on:
      - redis
  redis:
    image: redis:6.0
```

### index.html 소스 코드 수정

```html
<p>[Jenkins Deploy test -- Version 1]</p>
```

### Git 명령어

```bash
git status
git add .
git commit -m "web-count, build test"
git push -u origin master
```

### Jenkins 대시보드 확인

- **빌드 실행 상태**: 
  - `web_count_pipeline`
  - `VM-web-count-deploy`

### Stage View

- **Clone repository**: 1s
- **Build image**: 2s
- **Push image**: 11s

## 컨테이너 배포 자동화, Jenkins CI/CD

컨테이너 배포 자동화를 위한 **Jenkins CI/CD** 구성을 해본다.

### 실습: Jenkins에서 자동 build & deploy 확인

- **VM-web-count-deploy**: 최근 성공 11초, 최근 실패 3분 31초, 최근 소요 시간 8.9초
- **web_count_pipeline**: 최근 성공 5분 17초, 최근 실패 6분 50초, 최근 소요 시간 1분 4초

[그림: Jenkins Dashboard]
Jenkins 대시보드에서 각 파이프라인의 상태와 소요 시간을 확인할 수 있다.

[그림: Docker Application]
현재 방문 수와 Jenkins 배포 테스트 버전 정보를 보여주는 Docker 애플리케이션 화면.

## 컨테이너 배포 자동화(CI/CD) 프로젝트

### [실습] VM 기반의 3-Tier 컨테이너 CI/CD MSA 구성

#### mydiary 3-tier MSA project (VM-based)

- **Jenkins**는 clip1에서 사용한 **fc-jenkins** 컨테이너를 사용한다.
- 실습 내용은 ch10의 실습 자료를 재구성하여 활용한다.
  - 소스 코드를 Jenkins 컨테이너에 복사: `/home/kevin/fastcampus/Jenkins`
- **webhook**을 위한 **ngrok URL**을 Jenkins 관리의 system과 GitHub repository에 설정한다.
- 프로젝트의 **Jenkins pipeline**과 **free project**를 생성한다.
- Git source를 변경하여 Jenkins pipeline 자동 배포를 확인한다.

```bash
# Jenkins는 clip1에서 사용한 fc-jenkins 컨테이너를 사용한다.
~$ docker ps
46519e6afa26 jenkins/jenkins:lts ...

# ch10의 my-diary-3 디렉터리의 소스를 가져온다.
~/fastcampus/jenkins$ cp -r /home/kevin/fastcampus/ch10/my-diary-3 .

# 실습은 frontend 소스 수정을 CI/CD로 배포하는 것을 기준으로 한다.
~/fastcampus/jenkins/my-diary-3$ docker images | grep mydiary
mydiary-back 1.0 ...
mydiary-front 1.0 ...
```

- GitHub Repository 생성 후 소스를 업로드하고, Settings에서 webhook 설정.

[그림: GitHub Repository]
GitHub Repository 설정 화면에서 webhook을 설정하는 방법을 보여준다.

- Webhook을 위한 **ngrok**을 실행하고, public URL을 등록한다.

[그림: Webhook 설정]
Webhook 설정 화면에서 ngrok을 통해 생성된 public URL을 등록하는 방법을 설명한다.

#### Jenkins 관리

- Jenkins URL과 System Admin e-mail address 설정.

[그림: Jenkins 관리]
Jenkins 관리 화면에서 시스템 설정을 통해 URL과 이메일 주소를 설정하는 방법을 보여준다.

#### Jenkinsfile 구성

```groovy
node {
    stage('Clone repository') {
        git credentialsId: 'github_access_token', url: 'https://github.com/hylee-kevin/jenkins-mydiary-msa.git'
    }
    stage('Build image') {
        dockerImage = docker.build("leecloudo/mydiary-front:2.0")
    }
    stage('Push image') {
        withDockerRegistry([ credentialsId: "docker-access", url: "" ]) {
            dockerImage.push()
        }
    }
}
```

## VM 기반의 MSA 구성

### 실습: mydiary 3-tier MSA 프로젝트 (VM 기반)

#### Jenkins 파이프라인 설정

1. **새로운 Item 생성**
   - 이름: `mydiary-msa-pipeline`
   - 유형: **Pipeline** 선택

2. **일반 설정**
   - 설명: `mydiary 3-tier MSA pipeline.`
   - GitHub 프로젝트 URL: `https://github.com/hylee-kevin/jenkins-mydiary-msa.git`

3. **빌드 트리거 설정**
   - **GitHub hook trigger for GITScm polling** 활성화

4. **파이프라인 설정**
   - 정의: **Pipeline script from SCM**
   - SCM: **Git**
   - Repository URL: `https://github.com/hylee-kevin/jenkins-mydiary-msa.git`
   - Credentials: `hylee-kevin/****** (GITHUB-CREDENTIALS)`
   - Branch Specifier: `*/master`
   - Script Path: `Jenkinsfile`

#### 두 번째 프로젝트 설정

1. **새로운 Item 생성**
   - 이름: `mydiary-msa-projectt`
   - 유형: **Freestyle project** 선택

2. **일반 설정**
   - 설명: `mydiary 3-tier MSA project.`
   - GitHub 프로젝트 URL: `https://github.com/hylee-kevin/jenkins-mydiary-msa.git`

3. **소스 코드 관리**
   - SCM: **Git**
   - Repository URL: `https://github.com/hylee-kevin/jenkins-mydiary-msa.git`
   - Credentials: `hylee-kevin/****** (GITHUB-CREDENTIALS)`
   - Branch Specifier: `*/master`

4. **빌드 유발**
   - **Build after other projects are built** 활성화
   - Projects to watch: `mydiary-msa-pipeline`

5. **빌드 단계**
   - **Execute shell** 명령어:
     ```bash
     cd /var/jenkins_home/my-diary-3
     docker compose down
     docker pull leecloudo/mydiary-front:2.0
     docker compose up -d
     ```

## [실습] mydiary 3-tier MSA project (VM-based)

### 소스코드 변경을 통한 Jenkins CI/CD 확인

```bash
jenkins/my-diary-3$ vi public/index.ejs
```

```html
<h2>Docker class diary -kevin-</h2>  # 수정
```

```bash
jenkins/my-diary-3$ git status
jenkins/my-diary-3$ git add .
jenkins/my-diary-3$ git commit -m "mydiary msa commit"
jenkins/my-diary-3$ git push -u origin master
```

### 빌드 실행 상태

- **mydiary-msa-pipeline**: 최근 성공 없음
- **mydiary-msa-projectt**: 최근 성공 없음
- **VM-web-count-deploy**: 최근 성공 3 hr 39 min, 최근 소요 시간 23 sec
- **web_count_pipeline**: 최근 성공 3 hr 39 min, 최근 소요 시간 25 sec

### Pipeline mydiary-msa-pipeline

- **Stage View**:
  - Clone repository: 1s
  - Build image: 34s
  - Push image: 20s

## [실습] 다양한 AWS 서비스 기반의 CI/CD 환경 구축

- 사용되는 AWS 서비스: **Cloud9**, **ECR**, **SQS**, **SNS**, **CodeCommit**

### AWS의 개발도구인 Cloud9 환경에서 Jenkins 구성

```bash
ec2-user:~/fastcampus/jenkins/jenkins_image (main) $ ls
docker-compose.yaml Dockerfile

ec2-user:~/fastcampus/jenkins/jenkins_image (main) $ vi Dockerfile
```

```dockerfile
FROM jenkins/jenkins:lts
USER root
RUN apt-get update && \
    apt-get -y install apt-transport-https \
    ca-certificates \
    curl \
    gnupg2 \
    zip \
    unzip \
    software-properties-common && \
    curl -fsSL https://download.docker.com/linux/debian/gpg | apt-key add - && \
    add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/debian $(lsb_release -cs) stable" && \
    apt-get update && \
    apt-get -y install docker-ce
```

# 다양한 AWS 서비스 기반의 CI/CD 환경 구축

## 실습: AWS Cloud9 환경에서 Jenkins 구성

### Docker Compose 설정

```yaml
version: '3.3'
services:
  jenkins:
    build:
      context: .
    container_name: jenkins
    user: root
    restart: always
    ports:
      - 18080:8080
      - 50000:50000
    volumes:
      - /home/ec2-user/jenkins_home:/var/jenkins_home
      - /var/run/docker.sock:/var/run/docker.sock
```

- **docker compose up -d** 명령어를 통해 이미지가 자동으로 빌드됩니다.

### Jenkins 실행 및 접속

- **docker compose ps** 명령어로 Jenkins 컨테이너 상태를 확인합니다.
- EC2의 Public IP 주소와 Jenkins의 외부 연결 포트를 통해 접속을 시도합니다.
  - 예: `http://15.164.237.24:18080`

### 보안 그룹 설정

- 보안 그룹의 인바운드 규칙에 외부로부터 들어오는 **18080 포트**에 대한 허용이 필요합니다.

### Jenkins 초기 설정

- Jenkins에 접속하여 초기 설정을 진행합니다.
- `/var/jenkins_home/secrets/initialAdminPassword` 파일에서 관리자 비밀번호를 확인합니다.

## 컨테이너 서비스 게시

### My-Diary-3 소스 이용

- **docker compose up -d** 명령어로 컨테이너 서비스를 게시합니다.
- **docker compose ps** 명령어로 서비스 상태를 확인합니다.

### 인바운드 규칙 편집

- 포트 **3000**에 대한 인바운드 규칙을 추가하여 외부 접속을 허용합니다.

## AWS CodeCommit 설정

- **AWS CodeCommit**은 private Git repository를 호스팅하는 서비스입니다.
- 리포지토리를 생성하고, Git 기반 도구와 연동합니다.

### 리포지토리 생성

- 리포지토리 이름: **mydiary-repo**
- 설명: **mydiary CICD repository**

### Git 자격 증명 생성

- **IAM 사용자**를 위한 Git 자격 증명을 생성합니다.
- AWS CLI를 통해 자격 증명을 설정합니다.

## 다양한 AWS 서비스 기반의 CI/CD 환경 구축

### 사용자 세부 정보 지정

- **CodeCommit**에 대한 HTTPS Git 자격증명 생성을 위해 사용자를 생성합니다.

### 권한 설정

- **AWSCodeCommitPowerUser** 권한을 연결합니다.

### 검토 및 생성

- 사용자 정보를 검토하고 **사용자 생성**을 완료합니다.

### 암호 검색

- 생성된 사용자의 암호를 확인하고 다운로드합니다.

### 보안 자격 증명

- **AWS CodeCommit**에 대한 HTTPS Git 자격 증명을 생성합니다.
- 생성된 자격 증명을 다운로드하여 **Cloud9**에서 사용합니다.

### 리포지토리 복제

1. **Git 클라이언트**를 사용하여 **CodeCommit** 리포지토리를 복제합니다.
   ```bash
   git clone https://git-codecommit.ap-northeast-2.amazonaws.com/v1/repos/mydiary-repo
   ```

### 소스 코드 이동

- 소스 코드를 **CodeCommit** 리포지토리로 이동합니다.
  ```bash
  jenkins-mydiary-msa (master) $ ls
  app.js docker-compose.yaml Dockerfile fastcampus.png Jenkinsfile mydiary-repo
  package.json package-lock.json public

  mydiary-repo (master) $ git add .
  mydiary-repo (master) $ git commit -m "mydiary commit"
  mydiary-repo (master) $ git push
  ```

### 업로드 확인

- **mydiary-repo**에 업로드된 소스 파일을 확인합니다.

## 다양한 AWS 서비스 기반의 CI/CD 환경 구축

### 리포지토리 생성

- **mydiary-repo** 생성
  - Amazon ECR에서 프라이빗 리포지토리로 설정

### Jenkins와 AWS CodeCommit 연결

- 필요한 플러그인 설치
  - AWS CodeCommit
  - Trigger SQS trigger
  - Pipeline: AWS Steps
  - Amazon ECR
  - Docker pipeline
  - AWS Global Configuration

### SNS 주제 생성

- **mydiary-topic** 주제 생성
  - Amazon SNS에서 주제 생성
  - FIFO(선입선출)와 표준 유형 중 선택 가능

### SQS 대기열 생성

- **mydiary-event-queue** 생성
  - 표준 유형 선택

### SNS 주제 구독

- Amazon SNS 주제를 SQS 대기열에 구독

### CodeCommit 트리거 설정

- **mydiary-git-push-trigger** 생성
  - 이벤트: 기존 브랜치로 푸시
  - 브랜치: master
  - 서비스: Amazon SNS

### Jenkins에 자격증명 생성

- CodeCommit Credentials 정보 생성
  - 자격증명 생성 파일 참고하여 로그인
- AWS access, Docker 자격증명 정보 생성
  - AWS Credentials와 Docker Credentials 설정

### 글로벌 자격증명 설정

- **Global credentials (unrestricted)** 설정
  - 다양한 자격증명을 생성하여 Jenkins에서 사용 가능하도록 설정합니다.

| ID              | Name                                      | Kind                    | Description                  |
|-----------------|-------------------------------------------|-------------------------|------------------------------|
| AWS-CODECOMMIT  | fcuser-at-594682333406/****** (AWS-CODECOMMIT-CREDENTIALS) | Username with password  | AWS-CODECOMMIT-CREDENTIALS   |
| AWS-ACCESS      | AKIAYU5OUJDPLRKHK454 (AWS-ACCESS-CREDENTIALS) | AWS Credentials         | AWS-ACCESS-CREDENTIALS       |
| docker-access   | leecloudo/****** (DOCKER-CREDENTIALS)     | Username with password  | DOCKER-CREDENTIALS           |

### Jenkins 파이프라인 생성

- **파이프라인 생성**: Jenkins에서 새로운 파이프라인을 생성합니다.
  - **Item Name**: `mydiary-pipeline`
  - **GitHub 프로젝트**: AWS CodeCommit Repository URL을 복사하여 붙여넣습니다.

### 빌드 트리거 설정

- **AWS SQS Trigger** 설정
  - **Queue URL**: `https://sqs.ap-northeast-2.amazonaws.com/594682333406/mydiary-event-queue`
  - **AWS Credentials**: AWS-ACCESS-CREDENTIALS 사용

### 파이프라인 정의

- **SCM 설정**: Git을 사용하여 파이프라인 스크립트를 가져옵니다.
  - **Repository URL**: `https://git-codecommit.ap-northeast-2.amazonaws.com/v1/repos/mydiary-repo`
  - **Credentials**: AWS-CODECOMMIT-CREDENTIALS 사용

- **브랜치 설정**: `*/master` 브랜치 빌드
- **스크립트 경로**: `Jenkinsfile`

### Jenkinsfile 생성

```groovy
pipeline {
    agent any
    stages {
        stage('Build') {
            steps {
                sh 'docker build -t mydiary-repo .'
            }
        }
        stage('Tag') {
            steps {
                sh 'docker tag mydiary-repo:latest 594682333406.dkr.ecr.ap-northeast-2.amazonaws.com/mydiary-repo:1.0'
            }
        }
        stage('Push') {
            environment {
                AWS_ACCESS_KEY_ID = credentials('awsaccess')
                AWS_SECRET_ACCESS_KEY = credentials('awssecret')
            }
            steps {
                sh 'aws ecr get-login-password --region ap-northeast-2 | docker login --username AWS --password-stdin 594682333406.dkr.ecr.ap-northeast-2.amazonaws.com'
                sh 'docker push 594682333406.dkr.ecr.ap-northeast-2.amazonaws.com/mydiary-repo:1.0'
            }
        }
    }
}
```

### 소스 변경 및 자동 배포 확인

- **소스 변경**: `public/index.ejs` 파일 수정
  - `<h2>Docker class diary -AWS-</h2>`

- **Git 명령어**:
  ```bash
  git add .
  git commit -m "mydiary cc commit"
  git push
  ```

### 빌드 결과 확인

- **빌드 상태**: 빌드 #2 성공
  - **빌드 시간**: 12초 소요
  - **변경 사항**: 커밋 `7a6879d`

### CodeCommit 변경 사항

- **커밋 메시지**: `mydiary cc commit`
- **변경 파일**: `public/index.ejs`
  - `<h2>Docker class diary -AWS-</h2>`로 변경

### 웹 페이지 확인

- **변경 전**: Docker class diary -kevin-
- **변경 후**: Docker class diary -AWS-
```

```
## 마무리

여기까지~

한 번에 끝내는 **CI/CD Docker 컨테이너 빌드업** 강의를 진행한 "이현용"이었습니다.

수고하셨습니다!~