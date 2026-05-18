---
title: "Chapter 18. Concurrency Control"
order: 18
pubDatetime: 2026-05-18T00:09:00+09:00
modDatetime: 2026-05-18T00:09:00+09:00
description: "Database System Concepts 정리: Chapter 18. Concurrency Control"
tags:
  - "Database"
  - "CS"
---

- 원문 범위: PDF pp. 864-935
- 기준 자료: `Database-System-Concepts_full_with_pages.txt`, `Database-System-Concepts_topics.md`, `figures_manifest.json`

## 개요

`concurrency control`은 여러 `transaction`이 동시에 실행될 때도 각 transaction이 마치 혼자 실행되는 것처럼 보이게 하는 DBMS 내부 장치다. Chapter 17에서 `isolation`을 설명했다면, 이 장은 그 isolation을 실제로 어떻게 강제하는지 다룬다. 핵심 문제는 동시 실행이 성능을 높이지만, 제어하지 않으면 `serializability`, `recoverability`, `cascadelessness`가 깨진다는 점이다.

이 장의 대표 기법은 `lock-based protocol`, `timestamp-based protocol`, `validation-based protocol`, `multiversion scheme`, `snapshot isolation`이다. Chapter 18은 주로 정상 실행 중의 상호작용을 다루며, failure와 recovery는 Chapter 19의 주제다.

## 핵심 개념

- `lock`은 transaction이 data item을 읽거나 쓰기 전에 DBMS에 요청하는 접근 권한이다.
- `shared lock(S)`은 읽기 권한, `exclusive lock(X)`은 읽기와 쓰기 권한을 의미한다.
- `locking protocol`은 lock 요청과 해제 순서를 제한하여 가능한 schedule의 집합을 줄인다.
- `two-phase locking(2PL)`은 모든 lock 획득이 모든 lock 해제보다 먼저 일어나게 하여 `conflict serializability`를 보장한다.
- `strict two-phase locking`은 X lock을 commit까지 보유하여 `cascading rollback`을 막는다.
- `lock manager`는 lock table과 wait queue를 관리하며, grant/wait/rollback 결정을 내린다.
- `tree protocol`은 data item 사이의 partial order를 이용해 deadlock 없이 conflict serializable schedule을 만든다.

## 세부 정리

### 18.1 Lock-Based Protocols

`lock-based protocol`의 출발점은 단순하다. 어떤 data item `Q`에 여러 transaction이 동시에 접근할 수 있더라도, 그 접근 조합이 안전한 경우만 허용한다. DBMS는 transaction이 `read(Q)` 또는 `write(Q)`를 수행하기 전에 먼저 `lock-S(Q)` 또는 `lock-X(Q)`를 요청하게 만든다.

#### 18.1.1 Locks

Lock mode는 기본적으로 두 가지다.

| Lock mode | 표기 | 허용 동작 | 의미 |
|---|---:|---|---|
| `shared lock` | `S` | `read(Q)` | 여러 transaction이 동시에 읽을 수 있다. |
| `exclusive lock` | `X` | `read(Q)`, `write(Q)` | 하나의 transaction만 읽고 쓸 수 있다. |

`S` lock끼리는 compatible하지만, `X` lock은 다른 `S`/`X` lock과 incompatible하다. 따라서 어떤 transaction이 `Q`에 X lock을 보유 중이면 다른 transaction은 `Q`를 읽거나 쓸 수 없다.

![Figure 18.1](@/assets/images/cs-database-264-figure-18-1-page-865.png)
*Figure 18.1 · PDF p. 865 · shared/exclusive lock compatibility matrix*

Lock 요청은 `concurrency-control manager`가 처리한다. 이미 보유된 lock과 compatible하면 grant하고, incompatible하면 요청 transaction을 wait 상태로 둔다. 단, lock을 얻었다고 해서 언제든 해제해도 되는 것은 아니다. lock을 너무 일찍 풀면 serializable하지 않은 schedule이 허용될 수 있다.

책의 계좌 예시는 이 위험을 보여준다. `T1`은 계좌 `B`에서 50달러를 빼고 `A`에 더하는 transfer transaction이고, `T2`는 `A+B`의 합계를 출력하는 read-only transaction이다. 두 transaction이 각각 data item 접근 직후 lock을 바로 해제하면, `T2`는 `T1`이 `B`만 갱신하고 `A`는 아직 갱신하지 않은 중간 상태를 읽을 수 있다. 그 결과 serial execution에서는 항상 300이어야 하는 합계가 250으로 출력될 수 있다. 즉, 개별 read/write마다 lock을 잡는 것만으로는 `serializability`가 보장되지 않는다.

반대로 모든 lock을 transaction 끝까지 유지하면 inconsistent read는 피할 수 있지만 `deadlock`이 생길 수 있다. 예를 들어 `T3`가 `B`의 X lock을 잡고 `A`를 기다리는 동안, `T4`가 `A`의 S lock을 잡고 `B`를 기다리면 둘 다 진행할 수 없다. DBMS 입장에서는 deadlock이 inconsistent database state보다 낫다. deadlock은 rollback으로 풀 수 있지만, 잘못 외부로 관찰되거나 반영된 불일치 상태는 복구가 훨씬 어렵다.

일반적으로 `locking protocol`은 lock/unlock의 순서에 규칙을 부여한다. 어떤 protocol이 허용하는 모든 schedule의 precedence relation이 acyclic이면, 그 protocol은 `conflict serializability`를 보장한다.

#### 18.1.2 Granting of Locks

Lock grant 정책은 starvation을 막아야 한다. 단순히 compatible하다는 이유만으로 새 S lock 요청을 계속 grant하면, 오래 기다리던 X lock 요청이 영원히 밀릴 수 있다.

공정한 lock grant 규칙은 다음 두 조건을 함께 본다.

- 요청한 lock이 현재 보유 중인 lock들과 compatible해야 한다.
- 같은 data item `Q`에 대해 더 먼저 wait 중인 incompatible request가 없어야 한다.

즉, lock queue에서 늦게 온 요청이 먼저 온 요청을 계속 추월하지 못하게 한다. 이 원칙이 있어야 `starvation`이 방지된다.

#### 18.1.3 The Two-Phase Locking Protocol

`two-phase locking protocol(2PL)`은 각 transaction의 lock 동작을 두 단계로 나눈다.

| Phase | 허용되는 동작 | 금지되는 동작 |
|---|---|---|
| `growing phase` | lock 획득 | lock 해제 |
| `shrinking phase` | lock 해제 | 새 lock 획득 |

핵심 규칙은 “한 번이라도 lock을 해제한 transaction은 이후 어떤 lock도 새로 얻을 수 없다”이다. 각 transaction이 마지막 lock을 얻는 시점을 `lock point`라고 하며, 2PL schedule은 transaction들의 lock point 순서대로 serial schedule과 conflict equivalent하다. 그래서 2PL은 `conflict serializability`를 보장한다.

하지만 2PL은 deadlock-free가 아니다. 또한 기본 2PL은 `cascading rollback`을 허용할 수 있다. 어떤 transaction이 아직 commit하지 않은 값을 write하고 lock을 해제하면, 다른 transaction들이 그 uncommitted value를 읽고 다시 write할 수 있다. 이후 원래 transaction이 abort되면 그 값을 읽은 transaction들도 연쇄적으로 abort해야 한다.

![Figure 18.8](@/assets/images/cs-database-271-figure-18-8-page-871.png)
*Figure 18.8 · PDF p. 871 · two-phase locking에서도 발생할 수 있는 cascading rollback*

이 문제를 줄이기 위해 더 강한 변형이 쓰인다.

| Protocol | 추가 규칙 | 효과 |
|---|---|---|
| `strict two-phase locking` | 모든 X lock을 commit/abort까지 보유 | uncommitted write를 다른 transaction이 읽지 못해 cascading rollback을 방지한다. |
| `rigorous two-phase locking` | 모든 S/X lock을 commit/abort까지 보유 | transaction들이 commit 순서대로 serial화된다. |

`lock conversion`은 2PL의 concurrency를 조금 더 높이는 장치다. transaction이 처음에는 읽기만 하다가 나중에 쓰기가 필요해질 수 있으므로, `upgrade`와 `downgrade`를 허용한다.

- `upgrade`: `S` lock을 `X` lock으로 바꾼다. growing phase에서만 가능하다.
- `downgrade`: `X` lock을 `S` lock으로 바꾼다. shrinking phase에서만 가능하다.

DBMS는 보통 application이 직접 모든 lock을 호출하게 두지 않는다. `read(Q)`를 처리할 때 필요한 S lock을 자동으로 요청하고, `write(Q)`를 처리할 때 X lock 또는 upgrade를 자동으로 수행한다. transaction이 commit 또는 abort되면 보유 lock을 해제한다.

