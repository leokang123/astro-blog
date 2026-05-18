---
title: "Chapter 6. Database Design Using the E-R Model"
order: 6
pubDatetime: 2026-05-17T00:06:00+09:00
modDatetime: 2026-05-17T00:06:00+09:00
description: "Database System Concepts 정리: Chapter 6. Database Design Using the E-R Model"
tags:
  - "Database"
  - "CS"
---

## 개요

이전 장들은 이미 주어진 relational schema 위에서 query, update, constraint, SQL extension을 다루었다. Chapter 6의 질문은 더 앞단에 있다. “처음에 database schema를 어떻게 설계할 것인가?”이다. 이 장은 현실 세계의 enterprise를 `entity`, `relationship`, `attribute`, `constraint`로 개념화하는 `entity-relationship model(E-R model)`을 사용해 conceptual schema를 만들고, 그 E-R design을 relational schema로 낮추는 방법을 설명한다.

Database design은 단순히 table 이름을 고르는 작업이 아니다. 잘못된 설계는 `redundancy`, `inconsistency`, `incompleteness`, 부자연스러운 `null` 사용, application code 변경 비용으로 이어진다. 그래서 이 장은 Chapter 7의 relational design theory, functional dependency, normalization으로 넘어가기 전의 개념 설계 기반이다.

## 핵심 개념

- Database design은 `user requirements`에서 출발해 `conceptual schema`, `logical schema`, `physical schema`로 내려간다.
- `E-R model`은 현실 세계의 구분 가능한 객체를 `entity`, 같은 종류의 entity 묶음을 `entity set`, entity 사이의 연관을 `relationship set`으로 표현한다.
- `attribute`는 entity 또는 relationship이 가진 서술적 성질이고, `primary key`가 되는 attribute는 entity를 고유하게 식별한다.
- `relationship set`에는 `role`, `descriptive attribute`, `degree`, `binary relationship set`, `ternary relationship set` 같은 구조가 붙을 수 있다.
- 좋은 설계는 정보를 정확히 한 곳에 두고, 아직 발생하지 않은 사실도 자연스럽게 표현하며, 이후 relational schema로 변환했을 때 key와 constraint가 보존되도록 한다.

## 세부 정리

### 6.1 Overview of the Design Process

Database application을 만드는 일에는 database schema 설계, data에 접근하고 갱신하는 program 설계, 접근 권한을 통제하는 security scheme 설계가 모두 포함된다. 이 장의 초점은 database schema 설계다. 하지만 schema 설계는 application program이나 security와 분리된 순수한 그림 그리기가 아니라, user가 어떤 data를 저장하고 어떤 operation을 수행할지 이해하는 과정에서 출발한다.

작은 application에서는 domain을 잘 아는 designer가 곧바로 relation, attribute, constraint를 정할 수도 있다. 그러나 현실 application에서는 전체 data requirement를 한 사람이 완전히 이해하기 어렵다. 그래서 high-level data model이 필요하다. High-level model은 사용자가 이해할 수 있는 수준에서 data requirement를 표현하고, 나중에 implementation data model로 내려갈 수 있는 conceptual framework를 제공한다.

#### 6.1.1 Design Phases

Database design의 큰 흐름은 다음처럼 단계적으로 내려간다.

| 단계 | 산출물 | 핵심 질문 |
|---|---|---|
| requirements specification | `user requirements` | 사용자와 domain expert가 어떤 data와 operation을 필요로 하는가? |
| conceptual-design phase | `conceptual schema`, 보통 `E-R diagram` | enterprise의 entity, attribute, relationship, constraint는 무엇인가? |
| functional requirements 검토 | transaction/operation specification | data를 어떻게 search, update, delete, retrieve할 것인가? |
| logical-design phase | `logical schema`, 보통 relational schema | conceptual schema를 DBMS의 implementation data model로 어떻게 map할 것인가? |
| physical-design phase | `physical schema` | file organization, index structure 같은 저장 구조를 어떻게 정할 것인가? |

Conceptual design의 핵심은 physical storage detail을 잠시 잊고, data와 relationship 자체를 정확히 표현하는 것이다. 이 단계에서 designer는 schema가 user requirement를 빠짐없이 만족하는지, requirement끼리 충돌하지 않는지, redundant feature가 없는지 검토한다.

Logical design은 E-R 같은 high-level conceptual schema를 relational model 같은 implementation data model로 변환하는 단계다. 이 장 후반부의 “E-R diagram을 relational schema로 변환”하는 규칙이 여기에 해당한다.

Physical design은 file organization과 index structure 같은 DBMS 내부 저장 결정을 다룬다. 이는 Chapter 13, Chapter 14와 연결된다. 중요한 trade-off는 변경 비용이다. Physical schema는 application이 만들어진 뒤에도 비교적 바꾸기 쉽지만, logical schema 변경은 여러 query와 update code를 건드릴 수 있어 훨씬 비싸다. 그래서 application을 본격적으로 만들기 전에 database design을 신중하게 해야 한다.

#### 6.1.2 Design Alternatives

Schema design에서는 사람, 장소, 상품, course, section 같은 “thing”을 어떻게 표현할지 결정해야 한다. 이 장에서 `entity`는 현실 세계에서 다른 것과 구별되는 item을 뜻한다. University database의 entity 예시는 instructor, student, department, course, course offering이다. Course가 여러 semester에 열릴 수 있고 한 semester에도 여러 번 열릴 수 있으므로, 각 offering은 `section`으로 표현한다.

나쁜 database design의 대표 함정은 두 가지다.

| 함정 | 의미 | 예시 | 결과 |
|---|---|---|---|
| `redundancy` | 같은 정보를 여러 곳에 반복 저장 | section마다 course id뿐 아니라 course title까지 반복 저장 | update 시 복사본이 서로 달라져 `inconsistency` 발생 가능 |
| `incompleteness` | enterprise의 어떤 사실을 자연스럽게 표현하지 못함 | course entity 없이 section만 두면 아직 개설되지 않은 새 course를 표현하기 어려움 | 억지 `null` 삽입, primary-key constraint 충돌 |

Redundancy는 단순 저장 공간 낭비보다 consistency 문제가 더 크다. 예를 들어 같은 course id를 가진 여러 offering에 서로 다른 title이 저장되면 어떤 title이 맞는지 알 수 없다. Ideally, 한 piece of information은 정확히 한 곳에 있어야 한다.

Incompleteness는 아직 section이 없는 course 같은 사실을 표현하지 못하게 만든다. 이를 피하려고 section 정보에 `null`을 넣는 방식은 부자연스럽고, primary key가 `null`을 허용하지 않는 상황에서는 아예 불가능할 수 있다.

나쁜 설계를 피하는 것만으로 충분하지 않다. 현실 enterprise에는 “sale을 customer와 product 사이의 relationship으로 볼 것인가, 아니면 sale 자체를 entity로 볼 것인가?” 같은 선택이 계속 나온다. 이런 선택은 이후 어떤 사실을 쉽게 모델링할 수 있는지에 큰 영향을 준다. 그래서 database design은 형식 규칙만이 아니라 좋은 taste와 domain 이해가 함께 필요한 작업이다.

### 6.2 The Entity-Relationship Model

`entity-relationship data model(E-R data model)`은 database의 전체 logical structure를 enterprise 관점에서 표현하기 위해 만들어진 conceptual data model이다. E-R model의 기본 구성요소는 세 가지다.

| 구성요소 | 의미 |
|---|---|
| `entity set` | 같은 종류의 구분 가능한 객체들의 집합 |
| `relationship set` | entity들 사이의 같은 종류의 association 집합 |
| `attribute` | entity 또는 relationship을 설명하는 property |

E-R model은 `E-R diagram`이라는 그림 표기와 함께 쓰인다. E-R diagram은 전체 logical structure를 사용자가 이해할 수 있게 보여 주기 때문에 conceptual design 단계에서 특히 유용하다.

#### 6.2.1 Entity Sets

`entity`는 현실 세계에서 다른 object와 구분 가능한 “thing” 또는 “object”이다. 사람, 책처럼 concrete할 수도 있고, course, course offering, flight reservation처럼 abstract할 수도 있다.

`entity set`은 같은 type의 entity들이 모인 집합이며, 이 entity들은 같은 property, 즉 attribute를 공유한다. 예를 들어 `instructor` entity set은 대학의 모든 instructor entity를, `student` entity set은 모든 student entity를 나타낸다.

Entity set을 말할 때는 두 수준을 구분해야 한다.

| 용어 | 의미 | relational model과의 대응 |
|---|---|---|
| entity set | “instructor라는 종류의 entity”라는 abstract한 schema 수준 개념 | relation schema에 가까움 |
| extension of entity set | 실제 instructor entity들의 현재 모음 | relation instance에 가까움 |

Entity set들은 반드시 disjoint일 필요가 없다. `person` entity set이 있다면 어떤 person은 instructor이면서 student일 수도 있다.

Entity는 attribute 값들의 모음으로 표현된다. `instructor`의 attribute는 `ID`, `name`, `dept_name`, `salary`가 될 수 있고, `course`의 attribute는 `course_id`, `title`, `dept_name`, `credits`가 될 수 있다. `ID`처럼 entity를 unique하게 식별하는 attribute는 primary key 후보가 된다. 원문은 정부 발급 식별자를 unique identifier로 쓰는 과거 관행을 언급하지만, security와 privacy 때문에 enterprise가 자체 identifier를 만드는 것이 더 바람직하다고 설명한다.

E-R diagram에서 entity set은 두 칸으로 나뉜 rectangle로 표현된다. 위쪽은 entity set 이름, 아래쪽은 attribute 목록이다. Primary key에 속한 attribute는 밑줄로 표시한다.

