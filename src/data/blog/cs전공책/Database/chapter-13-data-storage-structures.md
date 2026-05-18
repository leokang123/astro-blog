---
title: "Chapter 13. Data Storage Structures"
order: 13
pubDatetime: 2026-05-18T00:14:00+09:00
modDatetime: 2026-05-18T00:14:00+09:00
description: "Database System Concepts 정리: Chapter 13. Data Storage Structures"
tags:
  - "Database"
  - "CS"
---

## 개요

Chapter 12가 magnetic disk, SSD, RAID 같은 physical storage media의 성질을 다루었다면, Chapter 13은 그 위에 database record와 file을 어떻게 배치하고 접근할지를 다룬다. DBMS는 logical tuple을 다루지만 persistent data는 non-volatile storage의 block에 저장된다. 따라서 record format, file organization, data dictionary, database buffer, column-oriented storage, main-memory database storage organization은 모두 “logical data model을 block/page와 memory access pattern에 맞게 구현하는 방법”이다.

## 핵심 개념

- `record`는 relation tuple의 physical representation이고, 보통 disk block보다 작다.
- `block` 또는 `page`는 storage allocation과 data transfer의 단위이며, DBMS는 record를 block 안에 배치한다.
- `fixed-length record`는 record 크기가 일정해 insertion/deletion이 단순하지만 variable-length field에는 공간 낭비가 생길 수 있다.
- `variable-length record`는 varchar, repeating field, multiple record types를 다루기 위해 offset/length, null bitmap, slotted-page structure를 사용한다.
- `free list`는 deleted fixed-length record slot을 linked list로 묶어 insertion 때 재사용하게 한다.
- `slotted-page structure`는 variable-length record를 block 안에서 이동 가능하게 하면서 record pointer 안정성을 유지하는 block layout이다.
- `large object(LOB)`는 block보다 훨씬 큰 BLOB/CLOB data를 record 외부에 저장하고 record에는 pointer/path를 두는 방식으로 다룬다.
- `heap file organization`, `sequential file organization`, `multitable clustering file organization`, `partitioning`은 record를 file 안에 배치하는 대표 전략이다.
- `data dictionary` 또는 `system catalog`는 relation, attribute, index, view, constraint, user, statistics metadata를 저장한다.
- `database buffer`와 `buffer manager`는 disk block copy를 main memory에 유지하고, `pinned block`, `shared/exclusive lock`, `forced output`, `buffer-replacement strategy`로 안전성과 성능을 조절한다.
- `least recently used (LRU)`, `toss-immediate strategy`, `most recently used (MRU)`는 workload별로 서로 다른 buffer replacement 선택지를 보여 준다.
- `column-oriented storage`는 analytics에서 reduced I/O, CPU cache locality, compression, vector processing 이점을 얻지만 tuple reconstruction/update/decompression 비용이 있다.
- `main-memory database`는 buffer manager를 제거하고 `direct pointer`, memory allocation, in-memory columnar representation 같은 memory-resident layout을 활용한다.

## 세부 정리

### 13.1 Database Storage Architecture

Persistent data는 Chapter 12에서 본 non-volatile storage, 보통 magnetic disk 또는 SSD에 저장된다. 이 장치들은 `block-structured device`다. 즉 data는 block 단위로 read/write된다. 반면 database는 보통 block보다 작은 `record`를 다룬다. 그래서 DBMS는 logical record를 storage block에 어떻게 놓을지 결정해야 한다.

대부분의 database는 operating system file을 중간 계층으로 사용해 record를 저장한다. OS file은 underlying block의 일부 세부를 숨겨 주지만, DBMS는 efficient access와 failure recovery를 위해 여전히 block을 의식해야 한다. Chapter 19 recovery가 write ordering, block output, crash recovery를 다루기 때문에, record/file layout은 단순 저장 형식 이상의 의미를 가진다.

Chapter 13의 흐름은 다음과 같다.

| Section | 핵심 질문 |
|---|---|
| 13.2 File Organization | record를 file/block 안에 어떻게 표현할 것인가 |
| 13.3 Organization of Records in Files | record들을 heap, sequential, clustering, partitioning 방식으로 어떻게 배치할 것인가 |
| 13.4 Data-Dictionary Storage | schema와 storage metadata를 어디에 저장할 것인가 |
| 13.5 Database Buffer | disk/SSD block을 main memory에 어떻게 cache하고 교체할 것인가 |
| 13.6 Column-Oriented Storage | row 대신 column별로 저장하면 analytics에서 왜 유리한가 |
| 13.7 Main-Memory Databases | 전체 database가 memory에 있을 때 layout과 algorithm을 어떻게 바꿀 것인가 |

### 13.2 File Organization

Database는 여러 OS file로 mapping되고, file은 logical record sequence로 구성된다. 각 file은 `block`이라는 fixed-length storage unit으로 나뉘며, block은 storage allocation과 data transfer의 단위다. DBMS block size는 보통 4-8 KB 정도이고, database instance 생성 시 설정할 수 있는 경우가 많다.

기본 가정은 record 하나가 block 하나보다 크지 않고, record가 block boundary를 걸치지 않는다는 것이다. Record가 두 block에 걸치면 read/write에 두 block access가 필요하고 buffer management도 복잡해진다. Image, audio, video처럼 block보다 큰 data는 별도 large object 방식으로 처리한다.

#### 13.2.1 Fixed-Length Records

`fixed-length record`는 같은 file 안의 모든 record가 같은 byte length를 갖는 방식이다. 예를 들어 instructor record에서 `ID`, `name`, `dept_name`, `salary`에 각각 최대 길이를 할당하면 record size가 일정해진다. 단순히 첫 53 bytes에 record 0, 다음 53 bytes에 record 1을 두는 식으로 저장할 수 있지만, 두 문제가 생긴다.

1. Block size가 record size의 배수가 아니면 record가 block boundary를 걸치게 되어 한 record access에 두 block이 필요할 수 있다.
2. Deletion 후 빈 공간을 어떻게 찾고 재사용할지 별도 구조가 필요하다.

첫 문제를 피하려면 한 block에 완전히 들어가는 record 수만 저장하고 남는 bytes는 unused로 둔다. 두 번째 문제에서 record 삭제 후 뒤 record들을 모두 앞으로 당기면 많은 block access가 필요하다. 마지막 record를 deleted slot으로 옮기는 방식도 가능하지만, record location이 바뀌어 pointer/reference 안정성이 깨질 수 있다.

