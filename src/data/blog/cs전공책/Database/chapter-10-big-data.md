---
title: "Chapter 10. Big Data"
order: 10
pubDatetime: 2026-05-18T00:17:00+09:00
modDatetime: 2026-05-18T00:17:00+09:00
description: "Database System Concepts 정리: Chapter 10. Big Data"
tags:
  - "Database"
  - "CS"
---

## 개요

전통적인 relational database application은 한 조직의 structured data를 다루는 경우가 많았다. Big Data는 이 범위를 넘어, relational form이 아닐 수도 있고 한 enterprise가 생성하는 규모를 훨씬 넘는 데이터를 저장·처리해야 하는 상황을 가리킨다.

Chapter 10의 관점은 Big Data system 내부 구현을 깊게 파는 것이 아니라, programmer/user가 Big Data storage system, MapReduce, algebraic framework, streaming data, graph database를 어떻게 이해하고 사용하는가에 있다. 핵심 질문은 “데이터가 너무 크고 빠르고 다양한데, 어떻게 병렬 저장과 병렬 처리를 programmer가 직접 모두 관리하지 않고 수행할 것인가”다.

## 핵심 개념

- `Big Data`는 단순히 데이터 양이 많은 것만이 아니라, 높은 parallelism 없이는 처리하기 어려운 데이터 처리 요구를 넓게 가리킨다.
- `Volume`, `Velocity`, `Variety`는 Big Data를 전통적 relational database와 대비할 때 자주 쓰는 세 가지 축이다.
- `node`는 Big Data cluster 안의 한 machine을 가리키는 용어다.
- Big Data application은 크게 high-scalability transaction processing과 non-relational large-scale query processing 요구로 나뉜다.
- `key-value store`는 key로 data object를 저장·조회하는 storage model이며, join이 필요한 작업을 application code나 materialized view 방식으로 우회할 수 있다.
- Big Data query framework의 가치는 programmer가 parallelization, failure handling, load imbalance 같은 low-level 문제를 직접 다루지 않게 해 주는 데 있다.

## 세부 정리

### 10.1 Motivation

World Wide Web의 성장으로 웹 사이트는 user가 어떤 page를 언제 방문했는지, 어떤 link를 클릭했는지, 어떤 product를 보거나 샀는지 같은 대량의 interaction data를 만들기 시작했다. 초기에는 사용자에게 보이는 data가 static page인 경우가 많았지만, server side에는 web log가 빠르게 쌓였다. Web log에는 user behavior, marketing, advertisement targeting, site structure 개선에 사용할 수 있는 정보가 들어 있었다.

이 데이터는 기존 DBMS가 예상하던 enterprise structured data와 달랐다. 양은 훨씬 컸고, 생성 속도도 빨랐으며, log record, semi-structured data, social-media data처럼 형식도 다양했다. 그래서 storage와 processing 모두 높은 수준의 parallelism을 요구했다.

Big Data를 설명하는 세 가지 기준은 다음과 같다.

| 기준 | 의미 | 설계상 영향 |
|---|---|---|
| `Volume` | 저장·처리해야 할 데이터 양이 전통적 database, 초기 parallel database가 다루던 규모보다 큼 | 수천 대 이상의 machine을 병렬로 사용하는 cluster 필요 |
| `Velocity` | 데이터 도착 속도가 매우 높고, 도착 즉시 처리해야 하는 경우가 많음 | high-rate ingest, streaming data system, 빠른 event detection 필요 |
| `Variety` | relational data뿐 아니라 semi-structured data, text, graph data 등 여러 표현이 혼재 | SQL만으로 표현·평가하기 어려운 computation을 위한 새 language/framework 필요 |

책은 Big Data를 엄격히 “몇 TB 이상” 같은 크기 기준으로 정의하지 않는다. 대신 data가 relational인지 여부와 무관하게, 처리하려면 high degree of parallelism이 필요한 data-processing need를 Big Data라고 부른다.

#### 10.1.1 Sources and Uses of Big Data

초기 Big Data의 큰 원천은 web server log였다. 수억에서 수십억 user가 매일 여러 link를 클릭하면, web company는 하루에도 multiple terabytes 수준의 데이터를 생성한다. 이 데이터는 단순 기록이 아니라 서비스 개선과 수익화의 근거가 된다.

Web log와 user interaction data의 대표 활용은 다음과 같다.

| 활용 | 필요한 데이터 | 목적 |
|---|---|---|
| personalized content | user가 이전에 본 page, 비슷한 preference의 user가 본 content | user engagement 증가 |
| advertisement targeting | 방문 page, 이전 ad click, user profile | relevant ad 노출과 광고 효과 극대화 |
| site structure 개선 | user navigation path, 특정 page 다음에 보는 page | 대부분의 user가 정보를 쉽게 찾게 함 |
| business intelligence | page view, user preference, trend | 생산·재고·marketing 결정 지원 |
| click-through/conversion 분석 | advertisement display, click, purchase 여부 | 어떤 advertisement를 계속 노출할지 결정 |

오늘날의 Big Data source는 web log에 한정되지 않는다. mobile phone app의 interaction data, online/offline retail transaction data, sensor data, network metadata도 중요한 원천이다. 특히 sensor와 embedded computing device가 internet에 연결되는 `internet of things(IoT)`에서는 인간 사용자보다 많은 device가 지속적으로 상태 데이터를 생성한다.

Social media data는 Volume과 Velocity가 동시에 높은 예다. 어떤 광고나 제품 변경에 대한 부정적 반응이 Twitter 같은 social media에서 빠르게 확산되면, 회사는 이를 빨리 감지하고 광고 중단이나 대응을 해야 한다. 이처럼 Big Data는 단순 저장 기술이 아니라 빠른 organizational decision을 가능하게 하는 기반이 된다.

#### 10.1.2 Querying Big Data

SQL은 relational database query language로 가장 널리 쓰이지만, Big Data application에서는 data type이 더 다양하고 data volume/velocity가 훨씬 크기 때문에 query option도 다양해진다. 특히 매우 많은 machine에서 parallel storage와 parallel processing을 해야 한다.

Big Data application의 요구는 크게 두 부류로 나눌 수 있다.

| 부류 | 특징 | 대표 storage/query 접근 |
|---|---|---|
| high-scalability transaction processing | 매우 많은 short-running query/update를 처리 | full relational feature를 완화하고 `key-value store` 사용 |
| non-relational large-scale query processing | log, document, image, video, web data처럼 relational form이 아닌 데이터를 분석 | 파일 기반 대량 저장과 arbitrary program code 기반 병렬 query |

`key-value store`는 key와 data object를 연결해 저장하고, key로 빠르게 조회한다. User profile data라면 user identifier가 key가 된다. 이런 storage system은 join을 기본 연산으로 제공하지 않을 수 있지만, application이 join을 우회하는 방식으로 작업을 수행한다.

