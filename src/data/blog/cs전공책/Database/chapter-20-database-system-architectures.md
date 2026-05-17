---
title: "Chapter 20. Database-System Architectures"
order: 20
pubDatetime: 2026-05-18T00:00:00+09:00
modDatetime: 2026-05-18T00:00:00+09:00
description: "Database System Concepts 정리: Chapter 20. Database-System Architectures"
tags:
  - "Database"
  - "CS"
---

## 개요

Database-system architecture는 DBMS가 어떤 hardware, memory, network, deployment model 위에서 실행되는지에 따라 달라진다. 이 장은 Chapter 21-23으로 이어지는 Part Eight의 입구이며, centralized database, server system architecture, parallel system, distributed system, parallel/distributed transaction processing, cloud-based service를 한 번에 배치한다.

핵심 질문은 “데이터와 computation을 어디에 두고, 어떤 단위로 나누며, 네트워크와 failure를 어떻게 견딜 것인가”다. Centralized database는 한 machine 안에서 throughput을 높이는 문제를 다루고, parallel database는 많은 node를 묶어 speedup/scaleup을 얻으려 하며, distributed database는 지리적으로 떨어진 site와 독립 운영, failure tolerance를 다룬다. Cloud-based service는 이런 구조를 service model로 제공한다.

## 핵심 개념

- `centralized database system`은 단일 computer system에서 실행되는 DBMS다. 단일 사용자의 embedded database부터 여러 CPU core, disk, memory를 가진 enterprise server까지 포함한다.
- `transaction-server architecture`는 client가 SQL/query/API request를 보내고 server가 transaction을 실행한 뒤 결과를 반환하는 구조다.
- `data-server architecture`는 client가 page, tuple, object, file 같은 data item을 읽고 update하도록 server가 data access interface를 제공하는 구조다.
- `shared memory` 기반 transaction server는 buffer pool, lock table, log buffer, query plan cache를 여러 process/thread가 공유한다.
- `latch`, `mutex`, `semaphore`, `test-and-set`, `compare-and-swap`은 DBMS 내부 shared structure를 보호하는 짧은 mutual exclusion mechanism이다.
- Client-server 환경에서는 network latency가 local memory reference보다 훨씬 크므로 `prefetching`, `data caching`, `lock caching`, `adaptive lock granularity`가 중요하다.

## 세부 정리

### 20.1 Overview

초기의 database는 multitasking을 지원하는 단일 physical machine 위에서 동작했다. 이런 `centralized database system`은 여전히 널리 쓰이며, 규모는 mobile/personal use부터 수천 user와 수백 GB database를 다루는 enterprise-scale application까지 넓다.

`parallel database system`은 1980년대 후반부터 많은 machine에서 task를 병렬 실행하기 위해 발전했다. 중앙 집중형 DB가 transaction throughput, decision-support query latency, storage capacity 요구를 감당하지 못할 때, 수백 machine으로 query와 transaction 처리를 나누는 접근이다. 최근에는 enterprise뿐 아니라 millions 또는 hundreds of millions of users와 petabytes of data를 다루는 web-scale application이 parallel database의 주요 동기가 된다.

`parallel data storage system`은 key 기반 저장/조회에 집중한다. Parallel database와 달리 transaction 지원이 제한적이고 declarative querying도 약하지만, thousands 또는 tens of thousands of machines까지 확장될 수 있다. 즉 “DBMS 기능의 풍부함”과 “극단적 scale” 사이의 trade-off가 있다.

`distributed database system`은 서로 다른 database system에 생성·저장된 데이터를 대상으로 query와 update transaction을 수행해야 하는 요구에서 발전했다. Distributed database에서 개발된 fault tolerance technique은 오늘날 massively parallel database와 data storage system의 high reliability/high availability에도 핵심 역할을 한다.

이 장의 위치는 다음과 같다.

| 장 | 역할 |
|---|---|
| Chapter 20 | architecture의 큰 그림: centralized, server, parallel, distributed, cloud |
| Chapter 21 | parallel/distributed data storage와 indexing |
| Chapter 22 | parallel/distributed query processing |
| Chapter 23 | parallel/distributed transaction processing |

### 20.2 Centralized Database Systems

`centralized database system`은 단일 computer system에서 실행되는 database system이다. 단일 mobile device나 personal computer의 single-user database부터, multiple CPU cores, multiple disks, large main memory를 가진 server 기반 multiuser database까지 포함한다.

Single-user system과 multiuser system의 차이는 DBMS 기능 선택에 직접 영향을 준다.

| 구분 | 전형적 환경 | DBMS 특성 |
|---|---|---|
| `single-user system` | smartphone, personal computer, 보통 한 사용자와 소수 disk | highly concurrent access 가능성이 낮아 concurrency control이 단순할 수 있고, crash recovery도 copy-before-update 수준이거나 없을 수 있다. SQL 대신 application API만 제공하기도 한다. |
| `multiuser system` | large memory, multiple disks, multiple processors를 가진 server | 많은 remote user를 처리하므로 full transaction feature, SQL/API request handling, concurrency control, recovery가 필요하다. |

Single-user system용 database는 보통 application program에 link되어 그 application에서만 접근되므로 `embedded database`라고 부른다. 반면 multiuser database는 application program으로부터 SQL query나 data retrieval/storage/update API request를 받아 service하는 server로 설계된다.

오늘날 일반 computer system은 보통 1-4개의 multicore processor와 각 processor당 여러 core를 가진다. Main memory는 모든 processor가 공유한다. 이런 작은 수의 core와 shared memory를 사용하는 병렬성은 `coarse-grained parallelism`이라고 부른다.

단일 processor에서도 operating system은 multitasking으로 여러 process를 time-shared manner로 실행하므로, DBMS는 오래전부터 shared database structure를 여러 process/thread가 concurrent하게 접근하는 문제를 해결해 왔다. 그래서 time-shared single-processor용 DBMS는 coarse-grained parallel machine으로 비교적 쉽게 적응할 수 있었다.

전통적 coarse-grained parallel database는 하나의 query를 여러 processor에 나누기보다는 query 하나를 processor 하나에서 실행하고, 여러 query를 동시에 실행해 `throughput`을 높였다. 이는 transaction per second를 늘리지만 individual transaction latency를 크게 줄이지는 않는다. 최근에는 mobile phone까지 multiple cores를 가지므로, 이런 system도 individual query의 parallel processing을 지원하는 방향으로 진화한다.

반대로 `fine-grained parallelism`을 가진 machine은 많은 processor를 가지며, DBMS는 single task, 예를 들어 하나의 query 자체를 parallelize하려 한다. 이 차이가 Section 20.4의 parallel database architecture로 이어진다.

### 20.3 Server System Architectures

Server system은 크게 `transaction server`와 `data server`로 나눌 수 있다.

| Architecture | Client가 보내는 것 | Server가 하는 일 | 대표적 장단점 |
|---|---|---|---|
| `transaction-server system` 또는 `query-server system` | SQL, transaction request, specialized API request | transaction/query를 실행하고 result를 반환 | 가장 널리 쓰인다. DBMS 기능과 transaction 관리가 server에 집중된다. |
| `data-server system` | file/page/object/tuple 같은 data unit에 대한 read/update request | data item access, indexing, transaction facility 제공 | client computation을 활용할 수 있지만 caching, coherency, lock management가 복잡하다. |

Transaction-server architecture가 훨씬 널리 쓰이지만, web scale traffic에서는 parallel data server도 중요하다.

