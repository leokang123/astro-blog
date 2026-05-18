---
title: "Chapter 15. Dynamic Programming"
order: 15
pubDatetime: 2026-05-17T00:07:00+09:00
modDatetime: 2026-05-17T00:07:00+09:00
description: "CLRS 알고리즘 정리: Chapter 15. Dynamic Programming"
tags:
  - "Algorithm"
  - "CS"
  - "CLRS"
---

## 개요

`dynamic programming`은 subproblems의 solutions를 결합해 원래 문제를 푸는 방법이라는 점에서 `divide-and-conquer`와 닮았다. 차이는 subproblems의 성격이다. Divide-and-conquer는 보통 disjoint subproblems를 만들고, 각 subproblem을 독립적으로 풀어 합친다. Dynamic programming은 subproblems가 overlap할 때, 즉 여러 상위 문제가 같은 subsubproblem을 반복해서 필요로 할 때 효과적이다.

Naive recursion은 같은 subproblem을 여러 번 다시 푼다. Dynamic programming은 각 subproblem을 한 번만 풀고, 답을 table에 저장해 재사용한다. 이 장에서 말하는 “programming”은 code 작성이 아니라 tabular method를 뜻한다.

Dynamic programming은 주로 optimization problems에 적용된다. 가능한 solutions가 많고, 각 solution에 value가 있으며, minimum 또는 maximum value를 갖는 optimal solution을 찾는 상황이다. Optimal value를 달성하는 solution은 여러 개일 수 있으므로, CLRS는 “the optimal solution”보다 “an optimal solution”이라는 표현을 쓴다.

DP 설계의 표준 4단계는 다음과 같다.

1. Characterize the structure of an optimal solution.
2. Recursively define the value of an optimal solution.
3. Compute the value of an optimal solution, usually bottom-up.
4. Construct an optimal solution from computed information.

Steps 1-3만으로 optimal value를 구할 수 있다. 실제 solution 자체가 필요하면 step 4를 위해 choice table 같은 추가 정보를 함께 저장한다.

## 핵심 개념

| 용어 | 의미 | 검색 키워드 |
| --- | --- | --- |
| dynamic programming | overlapping subproblems를 한 번씩 풀고 저장해 재사용하는 방법 | dynamic programming, DP |
| overlapping subproblems | 여러 recursive branches가 같은 subproblem을 공유하는 성질 | overlapping subproblems |
| optimal substructure | optimal solution이 subproblems의 optimal solutions를 포함하는 성질 | optimal substructure |
| memoization | top-down recursion에 cache/table을 붙여 중복 계산을 피하는 기법 | memoization |
| bottom-up method | 작은 subproblems부터 table을 채우는 DP 구현 방식 | bottom-up dynamic programming |
| subproblem graph | distinct subproblems와 dependency를 나타내는 directed graph | subproblem graph |
| reconstruction | optimal value table과 choice table로 실제 optimal solution을 복원하는 과정 | reconstructing a solution |
| rod cutting | 길이별 price table에서 rod cutting revenue를 maximize하는 DP 예제 | rod cutting |
| matrix-chain multiplication | matrix product parenthesization cost를 minimize하는 DP 예제 | matrix-chain multiplication |
| longest common subsequence | 두 sequences의 longest subsequence를 찾는 DP 예제 | LCS |
| optimal binary search tree | search probabilities가 주어졌을 때 expected search cost를 minimize하는 BST | optimal BST |

## 세부 정리

### 15.1 Rod cutting

#### 문제 정의

`rod-cutting problem`은 길이 `n`인 rod와 price table $p_{i}$가 주어졌을 때, rod를 여러 조각으로 잘라 팔아 얻을 수 있는 maximum revenue $r_{n}$을 구하는 문제다. 각 cut은 free라고 가정한다. 만약 $p_{n}$ 자체가 충분히 크다면 optimal solution은 rod를 전혀 자르지 않는 것이다.

![Figure 15.1](@/assets/images/cs-algorithm-071-figure-15-1-page-381.png)
*Figure 15.1 · PDF p. 381 · rod length별 sample price table*

Figure 15.1의 sample price table에서는 길이 1부터 10까지 가격이 주어진다. 예를 들어 길이 4의 rod는 자르지 않으면 revenue $p_{4} = 9$지만, 길이 2 두 조각으로 자르면 $p_{2} + p_{2} = 5 + 5 = 10$이 되어 더 좋다.

![Figure 15.2](@/assets/images/cs-algorithm-072-figure-15-2-page-382.png)
*Figure 15.2 · PDF p. 382 · 길이 4 rod를 자르는 8가지 방법과 optimal decomposition*

길이 `n`의 rod는 각 위치 `1, 2, ..., n-1`에서 cut할지 말지를 독립적으로 선택할 수 있으므로 총 $2^{n-1}$가지 cutting patterns가 있다. 길이 4에서는 Figure 15.2처럼 8가지가 있고, optimal은 $4 = 2 + 2$다.

#### Optimal substructure

Rod를 첫 cut에서 길이 `i`와 `n-i`로 나누면, 양쪽 조각은 다시 같은 rod-cutting problem의 smaller instance가 된다. 전체 revenue를 maximize하려면 각 조각도 optimal하게 잘라야 한다. 이것이 `optimal substructure`다.

CLRS는 먼저 양쪽 조각을 모두 subproblems로 보는 recurrence를 제시한다.

$$
r_{n} = \max(p_{n}, r_{1} + r_{n-1}, r_{2} + r_{n-2}, \ldots, r_{n-1} + r_{1}) (15.1)
$$

하지만 더 단순하게, decomposition을 “왼쪽에서 처음 잘라낸 첫 조각 length `i` + 나머지 length `n-i`의 optimal decomposition”으로 볼 수 있다. 첫 조각은 더 자르지 않고, remainder만 subproblem으로 둔다.

$$
\begin{aligned}
r_{n} &= max_{1 \le i \le n} (p_{i} + r_{n-i}) (15.2) \\
r_{0} &= 0
\end{aligned}
$$

이 식은 이후 algorithm 구현의 핵심이다.

#### Naive top-down recursion

`CUT-ROD`는 recurrence (15.2)를 그대로 recursive procedure로 옮긴 것이다.

```text
CUT-ROD(p, n)
1  if n == 0
2      return 0
3  q = -∞
4  for i = 1 to n
5      q = max(q, p[i] + CUT-ROD(p, n-i))
6  return q
```

이 procedure는 정답은 맞지만 매우 느리다. 같은 `CUT-ROD(p, j)`를 여러 경로에서 반복 호출하기 때문이다.

![Figure 15.3](@/assets/images/cs-algorithm-073-figure-15-3-page-385.png)
*Figure 15.3 · PDF p. 385 · `CUT-ROD(p, 4)`의 recursion tree와 중복 subproblems*

Figure 15.3에서 label은 remaining rod length다. 같은 label의 nodes가 여러 번 등장한다는 것은 같은 subproblem을 반복해서 푼다는 뜻이다. 총 호출 수 $T(n)$은