Social networking의 news feed를 예로 들면, user에게 friend들의 새 post를 보여 주는 작업은 relational model에서는 join이 필요하다. key-value store에서는 두 가지 절충이 가능하다.

| 방식 | 동작 | 장점 | 비용 |
|---|---|---|---|
| query-time join in application code | user의 friend set을 찾고, 각 friend object를 조회해 post를 모음 | storage 중복이 적음 | read/query time cost가 큼 |
| write-time materialization | user가 post하면 각 friend object에 summary를 미리 저장 | read가 빠름 | write cost와 storage cost가 큼 |

이 trade-off는 Chapter 16의 materialized view와도 연결된다. 계산을 읽을 때 할지, 쓸 때 미리 해 둘지에 따라 read latency, write amplification, storage overhead가 달라진다.

두 번째 부류는 web server log analysis, keyword search, document indexing처럼 data가 file에 저장되고 output도 꼭 relation이 아닌 경우다. Text, image, video data processing은 SQL constructs만으로 자연스럽게 표현하기 어렵다. 과거에는 stand-alone program으로 처리했지만, Big Data 규모에서는 parallelization과 failure handling이 필수라 단독 프로그램 방식의 한계가 드러났다.

Big Data query technique의 성공 요인은 complex data processing task를 표현하면서도, parallelization, failure handling, load imbalance 처리 같은 low-level 문제를 framework가 맡아 준다는 데 있다. 이 흐름이 다음 절의 Big Data storage system과 MapReduce paradigm으로 이어진다.

### 10.2 Big Data Storage Systems

Big Data application은 수억 user와 빠르게 증가하는 load를 감당해야 하므로, data를 수천 개의 computing/storage node에 나누어 저장한다. 이 절의 핵심은 “어떤 storage abstraction을 제공하면서 scale-out을 얻는가”다.

대표적인 Big Data storage system은 다음 네 부류로 볼 수 있다.

| Storage system | 제공하는 abstraction | 주 용도 |
|---|---|---|
| `distributed file system` | 여러 machine에 나뉘어 저장된 file을 단일 file system처럼 접근 | large log file, web page, image 같은 unstructured data 저장 |
| `sharding` across databases | 여러 centralized database에 record를 partition | 기존 DB 기반 application을 여러 user partition으로 확장 |
| `key-value store` / `NoSQL system` | `put(key,value)`, `get(key)` 중심의 단순 record access | 매우 많은 small record의 빠른 lookup/update |
| `parallel/distributed database` | 전통적 database interface + 여러 machine storage/query | relational query와 병렬 처리의 결합 |

#### 10.2.1 Distributed File Systems

`distributed file system`은 많은 machine에 file block을 나누어 저장하면서 client에게는 file name과 directory가 있는 하나의 file system처럼 보이게 한다. Client는 file이 실제 어느 machine에 있는지 알 필요가 없다. 이런 구조는 web server logs, web pages, images처럼 large file로 저장되는 unstructured data에 적합하다.

Distributed file system은 large file 저장을 목표로 한다. File size는 수십 MB에서 수백 GB 이상일 수 있다. 각 file은 여러 block으로 쪼개지고, block은 여러 machine에 partition된다. 또한 각 block은 보통 세 개 정도의 machine에 replicated되어, machine failure가 발생해도 file이 inaccessible해지지 않게 한다.

일반 file system은 다음 mapping을 관리한다.

| 관리 정보 | 중앙/분산 file system에서의 의미 |
|---|---|
| directory hierarchy | file과 directory name을 계층적으로 조직 |
| file name → block identifier sequence | file이 어떤 block들로 구성되는지 기록 |
| block identifier → block data | 실제 storage device 또는 machine에서 block을 읽고 씀 |

Distributed file system에서는 block identifier만으로 부족하고, 각 block copy가 있는 machine identifier도 필요하다. Replication 때문에 하나의 block identifier는 여러 machine identifier와 연결된다.

![Figure 10.1](@/assets/images/cs-database-152-figure-10-1-page-503.png)
*Figure 10.1 · PDF p. 503 · NameNode가 metadata를 관리하고 DataNode들이 block을 저장·replicate하는 HDFS architecture*

Figure 10.1의 Hadoop Distributed File System(HDFS)은 Google File System(GFS) 계열의 구조를 보여 준다. 핵심 구성 요소는 `NameNode`와 `DataNode`다.

| 구성 요소 | 역할 |
|---|---|
| `NameNode` | file name, block identifier, replica location 같은 metadata 관리 |
| `BackupNode` | NameNode metadata의 backup 역할 |
| `DataNode` | 실제 file block 저장 |
| `Client` | NameNode에서 metadata를 받은 뒤 DataNode에서 block read/write |

Read 흐름은 다음과 같다. Client가 file path를 NameNode에 보내면, NameNode는 해당 file의 block identifier sequence와 각 block copy가 있는 DataNode 목록을 반환한다. Client는 각 block을 그 block copy를 가진 DataNode 중 하나에서 직접 가져온다.

Write 흐름에서는 NameNode가 새 block identifier를 만들고, 각 block을 저장할 여러 DataNode를 배정한다. Client는 block identifier와 block data를 배정된 DataNode에 보내고, DataNode들은 replication을 수행한다. 즉 metadata path와 data path가 분리되어 있어 NameNode가 모든 file content를 중계하지 않는다.

#### 10.2.2 Sharding

`sharding`은 data를 여러 database 또는 machine에 partition하는 방식이다. 수백만~수십억 user를 가진 application에서는 하나의 centralized database가 storage나 processing speed를 감당하지 못할 수 있다. 이때 user/account identifier 같은 `partitioning key` 또는 `shard key`로 record를 나누어 여러 database에 배치한다.

대표 partitioning 방식은 두 가지다.

| 방식 | 동작 | 장점/주의점 |
|---|---|---|
| `range partitioning` | key range별로 database를 배정, 예: 1-100000은 DB1 | range query에 유리할 수 있지만 skew가 생길 수 있음 |
| `hash partitioning` | hash(key)로 partition number 결정 | 분산이 비교적 균등하지만 range locality가 약함 |

Application code가 sharding을 직접 수행하면, application은 어떤 key가 어느 database에 있는지 알아야 하고 query를 적절한 database로 routing해야 한다. 여러 database의 data를 함께 읽거나 update해야 하는 query는 단일 SQL query처럼 처리하기 어렵다. Application이 여러 database에서 읽어 final result를 조립하거나, 여러 database update의 atomicity를 직접 고려해야 한다.