Figure 6.1은 `instructor`와 `student`라는 두 entity set을 가장 기본적인 E-R rectangle 형태로 보여 준다. 이 그림은 entity set이 “table 비슷한 것”으로 곧바로 구현되는 것은 아니지만, conceptual schema에서 어떤 종류의 object와 attribute를 저장할지 먼저 정리한다는 점을 보여 준다.

![Figure 6.1](@/assets/images/cs-database-077-figure-6-1-page-275.png)
*Figure 6.1 · PDF p. 275 · `instructor`와 `student` entity set의 기본 E-R 표현*

#### 6.2.2 Relationship Sets

`relationship`은 여러 entity 사이의 association이다. 예를 들어 instructor Katz가 student Shankar를 advising한다면, Katz entity와 Shankar entity 사이에 `advisor` relationship instance가 존재한다. `relationship set`은 같은 type의 relationship instance들의 집합이다.

E-R diagram에서 relationship set은 diamond로 나타내고, 참여하는 entity set rectangle과 line으로 연결한다. Figure 6.3은 `instructor`와 `student`가 `advisor` relationship set으로 연결되는 binary relationship을 보여 준다.

![Figure 6.3](@/assets/images/cs-database-079-figure-6-3-page-276.png)
*Figure 6.3 · PDF p. 276 · `advisor` relationship set으로 연결된 `instructor`와 `student`*

Relationship set은 형식적으로 n개 entity set 위의 mathematical relation이다. Entity set `E1, E2, ..., En`이 있을 때 relationship set `R`은 다음 set의 subset이다.

```text
{(e1, e2, ..., en) | e1 in E1, e2 in E2, ..., en in En}
```

여기서 `(e1, e2, ..., en)`이 relationship instance다. Entity set들이 relationship set에 참여하는 것을 `participation`이라고 한다.

`role`은 relationship 안에서 entity가 수행하는 기능이다. 참여 entity set들이 서로 다르면 role은 대개 implicit하다. 하지만 같은 entity set이 relationship에 두 번 참여하는 `recursive relationship set`에서는 role을 명시해야 한다. 예를 들어 `course` entity set 안에서 어떤 course가 다른 course의 prerequisite일 때, 같은 `course` entity가 `course_id` 역할과 `prereq_id` 역할로 구분되어야 한다.

Figure 6.4는 `prereq` recursive relationship set에서 같은 `course` entity set이 서로 다른 role indicator를 가지고 참여하는 모습을 보여 준다. 이 구조를 이해하지 못하면 `(C1, C2)`와 `(C2, C1)`의 의미가 뒤집혀 prerequisite 방향을 잘못 모델링할 수 있다.

![Figure 6.4](@/assets/images/cs-database-080-figure-6-4-page-277.png)
*Figure 6.4 · PDF p. 277 · recursive relationship set에서 role indicator가 필요한 경우*

Relationship 자체에도 attribute가 붙을 수 있다. 이를 `descriptive attribute`라고 한다. 예를 들어 `student`와 `section` 사이의 `takes` relationship에는 학생이 해당 section에서 받은 `grade`가 붙을 수 있다. Grade는 student만의 attribute도 아니고 section만의 attribute도 아니다. 특정 student가 특정 section을 수강한 relationship instance의 성질이다.

Figure 6.5는 `takes` relationship set에 `grade` descriptive attribute가 붙는 예를 보여 준다. E-R diagram에서 relationship attribute는 undivided rectangle으로 그리고, dashed line으로 relationship diamond에 연결한다.

![Figure 6.5](@/assets/images/cs-database-081-figure-6-5-page-277.png)
*Figure 6.5 · PDF p. 277 · `takes` relationship set에 붙은 `grade` descriptive attribute*

복잡한 E-R diagram에서는 entity set이 여러 곳에 반복해서 나타날 수 있다. 하지만 relationship set은 한 곳에만 표시하는 것이 좋고, entity set의 attribute도 첫 등장에만 표시하는 것이 좋다. 같은 entity set의 attribute 목록이 여러 페이지에 중복되면 서로 다른 버전으로 어긋날 위험이 생긴다.

Relationship set에는 `degree`가 있다. `binary relationship set`은 두 entity set이 참여하는 degree 2 relationship이고, `ternary relationship set`은 세 entity set이 참여하는 degree 3 relationship이다. 대부분의 relationship set은 binary지만, 모든 것을 binary로 억지 변환하면 의미가 사라질 수 있다.

예를 들어 `proj_guide`는 instructor, student, project 세 entity set을 동시에 연결한다. “어떤 project에서 어떤 instructor가 어떤 student를 guide하는가”를 표현하려면 세 entity가 한 relationship instance 안에 함께 있어야 한다. Student와 instructor만 binary로 연결하면 project별 guide가 달라질 수 있다는 사실을 잃는다.

Figure 6.6은 ternary relationship set `proj_guide`를 보여 준다. 이 그림은 나중에 6.9의 binary versus n-ary design issue와 직접 연결된다.

![Figure 6.6](@/assets/images/cs-database-082-figure-6-6-page-279.png)
*Figure 6.6 · PDF p. 279 · `instructor`, `student`, `project`를 함께 묶는 ternary relationship*

### 6.3 Complex Attributes

각 attribute에는 허용되는 값의 집합이 있다. 이를 `domain` 또는 `value set`이라고 한다. 예를 들어 `course_id`의 domain은 특정 길이의 text string 집합일 수 있고, `semester`의 domain은 `{Fall, Winter, Spring, Summer}` 같은 값 집합일 수 있다.

E-R model의 attribute는 단순히 column 하나로 끝나지 않는다. 설계 단계에서는 attribute의 내부 구조와 값 개수, 저장 여부를 구분해야 한다.

| attribute type | 의미 | 예시 | 설계상 의미 |
|---|---|---|---|
| `simple attribute` | 더 작은 subpart로 나누지 않는 attribute | `ID`, `salary` | relational schema로 직접 옮기기 쉬움 |
| `composite attribute` | 여러 component attribute로 나눌 수 있는 attribute | `name(first_name, middle_initial, last_name)` | 전체 값과 component 값을 모두 참조할 필요가 있을 때 유용 |
| `single-valued attribute` | 한 entity마다 값이 하나 | `student.ID` | 일반적인 attribute |
| `multivalued attribute` | 한 entity가 값의 set을 가질 수 있음 | `{phone_number}`, `{dependent_name}` | 별도 relation으로 분리될 가능성이 큼 |
| `derived attribute` | 다른 attribute/entity에서 계산되는 attribute | `age`, `students_advised` | 저장하지 않고 필요할 때 계산할 수 있음 |
| `base/stored attribute` | derived attribute의 계산 기반이 되는 저장 attribute | `date_of_birth` | derived value의 원천 |

`composite attribute`는 사용자가 어떤 때는 전체 attribute를, 어떤 때는 component attribute를 참조하고 싶을 때 좋은 modeling 선택이다. 예를 들어 `address`를 `street`, `city`, `state`, `postal_code`로 나누고, 다시 `street`를 `street_number`, `street_name`, `apartment_number`로 나눌 수 있다. 이렇게 하면 관련 attribute를 묶어 conceptual schema를 더 명확하게 만들 수 있다.

`multivalued attribute`는 한 entity에 값이 0개, 1개, 여러 개 있을 수 있음을 나타낸다. Instructor가 phone number를 여러 개 가질 수 있다면 `phone_number`는 instructor의 single-valued attribute가 아니라 multivalued attribute다.

`derived attribute`는 다른 data에서 계산할 수 있는 값이다. Instructor의 `age`는 `date_of_birth`와 current date에서 계산할 수 있고, `students_advised`는 advisor relationship에 참여하는 student 수를 세어 계산할 수 있다. Derived attribute를 저장하면 update anomaly가 생길 수 있으므로, 저장할지 계산할지는 성능과 consistency trade-off를 보고 결정해야 한다.

Figure 6.8은 `instructor` entity set에 composite, multivalued, derived attribute가 한꺼번에 표현되는 방식을 보여 준다. `{phone_number}`는 multivalued attribute이고, `age()`는 derived attribute이며, `name`과 `address`는 hierarchical composite attribute다.

![Figure 6.8](@/assets/images/cs-database-084-figure-6-8-page-281.png)
*Figure 6.8 · PDF p. 281 · composite, multivalued, derived attribute를 포함한 E-R 표현*

`null` value는 attribute 값이 없거나 모를 때 사용된다. 하지만 null의 의미는 하나가 아니다.

| null 의미 | 설명 | 예시 |
|---|---|---|
| `not applicable` | 해당 entity에는 값 자체가 존재하지 않음 | middle name이 없는 사람의 `middle_initial` |
| `missing` | 값은 존재하지만 현재 모름 | instructor name은 있어야 하는데 아직 입력되지 않음 |
| `unknown` | 값이 존재하는지조차 모름 | apartment number가 있는지 여부도 모름 |

Null은 conceptual design에서 “모르는 것”을 대충 넣는 편리한 표시처럼 보이지만, 실제 relational schema와 constraint에서는 큰 차이를 만든다. 특히 key attribute, participation constraint, derived attribute와 함께 쓰일 때 의미를 분명히 해야 한다.

### 6.4 Mapping Cardinalities

`mapping cardinality` 또는 `cardinality ratio`는 relationship set을 통해 한 entity가 다른 entity 몇 개와 association될 수 있는지를 표현한다. Binary relationship set에서 특히 중요하며, 현실 세계의 constraint를 E-R diagram에 직접 반영하는 역할을 한다.

Binary relationship set `R`이 entity set `A`와 `B` 사이에 있을 때 기본 cardinality는 네 가지다.

