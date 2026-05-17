---
title: "Chapter 18. B-Trees"
order: 18
pubDatetime: 2026-05-17T00:00:00+09:00
modDatetime: 2026-05-17T00:00:00+09:00
description: "CLRS 알고리즘 정리: Chapter 18. B-Trees"
tags:
  - "Algorithm"
  - "CS"
  - "CLRS"
---

## 개요

`B-tree`는 disk나 다른 direct-access secondary storage device에서 잘 동작하도록 설계된 balanced search tree다. `red-black tree`처럼 dynamic-set operations를 `O(lg n)` 높이 안에서 처리하지만, 한 node가 많은 keys와 children을 담기 때문에 branching factor가 훨씬 크다. 그 결과 같은 수의 keys를 저장해도 tree height가 작아지고, 특히 disk I/O 횟수를 크게 줄일 수 있다.

이 장의 핵심은 “CPU에서 한 비교가 얼마나 빠른가”보다 “몇 개의 disk pages를 읽고 쓰는가”가 dominant cost인 환경에서 검색 트리를 어떻게 설계하는가다. B-tree node는 보통 disk page 하나에 맞추어 구성되며, 한 번 `DISK-READ`로 많은 keys와 child pointers를 main memory로 가져와 여러 방향 중 하나를 결정한다.

## 핵심 개념

| 용어 | 의미 | 검색 키워드 |
|---|---|---|
| B-tree | 큰 branching factor를 가지는 balanced search tree | B-tree |
| branching factor | 한 internal node가 가질 수 있는 children 수 | branching factor |
| disk page | disk가 한 번에 읽거나 쓰는 equal-sized block | page |
| disk access | page 단위 `DISK-READ`, `DISK-WRITE` | disk I/O |
| direct-access secondary storage | 임의 위치 page를 읽고 쓸 수 있는 보조 저장장치 | secondary storage |
| minimum degree | B-tree node의 최소/최대 key 수를 결정하는 parameter `t` | minimum degree |
| split | full child를 둘로 나누고 median key를 parent로 올리는 연산 | B-TREE-SPLIT-CHILD |
| deletion | key 삭제 중 borrow/merge로 node key 수 invariant를 유지하는 연산 | B-TREE-DELETE |

## 세부 정리

### 도입: 왜 B-tree는 disk I/O를 줄이는가

B-tree는 binary search tree의 자연스러운 일반화다. Binary search tree에서는 한 node가 key 하나와 child 둘을 가지고 “왼쪽/오른쪽” 중 하나를 고른다. B-tree의 internal node `x`는 `x.n`개의 keys를 가지고, 그 사이 구간을 담당하는 `x.n + 1`개의 children을 가진다. 즉 한 node에서 `x.n`개 keys와 비교해 `(x.n + 1)`-way decision을 내린다.

Figure 18.1은 consonants를 key로 가진 간단한 B-tree다. Root의 key `M`은 전체 range를 둘로 나누고, 아래 internal nodes의 keys가 다시 더 작은 subranges로 나눈다. 모든 leaves는 같은 depth에 있으므로 search path 길이가 균일하게 제한된다.

![Figure 18.1](@/assets/images/cs-algorithm-093-figure-18-1-page-506.png)
*Figure 18.1 · PDF p. 506 · 여러 keys를 가진 node가 key range를 여러 child subranges로 나누는 B-tree*

#### Secondary storage와 cost model

Main memory는 빠르지만 비싸고 용량이 제한적이다. Disk 같은 secondary storage는 훨씬 큰 데이터를 저장할 수 있지만 mechanical movement 때문에 access latency가 매우 크다. Disk drive에서는 platter rotation과 arm movement가 필요하고, 원하는 위치까지 기다리는 시간이 main memory access보다 압도적으로 길다.

Figure 18.2는 disk drive의 기본 구조를 보여 준다. `platter`, `track`, `read/write head`, `arm`, `spindle` 같은 구성 요소는 이 장에서 세부 하드웨어 암기 대상이라기보다, 왜 page 단위 I/O가 중요한지를 설명하는 배경이다. 원하는 byte 하나만 읽더라도 head positioning과 rotation wait가 필요하므로, disk는 보통 여러 bytes를 묶은 page 단위로 읽고 쓴다.

![Figure 18.2](@/assets/images/cs-algorithm-094-figure-18-2-page-506.png)
*Figure 18.2 · PDF p. 506 · disk access가 mechanical movement와 page 단위 전송에 묶이는 이유*

CLRS는 B-tree 알고리즘의 running time을 두 성분으로 나누어 본다.

