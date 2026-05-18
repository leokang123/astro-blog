---
title: "Chapter 17. Transactions"
order: 17
pubDatetime: 2026-05-17T00:17:00+09:00
modDatetime: 2026-05-17T00:17:00+09:00
description: "Database System Concepts 정리: Chapter 17. Transactions"
tags:
  - "Database"
  - "CS"
---

## 개요

`transaction`은 여러 database operations를 사용자의 관점에서 하나의 logical unit of work처럼 보이게 하는 실행 단위다. 은행 계좌 이체를 예로 들면, 고객에게는 "checking account에서 savings account로 돈을 옮긴다"는 한 동작이지만 DBMS 내부에서는 여러 `read`, `write`, arithmetic operation이 순서대로 실행된다. 일부만 실행되고 실패하면 돈이 사라지거나 새로 생긴 것처럼 보일 수 있으므로, DBMS는 transaction이 실패와 동시 실행 속에서도 올바르게 보이도록 보장해야 한다.

이 장은 transaction processing의 기본 개념을 잡는 장이다. Concurrent transaction execution의 구체적 제어는 Chapter 18 `Concurrency Control`, failure 이후 복구는 Chapter 19 `Recovery System`으로 이어진다. 따라서 Chapter 17의 핵심은 `ACID properties`, `schedule`, `serializability`, `recoverability`, `isolation levels`, SQL transaction semantics의 기초를 정확히 세우는 것이다.

## 핵심 개념

- `ACID properties`는 `atomicity`, `consistency`, `isolation`, `durability`를 묶은 transaction의 기본 보장이다.
- `atomicity`는 transaction의 효과가 전부 반영되거나 전혀 반영되지 않아야 한다는 all-or-none 성질이다.
- `consistency`는 transaction이 혼자 실행될 때 consistent database를 다시 consistent database로 바꾸어야 한다는 요구다. DBMS integrity constraints가 돕지만, application-dependent consistency는 transaction programmer 책임이다.
- `isolation`은 여러 transactions가 concurrently 실행되어도 각 transaction에게는 다른 transaction이 전후로 serial하게 실행된 것처럼 보여야 한다는 성질이다.
- `durability`는 committed transaction의 updates가 system failure 이후에도 사라지지 않아야 한다는 성질이다.
- `recovery system`은 atomicity와 durability를 담당하고, `concurrency-control system`은 isolation을 담당한다.
- `serializability`는 concurrent schedule이 어떤 serial schedule과 equivalent하면 허용 가능하다는 기준이다.

## 세부 정리

### 17.1 Transaction Concept

`transaction`은 data items를 access하고 필요하면 update하는 program execution unit이다. 보통 user program이 SQL이나 Java/C++ 같은 언어, 또는 `JDBC`, `ODBC`를 통해 database access를 수행하면서 transaction을 시작한다. Conceptually transaction은 `begin transaction`과 `end transaction` 사이의 모든 operations로 구성된다.

Transaction이 필요한 이유는 database가 "실세계의 일관된 상태"를 표현해야 하기 때문이다. 계좌 이체 중 checking account에서는 돈을 빼고 savings account에는 아직 더하지 않은 순간은 내부적으로는 있을 수 있다. 하지만 그 상태가 다른 transaction에게 보이거나 failure 후 database에 남으면 안 된다.

ACID를 이 장의 맥락에 맞게 다시 쓰면 다음과 같다.

| 성질 | 핵심 의미 | 담당/주의 |
|---|---|---|
| `Atomicity` | transaction의 모든 operations가 database에 반영되거나 none | failure 시 partial effects를 undo해야 하며 `recovery system`이 담당 |
| `Consistency` | transaction이 isolation 상태로 실행되면 database consistency를 보존 | primary key, referential integrity, check constraints 외의 application constraints는 programmer 책임 |
| `Isolation` | concurrent execution 중에도 각 transaction은 다른 transaction과 격리된 것처럼 보임 | `concurrency-control system`이 담당하며 성능과 trade-off가 큼 |
| `Durability` | commit 이후의 changes는 system failure 후에도 persist | stable storage와 log/recovery가 핵심 |

Strict isolation은 성능을 떨어뜨릴 수 있다. 그래서 실제 DBMS는 나중에 `isolation levels`를 제공해 application이 correctness와 concurrency 사이에서 trade-off를 선택하게 한다.

### 17.2 A Simple Transaction Model

SQL은 너무 풍부하므로, 원문은 transaction의 본질을 설명하기 위해 단순 모델을 먼저 쓴다. Data item은 이름이 있는 하나의 numeric value이고, 실제 data operation은 `read(X)`와 `write(X)`뿐이라고 가정한다. `insert`와 `delete`는 Chapter 18의 더 현실적인 concurrency control에서 다시 다룬다.

| operation | 의미 |
|---|---|
| `read(X)` | database의 data item `X`를 transaction의 main-memory buffer 안 변수 `X`로 가져옴 |
| `write(X)` | transaction buffer의 변수 `X` 값을 database의 data item `X`에 반영 |

