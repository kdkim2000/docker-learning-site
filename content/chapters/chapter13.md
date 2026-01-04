# 클라우드 기반의 의 Amazon ECS 서비스 활용

### 1. Amazon ECS 및 ECR 이해

**Amazon ECS (Elastic Container Service)**

- 컨테이너화된 애플리케이션을 배포, 관리, 스케일링할 수 있도록 도와주는 완전 관리형 컨테이너 오케스트레이션 서비스입니다.
- Amazon ECS 기반 애플리케이션들은 간단한 API 호출을 이용하여 컨테이너 애플리케이션 운영, 관리를 손쉽게 할 수 있고, 단일 컨테이너부터 수천 개의 컨테이너까지 복잡한 과정 없이 확장 가능합니다.
- 이를 통해 개발자 및 운영자는 마이크로 서비스 기반의 다중 컨테이너 애플리케이션 설계, 구축 및 실행에 집중할 수 있습니다.

**Amazon ECS**

- **Serverless 방식**으로 클라우드 인프라에서 애플리케이션을 호스팅하는 Fargate 방식
  - AWS Cloud 인프라의 가상 환경인 firecracker 기반의 serverless container compute engine
- 직접적인 클러스터 관리(모든 리소스 관리)를 강화하기 위해 Amazon EC2 인스턴스를 서버로 구성한 Docker 기반 서비스 인프라를 호스팅하는 방식

[그림: Amazon ECS 아키텍처]
- Amazon EC2와 AWS Fargate를 통해 애플리케이션을 호스팅
- Dockerfile로 생성된 이미지를 저장하는 registry, ECR

### Amazon ECS 구성 요소

- **ECS Cluster**
  - 작업(task) or 서비스(service)의 논리적 그룹으로 EC2기반 or Fargate 선택 구성
  - 작업을 배포하기 위한 인스턴스의 집합

- **Service**
  - ECS cluster에서 지정된 수의 작업(task)을 동시에 실행, 관리하는 구성요소
  - service는 작업을 포함, task와 관련된 클러스터, 작업정의, 시작유형, LB, ASG, 배포 유형 등을 관리
  - Kubernetes의 deployment, replicaSet과 동일한 기능 수행

- **Task**
  - task definition(작업 정의서)에 정의된 설정으로 컨테이너 인스턴스(EC2 or Fargate)에 배포됨
  - 하나 이상의 컨테이너를 실행하는 최소 단위 (작업 정의 내용을 기반으로 배포된 컨테이너들)

## Amazon ECS 구성 요소

### Task Definition
- 애플리케이션 컨테이너의 명세서(JSON), 작업(task)을 실행하기 위한 명세 기술, `docker run`과 유사.
- 시작유형, 사용할 컨테이너 이미지, 노출 포트, 리소스 사용량(CPU, memory), 볼륨구성 등.

### ECR
- AWS Cloud의 컨테이너 이미지 저장소 (hub.docker.com과 같은 역할).
- ECR에서 제공하는 이미지 URI를 이용해 빌드된 이미지를 pull, push.

### ECS Console
- ECS 클러스터 관리도구로 모니터링 및 제어 수행 (Kubernetes의 master node(control plane)과 동일).
- 컨테이너 인스턴스(EC2)는 Kubernetes의 worker node와 동일.

## Amazon ECR 구성 요소

### Registry
- Amazon ECR private registry는 각 AWS 계정 단위로 제공되며 registry에 하나 이상의 Repository를 생성하고 이 Repository에 생성한 이미지를 저장할 수 있다.

### Repository
- Amazon ECR Repository에는 Docker 이미지, Open Container Initiative(OCI) 이미지 및 OCI 호환 Artifact가 포함됨.

### Repository Policy
- Repository or Repository는 Docker image에 대한 Access control 관리를 수행할 수 있다.

### Image
- Repository에 컨테이너 이미지를 push / pull 할 수 있고, 개발 시스템에서 로컬로 이러한 이미지를 사용하거나, Amazon ECS 태스크 정의 및 Amazon EKS Pod spec에서 사용 가능하다.