Sharding은 빠르게 scale-out할 수 있는 실용적 방법이지만, 시간이 지나면 한계가 드러난다. Partition mapping 관리, overloaded shard에서 data를 다른 shard로 옮기는 rebalancing, machine failure에 대비한 replication, replica consistency 관리가 application 부담이 된다. 이런 문제를 storage system 쪽으로 옮긴 것이 parallel key-value store다.

#### 10.2.3 Key-Value Storage Systems

많은 web application은 billions 또는 trillions개의 비교적 작은 record를 저장한다. 각 record 크기는 몇 KB에서 몇 MB 수준일 수 있다. 이런 record를 file 하나씩 저장하는 것은 file system에 맞지 않는다.

`key-value store`는 key와 value record를 연결해 저장하고, key로 record를 찾는 단순 interface를 제공한다.

```text
put(key, value)  // key에 value 저장 또는 갱신
get(key)         // key에 대응되는 value 조회
```

Parallel key-value store는 key space를 여러 machine에 partition하고, lookup/update를 올바른 machine으로 routing한다. 또한 replication, replica consistency, machine 추가 시 load balancing을 storage system이 담당한다. Application-level sharding보다 널리 쓰이는 이유는 이 운영 부담을 application code에서 제거하기 때문이다.

Key-value store는 full-fledged database가 아니다. 일반적으로 다음 기능을 희생하거나 제한해 scalability를 얻는다.

| 제한되는 기능 | 이유/영향 |
|---|---|
| SQL 같은 declarative query | key lookup 중심으로 단순화해 scale-out을 쉽게 함 |
| full transaction | 여러 machine에 걸친 atomic commit과 concurrency control이 어려움 |
| foreign-key constraint | partition/replication 환경에서 비용이 큼 |
| non-key attribute selection | 일부 document store만 제한적으로 지원 |

이 때문에 key-value store는 `NoSQL system`이라고도 불렸다. 초기에는 SQL 미지원이 장점처럼 여겨졌지만, 시간이 지나며 SQL과 transaction 부재가 application development를 복잡하게 만든다는 점도 분명해졌다. 그래서 많은 key-value/document store가 SQL-like query나 transaction 기능을 일부 추가하는 방향으로 발전했다.

`document store`는 key-value store 중 value에 structure/schema를 허용하는 부류다. MongoDB는 JSON format document를 저장하는 대표 예다.

![Figure 10.2](@/assets/images/cs-database-153-figure-10-2-page-507.png)
*Figure 10.2 · PDF p. 507 · MongoDB에서 collection 생성, JSON document insert, find/remove/drop을 수행하는 shell command 예*

Figure 10.2는 MongoDB의 감각을 잘 보여 준다. `db.createCollection("student")`는 collection을 만들고, `db.student.insert({...})`는 JSON object 형태의 student document를 넣는다. `db.student.find()`는 collection의 object들을 JSON 형태로 반환하고, `findOne({"ID": "00128"})`처럼 attribute 조건으로 하나를 찾을 수 있다. MongoDB는 inserted object에 identifier를 자동 생성하고, 이 identifier에 index를 만든다. 또한 JSON object의 특정 attribute에 index를 만들 수도 있다.

MongoDB cluster에서는 shard key로 partitioning을 수행하고, client request는 router를 거쳐 적절한 partition으로 전달된다. 각 partition은 여러 machine에 replicated되어 machine failure에도 data를 읽을 수 있게 한다.

Bigtable은 다른 형태의 key-value/document-like storage를 보여 준다. Bigtable의 record는 여러 attribute를 가질 수 있지만, attribute name set이 record마다 달라도 된다. 개념적으로 attribute value의 key는 `(record-identifier, attribute-name)`이다. 모든 attribute를 가져오려면 record identifier prefix에 대한 range/prefix-match query를 사용한다. Efficient retrieval을 위해 key 순서로 저장하므로, 같은 record의 attribute들이 모여 있게 된다.

Bigtable은 versioned data도 지원한다. Key는 실제로 `(record-identifier, attribute-name, timestamp)`처럼 version 정보를 포함할 수 있고, lookup은 특정 version이나 가장 높은 version을 선택할 수 있다. HBase는 Bigtable의 open-source 계열로 널리 사용된다.

#### 10.2.4 Parallel and Distributed Databases

`parallel database`는 여러 machine으로 구성된 cluster에 data를 저장하고, large query를 여러 machine에서 병렬로 처리하는 database다. Programmer 관점에서는 단일 machine database와 비슷한 interface를 제공한다.

초기 parallel database는 transaction processing용으로는 몇 대, analytical query용으로는 수십~수백 대 정도를 대상으로 했다. 이 규모에서는 query 실행 중 failure가 흔하지 않으므로, 어떤 node가 실패하면 replica를 사용해 query를 restart하는 방식이 가능했다.

하지만 수천~수만 node에서 오래 실행되는 query는 실행 중 failure가 발생할 확률이 매우 높다. 전체 query를 처음부터 restart하면 다시 failure를 만날 가능성도 크다. MapReduce 계열 system은 failed machine의 computation만 다시 수행하는 fault-tolerance technique을 발전시켰지만, 이 방식은 overhead도 있다. 따라서 많은 parallel relational database는 여전히 수십~수백 machine 규모의 workload를 주 대상으로 삼는다.

#### 10.2.5 Replication and Consistency

`replication`은 data item을 여러 machine에 복제해 machine failure가 있어도 data를 읽을 수 있게 하는 핵심 기법이다. 문제는 update다. 어떤 data item이 여러 replica에 있으면 update가 모든 replica에 적용되어야 한다.

Failure가 있는 distributed storage에서는 두 문제가 중요해진다.

| 문제 | 의미 |
|---|---|
| atomic execution across machines | 여러 machine의 data를 update하는 transaction이 실패에도 all-or-nothing으로 끝나야 함 |
| replicated data consistency | live replica들이 같은 value를 가져야 하고 read가 latest version을 보아야 함 |

Replica consistency를 보장하는 많은 solution은 majority of replicas가 read/update에 참여할 수 있음을 요구한다. 예를 들어 replica가 3개면 1개 failure까지, replica가 5개면 2개 failure까지 견딜 수 있다. Majority가 있으면 write가 block되지 않고 read가 최신 값을 보도록 설계할 수 있다.

하지만 `network partition`이 생기면 문제가 더 어려워진다. Network partition은 살아 있는 두 machine이 서로 통신하지 못하는 상태다. Partition이 있을 때는 availability, 즉 read/write 가능성을 보장하면서 동시에 consistency를 보장하는 protocol은 존재하지 않는다. 따라서 distributed system은 trade-off를 선택해야 한다.

| 선택 | 얻는 것 | 잃는 것 |
|---|---|---|
| availability 우선 | partition 중에도 read/write 계속 허용 | old value read, replica divergence, merge 필요 |
| consistency 우선 | latest value와 replica agreement 유지 | partition 동안 일부 read/write가 unavailable할 수 있음 |

