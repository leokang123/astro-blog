---
title: "Chapter 12. Physical Storage Systems"
order: 12
pubDatetime: 2026-05-17T00:12:00+09:00
modDatetime: 2026-05-17T00:12:00+09:00
description: "Database System Concepts 정리: Chapter 12. Physical Storage Systems"
tags:
  - "Database"
  - "CS"
---

## 개요

Database user는 logical level에서 table, relation, SQL만 보아도 되지만, DBMS 구현자는 결국 data를 physical storage에 저장하고 읽어야 한다. Chapter 12는 Chapter 13-16의 storage management, indexing, query processing, query optimization으로 내려가기 전, underlying storage media의 성질을 정리한다. 핵심은 storage hierarchy, disk/SSD의 access cost, reliability를 높이는 RAID, 그리고 disk block을 효율적으로 배치하고 접근하는 방법이다.

## 핵심 개념

- `primary storage`는 cache/main memory처럼 빠르지만 volatile하고 비싼 storage다.
- `secondary storage` 또는 `online storage`는 flash memory/SSD와 magnetic disk처럼 database가 장기 online data를 두는 non-volatile storage다.
- `tertiary storage` 또는 `offline storage`는 optical disk jukebox, magnetic tape처럼 느리지만 싸고 archival/backup에 적합한 storage다.
- `block-oriented interface`는 SSD/HDD가 data를 block 단위로 읽고 쓰게 하는 interface다.
- `SAN(storage area network)`은 remote storage를 server에 large reliable disk처럼 보이게 하고, `NAS(network attached storage)`는 remote storage를 network file system처럼 보이게 한다.
- `cloud storage`는 object storage에 적합하지만, database의 underlying storage로 쓰기에는 latency가 큰 경우가 많다.
- Magnetic disk의 `access time`은 주로 `seek time`과 `rotational latency time` 때문에 커지며, random I/O에서 병목이 된다.
- SSD는 `NAND flash`, `erase block`, `flash translation layer(FTL)`, `wear leveling`을 통해 disk-like logical interface를 제공한다.
- `RAID`는 `striping`으로 performance를 높이고 `mirroring` 또는 `parity`로 reliability를 높이는 disk organization이다.
- `disk-block access` 최적화는 buffering, read-ahead, disk-arm scheduling, file organization, non-volatile write buffer로 random I/O와 write latency를 줄인다.

## 세부 정리

### 12.1 Overview of Physical Storage Media

Storage medium은 보통 access speed, cost per unit data, reliability로 비교한다. Database는 logical abstraction을 제공하지만, 실제 성능과 durability는 physical medium의 특성에 크게 좌우된다.

| Storage medium | 핵심 성질 | Database 관점 |
|---|---|---|
| `cache` | 가장 빠르고 가장 비싸며 작음 | DBMS가 직접 관리하지 않지만 query processing algorithm 설계에서 cache effect를 고려 |
| `main memory` | CPU instruction이 직접 다루는 working storage, volatile | 많은 enterprise database는 fit 가능하지만 power failure/crash 시 내용 손실 |
| `flash memory` / `SSD` | non-volatile, HDD보다 빠르고 main memory보다 싸지만 HDD보다 비쌈 | block-oriented interface로 HDD처럼 사용 가능 |
| `magnetic disk` / `HDD` | non-volatile, 저렴한 large-capacity long-term online storage | access operation per second가 SSD보다 낮고 mechanical delay가 중요 |
| `optical storage` | DVD/Blu-ray 계열, laser로 read/write | backup에는 가능하지만 active database data에는 access time이 길어 부적합 |
| `magnetic tape` | sequential-access, 매우 저렴한 archival/backup medium | random access가 느려 online query용이 아니라 long-term archive와 large transfer에 적합 |

SSD는 내부적으로 flash memory를 쓰지만 외부에는 magnetic disk와 비슷한 `block-oriented interface`를 제공한다. 보통 512 bytes에서 8 kilobytes 단위 block으로 data를 저장/검색한다. HDD도 non-volatile이지만 data access 전 disk에서 main memory로 block을 옮겨야 하고, 수정된 data는 다시 disk에 써야 한다.

Tape는 `sequential-access storage`다. 원하는 data를 읽으려면 tape 시작부터 순차적으로 접근해야 하므로 수십~수백 초가 걸릴 수 있다. 반대로 magnetic disk와 SSD는 임의 위치를 읽을 수 있으므로 `direct-access storage`라고 부른다.

![Figure 12.1](@/assets/images/cs-database-175-figure-12-1-page-591.png)
*Figure 12.1 · PDF p. 591 · cache에서 magnetic tape까지 속도, 비용, volatile/non-volatile 특성이 달라지는 storage device hierarchy*