### 사용자 권한 토큰
- Client는 Amazon ECR Registry에 AWS 사용자로서 인증을 해야 Image를 push/pull 가능 하다.

### 제공 기능
- 수명 주기 정책
- 이미지 취약점 점검 스캔 기능
- 교차 리전 및 교차 계정 복제

## AWS Cloud 컨테이너 관련 서비스

- 코드 작성: 코드를 Docker 이미지로 작성 및 패키징.
- 이미지 압축 및 암호화, 이미지에 대한 액세스 권한 제어.
- 이미지 수명 주기의 버전 관리, 태깅 및 관리.
- 컨테이너 실행: 어디에서나 이미지를 풀하고 컨테이너 실행.


### EC2가 적합한 경우
- 각 컨테이너들이 동일한 공유 디스크를 사용해야 하는 경우
- 세밀한 인스턴스 세팅이 필요한 경우
- 항상 실행되는 웹서버

### Fargate가 적합한 경우
- 단기간에 엄청난 CPU 연산이 필요한 경우
- 5분 이상의 Lambda 실행이 필요한 경우
- 주기적으로 잠깐만 실행되는 웹크롤러

## Amazon EKS
- **Amazon EKS**를 사용하면 AWS에서 Kubernetes를 손쉽게 실행할 수 있음
- EKS 클러스터 프로비저닝
- AWS Fargate: 서버리스 컨테이너 배포
- Amazon EC2: EKS 클러스터에 대한 작업자 노드 배포
- EKS에 연결하여 Kubernetes 앱 실행

## 클라우드 기반의 Amazon ECS 서비스 활용

### ECS architecture
- 클라우드 설계도의 컨테이너 서비스는 **nginx**와 **django**를 이용한 Clip3에 사용하는 실습 구성도이다.
- 이번 2.Clip에서는 ECS를 구축하고 샘플로 **nodejs** 컨테이너 서비스를 실습해 본다.

## Amazon ECS 구성

### Amazon ECS를 구성해 본다

- **AWS 관리 콘솔**에 본인 계정으로 로그인 한다.
- ECS 서비스 배포를 위한 **AWS 네트워크** 구성
  - 상단 [서비스]에서 **VPC 서비스**를 검색
  - VPC 서비스 선택
  - **VPC 생성** 클릭

### VPC 생성

- [VPC 등] 선택
- 이름 태그: **ecs**
- 기본 **CIDR**: 10.0.0.0/16

### 서브넷 구성

- **Public subnet** * 2
- **Private subnet** * 2
- CIDR은 화면처럼 작성한다.
  - 10.0.1.0/24
  - 10.0.2.0/24
  - 10.0.3.0/24
  - 10.0.4.0/24

### NAT 게이트웨이 및 VPC 엔드포인트

- **NAT 게이트웨이**는 1개의 AZ에서 생성.
- VPC 엔드포인트 없음
- [VPC 생성]

### 설정 결과

- 설정 결과 **preview**
  - VPC: ecs-vpc
  - 서브넷(4개): ap-northeast-2a, ecs-subnet-public1-ap-northeast-2a, ecs-subnet-private1-ap-northeast-2a, ap-northeast-2b, ecs-subnet-public2-ap-northeast-2b, ecs-subnet-private2-ap-northeast-2b
  - 라우팅 테이블(3개): ecs-rtb-public, ecs-rtb-private1-ap-northeast-2a, ecs-rtb-private2-ap-northeast-2b
  - 네트워크 연결(2개): ecs-igw, ecs-nat-public1-ap-northeast-2a

## Amazon ECS 구성

### VPC 워크플로 생성

- **VPC 워크플로 생성**
  - 생성 완료되면 [VPC 보기] 선택

### 생성 결과 확인

- **생성 결과 확인**
  - VPC ID: vpc-0cb977659537e963c
  - 상태: Available
  - CIDR: 10.0.0.0/16

