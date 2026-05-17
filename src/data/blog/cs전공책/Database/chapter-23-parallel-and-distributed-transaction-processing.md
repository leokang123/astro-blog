---
title: "Chapter 23. Parallel and Distributed Transaction Processing"
order: 23
pubDatetime: 2026-05-18T00:00:00+09:00
modDatetime: 2026-05-18T00:00:00+09:00
description: "Database System Concepts 정리: Chapter 23. Parallel and Distributed Transaction Processing"
tags:
  - "Database"
  - "CS"
---

> 대상 범위: Database System Concepts 7th Ch.23, PDF pp.1127-1203  
> 목표: 분산/병렬 환경에서 transaction atomicity, isolation, replication consistency, coordinator selection, consensus가 왜 필요한지와 어떤 실패 조건을 다루는지 한국어로 재구성한다. 핵심 영어 용어는 Ctrl+F 검색을 위해 유지한다.

## 개요

Chapter 23은 앞 장들의 transaction, concurrency control, recovery 개념을 여러 node가 독립적으로 실패할 수 있는 parallel database / distributed database 환경으로 확장한다. 단일 DBMS에서는 log, lock, recovery manager가 한 시스템 안에서 움직이지만, distributed transaction에서는 한 transaction이 여러 local database에 걸쳐 실행되고, 어떤 node는 commit을 준비한 뒤 다른 node나 network 때문에 결정을 알 수 없는 상태에 빠질 수 있다.

이 장의 큰 축은 다음과 같다.

- `Distributed transaction`: 하나의 transaction이 여러 node의 data item을 읽고 갱신할 때 ACID를 어떻게 보장할지 다룬다.
- `Commit protocol`: 여러 participant가 모두 commit하거나 모두 abort하도록 `two-phase commit (2PC)` 같은 atomic commit protocol을 사용한다.
- `Distributed concurrency control`: lock manager, timestamp ordering, validation을 여러 node로 분산했을 때 deadlock, clock, lease 문제가 생긴다.
- `Replication`: 여러 replica가 있을 때 읽기 성능과 가용성을 얻는 대신, replica consistency와 update coordination 비용을 치른다.
- `Weak consistency`, `asynchronous replication`, `Merkle tree`: 강한 일관성을 완화하면 availability를 얻지만 conflict detection/resolution이 애플리케이션 의미론에 가까워진다.
- `Coordinator selection`, `consensus`, `Paxos`, `Raft`: coordinator failure와 replicated service를 다루기 위해 majority 기반 합의가 필요하다.

## 핵심 개념

| 용어 | 뜻 | 왜 중요한가 |
|---|---|---|
| `local transaction` | 한 local database의 data만 접근/갱신하는 transaction | 기존 Chapter 17-19의 ACID, concurrency, recovery 기법으로 처리 가능 |
| `global transaction` | 여러 local database/node의 data를 접근/갱신하는 transaction | node failure, communication failure 때문에 atomicity/isolation 보장이 어려움 |
| `transaction manager (TM)` | 각 node에서 local/subtransaction 실행, log, recovery, concurrency control 담당 | 중앙 DBMS의 transaction subsystem에 해당 |
| `transaction coordinator (TC)` | transaction을 시작하고 subtransaction을 분배하며 전체 commit/abort를 조정 | distributed transaction에서 새로 필요한 역할 |
| `two-phase commit (2PC)` | prepare phase와 decision phase로 모든 participant의 commit/abort를 맞추는 atomic commit protocol | 단순하고 널리 쓰이지만 coordinator failure 시 blocking 가능 |
| `ready state` | participant가 `<ready T>`를 stable storage에 force하고 coordinator 결정에 따르겠다고 약속한 상태 | 이 상태 이후에는 독자적으로 abort할 수 없고 lock도 유지해야 함 |
| `in-doubt transaction` | log에 `<ready T>`는 있지만 `<commit T>`/`<abort T>`가 없는 transaction | recovery 후 다른 node에 결정을 물어야 하며 blocking의 핵심 원인 |
| `blocking problem` | coordinator failure 등으로 commit/abort 결정을 알 수 없어 participant가 대기하는 상황 | lock을 잡은 채 대기하면 active node의 data까지 unavailable해질 수 있음 |
| `persistent messaging` | sender transaction이 commit하면 message가 정확히 한 번 처리되도록 보장하는 메시징 방식 | 조직 경계를 넘는 long transaction에서 2PC blocking을 피하는 대안 |

## 세부 정리

### 23.1 Distributed Transactions

분산 시스템에서 data item 접근은 transaction을 통해 이루어지며, transaction은 여전히 `ACID` properties를 보존해야 한다. 문제는 transaction이 한 node에만 머무르는지, 여러 node에 걸치는지에 따라 난도가 크게 달라진다는 점이다.

- `local transaction`: 하나의 local database 안에서만 실행된다. 기존 centralized DBMS의 concurrency control과 recovery 기법을 그대로 적용할 수 있다.
- `global transaction`: 여러 local database/node에서 실행된다. node 하나가 실패하거나 communication link가 끊기면 전체 transaction 결과가 틀어질 수 있다.

중요한 관찰은 parallel database와 distributed database의 논리 문제가 상당히 비슷하다는 점이다. node들이 독립적으로 실패할 수 있다면, 물리적으로 한 data center 안에 있든 지리적으로 떨어져 있든 transaction isolation과 atomicity 문제는 거의 같은 형태로 나타난다. 반대로 `shared-memory parallel database`처럼 구성 요소가 독립 실패 모드를 갖지 않고 하나의 transaction log를 공유한다면, 이 장의 분산 commit 기법보다 centralized recovery/concurrency 기법이 더 적절하다.

#### 23.1.1 System Structure

각 node는 자기 local data를 책임지는 `transaction manager (TM)`와, 그 node에서 시작된 transaction 전체를 조정하는 `transaction coordinator (TC)`를 갖는다.

![Figure 23.1](@/assets/images/cs-database-327-figure-23-1-page-1128.png)
*Figure 23.1 · PDF p. 1128 · 각 computer/node가 transaction coordinator와 transaction manager를 함께 가지는 구조*

`transaction manager`는 각 node에서 다음을 담당한다.

- 해당 node에 저장된 data를 접근하는 local transaction 또는 global transaction의 subtransaction 실행을 관리한다.
- recovery를 위한 log를 유지한다.
- 그 node에서 실행 중인 transaction들의 concurrent execution을 조정하기 위해 concurrency-control scheme에 참여한다.

`transaction coordinator`는 centralized environment에는 필요 없던 구성 요소다. 한 transaction이 여러 node를 건드릴 수 있으므로, coordinator는 다음을 담당한다.

- transaction 실행을 시작한다.
- transaction을 여러 `subtransactions`로 나누고 적절한 node에 배포한다.
- 모든 관련 node가 transaction을 commit할지 abort할지 동일한 결론에 도달하도록 termination을 조정한다.

이 구조에서 local TM은 “내 node의 correctness”를 지키고, TC는 “여러 node가 하나의 transaction처럼 끝나는 correctness”를 지킨다.

#### 23.1.2 System Failure Modes

분산 DBMS는 centralized DBMS의 failure, 예를 들어 software error, hardware error, disk crash에 더해 communication 관련 failure를 추가로 다룬다.

| failure mode | 의미 | transaction 관점의 위험 |
|---|---|---|
| `failure of a node` | participant 또는 coordinator node가 중간에 crash | 일부 node만 commit/abort를 알 수 있어 atomicity가 흔들림 |
| `loss of messages` | message가 손실 또는 손상 | prepare, ready, commit 같은 control message가 도착하지 않을 수 있음 |
| `failure of a communication link` | node 사이 link 일부가 끊김 | 다른 route가 있으면 우회 가능하지만, 없으면 특정 node 쌍이 통신 불가 |
| `network partition` | system이 둘 이상의 연결되지 않은 partition으로 쪼개짐 | 한 partition에서는 다른 partition의 node가 failed처럼 보임 |

message loss/corruption 자체는 `TCP/IP` 같은 transmission-control protocol이 어느 정도 처리한다. 하지만 link failure가 routing으로 해결되지 않으면 system은 `partitioned` 상태가 된다. 이때 partition은 node 여러 개일 수도 있고 단일 node 하나일 수도 있다. 분산 transaction protocol은 이런 partition 상황에서도 가능한 한 atomicity를 보장해야 한다.

### 23.2 Commit Protocols

distributed transaction `T`가 여러 node에서 실행되었다면, atomicity를 위해 모든 node가 같은 최종 결과에 동의해야 한다. 즉 `T`는 모든 node에서 commit되거나, 모든 node에서 abort되어야 한다. 이 합의를 수행하는 절차가 `commit protocol`이고, 대표적이며 단순한 방식이 `two-phase commit protocol (2PC)`이다.

#### 23.2.1 Two-Phase Commit

`two-phase commit (2PC)`는 transaction coordinator가 모든 participant에게 commit 가능 여부를 묻고, 모든 participant가 준비되었다고 답한 경우에만 commit을 결정하는 protocol이다. 여기서 transaction `T`가 node `Ni`에서 시작되었고 coordinator를 `Ci`라고 하자.

##### 23.2.1.1 The Commit Protocol

`T`가 실행을 마치고 모든 실행 node가 완료를 알리면 `Ci`가 2PC를 시작한다.

| phase | coordinator `Ci` 동작 | participant TM 동작 | 핵심 log record |
|---|---|---|---|
| `Phase 1` / prepare | `<prepare T>`를 log에 쓰고 stable storage에 force한 뒤, 모든 participant에 `prepare T` message 전송 | commit 가능하면 `<ready T>`를 force하고 `ready T` 응답. commit 불가하면 `<no T>`를 쓰고 abort 응답 | `<prepare T>`, `<ready T>`, `<no T>` |
| `Phase 2` / decision | 모든 node가 `ready T`면 `<commit T>`를 force하고 `commit T` 전송. 하나라도 abort/no이거나 timeout이면 `<abort T>`를 force하고 `abort T` 전송 | 결정 message를 받으면 자기 log에 `<commit T>` 또는 `<abort T>`를 쓰고 실제 commit/abort 수행 | `<commit T>`, `<abort T>` |

![Figure 23.2](@/assets/images/cs-database-328-figure-23-2-page-1131.png)
*Figure 23.2 · PDF p. 1131 · 두 participant가 모두 ready를 보낸 뒤 coordinator가 commit을 결정하는 성공적인 2PC 흐름*

2PC에서 가장 중요한 상태는 `ready state`다. participant가 `<ready T>`를 stable storage에 쓴 뒤 `ready T` message를 보냈다는 것은 “나중에 coordinator가 commit하라고 하든 abort하라고 하든 따르겠다”는 약속이다. 그러려면 필요한 log record가 durable해야 하고, transaction이 잡은 lock도 최종 결정이 날 때까지 유지되어야 한다.

반대로 participant가 아직 `ready T`를 보내기 전이라면 언제든 독자적으로 abort할 수 있다. commit은 unanimity가 필요하므로 하나라도 abort/no가 있으면 전체 `T`는 abort되어야 한다. 최종 운명은 coordinator가 `<commit T>` 또는 `<abort T>`를 log에 쓰고 stable storage에 force하는 순간 봉인된다.

일부 구현은 2단계 이후 participant가 `acknowledge T`를 coordinator에 보내게 한다. coordinator가 모든 acknowledgment를 받으면 `<complete T>`를 log에 쓰고 transaction 정보를 버릴 수 있다. 그 전까지는 participant가 network failure나 일시 장애 후 decision을 물어볼 수 있으므로 coordinator는 commit/abort 결정을 기억해야 한다.

##### 23.2.1.2 Handling of Failures

2PC는 failure 종류에 따라 다르게 반응한다.

| 상황 | 판단 기준 | 처리 |
|---|---|---|
| participant가 `ready T` 전 실패 | coordinator가 `ready T`를 받지 못함 | 해당 participant가 abort한 것으로 보고 전체 abort 가능 |
| participant가 `ready T` 후 실패 | 이미 commit 가능 약속을 durable하게 남김 | coordinator는 나머지 protocol을 정상 진행하고, participant는 recovery 후 log로 fate 확인 |
| participant recovery: `<commit T>` 있음 | commit decision durable | `redo(T)` |
| participant recovery: `<abort T>` 있음 | abort decision durable | `undo(T)` |
| participant recovery: `<ready T>`만 있음 | `in-doubt transaction` | coordinator 또는 다른 node에 `querystatus T`를 보내 commit/abort 여부 확인 |
| participant recovery: control record 없음 | prepare에 응답하기 전 실패 | coordinator는 abort했을 것이므로 `undo(T)` |

`coordinator failure`는 더 민감하다. active participant들이 자기 log만 보고 결정을 추론해야 하기 때문이다.

- 어떤 active node log에 `<commit T>`가 있으면 `T`는 commit되어야 한다.
- 어떤 active node log에 `<abort T>`가 있으면 `T`는 abort되어야 한다.
- 어떤 active node에 `<ready T>`가 없다면 coordinator가 commit 결정을 내렸을 수 없다. commit은 모든 participant의 ready가 필요하므로, 기다리기보다 abort하는 것이 낫다.
- 모든 active node가 `<ready T>`만 갖고 있고 commit/abort record가 없다면 결정을 알 수 없다. coordinator가 이미 결정을 내렸는지, 냈다면 commit인지 abort인지 확인할 방법이 없으므로 coordinator recovery를 기다려야 한다. 이것이 `blocking problem`이다.

