# Chapter 06. Docker 네트워크

## 컨테이너 서비스를 위한 docker network 관리

### 목차
- Clip1 | 컨테이너 네트워크 - 컨테이너 네트워크 이해하기
- Clip2 | 사용자 정의 네트워크 - 사용자 정의 네트워크 생성과 조회하기
- Clip3 | [실습] docker DNS - docker DNS 이해와 활용하기
- Clip4 | 컨테이너 Proxy - HAProxy 및 Nginx를 이용한 컨테이너 proxy 이해
- Clip5 | [실습] Nginx를 활용한 컨테이너 proxy - Nginx를 이용한 컨테이너 proxy 구성하기
- Clip6 | [실습] HAProxy를 활용한 컨테이너 proxy - HAProxy를 이용한 컨테이너 proxy 구성하기

---

## 1. 컨테이너 네트워크

### Docker 컨테이너 네트워크

Docker 컨테이너의 기본 네트워크 구성에 대해 알아본다.

#### docker network 개요

- Docker network는 커널의 네트워크 스택의 하위로, 상위에는 네트워크 드라이버를 생성한다.
  - 즉, docker network = Linux network 와 같다.

- Docker network 아키텍처는 CNM(Container Networking Model)이라고 하는 인터페이스 집합 위에 구축한다. OS 및 인프라에 구애 받지 않으므로 인프라 스택에 관계없이 애플리케이션이 동일한 환경을 가질 수 있다.

- 리눅스 네트워킹 빌딩 블록: 리눅스 브리지, 네트워크 네임스페이스, veth pair 및 iptables가 포함. 이 조합은 복잡한 네트워크 정책을 위한 전달 규칙, 네트워크 분할 및 관리 도구를 제공한다.

#### Linux bridge

- 리눅스 브리지는 커널 내부의 물리적 스위치를 가상으로 구현한 OSI Layer 2 Device다.
- 트래픽을 검사하여 동적으로 학습되는 MAC 주소를 기반으로 트래픽을 전달.
- bridge network의 기본 대역?
  - 1) 172.{17-31}.0.0/16(65536개)
  - 2) 192.168.{0-240}.0/20(4096개)

```
Docker 엔진과 Docker CLI를 통해 관리 → bridge
Linux 커널과 OS 도구를 통해 관리 → docker0
                                    ↓
                              HostOS area
```

#### Network namespace

- 커널에 격리된 네트워크 스택으로 자체 인터페이스, 라우트 및 방화벽 규칙을 보유
- 컨테이너와 리눅스의 보안적인 측면으로, 컨테이너를 격리하는데 사용
- 네트워크 네임스페이스는 도커 네트워크를 통해 구성된 경우가 아니면 동일한 호스트의 두 컨테이너가 서로 통신하거나 호스트 자체와 통신할 수 없음을 보장
- 일반적으로 CNM(Container Network Model) 네트워크 드라이버는 각 컨테이너에 대해 별도의 네임스페이스를 구현
- [참고] https://github.com/moby/libnetwork/blob/master/docs/design.md

#### CNM(Container Network Model)

```
                    ┌─────────────────────────────┐
                    │         Sandbox             │ ← Sandbox(격리된 네트워크 스택)
                    │  (Ethernet(eth0), port,     │    Ethernet(eth0), port,
                    │   route table, DNS 구성     │    route table, DNS 구성
                    │   등이 포함 됨)              │    등이 포함 됨.
                    │                             │
                    │      ┌──────────┐           │
                    │      │ Endpoint │           │ ← Endpoint(가상 이더넷 인터페이스)
                    │      └────┬─────┘           │
                    └───────────┼─────────────────┘
                                │
                    ┌───────────┴─────────────────┐
                    │         Network             │ ← Network(가상 스위치, Bridge)
                    └─────────────────────────────┘
```

#### CNM, libnetwork

- CNM이 설계 문서라면, Libnetwork는 그에 대한 표준 구현체다.
- https://github.com/moby/libnetwork

```
                        ┌─────────────────────┐
                        │     Sandboxes       │
                        ├─────────────────────┤
                        │     Endpoints       │    Pluggable
    ┌─────────┐         ├─────────────────────┤    Interface     ┌─────────────────┐
    │ Docker  │ ←─API─→ │     Networks        │ ←─────────────→  │  Bridge driver  │
    │ Engine  │         ├─────────────────────┤                  │  (Single Host)  │
    └─────────┘         │  Service Discovery  │                  ├─────────────────┤
                        ├─────────────────────┤                  │ Overlay driver  │
                        │   Load Balancing    │                  │  (Multi Host)   │
                        ├─────────────────────┤                  ├─────────────────┤
                        │     Libnetwork      │                  │ MACvlan driver  │
                        └─────────────────────┘                  │(existing VLANs) │
                           Docker core network                   └─────────────────┘
                                                                  Network specifics
```

#### veth(virtual ethernet device)

- veth는 OSI 2계층 서비스로 컨테이너 내부에 제공되는 네트워크 인터페이스 eth0와 한 쌍(pair)으로 제공되어 docker0와 가상의 "터널링 네트워크"를 제공한다.
- 각 영역 조회 명령어

```
                    ┌─────────────────┐
                    │    Container    │
                    │                 │     ┌─────────────────┐
                    │  eth0: 172.17.0.2 ←──→│ ifconfig        │
                    │                 │     │ route           │
                    └────────┬────────┘     │ ip addr         │
                             │ Pair로 구성   └─────────────────┘
                             │
                    ┌────────┴────────┐
                    │  veth82a542f    │
    ┌─────────┐     │                 │     ┌─────────────────┐
    │ Docker  │ ←──→│     bridge      │ ←──→│   brctl show    │
    │ Engine  │     │                 │     └─────────────────┘
    └─────────┘     └────────┬────────┘
                             │
    ┌─────────┐     ┌────────┴────────┐     ┌─────────────────┐
    │  LINUX  │ ←──→│ docker0         │ ←──→│    ifconfig     │
    └─────────┘     │ (172.17.0.1)    │     └─────────────────┘
                    └────────┬────────┘
                             │
                    ┌────────┴────────┐     ┌─────────────────┐
                    │    Firewall     │ ←──→│    iptables     │
                    └────────┬────────┘     └─────────────────┘
                             │
                    ┌────────┴────────┐     ┌─────────────────┐
                    │   Host NIC      │ ←──→│    ifconfig     │
                    └─────────────────┘     └─────────────────┘
```

#### veth 실습 명령어

```bash
~$ sudo apt install bridge-utils
~$ brctl show

~$ docker run -it -d --name=fast-ubuntu ubuntu:14.04
~$ docker exec -it fast-ubuntu route
Destination     Gateway         Genmask         Flags Metric Ref    Use Iface
default         172.17.0.1      0.0.0.0         UG    0      0        0 eth0
172.17.0.0      *               255.255.0.0     U     0      0        0 eth0

~$ docker exec -it fast-ubuntu ip addr
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
13: eth0@if14: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP group default
    link/ether 02:42:ac:11:00:04 brd ff:ff:ff:ff:ff:ff

~$ ifconfig
```

#### 브리지 및 컨테이너 정보 조회

```bash
~$ brctl show
bridge name     bridge id               STP enabled     interfaces
docker0         8000.0242101789af       no              veth236eb4f
                                                        veth2f127d4
                                                        vethf60d64f

~$ docker network inspect bridge
~$ docker inspect -f "{{ .NetworkSettings.IPAddress }}" fast-ubuntu
172.17.0.3

~$ docker inspect fast-ubuntu | grep IPAddress
            "SecondaryIPAddresses": null,
            "IPAddress": "172.17.0.3",
                    "IPAddress": "172.17.0.4",

~$ docker inspect fast-ubuntu | grep Mac
            "MacAddress": "02:42:ac:11:00:04",
                    "MacAddress": "02:42:ac:11:00:04",
```

#### veth 상세 설명

- 두 네트워크 네임스페이스 사이의 연결선으로 동작하는 리눅스 네트워킹 인터페이스
- veth는 각 네임스페이스에 단일 인터페이스가 있는 전이중 링크(full duplex link)
- 한 인터페이스의 트래픽을 다른 인터페이스로 전달
- 도커 네트워크를 만들 때 도커 네트워크 드라이버는 veth를 사용하여 네임스페이스 간에 명시적인 연결을 제공
- 컨테이너가 도커 네트워크에 연결되면 veth의 한쪽 끝은 컨테이너 내부에 배치되며, (일반적으로 ethN 인터페이스로 표시) 다른 쪽은 도커 네트워크에 연결된다.

