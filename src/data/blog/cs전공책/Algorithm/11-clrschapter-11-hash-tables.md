---
title: "Chapter 11. Hash Tables"
order: 11
pubDatetime: 2026-05-17T00:00:00+09:00
modDatetime: 2026-05-17T00:00:00+09:00
description: "CLRS 알고리즘 정리: Chapter 11. Hash Tables"
tags:
  - "Algorithm"
  - "CS"
  - "CLRS"
---

## 개요

Chapter 11은 dictionary operations인 `INSERT`, `SEARCH`, `DELETE`를 빠르게 지원하는 hash tables를 다룬다. 예를 들어 compiler는 source program의 identifiers를 key로 삼아 symbol table을 유지한다. 이때 key는 숫자일 수도 있고 arbitrary character strings일 수도 있다.

Hash table은 worst case에서는 linked list search처럼 `Θ(n)`까지 나빠질 수 있지만, 적절한 가정 아래 average search time은 `O(1)`이다. 이 장의 핵심은 “key를 array index로 직접 쓰기 어렵거나 낭비가 클 때, hash function으로 key를 table slot에 압축해 대응시킨다”는 것이다.

흐름은 다음과 같다.

- `direct-address tables`: key universe가 작으면 key를 그대로 array index로 사용한다.
- `hash tables with chaining`: key universe가 커서 table size를 줄이고, collisions는 linked lists로 해결한다.
- `hash functions`: division method, multiplication method, universal hashing으로 index를 계산한다.
- `open addressing`: 모든 원소를 table 안에 직접 저장하고 probe sequence로 collision을 처리한다.
- `perfect hashing`: static set에서 worst-case `O(1)` search를 보장한다.

## 핵심 개념

| 용어 | 의미 | 검색 키워드 |
| --- | --- | --- |
| dictionary | `INSERT`, `SEARCH`, `DELETE`를 지원하는 dynamic set | dictionary operations |
| direct-address table | key를 table index로 직접 사용하는 구조 | DIRECT-ADDRESS |
| universe `U` | 가능한 모든 key의 집합 | universe of keys |
| actual keys `K` | 실제 저장된 key들의 집합 | actual keys |
| hash table | hash function으로 key를 slot에 mapping하는 table | hash table |
| hash function | key를 table index로 바꾸는 함수 | hash function, `h(k)` |
| collision | 서로 다른 key가 같은 slot으로 mapping되는 상황 | collision |
| chaining | 각 slot에 linked list를 두어 collision을 해결하는 방식 | chaining |
| load factor | table slot 수 대비 저장된 key 수 | `α = n/m` |
| open addressing | table 안에서 probe sequence를 따라 빈 slot을 찾는 방식 | linear probing, double hashing |
| universal hashing | hash function을 무작위로 골라 adversarial key set에 대응하는 방법 | universal hashing |
| perfect hashing | static key set에서 collision 없는 2-level hashing | perfect hashing |

## 세부 정리

### 11.1 Direct-address tables

#### Direct addressing이 성립하는 조건

`direct addressing`은 key universe가 충분히 작을 때 가장 단순하고 강력한 방법이다. 가능한 key universe를

```text
U = {0, 1, ..., m-1}
```

라고 하자. 각 element의 key가 `U`에서 나오고, 서로 같은 key를 가진 원소가 없다고 가정한다. 그러면 array `T[0..m-1]`를 만들고 key `k`를 slot `T[k]`에 직접 대응시킬 수 있다.

```text
T[k] = pointer to element with key k
T[k] = NIL if key k is absent
```

![Figure 11.1](@/assets/images/043_figure_11-1_page_275.png)
*Figure 11.1 · PDF p. 275 · universe `U`의 각 key를 direct-address table `T`의 같은 index에 대응시키는 구조*

Figure 11.1에서는 `U = {0,1,...,9}`이고 실제 key set은 `K = {2,3,5,8}`이다. 따라서 `T[2]`, `T[3]`, `T[5]`, `T[8]`만 element를 가리키고 나머지 slots는 `NIL`이다.

#### DIRECT-ADDRESS operations

Direct addressing의 dictionary operations는 거의 array indexing 그 자체다.

```text
DIRECT-ADDRESS-SEARCH(T, k)
1  return T[k]

DIRECT-ADDRESS-INSERT(T, x)
1  T[x.key] = x

DIRECT-ADDRESS-DELETE(T, x)
1  T[x.key] = NIL
```

각 operation은 `O(1)` time이다. Hashing이 목표로 하는 평균 `O(1)` dictionary operation의 가장 단순한 기준점이 direct-address table이다.

#### Slot에 pointer를 둘 것인가 object 자체를 둘 것인가

Figure 11.1은 `T[k]`가 element object를 가리키는 pointer를 저장한다고 설명한다. 하지만 어떤 application에서는 table slot 자체에 object를 저장할 수 있다. 이 방식은 pointer object를 따로 두지 않아도 되므로 공간을 줄일 수 있다.

다만 object를 직접 저장하면 empty slot을 구분해야 한다.

- 특별한 key value를 두어 empty slot을 표시할 수 있다.
- key를 slot index로 알 수 있으므로 object 안에 key를 저장하지 않아도 될 수 있다.
- key를 저장하지 않는다면 “이 slot이 비었는가?”를 알 별도 표시가 반드시 필요하다.

