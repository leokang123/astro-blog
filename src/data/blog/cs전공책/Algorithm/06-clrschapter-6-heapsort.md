---
title: "Chapter 6. Heapsort"
order: 6
pubDatetime: 2026-05-14T00:06:00+09:00
modDatetime: 2026-05-14T00:06:00+09:00
description: "CLRS 알고리즘 정리: Chapter 6. Heapsort"
tags:
  - "Algorithm"
  - "CS"
  - "CLRS"
---

## 개요

Chapter 6은 `heapsort`와 그 기반 자료구조인 `heap`을 다룬다. Heapsort는 `merge sort`처럼 $O(n \lg n)$ running time을 가지면서, `insertion sort`처럼 in place로 정렬한다. 즉 asymptotic worst-case time과 공간 사용 면에서 앞서 본 두 sorting algorithm의 장점을 결합한다.

이 장의 더 큰 의미는 알고리즘 설계에서 자료구조(data structure)를 적극적으로 사용한다는 점이다. `heap`은 heapsort뿐 아니라 `priority queue`를 효율적으로 구현하는 데 쓰이며, 이후 그래프 알고리즘과 고급 heap 구조에서 반복적으로 등장한다. 여기서 말하는 heap은 garbage-collected storage의 heap이 아니라, complete binary tree로 볼 수 있는 array-based data structure다.

## 핵심 개념

| 용어 | 의미 | 검색 키워드 |
| --- | --- | --- |
| binary heap | array로 저장하지만 nearly complete binary tree로 볼 수 있는 자료구조 | heap, complete binary tree |
| max-heap | 모든 node가 children보다 크거나 같은 heap | max-heap property |
| min-heap | 모든 node가 children보다 작거나 같은 heap | min-heap property |
| `A.length` | array 전체 원소 수 | array length |
| $A.heap-size$ | array 안에서 현재 heap으로 유효한 prefix 길이 | heap-size |
| `MAX-HEAPIFY` | 한 node에서 깨진 max-heap property를 아래로 내려 보내며 복구 | float down |
| `BUILD-MAX-HEAP` | unordered array를 max-heap으로 변환 | build heap |
| `HEAPSORT` | max-heap root를 끝으로 보내며 in-place 정렬 | in-place sorting |
| priority queue | priority가 가장 높은 element를 빠르게 꺼내는 ADT | max-priority queue, min-priority queue |

## 세부 정리

### 6.1 Heaps

#### Heap의 array/tree 표현

`binary heap`은 array object지만, 구조적으로는 `nearly complete binary tree`로 볼 수 있다. tree는 lowest level을 제외한 모든 level이 꽉 차 있고, lowest level은 왼쪽부터 차례로 채워진다. 각 tree node는 array element 하나에 대응된다.

![Figure 6.1](@/assets/images/cs-algorithm-016-figure-6-1-page-173.png)
*Figure 6.1 · PDF p. 173 · max-heap을 binary tree와 array로 동시에 표현한 예*

heap array `A`에는 두 가지 크기 개념이 있다.

- `A.length`: array에 저장 가능한 전체 element 수
- $A.heap-size$: 현재 heap으로 유효한 element 수

따라서 $A[1..A.length]$에 값이 있어도 heap으로 다루는 부분은 $A[1..A.heap-size]$뿐이다. 항상

$$
0 \le A.heap-size \le A.length
$$

가 성립한다. heapsort에서는 같은 array 안에서 heap 영역과 이미 정렬된 영역을 나누기 때문에 이 구분이 특히 중요하다.

1-indexed array 표현에서 root는 $A[1]$이고, index `i`의 parent/children은 다음처럼 계산한다.

$$
\begin{aligned}
PARENT(i) &= \lfloor i/2 \rfloor \\
LEFT(i) &= 2i \\
RIGHT(i) &= 2i + 1
\end{aligned}
$$

이 계산은 binary representation에서 shift 연산으로 빠르게 구현할 수 있다. 좋은 heapsort 구현은 이 함수들을 macro나 inline procedure로 처리해 constant factor를 줄인다.

#### Max-heap과 min-heap