#### 18.1.4 Implementation of Locking

`lock manager`는 transaction으로부터 lock request와 unlock request를 받아 `lock grant` 또는 wait 결정을 내리는 DBMS 구성 요소다. deadlock 처리와 결합되면 특정 transaction에 rollback을 요청할 수도 있다.

구현의 중심 자료구조는 `lock table`이다. 보통 hash table을 사용하며 key는 data item identifier다. 각 data item에는 lock request record들의 linked list가 붙는다. record에는 transaction id, lock mode, 현재 granted/waiting 여부가 들어간다. transaction id별 index도 함께 두면, 특정 transaction이 보유한 lock을 빠르게 찾을 수 있다.

![Figure 18.10](@/assets/images/cs-database-273-figure-18-10-page-874.png)
*Figure 18.10 · PDF p. 874 · data item별 lock request queue를 저장하는 lock table*

Lock request 처리 흐름은 다음과 같다.

1. 해당 data item의 queue가 없으면 새 queue를 만든다.
2. request record를 queue 끝에 추가한다.
3. 현재 granted lock들과 compatible하고, 앞선 waiting request가 없으면 즉시 grant한다.
4. 그렇지 않으면 request는 waiting 상태로 남는다.

Unlock이 들어오면 해당 transaction의 request record를 제거하고, 뒤쪽 request들을 순서대로 검사하여 새로 grant 가능한 요청을 깨운다. Transaction abort 시에는 waiting request를 제거하고, undo가 끝난 뒤 보유 lock을 해제한다. 이 queue 기반 정책은 앞선 요청을 존중하므로 starvation을 막는 데도 중요하다.

#### 18.1.5 Graph-Based Protocols

`graph-based protocol`은 data item 접근 순서에 대한 사전 지식을 활용한다. Data item 집합 `D = {d1, d2, ..., dh}` 위에 partial order `->`를 정의하고, `di -> dj`이면 두 item을 모두 접근하는 transaction은 반드시 `di`를 `dj`보다 먼저 접근해야 한다. 이 partial order는 cycle이 없는 `database graph`로 볼 수 있다.

![Figure 18.11](@/assets/images/cs-database-274-figure-18-11-page-876.png)
*Figure 18.11 · PDF p. 876 · tree protocol이 가정하는 tree-structured database graph*

대표 예가 `tree protocol`이다. 이 protocol은 X lock만 사용하며 규칙은 다음과 같다.

1. transaction의 첫 lock은 어떤 data item에도 걸 수 있다.
2. 이후 data item `Q`를 lock하려면, `Q`의 parent를 현재 lock으로 보유하고 있어야 한다.
3. data item은 언제든 unlock할 수 있다.
4. 한 번 lock했다가 unlock한 data item은 같은 transaction이 다시 lock할 수 없다.

Tree protocol은 2PL이 아니다. transaction이 어떤 lock을 해제한 뒤에도 그 node의 descendant에 lock을 걸 수 있기 때문이다. 그래도 data item 접근 순서가 tree partial order를 따르므로 legal schedule은 `conflict serializable`이고, transaction들이 서로 cycle을 만들 수 없어 `deadlock-free`다.

장점은 deadlock이 없고 lock을 일찍 해제할 수 있어 waiting time이 줄 수 있다는 점이다. 단점은 transaction이 실제로 접근하지 않을 data item까지 lock해야 할 수 있다는 점이다. 예를 들어 tree에서 멀리 떨어진 node를 접근하려면 경로상의 ancestor들을 lock해야 하며, transaction이 접근할 data item을 미리 모르면 root부터 lock해야 할 수 있다. 이 경우 lock overhead와 불필요한 waiting이 증가한다.

### 18.2 Deadlock Handling

`deadlock`은 waiting transaction들의 집합 `{T0, T1, ..., Tn}`이 있고, `T0`은 `T1`이 가진 data item을 기다리고, `T1`은 `T2`가 가진 data item을 기다리며, 마지막 `Tn`이 다시 `T0`이 가진 data item을 기다리는 상태다. 이 상태에서는 관련 transaction들이 스스로는 진행할 수 없다.

DBMS가 선택할 수 있는 큰 방향은 두 가지다.

| Approach | 아이디어 | 적합한 상황 |
|---|---|---|
| `deadlock prevention` | deadlock 상태가 애초에 생기지 않도록 lock 요청을 제한하거나 rollback한다. | deadlock 발생 확률이 높을 때 |
| `deadlock detection and recovery` | deadlock을 허용하되 주기적으로 탐지하고 rollback으로 복구한다. | deadlock이 드물어 예방 비용이 더 클 때 |

둘 다 rollback을 유발할 수 있다. Prevention은 불필요한 rollback이 생길 수 있고, detection은 wait-for graph 유지와 cycle detection, recovery 비용이 추가된다.

#### 18.2.1 Deadlock Prevention

첫 번째 예방 방식은 cyclic wait 자체가 불가능하게 lock 요청 순서를 제한하는 것이다. 가장 단순한 방법은 transaction 시작 전에 필요한 모든 data item을 한 번에 lock하게 하는 방식이다. 이 방식은 deadlock을 막지만, 실행 전에 필요한 data item을 예측하기 어렵고, 실제로는 나중에만 쓰거나 아예 쓰지 않을 data item까지 오래 lock하여 utilization이 낮다.

또 다른 방법은 data item 전체에 total order를 두고, transaction이 그 순서대로만 lock을 요청하게 하는 것이다. 이미 특정 순서의 item을 lock했다면 그보다 앞서는 item의 lock은 요청할 수 없다. 이 방식은 2PL 위에 구현하기 쉽지만, transaction이 접근할 data item 집합을 어느 정도 알고 있어야 효과적이다.

두 번째 예방 방식은 `preemption`과 rollback을 사용한다. Transaction이 lock을 기다리게 둘지, rollback시켜 lock을 빼앗을지는 transaction 시작 시 부여한 timestamp로 결정한다. Rollback된 transaction은 재시작해도 원래 timestamp를 유지하므로, 계속 새 transaction보다 젊게 취급되어 starvation이 줄어든다.

| Scheme | 성격 | 규칙 | 직관 |
|---|---|---|---|
| `wait-die` | nonpreemptive | older transaction은 younger가 가진 lock을 기다릴 수 있고, younger가 older의 lock을 원하면 rollback(die)한다. | 늙은 transaction은 기다리고, 젊은 transaction은 물러난다. |
| `wound-wait` | preemptive | older transaction이 younger가 가진 lock을 원하면 younger를 rollback(wound)시키고, younger가 older의 lock을 원하면 기다린다. | 늙은 transaction이 젊은 transaction을 밀어낸다. |

`lock timeout`은 구현이 쉽지만 제한적이다. 일정 시간 이상 lock을 못 얻으면 transaction이 스스로 rollback하고 재시작한다. Short transaction이 많고 긴 wait가 deadlock을 강하게 암시하는 환경에서는 쓸 만하지만, timeout 값을 정하기 어렵다. 너무 길면 deadlock 해소가 늦고, 너무 짧으면 deadlock이 아닌 정상 대기도 rollback되어 자원이 낭비된다. 같은 transaction이 반복적으로 timeout되면 starvation도 가능하다.

#### 18.2.2 Deadlock Detection and Recovery

Deadlock detection은 현재 lock allocation과 outstanding request 정보를 유지하고, 이 정보로 deadlock 여부를 판단한 뒤, deadlock이 있으면 recovery를 수행한다.

`wait-for graph`는 deadlock detection의 핵심 표현이다. Vertex는 transaction이고, edge `Ti -> Tj`는 `Ti`가 `Tj`가 가진 data item을 기다린다는 뜻이다. `Ti`가 `Tj`의 item을 요청하면 edge를 추가하고, `Tj`가 더 이상 그 item을 보유하지 않으면 edge를 제거한다. 시스템에 deadlock이 존재할 필요충분조건은 wait-for graph에 cycle이 있는 것이다.

![Figure 18.14](@/assets/images/cs-database-277-figure-18-14-page-881.png)
*Figure 18.14 · PDF p. 881 · cycle이 있어 deadlock을 나타내는 wait-for graph*

Detection algorithm을 얼마나 자주 돌릴지는 deadlock 발생 빈도와 deadlock에 영향을 받는 transaction 수에 따라 달라진다. Deadlock이 잦으면 detection을 자주 해야 한다. Deadlocked transaction이 가진 data item은 풀리기 전까지 다른 transaction도 사용할 수 없고, wait-for graph의 cycle 수가 더 늘어날 수 있기 때문이다.

Deadlock recovery는 보통 하나 이상의 transaction rollback으로 cycle을 끊는다.