이 논의는 흔히 CAP trade-off로 설명되며, Chapter 23의 distributed transaction processing, replication, weak consistency와 직접 연결된다.

원문 Note 10.1의 실용적 결론은 하나의 system이 모든 요구를 만족하기 어렵다는 것이다. 단순 key lookup이 많은 user profile/account data는 parallel key-value store에 두고, complex query가 필요한 relation은 relational database에 두며, read-heavy workload는 replica나 memcached/Redis 같은 in-memory cache로 offload하는 조합이 흔하다. 단, cache update와 stale read 문제는 application이 책임져야 한다.

### 10.3 The MapReduce Paradigm

`MapReduce paradigm`은 대량의 input record 각각에 `map()`을 적용하고, 그 결과를 key별로 모은 뒤 `reduce()`로 aggregate하는 병렬 처리 모델이다. Programmer는 핵심 logic인 `map()`과 `reduce()`를 작성하고, job startup, task scheduling, network data exchange, failure recovery 같은 plumbing은 MapReduce system이 담당한다.

#### 10.3.1 Why MapReduce?

Word count를 생각해 보자. 단일 file이라면 file을 순차적으로 읽으며 in-memory hash table에 word count를 누적하면 된다. 그러나 수만 개 file, 각 file이 수십~수백 MB라면 sequential processing은 현실적이지 않다. 여러 machine이 file 일부를 나누어 처리하고 local count를 만든 뒤, 같은 word의 count를 다시 합쳐야 한다.

직접 parallel program을 작성하면 다음을 모두 처리해야 한다.

| 직접 구현해야 하는 plumbing | 의미 |
|---|---|
| job startup | 여러 machine에 작업 시작 |
| coordination | 어느 machine이 어떤 file/partition을 처리할지 배정 |
| data exchange | 같은 key의 partial result를 한곳으로 모음 |
| failure handling | machine failure가 있어도 전체 job 완료 |
| load imbalance handling | 특정 machine만 오래 걸리는 상황 완화 |

MapReduce의 가치는 이 plumbing을 재사용 가능한 system으로 감추는 데 있다. Programmer는 대부분 parallel execution 자체를 의식하지 않고, record별 transformation과 key별 aggregation을 표현한다.

#### 10.3.2 MapReduce By Example 1: Word Count

MapReduce에서 `map()`은 각 input record에 대해 zero or more `(key, value)` pair를 emit한다. Word count에서는 보통 input file의 한 line을 record로 보고, line을 word로 나눈 뒤 각 word마다 `(word, 1)`을 출력한다. 여기서 map output의 key는 `reduce key`가 된다.

![Figure 10.3](@/assets/images/cs-database-154-figure-10-3-page-514.png)
*Figure 10.3 · PDF p. 514 · word count를 위한 map()과 reduce() pseudocode*

Figure 10.3의 `map(String record)`는 record 안의 각 word에 대해 `emit(word, 1)`을 수행한다. `reduce(String key, List value_list)`는 key가 같은 values를 모두 더해 `output(word, count)`를 만든다.

예를 들어 line이 `"One a penny, two a penny, hot cross buns."`라면, map output은 대략 다음과 같다.

```text
("one", 1), ("a", 1), ("penny", 1), ("two", 1),
("a", 1), ("penny", 1), ("hot", 1), ("cross", 1), ("buns", 1)
```

MapReduce system은 map output의 `(key, value)` pair를 key별로 group 또는 sort한다. 그 결과 reduce input은 다음처럼 key와 value list가 된다.

```text
("a", [1,1]), ("buns", [1]), ("cross", [1]), ("hot", [1]),
("one", [1]), ("penny", [1,1]), ("two", [1])
```

이 key별 모으기 단계가 `shuffle`이다. 많은 machine의 map output에서 같은 key의 value를 한 reduce task로 보내야 하므로, shuffle은 MapReduce의 핵심 network exchange 단계다.

#### 10.3.3 MapReduce by Example 2: Log Processing

Log processing 예시는 MapReduce가 database query와 닮은 분석 작업에도 쓰일 수 있음을 보여 준다. 목표는 web log에서 특정 기간, 특정 directory의 file access count를 구하는 것이다. 각 input record는 log file의 한 line이고, field는 date, time, filename으로 나뉜다.

![Figure 10.5](@/assets/images/cs-database-156-figure-10-5-page-516.png)
*Figure 10.5 · PDF p. 516 · date range와 filename prefix 조건을 검사해 filename count pair를 emit하는 map() 예*

Figure 10.5의 `map()`은 record를 token으로 나누고, date가 2013/01/01부터 2013/01/31 사이이며 filename이 `slide-dir`로 시작하면 `(filename, 1)`을 emit한다. 이는 relational query의 selection과 grouping 준비를 map 단계에서 수행하는 것과 비슷하다.

![Figure 10.6](@/assets/images/cs-database-157-figure-10-6-page-516.png)
*Figure 10.6 · PDF p. 516 · filename별 value list를 더해 file access count를 출력하는 reduce() 예*

Figure 10.6의 `reduce()`는 key인 filename과 그 filename에 대응하는 value list를 받아 count를 합산한다. 값이 모두 1이면 list 길이만 세도 되지만, MapReduce system은 map node에서 partial addition 같은 optimization을 수행할 수 있으므로 reduce는 values를 합산하는 일반 형태로 쓰는 편이 좋다.

![Figure 10.7](@/assets/images/cs-database-158-figure-10-7-page-517.png)
*Figure 10.7 · PDF p. 517 · map input에서 map output을 거쳐 reduce input으로 key/value가 재구성되는 흐름*

Figure 10.7은 MapReduce의 본질을 도식화한다. map input의 key/value는 `map()`을 거치며 reduce key/value로 바뀐다. 그 뒤 system은 같은 reduce key를 가진 values를 한 list로 모아 reduce input을 만든다. 즉 MapReduce programmer가 작성하는 것은 transformation과 aggregation이고, grouping/shuffle은 framework가 수행한다.

#### 10.3.4 Parallel Processing of MapReduce Tasks

MapReduce code의 의미는 sequential하게 이해할 수 있지만, 목적은 parallel processing이다. System은 여러 machine에서 map task를 동시에 실행하고, 각 map task는 file 일부 또는 file partition을 처리한다. Reduce task도 여러 machine에서 병렬 실행되며, 각 reduce task는 reduce key의 subset을 처리한다.

![Figure 10.8](@/assets/images/cs-database-159-figure-10-8-page-518.png)
*Figure 10.8 · PDF p. 518 · master가 map/reduce task를 배정하고 intermediate files를 reduce task가 remote read/sort하는 병렬 MapReduce 실행*

Figure 10.8의 흐름은 다음과 같다.

