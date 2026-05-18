---
title: "Chapter 2. Getting Started"
order: 2
pubDatetime: 2026-05-17T00:00:00+09:00
modDatetime: 2026-05-18T02:00:00+09:00
description: "CLRS 알고리즘 정리: Chapter 2. Getting Started"
tags:
  - Algorithm
  - CS
  - CLRS
---

## 개요

Chapter 2는 CLRS 전체에서 사용할 알고리즘 설계와 분석의 기본 언어를 세운다. 먼저 `INSERTION-SORT`로 pseudocode 표기, in-place sorting, loop invariant를 이용한 correctness proof를 익힌다. 이어서 running time을 input size와 primitive operation의 관점에서 분석하고, best-case, worst-case, average-case, order of growth의 의미를 잡는다. 마지막으로 divide-and-conquer 설계법을 `MERGE-SORT`에 적용하고 recurrence와 recursion tree를 통해 $\Theta(n \lg n)$ running time이 어떻게 나오는지 설명한다.

## 핵심 개념

| 용어 | 핵심 의미 | 검색 키워드 |
| --- | --- | --- |
| insertion sort | 이미 정렬된 왼쪽 부분 배열에 현재 key를 끼워 넣는 정렬 알고리즘 | INSERTION-SORT, key, in-place |
| pseudocode | 실제 언어 문법보다 알고리즘의 본질을 명확히 표현하기 위한 코드 형식 | pseudocode |
| loop invariant | 반복문 시작마다 참인 성질로 correctness를 증명하는 도구 | loop invariant, initialization, maintenance, termination |
| running time | input size에 따라 수행되는 primitive operation 수 또는 실제 시간 | running time, input size |
| order of growth | 상수와 낮은 차수를 버리고 입력 크기에 따른 증가율만 보는 관점 | order of growth, Θ-notation |
| divide-and-conquer | 문제를 작은 subproblems로 나누고, 재귀적으로 풀고, 해를 결합하는 설계법 | divide, conquer, combine |
| merge sort | 배열을 반으로 나누어 재귀적으로 정렬한 뒤 merge하는 정렬 알고리즘 | MERGE-SORT, MERGE |
| recurrence | 재귀 알고리즘의 running time을 자기 자신에 대한 식으로 표현한 것 | recurrence, recursion tree |

## 세부 정리

### 2.1 Insertion sort

#### 정렬 문제와 keys

Chapter 2의 첫 알고리즘은 Chapter 1에서 정의한 sorting problem을 푸는 insertion sort다. 입력은 $n$개 숫자 sequence $\langle a_1, a_2, \ldots, a_n\rangle$, 출력은 입력의 permutation $\langle a'_1, a'_2, \ldots, a'_n\rangle$ 중 $a'_1 \le a'_2 \le \cdots \le a'_n$을 만족하는 sequence다. 정렬하려는 값들은 key라고 부르며, 개념적으로는 sequence를 정렬하지만 실제 입력은 $n$개 element를 가진 array 형태로 주어진다.

#### Pseudocode가 실제 코드와 다른 이유

CLRS의 알고리즘은 C, C++, Java, Python, Pascal과 비슷한 pseudocode로 제시된다. pseudocode의 목적은 실행 가능한 프로그램을 그대로 쓰는 것이 아니라, 알고리즘의 essence를 가장 명확하고 간결하게 지정하는 것이다. 그래서 필요하면 English phrase를 코드 안에 넣고, data abstraction, modularity, error handling 같은 software engineering issue는 알고리즘의 핵심을 가리지 않도록 생략한다.

이 장에서 중요한 표기 관례는 다음과 같다.

| 관례 | 의미 |
| --- | --- |
| indentation | block structure를 나타낸다. $begin/end$ 대신 들여쓰기로 loop와 conditional 범위를 구분한다. |
| `for`, `while`, `repeat-until`, `if-else` | 일반적인 block-structured language와 비슷하게 해석한다. |
| `to`, `downto`, `by` | `for` loop counter의 증가, 감소, 변화량을 나타낸다. |
| `//` | 줄 끝까지 comment다. |
| $A[i]$, $A[1..j]$ | array element와 subarray range를 나타낸다. |
| `A.length` | array object의 length attribute다. |
| `NIL` | pointer가 어떤 object도 가리키지 않는 special value다. |
| parameter passing by value | procedure는 parameter copy를 받는다. 단 array/object는 pointer가 복사되므로 attribute나 element 변경은 호출자에게 보인다. |
| short-circuiting `and`, `or` | 왼쪽 조건만으로 결과가 결정되면 오른쪽을 평가하지 않는다. `x != NIL and x.f == y` 같은 표현을 안전하게 만든다. |
| `error` | procedure 호출 조건이 잘못되었음을 나타내며, 처리 책임은 caller에게 있다. |

특히 CLRS의 `for` loop counter는 loop 종료 뒤에도 값을 유지한다. $for j = 2 to A.length$가 끝나면 $j = A.length + 1$이 된다. 이 점은 insertion sort의 termination proof에서 직접 사용된다.

#### Insertion sort의 직관

Insertion sort는 적은 수의 element를 정렬할 때 효율적인 알고리즘이며, 사람이 손에 든 playing cards를 정리하는 방식과 닮았다. 왼손에는 이미 정렬된 cards가 있고, 테이블 위 pile에서 card를 하나씩 가져와 왼손의 올바른 위치에 끼워 넣는다. 올바른 위치를 찾기 위해 이미 손에 든 card들을 오른쪽에서 왼쪽으로 비교한다.

