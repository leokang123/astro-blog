---
title: "Chapter 4. Intermediate SQL"
order: 4
pubDatetime: 2026-05-18T00:23:00+09:00
modDatetime: 2026-05-18T00:23:00+09:00
description: "Database System Concepts 정리: Chapter 4. Intermediate SQL"
tags:
  - "Database"
  - "CS"
---

## 개요

Chapter 4는 Chapter 3의 basic SQL 위에 더 복잡한 SQL 기능을 얹는다. 핵심 흐름은 여러 relation을 더 자연스럽게 결합하는 join expression, query 결과를 relation처럼 재사용하는 view, database 변경 단위를 다루는 transaction, 데이터 품질을 강제하는 integrity constraint, SQL data type/schema/index, 그리고 authorization이다.

이 장의 중심은 “SQL이 relational model을 실제 시스템 언어로 만들면서 어떤 편의 문법과 안전장치를 제공하는가”이다. `join`, `view`, `constraint`, `grant` 같은 기능은 단순 문법 암기가 아니라, query 표현력, data consistency, security, maintainability를 위해 등장한다.

## 핵심 개념

- `join expression`은 여러 relation의 정보를 결합할 때 Cartesian product와 `where` predicate를 직접 쓰는 방식보다 의도를 더 명확히 표현한다.
- `natural join`은 두 relation의 같은 이름 attribute를 자동으로 equate하고, 공통 attribute를 결과에 한 번만 남긴다.
- `join ... using`은 natural join의 편리함을 유지하면서 어떤 attribute만 matching할지 명시해 accidental equality를 피한다.
- `join ... on`은 arbitrary predicate를 join condition으로 둘 수 있으며, 특히 outer join에서 `where`와 의미가 달라진다.
- `outer join`은 inner join에서 matching되지 않아 사라질 tuple을 null-padded tuple로 보존한다.
- `inner join`, `left outer join`, `right outer join`, `full outer join`은 `natural`, `using`, `on` join condition과 조합될 수 있다.

## 세부 정리

### 4.1 Join Expressions

Chapter 3에서는 set operation을 제외하면 여러 relation의 정보를 결합할 때 주로 Cartesian product와 `where` clause를 함께 사용했다. 예를 들어 `student`와 `takes`를 결합해 학생 이름과 수강 course를 얻으려면 두 relation의 모든 tuple 조합을 만든 뒤 `student.ID = takes.ID`인 조합만 남겼다.

```sql
select name, course_id
from student, takes
where student.ID = takes.ID;
```

이 방식은 relational algebra 관점에서는 자연스럽지만, SQL을 읽는 사람에게는 “무엇을 결합하는가”와 “결합 후 어떤 조건으로 걸러내는가”가 한 `where` clause 안에 섞일 수 있다. Join expression은 이런 결합 의도를 `from` clause 안에서 직접 표현하게 해 준다.

#### 4.1.1 The Natural Join

이 절의 예시는 `student` relation과 `takes` relation을 사용한다. `student`는 학생의 identity와 department, total credit을 담고, `takes`는 학생이 어떤 course section을 수강했는지와 grade를 담는다. `takes.grade`에는 아직 성적이 부여되지 않았음을 나타내는 `null`도 들어갈 수 있다.

![Figure 4.1](@/assets/images/cs-database-043-figure-4-1-page-154.png)
*Figure 4.1 · PDF p. 154 · join 예시에 사용되는 `student` relation*

![Figure 4.2](@/assets/images/cs-database-044-figure-4-2-page-155.png)
*Figure 4.2 · PDF p. 155 · `student`와 `ID`로 연결되는 `takes` relation*

`natural join`은 두 relation에서 같은 이름을 가진 attribute들을 자동으로 matching condition으로 사용한다. `student`와 `takes`는 공통 attribute가 `ID` 하나뿐이므로, `student natural join takes`는 `student.ID = takes.ID`인 tuple 쌍만 결합한다.

```sql
select name, course_id
from student natural join takes;
```

이 query는 앞의 Cartesian product + `where` query와 같은 결과를 만든다. 차이는 결합 의도가 더 직접 드러난다는 점이다. Natural join 결과는 다음 규칙을 따른다.

| 규칙 | 의미 |
|---|---|
| matching 기준 | 두 relation schema에 공통으로 등장하는 모든 attribute 이름 |
| tuple 보존 | 공통 attribute 값이 모두 같은 tuple 쌍만 결과에 들어감 |
| attribute 출력 | 공통 attribute는 결과 schema에 한 번만 나타남 |
| attribute 순서 | 공통 attribute, 첫 번째 relation에만 있는 attribute, 두 번째 relation에만 있는 attribute 순서 |

Figure 4.3은 `student natural join takes`의 결과이다. `student`에 있지만 수강 기록이 없는 Snow(ID 70557)는 matching되는 `takes` tuple이 없으므로 natural join 결과에 나오지 않는다.

![Figure 4.3](@/assets/images/cs-database-045-figure-4-3-page-157.png)
*Figure 4.3 · PDF p. 157 · `student natural join takes` 결과*

`natural join`은 여러 relation에 연쇄적으로 사용할 수 있다.

```sql
select A1, A2, ..., An
from r1 natural join r2 natural join ... natural join rm
where P;
```

그러나 natural join은 attribute 이름이 우연히 같을 때 위험하다. 학생 이름과 그 학생이 들은 course title을 찾는 query를 생각해 보자.

```sql
select name, title
from student natural join takes, course
where takes.course_id = course.course_id;
```

이 query는 먼저 `student`와 `takes`를 `ID`로 natural join한 뒤, `course.course_id`와 matching한다. 반면 다음 query는 의도한 결과가 아니다.

```sql
select name, title
from student natural join takes natural join course;
```

`course` relation에도 `course_id`뿐 아니라 `dept_name`이 있으므로, 마지막 natural join은 `course_id`와 `dept_name`을 모두 같게 요구한다. 그러면 학생이 자기 department가 아닌 다른 department의 course를 수강한 경우가 빠진다. Natural join은 편하지만, “같은 이름이면 무조건 같은 의미”라고 가정하므로 schema naming에 강하게 의존한다.

이 위험을 줄이기 위해 SQL은 `join ... using`을 제공한다.

```sql
select name, title
from (student natural join takes) join course using (course_id);
```

`join ... using (A1, A2, ...)`은 지정한 attribute들만 equality condition으로 사용한다. 두 relation에 같은 이름의 다른 attribute가 있더라도 그것들은 matching 조건에 포함되지 않는다. 즉 `using`은 natural join의 간결함과 explicit join key 지정의 안전성을 절충한다.

#### 4.1.2 Join Conditions

`on` condition은 join에 arbitrary predicate를 붙인다. 문법적으로는 `where` predicate와 비슷하지만, predicate가 join expression의 일부로 붙는다.

```sql
select *
from student join takes on student.ID = takes.ID;
```

이 query는 논리적으로 다음 query와 거의 같다.

```sql
select *
from student, takes
where student.ID = takes.ID;
```

중요한 차이는 결과 schema이다. `natural join`은 공통 attribute `ID`를 한 번만 남기지만, `join ... on student.ID = takes.ID`는 `student.ID`와 `takes.ID`를 모두 결과에 둘 수 있다. 따라서 필요하면 `select` clause에서 하나만 명시적으로 골라야 한다.

```sql
select student.ID as ID, name, dept_name, tot_cred,
       course_id, sec_id, semester, year, grade
from student join takes on student.ID = takes.ID;
```

`on`은 두 가지 이유로 중요하다. 첫째, 결합 조건과 일반 filtering 조건을 분리해 query를 읽기 쉽게 만든다. 둘째, outer join에서는 `on` condition과 `where` condition의 의미가 실제로 달라진다.

#### 4.1.3 Outer Joins

Normal join, 즉 inner join은 matching되는 tuple 쌍만 결과에 남긴다. 이 때문에 `student natural join takes`에서는 아무 course도 수강하지 않은 학생 Snow가 사라진다. 그러나 어떤 질의에서는 “수강 기록이 없어도 학생은 보여 주고, 수강 관련 attribute만 `null`로 채우라”는 결과가 필요하다.

`outer join`은 inner join에서 사라질 tuple을 보존하기 위해 null-padded tuple을 추가한다.

| Outer join 종류 | 보존되는 tuple |
|---|---|
| `left outer join` | 왼쪽 relation에서 matching되지 않은 tuple |
| `right outer join` | 오른쪽 relation에서 matching되지 않은 tuple |
| `full outer join` | 양쪽 relation에서 matching되지 않은 tuple |

Left outer join은 먼저 inner join 결과를 계산한 뒤, 왼쪽 relation의 tuple 중 오른쪽 relation과 matching되지 않은 tuple을 결과에 추가한다. 이때 오른쪽 relation에서 온 attribute들은 `null`로 채운다.

```sql
select *
from student natural left outer join takes;
```

