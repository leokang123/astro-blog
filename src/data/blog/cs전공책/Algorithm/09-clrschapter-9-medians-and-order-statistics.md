---
title: "Chapter 9. Medians and Order Statistics"
order: 9
pubDatetime: 2026-05-17T00:13:00+09:00
modDatetime: 2026-05-17T00:13:00+09:00
description: "CLRS 알고리즘 정리: Chapter 9. Medians and Order Statistics"
tags:
  - "Algorithm"
  - "CS"
  - "CLRS"
---

## 개요

Chapter 9는 정렬 전체가 아니라 “몇 번째 원소가 필요한가”를 다룬다. `i`번째 order statistic은 `n`개 원소 중 `i`번째로 작은 원소다. 예를 들어 minimum은 first order statistic이고, maximum은 `n`th order statistic이다.

Median은 집합의 “halfway point”다. `n`이 홀수이면 median은 하나이고 위치는 $(n+1)/2$다. `n`이 짝수이면 lower median은 $\operatorname{floor}((n+1)/2)$, upper median은 $\operatorname{ceil}((n+1)/2)$ 위치에 있다. CLRS Chapter 9에서는 편의상 `the median`이라고 하면 lower median을 뜻한다.

Selection problem은 다음처럼 정의된다.

$$
\begin{aligned}
\text{Input:} n개의 distinct numbers로 이루어진 set A, 그리고 1 &\le i \le n \\
\text{Output:} A 안에서 정확히 i-1개 원소보다 큰 원소 x
\end{aligned}
$$

가장 단순한 방법은 heapsort나 merge sort로 전체를 $O(n \lg n)$에 정렬한 뒤 `i`번째 원소를 indexing하는 것이다. 하지만 selection은 전체 sorted order가 필요하지 않다. Chapter 9의 핵심은 “전체 정렬보다 적은 정보만으로 원하는 order statistic을 찾을 수 있다”는 점이다.

## 핵심 개념

| 용어 | 의미 | 검색 키워드 |
| --- | --- | --- |
| order statistic | 정렬했을 때 `i`번째로 작은 원소 | ith order statistic |
| selection problem | `i`번째 order statistic을 찾는 문제 | SELECT, selection |
| median | 가운데 order statistic, CLRS에서는 lower median | lower median, upper median |
| minimum / maximum | first / nth order statistic | MINIMUM |
| tournament argument | 비교를 경기처럼 보고 lower bound를 증명하는 방법 | lower bound |
| randomized selection | quicksort partition을 한쪽에만 재귀 적용하는 expected linear selection | RANDOMIZED-SELECT |
| worst-case linear selection | pivot을 median of medians로 골라 worst-case $O(n)$ 보장 | SELECT, median of medians |

## 세부 정리

### 9.1 Minimum and maximum

#### Minimum은 n-1 comparisons가 필요하고 충분하다

Minimum을 찾는 가장 직접적인 알고리즘은 지금까지 본 가장 작은 값을 유지하면서 배열을 한 번 훑는 것이다.

```text
MINIMUM(A)
1  min = A[1]
2  for i = 2 to A.length
3      if min > A[i]
4          min = A[i]
5  return min
```

이 알고리즘은 각 원소 `A[2]..A[n]`을 현재 minimum과 한 번씩 비교하므로 정확히 $n-1$ comparisons를 사용한다.

이 upper bound는 optimal하다. Lower bound는 `tournament argument`로 설명된다. Minimum을 찾는 비교 과정을 tournament라고 보면, 어떤 원소가 minimum이 아니려면 적어도 한 번은 “더 작은 원소”에게 져야 한다. Winner인 minimum을 제외한 $n-1$개 원소가 모두 적어도 한 번씩 져야 하므로, minimum을 확인하려면 최소 $n-1$ comparisons가 필요하다. 따라서 `MINIMUM`은 comparison 수 관점에서 optimal이다.

Maximum도 같은 논리로 $n-1$ comparisons가 필요하고 충분하다.

#### Minimum과 maximum을 동시에 찾기

Minimum과 maximum을 따로 찾으면

$$
(n-1) + (n-1) = 2n - 2
$$