Figure 12.1의 storage hierarchy는 위로 갈수록 빠르고 비싸며, 아래로 갈수록 cost per bit는 낮지만 access time은 길어진다. Main memory 이상은 `volatile`이고, flash memory 이하의 storage는 `non-volatile`이다. 따라서 failure 후에도 보존되어야 하는 data는 반드시 non-volatile storage에 써야 하며, 이 durability 문제는 Chapter 19 recovery와 연결된다.

### 12.2 Storage Interfaces

Magnetic disk와 flash-based SSD는 high-speed interconnection으로 computer system에 연결된다. Disk 계열에는 `SATA(Serial ATA)`, server에서 많이 쓰는 `SAS(Serial Attached SCSI)`가 있고, SSD에는 `NVMe(Non-Volatile Memory Express)`가 PCIe와 함께 쓰인다. 여기서 중요한 점은 표준 이름 자체보다, storage interface가 achievable transfer rate와 latency, deployment architecture를 제한한다는 것이다.

Storage를 여러 server가 공유하는 방식은 크게 `SAN`, `NAS`, `cloud storage`로 구분할 수 있다.

| Interface/architecture | Server가 보는 abstraction | 특징 |
|---|---|---|
| `SAN(storage area network)` | 매우 크고 reliable한 logical disk | 다수 disk를 high-speed network로 여러 server에 연결, 보통 RAID로 local organization |
| `NAS(network attached storage)` | network file system | NFS, CIFS 같은 protocol로 file system interface 제공 |
| `cloud storage` | API로 접근하는 object storage | co-located되지 않으면 tens~hundreds ms latency가 가능해 DBMS underlying storage로는 조심 필요 |

SAN은 iSCSI, Fibre Channel, InfiniBand 같은 interconnection을 이용해 SCSI command나 high-bandwidth low-latency communication을 제공할 수 있다. NAS는 disk block이 아니라 file system interface를 제공한다는 점이 SAN과 다르다. Cloud storage는 application object 보관에는 유용하지만, database block access path에 직접 넣으면 latency가 성능 병목이 될 수 있다.

### 12.3 Magnetic Disks

`magnetic disk`는 modern computer system의 bulk secondary storage를 담당한다. SSD의 가격이 낮아지고 성능이 좋아졌지만, per-byte cost는 여전히 magnetic disk가 낮기 때문에 very large volume data, video/image data, less frequently accessed user-generated data에는 HDD가 계속 중요하다. 반대로 enterprise data처럼 latency와 IOPS가 더 중요한 workload는 SSD 쪽으로 이동하고 있다.

#### 12.3.1 Physical Characteristics of Disks

Magnetic disk는 여러 `platter`와 각 platter surface 위를 움직이는 `read-write head`로 구성된다. Platter 표면은 magnetic material로 덮여 있고, sector에는 magnetization direction reversal 형태로 bit가 기록된다.

![Figure 12.2](@/assets/images/cs-database-176-figure-12-2-page-593.png)
*Figure 12.2 · PDF p. 593 · track, sector, cylinder, platter, read-write head, arm assembly로 구성된 magnetic disk 구조*

Disk surface는 논리적으로 `track`으로 나뉘고, 각 track은 `sector`로 다시 나뉜다. `sector`는 disk가 read/write할 수 있는 가장 작은 physical information unit이며, 전통적으로 512 bytes가 흔하다. Inner track은 circumference가 작으므로 `outer tracks`보다 sector 수가 적다. 따라서 outer tracks만 사용하면 capacity를 일부 포기하는 대신 higher transfer rate와 더 균일한 access performance를 얻을 수 있다.

여러 platter의 같은 번호 track을 묶은 것이 `cylinder`다. 모든 head가 하나의 `disk arm` assembly에 붙어 함께 움직이기 때문에, 한 platter의 i번째 track 위에 head가 있으면 다른 platter의 head도 각자의 i번째 track 위에 있다. 따라서 같은 cylinder 안의 data는 arm movement 없이 다른 head/surface를 통해 접근할 수 있다.

Disk reliability와 관련해 중요한 hardware 기능은 두 가지다.

| 기능 | 의미 |
|---|---|
| `checksum` | sector write 시 data에서 checksum을 계산해 함께 저장하고, read 시 다시 계산해 corruption 여부를 높은 확률로 감지 |
| `bad sector remapping` | format/write 중 손상 sector를 감지하면 spare sector pool의 다른 physical location으로 logical sector를 mapping |

