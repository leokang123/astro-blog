---
title: "Chapter 20. van Emde Boas Trees"
order: 20
pubDatetime: 2026-05-17T00:02:00+09:00
modDatetime: 2026-05-17T00:02:00+09:00
description: "CLRS 알고리즘 정리: Chapter 20. van Emde Boas Trees"
tags:
  - "Algorithm"
  - "CS"
  - "CLRS"
---

## 개요

`van Emde Boas tree`, 줄여서 `vEB tree`는 keys가 bounded integer universe에 있을 때 dynamic set operations를 $O(\lg \lg u)$ worst-case time에 수행하는 자료구조다. 여기서 `u`는 universe size이고, 저장 가능한 key는 `{0, 1, ..., u-1}` 범위의 정수다. CLRS는 중복 keys와 satellite data는 생략하고, key membership과 순서 연산만 다룬다.

비교 기반 자료구조인 `binary heap`, `red-black tree`, `Fibonacci heap`은 적어도 일부 핵심 연산에 $\Omega(\lg n)$ 장벽이 있다. 하지만 keys가 bounded integers라는 추가 정보를 쓰면 counting sort가 비교 정렬 lower bound를 우회하듯, priority queue/dynamic set operations도 $\lg n$보다 빠르게 만들 수 있다. vEB tree는 이 아이디어를 recursive universe decomposition으로 구현한다.

## 핵심 개념

| 용어 | 의미 | 검색 키워드 |
|---|---|---|
| universe | 저장 가능한 정수 key 범위 `{0, ..., u-1}` | universe |
| universe size | 가능한 key 값의 개수 `u`, 보통 power of 2 | universe size |
| `MEMBER(S, x)` | key `x`가 set에 있는지 boolean 반환 | MEMBER |
| bit vector | $A[x]=1$이면 key `x`가 존재하는 direct-addressing 구조 | bit vector |
| summary | 어떤 cluster가 비어 있지 않은지 기록하는 상위 구조 | summary |
| cluster | universe를 $\sqrt{u}$ 크기 단위로 나눈 하위 구조 | cluster |
| proto-vEB | min/max 최적화 전의 recursive vEB-like structure | proto-vEB |
| vEB tree | min/max를 따로 저장해 $O(\lg \lg u)$를 달성하는 구조 | van Emde Boas tree |
| $high(x)$ | key `x`가 속한 cluster 번호 | high |
| $low(x)$ | cluster 내부에서의 offset | low |
| `index(i, j)` | cluster `i`의 offset `j`를 원래 key로 복원 | index |

## 세부 정리

### 도입: 왜 비교 기반 $\Omega(\lg n)$을 우회할 수 있는가

Binary heap, red-black tree, Fibonacci heap은 모두 priority queue나 dynamic set 연산을 지원하지만, comparison-based decisions에 의존한다. 만약 comparison 기반으로 `INSERT`와 `EXTRACT-MIN`이 모두 $o(\lg n)$이면, $n$개 keys를 삽입한 뒤 $n$번 extract-min해서 $o(n \lg n)$ 정렬을 만들 수 있다. 이는 comparison sorting lower bound와 충돌한다.

하지만 Chapter 8의 counting sort처럼 keys가 bounded integers라는 추가 조건을 쓰면 lower bound를 우회할 수 있다. 이 장에서는 key가 universe `{0, 1, ..., u-1}`에 있고, duplicate keys는 저장하지 않는다고 가정한다. `n`은 현재 set에 저장된 elements 수, `u`는 가능한 values의 range를 의미한다. vEB tree의 목표 bounds는:

$$
\begin{aligned}
SEARCH/MEMBER, INSERT, DELETE, MINIMUM, MAXIMUM, \\
\text{SUCCESSOR, PREDECESSOR} &= O(\lg \lg u) worst-case
\end{aligned}
$$

CLRS는 `SEARCH` 대신 `MEMBER(S, x)`를 사용한다. Satellite data 없이 key 존재 여부만 다루므로, `MEMBER`는 단순히 boolean을 반환한다.

또한 이 장에서는 `u`가 정확한 power of 2라고 가정한다. 이후 recursive decomposition에서는 특히 $\sqrt{u}$ 단위로 universe를 나누기 위해 `u`가 적절한 power 형태라고 생각하면 편하다.

### 20.1 Preliminary approaches

이 절은 vEB tree에 바로 들어가지 않고, 먼저 direct addressing과 tree overlay를 검토한다. 각 접근은 목표인 $O(\lg \lg u)$에는 못 미치지만, vEB tree의 핵심 구성요소인 `summary`와 `cluster` 아이디어를 자연스럽게 만든다.

#### Direct addressing with bit vector

가장 단순한 방법은 크기 `u`의 bit vector $A[0..u-1]$를 두는 것이다.

$$
\begin{aligned}
A[x] &= 1 if x is in the dynamic set \\
A[x] &= 0 otherwise
\end{aligned}
$$

이 구조에서는 `INSERT`, `DELETE`, `MEMBER`가 모두 $O(1)$이다.

| Operation | 방법 | 시간 |
|---|---|---:|
| $INSERT(x)$ | $A[x] = 1$ | $O(1)$ |
| $DELETE(x)$ | $A[x] = 0$ | $O(1)$ |
| $MEMBER(x)$ | $A[x]$ 확인 | $O(1)$ |
| `MINIMUM`, `MAXIMUM` | 왼쪽/오른쪽부터 scan | $\Theta(u)$ |
| `SUCCESSOR`, `PREDECESSOR` | `x` 주변부터 scan | $\Theta(u)$ |

문제는 순서 연산이다. 예를 들어 set이 `{0, u-1}`만 포함하면 $SUCCESSOR(0)$을 찾기 위해 $A[1]$부터 $A[u-2]$까지 전부 scan할 수 있다.