| 비용 성분 | 의미 | B-tree에서 중요한 이유 |
|---|---|---|
| number of disk accesses | 몇 개의 pages를 disk에서 읽고 쓰는가 | 보통 전체 시간의 dominant factor |
| CPU time | memory로 올라온 node 안에서 key 비교, loop, pointer 처리 | disk I/O에 비해 상대적으로 작지만 알고리즘 분석에 포함 |

이 장의 pseudocode는 disk operation을 명시적으로 모델링한다.

```text
x = a pointer to some object
DISK-READ(x)
operations that access and/or modify attributes of x
DISK-WRITE(x)    // omitted if no attributes changed
```

`DISK-READ(x)`는 object `x`가 이미 main memory에 있으면 no-op으로 본다. `DISK-WRITE(x)`는 변경된 attributes를 disk에 저장한다. 실제 시스템은 memory에 둘 수 있는 pages 수가 제한되어 있고 unused pages를 flush하지만, 이 장의 B-tree 알고리즘은 그런 buffer management 세부를 추상화한다.

#### B-tree node를 disk page 크기에 맞추는 이유

B-tree는 보통 node 하나를 disk page 하나에 맞춘다. 그러면 `DISK-READ` 한 번으로 node 안의 많은 keys와 child pointers를 가져올 수 있고, search path에서 node 하나를 방문할 때마다 많은 후보 range를 한꺼번에 제거한다.

큰 branching factor는 tree height를 극적으로 낮춘다. 원문은 branching factor가 50에서 2000 사이가 될 수 있다고 설명한다. 예를 들어 branching factor가 1001이면 height 2인 B-tree도 10억 개가 넘는 keys를 저장할 수 있고, root를 main memory에 permanent하게 둔다면 어떤 key도 많아야 두 번의 disk access로 찾을 수 있다.

#### Red-black tree와의 차이

| 관점 | Red-black tree | B-tree |
|---|---|---|
| node당 key 수 | 보통 1개 | 여러 개, 많으면 수천 개 |
| branching | binary | multiway |
| height | `O(lg n)` | `O(log_t n)` 형태로 훨씬 작을 수 있음 |
| 최적화 대상 | pointer-based memory operations | disk page I/O |
| 대표 사용처 | main memory dynamic set | database index, file system style external-memory index |

따라서 B-tree의 핵심 설계 이유는 comparison 횟수 자체를 최소화하는 것보다 search path에서 필요한 `DISK-READ` 수를 줄이는 데 있다.

### 18.1 Definition of B-trees

CLRS의 B-tree 정의는 “node가 여러 keys를 가지는 balanced multiway search tree”라는 직관을 엄밀한 invariant로 바꾼다. 여기서는 key에 딸린 `satellite information`이 key와 같은 node에 있다고 가정한다. 실제 database/index 구현에서는 internal nodes에는 keys와 child pointers만 두고 satellite information은 leaves나 별도 pages에 둘 수 있는데, 이렇게 하면 internal node의 branching factor를 더 크게 만들 수 있다. 대표 변형으로 `B+-tree`는 satellite information을 leaves에 모으고 internal nodes를 search guide로 쓰며, `B*-tree`는 node가 더 높은 비율로 차 있도록 요구하는 변형이다.

#### B-tree node의 attributes

각 node `x`는 다음 정보를 가진다.

| Attribute | 의미 |
|---|---|
| `x.n` | node `x`에 현재 저장된 keys 수 |
| `x.key_1, ..., x.key_{x.n}` | nondecreasing order로 저장된 keys |
| `x.leaf` | `x`가 leaf면 `TRUE`, internal node면 `FALSE` |
| `x.c_1, ..., x.c_{x.n+1}` | internal node의 child pointers |

Leaf node는 children이 없으므로 `c_i` attributes가 정의되지 않는다. Internal node는 keys가 `x.n`개이면 children은 반드시 `x.n + 1`개다.

#### Search-tree property

B-tree의 keys는 각 child subtree의 key range를 분리한다. 어떤 node `x`에서 `k_i`가 child `x.c_i`의 subtree에 들어 있는 key라면 다음 순서 관계가 성립한다.

```text
k_1 <= x.key_1 <= k_2 <= x.key_2 <= ... <= x.key_{x.n} <= k_{x.n+1}
```

즉 `x.key_i`는 `x.c_i`와 `x.c_{i+1}` 사이의 separator 역할을 한다. Search는 node 안의 sorted keys를 훑어 적절한 interval을 찾고, 그 interval에 대응하는 child로 내려간다.

#### Height와 leaf depth invariant

