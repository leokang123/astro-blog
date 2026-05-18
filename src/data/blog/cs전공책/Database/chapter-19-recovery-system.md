---
title: "Chapter 19. Recovery System"
order: 19
pubDatetime: 2026-05-17T00:19:00+09:00
modDatetime: 2026-05-17T00:19:00+09:00
description: "Database System Concepts 정리: Chapter 19. Recovery System"
tags:
  - "Database"
  - "CS"
---

## 개요

`recovery system`은 failure가 발생해도 transaction의 `atomicity`와 `durability`가 보존되도록 DBMS가 미리 기록하고, 장애 후 database를 일관된 상태로 되돌리는 장치다. Chapter 17에서 transaction의 ACID 성질을 정의하고 Chapter 18에서 concurrent execution을 제어했다면, Chapter 19는 crash, disk failure, transaction failure 이후에도 그 성질이 깨지지 않도록 만드는 recovery 구조를 다룬다.

Recovery는 단순히 “백업에서 복원”만 의미하지 않는다. 정상 transaction 처리 중에 충분한 recovery information을 남기는 일과, failure 이후 그 정보를 사용해 database consistency, transaction atomicity, durability를 회복하는 일을 모두 포함한다. 또한 현대 DBMS는 `high availability`도 요구하므로, primary database가 실패해도 synchronized backup copy에서 transaction processing을 계속할 수 있어야 한다.

## 핵심 개념

- `transaction failure`는 transaction 자체가 계속 실행될 수 없는 상황이며, logical error와 system error로 나뉜다.
- `system crash`는 volatile storage 내용이 사라지고 transaction processing이 멈추지만 non-volatile storage는 intact하다고 가정하는 failure다.
- `disk failure`는 disk block content 자체가 손상되는 failure이며, 다른 disk copy나 archival backup으로 복구해야 한다.
- `stable storage`는 실제로 완벽히 존재하지 않지만, 여러 non-volatile copy와 controlled write protocol로 근사한다.
- `physical block`, `buffer block`, `disk buffer`의 구분은 recovery에서 매우 중요하다. Transaction의 `write(X)`는 우선 buffer에만 반영되고, disk `output(B)`는 나중에 일어날 수 있다.
- Recovery algorithm은 정상 처리 중 log/checkpoint 같은 정보를 남기는 부분과, failure 후 redo/undo로 database를 복구하는 부분으로 나뉜다.

## 세부 정리

### 19.1 Failure Classification

DBMS가 다루는 failure는 원인과 손상 범위가 다르므로 복구 방식도 달라진다. Chapter 19는 세 가지 failure를 중심으로 recovery를 설명한다.

| Failure type | 하위 유형/의미 | Recovery 관점 |
|---|---|---|
| `transaction failure` | 특정 transaction이 정상 실행을 계속할 수 없는 경우 | 해당 transaction의 효과만 undo하거나 재실행한다. |
| `system crash` | hardware malfunction, DBMS/OS bug 등으로 volatile storage가 사라지고 transaction processing이 멈춤 | non-volatile storage는 intact하다고 보고 log를 사용해 in-memory state 손실을 복구한다. |
| `disk failure` | disk block이 head crash 또는 transfer failure로 content를 잃음 | 다른 disk copy 또는 archival backup으로 손상 block을 복구한다. |

`transaction failure`는 다시 두 가지로 나뉜다.

- `logical error`: bad input, data not found, overflow, resource limit exceeded처럼 transaction 내부 조건 때문에 더 진행할 수 없는 경우다.
- `system error`: deadlock처럼 system이 바람직하지 않은 상태에 들어가 transaction이 계속할 수 없지만, 나중에 재실행하면 성공할 수 있는 경우다.

`system crash` 설명에는 `fail-stop assumption`이 깔려 있다. Hardware error나 software bug가 발생하면 system이 멈추기는 하지만 non-volatile storage의 내용은 corrupt하지 않는다고 가정한다. 잘 설계된 system은 hardware/software 내부 check를 통해 이상 상태에서 진행하지 않고 멈추도록 하므로 이 가정이 현실적인 기반이 된다.

Recovery algorithm은 두 부분으로 구성된다.

1. 정상 transaction processing 중 failure recovery에 필요한 정보를 충분히 남기는 action.
2. Failure 이후 그 정보를 사용해 database contents를 consistent state로 회복하고, transaction atomicity와 durability를 보장하는 action.

즉 recovery는 장애 후에만 시작되는 일이 아니라, 정상 실행 중의 기록 방식까지 포함하는 설계다.

### 19.2 Storage

Database의 data item은 여러 storage media에 저장되며, media는 speed, capacity, failure resilience가 다르다. Recovery 관점에서는 storage를 세 범주로 본다.

| Storage type | 의미 |
|---|---|
| `volatile storage` | system crash 시 내용이 사라진다. 예: main memory |
| `non-volatile storage` | system crash 후에도 내용이 남지만, disk failure나 disaster에는 손상될 수 있다. |
| `stable storage` | failure에도 정보가 사라지지 않는 것처럼 동작하도록 여러 copy와 protocol로 근사한 저장소다. |

`stable storage`는 recovery algorithm의 핵심 기반이다. 실제 device 하나가 절대 실패하지 않는다는 뜻이 아니라, independent failure mode를 가진 여러 non-volatile media에 정보를 복제하고, write 중 failure가 생겨도 일관된 copy를 회복할 수 있게 controlled manner로 update한다는 뜻이다.

#### 19.2.1 Stable-Storage Implementation

Stable storage를 근사하려면 필요한 정보를 여러 non-volatile storage에 복제한다. 가장 단순한 형태는 mirrored disk처럼 각 block의 두 copy를 별도 disk에 두는 방식이다. RAID는 single disk failure 중에도 data loss를 막아주지만, fire나 flood 같은 disaster까지 막지는 못한다. 더 높은 안전성이 필요하면 remote site에도 block copy를 두고 local output과 함께 remote output을 수행한다. Remote backup system은 19.7에서 다시 다룬다.

Block transfer 중에는 다음 세 결과가 가능하다.

| Transfer result | 의미 |
|---|---|
| `successful completion` | destination에 정보가 안전하게 도착했다. |
| `partial failure` | transfer 중 failure가 발생해 destination block에 incorrect information이 남았다. |
| `total failure` | 충분히 이른 시점에 failure가 발생해 destination block이 원래 상태로 intact하다. |

Stable-storage write protocol은 logical database block마다 두 physical block을 유지하고 다음 순서로 output한다.

1. 첫 번째 physical block에 information을 write한다.
2. 첫 번째 write가 성공적으로 끝난 뒤, 같은 information을 두 번째 physical block에 write한다.
3. 두 번째 write까지 성공해야 output이 complete된 것으로 본다.

Failure가 write 중 발생하면 두 copy가 다를 수 있다. Recovery 시 block pair를 검사한다. 한쪽에 checksum error 같은 detectable error가 있으면 다른 copy로 대체한다. 둘 다 error는 없지만 내용이 다르면 한쪽을 다른 쪽으로 덮어쓴다. 어느 쪽을 선택하든, stable storage 관점에서는 write가 complete하게 성공했거나 아무 변화도 없었던 상태로 정리된다.

모든 block pair를 recovery 때마다 비교하면 비용이 크다. 그래서 small non-volatile RAM에 현재 write-in-progress인 block을 추적하면, recovery 시 그 block들만 비교하면 된다. 두 copy만으로도 failure probability를 충분히 낮출 수 있어 보통 arbitrarily many copy까지는 사용하지 않는다.

#### 19.2.2 Data Access

Database는 non-volatile storage에 영구 저장되고, 실행 중에는 일부 block만 main memory에 올라온다. Main-memory database도 main memory 손실에 대비해 non-volatile copy를 유지한다. Database는 fixed-length storage unit인 `block`으로 나뉘며, block이 disk와 memory 사이 transfer의 단위다. 여기서는 data item이 여러 block에 걸치지 않는다고 가정한다.

Recovery에서 자주 등장하는 block 용어는 다음과 같다.

| 용어 | 의미 |
|---|---|
| `physical block` | disk에 있는 block |
| `buffer block` | main memory에 임시로 올라온 block |
| `disk buffer` | buffer block들이 머무는 memory area |