#### Bit vector 위에 binary tree를 얹기

Bit vector의 긴 scan을 줄이기 위해 leaves를 $A[0..u-1]$로 두고, internal node에는 그 subtree 안에 1이 하나라도 있는지 나타내는 bit를 저장할 수 있다. Internal bit는 두 children의 logical-or다.

Figure 20.1은 $u=16$, set `{2,3,4,5,7,14,15}`를 bit vector와 binary tree overlay로 나타낸다. 그림의 arrows는 $PREDECESSOR(14)$가 7을 찾는 경로를 보여 준다.

![Figure 20.1](@/assets/images/cs-algorithm-110-figure-20-1-page-554.png)
*Figure 20.1 · PDF p. 554 · bit vector 위의 binary tree overlay와 $PREDECESSOR(14)$ 탐색 경로*

이 구조에서 순서 연산은 다음처럼 동작한다.

| Operation | 동작 |
|---|---|
| `MINIMUM` | root에서 시작해 1이 있는 가장 왼쪽 child를 따라 leaf까지 내려감 |
| `MAXIMUM` | root에서 시작해 1이 있는 가장 오른쪽 child를 따라 leaf까지 내려감 |
| $SUCCESSOR(x)$ | leaf `x`에서 위로 올라가다 오른쪽 subtree에 1이 있는 첫 지점을 찾고, 그 subtree의 minimum으로 내려감 |
| $PREDECESSOR(x)$ | leaf `x`에서 위로 올라가다 왼쪽 subtree에 1이 있는 첫 지점을 찾고, 그 subtree의 maximum으로 내려감 |
| $INSERT(x)$ | leaf `x`부터 root까지 path의 bits를 1로 설정 |
| $DELETE(x)$ | leaf `x`부터 root까지 올라가며 각 internal bit를 두 children의 OR로 재계산 |

Tree height가 $\lg u$이므로 각 operation은 위로 한 번, 아래로 한 번 움직여도 $O(\lg u)$ worst-case다. 이는 direct bit vector보다 순서 연산에서는 개선이지만, red-black tree의 $O(\lg n)$과 비교하면 $n \ll u$일 때 좋지 않을 수 있다.

#### Degree $\sqrt{u}$인 height-2 tree

다음 아이디어는 branching factor를 크게 키우는 것이다. `u`가 $\sqrt{u}$가 정수인 형태라고 가정하고, bit vector를 $\sqrt{u}$개의 clusters로 나눈다. 각 cluster는 $\sqrt{u}$ bits를 가진다. Depth 1의 internal nodes는 각 cluster 안에 1이 있는지를 나타내며, 이를 array $summary[0..\sqrt{u}-1]$로 볼 수 있다.

Figure 20.2는 Figure 20.1과 같은 set을 degree $\sqrt{u}$ tree로 나타낸다. $summary[i]$는 cluster `i`가 비어 있지 않으면 1이다.

![Figure 20.2](@/assets/images/cs-algorithm-111-figure-20-2-page-556.png)
*Figure 20.2 · PDF p. 556 · universe를 $\sqrt{u}$ clusters와 `summary`로 나눈 height-2 구조*

값 `x`가 들어 있는 cluster 번호는:

$$
\begin{aligned}
\text{cluster number} &= \operatorname{floor}(x / \sqrt{u}) \\
\text{offset inside cluster} &= x \bmod \sqrt{u}
\end{aligned}
$$

이 구조에서 $INSERT(x)$는 $A[x] = 1$과 $summary[\operatorname{floor}(x/\sqrt{u})] = 1$만 하면 되어 $O(1)$이다. 그러나 `MINIMUM`, `MAXIMUM`, `SUCCESSOR`, `PREDECESSOR`, `DELETE`는 여전히 최대 $\sqrt{u}$ bits짜리 cluster와 summary를 scan해야 하므로 $O(\sqrt{u})$이다.

겉으로는 $O(\lg u)$보다 나빠 보이지만, 이 구조가 vEB tree의 핵심으로 이어진다. 중요한 전환점은 “summary와 각 cluster도 같은 종류의 문제이니 재귀적으로 같은 구조로 저장하자”는 생각이다. 그러면 $\sqrt{u}$ scan을 또 $sqrt(\sqrt{u})$ 문제로 줄일 수 있고, 최종적으로 `lg lg u`가 등장한다.

### 20.2 A recursive structure

이 절은 degree $\sqrt{u}$ tree 아이디어를 재귀화한다. Top-level universe size가 `u`이면, summary와 clusters는 universe size $\sqrt{u}$인 같은 종류의 구조가 된다. 그 아래는 다시 $u^{1/4}$, 그 아래는 $u^{1/8}$처럼 줄어든다. Base size는 `2`다.

이 절의 `proto-vEB` 구조는 이해를 돕기 위한 전 단계다. 여기서는 단순화를 위해 $u = 2^{2^{k}}$라고 가정한다. 그러면 $u, \sqrt{u}, u^{1/4}, \ldots$가 모두 integer power of 2로 깔끔하게 떨어진다. 실제 vEB tree는 20.3에서 이 제한을 완화해 $u=2^{k}$만 가정한다.

#### 왜 $T(u) = T(\sqrt{u}) + O(1)$이면 $O(\lg \lg u)$인가

vEB tree의 목표는 operation이 각 recursion level에서 constant work만 하고, universe size를 square root로 줄이는 것이다.

$$
T(u) = T(\sqrt{u}) + O(1) (20.2)
$$

변수 치환으로 보면 $m = \lg u$, $u = 2^{m}$이므로:

$$
T(2^{m}) = T(2^{m/2}) + O(1)
$$

$S(m) = T(2^{m})$라고 두면:

$$
S(m) = S(m/2) + O(1)
$$

이는 $O(\lg m)$이고, 다시 $m = \lg u$를 대입하면:

$$
T(u) = O(\lg \lg u)
$$

다른 직관도 있다. Universe를 표현하는 bit 수는 처음에 `lg u`개다. 각 level에서 universe size를 square root로 줄이면 bit 수가 절반이 된다. `lg u` bits를 절반씩 줄여 1 bit가 될 때까지 걸리는 level 수는 `lg lg u`다.

#### $high(x)$, $low(x)$, `index(x, y)`

Universe를 $\sqrt{u}$개 clusters로 나누려면 key `x`를 cluster 번호와 cluster 내부 offset으로 나누어야 한다.

$$
\begin{aligned}
high(x) &= \operatorname{floor}(x / \sqrt{u}) \\
low(x) &= x \bmod \sqrt{u} \\
index(x, y) &= x \cdot \sqrt{u} + y
\end{aligned}
$$

`x`를 `lg u`-bit binary integer로 보면:

| 함수 | 의미 |
|---|---|
| $high(x)$ | 가장 앞쪽 $(\lg u)/2$ bits, 즉 cluster number |
| $low(x)$ | 뒤쪽 $(\lg u)/2$ bits, 즉 position inside cluster |
| `index(i, j)` | cluster `i`와 offset `j`를 원래 universe key로 복원 |

항상 다음 identity가 성립한다.

$$
x = index(high(x), low(x))
$$

주의할 점은 $\sqrt{u}$가 “현재 호출 중인 구조의 universe size”에 따라 바뀐다는 것이다. Top-level에서의 $high/low$와 recursive cluster 안에서의 $high/low$는 같은 이름이지만 기준 `u`가 다르다.

#### 20.2.1 Proto van Emde Boas structures

$proto-vEB(u)$는 universe `{0, 1, ..., u-1}`에 대한 recursive structure다.

| 경우 | 내용 |
|---|---|
| $u = 2$ | base case. $A[0..1]$ 두 bits만 저장 |
| $u \ge 4$ | `summary` pointer와 $cluster[0..\sqrt{u}-1]$ pointers를 저장 |

$u \ge 4$일 때 구조는 다음과 같다.

| Attribute | 의미 |
|---|---|
| `u` | 현재 structure의 universe size |
| `summary` | 비어 있지 않은 clusters를 나타내는 $proto-vEB(\sqrt{u})$ |
| $cluster[i]$ | cluster `i`의 contents를 저장하는 $proto-vEB(\sqrt{u})$ |

Figure 20.3은 $proto-vEB(u)$가 `summary` 하나와 $\sqrt{u}$개의 clusters로 구성된다는 사실을 보여 준다.

![Figure 20.3](@/assets/images/cs-algorithm-112-figure-20-3-page-559.png)
*Figure 20.3 · PDF p. 559 · $proto-vEB(u)$의 `summary`와 $cluster[0..\sqrt{u}-1]$ 구조*

원래 key `x`는 다음 위치에 재귀적으로 저장된다.

```text
cluster[high(x)] 안의 key low(x)
```

`summary`는 어떤 cluster가 nonempty인지를 저장한다. 즉 `summary` 안에 value `i`가 존재하면, $cluster[i]$가 최소 하나의 key를 담고 있다는 뜻이다.

#### $proto-vEB(16)$ 예시

Figure 20.4는 set `{2,3,4,5,7,14,15}`를 저장하는 $proto-vEB(16)$ 구조를 완전히 펼쳐 보여 준다. Top-level에는 4개의 $proto-vEB(4)$ clusters와 하나의 $proto-vEB(4)$ summary가 있다. 각 $proto-vEB(4)$는 다시 2개의 $proto-vEB(2)$ clusters와 하나의 $proto-vEB(2)$ summary를 가진다.

![Figure 20.4](@/assets/images/cs-algorithm-113-figure-20-4-page-560.png)
*Figure 20.4 · PDF p. 560 · set `{2,3,4,5,7,14,15}`를 저장하는 완전 확장 $proto-vEB(16)$*

예를 들어 top-level $cluster[1]$은 values 4-7을 담당한다. 이 cluster 안에서 key 7은 local offset $low(7)=3$으로 저장된다. Top-level `summary`에는 cluster 0, 1, 3이 nonempty라는 정보가 저장되고, cluster 2는 empty이므로 summary bit가 0이다.

#### Proto-vEB의 중요한 설계 감각

Proto-vEB는 Figure 20.2의 height-2 structure를 “summary와 cluster도 다시 같은 문제”라고 보고 재귀화한 것이다. 이 점이 binary tree overlay와 다르다.

| 접근 | universe를 줄이는 방식 | 한 level의 의미 |
|---|---|---|
| binary tree overlay | $u \to u/2$ | key range를 반으로 나눔 |
| degree $\sqrt{u}$ tree | $u \to \sqrt{u}$로 볼 준비 | clusters와 summary로 나눔 |
| `proto-vEB` | $u \to \sqrt{u}$ 재귀 | summary와 each cluster가 같은 ADT를 다시 구현 |

이 구조가 곧바로 모든 operation을 $O(\lg \lg u)$로 만들지는 못한다. 특히 `MINIMUM`과 `SUCCESSOR`에서 recursive calls가 두 갈래로 생기는 문제가 남는다. 다음 구간에서 이 한계를 확인한 뒤, 20.3에서 `min`/`max` attributes를 추가해 해결한다.

#### 20.2.2 Operations on a proto van Emde Boas structure

Proto-vEB operations는 현재 structure `V`와 key `x`를 받으며, $0 \le x < V.u$를 가정한다. Query operations는 `MEMBER`, `MINIMUM`, `SUCCESSOR`를 중심으로 설명하고, `MAXIMUM`, `PREDECESSOR`는 symmetric하다.