| Recovery step | 핵심 판단 |
|---|---|
| `victim selection` | rollback 비용이 가장 작은 transaction을 고른다. 이미 수행한 계산량, 남은 계산량, 사용한 data item 수, 앞으로 필요한 data item 수, rollback에 연쇄적으로 관련될 transaction 수를 고려한다. |
| `rollback` | 가장 단순한 방법은 total rollback이지만, 필요한 lock을 해제할 지점까지만 되돌리는 `partial rollback`도 가능하다. Partial rollback에는 lock request/grant와 update sequence 기록이 필요하다. |
| `starvation prevention` | 같은 transaction이 계속 victim으로 선택되지 않게 rollback 횟수를 cost factor에 포함한다. |

### 18.3 Multiple Granularity

지금까지의 locking은 개별 data item을 synchronization unit으로 보았다. 하지만 transaction마다 접근 범위가 다르다. 어떤 transaction은 relation 전체를 읽고, 다른 transaction은 tuple 몇 개만 수정한다. 모든 transaction이 tuple 단위 lock만 쓰면 relation scan은 엄청난 수의 lock을 잡아야 하고 lock table이 커진다. 반대로 항상 relation 전체를 lock하면 짧은 transaction의 concurrency가 사라진다.

`multiple granularity`는 data item을 여러 크기의 단위로 보고, 큰 단위와 작은 단위를 계층화한다. 예를 들어 database, area, file, record 순서의 tree를 만들 수 있다. 이 tree에서 nonleaf node는 descendant들의 데이터 전체를 대표한다. 어떤 node를 S 또는 X mode로 explicit lock하면, 그 descendant들도 같은 mode로 implicit lock된 것으로 본다.

![Figure 18.15](@/assets/images/cs-database-278-figure-18-15-page-883.png)
*Figure 18.15 · PDF p. 883 · database-area-file-record로 내려가는 granularity hierarchy*

문제는 ancestor나 descendant에 걸린 implicit lock을 빠르게 판단하는 것이다. 예를 들어 file `Fb`가 X lock으로 explicit lock되어 있으면 그 안의 record도 implicit X lock 상태다. 다른 transaction이 record 하나를 lock하려 할 때 전체 subtree를 검색하면 multiple-granularity의 장점이 사라진다. 그래서 `intention lock mode`를 사용한다.

| Mode | 의미 |
|---|---|
| `IS` (`intention-shared`) | descendant에서 S lock을 explicit하게 잡을 계획이 있다. |
| `IX` (`intention-exclusive`) | descendant에서 X 또는 S lock을 explicit하게 잡을 계획이 있다. |
| `SIX` (`shared and intention-exclusive`) | 해당 node의 subtree는 S mode로 explicit lock하고, descendant 일부에는 X lock을 잡을 계획이 있다. |

![Figure 18.16](@/assets/images/cs-database-279-figure-18-16-page-884.png)
*Figure 18.16 · PDF p. 884 · IS, IX, S, SIX, X lock mode compatibility matrix*

Multiple-granularity locking protocol의 규칙은 다음과 같다.

1. Figure 18.16의 compatibility matrix를 지킨다.
2. transaction은 root를 먼저 lock해야 하며, root는 어떤 mode로도 lock할 수 있다.
3. node `Q`를 `S` 또는 `IS` mode로 lock하려면 parent를 `IX` 또는 `IS` mode로 보유해야 한다.
4. node `Q`를 `X`, `SIX`, `IX` mode로 lock하려면 parent를 `IX` 또는 `SIX` mode로 보유해야 한다.
5. transaction이 어떤 node라도 unlock한 뒤에는 새 node를 lock할 수 없다. 즉, transaction은 two phase여야 한다.
6. node `Q`를 unlock하려면 현재 `Q`의 child 중 lock을 보유한 것이 없어야 한다.

따라서 lock 획득은 top-down(root-to-leaf), lock 해제는 bottom-up(leaf-to-root) 순서가 된다. 이 protocol은 2PL처럼 `serializability`를 보장하지만, deadlock은 여전히 가능하다.

예를 들어 record `ra2`만 읽는 transaction은 database, area `A1`, file `Fa`를 `IS`로 잡고 `ra2`를 `S`로 잡는다. Record `ra9`를 수정하는 transaction은 같은 경로를 `IX`로 잡고 `ra9`를 `X`로 잡는다. File `Fa` 전체를 읽는 transaction은 database와 `A1`을 `IS`, `Fa`를 `S`로 잡는다. Database 전체를 읽는 transaction은 root를 `S`로 잡으면 된다. 이 방식은 short transaction과 long report transaction이 섞인 환경에서 lock overhead와 concurrency 사이의 균형을 잡는다.

SQL query의 lock 수는 relation scan과 index scan으로 어느 정도 추정할 수 있다. Relation scan은 relation-level lock을, 소수 tuple만 가져올 index scan은 relation-level intention lock과 tuple-level lock을 사용할 수 있다. Tuple lock이 너무 많아 lock table이 넘칠 때는 `lock escalation`으로 많은 lower-level lock을 하나의 higher-level lock으로 대체할 수 있다.

### 18.4 Insert Operations, Delete Operations, and Predicate Reads

Read/write만 고려하면 기존 data item에 대한 충돌만 다룬다. 실제 transaction은 `insert(Q)`로 새 data item을 만들고, `delete(Q)`로 기존 data item을 없앤다. 삭제된 item을 읽거나, 아직 삽입되지 않은 item을 읽거나, 존재하지 않는 item을 삭제하는 것은 logical error다.

#### 18.4.1 Deletion

`delete(Q)`는 `read(Q)`, `write(Q)`, 다른 `delete(Q)`, `insert(Q)`와 모두 conflict한다. 순서에 따라 한쪽 transaction이 logical error를 만날 수 있기 때문이다. 따라서 2PL에서는 `delete(Q)` 전에 `Q`에 대한 X lock이 필요하다.

Timestamp-ordering protocol에서는 delete를 write와 비슷하게 검사한다. Transaction `Ti`가 `delete(Q)`를 요청할 때 `TS(Ti) < R-timestamp(Q)`이면 더 젊은 transaction이 이미 `Q`를 읽었으므로 delete가 거부되고 `Ti`는 rollback된다. `TS(Ti) < W-timestamp(Q)`이면 더 젊은 transaction이 이미 `Q`를 썼으므로 역시 delete가 거부된다. 두 조건이 모두 아니면 delete를 수행한다.

#### 18.4.2 Insertion

`insert(Q)`는 `Q`에 초기값을 부여하므로 concurrency-control 관점에서 write와 비슷하다. 2PL에서는 삽입된 새 data item `Q`에 X lock을 부여한다. Timestamp-ordering에서는 새 item의 `R-timestamp(Q)`와 `W-timestamp(Q)`를 삽입 transaction의 `TS(Ti)`로 설정한다.

#### 18.4.3 Predicate Reads and The Phantom Phenomenon

`predicate read`는 특정 tuple id가 아니라 조건을 만족하는 tuple 집합을 읽는다. 예를 들어 다음 query는 `dept_name = 'Physics'`인 모든 instructor tuple을 세어야 한다.

```sql
select count(*)
from instructor
where dept_name = 'Physics';
```

동시에 다른 transaction이 Physics instructor tuple을 insert하면, 두 transaction은 같은 기존 tuple을 건드리지 않았어도 conflict한다. Count query가 새 tuple을 포함하면 insert transaction이 먼저 온 serial order여야 하고, 포함하지 않으면 count transaction이 먼저 온 serial order여야 한다. Tuple-level locking만으로는 이 충돌을 감지하지 못한다. 새로 나타난 tuple을 `phantom tuple`이라고 하며, 이 문제가 `phantom phenomenon`이다.

Phantom은 insert뿐 아니라 update에서도 생긴다. 예를 들어 다른 department였던 instructor의 `dept_name`이 Physics로 바뀌면, 기존 Physics tuple만 읽은 transaction과 실제 tuple overlap 없이도 충돌한다. 근본 원인은 “조건을 만족하는 tuple 집합”이라는 relation/index의 검색 정보가 읽히고 바뀐다는 점이다.

가장 단순한 해결은 relation에 “어떤 tuple들이 relation에 속하는가”를 나타내는 별도 data item을 두고, predicate read는 이를 S lock, insert/update/delete는 X lock으로 잡게 하는 것이다. Index를 사용해 tuple을 찾는 transaction은 index 자체도 lock해야 한다. 단, 이것은 relation 전체 lock과는 다르다. Relation membership 정보를 바꾸지 않는 직접 tuple 접근은 여전히 tuple lock만으로 가능하다.

단순 relation/index lock의 단점은 concurrency가 낮다는 것이다. 서로 다른 tuple을 삽입하는 transaction들도 같은 relation/index data item 때문에 동시에 실행되지 못할 수 있다. 더 나은 방법은 `index-locking protocol`이다. B+-tree index를 기준으로, lookup transaction은 접근한 index leaf node에 S lock을 잡고, insert/delete/update transaction은 영향을 받는 index leaf node에 X lock을 잡는다. 이렇게 하면 phantom conflict를 index leaf node의 실제 lock conflict로 바꿀 수 있다.