더 실용적인 방식은 deleted record space를 남겨 두고 이후 insertion이 재사용하게 하는 것이다. 이때 단순 deletion marker만 있으면 insertion 때 free slot을 찾기 어렵다. 그래서 file header에 first deleted record의 address를 두고, deleted record slot 안에 next deleted record address를 저장해 `free list`를 만든다.

![Figure 13.4](@/assets/images/cs-database-182-figure-13-4-page-620.png)
*Figure 13.4 · PDF p. 620 · deleted fixed-length record slots를 file header에서 시작하는 free list로 연결한 구조*

Figure 13.4처럼 header가 첫 free record를 가리키고, 각 deleted slot이 다음 free slot을 가리킨다. New record insertion은 header가 가리키는 slot을 재사용하고, header pointer를 다음 free slot으로 갱신한다. Free slot이 없으면 file 끝에 record를 append한다. Fixed-length record에서는 deleted slot size가 새 record size와 정확히 맞으므로 insertion/deletion 구현이 단순하다.

#### 13.2.2 Variable-Length Records

`variable-length record`가 필요한 이유는 세 가지다. 첫째, `varchar` 같은 variable-length field가 있다. 둘째, array나 multiset처럼 repeating field를 포함할 수 있다. 셋째, 하나의 file에 multiple record types가 들어갈 수 있다. Variable-length record 구현은 두 문제를 풀어야 한다.

| 문제 | 요구 |
|---|---|
| single record representation | variable-length attribute가 있어도 individual attribute를 쉽게 extract |
| records inside block | variable-length records를 block 안에서 쉽게 insert/delete/move |

Variable-length attribute를 가진 record는 보통 fixed-length initial part와 variable-length data area로 나뉜다. Fixed-length attribute는 실제 value bytes를 initial part에 저장하고, variable-length attribute는 initial part에 `(offset, length)` pair를 저장한다. 실제 string bytes는 initial part 뒤에 연속해서 저장된다.

![Figure 13.5](@/assets/images/cs-database-183-figure-13-5-page-621.png)
*Figure 13.5 · PDF p. 621 · offset/length pair, fixed-size salary, null bitmap을 사용한 variable-length instructor record 표현*

Figure 13.5의 `null bitmap`은 어떤 attribute가 null인지 표시한다. 예를 들어 4번째 bit가 1이면 salary가 null이고, salary value bytes는 무시된다. Attribute가 많고 대부분 null인 application에서는 null bitmap을 record 앞쪽에 두고 null attribute의 value나 offset/length 자체를 저장하지 않는 표현이 storage를 절약할 수 있다. 대신 attribute extraction에는 추가 작업이 필요하다.

Variable-length records를 block에 저장할 때는 `slotted-page structure`가 널리 쓰인다. 여기서 page는 block과 같은 의미다.

![Figure 13.6](@/assets/images/cs-database-184-figure-13-6-page-622.png)
*Figure 13.6 · PDF p. 622 · block header의 slot array가 각 record의 location/size를 가리키고 record는 block 끝에서부터 배치되는 slotted-page structure*

Slotted page의 block header에는 다음 정보가 들어간다.

| Header field | 역할 |
|---|---|
| number of record entries | slot array에 몇 개 entry가 있는지 |
| end of free space | header/slot array와 record area 사이 free space 경계 |
| slot array | 각 record의 location과 size 저장 |

Actual record는 block 끝에서부터 contiguous하게 배치되고, free space는 slot array 끝과 첫 record 사이에 한 덩어리로 유지된다. Record insertion 시 free space 끝에 record를 놓고 slot entry를 추가한다. Deletion 시 slot entry를 deleted로 표시하고, record들을 이동해 free space를 다시 contiguous하게 만든다. Block 크기는 보통 4-8 KB라 block 내부 record 이동 cost는 제한적이다.

중요한 설계 포인트는 external pointer가 record의 physical byte location을 직접 가리키지 않고 slot entry를 가리켜야 한다는 점이다. 이 indirection 덕분에 block 내부 record를 이동해 fragmentation을 줄이면서도, record identifier가 안정적으로 유지된다.

#### 13.2.3 Storing Large Objects

Image, audio, video처럼 block보다 큰 data는 SQL의 `blob`, `clob` 같은 `large object(LOB)`로 나타난다. 많은 DBMS는 record size를 block size 이하로 제한하기 때문에, logical record가 large object를 포함하더라도 실제 large object data는 record 외부에 저장하고 record에는 pointer를 둔다.

Large object 저장 방식은 크게 두 가지다.

| 방식 | 장점 | 문제 |
|---|---|---|
| DBMS가 관리하는 file structure에 저장 | database authorization, backup, consistency 관리와 통합 가능 | database dump 크기 증가, DB interface로 large object access 시 overhead |
| file system에 외부 file로 저장하고 DB에는 path 저장 | 매우 큰 video/audio data 처리와 file system tool 활용이 쉬움 | path가 missing file을 가리킬 수 있고 DB authorization이 직접 적용되지 않음 |

In-database large object는 필요하면 Chapter 14의 `B+ tree file organization`으로 구성해 object 전체나 byte range를 효율적으로 읽고, 일부 삽입/삭제도 지원할 수 있다. 반대로 file system 외부 저장은 application이 path consistency와 authorization을 따로 관리해야 하므로, DB의 foreign-key-like integrity 보장이 약해질 수 있다.

### 13.3 Organization of Records in Files

13.2가 record 하나를 file/block 안에 어떻게 표현할지 다루었다면, 13.3은 relation의 record set을 file 전체에 어떻게 배치할지 다룬다. File organization은 query access pattern, insertion/deletion cost, ordered scan, join locality에 직접 영향을 준다.

대표적인 organization은 다음과 같다.

| File organization | 핵심 아이디어 | 유리한 경우 |
|---|---|---|
| `heap file organization` | free space가 있는 어느 위치에나 record 저장 | insertion이 많고 ordering이 중요하지 않을 때 |
| `sequential file organization` | `search key` 값 순서로 record 저장 | sorted order scan, certain query-processing algorithms |
| `multitable clustering file organization` | 여러 relation의 related records를 같은 block 근처에 저장 | 특정 join query가 매우 자주 실행될 때 |
| `B+ tree file organization` | search key 순서를 tree structure로 유지 | 많은 insert/delete/update에도 ordered access 유지 |
| `hashing file organization` | hash function으로 record가 들어갈 block 결정 | equality search 중심 access |

