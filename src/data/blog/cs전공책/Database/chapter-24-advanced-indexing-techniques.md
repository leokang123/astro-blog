---
title: "Chapter 24. Advanced Indexing Techniques"
order: 24
pubDatetime: 2026-05-18T00:00:00+09:00
modDatetime: 2026-05-18T00:00:00+09:00
description: "Database System Concepts 정리: Chapter 24. Advanced Indexing Techniques"
tags:
  - "Database"
  - "CS"
---

## 개요

Chapter 24는 Chapter 14에서 간단히 소개했던 advanced index structures를 조금 더 자세히 설명한다. 핵심은 일반적인 `B+ -tree`가 잘 맞지 않는 상황, 즉 write-heavy workload, multi-key selection, multidimensional/spatial query, growing hash file에서 어떤 index 구조가 쓰이는지 이해하는 것이다.

이 장에서 다루는 범위는 다음과 같다.

- `Bloom filter`: membership test를 아주 작은 공간으로 수행하되 false positive를 허용하는 probabilistic data structure.
- `log-structured merge tree (LSM tree)`와 variants: random I/O를 sequential I/O로 바꾸어 high write rate에 대응하는 write-optimized index.
- `bitmap index`: low-cardinality attribute와 multiple-key selection, aggregate count에 강한 bit-array 기반 index.
- `spatial indexing`: `quadtree`, `R-tree`처럼 2차원 이상의 위치/영역 data를 위한 index.
- `hash index`: equality lookup을 위한 static/dynamic hashing, 특히 `extendable hashing`.

우선순위가 보류인 장이므로 특정 제품/역사 암기보다 “언제 B+ -tree 대신 이런 구조가 필요한가”와 핵심 trade-off를 남기는 데 집중한다.

## 핵심 개념

| 구조 | 핵심 아이디어 | 강점 | 약점 |
|---|---|---|---|
| `Bloom filter` | 여러 hash function으로 bitmap bit를 세팅해 absent 여부를 빠르게 판정 | 아주 작고 negative lookup을 빠르게 제거 | false positive 가능, false negative는 없음 |
| `LSM tree` | memory tree `L0`에 쓰고, disk tree level들로 sequential merge | write amplification과 random seek 감소 | lookup 시 여러 tree를 찾아야 함 |
| `stepped-merge index` | level마다 여러 tree를 두고 한꺼번에 다음 level로 merge | update/write cost 더 낮음 | point lookup 부담 증가, Bloom filter가 필요 |
| `bitmap index` | attribute value마다 record-position bitmap을 둠 | AND/OR/NOT bit operation으로 multi-key query 빠름 | high-cardinality attribute에는 bitmap 수/크기 증가 |
| `quadtree` | space를 정규적으로 4분할 | point/region data의 공간 분할이 직관적 | skew에 따라 tree shape와 성능이 흔들림 |
| `R-tree` | object의 bounding box를 계층적으로 묶음 | rectangles/polygons 같은 extended object에 적합 | overlapping bounding box가 search cost를 키울 수 있음 |
| `hash index` | search key를 bucket으로 mapping | equality lookup 빠름 | range query 부적합, bucket overflow/dynamic growth 관리 필요 |

## 세부 정리

### 24.1 Bloom Filter

`Bloom filter`는 set membership을 매우 작은 공간으로 검사하는 `probabilistic data structure`다. 정확한 set을 저장하는 대신 bitmap과 여러 hash function을 사용한다. 결과는 다음처럼 해석한다.

| Bloom filter 결과 | 의미 |
|---|---|
| 어느 hash bit라도 0 | 값은 set에 절대 없음. false negative 없음 |
| 모든 hash bit가 1 | 값이 set에 있을 수 있음. false positive 가능 |

기본 동작은 bitmap의 모든 bit를 0으로 초기화한 뒤, set의 각 value `v`에 대해 hash function 위치의 bit를 1로 세팅하는 것이다. 처음 설명에서는 hash function 하나 `h()`를 가정한다. set size가 `n`이면 bitmap size는 보통 몇 배, 예를 들어 `10n` bits 정도로 둔다. value `v`를 lookup할 때 `h(v)` 위치의 bit가 0이면 `v`는 set에 있을 수 없다. bit가 1이면 `v`가 있을 수도 있지만, 다른 value `v'`가 같은 hash position을 만들었을 수 있으므로 false positive가 가능하다.

false positive를 줄이기 위해 실제 Bloom filter는 `k`개의 independent hash functions `h_i()`, `i = 1..k`를 사용한다. value를 삽입할 때는 `h_1(v) ... h_k(v)` 위치 bit를 모두 1로 세팅한다. lookup 때도 같은 `k`개 위치를 검사한다.

```text
insert(v):
  for i = 1..k:
    bitmap[h_i(v)] = 1

may_contain(v):
  if any bitmap[h_i(v)] == 0:
    return definitely_absent
  else:
    return possibly_present
```

책의 예시처럼 bitmap이 `10n` bits이고 hash function이 `k = 7`개이면 false positive rate가 약 1% 수준이 될 수 있다. Bloom filter는 특히 LSM/stepped-merge처럼 lookup해야 할 tree가 여러 개 있을 때 “이 tree에는 key가 확실히 없다”를 빠르게 판정해 불필요한 disk lookup을 줄이는 데 중요하다.

### 24.2 Log-Structured Merge Tree and Variants

`log-structured merge tree (LSM tree)`의 핵심은 insert/update/delete 때 발생하는 random I/O를 더 적은 sequential I/O로 바꾸는 것이다. `B+ -tree`는 write-heavy workload에서 leaf page를 찾아 random update하고 split도 수행하므로 비용이 커진다. LSM tree는 memory에 먼저 쓰고, disk에는 정렬된 run/tree를 큰 단위로 merge한다.

![Figure 24.1](@/assets/images/cs-database-337-figure-24-1-page-1205.png)
*Figure 24.1 · PDF p. 1205 · in-memory L0와 disk L1-L3로 구성된 LSM tree level 구조*

LSM tree는 여러 B+ -tree로 구성된다.

- `L0`: in-memory B+ -tree.
- `L1, L2, ..., Lk`: disk에 있는 B+ -tree levels.
- `k`: level 수를 나타내는 값이며, 각 level의 target size는 이전 level보다 일정 배수만큼 크다.

lookup은 `L0 ... Lk` 각각에서 separate lookup을 수행하고 결과를 merge한다. insert는 먼저 `L0`에 들어간다.

#### 24.2.1 Insertion into LSM Trees

`L0`가 가득 차면 그 내용을 disk tree로 내려보낸다. `L1`이 비어 있으면 `L0` 전체를 disk에 써서 초기 `L1`을 만든다. `L1`이 이미 있으면 `L0` leaf를 key order로 scan하고, `L1` leaf도 key order로 scan해 두 stream을 merge한 뒤 bottom-up build로 새 `L1` B+ -tree를 만든다. 이후 새 tree가 old `L1`을 대체하고, `L0`는 비워진다.

