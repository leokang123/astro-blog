---
title: "Chapter 11. Data Analytics"
order: 11
pubDatetime: 2026-05-18T00:16:00+09:00
modDatetime: 2026-05-18T00:16:00+09:00
description: "Database System Concepts 정리: Chapter 11. Data Analytics"
tags:
  - "Database"
  - "CS"
---

## 개요

Data analytics는 과거 data를 처리해 pattern, correlation, prediction model을 찾고, 그 결과를 business decision에 사용하는 넓은 분야다. Online advertisement가 user에게 어떤 광고를 보여 줄지 결정하는 낮은 단가의 대량 decision부터, 제조·유통 기업이 몇 달 뒤 판매될 물량을 예측해 생산·재고를 결정하는 높은 단가의 decision까지 모두 analytics의 대상이 된다.

Chapter 11은 analytics를 database 관점에서 본다. 핵심 흐름은 여러 source의 data를 data warehouse에 모으고, OLAP으로 aggregate와 multidimensional summary를 빠르게 탐색하며, data mining/machine learning으로 classification, regression, association rule, clustering 같은 prediction/discovery task를 수행하는 것이다.

## 핵심 개념

- `data analytics`는 data에서 pattern, correlation, prediction model을 추론하고 decision-making에 활용하는 처리 전반을 뜻한다.
- `data warehouse`는 여러 source의 data를 unified schema 아래 한 위치에 모아 analysis를 쉽게 하는 저장소다.
- `ETL(extract, transform, load)`은 source에서 data를 추출하고, cleaning/deduplication/schema transformation을 거쳐 warehouse에 적재하는 과정이다.
- `OLAP(online analytical processing)`은 대량 data의 aggregate query를 거의 real time으로 답해 analyst가 다양한 관점에서 data를 탐색하게 하는 system이다.
- `business intelligence(BI)`는 data analytics와 비슷한 넓은 의미로 쓰이고, `decision support`는 reporting/aggregation 중심의 더 좁은 의미로 쓰인다.
- `data mining`은 machine-learning 기반 knowledge-discovery technique을 매우 큰 database에서 효율적으로 실행하는 분야다.

## 세부 정리

### 11.1 Overview of Analytics

기업의 decision-making은 과거 data를 이용해 미래를 예측할 때 큰 이익을 얻는다. Online advertisement system은 user profile과 과거 action, 비슷한 user의 반응을 바탕으로 어떤 advertisement를 보여 줄지 결정한다. 개별 decision의 가치는 작아도 volume이 크기 때문에 전체 가치는 매우 크다. 반대로 제조·유통의 demand prediction은 한 번의 decision 가치가 크고, 잘못 예측하면 unsold inventory나 lost revenue로 이어진다.

Data analytics는 다음 작업들을 포함한다.

| 영역 | 목적 |
|---|---|
| aggregate/report generation | 조직에 의미 있는 요약과 report 생성 |
| visualization/dashboard | sales, expenses, returns 같은 key parameter를 chart로 모니터링 |
| OLAP | 큰 data에 대해 다양한 aggregate view를 거의 즉시 탐색 |
| statistical analysis | 통계적 분석과 graph display, R/SAS/SPSS 같은 도구 활용 |
| prediction/modeling | 과거 data로 loan default, sales, ad response 같은 미래 값/class 예측 |
| data mining | large database에서 pattern과 prediction model을 효율적으로 발견 |

Large company는 여러 data source를 가진다. Source마다 schema가 다르고, performance나 organizational control 때문에 다른 부서가 source에 on demand로 직접 접근하지 못할 수 있다. 그래서 data를 여러 source에서 모아 하나의 `data warehouse`에 적재한다. Data warehouse는 analysis를 위해 설계된 unified schema를 제공하며, 효율을 위해 redundant storage를 허용할 수 있다.

Data warehouse 구축에는 단순 복사 이상의 작업이 필요하다. Source data에는 error가 있을 수 있고, 여러 source에서 수집한 data가 duplicate일 수 있다. 이를 detect/correct/deduplicate하고 warehouse schema에 맞게 적재하는 과정이 `extract, transform and load(ETL)`이다.

Analytics의 가장 기본 형태는 aggregate와 report다. Analyst는 여러 aggregate를 비교해 pattern을 찾고, chart와 dashboard를 통해 anomaly나 business change의 원인을 탐색한다. Aggregate query를 tens of minutes나 hours가 아니라 거의 real time으로 답하는 system이 `OLAP`이다.

Prediction task에서는 past data의 feature를 찾아 model을 만든다. 예를 들어 bank는 과거 loan default history에서 salary, education level, job history 같은 feature와 default 사이의 관계를 학습하고, 새 applicant의 feature를 model에 넣어 default likelihood를 예측한다. Car company는 customer attribute와 car type purchase의 관계를 찾아 marketing target을 정할 수 있다.

`business intelligence(BI)`는 data analytics와 비슷하게 넓게 쓰이는 용어다. `decision support`는 reporting과 aggregation 중심이며, machine learning/data mining은 포함하지 않는 더 좁은 의미로 쓰인다. Decision-support query는 많은 data를 읽는 SQL query인 경우가 많고, OLTP query처럼 소량 data를 읽고 작은 update를 수행하는 transaction query와 대비된다.