Figure 2.1은 이 card-sorting 비유를 보여준다. 핵심은 매 순간 왼손의 card들이 sorted 상태이고, 그 card들이 원래 table pile의 앞쪽 cards였다는 점이다.

![Figure 2.1](@/assets/images/cs-algorithm-001-figure-2-1-page-38.png)
*Figure 2.1 · PDF p. 38 · 손에 든 카드에 새 카드를 끼워 넣는 insertion sort 직관*

#### INSERTION-SORT pseudocode

`INSERTION-SORT(A)`는 길이 $n = A.length$인 array $A[1..n]$을 입력받아 제자리에서 정렬한다. 제자리 정렬(in-place sorting)이므로 배열 밖에는 동시에 constant number의 element만 저장하고, 알고리즘 종료 시 입력 배열 `A` 자체가 sorted output sequence를 담는다.

```text
INSERTION-SORT(A)
1  for j = 2 to A.length
2      key = A[j]
3      // Insert A[j] into the sorted sequence A[1..j-1].
4      i = j - 1
5      while i > 0 and A[i] > key
6          A[i + 1] = A[i]
7          i = i - 1
8      A[i + 1] = key
```

동작 흐름은 단순하다. `j`는 현재 삽입할 card, 즉 key의 위치를 가리킨다. $A[1..j-1]$은 이미 정렬된 부분 배열이고, $A[j+1..n]$은 아직 처리되지 않은 나머지 pile이다. `while` loop는 `key`보다 큰 원소들을 한 칸씩 오른쪽으로 밀고, 더 이상 `key`보다 큰 값이 없거나 배열 앞쪽에 도달하면 `key`를 빈자리에 넣는다.

Figure 2.2는 `A = <5, 2, 4, 6, 1, 3>`에 대해 `INSERTION-SORT`가 각 iteration에서 어떤 key를 집고, 어떤 값을 오른쪽으로 밀고, 어디에 key를 넣는지 보여준다. 이 그림은 line 5의 비교, line 6의 shift, line 8의 insertion을 한 번에 연결해서 볼 수 있게 해 준다.

![Figure 2.2](@/assets/images/cs-algorithm-002-figure-2-2-page-39.png)
*Figure 2.2 · PDF p. 39 · 배열 `A = <5, 2, 4, 6, 1, 3>`에서 `INSERTION-SORT`가 key를 삽입하는 과정*

#### Loop invariant로 correctness 증명하기

Insertion sort의 correctness는 loop invariant로 보인다. 외부 `for` loop의 loop invariant는 다음과 같다.

> 각 `for` loop iteration 시작 시점에, subarray $A[1..j-1]$은 원래 $A[1..j-1]$에 있던 element들로 구성되어 있으며 sorted order에 있다.

loop invariant를 이용한 correctness proof는 세 단계로 구성된다.

| 단계 | 보여야 할 것 | insertion sort에서의 의미 |
| --- | --- | --- |
| Initialization | 첫 iteration 전에 invariant가 참이다 | $j = 2$ 직전 $A[1..1]$은 원소 하나뿐이라 trivially sorted다 |
| Maintenance | 한 iteration 전에 참이면 다음 iteration 전에도 참이다 | $A[j]$를 key로 잡고, 큰 원소들을 오른쪽으로 밀어 $A[1..j]$를 sorted 상태로 만든다 |
| Termination | loop 종료 시 invariant가 알고리즘 correctness를 준다 | 종료 조건은 $j > A.length = n$, 따라서 $j = n + 1$이고 $A[1..n]$ 전체가 sorted다 |

이 구조는 mathematical induction과 비슷하다. Initialization은 base case, Maintenance는 inductive step에 해당한다. 다만 loop invariant의 Termination은 일반 induction과 다르다. induction은 무한히 이어지는 성질을 보이지만, 알고리즘 증명에서는 loop가 멈추는 조건과 invariant를 결합해 원하는 postcondition을 얻는다.

Insertion sort에서 Maintenance를 더 형식적으로 하려면 내부 `while` loop에도 별도의 loop invariant를 세울 수 있다. 하지만 이 장의 본문은 아직 과도한 형식화를 피하고, `A[j-1], A[j-2], ...`를 오른쪽으로 밀어 `key`의 위치를 찾는 직관으로 외부 invariant가 유지됨을 설명한다.

#### 2.1 exercises가 요구하는 핵심 능력

2.1의 연습문제들은 새로운 이론보다 같은 증명/표기 도구를 다른 작은 문제에 적용하게 만든다. `INSERTION-SORT`를 nonincreasing order로 바꾸기, linear search를 pseudocode로 쓰고 loop invariant로 증명하기, n-bit binary integers를 array로 더해 carry를 처리하기가 대표적이다. 공통 목표는 “pseudocode로 절차를 명확히 쓰고, loop invariant로 correctness를 설명할 수 있는가”다.

### 2.2 Analyzing algorithms

#### 알고리즘 분석의 목적

알고리즘을 분석한다는 것은 그 알고리즘이 요구하는 resources를 예측한다는 뜻이다. 때로는 memory, communication bandwidth, hardware 같은 자원이 중요하지만, CLRS의 기본 분석에서는 computational time, 즉 running time이 중심이다. 같은 problem을 푸는 여러 candidate algorithms를 분석하면 가장 효율적인 것을 고르거나, 적어도 inferior algorithms를 걸러낼 수 있다.

