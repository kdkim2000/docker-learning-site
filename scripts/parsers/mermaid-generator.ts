/**
 * Mermaid Code Generator
 * Converts ASCII diagrams to Mermaid syntax
 */

import type { DiagramType } from '../../types/content'

/**
 * Common Docker/Network diagram patterns for Mermaid conversion
 */

// CNM (Container Network Model) template
const CNM_TEMPLATE = `flowchart TB
    subgraph Sandbox["🔒 Sandbox (격리된 네트워크 스택)"]
        direction TB
        SandboxInfo["Ethernet(eth0), port,<br/>route table, DNS 구성"]
        Endpoint["📡 Endpoint<br/>(가상 이더넷 인터페이스)"]
    end

    Network["🌐 Network<br/>(가상 스위치, Bridge)"]

    Endpoint --> Network

    style Sandbox fill:#e0f2fe,stroke:#0284c7
    style Endpoint fill:#dbeafe,stroke:#2563eb
    style Network fill:#dcfce7,stroke:#16a34a`

// Docker network architecture template
const DOCKER_NETWORK_TEMPLATE = `flowchart TB
    subgraph Host["🖥️ Docker Host"]
        direction TB
        subgraph Container1["📦 Container 1"]
            eth0_1["eth0<br/>172.17.0.2"]
        end
        subgraph Container2["📦 Container 2"]
            eth0_2["eth0<br/>172.17.0.3"]
        end

        veth1["veth"]
        veth2["veth"]

        docker0["🌉 docker0 bridge<br/>172.17.0.1"]
    end

    eth0_1 --- veth1
    eth0_2 --- veth2
    veth1 --- docker0
    veth2 --- docker0

    style Host fill:#f8fafc,stroke:#64748b
    style Container1 fill:#dbeafe,stroke:#2563eb
    style Container2 fill:#dbeafe,stroke:#2563eb
    style docker0 fill:#dcfce7,stroke:#16a34a`

// Overlay network template
const OVERLAY_NETWORK_TEMPLATE = `flowchart TB
    subgraph Host1["🖥️ Host 1"]
        C1["📦 Container A"]
        B1["🌉 Bridge"]
    end

    subgraph Host2["🖥️ Host 2"]
        C2["📦 Container B"]
        B2["🌉 Bridge"]
    end

    Overlay["☁️ Overlay Network<br/>(VXLAN)"]

    C1 --- B1
    C2 --- B2
    B1 -.->|VXLAN| Overlay
    B2 -.->|VXLAN| Overlay

    style Overlay fill:#fef3c7,stroke:#d97706
    style Host1 fill:#f8fafc,stroke:#64748b
    style Host2 fill:#f8fafc,stroke:#64748b`

// Docker image layers template
const IMAGE_LAYERS_TEMPLATE = `flowchart TB
    subgraph Image["🐳 Docker Image"]
        direction TB
        L4["📦 Application Layer<br/>(Your Code)"]
        L3["⚙️ Runtime Layer<br/>(Node.js, Python, etc.)"]
        L2["📚 Library Layer<br/>(Dependencies)"]
        L1["🐧 Base Layer<br/>(Ubuntu, Alpine, etc.)"]
    end

    L4 --> L3
    L3 --> L2
    L2 --> L1

    style L4 fill:#dbeafe,stroke:#2563eb
    style L3 fill:#e0f2fe,stroke:#0284c7
    style L2 fill:#ecfdf5,stroke:#059669
    style L1 fill:#f3f4f6,stroke:#6b7280`

// CI/CD Pipeline template
const CICD_PIPELINE_TEMPLATE = `flowchart LR
    subgraph Dev["👨‍💻 Development"]
        Code["📝 Code"]
        Commit["📤 Commit"]
    end

    subgraph CI["🔄 CI"]
        Build["🔨 Build"]
        Test["🧪 Test"]
        Push["📦 Push to Registry"]
    end

    subgraph CD["🚀 CD"]
        Deploy["🎯 Deploy"]
        Run["▶️ Run"]
    end

    Code --> Commit
    Commit --> Build
    Build --> Test
    Test --> Push
    Push --> Deploy
    Deploy --> Run

    style Dev fill:#fef3c7,stroke:#d97706
    style CI fill:#dbeafe,stroke:#2563eb
    style CD fill:#dcfce7,stroke:#16a34a`

// Docker Compose services template
const COMPOSE_SERVICES_TEMPLATE = `flowchart TB
    subgraph compose["🐙 Docker Compose"]
        direction TB

        subgraph frontend["Frontend"]
            nginx["🌐 Nginx<br/>:80"]
        end

        subgraph backend["Backend"]
            app["⚙️ App Server<br/>:8080"]
        end

        subgraph data["Data"]
            db["🗄️ Database<br/>:5432"]
            redis["⚡ Redis<br/>:6379"]
        end
    end

    nginx --> app
    app --> db
    app --> redis

    style compose fill:#f8fafc,stroke:#64748b
    style frontend fill:#dbeafe,stroke:#2563eb
    style backend fill:#dcfce7,stroke:#16a34a
    style data fill:#fef3c7,stroke:#d97706`

// Docker Swarm architecture template
const SWARM_TEMPLATE = `flowchart TB
    subgraph Swarm["🐝 Docker Swarm Cluster"]
        direction TB

        subgraph Manager["👑 Manager Node"]
            API["API Server"]
            Scheduler["Scheduler"]
            Raft["Raft Consensus"]
        end

        subgraph Worker1["⚙️ Worker Node 1"]
            Task1["📦 Task"]
            Task2["📦 Task"]
        end

        subgraph Worker2["⚙️ Worker Node 2"]
            Task3["📦 Task"]
            Task4["📦 Task"]
        end
    end

    Manager --> Worker1
    Manager --> Worker2

    style Swarm fill:#f8fafc,stroke:#64748b
    style Manager fill:#dbeafe,stroke:#2563eb
    style Worker1 fill:#dcfce7,stroke:#16a34a
    style Worker2 fill:#dcfce7,stroke:#16a34a`

// VM vs Container comparison template
const VM_CONTAINER_COMPARISON_TEMPLATE = `flowchart TB
    subgraph Traditional["🖥️ 일반 서버<br/>(온프레미스)"]
        direction TB
        T_Apps["App 1 | App 2 | App 3"]
        T_OS["Host OS"]
        T_HW["Server Hardware"]
    end

    subgraph VM["💿 가상머신 (GB)"]
        direction TB
        subgraph VM1["VM1"]
            VM1_App["App"]
            VM1_Libs["Bins/Libs"]
            VM1_OS["Guest OS"]
        end
        subgraph VM2["VM2"]
            VM2_App["App"]
            VM2_Libs["Bins/Libs"]
            VM2_OS["Guest OS"]
        end
        Hypervisor["Hypervisor"]
        VM_OS["Host OS"]
        VM_HW["Server Hardware"]
    end

    subgraph Container["📦 컨테이너 (MB)"]
        direction TB
        subgraph C1["Container 1"]
            C1_App["App"]
            C1_Libs["Bins/Libs"]
        end
        subgraph C2["Container 2"]
            C2_App["App"]
            C2_Libs["Bins/Libs"]
        end
        Docker["Docker Engine"]
        C_OS["Host OS"]
        C_HW["Server Hardware"]
    end

    style Traditional fill:#f3f4f6,stroke:#6b7280
    style VM fill:#fef3c7,stroke:#d97706
    style Container fill:#dcfce7,stroke:#16a34a
    style Hypervisor fill:#fed7aa,stroke:#ea580c
    style Docker fill:#bbf7d0,stroke:#16a34a`

