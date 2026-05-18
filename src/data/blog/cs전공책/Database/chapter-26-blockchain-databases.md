---
title: "Chapter 26. Blockchain Databases"
order: 26
pubDatetime: 2026-05-18T00:01:00+09:00
modDatetime: 2026-05-18T00:01:00+09:00
description: "Database System Concepts 정리: Chapter 26. Blockchain Databases"
tags:
  - "Database"
  - "CS"
---

## 26.1 Overview

`blockchain`은 가장 단순히 보면 데이터를 저장하는 또 다른 형식이며, 업데이트 기록을 `block` 단위로 이어 붙인 `log`에 가깝다. 그러나 전통적 database와의 차이는 저장 형식 자체보다, 여러 참여자가 하나의 기록을 공동으로 유지하면서도 특정 한 참여자를 완전히 신뢰하지 않아도 되게 만드는 `transaction processing` 패러다임에 있다.

금융에서 `ledger`는 입금, 출금, 소유권 이전 같은 거래 기록을 순서대로 남기는 장부다. 은행 계좌 ledger는 은행이 유지하므로 사용자는 은행이 임의 출금 기록을 추가하거나 입금 기록을 삭제하지 않을 것이라고 신뢰해야 한다. 반면 `blockchain-based distributed ledger`는 여러 주체가 공동으로 ledger를 유지하며, 각 transaction은 `digital signature`로 진위가 증명되고, 한 번 추가된 entry는 다른 참여자가 탐지하지 못하게 삭제하거나 수정하기 어렵다.

`cryptocurrency`는 이 구조가 널리 알려진 대표 사례다. 전통적인 `fiat currency`는 중앙은행과 정부 보증, 그리고 은행 ledger에 대한 신뢰에 기대지만, cryptocurrency는 특정 조직이나 국가를 전적으로 신뢰하지 않아도 되도록 온라인상에서 생성되고 기록된다. 디지털 정보는 쉽게 복사되므로, cryptocurrency는 같은 돈을 두 번 쓰는 `double spending`을 막아야 한다. 이를 위해 거래를 ledger에 기록하고, 그 ledger를 안전한 distributed infrastructure에 저장한다. 여기서 핵심 개념은 `decentralization`과 `trustlessness`다.

Bitcoin은 2008년 Satoshi Nakamoto 논문과 2009년 공개 코드로 등장한 첫 성공적 cryptocurrency이며, 이전에는 실용화가 어렵다고 여겨지던 문제들을 결합적으로 해결했다. 다만 Bitcoin의 목표는 `anonymous`, `trustless`, `fully distributed currency`였기 때문에, 그 설계 선택이 enterprise database 환경에는 비효율적일 수 있다. 이 장은 cryptocurrency의 금융적 의미나 wallet/exchange 관리가 아니라, database 관점에서 blockchain이 전통적 database와 어떻게 다른지, 어떤 알고리즘으로 구현되는지에 초점을 둔다.

business application에서 blockchain이 유용한 상황은 한 주체를 완전히 신뢰하기 어렵지만, 여러 조직이 같은 기록을 공유해야 하는 경우다. 예를 들어 공급망에서 제품과 부품의 위치 기록, 부동산 소유권 문서, ownership deed 같은 데이터는 특정 조직이 나중에 유리하게 기록을 고치고 싶어질 수 있다. blockchain은 이런 fraudulent update를 탐지 가능하게 만들고, public view가 필요한 기록도 위변조 위험을 낮추어 공개할 수 있게 한다.

blockchain은 보통 두 사용 시나리오로 나뉜다.

| 구분 | 핵심 의미 | 장점 | 비용/제약 |
|---|---|---|---|
| `public blockchain` | 누구나 node로 참여해 blockchain 유지 작업에 참여할 수 있다. Bitcoin이 대표적이다. | 중앙 permissioning authority 없이 강한 개방성과 trustlessness를 제공한다. | `Sybil attack` 방어, consensus, anonymity 때문에 CPU/전력 비용과 transaction latency가 커질 수 있다. |
| `permissioned blockchain` | enterprise, consortium, government agency 같은 permissioning authority가 참여 권한을 부여한다. | 참여자 범위를 제한해 더 효율적인 consensus와 identity management가 가능하다. | 완전한 무중앙성은 약해지며, 접근 권한 관리 주체가 필요하다. |

Bitcoin식 public blockchain은 CPU power와 electrical power를 많이 소비하고 transaction 처리 지연도 크다. 반대로 enterprise data management에서는 완전한 anonymity보다 accountability와 규제 준수가 중요하므로, trustlessness와 anonymity 가정을 완화해 더 효율적인 blockchain database를 설계할 수 있다.

이 장의 큰 흐름은 다음과 같다. 먼저 Bitcoin식 고전적 blockchain structure를 통해 핵심 속성을 확인한다. 그 다음 `one-way cryptographic hash function`이 tamper resistance, irrefutability, anonymity 같은 속성에 어떻게 기여하는지 본다. 이어서 여러 system이 blockchain의 현재 내용과 새 block 추가 내용에 합의하는 `consensus` 문제를 다룬다. Chapter 23의 consensus는 참여자가 같은 조직에 속하고 fail-stop failure를 일으킨다는 가정이 강했지만, blockchain에서는 참여자가 거짓말하거나 consensus를 방해할 수 있으므로 `Byzantine consensus` 같은 더 강한 모델이 필요하다.

또한 blockchain은 단순 debit-credit transaction만 저장하지 않는다. enterprise blockchain은 다양한 data type을 저장할 수 있지만, 전통적 blockchain organization은 임의 데이터 검색에 비효율적이다. 따라서 blockchain을 traditional database와 결합하거나 database 위에 blockchain을 구축하면 query processing과 update transaction을 빠르게 만들 수 있다.

## 26.2 Blockchain Properties

가장 기본적인 blockchain은 data block들의 linked list다. 일반 linked list와 다른 점은 pointer가 단순히 이전 block의 identifier만 담지 않고, 이전 block의 hash까지 함께 담는다는 것이다. 각 새 block은 `(pointer-to-previous-block, hash-of-previous-block)` 쌍을 포함한다. 최초 block은 `genesis block`이라고 부르며, blockchain 생성자가 설정한다.

![Figure 26.1](@/assets/images/cs-database-355-figure-26-1-page-1284.png)
*Figure 26.1 · PDF p. 1284 · 이전 block의 hash를 함께 저장하는 blockchain data structure*

이 구조에서 block `B`를 수정하면, 다음 block 안에 저장된 `hash(B)`와 새로 계산한 hash가 달라진다. 공격자가 다음 block의 hash 값까지 바꾸면, 그 다음 block도 다시 바꿔야 하고, 이런 수정은 chain 끝까지 전파된다. 따라서 `hash-validated pointer`는 block 단위 tampering을 어렵게 만든다.

tamper resistance가 실제로 강해지려면 두 조건이 더 필요하다. 첫째, hash function은 collision을 찾기 어렵고 역으로 원본을 찾기 어려운 cryptographic property를 가져야 한다. 둘째, chain이 여러 independent node에 replicate되어 있어 한 node나 작은 node 집단이 독단적으로 history를 고칠 수 없어야 한다. replicate된 chain 사이에서는 어떤 block이 올바른 최신 상태인지 합의하는 distributed consensus algorithm이 필요하다.