Figure 4.4에서는 Snow가 결과에 남아 있고, `takes` 쪽 attribute인 `course_id`, `sec_id`, `semester`, `year`, `grade`가 `null`로 채워져 있다.

![Figure 4.4](@/assets/images/cs-database-046-figure-4-4-page-162.png)
*Figure 4.4 · PDF p. 162 · `student natural left outer join takes`에서 unmatched student가 null-padded로 보존되는 모습*

Outer join은 “matching되지 않은 tuple 찾기”에도 자주 쓰인다. 예를 들어 아무 course도 수강하지 않은 학생은 left outer join 후 오른쪽 relation에서 온 `course_id`가 `null`인 tuple로 찾을 수 있다.

```sql
select ID
from student natural left outer join takes
where course_id is null;
```

Right outer join은 대칭적으로 오른쪽 relation의 unmatched tuple을 보존한다. Full outer join은 left outer join과 right outer join의 효과를 합친다. 즉 왼쪽에서 match가 없는 tuple과 오른쪽에서 match가 없는 tuple을 모두 null-padded 형태로 남긴다.

```sql
select *
from (select *
      from student
      where dept_name = 'Comp. Sci.')
     natural full outer join
     (select *
      from takes
      where semester = 'Spring' and year = 2017);
```

이 query는 Comp. Sci. 학생 목록과 Spring 2017 section 목록을 full outer join으로 결합한다. Figure 4.6에서 course section을 듣지 않은 Comp. Sci. 학생은 course 관련 attribute가 `null`이고, Comp. Sci. 학생이 듣지 않은 Spring 2017 section은 student 관련 attribute가 `null`이다.

![Figure 4.6](@/assets/images/cs-database-048-figure-4-6-page-164.png)
*Figure 4.6 · PDF p. 164 · full outer join이 양쪽 unmatched tuple을 모두 보존하는 예*

Outer join에서 특히 중요한 점은 `on`과 `where`의 차이다. 다음 query는 `student.ID = takes.ID`를 join condition으로 사용하므로, matching되지 않은 Snow가 null-padded tuple로 보존된다.

```sql
select *
from student left outer join takes on student.ID = takes.ID;
```

반면 조건을 `where`로 옮기고 `on true`로 join하면 의미가 달라진다.

```sql
select *
from student left outer join takes on true
where student.ID = takes.ID;
```

여기서는 `on true` 때문에 모든 student tuple이 모든 takes tuple과 match된다. 그러면 outer join 입장에서는 unmatched tuple이 없으므로 Snow를 위한 null-padded tuple을 만들지 않는다. 이후 `where student.ID = takes.ID`가 적용되면 Snow 관련 Cartesian product tuple은 모두 제거된다. 따라서 outer join에서는 “preserve할 tuple을 결정하는 조건”은 `on`에 두고, 결과 전체에 대한 filter는 `where`에 둔다는 차이를 정확히 이해해야 한다.

Note 4.1은 SQL outer join이 relational algebra의 outer-join 연산과 연결됨을 설명한다. Relational algebra에는 left outer join `⟕`, right outer join `⟖`, full outer join `⟗`, 그리고 조건부 outer join `⟕θ`, `⟖θ`, `⟗θ`가 있으며, 이 정의는 SQL의 outer join 의미와 대응된다.

#### 4.1.4 Join Types and Conditions

SQL에서 일반 join은 outer join과 구분하기 위해 `inner join`이라고 부른다. `inner` keyword는 생략 가능하며, `join`만 쓰면 default는 inner join이다.

```sql
select *
from student join takes using (ID);
```

위 query는 다음과 같다.

```sql
select *
from student inner join takes using (ID);
```

`natural join`도 `natural inner join`과 같은 의미다. SQL join expression은 join type과 join condition을 조합해 생각하면 정리된다.

![Figure 4.7](@/assets/images/cs-database-049-figure-4-7-page-165.png)
*Figure 4.7 · PDF p. 165 · SQL join type과 join condition의 조합*

| 구분 | 선택지 | 핵심 의미 |
|---|---|---|
| Join type | `inner join` | matching tuple만 남김 |
| Join type | `left outer join` | 왼쪽 unmatched tuple 보존 |
| Join type | `right outer join` | 오른쪽 unmatched tuple 보존 |
| Join type | `full outer join` | 양쪽 unmatched tuple 보존 |
| Join condition | `natural` | 같은 이름 attribute 전체로 matching |
| Join condition | `using (A1, ..., An)` | 지정한 공통 attribute만 matching |
| Join condition | `on <predicate>` | 임의의 predicate로 matching |

### 4.2 Views

모든 사용자가 database의 실제 relation 전체를 볼 필요는 없다. 예를 들어 사무 직원은 instructor의 `ID`, `name`, `dept_name`은 필요하지만 `salary`는 볼 권한이 없어야 할 수 있다. 또 어떤 사용자는 enterprise 구조를 실제 schema가 아니라 자기 업무에 맞춘 virtual relation으로 보고 싶을 수 있다.

이럴 때 query 결과를 미리 계산해 table로 저장해 두면 문제가 생긴다. 기반 relation인 `instructor`, `course`, `section` 등이 바뀌면 저장된 query 결과가 더 이상 현재 database 상태와 맞지 않을 수 있기 때문이다. SQL의 `view`는 이 문제를 피하기 위해 query로 정의되는 virtual relation을 제공한다.

View는 개념적으로 query 결과를 relation처럼 보여 주지만, 일반 view는 결과를 미리 저장하지 않는다. DBMS는 view definition, 즉 query expression을 저장하고, view가 query 안에서 사용될 때 그 definition을 펼쳐 현재 기반 relation 위에서 계산한다.

#### 4.2.1 View Definition

View는 `create view`로 정의한다.

```sql
create view v as <query expression>;
```

예를 들어 salary를 숨긴 instructor view는 다음과 같이 만들 수 있다.

```sql
create view faculty as
   select ID, name, dept_name
   from instructor;
```

`faculty` view는 실제 tuple을 저장하는 relation이 아니다. DBMS는 `faculty`라는 이름과 그에 대응하는 query expression을 저장한다. 사용자가 `faculty`를 access하면 그때 query가 실행되어 view tuple이 만들어진다.

Physics department가 Fall 2017에 개설한 section의 building과 room number를 보여 주는 view는 다음처럼 정의할 수 있다.

```sql
create view physics_fall_2017 as
   select course.course_id, sec_id, building, room_number
   from course, section
   where course.course_id = section.course_id
     and course.dept_name = 'Physics'
     and section.semester = 'Fall'
     and section.year = 2017;
```

View와 Chapter 3의 `with` clause는 모두 query expression에 이름을 붙인다는 점에서 비슷하다. 차이는 lifetime이다. `with`로 정의한 이름은 해당 query 안에서만 유효하지만, view는 `drop view` 등으로 명시적으로 제거될 때까지 database object로 남아 여러 query에서 재사용된다.

#### 4.2.2 Using Views in SQL Queries

View name은 relation name이 올 수 있는 곳에 사용할 수 있다. `physics_fall_2017` view를 만든 뒤 Watson building에서 열린 Physics course를 찾으려면 다음처럼 쓴다.

```sql
select course_id
from physics_fall_2017
where building = 'Watson';
```

View의 attribute 이름을 명시해야 할 때도 있다. 예를 들어 aggregate expression `sum(salary)`는 자연스러운 column name이 없으므로 view definition에서 이름을 부여한다.

```sql
create view departments_total_salary(dept_name, total_salary) as
   select dept_name, sum(salary)
   from instructor
   group by dept_name;
```

DBMS가 일반 view를 처리하는 기본 방식은 query rewriting으로 이해할 수 있다. Query 안에 view name이 등장하면 DBMS는 그 부분을 저장된 view definition으로 대체해 평가한다. 따라서 view 결과는 기반 relation의 현재 상태를 반영한다.

View는 다른 view를 정의하는 데도 사용할 수 있다.

```sql
create view physics_fall_2017_watson as
   select course_id, room_number
   from physics_fall_2017
   where building = 'Watson';
```

이 view는 개념적으로 `physics_fall_2017` view 위에 한 번 더 selection/projection을 얹은 것이다. DBMS는 최종적으로 기반 relation `course`, `section`에 대한 query로 펼쳐 평가할 수 있다.

#### 4.2.3 Materialized Views

`materialized view`는 view query의 결과를 실제로 저장하는 view이다. 일반 view는 사용할 때마다 재계산되지만, materialized view는 미리 계산된 결과를 읽을 수 있으므로 특정 query를 훨씬 빠르게 처리할 수 있다.

예를 들어 `departments_total_salary` view가 materialized되어 있다면, department별 salary 합계를 매번 `instructor` 전체에서 다시 aggregate하지 않고 저장된 결과를 읽을 수 있다. 특히 큰 relation 위에서 aggregate한 결과처럼 output이 input보다 훨씬 작은 경우 성능 이득이 크다.