#### 20.3.1 Transaction-Server Architecture

전형적인 transaction-server system은 여러 process가 shared memory에 있는 database structure에 접근한다. User process는 JDBC, ODBC, embedded SQL, user interface 등을 통해 server process에 request를 보내고, server process가 query/transaction을 실행한다.

![Figure 20.1](@/assets/images/cs-database-300-figure-20-1-page-993.png)
*Figure 20.1 · PDF p. 993 · shared memory와 DBMS process/thread가 buffer pool, lock table, log buffer를 공유하는 구조*

Figure 20.1은 transaction server 내부가 단순한 “하나의 server program”이 아니라 여러 process/thread와 shared memory structure의 조합임을 보여준다.

| 구성요소 | 역할 |
|---|---|
| `server process` | user query/transaction을 받고 실행한 뒤 result를 반환한다. 구현은 session별 process, single process with multiple threads, multiple processes each with multiple threads 같은 hybrid가 가능하다. |
| `lock manager process` | lock grant, lock release, deadlock detection을 구현한다. |
| `database writer process` | modified buffer block을 계속 disk로 output한다. |
| `log writer process` | log record buffer의 log records를 stable storage로 output한다. `log force`가 필요하면 server process가 log writer에 output을 요청한다. |
| `checkpoint process` | periodic checkpoint를 수행한다. |
| `process monitor process` | 다른 process를 감시하고, failure 시 해당 process가 수행 중이던 transaction abort와 process restart 같은 recovery action을 수행한다. |

Shared memory에는 `buffer pool`, `lock table`, `log buffer`, `cached query plans`가 들어간다. Cached query plan은 같은 query가 다시 제출될 때 reuse될 수 있다.

여러 process가 shared memory의 data structure를 동시에 read/update하므로 `mutual exclusion`이 필요하다. Operating system `semaphore`를 사용할 수 있지만, overhead를 줄이기 위해 hardware atomic instruction인 `test-and-set` 또는 `compare-and-swap`을 사용하기도 한다.

`test-and-set(M)`은 memory location `M`을 읽고 곧바로 1로 set하는 두 동작을 atomically 수행한다. `M=0`이면 lock 획득에 성공하고, 이미 `M=1`이면 다른 process가 lock을 잡고 있음을 알 수 있다. 두 process가 동시에 실행해도 atomicity 때문에 하나만 0을 읽고 lock을 얻는다.

`compare-and-swap(M, Vo, Vn)`은 memory `M`의 값이 expected old value `Vo`와 같으면 new value `Vn`으로 바꾸고 success를 반환한다. Lock 구현에서는 `M=0`일 때 process identifier 같은 nonzero value를 넣어 lock holder를 추적하기 쉽다.

Atomic instruction은 exclusive lock에 해당하는 mutual exclusion은 제공하지만, database의 general-purpose shared lock을 직접 구현하지는 못한다. 대신 DBMS 내부에서는 short-duration lock인 `latch` 또는 `mutex`를 구현하는 데 사용한다.

많은 DBMS는 server process가 lock manager process에 message를 보내지 않고 shared memory의 lock table을 직접 update한다. Message passing overhead를 피하기 위해서다. 이 경우 lock table 자체에 대한 mutual exclusion이 필요하므로, process는 lock table latch를 잡고 lock grant 여부를 검사한 뒤 lock table을 update하고 latch를 release한다.

Lock acquisition의 내부 흐름은 다음과 같다.

| 단계 | 동작 |
|---|---|
| 1 | lock table에 대한 `mutex/latch`를 획득한다. |
| 2 | Section 18.1.4의 lock compatibility rule로 requested lock을 grant할 수 있는지 확인한다. 가능하면 allocated로 표시하고, 불가능하면 wait queue에 넣는다. |
| 3 | lock table latch를 release한다. |

Lock release도 lock table latch를 잡고 entry를 제거한 뒤, 대기 중인 compatible request를 allocated로 표시하고 latch를 release한다. 반복적으로 lock table을 읽는 `busy waiting`을 피하기 위해 OS semaphore를 사용해 waiting transaction에 lock grant notification을 보낼 수 있다. Deadlock detection은 shared-memory update 방식에서도 여전히 lock manager process가 담당한다.

#### 20.3.2 Data Servers and Data Storage Systems

Data-server system은 원래 object-oriented database에서 persistent object를 생성·조회·갱신하기 위해 발전했다. CAD 같은 application은 chip/building model을 가져온 뒤 simulation 같은 CPU-intensive computation을 수행할 수 있다. 이 computation을 전부 server가 하면 server가 overload되므로, data는 data server에 두고 computation은 client machine에서 수행하는 방식이 유리하다.

최근에는 very high volume data와 transactions를 처리하기 위해 parallel data storage system이 발전했다. 이런 system은 SQL을 반드시 지원하지 않고, 대신 tuples, JSON/XML objects, files, documents 같은 data items를 store/retrieve/update하는 API를 제공한다. 이 장에서는 tuples, objects, files, documents를 통칭해 `data item`이라 하고, `data server`와 `data storage system`을 거의 같은 의미로 사용한다.

Data server는 전체 data item을 통신 단위로 보낼 수 있고, data item이 매우 크면 specified blocks처럼 일부만 통신할 수도 있다. 과거 storage system에서는 database page를 통신 단위로 하는 `page shipping`도 사용했지만, 오늘날 storage system은 underlying storage layout을 client에 노출하지 않으므로 page shipping은 잘 쓰이지 않는다.

#### 20.3.3 Caching at Clients

Client와 server 사이의 communication cost는 local memory reference보다 매우 크다. 같은 location의 server라도 network round-trip time 또는 `network latency`가 거의 millisecond 수준일 수 있고, local memory reference는 100 nanoseconds보다 작다. 따라서 client application과 parallel database는 network latency를 줄이기 위해 다음 전략을 사용한다.

| Strategy | 핵심 아이디어 | 주의점 |
|---|---|---|
| `prefetching` | requested item과 함께 곧 사용할 가능성이 높은 item을 미리 보낸다. | 작은 item 하나씩 요청하면 message passing overhead가 data size보다 커질 수 있다. |
| `data caching` | transaction scope 안에서 또는 transaction 이후에도 client에 data를 cache한다. | cached data가 다른 client에 의해 update/delete되었을 수 있으므로 validity check와 lock acquisition이 필요하다. New tuple도 cache에 없을 수 있다. |
| `lock caching` | data usage가 client별로 거의 partitioned되어 있으면 lock도 client에 cache한다. | 다른 client가 conflicting lock을 요청하면 server가 cached lock을 callback해야 한다. Machine failure까지 고려하면 더 복잡하다. |
| `adaptive lock granularity` | 여러 fine-grained data item lock 대신 page 같은 coarse-grained lock을 사용해 round trip을 줄인다. | contention이 높아지면 coarse lock이 concurrency를 크게 떨어뜨리므로 `lock de-escalation`으로 finer-grained lock으로 낮춘다. |

`lock de-escalation`은 data server가 client에 granularity를 낮추라고 요청하고, client가 finer-grained locks를 획득한 뒤 coarse-grained lock을 release하는 방식이다. Finer granularity로 바꿀 때 cached data item이 현재 transaction에 의해 lock되어 있지 않다면, 그 item에 finer lock을 잡는 대신 cache에서 제거할 수 있다.

### 20.4 Parallel Systems

