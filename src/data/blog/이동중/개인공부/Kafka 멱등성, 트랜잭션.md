---
title: "Kafka 멱등성, 트랜잭션 "
order: 7
pubDatetime: 2026-11-10T14:48:02+09:00
modDatetime: 2026-11-10T14:48:05+09:00
description: ""
tags:
  - general
---
# Kafka 멱등성, 트랜잭션, Inbox/Outbox 패턴과 Saga 보상 트랜잭션

## 1. Kafka의 메시지 중복 문제

Kafka는 기본적으로 메시지 전달 과정에서 중복이 발생할 수 있다.

대표적으로 다음 두 상황이 있다.

- Producer → Broker: 메시지가 정상적으로 저장되었지만 ACK가 유실되어 Producer가 재전송
- Broker → Consumer: Consumer가 비즈니스 로직을 완료했지만 Offset Commit에 실패하여 동일 메시지를 재처리

따라서 Producer와 Consumer 각각의 중복 문제를 해결해야 한다.

### 멱등성 프로듀서(Idempotent Producer)

Kafka의 멱등성 프로듀서는 메시지 전송 재시도로 인한 중복 기록을 방지한다.

```
Producer
   │
   ├── 메시지 A 전송 ──────→ Kafka 저장 성공
   │
   └── ACK 유실
          │
          └── 메시지 A 재전송
                    │
                    └── Kafka가 중복 감지
```

Kafka는 Producer ID(PID)와 Sequence Number를 이용해 중복 전송을 식별한다.

한계: 동일한 이벤트가 Kafka에 정상적으로 한 번 기록되더라도 Consumer가 여러 번 처리할 수 있다. 또한 애플리케이션이 동일한 비즈니스 이벤트를 새 메시지로 두 번 생성하는 것까지 방지하지는 않는다.

## 2. Consumer의 멱등성 확보 방법

Consumer가 동일한 메시지를 다시 받아도 비즈니스 결과가 달라지지 않도록 설계해야 한다.

### 2-1. Unique Key 기반 멱등성

비즈니스 테이블의 Unique Key 또는 Primary Key를 이용한다.

```
CREATE TABLE orders (
    order_id VARCHAR(100) PRIMARY KEY,
    amount INT
);
```

동일한 `order_id`의 이벤트가 중복 전달되더라도 두 번째 INSERT는 Unique 제약 조건에 의해 거부된다.

- 장점: 별도 테이블 없이 구현 가능
- 단점: 단순 INSERT에는 적합하지만 누적 UPDATE와 같은 작업에는 적용하기 어려움

Kafka Record Key 자체가 DB 중복을 자동으로 방지하는 것은 아니다. 애플리케이션이 적절한 식별자를 DB의 Unique Key로 활용해야 한다.

### 2-2. Upsert 기반 멱등성

데이터가 없다면 INSERT, 이미 존재한다면 UPDATE를 수행한다.

```
INSERT INTO sales (product_id, total_sales)
VALUES (1, 50000)
ON CONFLICT (product_id)
DO UPDATE SET total_sales = EXCLUDED.total_sales;
```

동일한 이벤트를 반복 처리하더라도 결과는 50,000으로 유지된다.

다만 다음 두 연산은 구분해야 한다.

```
-- 비멱등적: 실행할 때마다 값 증가
UPDATE sales
SET total_sales = total_sales + 5000
WHERE product_id = 1;
```

```
-- 멱등적: 동일한 값으로 덮어쓰기
UPDATE sales
SET total_sales = 50000
WHERE product_id = 1;
```

주의: 동일 값을 덮어쓰는 Upsert는 반복 실행에 대해서는 멱등적이지만, 오래된 이벤트가 나중에 도착하면 최신 상태를 덮어쓸 수 있다. 이를 방지하려면 버전이나 이벤트 순서 검증이 필요하다.

### 2-3. Inbox 패턴

처리한 이벤트의 ID를 별도 테이블에 저장하여 중복 처리를 방지한다.

```
CREATE TABLE inbox (
    event_id VARCHAR(100) PRIMARY KEY,
    processed_at TIMESTAMP
);
```

처리 흐름은 다음과 같다.

```
Consumer 메시지 수신
        ↓
DB 트랜잭션 시작
        ↓
Inbox에 Event ID 삽입
        │
        ├── 중복 → 비즈니스 로직 생략
        │
        └── 최초 삽입
                ↓
          비즈니스 로직 실행
                ↓
             DB COMMIT
        ↓
Kafka Offset Commit
```

핵심은 Inbox 기록과 비즈니스 DB 변경을 동일한 DB 트랜잭션으로 묶는 것이다.