하지만 materialized view에는 비용이 따른다.

| 항목 | 일반 view | Materialized view |
|---|---|---|
| 저장 | view definition만 저장 | query result도 저장 |
| 조회 비용 | 사용할 때 재계산 | 저장된 결과를 읽어 빠를 수 있음 |
| update 비용 | 기반 relation만 갱신 | 기반 relation 변경 시 view maintenance 필요 |
| 최신성 | 항상 현재 relation 기준 | maintenance 방식에 따라 stale 가능 |

기반 relation이 변경되면 materialized view 결과도 맞춰 갱신되어야 한다. 이 과정을 `materialized view maintenance` 또는 `view maintenance`라고 한다. Maintenance는 기반 relation update 즉시 수행될 수도 있고, view access 시점에 lazy하게 수행될 수도 있으며, 주기적으로 재계산될 수도 있다. 주기적 재계산 방식에서는 materialized view가 최신 상태가 아닐 수 있으므로, application이 up-to-date data를 요구하면 주의해야 한다.

SQL 표준은 materialized view를 지정하는 단일 표준 문법을 정의하지 않는다. 여러 DBMS가 자체 SQL extension으로 제공하며, 최신성 보장 방식도 system마다 다르다.

#### 4.2.4 Update of a View

View는 query에는 매우 유용하지만, view를 통해 `insert`, `update`, `delete`를 수행하려 하면 심각한 ambiguity가 생긴다. View modification은 결국 실제 base relation modification으로 번역되어야 하는데, 그 번역이 항상 유일하거나 의미 있게 결정되지 않기 때문이다.

예를 들어 `faculty(ID, name, dept_name)` view에 다음 tuple을 insert한다고 하자.

```sql
insert into faculty
values ('30765', 'Green', 'Music');
```

실제 base relation은 `instructor(ID, name, dept_name, salary)`이다. 그런데 view에는 `salary`가 없으므로 DBMS는 `salary`에 어떤 값을 넣어야 하는지 알 수 없다. 가능한 대응은 insertion을 reject하거나, `salary = null`로 넣는 것이다. 어느 쪽이 맞는지는 application 의미에 달려 있다.

더 어려운 예는 join view이다.

```sql
create view instructor_info as
select ID, name, building
from instructor, department
where instructor.dept_name = department.dept_name;
```

이 view에 `('69987', 'White', 'Taylor')`를 insert하려면 `instructor`와 `department`에 어떤 tuple을 넣어야 할까? Taylor building의 department가 없고 ID 69987 instructor도 없다면, 억지로 `null`이 포함된 tuple을 양쪽 relation에 넣어도 view에 원하는 tuple이 나타나지 않을 수 있다. Figure 4.8은 이런 삽입 후 base relation이 어색하게 변하지만 view update 의도가 달성되지 않는 상황을 보여 준다.

![Figure 4.8](@/assets/images/cs-database-050-figure-4-8-page-171.png)
*Figure 4.8 · PDF p. 171 · join view에 대한 insertion을 base relation tuple로 번역할 때 생기는 문제*

그래서 대부분의 DBMS는 제한된 경우에만 view update를 허용한다. 일반적으로 SQL view가 updatable하려면 다음 조건을 만족해야 한다.

| 조건 | 이유 |
|---|---|
| `from` clause에 base relation이 하나만 있음 | 여러 relation으로 분해해 update할 ambiguity를 피함 |
| `select` clause가 attribute 이름만 포함 | expression, aggregate, `distinct`는 역변환이 어려움 |
| view에 빠진 attribute가 `null`로 설정 가능 | 빠진 column이 `not null`이거나 `primary key` 일부이면 insert 불가 |
| `group by`, `having` 없음 | group result를 개별 base tuple update로 되돌리기 어려움 |

다음 view는 이런 조건을 만족하므로 update가 비교적 명확하다.

```sql
create view history_instructors as
select *
from instructor
where dept_name = 'History';
```

그러나 여기에도 문제가 남는다. 사용자가 `history_instructors` view에 Biology department instructor tuple을 insert하면, base relation `instructor`에는 삽입될 수 있지만 그 tuple은 view의 `where dept_name = 'History'` 조건을 만족하지 않아 view에는 나타나지 않는다. SQL은 기본적으로 이를 허용할 수 있다.

View definition 끝에 `with check option`을 붙이면, view의 `where` condition을 만족하지 않는 insert/update를 reject할 수 있다. 즉 view를 통해 넣은 tuple이 다시 그 view에서 보이는 상태를 강제한다.

복잡한 view update는 trigger로 처리하는 편이 더 명확할 때가 많다. SQL의 trigger에는 view에 대한 기본 insert/update/delete 동작을 대신할 `instead of` mechanism이 있으며, Chapter 5에서 더 자세히 다룬다.

### 4.3 Transactions

`transaction`은 query와 update statement들의 sequence이다. SQL 표준에서는 어떤 SQL statement가 실행되면 transaction이 implicitly 시작된다. Transaction은 다음 둘 중 하나로 끝난다.

| 명령 | 의미 |
|---|---|
| `commit work` | 현재 transaction의 update를 database에 permanent하게 만듦 |
| `rollback work` | 현재 transaction의 update를 모두 undo하고 transaction 시작 전 상태로 복구 |

`work` keyword는 optional이다. `commit` 이후에는 그 transaction의 효과를 `rollback`으로 되돌릴 수 없다. 반대로 transaction이 아직 commit되지 않았다면, 오류, power outage, system crash 같은 failure가 발생했을 때 DBMS는 transaction의 효과를 rollback해 partially updated state가 database에 남지 않게 한다.

Transaction이 필요한 대표 예는 은행 계좌 이체이다. 한 account에서 금액을 빼고 다른 account에 더하는 두 update 중 하나만 수행된 채 crash가 나면 전체 balances가 inconsistent해진다. University 예시에서도 `takes`에 성공적인 course completion을 기록하면서 `student.tot_cred`를 갱신해야 하는데, 둘 중 하나만 반영되면 database consistency가 깨진다.

Transaction은 이런 여러 step을 atomic하게 만든다. Atomicity는 “모든 효과가 반영되거나, 아무 효과도 반영되지 않는다”는 뜻이다. Transaction 중간 statement에서 error가 나면 앞선 update까지 undo되어 database가 half-done 상태로 남지 않는다.

프로그램이 `commit`이나 `rollback` 없이 종료될 때 update가 commit되는지 rollback되는지는 SQL 표준이 정하지 않으며 implementation-dependent이다. 또한 MySQL, PostgreSQL을 포함한 많은 SQL implementation은 기본적으로 각 SQL statement를 하나의 transaction으로 보고 즉시 commit하는 `autocommit` mode를 사용한다. 여러 statement를 하나의 transaction으로 묶으려면 `set autocommit off` 같은 system별 방법으로 automatic commit을 꺼야 한다.

SQL:1999 표준에는 여러 SQL statement를 `begin atomic ... end` 사이에 넣어 하나의 transaction으로 묶는 방식도 있다. 이 블록은 끝까지 실행되면 기본적으로 commit된다. 다만 이 문법은 일부 DBMS만 지원한다. MySQL이나 PostgreSQL처럼 `begin`으로 transaction을 시작하고 `commit work` 또는 `rollback work`로 끝내는 방식이 더 흔하다.

Oracle처럼 DML statement에 대해 automatic commit이 기본이 아닌 system에서는 data를 추가하거나 수정한 뒤 명시적으로 `commit`하지 않으면 disconnect 시 변경이 rollback될 수 있다. Transaction의 ACID properties와 구현 문제는 Chapter 17-19에서 더 깊게 다룬다.

### 4.4 Integrity Constraints

`integrity constraint`는 authorized user가 database를 변경하더라도 data consistency가 깨지지 않도록 지키는 조건이다. 이는 unauthorized access를 막는 security constraint와 구분된다. Integrity constraint는 “허가된 변경이라도 database 의미를 망치면 안 된다”는 안전장치다.

대표적인 integrity constraint는 다음과 같다.

| 제약 | 의미 |
|---|---|
| instructor name cannot be null | 의미 없는 unknown instructor 방지 |
| no two instructors have same instructor ID | key uniqueness 보장 |
| course.dept_name must match department.dept_name | referential integrity 보장 |
| department budget > 0 | domain/business rule 보장 |

이론적으로 integrity constraint는 database에 대한 임의의 predicate일 수 있다. 하지만 모든 변경마다 복잡한 predicate를 검사하면 비용이 커지므로, 실제 DBMS는 비교적 적은 overhead로 검사 가능한 constraint를 중심으로 지원한다. Constraint는 보통 schema design 과정에서 식별하고 `create table`에 선언하지만, 기존 relation에는 `alter table table-name add constraint`로 추가할 수도 있다. 이때 DBMS는 기존 data가 constraint를 만족하는지 먼저 검사하고, 만족하지 않으면 constraint 추가를 reject한다.