분석을 시작하려면 implementation technology의 model이 필요하다. CLRS는 대부분의 장에서 one-processor random-access machine(RAM) model을 사용한다. RAM model에서는 instructions가 한 번에 하나씩 순차적으로 실행되며 concurrent operations는 없다고 본다.

#### RAM model에서 조심해야 할 점

RAM model은 실제 컴퓨터에서 흔한 instruction을 constant time으로 본다. 대표적으로 arithmetic(add, subtract, multiply, divide, remainder, floor, ceiling), data movement(load, store, copy), control(conditional/unconditional branch, subroutine call/return)이 있다.

하지만 이 모델을 남용하면 안 된다. 예를 들어 “sort instruction”이 있는 RAM을 가정하면 정렬은 한 instruction으로 끝난다. 이는 현실적이지 않다. 따라서 RAM model의 기준은 실제 컴퓨터 설계에서 일반적인 instruction인가다.

데이터 타입은 integer와 floating point를 가정한다. 보통 precision 문제는 깊게 다루지 않지만, 각 word size에는 제한이 있다고 본다. 입력 크기가 $n$이면 integer를 보통 $c \lg n$ bits로 표현한다고 가정한다. $c \ge 1$이어야 word 하나가 $n$ 값을 담아 input elements를 index할 수 있고, $c$를 constant로 두어 word size가 임의로 커지는 비현실적 상황을 막는다.

RAM model의 회색지대도 있다. 일반적인 exponentiation $x^{y}$는 constant time이 아니지만, word 안에서 가능한 작은 양의 정수 $k$에 대해 $2^{k}$를 계산하는 것은 shift left instruction으로 constant time처럼 취급할 수 있다. CLRS는 이런 gray area를 되도록 피한다.

또 하나의 단순화는 memory hierarchy를 모델링하지 않는다는 점이다. 즉 cache와 virtual memory 효과는 기본 RAM 분석에 들어가지 않는다. 실제 프로그램에서는 memory hierarchy가 중요할 수 있지만, 이를 포함한 model은 훨씬 복잡하다. CLRS의 기본 관점은 RAM-model analysis가 실제 성능의 훌륭한 predictor가 되는 경우가 많다는 것이다.

#### Input size와 running time

알고리즘의 running time은 보통 input size가 커질수록 증가한다. 다만 input size를 어떻게 재는지는 problem에 따라 다르다.

| 문제 유형 | 자연스러운 input size |
| --- | --- |
| sorting, discrete Fourier transform | 입력 item 개수, 예: array size $n$ |
| integer multiplication | binary notation으로 입력을 표현하는 데 필요한 bit 수 |
| graph algorithms | vertices 수와 edges 수처럼 두 개 이상의 값 |

특정 input에 대한 running time은 실행된 primitive operations 또는 steps의 수다. machine-independent하게 보기 위해 CLRS는 pseudocode의 각 line 실행이 constant time을 든다고 가정한다. line마다 비용은 다를 수 있지만, $i$번째 line의 한 번 실행 비용은 constant $c_i$로 둔다. comment는 실행문이 아니므로 비용이 0이다.

주의할 점은 English로 쓴 한 줄이 항상 constant time은 아니라는 것이다. 예를 들어 나중에 “sort the points by x-coordinate”라고 쓰면 그 자체가 정렬 알고리즘을 호출하므로 constant time이 아니다. 또한 subroutine call statement 자체는 constant time이지만, 호출된 subroutine의 실행 시간은 별도로 분석해야 한다.

#### Insertion sort의 statement cost 분석

`INSERTION-SORT` 분석에서 $n = A.length$이고, $j = 2, 3, \ldots, n$에 대해 $t_j$를 line 5의 `while` test가 실행되는 횟수라고 둔다. `for`나 `while` loop가 header test 때문에 종료될 때는 body보다 test가 한 번 더 실행된다.

총 running time $T(n)$은 각 statement의 cost와 실행 횟수의 곱을 모두 더한 것이다. 원문은 이를 다음 형태로 쓴다.

$$
\begin{aligned}
T(n) ={}& c_1 n + c_2(n - 1) + c_4(n - 1) \\
&+ c_5 \sum_{j=2}^{n} t_j
 + c_6 \sum_{j=2}^{n} (t_j - 1) \\
&+ c_7 \sum_{j=2}^{n} (t_j - 1)
 + c_8(n - 1)
\end{aligned}
$$

이 식은 세 가지를 보여준다. 첫째, 같은 algorithm이라도 input의 상태에 따라 $t_j$가 달라져 running time이 달라진다. 둘째, statement-level 분석은 정확하지만 복잡하다. 셋째, 이후에는 이 식을 더 단순한 growth rate 중심 표기로 압축할 필요가 있다.

#### Best case와 worst case

Insertion sort의 best case는 array가 이미 sorted order인 경우다. 각 $j$에서 line 5의 첫 test 때 $A[i] \le key$가 성립하므로 $t_j = 1$이다. 이때 running time은 $an + b$ 꼴, 즉 linear function of $n$이다.

Worst case는 array가 reverse sorted order인 경우다. 각 $A[j]$를 이미 정렬된 subarray $A[1..j-1]$의 모든 element와 비교해야 하므로 $t_j = j$다. 이때 $\sum j$와 $\sum (j - 1)$이 등장하고, running time은 $an^{2} + bn + c$ 꼴, 즉 quadratic function of $n$이 된다.

$$
\begin{aligned}
\text{best case:} T(n) &= an + b \Rightarrow \Theta(n) \\
\text{worst case:} T(n) &= an^{2} + bn + c \Rightarrow \Theta(n^{2})
\end{aligned}
$$