Read failure가 감지되면 disk controller는 read를 여러 번 retry하고, 계속 실패하면 failure를 보고한다. `bad sector remapping`은 DBMS가 보는 logical sector address를 유지하면서 물리 위치를 바꾸므로, storage device 내부에서 오류를 숨기고 사용 가능한 수명을 늘리는 역할을 한다.

#### 12.3.2 Performance Measures of Disks

Disk 품질을 나타내는 주요 measure는 `capacity`, `access time`, `data-transfer rate`, `reliability`다. Database 성능에서는 특히 random access와 sequential access의 차이가 크다.

Disk read/write request가 들어오면 data transfer가 바로 시작되지 않는다. 먼저 arm이 target track으로 이동하고, 그 다음 target sector가 head 아래로 회전해 올 때까지 기다린다.

| 구성 요소 | 설명 |
|---|---|
| `seek time` | disk arm이 target track으로 repositioning되는 시간 |
| `rotational latency time` | target sector가 read-write head 아래에 올 때까지 기다리는 시간 |
| `access time` | data transfer가 시작되기 전까지의 시간, 대략 seek time + rotational latency |
| `data-transfer rate` | transfer가 시작된 뒤 disk와 main memory 사이에서 data가 이동하는 속도 |

평균 rotational latency는 보통 한 바퀴 회전 시간의 절반이다. 예를 들어 rotation speed가 높을수록 latency가 줄어든다. Access time은 평균적으로 수 ms에서 수십 ms 수준이고, 이는 CPU/main memory 시간과 비교하면 매우 크다. 그래서 DBMS는 random disk I/O 횟수를 줄이는 데 많은 최적화를 집중한다.

Database와 file system은 disk address를 보통 `block number`로 다룬다. `disk block`은 storage allocation/retrieval의 logical unit이고, 현대 system에서는 보통 4-16 KB 정도다. Data는 disk와 main memory 사이에서 block 단위로 이동한다. `page`라는 말도 block과 비슷하게 쓰이지만, flash memory 같은 문맥에서는 page와 block이 서로 다른 의미일 수 있다.

Access pattern 차이는 다음처럼 성능 차이를 만든다.

| Access pattern | 특징 | 성능 영향 |
|---|---|---|
| `sequential access pattern` | 연속 block 또는 인접 track의 block을 차례로 요청 | 첫 seek 이후 arm movement가 적어 transfer rate가 높음 |
| `random access pattern` | 요청 block들이 disk 곳곳에 흩어짐 | 각 request마다 seek가 필요해 IOPS가 낮음 |

`IOPS(input/output operations per second)`는 초당 random block access 수를 나타낸다. HDD에서는 mechanical seek/rotation 때문에 4 KB random I/O가 수십~수백 IOPS 수준으로 제한될 수 있다. Sequential scan은 seek overhead가 amortize되므로 훨씬 높은 effective throughput을 얻는다.

`MTTF(mean time to failure)`는 disk가 failure 없이 continuous run할 것으로 기대되는 평균 시간이다. Vendor 수치가 수십~백 년처럼 보이더라도 “그 disk가 100년 넘게 동작한다”는 뜻이 아니다. 많은 relatively new disks 중 평균적으로 어느 정도 빈도로 failure가 발생하는지의 통계적 표현이며, 실제 disk life span은 보통 몇 년이고 aging에 따라 failure rate가 올라간다. `MTBF(mean time between failures)`라는 용어가 disk drive 문맥에서 쓰이기도 하지만, 엄밀히는 repair 후 다시 fail할 수 있는 system에 더 적합하다.

### 12.4 Flash Memory

Flash memory에는 `NOR flash`와 `NAND flash`가 있고, data storage에는 주로 NAND flash가 쓰인다. NAND flash는 read 시 보통 4096 bytes 같은 `page` 단위로 main memory에 가져온다. 이 점에서 NAND flash page는 magnetic disk sector와 비슷하다.

SSD는 NAND flash로 만들어지지만 외부에는 disk와 같은 `block-oriented interface`를 제공한다. Magnetic disk 대비 SSD의 핵심 장점은 mechanical seek/rotation이 없다는 것이다.

| Measure | Magnetic disk | SSD / NAND flash |
|---|---|---|
| random read latency | ms 단위 | microseconds 단위 |
| transfer rate | disk mechanics와 track 위치 영향 | SATA/NVMe/PCIe interconnect가 주로 제한 |
| power consumption | motor/arm 등 mechanical part 존재 | 일반적으로 더 낮음 |
| update behavior | sector overwrite 가능 | page direct overwrite 불가, erase block 단위 erase 필요 |