#### Direct addressing의 한계

Direct addressing은 `m = |U|` 크기의 table을 필요로 한다. 실제 저장된 key 수 `n = |K|`가 universe 크기보다 훨씬 작으면 대부분 slots가 `NIL`로 낭비된다.

```text
U는 매우 큼
K는 작음
=> direct-address table은 공간 낭비가 큼
```

Hash table은 이 상황을 해결하기 위해 등장한다. Table size를 actual keys 수에 비례하게 잡고, key를 직접 index로 쓰는 대신 hash function으로 index를 계산한다.

#### 11.1 Exercises가 확장하는 구현 감각

- Direct-address table에서 maximum을 찾으려면 큰 index부터 scan할 수 있지만 worst case는 `Θ(m)`이다.
- Satellite data가 없는 distinct keys라면 bit vector로 set membership을 표현할 수 있다.
- Duplicate keys와 satellite data를 허용하려면 각 direct-address slot에 list를 둘 수 있다.
- Huge array를 초기화하지 않고 쓰려면 실제 저장된 slots를 별도 stack-like array로 관리해 “garbage value인지 valid entry인지”를 `O(1)`에 판별해야 한다.

### 11.2 Hash tables

#### Direct addressing에서 hashing으로

Direct addressing의 단점은 universe `U`가 크면 table `T`도 `|U|`만큼 커져야 한다는 점이다. 실제 저장되는 key set `K`가 작다면 대부분 slot이 낭비된다.

Hash table은 key `k`를 직접 slot `k`에 넣지 않고, hash function `h`로 계산한 slot에 넣는다.

```text
h : U -> {0, 1, ..., m-1}
```

여기서 `m`은 hash table `T[0..m-1]`의 slot 수이고, 보통 `m << |U|`이다. Key `k`가 slot `h(k)`로 간다고 말하며, `h(k)`를 key `k`의 hash value라고 한다.

![Figure 11.2](@/assets/images/044_figure_11-2_page_277.png)
*Figure 11.2 · PDF p. 277 · hash function `h`가 큰 universe의 keys를 작은 hash-table slots로 mapping하는 구조*

Figure 11.2에서 `k_2`와 `k_5`가 같은 slot으로 mapping된다. 이런 상황을 `collision`이라고 한다.

#### Collision은 피할 수 없고, 해결해야 한다

이상적으로는 모든 key가 서로 다른 slot으로 가면 좋다. 하지만 `|U| > m`이면 pigeonhole principle 때문에 서로 다른 두 key가 같은 slot으로 가는 경우가 반드시 존재한다.

좋은 hash function은 random하게 섞는 것처럼 보여 collision 수를 줄일 수 있지만, hash function은 deterministic해야 한다. 같은 key `k`는 항상 같은 `h(k)`를 내야 한다. 따라서 collision을 완전히 피할 수 있다고 가정하면 안 되고, collision resolution 방법이 필요하다.

CLRS는 두 가지 큰 방법을 다룬다.

| 방법 | 설명 |
| --- | --- |
| chaining | 같은 slot으로 hash된 elements를 linked list에 모은다 |
| open addressing | table 안의 다른 slots를 probe해서 빈 slot을 찾는다 |

#### Collision resolution by chaining

`chaining`에서는 hash table의 각 slot `T[j]`가 linked list의 head를 가리킨다. 그 list에는 `h(k) = j`인 모든 elements가 들어간다. 해당 slot에 아무 원소도 없으면 `T[j] = NIL`이다.

![Figure 11.3](@/assets/images/045_figure_11-3_page_278.png)
*Figure 11.3 · PDF p. 278 · 같은 hash value를 가진 keys를 각 table slot의 linked list에 연결하는 chaining*

Figure 11.3에서는 `h(k_1) = h(k_4)`인 keys가 같은 chain에 있고, `h(k_5) = h(k_7) = h(k_2)`인 keys도 같은 chain에 있다.

#### CHAINED-HASH operations

```text
CHAINED-HASH-INSERT(T, x)
1  insert x at the head of list T[h(x.key)]

CHAINED-HASH-SEARCH(T, k)
1  search for an element with key k in list T[h(k)]

CHAINED-HASH-DELETE(T, x)
1  delete x from the list T[h(x.key)]
```

`CHAINED-HASH-INSERT`는 원소가 이미 table에 없다고 가정하면 head insertion으로 `O(1)`이다. 중복 여부를 확인해야 한다면 먼저 search를 해야 하므로 추가 비용이 든다.

`CHAINED-HASH-DELETE`는 입력이 key가 아니라 element pointer `x`라는 점이 중요하다. Chain이 doubly linked list이면 `x`를 `O(1)`에 삭제할 수 있다. Singly linked list라면 predecessor를 찾아야 하므로 search와 같은 asymptotic cost가 든다.

#### Load factor α

Hash table `T`가 `m` slots를 가지고 `n` elements를 저장한다고 하자. Load factor `α`는 slot 하나당 평균 elements 수다.

```text
α = n / m
```

Chaining에서는 한 slot에 여러 elements가 들어갈 수 있으므로 `α`는 1보다 클 수도 있다.

각 slot `T[j]`의 chain length를 `n_j`라고 하면

```text
n = n_0 + n_1 + ... + n_{m-1}
E[n_j] = α
```

이다.

#### Worst case