`B+ tree file organization`과 `hashing file organization`은 Chapter 14 indexing 구조와 밀접하게 이어진다.

#### 13.3.1 Heap File Organization

`heap file organization`에서는 relation file 안의 어느 위치든 space만 있으면 record를 저장할 수 있다. 한 번 배치된 record는 보통 이동하지 않는다. 단순히 file 끝에 append할 수도 있지만, deletion으로 생긴 free space를 재사용하지 않으면 file이 불필요하게 커진다.

핵심 문제는 “free space가 있는 block을 어떻게 빨리 찾는가”다. 모든 block을 순차 scan해서 공간을 찾으면 너무 느리다. 그래서 DBMS는 보통 `free-space map`을 사용한다.

`free-space map`은 relation의 각 block마다 하나의 entry를 두고, 그 block에 어느 정도 free space가 있는지를 근사적으로 기록한다. 예를 들어 entry 값이 7이고 3 bits scale을 사용한다면 해당 block에 적어도 `7/8` 정도 free space가 있음을 뜻할 수 있다. Record insert/delete/update로 occupancy fraction이 충분히 바뀌면 map entry도 갱신된다.

Large relation에서는 free-space map scan도 부담이 될 수 있으므로, `second-level free-space map` 같은 계층 구조를 둔다. Second-level entry는 main free-space map의 일정 범위 entry들 중 maximum value를 저장한다. 먼저 상위 map에서 충분한 공간이 있을 범위를 찾고, 그 범위의 main map entry를 확인하면 free block 탐색을 크게 줄일 수 있다.

Free-space map은 매번 disk에 쓰면 비싸기 때문에 periodic write가 흔하다. 그래서 startup 후 disk의 free-space map이 outdated일 수 있다. Map이 “free space가 있다”고 했지만 실제 block에 없으면 block fetch 후 추가 search를 하면 된다. 반대로 map이 free space가 없다고 했지만 실제로 있는 경우에는 unused free space가 생길 수 있고, periodic relation scan으로 map을 recompute해 고친다.

#### 13.3.2 Sequential File Organization

`sequential file organization`은 `search key` 값 순서로 record를 저장해 sorted order processing을 빠르게 한다. 여기서 search key는 primary key나 superkey일 필요가 없고, ordering 기준이 되는 attribute 또는 attribute set이면 된다.

Sequential file은 record를 search-key order로 chain하기 위해 pointer를 사용한다. 동시에 physical order도 가능한 한 search-key order와 맞춘다. 이렇게 하면 display, range processing, Chapter 15의 sort/merge 계열 query-processing algorithm에서 유리하다.

문제는 insertion/deletion이 physical sorted order를 깨뜨린다는 점이다. Deletion은 pointer chain으로 처리할 수 있지만, insertion은 비용이 크다. 새 record가 search-key order상 들어갈 위치를 찾고, 같은 block에 free slot이 있으면 그곳에 넣는다. 없으면 `overflow block`에 넣고 pointer를 조정해 logical order만 유지한다.

![Figure 13.8](@/assets/images/cs-database-186-figure-13-8-page-628.png)
*Figure 13.8 · PDF p. 628 · search-key order에 맞춰 pointer chain은 유지하지만 새 record가 overflow area에 들어간 sequential file*

Figure 13.8처럼 overflow block을 사용하면 insertion은 빨라지지만, sequential scan이 physical order와 어긋나기 시작한다. Overflow record가 적으면 괜찮지만 시간이 지나면 search-key order와 physical order의 correspondence가 크게 깨져 sequential processing이 느려진다. 이때 file을 다시 physical sorted order로 만드는 `reorganization`이 필요하며, 비용이 크므로 system load가 낮을 때 수행한다. Insert/delete/update가 많은 경우에는 Chapter 14의 `B+ tree file organization`이 더 적합하다.

#### 13.3.3 Multitable Clustering File Organization

일반적으로 DBMS는 relation마다 separate file 또는 file set을 사용한다. `multitable clustering file organization`은 다르게, 여러 relation의 related records를 같은 file, 심지어 같은 block 안에 저장한다. 목적은 특정 join의 disk I/O를 줄이는 것이다.

예를 들어 `department natural join instructor`를 자주 실행한다면, 같은 `dept_name`을 가진 department tuple과 instructor tuples를 가까운 block에 배치할 수 있다. 이때 clustering 기준 attribute를 `cluster key`라고 한다.

![Figure 13.11](@/assets/images/cs-database-189-figure-13-11-page-629.png)
*Figure 13.11 · PDF p. 629 · dept_name cluster key 기준으로 department record와 관련 instructor records를 같은 block 근처에 저장한 multitable clustering*

Figure 13.11의 장점은 join locality다. Department tuple을 읽기 위해 block을 가져오면, 같은 department의 instructor tuple도 이미 그 block 또는 nearby block에 있을 가능성이 높다. Worst case처럼 instructor record마다 별도 block read를 하는 상황을 줄일 수 있다.

하지만 trade-off도 뚜렷하다. `select * from department`처럼 department relation만 scan하는 query는 block마다 department record 수가 줄어 더 많은 block을 읽을 수 있다. 특정 relation record만 찾기 위해 같은 block 안의 record들을 relation별 pointer chain으로 연결할 수는 있지만, 이미 읽어야 하는 block 수 자체를 줄이지는 못한다. 따라서 multitable clustering은 designer가 특정 join workload가 매우 빈번하다고 판단할 때 신중하게 사용해야 한다.

#### 13.3.4 Partitioning

`partitioning`은 한 relation의 records를 더 작은 relations로 나누어 별도로 저장하는 방식이다. 보통 attribute value를 기준으로 나눈다. 예를 들어 accounting database의 transaction relation을 year 기준으로 `transaction_2018`, `transaction_2019`처럼 나눌 수 있다.

Application/query는 logical `transaction` relation에 대해 작성되지만, optimizer는 predicate를 보고 필요한 partition만 access하도록 rewrite할 수 있다. 예를 들어 `where year = 2019` 조건이 있으면 `transaction_2019`만 읽고 다른 years partition은 건너뛴다. 이 효과를 흔히 partition pruning이라고 부를 수 있다.

Partitioning의 이점은 다음과 같다.