### 보안 그룹 생성

- 각 보안 그룹에 속한 인스턴스는 인바운드 규칙에서 허용된 트래픽만 접근할 수 있다.
- 애플리케이션 로드 밸런서(ALB)가 외부의 HTTP 요청을 수신하기 위한 보안 그룹과 ECS에서 생성한 웹 서비스 인스턴스가 ALB로부터 오는 트래픽만을 수신하기 위한 보안 그룹을 생성한다.

#### 보안 그룹 생성

- 보안 그룹 이름은 **ecs-sg-alb**
- 설명은 **allow http**
- VPC는 **ecs-vpc**
- 인바운드 규칙 추가

#### 인바운드 규칙 설정

- HTTP 0.0.0.0/0만 허용하는 규칙 추가
- 보안 그룹 생성 완료

## Amazon ECS 구성

### 보안 그룹 생성

- **ecs-sg-instance** 보안 그룹 생성
- **ecs-vpc** 선택
- 인바운드 규칙 추가
  - 유형: **HTTP**
  - 소스: **ecs-sg-alb**
- 프라이빗 영역으로 트래픽을 보내기 위해 퍼블릭 영역의 보안 그룹인 **ecs-sg-alb**를 선택하여 보안 그룹 체이닝을 구성한다.

### 로드 밸런서 생성

- 외부로부터 오는 요청을 분배하고 배포된 웹 서비스에 전달하기 위해 **ALB**를 생성한다.
- **EC2** 영역으로 서비스 이동
- [Create Load Balancer] 버튼 클릭

### ALB 선택 및 생성

- **ALB [Create]** 선택

### 애플리케이션 로드 밸런서 설정

- 기본 구성에 이름 **(ecs-alb)** 입력, 나머지는 기본 값 사용

### 네트워크 매핑

- 부하 분산기는 외부 인터넷 망으로 연결되기 때문에 사전에 구성한 **VPC(ecs-vpc)** 선택
- 2개의 가용영역 **ap-northeast-2a**와 **ap-northeast-2c**가 제공된다.
- 이때 외부 연결이 가능한 퍼블릭 서브넷을 선택해야 한다. 만일 프라이빗 서브넷으로 선택하면 경고 메시지가 출력된다.

## Amazon ECS 구성

### 보안 그룹 설정

- 보안 그룹은 앞서 생성한 외부 연결이 가능한 **ecs-sg-alb**를 선택한다.
- 기본으로 선택되어 있는 보안 그룹은 선택 해제한다.

### 리스너와 라우팅 설정

- **리스너**는 구성한 프로토콜과 포트를 사용하여 연결 요청을 확인하는 과정이다.
- 리스너가 수신한 트래픽은 **대상 그룹**으로 라우팅된다.
- 태그에는 이름(Name) 키와 **ecs-alb** 값으로 채운다.
- 대상 그룹 생성 선택

### 대상 그룹 설정

- 대상 유형 선택에서 특정 VPC 내에서 동작하는 인스턴스로 로드밸런싱 지원을 위한 **[인스턴스]**를 선택하고,
- 대상 그룹 이름으로 **ecs-target-group**을 입력하고 VPC가 **ecs-vpc**로 선택되어 있는 것을 확인하거나 직접 선택한다.

### 상태 확인 및 태그 설정

- 하단의 상태 확인은 등록된 대상의 상태를 점검하기 위한 일종의 **헬스 체크** 기능이다.
- 기본값으로 두고, 태그에 키에 Name과 값은 **ecs-target-group**을 입력하고 [다음] 버튼을 클릭한다.

### 등록 대상 설정

- 등록 대상(Register Targets)과 대상(Targets)은 아무것도 설정하지 않고 [다음]으로 넘어간다.
- 대상 그룹 생성

### 대상 그룹 생성 확인

- 대상 그룹 생성을 확인하고, 다시 로드 밸런서 생성 창으로 돌아간다.

### 리스너 및 라우팅 설정

