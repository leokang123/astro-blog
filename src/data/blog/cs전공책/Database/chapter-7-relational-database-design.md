---
title: "Chapter 7. Relational Database Design"
order: 7
pubDatetime: 2026-05-18T00:00:00+09:00
modDatetime: 2026-05-18T00:00:00+09:00
description: "Database System Concepts 정리: Chapter 7. Relational Database Design"
tags:
  - "Database"
  - "CS"
---

## 개요

Chapter 7은 Chapter 6의 E-R design에서 한 단계 더 들어가, relation schema 자체가 좋은 설계인지 판단하는 formal method를 다룬다. 목표는 불필요한 `redundancy` 없이 정보를 저장하면서도, 필요한 정보를 쉽게 retrieve할 수 있는 relation schemas를 만드는 것이다. 이를 위해 `functional dependency(FD)`, `normal form`, `decomposition`, `lossless decomposition`, `dependency preservation` 같은 개념이 필요하다.

이 장의 핵심 긴장은 “중복을 줄이기 위해 relation을 쪼개야 하지만, 잘못 쪼개면 information loss가 생긴다”는 점이다. 그래서 normalization은 단순히 table을 작게 만드는 작업이 아니라, real-world constraint를 이용해 어떤 decomposition이 안전한지 증명하는 작업이다.

## 핵심 개념

- 좋은 relational design은 `repetition of information`, `inability to represent certain information`, `update anomaly`를 줄인다.
- `decomposition`은 큰 relation schema를 여러 작은 schema로 나누는 작업이지만, 반드시 `lossless decomposition`이어야 한다.
- `lossless decomposition`은 원래 relation을 projection한 뒤 natural join해도 정확히 원래 relation이 복원되는 decomposition이다.
- `normalization`은 relation schema가 적절한 `normal form`인지 확인하고, 아니면 lossless하게 분해하는 방법론이다.
- Normal form 판단에는 schema 모양만으로는 부족하고, enterprise에서 성립하는 `functional dependency` 같은 data dependency가 필요하다.

## 세부 정리

### 7.1 Features of Good Relational Designs

Chapter 6의 E-R design은 relational database design의 좋은 출발점이다. E-R diagram에서 relation schemas를 직접 생성할 수 있지만, 생성된 schema set이 좋은지는 원래 E-R design과 enterprise constraint가 얼마나 잘 반영되었는지에 달려 있다. Figure 7.1은 앞 장에서 사용한 university database schema를 다시 보여 준다.

![Figure 7.1](@/assets/images/cs-database-108-figure-7-1-page-333.png)
*Figure 7.1 · PDF p. 333 · university 예시의 relation schema 목록*

좋은 relational design을 이해하기 위해 원문은 나쁜 대안 `in_dep` schema를 든다.

```text
in_dep(ID, name, salary, dept_name, building, budget)
```

이 relation은 `instructor`와 `department`를 natural join한 결과처럼 보인다. Query가 join 없이 짧아질 수 있으므로 처음에는 좋아 보인다. 하지만 enterprise fact를 생각하면 문제가 드러난다.

Figure 7.2의 `in_dep` relation에서는 같은 department 정보가 department에 속한 instructor마다 반복된다. 예를 들어 `Comp. Sci.`의 `building = Taylor`, `budget = 100000`이 Katz, Srinivasan, Brandt tuple에 모두 반복된다.

![Figure 7.2](@/assets/images/cs-database-109-figure-7-2-page-334.png)
*Figure 7.2 · PDF p. 334 · department 정보가 instructor마다 반복되는 `in_dep` relation*

이 설계의 문제는 두 가지다.

| 문제 | 설명 | 결과 |
|---|---|---|
| `repetition of information` | department의 building/budget이 instructor마다 반복 저장 | update 시 일부 tuple만 바뀌면 inconsistency 발생 |
| `inability to represent information` | instructor가 없는 새 department를 자연스럽게 저장할 수 없음 | dummy tuple이나 `null`에 의존해야 함 |

원래 설계에서는 `department(dept_name, building, budget)`가 department budget을 한 번만 저장한다. 따라서 budget을 갱신할 때 한 tuple만 바꾸면 된다. 반대로 `in_dep`에서는 같은 department의 모든 instructor tuple을 함께 바꿔야 하므로, 한 tuple을 빠뜨리면 database가 모순된 상태가 된다.

두 번째 문제도 중요하다. 새 department를 만들었지만 아직 instructor가 없다면 `in_dep`에는 `ID`, `name`, `salary` 값이 없어서 department 정보를 직접 저장할 수 없다. `null`을 넣어 억지로 표현할 수 있지만, null은 query semantics와 constraint에서 문제를 만들 수 있다.

#### 7.1.1 Decomposition

`decomposition`은 repetition problem이 있는 큰 schema를 여러 작은 schema로 나누는 작업이다. `in_dep`의 경우에는 다음처럼 분해하면 redundancy가 줄어든다.

```text
instructor(ID, name, dept_name, salary)
department(dept_name, building, budget)
```

하지만 모든 decomposition이 좋은 것은 아니다. 극단적으로 모든 relation을 attribute 하나짜리로 쪼개면 어떤 의미 있는 relationship도 표현할 수 없다. 원문은 덜 극단적인 나쁜 예로 `employee` schema를 든다.

```text
employee(ID, name, street, city, salary)
```

이를 다음처럼 나누면 문제가 생긴다.

```text
employee1(ID, name)
employee2(name, street, city, salary)
```

만약 이름이 같은 employee가 둘 있으면, `name`을 기준으로 natural join할 때 원래 없던 tuple이 생긴다. Figure 7.3은 Kim이라는 이름을 가진 두 employee가 있을 때, decomposition 후 natural join 결과가 네 tuple로 불어나면서 잘못된 address/salary 조합을 만들어내는 모습을 보여 준다.

![Figure 7.3](@/assets/images/cs-database-110-figure-7-3-page-335.png)
*Figure 7.3 · PDF p. 335 · `name` 기준 분해가 원래 없던 tuple을 만들어 information loss를 일으키는 예*

여기서 tuple 수가 늘었는데도 “정보가 줄었다”고 말하는 이유가 중요하다. 원래 relation은 어떤 `ID`가 어떤 address와 salary에 연결되는지 정확히 알고 있었다. 분해 후에는 같은 이름 Kim 때문에 두 ID와 두 address/salary 조합이 섞여, 어떤 연결이 실제인지 구분하지 못한다. 즉 “특정 연결이 존재하지 않는다”는 정보가 사라진다.

이런 decomposition을 `lossy decomposition`이라고 한다. 반대로 원래 relation을 정확히 복원할 수 있는 decomposition을 `lossless decomposition`이라고 한다. 이 장의 나머지에서는 모든 decomposition이 lossless여야 한다고 요구한다.

#### 7.1.2 Lossless Decomposition

Relation schema `R`을 `R1`, `R2`로 decomposition한다고 하자. Attribute set 관점에서 `R = R1 ∪ R2`이다. 이 decomposition이 `lossless decomposition`이라는 것은, 모든 legal database instance `r(R)`에 대해 `r`을 `R1`, `R2`로 projection한 뒤 다시 natural join하면 정확히 `r`이 나와야 한다는 뜻이다.

Relational algebra로 쓰면 다음과 같다.

$$
\Pi_{R_1}(r) \bowtie \Pi_{R_2}(r) = r
$$

SQL 식으로 보면 “r에서 R1 attribute만 select한 relation”과 “r에서 R2 attribute만 select한 relation”을 natural join했을 때 원래 r이 복원되어야 한다.

반대로 `lossy decomposition`이면 natural join 결과가 원래 relation의 proper superset이 된다.

$$
r \subset \Pi_{R_1}(r) \bowtie \Pi_{R_2}(r)
$$

Figure 7.3의 employee decomposition은 `employee1 natural join employee2`가 원래 employee보다 더 많은 tuple을 만들기 때문에 lossy다. 이때 새 tuple이 생기는 것은 정보가 늘어난 것이 아니라, 원래 있었던 정확한 연결 정보가 사라져 가능한 조합을 과하게 허용한 것이다.

#### 7.1.3 Normalization Theory

`normalization`은 relation schema를 “good form”으로 만드는 일반 방법론이다. 큰 흐름은 다음과 같다.

| 단계 | 질문 |
|---|---|
| normal form 검사 | 주어진 relation schema가 `BCNF`, `3NF` 같은 desirable normal form에 있는가? |
| decomposition | 그렇지 않다면 더 작은 relation schemas로 나눌 수 있는가? |
| safety check | decomposition이 `lossless decomposition`인가? 가능하면 `dependency preserving`인가? |

Normal form은 relation schema의 attribute 이름만 보고 판단할 수 없다. Enterprise에서 어떤 constraint가 성립하는지 알아야 한다. 이 장에서 가장 기본이 되는 constraint가 `functional dependency`다.

### 7.2 Decomposition Using Functional Dependencies

Database는 현실 세계의 entities와 relationships를 모델링하므로, data에는 현실 규칙이 붙는다. University database에서는 다음 같은 constraint가 성립한다고 기대한다.

| 현실 규칙 | dependency 직관 |
|---|---|
| student/instructor는 `ID`로 unique하게 식별됨 | `ID`가 tuple 식별에 충분 |
| 각 student/instructor는 name이 하나 | `ID -> name` |
| 각 instructor/student는 primary department가 하나 | `ID -> dept_name` |
| 각 department는 budget/building이 하나 | `dept_name -> budget, building` |

