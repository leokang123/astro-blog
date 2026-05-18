---
title: "Chapter 15. File-System Internals"
order: 15
pubDatetime: 2026-05-13T00:15:00+09:00
modDatetime: 2026-05-13T00:15:00+09:00
description: "Chapter 15. File-System Internals 정리 노트입니다."
tags:
  - "CS"
  - "OperatingSystem"
---
# Chapter 15. File-System Internals

- 과목: Operating System
- 기준 교재: Operating System Concepts 10th
- 관련 페이지: PDF pp. 730-749
- 우선순위: 필수

## 개요

Chapter 13이 file-system interface를 사용자 관점에서 설명하고, Chapter 14가 allocation/free-space/recovery 같은 구현 구조를 설명했다면, Chapter 15는 file systems가 OS 전체 안에서 어떻게 연결되고 공유되는지 다룬다. 핵심 질문은 “여러 devices, partitions, volumes, file-system types, local/remote file systems를 하나의 usable namespace로 어떻게 보이게 할 것인가”다.

이 장의 초점은 file contents를 blocks에 배치하는 방법 자체보다, mounted file systems, file sharing, virtual file systems(VFS), remote file systems, consistency semantics, NFS(Network File System)처럼 file system을 운영체제 서비스로 통합하는 내부 구조에 있다. 따라서 storage 계층과 naming 계층, local file system과 remote file system, kernel interface와 specific file-system implementation 사이의 경계를 함께 봐야 한다.

## 핵심 개념

| 개념 | 핵심 의미 |
|---|---|
| `file-system internals` | file systems를 OS namespace, device/volume structure, sharing, VFS, remote access와 연결하는 내부 구조. |
| `storage device`, `partition`, `volume`, `file system` | physical device가 partitions로 나뉘고, partitions 또는 여러 partitions가 volume을 만들며, volume 위에 file system이 놓이는 계층. |
| `volume manager` | volume이 single partition을 넘어서 multiple partitions 또는 disks에 걸치도록 관리할 수 있는 software layer. |
| `general-purpose file system` | 일반 files/directories를 persistent storage에 저장하고 접근하는 보통의 file system. UFS, ZFS 등이 예다. |
| `special-purpose file system` | 실제 disk file storage보다 kernel/process/device/temporary data를 file-system interface로 노출하는 file system. `tmpfs`, `procfs`, `objfs` 등이 예다. |
| `mount`, `mount point` | file-system-containing volume을 기존 directory tree의 특정 위치에 attach하여 processes가 접근 가능하게 만드는 동작과 그 위치. |
| `file-system namespace` | `/home/jane` 같은 path names를 통해 여러 mounted file systems를 하나의 directory structure처럼 탐색하게 하는 name space. |
| `device directory` | OS가 device 안에 valid file system이 있는지, expected format인지 확인할 때 읽는 on-device metadata area. |
| `unmount` | mounted file system 사용을 종료하고 mount point 아래를 원래 상태로 되돌리는 동작. |
| `drive letter` | Windows 계열에서 volume을 `C:\...`처럼 extended two-level directory structure로 식별하는 방식. |
| `raw partition`, `cooked partition` | file system 없이 application/OS-specific format을 직접 쓰는 partition과 file system을 담은 partition. |
| `bootstrap loader` | boot information 영역에서 memory로 load되어 kernel을 찾아 실행하는 boot-time code image. |
| `root partition` | boot loader가 선택하고 boot time에 mount되는 OS kernel/system files 포함 partition. |
| `mount table`, `superblock` | mounted file systems의 위치/type/device 정보를 memory에 기록하는 table과 mounted file system의 대표 metadata. |
| `owner`, `group`, `user ID`, `group ID` | multi-user file sharing/protection에서 permissions를 결정하기 위해 file/directory attributes와 request user를 비교하는 identity 정보. |
| `VFS`, `virtual file system` | file-system-generic operations와 concrete file-system implementations를 분리해 여러 local/remote file-system types를 같은 interface로 다루는 layer. |
| `vnode` | VFS에서 active file/directory를 표현하는 structure. Network-wide unique file representation을 제공한다. |
| `inode object`, `file object`, `superblock object`, `dentry object` | Linux VFS가 file, open file, entire file system, directory entry를 표현하는 주요 object types. |
| `function table`, `struct file_operations` | VFS object가 operations 구현 함수들의 addresses를 가리키게 하여 file-system type을 몰라도 공통 operation을 호출하게 하는 dispatch 구조. |
| `remote file system`, `DFS` | remote directories/files가 local machine의 namespace 안에 보이게 하는 distributed file system 방식. |
| `client-server model` | files를 가진 machine은 server, files 접근을 요청하는 machine은 client가 되는 remote file-system 구조. |
| `distributed information system`, `distributed naming service` | DNS, NIS, Active Directory, LDAP처럼 remote computing에 필요한 name/address/user/group 정보를 통합 제공하는 service. |
| `failure semantics` | server crash, network partition 등 remote FS 장애 때 operations를 terminate할지 delay/retry할지 정하는 protocol semantics. |
| `stateless DFS`, `stateful DFS` | server/client가 open files와 activity state를 추적하지 않는 DFS와 추적하는 DFS. NFSv3는 stateless, NFSv4는 stateful 방향. |
| `consistency semantics` | shared file에서 한 user의 write가 다른 users에게 언제 visible해지는지 정하는 semantics. |
| `file session` | 같은 file에 대해 한 user가 `open()`과 `close()` 사이에서 수행하는 reads/writes sequence. |
| `NFS`, `Network File System` | LAN/WAN을 통해 remote files를 local namespace에 transparent하게 통합하는 client-server network file system. |
| `RPC`, `XDR` | NFS가 heterogeneous machines/OS/network architectures 사이에서 remote procedures와 data representation을 구현하는 기반. |
| `mount protocol`, `NFS protocol` | remote directory를 client namespace에 연결하는 protocol과, 실제 remote file operations를 수행하는 protocol. |
| `export list`, `file handle` | server가 mount 허용 대상과 access rights를 기록한 list, 그리고 이후 remote access의 key가 되는 file identifier. |
| `idempotent` | 같은 operation을 여러 번 수행해도 한 번 수행한 것과 같은 effect를 갖는 성질. Stateless NFS recovery에 중요하다. |
| `directory-name-lookup cache` | NFS client가 remote directory name에 대한 vnode lookup 결과를 저장해 path-name translation RPC 비용을 줄이는 cache. |
| `attribute cache`, `file-blocks cache` | NFS client가 remote file attributes와 file blocks를 local cache하여 remote operations 성능을 높이는 caches. |
| `read-ahead`, `delayed-write` | NFS client-server 사이 성능 향상을 위해 앞으로 읽을 blocks를 미리 가져오고 writes를 지연하는 caching techniques. |

