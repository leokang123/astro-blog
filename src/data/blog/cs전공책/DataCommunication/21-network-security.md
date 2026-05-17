---
title: "Network Security"
order: 21
pubDatetime: 2026-05-18T00:00:00+09:00
modDatetime: 2026-05-18T00:00:00+09:00
description: "Data and Computer Communications 정리: Network Security"
tags:
  - "DataCommunication"
  - "CS"
---

## 개요

Chapter 21은 network와 Internet application 환경에서 필요한 보안 요구사항과, 이를 구현하는 핵심 mechanism을 다룬다. 앞 장들이 IP, TCP, UDP, application protocol의 동작을 설명했다면, 이 장은 그 통신이 `confidentiality`, `integrity`, `availability`, `authenticity`를 어떻게 만족할 수 있는지 설명한다.

이 장의 흐름은 `security requirements and attacks → symmetric encryption → message authentication/hash functions → public-key encryption/digital signatures → SSL/TLS → IPSec → Wi-Fi Protected Access`다. 핵심 도구는 encryption이며, 실제 secure networking에서는 symmetric encryption과 public-key encryption을 조합한다. 보통 data 자체는 빠른 symmetric encryption으로 보호하고, session key 분배나 digital signature에는 public-key cryptography를 사용한다.

## 핵심 개념

| 세부 주제 | 핵심 질문 | 검색용 용어 |
|---|---|---|
| Security Requirements and Attacks | 무엇을 보호해야 하며 공격은 어떤 범주로 나뉘는가? | confidentiality, integrity, availability, authenticity, passive attack, active attack |
| Confidentiality with Symmetric Encryption | shared secret key로 data confidentiality를 어떻게 제공하는가? | symmetric encryption, DES, Triple DES, AES, key distribution |
| Message Authentication and Hash Functions | message source와 내용 변경 여부를 어떻게 확인하는가? | MAC, hash function, SHA-512, HMAC, message digest |
| Public-Key Encryption and Digital Signatures | public/private key pair로 confidentiality와 authentication을 어떻게 제공하는가? | public key, private key, RSA, digital signature, certificate |
| SSL/TLS | TCP 위에서 Web transaction 보안을 어떻게 제공하는가? | SSL, TLS, Record Protocol, Handshake Protocol, session, connection |
| IPv4 and IPv6 Security | IP layer에서 packet 단위 보안을 어떻게 제공하는가? | IPSec, AH, ESP, security association |
| Wi-Fi Protected Access | WLAN access control과 link security를 어떻게 제공하는가? | 802.11i, WPA, 802.1X, EAP, controlled port |

## 세부 정리

### 21.1 Security Requirements and Attacks

Network security가 필요해진 배경은 두 번 크게 바뀌었다. 첫째, data processing equipment가 널리 쓰이기 전에는 정보 보안이 주로 physical means와 administrative means에 의존했다. 예를 들어 sensitive document를 combination lock이 있는 cabinet에 넣거나, personnel screening procedure로 사람을 통제했다. 둘째, computer와 shared system이 등장하면서 stored files와 system access를 자동으로 보호할 도구가 필요해졌다. 여기에 distributed systems와 public data network가 더해지자, 이제 data가 transmission 중일 때도 보호되어야 했다.

`computer security`가 host 안의 stored data와 local access control에 초점을 둔다면, `network security`는 data가 terminal-user, computer-computer, network-network 사이를 이동하는 동안 confidentiality와 authenticity를 보장하는 문제를 다룬다. 원문은 자동화된 network/computer security application의 기반 기술이 거의 모두 `encryption`이라고 본다. Encryption은 크게 `symmetric encryption`과 `public-key/asymmetric encryption`으로 나뉜다.

#### Security Requirements

Computer and network security는 네 가지 요구사항을 다룬다.

| Requirement | 의미 | 공격자가 성공하면 생기는 일 |
|---|---|---|
| `Confidentiality` | data가 authorized parties에게만 accessible해야 한다. Access에는 print, display, disclosure, object 존재 자체의 노출까지 포함된다. | message content가 노출되거나 traffic pattern으로 정보가 추론된다. |
| `Integrity` | authorized parties만 data를 modify할 수 있어야 한다. Modify에는 write, change, status change, delete, create가 포함된다. | message가 변조되거나 순서/시점이 조작된다. |
| `Availability` | authorized parties가 필요할 때 data와 service를 사용할 수 있어야 한다. | denial of service로 service가 느려지거나 사용할 수 없게 된다. |
| `Authenticity` | host나 service가 user/entity identity를 verify할 수 있어야 한다. | masquerade, replay로 다른 entity인 척한다. |

이 네 요구사항은 서로 독립처럼 보이지만 실제 protocol에서는 얽힌다. 예를 들어 encryption은 confidentiality를 제공하지만, 그것만으로 message가 변조되지 않았다는 integrity나 sender가 누구인지에 대한 authenticity를 자동 보장하지는 않는다. 반대로 authentication code는 message integrity와 source authentication에는 강하지만, message content를 숨기지는 않는다.

#### Passive Attacks

보안 공격은 크게 `passive attacks`와 `active attacks`로 나뉜다. Passive attack은 system resource를 바꾸지 않고, communication에서 정보를 알아내려는 공격이다. 흔히 `eavesdropping` 또는 monitoring에 해당한다.

Passive attack에는 두 종류가 있다.

| Passive attack | 설명 | 방어 관점 |
|---|---|---|
| `Release of message contents` | telephone conversation, electronic mail, transferred file 같은 message 내용 자체를 읽는다. | encryption으로 content를 읽지 못하게 한다. |
| `Traffic analysis` | content는 encryption으로 숨겨져도, communicating hosts의 위치/identity, message frequency, message length, timing pattern을 관찰한다. | content encryption만으로 충분하지 않을 수 있고, traffic padding 등 pattern 은닉이 필요할 수 있다. |

Passive attack은 data를 alter하지 않으므로 detection이 매우 어렵다. Sender와 receiver 입장에서는 message가 정상적으로 송수신된 것처럼 보인다. 따라서 passive attack 대응은 detection보다 prevention 중심이다. 대표 수단은 encryption이다.

#### Active Attacks

Active attack은 data stream을 modify하거나 false stream을 만들어 system resource나 operation에 영향을 준다. 원문은 네 범주로 나눈다.

| Active attack | 설명 | 예 |
|---|---|---|
| `Masquerade` | 한 entity가 다른 entity인 척한다. | 낮은 권한 entity가 높은 권한 entity로 impersonation |
| `Replay` | data unit을 passive capture한 뒤 다시 transmit해 unauthorized effect를 만든다. | valid authentication sequence를 캡처 후 재사용 |
| `Modification of messages` | legitimate message 일부를 변경하거나, message를 delay/reorder한다. | "John Smith에게 confidential file read 허용"을 "Fred Brown에게 허용"으로 변경 |
| `Denial of Service(DoS)` | normal use 또는 management를 방해한다. | 특정 destination message 억제, server/network overload |

Active attack은 data와 service 상태를 바꾸므로 passive attack보다 detect 가능성이 높지만, 완전히 예방하기는 어렵다. 따라서 active attack 대응은 prevention뿐 아니라 detection과 recovery가 함께 필요하다. 이후 절의 MAC, hash, digital signature, certificate, SSL/TLS, IPSec은 이 네 요구사항과 active/passive attack 모델을 protocol mechanism으로 옮긴 것이다.

### 21.2 Confidentiality with Symmetric Encryption

Transmitted data의 `confidentiality`를 제공하는 보편적 기술은 `symmetric encryption`이다. Symmetric encryption은 `conventional encryption` 또는 `single-key encryption`이라고도 하며, public-key encryption이 등장하기 전부터 비밀 통신의 주된 방식이었다. 오늘날에도 bulk data encryption에서는 public-key 방식보다 훨씬 널리 쓰인다. 이유는 속도와 효율이다.

#### Symmetric Encryption Model

Symmetric encryption에서는 sender와 receiver가 같은 `secret key`를 공유한다. Sender는 plaintext와 secret key를 encryption algorithm에 넣어 ciphertext를 만들고, receiver는 같은 secret key와 decryption algorithm으로 plaintext를 복원한다.

![Figure 21.1](@/assets/images/data-communication-279-figure-21-1-page-724.png)
*Figure 21.1 · PDF p. 724 · sender와 receiver가 같은 secret key K를 공유하는 symmetric encryption 기본 모델*

Symmetric encryption scheme의 다섯 구성요소는 다음과 같다.