- 리스너 및 라우팅 화면에서 리프레시 버튼을 클릭하면 생성한 **ecs-target-group**이 나타난다.

### 로드 밸런서 생성

- 로드 밸런서 생성의 요약을 확인한 뒤 [로드 밸런서 생성]을 클릭한다.
- 로드 밸런서 성공 메시지가 상단에 출력되면 [로드 밸런서 보기] 버튼을 클릭한다.
- 애플리케이션 로드 밸런서 **ecs-alb** 생성을 확인한다. 생성 직후에는 "프로비저닝 중" 메시지가 나오고 대략 1분 뒤에 "Active" 상태로 변경된다.

### Cloud9 환경 설정

- 배포될 웹 서비스의 **docker image**를 빌드하고 업로드(push)하기 위해 AWS에서 제공하는 개발환경인 **Cloud9** 환경을 생성해 보자.
- Cloud9 환경에서 사용하는 EC2 인스턴스가 ECR에 접근해 컨테이너 이미지를 올리기 위해 **"AmazonEC2ContainerRegistryFullAccess"** 권한 정책을 가진 IAM을 생성한다.

### 신뢰할 수 있는 엔터티 선택

- 신뢰할 수 있는 유형의 개체 선택에서 AWS 서비스 선택, 사용 사례 선택에서 EC2 선택 후 오른쪽 하단의 다음: 권한 버튼을 클릭한다.

## Amazon ECS 구성

### 권한 정책 연결

- 권한 정책 연결에서 정책 필터에 **AmazonEC2ContainerRegistryFullAccess** 입력, 해당 정책 선택 후 오른쪽 하단의 다음 클릭한다.

### 역할 생성

- 역할 이름: **ecs-workshop-ECRFullAccessRole**
- 검토 후 태그 입력
- 역할 생성

### AWS Cloud9 환경 설정

- **Cloud9 서비스**로 이동
- 환경 생성

### 환경 생성 세부 정보

- 이름: **ecs-workshop** 입력
- 새로운 EC2 인스턴스 선택
- **t3.small** (t2.micro는 제한 있음)

### 네트워크 설정

- VPC: **ecs-vpc**
- Subnet: **ecs-public-subnet-1**
- 연결은 사용자 선택
- 생성

## Amazon ECS 구성

### Amazon ECS를 구성해 본다

- **AWS EC2**로 이동 후 왼쪽 메뉴 항목에서 **인스턴스** 선택
- `aws-cloud9-ecs-workshop` 인스턴스 선택 후 오른쪽 상단의 **작업 -> 보안 -> IAM 역할 수정** 버튼을 클릭한다.

### IAM 역할 설정

- **IAM 역할**: `ecs-workshop-ECRFullAccessRole`
- 선택 후 오른쪽 하단의 **IAM 역할 업데이트** 클릭한다.

### Cloud9 설정

- **Cloud9 열기**
- Cloud9 environment 창으로 돌아온 후 오른쪽 상단의 톱니바퀴 모양 **Preferences -> AWS SETTINGS -> Credentials**로 이동
- **AWS managed temporary credentials** off 처리한다.
- 이 설정은 임시 자격 증명을 제거하는 작업이다.

### 임시 자격 증명 삭제 및 환경 설정

- **Preferences** 탭을 닫은 후 기존의 임시 자격 증명(temporary credentials)을 삭제한다.
- 현재 Cloud9 environment가 `ecs-workshop-ECRFullAccessRole`을 사용하는지 확인한다.
- **기본 리전 지정** 및 **소스 다운로드**를 진행한다.

```bash
ec2-user:~/environment $ rm -vf ${HOME}/.aws/credentials
ec2-user:~/environment $ aws sts get-caller-identity --query Arn | grep ecs-workshop
ec2-user:~/environment $ aws configure set default.region ap-northeast-2
ec2-user:~/environment $ aws configure get default.region
ec2-user:~/environment $ git clone https://github.com/hylee-kevin/fastcampus.git
```

## Amazon ECS 구성