이 방식의 장점은 다음과 같다.

| 장점 | 이유 |
|---|---|
| sequential leaf layout | merge로 새 tree를 만들기 때문에 leaf들이 sequential하게 배치됨 |
| full leaves | page split으로 생기는 partially occupied leaf overhead가 줄어듦 |
| distributed file system과 잘 맞음 | 이미 생성된 block update를 지원하지 않는 DFS에서는 새 tree 작성이 자연스러움 |

비용도 있다. `L0`에서 `L1`로 entries를 내릴 때 old `L1`의 전체 contents를 새 tree로 copy해야 한다. 이를 완화하기 위해 각 level의 target size를 이전 level의 `k`배로 둔다. `L0` size를 `M`, 전체 index entry size를 `I`라고 하면 level 수는 대략 다음과 같다.

$$
r \approx \log_k(I/M)
$$

각 leaf가 `m` entries를 담고 level size ratio가 `k`이면, insert당 I/O 수는 대략 다음과 같이 줄어든다.

$$
\text{I/O per insert} \approx (k/m)\log_k(I/M)
$$

LSM tree가 유리하려면 level 수 `r`이 `m/k`보다 작아야 한다. level이 너무 많아지면 I/O count상 이득이 줄지만, random I/O 대신 sequential I/O를 쓰는 장점은 남는다. parallel/distributed environment에서는 relation을 range partition하고 partition마다 별도 LSM tree를 두어 각 tree의 level 수를 작게 유지할 수 있다. 다만 partition마다 `L0` memory가 필요하므로 centralized setting보다는 node를 추가할 수 있는 parallel setting에 더 잘 맞는다.

#### 24.2.2 Rolling Merges

단순하게 level 전체가 가득 찼을 때 한 번에 merge하면 merge 시점에는 I/O load가 크게 튀고, merge 사이에는 I/O capacity가 놀 수 있다. 이를 피하기 위해 `rolling merge`를 사용한다.

`rolling merge`는 `Li`의 몇 page를 대응되는 `Li+1` page와 조금씩 merge하고, merge한 record를 `Li`에서 제거한다. `Li`가 target size에 가까워질 때마다 이전 merge가 멈춘 leaf position 다음부터 다시 sequential scan을 시작한다. 끝까지 가면 다시 처음부터 돈다. 한 번에 merge하는 leaf 수는 seek time이 transfer time에 비해 작아질 만큼 충분히 크게 잡는다.

#### 24.2.3 Handling Deletes and Updates

LSM tree에서 delete는 기존 entry를 찾아 즉시 지우는 방식이 아니다. 대신 `deletion entry`를 새로 insert한다. lookup은 여러 tree에서 결과를 모은 뒤, 같은 key의 original entry와 deletion entry를 함께 발견하면 original entry를 반환하지 않는다. merge 중에는 original entry와 matching deletion entry가 만나면 둘 다 버린다.

update도 비슷하다. `update entry`를 insert하고, lookup은 original entry와 update entry를 맞춰 latest value를 반환한다. merge 중에는 matching entry와 update entry가 만나면 update를 적용한 새 entry를 만들고 update entry는 버린다. 이 방식은 in-place update를 피하고 append/merge 중심으로 쓰기를 처리한다.

#### 24.2.4 The Stepped-Merge Index

`stepped-merge index`는 level마다 tree 하나가 아니라 여러 tree를 둔다. 개발자 커뮤니티에서는 basic LSM tree, stepped-merge index, 여러 variants를 모두 LSM tree라고 부르기도 하지만, 책은 구분해서 설명한다.

![Figure 24.2](@/assets/images/cs-database-338-figure-24-2-page-1208.png)
*Figure 24.2 · PDF p. 1208 · 각 level에 여러 tree를 두는 stepped-merge index 구조*

##### 24.2.4.1 Insertion Algorithm

stepped-merge index도 incoming data를 memory의 `L0` tree에 먼저 저장한다. 차이는 `L0`가 가득 찼을 때 기존 `L1`과 merge하지 않고, `L0` 자체를 disk에 새 tree로 쓴다는 점이다. 그래서 disk에는 `L0^1`, `L0^2` 같은 여러 tree가 생길 수 있다.

tree가 너무 많아지면 lookup cost가 커지므로, level `Li`의 on-disk tree 수가 limit `k`에 도달하면 그 level의 `k`개 tree를 한 번에 merge해 다음 level `Li+1`의 하나의 tree로 만든다. 모든 leaf scan과 output write가 sorted/sequential하게 이루어져 random I/O를 피한다.

write cost 차이는 중요하다.

| 구조 | level당 entry write/read 특성 | write amplification 직관 |
|---|---|---|
| `B+ -tree` | page 단위 random update | page에 100 entries면 entry 하나 update도 page rewrite로 크게 증폭 |
| basic `LSM tree` | `Li`를 `Li+1`에 merge할 때 `Li+1` 전체를 반복적으로 read/write | 평균적으로 level마다 여러 번 rewrite |
| `stepped-merge index` | 각 record가 level마다 대체로 한 번 쓰이고 다음 merge 때 한 번 읽힘 | update cost가 basic LSM보다 낮음 |

책의 예시에서 `I = 100M`, `k = 5`이면 `log_5(100) = 3` levels다. B+ -tree page에 100 entries가 있으면 write amplification은 약 100이다. LSM tree는 약 `5/2 * 3 = 7.5`, stepped-merge index는 약 3이다. `k = 10`이면 stepped-merge는 약 2, LSM tree는 약 10으로 설명된다. 숫자 자체보다 중요한 점은 stepped-merge가 write-heavy workload에서 write amplification을 더 줄인다는 것이다.

merge optimization으로는 `Li`의 `k`개 tree를 `Li+1`로 merge할 때, 더 낮은 levels `Lj, j < i`의 tree도 함께 merge해 entries가 중간 level을 건너뛰게 할 수 있다. 시스템이 idle하면 level에 `k`개가 차기 전에도 merge할 수 있고, insert가 적은 긴 기간에는 여러 level을 하나의 tree로 합칠 수 있다.

##### 24.2.4.2 Lookup Operations Using Bloom Filters

stepped-merge index의 약점은 lookup이다. tree가 여러 개 있으므로 worst case에는 level마다 `k`개 tree를 찾아야 한다.

| 구조 | worst-case tree lookup 수 |
|---|---|
| basic LSM tree | `log_k(I/M)` |
| stepped-merge index | `k * log_k(I/M)` |

예를 들어 `I = 100M`, `k = 5`이면 stepped-merge는 한 lookup에 15 tree traversal이 필요할 수 있고, basic LSM은 3 traversal이면 된다. 하지만 보통 key는 한 tree에만 존재하므로 대부분의 traversal은 “없음”을 확인하는 낭비가 된다.

