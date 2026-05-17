---
title: "Chapter 5. Probabilistic Analysis and Randomized Algorithms"
order: 5
pubDatetime: 2026-05-17T00:00:00+09:00
modDatetime: 2026-05-17T00:00:00+09:00
description: "CLRS 알고리즘 정리: Chapter 5. Probabilistic Analysis and Randomized Algorithms"
tags:
  - "Algorithm"
  - "CS"
  - "CLRS"
---

## 개요

Chapter 5는 알고리즘 분석에 확률(probability)을 넣는 두 가지 방식을 구분한다. 하나는 입력이 어떤 확률분포를 따른다고 가정하고 평균을 내는 `probabilistic analysis`이고, 다른 하나는 알고리즘 내부에서 난수(randomness)를 직접 사용해 동작을 바꾸는 `randomized algorithm`이다.

이 장의 출발점은 `hiring problem`이다. 이 문제는 실제 고용 이야기가 아니라, sequence를 왼쪽부터 훑으면서 현재까지의 best candidate, maximum, minimum, winner를 갱신하는 흔한 계산 패턴을 모델링한다. Chapter 5는 이 단순한 패턴을 통해 average-case running time, expected running time, indicator random variables, random permutation, online decision 문제까지 이어 간다.

## 핵심 개념

| 용어 | 의미 | 검색 키워드 |
| --- | --- | --- |
| probabilistic analysis | 입력 분포(input distribution)를 가정하고 알고리즘 비용의 평균을 분석하는 방법 | average-case running time |
| randomized algorithm | 입력 외에 random-number generator가 만든 값으로도 동작이 결정되는 알고리즘 | expected running time |
| hiring problem | candidate를 순서대로 보고 현재 최고보다 좋으면 hire하는 모델 | HIRE-ASSISTANT |
| random permutation | 가능한 모든 permutation이 같은 확률로 나타나는 순열 | uniform random permutation |
| RANDOM(a, b) | `a`부터 `b`까지의 정수를 균등하고 독립적으로 반환한다고 가정하는 난수 생성기 | random-number generator |
| total order | candidate끼리 항상 우열 비교가 가능하고 전체 순위를 매길 수 있는 관계 | rank(i) |

## 세부 정리

### 5.1 The hiring problem

#### 문제 설정

`hiring problem`에서는 office assistant 후보가 하루에 한 명씩 온다. 매번 candidate를 interview하고, 지금까지 본 사람 중 가장 qualified한 candidate라면 현재 assistant를 fire하고 새 candidate를 hire한다. 목표는 이 전략의 비용을 추정하는 것이다.

원문의 절차는 다음과 같다.

```text
HIRE-ASSISTANT(n)
1  best = 0
2  for i = 1 to n
3      interview candidate i
4      if candidate i is better than candidate best
5          best = i
6          hire candidate i
```

`candidate 0`은 모든 실제 candidate보다 낮은 dummy candidate다. 이 초기값 덕분에 첫 번째 실제 candidate는 반드시 현재 best보다 좋으므로 hire된다.

이 모델이 중요한 이유는 “현재까지의 winner를 유지하면서 sequence를 훑는” 많은 알고리즘을 대표하기 때문이다. 예를 들어 array maximum을 찾을 때 현재 maximum을 갱신하는 횟수, streaming 상황에서 best-so-far record가 바뀌는 횟수, online decision에서 더 좋은 선택지가 등장하는 횟수와 같은 구조가 여기에 대응된다.

#### Cost model

Chapter 2의 running time 분석에서는 primitive operation 수를 세는 데 집중했다. 여기서는 running time 대신 `interview cost`와 `hiring cost`를 센다. 하지만 분석 기법은 같다. 결국 어떤 basic operation이 몇 번 실행되는지를 세는 문제다.

표기:

- `c_i`: candidate 한 명을 interview하는 낮은 비용
- `c_h`: candidate를 실제로 hire하는 높은 비용
- `m`: 실제 hire 횟수
- `n`: candidate 수

전체 비용은 다음처럼 볼 수 있다.

```text
O(c_i n + c_h m)
```

interview는 항상 `n`번 하므로 `c_i n`은 deterministic하다. 반면 hire 횟수 `m`은 candidate가 어떤 순서로 오느냐에 따라 달라진다. 따라서 핵심 분석 대상은 `c_h m`, 즉 hire가 몇 번 발생하는가다.

#### Worst-case analysis

worst case는 candidate가 quality의 strictly increasing order로 오는 경우다. 매번 새 candidate가 지금까지 본 사람보다 좋으므로 매번 hire한다.

```text
m = n
total hiring cost = O(c_h n)
```

이 분석은 안전한 upper bound를 주지만, typical case를 설명하지 못한다. candidate order가 늘 increasing이라고 보기 어렵기 때문에, “보통은 얼마나 자주 hire하는가?”라는 질문이 자연스럽게 나온다.

#### Probabilistic analysis

`probabilistic analysis`는 problem이나 input에 대한 확률분포를 가정하고, 그 분포 위에서 알고리즘 비용의 평균을 계산하는 방법이다. 이때 말하는 평균 비용은 `average-case running time` 또는 이 문제에서는 average-case hiring cost에 해당한다.

