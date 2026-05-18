---
title: "Chapter 10. Elementary Data Structures"
order: 10
pubDatetime: 2026-05-17T00:00:00+09:00
modDatetime: 2026-05-17T00:00:00+09:00
description: "CLRS 알고리즘 정리: Chapter 10. Elementary Data Structures"
tags:
  - "Algorithm"
  - "CS"
  - "CLRS"
---

## 개요

Chapter 10은 `dynamic sets`를 표현하는 기본 자료구조를 다룬다. 이 장의 초점은 복잡한 균형 트리나 해시 테이블이 아니라, 포인터(pointer)와 배열(array)만으로 만들 수 있는 가장 기초적인 구조들이다.

다루는 자료구조는 네 흐름이다.

- `stacks`와 `queues`: 삭제될 원소가 규칙으로 미리 정해지는 dynamic sets
- `linked lists`: 각 원소가 다음/이전 원소를 가리키는 pointer 기반 sequence
- `pointers and objects` 구현: 언어에 pointer/object가 없어도 arrays로 흉내 내는 방식
- `rooted trees`: parent/child/sibling 관계를 pointer로 표현하는 방식

핵심 관점은 “자료구조가 어떤 abstract operation을 빠르게 지원하도록 내부 표현을 선택하는가”다. 같은 dynamic set이라도 $PUSH/POP$, $ENQUEUE/DEQUEUE$, `LIST-SEARCH`, `ALLOCATE-OBJECT`, tree traversal처럼 필요한 연산이 다르면 표현이 달라진다.

## 핵심 개념

| 용어 | 의미 | 검색 키워드 |
| --- | --- | --- |
| dynamic set | 원소가 삽입/삭제되며 변하는 집합 | dynamic set |
| stack | 가장 최근에 삽입된 원소를 먼저 삭제하는 구조 | LIFO, PUSH, POP |
| queue | 가장 오래 전에 삽입된 원소를 먼저 삭제하는 구조 | FIFO, ENQUEUE, DEQUEUE |
| underflow | 빈 자료구조에서 삭제 연산을 시도하는 오류 | stack underflow, queue underflow |
| overflow | 고정 크기 배열 구현에서 용량 초과 삽입을 시도하는 오류 | stack overflow, queue overflow |
| linked list | 각 object가 pointer로 이웃 object를 연결하는 구조 | next, prev, head |
| sentinel | 경계 조건을 줄이기 위해 넣는 dummy object | nil, sentinel |
| free list | 사용 가능한 object slots를 linked list처럼 관리하는 구조 | ALLOCATE-OBJECT, FREE-OBJECT |
| left-child, right-sibling | arbitrary rooted tree를 binary-style pointers로 표현하는 방식 | left-child, right-sibling |

## 세부 정리

### 10.1 Stacks and queues

#### Stack: LIFO dynamic set

`stack`은 `DELETE` 연산으로 제거되는 원소가 “가장 최근에 삽입된 원소”로 정해진 dynamic set이다. 이 정책을 `last-in, first-out`, 즉 `LIFO`라고 한다. Stack의 insert operation은 `PUSH`, delete operation은 `POP`이라고 부른다.

물리적인 접시 더미를 생각하면 된다. 맨 위에 접시를 올리고(`PUSH`), 뺄 때도 맨 위 접시부터 뺀다(`POP`). 아래쪽 원소는 위 원소들을 제거하기 전까지 직접 접근할 수 없다.

#### Array로 stack 구현

최대 `n`개 원소를 담는 stack은 array $S[1..n]$과 attribute `S.top`으로 구현할 수 있다. `S.top`은 가장 최근에 삽입된 원소, 즉 top element의 index를 가리킨다.

$$
\begin{aligned}
\text{S[1]          : bottom of stack} \\
\text{S[S.top]      : top of stack} \\
\text{S[1..S.top]   : 현재 stack에 들어 있는 elements} \\
S.top &= 0 : empty stack
\end{aligned}
$$

![Figure 10.1](@/assets/images/cs-algorithm-033-figure-10-1-page-254.png)
*Figure 10.1 · PDF p. 254 · array `S`와 `S.top`으로 구현한 stack의 PUSH/POP 변화*

Figure 10.1에서 $POP(S)$ 후에도 값 `3`은 array 위치에 남아 있다. 하지만 `S.top`이 줄어들었기 때문에 그 위치는 더 이상 stack의 일부가 아니다. 자료구조의 논리적 내용은 memory에 남은 bit pattern이 아니라 representation invariant로 결정된다.