실제 DBMS에서 `write(X)`가 곧바로 disk update를 의미하지는 않는다. Buffer에 임시 저장되었다가 나중에 disk에 기록될 수 있다. 하지만 이 단순 모델에서는 우선 write가 database를 즉시 update한다고 가정하고, storage와 disk write timing은 Chapter 19에서 정교하게 다룬다.

계좌 `A`에서 `B`로 50달러를 이체하는 transaction `Ti`는 다음과 같다.

```text
Ti:
  read(A)
  A := A - 50
  write(A)
  read(B)
  B := B + 50
  write(B)
```

이 예시는 ACID가 각각 왜 필요한지 보여준다.

- `Consistency`: 실행 전후에 `A + B`가 같아야 한다. 이 transfer logic이 잘못 작성되어 돈을 만들거나 없애면 consistency를 깨뜨린다.
- `Atomicity`: `write(A)` 후 `write(B)` 전에 failure가 나면 `A=950`, `B=2000`처럼 50달러가 사라진다. DBMS는 old values를 `log`에 기록하고, abort 시 log에서 복원해 transaction이 없었던 것처럼 만들어야 한다.
- `Durability`: transaction 완료를 사용자에게 알린 뒤에는 system crash가 나도 이체 결과가 사라지면 안 된다. Updates 자체 또는 updates를 재구성할 충분한 정보가 stable storage에 있어야 한다.
- `Isolation`: transfer 중간의 inconsistent state를 다른 transaction이 읽어 `A + B`를 계산하면 잘못된 결과를 얻는다. 동시에 실행하더라도 어떤 serial order로 실행한 것과 equivalent해야 한다.

### 17.3 Storage Structure

Atomicity와 durability를 이해하려면 storage failure 특성을 구분해야 한다.

| storage type | failure 이후 데이터 | 예 | transaction 관점 |
|---|---|---|---|
| `volatile storage` | system crash 때 보통 사라짐 | main memory, cache memory | 빠르지만 crash recovery의 근거로 삼을 수 없음 |
| `non-volatile storage` | system crash는 견디지만 media failure 가능 | magnetic disk, flash storage, optical media, tape | disk에 썼다고 해도 device failure까지 완전히 막지는 못함 |
| `stable storage` | 이론적으로 정보가 절대 사라지지 않는 저장소 | 실제로는 여러 non-volatile media에 replication해 근사 | log와 committed data가 의존하는 이상적 abstraction |

`stable storage`는 물리적으로 완벽히 만들 수 없지만, independent failure modes를 가진 여러 disk에 정보를 복제하면 data loss probability를 매우 낮출 수 있다. RAID controller의 battery-backed memory처럼 실제 시스템에서는 volatile/non-volatile 경계가 흐려질 수도 있다.

Transaction durability를 보장하려면 committed changes 또는 그 changes를 redo할 정보가 stable storage에 있어야 한다. Atomicity를 보장하려면 database page를 disk에 쓰기 전에 old value를 담은 log records가 stable storage에 있어야 한다. 이 원칙이 Chapter 19의 `write-ahead logging`으로 이어진다.

### 17.4 Transaction Atomicity and Durability

성공적으로 끝나지 못한 transaction을 `aborted` transaction이라고 한다. Atomicity를 지키려면 aborted transaction이 database state에 아무 효과도 남기면 안 된다. Aborted transaction의 changes를 되돌리는 과정을 `rollback`이라고 한다.

일반적인 방법은 `log`를 유지하는 것이다. Transaction이 database item을 modify할 때마다 DBMS는 먼저 다음 정보를 log에 기록한다.

| log record에 필요한 정보 | 이유 |
|---|---|
| transaction identifier | 어떤 transaction의 modification인지 식별 |
| data item identifier | 어떤 item이 바뀌었는지 식별 |
| old value | abort 또는 failure 중 atomicity를 위해 undo 가능 |
| new value | durability 또는 failure 후 redo 가능 |

그 다음에 database 자체를 modify한다. 이 구조 덕분에 failure 시 old value로 `undo`하거나, committed update를 new value로 `redo`할 수 있다.

Transaction이 정상적으로 실행을 끝내면 `committed` 상태가 된다. Commit된 update는 database를 새 consistent state로 바꾸며, system failure 후에도 남아야 한다. Commit 이후 transaction 자체를 abort해서 효과를 없앨 수는 없다. 이미 commit된 transaction의 효과를 논리적으로 취소하려면 사용자가 별도의 `compensating transaction`을 작성해야 한다. 예를 들어 잘못 20달러를 더했다면, 20달러를 빼는 새 transaction이 보상 동작이다.

Transaction state는 다음 흐름으로 이해하면 된다.

![Figure 17.1](@/assets/images/cs-database-248-figure-17-1-page-835.png)
*Figure 17.1 · PDF p. 835 · active에서 committed/aborted까지의 transaction state diagram*

| state | 의미 |
|---|---|
| `Active` | initial state, transaction이 실행 중 |
| `Partially committed` | final statement는 끝났지만 commit 보장이 아직 완료되지 않음 |
| `Failed` | 정상 실행을 더 진행할 수 없음 |
| `Aborted` | rollback이 끝나 database가 transaction 시작 전 상태로 복구됨 |
| `Committed` | commit에 필요한 정보가 안정적으로 기록되어 성공 완료 |

