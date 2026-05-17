---
title: "Security: EAP, IPsec, TLS, DNSSEC, and DKIM"
order: 18
pubDatetime: 2026-05-17T00:00:00+09:00
modDatetime: 2026-05-17T00:00:00+09:00
description: "TCP/IP Illustrated 정리: Security: EAP, IPsec, TLS, DNSSEC, and DKIM"
tags:
  - "ComputerNetwork"
  - "CS"
  - "TCPIP"
---

## 개요

이 장은 TCP/IP 계층과 주요 application protocol 위에 붙는 보안 기술을 한 흐름으로 정리한다. 범위는 security principles와 network threats에서 시작해 cryptography, certificate/PKI, network access control(802.1X/EAP/PANA), IPsec/IKEv2/AH/ESP, TLS/DTLS, DNSSEC/TSIG/TKEY/SIG(0), DKIM, 그리고 security protocol attacks까지 이어진다. 핵심 질문은 “어떤 공격을 막으려는가”, “어느 계층에서 무엇을 보호하는가”, “key와 identity를 어떻게 신뢰하는가”다.

## 핵심 개념

### 18.1 Introduction

Internet security threat는 대략 세 부류로 볼 수 있다. 첫째, implementation bug를 찔러 process가 의도하지 않은 code를 실행하게 만드는 공격이다. Buffer overflow worm이 대표적이며, server process memory를 덮어쓴 뒤 injected code를 실행하고 스스로 복제한다. 둘째, 사용자가 악성 program을 실행하게 유도하는 공격이다. 셋째, protocol을 문법상 맞게 사용하지만 authorization이나 trust boundary를 위반하는 방식이다.

Malware(malicious software)는 사용자의 의도와 반대로 실행되는 software 전반을 가리킨다. E-mail attachment/spam, drive-by attack, portable media 등을 통해 전달될 수 있고, 대규모 감염 host 집합인 botnet을 만들기도 한다. Botnet은 spam, 정보 유출(exfiltration), keystroke logging, DoS attack, phishing/spear phishing 등에 쓰일 수 있다. 이 장의 초점은 malware 분석 자체가 아니라, IP/TCP/e-mail/DNS 같은 protocol이 어떤 security extension으로 보강되는지 이해하는 것이다.

### 18.2 Basic Principles of Information Security

Information security의 기본 속성은 CIA triad다.

| 속성 | 의미 | protocol 관점의 질문 |
|---|---|---|
| Confidentiality | intended users만 정보를 알 수 있음 | Eve가 packet을 capture해도 내용을 읽을 수 없는가? |
| Integrity | unauthorized modification 없이 전달됨 | Mallory가 bit/field/message를 바꾸면 탐지되는가? |
| Availability | 필요할 때 정보와 service를 사용할 수 있음 | DoS로 service가 마비되지 않는가? |

여기에 authentication, nonrepudiation, auditability가 자주 따라온다. Authentication은 특정 principal이 다른 principal을 impersonate하지 않는다는 보장이다. Nonrepudiation은 어떤 action이 나중에 부인될 수 없도록 증명 가능하다는 뜻이다. Auditability는 정보가 어떻게 사용되었는지 신뢰 가능한 log/accounting이 남는 속성이다. Network security protocol은 이 속성 중 일부를 계층과 threat model에 맞게 제공한다.

### 18.3 Threats to Network Communication

Network communication threat는 passive attack과 active attack으로 나눌 수 있다. Passive attack은 traffic을 monitor/eavesdrop하는 공격이고, confidentiality를 깨뜨린다. Active attack은 traffic을 modify, delete, replay하거나 service 자체를 방해하므로 integrity, authenticity, availability를 건드린다.

![Figure 18-1](@/assets/images/cs-tcp-ip-illustrated-310-figure-18-1-page-846.png)
*Figure 18-1 · PDF p. 846 · Alice와 Bob 사이에서 Eve는 eavesdropping, Mallory는 modification/replay를 수행할 수 있는 위협 모델*

Figure 18-1의 이름은 보안 설명에서 자주 쓰이는 관례다. Alice와 Bob은 통신 당사자(principals), Eve는 eavesdropper, Mallory는 malicious attacker다. Eve는 passive attack만 수행하지만, Mallory는 traffic을 저장, 수정, 삭제, 재정렬, replay할 수 있어 active/passive attack을 모두 수행한다.

| 분류 | 대표 공격 | 위협받는 속성 |
|---|---|---|
| Passive | eavesdropping/capture/sniffing | confidentiality |
| Passive | traffic analysis | confidentiality, metadata privacy |
| Active | message stream modification(MSM), MITM | authenticity, integrity |
| Active | denial of service(DoS) | availability |
| Active | spurious association, masquerading, replay | authenticity |

Passive attack은 Alice/Bob이 감지하기 거의 불가능하다는 점이 어렵다. Traffic contents를 숨기려면 encryption이 필요하고, traffic size/timing/participants 같은 metadata 노출을 줄이려면 padding, traffic shaping, anonymity system 같은 별도 고려가 필요하다. Active attack은 탐지 가능성이 더 크지만, 예방하려면 authentication, integrity check, replay protection, key management가 필요하다.

물리적으로 channel을 완전히 보호하는 방법도 있지만 Internet이나 wireless 환경에서는 실질적으로 불가능하다. 그래서 cryptography가 필요하다. Cryptography를 조심스럽게 쓰면 passive attack은 내용을 읽지 못하게 만들고, active attack은 적어도 탐지 가능하게 만들 수 있다.

### 18.4 Basic Cryptography and Security Mechanisms

Cryptography는 confidentiality, integrity, authenticity를 unsecured channel 위에서 제공하기 위해 발전했다. 역사적으로는 codebook과 cipher에서 출발했지만, networking에서 중요한 것은 cryptosystem의 구성 요소와 각 security protocol이 어떤 primitive를 쓰는지다.

### 18.4.1 Cryptosystems

Cryptosystem은 algorithm만이 아니라 key, protocol, 운영 절차를 함께 포함한다. Cleartext가 encryption algorithm과 key를 거쳐 ciphertext가 되고, receiver는 대응 key와 decryption algorithm으로 cleartext를 복원한다.

![Figure 18-2](@/assets/images/cs-tcp-ip-illustrated-311-figure-18-2-page-849.png)
*Figure 18-2 · PDF p. 849 · symmetric key cryptosystem과 asymmetric/public key cryptosystem의 기본 흐름*

Symmetric key cryptosystem에서는 encryption key와 decryption key가 보통 동일하고 secret key를 공유한 당사자만 유효한 ciphertext를 만들거나 복호화할 수 있다. 따라서 confidentiality뿐 아니라 약한 수준의 authentication도 암시한다. 하지만 message가 transit 중 수정되었는지를 확실히 확인하려면 단순 복호화 성공만으로 부족하고, MAC/HMAC 같은 integrity mechanism을 함께 써야 한다.

Asymmetric(public key) cryptosystem에서는 각 principal이 public key/private key pair를 가진다. Bob에게 confidential message를 보내려면 Alice가 Bob의 public key로 encrypt하고, Bob은 자신의 private key로 decrypt한다. 이 방식의 큰 장점은 secret key material을 모든 통신 상대에게 미리 안전하게 배포하지 않아도 된다는 점이다. 다만 Bob의 public key로 암호화된 message는 누구나 만들 수 있으므로, confidentiality와 sender authentication은 별개의 문제다.

Symmetric encryption algorithm은 block cipher와 stream cipher로 나뉜다. Block cipher는 64 또는 128 bits 같은 고정 크기 block을 처리하고, stream cipher는 입력 bit/byte stream을 연속적으로 처리한다. DES/3DES는 역사적으로 중요하지만 key length와 보안성 문제로 대부분 AES(Advanced Encryption Standard, Rijndael)로 대체되었다. AES는 AES-128, AES-192, AES-256처럼 key length로 구분된다.

Asymmetric cryptosystem은 confidentiality와 authentication을 서로 다른 방향으로 제공할 수 있다. Bob에게 비밀 message를 보내려면 Bob의 public key로 encrypt한다. 반대로 Alice가 자신의 private key로 message를 변환하면 누구나 Alice의 public key로 검증할 수 있으므로 digital signature가 된다. 둘을 결합하면 “Alice가 작성했고 Bob만 읽을 수 있는” signed and private message를 만들 수 있다.

![Figure 18-3](@/assets/images/cs-tcp-ip-illustrated-312-figure-18-3-page-851.png)
*Figure 18-3 · PDF p. 851 · public key cryptosystem이 confidentiality, digital signature, 두 속성의 결합을 제공하는 방식*

Digital signature는 authenticity와 nonrepudiation의 기반이다. Alice의 private key를 가진 주체만 Alice로서 서명할 수 있고, public key를 가진 verifier는 signature를 검증할 수 있다. 실제 Internet protocol은 public key operation이 비싸기 때문에 대부분 hybrid cryptosystem을 사용한다. 즉 public key cryptography는 symmetric session key를 안전하게 만들거나 교환하는 데 쓰고, 실제 bulk traffic encryption은 더 빠른 symmetric algorithm으로 처리한다.

### 18.4.2 Rivest, Shamir, and Adleman (RSA) Public Key Cryptography

RSA는 factoring large numbers의 어려움에 기대는 public key cryptosystem이다. 두 큰 prime `p`, `q`를 고르고 `n = pq`를 modulus로 둔다. `Φ(n) = (p-1)(q-1)`이고, public exponent `e`와 private exponent `d`는 다음 관계를 만족한다.

```text
d = e^-1 mod Φ(n)
public key  = (e, n)
private key = (d, n)
```

Encryption과 decryption은 modular exponentiation으로 표현된다.

```text
c = m^e mod n
m = c^d mod n
```

Digital signature는 RSA를 “reverse”로 쓰는 것처럼 볼 수 있다.

```text
s = m^d mod n       # sign with private exponent
m = s^e mod n       # verify with public exponent
```

Eve가 `n`과 `e`를 알아도 `p`, `q`, `Φ(n)`을 모르면 `d`를 구하기 어렵다. 즉 RSA security는 semiprime `n`을 factoring하는 것이 현실적으로 어렵다는 가정에 기대며, 이 때문에 key size가 중요하다. 원문은 1024-bit modulus가 쓰이던 맥락과 2048-bit 이상 권고를 언급한다.

### 18.4.3 Diffie-Hellman-Merkle Key Agreement (Diffie-Hellman, DH)

Diffie-Hellman(DH)은 insecure network 위에서 두 endpoint가 shared secret bits를 합의하는 key agreement protocol이다. 공개 parameter `p`, `g`가 있고, Alice와 Bob은 각각 secret random number `a`, `b`를 고른다.

```text
Alice: A = g^a mod p  -> Bob
Bob:   B = g^b mod p  -> Alice

Alice computes: K = B^a mod p = g^(ba) mod p
Bob computes:   K = A^b mod p = g^(ab) mod p
```

Eve는 `g`, `p`, `A`, `B`를 볼 수 있지만, discrete log problem을 풀지 못하면 `a`, `b`, `K`를 알 수 없다. 그러나 기본 DH는 authentication을 제공하지 않는다. Mallory가 Alice에게는 Bob인 척, Bob에게는 Alice인 척 자신의 public value를 주입하면 MITM이 가능하다. 따라서 실제 protocol은 DH public value를 digital signature나 certificate로 authenticate한다. STS(Station-to-Station) protocol은 Alice와 Bob이 DH public values에 서명하는 고전적 접근이다.

### 18.4.4 Signcryption and Elliptic Curve Cryptography (ECC)

Signcryption(authenticated encryption)은 digital signature와 encryption을 따로 수행하는 비용보다 낮은 비용으로 confidentiality와 authentication을 함께 제공하려는 scheme이다. ECC(Elliptic Curve Cryptography)는 RSA와 다른 수학적 기반, 즉 elliptic curve discrete logarithm의 어려움에 기대는 public key cryptography다. 같은 security level에서 RSA보다 훨씬 작은 key를 사용할 수 있어 계산과 message size 측면에서 유리하다. TCP/IP security protocol에서는 ECDH, ECDSA 같은 형태로 뒤에서 계속 등장한다.

### 18.4.5 Key Derivation and Perfect Forward Secrecy (PFS)

긴 통신 session에서는 모든 data를 장기 key 하나로 encrypt하지 않고 short-term session key를 사용한다. Session key는 master key, previous session key, DH shared secret, nonce 같은 input을 key derivation function(KDF)에 넣어 만든다. Extended communication에서는 rekey를 여러 번 수행할 수 있다.

Perfect Forward Secrecy(PFS)는 어떤 session key가 나중에 compromise되어도 과거 또는 미래의 다른 session communication이 보호되는 성질이다. 보통 PFS는 ephemeral DH/ECDH처럼 매 session 또는 재협상마다 fresh key exchange를 요구하므로 overhead가 늘지만, long-term private key compromise의 피해 범위를 크게 줄인다.

### 18.4.6 Pseudorandom Numbers, Generators, and Function Families

Cryptography에서는 key, nonce, challenge, IV, salt 등을 만들기 위해 random-looking bits가 필요하다. 일반 PRNG(pseudorandom number generator)는 deterministic state와 seed에서 sequence를 만들기 때문에, internal state나 parameter가 알려지면 예측될 수 있다. LCG(Linear Congruential Generator)는 simulation에는 충분할 수 있지만 cryptographic purpose에는 부적합하다.

CSPRNG(cryptographically secure PRNG)는 PRF(pseudorandom function family)에 기반해 polynomial-time adversary가 true random과 구별하기 어렵도록 설계된다. Session key generation처럼 guess resistance가 중요한 작업에는 CSPRNG가 필요하다.

### 18.4.7 Nonces and Salt

Nonce는 “number used once”로, protocol transaction의 freshness를 보장하는 데 사용된다. Challenge-response authentication에서 server가 nonce를 주고 client가 그 nonce를 포함해 응답하면, replayed old authentication exchange는 현재 nonce와 맞지 않아 거부된다.

Salt는 password/passphrase/key 같은 secret에 대한 brute-force checking을 어렵게 만드는 random 또는 pseudorandom value다. 같은 password라도 salt가 다르면 stored digest/encrypted value가 달라져 rainbow table의 재사용성이 크게 떨어진다. Salt는 secret일 필요는 없지만 충분히 다양해야 한다.

