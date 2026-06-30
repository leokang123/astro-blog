---
title: "Chapter 1. Introduction"
order: 1
pubDatetime: 2026-05-17T00:01:00+09:00
modDatetime: 2026-06-30T17:38:43+09:00
description: "Database System Concepts 정리: Chapter 1. Introduction"
tags:
  - Database
  - CS
---

## 개요

Database-management system(DBMS)은 서로 관련된 데이터 모음(database)과 그 데이터에 접근하기 위한 프로그램 집합이다. DBMS의 1차 목표는 조직에 필요한 정보를 편리하고 효율적으로 저장하고 검색하게 하는 것이다. 여기서 “편리함”은 사용자가 저장 구조나 파일 배치를 몰라도 질의와 갱신을 할 수 있다는 뜻이고, “효율성”은 대량 데이터와 다수 사용자의 접근을 실제 시스템 성능 안에서 처리한다는 뜻이다.

Database system은 단순한 파일 저장소가 아니다. 정보의 저장 구조를 정의하고, 데이터를 조작하는 메커니즘을 제공하며, system crash나 unauthorized access에도 데이터 안전성을 지키고, 여러 사용자가 동시에 공유할 때 생기는 이상 결과(anomalous results)를 막아야 한다. 이 장은 이후 관계형 모델(relational model), SQL, storage, indexing, query processing, transaction, recovery로 이어지는 전체 데이터베이스 교재의 지도 역할을 한다.

## 핵심 개념

- DBMS(Database-management system)는 interrelated data와 access program을 함께 제공해, 대량 데이터의 저장, 검색, 갱신, 보호, 공유를 편리하고 효율적으로 처리한다.
- File-processing system의 한계는 data redundancy, inconsistency, data isolation, integrity, atomicity, concurrent-access anomaly, security 문제로 나타난다.
- Data abstraction은 physical level, logical level, view level로 나뉘며, physical data independence는 application을 저장 구조 변경에서 분리한다.
- Relational model은 table/relation, row, attribute로 데이터를 표현하고, SQL의 DDL/DML은 schema 정의와 데이터 조작을 담당한다.
- Database engine은 storage manager, query processor, transaction manager로 나뉘며, application architecture는 two-tier와 three-tier로 구분된다.

## 세부 정리

### 1.1 Database-System Applications

초기 database system은 1960년대 상업 데이터(commercial data)를 전산화해 관리하기 위해 등장했지만, 현대의 database application은 훨씬 넓고 복잡하다. 은행의 계좌와 고객 데이터, social-network site의 사용자 연결, 온라인 상거래의 주문과 추천 데이터처럼 기업의 핵심 가치는 물리적 자산보다 정보 자체에 묶이는 경우가 많다.

Database system이 다루는 데이터 모음은 보통 세 가지 성질을 가진다.

- 높은 가치(highly valuable)를 가진다. 데이터 손실은 곧 조직 기능이나 기업 가치 손실로 이어진다.
- 크기가 크다(relatively large). 사람이 파일 몇 개를 직접 관리하는 방식으로는 구조와 양을 감당하기 어렵다.
- 여러 사용자와 application이 동시에 접근한다(accessed by multiple users and applications, often at the same time). 읽기뿐 아니라 갱신도 동시에 일어나므로 일관성 제어가 필요하다.

전통적인 구조화 데이터(structured data)의 예는 대학의 course, student, registration 기록이다. 각 course에는 course-identifier, title, department, course number처럼 반복되는 속성이 있고, 각 student에도 student-identifier, name, address, phone 같은 일정한 속성이 있다. 반면 social-media 데이터는 이름이나 생년월일 같은 단순 항목부터 text, image, video, link, user connection까지 다양한 구조를 가진다. 현대 DBMS는 반복 구조의 공통성을 이용해 효율을 얻으면서도, 약한 구조(weakly structured data)나 형식이 자주 바뀌는 데이터도 허용해야 한다.

이 복잡성을 숨기는 핵심 수단이 abstraction이다. 운전자가 엔진 내부 구조를 몰라도 자동차를 조작하듯, database user와 application programmer는 데이터가 디스크에 어떤 형식으로 저장되고 어떤 인덱스로 조직되는지 몰라도 필요한 정보를 다룰 수 있어야 한다. DBMS는 기업의 다양한 데이터를 unified repository로 통합하면서, 사용자에게는 단순화된 abstract view를 제공한다.

대표적인 database application 영역은 enterprise information(sales, accounting, human resources), manufacturing, banking and finance, university, airline, telecommunication, web-based services, document databases, navigation systems 등이다. 중요한 점은 목록 자체를 외우는 것이 아니라, 모두 “가치 높은 대량 데이터를 여러 주체가 반복적으로 읽고 갱신한다”는 공통 구조를 가진다는 점이다.

Database 사용 방식은 크게 두 흐름으로 나뉜다.

| 사용 방식 | 핵심 목적 | 전형적 접근 패턴 | 이후 연결 |
| --- | --- | --- | --- |
| Online transaction processing(OLTP) | 다수 사용자의 작은 조회와 작은 갱신을 빠르고 정확하게 처리 | 계좌 이체, 주문, 수강 신청, ATM, 모바일 앱 | transaction, concurrency control, recovery |
| Data analytics | 축적된 데이터에서 규칙, 패턴, 예측 모델을 찾아 의사결정에 사용 | 광고 클릭 예측, 대출 상환 가능성 예측, 수요 예측 | data mining, big data, data warehousing |