Insertion sort처럼 일반적으로 deterministic algorithm의 running time은 input이 고정되면 정해진다. 다만 이후 장에서는 같은 fixed input에 대해서도 random choice 때문에 behavior가 달라질 수 있는 randomized algorithms를 다룬다.

#### Worst-case analysis를 주로 보는 이유

CLRS는 이후 대부분의 분석에서 worst-case running time에 집중한다. 이유는 세 가지다.

| 이유 | 설명 |
| --- | --- |
| upper bound 보장 | 어떤 input of size n이 와도 이 시간보다 오래 걸리지 않는다는 guarantee를 준다. |
| worst case가 자주 생김 | 예를 들어 database search에서 찾는 정보가 없을 때가 worst case인데, 실제로 absent query가 자주 발생할 수 있다. |
| average case도 비슷하게 나쁠 수 있음 | random input에서 insertion sort는 평균적으로 sorted subarray의 절반을 확인하므로 average-case도 quadratic이다. |

Average-case analysis는 때때로 중요하지만, “average input”이 무엇인지 정의하기 어렵다. 흔히 같은 size의 모든 input이 equally likely라고 가정하지만 현실에서 이 가정이 깨질 수 있다. 이런 한계를 보완하는 방식 중 하나가 randomized algorithm이다. 알고리즘 내부에서 random choices를 하게 만들면 probabilistic analysis를 적용해 expected running time을 분석할 수 있고, 이 주제는 Chapter 5에서 본격적으로 이어진다.

#### Order of growth와 Θ-notation

Insertion sort 분석은 점점 단순화된다. 처음에는 각 statement cost $c_i$를 두고 정확한 식을 썼다. 그다음 worst-case running time을 $an^{2} + bn + c$처럼 constants $a$, $b$, $c$가 있는 polynomial로 압축했다. 마지막으로 CLRS는 running time의 rate of growth, 즉 order of growth만 보겠다고 한다.

Order of growth에서는 large $n$에서 지배적인 leading term만 남기고, lower-order terms와 leading coefficient를 무시한다. Insertion sort의 worst-case $an^{2} + bn + c$는 결국 $n^{2}$ growth로 본다. 그래서 insertion sort의 worst-case running time을 $\Theta(n^{2})$라고 쓴다. 이 장에서는 $\Theta$-notation을 비공식적으로 사용하고, Chapter 3에서 엄밀히 정의한다.

상수와 낮은 차수가 완전히 무의미하다는 뜻은 아니다. 작은 input에서는 higher order of growth를 가진 알고리즘이 더 빠를 수 있다. 하지만 충분히 큰 input에서는 lower order of growth를 가진 알고리즘이 더 효율적이다. 예를 들어 $\Theta(n^{2})$ algorithm은 큰 입력에서 $\Theta(n^{3})$ algorithm보다 worst-case 기준으로 빠르게 동작한다.

#### 2.2 exercises가 요구하는 핵심 능력

2.2의 연습문제는 $\Theta$-notation, selection sort의 loop invariant와 best/worst-case running time, linear search의 average/worst-case, 그리고 좋은 best-case running time을 만드는 방법을 묻는다. 핵심은 단순히 식을 계산하는 것이 아니라, algorithm의 동작 조건이 cost count와 growth rate로 어떻게 바뀌는지 설명하는 것이다.

### 2.3 Designing algorithms

#### Incremental approach와 divide-and-conquer

Insertion sort는 incremental approach를 사용한다. 이미 $A[1..j-1]$이 sorted 상태라고 보고, 단일 element $A[j]$를 올바른 위치에 insert해서 $A[1..j]$를 sorted 상태로 만든다. 즉 이전에 만든 부분 해를 한 원소만큼 확장한다.

2.3은 대안적 설계 기법인 divide-and-conquer를 소개한다. Divide-and-conquer algorithm은 보통 recursive structure를 가진다. 원래 문제와 비슷하지만 더 작은 subproblems로 나누고, subproblems를 재귀적으로 풀고, 그 해들을 결합해 원래 문제의 해를 만든다. 이 패러다임은 Chapter 4에서 본격적으로 다뤄진다.

| 단계 | 의미 | merge sort에서의 모습 |
| --- | --- | --- |
| Divide | 문제를 같은 유형의 더 작은 subproblems로 나눈다 | n-element sequence를 $n/2$ 크기의 두 subsequences로 나눈다 |
| Conquer | subproblems를 재귀적으로 푼다 | 두 subsequences를 각각 merge sort로 정렬한다 |
| Combine | subproblem solutions를 원래 문제의 solution으로 결합한다 | 두 sorted subsequences를 merge해 sorted sequence를 만든다 |

Merge sort의 recursion은 sequence length가 1이 되면 bottom out한다. 길이 1의 sequence는 이미 sorted order이므로 더 할 일이 없다.

#### MERGE: 두 sorted subarrays를 합치는 핵심 연산

Merge sort의 핵심은 combine step의 `MERGE(A, p, q, r)`다. 이 procedure는 $p \le q < r$이고 $A[p..q]$, $A[q+1..r]$가 각각 sorted order라고 가정한다. 결과로 두 subarrays를 하나의 sorted subarray $A[p..r]$로 합친다.

Card 비유로 보면, 앞면이 보이는 두 card piles가 있고 각 pile의 top에는 가장 작은 card가 있다. 매 basic step마다 두 pile의 top card를 비교해 더 작은 것을 output pile로 옮긴다. 한 pile이 비면 남은 pile을 그대로 output으로 옮기면 된다. 계산적으로는 매 step에서 top card 두 장만 비교하므로 constant time이고, 총 $n = r - p + 1$개의 element를 옮기므로 merging은 $\Theta(n)$ time이다.