| 구분 | 목적 | 대표 사용 |
|---|---|---|
| nonce | freshness, replay 방지 | challenge-response, IKE/TLS handshake |
| salt | brute-force/rainbow table 저항 | password hashing, NSEC3 hashing |
| IV | encryption mode 초기화 | CBC, CTR, AEAD mode |
| session key | bulk encryption key | TLS record, IPsec SA |

### 18.4.8 Cryptographic Hash Functions and Message Digests

Ethernet/IP/TCP의 checksum/FCS는 random error detection에는 충분할 수 있지만, Mallory가 의도적으로 message를 바꾸는 attack에는 부족하다. Cryptographic hash function `H`는 message `M`을 digest/fingerprint `H(M)`로 압축하고, 다음 성질을 목표로 한다.

| 성질 | 의미 |
|---|---|
| preimage resistance | `H(M)`만 보고 원래 `M`을 찾기 어려움 |
| second preimage resistance | `M1`과 같은 digest를 갖는 다른 `M2`를 찾기 어려움 |
| collision resistance | 임의의 서로 다른 `M1`, `M2`에서 같은 digest를 찾기 어려움 |

MD5는 128-bit digest, SHA-1은 160-bit digest를 만들지만, 둘 다 현대적 보안 요구에서는 약점이 있다. SHA-2 family는 SHA-224, SHA-256, SHA-384, SHA-512처럼 더 긴 digest를 제공한다. Hash function은 DNSSEC RRSIG/DS, TLS handshake, certificate signature, HMAC 등에서 반복적으로 쓰인다.

### 18.4.9 Message Authentication Codes (MACs, HMAC, CMAC, and GMAC)

Message authentication code(MAC)는 link-layer MAC address와 무관하며, message integrity와 authentication을 제공하는 keyed digest다. `H(M, K)`를 계산하려면 private key `K`가 필요하므로, key를 모르는 Mallory는 valid MAC을 만들기 어렵다. 다만 MAC key는 보통 둘 이상의 party가 공유하므로 digital signature처럼 강한 nonrepudiation 근거가 되지는 못한다.

HMAC은 hash를 두 겹으로 감싼 구조다.

```text
HMAC-H(K, M)_t = left_t( H( (K xor opad) || H((K xor ipad) || M) ) )
```

이 nested construction은 단순한 `H(K || M)` 또는 `H(M || K)` 형태의 extension attack을 피하기 위해 설계되었다. `ipad=0x36...`, `opad=0x5C...`는 내부/외부 key material이 충분히 달라지도록 한다. CMAC과 GMAC은 hash function 대신 AES 같은 block cipher mode를 기반으로 MAC 또는 authenticated encryption을 제공한다.

### 18.4.10 Cryptographic Suites and Cipher Suites

Cryptographic suite 또는 cipher suite는 “어떤 encryption algorithm을 쓰는가”만이 아니라, MAC algorithm, PRF, key agreement algorithm, signature algorithm, key length, mode, parameter를 함께 지정한다. 예를 들어 TLS나 IKE는 handshake 중 서로 지원하는 cipher suite/proposal을 주고받아 실제 session에서 사용할 조합을 선택한다.

Block cipher operating mode는 single-block primitive를 긴 message에 반복 적용하는 방법이다.

| mode | 핵심 아이디어 | 특징 |
|---|---|---|
| CBC(Cipher Block Chaining) | cleartext block을 이전 ciphertext block과 XOR 후 encrypt | encryption이 serial, IV 필요, padding 필요 |
| CTR(Counter Mode) | nonce/IV + counter를 encrypt해 keystream 생성 후 XOR | 병렬화 가능, block cipher를 stream cipher처럼 사용 |
| GCM/CCM | CTR류 encryption에 authentication 결합 | AEAD 제공, separate MAC 불필요한 경우 많음 |

AEAD(Authenticated Encryption with Associated Data)는 confidentiality가 필요한 payload를 encrypt/authenticate하고, header처럼 encrypt하지 않을 associated data는 authenticate만 하는 방식이다. IPsec ESP, TLS AEAD cipher suite에서 중요하다. Suite 이름에는 mode와 key length가 드러나는 경우가 많다. 예를 들어 `ENCR_AES_CTR`은 AES-128 CTR mode를 의미하고, `PRF_HMAC_SHA1`, `PRF_AES128_CMAC` 같은 이름은 PRF 기반 primitive를 드러낸다.

Cryptographic suite가 따로 정의되는 이유는 protocol machinery와 cryptographic algorithms를 분리해 발전시키기 위해서다. Protocol 자체는 괜찮아도 DES, MD5, SHA-1처럼 algorithm/key length가 시대에 따라 약해질 수 있다. Suite를 “snap in”할 수 있으면 TLS, IKE 같은 protocol은 negotiation 구조를 유지한 채 AES-GCM, ECDH, SHA-2 같은 새 조합으로 옮겨갈 수 있다. 단, 양쪽 endpoint가 같은 suite를 구현해야 하므로 표준화와 deployment에는 시간이 걸린다.

### 18.5 Certificates, Certificate Authorities (CAs), and PKIs

Cryptography primitive만으로는 secure system이 완성되지 않는다. Protocol이 primitive를 안전하게 조합해야 하고, key를 어떻게 만들고, 배포하고, 폐기(revoke)할지 관리해야 한다. Public key cryptosystem의 핵심 운영 문제는 “이 public key가 정말 Alice의 key인가?”다. Mallory가 Alice의 public key를 자기 key로 바꿔치기하면 Bob은 Mallory를 Alice로 믿을 수 있다.

Public key certificate는 identity와 public key의 binding을 digital signature로 묶은 data structure다. 이 binding을 신뢰하는 방식은 크게 두 모델이 있다.

| 모델 | 신뢰 형성 방식 | 장점 | 약점 |
|---|---|---|---|
| web of trust | 여러 endorser가 certificate에 서명 | 중앙 실패점이 작고 grassroots 방식 | 새 identity가 충분한 endorsement를 얻는 데 시간 필요 |
| PKI(Public Key Infrastructure) | CA가 hierarchy로 certificate 발급/폐기/배포 | large-scale browser/TLS 운영에 적합 | root CA/trust anchor에 대한 중앙 신뢰가 큼 |

PKI는 certificate authorities(CAs)를 통해 identity-public key binding을 attest한다. CA hierarchy에서는 leaf certificate가 intermediate CA에 의해 signed되고, intermediate는 root CA 또는 더 높은 parent에 의해 signed된다. Relying party는 이미 신뢰하는 root certificate/trust anchor에서 시작해 certificate chain을 검증한다.

### 18.5.1 Public Key Certificates, Certificate Authorities, and X.509

Internet에서 가장 중요한 certificate 형식은 X.509 version 3 certificate의 Internet profile이다. Certificate file/encoding format은 DER, PEM(Base64-encoded DER), PKCS#7/P7B, PKCS#12/PFX 등이 있다. 원문 예시는 HTTPS server certificate를 `openssl`로 가져와 PEM 형식으로 확인하는 흐름을 보여준다. 암기할 command보다 중요한 것은 certificate가 어떤 정보를 담고, verifier가 무엇을 확인하는지다.

X.509 certificate의 큰 구조는 다음과 같다.

| 구성 | 의미 |
|---|---|
| TBSCertificate | 서명 대상 data: version, serial number, issuer, validity, subject, public key, extensions 등 |
| Signature Algorithm | TBSCertificate에 적용된 signature algorithm identifier |
| Signature Value | issuer private key로 생성한 digital signature |

주요 field는 다음처럼 읽는다.

| field/extension | 의미 |
|---|---|
| Version | X.509 certificate type. Internet profile은 보통 v3 |
| Serial Number | CA가 certificate마다 부여하는 고유 번호 |
| Issuer | certificate를 발급/서명한 CA의 distinguished name |
| Validity | `Not Before`, `Not After`로 표현되는 유효 기간 |
| Subject | certificate가 식별하는 entity |
| Subject Public Key Info | subject의 public key algorithm과 public key |
| Subject Alternative Name(SAN) | DNS name 등 실제 subject name 목록. 현대 TLS에서는 CN보다 중요 |
| Basic Constraints | CA certificate인지 여부와 path constraint |
| Key Usage / Extended Key Usage | digital signature, key encipherment, TLS server/client auth, code signing, IPsec 등 key 사용 가능 범위 |
| CRL Distribution Points(CDP) | CRL을 가져올 URI |
| Authority Information Access(AIA) | OCSP URI, CA issuer certificate URI 등 |

Certificate validation은 leaf에서 root/trust anchor로 올라가는 recursive process다. 한 certificate의 `Issuer`가 parent certificate의 `Subject`와 맞아야 하고, parent public key로 child signature를 검증해야 한다. 모든 certificate가 validity period 안에 있어야 하고, usage/extension이 현재 목적과 맞아야 하며, chain 중 어떤 certificate도 revoked 상태가 아니어야 한다.

`CN(Common Name)`은 과거에 server DNS name 확인에 자주 쓰였지만, 원문도 SAN extension이 DNS name 용도라고 설명한다. 예를 들어 certificate가 `www.digicert.com`, `content.digicert.com` SAN을 포함하면 `digicert.com` 자체 접속에는 name mismatch error가 날 수 있다. 즉 “같은 server”처럼 보여도 certificate identity matching은 certificate 안의 subject name list와 URL hostname의 정확한 match 문제다.

X.509v3 extension은 critical 또는 noncritical이다. Critical extension은 relying party가 반드시 처리하고 policy상 받아들일 수 있어야 한다. 처리하지 못하면 validation failure다. Noncritical extension은 지원하면 처리하고, 지원하지 않아도 반드시 error가 되지는 않는다. `Basic Constraints: CA:FALSE`인 end-entity certificate는 다른 certificate를 sign하는 CA certificate로 쓸 수 없다.

### 18.5.2 Validating and Revoking Certificates

Certificate는 발급 뒤에도 private key compromise, subject/issuer affiliation 변경, name 변경, superseded key 등 여러 이유로 revoke될 수 있다. Revoked certificate는 validity period가 남아 있어도 더 이상 신뢰하면 안 된다. 따라서 path validation에는 “chain 형성”뿐 아니라 “revocation status 확인”이 포함된다.

Revocation 확인 방법은 대표적으로 CRL과 OCSP가 있다.

| 방식 | 동작 | 장점 | 약점 |
|---|---|---|---|
| CRL(Certificate Revocation List) | CA가 revoked certificate serial number list를 signed file로 배포 | untrusted server/channel로 배포 가능, batch 확인 | list가 크고 최신성/다운로드 부담 |
| OCSP(Online Certificate Status Protocol) | client가 특정 certificate status를 OCSP responder에 질의 | 특정 certificate만 빠르게 확인 | online query 필요, responder trust/availability 필요 |
| SCVP | path discovery/validation을 trusted server에 위임 | client 부담과 enterprise policy 일관성 개선 | 널리 쓰이지 않음 |

CRL은 certificate와 비슷하게 CA가 signed한 object다. Validity 대신 `Last Update`, `Next Update`가 있고, revoked certificate serial number, revocation date, reason code를 포함한다. Signed object이므로 CRL 자체는 untrusted channel로 받아도 signature를 검증할 수 있다.

OCSP request는 hash algorithm, issuer name hash, issuer key hash, certificate serial number 등으로 특정 certificate를 식별한다. Response는 status를 `good`, `revoked`, `unknown` 등으로 알려주고 responder가 sign한다. OCSP는 최신 CRL 전체를 다운로드하지 않아도 되지만, client가 certification path를 형성하고 response signature를 검증해야 한다는 부담은 남는다.

SCVP(Server-Based Certificate Validation Protocol)는 client 대신 server가 delegated path discovery(DPD)와 선택적으로 delegated path validation(DPV)을 수행하도록 만든 protocol이다. 특히 enterprise에서는 한 trusted validation server가 공통 policy로 validation을 처리하게 할 수 있다. 원문은 SCVP가 정의되었지만 널리 사용되지는 않는다고 한다.

### 18.5.3 Attribute Certificates

X.509는 public key certificate(PKC) 외에 attribute certificate(AC)도 정의한다. AC는 PKC와 유사한 구조를 갖지만 public key를 포함하지 않는다. 대신 authorization information처럼 identity-public key binding과 별개로 관리하고 싶은 속성을 담는다. 예를 들어 어떤 권한의 lifetime이 PKC보다 훨씬 짧아야 할 때, PKC를 재발급하지 않고 AC를 짧게 발급해 권한을 표현할 수 있다.

### 18.6 TCP/IP Security Protocols and Layering

Security protocol은 TCP/IP stack의 거의 모든 계층에 존재한다. 어느 계층에서 보호하느냐에 따라 보호 범위가 달라진다.

![Figure 18-4](@/assets/images/cs-tcp-ip-illustrated-313-figure-18-4-page-871.png)
*Figure 18-4 · PDF p. 871 · TCP/IP와 OSI stack 주변의 주요 security protocol 배치*

Layer별 의미는 다음과 같다.

| 계층 | 보호 범위 | 대표 protocol |
|---|---|---|
| Link layer | 한 hop/link 내부 frame 보호 | 802.1X/EAPoL, 802.1AE MACSec, 802.11i/WPA2 |
| Network layer | host-to-host 또는 gateway-to-gateway IP packet 보호 | IPsec ESP/AH |
| Transport layer | process-to-process channel 보호 | TLS, DTLS |
| Application layer | application data/object/protocol semantic 보호 | DNSSEC, DKIM, SSH, Kerberos, EAP, RADIUS/Diameter |

Figure 18-4의 중요한 교훈은 “보안 protocol 하나가 모든 threat를 해결하지 않는다”는 점이다. Link-layer security는 access network hop을 보호하지만 Internet 전체 path를 보호하지 않는다. IPsec은 IP packet을 보호하지만 application identity나 DNS record 자체의 authenticity 문제를 모두 해결하지는 않는다. TLS는 application transport channel을 보호하지만 DNS answer의 원천적 authenticity는 DNSSEC 영역이다.

### 18.7 Network Access Control: 802.1X, 802.1AE, EAP, and PANA

Network Access Control(NAC)은 특정 system/user에게 network communication을 허용하거나 거부하는 방법이다. 802.1X Port-Based Network Access Control(PNAC)은 wired/wireless enterprise LAN에서 널리 쓰이며, network attachment point 기준으로 system/user를 authenticate한 뒤 access를 부여한다. EAP(Extensible Authentication Protocol)는 802.1X와 함께 쓰이는 authentication framework이고, 802.1X는 흔히 EAP over LAN(EAPoL)이라고도 불린다.