B-tree의 모든 leaves는 같은 depth를 가진다. 이 공통 depth가 tree height `h`다. 이 조건 때문에 B-tree는 balanced search tree이며, 삽입/삭제가 일어나도 split, borrow, merge 같은 구조 조정을 통해 leaves의 depth가 서로 달라지지 않게 유지한다.

#### Minimum degree `t`

B-tree의 key 수 제한은 fixed integer `t >= 2`, 즉 `minimum degree`로 표현한다.

| Node 종류 | 최소 keys | 최대 keys | Children 수 |
|---|---:|---:|---:|
| root | nonempty이면 최소 1 | `2t - 1` | internal이면 `2`부터 `2t`까지 |
| nonroot node | `t - 1` | `2t - 1` | internal이면 `t`부터 `2t`까지 |

`2t - 1`개의 keys를 가진 node를 `full`이라고 부른다. `t=2`이면 internal node가 2, 3, 4 children을 가질 수 있으므로 `2-3-4 tree`가 된다. 하지만 disk-oriented B-tree에서는 보통 `t`가 훨씬 크고, 이것이 height를 작게 만든다.

#### 큰 branching factor의 힘

Figure 18.3은 height 2의 B-tree가 얼마나 많은 keys를 담을 수 있는지 보여 준다. 각 node가 1000 keys를 담고 internal node가 1001 children을 가진다면, root를 포함해 depth 2까지만 내려가도 10억 개가 넘는 keys를 저장할 수 있다. Root를 main memory에 상주시킨다면 search에서 필요한 disk access는 최대 두 번이다.

![Figure 18.3](@/assets/images/cs-algorithm-095-figure-18-3-page-509.png)
*Figure 18.3 · PDF p. 509 · height 2 B-tree가 큰 branching factor로 10억 개 이상 keys를 저장하는 구조*

#### Theorem 18.1: B-tree height bound

대부분의 B-tree operation에서 disk access 수는 height에 비례한다. 따라서 B-tree의 worst-case height bound가 중요하다.

`n >= 1`개의 keys를 가진 minimum degree `t >= 2` B-tree `T`의 height `h`는 다음을 만족한다.

```text
h <= log_t((n + 1) / 2)
```

증명 아이디어는 “height가 `h`인 B-tree가 최소 몇 keys를 가져야 하는가”를 세는 것이다. Root는 최소 1 key를 가지고, root가 leaf가 아니라면 depth 1에는 최소 2 nodes가 있다. Root가 아닌 모든 node는 최소 `t - 1` keys를 가지므로, depth가 내려갈 때마다 최소 node 수가 `t`배씩 증가한다.

Figure 18.4는 height 3에서 key 수를 최소화한 B-tree의 모양을 보여 준다. Root에는 key 1개, 그 아래 nonroot nodes에는 모두 `t - 1`개 keys가 들어 있다.

![Figure 18.4](@/assets/images/cs-algorithm-096-figure-18-4-page-511.png)
*Figure 18.4 · PDF p. 511 · height가 주어졌을 때 key 수를 최소화한 B-tree 구조*

최소 key 수를 합치면:

```text
n >= 1 + (t - 1) * Σ_{i=1}^{h} 2t^{i-1}
  = 1 + 2(t - 1) * (t^h - 1) / (t - 1)
  = 2t^h - 1
```

따라서:

```text
t^h <= (n + 1) / 2
h <= log_t((n + 1) / 2)
```

Red-black tree도 height가 `O(lg n)`이지만, B-tree는 logarithm base가 `t`가 된다. `t`가 수십에서 수천이면 `lg t`만큼의 factor를 disk access에서 절약한다. 이 차이가 main memory 자료구조와 external-memory 자료구조의 설계 방향을 가른다.

#### `t = 1`을 허용하지 않는 이유

Exercise 18.1-1이 묻는 것처럼 `minimum degree t`는 2 이상이어야 한다. `t=1`이면 nonroot node의 최소 keys가 `t-1=0`이 되어, internal node가 실제 separator 없이 child만 갖는 이상한 구조가 가능해진다. 그러면 height bound와 search-tree invariant를 유지하는 의미가 약해지고, split/merge 정책도 B-tree가 의도한 balanced multiway search tree가 되지 않는다.

### 18.2 Basic operations on B-trees

이 절은 `B-TREE-SEARCH`, `B-TREE-CREATE`, `B-TREE-INSERT`를 다룬다. CLRS는 다음 두 convention을 둔다.

| Convention | 의미 |
|---|---|
| root는 항상 main memory에 있음 | root에 대해서는 `DISK-READ`가 필요 없지만, root가 바뀌면 `DISK-WRITE`는 필요함 |
| parameter로 전달된 node는 이미 memory에 있음 | procedure가 받은 node는 이미 `DISK-READ`되었다고 가정 |