Data mining은 artificial intelligence와 statistical analysis의 knowledge-discovery 기법을, 매우 큰 database에서 실행 가능한 효율적 구현 기법과 결합한 분야다. 이 장에서는 깊게 다루지 않지만, “database는 기록 저장소일 뿐”이라는 오해를 깨는 중요한 연결점이다. 현대 DBMS는 운영 업무를 정확히 처리하는 OLTP 기반이면서, 축적 데이터를 분석해 의사결정으로 되돌리는 analytics 기반이기도 하다.

### 1.2 Purpose of Database Systems

Database system의 필요성은 기존 file-processing system의 한계를 보면 분명해진다. 대학 조직이 instructor, student, department, course offering 정보를 운영체제 파일에 저장하고, 학생 추가, 수강 신청, 성적 계산, transcript 생성 같은 작업마다 별도 application program을 작성한다고 해 보자. 시간이 지나 새 전공, 새 학과, 새 규칙이 생길 때마다 파일과 프로그램이 추가되고, 전체 시스템은 여러 사람이 여러 언어와 여러 형식으로 만든 파일 묶음이 된다.

File-processing system의 주요 문제는 다음과 같다.

| 문제 | 의미 | 왜 DBMS가 필요한가 |
| --- | --- | --- |
| Data redundancy and inconsistency | 같은 정보가 여러 파일에 중복 저장되고, 갱신이 일부 사본에만 반영되어 서로 다른 값이 된다. | 데이터 중복을 줄이고, 하나의 논리적 데이터베이스를 통해 일관된 갱신을 강제한다. |
| Difficulty in accessing data | 예상하지 못한 조회 요구가 생기면 새 프로그램을 작성하거나 수작업으로 추출해야 한다. | query language를 통해 사용자가 필요한 데이터를 선언적으로 요청할 수 있게 한다. |
| Data isolation | 데이터가 여러 파일, 여러 형식에 흩어져 있어 새 application이 필요한 데이터를 조합하기 어렵다. | schema와 data model을 통해 데이터 구조를 통합적으로 표현한다. |
| Integrity problems | 계좌 잔액이 음수가 되면 안 된다는 식의 consistency constraint를 여러 프로그램에 중복 구현해야 한다. | integrity constraint를 DBMS 수준에서 정의하고 검사한다. |
| Atomicity problems | 계좌 A에서 차감하고 B에 입금하는 중간에 장애가 나면 한쪽만 반영될 수 있다. | transaction의 atomicity로 “전부 실행되거나 전혀 실행되지 않음(all-or-nothing)”을 보장한다. |
| Concurrent-access anomalies | 두 실행이 같은 이전 값을 읽고 각각 갱신하면 lost update처럼 잘못된 결과가 생긴다. | concurrency control로 동시에 실행되는 작업의 상호작용을 제어한다. |
| Security problems | 임시로 추가된 프로그램들이 제각각 파일을 접근하면 사용자별 접근 제한을 일관되게 강제하기 어렵다. | authorization과 view를 통해 사용자별 접근 범위를 제어한다. |

Atomicity 예시는 이후 transaction 장의 출발점이다. 은행 이체에서 debit과 credit은 논리적으로 하나의 작업이므로, 장애가 발생해도 둘 다 반영되거나 둘 다 반영되지 않아야 한다. Concurrent-access anomaly 예시는 concurrency control의 출발점이다. 두 출금 프로그램이 동시에 잔액 10,000을 읽고 각각 9,500과 9,900을 쓰면 올바른 잔액 9,400이 사라지는 lost update가 발생한다. 수강 신청 count 예시에서도 두 학생이 동시에 39를 읽어 둘 다 40을 쓰면 실제 등록은 2명인데 count는 1만 증가하고, 정원 제한도 깨질 수 있다.

따라서 DBMS의 목적은 단순히 “파일보다 편한 저장”이 아니다. 데이터의 논리적 통합, 편리한 접근, integrity, atomicity, concurrent access 제어, security를 공통 기반으로 제공해 application이 매번 같은 문제를 직접 해결하지 않도록 만드는 것이다.

### 1.3 View of Data

Database system은 사용자가 데이터에 접근하고 수정할 수 있게 하지만, 동시에 저장과 유지보수의 세부 사항을 숨긴다. 이때 사용하는 핵심 개념이 data model과 data abstraction이다.

#### 1.3.1 Data Models

Data model은 데이터, 데이터 사이의 관계(data relationships), 데이터 의미(data semantics), 일관성 제약(consistency constraints)을 설명하기 위한 conceptual tools의 모음이다. 즉 “데이터를 어떤 모양으로 생각하고, 어떤 규칙으로 해석할 것인가”를 정하는 틀이다.

주요 data model은 다음처럼 구분된다.

| Data model | 표현 방식 | 핵심 특징 | 이후 연결 |
| --- | --- | --- | --- |
| Relational Model | table/relation | 고정 형식 record, attribute/column, row로 데이터와 관계를 표현 | Chapter 2, Chapter 7, SQL 전체 |
| Entity-Relationship(E-R) Model | entity와 relationship | 현실 세계의 구별 가능한 object와 object 간 관계를 설계 단계에서 표현 | Chapter 6 database design |
| Semi-structured Data Model | JSON, XML 등 | 같은 종류의 data item도 서로 다른 attribute 집합을 가질 수 있음 | Chapter 8 complex data |
| Object-Based Data Model | object, method, identity | 객체지향 개념을 데이터베이스에 통합하고, relational table 안에 object 개념을 수용 | Chapter 8 |

