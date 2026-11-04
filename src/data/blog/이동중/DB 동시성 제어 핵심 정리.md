---
title: "DB 동시성 제어 핵심 정리"
order: 3
pubDatetime: 2026-11-04T10:54:40+09:00
modDatetime: 2026-11-04T11:02:52+09:00
description: ""
ogImage: "@/assets/images/2026-11-04-001.png"
tags:
  - general
---
# DB 동시성 제어 핵심 정리

지금까지 공부한 트랜잭션 → MVCC → 격리 수준 → Phantom Read → 잠금 → 낙관적·비관적 락을 중요한 내용만 추려서 정리했어.

## 1. 트랜잭션(Transaction)

트랜잭션은 여러 SQL 작업을 하나의 논리적 작업 단위로 묶는 개념이다.

```
START TRANSACTION;

SELECT * FROM account WHERE id = 1;

UPDATE account
SET balance = 7000
WHERE id = 1;

COMMIT;
```

- `START TRANSACTION`: 트랜잭션 시작
- `COMMIT`: 변경 확정 및 트랜잭션 종료
- `ROLLBACK`: 변경 취소 및 트랜잭션 종료
- `SAVEPOINT`: 트랜잭션 내부의 부분 롤백 지점

Auto Commit이 활성화되어 있고 명시적으로 트랜잭션을 시작하지 않았다면, 일반적으로 SQL 문 하나가 하나의 트랜잭션으로 처리된다.

SELECT도 트랜잭션에 속한다. 따라서 SELECT만 실행한 트랜잭션도 COMMIT으로 종료할 수 있다.

Spring에서는 `@Transactional`을 이용해 여러 DB 작업을 하나의 트랜잭션으로 묶을 수 있다.

## 2. MVCC (Multi-Version Concurrency Control)

MVCC는 데이터의 여러 버전을 관리해 읽기와 쓰기 사이의 대기를 줄이는 동시성 제어 기법이다.

### 등장 배경

기존의 단순한 락 기반 방식에서는 데이터를 수정하는 동안 다른 트랜잭션의 조회가 대기해야 할 수 있었다.

MVCC는 이러한 문제를 해결하기 위해 수정 중인 데이터를 기다리는 대신 이전에 커밋된 버전을 읽도록 한다.

```
초기 데이터: 잔액 10,000원

트랜잭션 A
→ 잔액을 7,000원으로 수정 (미커밋)

트랜잭션 B
→ 이전에 커밋된 10,000원 조회 가능

트랜잭션 A
→ COMMIT
```

핵심 특징:

- 기본적으로 행(Row) 단위의 데이터 버전을 관리한다.
- 읽기와 쓰기가 서로 대기하는 상황을 줄인다.
- 어떤 버전을 읽을지는 격리 수준과 스냅샷 시점에 따라 달라진다.
- MySQL InnoDB는 Undo Log 등을 활용해 이전 버전을 재구성한다.
- MySQL InnoDB, PostgreSQL 등 주요 DBMS에서 기본적으로 사용한다.

MVCC는 읽기–쓰기 동시성을 개선하지만, 쓰기–쓰기 충돌을 모두 해결하지는 않는다.

## 3. 트랜잭션 격리 수준(Isolation Level)

격리 수준은 다른 트랜잭션의 변경 사항을 어느 범위까지 볼 수 있는지와 어떤 동시성 현상을 허용할지 결정하는 기준이다.

| 격리 수준            | 핵심 특징                  |
| ---------------- | ---------------------- |
| READ UNCOMMITTED | 미커밋 데이터 읽기 허용          |
| READ COMMITTED   | 커밋된 데이터만 읽음            |
| REPEATABLE READ  | 동일 트랜잭션 내 반복 읽기 일관성 보장 |
| SERIALIZABLE     | 직렬 실행과 동등한 결과를 보장      |

### READ COMMITTED vs REPEATABLE READ

초기 잔액이 10,000원이라고 가정하자.