이런 real-world constraint를 만족하는 relation instance를 `legal instance`라고 한다. Database의 legal instance는 모든 relation instance가 각자의 real-world constraint를 만족하는 instance다. Functional dependency는 “legal instance가 가져야 하는 attribute 결정 관계”를 formal하게 표현하는 도구다.

#### 7.2.1 Notational Conventions

이 장의 알고리즘은 특정 university relation이 아니라 임의의 relation schema를 다룬다. 표기는 다음처럼 읽는다.

| 표기 | 의미 |
|---|---|
| `R` | relation schema를 나타내는 uppercase Roman letter |
| `r(R)` | schema `R`을 가진 relation `r` |
| `r` | relation 또는 문맥상 relation instance |
| `α`, `β`, `γ` | attribute set, schema일 수도 있고 아닐 수도 있음 |
| `K` | superkey로 쓰이는 attribute set |
| `t[α]` | tuple `t`의 attribute set `α`에 대한 값 |

Relation schema는 attribute set이지만, 모든 attribute set이 schema는 아니다. 그래서 lowercase Greek letter는 일반 attribute set을, uppercase Roman letter는 relation schema임을 강조할 때 사용한다. 또한 이 장에서는 단순화를 위해 database schema 안의 attribute name은 하나의 의미만 가진다고 가정한다.

#### 7.2.2 Keys and Functional Dependencies

`superkey` 정의를 다시 쓰면 다음과 같다. Relation `r(R)`에서 `K ⊆ R`이 superkey라는 것은, 모든 legal instance에서 서로 다른 두 tuple `t1`, `t2`가 같은 `K` 값을 가질 수 없다는 뜻이다.

$$
t_1 \ne t_2 \Rightarrow t_1[K] \ne t_2[K]
$$

또는 같은 말로, `K` 값이 같으면 tuple 전체가 같아야 한다.

`functional dependency(FD)`는 superkey보다 더 일반적이다. FD `α -> β`는 attribute set `α` 값이 같으면 attribute set `β` 값도 반드시 같아야 한다는 constraint다.

$$
\forall t_1, t_2,\quad t_1[\alpha] = t_2[\alpha] \Rightarrow t_1[\beta] = t_2[\beta]
$$

중요한 구분은 두 가지다.

| 표현 | 의미 |
|---|---|
| instance가 `α -> β`를 satisfies | 현재 relation instance에서 우연히 또는 필연적으로 그 FD가 맞음 |
| `α -> β` holds on schema `r(R)` | 모든 legal instance에서 그 FD가 반드시 맞음 |

Superkey도 FD로 표현할 수 있다. `K`가 `r(R)`의 superkey라는 것은 `K -> R`이 `r(R)`에서 hold한다는 뜻이다.

원문의 `in_dep` schema에서는 다음 FD가 성립한다.

$$
\begin{aligned}
\text{dept\_name} &\to building, budget \\
ID, \text{dept\_name} &\to name, salary, building, budget
\end{aligned}
$$

첫 번째 FD는 department name이 department의 building과 budget을 결정한다는 뜻이다. 두 번째는 `(ID, dept_name)`이 `in_dep`의 tuple 전체를 식별할 수 있음을 나타낸다.

이 장은 FD를 두 방식으로 사용한다.

| 사용 | 설명 |
|---|---|
| instance test | 주어진 relation instance가 FD set `F`를 만족하는지 검사 |
| schema constraint | legal relation들이 반드시 만족해야 하는 FD set `F`를 지정 |

Figure 7.4의 sample relation `r(A, B, C, D)`를 보면 현재 instance는 `A -> C`를 만족한다. 같은 A 값 `a1`을 가진 tuple들은 모두 C 값 `c1`을 갖고, A 값 `a2`를 가진 tuple들은 모두 C 값 `c2`를 갖기 때문이다. 그러나 `C -> A`는 만족하지 않는다. C 값 `c2`를 공유하면서 A 값이 `a2`, `a3`로 다른 tuple들이 있기 때문이다.

![Figure 7.4](@/assets/images/cs-database-111-figure-7-4-page-340.png)
*Figure 7.4 · PDF p. 340 · 현재 instance가 어떤 functional dependency를 만족하는지 확인하는 예*

`trivial functional dependency`도 있다. `α -> β`에서 `β ⊆ α`이면 항상 성립한다. 예를 들어 `A -> A`, `AB -> A`는 어떤 relation instance에서도 참이다. 이미 왼쪽에 포함된 attribute를 오른쪽에서 다시 결정한다고 말하는 것이기 때문이다.

Figure 7.5의 classroom instance에서는 `room_number -> capacity`가 현재 instance에서 우연히 만족한다. 하지만 현실에서는 다른 building에 같은 room number가 있고 capacity가 다를 수 있으므로, schema constraint로는 이 FD를 채택하면 안 된다. 대신 `building, room_number -> capacity`는 classroom schema에서 hold한다고 보는 것이 타당하다.

![Figure 7.5](@/assets/images/cs-database-112-figure-7-5-page-340.png)
*Figure 7.5 · PDF p. 340 · 현재 instance 만족과 schema-level FD constraint의 차이를 보여주는 classroom relation*

FD reasoning에서는 현재 우연히 보이는 pattern과 모든 legal instance에서 보장되는 enterprise rule을 구분해야 한다. Normalization은 후자, 즉 schema-level constraint를 기반으로 한다.

FD set `F`가 주어지면, `F`에서 논리적으로 infer할 수 있는 다른 FD들이 있다. 예를 들어 `A -> B`, `B -> C`가 hold하면 `A -> C`도 hold한다. 이런 inferred FD 전체의 집합을 `closure of F`, 즉 `F+`라고 쓴다. `F+`에는 원래 `F`에 있던 FD도 모두 포함된다.

#### 7.2.3 Lossless Decomposition and Functional Dependencies

Functional dependency는 decomposition이 lossless인지 판정하는 데 사용할 수 있다. Relation schema `R`을 `R1`, `R2`로 binary decomposition하고 FD set `F`가 주어졌다고 하자. 다음 중 하나가 `F+`에 있으면 decomposition은 lossless다.

$$
\begin{aligned}
R_1 \cap R_2 &\to R_1 \\
R_1 \cap R_2 &\to R_2
\end{aligned}
$$

즉 공통 attribute set `R1 ∩ R2`가 `R1` 또는 `R2` 중 하나의 superkey이면 lossless decomposition이다.

`in_dep`를 다시 보자.

```text
in_dep(ID, name, salary, dept_name, building, budget)

instructor(ID, name, dept_name, salary)
department(dept_name, building, budget)
```

두 schema의 intersection은 `dept_name`이다. `dept_name -> dept_name, building, budget`이 성립하므로, `dept_name`은 `department` schema의 superkey다. 따라서 이 decomposition은 lossless다.

Binary decomposition이 `R1 ∩ R2 -> R1` 형태로 lossless라면, SQL schema 수준에서는 consistency를 위해 다음 제약을 두는 것이 자연스럽다.

| 제약 | 역할 |
|---|---|
| `R1 ∩ R2`를 `r1`의 primary key로 둠 | functional dependency를 enforce |
| `R1 ∩ R2`를 `r2`에서 `r1`로 향하는 foreign key로 둠 | join 시 matching tuple이 없어 정보가 사라지는 것을 방지 |

여러 schema로 한꺼번에 분해하는 일반 경우의 lossless test는 더 복잡하다. 또한 FD가 아닌 `multivalued dependency(MVD)` 같은 constraint가 lossless decomposition을 보장할 수도 있다. 이 지점이 뒤의 7.6으로 이어진다.

### 7.3 Normal Forms

`normal form`은 relation schema가 redundancy와 anomaly를 얼마나 잘 피하는지 판단하는 형식적 기준이다. 이 절에서는 가장 많이 쓰이는 `Boyce-Codd normal form(BCNF)`과 `third normal form(3NF)`을 다룬다.

#### 7.3.1 Boyce-Codd Normal Form

`BCNF(Boyce-Codd normal form)`은 functional dependency로 발견할 수 있는 redundancy를 제거하는 강한 normal form이다. 단, 7.6에서 보듯 FD로 설명되지 않는 redundancy는 BCNF만으로는 제거되지 않을 수 있다.

Relation schema `R`이 FD set `F`에 대해 BCNF라는 것은, `F+`에 있는 모든 FD `α -> β`에 대해 다음 중 적어도 하나가 성립한다는 뜻이다.

$$
\begin{aligned}
\text{1. } \alpha \to \beta &\text{ is trivial, i.e. } \beta \subseteq \alpha \\
\text{2. } \alpha &\text{ is a superkey for } R
\end{aligned}
$$

핵심 직관은 간단하다. 어떤 attribute set `α`가 다른 attribute `β`를 결정한다면, `α`는 relation 전체를 식별할 만큼 강해야 한다. 그렇지 않으면 같은 `α` 값 아래에서 `β` 정보가 반복 저장될 가능성이 있다.

`in_dep(ID, name, salary, dept_name, building, budget)`은 BCNF가 아니다. `dept_name -> budget`이 hold하지만, `dept_name`은 여러 instructor를 가질 수 있으므로 `in_dep`의 superkey가 아니기 때문이다.

반대로 decomposition 후의 relation들은 BCNF다.

| schema | 중요한 nontrivial FD | 왼쪽이 superkey인가? |
|---|---|---|
| `instructor(ID, name, dept_name, salary)` | `ID -> name, dept_name, salary` | 예, `ID`가 primary key |
| `department(dept_name, building, budget)` | `dept_name -> building, budget` | 예, `dept_name`이 primary key |

BCNF가 아닌 schema `R`에서 nontrivial FD `α -> β`가 있고 `α`가 superkey가 아니면, 기본 decomposition rule은 `R`을 다음 두 schema로 바꾸는 것이다.