또 하나 중요한 특징은 이 절의 알고리즘들이 모두 `one-pass`라는 점이다. Root에서 leaf 방향으로 내려가며 처리하고, 다시 위로 back up하지 않는다.

#### Searching a B-tree: `B-TREE-SEARCH`

B-tree search는 binary search tree search의 multiway version이다. Node `x`에서 key `k`를 찾을 때, node 안의 sorted keys를 보고 어느 child interval로 내려갈지 결정한다.

```text
B-TREE-SEARCH(x, k)
1  i = 1
2  while i <= x.n and k > x.key_i
3      i = i + 1
4  if i <= x.n and k == x.key_i
5      return (x, i)
6  elseif x.leaf
7      return NIL
8  else DISK-READ(x.c_i)
9      return B-TREE-SEARCH(x.c_i, k)
```

Line 1-3은 `k <= x.key_i`가 처음 성립하는 가장 작은 index `i`를 찾거나, 모든 keys보다 크면 `i = x.n + 1`로 둔다. Line 4-5에서 key를 찾으면 `(node, index)`를 반환한다. 찾지 못했고 `x`가 leaf면 실패이므로 `NIL`을 반환한다. Internal node라면 적절한 child page를 `DISK-READ`한 뒤 재귀적으로 내려간다.

Search path는 root에서 leaf로 내려가는 simple path다. 따라서 height가 `h`인 B-tree에서 disk page access는 `O(h) = O(log_t n)`개다. Node 하나 안에는 최대 `2t - 1` keys가 있으므로 linear search를 쓰면 각 node의 CPU time은 `O(t)`, 전체 CPU time은 `O(th) = O(t log_t n)`이다. 실제 구현에서는 node 내부 search에 binary search나 SIMD-friendly scan을 쓰는 변형이 가능하지만, 이 장의 핵심 disk I/O bound는 height에 의해 결정된다.

#### Creating an empty B-tree: `B-TREE-CREATE`

새 B-tree는 empty root node 하나로 시작한다. `ALLOCATE-NODE`는 새 disk page 하나를 node로 할당하며, 아직 유용한 정보가 없으므로 새 node에 대한 `DISK-READ`는 필요 없다.

```text
B-TREE-CREATE(T)
1  x = ALLOCATE-NODE()
2  x.leaf = TRUE
3  x.n = 0
4  DISK-WRITE(x)
5  T.root = x
```

`B-TREE-CREATE`의 disk operations와 CPU time은 모두 `O(1)`이다.

#### Inserting a key: leaf에 그냥 새 node를 붙이지 않는다

Binary search tree에서는 삽입 위치를 찾은 뒤 새 leaf node를 만들면 된다. 하지만 B-tree에서 그렇게 하면 모든 leaves가 같은 depth에 있어야 한다는 invariant가 깨진다. B-tree insertion은 새 key를 기존 leaf node 안에 넣는다.

문제는 leaf가 이미 full일 수 있다는 점이다. Full node는 `2t - 1` keys를 가지고 있으므로 key를 하나 더 넣을 수 없다. 그래서 insertion은 full node를 split하는 연산을 사용한다. Full node `y`를 median key `y.key_t` 기준으로 나누면:

| 분할 결과 | 내용 |
|---|---|
| 왼쪽 node `y` | median보다 작은 `t - 1` keys |
| 오른쪽 새 node `z` | median보다 큰 `t - 1` keys |
| parent | median key를 받아 두 child를 구분 |

Insertion은 root에서 내려가는 동안 full child를 만나면 먼저 split한다. 이렇게 하면 recursion이 내려가는 node는 항상 nonfull이므로, leaf에 도착했을 때 key를 바로 삽입할 수 있다. 이 “미리 split” 전략이 one-pass insertion을 가능하게 한다.

#### Splitting a node: `B-TREE-SPLIT-CHILD`

`B-TREE-SPLIT-CHILD(x, i)`는 nonfull internal node `x`와 그 full child `y = x.c_i`를 입력으로 받는다. `y`를 둘로 나누고, median key를 `x`로 올리며, `x`의 child 수를 하나 늘린다. Full root를 split할 때는 먼저 empty new root를 만들고 old root를 그 child로 둔 뒤 이 procedure를 적용한다.

Figure 18.5는 `t=4`에서 full child `y`를 split하는 과정을 보여 준다. Median key `S`가 parent로 올라가고, `S`보다 큰 keys와 corresponding children은 새 node `z`로 이동한다.