Chaining hash table의 worst case는 모든 keys가 같은 slot으로 hash되는 경우다. 그러면 chain 하나의 길이가 `n`이 되고, search는 `Θ(n)`이 된다. 이 경우 hash table은 모든 elements를 하나의 linked list에 넣은 것과 다르지 않다.

따라서 ordinary hashing은 worst-case performance를 보고 쓰는 자료구조가 아니다. 평균 성능은 좋지만, worst-case `Θ(n)`은 남아 있다. Static set에서 worst-case `O(1)` search를 얻는 방법은 Section 11.5의 `perfect hashing`에서 다룬다.

#### Simple uniform hashing

Average-case analysis를 위해 CLRS는 `simple uniform hashing`을 가정한다.

```text
각 key는 m개 slots 중 어느 하나로 갈 확률이 동일하고,
다른 key들이 어디로 hash되는지와 독립적이다.
```

또한 hash value `h(k)` 계산은 `O(1)`이라고 본다. 그러면 search time의 핵심은 `T[h(k)]` chain에서 몇 개 elements를 검사하느냐다.

#### Unsuccessful search: Theorem 11.1

Table에 없는 key `k`를 찾는 unsuccessful search에서는 `T[h(k)]` chain 끝까지 검사해야 한다. Simple uniform hashing 아래에서 `k`는 어느 slot으로든 동일 확률로 hash되고, 해당 chain의 expected length는 `α`다.

따라서 검사하는 element 수의 expectation은 `α`이고, hash 계산과 slot 접근 `O(1)`까지 포함하면

```text
unsuccessful search = Θ(1 + α)
```

이다.

#### Successful search: Theorem 11.2

Successful search는 조금 더 미묘하다. 모든 chain이 같은 확률로 검색되는 것이 아니라, 긴 chain일수록 그 안의 element가 많아 검색될 가능성이 더 크다. 그래도 평균 시간은 `Θ(1+α)`로 나온다.

CLRS의 분석은 insertion order를 사용한다. 새 elements는 chain의 front에 삽입된다. 어떤 element `x_i`를 검색할 때 앞에 있는 elements는 `x_i`보다 나중에 삽입되었고 같은 slot으로 hash된 elements다.

`x_i`의 key를 `k_i`라고 하고, indicator random variable을

```text
X_ij = I{ h(k_i) = h(k_j) }
```

로 두면 simple uniform hashing 아래에서

```text
E[X_ij] = 1/m
```

이다. 평균적으로 successful search에서 검사하는 elements 수는

```text
1 + (n-1)/(2m)
= 1 + α/2 - α/(2n)
```

이고, hash 계산까지 포함하면

```text
successful search = Θ(1 + α)
```

이다.

#### α가 constant이면 dictionary operations도 평균 constant

만약 table slot 수 `m`이 elements 수 `n`에 비례하면

```text
n = O(m)
α = n/m = O(1)
```

이다. 그러면 chaining hash table에서 search는 average `O(1)`이고, insert는 worst-case `O(1)`, doubly linked chains에서 delete도 worst-case `O(1)`이다.

즉 적절한 table size와 좋은 hash distribution이 있으면 dictionary operations를 평균적으로 constant time에 지원할 수 있다.

#### 11.2 Exercises가 묻는 구현 감각

- Simple uniform hashing에서 expected collisions 수는 key pair마다 같은 slot에 갈 확률 `1/m`을 더해 계산한다.
- Chain을 sorted order로 유지하면 unsuccessful search는 빨라질 수 있지만, insertion이 더 비싸지고 successful search의 평균이 자동으로 좋아지는 것은 아니다.
- Hash table slots 안에서 element storage와 free list를 함께 관리할 수 있다. 이때 Chapter 10의 free list 사고방식이 그대로 쓰인다.
- `|U| > nm`이면 어떤 hash function이든 같은 slot으로 몰리는 `n`개 key subset이 존재할 수 있어 worst-case `Θ(n)`을 피할 수 없다.

### 11.3 Hash functions

#### 좋은 hash function의 목표

좋은 hash function은 simple uniform hashing에 가깝게 동작해야 한다. 즉 각 key가 `m`개 slots 중 어느 곳으로도 거의 균등하게 가고, 다른 key들의 hash 결과와도 독립에 가까워야 한다.

하지만 실제로는 key distribution을 모르는 경우가 많고, keys가 독립적으로 생성된다고 가정하기도 어렵다. 예를 들어 compiler symbol table의 identifiers에서는 `pt`, `pts`처럼 서로 관련 있는 strings가 같은 program 안에 자주 등장한다. 좋은 hash function은 이런 data pattern이 slot pattern으로 그대로 드러나지 않게 해야 한다.

CLRS는 hash function 설계를 세 부류로 설명한다.

| 방법 | 성격 | 핵심 |
| --- | --- | --- |
| division method | heuristic | `h(k) = k mod m` |
| multiplication method | heuristic | fractional part of `kA`를 사용 |
| universal hashing | randomized, provable | hash function 자체를 무작위로 선택 |

#### Interpreting keys as natural numbers

대부분 hash functions는 key universe를 natural numbers `N = {0,1,2,...}`로 본다. Key가 string이면 radix notation으로 자연수처럼 해석한다.

예를 들어 ASCII에서 `p = 112`, `t = 116`이면 identifier `pt`를 radix-128 integer로 해석할 수 있다.