이 책의 중심은 relational model이다. 이유는 대부분의 실제 database system과 application이 relational model을 기반으로 하고, SQL, schema design, query processing, transaction 같은 후속 주제가 모두 relation/table이라는 공통 표현 위에서 설명되기 때문이다.

#### 1.3.2 Relational Data Model

Relational model에서는 데이터를 table 형태로 표현한다. 각 table은 여러 column을 가지며, 각 column은 고유한 이름을 가진다. 각 row는 하나의 정보 단위, 즉 record에 해당한다. Figure 1.1은 university 예제에서 instructor table과 department table을 보여준다. 이 그림은 이후 장에서 반복해서 쓰일 running example의 출발점이다.

![Figure 1.1](@/assets/images/cs-database-001-figure-1-1-page-39.png)
*Figure 1.1 · PDF p. 39 · instructor와 department를 table/relation으로 표현한 예시*

Figure 1.1에서 instructor table의 한 row는 `ID`, `name`, `dept_name`, `salary`를 가진 한 명의 instructor를 나타낸다. department table의 한 row는 `dept_name`, `building`, `budget`을 가진 한 학과를 나타낸다. 중요한 점은 두 table이 독립된 목록처럼 보이지만, `dept_name`이라는 공통 attribute를 통해 관계를 맺는다는 것이다. 이 관계는 나중에 referential integrity, join, foreign key, schema diagram을 이해하는 기반이 된다.

#### 1.3.3 Data Abstraction

DBMS는 효율적 검색을 위해 내부적으로 복잡한 data structure를 사용한다. 하지만 대부분의 user와 application developer가 disk block, file organization, index 구현을 알아야만 데이터를 쓸 수 있다면 시스템은 실용적이지 않다. 그래서 database system은 여러 수준의 data abstraction을 제공한다.

![Figure 1.2](@/assets/images/cs-database-002-figure-1-2-page-40.png)
*Figure 1.2 · PDF p. 40 · physical, logical, view level로 나뉘는 data abstraction 구조*

세 abstraction level의 의미는 다음과 같다.

| Level | 무엇을 설명하는가 | 사용자가 신경 쓰지 않아도 되는 것 |
| --- | --- | --- |
| Physical level | 데이터가 실제로 어떻게 저장되는가, low-level data structure와 index | record 배치, byte layout, delimiter, file organization, index 세부 |
| Logical level | database에 어떤 data가 저장되고, data 사이에 어떤 relationship이 있는가 | physical-level 구현 복잡도 |
| View level | 전체 database 중 특정 사용자에게 필요한 일부 모습 | 전체 logical schema의 복잡성, 접근하면 안 되는 민감 정보 |

Physical data independence는 application program이 physical schema에 의존하지 않아, 물리적 저장 구조가 바뀌어도 프로그램을 다시 작성하지 않아도 되는 성질이다. 예를 들어 table을 delimiter 기반 파일로 저장하다가 fixed-length layout이나 index 기반 구조로 바꾸더라도, logical schema와 query interface가 유지되면 application은 영향을 받지 않아야 한다.

View level은 단순화뿐 아니라 security mechanism이기도 하다. 예를 들어 registrar office 직원은 student 관련 정보 view만 보고, instructor salary 정보에는 접근하지 못하게 할 수 있다. 즉 view는 “편의를 위한 일부 화면”이면서 동시에 authorization을 실현하는 경계다.

#### 1.3.4 Instances and Schemas

Database schema는 database의 전체 설계이고, database instance는 특정 시점에 실제로 저장된 정보의 모음이다. Programming language 비유로 말하면 schema는 variable declaration과 type definition에 해당하고, instance는 어느 순간 변수들이 가진 실제 값에 해당한다.

Schema도 abstraction level에 따라 나뉜다. Physical schema는 physical level의 설계, logical schema는 logical level의 설계, view-level schema 또는 subschema는 사용자별 view의 설계를 나타낸다. Application programmer에게 가장 중요한 것은 logical schema다. 프로그램은 보통 logical schema를 기준으로 작성되며, physical schema는 그 아래에 숨겨진다.

좋은 schema와 나쁜 schema의 차이는 이후 Chapter 7 relational database design에서 본격적으로 다룬다. 예를 들어 department budget을 instructor record마다 중복 저장하면, Physics department의 budget이 바뀔 때 Physics 소속 모든 instructor record를 수정해야 한다. 이런 중복은 inconsistency를 만들기 쉬우므로 좋은 relational design에서는 제거해야 할 대상이다. 다만 현대의 일부 database application은 더 유연한 logical schema를 요구해, 한 relation 안의 record들이 서로 다른 attribute를 가질 수 있는 경우도 있다.

### 1.4 Database Languages

Database system은 schema를 정의하기 위한 data-definition language(DDL)와, query/update를 표현하기 위한 data-manipulation language(DML)를 제공한다. 실제 시스템에서는 DDL과 DML이 완전히 분리된 언어라기보다 SQL 같은 하나의 database language 안의 구성 요소로 제공된다.

