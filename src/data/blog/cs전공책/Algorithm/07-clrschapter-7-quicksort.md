---
title: "Chapter 7. Quicksort"
order: 7
pubDatetime: 2026-05-17T00:00:00+09:00
modDatetime: 2026-05-17T00:00:00+09:00
description: "CLRS 알고리즘 정리: Chapter 7. Quicksort"
tags:
  - "Algorithm"
  - "CS"
  - "CLRS"
---

## 개요

Chapter 7은 `quicksort`를 다룬다. Quicksort는 worst-case running time이 $\Theta(n^{2})$이지만, average/expected behavior가 매우 좋고 hidden constant가 작아 practical sorting에서 강력한 선택지가 된다. 또한 `in place`로 동작하고 virtual-memory environments에서도 잘 작동한다고 원문은 설명한다.

이 장의 흐름은 먼저 `PARTITION`을 이용한 divide-and-conquer 구조를 설명하고, 그다음 왜 quicksort가 worst case에서는 느리지만 typical case에서는 빠른지 직관을 만든다. 이어서 `RANDOMIZED-QUICKSORT`로 입력에 대한 의존성을 줄이고, 마지막에 expected $O(n \lg n)$ 분석을 수행한다.

## 핵심 개념

| 용어 | 의미 | 검색 키워드 |
| --- | --- | --- |
| quicksort | pivot을 기준으로 partition한 뒤 양쪽을 재귀적으로 정렬하는 in-place sorting algorithm | QUICKSORT |
| partition | pivot보다 작거나 같은 값과 큰 값을 제자리에서 나누는 절차 | PARTITION |
| pivot | partition 기준 원소. 기본 `PARTITION`은 $A[r]$를 pivot으로 사용 | pivot element |
| randomized quicksort | pivot을 random하게 고른 뒤 partition하는 quicksort | RANDOMIZED-QUICKSORT |
| worst-case partitioning | partition이 `0`과 $n-1$로 갈라지는 경우 | $\Theta(n^{2})$ |
| balanced partitioning | subproblem sizes가 일정 비율로 나뉘는 경우 | $\Theta(n \lg n)$ |
| comparison count | quicksort 분석에서 element pair가 서로 비교되는 횟수 | expected comparisons |

## 세부 정리

### 7.1 Description of quicksort

#### Divide-and-conquer 구조

Quicksort는 Chapter 2의 merge sort처럼 divide-and-conquer paradigm을 따른다. 하지만 merge sort와 달리 combine 단계가 거의 없다. 핵심 작업은 divide 단계의 `PARTITION`이 한다.

Subarray $A[p..r]$를 정렬할 때:

- Divide: $A[p..r]$를 $A[p..q-1]$, $A[q]$, $A[q+1..r]$로 재배열한다. 왼쪽은 $A[q]$보다 작거나 같고, 오른쪽은 $A[q]$보다 크거나 같다.
- Conquer: 왼쪽과 오른쪽 subarrays를 recursive하게 quicksort한다.
- Combine: 두 subarrays가 이미 정렬되어 있고 pivot이 제자리에 있으므로 별도 작업이 없다.

```text
QUICKSORT(A, p, r)
1  if p < r
2      q = PARTITION(A, p, r)
3      QUICKSORT(A, p, q-1)
4      QUICKSORT(A, q+1, r)
```

전체 array를 정렬하려면

```text
QUICKSORT(A, 1, A.length)
```

를 호출한다.

#### PARTITION procedure

`PARTITION(A, p, r)`는 subarray $A[p..r]$를 제자리에서 rearrange한다. 기본 버전은 마지막 원소 $A[r]$를 pivot `x`로 선택한다.

```text
PARTITION(A, p, r)
1  x = A[r]
2  i = p - 1
3  for j = p to r - 1
4      if A[j] <= x
5          i = i + 1
6          exchange A[i] with A[j]
7  exchange A[i+1] with A[r]
8  return i + 1
```