#### Stack operations

```text
STACK-EMPTY(S)
1  if S.top == 0
2      return TRUE
3  else return FALSE

PUSH(S, x)
1  S.top = S.top + 1
2  S[S.top] = x

POP(S)
1  if STACK-EMPTY(S)
2      error "underflow"
3  else S.top = S.top - 1
4      return S[S.top + 1]
```

각 연산은 $O(1)$ time이다. `POP`은 empty stack에서 호출되면 `underflow` 오류를 낸다. 고정 크기 array 구현에서는 `S.top > n`이 되는 `overflow`도 가능하지만, 본문 pseudocode에서는 stack overflow check를 생략한다.

#### Queue: FIFO dynamic set

`queue`는 `DELETE` 연산으로 제거되는 원소가 “가장 오래 전에 삽입된 원소”로 정해진 dynamic set이다. 이 정책은 `first-in, first-out`, 즉 `FIFO`다.

Queue의 insert operation은 `ENQUEUE`, delete operation은 `DEQUEUE`다. 줄 서 있는 고객을 생각하면 된다. 새 고객은 줄의 끝(`tail`)에 서고, 계산을 마치고 나가는 사람은 줄의 앞(`head`)에 있는 사람이다.

#### Circular array로 queue 구현

CLRS는 최대 $n-1$개 원소를 담는 queue를 array $Q[1..n]$으로 구현한다. 여기서 `Q.head`는 삭제될 원소의 위치를 가리키고, `Q.tail`은 다음 삽입 위치를 가리킨다.

```text
Q.head : current head element
Q.tail : next insertion position
```

Queue elements는 circular order에서 `Q.head`부터 `Q.tail - 1`까지 놓인다. `Q.tail`이 array 끝 `Q.length`를 넘으면 다시 `1`로 돌아간다. 이 wrap-around 덕분에 앞쪽에서 `DEQUEUE`된 빈 공간을 뒤쪽 삽입에 재사용할 수 있다.

![Figure 10.2](@/assets/images/cs-algorithm-034-figure-10-2-page-255.png)
*Figure 10.2 · PDF p. 255 · circular array `Q`에서 `Q.head`와 `Q.tail`이 이동하는 queue 구현*

Figure 10.2에서 `Q.tail`은 마지막 원소가 아니라 “다음에 새 원소가 들어갈 위치”다. 이 점을 헷갈리면 empty/full 조건을 잘못 이해하기 쉽다.

#### Queue operations

```text
ENQUEUE(Q, x)
1  Q[Q.tail] = x
2  if Q.tail == Q.length
3      Q.tail = 1
4  else Q.tail = Q.tail + 1

DEQUEUE(Q)
1  x = Q[Q.head]
2  if Q.head == Q.length
3      Q.head = 1
4  else Q.head = Q.head + 1
5  return x
```

각 연산은 $O(1)$ time이다. Pseudocode는 underflow/overflow check를 생략하지만, 원문은 조건을 명확히 설명한다.

$$
\begin{aligned}
\text{empty:} Q.head &== Q.tail \\
\text{full :} Q.head &== Q.tail + 1 \\
       or (Q.head &== 1 and Q.tail == Q.length)
\end{aligned}
$$

이 구현이 최대 `n`개가 아니라 $n-1$개만 저장하는 이유는 empty와 full을 구분하기 위해 한 칸을 비워 두기 때문이다. `Q.head == Q.tail`을 empty로 쓰면, 모든 칸이 꽉 찬 상태도 head와 tail이 다시 같아질 수 있다. 그래서 한 칸을 희생해 상태 표현을 단순하게 만든다.

#### 10.1 Exercises가 묻는 구현 감각

Section 10.1의 exercises는 단순 연산 추적뿐 아니라 구현 invariant를 묻는다.

- 두 개의 stacks를 하나의 array 양끝에서 가운데로 자라게 하면, 두 stack의 총 원소 수가 `n`이 되기 전까지 overflow가 나지 않는다.
- Circular queue의 underflow/overflow check는 `Q.head`, `Q.tail`, `Q.length`의 관계로 판단한다.
- Queue는 두 개의 stacks로, stack은 두 개의 queues로 구현할 수 있다. 이 문제들은 abstract behavior와 concrete representation을 분리해 생각하게 만든다.

### 10.2 Linked lists

#### Linked list의 기본 아이디어