$$
\begin{aligned}
T(0) &= 1 \\
T(n) &= 1 + \sum_{j=0}^{n-1} T(j) (15.3) \\
T(n) &= 2^{n} (15.4)
\end{aligned}
$$

이므로 `CUT-ROD`의 running time은 exponential이다.

#### Memoization: top-down DP

`memoization`은 recursive structure는 유지하되, 각 subproblem의 answer를 table에 저장하는 방식이다. 이미 계산한 $r[n]$이 있으면 recursive computation을 다시 하지 않고 바로 반환한다.

```text
MEMOIZED-CUT-ROD(p, n)
1  let r[0..n] be a new array
2  for i = 0 to n
3      r[i] = -∞
4  return MEMOIZED-CUT-ROD-AUX(p, n, r)

MEMOIZED-CUT-ROD-AUX(p, n, r)
1  if r[n] >= 0
2      return r[n]
3  if n == 0
4      q = 0
5  else q = -∞
6      for i = 1 to n
7          q = max(q, p[i] + MEMOIZED-CUT-ROD-AUX(p, n-i, r))
8  r[n] = q
9  return q
```

$r[i] = -\infty$는 unknown marker다. Rod-cutting revenue는 nonnegative이므로 $r[n] \ge 0$이면 이미 계산된 값임을 알 수 있다.

#### Bottom-up DP

`BOTTOM-UP-CUT-ROD`는 작은 length부터 차례로 table을 채운다.

```text
BOTTOM-UP-CUT-ROD(p, n)
1  let r[0..n] be a new array
2  r[0] = 0
3  for j = 1 to n
4      q = -∞
5      for i = 1 to j
6          q = max(q, p[i] + r[j-i])
7      r[j] = q
8  return r[n]
```

Subproblem size `j`를 1부터 `n`까지 증가시키면, $r[j]$를 계산할 때 필요한 모든 $r[j-i]$는 이미 계산되어 있다. Top-down memoization과 bottom-up method는 asymptotic running time이 둘 다 $\Theta(n^{2})$이다. Bottom-up은 procedure call overhead가 없어 constant factor가 더 좋은 경우가 많다. 다만 top-down은 실제로 reachable한 subproblems만 방문하므로, 모든 possible subproblems가 필요하지 않은 특수한 경우에는 이점이 있다.

#### Subproblem graph

`subproblem graph`는 distinct subproblems와 dependency를 나타내는 directed graph다. Vertex는 subproblem 하나, edge `(x, y)`는 subproblem `x`를 풀기 위해 subproblem `y`의 answer가 직접 필요함을 뜻한다.

![Figure 15.4](@/assets/images/cs-algorithm-074-figure-15-4-page-388.png)
*Figure 15.4 · PDF p. 388 · rod cutting $n = 4$의 subproblem graph*

Figure 15.4는 Figure 15.3의 recursion tree에서 같은 label의 nodes를 하나로 collapse한 것이다. DP는 이 collapsed graph의 vertices를 한 번씩만 푼다.

Bottom-up DP는 subproblem graph의 dependency가 먼저 해결되는 순서로 vertices를 처리한다. Graph 용어로는 reverse topological sort 또는 transpose graph의 topological sort에 해당한다. Top-down memoization은 이 graph를 depth-first search처럼 탐색하면서, 이미 방문한 vertex를 다시 계산하지 않는 방식으로 볼 수 있다.

일반적으로 subproblem 하나를 계산하는 시간이 그 vertex의 out-degree에 비례하면, DP running time은 $\Theta(\lvert V \rvert + \lvert E \rvert)$로 볼 수 있다.

#### Reconstructing a solution

지금까지 $r[n]$은 optimal value만 알려준다. 실제 cutting pattern을 출력하려면 각 subproblem에서 어떤 first cut이 optimal value를 만들었는지 저장해야 한다.

```text
EXTENDED-BOTTOM-UP-CUT-ROD(p, n)
1  let r[0..n] and s[0..n] be new arrays
2  r[0] = 0
3  for j = 1 to n
4      q = -∞
5      for i = 1 to j
6          if q < p[i] + r[j-i]
7              q = p[i] + r[j-i]
8              s[j] = i
9      r[j] = q
10 return r and s
```

$s[j]$는 length `j` rod를 optimal하게 자를 때 첫 조각의 length다. 이를 따라가면 actual optimal decomposition을 복원할 수 있다.

```text
PRINT-CUT-ROD-SOLUTION(p, n)
1  (r, s) = EXTENDED-BOTTOM-UP-CUT-ROD(p, n)
2  while n > 0
3      print s[n]
4      n = n - s[n]
```

Sample table에서 $n = 10$이면 $s[10] = 10$이라 cut 없이 $10$만 출력한다. $n = 7$이면 $1, 6$을 출력해 optimal revenue $18$의 한 decomposition을 준다.

### 15.2 Matrix-chain multiplication

`matrix-chain multiplication`은 행렬들 `A_1 A_2 ... A_n`의 곱을 실제로 계산하는 문제가 아니라, 같은 곱을 최소 scalar multiplications로 계산하도록 parenthesization을 정하는 문제다. Matrix multiplication은 associative이므로 어느 괄호 구조를 택해도 결과 행렬은 같지만, 중간 행렬의 dimension이 달라져 cost는 크게 달라질 수 있다.

#### Problem setting

입력은 matrices chain $\langle A_1, A_2, \ldots, A_n\rangle$이며, 각 $A_{i}$의 dimension은 $p_{i-1} \times p_i$다. 목표는 product

```text
A_1 A_2 ... A_n                                                   (15.5)
```

를 계산하는 fully parenthesized form 중 scalar multiplications 수가 최소인 것을 찾는 것이다.

두 행렬 $A$와 $B$를 곱하려면 $A.columns = B.rows$여야 한다. $A$가 $p \times q$, $B$가 $q \times r$이면 결과는 $p \times r$이고 standard matrix multiplication의 scalar multiplications 수는 $pqr$이다.

예를 들어 `A_1: 10 x 100`, `A_2: 100 x 5`, `A_3: 5 x 50`이면:

| Parenthesization | Cost |
|---|---:|
| `((A_1 A_2) A_3)` | $10\cdot 100\cdot 5 + 10\cdot 5\cdot 50 = 7,500$ |
| `(A_1 (A_2 A_3))` | $100\cdot 5\cdot 50 + 10\cdot 100\cdot 50 = 75,000$ |

같은 결과를 얻지만 첫 번째 parenthesization이 10배 빠르다. 그래서 optimal order를 미리 찾는 비용은 실제 large matrix multiplication에서 충분히 보상될 수 있다.

#### Number of parenthesizations

$P(n)$을 $n$개 행렬 chain의 possible full parenthesizations 수라고 하자. $n = 1$이면 방법은 1개뿐이고, $n \ge 2$이면 어떤 split $k$에서 왼쪽과 오른쪽 fully parenthesized products를 곱한다.

$$
\begin{aligned}
P(n) &= 1 if n = 1 \\
P(n) &= \sum_{k=1}^{n-1} P(k) P(n-k) if n \ge 2 (15.6)
\end{aligned}
$$