## 세부 정리

### 15.1 File Systems

General-purpose computer는 하나의 file만 저장하지 않는다. 보통 수천, 수백만, 수십억 개의 files가 hard disk drives, optical disks, nonvolatile memory devices 같은 random-access storage devices에 저장된다. 그래서 file system internals는 단순히 “file 하나를 어디에 저장하는가”가 아니라, 많은 files와 여러 storage resources를 어떻게 조직할 것인가의 문제다.

Storage organization은 보통 다음 계층으로 이해한다.

| 계층 | 의미 |
|---|---|
| `storage device` | HDD, optical disk, NVM device 같은 physical/random-access 저장 장치 |
| `partition` | 하나의 device를 OS/volume management 목적에 맞게 나눈 구획 |
| `volume` | file system을 담는 logical storage unit. Volume manager에 따라 여러 partitions/disks에 걸칠 수 있음 |
| `file system` | volume 위에 directories/files/metadata를 배치하고 naming/access를 제공하는 구조 |

![Typical storage device organization](@/assets/images/cs-operating-system-314-figure-15-1-page-731.png)
<p align="center"><sub>Figure 15.1 · PDF p. 731 · storage device가 partitions와 volumes를 거쳐 file systems를 담는 전형적 구성</sub></p>

Figure 15.1의 핵심은 device, partition, volume, file system이 항상 1:1로만 대응하지 않는다는 점이다. 하나의 disk가 여러 partitions를 가질 수 있고, volume은 여러 partitions에 걸칠 수도 있으며, computer system은 여러 종류의 file systems를 동시에 사용할 수 있다.

현대 OS에는 general-purpose file systems뿐 아니라 special-purpose file systems도 많다. Solaris 예시는 하나의 system 안에서 ufs, zfs 같은 persistent file systems와 tmpfs, procfs, objfs, ctfs, lofs 같은 special-purpose file systems가 함께 mount될 수 있음을 보여 준다.

![Solaris file systems](@/assets/images/cs-operating-system-315-figure-15-2-page-732.png)
<p align="center"><sub>Figure 15.2 · PDF p. 732 · Solaris에서 여러 file-system types가 서로 다른 mount points에 동시에 존재하는 예</sub></p>

대표 예시는 다음처럼 정리할 수 있다.

| File system | 성격 | 핵심 용도 |
|---|---|---|
| `tmpfs` | temporary file system | volatile main memory에 만들어지고 reboot/crash 시 contents가 사라짐 |
| `procfs` | virtual file system | processes 정보를 file-system view로 노출 |
| `objfs` | virtual file system | debuggers가 kernel symbols에 접근할 수 있게 함 |
| `ctfs` | virtual file system | boot/operation 중 유지되어야 하는 process contract information 관리 |
| `lofs` | loopback file system | 한 file system을 다른 위치에서 접근할 수 있게 함 |
| `ufs`, `zfs` | general-purpose file system | 일반 persistent files/directories 저장 |

이 예시에서 중요한 점은 “file system”이 반드시 disk files만 의미하지 않는다는 것이다. OS는 file-system interface를 kernel/process/device/temporary information에 대한 uniform access mechanism으로도 사용한다. File system 내부에서도 files를 groups로 나누어 관리하기 위해 directories가 사용되며, 이 내용은 Chapter 14의 directory implementation과 이어진다.

### 15.2 File-System Mounting

File을 사용하려면 `open()`이 필요하듯, file system도 process가 접근하려면 먼저 `mount`되어야 한다. Directory structure는 multiple file-system-containing volumes로 구성될 수 있고, 각 volume은 name space 안의 특정 위치에 붙어야 한다.

Mount procedure의 기본 입력은 두 가지다.

| 입력 | 의미 |
|---|---|
| device name | file system을 담고 있는 storage device 또는 volume |
| `mount point` | 기존 file structure 안에서 새 file system을 attach할 directory |

일부 OS는 file-system type을 명시적으로 요구하고, 다른 OS는 device structures를 검사해 type을 결정한다. 보통 mount point는 empty directory다. 예를 들어 user home directories를 담은 file system을 UNIX에서 `/home`에 mount하면 `/home/jane`으로 접근하고, 같은 file system을 `/users`에 mount하면 `/users/jane`으로 같은 directory를 접근할 수 있다.

OS는 mount 전에 device가 valid file system을 포함하는지 확인한다. Device driver에게 device directory를 읽게 하고, directory가 expected format인지 검사한다. 이후 OS는 내부 directory structure에 “이 mount point에는 이 file system이 mounted되어 있다”는 정보를 기록한다. 그래서 pathname traversal 중 mount point를 만나면 다른 file system으로 넘어갈 수 있고, file-system type이 달라도 하나의 namespace처럼 탐색할 수 있다.

![Existing file system and unmounted volume](@/assets/images/cs-operating-system-316-figure-15-3-page-733.png)
<p align="center"><sub>Figure 15.3 · PDF p. 733 · 기존 file system과 아직 namespace에 연결되지 않은 unmounted volume</sub></p>

Figure 15.3은 기존 `/users` subtree와 별도의 unmounted volume을 보여 준다. 이 시점에는 unmounted volume 안의 files는 일반 pathname으로 접근할 수 없다.

![Volume mounted at /users](@/assets/images/cs-operating-system-317-figure-15-4-page-733.png)
<p align="center"><sub>Figure 15.4 · PDF p. 733 · `/device/dsk`의 volume을 `/users`에 mount하여 기존 namespace에 붙인 결과</sub></p>

Figure 15.4처럼 `/device/dsk`의 volume을 `/users`에 mount하면, `/users` 아래 path traversal은 mounted volume의 root로 넘어간다. Unmount하면 Figure 15.3의 원래 상황으로 돌아간다.

Mount semantics는 OS마다 다를 수 있다.

| 상황 | 가능한 semantics |
|---|---|
| nonempty directory 위에 mount | mount를 금지하거나, mounted file system이 기존 files를 temporarily obscure하도록 허용 |
| same file system 반복 mount | 여러 mount points에 같은 file system을 허용하거나, file system당 한 mount만 허용 |
| mount discovery | boot 시 configuration file을 읽어 자동 mount하거나, device 발견 시 자동 mount하거나, explicit mount command를 요구 |