### 11.2 Data Warehousing

Large organization의 data는 여러 operational system, 여러 schema, 여러 location에 흩어져 있다. Manufacturing-problem data와 customer-complaint data가 서로 다른 database에 있을 수 있고, credit score나 mailing list처럼 외부 source에서 구매한 data도 decision에 쓰인다. Decision maker가 각 source를 직접 query하는 것은 번거롭고 비효율적이며, source가 current data만 보관하는 경우 historical analysis도 어렵다.

`data warehouse`는 multiple source에서 모은 information을 single site의 unified schema 아래 저장하는 repository/archive다. Warehouse는 long-term historical data를 보관하고, decision-support query가 OLTP system의 workload를 방해하지 않도록 분리한다.

#### 11.2.1 Components of a Data Warehouse

![Figure 11.1](@/assets/images/cs-database-163-figure-11-1-page-551.png)
*Figure 11.1 · PDF p. 551 · 여러 data source에서 loader를 거쳐 data warehouse에 적재하고 query/analysis tool이 접근하는 architecture*

Figure 11.1은 data source, data loader, data warehouse, DBMS, query and analysis tools의 흐름을 보여 준다. Warehouse 구축에서 중요한 문제는 다음과 같다.

| 문제 | 핵심 내용 |
|---|---|
| when/how to gather data | source-driven 또는 destination-driven 방식으로 source data를 warehouse로 가져옴 |
| schema choice | 여러 source의 schema/data model을 integrated schema로 변환 |
| data transformation/cleansing | error correction, fuzzy lookup, deduplication, householding, unit/schema conversion |
| update propagation | source update를 warehouse에 반영, materialized view maintenance와 연결 |
| summary selection | raw data 전체 대신 aggregate summary를 저장할지 결정 |

`source-driven architecture`에서는 source가 transaction processing 중 또는 주기적으로 new information을 warehouse에 전송한다. `destination-driven architecture`에서는 warehouse가 source에 new data를 요청한다. Synchronous replication을 하지 않으면 warehouse는 source보다 조금 뒤처질 수 있다. 전통적으로 analyst는 yesterday’s data로 충분했지만, 점점 더 fresh data가 요구된다. Real-time event response가 필요하면 Chapter 10의 stream processing infrastructure가 더 적합할 수 있다.

`data cleansing`은 source data의 minor inconsistency를 수정하는 과정이다. Name misspelling, wrong postal code, address inconsistency는 street/postal-code database와 비교해 어느 정도 바로잡을 수 있다. 이런 approximate matching을 `fuzzy lookup`이라고 한다. 여러 source의 address list에서 duplicate를 제거하는 작업은 `merge-purge` 또는 `deduplication`이고, 같은 household의 여러 개인 record를 묶어 하나의 mailing만 보내도록 하는 작업은 `householding`이다.

Data transformation은 cleansing을 넘어 단위 변환, schema 변환, 여러 source relation의 join을 포함한다. Current generation warehouse에서는 source에서 추출해 transform한 뒤 load하는 `ETL(extract, transform, load)`뿐 아니라, 먼저 warehouse에 load한 뒤 warehouse의 parallel processing이나 user-defined function/MapReduce framework로 transform하는 `ELT(extract, load, transform)`도 쓰인다.

#### 11.2.2 Multidimensional Data and Warehouse Schemas

Data warehouse schema는 analysis와 OLAP을 위해 설계된다. 핵심 구분은 `fact table`과 `dimension table`이다.

| Table/attribute | 의미 | 예 |
|---|---|---|
| `fact table` | individual event를 기록하는 매우 큰 table | item sale tuple |
| `measure attribute` | aggregate 가능한 quantitative value | number sold, price |
| `dimension attribute` | measure를 group/view하는 기준 | item_id, store_id, customer_id, date |
| `dimension table` | dimension identifier의 상세 속성 저장 | item_info, store, customer, date_info |

Measure attribute와 dimension attribute로 모델링할 수 있는 data를 `multidimensional data`라고 한다. Sales fact table은 item, store, customer, date dimension과 number/price measure를 가질 수 있다. Dimension attribute는 보통 짧은 identifier이며, dimension table의 foreign key가 된다.

![Figure 11.2](@/assets/images/cs-database-164-figure-11-2-page-554.png)
*Figure 11.2 · PDF p. 554 · sales fact table을 중심으로 item_info, store, customer, date_info dimension table이 연결된 star schema*

Figure 11.2의 `star schema`는 중앙의 fact table `sales`가 여러 dimension table을 foreign key로 참조하는 구조다. `sales(item_id, store_id, customer_id, date, number, price)`에서 `number`, `price`는 measure이고, 나머지는 dimension이다. `item_info`에는 item name/category/color/size가, `store`에는 city/state/country가, `date_info`에는 month/quarter/year가 들어간다.

`snowflake schema`는 dimension table이 다시 다른 dimension table을 참조하는 더 정규화된 구조다. 예를 들어 `item_info`가 `manufacturer_id`를 가지고 manufacturer detail table을 참조하면 star보다 snowflake에 가깝다. 복잡한 warehouse는 multiple fact table도 가질 수 있다.