이 recurrence는 Catalan numbers와 같은 계열이며 exponential하게 증가한다. CLRS는 $\Omega(4^{n} / n^{3/2})$ 성장을 언급하고, 더 단순하게도 $\Omega(2^{n})$임을 보일 수 있다고 한다. 따라서 all parenthesizations exhaustive search는 비효율적이다.

#### Optimal substructure

$A_{i::j}$를 product $A_i A_{i+1} \cdots A_j$의 결과 행렬이라고 쓰자. $i < j$인 nontrivial chain은 반드시 어떤 $k$ ($i \le k < j$)에서 split된다.

$$
(A_{i} \ldots A_{k}) (A_{k+1} \ldots A_{j})
$$

만약 `A_i ... A_j`의 optimal parenthesization이 `k`에서 split된다면, 왼쪽 subchain `A_i ... A_k`의 parenthesization도 그 subproblem의 optimal solution이어야 한다. 더 싼 왼쪽 parenthesization이 존재한다면 전체 solution 안에서 교체해 전체 cost를 낮출 수 있으므로 contradiction이다. 오른쪽 `A_{k+1} ... A_j`도 동일하다.

이 `cut-and-paste` argument가 matrix-chain multiplication의 optimal substructure다. 중요한 점은 optimal split `k`를 미리 모르므로 가능한 모든 `k`를 고려해야 한다는 것이다.

#### Recursive value definition

$m[i,j]$를 `A_i ... A_j`를 계산하는 데 필요한 minimum scalar multiplications 수라고 하자. 한 행렬만 있을 때는 곱셈이 필요 없으므로:

$$
m[i,i] = 0
$$

$i < j$일 때 split이 $k$라면, 왼쪽 cost $m[i,k]$, 오른쪽 cost $m[k+1,j]$, 마지막 multiplication cost $p_{i-1}p_kp_j$가 더해진다. 따라서:

$$
\begin{aligned}
m[i,j] &= 0 if i = j \\
m[i,j] &= min_{i \le k < j} { m[i,k] + m[k+1,j] + p_{i-1} p_{k} p_{j} } if i < j (15.7)
\end{aligned}
$$

또한 $s[i,j]$를 $m[i,j]$의 minimum을 달성한 split index `k`로 저장한다. `m` table은 optimal value를, `s` table은 optimal solution reconstruction을 담당한다.

#### Bottom-up computation

Distinct subproblems는 $1 \le i \le j \le n$인 pair들이므로 $\Theta(n^{2})$개다. 하지만 recurrence를 naive recursion으로 계산하면 같은 $m[i,j]$를 여러 recursion branch에서 반복 계산한다. 이 overlapping subproblems 때문에 tabular bottom-up dynamic programming을 쓴다.

`MATRIX-CHAIN-ORDER(p)`는 chain length `l`을 2부터 증가시키며 `m` table을 채운다. $m[i,j]$는 자신보다 짧은 chains의 값 $m[i,k]$, $m[k+1,j]$에만 의존하므로, length 순서로 채우면 모든 dependency가 이미 준비되어 있다.

```text
MATRIX-CHAIN-ORDER(p)
1  n = p.length - 1
2  let m[1..n, 1..n] and s[1..n-1, 2..n] be new tables
3  for i = 1 to n
4      m[i,i] = 0
5  for l = 2 to n
6      for i = 1 to n-l+1
7          j = i+l-1
8          m[i,j] = ∞
9          for k = i to j-1
10             q = m[i,k] + m[k+1,j] + p[i-1] p[k] p[j]
11             if q < m[i,j]
12                 m[i,j] = q
13                 s[i,j] = k
14 return m and s
```

![Figure 15.5](@/assets/images/cs-algorithm-075-figure-15-5-page-397.png)
*Figure 15.5 · PDF p. 397 · `MATRIX-CHAIN-ORDER`가 만든 `m` table과 `s` table*

Figure 15.5는 dimensions $\langle 30, 35, 15, 5, 10, 20, 25\rangle$를 가진 6개 matrices에 대한 결과다. $m[1,6] = 15{,}125$가 전체 optimal scalar multiplications 수다. Table은 main diagonal이 수평이 되도록 회전되어 있으며, 아래 row에서 짧은 chains를 먼저 채우고 위쪽으로 갈수록 긴 chains를 채운다.

예를 들어 $m[2,5]$를 계산할 때 가능한 split은 $k = 2, 3, 4$다.

$$
\begin{aligned}
m[2,5] &= \min( \\
  m[2,2] + m[3,5] + p_{1} p_{2} p_{5}, \\
  m[2,3] + m[4,5] + p_{1} p_{3} p_{5}, \\
  m[2,4] + m[5,5] + p_{1} p_{4} p_{5} \\
\text{)} \\
= \min(13,000, 7,125, 11,375) \\
&= 7,125
\end{aligned}
$$

Nested loop가 `l`, `i`, `k` 세 겹이므로 running time은 $\Theta(n^{3})$, `m`과 `s` tables 저장 공간은 $\Theta(n^{2})$이다. Exponential parenthesization enumeration보다 훨씬 작다.

#### Constructing an optimal solution

`MATRIX-CHAIN-ORDER`는 optimal cost만 바로 알려주고, 실제 곱셈 순서는 $s$ table을 재귀적으로 따라가며 출력한다. $s[i,j] = k$라면 $A_i \cdots A_j$의 마지막 multiplication은 $A_{i::k}$와 $A_{k+1::j}$를 곱하는 것이다.

```text
PRINT-OPTIMAL-PARENS(s, i, j)
1  if i == j
2      print "A"i
3  else print "("
4      PRINT-OPTIMAL-PARENS(s, i, s[i,j])
5      PRINT-OPTIMAL-PARENS(s, s[i,j]+1, j)
6      print ")"
```

Figure 15.5의 example에서 `PRINT-OPTIMAL-PARENS(s, 1, 6)`은 다음 parenthesization을 출력한다.

```text
((A_1(A_2A_3))((A_4A_5)A_6))
```

이 구조는 “optimal value를 계산하는 table”과 “choice를 복원하는 table”을 분리하는 전형적인 DP 패턴이다. Rod cutting의 `r`/`s` arrays와 같은 아이디어가 matrix chain에서는 2차원 intervals table로 확장된다.

### 15.3 Elements of dynamic programming

Dynamic programming이 적용되는 optimization problem에는 보통 두 가지 핵심 성질이 필요하다.

1. `optimal substructure`: 전체 optimal solution 안에 subproblems의 optimal solutions가 들어 있다.
2. `overlapping subproblems`: natural recursive solution이 같은 subproblem을 여러 번 다시 푼다.

두 성질은 서로 다른 축이다. Subproblems가 “independent”하다는 말은 같은 parent problem 안의 서로 다른 subproblems가 자원을 공유하지 않아 서로의 해를 망치지 않는다는 뜻이고, “overlapping”은 여러 parent contexts에서 동일한 subproblem이 반복 등장한다는 뜻이다.

#### Optimal substructure