comparisons가 든다. 이는 $\Theta(n)$이라 asymptotically optimal이지만, comparison 수를 더 줄일 수 있다.

핵심 idea는 원소를 pair 단위로 처리하는 것이다. 각 pair의 두 원소를 먼저 서로 비교해 작은 쪽과 큰 쪽을 나눈다. 그다음 작은 쪽만 current minimum과 비교하고, 큰 쪽만 current maximum과 비교한다. 이렇게 하면 원소 2개를 처리하는 데 comparisons가 3번만 필요하다.

```text
pair (x, y):
1  compare x and y
2  compare smaller(x,y) with current minimum
3  compare larger(x,y) with current maximum
```

초기화는 `n`의 parity에 따라 달라진다.

| 경우 | 초기화 | 이후 처리 |
| --- | --- | --- |
| `n` odd | 첫 원소를 minimum이자 maximum으로 둔다 | 나머지 $n-1$개를 pair로 처리 |
| `n` even | 처음 두 원소를 비교해 min/max 초기화 | 나머지 $n-2$개를 pair로 처리 |

Comparison 수는 다음과 같다.

| 경우 | comparisons |
| --- | --- |
| `n` odd | `3 floor(n/2)` |
| `n` even | $1 + 3(n-2)/2 = 3n/2 - 2$ |

따라서 모든 경우에 at most

$$
3 \lfloor n/2 \rfloor
$$

comparisons로 minimum과 maximum을 모두 찾을 수 있다. Exercise 9.1-2는 이 문제가 worst case에서 `ceil(3n/2) - 2` comparisons lower bound를 가진다는 점을 묻는다. 즉 pair 방식은 단순한 트릭이 아니라 comparison 수 관점에서 거의 정확한 최적 구조다.

#### Second smallest와 tournament tree

Exercise 9.1-1의 핵심은 second smallest를 찾을 때 모든 원소를 다시 볼 필요가 없다는 점이다. Minimum을 tournament 방식으로 찾으면, second smallest는 minimum에게 직접 진 원소들 중 하나다. Minimum은 tournament에서 $\lceil \lg n \rceil$개 정도의 상대만 직접 이긴다. 따라서 minimum을 찾는 $n-1$ comparisons에 더해, minimum에게 직접 진 후보들 사이에서 minimum을 찾으면 된다.

이 관점은 “order statistic을 찾을 때 전체 ordering을 만들 필요가 없다”는 Chapter 9의 큰 메시지와 연결된다.

### 9.2 Selection in expected linear time

#### Quicksort와 닮았지만 한쪽만 재귀한다

General selection problem은 minimum보다 어려워 보이지만, asymptotic running time은 minimum과 같은 $\Theta(n)$까지 내려갈 수 있다. Section 9.2의 `RANDOMIZED-SELECT`는 Chapter 7의 randomized quicksort와 같은 partition idea를 사용한다.

차이는 결정적이다.

| 알고리즘 | partition 후 처리 |
| --- | --- |
| `RANDOMIZED-QUICKSORT` | pivot 기준 왼쪽과 오른쪽을 모두 recursive하게 정렬 |
| `RANDOMIZED-SELECT` | 원하는 `i`번째 원소가 있는 한쪽 subarray만 recursive하게 탐색 |

Sorting은 전체 순서를 만들어야 하므로 양쪽을 모두 처리해야 한다. Selection은 pivot의 rank를 알게 되면 목표 order statistic이 어느 쪽에 있는지 알 수 있으므로, 반대쪽은 버릴 수 있다. 이 차이가 quicksort expected $\Theta(n \lg n)$과 randomized selection expected $\Theta(n)$의 핵심 차이다.

#### RANDOMIZED-SELECT procedure

`RANDOMIZED-SELECT(A, p, r, i)`는 subarray $A[p..r]$에서 `i`번째로 작은 원소를 반환한다.

```text
RANDOMIZED-SELECT(A, p, r, i)
1  if p == r
2      return A[p]
3  q = RANDOMIZED-PARTITION(A, p, r)
4  k = q - p + 1
5  if i == k
6      return A[q]
7  elseif i < k
8      return RANDOMIZED-SELECT(A, p, q-1, i)
9  else return RANDOMIZED-SELECT(A, q+1, r, i-k)
```