$i$는 pivot 이하 영역의 끝을 가리키고, $j$는 아직 검사 중인 element를 가리킨다. Loop가 끝나면 $i+1$은 pivot보다 큰 첫 위치가 되고, pivot $A[r]$를 그 위치와 swap하면 pivot이 최종 partition 위치 $q$에 놓인다.

![Figure 7.1](@/assets/images/cs-algorithm-021-figure-7-1-page-193.png)
*Figure 7.1 · PDF p. 193 · `PARTITION`이 pivot $A[r]$를 기준으로 sample array를 나누는 과정*

Figure 7.1은 pivot $4$를 기준으로 $\le x$ 영역과 $> x$ 영역이 커지는 과정을 보여준다. Loop 중에는 아직 처리하지 않은 영역도 남아 있고, 마지막에 pivot을 두 영역 사이로 옮긴다.

#### PARTITION loop invariant

`PARTITION`의 correctness는 네 영역을 유지하는 loop invariant로 설명한다.

![Figure 7.2](@/assets/images/cs-algorithm-022-figure-7-2-page-194.png)
*Figure 7.2 · PDF p. 194 · `PARTITION` loop 중 유지되는 네 영역*

Loop lines 3-6의 각 iteration 시작 시점에 다음이 성립한다.

$$
\begin{aligned}
A[p..i] &\le x \\
A[i+1..j-1] &> x \\
A[j..r-1] unrestricted \\
A[r] &= x
\end{aligned}
$$

Initialization:

처음에는 $i = p-1$, $j = p$다. $A[p..i]$와 $A[i+1..j-1]$는 모두 empty range라 조건이 vacuously true이고, line 1에서 $A[r] = x$가 성립한다.

Maintenance:

각 iteration에서 $A[j]$를 검사한다.

![Figure 7.3](@/assets/images/cs-algorithm-023-figure-7-3-page-195.png)
*Figure 7.3 · PDF p. 195 · `PARTITION` 한 iteration의 두 경우: `A[j] > x`와 $A[j] \le x$*

두 경우가 있다.

- $A[j] > x$: 아무 swap 없이 $j$만 증가한다. 방금 검사한 $A[j]$는 $> x$ 영역에 들어간다.
- $A[j] \le x$: $i$를 증가시키고 $A[i]$와 $A[j]$를 swap한다. 그러면 새 $A[i]$는 $\le x$ 영역에 들어가고, swap으로 밀려난 값은 기존 invariant에 의해 $> x$ 영역에 남는다. 이후 $j$가 증가한다.

Termination:

Loop가 끝나면 $j = r$이다. 따라서 $A[p..i] \le x$, $A[i+1..r-1] > x$, $A[r] = x$가 성립한다. 마지막으로 pivot $A[r]$를 $A[i+1]$과 swap하면 pivot은 왼쪽의 모든 값보다 크거나 같고 오른쪽의 모든 값보다 작거나 같은 위치에 놓인다. 반환값은

$$
q = i + 1
$$

이다.

이제 `PARTITION` 결과는 quicksort의 divide 조건을 만족한다.

$$
A[p..q-1] \le A[q] \le A[q+1..r]
$$

원문은 이보다 조금 더 강하게, 오른쪽 영역의 모든 값이 pivot보다 strictly greater라고 설명한다. 기본 `PARTITION`이 $\le x$를 왼쪽으로 보내기 때문이다.

#### PARTITION의 시간복잡도와 특징

`PARTITION`은 `j`가 `p`부터 $r-1$까지 한 번만 훑는다. Subarray size를

$$
n = r - p + 1
$$

라고 하면 running time은

$$
\Theta(n)
$$

이다. 추가 array를 만들지 않고 swap만 하므로 in place로 동작한다.

다만 pivot 선택이 항상 $A[r]$라는 점 때문에 입력 배열 상태에 따라 partition balance가 크게 달라진다. 이 balance가 quicksort 전체 성능을 결정한다.

### 7.2 Performance of quicksort

#### 성능은 partition balance가 결정한다