802.1X에서 주요 역할은 다음과 같다.

| 역할 | EAP/802.1X 용어 | 기능 |
|---|---|---|
| 접속하려는 host | supplicant / peer | credential을 제시하고 network access를 요청 |
| switch/AP 등 접속 지점 | authenticator | peer와 AAA server 사이를 중계하거나 일부 EAP 처리 |
| backend 인증 서버 | AAA server / authentication server | authentication, authorization, accounting 판단 |
| enforcement mechanism | VLAN, port control, MACSec 등 | 인증 결과에 따라 protected/remediation/guest network 배치 |

![Figure 18-5](@/assets/images/cs-tcp-ip-illustrated-314-figure-18-5-page-873.png)
*Figure 18-5 · PDF p. 873 · supplicant, authenticator, AAA server가 분리된 EAP/802.1X enterprise access 구조*

Figure 18-5의 pass-through authenticator는 많은 EAP method를 직접 구현하지 않고 EAP packet을 RADIUS 또는 Diameter 같은 AAA protocol에 실어 backend AAA server로 전달한다. 인증에 성공하면 authenticator는 port/VLAN mapping을 바꾸어 peer를 protected VLAN으로 넣거나, router를 통해 protected VLAN에 접근하게 한다. 인증 전에는 remediation/guest VLAN에만 두는 식으로 network access를 제한할 수 있다.

EAP 자체는 encryption protocol이 아니다. EAP는 authentication framework이고, 실제 보안성은 EAP method와 함께 쓰이는 lower-layer/link-layer protection에 달려 있다. WPA2/802.11i, 802.1AE MACSec처럼 link-layer encryption과 결합하면 더 안전하다. EAP method가 약하거나 lower layer가 보호되지 않으면 credential exchange가 위험해질 수 있다.

EAP packet format은 간단하다.

![Figure 18-6](@/assets/images/cs-tcp-ip-illustrated-315-figure-18-6-page-874.png)
*Figure 18-6 · PDF p. 874 · Code, Identifier, Length, Data로 구성된 EAP header*

| field | 의미 |
|---|---|
| Code | Request, Response, Success, Failure, Initiate, Finish 등 packet type |
| Identifier | Request와 Response matching |
| Length | EAP message 전체 길이 |
| Data | Request/Response의 경우 첫 byte가 Type field |

Typical EAP exchange는 `Request -> Response -> 추가 Request/Response 반복 -> Success/Failure` 흐름이다. Request/Response의 Type field는 Identity, Notification, Nak, Expanded Type, 또는 구체적인 authentication method를 가리킨다. Peer가 요청된 method를 지원하지 않으면 Nak로 자신이 지원하는 method를 알려줄 수 있다.

EAP architecture는 lower layer, EAP layer, peer/authenticator layer, EAP methods layer로 나뉜다. EAP lower layer는 802.1X, 802.11i, UDP/L2TP, UDP/IKEv2, TCP 같은 운반 매체일 수 있다. EAP method는 TLS certificate exchange처럼 큰 message를 다룰 수 있으므로 method 자체가 fragmentation/large message handling을 담당해야 할 수 있다.

![Figure 18.8](@/assets/images/cs-tcp-ip-illustrated-317-figure-18-8-page-876.png)
*Figure 18.8 · PDF p. 876 · pass-through authenticator에서 EAP method는 peer와 AAA server가 주로 처리하는 implementation model*

### 18.7.1 EAP Methods and Key Derivation

EAP method는 50개 이상 존재하며, TTLS, EAP-TLS, EAP-FAST, LEAP, PEAP, EAP-IKEv2, MD5 등이 언급된다. MD5는 오래되었고 더 이상 권장되지 않는다. 어떤 method는 client certificate가 있는 PKI를 요구하고(EAP-TLS), 어떤 method는 server-side certificate와 password/tunnel 조합으로 client PKI 부담을 줄인다(PEAP, TTLS). 따라서 EAP 선택은 security뿐 아니라 운영 환경, device capability, credential model의 문제다.

일부 EAP method는 authentication뿐 아니라 key derivation도 제공한다. 이 경우 peer와 EAP server는 mutual authentication을 수행하고 key hierarchy를 export한다.

| key | 의미 |
|---|---|
| MSK(Master Session Key, AAA-key) | lower layer/authenticator가 transient session key를 만들 때 사용 |
| EMSK(Extended MSK) | pass-through authenticator에는 노출되지 않고 peer/EAP server만 사용 |
| TSK(Transient Session Key) | peer와 authenticator 사이 access control/encryption에 사용 |
| USRK/DSRK/DSUSRK | usage/domain-specific root key 계열 |

MSK와 EMSK, peer/server identifiers, session ID가 lower layers에 제공되며, key lifetime이 지나면 re-authentication이 필요하다. 원문은 8 hours가 권장 lifetime으로 언급된다고 설명한다.

### 18.7.2 The EAP Re-authentication Protocol (ERP)

ERP(EAP Re-authentication Protocol)는 mobile node가 access point를 옮기는 등 재인증이 필요할 때 full EAP exchange latency를 줄이기 위한 mechanism이다. 처음에는 full EAP exchange를 수행하고, 이후 rRK(re-authentication root key)와 rIK(re-authentication integrity key)를 사용해 1 RTT로 re-authentication을 수행한다. Home domain과 다른 domain에서는 DS-rRK, DS-rIK 같은 domain-specific keys를 사용한다.

### 18.7.3 Protocol for Carrying Authentication for Network Access (PANA)

PANA(Protocol for Carrying Authentication for Network Access)는 EAP를 특정 link-layer에 묶지 않고 UDP/IP 위에서 운반하기 위한 protocol이다. 802.1X는 IEEE 802 network 중심이고 PPP는 point-to-point model에 가깝지만, PANA는 UDP port 716을 사용해 다양한 link technology에서 EAP authentication method를 적용할 수 있게 한다.

PANA entity는 PaC(PANA Client), PAA(PANA Authentication Agent), PRE(PANA Relay Element)를 포함하며, 일반적으로 AS(Authentication Server)와 EP(Enforcement Point)도 함께 등장한다. PAA는 PaC의 authentication material을 AS로 전달하고, access 승인/철회에 따라 EP를 설정한다. PaC는 EAP peer와 colocated되고, PAA는 EAP authenticator와 colocated된다.

PANA session은 authentication/authorization, access, re-authentication, termination phase로 나뉜다. PANA message는 UDP/IP datagram에 실리고 32-bit session identifier와 32-bit sequence number를 사용한다. Stop-and-wait 방식, time-based retransmission, exponential backoff를 제공하지만 adaptive retransmission timer나 repacketization은 없으므로 원문은 weak transport protocol에 가깝다고 설명한다.

### 18.8 Layer 3 IP Security (IPsec)

IPsec은 IPv4/IPv6 network layer에서 data source authentication, integrity, confidentiality, access control을 제공하는 architecture와 standards collection이다. Remote access VPN, site-to-site enterprise interconnection, routing protocol 보호, Mobile IPv6 보호 등에 쓰인다. IPsec endpoint는 host일 수도 있고 protected/unprotected network 경계에 있는 security gateway(SG)일 수도 있다.

![Figure 18-9](@/assets/images/cs-tcp-ip-illustrated-319-figure-18-9-page-880.png)
*Figure 18-9 · PDF p. 880 · IPsec이 host-to-host, host-to-gateway, gateway-to-gateway, multicast/mobility에 적용되는 배치*

IPsec 처리의 큰 흐름은 두 단계다.

1. Establishment phase: key material을 교환하고 SA(Security Association)를 만든다.
2. Data exchange phase: AH(Authentication Header) 또는 ESP(Encapsulating Security Payload)를 transport mode/tunnel mode로 적용해 IP datagram flow를 보호한다.

IPsec implementation은 packet마다 policy를 보고 선택적으로 동작한다. 모든 packet이 자동으로 암호화되는 것이 아니다. 핵심 database는 SPD, SAD, PAD다.

![Figure 18-10](@/assets/images/cs-tcp-ip-illustrated-320-figure-18-10-page-881.png)
*Figure 18-10 · PDF p. 881 · security gateway에서 SPD/SAD/PAD가 packet을 bypass, discard, protect로 분류하는 구조*

| database | 역할 |
|---|---|
| SPD(Security Policy Database) | traffic selector를 기준으로 BYPASS, DISCARD, PROTECT policy 결정 |
| SAD(Security Association Database) | 이미 만들어진 SA의 SPI, algorithm, key, sequence state 등 저장 |
| PAD(Peer Authorization Database) | 어떤 peer가 어떤 SA/policy를 가질 수 있는지 authorization 판단 |

Manual keying은 가능하지만 scale이 작고 오류가 많으므로 일반적으로 automated key establishment protocol이 필요하다. IPsec에서는 이 역할을 IKEv2가 맡는다.

### 18.8.1 Internet Key Exchange (IKEv2) Protocol

SA(Security Association)는 한 방향(simplex)의 authenticated association이다. Bidirectional IPsec 통신에는 보통 SA pair가 필요하다. IKEv2는 먼저 IKE 자신을 보호하는 `IKE_SA`를 만들고, 그 위에서 AH 또는 ESP data traffic을 보호할 `CHILD_SA`를 만든다.

IKEv2 exchange는 initiator와 responder 사이의 request/response message pair로 진행된다.

| exchange | 목적 |
|---|---|
| IKE_SA_INIT | cryptographic suite negotiation, nonce exchange, DH key agreement |
| IKE_AUTH | peer identity validation, first CHILD_SA setup |
| CREATE_CHILD_SA | additional CHILD_SA 생성 또는 rekey |
| INFORMATIONAL | SA delete, status/error/configuration 정보 전달 |

IKE는 UDP port 500 또는 NAT traversal 시 UDP port 4500을 사용한다. Port 4500의 IKE message는 ESP/WESP와 구분하기 위해 initial 4 data bytes가 0인 non-ESP marker를 갖는다. IKE는 message loss에 대해 timer-based retransmission을 수행하고, request/response matching과 replay detection에 Message ID를 사용한다.

### 18.8.1.1 IKEv2 Message Formats

IKE message는 IKE header와 zero or more payloads로 구성된다.

![Figure 18-11](@/assets/images/cs-tcp-ip-illustrated-321-figure-18-11-page-883.png)
*Figure 18-11 · PDF p. 883 · 64-bit SPI pair, Exchange Type, Flags, Message ID를 포함한 IKEv2 header*

IKE header에서 SPI(Security Parameter Index)는 IKE_SA를 식별한다. IKE는 64-bit SPI를 사용하고, AH/ESP는 뒤에서 32-bit SPI를 사용한다. Initiator SPI와 responder SPI, endpoint IP addresses의 조합은 effective connection identifier처럼 동작한다. `Exchange Type`은 IKE_SA_INIT, IKE_AUTH, CREATE_CHILD_SA, INFORMATIONAL 등을 나타낸다. `Flags`의 I bit는 original initiator, R bit는 response, V bit는 higher major version support를 나타낸다.

Message ID는 TCP sequence number와 비슷하지만 message 단위 request/response matching과 replay detection에 쓰인다. Response는 request와 같은 Message ID를 사용하고, old Message ID는 처리되지 않는다. Wrapping이 생기면 IKE_SA_INIT을 다시 시작해야 한다.

각 payload는 generic payload header를 갖고, `Next Payload`와 `Payload Length`가 payload chain을 만든다. Critical bit가 set된 payload type을 receiver가 이해하지 못하면 exchange를 abort해야 한다. 이 구조는 새 payload type 확장을 가능하게 하지만, critical payload 처리 실패는 negotiation failure로 이어진다.

### 18.8.1.2 The IKE_SA_INIT Exchange

IKE initial exchanges는 IKE_SA_INIT과 IKE_AUTH 두 exchange, 총 네 message로 구성된다. IKE_SA_INIT은 cryptographic suite를 고르고 nonce를 교환하며 DH key agreement를 수행한다.

![Figure 18-13](@/assets/images/cs-tcp-ip-illustrated-323-figure-18-13-page-886.png)
*Figure 18-13 · PDF p. 886 · IKE_SA_INIT과 IKE_AUTH가 IKE_SA와 첫 CHILD_SA를 만드는 payload 흐름*

IKE_SA_INIT에서 initiator는 `SAi1`, `KEi`, `Ni`를 보낸다. Responder는 acceptable suite를 고른 `SAr1`, `KEr`, `Nr`, 그리고 필요하면 `CERTREQ`를 보낸다. 이 시점에 양쪽은 DH shared secret과 nonce를 사용해 IKE_SA key material을 계산할 수 있다.

### 18.8.1.3 Security Association (SA) Payloads and Proposals

SA payload는 SPI와 proposal set을 담는다. Proposal은 IKE, AH, ESP 중 어떤 protocol에 대해 어떤 transform을 쓸지 설명한다. 같은 proposal number의 여러 protocol structure는 AND 관계이고, 다른 proposal number는 OR 관계다.

| protocol | 보통 필요한 transform |
|---|---|
| IKE | encryption, PRF, integrity, DH group |
| AH | integrity check algorithm |
| ESP | encryption, optional integrity, optional ESN |

Transform type이 같으면 여러 후보 중 하나를 고르는 union, type이 다르면 모두 만족해야 하는 intersection처럼 이해하면 된다. AES처럼 key length attribute가 필요한 transform도 있다.

### 18.8.1.4 Key Exchange (KE) and Nonce (Ni, Nr) Payloads

KE payload는 DH group number와 public DH value를 담고, Nonce payload `Ni`, `Nr`는 16-256 bytes의 fresh nonce를 담는다. 이 값들은 freshness와 replay protection, key generation에 들어간다.

IKE_SA_INIT 뒤 key derivation은 원문 식으로 요약된다.

```text
SKEYSEED = prf(Ni | Nr, g^ir)

{SK_d | SK_ai | SK_ar | SK_ei | SK_er | SK_pi | SK_pr}
  = prf+(SKEYSEED, Ni | Nr | SPIi | SPIr)
```

`SK_d`는 CHILD_SA key derivation에 쓰이고, `SK_a*`는 authentication/integrity, `SK_e*`는 encryption, `SK_p*`는 IKE_AUTH의 AUTH payload 생성에 쓰인다. Initiator/responder 방향별로 key가 따로 나뉘는 이유는 양방향 SA와 replay/integrity state를 분리하기 위해서다.