| 단계 | 설명 |
|---|---|
| input partitioning | input file을 `Part i`로 나누어 map task가 병렬 read |
| map local write | 각 Map node가 reduce key 기준으로 sorted/partitioned intermediate file 생성 |
| shuffle/remote read | Reduce task가 여러 Map node의 intermediate file을 network로 가져옴 |
| merge/sort | reduce key별 value가 모이도록 merge/sort |
| reduce output | reduce result를 output file에 write |

File input/output도 병렬화되어야 한다. Input data가 한 machine file system에 있으면 그 machine이 bottleneck이 된다. 그래서 MapReduce는 HDFS 같은 distributed file system과 함께 쓰이며, HBase, MongoDB, Cassandra, Dynamo 같은 Big Data storage system도 storage adapter를 통해 input/output으로 사용할 수 있다.

#### 10.3.5 MapReduce in Hadoop

Hadoop은 Java 기반의 widely used open-source MapReduce implementation이다. 실제 Hadoop MapReduce는 단순 pseudocode보다 많은 type과 class를 요구한다. Programmer는 Hadoop `Mapper`와 `Reducer` class를 확장하고, input key/value type, output key/value type을 지정한다.

Hadoop에서는 file을 record로 나누는 input format도 중요하다. `TextInputFormat`은 file을 line 단위 record로 나누고, map key는 file offset, map value는 line content가 된다. Avro, ORC, Parquet 같은 compressed file format도 널리 쓰이며, decompression은 system이 담당한다.

`combine()` function은 map task가 실행된 node에서 reduce operation의 일부를 먼저 수행하는 optimization이다. Word count에서는 local word count를 미리 합산해 같은 word에 대해 하나의 partial count만 network로 보내게 할 수 있다. 이 때문에 network traffic이 줄어든다. 단, combine이 항상 가능한 것은 아니며, operation이 partial aggregation 후 다시 reduce해도 같은 결과를 내야 한다.

Hadoop의 한 MapReduce step은 하나의 map과 하나의 reduce를 실행한다. 여러 단계가 필요한 program은 여러 MapReduce step을 순차 실행하고, 각 step의 reduce output을 distributed file system에 쓴 뒤 다음 step이 다시 읽는다. 이 방식은 fault tolerance에는 유리하지만, 중간 결과를 계속 file system에 쓰고 읽는 overhead가 생긴다. 이 한계가 10.4의 algebraic/DAG framework로 이어진다.

#### 10.3.6 SQL on MapReduce

MapReduce는 SQL로 표현하기 어려운 non-relational computation에도 쓰인다. 예를 들어 web search engine의 `inverted index` 생성이나 `PageRank` 계산은 단순 SQL query로 자연스럽게 표현하기 어렵다.

그러나 많은 data processing task는 SQL이나 relational algebra로 훨씬 간결하게 표현할 수 있다. 문제는 data가 database가 아니라 file system에 있고, traditional database가 그런 file을 직접 병렬 처리하지 못했다는 점이다.

Relational operation은 MapReduce로 구현할 수 있다.

| Relational operation | MapReduce 구현 아이디어 |
|---|---|
| selection | `map()`이 조건을 검사하고 만족하는 record만 emit |
| group by + aggregate | group by attribute를 reduce key로 emit하고 `reduce()`가 aggregate 계산 |
| equijoin `r ⋈ r.A=s.A s` | `map()`이 join attribute value를 key로 emit하고 relation tag를 붙임, `reduce()`가 같은 key의 r tuple과 s tuple cross product 출력 |

하지만 사람이 SQL query를 직접 MapReduce program으로 바꾸는 것은 번거롭다. 그래서 Hive, SCOPE, Pig 같은 system은 SQL variant 또는 relational algebra 기반 language를 받아 MapReduce job sequence로 compile한다. 이런 system은 file system에서 data를 직접 읽으면서도 programmer가 input data를 record format으로 변환하는 함수를 정의할 수 있게 한다.

오늘날 Hive 구현은 SQL을 MapReduce step sequence뿐 아니라 algebraic operation tree로 compile할 수 있다. Apache Tez와 Spark는 parallel environment에서 operation tree 또는 Directed Acyclic Graph(DAG)를 실행하는 platform이며, 다음 절의 주제가 된다.

### 10.4 Beyond MapReduce: Algebraic Operations

Relational algebra는 query를 operation tree로 모델링한다. Big Data의 later-generation parallel processing system은 이 아이디어를 relational data에만 제한하지 않고, complex data type을 가진 dataset에도 확장한다. 즉 operator가 하나 이상의 dataset을 input으로 받고, 하나 이상의 dataset을 output으로 내는 `algebraic operation`으로 data processing을 표현한다.

#### 10.4.1 Motivation for Algebraic Operations

MapReduce만으로도 selection, group by, join을 구현할 수 있지만, 매번 `map()`과 `reduce()`로 간접 표현하는 것은 번거롭다. Programmer가 join을 원한다면 join operator를 직접 쓰는 편이 자연스럽고, system도 join에 맞는 parallel join algorithm을 사용해 더 효율적으로 실행할 수 있다.

Algebraic framework가 필요한 이유는 다음과 같다.

| 이유 | 설명 |
|---|---|
| expressiveness | join, outerjoin, semijoin, machine-learning operator 같은 고수준 연산을 직접 표현 |
| optimization | operation tree/DAG를 보고 더 빠른 plan으로 rewrite 가능 |
| efficiency | MapReduce step으로 억지 변환하는 것보다 operation별 parallel algorithm 사용 가능 |
| complex data support | atomic column만이 아니라 arbitrary type record와 programming language 수준 expression 지원 |

Machine-learning model도 algebraic operator처럼 볼 수 있다. 예를 들어 trained model은 record set을 input으로 받아 예측값 attribute를 추가한 record set을 output할 수 있다. Training algorithm은 training record set을 input으로 받아 learned model을 output하는 operator로 볼 수 있다. 여러 단계의 data processing은 pipeline, tree, 또는 DAG로 표현된다.

Apache Tez는 low-level API를 제공해 system implementor가 DAG node마다 실행할 code를 지정하게 한다. Hive on Tez는 SQL query를 Tez 위에서 실행되는 algebraic operation으로 compile한다. Tez 자체는 application programmer가 직접 쓰기보다는, Hive 같은 상위 system의 execution engine에 가깝다.

#### 10.4.2 Algebraic Operations in Spark

Apache Spark는 application programmer가 쓰기 쉬운 high-level API를 제공하는 parallel data processing system이다. Spark의 기본 data abstraction은 `Resilient Distributed Dataset(RDD)`다. RDD는 여러 machine에 partition되어 저장될 수 있는 record collection이며, `resilient`는 failure가 있어도 record를 다시 얻을 수 있는 성질을 뜻한다.