| 순서 | 트랜잭션 A | 트랜잭션 B |
| --- | --- | --- |
| 1 | SELECT → 10,000 | |
| 2 | | UPDATE → 7,000 |
| 3 | | COMMIT |
| 4 | 다시 SELECT → ? | |

MySQL InnoDB의 일반 SELECT 기준:

- **READ COMMITTED**: 7,000원. SELECT마다 새로운 스냅샷을 사용한다.
- **REPEATABLE READ**: 10,000원. 최초 일관성 읽기의 스냅샷을 유지한다.

READ COMMITTED vs REPEATABLE READ
- READ COMMITTED: SELECT마다 최신 커밋 데이터를 읽어 변경 사항을 빠르게 반영하지만, 같은 트랜잭션에서도 조회 결과가 달라질 수 있음.
- REPEATABLE READ: 동일한 스냅샷을 유지해 트랜잭션 내 읽기 일관성을 보장하지만, 다른 트랜잭션의 최신 변경 사항이 반영되지 않을 수 있음.
**핵심**: 격리 수준이 높다는 것은 최신 데이터를 읽는다는 뜻이 아니라, 다른 트랜잭션의 변경으로부터 읽기 일관성을 더 강하게 보장한다는 의미. (MySQL InnoDB 일반 SELECT 기준)

## 4. Phantom Read와 Next-Key Lock

Phantom Read는 동일한 트랜잭션에서 같은 조건으로 조회했는데, 다른 트랜잭션의 변경으로 조회되는 행의 집합이 달라지는 현상이다.

예를 들어:

```
SELECT * FROM account
WHERE id BETWEEN 10 AND 20;
-- 결과: 10, 20
```

다른 트랜잭션이 `id=15`를 INSERT하고 COMMIT한 후, 같은 조건으로 다시 조회했을 때 15가 추가로 나타나는 상황이다.

MySQL InnoDB의 REPEATABLE READ에서는 두 가지 방식으로 대응한다.

- 일반 SELECT: MVCC 스냅샷을 유지해 일관된 결과를 보여 준다.
- 잠금 읽기: Next-Key Lock 등을 이용해 해당 인덱스 범위에 새로운 데이터가 삽입되는 것을 제한한다.

### InnoDB의 잠금 종류

![2026-11-04-002](@/assets/images/2026-11-04-002.png)

- Record Lock: 기존 인덱스 레코드 잠금
- Gap Lock: 인덱스 레코드 사이의 빈 공간에 대한 INSERT 제한
- Next-Key Lock: Record Lock + 해당 레코드 앞의 Gap Lock

단, REPEATABLE READ라고 모든 SELECT에 Next-Key Lock이 걸리는 것은 아니다. 일반 SELECT는 보통 MVCC를 사용하며, `SELECT ... FOR UPDATE` 같은 잠금 읽기에서 범위 잠금이 활용된다.

## 5. 공유 잠금(S Lock)과 배타 잠금(X Lock)

둘 다 DB에서 사용하는 실제 잠금 종류이며, 비관적 락을 구현할 때 활용된다.

| 구분                   | 공유 잠금(S)    | 배타 잠금(X)     |
| -------------------- | ----------- | ------------ |
| 대표 SQL               | `FOR SHARE` | `FOR UPDATE` |
| 다른 S Lock            | 허용          | 차단           |
| 다른 X Lock            | 차단          | 차단           |
| 다른 일반 SELECT         | 허용          | 허용           |
| 다른 트랜잭션의 충돌하는 UPDATE | 차단          | 차단           |

### 공유 잠금

```
SELECT * FROM account
WHERE id = 1
FOR SHARE;
```

내가 읽은 데이터를 다른 트랜잭션이 수정하지 못하도록 보호한다.

### 배타 잠금

```
SELECT * FROM account
WHERE id = 1
FOR UPDATE;
```

다른 트랜잭션이 동일한 데이터에 충돌하는 S/X 잠금을 획득하지 못하도록 한다.

주의: X Lock이 있어도 일반 SELECT는 MVCC를 통해 이전에 커밋된 버전을 읽을 수 있다.

## 6. MVCC와 공유 잠금의 차이