다만 public blockchain에서는 단순 majority vote가 충분하지 않다. 누구나 node를 만들 수 있으면, 공격자가 저렴한 컴퓨터를 대량으로 세워 다수 node를 장악할 수 있다. 이런 공격을 `Sybil attack`이라고 한다. Chapter 23의 distributed consensus는 하나의 조직이 system 전체를 통제하고 node가 악의적으로 행동하지 않는다는 가정이 있었지만, public blockchain은 adversarial behavior까지 고려해야 한다.

node는 참여 수준에 따라 구분된다.

| 용어 | 의미 |
|---|---|
| `full node` | consensus mechanism에 참여하고 blockchain replica를 직접 유지하는 node |
| `light node` | update transaction은 제출하지만, storage나 computation 제약 때문에 consensus에는 참여하지 않는 저비용 node |

blockchain consensus는 보통 다음 범주로 나뉜다.

| consensus mechanism | 핵심 아이디어 | 장점 | 비용/주의점 |
|---|---|---|---|
| `proof of work` | 다음 block을 추가할 node는 어려운 수학적 문제를 가장 먼저 푼 node로 정한다. 이 과정을 `mining a block`이라고 한다. | attacker가 전체 computing power의 절반 이상을 장악하지 못하면 adversarial behavior에 강하다. | 엄청난 computational effort와 electricity가 필요하며, 유용한 계산이 아닌 방어용 비용이다. |
| `proof of stake` | node가 소유하거나 reserve한 blockchain currency의 양을 기준으로 다음 block 추가자를 선택한다. | Sybil attack에 대한 비용 장벽을 computing power가 아니라 stake로 만든다. | stake 집중, validator 선택 공정성, 경제적 penalty 설계가 중요하다. |
| `Byzantine consensus` | permissioned blockchain처럼 참여자 진입을 통제할 수 있을 때, 일부 node가 malicious하게 행동해도 message passing으로 합의한다. | enterprise blockchain에 적합하고 proof of work보다 효율적일 수 있다. | Sybil attack 자체를 해결하지는 않으며, basic consensus보다 메시지 교환 비용이 크다. |
| other approaches | `proof of activity`, `proof of burn`, `proof of capacity`, `proof of elapsed time` 등 | 특정 환경의 비용 구조에 맞출 수 있다. | 널리 쓰이는 정도와 보안 가정이 방식마다 다르다. |

blockchain을 손상시키는 또 다른 방식은 최신 block이 아닌 과거 block 뒤에 새 block을 붙이는 것이다. 이를 `fork`라고 한다. fork는 악의적으로도 생길 수 있지만, 비악의적 원인도 있다. 두 node가 거의 동시에 최신 block 뒤에 새 block을 성공적으로 붙이면 accidental fork가 생긴다. 이 경우 protocol은 보통 가장 긴 chain 끝에 block을 붙이도록 하며, 짧은 fork의 block은 `orphaned block`이 된다. orphaned block의 transaction은 아직 main chain에 없으면 나중에 다시 들어갈 수 있다.

다른 fork 유형은 사용자 다수가 protocol이나 data structure를 바꾸기 위해 의도적으로 chain을 갈라내는 경우다. `soft fork`는 과거 block을 무효화하지 않고, old software가 new version block도 valid로 인정하므로 점진적 전환이 가능하다. `hard fork`는 old software가 new version block을 invalid로 판단하므로, old version이 계속 쓰이면 내용이 다른 별도 blockchain으로 갈라진다. Bitcoin/Bitcoin Cash, Bitcoin SegWit, Ethereum/Ethereum Classic 사례는 fork가 기술적 선택뿐 아니라 community governance와 immutability에 대한 관점 충돌까지 포함한다는 점을 보여준다.

block 안의 데이터는 application domain에 따라 달라진다. cryptocurrency에서는 currency-transfer transaction이 주된 데이터다. 누구나 block을 추가할 수 있으므로 transaction이 진짜인지 검증해야 하며, 이를 위해 `digital signature`가 사용된다. digital signature는 사용자가 transaction에 서명하고 모든 node가 그 서명을 검증할 수 있게 하므로 fake transaction을 막고, 사용자가 나중에 자기 transaction 참여를 부인하지 못하게 한다. 이 성질을 `irrefutability`라고 한다.

public blockchain의 user ID는 실제 신원과 직접 연결되지 않으므로 `anonymity`를 제공할 수 있다. 그러나 blockchain 데이터는 public이므로, 이미 de-anonymized된 user ID와 거래하거나 on-chain activity를 real-world activity와 data mining으로 연결하면 anonymity가 약해질 수 있다. permissioned blockchain은 애초에 제한적 anonymity만 제공하거나 전혀 제공하지 않을 수 있다.

마지막으로 blockchain은 executable code인 `smart contract`를 저장할 수 있다. smart contract는 복잡한 transaction, 미래 조건 기반 action, 여러 user 사이의 complex agreement를 code로 표현한다. Blockchain마다 smart contract language의 표현력은 다르며, 많은 언어는 `Turing complete`이지만 Bitcoin은 상대적으로 제한적이다.

이 구간의 blockchain properties를 정리하면 다음 네 가지다.

| property | 의미 |
|---|---|
| `Decentralization` | public blockchain에서는 중앙 통제 없이 majority consensus로 제어되고, permissioned blockchain에서도 중앙 권한은 access authorization과 identity management 정도로 제한된다. |
| `Tamper Resistance` | blockchain network의 majority를 장악하지 않는 한 기존 block 내용을 바꾸기 어렵다. |
| `Irrefutability` | user activity는 cryptographic signature로 서명되며, 누구나 검증할 수 있어 transaction 책임을 부인하기 어렵다. |
| `Anonymity` | user ID가 직접적인 personally identifying information과 묶이지 않지만, indirect correlation으로 약화될 수 있다. |

## 26.3 Achieving Blockchain Properties via Cryptographic Hash Functions

이 절은 blockchain의 여러 성질이 `cryptographic hash function`과 `public-key encryption`에 어떻게 기대는지 설명한다. Chapter 14의 hash function은 data access와 indexing을 위한 것이었지만, 여기서 필요한 hash function은 보안 성질을 가진다. 즉, 빠르게 계산할 수 있으면서도 역방향 계산과 collision 찾기가 사실상 불가능해야 한다.

### 26.3.1 Properties of Cryptographic Hash Functions

hash function `h`는 큰 domain의 입력값을 고정 길이 bit string으로 변환한다. 일반적으로 domain의 cardinality가 range보다 훨씬 크므로 이론적으로 collision은 존재할 수밖에 없다. 그러나 `collision resistant` hash function은 서로 다른 `x`, `y`에 대해 `h(x) = h(y)`가 되도록 하는 쌍을 찾는 것이 random guessing보다 나은 방법으로는 사실상 불가능해야 한다.

현재 표준적 cryptographic hash function의 대표는 `SHA-256`이며, 256-bit output을 생성한다. 어떤 값 `x`가 있을 때 무작위 `y`가 같은 hash로 매핑될 확률은 `1 / 2^256` 수준이다. 이 정도면 가장 빠른 컴퓨터로도 성공 가능성이 실질적으로 0에 가깝다.