// Docker architecture evolution template (LXC -> libcontainer -> containerd)
const DOCKER_EVOLUTION_TEMPLATE = `flowchart LR
    subgraph LXC["LXC 기반<br/>(초기)"]
        direction TB
        L_Container["Container<br/>App + Libs"]
        L_LXC["LXC"]
        L_Kernel["Kernel<br/>(cgroup, ns)"]
        L_OS["Host OS"]
    end

    subgraph Libcontainer["libcontainer 기반<br/>(중기)"]
        direction TB
        M_Container["Container<br/>App + Libs"]
        M_Lib["libcontainer"]
        M_Kernel["Kernel<br/>(cgroup, ns)"]
        M_OS["Host OS"]
    end

    subgraph Containerd["containerd 기반<br/>(현재)"]
        direction TB
        C_Container["Container<br/>App + Libs"]
        C_Runtime["containerd<br/>+ runC"]
        C_Kernel["Kernel<br/>(cgroup, ns)"]
        C_OS["Host OS"]
    end

    LXC -->|발전| Libcontainer
    Libcontainer -->|발전| Containerd

    style LXC fill:#f3f4f6,stroke:#6b7280
    style Libcontainer fill:#fef3c7,stroke:#d97706
    style Containerd fill:#dcfce7,stroke:#16a34a`

// Docker workflow template (Dockerfile -> Image -> Container)
const DOCKER_WORKFLOW_TEMPLATE = `flowchart LR
    subgraph Development["👨‍💻 개발"]
        Dockerfile["📄 Dockerfile"]
        AppCode["💻 Application<br/>+ Infra 구성"]
    end

    subgraph Build["🔨 빌드"]
        BuildProcess["docker build"]
        Image["🐳 Docker Image"]
    end

    subgraph Registry["📦 레지스트리"]
        Push["docker push"]
        Hub["Docker Hub"]
        Pull["docker pull"]
    end

    subgraph Deploy["🚀 배포"]
        Run["docker run"]
        Container["📦 Container"]
        Service["🌐 Application<br/>서비스 제공"]
    end

    AppCode --> Dockerfile
    Dockerfile --> BuildProcess
    BuildProcess --> Image
    Image --> Push
    Push --> Hub
    Hub --> Pull
    Pull --> Run
    Run --> Container
    Container --> Service

    style Development fill:#fef3c7,stroke:#d97706
    style Build fill:#dbeafe,stroke:#2563eb
    style Registry fill:#e0e7ff,stroke:#6366f1
    style Deploy fill:#dcfce7,stroke:#16a34a`

// System container vs Application container template
const CONTAINER_TYPES_TEMPLATE = `flowchart TB
    subgraph System["🖥️ 시스템 컨테이너"]
        direction TB
        S_Host["Host OS"]
        S_C1["Ubuntu 20.04<br/>Container"]
        S_C2["CentOS 7<br/>Container"]
        S_C3["RHEL 8<br/>Container"]
    end

    subgraph App["📦 애플리케이션 컨테이너"]
        direction TB
        A_Host["Host OS"]
        A_C1["🌐 Nginx<br/>(Frontend)"]
        A_C2["🐍 Python<br/>(Backend)"]
        A_C3["🗄️ MySQL<br/>(Database)"]
    end

    S_Host --> S_C1
    S_Host --> S_C2
    S_Host --> S_C3

    A_Host --> A_C1
    A_Host --> A_C2
    A_Host --> A_C3
    A_C1 --> A_C2
    A_C2 --> A_C3

    style System fill:#e0f2fe,stroke:#0284c7
    style App fill:#dcfce7,stroke:#16a34a`

// Physical server architecture template
const PHYSICAL_SERVER_TEMPLATE = `flowchart TB
    subgraph Server["🖥️ 물리 서버"]
        direction TB
        App["📦 Application"]
        OS["🐧 Operating System"]
        HW["⚙️ Hardware"]
    end

    App --> OS
    OS --> HW

    style Server fill:#f3f4f6,stroke:#6b7280
    style App fill:#dbeafe,stroke:#2563eb
    style OS fill:#fef3c7,stroke:#d97706
    style HW fill:#e5e7eb,stroke:#9ca3af`

// VM architecture template
const VM_ARCHITECTURE_TEMPLATE = `flowchart TB
    subgraph Server["🖥️ 물리 서버"]
        direction TB
        subgraph VMs["Virtual Machines"]
            VM1["VM1<br/>OS + App"]
            VM2["VM2<br/>OS + App"]
            VM3["VM3<br/>OS + App"]
        end
        Hypervisor["⚙️ Hypervisor"]
        OS["🐧 Host OS"]
        HW["🔧 Hardware"]
    end

    VM1 --> Hypervisor
    VM2 --> Hypervisor
    VM3 --> Hypervisor
    Hypervisor --> OS
    OS --> HW

    style Server fill:#f8fafc,stroke:#64748b
    style VMs fill:#fef3c7,stroke:#d97706
    style Hypervisor fill:#fed7aa,stroke:#ea580c`

// Container architecture template
const CONTAINER_ARCHITECTURE_TEMPLATE = `flowchart TB
    subgraph Server["🖥️ 물리 서버"]
        direction TB
        subgraph Containers["Containers"]
            C1["Container A<br/>(Process)"]
            C2["Container B<br/>(Process)"]
            C3["Container C<br/>(Process)"]
        end
        Kernel["🐧 Host OS (Kernel)"]
        HW["🔧 Hardware"]
    end

    C1 --> Kernel
    C2 --> Kernel
    C3 --> Kernel
    Kernel --> HW

    style Server fill:#f8fafc,stroke:#64748b
    style Containers fill:#dcfce7,stroke:#16a34a
    style Kernel fill:#dbeafe,stroke:#2563eb`

// UFS (Union FileSystem) Container Layer template
const UFS_CONTAINER_LAYER_TEMPLATE = `flowchart TB
    subgraph ImageBuild["🐳 Docker Image 빌드"]
        direction TB
        subgraph BaseImage["Base Image"]
            L1["🐧 Debian Linux<br/>(Base Layer)"]
            L2["📦 Layer 1"]
            L3["📦 Layer 2"]
            L4["📦 Layer 3"]
            L5["⚙️ httpd<br/>(Apache)"]
            L6["🌐 web source"]
        end
    end

    subgraph Container1["📦 httpd Container 1"]
        direction TB
        RW1["✏️ Read/Write<br/>Container Layer"]
        IL1["📚 Image Layers<br/>(Read Only)"]
    end

    subgraph Container2["📦 httpd Container 2"]
        direction TB
        RW2["✏️ Read/Write<br/>Container Layer"]
        IL2["📚 Image Layers<br/>(Read Only)"]
    end

    ImageBuild -->|docker run| Container1
    ImageBuild -->|docker run| Container2

    L1 --> L2
    L2 --> L3
    L3 --> L4
    L4 --> L5
    L5 --> L6

    RW1 --> IL1
    RW2 --> IL2

    style ImageBuild fill:#f8fafc,stroke:#64748b
    style BaseImage fill:#e0f2fe,stroke:#0284c7
    style Container1 fill:#dcfce7,stroke:#16a34a
    style Container2 fill:#dcfce7,stroke:#16a34a
    style RW1 fill:#fef3c7,stroke:#d97706
    style RW2 fill:#fef3c7,stroke:#d97706`

