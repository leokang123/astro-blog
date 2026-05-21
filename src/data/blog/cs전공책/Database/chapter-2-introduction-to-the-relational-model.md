---
title: "Chapter 2. Introduction to the Relational Model"
order: 2
pubDatetime: 2026-05-17T00:02:00+09:00
modDatetime: 2026-05-21T23:17:50+09:00
description: "Database System Concepts 정리: Chapter 2. Introduction to the Relational Model"
tags:
  - Database
  - CS
---

## 개요

Relational model은 상업적 data-processing application에서 가장 널리 쓰이는 primary data model이다. 오래 살아남은 이유는 단순히 table 모양이 보기 쉬워서가 아니라, programmer가 network model이나 hierarchical model처럼 low-level access path를 직접 다루지 않고 logical level에서 데이터와 질의를 생각할 수 있게 하기 때문이다. 또한 relational model은 특정 low-level data structure에 묶이지 않으므로, object-relational feature, XML/JSON 같은 semi-structured data 지원, column-store 같은 새로운 저장 방식이 등장해도 핵심 추상화를 유지할 수 있었다.

이 장의 역할은 Chapter 3-5의 SQL을 배우기 전에 relation, tuple, attribute, schema, key, relational algebra 같은 기본 언어를 정확히 세우는 것이다. Chapter 6-7의 schema design, Chapter 15-16의 query processing/optimization도 이 장에서 정의한 relation과 relational algebra 위에 올라간다.

## 핵심 개념

- Relation은 table, tuple은 row, attribute는 column에 해당한다. Relation instance는 특정 시점에 relation이 가진 tuple들의 집합이다.
- Relation은 tuple의 set이므로 tuple의 순서는 의미가 없다. 정렬되어 보이든 unsorted display로 보이든 같은 tuple 집합이면 같은 relation이다.
- Attribute의 domain은 허용 가능한 값의 집합이며, relational model의 기본 가정은 domain이 atomic하다는 것이다.
- Null value는 unknown 또는 does not exist를 나타내지만, query/update에서 여러 어려움을 만들기 때문에 가능하면 줄이는 것이 좋다.
- Relational model의 엄격한 구조는 저장과 처리 효율을 주지만, 데이터 구조가 자주 변하는 application에서는 flexible schema와의 균형이 필요하다.

## 세부 정리

### 2.1 Structure of Relational Databases

Relational database는 고유한 이름을 가진 table들의 모음이다. Figure 2.1의 `instructor` table은 `ID`, `name`, `dept_name`, `salary` 네 column을 가지며, 각 row는 한 instructor에 대한 정보를 기록한다. 여기서 `ID` 값은 instructor를 식별하는 데 쓰인다.

![Figure 2.1](@/assets/images/cs-database-005-figure-2-1-page-67.png)
*Figure 2.1 · PDF p. 67 · instructor relation의 tuple과 attribute 예시*

Relational model의 기본 용어는 table 관찰에서 바로 나온다.

| 일반적 표현 | Relational model 용어 | 의미 |
| --- | --- | --- |
| Table | Relation | 값들 사이의 관계를 나타내는 tuple들의 집합 |
| Row | Tuple | 하나의 정보 단위, 즉 여러 attribute value의 sequence/list |
| Column | Attribute | relation이 기록하는 속성의 이름과 위치 |
| 특정 시점의 table 내용 | Relation instance | 현재 relation에 들어 있는 tuple 집합 |

Figure 2.3의 `prereq` relation은 `course_id`, `prereq_id` 두 attribute만 가진다. 각 tuple은 “두 번째 course가 첫 번째 course의 prerequisite이다”라는 관계를 표현한다. 이 예시는 relation이 단순한 목록이 아니라 값들 사이의 relationship을 담는다는 점을 잘 보여준다.

![Figure 2.3](@/assets/images/cs-database-007-figure-2-3-page-68.png)
*Figure 2.3 · PDF p. 68 · course와 prerequisite course 사이의 관계를 나타내는 prereq relation*

수학적으로 relation이라는 이름이 붙은 이유도 여기에 있다. n개의 값 사이의 관계는 n-tuple로 표현할 수 있고, table의 한 row는 바로 그런 tuple이다. 예를 들어 `instructor` relation의 tuple `(22222, Einstein, Physics, 95000)`은 특정 ID, name, department, salary 사이의 관계를 나타낸다.