collision resistance는 blockchain의 tamper resistance와 직접 연결된다. 공격자가 block `B`를 수정하고도 다음 block에 저장된 `hash(B)`와 일치하게 만들려면, 수정된 `B'`가 원래 `B`와 같은 hash를 가져야 한다. 이것이 불가능에 가까우므로, 기존 block을 바꾸려면 그 이후 모든 block의 hash chain을 다시 만들어야 한다.

두 번째 성질은 `irreversibility`다. `x`가 주어지면 `h(x)` 계산은 쉽지만, `h(x)`만 보고 원래 `x`를 찾는 것은 infeasible해야 한다. password 저장에서도 평문 password 대신 hash를 저장하는 이유가 이것이다. 공격자가 hash table을 훔쳐도, irreversibility가 강하면 원래 password를 역산하기 어렵다.

### 26.3.2 Public-Key Encryption, Digital Signatures, and Irrefutability

`private-key encryption`은 사용자들이 같은 secret key를 미리 공유해야 하므로, 전 세계의 임의 사용자들이 처음 만나는 blockchain 환경에는 맞지 않는다. `public-key encryption`은 각 사용자 `U_i`가 `public key E_i`와 `private key D_i`를 가진다. `E_i`로 암호화한 message는 `D_i`로만 복호화할 수 있고, 반대로 `D_i`로 암호화한 값은 `E_i`로 검증할 수 있다.

보안 message 전송에서는 송신자 `U_1`이 수신자 `U_2`의 public key `E_2`로 message `x`를 암호화한다. 그러면 private key `D_2`를 가진 `U_2`만 복호화할 수 있다. 이때 public key를 보고 private key를 계산할 수 없어야 하므로, underlying function은 irreversibility 성질을 가져야 한다.

`digital signature`는 같은 구조를 반대로 이용한다. 사용자 `U_1`이 document `x`에 서명하려면 자기 private key `D_1`로 `x` 또는 보통 그 hash를 암호화한다. 다른 사람은 `U_1`의 public key `E_1`로 이를 검증할 수 있다. private key는 `U_1`만 갖고 있으므로, 검증 가능한 signature는 `U_1`이 해당 transaction을 승인했다는 public proof가 된다. 이것이 blockchain transaction의 `irrefutability`를 만든다.

blockchain에서는 block들이 pointer와 hash로 연결되어 있기 때문에, chain 전체에 서명하려면 최신 block의 hash에 서명하는 것만으로도 충분하다. 최신 block hash는 이전 block hash들을 재귀적으로 포함하므로, 최신 hash signature는 전체 history에 대한 간접 signature가 된다.

### 26.3.3 Simple Blockchain Transactions

Chapter 17의 database transaction은 database 안의 data item을 read/write하는 단계들의 sequence였다. 반면 단순 Bitcoin-style blockchain은 최종 data value를 직접 갱신하기보다, 실제 transaction 기록을 append하는 database log에 더 가깝다. 하지만 blockchain transaction은 완전히 독립적이거나 다른 transaction을 명시적으로 참조한다는 점에서 전통적 log와도 다르다.

예를 들어 사용자 `A`가 `B`에게 10 currency units를 지불한다고 하자. 전통적 banking database라면 `A`의 balance를 읽어 10을 빼고, `B`의 balance를 읽어 10을 더해 write한다. Bitcoin-style blockchain에서는 account balance data item을 직접 수정하지 않는다. 대신 `A`가 과거에 자신에게 지급된 transaction `T_1, T_2, ..., T_n` 중 합계가 10 이상인 것들을 찾아, 이 transaction들의 output을 input으로 쓰는 새 transaction `T`를 만든다. `T`의 output은 `B`에게 10을 지급하고 남은 금액을 `A`에게 `change`로 돌려준다. 사용된 `T_1, ..., T_n`의 output은 `spent` 상태가 된다.

따라서 Bitcoin-style balance는 account row에 저장된 숫자가 아니라, 특정 사용자에게 지급되었지만 아직 쓰이지 않은 `unspent transaction output`들의 집합으로 정의된다. `A`가 이미 쓴 output을 다시 input으로 사용하면 `double-spend transaction`이 된다. mining 과정에서는 각 transaction input이 아직 unspent인지 확인하고, transaction 실행 후 해당 input을 spent로 표시한다.

Bitcoin-style transaction `T`에는 보통 다음 정보가 들어간다.

| 구성 요소 | 의미 |
|---|---|
| input transactions `T_1, T_2, ..., T_n` | 새 transaction이 소비할 과거 output |
| output recipients and amounts | 누구에게 얼마를 지급하는지, 예에서는 `B`에게 10과 `A`에게 change |
| signature | `A`가 transaction을 승인했음을 증명하는 digital signature |
| executable code | 더 복잡한 transaction에서는 code를 포함할 수 있으나, 본격적 논의는 `smart contract`에서 다룬다. |
| data | blockchain-dependent size limit 안에서 저장할 수 있는 데이터 |

이 transaction model은 전통적 database system과 여러 면에서 다르다.

| 관점 | 전통적 database transaction | Bitcoin-style blockchain transaction |
|---|---|---|
| update 방식 | 기존 data item 값을 수정한다. | 기존 data를 수정하지 않고 새 information을 추가한다. |
| history | 현재 상태 중심이며 history는 log/recovery 목적이다. | 현재 상태뿐 아니라 현재 상태에 이른 history가 완전히 보인다. |
| ordering conflict | concurrency control로 충돌을 조정한다. | 충돌 transaction은 block 추가 과정에서 invalid로 판정된다. |
| commit | transaction manager가 commit/abort를 결정한다. | transaction은 local로 생성된 뒤 mining을 통해 permanent shared blockchain에 들어간다. 일종의 deferred transaction commit이다. |
| dependency | schedule 분석에서 암묵적으로 드러날 수 있다. | input으로 쓰는 transaction을 직접 나열하므로 dependency가 명시된다. 예: `T_1 -> T`, `T_2 -> T`. |
| concurrency control | lock, timestamp, validation 등 명시적 protocol이 필요하다. | complete history와 direct sequencing 덕분에 current data item에 대한 contention이 크게 줄어든다. |

Ethereum은 Bitcoin보다 강한 model을 사용한다. Ethereum blockchain은 각 account의 current balance를 포함한 `state`를 유지하고, transaction은 이 state를 update하며 account 사이의 fund transfer를 수행한다. 이 model은 Section 26.5에서 다시 연결된다.

blockchain에 data를 저장할 수 있다는 사실은 blockchain을 단순 tamper-resistant transaction log 이상으로 만든다. 임의의 traditional database information도 표현할 수 있으며, 특히 `blockchain state` 개념이 있는 system에서는 blockchain이 진정한 database로 동작할 수 있다.

## 26.4 Consensus

blockchain은 모든 participating node에 replicate되므로, 새 block이 추가될 때마다 node들은 두 가지에 합의해야 한다. 첫째, 어떤 node가 새 block을 propose할 수 있는가. 둘째, propose된 실제 block이 chain에 추가될 올바른 block인가.