| 구성요소 | 의미 |
|---|---|
| `Plaintext` | encryption algorithm에 입력되는 original message/data |
| `Encryption algorithm` | plaintext에 substitution과 transformation을 적용해 ciphertext를 만든다. |
| `Secret key` | sender와 receiver가 공유하는 key. 실제 substitution/transformation은 key에 의해 결정된다. |
| `Ciphertext` | plaintext와 secret key로부터 생성된 scrambled message |
| `Decryption algorithm` | ciphertext와 같은 secret key를 사용해 original plaintext를 복원한다. |

Symmetric encryption이 안전하려면 두 조건이 필요하다.

1. `Strong encryption algorithm`: 공격자가 algorithm을 알고, 여러 ciphertext나 plaintext-ciphertext pair를 갖고 있어도 plaintext나 key를 알아내기 어려워야 한다.
2. `Secure key distribution/protection`: sender와 receiver가 secret key를 안전하게 얻고, 이후 key를 노출하지 않아야 한다.

여기서 중요한 원칙은 algorithm secrecy가 아니라 key secrecy다. 현실의 암호는 algorithm이 공개되어도 key 없이는 깨기 어렵도록 설계되어야 한다. 만약 key가 노출되면 그 key로 암호화된 과거와 미래의 communication이 모두 읽힐 수 있다.

Symmetric encryption에 대한 공격은 크게 두 가지다.

| 공격 | 설명 | 성공 시 영향 |
|---|---|---|
| `Cryptanalysis` | algorithm 구조, plaintext 특성, sample plaintext-ciphertext pair를 이용해 plaintext나 key를 추론한다. | key를 알아내면 해당 key로 보호한 모든 message가 compromise된다. |
| `Brute-force attack` | 가능한 모든 key를 시도해 intelligible plaintext가 나올 때까지 search한다. | 평균적으로 전체 key space의 절반을 시도해야 한다. |

Table 21.1은 key size가 security를 좌우한다는 점을 보여준다. 56-bit key는 과거에는 충분해 보였지만 병렬 처리 성능이 커지면 더 이상 computationally secure하지 않다. 반면 128-bit 이상 key space는 brute force에 대해 압도적으로 크다. 따라서 symmetric cipher의 security는 algorithm strength뿐 아니라 key length에도 크게 의존한다.

#### DES, Triple DES, AES

가장 흔한 symmetric encryption algorithm은 `block cipher`다. Block cipher는 fixed-size plaintext block을 입력으로 받아 같은 크기의 ciphertext block을 만든다. 이 절의 중요한 block cipher는 `DES(Data Encryption Standard)`, `Triple DES(3DES)`, `AES(Advanced Encryption Standard)`다.

| Algorithm | 핵심 | 한계/의의 |
|---|---|---|
| `DES` | 1977년 이후 오래 dominant했던 56-bit key block cipher | 56-bit key가 brute force에 취약해졌다. |
| `Triple DES(3DES)` | DES를 2개 또는 3개의 unique key로 세 번 반복해 112/168-bit key strength 제공 | software에서 느리고, 64-bit block size가 효율/security 측면에서 작다. |
| `AES` | 128-bit block, 128/192/256-bit key 지원 block cipher | 3DES 대체를 목표로 효율, security, hardware/software suitability를 고려해 표준화 |

원문은 AES를 128-bit key 기준으로 설명한다. AES는 128-bit input block을 byte matrix 형태의 `State` array에 복사하고, 각 round에서 State를 변형한다. 128-bit key는 44개의 32-bit word로 구성된 key schedule로 확장된다.

![Figure 21.2](@/assets/images/data-communication-280-figure-21-2-page-727.png)
*Figure 21.2 · PDF p. 727 · AES encryption/decryption의 round key 사용과 inverse transformation 흐름*

AES encryption은 처음 `Add Round Key`로 시작하고, 이후 round를 거치며 State를 바꾼 뒤 ciphertext를 만든다. Decryption은 inverse stage를 사용하고 expanded key를 reverse order로 적용한다.

AES round의 네 stage는 다음과 같다.

| AES stage | 종류 | 역할 |
|---|---|---|
| `Substitute bytes(SubBytes)` | substitution | `S-box` table로 byte-by-byte substitution 수행 |
| `Shift rows` | permutation | row 단위로 byte 위치를 이동 |
| `Mix columns` | substitution/mixing | column 안의 모든 byte를 함수로 섞어 각 byte를 변경 |
| `Add round key` | key mixing | current block과 expanded key 일부를 bitwise XOR |

![Figure 21.3](@/assets/images/data-communication-281-figure-21-3-page-728.png)
*Figure 21.3 · PDF p. 728 · AES 한 encryption round에서 SubBytes, ShiftRows, MixColumns, AddRoundKey가 적용되는 순서*

AES의 중요한 설계 직관은 `key mixing`과 `scrambling`의 반복이다. Add Round Key만 있으면 XOR encryption이라 약하고, 나머지 세 stage만 있으면 key를 사용하지 않아 security가 없다. AES는 key-dependent XOR와 reversible scrambling을 번갈아 적용해 효율성과 강도를 얻는다. 모든 stage는 reversible해야 decryption이 가능하다. Add Round Key의 inverse가 같은 XOR인 이유는 `A XOR A XOR B = B`이기 때문이다.

#### Link Encryption과 End-to-End Encryption

Encryption을 실제 network에 적용할 때는 "무엇을 encrypt할 것인가"와 "encryption device를 어디에 둘 것인가"를 결정해야 한다. 원문은 두 기본 대안을 비교한다.

![Figure 21.4](@/assets/images/data-communication-282-figure-21-4-page-729.png)
*Figure 21.4 · PDF p. 729 · packet-switching network에서 link encryption과 end-to-end encryption을 배치하는 방식*

| 방식 | 동작 | 장점 | 약점 |
|---|---|---|---|
| `Link encryption` | 각 vulnerable communications link 양끝에 encryption device를 둔다. Link를 지날 때 전체 packet이 암호화된다. | link traffic 전체와 header까지 보호해 traffic analysis 기회를 줄인다. | packet switch 안에서는 routing을 위해 decrypt해야 하므로 switch memory에서 packet/header가 노출된다. 대형 network에서는 장치가 많이 필요하다. |
| `End-to-end encryption` | source host/terminal이 user data를 encrypt하고 destination host/terminal이 decrypt한다. | network links/switches를 지나도 user data는 계속 암호화된 상태다. | packet routing을 위해 header는 cleartext로 남아야 하므로 traffic pattern은 노출된다. |

End-to-end encryption에서 전체 packet header까지 encrypt하면 packet-switching node가 header를 읽을 수 없어 routing할 수 없다. 따라서 end-to-end encryption은 user data portion만 보호한다. Confidentiality가 더 강하게 필요하면 link encryption과 end-to-end encryption을 함께 쓴다. Host가 user data를 end-to-end key로 encrypt하고, link에서는 packet 전체를 link key로 다시 encrypt한다. Switch는 link key로 packet을 decrypt해 header를 읽고 다음 link로 보낼 때 다시 encrypt한다.

#### Key Distribution

Symmetric encryption의 강도는 key distribution에 달려 있다. 두 party가 같은 key를 공유해야 하고, 그 key를 다른 사람이 보지 못해야 한다. 또한 key가 노출되었을 때 피해 범위를 줄이려면 key를 자주 바꾸는 것이 좋다.

두 party A와 B에 대한 key distribution 방법은 네 가지로 요약된다.

| 방법 | 설명 | 적합성/위험 |
|---|---|---|
| A가 key를 선택해 B에게 physical delivery | manual delivery | link encryption처럼 device pair가 고정된 경우 가능 |
| third party가 key를 선택해 A/B에게 physical delivery | manual delivery | 많은 end host가 있는 distributed system에는 불편 |
| 이전 key로 새 key를 encrypt해 전달 | old key 기반 rekey | 한 key가 compromise되면 이후 key도 연쇄적으로 compromise될 수 있음 |
| A/B가 third party C와 각각 encrypted connection을 갖고 C가 session key 전달 | KDC 기반 dynamic distribution | end-to-end encryption에 더 적합 |

End-to-end encryption에서는 host나 terminal이 많은 상대와 동적으로 통신하므로 manual delivery가 어렵다. 따라서 `KDC(Key Distribution Center)`를 사용하는 dynamic key distribution이 유리하다.

![Figure 21.5](@/assets/images/data-communication-283-figure-21-5-page-731.png)
*Figure 21.5 · PDF p. 731 · connection-oriented protocol에서 KDC와 SSM을 이용해 one-time session key를 자동 배포하는 흐름*

