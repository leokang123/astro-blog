---
title: "Online Chapters"
pubDatetime: 2026-05-18T00:00:00+09:00
modDatetime: 2026-05-18T00:00:00+09:00
description: "Database System Concepts 정리: Online Chapters"
tags:
  - "Database"
  - "CS"
---

## 개요

`Online Chapters`는 본권에 인쇄된 Chapter 1-26 뒤에 이어지는 별도 온라인 자료다. local extracted PDF의 topics 파일은 Chapter 27-32를 online chapter로만 나열하고, page range가 포함되어 있지 않다고 명시한다. 실제 `full_with_pages.txt`를 검색해도 Chapter 27-32의 본문은 들어 있지 않고, contents/preface/web-site 안내와 index reference만 확인된다.

따라서 이 정리본은 해당 online chapters의 세부 지식을 PDF 대체 수준으로 정리한 문서가 아니다. 현재 로컬 자료에서 검증 가능한 범위 안에서, 각 online chapter가 책 전체 구조에서 어떤 위치를 차지하는지와 어떤 필요가 있을 때 찾아보면 되는지를 남긴다. 보류 주제이므로 특정 제품, 표준, 역사, API 세부는 확장하지 않는다.

## 목차상 위치

본문 목차의 `PART ELEVEN ONLINE CHAPTERS`에는 다음 여섯 장이 별도 online material로 제시된다.

| chapter | topic | 로컬 추출본에서 확인 가능한 역할 |
|---|---|---|
| Chapter 27 | `Formal Relational Query Languages` | tuple relational calculus, domain relational calculus, `Datalog` 등 “pure” query language를 다룬다. |
| Chapter 28 | `Advanced Relational Database Design` | `multivalued dependency`, `fourth normal form (4NF)`, higher normal forms 등 관계형 설계 이론의 심화 부분을 다룬다. |
| Chapter 29 | `Object-Based Databases` | object-based database와 `array`, `multiset`, non-`1NF` table 같은 복합 data type을 다룬다. |
| Chapter 30 | `XML` | Chapter 8의 XML 소개를 확장한다. |
| Chapter 31 | `Information Retrieval` | unstructured textual data에 대한 querying, 즉 `information retrieval`을 다룬다. |
| Chapter 32 | `PostgreSQL` | PostgreSQL database system overview를 제공하며, database internals 중심 course나 PostgreSQL open-source code base 기반 student project를 지원하는 목적이 강하다. |

## 책 전체와의 연결

Online chapters는 introductory course의 필수 흐름이라기보다, 본권의 기본 장을 배운 뒤 필요에 따라 붙이는 supplementary 또는 self-study material로 배치된다. Preface의 course guidance는 Chapter 27을 Chapter 2 직후, SQL보다 앞서 다룰 수 있다고 말한다. 이는 Chapter 27이 SQL 실습보다 `relational model`의 수학적 query language 관점을 보강하는 위치에 있기 때문이다.

나머지 다섯 장, 즉 `Advanced Relational Database Design`, `Object-Based Databases`, `XML`, `Information Retrieval`, `PostgreSQL`은 introductory course에서 생략하거나 self-study material로 사용할 수 있다고 설명된다. 이 배치는 해당 주제들이 기본 DBMS 사용과 설계의 핵심 흐름보다는 이론 심화, 특정 data model, 특정 system internals, 또는 응용 영역으로 들어가는 확장 주제임을 뜻한다.

## 로컬 추출본의 한계와 사용 방법

Preface의 web-site 안내는 db-book.com에 slides, practice exercise answers, laboratory material, errata와 함께 “six online chapters”가 있다고 설명한다. 즉 Chapter 27-32의 본문은 본권 PDF에 이어진 page marker 본문이 아니라 외부 online supplement로 제공되는 성격이다. 현재 작업 루트의 `Database-System-Concepts_full_with_pages.txt`에는 이 online supplement 본문이 없으므로, 원문 기반 고밀도 정리본을 만들 수 있는 텍스트 범위가 존재하지 않는다.

따라서 이 파일은 나중에 online chapter 원문이 추가로 확보되었을 때의 navigation note로 쓰는 것이 맞다. 각 장은 다음 필요가 생겼을 때 찾아보면 된다.