`partially committed`가 별도로 필요한 이유는 final statement가 실행되었다고 durability가 보장되는 것은 아니기 때문이다. Output이 아직 main memory에만 있으면 crash 때 사라질 수 있다. DBMS는 failure 후에도 updates를 재구성할 충분한 정보를 disk/stable storage에 기록한 뒤에야 transaction을 `committed`로 만든다.

Rollback이 끝나 `aborted` state에 들어간 transaction에 대해 DBMS는 두 가지 선택을 할 수 있다.

| 선택 | 언제 쓰는가 |
|---|---|
| `restart` | hardware/software error처럼 transaction 내부 logic이 만든 문제가 아닌 이유로 abort된 경우. Restart된 transaction은 새 transaction으로 간주 |
| `kill` | application logic error, 잘못된 input, 필요한 data 부재처럼 다시 실행해도 해결되지 않는 경우 |

`observable external writes`는 특별히 조심해야 한다. 화면 출력, email 전송, ATM 현금 지급처럼 database 밖에서 관찰된 효과는 rollback으로 지울 수 없다. 보통 DBMS/application은 transaction이 `committed` state에 들어간 뒤에만 이런 external write를 수행하게 한다. 구현상으로는 external write에 필요한 값을 database 안의 special relation에 임시 저장하고, commit 후 실제 external action을 수행할 수 있다.

하지만 모든 외부 동작을 단순히 재시도할 수 있는 것은 아니다. ATM에서 cash를 dispense하기 직전에 system failure가 났다면 restart 후 사용자가 떠난 상태에서 돈을 내보내는 것은 말이 되지 않는다. 이런 경우에는 현금 지급을 취소하는 대신 계좌에 다시 입금하는 `compensating transaction` 같은 application-level 처리 전략이 필요하다. Web booking도 마찬가지로, commit 직후 application server나 network가 끊겨 사용자가 결과를 못 봤을 수 있으므로, 재접속 시 transaction 성공 여부를 확인할 수 있게 설계해야 한다.

### 17.5 Transaction Isolation

DBMS가 transactions를 serial하게만 실행하면 isolation 문제는 단순해진다. 하지만 실제 transaction-processing system은 보통 여러 transactions를 concurrently 실행한다. 이유는 두 가지다.

| concurrent execution의 이점 | 설명 |
|---|---|
| improved throughput and resource utilization | 한 transaction이 disk I/O를 기다리는 동안 다른 transaction이 CPU를 사용할 수 있다. CPU와 여러 disks의 parallelism을 활용해 단위 시간당 처리 transaction 수를 늘린다 |
| reduced waiting time | 긴 transaction 하나 때문에 짧은 transaction이 오래 기다리는 상황을 줄이고, average response time을 낮춘다 |

이 동기는 운영체제의 `multiprogramming`과 같다. 문제는 각 transaction이 개별적으로는 consistency를 보존해도, operations가 interleaving되면 전체 database consistency가 깨질 수 있다는 점이다. DBMS는 이를 막기 위해 `concurrency-control schemes`를 사용한다. Chapter 17에서는 구체적 protocol보다, 어떤 concurrent execution이 correct한지 판단하는 개념을 먼저 세운다.

원문은 두 transaction을 사용한다.

```text
T1: transfer $50 from A to B
  read(A)
  A := A - 50
  write(A)
  read(B)
  B := B + 50
  write(B)

T2: transfer 10 percent of A from A to B
  read(A)
  temp := A * 0.1
  A := A - temp
  write(A)
  read(B)
  B := B + temp
  write(B)
```

초기값이 `A = 1000`, `B = 2000`이라고 하자. Serial execution에는 최소 두 가지가 있다.

| serial schedule | 실행 순서 | 최종 결과 | consistency |
|---|---|---|---|
| schedule 1 | `T1` followed by `T2` | `A = 855`, `B = 2145` | `A + B = 3000` 보존 |
| schedule 2 | `T2` followed by `T1` | `A = 850`, `B = 2150` | `A + B = 3000` 보존 |

`schedule`은 여러 transactions의 instructions가 system에서 실제로 실행된 chronological order를 추상화한 것이다. 유효한 schedule은 각 transaction 내부 instruction order를 보존해야 한다. 예를 들어 `T1` 안에서 `write(A)`는 반드시 `read(B)`보다 앞에 있어야 한다. 또한 원문 schedule은 transaction이 `committed` state에 들어갔음을 나타내기 위해 `commit` operation도 포함한다.

`serial schedule`은 각 transaction의 instructions가 끊기지 않고 한 덩어리로 나타나는 schedule이다. `n`개 transactions가 있으면 가능한 serial schedules는 `n!`개다. Concurrent execution에서는 operating system의 context switch 때문에 여러 transactions의 instructions가 interleaving될 수 있고, 가능한 schedule 수는 serial schedule 수보다 훨씬 많다. 따라서 isolation의 핵심 질문은 "interleaving된 schedule이 어떤 serial schedule과 같은 효과를 내는가"가 된다.