![Figure 18.5](@/assets/images/cs-algorithm-097-figure-18-5-page-515.png)
*Figure 18.5 · PDF p. 515 · full child를 median key 기준으로 split하고 parent에 separator를 올리는 과정*

```text
B-TREE-SPLIT-CHILD(x, i)
1  z = ALLOCATE-NODE()
2  y = x.c_i
3  z.leaf = y.leaf
4  z.n = t - 1
5  for j = 1 to t - 1
6      z.key_j = y.key_{j+t}
7  if not y.leaf
8      for j = 1 to t
9          z.c_j = y.c_{j+t}
10 y.n = t - 1
11 shift x's children right to make room for z
12 x.c_{i+1} = z
13 shift x's keys right to make room for y.key_t
14 x.key_i = y.key_t
15 x.n = x.n + 1
16 DISK-WRITE(y), DISK-WRITE(z), DISK-WRITE(x)
```

이 procedure는 key/child arrays를 잘라 붙이는 작업이다. `z`는 `y`의 오른쪽 절반을 받고, `y`는 왼쪽 절반만 남긴다. Parent `x`는 median key를 받아 두 children 사이의 separator로 둔다. CPU time은 loops 때문에 `Θ(t)`이고, 수정된 pages `x`, `y`, `z`를 write하므로 disk operations는 `O(1)`이다.

#### Root split과 height 증가

`B-TREE-INSERT(T, k)`는 먼저 root가 full인지 확인한다. Root가 full이면 새 root `s`를 만들고 old root `r`을 `s.c_1`로 둔 뒤 `B-TREE-SPLIT-CHILD(s, 1)`을 수행한다.

```text
B-TREE-INSERT(T, k)
1  r = T.root
2  if r.n == 2t - 1
3      s = ALLOCATE-NODE()
4      T.root = s
5      s.leaf = FALSE
6      s.n = 0
7      s.c_1 = r
8      B-TREE-SPLIT-CHILD(s, 1)
9      B-TREE-INSERT-NONFULL(s, k)
10 else B-TREE-INSERT-NONFULL(r, k)
```

Figure 18.6은 root split을 보여 준다. B-tree는 binary search tree처럼 아래쪽에 새 leaf를 붙여 height가 커지는 것이 아니라, full root를 split하면서 위쪽에 새 root가 생길 때 height가 1 증가한다. 즉 B-tree의 height growth는 top에서 일어난다.

![Figure 18.6](@/assets/images/cs-algorithm-098-figure-18-6-page-517.png)
*Figure 18.6 · PDF p. 517 · full root를 split해 새 root가 생기고 B-tree height가 1 증가하는 과정*

#### Nonfull node로만 내려가기: `B-TREE-INSERT-NONFULL`

`B-TREE-INSERT-NONFULL(x, k)`는 호출 시점에 `x`가 nonfull이라고 가정한다. 이 가정은 `B-TREE-INSERT`와 사전 split 전략이 보장한다.

```text
B-TREE-INSERT-NONFULL(x, k)
1  i = x.n
2  if x.leaf
3      while i >= 1 and k < x.key_i
4          x.key_{i+1} = x.key_i
5          i = i - 1
6      x.key_{i+1} = k
7      x.n = x.n + 1
8      DISK-WRITE(x)
9  else
10     find child index i where k should descend
11     DISK-READ(x.c_i)
12     if x.c_i.n == 2t - 1
13         B-TREE-SPLIT-CHILD(x, i)
14         if k > x.key_i
15             i = i + 1
16     B-TREE-INSERT-NONFULL(x.c_i, k)
```

Leaf라면 sorted order를 유지하도록 keys를 오른쪽으로 shift하고 `k`를 삽입한다. Internal node라면 내려갈 child를 찾고 `DISK-READ`한다. 그 child가 full이면 내려가기 전에 split한다. Split 후 median key가 parent로 올라오므로, `k`가 median보다 크면 오른쪽 새 child로 내려가도록 index를 하나 증가시킨다.

Line 13-15의 효과는 “절대 full node로 recurse하지 않는다”는 것이다. 이 덕분에 insertion이 leaf에 도달했을 때는 leaf가 반드시 nonfull이고, 추가 split 없이 key를 넣을 수 있다.

Figure 18.7은 `t=3`인 B-tree에 여러 keys를 삽입하는 예시다. 단순 leaf insertion, leaf split, root split, split 후 어느 절반으로 내려갈지 선택하는 경우가 한 그림 안에 모두 들어 있다.