Spark operator는 RDD를 input으로 받아 RDD를 output한다. RDD 안의 record type은 application이 정할 수 있다. Structured data에는 `DataSet` abstraction도 제공한다.

![Figure 10.10](@/assets/images/cs-database-161-figure-10-10-page-526.png)
*Figure 10.10 · PDF p. 526 · Spark RDD API로 word count를 작성한 Java 예*

Figure 10.10의 word count 흐름은 MapReduce와 유사하지만 표현 방식이 operation chain이다.

| Spark operation | 역할 | MapReduce 관점 |
|---|---|---|
| `spark.read().textFile(...).javaRDD()` | input file/directory를 line 단위 RDD로 읽음 | input record 생성 |
| `flatMap()` | 각 line을 여러 word로 펼쳐 `words` RDD 생성 | map이 여러 output을 emit하는 효과 |
| `mapToPair()` | 각 word를 `(word, 1)` pair로 변환 | map output key/value 생성 |
| `reduceByKey()` | 같은 word의 values를 더함 | shuffle + reduce |
| `saveAsTextFile()` | output을 file system에 저장 | reduce output write |
| `collect()` | 결과를 single machine으로 가져옴 | local 후처리용 action |

Spark의 `flatMap()`은 input record 하나에서 여러 output record를 만들 때 사용된다. Java iterator를 반환하는 function을 각 line에 적용하고, 모든 iterator output을 합쳐 하나의 RDD를 만든다. `mapToPair()`는 pair RDD를 만들며, `reduceByKey((i1, i2) -> i1 + i2)`는 first attribute인 key별로 grouping하고 second attribute를 aggregation한다.

Spark parallelism의 핵심은 두 가지다.

| 핵심 | 의미 |
|---|---|
| RDD partitioning | RDD record가 여러 machine에 나뉘어 저장될 수 있음 |
| operator parallel execution | 각 machine이 자기 partition에 대해 operation을 병렬 실행 |

`reduceByKey()`처럼 같은 group의 record를 한 machine에 모아야 하는 operation은 input RDD를 repartition한다. 이 과정은 MapReduce의 shuffle과 닮았다. 다만 Spark는 programmer에게 operation chain을 더 직접적으로 보여 주고, system은 내부에서 필요한 data movement를 수행한다.

Spark의 중요한 특징은 `lazy evaluation`이다. Code가 `flatMap()`, `mapToPair()`, `reduceByKey()`를 호출한다고 해서 즉시 실행되는 것이 아니다. 이 호출들은 operation tree를 만든다. `saveAsTextFile()`이나 `collect()`처럼 결과가 실제로 필요해지는 action이 호출될 때 tree가 평가된다.

Lazy evaluation의 장점은 optimizer가 실행 전에 tree를 rewrite할 수 있다는 점이다. 이는 Chapter 16의 query optimization과 같은 사고방식이다. Operation tree가 아니라 어떤 operation result가 여러 parent에 의해 사용되면 구조는 `Directed Acyclic Graph(DAG)`가 된다.

RDD는 text 같은 data에는 잘 맞지만, 많은 Big Data application은 multiple attribute를 가진 structured records를 다룬다. Spark의 `DataSet`과 `DataSet<Row>`는 attribute name이 있는 record를 표현하고, Parquet, ORC, Avro 같은 compressed structured file format 및 JDBC relation과 잘 연결된다. 예를 들어 Spark는 Parquet file에서 `instructor`, `department` relation을 읽고, `filter`, `join`, `groupBy`, `agg(count(...))` 같은 relational operation을 algebraic chain으로 표현할 수 있다.

Spark는 `DataSet<Instructor>`처럼 Row가 아닌 class 기반 DataSet도 지원한다. 이 경우 class의 `getAttr()`/`setAttr()` method를 통해 attribute를 읽고 쓸 수 있고, compile time에 type을 알 수 있어 `Row` 기반 접근보다 compact하고 runtime name lookup 비용이 줄어든다. Spark는 database operation뿐 아니라 machine learning 관련 algebraic operation도 지원한다.

### 10.5 Streaming Data

`streaming data`는 continuous fashion으로 도착하는 data다. Stored database에 대해 analyst가 ad hoc query를 실행하거나, 매일 새벽 batch summary를 만드는 것과 달리, stream application은 data가 도착하는 즉시 real time 또는 bounded delay 안에 처리해야 한다.

#### 10.5.1 Applications of Streaming Data

Streaming data가 필요한 domain은 다양하다.

| Domain | Stream tuple 예 | Real-time requirement |
|---|---|---|
| stock market | trade tuple | pattern을 보고 매수/매도 또는 불법 거래 탐지, microseconds 수준 지연 요구 가능 |
| e-commerce | purchase, search event | 광고 campaign 효과, product sales spike, abnormal user behavior 탐지 |
| sensors / IoT | vehicle/building/factory sensor reading | abnormal reading에 대한 alarm, fault detection, central cloud monitoring |
| network data | packet/flow summary tuple | link failure, denial-of-service attack, malware propagation 탐지 |
| social media | post, tweet, message | follower routing, ranking, negative sentiment alert |

Streaming workload는 `Velocity`의 대표 사례다. 데이터가 많이 쌓인 뒤 분석하는 것도 중요하지만, 어떤 pattern은 늦게 발견하면 가치가 사라진다. 그래서 stream processing은 high throughput뿐 아니라 low latency도 요구한다.

#### 10.5.2 Querying Streaming Data

Stored data는 `data-at-rest`라고 부를 수 있다. Stream은 반대로 unbounded하다. Conceptually 끝나지 않을 수 있으므로, “stream 전체 tuple 수”처럼 모든 tuple을 본 뒤에야 답을 낼 수 있는 query는 final result를 낼 수 없다.

Unbounded stream을 다루는 대표 방법은 두 가지다.

| 방법 | 설명 |
|---|---|
| `window` 정의 | timestamp range 또는 tuple count로 stream의 finite subset을 만들고 그 안에서 query 수행 |
| incremental result update | 현재 시점까지 맞는 결과를 내고, 새 tuple이 오면 result update를 stream으로 출력 |

Streaming data query 접근은 크게 네 가지다.

| 접근 | 핵심 아이디어 | 장점/주의점 |
|---|---|---|
| `continuous query` | incoming stream을 relation insert처럼 보고 query를 계속 실행 | 조건 만족 insert 관찰에는 유용하지만 high-rate aggregate에서는 update flood 발생 |
| `stream query language` | SQL/relational algebra를 확장하고 stream과 relation을 구분 | window operation으로 finite relation을 만든 뒤 relational operation 수행 |
| `algebraic operators on streams` | user-defined operator가 tuple마다 실행되고 internal state 유지 | SQL로 어려운 streaming logic에 적합 |
| `complex event processing(CEP)` | pattern + action rule을 정의하고 matching subsequence 발견 시 action 실행 | event pattern detection에 적합 |