// Dockerfile commands classification template
const DOCKERFILE_COMMANDS_TEMPLATE = `flowchart TB
    subgraph Title["📄 Dockerfile 명령어 분류"]
        direction LR

        subgraph Build["🔨 빌드 단계"]
            direction TB
            FROM["FROM<br/>베이스 이미지"]
            RUN["RUN<br/>명령 실행"]
            COPY["COPY<br/>파일 복사"]
            ADD["ADD<br/>파일 추가"]
        end

        subgraph Config["⚙️ 설정 단계"]
            direction TB
            ENV["ENV<br/>환경 변수"]
            ARG["ARG<br/>빌드 인자"]
            WORKDIR["WORKDIR<br/>작업 디렉토리"]
            LABEL["LABEL<br/>메타데이터"]
            USER["USER<br/>실행 사용자"]
        end

        subgraph Runtime["🚀 실행 단계"]
            direction TB
            CMD["CMD<br/>기본 명령"]
            ENTRYPOINT["ENTRYPOINT<br/>진입점"]
            EXPOSE["EXPOSE<br/>포트 노출"]
            VOLUME["VOLUME<br/>볼륨 마운트"]
            HEALTHCHECK["HEALTHCHECK<br/>상태 검사"]
        end
    end

    style Title fill:#f8fafc,stroke:#64748b
    style Build fill:#dbeafe,stroke:#2563eb
    style Config fill:#fef3c7,stroke:#d97706
    style Runtime fill:#dcfce7,stroke:#16a34a`

// RUN optimization template
const RUN_OPTIMIZATION_TEMPLATE = `flowchart TB
    subgraph Principles["📋 RUN 명령어 최적화 원칙"]
        direction TB

        P1["1️⃣ 관련 명령어는 하나의 RUN으로 통합<br/>(&&로 연결)"]

        subgraph CacheClean["2️⃣ 패키지 캐시 정리"]
            APT["apt: rm -rf /var/lib/apt/lists/*"]
            YUM["yum: yum clean all"]
            APK["apk: rm -rf /var/cache/apk/*"]
        end

        P3["3️⃣ 버전 명시로 재현성 확보<br/>apt-get install nginx=1.18.0"]

        P4["4️⃣ --no-install-recommends로<br/>불필요 패키지 제외"]
    end

    P1 --> CacheClean
    CacheClean --> P3
    P3 --> P4

    style Principles fill:#f8fafc,stroke:#64748b
    style CacheClean fill:#fef3c7,stroke:#d97706
    style P1 fill:#dbeafe,stroke:#2563eb
    style P3 fill:#dcfce7,stroke:#16a34a
    style P4 fill:#e0e7ff,stroke:#6366f1`

// CMD vs ENTRYPOINT flow template
const CMD_ENTRYPOINT_TEMPLATE = `flowchart TB
    subgraph Dockerfile["📄 Dockerfile"]
        ENTRYPOINT_DEF["ENTRYPOINT [node]"]
        CMD_DEF["CMD [app.js]"]
    end

    subgraph Execution["🚀 실행 시"]
        direction TB

        Default["docker run my-app<br/>→ node app.js"]
        WithArg["docker run my-app server.js<br/>→ node server.js"]
        Override["docker run --entrypoint /bin/sh my-app<br/>→ /bin/sh"]
    end

    ENTRYPOINT_DEF --> Default
    CMD_DEF --> Default

    Default -->|"인자 변경"| WithArg
    Default -->|"ENTRYPOINT 변경"| Override

    style Dockerfile fill:#dbeafe,stroke:#2563eb
    style Execution fill:#dcfce7,stroke:#16a34a
    style Default fill:#f8fafc,stroke:#64748b
    style WithArg fill:#fef3c7,stroke:#d97706
    style Override fill:#fee2e2,stroke:#dc2626`

// Docker build cache template
const BUILD_CACHE_TEMPLATE = `flowchart TB
    subgraph Cache["🔄 Docker 빌드 캐시"]
        direction TB

        L1["Layer 1: FROM node:18-alpine<br/>✅ 캐시 사용"]
        L2["Layer 2: WORKDIR /app<br/>✅ 캐시 사용"]
        L3["Layer 3: COPY package.json<br/>✅ 캐시 사용 (변경 없음)"]
        L4["Layer 4: RUN npm install<br/>✅ 캐시 사용"]
        L5["Layer 5: COPY . .<br/>⚠️ 소스 변경 시 캐시 무효화"]
        L6["Layer 6: CMD<br/>🔄 재빌드"]
    end

    L1 --> L2
    L2 --> L3
    L3 --> L4
    L4 --> L5
    L5 --> L6

    style Cache fill:#f8fafc,stroke:#64748b
    style L1 fill:#dcfce7,stroke:#16a34a
    style L2 fill:#dcfce7,stroke:#16a34a
    style L3 fill:#dcfce7,stroke:#16a34a
    style L4 fill:#dcfce7,stroke:#16a34a
    style L5 fill:#fef3c7,stroke:#d97706
    style L6 fill:#dbeafe,stroke:#2563eb`

// Multi-container service template (Nginx + App + Cache + DB)
const MULTI_CONTAINER_SERVICE_TEMPLATE = `flowchart LR
    subgraph App["🐙 멀티 컨테이너 애플리케이션"]
        direction LR

        Nginx["🌐 Nginx<br/>(Proxy)"]
        Flask["🐍 App<br/>(Flask)"]
        Redis["⚡ Redis<br/>(Cache)"]
        MySQL["🗄️ MySQL<br/>(DB)"]
    end

    Client["👤 Client"] --> Nginx
    Nginx --> Flask
    Flask --> Redis
    Flask --> MySQL

    style App fill:#f8fafc,stroke:#64748b
    style Nginx fill:#dcfce7,stroke:#16a34a
    style Flask fill:#dbeafe,stroke:#2563eb
    style Redis fill:#fee2e2,stroke:#dc2626
    style MySQL fill:#fef3c7,stroke:#d97706`

// Docker CLI vs Compose comparison template
const CLI_VS_COMPOSE_TEMPLATE = `flowchart TB
    subgraph CLI["🔧 Docker CLI 방식"]
        direction TB
        C1["docker network create"]
        C2["docker volume create"]
        C3["docker run (MySQL)"]
        C4["docker run (WordPress)"]
        C5["docker network connect"]
    end

    subgraph Compose["📄 Docker Compose 방식"]
        direction TB
        Y1["docker-compose.yaml<br/>작성"]
        Y2["docker compose up -d"]
    end

    C1 --> C2 --> C3 --> C4 --> C5
    Y1 --> Y2

    style CLI fill:#fee2e2,stroke:#dc2626
    style Compose fill:#dcfce7,stroke:#16a34a`

// Project directory structure template
const PROJECT_STRUCTURE_TEMPLATE = `flowchart TB
    subgraph Structure["📁 프로젝트 구조"]
        direction TB
        Root["project/"]
        DC["docker-compose.yaml"]
        App["app/"]
        AppFile["app.py"]
        DF["Dockerfile"]
        Nginx["nginx/"]
        NginxConf["nginx.conf"]
    end

    Root --> DC
    Root --> App
    Root --> Nginx
    App --> AppFile
    App --> DF
    Nginx --> NginxConf

    style Structure fill:#f8fafc,stroke:#64748b
    style Root fill:#dbeafe,stroke:#2563eb
    style DC fill:#fef3c7,stroke:#d97706`