`network partition`에서는 한 partition의 node들이 다른 partition의 node를 failed로 본다. coordinator와 모든 participant가 같은 partition에 남아 있으면 commit protocol에는 영향이 없다. 그러나 coordinator와 participant가 여러 partition에 흩어지면, coordinator가 있는 partition은 통신 가능한 node만 보고 정상 protocol을 진행하고, coordinator가 없는 partition의 node들은 coordinator failure 처리 절차를 따른다. 이 역시 blocking을 만들 수 있다.

##### 23.2.1.3 Recovery and Concurrency Control

recovery 중 log에 `<ready T>`는 있지만 `<commit T>`나 `<abort T>`가 없는 transaction은 `in-doubt transaction`이다. 이 transaction은 다른 node에 commit/abort status를 물어본 뒤 처리해야 한다.

문제는 모든 in-doubt transaction의 운명이 밝혀질 때까지 node의 정상 transaction processing을 멈추면 restart recovery가 오래 막힐 수 있다는 점이다. 특히 coordinator가 죽어 있고 어떤 node도 결정을 모르면 2PC에서는 recovery 자체가 사실상 blocked될 수 있다.

이를 줄이기 위해 recovery algorithm은 lock 정보를 log에 함께 남긴다. 예를 들어 `<ready T>` 대신 `<ready T, L>`을 쓰는데, `L`은 `T`가 ready record를 쓸 때 보유하던 모든 write lock 목록이다.

재시작 시에는 다음 순서로 처리한다.

1. local recovery actions를 수행한다.
2. 각 in-doubt transaction `T`에 대해 log의 `<ready T, L>`에서 write lock 목록 `L`을 읽는다.
3. 해당 write lock을 다시 획득한다.
4. lock reacquisition이 끝나면, in-doubt transaction의 commit/rollback 결정을 기다리는 동안에도 새 transaction processing을 시작한다.

이 방식은 node 전체가 불필요하게 멈추는 것을 막는다. 다만 새 transaction이 in-doubt transaction의 write lock과 충돌하면, 해당 transaction은 여전히 in-doubt transaction이 commit/rollback될 때까지 진행할 수 없다.

#### 23.2.2 Avoiding Blocking During Commit

2PC의 약점은 coordinator failure가 active node의 data까지 unavailable하게 만들 수 있다는 점이다. 이를 줄이는 핵심 아이디어는 commit decision을 coordinator 한 곳에만 두지 않고, 여러 node가 참여하는 `fault-tolerant distributed consensus`로 결정하는 것이다.

`distributed consensus` 문제는 여러 node가 하나의 값, 여기서는 transaction commit 여부에 대해 같은 결정을 배우도록 만드는 문제다. protocol은 일부 node failure나 network partition이 있어도, majority가 살아 있고 서로 통신 가능하면 block되지 않아야 한다. `Paxos`와 `Raft`가 널리 쓰이는 consensus protocol이며, 핵심은 특정 decision이 majority vote를 얻어야 성공한다는 점이다.

2PC에 consensus를 붙이면 다음처럼 동작한다.

| 단계 | 일반 2PC | consensus 기반 보완 |
|---|---|---|
| decision 저장 위치 | coordinator log에 commit/abort decision 저장 | consensus 참여 node들의 majority에 decision을 기록 |
| coordinator failure 후 | participant가 coordinator recovery를 기다릴 수 있음 | 새 coordinator가 majority에 decision 존재 여부를 물어봄 |
| decision 미확정 | coordinator가 다시 participant 상태를 물어보고 결정 | consensus protocol을 다시 시작 |
| 충돌 요청 | 일반 2PC에서는 coordinator 단일성에 의존 | consensus가 commit/abort 중 하나만 majority를 얻도록 보장 |

이 접근은 coordinator failure로 인한 blocking을 줄이지만, 완전한 만능은 아니다. network partition으로 어떤 node가 consensus majority에서 떨어져 있으면, 그 node는 decision이 이미 내려졌더라도 알지 못해 locally blocked될 수 있다. 또한 participant 자체가 실패하면 replication이 없는 data는 여전히 unavailable해질 수 있다.

`three-phase commit (3PC)`도 2PC의 blocking을 줄이기 위한 확장이다. 단, 일부 variant는 network partition이 없다는 가정에서만 안전하고, partition이 있으면 inconsistent decision 위험이 있다. partition까지 안전하게 처리하는 확장들은 결국 majority voting/consensus와 비슷한 아이디어를 사용한다.

#### 23.2.3 Alternative Models of Transaction Processing

2PC에서는 participant가 coordinator에게 transaction fate 결정을 위임하고, lock을 잡은 채 기다린다. 한 조직 내부라면 감수할 수 있지만, 서로 다른 조직 사이에서는 다른 조직의 컴퓨터 때문에 자기 local data 접근이 오래 막히는 것을 받아들이기 어렵다. 이런 경우 대안이 `persistent messaging`이다.

전형적인 예는 두 은행 사이의 funds transfer다. 한 방법은 두 은행 DB에 걸친 transaction을 만들고 2PC로 atomicity를 보장하는 것이다. 하지만 transaction이 각 은행의 total balance 같은 빈번히 접근되는 data를 update한다면, blocking의 영향이 매우 커진다. 반대로 수표(check)처럼 sender 은행에서 금액을 차감하고, recipient 은행에 “입금하라”는 message를 확실히 전달하는 모델을 쓰면 distributed commit 자체를 피할 수 있다.

`persistent message`는 sender transaction이 commit하면 message가 recipient에게 정확히 한 번, 즉 `exactly once` 처리되도록 보장하고, sender transaction이 abort하면 전달되지 않도록 보장하는 message다. 일반 network message는 lost되거나 중복 전달될 수 있지만, persistent messaging은 database recovery 기법으로 그 위에 신뢰성을 얹는다.

![Figure 23.3](@/assets/images/cs-database-329-figure-23-3-page-1138.png)
*Figure 23.3 · PDF p. 1138 · outbox/inbox relation과 acknowledgment를 이용한 persistent messaging 구현*

persistent messaging 구현은 `messages_to_send` relation과 `received_messages` relation을 중심으로 이루어진다.

| 구성 요소 | 역할 | exactly-once에 기여하는 지점 |
|---|---|---|
| sending transaction | 직접 message를 보내지 않고 `messages_to_send` relation에 message와 unique message identifier를 기록 | transaction commit 시에만 outbox record가 남음 |
| message delivery process | `messages_to_send`를 감시하고 새 message를 destination으로 전송. acknowledgment를 받을 때까지 재전송 | temporary failure나 message loss에도 eventually delivered |
| receiving transaction | message가 `received_messages`에 없을 때만 삽입하고 processed flag를 false로 둠 | unique identifier로 duplicate delivery 감지 |
| acknowledgment | receiving transaction commit 후 sender에게 보냄 | commit 전 ack를 보내면 crash 시 message loss가 가능하므로 금지 |
| message processing process | unprocessed message를 읽어 작업을 수행하고 같은 transaction 안에서 processed flag를 true로 변경 | receive 이후 message가 정확히 한 번 처리됨 |
| old message cleanup | timestamp/cutoff로 너무 오래된 received message 기록을 정리 | 무한 성장을 막지만 너무 이른 삭제는 duplicate detection을 깨뜨릴 수 있음 |

이 방식의 trade-off는 명확하다. 2PC는 error가 있으면 원래 transaction 자체가 abort되어 sender update도 발생하지 않는다. 반면 persistent messaging에서는 receiving account가 닫힌 경우 같은 application-level exception을 직접 처리해야 한다. 예를 들어 돈을 원래 account로 되돌리는 compensating action이 필요하고, 자동 처리 불가능하면 human intervention까지 고려해야 한다.

따라서 persistent messaging은 atomic distributed transaction을 DBMS가 자동으로 보장해 주는 방식이 아니라, application이 exception handling과 compensation logic을 설계하는 방식이다. 그 대신 cross-organization workflow에서 2PC blocking을 피할 수 있다. enterprise workflow, loan application 처리처럼 여러 시스템과 사람의 단계를 거치는 작업에서 persistent messaging은 distributed workflow의 기반 역할을 한다.

### 23.3 Concurrency Control in Distributed Databases

이 절은 Chapter 18의 concurrency-control scheme을 distributed environment에 맞게 확장한다. 전제는 각 node가 global transaction atomicity를 위해 commit protocol에 참여한다는 것이다. 여기서는 아직 data item이 replicated되지 않았다고 가정하고, multiversion 기법도 제외한다. replica 문제는 23.4, distributed multiversion concurrency control은 23.5에서 다룬다.

#### 23.3.1 Locking Protocols

Chapter 18의 locking protocol은 distributed setting에서도 쓸 수 있다. 차이는 “lock request를 어디서 처리할 것인가”다.

##### 23.3.1.1 Single Lock-Manager Approach

`single lock-manager approach`에서는 하나의 선택된 node `Ni`에 단일 lock manager를 둔다. 모든 lock/unlock request가 이 node로 간다.

| 항목 | 내용 |
|---|---|
| lock request | transaction이 data item lock을 원하면 `Ni`에 request를 보냄 |
| grant 가능 | lock manager가 즉시 grant message를 돌려보냄 |
| grant 불가 | compatible해질 때까지 request를 지연 |
| unlock | unlock request도 `Ni`에서 처리 |

장점은 구현이 단순하다는 것이다. lock request에는 request/response 두 message, unlock에는 한 message 정도면 된다. 또한 모든 lock 정보가 한 곳에 있으므로 Chapter 18의 centralized deadlock handling을 거의 그대로 적용할 수 있다.

단점도 그만큼 명확하다. `Ni`가 모든 lock traffic의 bottleneck이 되고, `Ni`가 fail하면 concurrency controller 자체를 잃는다. 처리를 중단하거나, 23.7에서 다루는 backup coordinator 같은 recovery/takeover scheme이 필요하다.

##### 23.3.1.2 Distributed Lock Manager

`distributed lock manager` 방식은 lock-manager 기능을 여러 node에 나누어 둔다. 각 node는 자기 node에 저장된 data item의 lock/unlock request를 관리하는 local lock manager를 갖는다.

예를 들어 transaction이 node `Ni`에 있는 data item `Q`에 lock을 원하면, `Ni`의 lock manager에 lock request를 보낸다. incompatible lock이 있으면 지연되고, 가능해지면 grant message가 돌아온다.

| 방식 | 장점 | 단점 |
|---|---|---|
| single lock manager | 구현 단순, deadlock handling 단순 | bottleneck, single point of failure |
| distributed lock manager | 병목 감소, lock request overhead 낮음 | internode deadlock 때문에 deadlock handling 복잡 |

distributed lock manager에서는 단일 node 내부에는 cycle이 없어도 node들을 합친 전체 시스템에는 deadlock이 있을 수 있다. 그래서 local wait-for graph만으로는 충분하지 않다.

#### 23.3.2 Deadlock Handling

distributed system에서도 deadlock prevention과 deadlock detection을 모두 사용할 수 있다.

`deadlock prevention`은 비교적 쉽게 확장된다.

- `lock ordering` 기반 기법은 node가 여러 개여도 cyclic lock wait 자체를 막으므로 그대로 사용 가능하다.
- `preemption`과 transaction rollback 기반 기법도 그대로 사용할 수 있다. 특히 `wait-die`는 여러 distributed system에서 사용된다. 단, rollback된 transaction은 원래 start time을 유지해야 starvation을 피할 수 있다.
- `timeout-based scheme`도 distributed system에서 특별한 변경 없이 동작한다.

`deadlock detection`은 더 어렵다. 각 node가 자기 local resource에 관련된 transaction만 알고 있기 때문이다. 일반적인 방식은 각 node가 `local wait-for graph`를 유지하고, 필요할 때 이를 합쳐 `global wait-for graph`를 구성하는 것이다.

![Figure 23.4](@/assets/images/cs-database-330-figure-23-4-page-1142.png)
*Figure 23.4 · PDF p. 1142 · site S1과 S2가 각각 유지하는 local wait-for graph*

local wait-for graph의 node는 해당 node의 local data item을 hold하거나 request 중인 모든 transaction이다. transaction `Ti`가 node `N2`의 resource를 요청했는데 `Tj`가 잡고 있다면, `N2`의 local wait-for graph에 `Ti -> Tj` edge가 삽입된다.

문제는 각 local graph에는 cycle이 없어도, union에는 cycle이 있을 수 있다는 점이다.

![Figure 23.5](@/assets/images/cs-database-331-figure-23-5-page-1142.png)
*Figure 23.5 · PDF p. 1142 · Figure 23.4의 local graph를 합치면 드러나는 global deadlock cycle*

`centralized deadlock detection approach`에서는 하나의 deadlock-detection coordinator가 local graph들의 union인 global wait-for graph를 구성한다. 여기서 중요한 구분은 다음과 같다.

