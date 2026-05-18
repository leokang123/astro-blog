---
title: "Chapter 19. Fibonacci Heaps"
order: 19
pubDatetime: 2026-05-17T00:03:00+09:00
modDatetime: 2026-05-17T00:03:00+09:00
description: "CLRS 알고리즘 정리: Chapter 19. Fibonacci Heaps"
tags:
  - "Algorithm"
  - "CS"
  - "CLRS"
---

## 개요

`Fibonacci heap`은 `mergeable heap` 연산을 지원하면서, 여러 핵심 연산을 amortized constant time으로 처리하도록 설계된 priority queue 자료구조다. 특히 `INSERT`, `UNION`, `DECREASE-KEY`가 $\Theta(1)$ amortized time이고, `EXTRACT-MIN`, `DELETE`는 $O(\lg n)$ amortized time이다.

이 장의 핵심은 “매번 heap 구조를 즉시 깔끔하게 정리하지 않고, 비싼 정리는 나중에 몰아서 하되 potential method로 총비용을 통제한다”는 아이디어다. Fibonacci heap은 root list에 여러 min-heap-ordered trees를 느슨하게 유지하다가 `EXTRACT-MIN`에서 consolidation을 수행하고, `DECREASE-KEY`에서는 node를 잘라 root list로 올리는 `cut`과 `cascading cut`을 사용한다.

## 핵심 개념

| 용어 | 의미 | 검색 키워드 |
|---|---|---|
| mergeable heap | `MAKE-HEAP`, `INSERT`, `MINIMUM`, `EXTRACT-MIN`, `UNION`을 지원하는 heap ADT | mergeable heap |
| Fibonacci heap | 여러 min-heap-ordered rooted trees의 collection | Fibonacci heap |
| root list | heap의 tree roots를 연결한 circular doubly linked list | root list |
| child list | 한 node의 children을 연결한 circular doubly linked list | child list |
| `H.min` | minimum key를 가진 root node pointer | H.min |
| `x.degree` | node `x`의 children 수 | degree |
| `x.mark` | `x`가 parent의 child가 된 뒤 child를 잃은 적이 있는지 나타내는 boolean | mark |
| potential function | $\Phi(H) = t(H) + 2m(H)$ | potential |
| cascading cut | child를 잃은 marked ancestor들을 연쇄적으로 cut하는 동작 | cascading cut |
| maximum degree | `n`-node Fibonacci heap에서 node가 가질 수 있는 최대 children 수 $D(n)$ | $D(n)$ |

## 세부 정리

### 도입: Fibonacci heap이 해결하려는 비용 구조

`Mergeable heap`은 key를 가진 elements에 대해 다음 연산을 지원하는 자료구조다.

| Operation | 의미 |
|---|---|
| `MAKE-HEAP()` | empty heap 생성 |
| `INSERT(H, x)` | key가 이미 채워진 element `x`를 heap `H`에 삽입 |
| $MINIMUM(H)$ | minimum key를 가진 element pointer 반환 |
| `EXTRACT-MIN(H)` | minimum element를 삭제하고 그 pointer 반환 |
| `UNION(H1, H2)` | 두 heaps의 모든 elements를 가진 새 heap 생성, 기존 heaps는 destroyed |
| `DECREASE-KEY(H, x, k)` | element `x`의 key를 더 작은 값 `k`로 낮춤 |
| `DELETE(H, x)` | element `x` 삭제 |

Figure 19.1은 binary heap과 Fibonacci heap의 asymptotic bounds를 비교한다. Binary heap은 `UNION`이 약하고 `DECREASE-KEY`가 $\Theta(\lg n)$이지만, Fibonacci heap은 이 둘을 amortized constant time으로 만든다.

![Figure 19.1](@/assets/images/cs-algorithm-102-figure-19-1-page-527.png)
*Figure 19.1 · PDF p. 527 · binary heap과 Fibonacci heap의 mergeable-heap operation 비용 비교*

| Operation | Binary heap worst-case | Fibonacci heap amortized | 차이의 의미 |
|---|---:|---:|---|
| `MAKE-HEAP` | $\Theta(1)$ | $\Theta(1)$ | 동일 |
| `INSERT` | $\Theta(\lg n)$ | $\Theta(1)$ | 새 singleton tree를 root list에 붙여 lazy 처리 |
| `MINIMUM` | $\Theta(1)$ | $\Theta(1)$ | minimum pointer 유지 |
| `EXTRACT-MIN` | $\Theta(\lg n)$ | $O(\lg n)$ | consolidation 비용을 여기서 지불 |
| `UNION` | $\Theta(n)$ | $\Theta(1)$ | root lists를 splice |
| `DECREASE-KEY` | $\Theta(\lg n)$ | $\Theta(1)$ | cut/cascading cut을 amortized로 통제 |
| `DELETE` | $\Theta(\lg n)$ | $O(\lg n)$ | decrease to $-\infty$ 후 extract-min |

Fibonacci heap은 이론적으로 특히 `EXTRACT-MIN`과 `DELETE`가 상대적으로 적고, `DECREASE-KEY`가 매우 많은 알고리즘에서 강하다. 예를 들어 graph algorithms에서는 edge relaxation 때마다 `DECREASE-KEY`가 발생할 수 있다. Dense graph에서는 edges 수가 많으므로 `DECREASE-KEY`를 $\Theta(1)$ amortized로 만드는 것이 `minimum spanning tree`나 `single-source shortest paths` 알고리즘의 이론적 running time을 개선한다.