그래야 비즈니스 로직이 실패했을 때 Inbox 기록도 함께 롤백할 수 있다.

| 방식         | 핵심 원리           | 적합한 상황          |
| ---------- | --------------- | --------------- |
| Unique Key | 중복 INSERT 거부    | 주문 생성           |
| Upsert     | 동일 상태로 덮어쓰기     | 상태 동기화, 집계 결과   |
| Inbox      | 처리한 Event ID 기록 | 포인트 증가, 잔액 변경 등 |

### WAL과 Inbox의 차이

WAL(Write-Ahead Log)은 일반적으로 DB의 변경 사항을 먼저 로그에 기록해 장애 복구와 내구성을 지원하는 메커니즘이다.

반면 Inbox는 어떤 비즈니스 이벤트가 처리되었는지 추적하는 애플리케이션 패턴이다.

따라서 DBMS의 WAL이 존재한다고 Kafka 메시지의 중복 처리가 자동으로 방지되는 것은 아니다.

## 3. Kafka Transaction

Kafka에는 실제로 트랜잭션 기능이 존재한다.

DB 트랜잭션처럼 다음 API를 사용할 수 있다.

```
producer.beginTransaction();

producer.send(record1);
producer.send(record2);

producer.sendOffsetsToTransaction(
    offsets,
    consumer.groupMetadata()
);

producer.commitTransaction();
```

### Kafka 트랜잭션이 묶는 작업

```
             Application
                  │
        Kafka Transaction
                  │
         ┌────────┴────────┐
         ▼                 ▼
    B Topic에          A Topic의
    메시지 발행         Offset Commit
         │                 │
         └────────┬────────┘
                  ▼
          COMMIT 또는 ABORT
```

Kafka Transaction을 사용하면 여러 Kafka 메시지 발행과 Consumer Offset Commit을 원자적으로 처리할 수 있다.

예를 들어 A Topic에서 메시지를 소비하여 B Topic에 결과를 발행하는 상황이다.

- 정상 처리: B Topic 메시지와 A Topic Offset이 함께 커밋된다.
- 실패 처리: B Topic 메시지는 Abort 처리되고 A Topic Offset도 커밋되지 않는다.

`sendOffsetsToTransaction()`이 소비 Offset을 Kafka 트랜잭션에 포함시키는 핵심 메서드이다.

### Kafka의 Rollback은 DB와 다르다

Kafka는 Append-only Log 구조이므로 이미 기록한 메시지를 즉시 물리적으로 삭제하지 않는다.

대신 Transaction Coordinator가 트랜잭션의 Commit/Abort 상태를 관리한다.

```
Kafka Transaction 시작
          ↓
B Topic에 메시지 1 기록
          ↓
B Topic에 메시지 2 기록
          ↓
       장애 발생
          ↓
     Transaction Abort
          ↓
메시지는 로그에 남아 있을 수 있지만
read_committed Consumer에게 보이지 않음
```

이때 Consumer 설정이 중요하다.

```
isolation.level=read_committed
```

- `read_committed`: 커밋된 트랜잭션의 메시지만 읽음
- `read_uncommitted`: Abort된 트랜잭션의 메시지도 읽을 수 있음

### Transaction Coordinator

Kafka Broker 중 하나가 Transaction Coordinator 역할을 수행한다.

- 트랜잭션 참여 파티션 추적
- 트랜잭션 상태 관리
- Commit / Abort 결정 및 마커 기록
- 내부 토픽 `__transaction_state`를 이용한 상태 관리

따라서 서로 다른 Broker에 존재하는 여러 Topic/Partition도 하나의 Kafka 트랜잭션에 포함할 수 있다.

단, 모든 서비스가 자동으로 하나의 트랜잭션을 공유하는 것은 아니다. Kafka 트랜잭션은 Transactional Producer가 관리하는 Kafka 작업에 적용된다.

## 4. Kafka Exactly-Once Semantics(EOS)

Kafka의 Exactly-Once Semantics는 단순히 메시지가 한 번만 전달된다는 의미가 아니다.

중복 소비나 재시도가 발생하더라도 Kafka 내부의 처리 결과가 정확히 한 번 반영되는 효과를 제공하는 것이다.

이를 위해 다음 기능을 함께 활용한다.

| 기능                  | 역할                                 |
| ------------------- | ---------------------------------- |
| Idempotent Producer | 재전송에 따른 중복 기록 방지                   |
| Kafka Transaction   | 여러 메시지 기록과 Offset Commit을 원자적으로 처리 |
| `read_committed`    | Abort된 트랜잭션의 메시지 소비 방지             |