Stream query language에서 중요한 것은 window다. Stream이 timestamp 증가를 보장하면 window end보다 큰 timestamp tuple을 본 순간 그 window가 complete되었다고 판단할 수 있다. Timestamp 순서가 보장되지 않는 stream은 `punctuation` metadata tuple을 보내 “이후 tuple은 특정 timestamp보다 크다”는 정보를 제공할 수 있다.

Many stream-processing systems는 minimum delay를 위해 in-memory 처리에 집중하고 persistence guarantee를 제공하지 않을 수 있다. 하지만 나중에 batch query도 해야 하므로, `lambda architecture`가 자주 쓰인다. 같은 input data를 stream-processing system과 database/storage system에 각각 보내는 구조다. 이 방식은 빠르게 구현하기 쉽지만, streaming query와 database query를 서로 다른 언어로 두 번 작성해야 하거나, streaming query가 stored data에 효율적으로 접근하기 어렵다는 단점이 있다.

##### 10.5.2.1 Stream Extensions to SQL

Stream SQL은 일반 SQL window function보다 stream에 맞는 window를 제공한다.

| Window type | 의미 | 예 |
|---|---|---|
| `tumbling window` | 서로 겹치지 않고 인접한 fixed-size window | 매 hour별 aggregate |
| `hopping window` | fixed width window를 일정 간격마다 생성, window끼리 overlap 가능 | 1-hour window를 20분마다 계산 |
| `sliding window` | 각 incoming tuple 주변의 time/tuple-count window | 최근 5분, 최근 100개 tuple |
| `session window` | user와 timeout interval로 session을 구성 | 5분 이내 연속 활동은 같은 session |

예를 들어 hourly order amount를 구하는 stream query는 `tumblingwindow(hour, 1)`처럼 window를 명시한다. Output tuple의 timestamp는 window end timestamp가 된다.

Stream extension은 stream과 relation을 구분한다. Orders는 stream일 수 있지만 customers, suppliers, items는 특정 시점에 fixed content를 가진 relation으로 취급된다. Stream-relation join은 결과가 stream이 되며, result tuple의 timestamp는 input stream tuple의 timestamp를 따른다.

Stream-stream join은 더 조심해야 한다. 한 stream의 오래된 tuple이 다른 stream의 훨씬 나중 tuple과 match될 수 있으면 무한히 많은 과거 tuple을 저장해야 한다. 그래서 streaming SQL system은 matching tuple 사이의 timestamp difference를 bounded하는 join condition이 있을 때만 stream-to-stream join을 허용한다.

#### 10.5.3 Algebraic Operations on Streams

SQL이 잘 맞지 않는 streaming application도 많다. Algebraic stream processing에서는 predefined operation과 user-defined function을 operator로 두고, incoming tuple을 operator graph를 따라 routing한다. Operator는 internal state를 유지할 수 있고, output을 다른 operator나 sink로 보낼 수 있다.

![Figure 10.11](@/assets/images/cs-database-162-figure-10-11-page-535.png)
*Figure 10.11 · PDF p. 535 · stream tuple을 DAG 또는 publish-subscribe 방식으로 operator와 sink에 routing하는 구조*

Figure 10.11a는 stream routing을 Directed Acyclic Graph(DAG)로 표현한다. Data source node는 external stream에서 tuple을 받아 system에 주입하고, `Op` node는 tuple을 처리하며, data sink는 결과 tuple을 storage/file/output으로 내보낸다. Apache Storm에서는 이 graph를 `topology`라고 부르고, data-source node는 `spout`, operator node는 `bolt`라고 부른다.

Figure 10.11b는 `publish-subscribe(pub-sub)` model을 보여 준다. Tuple은 topic을 가진 document처럼 publish되고, operator는 필요한 topic을 subscribe한다. Operator output도 다시 topic으로 publish될 수 있다. Pub-sub approach의 장점은 operator를 비교적 쉽게 추가/삭제할 수 있다는 점이다.

Apache Kafka는 stream tuple routing에 pub-sub model을 사용한다. Kafka에서는 topic에 publish된 tuple이 subscriber가 당장 없더라도 `retention period` 동안 유지된다. Subscriber processing이 지연되거나 failure로 잠시 중단되어도 retention time 안에는 tuple을 다시 처리할 수 있다.

Streaming algebraic operation 구현 방식은 system마다 다르다. Spark Streaming은 stream을 time window별 `discretized stream`으로 나누고, 각 window의 data를 file/relation 같은 finite input처럼 algebraic operator에 넘긴다. 반면 Storm과 Flink는 stream을 input으로 받아 stream을 output하는 operator를 더 직접 지원한다. Aggregate나 reduce처럼 전체 stream이 끝나야 결과가 나올 수 있는 operation은 window를 사용해 finite subset별로 결과를 낸다.

### 10.6 Graph Databases

Graph는 node와 edge로 구성된 data model이다. Router와 network link, road intersection과 road link, web page와 hyperlink, social network user와 relationship 같은 데이터가 자연스럽게 graph로 표현된다.

E-R model도 graph로 볼 수 있다. Entity는 node, binary relationship은 edge에 대응한다. Ternary 이상 relationship은 Section 6.9.4처럼 binary relationship들의 집합으로 변환할 수 있다.

가장 단순한 relational representation은 두 relation이다.

```sql
node(ID, label, node_data)
edge(fromID, toID, label, edge_data)
```

그러나 복잡한 schema에서는 node type마다 다른 attributes가 있고 edge type마다 다른 attributes가 있으므로, node type별 relation과 edge type별 relation을 따로 두는 편이 자연스럽다.

Graph database가 relational database에 비해 제공하는 장점은 다음과 같다.

| 기능 | 의미 |
|---|---|
| node/edge schema syntax | 어떤 relation이 node/edge를 나타내는지 명시적으로 정의 |
| path query language | SQL로 표현하기 어려운 path traversal을 쉽게 표현 |
| efficient graph query implementation | path query를 일반 SQL join보다 빠르게 실행할 수 있음 |
| graph visualization | graph 구조를 시각화하는 지원 |

Neo4j의 Cypher query는 graph query language의 예다. 학생에서 instructor로 가는 `advisor` edge가 있을 때, Comp. Sci. instructor와 advisee 이름을 구하는 query는 다음과 같은 형태다.

```cypher
match (i:instructor)<-[:advisor]-(s:student)
where i.dept_name = 'Comp. Sci.'
return i.ID as ID, i.name as name, collect(s.name) as advisees
```

`(i:instructor)<-[:advisor]-(s:student)`는 student에서 instructor로 향하는 advisor edge를 역방향으로 traverse한다. Relational 관점에서는 instructor, advisor, student relation의 join과 group by/collect에 해당한다.