`linked list`는 object들이 linear order로 배열된 자료구조다. Array에서는 순서가 index `1,2,3,...`으로 결정되지만, linked list에서는 각 object 안의 pointer가 다음 object를 지정함으로써 순서가 결정된다.

CLRS가 이 절에서 기본으로 가정하는 list는 `unsorted doubly linked list`다. 각 element `x`는 다음 attribute를 가진다.

```text
x.key   : 저장된 key
x.next  : successor를 가리키는 pointer
x.prev  : predecessor를 가리키는 pointer
```

List object `L`은 `L.head`를 통해 첫 element를 가리킨다. $L.head = NIL$이면 empty list다.

![Figure 10.3](@/assets/images/cs-algorithm-035-figure-10-3-page-258.png)
*Figure 10.3 · PDF p. 258 · doubly linked list에서 `next`/`prev` pointer로 search, insert, delete를 수행하는 구조*

Figure 10.3(a)에서 dynamic set `{1,4,9,16}`이 list 순서 `9 -> 16 -> 4 -> 1`로 표현되어 있다. Set의 원소와 list의 물리적 순서는 다를 수 있다. Unsorted linked list에서는 key 순서가 아니라 pointer 연결 순서가 traversal 순서다.

#### 여러 형태의 linked list

Linked list는 몇 가지 축으로 변형된다.

| 형태 | 설명 | trade-off |
| --- | --- | --- |
| singly linked list | `next` pointer만 둔다 | 공간은 적지만 predecessor 접근이 어렵다 |
| doubly linked list | `next`, `prev`를 모두 둔다 | deletion/splicing이 쉬우나 pointer 저장 공간이 늘어난다 |
| sorted list | key order와 list order가 일치한다 | search/insert 정책이 달라진다 |
| unsorted list | 원소가 임의 순서로 놓인다 | insert가 단순하고 빠르다 |
| circular list | tail의 `next`가 head, head의 `prev`가 tail을 가리킨다 | 끝 경계 처리를 줄일 수 있다 |

#### LIST-SEARCH

`LIST-SEARCH(L, k)`는 list를 head부터 따라가며 key가 `k`인 첫 object를 찾는다.

```text
LIST-SEARCH(L, k)
1  x = L.head
2  while x != NIL and x.key != k
3      x = x.next
4  return x
```

찾으면 해당 object에 대한 pointer를 반환하고, 없으면 `NIL`을 반환한다. Worst case에서는 전체 `n`개 object를 모두 볼 수 있으므로 running time은 $\Theta(n)$이다.

#### LIST-INSERT

`LIST-INSERT(L, x)`는 이미 key가 설정된 element `x`를 list의 front에 splice한다.

```text
LIST-INSERT(L, x)
1  x.next = L.head
2  if L.head != NIL
3      L.head.prev = x
4  L.head = x
5  x.prev = NIL
```

이 연산은 기존 원소 수와 관계없이 pointer 몇 개만 바꾸므로 $O(1)$이다. Unsorted list에서 head insertion을 쓰는 이유는 key 순서를 맞출 필요가 없기 때문이다.

#### LIST-DELETE

`LIST-DELETE(L, x)`는 list에서 element `x`를 제거한다. 중요한 조건은 key가 아니라 pointer `x`가 이미 주어져야 한다는 점이다.

```text
LIST-DELETE(L, x)
1  if x.prev != NIL
2      x.prev.next = x.next
3  else L.head = x.next
4  if x.next != NIL
5      x.next.prev = x.prev
```

Pointer `x`가 이미 있으면 deletion 자체는 $O(1)$이다. 하지만 “key가 `k`인 원소를 삭제하라”처럼 key만 주어지면 먼저 `LIST-SEARCH`로 pointer를 찾아야 하므로 worst case $\Theta(n)$이 필요하다.

이 차이는 linked list에서 자주 나오는 함정이다.

| 작업 | 시간 | 이유 |
| --- | --- | --- |
| 주어진 pointer `x` 삭제 | $O(1)$ | 주변 pointer만 갱신 |
| key `k`를 가진 원소 삭제 | $\Theta(n)$ worst case | 먼저 search 필요 |

#### Sentinel: boundary condition 줄이기

`LIST-DELETE`에는 head/tail 경계 조건 때문에 `if x.prev != NIL`, `if x.next != NIL` 같은 분기가 들어간다. `sentinel`은 이런 boundary condition을 줄이기 위한 dummy object다.