| 필요 상황 | 찾아볼 online chapter |
|---|---|
| relational algebra를 넘어 논리식 기반 query semantics를 보고 싶을 때 | Chapter 27 `Formal Relational Query Languages` |
| normalization을 `BCNF` 이후 이론까지 확장하고 싶을 때 | Chapter 28 `Advanced Relational Database Design` |
| relational model 바깥의 object-based modeling과 non-atomic value를 비교하고 싶을 때 | Chapter 29 `Object-Based Databases` |
| Chapter 8의 XML 소개보다 `XQuery`, XML storage/query 지원을 더 보고 싶을 때 | Chapter 30 `XML` |
| structured relational query가 아니라 document/text search의 ranking, keyword retrieval 흐름을 보고 싶을 때 | Chapter 31 `Information Retrieval` |
| optimizer, storage, concurrency 등 DBMS internals를 실제 open-source DBMS 코드와 연결하고 싶을 때 | Chapter 32 `PostgreSQL` |

## 핵심 개념

현재 로컬 PDF에서 확인 가능한 핵심은 “이 여섯 장은 본권의 필수 sequence가 아니라 확장 트랙”이라는 점이다. Chapter 27은 Chapter 2의 `relational model` 직후에 붙여도 되는 이론 트랙이고, Chapter 28은 Chapter 7의 relational design theory를 더 깊게 파는 설계 트랙이다. Chapter 29와 Chapter 30은 Chapter 8의 complex/semi-structured data type 흐름을 확장한다. Chapter 31은 Chapter 8의 textual data와 연결되지만, database query라기보다 unstructured document retrieval 관점이 강하다. Chapter 32는 특정 system인 `PostgreSQL`을 통해 Chapter 12-19, Chapter 15-16의 internals를 실제 구현과 연결하는 트랙이다.

## 연결 관계

| online chapter | 본권에서 이어지는 위치 |
|---|---|
| Chapter 27 `Formal Relational Query Languages` | Chapter 2 `Relational Model`의 relational algebra 뒤에 이어지는 formal query semantics |
| Chapter 28 `Advanced Relational Database Design` | Chapter 7 `Relational Database Design`의 functional dependency, normalization 뒤에 이어지는 심화 normal form |
| Chapter 29 `Object-Based Databases` | Chapter 8 `Complex Data Types`의 object-based data, collection type, non-atomic data와 연결 |
| Chapter 30 `XML` | Chapter 8의 XML subsection을 더 자세히 확장 |
| Chapter 31 `Information Retrieval` | Chapter 8의 textual data 및 database 밖의 unstructured document search와 연결 |
| Chapter 32 `PostgreSQL` | Chapter 12-19 storage/transaction internals, Chapter 15-16 query processing/optimization을 실제 PostgreSQL implementation으로 연결 |

## 오해하기 쉬운 내용

- 이 파일이 짧은 이유는 online chapters가 중요하지 않아서가 아니라, 현재 local extracted PDF에 Chapter 27-32 본문이 없기 때문이다.
- `topics.md`의 online chapter 항목만 보고 Chapter 27-32 내용을 임의로 요약하지 않았다. 실제 `full_with_pages.txt`에는 해당 본문 page marker가 없음을 확인했다.
- `figures_manifest.json`에도 Chapter 27-32 figure는 없고 Appendix A figure만 이어진다. 따라서 이 정리본에는 figure를 포함하지 않는다.
- Chapter 32 `PostgreSQL`은 특정 제품 사용법 암기보다, open-source DBMS internals를 본권의 query processing, optimization, storage, transaction 개념과 연결하는 보조 장으로 보는 편이 맞다.

## 면접 질문

1. `Formal Relational Query Languages`는 왜 SQL보다 앞서 Chapter 2 직후에 배치할 수 있는가?
2. `Advanced Relational Database Design`은 Chapter 7의 normalization과 어떤 방향으로 이어지는가?
3. `XML`, `Object-Based Databases`, `Information Retrieval`은 왜 Chapter 8의 complex data type 흐름과 연결되는가?
4. `PostgreSQL` online chapter는 단순 SQL 사용법이 아니라 어떤 DBMS internals 학습 목적을 갖는가?