```text
pt = (112 * 128) + 116 = 14452
```

이후 설명에서는 keys가 natural numbers라고 가정한다. 실제 구현에서도 string hash는 문자들을 일정한 base의 digit처럼 누적해 integer residue를 계산하는 방식으로 자주 만들어진다.

#### 11.3.1 The division method

`division method`는 key `k`를 table size `m`으로 나눈 나머지를 hash value로 쓴다.

```text
h(k) = k mod m
```

예를 들어 `m = 12`, `k = 100`이면 `h(k) = 4`다. 한 번의 division으로 계산할 수 있어 빠르다.

하지만 `m` 선택이 중요하다. `m = 2^p`이면

```text
h(k) = k mod 2^p
```

는 key의 lower-order `p` bits만 보는 것과 같다. Key의 low bits가 균등하지 않다면 hash distribution도 나빠진다. Hash function은 가능하면 key의 모든 bits에 의존하는 편이 좋다.

또 `m = 2^p - 1`도 character string을 radix `2^p`로 해석할 때 좋지 않을 수 있다. Exercise 11.3-3이 지적하듯, characters를 permutation해도 hash value가 같아질 수 있기 때문이다.

실무적 heuristic은 다음과 같다.

```text
m은 2의 거듭제곱에 너무 가깝지 않은 prime으로 고른다.
```

예를 들어 대략 `n = 2000`개의 strings를 저장하고 unsuccessful search에서 평균 3개 정도만 보길 원한다면 `α ≈ 3`이므로 `m ≈ 2000/3`이다. CLRS는 prime `m = 701`을 예로 들고

```text
h(k) = k mod 701
```

을 사용한다.

#### 11.3.2 The multiplication method

`multiplication method`는 두 단계로 동작한다.

1. Key `k`에 상수 `A`, `0 < A < 1`을 곱한다.
2. Fractional part `kA mod 1`만 취하고, 여기에 `m`을 곱한 뒤 floor를 취한다.

```text
h(k) = floor(m * (kA mod 1))
```

여기서 `kA mod 1`은 `kA`의 fractional part, 즉 `kA - floor(kA)`다.

이 방법의 장점은 `m` 선택이 division method보다 덜 민감하다는 것이다. 보통 `m = 2^p`로 잡으면 machine word 연산으로 효율적으로 구현할 수 있다.

![Figure 11.4](@/assets/images/046_figure_11-4_page_285.png)
*Figure 11.4 · PDF p. 285 · multiplication method에서 `k * s`의 lower word `r0`에서 상위 `p` bits를 hash value로 추출하는 과정*

Machine word size가 `w` bits이고 `m = 2^p`라고 하자. `A`를

```text
A = s / 2^w
```

꼴로 잡는다. `k`와 `s`를 곱하면 `2w`-bit product가 나오고, 이를 high-order word `r1`과 low-order word `r0`로 나눈다.

```text
k * s = r1 * 2^w + r0
```

Hash value는 `r0`의 most significant `p` bits다. CLRS는 Knuth의 제안으로

```text
A ≈ (sqrt(5) - 1) / 2 = 0.6180339887...
```

이 꽤 잘 동작한다고 소개한다.

#### 11.3.3 Universal hashing

Fixed hash function은 adversary에게 취약하다. 어떤 hash function `h`가 고정되어 있으면, adversary는 같은 slot으로 hash되는 `n`개 keys를 골라 search time을 `Θ(n)`으로 만들 수 있다.

`universal hashing`의 핵심은 hash function 자체를 execution 시작 시 random하게 고르는 것이다. 이렇게 하면 특정 input이 항상 나쁜 behavior를 유발하지 못한다. Quicksort에서 pivot randomization이 fixed bad input을 피하게 해 주는 것과 비슷하다.

Hash functions의 finite collection `H`가 있다고 하자. `H`가 universe `U`에서 table slots `{0,1,...,m-1}`로 mapping한다고 할 때, `H`가 universal이라는 뜻은 다음이다.

```text
서로 다른 모든 keys k,l ∈ U에 대해
Pr_{h randomly chosen from H}[h(k) = h(l)] <= 1/m
```

즉 distinct key pair가 collide할 확률이 completely random independent slot choice에서의 collision 확률 `1/m`보다 크지 않다.

#### Theorem 11.3: universal hashing with chaining

Universal hash function을 random하게 골라 chaining hash table에 `n`개 keys를 저장했다고 하자.

- Search key `k`가 table에 없으면, `k`가 hash되는 list의 expected length는 at most `α = n/m`이다.
- Search key `k`가 table에 있으면, 그 list의 expected length는 at most `1 + α`이다.

분석은 indicator random variables로 한다. Distinct keys `k`, `l`에 대해

```text
X_kl = I{ h(k) = h(l) }
E[X_kl] <= 1/m
```

이고, key `k`와 collide하는 다른 stored keys 수를

```text
Y_k = Σ_{l in T, l != k} X_kl
```

로 두면 linearity of expectation으로 expected collisions가 `α` 근처로 묶인다. 중요한 점은 이 expectation이 key distribution에 대한 가정이 아니라, random choice of hash function에 대한 expectation이라는 것이다.

#### Corollary 11.4