// 3-Tier architecture template
const THREE_TIER_TEMPLATE = `flowchart TB
    subgraph ThreeTier["🏗️ 3-Tier 아키텍처"]
        direction TB

        subgraph Frontend["Frontend Tier"]
            FE["🌐 Nginx<br/>:80"]
        end

        subgraph Backend["Backend Tier"]
            BE["⚙️ Node.js API<br/>:8080"]
        end

        subgraph Data["Data Tier"]
            DB["🗄️ MySQL<br/>:3306"]
        end
    end

    Client["👤 Client"] --> FE
    FE -->|"/api/*"| BE
    BE --> DB

    style ThreeTier fill:#f8fafc,stroke:#64748b
    style Frontend fill:#dcfce7,stroke:#16a34a
    style Backend fill:#dbeafe,stroke:#2563eb
    style Data fill:#fef3c7,stroke:#d97706`

// Service scaling template
const SERVICE_SCALING_TEMPLATE = `flowchart TB
    subgraph Scaling["📈 서비스 스케일링"]
        direction TB

        LB["🌐 Nginx<br/>(Load Balancer)"]

        subgraph FlaskInstances["Flask Instances"]
            F1["🐍 flask-1<br/>:9000"]
            F2["🐍 flask-2<br/>:9000"]
            F3["🐍 flask-3<br/>:9000"]
        end

        Redis["⚡ Redis<br/>(Shared)"]
    end

    Client["👤 Client"] --> LB
    LB --> F1
    LB --> F2
    LB --> F3
    F1 --> Redis
    F2 --> Redis
    F3 --> Redis

    style Scaling fill:#f8fafc,stroke:#64748b
    style FlaskInstances fill:#dbeafe,stroke:#2563eb
    style LB fill:#dcfce7,stroke:#16a34a
    style Redis fill:#fee2e2,stroke:#dc2626`

// Compose vs Kubernetes template
const COMPOSE_VS_K8S_TEMPLATE = `flowchart LR
    subgraph UseCase["사용 시나리오"]
        direction TB

        subgraph Compose["📄 Docker Compose"]
            C1["개발 환경"]
            C2["테스트 환경"]
            C3["소규모 배포"]
        end

        subgraph K8s["☸️ Kubernetes"]
            K1["대규모 프로덕션"]
            K2["멀티 클라우드"]
            K3["고가용성 필요"]
        end
    end

    style UseCase fill:#f8fafc,stroke:#64748b
    style Compose fill:#dbeafe,stroke:#2563eb
    style K8s fill:#dcfce7,stroke:#16a34a`

// Replicated vs Global Mode template
const REPLICATED_VS_GLOBAL_TEMPLATE = `flowchart TB
    subgraph Comparison["🔄 배포 모드 비교"]
        direction LR

        subgraph Replicated["Replicated Mode<br/>(replicas=3)"]
            direction TB
            RH1["🖥️ hostos1"]
            RH2["🖥️ hostos2"]
            RH3["🖥️ hostos3"]
            RT1["📦 Task1"]
            RT2["📦 Task2"]
            RT3["📦 Task3"]
            RH1 --- RT1
            RH2 --- RT2
            RH3 --- RT3
        end

        subgraph Global["Global Mode<br/>(노드당 1개)"]
            direction TB
            GH1["🖥️ hostos1"]
            GH2["🖥️ hostos2"]
            GH3["🖥️ hostos3"]
            GT1["📦 Task"]
            GT2["📦 Task"]
            GT3["📦 Task"]
            GH1 --- GT1
            GH2 --- GT2
            GH3 --- GT3
        end
    end

    R_Note["지정 개수만큼 배치<br/>어느 노드든 배치 가능"]
    G_Note["노드당 1개씩 자동 배치<br/>새 노드 추가 시 자동 배포"]

    Replicated -.-> R_Note
    Global -.-> G_Note

    style Comparison fill:#f8fafc,stroke:#64748b
    style Replicated fill:#dbeafe,stroke:#2563eb
    style Global fill:#dcfce7,stroke:#16a34a
    style R_Note fill:#e0f2fe,stroke:#0284c7
    style G_Note fill:#ecfdf5,stroke:#059669`

// Rolling Update process template
const ROLLING_UPDATE_TEMPLATE = `flowchart TB
    subgraph Rolling["🔄 Rolling Update 과정"]
        direction TB

        subgraph Step1["Step 1: 초기 상태"]
            direction LR
            S1T1["📦 v1.24"]
            S1T2["📦 v1.24"]
            S1T3["📦 v1.24"]
            S1T4["📦 v1.24"]
        end

        subgraph Step2["Step 2: 첫 번째 업데이트"]
            direction LR
            S2T1["📦 v1.25"]
            S2T2["📦 v1.24"]
            S2T3["📦 v1.24"]
            S2T4["📦 v1.24"]
        end

        subgraph Step3["Step 3: 두 번째 업데이트"]
            direction LR
            S3T1["📦 v1.25"]
            S3T2["📦 v1.25"]
            S3T3["📦 v1.24"]
            S3T4["📦 v1.24"]
        end

        subgraph Step4["Step 4: 완료"]
            direction LR
            S4T1["📦 v1.25"]
            S4T2["📦 v1.25"]
            S4T3["📦 v1.25"]
            S4T4["📦 v1.25"]
        end
    end

    Step1 -->|"1개씩 순차 업데이트"| Step2
    Step2 --> Step3
    Step3 -->|"무중단 업데이트"| Step4

    style Rolling fill:#f8fafc,stroke:#64748b
    style Step1 fill:#fee2e2,stroke:#dc2626
    style Step2 fill:#fef3c7,stroke:#d97706
    style Step3 fill:#fef3c7,stroke:#d97706
    style Step4 fill:#dcfce7,stroke:#16a34a`

// Container lifecycle template
const CONTAINER_LIFECYCLE_TEMPLATE = `flowchart TB
    subgraph Lifecycle["🔄 컨테이너 생명주기"]
        direction TB

        Create["docker create"]
        Created["📦 Created<br/>(생성됨, 실행 대기)"]
        Running["▶️ Running<br/>(실행 중)"]
        Paused["⏸️ Paused<br/>(일시정지)"]
        Exited["⏹️ Exited<br/>(종료됨)"]
        Deleted["🗑️ Deleted<br/>(삭제됨)"]
    end

    Create --> Created
    Created -->|"docker start"| Running
    Running -->|"docker stop"| Exited
    Running -->|"docker pause"| Paused
    Paused -->|"docker unpause"| Running
    Exited -->|"docker start<br/>docker restart"| Running
    Exited -->|"docker rm"| Deleted

    style Lifecycle fill:#f8fafc,stroke:#64748b
    style Created fill:#dbeafe,stroke:#2563eb
    style Running fill:#dcfce7,stroke:#16a34a
    style Paused fill:#fef3c7,stroke:#d97706
    style Exited fill:#fee2e2,stroke:#dc2626
    style Deleted fill:#f3f4f6,stroke:#6b7280`

// Docker run flow template
const DOCKER_RUN_FLOW_TEMPLATE = `flowchart LR
    subgraph DockerRun["🚀 docker run = create + start"]
        direction LR

        subgraph Create["docker create"]
            C1["📦 컨테이너 생성"]
        end

        subgraph Start["docker start"]
            S1["▶️ 컨테이너 시작"]
        end
    end

    Create -->|"자동 실행"| Start

    style DockerRun fill:#f8fafc,stroke:#64748b
    style Create fill:#dbeafe,stroke:#2563eb
    style Start fill:#dcfce7,stroke:#16a34a`