전통적 distributed database에서는 모든 참여자가 한 조직의 통제 아래 있으므로 global concurrency control과 two-phase commit으로 transaction commit/abort를 강제할 수 있다. 하지만 public blockchain에는 controlling organization이 없을 수 있고, permissioned blockchain에서도 permissioning 외에는 decentralized control을 유지하려는 경우가 많다.

transaction이 생성되면 blockchain network 전체로 broadcast된다. node들은 아직 block에 들어가지 않은 transaction 집합을 모아 새 block 후보를 만들 수 있다. blockchain consensus mechanism은 크게 두 부류로 볼 수 있다.

| 방식 | 의미 | 대표 기법 |
|---|---|---|
| 단일 node 합의 | node들이 다음 block을 추가할 하나의 node를 먼저 합의한다. | `Byzantine consensus` |
| temporary fork 허용 | 여러 node가 최신 block 뒤에 block을 만들 수 있고, node들은 longest linear subchain에 계속 block을 붙인다. 짧은 branch는 `orphaned`된다. | `proof of work`, `proof of stake` |

새 block을 추가하는 node는 먼저 block 안의 transaction을 검증해야 한다. transaction이 well-formed인지, input currency units가 이미 prior transaction에서 사용된 double-spend가 아닌지, submitting user의 signature가 올바른지 확인한다. 선택된 node가 block을 전파하면, 다른 node도 validity를 검사한 뒤 local chain에 추가한다.

mining은 blockchain network 전체를 위한 service이므로, miner는 보상을 받는다. 보상은 보통 두 출처에서 온다. 하나는 blockchain system이 새 coin 형태로 지급하는 fee이고, 다른 하나는 transaction submitter가 포함하는 fee다. submitter fee는 해당 transaction을 block에 포함하는 miner에게 지급되는 output으로 표현될 수 있으며, 사용자는 자신의 transaction이 우선 포함되기를 바라므로 fee를 붙일 유인이 있다.

### 26.4.1 Proof of Work

`proof-of-work consensus`는 참여 node 수가 계속 바뀌는 public blockchain을 위해 설계된 방식이다. 단순 majority rule은 공격자가 cheap node를 많이 만들어 장악하는 `Sybil attack`에 취약하다. proof of work는 node 수가 아니라 computation capacity를 장벽으로 만든다. attacker가 network를 지배하려면 node를 많이 추가하는 것만으로는 부족하고, 전체 network computation capacity의 majority를 차지해야 한다.

mining 문제는 cryptographic hashing에 기반한다. block `B`를 다음 block으로 mine하려는 node는 `B`, previous block hash, 그리고 어떤 값 `nonce`를 이어 붙였을 때 hash 결과가 blockchain이 정한 target value보다 작아지도록 하는 nonce를 찾아야 한다. nonce는 보통 32-bit value이며, target이 낮을수록 성공 확률이 낮아지고 mining 난도가 높아진다.

```text
candidate = B || hash(previous_block) || nonce
success   = h(candidate) < target
```

blockchain implementation은 전체 system에서 block이 채굴되는 rate를 제어하기 위해 target을 조정한다. computation power가 하드웨어 발전이나 node 증가로 커져도 target을 낮추면 일정한 mining 간격을 유지할 수 있다. Bitcoin은 약 10분마다 system 어딘가에서 block 하나가 성공적으로 mine되는 것을 목표로 한다. block 생성이 너무 빨라지면 새 block이 network 전체로 propagation되기 전에 다른 block이 생길 가능성이 커지고, 그 결과 fork와 orphaned block 확률이 증가한다.

proof-of-work에는 cryptographic hash function의 추가 성질인 `puzzle-friendliness`가 필요하다. 주어진 값 `k`에 대해 어떤 목표 hash pattern을 만족하는 `x`를 찾는 일이 가능한 shortcut 없이 사실상 brute-force trial에 의존해야 한다. 만약 nonce를 효율적으로 찾는 알고리즘이 있으면 miner들이 너무 빠르게 block을 만들 수 있고, difficulty control과 security model이 깨진다.

proof-of-work의 장점은 대규모 network에서 adversary가 mining을 지배하려면 엄청난 computation power를 확보해야 한다는 점이다. 단점은 energy waste가 크다는 점이다. 이 책은 Bitcoin mining의 전력 소비가 국가 단위 소비와 비교될 정도로 커졌다고 설명하며, 이로 인해 special-purpose mining chip과 cheap power source 근처의 대형 mining installation이 생겨났다고 지적한다. 이런 비용 때문에 proof of stake, memory-intensive proof of work, permissioned blockchain용 저비용 consensus에 대한 관심이 커졌다.

현실에서는 여러 사용자가 `mining pool`을 구성하기도 한다. mining pool은 공동으로 block을 mine하고, 성공 시 수익을 구성원에게 나누는 consortium이다. 이는 개인 miner의 reward variance를 줄여 주지만, mining power 집중이라는 governance 문제를 낳을 수 있다.

### 26.4.2 Proof of Stake

`proof-of-stake`는 blockchain currency에 큰 stake를 가진 node가 block을 추가할 가능성을 높이는 방식이다. 단, 가장 큰 stakeholder가 chain을 항상 통제하게 만들면 안 되므로, 일반적으로 mining success probability를 stake에 비례해 조정하는 방식으로 사용된다. stake requirement와 mining difficulty를 함께 조정하면 block 생성 rate도 제어할 수 있다.

proof-of-stake scheme은 다양하다. 전체 stake뿐 아니라 stake를 보유한 기간을 고려할 수도 있고, stake의 일부를 일정 기간 future에 inactive 상태로 묶어 두도록 요구할 수도 있다. 이 inactive reserve는 잘못된 행동에 대한 penalty 또는 비용 장벽으로 작동한다.

proof of stake는 proof of work보다 에너지 비용이 낮을 수 있지만 tuning이 어렵다. 고려해야 할 parameter가 많고, adversary가 longest chain이 아닌 fork에 block을 붙이는 데 드는 cost penalty가 너무 작으면 consensus 안정성이 약해진다. 즉, computation waste를 줄이는 대신 경제적 incentive와 penalty 설계를 더 정교하게 해야 한다.

### 26.4.3 Byzantine Consensus

`Byzantine consensus`는 work 또는 stake 기반이 아니라 message-based consensus에 속한다. distributed database system에서는 message-based consensus가 널리 쓰이지만, blockchain에서는 node가 malicious하게 행동할 수 있으므로 basic consensus protocol을 그대로 사용할 수 없다.

message-based consensus는 majority vote를 목표로 하며, public blockchain에서는 Sybil attack에 취약하다. 그러나 enterprise `permissioned blockchain`에서는 permissioning authority가 참여 권한을 부여하므로, malicious user가 과도한 node를 추가하려 하면 권한 부여 단계에서 막을 수 있다. 그렇다고 모든 참여자가 정직하다고 가정할 수는 없다. 공급망 blockchain에서 특정 supplier가 자기 이익을 위해 데이터를 위조하고, fraud investigation이 시작되면 이를 숨기기 위해 fork를 시도할 수 있는 식이다.