`parallel system`은 많은 computer를 병렬로 사용해 processing speed와 I/O speed를 높이는 구조다. Serial processing이 computational steps를 순서대로 수행한다면, parallel processing은 여러 operation을 동시에 수행한다.

Parallel machine은 병렬성의 입자 크기로 나눌 수 있다.

| 구분 | 구조 | DB 관점 |
|---|---|---|
| `coarse-grain parallel machine` | 소수의 강력한 processors/cores | shared memory를 활용해 여러 query/transaction을 동시에 처리하기 쉽다. |
| `massively parallel` 또는 `fine-grain parallel machine` | 수백-수천 이상의 smaller processors/nodes | 많은 processor 사이에 memory를 공유하기 어렵기 때문에 node마다 own memory와 disk를 두는 구조가 일반적이다. |

Massively parallel computer에서 각 computer는 `node`라고 부른다. 수백-수천 node 이상의 parallel system은 `data center`에 수용되며, data center는 내부 high-speed network와 외부 network connectivity를 제공한다. Modern data center는 수십만 server까지 포함할 수 있으므로, DB architecture는 single machine 내부 구조만이 아니라 network topology와 failure domain까지 포함해야 한다.

#### 20.4.1 Motivation for Parallel Databases

Parallel database의 직접 동기는 두 가지 workload다.

1. Petabytes 단위의 extremely large database를 query해야 하는 decision-support workload.
2. Thousands of transactions per second 이상의 very high transaction rate를 처리해야 하는 transaction-processing workload.

Centralized database와 client-server database만으로는 이런 요구를 만족하기 어렵다. Web-scale application은 수백-수천 node, 때로는 tens of thousands of nodes를 요구한다. 또한 기업은 구매 기록, click stream, phone call 기록 같은 대규모 데이터를 activity planning과 pricing에 활용하며, 이때 쓰이는 `decision-support queries`는 terabytes 이상 데이터를 다룰 수 있다.

Database query는 set-oriented nature를 가지므로 parallelization에 잘 맞는다. Relation scan, selection, join, aggregation은 data를 partition해 여러 node에서 동시에 처리할 수 있고, commercial/research systems는 parallel query processing의 scalability를 보여 왔다.

Parallel database가 현실적으로 보편화된 이유는 hardware cost 하락과 multicore architecture 확산이다. 이제 개별 computer 자체가 multicore parallel machine이며, small organization도 parallel database를 감당할 수 있다. Application program도 보통 여러 application server에서 parallel하게 실행되고, network를 통해 parallel database server와 통신한다. 따라서 이 절의 architecture는 database storage/query processing뿐 아니라 application-side parallel processing에도 연결된다.

#### 20.4.2 Measures of Performance for Parallel Systems

Database system performance의 기본 지표는 `throughput`과 `response time`이다.

| Metric | 의미 | 병렬화 효과 |
|---|---|---|
| `throughput` | 주어진 시간 동안 완료할 수 있는 task 수 | many small transactions를 동시에 처리하면 증가한다. |
| `response time` | task 제출부터 완료까지 걸리는 시간 | large transaction/query를 subtask로 나누면 줄일 수 있다. |

Parallelism을 평가할 때는 `speedup`과 `scaleup`을 구분해야 한다.

![Figure 20.2](@/assets/images/cs-database-301-figure-20-2-page-1001.png)
*Figure 20.2 · PDF p. 1001 · resource 증가에 따른 linear/sublinear speedup*

`speedup`은 같은 task를 더 많은 resource로 더 짧은 시간에 처리하는 능력이다. 작은 machine에서 task execution time이 `TS`, 더 큰 machine에서 같은 task의 execution time이 `TL`이면 speedup은 `TS / TL`이다. Resource가 N배일 때 speedup도 N이면 `linear speedup`, N보다 작으면 `sublinear speedup`이다. 특정 경우에는 작은 system에서 main memory/cache에 못 담던 data가 큰 system에서는 들어가 disk I/O나 memory access가 줄어 `superlinear speedup`이 나타날 수도 있다.

![Figure 20.3](@/assets/images/cs-database-302-figure-20-3-page-1002.png)
*Figure 20.3 · PDF p. 1002 · problem size와 resource를 함께 늘릴 때의 linear/sublinear scaleup*

`scaleup`은 더 큰 task를 더 많은 resource로 같은 시간 안에 처리하는 능력이다. Task `Q`를 machine `MS`에서 시간 `TS`에 처리하고, N배 큰 task `QN`을 N배 큰 machine `ML`에서 시간 `TL`에 처리한다면 scaleup도 `TS / TL`로 볼 수 있다. `TL = TS`이면 linear scaleup이다.

Parallel database에서 중요한 scaleup은 두 종류다.

| Scaleup | Problem size 기준 | 예 |
|---|---|---|
| `batch scaleup` | database size 또는 job input size가 증가 | relation scan, data warehouse query, weather simulation 같은 large batch job |
| `transaction scaleup` | transaction submission rate와 database size가 함께 증가 | 계좌 수와 transaction rate가 함께 증가하는 banking workload |

Parallel database에서는 보통 speedup보다 scaleup이 더 중요하다. 목표는 database size와 transaction 수가 커져도 acceptable speed를 유지하는 것이다. System capacity를 병렬성 증가로 부드럽게 키우는 편이, 더 빠른 single centralized machine으로 교체하는 방식보다 성장 경로가 자연스럽다. 단, scaleup이 좋아도 absolute performance가 낮으면 실용적이지 않으므로, scaleup metric만 보고 system을 평가하면 안 된다.

효율적인 parallel operation을 방해하는 요인은 다음과 같다.

| 요인 | 의미 | 결과 |
|---|---|---|
| `sequential computation` | task 중 일부는 parallelize되지 않고 반드시 sequential하게 실행된다. | `Amdahl's law`에 따라 parallelizable fraction `p`가 작으면 node 수를 늘려도 speedup 한계가 생긴다. |
| `start-up costs` | thousands of processes를 시작하는 비용 | 실제 processing time보다 process initiation overhead가 커질 수 있다. |
| `interference` | shared bus, shared disk, lock 같은 shared resource 경쟁 | 새 process가 기존 process와 자원 경쟁을 일으켜 speedup/scaleup을 낮춘다. |
| `skew` | task 분할 크기가 균등하지 않음 | 가장 느린 subtask가 전체 task completion time을 결정한다. |

Sequential part가 전체 시간의 `1-p`이고 parallelizable part가 `p`이며, `n` nodes로 parallel execution한다면 speedup은 대략 다음 식으로 제한된다.

$$
\text{Speedup} = \frac{1}{(1-p) + (p/n)}
$$

이는 `Amdahl's law`다. 예를 들어 `p = 9/10`이면 node를 매우 많이 늘려도 maximum speedup은 10을 넘기 어렵다. Scaleup에서는 `Gustafson's law` 관점이 중요하다. Problem size가 커질 때 sequential part도 함께 커지면 scaleup도 제한되지만, sequential part 시간이 problem size와 무관하면 큰 problem에서는 그 영향이 상대적으로 줄어든다.

#### 20.4.3 Interconnection Networks

Parallel system은 processors, memory, disks 같은 components가 `interconnection network`를 통해 통신하는 구조다. Network topology는 communication latency, bandwidth, scalability, cost를 결정하므로 database parallelism의 실제 성능에 직접 영향을 준다.

![Figure 20.4](@/assets/images/cs-database-303-figure-20-4-page-1004.png)
*Figure 20.4 · PDF p. 1004 · bus, ring, mesh, hypercube, tree-like topology interconnection networks*