#### Container의 네트워크(eth0)와 veth 연결 확인

```bash
# Container의 네트워크(eth0)는 vethxxxxxxx의 숫자보다 하나 작은 값을 가진다.
~$ brctl show
~$ docker run -itd --name=veth_test1 ubuntu:14.04
~$ brctl show
docker0         8000.024248fce1ca       no              veth12d01b0
                                                        veth44e8aa8
                                                        vethdc3aced

~$ docker exec veth_test1 ip addr show eth0
240: eth0@if241: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP group default
    link/ether 02:42:ac:11:00:07 brd ff:ff:ff:ff:ff:ff
    inet 172.17.0.7/16 brd 172.17.255.255 scope global eth0

~$ sudo su -
root@hostos1:~# cat /sys/class/net/vethdc3aced/ifindex
241

~$ docker exec -it veth_test1 bash
root@5276a27ab05c:/# cat /sys/class/net/eth0/iflink
241
```

#### iptables NAT 규칙 확인

```bash
~$ sudo iptables -t nat -L -n
Chain PREROUTING (policy ACCEPT)
target     prot opt source               destination
DOCKER     all  --  0.0.0.0/0            0.0.0.0/0            ADDRTYPE match dst-type LOCAL

Chain INPUT (policy ACCEPT)
target     prot opt source               destination

Chain OUTPUT (policy ACCEPT)
target     prot opt source               destination
DOCKER     all  --  0.0.0.0/0           !127.0.0.0/8          ADDRTYPE match dst-type LOCAL

Chain POSTROUTING (policy ACCEPT)
target     prot opt source               destination
MASQUERADE  all  --  172.17.0.0/16        0.0.0.0/0
MASQUERADE  tcp  --  172.17.0.2           172.17.0.2           tcp dpt:5000
MASQUERADE  tcp  --  172.17.0.3           172.17.0.3           tcp dpt:9000
…
MASQUERADE  tcp  --  172.17.0.8           172.17.0.8           tcp dpt:6060
MASQUERADE  tcp  --  172.17.0.9           172.17.0.9           tcp dpt:6060
MASQUERADE  tcp  --  172.17.0.10          172.17.0.10          tcp dpt:6060

Chain DOCKER (2 references)
target     prot opt source               destination
RETURN     all  --  0.0.0.0/0            0.0.0.0/0
DNAT       tcp  --  0.0.0.0/0            0.0.0.0/0            tcp dpt:5000 to:172.17.0.2:5000
DNAT       tcp  --  0.0.0.0/0            0.0.0.0/0            tcp dpt:9000 to:172.17.0.3:9000
…
DNAT       tcp  --  0.0.0.0/0            0.0.0.0/0            tcp dpt:6060 to:172.17.0.8:6060
DNAT       tcp  --  0.0.0.0/0            0.0.0.0/0            tcp dpt:6064 to:172.17.0.9:6060
DNAT       tcp  --  0.0.0.0/0            0.0.0.0/0            tcp dpt:6065 to:172.17.0.10:6060
```

#### docker network 주요 옵션

| 옵션 | 설명 |
|---|---|
| --add-host=[Host명:IP Address] | Container의 /etc/hosts에 Host명과 IP Address를 설정 |
| --dns=[IP Address] | DNS 서버의 IP Address를 설정 (/etc/resolv.conf) (168.126.63.1~3 / 8.8.8.8) |
| --mac-address=[MAC Address] | Container의 MAC Address 설정 |
| --expose=[포트 번호] | Container 내부에서 Host로 노출할 포트 번호 지정 |
| --net=[bridge \| none \| host] | Container의 네트워크 설정 (bridge = docker0) |
| -h, --hostname="Host명" | Container의 Host명 설정(default, container ID가 호스트명) |
| -P, --publish-all=[true \| false] | Container 내부의 노출된 포트를 호스트 임의의(32768~) 포트를 호스트와 연결(명시적) |
| -p [Host 포트 번호]:[Container 포트 번호] --publish published=5000, target=80 | Host와 Container의 포트를 매핑(암시적) |
| --link=[container:container_id] | 동일 Host의 다른 Container에서 액세스 시 이름 설정 → IP 가 아닌 container의 이름을 이용해 통신 가능 |

#### 네트워크 옵션 실습

```bash
# container DNS 서버 설정
kevin@hostos1:~$ docker run -it --dns=8.8.8.8 centos bash
[root@83417a39224b /]# cat /etc/resolv.conf
nameserver 8.8.8.8

# container MAC Address 설정
~$ docker run -d --mac-address="92:d0:c6:0a:29:33" centos:7
~$ docker inspect --format="{{ .Config.MacAddress }}" c268f1
92:d0:c6:0a:29:33

# Host명과 IP Address 설정
~$ docker container run -it --add-host=fastcampus.co.kr:192.168.0.100 centos:7 bash
[root@4e0aaf8a3b17 /]# cat /etc/hosts
127.0.0.1       localhost
::1             localhost ip6-localhost ip6-loopback
fe00::0         ip6-localnet
ff00::0         ip6-mcastprefix
ff02::1         ip6-allnodes
ff02::2         ip6-allrouters
192.168.0.100   fastcampus.co.kr
172.17.0.8      4e0aaf8a3b17
```

#### docker-proxy

docker-proxy는 kernel이 아닌 사용자 환경에서 수행되기 때문에 kernel과 상관없이 host가 받은 패킷을 그대로 container의 port로 전달. port를 외부로 노출하도록 설정하게 되면, docker host에는 docker-proxy 라는 프로세스가 자동으로 생성

```bash
kevin@hostos1:~$ docker run -d -P --name=myweb --expose=40001 nginx:1.25.0
kevin@hostos1:~$ docker port myweb
80/tcp -> 0.0.0.0:32773
80/tcp -> [::]:32773
40001/tcp -> 0.0.0.0:32772
40001/tcp -> [::]:32772

kevin@hostos1:~$ docker ps | grep myweb
cb6070461f30   nginx:1.25.0   "/docker-entrypoint.…"   About a minute ago   Up About a minute
0.0.0.0:32773->80/tcp, :::32773->80/tcp, 0.0.0.0:32772->40001/tcp, :::32772->40001/tcp   myweb

kevin@hostos1:~$ sudo netstat -nlp | grep 32773
tcp        0      0 0.0.0.0:32773           0.0.0.0:*               LISTEN      75516/docker-proxy
tcp6       0      0 :::32773                :::*                    LISTEN      75523/docker-proxy

kevin@hostos1:~$ ps -ef | grep 75516
root       75516   58622  0 20:14 ?        00:00:00 /usr/bin/docker-proxy -proto tcp -host-ip 0.0.0.0 -host-port 32773 -container-ip 172.17.0.11 -container-port 80
```

#### docker network, overlay

- Overlay network는 서로 다른 Host(node)에서 서비스되는 컨테이너를 네트워크로 연결하는데 사용 되고, 이런 네트워크 생성을 위해 overlay network driver 를 사용 한다.
- 네트워크로 연결된 여러 Docker Host 안에 있는 Docker Daemon 간의 통신을 관리하는 가상 네트워크다.
- 컨테이너는 overlay network의 서브넷에 해당하는 IP 대역을 할당 받고, 받은 IP를 통해 상호간의 내부 통신을 수행한다.
- 따라서, overlay network에 포함되어 있는 모든 컨테이너들은 서로 다른 Docker Host에 있는 컨테이너와 같은 서버에 있는 것처럼 통신이 가능해 진다.
- Docker swarm을 통해 구현할 수 있다. (ch.11)

```bash
~$ docker network inspect {network-ID} 를 통해 조회 가능
```

```
                                    ┌─────────────┐
                                    │  Container  │
                    ┌─────────────┐ └─────────────┘
                    │   Docker    │     │
                    │   Engine    │     │     ┌─────────────┐
                    └──────┬──────┘     │     │  Container  │
                           │            │     └─────────────┘
              overlay network           │           │
                           │            │   bridge network
    ┌──────────┐   ┌───────┴───────┐    │           │        ┌─────────────┐
    │ Internet │───│    Switch     │────┼───────────┼────────│  Container  │
    └──────────┘   └───────┬───────┘    │           │        └─────────────┘
                           │            │    Docker Engine
              overlay network           │           │
                           │            │           │
                    ┌──────┴──────┐     │     ┌─────────────┐
                    │   Docker    │     │     │  Container  │
                    │   HostOS    │     │     └─────────────┘
                    └─────────────┘     │
                                    ┌───┴─────────┐
                                    │  Container  │
                                    └─────────────┘
```