#### 11.2.3 Database Support for Data Warehouses

Data warehouse용 DBMS 요구는 transaction-processing DBMS와 다르다.

| 구분 | OLTP database | Data warehouse |
|---|---|---|
| query 수 | 매우 많음 | 상대적으로 적음 |
| query당 접근량 | 소량 data, 작은 update 포함 | 대량 data scan/aggregate |
| update pattern | 빈번한 insert/update/delete | 주로 append, 오래된 data delete 가능, existing record update 드묾 |
| concurrency control | 필수 | overhead가 상대적으로 덜 필요 |
| storage layout | row-oriented가 유리한 경우 많음 | column-oriented가 유리 |

Warehouse relation은 new record insertion은 있지만, 한 번 추가된 record가 update되는 일은 드물다. 따라서 concurrent read/write conflict를 막기 위한 concurrency control overhead가 거의 필요 없다. OLTP에서 long read-only transaction과 update transaction 충돌을 피하기 위해 multiple versions를 저장하는 비용도 warehouse에서는 줄일 수 있다.

`row-oriented storage`는 tuple의 모든 attribute를 함께 저장한다. 반면 `column-oriented storage`는 relation의 각 attribute를 별도 file에 저장하고, 같은 attribute의 successive tuple value를 연속 배치한다. Fixed-size type이라면 i번째 tuple의 attribute A 값은 A file에서 `(i - 1) * size(A)` offset에 있다.

Column-oriented storage의 장점은 두 가지다.

| 장점 | 설명 |
|---|---|
| 불필요한 attribute I/O 감소 | query가 많은 attribute 중 일부만 필요하면 해당 column만 읽음 |
| compression 효율 증가 | 같은 type/value pattern이 모여 있어 압축률이 높아짐 |

단점은 single tuple 저장/조회에 여러 I/O가 필요하다는 점이다. 따라서 OLTP에는 잘 맞지 않지만, 많은 tuple을 scan하고 aggregate하는 warehouse workload에는 널리 쓰인다.

Big Data system도 warehouse infrastructure의 일부가 되었다. Web log처럼 file에 저장된 large-scale data를 분석하기 위해 Hadoop/Hive/Spark 같은 system이 사용된다. ORC, Parquet 같은 compressed columnar file format은 records with columns를 file에 저장하고 SQL query와 잘 연결되므로 warehouse와 Big Data processing을 이어 준다.

### 11.3 Online Analytical Processing

`OLAP(online analytical processing)`은 analyst가 큰 data를 여러 grouping 기준으로 즉시 바꿔 보며 pattern을 찾도록 하는 분석 방식이다. Retail sales를 product, date/month, color/size, customer profile별로 group하고 aggregate하는 식의 작업이 대표적이다.

#### 11.3.1 Aggregation on Multidimensional Data

예제 relation은 `sales(item name, color, clothes size, quantity)`이다. `quantity`는 팔린 수량을 나타내므로 `measure attribute`이고, `item name`, `color`, `clothes size`는 group/view 기준이므로 `dimension attribute`다. 현실의 sales relation은 time, sales location 같은 dimension과 monetary value 같은 measure를 더 가진다.

![Figure 11.4](@/assets/images/cs-database-166-figure-11-4-page-558.png)
*Figure 11.4 · PDF p. 558 · item name과 color별 quantity 합계를 보여 주는 cross-tabulation*

`cross-tabulation(cross-tab)` 또는 `pivot-table`은 relation에서 한 attribute의 value를 column header로, 다른 attribute의 value를 row header로 배치한 2차원 summary다. Figure 11.4에서는 `color`가 column, `item name`이 row가 되고, 각 cell은 해당 `(item name, color)` 조합의 `quantity` 합계다. `clothes size: all`은 small/medium/large를 모두 합산했다는 뜻이다. Cross-tab에는 보통 row total과 column total 같은 summary row/column이 함께 붙는다.

![Figure 11.5](@/assets/images/cs-database-167-figure-11-5-page-559.png)
*Figure 11.5 · PDF p. 559 · item name, color, clothes size 세 dimension으로 구성한 data cube*

Cross-tab을 n차원으로 일반화한 것이 `data cube`다. Figure 11.5의 cube는 `item name`, `color`, `clothes size` 3개 dimension과 `quantity` measure를 가진다. 특정 dimension 값이 `all`이면 그 dimension의 모든 값을 aggregate한 summary cell을 의미한다. Dimension이 n개면 가능한 grouping subset이 최대 `2^n`개라서, dimension 수가 조금만 늘어도 aggregate 조합 수가 급격히 증가한다.

OLAP에서 자주 쓰는 조작은 다음과 같다.

| Operation | 의미 | 예 |
|---|---|---|
| `pivoting` | cross-tab에 놓을 dimension을 바꿈 | item name × color에서 item name × clothes size로 변경 |
| `slicing` | 한 dimension을 특정 값으로 고정 | clothes size = large만 봄 |
| `dicing` | 여러 dimension을 특정 값으로 고정 | size = large, region = North만 봄 |
| `rollup` | fine granularity에서 coarse granularity로 aggregate | day → month → quarter → year |
| `drill down` | coarse granularity에서 더 세부 수준으로 내려감 | region → country → state → city |

