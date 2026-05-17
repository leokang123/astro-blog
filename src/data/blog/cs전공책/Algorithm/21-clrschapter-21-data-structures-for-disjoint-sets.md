---
title: "Chapter 21. Data Structures for Disjoint Sets"
order: 21
pubDatetime: 2026-05-17T00:00:00+09:00
modDatetime: 2026-05-17T00:00:00+09:00
description: "CLRS 알고리즘 정리: Chapter 21. Data Structures for Disjoint Sets"
tags:
  - "Algorithm"
  - "CS"
  - "CLRS"
---

## 개요

`disjoint-set data structure`는 서로 겹치지 않는 여러 dynamic sets를 유지하면서, 어떤 element가 속한 set을 찾고 두 sets를 합치는 연산을 빠르게 지원하는 자료구조다. 흔히 `union-find`라고 부르며, CLRS는 `MAKE-SET`, `UNION`, `FIND-SET` 세 연산을 중심으로 설명한다.

이 장의 핵심은 단순한 집합 표현에서 출발해, linked-list representation, disjoint-set forest, union by rank, path compression으로 점점 개선하는 흐름이다. 최종 forest 구현은 이론적으로는 `O(m α(n))`에 가까운 “거의 선형” amortized bound를 가지며, 여기서 `α(n)`은 매우 느리게 증가하는 inverse Ackermann function이다.

## 핵심 개념

| 용어 | 의미 | 검색 키워드 |
|---|---|---|
| `disjoint sets` | 서로 공통 원소가 없는 sets의 collection | disjoint sets |
| `representative` | 각 set을 식별하는 대표 element | representative |
| `MAKE-SET(x)` | element `x`만 담은 singleton set 생성 | MAKE-SET |
| `UNION(x, y)` | `x`가 속한 set과 `y`가 속한 set을 합침 | UNION |
| `FIND-SET(x)` | `x`가 속한 set의 representative 반환 | FIND-SET |
| `linked-list representation` | 각 set을 linked list로 표현하고 각 object가 representative pointer를 가짐 | linked list |
| `disjoint-set forest` | 각 set을 rooted tree로 표현하는 구조 | disjoint-set forest |
| `union by rank` | rank가 작은 root를 rank가 큰 root 밑에 붙이는 heuristic | union by rank |
| `path compression` | `FIND-SET` 중 방문한 nodes가 root를 직접 가리키게 만드는 heuristic | path compression |
| `α(n)` | inverse Ackermann function, 실제 크기에서는 거의 상수처럼 작음 | inverse Ackermann |

## 세부 정리

### 21.1 Disjoint-set operations

Disjoint-set structure가 유지하는 collection은 다음과 같다.

```text
S = {S1, S2, ..., Sk}
Si ∩ Sj = ∅  for i ≠ j
```

각 set은 `representative`로 식별한다. 대표 원소는 반드시 그 set의 member여야 한다. 어떤 applications에서는 “같은 set이면 같은 representative만 일관되게 반환하면 충분”하고, 다른 applications에서는 “가장 작은 원소를 representative로 삼는다”처럼 특정 rule이 필요할 수도 있다. CLRS의 기본 disjoint-set ADT는 representative의 선택 규칙 자체보다 세 연산의 효율에 집중한다.

#### 세 가지 기본 연산

| Operation | 의미 | 중요한 precondition/효과 |
|---|---|---|
| `MAKE-SET(x)` | `x` 하나만 담은 새 set 생성 | `x`가 아직 어떤 set에도 속하지 않아야 함 |
| `UNION(x, y)` | `x`가 속한 set `Sx`와 `y`가 속한 set `Sy`를 합침 | 두 set은 합치기 전 disjoint라고 가정 |
| `FIND-SET(x)` | `x`가 들어 있는 unique set의 representative pointer 반환 | 같은 set이면 같은 representative를 반환해야 함 |

`UNION(x, y)`는 개념적으로 기존 `Sx`, `Sy`를 collection에서 제거하고 `Sx ∪ Sy`를 새 set으로 넣는 연산이다. 실제 구현에서는 보통 한 set의 elements를 다른 set에 흡수하거나, 한 root를 다른 root 밑에 붙이는 식으로 표현을 갱신한다.

#### 분석 파라미터: `n`과 `m`

CLRS는 전체 running time을 다음 두 값으로 분석한다.

| 기호 | 의미 |
|---|---|
| `n` | 수행된 `MAKE-SET` operations 수, 즉 생성된 objects 수 |
| `m` | `MAKE-SET`, `UNION`, `FIND-SET` 전체 operation 수 |