Block movement는 두 primitive로 표현된다.

- `input(B)`: physical block `B`를 main memory로 transfer한다.
- `output(B)`: buffer block `B`를 disk에 써서 corresponding physical block을 replace한다.

![Figure 19.1](@/assets/images/cs-database-290-figure-19-1-page-940.png)
*Figure 19.1 · PDF p. 940 · disk와 main memory 사이의 input/output block transfer*

Conceptually, 각 transaction `Ti`는 private work area를 가진다. Transaction이 접근하거나 update하는 data item의 copy는 이 work area에 보관되며, data item `X`의 local copy는 `xi`로 표기한다. `read(X)`와 `write(X)`는 transaction work area와 system buffer 사이의 이동이며, 곧바로 disk write를 의미하지 않는다.

`read(X)`의 동작은 다음과 같다.

1. `X`가 들어 있는 block `BX`가 main memory에 없으면 `input(BX)`를 수행한다.
2. Buffer block에 있는 `X` 값을 transaction local variable `xi`에 assign한다.

`write(X)`의 동작은 다음과 같다.

1. `X`가 들어 있는 block `BX`가 main memory에 없으면 `input(BX)`를 수행한다.
2. Local variable `xi` 값을 buffer block `BX` 안의 `X`에 assign한다.

중요한 점은 `read(X)`와 `write(X)` 모두 disk에서 memory로 block을 가져올 수는 있지만, memory에서 disk로 즉시 `output(BX)`를 강제하지는 않는다는 것이다. Buffer block은 buffer manager가 memory space를 확보해야 하거나 DBMS가 특정 이유로 disk write를 원할 때 나중에 output될 수 있다. 이 지연 때문에 crash recovery에는 log와 write ordering rule이 필요하다.

### 19.3 Recovery and Atomicity

Transaction의 atomicity는 “모든 database modification이 반영되거나, 아무것도 반영되지 않아야 한다”는 요구다. 문제는 transaction이 여러 block을 update하고, 각 block의 `output(B)`가 서로 다른 시점에 일어난다는 점이다. 예를 들어 `A`에서 50달러를 빼고 `B`에 50달러를 더하는 transfer transaction에서 `A` block만 disk에 output된 뒤 crash가 나면, 재시작 후 database는 `A=950`, `B=2000`처럼 inconsistent state가 될 수 있다.

Crash 이후 database state만 보고는 transaction이 완료됐는지, 어떤 block이 output됐는지 정확히 알 수 없다. 그래서 DBMS는 database 자체를 수정하기 전에 modification을 설명하는 정보를 `stable storage`에 먼저 기록해야 한다. 이 정보가 있으면 committed transaction의 update는 나중에라도 `redo`할 수 있고, abort된 transaction의 update는 `undo`할 수 있다.

#### 19.3.1 Log Records

가장 널리 쓰이는 recovery 구조는 `log`다. Log는 database의 update activity를 순서대로 기록하는 `log record`의 sequence다.

대표적인 `update log record`는 단일 database write를 설명하며 다음 field를 가진다.

| Field | 의미 |
|---|---|
| `transaction identifier` | write를 수행한 transaction의 id |
| `data-item identifier` | write된 data item의 위치. 보통 block identifier와 block 안 offset |
| `old value` | write 이전 값 |
| `new value` | write 이후 값 |

Update log record는 `<Ti, Xj, V1, V2>`처럼 쓴다. 이는 transaction `Ti`가 data item `Xj`를 `V1`에서 `V2`로 write했다는 뜻이다. 이 외에도 transaction lifecycle event를 나타내는 special log record가 있다.

- `<Ti start>`: transaction `Ti`가 시작됐다.
- `<Ti commit>`: transaction `Ti`가 commit됐다.
- `<Ti abort>`: transaction `Ti`가 abort됐다.

핵심 원칙은 database가 수정되기 전에 해당 write의 log record가 먼저 만들어져 log에 추가되어야 한다는 것이다. Log record가 있으면 old value로 undo할 수 있고, new value로 redo할 수 있다. System crash와 disk failure recovery에 쓰려면 log 자체는 stable storage에 있어야 한다.

`shadow copy` 또는 `shadow paging`은 log-based recovery의 대안이다. Shadow-copy scheme은 update할 database copy를 새로 만들고, commit 시 `db-pointer`를 새 copy로 atomically 바꾸는 방식이다. Text editor의 save 동작과 비슷하지만, 큰 database 전체 copy는 너무 비싸고 concurrent transaction과 잘 맞지 않아 일반 DBMS에서는 널리 쓰이지 않는다.

#### 19.3.2 Database Modification

Transaction이 data item을 수정하는 과정은 세 수준으로 구분된다.

1. Transaction private memory에서 계산한다.
2. Main memory의 disk buffer 안 data block을 수정한다.
3. DBMS가 `output(B)`로 data block을 disk에 쓴다.

이 장에서는 transaction이 disk buffer 또는 disk 자체를 update하면 database를 modify했다고 본다. Private memory의 local copy 수정은 database modification이 아니다.

| Technique | 의미 | 장단점 |
|---|---|---|
| `deferred-modification technique` | transaction이 commit될 때까지 database를 modify하지 않는다. | abort가 쉬워지지만, update data item의 local copy를 유지해야 하고, 자기 update를 다시 읽을 때 local copy를 읽어야 한다. |
| `immediate-modification technique` | transaction이 active 상태일 때도 database buffer를 modify할 수 있다. | 성능과 2PL에 자연스럽지만, active transaction의 update가 crash 후 undo 대상이 될 수 있다. |

이 장의 recovery algorithm은 immediate modification을 지원한다. Deferred modification에도 동작하지만, deferred에 맞춰 overhead를 줄이는 최적화가 가능하다.

Log record에는 old value와 new value가 모두 있으므로 두 연산이 가능하다.

- `undo`: log record에 있는 data item을 `old value`로 되돌린다.
- `redo`: log record에 있는 data item을 `new value`로 설정한다.

#### 19.3.3 Concurrency Control and Recovery

Recovery가 올바르게 동작하려면 concurrency control과도 맞아야 한다. 만약 transaction `T1`이 data item `X`를 modify한 뒤 commit하기 전에 `T2`가 같은 `X`를 다시 modify한다면, `T1`을 undo하려고 old value를 복원하는 순간 `T2`의 효과까지 지워질 수 있다. 그래서 recovery algorithm은 보통 어떤 transaction이 data item을 modify하면 그 transaction이 commit 또는 abort할 때까지 다른 transaction이 그 item을 modify하지 못하게 요구한다.

이 요구는 updated data item에 X lock을 잡고 commit/abort까지 유지하는 `strict two-phase locking`으로 보장된다. Snapshot isolation과 validation-based concurrency control도 validation 시점에 update 대상에 X lock을 잡고 commit까지 유지하므로 같은 요구를 만족한다. 다만 19.8에서는 `early lock release`와 `logical undo`로 이 요구를 일부 완화하는 방법을 다룬다.

![Figure 19.2](@/assets/images/cs-database-291-figure-19-2-page-945.png)
*Figure 19.2 · PDF p. 945 · T0와 T1에 대한 system log 일부*

Figure 19.2는 `T0`가 `A`, `B`를 update하고 commit한 뒤, `T1`이 `C`를 update하고 commit하는 log를 보여준다. 각 update log record가 old/new value를 모두 담기 때문에 recovery가 redo/undo를 선택할 수 있다.

#### 19.3.4 Transaction Commit

Log-based recovery에서 transaction이 commit됐다는 기준은 `<Ti commit>` log record가 stable storage에 output되었는가다. Commit record는 transaction의 마지막 log record이며, 이 record가 stable storage에 있다는 것은 그 이전 log record들도 이미 stable storage에 있다는 뜻이다. 따라서 crash가 나도 `Ti`의 update를 redo할 충분한 정보가 있다.

반대로 crash 전에 `<Ti commit>`이 stable storage에 output되지 않았다면 `Ti`는 rollback된다. 즉 commit log record가 들어 있는 block의 output이 transaction commit을 결정하는 single atomic action이다. Data item을 담은 database block은 commit 시점에 반드시 stable storage로 output될 필요가 없고, 나중에 output될 수 있다.

