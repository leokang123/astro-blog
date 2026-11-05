---
title: "PSA - 기술별 구현방식의 통합 "
order: 6
pubDatetime: 2026-11-05T14:31:52+09:00
modDatetime: 2026-11-05T14:32:17+09:00
description: ""
ogImage: "@/assets/images/2026-11-05-003.png"
tags:
  - general
---

DispatcherServlet이 HTTP 요청 처리 구조의 문제를 해결했다면, PSA는 기술마다 사용 방법이 달라지는 문제를 해결하려는 개념이야.

### ① 기존 방식의 문제

예를 들어 JDBC에서 트랜잭션을 사용하면 다음과 같이 작성해야 해.

```
Connection conn = dataSource.getConnection();

try {
    conn.setAutoCommit(false);

    // 비즈니스 로직

    conn.commit();
} catch (Exception e) {
    conn.rollback();
    throw e;
} finally {
    conn.close();
}
```

반면 JPA에서는 트랜잭션을 다음과 같이 관리할 수 있어.

```
EntityTransaction tx = em.getTransaction();

tx.begin();

try {
    // 비즈니스 로직

    tx.commit();
} catch (Exception e) {
    tx.rollback();
    throw e;
}
```

둘 다 트랜잭션이라는 동일한 기능을 수행하지만 사용하는 API가 달라.

따라서 애플리케이션이 특정 기술의 API에 직접 의존하면 기술을 변경할 때 관련 코드도 수정해야 해.

### ② Spring PSA를 적용한 구조

Spring은 `PlatformTransactionManager`라는 공통 인터페이스를 제공해.
![2026-11-05-003](@/assets/images/2026-11-05-003.png)


개발자는 구현체를 직접 다루는 대신 다음과 같이 작성해.

```
@Service
public class OrderService {

    @Transactional
    public void createOrder() {
        orderRepository.save(order);
        paymentRepository.save(payment);
    }
}
```

Spring은 AOP 기반 트랜잭션 처리 과정에서 설정된 `PlatformTransactionManager` 구현체를 사용해 트랜잭션을 관리해.

따라서 JDBC에서 JPA로 변경하더라도 트랜잭션을 선언하는 `@Transactional` 코드는 유지할 수 있어.

물론 Repository나 실제 데이터 접근 코드는 변경해야 할 수 있어. PSA가 모든 기술 교체를 자동화하는 것은 아니야.

### PSA의 핵심 이점

무엇을 하고 싶은지와 그것을 어떤 기술로 구현하는지를 분리한다는 것이야.

즉, 트랜잭션을 사용한다는 목적은 같지만 JDBC와 JPA의 구현 방식이 다르므로, 공통 추상화를 통해 이러한 차이를 감추는 거지.

## 3. 두 개념 비교

| 구분       | DispatcherServlet     | PSA               |
| -------- | --------------------- | ----------------- |
| 해결하려는 문제 | HTTP 요청 처리 코드의 중복과 분산 | 기술별 API 차이와 강한 결합 |
| 핵심 방식    | Front Controller 패턴   | 공통 추상화 인터페이스      |
| 개발자 편의   | Controller 중심 개발      | 기술 독립적인 코드 작성     |
| 대표 사례    | `@GetMapping` 요청 처리   | `@Transactional`  |
| 주요 효과    | 요청 처리 흐름 표준화          | 구현 기술 교체 부담 감소    |

## 4. 함께 이해하면 좋은 Spring의 철학

Spring에서는 이 세 가지가 서로 연결돼.

- DI: 구현체를 외부에서 주입해 의존성을 낮춘다.
- AOP: 트랜잭션처럼 공통적으로 필요한 기능을 비즈니스 로직에서 분리한다.
- PSA: 서로 다른 기술을 공통된 방식으로 사용할 수 있도록 추상화한다.

예를 들어 `@Transactional`은 선언적 트랜잭션을 AOP로 적용하고, 내부적으로 PSA인 트랜잭션 관리 인터페이스를 사용하며, 적절한 구현체는 DI를 통해 연결될 수 있어.

최종적으로 기억할 핵심은 다음 두 문장이야.

DispatcherServlet: 여러 Servlet에서 반복하던 요청 처리 작업을 Spring MVC의 공통 진입점으로 통합해, 개발자가 Controller의 비즈니스 로직에 집중하도록 한다.

PSA: JDBC, JPA처럼 서로 다른 기술의 사용 방식을 추상화해, 비즈니스 코드가 특정 구현 기술에 강하게 의존하지 않도록 한다.