다만 실무에서는 constant factors와 implementation complexity가 크다. 그래서 대부분의 application에서는 binary heap이나 `k-ary heap`이 더 단순하고 빠를 수 있다. CLRS도 Fibonacci heap이 주로 theoretical interest를 가진다고 분명히 말한다. 즉 Fibonacci heap은 “항상 실무 최강 priority queue”라기보다 amortized analysis와 graph algorithm bounds를 보여 주는 핵심 구조로 이해하는 편이 맞다.

`DECREASE-KEY`와 `DELETE`는 임의 key를 search해서 찾는 연산이 아니다. Fibonacci heap도 binary heap처럼 arbitrary key search는 비효율적이다. 따라서 이 연산들은 heap node pointer를 input으로 받는다. 실제 application에서는 application object와 heap node 사이에 handle을 서로 저장해 둔다.

### 19.1 Structure of Fibonacci heaps

Fibonacci heap은 `min-heap-ordered rooted trees`의 collection이다. 각 tree는 parent key가 child key보다 작거나 같은 `min-heap property`를 만족한다. 하지만 binary heap처럼 하나의 거의 완전한 tree가 아니라, 여러 trees가 root list에 느슨하게 연결되어 있다.

Figure 19.2(a)는 5개의 min-heap-ordered trees와 14 nodes를 가진 Fibonacci heap을 보여 준다. Dashed line이 root list이고, key 3을 가진 root가 `H.min`이다. Black nodes는 marked nodes이며, 이 heap의 potential은 $5 + 2\cdot 3 = 11$이다.

![Figure 19.2](@/assets/images/cs-algorithm-103-figure-19-2-page-529.png)
*Figure 19.2 · PDF p. 529 · root list, child list, marked nodes, `H.min`을 가진 Fibonacci heap 구조*

#### Node representation

각 node `x`는 다음 attributes를 가진다.

| Attribute | 의미 |
|---|---|
| `x.key` | priority key |
| `x.p` | parent pointer |
| `x.child` | children 중 임의 하나를 가리키는 pointer |
| `x.left`, `x.right` | circular doubly linked list의 sibling pointers |
| `x.degree` | child list에 있는 children 수 |
| `x.mark` | 마지막으로 다른 node의 child가 된 뒤 child를 잃었는지 여부 |

Children은 `child list`라는 circular doubly linked list로 연결된다. Root들도 같은 방식으로 `root list`를 이룬다. Circular doubly linked list를 쓰는 이유는 두 가지다.

| 장점 | Fibonacci heap에서의 효과 |
|---|---|
| 임의 위치 삽입/삭제가 $O(1)$ | node를 root list나 child list에 빠르게 붙이고 뗄 수 있음 |
| 두 lists를 $O(1)$에 concatenate/splice | `UNION`과 children promotion을 cheap하게 처리 |

Siblings는 child list 안에서 어떤 순서로 있어도 된다. Fibonacci heap의 correctness는 sibling order가 아니라 parent-child heap order와 degree/mark 관리에 달려 있다.

#### Heap-level attributes

Heap `H`는 두 가지 주요 attributes를 가진다.

| Attribute | 의미 |
|---|---|
| `H.min` | root list에서 minimum key를 가진 root pointer. Empty heap이면 `NIL` |
| `H.n` | heap 안의 node 수 |

Root list 안의 trees는 어떤 순서로 있어도 된다. `H.min`만 정확히 유지하면 $MINIMUM(H)$는 constant time이다.

#### Potential function: $\Phi(H) = t(H) + 2m(H)$

Fibonacci heap 분석은 Chapter 17의 potential method를 사용한다. Heap `H`에 대해:

| 표기 | 의미 |
|---|---|
| $t(H)$ | root list에 있는 trees 수 |
| $m(H)$ | marked nodes 수 |

Potential function은 다음과 같다.

$$
\Phi(H) = t(H) + 2m(H) (19.1)
$$

직관적으로 $t(H)$는 나중에 `EXTRACT-MIN`에서 consolidate해야 할 roots의 수를 나타내고, $m(H)$는 `DECREASE-KEY`에서 cascading cut이 터질 수 있는 “불안정한” nodes의 수를 나타낸다. Marked node 하나에 coefficient 2를 주는 이유는 19.3에서 보듯 cascading cut이 발생할 때 potential 감소가 actual cut 비용을 지불하게 만들기 위해서다.

초기에는 heap이 없으므로 potential은 0이고, 이후에도 $t(H) \ge 0$, $m(H) \ge 0$이므로 potential은 nonnegative다. 따라서 총 amortized cost upper bound는 총 actual cost upper bound로 이어진다.

#### Maximum degree $D(n)$

이 장의 이후 분석은 $n$-node Fibonacci heap에서 어떤 node도 degree가 $D(n)$을 넘지 않는다는 upper bound를 사용한다. Mergeable-heap operations만 있으면 $D(n) \le \lfloor \lg n \rfloor$임을 보일 수 있다. `DECREASE-KEY`와 `DELETE`까지 지원하면 tree가 더 느슨해지지만, 19.3과 19.4에서 여전히 $D(n) = O(\lg n)$임을 증명한다.