여기서 `RANDOMIZED-PARTITION`은 pivot을 무작위로 선택한 뒤, pivot보다 작거나 같은 원소를 왼쪽 $A[p..q-1]$에, pivot보다 큰 원소를 오른쪽 $A[q+1..r]$에 둔다. Pivot $A[q]$의 subarray 안 rank는

$$
k = q - p + 1
$$

이다.

세 경우가 생긴다.

| 조건 | 의미 | 다음 행동 |
| --- | --- | --- |
| $i = k$ | pivot이 정확히 원하는 order statistic | $A[q]$ 반환 |
| $i < k$ | 원하는 원소가 low side에 있음 | $A[p..q-1]$에서 $i$번째 선택 |
| $i > k$ | 원하는 원소가 high side에 있음 | $A[q+1..r]$에서 $i-k$번째 선택 |

$i-k$가 되는 이유는 high side로 넘어갈 때 이미 $A[p..q]$의 $k$개 원소가 원하는 원소보다 작거나 같다는 사실을 알고 있기 때문이다.

#### 왜 0-length recursive call이 생기지 않는가

Code만 보면 $A[p..q-1]$나 $A[q+1..r]$가 empty일 수 있어 보인다. 하지만 recursive call은 목표 원소가 그쪽에 있을 때만 발생한다.

- $q = p$이면 $k = 1$이다. 이때 $i < k$는 불가능하므로 empty low side로 가지 않는다.
- $q = r$이면 $k = r-p+1$이다. 이때 $i > k$는 불가능하므로 empty high side로 가지 않는다.

따라서 Exercise 9.2-1의 결론처럼 `RANDOMIZED-SELECT`는 0-length array로 recursive call을 만들지 않는다.

#### Worst case는 Θ(n^2)

`RANDOMIZED-SELECT`의 worst-case running time은 $\Theta(n^{2})$이다. 예를 들어 minimum을 찾고 있는데 매번 pivot이 remaining subarray의 largest element로 선택되면, partition 비용은

$$
n + (n-1) + (n-2) + \ldots + 1 = \Theta(n^{2})
$$

가 된다.

하지만 randomized algorithm에서는 특정 input 자체가 worst-case behavior를 강제하지 못한다. Worst case는 random choices가 계속 나쁜 경우이고, expected running time은 linear로 떨어진다.

#### Expected running time 분석의 큰 그림

$T(n)$을 `n`개 원소에서의 running time random variable이라고 하자. `RANDOMIZED-PARTITION`은 각 원소를 pivot으로 고를 확률이 동일하므로, pivot의 rank `k`는 `1..n` 중 하나가 될 확률이 각각 $1/n$이다.

CLRS는 indicator random variable을 둔다.

$$
\begin{aligned}
X_{k} &= I\left\{ subarray A[p..q] has exactly k elements \right\} \\
E[X_{k}] &= 1/n
\end{aligned}
$$

Pivot rank가 `k`이면 low side 크기는 $k-1$, high side 크기는 `n-k`다. Selection은 둘 중 하나에만 재귀하지만, upper bound를 위해 항상 더 큰 쪽으로 간다고 가정한다.

$$
T(n) \le \sum_{k=1}^{n} X_{k} \cdot T(\max(k-1, n-k)) + O(n)
$$

Expectation을 취하면

$$
\begin{aligned}
\text{E[T(n)]} \\
\le (1/n) \sum_{k=1}^{n} E[T(\max(k-1, n-k))] + O(n)
\end{aligned}
$$

이 된다. `max(k-1, n-k)`는 항상 대략 $n/2$ 이상 $n-1$ 이하이고, 각 크기는 거의 두 번씩 나타난다. 따라서 다음처럼 정리할 수 있다.

$$
E[T(n)] \le (2/n) \sum_{k=\lfloor n/2 \rfloor}^{n-1} E[T(k)] + O(n)
$$

이 recurrence는 substitution으로 $E[T(n)] = O(n)$임을 보일 수 있다. 직관적으로는 매 단계마다 partition에 $O(n)$을 쓰지만, recursive subproblem은 평균적으로 전체를 둘로 쪼개는 효과를 내며 한쪽만 따라가기 때문에 전체 기대 비용이 geometric하게 줄어든다.

