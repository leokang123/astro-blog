---
title: "Chapter 8. Security in Computer Networks"
order: 8
pubDatetime: 2026-05-17T00:01:00+09:00
modDatetime: 2026-05-17T00:01:00+09:00
description: "Computer Networking Top-Down 정리: Chapter 8. Security in Computer Networks"
tags:
  - "ComputerNetwork"
  - "CS"
  - "TopDown"
---

## 개요

Network security는 Internet attack을 막기 위한 별도 장식이 아니라, 이미 배운 protocol stack 위에 confidentiality, message integrity, end-point authentication, operational security를 추가하는 문제다. 이 장의 앞부분은 cryptography의 기본 원리, 중간 부분은 secure email, TLS, IPsec, wireless/cellular security 같은 실제 protocol, 마지막 부분은 firewall과 IDS 같은 operational security를 다룬다.

Alice와 Bob은 단순 예시 이름이지만, 실제로는 client-server, two routers, e-mail applications, DNS/routing/network management entities처럼 secure communication이 필요한 모든 endpoints를 뜻한다. Trudy는 eavesdropping, message modification/insertion/deletion, masquerading, session hijacking, denial of service를 시도하는 intruder를 대표한다.

## 핵심 개념

### 8.1 What Is Network Security?

Secure communication의 목표는 한 문장으로 “원하는 상대와만, 변조 없이, 필요한 때 통신할 수 있게 하는 것”이다. 책은 이를 네 가지 속성으로 분해한다.

| 보안 목표 | 영어 용어 | 핵심 의미 | 이 장에서 이어지는 부분 |
| --- | --- | --- | --- |
| 비밀성 | `confidentiality` | Intended sender/receiver만 message contents를 이해해야 한다. Eavesdropper가 packet을 sniff해도 의미를 알 수 없어야 한다. | encryption, symmetric/public key cryptography |
| 메시지 무결성 | `message integrity` | Message가 maliciously 또는 accidentally altered되지 않았음을 확인한다. | cryptographic hash, MAC, digital signature |
| 종단 인증 | `end-point authentication` | 통신 상대가 claimed identity와 일치함을 확인한다. | authentication protocols, certificates, TLS handshake |
| 운영 보안 | `operational security` | Organization network 자체를 public Internet 공격으로부터 보호한다. | firewall, IDS, packet filtering |

Figure 8.1은 Chapter 8 전체의 기본 위협 모델이다. Alice와 Bob은 control messages와 data messages를 주고받고, Trudy는 channel에서 eavesdropping하거나 messages를 modify/insert/delete할 수 있다.

![Figure 8.1](@/assets/images/cs-computer-network-236-figure-8-1-page-620.png)
*Figure 8.1 · PDF p. 620 · sender Alice, receiver Bob, intruder Trudy가 있는 secure communication model*

중요한 점은 security가 application traffic에만 필요한 것이 아니라는 점이다. Secure e-mail이나 electronic commerce뿐 아니라, DNS lookup, routing daemon의 routing information exchange, network management functions도 공격받으면 Internet infrastructure 자체가 흔들린다. 따라서 cryptography는 confidentiality뿐 아니라 authentication과 message integrity의 기반이 된다.

### 8.2 Principles of Cryptography

`Cryptography`는 sender가 data를 disguise해 intruder가 intercepted data에서 useful information을 얻지 못하게 하고, receiver는 original data를 recover하게 하는 기술이다. 원문 메시지는 `plaintext` 또는 `cleartext`, 암호화된 결과는 `ciphertext`라고 부른다.

![Figure 8.2](@/assets/images/cs-computer-network-237-figure-8-2-page-622.png)
*Figure 8.2 · PDF p. 622 · plaintext, ciphertext, encryption/decryption algorithm, keys KA/KB의 관계*

현대 cryptographic system에서는 encryption algorithm 자체가 공개되어 있는 경우가 많다. Secret은 algorithm이 아니라 `key`에 있다. Alice가 plaintext message $m$과 key $K_A$를 encryption algorithm에 넣으면 ciphertext $K_A(m)$가 나온다. Bob은 key $K_B$로 $K_B(K_A(m)) = m$을 계산해 원문을 복원한다.

| 구분 | key 관계 | 직관 |
| --- | --- | --- |
| `symmetric key system` | Alice와 Bob이 같은 secret key를 공유한다. | 빠르고 data encryption에 적합하지만 key distribution이 어렵다. |
| `public key system` | 공개 key와 private key 한 쌍을 쓴다. 한 key는 공개되고 다른 key는 한쪽만 안다. | key distribution과 signature에 강하지만 계산 비용이 크다. |

#### 8.2.1 Symmetric Key Cryptography

`Symmetric key cryptography`는 sender와 receiver가 같은 secret key를 사용한다. 가장 오래된 예는 `Caesar cipher`다. Alphabet의 각 letter를 key `k`만큼 뒤의 letter로 치환한다. 예를 들어 $k = 3$이면 $a \to d$, $b \to e$가 된다. 이 방식은 가능한 key가 25개뿐이라 금방 깨진다.

`Monoalphabetic cipher`는 각 plaintext letter를 임의의 ciphertext letter에 일대일 대응시킨다. 가능한 mapping은 26!개라 brute-force만 보면 강해 보인다.

![Figure 8.3](@/assets/images/cs-computer-network-238-figure-8-3-page-623.png)
*Figure 8.3 · PDF p. 623 · 각 plaintext letter를 고정된 ciphertext letter로 치환하는 monoalphabetic cipher*

하지만 monoalphabetic cipher는 language statistics에 약하다. English text에서 `e`, `t`가 자주 나오고, `in`, `it`, `the`, `ion`, `ing` 같은 patterns가 자주 나온다는 사실을 이용하면 mapping을 추론할 수 있다. Message에 Bob, Alice 같은 예상 단어가 들어 있다는 정보가 있으면 더 빨리 깨진다.

Intruder가 가진 정보에 따라 attack model이 달라진다.

| 공격 모델 | 영어 용어 | intruder가 아는 것 | 의미 |
| --- | --- | --- | --- |
| 암호문 단독 공격 | `ciphertext-only attack` | intercepted ciphertext만 가진다. | frequency/statistical analysis가 단서가 된다. |
| 알려진 평문 공격 | `known-plaintext attack` | 일부 plaintext-ciphertext pair를 안다. | 특정 단어가 들어 있음을 알면 mapping 일부를 바로 추론할 수 있다. |
| 선택 평문 공격 | `chosen-plaintext attack` | intruder가 plaintext를 고르고 그 ciphertext를 얻을 수 있다. | 단순 cipher는 완전히 깨질 수 있지만, 강한 scheme은 이 조건에서도 안전해야 한다. |

`Polyalphabetic encryption`은 여러 monoalphabetic ciphers를 위치별 pattern에 따라 번갈아 사용한다. 같은 plaintext letter라도 위치에 따라 다른 ciphertext가 되므로 simple frequency analysis를 어렵게 만든다.

![Figure 8.4](@/assets/images/cs-computer-network-239-figure-8-4-page-625.png)
*Figure 8.4 · PDF p. 625 · 두 Caesar ciphers C1/C2를 반복 pattern으로 사용하는 polyalphabetic cipher*

이 구간의 핵심은 고전 cipher 자체를 외우는 것이 아니라, 현대 cryptography를 이해하기 위한 기준을 잡는 것이다. Algorithm은 공개되어도 key가 안전해야 하고, attacker가 ciphertext-only보다 더 강한 정보를 가질 수 있음을 가정해야 한다. 이후 block cipher, public key, TLS, IPsec은 모두 이 공격 모델 위에서 설계된다.

## 세부 정리

#### Block Ciphers

현대 symmetric key encryption은 보통 `block cipher`를 사용한다. Message를 `k` bits blocks로 나누고, 각 k-bit cleartext block을 k-bit ciphertext block으로 mapping한다. 이상적으로는 모든 possible inputs에 대해 one-to-one permutation table을 두면 되지만, $k = 64$만 되어도 $2^{64}$ entries를 저장해야 하므로 full-table 방식은 불가능하다.

실제 block cipher는 작은 substitution tables와 bit permutation을 여러 rounds 반복해 큰 random permutation처럼 보이게 만든다. 각 round의 목적은 input의 한 bit 변화가 final output의 많은 bits에 영향을 주게 하는 diffusion이다.

![Figure 8.5](@/assets/images/cs-computer-network-240-figure-8-5-page-627.png)
*Figure 8.5 · PDF p. 627 · 64-bit block을 8-bit chunks로 나누어 tables와 scrambler를 여러 rounds 적용하는 block cipher 예*