### Kafka EOS의 한계

```
A Topic
    ↓
Application
    ├── PostgreSQL UPDATE
    │          └── DB COMMIT 성공
    │
    └── B Topic Produce 실패
               ↓
        Kafka Transaction Abort
```

이 경우 Kafka 트랜잭션이 Abort되어도 이미 커밋된 PostgreSQL 작업은 자동으로 롤백되지 않는다.

Kafka의 트랜잭션은 외부 DB나 외부 API 작업까지 포함하는 범용 분산 트랜잭션이 아니기 때문이다.

## 5. Transactional Outbox 패턴

Kafka 트랜잭션만으로 해결할 수 없는 문제 중 하나는 DB 변경과 Kafka 메시지 발행 사이의 원자성 문제다.

예를 들어 주문을 DB에 저장한 후 Kafka에 주문 생성 이벤트를 발행한다고 가정하자.

```
주문 DB COMMIT 성공
         ↓
Kafka 메시지 발행 실패
         ↓
DB에는 주문이 있지만
다른 서비스는 주문 생성을 모름
```

Transactional Outbox는 DB 변경과 이벤트 발행 요청을 동일한 DB 트랜잭션으로 묶는다.

```
Application
     │
     ▼
DB Transaction BEGIN
     │
     ├── Orders 테이블 INSERT
     │
     └── Outbox 테이블 INSERT
     │
     ▼
DB COMMIT
     │
     ▼
Outbox Relay / CDC
     │
     ▼
Kafka 메시지 발행
```

이렇게 하면 DB 변경과 Outbox 기록의 원자성을 보장할 수 있다.

단, Kafka 발행은 별도 단계이기 때문에 중복 발행 가능성이 남는다. 따라서 Consumer의 멱등성 처리가 필요할 수 있다.

Inbox는 소비 측 중복 처리를 방지하고, Outbox는 생산 측 DB 변경과 이벤트 발행의 일관성을 확보하는 패턴이다.

## 6. Saga와 보상 트랜잭션

### 일반 Rollback과 보상 트랜잭션

일반적인 DB Rollback은 아직 커밋되지 않은 트랜잭션을 취소한다.

```
BEGIN
  ↓
UPDATE
  ↓
오류 발생
  ↓
ROLLBACK
```

반면 보상 트랜잭션(Compensating Transaction)은 이미 커밋된 작업의 효과를 새로운 트랜잭션을 실행해 취소하거나 상쇄하는 방식이다.

```
결제 완료 (COMMIT)
          ↓
배송 실패
          ↓
결제 취소 트랜잭션 실행
          ↓
환불 완료 (새로운 COMMIT)
```

보상 트랜잭션은 과거 트랜잭션의 커밋 자체를 취소하는 것이 아니다.

이미 확정된 작업을 비즈니스적으로 되돌리는 새로운 작업이다.

### 왜 MSA에서 보상 트랜잭션을 사용할까?

MSA에서는 서비스마다 독립적인 DB와 트랜잭션을 사용하는 경우가 많다.

```
주문 서비스
    │
    └── 주문 생성 COMMIT
              ↓
         결제 서비스
              │
              └── 결제 완료 COMMIT
                        ↓
                   재고 서비스
                        │
                        └── 재고 부족 발생
```

재고 부족이 발생했다고 재고 서비스가 주문 DB나 결제 DB의 과거 트랜잭션을 Rollback할 수는 없다.

따라서 이벤트나 API를 이용해 각 서비스에 보상 작업을 요청한다.

```
재고 부족
    ↓
결제 취소 요청 이벤트
    ↓
결제 서비스: 결제 취소
    ↓
결제 취소 완료 이벤트
    ↓
주문 서비스: 주문 취소
```

여기서 이벤트는 보상 작업을 요청하는 통신 수단이고, 실제 결제 취소 및 주문 취소 작업이 보상 트랜잭션이다.

이러한 여러 서비스의 로컬 트랜잭션과 보상 흐름을 조율하는 것이 Saga 패턴이다.

Saga는 이벤트를 이용하는 Choreography 방식이나 중앙 조정자가 흐름을 관리하는 Orchestration 방식으로 구현할 수 있다.

## 7. Kafka Transaction으로 Saga를 대체할 수 없는 이유

처음 제기했던 핵심 질문은 다음과 같다.

> 여러 서비스가 Kafka로 통신한다면 Kafka Transaction으로 메시지를 Abort해서 모든 작업을 무효화하면 되지 않을까?