$$
O(n) + O(3n/4) + O((3/4)^{2} n) + \ldots = O(n)
$$

위 geometric intuition은 엄밀한 증명은 아니지만, recurrence가 왜 linear로 수렴하는지 이해하는 데 좋다.

#### Expected linear time의 의미

`RANDOMIZED-SELECT`는 any order statistic, 특히 median을 expected linear time에 찾는다. 단, 이 절의 분석은 elements가 distinct하다고 가정한다. Repeated values가 있어도 idea는 확장되지만, rank와 partition 경계 처리를 더 조심해야 한다.

이 알고리즘은 실제로도 중요하다. Worst-case 보장은 Section 9.3의 deterministic `SELECT`가 더 강하지만, `RANDOMIZED-SELECT`는 구조가 단순하고 quicksort의 partition 구현을 재사용할 수 있어 practical selection algorithm의 기본 형태가 된다.

### 9.3 Selection in worst-case linear time

#### 목표: 좋은 pivot을 deterministic하게 보장하기

`RANDOMIZED-SELECT`는 expected $\Theta(n)$이지만, random choices가 계속 나쁘면 worst case가 $\Theta(n^{2})$이다. Section 9.3의 `SELECT`는 pivot을 아무렇게나 고르지 않고, 항상 “충분히 중앙에 가까운” pivot을 고르도록 만들어 worst-case $O(n)$을 보장한다.

이 pivot을 흔히 `median of medians`라고 부른다. 핵심은 pivot을 정확한 median으로 찾는 것이 아니라, partition 후 어느 한쪽도 너무 커지지 않도록 보장하는 것이다.

#### SELECT algorithm

`SELECT`는 $n > 1$개의 distinct elements에서 $i$번째로 작은 원소를 찾는다. $n = 1$이면 유일한 원소를 반환한다.

```text
SELECT(A, i)
1  divide n elements into floor(n/5) groups of 5
   plus at most one remaining group
2  find the median of each group
   by insertion-sorting each constant-size group
3  recursively use SELECT to find x,
   the median of the group medians
4  partition the input array around x
   let k be x's rank after partition
5  if i == k return x
   elseif i < k recursively select from low side
   else recursively select the (i-k)th element from high side
```

Step 2에서 group 크기가 최대 5이므로 각 group의 insertion sort는 $O(1)$이다. 전체 group 수가 $\lceil n/5 \rceil$이므로 medians를 찾는 총 비용은 $O(n)$이다.

#### Figure 9.1: median of medians가 버리는 원소 수

Figure 9.1은 원소를 5개씩 column으로 묶고, 각 group median과 median-of-medians $x$를 표시한다. 이 그림의 목적은 $x$보다 확실히 큰 원소와 확실히 작은 원소가 얼마나 되는지 세는 것이다.

![Figure 9.1](@/assets/images/cs-algorithm-031-figure-9-1-page-242.png)
*Figure 9.1 · PDF p. 242 · groups of 5에서 median-of-medians $x$가 보장하는 partition 품질*

각 full group of 5에서 median보다 큰 원소는 최소 2개, median 자신을 포함해 median 이상인 원소는 3개다. 이제 group medians의 median이 $x$이므로, medians 중 적어도 절반은 $x$ 이상이다.

따라서 $x$ 이상인 medians를 가진 group들에서는 각 group마다 최소 3개 원소가 $x$ 이상이다. 단, 두 group은 계산에서 제외한다.

- `n mod 5` 때문에 원소가 5개 미만인 leftover group
- `x` 자체가 들어 있는 group

이를 제외해도 $x$보다 큰 원소 수는 적어도

$$
3 \cdot (\operatorname{ceil}(\lceil n/5 \rceil / 2) - 2) \ge 3n/10 - 6
$$

이다. 대칭적으로 `x`보다 작은 원소도 적어도

$$
3n/10 - 6
$$

개 있다.

이 보장은 매우 중요하다. Partition 후 재귀가 어느 쪽으로 가더라도, 최대 subproblem 크기는