이런 상황은 `Byzantine failure` model로 다룬다. Byzantine failure에서는 failed node가 단순히 멈추는 것이 아니라, network를 방해하기에 정확히 필요한 임의의 행동을 할 수 있다고 가정한다. 이는 Paxos, Raft 같은 Chapter 23의 consensus protocol이 가정하는 `fail-stop model`과 다르다. fail-stop에서는 node나 link가 작동을 멈추는 것만 고려하며 malicious behavior는 배제된다.

Byzantine consensus는 minority node의 failure뿐 아니라 malicious behavior까지 이겨내는 majority rule을 찾아야 한다. 예를 들어 malicious node `n1`이 `n2`에게는 commit 의사를, `n3`에게는 abort 의사를 보내 consensus를 교란할 수 있다. 이런 behavior를 견디려면 agreement를 위한 message 수가 증가한다. 그러나 blockchain에서는 이 비용이 proof-of-work나 proof-of-stake mining 비용보다 훨씬 낮을 수 있으므로, permissioned blockchain에서는 충분히 받아들일 만한 trade-off가 된다.

modern Byzantine consensus algorithm은 forged message를 막기 위해 cryptographic signature를 사용하고, 현실적인 network assumption에 맞춰 설계된다. 완전한 asynchronous fault-tolerant consensus는 불가능하다는 한계가 있지만, `Practical Byzantine Fault Tolerance (PBFT)` 같은 접근은 `floor((n - 1) / 3)`개 node의 malicious failure를 견디며 실용적인 성능을 제공하는 방식으로 알려져 있다.

## 26.5 Data Management in a Blockchain

지금까지는 blockchain에서 정보를 lookup하는 효율성보다 append와 consensus에 집중했다. 그러나 block을 validate하려면 각 node가 transaction input이 이미 spent인지 확인해야 한다. 원칙적으로는 blockchain 전체를 genesis block까지 거꾸로 search할 수 있지만, 이는 지나치게 비싸다. 따라서 blockchain database에는 efficient lookup을 위한 data structure가 필요하다.

또한 모든 blockchain이 Bitcoin처럼 transaction input을 과거 transaction output으로만 제한하지는 않는다. Ethereum은 각 `account`의 balance와 associated storage를 포함하는 `state`를 유지한다. 이 model은 database system에 더 가깝지만, 단순히 그 state를 일반 database에 저장하면 Section 26.2의 blockchain properties를 보존할 수 없다. 다음 구간은 이런 richer model을 physical data structure와 database system concept으로 어떻게 표현하는지 다룬다.

### 26.5.1 Efficient Lookup in a Blockchain

Bitcoin-style transaction을 validate하려면 세 가지를 확인해야 한다.

| 검증 항목 | 비용/의미 |
|---|---|
| syntactically well formed | data format, input/output 합계 등 형식 검증이며 비교적 straightforward하다. |
| correctly signed | submitter의 private key로 만들어진 signature가 public key로 검증되는지 확인한다. 비용이 아주 크지는 않다. |
| inputs not already spent | 각 input transaction이 이미 다른 transaction의 input으로 사용되지 않았는지 확인해야 한다. 오래된 transaction일 수 있으므로 naive search는 매우 비싸다. |

double-spend를 막으려면 어떤 input transaction이 이전에 이미 사용되었는지 확인할 수 있어야 한다. 이를 위해 각 full node는 모든 `unspent transaction`에 대한 index를 유지할 수 있다. index entry는 blockchain 안의 해당 transaction 위치를 가리키며, node는 이를 통해 input transaction의 detail을 validate한다.

Bitcoin을 포함한 많은 blockchain은 block 안의 transaction을 `Merkle tree`로 저장해 lookup과 validation을 돕는다. Chapter 23의 Merkle tree와 마찬가지로, 악의적 사용자가 collection을 오염시켰는지 효율적으로 검증할 수 있다. blockchain에서는 spent transaction만 포함하는 subtree를 잘라내는 등 Merkle tree optimization도 가능하다. 이는 full blockchain 저장 공간을 줄이는 데 중요하다. 주요 blockchain은 월 1GB 이상 빠르게 성장할 수 있기 때문이다.

Merkle tree는 `light node`에 특히 유용하다. light node는 전체 blockchain을 저장하지 않고 tree의 `root hash`만 보관해도 된다. full node가 필요한 data와 verification path에 해당하는 hash들을 제공하면, light node는 그 data가 자신이 보관한 root hash와 일치하는 collection의 일부인지 검증할 수 있다.

### 26.5.2 Maintaining Blockchain State

Bitcoin-style model은 과거 transaction output을 input으로 소비하고 새 output을 만드는 방식이다. 반면 Ethereum 같은 blockchain은 각 account의 balance와 storage를 포함하는 `state`를 유지한다. transaction은 account 사이의 Ether 이동과 state update를 수행한다.

miners가 transaction을 block 안에 serialize하므로, Chapter 18의 concurrency-control protocol이 필요하지 않다. 각 block에는 transaction sequence뿐 아니라 그 block의 transaction 실행 후 존재한 state도 포함된다. 그러나 매 block마다 전체 state를 복제하면 낭비가 크다. 한 block의 transaction 수는 제한적이고 전체 state 중 작은 부분만 바뀌는 경우가 많기 때문이다.

state도 Merkle tree와 유사하게 저장할 수 있다. unchanged state 부분은 이전 block의 subtree를 hash pointer와 함께 재사용하고, changed path만 새로 만들면 된다. 문제는 state에서는 tree node의 change뿐 아니라 insert/delete도 필요하다는 점이다. 이를 위해 Ethereum 등은 `Merkle-Patricia tree` 변형을 사용한다. 이 구조는 efficient key-based search를 제공하며, 실제로 이전 immutable tree를 수정하지 않고 새 root를 만들면서 prior tree의 subtree를 reference한다.

database 관점에서 중요한 점은 blockchain state 저장이 반드시 순수 custom structure만으로 구현되는 것은 아니라는 점이다. `Corda`, `Hyperledger Fabric`, `BigchainDB`는 state 저장과 query를 위해 database를 사용한다. Fabric과 BigchainDB는 `NoSQL database`, Corda는 embedded `SQL database`, Ethereum은 `key-value store`에 state를 저장한다. 즉, blockchain property를 유지하면서도 queryable state를 제공하려면 blockchain data structure와 database storage engine이 결합될 수 있다.

## 26.6 Smart Contracts

지금까지는 단순 funds-transfer transaction을 중심으로 보았지만, 실제 blockchain transaction은 executable code를 포함할 수 있다. 이 code를 통해 복잡한 조건부 거래, 자동 실행 규칙, 서비스 제공 로직을 blockchain 안에 배치할 수 있다. Blockchain마다 지원 language와 language power가 다르며, 일부는 모든 계산을 표현할 수 있는 `Turing-complete language`를 제공하고, 일부는 더 제한적 language만 제공한다.

### 26.6.1 Languages and Transactions