$$
\begin{aligned}
\alpha \cup \beta \\
R - (\beta - \alpha)
\end{aligned}
$$

`in_dep`에서는 `α = dept_name`, `β = {building, budget}`이므로 다음처럼 분해된다.

```text
(dept_name, building, budget)
(ID, name, dept_name, salary)
```

이 규칙에서 `β - α`라고 쓰는 이유는 FD 오른쪽에 왼쪽 attribute가 함께 나타나는 경우도 올바르게 처리하기 위해서다. 분해 결과 중 어떤 schema가 여전히 BCNF가 아니면 다시 분해한다.

#### 7.3.1.2 BCNF and Dependency Preservation

BCNF는 redundancy 제거에 강하지만, decomposition 후 어떤 FD를 하나의 relation만 보고 검사할 수 없게 만들 수 있다. 이를 `dependency preservation` 문제라고 한다.

원문의 예시는 modified university design이다. Student는 여러 advisor를 가질 수 있지만, 같은 department에 대해서는 최대 한 advisor만 가질 수 있다고 하자. 또한 instructor는 advisor 역할을 할 때 하나의 department에 대해서만 advisor가 될 수 있다고 하자. 이를 위해 Figure 7.6처럼 `dept_advisor(student, instructor, department)` ternary relationship을 둔다.

![Figure 7.6](@/assets/images/cs-database-113-figure-7-6-page-344.png)
*Figure 7.6 · PDF p. 344 · student별 department advisor 제약을 표현하는 `dept_advisor` relationship set*

이 relationship에서 나온 schema는 다음과 같다.

```text
dept_advisor(s_ID, i_ID, dept_name)
```

여기서 다음 FD들이 hold한다.

$$
\begin{aligned}
\text{i\_ID} &\to \text{dept\_name} \\
\text{s\_ID}, \text{dept\_name} &\to \text{i\_ID}
\end{aligned}
$$

첫 번째는 instructor가 advisor로서 하나의 department에만 속한다는 뜻이고, 두 번째는 student가 한 department에 대해 advisor를 최대 하나만 갖는다는 뜻이다.

하지만 `dept_advisor`는 BCNF가 아니다. `i_ID -> dept_name`에서 `i_ID`는 superkey가 아니기 때문이다. BCNF decomposition을 적용하면 다음 두 schema가 나온다.

```text
(s_ID, i_ID)
(i_ID, dept_name)
```

두 schema는 각각 BCNF다. 문제는 `s_ID, dept_name -> i_ID`를 검사하려면 두 relation을 join해야 한다는 점이다. 이 FD의 모든 attribute가 한 schema 안에 들어 있지 않기 때문이다. 이런 decomposition은 `dependency preserving`이 아니다.

`dependency preservation`은 decomposition 후에도 원래 FD들을 각 decomposed relation의 constraint만 검사해서 enforce할 수 있는 성질이다. Dependency preservation이 없으면 constraint 검사를 위해 join이 필요하고 update cost가 커진다.

#### 7.3.2 Third Normal Form

`3NF(third normal form)`은 BCNF보다 약한 normal form이다. BCNF의 “모든 nontrivial FD의 왼쪽은 superkey여야 한다”는 조건을 조금 완화해, dependency-preserving decomposition을 항상 가능하게 만든다.

Relation schema `R`이 FD set `F`에 대해 3NF라는 것은, `F+`에 있는 모든 FD `α -> β`에 대해 다음 중 적어도 하나가 성립한다는 뜻이다.

$$
\begin{aligned}
\text{1. } \alpha \to \beta &\text{ is trivial, i.e. } \beta \subseteq \alpha \\
\text{2. } \alpha &\text{ is a superkey for } R \\
\text{3. each } A \in \beta - \alpha &\text{ is contained in a candidate key for } R
\end{aligned}
$$

세 번째 조건이 3NF의 핵심 완화다. `β - α`의 모든 attribute가 하나의 같은 candidate key에 들어가야 한다는 뜻은 아니다. 각 attribute가 어떤 candidate key에든 포함되면 된다. 이런 attribute를 흔히 prime attribute라고 부른다.

모든 BCNF schema는 자동으로 3NF다. BCNF는 모든 FD가 1 또는 2 조건을 만족하기 때문이다. 하지만 3NF는 BCNF가 허용하지 않는 일부 FD를 허용한다.

`dept_advisor(s_ID, i_ID, dept_name)` 예시에서 `i_ID -> dept_name`은 BCNF를 위반한다. 그러나 `dept_name`은 candidate key `{s_ID, dept_name}`에 포함된다. 따라서 이 FD는 3NF의 세 번째 조건을 만족할 수 있고, `dept_advisor` schema는 3NF가 된다.

3NF의 세 번째 조건은 처음에는 부자연스럽지만, “lossless와 dependency preservation을 모두 보장하는 3NF decomposition이 항상 존재하게 만드는 최소한의 완화”로 이해하면 된다.

#### 7.3.3 Comparison of BCNF and 3NF

Functional dependency 기반 design의 이상적인 목표는 세 가지다.

```text
1. BCNF
2. Losslessness
3. Dependency preservation
```

하지만 항상 세 가지를 동시에 만족할 수는 없다. 이때 선택지는 보통 다음과 같다.

| 선택 | 장점 | 단점 |
|---|---|---|
| BCNF 선호 | FD 기반 redundancy를 더 강하게 제거 | dependency preservation을 잃을 수 있음 |
| 3NF 선택 | lossless와 dependency preservation을 항상 확보 가능 | 일부 redundancy와 null 사용 문제가 남을 수 있음 |

원문은 SQL 현실도 지적한다. SQL은 arbitrary functional dependency를 직접 선언하는 기능을 제공하지 않는다. `primary key`, `unique` constraint는 superkey 형태의 FD만 표현한다. 일반 FD는 assertion으로 표현할 수 있겠지만, 실제 DBMS는 복잡한 assertion을 거의 지원하지 않고 검사 비용도 크다.

따라서 dependency-preserving decomposition이 있어도, 표준 SQL만으로는 왼쪽이 key인 FD 정도만 효율적으로 enforce하기 쉽다. Materialized view와 그 위의 unique constraint를 사용해 join 기반 FD 검사를 줄일 수는 있지만, 대부분의 DBMS에서 제약이 많고 즉시 갱신/즉시 검사 문제가 따른다.

결론적으로 원문은 dependency-preserving BCNF decomposition이 불가능하더라도, 실무적으로는 BCNF를 선택하는 편이 더 낫다고 요약한다. 이유는 SQL에서 primary key가 아닌 FD를 검사하는 것이 어차피 어렵기 때문이다.

#### 7.3.4 Higher Normal Forms

FD만으로는 모든 redundancy를 설명할 수 없다. 예를 들어 instructor마다 여러 child name과 여러 landline phone number가 있다고 하자. E-R 변환 규칙에 따르면 multivalued attribute는 각각 별도 schema로 둔다.

```text
(ID, child_name)
(ID, phone_number)
```

이를 합쳐 다음 schema를 만들면 어떤 nontrivial FD도 없으므로 BCNF처럼 보일 수 있다.

```text
(ID, child_name, phone_number)
```

하지만 instructor `99999`에게 child가 `David`, `William` 두 명이고 phone number가 `512-555-1234`, `512-555-4321` 두 개라면, 모든 조합을 저장해야 한다.

```text
(99999, David,   512-555-1234)
(99999, David,   512-555-4321)
(99999, William, 512-555-1234)
(99999, William, 512-555-4321)
```

Phone과 child 사이에는 의미 있는 연결이 없는데도 Cartesian product처럼 반복된다. 일부 tuple만 저장하면 David가 특정 phone에만 대응하고 William이 다른 phone에만 대응하는 것처럼 잘못된 의미가 생긴다. 이런 redundancy는 `multivalued dependency(MVD)`와 `fourth normal form(4NF)`에서 다룬다.

#### 7.4 Functional-Dependency Theory

앞 절까지는 FD를 이용해 relation schema가 BCNF/3NF인지 판단했다. 하지만 실제 설계에서는 주어진 FD 집합 `F`만 보면 부족하다. `F`에서 논리적으로 따라오는 다른 FD까지 함께 고려해야 한다. 이 절은 “주어진 FD로부터 무엇이 반드시 성립하는가”를 계산하는 이론과 알고리즘을 제공한다.

핵심 용어는 다음과 같다.

| 용어 | 의미 |
|---|---|
| `logically implied` | `F`를 만족하는 모든 legal instance가 어떤 FD `f`도 항상 만족할 때, `f`는 `F`에 의해 논리적으로 함의된다 |
| `F+` | `F`가 logically imply하는 모든 functional dependency의 집합, 즉 closure of `F` |
| `Armstrong's axioms` | `F+`를 생성하기 위한 sound and complete inference rules |
| `attribute closure`, `α+` | `F` 아래에서 attribute set `α`가 functionally determine하는 모든 attribute의 집합 |
| `canonical cover`, `Fc` | `F`와 같은 closure를 가지면서 extraneous attribute를 제거하고 왼쪽이 같은 FD를 합친 단순 FD 집합 |

##### 7.4.1 Closure of a Set of Functional Dependencies

예를 들어 relation schema가 다음과 같다고 하자.

$$
\begin{aligned}
R &= (A, B, C, G, H, I) \\
F &= \{ A \to B, A \to C, CG \to H, CG \to I, B \to H \}
\end{aligned}
$$