| 이점 | 설명 |
|---|---|
| smaller relation management | free-space 탐색, scan, maintenance overhead 감소 |
| selective access | predicate에 맞는 partition만 읽어 I/O 감소 |
| storage tiering | 자주 쓰는 current partition은 SSD, 오래된 partition은 magnetic disk에 배치 가능 |

### 13.4 Data-Dictionary Storage

`data dictionary` 또는 `system catalog`는 database의 metadata, 즉 “data about data”를 저장한다. Relation data 자체뿐 아니라, DBMS가 relation을 찾고 해석하고 optimize하기 위해 필요한 schema/storage/security/statistics 정보를 담는다.

Data dictionary가 저장하는 정보는 다음과 같다.

| Metadata category | 예 |
|---|---|
| relation metadata | relation name, attribute count, storage organization, location |
| attribute metadata | attribute name, domain type, position, length |
| view metadata | view name, view definition |
| constraint metadata | key constraints, integrity constraints |
| user/security metadata | user name, default schema, encrypted password, authorization |
| statistics metadata | tuple count, distinct value count |
| index metadata | index name, indexed relation, indexed attributes, index type |

![Figure 13.12](@/assets/images/cs-database-190-figure-13-12-page-632.png)
*Figure 13.12 · PDF p. 632 · relation, attribute, index, view, user metadata를 relation 형태로 저장하는 toy data dictionary schema*

Figure 13.12는 metadata를 special-purpose structure가 아니라 relation으로 저장할 수 있음을 보여 준다. Metadata 자체도 miniature database이므로, relation으로 저장하면 DBMS의 query/storage mechanism을 재사용할 수 있다. 다만 real implementation은 그림보다 훨씬 많은 metadata를 저장한다.

Data dictionary는 빠른 접근이 중요하므로 반드시 완전 정규화를 고집하지 않는다. 예를 들어 `Index_metadata.index_attributes`가 attribute list string을 담으면 first normal form은 아니지만, 빠른 catalog access에는 유리할 수 있다. 원문은 data dictionary가 often nonnormalized form으로 저장된다고 강조한다.

DBMS가 relation record를 읽으려면 먼저 `Relation_metadata`에서 relation의 location과 storage organization을 알아야 한다. 그런데 `Relation_metadata` 자체의 storage location은 다시 dictionary에서 찾을 수 없으므로, database code 자체나 fixed location 같은 bootstrapping mechanism에 기록되어야 한다. 또한 system metadata는 자주 접근되므로 database startup 시 in-memory data structures로 읽어 두는 경우가 많다.

### 13.5 Database Buffer

디스크의 데이터는 대부분 `block` 단위로 이동하지만, DBMS 연산은 가능한 한 memory 안에서 처리되어야 한다. `database buffer`는 disk block의 복사본을 보관하는 main memory 영역이고, `buffer manager`는 어떤 block을 읽어 들이고, 어떤 block을 내보내며, 어떤 block을 잠시 eviction 금지 상태로 둘지 결정한다.

중요한 전제는 disk에도 항상 block의 사본이 있지만, buffer 안의 copy가 더 최신일 수 있다는 점이다. 즉, buffer는 단순 read cache가 아니라 dirty block, concurrency safety, crash recovery가 모두 걸린 저장 계층이다.

#### 13.5.1 Buffer Manager

프로그램이 disk block을 요청하면 buffer manager는 먼저 그 block이 buffer pool에 있는지 확인한다.

| 상황 | buffer manager의 동작 |
|---|---|
| 요청 block이 buffer에 있음 | main memory 주소를 requester에게 넘긴다. |
| 요청 block이 buffer에 없음 | buffer 공간을 할당하고, 필요하면 다른 block을 eviction한다. |
| eviction 대상 block이 수정되지 않음 | disk에 다시 쓰지 않고 제거할 수 있다. |
| eviction 대상 block이 수정됨 | disk에 write-back한 뒤 제거한다. |

운영체제의 virtual-memory manager와 비슷해 보이지만, DBMS buffer manager는 더 많은 정보를 가진다. database 크기는 hardware address space보다 클 수 있고, query plan, index access, data dictionary access, concurrency-control 상태, recovery constraint 같은 DBMS 내부 정보를 replacement strategy에 반영할 수 있다.

#### 13.5.1.1 Buffer replacement strategy

buffer에 빈 공간이 없으면 어떤 block을 쫓아낼지 정해야 한다. 일반 운영체제는 흔히 `least recently used (LRU)`를 사용한다. LRU는 가장 오래 전에 참조된 block을 내보내는 전략이다.

DBMS에서는 LRU가 항상 좋지 않다. 어떤 query는 앞으로 어떤 block을 다시 볼지 어느 정도 예측할 수 있고, 한 번 스캔한 block은 다시 필요 없다는 사실도 알 수 있다. 따라서 buffer replacement는 과거 접근 패턴만이 아니라 query execution의 미래 접근 패턴까지 고려해야 한다.

#### 13.5.1.2 Pinned blocks

`pinned block`은 buffer manager가 eviction해서는 안 되는 block이다. process가 buffer block을 읽거나 쓰는 중에 다른 process가 그 block을 eviction하고 다른 block으로 교체하면, reader는 잘못된 데이터를 보거나 writer는 교체된 block을 망가뜨릴 수 있다.

그래서 process는 block 접근 전에 `pin operation`을 수행하고, 접근이 끝나면 `unpin operation`을 수행한다. buffer manager는 pinned block을 evict하지 않는다.

구현상 각 buffer block은 보통 `pin count`를 가진다.

| 연산 | pin count 변화 | 의미 |
|---|---:|---|
| `pin` | +1 | 이 block을 사용하는 process가 하나 늘었다. |
| `unpin` | -1 | process 하나가 사용을 끝냈다. |
| `pin count = 0` | eviction 가능 | 더 이상 현재 사용 중인 process가 없다. |

주의할 점은 pin이 너무 오래 유지되면 buffer pool이 막힌다는 것이다. 모든 buffer block이 pinned 상태가 되면 어떤 block도 쫓아낼 수 없고, 새 block도 읽어 들일 수 없어 DBMS 처리가 멈춘다.

#### 13.5.1.3 Shared and Exclusive Locks on Buffer

pin은 eviction을 막을 뿐, buffer block 내부의 동시 접근 안전성을 보장하지 않는다. page 안에서 tuple을 추가하거나 삭제하면 slot, offset, tuple 위치가 이동할 수 있으므로, 그 순간 다른 process가 page를 읽으면 일관되지 않은 중간 상태를 볼 수 있다.