#### Membership: `PROTO-vEB-MEMBER`

`MEMBER`는 summary를 볼 필요 없이 key가 속한 cluster로 계속 내려가면 된다.

```text
PROTO-vEB-MEMBER(V, x)
1  if V.u == 2
2      return V.A[x]
3  else return PROTO-vEB-MEMBER(V.cluster[high(x)], low(x))
```

예를 들어 Figure 20.4의 $proto-vEB(16)$에서 $MEMBER(6)$을 확인하면:

$$
\begin{aligned}
u&=16: high(6)=1, low(6)=2 \to cluster[1]로 이동 \\
u&=4 : high(2)=1, low(2)=0 \to cluster[1]로 이동 \\
u&=2 : A[0] = 0 \to 6은 set에 없음
\end{aligned}
$$

한 level에서 constant work만 하고 universe size가 $\sqrt{u}$로 줄어드므로:

$$
T(u) = T(\sqrt{u}) + O(1) = O(\lg \lg u)
$$

따라서 `PROTO-vEB-MEMBER`는 proto-vEB에서도 이미 목표 시간 $O(\lg \lg u)$를 달성한다.

#### Minimum: `PROTO-vEB-MINIMUM`

Minimum은 먼저 summary에서 nonempty인 가장 왼쪽 cluster를 찾고, 그 cluster 안에서 다시 minimum offset을 찾아야 한다.

```text
PROTO-vEB-MINIMUM(V)
1  if V.u == 2
2      if V.A[0] == 1
3          return 0
4      elseif V.A[1] == 1
5          return 1
6      else return NIL
7  else min-cluster = PROTO-vEB-MINIMUM(V.summary)
8      if min-cluster == NIL
9          return NIL
10     else offset = PROTO-vEB-MINIMUM(V.cluster[min-cluster])
11          return index(min-cluster, offset)
```

논리는 자연스럽다. `summary`의 minimum은 첫 nonempty cluster 번호이고, 해당 cluster의 minimum offset을 합치면 전체 minimum이다. 하지만 recursive calls가 두 번 발생한다.

$$
T(u) = 2T(\sqrt{u}) + O(1) (20.3)
$$

$m = \lg u$, $S(m)=T(2^{m})$로 치환하면:

$$
S(m) = 2S(m/2) + O(1) = \Theta(m)
$$

따라서:

$$
T(u) = \Theta(\lg u)
$$

즉 proto-vEB의 `MINIMUM`은 목표인 $O(\lg \lg u)$에 실패한다. 한 level에서 summary와 cluster 양쪽으로 재귀 호출하기 때문이다.

#### Successor: `PROTO-vEB-SUCCESSOR`

`SUCCESSOR(V, x)`는 `x`보다 큰 최소 key를 찾는다. `x`가 현재 set에 있을 필요는 없다.

```text
PROTO-vEB-SUCCESSOR(V, x)
1  if V.u == 2
2      if x == 0 and V.A[1] == 1
3          return 1
4      else return NIL
5  else offset = PROTO-vEB-SUCCESSOR(V.cluster[high(x)], low(x))
6      if offset != NIL
7          return index(high(x), offset)
8      else succ-cluster = PROTO-vEB-SUCCESSOR(V.summary, high(x))
9          if succ-cluster == NIL
10             return NIL
11         else offset = PROTO-vEB-MINIMUM(V.cluster[succ-cluster])
12              return index(succ-cluster, offset)
```

흐름은 세 단계다.

1. 먼저 같은 cluster 안에서 $low(x)$의 successor를 찾는다.
2. 없다면 summary에서 $high(x)$보다 큰 다음 nonempty cluster를 찾는다.
3. 그런 cluster가 있으면 그 cluster의 minimum offset을 찾아 원래 key로 복원한다.

문제는 worst case에서 recursive `SUCCESSOR`가 두 번, `MINIMUM`이 한 번 호출된다는 점이다.

$$
T(u) = 2T(\sqrt{u}) + \Theta(\lg u)
$$

이 recurrence는 $\Theta(\lg u \lg \lg u)$가 되어 `MINIMUM`보다도 느리다. proto-vEB가 구조적으로는 좋은 방향이지만 아직 목표를 달성하지 못한다는 사실이 여기서 분명해진다.

#### Insert: `PROTO-vEB-INSERT`

Insertion은 key를 cluster에 넣고, summary에도 해당 cluster가 nonempty임을 표시해야 한다.

```text
PROTO-vEB-INSERT(V, x)
1  if V.u == 2
2      V.A[x] = 1
3  else PROTO-vEB-INSERT(V.cluster[high(x)], low(x))
4      PROTO-vEB-INSERT(V.summary, high(x))
```

이것도 recursive calls가 두 번이므로:

$$
T(u) = 2T(\sqrt{u}) + O(1) = \Theta(\lg u)
$$

#### Delete의 어려움

Deletion은 insertion보다 까다롭다. Insert할 때는 cluster에 key 하나를 넣으면 summary에 $high(x)$를 무조건 1로 표시해도 된다. 하지만 delete할 때는 key를 지운 뒤 그 cluster가 완전히 비었는지 알아야 summary bit를 0으로 지울 수 있다.

Proto-vEB 정의만으로는 cluster가 empty인지 빠르게 알기 어렵다. 해당 cluster의 $\sqrt{u}$ bits를 모두 검사해야 할 수 있고, 별도 element count `n` attribute를 추가하는 방법도 생각할 수 있다. CLRS는 `PROTO-vEB-DELETE` 구현을 연습문제로 남긴다.

#### Proto-vEB의 한계 요약