`max-heap property`는 root를 제외한 모든 node `i`에 대해 다음 조건이 성립한다는 뜻이다.

$$
A[PARENT(i)] \ge A[i]
$$

즉 어떤 node의 값은 parent보다 클 수 없다. 따라서 max-heap에서 가장 큰 element는 항상 root $A[1]$에 있고, 임의의 subtree에서도 subtree root가 그 subtree 안의 maximum이다.

반대로 `min-heap property`는

$$
A[PARENT(i)] \le A[i]
$$

이고, 가장 작은 element가 root에 있다.

Heapsort는 max-heap을 사용한다. Max-priority queue도 max-heap으로 구현하고, min-priority queue는 보통 min-heap으로 구현한다. 원문은 둘 중 하나에만 적용되는 성질은 max/min을 명확히 붙이고, 둘 다에 적용되는 성질은 그냥 heap이라고 부른다.

#### Heap height와 연산 시간

heap에서 node의 height는 그 node에서 leaf까지 내려가는 longest simple downward path의 edge 수다. heap의 height는 root의 height다. `n`개 element를 가진 heap은 complete binary tree 기반이므로 height가

$$
\Theta(\lg n)
$$

이다. heap의 핵심 연산들은 대개 root-to-leaf 또는 leaf-to-root path를 따라 움직이므로 $O(\lg n)$에 수행된다.

이 장의 주요 procedure는 다음 흐름으로 연결된다.

| procedure | 역할 | 시간 |
| --- | --- | --- |
| `MAX-HEAPIFY` | 한 node에서 max-heap property를 복구 | $O(\lg n)$ |
| `BUILD-MAX-HEAP` | unordered array를 max-heap으로 변환 | $O(n)$ |
| `HEAPSORT` | max-heap을 이용해 array를 in-place 정렬 | $O(n \lg n)$ |
| `HEAP-MAXIMUM` | priority queue의 maximum 반환 | $O(1)$ |
| `HEAP-EXTRACT-MAX` | maximum 제거 및 heap 복구 | $O(\lg n)$ |
| `HEAP-INCREASE-KEY` | key 증가 후 위로 올려 heap 복구 | $O(\lg n)$ |
| `MAX-HEAP-INSERT` | 새 key 삽입 | $O(\lg n)$ |

#### Leaves의 위치

array representation에서 `n`개 element를 가진 heap의 leaves는

$$
\lfloor n/2 \rfloor + 1, \lfloor n/2 \rfloor + 2, \ldots, n
$$

index에 위치한다. 이 사실은 `BUILD-MAX-HEAP`이 왜 $\lfloor n/2 \rfloor$부터 시작하는지 설명한다. leaves는 children이 없으므로 이미 trivial heap이다.

### 6.2 Maintaining the heap property

#### MAX-HEAPIFY가 하는 일

`MAX-HEAPIFY(A, i)`는 heap 알고리즘의 핵심 subroutine이다. 호출 전제는 다음과 같다.

- $LEFT(i)$를 root로 하는 subtree는 이미 max-heap이다.
- $RIGHT(i)$를 root로 하는 subtree도 이미 max-heap이다.
- 다만 $A[i]$가 children보다 작아서 node `i`에서 max-heap property가 깨졌을 수 있다.

즉 문제는 한 node에서만 발생했고, 그 아래 양쪽 subtree는 이미 정상이라는 구조다. `MAX-HEAPIFY`는 $A[i]$의 값을 아래로 “float down”시켜 subtree rooted at `i` 전체가 max-heap이 되도록 만든다.

```text
MAX-HEAPIFY(A, i)
1  l = LEFT(i)
2  r = RIGHT(i)
3  if l <= A.heap-size and A[l] > A[i]
4      largest = l
5  else largest = i
6  if r <= A.heap-size and A[r] > A[largest]
7      largest = r
8  if largest != i
9      exchange A[i] with A[largest]
10     MAX-HEAPIFY(A, largest)
```