// Volume mount types template
const VOLUME_MOUNT_TEMPLATE = `flowchart TB
    subgraph Host["🖥️ Docker Host"]
        direction TB

        subgraph BindMount["📁 Bind Mount"]
            BH["Host 디렉토리<br/>/home/user/data"]
            BC["Container<br/>/app/data"]
            BH <-->|"직접 연결"| BC
        end

        subgraph DockerVolume["💾 Docker Volume"]
            DV["Docker 관리 볼륨<br/>/var/lib/docker/volumes"]
            DC["Container<br/>/app/data"]
            DV <-->|"Docker 관리"| DC
        end

        subgraph Tmpfs["⚡ tmpfs Mount"]
            TM["Memory<br/>(RAM)"]
            TC["Container<br/>/app/cache"]
            TM <-->|"메모리 연결"| TC
        end
    end

    style Host fill:#f8fafc,stroke:#64748b
    style BindMount fill:#dbeafe,stroke:#2563eb
    style DockerVolume fill:#dcfce7,stroke:#16a34a
    style Tmpfs fill:#fef3c7,stroke:#d97706`

// Network proxy template
const NETWORK_PROXY_TEMPLATE = `flowchart LR
    subgraph Proxy["🔀 Proxy 구조"]
        direction LR

        Client["👤 Client"]
        Proxy1["🌐 Proxy<br/>(Nginx)"]
        Web1["📦 Web1"]
        Web2["📦 Web2"]
        DB["🗄️ DB"]
    end

    Client --> Proxy1
    Proxy1 --> Web1
    Proxy1 --> Web2
    Web1 --> DB
    Web2 --> DB

    style Proxy fill:#f8fafc,stroke:#64748b
    style Client fill:#dbeafe,stroke:#2563eb
    style Proxy1 fill:#dcfce7,stroke:#16a34a
    style Web1 fill:#fef3c7,stroke:#d97706
    style Web2 fill:#fef3c7,stroke:#d97706
    style DB fill:#fee2e2,stroke:#dc2626`

// Container network bridge template
const CONTAINER_BRIDGE_TEMPLATE = `flowchart TB
    subgraph Host["🖥️ Docker Host"]
        direction TB

        subgraph Containers["컨테이너"]
            C1["📦 Container 1<br/>eth0: 172.17.0.2"]
            C2["📦 Container 2<br/>eth0: 172.17.0.3"]
        end

        Bridge["🌉 docker0 bridge<br/>172.17.0.1"]
        HostNet["🌐 Host Network<br/>eth0"]
    end

    C1 -->|"veth"| Bridge
    C2 -->|"veth"| Bridge
    Bridge --> HostNet
    HostNet --> Internet["☁️ Internet"]

    style Host fill:#f8fafc,stroke:#64748b
    style Containers fill:#dbeafe,stroke:#2563eb
    style Bridge fill:#dcfce7,stroke:#16a34a
    style HostNet fill:#fef3c7,stroke:#d97706`

// Data container pattern template
const DATA_CONTAINER_TEMPLATE = `flowchart TB
    subgraph Pattern["📦 Data Container 패턴"]
        direction TB

        DataContainer["🗄️ Data Container<br/>(볼륨 보유)"]

        App1["📦 App Container 1"]
        App2["📦 App Container 2"]
        App3["📦 App Container 3"]
    end

    DataContainer -->|"--volumes-from"| App1
    DataContainer -->|"--volumes-from"| App2
    DataContainer -->|"--volumes-from"| App3

    style Pattern fill:#f8fafc,stroke:#64748b
    style DataContainer fill:#dcfce7,stroke:#16a34a
    style App1 fill:#dbeafe,stroke:#2563eb
    style App2 fill:#dbeafe,stroke:#2563eb
    style App3 fill:#dbeafe,stroke:#2563eb`

// Cron expression template
const CRON_EXPRESSION_TEMPLATE = `flowchart LR
    subgraph Cron["⏰ Cron 표현식 구조"]
        direction LR

        M["*<br/>분<br/>(0-59)"]
        H["*<br/>시<br/>(0-23)"]
        D["*<br/>일<br/>(1-31)"]
        Mo["*<br/>월<br/>(1-12)"]
        W["*<br/>요일<br/>(0-6)"]
    end

    subgraph Examples["📋 예시"]
        direction TB
        E1["0 0 * * * → 매일 자정"]
        E2["0 9 * * 1 → 매주 월요일 9시"]
        E3["30 * * * * → 매시간 30분"]
    end

    M --> H --> D --> Mo --> W

    style Cron fill:#f8fafc,stroke:#64748b
    style Examples fill:#dbeafe,stroke:#2563eb
    style M fill:#dcfce7,stroke:#16a34a
    style H fill:#dcfce7,stroke:#16a34a
    style D fill:#dcfce7,stroke:#16a34a
    style Mo fill:#dcfce7,stroke:#16a34a
    style W fill:#dcfce7,stroke:#16a34a`

// Matrix parallel execution template
const MATRIX_PARALLEL_TEMPLATE = `flowchart TB
    subgraph Matrix["🔄 Matrix 병렬 실행"]
        direction TB

        subgraph Ubuntu["🐧 Ubuntu"]
            direction LR
            U1["📦 Node 14.x"]
            U2["📦 Node 16.x"]
            U3["📦 Node 18.x"]
        end

        subgraph Windows["🪟 Windows"]
            direction LR
            W1["📦 Node 14.x"]
            W2["📦 Node 16.x"]
            W3["📦 Node 18.x"]
        end
    end

    Trigger["🎯 Push Event"] --> Matrix
    Matrix --> Result["✅ 총 6개 Job 병렬 실행"]

    style Matrix fill:#f8fafc,stroke:#64748b
    style Ubuntu fill:#dbeafe,stroke:#2563eb
    style Windows fill:#dcfce7,stroke:#16a34a
    style Trigger fill:#fef3c7,stroke:#d97706
    style Result fill:#ecfdf5,stroke:#059669`

// GitHub Secrets template
const GITHUB_SECRETS_TEMPLATE = `flowchart TB
    subgraph Secrets["🔐 GitHub Secrets 설정"]
        direction TB

        Repo["📁 Repository: username/docker-ci"]

        subgraph SecretList["Secrets"]
            S1["🔑 DOCKER_HUB_USERNAME<br/>••••••••"]
            S2["🔑 DOCKER_HUB_PASSWORD<br/>••••••••"]
        end

        subgraph Usage["사용 방법"]
            U1["secrets.DOCKER_HUB_USERNAME"]
            U2["secrets.DOCKER_HUB_PASSWORD"]
        end
    end

    Repo --> SecretList
    SecretList --> Usage

    style Secrets fill:#f8fafc,stroke:#64748b
    style Repo fill:#dbeafe,stroke:#2563eb
    style SecretList fill:#fee2e2,stroke:#dc2626
    style Usage fill:#dcfce7,stroke:#16a34a`