### 컨테이너 이미지 저장소 생성

- 컨테이너 이미지를 저장하기 위한 저장소를 CLI 기반으로 생성한다.

```bash
ec2-user:~/environment $ aws ecr create-repository --repository-name nodejs
```

```json
{
  "repository": {
    "repositoryUri": "594682333406.dkr.ecr.ap-northeast-2.amazonaws.com/nodejs",
    "imageScanningConfiguration": {
      "scanOnPush": false
    },
    "encryptionConfiguration": {
      "encryptionType": "AES256"
    },
    "registryId": "594682333406",
    "imageTagMutability": "MUTABLE",
    "repositoryArn": "arn:aws:ecr:ap-northeast-2:594682333406:repository/nodejs",
    "repositoryName": "nodejs",
    "createdAt": 1689255045.0
  }
}
```

- `repositoryUri` 중 "594682333406.dkr.ecr.ap-northeast-2.amazonaws.com" 부분은 추후에 Dockerfile을 빌드한 후 컨테이너 이미지를 ECR에 push할 때 사용되므로 복사해 둔다.

### 생성한 Repository 확인

- Repositories 선택 후 생성한 Repository를 확인한다.
- `nodejs`를 클릭해 보면 현재는 비어있다.

### Docker 설치 확인

- Docker 설치를 확인한다.

```bash
ec2-user:~ $ sudo yum update -y
ec2-user:~ $ sudo yum install docker
```

- Docker 버전을 확인한다.

```bash
ec2-user:~ $ docker version
```

### Node.js 이미지 빌드

- Node.js 이미지를 빌드한다.

```bash
ec2-user:~/fastcampus/ch09/nodejs (main) $ docker build -t nodejs:1.0 .
ec2-user:~/fastcampus/ch09/nodejs (main) $ docker images
```

### AWS ECR에 대한 Docker client 인증

- ECR에 로그인한다.

```bash
# ECR에 Login
ec2-user:~ $ aws ecr get-login-password --region ap-northeast-2 | docker login --username AWS --password-stdin 594682333406.dkr.ecr.ap-northeast-2.amazonaws.com
```

- 계정 ID를 확인한다.

```bash
# account ID 확인
ec2-user:~ $ aws sts get-caller-identity --query Account --output text
```

### ECR에 이미지 업로드

- ECR에 이미지를 업로드한다.

```bash
~$ docker image tag nodejs:1.0 594682333406.dkr.ecr.ap-northeast-2.amazonaws.com/nodejs:1.0
~$ docker push 594682333406.dkr.ecr.ap-northeast-2.amazonaws.com/nodejs:1.0
```

- ECS Task Definition 생성에서 URI 사용, 복사해 둔다.

# Amazon ECS 구성

## Amazon ECS를 구성해 본다

### ECS 서비스 검색 및 선택
- 상단 **[서비스]**에서 ECS 서비스를 검색
- **ECS 서비스** 선택
- 이전 버전으로 수행
- **클러스터** 클릭
- 클러스터 생성

### 클러스터 생성
- 이전 버전의 클래식 화면에서 클러스터 생성

### 클러스터 플랫폼 선택
- **클러스터 플랫폼** 선택
- **EC2 Linux** 선택

### 클러스터 구성
- 이름: `ecs-cluster`
- 온디맨드 인스턴스
- `t3.medium` 권장
- 인스턴스 개수: 2
- 나머진 기본값

### 네트워킹 설정
- **VPC**: `ecs-vpc`
- **서브넷**: `ecs-private-subnet-1`, `ecs-private-subnet-2`
- **보안 그룹**: `ecs-sg-instance`

## Amazon ECS 구성

### Amazon ECS를 구성해 본다

- 사전에 설정한 IAM 역할 사용
- 태그 지정 Name: `ecs-cluster`
- [생성]

### 클러스터 생성

- 클러스터 생성 완료
- 클러스터 보기 선택

### 클러스터 상태 확인

- 현재 작업은 없음
- 상태 **Active** 확인