| graph | 의미 |
|---|---|
| `real graph` | 어떤 순간의 실제 시스템 상태. 전지적 관찰자만 정확히 볼 수 있음 |
| `constructed graph` | coordinator가 message와 local graph snapshot으로 만든 근사 graph |

communication delay 때문에 constructed graph는 real graph와 완전히 같지 않을 수 있다. 그래도 detection algorithm은 “deadlock이 있으면 prompt하게 보고하고, 보고한 deadlock은 실제 deadlock이어야 한다”는 correctness를 목표로 한다.

global wait-for graph는 다음 시점에 재구성/갱신할 수 있다.

- local wait-for graph에 edge가 삽입되거나 삭제될 때마다.
- local graph에 여러 변화가 누적되었을 때 주기적으로.
- coordinator가 cycle-detection algorithm을 실행해야 할 때.

cycle이 발견되면 coordinator는 victim transaction을 선택하고, 관련 node들에게 rollback을 통지한다. 다만 distributed detection은 unnecessary rollback을 만들 수 있다.

![Figure 23.6](@/assets/images/cs-database-332-figure-23-6-page-1144.png)
*Figure 23.6 · PDF p. 1144 · edge 삽입/삭제 message 도착 순서 차이로 만들어질 수 있는 false cycle*

`false cycle`은 실제로는 deadlock이 없는데 constructed global graph에 cycle이 생기는 현상이다. 예를 들어 `T1 -> T2` edge 삭제 message보다 `T2 -> T3` edge 삽입 message가 먼저 coordinator에 도착하면, coordinator는 잠시 존재하지 않는 cycle `T1 -> T2 -> T3`를 볼 수 있다. 그러면 필요 없는 deadlock recovery가 시작될 수 있다. 다만 two-phase locking에서는 이런 false-cycle 상황이 발생하지 않으며, 실제 발생 가능성도 보통 성능을 크게 해칠 정도로 높지는 않다.

또 다른 unnecessary rollback은 실제 deadlock이 있었고 victim을 골랐지만, 동시에 다른 이유로 transaction 하나가 abort된 경우다. 그러면 victim까지 추가 rollback되어 하나만 rollback해도 됐을 일을 둘로 늘릴 수 있다.

#### 23.3.3 Leases

distributed locking에서 node가 lock을 잡은 채 fail하면 lock이 release되지 않아 data item이 논리적으로 inaccessible해질 수 있다. prepared state에서 exclusive lock을 잡은 transaction은 commit/abort decision 전까지 lock을 풀면 안 되지만, 많은 경우에는 이미 grant된 lock을 나중에 revoke해도 된다. 이때 유용한 개념이 `lease`다.

`lease`는 일정 시간 동안만 grant되는 lock이다. lease holder가 계속 lock을 잡고 싶으면 만료 전에 lock manager에 renewal request를 보내야 한다. 제때 renewal이 오면 lease가 연장되고, 시간이 지나도 renewal이 없으면 lease가 expire되어 lock이 release된다.

lease의 대표적 용도는 distributed protocol에서 coordinator가 한 명만 존재하도록 보장하는 것이다.

1. coordinator가 되고 싶은 node가 protocol 관련 data item에 exclusive lease를 요청한다.
2. lease를 얻으면 lease expiry까지 coordinator 역할을 한다.
3. 살아 있는 동안 만료 전에 renewal을 요청한다.
4. coordinator node가 죽거나 lock manager와 연결이 끊기면 renewal이 오지 않으므로 lease가 만료되고, 다른 node가 lease를 얻어 새 coordinator가 될 수 있다.

주의점은 clock synchronization이다. coordinator의 clock이 lock manager의 clock보다 느리면 coordinator는 아직 lease가 있다고 생각하는데 lock manager는 이미 expired라고 판단할 수 있다. 실제 시스템은 clock이 완전히 같을 수 없으므로, lock manager는 expiry 뒤에 clock inaccuracy를 고려한 extra wait time을 둔다.

또한 coordinator가 local clock을 보고 lease가 유효하다고 판단한 직후 action을 시작했더라도, action 수행 중 lease가 만료될 수 있다. message가 늦게 도착해 이미 lease를 잃은 coordinator의 message가 나중에 처리되는 문제도 있다. 이를 줄이기 위해 sender timestamp가 너무 오래된 message는 무시하고, action 시작 전 lease expiry가 최소 `t'` 이상 미래인지 확인한다. 여기서 `t'`는 lease check 후 action completion과 maximum message delay를 포함한 bound다.

#### 23.3.4 Distributed Timestamp-Based Protocols

timestamp-based concurrency control의 핵심은 각 transaction에 unique timestamp를 부여하고, 그 timestamp를 serialization order로 사용하는 것이다. distributed setting으로 확장하려면 먼저 system-wide unique timestamp를 만들어야 한다.

#### 23.3.5 Generation of Timestamps

unique timestamp 생성에는 중앙집중식과 분산식이 있다.

![Figure 23.7](@/assets/images/cs-database-333-figure-23-7-page-1146.png)
*Figure 23.7 · PDF p. 1146 · local unique timestamp와 site identifier를 결합한 global unique timestamp 생성*

| 방식 | 방법 | 장점 | 위험 |
|---|---|---|---|
| centralized timestamp | 한 node가 logical counter 또는 local clock으로 timestamp 배포 | 구현 쉬움 | timestamp node failure가 전체 transaction processing을 막을 수 있음 |
| distributed timestamp | 각 node가 local timestamp를 만들고 unique node identifier와 concatenate | single bottleneck 회피 | clock/counter skew로 serialization order가 편향될 수 있음 |

분산식에서는 global timestamp를 보통 `local timestamp + node identifier`로 만든다. node에 여러 thread가 있으면 thread identifier도 결합한다. 중요한 점은 node identifier를 least significant position에 두어야 한다는 것이다. 그래야 특정 node에서 만든 timestamp가 다른 node의 timestamp보다 항상 크거나 작아지는 편향을 줄일 수 있다.

local timestamp 생성 속도가 node마다 크게 다르면 fast node의 logical counter가 커져 그 node의 timestamp가 계속 뒤쪽 순서로 밀릴 수 있다. 이를 완화하는 방법은 두 가지다.

1. `network time protocol`로 clock을 주기적으로 동기화한다.
2. 각 node의 `logical clock (LCi)`을 message 교환에 맞춰 전진시킨다. transaction timestamp `<x, y>`를 가진 transaction이 node `Ni`를 방문했고 `x > LCi`이면, `LCi`를 `x + 1`로 올린다.

#### 23.3.6 Distributed Timestamp Ordering

`timestamp ordering protocol`은 distributed setting으로 비교적 쉽게 확장된다. transaction은 시작 node에서 globally unique timestamp를 받고, 다른 node에 보내는 request에 이 timestamp를 포함한다. 각 node는 자기 data item의 read/write timestamp를 locally 유지하고, operation을 받을 때 Chapter 18의 timestamp check를 local하게 수행한다. 다른 node와 추가 통신할 필요는 없다.

하지만 timestamp가 node 간에 어느 정도 동기화되어야 한다. 어떤 node의 clock이 크게 뒤처지면, 그 node에서 시작한 transaction이 계속 너무 오래된 timestamp를 받아 timestamp test에 실패하고 restart를 반복할 수 있다.

또 하나의 연결점은 2PC다. transaction `Ti`가 prepared state에 있으면 그 writes는 아직 committed가 아니다. 더 높은 timestamp의 transaction이 `Ti`가 쓴 item을 읽으려 하면, `Ti`가 commit할 때까지 기다려야 한다. 이는 read가 uncommitted value를 보지 않도록 하기 위한 것이고, distributed update에서는 2PC 시간이 기다림을 더 길게 만들 수 있다. `multiversion timestamp ordering`도 각 node에서 local하게 사용할 수 있다.

#### 23.3.7 Distributed Validation

`validation-based protocol`, 즉 optimistic concurrency control은 distributed setting에서 local validation을 수행하되, serialization order로 쓰는 validation timestamp `TS(Ti)`를 여러 node에서 동일하게 유지해야 한다.

검증에 쓰이는 timestamp는 세 가지다.

| timestamp | 의미 |
|---|---|
| `StartTS(Ti)` | transaction `Ti`가 시작한 시각 |
| `TS(Ti)` | validation timestamp이며 serialization order로 사용 |
| `FinishTS(Ti)` | transaction writes가 완료된 시각 |

distributed validation의 핵심 규칙은 다음과 같다.

- validation은 각 node에서 local하게 수행한다.
- `TS(Ti)`는 어느 node에서 배정해도 되지만, `Ti`가 validation되는 모든 node에서 같은 값을 사용해야 한다.
- validation test는 `TS(Tj) < TS(Ti)`인 transaction `Tj`들을 보며, `Tj`가 `Ti` 시작 전에 끝났거나 conflict가 없는지 확인한다.
- distributed setting에서는 `Ti`가 validation을 시작한 뒤에 더 낮은 timestamp의 `Tj`가 validation에 들어올 수 있다. 이를 막기 위해 어떤 node에서 validation 시작 시 이미 더 높은 timestamp transaction이 validation을 시작했다면 해당 transaction을 rollback한다.
- `StartTS(Ti) <= TS(Ti) <= FinishTS(Ti)` 관계를 만족하도록 start/finish timestamp를 node별로 관리한다.

2PC와 함께 쓰면 transaction은 먼저 validation을 통과한 뒤 prepared state로 들어간다. 실제 database write는 2PC에서 committed state가 된 후에 반영된다. prepared transaction의 update를 읽으려는 transaction은 old value를 읽고 진행해도 나중에 validation에서 실패할 가능성이 크므로, locking에서 write lock이 validation 시점에 잡히는 것처럼 commit/write 완료까지 기다리게 하는 편이 자연스럽다.

완전한 validation-based protocol은 distributed setting에서 널리 쓰이지 않지만, read validation 없는 제한적 optimistic concurrency control은 key-value store에서 흔하다. 각 data item에 `version number`를 두고, write 시점에 `test-and-set` 또는 `compare-and-set` 방식으로 “내가 읽은 version이 아직 현재 version이면 update”를 수행한다. 이 방식은 전체 serializability를 보장하지는 않지만 `lost-update anomaly`를 막는 데 유용하다. 예로 HBase의 `checkAndPut()`과 `checkAndMutate()`는 조건 검사와 update/mutation을 한 row에 대해 atomic하게 수행한다.

### 23.4 Replication

distributed database의 큰 목표 중 하나는 `high availability`다. 큰 분산 시스템에서는 failure가 흔하므로, DB는 node/link failure 중에도 계속 동작해야 한다. 이런 능력을 `robustness`라고 하며, 이를 위해 data를 여러 node에 `replicate`한다.

replication granularity는 두 가지가 가능하다.

| granularity | catalog 관리 방식 | trade-off |
|---|---|---|
| individual data item | 각 data item마다 replica 위치를 기록 | 세밀하지만 catalog overhead 큼 |
| relation partition | relation partition 단위로 replica 위치를 기록 | overhead가 낮아 대규모 시스템에 적합 |

이 절은 먼저 replica들의 value consistency를 정의하고, failure가 없다고 가정한 replica concurrency control을 본 뒤, failure가 있을 때 read/write를 어떻게 바꿔야 하는지 다룬다.

#### 23.4.1 Consistency of Replicas

이상적으로 replica들은 항상 같은 값을 가져야 한다. 하지만 node가 disconnected되거나 failed될 수 있는 현실에서는 모든 copy가 항상 같은 값을 갖도록 보장하기 어렵다. 대신 중요한 속성은 “일부 replica가 오래된 값을 갖더라도 read가 가장 최신 write 값을 보도록 만드는 것”이다.

이 절에서 formal하게 제시하는 속성은 `linearizability`다. 한 data item에 대한 read/write operation 집합이 있을 때 다음이 만족되어야 한다.

1. operation들을 어떤 linear order로 나열할 수 있고, 그 order에서 각 read는 자기 앞의 가장 최근 write 값을 읽어야 한다. 앞선 write가 없으면 initial value를 읽는다.
2. 외부 시간 기준으로 operation `o1`이 끝난 뒤 operation `o2`가 시작했다면, linear order에서도 `o1`이 `o2`보다 앞서야 한다.

`linearizability`는 단일 data item의 replica consistency 속성이다. 여러 data item에 걸친 transaction serializability와는 orthogonal하다. 즉 linearizable data item이 많다고 해서 multi-item transaction이 자동으로 serializable해지는 것은 아니다.

replica failure를 다루는 어려움은 node failure와 network partition을 일반적으로 구분할 수 없다는 데 있다. `N1`이 `N2`와 통신하지 못할 때, `N2`가 crash했는지 link failure 때문에 partition이 생겼는지 확실히 알기 어렵다. multiple links가 문제를 줄일 수는 있지만 multiple link failure까지 막지는 못한다.

replication protocol의 큰 갈림길은 다음과 같다.

| 방향 | 특징 | 적합한 경우 |
|---|---|---|
| strong consistency 중심 | majority read/write, synchronous update, consensus 등으로 latest value 보장 | 금융/메타데이터/lock service처럼 consistency가 핵심 |
| availability 중심 | `asynchronous replication`, `lazy propagation`으로 commit latency를 줄임 | web user data처럼 잠깐 stale해도 되는 workload |