Figure 21.5의 방식은 두 종류의 key를 구분한다.

| Key | 의미 |
|---|---|
| `Session key` | 두 end system이 logical connection 동안 user data를 encrypt하는 one-time key. Session 종료 후 폐기된다. |
| `Permanent key` | KDC와 각 entity 사이에서 session key를 분배하기 위해 장기간 사용하는 key |

구성요소는 `KDC(Key Distribution Center)`와 `SSM(Security Service Module)`이다. KDC는 어떤 system들이 서로 통신할 수 있는지 결정하고, 허용되면 그 connection에 쓸 one-time session key를 생성한다. SSM은 사용자를 대신해 end-to-end encryption을 수행하고 session key를 KDC에서 받아온다.

Connection setup 흐름은 다음과 같다.

1. Host가 connection-request packet을 보낸다.
2. SSM이 packet을 buffer하고 KDC에 session key를 요청한다.
3. KDC가 각 SSM과 공유하는 permanent key로 session key를 안전하게 전달한다.
4. Requesting SSM이 buffer한 packet을 release하고, 이후 user data는 one-time session key로 encrypt된다.

#### Traffic Padding

Encryption이 message contents를 숨겨도 traffic analysis는 남을 수 있다. Link encryption을 쓰면 packet header도 link 구간에서는 암호화되어 traffic analysis 기회가 줄지만, 공격자는 여전히 network traffic 양이나 end system에 들어오고 나가는 traffic 양을 관찰할 수 있다.

`Traffic padding`은 이를 줄이기 위한 countermeasure다. Plaintext가 없을 때도 continuous random data stream을 생성해 encrypt하고 transmit한다. Plaintext가 있으면 plaintext를 encrypt해 보내고, 없으면 random data를 encrypt해 보낸다. 공격자는 true data flow와 noise를 구분하기 어려우므로 traffic amount를 추론하기 어렵다. 단, bandwidth를 의도적으로 소비하므로 confidentiality/traffic-analysis resistance와 efficiency 사이의 trade-off가 있다.

### 21.3 Message Authentication and Hash Functions

Encryption은 passive attack, 특히 eavesdropping에 대한 confidentiality를 제공한다. 하지만 active attack, 즉 data와 transaction의 falsification을 막으려면 다른 요구사항이 필요하다. `Message authentication`은 received message가 genuine하며 alleged source에서 왔고, 중간에 변경되지 않았음을 검증하는 절차다.

Message authentication에서 확인하고 싶은 것은 네 가지로 정리된다.

| 확인 대상 | 의미 |
|---|---|
| `Message integrity` | message contents가 altered되지 않았는가 |
| `Source authenticity` | alleged sender가 실제 sender인가 |
| `Timeliness` | message가 artificial delay 후 replay된 것은 아닌가 |
| `Sequence` | 같은 party 사이의 message stream에서 순서가 올바른가 |

#### Authentication과 Encryption의 분리

Symmetric encryption만으로도 authentication을 어느 정도 제공할 수 있다. Sender와 receiver만 key를 공유한다고 가정하면, 올바른 ciphertext를 만들 수 있는 entity는 genuine sender뿐이다. Message 안에 error detection code, sequence number, timestamp를 포함하면 modification, sequencing, replay delay까지 어느 정도 확인할 수 있다.

하지만 항상 message 전체를 encrypt하는 것이 최선은 아니다. Message confidentiality 없이 authentication만 필요한 경우가 있다.

| 상황 | 왜 authentication-only가 유리한가 |
|---|---|
| Broadcast message | 여러 destination에 같은 plaintext message를 보내고, 일부 responsible destination만 authenticity를 검사하게 할 수 있다. |
| Heavy-load receiver | 모든 incoming message를 decrypt할 여유가 없어 random/selective authentication만 수행할 수 있다. |
| Program authentication | program을 plaintext로 실행하되, 필요할 때 attached authentication tag로 integrity를 확인할 수 있다. |

따라서 security requirement는 `confidentiality`와 `authentication/integrity`를 분리해 설계할 수 있어야 한다.

#### Message Authentication Code(MAC)

`MAC(Message Authentication Code)`는 shared secret key로 message에서 작은 authentication tag를 생성해 message에 붙이는 방식이다. A와 B가 secret key `K_AB`를 공유한다고 하자. A가 message `M`을 B에게 보낼 때 다음 값을 계산한다.

```text
MAC = F(K_AB, M)
Transmit: M || MAC
```

B는 받은 `M`과 같은 `K_AB`로 MAC을 다시 계산해 received MAC과 비교한다.

![Figure 21.6](@/assets/images/data-communication-284-figure-21-6-page-734.png)
*Figure 21.6 · PDF p. 734 · sender와 receiver가 shared key K로 MAC을 계산/비교하는 message authentication 흐름*

MAC이 일치하면 receiver는 다음을 믿을 수 있다.

1. Message가 altered되지 않았다. Attacker가 message만 바꾸면 MAC 검증이 실패한다.
2. Message가 alleged sender에게서 왔다. Secret key를 모르는 attacker는 valid MAC을 만들 수 없다.
3. Message에 sequence number가 포함되어 있으면 sequence도 보호된다. Attacker는 sequence number를 바꿔도 MAC을 맞출 수 없다.

MAC은 encryption과 비슷하지만, authentication algorithm은 decryption을 위해 reversible할 필요가 없다. 이 차이 때문에 MAC function은 encryption function과 다른 수학적 성질을 가질 수 있고, 때로는 encryption보다 깨기 어렵게 설계될 수 있다.

#### One-Way Hash Function

`One-way hash function`은 variable-size message `M`을 fixed-size `message digest H(M)`로 바꾸는 함수다. MAC과 달리 hash function 자체는 secret key를 입력으로 받지 않는다. 따라서 message를 authenticate하려면 digest 자체가 authentic하게 전달되어야 한다.

![Figure 21.7](@/assets/images/data-communication-285-figure-21-7-page-736.png)
*Figure 21.7 · PDF p. 736 · one-way hash function을 conventional encryption, public-key encryption, shared secret value와 결합하는 세 가지 인증 방식*

Figure 21.7은 hash 기반 authentication의 세 방식을 보여준다.

| 방식 | 동작 | 특징 |
|---|---|---|
| Hash + symmetric encryption | digest를 shared key로 encrypt한다. | sender/receiver만 key를 공유하면 authenticity 보장 |
| Hash + public-key encryption | digest를 sender private key로 encrypt한다. | message authentication과 digital signature를 함께 제공 |
| Hash + shared secret value | `MDM = H(S_AB || M)`를 계산하고 `M || MDM` 전송 | encryption 없이 secret value 기반 authentication 제공 |

세 번째 방식은 encryption 없이 authentication을 제공한다. A와 B가 shared secret value `S_AB`를 가지고, A는 `H(S_AB || M)`을 보낸다. Secret value 자체는 전송되지 않으므로, attacker가 intercepted message를 수정해도 새 digest를 만들 수 없다. 이 방식은 IP security와 SNMPv3에서도 사용되는 사고방식이다.

#### Secure Hash Function Requirements

Secure hash function은 message, file, data block의 fingerprint를 만드는 함수다. Message authentication에 쓸 수 있으려면 다음 성질이 필요하다.

| 성질 | 의미 |
|---|---|
| Arbitrary input | 임의 크기 data block에 적용 가능 |
| Fixed output | 고정 길이 hash code 생성 |
| Efficient computation | hardware/software에서 쉽게 계산 가능 |
| `One-way property` | 주어진 hash `h`에 대해 `H(x)=h`인 x를 찾기 computationally infeasible |
| `Weak collision resistance` | 주어진 x에 대해 `H(y)=H(x)`이고 `y != x`인 y를 찾기 infeasible |
| `Strong collision resistance` | 임의의 서로 다른 pair `(x, y)`에 대해 `H(x)=H(y)`를 찾기 infeasible |

첫 세 성질은 practical use를 위한 조건이다. 네 번째 one-way property는 shared secret value 방식에서 중요하다. Attacker가 `M`과 `H(S_AB || M)`을 보고 hash를 invert할 수 있으면 secret value를 복구할 수 있다. 다섯 번째 성질은 encrypted digest 방식에서 forgery를 막는다. 여섯 번째 성질까지 만족하면 `strong hash function`이라고 하며, birthday attack 계열의 공격을 어렵게 한다.