절차는 $A[i]$, $A[LEFT(i)]$, $A[RIGHT(i)]$ 중 가장 큰 값을 찾아 그 index를 `largest`에 둔다. `largest == i`이면 node `i`는 이미 children보다 크거나 같으므로 subtree가 max-heap이고 종료한다. 그렇지 않으면 더 큰 child와 $A[i]$를 swap한다.

swap 후에는 원래 $A[i]$였던 작은 값이 child 위치로 내려갔기 때문에, 그 child subtree에서 다시 max-heap property가 깨질 수 있다. 그래서 `MAX-HEAPIFY(A, largest)`를 recursive하게 호출한다.

![Figure 6.2](@/assets/images/cs-algorithm-017-figure-6-2-page-176.png)
*Figure 6.2 · PDF p. 176 · `MAX-HEAPIFY(A,2)`가 값을 아래로 내리며 max-heap property를 복구하는 과정*

Figure 6.2에서는 index `2`의 값이 children보다 작아 property를 위반한다. 먼저 더 큰 child와 swap해 node 2를 고치지만, 그 swap 때문에 node 4에서 다시 문제가 생긴다. 다시 recursive call로 node 4를 고치면 전체 subtree가 max-heap이 된다.

#### MAX-HEAPIFY의 시간복잡도

한 단계에서 하는 일은 $A[i]$, left child, right child를 비교하고 필요한 경우 swap하는 $\Theta(1)$ work다. recursive call은 children 중 하나의 subtree로 내려간다.

complete binary tree에서 child subtree의 크기는 최악의 경우 전체 `n`의 $2n/3$ 이하이므로 recurrence는 다음처럼 쓸 수 있다.

$$
T(n) \le T(2n/3) + \Theta(1)
$$

Master theorem case 2로 풀면

$$
T(n) = O(\lg n)
$$

이다. 또는 더 직관적으로, `MAX-HEAPIFY`는 heap에서 한 path를 따라 아래로 내려가며 각 level에서 constant work만 하므로 node height를 `h`라고 할 때 $O(h)$다. heap root에서 호출하면 $h = \Theta(\lg n)$이다.

#### 주의할 점

- `MAX-HEAPIFY`는 아무 array나 heap으로 만드는 procedure가 아니다. 양쪽 child subtrees가 이미 max-heap이라는 전제가 필요하다.
- `i`가 leaf이면 children이 없으므로 호출해도 아무 변화가 없다.
- $A[i]$가 children보다 이미 크거나 같으면 재귀 없이 즉시 종료한다.
- min-heap에서는 비교 방향을 반대로 바꾸면 `MIN-HEAPIFY`가 된다. 시간복잡도는 동일하게 $O(\lg n)$이다.

### 6.3 Building a heap

#### Bottom-up으로 heap 만들기

`BUILD-MAX-HEAP`은 unordered array $A[1..n]$을 max-heap으로 바꾼다. 핵심은 leaves가 이미 trivial max-heap이라는 사실이다. `n`개 element의 heap에서 leaves는 $\lfloor n/2 \rfloor+1$부터 `n`까지이므로, internal nodes만 뒤에서 앞으로 처리하면 된다.

```text
BUILD-MAX-HEAP(A)
1  A.heap-size = A.length
2  for i = floor(A.length/2) downto 1
3      MAX-HEAPIFY(A, i)
```

왜 뒤에서 앞으로 가는가? `MAX-HEAPIFY(A, i)`는 `i`의 left/right subtrees가 이미 max-heap이라는 전제를 요구한다. Array index에서 children은 parent보다 큰 index를 가지므로, 큰 index에서 작은 index로 내려오면 node `i`를 처리할 때 children subtrees는 이미 heap으로 만들어져 있다.

![Figure 6.3](@/assets/images/cs-algorithm-018-figure-6-3-page-179.png)
*Figure 6.3 · PDF p. 179 · `BUILD-MAX-HEAP`이 internal node를 뒤에서 앞으로 heapify하는 과정*

Figure 6.3의 각 단계는 line 3의 `MAX-HEAPIFY` 호출 직전 상태를 보여준다. 중요한 관찰은 호출되는 node의 두 child subtrees가 이미 max-heaps라는 점이다. 그래서 `MAX-HEAPIFY`의 precondition이 만족되고, 한 번의 호출로 해당 node를 root로 하는 subtree가 max-heap이 된다.