Graph database의 중요한 장점은 recursive traversal 표현이다. Course prerequisite graph에서 direct/indirect prerequisite을 찾으려면 다음처럼 path length를 지정할 수 있다.

```cypher
match (c1:course)-[:prereq *1..]->(c2:course)
return c1.course_id, c2.course_id
```

`*1..`은 prereq edge를 최소 1개 이상 따라가는 path를 의미한다. 최소가 0이면 course 자신도 prerequisite처럼 나타날 수 있으므로 주의해야 한다.

큰 graph processing에는 parallelism이 필요하다. Web graph는 hundreds of billions of nodes와 trillions of edges 수준일 수 있고, PageRank나 social network influence, shortest path 같은 computation은 매우 비싸다.

Parallel graph processing 접근은 두 가지가 대표적이다.

| 접근 | 동작 | 장점/한계 |
|---|---|---|
| MapReduce/algebraic framework | graph를 relation으로 저장하고 각 algorithm step을 join 등으로 병렬 처리 | 많은 경우 유용하지만 long path iterative computation은 매 iteration 전체 graph를 다시 읽어 비효율적 |
| `Bulk Synchronous Processing(BSP)` | vertex state를 memory에 두고 superstep마다 vertex method 실행, message를 neighbor로 전달 | iterative graph algorithm에 적합, graph를 매번 다시 읽지 않음 |

BSP에서는 각 vertex가 state를 가지고, programmer가 vertex별 method를 제공한다. 각 `superstep`에서 vertex method는 incoming messages를 소비하고 state를 update하며 neighbor에게 message를 보낼 수 있다. 한 superstep에서 보낸 message는 다음 superstep에서 받는다. 모든 vertex가 halt에 vote하고 더 이상 message가 없으면 computation이 종료된다.

Pregel은 Google이 개발한 BSP 기반 graph framework이고, Apache Giraph는 open-source 계열이다. Spark의 GraphX는 Pregel-like API와 graph operation을 제공하며, vertex/edge map, graph와 RDD join, neighbor message aggregation 같은 operation을 병렬 실행할 수 있다.

### 10.7 Summary

Chapter 10은 Big Data를 “큰 파일 저장” 하나로 보지 않고, storage abstraction, parallel programming model, algebraic query framework, real-time streaming, graph processing을 하나의 흐름으로 묶는다.

| 영역 | 핵심 |
|---|---|
| motivation | Volume, Velocity, Variety 때문에 high parallelism과 다양한 query language 필요 |
| storage | distributed file system, sharding, key-value/document store, parallel database |
| MapReduce | `map()` transformation, shuffle/grouping, `reduce()` aggregation으로 병렬 처리 |
| algebraic framework | MapReduce step보다 high-level operation tree/DAG와 optimization 제공 |
| streaming | unbounded stream을 window, continuous query, pub-sub routing으로 처리 |
| graph | node/edge/path query와 BSP 기반 iterative graph computation |

## 연결 관계

- Chapter 8의 semi-structured data, JSON, graph/RDF 지식은 Big Data의 Variety를 이해하는 기반이다.
- Chapter 9의 application performance, caching, web log, social media, web service는 Chapter 10의 Big Data source와 scalable backend 필요성으로 이어진다.
- Chapter 16의 materialized view와 query optimization은 key-value store의 write-time materialization, Spark lazy evaluation과 operation tree rewrite에서 다시 등장한다.
- Chapter 17, 23의 transaction/atomicity/replication은 key-value store와 distributed storage의 consistency trade-off를 이해하는 데 필요하다.
- Chapter 21-23은 이 장에서 사용자 관점으로 본 distributed file system, partitioning, parallel query processing, distributed transaction을 내부 구현 관점에서 자세히 다룬다.

## 오해하기 쉬운 내용

- Big Data는 단순히 “데이터가 큰 것”이 아니다. high degree of parallelism 없이는 처리하기 어려운 Volume, Velocity, Variety의 조합이다.
- NoSQL은 database 기능이 필요 없다는 뜻이 아니다. SQL/transaction을 줄여 scalability를 얻었지만, 복잡한 application에서는 그 부재가 비용이 된다.
- Distributed file system은 많은 small file 저장에 최적인 구조가 아니다. 큰 file을 block으로 나누어 저장하는 데 강하다.
- Sharding을 application code에 넣으면 초기 확장은 쉽지만 rebalancing, routing, replication, consistency 부담이 application으로 간다.
- MapReduce의 핵심은 map/reduce 함수 자체보다 shuffle을 통해 같은 reduce key의 values를 모으는 system-level 처리다.
- Combiner는 아무 reduce에나 붙일 수 없다. Partial aggregation 결과를 다시 reduce해도 같은 결과가 나오는 연산이어야 한다.
- Spark transformation은 호출 즉시 실행되지 않을 수 있다. `saveAsTextFile()`, `collect()` 같은 action이 lazy evaluation된 tree/DAG를 실제 실행시킨다.
- Stream은 끝나지 않으므로 전체 stream에 대한 final aggregate는 일반적으로 낼 수 없다. Window나 incremental update가 필요하다.
- Stream-stream join은 time bound 없이 허용하면 unbounded storage가 필요하다.
- Graph를 relation에 저장할 수 있다고 해서 graph database가 불필요한 것은 아니다. Path query syntax와 traversal execution이 핵심 차이다.

## 면접 질문

1. Big Data의 `Volume`, `Velocity`, `Variety`를 각각 예시와 함께 설명하라.
2. Distributed file system에서 NameNode와 DataNode의 역할을 설명하라.
3. Sharding을 application code로 구현할 때 생기는 운영상 문제는 무엇인가?
4. Key-value store가 SQL과 transaction을 제한하는 이유와 그 trade-off를 설명하라.
5. Replication과 consistency 문제에서 network partition이 왜 어려운 상황을 만드는가?
6. MapReduce에서 `map()`, `shuffle`, `reduce()`가 각각 어떤 역할을 하는가?
7. Word count를 MapReduce로 처리할 때 `(key, value)`가 어떻게 변하는지 설명하라.
8. Combiner가 network traffic을 줄이는 원리와 사용할 수 없는 경우를 설명하라.
9. SQL query를 MapReduce로 직접 작성하는 것보다 Hive/Spark 같은 algebraic framework를 쓰는 이유는 무엇인가?
10. Spark의 RDD, lazy evaluation, DAG가 MapReduce step sequence와 어떻게 다른가?
11. Streaming data에서 tumbling window, hopping window, sliding window, session window를 비교하라.
12. Publish-subscribe model이 stream routing에서 주는 장점은 무엇인가?
13. Graph database가 path query에 유리한 이유와 Cypher query의 match clause 의미를 설명하라.
14. BSP의 superstep/message passing 방식이 iterative graph algorithm에 적합한 이유를 설명하라.