#### 1.4.1 Data-Definition Language

DDL은 database schema와 데이터의 추가 속성을 정의한다. Storage structure와 access method 같은 구현 세부는 data storage and definition language 성격의 DDL 문장으로 지정될 수 있지만, 보통 일반 user에게는 숨겨진다.

DDL은 integrity constraint도 정의한다. 모든 constraint를 임의 predicate로 검사할 수 있으면 이상적이지만 비용이 크기 때문에, DBMS는 보통 적은 overhead로 검사 가능한 제약을 중심으로 지원한다.

| Constraint | 의미 | 예시 |
| --- | --- | --- |
| Domain Constraints | attribute가 가질 수 있는 값의 domain을 제한 | integer, character, date/time, `numeric(12,2)` |
| Referential Integrity | 한 relation의 attribute 값이 다른 relation의 특정 attribute 값으로 존재해야 함 | course의 `dept_name`은 department relation의 `dept_name`에 있어야 함 |
| Authorization | 사용자별로 read, insert, update, delete 권한을 구분 | payroll 담당자는 재무 정보만 접근 |

DDL 처리 결과는 data dictionary에 저장된다. Data dictionary는 metadata, 즉 data about data를 담는 특별한 table이며, 일반 user가 직접 갱신하는 대상이 아니라 DBMS가 실제 data를 읽거나 수정하기 전에 참조하는 내부 카탈로그다.

#### 1.4.2 The SQL Data-Definition Language

SQL DDL은 table, data type, integrity constraint를 정의한다. 예를 들어 department table은 다음처럼 정의할 수 있다.

```sql
create table department
   (dept_name char(20),
    building  char(15),
    budget    numeric(12,2));
```

이 문장은 `department`라는 table과 `dept_name`, `building`, `budget` 세 column을 만든다. 여기에 `dept_name`이 primary key라는 제약을 추가하면 두 department가 같은 이름을 갖지 못하게 할 수 있고, instructor의 `dept_name`이 department table에 존재해야 한다는 referential integrity도 지정할 수 있다.

#### 1.4.3 Data-Manipulation Language

DML은 적절한 data model로 조직된 데이터에 접근하거나 조작하기 위한 언어다. 주요 접근 유형은 retrieval, insertion, deletion, modification이다.

DML은 크게 procedural DML과 declarative DML로 나뉜다. Procedural DML은 어떤 데이터가 필요한지와 그 데이터를 어떻게 가져올지를 모두 지정한다. Declarative DML 또는 nonprocedural DML은 어떤 데이터가 필요한지만 지정하고, 어떻게 가져올지는 DBMS가 결정한다. SQL은 대표적인 declarative query language다.

Declarative DML은 사용하기 쉽지만, 그만큼 DBMS 내부의 query processor가 효율적 접근 방법을 찾아야 한다. 즉 사용자가 `what`을 말하면 DBMS가 `how`를 찾아야 하며, 이 책임이 Chapter 15 query processing과 Chapter 16 query optimization으로 이어진다.

#### 1.4.4 The SQL Data-Manipulation Language

SQL query는 nonprocedural하다. Query는 하나 이상의 table을 입력으로 받아 항상 하나의 table을 결과로 반환한다.

```sql
select instructor.name
from instructor
where instructor.dept_name = 'History';
```

이 query는 instructor table에서 `dept_name`이 History인 row를 고르고, 그 row들의 `name`만 결과 table로 반환한다. Figure 1.1 기준으로는 El Said와 Califieri가 결과가 된다.

여러 table을 함께 쓰는 query도 가능하다.

```sql
select instructor.ID, department.dept_name
from instructor, department
where instructor.dept_name = department.dept_name
  and department.budget > 95000;
```

이 query는 instructor와 department를 `dept_name`으로 연결(join)하고, department budget이 95,000보다 큰 department에 속한 instructor의 ID와 department name을 반환한다. 여기서 핵심은 SQL이 “어떤 table을 어떤 조건으로 연결하고 어떤 column을 반환할지”를 선언하지만, 실제 join 순서, access path, index 사용 여부는 DBMS가 결정한다는 점이다.

#### 1.4.5 Database Access from Application Programs

SQL 같은 nonprocedural query language는 Turing machine만큼 일반적인 계산 능력을 제공하지 않는다. 사용자 입력, 화면 출력, 네트워크 통신, 복잡한 application flow는 C/C++, Java, Python 같은 host language로 작성하고, 데이터 접근 부분에 embedded SQL 또는 API 호출을 사용한다. 이런 방식으로 database와 상호작용하는 프로그램을 application program이라고 한다.

Host language에서 DBMS로 DML/DDL 문장을 보내고 결과를 받기 위해 application-program interface(API)를 사용한다. 대표적으로 C 계열 언어에서는 Open Database Connectivity(ODBC), Java에서는 Java Database Connectivity(JDBC)가 쓰인다. 이 구분은 “SQL은 데이터 접근 언어이고, application language는 전체 업무 흐름을 구현한다”는 경계를 이해하는 데 중요하다.

### 1.5 Database Design

Database design은 주로 database schema 설계를 뜻하지만, 실제 complete database application environment는 enterprise의 업무 요구, application operation, 사용자 권한, 성능 요구까지 함께 고려해야 한다. 이 책은 database query 작성과 schema design에 초점을 두고, application design은 Chapter 9에서 별도로 다룬다.