### 작업 정의 생성

- 새 작업 정의 생성 버튼을 클릭한다.

### 시작 유형 호환성 선택

- 시작 유형 호환성 선택에서 **EC2**를 선택한다.

## Amazon ECS 구성

### 작업 및 컨테이너 정의 구성

- **작업 정의 이름**: ecs-task
- **호환성 요구 사항**: EC2
- **태스크 역할**: 선택
- **네트워크 모드**: 기본값

### 컨테이너 추가

- **컨테이너 이름**: nodejs-app
- **이미지**: ECR에 저장한 이미지의 URI 입력
- **메모리 제한**: 500 MiB
- **포트 매핑**: 3000:3000

### 컨테이너 정의 확인

- 컨테이너 정의를 확인하고 하단의 **[생성]** 버튼 클릭

### 작업 정의의 활성 상태 확인

- 작업 정의가 **ACTIVE** 상태인지 확인 (ecs-task)
- **[클러스터]** 화면으로 이동

## Amazon ECS 구성

### 서비스 생성

1. **클러스터** 화면에서 `ecs-cluster` 클릭
2. 생성된 `ecs-cluster` 정보와 함께 하단의 **서비스** 탭의 [생성] 버튼 클릭

### 서비스 구성

- **시작 유형**: EC2
- **작업 정의**: ecs-task
- **패밀리**: ecs-task
- **개정**: 제공
- **클러스터**: ecs-cluster
- **서비스 이름**: ecs-service
- **서비스 유형**: REPLICA
- **작업 개수**: 2

나머지는 기본값으로 두고 오른쪽 하단의 [다음 단계] 버튼 클릭

### 상태 검사 및 로드 밸런서 설정

- **상태 검사 유예 기간**: 300 입력
- **로드 밸런서 유형**: Application Load Balancer
- **기존 ecs-alb 선택** 후 [로드밸런서에 추가]

### 로드 밸런싱할 컨테이너 설정

- **컨테이너 이름**: nodejs-app:3000
- **프로덕션 리스너 포트**: 80:HTTP
- **프로토콜**: HTTP
- **대상 그룹 이름**: ecs-target-group

하단 [다음 단계] 클릭

## Amazon ECS 구성

### Auto Scaling 설정

- **기본 값**으로 다음 단계 클릭

### 네트워크 구성 확인

- **구성 정보** 확인 후
- **[서비스 생성]** 클릭
- **[서비스 보기]** 클릭

### 서비스 생성 확인

- 서비스 생성 확인
- 약 20초 뒤에 **[마지막 상태]** 값이 **RUNNING** 확인

### EC2 서비스로 이동

- 이전에 생성한 로드 밸런싱 선택 **ecs-alb**
- **DNS 주소**를 통해 ECS의 컨테이너에 접근 시도

### 문제 해결

- DNS 주소로 웹 접속 시도 시 **504 에러**가 발생한다면...

## Amazon ECS 구성

- **ALB**를 통해 **HTTP(80)**으로 접속이 이루어진다.
- 그 뒤 **EC2** 기반에서 실행되고 있는 컨테이너에 접근하려면 작업 정의에서 설정했던 **3000번 포트**가 노출되어야 한다.
- **ecs-sg-instance** 보안 그룹에 사용자 지정 **TCP 3000번 포트**를 인바운드 규칙에 추가해 준다.

> 인바운드 규칙 편집 화면에서는 HTTP와 사용자 지정 TCP 포트를 설정하여 트래픽을 제어한다.

- 다시 **ALB**의 **DNS 주소**를 통해 **ECS**의 컨테이너에 접근을 시도한다.

# 클라우드 기반의 Amazon ECS 서비스 활용

## Amazon ECS를 활용한 컨테이너 배포

### ECS Architecture

- 클라우드 설계도의 컨테이너 서비스는 **nginx**와 **django**를 이용하여 **2-tier 구조**의 웹 서비스를 구성해 본다.
- Clip2.에서 생성한 **ECS 클러스터**를 그대로 이용하고, 작업 정의(**fastcampus-task**)와 서비스(**fastcampus-svc**)를 생성해 본다.