이때 `A -> H`는 `F`에 직접 적혀 있지 않지만 logically implied된다. 두 tuple `t1`, `t2`가 `A` 값이 같으면 `A -> B` 때문에 `B` 값도 같고, `B -> H` 때문에 `H` 값도 같다. 따라서 `A` 값이 같으면 `H` 값이 같으므로 `A -> H`가 성립한다.

이런 추론을 매번 tuple 정의로 증명하면 번거롭다. 그래서 functional dependency 이론은 `Armstrong's axioms`를 사용한다.

| 규칙 | 형태 | 의미 |
|---|---|---|
| Reflexivity rule | if `β ⊆ α`, then `α -> β` | 어떤 attribute set은 자기 부분집합을 항상 결정한다 |
| Augmentation rule | if `α -> β`, then `γα -> γβ` | 양쪽에 같은 attribute set을 붙여도 FD가 유지된다 |
| Transitivity rule | if `α -> β` and `β -> γ`, then `α -> γ` | 결정 관계는 전이된다 |

이 세 규칙은 `sound`하다. 즉 잘못된 FD를 만들어내지 않는다. 또한 `complete`하다. 즉 `F+`에 속하는 모든 FD를 반복 적용으로 만들어낼 수 있다.

Armstrong's axioms에서 자주 파생해 쓰는 규칙도 있다.

| 파생 규칙 | 형태 | 사용 이유 |
|---|---|---|
| Union rule | if `α -> β` and `α -> γ`, then `α -> βγ` | 같은 determinant의 오른쪽을 합친다 |
| Decomposition rule | if `α -> βγ`, then `α -> β` and `α -> γ` | 오른쪽 attribute set을 나눠 본다 |
| Pseudotransitivity rule | if `α -> β` and `γβ -> δ`, then `αγ -> δ` | augmentation과 transitivity를 합친 형태 |

위 예제에서 `CG -> H`와 `CG -> I`가 있으면 union rule로 `CG -> HI`를 얻는다. 또 `A -> C`와 `CG -> I`가 있으면 pseudotransitivity로 `AG -> I`를 얻는다.

![Figure 7.7](@/assets/images/cs-database-114-figure-7-7-page-351.png)
*Figure 7.7 · PDF p. 351 · Armstrong's axioms로 F+를 계산하는 절차*

Figure 7.7은 `F+`를 직접 계산하는 절차를 보여준다. 처음에는 `F+ = F`로 두고, reflexivity rule로 trivial dependency를 추가한 뒤 augmentation과 transitivity를 더 이상 새 FD가 생기지 않을 때까지 반복한다.

이 절차는 종료가 보장되지만 실용적으로 비쌀 수 있다. attribute가 `n`개이면 왼쪽 subset이 `2^n`개, 오른쪽 subset도 `2^n`개라 가능한 FD 수가 `2^(2n)`개가 된다. 그래서 실제 설계 알고리즘에서는 전체 `F+`를 직접 만들기보다, 필요한 attribute closure를 계산하는 방식이 훨씬 중요하다.

##### 7.4.2 Closure of Attribute Sets

`attribute closure`는 FD 이론에서 가장 많이 쓰는 계산 도구다. 어떤 attribute set `α`에 대해, `F` 아래에서 `α`가 functionally determine하는 모든 attribute의 집합을 `α+`라고 쓴다.

![Figure 7.8](@/assets/images/cs-database-115-figure-7-8-page-352.png)
*Figure 7.8 · PDF p. 352 · α+ attribute closure 계산 알고리즘*

알고리즘은 단순하다.

```text
result := α
repeat
    for each FD β -> γ in F:
        if β ⊆ result:
            result := result ∪ γ
until result does not change
```

예제 `F = { A -> B, A -> C, CG -> H, CG -> I, B -> H }`에서 `(AG)+`를 계산하면 다음처럼 확장된다.

| 단계 | result | 이유 |
|---|---|---|
| 시작 | `AG` | closure는 자기 자신에서 출발한다 |
| `A -> B` 적용 | `ABG` | `A ⊆ AG` |
| `A -> C` 적용 | `ABCG` | `A ⊆ ABG` |
| `CG -> H` 적용 | `ABCGH` | `CG ⊆ ABCG` |
| `CG -> I` 적용 | `ABCGHI` | `CG ⊆ ABCGH` |
| 종료 | `ABCGHI` | 더 추가되는 attribute가 없다 |

`α+`는 세 가지 핵심 검사를 가능하게 한다.

| 검사 | 방법 |
|---|---|
| `α`가 superkey인지 검사 | `α+`가 relation schema `R`의 모든 attribute를 포함하는지 확인한다 |
| FD `α -> β`가 `F+`에 속하는지 검사 | `β ⊆ α+`인지 확인한다 |
| `F+`를 간접 계산 | 모든 `γ ⊆ R`에 대해 `γ+`를 구하고, `S ⊆ γ+`이면 `γ -> S`를 만들 수 있다 |

즉 `attribute closure`는 normal form 검사, dependency preservation 검사, decomposition algorithm의 공통 하부 루틴이다.

##### 7.4.3 Canonical Cover

DBMS가 update를 받을 때 relation이 FD를 위반하는지 검사해야 한다. 그런데 `F`에 중복되거나 불필요한 attribute가 많으면 검사 비용이 커진다. 그래서 `F`와 같은 의미를 갖지만 더 단순한 FD 집합인 `canonical cover(Fc)`를 만든다.

먼저 `extraneous attribute`를 이해해야 한다. FD `α -> β` 안의 어떤 attribute를 제거해도 전체 FD 집합의 closure가 바뀌지 않으면 그 attribute는 extraneous하다.

왼쪽에서 제거하는 경우와 오른쪽에서 제거하는 경우는 방향이 다르므로 헷갈리기 쉽다.

| 위치 | 제거 효과 | extraneous 검사 요지 |
|---|---|---|
| left-hand side `α` | determinant가 작아지므로 constraint가 더 강해질 수 있다 | `A ∈ α`일 때 `γ = α - {A}`를 두고, `γ+` under `F`가 `β`를 포함하면 `A`는 extraneous |
| right-hand side `β` | dependent가 줄어드므로 constraint가 약해질 수 있다 | `A ∈ β`일 때 `F' = (F - {α -> β}) ∪ {α -> (β - A)}`로 두고, `α+` under `F'`가 `A`를 포함하면 `A`는 extraneous |

예를 들어 `F = { AB -> C, A -> D, D -> C }`라면 `AB -> C`의 왼쪽 `B`는 extraneous하다. `A`만 있어도 `A -> D`와 `D -> C`를 통해 `A -> C`를 얻을 수 있기 때문이다.

반대로 `F = { AB -> CD, A -> C }`라면 `AB -> CD`의 오른쪽 `C`는 extraneous하다. `AB -> D`만 남겨도 `A -> C`와 함께 원래의 `AB -> CD`를 다시 얻을 수 있다.

![Figure 7.9](@/assets/images/cs-database-116-figure-7-9-page-355.png)
*Figure 7.9 · PDF p. 355 · canonical cover Fc 계산 절차*

`canonical cover Fc`는 다음 성질을 만족한다.

| 성질 | 의미 |
|---|---|
| Equivalent closure | `F+ = Fc+` |
| No extraneous attribute | 어떤 FD의 왼쪽/오른쪽에도 불필요한 attribute가 없다 |
| Unique left side | 같은 left-hand side를 가진 FD가 여러 개 있지 않다 |

Figure 7.9의 절차는 먼저 union rule로 같은 left side를 가진 FD를 합치고, 현재 `Fc`를 기준으로 extraneous attribute를 찾아 제거한다. 오른쪽이 빈 FD가 되면 그 FD는 삭제한다. Canonical cover는 항상 유일하지는 않다. Extraneous attribute를 어떤 순서로 제거하느냐에 따라 다른 `Fc`가 나올 수 있지만, 모두 `F`와 같은 closure를 가지면 동등하게 사용할 수 있다.

예를 들어 다음 FD 집합이 있다.

$$
F = \{ A \to BC, B \to C, A \to B, AB \to C \}
$$

`A -> BC`와 `A -> B`는 left side가 같으므로 합쳐 볼 수 있고, `AB -> C`에서는 `B -> C`가 이미 있으므로 `A`가 extraneous한 구조가 된다. 또한 `A -> BC`의 `C`는 `A -> B`와 `B -> C`로 따라오므로 제거할 수 있다. 결과 canonical cover는 다음처럼 단순해진다.

$$
F_c = \{ A \to B, B \to C \}
$$

Canonical cover는 뒤의 3NF decomposition algorithm에서 매우 중요하다. 원래 FD 집합을 그대로 사용하면 불필요하게 많은 schema가 생기거나 중복 constraint를 기준으로 분해할 수 있기 때문이다.

##### 7.4.4 Dependency Preservation

Decomposition이 dependency preserving인지도 FD 이론으로 정의할 수 있다. Relation schema `R`을 `R1, R2, ..., Rn`으로 decomposition했다고 하자. `F`를 `Ri`에 restriction한 `Fi`는 `F+` 중에서 오직 `Ri`의 attribute만 포함하는 FD들의 집합이다.

중요한 점은 restriction이 `F` 자체가 아니라 `F+`를 기준으로 정의된다는 것이다. 예를 들어 `F = { A -> B, B -> C }`이고 decomposition이 `AC`, `AB`라면, `AC`에 대한 restriction에는 원래 `F`에 없던 `A -> C`도 들어간다. `A -> C`는 `F+`에 속하고 attribute가 모두 `AC` 안에 있기 때문이다.

Decomposition이 dependency preserving이면 각 relation에서 local하게 FD를 검사하는 것만으로 원래 `F` 전체를 검사한 효과를 얻는다. Join을 수행한 뒤 constraint를 검사하지 않아도 된다는 점에서 실용적으로 중요하다.