`drill down`은 coarse summary에서 finer data를 새로 만들어 내는 것이 아니다. 더 세밀한 original data 또는 더 fine-grained summary가 있어야 한다. 따라서 warehouse/OLAP system은 analyst가 내려갈 수 있는 granularity를 고려해 source data와 summary를 보관해야 한다.

![Figure 11.6](@/assets/images/cs-database-168-figure-11-6-page-560.png)
*Figure 11.6 · PDF p. 560 · time hierarchy와 location hierarchy로 rollup/drill down 수준을 정의하는 구조*

Dimension은 서로 다른 detail level을 가진 `hierarchy`로 조직될 수 있다. Time은 hour of day, day of week, date, month, quarter, year 같은 level을 가질 수 있고, location은 city, state, country, region으로 올라갈 수 있다. Clothing 예제에서는 skirt/dress가 womenswear, pants/shirt가 menswear category 아래에 놓일 수 있다. Analyst는 category 수준의 aggregate를 본 뒤 item name 수준으로 drill down하거나, 반대로 item name에서 category로 drill up할 수 있다.

#### 11.3.2 Relational Representation of Cross-Tabs

Cross-tab은 실제 database에 저장되는 relation과 다르다. Data value가 column 이름이 되기 때문에 value가 늘어나면 column도 바뀐다. 저장에는 부적합하지만 user display에는 유용하다. Database 내부에서는 fixed number of columns를 가진 relational representation으로 표현하는 것이 자연스럽다.

![Figure 11.8](@/assets/images/cs-database-170-figure-11-8-page-562.png)
*Figure 11.8 · PDF p. 562 · Figure 11.4의 cross-tab을 all 값을 이용해 relation 형태로 표현한 결과*

Figure 11.8은 summary row/column을 `all`이라는 special value로 나타낸다. 예를 들어 `(skirt, all, all, 53)`은 `item name = skirt`에 대해 모든 color와 모든 clothes size를 합산한 tuple이다. SQL standard는 실제로 `all` 대신 `null`을 사용하지만, 일반 null과 혼동될 수 있어 설명에서는 `all`로 구분한다.

Hierarchy도 relation으로 표현한다. 예를 들어 `itemcategory(item name, category)`를 `sales`와 join하면 item name 위의 category level을 포함한 cross-tab을 aggregate할 수 있다. Location hierarchy는 `city hierarchy(ID, city, state, country, region)` 같은 하나의 relation으로 만들 수도 있고, 각 level 사이 mapping relation 여러 개로 만들 수도 있다. City name 중복 같은 문제를 피하려면 city identifier가 필요하다.

#### 11.3.3 OLAP in SQL

OLAP query는 여러 aggregate를 interactive하게 생성해야 하므로, 단순 `group by`만으로 매번 많은 query를 작성하면 느리고 번거롭다. 그래서 SQL은 `pivot`, `cube`, `rollup`, `grouping sets` 같은 OLAP 확장을 제공한다.

![Figure 11.9](@/assets/images/cs-database-171-figure-11-9-page-563.png)
*Figure 11.9 · PDF p. 563 · sales relation에 SQL pivot operation을 적용해 color value를 column으로 만든 결과*

`pivot` clause는 특정 attribute value를 결과 column으로 만든다. 예제에서는 `color in ('dark','pastel','white')`가 `dark`, `pastel`, `white` column이 되고, cell 값은 `sum(quantity)`로 채워진다. 단, `pivot`만으로 Figure 11.4의 subtotal까지 자동 생성되지는 않는다. Subtotal을 포함하려면 먼저 `cube` 등으로 Figure 11.8 같은 relational representation을 만든 뒤 pivot해야 한다.

`cube`는 dimension attribute의 모든 subset에 대해 grouping을 생성한다. 예를 들어 `group by cube(item name, color, clothes size)`는 다음 8개 grouping을 한 query로 만든다.

```sql
{ (item name, color, clothes size), (item name, color),
  (item name, clothes size), (color, clothes size),
  (item name), (color), (clothes size), () }
```

결과 relation에서 어떤 grouping에 포함되지 않은 attribute는 SQL standard상 `null`로 채워진다. 이 null은 실제 stored null이나 outer join에서 생긴 null과 의미가 다르다. `grouping(attribute)` function은 cube/rollup 때문에 생성된 null이면 1, 실제 null이면 0을 반환하므로, `case when grouping(item name) = 1 then 'all' ...`처럼 `all` 표시로 바꿀 수 있다.

`rollup`은 `cube`보다 적은 grouping을 만든다. `group by rollup(item name, color, clothes size)`는 `(item name, color, clothes size)`, `(item name, color)`, `(item name)`, `()`만 생성한다. Attribute order가 중요하다. 마지막 attribute는 가장 세부 grouping에만 등장하고, 첫 attribute는 empty grouping을 제외한 모든 grouping에 등장한다. 이 특성은 Region → Country → State → City처럼 hierarchy를 따라 drill down하는 sequence를 표현할 때 유용하다.