CLRS는 list `L`에 sentinel object `L.nil`을 둔다. `NIL` 대신 `L.nil`을 사용하고, list를 circular doubly linked list로 만든다.

$$
\begin{aligned}
\text{L.nil.next : head} \\
\text{L.nil.prev : tail} \\
\text{empty list:} L.nil.next &== L.nil and L.nil.prev == L.nil
\end{aligned}
$$

![Figure 10.4](@/assets/images/cs-algorithm-036-figure-10-4-page-260.png)
*Figure 10.4 · PDF p. 260 · sentinel `L.nil`을 둔 circular doubly linked list의 empty/insert/delete 상태*

Sentinel을 쓰면 `L.head` attribute도 필요 없다. Head는 `L.nil.next`로 접근하고, tail은 `L.nil.prev`로 접근한다.

#### Sentinel version operations

Search는 `NIL` 대신 `L.nil`을 만날 때 멈춘다.

```text
LIST-SEARCH'(L, k)
1  x = L.nil.next
2  while x != L.nil and x.key != k
3      x = x.next
4  return x
```

Deletion은 경계 조건 없이 두 줄로 끝난다.

```text
LIST-DELETE'(L, x)
1  x.prev.next = x.next
2  x.next.prev = x.prev
```

Insertion도 sentinel을 기준으로 head 앞에 splice하면 된다.

```text
LIST-INSERT'(L, x)
1  x.next = L.nil.next
2  L.nil.next.prev = x
3  L.nil.next = x
4  x.prev = L.nil
```

Sentinel은 asymptotic running time을 거의 바꾸지 않는다. `LIST-INSERT`와 `LIST-DELETE`는 원래도 $O(1)$이고 sentinel version도 $O(1)$이다. 다만 boundary case가 줄어 코드가 단순해지고, loop 내부 test 수를 줄일 수 있어 constant factor와 clarity가 좋아질 수 있다.

그러나 sentinel은 dummy object 하나를 추가로 저장한다. 작은 list가 아주 많으면 sentinel의 extra storage가 낭비가 될 수 있다. 따라서 CLRS는 sentinel을 “코드를 정말 단순하게 만들 때” 신중하게 사용하라고 강조한다.

#### 10.2 Exercises가 묻는 구현 감각

- Singly linked list에서 `INSERT`는 head insertion으로 $O(1)$에 가능하지만, 일반적인 `DELETE`는 predecessor를 알아야 하므로 까다롭다.
- Stack은 singly linked list의 head를 top으로 보면 `PUSH`/`POP` 모두 $O(1)$에 구현할 수 있다.
- Queue를 singly linked list로 구현하려면 head뿐 아니라 tail pointer도 유지해야 `ENQUEUE`와 `DEQUEUE`를 둘 다 $O(1)$로 만들 수 있다.
- Sentinel search에서 $L.nil.key = k$처럼 sentinel에 찾는 key를 잠깐 넣으면 loop마다 `x != L.nil` test를 줄이는 trick이 가능하다.

### 10.3 Implementing pointers and objects

#### pointer와 object가 없는 언어에서의 표현

CLRS는 “언어가 pointer와 object를 직접 제공하지 않으면 어떻게 linked data structures를 구현할 수 있는가?”를 묻는다. 답은 arrays와 array indices로 object와 pointer를 합성하는 것이다.

기본 생각은 단순하다.

- object의 attribute는 array entry로 저장한다.
- pointer는 실제 memory address가 아니라 array index로 표현한다.
- `NIL`은 실제 index가 될 수 없는 값, 예를 들어 `0` 같은 특별한 integer로 표현한다.

이 절은 두 가지 object representation을 설명한다.

| 표현 | 핵심 | 적합한 경우 |
| --- | --- | --- |
| multiple-array representation | attribute마다 별도 array를 둔다 | homogeneous objects, CLRS의 기본 사용 |
| single-array representation | 하나의 array 안에 object fields를 contiguous block으로 둔다 | memory layout/address offset 설명에 적합 |

#### Multiple-array representation

동일한 attribute를 가진 objects가 많다면 attribute별 array를 만들 수 있다. Doubly linked list object가 `key`, `next`, `prev`를 가진다면 세 arrays를 둔다.

```text
key[i]   : object i의 key
next[i]  : object i의 successor index
prev[i]  : object i의 predecessor index
```

이때 pointer `i`는 $key[i]$, $next[i]$, $prev[i]$를 함께 가리키는 common index다. List head를 나타내는 variable `L`도 object index를 저장한다.