| Operation | Recursive calls | Time |
|---|---:|---:|
| `PROTO-vEB-MEMBER` | 1 | $O(\lg \lg u)$ |
| `PROTO-vEB-MINIMUM` | 2 | $\Theta(\lg u)$ |
| `PROTO-vEB-SUCCESSOR` | 2 + `MINIMUM` | $\Theta(\lg u \lg \lg u)$ |
| `PROTO-vEB-INSERT` | 2 | $\Theta(\lg u)$ |
| `PROTO-vEB-DELETE` | empty cluster 확인 필요 | 그대로는 곤란 |

결론은 명확하다. $O(\lg \lg u)$를 얻으려면 각 operation이 한 level에서 at most one recursive call만 해야 한다. 20.3의 진짜 vEB tree는 `min`과 `max`를 각 structure에 직접 저장해서 `MINIMUM`, `MAXIMUM`, empty check를 $O(1)$로 만들고, recursive call 수를 줄인다.

### 20.3 The van Emde Boas tree

실제 `van Emde Boas tree`는 proto-vEB와 거의 같은 recursive summary/cluster 구조를 쓰지만, 각 structure에 `min`과 `max`를 추가로 저장한다. 이 작은 추가 정보가 대부분의 operation에서 recursive call 하나를 제거해 $O(\lg \lg u)$를 만든다.

#### Universe size 제한 완화: upper/lower square root

20.2에서는 $u = 2^{2^{k}}$만 허용했다. 실제 vEB tree에서는 $u$가 임의의 power of 2이면 된다. 즉 $u = 2^{k}$라고만 가정한다. $\lg u$가 odd일 수 있으므로 key bits를 정확히 반으로 나눌 때 upper half와 lower half 크기가 다를 수 있다.

CLRS는 다음 두 값을 사용한다.

$$
\begin{aligned}
\text{upper sqrt:} 2^{\operatorname{ceil}((\lg u)/2)} \\
\text{lower sqrt:} 2^{\operatorname{floor}((\lg u)/2)}
\end{aligned}
$$

정리본에서는 표기 편의를 위해 각각 $sqrt_{up}(u)$, $sqrt_{down}(u)$라고 쓰겠다. 그러면:

$$
u = sqrt_{up}(u) \cdot sqrt_{down}(u)
$$

`high`, `low`, `index`도 lower square root 기준으로 다시 정의된다.

$$
\begin{aligned}
high(x) &= floor(x / sqrt_{down}(u)) \\
low(x) &= x \bmod sqrt_{down}(u) \\
index(x, y) &= x \cdot sqrt_{down}(u) + y
\end{aligned}
$$

`summary`는 cluster 번호들을 저장해야 하므로 universe size가 $sqrt_{up}(u)$이고, 각 cluster는 offset을 저장하므로 universe size가 $sqrt_{down}(u)$다.

#### 20.3.1 van Emde Boas trees

$vEB(u)$는 다음 attributes를 가진다.

| Attribute | 의미 |
|---|---|
| `u` | 현재 tree의 universe size |
| `min` | 현재 vEB tree에 저장된 minimum element. Empty이면 `NIL` |
| `max` | 현재 vEB tree에 저장된 maximum element. Empty이면 `NIL` |
| `summary` | nonempty clusters를 나타내는 `vEB(sqrt_up(u))` |
| $cluster[i]$ | cluster `i`의 contents를 저장하는 `vEB(sqrt_down(u))` |

Figure 20.5는 $u > 2$인 vEB tree의 정보를 보여 준다. Proto-vEB와 비교하면 `min`과 `max`가 새로 추가되었고, summary와 cluster의 universe sizes가 upper/lower square root로 나뉜다.

![Figure 20.5](@/assets/images/cs-algorithm-114-figure-20-5-page-567.png)
*Figure 20.5 · PDF p. 567 · 실제 $vEB(u)$의 `min`, `max`, `summary`, `cluster` 구성*

가장 중요한 비대칭은 다음이다.

```text
V.min은 V.cluster[...] 안에 저장하지 않는다.
V.max는 원소가 2개 이상이면 cluster 안에도 저장된다.
```

즉 vEB tree `V`가 나타내는 set은:

$$
{V.\min} \cup 모든 V.cluster[i]에 재귀적으로 저장된 elements
$$

단, empty tree에서는 $V.\min = V.\max = NIL$이고, 원소가 하나뿐이면 $V.min = V.max = \text{그 원소}$이며 clusters에는 아무것도 저장하지 않는다.

Figure 20.6은 Figure 20.4의 proto-vEB 구조와 같은 set $\{2,3,4,5,7,14,15\}$를 저장하는 $vEB(16)$이다. Top-level $V.\min = 2$, $V.\max = 15$다. $2$는 minimum이므로 $cluster[0]$ 안에 다시 저장되지 않는다. 그래서 $cluster[0].min$은 3이다.

![Figure 20.6](@/assets/images/cs-algorithm-115-figure-20-6-page-569.png)
*Figure 20.6 · PDF p. 569 · set `{2,3,4,5,7,14,15}`를 저장하는 $vEB(16)$과 `min` 비저장 규칙*

#### $\min/\max$가 recursive calls를 줄이는 네 가지 방식

| 효과 | 설명 |
|---|---|
| `MINIMUM`, `MAXIMUM` | 그냥 `V.min`, `V.max`를 반환하므로 recursion 없음 |
| `SUCCESSOR`/`PREDECESSOR` cluster 판정 | 같은 cluster 안에 successor가 있는지 `cluster.max`로 O(1)에 확인 가능 |
| empty/singleton/multiple 판정 | `min`, `max` 값만 보고 O(1)에 알 수 있음 |
| empty insert/singleton delete 단축 | empty tree에 insert하거나 singleton tree에서 delete할 때 clusters를 건드리지 않음 |