#### Correctness loop invariant

원문의 loop invariant는 다음과 같다.

$$
\begin{aligned}
\text{At the start of each iteration with index i,} \\
each node i+1, i+2, \ldots, n is the root of a \max-heap.
\end{aligned}
$$

Initialization:

처음에는 $i = \lfloor n/2 \rfloor$이다. $\lfloor n/2 \rfloor+1$부터 `n`까지는 leaves이므로 각각 1-element heap, 즉 trivial max-heap이다.

Maintenance:

iteration `i`에서 node `i`의 children은 모두 `i`보다 큰 index다. loop invariant에 의해 그 children은 max-heap roots다. 따라서 `MAX-HEAPIFY(A, i)`의 전제가 성립하고, 호출 후 node `i`도 max-heap root가 된다. 기존에 max-heap이던 nodes $i+1..n$의 성질도 보존된다.

Termination:

loop가 끝나면 $i = 0$이다. invariant에 의해 nodes `1..n`이 모두 max-heap roots이고, 특히 root `1`이 max-heap root이므로 전체 array가 max-heap이다.

#### 왜 BUILD-MAX-HEAP은 O(n)인가

단순하게 보면 `MAX-HEAPIFY`를 $O(n)$번 호출하고 각 호출이 $O(\lg n)$이므로 $O(n \lg n)$ upper bound가 나온다. 이 bound는 맞지만 tight하지 않다.

더 정확한 분석은 node height를 본다. `MAX-HEAPIFY`가 height `h`인 node에서 걸리는 시간은 $O(h)$이다. 그런데 대부분의 node는 heap의 아래쪽에 있고 height가 작다. 원문은 다음 성질을 사용한다.

$$
height h인 node 수 \le \lceil n / 2^{h+1} \rceil
$$

따라서 전체 비용은 다음처럼 합산된다.

$$
\sum_{h=0}^{\lfloor \lg n \rfloor} \lceil n / 2^{h+1} \rceil \cdot O(h)
$$

상수와 ceiling을 흡수하면

$$
O(n \sum_{h=0}^{\lfloor \lg n \rfloor} h / 2^{h})
$$

가 된다. 무한급수

$$
\sum_{h=0}^{\infty} h / 2^{h} = 2
$$

이므로

$$
BUILD-MAX-HEAP = O(n)
$$

이다.

이 분석의 직관은 아래쪽 node가 많지만 거의 움직이지 않고, 위쪽 node는 길게 내려갈 수 있지만 개수가 적다는 것이다. 그래서 전체 합은 $n \lg n$이 아니라 linear time에 수렴한다.

#### Min-heap 만들기

`BUILD-MIN-HEAP`은 같은 구조에서 line 3의 `MAX-HEAPIFY`를 `MIN-HEAPIFY`로 바꾸면 된다. unordered array를 min-heap으로 만드는 시간도 $O(n)$이다.

### 6.4 The heapsort algorithm

#### Heapsort의 기본 아이디어

`HEAPSORT`는 먼저 input array 전체를 max-heap으로 만든다. Max-heap에서는 maximum element가 root $A[1]$에 있으므로, 이 값을 array의 맨 끝 $A[n]$과 교환하면 maximum이 최종 정렬 위치로 간다.

그다음 $A.heap-size$를 1 줄여서 방금 끝으로 보낸 maximum을 heap에서 제외한다. 이때 root에는 원래 끝에 있던 element가 올라와 있으므로 root에서 max-heap property가 깨질 수 있다. 하지만 root의 두 child subtrees는 여전히 max-heaps이므로 `MAX-HEAPIFY(A, 1)` 한 번으로 heap을 복구할 수 있다.

이 과정을 heap size가 2가 될 때까지 반복하면 array 뒤쪽부터 큰 값들이 차례로 확정되고, 전체 array가 increasing order로 정렬된다.

```text
HEAPSORT(A)
1  BUILD-MAX-HEAP(A)
2  for i = A.length downto 2
3      exchange A[1] with A[i]
4      A.heap-size = A.heap-size - 1
5      MAX-HEAPIFY(A, 1)
```