중요한 전제는 입력 분포를 알아야 하거나 합리적으로 가정할 수 있어야 한다는 점이다. 어떤 문제에서는 가능한 input들이 어떻게 나타나는지 reasonable assumption을 둘 수 있지만, 어떤 문제에서는 현실적인 input distribution을 설명할 수 없다. 후자의 경우에는 probabilistic analysis를 그대로 적용하기 어렵다.

`hiring problem`에서는 candidate가 random order로 온다고 가정할 수 있다. 이를 엄밀히 말하려면 candidate들 사이에 `total order`가 있어야 한다. 즉 임의의 두 candidate를 비교해 누가 더 qualified한지 결정할 수 있고, 각 candidate에 unique rank를 줄 수 있다.

```text
rank(i) = applicant i의 순위
```

원문은 높은 rank가 더 qualified한 applicant를 의미하도록 약속한다. 그러면 입력 순서는 다음 rank list로 표현된다.

```text
<rank(1), rank(2), ..., rank(n)>
```

candidate가 random order로 온다는 말은 이 rank list가 `1..n`의 `n!`개 permutation 중 하나이며, 모든 permutation이 같은 확률로 나타난다는 뜻이다. 이를 `uniform random permutation`이라고 한다.

#### Randomized algorithms

`probabilistic analysis`는 입력이 random하다고 가정한다. 하지만 실제로 candidate가 random order로 오는지 알 수 없는 경우가 많다. 입력 분포를 모르거나 모델링하기 어렵다면, 알고리즘이 직접 randomness를 사용하도록 설계할 수 있다.

`randomized algorithm`은 동작이 input뿐 아니라 random-number generator가 반환한 값에도 의존하는 알고리즘이다. 원문은 다음 이상적 난수 생성기를 가정한다.

```text
RANDOM(a, b)
```

`RANDOM(a, b)`는 `a, a+1, ..., b` 중 하나를 균등한 확률로 반환하며, 각 호출 결과는 이전 호출과 independent하다고 가정한다. 예를 들어 `RANDOM(0, 1)`은 0과 1을 각각 `1/2` 확률로 반환하고, `RANDOM(3, 7)`은 3, 4, 5, 6, 7을 각각 `1/5` 확률로 반환한다.

실제 programming environment에서는 대개 deterministic algorithm이 통계적으로 random처럼 보이는 값을 내는 `pseudorandom-number generator`를 제공하지만, 알고리즘 분석에서는 이상적인 `RANDOM`을 가정한다.

#### Average-case running time vs expected running time

이 절에서 가장 중요한 구분은 average-case와 expected의 확률 공간이 다르다는 점이다.

| 구분 | 확률이 걸리는 대상 | 의미 |
| --- | --- | --- |
| average-case running time | input distribution | 입력이 random하게 주어진다고 가정하고 평균을 냄 |
| expected running time | algorithm's random choices | 알고리즘 내부의 random choices 위에서 평균을 냄 |

`hiring problem`에서 candidate가 random order로 온다고 믿고 분석하면 average-case analysis다. 반대로 agency가 후보 list를 미리 주고, 우리가 매일 interview할 candidate를 random하게 선택해 순서를 섞는다면 알고리즘이 randomness를 강제한 것이므로 randomized algorithm이 된다.

이 차이가 중요한 이유는 통제권 때문이다. 입력 분포는 외부 세계에 달려 있지만, randomized algorithm의 random choices는 알고리즘 설계자가 통제한다. 따라서 입력이 악의적이거나 unknown distribution이어도, 내부 randomization으로 분석 가능한 구조를 만들 수 있다.

### 5.2 Indicator random variables

#### Indicator random variable의 정의

`indicator random variable`은 어떤 event가 일어났는지를 0 또는 1로 바꾸는 random variable이다. sample space `S`와 event `A`가 있을 때, event `A`에 대응되는 indicator random variable은 다음처럼 정의한다.

```text
I{A} =
  1  if A occurs
  0  if A does not occur
```

이 변수는 복잡한 counting 문제를 “각 사건이 일어났는가?”라는 작은 0/1 변수들의 합으로 바꾸는 데 유용하다.

Lemma 5.1의 핵심은 매우 단순하지만 강력하다.

```text
X_A = I{A}
E[X_A] = Pr{A}
```

증명은 정의를 그대로 쓰면 된다.

```text
E[I{A}] = 1 · Pr{A} + 0 · Pr{not A} = Pr{A}
```

즉 indicator random variable의 expectation은 해당 event의 probability와 같다. 이것이 probability와 expectation 사이를 오가는 다리 역할을 한다.

#### Coin-flip 예시와 linearity of expectation

fair coin을 한 번 던질 때 heads event `H`에 대해

```text
X_H = I{H}
```

라고 두면, heads가 나오면 `X_H = 1`, tails가 나오면 `X_H = 0`이다.

```text
E[X_H] = 1 · Pr{H} + 0 · Pr{T} = 1/2
```

`n`번 coin flips에서 heads의 총 개수 `X`를 알고 싶다면, 각 flip마다 indicator variable을 둔다.

```text
X_i = I{the ith flip results in H}
X = Σ_{i=1}^{n} X_i
```

linearity of expectation에 의해