| cardinality | 의미 |
|---|---|
| `one-to-one` | A의 entity 하나가 B의 entity 최대 하나와 연결되고, B도 A 최대 하나와 연결 |
| `one-to-many` | A 하나가 B 여러 개와 연결될 수 있지만, B 하나는 A 최대 하나와 연결 |
| `many-to-one` | A 하나는 B 최대 하나와 연결되지만, B 하나는 A 여러 개와 연결 가능 |
| `many-to-many` | A와 B 양쪽 모두 여러 entity와 연결 가능 |

Cardinality는 enterprise rule에 따라 달라진다. `advisor` relationship에서 student가 여러 instructor의 공동 지도를 받을 수 있으면 many-to-many다. 반대로 student가 반드시 한 명의 advisor만 가질 수 있고 instructor는 여러 student를 지도할 수 있다면 instructor-to-student 방향의 one-to-many다.

E-R diagram에서는 relationship diamond에서 entity set으로 향하는 directed line 또는 undirected line으로 cardinality constraint를 표시한다. Arrow가 가리키는 쪽이 “one” side다. Figure 6.11은 `advisor` relationship의 one-to-one, one-to-many, many-to-one, many-to-many 표기를 한 번에 비교한다.

![Figure 6.11](@/assets/images/cs-database-087-figure-6-11-page-283.png)
*Figure 6.11 · PDF p. 283 · binary relationship set의 cardinality 제약 표기*

`participation`은 entity set의 entity들이 relationship set에 반드시 참여해야 하는지를 나타낸다. `total participation`은 entity set의 모든 entity가 적어도 하나의 relationship에 참여해야 함을 뜻하고, `partial participation`은 일부 entity가 참여하지 않을 수 있음을 뜻한다.

예를 들어 대학이 모든 student에게 advisor가 있어야 한다고 요구하면 `student`의 `advisor` relationship 참여는 total이다. 반대로 instructor는 아무 student도 지도하지 않을 수 있으므로 instructor의 participation은 partial일 수 있다. E-R diagram에서는 total participation을 double line으로 표시한다.

Cardinality constraint는 `l..h` 형식으로 더 정밀하게 표시할 수도 있다. 여기서 `l`은 minimum cardinality, `h`는 maximum cardinality다. `1..1`은 정확히 하나, `0..*`는 0개 이상 무제한을 뜻한다.

Figure 6.13은 `student` 쪽에 `1..1`, `instructor` 쪽에 `0..*`가 붙은 advisor relationship을 보여 준다. 올바른 해석은 “각 student는 정확히 한 advisor를 가져야 하고, 각 instructor는 0명 이상의 student를 지도할 수 있다”이다.

![Figure 6.13](@/assets/images/cs-database-089-figure-6-13-page-285.png)
*Figure 6.13 · PDF p. 285 · `1..1`과 `0..*`로 표현한 advisor cardinality limit*

Figure 6.13에서 특히 조심해야 할 점은 `0..*`가 붙은 왼쪽 edge를 보고 relationship 방향을 거꾸로 해석하지 않는 것이다. 이 diagram은 instructor-to-student 방향의 one-to-many를 뜻한다. 즉 many side의 entity 수 제한을 보는 것이 아니라, 각 side의 entity가 relationship에 참여할 수 있는 횟수를 읽어야 한다.

Nonbinary relationship set에서도 일부 many-to-one constraint를 표시할 수 있다. 예를 들어 `proj_guide`에서 한 student가 한 project에 대해 최대 한 instructor guide만 가질 수 있다면 instructor 쪽 edge에 arrow를 둘 수 있다. 다만 nonbinary relationship set에서는 둘 이상의 arrow를 허용하면 두 가지 해석이 생겨 ambiguous해질 수 있으므로, 이 책의 E-R notation은 nonbinary relationship set에서 arrow를 최대 하나만 허용한다.

### 6.5 Primary Key

Entity set 안의 entity와 relationship set 안의 relationship instance를 서로 구분하려면 key가 필요하다. Chapter 2의 relation schema key 개념이 E-R model에도 그대로 적용된다.

#### 6.5.1 Entity Sets

개념적으로 entity들은 서로 distinct하지만, database 관점에서는 attribute value로 그 차이가 표현되어야 한다. 따라서 entity set 안의 두 entity가 모든 attribute에서 완전히 같은 값을 가지면 안 된다. Entity set의 `key`는 entity를 서로 구분하기에 충분한 attribute set이다.

`superkey`, `candidate key`, `primary key` 개념은 relation schema뿐 아니라 entity set에도 적용된다. E-R diagram에서 primary key attribute는 밑줄로 표시한다.

#### 6.5.2 Relationship Sets

Relationship set의 key는 참여 entity set들의 primary key와 relationship의 descriptive attribute를 바탕으로 결정된다. Relationship set `R`이 entity set `E1, E2, ..., En`을 연결할 때, 각 entity set의 primary key를 합친 다음 집합이 기본적으로 relationship instance를 구분한다.

```text
primary-key(E1) union primary-key(E2) union ... union primary-key(En)
```

Relationship set 자체에 descriptive attribute `a1, a2, ..., am`이 있으면, 이 attribute들도 relationship instance 설명에는 포함된다. 그러나 relationship set은 set이므로 같은 participating entities 조합이 중복 relationship instance로 존재할 수 없다는 점이 중요하다. 예를 들어 `takes(student, section)`에서는 같은 student와 section 조합이 하나의 relationship instance만 만들 수 있고, 그래서 grade도 하나만 붙는다.

Binary relationship set의 primary key 선택은 mapping cardinality에 따라 달라진다.

| relationship cardinality | relationship set의 primary key 선택 |
|---|---|
| many-to-many | 양쪽 entity set primary key의 union |
| one-to-many | many side entity set의 primary key |
| many-to-one | many side entity set의 primary key |
| one-to-one | 어느 한쪽 entity set의 primary key를 선택 가능 |

예를 들어 student가 최대 한 instructor의 advisor를 가진다면 `advisor` relationship의 primary key는 student의 primary key만으로 충분하다. Student가 정해지면 advisor relationship instance도 최대 하나이기 때문이다. 반대로 many-to-many라면 instructor key와 student key를 함께 써야 한 relationship instance가 결정된다.

Nonbinary relationship set은 cardinality constraint가 없으면 참여 entity set primary key들의 union이 유일한 candidate key가 된다. Cardinality constraint가 있으면 더 복잡해진다. 이 책은 ambiguity를 피하기 위해 nonbinary relationship set에서 arrow를 최대 하나만 허용하며, 이 경우 incoming arrow가 없는 participating entity set들의 primary key union이 relationship set의 primary key가 된다.

둘 이상의 arrow가 필요한 상황은 relationship instance를 별도의 entity set으로 바꾸거나, Chapter 7의 `functional dependency`로 constraint를 더 명확히 표현하는 것이 낫다.

#### 6.5.3 Weak Entity Sets

`weak entity set`은 자신의 attribute만으로 entity를 unique하게 식별할 수 없고, 다른 entity set의 존재에 의존하는 entity set이다. 의존 대상이 되는 entity set은 `identifying entity set` 또는 owner이고, weak entity set과 owner를 연결하는 relationship은 `identifying relationship`이다. Weak entity set이 아닌 entity set은 `strong entity set`이다.

원문의 예시는 `section`이다. Section은 `sec_id`, `semester`, `year`만으로는 unique하지 않을 수 있다. 서로 다른 course에서 같은 semester, year, section id를 사용할 수 있기 때문이다. 따라서 section을 식별하려면 course의 primary key인 `course_id`가 함께 필요하다.

Weak entity set의 key 구조는 다음과 같다.

```text
primary key of weak entity
= primary key of identifying entity set
  + discriminator attributes of weak entity set
```

`discriminator attribute`는 같은 owner 안에서 weak entity를 구분하는 추가 attribute다. Section 예시에서 discriminator는 `sec_id`, `semester`, `year`이고, owner course의 primary key `course_id`를 더해 section의 primary key가 `{course_id, sec_id, year, semester}`가 된다.

Weak entity set의 핵심 제약은 다음과 같다.

| 제약 | 의미 |
|---|---|
| `existence dependent` | weak entity는 identifying entity 없이는 존재할 수 없음 |
| total participation | 모든 weak entity가 identifying relationship에 반드시 참여 |
| many-to-one toward owner | 각 weak entity는 하나의 identifying entity에 속함 |
| identifying relationship has no descriptive attribute | 필요한 descriptive attribute는 weak entity set에 붙이는 것이 자연스러움 |

Figure 6.14는 `section` weak entity set이 `course` strong entity set에 `sec_course` identifying relationship으로 의존하는 모습을 보여 준다. Double rectangle은 weak entity set, double diamond는 identifying relationship, dashed underline은 discriminator, double line은 total participation을 나타낸다.

![Figure 6.14](@/assets/images/cs-database-090-figure-6-14-page-289.png)
*Figure 6.14 · PDF p. 289 · `course`에 existence dependent인 `section` weak entity set*

Weak entity set은 identifying relationship 외의 다른 relationship에도 참여할 수 있다. 또한 어떤 weak entity set이 또 다른 weak entity set의 owner가 될 수도 있고, 여러 identifying entity set 조합에 의해 식별되는 weak entity set도 가능하다. 이런 경우 primary key는 identifying entity set들의 primary key union과 weak entity의 discriminator를 합쳐 만든다.

### 6.6 Removing Redundant Attributes in Entity Sets

E-R design에서는 먼저 포함할 entity set을 정하고, 그 뒤 각 entity set에 어떤 attribute가 필요한지 정한다. 하지만 entity set과 relationship set을 모두 고른 뒤에는 일부 attribute가 relationship 때문에 redundant해질 수 있다. 좋은 E-R design은 이런 redundant attribute를 entity set에서 제거한다.

대표 예시는 `instructor`와 `department`다.