#### 19.3.5 Using the Log to Redo and Undo Transactions

Log는 system crash recovery와 정상 실행 중 transaction rollback 모두에 사용된다. 핵심 procedure는 `redo(Ti)`와 `undo(Ti)`다.

| Procedure | 동작 | 주의점 |
|---|---|---|
| `redo(Ti)` | `Ti`가 update한 모든 data item을 log의 new value로 설정한다. | 여러 transaction이 같은 item을 update할 수 있으므로 log order를 보존해야 한다. 보통 transaction별 redo가 아니라 log를 한 번 scan하며 log record 순서대로 redo한다. |
| `undo(Ti)` | `Ti`가 update한 모든 data item을 log의 old value로 복원한다. | Undo 자체도 log record를 남긴다. 이 log record는 특별한 `redo-only log record`이며 undo 완료 후 `<Ti abort>`를 쓴다. |

![Figure 19.3](@/assets/images/cs-database-292-figure-19-3-page-947.png)
*Figure 19.3 · PDF p. 947 · T0, T1 실행 중 log와 database output의 한 가능한 순서*

Crash 후 어떤 transaction을 undo/redo할지는 log record의 존재로 결정한다.

| Log 상태 | Recovery action |
|---|---|
| `<Ti start>`는 있지만 `<Ti commit>`도 `<Ti abort>`도 없음 | `undo(Ti)` |
| `<Ti start>`와 `<Ti commit>`이 있음 | `redo(Ti)` |
| `<Ti start>`와 `<Ti abort>`가 있음 | `redo(Ti)` |

`<Ti abort>`가 있는데도 redo하는 것이 이상해 보일 수 있지만, abort log가 있다는 것은 undo 과정에서 쓴 redo-only log records도 log에 있다는 뜻이다. 이를 redo하면 결과적으로 `Ti`의 update가 undo된 상태가 재현된다. 이 약간의 중복은 recovery algorithm을 단순하게 하고 전체 recovery time을 줄인다.

![Figure 19.4](@/assets/images/cs-database-293-figure-19-4-page-949.png)
*Figure 19.4 · PDF p. 949 · crash 시점별 log 상태와 undo/redo 대상*

Figure 19.4의 세 경우는 commit record 유무가 recovery 결과를 어떻게 바꾸는지 보여준다.

- (a) `T0`의 update log는 있지만 commit/abort가 없으면 `undo(T0)`가 수행되어 `A`, `B`는 원래 값으로 돌아간다.
- (b) `T0 commit`은 있고 `T1 commit/abort`는 없으면 `redo(T0)`와 `undo(T1)`가 수행된다.
- (c) `T0 commit`, `T1 commit`이 모두 있으면 `redo(T0)`, `redo(T1)`가 수행된다.

#### 19.3.6 Checkpoints

Crash recovery 때 log 전체를 처음부터 scan하면 오래 걸린다. 또한 많은 committed transaction은 이미 database block이 disk에 output되어 있어 redo해도 결과는 같지만 시간을 낭비한다. `checkpoint`는 recovery가 봐야 할 log 범위를 줄이기 위한 장치다.

단순 checkpoint scheme은 checkpoint 중 update를 허용하지 않고, 모든 modified buffer block을 disk에 output한다. 절차는 다음과 같다.

1. Main memory에 있는 모든 log record를 stable storage에 output한다.
2. 모든 modified buffer block을 disk에 output한다.
3. Stable storage에 `<checkpoint L>` log record를 output한다. 여기서 `L`은 checkpoint 시점에 active였던 transaction list다.

`<checkpoint L>`가 있으면 checkpoint 이전에 완료된 transaction은 recovery 때 redo할 필요가 없다. 그 transaction의 commit 또는 abort log record는 checkpoint보다 앞에 있고, 그 transaction의 database modification은 checkpoint 이전 또는 checkpoint 과정에서 disk에 output되었기 때문이다.

System crash 후에는 log를 끝에서부터 backward search하여 마지막 `<checkpoint L>`를 찾는다. Recovery는 `L`에 들어 있는 transaction과 checkpoint 이후 시작한 transaction만 고려하면 된다. 이 집합을 `T`라고 하면:

- `T` 안의 `Tk`에 대해 `<Tk commit>`도 `<Tk abort>`도 없으면 `undo(Tk)`를 수행한다.
- `T` 안의 `Tk`에 대해 `<Tk commit>` 또는 `<Tk abort>`가 있으면 `redo(Tk)`를 수행한다.

Checkpoint가 완료되면, checkpoint 당시 active였던 transaction들의 가장 이른 `<Ti start>`보다 더 앞선 log record는 더 이상 필요하지 않다. 필요하면 이 log space를 reclaim할 수 있다.

단순 checkpoint는 transaction processing을 멈추게 하므로 부담이 크다. `fuzzy checkpoint`는 buffer block을 output하는 동안에도 transaction update를 허용하는 checkpoint이며, 19.5.4와 ARIES의 checkpoint scheme에서 더 유연한 형태로 발전한다.

### 19.4 Recovery Algorithm

앞 절까지는 어떤 transaction을 redo/undo해야 하는지의 원칙을 설명했다. 19.4는 log record와 가장 최근 checkpoint를 사용해 transaction failure와 system crash를 실제로 처리하는 recovery algorithm을 제시한다. 이 algorithm도 19.3.3의 제한, 즉 uncommitted transaction이 update한 data item은 그 transaction이 commit/abort하기 전까지 다른 transaction이 modify하지 못한다는 조건을 요구한다.

#### 19.4.1 Transaction Rollback

정상 실행 중 transaction `Ti`를 rollback할 때는 log를 backward scan한다.

1. `Ti`의 update log record `<Ti, Xj, V1, V2>`를 찾을 때마다 data item `Xj`에 old value `V1`을 쓴다.
2. 그 undo action을 log에 `<Ti, Xj, V1>` 형태의 special redo-only log record로 남긴다. 이 record는 `compensation log record`라고도 부른다.
3. `<Ti start>`를 찾으면 backward scan을 멈추고 `<Ti abort>` log record를 쓴다.

Compensation log record에는 undo 정보가 필요 없다. Undo를 다시 undo할 필요는 없기 때문이다. 대신 crash recovery 중에 이 record를 redo하면 “이미 수행된 undo”를 다시 재현할 수 있다. 그래서 rollback 도중 crash가 나도 recovery가 계속 이어질 수 있다.

#### 19.4.2 Recovery After a System Crash

System crash 후 restart recovery는 두 phase로 진행된다.

| Phase | 방향 | 핵심 동작 |
|---|---|---|
| `redo phase` | last checkpoint부터 log를 forward scan | checkpoint 이후 stable log에 남은 모든 update action을 다시 수행하고, incomplete transaction을 `undo-list`에 모은다. |
| `undo phase` | log 끝에서 backward scan | `undo-list`에 남은 transaction을 rollback하고 `<Ti abort>`를 남긴다. |

Redo phase의 세부 규칙은 다음과 같다.

1. `<checkpoint L>`의 transaction list `L`로 `undo-list`를 초기화한다.
2. Normal update log record `<Ti, Xj, V1, V2>` 또는 redo-only log record `<Ti, Xj, V2>`를 만나면 `Xj`에 `V2`를 써서 redo한다.
3. `<Ti start>`를 만나면 `Ti`를 `undo-list`에 추가한다.
4. `<Ti commit>` 또는 `<Ti abort>`를 만나면 `Ti`를 `undo-list`에서 제거한다.

Redo phase가 끝나면 `undo-list`에는 crash 시점에 incomplete였던 transaction만 남는다. Undo phase는 log를 뒤에서 앞으로 보며, `undo-list`에 속한 transaction의 log record를 만날 때마다 normal rollback과 같은 undo action을 수행한다. 해당 transaction의 `<Ti start>`를 만나면 `<Ti abort>`를 쓰고 `undo-list`에서 제거한다. `undo-list`가 비면 recovery가 끝나고 normal transaction processing을 재개할 수 있다.