항상 `m >= n`이다. 또한 disjoint sets에서 `UNION` 한 번은 set 개수를 하나 줄인다. 처음 singleton sets가 `n`개라면 `UNION`은 최대 `n-1`번만 가능하다. 이 장에서는 편의를 위해 처음 `n`개의 operations가 모두 `MAKE-SET`이라고 가정한다. 즉 먼저 universe of objects를 만들고, 이후 union/find가 진행되는 모델이다.

#### Connected components 응용

Disjoint-set의 대표 application은 undirected graph의 `connected components`를 유지하는 것이다. Static graph라면 DFS로 connected components를 한 번에 계산할 수 있지만, edges가 동적으로 추가되는 상황에서는 매번 DFS를 다시 돌리는 것보다 union-find가 더 적합할 수 있다.

알고리즘의 아이디어는 단순하다.

```text
CONNECTED-COMPONENTS(G)
1 for each vertex v in G.V
2     MAKE-SET(v)
3 for each edge (u, v) in G.E
4     if FIND-SET(u) != FIND-SET(v)
5         UNION(u, v)

SAME-COMPONENT(u, v)
1 if FIND-SET(u) == FIND-SET(v)
2     return TRUE
3 else return FALSE
```

처음에는 모든 vertex가 자기 자신만 담은 singleton set이다. Edge `(u, v)`를 처리할 때 두 vertices가 서로 다른 set에 있으면 두 connected components를 합친다. 모든 edges를 처리한 뒤에는 두 vertices가 같은 connected component에 있을 때, 그리고 그때에만 같은 disjoint set에 있다.

Figure 21.1은 이 과정을 그대로 보여 준다. 그래프의 edges를 하나씩 처리하면서 `{a}`, `{b}`, ... 같은 singleton sets가 점차 `{a,b,c,d}`, `{e,f,g}`, `{h,i}`, `{j}`로 합쳐진다.

![Figure 21.1](@/assets/images/cs-algorithm-116-figure-21-1-page-584.png)
*Figure 21.1 · PDF p. 584 · connected components 계산 중 edge 처리에 따라 disjoint sets가 합쳐지는 과정*

#### 구현에서 놓치기 쉬운 연결

Graph와 disjoint-set structure는 서로 연결되어 있어야 한다. 실제 구현에서는 vertex object가 corresponding disjoint-set object를 가리키거나, 반대로 disjoint-set node가 graph vertex를 가리키는 reference가 필요하다. CLRS는 언어별 구현 세부는 생략하지만, 이 포인터 연결이 없으면 `FIND-SET(v)`를 어떤 object에 적용해야 할지 모호해진다.

21.1의 exercises는 이 connected-components 절차가 왜 정확한지, 그리고 `FIND-SET`과 `UNION` 호출 수가 `|V|`, `|E|`, connected components 수 `k`와 어떻게 연결되는지 확인하게 한다.

### 21.2 Linked-list representation of disjoint sets

가장 직접적인 구현은 각 set을 자기만의 linked list로 표현하는 것이다. Set object는 `head`와 `tail`을 가지며, 각 list object는 set member, `next` pointer, 그리고 자신이 속한 set object로 돌아가는 back pointer를 가진다. List 안에서 objects의 순서는 중요하지 않고, representative는 `head`가 가리키는 첫 object의 member다.

Figure 21.2(a)는 두 set을 linked list로 나타낸다. 예를 들어 `S1`의 representative는 첫 member `f`이고, `FIND-SET(g)`는 `g`의 back pointer로 set object에 간 뒤 `head`의 member `f`를 반환한다.

![Figure 21.2](@/assets/images/cs-algorithm-117-figure-21-2-page-586.png)
*Figure 21.2 · PDF p. 586 · linked-list representation과 `UNION(g,e)` 후 두 lists를 이어 붙인 결과*

#### Linked-list에서 쉬운 연산

| Operation | Linked-list 구현 | Time |
|---|---|---:|
| `MAKE-SET(x)` | `x` 하나를 담은 list object와 set object 생성, `head=tail=x` | `O(1)` |
| `FIND-SET(x)` | `x`의 back pointer로 set object를 찾고 `head` member 반환 | `O(1)` |
| `UNION(x,y)` simple version | `y`의 list를 `x`의 list 뒤에 append하고, `y` list의 모든 objects의 back pointer 갱신 | `Θ(length of y's list)` |

`tail` pointer 덕분에 두 lists를 물리적으로 이어 붙이는 것 자체는 빠르다. 병목은 append되는 list의 모든 objects가 이제 새 set object를 가리키도록 back pointer를 바꿔야 한다는 점이다. Figure 21.2(b)의 `UNION(g,e)`에서는 `e`가 속한 list의 `b,c,e,h` objects 모두가 새 set object를 가리키도록 갱신된다.