### 18.8.1.5 Notification (N), Configuration (CP), Algorithm Selection

Notify payload(N)는 error와 capability indication을 전달한다. 예를 들어 `USE_TRANSPORT_MODE`, `IPCOMP_SUPPORTED`, `USE_WESP_MODE` 같은 status가 들어갈 수 있다. Configuration payload(CP)는 VPN client가 IPv4/IPv6 address, subnet mask, DNS server 같은 configuration을 얻는 데 쓰일 수 있으며, DHCP와 일부 역할이 겹친다.

IKE transform type은 encryption(type 1), PRF(type 2), integrity(type 3), DH group(type 4)로 나뉜다. Baseline mandatory/recommended algorithm은 interoperability를 위해 정해져 있지만, 실제 deployment에서는 registry와 policy에 따라 여러 suite가 공존한다.

### 18.8.1.7 The IKE_AUTH Exchange

IKE_AUTH는 IKE_SA_INIT에서 얻은 `SK_e`, `SK_a`로 payload를 encrypted/integrity-protected한 상태에서 peer identity를 검증하고 첫 CHILD_SA를 만든다. 표기 `SK{...}`는 내부 payload들이 암호화되고 integrity-protected된다는 뜻이다.

Initiator는 보통 `SK{IDi, AUTH, SAi2, TSi, TSr}`를 보내고, responder는 `SK{IDr, AUTH, SAr2, TSi, TSr}`로 응답한다. 필요하면 CERT/CERTREQ도 포함된다. CERT가 있으면 AUTH 검증에 필요한 public key certificate가 먼저 나타나야 한다. MITM 방지를 위해 양쪽은 certificate chain과 AUTH payload 검증을 빠뜨리면 안 된다.

### 18.8.1.8 Traffic Selectors and TS Payloads

Traffic selectors(TS)는 어떤 IP datagram이 IPsec processing 대상인지 정의한다. IPv4/IPv6 address range, port range, protocol ID/header value 등이 들어간다. SPD는 TS를 보고 protect/bypass/discard를 결정하고, IKE_AUTH에서 양쪽이 `TSi`, `TSr`를 제안한다. 한쪽 range가 더 작으면 narrowing을 통해 더 작은 공통 범위를 선택할 수 있다.

### 18.8.1.9 EAP and IKE

IKE는 pre-shared key와 public key certificate 기반 authentication 외에도 EAP를 사용할 수 있다. Initiator가 IKE_AUTH message 3에서 `IDi`는 보내지만 첫 `AUTH` payload를 생략하면, responder는 EAP payload를 반환해 EAP-based authentication을 시작할 수 있다. EAP가 완료된 뒤 responder가 `SAr2`, `TSi`, `TSr`를 보내 first CHILD_SA를 마무리한다. EAP는 IPsec deployment에서 credential option을 넓혀주지만, older EAP method의 one-way authentication 때문에 certificate-based responder authentication이 함께 요구되는 등 double authentication overhead가 생길 수 있다.

EAP-only authentication은 `EAP_ONLY_AUTHENTICATION` Notify payload를 통해 responder의 AUTH/CERT payload를 생략하게 할 수 있다. 단, 이 방식은 mutual authentication, key generation, dictionary attack resistance를 제공하는 safe EAP methods에 의존한다. BTNS(Better-than-Nothing Security)는 unauthenticated IPsec에 가까운 접근으로, certificate chain/root validation 없이 public key continuity만 확인한다. 즉 “같은 entity가 계속 통신 중”이라는 continuity of association은 제공하지만, 그 entity가 누구인지 강하게 검증하지는 못한다.

### 18.8.1.11 CREATE_CHILD_SA, INFORMATIONAL, MOBIKE

`CREATE_CHILD_SA` exchange는 initial exchange 이후 ESP/AH용 CHILD_SA를 새로 만들거나 rekey하는 데 쓰인다. CHILD_SA rekey는 새 SA를 먼저 만든 뒤 old SA를 INFORMATIONAL exchange의 Delete payload로 삭제하는 식으로 진행된다. IKE_SA rekey에서는 KE payload가 필수이고 traffic selector는 쓰지 않는다.

`INFORMATIONAL` exchange는 Notify, Delete, Configuration payload를 사용해 status/error/configuration 정보를 전달하고 SA를 삭제한다. Empty IKE response라도 반드시 응답해야 initiator가 불필요하게 retransmit하지 않는다. MOBIKE는 IKE_SA가 유지된 상태에서 mobility나 interface failure로 IP address가 바뀌었을 때 address change option을 INFORMATIONAL exchange에 추가해 SA를 계속 사용할 수 있게 한다.

### 18.8.2 Authentication Header (AH)

AH(Authentication Header)는 IP datagram에 origin authentication과 integrity를 제공하지만 confidentiality는 제공하지 않는다. NAT와 잘 맞지 않고 encryption을 제공하지 않기 때문에 ESP보다 훨씬 덜 사용된다.

Transport mode AH는 IP header와 TCP/UDP/ICMP 같은 next protocol header 사이에 AH를 넣는다. IPv4에서는 protocol number 51을 사용하고, IPv6에서는 extension header chain 안에 AH가 들어간다.

![Figure 18-16](@/assets/images/cs-tcp-ip-illustrated-326-figure-18-16-page-894.png)
*Figure 18-16 · PDF p. 894 · IPv4/IPv6 transport mode AH가 immutable 부분을 integrity-protect하는 구조*

AH가 어려운 이유는 IP header에 mutable field와 immutable field가 섞여 있기 때문이다. TTL/Hop Limit, DS Field, ECN bits, Flow Label처럼 transit 중 변할 수 있는 field는 integrity calculation에서 특별히 처리하거나 제외해야 한다. Source/destination IP address처럼 immutable로 간주되는 field는 integrity-protected된다. 이 때문에 NAT가 address를 바꾸면 AH verification이 깨질 수 있다.

Tunnel mode AH는 original IP datagram을 inner datagram으로 보존하고, 새 outer IP header와 AH를 붙인다. Inner datagram 전체와 outer header의 일부 immutable field가 보호된다. Transport mode는 end host 사이, tunnel mode는 security gateway-to-gateway 또는 host-to-gateway VPN에서 자주 대응된다.

AH header는 transport/tunnel mode에서 동일하다.

![Figure 18-18](@/assets/images/cs-tcp-ip-illustrated-328-figure-18-18-page-897.png)
*Figure 18-18 · PDF p. 897 · AH header의 SPI, Sequence Number, ICV 필드와 replay/integrity 역할*

| AH field | 의미 |
|---|---|
| Next Header | AH 뒤에 오는 protocol/header type |
| Payload Length | AH 길이 |
| SPI(Security Parameters Index) | receiver의 SA 식별자 |
| Sequence Number | anti-replay protection용 증가 counter |
| ICV(Integrity Check Value) | immutable/predictable field와 payload에 대한 MAC류 integrity check |

Sequence Number는 sender가 항상 넣고 receiver가 anti-replay를 켜면 검증한다. ESN(Extended Sequence Number)을 사용하면 실제 계산은 64-bit sequence number를 쓰되 lower 32 bits만 packet에 싣는다. ICV는 selected integrity algorithm에 따라 길이가 달라진다.

### 18.8.3 Encapsulating Security Payload (ESP)

ESP는 confidentiality, integrity, origin authentication, anti-replay protection을 selectable combination으로 제공한다. NULL encryption을 쓰면 ESP-NULL로 integrity-only mode가 되며, encryption만 있고 integrity가 없는 조합은 passive attack만 막고 active modification에는 약해 권장되지 않는다. 실제 deployment에서는 AH보다 ESP가 훨씬 더 흔하다.

ESP transport mode는 original IP header는 남겨두고 transport payload(TCP/UDP/ICMP 등)를 ESP로 보호한다. ESP tunnel mode는 original IP datagram 전체를 inner packet으로 넣고 새 outer IP datagram을 만든다. Tunnel mode ESP는 inner source/destination과 payload를 숨길 수 있어 제한적인 traffic flow confidentiality(TFC)도 제공한다.

![Figure 18-20](@/assets/images/cs-tcp-ip-illustrated-330-figure-18-20-page-900.png)
*Figure 18-20 · PDF p. 900 · ESP tunnel mode가 original datagram을 새 outer datagram 안에 넣어 보호하는 구조*

ESP packet structure는 header와 trailer를 함께 봐야 한다.

![Figure 18-21](@/assets/images/cs-tcp-ip-illustrated-331-figure-18-21-page-901.png)
*Figure 18-21 · PDF p. 901 · ESP header, encrypted payload/trailer, optional ICV trailer의 구조*

| ESP component | 보호/역할 |
|---|---|
| SPI + Sequence Number | ESP header, SA 식별과 anti-replay에 사용 |
| Payload Data | 선택적으로 encrypted, IV가 앞에 올 수 있음 |
| Pad / Pad Length / Next Header | ESP trailer, alignment와 carried protocol 표시 |
| ESP ICV | integrity가 enable된 경우 header/payload/trailer에 대한 check value |

ESP는 IPv4 Protocol 또는 IPv6 Next Header 값 50을 사용한다. Payload는 32-bit boundary, IPv6에서는 64-bit boundary 정렬을 맞춰야 한다. `Next Header=59`는 no next header를 의미하며 dummy packet에 쓸 수 있다. TFC padding과 dummy packets는 traffic analysis 저항을 돕지만 널리 쓰이지는 않는다.

ESP anti-replay는 integrity protection이 enabled일 때 sequence number window로 수행된다. Sender는 counter wrap 직전 새 SA를 만들어야 하고, receiver는 valid anti-replay window 밖의 packet을 drop한다. Auditing system은 valid SA 없음, fragment input, anti-replay counter wrap 위험, out-of-window packet, integrity failure 같은 event를 기록할 수 있다.

### 18.8.3.2 ESP-NULL, WESP, and Traffic Visibility

ESP-NULL은 encryption 없이 ESP integrity/authentication만 사용하는 mode다. Enterprise packet inspection 장비가 malware signature나 policy violation을 보기 위해 traffic visibility가 필요한 경우 ESP encryption은 운영 장비를 blind하게 만든다. ESP-NULL을 쓰면 confidentiality는 다른 계층에 맡기고 network inspection을 유지할 수 있다.

문제는 middlebox가 ESP packet만 보고 encrypted ESP인지 ESP-NULL인지 알기 어렵다는 점이다. WESP(Wrapped ESP)는 ESP 앞에 별도 header를 붙이고 protocol number 141을 사용해 ESP-NULL 여부 같은 traffic visibility 정보를 표시한다. IKE에서는 `USE_WESP_MODE` Notify payload로 협상할 수 있다. 다만 WESP는 endpoint가 제대로 사용해야 효과가 있다.

### 18.8.4 Multicast

IPsec은 multicast도 선택적으로 지원하지만 흔하지 않다. Group key management(GKM) protocol과 group controller/key server(GCKS)가 group security associations(GSAs)를 만들고 관리한다. Multicast group member가 join/leave할 때 rekeying이 더 자주 필요하므로 two-party IKE보다 운영이 복잡하다.

Tunnel mode multicast에서는 outer destination address가 multicast address여야 multicast routing이 동작한다. 이를 위해 tunnel mode with address preservation을 사용해 inner/outer source/destination을 보존한다. Reverse Path Forwarding(RPF) check가 올바르게 작동하게 하려는 목적도 있다. 이 경우 SPD/SAD/PAD에도 address preservation flag, directionality flag, GPAD(group PAD) 같은 확장이 필요하다.

### 18.8.5 L2TP/IPsec

L2TP는 layer 2 traffic(PPP 등)을 IP/non-IP network 위로 tunnel하지만, 자체적으로 per-packet authentication, integrity, confidentiality를 충분히 제공하지 않는다. L2TP/IPsec은 L2TP tunnel을 ESP SA로 보호해 remote layer 2 VPN access를 제공한다. 일반적으로 machine authentication(IPsec pre-shared key 또는 certificate)과 user authentication(L2TP/PPP credential)이 모두 필요할 수 있다.

### 18.8.6 IPsec NAT Traversal

NAT는 IP address와 port를 바꾸므로 IPsec과 충돌하기 쉽다. 특히 AH는 immutable IP address를 integrity-protect하므로 NAT rewriting과 맞지 않는다. ESP는 outer IP header 변경을 허용할 수 있어 NAT traversal과 더 잘 맞지만, IKE와 ESP packet이 NAT device를 지나며 endpoint identification과 port mapping 문제를 해결해야 한다. 원문은 NAT를 고려하면 AH/ESP, transport/tunnel mode의 모든 조합이 모든 application과 함께 쓸 수 있는 것은 아니라고 강조하며, 다음 예시 구간에서 UDP encapsulation과 trace를 이어서 보여준다.

NAT와 IPsec의 충돌은 한 가지가 아니라 여러 계층에서 동시에 생긴다.

| 충돌 지점 | 왜 문제가 되는가 | 결과 |
|---|---|---|
| AH와 IP address rewriting | AH MAC 계산에 IP address가 포함된다 | NAT가 address를 바꾸면 AH validation failure |
| TCP/UDP pseudo-header checksum | checksum 계산에 IP address가 포함된다 | integrity-protected/encrypted transport checksum을 NAT가 고칠 수 없음 |
| IKE ID payload | peer identity로 IP address를 쓰면 encrypted payload 안에 들어간다 | NAT가 encrypted ID를 수정하지 못해 identity mismatch 가능 |
| ESP/AH demultiplexing | TCP/UDP port 대신 SPI를 쓴다 | NAT/NAPT가 return traffic을 어느 내부 host로 보낼지 모호해질 수 있음 |
| Application payload address | SIP처럼 payload 안에 IP address를 싣는 protocol | encrypted/integrity-protected payload는 NAT helper가 고칠 수 없음 |

따라서 표준적인 NAT traversal 해법은 AH를 억지로 통과시키는 것이 아니라, IKE와 ESP를 UDP/IP로 encapsulate해서 NAT가 다룰 수 있는 형태로 만드는 것이다. AH에 대해서는 일반적인 NAT traversal 해법이 없다. IKE는 UDP port 500 또는 4500으로 시작할 수 있고, NAT가 감지되면 UDP port 4500에서 IKE 및 UDP-encapsulated ESP를 계속 사용한다. UDP port 4500은 일부 NAT가 port 500의 IPsec traffic을 특수 처리하는 문제를 피하려는 목적도 있다.