// Simple hierarchy template
const SIMPLE_HIERARCHY_TEMPLATE = `flowchart TB
    Root["🏠 Root"]
    Child1["📁 Child 1"]
    Child2["📁 Child 2"]
    Child3["📁 Child 3"]

    Root --> Child1
    Root --> Child2
    Root --> Child3

    style Root fill:#dbeafe,stroke:#2563eb
    style Child1 fill:#dcfce7,stroke:#16a34a
    style Child2 fill:#dcfce7,stroke:#16a34a
    style Child3 fill:#dcfce7,stroke:#16a34a`

/**
 * Pattern detection keywords
 */
const PATTERNS = {
  containerLifecycle: ['created', 'running', 'paused', 'exited', 'docker create', 'docker start', 'docker stop', 'docker restart', 'docker rm', '생명주기', 'lifecycle', '생성됨', '실행 중', '종료됨'],
  dockerRunFlow: ['docker run', 'docker create', 'docker start', '컨테이너 생성', '컨테이너 시작', 'create + start'],
  volumeMount: ['bind mount', 'bind', 'docker volume', 'volume', 'tmpfs', '/var/lib/docker/volumes', '볼륨', 'volume 방식', '직접 연결', 'docker 관리', 'host area', 'container'],
  networkProxy: ['proxy', 'forward proxy', 'reverse proxy', 'load balancer', 'l4 proxy', 'nginx', 'web1', 'web2', 'webserver', 'db server'],
  containerBridge: ['docker0', 'bridge', 'veth', '172.17', 'eth0', '사용자 정의 bridge', 'container network'],
  dataContainer: ['data container', 'data-container', 'volumes-from', '--volumes-from', '볼륨 보유', '공유', 'volume container', '볼륨 컨테이너', 'data-1', 'data-2', 'docker host'],
  cronExpression: ['cron', '분 (0-59)', '시 (0-23)', '일 (1-31)', '월 (1-12)', '요일 (0-6)', '* * * * *', 'schedule'],
  matrixParallel: ['matrix', '병렬 실행', 'node 14', 'node 16', 'node 18', 'ubuntu', 'windows', '6개의 job'],
  githubSecrets: ['github secrets', 'secrets 설정', 'docker_hub_username', 'docker_hub_password', 'secrets.', '••••••••'],
  replicatedVsGlobal: ['replicated', 'global mode', 'replicas=', 'hostos1', 'hostos2', 'hostos3', '배포 모드', '노드당 1개', '지정 개수'],
  rollingUpdate: ['rolling update', '롤링 업데이트', 'v1.24', 'v1.25', '순차 업데이트', '무중단 업데이트', 'step 1', 'step 2', 'step 3', 'step 4'],
  multiContainerService: ['멀티 컨테이너', 'nginx', 'flask', 'redis', 'mysql', 'proxy', 'cache', '하나의 애플리케이션'],
  cliVsCompose: ['docker cli', 'docker compose', 'docker network create', 'docker volume create', 'docker-compose.yaml', 'docker compose up'],
  projectStructure: ['프로젝트 구조', 'app/', 'nginx/', 'docker-compose.yaml', 'dockerfile', 'nginx.conf', 'app.py'],
  threeTier: ['3-tier', 'frontend', 'backend', 'database', 'tier', 'frontend tier', 'backend tier', 'data tier'],
  serviceScaling: ['스케일링', 'scale', '--scale', 'flask-1', 'flask-2', 'flask-3', 'load balancer', '로드밸런싱'],
  composeVsK8s: ['kubernetes', 'k8s', 'compose vs', '대규모', '프로덕션', '멀티 클라우드'],
  dockerfileCommands: ['dockerfile 명령어', '빌드 단계', '설정 단계', '실행 단계', 'from', 'run', 'copy', 'add', 'env', 'arg', 'workdir', 'cmd', 'entrypoint', 'expose', 'volume', 'healthcheck'],
  runOptimization: ['run 명령어 최적화', 'run 최적화', '패키지 캐시 정리', 'apt-get', 'yum clean', 'apk', '--no-install-recommends'],
  cmdEntrypoint: ['cmd vs entrypoint', 'cmd와 entrypoint', '실행 명령 동작', 'docker run my-app', '--entrypoint'],
  buildCache: ['빌드 캐시', 'build cache', '캐시 사용', '캐시 무효화', '캐시 최적화'],
  ufsContainerLayer: ['read write', 'container layer', 'read only', 'ufs', 'union filesystem', 'image layers', 'docker image', 'httpd container', 'web source'],
  vmContainerComparison: ['가상머신', '컨테이너', 'hypervisor', 'guest os', 'vm1', 'vm2', '일반 서버', '온프레미스'],
  dockerEvolution: ['lxc', 'libcontainer', 'containerd', 'runc', 'cgroup', 'namespace'],
  dockerWorkflow: ['dockerfile', 'docker hub', 'docker run', 'push', 'pull', 'build', 'application 배포'],
  containerTypes: ['시스템 컨테이너', '애플리케이션 컨테이너', 'ubuntu', 'centos', 'nginx', 'frontend', 'backend', 'database'],
  physicalServer: ['물리 서버', 'os 1개', 'application 1개'],
  vmArchitecture: ['hypervisor', 'vm1', 'vm2', 'vm3', 'guest os'],
  containerArchitecture: ['host os', 'kernel', 'container a', 'container b', 'container c', 'process'],
  cnm: ['sandbox', 'endpoint', 'network', 'cnm', 'container network model', '격리된 네트워크'],
  dockerNetwork: ['docker0', 'bridge', 'veth', 'eth0', '172.17'],
  overlay: ['overlay', 'vxlan', 'multi-host', '오버레이'],
  imageLayers: ['layer', 'base image', 'FROM', '레이어', '베이스 이미지', 'application layer'],
  cicd: ['ci/cd', 'pipeline', 'build', 'test', 'deploy', 'jenkins', 'github actions', '빌드', '배포', 'docker hub'],
  compose: ['compose', 'docker-compose', 'services', 'depends_on', '서비스'],
  swarm: ['swarm', 'manager', 'worker', 'node', 'task', 'raft', '매니저', '워커']
}

/**
 * Check if text contains box-drawing characters (indicates invalid output)
 */
function hasBoxDrawingChars(text: string): boolean {
  return /[┌┐└┘├┤┬┴┼│─╭╮╰╯]/.test(text)
}

/**
 * Detect diagram pattern from ASCII content
 */
function detectPattern(ascii: string): string | null {
  const lowerAscii = ascii.toLowerCase()

  // Priority order for pattern matching
  const patternPriority = [
    'containerLifecycle',
    'dockerRunFlow',
    'volumeMount',
    'networkProxy',
    'containerBridge',
    'dataContainer',
    'cronExpression',
    'matrixParallel',
    'githubSecrets',
    'replicatedVsGlobal',
    'rollingUpdate',
    'multiContainerService',
    'cliVsCompose',
    'projectStructure',
    'threeTier',
    'serviceScaling',
    'composeVsK8s',
    'dockerfileCommands',
    'runOptimization',
    'cmdEntrypoint',
    'buildCache',
    'ufsContainerLayer',
    'vmContainerComparison',
    'dockerEvolution',
    'dockerWorkflow',
    'containerTypes',
    'vmArchitecture',
    'containerArchitecture',
    'physicalServer',
    'cnm',
    'dockerNetwork',
    'overlay',
    'imageLayers',
    'cicd',
    'compose',
    'swarm'
  ]

  for (const pattern of patternPriority) {
    const keywords = PATTERNS[pattern as keyof typeof PATTERNS]
    const matchCount = keywords.filter(kw => lowerAscii.includes(kw.toLowerCase())).length

    // Different thresholds for different patterns
    const threshold = pattern === 'vmContainerComparison' ? 3 : 2
    if (matchCount >= threshold) {
      return pattern
    }
  }

  return null
}