#### Simple union의 worst case

Naive `UNION`은 “항상 `y`의 list를 `x`의 list 뒤에 붙인다”처럼 방향을 고려하지 않으면 쉽게 `Θ(n^2)` sequence를 만든다.

Figure 21.3의 sequence는 다음 패턴이다.

```text
MAKE-SET(x1), MAKE-SET(x2), ..., MAKE-SET(xn)
UNION(x2, x1)   updates 1 object
UNION(x3, x2)   updates 2 objects
UNION(x4, x3)   updates 3 objects
...
UNION(xn, x_{n-1}) updates n-1 objects
```

![Figure 21.3](@/assets/images/cs-algorithm-118-figure-21-3-page-587.png)
*Figure 21.3 · PDF p. 587 · simple linked-list `UNION`이 총 `Θ(n^2)` pointer updates를 만드는 연산열*

총 pointer update 수는 다음과 같다.

```text
Σ_{i=1}^{n-1} i = Θ(n^2)
```

전체 operations 수는 `m = 2n - 1`이므로, 평균적으로 operation 하나가 `Θ(n)` 시간이 걸린다. 즉 simple linked-list union의 amortized time도 `Θ(n)`까지 나빠질 수 있다.

#### Weighted-union heuristic

병목은 긴 list를 짧은 list 뒤에 붙일 때 발생한다. 이를 피하는 간단한 방법이 `weighted-union heuristic`이다.

```text
항상 shorter list를 longer list 뒤에 append한다.
tie는 임의로 깬다.
```

이를 위해 각 set object에 list length를 추가로 저장한다. 단일 `UNION`은 여전히 `Ω(n)`일 수 있다. 두 set이 모두 `Ω(n)` 크기라면 shorter list도 `Ω(n)`이기 때문이다. 하지만 sequence 전체로 보면 각 object의 back pointer가 자주 바뀌지 않는다.

#### Theorem 21.1: linked list + weighted union

Theorem 21.1은 다음을 보장한다.

```text
linked-list representation + weighted-union heuristic:
m operations, n MAKE-SET operations
=> total time O(m + n lg n)
```

핵심 증명은 “각 object의 back pointer가 몇 번이나 갱신될 수 있는가”를 보는 것이다. 어떤 object `x`의 pointer가 갱신될 때마다, `x`는 반드시 더 작은 set에 속해 있었다. 작은 set을 큰 set에 붙이면, `x`가 속한 resulting set의 size는 최소 두 배가 된다.

| `x`의 pointer update 횟수 | 그 직후 `x`가 속한 set의 최소 size |
|---:|---:|
| 1번 | 2 |
| 2번 | 4 |
| 3번 | 8 |
| `k`번 | `2^k` |

Set size는 최대 `n`이므로 한 object의 pointer는 최대 `⌈lg n⌉`번 갱신된다. Object가 `n`개이므로 모든 `UNION`에서 발생하는 pointer update 총량은 `O(n lg n)`이다. 여기에 `MAKE-SET`, `FIND-SET`, `tail`, length 갱신 같은 `O(1)` 작업을 모두 더하면 전체는 `O(m + n lg n)`이 된다.

이 절의 중요한 trade-off는 분명하다. Linked-list representation은 `FIND-SET`을 빠르게 만들기 위해 각 object에 set pointer를 둔다. 대신 `UNION`은 합쳐지는 list의 모든 set pointers를 고쳐야 한다. Weighted union은 이 갱신 비용을 “한 object가 list를 옮길 때마다 set 크기가 적어도 두 배가 된다”는 doubling argument로 amortize한다.

### 21.3 Disjoint-set forests

더 빠른 구현은 각 set을 rooted tree로 표현하는 `disjoint-set forest`다. 각 node는 한 member를 담고 parent pointer 하나만 가진다. Root는 set의 representative이고, root의 parent는 자기 자신이다.

Figure 21.4(a)는 Figure 21.2의 두 linked-list sets를 forest로 표현한 모습이다. Figure 21.4(b)의 `UNION(e,g)`는 한 tree의 root가 다른 tree의 root를 parent로 가리키게 하여 두 sets를 합친다.

![Figure 21.4](@/assets/images/cs-algorithm-120-figure-21-4-page-590.png)
*Figure 21.4 · PDF p. 590 · disjoint-set forest에서 두 rooted trees와 `UNION(e,g)` 후 root 연결*

#### Forest에서의 기본 연산