NAT 지원 IKEv2 구현은 `IKE_SA_INIT` exchange에 `NAT_DETECTION_SOURCE_IP`와 `NAT_DETECTION_DESTINATION_IP` Notify payload를 넣을 수 있다. 이 값은 SA의 SPI, source/destination IP address, source/destination port number를 SHA-1 hash로 요약한 것이다. 송신자와 수신자가 계산한 hash가 다르면 중간 NAT가 address 또는 port를 바꾼 것으로 판단한다.

Transport mode SA를 만들 때 NAT 뒤의 private address가 `TSi`/`TSr` traffic selector에 들어 있으면 responder 입장에서는 실제 도착 datagram의 source/destination address와 맞지 않는다. IKEv2는 이를 위해 먼저 TS payload의 address를 보관한 뒤, 수신 datagram의 address로 대체해 SPD(Security Policy Database)를 조회하는 delayed NAT 형태의 처리를 수행한다.

### 18.8.7 IPsec Example: IKE_SA_INIT

예시는 Linux StrongSwan server `10.0.0.3`과 Windows 7 client `10.0.1.48` 사이에서 RSA machine certificate로 IKEv2/IPsec VPN을 설정하는 trace다. Wireshark는 IKE를 역사적 이름인 ISAKMP로 표시한다.

첫 packet은 `IKE_SA_INIT` request다. Initiator SPI가 있고 responder SPI는 아직 0이며, exchange type은 `IKE_SA_INIT`이다. Payload는 SA, KE, Nonce, 두 개의 Notify payload로 구성된다. SA payload에는 initiator가 받아들일 수 있는 cryptographic suite proposal들이 들어가고, 각 proposal은 encryption, integrity protection, PRF, DH group transform 조합을 제안한다.

![Figure 18-22](@/assets/images/cs-tcp-ip-illustrated-332-figure-18-22-page-907.png)
*Figure 18-22 · PDF p. 907 · 첫 IKE_SA_INIT packet의 SA proposal, DH key exchange, nonce, NAT detection Notify payload*

확장된 proposal 예시는 AES-CBC 256-bit encryption, HMAC-SHA-256 integrity, SHA-384 기반 PRF, alternate 1024-bit MODP group DH를 제안한다. 뒤따르는 KE payload는 해당 DH group의 public value를 싣고, Nonce는 freshness를 위한 random bit string을 싣는다. `NAT_DETECTION_SOURCE_IP`와 `NAT_DETECTION_DESTINATION_IP`는 각각 SPI와 IP/UDP port 값을 넣은 SHA-1 hash로 NAT 존재 여부를 판별한다.

Responder의 `IKE_SA_INIT` response는 하나의 proposal을 선택한다. 예시에서는 3DES encryption, `HMAC_SHA1_96` integrity, `HMAC_SHA1` PRF, DH group 2 조합이 선택된다. 여기에 responder의 DH public value, nonce, NAT detection payload, `CERTREQ`, `MULTIPLE_AUTH_SUPPORTED` Notify payload가 붙는다.

![Figure 18-23](@/assets/images/cs-tcp-ip-illustrated-333-figure-18-23-page-909.png)
*Figure 18-23 · PDF p. 909 · responder의 IKE_SA_INIT response와 CERTREQ, multiple authentication 지원 표시*

`CERTREQ` payload는 responder가 나중에 initiator에게 어떤 CA와 연결된 certificate를 기대하는지 알려준다. 예시의 encoding type 4는 trusted CA의 X.509 Subject Public Key Info에 대한 SHA-1 hash 목록을 의미한다. 이 trace에서는 20-byte 값 하나이므로 단일 CA만 지정한 것이다. DER(Distinguished Encoding Rules)는 ASN.1 BER의 제한된 subset으로, 값을 하나의 모호하지 않은 binary encoding으로 표현한다. PEM은 ASCII 기반 encoding이며, X.509 certificate는 DER/PEM 사이 변환이 흔하다.

### 18.8.7.1 IKE_AUTH, CHILD_SA, and Traffic Selectors

이후 `IKE_AUTH` message는 UDP port 4500으로 이동하고 encrypted/authenticated payload 안에 담긴다. UDP encapsulation에서는 4-byte zero `non-ESP marker`를 사용해 같은 port 4500 traffic 중 IKE와 ESP를 구분한다.

첫 `IKE_AUTH` request는 UDP/IPv4 fragmentation 후 reassembly된 message다. Payload에는 `IDi`, `CERT`, `CERTREQ`, `AUTH`, `N(MOBIKE_SUPP)`, `CP`, `SA`, `TSi`, `TSr`가 들어 있다.

![Figure 18-24](@/assets/images/cs-tcp-ip-illustrated-334-figure-18-24-page-911.png)
*Figure 18-24 · PDF p. 911 · UDP 4500에서 reassembled/decrypted된 IKE_AUTH request payload 구성*

각 payload의 의미는 다음과 같다.

| IKE_AUTH payload | 역할 |
|---|---|
| `IDi` | initiator identity, 예시에서는 `test client` |
| `CERT` | initiator certificate, Test CA가 서명 |
| `CERTREQ` | client가 신뢰하거나 요청하는 CA 목록 |
| `AUTH` | initiator RSA private key로 만든 signature 기반 origin authentication |
| `N(MOBIKE_SUPPORTED)` | address/interface 변화에도 SA를 유지할 수 있음을 표시 |
| `CP(CFG_REQUEST)` | VPN 설정용 내부 IP/DNS/NBNS 등 configuration 요청 |
| `SA` | ESP CHILD_SA를 만들기 위한 proposal |
| `TSi`, `TSr` | SA에 허용될 initiator/responder traffic selector 범위 |

이 request의 SA payload는 ESP용 CHILD_SA proposal이다. ESP SPI는 32-bit이고, IKE SA SPI는 64-bit라는 차이가 있다. 예시 proposal은 `AUTH_HMAC_SHA1_96` integrity와 no ESN을 사용하며, encryption은 `ENCR_AES_CBC` 256-bit 또는 `ENCR_3DES`를 제안한다. `N(USE_TRANSPORT_MODE)`가 없으므로 default인 tunnel mode ESP로 해석한다.

`TSi`와 `TSr`는 IPv4/IPv6 address range와 port range를 담는다. Initiator request에서는 넓은 전체 범위를 제안할 수 있고, responder는 policy에 맞춰 이를 좁힌다(narrowing).

Responder의 `IKE_AUTH` response는 `IDr`, `CERT`, `AUTH`, `CP(CFG_REPLY)`, `SA`, `TSi`, `TSr`, `N(AUTH_LIFETIME)`, `N(MOBIKE_SUPPORTED)`, `N(NO_ADDITIONAL_ADDRESSES)`를 포함한다.

![Figure 18-25](@/assets/images/cs-tcp-ip-illustrated-335-figure-18-25-page-913.png)
*Figure 18-25 · PDF p. 913 · IKE_AUTH response가 responder identity, certificate, configuration, narrowed traffic selectors를 반환하는 흐름*

`CP(CFG_REPLY)`는 VPN client에게 줄 `INTERNAL_IP4_ADDRESS` 같은 설정 값을 제공한다. Responder가 고른 CHILD_SA proposal은 AES-CBC 256-bit, `AUTH_HMAC_SHA1_96`, no ESN 조합이다. Traffic selector narrowing 예시에서는 `TSi`가 단일 IPv4 address `10.100.0.1`로, `TSr`가 `10.0.0.0/16`으로 줄어든다. 여러 불연속 subset이 가능하면 `N(ADDITIONAL_TS_POSSIBLE)`로 추가 selector 가능성을 알릴 수 있다.

이 exchange가 끝나면 tunnel mode ESP CHILD_SA가 만들어져 data traffic을 운반할 수 있다. `N(AUTH_LIFETIME)`은 authentication의 최대 유효 시간(예: 10,154s)을 알리고, MOBIKE 관련 Notify payload는 추가 address 사용 여부를 조율한다.

### 18.8.7.2 Deleting CHILD_SA and IKE_SA

SA 해제는 INFORMATIONAL exchange와 Delete payload로 수행된다. 먼저 ESP CHILD_SA를 지울 때는 IKE SA 위에 encrypted/authenticated Delete payload를 싣는다. Delete payload는 여러 SPI를 한 번에 삭제할 수 있지만, 예시에서는 SPI `0x6cfca5ef` 하나만 삭제한다.

![Figure 18-26](@/assets/images/cs-tcp-ip-illustrated-336-figure-18-26-page-914.png)
*Figure 18-26 · PDF p. 914 · ESP CHILD_SA 삭제 요청이 IKE SA 위의 encrypted Delete payload로 전달되는 예*

Responder의 응답도 유사하지만 Flags field가 response/responder 방향을 나타내고, 다른 IV/integrity checksum과 다른 SPI를 Delete payload에 넣는다. 이후 IKE_SA 자체를 닫을 때는 별도의 INFORMATIONAL exchange가 필요하다. IKE_SA 삭제 요청에서는 삭제 대상 SPI를 payload에 넣을 필요가 없다. 삭제 요청 자체가 해당 IKE_SA 위에 실려 있으므로 대상 SA가 암묵적으로 정해지기 때문이다.

![Figure 18-27](@/assets/images/cs-tcp-ip-illustrated-337-figure-18-27-page-915.png)
*Figure 18-27 · PDF p. 915 · IKE_SA 삭제 요청에서는 message가 실린 IKE_SA 자체가 삭제 대상이므로 별도 SPI가 필요 없다*

### 18.9 Transport Layer Security (TLS and DTLS)

TLS(Transport Layer Security)는 transport layer 바로 위에서 동작하는 보안 protocol이다. Web HTTPS가 대표적이지만 POP3S, IMAPS처럼 application protocol을 보호하는 데도 널리 쓰인다. EAP나 IPsec이 OS/network stack 지원을 많이 요구하는 것과 달리, TLS는 application 내부 또는 application 바로 아래 library로 구현하기 쉬워 배포성이 좋다.

TLS 1.2는 TCP 같은 reliable stream transport 위에서 동작하고, DTLS(Datagram Transport Layer Security)는 UDP 같은 datagram transport 위에서 TLS와 유사한 보안 목표를 달성한다. SSL은 TLS의 전신이지만 SSL 2.0은 약해서 금지되었고, TLS/SSL 간에는 직접 호환이 아니라 초기 negotiation으로 사용할 version/protocol을 정한다.

### 18.9.1 TLS 1.2 Architecture

TLS의 보안 목표는 confidentiality, data integrity, peer authentication, key establishment다. 보통 PKI certificate와 cipher suite를 사용하지만, certificate 없는 anonymous mode도 가능하다. 다만 anonymous TLS는 endpoint가 강하게 식별되지 않으므로 MITM attack에 취약하다.

TLS 내부는 record layer와 upper layer protocols로 나뉜다.

![Figure 18-28](@/assets/images/cs-tcp-ip-illustrated-338-figure-18-28-page-916.png)
*Figure 18-28 · PDF p. 916 · TLS record layer와 Handshake/Alert/Change Cipher Spec/Application Data protocol의 계층 구조*

| TLS component | 핵심 역할 |
|---|---|
| Record protocol | fragmentation, optional compression, integrity protection, encryption |
| Handshake protocol | algorithm negotiation, certificate exchange, authentication, key material 생성 |
| Alert protocol | fatal/nonfatal status, controlled shutdown, error 전달 |
| Change Cipher Spec protocol | pending state를 current state로 전환 |
| Application Data protocol | 보호된 application payload 운반 |

Change Cipher Spec은 handshake로 준비한 pending state를 current state로 바꾸는 동기화 신호다. TLS connection state는 read/write state로 나뉘며, 각 state는 compression algorithm, encryption algorithm, MAC algorithm, key/IV 등을 가진다. 처음에는 NULL encryption, no compression, no MAC 상태에서 시작한다.

TLS 1.2가 의존하는 cryptographic operation은 digital signing, stream cipher encryption, block cipher encryption, AEAD, public key encryption이다. Record layer integrity는 HMAC을 사용하고, key generation은 HMAC-SHA-256 기반 PRF를 사용한다.

### 18.9.1.1 TLS Record Protocol

Record protocol은 upper-layer data를 `TLSPlaintext` record로 fragment한다. Record 최대 payload는 `2^14` bytes이며, TLS는 higher-layer message boundary를 보존하지 않는다. 이후 optional compression으로 `TLSCompressed`를 만들고, encryption/integrity protection으로 `TLSCiphertext`를 만든다.

![Figure 18-29](@/assets/images/cs-tcp-ip-illustrated-339-figure-18-29-page-918.png)
*Figure 18-29 · PDF p. 918 · TLSPlaintext에서 TLSCompressed, TLSCiphertext로 변환되는 record layer 처리 흐름*

Record 처리 순서는 일반적으로 sequence number 계산, MAC 계산, padding, symmetric encryption이다. Sequence number는 message에 직접 실리지 않지만 MAC 계산에 들어간다. Block cipher는 padding과 pad length가 필요할 수 있고, AEAD cipher(CCM, GCM 등)는 separate MAC 없이 nonce와 authenticated encryption을 사용한다.

Record protocol key material은 Handshake protocol이 만든 `master_secret`에서 나온다.

```text
Mc | Ms | Dc | Ds | IVc | IVs =
  PRF(master_secret, "key expansion", server_random + client_random)
```

| 값 | 의미 |
|---|---|
| `Mc`, `Ms` | client/server MAC write key |
| `Dc`, `Ds` | client/server data write key |
| `IVc`, `IVs` | client/server IV 또는 AEAD implicit nonce material |

Client/server 방향별 key를 분리하는 이유는 양방향 traffic의 encryption/MAC state를 독립시키기 위해서다. 예시로 `AES_256_CBC_SHA256` cipher suite는 32-byte key 네 개, 총 128 bytes의 key material을 요구한다.

### 18.9.1.2 TLS Handshake Protocols

Record layer가 multiplex하는 TLS subprotocol 번호는 Handshake `22`, Alert `21`, Change Cipher Spec `20`이다. Change Cipher Spec message는 byte value `1` 하나로 구성되어 current/pending state 전환을 알린다. Alert protocol은 bad MAC, unknown message, algorithm failure 같은 fatal error와 controlled shutdown을 전달한다.

Handshake protocol의 목표는 여섯 가지로 정리된다.