![Figure 7.10](@/assets/images/cs-database-117-figure-7-10-page-357.png)
*Figure 7.10 · PDF p. 357 · decomposition의 dependency preservation 검사 절차*

형식적으로는 다음처럼 본다.

$$
\begin{aligned}
F_i &= \text{restriction of } F^+ \text{ to } R_i \\
F' &= F_1 \cup F_2 \cup \ldots \cup F_n \\
\text{dependency preserving} &\iff (F')^+ = F^+
\end{aligned}
$$

다만 Figure 7.10처럼 `F+`와 각 restriction을 직접 계산하는 방식은 비싸다. 원문은 두 가지 대안을 설명한다.

첫째, `F`의 각 FD가 decomposition된 relation 중 하나에서 그대로 검사 가능하면 dependency preserving임을 쉽게 보일 수 있다. 예를 들어 `α -> β`의 모든 attribute가 어떤 `Ri` 안에 있으면 그 FD는 `Ri`만 보고 검사할 수 있다. 그러나 이것은 충분조건일 뿐이다. 실패했다고 해서 곧바로 dependency preserving이 아니라고 결론내릴 수는 없다.

둘째, `F+`를 만들지 않고 각 FD `α -> β`에 대해 다음 절차를 반복한다.

```text
result = α
repeat
    for each Ri in the decomposition:
        t = (result ∩ Ri)+ ∩ Ri
        result = result ∪ t
until result does not change
```

마지막 `result`가 `β`의 모든 attribute를 포함하면 해당 FD는 보존된다. 모든 FD가 보존되면 decomposition은 dependency preserving이다. 이 검사는 exponential한 `F+` 계산을 피하고 polynomial time에 수행할 수 있다.

7.3의 `dept_advisor(s_ID, i_ID, dept_name)` 예제와 연결하면 의미가 분명해진다. BCNF decomposition으로 `(s_ID, i_ID)`와 `(i_ID, dept_name)`을 만들면 `i_ID -> dept_name`은 두 번째 relation에서 검사할 수 있다. 하지만 `s_ID, dept_name -> i_ID`는 어느 한 relation에도 세 attribute가 함께 없으므로 local하게 검사되지 않는다. 이 경우 BCNF는 얻었지만 dependency preservation을 잃는다.

#### 7.5 Algorithms for Decomposition Using Functional Dependencies

현실의 database schema는 예제보다 훨씬 크다. 그래서 “이 relation이 BCNF/3NF인지 눈으로 판단한다”가 아니라, FD 집합을 입력으로 받아 적절한 normal form의 schema 집합을 만드는 알고리즘이 필요하다.

##### 7.5.1 BCNF Decomposition

BCNF 정의는 `F+`의 모든 nontrivial FD를 보라고 하지만, `F+` 전체 계산은 비쌀 수 있다. 원문은 BCNF 검사를 두 상황으로 나눠 설명한다.

처음 relation schema `R` 자체를 검사할 때는 `F`에 주어진 FD만 확인해도 충분하다. 각 nontrivial FD `α -> β`에 대해 `α+`를 계산하고, `α+`가 `R`의 모든 attribute를 포함하는지 확인한다. 포함하면 `α`는 superkey이므로 BCNF 위반이 아니다. `F`의 어떤 FD도 BCNF를 위반하지 않으면 `F+`의 FD도 위반하지 않는다.

하지만 decomposition 후의 relation schema `Ri`를 검사할 때는 주어진 `F`만 보면 안 된다. 분해된 schema 안에서 문제를 일으키는 FD가 `F`에는 없고 `F+`에만 있을 수 있기 때문이다.

예를 들어 `R(A, B, C, D, E)`와 `F = { A -> B, BC -> D }`가 있고, 이를 `(A, B)`와 `(A, C, D, E)`로 나눴다고 하자. 원래 `F`의 두 FD 중 `(A, C, D, E)`에만 속한 FD는 없다. 그래서 얼핏 BCNF처럼 보일 수 있다. 그러나 `A -> B`와 `BC -> D`에서 pseudotransitivity로 `AC -> D`를 얻을 수 있고, 이 FD는 `(A, C, D, E)` 안에서 BCNF를 위반할 수 있다.

Decomposed relation `Ri`를 검사하는 대안은 다음과 같다.

```text
for every subset α of Ri:
    compute α+ under F
    check whether α+ includes no attribute of Ri - α
       or α+ includes all attributes of Ri
```

어떤 `α`에 대해 `α+`가 `Ri - α`의 일부 attribute는 포함하지만 `Ri` 전체를 포함하지 않는다면, 다음 FD가 `F+`에 있으면서 `Ri`의 BCNF 위반을 보인다.

$$
\alpha \to (\alpha^+ - \alpha) \cap R_i
$$

![Figure 7.11](@/assets/images/cs-database-118-figure-7-11-page-360.png)
*Figure 7.11 · PDF p. 360 · BCNF decomposition algorithm*

BCNF decomposition algorithm의 핵심은 위반 FD를 찾을 때마다 relation을 두 개로 쪼개는 것이다. 어떤 `Ri`가 BCNF가 아니고, nontrivial FD `α -> β`가 `Ri`에서 hold하며 `α+`가 `Ri` 전체를 포함하지 않는다고 하자. 또한 알고리즘은 `α ∩ β = ∅`인 형태를 사용한다. 그러면 `Ri`를 다음 두 schema로 바꾼다.

$$
\begin{aligned}
R_i - \beta \\
\alpha \cup \beta
\end{aligned}
$$

이 decomposition은 lossless다. 두 schema의 공통 부분이 `α`이고, `α -> β`가 hold하기 때문이다. 즉 공통 attribute가 `α ∪ β` 쪽을 결정하므로 lossless join 조건을 만족한다.

단, BCNF decomposition algorithm은 dependency preservation을 보장하지 않는다. 7.3의 `dept_advisor`가 바로 그 예다. 알고리즘은 redundancy를 줄이는 방향으로는 강하지만, 모든 FD를 decomposed relation에서 local하게 검사 가능하게 남겨 두지는 않을 수 있다.

원문은 `class` relation 예제로 BCNF algorithm을 보여준다.

```text
class(course_id, title, dept_name, credits,
      sec_id, semester, year, building, room_number,
      capacity, time_slot_id)
```

중요 FD는 다음과 같다.

$$
\begin{aligned}
\text{course\_id} &\to title, \text{dept\_name}, credits \\
building, \text{room\_number} &\to capacity \\
\text{course\_id}, \text{sec\_id}, semester, year &\to building, \text{room\_number}, \text{time\_slot\_id}
\end{aligned}
$$

Candidate key는 `{course_id, sec_id, semester, year}`이다. 먼저 `course_id -> title, dept_name, credits`가 hold하지만 `course_id`는 `class`의 superkey가 아니므로 BCNF 위반이다. 따라서 다음처럼 나눈다.

```text
course(course_id, title, dept_name, credits)
class-1(course_id, sec_id, semester, year,
        building, room_number, capacity, time_slot_id)
```

`course`는 `course_id`가 superkey이므로 BCNF다. 그다음 `class-1`에는 `building, room_number -> capacity`가 남아 있고, `{building, room_number}`는 `class-1`의 superkey가 아니므로 다시 나눈다.

```text
classroom(building, room_number, capacity)
section(course_id, sec_id, semester, year,
        building, room_number, time_slot_id)
```

결과는 기존 university schema에서 쓰던 `course`, `classroom`, `section`과 대응한다. 이 예제에서는 decomposition이 lossless이면서 dependency preserving이지만, BCNF algorithm이 일반적으로 dependency preservation을 보장한다는 뜻은 아니다.

##### 7.5.2 3NF Decomposition

3NF decomposition algorithm은 BCNF algorithm과 목표가 다르다. BCNF는 더 강한 normal form을 얻으려 하지만 dependency preservation을 잃을 수 있다. 3NF algorithm은 `dependency-preserving, lossless decomposition into 3NF`를 항상 만들기 위해 설계된다.

![Figure 7.12](@/assets/images/cs-database-119-figure-7-12-page-363.png)
*Figure 7.12 · PDF p. 363 · dependency-preserving, lossless decomposition into 3NF*

절차는 다음과 같다.

```text
1. Let Fc be a canonical cover for F.
2. For each FD α -> β in Fc:
       create schema Ri = α ∪ β.
3. If none of the created schemas contains a candidate key for R:
       add one schema containing any candidate key for R.
4. Remove redundant schemas contained in another schema.
5. Return the remaining schemas.
```

이 알고리즘은 `3NF synthesis algorithm`이라고도 부른다. 초기 relation을 반복해서 쪼개는 방식이 아니라, canonical cover의 FD를 기준으로 필요한 relation schema를 하나씩 합성하기 때문이다.

`dept_advisor(s_ID, i_ID, dept_name)`에 적용하면 FD는 다음 두 개다.

$$
\begin{aligned}
f_1:\ \text{i\_ID} &\to \text{dept\_name} \\
f_2:\ \text{s\_ID}, \text{dept\_name} &\to \text{i\_ID}
\end{aligned}
$$

이 FD들에는 extraneous attribute가 없으므로 `Fc = {f1, f2}`다. 알고리즘은 먼저 다음 schema를 만든다.

```text
R1(i_ID, dept_name)
R2(s_ID, dept_name, i_ID)
```

그런데 `R2`는 원래 relation 전체와 같고 candidate key도 포함한다. 또한 `R2`가 `R1`의 attribute를 모두 포함하므로 redundant schema 제거 단계에서 `R1`은 삭제될 수 있다. 결과적으로 `dept_advisor` 자체가 남는다. 이 relation은 BCNF는 아니지만 3NF이며, dependency preservation도 유지된다.

`class` relation에 3NF algorithm을 적용하면 앞에서의 FD 집합이 이미 canonical cover 역할을 하므로 `course`, `classroom`, `section`이 생성된다. 흥미롭게도 이 결과는 3NF일 뿐 아니라 BCNF이기도 하다. 그래서 원문은 실용적인 전략도 제시한다.

```text
1. First use the 3NF algorithm.
2. For any schema not in BCNF, decompose using the BCNF algorithm.
3. If dependency preservation is lost, revert to the 3NF design.
```

##### 7.5.3 Correctness of the 3NF Algorithm

3NF algorithm이 dependency preservation을 보장하는 이유는 단순하다. Canonical cover `Fc`의 각 FD `α -> β`마다 `α ∪ β`를 포함하는 schema를 만들기 때문이다. 따라서 `Fc`의 각 dependency는 적어도 하나의 relation에서 local하게 검사할 수 있다. `Fc+ = F+`이므로 원래 FD 집합의 의미도 보존된다.

Lossless decomposition은 candidate key를 포함하는 schema가 적어도 하나 존재하도록 보장해서 얻는다. 처음 만든 schema들 중 candidate key를 포함하는 것이 없으면 알고리즘이 candidate key schema를 추가한다.

3NF algorithm의 결과는 유일하지 않다. Canonical cover 자체가 여러 개일 수 있고, candidate key를 어떤 것으로 고르느냐도 달라질 수 있기 때문이다. 또한 원래 relation이 이미 3NF여도 알고리즘이 relation을 더 나눌 수 있다. 그래도 결과는 항상 3NF이며, dependency-preserving이고 lossless다.

복잡도 관점에서도 특징이 있다. 주어진 schema가 3NF인지 테스트하는 문제는 `NP-hard`지만, 3NF decomposition algorithm은 polynomial time에 구현할 수 있다. 따라서 실무 설계에서는 “검사만 하는 문제”보다 “FD에서 3NF 설계를 합성하는 문제”가 더 다루기 쉬울 수 있다.

#### 7.6 Decomposition Using Multivalued Dependencies

BCNF에 있어도 충분히 normalized되지 않은 schema가 있다. 이유는 FD가 설명하지 못하는 repetition of information이 있기 때문이다.

예를 들어 instructor가 여러 department에 속할 수 있고, 여러 address를 가질 수도 있다고 하자.

```text
inst(ID, dept_name, name, street, city)
```

처음에는 `ID -> name, street, city` 때문에 BCNF가 아니므로, BCNF decomposition을 적용해 다음처럼 나눌 수 있다.

```text
r1(ID, name)
r2(ID, dept_name, street, city)
```

이제 instructor는 여러 department에 속할 수 있고 여러 address를 가질 수 있으므로, `ID -> dept_name`도 `ID -> street, city`도 hold하지 않는다. 따라서 `r2`는 FD 관점에서는 BCNF일 수 있다. 하지만 여전히 redundancy가 있다. 한 instructor의 address가 그 instructor가 속한 department마다 반복되고, department도 address마다 반복된다.

직관적으로는 다음 두 schema가 더 자연스럽다.

```text
r21(dept_name, ID)
r22(ID, street, city)
```

문제는 FD만으로는 이 decomposition을 이끌어낼 constraint가 없다는 점이다. 그래서 `multivalued dependency(MVD)`가 필요하다.

##### 7.6.1 Multivalued Dependencies

Functional dependency는 “같은 determinant 값이면 dependent 값이 같아야 한다”는 equality constraint다. 그래서 FD는 특정 tuple 조합을 금지한다. 반면 `multivalued dependency(MVD)`는 특정 tuple들이 반드시 함께 존재해야 한다는 tuple-generating dependency다.

Relation schema `r(R)`에서 `α ⊆ R`, `β ⊆ R`일 때 MVD는 다음처럼 쓴다.

$$
\alpha \twoheadrightarrow \beta
$$

직관적으로 `α ->-> β`는 `α`와 `β` 사이의 관계가 `α`와 `R - α - β` 사이의 관계와 독립적이라는 뜻이다. 같은 `α` 값에 대해 가능한 `β` 값들의 집합과 나머지 attribute 값들의 집합이 독립이면, 그 조합들이 모두 relation에 나타나야 한다.

![Figure 7.13](@/assets/images/cs-database-120-figure-7-13-page-366.png)
*Figure 7.13 · PDF p. 366 · α ->-> β의 tuple-generating 구조*

Figure 7.13은 같은 `α` 값을 가진 두 tuple `t1`, `t2`가 있을 때, `β` 부분과 나머지 부분을 교차시킨 `t3`, `t4`도 relation 안에 있어야 함을 보여준다.

MVD가 trivial한 경우는 두 가지다.

$$
\begin{aligned}
\beta &\subseteq \alpha \\
\text{or} \\
\alpha \cup \beta &= R
\end{aligned}
$$

FD와 MVD의 차이는 다음처럼 요약할 수 있다.

| 구분 | Functional dependency(FD) | Multivalued dependency(MVD) |
|---|---|---|
| 표기 | `α -> β` | `α ->-> β` |
| 성격 | equality-generating dependency | tuple-generating dependency |
| 위반 방식 | 같은 `α`에 서로 다른 `β`가 있으면 위반 | 필요한 조합 tuple이 빠져 있으면 위반 |
| 의미 | `α`가 `β` 값을 하나로 결정 | `α` 아래의 `β` 값 집합이 나머지 값 집합과 독립 |

![Figure 7.14](@/assets/images/cs-database-121-figure-7-14-page-367.png)
*Figure 7.14 · PDF p. 367 · BCNF schema에도 남는 MVD 기반 redundancy*

Figure 7.14의 `r2(ID, dept_name, street, city)`를 보면 instructor `22222`가 Physics department와 연결되고 여러 address를 가진다. 주소와 department 소속은 서로 독립이므로, 한 department가 있으면 그 instructor의 모든 address와 조합되어야 한다.

![Figure 7.15](@/assets/images/cs-database-122-figure-7-15-page-367.png)
*Figure 7.15 · PDF p. 367 · 필요한 조합 tuple이 빠져 MVD를 위반한 r2 relation*

Figure 7.15는 illegal relation이다. `22222`가 Physics와 Math에 속하고 North/Rye, Main/Manchester 두 address를 가진다면, 다음 tuple들도 있어야 한다.

```text
(22222, Physics, Main,  Manchester)
(22222, Math,    North, Rye)
```

이 예제에서 원하는 MVD는 다음과 같다.

$$
ID \twoheadrightarrow street, city
$$

또는 동등하게 다음처럼 볼 수도 있다.

$$
ID \twoheadrightarrow \text{dept\_name}
$$

MVD에 대해 알아둘 기본 규칙은 다음 두 가지다.

$$
\begin{aligned}
\text{If } \alpha \to \beta, &\text{ then } \alpha \twoheadrightarrow \beta. \\
\text{If } \alpha \twoheadrightarrow \beta, &\text{ then } \alpha \twoheadrightarrow R - \alpha - \beta.
\end{aligned}
$$

즉 모든 FD는 MVD이기도 하다. 그래서 4NF는 BCNF보다 더 강한 조건이 된다.

##### 7.6.2 Fourth Normal Form

Relation schema `R`이 functional and multivalued dependency set `D`에 대해 `fourth normal form(4NF)`라는 것은, `D+`에 있는 모든 MVD `α ->-> β`에 대해 다음 중 하나가 성립한다는 뜻이다.

1. `α ->-> β` is trivial.
2. `α` is a superkey for `R`.

BCNF 정의에서 FD를 보던 자리에 MVD를 넣은 형태로 이해하면 된다. 모든 4NF schema는 BCNF다. 만약 어떤 schema가 BCNF가 아니라면 nontrivial FD `α -> β`가 있고 `α`가 superkey가 아니다. 그런데 `α -> β`는 `α ->-> β`를 imply하므로, 그 schema는 4NF도 될 수 없다.

Decomposition된 schema `Ri`에 대해 4NF를 검사하려면, `D`의 restriction을 써야 한다. 이때 restriction은 두 종류를 포함한다.

| restriction of `D` to `Ri` | 포함 내용 |
|---|---|
| FD restriction | `D+` 중 attribute가 모두 `Ri` 안에 있는 FD |
| MVD restriction | `α ⊆ Ri`이고 `α ->-> β`가 `D+`에 있을 때 `α ->-> β ∩ Ri` 형태의 MVD |

##### 7.6.3 4NF Decomposition

![Figure 7.16](@/assets/images/cs-database-123-figure-7-16-page-369.png)
*Figure 7.16 · PDF p. 369 · 4NF decomposition algorithm*

4NF decomposition algorithm은 BCNF decomposition algorithm과 거의 같다. 차이는 FD 대신 MVD를 사용하고, 각 `Ri`에 대한 `D+` restriction을 기준으로 위반을 찾는다는 점이다.

어떤 `Ri`가 4NF가 아니면, nontrivial MVD `α ->-> β`를 찾아 다음으로 분해한다.

$$
\begin{aligned}
R_i - \beta \\
\alpha \cup \beta
\end{aligned}
$$

`r2(ID, dept_name, street, city)`에 적용하면 `ID ->-> dept_name`이 nontrivial MVD이고 `ID`는 superkey가 아니다. 따라서 다음 두 schema로 나눈다.

```text
(ID, dept_name)
(ID, street, city)
```

이 decomposition은 instructor와 department의 다대다 관계, instructor와 address의 다중값 관계를 분리하므로 Figure 7.14의 반복을 제거한다.

MVD는 lossless decomposition을 FD보다 더 일반적으로 설명한다. Binary decomposition `R -> R1, R2`가 lossless일 필요충분조건은 다음 중 하나가 `D+`에 있는 것이다.

$$
\begin{aligned}
R_1 \cap R_2 &\twoheadrightarrow R_1 \\
\text{or} \\
R_1 \cap R_2 &\twoheadrightarrow R_2
\end{aligned}
$$

FD 기반 조건 `R1 ∩ R2 -> R1` 또는 `R1 ∩ R2 -> R2`는 이 조건의 특수한 경우다. 모든 FD가 MVD를 imply하기 때문이다.

MVD가 있는 경우 dependency preservation은 더 복잡해진다. 또한 어떤 MVD는 원래 schema 전체에서는 직접 표현되지 않다가 decomposition된 proper subset에서만 나타날 수 있는데, 이를 `embedded multivalued dependency`라고 한다. 원문은 이런 경우가 드물고 자세한 이론은 Chapter 28에서 다룬다고 넘긴다.

#### 7.7 More Normal Forms

4NF가 마지막 normal form은 아니다. MVD를 일반화한 `join dependency`는 `project-join normal form(PJNF)`로 이어진다. PJNF는 일부 책에서 `fifth normal form(5NF)`라고도 부른다. 더 일반적인 constraint는 `domain-key normal form(DKNF)`로 이어진다.

하지만 PJNF와 DKNF는 실무에서 드물게 사용된다. 이유는 constraint 자체가 복잡하고, 이를 다루기 위한 sound and complete inference rules가 없기 때문이다. 반면 `second normal form(2NF)`은 역사적 의미가 크고 3NF보다 실질적 이점이 없어서 본문에서는 깊게 다루지 않는다.

#### 7.8 Atomic Domains and First Normal Form

E-R model은 `multivalued attribute`와 `composite attribute`를 허용한다. 예를 들어 `phone_number`처럼 여러 값을 갖는 attribute나, `address(street, city, state)`처럼 내부 구조가 있는 attribute가 가능하다. 그러나 relational model에서는 attribute 값이 더 이상 쪼개지지 않는 단위라고 보는 것이 기본이다.

`domain`이 atomic하다는 것은 domain element를 indivisible unit으로 취급한다는 뜻이다. Relation schema `R`의 모든 attribute domain이 atomic이면 `first normal form(1NF)`이다.

Non-atomic value의 예는 다음과 같다.

| 예 | 왜 non-atomic인가 |
|---|---|
| `children` attribute가 이름들의 set | set 내부 원소를 DB가 의미 있게 다룬다 |
| `address`가 `street`, `city`를 포함하는 composite value | component attribute로 쪼갤 수 있다 |
| `CS001` 같은 encoded identifier를 부서 코드 `CS`와 번호 `001`로 해석 | 문자열 일부에 별도 의미를 부여한다 |

중요한 점은 domain 자체보다 “DB application이 값을 어떻게 사용하는가”다. Integer는 보통 atomic하다고 보지만, 숫자의 각 digit을 나눠 의미 있게 해석하는 application이라면 그 사용 방식에서는 atomic하지 않다.

Course identifier `CS-101`도 사람이 보기에는 `CS`가 department를 뜻하는 것처럼 보인다. 하지만 database application이 `course_id`를 쪼개 department를 찾지 않고, `dept_name` attribute를 별도로 사용한다면 `course_id` domain은 atomic하게 취급될 수 있다.

Set-valued attribute는 redundancy와 inconsistency를 만들 수 있다. 예를 들어 instructor마다 가르치는 section set을 저장하고, section마다 instructor set도 저장하면 같은 teaches 관계가 두 곳에 반복된다. 한쪽만 update하면 inconsistent state가 된다. 반대로 한쪽만 저장하면 특정 query가 어려워진다. 그래서 relational design에서는 보통 별도 relationship relation으로 표현한다.

다만 원문은 non-atomic value가 항상 나쁘다고 말하지 않는다. 복잡한 구조의 entity를 다루는 domain에서는 composite-valued attribute나 set-valued attribute가 application programmer의 부담을 줄일 수 있다. 실제 modern database systems는 복잡한 data type을 지원하며, 이런 내용은 Chapter 29에서 다룬다. 그러나 이 장의 relational design theory는 기본적으로 1NF relation을 가정한다.

#### 7.9 Database-Design Process

지금까지는 어떤 relation schema `r(R)`가 주어졌다고 가정하고 normalization을 수행했다. 실제 설계에서는 `r(R)`가 생기는 경로가 여러 가지다.

| 출처 | 설명 |
|---|---|
| E-R diagram 변환 | E-R design에서 relation schemas가 생성된다 |
| Universal relation approach | 관심 있는 모든 attribute를 하나의 큰 relation schema로 두고 normalization으로 분해한다 |
| Ad hoc design | 직관적으로 만든 relation schemas를 normal form으로 검사한다 |

##### 7.9.1 E-R Model and Normalization

E-R diagram을 신중하게 만들면, 거기서 생성된 relation schemas는 보통 추가 normalization이 많이 필요하지 않다. Entity set과 relationship set을 제대로 분리하면 많은 FD/MVD 문제가 애초에 발생하지 않기 때문이다.

예를 들어 instructor entity set에 `dept_name`과 `dept_address`를 함께 넣고 `dept_name -> dept_address`가 hold한다면, 이는 instructor relation에서 normalization 문제가 된다. 더 좋은 E-R design은 `department` entity set을 만들고, instructor와 department 사이의 relationship set을 두는 것이다.

MVD와 4NF 문제도 E-R design이 잘 되어 있으면 대체로 자연스럽게 피할 수 있다. Many-to-many relationship set은 별도 relationship schema로 생성되고, multivalued attribute는 entity key와 해당 multivalued attribute를 포함하는 별도 schema로 생성되기 때문이다.

##### 7.9.2 Naming of Attributes and Relationships

좋은 설계에는 `unique-role assumption`도 중요하다. 각 attribute name은 database 전체에서 고유한 의미를 가져야 한다. 예를 들어 instructor의 phone number와 classroom의 room number를 모두 `number`라고 부르면, 두 relation을 join했을 때 attribute 이름만 보고 의미를 판단하기 어렵다.

반대로 서로 다른 relation의 attribute가 같은 의미라면 같은 이름을 쓰는 것이 좋다. 원문은 instructor와 student의 `name`을 같은 attribute name으로 쓴 이유를 설명한다. 나중에 `person`이라는 generalization을 만들 가능성이 있다면 이름을 맞춰 두는 편이 낫다.

관례적으로 schema의 attribute 순서는 이론적으로 중요하지 않지만, primary-key attributes를 앞에 두면 `select *` 같은 기본 출력이 읽기 쉬워진다. Relationship set 이름은 관련 entity set 이름을 이어 붙이기도 하지만, `teaches`, `takes`처럼 의미 있는 동사를 쓰는 편이 더 명확할 때도 있다. 중요한 것은 singular/plural 같은 naming convention을 database 전체에서 일관되게 유지하는 것이다.

##### 7.9.3 Denormalization for Performance

`denormalization`은 normalized schema를 일부러 non-normalized하게 만들어 특정 workload 성능을 높이는 과정이다. 예를 들어 course를 조회할 때마다 prerequisite 정보를 항상 함께 보여줘야 한다면, normalized schema에서는 `course`와 `prereq`를 매번 join해야 한다.

성능을 위해 `course`와 `prereq`의 join 결과를 물리적으로 저장하면 조회는 빨라질 수 있다. 하지만 course 정보가 prerequisite마다 반복되고, prerequisite가 추가/삭제될 때 모든 중복 copy를 application이 일관되게 update해야 한다.

더 나은 대안은 normalized schema를 유지하면서 `materialized view`를 쓰는 것이다. Materialized view도 저장 공간과 갱신 비용이 있지만, view를 최신 상태로 유지하는 책임이 application programmer가 아니라 DBMS에 있다.

##### 7.9.4 Other Design Issues

Normalization이 모든 나쁜 설계를 잡아내지는 못한다. 대표적인 예가 time 또는 range of time을 다루는 설계다.

부서별 연도별 instructor 수를 저장한다고 하자. 좋은 설계는 다음처럼 year를 attribute로 둔다.

```text
total_inst(dept_name, year, size)
```

FD는 다음과 같고, 이 relation은 BCNF다.

$$
\text{dept\_name}, year \to size
$$

하지만 다음처럼 연도별 relation을 따로 만들 수도 있다.

```text
total_inst_2017(dept_name, size)
total_inst_2018(dept_name, size)
total_inst_2019(dept_name, size)
```

각 relation만 보면 BCNF지만, 매년 새 relation을 만들고 query도 매년 고쳐야 하므로 나쁜 설계다. 또 다음처럼 연도별 column을 만들 수도 있다.

```text
dept_year(dept_name, total_inst_2017, total_inst_2018, total_inst_2019)
```

이것도 BCNF일 수 있지만, 매년 schema 변경이 필요하고 query가 복잡해진다. 이런 형태처럼 attribute value가 되어야 할 것을 column으로 펼친 표현을 `crosstabs`라고 한다. Crosstab은 spreadsheet, report, data analysis display에는 유용하지만 base database design에는 부적절하다.

#### 7.10 Modeling Temporal Data

`temporal data`는 어떤 사실이 유효한 time interval을 함께 갖는 data다. 예를 들어 instructor address의 현재 값뿐 아니라 과거 address까지 저장하려면, 각 address에 start date와 end date가 필요하다. 현재 유효한 tuple은 `end`에 `null` 또는 먼 미래 날짜인 `9999-12-31` 같은 값을 둘 수 있다.

Temporal data modeling이 어려운 이유는 시간 변화가 여러 수준에서 생기기 때문이다.

| temporal variation 대상 | 예 |
|---|---|
| attribute value | instructor의 address가 시간에 따라 바뀜 |
| entity | student가 입학일부터 졸업일까지 valid |
| relationship | 어떤 course가 다른 course의 prerequisite이 된 기간 |

E-R diagram에 이런 valid time interval을 모두 넣으면 모델이 매우 복잡해진다. 그래서 실무에서는 먼저 temporal change를 무시하고 일반 E-R/relational design을 만든 뒤, temporal variation을 추적해야 하는 relation에 `start`, `end` attribute를 추가하는 방식을 자주 쓴다.

![Figure 7.17](@/assets/images/cs-database-124-figure-7-17-page-377.png)
*Figure 7.17 · PDF p. 377 · course relation에 valid time interval을 추가한 temporal relation*

Temporal version of `course` relation은 다음과 같다.

```text
course(course_id, title, dept_name, credits, start, end)
```

SQL:2011 표준에서는 interval이 `[start, end)` 형태다. 즉 `start` 시점에는 tuple이 valid이고, `end` 시점 바로 전까지 valid하지만 `end` 시점에는 invalid다. 이렇게 하면 한 tuple의 `end`가 다음 tuple의 `start`와 같아도 interval이 overlap하지 않는다.

Figure 7.17에서 `CS-201`은 title이 시간에 따라 바뀐다. 2020-01-01에 “Intro. to Scala”로 다시 바뀐다면, 기존 “Intro. to Python” tuple의 `end`를 `2020-01-01`로 바꾸고 새 tuple을 추가한다.

```text
(CS-201, Intro. to Scala, Comp. Sci., 4, 2020-01-01, 9999-12-31)
```

Temporal relation에서는 기존 FD가 그대로 hold하지 않을 수 있다.

$$
\text{course\_id} \to title, \text{dept\_name}, credits
$$

위 FD는 temporal `course` 전체에서는 깨진다. 같은 `course_id`가 시간에 따라 다른 `title`을 가질 수 있기 때문이다. 대신 “어떤 특정 time `t`의 snapshot에서는 course_id가 하나의 title/dept_name/credits를 결정한다”는 제약이 성립한다. 이를 `temporal functional dependency`라고 한다.

`snapshot`은 특정 시점의 data 상태다. 형식적으로 temporal FD `α ->τ β`는 모든 legal instance의 모든 snapshot에서 일반 FD `α -> β`가 만족된다는 뜻이다.

Temporal primary key도 단순히 `start`, `end`를 key에 추가하는 것으로는 부족하다. 같은 key 값의 tuple들이 같은 `(start, end)`를 갖지 않더라도, valid time interval이 overlap할 수 있기 때문이다. Temporal primary key는 같은 key 값의 tuple들이 서로 overlap하지 않도록 보장해야 한다.

Temporal foreign key는 더 복잡하다. Referencing tuple의 valid interval 전체가 referenced relation의 matching tuple들의 valid intervals로 cover되어야 한다. 정확히 같은 interval을 가진 tuple 하나가 있을 필요는 없지만, 하나 이상의 referenced tuple interval들의 union이 referencing tuple의 interval을 덮어야 한다.

Transcript 예제로 보면 `takes.course_id`는 course를 참조하지만, 학생이 수강한 시점의 course title을 참조해야 한다. 따라서 `takes`의 `year`, `semester`를 대표 날짜로 변환하거나, semester 기간 interval로 두고 temporal course tuple 중 해당 기간과 overlap하는 tuple을 찾아야 한다.

SQL:2011은 temporal data를 위해 `period for validtime(start, end)` 같은 선언을 지원한다. Temporal primary key는 다음처럼 표현할 수 있다.

```sql
primary key (course_id, validtime without overlaps)
```

PostgreSQL처럼 temporal primary key를 직접 지원하지 않는 DBMS에서는 range type과 overlap operator로 우회할 수 있다.

```sql
exclude (course_id with =, validtime with &&)
```

이 constraint는 같은 `course_id`를 가진 두 tuple의 `validtime` interval이 overlap하지 않도록 한다.

Temporal relational algebra도 일반 연산과 다르다. Selection과 projection은 input tuple의 valid time을 유지한다. Temporal join에서는 결과 tuple의 valid time이 두 input tuple interval의 intersection이 된다. 두 interval이 overlap하지 않으면 join 결과 tuple은 버린다.

#### 7.11 Summary

Chapter 7의 큰 결론은 relational design의 목표가 단순히 “작게 쪼개기”가 아니라는 점이다. 좋은 design은 다음을 함께 고려한다.

| 목표 | 관련 개념 |
|---|---|
| Repetition of information 제거 | FD, BCNF, MVD, 4NF |
| Inability to represent information 방지 | lossless decomposition, 적절한 entity/relationship 분리 |
| Constraint enforcement 가능성 | dependency preservation, canonical cover, 3NF |
| 현실적인 query/update 성능 | denormalization, materialized view |
| 시간에 따른 사실 표현 | temporal data, temporal FD, temporal primary key/foreign key |

BCNF는 redundancy 제거에 강하지만 dependency preservation을 잃을 수 있다. 3NF는 BCNF보다 약하지만 lossless와 dependency preservation을 항상 확보할 수 있다. 4NF는 FD만으로 설명되지 않는 MVD 기반 redundancy를 제거한다. 1NF는 이론의 출발점으로, attribute domain을 atomic하게 취급한다.

Normalization은 중요한 도구지만 모든 나쁜 설계를 잡아내지는 못한다. Crosstab처럼 BCNF여도 schema evolution과 query maintenance가 나쁜 설계가 있고, temporal data처럼 시간의 의미를 명시적으로 모델링해야 하는 경우도 있다.

## 연결 관계

Chapter 6의 E-R design은 relation schema를 만드는 출발점이다. Chapter 7은 그 결과 schema가 `FD`, `MVD`, `normal form`, `decomposition` 관점에서 좋은지 검증하고 개선한다. 잘 만든 E-R design은 많은 normalization 문제를 미리 피하지만, FD/MVD 분석은 설계 오류를 찾아내는 formal check 역할을 한다.

Chapter 2의 relational model과 key 개념은 여기서 `superkey`, `candidate key`, `primary key`로 다시 등장한다. Chapter 3-5의 SQL 제약과 view/materialized view 논의는 dependency enforcement, denormalization, temporal constraint 구현과 연결된다.

Chapter 8 이후의 application design/data types와도 이어진다. 1NF는 atomic domain을 가정하지만, 실제 application에서는 complex data type, semistructured data, temporal/spatial/text data가 필요할 수 있다. 즉 Chapter 7은 classical relational design theory의 중심이고, 이후 장은 이 이론을 현실적 데이터 모델로 확장한다.

## 오해하기 쉬운 내용

| 오해 | 정리 |
|---|---|
| BCNF면 항상 최고의 설계다 | BCNF는 dependency preservation을 잃을 수 있고, MVD redundancy는 BCNF로도 남을 수 있다 |
| 3NF는 BCNF보다 항상 나쁜 타협이다 | 3NF는 lossless와 dependency preservation을 보장하기 위한 의도적 완화다 |
| `F`에 없는 FD는 고려하지 않아도 된다 | `F+`에 있는 FD가 BCNF/3NF 위반을 만들 수 있다 |
| Attribute closure는 이론용이다 | `α+`는 superkey 검사, FD implication 검사, decomposition 검사에 직접 쓰이는 핵심 알고리즘이다 |
| Decomposition은 relation을 나누기만 하면 된다 | 반드시 lossless인지, 가능하면 dependency preserving인지 확인해야 한다 |
| MVD는 FD의 다른 이름이다 | FD는 equality-generating, MVD는 tuple-generating constraint다 |
| 1NF는 “문자열을 절대 쪼개면 안 된다”는 뜻이다 | 값이 atomic한지는 application이 그 내부 구조를 의미 있게 사용하는지에 달려 있다 |
| Normal form만 만족하면 좋은 설계다 | Naming, temporal modeling, crosstab 회피, 성능 목적 denormalization도 별도로 판단해야 한다 |

## 면접 질문

1. `lossless decomposition`과 `lossy decomposition`의 차이를 projection과 join 관점에서 설명하라.
2. `functional dependency(FD)`와 `superkey`의 관계를 `K -> R`로 설명하라.
3. BCNF 정의를 말하고, `α -> β`에서 `α`가 superkey가 아니면 왜 문제가 되는지 설명하라.
4. 3NF가 BCNF보다 약한 조건을 허용하는 이유를 `dependency preservation` 관점에서 설명하라.
5. `Armstrong's axioms`의 세 가지 규칙과 `attribute closure(α+)`의 용도를 설명하라.
6. `canonical cover(Fc)`가 무엇이며 3NF decomposition algorithm에서 왜 필요한지 설명하라.
7. BCNF decomposition algorithm이 왜 lossless를 보장하는지, 그리고 왜 dependency preservation은 보장하지 않는지 설명하라.
8. `multivalued dependency(MVD)`가 FD로 표현하지 못하는 redundancy를 어떻게 설명하는지 예를 들어 말하라.
9. 4NF가 BCNF보다 강한 이유를 “모든 FD는 MVD이기도 하다”는 성질로 설명하라.
10. `temporal functional dependency`, `temporal primary key`, `temporal join`이 일반 FD/key/join과 어떻게 다른지 설명하라.
