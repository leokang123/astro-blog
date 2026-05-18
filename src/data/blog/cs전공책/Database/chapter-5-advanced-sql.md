---
title: "Chapter 5. Advanced SQL"
order: 5
pubDatetime: 2026-05-18T00:22:00+09:00
modDatetime: 2026-05-18T00:22:00+09:00
description: "Database System Concepts 정리: Chapter 5. Advanced SQL"
tags:
  - "Database"
  - "CS"
---

## 개요

Chapter 5는 SQL을 application code, database server 내부 procedural code, automatic action, recursive computation, analytical aggregation으로 확장한다. Chapter 3-4가 SQL의 query/update/schema/security 기초를 다뤘다면, 이 장은 실제 application이 SQL을 어떻게 호출하고, DBMS가 SQL 주변의 절차적 로직과 분석 기능을 어떻게 제공하는지 보여 준다.

우선순위는 `보류`이므로 제품별 API 세부나 표준 문법 암기는 줄이고, 왜 이런 기능이 필요한지와 어떤 위험/효과가 있는지 중심으로 정리한다. 특히 `prepared statement`, `SQL injection`, `stored procedure`, `trigger`, `recursive query`, `window function`, `rollup`, `cube`는 검색 가능하도록 영어 용어를 유지한다.

## 핵심 개념

- SQL은 declarative query language이지만, application은 user interaction, report printing, GUI update, network call 같은 nondeclarative action을 위해 general-purpose programming language와 결합해야 한다.
- Programming language에서 SQL에 접근하는 방식은 크게 `dynamic SQL`과 `embedded SQL`로 나뉜다.
- `JDBC`, `ODBC`, Python Database API는 database connection, SQL execution, result fetching, transaction control을 host language API로 제공한다.
- `prepared statement`는 query template을 미리 준비하고 parameter를 나중에 넣는 방식으로, 성능 재사용보다 `SQL injection` 방지가 더 중요한 이유가 된다.
- `metadata` API는 application이 schema를 hard-code하지 않고 database/result set 구조를 runtime에 알아내게 한다.

## 세부 정리

### 5.1 Accessing SQL from a Programming Language

SQL은 relation을 input/output으로 다루는 declarative language이다. 반면 Java, C, Python 같은 general-purpose programming language는 variable, object, loop, conditional, I/O를 중심으로 동작한다. 실제 database application은 SQL만으로 끝나지 않는다. Query/update는 application의 한 부분이고, 나머지는 user interaction, report generation, GUI rendering, external service call 같은 nondeclarative action이다.

따라서 application은 SQL과 host language를 연결해야 한다. 이 연결이 필요한 이유는 두 가지다.

| 이유 | 설명 |
|---|---|
| 표현력 보완 | SQL이 모든 일반 계산을 표현하지는 못하므로 C/Java/Python 같은 언어의 full expressive power가 필요함 |
| application integration | SQL 결과를 화면에 보여 주거나, 보고서를 만들거나, user input과 연결하려면 host language가 필요함 |

SQL과 host language의 가장 큰 mismatch는 data model이다. SQL은 relation 단위로 연산하고 relation을 반환하지만, host language는 보통 tuple attribute 값에 해당하는 variable/object 단위로 다룬다. 그래서 query result를 host language가 처리할 수 있도록 한 row씩 fetch하고, attribute 값을 language variable로 가져오는 mechanism이 필요하다.

#### Dynamic SQL과 Embedded SQL

Programming language에서 SQL을 쓰는 방식은 크게 두 가지다.

| 방식 | 핵심 아이디어 | 대표 예 |
|---|---|---|
| `dynamic SQL` | program이 runtime에 SQL string을 만들고 DB server에 전송한 뒤 결과를 받아옴 | JDBC, ODBC, Python Database API |
| `embedded SQL` | source code 안의 SQL statement를 preprocessor가 compile time에 host-language call로 변환 | `EXEC SQL ...` |

`dynamic SQL`은 runtime에 query string을 구성할 수 있어 유연하다. JDBC는 Java용 API이고, ODBC는 원래 C용 API였지만 C++, C#, Ruby, Go, PHP, Visual Basic 등으로 확장되었다. Python에서는 Python Database API를 구현한 driver를 통해 database에 접근한다.

`embedded SQL`은 SQL statement가 compile/preprocess time에 식별된다. Preprocessor가 embedded SQL을 host language declaration과 procedure call로 바꾼 뒤, host-language compiler가 결과 program을 compile한다. 이 방식은 SQL 관련 type error를 더 일찍 잡을 수 있고 query가 코드 안에서 비교적 명확히 보일 수 있지만, preprocessing 결과 code debugging이 복잡하고 host language 문법 변화와 충돌할 수 있다. 현재는 대부분 system이 embedded SQL보다 dynamic SQL을 더 많이 사용한다.

#### 5.1.1 JDBC

`JDBC`는 Java program이 database server에 접속하고 SQL statement를 실행하며 result를 읽을 수 있게 하는 API이다. JDBC는 API를 정의할 뿐, database와 통신하는 wire protocol까지 표준화하지는 않는다. 실제 DBMS마다 JDBC driver가 필요하고, driver가 product-independent JDBC call을 product-specific protocol/call로 변환한다.

JDBC program의 기본 흐름은 다음과 같다.

1. `DriverManager.getConnection()`으로 database connection을 연다.
2. `Connection.createStatement()` 또는 `Connection.prepareStatement()`로 statement handle을 만든다.
3. `executeQuery()`로 query를 실행하거나 `executeUpdate()`로 insert/update/delete/DDL을 실행한다.
4. Query result는 `ResultSet`으로 받고, `next()`로 한 tuple씩 fetch한다.
5. `getString()`, `getFloat()` 같은 getter로 attribute 값을 꺼낸다.
6. Connection, statement, result set 같은 resource를 닫는다.

Figure 5.1은 JDBC code의 전체 모양을 보여 준다. 이 예시는 `Connection`, `Statement`, `ResultSet`, `executeUpdate`, `executeQuery`, `rset.next()`, attribute getter가 어떻게 함께 쓰이는지 보여 주는 기본 골격이다.

![Figure 5.1](@/assets/images/cs-database-055-figure-5-1-page-214.png)
*Figure 5.1 · PDF p. 214 · JDBC connection, update, query, result fetching의 기본 흐름*

`getConnection()`에는 database URL/protocol/server/port/database name, database user identifier, password가 들어간다. Password가 source code 안에 직접 들어가면 보안 위험이 있으므로 실제 application에서는 configuration/secret management가 중요하다.

JDBC method는 `SQLException`을 던질 수 있다. SQL-specific exception과 일반 Java exception은 구분해서 처리하는 것이 좋다. 또한 connection/statement/result set은 system resource를 소비하므로 반드시 닫아야 한다. Java의 `try-with-resources`는 try block이 끝날 때 resource를 자동으로 close해 exception path에서도 leak을 줄인다.

#### Prepared Statements와 SQL Injection

`prepared statement`는 SQL statement 안의 일부 값을 `?` placeholder로 두고, 실제 parameter value를 나중에 binding하는 방식이다.