이 restart recovery는 `repeating history` 방식이다. 마지막 checkpoint 이후 stable log에 도달한 모든 update action을, incomplete transaction의 action과 이미 rollback된 transaction의 compensation action까지 포함해 원래 순서대로 반복한다. 낭비처럼 보이지만, log order를 보존하고 recovery logic을 단순하게 한다.

![Figure 19.5](@/assets/images/cs-database-294-figure-19-5-page-953.png)
*Figure 19.5 · PDF p. 953 · normal operation log와 crash recovery 중 redo/undo action*

Figure 19.5에서는 `T1`은 commit했고, `T0`는 crash 전에 rollback을 완료했으며, `T2`는 crash 시점에 incomplete다. Recovery의 redo phase는 checkpoint 이후 record를 모두 replay한다. 이 과정에서 `T1`은 commit record 때문에 undo-list에서 제거되고, `T0`는 abort record 때문에 제거되며, `T2`만 남는다. Undo phase는 `T2`의 update를 old value로 되돌리고 compensation log record를 쓴 뒤 `<T2 abort>`를 남긴다.

#### 19.4.3 Optimizing Commit Processing

Transaction commit은 commit log record와 그 이전 log record를 stable storage에 force해야 한다. Transaction마다 별도 log flush를 수행하면 commit마다 비싼 disk write가 필요해 throughput이 낮아진다.

`group commit`은 여러 transaction이 완료될 때까지 짧게 기다렸다가, 여러 transaction의 log record를 같은 stable log block에 함께 쓰는 기법이다. 적절한 group size와 maximum waiting time을 선택하면 log block이 차서 쓰이는 비율이 높아지고, transaction당 output operation 수가 줄어든다.

Hard disk에서는 block write가 밀리초 단위라 group commit 효과가 크다. Flash storage에서는 block write가 훨씬 빠르지만, group commit은 같은 page rewrite와 erase operation을 줄이는 데도 도움이 된다. 다만 commit rate가 낮을 때는 기다리는 지연이 이득보다 클 수 있다.

Application programmer도 commit 성능에 영향을 줄 수 있다. 예를 들어 대량 insert를 각 insert별 transaction으로 수행하면 log flush 한계에 걸린다. 여러 insert를 하나의 batch transaction으로 묶으면 여러 insert의 log record가 함께 쓰여 throughput이 크게 높아질 수 있다.

### 19.5 Buffer Management

Buffer management는 crash recovery의 correctness와 overhead에 직접 영향을 준다. 핵심은 log와 data block의 output 순서를 어떻게 제어하느냐다.

#### 19.5.1 Log-Record Buffering

모든 log record를 생성 즉시 stable storage에 쓰면 비용이 너무 크다. Log record는 보통 block보다 작고, stable storage output은 물리적으로 여러 output을 수반할 수 있다. 그래서 DBMS는 log record를 main memory의 `log buffer`에 잠시 모아 두었다가 여러 log record를 한 번에 stable storage로 output한다. Stable storage에 기록되는 log record 순서는 log buffer에 쓰인 순서와 정확히 같아야 한다.

Log buffering은 성능을 높이지만, crash가 나면 main memory에만 있던 log record가 사라진다. 따라서 다음 규칙이 필요하다.

1. Transaction `Ti`는 `<Ti commit>` log record가 stable storage에 output된 뒤에야 commit state에 들어간다.
2. `<Ti commit>`이 stable storage에 output되기 전에 `Ti`와 관련된 모든 log record가 먼저 stable storage에 있어야 한다.
3. Main memory의 data block이 database disk로 output되기 전에, 그 block의 data와 관련된 모든 log record가 stable storage에 있어야 한다.

세 번째 규칙이 `write-ahead logging(WAL)` rule이다. 엄밀히는 block을 disk에 쓰기 전에 undo information이 stable storage에 있으면 충분하고, redo information은 나중에 쓸 수 있다. Undo/redo information을 별도 log record에 저장하는 system에서는 이 차이가 중요하다.

Buffered log를 disk에 쓰는 일을 `log force`라고도 부른다. 필요한 log record 하나를 force해야 할 때도, 충분한 log record가 있으면 전체 log block을 쓰고, 부족하면 partially full block으로라도 main memory의 log record들을 stable storage에 쓴다.

#### 19.5.2 Database Buffering

Commit 시 modified block을 반드시 disk에 쓰는 정책을 `force policy`라고 한다. 반대로 `no-force policy`는 transaction이 modify한 block이 아직 disk에 쓰이지 않았어도 commit을 허용한다. 이 장의 recovery algorithm은 no-force에서도 동작한다. No-force는 commit을 빠르게 하고, 같은 block에 여러 update를 모아 나중에 output할 수 있어 output 수를 줄인다. 대부분의 DBMS는 no-force를 사용한다.

Active transaction이 modify한 block을 disk에 쓰지 않는 정책은 `no-steal policy`다. 반대로 `steal policy`는 uncommitted transaction의 update가 들어간 modified block도 disk에 쓸 수 있게 한다. WAL을 지키면 steal에서도 recovery algorithm은 올바르게 동작한다. No-steal은 update가 많은 transaction에서 buffer가 dirty page로 가득 차 eviction을 못 하는 문제가 있으므로, 대부분의 DBMS는 steal을 사용한다.

정리하면 실무 DBMS의 표준 조합은 보통 `steal/no-force`다.

| Policy | 장점 | Recovery 부담 |
|---|---|---|
| `no-force` | commit 시 data page flush를 기다리지 않아 빠르다. | committed update가 disk에 없을 수 있으므로 redo가 필요하다. |
| `steal` | dirty page를 evict할 수 있어 buffer pressure를 줄인다. | uncommitted update가 disk에 있을 수 있으므로 undo가 필요하다. |

WAL이 필요한 이유는 steal 상황에서 분명해진다. `T0`가 `A`를 `1000 -> 950`으로 update한 뒤 log record `<T0, A, 1000, 950>`가 stable storage에 없는데 `A` block이 disk에 output되고 crash가 나면, recovery는 `A`를 원래 값으로 되돌릴 정보를 잃는다. 따라서 data block output 전에 해당 block 관련 log record가 반드시 stable storage에 있어야 한다.

Block output 중 transaction이 그 block을 동시에 update하면 WAL rule이 깨질 수 있다. 이를 막기 위해 DBMS는 transaction concurrency-control lock과 별개인 short-duration block lock, 즉 `latch`를 사용한다.

Block `B1`을 disk에 output할 때의 순서는 다음과 같다.

1. `B1`에 exclusive latch를 얻어 다른 transaction이 block을 update하지 못하게 한다.
2. `B1` 관련 log record가 모두 stable storage에 갈 때까지 log를 force한다.
3. `B1`을 disk에 output한다.
4. Output 완료 후 latch를 release한다.

이 latch는 transaction serializability를 위한 lock이 아니라 buffer block의 짧은 mutual exclusion을 위한 장치다. 따라서 non-two-phase 방식으로 곧바로 release해도 transaction serializability에는 영향을 주지 않는다.

DBMS는 보통 background process로 buffer blocks를 순회하며 dirty block을 계속 disk에 output한다. 이렇게 하면 checkpoint 때 써야 할 dirty block 수가 줄고, buffer eviction 시 clean block을 찾을 가능성이 높아져 input이 output 대기 없이 진행될 수 있다.

#### 19.5.3 Operating System Role in Buffer Management

Database buffer를 관리하는 방식은 두 가지다.

첫째, DBMS가 main memory 일부를 자체 buffer로 reserve하고 직접 관리한다. 이 방식은 WAL과 block output ordering을 DBMS가 정확히 통제할 수 있지만, 다른 application과 memory를 유연하게 공유하기 어렵다.

둘째, DBMS buffer를 operating system의 virtual memory 안에 두는 방식이다. OS가 전체 process의 memory 요구를 알고 있으므로 이상적으로는 어떤 buffer block을 언제 force-output할지 OS가 결정할 수 있어 보인다. 하지만 WAL을 지키려면 OS가 마음대로 database buffer page를 disk에 쓰면 안 된다. OS는 DBMS에 force-output을 요청하고, DBMS가 관련 log를 stable storage에 쓴 뒤 data block을 output해야 한다.