```text
E[X] = E[Σ X_i]
     = Σ E[X_i]
     = Σ 1/2
     = n/2
```

이 방식의 힘은 모든 경우의 수를 직접 세지 않는다는 데 있다. 더 중요하게는, `linearity of expectation`은 random variables 사이에 independence가 없어도 적용된다. 즉 indicator random variables는 dependent한 사건들을 다룰 때도 expectation 계산을 단순하게 만든다.

#### Hiring problem 분석

이제 `HIRE-ASSISTANT`에서 몇 번 hire하는지 계산한다. Section 5.2에서는 candidate가 random order로 온다고 가정한다. 전체 hire 횟수를 `X`라고 두고 바로

```text
E[X] = Σ_x x Pr{X = x}
```

를 계산할 수도 있지만, `X`의 분포를 직접 구해야 하므로 번거롭다. 대신 candidate별로 indicator random variable을 둔다.

```text
X_i = I{candidate i is hired}
```

그러면 전체 hire 횟수는

```text
X = X_1 + X_2 + ... + X_n
```

이다.

candidate `i`가 hire되는 조건은 candidate `i`가 처음 `i`명 중 가장 qualified한 사람인 경우다. candidate order가 random permutation이면, 처음 `i`명 중 누가 best-so-far인지는 대칭적으로 모두 같은 확률을 가진다. 따라서 candidate `i`가 처음 `i`명 중 최고일 확률은

```text
Pr{candidate i is hired} = 1/i
```

Lemma 5.1에 의해

```text
E[X_i] = 1/i
```

이고, linearity of expectation을 쓰면

```text
E[X] = E[Σ_{i=1}^{n} X_i]
     = Σ_{i=1}^{n} E[X_i]
     = Σ_{i=1}^{n} 1/i
     = ln n + O(1)
```

즉 `n`명을 모두 interview하지만, 평균적으로 실제 hire는 약 `ln n`번만 일어난다.

#### Average-case hiring cost

Lemma 5.2는 random order assumption 아래에서 `HIRE-ASSISTANT`의 average-case total hiring cost를 다음처럼 요약한다.

```text
average-case hiring cost = O(c_h ln n)
```

전체 비용까지 포함하면 interview cost는 항상 발생하므로

```text
O(c_i n + c_h ln n)
```

처럼 볼 수 있다. 원문은 hiring cost의 변화에 집중하기 때문에 `O(c_h ln n)`을 강조한다.

worst-case에서는 매번 hire해서 `O(c_h n)`이지만, random order에서는 expected hires가 harmonic number `H_n = Σ 1/i = ln n + O(1)`로 줄어든다. 이 차이가 Chapter 5 전체의 핵심 감각이다. 입력 순서에 대한 확률 가정 또는 알고리즘 내부 randomization이 있으면, worst-case에서 보이지 않던 typical behavior를 정량화할 수 있다.

### 5.3 Randomized algorithms

#### 입력 분포를 가정하지 않고 직접 만들기

Section 5.2의 분석은 “candidate가 random order로 온다”는 input distribution assumption에 의존했다. 하지만 실제 입력이 그렇게 올지 알 수 없고, 어떤 문제에서는 합리적인 input distribution을 정하기 어렵다. `randomized algorithms`의 아이디어는 입력이 random하다고 믿는 대신, 알고리즘이 직접 randomness를 사용해 필요한 분포를 강제하는 것이다.

`hiring problem`에서는 candidate list를 먼저 받은 뒤, list를 random permutation으로 섞고 나서 `HIRE-ASSISTANT`를 실행하면 된다.

```text
RANDOMIZED-HIRE-ASSISTANT(n)
1  randomly permute the list of candidates
2  best = 0
3  for i = 1 to n
4      interview candidate i
5      if candidate i is better than candidate best
6          best = i
7          hire candidate i
```

이제 어떤 fixed input이 들어와도, 실행 때마다 random permutation이 달라질 수 있다. 즉 나쁜 input 자체가 문제라기보다, random-number generator가 “unlucky permutation”을 만들 때만 비용이 커진다.

Lemma 5.3은 다음을 말한다.

```text
expected hiring cost of RANDOMIZED-HIRE-ASSISTANT = O(c_h ln n)
```

Lemma 5.2와 비교하면 차이가 분명하다.

| 결과 | 확률 가정 | 비용 용어 |
| --- | --- | --- |
| Lemma 5.2 `HIRE-ASSISTANT` | input이 random order라고 가정 | average-case hiring cost |
| Lemma 5.3 `RANDOMIZED-HIRE-ASSISTANT` | algorithm이 input list를 random permute | expected hiring cost |

randomized version은 input distribution assumption을 제거하지만, random permutation을 만드는 추가 시간이 든다.

#### Randomly permuting arrays

많은 randomized algorithms는 input array를 먼저 random permutation으로 만든다. 목표는 단순히 “각 원소가 어느 위치든 갈 확률이 `1/n`”인 것이 아니라, 가능한 모든 permutation이 정확히 같은 확률 `1/n!`로 나오는 `uniform random permutation`을 만드는 것이다.

원문은 두 방법을 설명한다.

#### PERMUTE-BY-SORTING

첫 번째 방법은 각 원소에 random priority를 붙인 뒤, priority를 sort key로 삼아 정렬하는 것이다.