Optimization problem이 `optimal substructure`를 가진다는 것은, 전체 문제의 optimal solution을 어떤 선택(choice)으로 분해했을 때 남는 subproblems도 각각 optimal solution이어야 한다는 뜻이다. Dynamic programming은 이 성질을 이용해 작은 optimal solutions를 먼저 만들고, 그 위에서 전체 optimal solution을 선택한다.

CLRS가 제시하는 일반적인 발견 절차는 다음과 같다.

| 단계 | 질문 | 예 |
|---|---|---|
| 1 | Solution이 어떤 choice를 포함하는가? | rod의 first cut, matrix chain의 split index `k` |
| 2 | optimal choice가 주어졌다고 가정하면 무엇이 남는가? | remaining rod, left/right subchains |
| 3 | subproblem space를 어떻게 잡아야 충분한가? | rod length `i`, interval $A_{i}\ldots A_{j}$ |
| 4 | subproblem solution도 optimal임을 어떻게 보이는가? | 더 좋은 subsolution을 잘라 붙이면 전체도 더 좋아진다는 `cut-and-paste` contradiction |

Subproblem space는 가능한 한 단순하게 시작하되, optimal solution에서 실제로 필요한 subproblems를 모두 포함해야 한다. Rod cutting은 length `i`만으로 충분했다. 반면 matrix-chain multiplication에서 subproblem을 $A_{1}\ldots A_{j}$ 꼴로만 제한하면, split 후 오른쪽 subchain $A_{k+1}\ldots A_{j}$를 표현할 수 없다. 그래서 양 끝 `i`, `j`가 모두 변하는 interval subproblem $A_{i}\ldots A_{j}$가 필요하다.

Optimal substructure의 모양은 문제마다 두 측면에서 달라진다.

| 문제 | 한 optimal solution이 쓰는 subproblems 수 | 각 subproblem에서 고려할 choices |
|---|---:|---:|
| rod cutting | 1개, `n-i` length | first piece length `i`, 최대 `n`개 |
| matrix-chain multiplication | 2개, left/right subchains | split `k`, 최대 `j-i`개 |

따라서 DP running time은 대략 “distinct subproblems 수 × subproblem마다 확인하는 choices 수”로 예측할 수 있다. Rod cutting은 $\Theta(n)$ subproblems에 각 $O(n)$ choices라 $O(n^{2})$, matrix-chain multiplication은 $\Theta(n^{2})$ subproblems에 각 $O(n)$ choices라 $O(n^{3})$이다. 같은 분석은 `subproblem graph`에서도 볼 수 있다. Vertices는 subproblems이고, edges 또는 incident choices는 한 subproblem을 계산할 때 참조하는 dependencies다.

#### DP와 greedy의 차이

Dynamic programming과 greedy algorithms는 둘 다 optimal substructure를 이용한다. 차이는 choice를 언제 하느냐다.

| 접근 | Choice timing | 계산 방식 |
|---|---|---|
| dynamic programming | subproblems를 먼저 풀고 가능한 choices를 비교 | informed choice |
| greedy algorithm | 지금 가장 좋아 보이는 choice를 먼저 고르고 남은 subproblem만 풂 | locally best choice |

따라서 optimal substructure만으로 DP가 정답이라는 뜻은 아니다. Greedy가 되는지는 Chapter 16에서 별도의 greedy-choice property를 증명해야 한다.

#### Subtleties: shortest path vs longest simple path

Optimal substructure는 직관적으로 비슷해 보여도 깨질 수 있다. CLRS는 directed graph에서 `unweighted shortest path`와 `unweighted longest simple path`를 비교한다.

Shortest path는 optimal substructure를 가진다. `u`에서 `v`까지의 shortest path가 중간 vertex `w`를 지난다면, `u`에서 `w`까지의 subpath와 `w`에서 `v`까지의 subpath도 각각 shortest path여야 한다. 더 짧은 subpath가 있다면 그것을 cut-and-paste해서 전체 path를 더 짧게 만들 수 있기 때문이다.

![Figure 15.6](@/assets/images/cs-algorithm-076-figure-15-6-page-403.png)
*Figure 15.6 · PDF p. 403 · longest simple path가 optimal substructure를 갖지 않는 반례*

Longest simple path는 다르다. Figure 15.6에서 `q -> r -> t`는 `q`에서 `t`까지의 longest simple path지만, 그 subpath `q -> r`은 `q`에서 `r`까지의 longest simple path가 아니다. `q -> s -> t -> r`이 더 길기 때문이다. 또한 `r -> t`도 `r -> q -> s -> t`보다 짧다.

더 큰 문제는 longest subpaths를 조합하면 legal solution이 아닐 수 있다는 점이다. `q -> s -> t -> r`와 `r -> q -> s -> t`를 붙이면 vertex들이 반복되어 simple path가 아니다. 즉 subproblems가 independent하지 않다. 한 subproblem에서 vertices `s`, `t`를 사용하면 다른 subproblem에서 그 vertices를 다시 사용할 수 없는데, longest path를 만들려면 바로 그 자원이 필요하다.

Shortest path에서는 이런 충돌이 없다. 두 shortest subpaths가 splice vertex `w` 외의 vertex를 공유한다면 cycle-like overlap을 제거해 더 짧은 path를 만들 수 있어 contradiction이 된다. 그래서 shortest path의 subproblems는 independent하고, longest simple path의 subproblems는 independent하지 않다. CLRS는 unweighted longest simple path가 NP-complete이며 polynomial-time DP가 알려져 있지 않다고 지적한다.

#### Overlapping subproblems

`overlapping subproblems`는 natural recursive algorithm이 항상 새로운 subproblems를 만들지 않고, 같은 subproblem을 반복해서 만나는 성질이다. DP는 각 distinct subproblem을 한 번 계산해 table에 저장하고, 다음부터는 constant-time lookup으로 재사용한다.

Matrix-chain multiplication에서 $m[3,4]$ 같은 table entry는 여러 상위 subproblems를 계산할 때 반복 참조된다. 예를 들어 Figure 15.5의 table에서는 $m[3,4]$가 $m[2,4]$, $m[1,4]$, $m[3,5]$, $m[3,6]$ 계산 중에 필요하다.

![Figure 15.7](@/assets/images/cs-algorithm-077-figure-15-7-page-406.png)
*Figure 15.7 · PDF p. 406 · `RECURSIVE-MATRIX-CHAIN(p,1,4)`의 recursion tree와 repeated subproblems*

Figure 15.7은 `RECURSIVE-MATRIX-CHAIN(p, 1, 4)`의 recursion tree다. Node label `i..j`는 subproblem $m[i,j]$를 뜻한다. 같은 label이 여러 번 나타나므로 naive recursion은 같은 값을 계속 다시 계산한다. Memoization을 쓰면 shaded subtree처럼 이미 계산된 subproblem은 table lookup 하나로 대체된다.

Naive recursive matrix-chain algorithm은 recurrence (15.7)를 그대로 구현한다.