| Operation | Forest 구현 |
|---|---|
| `MAKE-SET(x)` | node 하나짜리 tree 생성, `x.p = x` |
| `FIND-SET(x)` | parent pointers를 따라 root까지 올라감 |
| `UNION(x,y)` | `FIND-SET(x)`, `FIND-SET(y)`로 roots를 찾고 한 root를 다른 root 밑에 붙임 |

단순 forest만으로는 linked-list보다 asymptotically 좋아지지 않는다. `n-1`번의 `UNION`이 한쪽으로만 붙으면 height `n-1`짜리 linear chain이 생기고, `FIND-SET`이 `Θ(n)`까지 걸릴 수 있다. 개선은 두 heuristic에서 나온다.

#### Heuristic 1: union by rank

`union by rank`는 linked-list의 weighted union과 같은 철학이다. Tree가 너무 깊어지지 않도록 작은 쪽을 큰 쪽 아래에 붙이고 싶지만, 모든 subtree size를 직접 정확히 관리하는 대신 CLRS는 `rank`를 사용한다.

`x.rank`는 node `x`를 root로 하는 subtree height의 upper bound다. `UNION`에서는 roots의 ranks를 비교한다.

| 경우 | 처리 |
|---|---|
| `x.rank > y.rank` | `y.p = x` |
| `x.rank < y.rank` | `x.p = y` |
| `x.rank == y.rank` | 한쪽을 parent로 삼고 그 parent root의 rank를 1 증가 |

Rank는 실제 height와 같을 필요가 없다. 특히 path compression이 tree height를 낮춰도 ranks는 갱신하지 않는다. 그래서 rank는 “현재 height”가 아니라 analysis에 쓰이는 upper bound로 보는 편이 정확하다.

#### Heuristic 2: path compression

`path compression`은 `FIND-SET(x)`가 root까지 올라가는 동안 방문한 모든 nodes가 곧바로 root를 parent로 가리키게 만든다. 한 번 비싼 find를 수행하면 이후 같은 path 주변의 find가 훨씬 빨라진다.

Figure 21.5는 `FIND-SET(a)` 전후를 보여 준다. 실행 전에는 `a -> b -> c -> d -> e -> f`처럼 root까지 긴 path를 따라 올라가야 하지만, 실행 후에는 path 위의 nodes가 root `f`를 직접 가리킨다.

![Figure 21.5](@/assets/images/cs-algorithm-121-figure-21-5-page-591.png)
*Figure 21.5 · PDF p. 591 · `FIND-SET(a)` 수행 중 find path의 nodes가 root를 직접 가리키도록 압축되는 과정*

#### Forest pseudocode

CLRS 구현은 `UNION`이 직접 roots를 조작하지 않고 helper `LINK`에 roots를 넘긴다.

```text
MAKE-SET(x)
1 x.p = x
2 x.rank = 0

UNION(x, y)
1 LINK(FIND-SET(x), FIND-SET(y))

LINK(x, y)
1 if x.rank > y.rank
2     y.p = x
3 else x.p = y
4     if x.rank == y.rank
5         y.rank = y.rank + 1
```

Path compression을 포함한 `FIND-SET`은 짧지만 매우 강력하다.

```text
FIND-SET(x)
1 if x != x.p
2     x.p = FIND-SET(x.p)
3 return x.p
```

이 recursive version은 two-pass method다.

| Pass | 동작 |
|---|---|
| 올라가는 pass | parent pointers를 따라 root를 찾음 |
| 내려오는 pass | recursion이 unwind되면서 각 visited node의 parent를 root로 바꿈 |

Root에서는 `x == x.p`라서 recursion이 멈춘다. Non-root에서는 recursive call이 root pointer를 반환하고, line 2가 `x.p`를 그 root로 바꾼다.

#### 두 heuristic의 running time 효과

각 heuristic은 따로 써도 개선 효과가 있다.

| 사용한 heuristic | Running time 성격 |
|---|---|
| `union by rank`만 사용 | `O(m lg n)`, tight |
| `path compression`만 사용 | 별도 복잡한 bound, find 수 `f`와 `n`에 의존 |
| 둘 다 사용 | `O(m α(n))` |

`α(n)`은 21.4에서 정의하는 매우 느리게 증가하는 함수다. 실제 conceivable applications에서는 `α(n) <= 4`로 볼 수 있어서, union by rank + path compression 조합은 실용적으로 linear time처럼 동작한다. 엄밀하게는 superlinear bound지만, 알고리즘 설계에서는 거의 상수 amortized overhead를 가진다고 생각해도 무리가 없다.

### 21.4 Analysis of union by rank with path compression