![Figure 18.7](@/assets/images/cs-algorithm-099-figure-18-7-page-519.png)
*Figure 18.7 · PDF p. 519 · B-tree insertion에서 leaf insertion, child split, root split이 나타나는 예시*

#### Basic operations의 복잡도

| Operation | Disk accesses | CPU time | 핵심 이유 |
|---|---:|---:|---|
| `B-TREE-SEARCH` | `O(h) = O(log_t n)` | `O(th)` | path 하나를 따라 내려가며 node 내부에서 최대 `2t-1` keys scan |
| `B-TREE-CREATE` | `O(1)` | `O(1)` | empty root page 하나 생성 |
| `B-TREE-SPLIT-CHILD` | `O(1)` | `Θ(t)` | 세 pages 정도를 수정하고 key/child arrays 일부 이동 |
| `B-TREE-INSERT` | `O(h)` | `O(th) = O(t log_t n)` | root-to-leaf one-pass, 각 level에서 constant I/O와 `O(t)` CPU |

`B-TREE-INSERT-NONFULL`은 tail-recursive이므로 while loop로 바꿀 수 있다. 이 관찰은 B-tree insertion이 한 번에 `O(h)`개의 nodes를 모두 memory에 들고 있어야 하는 것이 아니라, root-to-leaf path를 따라가며 constant number of pages만 유지해도 된다는 점을 보여 준다.

#### Redundant disk operations

Exercise 18.2-2의 관점에서 보면, 이미 memory에 있는 page에 대한 `DISK-READ`는 redundant read가 될 수 있고, 변경되지 않은 내용을 다시 쓰는 `DISK-WRITE`는 redundant write가 될 수 있다. CLRS pseudocode는 disk I/O를 명시적으로 세기 위해 다소 보수적으로 표현하지만, 실제 buffer manager는 page residency와 dirty bit를 이용해 불필요한 I/O를 줄인다.

### 18.3 Deleting a key from a B-tree

B-tree deletion은 insertion보다 복잡하다. 이유는 두 가지다.

1. 삭제할 key가 leaf가 아니라 internal node에 있을 수 있다.
2. 삭제 후 어떤 node가 minimum key count `t - 1`보다 작아질 수 있다.

Insertion에서는 node가 너무 커지는 것을 막기 위해 full child를 미리 split했다. Deletion에서는 node가 너무 작아지는 것을 막기 위해, recursive descent 전에 내려갈 child가 최소 `t`개의 keys를 갖도록 보강한다. 보통 B-tree 조건은 nonroot node가 `t - 1` keys만 가져도 된다고 하지만, deletion procedure는 한 key 더 강한 조건을 유지하며 내려간다. 이 강화 조건 덕분에 대부분의 경우 deletion도 root-to-leaf 방향의 one downward pass로 처리할 수 있다.

Root는 예외적으로 `t - 1`보다 적은 keys를 가질 수 있다. 만약 deletion 도중 root가 internal node인데 key가 0개가 되면, root를 삭제하고 그 유일한 child를 새 root로 만든다. 이때 B-tree height가 1 감소한다.

#### Figure 18.8의 deletion 예시

Figure 18.8은 `t=3`인 B-tree에서 여러 deletion cases를 보여 준다. Nonroot node는 최소 `t-1=2` keys를 가져야 하며, 수정되는 nodes가 음영으로 표시되어 있다.

![Figure 18.8](@/assets/images/cs-algorithm-100-figure-18-8-page-521.png)
*Figure 18.8 · PDF p. 521 · leaf deletion과 internal key deletion에서 predecessor/merge가 일어나는 예시*

Figure 18.8의 이어지는 부분은 내려갈 child가 최소 keys만 가진 경우, sibling에서 빌리거나 merge하는 과정을 보여 준다. 특히 merge 후 root가 empty가 되어 tree height가 줄어드는 상황도 포함한다.

![Figure 18.8 continued](@/assets/images/cs-algorithm-101-figure-18-8-page-522.png)
*Figure 18.8 · PDF p. 522 · child 보강, sibling borrow, merge, root 삭제로 height가 줄어드는 예시*

#### Case 1: key가 leaf node에 있는 경우

삭제할 key `k`가 node `x`에 있고 `x`가 leaf라면 가장 단순하다. `x`에서 `k`를 제거하고 keys를 당겨 sorted order를 유지하면 된다.

```text
if k is in x and x.leaf:
    delete k from x
```

Figure 18.8(b)의 `F` 삭제가 이 경우다. Leaf에 충분한 keys가 있고, 삭제 후에도 B-tree key count invariant가 유지된다.

#### Case 2: key가 internal node에 있는 경우