macOS는 boot 중 또는 실행 중 새 disk를 처음 만나면 device에서 file system을 찾고, 발견하면 `/Volumes` 아래에 file-system name을 가진 folder icon으로 자동 mount한다. Windows는 전통적으로 drive letters를 사용해 `drive-letter:\path\to\file` 형태의 extended two-level directory structure를 제공한다. 최신 Windows는 UNIX처럼 directory tree 어디에나 file system을 mount할 수도 있다. UNIX 계열은 configuration file에 boot-time automatic mounts를 적어 두고, 다른 mounts는 수동으로 실행할 수 있다.

### 15.3 Partitions and Mounting

Disk layout은 OS와 volume management software에 따라 달라진다. 하나의 disk는 multiple partitions로 나뉠 수 있고, 반대로 하나의 volume이 multiple partitions나 multiple disks에 걸칠 수도 있다. 이 절은 주로 disk를 여러 partitions로 나누는 경우를 다루고, 여러 disks/partitions에 걸친 volume은 RAID나 volume management와 더 가깝다.

Partition은 크게 `raw` 또는 `cooked`일 수 있다.

| Partition type | 의미 | 대표 사용 |
|---|---|---|
| `raw partition` | file system을 포함하지 않고, OS/application-specific format으로 직접 사용 | UNIX swap space, 일부 databases, RAID metadata/bitmap/configuration |
| `cooked partition` | file system을 포함하는 partition | 일반 files/directories 저장, bootable partition |

Raw disk가 필요한 이유는 file-system abstraction이 항상 적합하지 않기 때문이다. Swap space는 자체 disk format을 쓰고 file system을 거치지 않는다. 일부 databases도 성능과 layout control을 위해 raw disk를 직접 format한다. RAID software는 어떤 blocks가 mirrored되었고 어떤 blocks가 변경되어 mirror되어야 하는지 나타내는 bitmaps나 RAID set configuration 같은 metadata를 raw disk에 둘 수 있다.

Bootable file system을 가진 partition은 별도의 `boot information`도 필요하다. Boot time에는 아직 file-system code가 load되지 않았으므로 OS는 file-system format을 해석할 수 없다. 그래서 boot information은 보통 memory로 image처럼 load되는 sequential blocks 형태이며, predefined location에서 execution이 시작된다. 이 image가 `bootstrap loader`이고, bootstrap loader는 file-system structure를 충분히 이해해 kernel을 찾아 load하고 실행한다.

Boot loader는 하나의 OS만 boot하는 code일 필요가 없다. Dual boot system처럼 multiple operating systems가 한 system에 설치될 수 있고, boot loader가 multiple file systems와 operating systems를 이해하면 drive 안의 여러 partitions 중 하나를 선택해 boot할 수 있다. 반대로 boot loader가 특정 file-system format을 이해하지 못하면 그 file system 위의 OS는 bootable하지 않다. 어떤 OS에서 root file system으로 지원되는 file-system types가 제한되는 이유 중 하나다.

Boot loader가 선택한 `root partition`은 boot time에 mount된다. Root partition에는 operating-system kernel과 system files가 들어 있다. 다른 volumes는 OS에 따라 boot 시 자동 mount되거나 나중에 manually mount된다. Mount operation이 성공하려면 OS가 device에 valid file system이 있음을 확인하고, invalid format이면 consistency check와 correction이 필요할 수 있다. 성공 후 OS는 in-memory `mount table`에 mounted file system, mount location, file-system type 등을 기록한다.

Windows와 UNIX는 mount information을 namespace에 연결하는 방식이 다르다.

| OS family | Mount representation |
|---|---|
| Windows | 각 volume이 `F:` 같은 별도 namespace를 갖고, device structure의 field가 해당 file system pointer를 가리킴. 최신 Windows는 directory tree 내부 mount도 가능 |
| UNIX | 어떤 directory에도 mount 가능. 해당 directory inode의 in-memory copy에 mount-point flag를 세우고, mount table entry를 가리키게 함. Mount table entry는 mounted device의 superblock pointer를 포함 |

UNIX 방식에서는 pathname traversal 중 mount-point flag를 만나면 mount table을 통해 mounted file system의 `superblock`으로 넘어간다. 그래서 서로 다른 file-system types가 섞여 있어도 directory tree를 끊김 없이 탐색할 수 있다.

### 15.4 File Sharing

File sharing은 collaboration과 work reduction을 위해 필요하지만, multi-user OS에서는 naming, protection, conflicting writes 같은 어려움을 만든다. 같은 file을 여러 users가 읽거나 쓸 수 있다면 OS는 누가 어떤 operation을 수행할 수 있는지, 서로의 actions를 어떻게 보호할지 정해야 한다.

#### 15.4.1 Multiple Users

Multiple users를 지원하면 file sharing, file naming, file protection이 핵심 문제가 된다. Directory structure가 users 사이의 sharing을 허용한다면 OS는 sharing을 중재해야 한다. 어떤 system은 다른 user files 접근을 기본 허용하고, 어떤 system은 owner가 명시적으로 access를 grant해야 한다. 이 문제는 Chapter 13의 access control/protection과 이어진다.

Sharing/protection을 구현하려면 single-user system보다 더 많은 file/directory attributes가 필요하다. 대부분의 systems는 `owner`와 `group` 개념을 사용한다.

| Attribute | 의미 |
|---|---|
| `owner` / `user` | file attributes를 바꾸고 access를 grant할 수 있는 가장 강한 control 주체 |
| `group` | file에 대한 shared access를 받을 users subset |
| `user ID`, `group ID` | operation request가 어떤 permissions set에 해당하는지 판단하기 위해 비교되는 identifiers |

UNIX에서는 owner가 file에 대해 모든 operations를 수행할 수 있고, group members와 others는 owner가 정의한 subset만 수행할 수 있다. File 또는 directory의 owner/group IDs는 다른 attributes와 함께 저장된다. User가 operation을 요청하면 OS는 request user ID를 owner attribute와 비교하고, group IDs도 비교한 뒤 적용할 permission set을 결정한다.