`asynchronous replication`은 primary copy에 update를 적용하고 transaction을 commit한 뒤, 나중에 다른 copy로 update를 전파한다. 장점은 primary commit 직후 exclusive lock을 풀 수 있어 latency와 contention이 크게 줄어든다는 것이다. geo-replication에서는 remote data center round-trip이 수십~수백 ms일 수 있으므로, 모든 replica update를 기다리면 hot item의 update throughput이 대략 초당 10~100건 수준으로 제한될 수 있다.

단점은 replica가 한동안 out-of-date일 수 있고, primary가 commit 후 propagation 전에 fail하면 committed update가 이후 transaction에 보이지 않는 inconsistency가 생길 수 있다는 점이다.

#### 23.4.2 Concurrency Control with Replicas

이 절에서는 모든 replica에 update를 수행한다고 가정하고, failure/disconnection은 잠시 무시한다. failure가 있는 경우는 23.4.3에서 다룬다.

##### 23.4.2.1 Primary Copy

`primary copy` 방식에서는 data item `Q`의 replica 중 하나를 primary copy로 정하고, 그 replica가 있는 node를 `primary node of Q`라고 한다. transaction이 `Q`에 lock을 걸고 싶으면 primary node에 lock request를 보낸다.

장점은 replicated data의 concurrency control을 unreplicated data처럼 단순하게 처리할 수 있다는 점이다. 단점은 primary node가 fail하면 다른 replica가 살아 있어도 `Q`의 lock information을 잃어 `Q`가 inaccessible해질 수 있다는 것이다.

##### 23.4.2.2 Majority Protocol

`majority protocol`에서는 data item `Q`가 `n`개 node에 replicated되어 있을 때, transaction이 `Q`를 사용하려면 `n`개 중 과반수보다 많은 node에 lock request를 보내고, majority replica에서 lock을 얻어야 한다.

| 특징 | 설명 |
|---|---|
| lock 조건 | `Q` replica의 majority에서 lock 획득 |
| 장점 | decentralized, central control bottleneck 회피, failure 대응으로 확장 가능 |
| lock request cost | 최소 `2(n/2 + 1)` message |
| unlock cost | 최소 `(n/2 + 1)` message |
| deadlock 위험 | 여러 replica lock을 나누어 얻다가 단일 item에서도 deadlock 가능 |

단일 item deadlock 예는 replica가 4개이고 full replication일 때, `T1`이 `N1`, `N3`에서 exclusive lock을 얻고 `T2`가 `N2`, `N4`에서 lock을 얻는 경우다. 두 transaction 모두 세 번째 lock을 기다리며 deadlock에 빠진다. 해결책은 replica lock request 순서를 모든 transaction에 대해 동일한 predetermined order로 강제하는 것이다.

##### 23.4.2.3 Biased Protocol

`biased protocol`은 read에 유리하게 설계된 replica locking 방식이다.

| lock type | 요청 방식 |
|---|---|
| shared lock | `Q` replica가 있는 node 하나에만 request |
| exclusive lock | `Q` replica가 있는 모든 node에 request |

read frequency가 write보다 훨씬 높은 일반적 workload에서는 majority protocol보다 read overhead가 낮다. 대신 write overhead가 크고, deadlock handling 복잡성은 majority protocol과 비슷하게 남는다.

##### 23.4.2.4 Quorum Consensus Protocol

`quorum consensus protocol`은 majority protocol의 일반화다. 각 node에 nonnegative weight를 부여하고, item `x`에 대해 `read quorum Qr`과 `write quorum Qw`를 정한다. 전체 weight를 `S`라고 하면 다음을 만족해야 한다.

$$
Q_r + Q_w > S \quad\text{and}\quad 2Q_w > S
$$

read는 total weight가 `Qr` 이상인 replica들을 lock해야 하고, write는 total weight가 `Qw` 이상인 replica들을 lock해야 한다.

두 부등식의 의미는 교집합 보장이다. `Qr + Qw > S`는 read quorum과 write quorum이 반드시 겹치게 하여 read가 최신 write를 볼 수 있게 한다. `2Qw > S`는 두 write quorum이 반드시 겹치게 하여 concurrent write가 서로 독립적으로 성공하지 못하게 한다.

quorum을 조정하면 read와 write cost를 선택적으로 줄일 수 있다. `Qr`을 작게 만들면 read는 싸지만 `Qw`가 커져 write가 비싸지고, 반대로 write를 싸게 만들면 read가 비싸진다. weight를 특정 reliable node에 높게 주면 lock 획득에 필요한 node 수를 줄일 수도 있다. 적절한 설정으로 majority protocol과 biased protocol을 흉내 낼 수 있다.

#### 23.4.3 Dealing with Failures

단순한 `read one, write all copies protocol`은 모든 replica에 write하고 아무 replica에서나 read한다. two-phase locking과 결합하면 read가 같은 data item의 가장 최근 write 값을 보게 할 수 있다. 문제는 어떤 replica node가 unavailable할 때다.

직관적으로는 `read one, write all available`이 좋아 보인다. available replica에는 모두 write하고 down node는 기다리지 않는 방식이다. 하지만 consistency를 보장하지 못한다.

- temporary communication failure 때문에 write를 못 받은 node가 나중에 돌아와도, 자신이 놓친 update를 모를 수 있다.
- network partition이 생기면 각 partition이 다른 partition node들을 죽었다고 생각하고 같은 item을 독립적으로 update할 수 있다.

##### 23.4.3.1 Robustness Using the Majority-Based Protocol

majority-based approach는 failure 중에도 동작하도록 확장할 수 있다. 핵심은 각 data object에 `version number`를 저장해 가장 최근 write를 식별하는 것이다.

| operation | 동작 |
|---|---|
| write 준비 | object `a` replica 과반수에 lock request를 보내고 majority lock을 얻을 때까지 대기 |
| read | lock을 얻은 replica들을 모두 보고 가장 높은 version number의 value를 읽음 |
| optional read repair | 낮은 version replica에 최신 value를 다시 써서 따라잡게 할 수 있음 |
| write | replica들의 highest version을 읽고, new version을 highest+1로 정해 lock을 얻은 replica들에 write |

failure나 partition이 있어도 다음 조건을 만족하면 transaction은 진행 가능하다.

- commit 시점에 write 대상 object들의 replica majority가 available해야 한다.
- read 시점에도 replica majority를 읽어 version number를 비교해야 한다.

이 조건이 깨지면 transaction은 abort되어야 한다. 조건이 만족되면 available node들에 대해 보통처럼 2PC를 사용할 수 있다. 이 방식에서는 reintegration이 단순하다. write는 majority를 update했고 read도 majority를 읽으므로, stale replica가 섞여 있어도 최신 version을 가진 replica 하나 이상을 만난다.

한계도 있다.

1. 2PC 중 participant가 fail할 수 있다. 확장된 2PC는 partition replica의 majority가 prepared state를 확인하면 commit을 허용할 수 있고, 나중에 recovery/reconnection된 participant가 missing update를 따라잡게 한다.
2. coordinator failure는 여전히 2PC blocking problem을 만들 수 있다. 23.8의 consensus protocol은 majority가 살아 있고 연결되어 있으면 coordinator failure에도 nonblocking 2PC 구현을 가능하게 한다.
3. read가 majority copy를 접촉해야 하므로 비용이 크다.

##### 23.4.3.2 Reducing Read Cost

read cost를 줄이는 첫 번째 방법은 quorum consensus의 `read quorum`/`write quorum`을 조정하는 것이다. read quorum을 작게 하면 read는 싸지지만 write quorum이 커져 update transaction이 failure/disconnection 때문에 block될 가능성이 커진다. 극단적으로 모든 node weight를 1, `Qr = 1`, `Qw = n`으로 두면 `read-any-write-all` protocol이 된다. 이때 version number는 필요 없지만 replica 하나만 fail해도 write가 진행될 수 없다.

두 번째 방법은 `primary copy` technique을 쓰고 모든 update가 primary copy를 지나가게 하는 것이다. read는 한 node만 보면 되므로 majority/quorum보다 싸다. 하지만 primary copy node가 fail해 다른 node가 primary가 되려면, 새 primary가 모든 data item의 latest version을 갖고 있음을 보장해야 한다. 이를 위해 node별 log를 두고 서로 consistent하게 유지해야 하며, 이 문제는 nontrivial하지만 23.8의 distributed consensus로 해결할 수 있다.

consensus로 log를 동기화하면 version number 없이도 fault-tolerant replication을 구현할 수 있다. 오늘날 많은 fault-tolerant storage system은 consensus 기반 replicated log를 사용한다.

또 다른 변형은 `chain replication protocol`이다. replica들을 순서대로 놓고 update를 첫 replica에 보내면, 첫 replica가 local 기록 후 다음 replica로 forwarding한다. update는 마지막 `tail replica`가 받을 때 완료된다. read는 fully replicated update만 보도록 tail replica에서 수행해야 한다. chain 중 node가 fail하면 chain reconfiguration이 필요하고, incomplete update를 마무리한 뒤 새 update를 처리해야 한다.

#### 23.4.4 Reconfiguration and Reintegration

node가 영구적으로 fail하면 system은 `reconfiguration`을 수행해 failed node를 제거하고, 그 node가 맡던 task를 다른 node가 가져가게 해야 한다. database catalog에서도 해당 node를 replica 목록에서 제거해야 한다.

network failure 때문에 실제로는 살아 있는 node가 failed처럼 보일 수 있다. 이런 node를 replica list에서 제거하는 것은 consistency 관점에서는 안전하다. read가 그 node로 routing되지 않을 뿐, consistency를 깨지는 않는다.

제거된 node가 나중에 recover되면 `reintegration`이 필요하다. 해당 node가 어떤 partition/data item replica를 갖고 있었다면 현재 값을 다시 얻어야 한다. live site의 database recovery log를 이용해 node가 down된 동안의 update를 찾아 적용한다.

reintegration이 까다로운 이유는 node가 catch-up하는 동안에도 해당 data item에 새 update가 들어올 수 있기 때문이다. 일반적인 절차는 관련 partition/data item에 lock을 얻고, 그 시점까지의 update를 log로 적용한 뒤, node를 replica list에 다시 추가하고 lock을 release하는 것이다. 이후 update는 replica list에 들어간 node로 직접 전파된다.

majority-based protocol에서는 reintegration이 더 쉽다. stale data를 가진 node도 protocol이 tolerate할 수 있으므로, 완전히 catch-up하기 전에도 reintegrate한 뒤 나중에 missed update를 따라잡을 수 있다.

마지막으로 catalog 자체도 distributed consistency 문제가 있다. 어떤 table partition/data item이 어느 node에 replicated되어 있는지 모든 node가 일관되게 알아야 한다. catalog를 중앙에 두고 매 access마다 묻는 방식은 bottleneck이 되므로, catalog 자체도 partition되고 필요하면 majority protocol 등으로 replicated되어야 한다.

### 23.5 Extended Concurrency Control Protocols

이 절은 distributed concurrency control을 세 방향으로 더 확장한다.

- `multiversion 2PL (MV2PL)`을 distributed setting에서 쓰면서 globally consistent timestamp를 얻는 방법.
- `snapshot isolation`을 여러 node에 걸쳐 적용할 때 생기는 anomaly와 보완 방향.
- 각 node가 서로 다른 DBMS와 concurrency-control mechanism을 가질 수 있는 `federated database system`에서 global serializability를 보장하는 문제.

#### 23.5.1 Multiversion 2PL and Globally Consistent Timestamps

`multiversion two-phase locking (MV2PL)`은 read-only transaction에는 lock-free snapshot read를 제공하고, update transaction에는 two-phase locking 기반 serializability를 제공한다. 각 transaction `Ti`는 commit 시점에 unique `CommitTS(Ti)`를 받고, 자신이 update한 모든 item version의 timestamp를 그 값으로 설정한다. centralized setting에서는 한 순간에 하나의 transaction만 commit하도록 만들 수 있어, `StartTS(Tj) = CommitTS(Ti)`인 read-only transaction이 `CommitTS(Ti)` 이하의 committed version들을 일관되게 보게 할 수 있다.

distributed setting에서 간단한 방법은 central coordinator가 start/commit timestamp를 배정하고 한 번에 하나의 commit만 허용하는 것이다. 하지만 massively parallel storage system에서는 central coordinator가 scalability limit이 된다.

책은 Google Spanner가 개척한 real clock time 기반 scalable MV2PL 아이디어를 설명한다. 완벽한 clock과 즉시 commit이라는 비현실적 가정이 있다면 protocol은 매우 단순하다.

1. update transaction이 모든 lock을 얻는다.
2. lock을 release하기 전에 아무 node의 clock을 읽어 commit timestamp로 사용한다.
3. update로 만든 모든 version에 이 commit timestamp를 붙인다.
4. read-only transaction은 시작할 때 clock을 읽고 그 time 기준 snapshot을 읽는다.

현실에서는 두 문제가 생긴다.