| Handshake 목표 | 설명 |
|---|---|
| Algorithm agreement | cipher suite와 compression algorithm 선택 |
| Random exchange | symmetric key 생성에 들어갈 client/server random 교환 |
| Parameter establishment | DH/RSA/ECDHE 등 key exchange parameter 설정 |
| Certificate/authentication | server/client certificate 교환과 mutual authentication |
| Session-specific secret | premaster secret, master secret 생성 |
| Verification | Finished message로 handshake transcript가 일치했는지 확인 |

![Figure 18-30](@/assets/images/cs-tcp-ip-illustrated-340-figure-18-30-page-920.png)
*Figure 18-30 · PDF p. 920 · TLS full handshake와 abbreviated handshake resume의 message 흐름*

`ClientHello`는 TLS version, session ID, cipher suite proposal, compression algorithm, `ClientHello.random`, extensions를 보낸다. Server가 session cache에서 session ID를 찾고 재사용을 허용하면 abbreviated handshake로 resume할 수 있다. Resume은 endpoint authentication 비용을 줄여 성능상 중요하지만, cipher specification 상태가 양쪽에서 맞아야 한다.

Full handshake에서는 `ServerHello`가 `ServerHello.random`, 선택된 cipher suite, compression algorithm, session ID를 보낸다. Server authentication이 필요한 일반 HTTPS 같은 경우 server는 `Certificate` message로 certificate chain을 보낸다. Certificate만으로 premaster secret 형성이 불충분하거나 ephemeral DH를 쓰는 cipher suite(`TLS_DHE_anon`, `TLS_DHE_DSS`, `TLS_DHE_RSA` 등)에서는 `ServerKeyExchange`가 추가된다.

Server가 client authentication을 요구하면 `CertificateRequest`를 보낸 뒤 `ServerHelloDone`으로 server side hello phase를 끝낸다. Client는 필요한 경우 client `Certificate`를 보내고, mandatory `ClientKeyExchange`로 premaster secret 생성에 필요한 RSA-encrypted key 또는 DH parameter를 제공한다. Client authentication이 요청되었다면 `CertificateVerify`가 handshake transcript hash에 대한 client private key signature를 실어 private key possession과 transcript 참여를 증명한다.

Handshake 마지막에는 `ChangeCipherSpec` 이후 `Finished` message가 오간다. Finished는 처음으로 새 보호 parameter가 적용되는 handshake message이며 다음 값을 포함한다.

```text
verify_data = PRF(master_secret, finished_label, Hash(handshake_messages))

master_secret = PRF(premaster_secret, "master secret",
                    ClientHello.random + ServerHello.random)
```

`finished_label`은 client와 server 방향에 따라 `"client finished"` 또는 `"server finished"`다. Finished가 중요한 이유는 양쪽이 같은 handshake transcript와 같은 key material에 도달했는지 강하게 확인해 주기 때문이다.

### 18.9.1.3 TLS Extensions and Renegotiation

TLS extension은 IKE의 Notify/Configuration payload처럼 기본 handshake 밖의 기능을 확장한다. TLS 1.2 기본 extension 중 `signature_algorithms`는 client가 지원하는 hash/signature 조합을 선호도 순서로 알린다. 예: SHA-1, SHA-224, SHA-256, SHA-384, SHA-512와 RSA, DSA, ECDSA 조합.

| Extension | 의미 |
|---|---|
| `server_name` | 접속 대상 DNS-style server name, SNI(Server Name Indication) |
| `max_fragment_length` | TLS message 최대 fragment length 협상 |
| `client_certificate_url` | certificate 전체 대신 URL 전달 지원 |
| `trusted_ca_keys` | trusted CA public key/certificate name 또는 hash |
| `truncated_hmac` | HMAC 앞 80 bits만 사용 |
| `status_request` | OCSP response를 `CertificateStatus`로 받도록 요청 |
| `SessionTicket` | server session state를 encrypted ticket 형태로 client에 보관 |
| `renegotiation_info` | renegotiation attack 방지를 위해 이전 Finished verify_data와 binding |

Renegotiation은 같은 TLS connection을 유지한 채 cryptographic parameter를 다시 협상하는 기능이다. Server는 `HelloRequest`로 시작할 수 있고 client도 새 `ClientHello`를 자발적으로 보낼 수 있다. Sequence number wrap 직전처럼 key/state를 갱신할 필요가 있을 때 유용하지만, 2009년에 renegotiation 기반 MITM splicing attack이 실증되었다. RFC 5746의 `renegotiation_info` extension은 새 handshake를 이전 handshake의 `client_verify_data`/`server_verify_data`와 묶어 공격자가 별도 TLS session을 정상 session에 이어붙이는 일을 막는다. 일부 구형 server가 unknown extension에서 connection을 abort하므로 `TLS_EMPTY_RENEGOTIATION_INFO_SCSV`라는 signaling cipher suite value도 같은 의미로 쓰인다.

### 18.9.1.5 TLS Example

예시 trace는 loopback `127.0.0.1`에서 TLS 1.2 server port `5556`에 접속하는 TCP/IP 흐름이다. Client와 server는 모두 RSA certificate를 peer에게 제공한다. Wireshark에서는 SSL로 decode하도록 지정해 TLS message를 확인한다.

![Figure 18-31](@/assets/images/cs-tcp-ip-illustrated-341-figure-18-31-page-924.png)
*Figure 18-31 · PDF p. 924 · TCP ACK가 섞인 TLS 1.2 connection establishment trace와 ChangeCipherSpec 이후 암호화 구간*

TLS exchange는 TCP three-way handshake 이후 `ClientHello`로 시작한다. `ChangeCipherSpec`가 처리된 뒤 이후 message는 encrypted/authenticated 상태가 된다.

![Figure 18-32](@/assets/images/cs-tcp-ip-illustrated-342-figure-18-32-page-925.png)
*Figure 18-32 · PDF p. 925 · ClientHello의 version, cipher suites, compression, random, extensions 예시*

이 `ClientHello`는 32-bit UNIX timestamp와 28-byte random value로 구성된 `ClientHello.random`을 포함한다. 새 connection이므로 session ID는 0이다. Client는 세 개의 cipher suite를 선호도 순서로 제안하고, compression은 NULL만 지원한다. Extensions에는 `cert_type`, `server_name`, `renegotiation_info`, `SessionTicket`, `signature_algorithms`가 들어 있다.

Server는 `TLS_DHE_RSA_WITH_AES_256_CBC_SHA256` cipher suite 하나만 지원하도록 설정되어 있어 `ServerHello`에서 이를 선택한다. 이 suite는 ephemeral Diffie-Hellman key agreement, RSA certificate authentication, AES-256-CBC encryption, SHA-256 integrity를 조합한다. 이어지는 server `Certificate`는 Test CA가 서명한 X.509v3 certificate이며, `SubjectPublicKeyInfo`의 RSA public key로 client가 server를 authenticate한다. Certificate extensions에는 `basicConstraints`, `subjectAltName`, `extKeyUsage`, `keyUsage`, `subjectKeyIdentifier`, `authorityKeyIdentifier`가 포함된다.

`CertificateRequest`와 `ServerHelloDone`은 같은 TCP segment에 들어갈 수 있다. Server가 client certificate를 요구하면 client는 certificate chain을 보내고, `CertificateVerify`에서 지금까지 주고받은 handshake message hash에 private key signature를 만들어 보낸다. 이것은 client가 private key를 알고 있다는 사실뿐 아니라, handshake message를 빠뜨리거나 재정렬하지 않고 같은 transcript를 공유한다는 사실도 검증한다.

### 18.9.2 TLS with Datagrams (DTLS)

DTLS는 TLS를 UDP 같은 datagram transport에 맞춘 변형이다. SIP처럼 UDP 위에서 동작하지만 IPsec을 쓰고 싶지 않은 protocol, DCCP, SCTP 등에 적용될 수 있다. TLS와 거의 같은 message format과 layering을 사용하지만, datagram loss, reordering, duplication을 직접 다뤄야 한다.

TLS에서는 record sequence number가 implicit이고 reliable stream ordering을 가정한다. DTLS는 record header에 explicit sequence number와 16-bit `epoch`를 넣는다. Epoch는 ChangeCipherSpec마다 증가하고, 같은 sequence number라도 cipher state가 다른 record를 구분한다. DTLS MAC 계산은 epoch와 sequence number를 결합한 64-bit 값을 포함하므로 record를 독립적으로 처리할 수 있다.

DTLS의 replay detection은 IPsec AH/ESP와 비슷하게 receiver window로 수행된다. Window는 최소 32개, 권장 64개 이상의 sequence number를 추적한다. Window 왼쪽보다 오래된 record는 silently discarded되고, window 안에서는 duplicate 여부를 확인한다. Valid MAC을 가진 out-of-order record는 보존될 수 있고, window 오른쪽을 넘는 valid record는 right edge를 전진시킨다.

하나의 datagram에는 여러 DTLS record가 들어갈 수 있지만, 하나의 record가 여러 datagram에 걸쳐서는 안 된다. Application은 PMTUD와 유사하게 DTLS overhead를 고려한 maximum application datagram size를 지켜야 한다. 단, Handshake protocol message는 수 KB가 될 수 있어 별도 fragmentation이 있다. DTLS handshake fragment는 16-bit Sequence Number, 24-bit Fragment Offset, 24-bit Fragment Length를 사용한다.

![Figure 18-36](@/assets/images/cs-tcp-ip-illustrated-346-figure-18-36-page-932.png)
*Figure 18-36 · PDF p. 932 · DTLS full/abbreviated exchange의 flight 재전송과 Preparing/Sending/Waiting state machine*

DTLS handshake는 message group을 flight 단위로 보내며 timeout-based retransmission을 수행한다. Full exchange는 TLS full handshake와 유사하지만 `HelloVerifyRequest`와 cookie가 들어간 두 번째 `ClientHello`가 추가된다. Abbreviated exchange는 TLS와 달리 server가 첫 Finished를 보낸다.

State machine은 `Preparing`, `Sending`, `Waiting` 세 상태로 구성된다. Flight를 보내면 retransmission timer를 설정하고 Waiting으로 들어간다. Timer가 만료되거나 peer의 retransmitted flight를 받으면 자신의 flight도 재전송한다. 기본 RTX timer 권장은 1s이고, 응답이 없으면 timeout을 doubling하여 최소 60s까지 늘릴 수 있다. 성공적인 전송이나 긴 idle period 뒤에는 timer를 reset할 수 있다.

### 18.9.2.3 DTLS DoS Protection

DTLS는 UDP source IP spoofing에 취약한 ClientHello flood/reflection DoS를 고려해야 한다. Server가 forged source address의 ClientHello마다 expensive response state를 만들면 server resource exhaustion이 발생하고, 여러 공격자가 victim IP를 source로 위조하면 server response가 victim에게 몰리는 reflection attack도 가능하다.

이를 줄이기 위해 DTLS는 stateless cookie validation을 Hello exchange에 넣는다. Server는 최초 ClientHello에 대해 secret, client IP address, connection parameter 등을 바탕으로 cookie를 만든 `HelloVerifyRequest`를 보낸다. Client가 다음 ClientHello에 올바른 cookie를 넣어야 server가 handshake를 진행한다. 이 방식은 source address를 실제로 받을 수 있는 client인지 확인해 forged-source 공격을 줄이지만, 정상 IP에서 오는 대규모 coordinated attack까지 막지는 못한다.

### 18.10 DNS Security (DNSSEC)

DNSSEC(Domain Name System Security Extensions)는 DNS data 자체, 즉 resource records(RRs)에 origin authentication과 integrity assurance를 제공한다. 또한 존재하지 않는 이름에 대한 응답도 위조되지 않았음을 보이는 authenticated denial of existence를 제공한다. 다만 DNSSEC는 privacy/confidentiality, DoS protection, access control을 제공하지 않는다. DNS transaction update/synchronization 보안은 TSIG/TKEY/SIG(0) 같은 별도 mechanism과 함께 다룬다.

DNSSEC-aware resolver는 보안 인식 수준에 따라 나뉜다.

| Resolver 상태 | 의미 |
|---|---|
| validating security-aware resolver | cryptographic signature를 직접 검증 |
| security-aware nonvalidating resolver | DNSSEC data를 이해하지만 검증은 validating resolver에 의존 |
| security-unaware resolver | DNSSEC RR를 처리하지 않음 |

Validation 결과도 네 가지로 해석된다.

| 상태 | 의미 |
|---|---|
| secure | 모든 signature가 유효하고 trust chain이 확인됨 |
| insecure | 서명된 정보가 “여기는 보안 delegation이 아님”을 유효하게 말함 |
| bogus | data는 있어 보이나 signature/trust validation에 실패 |
| indeterminate | signature/trust 정보 부족으로 참거짓 판단 불가 |

DNSSEC가 안전하게 동작하려면 zone이 signed되어 있고, resolver가 initial trust anchor를 갖고 있으며, authoritative server와 resolver software가 DNSSEC를 지원해야 한다. Trust anchor는 PKI root certificate와 비슷한 시작 신뢰점이지만, DNSSEC는 완전한 PKI가 아니며 CRL 같은 일반 certificate revocation model도 제공하지 않는다.

Security-aware resolver는 EDNS0 OPT meta-RR의 `DO(DNSSEC OK)` bit를 켜서 DNSSEC-related RR를 받을 수 있음을 알린다. `DO` bit가 없으면 server는 명시 요청이 아닌 한 대부분의 DNSSEC RR를 반환하지 않는다. 이는 UDP DNS response 크기를 줄이고, 큰 response가 TCP fallback으로 이어지는 latency를 줄이는 실용적 이유가 있다.

`CD(checking disabled)` bit는 client가 nonvalidated data를 받겠다는 뜻이고, server가 cryptographic validation을 성공적으로 수행하면 response에 `AD(authentic data)` bit를 세울 수 있다. 가장 강한 모델은 validating stub resolver가 직접 검증하고 `CD` bit를 켜서 중간 recursive server를 신뢰하지 않는 end-to-end DNS security를 얻는 것이다.

### 18.10.1 DNSSEC Resource Records

DNSSECbis는 네 가지 핵심 RR와 두 header bit(`CD`, `AD`)를 정의하고, EDNS0의 `DO` bit를 사용한다. 핵심 RR는 key distribution/validation용 `DNSKEY`, `DS`, signature용 `RRSIG`, authenticated denial용 `NSEC`이며, 이후 `NSEC3`, `NSEC3PARAM`이 추가되었다.