Universal hashing과 chaining을 쓰고, initially empty table with `m` slots에서 `O(m)` insertions만 일어난다면 load factor `α = O(1)`이다. 그러면 어떤 sequence of `n` `INSERT`, `SEARCH`, `DELETE` operations도 expected `Θ(n)` total time에 처리할 수 있다.

이는 adversary가 keys를 어떻게 고르든, hash function을 runtime에 random하게 고르는 것만으로 평균 성능을 보장한다는 의미다.

#### Designing a universal class

CLRS는 다음 family를 universal hash family로 제시한다. 먼저 모든 possible key가 `0..p-1` 안에 들어가도록 prime `p`를 고르고, `p > m`이라고 하자.

```text
Z_p  = {0, 1, ..., p-1}
Z_p* = {1, 2, ..., p-1}
```

`a ∈ Z_p*`, `b ∈ Z_p`에 대해

```text
h_ab(k) = ((a k + b) mod p) mod m
```

로 정의한다. 모든 such functions의 family는

```text
H_pm = { h_ab : a ∈ Z_p*, b ∈ Z_p }
```

이고, 총 `p(p-1)`개의 hash functions가 있다.

Theorem 11.5는 이 `H_pm`이 universal임을 보인다. 직관은 다음과 같다.

- 먼저 `(a k + b) mod p` 단계에서는 distinct keys `k != l`이 distinct residues `r != s`로 간다.
- `p`가 prime이고 `a`와 `k-l`이 nonzero modulo `p`라서 이 단계에서 충돌이 생기지 않는다.
- 마지막 `mod m`에서만 collision이 생길 수 있는데, 그 확률이 at most `1/m`으로 bound된다.

이 family의 좋은 점은 output range `m`이 prime일 필요가 없다는 점이다. 이 성질은 Section 11.5의 perfect hashing에서 다시 사용된다.

#### 11.3 Exercises가 묻는 구현 감각

- Long string key를 비교할 때 미리 저장한 `h(k)`가 다르면 실제 string compare를 생략할 수 있다.
- 긴 string을 radix-128 integer로 보더라도 전체 huge integer를 만들 필요 없이 modular accumulation으로 `k mod m`을 계산할 수 있다.
- Division method에서 `m = 2^p - 1`은 character permutation에 취약할 수 있다.
- `ε-universal`은 collision probability bound를 `ε`로 일반화한 개념이다.

### 11.4 Open addressing

#### Chaining과 다른 점

`open addressing`에서는 모든 elements가 hash table 자체의 slots에 저장된다. 각 slot은 element 하나 또는 `NIL`을 가진다. Chaining처럼 table 밖에 linked list nodes를 두지 않는다.

이 때문에 open addressing에서는 table이 꽉 찰 수 있다. 따라서 load factor는 항상

```text
α = n/m <= 1
```

이다. Chaining에서는 한 slot에 여러 elements가 linked list로 붙을 수 있어 `α > 1`도 가능했지만, open addressing에서는 slot 하나가 element 하나만 담는다.

장점은 pointers가 필요 없다는 점이다. 같은 memory budget에서 pointers를 저장하지 않아도 되므로 더 많은 slots를 둘 수 있고, pointer chasing 대신 probe sequence를 계산해 접근한다.

#### Probe sequence

Open addressing에서는 collision이 나면 다음 slot을 체계적으로 검사한다. 이때 hash function은 key뿐 아니라 probe number `i`도 입력으로 받는다.

```text
h : U × {0, 1, ..., m-1} -> {0, 1, ..., m-1}
```

Key `k`의 probe sequence는

```text
<h(k,0), h(k,1), ..., h(k,m-1)>
```

이다. 모든 slot을 언젠가 검사할 수 있어야 하므로, 각 key에 대해 이 sequence는 `{0,1,...,m-1}`의 permutation이어야 한다.

#### HASH-INSERT and HASH-SEARCH

```text
HASH-INSERT(T, k)
1  i = 0
2  repeat
3      j = h(k, i)
4      if T[j] == NIL
5          T[j] = k
6          return j
7      else i = i + 1
8  until i == m
9  error "hash table overflow"
```

Search는 insertion 때와 같은 probe sequence를 따라간다.

```text
HASH-SEARCH(T, k)
1  i = 0
2  repeat
3      j = h(k, i)
4      if T[j] == k
5          return j
6      i = i + 1
7  until T[j] == NIL or i == m
8  return NIL
```

`HASH-SEARCH`가 `NIL`을 만나면 unsuccessful search로 종료할 수 있다. 왜냐하면 key `k`가 있었다면 insertion 당시 같은 probe sequence를 따라오다가 그 `NIL` slot에 들어갔어야 하기 때문이다. 이 논리는 deletion이 없다는 가정에 의존한다.

#### Deletion이 어려운 이유

Open addressing에서 slot `i`의 key를 삭제할 때 단순히 `T[i] = NIL`로 만들면 안 된다. 어떤 key `k`가 insertion 당시 slot `i`를 지나쳐 나중 slot에 들어갔을 수 있다. `i`를 `NIL`로 바꾸면 search가 거기서 멈춰 버려 뒤쪽의 key를 찾지 못한다.

해결책은 `DELETED`라는 special marker를 쓰는 것이다.

```text
NIL     : probe sequence가 여기서 끝나도 됨
DELETED : 예전에는 occupied였으므로 search는 계속해야 함
```