삭제할 key `k`가 internal node `x` 안에 있으면, 단순히 key만 지울 수 없다. `k`는 왼쪽 child subtree와 오른쪽 child subtree를 나누는 separator이기 때문이다. 따라서 predecessor 또는 successor로 `k` 자리를 대체하거나, 양쪽 child를 merge한 뒤 삭제를 계속한다.

| Case | 조건 | 동작 |
|---|---|---|
| 2a | `k` 앞 child `y`가 at least `t` keys | `k`의 predecessor `k'`를 찾아 `x`의 `k`를 `k'`로 교체하고, `y`에서 `k'`를 삭제 |
| 2b | 앞 child는 부족하지만 뒤 child `z`가 at least `t` keys | `k`의 successor `k'`를 찾아 `x`의 `k`를 `k'`로 교체하고, `z`에서 `k'`를 삭제 |
| 2c | 양쪽 children `y`, `z`가 모두 `t-1` keys | `k`와 `z` 전체를 `y`로 merge해 `2t-1` keys node를 만들고, 그 안에서 `k` 삭제 |

Case 2a와 2b에서는 predecessor/successor를 찾기 위해 아래로 내려갔다가, internal node의 key 자리를 교체해야 하므로 “완전히 back up이 없는” 형태는 아니다. CLRS가 말한 예외가 바로 이 부분이다. 그래도 disk operations 수는 height에 비례한다.

Figure 18.8(c)는 `M`을 predecessor `L`로 교체하는 case 2a를 보여 준다. Figure 18.8(d)는 `G`를 양쪽 child와 merge해 leaf 쪽으로 내려보낸 뒤 삭제하는 case 2c를 보여 준다.

#### Case 3: key가 현재 internal node에 없는 경우

`k`가 internal node `x`에 없으면, search-tree property에 따라 `k`가 있을 수 있는 child `x.c_i`를 결정한다. 문제는 `x.c_i`가 `t-1` keys만 가진 minimum-size node일 수 있다는 점이다. 그대로 내려가서 key를 삭제하면 underflow가 생길 수 있으므로, 내려가기 전에 `x.c_i`가 at least `t` keys를 갖도록 만든다.

| Case | 조건 | 동작 |
|---|---|---|
| 3a | `x.c_i`는 `t-1` keys지만 immediate sibling 중 하나가 at least `t` keys | parent key 하나를 `x.c_i`로 내리고, sibling key 하나를 parent로 올리며, 필요한 child pointer도 이동 |
| 3b | `x.c_i`와 immediate siblings가 모두 `t-1` keys | parent key 하나를 내려 `x.c_i`와 sibling을 merge하고, merged node로 recursion |

Case 3a는 sibling에서 key를 “borrow/rotate”하는 방식이다. Parent의 separator가 child로 내려가고, sibling의 경계 key가 parent로 올라온다. Internal nodes라면 child pointer도 함께 이동해야 subtree ranges가 유지된다.

Case 3b는 borrow할 여유가 없을 때 merge한다. Child `x.c_i`, sibling, 그리고 parent에서 내려온 separator key 하나를 합치면 `2t - 1` keys를 가진 full node가 된다. Parent는 key 하나와 child pointer 하나를 잃는다. 만약 parent가 root이고 이로 인해 key가 0개가 되면 root를 제거하고 merged child를 새 root로 삼아 height를 줄인다.

#### Deletion의 핵심 invariant

Deletion을 이해하는 가장 좋은 방법은 다음 invariant 하나로 기억하는 것이다.

```text
Recursive call이 nonroot node로 내려갈 때,
그 node는 적어도 t개의 keys를 가지고 있어야 한다.
```

이 invariant는 일반 B-tree invariant보다 한 key 더 강하다. 그래서 leaf에서 key 하나를 삭제해도 `t-1` keys가 남아 underflow가 발생하지 않는다. Internal key 삭제에서도 predecessor/successor를 가져올 subtree가 충분한 keys를 갖도록 보장하거나, 부족하면 merge로 충분히 큰 node를 만든 뒤 내려간다.

#### Deletion의 복잡도

B-tree deletion은 복잡해 보이지만, 각 recursive descent 사이에서 수행하는 `DISK-READ`와 `DISK-WRITE`는 `O(1)`개다. Height가 `h`라면:

| 비용 | Bound |
|---|---:|
| Disk operations | `O(h) = O(log_t n)` |
| CPU time | `O(th) = O(t log_t n)` |