이 절은 union by rank와 path compression을 함께 썼을 때 `m` operations on `n` elements의 running time이 `O(m α(n))`임을 증명한다. 증명은 두 단계로 이루어진다.

1. `α(n)`이 무엇인지 정의하고, 얼마나 느리게 증가하는지 확인한다.
2. Potential method로 `MAKE-SET`, `LINK`, `FIND-SET` sequence의 amortized cost를 bound한다.

#### 빠르게 증가하는 `A_k(j)`와 느리게 증가하는 inverse `α(n)`

CLRS는 integer `k >= 0`, `j >= 1`에 대해 함수 `A_k(j)`를 정의한다. `k`는 function level이다.

```text
A_0(j) = j + 1
A_k(j) = A_{k-1}^{(j+1)}(j)    for k >= 1
```

여기서 `A_{k-1}^{(i)}(j)`는 functional iteration이다. 즉 같은 함수를 `i`번 반복 적용한다. 이 정의 때문에 level이 하나 올라갈 때마다 성장 속도가 폭발적으로 커진다.

초기 level의 closed form은 다음과 같다.

| Lemma | 결과 | 의미 |
|---|---|---|
| Lemma 21.2 | `A_1(j) = 2j + 1` | 선형 |
| Lemma 21.3 | `A_2(j) = 2^{j+1}(j+1) - 1` | 거의 지수 |

`A_k(1)`만 봐도 증가 속도가 극단적이다.

| `k` | `A_k(1)` |
|---:|---:|
| 0 | 2 |
| 1 | 3 |
| 2 | 7 |
| 3 | 2047 |
| 4 | `A_4(1)`, 관측 가능한 우주의 atoms 수보다 훨씬 큼 |

이제 inverse Ackermann 성격의 함수 `α(n)`을 다음처럼 정의한다.

```text
α(n) = min { k : A_k(1) >= n }
```

즉 `α(n)`은 `A_k(1)`이 `n` 이상이 되는 가장 낮은 level `k`다. `A_k`가 너무 빨리 커지기 때문에 그 inverse인 `α(n)`은 거의 증가하지 않는다.

| `n` 범위 | `α(n)` |
|---|---:|
| `0 <= n <= 2` | 0 |
| `n = 3` | 1 |
| `4 <= n <= 7` | 2 |
| `8 <= n <= 2047` | 3 |
| `2048 <= n <= A_4(1)` | 4 |

그래서 현실적인 입력 크기에서는 `α(n) <= 4`로 취급할 수 있다. 하지만 이 장의 목적은 “사실상 상수”라고 뭉개는 것이 아니라, 정확히 `O(m α(n))`라는 amortized upper bound를 증명하는 것이다.

#### Properties of ranks

분석은 rank의 단조성에서 출발한다.

| 결과 | 내용 | 직관 |
|---|---|---|
| Lemma 21.4 | 모든 node `x`에 대해 `x.rank <= x.p.rank`, non-root이면 strict | parent로 갈수록 rank가 커짐 |
| Corollary 21.5 | 어떤 node에서 root로 가는 simple path를 따라 ranks는 strictly increase | find path의 rank sequence가 증가 |
| Lemma 21.6 | 모든 node의 rank는 최대 `n-1` | `LINK`는 최대 `n-1`번이고, 한 번에 rank 하나만 1 증가 가능 |

Lemma 21.6의 `n-1` bound는 약한 bound다. 실제로는 rank가 `⌊lg n⌋` 이하임을 보일 수 있지만, CLRS의 이후 potential 분석에는 `n-1`만으로 충분하다.

중요한 점은 path compression이 parent pointers를 바꾸더라도 ranks는 바꾸지 않는다는 것이다. 그래서 `x.p.rank`는 시간에 따라 monotonically increase할 수 있고, parent가 더 높은 rank node로 바뀌는 성질이 분석에 쓰인다.

#### `UNION` 대신 `LINK` sequence로 분석하기

Potential method를 쓰기 위해 CLRS는 `UNION`을 직접 분석하지 않고, `UNION(x,y)`를 다음처럼 변환해서 본다.

```text
UNION(x, y)
=> FIND-SET(x), FIND-SET(y), LINK(root_x, root_y)
```

Lemma 21.7은 원래 sequence `S'`의 `m'` operations를 `MAKE-SET`, `LINK`, `FIND-SET`만 있는 sequence `S`로 바꿔도 asymptotic bound가 유지됨을 말한다. `UNION` 하나가 최대 세 operations로 바뀌므로 `m' <= m <= 3m'`이고, `S`가 `O(m α(n))`이면 원래 sequence도 `O(m' α(n))`이다.

