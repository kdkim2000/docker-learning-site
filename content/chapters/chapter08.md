# Chapter 08. Docker Volume

## 목차

- [Clip 1. Docker 제공, volume 기술 이해](#1-docker-제공-volume-기술-이해)
- [Clip 2. [실습] Bind mount 방식](#2-실습-bind-mount-방식)
- [Clip 3. [실습] docker volume 방식](#3-실습-docker-volume-방식)
- [Clip 4. [실습] 데이터 지속성을 위한 volume 구성](#4-실습-데이터-지속성을-위한-volume-구성)
- [Clip 5. [실습] volume 사용량 제한 구성](#5-실습-volume-사용량-제한-구성)

---

## 1. Docker 제공, volume 기술 이해

> 컨테이너와 호스트 간의 데이터 공유가 가능한 volume 기술 이해

### 1.1 volume 기술 이해

- Docker에서 제공하는 volume 기술은 컨테이너 애플리케이션에서 생성되고 사용되는 데이터를 유지, 보존하기 위한 메커니즘을 제공한다. 컨테이너가 삭제되어도 volume은 독립적으로 운영되기 때문에 데이터를 유지한다.

- volume 기술은 Docker HostOS와 컨테이너에서 직접 접근이 가능하다.

- 일반적으로 컨테이너 내부의 데이터는 컨테이너의 생명 주기와 연관되어 컨테이너 종료 시 삭제되지만, 이를 지속적(Persistent)으로 보존하기 위한 방법으로 volume 기술이 사용한다.

### 1.2 volume 방식

Docker는 3가지 volume 기술을 제공한다.

```
                    Host
            ┌─────────────────────────────┐
            │        ┌─────────────┐      │
            │        │  Container  │      │
            │        └─────────────┘      │
            │     ↗         ↑         ↖   │
            │  bind       volume     tmpfs│
            │  mount                 mount│
            │    ↓          ↓         ↓   │
            │ ┌──────────┐        ┌──────┐│
            │ │Filesystem│        │Memory││
            │ │┌────────┐│        └──────┘│
            │ ││Docker  ││                │
            │ ││ area   ││                │
            │ │└────────┘│                │
            │ └──────────┘                │
            └─────────────────────────────┘
```

[Docker docs 참조: https://docs.docker.com/storage/volumes/]

### 1.3 volume 방식 → 1) Bind mount

- Bind mount 기법은 디렉터리 뿐만 아니라 파일도 mount 가능하다.
- "호스트 파일 시스템 절대경로" : "컨테이너 내부 경로"를 직접 mount하여 사용한다.
- 사전에 연결할 파일 또는 디렉터리를 사용자가 생성하면 해당 호스트 파일시스템의 소유자 권한으로 연결이 되고, 존재하지 않는 경우 자동 생성되지만 이 디렉터리는 루트(root) 사용자 소유가 된다.
- 사전 정의 없이 컨테이너 실행 시 자동 생성되고, 컨테이너 제거 시 Bind mount가 자동 해제되지만 생성된 호스트 디렉터리와 데이터(file)는 보존된다.
- Bind mount 방법은 데이터를 Host의 지정된 디렉터리에서 관리한다.

**Bind mount 사용 예시:**

```bash
~$ docker run .. -v /my-host:/app ..
~$ docker run .. --mount type=bind,source=${PWD}/mydata,target=/var/log ..
```

```
┌─────────────────────────────────────────────────────────────┐
│                     Docker HostOS                           │
│                                                             │
│  ┌─────────────────┐                    ┌─────────────────┐ │
│  │   Host area     │                    │    Container    │ │
│  │ ┌─────────────┐ │     BIND MOUNT     │                 │ │
│  │ │  /my-host   │ │ ←───────────────→  │     /app        │ │
│  │ └─────────────┘ │                    │                 │ │
│  │ ┌─────────────┐ │     BIND MOUNT     │                 │ │
│  │ │${PWD}/mydata│ │ ←───────────────→  │   /var/log      │ │
│  │ └─────────────┘ │                    │                 │ │
│  └─────────────────┘                    └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**컨테이너 삭제 시에도 호스트 데이터는 보존:**

컨테이너를 `docker stop` 및 `docker rm`으로 삭제해도 호스트 영역의 데이터는 그대로 보존된다.

### 1.4 volume 방식 → 2) docker volume

- Docker에서 권장하는 방법으로 "docker volume create 볼륨명"으로 볼륨을 생성한다.
- Docker 볼륨은 Docker 명령어(CLI)와 Docker API 통해 사용할 수 있다.
- docker volume 명령은 Docker root dir(/var/lib/docker) 영역에 volume 영역을 만들어 컨테이너 내부 경로와 연결(mount), 공유한다.
- 볼륨 드라이버(vieux/sshfs plugin)를 통해 원격 호스트 및 클라우드 환경에 볼륨 내용을 저장하고 암호화가 가능하다.
- 새 볼륨으로 지정될 영역(directory)에 데이터를 미리 채우고 컨테이너에 연결하면 컨테이너 내에서 바로 데이터 사용이 가능하다.
- docker volume은 볼륨 데이터를 Docker(/var/lib/docker)가 관리한다.

**docker volume 사용 예시:**

```bash
~$ docker volume create my-volume
~$ docker run .. -v my-volume:/app ..
~$ docker run .. --mount source=my-volume,target=/app ..
```

```
┌─────────────────────────────────────────────────────────────────┐
│                        Docker Engine                            │
│                                                                 │
│  ┌─────────────────────────────────────────┐   ┌─────────────┐  │
│  │/var/lib/docker/volumes/my-volume/_data/ │   │  Container  │  │
│  │                                         │   │             │  │
│  │            ┌───────────┐                │   │    /app     │  │
│  │            │  MY-DATA  │ ←──────────────────→             │  │
│  │            └───────────┘                │   │             │  │
│  └─────────────────────────────────────────┘   └─────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.5 volume 방식 → 3) tmpfs mount

- 앞서 살펴본 두가지 방식과 다르게 tmpfs mount 방식은 Docker hostOS의 Memory에서만 지속되고, 해당 컨테이너가 중지되면 tmpfs mount 연결 해제와 함께 기록된 데이터도 사라진다.
- 이 방식은 컨테이너 간의 공유 설정은 안되고, Linux 기반 Docker에서만 지원된다.
- 임시로 사용하고, 기록되지 않아야 되는 파일, 데이터 등을 사용할 경우에 유용하다. (host 영역 및 컨테이너의 write 영역에 파일이 기록되지 않음)

**tmpfs mount 사용 예시:**

```bash
~$ docker run .. –tmpfs /var/www/html ..
~$ docker run .. --mount type=tmpfs,destination=/var/www/html ..
```

```
┌─────────────────────────────────────────────────────────────────┐
│                        Docker HostOS                            │
│                                                                 │
│  ┌─────────────────┐                      ┌──────────────────┐  │
│  │   Container     │     tmpfs MOUNT      │      Memory      │  │
│  │                 │ ←─────────────────→  │                  │  │
│  │  /var/www/html  │                      │                  │  │
│  └─────────────────┘                      └──────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

호스트 파일 시스템에 별도의 경로를 생성하지 않고, 컨테이너와 메모리에만 임시로 생성, 지속성을 갖지 않는다.

---

## 2. [실습] Bind mount 방식

> volume 구성 방법 중 Bind mount 방식에 대해 알아보기

### 2.1 [실습1] Bind mount 연결 이해

**디렉터리 생성 및 테스트 파일 준비:**

```bash
kevin@hostos1:~/fastcampus/ch08$ pwd
/home/kevin/fastcampus/ch08

kevin@hostos1:~/fastcampus/ch08$ mkdir bind01 bind02
kevin@hostos1:~/fastcampus/ch08$ echo 'fastcampus docker-1' > bind01/docker-1.txt
kevin@hostos1:~/fastcampus/ch08$ echo 'fastcampus docker-2' > bind02/docker-2.txt
```

**Bind mount로 컨테이너 실행:**

```bash
kevin@hostos1:~/fastcampus/ch08$ docker run -it --name=bind-mount \
> -v /home/kevin/fastcampus/ch08/bind01:/bind01 \
> -v ${PWD}/bind02:/bind02 \
> ubuntu:14.04 bash
```

**컨테이너 내부에서 마운트 확인:**

```bash
root@7a91ba8609fa:/# df -ha
Filesystem      Size  Used Avail Use% Mounted on
overlay         100G  9.6G   91G  10% /
...
/dev/sda1        56G   13G   44G  23% /bind01
/dev/sda1        56G   13G   44G  23% /bind02

root@7a91ba8609fa:/# mount | grep bind
/dev/sda1 on /bind01 type xfs (rw,relatime,attr2,inode64,logbufs=8,logbsize=32k,noquota)
/dev/sda1 on /bind02 type xfs (rw,relatime,attr2,inode64,logbufs=8,logbsize=32k,noquota)
```

**컨테이너에서 파일 확인 및 수정:**

```bash
root@7a91ba8609fa:/# ls bind01
docker-1.txt
root@7a91ba8609fa:/# ls bind02
docker-2.txt

# Bind mount로 연결된 양쪽 경로의 기본 권한은 read/write(rw)다.
root@7a91ba8609fa:/# echo 'welcome to container' >> bind01/docker-1.txt
root@7a91ba8609fa:/# cat bind01/docker-1.txt
fastcampus docker-1
welcome to container
```

**호스트에서 변경 내용 확인:**

```bash
(ctrl+p+q)

kevin@hostos1:~/fastcampus/ch08$ cat bind01/docker-1.txt
fastcampus docker-1
welcome to container

kevin@hostos1:~/fastcampus/ch08$ docker inspect --format="{{ .HostConfig.Binds }}" bind-mount
[/home/kevin/fastcampus/ch08/bind01:/bind01
/home/kevin/fastcampus/ch08/bind02:/bind02]

kevin@hostos1:~/fastcampus/ch08$ docker stop bind-mount
kevin@hostos1:~/fastcampus/ch08$ docker rm bind-mount
```

**읽기 전용(ro) 및 읽기/쓰기(rw) 권한 설정:**

```bash
kevin@hostos1:~/fastcampus/ch08$ docker run -it --name=bind-mount \
> -v /home/kevin/fastcampus/ch08/bind01:/bind01:ro \
> -v $(pwd)/bind02:/bind02:rw \
> ubuntu:14.04 bash

root@3fd92c8784c6:/# echo 'welcome to container' >> bind01/docker-1.txt
bash: bind01/docker-1.txt: Read-only file system

(ctrl+p+q)

kevin@hostos1:~/fastcampus/ch08$ docker inspect --format="{{ .HostConfig.Binds }}" bind-mount
[/home/kevin/fastcampus/ch08/bind01:/bind01:ro
/home/kevin/fastcampus/ch08/bind02:/bind02:rw]
```

### 2.2 [실습2] Bind mount, 설정 파일 공유(전달)

Redis DB는 제공되는 기본 설정 파일을 통해 redis-cli 접근인증 암호를 포함시켜 공유하면 해당 암호를 이용해 인증이 가능하다.

**Redis 설정 파일 준비:**

```bash
kevin@hostos1:~/fastcampus/ch08$ mkdir redis-conf && cd $_
kevin@hostos1:~/fastcampus/ch08/redis-conf$ curl -O \
https://raw.githubusercontent.com/redis/redis/7.0/redis.conf

kevin@hostos1:~/fastcampus/ch08/redis-conf$ vi redis.conf
..
1036 # requirepass foobared
1037 requirepass pass123#     ← 인증 암호 설정
```

**Redis 컨테이너 실행:**

```bash
kevin@hostos1:~/fastcampus/ch08/redis-conf$ docker run -itd --name=redis-container \
> -p 6379:6379 -h=redis-db \
> -v ./data:/data \
> -v ./redis.conf:/usr/local/conf/redis.conf \
> redis:7 redis-server /usr/local/conf/redis.conf
```

**Redis 인증 테스트:**

```bash
kevin@hostos1:~/fastcampus/ch08/redis-conf$ docker exec -it redis-container bash

root@redis-db:/data# redis-cli
127.0.0.1:6379> set item1 docker1
(error) NOAUTH Authentication required.
127.0.0.1:6379> exit

root@redis-db:/data# redis-cli -a pass123#
Warning: Using a password with '-a' or '-u' option on the command line interface may not be safe.
127.0.0.1:6379> set item1 docker1
OK
127.0.0.1:6379> set item2 docker2
OK
127.0.0.1:6379> get item1
"docker1"
127.0.0.1:6379> get item2
"docker2"
```

### 2.3 [실습3] file Bind mount

컨테이너 내부의 특정 파일과 호스트의 파일을 직접 연결(mount)할 수 있다.

```bash
~$ docker run -it -v ~/.bash_history:/root/.bash_history --rm centos:8 /bin/bash

[root@064551ed5d7f /]# echo 'docker volume test' > volume.txt
[root@064551ed5d7f /]# ls
... media  mnt  opt  proc  root  run  sbin  srv  sys  tmp  usr  var  volume.txt
[root@064551ed5d7f /]# rm volume.txt
rm: remove regular file 'volume.txt'? y

[root@064551ed5d7f /]# df -h
Filesystem      Size  Used Avail Use% Mounted on
overlay         100G  9.7G   91G  10% /
tmpfs            64M     0   64M   0% /dev
tmpfs           3.9G     0  3.9G   0% /sys/fs/cgroup
shm              64M     0   64M   0% /dev/shm
/dev/sda1        56G   13G   44G  23% /root/.bash_history
...

[root@064551ed5d7f /]# tail ~/.bash_history
[root@064551ed5d7f /]# exit
exit
```

**호스트에서 컨테이너 명령 히스토리 확인:**

```bash
kevin@hostos1:~$ tail .bash_history
docker run -d --name cpuset_2 --cpuset-cpus=0,3 leecloudo/stress:1.0 stress --cpu 2
docker update --cpus=0.2 cpuset_2
clear
htop
echo 'docker volume test' > volume.txt
ls
rm volume.txt
df -h
tail ~/.bash_history
exit
```

### 2.4 [실습4] 시간 동기화를 위한 file Bind mount

컨테이너 내부의 시간을 Docker Host의 시간과 동기화할 수 있다.

```bash
kevin@hostos1:~$ date
2023. 06. 16. (금) 09:16:00 KST

kevin@hostos1:~$ docker run --rm ubuntu:14.04 date
Fri Jun 16 00:16:34 UTC 2023

kevin@hostos1:~$ docker run --rm -v /etc/localtime:/etc/localtime ubuntu:14.04 date
Fri Jun 16 09:17:06 KST 2023
```

**Dockerfile에서 timezone 설정 (권장 방법):**

매번 시간 동기화는 비효율적이다. 그래서, docker image 생성하는 Dockerfile에 timezone을 설정하는 방법을 권장한다.

```dockerfile
FROM ubuntu:20.04
ENV TZ Asia/Seoul
# TimeZone 설정
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone
...
```

---

## 3. [실습] docker volume 방식

> volume 구성 방법 중 docker volume 명령에 대해 알아보기

### 3.1 [실습1] docker volume 생성과 연결

**볼륨 생성:**

```bash
kevin@hostos1:~$ docker volume create mydb-data
mydb-data

kevin@hostos1:~$ docker volume ls
DRIVER    VOLUME NAME
local     0e0edcd6891a29a2305d47bf862574e784985a6b5a1b3f4660c42109b30f674d
...
local     mydb-data

kevin@hostos1:~$ docker volume inspect mydb-data
[
    {
        "CreatedAt": "2023-06-16T09:29:37+09:00",
        "Driver": "local",
        "Labels": null,
        "Mountpoint": "/var/lib/docker/volumes/mydb-data/_data",
        "Name": "mydb-data",
        "Options": null,
        "Scope": "local"
    }
]
```

**MySQL 컨테이너에 볼륨 연결:**

```bash
kevin@hostos1:~$ docker run -d --name mydb \
> -e MYSQL_ROOT_PASSWORD=password1 \
> -e MYSQL_DATABASE=fastcampus \
> -v mydb-data:/var/lib/mysql \
> mysql:5.7-debian

kevin@hostos1:~$ docker ps
b083cd6d5374   mysql:5.7-debian   "docker-entrypoint.s…"   35 seconds ago   Up 33
seconds   3306/tcp, 33060/tcp   mydb

kevin@hostos1:~$ sudo ls /var/lib/docker/volumes/mydb-data/_data
auto.cnf  ca.pem  client-key.pem  ib_buffer_pool  ib_logfile0  ibtmp1
performance_schema  public_key.pem  server-key.pem ca-key.pem client-cert.pem fastcampus
ibdata1 ib_logfile1 mysql private_key.pem server-cert.pem sys

kevin@hostos1:~$ docker exec -it mydb bash
root@c9e335e77d58:/# df –ha
...
/dev/sdb1       100G  9.9G   91G  10% /var/lib/mysql
```

**컨테이너 삭제 후에도 볼륨 데이터 보존 확인:**

```bash
kevin@hostos1:~$ docker stop mydb
kevin@hostos1:~$ docker rm mydb

kevin@hostos1:~$ sudo ls /var/lib/docker/volumes/mydb-data/_data
auto.cnf  ca.pem  client-key.pem  ib_buffer_pool  ib_logfile0  ibtmp1
performance_schema  public_key.pem  server-key.pem ca-key.pem client-cert.pem fastcampus
ibdata1 ib_logfile1 mysql private_key.pem server-cert.pem sys
```

**볼륨 삭제:**

```bash
kevin@hostos1:~$ docker volume rm mydb-data
mydb-data

kevin@hostos1:~$ sudo ls /var/lib/docker/volumes/mydb-data/_data
ls: cannot access '/var/lib/docker/volumes/mydb-data/_data': No such file or directory
```

### 3.2 [실습2] 암시적 docker volume, 볼륨 생성 없이 사용하는 방법

```bash
kevin@hostos1:~$ docker run -d --name mydb \
> -e MYSQL_ROOT_PASSWORD=password1 -e MYSQL_DATABASE=fastcampus \
> -v /var/lib/mysql \
> mysql:5.7-debian

kevin@hostos1:~$ docker inspect mydb
...
 "Mounts": [
            {
                "Type": "volume",
                "Name": "a1364533dc094889c144c32a94091793bdbb1240f92b00cf3624f4b0900a4c02",
                "Source": "/var/lib/docker/volumes/a1364533dc094889c144c32a94091793bdbb1240f92b00cf3624f4b0900a4c02/_data",
                "Destination": "/var/lib/mysql",
                "Driver": "local",
                "Mode": "",
                "RW": true,
                "Propagation": ""
            }
...

kevin@hostos1:~$ docker volume ls
…
local     a1364533dc094889c144c32a94091793bdbb1240f92b00cf3624f4b0900a4c02
```

### 3.3 [실습3] data container

여러 컨테이너에 데이터를 공유하고자 하는 경우 데이터 컨테이너 or 볼륨 컨테이너를 만들고, "--volumes-from 공유컨테이너명" 옵션을 사용하여 볼륨을 공유할 수 있다.

```
                  ┌───────────────────┐
                  │  Data container   │ ←─────┐
                  └───────────────────┘       │
                           ↑                  │
                           │                  │
      ┌────────────────────┼──────────────────┤
      │                    │                  │
      ↓                    │                  ↓
┌───────────┐              │           ┌───────────┐
│  data-1   │              │           │  data-2   │
└───────────┘              │           └───────────┘
                           │
                    Docker host
```

#### [실습3-1] data container, 암시적 docker volume

```bash
~$ docker create -v /share-data --name=share-container ubuntu:14.04

~$ docker ps -a | grep share
72a10e926c38   ubuntu:14.04   "/bin/bash"   12 seconds ago   Created   share-container

~$ docker inspect share-container
…
 "Mounts": [
            {
                "Type": "volume",
                "Name": "8270de0aecf201c752e3c19835da0fffd427dcaad97c96141e76d259a8e94245",
                "Source": "/var/lib/docker/volumes/8270de0aecf201c752e3c19835da0fffd427dcaad97c96141e76d259a8e94245/_data",
                "Destination": "/share-data",
…

~$ docker run -it --volumes-from share-container --name=data-1 ubuntu:14.04 bash
root@cf146148d8ea:/# df –h
/dev/sdb1       100G   11G   90G  11% /share-data

root@cf146148d8ea:/# echo 'testing data container' > /share-data/data-1.txt
root@cf146148d8ea:/# cat /share-data/data-1.txt
testing data container
root@cf146148d8ea:/# exit
```

**두 번째 컨테이너에서 공유 데이터 확인:**

```bash
~$ docker ps -a | grep data
cf146148d8ea   ubuntu:14.04   "bash"   3 minutes ago   Exited (0) 2 minutes ago   data-1

~$ docker run -it --volumes-from share-container --name=data-2 ubuntu:14.04 bash
root@1c3b0776acbe:/# df -h
Filesystem      Size  Used Avail Use% Mounted on
overlay         100G   11G   90G  11% /
tmpfs            64M     0   64M   0% /dev
tmpfs           3.9G     0  3.9G   0% /sys/fs/cgroup
shm              64M     0   64M   0% /dev/shm
/dev/sdb1       100G   11G   90G  11% /share-data
…

root@1c3b0776acbe:/# cat /share-data/data-1.txt
testing data container
```

#### [실습3-2] data container, Bind mount

```bash
~$ docker create -v $(pwd)/share-volume:/share-data --name=share-container ubuntu:14.04

~$ docker run -it --volumes-from share-container --name=data-1 ubuntu:14.04 bash
root@5efbf6c155ea:/# echo 'testing data container' > /share-data/data-1.txt
root@5efbf6c155ea:/# cat /share-data/data-1.txt
testing data container
root@5efbf6c155ea:/# exit
Exit

kevin@hostos1:~$ ls share-volume/
data-1.txt

# 읽기 전용으로 공유
~$ docker run -it --volumes-from share-container:ro --name=data-2 ubuntu:14.04 bash
root@7faf6af824d3:/# cat /share-data/data-1.txt
testing data container
root@8ce0ed8e849c:/# echo 'testing data container2' >> /share-data/data-2.txt
bash: /share-data/data-2.txt: Read-only file system
```

---

## 4. [실습] 데이터 지속성을 위한 volume 구성

> 컨테이너의 중요 데이터의 지속성을 위한 볼륨 구성 실습

### 4.1 [실습1] DB container의 데이터 지속성을 위한 Volume 구성

DB 컨테이너의 중요 데이터 지속성 및 Backup, Migration 등을 목적으로 Volume을 구성한다.

**MySQL 컨테이너 생성 및 볼륨 연결:**

```bash
kevin@hostos1:~$ docker run –itd --name=mydb -e MYSQL_ROOT_PASSWORD=pass123# \
> -e MYSQL_DATABASE=fastcampus \
> -v ${PWD}/mydb-data:/var/lib/mysql \
> mysql:5.7-debian

kevin@hostos1:~$ docker ps
fd73d3cb9de5   mysql:5.7-debian   "docker-entrypoint.s…"   4 seconds ago   Up 1
second   3306/tcp, 33060/tcp   mydb

kevin@hostos1:~$ docker exec -it mydb bash
root@fd73d3cb9de5:/# cat /etc/os-release
PRETTY_NAME="Debian GNU/Linux 10 (buster)"
NAME="Debian GNU/Linux"
VERSION_ID="10"
…

root@fd73d3cb9de5:/# df -h
Filesystem      Size  Used Avail Use% Mounted on
overlay         100G   11G   90G  11% /
/dev/sda1        56G   13G   43G  24% /var/lib/mysql
…
```

**샘플 테이블과 데이터 생성:**

```bash
root@fd73d3cb9de5:/# mysql -uroot -p
Enter password: (pass123#)

mysql> show databases;
+--------------------+
| Database           |
+--------------------+
| information_schema |
| fastcampus         |
…

mysql> use fastcampus;
mysql> create table dockerclass (classid int, classname varchar(50));
mysql> insert into dockerclass values (10,'docker container CI/CD');

mysql> select * from dockerclass;
+---------+-----------------+
| classid | classname       |
+---------+-----------------+
|      10 | container CI/CD |
+---------+-----------------+
1 row in set (0.01 sec)

mysql> exit
Bye
```

**테이블 파일 확인:**

```bash
root@fd73d3cb9de5:/# ls -l /var/lib/mysql/fastcampus/
total 112
-rw-r----- 1 mysql mysql    65 Jun 16 04:18 db.opt
-rw-r----- 1 mysql mysql  8606 Jun 16 04:22 dockerclass.frm
-rw-r----- 1 mysql mysql 98304 Jun 16 04:23 dockerclass.ibd
root@fd73d3cb9de5:/# exit
```

**컨테이너 삭제 후 데이터 보존 확인:**

```bash
kevin@hostos1:~$ docker stop mydb
kevin@hostos1:~$ docker rm mydb

kevin@hostos1:~$ ls mydb-data/
auto.cnf  ca.pem  client-key.pem  ib_buffer_pool  ib_logfile0  mysql
private_key.pem  server-cert.pem  sys  ca-key.pem  client-cert.pem  fastcampus  ibdata1
ib_logfile1  performance_schema  public_key.pem  server-key.pem
```

**동일한 볼륨으로 새 컨테이너 생성:**

```bash
kevin@hostos1:~$ docker run -it --name=mydb -e MYSQL_ROOT_PASSWORD=pass123# -e \
MYSQL_DATABASE=fastcampus -v ${PWD}/mydb-data:/var/lib/mysql -d mysql:5.7-debian

kevin@hostos1:~$ docker exec -it mydb bash
root@329107150fd5:/# mysql -uroot -p
Enter password:

mysql> use fastcampus;
mysql> show tables;
+----------------------+
| Tables_in_fastcampus |
+----------------------+
| dockerclass          |
+----------------------+

mysql> select * from dockerclass;
+---------+-----------------+
| classid | classname       |
+---------+-----------------+
|      10 | container CI/CD |
+---------+-----------------+
```

**MySQL 이미지 버전 변경 시:**

```bash
kevin@hostos1:~$ docker stop mydb
kevin@hostos1:~$ docker rm mydb
kevin@hostos1:~$ docker run -it --name=mydb -e MYSQL_ROOT_PASSWORD=pass123# -e \
MYSQL_DATABASE=fastcampus -v ${PWD}/mydb-data:/var/lib/mysql -d mysql:8.0-debian

kevin@hostos1:~$ docker exec -it mydb bash
root@2d140a8879fe:/# mysql -uroot -p
Enter password:
ERROR 2002 (HY000): Can't connect to local MySQL server through socket '/var/run/mysqld/mysqld.sock' (2)

# /var/lib/mysql/mysql.sock 라는 원본파일에 /tmp/mysql.sock 파일에 Symbolic Link 연결
root@2d140a8879fe:/# ln -s /var/lib/mysql/mysql.sock /tmp/mysql.sock
root@2d140a8879fe:/# mysql -uroot -p
Enter password:
mysql> show databases;
mysql> use fastcampus;
mysql> show tables;
mysql> select * from dockerclass;
```

> **참고:** 동일 이미지에 대한 태그, 즉 버전이 달라도 데이터 연결이 가능하다.

### 4.2 [실습2] Web container의 log 유지 및 실시간 확인을 위한 Volume 구성

Nginx 컨테이너의 접근 및 에러 로그 영역을 볼륨으로 구성하여 실시간 접근 기록 확인 및 장애 시 에러에 대한 정보를 컨테이너가 중지되어도 확인 가능하도록 한다.

```bash
kevin@hostos1:~$ mkdir -p /home/kevin/nginx-log
kevin@hostos1:~$ docker run -d --name=myweb -v /home/kevin/nginx-log:/var/log/nginx \
-p 8011:80 nginx:1.25.0-alpine

kevin@hostos1:~$ docker ps | grep myweb
fcff48f955c8   nginx:1.25.0-alpine   "/docker-entrypoint.…"   16 seconds ago   Up 13
seconds   0.0.0.0:8011->80/tcp, :::8011->80/tcp   myweb

kevin@hostos1:~$ ls nginx-log/
access.log  error.log

kevin@hostos1:~$ tail -f nginx-log/access.log
192.168.56.1 - - [16/Jun/2023:05:14:59 +0000] "GET / HTTP/1.1" 200 615 "-" "Mozilla/5.0 (Windows
NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36" "-"
192.168.56.1 - - [16/Jun/2023:05:14:59 +0000] "GET /favicon.ico HTTP/1.1" 404 555
"http://192.168.56.201:8011/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML,
like Gecko) Chrome/114.0.0.0 Safari/537.36" "-"
…

# 다른 호스트에서 접속 테스트
kevin@hostos2:~$ curl http://192.168.56.201:8011/
```

**웹 로그 분석:**

지정 범위 내의 로그시간($4) 동안 [IP($1) 중복 건수, IP 내림차순 출력]

웹 로그 패턴:
- 패턴($변수): IP(1) -(2) -(3) [년월일시분초(4) +0900](5) "POST(6) /*(7) HTTP(8) 200(9) 사이즈(10)

```bash
kevin@hostos1:~$ cd nginx-log/
kevin@hostos1:~/nginx-log$ awk '$4>"[16/Jun/2023:05:14:58]" && \
$4<"[16/Jun/2023:05:15:31]"' access.log | awk '{ print $1 }' | sort | uniq -c | sort \
-r | more
      6 192.168.56.102
     13 192.168.56.1
```

---

## 5. [실습] volume 사용량 제한 구성

> 컨테이너 볼륨 사용량 제한 구성 실습

### 5.1 컨테이너 영역의 filesystem 사용량은 얼마일까? 제한은 가능할까?

**컨테이너 생성 후 내부에서 df 명령으로 rootfs과 mount된 볼륨 영역 확인:**

```bash
~$ docker run -it -v /home/kevin/myvolume:/webapp --name=mycontainer ubuntu:14.04 bash

root@c303e5badb37:/# df -h
Filesystem      Size  Used Avail Use% Mounted on
overlay         100G   12G   89G  12% /
tmpfs            64M     0   64M   0% /dev
tmpfs           3.9G     0  3.9G   0% /sys/fs/cgroup
shm              64M     0   64M   0% /dev/shm
/dev/sda1        56G   14G   43G  24% /webapp
/dev/sdb1       100G   12G   89G  12% /etc/hosts
tmpfs           3.9G     0  3.9G   0% /proc/acpi
tmpfs           3.9G     0  3.9G   0% /proc/scsi
tmpfs           3.9G     0  3.9G   0% /sys/firmware
```

**호스트에서 파일시스템 확인:**

```bash
kevin@hostos1:~$ df -h
Filesystem      Size  Used Avail Use% Mounted on
tmpfs           795M  1.9M  794M   1% /run
/dev/sda1        56G   14G   43G  24% /
tmpfs           3.9G     0  3.9G   0% /dev/shm
tmpfs           5.0M     0  5.0M   0% /run/lock
tmpfs           4.0M     0  4.0M   0% /sys/fs/cgroup
/dev/sda3        19G   24K   18G   1% /DATA
/dev/sda4        18G   24K   17G   1% /BACKUP
/dev/sdb1       100G   12G   89G  12% /var/lib/docker
tmpfs           795M   88K  795M   1% /run/user/128
tmpfs           795M   72K  795M   1% /run/user/1000
```

> **참고:**
> - 컨테이너에 mount된 /webapp은 볼륨 설정 시 /home~에서 시작됐으므로 Docker Host의 / 영역의 공간을 표현한다.
> - 컨테이너의 / (rootfs)는 컨테이너가 생성된 위치인 /var/lib/docker 영역의 전체 공간을 표현한다.

### 5.2 [실습1-1] 컨테이너 rootfs(/) 영역 제한

Docker는 컨테이너의 rootfs(/) 영역의 개별적인 공간 할당 제한을 위해 `--storage-opt` 옵션을 제공한다. 이 옵션을 사용하려면, 해당 disk partition이 xfs로 지정되어야 하고, 추가 기능으로 pquota(project quota)가 설정되어 있어야 한다.

**현재 마운트 상태 확인:**

```bash
~$ mount | grep xfs
/dev/sdb1 on /var/lib/docker type xfs (rw,relatime,attr2,inode64,logbufs=8,logbsize=32k,noquota)

~$ docker run -it -v /home/kevin/myvolume:/webapp --name=mycontainer --storage-opt \
size=1G ubuntu:14.04 bash
docker: Error response from daemon: --storage-opt is supported only for overlay over xfs with
'pquota' mount option.
```

**pquota 설정:**

```bash
~$ sudo vi /etc/default/grub
..
10 GRUB_CMDLINE_LINUX_DEFAULT="quiet splash rootflags=uquota,pquota"

~$ sudo vi /etc/fstab
..
UUID=b2f0ef34-291f-411d-aa75-9a46d72c7401 /var/lib/docker xfs defaults,pquota 0 0

~$ sudo reboot
```

**재부팅 후 컨테이너 생성:**

```bash
~$ docker run -it -v /home/kevin/myvolume:/webapp --name=mycontainer --storage-opt \
size=1G ubuntu:14.04 bash

root@d3032cafdbc1:/# df -h
Filesystem      Size  Used Avail Use% Mounted on
overlay         1.0G  8.0K  1.0G   1% /
…
```

### 5.3 [실습1-2] 컨테이너 rootfs(/) 영역 제한 (Docker daemon 설정)

모든 컨테이너의 rootfs(/)용량을 500m으로 제한, docker daemon에 제한 설정을 한다.

```bash
kevin@hostos1:~$ sudo vi /etc/docker/daemon.json
{ "insecure-registries": ["192.168.56.101:5000"],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "30m",
    "max-file": "10"
  },
  "storage-opts": ["overlay2.size=500m"]
}

kevin@hostos1:~$ sudo systemctl restart docker.service
kevin@hostos1:~$ sudo systemctl status docker.service

kevin@hostos1:~$ docker run -it -v /home/kevin/myvolume:/webapp --name=mycontainer \
ubuntu:14.04 bash

root@0619da551083:/# df -h
Filesystem      Size  Used Avail Use% Mounted on
overlay         500M  8.0K  500M   1% /
…
```

### 5.4 [실습2] 컨테이너 Volume 공간 사용량 제한

bind mount로 볼륨을 구성하고 컨테이너 영역의 공간을 제한해 본다.

**임시 디스크 이미지 생성:**

```bash
kevin@hostos1:~$ sudo su -

root@hostos1:~# dd if=/dev/zero of=tmpdisk.img count=512 bs=1M
512+0 records in
512+0 records out
536870912 bytes (537 MB, 512 MiB) copied, 0.480423 s, 1.1 GB/s

root@hostos1:~# mkfs.xfs tmpdisk.img
meta-data=tmpdisk.img            isize=512    agcount=4, agsize=32768 blks
         =                       sectsz=512   attr=2, projid32bit=1
…

root@hostos1:~# fdisk -l tmpdisk.img
Disk tmpdisk.img: 512 MiB, 536870912 bytes, 1048576 sectors
Units: sectors of 1 * 512 = 512 bytes
Sector size (logical/physical): 512 bytes / 512 bytes
I/O size (minimum/optimal): 512 bytes / 512 bytes
```

**디스크 이미지 마운트:**

```bash
root@hostos1:~# mkdir -p /home/kevin/volume-quota
root@hostos1:~# mount -o loop tmpdisk.img /home/kevin/volume-quota

root@hostos1:~# df -h
…
/dev/loop18     507M   30M  478M   6% /home/kevin/volume-quota

root@hostos1:~# chown -R kevin.kevin /home/kevin/volume-quota
root@hostos1:~# exit
Logout
```

**볼륨 사용량 제한된 컨테이너 실행:**

```bash
kevin@hostos1:~$ docker run -it -v /home/kevin/volume-quota:/webapp --name=myvolume \
ubuntu:14.04 bash

root@fc3eb81aa4c6:/# df -h
Filesystem      Size  Used Avail Use% Mounted on
overlay         100G   12G   89G  12% /
tmpfs            64M     0   64M   0% /dev
tmpfs           3.9G     0  3.9G   0% /sys/fs/cgroup
shm              64M     0   64M   0% /dev/shm
/dev/loop18     507M   30M  478M   6% /webapp
/dev/sdb1       100G   12G   89G  12% /etc/hosts
```

---

## 요약

| 방식 | 저장 위치 | 지속성 | 관리 주체 | 용도 |
|------|----------|--------|----------|------|
| **Bind mount** | 호스트의 지정된 경로 | 컨테이너 삭제 후에도 유지 | 사용자 | 설정 파일 공유, 개발 환경 |
| **Docker volume** | /var/lib/docker/volumes/ | 컨테이너 삭제 후에도 유지 | Docker | DB 데이터, 영구 데이터 저장 |
| **tmpfs mount** | 호스트 메모리 | 컨테이너 중지 시 삭제 | Docker | 임시 데이터, 민감한 정보 |

### 주요 명령어 정리

```bash
# Bind mount
docker run -v /호스트경로:/컨테이너경로 이미지명
docker run --mount type=bind,source=/호스트경로,target=/컨테이너경로 이미지명

# Docker volume
docker volume create 볼륨명
docker volume ls
docker volume inspect 볼륨명
docker volume rm 볼륨명
docker run -v 볼륨명:/컨테이너경로 이미지명

# tmpfs mount
docker run --tmpfs /컨테이너경로 이미지명
docker run --mount type=tmpfs,destination=/컨테이너경로 이미지명

# Data container (볼륨 공유)
docker create -v /공유경로 --name=공유컨테이너명 이미지명
docker run --volumes-from 공유컨테이너명 이미지명

# 볼륨 권한 설정
-v /호스트경로:/컨테이너경로:ro  # 읽기 전용
-v /호스트경로:/컨테이너경로:rw  # 읽기/쓰기

# rootfs 크기 제한
docker run --storage-opt size=1G 이미지명
```