```text
PERMUTE-BY-SORTING(A)
1  n = A.length
2  let P[1..n] be a new array
3  for i = 1 to n
4      P[i] = RANDOM(1, n^3)
5  sort A, using P as sort keys
```

예를 들어 `A = <1, 2, 3, 4>`이고 random priorities가 `P = <36, 3, 62, 19>`라면 priority가 작은 순서대로 `B = <2, 4, 1, 3>`이 된다.

priority 범위를 `1..n^3`처럼 크게 잡는 이유는 priorities가 모두 distinct할 확률을 높이기 위해서다. 원문은 Exercise 5.3-5에서 모든 priority가 unique일 확률이 적어도 `1 - 1/n`임을 보이게 한다. priorities가 distinct하다고 가정하면, sort 후 각 원소의 priority rank가 곧 output position을 결정한다.

시간복잡도는 sorting 단계가 지배한다. comparison sort를 사용하면 Chapter 8의 lower bound에 의해 `Ω(n lg n)`이고, merge sort 같은 알고리즘으로 `Θ(n lg n)`에 맞출 수 있다.

Lemma 5.4는 `PERMUTE-BY-SORTING`이 priorities가 distinct할 때 uniform random permutation을 만든다고 말한다. 증명의 핵심은 특정 permutation 하나가 나올 확률을 계산하는 것이다.

특정 permutation이 나오려면 각 원소가 지정된 priority order를 받아야 한다. 첫 번째 원소가 가장 작은 priority를 받을 확률은 `1/n`, 그 조건 아래 두 번째 원소가 두 번째로 작은 priority를 받을 확률은 `1/(n-1)`, 계속해서 마지막은 `1/1`이다.

```text
(1/n) · (1/(n-1)) · ... · (1/2) · (1/1) = 1/n!
```

이 계산은 identity permutation뿐 아니라 임의의 fixed permutation에도 똑같이 적용된다. 따라서 가능한 모든 permutation이 `1/n!` 확률로 나온다.

중요한 주의점이 하나 있다. 어떤 절차가 각 원소 `A[i]`를 임의의 위치 `j`에 보낼 확률을 `1/n`으로 만들었다고 해서 uniform random permutation인 것은 아니다. permutation 전체 사이의 joint distribution이 균등해야 한다. Exercise 5.3-4의 cyclic shift 예시는 각 원소의 marginal probability는 맞지만 가능한 permutation이 `n!`개가 아니라 `n`개의 rotation에만 제한되므로 uniform random permutation이 아니다.

#### RANDOMIZE-IN-PLACE

두 번째 방법은 array를 in-place로 섞는 것이다. 이 절차는 `O(n)` time이고, 별도 priority array와 sorting이 필요 없다.

```text
RANDOMIZE-IN-PLACE(A)
1  n = A.length
2  for i = 1 to n
3      swap A[i] with A[RANDOM(i, n)]
```

iteration `i`에서 위치 `i`에 들어갈 원소를 아직 확정되지 않은 suffix `A[i..n]` 중에서 uniformly at random으로 고른다. 한 번 위치 `i`가 정해지면 이후 iteration에서는 다시 건드리지 않는다.

직관적으로는 다음 흐름이다.

```text
prefix A[1..i-1]  = 이미 random하게 확정된 부분
suffix A[i..n]    = 아직 섞일 수 있는 후보들
choose one uniformly from suffix and place it at A[i]
```

Lemma 5.5는 loop invariant로 uniform성을 증명한다.

```text
Just prior to iteration i,
A[1..i-1] contains each possible (i-1)-permutation
with probability (n-i+1)! / n!
```

maintenance에서 특정 `i`-permutation `<x_1, ..., x_i>`가 prefix에 나타나려면 두 일이 동시에 일어나야 한다.

1. 앞 `i-1`개 위치가 `<x_1, ..., x_{i-1}>`가 된다.
2. iteration `i`에서 suffix의 `n-i+1`개 원소 중 `x_i`가 선택된다.

따라서 확률은

```text
((n-i+1)! / n!) · (1 / (n-i+1))
= (n-i)! / n!
```

이 된다. loop 종료 시 `i = n+1`이고 전체 `A[1..n]`이 임의의 fixed `n`-permutation일 확률은

```text
0! / n! = 1/n!
```

이므로 `RANDOMIZE-IN-PLACE`는 uniform random permutation을 만든다.

#### 잘못된 permutation 절차를 볼 때의 기준

Chapter 5의 exercises는 random permutation 생성에서 흔한 착각을 찌른다.

- `PERMUTE-WITHOUT-IDENTITY`처럼 자기 자신과 swap하지 않도록 강제하면 identity permutation은 나오지 않지만, 다른 permutation들이 균등해지는 것도 아니다.
- `PERMUTE-WITH-ALL`처럼 매 iteration마다 `A[1..n]` 전체에서 swap 대상을 고르면 직관적으로 random해 보이지만, permutation별 확률이 균등하다는 보장이 없다.
- `PERMUTE-BY-CYCLIC`처럼 random offset만 고르는 방식은 각 element의 위치 marginal probability는 `1/n`일 수 있어도 가능한 output이 cyclic shifts에만 제한된다.