이 변환 덕분에 이후 분석은 `MAKE-SET`, `LINK`, `FIND-SET` 세 가지에 집중할 수 있다.

#### Potential function의 준비: `level(x)`와 `iter(x)`

Potential은 각 node `x`에 부여하는 `φ_q(x)`를 합산한다.

```text
Φ_q = Σ_x φ_q(x)
Φ_0 = 0
```

Root이거나 `x.rank = 0`이면 간단히:

```text
φ_q(x) = α(n) · x.rank
```

Non-root이고 `x.rank >= 1`이면 두 auxiliary functions를 먼저 정의한다.

```text
level(x) = max { k : x.p.rank >= A_k(x.rank) }
```

`level(x)`는 “현재 parent rank가 `x.rank`에서 출발한 `A_k` 값을 어디 level까지 감당하는가”를 나타낸다. Lemma 21.4와 Lemma 21.6, `α(n)` 정의를 이용하면:

```text
0 <= level(x) < α(n)        (21.1)
```

두 번째 함수는 같은 level에서 몇 번 iteration을 적용할 수 있는지를 본다.

```text
iter(x) = max { i : x.p.rank >= A_{level(x)}^{(i)}(x.rank) }
```

`x.rank >= 1`이면:

```text
1 <= iter(x) <= x.rank      (21.2)
```

`x.p.rank`가 monotonic하게 증가하므로 `level(x)`도 감소하지 않는다. `iter(x)`는 `level(x)`가 그대로면 증가하거나 유지되고, 감소하려면 `level(x)`가 먼저 증가해야 한다. 이 성질이 나중에 `FIND-SET`의 path compression 비용을 potential decrease로 지불하게 해 준다.

#### Node potential 정의

이제 node potential은 다음과 같다.

```text
φ_q(x) =
  α(n) · x.rank
      if x is a root or x.rank = 0

  (α(n) - level(x)) · x.rank - iter(x)
      if x is not a root and x.rank >= 1
```

직관적으로 보면 non-root node는 parent rank가 커져서 `level(x)`가 올라가거나 `iter(x)`가 올라갈수록 potential이 줄어든다. Path compression은 parent를 더 높은 rank의 root로 바꾸므로, 여러 nodes의 `level/iter`를 개선시키고 그만큼 potential을 떨어뜨린다.

Lemma 21.8은 모든 node potential이 다음 범위에 있음을 보인다.

```text
0 <= φ_q(x) <= α(n) · x.rank
```

즉 potential은 음수가 되지 않고, rank에 비례하는 제한된 저장 에너지처럼 작동한다.

#### Potential change의 핵심: Lemma 21.10

Corollary 21.9는 non-root이고 positive rank를 가진 node라면 potential이 upper bound보다 strict하게 작다고 말한다.

```text
if x is not root and x.rank > 0:
φ_q(x) < α(n) · x.rank
```

Lemma 21.10은 이후 amortized analysis의 엔진이다.

| 상황 | potential 변화 |
|---|---|
| `x`가 non-root이고 operation이 `LINK` 또는 `FIND-SET` | `φ_q(x) <= φ_{q-1}(x)` |
| additionally `x.rank >= 1`이고 `level(x)` 또는 `iter(x)`가 바뀜 | `φ_q(x) <= φ_{q-1}(x) - 1` |

즉 non-root node의 potential은 증가하지 않는다. 특히 parent가 더 높은 rank node로 바뀌어 `level` 또는 `iter`가 개선되면 potential이 최소 1 떨어진다. Path compression의 실제 비용은 바로 이 “여러 nodes에서 떨어지는 potential”로 상쇄된다.

`level(x)`가 그대로이면 `iter(x)`는 증가하거나 유지되므로 potential은 감소하거나 유지된다. `level(x)`가 증가하면 `(α(n)-level(x))·x.rank` 항이 크게 줄어든다. 이때 `iter(x)`가 작아져 potential을 일부 올릴 수 있지만, 그 증가폭은 최대 `x.rank-1`이라서 `level` 증가로 생기는 감소폭을 이기지 못한다.

#### Operation별 amortized cost

Amortized cost는 actual cost와 potential 증가분의 합이다.

```text
amortized cost = actual cost + (Φ_q - Φ_{q-1})
```

마지막 세 lemma는 각 operation의 amortized cost를 bound한다.

| Lemma | Operation | Amortized cost | 이유 |
|---|---|---:|---|
| Lemma 21.11 | `MAKE-SET` | `O(1)` | rank 0 node를 만들므로 potential 증가 없음 |
| Lemma 21.12 | `LINK` | `O(α(n))` | parent가 되는 root의 rank가 1 늘어날 때 potential이 최대 `α(n)` 증가 |
| Lemma 21.13 | `FIND-SET` | `O(α(n))` | 긴 find path의 대부분 nodes에서 potential이 1 이상 감소 |