```text
RECURSIVE-MATRIX-CHAIN(p, i, j)
1  if i == j
2      return 0
3  m[i,j] = ∞
4  for k = i to j-1
5      q = RECURSIVE-MATRIX-CHAIN(p, i, k)
           + RECURSIVE-MATRIX-CHAIN(p, k+1, j)
           + p[i-1] p[k] p[j]
6      if q < m[i,j]
7          m[i,j] = q
8  return m[i,j]
```

이 procedure의 running time $T(n)$은 최소한 다음을 만족한다.

$$
\begin{aligned}
T(1) &\ge 1 \\
T(n) &\ge 2 \sum_{i=1}^{n-1} T(i) + n (15.8)
\end{aligned}
$$

Substitution으로 $T(n) \ge 2^{n-1}$을 보일 수 있으므로 exponential이다. Bottom-up `MATRIX-CHAIN-ORDER`는 $\Theta(n^{2})$ distinct subproblems를 각각 한 번만 계산하고, 각 subproblem에서 $O(n)$ choices를 보아 $O(n^{3})$으로 줄인다.

#### Reconstructing choices

Optimal value table만 저장하면 solution reconstruction 때 다시 choices를 찾아야 할 수 있다. Matrix-chain multiplication에서 $m[i,j]$만 있고 $s[i,j]$가 없다면, $A_{i}\ldots A_{j}$의 split을 복원하려고 $k = i\ldots j-1$을 다시 검사해야 한다. 이는 $\Theta(j-i)$ 시간이 걸린다.

반대로 $s[i,j]$를 저장하면 각 subproblem의 chosen split을 $O(1)$에 얻을 수 있다. 이 패턴은 DP에서 자주 나온다.

| 저장 대상 | 역할 |
|---|---|
| value table | optimal cost, length, probability 등 objective value |
| choice table | root, split, predecessor, arrow 등 actual solution 복원 정보 |

#### Memoization

`memoization`은 inefficient natural recursion의 control structure는 유지하되, subproblem answer를 table에 저장해 중복 계산을 피하는 top-down DP다. 각 table entry는 처음에는 “아직 미계산”을 뜻하는 sentinel value를 가진다. Recursive call이 어떤 subproblem을 처음 만나면 계산해 저장하고, 이후 같은 subproblem을 만나면 저장된 값을 즉시 반환한다.

```text
MEMOIZED-MATRIX-CHAIN(p)
1  n = p.length - 1
2  let m[1..n, 1..n] be a new table
3  for i = 1 to n
4      for j = i to n
5          m[i,j] = ∞
6  return LOOKUP-CHAIN(m, p, 1, n)

LOOKUP-CHAIN(m, p, i, j)
1  if m[i,j] < ∞
2      return m[i,j]
3  if i == j
4      m[i,j] = 0
5  else for k = i to j-1
6      q = LOOKUP-CHAIN(m, p, i, k)
           + LOOKUP-CHAIN(m, p, k+1, j)
           + p[i-1] p[k] p[j]
7      if q < m[i,j]
8          m[i,j] = q
9  return m[i,j]
```

`MEMOIZED-MATRIX-CHAIN`도 $O(n^{3})$ time이다. $m[i,j] = \infty$인 first-time calls는 $\Theta(n^{2})$개이고, 각 first-time call에서 최대 $O(n)$ splits를 검사한다. 이미 계산된 second-time calls는 $O(1)$ lookup이다. 따라서 memoization은 $\Omega(2^{n})$ naive recursion을 $O(n^{3})$으로 바꾼다.

Bottom-up과 top-down memoization은 같은 overlapping subproblems를 이용하지만 practical trade-off가 있다.

| 방식 | 장점 | 주의점 |
|---|---|---|
| bottom-up method | recursion overhead가 없고 table access pattern이 규칙적이라 constant factor가 좋고 space/time 최적화 여지가 큼 | reachable하지 않은 subproblems까지 채울 수 있음 |
| top-down memoization | natural recursive formulation을 유지하고 실제 필요한 subproblems만 계산 | recursion overhead와 sentinel/table lookup 관리 비용이 있음 |

모든 subproblems를 결국 풀어야 한다면 bottom-up이 보통 더 빠르다. 반대로 large subproblem space 중 실제로 필요한 부분만 작다면 memoization이 유리할 수 있다.

### 15.4 Longest common subsequence

`longest common subsequence` (`LCS`)는 두 sequences가 “같은 순서로 공유하는 원소들” 중 가장 긴 sequence를 찾는 문제다. DNA 문자열 비교처럼 두 objects의 similarity를 측정할 때 자연스럽게 등장한다. 여기서 subsequence는 substring과 다르다. 원소들이 연속될 필요는 없고, 원래 순서만 보존하면 된다.

#### Definitions

Sequence $X = \langle x_1, x_2, \ldots, x_m\rangle$가 있을 때, $Z = \langle z_1, z_2, \ldots, z_k\rangle$가 $X$의 subsequence라는 것은 $X$의 strictly increasing index sequence $\langle i_1, i_2, \ldots, i_k\rangle$가 존재해서 모든 $j$에 대해 $x_{i_{j}} = z_{j}$인 경우다.

예를 들어 $X = \langle A, B, C, B, D, A, B\rangle$에서 $Z = \langle B, C, D, B\rangle$는 indices $\langle 2, 3, 5, 7\rangle$로 얻을 수 있으므로 subsequence다.

두 sequences `X`, `Y`의 `common subsequence`는 둘 모두의 subsequence인 sequence다. 예를 들어:

$$
\begin{aligned}
X &= <A, B, C, B, D, A, B> \\
Y &= <B, D, C, A, B, A>
\end{aligned}
$$

$\langle B, C, A\rangle$는 common subsequence지만 longest는 아니다. $\langle B, C, B, A\rangle$와 $\langle B, D, A, B\rangle$는 length 4의 LCS이며, length 5 이상의 common subsequence는 없다.

#### Brute force and subproblem choice

Brute force는 `X`의 모든 subsequences를 나열하고 `Y`에도 등장하는지 검사한다. `X`의 subsequences 수는 $2^{m}$이므로 exponential이다.

LCS의 자연스러운 subproblems는 prefixes의 쌍이다. $X_{i} = <x_{1}, \ldots, x_{i}>$를 `X`의 `i`th prefix라고 하고, $X_{0}$은 empty sequence로 둔다. 그러면 subproblem은 $X_{i}$와 $Y_{j}$의 LCS length를 묻는 형태가 된다.

#### Theorem 15.1: Optimal substructure of an LCS

$X = \langle x_1, \ldots, x_m\rangle$, $Y = \langle y_1, \ldots, y_n\rangle$이고 $Z = \langle z_1, \ldots, z_k\rangle$가 $X$, $Y$의 어떤 LCS라고 하자.

| Case | 결론 |
|---|---|
| $x_{m} = y_{n}$ | $z_{k} = x_{m} = y_{n}$이고, $Z_{k-1}$은 $X_{m-1}$와 $Y_{n-1}$의 LCS |
| $x_{m} != y_{n}$이고 $z_{k} != x_{m}$ | `Z`는 $X_{m-1}$와 `Y`의 LCS |
| $x_{m} != y_{n}$이고 $z_{k} != y_{n}$ | `Z`는 `X`와 $Y_{n-1}$의 LCS |