이를 줄이는 도구가 `Bloom filter`다. 각 tree마다 key set에 대한 Bloom filter를 붙인다. lookup key `v`를 tree의 Bloom filter에 먼저 검사해서 absent가 나오면 그 tree traversal을 건너뛴다. Bloom filter가 possibly present라고 하면 실제 tree lookup을 수행한다.

책의 조건처럼 tree에 `n` elements가 있고 `10n` bits와 7 hash functions를 쓰면 false positive rate가 약 1%다. key가 index에 존재하는 point lookup에서는 평균적으로 거의 한 tree만 실제 접근하므로 regular B+ -tree보다 약간 나쁜 수준으로 줄일 수 있다. 단, Bloom filters를 memory에 유지하려면 전체 index key 수 `I`에 대해 대략 `10I` bits가 필요하다. 일부 Bloom filter는 flash storage에 둘 수도 있다.

중요한 제한: `range lookup`에는 Bloom filter optimization을 쓸 수 없다. range에는 unique hash value 하나가 없으므로 모든 tree를 separately access해야 한다.

#### 24.2.5 LSM Trees For Flash Storage

LSM tree는 원래 hard disk의 write/seek overhead를 줄이기 위해 설계되었다. flash disk는 seek가 없으므로 random I/O 회피 이점은 HDD보다 작다. 하지만 flash memory는 in-place update를 허용하지 않고, byte 하나를 바꾸더라도 page 전체를 새 physical location에 rewrite해야 하며, old location erase가 비싸다. 따라서 B+ -tree보다 write amplification을 줄이는 LSM tree variants는 flash storage에서도 여전히 큰 성능 이점을 줄 수 있다.

### 24.3 Bitmap Indices

`bitmap index`는 multiple keys에 대한 selection을 빠르게 처리하기 위해 설계된 specialized index다. 특히 attribute가 가질 수 있는 distinct value 수가 작은, 즉 low-cardinality attribute에 적합하다. bitmap index를 쓰려면 relation의 records가 0부터 시작하는 sequential record number를 가져야 하고, record number `n`에서 실제 record를 쉽게 찾아갈 수 있어야 한다. fixed-size records가 consecutive blocks에 저장된 경우 record number를 block number와 block 내부 slot으로 쉽게 변환할 수 있다.

`column-oriented storage`와도 잘 맞는다. column store는 attribute를 array로 저장해 `i`번째 record의 특정 attribute에 빠르게 접근할 수 있으므로, record position을 기준으로 하는 bitmap index와 궁합이 좋다.

#### 24.3.1 Bitmap Index Structure

bitmap은 bit array다. attribute `A`에 대한 가장 단순한 bitmap index는 `A`가 가질 수 있는 각 value마다 bitmap 하나를 둔다. relation record 수가 `N`이면 각 bitmap도 `N` bits다. value `v_j`의 bitmap에서 `i`번째 bit는 record `i`의 `A` 값이 `v_j`이면 1, 아니면 0이다.

![Figure 24.3](@/assets/images/cs-database-339-figure-24-3-page-1212.png)
*Figure 24.3 · PDF p. 1212 · instructor_info relation의 gender와 income_level에 대한 bitmap index 예*

예시 relation `instructor_info`에는 `gender`와 `income_level`이 있다.

- `gender`: `m`, `f` 두 값.
- `income_level`: `L1`부터 `L5`까지 5개 range.

단일 condition, 예를 들어 `gender = 'f'`만 찾는다면 bitmap index가 항상 큰 이득을 주지는 않는다. 결국 matching records가 많은 경우 relation의 거의 모든 disk block을 읽어야 할 수 있기 때문이다. bitmap index의 진짜 장점은 여러 key에 대한 condition을 조합할 때 나타난다.

예를 들어 다음 query를 보자.

```sql
select *
from instructor_info
where gender = 'f' and income_level = 'L2';
```

이 query는 `gender = f` bitmap과 `income_level = L2` bitmap을 가져와 bitwise intersection, 즉 logical-AND를 수행한다.

```text
gender = f       01101
income_level=L2 01000
AND             01000
```

결과 bitmap에서 1인 bit position만 실제 record로 찾아가면 된다. `gender`가 2가지, `income_level`이 5가지라면 두 조건을 모두 만족하는 record는 평균적으로 약 1/10 정도로 줄어든다. condition이 더 많아질수록 matching fraction은 더 작아져 bitmap intersection의 이득이 커진다. 반대로 결과 fraction이 크면 전체 relation scan이 더 쌀 수 있다.

bitmap의 또 다른 중요한 용도는 data analysis에서 count query를 빠르게 처리하는 것이다. 예를 들어 `gender = f`이고 `income_level = L2`인 tuple 수만 필요하다면, intersection bitmap에서 1 bit 수만 세면 되고 relation 자체를 읽을 필요가 없다.

bitmap index는 대체로 relation size에 비해 작다. record 하나가 수십~수백 bytes라면, bitmap 하나는 record당 1 bit만 사용한다. 예를 들어 record size가 100 bytes이면 bitmap 하나의 크기는 relation size의 약 `1/800`, 즉 0.125% 수준이다. attribute가 8개 value 중 하나만 갖는다면 bitmap 8개를 모두 합쳐도 relation size의 약 1% 정도다.

record deletion은 record numbering에 gap을 만든다. gap을 메우려고 record number를 옮기면 너무 비싸므로, deleted record를 표시하는 `existence bitmap`을 둔다. bit `i`가 0이면 record `i`는 존재하지 않고, 1이면 존재한다. insertion은 sequence numbering을 흔들지 않도록 file 끝에 append하거나 deleted record slot을 재사용한다.

#### 24.3.2 Efficient Implementation of Bitmap Operations

bitmap intersection은 각 bit position의 AND를 계산하면 된다. 하지만 bit를 하나씩 처리하지 않고 CPU의 `bit-wise and` instruction을 사용하면 32-bit 또는 64-bit word 단위로 한 번에 처리할 수 있다. 예를 들어 1 million records가 있으면 bitmap은 1 million bits, 약 128 KB다. 32-bit word 기준으로 두 bitmap intersection에는 31,250 instructions 정도면 충분하다.

| bitmap operation | SQL predicate 의미 | CPU operation |
|---|---|---|
| intersection | `cond1 AND cond2` | bit-wise AND |
| union | `cond1 OR cond2` | bit-wise OR |
| complement | `NOT cond` | bit-wise NOT 후 보정 필요 |
| count bits | `count(*) where cond` | byte/word별 precomputed bit count table |

complement는 주의가 필요하다. `NOT (income_level = L1)`을 단순히 `income_level = L1` bitmap의 bitwise complement로 만들면 deleted records bit도 1이 되어 버린다. 또한 `income_level`이 `null`인 record도 original bitmap에서는 0이므로 complement에서는 1이 되는데, SQL의 null semantics를 고려하면 단순 complement와 다를 수 있다.