현실적으로 대부분의 OS는 virtual memory를 완전히 통제하고, page를 database file이 아니라 `swap space`에 output할 수 있다. 이 경우 DBMS가 원하는 database output과 별개의 swap output이 생겨, 동일 block에 대해 OS output, swap에서 input, DBMS output 같은 추가 I/O가 발생할 수 있다. 따라서 DBMS는 OS 지원이 부족한 한 자체 buffer management와 WAL enforcement를 선택해야 한다.

#### 19.5.4 Fuzzy Checkpointing

단순 checkpoint는 checkpoint 동안 database update를 멈추게 하므로, buffer가 크면 transaction processing이 오래 중단될 수 있다. `fuzzy checkpointing`은 checkpoint record가 log에 쓰인 뒤에는 transaction update를 다시 허용하고, modified buffer blocks는 그 후에 disk로 output한다.

문제는 checkpoint record가 disk에 있지만, checkpoint에 포함된 dirty pages가 아직 모두 disk에 output되기 전에 crash가 날 수 있다는 점이다. 이를 해결하기 위해 disk의 fixed position에 `last-checkpoint`를 둔다. DBMS는 checkpoint record를 쓸 때 바로 last-checkpoint를 갱신하지 않는다. 먼저 modified buffer block list를 만들고, 그 list의 모든 buffer block이 disk에 output된 뒤에야 `last-checkpoint`를 새 checkpoint 위치로 갱신한다. 그러면 recovery는 항상 completed checkpoint만 기준으로 삼을 수 있다.

Fuzzy checkpointing에서도 어떤 buffer block이 output되는 동안에는 그 block이 update되면 안 된다. 다른 buffer block은 동시에 update될 수 있지만, output 대상 block에는 latch가 필요하다. 또한 block output 전에는 WAL rule에 따라 해당 block의 undo log record가 stable storage에 있어야 한다.

### 19.6 Failure with Loss of Non-Volatile Storage

앞 절까지는 volatile storage만 손실되고 non-volatile storage는 intact하다고 가정했다. 하지만 disk block 자체가 사라지는 failure도 드물게 발생한다. 이를 위해 DBMS는 전체 database contents를 주기적으로 stable storage에 `dump`한다. 이 dump는 `archival dump`라고도 하며, old database state를 나중에 조사하는 데도 사용할 수 있다.

단순 dump procedure는 checkpoint와 비슷하다.

1. Main memory의 모든 log record를 stable storage에 output한다.
2. 모든 buffer block을 disk에 output한다.
3. Database contents 전체를 stable storage에 copy한다.
4. Stable storage에 `<dump>` log record를 output한다.

Non-volatile storage loss에서 recovery하려면 가장 최근 dump로 database를 disk에 restore한 뒤, log를 참고해 dump 이후의 모든 action을 redo한다. 이 경우 undo는 필요 없다. Dump 시점에는 database가 consistent state였고, dump 이후 commit된 변화만 forward로 재적용하면 되기 때문이다.

Partial failure라면 전체 database가 아니라 손상된 block만 restore하고, 그 block에 관련된 redo action만 수행하면 된다. SQL dump는 physical layout이 아니라 SQL DDL과 insert statement를 파일로 남기는 방식으로, 다른 database instance나 다른 software version으로 migration할 때 유용하다. 단순 dump는 전체 database copy 비용이 크고 dump 동안 transaction processing을 멈춰야 하므로, transaction이 active인 상태에서 수행되는 `fuzzy dump` 기법이 사용될 수 있다.

### 19.7 High Availability Using Remote Backup Systems

전통적인 centralized 또는 client-server transaction-processing system은 fire, flood, earthquake 같은 environmental disaster에 취약하다. `high availability`를 제공하려면 system unusable time이 매우 짧아야 하고, primary site가 실패해도 backup site가 빠르게 transaction processing을 이어받아야 한다.

기본 구조는 하나의 `primary site`에서 transaction processing을 수행하고, 물리적으로 떨어진 `remote backup site` 또는 `secondary site`에 primary data를 replicate하는 방식이다. Synchronization은 primary에서 생성되는 log records를 backup으로 보내는 방식으로 이뤄진다.

![Figure 19.6](@/assets/images/cs-database-295-figure-19-6-page-961.png)
*Figure 19.6 · PDF p. 961 · primary site의 log records를 backup site로 전송하는 remote backup architecture*

Primary가 실패하면 backup은 자신이 가진 primary copy와 primary에서 받은 log records로 recovery를 수행한다. 이는 primary가 다시 살아났을 때 수행했을 recovery action을 backup site가 대신 수행하는 것과 같다. Recovery가 끝나면 backup site가 새 primary가 되어 transaction을 처리한다.

Remote backup system 설계에서 중요한 문제는 다음과 같다.

| Issue | 핵심 내용 |
|---|---|
| `detection of failure` | Communication line failure를 primary failure로 오인할 수 있으므로 independent failure mode를 가진 여러 communication link를 둔다. |
| `transfer of control` | Primary failure 시 backup이 새 primary가 된다. IP address takeover 또는 high availability proxy로 client request를 새 primary에 route한다. |
| `time to recover` | Backup에 쌓인 log가 크면 takeover 전 recovery가 오래 걸린다. Backup이 주기적으로 redo log를 적용하고 checkpoint하면 delay가 줄어든다. |
| `time to commit` | Commit durability를 높이려면 commit log record가 backup까지 도달해야 하지만, 그만큼 commit latency가 늘어난다. |

`hot-spare configuration`에서는 backup site가 log record를 받는 즉시 계속 redo를 적용한다. Primary failure가 감지되면 backup은 incomplete transaction만 rollback하면 되므로 거의 즉시 takeover할 수 있다.

Commit durability는 세 등급으로 설명된다.

| Scheme | Commit 조건 | 장점 | 위험/비용 |
|---|---|---|---|
| `one-safe` | commit log record가 primary stable storage에 쓰이면 commit | commit latency가 가장 낮다. | backup takeover 시 backup에 도달하지 않은 committed update가 lost update처럼 보일 수 있다. 나중에 primary가 복구돼도 새 primary의 update와 conflict할 수 있어 human intervention이 필요할 수 있다. |
| `two-very-safe` | commit log record가 primary와 backup stable storage 모두에 쓰이면 commit | data loss 가능성이 매우 낮다. | primary나 backup 중 하나만 down되어도 transaction processing이 진행되지 않아 availability가 single-site보다 낮을 수 있다. |
| `two-safe` | 둘 다 active이면 two-very-safe처럼 동작하고, backup이 down이면 primary stable storage만으로 commit 허용 | one-safe의 lost transaction 문제를 피하면서 two-very-safe보다 availability가 높다. | one-safe보다 commit이 느리다. |

Backup server는 update transaction을 직접 실행하지 않지만, 많은 DBMS는 backup에서 read-only query 실행을 허용한다. Backup read에는 `snapshot isolation`을 사용해 reader에게 transaction-consistent view를 제공하면서, primary에서 넘어오는 update 적용을 block하지 않게 할 수 있다.

Remote backup은 DBMS log shipping뿐 아니라 file system 또는 disk level에서도 구현될 수 있다. 이때도 backup에서 recovery가 올바르게 되려면 `write-ahead logging(WAL)` rule이 backup replica에서도 유지되어야 한다. Primary에서 data block을 force한 뒤 다른 update를 수행했다면, backup에서도 그 block force가 subsequent update보다 먼저 반영되어야 한다.

더 강한 availability는 replicated distributed database로도 얻을 수 있다. Distributed database는 data item replica들을 transaction이 함께 update하도록 만들어 availability를 높일 수 있지만, remote backup보다 구현과 운영이 훨씬 복잡하다. Application availability 측면에서는 multiple application server와 load balancer, shared session information도 함께 필요하다.

### 19.8 Early Lock Release and Logical Undo Operations

Index나 system data structure에는 일반 data item처럼 strict 2PL을 적용하면 concurrency가 급격히 떨어질 수 있다. 예를 들어 B+-tree index insert 중 page lock을 transaction 끝까지 유지하면, 많은 transaction이 index page에서 병목을 겪는다. 그래서 B+-tree concurrency-control algorithm은 lower-level lock을 operation 완료 직후 release하는 `early lock release`를 사용한다.