![Figure 10.5](@/assets/images/cs-algorithm-037-figure-10-5-page-263.png)
*Figure 10.5 · PDF p. 263 · `key`, `next`, `prev` arrays의 같은 index를 하나의 linked-list object로 해석하는 multiple-array representation*

Figure 10.5에서 key `16`이 index `5`에 있고 key `4`가 index `2`에 있다면, list에서 `16 -> 4` 관계는

$$
\begin{aligned}
next[5] &= 2 \\
prev[2] &= 5
\end{aligned}
$$

로 저장된다. 즉 pointer field에는 object의 위치가 아니라 “그 object를 나타내는 index”가 들어간다.

#### Single-array representation

실제 컴퓨터 memory는 integer address로 접근되는 연속된 words로 볼 수 있다. 어떤 object가 contiguous memory block을 차지한다면, pointer는 object의 첫 word address이고 attribute 접근은 offset을 더하는 방식이다.

Single-array representation은 이 생각을 하나의 array `A`로 흉내 낸다. 예를 들어 object 하나가 `key`, `next`, `prev` 세 attribute를 가지면 length 3짜리 contiguous block을 object 하나로 본다.

$$
\begin{aligned}
\text{object pointer i} \\
\text{A[i + 0] :} key \\
\text{A[i + 1] :} next \\
\text{A[i + 2] :} prev
\end{aligned}
$$

![Figure 10.6](@/assets/images/cs-algorithm-038-figure-10-6-page-264.png)
*Figure 10.6 · PDF p. 264 · 하나의 array `A`에서 offset 0/1/2를 `key`/`next`/`prev`로 해석하는 single-array representation*

Single-array representation은 서로 길이가 다른 objects를 같은 array에 저장할 수 있다는 점에서 더 flexible하다. 하지만 heterogeneous objects의 storage management는 복잡하다. CLRS에서 다루는 대부분의 자료구조는 homogeneous elements로 구성되므로, 이후 설명에는 multiple-array representation이면 충분하다.

#### Allocating and freeing objects

Array로 object storage를 구현하면, 새 원소를 삽입할 때 “사용 중이 아닌 slot”을 찾아야 한다. 반대로 삭제된 object slot은 나중에 다시 쓸 수 있도록 반환해야 한다.

CLRS는 unused objects를 `free list`라는 singly linked list로 관리한다. Multiple-array representation에서 free list는 `next` array만 사용한다. Global variable `free`가 free list의 head index를 저장한다.

중요한 invariant는 다음과 같다.

```text
각 object slot은 정확히 둘 중 하나에 속한다.
1. dynamic set을 나타내는 linked list L
2. unused slots를 나타내는 free list
```

![Figure 10.7](@/assets/images/cs-algorithm-039-figure-10-7-page-265.png)
*Figure 10.7 · PDF p. 265 · `ALLOCATE-OBJECT`와 `FREE-OBJECT`가 free list head를 갱신하는 과정*

Figure 10.7에서 free list는 stack처럼 동작한다. 가장 최근에 free된 object가 다음 allocation에서 먼저 재사용된다.

#### ALLOCATE-OBJECT and FREE-OBJECT

```text
ALLOCATE-OBJECT()
1  if free == NIL
2      error "out of space"
3  else x = free
4      free = x.next
5      return x

FREE-OBJECT(x)
1  x.next = free
2  free = x
```

`ALLOCATE-OBJECT`는 free list의 head를 pop해서 object index를 반환한다. `FREE-OBJECT`는 object `x`를 free list head에 push한다. 둘 다 pointer 하나만 갱신하므로 $O(1)$ time이다.

여기서 `prev` attribute를 reset하지 않는 이유는 free list가 singly linked list로 관리되기 때문이다. Free object를 다시 allocate한 뒤 실제 linked list에 insert할 때 필요한 fields를 다시 설정하면 된다.

#### 여러 list와 하나의 free list

하나의 free list는 여러 linked lists를 service할 수 있다. `Figure 10.8`은 `L1`, `L2`, free list가 같은 `key`, `next`, `prev` arrays 안에서 서로 얽혀 존재하는 예시다. 핵심은 각 slot이 “어느 list에 속하는지”가 물리적 array 위치가 아니라 pointer/index 연결로 결정된다는 점이다.

이 관점은 메모리 관리의 기본 원리와 연결된다. Free storage는 별도 공간에 예쁘게 모여 있지 않아도 된다. 현재 사용 중인 objects와 free objects가 array 안에 섞여 있어도, free list head와 `next` links만 올바르면 allocator는 $O(1)$에 다음 free slot을 찾을 수 있다.