Figure 20.4는 parallel system에서 흔한 network topology를 보여준다. `bus`는 모든 component가 하나의 communication bus를 공유하는 구조다. 작은 processor 수에서는 단순하지만, node 수가 커질수록 bus가 bottleneck이 되어 잘 scale하지 않는다. 이후 구간에서는 ring, mesh, hypercube, tree-like data-center topology가 어떻게 trade-off를 만드는지 이어진다.

Interconnection network의 나머지 topology는 scalability와 hop count 사이의 trade-off를 만든다.

| Topology | 구조 | 장점 | 한계 |
|---|---|---|---|
| `ring` | node가 원형으로 연결되고 각 node가 양옆 node와 연결 | 각 link가 동시에 data를 전송할 수 있어 bus보다 scale이 좋다. | n개 node에서 최대 `n/2` hops가 필요할 수 있어 node 수가 늘면 delay가 증가한다. |
| `mesh` | grid 형태로 adjacent node와 연결 | link 수와 communication capacity가 component 수와 함께 증가한다. Processor core나 single server 내부 연결에 쓰인다. | node 간 worst-case hop 수가 node 수의 제곱근에 비례해, large node cluster에는 느리다. |
| `hypercube` | binary id가 한 bit만 다른 node끼리 연결 | n개 component에서 각 node가 `log(n)`개 node와 연결되고, 최대 `log(n)` links로 도달할 수 있다. | 과거 massively parallel computer에 쓰였지만 오늘날 흔하지 않다. |
| `tree-like` 또는 `fat-tree` | top-of-rack, aggregation, core switch의 계층형 data-center fabric | inter-rack bandwidth를 늘리고 switch failure 시 alternative path를 제공한다. | rack 간 traffic이 많으면 여전히 bottleneck이 생기므로 parallel DB는 inter-rack traffic을 줄이도록 설계해야 한다. |

Data center에서는 server가 rack에 장착되고, rack마다 `top-of-rack switch` 또는 `edge switch`가 있다. 여러 rack은 `aggregation switch`, 더 큰 규모에서는 `core switch`로 이어진다. 단순 tree는 상위 link가 쉽게 포화되므로, 실제 data center는 edge switch를 여러 aggregation switch에 연결해 bandwidth와 fault tolerance를 높인다. 이런 복잡한 network를 `data center fabric`이라고 부른다.

Network technology도 중요하다.

| Technology | 주 용도와 특징 |
|---|---|
| `Ethernet` | 가장 지배적인 network technology다. 1Gbps/10Gbps가 널리 쓰이고 40Gbps/100Gbps도 사용된다. |
| `Fiber Channel Protocol` | storage system과 computer의 high-speed interconnection, 특히 storage area network에 주로 쓰인다. |
| `Infiniband` | data center 내부 high-performance computing을 위해 설계되었고, high bandwidth뿐 아니라 very low latency가 강점이다. |
| `RDMA(remote direct memory access)` | 한 node의 process가 다른 node memory를 explicit message passing 없이 직접 read/write할 수 있게 한다. |

Database parallelism에서는 bandwidth만큼 `latency`도 중요하다. Standard networking stack은 application -> OS -> hardware -> remote hardware -> remote OS -> remote application 경로를 거치므로 overhead가 크다. Direct hardware interface나 RDMA는 OS 경유를 줄여 communication latency를 크게 낮춘다.

#### 20.4.4 Parallel Database Architectures

Parallel database architecture는 resource sharing 방식에 따라 구분된다.

![Figure 20.5](@/assets/images/cs-database-304-figure-20-5-page-1008.png)
*Figure 20.5 · PDF p. 1008 · shared memory, shared disk, shared nothing, hierarchical parallel database architectures*

Figure 20.5에서 `P`는 processor, `M`은 memory를 뜻한다. 그림의 interconnection network는 추상적으로 그려진 것이며 실제 구현이 반드시 bus라는 뜻은 아니다.

| Architecture | 공유하는 것 | 핵심 성격 |
|---|---|---|
| `shared memory` | 모든 processor가 common memory와 disk를 공유 | process 간 communication이 매우 빠르지만 scalability가 제한된다. |
| `shared disk` | 각 node는 own processor/memory를 갖고, common disk set을 공유 | shared-memory보다 많은 processor로 scale하고 node failure takeover가 쉽다. |
| `shared nothing` | memory도 disk도 공유하지 않음 | local disk access와 scalable network로 thousands of nodes까지 확장 가능하다. |
| `hierarchical` | 위 구조들의 hybrid | 오늘날 가장 널리 쓰이며, node 내부는 shared-memory, node 간은 shared-nothing인 경우가 많다. |

#### 20.4.5 Shared Memory

`shared-memory architecture`에서는 processor들이 interconnection network를 통해 common memory에 접근하고, disks도 공유한다. 가장 큰 장점은 process 간 communication이 software-level data movement 없이 shared memory read/write로 가능하다는 점이다. Memory write는 보통 microsecond보다 짧아 message passing보다 훨씬 빠르다.

Multicore processor가 보편화되고 memory 가격이 낮아지면서 shared-memory parallel processing은 더 중요해졌다. 단, 많은 core/processor를 연결하려면 specialized high-speed interconnect가 필요하므로 shared-memory parallelism은 보통 수백 core 이하로 제한된다.

#### 20.4.5.1 Shared-Memory Architectures

초기 shared-memory system은 processors와 memory bank가 하나의 bus를 공유했다. 하지만 processor 수가 늘면 bus가 bottleneck이 되어 processor가 memory access turn을 기다리느라 대부분의 시간을 보낼 수 있다.

현대 shared-memory architecture는 memory를 processor에 직접 붙인다. 각 processor는 locally connected memory를 매우 빠르게 접근하고, 다른 processor에 붙은 memory도 fast interprocessor network를 통해 접근한다. Memory 위치에 따라 access speed가 달라지므로 이런 구조를 `non-uniform memory architecture(NUMA)`라고 한다.

![Figure 20.6](@/assets/images/cs-database-305-figure-20-6-page-1010.png)
*Figure 20.6 · PDF p. 1010 · processor별 local memory와 interconnect를 가진 modern shared-memory/NUMA 구조*

Figure 20.6은 각 CPU가 memory controller와 local memory bank를 갖고, CPU들이 fast interconnect로 연결되며 I/O controller를 통해 external storage에 접근하는 개념 구조를 보여준다.

Shared-memory system 성능에는 cache가 큰 영향을 준다. Cache는 main memory보다 훨씬 빠르므로 shared memory access 횟수를 줄인다. 하지만 필요한 data가 cache에 없으면 `cache miss`가 발생하고, core는 main memory fetch를 기다리며 potential processing speed를 잃는다.

`hyper-threading` 또는 `hardware threads`는 하나의 physical core가 둘 이상의 logical cores처럼 보이게 한다. 한 logical core가 cache miss로 block되면 같은 physical core의 다른 logical core가 실행되어 idle time을 줄일 수 있다. 실제로 동시에 실행되는 physical execution unit은 제한되지만, memory wait를 숨기는 데 도움이 된다.

![Figure 20.7](@/assets/images/cs-database-306-figure-20-7-page-1011.png)
*Figure 20.7 · PDF p. 1011 · L1/L2 per-core cache와 shared L3 cache를 가진 multilevel cache system*