따라서 complement 결과는 적어도 `existence bitmap`과 AND하여 deleted record bit를 꺼야 한다. null value를 다루려면 `null` value bitmap의 complement와도 intersection해야 한다. `is unknown` 같은 predicate까지 정확히 처리하려면 추가 bitmap이 필요할 수 있다.

1 bit 개수 세기에는 lookup table을 쓸 수 있다. 예를 들어 256-entry array를 만들고, entry `i`에 byte value `i`의 binary representation에서 1 bit 수를 저장한다. bitmap의 각 byte를 이 array index로 사용해 count를 더하면 된다. 2-byte pair를 index로 쓰는 65,536-entry array를 쓰면 더 빠르지만 storage cost가 커진다.

#### 24.3.3 Bitmaps and B+ -Trees

bitmap은 B+ -tree와 결합할 수도 있다. 어떤 attribute에서 몇몇 value가 매우 자주 등장하고, 나머지 value는 드물게 등장하는 경우를 생각하자. 보통 B+ -tree leaf에서는 각 value마다 matching record identifiers list를 둔다. 그러나 frequent value의 record id list는 매우 커질 수 있다.

이때 frequent value에는 record id list 대신 bitmap을 저장하면 더 작을 수 있다. 예를 들어 relation record 수가 `N`이고 record identifier가 64 bits라고 하자. value `v_i`가 `N/16` records에 나타나면 list representation은 `64 * N/16 = 4N` bits가 필요하다. bitmap은 `N` bits만 필요하므로 더 작다. 반대로 특정 value가 `N/64`보다 적게 나타나면 64-bit record id list가 bitmap보다 작을 수 있다.

즉 hybrid approach는 다음 기준을 갖는다.

| value frequency | leaf representation |
|---|---|
| very frequent value | bitmap이 유리 |
| rare value | record identifier list가 유리 |

결론적으로 bitmap은 low-cardinality 전체 attribute뿐 아니라, B+ -tree leaf에서 frequent value의 posting list를 압축하는 저장 기법으로도 유용하다.

### 24.4 Indexing of Spatial Data

`spatial data`는 단순한 scalar key와 다르다. index는 point뿐 아니라 line segment, rectangle, polygon 같은 region object도 다뤄야 하며, `range query`와 `nearest neighbor query`를 효율적으로 지원해야 한다. 앞 장의 `k-d tree`, `quadtree`, `R-tree` 개념을 여기서는 더 구체화한다.

중요한 설계 차이는 “객체를 partition boundary에서 쪼갤 것인가”다. k-d tree나 quadtree를 region object에 그대로 적용하면, line segment나 polygon이 partitioning line을 가로지를 때 여러 subtree에 나뉘어 저장될 수 있다. 같은 객체가 여러 번 나타나면 storage cost가 커지고 query도 중복 경로를 확인해야 한다. R-tree는 이런 region object를 더 효율적으로 indexing하기 위해 bounding box 기반으로 설계되었다.

#### 24.4.1 Quadtrees

`quadtree`는 two-dimensional data를 표현하는 tree다. 각 node는 직사각형 spatial region과 연결된다. root node는 전체 target space를 나타내고, nonleaf node는 자기 region을 같은 크기의 네 quadrant로 나눈다. 따라서 각 internal node는 네 child node를 가진다.

![Figure 24.4](@/assets/images/cs-database-340-figure-24-4-page-1215.png)
*Figure 24.4 · PDF p. 1215 · quadtree가 공간을 4분할하며 point distribution을 표현하는 방식*

point indexing용 quadtree에서는 leaf node가 0개부터 고정된 maximum number의 points를 가진다. 어떤 node region에 저장할 points가 maximum을 넘으면 그 node를 네 child로 subdivide한다. Figure 24.4의 예시는 leaf 하나의 maximum point 수가 1인 경우다.

이 형태를 `PR quadtree`라고 부른다. 여기서 `P`는 points를 저장한다는 뜻이고, `R`은 split이 실제 point distribution이 아니라 region 자체의 고정 분할에 의해 결정된다는 뜻이다. 즉 data value가 어디에 몰렸는지에 따라 split line을 임의로 고르는 것이 아니라, 공간을 같은 크기의 네 영역으로 계속 나눈다.

`region quadtree`는 array 또는 raster information 저장에 사용할 수 있다. 어떤 node가 담당하는 region의 array 값이 모두 같으면 그 node는 leaf가 된다. 값이 섞여 있으면 같은 면적의 네 child로 다시 나뉜다. 따라서 leaf는 single array element일 수도 있고, 여러 array elements를 포함하되 모두 같은 value를 가진 subarray일 수도 있다.

| quadtree 형태 | 저장 대상 | leaf 조건 | 핵심 특징 |
|---|---|---|---|
| `PR quadtree` | points | point 수가 maximum 이하 | region 기반 4분할 |
| `region quadtree` | raster/array values | region 내부 값이 모두 동일 | 동일 값 영역을 압축적으로 표현 |

quadtree의 장점은 partition rule이 단순하고, 같은 region에 대해 여러 quadtree가 같은 방식으로 분할될 수 있다는 점이다. 그래서 spatial join처럼 두 공간 분할을 맞춰 비교하는 작업은 R-tree보다 단순할 수 있다. 반대로 object가 partition line을 자주 가로지르면 같은 객체를 여러 곳에 저장해야 하므로 비효율이 생길 수 있다.

#### 24.4.2 R-Trees

`R-tree`는 points, line segments, rectangles, polygons 같은 spatial objects를 indexing하는 balanced tree다. B+ -tree와 비슷하게 leaf node에 indexed objects를 저장하지만, key range 대신 각 node에 rectangular `bounding box`를 붙인다.

bounding box는 axis-parallel rectangle이다. leaf node의 bounding box는 leaf에 저장된 모든 objects를 포함하는 가장 작은 rectangle이고, internal node의 bounding box는 child nodes의 bounding boxes를 포함하는 가장 작은 rectangle이다. polygon 같은 object 자체의 bounding box도 같은 방식으로 정의된다.

![Figure 24.5](@/assets/images/cs-database-341-figure-24-5-page-1217.png)
*Figure 24.5 · PDF p. 1217 · rectangles와 이를 묶는 R-tree bounding boxes 구조*

R-tree node의 entry 구조는 다음처럼 볼 수 있다.

| node 종류 | entry 내용 |
|---|---|
| internal node | child node의 bounding box + child pointer |
| leaf node | indexed object, 선택적으로 object bounding box |

leaf에 object bounding box를 함께 저장하면 overlap check를 빠르게 거를 수 있다. query rectangle이 object bounding box와 겹치지 않으면 실제 object와도 겹칠 수 없기 때문이다. indexed object가 rectangle이면 bounding box와 object가 같으므로 따로 저장할 필요가 없다.

`Search`에서는 sibling node의 bounding boxes가 서로 overlap할 수 있다는 점이 중요하다. B+ -tree, k-d tree, quadtree에서는 보통 한 key나 region이 한 경로로 좁혀지지만, R-tree에서는 point를 포함하는 object를 찾을 때 그 point를 포함하는 모든 child bounding box를 따라가야 한다. 어떤 object와 intersect하는 objects를 찾는 query도 query object와 intersect하는 모든 node rectangle을 내려가야 한다. 이 때문에 여러 path가 동시에 search될 수 있다.