[그림: ECS 아키텍처 다이어그램]
- **ECR**: Nginx와 Django 이미지를 저장
- **ECS**: Nginx와 Django 컨테이너를 실행
- **ALB**: 외부 트래픽을 Nginx 컨테이너로 라우팅
- **VPC**: 퍼블릭 및 프라이빗 서브넷으로 구성
- **NAT Gateway**: 프라이빗 서브넷의 인터넷 접근을 지원
- **Cloud9 환경**: 관리자가 접근하여 설정

## Amazon ECS 기반의 컨테이너 서비스 배포

### ECR에 저장소 생성 및 로그인

- **ECR에 저장소 생성**
  ```bash
  ec2-user:~ $ aws ecr create-repository --repository-name fc-django
  ec2-user:~ $ aws ecr create-repository --repository-name fc-nginx
  ```

- **ECR 로그인**
  ```bash
  ec2-user:~ $ aws ecr get-login-password --region ap-northeast-2 | docker login --username AWS --password-stdin 594682333406.dkr.ecr.ap-northeast-2.amazonaws.com
  ```

### 이미지 빌드 및 ECR에 푸시

- **Cloud9에서 이미지 빌드**
  ```bash
  ec2-user:~ $ cd fastcampus/ch13
  ec2-user:~/fastcampus/ch13/django (main) $ docker build -t fc-django:1.0 .
  ec2-user:~/fastcampus/ch13/nginx (main) $ docker build -t fc-nginx:1.0 .
  ```

- **ECR에 이미지 푸시**
  ```bash
  ~$ docker image tag fc-django:1.0 594682333406.dkr.ecr.ap-northeast-2.amazonaws.com/fc-django:1.0
  ~$ docker image tag fc-nginx:1.0 594682333406.dkr.ecr.ap-northeast-2.amazonaws.com/fc-nginx:1.0
  ~$ docker push 594682333406.dkr.ecr.ap-northeast-2.amazonaws.com/fc-django:1.0
  ~$ docker push 594682333406.dkr.ecr.ap-northeast-2.amazonaws.com/fc-nginx:1.0
  ```

### ECR 저장소에 푸시된 이미지 확인

- **fc-django** 이미지 태그: 1.0
- **fc-nginx** 이미지 태그: 1.0

### ECS 환경 설정 및 작업 정의 생성

- **ECS 환경 변경 및 실습 진행**
  - 생성한 **docker image**를 이용하여 컨테이너 서비스를 만들어 본다.

- **새 작업 정의 생성**
  - **2tier-task** 생성

### Amazon ECS 활용, 컨테이너 배포

Amazon ECS 기반의 컨테이너 서비스를 배포해 본다.

#### 시작 유형 호환성 선택

- 시작 유형을 **EC2**를 선택하고, **다음 단계**로 진행한다.

#### 작업 및 컨테이너 정의 구성

- 작업 정의명을 입력: **2tier-task**
- 볼륨 추가
  - 이름: **socket_volume**
  - 볼륨 유형: **Bind Mount**

#### 구성할 서비스 컨테이너 정의

- 컨테이너 추가
  - 이름: **fc-djangdo**
  - 이름: **fc-nginx**

#### 컨테이너 추가 1

- 이름: **fc-django**
- 이미지: URI 복붙
- 메모리제한: **500**
- Backend이므로 port 연결 불필요함

## Amazon ECS 활용, 컨테이너 배포

### 스토리지 및 로깅 설정

- 앞서 생성한 볼륨으로 구성
- **socket_volume**: `/app`
- 로그 구성 선택: **Auto-configure CloudWatch Logs**

### 컨테이너 추가 2

- 이름: **fc-nginx**
- 이미지: URI 복붙
- 메모리제한: **500**
- Frontend 연결 port 지정: **80:80**