---

## 2. 사용자 정의 네트워크

### 사용자 정의 docker network

- docker는 기본적으로 Host OS와 bridge 연결을 하며, --net 옵션을 통해 네트워크 설정 가능
- docker network create로 "사용자 정의 bridge network" 생성
- **사용자 정의 네트워크에 연결하면 Container는 Container의 이름이나 IP 주소로 서로 통신 가능**
- Overlay network(docker swarm)나 커스텀 플러그인 사용 시 multi-host 연결 가능

| 값 | 설명 |
|---|---|
| bridge | bridge 접속(default: docker0 – 172.17.0.0/16) 사용 : 172.17.0.2~ |
| none | 네트워크에 접속하지 않음. 무지정(격리용) |
| container:[container_name\|id] | 다른 Container의 네트워크를 사용 (container:ub_test) |
| host | Container가 Host OS의 네트워크를 사용 |
| macvlan | 물리적 네트워크에 컨테이너 mac 주소를 통한 직접적 연결 구현 시 사용 |
| NETWORK(사용자정의 network name) | 사용자 정의 네트워크 사용 |

#### docker network, "host"

```bash
# nginx 이미지에 노출된 포트 80번을 호스트 포트 80번에 연결 호스트 IP를 이용하여 서비스.
~$ docker run -d --name=nginx_host --net=host nginx:1.25.0
~$ sudo netstat –nlp | grep 80
Tcp        0      0 0.0.0.0:80              0.0.0.0:*               LISTEN      8967/nginx: master
Tcp6       0      0 :::80                   :::*                    LISTEN      8967/nginx: master

~$ curl localhost:80
<!DOCTYPE html>
<html>
<head>
…

# -p 옵션으로 포트를 연결한 경우에는 docker-proxy를 이용했지만, 출력된 결과를 보면 호스트
# 운영체제에 직접 PID를 할당 받아 서비스하는 것을 알 수 있고, Docker0를 사용하지 않는다.
~$ ps -ef | grep 8967
Root        8967  8945  0 17:10 ?        00:00:00 nginx: master process nginx –g daemon off;
Systemd+    9007  8967  0 17:10 ?        00:00:00 nginx: worker process

# 따라서 컨테이너에는 별도의 IP가 부여되지 않는다.
~$ docker inspect nginx_host | grep IPAddress
            "IPAddress": "",
                    "IPAddress": "",
```

#### docker network create

```bash
T1] ~$ docker network create [-d(--driver) bridge] mynet
~$ docker network ls
NETWORK ID          NAME                DRIVER              SCOPE
b04e3178d1f9        mynet               bridge              local

~$ route
~$ docker network inspect b04e3178d1f9

~$ ifconfig
br-b04e3178d1f9 Link encap:Ethernet  HWaddr 02:42:12:53:06:ec
          inet addr:172.18.0.1  Bcast:172.18.255.255  Mask:255.255.0.0

T2] ~$ docker run --net=mynet -it --name=net-check1 ubuntu:14.04 bash
[root@0ea81e6a34a1 /]# ifconfig
[root@0ea81e6a34a1 /]# route

T3] ~$ docker run --net=mynet -it --name=net-check2 ubuntu:14.04 bash

T1] ~$ brctl show
bridge name     bridge id               STP enabled     interfaces
br-b04e3178d1f9 8000.0242dbf56cbe       no              veth67fd328
                                                        vethe246900
docker0         8000.02427a754b23       no              veth4bdc34e

~$ docker network inspect mynet  # "Subnet": "172.18.0.0/16"
```

#### 사용자 정의 네트워크를 통한 컨테이너 이름으로 통신

사용자 정의 네트워크 구성을 통해 컨테이너 이름으로 통신이 가능, Docker DNS에 의한 Service Discovery(서비스 검색) 기능을 사용할 수 있다.

```bash
T2] ~$ docker run --net=mynet -it --name=net-check1 ubuntu:14.04 bash
root@f327d40f9a60:/# ping -c 3 net-check2
PING net-check2 (172.18.0.3) 56(84) bytes of data.
64 bytes from net-check2.mynet (172.18.0.3): icmp_seq=1 ttl=64 time=0.184 ms
64 bytes from net-check2.mynet (172.18.0.3): icmp_seq=2 ttl=64 time=0.068 ms
64 bytes from net-check2.mynet (172.18.0.3): icmp_seq=3 ttl=64 time=0.051 ms

T3] ~$ docker run --net=mynet -it --name=net-check2 ubuntu:14.04 bash
root@683bb3438a52:/# ping -c 3 net-check1
PING net-check1 (172.18.0.2) 56(84) bytes of data.
64 bytes from net-check1.mynet (172.18.0.2): icmp_seq=1 ttl=64 time=0.071 ms
64 bytes from net-check1.mynet (172.18.0.2): icmp_seq=2 ttl=64 time=0.050 ms
64 bytes from net-check1.mynet (172.18.0.2): icmp_seq=3 ttl=64 time=0.145 ms
```

#### 특정 IP 대역 지정 네트워크 생성

```bash
# 사용자 정의 네트워크 구성을 통해 특정 IP 대역 지정도 가능하다.
~$ docker network create \
> --driver bridge \
> --subnet 172.30.1.0/24 \       → CIDR 표기만 설정 가능, 255.255.255.0 과 같음.
> --ip-range 172.30.1.0/24 \     → subnet 이하, IP 범위 조정 가능.(172.30.1.100/26)
> --gateway 172.30.1.1 \
> vswitch-net                    → 256개의 IP 중 254개 사용 가능.

~$ docker network ls
NETWORK ID          NAME                DRIVER              SCOPE
17500fea62ff        vswitch-net         bridge              local

~$ docker run --net=vswitch-net -itd --name=net1 ubuntu:14.04
~$ docker run --net=vswitch-net -itd --name=net2 --ip 172.30.1.100 ubuntu:14.04

# 생성된 Bridge network 정보를 inspect를 통해 확인
~$ docker network inspect vswitch-net
```

```bash
# 사용자 정의 네트워크 구성을 통해 특정 IP 대역 지정도 가능하다.
~$ docker inspect net1 | grep IPAddress
~$ docker inspect net2 | grep IPAddress

~$ brctl show
~$ route
~$ ip route

~$ docker exec net1 ip addr
72: eth0@if73: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP group default
    link/ether 02:42:ac:11:00:09 brd ff:ff:ff:ff:ff:ff
    inet 172.30.1.2/24 brd 172.17.255.255 scope global eth0
       valid_lft forever preferred_lft forever
```

#### docker network topology

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│     my-web      │  │     my-was      │  │      my-db      │
├─────────────────┤  ├─────────────────┤  ├─────────────────┤
│ Network         │  │                 │  │                 │
│ namespace       │  │                 │  │                 │
│                 │  │                 │  │                 │
│ eth0→172.17.0.2 │  │ eth0→172.17.0.3 │  │ eth0→172.18.0.2 │
└────────┬────────┘  └────────┬────────┘  └────────┬────────┘
         │                    │                    │
    veth834dbbe          vetha61bc38          vethb396607
         │                    │                    │
         └────────────┬───────┘                    │
                      │                            │
              ┌───────┴───────┐            ┌───────┴───────┐
              │ docker0(bridge)│           │ fc-net(bridge)│
              │   172.17.0.1   │           │   172.18.0.1  │
              └───────┬────────┘           └───────┬───────┘
                      │                            │
                      └──────────┬─────────────────┘
                                 │
                         ┌───────┴───────┐
                         │   iptables    │
                         │ DNAT/SNAT을   │
                         │ 이용한 routing│
                         └───────┬───────┘
                                 │
                            ┌────┴────┐
                            │  enp0s8 │
                            └─────────┘
```

#### docker network connect | disconnect

```bash
# 실행 중인 컨테이너에 새로운 네트워크 대역의 docker network를 연결해 본다.
~$ docker run -it --name=add-net ubuntu:14.04 bash
root@a84f6ea63266:/# ifconfig
eth0      Link encap:Ethernet  HWaddr 02:42:ac:11:00:02
          inet addr:172.17.0.2  Bcast:172.17.255.255  Mask:255.255.0.0

# 다른 터미널
~$ docker ps
CONTAINER ID   IMAGE          COMMAND   CREATED          STATUS          PORTS     NAMES
a84f6ea63266   ubuntu:14.04   "bash"    27 seconds ago   Up 26 seconds             add-net

~$ docker network create --driver=bridge fc-net2
~$ docker netwrok ls
~$ route
172.20.0.0      0.0.0.0         255.255.0.0     U     0      0        0 br-7d8f5d97de28

