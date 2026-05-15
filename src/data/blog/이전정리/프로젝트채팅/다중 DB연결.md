---
title: "다중 DB연결"
pubDatetime: 2024-11-26T23:05:00+09:00
modDatetime: 2024-11-27T10:54:54+09:00
description: "각각의 Entity에서 Getter Setter를 설정해 줘야 Controller에서 정보를 받아다가 매핑할때 알아서 변수이름대로 매핑이 된다."
tags:
  - "일반"
  - "프로젝트채팅"
banner: "@/assets/images/warmalley.jpg"
---

# 다중 DB연결

#프로젝트채팅

*각각의 Entity에서 Getter Setter를 설정해 줘야 Controller에서 정보를 받아다가 매핑할때 알아서 변수이름대로 매핑이 된다.*

다중 DB연결이 실시간 메시지 구현에 필요할것 같아 Config파일을 건드리는데 아무리 해도 잘 되지 않아서 제대로 찾아보고 연습해봤다.
RMDBS 2개 연결 해보고 NoSQL 2개 연결해보고
마지막으로 네개를 한꺼번에 연결 해봤다.

 RDBMS 과 NOSQL 이 Config 파일에 작성해야할 내용이 비슷한듯 사뭇 다르다

RDBMS은 datasource (데이터베이스 연결), entityManager(엔티티와 상호작용), transactionManager(트랜젝션 담당 객체) 가 DB와 연동할 때 필요하다
entityManger를 담당할 entity package에 맞게 세팅해주는 것이 중요하다