$$
n - (3n/10 - 6) = 7n/10 + 6
$$

을 넘지 않는다. 즉 `SELECT`는 worst case에서도 최소 약 30%를 버리고 최대 약 70% 쪽으로만 재귀한다.

#### Worst-case recurrence

`SELECT`의 단계별 비용은 다음과 같다.

| 단계 | 비용 |
| --- | --- |
| 5개씩 group 나누기 | $O(n)$ |
| 각 group median 찾기 | $O(n)$ |
| medians의 median 찾기 | $T(\lceil n/5 \rceil)$ |
| pivot $x$로 partition | $O(n)$ |
| 한쪽 subarray에서 selection | $T(7n/10 + 6)$ 이하 |

따라서 recurrence는

$$
T(n) \le T(\lceil n/5 \rceil) + T(7n/10 + 6) + O(n)
$$

이다. CLRS는 $n < 140$이면 $O(1)$로 처리한다고 놓고, $n \ge 140$에 대해 substitution으로 $T(n) \le cn$을 증명한다.

직관은 다음과 같다.

$$
\lceil n/5 \rceil + (7n/10 + 6) \approx 0.2n + 0.7n = 0.9n + 6
$$

두 recursive subproblem 크기의 합이 원래 크기보다 충분히 작다. 남는 $0.1n$의 여유가 매 단계의 linear work $O(n)$을 흡수한다. 그래서 recurrence는 $O(n \lg n)$이 아니라 $O(n)$으로 닫힌다.

CLRS의 substitution은 다음 형태다.

$$
\begin{aligned}
T(n) \\
\le c \lceil n/5 \rceil + c(7n/10 + 6) + an \\
\le cn/5 + c + 7cn/10 + 6c + an \\
= 9cn/10 + 7c + an \\
= cn + (-cn/10 + 7c + an)
\end{aligned}
$$

$n \ge 140$이고 $c$를 충분히 크게, 예를 들어 $c \ge 20a$로 잡으면 $(-cn/10 + 7c + an) \le 0$이 되어 $T(n) \le cn$이 유지된다. 여기서 $140$ 자체가 마법적인 숫자는 아니고, $70$보다 충분히 큰 상수면 증명을 맞출 수 있다.

#### 왜 group size 5인가

Group size 5는 proof가 linear로 닫히게 만드는 작은 홀수 크기다. Exercise 9.3-1은 group of 7로도 linear time이 가능하지만, group of 3으로는 linear time이 되지 않음을 묻는다.

직관적으로 group of 3이면 median-of-medians가 보장하는 제거량이 너무 작다. Recurrence가 대략

$$
T(n) \le T(n/3) + T(2n/3) + O(n)
$$

꼴이 되어 subproblem 크기 합이 거의 $n$이므로 $O(n)$으로 닫히지 않고 $O(n \lg n)$에 가까운 형태가 된다. 반면 group of 5는 $T(n/5) + T(7n/10) + O(n)$처럼 합이 $0.9n$ 수준이라 linear proof가 가능하다.

#### Selection은 comparison lower bound를 피한다

`SELECT`와 `RANDOMIZED-SELECT`는 comparison만 사용한다. 그런데 Chapter 8에서 comparison sorting은 $\Omega(n \lg n)$ lower bound를 가진다고 했다. 모순처럼 보이지만 아니다.

Sorting은 모든 원소의 total order를 알아야 한다. Selection은 `i`번째 원소와 그보다 작은 쪽/큰 쪽의 구분만 알면 된다. 즉 selection은 sorting보다 적은 정보를 요구한다. 그래서 comparison model 안에서도 linear-time selection이 가능하다.

이 결론은 실용적으로도 중요하다. Median이나 kth smallest element가 필요할 때 전체를 sort하고 indexing하는 방법은 쉽지만 asymptotically inefficient하다. 필요한 정보가 order statistic 하나라면 selection algorithm을 쓰는 편이 이론적으로 더 알맞다.

#### 9.3 Exercises가 확장하는 방향

Section 9.3의 exercises는 `SELECT`를 직접 변형하거나 응용하게 만든다.