Index-locking protocol의 핵심 규칙은 다음과 같다.

- 모든 relation은 적어도 하나의 index를 가져야 한다.
- transaction은 tuple을 relation에서 직접 집어오는 것이 아니라 index를 통해 찾은 뒤 접근해야 한다. Relation scan은 어떤 index의 모든 leaf를 scan하는 것으로 취급한다.
- range lookup 또는 point lookup은 접근한 모든 index leaf node에 S lock을 잡아야 한다.
- insert/delete/update는 relation의 모든 index를 갱신해야 하며, 영향을 받는 index leaf node에 X lock을 잡아야 한다.

Index-locking protocol은 index internal node 자체의 동시성 제어까지 해결하지는 않는다. 그 주제는 18.10.2에서 다시 다룬다. 또한 leaf node 전체를 lock하면 실제 predicate와 충돌하지 않는 update까지 막는 false conflict가 생길 수 있다. 이를 줄이는 변형이 `key-value locking`이다.

`predicate locking`은 query predicate 자체, 예를 들어 `salary > 90000`에 S lock을 거는 방식이다. Insert/delete/update가 predicate를 만족하거나 만족하게 만들면 predicate lock과 충돌한다. 의미론적으로는 자연스럽지만, 구현 비용이 높고 index-locking보다 실익이 크지 않아 실무에서는 잘 쓰이지 않는다.

### 18.5 Timestamp-Based Protocols

Locking protocol은 conflicting transaction 쌍이 실행 중 처음 incompatible lock을 요청하는 순간에 serialization order를 정한다. 반대로 `timestamp-ordering scheme`은 transaction이 시작될 때 미리 전역 순서를 정하고, 모든 conflicting read/write가 그 순서와 맞도록 강제한다.

#### 18.5.1 Timestamps

각 transaction `Ti`에는 고유하고 고정된 timestamp `TS(Ti)`가 부여된다. 먼저 시작한 transaction의 timestamp가 더 작다. Timestamp는 system clock 값으로 만들 수도 있고, 새 transaction마다 증가하는 logical counter로 만들 수도 있다.

`TS(Ti) < TS(Tj)`이면 DBMS는 결과 schedule이 `Ti`가 `Tj`보다 먼저 오는 serial schedule과 equivalent하도록 보장해야 한다. 이를 위해 각 data item `Q`는 두 timestamp를 가진다.

| Timestamp | 의미 |
|---|---|
| `W-timestamp(Q)` | `write(Q)`를 성공적으로 수행한 transaction 중 가장 큰 timestamp |
| `R-timestamp(Q)` | `read(Q)`를 성공적으로 수행한 transaction 중 가장 큰 timestamp |

#### 18.5.2 The Timestamp-Ordering Protocol

`timestamp-ordering protocol`은 read/write 요청마다 “이 operation이 timestamp order를 거스르는가?”를 검사한다.

| Operation | 조건 | 처리 |
|---|---|---|
| `Ti`가 `read(Q)` | `TS(Ti) < W-timestamp(Q)` | `Ti`가 읽어야 할 오래된 값이 이미 overwritten되었으므로 read reject, rollback |
| `Ti`가 `read(Q)` | `TS(Ti) >= W-timestamp(Q)` | read 수행, `R-timestamp(Q) = max(R-timestamp(Q), TS(Ti))` |
| `Ti`가 `write(Q)` | `TS(Ti) < R-timestamp(Q)` | `Ti`가 만들 값이 이미 더 젊은 transaction에게 필요했던 값이므로 write reject, rollback |
| `Ti`가 `write(Q)` | `TS(Ti) < W-timestamp(Q)` | obsolete value를 쓰려 하므로 write reject, rollback |
| `Ti`가 `write(Q)` | 그 외 | write 수행, `W-timestamp(Q) = TS(Ti)` |

Rollback된 transaction은 새 timestamp를 받아 restart한다. 이 protocol은 conflicting operation을 timestamp 순서로 처리하므로 `conflict serializability`를 보장한다.

![Figure 18.17](@/assets/images/cs-database-280-figure-18-17-page-893.png)
*Figure 18.17 · PDF p. 893 · timestamp order를 만족해 가능한 schedule 3*

Timestamp-ordering protocol의 장점은 transaction이 lock을 기다리지 않으므로 `deadlock-free`라는 점이다. 단점은 long transaction이 짧은 conflicting transaction들 때문에 반복 rollback될 수 있어 `starvation`이 생길 수 있다는 점이다. 이때는 conflicting transaction을 임시로 block하여 long transaction이 끝나게 해야 한다.

기본 timestamp-ordering은 recoverable schedule을 보장하지 않는다. 보완 방법은 여러 가지다. 모든 write를 transaction 끝에 atomically 수행하면 recoverability와 cascadelessness를 얻을 수 있다. 또는 uncommitted item을 읽으려는 transaction을 commit 전까지 지연시키는 제한적 locking을 붙일 수 있다. Recoverability만 필요하면 commit dependency를 추적하여, 어떤 transaction이 읽은 값을 쓴 transaction이 먼저 commit한 뒤에만 commit하게 만들 수 있다.

Tuple에만 timestamp-ordering을 적용하면 18.4.3의 `phantom problem`이 남는다. 이를 피하려면 relation metadata와 index node도 data item처럼 보고 `R-timestamp`, `W-timestamp`를 유지해야 한다. Locking 기반에서는 index-locking protocol이 같은 문제를 더 효율적으로 처리한다.

#### 18.5.3 Thomas' Write Rule

`Thomas' write rule`은 timestamp-ordering protocol의 write reject 규칙을 완화한다. 핵심 관찰은 “어차피 아무도 읽지 않을 오래된 write”는 transaction 전체를 rollback시키지 말고 무시해도 된다는 것이다.

![Figure 18.18](@/assets/images/cs-database-281-figure-18-18-page-894.png)
*Figure 18.18 · PDF p. 894 · obsolete write를 보여주는 Thomas' write rule 예시 schedule*

`Ti`가 `write(Q)`를 요청할 때 Thomas' write rule은 다음처럼 동작한다.

1. `TS(Ti) < R-timestamp(Q)`이면, `Ti`가 만들 값이 이미 더 젊은 transaction에 의해 읽혔어야 하는 값이므로 write를 reject하고 `Ti`를 rollback한다.
2. `TS(Ti) < W-timestamp(Q)`이면, `Ti`가 obsolete value를 쓰려는 것이므로 write operation만 ignore한다.
3. 그 외에는 write를 수행하고 `W-timestamp(Q)`를 `TS(Ti)`로 갱신한다.

이 규칙은 `conflict serializable`하지 않은 schedule도 허용할 수 있지만, 그 schedule이 `view serializable`이면 결과는 올바르다. `view equivalence`는 각 transaction이 같은 initial value 또는 같은 writer가 만든 value를 읽고, 각 data item의 final write transaction이 같으면 성립한다. `blind write`처럼 read 없이 write만 하는 operation이 있으면 conflict serializability보다 넓은 view serializability가 의미를 가진다.

### 18.6 Validation-Based Protocols

`validation-based protocol`은 conflict가 드물다고 기대되는 환경, 특히 read-only transaction이 많은 환경에 적합한 `optimistic concurrency-control scheme`이다. Locking이나 timestamp ordering처럼 충돌 가능성만으로 미리 wait/rollback하지 않고, 일단 transaction을 실행시킨 뒤 끝에서 검증한다.

각 transaction은 다음 phase를 순서대로 지난다.

| Phase | 역할 |
|---|---|
| `read phase` | 실제 database 값을 읽어 transaction local variable에 저장한다. Write도 실제 database가 아니라 local temporary variable에 수행한다. |
| `validation phase` | 이 transaction이 serializability를 깨지 않고 write phase로 갈 수 있는지 validation test를 수행한다. 실패하면 abort한다. |
| `write phase` | update transaction이면 local temporary result를 database에 복사한다. Read-only transaction은 이 phase가 없다. |

Validation test에는 세 timestamp가 필요하다.

| Timestamp | 의미 |
|---|---|
| `StartTS(Ti)` | `Ti`가 execution을 시작한 시각 |
| `ValidationTS(Ti)` | `Ti`가 read phase를 끝내고 validation phase를 시작한 시각 |
| `FinishTS(Ti)` | `Ti`가 write phase를 끝낸 시각 |

Serialization order는 `TS(Ti) = ValidationTS(Ti)`로 정한다. `Ti`를 validate할 때, `TS(Tk) < TS(Ti)`인 모든 transaction `Tk`에 대해 다음 중 하나가 성립해야 한다.