문제는 recovery다. Transaction `T1`이 B+-tree node에 entry `(V1, R1)`을 insert하고 lower-level lock을 release한 뒤, `T2`가 같은 node에 `(V2, R2)`를 insert하면서 `(V1, R1)`의 위치를 이동시킬 수 있다. 이때 `T1`을 undo하려고 page의 old value를 통째로 복원하면 `T2`의 효과까지 지워진다. 따라서 old physical value 복원이 아니라, `(V1, R1)`을 delete하는 대응 operation으로 undo해야 한다. 이것이 `logical undo`의 필요성이다.

#### 19.8.1 Logical Operations

Insertion/deletion처럼 lower-level locks를 일찍 release하여 logical undo가 필요한 operation을 `logical operation`이라고 한다. 이런 operation은 index뿐 아니라 relation의 record block tracking, block free space, database free block list처럼 자주 접근되는 system data structure에도 필요하다. 이런 구조의 lock을 transaction 끝까지 잡으면 transaction들이 사실상 serial하게 실행되어 성능이 크게 나빠진다.

Operation-level conflict는 read/write conflict보다 의미론적이다. 예를 들어 B+-tree에 서로 다른 key value를 insert하는 두 operation은 같은 page 영역을 update하더라도 logical conflict가 아닐 수 있다. 반대로 같은 key value에 대한 insert/delete/read는 conflict한다.

Logical operation은 실행 중에는 page 같은 lower-level structure에 short-term lock을 잡고, operation이 끝나면 release한다. 하지만 transaction은 같은 key value에 대한 conflicting read/insert/delete를 막기 위해 higher-level lock을 two-phase manner로 유지해야 한다. Lower-level lock을 release한 뒤에는 physical old value로 undo할 수 없으므로 `compensating operation`, 즉 logical undo operation이 필요하다.

#### 19.8.2 Logical Undo Log Records

Logical undo를 지원하려면 operation 단위 log record가 필요하다. Transaction `Ti`가 index를 modify하는 operation instance `Oj`를 시작하기 전에 `<Ti, Oj, operation-begin>`을 log에 쓴다. Operation이 실행되는 동안에는 실제 page update마다 평소처럼 old-value/new-value를 담은 physical update log record를 생성한다. Operation이 끝나면 `<Ti, Oj, operation-end, U>`를 쓴다. 여기서 `U`는 logical undo information이다.

예를 들어 B+-tree insert operation의 undo information `U`는 “이 B+-tree에서 이 entry를 delete하라”는 정보를 담는다. Operation 자체를 설명하는 log는 `logical logging`이고, old/new value를 담는 log는 `physical logging`이다.

이 scheme에서 logical logging은 undo에만 쓰고 redo에는 쓰지 않는다. Redo는 physical log record로만 수행한다. Crash 후 disk state에는 어떤 operation의 일부 page update만 반영되어 B+-tree 같은 data structure가 operation-consistent하지 않을 수 있다. Operation-consistent하지 않은 structure에 logical redo/undo를 수행하면 위험하다. 따라서 restart recovery의 redo phase에서 physical redo가 먼저 database를 operation-consistent한 상태로 만든 뒤 logical undo가 가능해진다.

`idempotent` operation은 여러 번 실행해도 한 번 실행한 것과 결과가 같은 operation이다. Physical log record는 같은 value를 set하므로 idempotent하다. 반면 B+-tree entry insertion은 여러 번 실행하면 중복 entry를 만들 수 있어 idempotent하지 않을 수 있다. Recovery algorithm은 이미 수행된 logical operation이 반복 수행되지 않도록 주의해야 한다.

#### 19.8.3 Transaction Rollback with Logical Undo

Logical undo가 있는 transaction rollback은 backward log scan 중 record 종류에 따라 다르게 처리한다.

1. 일반 physical log record는 기존처럼 old value로 undo한다. 단, completed logical operation에 속한 physical log record는 뒤에서 설명하는 방식으로 skip한다. Incomplete logical operation은 operation-end가 없으므로 physical log record로 undo한다.
2. `<Ti, Oj, operation-end, U>`를 만나면, `U`를 사용해 logical undo operation을 수행한다. 그 undo operation 중 발생한 update는 일반 update처럼 physical log record로 기록한다. Logical undo가 끝나면 `<Ti, Oj, operation-abort>`를 쓴다. 이후 backward scan은 같은 operation의 physical log records를 건너뛰고 `<Ti, Oj, operation-begin>`까지 이동한다.
3. `<Ti, Oj, operation-abort>`를 만나면 해당 operation은 이미 logical undo가 완료된 것이므로, 그 operation의 preceding records를 `<Ti, Oj, operation-begin>`까지 skip한다. Non-idempotent logical undo가 여러 번 수행되는 것을 막기 위해서다.
4. `<Ti start>`를 만나면 transaction rollback이 완료되므로 `<Ti abort>`를 쓴다.

Logical undo 중 crash가 날 수도 있다. 그래서 logical undo 자체의 update는 redo-only compensation log record가 아니라 physical undo information을 남긴다. Restart recovery는 먼저 partial logical undo의 physical effect를 undo한 뒤, 원래 operation-end record를 만나 logical undo를 다시 수행할 수 있다.

![Figure 19.7](@/assets/images/cs-database-296-figure-19-7-page-967.png)
*Figure 19.7 · PDF p. 967 · early lock release 이후 logical undo로 transaction rollback하는 예*

Figure 19.7은 `T0`가 operation `O1`으로 `C`를 update하고 lower-level lock을 release한 뒤, `T1`이 같은 `C`를 update하는 상황을 보여준다. `T0`가 abort할 때 `O1`을 old value로 물리 복원하면 `T1`의 update까지 지워지므로, logical undo는 `C`에 `+100`을 적용해 `O1`의 효과만 보상한다. 반면 early lock release 대상이 아닌 `B`는 physical undo로 복원된다.

![Figure 19.8](@/assets/images/cs-database-297-figure-19-8-page-969.png)
*Figure 19.8 · PDF p. 969 · crash recovery 중 incomplete operation과 completed operation의 logical undo 처리*

Figure 19.8에서는 checkpoint 이후 redo phase가 physical log record를 replay하고, undo phase에서 incomplete operation `O5`는 physical old value로 undo한다. Completed operation `O4`는 operation-end record의 undo information으로 logical undo를 수행하고, operation-abort record를 남긴 뒤 operation-begin까지 physical records를 skip한다.

#### 19.8.4 Concurrency Issues in Logical Undo

Logical undo가 안전하려면 original operation이 실행될 때 잡았던 lower-level locks가 나중에 logical undo를 수행하기에도 충분해야 한다. 그렇지 않으면 normal processing 중 concurrent operation이 logical undo와 conflict하는 방식으로 끼어들 수 있고, crash recovery의 physical undo가 logical undo 결과를 덮어쓰는 문제가 생길 수 있다.

특히 logical undo operation과 concurrent operation이 같은 lower-level data item에서 conflict할 수 있다면, original operation은 logical undo에 필요한 lower-level locks도 확보했어야 한다. Original operation과 logical undo가 single page만 접근하는 `physiological operation`이면 이 요구를 만족하기 쉽다. B+-tree update처럼 여러 page와 구조 변화가 얽히는 경우에는 어떤 lower-level lock을 잡아야 하는지 operation별로 세밀하게 설계해야 한다. 대안으로 `multilevel recovery`는 이런 locking requirement를 완화하는 접근이다.

### 19.9 ARIES

`ARIES`는 실무 recovery method의 대표적인 형태다. 19.4의 recovery algorithm과 19.8의 logical undo logging은 ARIES의 핵심 개념을 단순화한 것이다. ARIES는 recovery time과 checkpoint overhead를 줄이고, 이미 disk에 반영된 log operation의 불필요한 redo를 피하기 위해 더 복잡한 metadata를 사용한다.

ARIES가 앞선 단순 algorithm과 다른 주요 지점은 네 가지다.