| Exercise | 핵심 아이디어 |
| --- | --- |
| $9.3-1$ | group size 5 대신 7은 가능하지만 3은 linear proof가 깨짐 |
| $9.3-2$ | $n \ge 140$이면 `x`보다 큰/작은 원소가 최소 $\lceil n/4 \rceil$개임을 더 단순한 bound로 보이기 |
| $9.3-3$ | deterministic good pivot으로 quicksort worst-case $O(n \lg n)$ 만들기 |
| $9.3-4$ | `i`번째 원소를 찾는 비교 과정은 작은 원소 집합과 큰 원소 집합도 암묵적으로 구분함 |
| $9.3-5$ | worst-case linear-time median subroutine만 있으면 arbitrary order statistic도 linear time에 선택 가능 |
| $9.3-6$ | `kth quantiles`를 divide-and-conquer로 $O(n \lg k)$에 찾기 |
| $9.3-7$ | median 근처의 `k`개 원소를 linear time에 찾기 |
| $9.3-8$ | 이미 정렬된 두 배열의 전체 median을 $O(\lg n)$에 찾기 |

### Problems and chapter notes

#### Oil pipeline problem: median as an optimizer

Exercise 9.3-9의 oil pipeline 문제는 median이 단지 “가운데 원소”가 아니라 `sum of absolute deviations`를 최소화하는 optimizer라는 점을 보여 준다.

동서 방향(east-west) main pipeline을 놓고, 각 well에서 pipeline까지 남북 방향(north-south) spur를 연결한다고 하자. Main pipeline의 y-coordinate을 `y`라고 하면 총 spur 길이는

$$
\sum_{i} \lvert y - y_{i} \rvert
$$

이다. 이 값을 최소화하는 `y`는 wells의 y-coordinates의 median이다. 따라서 optimal pipeline 위치는 y-coordinate들의 median을 linear-time selection으로 찾아 결정할 수 있다. x-coordinate은 spur 길이에 영향을 주지 않는다.

`Figure 9.2`는 이 상황을 그림으로 보여 주지만, 본문 핵심 알고리즘보다는 문제 전용 시각화이므로 최종본에는 이미지로 포함하지 않았다. 검색을 위해 `Figure 9.2`, `oil pipeline`, `sum of absolute deviations`, `median minimizes L1 distance` 용어는 남겨 둔다.

#### Problem 9-1: Largest i numbers in sorted order

`i`개의 가장 큰 원소를 sorted order로 얻는 문제는 “selection만 할 것인가, sorting까지 할 것인가”의 경계를 보여 준다.

| 방법 | 아이디어 | worst-case time |
| --- | --- | --- |
| 전체 정렬 | 모든 `n`개를 sort한 뒤 largest `i`개 출력 | $O(n \lg n)$ |
| max-priority queue | heap build 후 `EXTRACT-MAX`를 `i`번 수행 | $O(n + i \lg n)$ |
| order-statistic + partial sort | `i`번째 largest를 찾아 partition, largest `i`개만 sort | $O(n + i \lg i)$ |

세 번째 방법이 Chapter 9의 메시지와 가장 잘 맞는다. 전체 order가 필요한 것은 largest `i`개 내부뿐이고, 나머지 `n-i`개는 relative order가 필요 없다. 따라서 selection으로 boundary를 찾은 뒤 필요한 부분만 정렬한다.

#### Problem 9-2: Weighted median

`weighted median`은 각 element $x_{i}$에 positive weight $w_{i}$가 있고

$$
\sum_{i} w_{i} = 1
$$

일 때 정의된다. Weighted lower median $x_{k}$는 $x_{k}$보다 작은 쪽의 weight 합이 $1/2$보다 작고, $x_{k}$보다 큰 쪽의 weight 합이 $1/2$ 이하인 원소다.

$$
\begin{aligned}
\sum_{x_{i} < x_{k}} w_{i} &< 1/2 \\
\sum_{x_{i} > x_{k}} w_{i} &\le 1/2
\end{aligned}
$$

모든 weight가 $1/n$이면 weighted median은 ordinary median과 같다.

Weighted median을 구하는 방법은 두 가지 관점이 있다.