`Insert`는 object를 담을 leaf node를 고르는 문제에서 heuristic을 쓴다. 이상적으로는 object의 bounding box를 포함하고 여유 공간이 있는 leaf를 고르면 좋지만, root에서 한 경로만 따라 내려가며 찾기 어렵다. internal node에서 여러 child가 object bounding box를 포함할 수도 있고, 모두 탐색하면 비싸기 때문이다. 그래서 알고리즘은 root에서 내려가며 다음 규칙을 쓴다.

1. object bounding box를 포함하는 child bounding box가 있으면 그중 하나를 선택한다.
2. 그런 child가 없으면 object bounding box와 maximum overlap을 갖는 child를 선택한다.
3. leaf가 full이면 B+ -tree처럼 node split을 수행하고 필요하면 split을 위로 전파한다.
4. split 후에도 leaf와 internal node의 bounding boxes가 실제 contents를 모두 포함하도록 갱신한다.

R-tree split은 B+ -tree split보다 어렵다. 1차원 key에서는 midpoint를 기준으로 “절반은 작고 절반은 크다”는 식의 분할이 가능하지만, 다차원 spatial objects에서는 두 집합의 bounding boxes가 overlap하지 않도록 항상 나눌 수 없다. 따라서 보통 total area가 작아지거나 overlap이 작아지도록 heuristic split을 사용한다.

대표적으로 `quadratic split heuristic`은 다음 순서로 동작한다.

1. 같은 node에 넣었을 때 wasted space가 가장 큰 entry pair `a`, `b`를 고른다.
2. `a`를 `S1`, `b`를 `S2`에 각각 seed로 둔다.
3. 남은 entry `e`마다 `S1`에 넣을 때 bounding box 증가량 `i_e,1`, `S2`에 넣을 때 증가량 `i_e,2`를 계산한다.
4. 두 증가량 차이가 가장 큰, 즉 어느 한쪽에 대한 preference가 가장 강한 entry를 선택한다.
5. 증가량이 더 작은 쪽에 entry를 넣는다.
6. 모든 entry를 배정하거나 minimum occupancy를 맞추기 위해 나머지를 한쪽에 몰아야 할 때 멈춘다.

`Deletion`은 B+ -tree deletion처럼 sibling에서 entry를 빌리거나 underfull node를 merge하는 방식으로 처리할 수 있다. 다른 방법으로는 underfull node의 모든 entries를 sibling nodes로 redistribute하여 clustering을 개선할 수도 있다.

R-tree의 storage efficiency는 k-d tree나 quadtree보다 좋다. object를 한 번만 저장하고, node가 적어도 절반 정도 차도록 관리하기 쉽기 때문이다. 반면 query는 bounding box overlap 때문에 여러 path를 search해야 하므로 느려질 수 있다. 정리하면, R-tree와 그 variants인 `R* -tree`, `R+ -tree`는 B-tree와 구조적으로 비슷하고 저장 효율이 좋아 spatial data를 지원하는 database systems에서 널리 쓰인다.

### 24.5 Hash Indices

`hash index`는 search-key value를 `hash function`으로 bucket address에 매핑해 point query를 빠르게 처리하는 index다. 이 절에서는 static hashing과 dynamic hashing을 나누어 다룬다. 기본 표기는 다음과 같다.

| 기호 | 의미 |
|---|---|
| `K` | 가능한 search-key values의 집합 |
| `B` | bucket addresses의 집합 |
| `h` | `K -> B`로 가는 hash function |

hash index에서는 bucket이 index entries와 record pointers를 담고, hash file organization에서는 bucket이 actual records를 담는다. 책은 이후 설명에서 둘을 크게 구분하지 않고 `hash index`라는 말로 함께 다룬다.

#### 24.5.1 Static Hashing

`static hashing`에서는 index를 만들 때 bucket 집합 `B`가 고정된다. search-key value `K_i`를 찾을 때는 `h(K_i)`를 계산하고 해당 bucket을 읽는다. bucket 안에서 matching key와 pointer를 찾으면 실제 record로 간다. primary key처럼 key마다 record가 하나면 pointer도 하나지만, duplicate key가 허용되면 한 key에 여러 pointers가 연결될 수 있다.

![Figure 24.6](@/assets/images/cs-database-342-figure-24-6-page-1220.png)
*Figure 24.6 · PDF p. 1220 · instructor file의 ID search key에 대한 secondary hash index*

Figure 24.6은 `instructor` file의 `ID`에 대한 secondary hash index다. hash function은 ID의 digit 합을 8로 나눈 나머지를 bucket 번호로 사용한다. 예시는 bucket size를 2로 작게 두었기 때문에 한 bucket에 3개 key가 매핑되어 overflow bucket이 생긴다.

hash index가 잘하는 일은 equality 기반 `point query`다. 예를 들어 `ID = 10101`처럼 search key 값이 정확히 주어지면 hash function 한 번으로 후보 bucket을 바로 찾는다. 하지만 `range query`에는 약하다. 좋은 hash function일수록 key 값을 bucket에 random하게 흩뿌리므로, `(lb, ub)` 범위의 key들이 연속된 bucket에 모이지 않는다. 결국 range 안의 값을 찾으려면 많은 bucket 또는 전체 bucket을 읽어야 할 수 있다.

`Deletion`도 기본적으로는 `h(K_i)`를 계산한 뒤 해당 bucket에서 record entry를 찾아 지운다. key 값당 record 수가 적으면 효율적이다. 그러나 duplicate key가 매우 많으면 같은 key에 연결된 entries를 많이 scan해야 해서 최악의 경우 record 수에 선형으로 가까워질 수 있다.

static hashing의 가장 큰 약점은 성장에 둔감하다는 점이다. relation이 예상보다 훨씬 커지면 bucket overflow chains가 길어지고 성능이 나빠진다. bucket 수를 늘려 hash index를 rebuild할 수는 있지만, 큰 relation에서는 많은 records를 다시 reindex해야 하므로 normal processing을 크게 방해한다. 특히 disk-resident data에서는 disruption이 더 크다. 이 문제가 dynamic hashing의 출발점이다.

##### 24.5.1.1 Hash Functions

나쁜 hash function의 극단은 모든 search-key values를 같은 bucket으로 보내는 것이다. 그러면 lookup이 사실상 bucket 전체 scan이 된다. 이상적인 hash function은 stored keys를 buckets 전체에 균등하게 분산한다.

좋은 hash function의 요구사항은 두 가지다.