NOSQL은 MongoClient(mongodb cluster와 연결), mongoDatabaseFactory(클러스터 내부의 데이터베이스와 연결), mongoTemplate (특정 쿼리를담당하는 객체) 가 필요하다
RDBMS에 비해 세팅이 비교적 간단하다 (따로 릴레이션을 따질게 없어서 그런듯 하다 (그냥 클러스터, 데이터베이스 이름(nosql에선 collection이라부름, 그리고 템플릿만 정하면 됨))

## RDBMS

### **1. `DataSource()`**

#### **역할**

- 데이터베이스 연결을 위한 **DataSource** 객체를 생성합니다.

#### **구성 요소**

- `DataSourceBuilder.create()`: DataSource 객체를 빌드합니다.
- `.driverClassName("com.mysql.cj.jdbc.Driver")`: MySQL 데이터베이스에 연결하기 위한 드라이버 클래스를 설정합니다.
- `.url("jdbc:mysql://localhost:3306/testdb1?serverTimezone=Asia/Seoul")`: MySQL 서버와 연결하기 위한 URL입니다.
    - `localhost`: MySQL 서버 주소.
    - `3306`: MySQL 기본 포트.
    - `testdb1`: 연결할 데이터베이스 이름.
    - `serverTimezone=Asia/Seoul`: 서버의 시간대를 설정하여 시간대 관련 문제를 방지합니다.
- `.username("root")`: MySQL 사용자 이름.
- `.password("q9TeOyny3QNpTk1!")`: MySQL 비밀번호.

#### **왜 필요한가?**

- JPA와 같은 ORM(Object-Relational Mapping) 도구가 데이터베이스에 접근할 수 있도록, 연결 정보(DataSource)가 필요합니다.

---

### **2. `EntityManager()`**

#### **역할**

- 데이터베이스의 엔티티(Entity)와 상호작용하는 **EntityManagerFactory**를 생성합니다.

#### **구성 요소**

- `LocalContainerEntityManagerFactoryBean`: JPA의 `EntityManagerFactory`를 스프링 컨테이너에서 관리하기 위해 사용합니다.
- `.setDataSource(firstDataSource())`: 이 엔티티 매니저가 사용할 `DataSource`를 설정합니다.
- `.setPackagesToScan("com.kjh.fourdatabase.mysqldb1.entity")`: JPA가 스캔할 엔티티 클래스의 패키지를 지정합니다.
- `.setJpaVendorAdapter(new HibernateJpaVendorAdapter())`: Hibernate를 JPA 구현체로 사용하도록 설정합니다.

#### **JPA 속성 설정**

- `hibernate.hbm2ddl.auto`: 데이터베이스 스키마 생성 및 업데이트 전략을 정의합니다.
    - `"update"`: 엔티티 클래스 변경 시 데이터베이스 테이블을 자동으로 업데이트합니다.

#### **왜 필요한가?**

- JPA는 엔티티 클래스와 데이터베이스 간의 매핑을 관리하며, 이를 위해 `EntityManagerFactory`가 필요합니다.

---

### **3. `TransactionManager()`**

#### **역할**

- 데이터베이스 트랜잭션을 관리하기 위한 **PlatformTransactionManager**를 생성합니다.

#### **구성 요소**

- `JpaTransactionManager`: JPA 트랜잭션을 처리하기 위한 구현체.
- `.setEntityManagerFactory(firstEntityManager().getObject())`: 트랜잭션 매니저가 사용할 `EntityManagerFactory`를 설정합니다.

#### **왜 필요한가?**

- 스프링 프레임워크는 데이터베이스 작업을 안전하게 수행하기 위해 트랜잭션 관리를 제공합니다.
- 트랜잭션은 데이터 무결성을 보장하고, 오류가 발생하면 작업을 롤백할 수 있게 합니다.

## **NO SQL**

### **(1) `MongoClient`**

- **역할**: MongoDB 클러스터와의 연결을 관리합니다.
- **작동 원리**:
    - `MongoClients.create("mongodb://localhost:27017")`: 로컬 MongoDB 서버(포트 27017)에 연결하는 클라이언트를 생성합니다.
    - 연결 설정, 인증 정보, 클러스터 정보 등을 처리합니다.
- **이유**: MongoDB 서버와 애플리케이션 간 통신의 기반을 제공합니다.

### **(2) `MongoDatabaseFactory`**

- **역할**: 특정 데이터베이스에 연결을 관리합니다.
- **작동 원리**:
    - `SimpleMongoClientDatabaseFactory`: `MongoClient`와 데이터베이스 이름(`testdb1`)을 받아 데이터베이스와의 연결을 생성합니다.
    - 데이터베이스 팩토리는 요청마다 새로운 연결을 생성하거나 기존 연결을 재활용합니다.
- **이유**: MongoDB의 특정 데이터베이스와 연동하기 위해 사용됩니다.

### **(3) `MongoTemplate`**

- **역할**: MongoDB와의 데이터 액세스를 추상화한 템플릿 객체입니다.
- **작동 원리**:
    - `MongoTemplate`: 데이터 CRUD(Create, Read, Update, Delete)와 쿼리 실행 등을 제공합니다.
    - 내부적으로 `MongoDatabaseFactory`를 사용하여 데이터베이스와 연결을 설정합니다.
- **이유**:
    - MongoDB와의 작업을 간단히 처리하기 위한 인터페이스를 제공합니다.
    - 직접 MongoDB 클라이언트를 사용하는 것보다 코드가 간결하고 유지보수에 용이합니다

### RDBMS Config 예시

```Java
package com.kjh.fourdatabase.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;
import org.springframework.transaction.PlatformTransactionManager;

import javax.sql.DataSource;
import java.util.HashMap;

@Configuration
@EnableJpaRepositories(
        basePackages = "com.kjh.fourdatabase.mysqldb1.repository",
        entityManagerFactoryRef = "firstEntityManager",
        transactionManagerRef = "firstTransactionManager"
)
public class FirstMysqlConfig {

    @Value("${spring.first-datasource.username}")
    private String username;

    @Value("${spring.first-datasource.password}")
    private String password;
    @Primary
    @Bean    public DataSource firstDataSource() {
        return DataSourceBuilder.create()
                .driverClassName("com.mysql.cj.jdbc.Driver")
                .url("jdbc:mysql://localhost:3306/testdb1?serverTimezone=Asia/Seoul")
                .username(username)
                .password(password)
                .build();
    }

    @Primary
    @Bean(name = "firstEntityManager")
    public LocalContainerEntityManagerFactoryBean firstEntityManager() {
        LocalContainerEntityManagerFactoryBean em = new LocalContainerEntityManagerFactoryBean();
        em.setDataSource(firstDataSource());
        em.setPackagesToScan("com.kjh.fourdatabase.mysqldb1.entity");
        em.setJpaVendorAdapter(new HibernateJpaVendorAdapter());

        HashMap<String, Object> properties = new HashMap<>();
        properties.put("hibernate.hbm2ddl.auto", "update");
        em.setJpaPropertyMap(properties);
        return em;
    }

    @Primary
    @Bean(name = "firstTransactionManager")
    public PlatformTransactionManager firstTransactionManager() {
        JpaTransactionManager transactionManager = new JpaTransactionManager();
        transactionManager.setEntityManagerFactory(firstEntityManager().getObject());
        return transactionManager;
    }
}
```

### NOSQL 예시

```Java
package com.kjh.fourdatabase.config;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.mongodb.MongoDatabaseFactory;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.SimpleMongoClientDatabaseFactory;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

@Configuration
@EnableMongoRepositories(
        basePackages = "com.kjh.fourdatabase.mongodb1.repository",
        mongoTemplateRef = "firstMongoTemplate"
)
public class FirstMongoConfig {

    @Primary
    @Bean    public MongoClient firstMongoClient() {
        return MongoClients.create("mongodb://localhost:27017");
    }

    @Primary
    @Bean    public MongoDatabaseFactory firstMongoDatabaseFactory() {
        return new SimpleMongoClientDatabaseFactory(firstMongoClient(),"testdb1");
    }

    @Primary
    @Bean    public MongoTemplate firstMongoTemplate() {
        return new MongoTemplate(firstMongoDatabaseFactory());
    }
}
```

### MongoDB 쿼리

show dbs : 존재하는 데이터베이스 출력
use \<db>: 해당 데이터베이스를 사용하겠다

show collections: 해당 데이터베이스에 존재하는 컬렉션들 출력
db.createCollection("컬렉션이름"): 컬레션이름으로 컬렉션 생성 → NoSql 이라서 그냥 막 넣으면됨
db.insertOne({키: 값, 키: 값 …. }) : 해당 도큐먼트(레코드의 개념) 을 삽입

db.products.insertMany(
{ item: "card", qty: 15 },
{ item: "envelope", qty: 20 },
{ item: "stamps", qty: 30 }
]);
: 리스트로 도큐먼트를 넣어 한번에 삽입

등등 명령어 많음

[\[MONGO\] 📚 몽고디비 CRUD 쿼리 문법 명령어 💯 정리](https://inpa.tistory.com/entry/MONGO-%F0%9F%93%9A-%EB%AA%BD%EA%B3%A0%EB%94%94%EB%B9%84-%EC%BF%BC%EB%A6%AC-%EC%A0%95%EB%A6%AC)