1. `log sequence number(LSN)`로 log record를 식별하고, database page에도 LSN을 저장하여 어떤 operation이 page에 이미 반영되었는지 판단한다.
2. `physiological redo`를 지원한다. Page는 physical하게 식별하지만, page 내부 operation은 logical하게 표현할 수 있다.
3. `DirtyPageTable`을 사용해 recovery 중 불필요한 redo를 줄인다.
4. Dirty page를 checkpoint 때 모두 disk에 쓰지 않고, dirty page 관련 정보만 checkpoint log record에 남기는 fuzzy checkpoint scheme을 사용한다.

#### 19.9.1 Data Structures

ARIES의 log record는 `LSN`을 가진다. LSN은 논리적으로 log에서 나중에 나온 record일수록 큰 값이며, 실제 구현에서는 log file number와 file offset을 조합해 disk 위치를 찾는 데도 사용될 수 있다.

각 database page는 `PageLSN` field를 유지한다. Page가 update될 때 해당 update log record의 LSN을 page의 PageLSN에 저장한다. Recovery redo phase에서 어떤 log record의 LSN이 page의 PageLSN 이하이면, 그 operation은 이미 page에 반영되어 있으므로 다시 수행하면 안 된다. 특히 ARIES는 non-idempotent할 수 있는 physiological redo를 허용하므로, PageLSN은 같은 redo를 중복 적용하지 않기 위해 필수다.

ARIES의 주요 data structure는 다음과 같다.

| Structure/Field | 의미 |
|---|---|
| `LSN` | log record를 고유하게 식별하고 log order를 나타낸다. |
| `PageLSN` | 해당 page에 마지막으로 반영된 update log record의 LSN이다. |
| `PrevLSN` | 같은 transaction의 직전 log record LSN이다. Transaction log를 backward로 따라갈 수 있게 한다. |
| `compensation log record(CLR)` | rollback 중 수행한 undo action을 기록하는 redo-only log record다. |
| `UndoNextLSN` | CLR 안에 저장되며, transaction rollback 중 다음으로 undo해야 할 log record의 LSN을 가리킨다. |
| `DirtyPageTable` | buffer에서 update되었지만 disk version이 최신이 아닐 수 있는 page 목록이다. |
| `RecLSN` | page가 DirtyPageTable에 처음 들어갔을 때의 end-of-log LSN이다. 해당 page에 redo가 필요할 수 있는 earliest LSN을 나타낸다. |

![Figure 19.9](@/assets/images/cs-database-298-figure-19-9-page-972.png)
*Figure 19.9 · PDF p. 972 · ARIES의 PageLSN, DirtyPageTable, log buffer/stable log 구조*

DirtyPageTable은 page가 buffer pool에서 처음 dirty가 될 때 entry를 만들고, 그때 `RecLSN`을 current end of log로 설정한다. Page가 disk에 flush되면 DirtyPageTable에서 제거한다. Checkpoint log record는 DirtyPageTable과 active transaction list를 담고, 각 active transaction에 대해 마지막 log record인 `LastLSN`도 기록한다. Disk의 fixed position에는 마지막 complete checkpoint log record의 LSN이 저장된다.

#### 19.9.2 Recovery Algorithm

ARIES restart recovery는 세 pass로 진행된다.

| Pass | 목적 |
|---|---|
| `analysis pass` | 어떤 transaction을 undo해야 하는지, crash 시 어떤 page가 dirty였는지, redo pass가 어디서 시작해야 하는지 결정한다. |
| `redo pass` | analysis에서 정한 위치부터 repeating history를 수행하여 database를 crash 직전 stable log state에 가깝게 복원한다. |
| `undo pass` | crash 시점에 incomplete였던 transaction들을 rollback한다. |

`analysis pass`는 마지막 complete checkpoint log record를 찾아 DirtyPageTable과 active transaction list를 읽는다. `RedoLSN`은 DirtyPageTable 안 RecLSN들의 minimum으로 설정한다. Dirty page가 없으면 checkpoint log record의 LSN을 RedoLSN으로 둔다. 이후 checkpoint부터 forward scan하며 transaction end record를 만나면 undo-list에서 제거하고, update log record를 만나면 DirtyPageTable을 갱신한다.

`redo pass`는 `RedoLSN`부터 forward scan한다. Update log record를 만났을 때:

1. 해당 page가 DirtyPageTable에 없거나, log record의 LSN이 그 page의 `RecLSN`보다 작으면 skip한다.
2. 그렇지 않으면 page를 disk에서 fetch하고, page의 `PageLSN`이 log record LSN보다 작을 때만 redo한다.

첫 번째 test가 실패하면 page를 fetch할 필요조차 없다. 이 때문에 ARIES는 이미 disk에 반영된 많은 update를 읽지도 않고 건너뛸 수 있다.

`undo pass`는 undo-list에 남은 transaction들의 log record만 대상으로 backward processing한다. Analysis pass에서 기록한 각 transaction의 `LastLSN`으로 시작하고, update log record를 undo할 때는 CLR을 생성한다. CLR의 `UndoNextLSN`은 undo된 update log record의 `PrevLSN`으로 설정한다. Undo pass는 각 transaction의 다음 undo 대상 LSN들 중 가장 큰 LSN부터 처리해 log order를 역방향으로 따라간다.

![Figure 19.10](@/assets/images/cs-database-299-figure-19-10-page-975.png)
*Figure 19.10 · PDF p. 975 · ARIES analysis, redo, undo pass의 recovery action 예*

Figure 19.10의 예에서는 checkpoint LSN이 7568이지만, DirtyPageTable의 minimum RecLSN이 7564이므로 redo pass는 checkpoint보다 앞선 7564에서 시작한다. ARIES checkpoint는 dirty page를 flush하지 않기 때문에 이런 상황이 가능하다. Analysis 결과 undo 대상은 `T145`뿐이고, undo pass는 `T145`의 LastLSN 7567에서 시작해 `<T145 begin>`까지 거슬러 올라간다.

#### 19.9.3 Other Features

ARIES는 recovery correctness뿐 아니라 concurrency와 성능을 위해 여러 기능을 제공한다.

- `nested top action`: transaction rollback 시 undo되어서는 안 되는 operation을 기록한다. 예를 들어 page allocation은 transaction이 rollback되어도 다른 transaction이 그 page에 record를 저장했을 수 있으므로 되돌리면 안 된다. ARIES는 dummy CLR과 UndoNextLSN을 사용해 해당 log record를 skip하게 만든다.
- `recovery independence`: 일부 page만 독립적으로 recover할 수 있어, disk 일부 page failure가 발생해도 다른 page의 transaction processing을 멈추지 않을 수 있다.
- `savepoint`: transaction이 savepoint를 기록하고 그 지점까지만 partial rollback할 수 있다. Deadlock handling에서 필요한 lock만 release하도록 부분 rollback하는 데 유용하다.
- `fine-grained locking`: index concurrency-control algorithm과 결합해 page-level이 아니라 tuple-level locking을 사용할 수 있어 concurrency를 높인다.
- `recovery optimization`: DirtyPageTable을 이용해 redo 대상 page를 prefetch하거나, page fetch가 끝날 때까지 해당 page redo를 미루고 다른 log record를 먼저 처리하는 out-of-order redo를 사용할 수 있다.

### 19.10 Recovery in Main-Memory Databases

`main-memory database`는 data가 main memory에 있어 query와 update가 빠르지만, system failure나 shutdown 시 main memory contents가 사라진다. 따라서 persistent 또는 stable storage에도 data를 유지해야 한다.

전통적인 recovery algorithm도 main-memory database에 사용할 수 있다. Update log record는 stable storage에 output되어야 하고, recovery 시 disk에서 database를 reload한 뒤 log record를 적용해 state를 복원한다. Commit된 transaction이 modify한 block은 disk에 써야 하며, recovery 때 replay할 log 양을 줄이기 위해 checkpoint도 필요하다.

하지만 main-memory database에서는 몇 가지 최적화가 가능하다.