```sql
insert into instructor values(?, ?, ?, ?)
```

DBMS는 query template을 prepare/compile할 수 있고, application은 매 실행마다 `setString()`, `setInt()` 같은 method로 parameter 값을 바꿔 실행한다. Figure 5.2는 JDBC prepared statement의 parameter binding과 repeated execution을 보여 준다.

![Figure 5.2](@/assets/images/cs-database-056-figure-5-2-page-218.png)
*Figure 5.2 · PDF p. 218 · JDBC `PreparedStatement`에서 placeholder에 값을 binding하는 예*

Prepared statement의 장점은 두 가지다.

| 장점 | 설명 |
|---|---|
| 실행 효율 | 같은 query template을 한 번 compile하고 여러 parameter로 반복 실행 가능 |
| 보안 | user input을 SQL syntax가 아니라 value로 다루게 해 `SQL injection`을 막음 |

성능보다 더 중요한 이유는 보안이다. User input을 string concatenation으로 SQL에 붙이면, 입력값 안의 quote나 SQL fragment가 query syntax를 바꿀 수 있다. 예를 들어 이름 조건에 사용자가 `X' or 'Y' = 'Y`를 넣으면 where clause가 항상 true가 되어 전체 relation이 반환될 수 있다. 더 심한 경우 `X'; drop table instructor; --` 같은 입력으로 여러 SQL statement를 실행하게 만들 수도 있다.

Prepared statement는 user input을 parameter로 전달하고 필요한 escape 처리를 수행하므로, 입력 문자열이 SQL code가 아니라 data value로 해석된다. 따라서 user-entered value를 포함하는 SQL은 string concatenation으로 만들지 말고 반드시 prepared statement parameter로 전달해야 한다.

#### CallableStatement와 Metadata

JDBC의 `CallableStatement`는 SQL stored function/procedure를 호출하는 API이다. Query에 대한 `PreparedStatement`와 비슷하게, function/procedure call에 대해 parameter와 out parameter를 다룬다.

```java
CallableStatement cStmt1 = conn.prepareCall("{? = call some_function(?)}");
CallableStatement cStmt2 = conn.prepareCall("{call some_procedure(?,?)}");
```

Function return value나 procedure out parameter의 type은 `registerOutParameter()`로 등록하고, 결과는 getter method로 꺼낸다.

`metadata` 기능은 application이 database schema를 hard-code하지 않고 runtime에 구조를 알아내게 한다. `ResultSet.getMetaData()`는 `ResultSetMetaData`를 반환하고, 이를 통해 query result의 column count, column name, column type 등을 얻을 수 있다. `Connection.getMetaData()`는 `DatabaseMetaData`를 반환해 DBMS product/version, supported feature, table 목록, column 목록, primary key, foreign-key reference 등을 확인할 수 있다.

Figure 5.3은 `DatabaseMetaData.getColumns()`로 특정 schema/table의 column 정보를 가져오는 예다.

![Figure 5.3](@/assets/images/cs-database-057-figure-5-3-page-221.png)
*Figure 5.3 · PDF p. 221 · JDBC `DatabaseMetaData`로 column metadata를 조회하는 예*

Metadata는 database browser, generic table viewer, query result formatter처럼 사전에 schema를 모르는 tool을 만들 때 중요하다. Schema가 바뀌어도 metadata를 읽어 동작하면 code의 robust함이 좋아진다.

#### JDBC의 추가 기능

JDBC는 updatable result set, transaction control, large object access, row set 같은 기능도 제공한다.

| 기능 | 핵심 |
|---|---|
| Updatable result set | query result tuple 수정이 base relation update로 이어질 수 있음 |
| `setAutoCommit(false)` | statement별 automatic commit을 끄고 explicit transaction 사용 |
| `commit()` / `rollback()` | transaction commit/rollback 수행 |
| `getBlob()` / `getClob()` | large object 전체가 아니라 locator를 받아 조각 단위로 접근 |
| `setBlob()` / `setClob()` | stream을 통해 BLOB/CLOB column에 큰 data 저장 |
| Row set | result set을 모아 다른 application으로 전달하거나 양방향 scan/modify |

Chapter 4에서 본 transaction 개념은 application API에서도 직접 나타난다. JDBC에서는 기본적으로 각 SQL statement가 auto-commit될 수 있으므로, 여러 statement를 하나의 atomic unit으로 묶으려면 `conn.setAutoCommit(false)` 후 `conn.commit()` 또는 `conn.rollback()`을 명시해야 한다.

#### 5.1.2 Database Access from Python

Python에서도 database driver를 통해 SQL에 접근한다. Figure 5.4는 `psycopg2` driver로 PostgreSQL에 연결하고, parameterized insert를 실행한 뒤, aggregate query 결과를 loop로 읽는 예다.

![Figure 5.4](@/assets/images/cs-database-058-figure-5-4-page-223.png)
*Figure 5.4 · PDF p. 223 · Python Database API로 connection, cursor, parameterized query, commit/rollback을 수행하는 예*

Python Database API에서도 prepared statement와 같은 parameter binding을 사용한다. 예시에서는 SQL 안의 parameter marker로 `%s`를 쓰고, parameter values를 tuple/list로 전달한다. Update는 자동 commit되지 않으므로 `commit()`으로 확정하고, exception이 발생하면 `rollback()`으로 되돌린다.

Driver는 database-specific인 경우가 많다. PostgreSQL은 `psycopg2`, MySQL은 `MySQLdb`, Oracle은 `cx_Oracle`, ODBC 지원 DBMS는 `pyodbc`를 사용할 수 있다. Python Database API는 공통 형태를 제공하지만 driver마다 `connect()` parameter 등 세부 차이가 있을 수 있다.

#### 5.1.3 ODBC

`ODBC(Open Database Connectivity)`는 application이 database server에 접속하고 query/update를 보내며 result를 가져오는 API이다. JDBC가 Java 중심이라면, ODBC는 원래 C language 중심으로 출발했다. GUI tool, statistics package, spreadsheet 같은 application도 ODBC를 통해 다양한 DBMS에 연결할 수 있다.

Figure 5.5는 C code에서 ODBC를 사용하는 흐름을 보여 준다.

![Figure 5.5](@/assets/images/cs-database-059-figure-5-5-page-224.png)
*Figure 5.5 · PDF p. 224 · ODBC에서 environment/connection/statement handle과 fetch loop를 사용하는 예*

ODBC의 기본 흐름은 JDBC와 비슷하지만 C-style handle과 binding이 두드러진다.

| 단계 | ODBC 개념 |
|---|---|
| environment 준비 | `SQLAllocEnv` |
| connection handle 생성 | `SQLAllocConnect` |
| server 연결 | `SQLConnect` |
| statement 실행 | `SQLExecDirect` |
| result column binding | `SQLBindCol` |
| tuple fetch | `SQLFetch` |
| resource 해제 | `SQLFreeStmt`, `SQLDisconnect`, `SQLFreeConnect`, `SQLFreeEnv` |

`SQLBindCol`은 query result의 attribute 위치와 C variable을 연결한다. 이후 `SQLFetch`가 한 tuple을 가져올 때 attribute 값이 지정된 C variable에 저장된다. Variable-length type에서는 실제 길이를 저장할 위치도 함께 넘기며, 길이 field가 negative이면 `null`을 뜻한다.