Quicksort의 running time은 `PARTITION`이 얼마나 balanced한 subproblems를 만드는지에 달려 있다. Balanced partition이면 merge sort처럼 빠르고, maximally unbalanced partition이면 insertion sort처럼 $\Theta(n^{2})$까지 느려질 수 있다.

핵심 recurrence는 항상 다음 형태다.

$$
T(n) = T(left size) + T(right size) + \Theta(n)
$$

여기서 $\Theta(n)$은 `PARTITION`이 subarray를 한 번 scan하는 비용이다. 따라서 partition sizes가 recursion tree의 height와 level cost를 결정한다.

#### Worst-case partitioning

Worst case는 매번 `PARTITION`이 한쪽 subproblem size를 $n-1$, 다른 쪽을 `0`으로 만드는 경우다. 이때 recurrence는

$$
\begin{aligned}
T(n) &= T(n-1) + T(0) + \Theta(n) \\
     &= T(n-1) + \Theta(n)
\end{aligned}
$$

이다. Level별 partition cost를 더하면

$$
n + (n-1) + (n-2) + \ldots + 1 = \Theta(n^{2})
$$

이므로 quicksort의 worst-case running time은

$$
\Theta(n^{2})
$$

이다.

중요한 점은 이 worst case가 흔한 입력에서도 발생할 수 있다는 것이다. 기본 `PARTITION`이 항상 마지막 원소 $A[r]$를 pivot으로 쓰기 때문에, array가 이미 increasing order로 sorted되어 있으면 pivot은 항상 maximum이고 split은 $n-1$과 `0`이 된다. 이 경우 insertion sort는 $O(n)$이지만 quicksort는 $\Theta(n^{2})$가 된다.

#### Best-case partitioning

Best case는 pivot이 거의 median처럼 작동해 두 subarrays를 가능한 균등하게 나누는 경우다.

$$
T(n) = 2T(n/2) + \Theta(n)
$$

floor/ceiling과 pivot 하나가 빠지는 세부는 asymptotic analysis에서 생략해도 된다. Master theorem case 2로

$$
T(n) = \Theta(n \lg n)
$$

이다. Perfect balance가 반복되면 recursion tree height는 $\Theta(\lg n)$이고, 각 level의 total partition cost는 $\Theta(n)$이기 때문이다.

#### Balanced partitioning: 9-to-1도 충분히 빠르다

Quicksort의 중요한 직관은 “완벽한 1-to-1 split이 아니어도 된다”는 점이다. 예를 들어 매번 9-to-1 split이 난다고 하자.

$$
T(n) = T(9n/10) + T(n/10) + cn
$$

이 split은 꽤 불균형해 보이지만, 전체 running time은 여전히 $O(n \lg n)$이다.

![Figure 7.4](@/assets/images/cs-algorithm-024-figure-7-4-page-197.png)
*Figure 7.4 · PDF p. 197 · 매번 9-to-1 split이 나도 level cost가 $O(n)$이고 height가 $\Theta(\lg n)$인 recursion tree*

Figure 7.4의 요점은 다음과 같다.

- 각 level에서 subproblem sizes의 합은 원래 $n$을 넘지 않으므로 partition cost 합은 최대 $cn$이다.
- 가장 작은 쪽은 깊이 $\log_{10} n$ 정도에서 boundary condition에 도달한다.
- 가장 큰 쪽은 깊이 $\log_{10/9} n$ 정도까지 내려간다.
- 두 깊이 모두 $\Theta(\lg n)$이다.

따라서 constant proportional split, 예를 들어 9-to-1이나 99-to-1처럼 비율이 고정되어 있다면 recursion tree height는 여전히 logarithmic이고 전체 cost는

$$
O(n \lg n)
$$

이다.

#### Average-case intuition

Average case를 논하려면 input permutations가 어떻게 나타나는지 가정해야 한다. 원문은 Section 5.2의 hiring problem처럼, 우선 모든 input permutation이 equally likely하다고 가정한다.