Local mounted file systems에서는 ID checking과 permission matching이 비교적 직관적이다. 하지만 external disk를 여러 systems 사이에서 옮기면 문제가 생긴다. 두 systems의 user/group IDs가 다르면 portable disk의 file ownership이 의도치 않게 다른 user에게 매핑될 수 있다. 따라서 devices가 이동될 때 IDs가 system 간에 일치하는지 확인하거나, file ownership을 reset하는 정책이 필요하다.

### 15.5 Virtual File Systems

Modern operating systems는 여러 file-system types를 동시에 지원해야 한다. 문제는 users가 `/`, `/proc`, `/tmp`, remote mount 등 서로 다른 file-system implementations 사이를 이동해도 같은 `open()`, `read()`, `write()`, `close()` interface로 접근해야 한다는 점이다.

모든 file-system type마다 directory/file routines를 system-call layer에 직접 붙이는 방식은 단순하지만 좋지 않다. OS는 대신 object-oriented style의 data structures와 procedures를 사용해 generic file-system operations와 implementation details를 분리한다. 이 구조가 `VFS(virtual file system)`다.

![Virtual file system](@/assets/images/cs-operating-system-318-figure-15-5-page-737.png)
<p align="center"><sub>Figure 15.5 · PDF p. 737 · file-system interface 아래 VFS layer가 여러 local/remote file-system implementations를 공통 interface로 연결하는 구조</sub></p>

VFS architecture는 세 계층으로 볼 수 있다.

| Layer | 역할 |
|---|---|
| file-system interface | `open()`, `read()`, `write()`, `close()`와 file descriptors 기반 user-visible interface |
| `VFS interface` | file-system-generic operations와 specific implementation을 분리하는 clean interface |
| file-system implementation / protocol layer | local file system type 또는 NFS 같은 remote-file-system protocol이 실제 요청 처리 |

VFS의 중요한 기능은 두 가지다. 첫째, file-system-generic operations와 implementation을 분리하여 여러 local file-system types가 같은 machine에서 transparent하게 공존하게 한다. 둘째, network file systems를 위해 file을 network-wide unique하게 표현하는 mechanism을 제공한다.

이를 위해 VFS는 `vnode`라는 file-representation structure를 사용한다. UNIX `inode`는 한 file system 안에서만 unique하지만, vnode는 network-wide unique file representation을 포함할 수 있다. Kernel은 active node, 즉 active file 또는 directory마다 vnode structure를 유지한다. VFS는 local files와 remote files를 구분하고, local files도 file-system type별로 구분한다. Local request는 해당 file-system-specific operations를 호출하고, remote request는 NFS protocol procedures 같은 remote protocol operations를 호출한다.

Linux VFS는 대표적으로 네 가지 main object types를 정의한다.

| Linux VFS object | 표현 대상 |
|---|---|
| `inode object` | individual file |
| `file object` | open file |
| `superblock object` | entire file system |
| `dentry object` | individual directory entry |

각 object type에 대해 VFS는 구현해야 할 operations 집합을 정의한다. 각 object는 function table pointer를 가지며, function table에는 해당 object에서 실제 operation을 수행할 함수 addresses가 들어 있다. 예를 들어 file object는 `open`, `close`, `read`, `write`, `mmap` 같은 operations를 제공해야 한다. Linux에서는 이런 file operation definitions가 `struct file_operations` 같은 형태로 표현된다.

이 구조의 장점은 dispatch의 일관성이다. VFS는 현재 다루는 inode가 disk file인지, directory file인지, remote file인지 미리 알 필요가 없다. `read()` operation에 해당하는 function table slot을 호출하면, concrete file-system implementation이 해당 file type에 맞는 실제 read 동작을 수행한다.

### 15.6 Remote File Systems

Networks가 등장하면서 files도 remote machines 사이에서 공유될 수 있게 되었다. Remote file sharing은 크게 세 흐름으로 발전했다.

| 방식 | 특징 |
|---|---|
| manual transfer | `ftp` 같은 program으로 files를 직접 주고받음 |
| `DFS` / distributed file system | remote directories가 local machine에서 visible하도록 namespace에 통합 |
| web/cloud style sharing | browser, wrapper around ftp, cloud computing 등을 통해 remote files 접근 |

`ftp`와 web-style transfer는 remote file을 “가져오거나 보내는” 느낌이 강하다. 반면 `DFS`는 remote directories/files를 local file-system namespace 안에 통합하기 때문에 훨씬 tight integration을 제공한다. 그만큼 authentication, failure handling, consistency semantics가 복잡해진다.

#### 15.6.1 The Client-Server Model

Remote file systems에서는 files를 가진 machine이 `server`, 그 files에 접근하려는 machine이 `client`다. Server는 어떤 resource를 어떤 clients에게 제공할지 선언한다. 보통 server는 volume 또는 directory level에서 available files를 지정한다. 한 server는 multiple clients를 serve할 수 있고, 한 client는 multiple servers를 사용할 수 있다. NFS처럼 many-to-many relationships를 허용하면 한 machine이 어떤 clients에게는 server이면서 다른 NFS servers의 client일 수도 있다.

Client identification은 security 문제를 만든다. Network name이나 IP address로 client를 지정할 수 있지만 spoofing될 수 있다. Secure authentication은 encrypted keys를 사용할 수 있지만, client/server가 같은 encryption algorithms를 써야 하고 key exchange가 안전해야 한다. 이런 어려움 때문에 현실의 많은 systems는 덜 안전한 authentication 방식을 써 왔다.

UNIX NFS의 기본 authentication은 client networking information과 user ID matching에 의존한다. Client에서 user ID가 1000이고 server에서는 같은 사람이 2000이면, server는 request를 user 1000의 권한으로 판단해 잘못된 allow/deny 결정을 할 수 있다. 즉 server는 client가 올바른 user ID를 제시한다고 trust해야 한다.

Remote file system이 mounted되면 file operation requests는 DFS protocol을 통해 network 너머 server로 전송된다. 보통 file-open request에는 requesting user ID가 함께 전달되고, server는 standard access checks로 해당 mode 접근을 허용할지 결정한다. 허용되면 file handle이 client application에 반환되고, 이후 application은 read/write/close 등 operations를 수행한다. Local mount와 유사한 semantics를 쓸 수도 있고, remote 특성에 맞게 다른 semantics를 쓸 수도 있다.

#### 15.6.2 Distributed Information Systems

Client-server remote FS를 관리하려면 host names, network addresses, user names, passwords, user IDs, group IDs 같은 information이 여러 machines 사이에서 일관되어야 한다. 이를 제공하는 것이 `distributed information systems` 또는 `distributed naming services`다.