ODBC도 parameterized statement, catalog metadata 조회, automatic commit control을 제공한다. `SQLSetConnectOption(conn, SQL_AUTOCOMMIT, 0)`으로 automatic commit을 끄고, `SQLTransact(conn, SQL_COMMIT)` 또는 `SQLTransact(conn, SQL_ROLLBACK)`으로 transaction을 끝낼 수 있다. SQL 표준의 `CLI(Call Level Interface)`는 ODBC와 유사한 interface이다.

#### 5.1.4 Embedded SQL

`embedded SQL`은 host language code 안에 SQL statement를 직접 넣고, preprocessor가 이를 host-language declaration과 procedure call로 변환하는 방식이다. Embedded SQL statement는 보통 다음 형태로 표시된다.

```sql
EXEC SQL <embedded SQL statement>;
```

Host language variable을 embedded SQL 안에서 사용할 때는 SQL variable과 구분하기 위해 앞에 colon `:`을 붙인다. Query result를 여러 row에 걸쳐 처리하려면 `cursor`를 선언하고, cursor를 open한 뒤 host-language loop 안에서 `fetch`를 반복한다. Fetch된 row의 attribute 값은 host-language variable로 들어간다.

Embedded SQL의 장점은 SQL statement가 코드 안에서 직접 보이고, preprocessing 시점에 일부 SQL/type error를 잡을 수 있다는 점이다. 단점은 preprocessor가 생성한 host-language code 때문에 debugging이 복잡해지고, SQL을 식별하기 위한 construct가 host language의 미래 문법과 충돌할 수 있다는 점이다.

Note 5.1의 `embedded database`는 embedded SQL과 다르다. Embedded database는 server를 따로 두지 않고 application 내부에 database engine을 포함하는 방식이다. SQLite, Java DB, HSQLDB 같은 system이 예시다. 대규모 transaction processing이나 매우 큰 database에는 한계가 있지만, application 내부 data 관리에는 database abstraction을 간단히 제공한다.

### 5.2 Functions and Procedures

SQL에는 built-in function이 많지만, application마다 필요한 domain-specific computation이 있다. 예를 들어 map database의 line segment overlap 검사, image similarity 비교, university business rule 검사는 일반 SQL expression만으로 깔끔하게 표현하기 어렵거나 여러 application에서 반복된다.

`function`과 `procedure`는 이런 logic을 database 안에 저장하고 SQL statement나 application code에서 호출하게 해 준다. Stored procedure/function의 중요한 이점은 business logic을 한 곳에 두고 여러 application이 공유할 수 있다는 점이다. Rule이 바뀌면 application 각각을 고치는 대신 database routine 하나를 수정하면 된다.

다만 실제 DBMS의 procedure/function syntax는 표준과 많이 다르다. Oracle의 PL/SQL, SQL Server의 Transact-SQL, PostgreSQL의 PL/pgSQL은 개념은 비슷하지만 문법과 세부 의미가 다르므로, 최종본에서는 표준 syntax보다 개념을 중심으로 본다.

#### 5.2.1 Declaring and Invoking SQL Functions and Procedures

SQL function은 input parameter를 받아 값을 반환한다. Figure 5.6의 `dept_count`는 department name을 받아 해당 department의 instructor 수를 반환한다.

![Figure 5.6](@/assets/images/cs-database-060-figure-5-6-page-228.png)
*Figure 5.6 · PDF p. 228 · SQL로 정의한 `dept_count` function 예시*

이 function은 query 안에서 scalar expression처럼 사용할 수 있다.

```sql
select dept_name, budget
from department
where dept_count(dept_name) > 12;
```

User-defined function을 query의 많은 tuple에 대해 호출하면 성능 문제가 생길 수 있다. 특히 function body가 다시 query를 실행하거나 복잡한 computation을 수행하면 tuple마다 반복 호출되어 expensive해질 수 있다. 따라서 “표현이 깔끔하다”와 “optimizer가 효율적으로 처리할 수 있다”는 별개의 문제로 봐야 한다.

SQL 표준은 table을 반환하는 `table function`도 지원한다. Figure 5.7의 function은 department name을 parameter로 받아 그 department의 instructor tuples를 table로 반환한다.

![Figure 5.7](@/assets/images/cs-database-061-figure-5-7-page-229.png)
*Figure 5.7 · PDF p. 229 · parameterized view처럼 동작하는 SQL table function*

Table function은 `from` clause에서 `table(...)` 형태로 사용할 수 있다.

```sql
select *
from table(instructor_of('Finance'));
```

간단한 경우에는 일반 `select`로도 충분하지만, table-valued function은 parameterized view라고 생각하면 된다. View는 보통 parameter를 받지 않지만, table function은 parameter에 따라 반환 relation이 달라진다.

Procedure는 function처럼 호출되지만, return value보다 `in`/`out` parameter와 side effect에 초점이 있다.

```sql
create procedure dept_count_proc(in dept_name varchar(20),
                                 out d_count integer)
begin
   select count(*) into d_count
   from instructor
   where instructor.dept_name = dept_count_proc.dept_name;
end
```

`in` parameter는 호출자가 값을 제공하고, `out` parameter는 procedure가 값을 설정해 호출자에게 돌려준다. Procedure는 `call` statement로 호출한다.

```sql
declare d_count integer;
call dept_count_proc('Physics', d_count);
```

SQL은 procedure/function overloading도 허용한다. Procedure는 같은 이름이라도 argument 수가 다르면 구분될 수 있고, function은 argument 수 또는 같은 수의 argument라면 일부 argument type이 다르면 구분될 수 있다.

#### 5.2.2 Language Constructs for Procedures and Functions

SQL 표준의 절차적 확장 부분을 `PSM(Persistent Storage Module)`이라고 한다. PSM은 SQL에 변수, assignment, compound statement, loop, condition, exception handling을 추가해 거의 general-purpose language에 가까운 절차적 로직을 작성하게 한다.

| Construct | 역할 |
|---|---|
| `declare` | local variable 선언 |
| `set` | variable assignment |
| `begin ... end` | 여러 SQL statement를 묶는 compound statement |
| `begin atomic ... end` | block 내부 statement를 하나의 transaction처럼 실행 |
| `while ... do ... end while` | 조건 기반 반복 |
| `repeat ... until ... end repeat` | 후조건 반복 |
| `for r as <query> do ... end for` | query result row를 한 번에 하나씩 loop variable로 fetch |
| `if ... then ... elseif ... else ... end if` | conditional execution |
| `case` statement | 여러 case branch 중 선택 |
| `leave`, `iterate` | loop 탈출 또는 다음 반복으로 이동 |

Figure 5.8은 course section 등록 procedure/function 예시이다. 핵심 흐름은 현재 수강 인원(`currEnrol`)과 classroom capacity(`limit`)를 비교하고, 여유가 있으면 `takes`에 insert하며, 초과하면 error message와 음수 error code를 반환하는 것이다.