buffer manager는 buffer block에 대해 제한된 형태의 `shared lock`과 `exclusive lock`을 제공한다.

| lock mode | 허용되는 동시성 | 사용 상황 |
|---|---|---|
| `shared lock` | 여러 process가 동시에 가질 수 있다. | buffer block을 읽을 때 |
| `exclusive lock` | 한 process만 가질 수 있고, 다른 shared/exclusive lock과 공존할 수 없다. | buffer block을 수정할 때 |

순서는 중요하다. process는 먼저 block을 `pin`하고, 그 다음 lock을 얻는다. 읽기 전에는 shared lock, 수정 전에는 exclusive lock을 얻고, 작업이 끝나면 lock을 release한 뒤 `unpin`한다.

이 lock은 Chapter 18의 transaction-level lock과 같은 목적이 아니다. 여기서의 목적은 buffer page의 물리적 contents가 깨지거나 중간 상태로 읽히지 않게 하는 것이다. transaction isolation이나 serializability는 Chapter 17, Chapter 18의 concurrency-control mechanism에서 별도로 다룬다.

#### 13.5.1.4 Output of blocks

수정된 block을 꼭 eviction 순간까지 기다렸다가 disk에 쓸 필요는 없다. background process가 dirty block을 미리 찾아 disk에 써 두면, 나중에 buffer 공간이 필요할 때 이미 clean 상태인 block을 빠르게 evict할 수 있다.

하지만 recovery 때문에 아무 때나 write-back할 수는 없다. 예를 들어 많은 recovery system은 block update가 진행 중일 때 그 block이 disk로 쓰이는 것을 금지한다. 이를 지키려면 disk에 output하려는 process가 해당 block에 shared lock을 얻어야 한다. 즉, output은 performance optimization이면서 동시에 recovery protocol의 제약을 받는 작업이다.

#### 13.5.1.5 Forced output of blocks

`forced output`은 특정 block을 반드시 disk에 쓰는 동작이다. memory와 buffer contents는 crash 때 사라지지만 disk contents는 보통 살아남는다. 따라서 transaction commit 시점에 어떤 정보가 disk에 충분히 기록되어야 commit된 update를 잃지 않을 수 있다.

forced output은 Chapter 19의 logging mechanism과 함께 쓰인다. 여기서는 “commit된 변경을 crash 이후에도 복구 가능하게 만들기 위해, 어떤 block 또는 log 관련 정보의 disk 반영 시점을 강제로 앞당길 수 있다”는 정도가 핵심이다.

#### 13.5.2 Buffer-Replacement Strategies

replacement strategy의 목표는 disk access를 줄이는 것이다. 일반 프로그램에서는 미래 참조를 정확히 예측하기 어렵기 때문에 LRU가 자연스럽다. 그러나 DBMS는 query plan을 알고 있으므로, block의 미래 사용 여부를 더 잘 추정할 수 있다.

다음 `instructor natural join department` 예시는 왜 LRU가 DBMS에 항상 맞지 않는지 보여준다.

![Figure 13.13](@/assets/images/cs-database-191-figure-13-13-page-637.png)
*Figure 13.13 · PDF p. 637 · instructor와 department의 nested-loop join 절차*

Figure 13.13의 절차에서는 `instructor` tuple 하나마다 `department` relation 전체를 훑는다. 이때 relation별로 좋은 buffer 전략이 다르다.

| 대상 block | 접근 패턴 | 적합한 전략 |
|---|---|---|
| `instructor` block | tuple 처리가 끝나면 다시 필요 없다. | `toss-immediate strategy` |
| `department` block | 한 번 훑은 뒤 다른 department block을 모두 본 다음에야 다시 필요하다. | `most recently used (MRU)` |

`toss-immediate strategy`는 block의 마지막 tuple 처리가 끝나는 즉시 그 block의 buffer 공간을 해제하도록 buffer manager에 알려 주는 방식이다. 최근 사용되었다는 이유만으로 유지하면 오히려 낭비가 된다.

`MRU`는 가장 최근에 사용한 block을 교체 대상으로 삼는다. 위 nested-loop join에서는 방금 처리한 department block이 다음에 가장 늦게 다시 필요해지므로, LRU의 가정과 정반대가 된다. MRU가 제대로 동작하려면 현재 처리 중인 department block은 pinned 상태여야 하고, 마지막 tuple 처리 후 unpin되어 replacement 후보가 된다.

DBMS는 이 외에도 통계 정보를 활용한다. `data dictionary`는 모든 query processing에서 자주 참조되므로 가능하면 memory에 남겨 두는 것이 좋다. Chapter 14의 `index` block도 base file보다 더 자주 접근될 수 있으므로, 다른 선택지가 있다면 buffer에서 덜 내보내는 편이 유리하다.

완벽한 replacement strategy는 현재 수행 중인 database operation과 미래 operation을 알아야 한다. 실제로는 모든 상황에 좋은 단일 전략이 없고, 많은 DBMS가 결함을 알면서도 LRU 계열을 사용한다. concurrency-control subsystem이 어떤 request를 지연시키는지 알려 주면, buffer manager는 delayed request가 필요로 하는 block보다 active request가 필요로 하는 block을 우선 보존할 수 있다.

crash-recovery subsystem도 replacement에 강한 제약을 건다. modified block을 disk에 쓰면 old version이 사라지므로, buffer manager는 recovery subsystem의 허가 없이 임의로 write-back해서는 안 된다. recovery subsystem은 특정 block의 output을 허락하기 전에 다른 block의 `force-output`을 요구할 수 있다.

#### 13.5.3 Reordering of Writes and Recovery

database buffer는 update를 memory에서 수행한 뒤 나중에 disk로 출력하므로, 실제 disk write 순서가 logical update 순서와 달라질 수 있다. file system도 성능을 위해 write operation을 재정렬한다. 문제는 crash가 그 중간에 발생하면 disk의 data structure가 깨질 수 있다는 점이다.

예를 들어 file system이 어떤 file의 block 목록을 linked list로 관리한다고 하자. 새 node를 list 끝에 붙일 때 원래 순서는 “새 node data write → 이전 node pointer update”여야 한다. 그런데 write reordering으로 pointer update가 먼저 disk에 쓰이고, 새 node data가 쓰이기 전에 crash가 나면 list는 아직 쓰이지 않은 쓰레기 내용을 가리키게 된다.