다음 Figure 17.4는 interleaving된 schedule이더라도 schedule 1, 즉 `T1` followed by `T2`와 같은 final state를 만들 수 있음을 보여준다. 이런 schedule은 concurrent schedule이지만 correct하다.

![Figure 17.4](@/assets/images/cs-database-251-figure-17-4-page-841.png)
*Figure 17.4 · PDF p. 841 · schedule 1과 equivalent한 concurrent schedule 3*

반대로 모든 interleaving이 안전한 것은 아니다. Figure 17.5의 schedule 4는 최종값이 `A = 950`, `B = 2100`이 되어 `A + B = 3050`이 된다. 두 transactions가 각각 의도한 transfer logic은 맞지만, interleaving 때문에 50달러가 생긴 것처럼 database가 inconsistent state가 된다.

![Figure 17.5](@/assets/images/cs-database-252-figure-17-5-page-842.png)
*Figure 17.5 · PDF p. 842 · concurrent execution이 inconsistent state를 만드는 schedule 4*

이 때문에 DBMS는 "OS가 우연히 만든 interleaving"을 그대로 허용하지 않는다. 실행되는 schedule이 어떤 serial schedule과 equivalent한 효과를 내도록 보장해야 하며, 이런 schedule을 `serializable schedule`이라고 한다.

### 17.6 Serializability

`serializability`는 concurrent execution의 correctness 기준이다. Serial schedule은 당연히 serializable이지만, 여러 transactions의 steps가 섞인 schedule이 serializable인지 판단하려면 equivalence 기준이 필요하다. 원문은 transaction 내부의 복잡한 계산 전체를 분석하지 않고, schedule 관점에서 중요한 `read`와 `write`만 고려한다. `commit`은 Section 17.7의 recoverability에서 다시 중요해진다.

#### Conflict and Conflict Equivalence

두 instructions `I`, `J`가 서로 다른 transactions에 속하고 같은 data item `Q`를 access하며, 둘 중 적어도 하나가 `write(Q)`이면 두 instructions는 `conflict`한다.

| instruction pair | conflict 여부 | 이유 |
|---|---|---|
| `read(Q)` / `read(Q)` | 아니오 | 둘 다 같은 값을 읽으므로 순서가 결과에 영향 없음 |
| `read(Q)` / `write(Q)` | 예 | read가 old value를 읽는지, written value를 읽는지가 달라짐 |
| `write(Q)` / `read(Q)` | 예 | read가 어느 write 이후 값을 읽는지가 달라짐 |
| `write(Q)` / `write(Q)` | 예 | 마지막 write가 final value를 결정함 |
| 서로 다른 data items | 아니오 | 같은 data item을 두고 경쟁하지 않음 |

Consecutive instructions가 conflict하지 않으면 둘의 순서를 swap해도 schedule의 효과가 바뀌지 않는다. 어떤 schedule `S`가 nonconflicting swaps의 연속으로 `S'`로 바뀔 수 있으면, 둘은 `conflict equivalent`하다. 그리고 어떤 schedule이 serial schedule과 conflict equivalent하면 `conflict serializable`하다.

Figure 17.4의 schedule 3은 read/write만 남기고 보면, nonconflicting instructions를 여러 번 swap해 serial schedule 1과 같은 형태로 만들 수 있다. 따라서 schedule 3은 `conflict serializable`이다.

#### Precedence Graph and Conflict Serializability Test

`precedence graph`는 schedule이 conflict serializable한지 검사하는 directed graph다. Vertex는 schedule에 참여한 transactions이고, edge `Ti -> Tj`는 `Ti`의 operation이 `Tj`의 conflicting operation보다 먼저 실행되어야 함을 뜻한다.

Edge는 다음 세 경우에 생긴다.

| edge 조건 | 의미 |
|---|---|
| `Ti`의 `write(Q)`가 `Tj`의 `read(Q)`보다 앞섬 | `Tj`가 읽는 값이 `Ti`의 write에 의존할 수 있음 |
| `Ti`의 `read(Q)`가 `Tj`의 `write(Q)`보다 앞섬 | 순서를 바꾸면 `Ti`가 읽는 값이 바뀔 수 있음 |
| `Ti`의 `write(Q)`가 `Tj`의 `write(Q)`보다 앞섬 | final value를 결정하는 write 순서가 바뀔 수 있음 |

Serial schedules의 precedence graph는 cycle이 없다. Figure 17.10은 schedule 1과 schedule 2의 graph를 보여준다. Schedule 1은 `T1 -> T2`, schedule 2는 `T2 -> T1`이라는 한 방향 constraint만 가진다.

![Figure 17.10](@/assets/images/cs-database-257-figure-17-10-page-845.png)
*Figure 17.10 · PDF p. 845 · 두 serial schedules의 precedence graph*