![Figure 5.8](@/assets/images/cs-database-062-figure-5-8-page-232.png)
*Figure 5.8 · PDF p. 232 · section capacity를 검사한 뒤 student를 등록하는 절차적 SQL 예시*

이 예시는 SQL procedure/function이 단순 계산을 넘어 business rule enforcement를 담당할 수 있음을 보여 준다. 다만 이런 logic이 application code와 database routine 중 어디에 있어야 하는지는 유지보수, 성능, 배포, 권한 정책을 함께 고려해야 한다.

PSM은 exception condition과 handler도 지원한다.

```sql
declare out_of_classroom_seats condition;
declare exit handler for out_of_classroom_seats
begin
   -- handler statements
end;
```

Procedure body는 `signal out_of_classroom_seats`로 condition을 raise할 수 있다. Handler action은 enclosing block을 빠져나가는 `exit` 또는 다음 statement로 계속 진행하는 `continue`가 될 수 있다. 또한 `sqlexception`, `sqlwarning`, `not found` 같은 predefined condition도 있다.

#### 5.2.3 External Language Routines

SQL procedural extension은 system마다 문법 차이가 크다. 이를 피하거나 SQL로 표현하기 어려운 computation을 수행하기 위해, Java, C#, C, C++ 같은 외부 programming language로 function/procedure를 작성하고 SQL에서 호출하게 할 수 있다.

개념적 syntax는 다음과 같다.

```sql
create procedure dept_count_proc(in dept_name varchar(20),
                                 out count integer)
language C
external name '/usr/avi/bin/dept_count_proc';

create function dept_count(dept_name varchar(20))
returns integer
language C
external name '/usr/avi/bin/dept_count';
```

External routine은 SQL과 host language 사이의 경계를 다뤄야 하므로 `null` parameter, return value, success/failure status, exception을 어떻게 전달할지 정해야 한다. DBMS에 따라 `sqlstate`, return-value holder, indicator variable, pointer passing 같은 mechanism이 쓰인다.

External language routine의 장단점은 분명하다.

| 장점 | 위험/비용 |
|---|---|
| SQL보다 빠르거나 표현력이 높은 computation 가능 | DBMS 내부 구조를 corrupt할 수 있음 |
| 기존 Java/C/C++ library 활용 가능 | access-control bypass 위험 |
| DBMS 안에서 function처럼 호출 가능 | process isolation 시 interprocess communication overhead |
| safe language sandbox 사용 가능 | C처럼 pointer를 자유롭게 쓰는 언어는 sandbox가 어려움 |

C/C++처럼 memory access가 자유로운 code를 DBMS process 안에서 실행하면 bug가 DBMS memory를 망가뜨릴 수 있다. 보안이 중요한 system은 external code를 별도 process에서 실행하고 parameter/result를 interprocess communication으로 주고받을 수 있지만, 이 방식은 비용이 크다.

Java나 C#처럼 safe language는 sandbox 안에서 실행할 수 있다. Sandbox는 routine이 자기 memory만 접근하고 query execution process memory나 file system을 함부로 건드리지 못하게 한다. 이렇게 하면 별도 process 통신 overhead를 줄이면서도 어느 정도 safety를 얻을 수 있다.

### 5.3 Triggers

`trigger`는 database modification의 side effect로 DBMS가 자동 실행하는 statement이다. Trigger를 정의하려면 세 가지를 지정해야 한다.

| 구성 | 의미 |
|---|---|
| event | trigger 검사를 시작하게 하는 사건, 예: `insert`, `delete`, `update` |
| condition | trigger action을 실제 실행할지 결정하는 predicate |
| action | condition이 만족될 때 수행할 SQL/procedural statement |

Trigger가 database에 등록되면, 이후부터 DBMS가 해당 event가 발생할 때 condition을 확인하고 action을 실행한다. Application code가 trigger를 직접 호출하는 것이 아니다.

#### 5.3.1 Need for Triggers

Trigger는 SQL constraint mechanism만으로 표현하기 어려운 integrity constraint를 구현하거나, 어떤 조건이 만족될 때 자동 작업을 시작하는 데 쓰인다. 예를 들어 `takes`에 성공적으로 이수한 course가 기록될 때 `student.tot_cred`를 자동 갱신하거나, warehouse inventory가 minimum level 아래로 내려가면 `orders` relation에 reorder tuple을 추가할 수 있다.

다만 trigger는 보통 database 바깥 세계의 action을 직접 수행하지 않는다. 예를 들어 실제 외부 주문을 보내기보다, `orders` relation에 주문 요청 tuple을 넣고 별도의 long-running process가 그 relation을 주기적으로 scan해 외부 주문을 처리하는 식으로 설계한다. 이렇게 하면 database transaction과 외부 side effect의 경계를 더 명확히 관리할 수 있다.

#### 5.3.2 Triggers in SQL

Figure 5.9는 trigger로 `section.time_slot_id`의 referential integrity를 유지하는 예이다. 첫 trigger는 `section`에 row가 insert된 뒤, 새 row의 `time_slot_id`가 `time_slot` relation에 없으면 transaction을 rollback한다. 두 번째 trigger는 `time_slot`에서 row가 delete된 뒤, 삭제된 `time_slot_id`가 여전히 `section`에서 참조되고 있으면 rollback한다.

![Figure 5.9](@/assets/images/cs-database-063-figure-5-9-page-236.png)
*Figure 5.9 · PDF p. 236 · trigger로 referential integrity를 유지하는 예*

Trigger syntax에서 중요한 요소는 다음과 같다.

| Syntax 요소 | 의미 |
|---|---|
| `after insert on section` | `section` insert 이후 trigger check |
| `referencing new row as nrow` | inserted row를 `nrow` transition variable로 참조 |
| `referencing old row as orow` | deleted/updated 이전 row를 `orow` transition variable로 참조 |
| `for each row` | multi-row statement가 영향을 준 각 row마다 trigger 실행 |
| `when (...)` | action 실행 조건 |
| `begin atomic ... end` | trigger action의 compound statement |

Update trigger는 특정 attribute가 update될 때만 실행되도록 지정할 수 있다. 예를 들어 `takes.grade`가 update될 때만 trigger를 실행하려면 `after update of grade on takes` 같은 식으로 쓴다.

Figure 5.10은 `takes.grade`가 `null` 또는 `'F'`에서 성공 이수 grade로 바뀔 때 `student.tot_cred`를 증가시키는 trigger이다. `new row`는 새 grade를, `old row`는 이전 grade를 확인하는 데 쓰인다.

![Figure 5.10](@/assets/images/cs-database-064-figure-5-10-page-238.png)
*Figure 5.10 · PDF p. 238 · `grade` update에 따라 `tot_cred`를 유지하는 trigger*

이 예시는 단순화된 형태다. 현실적으로는 성공 grade가 다시 failing grade로 correction되는 경우, 이미 성공 grade로 insert되는 경우까지 처리해야 한다. Trigger는 작은 누락이 data inconsistency로 이어지기 쉽다.

Trigger는 `after`뿐 아니라 `before` event에도 실행될 수 있다. `before trigger`는 invalid action을 reject하거나, action이 constraint violation을 일으키기 전에 값을 보정하는 데 쓸 수 있다. Figure 5.11은 blank grade를 `null`로 바꾸는 예이다.