| 성질 | 의미 | 실패 예 |
|---|---|---|
| `uniform` | 가능한 search-key values를 bucket마다 비슷한 수로 배정 | 이름 첫 글자별 26 buckets는 Q/X보다 B/R에 많이 몰릴 수 있음 |
| `random` | 실제 key distribution이나 외부 ordering과 hash value가 상관되지 않음 | salary range별 bucket은 특정 급여대에 records가 몰릴 수 있음 |

`uniform`은 가능한 key value 공간을 고르게 나누는 성질이고, `random`은 실제로 들어오는 data distribution과 상관이 적어 bucket load가 평균적으로 비슷해지는 성질이다. 예를 들어 salary를 10개 range로 나누면 value range는 균등해 보일 수 있지만, 실제 salary가 중간 range에 몰리면 bucket skew가 생긴다.

![Figure 24.7](@/assets/images/cs-database-343-figure-24-7-page-1222.png)
*Figure 24.7 · PDF p. 1222 · dept_name을 key로 한 instructor file의 hash organization*

문자열 hash function은 보통 key의 internal binary representation을 이용한다. 단순한 방법은 character binary values를 모두 더한 뒤 bucket 수로 modulo를 취하는 것이다. 더 나은 문자열 hash의 예는 길이 `n`인 string `s`에 대해 다음 polynomial form을 쓰는 것이다.

$$
s[0] * 31^{n-1} + s[1] * 31^{n-2} + \cdots + s[n-1]
$$

구현은 hash result를 0으로 시작하고, 앞 문자부터 차례로 `hash = hash * 31 + next_character`를 반복하면 된다. fixed-size integer overflow는 사실상 큰 modulus를 취하는 효과를 내고, 마지막에 bucket 수로 modulo를 취해 bucket address를 얻는다.

핵심은 hash function을 신중히 설계해야 한다는 점이다. bad hash function은 lookup time을 file의 search-key 수에 비례하게 만들 수 있지만, well-designed hash function은 average-case lookup time을 record 수와 거의 독립적인 작은 constant에 가깝게 만든다.

##### 24.5.1.2 Handling of Bucket Overflows

`bucket overflow`는 record를 삽입하려는 bucket에 충분한 공간이 없을 때 발생한다. 원인은 크게 두 가지다.

| 원인 | 설명 |
|---|---|
| insufficient buckets | bucket 수 `n_B`가 전체 records 수와 bucket capacity에 비해 작음 |
| bucket skew | duplicate search key 또는 nonuniform hash function 때문에 일부 bucket에 records가 몰림 |

bucket 하나에 들어갈 수 있는 records 수를 `f_r`, 전체 records 수를 `n_r`라고 하면 bucket 수는 최소한 `n_B > n_r / f_r`가 되어야 한다. 하지만 실제로는 overflow 확률을 줄이기 위해 fudge factor `d`를 붙여 대략 `(n_r / f_r) * (1 + d)` buckets를 잡는다. 책의 전형적 값은 `d ≈ 0.2`다. 이 경우 bucket 공간의 약 20%는 비지만, overflow 가능성을 낮춘다.

overflow가 그래도 생기면 `overflow bucket`을 연결해 처리한다. lookup algorithm은 main bucket만 보지 않고 overflow chain까지 따라가야 한다. 이 방식은 `closed addressing` 또는 `closed hashing`이라고 부른다.

대안인 `open addressing` 또는 `open hashing`은 overflow chain을 두지 않고, bucket이 가득 차면 고정된 bucket set 안의 다른 bucket에 record를 넣는다. 대표 정책인 `linear probing`은 cyclic order에서 다음 빈 bucket을 찾는다. open addressing은 compiler나 assembler의 symbol table처럼 lookup과 insertion이 주된 구조에는 쓸 수 있지만, database systems에는 덜 적합하다. database에서는 deletion이 중요하고, open addressing에서 deletion 처리가 까다롭기 때문이다.

static hashing의 구조적 한계는 hash function과 bucket address set을 처음 정한 뒤 쉽게 바꾸기 어렵다는 점이다. 미래 성장을 대비해 `B`를 크게 잡으면 space가 낭비되고, 작게 잡으면 overflow가 늘어난다. file이 커질수록 performance가 악화되므로, 다음 절의 dynamic hashing은 bucket 수와 hash mapping을 점진적으로 바꾸는 방법을 제공한다.

#### 24.5.2 Dynamic Hashing

`dynamic hashing`은 database size가 커지거나 줄어들 때 hash function의 사용 방식과 bucket 구조를 동적으로 바꾸는 기법이다. static hashing만 쓰면 세 선택지 중 하나를 골라야 한다.

| 선택 | 결과 |
|---|---|
| 현재 file size 기준으로 hash function 선택 | database가 커질수록 performance degradation |
| 미래 예상 size 기준으로 hash function 선택 | 초기 space waste |
| 주기적으로 hash structure reorganize | 모든 record의 hash를 다시 계산하고 bucket assignment를 재생성해야 하므로 massive, time-consuming operation |

`extendable hashing`은 dynamic hashing의 한 형태다. 핵심은 bucket을 한 번에 전체 재구성하지 않고, overflow가 생긴 bucket만 split하거나 database가 줄 때 bucket을 coalesce하는 것이다. 따라서 reorganization overhead가 한 bucket 단위로 제한되고, space efficiency도 유지된다.

##### 24.5.2.1 Data Structure

extendable hashing은 uniform/random 성질이 좋은 hash function `h`를 선택하지만, 이 함수는 작은 bucket 번호가 아니라 넓은 범위의 `b-bit binary integer`를 만든다. 전형적으로 `b = 32`를 쓸 수 있다. 그러나 가능한 `2^32`개 hash value마다 bucket을 만들지는 않는다. 대신 현재 database size에 맞춰 hash value의 앞쪽 `i` bits만 사용한다.

![Figure 24.8](@/assets/images/cs-database-344-figure-24-8-page-1225.png)
*Figure 24.8 · PDF p. 1225 · bucket address table과 bucket별 prefix depth를 가진 extendable hash 구조*

구조의 핵심 요소는 다음과 같다.

| 요소 | 의미 |
|---|---|
| `b` | hash function이 생성하는 전체 bit 수 |
| `i` | 현재 bucket address table lookup에 쓰는 prefix bit 수, 즉 global depth |
| `bucket address table` | `i` bits prefix를 bucket pointer로 바꾸는 directory |
| `i_j` | bucket `j`에 연결된 entries가 공유하는 prefix 길이, 즉 local depth |

bucket address table에는 `2^i` entries가 있다. 하지만 여러 consecutive entries가 같은 bucket을 가리킬 수 있다. bucket `j`의 local depth가 `i_j`라면, 그 bucket을 가리키는 table entries 수는 다음과 같다.

$$
2^{(i - i_j)}
$$

즉 `i_j`가 global depth `i`보다 작다는 것은 아직 그 bucket이 현재 directory granularity만큼 세분화되지 않았고, 여러 prefix가 같은 bucket을 공유한다는 뜻이다.

##### 24.5.2.2 Queries and Updates