![Figure 6.4](@/assets/images/cs-algorithm-019-figure-6-4-page-182.png)
*Figure 6.4 · PDF p. 182 · `HEAPSORT`가 max root를 sorted suffix로 보내며 heap 영역을 줄이는 과정*

Figure 6.4에서 lightly shaded nodes만 heap에 남아 있고, 오른쪽/아래쪽의 excluded nodes는 이미 sorted suffix를 이룬다. 즉 같은 array 안에서

$$
\begin{aligned}
A[1..i] &= 아직 heap으로 관리되는 영역 \\
A[i+1..n] &= 이미 정렬이 끝난 largest elements
\end{aligned}
$$

로 나뉜다.

#### Correctness loop invariant

원문 exercise가 제시하는 loop invariant는 heapsort correctness를 이해하는 데 좋다.

$$
\begin{aligned}
\text{At the start of each iteration with index i:} \\
A[1..i] is a \max-heap containing the i smallest elements of A[1..n], \\
A[i+1..n] contains the n-i largest elements of A[1..n], sorted.
\end{aligned}
$$

iteration에서 $A[1]$은 heap 영역 $A[1..i]$의 maximum이므로, 전체 array에서 아직 정렬되지 않은 값들 중 가장 큰 값이다. 이를 $A[i]$와 교환하면 그 값은 sorted suffix의 맨 앞, 즉 올바른 최종 위치로 간다. `heap-size`를 줄여 $A[i]$를 heap에서 제외한 뒤 `MAX-HEAPIFY(A,1)`로 남은 $A[1..i-1]$을 다시 max-heap으로 만든다.

#### 시간복잡도와 공간

`HEAPSORT`의 running time은

$$
\begin{aligned}
\text{BUILD-MAX-HEAP:} O(n) \\
\text{MAX-HEAPIFY calls:} (n-1) \cdot O(\lg n) \\
\text{Total:} O(n \lg n)
\end{aligned}
$$

이다. 또한 array 내부에서 swap하고 $A.heap-size$만 조정하므로 in place sorting이다. 입력 array 밖에 저장하는 element 수가 constant number에 그친다.

Heapsort의 장점은 worst-case $O(n \lg n)$을 보장하면서 in-place라는 점이다. 다만 실제 구현에서 cache locality나 constant factors 때문에 quicksort 계열이 더 빠를 수 있는 경우도 많다. 그 trade-off는 Chapter 7 이후 sorting algorithm 비교에서 다시 중요해진다.

### 6.5 Priority queues

#### Heap이 sorting 밖에서도 중요한 이유

원문은 heapsort가 좋은 알고리즘이지만, practical implementation에서는 Chapter 7의 quicksort가 보통 더 빠르다고 말한다. 그래도 heap data structure 자체는 매우 중요하다. 대표적인 응용이 `priority queue`다.

`priority queue`는 각 element가 `key`라는 priority 값을 가진 set `S`를 관리하는 ADT다. Max-priority queue는 큰 key가 높은 priority이고, min-priority queue는 작은 key가 높은 priority다.

Max-priority queue가 지원하는 기본 operations:

| operation | 의미 |
| --- | --- |
| `INSERT(S, x)` | element `x`를 set `S`에 삽입 |
| $MAXIMUM(S)$ | largest key를 가진 element 반환 |
| `EXTRACT-MAX(S)` | largest key를 가진 element를 제거하고 반환 |
| `INCREASE-KEY(S, x, k)` | element `x`의 key를 새 값 `k`로 증가 |

Min-priority queue는 대응되는 `MINIMUM`, `EXTRACT-MIN`, `DECREASE-KEY`를 지원한다.

응용 예:

- max-priority queue: shared computer의 job scheduling. Scheduler는 pending jobs 중 priority가 가장 높은 job을 `EXTRACT-MAX`로 선택한다.
- min-priority queue: event-driven simulator. Event time이 key이고, simulator는 가장 이른 event를 `EXTRACT-MIN`으로 꺼낸다.