Relation은 tuple의 set이므로 tuple 순서는 의미가 없다. Figure 2.1처럼 `ID` 순서로 정렬해 보이든, Figure 2.4처럼 unsorted display로 보이든 같은 tuple들을 포함하면 같은 relation이다. 교재가 대체로 첫 attribute 기준으로 정렬해 보여주는 것은 설명 편의를 위한 presentation choice이지, relation의 의미가 아니다.

각 attribute에는 허용 가능한 값의 집합인 domain이 있다. `salary`의 domain은 가능한 salary value들의 집합이고, `name`의 domain은 가능한 instructor name들의 집합이다. Relational model은 모든 attribute domain이 atomic해야 한다고 요구한다. Atomic domain이란 domain의 element를 더 이상 나눌 수 없는 indivisible unit으로 취급한다는 뜻이다.

Atomicity는 값 자체의 물리적 구조가 아니라 database가 그 값을 어떻게 사용하는지에 달려 있다. `phone_number`가 여러 전화번호의 set을 담는다면 non-atomic이다. 하나의 전화번호만 담더라도 database operation이 country code, area code, local number로 쪼개 다룬다면 non-atomic하게 취급하는 셈이다. 반대로 전화번호 전체를 하나의 indivisible value로만 다루면 atomic domain으로 볼 수 있다.

Null value는 값이 unknown이거나 does not exist임을 나타내는 특수 값이다. 예를 들어 instructor의 phone number가 없거나 공개되지 않은 경우 null을 사용할 수 있다. 하지만 null은 query와 update의 의미를 복잡하게 만들기 때문에, 교재는 처음에는 null이 없다고 가정하고 Chapter 3에서 SQL operation에 null이 미치는 영향을 따로 설명한다.

Relational structure의 엄격함은 storage와 query processing에서 큰 장점이 된다. 그러나 모든 application에 항상 최선은 아니다. 데이터의 type과 structure가 시간에 따라 자주 바뀌는 application에서는 미리 정해진 schema가 제약이 될 수 있다. 현대 enterprise는 structured data가 주는 효율성과, 구조 변화가 잦은 상황에서 필요한 flexibility 사이의 균형을 찾아야 한다.

### 2.2 Database Schema

Database를 말할 때는 database schema와 database instance를 구분해야 한다. Database schema는 database의 logical design이고, database instance는 특정 시점에 database에 들어 있는 data의 snapshot이다. Programming language 비유로 보면 relation은 variable, relation schema는 type definition, relation instance는 variable이 현재 가진 value에 대응한다.

Relation schema는 일반적으로 attribute 목록과 각 attribute의 domain으로 구성된다. 예를 들어 `department` relation schema는 다음처럼 쓴다.

```text
department(dept_name, building, budget)
```

Schema는 보통 자주 바뀌지 않지만, instance는 insert/delete/update에 따라 계속 변한다. 실무와 교재에서는 `instructor`라는 이름을 schema와 instance 모두에 쓰는 경우가 많다. 문맥상 모호하면 `instructor schema`, `an instance of the instructor relation`처럼 명시한다.

Common attribute는 서로 다른 relation의 tuple을 연결하는 방법이다. `dept_name`은 `instructor` schema와 `department` schema에 모두 나타난다. Watson building에 있는 department의 instructor를 찾으려면 먼저 `department` relation에서 `building = Watson`인 department name을 찾고, 그 `dept_name`을 사용해 `instructor` relation에서 해당 instructor들을 찾는다. 이 흐름은 나중에 join의 직관이 된다.

University database 예제는 여러 relation으로 구성된다. `section(course_id, sec_id, semester, year, building, room_number, time_slot_id)`은 특정 course의 개별 offering을 표현하고, `teaches(ID, course_id, sec_id, semester, year)`는 instructor와 section 사이의 association을 표현한다. 실제 대학 database는 더 크지만, 교재는 instructor, department, course, section, prereq, teaches, student, advisor, takes, classroom, time_slot 같은 relation을 반복 예제로 사용한다.

### 2.3 Keys

Key는 relation 안의 tuple을 서로 구분하기 위한 attribute 집합이다. Relational model에서는 relation이 set이므로 같은 tuple이 두 번 존재하지 않는다고 가정한다. 하지만 tuple 전체를 비교해서 구분하는 것보다, 현실 enterprise에서 tuple을 식별하는 속성을 명확히 지정하는 것이 중요하다.

핵심 key 용어는 다음과 같다.