#### 4.4.1 Constraints on a Single Relation

Single relation에 직접 선언하는 대표 constraint는 다음 세 가지다.

| Constraint | 역할 |
|---|---|
| `not null` | 특정 attribute에 `null` 삽입 금지 |
| `unique` | 지정 attribute 집합이 superkey가 되도록 강제 |
| `check(<predicate>)` | 각 tuple이 predicate를 만족하도록 강제 |

`primary key`는 Chapter 3에서 다룬 핵심 constraint이고, 이 절에서는 그 외 single-relation constraint를 더 자세히 본다.

#### 4.4.2 Not Null Constraint

SQL에서는 기본적으로 모든 domain에 `null`이 포함된다. 따라서 특별히 막지 않으면 어떤 attribute에도 `null`이 들어갈 수 있다. 하지만 `student.name`이나 `department.budget`처럼 `null`이 들어가면 tuple의 의미가 크게 약해지는 attribute가 있다.

```sql
name varchar(20) not null
budget numeric(12,2) not null
```

`not null`은 domain constraint의 한 형태이다. 해당 attribute에 `null`을 넣는 insert/update는 error diagnostic을 만들고 수행되지 않는다. `primary key` attribute는 SQL에서 자동으로 nonnull이어야 하므로, primary key column에는 `not null`을 별도로 쓰지 않아도 같은 효과가 있다.

#### 4.4.3 Unique Constraint

`unique (Aj1, Aj2, ..., Ajm)`은 지정 attribute들이 superkey를 이루도록 강제한다. 즉 두 tuple이 해당 attribute 값 전체에서 같을 수 없다.

```sql
unique (dept_name, building)
```

다만 `unique`로 지정한 attribute에는 명시적으로 `not null`을 붙이지 않는 한 `null`이 허용된다. SQL에서 `null`은 어떤 값과도 같지 않다고 취급되므로, `unique`와 `null`의 결합은 primary key와 다르다. Primary key는 uniqueness와 nonnull을 함께 요구하지만, `unique`는 기본적으로 nonnull을 요구하지 않는다.

#### 4.4.4 The Check Clause

`check(P)`는 relation의 모든 tuple이 predicate `P`를 만족해야 한다는 constraint이다. Attribute 값 범위를 제한해 type system보다 더 강한 domain rule을 표현할 수 있다.

```sql
budget numeric(12,2) check (budget > 0)
```

예를 들어 `section.semester`를 enum처럼 제한하려면 다음과 같이 쓸 수 있다.

```sql
create table section
   (course_id varchar(8),
    sec_id varchar(8),
    semester varchar(6),
    year numeric(4,0),
    building varchar(15),
    room_number varchar(7),
    time_slot_id varchar(4),
    primary key (course_id, sec_id, semester, year),
    check (semester in ('Fall', 'Winter', 'Spring', 'Summer')));
```

`check`와 `null`의 관계는 특히 중요하다. Check clause는 predicate가 false가 아니면 만족된 것으로 본다. 즉 predicate 결과가 `unknown`이면 violation이 아니다. 따라서 `budget > 0`만으로는 `budget = null`을 막지 못한다. Null을 금지하려면 별도의 `not null` constraint가 필요하다.

Figure 4.9는 university database 일부의 SQL DDL을 보여 준다. `not null`, `primary key`, `foreign key`, `check`가 실제 table definition 안에 어떻게 섞이는지 볼 수 있다.

![Figure 4.9](@/assets/images/cs-database-051-figure-4-9-page-177.png)
*Figure 4.9 · PDF p. 177 · university database 일부에 대한 SQL DDL과 integrity constraint*

`check` clause는 attribute 선언 옆에 둘 수도 있고, table declaration 끝에 별도 constraint로 둘 수도 있다. 보통 single attribute 값 범위는 attribute 옆에, 여러 attribute가 함께 필요한 복잡한 predicate는 table 끝에 둔다. SQL 표준상 `check` predicate는 subquery를 포함할 수 있지만, 널리 쓰이는 DBMS들은 대체로 subquery가 들어간 `check`를 지원하지 않는다.

#### 4.4.5 Referential Integrity

`referential integrity constraint`는 한 relation의 attribute 값이 다른 relation의 특정 attribute 값으로 존재해야 한다는 조건이다. SQL의 `foreign key`는 referenced attribute가 referenced relation의 primary key 또는 unique superkey인 referential integrity constraint이다.

```sql
foreign key (dept_name) references department
```

이 constraint는 `course.dept_name` 값이 반드시 `department` relation에 존재해야 함을 뜻한다. Constraint가 없으면 존재하지 않는 department를 가리키는 course tuple을 insert할 수 있다.

SQL에서는 referenced table의 primary key를 참조하는 경우 attribute 목록을 생략할 수 있다. 명시적으로 쓰면 다음과 같다.

```sql
foreign key (dept_name) references department(dept_name)
```

Referenced attribute 목록은 referenced relation에서 `primary key` 또는 `unique`로 선언된 superkey여야 한다. 또한 foreign key와 referenced key는 attribute 개수가 같고, 대응 attribute들의 data type이 compatible해야 한다.

Foreign key violation이 발생하면 일반적으로 violation을 일으킨 action을 reject하고 transaction을 rollback한다. 하지만 referenced relation의 delete/update 때문에 violation이 생길 때 SQL은 대체 action을 지정할 수 있다.

```sql
foreign key (dept_name) references department
       on delete cascade
       on update cascade
```

`on delete cascade`는 referenced tuple이 삭제될 때 그 tuple을 참조하던 referencing tuple도 함께 삭제한다. `on update cascade`는 referenced key 값이 바뀔 때 referencing field도 새 값으로 함께 갱신한다. 이외에도 referencing field를 `null`로 바꾸는 `set null`, default value로 바꾸는 `set default`가 있다.

Cascading action은 foreign-key dependency chain을 따라 여러 relation으로 전파될 수 있다. 만약 cascading update/delete가 또 다른 constraint violation을 만들고, 그 violation을 더 이상 cascading으로 해결할 수 없으면 system은 transaction을 abort한다. 그러면 원래 변경과 cascade로 생긴 변경이 모두 undo된다.

Foreign key와 `null`의 관계도 주의해야 한다. Foreign key column이 `not null`로 선언되지 않았다면 `null`을 가질 수 있다. SQL에서는 foreign key column 중 하나라도 `null`이면 그 tuple은 referential integrity constraint를 자동으로 만족한다고 본다. 이 기본 의미가 application 의도와 맞지 않으면 별도의 constraint로 보완해야 한다.

#### 4.4.6 Assigning Names to Constraints

Constraint에는 이름을 붙일 수 있다. 이름은 나중에 constraint를 제거하거나 deferred checking을 지정할 때 필요하다.

```sql
salary numeric(8,2),
constraint minsalary check (salary > 29000)
```

나중에 이 constraint를 제거하려면 다음처럼 쓴다.

```sql
alter table instructor drop constraint minsalary;
```

이름을 붙이지 않으면 DBMS가 system-assigned name을 만들 수 있다. 그 이름을 찾는 방법은 system-specific이며, 예를 들어 Oracle은 `user_constraints` 같은 system table을 통해 확인할 수 있다.

#### 4.4.7 Integrity Constraint Violation During a Transaction

Transaction은 여러 step으로 이루어질 수 있으므로, 중간 step에서는 constraint가 일시적으로 깨졌다가 transaction 끝에서 회복될 수 있다. 예를 들어 `person(name, spouse)` relation에서 `spouse`가 `person.name`을 참조하는 foreign key라고 하자. John과 Mary가 서로 배우자임을 두 tuple로 insert하려면 어느 tuple을 먼저 넣어도 첫 insert 직후에는 상대방 tuple이 아직 없어 foreign key violation이 된다. 하지만 두 tuple을 모두 넣은 transaction 끝에서는 constraint가 만족된다.

SQL 표준은 이런 경우를 위해 constraint에 `initially deferred`를 붙여 transaction 끝에서 검사하게 할 수 있다. 또는 `deferrable`로 선언해 기본은 immediate checking이지만 필요할 때 transaction 안에서 다음처럼 미룰 수 있다.

```sql
set constraints constraint-list deferred;
```

Deferred constraint checking을 사용하려면 constraint list에 들어갈 constraint들이 이름을 가져야 한다. 기본 동작은 immediate checking이며, 많은 DBMS는 deferred constraint checking을 지원하지 않는다. 우회 방법으로 foreign key column을 잠시 `null`로 insert한 뒤 나중에 update할 수도 있지만, programming effort가 늘고 attribute가 `not null`이면 쓸 수 없다.

#### 4.4.8 Complex Check Conditions and Assertions

SQL 표준에는 복잡한 integrity constraint를 표현하기 위한 construct가 더 있다. 대표적으로 subquery가 포함된 `check`와 `assertion`이다. 그러나 널리 쓰이는 DBMS들은 대부분 이를 직접 지원하지 않는다.