이 네 가지가 proto-vEB의 실패 원인이던 “한 level에서 recursive calls가 두 번 이상 발생”하는 문제를 제거한다.

#### Running time recurrence

Odd power of 2일 때 summary는 $sqrt_{up}(u)$ 크기를 갖는다. Recursive procedure들은 모두 최대 하나의 recursive call만 하고, 그 call의 universe size는 많아야 $sqrt_{up}(u)$다.

$$
T(u) \le T(sqrt_{up}(u)) + O(1) (20.4)
$$

$m = \lg u$로 두면:

$$
T(2^{m}) \le T(2^{\lceil m/2 \rceil}) + O(1)
$$

$\lceil m/2 \rceil \le 2m/3$ for $m \ge 2$이므로:

$$
S(m) \le S(2m/3) + O(1) = O(\lg m)
$$

따라서:

$$
T(u) = O(\lg \lg u)
$$

계수 $1/2$ 대신 $2/3$이 들어가도 asymptotic level 수는 여전히 logarithmic in `lg u`다.

#### Space와 creation cost

vEB tree는 universe size `u`를 알고 미리 적절한 recursive structure를 만들어야 한다. CLRS는 총 space가 $O(u)$이고 empty tree creation도 $O(u)$임을 문제로 남긴다. 이는 red-black tree처럼 empty structure를 $O(1)$에 만들 수 있는 자료구조와 다른 trade-off다.

따라서 operation 수가 매우 적거나 실제 저장 element 수 `n`이 universe size `u`에 비해 너무 작으면 vEB tree의 초기화/공간 비용이 부담될 수 있다. 실전적으로는 small set에는 array나 linked list 같은 단순 구조를 쓰고, 충분히 많은 operations가 있을 때 vEB 구조의 빠른 operation bound가 의미를 가진다.

#### 20.3.2 Operations on a van Emde Boas tree: 기본 query

`MINIMUM`과 `MAXIMUM`은 `min`과 `max`를 저장하므로 constant time이다.

$$
\begin{aligned}
vEB-TREE-MINIMUM(V) \\
    \text{return V.min} \\

vEB-TREE-MAXIMUM(V) \\
    \text{return V.max}
\end{aligned}
$$

$V.\min = NIL$이면 empty tree이므로 `MINIMUM`도 `NIL`을 반환한다. 이 단순함이 proto-vEB의 `MINIMUM`이 두 번 recursive call하던 문제를 없앤다.

#### Membership: `vEB-TREE-MEMBER`

`MEMBER`는 `x`가 `min` 또는 `max`와 같으면 즉시 `TRUE`를 반환한다. 그렇지 않고 base case $u=2$이면 cluster가 없으므로 `FALSE`다. 그 외에는 `x`가 들어갈 cluster로 재귀한다.

```text
vEB-TREE-MEMBER(V, x)
1  if x == V.min or x == V.max
2      return TRUE
3  elseif V.u == 2
4      return FALSE
5  else return vEB-TREE-MEMBER(V.cluster[high(x)], low(x))
```

Recursive call은 최대 하나이고 universe size가 $sqrt_{down}(u)$로 줄어드므로 recurrence (20.4)에 의해 $O(\lg \lg u)$다.

#### Successor: `vEB-TREE-SUCCESSOR`

`SUCCESSOR(V, x)`는 `x`보다 큰 최소 element를 찾는다. Proto-vEB와의 차이는 같은 cluster 안에 successor가 있는지를 recursive call 없이 `cluster.max`로 판단한다는 점이다.

```text
vEB-TREE-SUCCESSOR(V, x)
1  if V.u == 2
2      if x == 0 and V.max == 1
3          return 1
4      else return NIL
5  elseif V.min != NIL and x < V.min
6      return V.min
7  else max-low = vEB-TREE-MAXIMUM(V.cluster[high(x)])
8      if max-low != NIL and low(x) < max-low
9          offset = vEB-TREE-SUCCESSOR(V.cluster[high(x)], low(x))
10         return index(high(x), offset)
11     else succ-cluster = vEB-TREE-SUCCESSOR(V.summary, high(x))
12         if succ-cluster == NIL
13             return NIL
14         else offset = vEB-TREE-MINIMUM(V.cluster[succ-cluster])
15             return index(succ-cluster, offset)
```

케이스를 나누면 다음과 같다.

| 경우 | 처리 |
|---|---|
| $u=2$ | $x=0$이고 1이 있으면 successor는 1, 아니면 `NIL` |
| $x < V.min$ | 전체 minimum이 바로 successor |
| 같은 cluster에 `x`보다 큰 값 존재 | cluster 안으로 한 번 재귀 |
| 같은 cluster에 없음 | summary에서 다음 nonempty cluster를 한 번 재귀로 찾고, 그 cluster의 `MINIMUM`을 O(1)에 읽음 |

Line 7의 `max-low`가 proto-vEB의 비싼 첫 recursive search를 없앤다. 같은 cluster 안에 successor가 있는지 `max-low`와 $low(x)$ 비교만으로 알 수 있기 때문이다. 따라서 `SUCCESSOR`는 cluster 또는 summary 중 하나에만 재귀하고 $O(\lg \lg u)$ worst-case다.

#### Predecessor: `vEB-TREE-PREDECESSOR`

`PREDECESSOR`는 `SUCCESSOR`와 대칭이지만, `V.min`이 clusters에 저장되지 않는 비대칭 때문에 추가 케이스가 있다.