Flash write는 read보다 복잡하다. Page write 자체는 빠르지만, 이미 쓴 page는 직접 overwrite할 수 없다. 먼저 여러 page를 묶은 `erase block` 전체를 erase해야 하고, erase는 ms 단위로 느리며, 각 physical page에는 erase 횟수 제한이 있다.

이 제약을 숨기기 위해 SSD는 logical page number를 physical page number로 mapping한다. Logical page update가 발생하면 이미 erase된 다른 physical page에 새 version을 쓰고, 기존 physical page는 deleted로 표시한다. Deleted page가 많아진 erase block은 남아 있는 nondeleted page를 다른 block으로 복사한 뒤 나중에 erase한다. 이런 mapping과 garbage collection은 `flash translation layer(FTL)`이 수행하며, 빠른 lookup을 위해 in-memory `flash translation table`을 둔다.

`wear leveling`은 erase operation을 physical block 전체에 고르게 분산하는 원리다. Erase 횟수가 많은 page에는 rarely updated `cold data`를, erase 횟수가 적은 page에는 frequently updated `hot data`를 배치해 특정 block만 빨리 닳는 것을 피한다. 이 덕분에 file system과 DBMS는 SSD를 logical block device로 보지만, 내부에서는 flash 특성에 맞는 remapping이 계속 일어난다.

`storage class memory`는 NAND flash보다 main memory에 가까운 byte/word-level direct access를 제공하는 non-volatile memory 계열을 가리킨다. 핵심 위치는 cost, latency, capacity 면에서 main memory와 flash memory 사이이며, page read/write와 erase overhead를 줄일 수 있다는 점이다.

SSD performance는 보통 4 KB random block read/write IOPS, sequential read/write transfer rate, 그리고 `queue depth(QD)`에 따른 parallel request 처리량으로 표현된다. Magnetic disk와 달리 SSD는 multiple random requests를 parallel하게 처리할 수 있으므로 QD-1과 QD-32 수치가 크게 다를 수 있다. Hybrid disk drive나 SAN/NAS system은 magnetic disk 위에 SSD를 cache로 두어 frequently accessed, rarely updated data를 빠르게 제공하기도 한다.

### 12.5 RAID

대용량 web/database/multimedia application은 많은 disk를 필요로 한다. Disk가 많아지면 parallel read/write로 performance를 높일 기회가 생기지만, 동시에 “어느 하나의 disk라도 fail할 확률”도 커진다. `RAID(redundant arrays of independent disks)`는 여러 disk를 조직해 performance와 reliability를 함께 개선하려는 기법들의 총칭이다.

RAID의 `I`는 현재 `independent`를 뜻한다. 초기에는 cheap small disk를 묶어 expensive large disk를 대체한다는 의미에서 `inexpensive`였지만, 지금은 cost 절감보다 reliability, performance, manageability가 더 중요한 이유다.

#### 12.5.1 Improvement of Reliability via Redundancy

Disk N개를 쓰면 특정 disk 하나가 fail할 확률보다 “N개 중 하나라도 fail할 확률”이 훨씬 크다. 예를 들어 single disk MTTF가 100,000 hours라면 100 disks array에서 어떤 disk 하나가 fail할 평균 시간은 대략 1,000 hours가 된다. Data copy가 하나뿐이면 이런 failure frequency는 database에 치명적이다.

해결책은 `redundancy`다. 평소에는 필요 없지만 disk failure 시 lost information을 rebuild할 수 있는 extra information을 저장한다. 가장 단순한 방식은 모든 disk를 duplicate하는 `mirroring` 또는 `shadowing`이다. Logical disk 하나가 two physical disks로 구성되고, every write는 두 disk 모두에 수행된다. 하나가 fail하면 다른 copy에서 읽을 수 있다.

Mirroring의 reliability는 single-disk MTTF뿐 아니라 `mean time to repair`에 의존한다. 두 disk failure가 독립이라고 가정하면 mirrored disk의 mean time to data loss는 매우 커질 수 있다. 다만 실제로는 power failure, natural disaster, aging 같은 common-cause failure가 있어 independence assumption이 완전히 성립하지 않는다.

Mirroring에서도 power failure 중 write가 진행 중이면 두 copy가 inconsistent할 수 있다. 이를 줄이려면 한 copy를 먼저 완전히 쓰고, 다음 copy를 쓰는 방식처럼 항상 하나의 consistent copy가 남도록 write order를 관리해야 한다. 이 문제는 recovery와 연결되며 Chapter 19의 failure/recovery 논의와 이어진다.

#### 12.5.2 Improvement in Performance via Parallelism

Multiple disks는 reliability뿐 아니라 performance도 개선한다.