| entity set | 처음 생각할 수 있는 attributes | 문제 |
|---|---|---|
| `instructor` | `ID`, `name`, `dept_name`, `salary` | `dept_name`이 department와의 relationship을 중복 표현 |
| `department` | `dept_name`, `building`, `budget` | `dept_name`은 department의 primary key |

Instructor가 department에 속한다는 사실은 `inst_dept` relationship set으로 표현할 수 있다. 이때 `dept_name`을 instructor attribute로도 두면 같은 사실이 attribute와 relationship에 중복된다. 따라서 E-R design 단계에서는 `instructor`에서 `dept_name`을 제거하고, relationship을 explicit하게 둔다.

이 선택은 처음에는 낯설 수 있다. 이전 장의 relational schema에서는 `instructor(ID, name, dept_name, salary)`처럼 `dept_name`이 있었다. 하지만 E-R에서 relationship으로 표현해 두면, 나중에 relational schema로 변환할 때 cardinality에 따라 `dept_name`이 instructor relation에 다시 들어갈 수도 있고, 별도 `inst_dept` relation이 만들어질 수도 있다. 즉 conceptual design 단계에서 relationship을 attribute로 premature하게 고정하지 않는 것이다.

같은 원리가 `student`와 `department`에도 적용된다. Student의 major department를 `stud_dept` relationship으로 표현하면 `student` entity set에는 `dept_name` attribute가 필요 없다.

Section과 time slot, classroom 예시도 같은 구조다.

| redundancy 후보 | explicit relationship | 제거되는 attribute |
|---|---|---|
| section의 `time_slot_id` | `sec_time_slot(section, time_slot)` | `section.time_slot_id` |
| section의 `{building, room_number}` | `sec_class(section, classroom)` | `section.building`, `section.room_number` |
| section의 `course_id` | `sec_course(section, course)` | weak entity 설계에서는 section 자체 attribute에서 제거 |

정리하면 E-R design에서는 “foreign key처럼 보이는 attribute”를 곧바로 entity attribute로 두기보다, 그 attribute가 다른 entity와의 relationship을 암시하는지 먼저 확인해야 한다. Relationship을 explicit하게 표현하면 cardinality, total participation, identifying dependency 같은 constraint를 E-R diagram에서 함께 표현할 수 있다.

원문의 university E-R design은 redundant attribute를 제거한 뒤 다음 entity set과 relationship set으로 정리된다.

| entity set | 주요 attributes |
|---|---|
| `classroom` | `building`, `room_number`, `capacity` |
| `department` | `dept_name`, `building`, `budget` |
| `course` | `course_id`, `title`, `credits` |
| `instructor` | `ID`, `name`, `salary` |
| `section` | `course_id`, `sec_id`, `semester`, `year` |
| `student` | `ID`, `name`, `tot_cred` |
| `time_slot` | `time_slot_id`, `{(day, start_time, end_time)}` |

Relationship set은 `inst_dept`, `stud_dept`, `teaches`, `takes`, `course_dept`, `sec_course`, `sec_class`, `sec_time_slot`, `advisor`, `prereq`로 구성된다. 이 중 `takes`에는 `grade` descriptive attribute가 붙고, `section`은 `course`에 의존하는 weak entity set이다.

Figure 6.15는 이 university enterprise의 E-R diagram 전체를 보여 준다. 이 그림은 단순히 entity와 relationship 목록이 아니라, total participation, arrow cardinality, weak entity set, relationship attribute까지 함께 담은 conceptual schema다.

![Figure 6.15](@/assets/images/cs-database-091-figure-6-15-page-293.png)
*Figure 6.15 · PDF p. 293 · university enterprise에 대한 전체 E-R diagram*

Figure 6.15에서 중요한 제약은 다음과 같다.

| 제약 | E-R 표현 | 의미 |
|---|---|---|
| instructor는 정확히 하나의 department에 속함 | `instructor` total participation + `inst_dept -> department` arrow | 모든 instructor는 department가 있고, 최대 하나 |
| course는 정확히 하나의 department에 속함 | `course_dept`의 double line과 arrow | 모든 course는 하나의 department 소속 |
| student는 정확히 하나의 major department에 속함 | `stud_dept`의 double line과 arrow | 모든 student는 하나의 department에 major |
| student는 최대 하나의 advisor를 가짐 | `advisor` cardinality | advisor relation key 선택에 영향 |
| section은 weak entity set | double rectangle + `sec_course` identifying relationship | `course_id`와 discriminator로 식별 |

### 6.7 Reducing E-R Diagrams to Relational Schemas

E-R model과 relational model은 둘 다 real-world enterprise의 logical representation이다. 그래서 E-R design은 relation schema들의 집합으로 변환할 수 있다. 기본 원칙은 “각 entity set과 relationship set마다 relation schema를 만든다”이다. 다만 weak entity identifying relationship, many-to-one total participation relationship 등은 redundant schema가 생기므로 제거하거나 결합할 수 있다.

#### 6.7.1 Representation of Strong Entity Sets

Strong entity set `E`가 simple descriptive attribute `a1, a2, ..., an`만 가진다면, 같은 이름의 relation schema `E(a1, a2, ..., an)`을 만든다. 각 tuple은 entity set의 한 entity에 대응한다. Entity set의 primary key는 resulting relation schema의 primary key가 된다.

예를 들어 Figure 6.15의 `student` entity set은 `ID`, `name`, `tot_cred`를 가지므로 다음 relation schema로 변환된다.

```text
student(ID, name, tot_cred)
```

Figure 6.16은 Figure 6.15의 strong entity set에서 유도한 relation schema들을 보여 준다. 여기서 `instructor`, `student`, `course`에는 이전 장 relational schema와 달리 `dept_name`이 없다. 이는 E-R design 단계에서 department 관계를 attribute가 아니라 relationship으로 뺐기 때문이다.

![Figure 6.16](@/assets/images/cs-database-092-figure-6-16-page-294.png)
*Figure 6.16 · PDF p. 294 · E-R entity set에서 유도된 기본 relation schemas*

#### 6.7.2 Representation of Strong Entity Sets with Complex Attributes

Complex attribute가 있으면 변환 규칙이 달라진다.

| E-R attribute | relational schema 변환 |
|---|---|
| `composite attribute` | 가장 아래 component attribute들로 펼침 |
| `multivalued attribute` | 별도 relation schema 생성 |
| `derived attribute` | relational schema에 명시적으로 저장하지 않음 |

Composite attribute는 component attribute로 flatten한다. 예를 들어 `instructor`의 `name(first_name, middle_initial, last_name)`과 `address(street(...), city, state, postal_code)`는 다음처럼 component attribute들로 펼쳐진다.

```text
instructor(
  ID,
  first_name, middle_initial, last_name,
  street_number, street_name, apt_number,
  city, state, postal_code,
  date_of_birth
)
```

Multivalued attribute `M`에 대해서는 owner entity set의 primary key와 multivalued attribute 값을 포함하는 별도 relation schema를 만든다. 예를 들어 instructor가 여러 phone number를 가질 수 있으면 다음 relation을 만든다.

```text
instructor_phone(ID, phone_number)
```

이 relation에서 각 phone number는 별도 tuple이다. Instructor `22222`가 `555-1234`, `555-4321`을 가지면 두 tuple `(22222, 555-1234)`, `(22222, 555-4321)`이 들어간다. 보통 이 relation의 primary key는 모든 attribute의 조합이고, `ID`는 `instructor` relation을 reference하는 foreign key다.

Entity set이 primary-key attribute 하나와 multivalued attribute 하나만 가진 특수한 경우에는 entity set에서 나온 relation을 drop하고 multivalued attribute relation만 남길 수 있다. 원문의 `time_slot`이 그런 예다.

```text
time_slot(time_slot_id, day, start_time, end_time)
```

단, 이런 optimization은 foreign key 표현에 영향을 줄 수 있다. Entity set 자체에서 나온 단일 `time_slot_id` relation을 drop하면, `sec_time_slot.time_slot_id`가 참조할 “time slot id만 unique하게 보장하는 relation”이 사라질 수 있기 때문이다.

#### 6.7.3 Representation of Weak Entity Sets

Weak entity set `A`가 attribute `a1, ..., am`을 가지고 strong entity set `B`에 의존하며, `B`의 primary key가 `b1, ..., bn`이면 relation schema는 다음 attribute를 가진다.

```text
{a1, a2, ..., am} union {b1, b2, ..., bn}
```

Weak entity set에서 유도된 relation schema의 primary key는 owner의 primary key와 weak entity discriminator의 조합이다. 또한 owner relation을 참조하는 foreign-key constraint가 필요하다.

Section 예시는 다음처럼 변환된다.

```text
section(course_id, sec_id, semester, year)
```

여기서 primary key는 `{course_id, sec_id, semester, year}`이고, `course_id`는 `course(course_id)`를 reference하는 foreign key다. Course를 삭제할 때 관련 section을 자동 삭제하려면 foreign key에 `on delete cascade`를 둘 수도 있지만, 이는 E-R diagram 자체보다 relational constraint 설계의 선택이다.

#### 6.7.4 Representation of Relationship Sets

Relationship set `R`은 참여 entity set들의 primary key attribute와 relationship의 descriptive attribute를 합쳐 relation schema로 만든다.

```text
R(
  primary keys of participating entity sets,
  descriptive attributes of R
)
```

예를 들어 `advisor`는 `instructor(ID)`와 `student(ID)`를 연결하지만 attribute 이름이 둘 다 `ID`라서 role이 드러나도록 `i_ID`, `s_ID`처럼 rename한다. Student가 최대 한 advisor를 갖는 many-to-one relationship이면 primary key는 `s_ID`다.

