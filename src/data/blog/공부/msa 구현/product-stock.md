---
title: "product-stock"
order: 1
pubDatetime: 2026-08-05T13:47:22+09:00
modDatetime: 2026-08-05T13:49:24+09:00
description: ""
tags:
  - general
  - msa
  - eda
---
# Product–Stock 프로젝트 아키텍처 학습

> 현재 구현한 Product–Kafka–Stock 코드를 기반으로 Spring, 헥사고날 아키텍처, MSA, EDA의 구조와 동작 원리를 학습한다.  
> 테스트 코드는 별도로 학습하기 위해 이 문서에서 제외한다.

## 학습 순서

1. 전체 요청 흐름
2. MSA 관점
3. EDA 관점
4. 헥사고날 아키텍처
5. Spring Container와 Bean
6. `@SpringBootApplication`
7. `@Component`
8. `@Service`
9. `@RequiredArgsConstructor`
10. Bean이 아닌 객체

---

## 1. 현재 시스템 전체 흐름

사용자가 상품 생성 API를 호출하면 다음 흐름으로 처리된다.

```text
POST /api/products
        ↓
ProductController
        ↓
CreateProductUseCase
        ↓
ProductService
        ├─ Product 생성
        ├─ PostgreSQL 저장
        └─ ProductCreatedEvent 발행
                    ↓
                  Kafka
                    ↓
StockEventListener
        ↓
CreateStockUseCase
        ↓
StockService
        ├─ Stock 생성
        └─ PostgreSQL 저장
```

이 하나의 흐름에 Spring, 헥사고날 아키텍처, MSA, EDA가 모두 포함되어 있다.

- **Spring**: 객체 생성, 의존성 주입, HTTP, JPA, Kafka 연결
- **헥사고날 아키텍처**: 도메인, 포트, 어댑터 분리
- **MSA**: Product와 Stock을 별도 애플리케이션으로 분리
- **EDA**: Product가 Stock을 직접 호출하지 않고 이벤트 발행

---

## 2. MSA 관점

현재 Product와 Stock은 각각 별도의 Spring Boot 애플리케이션이다.

### Product 애플리케이션

```java
@SpringBootApplication
public class ProductApplication {

    public static void main(String[] args) {
        SpringApplication.run(ProductApplication.class, args);
    }
}
```

### Stock 애플리케이션

```java
@SpringBootApplication
public class StockApplication {

    public static void main(String[] args) {
        SpringApplication.run(StockApplication.class, args);
    }
}
```

각 애플리케이션은 서로 다른 포트를 사용한다.

```text
Product: 8083
Stock:   8084
```

DB도 서비스별 스키마로 분리했다.

```text
product.product
stock.stock
```

현재는 물리적으로 하나의 PostgreSQL 서버를 사용하지만, 서비스별 스키마를 사용하므로 학습 단계에서 논리적으로 데이터가 격리되어 있다.

### Product는 Stock을 직접 호출하지 않는다

Product 서비스에는 다음과 같은 코드가 없다.

```java
stockService.createStock(...);
```

Stock API를 HTTP로 직접 호출하지도 않는다.

```java
restClient.post()
        .uri("http://stock/api/stocks");
```

대신 Product는 이벤트를 발행한다.

```java
publishProductEventPort.publish(event);
```

따라서 Product는 Stock 서비스의 존재를 직접 알지 못한다.

이것은 서비스 사이의 결합도를 낮춘다.

### 멀티모듈과 MSA의 차이

Gradle 멀티모듈이라는 사실만으로 MSA가 되는 것은 아니다.

MSA의 주요 특징은 다음과 같다.

- 서비스별 독립 프로세스
- 서비스별 독립 배포
- 데이터 소유권 분리
- 서비스 간 직접 코드 의존 금지
- 명시적인 통신 계약 사용
- 한 서비스의 장애가 다른 서비스로 직접 전파되지 않도록 설계

현재 프로젝트는 하나의 저장소에 있지만 Product와 Stock을 서로 다른 컨테이너와 프로세스로 실행하므로 MSA 학습 구조에 해당한다.

---

## 3. EDA 관점

EDA는 Event-Driven Architecture의 약자다.

서비스가 다른 서비스를 직접 호출하는 대신, 발생한 사실을 이벤트로 발행하여 통신한다.

### ProductCreatedEvent

파일 위치:

```text
common/src/main/java/com/eda/common/event/ProductCreatedEvent.java
```

```java
public record ProductCreatedEvent(
        Long productId
) {
}
```

이벤트는 명령이 아니라 이미 발생한 사실을 표현한다.

```text
CreateProduct   → 상품을 만들어라: 명령
ProductCreated  → 상품이 만들어졌다: 이벤트
```