#### Compact representation과 virtual memory 맥락

Exercise 10.3-4와 10.3-5는 linked list elements를 array의 앞쪽 `1..n` 위치에 compact하게 유지하는 문제를 다룬다. 원문은 paged virtual-memory environment를 예로 든다. 원소들이 흩어져 있으면 더 많은 page를 건드릴 수 있고, compact하게 모여 있으면 locality가 좋아질 수 있다.

하지만 compactification은 pointer/index 갱신을 동반한다. 외부에서 list element를 가리키는 pointer가 있으면 마음대로 slot을 옮길 수 없다. Exercise 10.3-4는 “linked list 외부에 element를 가리키는 pointer가 없다”는 조건을 둔다. 이 조건이 있어야 array slot 이동 후 내부 pointers만 수정하면 representation을 안전하게 유지할 수 있다.

#### 10.3의 구현 포인트

- Pointer는 반드시 machine address일 필요가 없다. Array index도 pointer 역할을 할 수 있다.
- Object는 반드시 language-level object일 필요가 없다. Attribute arrays 또는 contiguous block으로 object를 표현할 수 있다.
- Free list는 allocator의 가장 단순한 형태다.
- `ALLOCATE-OBJECT`와 `FREE-OBJECT`는 stack의 `POP`/`PUSH`와 같은 구조다.
- Compact storage는 locality에는 좋지만 object 이동과 pointer update라는 비용과 제약이 생긴다.

### 10.4 Representing rooted trees

#### Tree node도 object로 표현한다

Linked list에서 object가 `key`, `next`, `prev` attributes를 가졌듯, rooted tree에서도 각 node를 object로 표현한다. 각 node는 보통 `key`를 가지고, 나머지 attributes는 다른 nodes를 가리키는 pointers다. 어떤 pointer fields가 필요한지는 tree의 종류와 지원하려는 traversal 방향에 따라 달라진다.

#### Binary tree representation

`binary tree`에서는 각 node가 최대 두 children만 가지므로 pointer fields가 고정된다.

```text
x.p     : parent
x.left  : left child
x.right : right child
```

Root는 parent가 없으므로 $x.p = NIL$이다. 어떤 child가 없으면 해당 field가 `NIL`이다. 전체 tree object `T`는 root를 `T.root`로 가리킨다. $T.root = NIL$이면 empty tree다.

![Figure 10.9](@/assets/images/cs-algorithm-041-figure-10-9-page-268.png)
*Figure 10.9 · PDF p. 268 · binary tree node를 `p`, `left`, `right` pointers로 표현하는 방식*

Binary tree에서는 모든 node가 같은 shape의 object를 가진다. 즉 `key`, `p`, `left`, `right` fields를 가진 homogeneous objects로 구현할 수 있고, Section 10.3의 multiple-array representation으로도 옮길 수 있다.

#### Rooted trees with unbounded branching

일반 rooted tree에서는 node마다 children 수가 다를 수 있다. Children 수가 최대 상수 `k`로 작게 제한된다면

```text
x.child_1, x.child_2, ..., x.child_k
```

같은 fixed fields를 둘 수 있다. 하지만 unbounded branching에서는 문제가 생긴다.

- 각 node에 몇 개의 child pointer fields를 둘지 미리 알 수 없다.
- 큰 상수 `k`를 잡아도 대부분 node가 children을 적게 가지면 memory waste가 크다.

그래서 CLRS는 `left-child, right-sibling representation`을 사용한다.

#### Left-child, right-sibling representation

각 node `x`는 parent pointer 외에 두 pointer만 가진다.

$$
\begin{aligned}
\text{x.p             : parent} \\
\text{x.left-child    :} x의 가장 왼쪽 child \\
\text{x.right-sibling :} x 바로 오른쪽 sibling
\end{aligned}
$$

Child가 없으면 $x.left-child = NIL$이고, parent의 가장 오른쪽 child이면 $x.right-sibling = NIL$이다.

![Figure 10.10](@/assets/images/cs-algorithm-042-figure-10-10-page-268.png)
*Figure 10.10 · PDF p. 268 · arbitrary rooted tree를 `left-child`와 `right-sibling` 두 pointer로 표현하는 방식*

이 표현은 arbitrary number of children을 $O(n)$ space로 표현한다. 각 node마다 children 수만큼 pointer field를 두는 대신, children을 sibling linked list처럼 연결하고 parent는 그 list의 head, 즉 leftmost child만 가리킨다.