Message digest는 authentication 외에도 data integrity를 제공한다. Transit 중 bit가 우연히 바뀌면 digest가 달라지므로 frame check sequence처럼 오류를 드러낸다. 단 security 맥락에서는 우연한 오류뿐 아니라 deliberate modification까지 고려한다.

#### SHA-512

`SHA(Secure Hash Algorithm)` 계열은 NIST가 표준화한 secure hash function이다. SHA-1은 160-bit hash를 만들지만, collision attack 결과가 알려지면서 더 긴 SHA-256, SHA-384, SHA-512로 이동하는 흐름이 생겼다. 원문은 SHA-512를 설명한다.

SHA-512는 최대 `2^128` bits 미만의 message를 입력으로 받아 512-bit message digest를 출력한다. Input은 1024-bit block 단위로 처리된다.

![Figure 21.8](@/assets/images/data-communication-286-figure-21-8-page-738.png)
*Figure 21.8 · PDF p. 738 · SHA-512에서 padding, length append, 1024-bit block processing으로 512-bit digest를 생성하는 흐름*

SHA-512 processing은 다음 단계다.

| 단계 | 설명 |
|---|---|
| Step 1: Append padding bits | message length가 `896 mod 1024`가 되도록 padding한다. Padding은 항상 추가되며, `1` bit 뒤에 필요한 수의 `0` bit가 온다. |
| Step 2: Append length | original message length를 나타내는 128-bit unsigned integer를 붙인다. Length field는 padding attack을 어렵게 한다. |
| Step 3: Initialize MD buffer | intermediate/final result를 담을 512-bit buffer를 초기화한다. |
| Step 4: Process message blocks | 1024-bit block `M1...MN`을 순서대로 처리한다. 핵심 module은 80 rounds로 구성된다. |
| Step 5: Output | 마지막 stage output이 512-bit message digest가 된다. |

SHA-512의 중요한 성질은 hash code의 모든 bit가 input의 모든 bit에 의존하도록 설계되었다는 점이다. 반복되는 function `F`와 modular addition이 message bits를 잘 섞기 때문에, 임의로 고른 두 message가 같은 digest를 가질 가능성은 극히 작다. 원문은 collision을 찾는 어려움을 대략 `2^256` operations, 특정 digest를 가진 message를 찾는 어려움을 `2^512` operations 수준으로 설명한다.

### 21.4 Public-Key Encryption and Digital Signatures

`Public-key encryption`은 symmetric encryption만큼 중요하며, 특히 message authentication과 key distribution에서 핵심 역할을 한다. Public-key cryptography는 `asymmetric`하다. 하나의 shared key를 쓰는 symmetric encryption과 달리, 서로 관련된 두 key, 즉 `public key`와 `private key`를 사용한다.

Public-key encryption에 대한 흔한 오해는 세 가지다.

| 오해 | 정리 |
|---|---|
| Public-key encryption은 symmetric encryption보다 본질적으로 더 안전하다. | Security는 key length와 breaking cost에 달려 있다. Public/symmetric 방식 자체가 cryptanalysis resistance의 우열을 자동 결정하지 않는다. |
| Public-key encryption이 symmetric encryption을 대체한다. | Public-key는 계산 overhead가 크므로 bulk data encryption에서는 symmetric encryption이 계속 필요하다. |
| Public key면 key distribution이 trivial하다. | Public key가 진짜 owner의 key인지 검증해야 하므로 certificate/CA 같은 protocol과 trusted agent가 필요하다. |

#### Public-Key Cryptography Model

Public-key scheme은 한 key로 encrypt하면 paired key로 decrypt할 수 있게 설계된다. Public key는 공개하고, private key는 owner만 보관한다.

![Figure 21.9](@/assets/images/data-communication-287-figure-21-9-page-740.png)
*Figure 21.9 · PDF p. 740 · public key로 encrypt해 confidentiality를 제공하는 방식과 private key로 encrypt해 authentication을 제공하는 방식*

Public-key encryption scheme의 구성요소는 plaintext, encryption algorithm, public/private key pair, ciphertext, decryption algorithm이다. 중요한 성질은 다음과 같다.

1. Algorithm과 public key를 알아도 private key를 계산하는 것은 computationally infeasible해야 한다.
2. 대부분의 public-key scheme에서는 pair 중 어느 key로 encrypt하든 다른 key로 decrypt할 수 있다.

Confidentiality 용도에서는 Bob이 Alice에게 private message를 보낼 때 Alice의 public key `PU_A`로 encrypt한다. Alice만 private key `PR_A`를 가지고 있으므로 decrypt할 수 있다.

```text
Bob -> Alice:
  C = E(PU_A, M)
Alice:
  M = D(PR_A, C)
```

이 방식의 장점은 Alice의 private key가 배포될 필요가 없다는 점이다. Alice는 public key만 공개하고 private key를 local에서 보호하면 된다.

#### Digital Signature

Public-key encryption은 authentication에도 쓸 수 있다. Bob이 message를 confidential하게 숨길 필요는 없지만, Alice가 "이 message는 Bob이 보냈고 중간에 바뀌지 않았다"는 것을 확인해야 한다고 하자. Bob은 자신의 private key `PR_B`로 message 또는 message digest를 encrypt하고, Alice는 Bob의 public key `PU_B`로 decrypt/verify한다.

```text
Bob signs:
  S = E(PR_B, H(M))
Alice verifies:
  H(M) ?= D(PU_B, S)
```

전체 message를 private key로 encrypt할 수도 있지만 비효율적이다. 실제로는 message의 hash code, 즉 authenticator를 private key로 encrypt하는 방식이 더 효율적이다. Secure hash code가 document의 content에 민감하게 반응하므로, document가 바뀌면 hash도 바뀐다. Private key로 암호화된 hash는 origin, content, sequencing을 검증하는 `digital signature` 역할을 한다.

Digital signature가 confidentiality를 제공하지 않는다는 점이 중요하다. Signature는 alteration 방지와 source authentication을 제공하지만, message content 자체가 cleartext라면 eavesdropper가 읽을 수 있다. 심지어 message 전체를 sender private key로 encrypt한 경우도, 누구나 sender public key로 decrypt할 수 있으므로 confidentiality가 아니다.

#### RSA Algorithm

`RSA`는 가장 널리 알려진 public-key encryption algorithm이다. RSA는 block cipher처럼 plaintext와 ciphertext를 integer block으로 다루며, 어떤 modulus `n`에 대해 `0`부터 `n - 1` 사이의 값을 사용한다.

기본 형태는 다음과 같다.

```text
Encryption: C = M^e mod n
Decryption: M = C^d mod n = (M^e)^d mod n = M^(ed) mod n

Public key:  PU = {e, n}
Private key: PR = {d, n}
```

RSA가 public-key algorithm으로 성립하려면 다음 요구사항이 필요하다.

| 요구사항 | 의미 |
|---|---|
| Correctness | 모든 `M < n`에 대해 `M^(ed) mod n = M`이 되도록 e, d, n을 고를 수 있어야 한다. |
| Efficiency | 모든 `M < n`에 대해 `M^e`, `C^d` 계산이 상대적으로 쉬워야 한다. |
| One-way trapdoor | e와 n을 알아도 d를 구하는 것이 infeasible해야 한다. |

![Figure 21.10](@/assets/images/data-communication-288-figure-21-10-page-743.png)
*Figure 21.10 · PDF p. 743 · RSA key generation, encryption, decryption 절차*

RSA key generation은 다음 순서다.

1. 두 prime number `p`, `q`를 선택한다.
2. `n = p * q`를 계산한다.
3. Euler totient `φ(n) = (p - 1)(q - 1)`을 계산한다.
4. `gcd(φ(n), e) = 1`이고 `1 < e < φ(n)`인 e를 선택한다.
5. `d * e mod φ(n) = 1`이 되는 d를 계산한다.
6. Public key는 `{e, n}`, private key는 `{d, n}`이다.

![Figure 21.11](@/assets/images/data-communication-289-figure-21-11-page-744.png)
*Figure 21.11 · PDF p. 744 · 작은 수 p=17, q=11을 사용한 RSA encryption/decryption 예*

Figure 21.11의 작은 예에서는 `p = 17`, `q = 11`, `n = 187`, `φ(n) = 160`, `e = 7`, `d = 23`이다. Public key는 `{7, 187}`, private key는 `{23, 187}`이다. Plaintext `M = 88`은 다음처럼 암호화/복호화된다.

```text
C = 88^7 mod 187 = 11
M = 11^23 mod 187 = 88
```