대표 block cipher는 `DES (Data Encryption Standard)`, `3DES`, `AES (Advanced Encryption Standard)`다. DES는 64-bit block과 56-bit key를 사용하고, AES는 128-bit block과 128/192/256-bit key를 사용할 수 있다. Brute-force attack은 모든 possible keys를 시도하는 방식이며, key length가 $n$이면 possible keys는 $2^n$개다. 따라서 practical security는 algorithm secrecy보다 key length와 key 관리에 크게 의존한다.

단순히 같은 block cipher로 long message의 각 block을 독립적으로 encrypt하면 같은 plaintext block이 항상 같은 ciphertext block이 된다. 예를 들어 HTTP protocol 구조처럼 반복되는 patterns가 있으면 attacker가 identical ciphertext blocks를 보고 plaintext 구조를 추론할 수 있다.

이를 막기 위해 randomness를 섞는다. 가장 단순한 방식은 각 block마다 random value $r(i)$를 만들고 $c(i) = K_S(m(i) \oplus r(i))$를 보내는 것이다. 하지만 block마다 random bits를 함께 보내야 하므로 bandwidth overhead가 거의 두 배가 된다.

`CBC (Cipher Block Chaining)`는 이 문제를 줄인다. Sender는 처음에만 random k-bit `IV (Initialization Vector)`를 만들고 cleartext로 보낸다. 이후 각 block은 직전 ciphertext block과 XOR한 뒤 encrypt한다.

$$
\begin{aligned}
c(0) &= IV \\
c(1) &= K_S(m(1) \oplus c(0)) \\
c(i) &= K_S(m(i) \oplus c(i - 1)) \\
\text{receiver:}\quad s(i) &= decrypt_{K_S}(c(i)) = m(i) \oplus c(i - 1) \\
m(i) &= s(i) \oplus c(i - 1)
\end{aligned}
$$

CBC의 효과는 세 가지다. 첫째, 같은 plaintext block이 나와도 앞 block의 ciphertext가 다르면 resulting ciphertext가 달라진다. 둘째, IV는 cleartext로 보내도 secret key $K_S$가 없으면 plaintext를 복원할 수 없다. 셋째, long message에서는 IV 한 block만 overhead로 추가되므로 bandwidth cost가 작다. 대신 protocol은 sender가 receiver에게 IV를 전달하는 방법을 반드시 정의해야 한다.

#### 8.2.2 Public Key Encryption

Symmetric key의 근본 문제는 `key distribution`이다. Alice와 Bob이 같은 secret key를 가져야 하는데, 그 secret key를 안전하게 공유하려면 이미 secure channel이 필요하다. `Public key cryptography`는 이 순환 문제를 끊는다. Receiver Bob은 public key와 private key를 만들고, public key는 모두에게 공개하며 private key만 혼자 보관한다.

![Figure 8.6](@/assets/images/cs-computer-network-241-figure-8-6-page-630.png)
*Figure 8.6 · PDF p. 630 · Bob의 public key로 encrypt하고 Bob의 private key로 decrypt하는 public key cryptography*

Alice가 Bob에게 secret message $m$을 보내려면 Bob의 public key $K_B^+$로 $K_B^+(m)$을 계산해 보낸다. Bob은 private key $K_B^-$로 $K_B^-(K_B^+(m)) = m$을 얻는다. 이 구조에서는 public key가 공개되어도 private key가 없으면 decrypt할 수 없다.

하지만 public key encryption만으로 sender authentication이 자동으로 생기지는 않는다. Bob의 public key는 누구나 사용할 수 있으므로 Trudy도 Bob에게 encrypted message를 보낼 수 있다. “이 message가 Alice에게서 왔다”를 보장하려면 뒤에서 배우는 `digital signature`가 필요하다.

##### RSA

`RSA`는 public key cryptography의 대표 알고리즘이다. Message는 bit pattern이고, bit pattern은 integer로 볼 수 있다. RSA는 modulo arithmetic 위에서 public key $(n, e)$와 private key $(n, d)$를 구성한다.

RSA key generation의 핵심 단계는 다음과 같다.

| 단계 | 내용 |
| --- | --- |
| 1 | 큰 prime numbers $p$, $q$를 고른다. |
| 2 | $n = pq$, $z = (p - 1)(q - 1)$를 계산한다. |
| 3 | $z$와 common factor가 1뿐인 $e < n$을 고른다. 즉 $e$와 $z$는 relatively prime이다. |
| 4 | $ed \bmod z = 1$이 되는 $d$를 찾는다. |
| 5 | Public key는 $(n, e)$, private key는 $(n, d)$가 된다. |

Encryption과 decryption은 다음 수식이다.

$$
\begin{aligned}
\text{encryption:}\quad c &= m^e \bmod n \\
\text{decryption:}\quad m &= c^d \bmod n
\end{aligned}
$$

RSA가 동작하는 이유는 선택한 $e$, $d$, $z$가 $ed \bmod z = 1$을 만족하고, number theory 결과에 의해 다음이 성립하기 때문이다.

$$
(m^e \bmod n)^d \bmod n = m^{ed} \bmod n = m
$$

또한 public/private key 적용 순서를 바꾸어도 같은 결과가 성립한다.

$$
K_B^{-}(K_B^{+}(m)) = K_B^{+}(K_B^{-}(m)) = m
$$

이 두 번째 성질이 digital signature의 기반이다. Private key로 먼저 “적용”한 값을 public key로 확인할 수 있기 때문이다.

##### Session Keys

RSA는 exponentiation을 사용하므로 large data를 직접 encrypt하기에는 느리다. 그래서 실제 protocol에서는 public key cryptography와 symmetric key cryptography를 결합한다. Alice는 data encryption에 쓸 symmetric `session key KS`를 만들고, 이 session key만 Bob의 public key로 encrypt해 보낸다. Bob은 private key로 $K_S$를 복원한 뒤, 이후 bulk data는 AES 같은 symmetric cipher와 $K_S$로 빠르게 encrypt/decrypt한다.

1. Alice chooses session key $K_S$.
2. Alice sends RSA-encrypted $K_S$: $c = K_S^e \bmod n$.
3. Bob decrypts $c$ using private key $d$ and obtains $K_S$.
4. Alice and Bob use symmetric key $K_S$ for the data transfer.

RSA security는 public value $n$을 prime factors $p$, $q$로 빠르게 factorization하는 알려진 classical algorithm이 없다는 사실에 의존한다. $p$, $q$를 알면 $z$와 private key $d$를 계산할 수 있으므로 RSA가 깨진다. 따라서 RSA의 안전성은 “절대 보장”이라기보다 현재 factoring의 계산적 어려움에 기대는 computational security다. Quantum computing과 fast factoring algorithms는 장기적으로 RSA security에 위협이 될 수 있다.

`Diffie-Hellman Key Exchange`는 arbitrary length messages를 encrypt하는 용도보다는 shared symmetric session key를 establish하는 데 쓰이는 public-key 계열 기법이다. 이 장의 뒤쪽 TLS/IKE 같은 protocols는 결국 public key 방식으로 authentication/key establishment를 하고, symmetric session keys로 실제 traffic을 보호하는 구조를 반복한다.

### 8.3 Message Integrity and Digital Signatures

`Message integrity` 또는 `message authentication`은 Bob이 받은 message에 대해 두 가지를 확인하는 문제다. 첫째, message가 정말 Alice에게서 왔는가. 둘째, 전송 중 tampering되지 않았는가. 이 문제는 link-state routing의 bogus link-state message 공격처럼 routing protocol에도 직접 연결된다. Router B가 Router A의 link-state message를 받았다면, 정말 A가 만들었고 transit 중 변경되지 않았음을 확인해야 한다.

#### 8.3.1 Cryptographic Hash Functions

`Hash function`은 arbitrary-length input $m$을 fixed-size string $H(m)$으로 바꾼다. Internet checksum이나 CRC도 넓게 보면 hash function이지만, security 용도에는 추가 성질이 필요하다. `Cryptographic hash function`은 서로 다른 두 messages $x$, $y$에 대해 $H(x) = H(y)$가 되도록 찾는 것이 computationally infeasible해야 한다.

![Figure 8.7](@/assets/images/cs-computer-network-242-figure-8-7-page-636.png)
*Figure 8.7 · PDF p. 636 · 긴 message를 fixed-length hash로 줄이는 many-to-one hash function*