따라서 random permutation 알고리즘의 correctness는 “각 원소가 각 위치에 갈 확률”이 아니라 “각 permutation 전체가 `1/n!` 확률”임을 보여야 한다.

### 5.4 Probabilistic analysis and further uses of indicator random variables

이 절은 네 가지 예시로 probabilistic analysis와 indicator random variables의 쓰임을 확장한다.

1. `birthday paradox`: 같은 생일을 가진 pair가 생길 확률
2. `balls and bins`: 공을 bin에 무작위로 던질 때 occupancy가 어떻게 되는지
3. `streaks`: coin flips에서 consecutive heads가 얼마나 길어지는지
4. `on-line hiring problem`: 모든 candidate를 미리 볼 수 없을 때 언제 hire할지

#### 5.4.1 The birthday paradox

`birthday paradox`의 질문은 “방에 몇 명이 있어야 두 사람이 같은 생일을 가질 확률이 50% 이상인가?”이다. 직관적으로는 365일의 절반쯤 필요할 것 같지만, 실제 threshold는 훨씬 작다.

가정:

- 사람 수: `k`
- 가능한 birthday 수: `n = 365`
- person `i`의 birthday: `b_i`
- 각 birthday는 `1..n`에 uniform하게 분포
- 서로 다른 사람의 birthday selections는 independent

두 특정 사람 `i`, `j`가 같은 생일을 가질 확률은 다음과 같다.

```text
Pr{b_i = b_j} = 1/n
```

직관적으로는 `b_i`가 이미 정해졌을 때, `b_j`가 그 same day를 고를 확률이 `1/n`이기 때문이다. 이 결론은 independence assumption에 의존한다.

##### Complementary event로 exact probability 다루기

“적어도 한 pair가 같은 birthday를 가진다”를 직접 계산하는 대신, 모든 birthday가 distinct한 complementary event를 본다. `B_k`를 `k`명의 birthdays가 모두 distinct한 사건이라고 하자.

`k`번째 사람이 앞 `k-1`명과 다른 birthday를 가질 조건부 확률은, 앞 `k-1`명이 distinct하다는 조건 아래에서

```text
(n-k+1) / n
```

이다. 따라서

```text
Pr{B_k}
= 1 · (n-1)/n · (n-2)/n · ... · (n-k+1)/n
= Π_{i=1}^{k-1} (1 - i/n)
```

`1 + x <= e^x`를 이용하면

```text
Pr{B_k} <= exp(-k(k-1)/(2n))
```

따라서 matching birthday가 있을 확률이 적어도 `1/2`가 되려면

```text
Pr{B_k} <= 1/2
k(k-1) >= 2n ln 2
```

이면 충분하다. `n = 365`에서는 `k >= 23`이면 같은 birthday pair가 있을 확률이 적어도 `1/2`가 된다.

##### Indicator random variables로 approximate analysis

이번에는 같은 birthday를 가진 pair의 expected number를 계산한다. 사람 pair `(i, j)`마다 indicator random variable을 둔다.

```text
X_ij = I{person i and person j have the same birthday}
```

위에서 이미 `Pr{person i and person j have the same birthday} = 1/n`이므로

```text
E[X_ij] = 1/n
```

같은 birthday를 가진 pair의 총수 `X`는 모든 pair에 대한 합이다.

```text
X = Σ_{1 <= i < j <= k} X_ij
```

linearity of expectation으로

```text
E[X]
= Σ_{1 <= i < j <= k} E[X_ij]
= C(k, 2) · (1/n)
= k(k-1)/(2n)
```

따라서 expected matching pairs가 적어도 1이 되려면

```text
k(k-1) >= 2n
```

이면 된다. `n = 365`에서는 `k = 28`일 때 expected number of matching pairs가 약 `1.0356`이다.

두 분석은 묻는 질문이 다르다.

| 분석 | 묻는 값 | `n=365`에서의 기준 |
| --- | --- | --- |
| complementary probability | matching pair가 존재할 확률이 `>= 1/2`가 되는 사람 수 | 23명 |
| indicator expectation | matching pairs의 기대 개수가 `>= 1`이 되는 사람 수 | 28명 |

숫자는 다르지만 asymptotically는 둘 다 `Θ(√n)`이다. 이 예시는 probability of existence와 expected number가 같은 질문이 아님을 보여준다.

#### 5.4.2 Balls and bins

`balls and bins` 모델은 `b`개의 bins에 identical balls를 independent하게 던지는 과정이다. 각 toss에서 ball은 각 bin에 probability `1/b`로 들어간다. 이 모델은 Chapter 11의 hashing 분석과 직접 연결된다.

##### 주어진 bin에 들어가는 balls 수

`n`개의 balls를 던질 때, 특정 bin에 들어가는 balls 수는 binomial distribution을 따른다.

```text
X ~ binomial(n, 1/b)
E[X] = n/b
```

즉 평균적으로 각 bin은 `n/b`개의 balls를 받는다.

##### 주어진 bin이 처음으로 ball을 받을 때까지

특정 bin에 ball이 들어가는 것을 success로 보면 각 toss는 success probability `1/b`인 Bernoulli trial이다. 처음 success까지의 toss 수는 geometric distribution을 따른다.

```text
E[time until a given bin receives a ball] = 1 / (1/b) = b
```