반면 Figure 17.11의 schedule 4는 `T1 -> T2`와 `T2 -> T1`이 동시에 생긴다. `T1`이 `read(A)`를 먼저 하고 `T2`가 `write(A)`를 하므로 `T1 -> T2`가 생기고, `T2`가 `read(B)`를 먼저 하고 `T1`이 `write(B)`를 하므로 `T2 -> T1`이 생긴다. Cycle이 있으므로 schedule 4는 conflict serializable하지 않다.

![Figure 17.11](@/assets/images/cs-database-258-figure-17-11-page-846.png)
*Figure 17.11 · PDF p. 846 · schedule 4의 cycle을 가진 precedence graph*

판정 규칙은 간단하다.

$$
\begin{aligned}
\text{precedence graph에 cycle이 없다} &\Rightarrow \text{conflict serializable} \\
\text{precedence graph에 cycle이 있다} &\Rightarrow \text{not conflict serializable}
\end{aligned}
$$

Cycle이 없으면 graph의 partial order와 일치하는 linear order를 만들 수 있고, 이를 `topological sorting`이라고 한다. 이 linear order가 해당 schedule의 `serializability order`다. Cycle detection은 `depth-first search` 같은 graph algorithm으로 수행할 수 있다.

#### View Serializability

`conflict serializability`는 보수적인 기준이다. 어떤 schedules는 실제 final outcome은 같지만 conflict equivalent하지 않을 수 있다. 원문 schedule 8은 increment/decrement의 수학적 성질 때문에 serial schedule과 같은 최종값을 만들지만, read/write conflict만 보면 cycle이 생긴다.

이보다 덜 엄격한 equivalence로 `view equivalence`와 `view serializability`가 있다. 그러나 view serializability testing은 computationally expensive하고, 일반적으로 `NP-complete`인 것으로 알려져 실제 DBMS에서 직접 쓰기 어렵다. 그래서 실무적 concurrency control은 보통 conflict serializability를 보장하는 방향으로 설계된다.

### 17.7 Transaction Isolation and Atomicity

지금까지의 serializability 논의는 transaction failure가 없다고 암묵적으로 가정했다. 하지만 실제 system에서는 transaction이 중간에 fail할 수 있고, atomicity를 위해 그 transaction의 effects를 undo해야 한다. Concurrent execution에서는 한 transaction이 다른 transaction이 쓴 값을 읽었을 수 있으므로, 단순히 failed transaction 하나만 rollback하면 충분하지 않을 수 있다.

#### 17.7.1 Recoverable Schedules

어떤 transaction `Tj`가 `Ti`가 write한 data item을 read했다면, `Tj`는 `Ti`에 dependent하다. 이때 `Tj`가 먼저 commit한 뒤 `Ti`가 abort하면 문제가 생긴다. `Tj`는 이미 commit되어 abort할 수 없는데, `Tj`가 읽은 값은 abort되어야 할 `Ti`의 dirty value였기 때문이다.

Figure 17.14의 schedule 9가 바로 이런 `nonrecoverable schedule`이다. `T7`은 `T6`가 쓴 `A`를 읽고 곧바로 commit한다. 그런데 `T6`가 아직 active인 상태에서 나중에 fail하면, `T7`도 abort해야 atomicity가 맞지만 이미 commit되어 버렸다.

![Figure 17.14](@/assets/images/cs-database-261-figure-17-14-page-849.png)
*Figure 17.14 · PDF p. 849 · dependent transaction이 먼저 commit해 복구가 불가능해지는 nonrecoverable schedule*

`recoverable schedule`의 조건은 다음과 같다.

```text
Tj가 Ti가 쓴 값을 읽었다면,
commit(Ti)는 commit(Tj)보다 먼저 나와야 한다.
```

즉, 남의 uncommitted write를 읽은 transaction은 그 writer가 commit하기 전에는 commit하면 안 된다.

#### 17.7.2 Cascadeless Schedules

Recoverable schedule이어도 recovery cost가 클 수 있다. 어떤 transaction `Ti`가 abort했을 때, `Ti`가 쓴 값을 읽은 `Tj`도 abort해야 하고, 다시 `Tj`가 쓴 값을 읽은 `Tk`도 abort해야 할 수 있다. 이런 연쇄 rollback을 `cascading rollback`이라고 한다.

Figure 17.15의 schedule 10에서는 `T8`이 쓴 `A`를 `T9`가 읽고, `T9`가 쓴 `A`를 `T10`이 읽는다. `T8`이 abort하면 `T9`, 이어서 `T10`까지 rollback해야 한다.

![Figure 17.15](@/assets/images/cs-database-262-figure-17-15-page-849.png)
*Figure 17.15 · PDF p. 849 · 하나의 abort가 연쇄 rollback으로 번지는 cascading rollback 예시*

이를 피하려면 `cascadeless schedule`이 필요하다.

```text
Tj가 Ti가 쓴 값을 읽으려면,
commit(Ti)는 read(Tj)보다 먼저 나와야 한다.
```

즉, transaction은 committed data만 읽어야 한다. 모든 cascadeless schedule은 recoverable이지만, 모든 recoverable schedule이 cascadeless인 것은 아니다. Cascadelessness는 abort 전파를 막아 recovery를 단순하고 싸게 만든다.