Random input에서 partition이 매 level마다 똑같은 방식으로 나뉘지는 않는다. 어떤 split은 good split이고, 어떤 split은 bad split이다. 원문은 직관을 위해 good split과 bad split이 alternating한다고 생각해 보라고 한다.

![Figure 7.5](@/assets/images/cs-algorithm-025-figure-7-5-page-198.png)
*Figure 7.5 · PDF p. 198 · bad split 다음 good split이 오면 두 level의 비용이 balanced split 한 level처럼 흡수되는 직관*

Figure 7.5(a)는 root에서 worst-case split `(0, n-1)`이 나오고, 다음 level에서 size $n-1$ subarray가 best-case split으로 갈라지는 경우다. 두 level의 combined partition cost는

$$
\Theta(n) + \Theta(n-1) = \Theta(n)
$$

이고, 남은 subproblems는 Figure 7.5(b)의 balanced split에서 생기는 subproblems보다 나쁘지 않다. 즉 bad split 하나가 good split 하나와 묶이면 asymptotic structure는 여전히 balanced case와 비슷하다.

이것이 randomized quicksort의 핵심 감각이다. 개별 partition이 나쁠 수 있어도, good/bad splits가 random하게 섞이면 전체 expected running time은 $O(n \lg n)$에 가까워진다. Section 7.4에서 이를 엄밀하게 expected comparison count로 증명한다.

#### Almost-sorted input에서의 주의점

원문 exercise는 은행 check-number 예시로 almost-sorted input을 언급한다. 사람들이 대체로 check number 순서대로 수표를 쓰고, 상점도 크게 늦지 않게 현금화한다면 transaction order는 almost sorted에 가깝다. 이런 입력에서는 insertion sort가 매우 빠를 수 있지만, 기본 quicksort는 pivot 선택 때문에 sorted/almost-sorted 입력에서 나쁜 partition을 반복할 위험이 있다.

이 문제는 Section 7.3의 randomized pivot selection으로 완화한다. 입력 순서가 이미 정렬되어 있든 악의적으로 구성되어 있든, pivot position을 random하게 고르면 특정 input이 항상 worst-case behavior를 유발하기 어렵다.

### 7.3 A randomized version of quicksort

#### 왜 randomization을 넣는가

Section 7.2의 average-case intuition은 모든 input permutations가 equally likely하다는 가정 위에 있었다. 하지만 engineering situation에서는 이 가정이 항상 맞지 않는다. 입력이 이미 sorted되어 있거나 almost-sorted일 수도 있고, 특정 패턴을 가질 수도 있다.

Chapter 5에서 본 것처럼, 입력 분포를 믿기 어렵다면 알고리즘 자체에 randomization을 넣을 수 있다. Quicksort에서는 input array 전체를 먼저 random permutation으로 섞는 방법도 가능하지만, 원문은 더 간단한 방법을 사용한다. 매번 partition할 때 pivot을 random sampling으로 고르는 것이다.

#### RANDOMIZED-PARTITION

기본 `PARTITION`은 항상 $A[r]$를 pivot으로 쓴다. `RANDOMIZED-PARTITION`은 먼저 $A[p..r]$에서 random index `i`를 뽑고, $A[i]$와 $A[r]$를 swap한다. 그러면 기존 `PARTITION`은 여전히 $A[r]$를 pivot으로 쓰지만, 그 pivot은 subarray의 모든 element 중 하나가 uniform하게 선택된 값이다.

```text
RANDOMIZED-PARTITION(A, p, r)
1  i = RANDOM(p, r)
2  exchange A[r] with A[i]
3  return PARTITION(A, p, r)
```

이렇게 하면 pivot $x = A[r]$는 $r-p+1$개 elements 중 어느 하나일 확률이 모두 같다.

$$
\Pr\left\{chosen pivot is any fixed element in A[p..r]\right\} = 1 / (r-p+1)
$$

#### RANDOMIZED-QUICKSORT