첫 번째 case의 핵심은 끝 문자가 같으면 그 문자를 LCS 끝에 붙일 수 있다는 점이다. 만약 $z_{k}$가 그 공통 끝 문자가 아니라면, $x_{m} = y_{n}$을 추가해 더 긴 common subsequence를 만들 수 있어 contradiction이다. 두 번째와 세 번째 case는 끝 문자가 다를 때 LCS가 어느 한쪽의 마지막 원소를 쓰지 않는 경우, 그 원소를 제거한 prefix problem에서도 같은 `Z`가 최적이어야 한다는 논리다.

#### Recurrence

$c[i,j]$를 prefixes $X_{i}$와 $Y_{j}$의 LCS length라고 하자. Empty prefix가 있으면 LCS length는 0이다. Theorem 15.1에 따라 recurrence는 다음과 같다.

$$
\begin{aligned}
c[i,j] &= 0 if i = 0 or j = 0 \\
c[i,j] &= c[i-1,j-1] + 1 if i,j > 0 and x_{i} = y_{j} \\
c[i,j] &= \max(c[i,j-1], c[i-1,j]) if i,j > 0 and x_{i} != y_{j} (15.9)
\end{aligned}
$$

이 recurrence는 앞의 rod cutting이나 matrix-chain multiplication과 조금 다르다. $x_{i} = y_{j}$인지 여부에 따라 고려할 subproblems가 달라진다. Matching case에서는 diagonal subproblem $c[i-1,j-1]$만 보면 되고, mismatching case에서는 위쪽 $c[i-1,j]$와 왼쪽 $c[i,j-1]$ 중 큰 쪽을 고른다.

Overlapping subproblems도 분명하다. `LCS(X, Y_{n-1})`와 `LCS(X_{m-1}, Y)`는 둘 다 `LCS(X_{m-1}, Y_{n-1})`를 하위 문제로 공유한다. 전체 distinct subproblems는 $m\cdot n$개뿐이다.

#### LCS-LENGTH

`LCS-LENGTH(X, Y)`는 `c[0..m, 0..n]` table에 LCS lengths를 저장하고, `b[1..m, 1..n]` table에 solution reconstruction용 arrows를 저장한다. $b[i,j]$는 $c[i,j]$가 어떤 subproblem에서 왔는지를 나타낸다.

```text
LCS-LENGTH(X, Y)
1  m = X.length
2  n = Y.length
3  let b[1..m, 1..n] and c[0..m, 0..n] be new tables
4  for i = 1 to m
5      c[i,0] = 0
6  for j = 0 to n
7      c[0,j] = 0
8  for i = 1 to m
9      for j = 1 to n
10         if x_i == y_j
11             c[i,j] = c[i-1,j-1] + 1
12             b[i,j] = "↖"
13         elseif c[i-1,j] >= c[i,j-1]
14             c[i,j] = c[i-1,j]
15             b[i,j] = "↑"
16         else
17             c[i,j] = c[i,j-1]
18             b[i,j] = "←"
19 return c and b
```

각 table entry를 $\Theta(1)$에 계산하므로 running time은 $\Theta(mn)$이다. $c[m,n]$에는 LCS length가 들어 있다.

![Figure 15.8](@/assets/images/cs-algorithm-078-figure-15-8-page-416.png)
*Figure 15.8 · PDF p. 416 · `LCS-LENGTH`가 만든 `c` table과 `b` arrows*

Figure 15.8은 $X = \langle A, B, C, B, D, A, B\rangle$, $Y = \langle B, D, C, A, B, A\rangle$에 대한 tables다. 오른쪽 아래 $c[7,6] = 4$이므로 LCS length는 4다. Shaded arrows를 따라가면 diagonal arrow가 나오는 지점들이 LCS characters를 구성하고, 결과 중 하나는 `BCBA`다.

#### PRINT-LCS

`b` table에서 오른쪽 아래 $b[m,n]$부터 arrows를 거슬러 올라가면 LCS를 복원할 수 있다. Diagonal arrow `↖`를 만날 때마다 $x_{i} = y_{j}$가 LCS의 한 원소다. 아래 recursive procedure는 먼저 이전 prefix를 출력하고 나중에 $x_{i}$를 출력하므로 forward order로 나온다.

```text
PRINT-LCS(b, X, i, j)
1  if i == 0 or j == 0
2      return
3  if b[i,j] == "↖"
4      PRINT-LCS(b, X, i-1, j-1)
5      print x_i
6  elseif b[i,j] == "↑"
7      PRINT-LCS(b, X, i-1, j)
8  else
9      PRINT-LCS(b, X, i, j-1)
```

각 recursive call에서 `i` 또는 `j`가 적어도 하나 감소하므로 reconstruction time은 $O(m+n)$이다.

#### Space improvements

`b` table은 없어도 된다. $c[i,j]$와 이웃 값 $c[i-1,j-1]$, $c[i-1,j]$, $c[i,j-1]$, 그리고 $x_{i}$, $y_{j}$를 보면 어떤 방향이 선택되었는지 $O(1)$에 재구성할 수 있기 때문이다. 이 방법은 `b` table의 $\Theta(mn)$ space를 줄이지만, LCS 자체를 $O(m+n)$에 복원하려면 여전히 전체 `c` table이 필요하다.

LCS length만 필요하다면 더 줄일 수 있다. $c[i,j]$는 current row와 previous row만 참조하므로 $2\min(m,n)$ entries plus $O(1)$ extra space로 length를 계산할 수 있다. 더 나아가 one row와 temporary value만으로도 length 계산이 가능하다. 단, 이렇게 줄이면 LCS sequence reconstruction에 필요한 path 정보가 사라진다.

### 15.5 Optimal binary search trees

`optimal binary search tree`는 keys의 search probabilities와 unsuccessful searches probabilities가 주어졌을 때, expected search cost가 최소가 되도록 만든 binary search tree다. Balanced BST는 worst-case $O(\lg n)$ search를 보장하지만, 검색 빈도가 크게 다르면 자주 찾는 key를 root 가까이에 두는 편이 평균 비용을 더 낮출 수 있다.

#### Problem setting

정렬된 distinct keys가 $K = \langle k_1, k_2, \ldots, k_n\rangle$이고 $k_1 < k_2 < \cdots < k_n$이라고 하자. Search가 key $k_{i}$를 찾을 probability를 $p_{i}$라고 한다. Search가 실제 key에 실패할 수도 있으므로 $n+1$개의 dummy keys도 둔다.

| Dummy key | 의미 |
|---|---|
| $d_{0}$ | $k_{1}$보다 작은 모든 값 |
| $d_{i}$ | $k_{i}$와 $k_{i+1}$ 사이의 모든 값 |
| $d_{n}$ | $k_{n}$보다 큰 모든 값 |

$q_{i}$는 search가 dummy key $d_{i}$에 해당할 probability다. 모든 search는 successful key 또는 unsuccessful dummy key 중 하나이므로:

$$
\sum_{i=1}^{n} p_{i} + \sum_{i=0}^{n} q_{i} = 1 (15.10)
$$

BST에서 successful key $k_{i}$는 internal node이고, dummy key $d_{i}$는 leaf로 생각한다. Search cost는 찾은 node의 depth에 1을 더한 값, 즉 examined nodes 수다. Tree `T`의 expected search cost는:

$$
\begin{aligned}
\text{E[search cost in T]} \\
= \sum_{i=1}^{n} (depth_{T}(k_{i})+1) p_{i} + \sum_{i=0}^{n} (depth_{T}(d_{i})+1) q_{i} \\
= 1 + \sum_{i=1}^{n} depth_{T}(k_{i}) p_{i} + \sum_{i=0}^{n} depth_{T}(d_{i}) q_{i} (15.11)
\end{aligned}
$$

![Figure 15.9](@/assets/images/cs-algorithm-079-figure-15-9-page-419.png)
*Figure 15.9 · PDF p. 419 · 같은 probabilities에 대한 두 BST와 expected search cost 비교*

Figure 15.9(a)의 expected search cost는 `2.80`이고, Figure 15.9(b)는 `2.75`로 더 낮으며 이 instance의 optimal tree다. 이 예시는 두 가지 오해를 막아 준다. Optimal BST는 반드시 height가 가장 작은 tree가 아니며, probability가 가장 큰 key를 root에 두는 greedy rule도 항상 맞지 않는다. Figure에서는 $k_{5}$가 가장 큰 $p_{i}$를 갖지만 optimal root는 $k_{2}$다.

Exhaustive search도 어렵다. `n` nodes binary tree의 수는 Catalan 계열로 $\Omega(4^{n} / n^{3/2})$이므로, 가능한 BST를 모두 검사하는 방법은 exponential이다.

#### Optimal substructure

BST의 어떤 subtree는 항상 contiguous key range `k_i, ..., k_j`를 포함한다. 그리고 그 subtree의 leaves로 dummy keys `d_{i-1}, ..., d_j`가 함께 들어간다.

Optimal BST `T` 안에 keys `k_i, ..., k_j`를 담는 subtree `T'`가 있다면, `T'`는 그 subproblem에 대한 optimal BST여야 한다. 더 낮은 expected cost의 subtree가 있다면 기존 subtree를 cut out하고 더 좋은 subtree를 paste in해서 전체 expected cost를 낮출 수 있으므로 contradiction이다.

Subproblem `k_i, ..., k_j`의 root를 $k_{r}$ ($i \le r \le j$)로 고르면:

| 부분 | 포함하는 keys | 포함하는 dummy keys |
|---|---|---|
| left subtree | `k_i, ..., k_{r-1}` | `d_{i-1}, ..., d_{r-1}` |
| root | $k_{r}$ | 없음 |
| right subtree | `k_{r+1}, ..., k_j` | `d_r, ..., d_j` |

Empty subtree도 중요하다. 예를 들어 $k_{i}$를 root로 고르면 left subtree에는 actual keys가 없지만 dummy key $d_{i-1}$는 있다. 그래서 subproblem 범위는 $j \ge i-1$까지 허용한다.

#### Recursive value definition

$e[i,j]$를 keys `k_i, ..., k_j`를 포함하는 optimal BST의 expected search cost라고 하자. 최종 목표는 $e[1,n]$이다. Base case는 actual key가 없는 경우다.

$$
e[i,i-1] = q_{i-1}
$$

Subtree `k_i, ..., k_j` 안의 모든 probabilities 합을 $w(i,j)$로 둔다.

$$
w(i,j) = \sum_{l=i}^{j} p_{l} + \sum_{l=i-1}^{j} q_{l} (15.12)
$$

어떤 subtree가 root 아래로 한 level 내려가면 그 subtree 안의 모든 nodes depth가 1씩 증가하므로 expected cost는 그 subtree probability mass만큼 증가한다. 따라서 root를 $k_{r}$로 고르면:

$$
e[i,j] = e[i,r-1] + e[r+1,j] + w(i,j) (15.13)
$$

root를 모르므로 가능한 모든 `r`을 시도한다.

$$
\begin{aligned}
e[i,j] &= q_{i-1} if j = i-1 \\
e[i,j] &= min_{i \le r \le j} { e[i,r-1] + e[r+1,j] + w(i,j) } if i \le j (15.14)
\end{aligned}
$$

$root[i,j]$는 minimum을 달성한 root index `r`을 저장한다. `e`는 expected cost, `root`는 tree reconstruction 정보를 담당한다.

#### Computing tables

$e[i,j]$와 $root[i,j]$만으로도 recurrence는 계산할 수 있지만, $w(i,j)$를 매번 summation으로 계산하면 낭비가 크다. 그래서 `w` table도 함께 저장한다.

$$
\begin{aligned}
w[i,i-1] &= q_{i-1} \\
w[i,j] &= w[i,j-1] + p_{j} + q_{j} (15.15)
\end{aligned}
$$

`OPTIMAL-BST(p, q, n)`은 interval length `l`을 1부터 증가시키며 tables를 채운다.

```text
OPTIMAL-BST(p, q, n)
1  let e[1..n+1, 0..n], w[1..n+1, 0..n],
       and root[1..n, 1..n] be new tables
2  for i = 1 to n+1
3      e[i,i-1] = q[i-1]
4      w[i,i-1] = q[i-1]
5  for l = 1 to n
6      for i = 1 to n-l+1
7          j = i+l-1
8          e[i,j] = ∞
9          w[i,j] = w[i,j-1] + p[j] + q[j]
10         for r = i to j
11             t = e[i,r-1] + e[r+1,j] + w[i,j]
12             if t < e[i,j]
13                 e[i,j] = t
14                 root[i,j] = r
15 return e and root
```

`e`와 `w`는 empty subtree $e[n+1,n]$, $e[1,0]$ 같은 base cases가 필요하므로 dimensions가 $1..n+1$, `0..n`이다. `root`는 actual keys가 있는 intervals에만 필요하므로 `1..n, 1..n`이다.

![Figure 15.10](@/assets/images/cs-algorithm-080-figure-15-10-page-424.png)
*Figure 15.10 · PDF p. 424 · `OPTIMAL-BST`가 계산한 `e`, `w`, `root` tables*

Figure 15.10은 Figure 15.9의 probability distribution에 대해 계산한 tables다. Matrix-chain table처럼 diagonals가 수평이 되도록 회전되어 있고, rows는 bottom-up으로 짧은 intervals부터 긴 intervals까지 채워진다. $e[1,5] = 2.75$가 전체 optimal expected cost이며, $root[1,5] = 2$라서 root는 $k_{2}$다.

Running time은 $\Theta(n^{3})$이다. Loop가 interval length `l`, start index `i`, root candidate `r`의 세 겹이고, 각 index가 최대 `n` 범위에서 움직인다. Space는 `e`, `w`, `root` tables 때문에 $\Theta(n^{2})$이다. CLRS는 Knuth의 결과로 $root[i,j-1] \le root[i,j] \le root[i+1,j]$를 만족하는 roots를 택할 수 있음을 언급하고, 이를 이용하면 `OPTIMAL-BST`를 $\Theta(n^{2})$ time으로 줄일 수 있다.