![Figure 5.11](@/assets/images/cs-database-065-figure-5-11-page-238.png)
*Figure 5.11 · PDF p. 238 · `before` trigger에서 inserted/updated 값을 `set`으로 보정하는 예*

Trigger는 row-level로 실행할 수도 있고 statement-level로 실행할 수도 있다.

| Trigger granularity | 설명 |
|---|---|
| `for each row` | affected row마다 action 실행 |
| `for each statement` | 하나의 SQL statement 전체에 대해 action 한 번 실행 |

Statement-level trigger에서는 `referencing old table as ...`, `referencing new table as ...`로 affected rows 전체를 담은 transition table을 참조할 수 있다. Transition table은 `after trigger`에서 사용할 수 있으며, 여러 row를 한 번의 SQL statement로 처리할 때 유용하다.

Figure 5.12는 inventory level이 minimum level 위에서 아래로 떨어지는 순간에만 reorder를 생성하는 trigger이다. 핵심은 새 값만 검사하지 않고 old value와 new value를 함께 본다는 점이다. 이미 minimum 아래에 있던 item에 대해 update가 반복될 때마다 중복 주문을 내지 않기 위해서다.

![Figure 5.12](@/assets/images/cs-database-066-figure-5-12-page-240.png)
*Figure 5.12 · PDF p. 240 · inventory level crossing을 감지해 reorder tuple을 추가하는 trigger*

Trigger는 기본적으로 생성 시 enabled 상태이며, 필요하면 disable/enable하거나 drop할 수 있다.

```sql
alter trigger trigger_name disable;
drop trigger trigger_name;
```

실제 DBMS들은 trigger syntax가 많이 다르다. Oracle은 transition variable 앞에 `:`를 요구하고, SQL Server는 `inserted`/`deleted` pseudo-table을 사용하며, PostgreSQL은 trigger body 대신 procedure를 호출해 `new`/`old` row를 접근한다. 이 장에서는 표준 syntax보다 event-condition-action model을 이해하는 것이 중요하다.

#### 5.3.3 When Not to Use Triggers

Trigger는 강력하지만 남용하면 database behavior가 숨겨지고 추론하기 어려워진다. Foreign key의 `on delete cascade`처럼 DBMS가 명시적으로 제공하는 기능이 있으면 trigger로 재구현하지 않는 편이 좋다. Trigger로 구현하면 더 많은 code가 필요하고, 사용자가 database constraint를 이해하기도 어렵다.

Materialized view maintenance도 trigger로 구현할 수 있지만, DBMS가 materialized view를 자동 maintenance하는 기능을 제공한다면 그 기능을 쓰는 편이 낫다. 예를 들어 section별 등록 student 수를 유지하는 `section_registration` relation을 trigger로 갱신할 수는 있지만, insert/delete/update 각각에 대해 누락 없이 trigger를 작성해야 한다.

Replication도 과거에는 trigger로 change/delta relation을 유지해 구현했지만, 현대 DBMS는 built-in replication facility를 제공하는 경우가 많다. Backup copy load나 replica replay 중 trigger가 다시 실행되면 이미 수행된 side effect가 중복될 수 있다. 그래서 trigger를 disable하거나, `not for replication` 같은 system-specific 옵션을 쓰거나, trigger body가 replica replay 여부를 확인해야 할 수 있다.

Trigger를 조심해야 하는 가장 큰 이유는 unintended execution이다.

| 위험 | 설명 |
|---|---|
| runtime trigger error | trigger error가 trigger를 유발한 원래 statement 실패로 이어짐 |
| trigger chain | 한 trigger action이 다른 trigger를 유발할 수 있음 |
| infinite triggering | insert trigger가 같은 relation에 insert하면 무한 chain 가능 |
| hidden side effect | application query/update만 봐서는 실제 변경을 알기 어려움 |

일부 DBMS는 trigger chain 길이를 제한하거나, trigger가 자신을 유발한 relation을 다시 참조/수정하려 하면 error로 처리한다. Trigger는 유용하지만 대안이 있으면 stored procedure, declarative constraint, materialized view, replication facility 같은 더 명시적인 mechanism을 우선 고려하는 것이 좋다.

### 5.4 Recursive Queries

`recursive query`는 결과 relation을 자기 자신을 참조해 정의하는 query이다. 대표적인 용도는 transitive closure 계산이다. 예를 들어 `prereq(course_id, prereq_id)` relation에서 어떤 course의 direct prerequisite뿐 아니라 indirect prerequisite까지 모두 찾고 싶을 때 recursion이 필요하다.

Figure 5.13의 `prereq` relation을 보면 `CS-347`의 direct prerequisite은 `CS-319`이고, `CS-319`의 prerequisites는 `CS-101`, `CS-315`이다. 또 `CS-315`의 prerequisite은 `CS-190`, `CS-190`의 prerequisite은 `CS-101`이다. 따라서 `CS-347`의 전체 prerequisites는 direct/indirect를 합쳐 `CS-319`, `CS-315`, `CS-101`, `CS-190`이다.

![Figure 5.13](@/assets/images/cs-database-067-figure-5-13-page-242.png)
*Figure 5.13 · PDF p. 242 · recursive query 설명에 사용되는 `prereq` relation instance*

`transitive closure`는 relation `prereq`에 대해 `(cid, pre)` 쌍을 모두 포함하는 relation이다. 여기서 `pre`는 `cid`의 direct prerequisite이거나, prerequisite의 prerequisite처럼 여러 단계 떨어진 indirect prerequisite이다. 조직 계층, 부품-subpart 구조, flight reachability 같은 계층/그래프 문제도 같은 패턴을 갖는다.

#### 5.4.1 Transitive Closure Using Iteration

Recursive query 없이도 iteration으로 transitive closure를 계산할 수 있다. 아이디어는 frontier를 점점 확장하는 것이다.

| Temporary table | 역할 |
|---|---|
| `c_prereq` | 지금까지 찾은 전체 prerequisite 집합 |
| `new_c_prereq` | 직전 iteration에서 새로 발견한 prerequisite 집합 |
| `temp` | 다음 iteration 후보를 잠시 저장 |

Figure 5.14의 `findAllPrereqs(cid)` function은 먼저 `cid`의 direct prerequisite을 `new_c_prereq`에 넣는다. 그 뒤 반복적으로 `new_c_prereq`를 `c_prereq`에 추가하고, 방금 추가된 course들의 prerequisites를 찾아 아직 발견되지 않은 것만 `temp`에 넣는다. 그런 다음 `new_c_prereq`를 `temp`로 교체한다. 더 이상 새 prerequisite이 없으면 반복을 끝낸다.

![Figure 5.14](@/assets/images/cs-database-068-figure-5-14-page-244.png)
*Figure 5.14 · PDF p. 244 · iterative temporary table 방식으로 모든 prerequisite을 찾는 function*

Figure 5.15는 `CS-347`에 대해 iteration이 어떻게 진행되는지 보여 준다. 처음에는 `CS-319`만 찾고, 다음 iteration에서 `CS-315`, `CS-101`을 추가하며, 그 다음 `CS-190`을 추가한다. 이후 새 tuple이 없으므로 fixed point에 도달한다.