| 문제 | 왜 문제가 되는가 |
|---|---|
| clock inaccuracy | node마다 clock이 조금 빠르거나 느려서 실제 write order와 commit timestamp order가 어긋날 수 있음 |
| commit duration | commit processing이 오래 걸리면 read-only transaction이 자기 timestamp 이하로 commit 중인 update를 놓칠 수 있음 |

Spanner는 이를 위해 `TrueTime`, `epsilon (ϵ)`, `commit wait`, `external consistency`를 사용한다.

| 개념 | 역할 |
|---|---|
| `true time` | 완벽한 clock이 알려줬을 실제 시간이라는 개념적 시간 |
| `TrueTime API` | 현재 시간 추정값과 uncertainty upper bound를 함께 제공 |
| `ϵ` | local clock time `t'`에 대해 true time `t`가 `t' - ϵ <= t <= t' + ϵ` 범위에 있음을 보장하는 uncertainty |
| `commit wait` | commit timestamp를 `t' + ϵ`로 잡고, true time이 그 timestamp 이상임이 확실해질 때까지 lock을 잡은 채 대기 |
| `external consistency` | transaction serialization order가 real-world commit time order와 일치하는 속성 |

`commit wait`의 핵심 보장은 transaction `T1`의 commit timestamp가 `tc`라면 true time `tc` 시점에 `T1`이 모든 lock을 갖고 있었다는 것이다. 그래서 timestamp `t`가 붙은 version `x_t`는 “true time `t`의 x 값”이라고 말할 수 있고, 그 결과 time `t`의 database snapshot을 정의할 수 있다.

남는 문제는 commit processing 중인 transaction이다. read-only transaction이 timestamp `t1`의 snapshot을 요청했는데 timestamp `t <= t1`인 transaction이 2PC prepared phase에 있으면, 그 transaction이 commit될지 abort될지 아직 모른다. 그러므로 read는 `t1` 이하 timestamp의 transaction들이 더 이상 commit 중이 아님이 확실할 때까지 기다려야 한다. 기다림을 피하려면 read-only transaction에 조금 더 과거 timestamp를 줄 수 있는데, 그러면 최신 version 일부를 보지 못하는 trade-off가 생긴다.

#### 23.5.2 Distributed Snapshot Isolation

`snapshot isolation`은 실무에서 널리 쓰이지만 serializability를 보장하지는 않는다. 단일 node snapshot isolation은 여러 anomaly를 막아 주지만, 각 node가 독립적으로 snapshot isolation을 수행하면 centralized system에서는 없던 anomaly가 생긴다.

예를 들어 `T1`과 `T2`가 node `N1`에서 동시에 실행되고, `T1`이 `x`를 쓰고 `T2`가 `x`를 읽는다고 하자. snapshot isolation상 `T2`는 `T1`의 `x` update를 보지 않는다. 그런데 `T1`이 node `N2`의 `y`도 update하고 commit한 뒤, `T2`가 `N2`에서 `y`를 읽으면 `T2`는 `T1`의 `y` update는 볼 수 있다. 결과적으로 `T2`는 같은 transaction `T1`의 update 중 `x`는 못 보고 `y`는 보는 분산 snapshot 불일치가 생긴다. 단일 node snapshot isolation에서는 이런 상태가 발생하지 않는다.

따라서 distributed snapshot isolation은 local enforcement만으로 충분하지 않고, global transaction에 대해 추가 coordination 또는 dependency 관리가 필요하다. 일부 protocol은 local transaction은 global coordination 없이 실행하게 하고, 여러 node에 걸친 global transaction에만 추가 비용을 부과한다. SAP HANA, HBase 같은 system에서 prototype된 protocol들이 있다.

distributed snapshot isolation을 serializable하게 만들려는 연구도 있다. 접근 방식에는 timestamp ordering과 유사한 timestamp check, central server에서 transaction dependency graph를 만들고 cycle을 검사하는 방식 등이 포함된다.

#### 23.5.3 Concurrency Control in Federated Database Systems

`federated database system`, 또는 `heterogeneous distributed database system`은 이미 존재하는 여러 database system을 상위 software layer로 연결한 시스템이다. 각 local system은 자기 schema와 DBMS software를 가질 수 있고, federated layer가 그 위에서 global query/transaction을 제공한다.

transaction은 두 종류로 나뉜다.

| 종류 | 의미 |
|---|---|
| `local transaction` | 각 local database system이 federated system 통제 밖에서 실행하는 transaction |
| `global transaction` | federated database system의 통제 아래 여러 local system에 걸쳐 실행되는 transaction |

federated system은 local node에서 local transaction이 실행될 수 있음을 알지만, 어떤 transaction이 어떤 data를 접근하는지는 모를 수 있다. 또한 local autonomy를 보장하려면 기존 DBMS software를 고치지 않아야 하므로, 한 local DBMS가 다른 local DBMS와 직접 통신해 global transaction execution을 맞추기도 어렵다.

각 local system이 자기 schedule을 serializable하게 만든다고 해서 global serializability가 보장되지는 않는다. 예를 들어 global transaction `T1`, `T2`가 node `N1`의 `A`, node `N2`의 `B`를 모두 접근한다고 하자. `N1`에서는 `T2`가 `T1` 뒤에 serialize되고, `N2`에서는 `T1`이 `T2` 뒤에 serialize될 수 있다. local schedule은 각각 serializable하지만, global order는 cycle이 되어 nonserializable이다.

만약 모든 local system이 lock behavior를 외부에서 제어할 수 있고 모두 two-phase locking을 따른다면, federated layer가 global transaction의 lock point를 맞춰 global serialization order를 정할 수 있다. 그러나 local systems가 다른 concurrency-control mechanism을 쓰거나, subtransaction이 한 local system에서 먼저 commit되어 lock을 풀어 버리면 이런 직접 제어가 어렵다.

global serializability를 보장하기 위한 한 방법은 `ticket`이다. 각 local database system에 특별한 data item인 ticket을 만들고, 그 node의 data를 접근하는 모든 global transaction이 해당 ticket을 write하게 한다. 그러면 global transactions는 방문하는 모든 node에서 직접 conflict하게 되고, global transaction manager는 ticket 접근 순서를 제어함으로써 global serialization order를 조정할 수 있다.

### 23.6 Replication with Weak Degrees of Consistency

앞 절의 replication protocol들은 node/network failure가 있어도 consistency를 보장하려 한다. 하지만 비용이 작지 않고, 많은 node가 fail하거나 network partition으로 disconnected되면 block될 수 있다. 특히 majority partition에 속하지 않은 node는 write뿐 아니라 read quorum 설정에 따라 read도 못 할 수 있다. 이 절은 availability를 더 높이기 위해 consistency를 약화하는 선택을 다룬다.

#### 23.6.1 Trading Off Consistency for Availability

majority/quorum 기반 protocol은 update를 진행하려면 어떤 partition에 weighted majority가 있어야 한다. partition이 셋 이상으로 쪼개지면 어느 partition도 majority를 갖지 못해 update가 완전히 unavailable해질 수 있다. `write-all-available`은 availability는 주지만 consistency는 주지 않는다.

이 trade-off를 정리한 것이 `CAP theorem`이다. distributed database는 다음 세 속성 중 최대 두 개만 동시에 가질 수 있다.

| CAP 속성 | 의미 |
|---|---|
| `Consistency` | replicated data에 대한 read/write 결과가 각 process의 operation order와 일관된 단일 node sequential execution처럼 보여야 함 |
| `Availability` | 요청을 받은 nonfailed node가 응답할 수 있어야 함 |
| `Partition-tolerance` | network partition이 발생해도 system이 정의된 방식으로 동작해야 함 |

대규모 distributed system에서는 partition을 완전히 막을 수 없으므로, partition 상황에서는 consistency와 availability 중 하나를 희생해야 한다. banking database처럼 ACID가 중요한 시스템은 availability를 희생하고 consistency를 선택한다. social-networking system처럼 잠깐 inconsistency를 견딜 수 있는 시스템은 접근 가능한 replica에 update를 허용하는 쪽을 선택할 수 있다.

이런 availability 우선 시스템은 흔히 `BASE` properties를 요구한다고 표현한다.

| BASE 속성 | 의미 |
|---|---|
| `Basically available` | partition 중에도 가능한 한 서비스가 응답 |
| `Soft state` | replica마다 상태가 잠시 다를 수 있음 |
| `Eventually consistent` | partition이 해소되고 시간이 지나면 replica들이 결국 consistent해짐 |

eventual consistency를 달성하려면 inconsistent copy를 찾아야 한다. 한 copy가 다른 copy의 이전 version이면 최신 version으로 교체하면 된다. 그러나 두 copy가 같은 base copy에서 독립적으로 update된 결과라면 conflict가 있고, 이를 detection한 뒤 application 의미에 맞게 merge/reconcile해야 한다. 이 절의 `version-vector scheme`은 그런 inconsistent update detection을 다루고, `reconciliation`은 23.6.5에서 다룬다.

Apache Cassandra, MongoDB 같은 일부 key-value/store 계열 시스템은 read/write에 필요한 replica 수를 application이 정하게 한다. majority 이상이면 consistency 문제가 작지만, majority 미만으로 낮추면 partition 중에도 update가 가능해지는 대신 나중에 conflict를 해결해야 한다.

#### 23.6.2 Asynchronous Replication

`asynchronous replication`은 update를 `primary node` 또는 `master node`에 먼저 적용하고, transaction은 primary에서 update가 끝나면 commit할 수 있게 한다. 다른 replica로의 update 전파는 commit 이후 나중에 수행된다. 이를 `lazy propagation`이라고도 한다. 반대로 `synchronous replication`은 update propagation을 하나의 transaction 일부로 수행한다.

asynchronous replication의 핵심 보장은 primary에서 transaction이 commit되면, 중간 failure가 있어도 update가 결국 모든 replica에 전달되어야 한다는 것이다. 책은 이를 persistent messaging으로 보장할 수 있다고 설명한다.

| 장점 | 비용/위험 |
|---|---|
| update transaction commit latency 감소 | replica read가 stale data를 볼 수 있음 |
| local/nearby replica에서 read하여 query load 분산 | primary failure가 propagation 전에 발생하면 missing update 위험 |
| data warehouse/analytics query가 primary transaction workload를 방해하지 않음 | 여러 replica를 읽고 쓰면 read-your-writes/monotonic reads가 깨질 수 있음 |

일부 system은 version timestamp를 두고, transaction이 “10분 이하로 오래된 version” 같은 freshness requirement를 지정하게 한다. local replica가 requirement를 만족하면 local read를 하고, 아니면 primary로 read를 보낸다. 항공권 가격처럼 몇 분 전 가격을 보여줘도 실제 구매 시점에 다시 확인하는 application에는 이런 방식이 적합하다.

MVCC와 결합하면 replica가 최신 version을 모두 갖고 있지 않아도 transaction-consistent snapshot을 줄 수 있다. replica는 어떤 timestamp `t_safe` 이전의 모든 commit update를 받았는지 알고 있어야 한다. snapshot timestamp `t < t_safe`인 read는 그 replica에서 처리할 수 있다. 이 아이디어는 Spanner에서도 사용된다.

asynchronous replication의 형태는 여러 가지다.

- `master-slave replication`: replica는 직접 update하지 않고 master가 보낸 update만 적용한다. 큰 query를 replica에서 실행해 primary workload와 분리할 수 있다.
- periodic propagation: data warehouse처럼 nightly batch로 update를 전파해 query processing과 충돌을 줄인다.
- `multimaster replication` 또는 `update-anywhere replication`: 어느 replica에서도 update를 허용하고, update를 synchronous 2PC 또는 asynchronous propagation으로 다른 replica에 전달한다.
- partitioned distributed storage: 각 partition마다 primary node가 있고, update는 primary에서 commit된 뒤 partition replica들로 전파된다. PNUTS처럼 data item별 primary를 사용자와 지리적으로 가까운 node로 선택할 수도 있다.

update message는 반드시 reliable하고 ordered하게 전달되어야 한다. 같은 primary의 여러 update가 replica에 out-of-order로 도착하면 늦게 도착한 earlier update가 later update를 덮어쓸 수 있다. `persistent messaging`은 guaranteed delivery와 ordered delivery를 제공하도록 쉽게 확장할 수 있다. `publish-subscribe system`도 partition마다 topic을 만들고, replica가 해당 topic을 subscribe하게 하여 scalable asynchronous replication을 지원한다. Apache Kafka, Yahoo Message Bus 같은 시스템이 이런 역할을 한다.

primary failure는 별도 문제다. primary가 update를 기록했지만 replica로 보내기 전에 fail하면 새 primary는 마지막 committed update가 무엇인지 모를 수 있다. 해결책 중 하나는 Section 19.7의 `two-safe protocol`처럼 primary log record를 backup node에 복제한 뒤에야 commit을 허용하는 것이다. 이 방식은 한 node failure에는 견디지만 두 node failure에는 취약하다.

normal operation 중에는 application anomaly를 줄이기 위한 주의도 필요하다. 같은 data item에 대한 특정 node의 read/write를 항상 같은 replica로 보내면, 자기 write를 이후 read에서 보는 `read-your-writes`와 뒤의 read가 앞의 read보다 오래된 version을 보지 않는 성질을 보장하기 쉽다. primary replica를 모든 action에 사용하면 이 성질이 자연스럽게 보장된다.