~$ ifconfig
br-7d8f5d97de28: flags=4099<UP,BROADCAST,MULTICAST>  mtu 1500
        inet 172.20.0.1  netmask 255.255.0.0  broadcast 172.20.255.255
```

```bash
# 실행 중인 컨테이너에 새로운 네트워크 대역의 docker network를 연결해 본다.
~$ docker network connect fc-net2 add-net

root@a84f6ea63266:/# ifconfig
eth0      Link encap:Ethernet  HWaddr 02:42:ac:11:00:02
          inet addr:172.17.0.2  Bcast:172.17.255.255  Mask:255.255.0.0
…
eth1      Link encap:Ethernet  HWaddr 02:42:ac:14:00:02
          inet addr:172.20.0.2  Bcast:172.20.255.255  Mask:255.255.0.0

~$ docker network inspect fc-net2

~$ docker network rm fc-net2
Error response from daemon: error while removing network: network fc-net2 id
7d8f5d97de28e7b49612b2bf0fabe5db16b5cce6d24af2fc7e4063163237d4b1 has active endpoints

~$ docker network disconnect fc-net2 add-net

root@a84f6ea63266:/# ifconfig
eth0      Link encap:Ethernet  HWaddr 02:42:ac:11:00:02
          inet addr:172.17.0.2  Bcast:172.17.255.255  Mask:255.255.0.0
```

#### 다중 네트워크 연결 구성

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│      my-db       │     │      my-was      │     │      my-web      │
├──────────────────┤     ├──────────────────┤     ├──────────────────┤
│     Sandbox      │     │     Sandbox      │     │     Sandbox      │
│                  │     │                  │     │                  │
│ Network namespace│     │ Network namespace│     │ Network namespace│
│                  │     │                  │     │                  │
│    Endpoint      │     │    Endpoint      │     │ Endpoint Endpoint│
└────────┬─────────┘     └────────┬─────────┘     └───┬────────┬─────┘
         │                        │                   │        │
         │                        │                   │ connect│
         └────────────────┬───────┴───────────────────┘        │
                          │                                    │
              ┌───────────┴───────────┐            ┌───────────┴───────────┐
              │    Backend Network    │            │   Frontend Network    │
              │       (back-net)      │            │      (front-net)      │
              └───────────────────────┘            └───────────────────────┘
```

```bash
~$ docker network create --driver=bridge back-net
~$ docker network create --driver=bridge front-net
~$ docker run --name=my-web -itd --net=front-net ubuntu:14.04
~$ docker run --name=my-was -itd --net=back-net ubuntu:14.04
~$ docker run --name=my-db -itd --net=back-net ubuntu:14.04
~$ docker network connect back-net my-web
~$ docker exec my-web route
~$ docker exec my-was route
~$ docker exec my-db route
~$ docker network inspect front-net  # my-web
~$ docker network inspect back-net   # my-web / my-was / my-db
```

```bash
~$ docker exec -it my-web bash
root@175d24fcf62a:/# ping -c 1 my-was
64 bytes from my-was.front-net (172.21.0.3): icmp_seq=1 ttl=64 time=0.163 ms

root@175d24fcf62a:/# ping -c 1 my-db
64 bytes from my-db.back-net (172.22.0.3): icmp_seq=1 ttl=64 time=0.127 ms

~$ docker exec –it my-was bash
root@7830705c564f:/# ping –c 1 my-web
64 bytes from my-web.front-net (172.21.0.2): icmp_seq=2 ttl=64 time=0.122 ms

root@7830705c564f:/# ping –c 1 my-db
64 bytes from my-db.back-net (172.22.0.3): icmp_seq=2 ttl=64 time=0.110 ms

~$ docker network disconnect front-net my-was
~$ docker stop my-web my-was my-db
~$ docker rm my-web my-was my-db
~$ docker network rm back-net
~$ docker network rm front-net
```

---

## 3. Docker DNS

### docker DNS 개요

- Docker 컨테이너는 IP를 사용자 정의 네트워크의 컨테이너 이름으로 자동 확인하는 DNS 서버가 Docker 호스트에 생성된다. (127.0.0.11)
  - Docker의 기본 docker0 bridge driver에는 DNS가 포함되어 있지 않으므로 DNS는 내장된 docker0 bridge driver에서 작동하지 않는다.
- 동일 네트워크 alias 할당을 통해 하나의 타겟 그룹을 만들어 요청에 Round Robin 방식으로 응답한다.
- 컨테이너 생성 시 호스트 시스템에서 다음 세 파일을 복사하여 컨테이너 내부에 적용하여 컨테이너 간에 이름으로 찾기가 가능해진다.
  - /etc/hostname
  - /etc/hosts
  - /etc/resolv.conf

### docker DNS 동작 방식

libnetwork는 핵심 네트워킹 뿐만 서비스 검색 기능 제공을 통해 모든 컨테이너가 이름으로 서로를 찾을 수 있게 한다. (--name or --net-alias 사용 시 DNS에 등록)

다음은 컨테이너 내부에서 동일 네트워크의 다른 컨테이너명으로 ping을 수행하는 과정이다.

```
                    ┌────────────────────────────────────────────────┐
                    │                   Container                      │
    ┌─────────┐     │                                                  │
    │ Docker  │     │  root@f327d40f9a60:/# ping net1-container ───────┤
    │ Engine  │ ←───┤                         │                        │
    │(DNS     │     │                         ↓                        │
    │ server) │     │              DNS resolver (into container)       │
    └─────────┘     │                                                  │
                    └──────────────────────────────────────────────────┘
```

### [실습] 사용자 정의 네트워크의 docker DNS 확인

```bash
# 사용자 정의 네트워크와 동일 target group(--net-alias)을 지정하여 DNS 응답을 확인해 본다.
~$ docker network ls
~$ docker network create fc-net
~$ docker network ls
NETWORK ID          NAME                DRIVER              SCOPE
4de451a85832        fc-net              bridge              local

~$ route
172.19.0.0      0.0.0.0         255.255.0.0     U     0      0        0 br-4de451a85832

~$ docker run -d --name=es1 --net=fc-net --net-alias=esnet-tg -p 9201:9200 -p 9301:9300 -e "discovery.type=single-node" elasticsearch:7.17.10

~$ docker run -d --name=es2 --net=fc-net --net-alias=esnet-tg -p 9202:9200 -p 9302:9300 -e "discovery.type=single-node" elasticsearch:7.17.10

kevin@hostos1:~$ docker ps | grep es
eca69cd10625   elasticsearch:7.17.10   "/bin/tini -- /usr/l…"   38 seconds ago   Up 36 seconds
0.0.0.0:9202->9200/tcp, :::9202->9200/tcp, 0.0.0.0:9302->9300/tcp, :::9302->9300/tcp   es2
26e671cf7be7   elasticsearch:7.17.10   "/bin/tini -- /usr/l…"   49 seconds ago   Up 47 seconds
0.0.0.0:9201->9200/tcp, :::9201->9200/tcp, 0.0.0.0:9301->9300/tcp, :::9301->9300/tcp   es1
```

#### DNS 조회 테스트

```bash
# 사용자 정의 네트워크에 자동으로 DNS 기능이 활성화되는지 확인해 보자.
~$ docker run -it --rm --name=request-container --net=fc-net busybox nslookup esnet-tg
Server:         127.0.0.11
Address:        127.0.0.11:53   # Server & Address는 어느 DNS 서버에서 쿼리를 요청했는지를 의미

Non-authoritative answer:
Name:   esnet-tg.xxxxxx         # 조회한 도메인과 IP 주소
Address: 218.38.x.x

~$ docker run -it --rm --name=request-container --net=fc-net busybox nslookup 172.19.0.2
Server:         127.0.0.11
Address:        127.0.0.11:53

Non-authoritative answer:
2.0.19.172.in-addr.arpa name = es1.fc-net

~$ docker run -it --rm --name=request-container --net=fc-net busybox nslookup 172.19.0.3
Server:         127.0.0.11
Address:        127.0.0.11:53

Non-authoritative answer:
3.0.19.172.in-addr.arpa name = es2.fc-net
```

#### curl을 통한 서비스 테스트