Figure 6.17은 Figure 6.15의 relationship set에서 유도된 relation schema들을 보여 준다. `prereq(course_id, prereq_id)`처럼 같은 entity set이 서로 다른 role로 참여하는 경우 role indicator가 attribute 이름으로 사용된다.

![Figure 6.17](@/assets/images/cs-database-093-figure-6-17-page-298.png)
*Figure 6.17 · PDF p. 298 · E-R relationship set에서 유도된 relation schemas*

Relationship set에서 유도된 relation에는 참여 entity set relation을 참조하는 foreign key가 생긴다. 예를 들어 `takes`는 `student`와 `section`을 reference하고, `teaches`는 `instructor`와 `section`을 reference한다. Figure 6.17에는 foreign key가 표시되지 않지만, 실제 relational design에서는 이런 referential constraint가 함께 따라와야 한다.

#### 6.7.5 Redundancy of Schemas

Weak entity set과 identifying strong entity set을 연결하는 identifying relationship schema는 redundant하다. 예를 들어 `section`의 primary key가 이미 `{course_id, sec_id, semester, year}`이고, `sec_course` relationship schema도 같은 attribute 조합을 가진다면 `sec_course` relation은 `section` relation에 이미 들어 있는 정보를 반복한다.

따라서 weak entity set과 owner를 연결하는 identifying relationship set에서 나온 schema는 relational database design에 둘 필요가 없다.

#### 6.7.6 Combination of Schemas

Many-to-one relationship set `AB`가 entity set `A`에서 `B`로 향하고, `A`의 participation이 total이면 `A` schema와 `AB` schema를 합칠 수 있다. Relationship set schema를 별도로 두지 않고, `B`의 key를 `A` relation의 foreign key attribute로 넣는 방식이다.

| relationship | 결합 결과 |
|---|---|
| `inst_dept` | `instructor(ID, name, dept_name, salary)` |
| `stud_dept` | `student(ID, name, dept_name, tot_cred)` |
| `course_dept` | `course(course_id, title, dept_name, credits)` |
| `sec_class` | `section(course_id, sec_id, semester, year, building, room_number)` |
| `sec_time_slot` | `section(course_id, sec_id, semester, year, building, room_number, time_slot_id)` |

이 결합 규칙이 앞에서 제거했던 `dept_name`, `building`, `room_number`, `time_slot_id` 같은 attribute를 relational schema에 다시 등장시킨다. 차이는 conceptual design에서는 relationship으로 명시했고, relational implementation에서는 many-to-one total participation을 이용해 foreign key로 병합했다는 점이다.

One-to-one relationship은 어느 한쪽 entity set schema와도 결합할 수 있다. Participation이 partial이어도 null을 사용하면 결합할 수 있지만, null이 많아지고 constraint 의미가 흐려질 수 있다.

Relationship schema를 merge할 때는 foreign-key constraint도 조정해야 한다. Merge 대상 entity set을 reference하던 foreign key는 implicit하게 사라지고, 나머지 participating entity set을 reference하는 foreign key는 combined schema에 추가된다.

### 6.8 Extended E-R Features

기본 E-R concept만으로도 많은 database feature를 모델링할 수 있지만, 일부 구조는 확장 기능을 쓰면 더 자연스럽다. 이 절은 `specialization`, `generalization`, `higher-level entity set`, `lower-level entity set`, `attribute inheritance`, `aggregation`을 다룬다.

원문은 사람을 `person(ID, name, street, city)` entity set으로 두고, 이 person이 student, employee, instructor, secretary 등으로 세분화되는 university 예시를 사용한다.

#### 6.8.1 Specialization

`specialization`은 하나의 entity set 안에서 서로 구별되는 subgroup을 만드는 top-down design process다. 어떤 subgroup은 전체 entity set이 공유하지 않는 attribute를 가지거나, 특정 relationship에만 참여할 수 있다.

예를 들어 `person` entity set을 `employee`와 `student`로 specialize할 수 있다. Employee는 `salary` attribute를 더 가질 수 있고, student는 `tot_cred` attribute를 더 가질 수 있다. 어떤 person은 employee일 수도, student일 수도, 둘 다일 수도, 둘 다 아닐 수도 있다.

Specialization은 반복 적용될 수 있다. Student는 다시 `graduate`와 `undergraduate`로 나뉠 수 있고, employee는 `instructor`와 `secretary`로 나뉠 수 있다. Graduate student는 `office_number`, undergraduate student는 `residential_college`, instructor는 `rank`, secretary는 `hours_per_week` 같은 고유 attribute를 가질 수 있다.

E-R diagram에서 specialization은 hollow arrowhead가 상위 entity set을 향하는 `ISA relationship`으로 표시된다. ISA는 “is a”를 뜻한다. 예를 들어 instructor is an employee다.

Specialization에는 두 가지 중요한 분류가 있다.

| specialization constraint | 의미 | E-R diagram 표현 |
|---|---|---|
| `overlapping specialization` | 한 entity가 여러 lower-level entity set에 속할 수 있음 | 별도 hollow arrow 여러 개 |
| `disjoint specialization` | 한 entity가 최대 하나의 lower-level entity set에만 속함 | 하나의 hollow arrow로 묶음 |

`person -> student/employee`는 overlapping일 수 있다. 한 사람이 student이면서 employee일 수 있기 때문이다. 반면 `employee -> instructor/secretary`는 대학이 한 employee를 둘 중 하나로만 분류한다면 disjoint specialization이 된다.

Figure 6.18은 `person`, `employee`, `student`, `instructor`, `secretary` 사이의 specialization/generalization hierarchy를 보여 준다. 이 그림의 hollow arrow는 lower-level entity set이 higher-level entity set의 특수한 경우임을 나타낸다.

![Figure 6.18](@/assets/images/cs-database-094-figure-6-18-page-302.png)
*Figure 6.18 · PDF p. 302 · `person`에서 `employee`, `student`, `instructor`, `secretary`로 이어지는 ISA hierarchy*

#### 6.8.2 Generalization

`generalization`은 여러 lower-level entity set의 공통점을 찾아 higher-level entity set으로 합치는 bottom-up design process다. 예를 들어 처음에 `instructor(instructor_id, instructor_name, instructor_salary, rank)`와 `secretary(secretary_id, secretary_name, secretary_salary, hours_per_week)`를 따로 발견했다면, identifier, name, salary라는 공통 attribute를 `employee` higher-level entity set으로 끌어올릴 수 있다.

Specialization과 generalization은 E-R diagram 결과만 보면 거의 같은 구조다. 차이는 출발점이다.

| 접근 | 출발점 | 강조점 |
|---|---|---|
| `specialization` | 하나의 entity set | subgroup의 차이와 고유 feature |
| `generalization` | 여러 entity set | 공통 attribute/relationship의 공유 |

Generalization은 shared attribute를 반복하지 않게 해 representation을 경제적으로 만든다. Lower-level entity set들이 같은 attribute와 relationship에 참여한다면, 이를 higher-level entity set으로 올리는 것이 설계를 더 명확하게 한다.

#### 6.8.3 Attribute Inheritance

Specialization/generalization hierarchy의 핵심 성질은 `attribute inheritance`다. Lower-level entity set은 higher-level entity set의 attribute를 상속한다. 예를 들어 `student`와 `employee`는 `person`의 `ID`, `name`, `street`, `city`를 상속한다. Student는 여기에 `tot_cred`를 더 갖고, employee는 `salary`를 더 갖는다.

Inheritance는 여러 tier를 따라 내려간다. `instructor`와 `secretary`는 `employee`의 subclass이므로 `employee.salary`를 상속하고, 동시에 `person`의 `ID`, `name`, `street`, `city`도 상속한다.

Relationship participation도 상속된다. 만약 `person`이 `person_dept` relationship으로 `department`에 참여한다면, `student`, `employee`, `instructor`, `secretary`도 implicit하게 그 relationship에 참여할 수 있다. 이는 attribute inheritance와 같은 방식으로 lower-level entity set에 적용된다.

Hierarchy와 lattice도 구분해야 한다.

| 구조 | 의미 |
|---|---|
| `hierarchy` | entity set이 lower-level entity set으로 참여하는 ISA relationship이 하나뿐인 single inheritance 구조 |
| `lattice` | entity set이 둘 이상의 ISA relationship에서 lower-level entity set으로 참여하는 multiple inheritance 구조 |

#### 6.8.4 Constraints on Specializations

Specialization/generalization에는 disjoint/overlapping 외에도 `completeness constraint`가 있다. Completeness constraint는 higher-level entity가 적어도 하나의 lower-level entity set에 반드시 속해야 하는지를 나타낸다.

| completeness constraint | 의미 |
|---|---|
| `total specialization/generalization` | higher-level entity는 반드시 하나 이상의 lower-level entity set에 속함 |
| `partial specialization/generalization` | higher-level entity 중 어떤 것은 어떤 lower-level entity set에도 속하지 않을 수 있음 |

Partial specialization이 default다. `person`을 `student` 또는 `employee`로 specialize할 때, 대학이 student도 employee도 아닌 person을 저장할 필요가 없다면 total이다. 반대로 방문자, 졸업생, 외부 관계자처럼 student/employee가 아닌 person도 저장해야 한다면 partial이다.

Disjointness와 completeness는 독립적이다. 따라서 specialization은 `partial-overlapping`, `partial-disjoint`, `total-overlapping`, `total-disjoint` 네 조합을 모두 가질 수 있다.

이 constraint는 insertion/deletion requirement로도 이어진다. Total completeness가 있으면 higher-level entity를 insert할 때 lower-level entity set 중 적어도 하나에도 insert해야 한다. Higher-level entity를 delete하면 연결된 lower-level entity들도 함께 delete해야 한다.

#### 6.8.5 Aggregation