예를 들어 `section.time_slot_id`가 반드시 `time_slot` relation에 존재해야 한다는 조건은 표준상 다음처럼 쓸 수 있다.

```sql
check (time_slot_id in (select time_slot_id from time_slot))
```

이 constraint는 `section` tuple이 insert/update될 때뿐 아니라, referenced relation인 `time_slot`이 delete/update될 때도 다시 확인되어야 한다. 즉 복잡한 check는 검사 trigger point가 넓어지고 비용이 커질 수 있다.

`assertion`은 database 전체가 항상 만족해야 하는 predicate이다.

```sql
create assertion <assertion-name> check <predicate>;
```

Figure 4.10은 각 student의 `tot_cred`가 그 학생이 성공적으로 완료한 course credit 합과 같아야 한다는 assertion 예시이다. SQL에는 직접적인 “for all X, P(X)” 문법이 없으므로, “P를 만족하지 않는 X가 존재하지 않는다”라는 `not exists` 형태로 universal condition을 표현한다.

![Figure 4.10](@/assets/images/cs-database-052-figure-4-10-page-182.png)
*Figure 4.10 · PDF p. 182 · `tot_cred` 일관성을 표현하는 assertion 예시*

Assertion이 생성될 때 DBMS는 현재 database가 assertion을 만족하는지 검사한다. 이후 모든 modification은 assertion을 깨지 않는 경우에만 허용된다. 그러나 복잡한 assertion은 어떤 relation의 어떤 update에서 다시 검사해야 하는지 추적하고 평가하는 비용이 크다. 그래서 일반 assertion은 많은 system에서 지원되지 않으며, 같은 효과가 필요하면 Chapter 5의 trigger로 구현하는 경우가 많다.

### 4.5 SQL Data Types and Schemas

Chapter 3에서는 integer, real, character type 같은 기본 built-in data type을 다뤘다. 이 절은 날짜/시간, type conversion, default value, large object, user-defined type, generated key, schema/catalog 같은 SQL DDL의 세부 기능을 다룬다. 핵심은 SQL schema가 단순히 column 목록이 아니라 data meaning, naming scope, physical access hint까지 표현한다는 점이다.

#### 4.5.1 Date and Time Types in SQL

SQL 표준은 날짜와 시간 관련 type을 제공한다.

| Type | 의미 | 예 |
|---|---|---|
| `date` | year, month, day로 이루어진 calendar date | `date '2018-04-25'` |
| `time` | hour, minute, second로 이루어진 time of day | `time '09:30:00'` |
| `time(p)` | fractional seconds precision `p`를 갖는 time | `time(3)` |
| `time with timezone` | timezone 정보를 포함한 time | system별 표현 차이 |
| `timestamp` | date와 time의 조합 | `timestamp '2018-04-25 10:29:01.45'` |
| `timestamp(p)` | fractional seconds precision `p`를 갖는 timestamp | default precision은 보통 6 |

Date literal은 `year-month-day` 순서로 쓴다. `time`이나 `timestamp`의 seconds field에는 fractional part가 올 수 있다.

개별 field를 꺼낼 때는 `extract(field from d)`를 사용한다.

```sql
extract(year from date '2018-04-25')
extract(hour from timestamp '2018-04-25 10:29:01.45')
```

`field`에는 `year`, `month`, `day`, `hour`, `minute`, `second`가 올 수 있고, timezone 정보는 `timezone_hour`, `timezone_minute`로 추출할 수 있다.

현재 날짜와 시간을 얻는 표준 function도 있다.

| Function | 반환 |
|---|---|
| `current_date` | current date |
| `current_time` | timezone 포함 current time |
| `localtime` | timezone 없는 local time |
| `current_timestamp` | timezone 포함 current timestamp |
| `localtimestamp` | timezone 없는 local timestamp |

SQL은 `interval` type도 제공한다. 두 `date` 값 `x`, `y`가 있으면 `x - y`는 두 날짜 사이의 일수에 해당하는 interval을 만들 수 있고, date/time에 interval을 더하거나 빼면 다시 date/time을 얻는다. 다만 timezone, daylight saving time, 지원 가능한 시간 범위 등은 system별 edge case가 많다.

#### 4.5.2 Type Conversion and Formatting Functions

DBMS는 일부 type conversion을 자동으로 수행하지만, 어떤 conversion은 명시적으로 요구해야 한다. SQL의 표준 변환 expression은 `cast(e as t)`이다.

예를 들어 `instructor.ID`가 `varchar(5)`이면 문자 정렬에서는 `'11111'`이 `'9'`보다 앞에 올 수 있다. Numeric order로 정렬하려면 숫자로 cast한다.

```sql
select cast(ID as numeric(5)) as inst_id
from instructor
order by inst_id;
```

Type conversion과 display formatting은 구분해야 한다. Numeric value를 특정 digit 수로 보여 주거나 date를 `month-day-year` 형식으로 출력하는 것은 type 자체를 바꾸는 것이 아니라 output format을 바꾸는 문제다. Formatting function은 DBMS별 차이가 크다. MySQL은 `format`, Oracle/PostgreSQL은 `to_char`, `to_number`, `to_date`, SQL Server는 `convert` 같은 function을 제공한다.

`null` 표시도 query result readability에 중요하다. 이 책은 `null`이라고 표시하지만, 실제 DBMS는 blank field로 보여 주는 경우가 많다. `coalesce`는 여러 expression 중 첫 번째 non-null value를 반환한다.

```sql
select ID, coalesce(salary, 0) as salary
from instructor;
```

`coalesce`의 인자는 모두 같은 type이어야 한다. 따라서 `salary`가 null일 때 `'N/A'`라는 string으로 표시하고 싶다면 표준 `coalesce(salary, 'N/A')`는 type mismatch가 된다. Oracle의 `decode` 같은 system-specific function은 null match와 서로 다른 replacement type을 더 유연하게 처리할 수 있다.

#### 4.5.3 Default Values

SQL은 attribute에 default value를 지정할 수 있다.

```sql
create table student
   (ID varchar(5),
    name varchar(20) not null,
    dept_name varchar(20),
    tot_cred numeric(3,0) default 0,
    primary key (ID));
```

이 schema에서는 insert statement가 `tot_cred` 값을 제공하지 않으면 자동으로 0이 들어간다.

```sql
insert into student(ID, name, dept_name)
values ('12789', 'Newman', 'Comp. Sci.');
```

Default value는 “값을 모른다”는 `null`과 다르다. 업무 규칙상 합리적인 기본값이 있을 때 default를 사용하고, 실제로 unknown인 경우에는 `null` 허용 여부를 별도로 판단해야 한다.

#### 4.5.4 Large-Object Types

Database application은 text review, photo, medical image, video 같은 큰 data item을 저장해야 할 수 있다. SQL은 large-object type으로 `clob`과 `blob`을 제공한다.

| Type | 의미 | 예 |
|---|---|---|
| `clob` | Character Large OBject | `book_review clob(10KB)` |
| `blob` | Binary Large OBject | `image blob(10MB)`, `movie blob(2GB)` |

Gigabyte급 large object를 query 결과로 통째로 memory에 가져오는 것은 비효율적이거나 불가능하다. 실제 application은 SQL query로 LOB 자체가 아니라 `locator`를 받아 host language에서 locator를 통해 필요한 조각을 읽는다. JDBC 같은 API는 locator를 이용해 OS file read처럼 large object를 small pieces로 가져올 수 있다.

Note 4.2의 temporal validity는 valid-time interval을 schema에 넣는 예시다. Instructor salary history처럼 시간에 따라 값이 변하는 data는 `start_date`, `end_date` 같은 attribute로 validity period를 표현할 수 있다. 이 경우 같은 `ID`를 가진 여러 tuple이 생길 수 있어 primary key와 foreign key 설계가 복잡해진다. 일부 DBMS는 `period for valid time` 같은 extension으로 특정 시점 또는 기간에 유효한 tuple을 query하는 문법을 제공한다.

#### 4.5.5 User-Defined Types

SQL은 user-defined data type을 지원한다. 여기서 다루는 기본 형태는 `distinct type`이다. 물리적으로 같은 representation을 가져도 개념적으로 다른 domain을 구분해 programming error를 잡는 것이 목적이다.

예를 들어 Dollars와 Pounds는 둘 다 `numeric(12,2)`로 저장할 수 있지만, 서로 직접 대입하거나 비교하는 것은 의미상 오류일 가능성이 크다.

```sql
create type Dollars as numeric(12,2) final;
create type Pounds as numeric(12,2) final;
```

이후 `department.budget`을 `Dollars`로 선언할 수 있다.

```sql
create table department
   (dept_name varchar(20),
    building varchar(15),
    budget Dollars);
```