이 성질이 중요한 이유는 substitution attack 때문이다. Sender가 $(m, H(m))$을 만들었을 때, intruder가 같은 hash를 갖는 다른 message `y`를 쉽게 만들 수 있으면 Bob은 조작을 감지하지 못한다. 단순 checksum은 이 조건을 만족하지 못한다.

![Figure 8.8](@/assets/images/cs-computer-network-243-figure-8-8-page-637.png)
*Figure 8.8 · PDF p. 637 · 서로 다른 IOU messages가 같은 simple checksum을 갖는 예*

Figure 8.8의 예처럼 `IOU100.99BOB`와 `IOU900.19BOB`가 같은 checksum을 만들 수 있다면 security hash로는 부적합하다. 따라서 integrity에는 stronger hash가 필요하다. 원문은 `MD5`가 128-bit hash를 만들고, `SHA-1 (Secure Hash Algorithm)`이 160-bit message digest를 만든다고 설명한다. 여기서 중요한 포인트는 특정 알고리즘 암기가 아니라, security hash는 accidental error detection용 checksum보다 훨씬 강한 collision resistance가 필요하다는 점이다.

#### 8.3.2 Message Authentication Code

Hash만 message에 붙이는 방식은 flawed하다. Alice가 $(m, H(m))$을 보내도 Trudy가 bogus message $m'$과 $H(m')$를 만들어 보내면 Bob의 hash check는 통과한다. Hash가 message 변조 여부는 확인해도 “누가 만들었는지”를 확인하지 못하기 때문이다.

`MAC (Message Authentication Code)`은 Alice와 Bob이 공유하는 secret $s$를 hash input에 섞는다.

$$
\begin{aligned}
\text{Alice:}\quad MAC &= H(m + s) \\
\text{send:}\quad &(m, H(m + s)) \\
\text{Bob:}\quad &\text{recompute } H(m + s) \text{ and compare with received MAC}
\end{aligned}
$$

![Figure 8.9](@/assets/images/cs-computer-network-244-figure-8-9-page-638.png)
*Figure 8.9 · PDF p. 638 · shared secret s를 이용해 H(m+s)를 계산하고 비교하는 Message Authentication Code*

MAC의 장점은 confidentiality가 필요 없을 때 encryption 없이 integrity와 source authentication을 제공할 수 있다는 것이다. 예를 들어 OSPF link-state messages는 내용 자체를 숨길 필요는 없어도, bogus message를 막아야 한다. 이때 MAC이 적합하다. 단, MAC은 shared authentication key distribution 문제가 남는다. Routers가 같은 authentication key를 공유하려면 manual distribution이나 public key 기반 key distribution이 필요하다.

`HMAC`은 MAC의 널리 쓰이는 표준이며 MD5나 SHA-1과 함께 사용할 수 있다. HMAC은 data와 authentication key를 hash function에 두 번 통과시키는 구조다. 여기서 `MAC`은 link-layer의 `Medium Access Control`이 아니라 `Message Authentication Code`다.

#### 8.3.3 Digital Signatures

`Digital signature`는 digital document에 대해 handwritten signature와 비슷한 성질을 제공한다. Signature는 `verifiable`해야 하고 `nonforgeable`해야 한다. 즉 누군가가 Bob이 sign한 document임을 검증할 수 있어야 하며, Bob이 아닌 사람이 Bob의 signature를 만들 수 없어야 한다.

MAC은 digital signature가 되기 어렵다. MAC을 검증하려면 Alice도 Bob의 authentication key를 알아야 하는데, 그러면 그 key는 Bob만의 unique secret이 아니게 된다. Digital signature에는 Bob만 아는 private key와 모두가 아는 public key가 있는 public key cryptography가 적합하다.

실제 signing은 full message를 private key로 encrypt하는 대신, message hash를 sign한다. Bob은 $H(m)$을 만들고 private key $K_B^-$로 $K_B^-(H(m))$을 계산해 signature로 붙인다. Alice는 Bob의 public key $K_B^+$를 signature에 적용해 hash를 얻고, 자신이 받은 cleartext message에 hash function을 적용한 값과 비교한다.

![Figure 8.11](@/assets/images/cs-computer-network-246-figure-8-11-page-641.png)
*Figure 8.11 · PDF p. 641 · Bob이 message hash를 private key로 sign해 original message와 함께 보내는 흐름*

![Figure 8.12](@/assets/images/cs-computer-network-247-figure-8-12-page-642.png)
*Figure 8.12 · PDF p. 642 · Alice가 Bob의 public key와 hash comparison으로 signature를 검증하는 흐름*

Digital signature는 sender authentication과 message integrity를 함께 준다. Signature가 검증되면 private key를 가진 Bob이 sign했음을 확인할 수 있고, message가 바뀌면 hash comparison이 실패한다. 다만 public key infrastructure가 필요하므로 MAC보다 heavier technique이다.

| 기법 | key 구조 | 제공하는 것 | 비용/조건 |
| --- | --- | --- | --- |
| `MAC` | Shared secret $s$ | Message integrity, shared-key holder authentication | 빠르고 단순하지만 shared key distribution 필요 |
| `Digital signature` | Sender private key + sender public key | Message integrity, sender authentication, nonforgeability | public key computation과 `PKI` 필요 |

##### Public Key Certification

Public key cryptography의 숨은 문제는 “이 public key가 정말 Bob의 public key인가?”다. Trudy가 자신의 public key를 Bob의 key인 것처럼 Alice에게 주고, 자신의 private key로 signature를 만들면 Alice는 Trudy의 public key로 검증하고 Bob이 보낸 것처럼 착각할 수 있다.

![Figure 8.13](@/assets/images/cs-computer-network-248-figure-8-13-page-644.png)
*Figure 8.13 · PDF p. 644 · Trudy가 자신의 public key를 Bob의 key처럼 속여 digital signature 검증을 통과시키는 공격*

이 문제를 해결하는 것이 `CA (Certification Authority)`와 `certificate`다. CA는 entity의 identity를 검증하고, 그 entity의 public key와 identity를 묶은 certificate를 만든 뒤 CA private key로 digitally sign한다. Alice는 CA의 public key로 certificate signature를 확인하고, certificate 안에서 Bob의 public key를 추출한다.

![Figure 8.14](@/assets/images/cs-computer-network-249-figure-8-14-page-645.png)
*Figure 8.14 · PDF p. 645 · CA가 Bob의 identity와 public key를 묶은 certificate를 private key로 sign하는 구조*

Certificate에는 보통 version, serial number, CA signature algorithm, issuer name, validity period, subject name, subject public key 같은 fields가 들어간다. 중요한 trade-off는 trust의 이동이다. Bob의 key를 직접 믿는 대신 CA의 identity verification과 CA private key 보호를 믿는 구조가 된다. TLS와 IPsec에서 certificate가 중요한 이유가 바로 여기에 있다.

### 8.4 End-Point Authentication

`End-point authentication`은 한 entity가 network를 통해 다른 entity에게 자신의 identity를 증명하는 과정이다. Section 8.3의 digital signature는 “과거에 받은 message가 claimed sender에게서 왔는가”를 검증하는 문제였다면, 여기서는 “지금 실제로 통신 중인 live party가 claimed identity와 일치하는가”를 다룬다.

Authentication protocol은 보통 실제 application protocol, routing exchange, reliable data transfer, e-mail protocol이 시작되기 전에 먼저 실행된다. 이 장은 Chapter 3의 rdt 설계처럼 `ap (authentication protocol)`을 단계별로 만들고, 각 버전이 왜 깨지는지 보며 조건을 강화한다.

![Figure 8.15](@/assets/images/cs-computer-network-250-figure-8-15-page-646.png)
*Figure 8.15 · PDF p. 646 · “I am Alice”만 보내는 ap1.0과 Trudy의 단순 impersonation*

`ap1.0`은 Alice가 “I am Alice”라고 말하는 방식이다. 당연히 Trudy도 같은 message를 보낼 수 있으므로 authentication이 아니다.

![Figure 8.16](@/assets/images/cs-computer-network-251-figure-8-16-page-647.png)
*Figure 8.16 · PDF p. 647 · source IP address를 신뢰하는 ap2.0과 IP spoofing 실패 사례*

`ap2.0`은 Alice의 well-known IP address를 확인하는 방식이다. 하지만 IP source address는 packet 생성자가 임의로 넣을 수 있고, first-hop router가 source address filtering을 강제하지 않으면 `IP spoofing`이 가능하다. 따라서 address만으로 identity를 증명할 수 없다.

![Figure 8.17](@/assets/images/cs-computer-network-252-figure-8-17-page-648.png)
*Figure 8.17 · PDF p. 648 · password를 보내는 ap3.0과 eavesdropping/playback 위험*