| 기법 | 효과 |
|---|---|
| mirroring | read request를 둘 중 한 disk로 보낼 수 있어 read throughput 증가 |
| `bit-level striping` | byte의 bit를 여러 disk에 나누어 저장, 한 access에서 여러 disk가 동시에 참여 |
| `block-level striping` | logical block을 disk들에 round-robin 배치, practical system에서 사용 |

`block-level striping`은 n개 disk array에서 logical block `i`를 disk `(i mod n) + 1`에 저장하고, 그 disk의 `⌊i/n⌋`번째 physical block을 사용한다. 큰 file을 읽을 때 n개 block을 병렬로 가져와 transfer rate를 높일 수 있고, single block read에서는 하나의 disk만 쓰므로 나머지 disk가 다른 request를 처리할 수 있다. 이 때문에 bit-level striping보다 latency와 small random read throughput 면에서 실용적이다.

Disk parallelism의 목적은 두 가지다.

1. 여러 small block access를 load-balance해 throughput을 높인다.
2. Large access를 parallelize해 response time을 줄인다.

#### 12.5.3 RAID Levels

Mirroring은 reliable하지만 storage cost가 크고, striping은 fast하지만 reliability를 높이지 않는다. RAID levels는 striping과 `parity block` 또는 additional redundancy를 결합해 서로 다른 cost-performance-reliability trade-off를 만든다.

Parity block의 i번째 bit는 같은 set 안의 data block들의 i번째 bit를 `exclusive OR(XOR)`한 값이다. 한 block이 fail하면 나머지 block들과 parity block의 bitwise XOR로 lost block을 recover할 수 있다. Block write가 일어나면 해당 set의 parity도 recompute/write해야 하므로 write overhead가 생긴다.

![Figure 12.4](@/assets/images/cs-database-178-figure-12-4-page-602.png)
*Figure 12.4 · PDF p. 602 · RAID 0, RAID 1, RAID 5, RAID 6의 striping, mirroring, distributed parity, P+Q redundancy 차이*

실제로 중요한 RAID level은 다음과 같다.

| RAID level | 구조 | 장점 | 약점/주의 |
|---|---|---|---|
| `RAID 0` | block-level striping, no redundancy | performance와 capacity 활용 | disk failure 시 data loss, 안전성 없음 |
| `RAID 1` / `RAID 10` | mirroring with striping | 높은 reliability, 좋은 read/write performance | storage overhead 큼 |
| `RAID 5` | block-interleaved distributed parity | storage overhead가 RAID 1보다 낮고 read parallelism 가능 | small write 시 parity update overhead, single disk failure까지만 보호 |
| `RAID 6` | P+Q redundancy, error-correcting codes | two disk failures까지 tolerance | redundancy/write overhead 증가 |

`RAID 5`는 N+1 disks 중 N개 logical blocks마다 하나의 disk에 parity block을 저장하되, parity block 위치를 set마다 다른 disk로 분산한다. RAID 4처럼 parity disk 하나에 몰아두면 그 disk가 read에는 기여하지 못하고 write bottleneck이 되기 때문이다. Parity block은 같은 disk의 data block을 보호할 수 없으므로, 한 set의 data와 parity는 서로 다른 disk에 있어야 한다.

`RAID 6`은 RAID 5와 비슷하지만 추가 redundant information을 저장해 multiple disk failures에 대비한다. P와 Q 두 종류의 error-correcting block을 두어, RAID 5보다 더 높은 failure tolerance를 얻는 대신 storage와 write cost가 증가한다.

#### 12.5.4 Hardware Issues

RAID는 software만으로도 구현할 수 있지만, `hardware RAID`는 reliability와 recovery 면에서 이점이 크다. Hardware RAID는 `non-volatile RAM`에 write intent나 incomplete write 정보를 기록해 power failure 후 재시작 시 unfinished write를 완료할 수 있다.

`software RAID`는 power failure 전에 partial write가 있었는지 찾아야 하므로 restart 후 추가 scan이 필요하다. RAID 1에서는 mirrored pair block content를 비교하고, RAID 5에서는 block set마다 parity를 recompute해 stored parity와 비교한다. 이 background phase를 `resynchronizing(resynching)`이라고 한다. Resync 중에도 normal read/write는 가능하지만, 그 사이 또 disk failure가 나면 incomplete write가 남은 block에서 data loss 위험이 커질 수 있다.

Disk에 과거 성공적으로 쓴 sector가 나중에 unreadable해지는 현상은 `latent failure` 또는 `bit rot`이라고 부른다. 이런 failure가 감지되지 않은 채 다른 disk가 fail하면 RAID redundancy로도 data loss가 생길 수 있다. 좋은 RAID controller는 idle period에 모든 sector를 읽어 unreadable sector를 조기에 찾고, RAID redundancy로 복구해 다시 써 두는 `scrubbing`을 수행한다.