`grouping sets`는 `cube`나 `rollup`보다 더 직접적이다. 원하는 grouping 목록만 명시할 수 있으므로, 예를 들어 `(color, clothes size)`와 `(clothes size, item name)`만 필요한 경우 불필요한 aggregate를 만들지 않는다. SQL 외에도 multidimensional schema query를 쉽게 표현하기 위해 `MDX`, `DAX` 같은 specialized language가 쓰인다.

OLAP implementation의 trade-off는 precomputation과 storage cost 사이에 있다.

| 방식 | 핵심 |
|---|---|
| `MOLAP(multidimensional OLAP)` | data cube를 multidimensional array로 저장 |
| `ROLAP(relational OLAP)` | relational database에 data를 저장하고 OLAP 기능을 통합 |
| `HOLAP(hybrid OLAP)` | 일부 summary는 memory/cube에, base data와 다른 summary는 relational DB에 저장 |

전체 data cube를 미리 계산하면 query를 몇 초 안에 답할 수 있지만, dimension n개에 대해 `2^n` groupings가 생기고 hierarchy가 있으면 더 커진다. 따라서 실제 system은 전체 cube를 모두 저장하기보다 자주 쓰는 grouping 일부를 precompute/materialize하고, 나머지는 더 세부 precomputed summary에서 on demand로 계산한다.

#### 11.3.4 Reporting and Visualization Tools

`report generator`는 database query와 formatted text/chart 생성을 결합해 human-readable summary report를 만든다. Report format은 table header, column header, group subtotal, page subtotal, graph/bar chart 같은 구조를 포함하고, month/year 같은 variable parameter를 query definition에 넣을 수 있다. 한 번 report structure를 정의하면 필요할 때 실행해 최신 database query 결과로 report를 다시 생성한다.

`data visualization`은 단순 chart를 넘어 large volume data의 pattern을 시각적으로 찾게 한다. 지도 위에 disease occurrence location을 특정 color로 표시하면 geographic correlation hypothesis를 빠르게 세울 수 있고, item pair association을 2D pixel matrix의 color intensity로 표현하면 높은 association이 bright pixel로 드러난다. Visualization은 정량 검증을 대체하는 것이 아니라, analyst가 hypothesis를 만들고 database로 확인하게 하는 탐색 도구다.

### 11.4 Data Mining

`data mining`은 large database를 분석해 useful pattern을 찾는 과정이다. Artificial intelligence의 `knowledge discovery`, `machine learning`, statistical analysis와 비슷하게 rule이나 pattern을 찾지만, 전통적으로 data mining은 disk에 저장된 very large volume data를 다룬다는 점이 강조된다. 최근 machine-learning algorithm도 매우 큰 data에서 동작하므로 둘의 경계는 흐려졌다. Data-mining technique은 `KDD(knowledge discovery in databases)` 과정의 일부다.

Data mining 결과는 여러 형태로 표현된다. 어떤 지식은 “annual income이 높은 특정 customer group이 small sports car를 살 가능성이 높다” 같은 rule로 표현되고, 이런 rule에는 `support`와 `confidence`가 붙는다. 다른 지식은 variable 사이의 equation으로 표현된다. 더 일반적으로는 past instance에 machine-learning technique을 적용해 `model`을 만들고, 새 instance의 feature/attribute를 input으로 넣어 output prediction을 얻는다.

실제 data mining은 완전 자동이 아니다. Algorithm이 받아들일 수 있도록 data를 preprocessing해야 하고, 발견된 pattern 중 novel/useful한 것을 고르는 post-processing도 필요하다. 같은 database에서도 여러 종류의 pattern을 찾을 수 있으므로, 어떤 pattern type을 볼지 정하는 manual interaction이 들어간다. 따라서 현실의 data mining은 semiautomatic process에 가깝다.

#### 11.4.1 Types of Data-Mining Tasks

Data-mining task는 크게 prediction과 descriptive pattern discovery로 나눌 수 있다.

| Task | 목적 | 예 |
|---|---|---|
| `classification` | instance를 여러 class 중 하나로 예측 | credit risk: excellent/good/average/bad |
| `regression` | continuous/numeric value 예측 | default 가능성 %, default amount |
| `association` | 함께 발생하는 item/event 관계 발견 | bread ⇒ milk, book recommendation |
| `clustering` | 비슷한 instance group 발견 | disease case가 특정 지역에 몰림 |

Credit-card company는 applicant의 age, income, debt, repayment history를 이용해 default risk를 예측한다. Customer churn prediction, promotional mail response prediction, fraudulent calling-card usage detection도 prediction task다. Association은 함께 구매되는 item을 찾아 recommendation이나 product placement에 쓸 수 있고, 의학 분야에서는 새 약물과 adverse event 사이의 unexpected association처럼 causation hypothesis를 낳을 수도 있다. Cluster는 typhoid case가 특정 well 주변에 모였다는 관찰처럼 hidden grouping을 발견하는 데 쓰인다.

#### 11.4.2 Classification

`classification` 문제는 class가 알려진 past instance인 `training instance`를 이용해, class를 모르는 new instance의 class를 예측하는 문제다. Credit-card 예제에서는 기존 customer에게 payment history를 기준으로 excellent/good/average/bad 같은 credit worthiness class를 붙이고, applicant의 age, education, income, debts 같은 attribute로 새 applicant의 class를 예측한다.

##### 11.4.2.1 Decision-Tree Classifiers