#### 23.6.3 Asynchronous View Maintenance

index와 materialized view는 base data에서 파생된 data이므로 replica의 한 형태로 볼 수 있다. base data update transaction 안에서 index/view를 함께 maintain하면 consistency는 좋지만 update overhead가 커진다. 많은 system은 transaction overhead를 줄이기 위해 index와 materialized view를 asynchronously maintain한다. 그러면 index/view는 out-of-date일 수 있고, 이를 사용하는 transaction은 그 가능성을 알아야 한다.

asynchronous view maintenance에는 세 요구가 있다.

| 요구 | 설명 |
|---|---|
| exactly-once update delivery | view maintenance subsystem이 base relation update를 failure에도 정확히 한 번 받아야 함 |
| eventual derived-data consistency | update가 충분히 멈추면 derived data가 underlying data와 consistent해져야 함 |
| consistent read view | 여러 node를 읽는 query가 transactionally/operation-consistent view를 보도록 해야 함 |

첫 요구에는 publish-subscribe system이 잘 맞는다. base relation update를 relation name 또는 tablet/partition topic으로 publish하고, view maintenance subsystem이 필요한 topic을 subscribe한다.

둘째 요구는 즉시 consistency가 아니라 `eventual consistency`로 formalize된다. base data가 계속 update될 수 있으므로 asynchronous maintenance가 모든 순간에 view state와 base state를 같게 만들 수는 없다. 하지만 일정 시간 update가 없으면 derived data는 base data와 일치해야 한다. Section 22.7.5의 exchange operator 기반 parallel materialized view maintenance처럼 update를 node에 보내 local view maintenance를 수행할 수 있고, Section 16.5.1의 deferred view maintenance 기법도 각 node에서 사용할 수 있다.

셋째 요구는 더 까다롭다. query가 여러 node를 읽을 때 transaction `T`가 `N1`에서 수행한 update는 못 보고 `N2`에서 수행한 update는 보는 식의 transactionally inconsistent view가 생길 수 있다. 또한 operation consistency도 깨질 수 있다. 예를 들어 relation `r(A, B, C)`가 `B`로 partition되고, tuple `t1`의 `B`가 `v1`에서 `v2`로 바뀌면 old partition delete와 new partition insert가 비동기 전파된다. scan이 delete 후 old partition을 읽고 insert 전 new partition을 읽으면 tuple을 아예 놓치고, 반대 순서면 두 version을 모두 볼 수 있다. MVCC가 있다면 충분히 과거의 snapshot timestamp를 사용해 그 timestamp까지의 update가 모든 replica에 도달했음을 보장하는 방식이 consistent scan에 유리하다.

#### 23.6.4 Detecting Inconsistent Updates

availability를 위해 partition 중 local update를 허용하면, 나중에 connection이 회복될 때 conflicting update를 detection하고 resolution해야 한다. mobile device의 offline update도 같은 문제다. 한 device가 local cache를 update하는 동안 다른 device나 server가 같은 data item을 update하면, reconnect 시 conflict가 생긴다.

단일 node만 update하는 data item은 reconnect 시 update를 전파하면 된다. read-only cache만 가진 node에는 invalidation report를 보내 stale cache entry를 알릴 수 있다. 하지만 여러 node가 같은 item을 update할 수 있으면 conflict detection이 필요하다.

`version-vector scheme`은 replica들이 같은 data item을 독립적으로 update했는지 detection한다. 각 node `i`는 자기 data item `d` copy와 함께 version vector `{V[j]}`를 저장한다. 각 entry는 node `j`에서 발생한 update count를 나타낸다. node `i`가 `d`를 update하면 `V[i]`를 1 증가시킨다.

예를 들어 data item이 `N1`, `N2`, `N3`에 replicated된다고 하자.

| 사건 | version vector |
|---|---|
| item이 `N1`에서 생성 | `[1, 0, 0]` |
| `N2`로 replicated 후 `N2`가 update | `[1, 1, 0]` |
| 그 version이 `N3`로 가고, 이후 `N2`와 `N3`가 concurrent update | `N2`: `[1, 2, 0]`, `N3`: `[1, 1, 1]` |

두 node의 version vector `Vi`, `Vj`를 비교하는 규칙은 다음과 같다.

| 조건 | 의미 | 조치 |
|---|---|---|
| 모든 `k`에 대해 `Vi[k] = Vj[k]` | 두 copy가 동일 | 교체 불필요 |
| 모든 `k`에 대해 `Vi[k] <= Vj[k]`, 같지는 않음 | `i` copy가 `j` copy보다 오래됨 | `i`가 `j`의 data와 vector로 교체 |
| 어떤 `k`, `m`에 대해 `Vi[k] < Vj[k]`이고 `Vi[m] > Vj[m]` | 서로 전파되지 않은 독립 update가 있음 | inconsistent/conflicting update로 detection |

conflict를 merge한 뒤에는 각 entry를 `max(Vi[k], Vj[k])`로 합치고, merge/write를 수행한 node `l`이 `V[l]`을 1 증가시킨다. version vector는 single data item conflict detection에는 좋지만, 많은 replicated item 중 어떤 item이 달라졌는지 찾는 데는 비싸다. 이를 효율화하는 data structure가 `Merkle tree`다.

#### 23.6.5 Resolving Conflicting Updates

conflict detection은 read가 여러 replica를 fetch할 때나 background comparison process가 data item version을 비교할 때 발생한다. detection 이후에는 single common version을 만들어야 하며, 이를 `reconciliation`이라고 한다.

모든 application에 통하는 일반 reconciliation 기법은 없다. application 의미가 중요하다.

| 해결 방식 | 가능한 경우 | 예시 |
|---|---|---|
| operation replay/merge | update operations가 commute할 때 | shopping cart에 item 추가 |
| domain-specific compensation | 물리세계 action이 이미 일어난 경우 | offline ATM withdrawal 후 account balance 반영 |
| human intervention | 자동 merge가 위험하거나 의미를 알 수 없을 때 | 문서/업무 데이터 conflict 수동 해결 |

commutative operation은 실행 순서가 바뀌어도 같은 결과를 만든다. cart에 item을 추가하는 작업은 대체로 commute하지만, delete와 add는 일반적으로 commute하지 않는다. ATM withdrawal은 여러 withdrawal의 merge 순서가 달라도 최종 balance가 같을 수 있지만, 이미 현금을 지급한 뒤라 negative balance를 이유로 작업을 거절할 수는 없고 별도 처리해야 한다.

#### 23.6.6 Detecting Differences Between Collections Using Merkle Tree

`Merkle tree`, 또는 `hash tree`는 서로 다른 replica에 저장된 data item 집합의 차이를 효율적으로 찾는 data structure다. weak consistency 때문에 생긴 차이를 찾는 데도 쓰이고, consensus나 synchronous update를 쓰는 system에서 bug/failure로 replica가 달라졌는지 sanity check하는 데도 쓰인다.

![Figure 23.8](@/assets/images/cs-database-334-figure-23-8-page-1173.png)
*Figure 23.8 · PDF p. 1173 · data item key/value hash를 leaf와 internal node hash로 축약한 Merkle tree 예*

binary Merkle tree 구성은 다음과 같다.

- 각 data item은 key와 value를 갖는다. 명시적 key가 없으면 value 자체를 key처럼 쓸 수 있다.
- key `ki`를 hash function `h1()`로 n-bit leaf identifier에 mapping한다. `2^n`은 data item 수와 비슷한 규모로 잡는다.
- value `vi`는 `h2()`로 긴 hash value를 만든다.
- leaf `k`는 `h1(ki) = k`인 item들의 value hash collection에 `h3()`를 적용해 leaf hash를 저장한다. `h3()`는 input order에 의존하지 않아야 하므로, hash collection을 정렬한 뒤 계산할 수 있다.
- internal node hash는 child node들의 stored hash에 `h3()`를 적용해 만든다.

두 replica에서 같은 Merkle tree를 만들었을 때 root hash가 같으면, 충분히 좋은 hash function을 쓴다는 가정 아래 그 subtree 아래 data items가 동일하다고 볼 수 있다. root hash가 다르면 child hash를 비교하며 다른 child만 내려가고, leaf에 도달하면 해당 leaf에 mapping된 data item keys와 values를 직접 비교한다.

비용은 차이가 적을수록 매우 작다. 두 replica의 전체 item 수를 `N`, 다른 item 수를 `m`이라고 하면, binary tree에서 차이를 찾는 전체 비용은 대략 `O(m log2 N)`이다. K-ary wider tree를 쓰면 traversal depth는 `logK N`으로 줄지만, 각 node에서 전송할 child hash 정보가 늘어난다. network latency가 bandwidth보다 큰 병목이면 wider tree가 유리할 수 있다.

Merkle tree의 원래 용도는 malicious corruption detection이었다. root hash를 digitally signed해 두면, private key가 없는 공격자는 root signature와 맞는 대체 data를 만들기 어렵다. 전체 relation 검증은 leaf부터 root까지 hash를 재계산해 signed root hash와 비교하고, 단일 item 검증은 해당 leaf에서 root까지 path hash를 재계산해 root와 비교한다.

### 23.7 Coordinator Selection

앞 절들의 여러 algorithm은 `coordinator`를 필요로 한다. coordinator node가 fail하면 system은 다른 node에서 coordinator를 다시 시작해야 한다. 방법은 크게 두 가지다.

- `backup coordinator`를 미리 유지해 failure 시 즉시 takeover한다.
- 살아 있는 node들 사이에서 새 coordinator를 `elect`한다.

#### 23.7.1 Backup Coordinator

`backup coordinator`는 평소 자기 일도 하면서, coordinator가 fail했을 때 즉시 coordinator 역할을 맡을 수 있을 만큼의 state를 유지하는 node다. coordinator에게 가는 모든 message는 실제 coordinator와 backup coordinator가 함께 받는다. backup은 actual coordinator와 같은 algorithm을 실행하고 internal state, 예를 들어 concurrency coordinator의 lock table을 동일하게 유지한다. 다만 다른 node에 영향을 주는 action은 실제 coordinator만 수행한다.

backup coordinator의 trade-off는 명확하다.

| 장점 | 단점 |
|---|---|
| coordinator failure 후 거의 즉시 processing 계속 가능 | coordinator task를 중복 실행하는 overhead |
| 새 coordinator가 모든 node에서 state를 수집할 필요가 적음 | coordinator와 backup이 지속적으로 synchronize해야 함 |
| failed coordinator만 알고 있던 정보 때문에 active transaction을 대량 abort하는 상황을 줄임 | normal processing 비용을 recovery 속도와 맞바꿈 |

즉 backup-coordinator approach는 평상시 overhead를 지불해 coordinator failure recovery delay를 줄이는 방식이다.

#### 23.7.2 Election of Coordinator

designated backup이 없거나 multiple failure를 처리해야 한다면 live node들이 동적으로 새 coordinator를 선택해야 한다. 단순히 “특정 node가 새 coordinator를 지정한다”는 방식은 그 지정 node가 fail하면 다시 문제가 된다.

fault-tolerant lock manager가 있다면 `lock lease`가 매우 효과적이다. task와 연결된 data item에 current coordinator가 lock lease를 갖고 있고, coordinator가 fail하면 lease가 expire된다. participant가 coordinator failure를 의심하면 task lease 획득을 시도하고, lock manager는 하나만 lease를 얻게 하므로 lease holder가 새 coordinator가 된다. 문제는 fault-tolerant lock manager 자체를 구현하려면 또 coordinator가 필요하다는 순환이다. 그래서 lock manager에 의존하지 않는 `election algorithm`이 필요하다.

election의 기본 역할은 다음과 같다.

| 역할 | 의미 |
|---|---|
| `proposer` | coordinator가 되고 싶다고 자신을 candidate로 제안하는 node |
| `acceptor` | candidate 중 누구를 coordinator로 선택할지 vote하는 participating node |
| `learner` | acceptor의 vote를 모아 majority가 특정 candidate를 선택했는지 알아내는 node |

한 candidate가 acceptor majority vote를 얻으면 coordinator로 선택된다. 문제는 candidate가 여러 명이면 누구도 majority를 얻지 못할 수 있다는 점이다. 대표적 해결 방향은 두 가지다.

| 방식 | 아이디어 | 특징 |
|---|---|---|
| numbered candidate / `bully algorithm` | node마다 unique number를 두고, 여러 candidate가 있으면 acceptor가 가장 높은 번호 candidate를 선호 | highest-numbered candidate가 결국 이기도록 유도하지만 round/failure 세부가 미묘함 |
| `randomized retry` | majority가 안 나오면 각 participant가 random timeout만큼 기다린 뒤 다시 candidacy 제안 | network latency보다 timeout이 충분히 크면 한 node만 제안할 확률이 높고, Raft가 대중화 |

election은 한 번으로 끝나지 않는다. coordinator가 나중에 fail할 수 있으므로, 각 proposal round를 `term`으로 관리한다. node가 candidate로 자신을 제안할 때 지금까지 본 가장 큰 round보다 1 큰 term을 붙인다. election이 성공하면 해당 term의 coordinator가 정해진다. 실패한 term은 coordinator 없이 지나가고, 다음 term에서 다시 시도한다.