### 18.10.1.1 DNSKEY Resource Record

`DNSKEY` RR는 DNSSEC 전용 public key를 DNS 안에 저장한다. 다른 용도의 key/certificate는 `CERT` RR 같은 다른 record를 사용할 수 있지만, DNSSEC zone signing과 validation에는 DNSKEY가 중심이다.

![Figure 18-37](@/assets/images/cs-tcp-ip-illustrated-347-figure-18-37-page-936.png)
*Figure 18-37 · PDF p. 936 · DNSKEY RDATA의 Flags, Protocol, Algorithm, Public Key 필드*

| DNSKEY field | 의미 |
|---|---|
| Flags bit 7 Zone Key | set이면 zone signing/validation용 key |
| Flags bit 15 SEP(Secure Entry Point) | 보통 KSK(Key Signing Key)를 나타내는 힌트 |
| Flags bit 8 Revoked | set이면 validation에 사용할 수 없는 revoked key |
| Protocol | DNSSEC version에서 값 3 |
| Algorithm | signing algorithm identifier |
| Public Key | Algorithm에 따라 encoding되는 public key |

일반적으로 SEP bit가 set된 key는 KSK(Key Signing Key)로 불리며 delegation validation, 특히 child zone의 DNSKEY를 검증하는 데 연결된다. SEP bit가 없고 zone key bit만 set된 key는 보통 ZSK(Zone Signing Key)로 불리며 zone contents RRset signature에 더 자주 쓰이고 validity period가 짧다.

### 18.10.1.2 Delegation Signer (DS) Resource Record

`DS(Delegation Signer)` RR는 보통 parent zone에서 child zone의 DNSKEY RR를 참조한다. DNSSEC chain of trust에서 parent가 child의 key를 인증하는 downward link 역할을 한다.

![Figure 18-38](@/assets/images/cs-tcp-ip-illustrated-348-figure-18-38-page-936.png)
*Figure 18-38 · PDF p. 936 · DS RDATA의 Key Tag, Algorithm, Digest Type, Digest 필드*

`Key Tag`는 DNSKEY RR를 찾기 위한 nonunique hint일 뿐이고, 같은 tag를 가진 DNSKEY가 여러 개 있을 수 있다. 따라서 Key Tag만으로 신뢰하지 않고 digest와 signature validation이 필요하다. DS digest는 다음 형태로 계산된다.

```text
digest = digest_algorithm(DNSKEY owner name | DNSKEY RDATA)

DNSKEY RDATA = Flags | Protocol | Algorithm | Public Key
```

DS RR는 zone boundary를 건너 trust chain을 이어야 하므로, 참조되는 DNSKEY는 zone key여야 한다. Digest type은 SHA-1, SHA-256 등이 쓰일 수 있다.

### 18.10.1.3 NSEC and NSEC3 Resource Records

`NSEC(NextSECure)` RR는 canonical order에서 현재 owner name 다음에 오는 RRset owner name과, 현재 owner name에 존재하는 RR type bitmap을 담는다. 이 chain을 따라가면 “어떤 이름/타입이 zone에 존재하지 않는다”는 것을 signature로 증명할 수 있다.

![Figure 18-39](@/assets/images/cs-tcp-ip-illustrated-349-figure-18-39-page-938.png)
*Figure 18-39 · PDF p. 938 · NSEC RDATA의 Next Domain Name과 Type Bit Maps 구조*

NSEC의 장점은 authenticated denial of existence가 단순하다는 점이고, 단점은 zone enumeration이다. 공격자가 NSEC chain을 걸으면 authoritative zone 안의 name들을 열거할 수 있다. Type Bit Maps는 RR type space를 256개 window block으로 나누고, 각 block 안의 최대 256개 type presence를 bitmap으로 encoding한다. Sparse RR type distribution에 맞춰 없는 block은 생략한다.

`NSEC3`는 owner name을 그대로 보여주는 대신 hash한 owner name chain을 사용해 zone enumeration 노출을 줄인다.

![Figure 18-40](@/assets/images/cs-tcp-ip-illustrated-350-figure-18-40-page-939.png)
*Figure 18-40 · PDF p. 939 · NSEC3 RDATA의 hash algorithm, salt, iterations, next hashed owner, type bitmap*

| NSEC3 field | 의미 |
|---|---|
| Hash Algorithm | next owner name hash에 사용할 hash function |
| Flags opt-out | unsigned delegation을 NSEC3 record가 덮을 수 있음을 표시 |
| Iterations | hash 반복 횟수, dictionary attack 저항을 높임 |
| Salt | owner name에 붙여 hash dictionary attack을 어렵게 함 |
| Next Hashed Owner | canonical order의 다음 owner name hash |
| Type Bit Maps | NSEC과 같은 RR type presence bitmap |

NSEC3 hashed owner 계산은 salt와 반복 hash를 사용한다.

```text
IH(0) = H(owner name | Salt)
IH(k) = H(IH(k - 1) | Salt), if k > 0
Next Hashed Owner = H(IH(Iterations) | Salt)
```

`NSEC3PARAM` RR는 authoritative server가 negative response에 사용할 NSEC3 record를 고를 때 필요한 hash parameter를 제공한다. NSEC3를 모르는 resolver가 record를 잘못 해석하지 않도록 algorithm number 6/7 같은 alias도 사용된다. 이는 제대로 이해하지 못하면 insecure로 실패하게 만드는 제한적 backward compatibility다.

### 18.10.1.4 Resource Record Signature (RRSIG)

`RRSIG` RR는 특정 RRset에 대한 digital signature와, 그 signature를 검증할 DNSKEY를 찾는 정보를 담는다. DNSSEC에서 authoritative zone의 모든 authoritative RR은 RRSIG로 서명되어야 한다. 단 parent zone의 delegation NS RR와 glue record는 예외다.

![Figure 18-41](@/assets/images/cs-tcp-ip-illustrated-351-figure-18-41-page-941.png)
*Figure 18-41 · PDF p. 941 · RRSIG RDATA의 Type Covered, validity time, Key Tag, Signer's Name, Signature 구조*

| RRSIG field | 의미 |
|---|---|
| Type Covered | 이 signature가 덮는 RRset type |
| Algorithm | signing algorithm |
| Labels | original owner name label 수 |
| Original TTL | authoritative zone에 있던 원래 TTL |
| Signature Inception/Expiration | signature validity interval |
| Key Tag | 검증 public key가 들어 있는 DNSKEY search hint |
| Signer's Name | signer domain name |
| Signature | RRset canonical form에 대한 digital signature |

Caching name server는 TTL을 줄일 수 있으므로, validation에는 RRSIG의 `Original TTL`이 중요하다. Signature validity time은 Unix epoch 기준 초 단위로 표현된다.

### 18.10.2 DNSSEC Operation

DNSSEC validation은 같은 data라도 순서나 표현이 달라지면 hash/signature가 달라지는 문제를 피하기 위해 canonical ordering과 canonical form을 요구한다. 관심 있는 canonical rule은 세 가지다.

| Canonical 대상 | 핵심 규칙 |
|---|---|
| name order within zone | 오른쪽 label부터 byte string으로 비교, uppercase ASCII는 lowercase 처리 |
| single RR canonical form | FQDN fully expanded, no compression labels, wildcard 미치환, original TTL 사용 |
| RRset canonical order | canonical RDATA를 left-justified byte string으로 보고 정렬 |

예시 canonical name order는 `com`, `company.com`, `*.company.com`, `UK.company.COM`, `usa.company.com`처럼 right-most label 우선이며 uppercase는 lowercase로 취급된다. RR canonical form에서는 owner name과 특정 RDATA 안 domain name의 uppercase ASCII가 lowercase로 바뀌고, DNS compression label을 쓰지 않는다.

### 18.10.2.2 Signed Zones and Zone Cuts

Signed zone은 `RRSIG`, `DNSKEY`, `NSEC` 또는 `NSEC3` RR를 포함하고, signed delegation point가 있으면 `DS` RR도 포함한다. DNSSEC public key는 DNSKEY RR로 DNS 안에 저장되고, private key가 zone의 authoritative RRset을 RRSIG로 서명한다.

![Figure 18-42](@/assets/images/cs-tcp-ip-illustrated-352-figure-18-42-page-943.png)
*Figure 18-42 · PDF p. 943 · parent DS RR가 child DNSKEY hash를 담아 zone cut에서 trust chain을 이어주는 구조*

Parent zone의 DS RR는 child zone apex의 DNSKEY RR digest를 담는다. Validating resolver가 parent의 DS RR를 신뢰할 수 있으면 child DNSKEY RR를 검증하고, 그 child DNSKEY로 child zone 내부의 RRSIG와 RRset을 검증한다. 단 이 과정은 parent DNSKEY까지 이어지는 root of trust가 있을 때만 의미가 있다.

### 18.10.2.3 Resolver Operation Example

`www.icann.org`의 A RR를 검증하는 예시는 root에서 시작해 `org.`, `icann.org.`, 최종 `www.icann.org.`로 내려가는 chain of trust를 보여준다.

| 단계 | 검증 대상 | 확인하는 것 |
|---|---|---|
| root `.` | root DNSKEY/RRSIG/NSEC | trust anchor와 root RRset signature |
| root to `org.` | `org.` DS + RRSIG DS | root가 `org.` signed delegation을 인정 |
| `org.` zone | `org.` DNSKEY/RRSIG/NSEC3PARAM | root DS와 `org.` KSK/ZSK 연결 |
| `org.` to `icann.org.` | `icann.org.` DS + RRSIG DS | `org.`가 `icann.org.` signed delegation을 인정 |
| `icann.org.` zone | `icann.org.` DNSKEY/RRSIG | `icann.org.` key 검증 |
| `www.icann.org.` | A RR + RRSIG A | 최종 IP address RRset 검증 |

예시에서 root DNSKEY 중 value `257`은 SEP bit가 set된 KSK이고, value `256`은 ZSK다. Root의 RRSIG DNSKEY가 KSK key tag와 맞고, NSEC가 root에 `NS`, `SOA`, `RRSIG`, `NSEC`, `DNSKEY` type이 존재함을 보여준다. 이어서 root의 `org.` DS RRset과 RRSIG DS를 확인해 `org.`가 DNSSEC-secured delegation임을 본다.

`org.` zone에서는 DNSKEY RR 네 개가 보이며, value `257`인 KSK와 value `256`인 ZSK가 구분된다. Root zone의 DS RR가 가리키던 key tag와 `org.` DNSKEY가 연결되고, `org.`의 NSEC3/NSEC3PARAM은 hashed owner name과 salt/iteration parameter가 맞는지 확인하게 해 준다. 같은 방식으로 `icann.org.` DS와 DNSKEY를 연결한 뒤, 마지막으로 `www.icann.org.` A RR와 `RRSIG A`를 검증한다.

![Figure 18-43](@/assets/images/cs-tcp-ip-illustrated-353-figure-18-43-page-949.png)
*Figure 18-43 · PDF p. 949 · root trust anchor에서 DS/DNSKEY/RRSIG chain을 따라 최종 RRset을 검증하는 DNSSEC chain of trust 시각화*

Figure 18-43의 표기에서 root zone의 `alg=8`은 RSA/SHA-256 signature를, 다른 zone의 `alg=7`은 NSEC3 사용을 허용하는 RSA/SHA-1 계열 algorithm을 의미한다. Root zone의 DS RR에서 `digest algs=1,2`는 SHA-1과 SHA-256 digest가 함께 지원됨을 뜻한다.

### 18.10.3 Transaction Authentication: TSIG, TKEY, and SIG(0)

DNS zone transfer와 dynamic update는 잘못 사용되면 DNS structure나 contents 자체를 바꿀 수 있으므로 transaction authentication이 필요하다. DNSSEC가 “zone data의 origin authentication/integrity”를 제공한다면, transaction authentication은 “특정 resolver-server 또는 server-server exchange의 authentication/integrity”를 제공한다. 즉 transaction이 안전하다고 해서 그 안의 DNS content가 zone authority 관점에서 옳다는 뜻은 아니며, 둘은 complementary하다.

| Mechanism | Key model | 주요 용도 |
|---|---|---|
| TSIG(Transaction Signatures) | shared secret key + MAC | zone transfer, dynamic update 등 transaction authentication |
| SIG(0) | public/private key pair | TSIG와 비슷한 transaction signature, 사용 감소 |
| TKEY | key 또는 keying material 전달 | TSIG/SIG(0)에 쓸 key 형성 보조 |

### 18.10.3.1 TSIG

TSIG(Secret Key Transaction Authentication for DNS, Transaction Signatures)는 shared secret key 기반 MAC으로 DNS request/response transaction을 보호한다. TSIG는 on demand로 계산되는 pseudo-RR이며, DNS message의 additional data section에 실리고 단일 transaction 보호에만 쓰인다.

![Figure 18-44](@/assets/images/cs-tcp-ip-illustrated-354-figure-18-44-page-951.png)
*Figure 18-44 · PDF p. 951 · TSIG pseudo-RR RDATA의 Algorithm Name, Time Signed, Fudge, MAC, Error 필드*

| TSIG field | 의미 |
|---|---|
| Algorithm Name | MAC algorithm identifier, 예: `hmac-sha1`, `hmac-sha256` |
| Time Signed | UNIX time 기반 signing time |
| Fudge | peer clock이 허용되는 시간 오차 범위 |
| MAC Size / MAC | 선택한 MAC algorithm의 output |
| Original ID | 원래 DNS Transaction ID |
| Error / Other Data | error 전달용 부가 정보 |

원래 TSIG는 HMAC-MD5를 사용했지만 이후 GSS-API(Kerberos), SHA-1, SHA-256 기반 algorithm이 추가되었다. `Time Signed`는 signature에 포함되어 replay attack을 줄이지만, 이 때문에 TSIG peer는 `Fudge` 범위 안에서 clock synchronization이 필요하다.

예시는 BIND9의 `nsupdate`로 `dynzone.`에서 `two.dynzone.` RR를 삭제하는 signed dynamic update다. Key name은 `tsigkey.dynzone.`이고 shared secret은 명령에서 제공된다.

![Figure 18-45](@/assets/images/cs-tcp-ip-illustrated-355-figure-18-45-page-952.png)
*Figure 18-45 · PDF p. 952 · HMAC-MD5 TSIG로 서명된 DNS dynamic update request*