`ap3.0`은 shared password를 보내는 방식이다. 문제는 password가 network를 지나며 sniffing될 수 있다는 점이다. Telnet처럼 password를 unencrypted로 보내는 protocol에서는 LAN에 붙은 attacker가 password를 훔칠 수 있다.

`ap3.1`은 password를 symmetric key로 encrypt해서 보낸다. 그러나 encrypted password도 그대로 replay될 수 있다. Trudy가 과거 Alice의 encrypted password message를 녹음해 두었다가 나중에 Bob에게 다시 보내면 Bob은 live Alice인지, old authentication playback인지 구분하지 못한다. 이것이 `playback attack` 또는 `replay attack`이다.

Replay를 막으려면 freshness가 필요하다. `Nonce`는 protocol lifetime에서 한 번만 사용하는 number다. Bob은 방금 만든 nonce $R$을 Alice에게 보내고, Alice는 shared symmetric key `KA-B`로 `KA-B(R)`을 만들어 돌려준다. Bob은 decrypt 결과가 자신이 방금 보낸 `R`과 같은지 확인한다.

![Figure 8.18](@/assets/images/cs-computer-network-253-figure-8-18-page-650.png)
*Figure 8.18 · PDF p. 650 · nonce R과 shared symmetric key KA-B로 liveness를 확인하는 ap4.0*

`ap4.0`이 얻는 보장은 두 가지다. Alice가 `KA-B`를 알고 있으므로 claimed identity와 연결되고, Bob이 방금 생성한 nonce $R$에 응답했으므로 live party임을 확인할 수 있다. 이 구조는 TLS handshake의 nonces, WPA four-way handshake, cellular authentication 같은 뒤쪽 protocol에서 반복된다.

| protocol | 사용하는 단서 | 실패 이유 또는 보장 |
| --- | --- | --- |
| `ap1.0` | “I am Alice”라는 claim | 누구나 같은 claim을 보낼 수 있다. |
| `ap2.0` | source IP address | `IP spoofing`이 가능하다. |
| `ap3.0` | plaintext password | eavesdropping으로 password가 노출된다. |
| `ap3.1` | encrypted password | encrypted value 자체가 replay될 수 있다. |
| `ap4.0` | nonce + shared symmetric key | identity와 liveness를 함께 확인한다. |

### 8.5 Securing E-Mail

Security service는 Internet protocol stack의 여러 layer에서 제공될 수 있다. Application-layer security는 특정 application protocol에 security를 넣고, transport-layer security는 그 transport를 쓰는 applications 전체를 보호하며, network-layer security는 host-to-host 또는 router-to-router datagrams를 넓게 보호한다. Link-layer security는 특정 link 위의 frames를 보호한다.

Network layer에만 security를 넣으면 충분하지 않은 이유가 있다. IP-layer security는 blanket coverage를 줄 수 있지만 user-level authentication을 직접 제공하지 못한다. 예를 들어 commerce site는 customer identity를 IP address만으로 인증할 수 없다. 또한 higher layer는 deployment가 쉽다. `PGP (Pretty Good Privacy)`가 널리 퍼질 수 있었던 것도 application code만 바꾸면 되었기 때문이다.

#### 8.5.1 Secure E-Mail

Secure e-mail이 원하는 속성은 네 가지다. Alice의 e-mail 내용을 Trudy가 읽지 못하게 하는 `confidentiality`, Bob이 message sender가 Alice임을 확인하는 `sender authentication`, message가 변조되지 않았음을 확인하는 `message integrity`, Alice가 Bob의 public key를 올바르게 사용하도록 하는 `receiver authentication`이다.

Confidentiality만 보면 symmetric key로 message를 encrypt하면 빠르지만 key distribution이 문제다. Public key만 쓰면 Bob의 public key로 message를 encrypt할 수 있지만 long e-mail에는 비효율적이다. 그래서 secure e-mail은 session key 구조를 쓴다.

![Figure 8.19](@/assets/images/cs-computer-network-254-figure-8-19-page-652.png)
*Figure 8.19 · PDF p. 652 · symmetric session key KS로 e-mail을 encrypt하고 KS는 Bob의 public key로 보호하는 방식*

Figure 8.19의 confidentiality-only flow는 다음과 같다.

```text
1. Alice chooses random symmetric session key KS.
2. Alice computes KS(m), encrypting the e-mail message m.
3. Alice computes KB+(KS), encrypting KS with Bob's public key.
4. Alice sends package: KS(m) + KB+(KS).
5. Bob uses KB- to recover KS, then uses KS to recover m.
```

Sender authentication과 message integrity만 필요하다면 Alice는 message digest를 sign한다. Alice는 $H(m)$을 계산하고, 자신의 private key $K_A^-$로 $K_A^-(H(m))$을 만든 뒤 original message와 signature를 함께 보낸다. Bob은 Alice의 public key $K_A^+$로 signed digest를 풀고, 자신이 받은 message의 hash와 비교한다.

![Figure 8.20](@/assets/images/cs-computer-network-255-figure-8-20-page-653.png)
*Figure 8.20 · PDF p. 653 · hash function과 digital signature로 sender authentication과 message integrity를 제공하는 방식*

Confidentiality, sender authentication, message integrity를 모두 제공하려면 두 구조를 결합한다. Alice는 먼저 $m + K_A^-(H(m))$ 형태의 signed package를 만들고, 이 전체 package를 session key $K_S$로 encrypt한다. 그리고 $K_S$는 Bob의 public key로 encrypt해 함께 보낸다.

![Figure 8.21](@/assets/images/cs-computer-network-256-figure-8-21-page-653.png)
*Figure 8.21 · PDF p. 653 · symmetric key, public key, hash, digital signature를 결합한 secure e-mail package*

이 구조에서 Alice는 public key cryptography를 두 번 쓴다. Alice 자신의 private key로 signed hash를 만들고, Bob의 public key로 session key를 encrypt한다. Bob도 public key cryptography를 두 번 쓴다. 자신의 private key로 session key를 decrypt하고, Alice의 public key로 signature를 verify한다. 이때 Alice가 정말 Bob의 public key를 얻었는지, Bob이 정말 Alice의 public key를 얻었는지가 certificate/PKI 문제로 이어진다.

#### 8.5.2 PGP

`PGP (Pretty Good Privacy)`는 secure e-mail의 대표 구현이다. 기본 설계는 Figure 8.21과 같다. Version에 따라 message digest에는 MD5 또는 SHA, symmetric encryption에는 CAST, triple-DES, IDEA, public key encryption에는 RSA를 사용할 수 있다. PGP는 user에게 digitally signing, encrypting, 둘 다 수행하는 options를 제공한다.

![Figure 8.22](@/assets/images/cs-computer-network-257-figure-8-22-page-654.png)
*Figure 8.22 · PDF p. 654 · PGP signed message의 형태와 signed message digest*

PGP signed message에는 plaintext message와 signature block이 함께 들어간다. Encoded data는 $K_A^-(H(m))$, 즉 Alice의 private key로 sign된 message digest다. Bob이 integrity와 sender authentication을 verify하려면 Alice의 public key가 필요하다.

![Figure 8.23](@/assets/images/cs-computer-network-258-figure-8-23-page-655.png)
*Figure 8.23 · PDF p. 655 · plaintext 없이 encrypted payload만 포함하는 secret PGP message*

PGP secret message에는 plaintext가 들어가지 않는다. Sender가 confidentiality와 integrity를 모두 원하면, PGP는 encrypted message를 signed message structure 안에 넣는 식으로 두 기능을 결합한다.

PGP의 public key certification은 conventional CA와 다르게 `web of trust`를 사용한다. Alice가 어떤 key/username pair가 맞다고 믿으면 직접 certify할 수 있고, Alice가 신뢰하는 다른 user가 더 많은 keys의 authenticity를 보증하도록 할 수도 있다. Key-signing parties는 users가 직접 만나 public keys를 교환하고 서로의 keys를 private key로 sign하는 방식이다. 이는 중앙 CA hierarchy 대신 social trust graph를 사용하는 구조다.

### 8.6 Securing TCP Connections: TLS

`TLS (Transport Layer Security)`는 TCP connection 위에 confidentiality, data integrity, end-point authentication을 더한 protocol이다. 역사적으로 SSL의 후속이며, HTTPS에서 가장 익숙하게 만난다. TLS는 technically application layer에 구현되지만, developer 관점에서는 TCP socket과 비슷한 `TLS socket`을 제공하는 secure transport처럼 보인다.