이벤트 이름은 일반적으로 과거형으로 작성한다.

```text
ProductCreated
OrderCreated
PaymentCompleted
StockDeducted
```

### Product의 이벤트 발행

Product 서비스는 상품을 저장한 다음 이벤트를 만든다.

```java
ProductCreatedEvent event =
        new ProductCreatedEvent(savedProduct.getId());

publishProductEventPort.publish(event);
```

Product는 이벤트를 발행한 뒤 Stock 서비스를 직접 호출하지 않는다.

### Stock의 이벤트 구독

Stock 서비스는 상품 생성 이벤트에 관심이 있기 때문에 해당 이벤트를 구독한다.

```java
@KafkaListener(
        topics = "product.events",
        groupId = "stock-service-product"
)
public void handleProductCreated(ProductCreatedEvent event) {
    CreateStockCommand command =
            new CreateStockCommand(event.productId());

    createStockUseCase.create(command);
}
```

### 최종 일관성

Product와 Stock은 하나의 DB 트랜잭션으로 동시에 저장되지 않는다.

```text
10:00:00.000 Product 저장
10:00:00.010 Kafka 이벤트 발행
10:00:00.050 Stock 이벤트 수신
10:00:00.060 Stock 저장
```

Product와 Stock이 정확히 같은 순간에 저장되는 것이 아니라, 일정 시간이 지난 후 전체 상태가 일치하게 된다.

이 방식을 **최종 일관성(Eventual Consistency)**이라고 한다.

---

## 4. 헥사고날 아키텍처

헥사고날 아키텍처는 외부 기술이 핵심 비즈니스 로직을 지배하지 않도록 만드는 구조다.

```text
외부 요청
   ↓
adapter.in
   ↓
port.in
   ↓
application.service
   ↓
domain
   ↓
port.out
   ↑
adapter.out
   ↓
외부 시스템
```

Product 서비스에 대입하면 다음과 같다.

| 구분 | 현재 클래스 |
|---|---|
| 인바운드 어댑터 | `ProductController` |
| 인바운드 포트 | `CreateProductUseCase` |
| 애플리케이션 서비스 | `ProductService` |
| 도메인 | `Product` |
| 아웃바운드 포트 | `SaveProductPort`, `PublishProductEventPort` |
| 아웃바운드 어댑터 | `ProductPersistenceAdapter`, `ProductEventKafkaAdapter` |

### 인바운드 포트

```java
public interface CreateProductUseCase {

    Product create(CreateProductCommand command);
}
```

인바운드 포트는 애플리케이션이 외부에 제공하는 기능이다.

> 상품 생성 기능을 호출할 수 있다.

Controller는 구체적인 `ProductService`가 아니라 인바운드 포트에 의존한다.

```java
private final CreateProductUseCase createProductUseCase;
```

Controller가 구체적인 구현체를 직접 참조하지 않는 것이 중요하다.

```java
// 권장하지 않는 구조
private final ProductService productService;
```

### 아웃바운드 포트

```java
public interface SaveProductPort {

    Product save(Product product);
}
```

아웃바운드 포트는 애플리케이션이 외부 시스템에 요구하는 기능이다.

> Product를 저장해야 한다. 실제 저장 방법은 외부에서 구현한다.

JPA 어댑터가 이 계약을 구현한다.

```java
public class ProductPersistenceAdapter
        implements SaveProductPort {
}
```

ProductService는 JPA를 직접 알지 못한다.

```text
ProductService
→ SaveProductPort
← ProductPersistenceAdapter
→ ProductJpaRepository
→ PostgreSQL
```

---

## 5. Spring Container와 Bean

Spring 애플리케이션의 시작점은 다음 코드다.

```java
SpringApplication.run(ProductApplication.class, args);
```

Spring은 애플리케이션에 필요한 객체를 생성하고 관리한다.

Spring이 생성하고 관리하는 객체를 **Spring Bean**이라고 한다.

### Product의 주요 Bean 관계

```text
ProductController Bean
    ↓ CreateProductUseCase 타입으로 주입
ProductService Bean
    ├─ SaveProductPort 타입으로 주입
    │    ↓
    │  ProductPersistenceAdapter Bean
    │
    └─ PublishProductEventPort 타입으로 주입
         ↓
       ProductEventKafkaAdapter Bean
```

Spring은 인터페이스와 구현체의 관계를 확인하고 알맞은 구현체를 주입한다.

```text
CreateProductUseCase
→ ProductService가 구현

SaveProductPort
→ ProductPersistenceAdapter가 구현

PublishProductEventPort
→ ProductEventKafkaAdapter가 구현
```

예를 들어 ProductService는 다음 의존성을 요구한다.

```java
private final SaveProductPort saveProductPort;
private final PublishProductEventPort publishProductEventPort;
```