Chapters 23, 24의 graph algorithms에서는 min-priority queue와 `DECREASE-KEY`가 특히 중요해진다.

#### Handle 유지의 실제 구현 이슈

Heap으로 priority queue를 구현할 때 heap element는 application object와 연결되어야 한다. 예를 들어 job scheduler에서는 heap element가 실제 job object를 가리켜야 한다. 반대로 application object도 heap 안에서 자신의 위치를 알아야 할 수 있다.

따라서 실제 구현에서는 보통 다음 두 방향의 handle이 필요하다.

$$
\begin{aligned}
heap element \to application object \\
application object \to heap array index
\end{aligned}
$$

문제는 heap operation 중 swap이 자주 일어나 heap element의 array index가 바뀐다는 점이다. 실제 구현에서는 heap element를 이동할 때 application object 안의 index handle도 함께 갱신해야 한다. 원문은 이 세부가 application-dependent라 더 추적하지 않지만, 실전 priority queue 구현에서 매우 중요한 주의점이다.

#### HEAP-MAXIMUM

Max-heap에서는 maximum이 항상 root에 있다. 그래서 `HEAP-MAXIMUM`은 constant time이다.

```text
HEAP-MAXIMUM(A)
1  return A[1]
```

$$
\text{running time} = \Theta(1)
$$

#### HEAP-EXTRACT-MAX

`HEAP-EXTRACT-MAX`는 maximum을 제거하고 반환한다. 구조는 heapsort의 loop body와 거의 같다.

```text
HEAP-EXTRACT-MAX(A)
1  if A.heap-size < 1
2      error "heap underflow"
3  max = A[1]
4  A[1] = A[A.heap-size]
5  A.heap-size = A.heap-size - 1
6  MAX-HEAPIFY(A, 1)
7  return max
```

동작 흐름:

1. root $A[1]$에 있는 maximum을 저장한다.
2. heap의 마지막 element를 root로 올린다.
3. `heap-size`를 줄여 마지막 slot을 heap에서 제거한다.
4. root에서 max-heap property가 깨졌을 수 있으므로 `MAX-HEAPIFY(A,1)`로 복구한다.

`MAX-HEAPIFY`가 $O(\lg n)$이므로 전체 running time도

$$
O(\lg n)
$$

이다.

#### HEAP-INCREASE-KEY

`HEAP-INCREASE-KEY(A, i, key)`는 index `i`에 있는 element의 key를 더 큰 값으로 바꾼다. key가 커지면 그 element가 parent보다 커질 수 있으므로 max-heap property가 위쪽 방향으로 깨질 수 있다. 따라서 이 operation은 값을 root 방향으로 “bubble up”시킨다.

```text
HEAP-INCREASE-KEY(A, i, key)
1  if key < A[i]
2      error "new key is smaller than current key"
3  A[i] = key
4  while i > 1 and A[PARENT(i)] < A[i]
5      exchange A[i] with A[PARENT(i)]
6      i = PARENT(i)
```

`MAX-HEAPIFY`가 값을 아래로 내려 보내는 operation이라면, `HEAP-INCREASE-KEY`는 증가한 key를 위로 올려 보내는 operation이다. Parent보다 작거나 같아지는 순간, 또는 root에 도달하는 순간 종료한다.

![Figure 6.5](@/assets/images/cs-algorithm-020-figure-6-5-page-186.png)
*Figure 6.5 · PDF p. 186 · `HEAP-INCREASE-KEY`가 증가한 key를 parent 방향으로 올리는 과정*

Figure 6.5에서는 특정 node의 key가 15로 증가한 뒤, parent보다 커졌기 때문에 parent와 swap한다. 한 번 더 parent와 비교해 필요하면 다시 swap하고, $A[PARENT(i)] \ge A[i]$가 되는 지점에서 max-heap property가 회복된다.

path는 node에서 root까지의 simple path이고 길이는 $O(\lg n)$이므로

$$
HEAP-INCREASE-KEY = O(\lg n)
$$

이다.

#### MAX-HEAP-INSERT