기본 E-R model의 한계 중 하나는 relationship 사이의 relationship을 직접 표현하지 못한다는 점이다. `aggregation`은 relationship set을 higher-level entity처럼 취급해 이 문제를 해결하는 abstraction이다.

예를 들어 `proj_guide(instructor, student, project)` relationship은 “어떤 instructor가 어떤 project에서 어떤 student를 guide하는가”를 나타낸다. 이제 각 guide 조합에 대해 monthly evaluation report를 제출해야 한다고 하자. `evaluation`을 entity로 모델링하면, evaluation이 특정 `(student, project, instructor)` 조합에 대한 것임을 표현해야 한다.

기본 E-R construct만 사용하면 Figure 6.19처럼 `proj_guide`와 별개로 `eval_for(instructor, student, project, evaluation)` quaternary relationship을 만들 수 있다. 하지만 이 구조는 redundant하다. `eval_for`에 들어간 instructor/student/project 조합은 반드시 `proj_guide`에도 있어야 하므로 같은 조합을 두 relationship에서 반복하게 된다.

![Figure 6.19](@/assets/images/cs-database-095-figure-6-19-page-305.png)
*Figure 6.19 · PDF p. 305 · aggregation 없이 evaluation을 모델링할 때 생기는 redundant relationship*

Aggregation을 사용하면 `proj_guide` relationship set 자체를 higher-level entity set처럼 보고, `evaluation`과 binary relationship `eval_for`로 연결할 수 있다. 즉 evaluation은 instructor, student, project 각각에 따로 연결되는 것이 아니라, 이미 의미 있는 relationship instance인 proj_guide에 연결된다.

Figure 6.20은 aggregation으로 같은 상황을 더 정확하게 표현한 E-R diagram이다. 사각형으로 둘러싼 `proj_guide` aggregation이 entity처럼 `eval_for` relationship에 참여한다.

![Figure 6.20](@/assets/images/cs-database-096-figure-6-20-page-306.png)
*Figure 6.20 · PDF p. 306 · relationship set을 higher-level entity처럼 다루는 aggregation*

Evaluation을 `proj_guide`의 multivalued composite attribute로 둘 수도 있지만, evaluation report가 secretary나 scholarship payment 같은 다른 entity와도 관련된다면 attribute가 아니라 entity로 두는 편이 맞다. Aggregation은 바로 이런 “relationship instance 자체가 다시 다른 object와 관계를 맺는” 상황을 모델링한다.

#### 6.8.6 Reduction to Relation Schemas

Extended E-R feature도 relational schema로 변환할 수 있다.

Generalization을 relational schema로 표현하는 대표 방법은 두 가지다.

| 방법 | 생성 schema | 장점 | 주의점 |
|---|---|---|---|
| method 1 | higher-level schema와 lower-level schema를 모두 생성 | foreign key가 명확하고 overlapping/partial에도 안전 | join이 필요할 수 있음 |
| method 2 | disjoint and complete일 때 lower-level schema만 생성 | table 수를 줄이고 join을 줄일 수 있음 | overlapping이면 중복 저장, partial이면 누락, foreign key 참조가 어려움 |

Method 1은 다음처럼 상위 relation과 하위 relation을 모두 만든다.

```text
person(ID, name, street, city)
employee(ID, salary)
student(ID, tot_cred)
```

`employee.ID`와 `student.ID`는 각각 `person.ID`를 reference하는 foreign key다. 이 방식은 한 person이 student이면서 employee인 overlapping case도 자연스럽게 표현한다.

Method 2는 generalization이 `disjoint`이고 `complete`일 때만 상위 relation을 만들지 않고 하위 relation에 상위 attribute를 모두 포함한다.

```text
employee(ID, name, street, city, salary)
student(ID, name, street, city, tot_cred)
```

하지만 이 방식은 relationship이 `person`을 reference해야 할 때 참조할 단일 relation이 없다는 문제가 있다. Overlapping이면 같은 person의 `name`, `street`, `city`가 employee와 student relation에 중복 저장될 수 있고, partial이면 student도 employee도 아닌 person을 표현할 relation이 필요하다. 이런 문제를 피하려다 보면 결국 method 1로 돌아가게 된다.

Aggregation을 relation schema로 변환할 때는 aggregation을 일반 entity set처럼 다룬다. Aggregation의 primary key는 defining relationship set의 primary key다. 별도 relation으로 aggregation 자체를 새로 만들 필요는 없고, defining relationship에서 만들어진 relation을 사용한다. Aggregation과 다른 entity set 사이의 relationship relation에는 aggregation의 key와 상대 entity set의 key, 그리고 relationship descriptive attribute가 들어간다.

### 6.9 Entity-Relationship Design Issues

`entity set`과 `relationship set`의 경계는 수학적으로 완전히 고정되어 있지 않다. 같은 현실을 여러 방식으로 모델링할 수 있고, 어떤 방식이 좋은지는 enterprise semantics와 나중에 표현해야 할 fact에 따라 달라진다.

#### 6.9.1 Common Mistakes in E-R Diagrams

E-R design에서 흔한 첫 번째 실수는 다른 entity set의 primary key를 attribute로 들고 와 relationship을 implicit하게 만드는 것이다. 예를 들어 `student` entity set에 `dept_name`을 attribute로 넣는 것은 잘못된 E-R design이다. Relational schema에서는 `student.dept_name`이 있을 수 있지만, conceptual E-R design에서는 `student`와 `department` 사이의 `stud_dept` relationship으로 표현해야 한다.

두 번째 실수는 relationship set의 attribute로 참여 entity set의 primary key를 다시 적는 것이다. 예를 들어 `advisor` relationship에 `student.ID`와 `instructor.ID`를 attribute로 붙이면 안 된다. Participating entity의 primary key는 relationship set에 이미 implicit하게 들어 있다. 나중에 relational schema로 변환하면 key attribute가 나타나지만, E-R diagram의 relationship attribute로 반복하지 않는다.

세 번째 실수는 실제로 여러 값을 가져야 하는 상황을 single-valued relationship attribute로 모델링하는 것이다. 예를 들어 학생이 section에서 여러 assignment mark를 받는다면 `takes` relationship에 `assignment`, `marks`라는 single-valued attributes를 붙이는 것은 틀릴 수 있다. Relationship instance는 participating entities로 unique하게 식별되므로, 같은 student-section pair에 assignment mark를 여러 개 저장할 수 없기 때문이다.

Figure 6.21은 이런 오류들을 보여 준다. (a)는 `student.dept_name`으로 department relationship을 implicit하게 만든 오류이고, (b)는 assignment marks를 relationship의 single-valued attributes로 넣은 오류다.

![Figure 6.21](@/assets/images/cs-database-097-figure-6-21-page-309.png)
*Figure 6.21 · PDF p. 309 · primary key attribute 중복과 single-valued relationship attribute 사용 오류*

Figure 6.22는 Figure 6.21(b)의 올바른 대안을 보여 준다. 하나는 `assignment`를 `section`에 의존하는 weak entity로 만들고 `marks_in` relationship에 `marks`를 붙이는 방식이다. 다른 하나는 `takes`에 multivalued composite attribute `{assignment_marks(assignment, marks)}`를 붙이는 방식이다. Assignment의 deadline, maximum marks 같은 추가 정보를 저장해야 한다면 weak entity 방식이 더 적합하다.

![Figure 6.22](@/assets/images/cs-database-098-figure-6-22-page-310.png)
*Figure 6.22 · PDF p. 310 · assignment marks를 표현하는 올바른 E-R 대안*

큰 E-R diagram은 여러 조각으로 나눌 수 있다. 이때 entity set이 여러 페이지에 반복될 수 있지만, attribute 목록은 첫 등장에만 표시하는 것이 좋다. 같은 entity set의 attribute가 여러 곳에 반복되면 서로 다른 version이 생겨 inconsistency가 발생할 수 있다.

#### 6.9.2 Use of Entity Sets versus Attributes

어떤 개념을 attribute로 둘지 entity set으로 둘지는 semantics에 따라 결정된다. `instructor.phone_number`를 단순 attribute로 두면 instructor마다 정확히 하나의 phone number가 있다고 가정하게 된다. Multivalued attribute로 두면 여러 phone number를 표현할 수는 있지만, phone 자체에 대한 추가 정보를 다루기는 어렵다.

Figure 6.23은 phone을 instructor의 attribute로 두는 방식과, `phone(phone_number, location)` entity set으로 분리하고 `inst_phone` relationship으로 연결하는 방식을 비교한다.

![Figure 6.23](@/assets/images/cs-database-099-figure-6-23-page-311.png)
*Figure 6.23 · PDF p. 311 · phone을 attribute로 둘지 entity set으로 둘지의 설계 대안*

Phone을 entity로 만들면 phone의 `location`, type, shared users 같은 추가 정보를 모델링할 수 있다. 반면 instructor의 `name`을 entity로 만드는 것은 보통 부적절하다. Name은 독립적인 object라기보다 instructor의 property이기 때문이다.

판단 기준은 다음처럼 정리할 수 있다.

| attribute로 두기 적합 | entity set으로 두기 적합 |
|---|---|
| 독립된 identity가 약함 | 독립적으로 식별하고 추적할 필요가 있음 |
| 추가 attribute가 거의 없음 | location, type, ownership 등 추가 정보가 있음 |
| 다른 entity와 별도 relationship을 맺지 않음 | 여러 entity가 공유하거나 다른 relationship에 참여함 |
| 값 자체가 property에 가까움 | 현실 세계의 object로 보는 편이 자연스러움 |

#### 6.9.3 Use of Entity Sets versus Relationship Sets