/**
 * Generate Mermaid code from ASCII diagram
 */
export function generateMermaidCode(ascii: string, type: DiagramType): string | null {
  const pattern = detectPattern(ascii)

  // Use predefined templates based on pattern
  switch (pattern) {
    case 'containerLifecycle':
      return CONTAINER_LIFECYCLE_TEMPLATE
    case 'dockerRunFlow':
      return DOCKER_RUN_FLOW_TEMPLATE
    case 'volumeMount':
      return VOLUME_MOUNT_TEMPLATE
    case 'networkProxy':
      return NETWORK_PROXY_TEMPLATE
    case 'containerBridge':
      return CONTAINER_BRIDGE_TEMPLATE
    case 'dataContainer':
      return DATA_CONTAINER_TEMPLATE
    case 'cronExpression':
      return CRON_EXPRESSION_TEMPLATE
    case 'matrixParallel':
      return MATRIX_PARALLEL_TEMPLATE
    case 'githubSecrets':
      return GITHUB_SECRETS_TEMPLATE
    case 'replicatedVsGlobal':
      return REPLICATED_VS_GLOBAL_TEMPLATE
    case 'rollingUpdate':
      return ROLLING_UPDATE_TEMPLATE
    case 'multiContainerService':
      return MULTI_CONTAINER_SERVICE_TEMPLATE
    case 'cliVsCompose':
      return CLI_VS_COMPOSE_TEMPLATE
    case 'projectStructure':
      return PROJECT_STRUCTURE_TEMPLATE
    case 'threeTier':
      return THREE_TIER_TEMPLATE
    case 'serviceScaling':
      return SERVICE_SCALING_TEMPLATE
    case 'composeVsK8s':
      return COMPOSE_VS_K8S_TEMPLATE
    case 'dockerfileCommands':
      return DOCKERFILE_COMMANDS_TEMPLATE
    case 'runOptimization':
      return RUN_OPTIMIZATION_TEMPLATE
    case 'cmdEntrypoint':
      return CMD_ENTRYPOINT_TEMPLATE
    case 'buildCache':
      return BUILD_CACHE_TEMPLATE
    case 'ufsContainerLayer':
      return UFS_CONTAINER_LAYER_TEMPLATE
    case 'vmContainerComparison':
      return VM_CONTAINER_COMPARISON_TEMPLATE
    case 'dockerEvolution':
      return DOCKER_EVOLUTION_TEMPLATE
    case 'dockerWorkflow':
      return DOCKER_WORKFLOW_TEMPLATE
    case 'containerTypes':
      return CONTAINER_TYPES_TEMPLATE
    case 'physicalServer':
      return PHYSICAL_SERVER_TEMPLATE
    case 'vmArchitecture':
      return VM_ARCHITECTURE_TEMPLATE
    case 'containerArchitecture':
      return CONTAINER_ARCHITECTURE_TEMPLATE
    case 'cnm':
      return CNM_TEMPLATE
    case 'dockerNetwork':
      return DOCKER_NETWORK_TEMPLATE
    case 'overlay':
      return OVERLAY_NETWORK_TEMPLATE
    case 'imageLayers':
      return IMAGE_LAYERS_TEMPLATE
    case 'cicd':
      return CICD_PIPELINE_TEMPLATE
    case 'compose':
      return COMPOSE_SERVICES_TEMPLATE
    case 'swarm':
      return SWARM_TEMPLATE
    default:
      // Try to generate based on diagram type
      return generateFromType(ascii, type)
  }
}

/**
 * Generate Mermaid based on diagram type
 */
function generateFromType(ascii: string, type: DiagramType): string | null {
  switch (type) {
    case 'network':
      return generateNetworkDiagram(ascii)
    case 'flow':
      return generateFlowDiagram(ascii)
    case 'tree':
      return generateTreeDiagram(ascii)
    case 'layer':
      return generateLayerDiagram(ascii)
    case 'architecture':
      return generateArchitectureDiagram(ascii)
    default:
      return null
  }
}

/**
 * Parse boxes from ASCII and generate network diagram
 */
function generateNetworkDiagram(ascii: string): string | null {
  const lines = ascii.split('\n')
  const boxes: { label: string; sublabel?: string }[] = []

  // Simple box extraction
  let currentBox = ''
  for (const line of lines) {
    // Look for text inside boxes
    const textMatch = line.match(/│\s*([^│]+?)\s*│/)
    if (textMatch) {
      const text = textMatch[1].trim()
      if (text && !text.match(/^[┌┐└┘├┤┬┴┼─]+$/)) {
        currentBox += (currentBox ? '<br/>' : '') + text
      }
    }
    // Box end
    if (line.includes('└') && currentBox) {
      boxes.push({ label: currentBox.split('<br/>')[0], sublabel: currentBox.split('<br/>').slice(1).join('<br/>') })
      currentBox = ''
    }
  }

  if (boxes.length < 2) return null

  // Validate: reject if labels contain box-drawing characters
  const invalidBoxes = boxes.filter(b => hasBoxDrawingChars(b.label) || (b.sublabel && hasBoxDrawingChars(b.sublabel)))
  if (invalidBoxes.length > boxes.length / 2) return null

  // Generate simple flowchart
  let mermaid = 'flowchart TB\n'
  boxes.forEach((box, i) => {
    const nodeId = `N${i}`
    // Clean labels
    const cleanLabel = box.label.replace(/[┌┐└┘├┤┬┴┼│─]/g, '').trim()
    const cleanSublabel = box.sublabel?.replace(/[┌┐└┘├┤┬┴┼│─]/g, '').trim()
    const label = cleanSublabel ? `${cleanLabel}<br/>${cleanSublabel}` : cleanLabel
    if (label) {
      mermaid += `    ${nodeId}["${label}"]\n`
    }
  })

  // Connect sequentially
  for (let i = 0; i < boxes.length - 1; i++) {
    mermaid += `    N${i} --> N${i + 1}\n`
  }

  return mermaid
}

/**
 * Generate flow diagram from ASCII
 */
function generateFlowDiagram(ascii: string): string | null {
  // Look for arrow patterns to determine flow
  const hasHorizontalFlow = ascii.includes('→') || ascii.includes('-->')
  const orientation = hasHorizontalFlow ? 'LR' : 'TB'

  // Try to extract steps from ASCII
  const steps: string[] = []
  const lines = ascii.split('\n')

  for (const line of lines) {
    // Match text in brackets or boxes
    const matches = line.match(/\[([^\]]+)\]/g)
    if (matches) {
      matches.forEach(m => {
        const text = m.slice(1, -1).trim()
        if (text && !hasBoxDrawingChars(text)) {
          steps.push(text)
        }
      })
    }
  }

  if (steps.length >= 2) {
    let mermaid = `flowchart ${orientation}\n`
    steps.forEach((step, i) => {
      mermaid += `    S${i}["${step}"]\n`
    })
    for (let i = 0; i < steps.length - 1; i++) {
      mermaid += `    S${i} --> S${i + 1}\n`
    }
    return mermaid
  }

  return `flowchart ${orientation}
    Start["시작"] --> Process["처리"]
    Process --> End["완료"]`
}

/**
 * Generate tree diagram from ASCII
 */