`RANDOMIZED-QUICKSORT`는 `PARTITION` 대신 `RANDOMIZED-PARTITION`을 호출한다.

```text
RANDOMIZED-QUICKSORT(A, p, r)
1  if p < r
2      q = RANDOMIZED-PARTITION(A, p, r)
3      RANDOMIZED-QUICKSORT(A, p, q-1)
4      RANDOMIZED-QUICKSORT(A, q+1, r)
```

이 알고리즘의 중요한 효과는 “특정 input이 항상 worst case를 만든다”는 문제를 없애는 것이다. 이미 정렬된 array도 pivot이 random하게 선택되면 매번 maximum/minimum이 pivot으로 뽑힐 확률은 낮다. 따라서 성능은 input order가 아니라 random choices에 의해 결정된다.

정리하면:

| 방식 | randomness가 있는 곳 | 의미 |
| --- | --- | --- |
| average-case quicksort analysis | input permutation | 입력이 random하다고 가정 |
| randomized quicksort | pivot choice inside algorithm | 모든 input에 대해 random choices의 expectation을 분석 |

다음 Section 7.4는 이 randomized quicksort의 expected running time을 엄밀하게 분석한다.

### 7.4 Analysis of quicksort

Section 7.4는 두 가지를 증명한다.

1. `QUICKSORT`와 `RANDOMIZED-QUICKSORT` 모두 worst-case running time은 $\Theta(n^{2})$이다.
2. `RANDOMIZED-QUICKSORT`의 expected running time은 distinct elements 가정 아래 $O(n \lg n)$이고, best-case lower bound와 합치면 $\Theta(n \lg n)$이다.

#### 7.4.1 Worst-case analysis

Worst-case analysis는 randomized 여부와 무관하다. Randomized quicksort도 운이 나쁘게 pivot이 계속 minimum 또는 maximum으로 선택되면 worst-case split이 반복될 수 있다.

Subarray size가 `n`일 때, `PARTITION`은 pivot 하나를 제외한 $n-1$ elements를 두 subproblems로 나눈다. 한쪽 크기를 `q`, 다른 쪽 크기를 $n-q-1$이라고 하면 worst-case recurrence는

$$
T(n) = max_{0 \le q \le n-1} (T(q) + T(n-q-1)) + \Theta(n)
$$

이다. $T(n) \le c n^{2}$라고 guess하고 substitution method를 적용한다.

$$
\begin{aligned}
\text{T(n)} \\
\le max_{0 \le q \le n-1} (c q^{2} + c(n-q-1)^{2}) + \Theta(n) \\
= c max_{0 \le q \le n-1} (q^{2} + (n-q-1)^{2}) + \Theta(n)
\end{aligned}
$$

$q^{2} + (n-q-1)^{2}$는 convex한 quadratic expression이므로 구간 endpoint에서 최대가 된다. 즉 최대는 $q=0$ 또는 $q=n-1$에서 발생하며, 값은 $(n-1)^{2}$다.

$$
\begin{aligned}
T(n) &\le c(n-1)^{2} + \Theta(n) \\
     &= c n^{2} - c(2n-1) + \Theta(n) \\
     &\le c n^{2}
\end{aligned}
$$

상수 `c`를 충분히 크게 잡으면 $c(2n-1)$이 $\Theta(n)$ 항을 지배한다. 따라서

$$
T(n) = O(n^{2})
$$

이고, Section 7.2에서 이미 unbalanced partition이 계속되는 구체적 경우가 $\Omega(n^{2})$임을 보았으므로 worst-case running time은

$$
T(n) = \Theta(n^{2})
$$

이다.

#### 7.4.2 Expected running time

Randomized quicksort의 expected running time을 분석할 때 원문은 subproblem별 recurrence를 바로 세우지 않고, 전체 execution 동안 일어나는 comparisons 수를 센다. 이 방식이 깔끔한 이유는 `PARTITION`의 time이 pivot과 다른 elements 사이의 comparisons 수에 의해 지배되기 때문이다.