`DNS(Domain Name System)`는 Internet 전체에서 host name을 network address로 변환한다. DNS 이전에는 같은 정보를 담은 files를 모든 hosts 사이에 email/ftp로 배포했는데, 이는 scale되지 않는다.

UNIX 계열에서는 `NIS(Network Information Service)`가 user names, host names, printer information 등을 중앙에서 저장하는 방식으로 널리 쓰였다. 하지만 NIS는 passwords를 clear text로 보내거나 IP address 기반 host identification을 사용하는 등 secure하지 않다. `NIS+`는 더 안전한 대체였지만 복잡해서 널리 채택되지 못했다.

Microsoft `CIFS(Common Internet File System)`는 network information과 user authentication(user name/password)을 결합해 network login을 만들고, server가 requested file system access를 allow/deny하도록 한다. 이때도 machine 사이 user names가 match해야 한다. Microsoft `Active Directory`는 users에 대한 single name space를 제공하고, Microsoft version의 `Kerberos` network authentication protocol을 사용한다.

Industry는 secure distributed naming mechanism으로 `LDAP(Lightweight Directory-Access Protocol)` 사용으로 이동했다. Active Directory도 LDAP 기반이다. LDAP directory 하나에 organization의 users/resources information을 모으면, users는 single sign-on에 가까운 경험을 얻고 administrators는 scattered local files나 여러 naming services에 흩어진 정보를 한곳에서 관리할 수 있다.

#### 15.6.3 Failure Modes

Local file systems도 drive failure, metadata corruption, disk-controller failure, cable failure, host-adapter failure, user/admin mistake 등으로 실패할 수 있다. 이런 실패는 host crash, error display, human intervention을 요구할 수 있다.

Remote file systems는 failure modes가 더 많다. Network interruption, network partition, server crash, scheduled server shutdown, hardware misconfiguration, network implementation issue가 모두 DFS commands 흐름을 끊을 수 있다. Client가 remote files를 open하고 directory lookup/read/write/close를 수행하는 중 server가 unreachable해질 수 있다.

Remote FS가 local FS처럼 즉시 fatal error로 동작하면 users는 data와 작업 흐름을 쉽게 잃는다. 그래서 remote-file-system protocol은 장애 시 operations를 terminate할지, server가 다시 reachable해질 때까지 delay/retry할지 `failure semantics`로 정의한다. 대부분 DFS protocols는 remote host가 돌아오기를 기대하며 operations delay를 enforce하거나 allow한다.

Seamless recovery에는 client와 server 양쪽의 state information이 도움이 된다. Open files와 current activities를 양쪽이 알고 있으면 failure 후 복구가 자연스럽다. 하지만 NFS Version 3는 단순성을 위해 `stateless DFS`를 구현한다. Server는 어떤 clients가 exported volumes를 mount했는지, 어떤 files가 open되었는지 추적하지 않는다. 대신 read/write request 안에 target file을 찾고 operation을 수행하는 데 필요한 모든 information을 담는다고 본다.

Stateless design은 resilience와 implementation simplicity를 주지만 security가 약하다. Forged read/write requests도 legitimate request처럼 보일 수 있기 때문이다. NFS Version 4는 security, performance, functionality를 개선하기 위해 더 `stateful`한 방향으로 바뀐다.

### 15.7 Consistency Semantics

`consistency semantics`는 shared file을 여러 users가 동시에 access할 때, 한 user의 data modification이 다른 users에게 언제 보이는지 정의한다. 이는 Chapter 6의 process synchronization과 직접 관련되지만, file I/O에서는 disk/network latency가 크기 때문에 복잡한 synchronization algorithms를 그대로 구현하면 성능이 나쁘다. Remote disk에 atomic transaction을 하려면 여러 network communications와 disk reads/writes가 필요할 수 있다.

이 절에서는 같은 file에 대한 한 user의 reads/writes sequence가 `open()`과 `close()` 사이에 있다고 가정하고, 이를 `file session`이라고 본다.

#### 15.7.1 UNIX Semantics

UNIX semantics에서는 한 user가 open file에 write한 내용이 같은 file을 open한 다른 users에게 즉시 visible하다. 또한 한 sharing mode에서는 users가 file의 current-location pointer를 공유할 수 있어, 한 user가 pointer를 advance하면 다른 sharing users에게도 영향을 준다.

즉 UNIX semantics의 file은 single physical image와 연결되고, 그 image가 exclusive resource처럼 access된다. 모든 origins의 accesses가 하나의 image 위에서 interleave되므로 consistency는 강하지만 contention으로 process delays가 생긴다.

#### 15.7.2 Session Semantics

Andrew file system(OpenAFS)의 `session semantics`에서는 open file에 대한 writes가 같은 file을 이미 open한 다른 users에게 즉시 visible하지 않다. File이 close된 뒤에야 changes가 나중에 시작되는 sessions에 visible하다. 이미 open된 file instances는 그 changes를 반영하지 않는다.

이 semantics에서는 file이 temporarily several images와 연결될 수 있다. Multiple users가 각자의 image에 대해 read/write를 concurrently 수행할 수 있으므로 delays가 줄고 scheduling constraints가 거의 없다. 대신 UNIX semantics처럼 single image를 즉시 공유하는 모델과는 다른 consistency expectation을 가져야 한다.

#### 15.7.3 Immutable-Shared-Files Semantics

`immutable shared files`는 shared file을 creator가 shared로 선언하면 이후 modify할 수 없게 하는 접근이다. 핵심 property는 두 가지다. File name은 재사용될 수 없고, contents는 변경될 수 없다. 따라서 immutable file의 name은 fixed contents를 의미한다.

Distributed system에서 immutable-shared-files semantics는 구현이 단순하다. Sharing이 read-only로 discipline되어 있기 때문에 concurrent writes나 update visibility 문제가 크게 줄어든다.

### 15.8 NFS

`NFS(Network File System)`는 widely used client-server network file system이다. NFS는 remote files를 LAN 또는 WAN 너머에서 접근하기 위한 software system의 specification이자 implementation이다. 이 장은 주로 Solaris의 NFS Version 3 구현을 예로 설명하지만, 일반적 설명은 NFS specification에도 해당한다.

#### 15.8.1 Overview