이 bound가 중요한 이유는 `EXTRACT-MIN`에서 같은 degree의 roots를 link하며 consolidation하기 때문이다. Degree 종류가 $O(\lg n)$개로 제한되어야 consolidation array도 작고, `EXTRACT-MIN`의 amortized cost도 $O(\lg n)$으로 유지된다.

### 19.2 Mergeable-heap operations

Fibonacci heap의 mergeable-heap operations는 가능한 한 일을 미룬다. `INSERT`는 node를 root list에 붙이기만 하므로 constant time이다. 이 방식으로 `k`개를 연속 삽입하면 heap은 root list에 singleton trees가 `k`개 있는 느슨한 상태가 된다. 대신 다음 `EXTRACT-MIN`에서 minimum root를 제거하고 새 minimum을 찾기 위해 root list를 훑어야 하므로, 그때 root들을 consolidate해 root list 크기를 줄인다.

이 trade-off를 한 문장으로 정리하면 다음과 같다.

$$
\begin{aligned}
\text{cheap now:} INSERT/UNION keep many roots \\
\text{pay later:} EXTRACT-MIN consolidates roots by degree
\end{aligned}
$$

`EXTRACT-MIN`이 끝난 뒤에는 root list 안의 roots가 서로 다른 degree를 갖도록 만든다. 그러면 root list 크기가 최대 `D(n) + 1`로 제한된다.

#### Creating a new Fibonacci heap: `MAKE-FIB-HEAP`

Empty Fibonacci heap은 $H.n = 0$, $H.\min = NIL$인 heap object다. Root list가 없으므로 $t(H)=0$, marked nodes도 없으므로 $m(H)=0$, 따라서 $\Phi(H)=0$이다.

$$
\begin{aligned}
MAKE-FIB-HEAP() \\
    \text{allocate heap object H} \\
    H.n &= 0 \\
    H.\min &= NIL \\
    \text{return H}
\end{aligned}
$$

Actual cost는 $O(1)$이고 potential 변화도 0이므로 amortized cost도 $O(1)$이다.

#### Inserting a node: `FIB-HEAP-INSERT`

`FIB-HEAP-INSERT(H, x)`는 이미 allocate되고 key가 채워진 node `x`를 heap `H`에 넣는다. 핵심은 `x`를 singleton tree root로 만들어 root list에 추가하는 것이다.

```text
FIB-HEAP-INSERT(H, x)
1  x.degree = 0
2  x.p = NIL
3  x.child = NIL
4  x.mark = FALSE
5  if H.min == NIL
6      create a root list for H containing just x
7      H.min = x
8  else insert x into H's root list
9      if x.key < H.min.key
10         H.min = x
11 H.n = H.n + 1
```

Figure 19.3은 key 21을 가진 node가 새 singleton tree가 되어 root list에 붙는 모습을 보여 준다. Existing tree 구조는 건드리지 않는다. 필요하면 `H.min`만 갱신한다.

![Figure 19.3](@/assets/images/cs-algorithm-104-figure-19-3-page-532.png)
*Figure 19.3 · PDF p. 532 · 새 node를 singleton tree로 만들어 Fibonacci heap root list에 삽입*

Potential 변화는 단순하다. Insertion 후 tree 수가 하나 늘고 marked nodes 수는 그대로다.