```bash
~$ docker run -it --rm --name=request-container --net=fc-net centos:8 bash
[root@104c39bda98c /]# curl -s esnet-tg:9200
{
  "name" : "eca69cd10625",
  "cluster_name" : "docker-cluster",
  "cluster_uuid" : "uP9HrKhjSgylZbKDGEnsNw",
  "version" : {
    "number" : "7.17.10",
    …
  },
  "tagline" : "You Know, for Search"
}

[root@104c39bda98c /]# curl -s esnet-tg:9200
{
  "name" : "26e671cf7be7",
  "cluster_name" : "docker-cluster",
  "cluster_uuid" : "99PUfxR4SRScfDH40Q1mwg",
  "version" : {
    "number" : "7.17.10",
    …
  },
  "tagline" : "You Know, for Search"
}
```

#### net-alias 확인

```bash
# target group으로 등록된 --net-alias를 조회한다.
~$ docker inspect es1
 "Networks": {
                "fc-net": {
                    "IPAMConfig": null,
                    "Links": null,
                    "Aliases": [
                        "esnet-tg",
                        "eca69cd10625"

~$ docker inspect es2
```

### [실습] docker DNS를 활용한 docker proxy (Load balancing)

1) 사용자 정의 Bridge network 생성
2) --net-alias를 이용한 target group 생성
3) 등록된 DNS 등록 확인 ("dig" tool)

```
                    ┌─────────────────────────────────────────────┐
                    │        Docker 사용자 정의 bridge network    │
                    │                                             │
                    │                                             │
                    │    --net-alias                              │
                    │         │              Docker DNS           │
                    │         │           Service discovery       │
                    │    172.200.0.2       (127.0.0.11)           │
                    │    172.200.0.3                              │
                    │    172.200.0.4        alias에 포함된        │
                    │                      container들의          │
                    │    172.200.0.5        IP주소 등록           │
                    └─────────────────────────────────────────────┘
```

```bash
~$ docker network create \
--driver bridge \
--subnet 172.200.1.0/24 \
--ip-range 172.200.1.0/24 \
--gateway 172.200.1.1 \
netlb

~$ route
~$ docker network ls
cb1db40f7156        netlb               bridge              local

~$ docker run -itd --name=nettest1 --net=netlb --net-alias tg-net ubuntu:14.04
~$ docker run -itd --name=nettest2 --net=netlb --net-alias tg-net ubuntu:14.04
~$ docker run -itd --name=nettest3 --net=netlb --net-alias tg-net ubuntu:14.04
~$ docker inspect nettest1 | grep IPAddress    # "172.200.1.2"
~$ docker inspect nettest2 | grep IPAddress    # "172.200.1.3"
~$ docker inspect nettest3 | grep IPAddress    # "172.200.1.4"
```

#### Round Robin 테스트

```bash
~$ docker run -it --name=frontend --net=netlb ubuntu:14.04 bash
root@c50fde4215c8:/# ping -c 1 tg-net
PING tg-net (172.200.1.3) 56(84) bytes of data.
64 bytes from nettest2.netlb (172.200.1.3): icmp_seq=1 ttl=64 time=0.137 ms

root@c50fde4215c8:/# ping -c 1 tg-net
PING tg-net (172.200.1.2) 56(84) bytes of data.
64 bytes from nettest1.netlb (172.200.1.2): icmp_seq=1 ttl=64 time=0.072 ms

root@c50fde4215c8:/# ping -c 1 tg-net
PING tg-net (172.200.1.4) 56(84) bytes of data.
64 bytes from nettest3.netlb (172.200.1.4): icmp_seq=1 ttl=64 time=0.066 ms

root@c50fde4215c8:/# apt update
root@c50fde4215c8:/# apt-get -y install dnsutils
```

#### dig 명령어를 통한 DNS 레코드 확인

```bash
root@c50fde4215c8:/# dig tg-net

; <<>> DiG 9.9.5-3ubuntu0.19-Ubuntu <<>> tg-net
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 56972
;; flags: qr rd ra; QUERY: 1, ANSWER: 3, AUTHORITY: 0, ADDITIONAL: 0

;; QUESTION SECTION:
;tg-net.                                IN      A

;; ANSWER SECTION:
tg-net.                 600     IN      A       172.200.1.3
tg-net.                 600     IN      A       172.200.1.4
tg-net.                 600     IN      A       172.200.1.2

;; Query time: 0 msec
;; SERVER: 127.0.0.11#53(127.0.0.11)
;; WHEN: Sun Jun 11 02:41:27 UTC 2023
;; MSG SIZE  rcvd: 90
```

#### 새 컨테이너 추가 시 자동 DNS 등록

```bash
# 다른 터미널에서 새로운 컨테이너를 target group에 포함시킨다.
~$ docker run –itd --name=nettest4 --net=netlb --net-alias=tg-net ubuntu:14.04

# 자동으로 DNS에 등록 된다.
root@c50fde4215c8:/# dig tg-net
...
;; ANSWER SECTION:
tg-net.                 600     IN      A       172.200.1.3
tg-net.                 600     IN      A       172.200.1.6
tg-net.                 600     IN      A       172.200.1.2
tg-net.                 600     IN      A       172.200.1.4
```

---

## 4. 컨테이너 Proxy

### Proxy 개요

Nginx 및 HAproxy 구성을 통해 Load Balancer (proxy) 컨테이너를 만들어 보자

#### No config proxy (no Load Balancer)?

- Proxy 구성이 없으면 사용자의 요청은 직접 웹서버에 전달되어 서버 부담을 가중하게 된다.
- 단일 웹서버 구성은 장애 발생 시 서비스 가용성에 치명적이다.
- 다중 웹서버 구성으로 여러 사용자의 요청을 처리할 경우에도 요청한 부하를 적절히 분산시켜 주지 못하면 한 서버에 부하가 몰리는 Hotspot이 발생하는 등의 문제가 발생 가능하다.
- 최종 사용자 관점의 응답 시간 만족을 얻기 힘들다.

```
┌────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ client │ ←→  │ Internet │ ←→  │Webserver │ ←→  │DB server │
└────────┘     └──────────┘     └──────────┘     └──────────┘
```

#### Proxy ?

- 요청자와 응답자 간의 중계 역할. 즉, 통신을 대리 수행하는 서버를 proxy server 라 함.
- Proxy server의 위치에 따라 forward proxy 와 reverse proxy로 구분한다.
- 이를 활용하면…
  - 다중 호스트(Cluster)를 활용하여 트래픽 분산을 할 수 있는 Load Balancing 구현(R).
  - 클라이언트 요청 중 자주 사용되는 HTML, JS, CSS 등의 정적 파일을 caching하여 서버 부하 및 네트워크 트래픽을 줄여 빠른 응답을 할 수 있는 캐시 서버 구현.(F,R)
  - 학교 및 사내망에서 보안을 위한 특정 사이트 접근 차단 구현(F)
  - 무중단 배포를 통한 서비스 지속(R)
  - SSL 암호화 적용으로 보안 강화 (R)

#### Forward Proxy ?

forward proxy는 client와 internet 사이에 있어서 client 정보가 서버에 노출되지 않음.

```
                      [Forward Proxy]
                                           ┌──────────┐
┌────────┐                                 │Web server│
│ client │ ←→  ┌─────────┐     ┌──────────┐└──────────┘
└────────┘     │  Proxy  │ ←→  │ Internet │┌──────────┐
┌────────┐     └─────────┘     └──────────┘│Web server│
│ client │ ←→                              └──────────┘
└────────┘                                 ┌──────────┐
┌────────┐                                 │Web server│
│ client │ ←→                              └──────────┘
└────────┘
```

#### Reverse Proxy ?

Reverse Proxy는 client 요청을 서버 대신 받아서 전달. client에게 서버 노출 안됨.

```
                      [Reverse Proxy]
                                           ┌──────────┐
┌────────┐                                 │Web server│
│ client │ ←→                              └──────────┘
└────────┘     ┌──────────┐     ┌─────────┐┌──────────┐
┌────────┐ ←→  │ Internet │ ←→  │  Proxy  ││Web server│
│ client │     └──────────┘     └─────────┘└──────────┘
└────────┘                                 ┌──────────┐
┌────────┐                                 │Web server│
│ client │ ←→                              └──────────┘
└────────┘
```

### Nginx

- 기본 구성 값으로 "웹 서버"를 실행한다. 동일 계열 점유율이 제일 높다.
- 추가 구성으로 "Reverse Proxy" 구현이 가능하다.
- Kubernetes의 ingress controller로 "nginx ingress controller" 선택이 가능하다.
- API 트래픽 처리를 고급 HTTP 처리 기능으로 사용 가능한 "API Gateway" 구성이 가능하다.
- MSA 트래픽 처리를 위한 MicroGateway로 사용 가능
- 설정은 (linux 기준) /etc/nginx 하위에 nginx.conf 변경을 통해 구성할 수 있다.