1. `FinishTS(Tk) < StartTS(Ti)`: `Tk`가 `Ti` 시작 전에 완전히 끝났으므로 순서가 명확하다.
2. `StartTS(Ti) < FinishTS(Tk) < ValidationTS(Ti)`이고, `write-set(Tk) ∩ read-set(Ti) = ∅`: 두 transaction의 실행이 겹쳤지만 `Tk`의 write가 `Ti`의 read에 영향을 주지 않았으므로 `Tk`를 `Ti` 앞에 serialize할 수 있다.

![Figure 18.19](@/assets/images/cs-database-282-figure-18-19-page-898.png)
*Figure 18.19 · PDF p. 898 · validation protocol로 생성된 schedule 6*

Validation scheme은 실제 write가 validation 성공 뒤에만 database에 반영되므로 `cascading rollback`을 자동으로 막는다. 하지만 timestamp ordering과 마찬가지로 long transaction이 짧은 conflicting transaction 때문에 반복 abort될 수 있다. 이 경우 starvation을 막기 위해 conflicting transaction을 잠시 block해야 한다.

`TS(Ti) = StartTS(Ti)`로 정해도 serializability는 유지할 수 있지만, timestamp가 더 작은 transaction이 아직 read/write set을 확정하지 않은 상태라면 validation이 기다려야 한다. `ValidationTS`를 사용하면 이런 대기를 줄일 수 있다.

### 18.7 Multiversion Schemes

앞의 protocol들은 필요한 값이 아직 쓰이지 않았거나 이미 overwritten되었을 때 operation을 wait시키거나 transaction을 abort한다. `multiversion concurrency-control scheme`은 data item의 과거 version을 유지하여 read가 적절한 version을 선택하게 한다. 각 `write(Q)`는 `Q`의 새 version을 만들고, `read(Q)`는 serializability를 보장하는 version을 읽는다.

#### 18.7.1 Multiversion Timestamp Ordering

`multiversion timestamp ordering`에서는 data item `Q`가 version sequence `<Q1, Q2, ..., Qm>`를 가진다. 각 version `Qk`는 다음 필드를 가진다.

| Field | 의미 |
|---|---|
| `Content` | 해당 version의 값 |
| `W-timestamp(Qk)` | 이 version을 만든 transaction의 timestamp |
| `R-timestamp(Qk)` | 이 version을 성공적으로 읽은 transaction 중 가장 큰 timestamp |

Transaction `Ti`가 `read(Q)` 또는 `write(Q)`를 요청하면, `W-timestamp <= TS(Ti)`인 version 중 write timestamp가 가장 큰 version `Qk`를 찾는다.

- `read(Q)`: `Qk`의 content를 반환하고 필요하면 `R-timestamp(Qk)`를 갱신한다. Read는 실패하거나 기다리지 않는다.
- `write(Q)`: `TS(Ti) < R-timestamp(Qk)`이면 너무 늦은 write이므로 rollback한다. `TS(Ti) = W-timestamp(Qk)`이면 같은 transaction이 만든 version을 overwrite한다. 그렇지 않으면 새 version을 만든다.

Version의 `valid interval`은 그 version이 어떤 timestamp의 transaction에게 보이는지를 나타낸다. `W-timestamp`가 `t`이고 다음 version의 timestamp가 `s`이면 interval은 `[t, s)`이고, 최신 version이면 `[t, ∞)`이다. Transaction timestamp가 이 interval 안에 있으면 그 version을 읽는다.

오래된 version은 더 이상 읽을 transaction이 없을 때 제거할 수 있다. 두 version의 `W-timestamp`가 모두 현재 시스템에서 가장 오래된 transaction의 timestamp보다 작다면, 더 오래된 version은 다시 사용되지 않으므로 삭제 가능하다.

이 scheme의 큰 장점은 read request가 실패하거나 wait하지 않는다는 것이다. Read가 많은 DBMS에서는 매우 중요하다. 단점도 있다. Read가 `R-timestamp`를 갱신해야 하므로 추가 disk access가 생길 수 있고, conflict 해결이 wait가 아니라 rollback에 의존해 비용이 클 수 있다. 기본 multiversion timestamp ordering은 recoverability와 cascadelessness도 보장하지 않아, basic timestamp ordering과 같은 보완이 필요하다.

#### 18.7.2 Multiversion Two-Phase Locking

`multiversion two-phase locking`은 multiversion의 read 장점과 2PL의 update 제어 장점을 결합한다. Transaction을 read-only와 update transaction으로 나눈다.

Update transaction은 `rigorous two-phase locking`을 수행하여 모든 lock을 transaction 끝까지 보유한다. 각 version에는 timestamp가 하나 붙고, 이 timestamp는 real clock이 아니라 commit processing 중 증가하는 counter인 `ts-counter`로 만든다.

Read-only transaction은 시작 전에 현재 `ts-counter` 값을 읽어 `TS(Ti)`로 삼고, `W-timestamp <= TS(Ti)`인 최신 version을 읽는다. 따라서 read-only transaction은 update transaction의 lock을 기다리지 않는다.

Update transaction은 item을 읽을 때 S lock을 얻고 최신 version을 읽는다. Item을 쓸 때는 X lock을 얻고 새 version을 만든다. 새 version의 timestamp는 처음에 가능한 모든 timestamp보다 큰 `∞`로 설정한다. Commit processing은 한 번에 하나의 update transaction만 수행한다. Commit 시 자신이 만든 모든 version timestamp를 `ts-counter + 1`로 설정하고, `ts-counter`를 1 증가시킨 뒤 commit한다.

이 방식에서 `Ti`가 commit되기 전에 시작한 read-only transaction은 이전 `ts-counter` snapshot을 보므로 `Ti`의 update 전 값을 읽고, `Ti` commit 후 시작한 read-only transaction은 update 후 값을 읽는다. Read-only transaction은 lock을 기다릴 필요가 없고, multiversion 2PL은 recoverable하고 cascadeless한 schedule을 보장한다.

Multiversion 구현에서는 constraint와 index 처리도 version-aware해야 한다. Primary key는 같은 key의 여러 record version을 허용하되 같은 logical record의 version들로 해석해야 한다. Delete는 특별한 deleted marker가 붙은 새 version 생성으로 구현할 수 있다. Foreign key 검사는 참조 tuple version의 valid interval이 해당 update/delete transaction timestamp를 포함하는지까지 봐야 한다. Index도 attribute 값이 version별로 달라지면 old value와 new value에 대해 별도 entry를 관리해야 한다.

### 18.8 Snapshot Isolation

`snapshot isolation`은 transaction이 시작될 때의 committed database snapshot을 읽게 하는 concurrency-control scheme이다. Read-only transaction에는 매우 유리하다. 다른 update transaction과 충돌하지 않고, concurrency manager에 의해 wait하거나 abort되지 않는다.

Update transaction은 자신의 private workspace에 update를 보관하다가 commit 전에 validation을 통과해야 한다. Commit이 허용되면 transaction state를 committed로 바꾸는 일과 모든 update를 database에 쓰는 일이 개념적으로 atomic action이어야 한다. 그래야 다른 transaction의 snapshot이 그 update를 전부 포함하거나 전혀 포함하지 않는 둘 중 하나가 된다.

#### 18.8.1 Multiversioning in Snapshot Isolation

Snapshot isolation은 multiversioning 기반이다. 각 transaction `Ti`는 두 timestamp를 가진다.

| Timestamp | 의미 |
|---|---|
| `StartTS(Ti)` | transaction이 시작한 시각 |
| `CommitTS(Ti)` | transaction이 validation을 요청한 시각 |

각 update는 data item의 새 version을 만들고, version timestamp는 그 version을 만든 transaction의 `CommitTS(Ti)`가 된다. `Ti`가 data item을 읽으면, `timestamp <= StartTS(Ti)`인 version 중 가장 최신 version을 반환한다. 따라서 `Ti`는 시작 전에 commit된 모든 update는 보고, 시작 후 commit된 update는 보지 않는다.

#### 18.8.2 Validation Steps for Update Transactions

Snapshot isolation에서도 update transaction끼리는 충돌할 수 있다. 두 concurrent transaction이 같은 data item을 갱신하면, 둘 다 자기 snapshot에서는 상대 update를 보지 못하므로 둘을 모두 commit시키면 `lost update`가 된다. 이를 막는 대표 변형은 `first committer wins`와 `first updater wins`다.

Transaction `Tj`가 `Ti`와 concurrent하다는 말은 `Ti`의 시작부터 validation 시작까지의 기간과 `Tj`의 active/partially committed 기간이 겹친다는 뜻이다. 형식적으로는 다음 중 하나가 성립한다.

- `StartTS(Tj) <= StartTS(Ti) <= CommitTS(Tj)`
- `StartTS(Ti) <= StartTS(Tj) <= CommitTS(Ti)`