> **Soft limit**: 컨테이너가 예약해 사용할 메모리 용량  
> **Hard limit**: 해당 메모리 이상으로 사용 시 컨테이너 종료

### 시작 종속 관계 설정

- **frontend-backend** 종속성 연결
- 상태: **START**로 지정하여 동시 연결

### 스토리지 및 로깅 설정 (Django 볼륨 연결)

- Django 볼륨과 연결하기 위해 볼륨 출처를 **fc-django** 컨테이너명으로 지정

# Amazon ECS 활용, 컨테이너 배포

## Amazon ECS 기반의 컨테이너 서비스 배포

### 컨테이너 생성

- **컨테이너 정의**: 작업의 메모리와 CPU를 설정하여 컨테이너를 정의합니다.
- **컨테이너 추가**: `fc-django`와 `fc-nginx` 컨테이너를 추가합니다.

### 작업 정의 생성

- **작업 정의 생성 완료**: 작업 정의가 성공적으로 생성되었습니다.
- **작업 정의 이름**: `2tier-task`
- **네트워크 모드**: `default`

### 서비스 생성

- **서비스 구성**: EC2를 선택하여 작업 정의를 기반으로 서비스를 생성합니다.
- **서비스 이름**: `2tier-svc`
- **작업 개수**: 2

### 배포 설정

- **배포 유형**: 롤링 업데이트를 사용하여 배포를 설정합니다.
- **작업 배치**: AZ 균형 분산을 통해 작업을 배치합니다.

### 로드 밸런서 설정

- **로드 밸런서 유형**: Application Load Balancer를 선택합니다.
- **서비스의 IAM 역할**: `AWSServiceRoleForECS`
- **로드 밸런서 이름**: `ecs-alb`
- **로드 밸런싱할 컨테이너**: `fc-nginx:80:80`
- **로드 밸런서 추가**: 설정을 완료합니다.

## Amazon ECS 활용, 컨테이너 배포

### 리스너 및 대상 그룹 설정

- **리스너 포트 선택**: 80:HTTP
- **대상 그룹 이름 선택**: `ecs-target-group`
- **대상 유형**: instance

> **참고**: App Mesh를 사용하여 경로 기반 라우팅을 설정할 수 있습니다.

### Auto Scaling 설정

- **서비스 Auto Scaling**: 원하는 서비스 개수를 조정하지 않음
- **옵션**: Auto Scaling을 구성하여 애플리케이션의 요구 사항을 충족할 수 있습니다.

### 네트워크 구성 검토

- **상태 검사 유예 기간**: 800
- **컨테이너 이름**: fc-nginx
- **컨테이너 포트**: 80
- **ELB 이름**: ecs-alb
- **대상 그룹**: ecs-target-group
- **상태 확인 경로**: /
- **리스너 포트**: 80
- **서비스 역할**: `AWSServiceRoleForECS`

### 서비스 생성 및 확인

- **서비스 생성 완료**: 2iter-svc
- **ECS 서비스 상태**: 1/1 완료
- **서비스 보기**: 생성된 서비스 확인 가능

### 클러스터 서비스 확인

- **클러스터 이름**: ecs-cluster
- **서비스명 확인**: 2iter-svc
- **상태**: ACTIVE
- **원하는 수**: 2
- **실행 중**: 2

## Amazon ECS 활용, 컨테이너 배포

### EC2 로드 밸런싱 설정

- **EC2 로드 밸런싱 선택**: ecs-alb
- **DNS 주소 복사**
- **브라우저에 붙여넣기**

[그림: EC2 로드 밸런서 설정 화면]
- 로드 밸런서 타입: Application
- 상태: Active
- VPC: vpc-0cb9776955379e63c
- 가용 영역: ap-northeast-2a, ap-northeast-2c
- IP 주소 타입: IPv4
- 생성 날짜: July 13, 2023

### 결과 확인

- **결과 화면 확인**

[그림: 결과 화면]
- Fast Campus 로고와 배출 접수, 목록 확인 아이콘이 표시됨