`MAX-HEAP-INSERT`는 새 key를 heap에 넣는다. 먼저 heap size를 늘려 새 leaf를 만들고, 그 값을 매우 작은 sentinel로 둔 뒤 `HEAP-INCREASE-KEY`를 호출해 원하는 key로 올린다.

```text
MAX-HEAP-INSERT(A, key)
1  A.heap-size = A.heap-size + 1
2  A[A.heap-size] = -∞
3  HEAP-INCREASE-KEY(A, A.heap-size, key)
```

원문 extraction에서는 line 2의 sentinel이 깨져 보이지만, CLRS의 의도는 새 leaf의 key를 negative infinity처럼 모든 실제 key보다 작은 값으로 두는 것이다. 그래야 `HEAP-INCREASE-KEY`의 precondition, 즉 새 key가 current key보다 작지 않다는 조건이 항상 만족된다.

`HEAP-INCREASE-KEY`가 $O(\lg n)$이므로 insert도

$$
MAX-HEAP-INSERT = O(\lg n)
$$

이다.

#### Priority queue operations 요약

| operation | heap 구현 아이디어 | 시간 |
| --- | --- | --- |
| `HEAP-MAXIMUM` | root $A[1]$ 반환 | $\Theta(1)$ |
| `HEAP-EXTRACT-MAX` | root 제거, last element를 root로 올린 뒤 `MAX-HEAPIFY` | $O(\lg n)$ |
| `HEAP-INCREASE-KEY` | key 증가 후 parent 방향으로 bubble up | $O(\lg n)$ |
| `MAX-HEAP-INSERT` | 새 leaf 추가 후 `HEAP-INCREASE-KEY` | $O(\lg n)$ |

Heap은 set size `n`에 대해 priority queue operations를 모두 $O(\lg n)$ 이하로 지원한다. `MAXIMUM`만은 root 접근이므로 $\Theta(1)$이다.

#### Exercises, problems, chapter notes에서 남길 연결

Chapter 6의 exercises와 problems는 heap이 단순 binary heap에 그치지 않음을 보여준다.

- $6.5-7$은 priority queue로 FIFO queue와 stack을 구현하게 한다. 삽입 시각이나 sequence number를 key로 쓰면 ADT를 priority queue로 흉내낼 수 있다.
- $6.5-8$의 `HEAP-DELETE(A, i)`는 임의 index를 삭제하는 operation이다. 삭제 대상의 위치에 마지막 element를 넣고, 값이 parent보다 크면 bubble up, children보다 작으면 heapify down하는 식으로 $O(\lg n)$에 처리할 수 있다.
- $6.5-9$는 `k sorted lists`를 merge할 때 min-heap을 쓰면 $O(n \lg k)$에 k-way merging이 가능함을 묻는다. 이는 external sorting, streaming merge, multiway merge에서 자주 쓰이는 패턴이다.
- Problem 6-1의 insertion-based heap build는 `BUILD-MAX-HEAP`과 달리 worst-case $\Theta(n \lg n)$이 될 수 있다. Bottom-up build가 linear인 이유와 대비된다.
- Problem 6-2의 `d-ary heap`은 branching factor를 바꾼 heap이다. Height는 줄지만 한 node에서 maximum child를 찾는 비용이 `d`에 비례하므로 `EXTRACT-MAX`, `INSERT`, `INCREASE-KEY`의 trade-off가 달라진다.
- Problem 6-3의 `Young tableau`는 row/column sorted matrix를 heap처럼 이용한다. `EXTRACT-MIN`, insert, search가 heapify와 비슷한 구조로 동작한다.

Chapter notes는 heap과 priority queue가 이후 장과 강하게 연결됨을 강조한다. Min-heaps는 Chapters 16, 23, 24에서 사용되고, Chapter 19의 Fibonacci heaps는 일부 priority queue operations의 time bound를 개선한다. Dijkstra's single-source shortest-paths algorithm에서는 특히 `DECREASE-KEY` 효율이 중요하다.

## 복잡도