초기 file system은 restart 때 file system consistency check를 수행해 이런 구조 손상을 찾아 복구했다. 하지만 disk capacity가 커질수록 restart delay가 길어졌다. metadata update를 항상 조심스럽게 정해진 순서로 쓰면 inconsistency를 줄일 수 있지만, disk arm scheduling 같은 최적화를 포기해야 해 성능이 떨어진다.

해결책은 write를 먼저 순서대로 안정적인 log에 기록하는 것이다.

| 방식 | 핵심 아이디어 | 장점 | 비용 |
|---|---|---|---|
| non-volatile write buffer | write를 non-volatile RAM에 순서대로 기록한 뒤 disk에는 나중에 재정렬해서 쓴다. | 순서 보장과 disk scheduling을 함께 얻을 수 있다. | 대부분의 disk가 제공하지 않는다. |
| `log disk` | block number와 data를 write 발생 순서대로 log에 기록한다. | sequential access라 seek time이 거의 없고 crash 후 재실행 가능하다. | 별도 log disk 비용이 들 수 있다. |
| same-disk journaling | data와 log를 같은 disk에 둔다. | 비용이 낮다. | 별도 log disk보다 성능이 낮다. |

`journaling file system`은 file system metadata write를 log에 남겨 crash 후 빠르게 재시작할 수 있게 한다. crash 전에 실제 위치에 쓰지 못한 write가 있으면 restart 후 log disk를 읽어 빠진 write를 수행하고, 완료된 log record를 삭제한다.

하지만 application write가 항상 file-system log에 기록되는 것은 아니다. DBMS는 database contents를 안전하게 복구하기 위해 자체 logging을 구현한다. Chapter 19에서 다루는 recovery mechanism은 write reordering이 있더라도 database state를 복구 가능하게 만들기 위한 장치다.

### 13.6 Column-Oriented Storage

전통적인 DBMS의 `row-oriented storage`는 한 tuple의 모든 attributes를 하나의 record에 함께 저장한다. 반대로 `column-oriented storage`, 또는 `columnar storage`는 relation의 각 attribute를 따로 저장하고, successive tuples의 같은 attribute values를 file의 연속 위치에 둔다.

![Figure 13.14](@/assets/images/cs-database-192-figure-13-14-page-640.png)
*Figure 13.14 · PDF p. 640 · instructor relation을 attribute별 column으로 나누어 저장한 columnar representation*

가장 단순한 column-oriented storage에서는 각 attribute를 separate file로 저장하고, 각 file을 compress한다. Query가 i번째 row 전체를 필요로 하면 각 column의 i번째 값을 가져와 row를 재구성한다. 이 때문에 적은 수의 row에서 많은 attributes를 가져오는 transaction-processing query에는 불리하다.

반면 data analysis query는 relation의 많은 rows를 처리하지만 일부 attributes만 읽는 경우가 많다. 이 workload에서는 column store가 강하다.

| 장점 | 이유 |
|---|---|
| reduced I/O | 필요한 attributes만 disk에서 memory로 가져오고, 나머지 columns는 읽지 않는다. |
| improved CPU cache performance | cache line 안의 adjacent bytes가 같은 column values라 selection/aggregation에 재사용되기 쉽다. |
| improved compression | 같은 type/value distribution의 values가 연속되어 row format보다 compression 효율이 높다. |
| vector processing | array 형태 column values에 CPU vector operation을 병렬 적용하기 쉽다. |

이런 이유로 column-oriented storage는 data warehousing에서 많이 쓰인다. `column store`는 column-oriented storage를 사용하는 database, `row store`는 row-oriented storage를 사용하는 database를 뜻한다. 단, column store의 이점을 제대로 얻으려면 indexing과 query processing technique도 columnar layout에 맞게 설계되어야 한다. 책은 Chapter 14.9의 bitmap representation, Chapter 24.3의 column-oriented query processing과 연결한다.

#### 13.6.1 column store의 transaction-processing 약점

Column-oriented storage는 분석에는 유리하지만 transaction processing에는 다음 비용이 크다.

| 비용 | 설명 |
|---|---|
| tuple reconstruction cost | 많은 columns를 모아 하나의 tuple을 복원해야 하면 여러 column access가 필요하다. |
| deletion/update cost | compressed representation에서 single tuple을 삭제/수정하면 같은 compression unit 전체를 다시 써야 할 수 있다. |
| decompression cost | 일부 records만 필요해도 compressed sequence 앞부분부터 풀어야 하면 불필요한 work가 커진다. |

Data warehouse는 보통 tuple-level update/delete가 적고, new tuples를 relation 끝에 append하며, 오래된 data를 bulk delete한다. 그래서 큰 value sequence를 한 compression unit으로 묶어도 update 부담이 작고 compression 이득이 크다.

다만 analysis query도 selection condition을 만족하지 않는 records의 attributes까지 읽을 필요는 없다. 그래서 column-store compressed representation은 file 중간 여러 지점에서 decompression을 시작할 수 있게 만든다. 예를 들어 10,000 values마다 compression을 새로 시작하고 각 group의 시작 위치를 저장하면, i번째 value를 읽을 때 `floor(i/10000)` group 시작점으로 가서 decompression을 시작할 수 있다.

#### 13.6.2 ORC, Parquet, stripe layout

`ORC`와 `Parquet`은 big-data processing application에서 널리 쓰이는 columnar file representation이다. ORC는 row-oriented tuple sequence를 여러 hundred MB 크기의 `stripe`라는 columnar representation으로 나눈다. ORC file은 여러 stripes로 구성되고, 각 stripe는 대략 250 MB 정도의 크기를 갖는다.

![Figure 13.15](@/assets/images/cs-database-193-figure-13-15-page-643.png)
*Figure 13.15 · PDF p. 643 · ORC file format에서 stripe, index data, row data, footer가 배치되는 columnar layout*

Figure 13.15에서 각 stripe는 `index data`, `row data`, `stripe footer`를 가진다. Row data area에는 첫 번째 column의 compressed values, 두 번째 column의 compressed values가 차례로 저장된다. Index data region은 각 attribute에 대해 일정 value group, 예를 들어 10,000 values 단위의 시작 위치를 저장한다.

이 index는 두 가지에 유용하다.

| 용도 | 효과 |
|---|---|
| desired tuple/tuple sequence access | 필요한 value group의 시작 위치로 바로 이동할 수 있다. |
| selection-based skipping | 어떤 group에 selection을 만족하는 tuple이 없다고 판단하면 그 group을 읽지 않는다. |