![Figure 8.24](@/assets/images/cs-computer-network-259-figure-8-24-page-656.png)
*Figure 8.24 · PDF p. 656 · TLS가 application layer에 있으면서도 developer에게는 secure TCP처럼 보이는 구조*

TLS가 필요한 이유는 Internet commerce 예시로 명확해진다. Bob이 e-commerce site에 order, address, payment card number를 보내는데 confidentiality가 없으면 card information이 노출된다. Data integrity가 없으면 intruder가 order quantity를 바꿀 수 있다. Server authentication이 없으면 Trudy가 Alice Incorporated인 척하며 payment information을 수집할 수 있다.

#### 8.6.1 The Big Picture

Simplified `almost-TLS`는 세 단계로 이해하면 된다: handshake, key derivation, data transfer.

Handshake에서 client Bob은 TCP connection을 만들고, server Alice가 정말 Alice인지 certificate로 확인하며, 이번 TLS session에만 쓸 `Master Secret (MS)`를 Alice에게 보낸다.

![Figure 8.25](@/assets/images/cs-computer-network-260-figure-8-25-page-657.png)
*Figure 8.25 · PDF p. 657 · TCP connection 이후 certificate 확인과 Encrypted Master Secret 전달로 시작하는 almost-TLS handshake*

Almost-TLS handshake의 큰 흐름은 다음과 같다.

1. TCP three-way handshake establishes a TCP connection.
2. Bob sends TLS hello.
3. Alice sends certificate containing Alice's public key.
4. Bob verifies the certificate using CA trust.
5. Bob creates Master Secret $MS$.
6. Bob sends $EMS = K_A^+(MS)$.
7. Alice decrypts $EMS$ with $K_A^-$ and obtains $MS$.

Key derivation에서는 shared MS 하나를 그대로 쓰지 않고 방향과 용도별로 여러 keys를 만든다.

| key | 용도 |
| --- | --- |
| `EB` | Bob -> Alice data encryption key |
| `MB` | Bob -> Alice HMAC key |
| `EA` | Alice -> Bob data encryption key |
| `MA` | Alice -> Bob HMAC key |

방향별 encryption key와 HMAC key를 분리하는 이유는 one key compromise나 one function weakness가 전체 session을 망가뜨리지 않도록 scope를 줄이기 위해서다. 실제 TLS에서는 MS를 단순 slicing하지 않고 standard key derivation function을 사용한다.

Data transfer에서 TLS는 TCP byte stream을 그대로 한 번에 encrypt하지 않는다. TLS는 stream을 `TLS records`로 나누고, 각 record에 HMAC을 붙인 뒤 record+HMAC을 encrypt해 TCP에 넘긴다. 이 구조는 integrity check를 session 끝까지 미루지 않고 record 단위로 수행하게 해 준다.

![Figure 8.26](@/assets/images/cs-computer-network-261-figure-8-26-page-659.png)
*Figure 8.26 · PDF p. 659 · Type, Version, Length, encrypted Data, HMAC으로 구성된 TLS record format*

TLS record의 `Type`, `Version`, `Length`는 cleartext이고, `Data`와 `HMAC`은 encrypted payload 안에 있다. Length는 TCP byte stream에서 record boundaries를 찾는 데 필요하다. Type은 handshake, application data, connection closure 같은 record 성격을 나타낸다.

TLS에서 record HMAC만으로는 stream 전체 integrity가 부족하다. Trudy가 TCP sequence numbers를 조작해 TLS records를 reorder하거나 replay하면 각 record HMAC은 맞더라도 application이 받는 byte stream 순서가 깨질 수 있다. 이를 막기 위해 TLS sender는 record마다 sequence number counter를 유지하고, 실제 record field에는 넣지 않지만 HMAC 계산에는 sequence number를 포함한다. Receiver도 같은 expected sequence number로 HMAC을 계산하므로 reordering/replay가 실패한다.

#### 8.6.2 A More Complete Picture

실제 TLS handshake는 algorithm negotiation과 nonces를 포함한다. Client는 자신이 지원하는 cryptographic algorithms list와 client nonce를 보낸다. Server는 symmetric algorithm, public-key algorithm, HMAC algorithm을 고르고 certificate와 server nonce를 보낸다. Client는 certificate를 검증하고 server public key를 꺼낸 뒤 `PMS (Pre-Master Secret)`를 만들어 server public key로 encrypt해 보낸다. 이후 client와 server는 같은 key derivation function으로 $PMS + nonces$에서 $MS$, encryption keys, HMAC keys, 필요 시 CBC용 IVs를 만든다.

Handshake 마지막에는 client와 server가 자신이 보고 주고받은 모든 handshake messages의 HMAC을 서로 보낸다. 이 단계는 algorithm downgrade attack을 막는다. 예를 들어 Trudy가 client의 algorithm list에서 strong algorithms를 지우면 server와 client가 계산한 handshake transcript HMAC이 달라져 connection을 끊을 수 있다.

TLS의 `nonces`와 sequence numbers는 서로 다른 replay를 막는다.

| 방어 대상 | 사용하는 값 | 이유 |
| --- | --- | --- |
| Ongoing session 안의 individual records replay/reordering | TLS record sequence numbers | 각 record HMAC에 expected sequence number가 들어간다. |
| 이전 TLS connection 전체를 다시 재생하는 connection replay attack | client nonce, server nonce | 매 session마다 keys가 달라져 과거 records의 integrity check가 실패한다. |

Connection closure도 보안 대상이다. TLS가 그냥 underlying TCP FIN만 믿으면 Trudy가 TCP FIN을 삽입해 session을 중간에 끊는 `truncation attack`을 만들 수 있다. TLS는 closure를 나타내는 TLS record type을 사용하고, 이 type은 record HMAC으로 authenticated된다. 따라서 receiver가 authenticated closure TLS record 없이 TCP FIN을 받으면 이상 상황으로 판단할 수 있다.

정리하면 TLS는 이 장 앞부분의 거의 모든 재료를 조합한다. Certificate/CA로 server public key를 검증하고, public key cryptography로 PMS/MS를 안전하게 공유하며, key derivation으로 direction-specific symmetric keys를 만들고, records마다 HMAC/sequence number로 integrity와 replay protection을 제공한다.

### 8.7 Network-Layer Security: IPsec and Virtual Private Networks

`IPsec (IP security protocol)`은 network layer에서 IP datagrams를 보호한다. Host-host, router-router, host-router 같은 network-layer entities 사이에서 confidentiality, source authentication, data integrity, replay-attack prevention을 제공할 수 있다. Transport/application layer 입장에서는 TCP segment, UDP segment, ICMP message, SNMP message 등이 모두 encrypted IP payload 안에 들어가므로 `blanket coverage` 성격이 강하다.

#### 8.7.1 IPsec and Virtual Private Networks (VPNs)

`VPN (Virtual Private Network)`은 public Internet 위에 private network처럼 보이는 secure communication path를 만드는 구조다. 기관이 geographically distributed offices와 traveling users를 모두 private physical network로 연결하려면 비용이 크다. 대신 traffic이 public Internet을 지나기 전에 encrypt하고, Internet routers는 outer IP header만 보고 ordinary IP datagram처럼 forwarding한다.

![Figure 8.27](@/assets/images/cs-computer-network-262-figure-8-27-page-663.png)
*Figure 8.27 · PDF p. 663 · public Internet 위에서 headquarters, branch office, salesperson laptop을 IPsec으로 연결하는 VPN*

Figure 8.27에서 headquarters 내부 host들끼리 또는 branch office 내부 host들끼리는 ordinary IPv4를 쓸 수 있다. 하지만 headquarters에서 hotel의 salesperson laptop으로 가는 traffic은 gateway router가 original IPv4 datagram을 IPsec datagram으로 바꾸어 public Internet으로 보낸다. Public Internet routers는 outer IPv4 header를 보고 forwarding할 뿐, payload 안에 original IP datagram이 encrypted되어 있다는 사실을 이해할 필요가 없다.

#### 8.7.2 The AH and ESP Protocols

IPsec에는 두 principal protocols가 있다.

| protocol | 제공 서비스 | 특징 |
| --- | --- | --- |
| `AH (Authentication Header)` | source authentication, data integrity | confidentiality는 제공하지 않는다. |
| `ESP (Encapsulation Security Payload)` | source authentication, data integrity, confidentiality | VPN에서 더 널리 사용된다. |

원문은 complexity를 줄이기 위해 이후 설명을 `ESP` 중심으로 진행한다. VPN에서 대부분 confidentiality가 필요하므로 ESP가 더 실용적이다.

#### 8.7.3 Security Associations