#### Nginx reverse proxy

- 클라이언트 요청이 80 포트로 들어오면 준비해둔 애플리케이션 서버의 주소로 각 서버로 트래픽을 분배한다.
- 기본 분배 방식(LoadBalancing)은 round-robin 방식으로 처리.
- 요청이 적은 서버로 분배하는 least_conn 방식.
- IP당 서버를 분배하는 ip_hash 등 여러가지 부하 분산 알고리즘을 사용할 수 있다.
- (https://docs.nginx.com/nginx/admin-guide/load-balancer/http-load-balancer/)

### HAProxy

- 하드웨어 기반의 L4 / L7 스위치를 대체하기 위한 오픈소스 소프트웨어 솔루션
- TCP 및 HTTP 기반 애플리케이션을 위한 고가용성(Active-Passive), Load Balancing 및 프록시 기능을 제공하는 매우 빠르고 안정적인 무료 Reverse Proxy다.
- 주요 기능
  - 1) SSL 지원
  - 2) Load Balancing
  - 3) Active health check
  - 4) KeepAlived (proxy 이중화)

#### HAproxy, L4

- OSI 7 계층 중 Layer 4는 IP를 이용한 트래픽 전달이 특징이다.
- Haproxy L4 구성 시 IP와 Port를 기반으로 사용자 요청 트래픽을 전달하도록 구성
- 요청에 대한 처리는 웹서버로 구성된 web1~3에 round-robin 방식으로 부하 분산 된다.

```
┌────────┐     ┌─────────┐     ┌─────────────────┐     ┌──────────┐
│ client │ ←→  │L4 Proxy │ ←→  │ web1            │ ←→  │DB server │
└────────┘     └─────────┘     │ web2            │     └──────────┘
                               │ web3            │
                               │   Webserver     │
                               └─────────────────┘
```

#### HAproxy, L7

- OSI 7 계층 중 Layer 7은 HTTP 기반의 URI를 이용한 트래픽 전달이 특징이다.
- 동일한 도메인(example.com)의 하위에 존재하는 여러 웹 애플리케이션 서버를 사용할 수 있다.
- example.com/item or example.com/basket 으로 연결 된다.
- 사용자의 요청과 설정에 따른 부하 분산이다.

```
                               ┌─────────────────┐
                               │ web1            │
                               │ web2            │
┌────────┐     ┌─────────┐     │     /Item       │     ┌──────────┐
│ client │ ←→  │L7 Proxy │ ←→  ├─────────────────┤ ←→  │DB server │
└────────┘     └─────────┘     │ web1            │     └──────────┘
                               │ web2            │
                               │    /basket      │
                               └─────────────────┘
```

---

## 5. [실습] Nginx를 활용한 컨테이너 proxy

### Host Nginx reverse proxy 구성

```
                    ┌─────────────────────────────────────────────┐
                    │              Docker HostOS                  │
                    │                                             │
                    │                           ┌─────────────┐   │
                    │                           │  Container  │   │
┌────────┐          │     ┌─────────┐           ├─────────────┤   │
│ client │ ←─────→  │     │  Nginx  │ ←───────→ │  Container  │   │
└────────┘          │     │  proxy  │           ├─────────────┤   │
                    │     └─────────┘           │  Container  │   │
                    │                           └─────────────┘   │
                    │  Docker HostOS에 nginx                      │
                    │  설치 후 Nginx reverse proxy                │
                    │  (nginx.conf) 구성으로 변경.                │
                    └─────────────────────────────────────────────┘
```

#### nginx 설치

```bash
# Docker HostOS에 apt를 이용하여 nginx를 설치한다.
~$ sudo apt update
~$ sudo apt -y install nginx
~$ sudo nginx -v
nginx version: nginx/1.18.0 (Ubuntu)

~$ sudo systemctl status nginx.service
● nginx.service - A high performance web server and a reverse proxy server
     Loaded: loaded (/lib/systemd/system/nginx.service; enabled; vendor preset: enabled)
     Active: active (running)
…

~$ sudo netstat -nlp | grep 80
tcp        0      0 0.0.0.0:80              0.0.0.0:*               LISTEN      88008/nginx: master
tcp6       0      0 :::80                   :::*                    LISTEN      88008/nginx: master

~$ curl localhost:80
<!DOCTYPE html>
<html>
<head>
<title>Welcome to nginx!</title>
…
```

#### 애플리케이션 컨테이너 생성

```bash
# load balancing이 구현될 애플리케이션 컨테이너를 생성한다.
~$ docker run -it -d -e SERVER_PORT=5001 -p 5001:5001 -h alb-node01 -u root --name=alb-node01 dbgurum/nginxlb:1.0
~$ docker ps -a | grep node
ba61b1f47ed4   dbgurum/nginxlb:1.0   "/cnb/lifecycle/laun…"   4 seconds ago   Exited (1) 2 seconds ago             alb-node01

~$ docker logs alb-node01
cat: /sys/fs/cgroup/memory/memory.limit_in_bytes: No such file or directory

~$ docker rm alb-node01
~$ docker info
...
 Cgroup Driver: systemd
 Cgroup Version: 2

~$ sudo sed -i '/^GRUB_CMDLINE_LINUX/ s/"$/ systemd.unified_cgroup_hierarchy=0"/' /etc/default/grub
~$ sudo update-grub
~$ sudo reboot

~$ docker info
...
 Cgroup Driver: cgroupfs
 Cgroup Version: 1
```

```bash
~$ docker run -it -d -e SERVER_PORT=5001 -p 5001:5001 -h alb-node01 -u root --name=albnode01 dbgurum/nginxlb:1.0

~$ docker run -it -d -e SERVER_PORT=5002 -p 5002:5002 -h alb-node02 -u root --name=albnode02 dbgurum/nginxlb:1.0

~$ docker run -it -d -e SERVER_PORT=5003 -p 5003:5003 -h alb-node03 -u root --name=albnode03 dbgurum/nginxlb:1.0

~$ docker ps -a | grep node
84be5755c789   dbgurum/nginxlb:1.0   "/cnb/lifecycle/laun…"   5 seconds ago    Up 4 seconds    0.0.0.0:5003->5003/tcp, :::5003->5003/tcp   alb-node03
0eff7905f458   dbgurum/nginxlb:1.0   "/cnb/lifecycle/laun…"   8 seconds ago    Up 8 seconds    0.0.0.0:5002->5002/tcp, :::5002->5002/tcp   alb-node02
f6c4c0941d8b   dbgurum/nginxlb:1.0   "/cnb/lifecycle/laun…"   12 seconds ago   Up 11 seconds   0.0.0.0:5001->5001/tcp, :::5001->5001/tcp   alb-node01

~$ sudo netstat -nlp | grep 5001
~$ sudo netstat -nlp | grep 5002
~$ sudo netstat -nlp | grep 5003
```

#### nginx.conf 설정

```bash
~$ sudo mv /etc/nginx/nginx.conf /etc/nginx/nginx.conf.org
~$ sudo vi /etc/nginx/nginx.conf
events { worker_connections 1024; }
http {
    # List of application servers
    upstream backend-alb {
        server 127.0.0.1:5001;
        server 127.0.0.1:5002;
        server 127.0.0.1:5003;
    }
    # Configuration for the server
    server {
        # Running port
        listen 80  default_server;
        # Proxying the connections
        location / {
            proxy_pass         http://backend-alb;
        }
    }
}

~$ sudo systemctl restart nginx.service
~$ sudo systemctl status nginx.service
```

> **참고**: proxy_pass를 이용하여 nginx를 proxy 서버로 삼고 upstream 리스트에 있는 서버로 통과시키도록 설정 한다.

테스트 결과 (브라우저에서 192.168.56.101 새로고침):
- Listening: 5001, Hosting: alb-node01
- Listening: 5002, Hosting: alb-node02
- Listening: 5003, Hosting: alb-node03

```bash
# 다음 실습을 위해 Docker hostOS에 설치된 nginx 삭제
~$ sudo systemctl stop nginx.service
~$ sudo apt autoremove nginx –y
~$ sudo netstat -nlp | grep 80
```

### Nginx container reverse proxy 구성