`QUICKSORT`와 `RANDOMIZED-QUICKSORT`는 pivot 선택 방식만 다르고, partition 이후의 구조는 같다. 따라서 analysis에서는 pivot이 subarray에서 uniformly at random 선택된다고 가정하고 `PARTITION` comparisons를 센다.

#### Running time and comparisons

각 `PARTITION` call은 pivot 하나를 고르고, 그 pivot은 이후 recursive calls에 다시 포함되지 않는다. 따라서 전체 execution에서 `PARTITION`은 최대 `n`번 호출된다. 각 call에는 constant overhead가 있고, for loop line 4에서 pivot과 다른 element를 비교한다.

Lemma 7.1:

$$
\begin{aligned}
X &= 전체 execution 동안 PARTITION line 4에서 수행한 comparison 수 \\
\text{running time} &= O(n + X)
\end{aligned}
$$

따라서 expected running time을 bound하려면 $E[X]$를 계산하면 된다.

#### Pairwise comparison으로 바꾸기

원문은 array elements를 sorted order 기준으로 다시 이름 붙인다.

```text
z_1, z_2, ..., z_n
```

여기서 $z_{i}$는 `i`번째로 작은 element다. 또한

$$
Z_{ij} = {z_{i}, z_{i+1}, \ldots, z_{j}}
$$

를 $z_{i}$와 $z_{j}$ 사이의 elements 집합으로 둔다.

Quicksort에서 두 elements는 서로 여러 번 비교되지 않는다. 비교는 항상 pivot과 다른 element 사이에서만 일어나며, 어떤 element가 pivot으로 선택되어 partition이 끝나면 그 element는 이후 recursive calls에서 제외된다. 따라서 임의의 pair `(z_i, z_j)`는 최대 한 번만 비교된다.

Indicator random variable을 정의한다.

$$
X_{ij} = I\left\{z_{i} is compared to z_{j}\right\}
$$

그러면 전체 comparison 수는 모든 pair에 대한 합이다.

$$
X = \sum_{i=1}^{n-1} \sum_{j=i+1}^{n} X_{ij}
$$

linearity of expectation과 $E[I\left\{A\right\}] = \Pr\left\{A\right\}$를 쓰면

$$
\begin{aligned}
E[X] \\
= \sum_{i=1}^{n-1} \sum_{j=i+1}^{n} E[X_{ij}] \\
= \sum_{i=1}^{n-1} \sum_{j=i+1}^{n} \Pr\left\{z_{i} is compared to z_{j}\right\}
\end{aligned}
$$

#### 두 element는 언제 비교되는가

$z_{i}$와 $z_{j}$가 비교되는 조건은 $Z_{ij}$ 안에서 가장 먼저 pivot으로 선택되는 element가 $z_{i}$ 또는 $z_{j}$인 경우다.

왜 그런가?

- 만약 $Z_{ij}$ 내부의 어떤 중간 element $z_{k}$ (`i < k < j`)가 먼저 pivot으로 선택되면, $z_{i}$와 $z_{j}$는 서로 다른 partitions로 갈라진다. 이후에는 절대 비교되지 않는다.
- 반대로 $z_{i}$가 $Z_{ij}$에서 가장 먼저 pivot이 되면, 그 partition call에서 $z_{i}$는 $Z_{ij}$의 다른 elements와 비교되므로 $z_{j}$와도 비교된다.
- $z_{j}$가 먼저 pivot이 되는 경우도 마찬가지다.

$Z_{ij}$에는 $j-i+1$개 elements가 있고, randomized pivot selection 때문에 그중 어느 element가 first pivot이 될 확률은 모두 같다. 따라서

$$
\begin{aligned}
\Pr\left\{z_i \text{ is compared to } z_j\right\} \\
&= \Pr\left\{z_i \text{ or } z_j \text{ is first pivot chosen from } Z_{ij}\right\} \\
= 1/(j-i+1) + 1/(j-i+1) \\
= 2/(j-i+1)
\end{aligned}
$$