Most keys in a B-tree are in leaves이므로 실제 workload에서는 leaf deletion이 자주 나타난다. Leaf deletion은 one downward pass로 매우 직접적이다. Internal node deletion은 predecessor/successor replacement 때문에 잠깐 되돌아와 key를 바꾸는 예외가 있지만, asymptotic I/O bound는 변하지 않는다.

#### Problems와 chapter notes의 연결

Chapter 18 problems는 B-tree가 단지 “큰 node의 search tree”가 아니라 external-memory algorithm design의 기본 사고방식임을 보여 준다.

| 항목 | 연결되는 아이디어 |
|---|---|
| `18-1 Stacks on secondary storage` | stack도 page 단위 buffer를 잘 쓰면 disk accesses를 amortized하게 줄일 수 있음 |
| `18-2 Joining and splitting 2-3-4 trees` | `2-3-4 tree`에서 height attribute를 유지하고 `join`, `split`을 logarithmic하게 처리 |
| `18.2-6` | node 내부 linear search 대신 binary search를 쓰면 CPU time을 `O(lg n)`으로 만들 수 있음 |
| `18.2-7` | disk page size와 `t` 선택은 `a + bt` page-read cost와 height 감소 사이의 trade-off |

Chapter notes는 B-tree와 balanced-tree 계열의 역사적 연결을 짧게 언급한다. `2-3 tree`는 B-tree와 `2-3-4 tree`의 선행 구조이고, `2-3-4 tree`는 red-black tree와 깊은 대응 관계를 가진다. 또한 `cache-oblivious algorithms`는 명시적으로 data transfer size를 알지 못해도 memory hierarchy에서 잘 동작하도록 B-tree적 사고를 더 일반화한 방향이다.

## 연결 관계

| 연결 대상 | 관계 |
|---|---|
| Chapter 12 `Binary Search Trees` | key order와 subtree range property를 multiway node로 일반화 |
| Chapter 13 `Red-Black Trees` | balanced search tree라는 목표는 같지만, B-tree는 disk I/O 최소화에 맞춤 |
| Chapter 17 `Amortized Analysis` | secondary-storage stack 문제와 page buffering에서 amortized I/O 사고가 이어짐 |
| Database indexes | B-tree/B+-tree가 database index의 기본 구조로 쓰이는 이유가 이 장의 disk page model과 직접 연결 |
| File systems / storage engines | large branching factor와 page-oriented node layout이 metadata lookup에 유리 |

## 오해하기 쉬운 내용

| 오해 | 정정 |
|---|---|
| B-tree는 binary tree의 한 종류다 | 아니다. 한 node가 여러 keys와 여러 children을 가지는 multiway search tree다 |
| B-tree는 항상 key 비교 횟수를 최소화하려는 구조다 | 주 목적은 disk page access 수를 줄이는 것이다. Node 내부 CPU cost와 I/O cost를 분리해서 본다 |
| 모든 node가 정확히 같은 수의 keys를 가져야 한다 | 아니다. root/nonroot와 `t`에 따른 최소/최대 범위만 지키면 된다 |
| Insertion은 leaf에서 split을 시작해 위로 올라간다 | CLRS 알고리즘은 내려가며 full child를 미리 split하는 one-pass insertion이다 |
| Deletion은 단순히 key를 지우면 된다 | internal key 삭제와 underflow 방지를 위해 predecessor/successor, borrow, merge가 필요하다 |
| Root도 항상 `t-1` keys 이상이어야 한다 | root는 예외다. Empty tree가 아니면 최소 1 key이고, deletion 중 empty internal root는 제거된다 |

## 면접 질문

1. B-tree가 red-black tree보다 disk-based storage에 유리한 이유를 `branching factor`와 `disk page` 관점에서 설명하라.
2. B-tree의 `minimum degree t`가 node의 최소/최대 key 수와 children 수를 어떻게 결정하는가?
3. Theorem 18.1의 height bound `h <= log_t((n+1)/2)`가 왜 성립하는지 설명하라.
4. `B-TREE-SEARCH`의 disk accesses와 CPU time이 각각 어떻게 계산되는가?
5. `B-TREE-SPLIT-CHILD`에서 median key를 parent로 올리는 이유는 무엇인가?
6. B-tree insertion에서 full child를 내려가기 전에 split하는 이유는 무엇인가?
7. Root split이 B-tree height를 어떻게 증가시키는지 설명하라.
8. B-tree deletion에서 recursive call이 내려갈 child에 최소 `t` keys를 보장하려는 이유는 무엇인가?
9. Deletion case 2a/2b/2c와 case 3a/3b의 차이를 설명하라.
10. `B+-tree`가 internal node의 branching factor를 키우는 방식과 database index에서 유리한 이유를 설명하라.