일부 column-store system은 자주 함께 접근되는 column group을 같이 저장한다. 따라서 저장 방식은 “모든 columns를 분리하는 pure column-oriented storage”부터 “모든 columns를 함께 저장하는 pure row-oriented storage”까지 spectrum으로 볼 수 있다. 어떤 attributes를 같이 저장할지는 query workload가 결정한다.

#### 13.6.3 row-oriented system에서 columnar benefit을 얻는 변형

Row-oriented system에서도 relation을 논리적으로 쪼개면 일부 column-store 효과를 얻을 수 있다. 예를 들어 `instructor(ID, name, dept_name, salary)`를 `(ID, name)`, `(ID, dept_name)`, `(ID, salary)`로 분해하면 name만 필요한 query는 dept_name과 salary를 읽지 않아도 된다. 그러나 ID가 여러 relation에 중복되어 space가 낭비된다.

또 다른 중간 지점은 disk block 내부에서는 column-oriented representation을 쓰되, block 자체는 한 tuple set의 모든 attributes를 담는 방식이다. 이 방식은 transaction-processing system에서 모든 attribute를 가져올 때 multiple disk access를 피하면서, memory access/cache usage/vector processing 이점 일부를 얻는다. 하지만 필요한 attribute가 적을 때 irrelevant disk block을 skip하는 이점이나 강한 compression 이점은 제한된다.

일부 system은 `hybrid row/column stores`를 제공한다. 예를 들어 transactional data는 처음 row-oriented store에 생성하고, 더 이상 row-oriented 방식으로 자주 접근되지 않을 때 column-oriented store로 migrate한다. 또 다른 구성은 transactional row store에서 주기적으로 data warehouse의 column-oriented storage로 복사하는 방식이다.

### 13.7 Storage Organization in Main-Memory Databases

Main memory가 커지고 저렴해지면서 많은 organizational database가 memory 전체에 들어갈 수 있게 되었다. 일반 disk-based DBMS에서도 buffer를 크게 잡으면 database 전체를 buffer에 올려 read disk I/O를 피할 수 있다. 그러나 update block은 persistence를 위해 여전히 disk에 써야 한다.

`main-memory database`는 모든 data가 memory에 있다고 가정하고 storage organization과 data structures를 그 사실에 맞게 설계한 database다. 핵심 차이는 buffer manager를 아예 없앨 수 있다는 점이다.

Disk-based DBMS에서 record pointer는 보통 `block identifier + offset/slot number`다. Record pointer를 따라가려면 block이 buffer에 있는지 hash index로 확인하고, buffer 안 위치를 찾고, 없으면 fetch해야 한다. 이 과정은 CPU cycles를 꽤 쓴다.

Main-memory database에서는 memory 안의 record를 직접 가리키는 `direct pointer`를 사용할 수 있다. 그러면 record access는 in-memory pointer traversal이 된다. 단, 이 방식은 records가 이동하지 않는다는 조건이 필요하다.

#### 13.7.1 slotted page와 direct allocation의 trade-off

기존 `slotted-page structure`에서는 record deletion이나 resize 때문에 record가 block 내부에서 이동할 수 있다. 그러면 record 자체에 대한 direct pointer는 안전하지 않고, slotted page header entry를 통한 한 단계 indirection이 필요하다. 다른 process가 읽는 동안 record가 이동하지 않게 block-level locking도 필요할 수 있다.

많은 main-memory database는 이런 overhead를 피하려고 record를 main memory에 직접 allocate하고, 다른 record update 때문에 record가 이동하지 않게 한다. 대신 variable-sized records가 반복적으로 insert/delete되면 memory fragmentation이 생길 수 있다. DBMS는 적절한 memory management scheme을 쓰거나, 주기적 `compaction`으로 fragmentation을 줄여야 한다. Compaction은 record movement를 유발하지만 block lock을 잡지 않는 방식으로 수행할 수 있다.

| 방식 | 장점 | 약점 |
|---|---|---|
| slotted-page style | 기존 disk/page structure와 잘 맞고 slot indirection으로 이동을 감출 수 있다. | direct pointer가 어렵고, record 이동/locking overhead가 있다. |
| direct allocation | record pointer traversal이 빠르고 buffer lookup이 필요 없다. | variable-sized record workload에서 fragmentation 관리가 필요하다. |

#### 13.7.2 in-memory columnar representation

Main-memory database가 column-oriented storage를 쓰면 한 column의 values를 consecutive memory locations에 둘 수 있다. 하지만 relation에 append가 계속 일어나면 contiguous allocation을 유지하기 위해 기존 data를 재할당해야 할 수 있다.

이를 피하기 위해 logical array 하나를 여러 physical arrays로 나누고, `indirection table`이 physical arrays의 pointers를 저장하게 할 수 있다.

![Figure 13.16](@/assets/images/cs-database-194-figure-13-16-page-646.png)
*Figure 13.16 · PDF p. 646 · logical column array를 여러 physical arrays와 indirection table로 표현한 in-memory columnar representation*

Figure 13.16의 구조에서 i번째 logical element를 찾으려면 indirection table로 i가 속한 physical array를 찾고, 그 array 안의 offset을 계산한다. 이 방식은 append와 memory allocation 비용을 줄이면서 columnar access의 locality를 어느 정도 유지한다.

### 13.8 Summary

Chapter 13의 요약은 “record layout → file organization → metadata → buffer → columnar/in-memory layout”이 하나의 성능 경로로 이어진다는 점이다.

- File은 논리적으로 record sequence로 보이지만, 실제로는 disk blocks에 mapping된다. Fixed-length record는 단순하고, variable-length record는 `slotted-page structure`로 block 내부 record 이동과 pointer 안정성을 함께 다룬다.
- Disk와 memory 사이의 transfer unit이 block이므로, related records를 같은 block에 배치하면 한 번의 block access로 여러 필요한 records를 얻을 수 있다. Disk access가 database performance의 bottleneck인 경우가 많아 record-to-block assignment가 중요하다.
- `data dictionary` 또는 `system catalog`는 relation names, attribute names/types, storage information, integrity constraints, user information 같은 metadata를 추적한다. Query processing은 거의 항상 catalog를 참조하므로 catalog layout과 caching이 중요하다.
- `database buffer`는 disk block copies를 main memory에 저장하는 영역이고, `buffer manager`는 그 공간을 배분한다. 모든 blocks를 memory에 둘 수 없기 때문에 replacement strategy가 필요하다.
- `column-oriented storage`는 data warehousing workload에서 높은 성능을 낸다. 필요한 columns만 읽고, 같은 type의 values를 압축하며, cache line과 vector processing을 잘 활용하기 때문이다.