실제 RSA security는 큰 `n`을 factoring하기 어렵다는 점에 의존한다. Public key `{e, n}`에서 private exponent `d`를 알아내려면 보통 `n`을 prime factors `p`, `q`로 분해해야 한다. Key size가 커질수록 security는 올라가지만 key generation과 encryption/decryption 계산은 느려진다. 원문 시점에서는 1024-bit key가 대부분 application에 충분히 강한 것으로 설명된다.

#### Public-Key 기반 Key Management와 Certificate

Public-key encryption은 symmetric encryption의 key distribution 문제를 완화한다. Bob이 Alice와 secure e-mail을 하고 싶다면 매 상대와 unique shared secret key를 미리 나눌 필요가 없다. 흔한 hybrid 방식은 다음과 같다.

1. Bob이 message를 준비한다.
2. One-time symmetric session key로 message를 symmetric encryption한다.
3. Session key를 Alice의 public key로 encrypt한다.
4. Encrypted session key를 message에 붙여 Alice에게 보낸다.

Alice만 private key로 session key를 decrypt할 수 있고, 이후 symmetric key로 message를 복호화한다. 이 구조는 public-key의 distribution 장점과 symmetric encryption의 speed를 결합한다.

하지만 문제가 하나 남는다. Bob이 가진 "Alice의 public key"가 정말 Alice의 key인지 확인해야 한다. Attacker가 자기 public key를 Alice의 key라고 배포하면 Bob은 attacker가 decrypt할 수 있는 session key를 보내게 된다.

해결책은 `public-key certificate`다. Certificate는 key owner의 `User ID`와 public key를 묶고, trusted third party가 이를 sign한 data block이다. 이 trusted third party를 보통 `CA(Certificate Authority)`라고 한다.

![Figure 21.12](@/assets/images/data-communication-290-figure-21-12-page-746.png)
*Figure 21.12 · PDF p. 746 · unsigned certificate의 hash를 CA private key로 sign해 public-key certificate를 만드는 방식*

Certificate 생성/검증의 기본 흐름은 다음과 같다.

1. User가 자신의 public key와 user ID를 CA에 secure manner로 제출한다.
2. CA는 unsigned certificate에 대해 hash code를 만든다.
3. CA private key로 hash code를 encrypt해 signature를 만든다.
4. Signed certificate를 공개한다.
5. 누구든 CA public key로 signature를 verify해 certificate가 valid한지 확인한다.

Certificate의 의미는 "이 public key가 이 user ID에 속한다"는 binding을 trusted signature로 증명하는 것이다. SSL/TLS의 server authentication도 이 certificate 기반 trust model 위에 세워진다.

### 21.5 Secure Socket Layer and Transport Layer Security

`SSL(Secure Sockets Layer)`과 그 후속 표준인 `TLS(Transport Layer Security)`는 TCP 위에서 application data를 보호하기 위해 널리 쓰이는 보안 서비스다. 책은 SSLv3를 중심으로 설명하고, TLS는 SSL의 Internet standard 계열 후속으로 minor change가 있는 것으로 다룬다.

SSL/TLS의 위치는 중요하다. IPsec처럼 IP 계층 전체를 보호하는 방식이 아니라, TCP를 사용하는 application과 TCP 사이에 들어가 reliable end-to-end secure service를 제공한다. HTTP가 SSL 위에서 동작하면 HTTPS가 되는 식으로, application은 SSL record가 제공하는 confidentiality와 integrity 위에서 데이터를 주고받는다.

![Figure 21.13](@/assets/images/data-communication-291-figure-21-13-page-747.png)
*Figure 21.13 · PDF p. 747 · SSL Record Protocol과 Handshake, Change Cipher Spec, Alert Protocol의 계층 구조*

SSL은 하나의 protocol이 아니라 두 층의 protocol 집합이다.

| SSL 구성 | 역할 |
|---|---|
| `SSL Record Protocol` | 상위 protocol data를 fragment, optional compression, MAC, encryption, record header 형태로 처리해 기본 security service를 제공한다. |
| `Handshake Protocol` | server/client authentication, cipher suite 협상, key 생성에 필요한 parameter 교환을 수행한다. |
| `Change Cipher Spec Protocol` | pending cryptographic state를 current state로 바꾸라는 단일 목적의 메시지를 전달한다. |
| `Alert Protocol` | SSL 관련 warning/fatal error를 peer에게 알린다. 예: incorrect MAC, close_notify. |

#### SSL Session과 SSL Connection

SSL은 `session`과 `connection`을 구분한다.

| 개념 | 의미 |
|---|---|
| `SSL connection` | peer-to-peer transport 관계다. transient하며, 모든 connection은 하나의 session에 속한다. |
| `SSL session` | client와 server 사이의 association이다. Handshake Protocol로 생성되며 cryptographic security parameters를 정의한다. 여러 connection이 같은 session parameter를 공유할 수 있다. |

이 구분의 설계 이유는 negotiation cost를 줄이는 데 있다. Public-key operation, certificate verification, cipher suite negotiation은 비싸다. 매 TCP connection마다 처음부터 negotiation하면 overhead가 크므로, session을 재사용해 여러 secure connection이 같은 보안 parameter를 공유할 수 있게 한다.

#### SSL Record Protocol

`SSL Record Protocol`은 SSL connection에 두 가지 핵심 서비스를 제공한다.

| 서비스 | 방식 |
|---|---|
| `Confidentiality` | Handshake Protocol에서 만든 shared secret key로 SSL payload를 symmetric encryption한다. |
| `Message integrity` | Handshake Protocol에서 만든 shared secret key로 `MAC(Message Authentication Code)`을 계산한다. |

![Figure 21.14](@/assets/images/data-communication-292-figure-21-14-page-748.png)
*Figure 21.14 · PDF p. 748 · SSL Record Protocol의 fragment, compress, MAC, encrypt, header 부착 순서*

Record Protocol의 송신 처리는 다음 순서다.

1. Upper-layer message를 `2^14 bytes = 16,384 bytes` 이하 block으로 fragment한다.
2. Optional compression을 적용한다.
3. Compressed data에 대해 MAC을 계산해 붙인다.
4. Compressed message + MAC을 symmetric encryption한다.
5. SSL record header를 prepend한다.
6. 결과 record를 TCP segment로 전송한다.

수신 측은 반대로 decrypt, MAC verify, decompress, reassemble 후 상위 계층에 전달한다.

SSL record header에는 다음 field가 포함된다.

| Field | 크기 | 의미 |
|---|---:|---|
| `Content Type` | 8 bits | enclosed fragment를 처리할 상위 protocol. `change_cipher_spec`, `alert`, `handshake`, `application_data` 등이 있다. |
| `Major Version` | 8 bits | SSL major version. SSLv3는 3. |
| `Minor Version` | 8 bits | SSL minor version. SSLv3는 0. |
| `Compressed Length` | 16 bits | plaintext fragment 또는 compressed fragment의 byte length. |

Record layer는 HTTP 같은 실제 application 내용의 의미를 해석하지 않는다. Content Type이 `application_data`라면 그 내부가 HTTP인지 다른 TCP application인지는 SSL에 opaque하다. 이 점 때문에 SSL/TLS는 여러 application 위에 재사용될 수 있다.

#### Change Cipher Spec과 Alert Protocol

`Change Cipher Spec Protocol`은 구조상 매우 단순하다. 값 `1`인 1-byte message 하나를 보내 pending state를 current state로 복사하게 한다. 즉, 협상은 Handshake Protocol이 하지만, 실제로 "이제부터 새 cipher suite와 key를 쓰자"는 전환 신호는 Change Cipher Spec이 담당한다.

`Alert Protocol`은 SSL peer에게 경고와 오류를 전달한다. Alert message는 2 bytes로, 첫 byte는 severity(`warning(1)` 또는 `fatal(2)`), 둘째 byte는 specific alert code다. `fatal` alert가 발생하면 SSL은 해당 connection을 즉시 종료한다. 예를 들어 incorrect MAC은 fatal alert가 될 수 있고, `close_notify`는 더 이상 이 connection으로 message를 보내지 않겠다는 nonfatal notification이다.

#### Handshake Protocol

`Handshake Protocol`은 SSL에서 가장 복잡한 부분이다. Application data가 전송되기 전에 client/server가 서로를 authenticate하고, encryption algorithm, MAC algorithm, cryptographic keys를 협상한다.

![Figure 21.15](@/assets/images/data-communication-293-figure-21-15-page-750.png)
*Figure 21.15 · PDF p. 750 · SSL Handshake Protocol의 네 phase와 optional certificate/key exchange message*

Handshake는 네 phase로 이해하면 좋다.