| 용어 | 정의 | 예시 |
| --- | --- | --- |
| Superkey | relation의 tuple을 uniquely identify할 수 있는 하나 이상의 attribute 집합 | `instructor`의 `{ID}`, `{ID, name}` |
| Candidate key | proper subset이 superkey가 아닌 minimal superkey | `{ID}`, 만약 충분하다면 `{name, dept_name}` |
| Primary key | database designer가 tuple 식별의 principal means로 선택한 candidate key | `instructor.ID`, `department.dept_name` |
| Composite key | 둘 이상의 attribute로 구성된 key | `classroom(building, room_number)` |
| Foreign key | 한 relation의 attribute가 다른 relation의 primary key 값을 참조하도록 하는 constraint | `instructor.dept_name` references `department.dept_name` |

Superkey에는 불필요한 attribute가 섞일 수 있다. `{ID, name}`은 instructor를 구분할 수 있으므로 superkey지만, `ID`만으로 충분하다면 minimal하지 않으므로 candidate key는 아니다. Candidate key는 여러 개일 수 있고, 그중 하나를 primary key로 선택한다.

Key는 개별 tuple의 성질이 아니라 relation 전체에 대한 constraint다. 즉 “현재 두 tuple의 값이 우연히 다르다”가 아니라, 어떤 valid relation instance에서도 key attribute 값이 같은 서로 다른 tuple이 존재하면 안 된다는 enterprise constraint다. 그래서 primary key constraint는 현실 세계의 식별 규칙을 database schema에 반영한다.

Primary key 선택은 신중해야 한다. 사람 이름은 동명이인이 있을 수 있어 부적합하다. 주소처럼 자주 바뀌는 attribute도 key에 넣기 어렵다. 고유 ID처럼 변하지 않거나 거의 변하지 않는 값을 선택해야 application과 foreign-key reference가 안정적으로 유지된다. `classroom`에서는 `building`만으로도, `room_number`만으로도 교실을 식별하지 못하므로 `(building, room_number)`가 primary key가 된다. `time_slot`에서는 `time_slot_id`, `day`, `start_time`이 함께 있어야 tuple을 식별할 수 있다.

Figure 2.8은 교재의 university database schema 전체를 보여준다. Primary-key attribute는 밑줄로 표시된다. 이 목록은 Chapter 2 이후 SQL과 relational algebra 예제의 공통 vocabulary로 계속 쓰인다.

![Figure 2.8](@/assets/images/cs-database-012-figure-2-8-page-74.png)
*Figure 2.8 · PDF p. 74 · university database의 relation schema와 primary key 표시*

Foreign-key constraint는 referencing relation의 attribute 값이 referenced relation의 primary key 값 중 하나로 반드시 존재해야 한다는 제약이다. 예를 들어 `instructor.dept_name`은 `department.dept_name`을 참조하는 foreign key다. 어떤 instructor tuple이 존재한다면 그 `dept_name`은 department relation의 primary key 값 중 하나여야 한다. 마찬가지로 `section(building, room_number)`는 `classroom(building, room_number)`를 참조한다.

Referential-integrity constraint는 더 일반적인 개념이다. 지정된 attribute 값이 참조 대상 relation의 지정 attribute 값 중 하나로 존재해야 한다는 점은 같지만, 참조 대상 attribute가 반드시 primary key일 필요는 없다. `section.time_slot_id` 값이 `time_slot.time_slot_id` 중 하나로 존재해야 한다는 요구가 예다. 다만 `time_slot_id`만으로는 `time_slot`의 primary key가 아니므로, 교재는 이를 foreign-key constraint가 아니라 더 일반적인 referential integrity constraint로 설명한다. 실제 DBMS는 보통 primary key를 참조하는 foreign-key constraint는 지원하지만, referenced attribute가 primary key가 아닌 일반 referential integrity constraint는 제한적으로만 지원한다.

### 2.4 Schema Diagrams

Schema diagram은 database schema와 primary-key/foreign-key constraint를 그림으로 표현한다. 각 relation은 box로 나타내고, relation name을 위에 쓰며, box 안에 attribute를 나열한다. Primary-key attribute는 밑줄로 표시하고, foreign-key constraint는 referencing relation의 foreign-key attribute에서 referenced relation의 primary key로 향하는 arrow로 표시한다.

![Figure 2.9](@/assets/images/cs-database-013-figure-2-9-page-76.png)
*Figure 2.9 · PDF p. 76 · university database의 schema diagram과 foreign-key 연결*

Figure 2.9에서 arrow는 relation 사이의 의미적 연결을 빠르게 보여준다. 예를 들어 `instructor.dept_name`에서 `department.dept_name`으로 향하는 연결은 instructor가 존재하려면 해당 department가 존재해야 함을 뜻한다. 두 머리 arrow는 교재가 referential integrity constraint를 표시하기 위해 사용한 표기이며, 일반 design tool 표준으로 가정하면 안 된다.