`Lookup`은 단순하다. search-key value `K_l`에 대해 `h(K_l)`을 계산하고, 그 hash value의 앞 `i` high-order bits를 읽는다. 이 bit string을 bucket address table의 index로 사용해 bucket pointer를 얻고, 해당 bucket에서 record를 찾는다.

`Insertion`도 먼저 lookup과 같은 방식으로 bucket `j`를 찾는다. bucket에 공간이 있으면 그대로 삽입한다. bucket이 full이면 현재 records와 새 record를 재분배하기 위해 bucket split을 수행한다. 이때 중요한 분기가 `i = i_j`인지, `i > i_j`인지다.

| 조건 | 의미 | 처리 |
|---|---|---|
| `i = i_j` | bucket `j`를 가리키는 directory entry가 하나뿐임 | global depth `i`를 1 증가시키고 bucket address table을 double |
| `i > i_j` | bucket `j`를 여러 directory entries가 공유함 | directory 크기는 그대로 두고 bucket만 split |

`i = i_j`인 경우에는 split 결과인 두 bucket을 가리킬 entry 공간이 directory에 부족하다. 그래서 hash value를 한 bit 더 사용하도록 `i`를 1 증가시키고, bucket address table 크기를 두 배로 늘린다. 기존 entry마다 같은 pointer를 가진 두 entry로 복제한 뒤, 새 bucket `z`를 할당하고 split 대상 entries 일부가 `z`를 가리키게 한다. 이후 bucket `j` 안의 기존 records를 새 `i` bits 기준으로 다시 분배하고 insert를 재시도한다.

`i > i_j`인 경우에는 이미 여러 table entries가 bucket `j`를 가리키고 있으므로 directory를 키우지 않아도 된다. bucket `z`를 새로 할당하고, `i_j`와 `i_z`를 기존 `i_j + 1`로 설정한다. bucket `j`를 가리키던 table entries 중 prefix가 갈라지는 절반은 `j`에 남기고, 나머지 절반은 `z`를 가리키게 한다. 그 뒤 bucket `j`의 records를 다시 hash prefix에 따라 `j`와 `z`로 나눈다.

두 경우 모두 전체 file을 rehash하지 않고 bucket `j`의 records만 다시 계산한다는 점이 핵심이다. 단, 같은 search-key value가 너무 많이 반복되어 모두 같은 hash prefix를 가지면 split을 반복해도 분리되지 않는다. 이런 경우에는 static hashing처럼 overflow bucket을 사용한다.

`Deletion`은 lookup 절차로 bucket을 찾은 뒤 search key와 record를 제거한다. bucket이 비면 bucket 자체를 제거할 수 있고, 여러 buckets를 coalesce하거나 bucket address table을 절반으로 줄일 수도 있다. 다만 큰 bucket address table을 줄이는 작업은 비용이 크므로, bucket 수가 크게 줄었을 때만 table 축소가 가치 있을 수 있다.

![Figure 24.9](@/assets/images/cs-database-345-figure-24-9-page-1227.png)
*Figure 24.9 · PDF p. 1227 · dept_name별 32-bit hash value 예*

책의 예시는 `dept_name`을 search key로 하고, bucket capacity를 설명 편의를 위해 2 records로 둔다. 실제 database에서는 bucket capacity가 훨씬 크다.

![Figure 24.12](@/assets/images/cs-database-348-figure-24-12-page-1228.png)
*Figure 24.12 · PDF p. 1228 · 네 번째 insertion 이후 global depth 증가와 directory doubling이 반영된 구조*

초기에는 bucket address table이 하나의 bucket만 가리킨다. `Srinivasan`, `Wu`를 삽입하면 bucket이 찬다. `Mozart`를 삽입하려고 하면 full bucket에서 `i = i_j`이므로 global depth를 0에서 1로 늘리고 directory를 2 entries로 double한다. 이후 `Physics` record 삽입에서 다시 overflow가 생기면 `i`를 2로 늘리고 directory를 4 entries로 double한다. Figure 24.12는 이런 directory doubling 뒤의 상태를 보여준다.

![Figure 24.14](@/assets/images/cs-database-350-figure-24-14-page-1229.png)
*Figure 24.14 · PDF p. 1229 · directory doubling 없이 bucket split만 수행된 extendable hashing 상태*

`Katz` insertion에서는 overflow가 생기지만, 해당 bucket을 두 directory entries가 가리키고 있으므로 `i > i_j` 상황이다. 이때는 bucket address table을 더 키우지 않고 bucket split만 수행한다. Figure 24.14는 global depth는 유지하면서 local depth가 증가한 bucket split의 효과를 보여준다.

![Figure 24.15](@/assets/images/cs-database-351-figure-24-15-page-1230.png)
*Figure 24.15 · PDF p. 1230 · 같은 hash value를 공유하는 records 때문에 overflow bucket이 필요한 경우*

`Comp. Sci.` record가 세 개가 되면 세 records가 정확히 같은 hash value를 가지므로 prefix bit를 더 늘려도 서로 분리되지 않는다. 이때는 extendable hashing도 overflow bucket을 사용한다.

![Figure 24.16](@/assets/images/cs-database-352-figure-24-16-page-1231.png)
*Figure 24.16 · PDF p. 1231 · instructor file 전체 삽입 후의 extendable hash structure*

전체 삽입 과정의 요지는 다음과 같다.

| 상황 | 구조 변화 |
|---|---|
| bucket에 여유 있음 | 해당 bucket에 record 삽입 |
| full이고 `i = i_j` | directory doubling 후 split |
| full이고 `i > i_j` | directory 크기 유지, bucket split |
| 같은 hash value가 너무 많이 반복 | split으로 해결 불가, overflow bucket 사용 |
| deletion 후 bucket empty | bucket 제거, 필요하면 coalescing/table shrink 고려 |

##### 24.5.2.3 Static Hashing versus Dynamic Hashing

extendable hashing의 장점은 file이 커져도 static hashing처럼 performance가 서서히 무너지지 않는다는 점이다. bucket을 미래 성장을 위해 미리 많이 예약할 필요가 없고, 필요할 때 dynamically allocate하므로 space overhead도 작다. bucket address table이 추가되지만, 현재 prefix length에 대한 pointer table이므로 보통 작다.

단점은 lookup에서 bucket address table을 한 번 거치는 extra level of indirection이 생긴다는 점이다. 이 추가 참조의 성능 영향은 보통 작지만, table 자체를 주기적으로 doubling하는 비용은 존재한다.

`linear hashing`은 extendable hashing과 다른 dynamic hashing 방식으로, bucket address table indirection을 피할 수 있다. 대신 overflow buckets가 더 많이 생길 수 있다는 trade-off가 있다.

#### 24.5.3 Comparison of Ordered Indexing and Hashing

file organization은 ordered file, B+ -tree/index-sequential organization, hashing, heap file 등 여러 선택지가 있다. ordered indexing과 hashing의 핵심 비교는 query pattern에 달려 있다.