![Figure 5.15](@/assets/images/cs-database-069-figure-5-15-page-245.png)
*Figure 5.15 · PDF p. 245 · `CS-347` prerequisites가 iteration마다 확장되는 모습*

이 iterative function에서 `except`가 중요한 이유는 cycle을 막기 위해서다. `a → b`, `b → c`, `c → a` 같은 cycle이 있으면 이미 발견한 node를 다시 frontier에 넣지 않아야 종료된다. Course prerequisite에서는 cycle이 비현실적이지만, flight reachability나 graph reachability에서는 cycle이 흔하다.

Iteration 흐름은 다음처럼 요약할 수 있다.

```text
new_c_prereq = direct prerequisites(cid)
c_prereq = empty

repeat
  c_prereq += new_c_prereq
  temp = prerequisites(new_c_prereq) - c_prereq
  new_c_prereq = temp
until new_c_prereq is empty
```

#### 5.4.2 Recursion in SQL

Iteration으로 transitive closure를 작성하는 것은 가능하지만 번거롭다. SQL 표준은 `with recursive`로 recursive temporary view를 정의하는 방식을 제공한다.

Figure 5.16은 모든 `(course_id, prereq_id)` direct/indirect prerequisite pair를 찾는 recursive query이다.

![Figure 5.16](@/assets/images/cs-database-070-figure-5-16-page-246.png)
*Figure 5.16 · PDF p. 246 · `with recursive`로 prerequisite transitive closure를 표현한 SQL query*

Recursive view는 반드시 두 부분의 union으로 정의된다.

| 부분 | 역할 |
|---|---|
| base query | recursion 없이 초기 tuple을 만든다. 예: direct prerequisite |
| recursive query | 현재 recursive view 내용을 이용해 다음 단계 tuple을 만든다 |

Prerequisite 예시에서는 base query가 `prereq`의 direct edges를 넣고, recursive query가 `rec_prereq.prereq_id = prereq.course_id`로 join해 한 단계 더 먼 prerequisite을 추가한다.

Recursive view의 의미는 fixed point로 이해한다.

```text
1. recursive view를 empty로 시작한다.
2. base query 결과를 view에 추가한다.
3. 현재 view를 사용해 recursive query를 계산한다.
4. 새 tuple을 view에 추가한다.
5. 더 이상 새 tuple이 없을 때까지 3-4를 반복한다.
```

더 이상 view relation이 변하지 않는 상태를 `fixed point`라고 한다. Recursive query 결과는 이 fixed-point instance이다.

특정 course, 예를 들어 `CS-347`의 prerequisites만 원하면 outer query에 `where rec_prereq.course_id = 'CS-347'`를 붙일 수 있다. DBMS가 반드시 모든 course의 transitive closure를 완전히 계산한 뒤 filtering해야 하는 것은 아니다. Optimizer는 `findAllPrereqs` 같은 더 효율적인 strategy를 사용할 수 있다.

SQL recursive query에는 monotonicity restriction이 있다. Recursive query는 recursive view에 tuple이 더 많아질수록 결과가 줄어들면 안 된다. 즉 view instance `V1`이 `V2`의 superset이면 recursive query 결과도 적어도 줄어들지 않아야 한다. 이 조건이 있어야 iterative fixed-point 의미가 안정적으로 정의된다.

따라서 recursive part에서는 다음 construct들이 제한된다.

| 제한 construct | 이유 |
|---|---|
| recursive view에 대한 aggregation | tuple 추가가 aggregate result를 비단조적으로 바꿀 수 있음 |
| recursive view를 사용하는 `not exists` | view에 tuple이 추가되면 결과가 사라질 수 있음 |
| recursive view가 오른쪽에 오는 `except` | view에 tuple이 추가되면 set difference 결과가 줄어듦 |

예를 들어 `r except v`에서 recursive view `v`에 tuple이 추가되면 결과는 작아질 수 있다. 이는 nonmonotonic하므로 recursive view의 fixed-point 의미를 어렵게 만든다.

SQL은 `create recursive view`로 permanent recursive view도 만들 수 있다. 일부 system은 다른 syntax를 사용하며, Oracle의 legacy `start with / connect by prior` hierarchical query syntax가 대표적이다. 실제 system별 문법은 다르지만, 핵심은 “base case + recursive step + fixed point”이다.

### 5.5 Advanced Aggregation Features

Chapter 3의 `group by`와 aggregate function만으로도 많은 aggregation task를 처리할 수 있다. 그러나 ranking, moving average, cross-tab, 여러 grouping level의 subtotal처럼 분석 query에서 자주 나오는 작업은 basic aggregation만으로 표현하기 어렵거나 비효율적이다. SQL은 이를 위해 ranking, windowing, pivot, rollup/cube 같은 advanced aggregation feature를 제공한다.

#### 5.5.1 Ranking

`ranking`은 tuple이 어떤 ordering 안에서 몇 번째 위치에 있는지 계산한다. 예를 들어 `student_grades(ID, GPA)` view가 있을 때 GPA 기준으로 학생 순위를 매길 수 있다.

```sql
select ID, rank() over (order by GPA desc) as s_rank
from student_grades;
```

`rank() over (...)`의 `over` clause는 ranking을 계산할 ordering/partition을 지정한다. 위 query는 GPA가 높은 학생에게 rank 1을 준다. 단, output tuple의 표시 순서는 별도 `order by`가 없으면 보장되지 않으므로, rank 순으로 보고 싶으면 outer `order by s_rank`가 필요하다.

`rank()`는 ties를 같은 rank로 처리하고 gap을 남긴다. 예를 들어 GPA 최고점 학생이 2명이면 둘 다 rank 1이고, 다음 학생은 rank 3이다. `dense_rank()`는 gap을 남기지 않아 다음 학생을 rank 2로 둔다.

| Function | ties 처리 | 예 |
|---|---|---|
| `rank()` | 같은 값은 같은 rank, 다음 rank에 gap 있음 | 1, 1, 3, 4 |
| `dense_rank()` | 같은 값은 같은 rank, gap 없음 | 1, 1, 2, 3 |
| `percent_rank()` | `(rank - 1) / (n - 1)` | partition 내 상대 위치 |
| `cume_dist()` | 현재 값 이하/이전 ordering 값까지의 cumulative fraction | 누적 분포 |
| `row_number()` | sort order의 고유 번호 | ties도 서로 다른 번호, tie order는 nondeterministic 가능 |
| `ntile(n)` | ordered tuples를 n개 bucket으로 나눔 | quartile, percentile histogram |

`null` 값은 기본적으로 ranking에서 highest values로 취급될 수 있다. GPA가 `null`인 학생이 highest로 나오는 것은 보통 의도와 다르므로, `nulls last` 같은 clause로 위치를 지정해야 한다.

```sql
select ID, rank() over (order by GPA desc nulls last) as s_rank
from student_grades;
```

Ranking은 partition별로도 계산할 수 있다. Department별 학생 GPA rank를 구하려면 `partition by dept_name`을 사용한다.