`first committer wins`는 validation 시점에 `Ti`가 쓰려는 data item 중 `StartTS(Ti)`와 `CommitTS(Ti)` 사이 timestamp를 가진 version이 있는지 검사한다. 그런 version이 있으면 concurrent transaction이 이미 해당 item을 update한 것이므로 `Ti`를 abort한다. 없으면 `Ti`가 commit하고 update를 database에 쓴다.

`first updater wins`는 update에만 lock을 사용한다. `Ti`가 data item을 update하려 하면 write lock을 요청한다. Concurrent transaction이 lock을 보유하지 않았다면 lock 획득 후 concurrent update 여부를 검사하고, 이미 update된 item이면 abort한다. 다른 concurrent transaction `Tj`가 lock을 들고 있으면 `Ti`는 기다린다. `Tj`가 abort하면 lock을 얻고 검사를 진행할 수 있지만, `Tj`가 commit하면 `Ti`는 abort해야 한다.

#### 18.8.3 Serializability Issues and Solutions

Snapshot isolation은 long read-only transaction이 short update transaction을 막지 않는다는 실용적 장점이 크다. 그러나 이 장점에도 불구하고 일반 snapshot isolation은 `serializability`를 보장하지 않는다. Database가 primary key, foreign key 같은 integrity constraint를 commit 시점의 current state에서 검사하면 많은 문제는 줄어들지만, 모든 nonserializable execution을 막지는 못한다.

대표 anomaly가 `write skew`다. 두 concurrent transaction이 같은 data item들을 읽고, 서로 다른 data item을 쓴다. Write-write conflict가 없으므로 snapshot isolation validation은 둘 다 commit시킬 수 있지만, 두 transaction이 서로 상대가 쓰기 전 version을 읽었기 때문에 precedence graph에는 cycle이 생긴다.

![Figure 18.20](@/assets/images/cs-database-283-figure-18-20-page-905.png)
*Figure 18.20 · PDF p. 905 · snapshot isolation에서 허용될 수 있는 nonserializable write skew schedule*

Figure 18.20에서는 `Ti`와 `Tj`가 모두 `A`, `B`를 읽고, `Ti`는 `A=B`를 write하며, `Tj`는 `B=A`를 write한다. 두 transaction은 서로 다른 item을 update하므로 update conflict가 없다. 그러나 결과는 `A`와 `B`의 값을 swap하는 상태가 되며, 어떤 serial order에서도 이 결과는 나오지 않는다.

Write skew는 실무 제약에서도 나타난다. 예를 들어 checking과 savings의 합이 음수가 되면 안 된다는 constraint를 각 transaction이 자기 snapshot에서만 검사하면, 하나는 checking에서 출금하고 다른 하나는 savings에서 출금하여 최종 합이 음수가 될 수 있다. 또 maximum bill number를 읽어 `max+1`로 새 번호를 만드는 두 transaction이 동시에 실행되면, 같은 번호를 만들 수 있다. 이는 predicate read와 insert가 충돌하는 `phantom phenomenon`의 한 형태다.

Snapshot isolation의 serializability 문제는 항상 치명적이지는 않다. Course enrollment limit이 아주 드물게 1명 초과되는 정도는 감수할 수 있는 application도 있다. 하지만 financial application처럼 불일치를 용납할 수 없는 환경에서는 해결책이 필요하다.

주요 해결책은 다음과 같다.

- `serializable snapshot isolation(SSI)`: snapshot isolation을 확장해 serializability를 보장한다.
- Transaction별 isolation level 혼합: long read-only transaction은 snapshot isolation, update transaction은 serializable isolation으로 실행한다.
- SQL `for update`: read한 data를 concurrency-control 관점에서 update한 것처럼 취급하게 하여 artificial conflict를 만든다.

SSI의 핵심은 snapshot isolation이 놓치는 `read-write conflict`를 추적하는 것이다. 어떤 transaction `T1`이 object의 새 version을 쓰고, concurrent transaction `T2`가 그보다 이전 version을 읽으면 `T2 -> T1` read-write conflict edge가 생긴다. Snapshot isolation에서 nonserializable schedule이 가능하려면 어떤 transaction이 incoming read-write edge와 outgoing read-write edge를 모두 가지는 위험 구조가 있어야 한다. SSI는 이런 구조를 감지하면 관련 transaction 중 하나를 rollback한다. 전체 precedence graph cycle을 모두 추적하는 것보다 싸지만, 불필요한 rollback은 생길 수 있다.

`for update`는 application programmer가 특정 select 결과를 update 대상으로 취급하게 하는 방법이다.

```sql
select *
from instructor
where ID = 22222
for update;
```

Write skew 예시에서 `A`, `B`를 읽는 select에 `for update`를 붙이면 두 transaction이 모두 `A`, `B`를 update한 것처럼 보이므로 둘 중 하나만 commit할 수 있다. 단, 어떤 conflict를 인위적으로 넣어야 하는지는 transaction 집합을 미리 알고 있을 때 분석 가능하다. Ad hoc transaction이 자유롭게 들어오는 application에서는 이런 사전 분석이 어렵다.

### 18.9 Weak Levels of Consistency in Practice

SQL standard는 `serializable`, `repeatable read`, `read committed`, `read uncommitted` 같은 isolation level을 정의한다. 실제 system은 serializability보다 약한 consistency level을 성능과 실용성 때문에 사용하기도 한다.

#### 18.9.1 Degree-Two Consistency

`degree-two consistency`의 목적은 serializability까지 보장하지는 않더라도 `cascading abort`를 피하는 것이다. Lock mode는 S와 X를 사용하지만, two-phase behavior는 요구하지 않는다. Transaction은 data item에 접근할 때 적절한 lock을 보유해야 하지만, S lock은 언제든 해제할 수 있고 이후 새 lock도 얻을 수 있다. X lock만 commit 또는 abort까지 유지한다.

이 protocol에서는 uncommitted value를 읽지 않으므로 cascading abort는 피한다. 하지만 S lock을 일찍 풀 수 있으므로 같은 transaction이 같은 item을 두 번 읽어 다른 값을 볼 수 있다. 따라서 `read committed isolation level`의 한 구현으로 볼 수 있다.

![Figure 18.21](@/assets/images/cs-database-284-figure-18-21-page-909.png)
*Figure 18.21 · PDF p. 909 · degree-two consistency에서 가능한 nonserializable schedule*

Degree-two consistency에서 index scan은 특히 주의가 필요하다. Scan 중 concurrent update가 index entry를 old key에서 new key로 옮기면, scan이 old 위치를 update 후에 보고 new 위치를 update 전에 보아 tuple을 아예 못 볼 수 있다. 반대로 old 위치를 update 전에 보고 new 위치를 update 후에 보면 같은 logical tuple의 두 version을 볼 수도 있다. 2PL을 사용하면 이런 문제가 생기지 않는다.

#### 18.9.2 Cursor Stability

`cursor stability`는 cursor로 relation tuple을 순회하는 program을 위한 degree-two consistency 변형이다. 현재 cursor가 처리 중인 tuple은 S lock으로 보호하고, 처리 후에는 lock을 해제할 수 있다. Modified tuple은 X lock을 commit까지 유지한다.

이 방식은 heavily accessed relation에서 concurrency와 성능을 높이는 데 쓰일 수 있지만, 2PL이 아니므로 serializability는 보장하지 않는다. Application은 nonserializable schedule 가능성을 감안해 consistency가 깨지지 않도록 작성되어야 한다. Snapshot isolation을 사용할 수 있다면, cursor stability보다 비슷하거나 더 높은 concurrency를 제공하면서 anomaly 위험을 줄이는 경우가 많다.

#### 18.9.3 Concurrency Control Across User Interactions

일반 concurrency-control protocol은 transaction이 사용자 입력을 기다리지 않는다고 가정한다. 하지만 좌석 선택처럼 사용자가 화면을 보고 선택을 확정할 때까지 시간이 걸리는 workflow가 있다. 이 전체 과정을 하나의 DB transaction으로 묶고 2PL을 쓰면, 사용자가 고민하거나 창을 닫아버리는 동안 좌석 집합이 lock되어 다른 update가 막힌다.

Timestamp protocol이나 validation protocol은 lock waiting은 피하지만, 다른 사용자가 같은 항공편의 좌석 정보를 조금이라도 update하면 실제 선택 좌석이 다르더라도 transaction을 abort시킬 수 있다. Snapshot isolation은 같은 좌석을 선택하지 않는 한 abort하지 않으므로 이런 상황에 비교적 적합하다. 다만 long-duration transaction이 있으면 이미 commit된 다른 transaction의 update 정보를 오래 보관해야 하는 부담이 있다.