| workload/query | ordered indexing, B+ -tree | hashing |
|---|---|---|
| equality lookup | 좋음 | 매우 좋음 |
| range query | 좋음 | 부적합 |
| sorted order scan | 좋음 | 부적합 |
| frequent growth | B+ -tree는 split/merge로 균형 유지 | dynamic hashing이면 성장 대응 가능 |
| duplicate key deletion | leaf entry/list 구조에 따라 관리 | duplicate가 많으면 bucket scan이 길어질 수 있음 |

따라서 hash index는 `=` predicate 중심의 point lookup에 강하고, ordered index는 range query, ordered traversal, prefix/range 기반 access가 필요한 경우에 더 적합하다. 실제 system은 workload가 섞여 있으므로 B+ -tree와 hash index를 목적에 맞게 함께 제공한다.

### 24.6 Summary

이 장의 indexing techniques는 모두 “기본 B+ -tree만으로는 부족한 workload”를 겨냥한다.

| 기술 | 해결하려는 문제 | 핵심 아이디어 |
|---|---|---|
| `Bloom filter` | 여러 구조를 lookup할 때 absent key 확인 비용 | false positive를 허용하고 false negative 없이 absent를 빠르게 판정 |
| `LSM tree` | insert/update/delete의 random I/O와 write amplification | memory tree와 disk levels를 sequential merge |
| `stepped-merge index` | LSM merge cost의 write 부담 | level마다 여러 trees를 허용해 write cost를 낮추되 lookup cost 증가 |
| `bitmap index` | low-cardinality attributes의 multi-key selection/count | value별 bitmap을 bit-wise operation으로 결합 |
| `quadtree` | 2D points/raster data의 공간 분할 | rectangular region을 4등분하며 tree 구성 |
| `R-tree` | polygons/rectangles 같은 extended spatial objects | bounding box를 계층적으로 저장하는 balanced tree |
| `static hashing` | equality lookup | fixed bucket address set과 hash function |
| `extendable hashing` | hash index의 성장/축소 대응 | bucket address table, global depth/local depth, bucket split/coalesce |

`ordered indexing`과 `hashing`의 최종 판단 기준은 range query의 필요성이다. disk-based database systems는 대체로 B+ -tree를 널리 지원한다. B+ -tree는 range query를 자연스럽게 지원하고, relation size 증가도 low-cost node splits로 부드럽게 처리하며, duplicate key deletion의 worst-case bound도 hash index보다 낫기 때문이다. 반면 hash indices는 range query가 드문 in-memory indexing이나 `hash join` 처리 중 임시 in-memory index를 만들 때 널리 쓰인다.

## 연결 관계

이 장은 앞 장들의 storage/indexing 논의를 workload별로 확장한다.

- Chapter 14의 `B+ -tree`, `hash index`, `k-d tree`, `quadtree`, `R-tree` 개념을 더 specialized techniques로 확장한다.
- Chapter 15의 query processing과 연결된다. 특히 `hash join`은 temporary in-memory hash index를 만들고, bitmap index는 selection과 count query의 cost를 크게 바꿀 수 있다.
- Big Data와 write-heavy storage에서는 `LSM tree` 계열이 중요하다. random I/O를 sequential I/O로 바꾸는 설계는 large-scale ingestion, log-structured storage, flash storage와 직접 이어진다.
- Spatial database support에서는 `quadtree`, `R-tree`, `R* -tree`, `R+ -tree`가 range/nearest neighbor/spatial join의 기반 자료구조가 된다.
- Analytics workload에서는 `bitmap index`, `existence bitmap`, bit count optimization이 aggregation/count query와 직접 연결된다.

## 오해하기 쉬운 내용

- `Bloom filter`는 정확한 membership structure가 아니다. absent는 확실히 판정하지만 present는 possibly present이며, `false positive`가 가능하고 `false negative`는 없어야 한다.
- `Bloom filter`가 LSM/stepped-merge lookup을 항상 해결하는 것은 아니다. point lookup에는 효과가 크지만 `range lookup`에는 unique hash value가 없어서 적용하기 어렵다.
- `bitmap index`는 low-cardinality attribute에만 의미가 있는 것이 아니다. B+ -tree leaf에서 frequent value의 long record identifier list를 bitmap으로 압축하는 hybrid use도 가능하다.
- bitmap complement는 단순 `NOT`으로 끝나지 않는다. deleted records를 제거하려면 `existence bitmap`과 AND해야 하고, SQL `null` semantics까지 고려해야 한다.
- `quadtree`와 `R-tree`는 모두 spatial index지만 저장 철학이 다르다. quadtree는 공간을 정규 분할하고, R-tree는 object의 bounding box를 계층적으로 묶는다.
- R-tree는 object를 한 번만 저장해 storage efficiency가 좋지만, bounding boxes가 overlap하면 search가 여러 path로 퍼질 수 있다.
- hash index는 equality lookup에 강하지만 `range query`에는 부적합하다. 좋은 hash function일수록 range locality를 깨뜨린다.
- `extendable hashing`은 전체 file rehash를 피하지만, bucket address table doubling과 extra indirection 비용은 남는다.
- 같은 search-key value 또는 같은 hash value가 너무 많이 반복되면 extendable hashing의 split만으로 해결되지 않고 overflow bucket이 필요할 수 있다.

## 면접 질문

1. `Bloom filter`에서 false positive와 false negative의 차이를 설명하고, 왜 LSM tree lookup에 유용한지 말해보라.
2. `LSM tree`가 B+ -tree보다 write-heavy workload에 유리한 이유를 random I/O와 sequential I/O 관점에서 설명하라.
3. `stepped-merge index`가 basic LSM tree보다 write cost를 낮추는 대신 어떤 lookup trade-off를 만드는가?
4. `bitmap index`가 multi-key selection과 `count(*)` query에서 빠른 이유를 bit-wise AND/OR와 count bits 관점에서 설명하라.
5. bitmap complement를 계산할 때 `existence bitmap`과 `null` handling이 필요한 이유는 무엇인가?
6. `quadtree`와 `R-tree`의 공간 분할 방식, storage efficiency, query cost 차이를 비교하라.
7. R-tree insertion에서 B+ -tree처럼 단순 midpoint split을 쓰기 어려운 이유와 `quadratic split heuristic`의 직관을 설명하라.
8. static hashing에서 `bucket overflow`가 생기는 원인과 `closed addressing`, `open addressing`의 차이를 설명하라.
9. `extendable hashing`에서 `global depth i`와 bucket별 `local depth i_j`의 의미를 설명하라.
10. extendable hashing insertion에서 `i = i_j`인 경우와 `i > i_j`인 경우의 split 동작 차이를 설명하라.
11. disk-based index에서 hash index보다 B+ -tree가 더 널리 쓰이는 이유를 range query, growth handling, duplicate key deletion 관점에서 설명하라.
12. hash index가 in-memory indexing이나 `hash join`의 temporary index에 적합한 이유는 무엇인가?