- Index는 relation을 memory로 load하고 recovery가 끝난 뒤 빠르게 rebuild할 수 있다. 그래서 많은 system은 index update에 대한 redo logging을 하지 않는다. Transaction abort를 위한 undo logging은 필요하지만, 이 undo log는 memory에만 둘 수 있고 stable log에 쓰지 않아도 된다.
- 일부 main-memory database는 redo logging만 수행한다. Checkpoint는 주기적으로 만들고, uncommitted data가 disk에 쓰이지 않게 하거나 in-place update 대신 multiple record versions를 만들어 recovery를 단순화한다.
- Fast recovery가 매우 중요하다. 전체 database를 load하고 recovery action을 수행해야 transaction processing을 시작할 수 있기 때문이다.
- Recovery time을 줄이기 위해 data와 log records를 partition하고, 각 core가 하나의 partition recovery를 맡아 parallel recovery를 수행할 수 있다.

`non-volatile RAM(NVRAM)` 또는 `storage class memory(SCM)`는 page 단위가 아니라 word 단위 direct access를 제공하면서 power failure 후에도 contents가 남는 storage다. 이런 storage에서는 redo logging을 피할 수 있지만, transaction abort를 위한 undo logging이나 NVRAM에 대한 atomic update 문제는 여전히 고려해야 한다.

### 19.11 Summary

Chapter 19의 recovery 흐름은 다음처럼 압축할 수 있다.

- Failure는 `transaction failure`, `system crash`, `disk failure`로 나눌 수 있고, 각각 rollback, log-based restart recovery, dump/backup 기반 recovery가 필요하다.
- `stable storage`는 완벽한 장치가 아니라 mirrored disk, RAID, remote copy, archival backup을 통해 failure probability를 낮추는 abstraction이다.
- Log-based recovery는 database modification 전에 `<Ti, Xj, old, new>` 같은 update log record를 stable storage에 남긴다.
- Transaction commit의 기준은 `<Ti commit>` log record가 stable storage에 output되었는지다.
- `redo`는 committed/aborted transaction의 history를 재적용하고, `undo`는 incomplete transaction의 update를 old value로 되돌린다.
- Checkpoint는 recovery가 scan해야 할 log 범위를 줄인다. `fuzzy checkpoint`는 transaction processing을 멈추지 않기 위해 checkpoint와 dirty page flush를 분리한다.
- Buffer management의 실무 조합은 보통 `steal/no-force`이며, 이 조합은 redo와 undo를 모두 필요로 한다.
- `write-ahead logging(WAL)`은 data block이 disk에 output되기 전에 해당 block의 log information, 특히 undo information이 stable storage에 있어야 한다는 규칙이다.
- Remote backup은 primary site의 log records를 backup site로 보내 high availability를 제공한다. `one-safe`, `two-very-safe`, `two-safe`는 commit latency, data loss risk, availability 사이의 trade-off다.
- `early lock release`는 index/system data structure concurrency를 높이지만, physical undo만으로는 다른 transaction의 update까지 지울 수 있으므로 `logical undo`가 필요하다.
- `ARIES`는 LSN, PageLSN, DirtyPageTable, CLR, UndoNextLSN, fuzzy checkpoint, physiological redo를 결합해 recovery time과 logging overhead를 줄이는 state-of-the-art recovery scheme이다.
- Main-memory database는 전통 recovery를 사용할 수 있지만, index rebuild, redo-only logging, parallel recovery, NVRAM-aware recovery로 최적화할 수 있다.

## 연결 관계

- Chapter 17의 `atomicity`, `durability`, transaction state는 Chapter 19의 commit log record, redo/undo, rollback 기준으로 구체화된다.
- Chapter 18의 `strict two-phase locking`, snapshot isolation, validation은 recovery가 physical undo를 안전하게 수행하도록 uncommitted update의 추가 modification을 막는 역할을 한다.
- Chapter 12/13의 storage hierarchy, RAID, block, buffer, slotted page 구조는 stable storage, WAL, physiological redo, main-memory recovery 이해의 기반이다.
- Chapter 18.10의 B+-tree concurrency와 early lock release는 Chapter 19.8의 logical undo, Chapter 19.9의 ARIES fine-grained locking으로 이어진다.
- Chapter 23의 distributed transaction processing에서는 remote backup, replication, failure handling이 atomic commit/consensus protocol과 연결된다.

## 오해하기 쉬운 내용

- `write(X)`는 disk write가 아니다. Transaction local copy를 buffer block에 반영하는 동작이며, disk output은 나중에 일어날 수 있다.
- Commit은 data page가 disk에 쓰인 순간이 아니라 `<Ti commit>` log record가 stable storage에 쓰인 순간이다.
- `<Ti abort>`가 있는 transaction도 recovery 때 redo 대상이 될 수 있다. Abort 과정의 compensation/redo-only log records를 replay해야 최종적으로 undo된 상태가 재현된다.
- `steal`은 uncommitted update가 disk에 나갈 수 있음을 뜻하고, `no-force`는 committed update가 commit 시점에 disk에 없을 수 있음을 뜻한다. 그래서 steal/no-force는 undo와 redo를 모두 요구한다.
- `logical undo`는 logical redo와 다르다. 이 장의 logical logging은 undo에 쓰이고, redo는 physical 또는 physiological log record로 수행된다.
- ARIES의 checkpoint는 dirty page를 모두 flush한다는 뜻이 아니다. DirtyPageTable과 active transaction 정보를 남기는 fuzzy checkpoint라서 redo start point가 checkpoint record보다 앞설 수 있다.

## 면접 질문

1. `WAL(write-ahead logging)` rule이 없으면 steal policy에서 어떤 recovery 문제가 생기는가?
2. `steal/no-force` 조합이 왜 실무 DBMS에서 흔하고, 각각 어떤 recovery action을 필요하게 만드는가?
3. Crash recovery에서 redo를 forward로, undo를 backward로 수행하는 이유는 무엇인가?
4. `<Ti abort>` record가 있는 transaction도 redo 대상이 되는 이유는 무엇인가?
5. Checkpoint가 recovery time을 줄이는 방식과 `fuzzy checkpoint`가 필요한 이유를 설명하라.
6. Remote backup의 `one-safe`, `two-very-safe`, `two-safe`는 durability와 availability를 어떻게 다르게 trade-off하는가?
7. Early lock release가 physical undo를 어렵게 만드는 이유와 `logical undo`가 이를 어떻게 해결하는지 설명하라.
8. ARIES에서 `LSN`, `PageLSN`, `DirtyPageTable`, `CLR`, `UndoNextLSN`이 각각 어떤 문제를 해결하는가?
9. `physiological redo`가 physical redo와 logical redo의 중간 형태인 이유는 무엇인가?
10. Main-memory database recovery에서 index redo logging을 생략할 수 있는 이유와, 여전히 필요한 logging은 무엇인가?

## 용어 회수

`recovery scheme`, `failure classification`, `transaction failure`, `logical error`, `system error`, `system crash`, `data-transfer failure`, `fail-stop assumption`, `disk failure`, `volatile storage`, `non-volatile storage`, `stable storage`, `physical block`, `buffer block`, `disk buffer`, `force-output`, `log-based recovery`, `log`, `log record`, `update log record`, `old value`, `new value`, `deferred modification`, `immediate modification`, `uncommitted modification`, `checkpoint`, `recovery algorithm`, `restart recovery`, `transaction rollback`, `physical undo`, `physical logging`, `redo phase`, `undo phase`, `repeating history`, `compensation log record`, `log-record buffering`, `write-ahead logging(WAL)`, `log force`, `database buffering`, `force policy`, `no-force policy`, `steal policy`, `no-steal policy`, `latch`, `fuzzy checkpointing`, `high availability`, `remote backup system`, `primary site`, `remote backup site`, `secondary site`, `hot-spare configuration`, `one-safe`, `two-very-safe`, `two-safe`, `early lock release`, `logical operation`, `logical logging`, `logical undo`, `loss of non-volatile storage`, `archival dump`, `fuzzy dump`, `ARIES`, `log sequence number(LSN)`, `PageLSN`, `physiological redo`, `compensation log record(CLR)`, `DirtyPageTable`, `RecLSN`, `checkpoint log record`, `analysis pass`, `redo pass`, `undo pass`, `PrevLSN`, `UndoNextLSN`, `nested top action`, `recovery independence`, `savepoint`, `main-memory database`, `non-volatile RAM(NVRAM)`, `storage class memory(SCM)`.