Database design의 흐름은 다음과 같다.

| 단계 | 핵심 산출물 | 설명 |
| --- | --- | --- |
| Requirement analysis | user requirements | prospective user와 domain expert가 어떤 데이터를 필요로 하는지 충분히 파악한다. |
| Conceptual design | conceptual schema | high-level data model을 선택해 enterprise의 data와 relationship을 자세히 표현한다. |
| Functional requirement review | operation/transaction 요구 | update, retrieval, deletion 같은 업무 operation이 schema로 충족되는지 검토한다. |
| Logical design | system-specific database schema | conceptual schema를 실제 사용할 DBMS의 implementation data model로 매핑한다. |
| Physical design | file organization, internal storage structure | 저장 파일 형식, 내부 storage structure, access method를 지정한다. |

Relational model 관점에서 conceptual design은 어떤 attribute를 잡을지와, 그 attribute들을 어떤 table로 묶을지를 결정하는 일이다. “무엇을 저장할 것인가”는 업무적 판단이고, “어떻게 table로 나눌 것인가”는 computer-science 문제다. 대표 접근은 Entity-Relationship model을 사용해 설계하는 방법과, 모든 attribute 집합을 입력으로 받아 table 집합을 생성하는 normalization 알고리즘을 사용하는 방법이다.

### 1.6 Database Engine

Database engine은 DBMS의 책임을 기능별 module로 나눈 내부 실행 구조다. 큰 축은 storage manager, query processor, transaction management component다.

Storage manager가 중요한 이유는 database 크기가 main memory보다 훨씬 크고, main memory는 crash 시 내용이 사라지기 때문이다. 기업 database는 수백 GB에서 TB, 큰 enterprise는 multi-PB까지 커질 수 있으므로 데이터는 disk나 SSD에 저장되고, 필요할 때 main memory로 이동한다. Disk와 main memory 사이의 이동은 CPU 연산보다 훨씬 느리므로, DBMS는 data movement를 줄이도록 데이터 배치와 access path를 설계해야 한다.

Query processor는 user가 view/logical level에서 선언형 query를 작성해도 좋은 성능을 얻도록 돕는다. 사용자는 physical-level 구현을 몰라도 되지만, DBMS는 nonprocedural language로 작성된 query/update를 physical level의 효율적인 operation sequence로 번역해야 한다.

Transaction manager는 application developer가 여러 database access를 하나의 logical unit으로 다루게 해 준다. 즉 developer는 debit과 credit을 “하나의 이체”로 생각하고, DBMS는 system failure와 concurrent access의 세부 문제를 처리한다.

#### 1.6.1 Storage Manager

Storage manager는 database에 저장된 low-level data와 application program/query 사이의 interface다. Raw data는 operating system의 file system을 사용해 disk에 저장되며, storage manager는 DML statement를 low-level file-system command로 변환해 store, retrieve, update를 수행한다.

Storage manager의 구성 요소는 다음과 같다.

| Component | 역할 |
| --- | --- |
| Authorization and integrity manager | integrity constraint 만족 여부와 user 권한을 검사한다. |
| Transaction manager | failure에도 consistent state를 유지하고 concurrent transaction이 충돌 없이 진행되게 한다. |
| File manager | disk storage 공간 할당과 disk에 저장되는 data structure를 관리한다. |
| Buffer manager | disk에서 main memory로 데이터를 가져오고, 어떤 데이터를 cache할지 결정한다. main memory보다 큰 database를 다루게 하는 핵심 구성 요소다. |

Storage manager가 구현하는 대표 data structure는 data files, data dictionary, indices다. Data files는 database 자체를 저장한다. Data dictionary는 schema 같은 metadata를 저장한다. Index는 특정 값을 가진 data item을 빠르게 찾기 위한 pointer 구조이며, 책의 색인처럼 “값 → 관련 record 위치”를 연결한다. 예를 들어 특정 `ID`를 가진 instructor record나 특정 name을 가진 모든 instructor record를 빠르게 찾는 데 index를 사용할 수 있다.

#### 1.6.2 The Query Processor

Query processor는 DDL과 DML을 실제 실행 가능한 형태로 바꾸는 부분이다.

| Component | 역할 |
| --- | --- |
| DDL interpreter | DDL statement를 해석하고 정의 결과를 data dictionary에 기록한다. |
| DML compiler | query language의 DML statement를 query-evaluation engine이 이해하는 low-level instruction의 evaluation plan으로 번역한다. |
| Query optimizer | 같은 결과를 내는 여러 alternative evaluation plan 중 lowest cost plan을 선택한다. |
| Query evaluation engine | DML compiler가 만든 low-level instruction을 실행한다. |

하나의 query는 보통 여러 execution/evaluation plan으로 번역될 수 있다. 예를 들어 join 순서를 바꾸거나 index를 먼저 사용할지 table scan을 할지에 따라 결과는 같아도 비용은 크게 달라진다. 그래서 declarative SQL의 편리함은 query optimization이라는 내부 책임과 짝을 이룬다.

#### 1.6.3 Transaction Management

Transaction은 database application에서 하나의 logical function을 수행하는 operation 모음이다. 계좌 이체는 account A를 debit하고 account B를 credit하는 여러 operation으로 구성되지만, 의미적으로는 하나의 transaction이어야 한다.