##### 모든 bin이 적어도 하나의 ball을 받을 때까지: coupon collector

모든 bin이 적어도 하나의 ball을 받을 때까지 몇 번 던져야 하는지를 보자. 비어 있던 bin에 ball이 들어가는 toss를 `hit`라고 부른다. 총 `b`개의 hits가 필요하다.

과정을 stage로 나눈다.

- stage `i`: `(i-1)`번째 hit 이후부터 `i`번째 hit까지
- stage `i` 시작 시 이미 공이 들어 있는 bins는 `i-1`개
- empty bins는 `b-i+1`개
- 따라서 다음 toss가 hit일 확률은 `(b-i+1)/b`

stage `i`의 길이를 `n_i`라고 하면 `n_i`는 success probability `(b-i+1)/b`인 geometric distribution이다.

```text
E[n_i] = b / (b-i+1)
```

전체 toss 수 `n`은 stage 길이의 합이다.

```text
n = Σ_{i=1}^{b} n_i
```

linearity of expectation으로

```text
E[n]
= Σ_{i=1}^{b} E[n_i]
= Σ_{i=1}^{b} b/(b-i+1)
= b Σ_{i=1}^{b} 1/i
= b(ln b + O(1))
```

따라서 모든 bins가 적어도 하나의 ball을 받을 때까지 필요한 expected tosses는 대략 `b ln b`이다. 이 문제는 `coupon collector's problem`이라고도 부른다. `b`종류의 coupons를 모두 모으려면 random coupons를 평균적으로 `b ln b`개 정도 모아야 한다는 뜻이다.

#### 5.4.3 Streaks

`streaks` 예시는 fair coin을 `n`번 던질 때 longest streak of consecutive heads의 길이가 `Θ(lg n)`임을 보인다. 먼저 upper bound `O(lg n)`을 잡는다.

event `A_{i,k}`를 position `i`에서 시작하는 길이 `k`의 heads streak가 존재하는 사건으로 둔다. 즉 flips `i, i+1, ..., i+k-1`이 모두 heads인 사건이다.

coin flips가 mutually independent이므로

```text
Pr{A_{i,k}} = 1 / 2^k
```

`k = 2⌈lg n⌉`로 두면

```text
Pr{A_{i, 2⌈lg n⌉}} <= 1/n^2
```

가능한 start position은 최대 `n`개이므로, Boole's inequality 또는 union bound를 쓰면 길이 `2⌈lg n⌉` 이상의 heads streak가 어디선가 시작할 확률은

```text
Pr{some streak of length >= 2⌈lg n⌉}
<= n · (1/n^2)
= 1/n
```

즉 `2 lg n`보다 긴 streak는 매우 드물다. 이를 longest streak length `L`의 expectation에 적용하면, 작은 값 영역은 최대 `2⌈lg n⌉`만큼 기여하고, 큰 값 영역은 확률이 `1/n`보다 작으므로 최대 `n · (1/n)` 정도만 기여한다.

```text
E[L] = O(lg n)
```

더 일반적으로 `r >= 1`에 대해 길이 `r⌈lg n⌉` 이상의 streak가 있을 확률은 대략 `1/n^{r-1}` 이하로 빠르게 줄어든다. 예를 들어 `n = 1000`이면 길이 `20` 이상의 heads streak 확률은 최대 `1/1000`, 길이 `30` 이상의 streak 확률은 최대 `1/1,000,000` 수준이다.

##### Lower bound: 긴 streak가 실제로 생긴다

upper bound는 longest streak가 `O(lg n)`보다 훨씬 길 가능성이 작다는 것을 보였다. lower bound는 길이 `Ω(lg n)`인 streak가 높은 확률로 생김을 보인다.

길이를

```text
s = ⌊(lg n)/2⌋
```

로 두고, `n`번의 flips를 대략 `n/s`개의 disjoint groups로 나눈다. 각 group은 서로 겹치지 않으므로 independent하다. 한 group 전체가 heads일 확률은

```text
1 / 2^s >= 1 / √n
```

이다. 따라서 특정 group이 all-heads streak가 아닐 확률은 최대

```text
1 - 1/√n
```

이고, 모든 group이 실패할 확률은 대략

```text
(1 - 1/√n)^{n/s}
```

이다. `1+x <= e^x`를 이용하면 이 값은 충분히 큰 `n`에서 `O(1/n)`까지 작아진다. 따라서 길이 `⌊(lg n)/2⌋` 이상의 heads streak가 존재할 확률은

```text
1 - O(1/n)
```

이다. 그러면 longest streak length `L`의 expectation은 적어도

```text
E[L] >= ⌊(lg n)/2⌋ · (1 - O(1/n)) = Ω(lg n)
```

이 된다. upper bound와 합치면

```text
E[L] = Θ(lg n)
```

이다.

##### Indicator random variables로 보는 streak count

길이 `k` 이상의 heads streak가 position `i`에서 시작하는 event를 `A_{i,k}`라고 하고,

```text
X_{i,k} = I{A_{i,k}}
```

라고 두자. 길이 `k` streak의 총 개수 `X`는

```text
X = Σ_{i=1}^{n-k+1} X_{i,k}
```

이다. expectation을 취하면