```sql
select ID, dept_name,
       rank() over (partition by dept_name order by GPA desc) as dept_rank
from dept_grades
order by dept_name, dept_rank;
```

`group by`와 ranking이 함께 쓰이면 `group by`가 먼저 적용되고, 그 group result 위에서 partition/ranking이 수행된다. 따라서 aggregate value를 기준으로 rank를 매기는 것도 가능하다.

Top-n query는 ranking query를 nested query로 감싸 rank가 일정 이하인 tuple만 고르면 된다.

```sql
select *
from (select ID, rank() over (order by GPA desc) as s_rank
      from student_grades)
where s_rank <= 5;
```

이 방식은 ties를 보존한다. 5등에 동점자가 있으면 결과 tuple 수가 5보다 많을 수 있다. 반면 `limit 5`, `fetch first 5 rows only`, `select top 5` 같은 DBMS별 top-n syntax는 정확히 5 tuple을 반환하며, 마지막 position의 ties는 임의로 잘릴 수 있다. 또한 partition별 top-n은 보통 ranking을 사용해야 자연스럽다.

Basic SQL로 rank를 흉내 내려면 “나보다 GPA가 높은 학생 수 + 1”을 세는 correlated subquery를 쓸 수 있다. 그러나 각 tuple마다 relation을 다시 scan하므로 전체적으로 quadratic time이 될 수 있다. DBMS의 ranking implementation은 sort 기반으로 훨씬 효율적으로 계산할 수 있다.

#### 5.5.2 Windowing

`windowing`은 각 tuple 주변의 일정 range 또는 row set에 대해 aggregate를 계산한다. `group by`는 tuple을 서로 겹치지 않는 group으로 나누지만, window는 tuple마다 다른, 때로는 overlapping되는 window를 만들 수 있다. Moving average나 trend analysis가 대표적이다.

예를 들어 `tot_credits(year, num_credits)` view가 있고, year별 총 수강 credit의 3년 moving average를 구하려면 다음처럼 쓴다.

```sql
select year,
       avg(num_credits) over (order by year rows 3 preceding) as avg_total_credits
from tot_credits;
```

`rows 3 preceding`은 current row와 그 앞의 최대 3 tuple을 window로 삼는다. 첫 year처럼 앞 tuple이 부족하면 존재하는 tuple만 사용한다.

전체 prior years를 모두 보고 싶으면 `unbounded preceding`을 사용한다.

```sql
select year,
       avg(num_credits) over (order by year rows unbounded preceding)
       as avg_total_credits
from tot_credits;
```

Window는 앞뒤 범위를 함께 지정할 수도 있다.

```sql
select year,
       avg(num_credits) over
         (order by year rows between 3 preceding and 2 following)
       as avg_total_credits
from tot_credits;
```

Department별로 독립적인 moving average를 구하려면 `partition by`를 함께 사용한다.

```sql
select dept_name, year,
       avg(num_credits) over
         (partition by dept_name
          order by year rows between 3 preceding and current row)
       as avg_total_credits
from tot_credits_dept;
```

`rows`는 tuple 개수 기준 window이고, `range`는 ordering value 기준 window이다. 예를 들어 `rows current row`는 정확히 current tuple 하나지만, `range current row`는 sort attribute 값이 current tuple과 같은 모든 tuple을 포함할 수 있다. 다만 `range` 지원은 DBMS마다 제한이 있다.

#### 5.5.3 Pivoting

`pivoting`은 relation의 어떤 attribute value들을 result의 attribute names로 바꾸는 cross-tabulation이다. Figure 5.17의 `sales(item_name, color, clothes_size, quantity)` relation은 item, color, size 조합별 판매량을 long format으로 저장한다.

![Figure 5.17](@/assets/images/cs-database-071-figure-5-17-page-254.png)
*Figure 5.17 · PDF p. 254 · pivot 예시에 사용되는 `sales` relation*

Figure 5.18은 `color` 값인 `dark`, `pastel`, `white`가 column name으로 바뀐 pivot-table이다. 이처럼 attribute value를 column으로 세우는 결과를 `cross-tab`, `cross-tabulation`, `pivot-table`이라고 부른다.

![Figure 5.18](@/assets/images/cs-database-072-figure-5-18-page-255.png)
*Figure 5.18 · PDF p. 255 · `color` 값을 column으로 바꾼 pivot 결과*

SQL implementation 중 일부는 `pivot` clause를 지원한다.

```sql
select *
from sales
pivot (
  sum(quantity)
  for color in ('dark', 'pastel', 'white')
);
```

`pivot` clause는 세 가지를 지정한다.

| 요소 | 예 | 의미 |
|---|---|---|
| pivot attribute | `color` | value가 column name이 될 attribute |
| pivot values | `'dark'`, `'pastel'`, `'white'` | 결과 column으로 만들 value 목록 |
| aggregate | `sum(quantity)` | 여러 tuple이 같은 cell에 들어올 때 결합 방법 |

Pivot은 basic SQL의 `case`와 aggregate를 조합해 표현할 수도 있지만, 전용 construct가 query를 훨씬 짧고 읽기 쉽게 만든다. 다만 `pivot` syntax는 DBMS별 차이가 크다.

#### 5.5.4 Rollup and Cube

`rollup`과 `cube`는 여러 `group by` query를 한 번에 실행해 subtotal과 grand total을 함께 얻는 기능이다. Data analyst는 보통 `(item_name, color)`, `(item_name)`, 전체 total처럼 여러 aggregation level을 동시에 보고 싶어 한다.

```sql
select item_name, color, sum(quantity)
from sales
group by rollup(item_name, color);
```

`group by rollup(item_name, color)`는 다음 grouping을 생성한다.

```text
(item_name, color)
(item_name)
()
```

여기서 `()`는 empty grouping, 즉 grand total이다. Figure 5.19는 rollup 결과를 보여 준다. `(item_name)` level subtotal에서는 `color`가 `null`로 채워지고, grand total에서는 `item_name`과 `color`가 모두 `null`로 채워진다.

![Figure 5.19](@/assets/images/cs-database-073-figure-5-19-page-258.png)
*Figure 5.19 · PDF p. 258 · `group by rollup(item_name, color)` 결과*

`cube`는 listed attributes의 모든 subset grouping을 생성한다.

```sql
select item_name, color, clothes_size, sum(quantity)
from sales
group by cube(item_name, color, clothes_size);
```

이는 다음 grouping들을 만든다.

```text
(item_name, color, clothes_size)
(item_name, color)
(item_name, clothes_size)
(color, clothes_size)
(item_name)
(color)
(clothes_size)
()
```

`rollup`은 attribute list의 prefix grouping을 만든다. `cube`는 모든 subset grouping을 만든다. 여러 rollup/cube를 하나의 `group by`에 함께 쓰면 각 grouping set의 Cartesian product처럼 grouping 조합이 만들어진다.

`rollup`과 `cube`가 생성하는 grouping을 더 세밀하게 제어하려면 `grouping sets`를 사용한다.

```sql
select item_name, color, clothes_size, sum(quantity)
from sales
group by grouping sets ((color, clothes_size),
                        (clothes_size, item_name));
```