```
                    ┌─────────────────────────────────────────────┐
                    │              Docker HostOS                  │
                    │                                             │
                    │                           ┌─────────────┐   │
                    │        weight             │  Container  │   │
                    │           │     60%       ├─────────────┤   │
┌────────┐          │     ┌─────┴───┐ 20%       │  Container  │   │
│ client │ ←─────→  │     │  Nginx  │ 20%       ├─────────────┤   │
└────────┘          │     │container│ ←───────→ │  Container  │   │
                    │     │  proxy  │           └─────────────┘   │
                    │     └─────────┘                             │
                    │  nginx 컨테이너 실행 후                     │
                    │  Nginx reverse proxy                        │
                    │  (nginx.conf) 구성으로 변경.                │
                    └─────────────────────────────────────────────┘
```

```bash
kevin@hostos1:~$ docker run -d -p 8001:80 --name=proxy-container nginx:1.25.0-alpine

kevin@hostos1:~$ vi nginx.conf
events { worker_connections 1024; }
http {
    upstream backend-alb {
        server 192.168.56.101:5001;
        server 192.168.56.101:5002;
        server 192.168.56.101:5003;
    }
    server {
        listen 80  default_server;
        location / {
            proxy_pass         http://backend-alb;
        }
    }
}

kevin@hostos1:~$ docker cp nginx.conf proxy-container:/etc/nginx/nginx.conf
```

```bash
kevin@hostos1:~$ sudo netstat -nlp | grep 8001
tcp        0      0 0.0.0.0:8001            0.0.0.0:*               LISTEN      3906/docker-proxy
tcp6       0      0 :::8001                 :::*                    LISTEN      3912/docker-proxy

kevin@hostos1:~$ docker restart proxy-container
proxy-container

kevin@hostos1:~$ docker ps | grep proxy
4dbf9d382383   nginx:1.25.0-alpine   "/docker-entrypoint.…"   47 seconds ago   Up 8 seconds
0.0.0.0:8001->80/tcp, :::8001->80/tcp   proxy-container

kevin@hostos1:~$ curl localhost:8001
Listening: 5001, Hosting: alb-node01
kevin@hostos1:~$ curl localhost:8001
Listening: 5002, Hosting: alb-node02
kevin@hostos1:~$ curl localhost:8001
Listening: 5003, Hosting: alb-node03
```

#### 가중치 적용

```bash
# 가중치 적용
kevin@hostos1:~$ vi nginx.conf
events { worker_connections 1024; }
http {
    upstream backend-alb {
        server 192.168.56.101:5001 weight=60;
        server 192.168.56.101:5002 weight=20;
        server 192.168.56.101:5003 weight=20;
    }
    server {
        listen 80  default_server;
        location / {
            proxy_pass         http://backend-alb;
        }
    }
}

kevin@hostos1:~$ docker cp nginx.conf proxy-container:/etc/nginx/nginx.conf
kevin@hostos1:~$ docker restart proxy-container
kevin@hostos1:~$ docker ps | grep proxy
4dbf9d382383   nginx:1.25.0-alpine   "/docker-entrypoint.…"   10 minutes ago   Up 3 seconds
0.0.0.0:8001->80/tcp, :::8001->80/tcp   proxy-container
```

---

## 6. [실습] HAProxy를 활용한 컨테이너 proxy

### HAproxy container 구성

```bash
kevin@hostos1:~/fastcampus/ch06$ docker network create proxy-net
kevin@hostos1:~/fastcampus/ch06$ docker network ls
42660fd744bd        proxy-net           bridge              local

kevin@hostos1:~/fastcampus/ch06$ route
Kernel IP routing table
Destination     Gateway         Genmask         Flags Metric Ref    Use Iface
172.21.0.0      0.0.0.0         255.255.0.0     U     0      0        0 br-42660fd744bd

kevin@hostos1:~/fastcampus/ch06$ docker run -d --name=echo-web1 --net=proxy-net -h echo-web1 dbgurum/haproxy:echo
kevin@hostos1:~/fastcampus/ch06$ docker run -d --name=echo-web2 --net=proxy-net -h echo-web2 dbgurum/haproxy:echo
kevin@hostos1:~/fastcampus/ch06$ docker run -d --name=echo-web3 --net=proxy-net -h echo-web3 dbgurum/haproxy:echo
```

```bash
kevin@hostos1:~/fastcampus/ch06$ docker ps -a
CONTAINER ID   IMAGE                 COMMAND             CREATED          STATUS          PORTS      NAMES
d15065779dc4   dbgurum/haproxy:echo  "/bin/echo-server"  37 seconds ago   Up 36 seconds   8080/tcp   echo-web3
603118f401b3   dbgurum/haproxy:echo  "/bin/echo-server"  41 seconds ago   Up 41 seconds   8080/tcp   echo-web2
0cc87c72bff1   dbgurum/haproxy:echo  "/bin/echo-server"  52 seconds ago   Up 51 seconds   8080/tcp   echo-web1

kevin@hostos1:~/fastcampus/ch06$ mkdir conf && cd $_
kevin@hostos1:~/fastcampus/ch06/conf$ vi haproxy.cfg
```

#### haproxy.cfg 설정 (기본)

```
global
    stats socket /var/run/api.sock user haproxy group haproxy mode 660 level admin expose-fd listeners
    log stdout format raw local0 info

defaults
    mode http
    timeout client 10s
    timeout connect 5s
    timeout server 10s
    timeout http-request 10s
    log global

frontend stats
    bind *:8404
    stats enable
    stats uri /
    stats refresh 10s

frontend myfrontend
    bind :80
    default_backend webservers

backend webservers
    server s1 echo-web1:8080 check
    server s2 echo-web2:8080 check
    server s3 echo-web3:8080 check
```

#### HAProxy 컨테이너 실행

```bash
kevin@hostos1:~/fastcampus/ch06/conf$ docker run -d --name=haproxy-container --net=proxy-net -p 80:80 -p 8404:8404 -v $(pwd):/usr/local/etc/haproxy:ro haproxytech/haproxy-alpine:2.5

kevin@hostos1:~/fastcampus/ch06/conf$ docker ps
CONTAINER ID   IMAGE                              COMMAND                  CREATED          STATUS          PORTS                                                                    NAMES
3ce170249413   haproxytech/haproxy-alpine:2.4     "/docker-entrypoint.…"   21 seconds ago   Up 19 seconds   0.0.0.0:80->80/tcp, :::80->80/tcp, 0.0.0.0:8404->8404/tcp, :::8404->8404/tcp   haproxy-container

kevin@hostos1:~/fastcampus/ch06/conf$ docker port haproxy-container
80/tcp -> 0.0.0.0:80
80/tcp -> [::]:80
8404/tcp -> 0.0.0.0:8404
8404/tcp -> [::]:8404
```

#### Round Robin 테스트

```bash
kevin@hostos1:~/fastcampus/ch06/conf$ curl localhost:80
Request served by echo-web1

GET / HTTP/1.1

Host: localhost
Accept: */*
User-Agent: curl/7.81.0

kevin@hostos1:~/fastcampus/ch06/conf$ curl localhost:80
Request served by echo-web2

GET / HTTP/1.1

Host: localhost
Accept: */*
User-Agent: curl/7.81.0

kevin@hostos1:~/fastcampus/ch06/conf$ curl localhost:80
Request served by echo-web3

GET / HTTP/1.1

Host: localhost
Accept: */*
User-Agent: curl/7.81.0
```

> **HAProxy Statistics**: 192.168.56.101:8404 접근을 통해 Haproxy 통계 정보 확인 가능

### HAproxy container 구성 (L7 URI 방식)-1

#### haproxy.cfg 설정 (URI 방식 1)

```
global
    stats socket /var/run/api.sock user haproxy group haproxy mode 660 level admin expose-fd listeners
    log stdout format raw local0 info

defaults
    mode http
    timeout client 10s
    timeout connect 5s
    timeout server 10s
    timeout http-request 10s
    log global

frontend stats
    bind *:8404
    stats enable
    stats uri /
    stats refresh 10s

frontend myfrontend
    bind :80
    default_backend webservers

    acl echo-web1 path_beg /echo-web1
    acl echo-web2 path_beg /echo-web2
    acl echo-web3 path_beg /echo-web3

    use_backend echo-web1_backend if echo-web1
    use_backend echo-web2_backend if echo-web2
    use_backend echo-web3_backend if echo-web3

backend webservers
    balance roundrobin
    server s1 echo-web1:8080 check
    server s2 echo-web2:8080 check
    server s3 echo-web3:8080 check

backend echo-web1_backend
    server s1 echo-web1:8080 check

backend echo-web2_backend
    server s2 echo-web2:8080 check

backend echo-web3_backend
    server s3 echo-web3:8080 check
```