Insertion은 `DELETED` slot을 empty처럼 재사용할 수 있고, search는 `DELETED`를 지나쳐야 한다. 하지만 `DELETED` markers가 쌓이면 search time이 단순히 current load factor `α`만으로 설명되지 않는다. 그래서 deletion이 많은 dictionary에서는 chaining이 더 자주 선택된다.

#### Uniform hashing for open addressing

Open addressing 분석에서는 `uniform hashing`을 가정한다. 이는 각 key의 probe sequence가 `{0,1,...,m-1}`의 `m!` permutations 중 하나로 equally likely하게 선택된다는 이상화된 가정이다.

실제 구현에서 완전한 uniform hashing은 어렵다. CLRS는 다음 세 방법을 소개한다.

| 방법 | probe sequence | clustering |
| --- | --- | --- |
| linear probing | `h(k,i) = (h0(k) + i) mod m` | primary clustering |
| quadratic probing | `h(k,i) = (h0(k) + c1 i + c2 i^2) mod m` | secondary clustering |
| double hashing | `h(k,i) = (h1(k) + i h2(k)) mod m` | 가장 random-like |

#### Linear probing

`linear probing`은 auxiliary hash function `h0`에서 시작해 다음 slot, 그 다음 slot을 차례로 본다.

```text
h(k,i) = (h0(k) + i) mod m
```

구현은 매우 쉽지만 `primary clustering`이 생긴다. 연속된 occupied slots의 run이 길어지면, 그 run 바로 뒤 empty slot은 더 높은 확률로 채워진다. 긴 cluster가 더 길어지는 자기강화가 생겨 average search time이 증가한다.

#### Quadratic probing

`quadratic probing`은 offset을 probe number의 quadratic function으로 만든다.

```text
h(k,i) = (h0(k) + c1 i + c2 i^2) mod m
```

Linear probing보다 primary clustering은 줄지만, 같은 initial probe `h0(k)`를 가진 keys는 같은 probe sequence를 가진다. 이 현상을 `secondary clustering`이라고 한다. 또한 table 전체를 잘 사용하려면 `c1`, `c2`, `m` 선택에 제약이 있다.

#### Double hashing

`double hashing`은 두 auxiliary hash functions를 쓴다.

```text
h(k,i) = (h1(k) + i h2(k)) mod m
```

Initial position은 `h1(k)`이고, step size는 `h2(k)`다. Key마다 시작점과 offset이 달라질 수 있어 linear/quadratic probing보다 훨씬 많은 probe sequences를 만든다.

![Figure 11.5](@/assets/images/047_figure_11-5_page_294.png)
*Figure 11.5 · PDF p. 294 · double hashing에서 key 14가 slots 1, 5를 거쳐 9에 삽입되는 probe sequence*

Double hashing이 table 전체를 검사하려면 `h2(k)`가 table size `m`과 relatively prime이어야 한다. 대표적 선택은 다음과 같다.

```text
m is prime
h1(k) = k mod m
h2(k) = 1 + (k mod m')
```

여기서 `m'`은 `m`보다 조금 작은 값으로 고른다. `h2(k)`가 0이 되지 않도록 `1 +`를 붙이는 점도 중요하다.

#### Open addressing의 expected probes

Open addressing의 분석은 load factor `α = n/m < 1`에 의존한다. Uniform hashing을 가정하면 unsuccessful search에서 expected probes는

```text
at most 1 / (1 - α)
```

이다. 직관적으로 첫 probe는 항상 하고, 첫 slot이 occupied일 확률이 대략 `α`, 첫 두 slots가 occupied일 확률이 대략 `α^2`이므로

```text
1 + α + α^2 + α^3 + ... = 1 / (1 - α)
```

로 묶인다.

이 결과는 insertion에도 바로 적용된다. Insertion은 empty slot을 찾는 unsuccessful search 뒤 그 slot에 key를 쓰는 것이므로, expected probes가 at most `1/(1-α)`이다.

Successful search의 expected probes는 더 작게 나온다. 각 stored key가 equally likely하게 검색된다고 하면 Theorem 11.8은 expected probes가 at most

```text
(1/α) ln(1/(1-α))
```

임을 보인다.

숫자로 보면 open addressing이 왜 load factor에 민감한지 보인다.

| load factor `α` | unsuccessful search bound | successful search bound |
| --- | --- | --- |
| `0.5` | `1/(1-0.5) = 2` | `< 1.387` |
| `0.9` | `1/(1-0.9) = 10` | `< 2.559` |

`α`가 1에 가까워질수록 unsuccessful search와 insertion 비용이 빠르게 커진다. Open addressing은 pointer overhead가 없고 cache locality가 좋을 수 있지만, table이 많이 차면 probe cost가 급격히 나빠진다.

#### 11.4 Exercises가 묻는 구현 감각

- Given hash functions로 실제 probe sequence를 따라가며 table 상태를 추적해야 한다.
- Deletion을 지원하려면 `DELETED` marker를 어떻게 search/insert가 해석하는지 구분해야 한다.
- Double hashing에서 `h2(k)`와 `m`이 relatively prime이어야 모든 slots를 방문할 수 있다.
- Uniform hashing의 probe bound는 idealization이고, 실제 probing schemes는 clustering 특성 때문에 다르게 동작할 수 있다.

### 11.5 Perfect hashing