Rollup/cube 결과에서 생긴 `null`은 실제 stored `null`과 의미가 다르다. Rollup이 만든 `null`은 “이 dimension은 aggregate level에서 생략되었다”는 뜻이다. 이를 구분하려면 `grouping()` function을 사용한다.

```sql
select (case when grouping(item_name) = 1 then 'all'
             else item_name end) as item_name,
       (case when grouping(color) = 1 then 'all'
             else color end) as color,
       sum(quantity) as quantity
from sales
group by rollup(item_name, color);
```

`coalesce(item_name, 'all')`로 대체하면 실제 database에 저장된 normal `null`까지 `all`로 바꿔 버리므로 틀릴 수 있다. Rollup/cube가 만든 null을 처리할 때는 `grouping()`을 써야 한다.

### 5.6 Summary

Chapter 5는 SQL이 application과 만나는 경계와 분석 기능을 다룬다. Host language에서는 JDBC, ODBC, Python Database API, embedded SQL을 통해 database에 연결하고 statement를 실행하며 result를 fetch한다. Database 내부에서는 stored function/procedure, trigger, external language routine이 business logic과 automatic action을 담당할 수 있다.

Recursive query는 transitive closure 같은 graph/hierarchy 문제를 SQL 안에서 표현하게 해 준다. Advanced aggregation은 ranking, windowing, pivot, rollup/cube를 통해 분석 query를 간결하고 효율적으로 표현한다.

이 장의 공통 trade-off는 “표현력과 자동화가 늘수록 숨겨진 비용과 side effect도 늘어난다”이다. Prepared statement는 안전한 API 사용의 핵심이고, trigger는 강력하지만 추론을 어렵게 만들 수 있으며, external routine은 빠르고 표현력이 크지만 sandbox/security 문제가 있다.

## 연결 관계

Chapter 3-4의 SQL query, transaction, view, constraint, authorization이 Chapter 5의 기반이다. Prepared statement와 JDBC/ODBC transaction control은 Chapter 4의 `commit`/`rollback`을 application API 수준에서 사용하는 것이다.

Stored procedure/function과 trigger는 Chapter 4의 view update, assertion, complex constraint 문제와 연결된다. Chapter 4에서 “복잡한 constraint는 trigger로 구현할 수 있다”고 했고, Chapter 5가 그 trigger mechanism을 설명한다.

Recursive query는 relational model이 단순 table query에 머무르지 않고 graph/hierarchy computation도 표현할 수 있음을 보여 준다. 이는 이후 Datalog 같은 logic-based query language와 연결된다.

Advanced aggregation은 Chapter 11의 data warehousing/OLAP로 이어진다. `rollup`, `cube`, `pivot`, `window function`은 operational query보다 analytical query에서 특히 중요하다.

External language routine, trigger, stored procedure는 authorization/security와도 연결된다. DBMS 내부에서 실행되는 code가 어떤 privilege로 실행되는지, sandbox가 있는지, side effect가 transaction과 어떻게 맞물리는지가 설계 포인트다.

## 오해하기 쉬운 내용

- User input을 SQL string concatenation으로 붙이면 `SQL injection` 위험이 생긴다. User-entered value는 prepared statement parameter로 전달해야 한다.
- JDBC/ODBC는 SQL 자체가 아니라 host language에서 SQL을 실행하기 위한 API이다. SQL query semantics와 API resource/exception/transaction 관리는 별도 문제다.
- `embedded database`와 `embedded SQL`은 다르다. 전자는 application 안에 DB engine을 포함하는 방식이고, 후자는 host language code 안에 SQL syntax를 넣는 방식이다.
- Stored procedure에 business logic을 넣으면 공유와 중앙 관리가 쉬워지지만, DBMS별 문법 차이와 배포/테스트 복잡도도 생긴다.
- User-defined function을 query에서 tuple마다 호출하면 성능 문제가 생길 수 있다.
- Trigger는 application이 명시적으로 호출하지 않아도 실행된다. 그래서 hidden side effect와 trigger chain을 항상 고려해야 한다.
- Trigger로 외부 세계 action을 직접 처리하려 하지 말고, relation에 작업 요청을 기록하고 별도 process가 처리하는 구조가 더 안전한 경우가 많다.
- Recursive query는 단순히 자기 자신을 아무렇게나 참조하면 되는 것이 아니다. Base query와 recursive query가 있어야 하고, monotonicity restriction을 만족해야 한다.
- `rank()`와 `dense_rank()`는 tie 이후 rank gap이 다르다.
- `top n` syntax는 ties를 임의로 잘라낼 수 있지만, `rank <= n` 방식은 마지막 rank tie를 보존할 수 있다.
- `group by`와 window function은 다르다. `group by`는 row를 줄이고, window function은 원래 row마다 aggregate/rank 값을 붙이는 식으로 동작한다.
- Rollup/cube가 만든 `null`은 실제 stored `null`과 의미가 다르다. 이를 구분하려면 `grouping()`을 사용해야 한다.

## 면접 질문

1. SQL을 general-purpose programming language와 결합해야 하는 이유를 data model mismatch 관점에서 설명해 보라.
2. `dynamic SQL`과 `embedded SQL`의 차이는 무엇이며, 각각의 장단점은 무엇인가?
3. JDBC에서 `Connection`, `Statement`, `PreparedStatement`, `ResultSet`의 역할을 설명해 보라.
4. `prepared statement`가 `SQL injection`을 막는 원리를 string concatenation 방식과 비교해 설명해 보라.
5. JDBC metadata API가 필요한 상황을 예로 들어 보라.
6. ODBC에서 `SQLBindCol`과 `SQLFetch`가 함께 어떤 일을 하는가?
7. Stored function과 stored procedure의 차이를 `return value`, `in/out parameter`, side effect 관점에서 설명해 보라.
8. Table function이 parameterized view처럼 볼 수 있는 이유는 무엇인가?
9. PSM의 `begin atomic`, loop, handler가 database routine에서 어떤 역할을 하는가?
10. External language routine을 DBMS process 안에서 실행할 때 성능과 보안 trade-off는 무엇인가?
11. Trigger의 event-condition-action model을 설명하고, `before trigger`와 `after trigger`의 차이를 말해 보라.
12. Row-level trigger와 statement-level trigger의 차이, transition variable/table의 역할을 설명해 보라.
13. Trigger를 쓰지 않는 편이 나은 상황을 materialized view maintenance나 cascade constraint 예시로 설명해 보라.
14. Transitive closure를 iterative temporary table 방식으로 계산할 때 cycle을 어떻게 막는가?
15. `with recursive` query의 base query, recursive query, fixed point 의미를 설명해 보라.
16. Recursive SQL에서 monotonicity restriction이 필요한 이유는 무엇인가?
17. `rank()`, `dense_rank()`, `row_number()`, `ntile(n)`의 차이를 설명해 보라.
18. Window function이 `group by` aggregation과 다른 점은 무엇인가?
19. Pivot/cross-tabulation은 어떤 형태의 relation 변환인가?
20. `rollup`, `cube`, `grouping sets`, `grouping()`의 역할을 각각 설명해 보라.