불가능한 이유는 Kafka Transaction이 이미 커밋된 외부 비즈니스 작업을 되돌리지 못하기 때문이다.

### 이유 1. 외부 DB는 Kafka 트랜잭션 범위 밖이다

Kafka에서 메시지를 Abort하더라도 이미 완료된 결제, 재고 변경, 주문 저장 작업은 되돌아가지 않는다.

### 이유 2. 이미 커밋된 Kafka 트랜잭션도 소급해서 Abort할 수 없다

Saga에서는 주문, 결제, 재고 서비스가 각각 독립적으로 트랜잭션을 완료한다.

이후 다른 서비스에서 장애가 발생했다고 과거에 커밋된 Kafka 트랜잭션을 Abort할 수 없다.

### 이유 3. 여러 서비스의 트랜잭션을 자동으로 공유하지 않는다

Kafka Transaction은 Producer가 수행하는 Kafka 작업을 관리한다.

독립적인 여러 서비스가 각자의 DB 트랜잭션과 Kafka Producer를 사용한다고 해서 하나의 글로벌 트랜잭션으로 자동 묶이지 않는다.

### Kafka Transaction vs Saga

| 구분        | Kafka Transaction | Saga              |
| --------- | ----------------- | ----------------- |
| 목적        | Kafka 작업의 원자성     | 분산 비즈니스 작업의 일관성   |
| 처리 방식     | Commit / Abort    | 로컬 Commit + 보상 작업 |
| 적용 범위     | Kafka 메시지와 Offset | 여러 서비스의 비즈니스 로직   |
| 이미 커밋된 작업 | 소급 Abort 불가능      | 보상 트랜잭션 실행        |
| 외부 DB 처리  | 자동 롤백 불가          | 해당 서비스에서 보상 로직 수행 |
| 일관성       | Kafka 작업의 원자성     | 최종 일관성 추구         |

## 8. 전체 개념 최종 정리

| 기술 / 패턴              | 해결하려는 문제                         | 핵심 원리                      |
| -------------------- | -------------------------------- | -------------------------- |
| Idempotent Producer  | Producer 재시도로 인한 Kafka 중복 기록     | PID + Sequence Number      |
| Unique Key           | Consumer의 중복 INSERT              | DB 제약 조건                   |
| Upsert               | 동일 상태의 반복 반영                     | 최종 값 덮어쓰기                  |
| Inbox                | Consumer의 비즈니스 로직 중복 실행          | 처리한 이벤트 ID 저장              |
| WAL                  | DB 변경의 내구성 및 장애 복구               | 선행 로그 기록                   |
| Kafka Transaction    | Kafka 메시지 발행과 Offset Commit의 원자성 | Coordinator + Commit/Abort |
| Kafka EOS            | Kafka 내부 처리 결과의 중복 반영 방지         | 멱등성 + 트랜잭션 + 격리 수준         |
| Transactional Outbox | DB 변경과 이벤트 발행 요청의 일관성            | 비즈니스 데이터 + Outbox 원자적 저장   |
| Saga                 | 여러 서비스의 분산 비즈니스 작업 관리            | 로컬 트랜잭션 + 보상               |
| 보상 트랜잭션              | 이미 커밋된 작업의 효과 취소                 | 새로운 반대·상쇄 작업 실행            |

### 반드시 기억할 핵심 5가지

1. Kafka 멱등성 프로듀서와 Inbox는 해결하는 중복 문제가 다르다. 전자는 Kafka 기록 중복, 후자는 Consumer의 비즈니스 처리 중복을 다룬다.
2. Kafka Transaction은 실제로 존재한다. 여러 Kafka 메시지 발행과 Consumer Offset Commit을 원자적으로 묶을 수 있다.
3. Kafka의 Abort는 보상 트랜잭션이 아니다. 메시지를 삭제하는 대신 `read_committed` Consumer에게 보이지 않도록 한다.
4. 이미 커밋된 외부 DB나 결제 작업은 Kafka Transaction으로 되돌릴 수 없다. 외부 시스템까지 원자성을 자동으로 확장하지 못한다.
5. Saga는 이미 완료된 분산 작업의 효과를 보상하는 패턴이다. 이벤트는 보상 작업을 요청하는 수단이며, 실제 취소 작업은 해당 서비스에서 수행한다.

한 문장으로 정리하면: Kafka Transaction은 Kafka 내부 작업을 확정하거나 무효화하는 기술이고, Inbox/Outbox는 Kafka와 DB 사이의 처리 신뢰성을 높이는 패턴이며, Saga는 여러 서비스에서 이미 확정된 비즈니스 작업의 실패를 보상하는 패턴이다.