Transaction management의 기본 요구는 다음 세 가지로 요약된다.

| 속성 | 의미 | 이체 예시 |
| --- | --- | --- |
| Atomicity | 전부 실행되거나 전혀 실행되지 않아야 한다. | debit만 되고 credit이 안 된 상태로 남으면 안 된다. |
| Consistency | transaction 전후 database consistency constraint가 유지되어야 한다. | A+B 잔액 합이 보존되어야 한다. |
| Durability | 성공적으로 끝난 transaction의 결과는 failure 이후에도 남아야 한다. | 이체 완료 후 crash가 나도 새 잔액이 유지되어야 한다. |

Transaction 실행 중에는 일시적 inconsistency가 필요할 수 있다. debit을 먼저 하고 credit을 나중에 한다면 두 operation 사이의 순간에는 잔액 합이 맞지 않는다. 이 중간 상태에서 failure가 발생하면 문제가 되므로, DBMS의 recovery manager가 failed transaction의 효과를 없애고 이전 consistent state로 되돌려야 한다. 또한 여러 transaction이 동시에 update할 때는 각각의 transaction이 올바르더라도 상호작용 때문에 전체 consistency가 깨질 수 있으므로 concurrency-control manager가 실행 간섭을 제어한다.

Transaction manager는 크게 concurrency-control manager와 recovery manager로 구성된다. 이 연결은 Chapter 17 transaction concept, Chapter 18 concurrency control, Chapter 19 recovery system의 직접적인 예고다.

### 1.7 Database and Application Architecture

Figure 1.3은 centralized server machine에서 동작하는 database system의 전체 구조를 하나로 묶어 보여준다. 사용자는 naive users, application programmers, sophisticated users, database administrators로 나뉘고, 이들이 application interface, application program, query tool, administration tool을 통해 DBMS 구성 요소와 만난다.

![Figure 1.3](@/assets/images/cs-database-003-figure-1-3-page-51.png)
*Figure 1.3 · PDF p. 51 · user, query processor, storage manager, disk storage가 연결된 DBMS system structure*

Figure 1.3에서 중요한 흐름은 `SQL/DDL/DML → query processor → storage manager → disk storage`다. DDL interpreter는 schema 정의를 data dictionary에 기록하고, DML compiler/organizer는 DML query를 evaluation plan으로 바꾸며, query evaluation engine은 이를 실행한다. Storage manager 아래에서는 buffer manager, file manager, authorization and integrity manager, transaction manager가 data files, indices, data dictionary, statistical data와 상호작용한다.

전통적인 database engine은 centralized computer system으로 설명되었지만, 현대 DBMS는 매우 큰 data volume과 높은 processing speed를 위해 parallel processing을 중시한다. Shared-memory server는 여러 CPU가 common shared memory에 접근하는 구조이고, 더 큰 scale에서는 multiple machine으로 구성된 cluster에서 parallel database를 운영한다. Distributed database는 지리적으로 떨어진 여러 machine에 걸쳐 data storage와 query processing을 수행한다.

Application architecture는 DBMS 자체 구조와 구분해서 보아야 한다. Figure 1.4는 database application을 two-tier와 three-tier로 나눈다.

![Figure 1.4](@/assets/images/cs-database-004-figure-1-4-page-52.png)
*Figure 1.4 · PDF p. 52 · client와 server 역할을 나누는 two-tier 및 three-tier architecture*

Two-tier architecture에서는 application이 client machine에 있고, client가 query language statement로 server의 database system 기능을 직접 호출한다. 반면 three-tier architecture에서는 client가 front end 역할만 하며 직접 database call을 포함하지 않는다. Web browser와 mobile application이 오늘날 대표적인 client이고, 이들은 application server와 통신한다. Application server가 business logic을 담고 DBMS와 통신해 data를 접근한다.

Three-tier architecture가 선호되는 이유는 security와 performance 때문이다. Business logic과 database access가 여러 client에 흩어지지 않고 application server에 집중되므로, 권한 검사, 입력 검증, connection 관리, caching, load balancing을 중앙에서 다루기 쉽다. 사용자는 app이나 browser를 쓰지만, 실제 database 접근 책임은 application server와 DBMS 사이에서 통제된다.

### 1.8 Database Users and Administrators

Database system의 1차 목표는 database에서 정보를 검색하고 새 정보를 저장하는 것이다. 이 시스템과 일하는 사람은 크게 database users와 database administrators로 나뉜다.

#### 1.8.1 Database Users and User Interfaces

Database user는 시스템과 상호작용하는 방식에 따라 구분된다. 이 구분은 단순 직책 분류가 아니라, 어떤 abstraction level과 interface가 필요한지를 설명한다.

| 사용자 유형 | 상호작용 방식 | 예시와 핵심 |
| --- | --- | --- |
| Naive users | predefined user interface 사용 | Web/mobile application, forms interface, report. 수강 신청 학생은 form에 입력하고, 실제 DB 접근은 server application이 수행한다. |
| Application programmers | application program 작성 | 사용자 interface와 business logic을 구현하고, ODBC/JDBC/embedded SQL/API로 DBMS에 접근한다. |
| Sophisticated users | 직접 program을 작성하지 않고 query language나 analysis tool 사용 | Analyst가 SQL query나 data analysis software로 database를 탐색한다. |
| Database administrators(DBA) | schema, storage, authorization, maintenance를 중앙 통제 | 조직의 data와 data 접근 program을 관리한다. |