실무 대안은 user interaction을 spanning하지 않도록 transaction을 나누는 것이다. 첫 transaction은 좌석 가능 상태를 읽고, 두 번째 transaction은 사용자가 고른 좌석을 실제 배정한다. 두 번째 transaction은 반드시 “그 사이 다른 사용자가 그 좌석을 배정하지 않았는지”를 확인한 뒤 update해야 한다. 그렇지 않으면 `lost update`가 생긴다.

이를 일반화한 방식이 tuple에 `version number` attribute를 두는 `optimistic concurrency control without read validation`이다. Tuple 생성 시 version number를 0으로 초기화하고, transaction이 update하려는 tuple을 처음 읽을 때 그 version을 기억한다. Commit processing 때 각 updated tuple의 현재 version number가 처음 읽은 version과 같은지 atomic하게 검사한다. 같으면 update하고 version number를 1 증가시킨다. 다르면 transaction을 abort한다.

이 version check는 snapshot isolation의 `first-committer-wins`와 매우 비슷하며, transaction이 오래 살아 있어도 사용할 수 있다. 하지만 읽은 모든 tuple이 같은 database snapshot에 속한다는 보장은 없고, read validation도 기본적으로 하지 않는다. 따라서 serializability는 보장하지 않는다. Read version까지 commit 시점에 검증하면 앞서 본 optimistic validation scheme과 같아진다.

### 18.10 Advanced Topics in Concurrency Control

일반적인 2PL만으로는 index structure, main-memory database, long-duration transaction, operation-level update처럼 특수한 상황에서 concurrency가 지나치게 낮아질 수 있다. 이 절은 correctness를 유지하면서도 lock duration이나 conflict 단위를 다르게 잡는 기법들을 다룬다.

#### 18.10.1 Online Index Creation

대용량 relation에서 index creation은 몇 시간 또는 며칠이 걸릴 수 있다. Index를 만드는 동안 relation update를 전부 막으면 consistency는 쉽지만 availability가 크게 떨어진다. 그래서 DBMS는 보통 `online index creation`을 지원한다.

Online index creation의 흐름은 다음과 같다.

1. Relation snapshot을 얻고 그 snapshot으로 index를 만든다. Snapshot 이후 relation update는 log에 기록한다.
2. Snapshot 기반 index가 완성되면 아직 최신 relation과 다르므로, update log를 index에 적용한다. 이 동안에도 relation update는 계속 발생할 수 있다.
3. 마지막 catch-up 단계에서 relation에 S lock을 얻어 추가 update를 잠시 막고, 남은 log를 모두 적용한다. 이제 index와 relation이 consistent하므로 relation metadata에 새 index 존재를 기록하고 lock을 해제한다.

Materialized view를 즉시 유지하는 경우도 비슷하게 online construction을 적용할 수 있다. View definition query를 snapshot에서 실행하고, 이후 update를 log로 모아 반영한 뒤, 마지막에 잠깐 lock을 잡고 catch-up한다. Schema change도 같은 사고방식이 쓰인다. Attribute 추가/삭제는 tuple version number로 background 적용할 수 있고, constraint 추가는 snapshot 검사와 update log 검사를 결합한다.

#### 18.10.2 Concurrency in Index Structures

Index는 매우 자주 접근되므로 일반 database object처럼 2PL을 적용하면 contention이 심해진다. Index concurrency control의 목표는 “index 자체의 concurrent operation이 operation-serializable하면서, index lookup이 올바른 tuple 집합을 반환하게 하는 것”이다. Index 내부 구조가 중간에 바뀌어도 lookup 결과가 정확하면 된다.

`operation serializability`는 concurrent index operation들의 결과와 최종 index state가 어떤 serial order의 operation 실행과 일치하는 성질이다. 여기서 중요한 점은 database transaction 전체의 serializability와 index operation의 internal correctness를 분리해 생각한다는 것이다.

`crabbing protocol`은 B+-tree에 대한 대표 기법이다.

- Search: root를 S lock으로 잡고, 내려갈 child에 S lock을 잡은 뒤 parent lock을 해제한다. leaf에 도달할 때까지 반복한다.
- Insert/delete: leaf까지는 search와 같이 S lock으로 내려간다. Leaf에서 X lock을 얻어 insert/delete를 수행한다. Split, coalesce, redistribution이 필요하면 parent를 X lock으로 잡고 조정한다. 조정이 위로 전파되면 parent lock을 유지한 채 같은 방식으로 진행한다.

이 lock은 transaction 끝까지 유지되는 2PL lock이 아니라 짧은 기간만 shared data structure의 mutual exclusion을 위해 쓰이는 `latch`에 가깝다. Search가 내려가는 흐름과 split이 올라가는 흐름 사이에 deadlock이 생길 수 있지만, search operation의 lock을 해제하고 root부터 restart하면 처리할 수 있다.

`B-link tree`는 더 높은 concurrency를 위해 각 node가 right sibling pointer를 유지하는 B+-tree 변형이다. Lookup 중 node split이 일어나면 현재 node뿐 아니라 오른쪽 sibling도 확인해야 할 수 있기 때문이다. B-link-tree locking protocol은 한 번에 internal node 하나만 lock하고, child나 parent lock을 요청하기 전에 현재 node lock을 해제한다. 이 때문에 parent-child 관계가 중간에 바뀌는 anomaly가 가능하지만, protocol이 이를 감지하고 처리하여 operation serializability를 유지하면서 deadlock을 피한다.

Phantom을 막는 index locking도 더 세밀하게 만들 수 있다. 18.4.3의 leaf-node locking은 leaf 전체를 잠가 false conflict가 많다. `key-value locking`은 개별 key value에 lock을 걸어 concurrency를 높인다. 하지만 단순 key-value locking은 range 사이에 새 key가 들어오는 phantom을 막지 못한다. 그래서 `next-key locking`은 lookup range 안의 key뿐 아니라 range 직후의 next-key value도 lock한다. Insert/delete도 대상 key뿐 아니라 next-key value를 lock하여 range lookup과 실제 lock conflict가 생기게 한다.

#### 18.10.3 Concurrency Control in Main-Memory Databases

Disk-based database에서는 I/O cost가 커서 concurrency-control overhead가 상대적으로 덜 보인다. Main-memory database에서는 data가 memory에 있어 index operation이 매우 빠르기 때문에, lock/latch 획득 비용 자체가 병목이 될 수 있다.

한 가지 선택은 coarse granularity latch다. In-memory index operation이 매우 짧다면 index 전체를 하나의 latch로 잠그고 operation을 수행한 뒤 바로 해제하는 편이, node별 latch보다 오히려 빠를 수 있다. Concurrency는 조금 줄지만 latch overhead 감소가 더 클 수 있다.

다른 선택은 `latch-free data structure`다. 이는 latch 없이 atomic instruction으로 concurrent operation을 처리한다. 대표 primitive는 `compare-and-swap(CAS)`이다. `CAS(var, oldval, newval)`은 `var == oldval`인지 atomically 검사하고, 맞으면 `var = newval`로 바꾸며 success를 반환한다. 아니면 failure를 반환한다.

![Figure 18.23](@/assets/images/cs-database-287-figure-18-23-page-918.png)
*Figure 18.23 · PDF p. 918 · CAS를 이용한 latch-free linked-list insertion/deletion*

Latch-free insert는 두 process가 같은 old `head`를 읽어도 하나의 CAS만 성공하고, 실패한 쪽은 새 head를 읽어 retry하므로 lost insert를 막는다. 하지만 deletion에는 `ABA problem`이 생길 수 있다. 어떤 pointer가 `A`였다가 `B`로 바뀌고 다시 `A`가 되면, CAS는 값이 같다고 보고 성공하지만 실제 list 구조는 달라졌을 수 있다. 해결책 중 하나는 pointer와 함께 counter를 저장하고 pointer update마다 counter를 증가시켜 `(pointer, counter)` 쌍에 CAS를 적용하는 것이다.

Hash index, search tree, queue 같은 더 복잡한 latch-free structure도 가능하지만 race condition bug가 매우 어렵다. 실무에서는 직접 만들기보다 standard library의 lock-free data structure를 사용하는 것이 안전하다.

#### 18.10.4 Long-Duration Transactions

Long-duration transaction은 사용자 상호작용이나 설계 작업처럼 사람이 개입해 오래 지속되는 transaction이다. 일반 short transaction과 다른 문제가 생긴다.

- `long duration`: 사람의 응답 시간은 컴퓨터 기준으로 매우 길며, 설계 작업은 시간/일 단위가 될 수 있다.
- `exposure of uncommitted data`: 사용자에게 보여준 결과는 아직 commit되지 않았을 수 있고, 협업에서는 commit 전 데이터 교환이 필요할 수 있다.
- `subtasks`: 사용자는 전체 transaction이 아니라 일부 subtask만 취소하고 싶을 수 있다.
- `recoverability`: crash 때문에 긴 작업 전체를 abort시키면 안 되고, 최근 상태로 복구해야 한다.
- `performance`: throughput보다 human response time과 예측 가능한 응답 시간이 중요하다.