둘 다 읽기와 관련되어 있지만 목적이 정반대에 가깝다.

MVCC: 다른 사람이 수정하더라도 나는 읽을 수 있다.

공유 잠금: 내가 읽는 동안 다른 사람이 수정하지 못하게 한다.

| 상황          | MVCC 일반 SELECT | 공유 잠금            |
| ----------- | -------------- | ---------------- |
| 다른 트랜잭션의 수정 | 가능             | 충돌하는 수정 대기       |
| 조회 방식       | 스냅샷 기반         | 현재 데이터에 대한 잠금 읽기 |
| 핵심 목적       | 읽기·쓰기 동시성 개선   | 조회한 데이터 보호       |

MVCC로 일관된 조회 결과를 얻을 수 있어도, 다른 트랜잭션이 실제 데이터를 변경하는 것 자체는 막지 않는다.

반대로 공유 잠금은 실제 데이터의 변경을 제한한다.

## 7. 낙관적 락과 비관적 락

둘 다 동시 수정의 정합성을 관리하기 위한 전략이다.

| 구분        | 낙관적 락      | 비관적 락               |
| --------- | ---------- | ------------------- |
| 기본 생각     | 충돌이 드물 것이다 | 충돌이 발생할 수 있다        |
| 제어 방법     | 수정 시 버전 검사 | 미리 DB 잠금 확보         |
| 충돌 시      | 수정 실패·재시도  | 대기·타임아웃·실패          |
| 대표 JPA 기능 | `@Version` | `PESSIMISTIC_WRITE` |
| 적합한 상황    | 충돌이 적은 작업  | 충돌 가능성이 높은 작업       |

### 낙관적 락

JPA에서는 일반적으로 `@Version` 컬럼을 사용한다.

```
@Version
private Long version;
```

수정 시 다음과 같은 SQL을 활용한다.

```
UPDATE account
SET balance = 7000,
    version = version + 1
WHERE id = 1
  AND version = 1;
```

이미 다른 트랜잭션이 수정해서 version이 변경됐다면 업데이트할 행이 없어 충돌을 감지할 수 있다.

### 비관적 락

```
START TRANSACTION;

SELECT * FROM account
WHERE id = 1
FOR UPDATE;

-- 조회한 데이터를 기준으로 처리

COMMIT;
```

다른 트랜잭션은 충돌하는 잠금을 확보하려고 할 때 기다려야 한다.

참고로 MVCC의 내부 버전과 JPA의 `@Version`은 다르다.

MVCC 버전은 DB가 트랜잭션 가시성을 관리하기 위한 것이고, JPA `@Version`은 애플리케이션이 동시 수정 충돌을 감지하기 위한 것이다.

## 8. 전체 개념을 한 번에 연결하기

![2026-11-04-001](@/assets/images/2026-11-04-001.png)

## 최종 암기 포인트

1. 트랜잭션: START부터 COMMIT/ROLLBACK까지 하나의 작업 단위
2. MVCC: 여러 버전을 관리해 읽기–쓰기 동시성 개선
3. READ COMMITTED: 다른 트랜잭션이 커밋한 값을 다음 일반 SELECT에서 볼 수 있음
4. REPEATABLE READ: 같은 트랜잭션에서 반복 조회의 일관성을 유지
5. Phantom Read: 같은 조건의 조회에서 행 집합이 달라지는 현상
6. Next-Key Lock: 인덱스 레코드와 앞쪽 Gap을 함께 잠가 삽입 제한
7. S Lock: 다른 공유 잠금은 허용하고 충돌하는 쓰기는 제한
8. X Lock: 충돌하는 읽기 잠금과 쓰기 잠금을 모두 제한
9. 낙관적 락: 수정 시 버전 등을 검사해 충돌 감지
10. 비관적 락: 실제 DB 잠금을 먼저 확보해 충돌 제어

가장 중요한 결론: MVCC는 데이터를 어떻게 일관되게 읽을 것인가에 초점을 두고, 낙관적·비관적 락은 동시 작업에서 데이터를 어떻게 안전하게 보호하고 수정할 것인가에 초점을 둔다.