Strong type checking 때문에 `Dollars` 값을 `Pounds` 변수에 대입하면 compile-time error가 난다. 또한 `department.budget + 20`처럼 `Dollars`와 integer를 직접 더하는 expression도 거부될 수 있다. 필요하면 `cast(department.budget as numeric(12,2))`처럼 underlying numeric type으로 변환한 뒤 연산하고, 다시 `Dollars`로 cast해야 한다.

SQL에는 `domain`이라는 유사하지만 다른 개념도 있다.

```sql
create domain DDollars as numeric(12,2) not null;
```

Type과 domain의 차이는 다음과 같다.

| 구분 | User-defined type | Domain |
|---|---|---|
| 목적 | 개념적으로 다른 type을 strong typing으로 분리 | underlying type에 constraint/default 부여 |
| Constraint/default | 지정 불가 | `not null`, `check`, default 가능 |
| Type checking | strongly typed | underlying type이 compatible하면 assignment 가능 |
| 예 | `Dollars`, `Pounds` 직접 비교 방지 | `YearlySalary`는 값 범위 constraint 포함 |

Domain에는 `check`를 붙여 해당 domain을 사용하는 모든 attribute가 만족해야 할 predicate를 줄 수 있다.

```sql
create domain YearlySalary numeric(8,2)
   constraint salary_value_test check(value >= 29000.00);
```

`value`는 domain value 자체를 가리킨다. Domain은 enum-like restriction도 표현할 수 있다.

```sql
create domain degree_level varchar(10)
   constraint degree_level_test
   check (value in ('Bachelors', 'Masters', 'Doctorate'));
```

다만 `create type`, `create domain`의 표준 문법 지원은 DBMS마다 크게 다르다. PostgreSQL, DB2, SQL Server, Oracle 등은 각자 다른 type/domain/object type mechanism을 제공하므로 실제 사용 시 system manual을 확인해야 한다.

#### 4.5.6 Generating Unique Key Values

Primary key 중에는 `dept_name`처럼 현실 세계의 값을 쓰는 경우도 있고, `ID`처럼 enterprise가 식별 목적으로 생성하는 값도 있다. 후자의 경우 새 tuple을 insert할 때 “어떤 ID를 줄 것인가”가 문제다. 매번 기존 ID 전체를 검사하면 비효율적이므로 DBMS는 unique key-value generation 기능을 제공한다.

표준에 가까운 형태는 identity column이다.

```sql
ID number(5) generated always as identity
```

`generated always as identity`를 사용하면 insert statement는 해당 key 값을 명시하면 안 된다. 대신 attribute list에서 자동 생성 column을 빼고 insert한다.

```sql
insert into instructor (name, dept_name, salary)
values ('Newprof', 'Comp. Sci.', 100000);
```

`generated by default as identity`를 사용하면 사용자가 직접 ID를 지정할 수도 있고, 생략하면 system이 생성할 수도 있다. DBMS별 문법은 다르다. PostgreSQL은 `serial`, MySQL은 `auto_increment`, SQL Server는 `identity`를 사용한다. 또한 여러 DBMS는 relation과 독립적인 `sequence` object를 제공해 여러 relation에서 공유 가능한 unique identifier를 만들 수 있다.

#### 4.5.7 Create Table Extensions

기존 table과 같은 schema를 가진 table을 만들 때 SQL은 `create table ... like`를 제공한다.

```sql
create table temp_instructor like instructor;
```

Complex query 결과를 table로 저장하고 싶을 때는 SQL:2003의 `create table ... as`를 사용할 수 있다.

```sql
create table t1 as
   (select *
    from instructor
    where dept_name = 'Music')
with data;
```

Column name과 data type은 query result에서 inferred된다. 표준상 `with data`를 생략하면 table은 생성되지만 data는 채워지지 않는다. 그러나 많은 implementation은 `with data`를 생략해도 data를 채우는 등 behavior가 다를 수 있다.

`create table ... as`와 `create view`는 둘 다 query로 정의된다는 점에서 비슷하다. 차이는 table은 생성 시점의 query result가 저장되고 이후 자동으로 기반 relation을 따라 변하지 않지만, view는 사용할 때마다 현재 relation 상태를 반영한다는 점이다.

#### 4.5.8 Schemas, Catalogs, and Environments

초기 database system은 모든 relation이 하나의 flat namespace에 있었다. 현대 DBMS는 file system의 directory 구조와 비슷하게 relation name을 조직한다. SQL의 naming hierarchy는 보통 세 단계다.

```text
catalog.schema.SQL-object
```

여기서 SQL object에는 relation, view 등이 들어간다. 일부 DBMS는 `catalog` 대신 `database`라는 용어를 쓴다.

예를 들어 relation을 완전히 식별하려면 다음처럼 쓸 수 있다.

```text
catalog5.univ_schema.course
```

Connection에는 default catalog와 default schema가 설정된다. Catalog를 생략하면 default catalog가 사용되고, schema도 default schema 안의 object라면 생략할 수 있다. 이는 OS login 시 current directory가 home directory로 설정되는 것과 비슷하다.

여러 catalog와 schema가 있으면 user/application별 namespace 충돌을 줄이고, production version과 test version 같은 여러 application version을 같은 DBMS 안에서 독립적으로 운용할 수 있다. SQL environment는 default catalog/schema뿐 아니라 user identifier, 즉 authorization identifier도 포함한다.

Schema는 `create schema`, `drop schema`로 만들고 지울 수 있다. 많은 DBMS는 user account를 만들 때 같은 이름의 schema를 자동 생성한다. Catalog 생성/삭제는 implementation-dependent이며 SQL 표준의 범위 밖이다.

### 4.6 Index Definition in SQL

많은 query는 relation의 전체 tuple 중 작은 부분만 필요로 한다. 예를 들어 Physics department instructor를 찾거나 ID가 특정 값인 instructor salary를 찾기 위해 모든 instructor tuple을 scan하는 것은 비효율적이다.

`index`는 relation의 특정 attribute 값으로 tuple을 빠르게 찾기 위한 data structure이다. 예를 들어 `instructor.dept_name`에 index가 있으면 DBMS는 `dept_name = 'Physics'`인 tuple을 전체 scan 없이 직접 찾을 수 있다. 여러 attribute로 구성된 index도 만들 수 있다.

Index는 correctness에는 필요하지 않다. 같은 data를 더 빠르게 찾기 위한 redundant data structure이므로 logical schema가 아니라 physical schema에 속한다. 그러나 query와 update transaction의 효율, primary-key/foreign-key constraint enforcement에는 매우 중요하다.

Index에는 trade-off가 있다.

| 이득 | 비용 |
|---|---|
| selection query를 빠르게 처리 | index 저장 공간 필요 |
| key/foreign-key constraint 검사 가속 | insert/delete/update 때 index도 갱신해야 함 |
| join/search key 접근 가속 | 어떤 index를 유지할지 선택이 어려움 |

SQL 표준은 physical schema control을 다루지 않지만, 대부분의 DBMS는 DDL command로 index 생성/삭제를 지원한다.

```sql
create index <index-name> on <relation-name> (<attribute-list>);
```

예를 들어 `instructor.dept_name`을 search key로 하는 index는 다음과 같이 만든다.

```sql
create index dept_index on instructor (dept_name);
```

사용자가 SQL query를 제출하면 query processor는 index가 도움이 되는 경우 자동으로 index를 선택해 사용할 수 있다. 사용자가 query 안에서 직접 “이 index를 써라”라고 표현하는 것이 SQL의 본질은 아니다.

`unique` index는 search key가 candidate key임을 선언한다.

```sql
create unique index dept_index on instructor (dept_name);
```

이 명령은 `dept_name`이 instructor의 candidate key라는 뜻이 되므로 university 예시에는 적절하지 않다. 생성 시 기존 data가 uniqueness를 위반하면 index creation이 실패하고, 생성 후에는 uniqueness를 위반하는 insert/update가 거부된다. SQL 표준의 `unique` constraint를 지원하는 system에서는 이 기능이 논리적으로 중복될 수 있다.

Index를 제거하려면 index name이 필요하다.

```sql
drop index <index-name>;
```

많은 DBMS는 B+-tree, hash index 같은 index type이나 clustered index 여부도 지정하게 한다. Clustered index는 relation을 search key 순서로 저장하게 하는 방식이다. Index 구현과 선택 문제는 Chapter 14에서 자세히 다룬다.

### 4.7 Authorization

`authorization`은 user가 database의 어느 부분에 어떤 종류의 접근을 할 수 있는지 결정한다. Data에 대한 대표 privilege는 다음 네 가지다.

| Privilege | 허용하는 동작 |
|---|---|
| `select` | data 읽기 |
| `insert` | 새 tuple 삽입 |
| `update` | 기존 tuple 수정 |
| `delete` | tuple 삭제 |

SQL implementation은 user가 query나 update를 제출하면 먼저 authorization을 검사한다. 권한이 없으면 해당 statement를 reject한다. Data privilege 외에도 user는 schema에 대한 권한을 받을 수 있다. 예를 들어 relation을 create/modify/drop하거나, index를 추가/삭제하는 권한이 있다. 최상위 authority는 database administrator(DBA)에게 있으며, 이는 OS의 superuser/administrator와 비슷하다.