운영 측면에서는 `hot swapping`이 중요하다. Faulty disk를 system power off 없이 교체할 수 있으면 `mean time to repair`가 줄고, rebuild가 빨리 시작된다. Spare disk를 미리 두면 disk failure 직후 spare가 replacement로 사용되어 data reconstruction이 시작된다. 또한 RAID system 자체의 power supply, controller, interconnection이 `single point of failure`가 되지 않도록 redundant power supply, battery backup, multiple disk interfaces, multiple interconnections를 둔다.

#### 12.5.5 Choice of RAID Level

RAID level 선택은 다음 요소를 함께 본다.

| 기준 | 질문 |
|---|---|
| extra disk-storage monetary cost | redundancy 때문에 필요한 추가 disk 비용을 감당할 수 있는가 |
| IOPS requirement | small random I/O를 얼마나 많이 처리해야 하는가 |
| degraded-mode performance | disk 하나가 fail한 동안 성능이 얼마나 떨어지는가 |
| rebuild performance | failed disk data를 새 disk에 rebuild하는 동안 availability와 risk를 감당할 수 있는가 |

Rebuild time은 repair time의 큰 부분이 될 수 있으므로 mean time to data loss에도 영향을 준다. RAID 1은 surviving mirror에서 copy하면 되므로 rebuild가 비교적 쉽고, RAID 5/6은 다른 모든 disk의 data/parity를 읽어 계산해야 하므로 rebuild 중 load와 risk가 커진다.

RAID level별 선택 감각은 다음과 같다.

| 상황 | 적합한 선택 |
|---|---|
| data safety가 중요하지 않고 raw performance만 필요한 일부 workload | `RAID 0` |
| database log file처럼 high random I/O와 write performance가 중요한 workload | `RAID 1` 또는 `RAID 10` |
| read frequently, write rarely이고 storage overhead를 줄이고 싶은 workload | `RAID 5` |
| latent sector failure와 two disk failure까지 고려해야 하는 high-safety workload | `RAID 6` |

`RAID 5` random write는 overhead가 크다. Single random block write를 하려면 old data block과 old parity block을 읽고, new data block과 new parity block을 써야 하므로 `2 block reads + 2 block writes`가 필요하다. 반면 large sequential write에서는 새 data blocks로 parity를 계산할 수 있어 read overhead가 줄어든다.

`RAID 6`은 정상 operation 성능은 RAID 5와 비슷하지만 storage cost가 더 크고, two disk failures를 견딘다. 특히 `latent sector failure`가 발견되지 않은 상태에서 다른 disk가 fail하면 RAID 1/5에서는 해당 sector data loss가 가능하다. RAID 6은 이런 상황을 two-disk failure처럼 견딜 수 있어 data safety가 중요한 환경에서 더 매력적이다.

Array design에서도 trade-off가 있다. Disk를 많이 묶으면 transfer rate는 높아질 수 있지만 cost가 커지고, parity 하나가 보호하는 bit가 많을수록 parity overhead는 줄지만 repair 전에 second failure가 발생할 위험이 커진다.

#### 12.5.6 Other RAID Applications

RAID 개념은 HDD array에만 국한되지 않는다. SSD 내부 flash page, tape array, wireless broadcast에도 같은 원리가 적용된다. Flash page는 magnetic disk sector보다 data loss rate가 높을 수 있으므로 SSD는 내부적으로 RAID-like redundancy를 사용해 flash page loss로부터 data를 보호한다. Tape array에서는 tape 하나가 damaged되어도 data recovery가 가능하고, broadcast에서는 data block을 여러 unit과 parity unit으로 보내 일부 unit을 받지 못해도 재구성할 수 있다.

### 12.6 Disk-Block Access

Disk I/O request는 DBMS, 특히 query processing subsystem에서 많이 발생한다. Request는 disk identifier와 logical block number, 또는 OS file에 database data가 저장된 경우 file identifier와 file 내 block number를 지정한다. Data transfer는 block 단위로 일어난다.

Disk-block access 최적화의 목표는 access 횟수, 특히 `random access` 횟수를 줄이는 것이다. Magnetic disk에서는 random access가 seek/rotation 때문에 매우 비싸다. SSD는 random access가 훨씬 빠르지만, 여전히 buffering이나 read-ahead 같은 기법의 이득을 볼 수 있다.