| procedure / operation | 시간 | 핵심 이유 |
| --- | --- | --- |
| `PARENT`, `LEFT`, `RIGHT` | $\Theta(1)$ | index arithmetic |
| `MAX-HEAPIFY` | $O(\lg n)$ | 한 root-to-leaf path를 따라 float down |
| `BUILD-MAX-HEAP` | $O(n)$ | 많은 node의 height가 작아 weighted sum이 linear |
| `HEAPSORT` | $O(n \lg n)$ | build $O(n)$ + $n-1$번 heapify |
| `HEAP-MAXIMUM` | $\Theta(1)$ | maximum은 root |
| `HEAP-EXTRACT-MAX` | $O(\lg n)$ | root 제거 후 heapify down |
| `HEAP-INCREASE-KEY` | $O(\lg n)$ | 증가한 key를 root 방향으로 bubble up |
| `MAX-HEAP-INSERT` | $O(\lg n)$ | 새 leaf 추가 후 increase-key |

## 연결 관계

- Chapter 2의 insertion sort와 비교된다. `HEAP-INCREASE-KEY`의 bubble-up loop는 insertion sort의 key 이동과 비슷한 감각을 가진다.
- Chapter 4의 recurrence와 summation 분석이 `MAX-HEAPIFY`, `BUILD-MAX-HEAP`의 시간 분석에 쓰인다.
- Chapter 7의 quicksort와 sorting trade-off가 이어진다. Heapsort는 worst-case $O(n \lg n)$과 in-place를 보장하지만, quicksort는 평균적으로 매우 빠른 practical choice다.
- Chapter 16, 23, 24의 algorithms에서 min-priority queue가 사용된다. 특히 shortest path algorithms에서는 `EXTRACT-MIN`과 `DECREASE-KEY`가 성능을 좌우한다.
- Chapter 19의 Fibonacci heaps, Chapter 20의 integer priority queue 구조는 heap 기반 priority queue의 operation bounds를 더 개선하는 방향이다.

## 오해하기 쉬운 내용

- Heap은 sorted array가 아니다. Parent-child 관계만 보장할 뿐, 같은 level이나 sibling 사이에는 전체 정렬 관계가 없다.
- Max-heap에서 smallest element는 root가 아니라 leaf 중 어딘가에 있을 수 있다.
- `MAX-HEAPIFY`는 child subtrees가 이미 max-heaps라는 전제가 있을 때만 한 node의 violation을 고친다.
- `BUILD-MAX-HEAP`이 $O(n)$인 이유는 `MAX-HEAPIFY`가 싸서가 아니라, 비싼 높은 node가 적고 싼 낮은 node가 많기 때문이다.
- `A.length`와 $A.heap-size$는 다르다. Heapsort 중에는 array 뒤쪽이 sorted suffix가 되며 heap에서는 제외된다.
- `HEAP-INCREASE-KEY`는 key를 줄이는 operation이 아니다. 더 작은 key를 넣으면 max-heap에서는 아래 방향 복구가 필요하므로 다른 procedure가 필요하다.
- Priority queue 구현에서는 heap element와 application object 사이의 handle/index 갱신이 빠지면 swap 후 object mapping이 깨진다.

## 면접 질문

1. Binary heap을 array로 표현할 때 `PARENT`, `LEFT`, `RIGHT` index 공식이 왜 성립하는가?
2. Max-heap property와 sorted array의 차이를 설명하라.
3. `MAX-HEAPIFY`의 precondition은 무엇이고, 왜 필요한가?
4. `MAX-HEAPIFY`가 $O(\lg n)$인 이유를 height 관점에서 설명하라.
5. `BUILD-MAX-HEAP`이 왜 $O(n \lg n)$이 아니라 $O(n)$인지 설명하라.
6. Heapsort에서 $A.heap-size$를 줄이는 이유와 sorted suffix의 의미를 설명하라.
7. Heapsort가 in-place이면서 worst-case $O(n \lg n)$인 이유를 설명하라.
8. `HEAP-EXTRACT-MAX`와 heapsort loop body가 어떻게 비슷한가?
9. `HEAP-INCREASE-KEY`는 왜 `MAX-HEAPIFY`와 반대 방향으로 움직이는가?
10. Priority queue를 heap으로 구현할 때 application object와 heap index handle을 왜 관리해야 하는가?