Figure 20.7처럼 multicore processor는 보통 여러 cache level을 가진다. `L1 cache`는 가장 빠르지만 작고, `L2`, `L3`는 느리지만 크다. L3 cache는 여러 core가 공유하는 경우가 많다. Data는 보통 64 bytes 정도의 `cache line` 단위로 cache와 memory 사이를 이동한다.

#### 20.4.5.2 Cache Coherency

`cache coherency`는 여러 core/processor가 각자 cache를 가질 때 발생한다. 한 core가 memory location을 update했는데 다른 core의 local cache에 old value가 남아 있으면, 두 번째 core는 최신 값을 보지 못할 수 있다. 따라서 update가 일어나면 다른 cache에 있는 해당 memory location copy를 invalidate해야 한다.

많은 processor architecture는 invalidation을 lazy하게 수행한다. Immediate invalidation을 항상 강제하면 성능 비용이 크기 때문이다. 이 지연 때문에 한 processor의 write 이후 다른 processor의 read가 updated value를 보지 못하는 subtle error가 생길 수 있다.

이를 제어하기 위해 processor는 `memory barrier instruction`을 제공한다.

| Barrier | 역할 |
|---|---|
| `sfence` 또는 store barrier | 이전 store들의 invalidation message가 다른 cache로 보내질 때까지 이후 load/store를 진행하지 않게 한다. |
| `lfence` 또는 load barrier | 받은 invalidation message를 적용한 뒤 이후 load/store를 진행하게 한다. |
| `mfence` | load/store 양쪽 barrier 역할을 함께 수행한다. |

Interprocess synchronization protocol은 memory barrier와 함께 써야 안전하다. 다만 일반 programmer가 lock을 올바르게 acquire/release하면 lock implementation 안에 필요한 memory barrier가 들어 있으므로 직접 barrier를 다룰 필요가 없는 경우가 많다. Lock release에는 보통 sfence가, lock acquisition 직후에는 lfence가 포함되어 reader가 최신 값을 보도록 보장한다.

Hardware-level cache coherence protocol의 대표 예는 `MESI protocol`이다. MESI는 cache line의 상태를 `Modified`, `Exclusive`, `Shared`, `Invalid`로 추적한다. Read는 cache line에 shared lock을 얻고, write는 exclusive lock을 얻은 뒤 수행된다. Database lock과 달리 memory-level lock request는 기다리지 않고 conflicting lock을 즉시 revoke/invalidate한다. 성능 최적화 때문에 강한 cache coherency가 항상 보장되지 않을 수 있어, 많은 architecture에서는 memory barrier가 여전히 필요하다.

#### 20.4.6 Shared Disk

`shared-disk model`에서는 각 node가 own processor와 memory를 갖지만, 모든 node가 interconnection network를 통해 모든 disks에 직접 접근할 수 있다. Shared-memory보다 장점은 두 가지다.

1. Shared-memory system보다 더 많은 processor로 scale할 수 있다.
2. Node failure 시 다른 node가 같은 disk의 database에 접근해 failed node의 task를 takeover할 수 있으므로 cheap fault tolerance를 제공한다.

Disk subsystem은 Chapter 12의 `RAID`로 fault tolerant하게 만들 수 있고, 많은 storage device가 있는 RAID는 어느 정도 I/O parallelism도 제공한다.

![Figure 20.8](@/assets/images/cs-database-307-figure-20-8-page-1014.png)
*Figure 20.8 · PDF p. 1014 · nodes가 storage-area network를 통해 shared storage arrays에 접근하는 구조*

`storage-area network(SAN)`은 large storage bank를 data-using nodes와 연결하는 high-speed local-area network다. Storage array는 여러 physical disks로 구성되지만, node에는 logical disk 또는 logical disk set처럼 보이게 하여 underlying disk details를 숨긴다. Logical disk 크기는 physical disk 하나보다 클 수 있고, physical disk 추가로 확장될 수 있다.

SAN은 multiple paths 같은 redundancy를 갖추는 경우가 많아 link나 network connection failure에도 계속 동작할 수 있다. Shared-disk with SAN은 high degree of parallelism보다 high availability가 더 중요한 application에 적합하다.

Shared-disk system은 shared-memory보다 더 많은 processor로 scale하지만, node 간 communication은 network를 거치므로 shared memory access보다 느리다. 또 storage network bandwidth가 local storage bandwidth보다 작을 수 있어 storage access bottleneck이 scalability를 제한한다.

#### 20.4.7 Shared Nothing

`shared-nothing system`에서는 각 node가 processor, memory, one or more disks를 가지고, node들은 high-speed interconnection network로만 통신한다. 각 node는 자신이 소유한 disk의 data에 대한 server처럼 동작한다.

Shared-nothing은 모든 I/O가 단일 interconnection network를 거쳐 shared disk로 몰리는 문제를 피한다. Local disk reference는 각 node의 local disk에서 처리되며, tree-like interconnection network처럼 scalable한 network를 쓰면 node 추가에 따라 transmission capacity도 함께 증가한다. 그래서 thousands of nodes, 극단적으로 tens of thousands of nodes까지 확장할 수 있다.

단점은 communication과 nonlocal disk access 비용이 shared-memory/shared-disk보다 크다는 점이다. Data를 보내려면 양쪽 node에서 software interaction이 필요하고, local이 아닌 data는 network transfer가 필요하다.

#### 20.4.8 Hierarchical

`hierarchical architecture`는 shared-memory, shared-disk, shared-nothing의 특성을 계층적으로 결합한다. Top level은 node들이 memory와 disk를 공유하지 않는 shared-nothing 구조일 수 있고, 각 node 내부는 multiple processors를 가진 shared-memory system일 수 있다. 또는 shared-disk group의 각 node가 다시 shared-memory system일 수도 있다.

오늘날 parallel database system은 보통 hierarchical architecture로 실행된다. 각 node는 multiple cores/processors로 shared-memory parallelism을 제공하고, 여러 node는 shared-nothing manner로 interconnect된다. 이 구조는 single architecture의 한계를 피하고, node 내부 low-latency memory sharing과 node 간 large-scale scalability를 함께 얻으려는 절충이다.

### 20.5 Distributed Systems

`distributed database system`에서는 database가 geographically separated sites의 nodes에 저장된다. Nodes는 high-speed private networks나 Internet 같은 communication media로 통신하지만, main memory나 disks를 공유하지 않는다.

![Figure 20.9](@/assets/images/cs-database-308-figure-20-9-page-1016.png)
*Figure 20.9 · PDF p. 1016 · network를 통해 통신하는 지리적으로 분리된 distributed sites*

Figure 20.9는 distributed system이 단순히 “shared-nothing cluster가 커진 것”이 아니라, site 간 network와 지리적 거리, failure domain을 포함하는 구조임을 보여준다.

Shared-nothing parallel database와 distributed database는 둘 다 memory/disk를 공유하지 않을 수 있지만 목적과 제약이 다르다.

| 구분 | Shared-nothing parallel database | Distributed database |
|---|---|---|
| 위치 | 보통 한 data center 내부 | geographically separated sites |
| Network | data-center network라 상대적으로 high bandwidth, low latency | WAN/Internet을 거쳐 lower bandwidth, higher latency, higher failure probability |
| Failure 목표 | node failure 처리 | entire data center failure, network partition까지 고려 |
| Administration | 보통 centralized administration | site별 autonomy가 있을 수 있음 |
| Node 성격 | 비슷한 capacity의 homogeneous nodes가 많음 | size/function이 다양할 수 있음 |
| Transaction 범위 | parallel execution을 위한 partitioned data access | `local transaction`과 `global transaction`을 구분 |