$$
\begin{aligned}
t(H') &= t(H) + 1 \\
m(H') &= m(H) \\
\Delta\Phi &= 1
\end{aligned}
$$

Actual cost가 $O(1)$이고 potential 증가도 1이므로 amortized cost는 $O(1)$이다. 여기서 중요한 점은 새 node를 기존 tree에 붙여 heap shape을 정리하지 않는다는 것이다. 정리는 `EXTRACT-MIN`으로 미룬다.

#### Finding the minimum node: `FIB-HEAP-MINIMUM`

Minimum node는 `H.min` pointer가 직접 가리킨다. 따라서 $MINIMUM(H)$는 pointer를 반환하기만 하면 된다.

| 비용 | 값 |
|---|---:|
| Actual cost | $O(1)$ |
| Potential change | `0` |
| Amortized cost | $O(1)$ |

이 constant time이 가능한 이유는 모든 operation이 `H.min`을 정확히 유지하기 때문이다. Root list 안의 trees가 정렬되어 있지 않아도 minimum pointer 하나만 있으면 충분하다.

#### Uniting two Fibonacci heaps: `FIB-HEAP-UNION`

`FIB-HEAP-UNION(H1, H2)`는 두 heap의 root lists를 concatenate하고 minimum pointer를 더 작은 쪽으로 설정한다. Operation 이후 `H1`, `H2` object는 destroyed된 것으로 보고 새 heap `H`만 사용한다.

```text
FIB-HEAP-UNION(H1, H2)
1  H = MAKE-FIB-HEAP()
2  H.min = H1.min
3  concatenate the root list of H2 with the root list of H
4  if H1.min == NIL or (H2.min != NIL and H2.min.key < H1.min.key)
5      H.min = H2.min
6  H.n = H1.n + H2.n
7  return H
```

Root list concatenation이 circular doubly linked list에서 $O(1)$이므로 actual cost는 $O(1)$이다. 모든 roots는 그대로 roots로 남으므로:

$$
\begin{aligned}
t(H) &= t(H1) + t(H2) \\
m(H) &= m(H1) + m(H2) \\
\Phi(H) - (\Phi(H1) + \Phi(H2)) &= 0
\end{aligned}
$$

따라서 amortized cost도 $O(1)$이다. Binary heap에서 `UNION`이 두 arrays를 합친 뒤 heapify해야 해서 $\Theta(n)$인 것과 대비된다.

#### 단순 operations가 남기는 빚

`MAKE-FIB-HEAP`, `INSERT`, `MINIMUM`, `UNION`은 모두 매우 싸다. 하지만 이들은 root list에 많은 trees를 남긴다. Potential function의 $t(H)$ 항은 이 “나중에 consolidate해야 할 roots”를 빚처럼 기록한다. 다음 구간의 `EXTRACT-MIN`은 이 빚을 실제로 갚는 operation이다.

#### Extracting the minimum node: `FIB-HEAP-EXTRACT-MIN`

`FIB-HEAP-EXTRACT-MIN(H)`은 이 절에서 가장 복잡한 mergeable-heap operation이다. Minimum root $z = H.\min$을 제거해야 하는데, `z`의 children은 모두 `z`보다 key가 크거나 같으므로 root list로 올려도 min-heap order가 깨지지 않는다. 그 다음 root list에 같은 degree를 가진 roots가 여러 개 생길 수 있으므로 `CONSOLIDATE`로 degree별 하나씩만 남기도록 link한다.

```text
FIB-HEAP-EXTRACT-MIN(H)
1  z = H.min
2  if z != NIL
3      for each child x of z
4          add x to the root list of H
5          x.p = NIL
6      remove z from the root list of H
7      if z == z.right
8          H.min = NIL
9      else H.min = z.right
10         CONSOLIDATE(H)
11     H.n = H.n - 1
12 return z
```

동작은 세 단계로 보면 깔끔하다.

| 단계 | 동작 | 이유 |
|---|---|---|
| children promotion | minimum node `z`의 children을 root list로 올리고 parent를 `NIL`로 설정 | `z`가 사라져도 subtrees를 보존 |
| remove min root | root list에서 `z` 제거 | 실제 minimum 삭제 |
| consolidation | 같은 degree의 roots를 반복적으로 link | root list 크기를 $D(n)+1$ 이하로 축소 |

Figure 19.4는 `EXTRACT-MIN`의 전체 흐름을 보여 준다. 먼저 minimum node가 제거되고 그 children이 roots가 된다. 이후 같은 degree의 roots가 발견될 때마다 더 작은 key를 가진 root가 parent가 되도록 link한다.

![Figure 19.4](@/assets/images/cs-algorithm-106-figure-19-4-page-535.png)
*Figure 19.4 · PDF p. 535 · `FIB-HEAP-EXTRACT-MIN`에서 minimum 제거 후 roots를 degree별로 link하는 과정*

Figure 19.4의 이어지는 부분은 consolidation이 끝난 뒤 array `A`에서 root list를 재구성하고 새 `H.min`을 찾는 마지막 단계를 보여 준다.

![Figure 19.4 continued](@/assets/images/cs-algorithm-107-figure-19-4-page-536.png)
*Figure 19.4 · PDF p. 536 · `CONSOLIDATE` 완료 후 root list 재구성과 새 `H.min` 결정*

#### Consolidation: degree가 같은 roots를 하나로 합치기

$CONSOLIDATE(H)$는 auxiliary array $A[0..D(H.n)]$를 사용한다. $A[d]$가 어떤 root `y`를 가리키면, 현재 처리된 roots 중 degree `d`를 가진 root가 `y`라는 뜻이다.

```text
CONSOLIDATE(H)
1  let A[0..D(H.n)] be a new array
2  for i = 0 to D(H.n)
3      A[i] = NIL
4  for each node w in the root list of H
5      x = w
6      d = x.degree
7      while A[d] != NIL
8          y = A[d]              // another root with same degree
9          if x.key > y.key
10             exchange x with y
11         FIB-HEAP-LINK(H, y, x)
12         A[d] = NIL
13         d = d + 1
14     A[d] = x
15 H.min = NIL
16 for i = 0 to D(H.n)
17     if A[i] != NIL
18         add A[i] to the root list
19         update H.min if needed
```

핵심 loop invariant는 다음이다.

$$
\text{At the start of each while-loop iteration, d} = x.degree.
$$

$A[d]$에 이미 root `y`가 있으면 `x`와 `y`는 같은 degree다. 더 작은 key를 가진 root가 parent가 되어야 min-heap order가 유지되므로, 필요하면 `x`와 `y`를 교환한다. 그 다음 `FIB-HEAP-LINK(H, y, x)`를 호출해 `y`를 `x`의 child로 만든다. 이때 `x.degree`가 1 증가하므로 `d`도 1 증가시켜 invariant를 유지한다. 이 과정을 같은 degree의 root가 더 이상 없을 때까지 반복한다.

```text
FIB-HEAP-LINK(H, y, x)
1  remove y from the root list of H
2  make y a child of x, incrementing x.degree
3  y.mark = FALSE
```

Link된 node `y`는 새 parent의 child가 되므로 mark를 `FALSE`로 clear한다. Mark는 “마지막으로 child가 된 뒤 child를 잃었는가”를 나타내므로, 새로 child가 된 순간에는 다시 안정 상태로 시작한다.

#### 왜 `EXTRACT-MIN`의 amortized cost가 $O(D(n))$인가

`EXTRACT-MIN`의 actual work는 두 부분으로 나뉜다.

| Actual work | 크기 |
|---|---:|
| minimum node의 children을 root list로 올림 | $O(D(n))$ |
| `CONSOLIDATE`의 array 초기화/재구성 | $O(D(n))$ |
| root list 전체 처리와 links | $O(D(n) + t(H))$ |

`CONSOLIDATE` 호출 직전 root list 크기는 최대 `D(n) + t(H) - 1`이다. 원래 roots $t(H)$개 중 minimum root 하나를 제거하고, 그 children 최대 $D(n)$개를 root list에 추가하기 때문이다. While loop에서 한 번 link할 때마다 root 수가 하나 줄어들므로, 전체 while-loop iterations 수는 root 수에 의해 aggregate하게 bound된다.

따라서 actual cost는:

$$
O(D(n) + t(H))
$$

Potential 변화는 이 비용 중 $t(H)$ 부분을 상쇄한다. Operation 전 potential은:

$$
\Phi_{before} = t(H) + 2m(H)
$$

Operation 후에는 root list가 degree별 하나씩만 남으므로 roots 수가 최대 $D(n)+1$이고, 이 operation은 node를 mark하지 않는다.

$$
\Phi_{after} \le (D(n) + 1) + 2m(H)
$$

따라서 amortized cost는:

$$
\begin{aligned}
O(D(n) + t(H)) + \Phi_{after} - \Phi_{before} \\
\le O(D(n) + t(H)) + (D(n)+1+2m(H)) - (t(H)+2m(H)) \\
= O(D(n)) + O(t(H)) - t(H) \\
= O(D(n))
\end{aligned}
$$

Potential 단위를 충분히 크게 잡으면 $O(t(H))$의 숨은 상수를 $-t(H)$ 감소가 지불한다. 직관적으로 각 link는 root 수를 1 줄이고, root 하나가 사라지면서 potential도 줄어 그 link 비용을 낸다. 19.4에서 $D(n)=O(\lg n)$임을 보이므로 최종적으로 `EXTRACT-MIN`의 amortized cost는 $O(\lg n)$이다.

### 19.3 Decreasing a key and deleting a node

이 절은 Fibonacci heap의 대표 장점인 `DECREASE-KEY`를 다룬다. 목표는 `FIB-HEAP-DECREASE-KEY`를 $O(1)$ amortized time에 수행하고, 이를 이용해 `FIB-HEAP-DELETE`를 $O(D(n))$ amortized time에 수행하는 것이다.

#### Decreasing a key: `FIB-HEAP-DECREASE-KEY`

Key를 낮추면 min-heap order가 깨질 수 있다. Node `x`의 key가 parent `y`의 key보다 작아지면 `x`를 parent에서 떼어 root list로 올린다. 이것이 `CUT`이다. 그런데 `x`가 잘려 나간 뒤 parent `y`도 이미 이전에 child를 하나 잃은 상태였다면, `y`도 너무 불안정해졌다고 보고 parent에서 잘라 root로 올린다. 이것이 `CASCADING-CUT`이다.

```text
FIB-HEAP-DECREASE-KEY(H, x, k)
1  if k > x.key
2      error "new key is greater than current key"
3  x.key = k
4  y = x.p
5  if y != NIL and x.key < y.key
6      CUT(H, x, y)
7      CASCADING-CUT(H, y)
8  if x.key < H.min.key
9      H.min = x
```

`x`가 root이거나 새 key가 parent key보다 작지 않으면 heap order가 유지되므로 구조 변화가 없다. Heap order가 깨진 경우에만 `x`를 cut한다. 마지막에는 key가 실제로 감소한 node가 `x`뿐이므로, 새 minimum은 기존 `H.min` 또는 `x`다.

#### `CUT`와 `CASCADING-CUT`

```text
CUT(H, x, y)
1  remove x from the child list of y, decrementing y.degree
2  add x to the root list of H
3  x.p = NIL
4  x.mark = FALSE

CASCADING-CUT(H, y)
1  z = y.p
2  if z != NIL
3      if y.mark == FALSE
4          y.mark = TRUE
5      else CUT(H, y, z)
6           CASCADING-CUT(H, z)
```

`mark`는 node가 마지막으로 다른 node의 child가 된 뒤 child를 잃은 적이 있는지 기록한다.

| 상태 | 의미 | 다음 child loss 때 |
|---|---|---|
| $mark = FALSE$ | 아직 child를 잃지 않았거나 root/새 child 상태 | mark를 `TRUE`로 바꾸고 멈춤 |
| $mark = TRUE$ | 이미 child를 하나 잃은 상태 | node를 cut하고 parent로 cascading |

이 규칙은 각 nonroot node가 child를 하나 잃는 것은 허용하지만, 두 번째 child를 잃으면 root로 올린다는 뜻이다. 이렇게 해야 node degree가 너무 커지는 것을 막을 수 있고, 19.4의 maximum degree bound가 성립한다.

Figure 19.5는 두 번의 `FIB-HEAP-DECREASE-KEY`를 보여 준다. 첫 번째는 key 46을 15로 줄여 해당 node만 root가 되고 parent 24가 marked된다. 두 번째는 key 35를 5로 줄이며 node 26과 24가 이미 marked 상태라 연쇄적으로 cut된다.

![Figure 19.5](@/assets/images/cs-algorithm-108-figure-19-5-page-542.png)
*Figure 19.5 · PDF p. 542 · `DECREASE-KEY`에서 cut과 cascading cut이 root list와 mark 상태를 바꾸는 과정*

#### 왜 cascading cut이 $O(1)$ amortized인가

Actual cost는 cascading cut 호출 수에 비례한다. 어떤 `DECREASE-KEY`가 `c`번의 `CASCADING-CUT` 호출을 일으킨다고 하자. 각 호출 자체는 recursive call을 제외하면 $O(1)$이므로 actual cost는 $O(c)$다.

Potential 변화를 보면 이 비용이 상쇄된다. Operation 전 heap을 `H`라고 하자.

| 변화 | 효과 |
|---|---|
| line 6의 `CUT` | `x`가 새 root가 되어 tree 수 +1 |
| cascading cuts 중 마지막 전까지 | marked nodes가 잘려 root가 되고 mark가 clear됨 |
| 마지막 cascading call | root에서 멈추거나 unmarked node 하나를 mark할 수 있음 |

CLRS의 계산은 operation 후 heap이 최대 다음 상태가 된다고 본다.

$$
\begin{aligned}
\text{trees:} t(H) + c \\
\text{marked nodes:} at most m(H) - c + 2
\end{aligned}
$$

따라서 potential 변화는:

$$
\begin{aligned}
\Delta\Phi &\le ((t(H) + c) + 2(m(H) - c + 2)) - (t(H) + 2m(H)) \\
    &= 4 - c
\end{aligned}
$$

Amortized cost는:

$$
O(c) + 4 - c = O(1)
$$

여기서 `2m(H)`의 coefficient 2가 중요하다. Marked node가 cascading cut으로 잘릴 때 mark가 clear되며 potential이 2 감소한다. 그중 한 unit은 실제 cut 비용을 내고, 다른 한 unit은 그 node가 root가 되어 $t(H)$가 1 증가하는 potential 비용을 보상한다.

#### Deleting a node: `FIB-HEAP-DELETE`

임의 node `x`를 삭제하려면 `x`의 key를 모든 key보다 작은 값으로 낮춘 뒤 extract-min을 호출하면 된다. CLRS는 현재 heap에 없는 특수한 key value $-\infty$를 가정한다.

```text
FIB-HEAP-DELETE(H, x)
1  FIB-HEAP-DECREASE-KEY(H, x, -∞)
2  FIB-HEAP-EXTRACT-MIN(H)
```

`DECREASE-KEY`로 `x`를 minimum node로 만들고, `EXTRACT-MIN`이 그 node를 제거한다. 비용은:

$$
O(1) + O(D(n)) = O(D(n))
$$

19.4에서 $D(n)=O(\lg n)$임을 보이면 `FIB-HEAP-DELETE`의 amortized time은 $O(\lg n)$이 된다.

#### Marked root는 왜 분석을 깨지 않는가

Exercise 19.3-1은 marked root를 묻는다. Root가 marked될 수 있는 경로가 있더라도 분석에는 문제가 없다. Mark의 의미는 “parent가 있는 node가 child를 잃었는가”에 중요하고, root는 parent가 없으므로 cascading cut 대상이 아니다. Potential에 marked root가 포함되면 오히려 potential을 더 크게 잡는 보수적 분석이 된다.

### 19.4 Bounding the maximum degree

`EXTRACT-MIN`과 `DELETE`의 amortized cost를 $O(\lg n)$으로 끝내려면 $D(n)=O(\lg n)$임을 보여야 한다. CLRS는 더 구체적으로, golden ratio $\phi = (1 + \sqrt{5}) / 2$에 대해 다음을 보인다.

$$
D(n) \le \lfloor log_\phi n \rfloor
$$

핵심 전략은 어떤 node `x`의 subtree size가 degree에 대해 exponential하게 커진다는 것을 증명하는 것이다. $size(x)$를 node `x` 자신을 포함한 subtree의 node 수라고 하자. 목표는:

$$
size(x) \ge \phi^{x.degree}
$$

그러면 $n \ge size(x) \ge \phi^{k}$이므로 degree `k`는 $log_\phi n$을 넘을 수 없다.

#### Lemma 19.1: 나중에 붙은 child일수록 degree lower bound가 크다

Node `x`의 degree가 `k`이고, children을 `x`에 link된 순서대로 `y_1, y_2, ..., y_k`라고 하자. 그러면:

$$
\begin{aligned}
y_{1}.degree &\ge 0 \\
y_{i}.degree &\ge i - 2 for i = 2, 3, \ldots, k
\end{aligned}
$$

이유는 $y_{i}$가 `x`에 link될 당시, `x`는 이미 `y_1, ..., y_{i-1}`를 children으로 가지고 있었으므로 $x.degree \ge i-1$이었다. `CONSOLIDATE`는 같은 degree의 roots만 link하므로, 그 당시 $y_{i}.degree$도 최소 $i-1$이었다. 이후 $y_{i}$는 child를 잃을 수 있지만, 두 번째 child를 잃는 순간 cascading cut으로 `x`에서 잘려 나간다. 따라서 현재까지 child를 많아야 하나 잃었고, $y_{i}.degree \ge i-2$가 유지된다.

이 lemma가 Fibonacci heap의 느슨한 구조를 통제한다. Node가 child를 하나 잃는 것은 허용되지만 두 개를 잃으면 잘리므로, 높은 degree node의 children도 어느 정도 큰 subtrees를 가져야 한다.

#### Fibonacci numbers와 golden ratio

Fibonacci numbers는 다음 recurrence로 정의된다.

$$
\begin{aligned}
F_{0} &= 0 \\
F_{1} &= 1 \\
F_{k} &= F_{k-1} + F_{k-2} for k \ge 2
\end{aligned}
$$

CLRS는 두 가지 보조 lemma를 사용한다.

$$
\begin{aligned}
F_{k+2} &= 1 + \sum_{i=0}^{k} F_{i} (Lemma 19.2) \\
F_{k+2} &\ge \phi^{k} (Lemma 19.3)
\end{aligned}
$$

첫 번째 식은 Fibonacci recurrence를 누적합 형태로 바꾼 것이고, 두 번째 식은 Fibonacci numbers가 golden ratio의 거듭제곱만큼 성장함을 말한다.

#### Lemma 19.4: degree k node의 subtree는 최소 $F_{k+2}$ 크기

$s_{k}$를 degree `k`인 node가 가질 수 있는 최소 subtree size라고 하자. 기본값은:

$$
\begin{aligned}
s_{0} &= 1 \\
s_{1} &= 2
\end{aligned}
$$

Degree `k`인 node `z`의 children을 link 순서대로 `y_1, ..., y_k`라고 하자. `z` 자신과 첫 child $y_{1}$만 세어도 2 nodes가 있고, Lemma 19.1에 의해 $i \ge 2$인 child $y_{i}$는 degree가 적어도 $i-2$다. 따라서:

$$
s_{k} \ge 2 + \sum_{i=2}^{k} s_{i-2}
$$

Induction으로 $s_{i} \ge F_{i+2}$를 가정하면:

$$
\begin{aligned}
s_{k} &\ge 2 + \sum_{i=2}^{k} s_{i-2} \\
    &\ge 2 + \sum_{i=2}^{k} F_{i} \\
    &= 1 + \sum_{i=0}^{k} F_{i} \\
    &= F_{k+2} \\
    &\ge \phi^{k}
\end{aligned}
$$

따라서 degree `k`인 어떤 node `x`에 대해서도:

$$
size(x) \ge F_{k+2} \ge \phi^{k}
$$

이 결과가 “Fibonacci heap”이라는 이름의 핵심이다. Degree와 subtree size의 최소 관계가 Fibonacci numbers로 bound된다.

#### Corollary 19.5: $D(n) = O(\lg n)$

$n$-node Fibonacci heap에서 어떤 node $x$의 degree를 $k$라고 하자. Lemma 19.4에 의해:

$$
n \ge size(x) \ge \phi^{k}
$$

양변에 base-$\phi$ logarithm을 취하면:

$$
k \le log_\phi n
$$

따라서 maximum degree $D(n)$은 $O(\lg n)$이다. 이 bound를 19.2와 19.3의 결과에 대입하면:

| Operation | 이전 bound | $D(n)=O(\lg n)$ 적용 후 |
|---|---:|---:|
| `FIB-HEAP-EXTRACT-MIN` | $O(D(n))$ amortized | $O(\lg n)$ amortized |
| `FIB-HEAP-DELETE` | $O(D(n))$ amortized | $O(\lg n)$ amortized |
| `FIB-HEAP-DECREASE-KEY` | $O(1)$ amortized | 그대로 $O(1)$ |

#### Binomial trees와의 연결

Problem 19-2는 `binomial tree`와 `binomial heap`을 다룬다. Figure 19.6은 binomial tree $B_{k}$의 recursive definition과 $B_{0}$부터 $B_{4}$까지의 형태를 보여 준다.

![Figure 19.6](@/assets/images/cs-algorithm-109-figure-19-6-page-549.png)
*Figure 19.6 · PDF p. 549 · binomial tree $B_{k}$의 recursive 구조와 degree/height 관계*

Binomial tree $B_{k}$는 두 개의 $B_{k-1}$을 link해 만들며, root degree는 $k$, node 수는 $2^{k}$, height는 $k$다. Binomial heap은 degree별 binomial tree가 최대 하나씩 있는 heap이다. 이는 `EXTRACT-MIN`의 consolidation 결과와 닮아 있다.

Fibonacci heap과 binomial heap의 차이는 “얼마나 즉시 정리하느냐”다.

| 구조 | 정리 방식 | 결과 |
|---|---|---|
| binomial heap | operations가 root degrees를 즉시 정리 | worst-case $O(\lg n)$ 중심 |
| Fibonacci heap | `INSERT`, `UNION`, `DECREASE-KEY`에서 정리를 미룸 | amortized $O(1)$ operations 확보 |
| McGee heap 문제 | insertion/union 끝에 매번 consolidate | lazy benefit이 줄고 worst-case 성격이 강해짐 |

#### Problems와 chapter notes의 연결

| 항목 | 연결되는 아이디어 |
|---|---|
| `19-1 Alternative implementation of deletion` | 직접 child list를 root list에 붙이는 삭제 변형이 실제로 asymptotically 좋아지지 않는 이유를 potential로 검증 |
| `19-2 Binomial trees and binomial heaps` | Fibonacci heap의 consolidation 구조와 binomial heap의 degree uniqueness 관계 |
| `19-3 More Fibonacci-heap operations` | `CHANGE-KEY`, `PRUNE`을 추가하면서 amortized bounds를 유지하는 augmentation |
| `19-4 2-3-4 heaps` | Chapter 18의 2-3-4 tree 아이디어를 mergeable heap operations에 적용 |

Chapter notes는 Fibonacci heap이 Fredman과 Tarjan에 의해 도입되었고, shortest paths, minimum spanning tree, weighted bipartite matching 등 여러 graph problems의 이론적 개선에 쓰였음을 언급한다. 이후 `relaxed heaps`는 Fibonacci heap의 대안으로 제시되었고, 일부 변형은 `DECREASE-KEY`를 worst-case $O(1)$로, `EXTRACT-MIN`과 `DELETE`를 worst-case $O(\lg n)$으로 제공한다.

## 연결 관계

| 연결 대상 | 관계 |
|---|---|
| Chapter 6 `Binary Heaps` | 같은 priority queue ADT를 더 단순한 structure와 worst-case 중심으로 구현 |
| Chapter 17 `Amortized Analysis` | $\Phi(H)=t(H)+2m(H)$로 delayed work를 지불하는 대표 사례 |
| Chapter 18 `B-Trees` | advanced data structures에서 구조 invariant와 operation cost를 함께 설계하는 흐름 |
| Chapter 23 `Minimum Spanning Trees` | `DECREASE-KEY`가 많은 MST 알고리즘의 이론적 running time 개선에 사용 |
| Chapter 24 `Single-Source Shortest Paths` | edge relaxation마다 `DECREASE-KEY`가 발생할 수 있어 Fibonacci heap bound가 중요 |

## 오해하기 쉬운 내용

| 오해 | 정정 |
|---|---|
| Fibonacci heap 연산은 모두 worst-case로 빠르다 | Figure 19.1의 주요 개선은 amortized bounds다 |
| `INSERT`가 빠른 이유는 tree 위치를 똑똑하게 찾기 때문이다 | 그냥 singleton root로 root list에 붙이고 정리를 미루기 때문이다 |
| `UNION`이 빠른 이유는 heaps를 재구성하기 때문이다 | root lists를 $O(1)$에 concatenate하기 때문이다 |
| `DECREASE-KEY`는 key를 찾아서 줄인다 | node pointer/handle이 input으로 주어져야 한다 |
| Mark는 모든 child loss 횟수를 저장한다 | child를 하나 잃었는지만 boolean으로 저장하고, 두 번째 loss에서 cut한다 |
| Fibonacci heap의 height가 항상 $O(\lg n)$이다 | degree는 $O(\lg n)$이지만 height는 linear chain이 될 수 있다 |
| $D(n)=O(\lg n)$은 binomial heap과 같은 완전한 구조 때문만이다 | cascading cut rule이 subtree size를 Fibonacci-growth로 유지하기 때문에 성립한다 |

## 면접 질문

1. Fibonacci heap이 binary heap보다 유리한 operation과 그 이유를 설명하라.
2. Fibonacci heap에서 root list와 child list를 circular doubly linked list로 두는 이유는 무엇인가?
3. Potential function $\Phi(H)=t(H)+2m(H)$에서 $t(H)$와 $m(H)$가 각각 어떤 delayed work를 나타내는가?
4. `FIB-HEAP-INSERT`와 `FIB-HEAP-UNION`이 $O(1)$ amortized time인 이유를 설명하라.
5. `FIB-HEAP-EXTRACT-MIN`에서 `CONSOLIDATE`가 degree별 roots를 하나만 남기는 이유는 무엇인가?
6. `FIB-HEAP-LINK`에서 더 작은 key를 가진 root를 parent로 두어야 하는 이유는 무엇인가?
7. `DECREASE-KEY`에서 `CUT`과 `CASCADING-CUT`이 필요한 상황을 설명하라.
8. Mark bit가 왜 boolean 하나로 충분하며, 왜 potential에서 coefficient 2가 붙는가?
9. `FIB-HEAP-DELETE`가 `DECREASE-KEY`와 `EXTRACT-MIN`으로 구현되는 이유를 설명하라.
10. Maximum degree $D(n)$이 $O(\lg n)$임을 Fibonacci numbers와 연결해 설명하라.