| Phase | 핵심 목적 | 대표 message |
|---|---|---|
| Phase 1 | logical connection 시작, protocol version/session ID/cipher suite/compression/random number 협상 | `client_hello`, `server_hello` |
| Phase 2 | server authentication과 server-side key exchange 정보 제공, 필요하면 client certificate 요청 | `certificate`, `server_key_exchange`, `certificate_request`, `server_hello_done` |
| Phase 3 | client가 server certificate와 parameter를 검증하고, client certificate/key exchange/certificate verify를 보냄 | `certificate`, `client_key_exchange`, `certificate_verify` |
| Phase 4 | negotiated cipher suite를 current state로 전환하고 handshake 성공을 검증 | `change_cipher_spec`, `finished` |

`client_hello`에는 다음 parameter가 들어간다.

| Parameter | 의미 |
|---|---|
| `Version` | client가 이해하는 가장 높은 SSL version |
| `Random` | 32-bit timestamp + secure random 28 bytes. Key exchange에서 replay attack 방지에 쓰인다. |
| `Session ID` | 기존 session 재사용/갱신 또는 새 session 생성을 나타내는 variable-length identifier |
| `CipherSuite` | client가 지원하는 key exchange algorithm과 CipherSpec 조합 목록. 선호 순서대로 제시된다. |
| `Compression Method` | client가 지원하는 compression method 목록 |

Server는 `server_hello`로 같은 종류의 parameter를 선택/응답한다. Phase 2의 세부 내용은 사용하는 public-key encryption scheme에 따라 달라진다. Server는 certificate, additional key information, client certificate request를 보낼 수 있고, 항상 `server_hello_done`으로 hello 관련 message가 끝났음을 알린다.

Phase 3에서 client는 server certificate가 필요 조건을 만족하는지, `server_hello` parameter가 받아들일 수 있는지 확인한다. 이후 public-key scheme에 따라 client certificate, `client_key_exchange`, `certificate_verify` 등을 보낸다.

Phase 4에서는 client가 `change_cipher_spec`을 보내 pending CipherSpec을 current CipherSpec으로 바꾸고, 곧바로 새 algorithm/key/secret 아래에서 `finished` message를 보낸다. Server도 자신의 `change_cipher_spec`과 `finished`를 보낸다. 양쪽 `finished`가 성공적으로 검증되면 handshake가 완료되고 application layer data 교환이 시작된다.

SSL/TLS의 핵심 trade-off는 "application별 보안 구현을 반복하지 않고 TCP 기반 application에 공통 보안 층을 제공한다"는 장점과, "handshake와 certificate 검증이 connection setup overhead를 만든다"는 비용 사이에 있다. Session 재사용은 이 비용을 줄이기 위한 직접적인 장치다.

### 21.6 IPv4 and IPv6 Security

Internet security 문제는 host operating system의 취약점만이 아니라 router, network device, IP spoofing, packet sniffing, denial of service 같은 network infrastructure 문제와 연결된다. 이 때문에 IPv6 설계에서는 authentication과 encryption을 필수 보안 기능으로 포함했고, 이 보안 기능은 IPv6뿐 아니라 IPv4에서도 사용할 수 있게 설계되었다. 이 IP 계층 보안 기능 묶음이 `IPSec`이다.

SSL/TLS가 TCP 위 application traffic을 보호한다면, IPSec은 IP level에서 traffic을 encrypt/authenticate할 수 있다. 그래서 remote logon, e-mail, file transfer, Web access 등 특정 application을 고치지 않아도 IP를 사용하는 distributed application 전체를 보호할 수 있다.

#### Applications of IPSec

IPSec이 쓰이는 대표 상황은 다음과 같다.

| 적용 분야 | 의미 |
|---|---|
| Secure branch office connectivity | Internet/public WAN 위에 secure VPN을 만들어 private network 의존도를 낮춘다. |
| Secure remote access | 사용자가 ISP 접속 후 회사 network에 secure하게 접근한다. |
| Extranet/intranet connectivity | partner organization과의 communication에 authentication, confidentiality, key exchange를 제공한다. |
| Electronic commerce security 보강 | Web application 자체 보안과 별도로 IP level security를 추가한다. |

핵심은 IPSec이 "application별 보안"이 아니라 "IP packet level 보안"이라는 점이다. 따라서 같은 host의 여러 application traffic을 같은 IP 보안 framework 아래에서 보호할 수 있다.

#### Scope of IPSec

IPSec은 세 가지 주요 기능을 제공한다.

| 기능 | 영어 용어 | 제공 내용 |
|---|---|---|
| 인증 전용 기능 | `AH(Authentication Header)` | IP packet의 data integrity와 authentication을 제공한다. Confidentiality는 제공하지 않는다. |
| 인증 + 암호화 기능 | `ESP(Encapsulating Security Payload)` | message content confidentiality, limited traffic flow confidentiality, optional authentication을 제공한다. |
| Key exchange | key exchange function | manual key exchange 또는 automated scheme을 가능하게 한다. |

VPN에서는 보통 "unauthorized user가 VPN에 들어오지 못하게 하는 것"과 "Internet eavesdropper가 message를 읽지 못하게 하는 것"이 둘 다 필요하다. 그래서 authentication과 encryption을 함께 제공하는 `ESP`가 `AH`보다 더 자주 쓰일 가능성이 높다.

#### Security Association(SA)

`Security Association(SA)`는 IPSec의 핵심 개념이다. SA는 sender와 receiver 사이의 one-way relationship이며, 그 위를 지나는 traffic에 security service를 제공한다. Two-way secure exchange가 필요하면 방향별로 SA가 하나씩 필요하므로 총 두 개의 SA가 필요하다.

중요한 제한은 하나의 SA가 `AH` 또는 `ESP` 중 하나에 대해서만 security service를 제공한다는 점이다. 즉 "이 SA는 AH용인지 ESP용인지"가 정해진다.

SA는 다음 세 parameter로 unique하게 식별된다.

| Parameter | 의미 |
|---|---|
| `SPI(Security Parameters Index)` | 해당 SA에 부여된 bit string. AH/ESP header에 들어가 receiver가 어느 SA로 packet을 처리할지 선택하게 한다. |
| `IP destination address` | SA의 destination endpoint 주소. End-user system, firewall, router 등이 될 수 있다. |
| `Security protocol identifier` | 이 association이 AH SA인지 ESP SA인지 나타낸다. |

따라서 실제 IP packet에서는 IPv4/IPv6 header의 destination address와 AH/ESP extension header 안의 SPI를 통해 SA가 식별된다.

SA database에는 다음 같은 state가 들어간다.

| SA parameter | 역할 |
|---|---|
| `Sequence number counter` | AH/ESP header의 sequence number 생성에 쓰는 32-bit counter |
| `Sequence counter overflow` | sequence number overflow 시 audit event와 transmission 중단 여부 |
| `Antireplay window` | inbound packet이 replay인지 판단하는 sliding window |
| `AH information` | AH에 쓰는 authentication algorithm, keys, key lifetimes |
| `ESP information` | ESP에 쓰는 encryption/authentication algorithm, keys, initialization values, lifetimes |
| `Lifetime of SA` | SA를 새 SA/SPI로 교체하거나 종료해야 하는 time interval 또는 byte count |
| `IPSec protocol mode` | tunnel, transport, wildcard mode |
| `Path MTU` | fragmentation 없이 전송 가능한 최대 packet size와 aging information |

Key management는 SPI를 통해 authentication/privacy mechanism과 결합된다. 즉 IPSec은 AH/ESP 자체의 packet protection mechanism과 key management mechanism을 분리해 설계한다.

#### Authentication Header(AH)

`AH(Authentication Header)`는 IP packet에 대해 data integrity와 authentication을 제공한다. Integrity는 packet content가 transit 중 몰래 바뀌지 않았음을 보장하고, authentication은 end system이나 network device가 user/application을 확인하고 traffic filtering을 할 수 있게 한다. 또한 source/destination address가 보호 범위에 들어가므로 address spoofing 방지에도 연결된다.

AH의 authentication은 21.3절의 `MAC(Message Authentication Code)` 기반이다. 따라서 두 party는 shared secret key를 가져야 한다.

![Figure 21.16](@/assets/images/data-communication-294-figure-21-16-page-754.png)
*Figure 21.16 · PDF p. 754 · IPSec Authentication Header(AH)의 field 배치*

AH field는 다음과 같다.