구조적으로 보면 다음과 같다.

$$
\begin{aligned}
\text{parent x} \\
  \text{|} \\
  \text{v} \\
leftmost child \to right sibling \to right sibling \to \ldots
\end{aligned}
$$

모든 children을 순회하려면 $x.left-child$에서 시작해 `right-sibling` pointers를 따라가면 된다. 첫 child 접근은 $O(1)$이고, 모든 children 열거는 children 수에 linear하다.

#### Other tree representations

Tree representation은 application이 어떤 방향으로 tree를 탐색하고 어떤 연산을 자주 하는지에 따라 달라진다.

| 예 | 표현 | 이유 |
| --- | --- | --- |
| heap, Chapter 6 | single array + last node index | complete binary tree라 parent/child index 계산 가능 |
| disjoint-set forest, Chapter 21 | parent pointers only | 주로 root 방향으로만 traversal |
| arbitrary rooted tree | left-child, right-sibling | unbounded branching을 $O(n)$ space로 표현 |

즉 “tree니까 항상 node에 모든 child pointers를 둔다”가 아니다. 필요한 traversal과 update operation에 맞춰 pointer fields를 고른다.

#### 10.4 Exercises가 묻는 구현 감각

- Binary tree traversal은 recursive하게 `left`, `right`를 방문하면 $O(n)$이다.
- Nonrecursive traversal은 stack을 auxiliary data structure로 사용해 call stack을 명시적으로 흉내 낼 수 있다.
- Left-child, right-sibling representation에서 arbitrary rooted tree를 출력하려면 child list를 따라가며 각 child의 subtree를 방문한다.
- Parent pointer를 없애거나 줄이려면 constant-time parent access를 포기하거나, boolean flag와 pointer 해석 규칙을 추가해 trade-off를 만든다.

### Problems for Chapter 10

#### Problem 10-1: Comparisons among lists

List variants의 operation cost를 비교하는 문제다. 핵심은 sorted/unsorted와 singly/doubly가 서로 다른 operations에 영향을 준다는 점이다.

| list 형태 | 유리한 점 | 불리한 점 |
| --- | --- | --- |
| unsorted singly linked | head insertion이 $O(1)$, pointer 적음 | predecessor가 없어 delete/successor류가 까다로움 |
| sorted singly linked | minimum은 head로 빠름 | insert/search가 순서 유지 때문에 scan 필요 |
| unsorted doubly linked | pointer가 주어진 delete는 $O(1)$ | search/min/max는 scan 필요 |
| sorted doubly linked | predecessor/successor와 ordered traversal에 유리 | insert 위치 찾기 비용 발생 |

이 문제는 자료구조 선택이 “모든 연산을 다 빠르게”가 아니라, workload에서 중요한 operations에 맞추는 일임을 보여 준다.

#### Problem 10-2: Mergeable heaps using linked lists

`mergeable heap`은 `MAKE-HEAP`, `INSERT`, `MINIMUM`, `EXTRACT-MIN`, `UNION`을 지원하는 dynamic set이다. Linked list로 구현할 때 sorted list와 unsorted list의 선택은 trade-off를 만든다.

- Sorted list: `MINIMUM`은 head에서 빠르지만 `INSERT`가 위치 탐색을 요구할 수 있다.
- Unsorted list: `INSERT`와 `UNION`은 빠르게 만들 수 있지만 `MINIMUM`/`EXTRACT-MIN`이 scan을 요구한다.
- Disjoint sets가 보장되면 `UNION`은 list concatenation으로 더 단순해진다.

Chapter 6의 heap과 연결해서 보면, linked list 기반 mergeable heap은 어떤 operation을 빠르게 만들지에 따라 성능표가 크게 달라진다.

#### Problem 10-3: Searching a sorted compact list

`COMPACT-LIST-SEARCH`는 sorted compact linked list에서 random jumps를 섞어 search를 빠르게 하려는 문제다. List가 compact하므로 random index $j = RANDOM(1,n)$을 고르면 free slot이 아니라 실제 list object를 가리킨다는 점을 이용한다.

일반 sorted linked list search는 `next`를 따라 한 칸씩 이동하므로 worst case $\Theta(n)$이다. Compact list에서는 array index로 무작위 probe를 할 수 있고, $key[i] < key[j] \le k$이면 search 위치를 `j`로 jump할 수 있다. 문제는 이를 분석해 expected