이제 expectation 합은

$$
E[X] = \sum_{i=1}^{n-1} \sum_{j=i+1}^{n} 2/(j-i+1)
$$

이다. $k = j-i$로 치환하면

$$
\begin{aligned}
E[X] \\
= \sum_{i=1}^{n-1} \sum_{k=1}^{n-i} 2/(k+1) \\
< \sum_{i=1}^{n-1} \sum_{k=1}^{n} 2/k \\
= \sum_{i=1}^{n-1} O(\lg n) \\
= O(n \lg n)
\end{aligned}
$$

따라서

$$
\begin{aligned}
\text{E[running time]} \\
= O(n + E[X]) \\
= O(n \lg n)
\end{aligned}
$$

이다. Section 7.2의 best-case lower bound $\Omega(n \lg n)$와 Exercise 7.4-4의 expected lower bound를 함께 보면 randomized quicksort의 expected running time은

$$
\Theta(n \lg n)
$$

으로 이해할 수 있다.

#### Distinct elements 가정과 equal values

Section 7.4.2의 분석은 elements가 distinct하다고 가정한다. Equal values가 많으면 기본 `PARTITION`은 `<= x`를 모두 왼쪽으로 보내므로, 모든 값이 같은 input에서는 매번 극단적으로 불균형한 split이 생길 수 있다. Problem 7-2는 이를 해결하기 위해 pivot과 같은 값들의 middle block을 한 번에 묶는 `PARTITION'`를 설계하게 한다.

실전 quicksort 구현에서 equal keys가 많을 수 있다면, three-way partitioning이 매우 중요하다.

$$
\text{< pivot |} = pivot | > pivot
$$

형태로 나누면 equal elements에 대해 불필요한 recursive sorting을 피할 수 있다.

#### Problems and chapter notes

Chapter 7의 problems는 quicksort 구현상의 중요한 변형들을 다룬다.

- `7-1 Hoare partition correctness`: CLRS Section 7.1의 `PARTITION`은 Lomuto partition이고, 원래 Hoare가 제시한 `HOARE-PARTITION`은 다른 방식이다. Hoare partition은 pivot을 두 partitions 중 하나에 남기며, 반환 index `j`가 $p \le j < r$인 nontrivial split을 보장한다.
- `7-2 Quicksort with equal element values`: distinct elements assumption을 제거하려면 equal elements를 한 block으로 모으는 partition이 필요하다.
- `7-3 Alternative quicksort analysis`: comparison count 대신 recursive call의 expected running time recurrence로 $E[T(n)] = \Theta(n \lg n)$을 보이는 접근이다.
- `7-4 Stack depth for quicksort`: tail recursion을 이용하면 두 번째 recursive call을 loop로 바꿀 수 있다. 항상 작은 subarray를 먼저 recursive하게 처리하도록 바꾸면 worst-case stack depth를 $\Theta(\lg n)$으로 줄일 수 있다.
- `7-5 Median-of-3 partition`: 세 random elements의 median을 pivot으로 쓰면 median 근처 pivot을 선택할 확률이 증가해 constant factor가 개선된다. 하지만 comparison sort lower bound 관점에서 asymptotic $\Theta(n \lg n)$은 그대로다.
- `7-6 Fuzzy sorting of intervals`: 정확한 값이 아니라 intervals를 fuzzy-sort하는 문제다. Intervals가 많이 overlap될수록 실제 정렬 난도가 낮아지고, randomized quicksort 구조를 변형해 이를 활용할 수 있다.

Chapter notes는 quicksort가 Hoare가 발명한 알고리즘이며, Section 7.1의 `PARTITION`은 Lomuto partition임을 언급한다. 또한 quicksort 구현 세부는 실제 성능에 큰 영향을 미치며, adversary가 random choices를 본 뒤 input을 구성할 수 있다면 randomized implementation도 $\Theta(n^{2})$ 실행을 유도당할 수 있음을 지적한다.