```text
E[X]
= Σ_{i=1}^{n-k+1} E[X_{i,k}]
= Σ_{i=1}^{n-k+1} Pr{A_{i,k}}
= (n-k+1) / 2^k
```

`k = c lg n`이면

```text
E[X] = Θ(1 / n^{c-1})
```

가 된다. `c`가 큰 상수면 expectation이 작아서 그런 긴 streak는 드물고, `c = 1/2`이면 `E[X] = Θ(√n)`이므로 길이 `(1/2)lg n` 정도의 streak는 많이 기대된다. 이 approximate analysis만으로도 longest streak가 `Θ(lg n)` scale이라는 감각을 얻을 수 있다.

#### 5.4.4 The on-line hiring problem

`on-line hiring problem`은 hiring problem의 변형이다. 이번에는 모든 candidate를 interview하면서 계속 hire/fire하지 않는다. 대신 정확히 한 번만 hire하고, 각 interview 직후 즉시 accept하거나 reject해야 한다. 한 번 reject한 candidate는 다시 선택할 수 없다.

목표는 interview 수를 줄이면서도 best-qualified applicant를 선택할 확률을 높이는 것이다. 이 문제는 흔히 `secretary problem` 계열로도 알려져 있다.

가정:

- candidate 수는 `n`
- candidate `i`의 점수는 `score(i)`
- 모든 scores는 distinct
- candidate order는 random하다고 본다
- interview 후에는 지금까지 본 candidate들의 상대적 순위만 안다

원문 전략은 threshold `k`를 정해 처음 `k`명은 무조건 관찰만 하고 reject한 뒤, 이후에는 처음 `k`명보다 좋은 첫 candidate를 hire하는 것이다. 그런 candidate가 끝까지 나오지 않으면 마지막 candidate `n`을 hire한다.

```text
ON-LINE-MAXIMUM(k, n)
1  bestscore = -∞
2  for i = 1 to k
3      if score(i) > bestscore
4          bestscore = score(i)
5  for i = k+1 to n
6      if score(i) > bestscore
7          return i
8  return n
```

이 전략의 감각은 “처음 `k`명으로 기준선을 만들고, 그 이후 기준선을 처음 넘는 사람을 잡는다”이다. `k`가 너무 작으면 기준선이 낮아져 mediocre candidate를 너무 빨리 고를 수 있고, `k`가 너무 크면 best candidate가 관찰 구간에 들어가 버려 놓칠 수 있다.

##### 성공 확률 계산

`S`를 best-qualified applicant를 hire하는 event라고 하자. `S_i`는 best-qualified applicant가 position `i`에 있고, 알고리즘이 그 사람을 선택하는 event다. 처음 `k`명은 무조건 reject하므로 `i <= k`에서는 성공할 수 없다.

```text
Pr{S} = Σ_{i=k+1}^{n} Pr{S_i}
```

position `i`에서 성공하려면 두 조건이 필요하다.

1. `B_i`: 전체 best applicant가 position `i`에 있다.
2. `O_i`: positions `k+1`부터 `i-1` 사이에서 아무도 선택되지 않는다.

`Pr{B_i} = 1/n`이다. `O_i`가 일어나려면 positions `1..i-1` 중 maximum score가 처음 `k`명 안에 있어야 한다. 그 maximum 위치는 `i-1`개 위치 중 uniformly likely이므로

```text
Pr{O_i} = k/(i-1)
```

두 event는 independent하게 다룰 수 있으므로

```text
Pr{S_i} = Pr{B_i}Pr{O_i}
        = k / (n(i-1))
```

따라서 성공 확률은

```text
Pr{S}
= Σ_{i=k+1}^{n} k/(n(i-1))
= (k/n) Σ_{i=k}^{n-1} 1/i
```

integral bound로 harmonic sum을 근사하면

```text
(k/n)(ln n - ln k) <= Pr{S}
```

가 lower bound로 나온다. 이 lower bound를 최대화하려면

```text
maximize  (k/n)(ln n - ln k)
```

를 풀면 되고, derivative를 0으로 두면

```text
ln n - ln k - 1 = 0
k = n/e
```

이다. 따라서 처음 약 `n/e`명, 즉 약 37%는 관찰만 하고 reject한 뒤, 그 이후 관찰 구간의 best보다 좋은 첫 candidate를 고르면 best applicant를 선택할 확률이 적어도

```text
1/e
```

이다.

이 결과는 optimal stopping의 전형적인 trade-off를 보여준다. 좋은 기준선을 만들려면 기다려야 하지만, 너무 오래 기다리면 좋은 선택지를 이미 놓친다.

#### Problems and chapter notes

Chapter 5의 problems는 이 장의 probability 도구가 실제 알고리즘 분석으로 어떻게 넘어가는지 보여준다.

- `5-1 Probabilistic counting`은 작은 `b-bit counter`로 큰 count를 approximate하게 표현하는 방법이다. counter value `i`가 실제 count `n_i`를 대표하고, `INCREMENT`가 확률적으로만 counter를 증가시킨다. 핵심은 precision을 희생해 표현 범위를 늘리는 randomized/approximate counting이다.
- `5-2 Searching an unsorted array`는 `RANDOM-SEARCH`, `DETERMINISTIC-SEARCH`, `SCRAMBLE-SEARCH`를 비교한다. 같은 unsorted search라도 input distribution assumption, random index sampling, random permutation이 분석 관점을 바꾼다.
- Chapter notes는 randomized algorithms의 장점이 널리 연구되어 왔고, hiring problem의 변형이 `secretary problems`로 알려져 있음을 연결한다.