| 방법 | 시간 | 설명 |
| --- | --- | --- |
| sorting 기반 | $O(n \lg n)$ | $x_{i}$를 정렬한 뒤 누적 weight가 $1/2$를 넘는 지점 찾기 |
| linear selection 기반 | $\Theta(n)$ worst case | median pivot으로 partition하며 양쪽 weight 합을 추적 |

Weighted median은 `1-dimensional post-office location problem`의 최적해다. 위치 `p`가 real number이고 비용이

$$
\sum_{i} w_{i} \lvert p - p_{i} \rvert
$$

라면 weighted median이 이 비용을 최소화한다. 2D에서 Manhattan distance

$$
d((x_{1},y_{1}),(x_{2},y_{2})) = \lvert x_{1} - x_{2} \rvert + \lvert y_{1} - y_{2} \rvert
$$

를 쓰면 x-coordinate과 y-coordinate이 분리되므로, 최적 위치는 x좌표의 weighted median과 y좌표의 weighted median을 각각 구해 조합하면 된다.

#### Problem 9-3: Small order statistics

`SELECT`는 worst-case $\Theta(n)$이지만 숨은 constant가 크다. `i`가 `n`에 비해 아주 작을 때는 더 적은 comparisons를 쓰는 전략이 가능하다.

핵심 idea는 처음에 $\lfloor n/2 \rfloor$개의 disjoint pairwise comparisons를 수행해, 각 pair의 smaller elements만 모은 집합으로 재귀하는 것이다. `i`번째로 작은 원소는 각 pair의 큰 쪽보다는 작은 쪽 후보들에 더 강하게 관련된다.

Problem 9-3의 recurrence는 작은 `i`에 유리한 구조를 만든다.

$$
\begin{aligned}
U_{i}(n) &= \\
  T(n) if i &\ge n/2 \\
  \lfloor n/2 \rfloor + U_{i}(\lceil n/2 \rceil) + T(2i) otherwise
\end{aligned}
$$

특히 `i`가 constant이면 $n + O(\lg n)$ comparisons까지 내려간다. 이는 “모든 order statistic이 똑같이 어렵지 않다”는 점을 보여 준다.

#### Problem 9-4: Alternative analysis of randomized selection

Problem 9-4는 `RANDOMIZED-SELECT`를 randomized quicksort 분석처럼 indicator random variables로 다시 분석한다. 원소를 sorted order 기준으로

```text
z_1, z_2, ..., z_n
```

이라 두고, $z_{k}$를 찾는 동안 $z_{i}$와 $z_{j}$가 비교되는 사건을

$$
X_{ijk} = I\left\{ z_{i} is compared with z_{j} while finding z_{k} \right\}
$$

로 둔다. 이후 total comparisons $X_{k}$의 expectation을 합으로 계산해

$$
E[X_{k}] \le 4n
$$

을 보이고, 따라서 `RANDOMIZED-SELECT`가 expected $O(n)$임을 다시 결론낸다. Section 9.2의 recurrence 분석과 같은 결론을 다른 확률적 시각에서 얻는 셈이다.

#### Chapter notes에서 남길 점

Chapter notes는 median/selection 알고리즘의 이론적 배경을 짧게 연결한다.

- Worst-case linear-time median-finding algorithm은 Blum, Floyd, Pratt, Rivest, Tarjan의 결과로 알려져 있다.
- Fast randomized version은 Hoare의 selection algorithm 계열과 연결된다.
- Median을 찾는 데 정확히 몇 comparisons가 필요한지는 아직 완전히 닫힌 문제가 아니다.
- 알려진 bounds는 linear이지만, lower bound와 upper bound 사이의 constant gap이 남아 있다.

즉 Chapter 9의 큰 결론은 “selection은 linear time에 가능하다”이지만, “median에 필요한 정확한 optimal comparison 수”는 별도의 정교한 연구 주제다.

## 복잡도