| Field | 크기 | 의미 |
|---|---:|---|
| `Next Header` | 8 bits | AH 바로 뒤에 오는 header type |
| `Payload Length` | 8 bits | AH 길이. 32-bit word 단위에서 2를 뺀 값 |
| `Reserved` | 16 bits | future use |
| `Security Parameters Index(SPI)` | 32 bits | security association 식별 |
| `Sequence Number` | 32 bits | monotonically increasing counter |
| `Authentication Data` | variable | packet의 `ICV(Integrity Check Value)` 또는 MAC |

AH의 Authentication Data는 다음 대상을 기준으로 계산된다.

| 계산 대상 | 처리 방식 |
|---|---|
| IP header의 immutable field | transit 중 변하지 않으므로 MAC 계산에 포함 |
| IP header의 mutable but predictable field | 도착 시 예측 가능한 값으로 계산 |
| IP header의 mutable/unpredictable field | source와 destination 모두 계산 전에 zero 처리 |
| AH header | Authentication Data field만 zero로 놓고 나머지 포함 |
| Upper-level protocol data | transit 중 immutable하다고 보고 전체 포함 |

IPv4 예시로 `Internet Header Length`, `Source Address`는 immutable field다. `Destination Address`는 source routing 상황에서 mutable but predictable일 수 있고, `Time to Live`, `Header Checksum`은 mutable/unpredictable field이므로 ICV 계산 전에 zero 처리된다.

#### Encapsulating Security Payload(ESP)

`ESP(Encapsulating Security Payload)`는 confidentiality를 제공한다. Message content confidentiality가 기본이며, 제한적인 `traffic flow confidentiality`도 제공할 수 있다. Optional feature로 authentication service도 제공할 수 있다.

![Figure 21.17](@/assets/images/data-communication-295-figure-21-17-page-755.png)
*Figure 21.17 · PDF p. 755 · IPSec ESP packet format과 confidentiality/authentication coverage*

ESP field는 다음과 같다.

| Field | 크기 | 의미 |
|---|---:|---|
| `Security Parameters Index(SPI)` | 32 bits | security association 식별 |
| `Sequence Number` | 32 bits | monotonically increasing counter |
| `Payload Data` | variable | encryption으로 보호되는 upper-level segment |
| `Padding` | 0-255 bytes | encryption algorithm이 plaintext block multiple을 요구할 때 사용 |
| `Pad Length` | 8 bits | padding byte 수 |
| `Next Header` | 8 bits | payload data 안의 첫 header type. 예: IPv6 extension header, TCP |
| `Authentication Data` | variable | optional integrity check value. Authentication Data field 자체를 제외한 ESP packet에 대해 계산 |

AH와 ESP의 차이는 시험과 실무에서 자주 헷갈린다.

| 비교 | AH | ESP |
|---|---|---|
| Primary goal | authentication + integrity | confidentiality |
| Encryption | 제공하지 않음 | 제공 |
| Authentication | 제공 | optional |
| Anti-replay | sequence number/SA state로 지원 | sequence number/SA state로 지원 |
| Typical VPN use | 단독 사용은 상대적으로 덜 일반적 | authentication + encryption이 모두 필요해 흔히 사용 |

정리하면, IPSec은 IP layer에서 SA, SPI, AH, ESP를 이용해 packet 단위의 보안을 제공한다. AH는 "누가 보냈고 중간에 바뀌지 않았는가"에 초점이 있고, ESP는 "내용을 읽지 못하게 보호하는가"에 초점이 있다.

### 21.7 Wi-Fi Protected Access

`Wi-Fi Protected Access(WPA)`는 WLAN 보안 문제를 빠르게 개선하기 위해 Wi-Fi Alliance가 만든 보안 mechanism 집합이다. 기반은 IEEE `802.11i`의 당시 상태이며, 802.11i가 발전함에 따라 WPA도 compatibility를 유지하도록 발전한다.

802.11i가 다루는 보안 영역은 세 가지다.

| 영역 | 핵심 내용 |
|---|---|
| `Authentication` | station/user와 authentication server(AS) 사이의 robust authentication protocol 사용 |
| `Key management` | AS가 key distribution에 관여하고, AP가 station과의 wireless link key를 관리/배포 |
| `Data transfer privacy` | MAC-level data를 encryption하고 message integrity code로 alteration을 탐지 |

Privacy 측면에서 802.11i는 여러 encryption scheme을 제공한다. 장기적인 해법은 128-bit key를 쓰는 `AES(Advanced Encryption Standard)` 기반 scheme이지만, 기존 장비의 비용 높은 upgrade를 피하기 위해 104-bit `RC4` 기반 alternative scheme도 정의된다.

![Figure 21.18](@/assets/images/data-communication-296-figure-21-18-page-756.png)
*Figure 21.18 · PDF p. 756 · 802.11i operation의 security capabilities discovery, authentication, key management, data protection phase*

Figure 21.18의 802.11i operation은 다음 흐름으로 읽으면 된다.

1. `Station`과 `Access Point(AP)`가 security capabilities discovery를 수행해 사용할 security capability set에 합의한다.
2. Station과 `Authentication Server(AS)`가 관련된 exchange로 secure authentication을 수행한다.
3. AS는 AP에 key distribution을 담당한다.
4. AP는 station에게 필요한 key를 관리/배포한다.
5. Station과 AP 사이의 data transfer는 strong encryption으로 보호된다.

#### 802.11i Architecture의 세 구성요소

802.11i architecture는 다음 세 ingredient로 구성된다.

| 구성요소 | 설명 |
|---|---|
| `Authentication` | user와 AS 사이의 exchange를 정의하고, mutual authentication과 wireless link에서 client/AP가 사용할 temporary key 생성을 제공한다. |
| `Access control` | authentication function 사용을 강제하고, message를 올바르게 route하며, key exchange를 돕는다. 다양한 authentication protocol과 함께 동작할 수 있다. |
| `Privacy with message integrity` | LLC PDU 같은 MAC-level data를 encrypt하고, message integrity code로 data alteration을 검출한다. |

Authentication 자체는 LLC/MAC보다 위 계층에서 수행되며 802.11 자체 범위를 넘어서는 것으로 취급된다. 실제 환경에서는 `EAP(Extensible Authentication Protocol)`와 `RADIUS(Remote Authentication Dial-In User Service)` 같은 authentication protocol이 사용될 수 있다.

#### Access Control: 802.1X, Supplicant, Authenticator, AS

802.11i는 LAN access control 기능을 위해 `IEEE 802.1X(Port-Based Network Access Control)`를 사용한다. 802.1X는 세 용어를 쓴다.

| 802.1X 용어 | 802.11 WLAN에서의 대응 |
|---|---|
| `supplicant` | wireless station |
| `authenticator` | access point(AP) |
| `authentication server(AS)` | 보통 wired network 쪽의 별도 server. 경우에 따라 authenticator 내부에 있을 수도 있다. |

Supplicant가 AS에 의해 authenticated되기 전에는 authenticator가 supplicant와 AS 사이의 control/authentication message만 전달한다. 이때 802.1X control channel은 열려 있지만, 일반 802.11 data channel은 blocked 상태다. Authentication이 성공하고 key가 제공되면 authenticator가 predefined access control limitation 안에서 supplicant의 data를 network로 forward할 수 있고, data channel이 unblocked된다.

![Figure 21.19](@/assets/images/data-communication-297-figure-21-19-page-758.png)
*Figure 21.19 · PDF p. 758 · 802.1X controlled/uncontrolled port를 이용한 802.11i access control*

802.1X는 `controlled port`와 `uncontrolled port`라는 logical port 개념을 사용한다. WLAN에서 authenticator인 AP는 물리적으로 DS(distribution system) 쪽 port와 wireless BSS 쪽 port를 가질 수 있지만, access control은 논리 port 단위로 모델링된다.

| Port | 허용 traffic |
|---|---|
| `Uncontrolled port` | supplicant의 authentication state와 무관하게 supplicant와 AS 사이의 PDU exchange를 허용한다. 인증을 진행하기 위한 통로다. |
| `Controlled port` | supplicant의 현재 상태가 authorize된 경우에만 supplicant와 LAN의 다른 system 사이 PDU exchange를 허용한다. 일반 data 통로다. |

이 구조의 설계 이유는 명확하다. 아직 신뢰할 수 없는 station에게 일반 LAN data access는 막되, 자신을 인증하기 위해 필요한 authentication traffic은 통과시켜야 한다. 그래서 uncontrolled port와 controlled port가 분리된다.

IBSS처럼 AP가 없는 구조에서는 이 모델을 그대로 적용하기 어렵다. 이 경우 802.11i는 station 간 pairwise authentication을 포함하는 더 복잡한 solution을 제공한다.