```bash
kevin@hostos1:~/fastcampus/ch06/conf$ docker stop haproxy-container
kevin@hostos1:~/fastcampus/ch06/conf$ docker rm haproxy-container

kevin@hostos1:~/fastcampus/ch06/conf$ docker run -d --name=haproxy-container --net=proxy-net -p 80:80 -p 8404:8404 -v $(pwd):/usr/local/etc/haproxy:ro haproxytech/haproxy-alpine:2.5

kevin@hostos1:~/fastcampus/ch06/conf$ docker ps
CONTAINER ID   IMAGE                              COMMAND                  CREATED          STATUS          PORTS                                                                    NAMES
3ce170249413   haproxytech/haproxy-alpine:2.4     "/docker-entrypoint.…"   21 seconds ago   Up 19 seconds   0.0.0.0:80->80/tcp, :::80->80/tcp, 0.0.0.0:8404->8404/tcp, :::8404->8404/tcp   haproxy-container

kevin@hostos1:~/fastcampus/ch06/conf$ docker port haproxy-container
80/tcp -> 0.0.0.0:80
80/tcp -> [::]:80
8404/tcp -> 0.0.0.0:8404
8404/tcp -> [::]:8404
```

#### 일반 요청 테스트 (Round Robin)

```bash
kevin@hostos1:~/fastcampus/ch06/conf$ curl localhost:80
Request served by echo-web1

GET / HTTP/1.1

Host: localhost
Accept: */*
User-Agent: curl/7.81.0

kevin@hostos1:~/fastcampus/ch06/conf$ curl localhost:80
Request served by echo-web2

GET / HTTP/1.1

Host: localhost
Accept: */*
User-Agent: curl/7.81.0

kevin@hostos1:~/fastcampus/ch06/conf$ curl localhost:80
Request served by echo-web3

GET / HTTP/1.1

Host: localhost
Accept: */*
User-Agent: curl/7.81.0
```

#### URI 기반 요청 테스트

```bash
kevin@hostos1:~/fastcampus/ch06/conf$ curl localhost:80/echo-web1
Request served by echo-web1

GET / HTTP/1.1

Host: localhost
Accept: */*
User-Agent: curl/7.81.0

kevin@hostos1:~/fastcampus/ch06/conf$ curl localhost:80/echo-web2
Request served by echo-web2

GET / HTTP/1.1

Host: localhost
Accept: */*
User-Agent: curl/7.81.0

kevin@hostos1:~/fastcampus/ch06/conf$ curl localhost:80/echo-web3
Request served by echo-web3

GET / HTTP/1.1

Host: localhost
Accept: */*
User-Agent: curl/7.81.0
```

### HAproxy container 구성 (L7 URI 방식)-2

- haproxy.cfg 설정 중 http mode의 uri 방식을 통해…
- Domain or IP/item
- Domain or IP/basket 으로 연결

```
                               ┌─────────────────┐
                               │ web1            │
                               │ web2            │
┌────────┐     ┌─────────┐     │     /Item       │     ┌──────────┐
│ client │ ←→  │L7 Proxy │ ←→  ├─────────────────┤ ←→  │DB server │
└────────┘     └─────────┘     │ web3            │     └──────────┘
                               │ web4            │
                               │    /basket      │
                               └─────────────────┘
```

#### haproxy.cfg 설정 (URI 방식 2)

```
global
    stats socket /var/run/api.sock user haproxy group haproxy mode 660 level admin expose-fd listeners
    log stdout format raw local0 info

defaults
    mode http
    timeout client 10s
    timeout connect 5s
    timeout server 10s
    timeout http-request 10s
    log global

frontend stats
    bind *:8404
    stats enable
    stats uri /
    stats refresh 10s

frontend myfrontend
    bind :80
    default_backend webservers

    acl echo-web1-item path_beg /item
    acl echo-web2-item path_beg /item
    acl echo-web3-basket path_beg /basket
    acl echo-web4-basket path_beg /basket

    use_backend echo-web1_backend if echo-web1-item
    use_backend echo-web1_backend if echo-web2-item
    use_backend echo-web2_backend if echo-web3-basket
    use_backend echo-web2_backend if echo-web4-basket

backend webservers
    balance roundrobin
    server s1 echo-web1-item:8080 check
    server s2 echo-web2-item:8080 check
    server s3 echo-web3-basket:8080 check
    server s4 echo-web4-basket:8080 check

backend echo-web1_backend
    server s1 echo-web1-item:8080 check
    server s2 echo-web2-item:8080 check

backend echo-web2_backend
    server s3 echo-web3-basket:8080 check
    server s4 echo-web4-basket:8080 check
```

#### 컨테이너 재구성

```bash
kevin@hostos1:~/fastcampus/ch06/conf$ docker stop haproxy-container
kevin@hostos1:~/fastcampus/ch06/conf$ docker stop echo-web1 echo-web2
kevin@hostos1:~/fastcampus/ch06/conf$ docker stop echo-web3 echo-web4
kevin@hostos1:~/fastcampus/ch06/conf$ cexrm

kevin@hostos1:~/fastcampus/ch06/conf$ docker run -d --name=echo-web1-item --net=proxy-net -h echo-web1-item dbgurum/haproxy:echo
kevin@hostos1:~/fastcampus/ch06/conf$ docker run -d --name=echo-web2-item --net=proxy-net -h echo-web2-item dbgurum/haproxy:echo
kevin@hostos1:~/fastcampus/ch06/conf$ docker run -d --name=echo-web3-basket --net=proxy-net -h echo-web3-basket dbgurum/haproxy:echo
kevin@hostos1:~/fastcampus/ch06/conf$ docker run -d --name=echo-web4-basket --net=proxy-net -h echo-web4-basket dbgurum/haproxy:echo

kevin@hostos1:~/fastcampus/ch06/conf$ docker run -d --name=haproxy-container --net=proxy-net -p 80:80 -p 8404:8404 -v $(pwd):/usr/local/etc/haproxy:ro haproxytech/haproxy-alpine:2.5
```

#### /item URI 테스트

```bash
kevin@hostos1:~/fastcampus/ch06/conf$ curl localhost:80/item
Request served by echo-web1-item

GET /item HTTP/1.1

Host: localhost
Accept: */*
User-Agent: curl/7.81.0

kevin@hostos1:~/fastcampus/ch06/conf$ curl localhost:80/item
Request served by echo-web2-item

GET /item HTTP/1.1

Host: localhost
Accept: */*
User-Agent: curl/7.81.0
```

#### /basket URI 테스트

```bash
kevin@hostos1:~/fastcampus/ch06/conf$ curl localhost:80/basket
Request served by echo-web3-basket

GET /basket HTTP/1.1

Host: localhost
Accept: */*
User-Agent: curl/7.81.0

kevin@hostos1:~/fastcampus/ch06/conf$ curl localhost:80/basket
Request served by echo-web4-basket

GET /basket HTTP/1.1

Host: localhost
Accept: */*
User-Agent: curl/7.81.0
```

---

## 요약

### 핵심 개념

1. **Docker Network 기본**
   - Docker network = Linux network (커널의 네트워크 스택 활용)
   - CNM(Container Networking Model) 아키텍처 기반
   - 주요 구성요소: Sandbox, Endpoint, Network

2. **네트워크 드라이버 종류**
   - bridge: 기본 네트워크, docker0 (172.17.0.0/16)
   - host: 호스트 OS 네트워크 직접 사용
   - none: 네트워크 격리
   - overlay: 멀티 호스트 네트워크 (Docker Swarm)
   - macvlan: 물리 네트워크 직접 연결

3. **사용자 정의 네트워크**
   - `docker network create`로 생성
   - 컨테이너 이름으로 통신 가능 (DNS 자동 지원)
   - IP 대역, 게이트웨이 지정 가능

4. **Docker DNS**
   - 사용자 정의 네트워크에서 자동 활성화 (127.0.0.11)
   - --net-alias를 통한 서비스 그룹화
   - Round Robin 방식 로드 밸런싱

5. **컨테이너 Proxy**
   - Forward Proxy: 클라이언트 보호
   - Reverse Proxy: 서버 보호, 로드 밸런싱
   - Nginx: 웹 서버 + Reverse Proxy
   - HAProxy: L4/L7 로드 밸런서

### 주요 명령어

```bash
# 네트워크 조회
docker network ls
docker network inspect <network>

# 네트워크 생성
docker network create --driver bridge --subnet 172.30.1.0/24 mynet

# 네트워크 연결/해제
docker network connect <network> <container>
docker network disconnect <network> <container>

# 브리지 정보 확인
brctl show

# NAT 규칙 확인
sudo iptables -t nat -L -n
```