#### Static set에서는 worst-case O(1)도 가능하다

일반 hashing은 average-case 성능이 뛰어나지만 worst case는 좋지 않을 수 있다. `perfect hashing`은 key set이 static일 때, 즉 keys를 한 번 저장한 뒤 set이 바뀌지 않을 때 worst-case `O(1)` search를 보장하는 hashing scheme이다.

Static set의 예시는 다음과 같다.

- programming language의 reserved words
- CD-ROM 같은 read-only medium의 file names
- 변경되지 않는 keyword dictionary

Perfect hashing의 목표는 다음이다.

```text
Search requires O(1) memory accesses in the worst case.
```

#### Two-level hashing 구조

Perfect hashing은 universal hashing을 두 level에서 사용한다.

1. First level: `n`개 keys를 primary table `T`의 `m = n` slots로 hash한다.
2. Second level: slot `j`로 모인 `n_j`개 keys를 secondary table `S_j`에 다시 hash한다.
3. 각 secondary table에서는 collision이 없도록 hash function `h_j`를 고른다.

![Figure 11.6](@/assets/images/048_figure_11-6_page_299.png)
*Figure 11.6 · PDF p. 299 · first-level table `T`와 slot별 secondary table `S_j`를 사용하는 perfect hashing*

Figure 11.6에서 outer hash function은 key를 primary slot으로 보내고, 각 slot `j`는 자기만의 secondary table `S_j`와 secondary hash function `h_j`를 가진다. Searching은 두 번의 hash와 두 번의 table access로 끝난다.

```text
j = h(k)
position = h_j(k)
check S_j[position]
```

Secondary table에서 collision이 없으므로 search는 worst-case `O(1)`이다.

#### 왜 secondary size가 n_j^2인가

Slot `j`에 `n_j`개 keys가 모였다고 하자. Secondary table size를

```text
m_j = n_j^2
```

로 잡고 universal hash function을 random하게 고르면, collision이 하나도 없을 확률이 충분히 높다.

Theorem 11.9는 다음 사실을 말한다.

```text
n keys를 m = n^2 slots에 universal hashing으로 저장하면
collision이 하나라도 있을 확률은 < 1/2
```

증명 아이디어는 collision pair 수의 expectation이다.

```text
가능한 key pairs 수: C(n,2)
각 pair collision probability: <= 1/m = 1/n^2
E[number of collisions] < 1/2
```

Markov's inequality로 collision이 하나 이상 있을 확률도 `< 1/2`로 bound된다. 따라서 random secondary hash function을 몇 번 골라 보면 collision-free function을 빠르게 찾을 가능성이 높다.

#### 전체 공간이 왜 O(n)인가

Secondary table마다 `m_j = n_j^2`를 쓰면 특정 bucket이 크면 공간이 커질 수 있다. 하지만 first-level hash function을 universal family에서 잘 고르면 expected total secondary size가 linear로 유지된다.

Theorem 11.10은 first-level table size `m = n`일 때

```text
E[Σ_{j=0}^{m-1} n_j^2] < 2n
```

임을 보인다. 핵심 identity는

```text
a^2 = a + 2 C(a,2)
```

이다. `Σ C(n_j,2)`는 같은 primary slot에 들어간 key pairs, 즉 first-level collisions 수와 같다. Universal hashing에서는 각 pair가 collide할 확률이 at most `1/m = 1/n`이므로 expected collision pairs가 linear로 묶인다.

따라서 Corollary 11.11은

```text
E[Σ m_j] = E[Σ n_j^2] < 2n
```

이라고 말한다. Primary table 자체, secondary table sizes `m_j`, 그리고 hash function parameters `a_j`, `b_j`까지 포함해도 전체 expected storage는 `O(n)`이다.

Corollary 11.12는 Markov's inequality를 한 번 더 써서

```text
Pr[Σ m_j >= 4n] < 1/2
```

임을 보인다. 따라서 first-level hash function도 몇 번 random trial하면 합리적인 storage를 쓰는 것을 쉽게 찾을 수 있다.

#### Perfect hashing의 구축과 search

Perfect hashing은 search가 빠른 대신 construction time에 random trials를 허용한다.

```text
Build:
1  choose first-level h from universal family
2  distribute keys into primary slots
3  if Σ n_j^2 is too large, retry h
4  for each slot j:
       allocate S_j of size n_j^2
       choose h_j until no secondary collision occurs

Search(k):
1  j = h(k)
2  look in S_j[h_j(k)]
```

Static set이므로 insertion/deletion을 search 이후에 처리할 필요가 없다. 이 제한 덕분에 collision-free secondary tables를 유지할 수 있다.

#### Problems and chapter notes

Chapter 11의 problems는 hash table 분석의 tail bounds와 universal hashing의 보안적 응용으로 이어진다.

| 문제 | 핵심 주제 | 연결 |
| --- | --- | --- |
| 11-1 Longest-probe bound | open addressing에서 longest probe sequence가 `O(lg n)` expectation임을 보임 | Theorem 11.6, geometric tail |
| 11-2 Slot-size bound for chaining | 최대 chain length `M`의 expectation이 `O(lg n / lg lg n)`임을 보임 | balls-into-bins analysis |
| 11-3 Quadratic probing | 특정 probing recurrence가 table 전체를 검사함을 증명 | quadratic probing |
| 11-4 Hashing and authentication | `2-universal` hashing을 message authentication tag에 사용 | universal hashing, authentication |