Schema diagram과 entity-relationship diagram(E-R diagram)은 생김새가 일부 비슷하지만 같은 표기법이 아니다. Schema diagram은 이미 relation schema로 내려온 구조와 key/foreign-key constraint를 보여주는 쪽에 가깝고, E-R diagram은 Chapter 6에서 다루는 conceptual design 도구다.

### 2.5 Relational Query Languages

Query language는 user가 database에서 원하는 정보를 요청하는 언어다. 일반 programming language보다 높은 level에서 동작하며, 크게 imperative, functional, declarative 방식으로 구분된다.

| Query language 성격 | 사용자가 표현하는 것 | 특징 |
| --- | --- | --- |
| Imperative | 원하는 결과를 얻기 위한 operation sequence | state variable이 있고, 계산 중 state가 update된다. |
| Functional | database data나 다른 function 결과에 대한 function evaluation | side effect 없이 값을 계산한다. |
| Declarative | 원하는 정보의 조건 또는 논리적 성질 | 구체적인 step/function call은 DBMS가 결정한다. |

Relational algebra는 functional query language이며, SQL query language의 theoretical basis가 된다. Tuple relational calculus와 domain relational calculus는 declarative query language이며 Chapter 27에서 다룬다. 이 순수 query language들은 상용 언어의 syntactic sugar는 부족하지만, database에서 데이터를 추출하는 fundamental techniques를 명확하게 보여준다. 실제 SQL은 imperative, functional, declarative 요소가 섞여 있지만, 사용자에게는 주로 declarative style로 보인다.

### 2.6 The Relational Algebra

Relational algebra는 하나 또는 두 개의 relation을 input으로 받아 새로운 relation을 result로 만드는 operation 집합이다. 결과가 다시 relation이므로 operation들을 합성해 relational-algebra expression을 만들 수 있다. 이것이 SQL query를 내부적으로 algebraic expression이나 evaluation plan으로 바꿔 최적화할 수 있는 이론적 배경이다.

Operation은 입력 relation 수에 따라 나뉜다.

| 종류 | Operation 예 | 의미 |
| --- | --- | --- |
| Unary operation | select(σ), project(Π), rename(ρ) | 하나의 relation을 입력으로 받아 조건, column, 이름을 바꾼다. |
| Binary operation | union(∪), Cartesian product(×), set difference(-), join(⋈) | 두 relation을 결합하거나 비교한다. |

Formal relational algebra에서는 relation이 set이므로 duplicate tuple이 없다. 실제 DBMS의 table은 constraint가 없으면 duplicate tuple을 허용하는 경우가 많다. 이 차이는 Chapter 3에서 multiset 또는 bag semantics로 확장해 다룬다.

#### 2.6.1 The Select Operation

Select operation(σ)은 주어진 predicate를 만족하는 tuple만 고른다. Predicate는 σ의 subscript로 쓰고, argument relation은 괄호 안에 쓴다.

$$
\sigma_{\text{dept\_name} = \text{"Physics"}}(instructor)
$$

이 expression은 `instructor` relation에서 `dept_name`이 Physics인 tuple만 남긴다.

![Figure 2.10](@/assets/images/cs-database-014-figure-2-10-page-78.png)
*Figure 2.10 · PDF p. 78 · σ_dept_name = “Physics”(instructor)의 결과*

Selection predicate에는 `=`, `≠`, `<`, `≤`, `>`, `≥` 비교를 사용할 수 있고, `and(∧)`, `or(∨)`, `not(¬)`으로 결합할 수 있다. 예를 들어 Physics department 소속이면서 salary가 90,000보다 큰 instructor는 다음처럼 표현한다.

$$
\sigma_{\text{dept\_name} = \text{"Physics"} \land salary > 90000}(instructor)
$$

Predicate는 attribute와 상수를 비교할 수도 있고, 두 attribute를 비교할 수도 있다. 예를 들어 `department`에서 department name과 building name이 같은 tuple을 찾는다면 `σ_dept_name = building(department)`처럼 쓴다.

#### 2.6.2 The Project Operation

Project operation(Π)은 relation에서 특정 attribute만 남기고 나머지를 버린다. 결과 relation은 set이므로 projection 후 duplicate row가 생기면 제거된다.

$$
\Pi_{ID, name, salary}(instructor)
$$