network disconnection 때문에 subtle issue가 생긴다. 어떤 node가 한동안 disconnected되었다가 자신이 disconnected된 줄 모르고 돌아올 수 있다. 그 node가 과거 coordinator였다면 계속 coordinator라고 생각할 수 있고, 다른 disconnected node도 그 node를 coordinator라고 생각할 수 있다. 동시에 majority는 다른 node를 새 coordinator로 뽑았을 수 있다. 일반적으로 여러 node가 스스로 coordinator라고 생각하는 순간은 가능하지만, 특정 시점에 majority vote를 가진 coordinator는 최대 하나여야 한다.

이를 위해 coordinator에게 lease를 부여하고, majority confirmation으로 lease를 연장하게 할 수 있다. 기존 coordinator와 majority가 끊기면 lease를 renew할 수 없어 만료된다. 새 coordinator가 majority vote를 얻으려면 이전 coordinator에게 확인해 준 lease 시간이 만료되어야 한다.

delayed message 문제도 남는다. 새 coordinator가 선출된 뒤 old coordinator message가 늦게 도착할 수 있다. 따라서 system message에는 sender의 current term을 포함한다. receiver가 자기 current term보다 오래된 term의 stale message를 받으면 무시한다. 더 높은 term의 message를 받으면 자신이 behind 상태임을 알고 current term/coordinator를 다른 node에 확인해야 한다.

coordinator가 stateless protocol을 맡았다면 새 coordinator는 바로 takeover할 수 있다. 하지만 stateful coordinator라면 previous coordinator의 persistent data와 recovery log에서 state를 reconstruct해야 한다. 이 recovery data 자체도 node loss로 사라지지 않도록 replicated되어야 한다.

##### 23.7.2.1 Distributed Coordination Services

각 distributed application이 coordinator election, lock, configuration discovery를 직접 구현하는 것은 부담이 크다. 그래서 `ZooKeeper`, Google의 `Chubby` 같은 fault-tolerant distributed coordination service가 사용된다. 이런 service 내부는 consensus protocol로 fault tolerance를 구현하며, 23.8의 주제와 연결된다.

coordination service는 file-system-like API를 제공한다.

| 기능 | 사용 예 |
|---|---|
| hierarchical namespace에 small data 저장 | distributed application configuration, current coordinator 위치 저장 |
| file create/delete | lock 구현. lock name에 해당하는 file create를 시도하고 이미 있으면 lock 획득 실패 |
| lock lease | tablet master가 lease를 renew하지 않으면 자동 lock release |
| watch for changes | lock release 또는 system state change를 process가 감지 |

예를 들어 key-value store에서 tablet master가 tablet identifier와 같은 file name에 lock을 얻으면, 두 node가 동시에 같은 tablet의 master가 되는 일을 막을 수 있다. application master가 tablet master failure를 감지하면 lock을 release하거나, service가 lease 기반으로 자동 release할 수 있다.

### 23.8 Consensus in Distributed Systems

`distributed consensus`는 여러 node가 failure-tolerant하게 하나의 decision에 동의하는 문제다. replicated data update, coordinator election, nonblocking commit, fault-tolerant lock manager/key-value store의 기본 building block이다. 이 절은 `Paxos`, `Raft`, `replicated state machine`, 그리고 consensus를 이용한 2PC 보완을 다룬다.

#### 23.8.1 Problem Overview

single node가 decision을 내리면 그 node가 fail했을 때 다른 node들이 decision을 알 수 없어 system이 block될 수 있다. 2PC coordinator의 commit/abort decision이 대표적이다. fault tolerance를 얻으려면 여러 node가 decision protocol에 참여해야 한다.

distributed consensus의 기본 요구는 다음과 같다.

| 요구 | 의미 |
|---|---|
| agreement | failure, message loss, partition이 있어도 모든 participant가 같은 decision value를 배워야 함 |
| liveness under majority | participating nodes의 majority가 alive이고 서로 communicate 가능하면 protocol이 block되지 않고 terminate해야 함 |

실제 system은 decision을 한 번만 내리지 않고 연속적으로 내린다. 이를 추상화하는 좋은 방법은 각 decision을 shared log에 record 하나 append하는 것으로 보는 것이다. 각 node는 log copy를 갖고, consensus protocol은 log position마다 어떤 record가 들어갈지 합의한다.

대부분의 consensus protocol은 실행 중 log divergence를 일시적으로 허용한다. 같은 log position이 node마다 다를 수 있고, log 끝도 다를 수 있다. 대신 protocol은 어떤 index 이전의 prefix가 committed prefix인지 추적한다. committed prefix의 log record만 decision에 사용할 수 있고, 그 뒤 entry는 아직 합의 중이거나 실패한 consensus attempt의 흔적일 수 있어 나중에 삭제/교체될 수 있다.

majority voting의 핵심은 두 서로 다른 value가 동시에 majority를 얻을 수 없다는 것이다. majority 집합끼리는 반드시 겹치기 때문이다. 다만 vote가 split되거나 node failure로 아무 value도 majority를 못 얻으면 round를 다시 실행해야 한다.

#### 23.8.2 The Paxos Consensus Protocol

basic `Paxos`는 single decision을 만들기 위한 protocol이다. 역할은 23.7의 election과 유사하다.

| 역할 | Paxos에서의 의미 |
|---|---|
| `proposer` | decision value를 제안하는 node |
| `acceptor` | 여러 proposer의 proposal 중 하나만 vote/accept하는 node |
| `learner` | acceptor들이 어떤 value를 accept했는지 알아내 consensus value를 학습하는 node |

acceptor majority가 특정 value에 vote하면 그 value가 chosen consensus value다. 어려운 점은 두 가지다.

1. proposal이 여러 개면 vote가 split되어 아무 value도 majority를 얻지 못할 수 있다.
2. 어떤 value가 majority accept되었지만 learner가 알기 전에 그 acceptor 일부가 fail/disconnect될 수 있다. 이때 다음 round에서 다른 value가 chosen되면 learner마다 다른 decision을 배우는 correctness violation이 생긴다.

첫 문제는 correctness보다 performance 문제다. Paxos는 coordinator를 사용해 proposer들이 coordinator에 proposal을 보내고, coordinator가 하나를 골라 majority vote를 얻도록 한다. coordinator가 죽으면 새 coordinator를 뽑으면 되고, Paxos coordinator는 local state가 없어 recovery가 단순하다.

둘째 문제를 막기 위해 Paxos는 numbered proposal과 두 phase를 사용한다.

| phase | 동작 |
|---|---|
| `phase 1a` | proposer가 proposal number `n`과 함께 prepare message를 acceptor들에게 보냄 |
| `phase 1b` | acceptor는 더 높은 number에 이미 응답했다면 ignore. 아니면 `n`을 기억하고, 과거 accept한 최고 proposal number `m < n`과 value `v`를 응답 |
| `phase 2a` | proposer가 majority response를 받으면, 과거 accepted value가 없을 때만 자기 intended value를 사용. 과거 accepted value가 있으면 가장 높은 `m`의 value `v`를 선택해 accept request 전송 |
| `phase 2b` | acceptor는 더 높은 prepare에 응답한 적이 없으면 number `n`의 value `v`를 accept |

이 구조의 핵심은 이미 어떤 value `v`가 majority에 의해 accepted되었다면, 이후 더 높은 number의 proposal도 결국 `v`를 다시 제안하게 만든다는 점이다. majority 집합끼리는 교집합이 있으므로, 새 proposer가 phase 1에서 majority response를 모으면 과거 majority에 속한 acceptor 중 하나가 과거 accepted value를 알려줄 수 있다.

single decision Paxos를 series of decisions로 확장한 것이 `Multi-Paxos`다. 실제 구현은 acceptor membership change, long-down node removal 같은 문제까지 다뤄야 하므로 세부가 복잡하다. ZooKeeper의 `Zab`처럼 다른 consensus protocol도 널리 쓰인다.

#### 23.8.3 The Raft Consensus Protocol

`Raft`는 replicated log를 유지하는 consensus protocol이며, 이해와 구현이 쉬운 것을 목표로 설계되었다. Raft에서 coordinator는 `leader`, 나머지는 `followers`라고 부른다. time은 integer로 식별되는 `term`으로 나뉘고, 각 term에는 최대 하나의 leader가 있다. 어떤 term은 leader 없이 끝날 수도 있다.

![Figure 23.9](@/assets/images/cs-database-335-figure-23-9-page-1185.png)
*Figure 23.9 · PDF p. 1185 · leader와 follower들이 서로 다른 길이/상태의 log를 갖고 있고 committed prefix만 안전한 Raft log 예*

Raft의 목표는 모든 log replica가 항상 같게 유지되는 것이 아니다. failure와 disconnection 때문에 그것은 불가능하다. 대신 다음을 보장한다.

- log replica가 일시적으로 다르더라도 protocol이 나중에 delete/replace를 통해 sync로 되돌린다.
- 어떤 log entry도 protocol이 “절대 삭제되지 않음”을 보장하기 전까지 committed로 취급하지 않는다.

node가 replicated log에 record를 append하고 싶으면 current leader에게 요청한다. leader는 자기 term을 log record field로 넣고 자기 log에 append한 뒤, followers에게 `AppendEntries` RPC를 보낸다. 주요 parameter는 다음과 같다.

| parameter | 의미 |
|---|---|
| `term` | current leader의 term |
| `previousLogEntryPosition` | 새 entry 바로 앞 log entry 위치 |
| `previousLogEntryTerm` | 그 앞 entry의 term |
| `logEntries` | append할 log record 배열 |
| `leaderCommitIndex` | leader가 committed로 알고 있는 log prefix의 끝 index |

follower는 `AppendEntries`를 받으면 다음 식으로 처리한다.

1. message term이 자기 `currentTerm`보다 작으면 false.
2. 자기 log에 `previousLogEntryPosition` entry가 없거나 term이 맞지 않으면 false.
3. 새 entry 위치에 충돌하는 기존 entry가 있으면 그 entry와 이후 entry를 삭제한다.
4. 아직 없는 `logEntries`를 append한다.
5. `leaderCommitIndex > commitIndex`이면 `commitIndex = min(leaderCommitIndex, local last log index)`로 갱신한다.
6. true를 반환한다.

leader가 majority true를 받으면 append 성공을 보고할 수 있고, 해당 entry가 majority에 복제되면 committed prefix를 전진시킨다. Figure 23.9에서는 entry 6이 leader, follower 2, follower 4에 있어 majority에 존재하므로 leader가 `leaderCommitIndex = 6`으로 둘 수 있다.

old leader 문제는 term으로 해결한다. 과거 leader `N1`이 disconnected되었다가 새 leader `N2`가 선출된 뒤에도 leader처럼 행동할 수 있다. 하지만 majority node들은 더 높은 term을 알고 있으므로 `N1`의 `AppendEntries`에 false와 current term을 돌려보내고, `N1`은 자신이 outdated임을 알고 follower로 전환한다.

leader replacement 후 log consistency는 두 규칙으로 유지된다.

- leader로 선출될 candidate는 vote 요청 시 자기 log state를 보낸다. voter는 candidate log가 자기 log만큼 up-to-date일 때만 vote한다. majority vote를 얻은 leader는 모든 committed entry를 갖고 있음이 보장된다.
- 새 leader는 자기 log를 다른 node에 강제로 replicate한다. 이때 과거 term의 record가 majority에 있다고 바로 committed로 선언하지 않고, 새 leader가 자기 current term의 새 log record를 majority에 replicate한 뒤 그 record와 이전 record들을 committed로 선언한다.

#### 23.8.4 Fault-Tolerant Services Using Replicated State Machines

fault-tolerant service를 만드는 강력한 방법은 service를 deterministic `state machine`으로 보고, 이를 여러 node에 replicate하는 것이다.

![Figure 23.10](@/assets/images/cs-database-336-figure-23-10-page-1188.png)
*Figure 23.10 · PDF p. 1188 · replicated log가 같은 command order를 보장하고, committed command만 state machine에 적용되는 구조*

state machine은 input을 받아 stored state를 바꾸고 output을 낸다. 여러 replica가 같은 state에서 시작하고, 같은 input을 같은 order로 받으며, computation이 deterministic이면 모든 replica는 같은 state/output을 만든다. consensus protocol은 바로 이 “same input, same order”를 replicated log로 보장한다.

client command는 leader로 보내지고, leader는 command를 log에 append한 뒤 followers에 replicate한다. majority가 log replication을 확인하면 leader는 command를 committed로 선언하고 자기 state machine에 적용한다. 이후 followers에게 commit을 알리고, followers도 log order대로 command를 state machine에 적용한다.

예시 application은 두 가지다.

| service | state | log command | output |
|---|---|---|---|
| fault-tolerant lock manager | lock table | lock request, release | lock grant, rollback request |
| fault-tolerant key-value store | key-value map | `put()` operation | write result, later `get()` result |