| Technique | 핵심 아이디어 | 효과/주의 |
|---|---|---|
| `buffering` | disk에서 읽은 block을 in-memory buffer에 임시 저장 | future request를 memory에서 처리, Chapter 13 database buffer와 연결 |
| `read-ahead` / prefetching | 요청된 block 주변의 consecutive blocks를 미리 읽음 | sequential access에 유리, random access에는 별 이득 없음 |
| `disk-arm scheduling` | 여러 request를 arm movement가 적은 순서로 재배열 | HDD에서 seek time 감소 |
| `elevator algorithm` | arm이 한 방향으로 움직이며 요청 track을 처리하고, 더 이상 요청이 없으면 반대 방향으로 전환 | 요청 starvation을 줄이면서 movement를 줄임 |
| `file organization` | 예상 access pattern에 맞게 blocks를 배치 | sequential file은 adjacent cylinders/consecutive logical blocks에 배치 |
| `extent` allocation | file에 여러 consecutive blocks를 한 번에 할당 | one seek per extent로 sequential scan cost 감소 |
| `defragmenting` | 흩어진 file blocks를 다시 contiguous하게 재배치 | fragmented sequential file의 scan 성능 회복 |
| `non-volatile write buffer` / `NVRAM` | write를 non-volatile buffer에 먼저 기록하고 완료 응답 | disk arm movement를 줄이도록 나중에 reorder 가능 |

`read-ahead`는 sequential access에서 특히 유용하다. 첫 block을 읽을 때 같은 track의 consecutive blocks도 memory buffer로 가져오면, 다음 요청이 이미 memory에 있어 seek/rotational latency 낭비가 줄어든다. OS도 file의 consecutive blocks에 대해 read-ahead를 수행한다.

`disk-arm scheduling`은 여러 pending request를 disk head와 platter 위치에 맞춰 재정렬한다. `elevator algorithm`은 elevator처럼 한 방향으로 이동하며 해당 방향의 요청을 처리하다가 더 이상 요청이 없으면 방향을 바꾼다. 실제로 disk controller가 block layout, rotational position, arm position을 잘 알기 때문에 read request reordering을 수행하는 경우가 많다. 이를 위해 controller interface는 multiple requests queue와 out-of-order result return을 허용해야 한다.

`file organization`은 예상 access pattern과 physical/logical block 배치를 맞추는 문제다. Modern disk는 정확한 physical location을 숨기지만, adjacent blocks에 consecutive logical block number를 부여한다. OS는 file의 consecutive blocks를 consecutive disk block number에 배치해 sequential access를 빠르게 한다.

Large file 전체를 하나의 긴 consecutive block sequence로 유지하기는 어렵기 때문에, OS는 보통 `extent` 단위로 file에 consecutive blocks를 할당한다. Extent끼리는 떨어져 있을 수 있지만, 충분히 큰 extent를 쓰면 sequential scan이 one seek per extent 정도로 줄어든다. 시간이 지나 append가 반복되면 file이 `fragmented`되어 blocks가 disk 곳곳에 흩어질 수 있고, backup/restore 또는 defragmentation utility로 다시 contiguous하게 만들 수 있다.

`non-volatile write buffer`는 update-intensive database에서 중요하다. DBMS recovery algorithm은 write order에 의존할 수 있으므로, volatile memory에만 write를 받아 두고 disk write를 reorder하면 crash 시 database state가 inconsistent해질 수 있다. NVRAM은 power failure 후에도 내용이 남기 때문에, disk controller가 block을 NVRAM buffer에 기록한 뒤 write complete를 응답하고, 나중에 elevator algorithm 등으로 disk write를 효율적으로 재정렬할 수 있다. Crash recovery 시 pending buffered writes를 disk에 반영하면 된다.

일부 system은 update log를 별도 `log disk`에 sequential하게 기록해 random data-page write와 분리한다. Log는 append 중심이라 sequential access pattern을 만들기 쉽고, recovery가 요구하는 write ordering을 더 단순하게 유지할 수 있다.

### 12.7 Summary

Chapter 12의 핵심은 “logical database operation의 비용은 physical storage의 access pattern에서 결정된다”는 점이다.

- Storage medium은 speed, cost per data unit, reliability, volatility로 비교된다.
- Magnetic disk는 mechanical seek와 rotational latency 때문에 random access latency가 크다.
- SSD는 latency와 transfer bandwidth가 HDD보다 좋지만 cost per byte가 높고, erase block/write limit/FTL/wear leveling 같은 내부 제약이 있다.
- RAID는 striping으로 throughput을 높이고 redundancy로 data loss 가능성을 낮춘다.
- RAID level은 cost, random write overhead, degraded-mode performance, rebuild risk, failure tolerance를 함께 고려해 선택한다.
- Disk-block access 최적화는 buffering, read-ahead, scheduling, file organization, extent, defragmenting, non-volatile write buffer로 random I/O와 arm movement를 줄이는 방향이다.