이 expression은 instructor의 `ID`, `name`, `salary`만 남긴 relation을 만든다.

![Figure 2.11](@/assets/images/cs-database-015-figure-2-11-page-79.png)
*Figure 2.11 · PDF p. 79 · Π_ID, name, salary(instructor)의 결과*

기본 project operator의 attribute list에는 attribute name만 들어가지만, generalized projection은 expression도 허용한다. 예를 들어 `Π_ID, name, salary/12(instructor)`는 annual salary 대신 monthly salary를 계산해 보여주는 projection으로 볼 수 있다.

#### 2.6.3 Composition of Relational Operations

Relational operation의 결과는 다시 relation이다. 그래서 operation을 중첩해 더 복잡한 질의를 만들 수 있다.

$$
\Pi_{name}(\sigma_{\text{dept\_name} = \text{"Physics"}}(instructor))
$$

이 expression은 먼저 Physics department의 instructor tuple만 선택하고, 그 결과 relation에서 `name` attribute만 projection한다. Arithmetic expression에서 `+`, `-`, `*`, `/`를 합성하듯 relational algebra에서도 select, project, join 등을 합성한다.

#### 2.6.4 The Cartesian-Product Operation

Cartesian product(×)는 두 relation의 모든 tuple 조합을 만든다. `r1 × r2`는 `r1`의 tuple 하나와 `r2`의 tuple 하나를 이어 붙인 concatenated tuple들의 relation이다. 만약 `r1`에 `n1`개 tuple, `r2`에 `n2`개 tuple이 있으면 결과에는 `n1 * n2`개 tuple이 생긴다.

Database relation의 Cartesian product는 수학적 set product처럼 tuple pair를 만들기보다, 두 tuple을 하나의 더 긴 tuple로 붙인다. 이때 양쪽 relation에 같은 attribute name이 있으면 ambiguity가 생긴다. 예를 들어 `instructor × teaches`에는 `instructor.ID`와 `teaches.ID`가 모두 존재하므로 relation-name prefix를 붙여 구분한다.

Cartesian product 자체는 대개 너무 많은 무의미한 조합을 만든다. `instructor × teaches`는 모든 instructor를 모든 teaching record와 연결하므로, 실제로 가르친 course와 무관한 조합도 포함한다. 그래서 실제 질의에서는 product 뒤에 selection을 붙이거나, 이를 하나로 묶은 join을 사용한다.

#### 2.6.5 The Join Operation

Join operation(⋈)은 Cartesian product와 selection을 결합한 operation이다. `instructor` 정보와 그 instructor가 가르친 course id를 함께 보고 싶다면, 먼저 `instructor × teaches`를 만들고, 그중 `instructor.ID = teaches.ID`인 tuple만 골라야 한다.

$$
\sigma_{instructor.ID = teaches.ID}(instructor \times teaches)
$$

Figure 2.13은 이 selection 결과다. Gold, Califieri, Singh은 `teaches` relation에 teaching record가 없으므로 결과에 나타나지 않는다.

![Figure 2.13](@/assets/images/cs-database-017-figure-2-13-page-82.png)
*Figure 2.13 · PDF p. 82 · instructor.ID = teaches.ID 조건으로 instructor와 teaches를 결합한 결과*

일반적으로 relation `r(R)`와 `s(S)`, 그리고 `R ∪ S`의 attribute에 대한 predicate `θ`가 있을 때 join은 다음처럼 정의된다.

$$
r \bowtie_\theta s = \sigma_\theta(r \times s)
$$

따라서 위 expression은 다음처럼 쓸 수 있다.

$$
instructor \bowtie_{instructor.ID = teaches.ID} teaches
$$

Join 결과에는 양쪽의 matching attribute가 중복으로 남을 수 있다. 예를 들어 Figure 2.13에는 `instructor.ID`와 `teaches.ID`가 모두 있다. 필요한 경우 projection을 추가해 중복 column을 제거한다. 이 지점이 SQL의 `join ... on ...`과 `select` clause를 함께 이해하는 기반이다.

#### 2.6.6 Set Operations

Set operation은 relation을 tuple set으로 보는 성질을 직접 사용한다. 대표 operation은 union(∪), intersection(∩), set difference(-)다. 예를 들어 Fall 2017에 열린 course와 Spring 2018에 열린 course를 각각 다음 relation으로 만들 수 있다.

$$
\begin{aligned}
\Pi_{\text{course\_id}}(\sigma_{semester = \text{"Fall"} \land year = 2017}(section)) \\
\Pi_{\text{course\_id}}(\sigma_{semester = \text{"Spring"} \land year = 2018}(section))
\end{aligned}
$$