```text
vEB-TREE-PREDECESSOR(V, x)
1  if V.u == 2
2      if x == 1 and V.min == 0
3          return 0
4      else return NIL
5  elseif V.max != NIL and x > V.max
6      return V.max
7  else min-low = vEB-TREE-MINIMUM(V.cluster[high(x)])
8      if min-low != NIL and low(x) > min-low
9          offset = vEB-TREE-PREDECESSOR(V.cluster[high(x)], low(x))
10         return index(high(x), offset)
11     else pred-cluster = vEB-TREE-PREDECESSOR(V.summary, high(x))
12         if pred-cluster == NIL
13             if V.min != NIL and x > V.min
14                 return V.min
15             else return NIL
16         else offset = vEB-TREE-MAXIMUM(V.cluster[pred-cluster])
17              return index(pred-cluster, offset)
```

Line 13-14가 추가 케이스다. `x`의 predecessor가 lower-numbered cluster에 없을 수 있는데, 그때 predecessor가 `V.min`일 수 있다. `V.min`은 어느 cluster에도 저장되지 않으므로 summary만 보면 놓친다.

#### Insertion: `vEB-TREE-INSERT`

Insertion은 proto-vEB처럼 cluster와 summary 양쪽에 항상 재귀하지 않는다. 들어갈 cluster가 이미 nonempty이면 cluster에만 재귀하면 된다. Cluster가 empty이면 summary에 cluster 번호를 넣고, cluster 자체에는 `EMPTY-TREE-INSERT`로 $\min=\max=low(x)$만 설정한다.

```text
vEB-EMPTY-TREE-INSERT(V, x)
1  V.min = x
2  V.max = x

vEB-TREE-INSERT(V, x)
1  if V.min == NIL
2      vEB-EMPTY-TREE-INSERT(V, x)
3  else if x < V.min
4      exchange x with V.min
5  if V.u > 2
6      if vEB-TREE-MINIMUM(V.cluster[high(x)]) == NIL
7          vEB-TREE-INSERT(V.summary, high(x))
8          vEB-EMPTY-TREE-INSERT(V.cluster[high(x)], low(x))
9      else vEB-TREE-INSERT(V.cluster[high(x)], low(x))
10 if x > V.max
11     V.max = x
```

Line 3-4의 exchange가 중요하다. 새 key `x`가 현재 `V.min`보다 작으면 `x`는 새 minimum이 되어야 한다. 그런데 기존 minimum을 잃으면 안 되므로, `x`와 `V.min`을 바꿔 기존 minimum을 cluster에 삽입하게 만든다. 이 규칙 덕분에 `V.min`은 clusters에 저장하지 않는 invariant가 유지된다.

Insertion의 recursive call은 다음 둘 중 하나다.

| 상황 | recursive call |
|---|---|
| target cluster가 empty | `summary`에 cluster 번호 삽입. cluster에는 O(1) empty insert |
| target cluster가 nonempty | target cluster에 key 삽입. summary는 이미 갱신되어 있음 |

따라서 한 level에서 recursive call은 최대 하나이고, 전체 time은 $O(\lg \lg u)$다.

#### Deletion: `vEB-TREE-DELETE`

Deletion은 가장 복잡하다. 삭제할 key가 `V.min`이면 clusters에 저장된 다음 최소 element를 찾아 새 `V.min`으로 올리고, 그 element를 원래 cluster에서 삭제해야 한다.

```text
vEB-TREE-DELETE(V, x)
1  if V.min == V.max
2      V.min = NIL
3      V.max = NIL
4  elseif V.u == 2
5      if x == 0
6          V.min = 1
7      else V.min = 0
8      V.max = V.min
9  else if x == V.min
10     first-cluster = vEB-TREE-MINIMUM(V.summary)
11     x = index(first-cluster,
                 vEB-TREE-MINIMUM(V.cluster[first-cluster]))
12     V.min = x
13 vEB-TREE-DELETE(V.cluster[high(x)], low(x))
14 if vEB-TREE-MINIMUM(V.cluster[high(x)]) == NIL
15     vEB-TREE-DELETE(V.summary, high(x))
16     if x == V.max
17         summary-max = vEB-TREE-MAXIMUM(V.summary)
18         if summary-max == NIL
19             V.max = V.min
20         else V.max = index(summary-max,
                             vEB-TREE-MAXIMUM(V.cluster[summary-max]))
21 elseif x == V.max
22     V.max = index(high(x),
                   vEB-TREE-MAXIMUM(V.cluster[high(x)]))
```

핵심 케이스를 나누면 다음과 같다.

| 경우 | 처리 |
|---|---|
| singleton tree | $\min=\max=NIL$ |
| base $u=2$ with two elements | 남은 element를 $\min=\max$로 설정 |
| $x = V.min$ | clusters에서 다음 minimum을 찾아 $V.min$으로 올리고, 그 값을 cluster에서 삭제 |
| 삭제 후 cluster empty | summary에서 cluster 번호 삭제 |
| 삭제한 값이 `V.max` | summary/cluster의 maximum으로 `V.max` 갱신 |

겉으로는 line 13과 line 15에서 recursive calls가 두 번 발생할 수 있어 recurrence (20.4)가 깨지는 것처럼 보인다. 하지만 두 호출은 비용 관점에서 동시에 비싸지 않다.

Line 15가 실행되려면 line 14에서 cluster가 empty가 되었어야 한다. 그러려면 line 13으로 삭제한 `x`가 그 cluster의 유일한 element였어야 한다. 이 경우 line 13의 recursive delete는 singleton case라 $O(1)$에 끝난다. 따라서 항상 다음 둘 중 하나다.

$$
\begin{aligned}
line 13 recursive call is O(1) \\
\text{or} \\
\text{line 15 recursive call does not occur}
\end{aligned}
$$

그래서 `DELETE`도 effective하게 한 level당 recursive call 하나만 가지며, $O(\lg \lg u)$ worst-case다.

#### vEB operations 요약