CLRS의 `MERGE` pseudocode는 매 step마다 pile이 비었는지 검사하지 않기 위해 sentinel을 사용한다. `L`과 `R`의 마지막에 $\infty$를 넣어 두면, 한쪽 배열의 실제 원소가 모두 소진된 뒤에는 sentinel이 노출된다. sentinel은 실제 key보다 크므로 다른 쪽 배열의 남은 원소들이 먼저 복사된다. 두 sentinel이 모두 노출될 때쯤에는 이미 `r - p + 1`개의 실제 원소를 모두 $A[p..r]$로 복사했으므로 loop가 끝난다.

```text
MERGE(A, p, q, r)
1  n1 = q - p + 1
2  n2 = r - q
3  let L[1..n1 + 1] and R[1..n2 + 1] be new arrays
4  for i = 1 to n1
5      L[i] = A[p + i - 1]
6  for j = 1 to n2
7      R[j] = A[q + j]
8  L[n1 + 1] = ∞
9  R[n2 + 1] = ∞
10 i = 1
11 j = 1
12 for k = p to r
13     if L[i] <= R[j]
14         A[k] = L[i]
15         i = i + 1
16     else A[k] = R[j]
17         j = j + 1
```

Figure 2.3은 `MERGE(A, 9, 12, 16)`에서 $A[9..16] = <2, 4, 5, 7, 1, 2, 3, 6>$인 경우를 보여준다. $L = <2, 4, 5, 7, \infty>$, $R = <1, 2, 3, 6, \infty>$를 만들고, `i`, `j`, `k`가 어떤 값을 가리키는지에 따라 $A[9..16]$이 점점 sorted output으로 덮인다.

![Figure 2.3](@/assets/images/cs-algorithm-003-figure-2-3-page-53.png)
*Figure 2.3 · PDF p. 53 · `MERGE(A, 9, 12, 16)`의 초기 반복들: `L`, `R`의 작은 값을 `A`로 복사*

Figure 2.3의 이어지는 부분은 termination 시점까지 보여준다. 마지막에는 $A[9..16] = <1, 2, 2, 3, 4, 5, 6, 7>$이 되고, `L`과 `R`에 복사되지 않은 값은 두 sentinel뿐이다.

![Figure 2.3 continued](@/assets/images/cs-algorithm-004-figure-2-3-page-54.png)
*Figure 2.3 · PDF p. 54 · `MERGE` 종료 시점: 실제 원소는 모두 $A[p..r]$에 sorted order로 복사됨*

#### MERGE의 loop invariant

`MERGE`의 line 12-17 `for` loop는 다음 loop invariant로 correct함을 보인다.

> 각 iteration 시작 시, $A[p..k-1]$은 $L[1..n1+1]$과 $R[1..n2+1]$에 있던 값 중 `k - p`개의 가장 작은 elements를 sorted order로 담고 있다. 또한 $L[i]$와 $R[j]$는 아직 `A`로 복사되지 않은 각 배열의 smallest elements다.

이 invariant는 merge 동작의 본질을 정확히 잡는다. 이미 $A[p..k-1]$에 들어간 값은 최종 위치가 확정된 가장 작은 값들이고, 다음에 비교할 후보는 항상 $L[i]$와 $R[j]$뿐이다.

| 단계 | MERGE에서의 의미 |
| --- | --- |
| Initialization | 첫 iteration에서 $k = p$이므로 $A[p..k-1]$은 empty이고, $i = j = 1$이라 두 배열의 첫 값이 아직 복사되지 않은 smallest elements다. |
| Maintenance | $L[i] \le R[j]$이면 $L[i]$가 전체 남은 값 중 smallest이므로 $A[k]$에 복사하고 `i`를 증가시킨다. 반대면 $R[j]$를 복사하고 `j`를 증가시킨다. |
| Termination | $k = r + 1$이면 $A[p..r]$에 `r - p + 1`개의 smallest real elements가 sorted order로 들어 있다. 남은 두 largest elements는 sentinels다. |

`MERGE`의 running time은 $\Theta(n)$이다. Lines 1-3과 8-11은 constant time이고, lines 4-7의 copy loop는 $\Theta(n1 + n2) = \Theta(n)$, lines 12-17은 정확히 $n = r - p + 1$번 반복되며 각 iteration이 constant time이기 때문이다.

#### MERGE-SORT pseudocode

`MERGE-SORT(A, p, r)`는 subarray $A[p..r]$를 정렬한다. $p \ge r$이면 원소가 0개 또는 1개라 이미 sorted이다. 그렇지 않으면 중간 지점 $q = \operatorname{floor}((p + r) / 2)$를 잡고 $A[p..q]$, $A[q+1..r]$를 재귀적으로 정렬한 뒤 `MERGE(A, p, q, r)`로 합친다.

```text
MERGE-SORT(A, p, r)
1  if p < r
2      q = floor((p + r) / 2)
3      MERGE-SORT(A, p, q)
4      MERGE-SORT(A, q + 1, r)
5      MERGE(A, p, q, r)
```