두 semester 중 하나 이상에 열린 course를 찾으려면 union을 사용한다.

$$
\begin{aligned}
\Pi_{\text{course\_id}}(\sigma_{semester = \text{"Fall"} \land year = 2017}(section)) \\
\cup \\
\Pi_{\text{course\_id}}(\sigma_{semester = \text{"Spring"} \land year = 2018}(section))
\end{aligned}
$$

![Figure 2.14](@/assets/images/cs-database-018-figure-2-14-page-83.png)
*Figure 2.14 · PDF p. 83 · Fall 2017 또는 Spring 2018에 열린 course_id의 union 결과*

Figure 2.14에서 Fall 2017 course 3개와 Spring 2018 course 6개를 합쳤는데 결과는 8개다. `CS-101`처럼 두 semester에 모두 등장하는 값은 relation이 set이므로 한 번만 남는다.

Union이 의미 있으려면 두 input relation이 compatible relations이어야 한다. 조건은 두 가지다. 첫째, attribute 수가 같아야 한다. 이 수를 arity라고 한다. 둘째, 각 위치의 attribute type이 서로 맞아야 한다. `instructor`와 `section`은 attribute 수가 달라 union할 수 없고, `instructor`와 `student`는 arity가 모두 4일 수 있지만 네 번째 attribute인 `salary`와 `tot_cred`의 type/의미가 달라 대부분의 상황에서 union이 적절하지 않다.

Intersection(∩)은 두 input relation에 모두 있는 tuple만 남긴다. Fall 2017과 Spring 2018에 모두 열린 course는 다음처럼 표현한다.

$$
\begin{aligned}
\Pi_{\text{course\_id}}(\sigma_{semester = \text{"Fall"} \land year = 2017}(section)) \\
\cap \\
\Pi_{\text{course\_id}}(\sigma_{semester = \text{"Spring"} \land year = 2018}(section))
\end{aligned}
$$

![Figure 2.15](@/assets/images/cs-database-019-figure-2-15-page-84.png)
*Figure 2.15 · PDF p. 84 · Fall 2017과 Spring 2018 양쪽에 모두 열린 course_id의 intersection 결과*

Set difference(-)는 왼쪽 relation에는 있지만 오른쪽 relation에는 없는 tuple을 남긴다. Fall 2017에는 열렸지만 Spring 2018에는 열리지 않은 course는 다음처럼 표현한다.

$$
\begin{aligned}
\Pi_{\text{course\_id}}(\sigma_{semester = \text{"Fall"} \land year = 2017}(section)) \\
- \\
\Pi_{\text{course\_id}}(\sigma_{semester = \text{"Spring"} \land year = 2018}(section))
\end{aligned}
$$

![Figure 2.16](@/assets/images/cs-database-020-figure-2-16-page-84.png)
*Figure 2.16 · PDF p. 84 · Fall 2017에는 있지만 Spring 2018에는 없는 course_id의 difference 결과*

Union, intersection, difference는 모두 compatible relation 사이에서 수행해야 한다. 특히 difference는 방향이 중요하다. `r - s`와 `s - r`은 일반적으로 다른 결과를 낸다.

#### 2.6.7 The Assignment Operation

Assignment operation(←)은 relational-algebra expression의 중간 결과를 temporary relation variable에 붙이는 편의 기능이다. 예를 들어 두 semester course 집합을 먼저 이름 붙여 놓고 intersection을 계산할 수 있다.

$$
\begin{aligned}
courses_{\text{fall\_2017}} &\leftarrow \Pi_{\text{course\_id}}(\sigma_{semester = \text{"Fall"} \land year = 2017}(section)) \\
courses_{\text{spring\_2018}} &\leftarrow \Pi_{\text{course\_id}}(\sigma_{semester = \text{"Spring"} \land year = 2018}(section)) \\
courses_{\text{fall\_2017}} \cap courses_{\text{spring\_2018}}
\end{aligned}
$$

Assignment 자체는 사용자에게 relation을 display하지 않는다. 오른쪽 expression의 결과를 왼쪽 temporary relation variable에 저장하고, 이후 expression에서 재사용할 수 있게 한다. Relational algebra에서 assignment는 표현을 읽기 쉽게 만들 뿐, algebra의 expressive power를 늘리지는 않는다. Permanent relation에 assignment하는 것은 database modification이므로, 여기서 말하는 assignment는 temporary relation variable에 한정된다.

#### 2.6.8 The Rename Operation