Snapshot isolation과 optimistic concurrency control without read validation은 부분적인 해결책이다. 하지만 transaction이 길수록 conflicting update 가능성이 커져 wait나 abort가 늘어난다. 그래서 long-duration transaction에서는 serializability 하나만 기준으로 삼기보다 application-specific correctness와 recovery 개념을 고려한다.

#### 18.10.5 Concurrency Control with Operations

`concurrency control with operations`는 conflict 단위를 read/write가 아니라 application-level operation으로 올린다. 어떤 operation들은 read/write 관점에서는 conflict처럼 보여도, operation 의미상 commute하거나 consistency constraint를 유지할 수 있다.

![Figure 18.24](@/assets/images/cs-database-288-figure-18-24-page-920.png)
*Figure 18.24 · PDF p. 920 · conflict serializable하지 않지만 A+B 합을 보존하는 schedule*

Figure 18.24의 bank schedule은 conflict serializable하지 않지만 `A+B` 합을 보존한다. 이 예시는 correctness가 database의 consistency constraint와 transaction operation의 성질에 의존한다는 점을 보여준다.

Materialized view maintenance가 대표 사례다. `daily_sales_total(date, total_amount)` 같은 view는 많은 sales transaction이 같은 total tuple을 update한다. 일반 2PL로 같은 tuple을 X lock하면 concurrency가 낮다. 하지만 각 transaction이 total 값을 볼 필요 없이 `increment(v, n)`만 수행한다면, 여러 increment는 서로 commute한다. 두 increment의 순서가 바뀌어도 최종 합은 같다.

Rollback도 operation 의미로 처리한다. `increment(v, n)`을 되돌리려면 `increment(v, -n)`을 수행한다. 이런 반대 연산을 `compensating operation`이라고 한다. 단, materialized view를 읽는 transaction은 concurrent increment와 conflict한다. 읽는 값이 increment가 serialize되기 전인지 후인지에 따라 달라지기 때문이다.

이를 lock mode로 표현하려면 `increment lock(I)`을 둘 수 있다. I lock은 I lock끼리는 compatible하지만 S/X lock과는 incompatible하다.

![Figure 18.25](@/assets/images/cs-database-289-figure-18-25-page-922.png)
*Figure 18.25 · PDF p. 922 · increment lock mode를 포함한 compatibility matrix*

B+-tree insert도 operation-level recovery로 볼 수 있다. Insert가 여러 index node를 바꾼 뒤 다른 transaction이 다시 그 node를 읽거나 수정했더라도, rollback은 “이전 tree 모양으로 정확히 되돌리기”가 아니라 inserted record를 delete하는 compensating action으로 충분할 수 있다. 결과 tree는 원래 구조와 다를 수 있지만 correct B+-tree이면 된다.

Operation locking은 serializability를 보장하도록 설계될 수도 있지만, 일부 real-world application은 serializability 손실을 감수하고 concurrency를 높인다. 예를 들어 ticket booking에서 `increment_conditional(avail_tickets, -3)`는 결과가 음수가 되지 않을 때만 감소시키고 success/failure를 반환한다. 이 operation은 동시에 실행된 순서에 따라 어느 transaction이 성공하는지가 달라지므로 단순 increment처럼 compatible하지 않다. 그래도 short-term lock으로 operation만 atomic하게 수행하고 바로 풀면 concurrency는 크게 높아진다. 결제 실패 시에는 `+3` compensating operation으로 되돌린다.

#### 18.10.6 Real-Time Transaction Systems

`real-time transaction system`은 consistency뿐 아니라 deadline도 correctness의 일부다. Deadline은 세 종류로 구분된다.

| Deadline | 의미 |
|---|---|
| `hard deadline` | deadline을 넘기면 system crash 같은 심각한 문제가 생길 수 있다. |
| `firm deadline` | deadline 이후 완료된 결과는 가치가 0이다. |
| `soft deadline` | 늦을수록 가치가 감소해 0에 가까워진다. |

Concurrency-control protocol이 transaction을 wait시키면 deadline miss가 생길 수 있다. 이때 lock을 가진 transaction을 preempt하고 deadline이 빠른 transaction을 진행시키는 선택이 나을 수도 있다. 하지만 preempted transaction이 rollback/restart 비용 때문에 자기 deadline을 놓칠 수도 있어, wait와 rollback 중 무엇이 더 나은지 판단하기 어렵다.

Real-time constraint가 강하면 disk delay의 variance를 피하기 위해 main-memory database가 자주 쓰인다. 그래도 lock wait, abort, restart 때문에 execution time variance는 남는다. 연구 결과로는 deadline이 빠른 transaction에 priority를 주는 locking protocol과 optimistic concurrency protocol이 제안되었고, optimistic protocol이 missed deadline을 줄이는 경우가 많다.

### 18.11 Summary

Chapter 18의 결론은 다음 흐름으로 정리할 수 있다.

- `concurrency-control scheme`은 concurrent transaction 사이의 interaction을 제어하여 consistency와 isolation을 지킨다.
- `locking protocol`, `timestamp-ordering scheme`, `validation technique`, `multiversion scheme`은 모두 operation을 delay하거나 transaction을 abort하여 serializability를 확보한다.
- `two-phase locking protocol`은 `conflict serializability`를 보장하지만 deadlock-free는 아니다. `strict 2PL`은 recoverability와 cascadelessness를 위해 X lock을 끝까지 유지하고, `rigorous 2PL`은 모든 lock을 끝까지 유지한다.
- Deadlock은 ordered locking, wait-die, wound-wait, timeout 등으로 예방하거나, `wait-for graph` cycle detection과 victim rollback으로 처리한다.
- `multiple-granularity locking`은 root-to-leaf lock acquisition, leaf-to-root unlock, `intention lock`으로 큰 단위와 작은 단위 lock을 조합한다.
- `timestamp-ordering protocol`은 transaction timestamp가 serialization order를 정하고, 위반 시 rollback한다.
- `validation-based protocol`은 conflict가 드문 read-heavy workload에서 optimistic하게 실행한 뒤 validation test로 serializability를 확인한다.
- `multiversion concurrency control`은 write마다 새 version을 만들고 read가 적절한 version을 고르게 하여 read가 wait하지 않도록 한다.
- `snapshot isolation`은 실무에서 널리 쓰이는 multiversion validation protocol이지만 기본형은 serializability를 보장하지 않는다. `write skew`, phantom 계열 anomaly를 막으려면 `serializable snapshot isolation`, stronger isolation, 또는 `for update` 같은 artificial conflict가 필요하다.
- `phantom phenomenon`은 predicate read와 insert/update/delete의 logical conflict가 tuple-level lock으로 드러나지 않는 문제이며, index-locking, next-key locking, predicate locking으로 다룬다.
- Weak consistency level인 `degree-two consistency`, `cursor stability`, application-level version check는 성능과 사용자 상호작용을 위해 쓰이지만 nonserializable execution 가능성을 application이 이해해야 한다.
- Index, main-memory database, operation-level concurrency control은 일반 read/write lock보다 세밀하거나 의미 기반의 기법을 사용해 bottleneck을 줄인다.

## 용어 회수

`concurrency control`, `shared-mode lock(S)`, `exclusive-mode lock(X)`, `compatibility`, `legal schedule`, `two-phase locking protocol`, `growing phase`, `shrinking phase`, `lock point`, `strict two-phase locking`, `rigorous two-phase locking`, `lock conversion`, `upgrade`, `downgrade`, `tree protocol`, `commit dependency`, `deadlock`, `starvation`, `wait-die scheme`, `wound-wait scheme`, `wait-for graph`, `total rollback`, `partial rollback`, `multiple granularity`, `explicit lock`, `implicit lock`, `intention-shared(IS)`, `intention-exclusive(IX)`, `shared and intention-exclusive(SIX)`, `W-timestamp(Q)`, `R-timestamp(Q)`, `timestamp-ordering protocol`, `Thomas' write rule`, `view serializability`, `blind write`, `validation-based protocol`, `StartTS`, `ValidationTS`, `FinishTS`, `multiversion timestamp ordering`, `multiversion two-phase locking`, `snapshot isolation`, `lost update`, `first committer wins`, `first updater wins`, `write skew`, `select for update`, `phantom phenomenon`, `index-locking protocol`, `predicate locking`, `degree-two consistency`, `cursor stability`, `optimistic concurrency control without read validation`, `conversation`, `crabbing protocol`, `B-link tree`, `next-key locking`, `latch-free data structure`, `compare-and-swap(CAS)`, `ABA problem`, `increment lock`, `compensating operation`, `real-time transaction system`.