`SA (Security Association)`는 IPsec datagrams를 보내기 전에 source entity와 destination entity가 만드는 network-layer logical connection이다. SA는 `simplex`, 즉 unidirectional이다. 양방향 secure traffic에는 방향별 SA 두 개가 필요하다.

![Figure 8.28](@/assets/images/cs-computer-network-263-figure-8-28-page-665.png)
*Figure 8.28 · PDF p. 665 · headquarters router R1에서 branch router R2로 가는 단방향 Security Association*

SA에는 datagram을 어떻게 protect할지에 대한 state가 들어 있다.

| SA state | 의미 |
| --- | --- |
| `SPI (Security Parameter Index)` | SA를 식별하는 32-bit identifier |
| origin/destination interface | SA endpoints의 IP addresses |
| encryption algorithm | 예: 3DES with CBC |
| encryption key | payload encryption에 쓰는 key |
| integrity check algorithm | 예: HMAC with MD5 |
| authentication key | MAC computation에 쓰는 key |

IPsec entity는 여러 SAs를 가질 수 있고, 이 state들을 OS kernel의 `SAD (Security Association Database)`에 저장한다. 하지만 SAD만으로는 “어떤 outgoing datagram을 IPsec 처리해야 하는가?”를 알 수 없다. 이 결정은 `SPD (Security Policy Database)`가 담당한다. SPD는 source IP, destination IP, protocol type 등에 따라 IPsec 처리 여부와 사용할 SA를 지정한다. 간단히 말해 `SPD`는 무엇을 할지, `SAD`는 어떻게 할지를 담는다.

#### 8.7.4 The IPsec Datagram

IPsec packet format에는 `tunnel mode`와 `transport mode`가 있다. VPN에서는 original IP datagram 전체를 보호하고 새 outer IP header를 붙이는 tunnel mode가 더 적합하고 널리 사용된다.

Figure 8.29는 ESP tunnel mode datagram을 보여준다. 핵심은 original IPv4 datagram이 encrypted payload 안으로 들어가고, public Internet에서는 new IP header만 보인다는 점이다.

![Figure 8.29](@/assets/images/cs-computer-network-264-figure-8-29-page-666.png)
*Figure 8.29 · PDF p. 666 · new IP header, ESP header, encrypted original IP datagram, ESP trailer, ESP MAC으로 구성된 IPsec datagram*

Router R1이 original IPv4 datagram을 IPsec datagram으로 바꾸는 절차는 다음과 같다.

```text
1. Original IPv4 datagram 뒤에 ESP trailer를 붙인다.
2. Original IPv4 datagram + ESP trailer를 SA의 encryption algorithm/key로 encrypt한다.
3. Encrypted unit 앞에 ESP header를 붙인다.
4. ESP header + encrypted unit 전체에 대해 authentication MAC을 계산한다.
5. MAC을 뒤에 붙여 IPsec payload를 만든다.
6. Source/destination이 IPsec tunnel endpoints인 new IP header를 앞에 붙인다.
```

ESP trailer에는 `padding`, `pad length`, `next header`가 있다. Padding은 block cipher의 block size를 맞추기 위한 meaningless bytes이고, pad length는 receiver가 padding을 제거할 수 있게 한다. Next header는 encrypted payload 안의 original data type, 예를 들어 UDP를 나타낸다.

ESP header는 cleartext이고 `SPI`와 `sequence number`를 포함한다. SPI는 receiver가 SAD에서 어떤 SA를 사용할지 찾는 index다. Sequence number는 replay attack 방어에 쓰인다. New IP header의 protocol number는 TCP/UDP가 아니라 `50`, 즉 ESP를 나타낸다.

R2가 IPsec datagram을 받으면 protocol field가 50임을 보고 ESP processing을 수행한다. R2는 SPI로 SA를 찾고, MAC을 확인해 source authentication/data integrity를 검증하고, sequence number로 fresh datagram인지 확인한다. 그다음 decrypt하고 padding을 제거해 original IP datagram을 꺼낸 뒤 branch office network 안으로 forwarding한다.

IPsec ESP tunnel mode가 제공하는 효과는 TLS보다 더 넓다. Trudy는 original datagram의 transport protocol, original source/destination IP addresses, application protocol을 볼 수 없다. Trudy가 bits를 바꾸거나 R1인 척 datagram을 만들거나 old datagram을 replay해도 MAC/sequence number checks에서 실패한다.

#### 8.7.5 IKE: Key Management in IPsec

작은 VPN에서는 administrator가 SA 정보를 manual keying으로 endpoint SAD에 직접 넣을 수 있다. 하지만 수백/수천 endpoints가 있는 deployment에서는 불가능하다. `IKE (Internet Key Exchange)`는 IPsec SAs를 자동으로 만들기 위한 protocol이다.

IKE는 TLS handshake와 닮았다. 각 IPsec entity는 public key가 들어 있는 certificate를 갖고, 서로 certificates를 교환하며, authentication/encryption algorithms를 negotiate하고, IPsec SA의 session keys를 만들 key material을 안전하게 교환한다. 차이는 IKE가 두 phases를 사용한다는 점이다.

| IKE phase | 핵심 동작 | 결과 |
| --- | --- | --- |
| Phase 1, first exchange | Diffie-Hellman으로 routers 사이 bidirectional `IKE SA`를 만든다. 이때 encryption/authentication keys와 master secret을 설정한다. | authenticated/encrypted IKE channel의 기반 |
| Phase 1, second exchange | 양쪽이 signed messages로 identity를 공개하고, IPsec SAs에서 쓸 algorithms를 negotiate한다. 이 messages는 IKE SA channel 안에서 보호된다. | identity authentication과 algorithm negotiation |
| Phase 2 | 실제 traffic 보호에 사용할 IPsec SA를 방향별로 만든다. | 양방향 IPsec SAs와 session keys |

IKE가 두 phases를 쓰는 이유는 computational cost다. Public-key cryptography가 필요한 expensive phase 1로 secure IKE channel을 만들고, phase 2에서는 상대적으로 저렴하게 많은 IPsec SAs를 생성할 수 있다.

### 8.8 Securing Wireless LANs and 4G/5G Cellular Networks

Wireless network에서는 attacker가 sender transmission range 안에 receiver를 두기만 해도 frames를 sniff할 수 있다. 따라서 802.11 WLAN과 4G/5G cellular network 모두 mutual authentication, nonces, cryptographic hashing, shared symmetric key derivation, AES encryption 같은 앞 절의 기법을 넓게 사용한다.

#### 8.8.1 Authentication and Key Agreement in 802.11 Wireless LANs

802.11 security의 핵심 요구는 두 가지다. 첫째, mobile device와 network가 서로를 인증하는 `mutual authentication`이다. Network는 device identity와 access privileges를 확인해야 하고, device도 자신이 rogue AP/network에 붙는 것이 아닌지 확인해야 한다. 둘째, wireless link에서 AP와 mobile device 사이 user-level data frames를 encrypt해야 한다. 고속 처리가 필요하므로 symmetric key encryption, 보통 AES가 쓰인다.

![Figure 8.30](@/assets/images/cs-computer-network-265-figure-8-30-page-671.png)
*Figure 8.30 · PDF p. 671 · mobile device, AP, authentication server 사이 WPA mutual authentication과 key derivation 흐름*

Figure 8.30의 architecture에는 mobile device, AP, `AS (authentication server)`가 있다. AP는 authentication server와 mobile device 사이 authentication/key derivation messages를 relay하는 pass-through 역할을 한다. Authentication server는 보통 여러 AP에 대한 중앙 authentication service를 제공한다.

WPA의 큰 흐름은 네 단계다.

| 단계 | 의미 |
| --- | --- |
| Discovery | AP가 지원하는 authentication/encryption capabilities를 advertise하고, mobile device가 원하는 방식을 요청한다. 아직 device는 authenticated되지 않았고 encryption key도 없다. |
| Mutual authentication and shared symmetric key derivation | Mobile device와 AS가 미리 공유한 secret, nonces, cryptographic hashing을 사용해 서로를 인증하고 AP-device link encryption에 쓸 session key를 만든다. |
| Shared symmetric session key distribution | AS가 derived session key를 AP에 알려 준다. |
| Encrypted communication via AP | Mobile device와 AP 사이 802.11 frames를 shared session key로 encrypt/decrypt한다. |

초기 `WEP (Wired Equivalent Privacy)`는 serious security flaws가 발견되어 사실상 보안이 없는 것과 비슷해졌다. `WPA1`은 WEP의 문제를 보완하기 위해 message integrity checks와 key inference 방어를 추가했고, `WPA2`는 AES symmetric key encryption 사용을 의무화했다.