NFS는 interconnected workstations를 independent file systems를 가진 independent machines의 집합으로 본다. 목표는 각 machine의 독립성을 유지하면서, explicit request가 있을 때 일부 file systems를 transparent하게 공유하는 것이다. 한 machine은 client이면서 동시에 server일 수 있고, sharing은 임의의 machine pair 사이에서 가능하다.

Remote directory를 local machine에서 transparent하게 접근하려면 client가 먼저 mount operation을 수행해야 한다. 이 operation은 remote directory를 local file system의 directory 위에 mount한다. Mount가 끝나면 mounted directory는 local file system의 integral subtree처럼 보이고, local directory는 새로 mounted directory의 root name이 된다. 단, mount operation 자체는 transparent하지 않다. Remote directory의 location 또는 host name을 명시해야 한다.

![Three independent file systems](@/assets/images/cs-operating-system-319-figure-15-6-page-744.png)
<p align="center"><sub>Figure 15.6 · PDF p. 744 · U, S1, S2 세 machine이 각각 독립 file systems를 가진 초기 상태</sub></p>

Figure 15.6에서는 U, S1, S2가 서로 독립된 file systems를 가진다. 이 상태에서는 각 machine의 local files만 접근 가능하다.

![Mounting in NFS](@/assets/images/cs-operating-system-320-figure-15-7-page-744.png)
<p align="center"><sub>Figure 15.7 · PDF p. 744 · S1의 remote directory를 U의 local path에 mount하고, 그 위에 S2를 cascading mount하는 NFS 예</sub></p>

Figure 15.7(a)는 `S1:/usr/shared`를 `U:/usr/local` 위에 mount한 결과다. U의 users는 `/usr/local/dir1` prefix로 S1의 remote files에 접근한다. 원래 U의 `/usr/local` subtree는 mount 동안 보이지 않는다. Figure 15.7(b)는 `S2:/usr/dir2`를 이미 remote mount된 `U:/usr/local/dir1` 위에 다시 mount하는 cascading mount를 보여 준다.

NFS mount의 중요한 특징은 transitivity가 없다는 점이다. Remote file system을 mount해도, 그 remote server 쪽에서 우연히 그 위에 mount되어 있던 다른 file systems까지 client가 자동으로 접근할 수 있는 것은 아니다. 각 machine은 자신이 직접 invoked한 mounts의 영향만 받는다. 이 성질 덕분에 client별 logical namespace가 독립적으로 유지된다.

NFS는 heterogeneous environment를 목표로 설계되었다. Different machines, operating systems, network architectures가 함께 동작해야 하므로 NFS specification은 media에 독립적이다. 이를 위해 NFS는 implementation-independent interfaces 사이에서 `RPC(Remote Procedure Call)` primitives와 `XDR(External Data Representation)` protocol을 사용한다.

NFS는 mount service와 actual remote-file-access service를 구분한다. 그래서 두 protocol이 따로 존재한다.

| Protocol | 역할 |
|---|---|
| `mount protocol` | server와 client 사이 initial logical connection을 만들고 remote directory를 mount하게 함 |
| `NFS protocol` | lookup, directory read, attributes, read/write 같은 실제 remote file operations 수행 |

#### 15.8.2 The Mount Protocol

`mount protocol`은 server와 client 사이의 initial logical connection을 설정한다. Solaris에서는 각 machine에 kernel 밖 server process가 있어 mount protocol functions를 수행한다.

Mount request에는 mounted될 remote directory name과 그 directory를 저장한 server machine name이 포함된다. Request는 RPC로 매핑되어 해당 server의 mount server로 전달된다. Server는 `export list`를 유지한다. Export list에는 mount를 허용하는 local file systems, mount할 수 있는 machine names, read-only 같은 access rights가 들어 있다. Solaris에서는 superuser만 수정할 수 있는 `/etc/dfs/dfstab`이 그 예다.

Server가 export list에 맞는 mount request를 받으면 client에게 `file handle`을 반환한다. 이 file handle은 이후 mounted file system 안의 files에 접근하는 key가 된다. UNIX 관점에서 file handle은 file-system identifier와 inode number를 포함해 exported file system 안의 정확한 mounted directory를 식별한다.

Server는 client machines와 currently mounted directories의 list도 유지한다. 이 list는 주로 administrative purpose, 예를 들어 server shutdown을 clients에게 알리는 데 쓰인다. Correct operation의 필수 state라기보다는 mount protocol 관리용 state다.

일반적으로 system은 boot time에 static mount preconfiguration을 가진다. Solaris의 `/etc/vfstab` 같은 파일이 예다. Mount protocol은 actual mount 외에도 unmount, return export list 같은 procedures를 포함한다.

#### 15.8.3 The NFS Protocol

`NFS protocol`은 remote file operations를 위한 RPC set을 제공한다. 대표 operations는 다음과 같다.

| Operation category | 예 |
|---|---|
| directory lookup | directory 안에서 file 검색 |
| directory read | directory entries 읽기 |
| link/directory manipulation | links와 directories 조작 |
| attributes | file attributes 접근 |
| file data I/O | files read/write |

이 procedures는 remotely mounted directory에 대한 file handle이 established된 뒤 호출될 수 있다.

NFS protocol에서 `open`과 `close` operations가 빠져 있는 것은 의도적이다. NFS Version 3 server는 `stateless`하다. Server는 client에 대한 state를 access 사이에 유지하지 않고, UNIX의 open-file table이나 file structures에 해당하는 server-side state가 없다. 따라서 각 request는 unique file identifier와 file 내부 absolute offset 등 operation에 필요한 full arguments를 제공해야 한다.

Stateless design은 robust하다. Server crash 후 특별한 복구 절차 없이도 다시 requests를 처리할 수 있기 때문이다. 이를 위해 file operations는 `idempotent`해야 한다. 같은 operation이 여러 번 수행되어도 한 번 수행한 것과 같은 effect를 가져야 한다. NFS request에는 sequence number가 있어 server가 duplicated request나 missing request를 판단할 수 있다.

Mount protocol의 client list는 statelessness와 모순처럼 보이지만, 이 list는 correct operation에 essential하지 않다. Server crash 후 복구할 필요가 없고, inconsistent data를 포함할 수 있는 hint로 취급된다.

Stateless server 철학은 write semantics에도 영향을 준다. RPC가 synchronous이므로, modified data와 metadata는 client에 result를 반환하기 전에 server disk에 commit되어야 한다. Client는 write blocks를 cache할 수 있지만, server로 flush하면 disk에 도달했다고 가정한다. 그래서 server는 NFS data를 synchronously write해야 한다. 이 덕분에 server crash/recovery가 client에게 invisible해질 수 있지만, caching advantage를 잃어 performance penalty가 크다.