| 문제/알고리즘 | 시간 또는 comparisons | 조건/특징 |
| --- | --- | --- |
| Minimum | $n-1$ comparisons | optimal by tournament argument |
| Maximum | $n-1$ comparisons | minimum과 대칭 |
| Minimum and maximum separately | $2n-2$ comparisons | 단순하지만 비교 수가 많음 |
| Simultaneous min/max | at most `3 floor(n/2)` comparisons | pairwise comparison으로 개선 |
| Sort and index selection | $O(n \lg n)$ | 전체 순서를 만들기 때문에 과함 |
| `RANDOMIZED-SELECT` expected | $\Theta(n)$ | random pivot, one-side recursion |
| `RANDOMIZED-SELECT` worst case | $\Theta(n^{2})$ | 계속 나쁜 pivot 선택 시 |
| `SELECT` worst case | $O(n)$ | median of medians, groups of 5 |
| Largest `i` sorted | $O(n + i \lg i)$ | boundary selection 후 부분 정렬 |
| Weighted median | $\Theta(n)$ worst case | linear-time median/selection 활용 |

## 연결 관계

- Chapter 7의 `PARTITION`과 `RANDOMIZED-PARTITION`이 Chapter 9의 selection algorithms에 그대로 이어진다.
- Chapter 8의 comparison sorting lower bound는 sorting에 대한 lower bound이지 selection에 대한 lower bound가 아니다.
- Chapter 6의 heap은 largest `i` elements를 얻는 alternative로 등장한다.
- Median은 optimization 문제에서 `L1 distance`, `sum of absolute deviations`, `post-office location problem`과 연결된다.
- `RANDOMIZED-SELECT` 분석은 Chapter 5의 indicator random variables와 expectation, Chapter 7의 randomized quicksort 분석과 연결된다.
- Part III의 data structures로 넘어가면 order-statistic tree처럼 동적으로 order statistic을 관리하는 자료구조가 등장한다.

## 오해하기 쉬운 내용

- Median을 찾으려면 전체를 정렬해야 한다고 생각하기 쉽지만, selection은 sorting보다 적은 정보를 요구하므로 linear time에 가능하다.
- `RANDOMIZED-SELECT`의 expected $\Theta(n)$은 worst-case $\Theta(n^{2})$가 없다는 뜻이 아니다. 나쁜 random choices가 이어지면 worst case는 quadratic이다.
- `SELECT`의 pivot은 진짜 전체 median을 바로 아는 것이 아니다. Medians의 median을 찾아 충분히 좋은 split을 보장하는 것이다.
- Group size 5는 임의의 장식적 선택이 아니다. Recurrence가 $O(n)$으로 닫히도록 제거량을 보장하는 최소급 구조다.
- $\Omega(n \lg n)$ comparison sorting lower bound는 selection에 적용되지 않는다. Selection은 total order를 출력하지 않는다.
- Lower median과 upper median을 구분해야 한다. CLRS는 편의상 `the median`을 lower median으로 사용한다.
- Weighted median은 ordinary median과 다르다. 값의 개수가 아니라 weight 누적이 절반을 넘는 위치가 중요하다.

## 면접 질문

1. $i$th order statistic과 median을 정의해 보라. 짝수 $n$에서 lower median과 upper median은 어떻게 다른가?
2. Minimum을 찾는 데 왜 $n-1$ comparisons가 lower bound인가?
3. Minimum과 maximum을 동시에 찾을 때 왜 pairwise 처리로 $2n-2$보다 줄일 수 있는가?
4. `RANDOMIZED-SELECT`와 `RANDOMIZED-QUICKSORT`는 partition 후 재귀 방식이 어떻게 다른가?
5. `RANDOMIZED-SELECT`에서 pivot rank가 $k$일 때 $i > k$이면 왜 high side에서 $i-k$번째를 찾는가?
6. `RANDOMIZED-SELECT`의 expected time은 linear인데 worst case는 왜 $\Theta(n^{2})$인가?
7. `SELECT`에서 median of medians를 쓰는 이유는 무엇인가?
8. Figure 9.1의 계산에서 왜 pivot $x$보다 큰 원소와 작은 원소가 각각 최소 $3n/10 - 6$개 보장되는가?
9. $T(n) \le T(\lceil n/5 \rceil) + T(7n/10 + 6) + O(n)$ recurrence가 왜 $O(n)$으로 풀리는가?
10. Weighted median은 ordinary median과 무엇이 다르고, 어떤 optimization 문제와 연결되는가?