Distributed database에서는 physical data location을 의식해야 한다. End user와 가까운 data center에 data copy를 두면 latency를 줄일 수 있다. 또한 earthquake, fire, natural disaster처럼 data center 전체가 실패할 수 있으므로 geographically separated data centers에 data를 replicate해 high availability를 보장해야 한다.

`local transaction`은 transaction이 시작된 node의 data만 접근하는 transaction이다. `global transaction`은 시작 node와 다른 node의 data를 접근하거나 여러 node의 data를 함께 접근한다. Global transaction은 commit, concurrency control, recovery가 훨씬 어려워진다.

Web-scale data management system은 parallelism과 distribution을 결합한다. Data center 내부에서는 high load를 처리하기 위해 parallelism을 사용하고, data centers 사이에서는 natural disaster에도 high availability를 유지하기 위해 distribution을 사용한다. 기능이 낮은 쪽에서는 key-based storage/retrieval만 제공하고 schema/query language/transaction은 application이 맡는다. 기능이 높은 쪽에서는 schemas, query language, transactions를 지원하는 distributed database가 되지만, 이런 system은 보통 centrally administered다.

기존 database들을 통합해 만든 distributed database는 성격이 다르다.

| 목적/특성 | 설명 |
|---|---|
| `sharing data` | 한 site 사용자가 다른 site data에 접근할 수 있다. 예를 들어 campus별 database가 있는 university system에서 student record transfer를 외부 mechanism 없이 처리할 수 있다. |
| `autonomy` | 각 site가 local data에 대한 control을 유지한다. Global DBA가 전체를 책임지지만, local DBA에게 일부 권한을 위임할 수 있다. |
| `homogeneous distributed database` | common global schema를 공유하고, 모든 node가 같은 distributed DBMS software를 실행하며 query/transaction processing에 적극 협력한다. |
| `federated database system` 또는 `heterogeneous distributed database system` | 이미 존재하는 여러 DBMS를 연결한다. 각 site는 own schema와 서로 다른 DBMS software를 가질 수 있고, query/transaction 협력 기능이 제한적일 수 있다. |

Distributed database의 WAN 환경은 세 가지 실무 문제를 만든다.

1. `bandwidth`: WAN bandwidth는 커졌지만 여러 user/application이 공유하고 LAN bandwidth보다 비싸다.
2. `latency`: 전 세계 message delivery는 speed-of-light delay와 router queueing 때문에 수백 milliseconds가 걸릴 수 있다. 지리적 latency는 어느 지점 이하로 줄일 수 없는 fundamental problem이다.
3. `network partition`: 두 site가 모두 살아 있지만 communication link failure 때문에 서로 통신할 수 없는 상황이다. 이는 system availability와 data consistency 사이의 trade-off로 이어지며, Section 23.4의 논의와 연결된다.

여기서 `network partitioning`은 `data partitioning`과 다르다. Data partitioning은 data items를 여러 partitions로 나누어 different nodes에 저장하는 것이고, network partitioning은 communication failure로 live sites가 서로 고립되는 것이다.

### 20.6 Transaction Processing in Parallel and Distributed Systems

Parallel/distributed database에서 transaction `atomicity`는 핵심 문제다. Transaction이 두 node에서 실행될 때 한 node에서는 commit되고 다른 node에서는 abort되면 database가 inconsistent state가 된다. 이를 막기 위해 `transaction commit protocol`이 필요하며, 가장 널리 쓰이는 protocol은 `two-phase commit protocol(2PC)`이다.

2PC의 기본 흐름은 다음과 같다.

| 단계 | 의미 |
|---|---|
| Prepare/ready | 각 node가 transaction을 partially committed state까지 실행하고, commit/abort 결정은 coordinator에게 맡긴다. 이 시점의 transaction은 해당 node에서 `ready state`다. |
| Coordinator decision | coordinator는 transaction이 실행된 모든 node가 ready state에 도달했을 때만 commit을 결정한다. 어느 node라도 abort하면 전체 abort를 결정한다. |
| Participant obeys | transaction이 실행된 모든 node는 coordinator decision을 따라야 한다. |
| Recovery condition | node가 ready state에서 실패했다가 복구되면, coordinator decision에 따라 commit 또는 abort할 수 있는 상태여야 한다. |

Concurrency control도 distributed 환경에서 복잡해진다. Transaction이 여러 node의 data item에 접근하면 여러 node의 transaction managers가 coordination해야 한다. Locking을 쓰면 accessed data item을 가진 node에서 local locking을 수행할 수 있지만, 여러 node에서 시작된 transactions가 얽힌 distributed deadlock이 생길 수 있다. 따라서 deadlock detection도 multiple nodes에 걸쳐 수행되어야 한다.

Distributed system에서는 computer failure뿐 아니라 communication link failure도 자주 고려해야 한다. Data replication은 failure 시 continued functioning의 핵심이지만, replicated data item이 여러 node에 있을수록 concurrency control은 더 복잡해진다. Chapter 23은 distributed locking, timestamp-based protocol, distributed concurrency control을 자세히 다룬다.

모든 database가 2PC 같은 protocol에 협력할 수 있거나 협력하려는 것은 아니다. 여러 database boundary를 넘어가는 task에는 standard transaction model이 부적합할 수 있으며, 이런 경우 `persistent messaging` 기반 접근이 사용된다. 여러 database와 human interaction이 얽힌 복잡한 task는 `workflow management system`이 coordination과 transaction property 보장을 돕는다.

### 20.7 Cloud-Based Services

전통적으로 enterprise는 database와 application을 실행할 servers를 직접 구매하고 운영했다. 이 방식은 server room infrastructure, air conditioning, power failures, CPU/disk/component failures 대응까지 모두 직접 관리해야 하므로 비용이 크다. Demand가 갑자기 증가하면 infrastructure를 빨리 늘리기 어렵고, demand가 줄면 구매한 infrastructure가 idle 상태가 될 수 있다.

`cloud computing model`에서는 enterprise application이 다른 회사가 관리하는 infrastructure 위에서 실행된다. Cloud service provider는 많은 enterprise/user가 함께 쓰는 data center를 운영하고, hardware뿐 아니라 database, data storage, application software 같은 platform과 software를 제공할 수 있다. 핵심 가치는 `economies of scale`, on-demand provisioning, `elasticity`다.

#### 20.7.1 Cloud Service Models

Cloud service는 abstraction level에 따라 나눌 수 있다.

![Figure 20.10](@/assets/images/cs-database-309-figure-20-10-page-1020.png)
*Figure 20.10 · PDF p. 1020 · IaaS, PaaS, SaaS가 infrastructure에서 application까지 쌓이는 cloud service model*

Figure 20.10은 cloud clients가 Internet을 통해 SaaS, PaaS, IaaS 계층을 사용하는 구조를 보여준다. 아래 계층일수록 client가 더 많이 직접 관리하고, 위 계층일수록 provider가 더 많이 관리한다.