성능 개선에는 nonvolatile cache가 있는 storage가 쓰일 수 있다. Disk controller가 battery-backed-up memory 같은 stable storage에 write를 저장한 뒤 acknowledge하면, host 입장에서는 매우 빠른 synchronous write처럼 보인다. Blocks는 crash 후에도 보존되고 나중에 disk에 주기적으로 기록된다.

NFS write procedure call 하나는 atomic하며 같은 file에 대한 다른 write calls와 intermix되지 않는다. 하지만 NFS protocol 자체는 concurrency-control mechanisms를 제공하지 않는다. 하나의 `write()` system call은 여러 RPC writes로 나뉠 수 있고, 두 users가 같은 remote file에 write하면 data가 intermix될 수 있다. Lock management는 inherently stateful하기 때문에 NFS 밖의 service가 제공해야 한다. Solaris는 별도 locking을 제공하며, users는 NFS scope 밖의 mechanisms로 shared files 접근을 조정해야 한다.

![NFS architecture](@/assets/images/cs-operating-system-321-figure-15-8-page-747.png)
<p align="center"><sub>Figure 15.8 · PDF p. 747 · client system call이 VFS, NFS client, RPC/XDR, server VFS, UNIX file system을 거쳐 처리되는 구조</sub></p>

Figure 15.8의 operation path는 다음과 같다.

| 단계 | 흐름 |
|---|---|
| 1 | Client가 regular system call을 호출한다. |
| 2 | OS layer가 call을 appropriate vnode에 대한 VFS operation으로 map한다. |
| 3 | VFS가 file을 remote로 식별하고 NFS procedure를 호출한다. |
| 4 | RPC/XDR을 통해 remote server의 NFS service layer로 call이 전달된다. |
| 5 | Server에서 call이 VFS layer로 다시 들어가고, server 입장에서는 local file이므로 local file-system operation을 호출한다. |
| 6 | 결과가 같은 path를 거슬러 client에게 반환된다. |

이 architecture의 장점은 client와 server 구조가 대칭적이라는 점이다. Machine은 client, server, 또는 둘 다가 될 수 있고, 실제 server service는 kernel threads가 수행한다.

#### 15.8.4 Path-Name Translation

NFS path-name translation은 `/usr/local/dir1/file.txt` 같은 path를 `usr`, `local`, `dir1`처럼 separate directory components로 나누고, 각 component에 대해 directory vnode와 component name pair를 대상으로 separate NFS lookup call을 수행한다.

Mount point를 지나면 모든 component lookup이 server로 separate RPC를 발생시킨다. 이는 비싸지만 필요한 방식이다. 각 client의 logical namespace는 그 client가 수행한 mounts에 따라 unique하기 때문이다. Server에게 전체 path name을 넘기고 target vnode를 한 번에 받는 것이 더 efficient해 보이지만, stateless server는 특정 client가 중간 path에 어떤 mount points를 가지고 있는지 모른다.

Client-side `directory-name-lookup cache`는 remote directory names에 대한 vnodes를 저장해 lookup 비용을 줄인다. 같은 initial path name을 가진 files를 반복 참조하면 cache가 효과적이다. Server가 반환한 attributes가 cached vnode attributes와 맞지 않으면 directory cache는 discard된다.

Cascading mount에서는 path-name traversal에 multiple servers가 관여할 수 있다. 다만 client가 server 쪽 directory를 lookup할 때, 그 server가 그 directory 위에 또 다른 file system을 mount해 두었더라도 client는 server의 mounted directory가 아니라 underlying directory를 본다. 이는 NFS mount가 client-local namespace decision이라는 점과 연결된다.

#### 15.8.5 Remote Operations

Open/close를 제외하면 regular UNIX file operations와 NFS protocol RPCs는 거의 one-to-one으로 대응한다. 따라서 remote file operation은 conceptually corresponding RPC로 직접 translate될 수 있다. 하지만 실제 구현은 성능 때문에 remote-service paradigm을 그대로 따르지 않고 buffering/caching을 사용한다.

NFS client는 file blocks와 file attributes를 RPC로 가져와 local cache한다. 이후 remote operations는 consistency constraints를 만족하는 범위에서 cached data를 사용한다. NFS에는 대표적으로 두 caches가 있다.

| Cache | 저장 내용 | 사용 조건 |
|---|---|---|
| `file-attribute cache` / inode-information cache | file attributes | open 시 server와 확인해 cached attributes를 fetch/revalidate |
| `file-blocks cache` | file data blocks | corresponding cached attributes가 up-to-date일 때만 사용 |

Attribute cache는 server에서 새 attributes가 올 때 update된다. 기본적으로 cached attributes는 일정 시간, 예를 들어 60 seconds 뒤 discard된다. Client-server 사이에는 `read-ahead`와 `delayed-write`도 사용된다. Clients는 delayed-write blocks를 server가 disk에 write했다고 confirm할 때까지 free하지 않는다.

이 caching은 performance를 높이지만 consistency semantics를 흐린다. Delayed-write는 같은 file이 conflicting modes로 concurrently open되어 있어도 유지될 수 있으므로 strict UNIX semantics는 보존되지 않는다. 새 file이 한 machine에서 생성되어도 다른 machine에 30 seconds 정도 보이지 않을 수 있고, 한 site의 writes가 다른 sites의 readers에게 언제 visible한지도 명확하지 않을 수 있다. New opens는 server로 이미 flushed된 changes만 observe한다.

따라서 NFS는 UNIX semantics를 엄격히 emulate하지도 않고, Andrew의 session semantics를 그대로 제공하지도 않는다. 그럼에도 utility와 good performance 때문에 NFS는 가장 널리 쓰이는 multi-vendor distributed file system 중 하나가 되었다.

### 15.9 Summary

General-purpose OS는 tmpfs/procfs 같은 special-purpose file systems부터 UFS/ZFS 같은 general-purpose file systems까지 여러 file-system types를 제공한다. File-system-containing volumes는 computer의 file-system space에 mount되어 processes가 접근할 수 있게 된다.

OS에 따라 file-system space는 seamless할 수도 있고 distinct할 수도 있다. UNIX 계열은 mounted file systems를 directory structure에 통합해 하나의 namespace처럼 보이게 한다. Windows의 drive letters처럼 각 mounted file system이 별도 designation을 갖는 구조도 있다.