`MAKE-SET(x)`는 `x.p=x`, `x.rank=0`인 singleton root를 만든다. `φ(x)=α(n)·0=0`이므로 potential을 늘리지 않는다.

`LINK(x,y)`는 roots 두 개를 합친다. 예를 들어 `y`가 parent가 된다고 하자. Potential이 증가할 수 있는 node는 사실상 root로 남는 `y`뿐이다. `y.rank`가 증가하지 않으면 potential도 그대로이고, equal-rank case에서 `y.rank`가 1 증가하면 root potential이 `α(n)`만큼 늘어난다. 그래서 actual `O(1)`에 potential increase `O(α(n))`를 더해 `O(α(n))`이다.

`FIND-SET`은 find path 길이를 `s`라 하면 actual cost가 `O(s)`다. Path compression 후, root와 몇몇 예외를 제외한 많은 nodes의 parent가 더 높은 rank의 root로 바뀌면서 `level/iter`가 바뀌고 potential이 1 이상 감소한다.

예외가 될 수 있는 nodes는 최대 `α(n)+2`개다.

| 예외 node | 왜 예외인가 |
|---|---|
| find path의 첫 node가 rank 0인 경우 | positive rank 조건을 만족하지 않을 수 있음 |
| root | root potential은 바뀌지 않음 |
| 각 level `k=0..α(n)-1`에서 마지막으로 나타나는 node | 뒤에 같은 level의 non-root node가 없어 증명 조건을 못 씀 |

따라서 적어도 `max(0, s-(α(n)+2))`개 nodes의 potential이 1 이상 감소한다. 이 감소가 긴 path의 실제 비용 `O(s)`를 상쇄하고, 남는 amortized cost는 `O(α(n))`이다.

#### Theorem 21.14

결론은 다음이다.

```text
disjoint-set forest + union by rank + path compression:
m MAKE-SET/UNION/FIND-SET operations,
n of which are MAKE-SET operations
=> worst-case total time O(m α(n))
```

Theorem 21.14는 Lemma 21.7, 21.11, 21.12, 21.13을 합쳐 바로 나온다. `UNION`은 `FIND-SET`, `FIND-SET`, `LINK`로 바꿔도 operation 수가 constant factor만 증가하므로, converted sequence에서 얻은 `O(m α(n))` bound가 원래 sequence에도 적용된다.

#### 분석 흐름 요약

```text
rank monotonicity
  -> find path ranks strictly increase
  -> level(x), iter(x) 정의 가능
  -> path compression이 parent rank를 크게 올림
  -> many nodes lose potential
  -> long FIND-SET actual cost is paid by potential drop
  -> total O(m α(n))
```

이 증명은 결과만큼이나 관점이 중요하다. Union-find가 빠른 이유는 단순히 “path compression을 하니까 빨라진다”가 아니라, compression으로 parent가 더 높은 rank node로 건너뛰면서 node들이 다시 비싼 find path에 자주 등장할 수 없도록 potential이 소모된다는 점이다.

### Problems와 chapter notes의 연결

Chapter 21의 problems는 disjoint-set이 단순 ADT가 아니라 여러 off-line/dynamic tree 문제의 기반 도구임을 보여 준다.

| 항목 | 핵심 아이디어 |
|---|---|
| `21-1 Off-line minimum` | 전체 operation sequence를 미리 알고 있을 때 `EXTRACT-MIN` 결과를 disjoint sets로 계산 |
| `21-2 Depth determination` | path compression과 union by rank를 응용하되, `pseudodistance`를 추가해 tree depth를 보존 |
| `21-3 Tarjan's off-line least-common-ancestors algorithm` | DFS 중 subtree 처리가 끝난 nodes를 union하고 representative의 `ancestor` field로 LCA를 답함 |

`Off-line minimum`에서는 sequence를 `I1, E, I2, E, ..., Im, E, I_{m+1}`처럼 `EXTRACT-MIN` 사이의 insert blocks로 나눈다. 작은 key `i`부터 보면서 `i`가 들어 있는 block `Kj`를 찾고, `j != m+1`이면 `extracted[j]=i`가 된다. 이후 `Kj`를 다음 살아 있는 block과 union한다. “이미 전체 sequence를 안다”는 off-line 조건이 disjoint-set 적용을 가능하게 한다.