어떤 사실을 entity set으로 볼지 relationship set으로 볼지도 항상 명확하지 않다. `takes(student, section)`는 학생이 section을 수강한다는 action을 간결하게 relationship으로 표현한다. 하지만 registrar office가 각 course-registration record 자체에 여러 추가 정보를 관리한다면 `registration`을 entity set으로 만드는 편이 나을 수 있다.

Figure 6.24는 `takes` relationship을 `registration` entity set과 `section_reg`, `student_reg` 두 relationship으로 대체하는 대안을 보여 준다.

![Figure 6.24](@/assets/images/cs-database-100-figure-6-24-page-312.png)
*Figure 6.24 · PDF p. 312 · `takes` relationship을 `registration` entity set으로 대체한 모델*

두 모델 모두 university information을 표현할 수 있다. 하지만 추가 정보가 별로 없다면 `takes` relationship이 더 compact하고 자연스럽다. 반대로 registration 자체가 identifier, status, payment, audit trail, approval workflow 같은 독립 정보를 갖는다면 entity set으로 승격하는 것이 좋다.

하나의 guideline은 relationship set을 entity들 사이에서 발생하는 action이나 association을 표현하는 데 쓰는 것이다. 그러나 action 자체가 lifecycle과 추가 attribute를 갖는다면 entity set이 될 수 있다.

#### 6.9.4 Binary versus n-ary Relationship Sets

Database relationship은 binary가 많지만, 모든 nonbinary relationship을 binary로 쪼개는 것이 좋은 것은 아니다. 어떤 ternary relationship은 여러 binary relationship으로 바꿔도 의미가 보존되지만, 어떤 경우는 중요한 association이 사라진다.

부모 관계 예시에서는 child, mother, father를 한 ternary relationship으로 두는 것보다 `mother(child, mother)`와 `father(child, father)` 두 binary relationship으로 나누는 것이 더 나을 수 있다. Father를 모르는 경우에도 mother 정보는 저장할 수 있기 때문이다. Ternary relationship을 쓰면 unknown father 때문에 null이 필요할 수 있다.

형식적으로 n-ary relationship은 항상 entity set 하나와 여러 binary relationship으로 변환할 수 있다. Ternary relationship `R(A, B, C)`를 entity set `E`로 바꾸고, `E`에서 `A`, `B`, `C`로 향하는 many-to-one relationship `RA`, `RB`, `RC`를 만든다. `R`의 descriptive attribute는 `E`의 attribute가 된다.

Figure 6.25는 ternary relationship을 새 entity set과 세 binary relationship으로 바꾸는 일반 변환을 보여 준다.

![Figure 6.25](@/assets/images/cs-database-101-figure-6-25-page-313.png)
*Figure 6.25 · PDF p. 313 · ternary relationship과 세 binary relationship 표현의 비교*

하지만 이 변환은 항상 바람직하지 않다.

| 문제 | 설명 |
|---|---|
| artificial identifier | relationship을 표현하기 위한 entity set `E`에 별도 identifying attribute가 필요할 수 있음 |
| design/storage complexity | relationship set과 schema 수가 늘어남 |
| semantics loss | 여러 entity가 하나의 relationship instance에 함께 참여한다는 의미가 흐려짐 |
| constraint loss | `A, B -> C` 같은 ternary constraint를 binary cardinality로 표현하지 못할 수 있음 |

`proj_guide(instructor, student, project)`를 단순히 instructor-project, instructor-student binary relationship으로 나누면 “Katz가 project A에서 Shankar를 지도하고 project B에서 Zhang을 지도한다”는 specific pairing을 잃는다. Katz가 project A, B에 참여하고 Shankar, Zhang을 지도한다는 사실만 남아 cross-combination을 구분할 수 없기 때문이다.

### 6.10 Alternative Notations for Modeling Data

Database schema design에서는 domain expert와 data modeling expert가 소통해야 하므로 diagram notation이 중요하다. E-R diagram과 `UML class diagram`이 널리 쓰이지만, E-R notation에는 universal standard가 없다. 책, tool, organization마다 symbol이 다를 수 있다.

#### 6.10.1 Alternative E-R Notations

대표적인 E-R notation 차이는 attribute 표시, relationship 표시, cardinality 표시, generalization 표시에서 나타난다.

| 개념 | 이 책의 notation | 흔한 alternative |
|---|---|---|
| attribute | entity rectangle 안에 나열 | oval로 entity에 연결, primary key underline |
| binary relationship | diamond | entity 사이 line만 사용 |
| many side | undirected line/arrow 조합 또는 `l..h` | crow's-foot notation |
| total participation | double line 또는 `l..h`의 minimum 1 | vertical bar |
| partial participation | single line 또는 minimum 0 | circle |
| generalization | hollow arrowhead | triangle |

Figure 6.27은 Chen-style oval attribute notation, crow's-foot notation, triangle generalization 등 여러 alternative E-R notation을 비교한다. 중요한 점은 symbol 자체가 아니라, 해당 notation에서 cardinality와 participation을 어느 쪽 edge에 표시하는지 정확히 읽는 것이다.

![Figure 6.27](@/assets/images/cs-database-104-figure-6-27-page-316.png)
*Figure 6.27 · PDF p. 316 · attribute, cardinality, participation, generalization에 대한 alternative E-R notations*

Crow's-foot notation에서는 relationship set을 diamond 없이 entity 사이 line으로 표현하는 경우가 많다. 이 방식은 binary relationship에는 간결하지만 nonbinary relationship을 표현하기 어렵다. 또한 total/partial participation 표시가 E-R diagram에서 읽던 위치와 반대로 느껴질 수 있으므로 tool별 의미를 확인해야 한다.

E-R diagram의 entity view와 relational view도 구분해야 한다. Conceptual E-R diagram에서는 `instructor` entity set에 `dept_name`을 보이지 않지만, relational schema view에서는 `instructor` relation에 `dept_name` foreign key가 나타날 수 있다. Modeling tool이 두 view를 모두 제공할 수 있으며, 둘을 혼동하면 “왜 그림에는 없던 column이 table에는 있나” 같은 혼란이 생긴다.

#### 6.10.2 The Unified Modeling Language UML

`UML(Unified Modeling Language)`은 software system의 여러 component를 명세하기 위한 표준이다. UML의 일부인 `class diagram`은 E-R diagram과 비슷하게 data representation을 모델링할 수 있다. UML에는 class diagram 외에도 use case diagram, activity diagram, implementation diagram 등이 있다.

E-R과 UML class diagram은 비슷하지만 관점이 다르다.

| 항목 | E-R diagram | UML class diagram |
|---|---|---|
| 기본 대상 | entity | object/class |
| attribute | entity property | class attribute |
| method | 없음 | class method를 표현 가능 |
| relationship set | relationship | association |
| access modifier | 없음 | `+` public, `-` private, `#` protected |
| composite/multivalued attribute | E-R에서 표현 가능 | UML class diagram에서는 직접 지원하지 않음 |
| derived attribute | derived attribute 표기 | parameter 없는 method에 대응 가능 |

Figure 6.28은 E-R notation과 equivalent UML class diagram notation을 나란히 보여 준다. 특히 UML에서 cardinality constraint의 위치가 E-R diagram과 반대라는 점이 중요하다.

![Figure 6.28](@/assets/images/cs-database-105-figure-6-28-page-319.png)
*Figure 6.28 · PDF p. 319 · E-R diagram notation과 UML class diagram notation의 대응*

UML에서 relationship set은 보통 entity set 사이의 line으로 표현하고, relationship 이름을 line 근처에 쓴다. Relationship attribute가 있으면 relationship name과 attribute를 담은 box를 dotted line으로 association line에 연결할 수 있고, 이 box는 E-R aggregation처럼 다른 relationship에도 참여할 수 있다.

UML은 version 1.3 이후 nonbinary relationship에 E-R과 같은 diamond notation을 지원한다. Binary relationship에도 diamond를 쓸 수 있지만, 일반적으로는 line notation을 많이 사용한다.

UML cardinality도 `l..h` 형식을 쓰지만 위치를 조심해야 한다. Figure 6.28에서 UML의 `0..*`가 `E2` 쪽에 쓰이고 `0..1`이 `E1` 쪽에 쓰이면, 각 `E2` entity는 최대 하나의 relationship에 참여하고 각 `E1` entity는 여러 relationship에 참여할 수 있음을 뜻한다. 이는 E-R notation의 constraint 위치와 반대로 읽힌다.

UML의 `composition`은 작은 shaded diamond로 표현되며, 한 class가 다른 class에 existence dependent임을 나타낸다. 이는 E-R의 weak entity set과 대략 대응한다. UML에서 hollow diamond로 표시하는 aggregation은 containment는 있지만 독립 존재가 가능한 variant다.

### 6.11 Other Aspects of Database Design

이 장은 schema design을 중심으로 설명하지만, database design은 schema만 정한다고 끝나지 않는다. 실제 enterprise application에서는 functionality, authorization, data flow, workflow, schema evolution까지 함께 고려해야 한다.

#### 6.11.1 Functional Requirements

Enterprise application은 data를 저장하는 것뿐 아니라 query, update, delete, report, registration, payment 같은 functionality를 지원해야 한다. Conceptual schema가 data requirement를 만족하는지뿐 아니라, 사용자가 수행할 transaction과 interface가 자연스럽게 지원되는지도 검토해야 한다.

Authorization도 design의 일부다. 어떤 user가 어떤 data를 볼 수 있고 어떤 transaction을 수행할 수 있는지는 DBMS authorization feature로 제어할 수도 있고, application-level function/interface 권한으로 제어할 수도 있다. Schema는 이런 authorization policy를 지나치게 어렵게 만들지 않아야 한다.

#### 6.11.2 Data Flow, Workflow