Naive user는 database를 직접 다룬다고 느끼지 않는다. 예를 들어 학생이 web interface로 수강 신청을 하면 application server가 identity를 확인하고, class에 room이 있는지 database에서 조회한 뒤, 가능하면 roster에 student 정보를 추가한다. 사용자는 form을 보지만, 실제로는 transaction, authorization, integrity check가 뒤에서 동작한다.

Sophisticated user는 application programmer와 다르다. 직접 application을 만들지는 않지만, query language나 분석 도구로 database에 직접적인 질문을 던진다. 이 때문에 view, authorization, query optimization이 중요해진다. 잘못 설계하면 사용자는 너무 많은 내부 구조를 알아야 하고, 반대로 너무 막으면 필요한 분석을 할 수 없다.

#### 1.8.2 Database Administrator

DBA(database administrator)는 data와 그 data에 접근하는 program에 대한 central control을 가진 사람 또는 역할이다. DBMS를 쓰는 큰 이유 중 하나가 바로 이 central control이다.

DBA의 주요 기능은 다음과 같다.

| DBA 기능 | 설명 |
| --- | --- |
| Schema definition | DDL statement를 실행해 original database schema를 만든다. |
| Storage structure and access-method definition | data의 physical organization과 생성할 index 같은 access method 관련 parameter를 지정한다. |
| Schema and physical-organization modification | 조직 요구 변화나 performance 개선을 위해 schema와 physical organization을 변경한다. |
| Granting authorization for data access | 사용자별 접근 가능 범위를 read/insert/update/delete 등으로 조절한다. |
| Routine maintenance | backup, free disk space 확보, disk upgrade, expensive job monitoring으로 안정적 운영을 유지한다. |

DBA의 routine maintenance는 장애 전제를 포함한다. 주기적 backup은 flood 같은 disaster로 인한 data loss를 막기 위한 것이고, disk space 관리는 정상 operation이 멈추지 않게 하기 위한 것이다. 또한 매우 비싼 query나 job이 전체 performance를 떨어뜨리지 않도록 monitoring해야 한다.

### 1.9 History of Database Systems

Database system의 역사는 “어떤 data workload가 등장했는가”와 “어떤 hardware/storage가 가능해졌는가”가 함께 바뀐 흐름이다. 암기할 연표라기보다, DBMS가 왜 abstraction, declarative query, transaction, parallel/distributed processing, flexible schema로 확장되었는지를 이해하는 배경이다.

| 시기 | 핵심 변화 | DBMS 관점의 의미 |
| --- | --- | --- |
| 1950s-early 1960s | magnetic tape, punched card, sequential processing | data가 main memory보다 크고 tape는 sequential access만 가능해, program은 정렬 순서에 맞춰 읽고 merge해야 했다. |
| Late 1960s-early 1970s | hard disk의 direct access, network/hierarchical model, Codd의 relational model | disk가 임의 위치 접근을 가능하게 했고, relational model은 구현 세부를 숨긴 nonprocedural query 가능성을 열었다. |
| Late 1970s-1980s | System R, Ingres, Oracle, DB2 등 commercial relational DBMS | relational DBMS가 query optimization 기법으로 performance 약점을 극복하고, low-level procedural 접근을 대체했다. |
| 1990s | decision support 재부상, parallel database, World Wide Web | web scale transaction rate, high reliability, 24 x 7 availability, web interface가 중요해졌다. |
| 2000s | XML/JSON, spatial data, open-source DBMS, graph database, column-store, MapReduce, NoSQL | row-column table만으로 표현하기 어려운 data와 analytics workload가 커졌고, scalability/availability를 위해 strict consistency를 완화하는 시스템이 등장했다. |
| 2010s | NoSQL의 consistency/query 한계 보완, cloud, software as a service(SaaS), privacy/security 이슈 | scalability와 availability를 유지하면서 더 강한 consistency와 higher abstraction을 다시 도입하고, data ownership/security/privacy 문제가 시스템 설계의 일부가 되었다. |

Relational model이 오래 살아남은 이유는 단순히 table이 편해서가 아니다. Network/hierarchical model에서는 programmer가 low-level implementation detail과 procedural access path를 직접 신경 써야 했다. 반면 relational database는 programmer가 logical level에서 작업하게 하고, DBMS가 access path와 optimization을 맡는다. 이 abstraction의 승리가 relational model의 핵심이다.

NoSQL의 등장은 relational model의 실패라기보다, 새로운 workload가 기존 DBMS의 기본 가정과 충돌한 결과로 이해하는 것이 좋다. Social network처럼 graph 구조가 강하고 rapid development가 필요한 application, 지리적으로 분산된 data store에서 high availability가 중요한 application은 strict consistency와 full declarative querying을 일부 포기하고 flexibility와 scalability를 얻었다. 그러나 consistency와 declarative query가 부족하면 programmer와 DBA의 부담이 커지므로, 2010년대 이후 많은 시스템은 다시 더 강한 consistency와 higher-level abstraction을 제공하는 방향으로 진화했다.