Request의 TSIG pseudo-RR는 signature algorithm `HMAC-MD5.SIG-ALG.REG.INT`, 16-byte MAC, Original ID를 포함한다. Original ID가 DNS header의 Transaction ID와 맞아 transaction binding을 제공한다.

![Figure 18-46](@/assets/images/cs-tcp-ip-illustrated-356-figure-18-46-page-953.png)
*Figure 18-46 · PDF p. 953 · TSIG로 서명된 dynamic update response와 성공 상태*

Response 역시 TSIG pseudo-RR를 additional information area에 담아 transaction 응답의 integrity/authentication을 제공한다.

### 18.10.3.2 SIG(0) and 18.10.3.3 TKEY

`SIG(0)`는 static DNS RRset을 서명하는 RRSIG와 달리 transaction에 대해 동적으로 생성되는 signature다. 기능적으로 TSIG와 비슷한 목표를 갖지만, shared secret 대신 public/private key pair에 신뢰 기반을 둔다. 실제 배포에서는 TSIG 쪽으로 더 많이 기울어져 SIG(0)의 중요도는 상대적으로 낮다.

`TKEY` meta-RR는 TSIG 또는 SIG(0)에 쓸 key를 만들거나 전달하는 deployment 부담을 낮추기 위한 record다. DNS request/response의 additional information section에 동적으로 생성되어 들어가며, key 자체나 DH public value 같은 keying material을 실을 수 있다. Local deployment에서는 유용할 수 있으나 널리 쓰이지는 않는다.

### 18.10.4 DNSSEC with DNS64

DNS64는 IPv6-only host가 IPv4 server/service에 접근하도록 A record를 기반으로 AAAA record를 합성한다. 그러나 DNSSEC는 RRset이 zone signer의 key로 서명되어야 하므로, DNS64 장비가 임의로 합성한 AAAA RR에 유효한 DNSSEC signature를 만들 수 없다. 핵심 결론은 DNS64가 DNSSEC-compatible signature를 새로 만들지 않는다는 것이다.

DNS64와 DNSSEC를 함께 쓰려면 validation 위치를 조심해야 한다.

| Query bit 조합 | vDNS64 동작 |
|---|---|
| neither DO nor CD | synthesis와 validation을 수행하지만 AD bit는 set하지 않음 |
| DO set, CD not set | validation과 synthesis를 수행하고 AD bit set 가능 |
| DO and CD set | validation은 할 수 있으나 synthesis는 하지 않을 수 있음 |

마지막 경우는 client가 security-aware지만 translation-oblivious일 때 문제가 된다. Client가 직접 validation하려고 CD를 켰는데, DNS64가 synthesis하지 않으면 IPv6 address realm에서 쓸 수 있는 합성 AAAA RR가 없을 수 있다. 따라서 DNS64 deployment에서는 stub resolver와 DNS64 recursive name server 사이의 secure channel, host-side validation 위치, vDNS64 정책이 함께 설계되어야 한다.

### 18.11 DomainKeys Identified Mail (DKIM)

DKIM(DomainKeys Identified Mail)은 email message에 domain name과 signer identity를 연결해, message origin 책임 주체를 판단하는 데 쓰인다. Spam 대응에서 mail agents 사이의 trust signal로 활용되며, RFC 5322 message header/body에 `DKIM-Signature` field를 추가한다. DKIM은 이전 DomainKeys의 `DomainKey-Signature`를 대체한다.

DKIM은 sender 자체를 항상 의미하지 않고 signer를 authenticate한다. Signing Domain Identifier(SDID)는 DNS domain name이며, receiver는 이 domain과 selector를 이용해 DNS TXT RR에서 public key를 가져와 signature를 검증한다. 별도 PKI 없이 DNS를 key distribution channel로 쓰는 점이 특징이다.

예를 들어 selector가 `key35`, domain이 `example.com`이면 public key TXT RR owner name은 다음과 같다.

```text
key35._domainkey.example.com
```

DKIM signature는 RSA/SHA-1 또는 RSA/SHA-256 private key로 만들어지고, Base64로 encoding되어 message header에 들어간다. `DKIM-Signature` field의 주요 subfield는 다음과 같다.

| DKIM subfield | 의미 |
|---|---|
| `v=` | DKIM version |
| `a=` | signing algorithm, 예: `rsa-sha256` |
| `c=` | header/body canonicalization, 예: `relaxed/relaxed` |
| `d=` | signing domain |
| `s=` | selector |
| `h=` | signature 계산에 포함된 header field 목록 |
| `bh=` | message body hash, Base64 |
| `b=` | listed headers hash에 대한 RSA signature |

Canonicalization은 email이 전송 중 whitespace나 long header wrapping 등으로 조금 달라져도 검증 가능하게 만드는 정규화 절차다. `simple`은 기본적으로 text를 바꾸지 않고, `relaxed`는 흔한 whitespace/header folding 변화를 흡수한다. DKIM은 SPF(Sender Policy Framework)와 함께 쓸 수 있으며, SPF보다 강한 cryptographic proof를 제공한다.

ADSP(Author Domain Signing Practices)는 domain이 DKIM signature를 어떻게 사용하는지 DNS TXT RR로 알리는 practice statement다. Owner name은 `_adsp._domainkey.domain.` 형태이고, 값은 `unknown`, `all`, `discardable` 등이 있다. `discardable`은 unsigned message를 버릴 수 있음을 나타내는 가장 엄격한 hint다.

DKIM 예시에서 Gmail message의 `DKIM-Signature`는 `v=1`, `a=rsa-sha256`, `c=relaxed/relaxed`, `d=gmail.com`, `s=gamma`를 포함한다. Public key 조회는 selector와 domain을 조합한 `gamma._domainkey.gmail.com` TXT query로 수행된다. TXT RR의 `k=rsa`는 RSA key임을, `p=`는 Base64 public key를, `t=y`는 testing mode를 의미한다. Testing mode에서는 DKIM validation 결과가 delivery decision에 직접 영향을 주지 않아야 한다.

Paypal의 ADSP 예시는 `_adsp._domainkey.paypal.com` TXT RR에 `dkim=discardable`을 두어, DKIM validation에 실패한 message를 버릴 수 있음을 알린다. 다만 ADSP는 다양한 mail system과 message rewriting 관행 때문에 실제 사용은 비교적 드물다.

### 18.12 Attacks on Security Protocols

Security protocol attack은 일반 protocol attack보다 더 넓다. 설계/구현 flaw를 찌르는 공격뿐 아니라, algorithm 자체의 약점, key length 부족, component 조합의 실수, side channel, active MITM 같은 요소가 함께 작동할 수 있다. “강한 암호 primitive를 썼다”는 사실만으로 protocol 전체가 안전해지는 것은 아니다.

| 대상 | 공격/취약점 | 핵심 교훈 |
|---|---|---|
| 802.11 WEP, WPA-TKIP | cryptographic compromise | early wireless security는 암호 설계가 약하면 쉽게 무너진다 |
| WPA2-AES with weak PSK | dictionary attack | strong cipher도 weak pre-shared key에는 취약 |
| EAP password-derived methods | dictionary attack | EAP는 method 자체가 아니므로 method 보안성을 그대로 상속 |
| 802.1X/EAP tunneled auth | MITM 가능성 | 한쪽만 먼저 authenticate한 tunnel 안에서 반대 방향 auth를 하면 channel binding이 중요 |
| IPsec ESP encryption without integrity | bit flipping attack | confidentiality만 있고 integrity가 없으면 ciphertext 조작을 탐지하지 못한다 |
| SSL 2.0 | cipher suite rollback | negotiation 자체가 보호되지 않으면 weak cipher로 강제될 수 있다 |
| SSL/TLS CBC 처리 | padding oracle | decrypt, padding check, MAC check 순서와 error timing이 plaintext leak으로 이어질 수 있다 |
| TLS renegotiation | MITM prefix injection/splicing | 새 handshake를 이전 channel parameter와 binding해야 한다 |
| DNSSEC NSEC | zone enumeration | authenticated denial이 zone data leakage를 만들 수 있다 |
| DNSSEC/NSEC3 | amplification, leakage, revocation 한계 | DNSSEC도 DoS, implementation bugs, key/signature 운영 문제가 남는다 |

ESP에서 integrity 없이 encryption만 사용하는 구성은 문서상 지원되더라도 discouraged된다. Bit flipping으로 tunnel mode ESP ciphertext를 조작하면 decrypt 후 IP header field(IHL 등)가 예측 가능한 방식으로 망가질 수 있고, 그 결과 발생한 ICMP message가 attacker에게 side information을 줄 수 있다. 따라서 modern secure channel 설계에서는 AEAD 또는 encrypt-then-MAC처럼 ciphertext modification을 탐지하는 구성이 중요하다.

TLS 계열 공격은 protocol negotiation과 record processing 순서가 얼마나 민감한지 보여준다. SSL 2.0 rollback attack은 MITM이 양쪽에게 peer가 weak encryption만 지원한다고 믿게 만들어 약한 cipher suite를 선택하게 한다. Padding oracle은 padding/MAC 오류의 timing 차이를 관찰해 plaintext 정보를 복구한다. TLS renegotiation attack은 malicious prefix를 기존 session 앞에 붙인 뒤 legitimate client가 도착하면 renegotiation으로 정상 흐름처럼 보이게 하는 방식이며, `renegotiation_info` extension이 이전 Finished `verify_data`와 새 handshake를 묶어 해결한다.

DNSSEC는 Kaminsky cache poisoning 같은 DNS 위조 공격의 중요성을 배경으로 등장했지만, 자체적인 운영/보안 trade-off가 있다. NSEC는 부재 증명을 위해 zone enumeration을 가능하게 만들고, NSEC3는 이를 hash로 완화하지만 완전히 정보 leakage를 제거하지는 않는다. DNSSEC response 크기는 amplification DoS의 기반이 될 수 있고, signature revocation이나 implementation bugs, cryptographic algorithm aging도 장기 운영 리스크다.

### 18.13 Summary

이 장의 큰 축은 confidentiality, authentication, integrity, nonrepudiation을 어떤 계층에서 어떤 trust/key model로 제공할 것인가다. Symmetric cryptography는 빠르지만 shared secret 관리가 어렵고, public key cryptography는 authentication과 key distribution에 강하지만 계산 비용과 trust chain 관리가 필요하다. 실제 secure protocol은 대개 public key로 identity/key agreement를 처리하고 symmetric key로 bulk data를 보호하는 hybrid design을 사용한다.

DH/ECDH는 shared secret을 직접 보내지 않고 key agreement를 수행하게 해 주며, PRF/CSPRNG는 key material과 random component를 만든다. Nonce는 freshness와 replay resistance를 제공하고, salt는 dictionary attack과 precomputation을 어렵게 한다. MAC/HMAC/CMAC/GMAC은 message integrity와 authentication의 기본 도구다.

Public key를 신뢰하려면 PKI, web of trust, DNSSEC chain of trust처럼 “이 key가 누구의 key인지”를 검증하는 구조가 필요하다. X.509 certificate chain은 root/trust anchor까지 이어지고, CRL/OCSP/SCVP 같은 mechanism으로 revocation/status를 확인한다. DER/CER, PEM, PKCS#12/PFX 같은 format은 certificate와 private key material을 저장/전달하는 방식이다.

계층별 보안 protocol의 역할은 서로 다르다.

| 계층/범위 | 대표 protocol | 제공하는 보호 |
|---|---|---|
| Link/network access | 802.1X, EAP, 802.1AE | network access authentication, link protection |
| Network layer | IPsec IKE/AH/ESP | IP datagram authentication/integrity/confidentiality, transport/tunnel mode |
| Transport/application channel | TLS, DTLS | application connection/flow 보호, record layer encryption/integrity |
| DNS data | DNSSEC | DNS RR origin authentication, integrity, authenticated denial |
| DNS transaction | TSIG, SIG(0), TKEY | dynamic update/zone transfer 등 transaction authentication |
| Email object/domain | DKIM | message header/body signature와 signing domain association |

마지막 교훈은 flexibility와 operational care다. Cryptographic suites가 필요한 이유는 알고리즘과 key length가 시간이 지나며 약해질 수 있기 때문이다. 그러나 negotiation, downgrade resistance, key validation, revocation, side channel, error handling, deployment default까지 함께 맞지 않으면 강한 primitive도 약한 protocol이 된다. Security protocol은 수학, packet format, state machine, 운영 정책이 동시에 맞아야 안전하다.

### 18.14 References and Glossary Cross-Check

References 구간은 새 protocol 설명이 아니라 이 장에서 인용한 표준/RFC/논문 목록이다. 학습용으로는 전체 참고문헌을 외우기보다, 각 기술이 어떤 표준 계열에 기대는지 연결해 두는 것이 유용하다.

| 주제 | 핵심 reference/keyword |
|---|---|
| EAP/802.1X | IEEE 802.1X-2010, RFC 3748(EAP), RFC 5247(EAP key management), RADIUS, Diameter |
| IPsec/IKEv2 | RFC 4301(IPsec architecture), RFC 4302(AH), RFC 4303(ESP), RFC 5996(IKEv2), RFC 3947/3948(NAT traversal) |
| Cryptographic primitives | RSA, Diffie-Hellman, ECC/ECDSA, AES, HMAC, CMAC, GMAC, SHA-1/SHA-2, AEAD |
| TLS/DTLS | RFC 5246(TLS 1.2), RFC 4347(DTLS), RFC 5746(renegotiation_info), SessionTicket, SCSV |
| DNSSEC | RFC 4033/4034/4035(DNSSECbis), RFC 5155(NSEC3), DNSKEY, DS, NSEC/NSEC3/NSEC3PARAM, RRSIG |
| DNS transaction security | RFC 2845(TSIG), RFC 2930(TKEY), RFC 2931(SIG(0)) |
| DKIM | RFC 5585(DKIM overview), RFC 6376(DKIM-Signature), SDID, selector, TXT RR |

Glossary pages in this range also confirm acronyms that should remain searchable in the note: `KSK`, `ZSK`, `SEP`, `RRSIG`, `RRset`, `TSIG`, `SDID`, `SCSV`, `SCVP`, `SAD`, `SPD`, `SPI`, `TFC`, `WESP`, `TLS`, `SSL`, `DKIM`, `DNSKEY`, `NSEC3`, `ESP`, `AH`, `IKE`, `SA`, `PRF`, `PRNG`, `PSK`.