Spring은 각 인터페이스의 구현 Bean을 찾는다.

```text
SaveProductPort
→ ProductPersistenceAdapter

PublishProductEventPort
→ ProductEventKafkaAdapter
```

---

## 6. `@SpringBootApplication`

```java
@SpringBootApplication
public class ProductApplication {
}
```

`@SpringBootApplication`은 크게 다음 세 애노테이션의 기능을 합친 것이다.

```java
@Configuration
@EnableAutoConfiguration
@ComponentScan
```

### `@Configuration`

해당 클래스가 Spring 설정 클래스라는 의미다.

```java
@Configuration
public class JpaConfig {
}
```

Spring은 설정 클래스를 읽어 필요한 Bean과 설정을 등록한다.

### `@EnableAutoConfiguration`

현재 클래스패스와 설정 파일을 확인하여 Spring Boot가 필요한 구성을 자동으로 등록한다.

예를 들어 Kafka 의존성과 다음 설정이 있다면:

```yaml
spring:
  kafka:
    bootstrap-servers: localhost:9092
```

Spring Boot가 다음과 같은 객체를 자동 구성한다.

```text
KafkaTemplate
ProducerFactory
ConsumerFactory
KafkaListenerContainerFactory
```

JPA 의존성과 DataSource 설정이 있다면 다음 객체들을 자동 구성한다.

```text
DataSource
EntityManagerFactory
TransactionManager
JpaRepository 구현체
```

### `@ComponentScan`

현재 패키지와 하위 패키지에서 Spring Bean 후보를 찾는다.

```text
com.eda.product
├── adapter
├── application
└── domain
```

`ProductApplication`이 `com.eda.product` 패키지에 있기 때문에 하위 패키지에 있는 다음 애노테이션을 발견한다.

```text
@Component
@Service
@RestController
@Configuration
```

### `@Import`

`common` 패키지는 `com.eda.product`의 하위 패키지가 아니기 때문에 Component Scan으로 자동 발견되지 않는다.

그래서 필요한 설정을 직접 가져온다.

```java
@Import({
        JpaConfig.class,
        GlobalExceptionHandler.class
})
@SpringBootApplication
public class ProductApplication {
}
```

---

## 7. `@Component`

`ProductPersistenceAdapter`에는 `@Component`가 붙어 있다.

```java
@Component
@RequiredArgsConstructor
public class ProductPersistenceAdapter
        implements SaveProductPort {
}
```

`@Component`의 의미는 다음과 같다.

> 이 클래스를 Spring이 객체로 생성하고 관리하라.

`@Component`가 없다면 평범한 Java 클래스이므로 Spring이 자동으로 생성하지 않는다.

```java
public class ProductPersistenceAdapter {
}
```

Spring이 관리하지 않는 객체는 다른 Bean에 자동으로 주입할 수 없다.

`@Component`가 있으면 Spring은 대략 다음 객체를 생성해서 보관한다.

```java
ProductPersistenceAdapter adapter =
        new ProductPersistenceAdapter(productJpaRepository);
```

### 현재 프로젝트의 `@Component`

```java
@Component
public class ProductPersistenceAdapter {
}
```

```java
@Component
public class ProductEventKafkaAdapter {
}
```

```java
@Component
public class StockPersistenceAdapter {
}
```

```java
@Component
public class StockEventListener {
}
```

각 클래스는 모두 Spring이 생성하고 관리하는 Bean이다.

---

## 8. `@Service`

`ProductService`에는 `@Service`가 붙어 있다.

```java
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductService
        implements CreateProductUseCase {
}
```

`@Service`는 내부적으로 `@Component`를 포함한다.

따라서 Bean 등록이라는 기술적인 기능은 비슷하다.

```text
@Component → 일반적인 Spring Bean
@Service   → 비즈니스 유스케이스를 담당하는 Spring Bean
```

다음처럼 `@Component`를 사용해도 현재 코드는 동작할 수 있다.

```java
@Component
public class ProductService {
}
```

하지만 `@Service`를 사용하면 이 클래스가 애플리케이션 서비스라는 의도가 명확하게 드러난다.

```java
@Service
public class ProductService
        implements CreateProductUseCase {
}
```

`@Service`는 단순히 동작을 위한 애노테이션이 아니라 클래스의 역할과 의미를 표현한다.

---

## 9. `@RequiredArgsConstructor`

```java
@RequiredArgsConstructor
public class ProductService {

    private final SaveProductPort saveProductPort;
    private final PublishProductEventPort publishProductEventPort;
}
```

`@RequiredArgsConstructor`는 Spring 애노테이션이 아니라 **Lombok 애노테이션**이다.