### 17.8 Transaction Isolation Levels

`serializability`는 programmer가 concurrency를 거의 의식하지 않게 해 주는 강한 기준이다. 각 transaction이 혼자 실행될 때 consistency를 보존한다면, serializable concurrent execution도 consistency를 보존한다. 하지만 serializability를 강제하는 protocols는 concurrency를 지나치게 제한할 수 있다. 그래서 SQL은 더 약한 `isolation levels`를 제공한다.

| isolation level | 허용/보장 | 위험 |
|---|---|---|
| `Serializable` | 일반적으로 serializable execution 보장 | 일부 DBMS 구현은 이름과 달리 특정 nonserializable execution을 허용할 수 있음 |
| `Repeatable read` | committed data만 읽고, transaction이 같은 data item을 두 번 읽는 사이 다른 transaction이 그 item을 update하지 못함 | predicate로 찾는 tuple set 전체는 고정되지 않을 수 있어 phantom 계열 문제가 남을 수 있음 |
| `Read committed` | committed data만 읽음 | 같은 item을 두 번 읽는 사이 다른 committed update 때문에 값이 바뀔 수 있음, 즉 nonrepeatable read 가능 |
| `Read uncommitted` | uncommitted data도 읽을 수 있음 | dirty read 가능, SQL이 허용하는 가장 낮은 isolation level |

위 isolation levels는 모두 `dirty writes`는 금지한다. 즉, 아직 commit/abort하지 않은 다른 transaction이 이미 write한 data item에 다시 write하는 것은 허용하지 않는다.

많은 DBMS는 기본적으로 `read committed`를 사용한다. SQL에서는 다음처럼 isolation level을 명시할 수 있다.

```sql
set transaction isolation level serializable;
```

Isolation level 변경은 transaction의 첫 statement로 수행되어야 한다. 또한 대부분의 database는 기본적으로 각 SQL statement를 즉시 commit하는 `automatic commit`을 사용한다. 여러 SQL statements를 하나의 transaction으로 묶으려면 automatic commit을 끄거나 `start transaction` 이후 `commit` 또는 `rollback`까지를 하나의 transaction으로 실행해야 한다. JDBC/ODBC 같은 API도 `setAutoCommit(false)`와 transaction isolation 설정 기능을 제공한다.

Weak isolation은 성능을 위해 correctness 부담을 programmer에게 일부 넘기는 선택이다. 특정 inconsistency가 application에 중요하지 않다고 확신할 수 있을 때만 사용하는 것이 안전하다.

### 17.9 Implementation of Isolation Levels

Concurrency-control policy의 목표는 OS가 CPU time을 어떻게 나누든, 생성 가능한 schedules가 `conflict serializable` 또는 `view serializable`, `recoverable`, `cascadeless`가 되도록 제한하는 것이다. 가장 단순한 정책은 transaction 시작 전 전체 database lock을 잡고 commit 후 release하는 방식이다. 이 경우 serial schedules만 생성되어 안전하지만 concurrency가 전혀 없어 성능이 나쁘다.

#### 17.9.1 Locking

`locking`은 transaction이 access하는 data items에 lock을 잡는 방식이다. 핵심 trade-off는 lock을 충분히 오래 잡아 serializability를 보장하되, 너무 오래 잡아 concurrency를 망치지 않는 것이다. 대표 protocol인 `two-phase locking`은 두 단계를 강제한다.

```text
growing phase:   locks를 acquire하지만 release하지 않음
shrinking phase: locks를 release하지만 새 lock을 acquire하지 않음
```

실무에서는 보통 transaction이 commit 또는 abort할 때까지 locks를 유지한다. `shared lock`과 `exclusive lock`을 구분하면 concurrency가 좋아진다. Shared lock은 read용이라 여러 transactions가 동시에 잡을 수 있고, exclusive lock은 write용이라 다른 어떤 lock도 없어야 잡을 수 있다. 이 조합은 concurrent reads를 허용하면서도 conflicting writes를 막는다.

#### 17.9.2 Timestamps

`timestamp ordering` 계열은 각 transaction에 시작 시점 등의 `timestamp`를 부여한다. 각 data item마다 다음 두 timestamp를 유지한다.

| timestamp | 의미 |
|---|---|
| `read timestamp` | 그 data item을 읽은 transactions 중 가장 최신 timestamp |
| `write timestamp` | 현재 value를 write한 transaction의 timestamp |

Conflicting accesses가 transaction timestamp order를 따르도록 검사하고, 불가능하면 offending transaction을 abort하고 새 timestamp로 restart한다.

#### 17.9.3 Multiple Versions and Snapshot Isolation

`multiversion concurrency control`은 data item의 여러 versions를 유지해, transaction이 최신 uncommitted value를 기다리는 대신 old version을 읽을 수 있게 한다. 그중 `snapshot isolation`은 실무에서 널리 쓰인다.