| Operation | 핵심 장치 | Time |
|---|---|---:|
| `vEB-TREE-MINIMUM` | `V.min` 직접 반환 | $O(1)$ |
| `vEB-TREE-MAXIMUM` | `V.max` 직접 반환 | $O(1)$ |
| `vEB-TREE-MEMBER` | $\min/\max$ 확인 후 cluster 하나 재귀 | $O(\lg \lg u)$ |
| `vEB-TREE-SUCCESSOR` | cluster `max`로 같은 cluster 여부 판정 | $O(\lg \lg u)$ |
| `vEB-TREE-PREDECESSOR` | cluster `min`과 `V.min` 추가 케이스 | $O(\lg \lg u)$ |
| `vEB-TREE-INSERT` | empty cluster는 O(1) insert, summary 또는 cluster 하나만 재귀 | $O(\lg \lg u)$ |
| `vEB-TREE-DELETE` | singleton delete 단축으로 두 재귀 호출이 동시에 비싸지 않음 | $O(\lg \lg u)$ |

### Problems와 chapter notes의 연결

Chapter 20의 problems는 vEB tree의 두 큰 약점인 space와 practical representation을 다룬다.

| 항목 | 연결되는 아이디어 |
|---|---|
| `20-1 Space requirements for van Emde Boas trees` | 기본 vEB tree의 $O(u)$ space를 분석하고, hash table 기반 `reduced-space van Emde Boas tree (RS-vEB tree)`로 nonempty clusters만 저장 |
| `20-2 y-fast tries` | perfect hashing과 balanced BST group을 결합해 $O(n)$ space와 $O(\lg \lg u)$ query를 달성 |
| $20.3-4$ | duplicate insert/delete missing key 같은 precondition 위반을 어떻게 검사할지 |
| $20.3-6$ | $O(u)$ creation cost까지 amortized로 고려하려면 operation 수가 얼마나 필요할지 |

Chapter notes는 vEB tree가 P. van Emde Boas의 초기 아이디어에서 출발했음을 언급한다. 이후 universe size가 prime인 경우, nonrecursive multi-level search tree, hardware-pipelined vEB variants, predecessor lower bound까지 연결된다. 특히 predecessor 문제에 대한 lower bound는 vEB tree가 이 operation에서 본질적으로 최적인 축에 있음을 보여 준다.

## 연결 관계

| 연결 대상 | 관계 |
|---|---|
| Chapter 8 `Counting sort` | bounded integer keys를 이용해 comparison lower bound를 우회하는 발상 |
| Chapter 11 `Hash tables` | `RS-vEB tree`에서 nonempty clusters만 hash table로 저장 |
| Chapter 13 `Red-black trees` | comparison-based dynamic set과 bounded-universe dynamic set의 trade-off 비교 대상 |
| Chapter 17 `Dynamic tables` | RS-vEB의 dynamic hash table 공간 관리와 연결 |
| Chapter 19 `Fibonacci heaps` | priority queue operations를 더 빠르게 하려는 맥락에서 이어짐 |

## 오해하기 쉬운 내용

| 오해 | 정정 |
|---|---|
| vEB tree는 $O(\lg \lg n)$이다 | 정확한 bound는 universe size 기준 $O(\lg \lg u)$다 |
| `n`과 `u`는 같은 의미다 | `n`은 저장된 element 수, `u`는 가능한 key 값의 범위 크기다 |
| 모든 integer key에 바로 쓸 수 있다 | key가 bounded universe ${0,\ldots,u-1}$ 안에 있어야 하며 duplicate도 기본 구조에서는 허용하지 않는다 |
| proto-vEB만으로 충분하다 | proto-vEB는 `MINIMUM`, `SUCCESSOR`, `INSERT` 등에서 recursive calls가 많아 목표 시간에 실패한다 |
| `V.min`도 cluster에 저장된다 | 실제 vEB에서는 `V.min`은 clusters에 저장하지 않는다. `V.max`는 원소가 2개 이상이면 cluster에도 저장된다 |
| `DELETE`는 recursive call을 두 번 하므로 느리다 | 두 번째 recursive call이 생기면 첫 번째 call은 singleton delete라 constant time이다 |
| vEB tree는 공간도 항상 효율적이다 | 기본 구조는 $O(u)$ space라 sparse set에서는 부담이 크다 |

## 면접 질문

1. vEB tree가 comparison-based $\Omega(\lg n)$ 장벽을 우회할 수 있는 전제는 무엇인가?
2. `n`과 `u`의 차이를 설명하고, vEB tree의 running time이 어느 쪽에 의존하는지 말하라.
3. Bit vector direct addressing에서 `MEMBER`는 빠른데 `SUCCESSOR`가 느린 이유는 무엇인가?
4. `summary`와 `cluster`가 각각 어떤 정보를 저장하는지 설명하라.
5. $high(x)$, $low(x)$, $index(i,j)$의 의미와 관계를 설명하라.
6. Proto-vEB의 `MINIMUM`이 $O(\lg \lg u)$가 아니라 $\Theta(\lg u)$인 이유는 무엇인가?
7. 실제 vEB tree에서 `min`과 `max` attributes가 recursive calls를 어떻게 줄이는가?
8. 왜 `V.min`은 clusters에 저장하지 않고, 이 비대칭이 `PREDECESSOR`에 어떤 추가 케이스를 만드는가?
9. `vEB-TREE-INSERT`에서 $x < V.min$일 때 왜 $x$와 $V.min$을 exchange하는가?
10. `vEB-TREE-DELETE`가 두 recursive calls를 할 수 있는데도 $O(\lg \lg u)$인 이유를 설명하라.
11. 기본 vEB tree의 $O(u)$ space 문제와 `RS-vEB tree`, `y-fast trie`가 해결하려는 방향을 설명하라.