`decision-tree classifier`는 leaf node에 class를 두고 internal node에 predicate/function을 두는 classifier다. New instance를 classify할 때 root에서 시작해 internal node predicate를 평가하고 해당 child로 내려가며, leaf에 도착하면 그 leaf의 class를 prediction으로 사용한다.

![Figure 11.11](@/assets/images/cs-database-173-figure-11-11-page-571.png)
*Figure 11.11 · PDF p. 571 · degree와 income predicate를 따라 credit risk class를 결정하는 classification tree*

Figure 11.11은 `degree`와 `income`만 사용한 단순 classification tree다. 예를 들어 degree가 masters이고 income이 40K이면 root에서 masters branch로 가고, 다시 25K to 75K branch를 따라가 leaf class `good`을 예측한다. Decision tree는 사람이 읽기 쉬운 rule 형태로 해석될 수 있다는 장점이 있지만, training set으로 tree를 만드는 세부 algorithm과 overfitting 관리는 별도 주제다.

##### 11.4.2.2 Bayesian Classifiers

`Bayesian classifier`는 training data에서 class별 attribute value distribution을 학습하고, new instance `d`가 각 class `c_j`에 속할 확률 `p(c_j | d)`를 추정한다. 가장 큰 probability를 가진 class가 predicted class다.

Bayes’ theorem은 다음과 같다.

$$
p(c_j \mid d) = \frac{p(d \mid c_j)p(c_j)}{p(d)}
$$

`p(d)`는 모든 class에 대해 같으므로 class 비교에서는 무시할 수 있다. `p(c_j)`는 training instance 중 class `c_j`의 fraction이고, `p(d | c_j)`는 class가 `c_j`일 때 instance `d`가 생성될 확률이다.

Multiple attribute를 모두 조합해 `p(d | c_j)`를 정확히 계산하려면 attribute value combination 수가 너무 커진다. Limited training set에서는 대부분의 조합에 matching instance가 없을 수 있다. `naive Bayesian classifier`는 attribute들이 class가 주어졌을 때 independent distribution을 가진다고 가정해 다음처럼 근사한다.

$$
p(d \mid c_j) = \prod_{i=1}^{n} p(d_i \mid c_j)
$$

각 `p(d_i | c_j)`는 class `c_j`에 속한 training instance에서 attribute i의 value distribution으로부터 계산하며, 보통 histogram으로 근사한다. 이 independence assumption은 현실을 단순화하지만 sparse high-dimensional combination 문제를 피하게 해 준다.

##### 11.4.2.3 Support Vector Machine Classifiers

`Support Vector Machine(SVM)`은 training point를 geometric space의 점으로 보고 class를 나누는 boundary를 찾는 classifier다. 가장 단순한 2차원 binary classification에서는 class A와 class B의 점들을 나누는 line을 찾는다. 가능한 separating line이 여러 개라면, SVM은 training point 중 가장 가까운 점까지의 distance가 최대가 되는 `maximum margin line`을 선택한다.

![Figure 11.12](@/assets/images/cs-database-174-figure-11-12-page-573.png)
*Figure 11.12 · PDF p. 573 · 두 class를 나누는 여러 line 중 margin이 가장 큰 maximum margin line을 고르는 SVM classifier*

Attribute가 여러 개이면 line 대신 dividing plane 또는 hyperplane을 찾는다. Linear boundary로 나눌 수 없는 경우에는 `kernel function`으로 input point를 transform해 nonlinear curve를 찾을 수 있다. Noise 때문에 한쪽 class point가 다른 class point 사이에 섞이면 완전한 separation이 불가능할 수 있으므로, 이때는 가장 정확히 class를 나누는 line/curve를 선택한다.

SVM의 기본 formulation은 binary classifier다. N개 class가 있으면 class i인지 아닌지를 판단하는 binary classifier를 N개 만들고, 새 point에 모든 classifier를 적용한 뒤 relatedness value가 가장 높은 class를 선택하는 방식으로 multiclass classification에 사용할 수 있다.

##### 11.4.2.4 Neural Network Classifiers

`neural network classifier`는 여러 layer의 neuron으로 구성된다. Input instance가 첫 layer에 들어가고, 각 neuron은 이전 layer activation의 weighted combination을 계산해 output activation을 만든다. Final output layer는 보통 class마다 하나의 neuron을 가지며, activation이 가장 큰 neuron의 class가 prediction이 된다.

핵심은 weight learning이다. Weight는 처음에 default value로 시작하고, training data를 넣어 prediction이 맞는지 확인한다. 틀리면 `backpropagation algorithm`으로 weight를 조정해 current input의 correct class에 가까워지게 한다. 이 과정을 반복하면 trained neural network가 만들어지고, 새 input classification에 사용된다.

`deep neural network`는 layer 수가 많은 neural network이고, `deep learning`은 이런 network를 매우 많은 training instance로 학습시키는 machine-learning technique을 가리킨다. Vision, speech recognition, natural language translation 같은 어려운 task에서 큰 성공을 보였지만, 일반적으로 많은 training data와 computation이 필요하다.

#### 11.4.3 Regression