WPA의 중심은 mutual authentication과 shared session-key derivation을 수행하는 four-way handshake다. Simplified Figure 8.31에서는 mobile device $M$과 authentication server `AS`가 시작 전에 shared secret `KAS-M`을 알고 있다고 가정한다.

![Figure 8.31](@/assets/images/cs-computer-network-266-figure-8-31-page-673.png)
*Figure 8.31 · PDF p. 673 · NonceAS, NonceM, KAS-M으로 KM-AP를 derivation하는 WPA2 four-way handshake*

핵심은 first two steps다. AS는 `NonceAS`를 만들어 mobile device에 보낸다. Mobile device는 자신의 `NonceM`을 만들고, `NonceAS`, `NonceM`, initial shared secret `KAS-M`, 양쪽 MAC addresses를 사용해 `KM-AP`를 계산한다. 그런 다음 `NonceM`과 $HMAC(f(K_{AS-M}, Nonce_{AS}))$를 AS에 보낸다. AS는 자신이 방금 보낸 nonce가 shared secret 기반 HMAC 안에 들어 있음을 확인해 mobile device의 liveness와 identity를 검증하고, 같은 inputs로 `KM-AP`를 계산한다. 이후 AS는 Figure 8.30의 Step 3에서 AP에게 이 session key를 전달한다.

`WPA3`는 WPA2 four-way handshake에 대한 nonce reuse 유도 공격을 보완하고, 더 긴 key lengths 등을 포함한다. 다만 legacy four-way handshake도 여전히 허용한다.

802.11 security messaging은 `EAP (Extensible Authentication Protocol)`, `EAPoL (EAP over LAN)`, `RADIUS`로 나뉜다.

![Figure 8.32](@/assets/images/cs-computer-network-267-figure-8-32-page-674.png)
*Figure 8.32 · PDF p. 674 · EAP messages가 wireless link에서는 EAPoL, AP-AS 구간에서는 RADIUS/UDP/IP로 encapsulate되는 구조*

EAP는 mobile device와 authentication server 사이 end-to-end authentication message format을 정의한다. Wireless link에서는 EAP messages가 EAPoL로 encapsulate되고, AP에서 decapsulate된 뒤 RADIUS over UDP/IP로 다시 encapsulate되어 authentication server로 간다. RADIUS는 필수는 아니지만 de facto standard이고, DIAMETER가 후속으로 제안되었다.

#### 8.8.2 Authentication and Key Agreement in 4G/5G Cellular Networks

4G/5G security도 목표는 802.11과 같다. Mobile device와 base station 사이 wireless frames를 encrypt하기 위한 shared symmetric key가 필요하고, network는 mobile device identity/access privileges를 확인해야 하며, mobile device도 rogue cellular base station이 아닌 legitimate network인지 확인해야 한다. 차이는 cellular에서는 device가 home network가 아니라 visited network에 roaming 중일 수 있고, 이때 visited/home networks가 함께 authentication에 참여한다는 점이다.

![Figure 8.33](@/assets/images/cs-computer-network-268-figure-8-33-page-676.png)
*Figure 8.33 · PDF p. 676 · M, BS, MME, HSS가 참여하는 4G LTE mutual authentication and key agreement*

4G AKA에서 mobile device $M$과 home network의 `HSS`는 시작 전부터 shared secret `KHSS-M`을 알고 있다. 이 secret은 mobile device의 SIM card와 home network HSS database에 저장된다. Visited network의 `MME`는 중간에서 messages를 relay하고 authentication decision을 돕지만, `KHSS-M` 자체를 배우지는 않는다.

4G `AKA (Authentication and Key Agreement)` 흐름은 다음과 같다.

| 단계 | 동작 | 의미 |
| --- | --- | --- |
| a. Authentication request to HSS | Mobile device가 attach message에 `IMSI`를 담아 보내고, MME가 IMSI와 visited network info를 HSS에 전달한다. | Home network가 subscriber 정보를 확인한다. |
| b. Authentication response from HSS | HSS가 `KHSS-M`으로 `auth_token`, `xresHSS`, keys를 만든다. `auth_token`은 mobile device가 HSS를 인증하게 해 주고, `xresHSS`는 MME가 mobile device를 검증할 expected response다. | HSS가 mutual authentication 재료를 만든다. |
| c. Authentication response from mobile device | Mobile device가 auth_token을 검증해 HSS를 인증하고, `KHSS-M` 기반 계산으로 `resM`을 만들어 MME에 보낸다. | Device가 shared secret을 알고 있음을 증명한다. |
| d. Mobile device authentication | MME가 `resM`과 `xresHSS`를 비교한다. Match하면 mobile device를 authenticated로 보고 base station과 device에 완료를 알린다. | MME는 middleman이지만 secret key는 모른다. |
| e. Data/control plane key derivation | Mobile device와 base station이 wireless channel frame encryption/decryption keys를 만든다. | Data plane과 control plane에 separate keys가 쓰인다. |

4G/5G도 AES encryption을 사용한다. 5G에서는 보안 구조가 일부 달라진다. 4G에서는 visited network의 MME가 authentication decision을 하는 반면, 5G는 home network가 authentication acceptance를 더 직접 담당하고 visited network는 더 작은 middleman 역할을 하도록 변화한다. 5G는 기존 AKA와 함께 `AKA' (AKA-prime)`처럼 EAP 기반 message flow를 사용하는 variant, IoT 환경을 위한 shared-in-advance secret이 필요 없는 protocol을 추가한다. 또 permanent identity인 `IMSI`를 cleartext로 보내지 않도록 public key cryptography로 encrypt하는 변화도 포함된다.

### 8.9 Operational Security: Firewalls and Intrusion Detection Systems

Cryptography가 communication channel 자체를 보호한다면, `operational security`는 organization network를 Internet의 hostile environment로부터 방어하는 문제다. Network administrator 관점에서는 내부 network users/resources를 보호하고, 외부에서 들어오거나 내부에서 나가는 traffic을 security policy에 맞춰 검사해야 한다. 대표 장비가 `firewall`, `IDS (Intrusion Detection System)`, `IPS (Intrusion Prevention System)`이다.

#### 8.9.1 Firewalls

`Firewall`은 hardware와 software의 조합으로, organization internal network와 public Internet 사이에서 어떤 packets를 pass/drop할지 결정한다. Firewall의 목표는 세 가지다. 모든 traffic이 firewall을 지나가게 하고, local security policy가 허용한 traffic만 통과시키며, firewall 자체가 compromise되지 않도록 하는 것이다.

![Figure 8.34](@/assets/images/cs-computer-network-269-figure-8-34-page-679.png)
*Figure 8.34 · PDF p. 679 · administered network와 public Internet 사이 boundary에 놓인 firewall*

Firewall은 크게 `traditional packet filters`, `stateful filters`, `application gateways`로 나눌 수 있다.

`Traditional packet filter`는 각 datagram을 isolation 상태로 보고 rule에 따라 pass/drop한다. Rule은 보통 IP source/destination address, protocol type, TCP/UDP source/destination port, TCP SYN/ACK flags, ICMP message type, in/out direction, router interface를 본다. 예를 들어 외부에서 내부 public Web server로 들어오는 TCP SYN만 허용하고 나머지 incoming TCP SYN은 drop할 수 있다.

Packet filter의 한계는 packet 단위 stateless decision이다. ACK bit가 set된 incoming TCP packet은 내부 client가 시작한 connection의 response일 수도 있지만, attacker가 forged packet을 보낸 것일 수도 있다. Source address 기반 policy도 spoofed source address에는 약하다.

`Stateful packet filter`는 TCP connection table을 유지한다. SYN/SYNACK/ACK handshake를 보고 connection 시작을 기록하고, FIN이나 inactivity timeout으로 connection 종료를 추정한다. Incoming ACK packet을 받을 때 access control list만 보는 것이 아니라 connection table에 해당 flow가 있는지도 확인한다. 따라서 내부 host가 시작한 Web connection의 response는 허용하면서, 외부 attacker가 ACK bit만 set해 보낸 malformed packet은 drop할 수 있다.

`Application gateway`는 IP/TCP/UDP header를 넘어 application-layer data를 보고 policy decision을 한다. 예를 들어 특정 internal users만 Telnet을 외부로 사용할 수 있게 하려면 user ID/password 같은 application-level identity가 필요하므로 packet filter만으로는 부족하다.

![Figure 8.35](@/assets/images/cs-computer-network-270-figure-8-35-page-684.png)
*Figure 8.35 · PDF p. 684 · packet filter와 Telnet application gateway를 결합한 firewall 구조*