전체 배열 $A[1..n]$을 정렬하려면 `MERGE-SORT(A, 1, A.length)`를 호출한다. $q = \operatorname{floor}((p + r) / 2)$로 나누면 왼쪽 subarray $A[p..q]$는 $\lceil n/2 \rceil$, 오른쪽 subarray $A[q+1..r]$는 $\lfloor n/2 \rfloor$개의 원소를 갖는다. 분석을 단순화할 때는 보통 $n$이 2의 거듭제곱이라고 가정해 매번 정확히 반으로 나뉜다고 본다.

Figure 2.4는 `A = <5, 2, 4, 7, 1, 3, 2, 6>`에서 merge sort가 bottom-up으로 어떻게 보이는지 보여준다. 실제 procedure는 top-down recursion으로 divide하지만, 결과적으로는 길이 1 sequences를 길이 2로 merge하고, 길이 2 sequences를 길이 4로 merge하고, 마지막에 길이 4 두 개를 merge해 길이 8 sorted sequence를 만든다.

![Figure 2.4](@/assets/images/cs-algorithm-005-figure-2-4-page-56.png)
*Figure 2.4 · PDF p. 56 · `A = <5, 2, 4, 7, 1, 3, 2, 6>`에 대한 merge sort의 merge 단계*

#### Divide-and-conquer recurrence의 일반형

Recursive algorithm의 running time은 종종 recurrence equation, 또는 recurrence로 표현된다. recurrence는 size $n$ 문제의 running time을 smaller inputs의 running time으로 나타내는 식이다.

Divide-and-conquer에서 problem size가 충분히 작아 $n \le c$이면 straightforward solution이 constant time, 즉 $\Theta(1)$이라고 둔다. 그 외에는 원래 문제를 $a$개의 subproblems로 나누고, 각 subproblem size가 원래의 $1/b$라고 하자. 하나의 subproblem을 푸는 시간은 $T(n/b)$, $a$개는 $aT(n/b)$이다. Divide step 시간이 $D(n)$, Combine step 시간이 $C(n)$이면 일반 recurrence는 다음과 같다.

$$
\begin{aligned}
T(n) &=
\begin{cases}
\Theta(1), & \text{if } n \le c, \\
aT(n/b) + D(n) + C(n), & \text{otherwise.}
\end{cases}
\end{aligned}
$$

Merge sort에서는 $a = 2$, $b = 2$이고, divide는 중간 index를 계산하는 정도라 $\Theta(1)$, combine은 `MERGE`라 $\Theta(n)$이다. 따라서 merge sort의 running time은 $T(n) = 2T(n/2) + \Theta(n)$ 꼴의 recurrence로 분석된다.

#### Merge sort recurrence

Merge sort 분석을 단순하게 하기 위해 원문은 먼저 $n$이 2의 거듭제곱이라고 가정한다. 그러면 매 divide step에서 정확히 $n/2$ 크기의 두 subsequences가 생긴다. Chapter 4에서 보이듯, 이 가정은 recurrence solution의 order of growth에는 영향을 주지 않는다.

Merge sort의 worst-case running time $T(n)$은 divide, conquer, combine으로 나누어 세운다.

| 단계 | 비용 | 이유 |
| --- | --- | --- |
| Divide | $D(n) = \Theta(1)$ | 중간 index `q`를 계산하는 constant-time 작업 |
| Conquer | $2T(n/2)$ | 크기 $n/2$인 두 subproblems를 recursive call로 정렬 |
| Combine | $C(n) = \Theta(n)$ | `MERGE`가 $n$개 element를 linear time에 합침 |

따라서 recurrence는 다음과 같다.

$$
\begin{aligned}
T(n) &=
\begin{cases}
\Theta(1), & \text{if } n = 1, \\
2T(n/2) + \Theta(n), & \text{if } n > 1.
\end{cases}
\end{aligned}
$$

Chapter 4의 master theorem을 쓰면 이 recurrence의 해가 $\Theta(n \lg n)$임을 바로 보일 수 있다. 여기서 $\lg n = \log_2 n$이다. $\lg n$은 어떤 linear function보다 느리게 자라므로, sufficiently large inputs에서는 $\Theta(n \lg n)$ merge sort가 worst-case $\Theta(n^{2})$ insertion sort보다 빠르다.

#### Recursion tree로 $\Theta(n \lg n)$ 직관 얻기

Master theorem 없이도 recurrence를 직관적으로 풀 수 있다. 원문은 상수 $c$를 두고 다음 recurrence로 다시 쓴다.

$$
\begin{aligned}
T(n) &=
\begin{cases}
c, & \text{if } n = 1, \\
2T(n/2) + cn, & \text{if } n > 1.
\end{cases}
\end{aligned}
$$

여기서 $c$는 size 1 problem을 푸는 constant time이면서, divide와 combine에서 array element 하나당 드는 constant cost를 대표한다고 본다. 실제로 두 비용이 정확히 같은 상수일 필요는 없다. 더 큰 상수를 잡으면 upper bound, 더 작은 상수를 잡으면 lower bound가 되고, 둘 다 $n \lg n$ order라서 최종적으로 $\Theta(n \lg n)$을 얻는다.

Figure 2.5는 이 recurrence를 recursion tree로 펼치는 방법을 보여준다. root에는 top-level work $cn$이 있고, 아래에는 $T(n/2)$ 두 개가 생긴다. 각 $T(n/2)$는 다시 $cn/2$ 비용과 $T(n/4)$ 두 개로 펼쳐진다. 이 과정을 problem size가 1이 될 때까지 반복한다.

![Figure 2.5](@/assets/images/cs-algorithm-006-figure-2-5-page-59.png)
*Figure 2.5 · PDF p. 59 · $T(n) = 2T(n/2) + cn$을 recursion tree로 펼쳐 각 level 비용을 합산하는 과정*