`Depth determination`은 단순 parent pointer만 쓰면 `Θ(m^2)`까지 나빠진다. 이를 개선하려면 forest representation 안에서 실제 tree parent-child 관계를 그대로 보존하려 하지 말고, 각 node의 `pseudodistance`를 유지해 root까지의 합이 실제 depth가 되도록 만든다. 이는 path compression이 구조를 바꾸더라도 필요한 query 값을 보존하는 전형적인 augmentation pattern이다.

`Tarjan's off-line least-common-ancestors algorithm`은 DFS와 union-find의 조합이다. 어떤 node `u`의 subtree 처리가 끝나면 `u`를 black으로 칠하고, 이미 black인 query 상대 `v`에 대해서 `FIND-SET(v).ancestor`를 LCA로 출력한다. 여기서 `ancestor` field는 현재 DFS frontier에서 representative가 어느 ancestor를 의미하는지 알려 준다.

Chapter notes는 이 분야의 핵심 결과 상당수가 Tarjan의 작업에서 왔음을 설명한다. 초기에는 `O(m lg* n)` bound가 있었고, 이후 inverse Ackermann 계열의 tight upper/lower bound가 정리되었다. 또한 two-pass path compression뿐 아니라 one-pass variants도 연구되었고, 특정 applications에서는 disjoint-set operations가 `O(m)`에 가능함도 알려져 있다.

## 연결 관계

| 연결 대상 | 관계 |
|---|---|
| Chapter 17 `Amortized Analysis` | `O(m α(n))` 증명이 potential method에 의존 |
| Chapter 22 `Graph Algorithms` | connected components, DFS, least common ancestor와 직접 연결 |
| Minimum spanning tree algorithms | Kruskal algorithm에서 cycle 판정에 union-find 사용 |
| Dynamic connectivity | edges가 추가되는 graph의 connected components 유지 |
| Augmented data structures | `pseudodistance`, `ancestor`처럼 union-find node에 추가 정보를 얹는 방식 |

## 오해하기 쉬운 내용

| 오해 | 정정 |
|---|---|
| `UNION(x,y)`는 항상 `x`를 대표로 만든다 | 대표 선택은 구현에 따라 다르며, union by rank에서는 rank가 큰 root가 대표가 된다 |
| `FIND-SET`은 element 자체를 반환한다 | 해당 element가 속한 set의 representative pointer를 반환한다 |
| linked-list representation은 항상 느리다 | `MAKE-SET`, `FIND-SET`은 `O(1)`이고, 문제는 `UNION`의 pointer updates다 |
| weighted union은 단일 `UNION`을 항상 빠르게 만든다 | 단일 `UNION`은 여전히 `Ω(n)`일 수 있지만 sequence 전체가 `O(m+n lg n)`으로 좋아진다 |
| rank는 현재 tree height다 | path compression 후에는 실제 height보다 클 수 있는 upper bound다 |
| path compression은 rank도 갱신한다 | path compression은 parent pointers만 바꾸고 ranks는 그대로 둔다 |
| `O(m α(n))`은 정확히 linear time이다 | 실용적으로 거의 linear지만, 엄밀히는 `α(n)` factor가 있는 superlinear bound다 |
| `α(n)`은 `lg* n`과 같다 | 둘 다 매우 느리지만 CLRS의 `α(n)`은 `A_k(1)`의 inverse로 정의된 별도 함수다 |

## 면접 질문

1. `MAKE-SET`, `UNION`, `FIND-SET`의 의미와 각 operation의 precondition을 설명하라.
2. Disjoint-set으로 undirected graph의 `connected components`를 계산하는 과정을 설명하라.
3. Linked-list representation에서 `FIND-SET`은 왜 `O(1)`이고, simple `UNION`은 왜 느린가?
4. Weighted-union heuristic이 `O(m+n lg n)` total time을 보장하는 doubling argument를 설명하라.
5. Disjoint-set forest에서 representative는 어떤 node인가?
6. `union by rank`와 `weighted union`의 공통점과 차이를 설명하라.
7. `path compression`이 `FIND-SET` 중 parent pointers를 어떻게 바꾸는지 설명하라.
8. 왜 path compression 후에도 `rank`를 갱신하지 않는가?
9. `union by rank`만 쓸 때와 `union by rank + path compression`을 함께 쓸 때의 running time 차이를 말하라.
10. `α(n)`이 무엇이며, 왜 실용적으로 거의 상수처럼 취급되는가?
11. `O(m α(n))` 분석에서 potential이 어떤 역할을 하는지 직관적으로 설명하라.
12. Tarjan's off-line LCA algorithm에서 `ancestor` field와 `FIND-SET`이 어떻게 함께 쓰이는지 설명하라.