System이 boot하려면 적어도 하나의 bootable file system이 필요하다. Boot loader는 먼저 실행되는 작은 program으로, file system 안의 kernel을 찾아 memory에 load하고 execution을 시작한다. 여러 bootable partitions가 있으면 administrator 또는 boot loader가 어떤 OS를 실행할지 선택할 수 있다.

Multi-user systems는 file sharing과 file protection을 제공해야 한다. Owner, user, group access permissions 같은 metadata가 file/directory attributes에 포함되고, OS는 request user/group IDs와 attributes를 비교해 operation을 allow/deny한다.

Mass storage partitions는 raw block I/O용으로 쓰이거나 file system을 담는 데 쓰인다. File system은 volume에 존재하며, volume은 하나의 partition일 수도 있고 volume manager가 묶은 multiple partitions일 수도 있다.

Multiple file systems를 단순하게 지원하기 위해 OS는 layered approach와 `VFS`를 사용한다. VFS는 dissimilar file systems를 같은 system-call interface 아래에서 seamless하게 접근하게 하며, local FS와 remote FS를 공통 구조로 연결한다.

Remote file systems는 `ftp`/web처럼 단순 transfer 방식으로 구현될 수도 있고, 더 기능적인 client-server model로 구현될 수도 있다. Client-server model에서는 mount requests와 user IDs를 authenticate해야 unapproved access를 막을 수 있다. DNS, NIS, Active Directory, LDAP 같은 distributed information systems는 naming, authentication, user/group information sharing을 돕는다.

File sharing이 가능해지면 concurrent access를 조정하기 위해 consistency semantics를 선택해야 한다. UNIX semantics는 single image와 immediate visibility를 강조하고, session semantics는 close 이후 future sessions에 changes를 보이게 하며, immutable-shared-files semantics는 shared files를 read-only로 discipline한다.

NFS는 remote file system의 대표 예다. NFS는 mount protocol과 NFS protocol, RPC/XDR, VFS integration, path-name translation, caching을 통해 remote directories/files/file systems를 client에게 seamless하게 제공한다. 다만 caching과 delayed writes 때문에 NFS consistency semantics는 strict UNIX semantics나 pure session semantics와 다르다.

## 연결 관계

- Chapter 13의 file interface와 protection은 Chapter 15에서 multi-user sharing, owner/group permissions, access checks로 확장된다.
- Chapter 14의 mount table, superblock, inode/FCB, recovery 개념은 Chapter 15의 mounting, VFS, remote FS implementation에서 다시 등장한다.
- Chapter 11의 storage partitions, RAID, boot blocks, raw disk 개념은 partitions and mounting, bootable file system, raw/cooked partitions의 기반이다.
- Chapter 12의 I/O path와 device drivers는 mount validation, block access, networked I/O를 실제 device/network operations로 연결한다.
- Chapter 6의 synchronization은 consistency semantics와 연결된다. 다만 file I/O는 disk/network latency가 크기 때문에 process synchronization처럼 강한 semantics를 그대로 적용하기 어렵다.
- Chapter 19의 distributed systems/networking은 remote file systems, DNS, RPC, NFS, failure modes, distributed naming services의 배경이다.

## 오해하기 쉬운 내용

- `mount`는 file을 여는 `open()`과 다르다. Mount는 file-system-containing volume을 namespace에 attach하는 작업이고, open은 그 namespace 안의 개별 file을 process가 사용하기 시작하는 작업이다.
- File system은 반드시 disk에만 있는 것이 아니다. `tmpfs`, `procfs`, `objfs`처럼 memory, process table, kernel symbols를 file-system interface로 보여 주는 special-purpose file systems도 있다.
- `partition`, `volume`, `file system`은 같은 말이 아니다. Partition은 device의 구획이고, volume은 file system을 담는 logical storage unit이며, file system은 directories/files/metadata 구조다.
- Remote mount는 transitive하지 않다. Server가 어떤 directory 위에 다른 file system을 mount해 두었다고 해서 client가 그 server-side mount를 자동으로 보는 것은 아니다.
- NFSv3의 stateless design은 단순성과 crash resilience를 주지만, security와 concurrency-control 측면에서는 한계가 있다.
- NFS에 `open`/`close` RPC가 없다고 해서 application이 open/close를 안 쓰는 것은 아니다. Application은 local system call을 사용하지만, NFS protocol은 statelessness 때문에 server-side open-file state를 유지하지 않는다.
- NFS caching은 성능을 높이지만 strict UNIX semantics를 깨뜨릴 수 있다. Delayed-write와 attribute cache 때문에 changes visibility가 즉시 보장되지 않는다.
- `consistency semantics`는 file contents가 “맞는지” 검사하는 fsck류 consistency checking과 다르다. 여기서는 shared file updates가 다른 users에게 언제 보이는지의 semantics를 뜻한다.

## 면접 질문

1. `partition`, `volume`, `file system`, `mount point`의 차이를 예시와 함께 설명하라.
2. OS가 mount operation에서 device directory를 검사하고 mount table을 갱신하는 이유를 설명하라.
3. UNIX에서 directory inode의 mount-point flag와 mount table entry, superblock pointer가 pathname traversal에 어떻게 사용되는지 설명하라.
4. Multi-user file sharing에서 `owner`, `group`, `user ID`, `group ID`가 access control에 어떻게 쓰이는지 설명하라.
5. VFS가 여러 local/remote file systems를 같은 system-call interface로 통합하는 원리를 설명하라.
6. Linux VFS의 `inode object`, `file object`, `superblock object`, `dentry object`가 각각 무엇을 표현하는지 말하라.
7. Remote file system에서 client authentication을 IP address/user ID에만 의존할 때 어떤 문제가 생기는지 설명하라.
8. Stateless DFS와 stateful DFS의 trade-off를 NFSv3/NFSv4와 연결해 설명하라.
9. UNIX semantics, session semantics, immutable-shared-files semantics의 write visibility 차이를 비교하라.
10. NFS에서 mount protocol과 NFS protocol이 왜 분리되어 있는지 설명하라.
11. NFS path-name translation이 component마다 RPC lookup을 수행해야 하는 이유를 stateless server와 client-local namespace 관점에서 설명하라.
12. NFS caching이 성능과 consistency semantics에 주는 trade-off를 설명하라.