#### 4.7.1 Granting and Revoking of Privileges

SQL의 `grant` statement는 privilege를 user 또는 role에게 부여한다.

```sql
grant <privilege list>
on <relation name or view name>
to <user/role list>;
```

예를 들어 Amit과 Satoshi에게 `department` relation의 read 권한을 주려면 다음처럼 쓴다.

```sql
grant select on department to Amit, Satoshi;
```

`update` privilege는 relation 전체에 줄 수도 있고 특정 attribute에만 줄 수도 있다.

```sql
grant update (budget) on department to Amit, Satoshi;
```

`insert` privilege도 attribute list를 지정할 수 있다. 이 경우 insert는 허용된 attribute만 명시해야 하며, 나머지 attribute는 default value가 있으면 default로, 없으면 `null`로 설정된다. `delete` privilege는 relation에서 tuple을 삭제할 수 있게 한다. `public` user name은 현재와 미래의 모든 user를 가리키므로, `public`에 준 privilege는 사실상 전체 user에게 주는 권한이다.

부여된 권한을 회수하려면 `revoke`를 사용한다.

```sql
revoke <privilege list>
on <relation name or view name>
from <user/role list>;
```

예시는 다음과 같다.

```sql
revoke select on department from Amit, Satoshi;
revoke update (budget) on department from Amit, Satoshi;
```

SQL authorization은 기본적으로 relation 전체 또는 relation의 특정 attribute 수준에서 privilege를 부여한다. 표준적인 `grant`/`revoke`만으로는 특정 tuple, 즉 row 단위 authorization을 직접 표현하지 않는다. Row-level authorization은 뒤의 4.7.7에서 별도 mechanism으로 다룬다.

#### 4.7.2 Roles

많은 조직에서는 개별 user보다 role 단위로 권한을 관리하는 것이 자연스럽다. 예를 들어 모든 instructor가 같은 relation에 같은 종류의 access를 가져야 한다면, 새 instructor가 올 때마다 개별 privilege를 모두 부여하는 것은 번거롭고 오류가 나기 쉽다.

SQL의 `role`은 privilege 묶음이다. Role을 만들고, role에 privilege를 부여한 뒤, user에게 role을 부여한다.

```sql
create role instructor;

grant select on takes
to instructor;
```

Role은 user뿐 아니라 다른 role에도 부여할 수 있다.

```sql
create role dean;
grant instructor to dean;
grant dean to Satoshi;
```

이 경우 Satoshi는 직접 받은 privilege뿐 아니라 `dean` role의 privilege, `dean`이 상속한 `instructor` role의 privilege까지 가진다. Role chain을 통해 privilege가 전파될 수 있으므로, 실제 user privilege는 다음의 합으로 이해한다.

| 출처 | 설명 |
|---|---|
| direct privilege | user 또는 role에 직접 부여된 privilege |
| role-derived privilege | user/role에 부여된 role이 가진 privilege |
| transitive role privilege | role chain을 따라 간접적으로 얻은 privilege |

공유 userid 하나를 여러 instructor가 함께 쓰는 방식은 누가 update를 수행했는지 추적하기 어렵고, password 교체와 회수도 위험하다. Role-based authorization은 각 user가 자기 userid로 접속하면서도 업무 역할에 맞는 권한을 갖게 해 준다.

#### 4.7.3 Authorization on Views

View는 authorization과 잘 맞는다. User에게 base relation 전체를 보여 주지 않고, 필요한 tuple/attribute만 담은 view에 대한 권한을 줄 수 있기 때문이다. 예를 들어 Geology department instructor만 보여 주는 view는 다음과 같이 정의할 수 있다.

```sql
create view geo_instructor as
   (select *
    from instructor
    where dept_name = 'Geology');
```

Staff member에게 `geo_instructor`에 대한 `select` 권한만 주면, user는 Geology instructor 정보만 볼 수 있다. 중요한 점은 authorization check가 view definition을 base relation query로 펼치기 전에 이루어져야 한다는 것이다. 그렇지 않으면 user가 view를 통해 허용된 data를 보려는 query가 base relation `instructor` 접근으로 오해되어 reject될 수 있다.

View creator가 항상 view에 대한 모든 privilege를 얻는 것은 아니다. Creator는 자신이 이미 가진 권한을 넘어서지 않는 privilege만 view에 대해 받을 수 있다. 예를 들어 base relation에 update 권한이 없는 user가 만든 view에 대해 update 권한을 갖게 되면, view를 통해 base relation을 우회 수정하는 문제가 생긴다. 따라서 view creation 자체가 거부될 수도 있다.

Function/procedure도 authorization과 연결된다. SQL은 function/procedure에 `execute` privilege를 줄 수 있다. 기본적으로 function/procedure는 creator의 privilege로 실행될 수 있지만, SQL:2003의 `sql security invoker` clause를 사용하면 invoker의 privilege로 실행되게 만들 수 있다. 이는 library function이 호출자 권한 안에서만 동작하도록 할 때 유용하다.

#### 4.7.4 Authorizations on Schema

SQL 표준에서 schema modification은 기본적으로 schema owner만 수행할 수 있다. Relation 생성/삭제, attribute 추가/삭제, index 추가/삭제 같은 작업이 여기에 속한다.

또 하나 중요한 schema-level privilege는 `references` privilege이다. 어떤 user가 foreign key를 만들려면 referenced relation의 해당 attribute에 대한 `references` privilege가 필요할 수 있다.

```sql
grant references (dept_name) on department to Mariano;
```

Foreign key 생성이 왜 권한 문제인지 처음에는 이상해 보일 수 있다. 하지만 누군가 `department.dept_name`을 참조하는 relation을 만들고 tuple을 넣으면, 이후 `department` relation에서 해당 department를 삭제하거나 key 값을 update하는 일이 제한된다. 즉 다른 user의 future update를 제약하므로, referenced relation owner가 이를 허락해야 한다.

마찬가지로 어떤 relation의 `check` constraint가 subquery로 다른 relation을 참조한다면, 그 constraint도 referenced relation의 update 가능성을 제한한다. 그래서 이런 경우에도 references privilege가 필요하다는 해석이 자연스럽다.

#### 4.7.5 Transfer of Privileges

Privilege를 받은 user가 그 privilege를 다른 user에게 다시 grant할 수 있게 하려면 `with grant option`을 붙인다.

```sql
grant select on department to Amit with grant option;
```

Object creator는 그 object에 대한 모든 privilege와 grant privilege를 가진다. Privilege 전달 관계는 authorization graph로 생각할 수 있다. Node는 user이고, edge `Ui → Uj`는 `Ui`가 `Uj`에게 특정 privilege를 grant했음을 뜻한다. Root는 DBA이다. 어떤 user가 privilege를 갖는 조건은 authorization graph에서 DBA root로부터 그 user까지 path가 존재하는 것이다.

![Figure 4.11](@/assets/images/cs-database-053-figure-4-11-page-200.png)
*Figure 4.11 · PDF p. 200 · privilege 전달과 revocation을 설명하는 authorization-grant graph*

Figure 4.11에서 U5는 U1과 U2 모두에게서 authorization을 받았으므로, U1 쪽 권한이 revoke되어도 U2를 통한 path가 남아 있으면 privilege를 유지한다. 반대로 어떤 user로 가는 root path가 모두 끊기면 privilege를 잃는다.

#### 4.7.6 Revoking of Privileges

Privilege revocation은 단순히 한 edge를 지우는 문제가 아니다. 어떤 user가 받은 privilege를 다시 다른 user에게 grant했다면, 원 privilege가 회수될 때 downstream privilege도 영향을 받을 수 있다.

이 동작을 `cascading revocation`이라고 한다. 대부분의 DBMS에서 cascade가 default이다. Cascading을 막고 싶으면 `restrict`를 붙일 수 있다.

```sql
revoke select on department from Amit, Satoshi restrict;
```

이 경우 revoke가 cascade를 일으켜야 한다면 DBMS는 revoke를 수행하지 않고 error를 반환한다. 반대로 명시적으로 cascade를 허용하려면 `cascade` keyword를 사용할 수 있지만, default인 경우 생략할 수 있다.

Grant option만 회수하고 privilege 자체는 유지하고 싶을 때는 다음과 같이 쓴다.

```sql
revoke grant option for select on department from Amit;
```

일부 DBMS는 이 문법을 지원하지 않으며, 그런 경우 privilege 자체를 revoke한 뒤 grant option 없이 다시 grant하는 방식으로 우회한다.

Cascading revocation이 항상 바람직한 것은 아니다. 예를 들어 Satoshi가 `dean` role을 가진 상태에서 Amit에게 `instructor` role을 grant했다고 하자. 나중에 Satoshi가 dean role을 잃더라도 Amit이 계속 instructor라면 Amit의 instructor role은 유지되어야 한다. 이런 상황을 위해 SQL은 grantor를 user가 아니라 current role로 설정할 수 있다.