| Model | Provider가 제공 | Client가 주로 담당 | DB 관점 |
|---|---|---|---|
| `infrastructure-as-a-service(IaaS)` | virtual machine(VM), physical machine abstraction, storage, network | OS 위 software 설치, DBMS 설치, backup/restore 등 maintenance | 기존 DBMS를 VM 위에 직접 운영한다. |
| `platform-as-a-service(PaaS)` | data storage, database service, application server 같은 platform | ERP 등 application software 설치/운영 | `cloud-based data storage`, `database-as-a-service`를 사용한다. |
| `software-as-a-service(SaaS)` | application software와 underlying platform 전체 | provider interface 사용 | client는 software installation/upgrade를 신경 쓰지 않는다. |

`IaaS`에서 사용자는 computing facilities를 rent한다. 실제 physical machine을 빌릴 수도 있지만, 더 흔히 `virtual machine(VM)` abstraction을 제공받는다. VM은 software가 simulated하는 independent computer처럼 보이며, 하나의 real machine에서 여러 VM이 실행될 수 있다. Cloud provider는 very large data center와 spare capacity를 바탕으로 필요한 만큼 machine을 빌려주고, light load 때 release하게 해 `elasticity`를 제공한다.

IaaS의 장점은 기존 software stack을 비교적 그대로 올릴 수 있다는 점이다. 단, client enterprise가 DBMS 설치와 maintenance, backup, restore를 직접 책임져야 한다. 또한 data를 enterprise 밖에 저장하는 security risk 때문에 banking 같은 high-security enterprise에서는 사용이 제한될 수 있다.

`PaaS`에서는 provider가 infrastructure뿐 아니라 application software가 사용할 platform을 deploy/manage한다. Client는 application software를 유지하고, database service나 storage service 같은 provider-managed platform을 사용한다.

PaaS의 data 관련 service는 다시 구분된다.

| Service | 제공 기능 | 특징 |
|---|---|---|
| `cloud-based data storage platform` | file 또는 small data item의 store/retrieve | file은 MB-GB급 large object일 수 있고, data item은 hundreds of bytes to MB급으로 billions 규모일 수 있다. Provider가 storage capacity와 compute provisioning을 맡는다. |
| `database-as-a-service(DBaaS)` | SQL 또는 다른 query language를 통한 database access | 단순 storage service와 달리 query functionality를 제공한다. 초기에는 single-node DB가 많았지만, 최근에는 parallel database도 cloud service로 제공된다. |

Cloud-based storage fee는 보통 stored data size, data input amount, data output amount에 따라 책정된다. Service를 쓰면 user가 storage system을 구매·유지·관리하지 않아도 되고, demand가 증가하면 더 많은 fee를 내고 server 수를 늘릴 수 있다. Provider는 economies of scale 덕분에 deployment cost와 time to deployment를 줄일 수 있다.

`SaaS`에서는 provider가 application software 자체를 service로 제공한다. Client는 web interface나 mobile app interface를 통해 software를 사용하고, installation/upgrade는 provider가 담당한다.

VM과 container는 cloud deployment의 핵심 abstraction이다. VM은 하나의 physical machine을 여러 independent computers처럼 나눠 쓰게 하지만, 각 VM이 내부에 entire operating system을 실행하므로 overhead가 크다. 여러 application을 하나의 machine/VM에 직접 올리면 network port conflict나 shared library version conflict가 생길 수 있다.

`container`는 각 application이 own IP address와 own shared libraries를 가진 isolated environment에서 실행되게 해 이런 충돌을 줄인다. 여러 container는 같은 operating system kernel을 공유하므로, application마다 VM을 띄우는 것보다 비용이 낮다. Container 안의 multiple processes는 file system과 interprocess communication으로 상호작용할 수 있지만, 다른 container와는 network connection을 통해서만 상호작용한다.

![Figure 20.11](@/assets/images/cs-database-310-figure-20-11-page-1023.png)
*Figure 20.11 · PDF p. 1023 · single machine, VM, container 기반 application deployment alternatives*

Figure 20.11은 세 가지 deployment alternative를 비교한다.

| Deployment | 구조 | 장점/한계 |
|---|---|---|
| Multiple applications on a single machine | applications가 libraries와 OS kernel을 공유 | overhead는 작지만 port/library conflict가 생길 수 있다. |
| Each application in its own VM | VM마다 OS kernel이 있고 hypervisor가 여러 VM을 관리 | isolation이 강하고 migration/recovery가 쉽지만 overhead가 크다. |
| Each application in its own container | container마다 libraries를 갖고 OS kernel은 공유 | VM보다 overhead가 낮고 빠르게 deploy되어 elasticity에 유리하다. |

`hypervisor`는 하나의 real machine에서 여러 VM을 관리하는 software layer다. VM은 hardware failure나 upgrade 시 한 physical server에서 shut down하고 다른 physical server에서 restart할 수 있어 downtime을 줄인다.

현대 application은 여러 small services가 network API를 제공하는 `microservices architecture`로 구성되는 경우가 많다. Container는 각 service process를 낮은 overhead로 실행하기 좋아 microservices와 잘 맞는다. Docker는 널리 쓰이는 container platform이고, Kubernetes는 container뿐 아니라 microservices platform까지 제공한다. Kubernetes는 declarative container needs를 받아 containers를 deploy/link하고, pods를 통해 여러 containers가 storage와 network(IP address)를 공유하게 하며, load balancer를 통해 여러 container replicas에 API request를 분산할 수 있다.

#### 20.7.2 Benefits and Limitations of Cloud Services

Cloud service의 장점은 분명하다.

- Client enterprise가 large system-support staff를 유지할 필요가 줄어든다.
- New enterprise가 computing system에 큰 upfront capital investment 없이 시작할 수 있다.
- Enterprise needs가 증가하면 computing/storage resources를 on demand로 추가할 수 있다.
- Provider의 very large clusters 덕분에 resource allocation과 deployment가 빠르다.

하지만 cloud user는 자신의 data가 다른 organization에 보관된다는 사실을 받아들여야 한다. 이는 security와 legal liability를 만든다. Cloud vendor의 security breach로 client data가 노출되면 client가 고객에게 legal challenge를 받을 수 있지만, client는 vendor security를 직접 통제하지 못한다.

Geographic data placement도 법적 문제가 된다. Cloud vendor가 data 또는 replica를 foreign country에 저장하면 해당 jurisdiction의 privacy law가 적용될 수 있다. 예를 들어 어느 국가의 회사 data가 New York server에 replicate되면, 원래 국가나 EU law뿐 아니라 U.S. privacy/legal regime도 관련될 수 있다. Vendor별로 client가 geographic distribution과 replication을 얼마나 통제할 수 있는지는 다르다.

### 20.8 Summary

Chapter 20의 구조는 다음처럼 정리된다.