lock manager는 같은 lock request/release sequence를 같은 순서로 처리하면 같은 lock table과 grant result를 만든다. 따라서 centralized lock manager code를 각 replica에서 실행하고, lock command를 Raft/Paxos log로 replicate하면 majority가 살아 있는 동안 fault-tolerant하게 동작한다.

key-value store에서는 `put()` operation을 consensus log에 append하고 committed된 뒤 state machine에 적용한다. leader 기반 protocol에서는 `get()`을 반드시 log에 넣지 않고 leader에서만 실행할 수 있다. 다만 같은 item에 대한 앞선 `put()`이 모두 committed된 뒤 `get()`을 처리해야 최신 값을 보장한다.

Spanner는 partition별 `Paxos group`을 두고, 각 group leader가 key-value store operation과 lock manager operation을 시작한다. operation은 Paxos log에 append되고 group members에 replicated된 뒤 committed 순서대로 적용된다. optimization으로 `get()`은 leader에서만 실행하거나, MV2PL timestamp를 이용해 충분히 up-to-date인 any replica에서 point-in-time read로 실행할 수 있다.

#### 23.8.5 Two-Phase Commit Using Consensus

consensus protocol이 있으면 2PC의 blocking problem을 줄일 수 있다. 핵심은 coordinator가 commit/abort decision을 local log에만 기록하지 않고, consensus protocol로 replicated log에 기록하는 것이다. coordinator가 그 뒤 fail해도 consensus 참여자들은 decision을 알고 있으므로 participant가 coordinator recovery만 기다릴 필요가 없다.

coordinator가 transaction decision을 내리기 전에 fail하면 새 coordinator는 먼저 replicated log를 확인한다. 이전 decision이 있으면 그 decision을 알리고, 없으면 commit/abort decision을 내려 consensus로 기록한다.

Spanner에서는 transaction이 여러 partition에 걸칠 수 있다. client가 2PC를 시작하고, transaction이 실행된 partition 중 하나의 Paxos group leader가 coordinator 역할을 한다. update가 수행된 다른 partition들은 2PC participant가 된다. prepare/commit message는 각 partition의 Paxos group leader에게 보내지고, 각 leader는 자기 Paxos group의 consensus를 통해 local log decision을 기록한다.

Paxos group member 하나가 fail해도 leader는 group majority가 살아 있고 연결되어 있으면 2PC step을 계속 처리할 수 있다. Paxos group leader가 fail하면 다른 group member가 leader를 이어받는다. commit processing에 필요한 log records는 replicated log에 있고, lock table도 replicated state machine으로 유지되므로 새 leader가 coordinator/participant의 2PC step을 계속 실행할 수 있다.

### 23.9 Summary

Chapter 23의 핵심은 “single-node transaction correctness를 distributed failure model 위에서 어떻게 유지할 것인가”다. local transaction은 기존 centralized DBMS 기법으로 처리할 수 있지만, global transaction은 여러 node가 독립적으로 fail하고 message/link/network partition이 생기는 환경에서 atomicity와 isolation을 맞춰야 한다.

2PC는 distributed atomicity의 기본 protocol이다. 모든 participant가 `ready state`에 들어가야 commit할 수 있고, 한 participant라도 abort하면 전체 abort한다. 하지만 coordinator가 fail하면 participant가 commit/abort 결정을 알 수 없는 `in-doubt transaction` 상태가 되어 `blocking problem`이 생긴다. consensus protocol이나 3PC는 blocking 위험을 줄이는 보완이고, `persistent messaging`은 cross-organization workflow처럼 long transaction을 2PC로 묶기 어려운 경우의 대안이다.

distributed concurrency control에서는 lock manager 위치가 핵심 설계 선택이다. `single lock manager`는 단순하지만 bottleneck/failure point가 되고, `distributed lock manager`는 병목을 줄이지만 global deadlock detection이 필요하다. `local wait-for graph`를 합친 `global wait-for graph`가 필요하고, communication delay 때문에 `false cycle`이 생길 수 있다. `lease`는 lock holder/coordinator failure를 시간 기반으로 정리하는 실용적 도구지만 clock skew와 delayed message를 고려해야 한다.

replication은 availability와 robustness를 위해 필요하지만 consistency 비용을 만든다. strong consistency 쪽에서는 `linearizability`, `primary copy`, `majority protocol`, `biased protocol`, `quorum consensus protocol`, version number를 사용한다. read/write quorum은 intersection을 보장해야 하고, majority 기반 protocol은 failure와 partition에도 최신 version을 찾을 수 있지만 read cost가 높다.

weak consistency 쪽에서는 CAP theorem이 배경이 된다. partition-tolerance를 포기할 수 없는 대규모 system에서는 consistency와 availability 중 하나를 희생해야 한다. availability를 택한 system은 `BASE`, `eventual consistency`, `asynchronous replication`, `lazy propagation`, `multimaster replication`을 사용하고, 이후 `version-vector scheme`, `reconciliation`, `Merkle tree`로 conflict/difference를 다룬다.

globally consistent timestamp는 distributed MVCC의 핵심이다. Spanner-style MV2PL은 `TrueTime`, `epsilon`, `commit wait`로 real-world commit order와 serialization order를 맞추어 `external consistency`를 제공한다. distributed snapshot isolation은 local SI만으로는 node 간 snapshot이 불일치할 수 있어 global coordination이나 dependency check가 필요하다. federated database에서는 local serializability만으로 global serializability가 보장되지 않으며, `ticket` 같은 scheme이 global transaction order를 강제하는 데 쓰인다.

coordinator selection과 consensus는 distributed system을 fault-tolerant하게 만드는 기반이다. `backup coordinator`는 빠른 failover를 주지만 normal overhead가 있고, `election algorithm`은 `proposer`, `acceptor`, `learner`, `term`, lease, stale message 처리가 필요하다. `ZooKeeper`, `Chubby` 같은 distributed coordination service는 이런 기능을 application이 직접 구현하지 않게 해 준다.

`Paxos`와 `Raft`는 majority 기반 consensus protocol이다. Paxos는 numbered proposal과 prepare/accept phase로 한 번 chosen된 value가 이후 round에서도 유지되게 한다. Raft는 leader/follower, term, `AppendEntries`, committed log prefix를 통해 replicated log를 이해하기 쉽게 유지한다. replicated log 위에 deterministic `replicated state machine`을 올리면 fault-tolerant lock manager, key-value store, 그리고 consensus-backed nonblocking 2PC를 만들 수 있다.

## 연결 관계

| 이 장의 개념 | 연결되는 앞/뒤 장 | 연결 이유 |
|---|---|---|
| `ACID`, `local/global transaction` | Chapter 17 Transactions | transaction state, atomicity, serializability가 distributed setting으로 확장됨 |
| `distributed lock manager`, `deadlock handling`, `timestamp ordering`, `validation` | Chapter 18 Concurrency Control | centralized concurrency-control protocol의 distributed 변형 |
| `log`, `redo(T)`, `undo(T)`, `in-doubt transaction`, `two-safe protocol` | Chapter 19 Recovery System | crash recovery와 commit decision durability가 2PC/replication의 기반 |
| `parallel/distributed architecture`, `federated database` | Chapter 20 Database-System Architectures | node, distributed DB, federated DB의 시스템 구조와 failure model |
| `partition`, `replica`, `tablet`, `HDFS/key-value storage` | Chapter 21 Parallel and Distributed Storage | replica placement와 partition-level primary/consensus group에 연결 |
| `exchange operator`, `publish-subscribe`, stream routing | Chapter 22 Parallel and Distributed Query Processing | asynchronous view maintenance와 replication message delivery에 연결 |
| `LSM tree`, `key-value store`, storage engines | Chapter 24 이후 advanced storage topics | replicated log/state machine 기반 storage system의 구현 배경 |

## 오해하기 쉬운 내용

| 오해 | 정정 |
|---|---|
| 2PC는 failure가 있어도 항상 nonblocking이다 | 2PC는 atomicity는 보장하지만 coordinator failure 시 blocking될 수 있다 |
| `<ready T>`를 쓴 participant는 마음대로 abort할 수 있다 | ready state 이후에는 coordinator decision을 따라야 하며 lock도 유지해야 한다 |
| local deadlock이 없으면 distributed deadlock도 없다 | local wait-for graph가 모두 acyclic이어도 union인 global wait-for graph에는 cycle이 있을 수 있다 |
| replica가 여러 개면 read는 아무 데서나 해도 항상 최신이다 | asynchronous replication이나 weak consistency에서는 stale read가 가능하다 |
| quorum consensus protocol의 `quorum`은 consensus algorithm Paxos/Raft와 같은 말이다 | 여기서는 replica read/write lock quorum 조건을 뜻하며, Paxos/Raft consensus와 관련은 있지만 동일 개념은 아니다 |
| eventual consistency는 자동으로 conflict를 올바르게 해결한다 | eventual consistency는 결국 수렴을 요구하지만 conflict resolution은 application-dependent인 경우가 많다 |
| version vector는 conflict를 해결한다 | version vector는 independent update를 detect할 뿐, reconcile은 별도 문제다 |
| Raft log의 모든 entry는 즉시 decision에 사용 가능하다 | committed prefix 이전 entry만 decision에 사용 가능하고, 이후 entry는 삭제/교체될 수 있다 |

## 면접 질문

1. `two-phase commit (2PC)`에서 participant가 `<ready T>`를 force한 뒤 coordinator가 fail하면 왜 blocking이 생기는가?
2. `persistent messaging`은 어떤 점에서 2PC를 대체하고, 어떤 부담을 application developer에게 넘기는가?
3. distributed lock manager에서 local wait-for graph만으로 deadlock을 찾을 수 없는 이유는 무엇인가?
4. `lease`가 coordinator uniqueness를 보장할 때 clock skew와 delayed message가 왜 문제가 되는가?
5. `linearizability`와 transaction `serializability`는 어떻게 다른가?
6. `majority protocol`과 `quorum consensus protocol`의 read/write cost trade-off를 설명하라.
7. CAP theorem이 partition 상황에서 consistency와 availability 중 선택을 요구하는 이유는 무엇인가?
8. `version-vector scheme`에서 두 vector가 incomparable하면 어떤 의미인가?
9. `Merkle tree`가 큰 replica 집합의 차이를 효율적으로 찾는 이유는 무엇인가?
10. Paxos에서 phase 1 응답의 “highest accepted proposal number/value”가 safety를 보장하는 핵심인 이유는 무엇인가?
11. Raft에서 `term`, `leaderCommitIndex`, committed prefix가 각각 어떤 역할을 하는가?
12. replicated state machine이 deterministic이어야 하는 이유는 무엇인가?

## 용어 회수

- `distributed transaction`, `local transaction`, `global transaction`
- `transaction manager (TM)`, `transaction coordinator (TC)`
- `system failure modes`, `node failure`, `message loss`, `communication link failure`, `network partition`
- `commit protocol`, `two-phase commit protocol (2PC)`, `three-phase commit protocol (3PC)`
- `prepare T`, `ready T`, `<ready T>`, `<commit T>`, `<abort T>`, `ready state`, `in-doubt transaction`, `blocking problem`
- `persistent messaging`, `messages_to_send`, `received_messages`, `exactly once`, `workflow`
- `single lock manager`, `distributed lock manager`, `local wait-for graph`, `global wait-for graph`, `false cycle`, `deadlock-detection coordinator`
- `lease`, `lock lease`, `clock synchronization`, `maximum message delay`
- `timestamp ordering`, `globally unique timestamp`, `logical clock (LCi)`, `distributed validation`, `test-and-set`, `checkAndPut()`, `checkAndMutate()`
- `replication`, `replica`, `robustness`, `linearizability`
- `primary copy`, `majority protocol`, `biased protocol`, `quorum consensus protocol`, `read quorum Qr`, `write quorum Qw`
- `read one, write all copies`, `read one, write all available`, `version number`, `read repair`, `chain replication protocol`
- `reconfiguration`, `reintegration`, `catalog`
- `multiversion two-phase locking (MV2PL)`, `CommitTS`, `StartTS`, `TrueTime API`, `epsilon (ϵ)`, `commit wait`, `external consistency`
- `distributed snapshot isolation`, `federated database system`, `heterogeneous distributed database system`, `ticket`
- `CAP theorem`, `BASE`, `Basically available`, `Soft state`, `Eventually consistent`
- `asynchronous replication`, `lazy propagation`, `synchronous replication`, `master-slave replication`, `multimaster replication`, `update-anywhere replication`, `publish-subscribe system`
- `asynchronous view maintenance`, `operation consistency`
- `version-vector scheme`, `conflicting updates`, `reconciliation`, `Merkle tree`, `hash tree`
- `coordinator selection`, `backup coordinator`, `election algorithm`, `proposer`, `acceptor`, `learner`, `bully algorithm`, `randomized retry`, `term`
- `distributed coordination service`, `ZooKeeper`, `Chubby`, `watch`
- `distributed consensus`, `Paxos`, `Multi-Paxos`, `Zab`, `Raft`, `leader`, `follower`, `AppendEntries`, `currentTerm`, `leaderCommitIndex`
- `replicated log`, `committed prefix`, `replicated state machine`, `fault-tolerant lock manager`, `Paxos group`, `non-blocking two-phase commit`