```sql
set role dean;
-- grant statement에 granted by current role 사용
```

`granted by current role`을 사용하면 실제 statement를 실행한 user가 Satoshi였더라도 grantor는 `dean` role이 된다. 따라서 Satoshi 개인의 privilege가 revoke되어도 dean role이 부여한 privilege는 유지될 수 있다.

#### 4.7.7 Row-Level Authorization

표준적인 SQL privilege는 relation/view 또는 attribute 수준이다. 그러나 일부 DBMS는 tuple, 즉 row 수준의 fine-grained authorization을 제공한다. 예를 들어 student가 `takes` relation에서 자기 수강 기록만 볼 수 있게 하고 다른 학생의 record는 보지 못하게 할 수 있다.

Oracle의 Virtual Private Database(VPD)는 row-level authorization의 예이다. Administrator가 relation에 function을 연결하면, 그 function이 반환한 predicate가 해당 relation을 사용하는 query의 `where` clause에 자동으로 추가된다.

예를 들어 `takes` relation에 다음 predicate를 연결할 수 있다.

```sql
ID = sys_context('USERENV', 'SESSION_USER')
```

그러면 각 query는 현재 session user의 ID와 일치하는 `takes` tuple만 보게 된다. PostgreSQL과 SQL Server도 다른 syntax로 conceptually similar한 row-level authorization을 제공한다.

주의할 점은 predicate가 자동으로 추가되면 사용자가 생각한 query 의미가 바뀔 수 있다는 것이다. 예를 들어 user가 전체 course의 average grade를 구한다고 생각하고 query를 작성해도, VPD predicate 때문에 실제로는 자기 grade 평균만 계산될 수 있다. DBMS가 rewritten query에 대해서는 올바른 답을 주더라도, 사용자가 의도한 “전체 data에 대한 query”와는 달라질 수 있다.

### 4.8 Summary

Chapter 4의 intermediate SQL은 SQL을 “단일 table query language”에서 실제 application schema를 다루는 언어로 확장한다. Join expression은 여러 relation 결합을 명시적으로 표현하고, view는 query 결과를 virtual relation으로 재사용하며, transaction은 여러 update를 atomic unit으로 묶는다.

Integrity constraint는 authorized update가 data consistency를 깨뜨리지 않게 하고, data type/schema/index 기능은 data meaning과 namespace, physical access path를 다룬다. Authorization은 user/role이 어떤 data와 schema operation을 수행할 수 있는지 통제한다.

이 장에서 반복되는 큰 원리는 “SQL의 선언적 문법은 편리하지만, null, duplicate, view expansion, constraint timing, privilege propagation 같은 system-level 의미를 함께 이해해야 안전하다”는 것이다.

## 연결 관계

Chapter 3의 `select-from-where`, nested subquery, `with`, `insert/update/delete`는 Chapter 4의 기반이다. Join expression은 Chapter 3에서 Cartesian product와 `where`로 표현하던 결합을 더 명시적인 syntax로 바꾼다. View는 Chapter 3의 `with`와 비슷하지만 query-local이 아니라 persistent database object라는 점에서 확장된 개념이다.

Transaction은 뒤의 Chapter 17-19로 이어진다. 여기서는 `commit`, `rollback`, atomicity만 다루지만, 이후에는 ACID properties, concurrency control, recovery, logging이 본격적으로 나온다. Chapter 4에서 transaction 중 constraint를 언제 검사할지 다룬 deferred constraint checking도 뒤 장의 transaction semantics와 연결된다.

Integrity constraint는 Chapter 7의 database design과 직접 연결된다. Primary key, foreign key, `not null`, `unique`, `check`는 schema에 표현되는 기초 제약이고, Chapter 7의 functional dependency는 좋은 schema 설계를 위해 더 깊게 다루는 constraint이다.

Index는 Chapter 14의 storage/indexing과 Chapter 15-16의 query processing/optimization으로 이어진다. Chapter 4에서는 SQL DDL로 index를 선언하는 수준이지만, 실제로 어떤 index가 query plan에 쓰이는지, B+-tree/hash index가 어떻게 동작하는지는 뒤에서 다룬다.

Authorization은 application architecture와도 연결된다. View-based authorization, role-based authorization, row-level authorization은 application server에서 access control을 구현할지 DBMS에서 강제할지의 설계 선택과 관련된다.

## 오해하기 쉬운 내용

- `natural join`은 항상 안전한 축약형이 아니다. 같은 이름 attribute가 우연히 늘어나면 query semantics가 바뀔 수 있다.
- `join ... on`의 predicate를 outer join에서 무심코 `where`로 옮기면 unmatched tuple 보존 여부가 달라진다.
- `left outer join` 후 unmatched tuple을 찾을 때는 오른쪽 relation에서 온 attribute가 `null`인지 검사해야 한다.
- 일반 view는 query result를 저장하지 않는다. View definition을 저장하고 사용할 때 현재 relation 위에서 평가한다.
- `materialized view`는 빠를 수 있지만 storage cost와 view maintenance overhead, stale data 위험이 있다.
- View update는 항상 가능한 것이 아니다. Join view, aggregate view, `distinct` view는 base relation update로 명확히 번역하기 어렵다.
- `with check option`은 view를 통해 insert/update된 tuple이 view condition을 만족하도록 막아 주지만, 모든 view update ambiguity를 해결하지는 않는다.
- `rollback`은 commit 전 transaction의 update를 되돌린다. 이미 `commit`된 transaction은 일반적인 `rollback`으로 되돌릴 수 없다.
- `check` predicate가 `unknown`이면 violation이 아니다. Null을 막으려면 `not null`을 따로 써야 한다.
- `unique` constraint는 기본적으로 `null`을 허용할 수 있다. Primary key와 같은 의미로 생각하면 안 된다.
- Foreign key column에 `null`이 있으면 SQL은 기본적으로 referential integrity를 만족한다고 본다.
- `on delete cascade`는 편리하지만 dependency chain을 따라 큰 삭제를 전파할 수 있으므로 신중히 사용해야 한다.
- Index는 logical correctness를 위한 필수 요소가 아니라 physical performance structure이다. 많을수록 항상 좋은 것이 아니며 update 비용과 storage cost가 있다.
- `grant` 받은 privilege가 곧 다른 user에게 grant할 권한을 뜻하지 않는다. 전달 가능하려면 `with grant option`이 필요하다.
- Privilege revocation은 authorization graph의 root path를 기준으로 cascade될 수 있다.
- Row-level authorization은 보안을 강화하지만, 자동 predicate 추가 때문에 사용자가 의도한 aggregate/query 의미가 달라질 수 있다.

## 면접 질문

1. `natural join`, `join ... using`, `join ... on`의 차이를 설명하고, natural join이 위험해지는 상황을 예로 들어 보라.
2. `inner join`과 `left/right/full outer join`의 결과 차이를 unmatched tuple 관점에서 설명해 보라.
3. Outer join에서 `on` condition과 `where` condition이 왜 같은 의미가 아닐 수 있는가?
4. View와 `with` clause의 차이는 무엇인가? View와 `create table ... as`의 차이도 함께 설명해 보라.
5. Materialized view가 query 성능을 높이는 이유와 view maintenance 비용을 설명해 보라.
6. View update가 어려운 이유를 `faculty` view와 join view 예시로 설명해 보라.
7. Transaction에서 `commit work`와 `rollback work`의 의미는 무엇이며, atomicity와 어떻게 연결되는가?
8. `not null`, `unique`, `check`, `foreign key` constraint가 각각 막는 data inconsistency는 무엇인가?
9. SQL에서 `check` predicate가 `unknown`일 때 constraint violation이 아닌 이유와 그로 인한 주의점을 설명해 보라.
10. Foreign key에서 `on delete cascade`, `on update cascade`, `set null`, `set default`의 차이는 무엇인가?
11. Deferred constraint checking이 필요한 상황을 transaction 예시로 설명해 보라.
12. Assertion이 일반 `check` constraint보다 강력하지만 널리 지원되지 않는 이유는 무엇인가?
13. `distinct type`과 `domain`의 차이를 strong typing과 constraint/default 관점에서 설명해 보라.
14. `generated always as identity`, `serial`, `auto_increment`, `sequence`가 해결하려는 문제는 무엇인가?
15. Index가 query 성능을 높이는 방식과 update 성능을 떨어뜨릴 수 있는 이유를 설명해 보라.
16. SQL의 `grant`, `revoke`, `with grant option`, `restrict`, cascading revocation을 authorization graph로 설명해 보라.
17. Role-based authorization이 shared userid 방식보다 나은 이유는 무엇인가?
18. View-based authorization과 row-level authorization의 차이, 그리고 VPD 방식의 잠재적 함정을 설명해 보라.