## 연결 관계

- Chapter 11의 data warehouse와 analytics workload는 large sequential scan, aggregate, column-oriented layout, SSD/HDD tiering의 영향을 크게 받는다.
- Chapter 13은 Chapter 12의 physical block 위에 record, file, buffer, column-oriented storage를 어떻게 배치하는지 다룬다. 특히 `database buffer`는 12.6의 buffering을 DBMS 내부 정책으로 확장한다.
- Chapter 14의 index는 random block access를 줄이기 위한 상위 구조다. Index lookup이 빠르려면 disk/SSD의 random I/O 비용을 이해해야 한다.
- Chapter 15 query processing은 sequential scan, external sort, join algorithm에서 block access pattern을 최적화한다.
- Chapter 19 recovery는 non-volatile storage, atomic block write, write ordering, NVRAM, RAID partial write 문제와 직접 연결된다.
- Chapter 21 distributed/cloud storage 논의에서는 SAN/NAS/cloud storage, multiple machine replication, RAID와 distributed file system redundancy의 차이가 다시 등장한다.

## 오해하기 쉬운 내용

- `non-volatile`은 “절대 고장 나지 않는다”가 아니다. Power failure 후 data가 남는다는 뜻이며, disk/SSD 자체 failure와 bit rot은 별도 문제다.
- `MTTF`가 100년이라고 해서 한 disk를 100년 쓸 수 있다는 뜻이 아니다. 많은 disk 집단의 failure rate를 표현하는 통계다.
- SSD는 random access가 빠르지만 write가 단순 overwrite는 아니다. Page write, erase block, FTL, wear leveling 때문에 내부 write amplification이 생길 수 있다.
- `block`과 `page`는 문맥에 따라 거의 같은 뜻으로도 쓰이지만, flash memory에서는 page와 erase block이 구분된다.
- `RAID 0`은 RAID라는 이름이 붙어도 redundancy가 없다. Disk failure 시 data loss가 발생한다.
- `RAID 5`는 storage overhead가 낮지만 random write가 비싸다. Single block update에 old data/parity read와 new data/parity write가 필요하다.
- RAID는 backup을 대체하지 않는다. RAID는 disk failure tolerance를 높이지만, user mistake, software corruption, disaster, logical data corruption까지 자동으로 해결하지는 않는다.
- `read-ahead`는 sequential access에 강하지만 random access에서는 불필요한 block을 읽어 오히려 낭비가 될 수 있다.
- Large file을 완전히 contiguous하게 유지하는 것은 이상적이지만 현실적으로 어렵다. 그래서 OS는 `extent` 단위 allocation으로 seek 수를 줄이는 절충을 쓴다.
- Write reordering은 성능에는 좋지만, volatile buffer만 쓰면 crash 후 write ordering assumption이 깨질 수 있다. 그래서 `NVRAM` 또는 recovery protocol과 함께 생각해야 한다.

## 면접 질문

1. `primary storage`, `secondary storage`, `tertiary storage`의 차이를 speed, cost, volatility 관점에서 설명해 보라.
2. Magnetic disk에서 `seek time`, `rotational latency time`, `data-transfer rate`, `IOPS`가 각각 무엇을 의미하는가?
3. Sequential access와 random access가 HDD에서 성능 차이가 큰 이유는 무엇이며, SSD에서는 왜 차이가 줄어드는가?
4. NAND flash에서 page overwrite가 직접 불가능한 이유와 `erase block`, `flash translation layer(FTL)`, `wear leveling`의 역할을 설명해 보라.
5. `SAN`, `NAS`, `cloud storage`는 server에 어떤 abstraction을 제공하는가?
6. `RAID 0`, `RAID 1/10`, `RAID 5`, `RAID 6`의 reliability, write overhead, storage overhead를 비교해 보라.
7. RAID 5에서 single random block write가 왜 `2 block reads + 2 block writes`를 요구하는가?
8. `latent failure(bit rot)`가 RAID 5에서 왜 위험하고, `scrubbing`과 RAID 6은 이를 어떻게 완화하는가?
9. `hot swapping`, spare disk, rebuild performance가 mean time to data loss에 어떤 영향을 주는가?
10. Disk-block access 최적화 기법인 `buffering`, `read-ahead`, `disk-arm scheduling`, `elevator algorithm`, `extent`, `NVRAM write buffer`를 각각 설명해 보라.