## 복잡도

| 대상 | 시간 / 기대값 | 핵심 이유 |
| --- | --- | --- |
| $PARTITION(A,p,r)$ | $\Theta(r-p+1)$ | subarray를 한 번 scan |
| `QUICKSORT` worst case | $\Theta(n^{2})$ | 매번 `(0, n-1)` split |
| `QUICKSORT` best case | $\Theta(n \lg n)$ | 매번 balanced split |
| constant proportional split | $O(n \lg n)$ | recursion depth가 $\Theta(\lg n)$, level cost $O(n)$ |
| `RANDOMIZED-PARTITION` | $\Theta(n)$ | random pivot swap + normal partition |
| `RANDOMIZED-QUICKSORT` expected | $O(n \lg n)$ | expected comparisons $O(n \lg n)$ |
| `RANDOMIZED-QUICKSORT` worst case | $\Theta(n^{2})$ | pivot choices가 계속 unlucky할 수 있음 |

## 연결 관계

- Chapter 2의 merge sort와 같은 divide-and-conquer 계열이지만, quicksort는 combine work가 없고 divide 단계인 `PARTITION`이 핵심이다.
- Chapter 5의 randomized algorithms, indicator random variables, linearity of expectation이 randomized quicksort 분석에 직접 쓰인다.
- Chapter 6의 heapsort와 비교된다. Heapsort는 worst-case $O(n \lg n)$과 in-place를 보장하고, quicksort는 worst-case $\Theta(n^{2})$이지만 평균적으로 매우 빠르고 practical constant가 작다.
- Chapter 8의 comparison sort lower bound와 연결된다. Quicksort도 comparison sort이므로 worst-case 또는 expected lower bound 관점에서 $n \lg n$ 장벽과 관련된다.
- Tail recursion, median-of-3, three-way partitioning 같은 구현 기법은 실제 library sort의 성능과 robustness에 중요하다.

## 오해하기 쉬운 내용

- Quicksort가 항상 $O(n \lg n)$인 것은 아니다. 기본 worst case는 $\Theta(n^{2})$이다.
- Randomized quicksort도 worst-case running time 자체는 $\Theta(n^{2})$다. 다만 expected running time이 좋다.
- `PARTITION` 이후 pivot은 최종 위치에 있지만, 양쪽 partitions 내부는 아직 정렬되어 있지 않다.
- 각 partition이 완벽히 반반이어야 $O(n \lg n)$인 것은 아니다. 일정 비율로만 나뉘어도 $O(n \lg n)$이다.
- Equal elements가 많은 입력에서는 기본 Lomuto `PARTITION`이 나쁜 split을 만들 수 있다. Three-way partitioning이 필요할 수 있다.
- Average-case analysis와 randomized analysis는 다르다. 전자는 input permutation 분포를 가정하고, 후자는 algorithm의 pivot choices를 확률 공간으로 둔다.

## 면접 질문

1. `PARTITION`의 loop invariant 네 영역을 설명하라.
2. Quicksort에서 combine 단계가 필요 없는 이유는 무엇인가?
3. 기본 quicksort가 sorted input에서 $\Theta(n^{2})$가 되는 이유를 설명하라.
4. 9-to-1 split이 반복되어도 quicksort가 $O(n \lg n)$인 이유를 recursion tree로 설명하라.
5. `RANDOMIZED-PARTITION`이 특정 input의 worst-case 유발을 어떻게 완화하는가?
6. Randomized quicksort의 worst-case와 expected running time을 구분해 설명하라.
7. $z_{i}$와 $z_{j}$가 비교되는 정확한 조건은 무엇인가?
8. 왜 $\Pr\left\{z_{i} is compared to z_{j}\right\} = 2/(j-i+1)$인가?
9. Equal keys가 많을 때 기본 partition이 왜 문제가 되고, three-way partitioning은 어떻게 해결하는가?
10. Hoare partition과 Lomuto partition의 차이를 high-level로 설명하라.