## 복잡도

| 대상 | 기대값/확률/복잡도 | 핵심 이유 |
| --- | --- | --- |
| `HIRE-ASSISTANT` worst case | `O(c_h n)` hiring cost | candidate가 strictly increasing quality로 오면 매번 hire |
| `HIRE-ASSISTANT` average case | `O(c_h ln n)` hiring cost | `Pr{candidate i is hired}=1/i` |
| `RANDOMIZED-HIRE-ASSISTANT` | `O(c_h ln n)` expected hiring cost | random permutation을 algorithm이 강제 |
| `PERMUTE-BY-SORTING` | `Θ(n lg n)` with comparison sort | random priorities를 sort |
| `RANDOMIZE-IN-PLACE` | `O(n)` | suffix에서 하나를 uniformly 골라 prefix 확정 |
| birthday paradox | threshold `Θ(√n)` | pair 수 `C(k,2)`가 birthday space `n`과 경쟁 |
| coupon collector | `b(ln b + O(1))` expected tosses | empty bin hit probability가 stage마다 감소 |
| longest heads streak | `Θ(lg n)` expected length | 길이 `c lg n` streak의 expected count가 `c`에 따라 급변 |
| `ON-LINE-MAXIMUM` | `k = n/e`, success probability at least `1/e` | observe-then-select trade-off |

## 연결 관계

- Chapter 2의 running time 분석과 본질적으로 같은 counting 문제다. 단, Chapter 5에서는 counting 대상이 random variable이 된다.
- Appendix C의 probability, expectation, indicator random variables, Bernoulli trials, binomial distribution, geometric distribution, independence가 직접 사용된다.
- Chapter 8의 sorting lower bound와 연결된다. `PERMUTE-BY-SORTING`은 comparison sort를 쓰면 `Θ(n lg n)`이지만, `RANDOMIZE-IN-PLACE`는 sorting 없이 `O(n)`에 uniform random permutation을 만든다.
- Chapter 11의 hashing 분석은 `balls and bins` 모델을 기반으로 한다. keys가 bins에 분포하는 load, empty bins, collisions 같은 질문이 같은 모델로 표현된다.
- 이후 randomized quicksort, randomized selection 같은 알고리즘에서 “input이 나빠도 random choices가 평균 성능을 보장한다”는 Chapter 5의 관점이 반복된다.

## 오해하기 쉬운 내용

- `average-case running time`과 `expected running time`은 같은 말이 아니다. 전자는 input distribution 위의 평균이고, 후자는 randomized algorithm의 random choices 위의 평균이다.
- `linearity of expectation`은 independence가 없어도 성립한다. indicator random variables가 강력한 이유가 여기에 있다.
- 각 원소가 각 위치에 갈 marginal probability가 `1/n`이라고 해서 uniform random permutation이 아니다. permutation 전체가 `1/n!`로 균등해야 한다.
- `birthday paradox`에서 “matching pair가 있을 확률이 1/2 이상”과 “expected matching pairs가 1 이상”은 서로 다른 질문이다.
- `balls and bins`에서 특정 bin을 채우는 시간의 expectation은 `b`지만, 모든 bins를 채우는 시간은 마지막 몇 개 empty bins 때문에 `b ln b`로 커진다.
- longest streak가 `Θ(lg n)`이라는 말은 모든 실행에서 길이가 정확히 `lg n` 근처라는 뜻이 아니라 expectation과 high-probability scale이 logarithmic이라는 뜻이다.
- `ON-LINE-MAXIMUM`에서 처음 `k`명을 reject하는 것은 낭비가 아니라 기준선을 만들기 위한 sampling phase다.

## 면접 질문

1. `probabilistic analysis`와 `randomized algorithm`의 차이를 average-case와 expected running time 용어로 설명하라.
2. `indicator random variable`이 무엇이고, 왜 `E[I{A}] = Pr{A}`인지 설명하라.
3. `HIRE-ASSISTANT`에서 expected hires가 `ln n + O(1)`이 되는 이유를 설명하라.
4. `linearity of expectation`이 independence 없이도 쓰인다는 사실이 왜 중요한가?
5. `PERMUTE-BY-SORTING`이 uniform random permutation을 만드는 이유를 `1/n!` 확률로 설명하라.
6. `RANDOMIZE-IN-PLACE`가 왜 `O(n)`이고 uniform한지 loop invariant 관점에서 설명하라.
7. 각 element가 각 position에 갈 확률이 `1/n`인 것과 uniform random permutation의 차이를 예로 설명하라.
8. `birthday paradox`에서 23명과 28명이 각각 어떤 질문에 대한 답인지 구분하라.
9. `coupon collector's problem`의 expected time이 왜 `b ln b`가 되는지 stage별 hit probability로 설명하라.
10. `ON-LINE-MAXIMUM`에서 왜 `k = n/e` 근처가 좋은 threshold인지 설명하라.