Rename operation(ρ)은 relation-algebra expression의 결과에 이름을 붙이거나 attribute 이름을 바꾼다. Expression `E`에 대해 다음은 `E`의 결과를 이름 `x`로 반환한다.

$$
\rho_{x}(E)
$$

두 번째 형태는 relation 이름과 attribute 이름을 동시에 바꾼다. `E`의 arity가 n일 때 다음 expression은 결과 relation 이름을 `x`, attribute 이름을 `A1, A2, ..., An`으로 바꾼다.

$$
\rho_{x}(A_1, A_2, \ldots, A_n)(E)
$$

Rename이 특히 필요한 경우는 같은 relation을 한 query에서 두 번 참조할 때다. “ID가 12121인 instructor보다 salary가 높은 instructor의 ID와 name을 찾으라”는 질의에서는 `instructor`를 두 역할로 사용한다. 하나는 answer candidate를 scan하는 `i`, 다른 하나는 Wu(ID 12121)의 salary를 얻는 `w`다.

$$
\begin{aligned}
\Pi_{i.ID, i.name}( \\
\sigma_{i.salary > w.salary}( \\
\rho_{i}(instructor) \times \sigma_{w.ID = 12121}(\rho_{w}(instructor)) \\
) \\
)
\end{aligned}
$$

Positional notation `$1`, `$2`처럼 attribute 위치로 참조하는 방식도 가능하지만, 사람에게는 attribute name이 훨씬 읽기 쉽다. 그래서 교재는 positional notation을 사용하지 않는다.

#### Note 2.1 Other Relational Operations

교재는 이후 장에서 다룰 추가 operation도 미리 언급한다.

| Operation | 핵심 의미 | 이후 연결 |
| --- | --- | --- |
| Aggregation | average, sum, min, max 같은 function을 전체 또는 group별로 계산 | SQL aggregate, `group by` |
| Natural join | 양쪽 schema에 공통으로 나타나는 attribute들에 대해 equality predicate를 암묵적으로 적용 | SQL natural join, join 위험성 |
| Outer join | matching tuple이 없어도 한쪽 tuple을 보존하고 missing value에 null을 채움 | SQL outer join |

Natural join은 표기상 편하지만 schema 변화에 취약하다. 공통 attribute 이름이 새로 생기면 의도하지 않은 equality condition이 join에 끼어들 수 있다. Outer join은 Figure 2.13에서 빠졌던 Gold, Califieri, Singh처럼 match가 없는 tuple을 결과에 유지하고, 상대 relation의 missing value를 null로 채우는 방식이다.

#### 2.6.9 Equivalent Queries

Relational algebra query는 같은 결과를 여러 expression으로 쓸 수 있다. 예를 들어 Physics department instructor가 가르친 course 정보를 찾는 질의는 selection을 join 뒤에 적용할 수도 있고, `instructor`에 먼저 적용한 뒤 join할 수도 있다.

$$
\sigma_{\text{dept\_name} = \text{"Physics"}}(instructor \bowtie_{instructor.ID = teaches.ID} teaches)
$$

$$
(\sigma_{\text{dept\_name} = \text{"Physics"}}(instructor)) \bowtie_{instructor.ID = teaches.ID} teaches
$$

두 expression은 exact sequence는 다르지만 모든 database instance에서 같은 결과를 낸다면 equivalent queries다. Query optimizer는 사용자가 쓴 순서를 기계적으로 따르기보다, expression이 계산하는 결과를 보고 더 효율적인 equivalent expression을 찾는다. 이 algebraic equivalence가 Chapter 16 query optimization의 핵심 토대다. 일반적으로 selection을 가능한 한 일찍 적용하면 join에 들어가는 tuple 수가 줄어들 수 있어 더 효율적일 수 있다.

## 연결 관계

Chapter 2는 relational database를 “표처럼 보이는 저장 형식”이 아니라, schema, constraint, algebra가 결합된 수학적 data model로 세운다. 이후 장들과의 연결은 다음과 같다.

| Chapter 2 개념 | 이어지는 주제 |
| --- | --- |
| Relation, tuple, attribute, domain, null value | Chapter 3 SQL data type, null semantics |
| Database schema, relation schema, database instance | Chapter 3 SQL DDL, Chapter 6-7 schema design |
| Superkey, candidate key, primary key | Chapter 3 primary key constraint, Chapter 7 normalization |
| Foreign-key constraint, referential integrity constraint | Chapter 3-4 integrity constraint, cascade/authorization 논의 |
| Schema diagram | Chapter 6 E-R diagram과 relational schema 변환 |
| Select(σ), project(Π), Cartesian product(×), join(⋈) | Chapter 3 SQL `select-from-where`, Chapter 15 query processing |
| Union(∪), intersection(∩), set difference(-) | SQL set operations, query rewrite |
| Rename(ρ), equivalent queries | Chapter 16 query optimization |
| Natural join, outer join, aggregation | Chapter 4 join expression, Chapter 3 aggregate function |