`regression`은 class가 아니라 value를 예측한다. Variable `X1, X2, ..., Xn`의 값이 주어졌을 때 variable `Y`를 예측하는 문제다. 예를 들어 education level과 income을 numeric variable로 보고 default likelihood percentage나 default amount를 예측할 수 있다.

`linear regression`은 다음과 같은 linear polynomial의 coefficient를 추정한다.

$$
Y = a_0 + a_1 X_1 + a_2 X_2 + \ldots + a_n X_n
$$

더 일반적으로 data에 맞는 polynomial이나 다른 formula의 curve를 찾는 과정을 `curve fitting`이라고 한다. Data noise나 실제 관계가 polynomial이 아닐 수 있기 때문에 완벽한 fit보다는 best possible fit을 주는 coefficient를 찾는 것이 목표다.

#### 11.4.4 Association Rules

`association rule`은 어떤 item/event가 있을 때 다른 item/event가 함께 나타나는 경향을 표현한다. Grocery example의 `bread ⇒ milk`는 bread를 산 customer가 milk도 살 가능성이 높다는 뜻이다. Online bookstore의 related-book suggestion, grocery store의 product placement, discount strategy가 association information의 사용 예다.

Association rule은 반드시 `population`을 가진다. Grocery example에서 population은 모든 single grocery purchase일 수 있고, bookstore example에서는 구매 시점과 관계없이 purchase history가 있는 customer 전체일 수 있다. 어떤 것을 instance로 볼지는 analyst가 정하는 modeling decision이다.

Association rule에는 `support`와 `confidence`가 붙는다.

| Measure | 의미 | 주의점 |
|---|---|---|
| `support` | population 중 antecedent와 consequent를 모두 만족하는 fraction | 너무 낮으면 business/statistical 의미가 약함 |
| `confidence` | antecedent가 true일 때 consequent도 true인 비율 | `bread ⇒ milk`와 `milk ⇒ bread`의 confidence는 다를 수 있음 |

`milk ⇒ screwdrivers`처럼 함께 나타나는 purchase가 극히 드문 rule은 support가 낮아 통계적으로도, business 관점에서도 관심이 낮을 수 있다. 반대로 bread와 milk가 많은 purchase에서 함께 나타나면 support가 높다. Confidence는 antecedent 조건이 주어졌을 때 consequent가 얼마나 자주 따라오는지를 본다. Business rule은 보통 100%가 아니라 의미 있게 높은 confidence를 목표로 한다.

#### 11.4.5 Clustering

`clustering`은 data point를 비슷한 것끼리 cluster로 묶는 문제다. 핵심 직관은 distance/similarity metric에 따라 similar points를 같은 set에 넣는 것이다. Formalization은 여러 가지가 가능하다.

| Formalization | 의미 |
|---|---|
| centroid 기준 | 주어진 k에 대해, 각 point가 배정된 cluster centroid와의 average distance를 최소화 |
| pairwise distance 기준 | 각 cluster 내부의 모든 point pair 사이 average distance를 최소화 |
| hierarchical clustering | related item을 여러 level의 hierarchy로 묶음 |

`centroid`는 cluster point들의 각 dimension coordinate 평균으로 정의된다. Database 연구에서 중요한 점은 clustering algorithm이 memory에 다 올라가지 않는 very large dataset도 처리할 수 있게 scalable해야 한다는 것이다.

Clustering은 recommendation과도 연결된다. 사용자의 과거 선호, 비슷한 선호를 가진 다른 사용자, 그 사용자의 새 item 선호를 이용해 새 사용자가 좋아할 item을 예측할 수 있다. 사람을 preference 기준으로 cluster하고, item도 similarity 기준으로 cluster한 뒤, 두 clustering을 번갈아 개선해 equilibrium에 접근하는 방식이 가능하다. 이런 문제는 사용자가 함께 information filtering에 기여한다는 의미에서 `collaborative filtering`의 한 예다.

#### 11.4.6 Text Mining

`text mining`은 data-mining technique을 textual document에 적용한다. Text는 unstructured 또는 semi-structured 형태가 많기 때문에, 단순 relation보다 preprocessing과 interpretation이 중요하다.

| Task | 목적 | 예 |
|---|---|---|
| `sentiment analysis` | text의 positive/negative/neutral sentiment 추정 | product review의 전체 반응 점수화 |
| `information extraction` | unstructured text에서 structured information 생성 | customer support conversation에서 문제 aspect 추출 |
| `entity recognition` / `named entity recognition` | text 속 entity mention을 찾고 disambiguation | 같은 이름이 서로 다른 인물을 가리키는지 context로 구분 |
| `knowledge graph` construction | 추출한 entity/attribute/relationship을 graph로 표현 | web search engine의 의미 있는 answer 생성 |

`sentiment analysis`는 review에 나타나는 word pattern을 이용해 product reaction을 broad score로 요약한다. `information extraction`은 문장이나 tabular display에서 structured attribute와 relationship을 뽑아낸다. 핵심 subtask인 `entity recognition`은 text 속 entity mention을 식별하고, context를 이용해 같은 surface form이 어떤 entity를 가리키는지 disambiguation한다.