`11-4 Hashing and authentication`은 universal hashing이 단순 dictionary 구현을 넘어 authentication에도 쓰일 수 있음을 보여 준다. Alice와 Bob이 secret hash function `h`를 공유하고 tag `t = h(m)`를 보내면, adversary가 다른 message/tag pair를 성공적으로 위조할 확률을 `1/p` 이하로 제한할 수 있다. 여기서 핵심은 adversary의 computing power가 아니라 hash family의 pairwise randomness다.

Chapter notes는 다음 역사적 연결을 짧게 남긴다.

- Hash tables와 chaining은 H. P. Luhn의 작업으로 연결된다.
- Open addressing은 G. M. Amdahl의 idea와 연결된다.
- Universal hashing은 Carter and Wegman의 1979년 개념이다.
- Perfect hashing scheme은 Fredman, Komlós, Szemerédi의 static set hashing 결과와 연결된다.

## 복잡도

| 구조/연산 | 시간/공간 | 조건 |
| --- | --- | --- |
| Direct-address search/insert/delete | `O(1)` worst case | universe `U`가 작아 `|U|` table 가능 |
| Direct-address space | `Θ(|U|)` | actual keys가 적으면 낭비 큼 |
| Chained hash insert | `O(1)` worst case | 중복 확인 생략, head insertion |
| Chained hash delete | `O(1)` worst case | element pointer가 주어지고 chain이 doubly linked |
| Chained hash unsuccessful search | `Θ(1+α)` average | simple uniform hashing |
| Chained hash successful search | `Θ(1+α)` average | simple uniform hashing |
| Universal hashing with chaining | expected `O(1)` per operation if `α=O(1)` | random hash function choice |
| Open addressing unsuccessful search | at most `1/(1-α)` expected probes | uniform hashing, `α<1` |
| Open addressing insert | at most `1/(1-α)` expected probes | unsuccessful search 후 insert |
| Open addressing successful search | at most `(1/α) ln(1/(1-α))` expected probes | uniform hashing |
| Perfect hashing search | `O(1)` worst case | static key set |
| Perfect hashing storage | expected `O(n)` | 2-level universal hashing |

## 연결 관계

- Chapter 10의 linked lists는 chaining에서 각 hash slot의 collision list로 쓰인다.
- Chapter 10의 free list idea는 hash table slots 내부에서 element storage를 관리할 때 다시 등장한다.
- Chapter 5의 indicator random variables, expectation, Markov's inequality가 hashing analysis에 반복적으로 쓰인다.
- Chapter 7의 randomized quicksort처럼 universal hashing도 randomization으로 fixed bad input을 피한다.
- Chapter 31의 modular arithmetic, prime modulus, multiplicative inverse가 universal hash family `H_pm` 증명에 필요하다.
- Chapter 12의 binary search trees도 dictionary operations를 지원하지만, hashing과 달리 ordered operations도 자연스럽게 지원한다.

## 오해하기 쉬운 내용

- Hash table이 항상 worst-case `O(1)` search를 보장하는 것은 아니다. 일반 chaining/open addressing은 worst case가 나쁠 수 있다.
- Direct addressing의 `O(1)`은 worst-case지만, 공간이 `Θ(|U|)`이다.
- Collision은 나쁜 hash function에서만 생기는 예외가 아니다. `|U| > m`이면 반드시 가능한 현상이다.
- Chaining에서 delete가 `O(1)`인 것은 삭제할 element pointer가 있고 chain이 doubly linked일 때다.
- `simple uniform hashing`은 실제 hash function이 자동으로 만족하는 성질이 아니라 분석 가정이다.
- Universal hashing의 randomness는 keys가 random하다는 뜻이 아니다. Hash function 선택이 random하다는 뜻이다.
- Open addressing에서 `NIL`과 `DELETED`는 search semantics가 다르다.
- Linear probing은 구현은 쉽지만 primary clustering이 생긴다.
- Double hashing에서 `h2(k)`가 `m`과 relatively prime이 아니면 probe sequence가 table 전체를 방문하지 못할 수 있다.
- Perfect hashing은 static set에 대한 방법이다. Dynamic insertion/deletion을 그대로 허용하는 구조가 아니다.

## 면접 질문

1. Direct-address table과 hash table의 차이는 무엇인가?
2. Hash table에서 collision이 왜 불가피한가?
3. Chaining에서 load factor `α = n/m`은 무엇을 의미하는가?
4. Chaining의 unsuccessful search와 successful search가 왜 평균 `Θ(1+α)`인가?
5. Division method에서 `m`을 power of 2로 잡는 것이 왜 위험할 수 있는가?
6. Multiplication method에서 `h(k) = floor(m(kA mod 1))`의 의미를 설명하라.
7. Universal hashing은 adversarial key set에 어떻게 대응하는가?
8. Open addressing에서 deletion 시 `NIL` 대신 `DELETED` marker가 필요한 이유는 무엇인가?
9. Linear probing의 primary clustering과 quadratic probing의 secondary clustering은 어떻게 다른가?
10. Perfect hashing에서 secondary table size를 `m_j = n_j^2`로 잡는 이유와 전체 공간이 expected `O(n)`인 이유를 설명하라.