Relational algebra는 사용자가 실제로 직접 작성하는 상용 query language라기보다 SQL의 의미와 DBMS 내부 query optimization을 설명하기 위한 formal language다. SQL의 `from`은 relation 조합, `where`는 selection predicate, `select` list는 projection과 대응해서 이해할 수 있다. 다만 SQL은 duplicate tuple을 허용하는 bag/multiset semantics와 null semantics를 포함하므로, 순수 relational algebra의 set semantics와 완전히 같지는 않다.

## 오해하기 쉬운 내용

- Relation은 tuple의 set이므로 tuple 순서가 의미를 갖지 않는다. 출력이 정렬되어 보이는 것은 presentation일 뿐이다.
- 현재 instance에서 어떤 attribute 값이 우연히 모두 다르다고 해서 superkey나 primary key로 결론내리면 안 된다. Key는 모든 valid instance에 대한 enterprise constraint다.
- Superkey와 candidate key는 다르다. Superkey에는 extraneous attribute가 있을 수 있고, candidate key는 minimal superkey다.
- Primary key는 candidate key 중 designer가 선택한 대표 식별자다. 여러 candidate key가 있을 수 있지만 primary key는 보통 하나를 선택한다.
- Foreign key는 referenced relation의 primary key를 참조하는 특수한 referential integrity constraint다. 모든 referential integrity constraint가 foreign key인 것은 아니다.
- Projection은 column을 줄이는 operation이지만, relation이 set이므로 duplicate tuple이 생기면 제거된다. SQL의 기본 `select`가 duplicate를 남기는 것과 구분해야 한다.
- Cartesian product는 두 relation의 모든 조합을 만들기 때문에 대부분 그대로 쓰면 의미 없는 tuple이 많이 생긴다. 보통 selection과 결합해 join을 만든다.
- Natural join은 공통 attribute 이름을 기준으로 암묵적 equality predicate를 만들기 때문에 schema가 바뀌면 query 의미가 조용히 바뀔 수 있다.
- Assignment(←)는 algebra를 더 강력하게 만드는 기능이 아니라 복잡한 expression을 읽기 좋게 나누는 편의 기능이다.

## 면접 질문

1. Relational model에서 relation, tuple, attribute, relation instance를 각각 table 용어와 연결해 설명하라.
2. Relation에서 tuple 순서가 의미 없는 이유를 set 개념으로 설명하라.
3. Domain과 atomic domain을 설명하고, phone number 예시가 atomic/non-atomic으로 달라질 수 있는 이유를 말하라.
4. Null value가 필요한 경우와 null이 query/update를 어렵게 만드는 이유를 설명하라.
5. Database schema와 database instance, relation schema와 relation instance의 차이를 설명하라.
6. Common attribute가 relation 사이의 relationship을 표현하는 방식을 `instructor.dept_name`과 `department.dept_name` 예시로 설명하라.
7. Superkey, candidate key, primary key의 차이를 예시와 함께 설명하라.
8. Composite primary key가 필요한 경우를 `classroom(building, room_number)` 또는 `time_slot` 예시로 설명하라.
9. Foreign-key constraint와 referential integrity constraint의 차이를 설명하라.
10. Schema diagram에서 primary key와 foreign key가 어떻게 표현되는지 설명하라.
11. Imperative, functional, declarative query language의 차이를 설명하고 relational algebra와 SQL이 어디에 가까운지 말하라.
12. Select(σ)와 project(Π)의 차이를 relational algebra expression으로 설명하라.
13. Cartesian product가 join의 기반이지만 그대로 쓰기 위험한 이유를 설명하라.
14. `r ⋈_θ s = σ_θ(r × s)`의 의미를 설명하라.
15. Union, intersection, set difference가 compatible relations를 요구하는 이유를 arity와 attribute type 관점에서 설명하라.
16. Rename(ρ)이 self-join 또는 같은 relation의 반복 참조에서 필요한 이유를 설명하라.
17. Equivalent queries가 query optimizer에 왜 중요한지, selection pushdown 예시로 설명하라.