Bitcoin은 제한된 power의 language를 사용한다. 이 language는 표준적인 conditional funds-transfer transaction을 정의하기에는 충분하며, 핵심 기능 중 하나가 `multisig` instruction이다. multisig는 지정된 `n`명 중 `m`명의 승인을 요구한다. 이를 통해 trusted third party가 dispute를 해결하는 escrow transaction을 만들 수 있고, 두 사용자 사이의 여러 transaction을 하나의 큰 transaction으로 묶어 blockchain에 제출할 수도 있다. transaction을 chain에 추가하는 데 delay와 fee가 있으므로, 여러 component transaction을 묶는 기능은 중요하다.

Ethereum과 많은 enterprise blockchain은 `Turing complete` language를 제공한다. 표현력은 강하지만 위험도 크다. Turing-complete language에서는 infinite loop를 작성할 수 있고, halting problem 때문에 일반적으로 code termination을 완전히 판정할 수 없다. malicious user가 무한 루프나 매우 긴 실행 시간을 가진 transaction을 제출하면 miner와 full node resource를 소모할 수 있다.

Ethereum은 이를 `gas` model로 제어한다. 각 instruction은 고정된 gas를 소비하고, transaction submitter는 code execution 비용을 miner에게 지불한다.

| gas parameter | 의미 | 설계상 효과 |
|---|---|---|
| `gas price` | gas 1 unit당 사용자가 miner에게 지불하려는 Ether 양 | 너무 낮으면 miner가 transaction을 포함하지 않아 wait가 길어질 수 있고, 너무 높으면 overpay가 된다. |
| `transaction gas limit` | transaction이 소비할 수 있는 gas 상한 | 초과하면 transaction은 abort되고 action은 commit되지 않지만, miner는 payment를 가져간다. |
| `block gas limit` | 한 block의 모든 transaction gas limit 합에 대한 system-level limit | block 하나가 너무 많은 computation을 포함하지 못하게 한다. |

gas limit 설정도 trade-off다. 너무 낮으면 transaction failure가 발생하고, 너무 높으면 block gas limit의 큰 부분을 차지해 miner가 포함을 꺼릴 수 있다. 따라서 smart-contract designer는 cost와 mining speed를 함께 최적화해야 한다.

state-based blockchain인 Ethereum에는 Bitcoin-style explicit input transaction이 없다. 같은 account에서 나온 transaction 순서를 강제하기 위해 Ethereum은 `account nonce`를 사용한다. account nonce는 account별 transaction sequence number이며, 같은 account의 transaction은 consecutive sequence number를 가져야 한다. 같은 sequence number를 가진 두 transaction은 허용되지 않고, 이전 sequence number의 transaction이 accepted된 뒤에야 다음 transaction이 accepted된다. 서로 다른 account의 transaction 순서를 강제하려면, 두 번째 transaction이 첫 번째 transaction 처리 전에는 validate되지 않도록 smart contract를 설계해야 한다.

miner는 block에 포함하려는 transaction의 smart-contract code를 실행해야 하고, 모든 full node도 mined block의 모든 transaction code를 실행해야 한다. 따라서 code execution security가 중요하다. 일반적으로 Java virtual machine 스타일의 safe virtual machine에서 실행된다. Ethereum은 `EVM (Ethereum Virtual Machine)`을 사용하고, Hyperledger는 Docker container에서 code를 실행한다.

### 26.6.2 External Input

smart contract는 external event에 의존할 수 있다. 예를 들어 crop-insurance smart contract는 growing season의 rainfall에 따라 농부에게 payment를 지급할 수 있다. 미래 rainfall은 contract 작성 시점에 알 수 없으므로 hard-code할 수 없다. 따라서 모든 contract party가 신뢰하는 external source에서 input을 받아야 하며, 이런 source를 `oracle`이라고 한다.

oracle은 많은 business smart contract에서 필수적이지만, blockchain의 일반적 `trustlessness`를 일부 타협한다. 다만 oracle은 contract 당사자들이 합의한 뒤 smart contract에 immutable하게 coded되므로, 전체 blockchain의 trust model보다 해당 contract의 trust assumption으로 국한된다.

문제는 oracle이 operating smart contract에 coded된 뒤 부패하거나 잘못된 값을 제공하는 경우다. 이를 단순히 legal system에 맡길 수도 있지만, 더 바람직하게는 future dispute settlement process를 contract 안에 code로 넣는 것이다. 예를 들어 contract party가 oracle approval을 주기적으로 recertify하도록 하고, recertification이 실패하면 특정 action이 수행되도록 설계할 수 있다.

smart contract가 직접 external output을 내보내는 것은 까다롭다. output은 execution 중에 발생하지만, 해당 transaction은 아직 blockchain에 추가되기 전일 수 있기 때문이다. Ethereum은 smart contract가 `event`를 emit하고, 그 event를 blockchain에 log하는 방식을 사용한다. 외부 system은 public blockchain log를 관찰해 off-chain action을 trigger할 수 있다.

### 26.6.3 Autonomous Smart Contracts

Ethereum을 포함한 많은 blockchain에서 smart contract는 independent entity로 deploy될 수 있다. 이런 contract는 자기 account, balance, storage를 가지며, user나 다른 smart contract는 transaction message를 보내 contract의 service를 사용하고 currency를 주고받을 수 있다.

contract code 설계에 따라 user는 message를 보내 contract를 control할 수도 있고, contract는 계속 autonomous하게 동작할 수도 있다. 이런 형태를 `distributed autonomous organization (DAO)`라고 한다. DAO는 entity가 code로 communicate, store data, do business를 수행하게 만드는 강력한 개념이지만, 생성 후 통제와 관리가 어렵다. bug fix를 설치할 방법이 없고 legal/regulatory 문제도 많다. enterprise setting에서는 smart contract가 보통 조직 또는 consortium의 일정한 control 아래에서 운영된다.

smart contract는 다른 currency 위에 새로운 currency를 만드는 데도 사용될 수 있다. Ethereum은 existing ecosystem과 wallet infrastructure를 활용할 수 있어 base blockchain으로 자주 사용된다. 상위 currency unit은 `token`이라고 하며, 이런 currency를 만드는 과정을 `initial coin offering (ICO)`라고 한다. `ERC-20`은 널리 쓰이는 Ethereum token standard이며, 이후 다양한 ERC standard가 제안되었다. 다만 ICO는 fundraising 수단이 되는 동시에 scam을 낳아 regulation 시도를 불러왔다.

autonomous service provider를 smart contract로 만들면 human-run organization을 신뢰하지 않는 trustless service를 만들 수 있다. 그러나 완전 autonomous contract는 stop하거나 modify할 수 없으므로 bug가 영구히 남는다. contract가 operation 비용, 예를 들어 Ethereum의 gas를 감당할 currency를 계속 벌 수 있으면 계속 살아 있을 수 있다. 이런 위험 때문에 contract creator가 `self-destruct message`를 보낼 수 있게 하는 등, trustlessness를 일부 타협하는 설계가 현실적으로 필요할 수 있다.

### 26.6.4 Cross-Chain Transactions

지금까지는 transaction이 하나의 blockchain 안에서만 일어난다고 가정했다. 그러나 한 blockchain의 account에서 다른 blockchain의 account로 currency를 옮기려면 두 문제가 생긴다. 첫째, 두 chain의 currency가 다르다. 둘째, cross-chain transaction의 각 시점 state에 대해 두 blockchain이 함께 합의해야 한다.