Information extraction은 customer support conversation, social media review, service review 분석에 쓰일 수 있다. 단순히 positive/negative만 보는 것이 아니라 pricing, quality, hygiene, service behavior, location 같은 aspect별로 sentiment와 attribute를 연결하면 어떤 부분을 고쳐야 하는지 결정할 수 있다. Web-scale document에서 추출한 information은 Section 8.1.4의 `knowledge graph`와 연결된다.

### 11.5 Summary

Chapter 11의 큰 흐름은 operational data를 analysis-ready data로 바꾸고, 그 위에서 summary exploration과 prediction/discovery를 수행하는 것이다.

- `data analytics` system은 transaction-processing system의 online data와 외부 source data를 함께 분석해 business decision을 돕는다.
- `data warehouse`는 historical operational data를 gather/archive하며, data cleansing과 ETL/ELT가 핵심 작업이다.
- Warehouse schema는 보통 매우 큰 `fact table`과 더 작은 `dimension table`들로 구성되는 multidimensional schema이며, `star schema`와 `snowflake schema`가 대표적이다.
- `OLAP`은 `dimension attribute`와 `measure attribute`로 구성된 multidimensional data를 cross-tab, data cube, rollup/drill down, slicing/dicing으로 탐색하게 한다.
- SQL은 analytics를 위해 `pivot`, `cube`, `rollup`, `grouping sets`, `grouping()` 같은 construct를 제공한다.
- `data mining`은 large database를 semiautomatically 분석해 useful pattern을 찾으며, classification, regression, association rule, clustering, text mining을 포함한다.

## 연결 관계

- Chapter 5의 advanced SQL aggregate 기능은 Chapter 11의 `cube`, `rollup`, `grouping sets`, `pivot`에서 analytics query로 확장된다.
- Chapter 8의 `knowledge graph`는 text mining의 information extraction 결과를 graph로 표현하는 구조와 연결된다.
- Chapter 9의 application development는 report generator, dashboard, visualization tool을 실제 application에 붙이는 문제와 이어진다.
- Chapter 10의 Big Data/stream processing은 warehouse에 더 fresh data를 공급하거나, warehouse가 감당하기 어려운 real-time event response를 처리하는 기반이 된다.
- Chapter 12-14의 storage/indexing은 warehouse workload의 performance를 뒷받침한다. 특히 Chapter 13의 column-oriented storage는 analytics query에서 필요한 column만 읽는 장점과 직접 연결된다.

## 오해하기 쉬운 내용

- `data warehouse`는 단순 backup copy가 아니다. 여러 source schema를 통합하고 cleansing/deduplication을 거친 analysis-oriented repository다.
- `ETL`과 `ELT`는 순서가 다르다. ETL은 transform 후 load이고, ELT는 load 후 warehouse의 parallel processing/extension으로 transform한다.
- `cross-tab`은 user display에 좋지만, value가 column이 되므로 database 저장 형식으로는 불안정하다. 내부 표현은 fixed-column relational representation이 더 적합하다.
- `cube`와 `rollup`은 같은 것이 아니다. Cube는 모든 grouping subset을 만들고, rollup은 attribute order를 따라 prefix-style hierarchy grouping만 만든다.
- `grouping()`은 일반 null과 OLAP-generated null을 구분하기 위해 필요하다.
- `classification`은 class label 예측이고, `regression`은 numeric value 예측이다.
- Association rule의 `support`와 `confidence`는 다르다. 또한 `bread ⇒ milk`와 `milk ⇒ bread`는 support는 같을 수 있어도 confidence는 다를 수 있다.
- `clustering`은 classification처럼 기존 class label을 학습해 예측하는 작업이 아니라, similarity에 따라 group을 발견하는 descriptive task다.
- Visualization은 결론을 증명하는 도구가 아니라, pattern을 발견하고 hypothesis를 세운 뒤 database로 검증하게 하는 탐색 도구다.

## 면접 질문

1. `OLTP` workload와 `data warehouse` workload는 query/update pattern과 storage layout 면에서 어떻게 다른가?
2. `fact table`, `dimension table`, `measure attribute`, `dimension attribute`를 Figure 11.2의 `sales` schema로 설명해 보라.
3. `star schema`와 `snowflake schema`의 차이는 무엇이고, snowflake가 더 정규화된 대신 어떤 trade-off를 만들 수 있는가?
4. `row-oriented storage`보다 `column-oriented storage`가 warehouse query에 유리한 이유와, OLTP에 불리할 수 있는 이유를 설명해 보라.
5. `cross-tabulation`, `pivot-table`, `data cube`의 관계를 설명하고, `all` value가 의미하는 바를 말해 보라.
6. OLAP의 `pivoting`, `slicing`, `dicing`, `rollup`, `drill down`을 각각 예로 설명해 보라.
7. SQL `cube`, `rollup`, `grouping sets`, `grouping()`의 차이와 용도를 설명해 보라.
8. 전체 data cube를 precompute하는 방식의 장점과 storage cost 문제를 설명해 보라.
9. `decision-tree classifier`, `naive Bayesian classifier`, `Support Vector Machine(SVM)`, `neural network classifier`가 classification을 수행하는 방식을 비교해 보라.
10. `association rule`의 `support`와 `confidence`를 정의하고, 방향이 바뀌면 confidence가 달라질 수 있는 이유를 설명해 보라.