$$
O(\sqrt{n})
$$

search time을 보이는 것이다.

이 문제는 “linked list는 random access가 안 된다”는 일반적 약점을 compact array representation과 randomization으로 일부 보완할 수 있음을 보여 준다.

## 복잡도

| 구조/연산 | 시간 | 조건/주의 |
| --- | --- | --- |
| `STACK-EMPTY`, `PUSH`, `POP` | $O(1)$ | array stack, overflow check는 생략 가능 |
| `ENQUEUE`, `DEQUEUE` | $O(1)$ | circular array queue |
| `LIST-SEARCH` | $\Theta(n)$ worst case | unsorted linked list |
| `LIST-INSERT` | $O(1)$ | head insertion |
| `LIST-DELETE` with pointer | $O(1)$ | 삭제할 object pointer가 이미 주어짐 |
| delete by key in linked list | $\Theta(n)$ worst case | search 후 delete |
| `ALLOCATE-OBJECT`, `FREE-OBJECT` | $O(1)$ | free list를 stack처럼 사용 |
| binary tree traversal | $O(n)$ | 모든 node 방문 |
| arbitrary rooted tree traversal | $O(n)$ | left-child, right-sibling representation |
| compact sorted list randomized search | expected $O(\sqrt{n})$ | Problem 10-3, compact array representation |

## 연결 관계

- Chapter 6의 heap은 complete binary tree를 array로 표현하는 대표 사례다.
- Chapter 7/8/9의 알고리즘들은 종종 stack, queue, linked list 같은 기본 구조를 subroutine 또는 auxiliary structure로 사용한다.
- Chapter 11 hash tables에서는 linked lists가 chaining 방식의 collision resolution에 사용된다.
- Chapter 12 binary search trees는 Section 10.4의 `p`, `left`, `right` pointer representation을 직접 사용한다.
- Chapter 21 disjoint sets는 tree를 parent pointers 위주로 표현한다.
- Graph algorithms에서는 adjacency lists, queues, stacks가 traversal의 기본 표현으로 반복 등장한다.

## 오해하기 쉬운 내용

- Array 안에 값이 남아 있어도 stack/queue의 논리적 원소가 아닐 수 있다. `S.top`, `Q.head`, `Q.tail` 같은 attributes가 representation을 정의한다.
- Queue에서 `Q.tail`은 마지막 원소 위치가 아니라 다음 삽입 위치다.
- Circular queue가 `n`칸 array에 $n-1$개만 담는 것은 empty/full 구분을 단순하게 하려는 설계다.
- Linked list deletion이 항상 $O(1)$인 것은 아니다. 삭제할 pointer가 이미 있을 때만 $O(1)$이고, key로 찾아 삭제하면 search 비용이 든다.
- Sentinel은 asymptotic bound를 거의 바꾸지 않지만 boundary code를 줄인다. 작은 list가 많으면 storage overhead가 문제될 수 있다.
- Pointer는 반드시 실제 memory address일 필요가 없다. Array index도 pointer 역할을 할 수 있다.
- Free list의 원소는 물리적으로 모여 있을 필요가 없다. `next` links가 free slots를 정의한다.
- General rooted tree에서 child pointer를 무작정 많이 두면 memory waste가 크다. `left-child, right-sibling`은 이를 피하는 표준 표현이다.

## 면접 질문

1. Stack의 `LIFO`와 queue의 `FIFO` 정책을 $PUSH/POP$, $ENQUEUE/DEQUEUE$ 관점에서 설명하라.
2. Circular array queue에서 왜 `Q.tail`을 “다음 삽입 위치”로 두는가?
3. Array queue에서 한 칸을 비워 두는 이유는 무엇인가?
4. Doubly linked list에서 pointer가 주어진 node 삭제는 왜 $O(1)$인가?
5. Key만 주어진 linked-list deletion은 왜 worst case $\Theta(n)$인가?
6. Sentinel `L.nil`은 linked list code를 어떻게 단순화하는가?
7. Multiple-array representation에서 pointer가 array index라는 말은 무슨 뜻인가?
8. `ALLOCATE-OBJECT`와 `FREE-OBJECT`가 free list를 stack처럼 사용한다는 것을 설명하라.
9. Binary tree node의 `p`, `left`, `right` fields는 각각 무엇을 가리키는가?
10. `left-child, right-sibling representation`이 arbitrary rooted tree를 $O(n)$ space로 표현하는 이유는 무엇인가?