Snapshot isolation에서는 transaction이 시작될 때 database의 자기 `snapshot`을 받는다고 생각할 수 있다. Transaction은 그 private snapshot에서 read하고, update도 처음에는 자기 version에만 반영한다. Transaction이 `partially committed`에 도달하면, 자신이 update하려는 data를 다른 concurrent transaction이 이미 modify했는지 검사한다. 충돌이 없으면 updates를 real database에 적용하고 commit하며, 충돌이 있으면 abort한다.

Snapshot isolation의 성능상 장점은 크다.

- Reads never need to wait: 읽기는 lock 때문에 기다리지 않는다.
- Read-only transactions cannot be aborted: 읽기 전용 transaction은 abort 위험이 없다.
- Writers만 commit 시점에 conflict check를 하므로, read-heavy workload에서 locking보다 유리할 수 있다.

다만 snapshot isolation이 모든 경우에 serializability를 보장하는 것은 아니다. 이 caveat는 Chapter 18에서 더 자세히 다룬다.

Snapshot isolation의 역설적 문제는 "너무 많이 격리한다"는 데 있다. Serializable execution에서는 두 transactions `T`와 `T'` 중 하나가 serialization order에서 먼저 오므로, 나중 transaction은 먼저 transaction의 updates를 볼 수 있어야 한다. 하지만 snapshot isolation에서는 둘 다 자기 시작 시점 snapshot을 읽기 때문에, `T`도 `T'`의 update를 못 보고 `T'`도 `T`의 update를 못 보는 상황이 가능하다. 두 transaction이 서로가 읽은 data item을 update하면, precedence graph 관점에서는 cycle이 생길 수 있고, serial execution으로는 얻을 수 없는 inconsistent state가 생길 수 있다. 이 문제는 흔히 `write skew` 계열 anomaly로 이어진다.

일부 DBMS는 snapshot isolation을 별도 isolation level로 제공하고, 일부는 `serializable snapshot isolation`처럼 snapshot의 read performance 장점을 유지하면서 serializability까지 보장하려는 방식을 제공한다. 핵심은 이름이 `serializable`이라고 해서 항상 이론적 serializability와 같은 구현이라는 보장이 없으므로, application designer는 DBMS의 실제 isolation 구현을 알아야 한다는 점이다.

### 17.10 Transactions as SQL Statements

지금까지의 simple model은 이미 존재하는 fixed data items에 대해 `read(X)`와 `write(X)`만 수행한다고 보았다. SQL에서는 `insert`가 새 tuple을 만들고, `delete`가 tuple을 제거하며, `where` clause predicate가 어떤 tuples를 읽을지 결정한다. 이 때문에 단순 read/write item 모델로는 잡히지 않는 conflict가 생긴다.

예를 들어 다음 query는 salary가 90000보다 큰 instructors를 찾는다.

```sql
select ID, name
from instructor
where salary > 90000;
```

동시에 다른 transaction이 다음 tuple을 insert한다고 하자.

```sql
insert into instructor
values ('11111', 'James', 'Marketing', 100000);
```

Query가 먼저 실행되면 James를 보지 못하고, insert가 먼저 실행되면 James를 본다. 직관적으로 두 SQL statements는 conflict한다. 하지만 simple model의 precedence graph는 이미 access한 concrete tuples만 기준으로 edge를 만들기 때문에, query가 먼저 실행된 경우에는 James tuple이 아직 없어서 conflict가 포착되지 않을 수 있다. 이런 현상을 `phantom phenomenon`이라고 한다. Conflict가 "이미 존재하는 tuple"이 아니라 "predicate를 만족할 수 있는 phantom data"에 걸려 있기 때문이다.

SQL concurrency control은 tuple 자체뿐 아니라 tuple을 찾는 데 사용한 정보도 고려해야 한다.

| simple read/write model | SQL statement 현실 |
|---|---|
| operation이 특정 data item `X`를 명시적으로 read/write | `where` predicate가 실행 시점 database 상태에 따라 tuple set을 결정 |
| conflict는 같은 data item access로 판정 | insert/delete/update가 predicate result set을 바꿀 수 있으면 conflict |
| precedence graph edge가 concrete item 중심 | relation scan structure, index structure, search-key update까지 고려 필요 |

Index가 있느냐에 따라 low-level access path가 달라지는 것도 문제다. 예를 들어 `salary > 90000` query가 full table scan을 하면 Wu의 tuple도 읽을 수 있지만, salary index로 바로 qualifying tuples만 읽으면 Wu의 tuple을 읽지 않을 수 있다. 그러나 user-level 의미에서 conflict 여부가 optimizer의 access path 선택에 따라 달라지는 것은 이상하다. 그래서 더 높은 수준의 접근은 insert/delete/update가 relation predicate가 선택하는 tuple set을 바꿀 수 있으면 conflict한다고 본다.

이 아이디어가 `predicate locking`이다. Predicate locking은 relation의 특정 predicate, 예를 들어 `salary > 90000`을 만족하는 tuple set에 영향을 줄 수 있는 insert/delete/update를 막는다. 실제 구현은 보통 index nodes에 lock을 잡는 방식으로 근사하며, Chapter 18의 index-locking protocols에서 더 자세히 다룬다.