#### Privacy with Message Integrity: TKIP/WPA-1과 CCMP/WPA-2

802.11i는 802.11 MAC PDU를 보호하기 위해 두 scheme을 정의한다.

| Scheme | 별칭 | Encryption 기반 | 설계 의도 |
|---|---|---|---|
| `TKIP(Temporal Key Integrity Protocol)` | WPA-1 | WEP와 같은 `RC4` stream encryption | 기존 WEP 장비에 software change만으로 적용하기 위한 transitional scheme |
| `CCMP(Counter Mode-CBC MAC Protocol)` | WPA-2 | `AES` encryption | 장기적이고 더 강한 보안 해법 |

TKIP와 WPA-2는 모두 802.11 MAC frame의 data field 뒤에 `MIC(Message Integrity Code)`를 추가한다. MIC는 `Michael`이라는 algorithm으로 계산되는 64-bit value이며, source MAC address, destination MAC address, Data field를 입력으로 사용한다. 이 MIC는 Data field encryption에 쓰는 key와 별도의 key로 encryption된다. 결과적으로 data field와 MIC field가 모두 encrypted된다.

MIC는 WEP의 `ICV(Integrity Check Value)`보다 강한 message authentication 기능을 제공한다. 더 복잡한 algorithm, 별도 encryption key, 64-bit 길이를 사용하기 때문이다. 이 구조는 앞서 21.3절에서 다룬 message authentication 개념을 WLAN MAC frame 보호에 적용한 예다.

## 연결 관계

Chapter 21은 "보안 요구사항"에서 시작해 각 계층의 mechanism으로 내려간다.

| 요구사항/공격 | 대응 mechanism |
|---|---|
| Passive attack, traffic analysis | encryption, traffic padding, link encryption + end-to-end encryption |
| Message modification, replay, masquerade | MAC, one-way hash function, digital signature, certificate, sequence number, antireplay window |
| Confidentiality | symmetric encryption(AES), public-key 기반 session key distribution, SSL/TLS, ESP, WPA/WPA-2 |
| Authenticity/integrity | MAC, secure hash function(SHA-512), RSA digital signature, AH, SSL Record MAC, MIC |
| Key distribution 문제 | KDC/SSM, public-key encryption, CA certificate, SSL/TLS handshake, IPSec key exchange, 802.11i AS |

Layer별로 보면 역할이 더 분명하다.

| 계층/범위 | 기술 | 보호 단위 |
|---|---|---|
| Application/TCP 사이 | SSL/TLS | TCP 기반 application data |
| IP layer | IPSec AH/ESP | IP packet |
| WLAN MAC/link | WPA/802.11i | 802.11 MAC PDU, station-AP link |
| End-to-end data/key | Symmetric/public-key cryptography | message, session key, signature, certificate |

## 오해하기 쉬운 내용

| 오해 | 정리 |
|---|---|
| Public-key encryption이 symmetric encryption을 대체한다 | 실제 secure communication은 대개 public-key로 session key를 안전하게 전달하고 data는 symmetric encryption으로 빠르게 보호한다. |
| Digital signature는 confidentiality를 제공한다 | 아니다. Signature는 authentication/integrity/nonrepudiation 성격이고, content가 cleartext면 누구나 읽을 수 있다. |
| Hash function만 있으면 message authentication이 된다 | 단순 hash는 attacker도 다시 계산할 수 있다. Secret key가 결합된 MAC이나 secret value가 포함된 hash 방식이 필요하다. |
| SSL/TLS와 IPSec은 같은 위치의 기술이다 | SSL/TLS는 TCP 위 application 보안, IPSec은 IP layer packet 보안이다. |
| AH와 ESP는 둘 다 encryption을 제공한다 | AH는 integrity/authentication 중심이고 confidentiality는 제공하지 않는다. ESP가 confidentiality를 제공한다. |
| 802.1X controlled port가 인증 전에도 열려 있다 | 인증 전에는 uncontrolled port로 authentication traffic만 허용되고, 일반 data를 위한 controlled port는 blocked 상태다. |

## 면접 질문

1. `confidentiality`, `integrity`, `availability`, `authenticity`를 각각 정의하고, passive attack과 active attack 중 어디에 더 직접 연결되는지 설명하라.
2. `link encryption`과 `end-to-end encryption`의 차이를 설명하고, 왜 둘을 함께 쓰더라도 traffic analysis가 남을 수 있는지 설명하라.
3. `MAC(Message Authentication Code)`과 `one-way hash function`의 차이를 설명하라.
4. `SHA-512`가 message를 처리하는 단위를 padding, block, digest 관점에서 설명하라.
5. RSA에서 public key `{e, n}`와 private key `{d, n}`가 어떤 수학적 관계를 가져야 하는지 설명하라.
6. Digital signature가 confidentiality를 제공하지 않는 이유를 설명하라.
7. `public-key certificate`와 `CA(Certificate Authority)`가 해결하는 문제가 무엇인지 설명하라.
8. SSL/TLS에서 `session`과 `connection`의 차이를 설명하라.
9. SSL Record Protocol이 송신 data를 처리하는 순서를 fragment, MAC, encryption, header 관점에서 설명하라.
10. IPSec의 `Security Association(SA)`가 왜 one-way인지, two-way 통신에 몇 개의 SA가 필요한지 설명하라.
11. `AH(Authentication Header)`와 `ESP(Encapsulating Security Payload)`의 보안 서비스 차이를 설명하라.
12. 802.11i에서 `supplicant`, `authenticator`, `authentication server(AS)`가 각각 무엇에 대응하는지 설명하라.

## 핵심 용어 정리

| Term | 의미 |
|---|---|
| `confidentiality` | unauthorized disclosure를 막는 성질 |
| `integrity` | data가 unauthorized modification 없이 유지되는 성질 |
| `availability` | authorized user가 service/data에 접근할 수 있는 성질 |
| `authenticity` | entity나 data origin이 주장한 대상과 일치함 |
| `passive attack` | release of message contents, traffic analysis처럼 관찰 중심 공격 |
| `active attack` | masquerade, replay, modification of messages, denial of service처럼 data/service를 바꾸는 공격 |
| `symmetric encryption` | sender/receiver가 shared secret key를 사용하는 encryption |
| `DES`, `Triple DES(3DES)`, `AES` | 대표 symmetric block cipher 계열 |
| `KDC(Key Distribution Center)` | session key를 안전하게 분배하는 trusted center |
| `MAC(Message Authentication Code)` | shared secret key와 message로 계산하는 authenticator |
| `one-way hash function` | 임의 길이 input을 fixed-length digest로 압축하는 함수 |
| `SHA-512` | 1024-bit block을 처리해 512-bit message digest를 만드는 secure hash algorithm |
| `public-key encryption` | public key/private key pair를 사용하는 asymmetric encryption |
| `RSA` | 큰 integer modular exponentiation과 factoring difficulty에 기반한 public-key algorithm |
| `digital signature` | sender private key로 hash/digest를 보호해 origin과 integrity를 검증하는 mechanism |
| `public-key certificate` | user ID와 public key의 binding을 CA signature로 증명하는 data block |
| `SSL`, `TLS` | TCP 위 application data를 보호하는 security protocol suite |
| `SSL Record Protocol` | fragmentation, optional compression, MAC, encryption, header 처리를 수행하는 SSL 하위 protocol |
| `Handshake Protocol` | SSL/TLS의 authentication, cipher suite negotiation, key establishment protocol |
| `IPSec` | IPv4/IPv6에서 IP packet security를 제공하는 framework |
| `Security Association(SA)` | IPSec에서 one-way traffic 보호를 정의하는 security relationship |
| `SPI(Security Parameters Index)` | SA를 식별하기 위해 AH/ESP header에 들어가는 값 |
| `AH(Authentication Header)` | IPSec의 integrity/authentication 전용 header |
| `ESP(Encapsulating Security Payload)` | IPSec의 confidentiality 중심 payload 보호 format |
| `WPA`, `802.11i` | WLAN authentication, key management, privacy를 개선한 security mechanism |
| `802.1X` | port-based network access control framework |
| `EAP`, `RADIUS` | WLAN authentication에 사용될 수 있는 상위 authentication protocol |
| `TKIP`, `CCMP` | 802.11 MAC PDU 보호를 위한 WPA-1/WPA-2 계열 scheme |
| `MIC(Message Integrity Code)` | 802.11 MAC frame data alteration을 탐지하기 위한 integrity code |