Review terms 관점에서 반드시 Ctrl+F로 남겨 둘 키워드는 다음 묶음이다.

| 묶음 | 핵심 용어 |
|---|---|
| record/block layout | `fixed-length records`, `variable-length records`, `null bitmap`, `slotted-page structure`, `large objects` |
| file organization | `heap file organization`, `free-space map`, `sequential file organization`, `search key`, `cluster key`, `partitioning` |
| metadata | `data-dictionary storage`, `metadata`, `data dictionary`, `system catalog` |
| buffer | `database buffer`, `buffer manager`, `pinned blocks`, `evicted blocks`, `forced output`, `shared and exclusive locks` |
| replacement/recovery | `LRU`, `toss-immediate`, `MRU`, `log disk`, `journaling file systems` |
| column/main-memory | `column-oriented storage`, `columnar storage`, `vector processing`, `column stores`, `row stores`, `stripe`, `hybrid row/column storage`, `main-memory database` |

Practice Exercises와 Exercises는 단순 암기보다 설계 판단을 요구한다. 예를 들어 deletion strategy의 trade-off, free-space map bitmap 표현, multitable clustering example, buffer lookup을 위한 in-memory hash structure, partitioning의 benefit/drawback, MRU와 LRU가 각각 유리한 query plan, PostgreSQL처럼 OS buffer manager에 일부 역할을 맡기는 방식의 장단점을 스스로 설명할 수 있어야 한다.

## 연결 관계

- Chapter 12 Physical Storage Systems: disk/SSD/RAID의 block access 비용과 sequential/random access 차이가 Chapter 13의 file organization, buffer management, columnar compression 판단의 기반이 된다.
- Chapter 14 Indexing: `B+ tree file organization`, `hashing file organization`, index blocks의 buffer residency, column store에 적합한 bitmap representation이 이어진다.
- Chapter 15 Query Processing: sequential file, multitable clustering, partition pruning, buffer replacement strategy는 join/selection/sort plan의 I/O cost와 직접 연결된다.
- Chapter 17-18 Transactions/Concurrency Control: buffer-level shared/exclusive locks는 page contents 안전성만 보장하며, transaction isolation과 serializability는 별도 concurrency-control layer에서 보장한다.
- Chapter 19 Recovery System: dirty block write-back, forced output, write reordering, log disk, journaling file systems, DBMS logging은 crash recovery protocol의 전제 조건이다.
- Chapter 24 Advanced Data Analytics: column-oriented storage, ORC/Parquet, bitmap representation, vector processing은 data warehousing과 big-data analytics 실행 엔진으로 확장된다.

## 오해하기 쉬운 내용

- `page`와 `block`은 이 장에서 거의 같은 의미로 쓰이지만, 강조점이 다르다. Block은 storage transfer/allocation 단위이고, page는 DBMS가 buffer와 record layout을 다룰 때의 논리적 단위로 자주 말한다.
- `search key`는 primary key나 superkey일 필요가 없다. Sequential file organization에서 search key는 단지 record ordering 기준이다.
- `free list`와 `free-space map`은 같은 문제가 아니다. Free list는 deleted fixed-length slots를 연결하고, free-space map은 heap file에서 block별 available space를 빠르게 찾기 위한 요약 구조다.
- `pin`은 lock이 아니다. Pin은 eviction을 막고, shared/exclusive lock은 buffer block contents의 동시 read/write 안전성을 보장한다.
- LRU가 항상 좋은 buffer replacement strategy는 아니다. Query plan이 미래 접근 패턴을 알려 주는 경우 `toss-immediate`나 `MRU`가 더 적합할 수 있다.
- File system journaling이 database recovery를 자동으로 해결하지 않는다. DBMS application writes는 보통 file-system log에 모두 기록되지 않으므로 DBMS는 자체 logging/recovery mechanism을 둔다.
- Column store는 모든 query에 빠른 저장 방식이 아니다. Many rows/few columns analytics에는 강하지만, few rows/many columns transaction processing에는 tuple reconstruction과 decompression 비용이 커질 수 있다.
- Main-memory database는 단순히 buffer size를 크게 잡은 disk-based DBMS와 다르다. Buffer manager를 제거하고 direct pointer, memory allocation, fragmentation management 등 memory-resident assumption에 맞춘 구조를 쓴다.

## 면접 질문

1. Fixed-length record에서 deletion을 처리하는 세 가지 방식, 즉 뒤 record들을 당기기, 마지막 record를 옮기기, free list를 쓰기의 장단점을 설명하라.
2. Variable-length record에서 `offset/length pair`, `null bitmap`, `slotted-page structure`가 각각 해결하는 문제가 무엇인가?
3. Heap file organization에서 `free-space map`과 `second-level free-space map`은 insertion 비용을 어떻게 줄이는가?
4. Sequential file organization에서 `overflow block`이 필요한 이유와, 시간이 지나면 `reorganization`이 필요한 이유를 설명하라.
5. `multitable clustering file organization`이 join에는 유리하지만 single-relation scan에는 불리할 수 있는 이유는 무엇인가?
6. `data dictionary`를 relation으로 저장할 때 생기는 bootstrap 문제와 nonnormalized catalog design의 이유를 설명하라.
7. `pinned block`, `shared lock`, `exclusive lock`의 역할 차이를 buffer manager 관점에서 설명하라.
8. Figure 13.13의 nested-loop join에서 `instructor` block에는 `toss-immediate`, `department` block에는 `MRU`가 적합한 이유를 설명하라.
9. Write reordering이 crash 후 disk data structure를 깨뜨릴 수 있는 이유와, `log disk`/`journaling file system`이 이를 완화하는 방식을 설명하라.
10. `row-oriented storage`와 `column-oriented storage`를 analytics/transaction processing 관점에서 비교하라.
11. ORC의 `stripe`, `index data`, `row data`, `stripe footer`가 selection-based skipping과 decompression 시작점에 어떻게 기여하는가?
12. Main-memory database에서 `direct pointer`가 가능한 조건과, variable-sized records 때문에 생기는 fragmentation 문제를 설명하라.