단일 조직이 전체 distributed system을 통제한다면 two-phase commit을 사용할 수 있다. 그러나 federated system처럼 여러 조직이 통제하는 환경에서는 coordination이 더 어렵고, blockchain에서는 각 system의 autonomy와 immutability requirement 때문에 장벽이 더 높다.

가장 단순한 방법은 traditional fiat currency exchange처럼 동작하는 trusted intermediary organization을 두는 것이다. trustless하게 처리하려면, 양쪽 사용자가 두 blockchain 모두에 account를 가지고 있고, 한 chain의 transaction이 mined되면 smart-contract code가 secret을 공개해 다른 chain transaction cancel을 막는 식의 설계가 필요하다. 사용되는 기법에는 `time-lock transaction`과 `cross-chain exchange of Merkle-tree headers` 등이 있다.

cross-chain 기법의 위험 중 하나는 성공적으로 mined된 transaction이 나중에 orphaned fork 위에 있는 것으로 판명되는 경우다. 이를 완화하는 방법은 있지만 system-specific하다. 더 일반적인 접근은 stock exchange와 유사하게 willing buyer와 seller를 match하는 smart contract market을 만드는 것이다. 이 contract는 human-run bank나 brokerage 대신 trusted intermediary 역할을 수행한다. cross-chain transaction은 여전히 active research area다.

## 26.7 Performance Enhancement

blockchain system은 성능 관점에서 세 구성 요소로 나누어 볼 수 있다.

| component | 역할 | 성능 병목 |
|---|---|---|
| `consensus management` | proof-of-work, proof-of-stake, Byzantine consensus, hybrid approach 등으로 block 추가 합의를 수행한다. | transaction processing performance를 가장 크게 지배한다. |
| `state-access management` | account-id/user ID index, key-value store, SQL interface 등을 통해 current blockchain state를 조회한다. | smart contract가 복잡한 query를 요구하면 indexing과 access method가 중요해진다. |
| `smart contract execution` | smart-contract code를 virtualized environment에서 안전하게 실행한다. | code 실행 비용, gas, VM/container overhead가 성능에 영향을 준다. |

전통적 database system은 단순 funds-transfer transaction을 초당 수만 건 수준으로 처리할 수 있지만, public blockchain의 `throughput`은 훨씬 낮다. Bitcoin은 초당 10건 미만, Ethereum도 책 집필 시점 기준 초당 10건을 조금 넘는 수준으로 설명된다. 원인은 proof-of-work 같은 방식이 단위 시간당 추가 가능한 block 수를 제한하기 때문이다. Bitcoin은 약 10분에 block 하나를 목표로 하며, block 하나가 여러 transaction을 담더라도 전체 rate는 제한된다.

`latency` 또는 response time도 더 심각할 수 있다. Bitcoin에서는 block 하나가 mine되는 10분뿐 아니라, 해당 block이 fork에서 orphaned될 가능성을 줄이기 위해 후속 block 여러 개를 기다려야 한다. 관례적으로 6 blocks를 기다리면 실제 latency는 약 1시간이 된다. 이는 interactive real-time transaction processing에는 맞지 않는다. 전통적 database system은 individual transaction commit을 millisecond response time으로 처리할 수 있다.

이 문제는 주로 public blockchain의 consensus overhead에서 비롯된다. Permissioned blockchain은 더 빠른 message-based Byzantine consensus를 사용할 수 있지만, state access, smart contract execution, failure/attack 시 성능 저하 같은 다른 성능 문제는 여전히 남는다.

### 26.7.1 Enhancing Consensus Performance

blockchain consensus 성능 향상에는 두 대표 접근이 있다.

| 접근 | 핵심 아이디어 | 장점 | trade-off |
|---|---|---|---|
| `sharding` | account를 여러 shard로 partition하고 shard별 mining을 parallel하게 수행한다. | node 사이 parallelism으로 throughput을 높일 수 있다. | shard별 miner 집합이 작아져 공격 비용이 낮아질 수 있고, cross-shard transaction 관리가 필요하다. |
| `off-chain transaction processing` | trusted off-chain system이 transaction을 내부 처리한 뒤 여러 transaction을 하나로 묶어 blockchain에 기록한다. | throughput과 latency를 traditional database-system 수준에 가깝게 만들 수 있다. | anonymity와 immutability가 일부 약해질 수 있고, confirmation 빈도를 높이면 성능 이득이 줄어든다. |

sharding에서 transaction이 여러 shard에 걸치면 각 shard에 별도 transaction이 실행되고, system-internal `cross-shard transaction`이 기록되어 두 부분이 모두 commit되도록 보장한다. overhead는 낮게 만들 수 있지만, shard 단위 miner 집합이 작아지는 만큼 attack surface가 달라진다.

off-chain transaction processing의 대표 예는 `Lightning network`다. Lightning은 off-chain processing으로 Bitcoin transaction을 빠르게 하고, 일부 cross-chain transaction도 처리할 수 있다. off-chain에서 commit된 transaction이 blockchain에서 reject될 수 있다는 의미에서 immutability는 줄어든다. blockchain confirmation을 더 자주 하면 immutability 손실은 줄지만 performance improvement도 줄어든다.

### 26.7.2 Enhancing Query Performance

단순 funds-transfer blockchain에서는 user/account identifier에 대한 index만 있어도 unspent transaction lookup을 처리할 수 있다. 하지만 complex smart contract는 current blockchain state에 대해 general-purpose query를 실행해야 할 수 있다. 이런 query는 Chapter 16에서 다룬 join query optimization과 비슷한 요구를 만들 수 있다.

문제는 blockchain system에서 state-access management가 execution engine과 분리되어 있을 수 있고, state representation에 쓰이는 `Merkle-Patricia tree` 같은 구조가 join-style query algorithm 선택을 제한할 수 있다는 점이다. 즉, cryptographic integrity를 위해 선택한 structure가 database-style query optimization의 자유도를 줄일 수 있다.

traditional database 또는 NoSQL database 위에 구축된 blockchain system은 state information을 database 안에 유지하고, smart contract가 higher-level database-style query를 실행할 수 있게 한다. 장점은 query 성능과 표현력이고, 비용은 true blockchain data structure만큼 엄격한 cryptographic protection이 약할 수 있다는 점이다. 현실적 절충은 trusted provider가 database를 host하고, update를 database뿐 아니라 blockchain에도 기록해 원하는 사용자가 secure blockchain against database validation을 수행할 수 있게 하는 방식이다.

### 26.7.3 Fault-Tolerance and Scalability

traditional database system에서 failure 성능은 recovery manager 성능으로 측정되는 경우가 많다. Chapter 19의 `ARIES` recovery algorithm은 recovery time 최적화에 초점을 둔다. 반면 blockchain system은 failure와 malicious attack 중에도 continuous operation을 목표로 consensus mechanism과 replication strategy를 설계한다. 따라서 throughput과 latency뿐 아니라 failure 또는 attack 기간 동안 이 metric들이 어떻게 변하는지도 측정해야 한다.