각 level의 총 비용이 $cn$으로 같다는 점이 핵심이다.

$$
\begin{aligned}
\text{level 0:} 1 node \cdot c n &= cn \\
\text{level 1:} 2 nodes \cdot c(n/2) &= cn \\
\text{level 2:} 4 nodes \cdot c(n/4) &= cn \\
\text{...} \\
\text{level i:} 2^{i} nodes \cdot c(n/2^{i}) &= cn \\
\text{bottom:} n nodes \cdot c &= cn
\end{aligned}
$$

Tree의 leaves 수는 $n$개이고, $n$이 2의 거듭제곱이면 height는 $\lg n$이다. 따라서 level 수는 $\lg n + 1$이다. 각 level이 $cn$ 비용을 내므로 전체 비용은 $cn(\lg n + 1) = cn \lg n + cn$이다. lower-order term $cn$과 constant $c$를 무시하면 $\Theta(n \lg n)$이 된다.

#### Sentinel 없는 MERGE와 analysis 감각

2.3-2 exercise는 `MERGE`를 sentinel 없이 다시 쓰라고 요구한다. 이는 $while i \le n1 and j \le n2$처럼 한쪽 array가 먼저 소진되는지 검사하고, loop가 끝난 뒤 남은 array의 remainder를 복사하는 방식이 된다. Sentinel version은 boundary check를 줄여 pseudocode를 단순하게 하지만, sentinel로 쓸 수 있는 $\infty$ 같은 special value가 실제 key space와 충돌하지 않아야 한다. Sentinel 없는 version은 조건문이 조금 늘지만 key domain에 special value를 요구하지 않는다. 두 방식 모두 merge의 order of growth는 $\Theta(n)$이다.

#### 2.3 exercises가 이어 주는 핵심 변형

2.3의 exercises는 divide-and-conquer와 order-of-growth 감각을 다른 문제로 옮기는 훈련이다.

| 항목 | 핵심 연결 |
| --- | --- |
| recursive insertion sort | $A[1..n-1]$을 재귀적으로 정렬한 뒤 $A[n]$을 삽입하면 worst-case recurrence가 $T(n) = T(n-1) + \Theta(n)$ 형태가 되어 결국 $\Theta(n^{2})$로 이어진다. |
| binary search | sorted sequence에서 midpoint를 보고 절반을 버리므로 recurrence가 $T(n) = T(n/2) + \Theta(1)$이고 worst-case running time은 $\Theta(\lg n)$이다. |
| binary search inside insertion sort | 삽입 위치를 찾는 비교 횟수는 줄일 수 있지만, array element를 오른쪽으로 미는 movement가 여전히 필요하므로 전체 worst-case를 $\Theta(n \lg n)$으로 낮추지는 못한다. |
| two-sum in $\Theta(n \lg n)$ | set $S$를 sort한 뒤 two-pointer 또는 각 원소에 대한 binary search를 사용해 합이 $x$인 pair 존재 여부를 찾을 수 있다. |

#### 대표 문제들이 강조하는 설계 감각

Chapter 2의 Problems는 본문 지식을 그대로 확장한다.

`2-1 Insertion sort on small arrays in merge sort`는 asymptotic order와 실제 성능의 차이를 묻는다. Merge sort는 worst-case $\Theta(n \lg n)$이고 insertion sort는 worst-case $\Theta(n^{2})$이지만, 작은 subproblem에서는 insertion sort의 constant factors가 작아 더 빠를 수 있다. 그래서 merge sort recursion의 leaves를 더 굵게(coarsen) 만들어 size $k$ 이하 sublists는 insertion sort로 정렬하고, 이후 standard merging으로 합치는 hybrid strategy를 생각한다. 이 문제는 $\Theta(nk + n \lg(n/k))$에서 $k$를 어떻게 잡을지 묻고, 실전에서는 machine, compiler, cache behavior를 고려해 empirical tuning이 필요함을 암시한다.

`2-2 Correctness of bubblesort`는 loop invariant proof를 다시 연습시킨다. Bubblesort는 adjacent elements가 out of order이면 swap하면서 작은 값이 앞쪽으로 떠오르게 만든다. Correctness를 보이려면 output이 sorted라는 성질뿐 아니라, output이 input의 permutation이라는 점도 보여야 한다. Worst-case running time은 insertion sort와 같은 quadratic order지만, 일반적으로 비효율적인 정렬로 소개된다.

`2-3 Correctness of Horner's rule`은 polynomial evaluation을 예로 loop invariant와 running time 분석을 적용한다. Horner's rule은

$$
P(x) = a0 + x(a1 + x(a2 + \ldots + x(an-1 + x an)\ldots))
$$

형태로 polynomial을 평가해 naive하게 각 $x^{k}$를 따로 계산하는 방식보다 효율적이다. 핵심은 $for i = n downto 0$ loop가 매 iteration마다 “아직 처리한 suffix polynomial의 값”을 `y`에 유지한다는 invariant를 세우는 것이다.

`2-4 Inversions`는 insertion sort의 running time과 입력의 disorder를 연결한다. Array $A[1..n]$에서 $i < j$인데 $A[i] > A[j]$이면 pair $(i, j)$를 inversion이라고 한다. 이미 정렬된 배열은 inversion이 없고, reverse sorted array는 가장 많은 inversions를 가진다. Insertion sort가 원소를 왼쪽으로 끼워 넣기 위해 수행하는 shifts는 입력의 inversions 수와 밀접하게 대응한다. 또한 inversion count는 merge sort를 변형해 $\Theta(n \lg n)$ worst-case time에 계산할 수 있다.