Cloud와 SaaS는 database 관리의 책임 경계를 바꾸었다. 기업은 in-house system과 expertise를 유지하는 대신 distributed server farm에 data와 application을 맡길 수 있다. 비용은 줄지만, security breach 책임, data ownership, 정부의 data access 요청 같은 새로운 문제가 생긴다. 즉 현대 database system은 storage/query/transaction 기술만이 아니라 privacy, cybersecurity, regulation과도 연결된다.

## 연결 관계

Chapter 1은 이후 장들의 개념 의존성을 한 번에 깔아 둔다. File-processing system의 문제는 DBMS가 제공해야 할 책임 목록으로 바뀌고, 각 책임은 뒤의 독립 주제로 확장된다.

| Chapter 1 개념 | 뒤에서 이어지는 주제 |
| --- | --- |
| Relational data model, table/relation, attribute, row | Chapter 2 relational model, relational algebra |
| SQL DDL/DML, declarative DML, query language | Chapter 3-5 SQL |
| Database design, E-R model, normalization | Chapter 6 E-R design, Chapter 7 relational design |
| Data files, data dictionary, buffer manager, index | Chapter 12-14 storage and indexing |
| DML compiler, query optimization, query evaluation engine | Chapter 15-16 query processing and optimization |
| Transaction, atomicity, consistency, durability, concurrency-control manager, recovery manager | Chapter 17-19 transaction management |
| Centralized, parallel, distributed architecture | Chapter 20-23 parallel/distributed databases |
| Data analytics, data mining, column-store, MapReduce | Chapter 10-11 big data and analytics |

PDF p. 64의 Part One 소개는 Chapter 1의 다음 이동 방향을 명확히 한다. Relational model은 logical/view level에서 데이터를 table로 표현하고 low-level storage를 숨긴다. 사용자가 이 relational database에서 데이터를 검색하고 갱신하려면 query language가 필요하며, Part One은 relational algebra와 SQL을 통해 이 부분을 전개한다.

## 오해하기 쉬운 내용

- DBMS는 “파일을 잘 정리해 주는 프로그램”이 아니다. 파일 처리 방식이 해결하지 못한 redundancy, inconsistency, integrity, atomicity, concurrent access, security 문제를 공통 시스템 계층에서 처리하는 소프트웨어다.
- Relational model의 table은 spreadsheet처럼 보일 수 있지만, 핵심은 row/column 모양이 아니라 schema, constraint, relationship, query language, logical abstraction이다.
- Declarative SQL이 쉽다는 말은 DBMS 일이 단순하다는 뜻이 아니다. 사용자가 `what`만 말할 수 있게 하려면 DBMS 내부에서 DML compiler, query optimizer, query evaluation engine이 `how`를 결정해야 한다.
- Physical data independence는 성능과 무관하다는 뜻이 아니다. Physical schema와 index는 성능에 매우 중요하지만, application program이 그 세부에 직접 묶이지 않게 하는 것이 목표다.
- View level은 단지 보기 편한 화면이 아니다. 사용자가 database의 일부만 보게 만들어 복잡성을 줄이고, 민감한 정보 접근을 막는 security mechanism이기도 하다.
- Transaction의 consistency는 DBMS 혼자 모든 의미적 correctness를 알아서 만든다는 뜻이 아니다. Programmer가 consistency-preserving transaction을 올바르게 정의해야 하고, DBMS는 atomicity, durability, concurrency control, recovery를 통해 그 정의가 깨지지 않게 돕는다.
- NoSQL은 “SQL이 항상 나쁘다”는 결론이 아니라, scalability, availability, flexible schema가 절실한 workload에서 strict consistency와 full declarative querying의 일부를 trade-off한 흐름이다.

## 면접 질문

1. DBMS(Database-management system)를 정의하고, file-processing system과 비교해 왜 필요한지 설명하라.
2. Data redundancy와 data inconsistency가 어떻게 연결되는지 대학 student/address 예시로 설명하라.
3. Atomicity problem과 concurrent-access anomaly를 계좌 이체 또는 수강 신청 예시로 설명하라.
4. Physical level, logical level, view level의 차이를 말하고, physical data independence가 왜 중요한지 설명하라.
5. Database schema와 database instance의 차이를 programming language의 variable declaration/value 비유로 설명하라.
6. DDL, DML, query language의 차이를 말하고, SQL에서 이들이 어떻게 함께 쓰이는지 설명하라.
7. Declarative DML과 procedural DML의 차이는 무엇이며, declarative query가 query optimizer를 필요로 하는 이유는 무엇인가?
8. Data dictionary가 metadata를 저장한다는 말의 의미를 설명하고, DBMS가 왜 이를 참조하는지 말하라.
9. Storage manager, query processor, transaction manager의 역할을 각각 설명하라.
10. Transaction의 atomicity, consistency, durability를 이체 예시로 설명하고, recovery manager와 concurrency-control manager의 책임을 구분하라.
11. Two-tier architecture와 three-tier architecture의 차이를 설명하고, web/mobile application에 three-tier가 적합한 이유를 말하라.
12. DBA(database administrator)의 주요 책임을 schema, authorization, maintenance 관점에서 설명하라.
13. Relational model이 network/hierarchical model을 대체할 수 있었던 핵심 이유를 abstraction과 nonprocedural query 관점에서 설명하라.
14. Data analytics와 online transaction processing(OLTP)의 workload 차이를 설명하라.
15. NoSQL system이 등장한 배경과 eventual consistency trade-off를 전통적 DBMS와 비교해 설명하라.