function generateTreeDiagram(ascii: string): string | null {
  const lines = ascii.split('\n').filter(l => l.trim())
  if (lines.length < 2) return null

  // Check if this looks like a real tree structure (not a comparison box diagram)
  const hasTreeMarkers = lines.some(l => l.includes('├──') || l.includes('└──'))
  const hasMultipleBoxes = (ascii.match(/┌/g) || []).length > 2

  // If it looks like multiple boxes side by side, don't parse as tree
  if (hasMultipleBoxes && !hasTreeMarkers) {
    return null
  }

  let mermaid = 'flowchart TB\n'
  let nodeCount = 0
  let rootLabel = ''
  const nodes: { label: string; indent: number }[] = []

  // Find root (first non-tree-marker line or line before ├/└)
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.match(/^[├└│─\s]+$/) && !trimmed.includes('├──') && !trimmed.includes('└──')) {
      // Check if this looks like a label (not box drawing)
      if (!hasBoxDrawingChars(trimmed) || trimmed.replace(/[┌┐└┘├┤┬┴┼│─\s]/g, '').length > 3) {
        rootLabel = trimmed.replace(/[┌┐└┘├┤┬┴┼│─]/g, '').trim()
        break
      }
    }
  }

  // Parse tree nodes
  for (const line of lines) {
    if (line.includes('├──') || line.includes('└──')) {
      const parts = line.split(/[├└]──/)
      if (parts[1]) {
        const label = parts[1].trim()
        // Validate label - skip if mostly box characters
        if (label && !hasBoxDrawingChars(label)) {
          nodes.push({ label, indent: line.indexOf('├') !== -1 ? line.indexOf('├') : line.indexOf('└') })
        }
      }
    }
  }

  // If no valid nodes found, return null
  if (nodes.length === 0) return null

  // Generate mermaid
  if (rootLabel) {
    mermaid += `    Root["${rootLabel}"]\n`
  } else {
    mermaid += `    Root["Root"]\n`
  }

  nodes.forEach((node, i) => {
    mermaid += `    Root --> N${i}["${node.label}"]\n`
    nodeCount++
  })

  return nodeCount > 0 ? mermaid : null
}

/**
 * Generate layer diagram from ASCII
 */
function generateLayerDiagram(ascii: string): string | null {
  return IMAGE_LAYERS_TEMPLATE
}

/**
 * Generate architecture diagram from ASCII
 */
function generateArchitectureDiagram(ascii: string): string | null {
  // Check for common architecture patterns
  const lowerAscii = ascii.toLowerCase()

  if (lowerAscii.includes('물리 서버') && lowerAscii.includes('hypervisor')) {
    return VM_ARCHITECTURE_TEMPLATE
  }

  if (lowerAscii.includes('물리 서버') && lowerAscii.includes('container')) {
    return CONTAINER_ARCHITECTURE_TEMPLATE
  }

  if (lowerAscii.includes('물리 서버') && lowerAscii.includes('os')) {
    return PHYSICAL_SERVER_TEMPLATE
  }

  return SIMPLE_HIERARCHY_TEMPLATE
}

/**
 * Create custom Mermaid code for specific Docker concepts
 */
export function createDockerDiagram(concept: string): string {
  const templates: Record<string, string> = {
    cnm: CNM_TEMPLATE,
    'docker-network': DOCKER_NETWORK_TEMPLATE,
    overlay: OVERLAY_NETWORK_TEMPLATE,
    layers: IMAGE_LAYERS_TEMPLATE,
    cicd: CICD_PIPELINE_TEMPLATE,
    compose: COMPOSE_SERVICES_TEMPLATE,
    swarm: SWARM_TEMPLATE,
    'vm-container': VM_CONTAINER_COMPARISON_TEMPLATE,
    'docker-evolution': DOCKER_EVOLUTION_TEMPLATE,
    'docker-workflow': DOCKER_WORKFLOW_TEMPLATE,
    'container-types': CONTAINER_TYPES_TEMPLATE,
    'physical-server': PHYSICAL_SERVER_TEMPLATE,
    'vm-architecture': VM_ARCHITECTURE_TEMPLATE,
    'container-architecture': CONTAINER_ARCHITECTURE_TEMPLATE,
    'ufs': UFS_CONTAINER_LAYER_TEMPLATE,
    'ufs-container-layer': UFS_CONTAINER_LAYER_TEMPLATE,
    'container-layer': UFS_CONTAINER_LAYER_TEMPLATE,
    'dockerfile-commands': DOCKERFILE_COMMANDS_TEMPLATE,
    'run-optimization': RUN_OPTIMIZATION_TEMPLATE,
    'cmd-entrypoint': CMD_ENTRYPOINT_TEMPLATE,
    'build-cache': BUILD_CACHE_TEMPLATE,
    'multi-container': MULTI_CONTAINER_SERVICE_TEMPLATE,
    'multi-container-service': MULTI_CONTAINER_SERVICE_TEMPLATE,
    'cli-vs-compose': CLI_VS_COMPOSE_TEMPLATE,
    'project-structure': PROJECT_STRUCTURE_TEMPLATE,
    'three-tier': THREE_TIER_TEMPLATE,
    '3-tier': THREE_TIER_TEMPLATE,
    'service-scaling': SERVICE_SCALING_TEMPLATE,
    'scaling': SERVICE_SCALING_TEMPLATE,
    'compose-vs-k8s': COMPOSE_VS_K8S_TEMPLATE,
    'kubernetes': COMPOSE_VS_K8S_TEMPLATE,
    'replicated-vs-global': REPLICATED_VS_GLOBAL_TEMPLATE,
    'replicated-global': REPLICATED_VS_GLOBAL_TEMPLATE,
    'deploy-mode': REPLICATED_VS_GLOBAL_TEMPLATE,
    'rolling-update': ROLLING_UPDATE_TEMPLATE,
    'rolling': ROLLING_UPDATE_TEMPLATE,
    'cron': CRON_EXPRESSION_TEMPLATE,
    'cron-expression': CRON_EXPRESSION_TEMPLATE,
    'schedule': CRON_EXPRESSION_TEMPLATE,
    'matrix': MATRIX_PARALLEL_TEMPLATE,
    'matrix-parallel': MATRIX_PARALLEL_TEMPLATE,
    'parallel': MATRIX_PARALLEL_TEMPLATE,
    'github-secrets': GITHUB_SECRETS_TEMPLATE,
    'secrets': GITHUB_SECRETS_TEMPLATE,
    'container-lifecycle': CONTAINER_LIFECYCLE_TEMPLATE,
    'lifecycle': CONTAINER_LIFECYCLE_TEMPLATE,
    'docker-run': DOCKER_RUN_FLOW_TEMPLATE,
    'docker-run-flow': DOCKER_RUN_FLOW_TEMPLATE,
    'volume-mount': VOLUME_MOUNT_TEMPLATE,
    'volume': VOLUME_MOUNT_TEMPLATE,
    'bind-mount': VOLUME_MOUNT_TEMPLATE,
    'network-proxy': NETWORK_PROXY_TEMPLATE,
    'proxy': NETWORK_PROXY_TEMPLATE,
    'container-bridge': CONTAINER_BRIDGE_TEMPLATE,
    'bridge-network': CONTAINER_BRIDGE_TEMPLATE,
    'data-container': DATA_CONTAINER_TEMPLATE
  }

  return templates[concept.toLowerCase()] || CNM_TEMPLATE
}