#### Constructing the tree

`root` table은 optimal BST structure를 recursive하게 복원한다. $root[i,j] = r$이면 $k_{r}$이 subtree $k_{i}\ldots k_{j}$의 root이고, 왼쪽은 interval $i..r-1$, 오른쪽은 $r+1..j$다. Empty interval $i..i-1$은 dummy key $d_{i-1}$ leaf가 된다.

Figure 15.10의 example은 다음 구조를 복원한다.

```text
k2 is the root
k1 is the left child of k2
d0 is the left child of k1
d1 is the right child of k1
k5 is the right child of k2
k4 is the left child of k5
k3 is the left child of k4
d2 is the left child of k3
d3 is the right child of k3
d4 is the right child of k4
d5 is the right child of k5
```

#### Chapter 15 problem patterns

Chapter 15 뒤의 problems는 dynamic programming의 기본 패턴이 다른 도메인으로 옮겨 가는 예시다. 전부 세부 풀이를 요구하는 본문은 아니지만, 어떤 state와 choice를 잡는지가 중요하다.

| Problem | DP 관점의 핵심 |
|---|---|
| 15-1 Longest simple path in a DAG | DAG에서는 topological order가 있어 longest path도 cycle 걱정 없이 DP로 풀 수 있다. Subproblem graph는 원래 DAG 또는 그 reachability/dependency graph와 맞물린다. |
| 15-2 Longest palindrome subsequence | 문자열 interval `i..j`에서 양끝 문자가 같으면 둘 다 포함하고 내부 $i+1..j-1$로, 다르면 한쪽 끝을 버리는 LCS형 recurrence를 쓴다. |
| 15-3 Bitonic euclidean traveling-salesman problem | 일반 euclidean TSP는 NP-hard지만, x-coordinate으로 정렬하고 두 monotone chains의 frontier를 state로 잡으면 $O(n^{2})$ DP가 가능하다. |

![Figure 15.11](@/assets/images/cs-algorithm-081-figure-15-11-page-426.png)
*Figure 15.11 · PDF p. 426 · shortest closed tour와 shortest bitonic tour 비교*

Figure 15.11은 같은 7개 points에서 unrestricted shortest tour와 bitonic restriction을 둔 tour가 다름을 보여 준다. Bitonic tour는 leftmost point에서 rightward로 rightmost point까지 갔다가 leftward로 돌아오는 형태라, 제한 덕분에 polynomial DP가 가능해진다.

| Problem | DP 관점의 핵심 |
|---|---|
| 15-4 Printing neatly | Word interval `i..j`를 한 줄에 넣을 때 extra spaces cube cost를 계산하고, `j` 이후의 optimal printing과 결합한다. Last line cost는 0으로 둔다. |
| 15-5 Edit distance | State는 source prefix와 target prefix의 indices다. Copy, replace, delete, insert, twiddle, kill operations 중 가능한 transition을 고르고 minimum cost와 predecessor를 저장한다. DNA alignment는 copy/replace/delete/insert의 score/cost formulation으로 볼 수 있다. |
| 15-6 Planning a company party | Tree DP. 각 employee node에 대해 “참석”과 “불참” 두 값을 저장한다. 참석하면 children은 불참해야 하고, 불참하면 각 child는 참석/불참 중 큰 값을 고른다. |
| 15-7 Viterbi algorithm | Sound sequence prefix length와 graph vertex를 state로 둔다. Path existence는 label이 맞는 edges로 transition하고, most probable path는 product probability를 maximize한다. 실제 구현은 log probabilities로 sum maximize로 바꾸는 편이 흔하다. |
| 15-8 Image compression by seam carving | Pixel row `i`, column `j`를 state로 두고 위 row의 `j-1, j, j+1`에서 오는 minimum disruption path를 저장한다. |
| 15-9 Breaking a string | Matrix-chain과 유사한 interval DP. Break interval의 cost는 현재 substring length이고, 어떤 break를 먼저 할지 선택한다. |
| 15-10 Planning an investment strategy | Year와 investment를 state로 두고 stay/switch fee를 반영해 maximum wealth를 계산한다. 추가 cap constraint가 생기면 optimal substructure가 깨질 수 있다. |
| 15-11 Inventory planning | Month와 inventory amount를 state로 두고 production/holding/part-time labor cost를 누적해 minimum cost plan을 찾는다. |
| 15-12 Signing free-agent baseball players | Budgeted selection DP. Position별로 최대 한 명, total budget `X` 이하에서 total `VORP`를 maximize한다. Multiple-choice knapsack 형태다. |

#### Chapter notes

`dynamic programming`이라는 이름의 `programming`은 코딩이 아니라 tabular solution method, 즉 계획법에 가깝다. Bellman이 1955년에 체계적으로 연구했다. Chapter notes는 DP algorithms를 table dimension과 entry dependency 수로 분류하는 관점도 제시한다. 예를 들어 matrix-chain multiplication은 table size가 $O(n^{2})$이고 각 entry가 $O(n)$ entries에 의존하므로 $2D/1D$, LCS는 table size가 $O(mn)$이고 각 entry가 constant number의 neighbors에 의존하므로 $2D/0D$로 볼 수 있다.

Notes는 또한 특정 문제들에 더 빠른 알고리즘이 있음을 언급한다. Matrix-chain multiplication에는 $O(n \lg n)$ algorithm이 알려져 있고, LCS도 bounded alphabet 등 특수 조건에서는 $O(mn / \lg n)$ 또는 더 빠른 결과가 있다. Optimal BST 역시 $p_{i} = 0$인 특수한 경우와 Knuth optimization 등으로 더 나은 bounds가 연구되었다.

## 핵심 흐름 요약

Chapter 15의 dynamic programming은 같은 절차를 여러 형태로 반복한다.

| 단계 | 질문 | Rod cutting | Matrix chain | LCS | Optimal BST |
|---|---|---|---|---|---|
| 1. Structure | optimal solution의 choice는? | first cut `i` | split `k` | last characters match/mismatch | root `r` |
| 2. Value recurrence | objective value는? | revenue $r[j]$ | cost $m[i,j]$ | length $c[i,j]$ | expected cost $e[i,j]$ |
| 3. Compute | 어떤 순서로 table을 채우나? | length 증가 | interval length 증가 | row-major prefixes | interval length 증가 |
| 4. Reconstruct | choice는 어디에 저장하나? | $s[j]$ | $s[i,j]$ | $b[i,j]$ 또는 `c` 역추적 | $root[i,j]$ |

좋은 DP formulation은 세 가지를 명확히 해야 한다. 첫째, subproblem space가 optimal solution에 필요한 모든 경우를 포함해야 한다. 둘째, 같은 subproblem이 반복 등장해 저장의 이득이 있어야 한다. 셋째, value table만으로 충분한지, actual solution 복원을 위해 choice table이 필요한지 구분해야 한다.