Application gateway는 client와 external server 사이에서 application-specific relay가 된다. Internal user는 먼저 gateway에 접속하고, gateway가 user authorization을 확인한 뒤 external server와 별도 connection을 만든다. 이 구조는 fine-grained control을 제공하지만 application마다 gateway가 필요하고, 모든 data가 gateway를 거치므로 performance penalty가 있으며, client software가 gateway 사용 방식을 알아야 한다.

Proxy는 application gateway의 한 형태로 anonymity/privacy에도 쓰일 수 있다. User가 proxy와 TLS/SSL connection을 맺고, proxy가 대신 target Web site에 request를 보내면 target site는 user IP가 아니라 proxy IP를 본다. Local ISP는 user-proxy 구간이 encrypted되어 있으면 target URL/content를 직접 볼 수 없다. 단, proxy는 user와 target site를 모두 알 수 있으므로 trust boundary가 proxy로 이동한다.

![Figure 8.36](@/assets/images/cs-computer-network-271-figure-8-36-page-685.png)
*Figure 8.36 · PDF p. 685 · trusted proxy와 SSL을 이용해 local ISP와 target site에 노출되는 정보를 줄이는 구조*

#### 8.9.2 Intrusion Detection Systems

Packet filter는 header fields 중심으로 판단한다. 하지만 worms, application vulnerability attacks, network mapping, port scans, DoS patterns를 탐지하려면 packet payload와 packet sequences를 보는 `deep packet inspection`이 필요하다. Suspicious traffic을 발견해 alert를 생성하는 장비가 `IDS`, suspicious traffic을 drop하는 장비가 `IPS`다. 책은 탐지 원리가 핵심이므로 둘을 함께 IDS systems로 다룬다.

![Figure 8.37](@/assets/images/cs-computer-network-272-figure-8-37-page-688.png)
*Figure 8.37 · PDF p. 688 · filter, application gateway, IDS sensors, DMZ를 함께 배치한 organization network*

IDS sensors를 여러 곳에 두는 이유는 processing load와 visibility 때문이다. IDS는 packets를 tens of thousands of signatures와 비교해야 하므로 access link 전체 traffic을 한 sensor가 모두 처리하면 overload될 수 있다. Downstream에 여러 sensors를 두면 각 sensor가 traffic subset만 보고, central IDS processor가 suspicious activity를 통합해 administrator에게 alarm을 보낼 수 있다. Public Web server, FTP server, DNS server처럼 외부와 통신해야 하는 servers는 보통 `DMZ (demilitarized zone)`에 둔다.

IDS detection 방식은 크게 두 가지다.

| 방식 | 핵심 아이디어 | 장점 | 한계 |
| --- | --- | --- | --- |
| `signature-based IDS` | Known attack signatures database와 packet/packet series를 비교한다. | 알려진 attacks에 강하고 실무 배포가 많다. | Unknown attacks에는 blind하고, false alarm과 processing overload 문제가 있다. |
| `anomaly-based IDS` | Normal traffic profile을 만들고 statistically unusual traffic을 찾는다. | New/undocumented attacks를 잡을 가능성이 있다. | Normal과 abnormal의 경계가 어렵고 false positives가 많을 수 있다. |

`Snort`는 public-domain open-source IDS의 대표 예다. Snort signature는 packet characteristics와 payload pattern을 rule로 표현한다. 예를 들어 ICMP type 8, empty payload, external-to-home direction을 조건으로 `nmap ping sweep`을 탐지할 수 있다. Snort의 힘은 tool 자체뿐 아니라 새 attacks에 대해 빠르게 signatures를 만들고 배포하는 community에도 있다.

### 8.10 Summary

이 장은 secure communication의 기본 목표에서 시작해, 그 목표를 실제 network protocols와 operational devices에 배치하는 방식으로 진행된다. Cryptography part에서는 symmetric key cryptography, block cipher, CBC, public key cryptography, RSA, session keys를 배웠다. Integrity part에서는 cryptographic hash, MAC/HMAC, digital signature, certificate/CA를 통해 “변조되지 않았고 claimed sender가 만들었다”는 것을 확인하는 방법을 보았다. Authentication part에서는 nonce가 replay attack과 liveness 문제를 해결하는 핵심 도구임을 확인했다.

Protocol part에서는 같은 security primitives가 layer별로 다르게 조합된다. PGP는 application layer에서 secure e-mail을 위해 session key, public key encryption, digital signature를 결합한다. TLS는 TCP 위에서 certificate, PMS/MS, key derivation, HMAC, sequence numbers, nonces, closure records를 사용한다. IPsec은 network layer에서 SA/SAD/SPD, ESP tunnel mode, MAC, sequence numbers, IKE를 사용해 VPN과 blanket coverage를 제공한다. WPA/WPA2와 4G/5G AKA는 wireless link 특성 때문에 mutual authentication과 session-key derivation을 attachment 과정에 깊게 넣는다.

Operational part에서는 cryptography만으로 network security가 끝나지 않음을 보여준다. Firewall은 policy 기반으로 traffic을 filter하고, application gateway/proxy는 application data를 기반으로 더 세밀한 control을 제공한다. IDS/IPS는 deep packet inspection으로 suspicious traffic을 탐지하거나 차단한다.

## 연결 관계

Chapter 3의 checksum, sequence number, TCP handshake는 이 장에서 cryptographic hash, TLS record sequence number, nonce 기반 freshness로 확장된다. Chapter 4의 IP datagram, forwarding, generalized forwarding, ACL은 IPsec tunnel mode와 firewall packet filtering의 기반이다. Chapter 5의 routing protocols는 message integrity가 필요한 대표 사례이며, bogus link-state advertisement는 MAC이 왜 필요한지 보여준다. Chapter 6의 link layer와 Chapter 7의 wireless/Wi-Fi/LTE architecture는 WPA, EAPoL, RADIUS, 4G AKA, HSS/MME/SIM shared secret으로 이어진다.

## 오해하기 쉬운 내용

`Encryption`은 security 전체가 아니다. Confidentiality는 제공하지만, sender authentication이나 message integrity는 별도 MAC/signature/certificate/protocol design이 필요하다.

`Hash`만 붙이면 integrity가 되는 것이 아니다. Secret 없이 $H(m)$만 붙이면 attacker도 $m'$와 $H(m')$를 만들 수 있다. MAC은 shared secret을 hash input에 넣어 이 문제를 막는다.

`Digital signature`와 `MAC`은 비슷해 보여도 trust model이 다르다. MAC은 shared key라 빠르지만 nonrepudiation에는 약하고, digital signature는 private key 기반이라 검증 가능성과 nonforgeability가 강하지만 PKI가 필요하다.

`TLS`는 TCP를 대체하는 transport protocol이 아니다. 구현 위치는 application layer에 가깝지만 developer에게 secure TCP socket처럼 보이는 layer다.

`IPsec`은 application user identity를 직접 인증하지 않는다. Network-layer blanket coverage는 강력하지만, commerce site의 customer authentication 같은 user-level security는 higher layer가 맡아야 한다.

`Firewall`은 IDS가 아니고, `IDS`도 firewall이 아니다. Firewall은 policy에 따라 traffic을 pass/drop하는 gate이고, IDS는 suspicious behavior를 detect/alert하거나 IPS로 확장되어 drop할 수 있다.

## 면접 질문

1. `confidentiality`, `message integrity`, `end-point authentication`, `operational security`를 각각 구분하고, 어떤 protocol/기법이 담당하는지 설명하라.
2. Symmetric key cryptography와 public key cryptography의 trade-off를 key distribution, speed, digital signature 관점에서 설명하라.
3. CBC에서 `IV (Initialization Vector)`가 왜 필요하며, 같은 plaintext block이 같은 ciphertext block으로 반복되는 문제를 어떻게 줄이는가?
4. `MAC`, `HMAC`, `digital signature`의 차이를 key 구조와 제공 보장 관점에서 비교하라.
5. TLS handshake에서 certificate, PMS/MS, nonces, sequence numbers, HMAC이 각각 어떤 공격을 막는가?
6. IPsec에서 `SA`, `SAD`, `SPD`, `SPI`, `ESP`, tunnel mode가 각각 무엇인지 설명하라.
7. WPA2 four-way handshake와 4G AKA에서 nonce와 pre-shared secret이 어떤 역할을 하는가?
8. Stateless packet filter, stateful packet filter, application gateway, IDS의 차이를 traffic visibility와 decision 기준 관점에서 설명하라.