## 복잡도

| 알고리즘/절차 | Best case | Worst case | 핵심 이유 |
| --- | --- | --- | --- |
| `INSERTION-SORT` | $\Theta(n)$ | $\Theta(n^{2})$ | 이미 sorted이면 각 key가 한 번만 비교되고, reverse sorted이면 각 key가 왼쪽 subarray 전체와 비교된다 |
| `MERGE` | $\Theta(n)$ | $\Theta(n)$ | 두 sorted arrays의 element를 총 $n$개 복사한다 |
| `MERGE-SORT` | $\Theta(n \lg n)$ | $\Theta(n \lg n)$ | 각 recursion level의 merge 비용이 $\Theta(n)$이고 level 수가 $\lg n + 1$이다 |
| binary search | $\Theta(1)$ 또는 $\Theta(\lg n)$ 맥락별 | $\Theta(\lg n)$ | 매 step에서 remaining search space를 절반으로 줄인다 |
| bubblesort | 보통 구현 기준 $\Theta(n^{2})$ | $\Theta(n^{2})$ | nested loops와 adjacent swaps |
| Horner's rule | $\Theta(n)$ | $\Theta(n)$ | coefficients를 한 번씩 처리한다 |

Insertion sort와 merge sort의 차이는 Chapter 2의 가장 중요한 성능 대비다. Insertion sort는 작은 입력이나 거의 정렬된 입력에서 매력적이지만, worst-case growth가 quadratic이다. Merge sort는 추가 배열 `L`, `R`을 사용하고 recursion overhead가 있지만, worst-case $\Theta(n \lg n)$을 보장한다.

## 연결 관계

Chapter 2는 이후 장들의 분석 언어를 만든다. `Θ-notation`은 Chapter 3에서 엄밀해지고, divide-and-conquer recurrence와 master theorem은 Chapter 4에서 체계화된다. Randomized algorithms와 expected running time은 Chapter 5로 이어진다.

`MERGE`와 `MERGE-SORT`는 이후 정렬 알고리즘뿐 아니라 여러 divide-and-conquer 문제의 기본 패턴이 된다. Inversions counting처럼 “merge하면서 추가 정보를 세는” 기법은 단순 정렬을 넘어 problem-specific data를 효율적으로 계산하는 방법을 보여준다. Binary search는 sorted structure가 있을 때 search space를 반씩 줄이는 대표 예로, 나중의 balanced search trees, binary search trees, divide-and-conquer reasoning과 자연스럽게 연결된다.

## 오해하기 쉬운 내용

- `pseudocode`는 실제 언어 문법을 정확히 따르는 코드가 아니다. 알고리즘의 핵심 절차를 명확하게 표현하기 위한 표기다.
- `in-place`는 extra memory가 전혀 없다는 뜻이 아니다. 동시에 array 밖에 저장하는 element 수가 constant라는 의미다.
- loop invariant는 “loop가 끝나면 참인 말”이 아니다. 각 iteration 시작 시점마다 유지되는 성질이며, termination condition과 결합해 correctness를 보인다.
- RAM model에서 모든 고수준 문장이 constant time은 아니다. “sort the points” 같은 문장은 내부 알고리즘 비용을 별도로 가진다.
- best-case가 좋다고 algorithm 전체가 효율적인 것은 아니다. CLRS는 보장 관점에서 worst-case running time을 주로 본다.
- $\Theta(n^{2})$ 알고리즘이 항상 $\Theta(n \lg n)$ 알고리즘보다 느린 것은 아니다. 작은 n에서는 constant factor와 lower-order terms가 이길 수 있지만, 충분히 큰 n에서는 lower order of growth가 중요해진다.
- `MERGE`의 sentinel $\infty$는 편의를 위한 special value다. 실제 구현에서는 key domain과 충돌하지 않는지, 또는 sentinel 없는 구현이 필요한지 따져야 한다.
- Binary search로 insertion position을 빨리 찾아도 array shift 비용이 남기 때문에 insertion sort의 worst-case가 자동으로 $\Theta(n \lg n)$이 되지는 않는다.

## 면접 질문

1. `INSERTION-SORT`의 loop invariant를 말하고, Initialization, Maintenance, Termination으로 correctness를 증명하라.
2. `INSERTION-SORT`가 in-place sorting인 이유와, worst-case가 $\Theta(n^{2})$인 이유를 설명하라.
3. RAM model에서 running time을 분석할 때 어떤 instruction을 constant time으로 보고, 어떤 고수준 문장을 조심해야 하는가?
4. Best-case, worst-case, average-case running time의 차이를 insertion sort 예시로 설명하라.
5. `MERGE(A, p, q, r)`의 precondition과 postcondition을 설명하고, sentinel이 하는 역할을 말하라.
6. `MERGE`가 $\Theta(n)$ time에 동작하는 이유를 line별 또는 loop별로 설명하라.
7. Divide-and-conquer의 Divide, Conquer, Combine 단계를 merge sort에 대응시켜 설명하라.
8. Merge sort recurrence $T(n) = 2T(n/2) + \Theta(n)$이 왜 $\Theta(n \lg n)$이 되는지 recursion tree로 설명하라.
9. 왜 insertion sort는 작은 subarray에서 merge sort보다 실전적으로 빠를 수 있는가?
10. Inversion count와 insertion sort의 수행 시간은 어떤 관계가 있는가?