### 17.11 Summary

Chapter 17은 transaction을 "failure와 concurrency 속에서도 database consistency를 보존하기 위한 실행 단위"로 정식화한다.

| 주제 | 핵심 |
|---|---|
| transaction concept | 여러 operations를 하나의 logical unit of work로 묶음 |
| ACID properties | `atomicity`, `consistency`, `isolation`, `durability` |
| storage structure | `volatile storage`, `non-volatile storage`, `stable storage` 구분 |
| recovery와 atomicity | `log`, `undo`, `redo`, `rollback`, `committed`, `aborted` |
| transaction state | `active`, `partially committed`, `failed`, `aborted`, `committed`, `terminated` |
| isolation motivation | concurrent execution은 throughput/resource utilization/response time을 개선하지만 inconsistency 위험을 만듦 |
| schedule | concurrent execution의 read/write/commit order를 추상화 |
| serializability | concurrent schedule이 어떤 serial schedule과 equivalent해야 함 |
| conflict serializability | conflicting operations와 precedence graph cycle로 효율적으로 판정 |
| recoverable/cascadeless schedules | failure recovery가 가능하고 cascading rollback을 피하도록 commit/read order 제한 |
| isolation levels | `Serializable`, `Repeatable read`, `Read committed`, `Read uncommitted`, `dirty writes` 금지 |
| implementation overview | `locking`, `timestamp ordering`, `multiversion concurrency control`, `snapshot isolation` |
| SQL transaction 문제 | `insert`, `delete`, predicate-based read 때문에 `phantom phenomenon`, `predicate locking` 필요 |

## 연결 관계

- Chapter 18 `Concurrency Control`: Chapter 17의 correctness 조건인 serializability, recoverability, cascadelessness를 실제로 보장하는 `locking`, `timestamp ordering`, `validation`, `multiversion`, `snapshot isolation`, `predicate locking` protocols를 다룬다.
- Chapter 19 `Recovery System`: Chapter 17에서 소개한 `log`, `undo`, `redo`, `stable storage`, `atomicity`, `durability`를 실제 recovery algorithm과 `write-ahead logging`으로 구현한다.
- Chapter 4 SQL 기본: `commit`, `rollback`, `start transaction`, integrity constraints와 연결된다.
- Chapter 15-16 query processing/optimization: SQL statement의 access path가 concurrency conflict 판정과도 연결될 수 있음을 phantom/predicate locking에서 다시 확인한다.

## 오해하기 쉬운 내용

- `Consistency`는 DBMS가 전부 자동 보장하는 성질이 아니다. DBMS constraints가 표현 가능한 조건은 검사하지만, application-dependent consistency는 transaction logic을 작성한 programmer 책임이다.
- `Atomicity`와 `Durability`는 비슷해 보이지만 반대 방향의 failure 대응이다. Atomicity는 실패한 transaction의 partial effects를 없애는 것이고, durability는 성공한 transaction의 effects를 잃지 않는 것이다.
- `Serial schedule`과 `serializable schedule`은 다르다. Serial schedule은 실제로 transactions가 한 번에 하나씩 실행된 schedule이고, serializable schedule은 interleaving되었더라도 어떤 serial schedule과 equivalent한 schedule이다.
- `Recoverable`과 `cascadeless`도 다르다. Recoverable은 commit order 조건이고, cascadeless는 uncommitted data를 읽지 않게 해 cascading rollback 자체를 방지하는 더 강한 조건이다.
- `Read committed`는 dirty read를 막지만 repeatable read를 보장하지 않는다. 같은 data item을 다시 읽었을 때 값이 달라질 수 있다.
- `Snapshot isolation`은 read 성능이 좋지만 항상 serializable은 아니다. 서로의 updates를 보지 못하는 write skew 같은 anomaly가 가능하다.
- SQL의 conflict는 tuple 단위만 보면 부족하다. `where` predicate가 선택할 수 있는 phantom tuples까지 고려해야 한다.

## 면접 질문

1. `ACID properties` 각각을 계좌 이체 예시로 설명해 보라.
2. `atomicity`와 `durability`를 모두 보장하기 위해 `log`에는 어떤 정보가 필요하고, 왜 old value와 new value가 모두 필요한가?
3. `serial schedule`과 `serializable schedule`의 차이는 무엇인가?
4. 두 operations가 `conflict`한다고 말하려면 어떤 조건이 필요한가?
5. `precedence graph`로 conflict serializability를 판정하는 절차를 설명해 보라.
6. `recoverable schedule`과 `cascadeless schedule`의 차이는 무엇이며, cascading rollback은 왜 문제가 되는가?
7. `Read committed`, `Repeatable read`, `Serializable`의 차이를 anomaly 관점에서 설명해 보라.
8. `snapshot isolation`이 왜 read-heavy workload에서 빠를 수 있고, 왜 serializability를 항상 보장하지는 않는가?
9. SQL에서 `phantom phenomenon`이 왜 simple read/write model로는 잘 포착되지 않는가?
10. `predicate locking`이 필요한 이유와 index locking과의 연결을 설명해 보라.