컴파일 과정에서 `final` 필드와 `@NonNull` 필드를 받는 생성자를 자동으로 만든다.

위 코드는 컴파일 시 다음과 같은 생성자를 갖게 된다.

```java
public ProductService(
        SaveProductPort saveProductPort,
        PublishProductEventPort publishProductEventPort
) {
    this.saveProductPort = saveProductPort;
    this.publishProductEventPort =
            publishProductEventPort;
}
```

Spring은 생성자의 파라미터 타입을 확인하고 필요한 Bean을 주입한다.

```text
SaveProductPort 필요
→ ProductPersistenceAdapter 발견

PublishProductEventPort 필요
→ ProductEventKafkaAdapter 발견
```

따라서 애플리케이션 코드에서 직접 객체를 만들지 않는다.

```java
ProductService productService =
        new ProductService(
                new ProductPersistenceAdapter(...),
                new ProductEventKafkaAdapter(...)
        );
```

Spring Container가 객체 생성과 연결을 담당한다.

### `final`을 사용하는 이유

```java
private final SaveProductPort saveProductPort;
```

객체가 생성된 후 의존성을 변경할 수 없게 만든다.

```text
객체 생성 시 의존성 결정
→ 객체 생성 이후 변경 불가
```

이 방식을 **생성자 주입**이라고 한다.

### 필드 주입

다음과 같은 방식은 권장하지 않는다.

```java
@Autowired
private SaveProductPort saveProductPort;
```

필드 주입은 객체가 어떤 의존성을 필요로 하는지 생성자만 보고 알기 어렵다.

생성자 주입의 장점은 다음과 같다.

- 필요한 의존성이 명확하다.
- `final` 필드를 사용할 수 있다.
- Spring 없이도 객체를 생성할 수 있다.
- 순환 의존성을 빠르게 발견할 수 있다.
- 객체가 불완전한 상태로 생성되지 않는다.

---

## 10. Bean이 아닌 객체

모든 Java 객체가 Spring Bean인 것은 아니다.

### JPA Entity

```java
@Entity
public class Product {
}
```

`Product`는 JPA Entity지만 일반적인 Spring Bean은 아니다.

Product 객체는 비즈니스 로직에서 직접 생성된다.

```java
Product product =
        Product.register(name, price);
```

### Command

```java
public record CreateProductCommand(
        String name,
        BigDecimal price
) {
}
```

Command도 Spring Bean이 아니다.

유스케이스를 호출할 때 필요한 입력값을 전달하는 일반 값 객체다.

### Event

```java
public record ProductCreatedEvent(
        Long productId
) {
}
```

이벤트 역시 Spring Bean이 아니다.

이벤트가 발생할 때마다 새 객체를 생성한다.

```java
ProductCreatedEvent event =
        new ProductCreatedEvent(savedProduct.getId());
```

### Bean 구분

| 객체 | Spring Bean 여부 |
|---|---|
| `ProductController` | Bean |
| `ProductService` | Bean |
| `ProductPersistenceAdapter` | Bean |
| `ProductEventKafkaAdapter` | Bean |
| `StockEventListener` | Bean |
| `StockService` | Bean |
| `ProductJpaRepository` | Spring Data가 Proxy Bean 생성 |
| `StockJpaRepository` | Spring Data가 Proxy Bean 생성 |
| `Product` | JPA Entity, 일반 Spring Bean 아님 |
| `Stock` | JPA Entity, 일반 Spring Bean 아님 |
| `CreateProductCommand` | 일반 값 객체 |
| `CreateStockCommand` | 일반 값 객체 |
| `ProductCreatedEvent` | 일반 이벤트 객체 |

---

## 핵심 정리

### Spring

Spring은 애플리케이션 객체의 생성과 의존성 연결을 담당한다.

```text
@Component
@Service
@RestController
@Configuration
```

이러한 애노테이션을 통해 Spring이 관리할 Bean을 등록한다.

### 헥사고날 아키텍처

애플리케이션 핵심 로직과 외부 기술을 포트와 어댑터로 분리한다.

```text
Controller → Input Port → Service → Output Port ← Adapter
```

### MSA

Product와 Stock을 독립 프로세스와 데이터 영역으로 분리한다.

```text
Product 서비스
Stock 서비스
```

### EDA

Product가 Stock을 직접 호출하지 않고 이벤트를 통해 통신한다.

```text
Product
→ ProductCreatedEvent
→ Kafka
→ Stock
```

### 다음 학습 내용

다음에는 `ProductController`를 기준으로 다음 내용을 학습한다.

- `@RestController`
- `@RequestMapping`
- `@PostMapping`
- `@RequestBody`
- `@Valid`
- `ResponseEntity`
- Request DTO와 Command의 차이
- Domain 객체와 Response DTO의 차이