- `centralized database system`은 단일 computer에서 실행된다. Multiuser system은 SQL/API request를 받는 server로 설계되고 full transaction features가 필요하다.
- 작은 core 수의 parallelism은 `coarse-grained parallelism`, 많은 processor를 사용하는 parallelism은 `fine-grained parallelism`이다.
- `transaction server`는 multiple processes/threads가 shared memory의 buffer pool, lock table, log buffer, query plan cache를 사용한다.
- Shared memory access는 `mutual exclusion`으로 보호되며, machine-level atomic instruction인 `test-and-set`, `compare-and-swap`이 latch/mutex 구현에 쓰인다.
- `data server`는 client에 raw data를 제공하며, network round trip을 줄이기 위해 data caching, lock caching, prefetching, adaptive lock granularity를 사용한다.
- Parallel database는 processors, disks, interconnection network를 결합한다. `speedup`은 single task를 더 빨리 처리하는 능력이고, `scaleup`은 workload/problem size 증가를 resource 증가로 흡수하는 능력이다.
- Ideal speedup/scaleup은 `sequential computation`, `start-up costs`, `interference`, `skew` 때문에 깨진다.
- Interconnection network에는 `bus`, `ring`, `mesh`, `hypercube`, `tree-like topology`가 있고, data center에서는 fat-tree/data center fabric이 중요하다.
- Parallel database architecture에는 `shared memory`, `shared disk`, `shared nothing`, `hierarchical`이 있으며, scalability와 communication speed 사이의 trade-off가 다르다.
- Modern shared-memory architecture는 `NUMA`를 만들고, 각 processor/cache 때문에 `cache coherency`, `memory barrier`, `MESI protocol` 같은 문제가 생긴다.
- `storage-area network(SAN)`은 shared-disk system을 구성하는 데 쓰이는 high-speed storage network다.
- `distributed database system`은 geographically separated sites의 database systems가 common schema와 transaction/query coordination을 이상적으로 공유하는 구조다.
- Cloud service는 `IaaS`, `PaaS`, `SaaS`로 나뉘고, `cloud-based data storage`, `database-as-a-service`, `VM`, `container`, `microservices architecture`가 현대 deployment의 핵심이다.

## 연결 관계

- Chapter 12의 disk, RAID, storage hierarchy는 shared disk, SAN, cloud storage 이해의 기반이다.
- Chapter 18의 lock table, deadlock detection, strict concurrency control은 transaction server 내부 lock manager와 distributed deadlock으로 확장된다.
- Chapter 19의 recovery, log writer, checkpoint, high availability는 transaction-server process structure와 distributed/cloud deployment에서 다시 등장한다.
- Chapter 21은 이 장의 shared-nothing/parallel/distributed architecture 위에서 data partitioning, replication, distributed file system, key-value store를 다룬다.
- Chapter 22는 speedup/scaleup 목표를 실제 query plan, parallel sort/join, exchange operator로 구현한다.
- Chapter 23은 2PC, distributed concurrency control, replication, network partition, availability/consistency trade-off를 본격적으로 다룬다.

## 오해하기 쉬운 내용

- `centralized database system`이 항상 single-user system이라는 뜻은 아니다. 단일 computer system에서 실행되면 multiuser enterprise server도 centralized다.
- Coarse-grained parallelism은 individual query를 반드시 빠르게 만드는 것이 아니라, 여러 query를 동시에 실행해 throughput을 높이는 데 먼저 쓰였다.
- `shared nothing`과 `distributed database`는 같지 않다. Shared-nothing은 보통 data center 내부 scalable architecture이고, distributed database는 geography, autonomy, WAN latency, network partition을 포함한다.
- Atomic instruction은 DB의 shared/exclusive lock protocol을 직접 대체하지 않는다. 주로 latch/mutex 같은 short-duration mutual exclusion을 구현하는 데 쓰인다.
- `scaleup`이 좋다고 항상 빠른 system은 아니다. Absolute performance가 낮으면 linear scaleup system도 실무에서 느릴 수 있다.
- Container는 VM보다 overhead가 낮지만, isolation boundary와 OS kernel sharing 방식이 다르다. 모든 workload에 VM을 대체하는 것은 아니다.
- Cloud의 elasticity는 resource 확보를 쉽게 하지만, security, privacy, jurisdiction, data transfer cost, latency 문제를 없애지는 않는다.

## 면접 질문

1. `transaction-server architecture`와 `data-server architecture`의 차이를 client/server 책임 분배 관점에서 설명하라.
2. DBMS에서 `test-and-set`, `compare-and-swap`은 왜 general-purpose lock보다 latch/mutex 구현에 더 적합한가?
3. `speedup`과 `scaleup`의 차이를 `TS/TL` 정의와 함께 설명하고, DBMS에서는 왜 scaleup이 특히 중요한가?
4. `Amdahl's law`가 parallel database speedup에 주는 제한은 무엇인가?
5. `skew`, `interference`, `start-up costs`가 parallel query processing을 어떻게 방해하는가?
6. `shared memory`, `shared disk`, `shared nothing`, `hierarchical` architecture의 scalability와 communication cost trade-off를 비교하라.
7. `NUMA`와 `cache coherency`가 shared-memory DBMS 성능과 correctness에 미치는 영향을 설명하라.
8. Shared-nothing parallel database와 distributed database를 network, failure, administration, transaction 범위 기준으로 구분하라.
9. `two-phase commit protocol(2PC)`에서 ready state와 coordinator decision이 atomicity를 어떻게 보장하는가?
10. `IaaS`, `PaaS`, `SaaS`, `DBaaS`, container, VM이 각각 DB deployment에서 어떤 선택지를 제공하는가?

## 용어 회수

`database-system architecture`, `centralized database system`, `single-user system`, `multiuser system`, `embedded database`, `server system`, `coarse-grained parallelism`, `fine-grained parallelism`, `transaction-server system`, `query-server system`, `data-server system`, `data storage system`, `shared memory`, `server process`, `lock manager process`, `database writer process`, `log writer process`, `checkpoint process`, `process monitor process`, `buffer pool`, `lock table`, `log buffer`, `cached query plan`, `mutual exclusion`, `semaphore`, `test-and-set`, `compare-and-swap`, `latch`, `mutex`, `busy waiting`, `network round-trip time`, `network latency`, `prefetching`, `data caching`, `cache coherency`, `lock caching`, `adaptive lock granularity`, `lock de-escalation`, `parallel system`, `parallel database system`, `node`, `data center`, `decision-support queries`, `throughput`, `response time`, `speedup`, `linear speedup`, `sublinear speedup`, `superlinear speedup`, `scaleup`, `linear scaleup`, `sublinear scaleup`, `batch scaleup`, `transaction scaleup`, `sequential computation`, `Amdahl's law`, `Gustafson's law`, `start-up costs`, `interference`, `skew`, `interconnection network`, `bus`, `ring`, `mesh`, `hypercube`, `tree-like topology`, `fat-tree topology`, `top-of-rack switch`, `edge switch`, `aggregation switch`, `core switch`, `data center fabric`, `Ethernet`, `Fiber Channel Protocol`, `Infiniband`, `remote direct memory access(RDMA)`, `shared-memory architecture`, `shared-disk model`, `shared-nothing system`, `hierarchical architecture`, `non-uniform memory architecture(NUMA)`, `hyper-threading`, `hardware threads`, `cache miss`, `cache line`, `memory barrier instruction`, `sfence`, `lfence`, `mfence`, `MESI protocol`, `RAID`, `storage-area network(SAN)`, `distributed database system`, `geographically separated sites`, `local transaction`, `global transaction`, `sharing data`, `autonomy`, `homogeneous distributed database`, `federated database system`, `heterogeneous distributed database system`, `wide-area network(WAN)`, `network partition`, `data partitioning`, `transaction commit protocol`, `two-phase commit protocol(2PC)`, `ready state`, `coordinator`, `distributed deadlock`, `persistent messaging`, `workflow management system`, `cloud computing model`, `cloud service provider`, `economies of scale`, `elasticity`, `infrastructure-as-a-service(IaaS)`, `platform-as-a-service(PaaS)`, `software-as-a-service(SaaS)`, `virtual machine(VM)`, `cloud-based data storage platform`, `database-as-a-service(DBaaS)`, `container`, `hypervisor`, `microservices architecture`, `Docker`, `Kubernetes`, `pod`, `load balancer`.