scalability도 parallel/distributed database와 다른 방식으로 나타난다. 예를 들어 `2PC`에서는 transaction이 고정된 5개 node만 접근하면 system 전체 node 수와 무관하게 그 5개 node의 agreement만 필요하다. 그러나 Byzantine consensus에서는 모든 transaction이 non-failed node majority의 agreement를 필요로 하므로, agreement에 참여해야 하는 node 수가 처음부터 더 크고 network scale이 커질수록 더 빠르게 증가한다. 이 때문에 permissioned blockchain에서도 node 수를 늘리는 것이 곧바로 linear scaleup을 의미하지 않는다.

## 26.8 Emerging Applications

blockchain이 특히 유용한 application은 두 특징을 가진다. 첫째, high-value data 또는 historical data가 malicious modification으로부터 보호되어야 한다. 둘째, update가 대체로 append 중심이다. 또 다른 적합한 경우는 여러 cooperating parties가 서로 어느 정도는 신뢰하지만 완전히 신뢰하지는 않으며, digitally signed shared transaction record를 원할 때다.

| application domain | blockchain이 주는 가치 |
|---|---|
| `Academic certificates and transcripts` | certificate/transcript를 student public key로 보호하고 university digital signature로 검증 가능하게 하면, 학생이 public source에서 안전하게 record 접근 권한을 제공할 수 있다. |
| `Accounting and audit` | cryptographically signed distributed ledger는 insider attack이나 database compromise 이후의 ledger tampering을 막는 데 도움이 된다. auditor가 participant라면 periodic audit이 아니라 continuous audit에 가까워질 수 있다. |
| `Asset management` | real-estate deed, stock, bond 같은 ownership record를 public하게 검증하면서 signed update만 허용할 수 있다. depository 같은 중앙 기록 보관자를 덜 신뢰해도 된다. |
| `E-government` | 여러 agency의 중복 record를 줄이고 common authoritative source를 만들 수 있다. 다만 privacy, access control, governance 설계가 핵심이다. |
| `Foreign-currency exchange` | intermediary cryptocurrency를 사용하면 international financial transaction을 더 빠르게 처리하고 irrefutable traceability를 제공할 수 있다. |
| `Health care` | 여러 provider가 추가하는 health record의 provenance와 access를 통합할 수 있다. 실제 record는 off-chain에 두고 blockchain은 trusted access mechanism으로 쓸 수 있다. |
| `Insurance claims` | claim 현장, repair contractor, witness statement 등 여러 source의 workflow data를 빠르고 안전하게 공유해 accuracy와 efficiency를 높일 수 있다. |
| `Internet of Things (IoT)` | 많은 device가 central server 없이 transaction을 network로 전달할 수 있다. entry가 매우 많아지면 chain 대신 directed acyclic graph, 예를 들어 `tangle`, 구조가 논의될 수 있다. |
| `Loyalty programs and aggregation of transactions` | vendor-internal cryptocurrency나 loyalty point를 permissioned blockchain으로 운영해 fee를 줄이고 partner 간 workload를 분산할 수 있다. |
| `Supply chain` | item movement를 participant마다 기록해 recall 범위를 빠르게 좁히고, quality issue 이후의 record falsification을 어렵게 만든다. |
| `Tickets for events` | digitally signed ticket과 blockchain transaction으로 ticket double-spending을 검출하고 authenticity를 확인할 수 있다. |
| `Trade finance` | letters of credit, bills of lading, title transfer처럼 여러 party가 참여하는 문서 기반 절차를 digital, signed, secure workflow로 바꾸어 지연을 줄일 수 있다. |

이 목록의 공통점은 “중앙 DB로도 할 수 있는가?”보다 “여러 주체가 공유하는 append-heavy 기록에서, 특정 한 주체가 몰래 history를 바꾸지 못하게 할 필요가 있는가?”다. blockchain은 모든 database workload에 맞는 일반 대체재가 아니라, trust boundary와 immutability requirement가 설계 중심에 있는 workload에 적합하다.

## 26.9 Summary

blockchain은 traditional database로 달성하기 어려운 수준의 privacy, anonymity, decentralization을 제공할 수 있다. `public blockchain`은 인터넷에 공개적으로 accessible하며, `permissioned blockchain`은 특정 organization이나 enterprise group이 참여 권한을 관리한다.

public blockchain의 대표 consensus mechanism은 `proof-of-work`와 `proof-of-stake`다. miner는 다음 block을 추가하기 위해 경쟁하고, 성공하면 blockchain currency로 reward를 받는다. permissioned blockchain은 많은 경우 `Byzantine consensus algorithm`으로 다음 block을 추가할 node를 정한다. block을 추가하는 node는 먼저 block을 validate하고, full node들도 새 block을 local replica에 추가하기 전에 validate한다.

blockchain의 핵심 property는 `irrefutability`와 `tamper resistance`다. 이를 위해 cryptographic hash function은 `collision resistance`, `irreversibility`, `puzzle friendliness`를 가져야 한다. `public-key encryption`은 public/private key 쌍을 사용해 data encryption과 `digital signature`를 가능하게 한다.

`proof-of-work`는 target을 만족하는 hash를 만들기 위해 성공적인 `nonce`를 많은 계산으로 추측해야 한다. `proof-of-stake`는 blockchain currency ownership에 기반한다. 두 방식의 hybrid도 가능하다.

`smart contract`는 blockchain 안의 executable code다. 어떤 chain에서는 smart contract가 자기 data와 account를 가진 independent entity로 동작하며, complex business agreement나 ongoing service를 표현할 수 있다. 외부 세계의 입력은 trusted `oracle`을 통해 받는다.

state를 유지하는 blockchain은 database system과 유사하게 동작할 수 있고, indexing method와 access optimization의 도움을 받을 수 있다. 그러나 cryptographic structure는 query algorithm과 storage format에 제약을 줄 수 있으므로, blockchain database는 전통적 DBMS의 대체재라기보다 tamper-resistant shared state/log와 database-style query capability 사이의 trade-off로 이해하는 것이 좋다.

이 장의 further reading은 blockchain database 개념을 몇 개의 뿌리로 연결한다. `Nakamoto (2008)`는 Bitcoin의 peer-to-peer electronic cash model, `Buterin (2013)`은 Ethereum과 smart contract platform, `Diffie and Hellman (1976)` 및 `Rivest-Shamir-Adleman (RSA)` 계열은 public-key cryptography, `Lamport`, `Shostak`, `Pease`와 `Castro and Liskov (1999)`는 Byzantine agreement와 PBFT, `Dinh et al.`의 BLOCKBENCH 계열은 permissioned blockchain 성능 측정, `ForkBase`는 blockchain/forkable application용 storage engine 관점과 연결된다.

핵심 review terms:

`public blockchain`, `permissioned blockchain`, `cryptographic hash`, `mining`, `nonce`, `light node`, `full node`, `block validation`, `proof-of-work`, `proof-of-stake`, `Byzantine consensus`, `tamper resistance`, `collision resistance`, `irreversibility`, `puzzle friendliness`, `public-key encryption`, `digital signature`, `irrefutability`, `double spend`, `fork`, `hard fork`, `soft fork`, `orphaned block`, `Merkle tree`, `Patricia tree`, `Bitcoin`, `Ethereum`, `gas`, `smart contract`, `oracle`, `cross-chain transaction`, `sharding`, `off-chain processing`.