Database application은 더 큰 enterprise process의 일부인 경우가 많다. `workflow`는 data와 task가 결합된 business process를 뜻한다. 예를 들어 travel-expense report는 employee가 작성하고, manager approval을 거쳐 accounting system으로 넘어가는 흐름을 가진다.

Workflow는 database와 계속 상호작용한다. 사용자가 task를 수행하는 동안 query와 update가 발생하고, database는 workflow 자체의 상태, task 목록, routing rule도 저장할 수 있다. 따라서 database design은 data semantics뿐 아니라 그 data가 어떤 business process에서 어떻게 움직이는지도 고려해야 한다.

#### 6.11.3 Schema Evolution

Database design은 one-time activity가 아니다. Organization의 요구가 변하면 저장해야 할 data와 constraint도 변한다. Schema 변경은 conceptual, logical, physical level 모두에서 발생할 수 있고, application query/update/security/interface에 광범위한 영향을 준다.

좋은 design은 “영구적인 fundamental constraint”와 “정책 변화 가능성이 있는 constraint”를 구분한다. 예를 들어 instructor ID가 instructor를 unique하게 식별한다는 것은 fundamental에 가깝다. 반면 instructor가 하나의 department에만 속한다는 policy는 joint appointment가 허용되면 바뀔 수 있다.

따라서 현재 정책만 보고 schema를 너무 좁게 고정하면 나중에 큰 migration이 필요할 수 있다. 변화 가능성이 합리적으로 예상된다면 relationship을 명시적으로 두거나 extension point를 남겨 schema evolution 비용을 줄이는 것이 좋다.

### 6.12 Summary

Chapter 6의 핵심은 database design을 table 작성이 아니라 enterprise modeling으로 보는 것이다. `E-R data model`은 entity, relationship, attribute, key, cardinality, participation, weak entity, specialization/generalization, aggregation을 사용해 conceptual schema를 표현한다.

이 장의 주요 용어를 설계 질문 중심으로 다시 정리하면 다음과 같다.

| 질문 | 관련 용어 |
|---|---|
| 무엇을 저장할 것인가? | `entity`, `entity set`, `attribute`, `domain` |
| object 사이에 어떤 사실이 있는가? | `relationship`, `relationship set`, `role`, `degree`, `descriptive attribute` |
| 어떻게 구분할 것인가? | `superkey`, `candidate key`, `primary key`, `discriminator attribute` |
| 몇 개와 연결될 수 있는가? | `mapping cardinality`, `one-to-one`, `one-to-many`, `many-to-one`, `many-to-many` |
| 반드시 참여해야 하는가? | `total participation`, `partial participation`, `l..h` cardinality limit |
| 자체 key가 부족한가? | `weak entity set`, `strong entity set`, `identifying relationship`, `existence dependent` |
| 더 일반/특수한 type 관계가 있는가? | `specialization`, `generalization`, `ISA relationship`, `attribute inheritance` |
| relationship 자체가 다른 relationship에 참여하는가? | `aggregation` |
| relational schema로 어떻게 내릴 것인가? | entity/relationship schema generation, foreign key, schema redundancy, schema combination |

좋은 E-R design은 simple and compact model과 precise but complex model 사이에서 균형을 잡는다. Phone을 attribute로 둘지 entity로 둘지, `takes`를 relationship으로 둘지 `registration` entity로 승격할지, ternary relationship을 유지할지 binary relationship으로 분해할지는 모두 enterprise semantics에 따라 달라진다.

Practice exercise 범위는 이 장의 핵심이 어디에 있는지 잘 보여 준다. Car insurance, marks/exams, sports statistics, hospital, online bookstore, vehicle sales, package delivery, airline 같은 문제는 모두 “entity/relationship/attribute 선택, weak entity, ternary relationship, generalization-specialization, relational schema 변환, constraint 목록 작성”을 반복 훈련하게 한다. Figure 6.29와 Figure 6.30은 이 연습문제 설명용 figure라 최종 정리본에는 포함하지 않았다.

## 연결 관계

Chapter 6는 Chapter 2의 relational model과 Chapter 3-5의 SQL 사용을 거꾸로 거슬러 올라간다. 이전 장들이 이미 만들어진 relation schema를 어떻게 query/update하는지 다뤘다면, 이 장은 그 relation schema가 어디서 나와야 하는지 설명한다.

Chapter 4의 `foreign key`, `referential integrity`, `not null`, `primary key` constraint는 Chapter 6의 E-R cardinality, participation, weak entity, relationship 변환 결과로 나타난다. 예를 들어 total participation은 SQL에서 `not null`, `foreign key`, 때로는 assertion/check constraint로 표현되어야 한다.

Chapter 7은 Chapter 6의 결과물을 검증한다. E-R design을 relational schema로 변환한 뒤에도 redundancy와 anomaly가 남을 수 있으므로, Chapter 7의 `functional dependency`, `normalization`, `decomposition`, `BCNF`, `3NF`가 필요하다. 특히 이 장에서 nonbinary relationship의 ambiguous constraint를 피하기 위해 언급한 `functional dependency`가 Chapter 7의 중심 주제다.

Chapter 8의 object-oriented/complex data model과도 연결된다. E-R의 composite/multivalued/derived attribute, specialization/generalization, UML class diagram은 object modeling과 자연스럽게 이어진다.

Chapter 13-14의 file organization, index structure는 physical-design phase에 해당한다. 이 장의 conceptual/logical design이 “무엇을 어떻게 의미 있게 저장할지”라면, 이후 storage chapter는 “그 schema를 물리적으로 어떻게 빠르게 저장하고 접근할지”를 다룬다.

## 오해하기 쉬운 내용

- E-R diagram의 entity set은 relation schema와 비슷해 보이지만 동일하지 않다. Conceptual E-R에서는 `dept_name`을 `instructor` attribute로 두지 않고 relationship으로 표현해도, relational schema 변환 후에는 `instructor.dept_name` foreign key가 다시 생길 수 있다.
- 다른 entity set의 primary key를 attribute로 복사해 relationship을 암시하면 안 된다. E-R design에서는 relationship을 explicit하게 표현해야 cardinality와 participation constraint를 함께 표현할 수 있다.
- Relationship set의 descriptive attribute와 participating entity의 primary key를 혼동하면 안 된다. Participating entity key는 relationship에 implicit하게 포함된다.
- `multivalued attribute`를 single-valued relationship attribute처럼 붙이면 같은 entity 조합에 여러 값을 저장하지 못한다.
- `weak entity set`은 단순히 key attribute가 부족한 entity set이 아니라, identifying entity에 existence dependent인 entity set이다.
- `0..*`와 `1..1` cardinality limit은 relationship의 “many side 이름”이 아니라 각 entity가 relationship에 참여할 수 있는 횟수로 읽어야 한다.
- 모든 ternary relationship을 binary relationship으로 쪼갤 수는 있지만, 의미와 constraint를 보존하지 못할 수 있다.
- Specialization/generalization에서 `disjoint/overlapping`과 `total/partial`은 독립된 constraint다.
- Aggregation은 단순 grouping 장식이 아니라, relationship set 자체가 다른 relationship에 참여해야 할 때 쓰는 abstraction이다.
- UML cardinality constraint의 위치는 이 책의 E-R notation과 반대로 읽히는 경우가 있으므로 notation별 규칙을 확인해야 한다.

## 면접 질문

1. Database design에서 `conceptual-design`, `logical-design`, `physical-design`의 차이를 설명해 보라.
2. `entity`, `entity set`, `extension of entity set`의 차이는 무엇인가?
3. `relationship set`을 mathematical relation으로 정의하면 어떤 의미가 생기는가?
4. Recursive relationship set에서 `role indicator`가 필요한 이유를 `prereq` 예시로 설명해 보라.
5. `descriptive attribute`가 entity attribute가 아니라 relationship attribute가 되어야 하는 경우를 예로 들어 보라.
6. `composite attribute`, `multivalued attribute`, `derived attribute`를 relational schema로 변환하는 규칙을 설명해 보라.
7. `one-to-many`, `many-to-one`, `many-to-many` cardinality가 relationship set의 primary key 선택에 어떤 영향을 주는가?
8. `total participation`과 `partial participation`은 SQL constraint로 어떻게 표현될 수 있는가?
9. `weak entity set`, `discriminator attribute`, `identifying relationship`의 관계를 `section` 예시로 설명해 보라.
10. E-R design에서 redundant attribute를 제거했다가 relational schema 변환에서 foreign key로 다시 나타나는 이유는 무엇인가?
11. Strong entity set, weak entity set, relationship set을 relation schema로 변환하는 기본 규칙을 설명해 보라.
12. Weak entity set의 identifying relationship schema가 redundant한 이유는 무엇인가?
13. Many-to-one relationship schema를 entity schema와 combine할 수 있는 조건은 무엇인가?
14. `specialization`과 `generalization`의 차이를 top-down/bottom-up 관점에서 설명해 보라.
15. `attribute inheritance`와 relationship participation inheritance는 무엇인가?
16. `disjoint specialization`, `overlapping specialization`, `total specialization`, `partial specialization`의 차이를 설명해 보라.
17. `aggregation`이 필요한 상황을 `proj_guide`와 `evaluation` 예시로 설명해 보라.
18. 어떤 정보를 attribute로 둘지 entity set으로 둘지 판단하는 기준은 무엇인가?
19. `takes` relationship을 `registration` entity set으로 바꾸는 것이 적합한 상황은 언제인가?
20. Ternary relationship을 binary relationships로 분해할 때 잃을 수 있는 의미와 constraint는 무엇인가?
21. E-R diagram과 UML class diagram의 차이, 특히 cardinality notation 차이를 설명해 보라.
22. Schema evolution을 고려한 설계가 필요한 이유를 instructor-department policy 변화 예시로 설명해 보라.
