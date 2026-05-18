---
title: "Chapter 16. Security"
order: 16
pubDatetime: 2026-05-13T00:16:00+09:00
modDatetime: 2026-05-13T00:16:00+09:00
description: "Chapter 16. Security 정리 노트입니다."
tags:
  - "CS"
  - "OperatingSystem"
---
# Chapter 16. Security

- 과목: Operating System
- 기준 교재: Operating System Concepts 10th
- 관련 페이지: PDF pp. 755-798
- 우선순위: 심화

## 개요

Chapter 16은 protection과 security를 구분하면서 시작한다. `protection`은 processes/users가 computer resources에 접근하는 방식을 통제하는 mechanisms이고, `security`는 system과 data의 integrity가 보존될 것이라는 confidence의 정도다. Protection은 Chapter 17의 중심 주제이고, 이 장은 security threats, attacks, cryptography, authentication, defense mechanisms를 운영체제 관점에서 정리한다.

Security가 다루는 resources는 data/code뿐 아니라 CPU, memory, secondary/tertiary storage, networking까지 포함한다. 공격자는 정보를 훔치거나, data를 변조하거나, service를 방해하거나, system resources를 무단 사용할 수 있다. OS security는 이런 misuse를 완전히 없애는 것이 아니라, 공격 비용을 높이고 breach를 드문 사건으로 만들며, 감지와 대응을 가능하게 하는 방향으로 설계된다.

## 핵심 개념

| 개념 | 핵심 의미 |
|---|---|
| `security` | system과 data의 integrity가 보존될 것이라는 confidence. Unauthorized access/destruction/alteration/inconsistency를 막는 관점. |
| `protection` | processes/users/programs가 computer resources에 접근하는 방식을 specify/enforce하는 mechanisms. |
| `threat`, `attack` | security violation의 potential과 실제로 security를 깨려는 attempt. |
| `confidentiality`, `integrity`, `availability` | 무단 읽기 방지, 무단 수정 방지, 정당한 사용 가능성 보장이라는 보안 핵심 목표. |
| `theft of service`, `denial of service` | resources를 무단 사용하거나 legitimate users의 system/service 사용을 방해하는 violation. |
| `masquerading`, `authentication` | attacker가 다른 host/person인 척하는 공격과, identity correctness를 확인하는 과정. |
| `replay attack`, `message modification` | valid data transmission을 악의적으로 반복하거나, sender 모르게 communication data를 바꾸는 공격. |
| `man-in-the-middle attack`, `session hijacking` | attacker가 communication 흐름 중간에 앉아 양쪽을 속이거나 active session을 가로채는 공격. |
| `privilege escalation` | attacker가 원래 가져야 할 권한보다 더 많은 privileges를 획득하는 공격 범주. |
| `attack surface` | attacker가 system에 침투하려 시도할 수 있는 exposed points의 집합. |
| `hardening` | attack surface를 줄이고 insecure defaults/misconfigurations/security bugs를 줄이도록 OS와 services를 구성하는 작업. |
| `social engineering`, `phishing` | deception을 이용해 사람이 confidential information을 제공하거나 malicious payload를 실행하게 만드는 공격. |
| `four-layered security model` | physical, network, operating system, application layer 모두에서 security를 고려해야 한다는 모델. |
| `program threat` | malicious program 또는 정상 process의 behavior 변경을 통해 security breach를 만드는 threat. |
| `malware`, `Trojan horse`, `spyware`, `ransomware` | system을 exploit/disable/damage하는 software와 그 대표 유형. |
| `principle of least privilege` | program/privileged user가 task 수행에 필요한 최소 privilege만 갖고 동작해야 한다는 설계 원칙. |
| `trap door`, `back door`, `logic bomb` | 특정 조건/secret input에서 normal security를 우회하거나 delayed malicious action을 수행하는 숨겨진 code path. |
| `code injection`, `buffer overflow` | executable code를 추가/변조하거나 memory buffer bounds를 넘어 control flow를 바꾸는 vulnerability/attack class. |
| `integer overflow`, `use-after-free`, `double free` | memory corruption과 code injection으로 이어질 수 있는 programming flaw categories. |
| `virus`, `worm` | legitimate program에 embedded되어 self-replicating하는 code와, network를 이용해 human help 없이 replication하는 malware. |
| `virus signature`, `polymorphic virus`, `encrypted virus`, `stealth virus` | detection 회피와 관련된 virus 식별 패턴 및 변형 기법. |
| `rootkit` | OS 자체에 infiltrate하여 detection mechanisms까지 장악할 수 있는 malware class. |
| `monoculture` | 많은 systems가 같은 hardware/OS/application stack을 사용해 single attack의 blast radius가 커지는 상황. |
| `zombie system` | compromise되었지만 owner에게 정상 동작처럼 보이며 attacker가 DoS/spam relay 등에 사용하는 system/device. |
| `sniffing`, `spoofing` | network traffic을 passive하게 intercept하거나, 다른 party인 것처럼 masquerade하는 network attack. |
| `DoS`, `DDoS` | legitimate service 사용을 방해하는 denial-of-service와 multiple sites/zombies에서 동시에 수행되는 distributed DoS. |
| `port scanning`, `fingerprinting` | open services/versions/OS behavior를 조사해 target vulnerabilities를 찾는 reconnaissance technique. |
| `cryptography`, `key` | network를 신뢰하지 않고 sender/receiver를 constrain하기 위해 secrets인 keys로 messages를 처리하는 기술. |
| `encryption`, `ciphertext`, `plaintext` | key를 가진 receiver만 message를 읽을 수 있도록 plaintext를 ciphertext로 바꾸는 mechanism. |
| `symmetric encryption`, `asymmetric encryption` | 같은 key로 encrypt/decrypt하는 방식과 public/private key pair를 사용하는 방식. |
| `DES`, `triple DES`, `AES`, `block cipher`, `stream cipher` | 대표 symmetric encryption algorithms와 block/stream processing 방식. |
| `authentication`, `authenticator`, `MAC`, `digital signature` | sender identity와 message integrity를 검증하기 위한 cryptographic mechanisms. |
| `hash function`, `message digest`, `collision resistance` | message를 fixed-size digest로 줄이고, 다른 message가 같은 digest를 만들기 어렵게 하는 성질. |
| `nonrepudiation`, `code signing` | action 수행 사실 부인을 어렵게 하거나 published code가 변경되지 않았음을 검증하는 signature 응용. |
| `digital certificate`, `certificate authority`, `X.509`, `web of trust` | public key가 누구의 것인지 trusted party가 digitally sign해 증명하는 key distribution infrastructure. |
| `TLS`, `SSL`, `IPSec`, `VPN`, `PGP` | cryptography가 transport/network/application layer에서 사용되는 대표 protocols/applications. |
| `user authentication` | system이 user identity가 authentic한지 확인하는 문제. Possession, knowledge, biometric attribute 기반으로 수행된다. |
| `password`, `passphrase`, `password aging`, `password history` | user knowledge 기반 authentication과 그 관리 기법. |
| `shoulder surfing`, `sniffing`, `dictionary attack`, `brute force` | passwords가 노출·추측·전송 감청·사전 대입으로 compromise되는 대표 방식. |
| `secure hashing`, `salt` | plaintext password를 저장하지 않고 hash와 random salt로 password file attack 비용을 높이는 방식. |
| `one-time password`, `challenge-response`, `two-factor authentication` | 재사용 가능한 password 노출 문제를 줄이기 위한 challenge 기반 및 다요소 인증 방식. |
| `biometrics` | fingerprint, retina, hand geometry 같은 user physical attribute 기반 authentication. |
| `defense in depth` | 여러 layers of defense를 겹쳐 하나가 실패해도 전체 compromise로 바로 이어지지 않게 하는 보안 원칙. |
| `security policy`, `vulnerability assessment`, `penetration test` | 무엇을 보호하고 무엇을 허용/금지할지 정하는 문서, 구현 상태를 평가하는 과정, known vulnerabilities를 검사하는 test. |
| `IPS`, `IDS`, `signature-based detection`, `anomaly detection` | intrusion prevention/detection systems와 known bad pattern 또는 normal behavior deviation 기반 탐지 방식. |
| `false positive`, `false negative`, `Christmas tree effect` | false alarm, missed intrusion, 너무 많은 alarms로 administrator가 alarms를 무시하게 되는 현상. |
| `firewall`, `DMZ`, `personal firewall`, `application proxy firewall`, `system-call firewall` | trusted/untrusted domains 사이 traffic과 operations를 제한·감시하는 방어 구조. |
| `ASLR`, `dm-verity`, `code signing`, `sandboxing` | code injection/OS tampering/application trust를 줄이는 현대 방어 기법. |
| `security access token`, `SID`, `subject`, `security descriptor`, `ACL` | Windows 10 security model에서 user/process/object access를 표현하는 핵심 구조. |

## 세부 정리

### 16.1 The Security Problem

Security는 왜 중요한가. Payroll, financial data, corporate operations data는 금전적 가치가 있고, loss 또는 fraud는 조직의 기능 자체를 크게 해칠 수 있다. Raw computing resources도 attacker에게 가치가 있다. 예를 들어 cryptocurrency mining, spam sending, 다른 systems를 익명으로 공격하기 위한 launch point로 악용될 수 있다.

Secure system은 “모든 circumstances에서 resources가 intended way로만 used/accessed되는 system”이라고 할 수 있다. 하지만 total security는 달성할 수 없다. 목표는 security breaches를 norm이 아니라 rare occurrence로 만드는 것이다. Accidental misuse는 protection mechanisms로 어느 정도 막기 쉽지만, malicious misuse는 훨씬 어렵다.

Security violations는 다음처럼 분류된다.

| Violation | 의미 | 예 |
|---|---|---|
| `breach of confidentiality` | unauthorized reading/data theft | credit-card information, identity information, unreleased media/scripts 탈취 |
| `breach of integrity` | unauthorized modification | source code 변조, liability를 innocent party에 떠넘기는 data 변경 |
| `breach of availability` | unauthorized destruction 또는 service availability 훼손 | website defacement, data destruction |
| `theft of service` | unauthorized resource use | system에 daemon을 설치해 file server처럼 사용 |
| `denial of service` / `DoS` | legitimate use 방해 | worm bug로 rapid spread가 발생해 service를 소모 |

공격자는 여러 표준 기법을 사용한다. `masquerading`은 communication participant가 다른 host/person인 척하는 것이다. 이는 identity correctness인 `authentication`을 깨고, 원래 허용되지 않는 access를 얻는 데 쓰인다. `replay attack`은 valid transmission을 악의적으로 반복하는 공격이고, `message modification`은 communication data를 sender 모르게 바꾸는 공격이다. `man-in-the-middle attack`은 attacker가 communication flow 중간에서 sender에게는 receiver인 척, receiver에게는 sender인 척하는 공격이다. Active communication session을 가로채는 `session hijacking`이 선행될 수 있다.

또 다른 큰 범주는 `privilege escalation`이다. 모든 system은 users와 system components에 privileges를 부여한다. 공격자는 masquerading, message modification, malicious script/macro execution 등으로 원래 권한보다 더 높은 권한을 얻으려 한다. 이 범주는 매우 흔하고, 모든 변형을 탐지·방지하기 어렵다.

Absolute protection은 불가능하지만 attacker cost를 충분히 높여 많은 intruders를 deter할 수 있다. `denial-of-service`처럼 완전 예방이 어려운 공격은 detection과 countermeasures가 중요하다. 예를 들어 upstream filtering이나 resources 추가로 legitimate users의 service를 유지할 수 있다.

Security는 네 계층에서 함께 다뤄야 한다.

| Layer | 핵심 보안 문제 |
|---|---|
| `physical` | machine room, terminals, computers에 대한 physical entry와 theft/tampering 방지 |
| `network` | network access, intercepted data, communication interruption, remote DoS 방지 |
| `operating system` | OS/services의 vulnerabilities, insecure defaults, misconfiguration, bugs, patching/hardening |
| `application` | third-party applications의 privileges, malicious applications, benign applications의 security bugs |

![Four-layered security model](@/assets/images/cs-operating-system-322-figure-16-1-page-758.png)
<p align="center"><sub>Figure 16.1 · PDF p. 758 · physical, network, operating system, application 네 계층이 모두 약점 없이 맞물려야 하는 security model</sub></p>

Figure 16.1의 의미는 chain model과 같다. 네 layer 중 어느 하나라도 취약하면 전체 system compromise로 이어질 수 있다. 그래서 security is only as strong as its weakest link라는 표현이 성립한다.

여기에 human factor가 추가된다. Authorization을 조심스럽게 수행해야 하고, authorized users도 malicious할 수 있으며, social engineering에 속아 credentials나 confidential information을 제공할 수 있다. `phishing`은 legitimate-looking email 또는 web page로 user를 속여 confidential information을 입력하게 하는 social-engineering attack이다. 때로는 browser page나 email link 클릭만으로 malicious payload가 다운로드되어 user PC가 compromise되고, 그 system이 다시 LAN의 다른 systems나 users 공격에 이용된다.

OS security는 결국 protection에 의존한다. Users/processes의 access를 authorize하고, activities를 log하며, hardware protection features를 사용해야 한다. 예를 들어 memory protection이 없는 system은 secure할 수 없다. 공격과 방어는 계속 진화한다. Intruders가 vulnerabilities를 exploit하면 countermeasures가 만들어지고, 그에 대응해 더 sophisticated attacks가 등장한다.

### 16.2 Program Threats

Computer에서 work를 수행하는 직접 수단은 kernel과 processes다. 따라서 attacker의 흔한 목표는 security breach를 일으키는 program을 실행하거나, 정상 process의 behavior를 바꾸어 breach를 만들게 하는 것이다. Unauthorized login 자체보다, 이후에도 정보를 제공하거나 접근을 유지하는 `back-door daemon` 또는 `RAT(Remote Access Tool)`을 남기는 것이 attacker에게 더 유용할 수 있다.

#### 16.2.1 Malware

`malware`는 computer systems를 exploit, disable, damage하도록 설계된 software다. 대표 유형은 다음과 같다.

| Malware/type | 핵심 의미 | 주의점 |
|---|---|---|
| `Trojan horse` | stated function과 달리 clandestine/malicious behavior를 수행하는 program | 다른 user/domain 권한으로 실행되면 privilege escalation 가능 |
| login emulator / Trojan mule | legitimate login prompt처럼 보여 credentials를 훔치는 program/page | nontrappable key sequence, session-end usage message, URL 확인으로 방어 |
| `spyware` | ads, popups, user/system information capture, spam relay 등을 수행 | innocuous program과 함께 설치될 수 있음 |
| `ransomware` | owner에게 가치 있는 data를 encrypt하여 inaccessible하게 만들고 ransom을 요구 | payment가 access recovery를 보장하지 않음 |
| `trap door` / `back door` | creator만 아는 special ID/password/condition으로 normal security를 우회 | source-level review가 없으면 탐지 어려움 |
| `logic bomb` | 특정 logic condition에서 delayed malicious action을 수행 | 오래 dormant하다가 피해 후 발견될 수 있음 |

Malware가 잘 작동하는 환경은 `principle of least privilege`가 깨진 환경이다. OS가 normal user에게 기본적으로 너무 많은 privileges를 주거나, user가 administrator로 항상 실행되면 permissions/protections가 malware를 제어하기 어렵다. 좋은 OS와 software는 task execution 동안 필요한 privileges만 available하게 하고, fine-grained access/security control을 제공해야 한다. 동시에 security controls는 관리하고 이해하기 쉬워야 한다. 너무 불편하거나 오해하기 쉬운 security measure는 우회되어 전체 security를 약화시킨다.

`trap door`는 software에 숨겨진 privileged path다. 특정 user ID/password를 받으면 normal security procedures를 우회하는 식이다. `logic bomb`은 특정 조건, 예를 들어 attacker의 employment 상태 변경 같은 condition을 만족할 때 동작하도록 숨겨질 수 있다. Compiler나 compile-time libraries에 trap door가 숨어 있으면 source code review만으로 발견하기 어렵다. 이런 위험을 줄이는 개발 방법이 `code review`다. Developer가 code를 제출하면 다른 reviewers가 검토하고 승인한 뒤 code base에 들어가도록 한다. Automatic code-scanning tools도 도움이 되지만, 원문은 좋은 programmers의 review가 여전히 중요하다고 강조한다.

#### 16.2.2 Code Injection

대부분 software는 malicious하지 않지만, insecure programming 때문에 `code injection`의 통로가 될 수 있다. Code injection은 executable code가 추가되거나 기존 code flow가 변조되어 attacker가 program behavior를 장악하는 class다. 특히 C/C++처럼 direct memory access와 manual buffer management를 허용하는 low-level languages에서 memory corruption이 발생할 수 있다.

가장 단순한 vector가 `buffer overflow`다. Bounds checking 없이 input을 fixed-size buffer에 copy하면 input length가 buffer size를 넘어 주변 memory를 덮을 수 있다.

![Buffer overflow condition](@/assets/images/cs-operating-system-323-figure-16-2-page-762.png)
<p align="center"><sub>Figure 16.2 · PDF p. 762 · buffer size를 고려하지 않는 copy가 overflow condition을 만드는 C program 예</sub></p>

Figure 16.2의 핵심은 특정 함수 이름 암기가 아니라, memory buffer size를 확인하지 않는 unbounded copy가 undefined behavior와 memory corruption을 만들 수 있다는 점이다. Size-aware function을 사용하더라도 integer overflow나 잘못된 arithmetic이 결합되면 vulnerability가 남을 수 있다.

Overflow outcome은 overflow length, contents, compiler-generated layout, padding, stack frame layout에 따라 달라진다.

![Possible buffer overflow outcomes](@/assets/images/cs-operating-system-324-figure-16-3-page-763.png)
<p align="center"><sub>Figure 16.3 · PDF p. 763 · padding, stack variables, return address까지 overflow 범위가 커질수록 피해가 커지는 구조</sub></p>

작은 overflow는 padding 영역에 머물러 겉으로 드러나지 않을 수 있다. Padding을 넘으면 stack의 다른 automatic variable이 overwritten되어 logical condition이 subverted되거나 crash가 날 수 있다. 더 큰 overflow가 current function stack frame과 return address까지 덮으면, program control flow가 attacker-controlled memory region으로 redirect될 수 있다.

![Trampoline to code execution](@/assets/images/cs-operating-system-325-figure-16-4-page-764.png)
<p align="center"><sub>Figure 16.4 · PDF p. 764 · overwritten control-flow pointer가 attacker-supplied code로 execution을 이동시키는 개념적 흐름</sub></p>

Figure 16.4는 code injection의 conceptual danger를 보여 준다. 공격의 상세 절차보다 중요한 것은, injected code가 attacked process의 effective ID로 실행될 수 있다는 점이다. 즉 compromised process의 privileges가 곧 attack impact를 결정한다. 그래서 least privilege, bounds checking, memory-safe languages, compiler/runtime mitigations, address-space protection, executable memory restrictions가 중요해진다.

Buffer overflow는 allowed communication channels를 통해 remote systems 사이에서도 발생할 수 있다. Protocol input처럼 정상적으로 허용된 data path를 타고 들어오기 때문에 firewall만으로는 막기 어렵다. 또한 heap overflow, `use-after-free`, `double free` 같은 memory management flaws도 code injection으로 이어질 수 있다.

#### 16.2.3 Viruses and Worms

`virus`는 legitimate program에 embedded된 code fragment로, self-replicating하며 다른 programs를 infect하도록 설계된다. Files를 modify/destroy하고, system crashes나 program malfunction을 일으킬 수 있다. `worm`은 network를 사용해 human help 없이 replicate한다는 점에서, 보통 user action이 필요한 virus와 구분된다.

UNIX 같은 multiuser OS는 executable programs가 OS protection으로 write-protected되므로 전통적 file virus에 상대적으로 강하다. 반면 PC 환경에서는 user permissions, application macros, downloaded programs, infected media가 virus propagation의 통로가 되기 쉽다.

Virus 감염 흐름은 보통 `virus dropper`가 system에 virus를 삽입하는 것으로 시작한다. Dropper 자체는 Trojan horse인 경우가 많다. Virus categories는 다음처럼 정리할 수 있다.

| Virus type | 핵심 동작 |
|---|---|
| `file` / parasitic virus | program file에 자신을 append하고 program start를 바꾸어 먼저 실행된 뒤 host program으로 control 반환 |
| `boot` / memory virus | boot sector를 infect하여 OS load 전 실행되고, bootable media를 감시·감염 |
| `macro` virus | Visual Basic 같은 high-level macro language로 작성되어 macro-capable program이 실행할 때 동작 |
| `rootkit` | OS 자체에 infiltrate하여 detection 기능까지 장악할 수 있음 |
| `source code` virus | source code를 찾아 수정해 virus 포함/전파 |
| `polymorphic` virus | 설치될 때마다 signature를 바꿔 antivirus detection 회피 |
| `encrypted` virus | encrypted body와 decryption code를 함께 포함해 detection 회피 |
| `stealth` virus | detection에 쓰이는 system parts를 수정해 infected code 대신 clean view를 반환 |
| `multipartite` virus | boot sectors, memory, files 등 multiple parts를 infect |
| `armored` virus | obfuscation/compression/hidden attributes로 analysis와 disinfection을 어렵게 함 |

![Boot-sector virus](@/assets/images/cs-operating-system-326-figure-16-5-page-767.png)
<p align="center"><sub>Figure 16.5 · PDF p. 767 · boot sector를 대체하고 memory에 숨어 disk activity를 감시하는 boot virus 개념 흐름</sub></p>

Figure 16.5는 boot virus가 OS load 이전에 control을 얻고, original boot sector를 다른 위치로 옮기며, memory에 숨어 disk I/O를 감시하는 개념을 보여 준다. 핵심은 boot path처럼 OS protection이 아직 충분히 활성화되지 않은 시점이 공격 표면이 될 수 있다는 점이다.

원문은 monoculture 논쟁도 언급한다. 많은 systems가 같은 hardware, OS, application stack을 사용하면 하나의 exploit이 영향을 줄 수 있는 systems 수가 커지고 attack value도 커진다. Vulnerability information이 거래되는 환경에서는, 영향을 받는 system 수가 많을수록 attack의 경제적 가치가 커진다.

### 16.3 System and Network Threats

Network에 연결되면 program threats의 위험은 훨씬 커진다. Worldwide connectivity는 worldwide attacks의 통로가 된다. OS가 더 많은 services와 functions를 기본 활성화할수록 exploitable bug가 있을 가능성도 커진다. 그래서 modern OS는 “secure by default” 방향으로 이동한다. 예를 들어 설치 직후 거의 모든 services를 disabled로 두고 administrator가 필요한 것만 enable하게 하면 `attack surface`가 줄어든다.

Attackers는 흔적을 숨기기 위해 `zombie systems`를 자주 사용한다. Zombie는 이미 compromise되었지만 owner에게는 계속 정상 service를 제공하는 system/device다. Attacker는 이를 DoS, spam relay, 다른 attacks의 launch point로 사용한다. 따라서 “중요한 data가 없는 system”도 방치하면 다른 공격의 base가 될 수 있다.

![Standard security attacks](@/assets/images/cs-operating-system-327-figure-16-6-page-769.png)
<p align="center"><sub>Figure 16.6 · PDF p. 769 · normal communication, masquerading, man-in-the-middle attack의 차이</sub></p>

Figure 16.6은 network attack의 세 가지 기본 형태를 보여 준다. Passive attacker는 traffic을 `sniffing`하여 session type이나 contents를 얻고, active attacker는 `spoofing`으로 한 party인 척하거나, `man-in-the-middle`로 양쪽 communication을 중간에서 intercept/modify한다.

#### 16.3.1 Attacking Network Traffic

Network traffic은 기본적으로 많은 intermediate systems를 지나며, Internet protocols는 encryption/authentication을 default로 제공하지 않는다. 따라서 source/destination address만으로 sender/receiver identity를 신뢰하면 안 된다. Spoofed source address, passive eavesdropping, active modification이 가능하기 때문이다.

#### 16.3.2 Denial of Service

`DoS(Denial of Service)`는 information theft보다 legitimate use disruption을 목표로 한다. 침투보다 service 사용을 방해하는 것이 더 쉬운 경우가 많다. DoS는 크게 두 범주다.

| DoS category | 의미 | 예 |
|---|---|---|
| resource exhaustion | facility resources를 소모해 useful work를 못 하게 함 | CPU/memory를 과도하게 쓰는 code, infinite subprocess/thread spawning |
| network disruption | target facility network를 방해 | major websites에 대한 long-running network attack |

`DDoS(Distributed Denial of Service)`는 multiple sites에서 common target으로 동시에 수행된다. 보통 zombies가 사용된다. Prevent가 어려운 이유는 DoS traffic이 정상 operation과 같은 mechanisms를 사용하기 때문이다. 또한 slowdown이 attack인지 legitimate traffic surge인지 구분하기 어려울 수 있다.

DoS는 security mechanism 자체의 부작용으로도 발생할 수 있다. Account lockout이 여러 incorrect attempts 후 계정을 잠그면 attacker가 모든 accounts를 일부러 잠그게 만들 수 있다. Firewall이 자동으로 특정 traffic을 차단한다면, attacker가 정상 traffic까지 차단되게 유도할 수 있다. 따라서 security algorithms를 배치할 때는 abuse cases도 고려해야 한다.

#### 16.3.3 Port Scanning

`port scanning`은 그 자체로 공격이라기보다 vulnerabilities를 찾기 위한 reconnaissance다. Tool이 TCP/IP connection을 시도하거나 UDP packets를 특정 port/range에 보내서 어떤 services가 열려 있는지 조사한다. Security personnel도 불필요하거나 의도치 않은 services를 찾기 위해 사용한다.

`fingerprinting`은 target OS와 services를 추론하는 technique이다. HTTP `Server:`나 `User-Agent:` headers처럼 version numbers를 노출하는 protocol headers, 또는 protocol handler의 idiosyncratic behavior가 OS/service identification에 쓰일 수 있다. Port scanner는 exploit을 직접 수행하지 않을 수 있지만, 이후 vulnerability testing/exploitation tools와 결합될 수 있다.

### 16.4 Cryptography as a Security Tool

Isolated computer에서는 OS가 IPC sender/receiver를 통제할 수 있다. 그러나 network에서는 packet source/destination address를 신뢰할 수 없다. Rogue computer는 source address를 falsify할 수 있고, destination까지 가는 routers 등 여러 systems가 packet을 볼 수 있다. Large-scale network에서 packet addresses를 신뢰 가능한 identity로 만드는 것은 현실적으로 어렵다. 따라서 network를 신뢰하지 않는 방식이 필요하고, 그 역할을 `cryptography`가 맡는다.

Cryptography는 `keys`라는 secrets를 selective distribution하고, keys로 messages를 처리하여 potential senders/receivers를 제한한다. Recipient는 message가 특정 key를 가진 computer에 의해 만들어졌는지 검증할 수 있고, sender는 특정 key를 가진 computer만 message를 decode하도록 만들 수 있다. Key는 messages나 public information에서 computationally feasible하게 유도할 수 없어야 한다.

#### 16.4.1 Encryption

`encryption`은 sender가 message를 특정 key 보유자만 읽을 수 있게 만드는 mechanism이다. Files, database data, disks, network communication 보호에 사용된다. Encryption algorithm은 keys, messages, ciphertexts, encrypting function, decrypting function으로 구성된다.

간단히 쓰면 다음 관계다.

$$
\begin{aligned}
\text{plaintext message } m &\xrightarrow{E_k} \text{ciphertext } c \\
\text{ciphertext } c &\xrightarrow{D_k} \text{plaintext message } m
\end{aligned}
$$

핵심 property는 ciphertext `c`가 공개되어도 key `k`를 모르면 `m`을 계산할 수 없어야 한다는 것이다. Encryption algorithms는 크게 symmetric과 asymmetric으로 나뉜다.

#### 16.4.1.1 Symmetric Encryption

`symmetric encryption`은 같은 key `k`를 encrypt와 decrypt에 모두 사용한다. 따라서 key secrecy가 핵심이다.

![Symmetric encryption over insecure channel](@/assets/images/cs-operating-system-328-figure-16-7-page-774.png)
<p align="center"><sub>Figure 16.7 · PDF p. 774 · insecure channel 위에서도 shared key를 가진 양쪽만 plaintext를 읽는 symmetric encryption 흐름</sub></p>

DES는 과거 널리 쓰인 symmetric block cipher였지만 key length가 짧아 많은 용도에서 insecure하다. Triple DES는 DES를 세 번 적용해 key length를 늘린 변형이다. 현대 표준은 `AES(Advanced Encryption Standard)`이며 128/192/256-bit keys와 128-bit blocks를 사용한다.

Block cipher는 fixed-size block을 처리하므로 긴 message를 직접 다루기 위해 mode나 scheme이 필요하다. `stream cipher`는 byte/bit stream을 encrypt/decrypt하도록 설계되어, key로 pseudo-random bit generator를 구동해 `keystream`을 만들고 plaintext stream과 XOR한다. AES-based cipher suites에도 stream-like operation이 포함된다.

#### 16.4.1.2 Asymmetric Encryption

`asymmetric encryption`은 encryption key와 decryption key가 다르다. Public key는 공개할 수 있고, private key는 비밀로 유지한다. Public key로 encrypt한 data는 corresponding private key로만 decrypt할 수 있다. 이 구조는 key distribution 문제를 크게 완화하지만, computational cost가 symmetric encryption보다 크다. 그래서 large data 일반 암호화에는 symmetric key를 쓰고, asymmetric cryptography는 small data, authentication, key distribution에 주로 사용된다.

![RSA asymmetric cryptography](@/assets/images/cs-operating-system-329-figure-16-8-page-776.png)
<p align="center"><sub>Figure 16.8 · PDF p. 776 · RSA asymmetric cryptography에서 public/private key pair로 encryption/decryption을 수행하는 간단한 수치 예</sub></p>

Figure 16.8은 RSA의 수치 예시지만, 정리에서 중요한 점은 “한 key로 encrypt하고 다른 paired key로 decrypt한다”는 구조다. 실제 cryptographic parameters는 교재 예시처럼 작은 숫자가 아니라 충분히 큰 값과 검증된 library를 사용해야 한다.

#### 16.4.1.3 Authentication

Encryption이 possible receivers를 제한한다면, `authentication`은 possible senders를 제한한다. 또한 message가 modify되지 않았음을 증명하는 데 쓰인다. 여기서 authentication은 user login authentication과 비슷하지만, 이 절에서는 message sender와 message integrity를 검증하는 cryptographic authentication을 뜻한다.

`hash function` `H(m)`은 message `m`에서 fixed-size `message digest` 또는 `hash value`를 만든다. 좋은 hash는 `collision resistant`해야 한다. 즉 다른 message `m'`가 같은 hash를 만들기 어려워야 한다. 다만 hash만으로는 authenticator가 되지 않는다. Attacker가 message를 바꾸고 hash를 다시 계산할 수 있기 때문이다.

`MAC(Message-Authentication Code)`는 secret key로 cryptographic checksum을 만들어 short values를 authenticate한다. Long message는 collision-resistant hash로 digest를 만든 뒤 MAC으로 digest를 authenticate할 수 있다. Symmetric key 기반이므로 MAC을 만들 수 있는 entity와 verify할 수 있는 entity가 같은 key를 공유한다.

`digital signature`는 asymmetric authentication이다. Private key로 signature를 만들고 public key로 verify한다. 누구나 public key로 authenticity를 검증할 수 있지만, private key 없이는 signature를 만들 수 없어야 한다. Code creators가 software patch나 program을 `code signing`하는 것도 이 원리다. Digital signatures는 entity가 action을 했음을 나중에 부인하기 어렵게 하는 `nonrepudiation`의 핵심이기도 하다.

#### 16.4.1.4 Key Distribution

Symmetric encryption은 parties 모두가 같은 key를 가져야 하고, 그 key를 다른 누구도 가지면 안 된다. Out-of-band key exchange는 소규모에서는 가능하지만 scale되지 않는다. N users와 private communication을 하려면 많은 keys와 key rotation이 필요하다.

Asymmetric cryptography는 public key를 공개할 수 있어 scale이 좋아진다. 하지만 public key가 정말 intended entity의 것인지 검증해야 한다. 그렇지 않으면 attacker가 자신의 public key를 끼워 넣는 `man-in-the-middle attack`이 가능하다.

![Man-in-the-middle on asymmetric cryptography](@/assets/images/cs-operating-system-330-figure-16-9-page-779.png)
<p align="center"><sub>Figure 16.9 · PDF p. 779 · attacker가 자신의 public key를 끼워 넣어 encrypted message를 가로채는 man-in-the-middle attack</sub></p>

해결책은 `digital certificate`다. Certificate는 trusted party가 digitally sign한 public key다. `certificate authority(CA)`는 entity의 identity proof를 받고 public key가 그 entity에 속함을 certify한다. Browser나 certificate consumers는 CA public keys를 미리 포함하고 배포된다. CA가 다른 CA의 public key를 sign하는 식으로 `web of trust`가 만들어질 수 있다. Certificates는 표준 `X.509` format으로 배포될 수 있다.

#### 16.4.2 Implementation of Cryptography

Cryptography는 network protocol stack의 여러 layer에 들어갈 수 있다. Lower layer에 넣으면 더 많은 upper protocols가 보호를 받는다. 예를 들어 `IPSec`은 IP packet contents를 encrypt하고 authenticators를 넣어 TCP header modification도 감지할 수 있다. IPSec은 symmetric encryption과 public-key 기반 `IKE(Internet Key Exchange)`를 사용하며, public network 위에 private network처럼 보이는 `VPN(Virtual Private Network)`의 기반으로 널리 쓰인다.

하지만 lower-layer protection만으로는 application-level security가 부족할 수 있다. Server가 IPSec으로 client computer를 authenticate해도, 그 computer의 실제 user를 authenticate하려면 password 같은 application-level protocol이 필요할 수 있다. Email처럼 store-and-forward되는 data는 여러 transports를 거치므로, transport가 아니라 message 자체를 encrypt해야 end-to-end security가 유지된다. `PGP` 같은 application-level cryptography가 이런 사례다.

Encryption은 방어에만 쓰이지 않는다. Ransomware는 cryptography를 악용해 owner data를 inaccessible하게 만든다. 방어는 better system/network security와, key 없이도 files를 restore할 수 있는 well-executed backup plan이다.

#### 16.4.3 An Example: TLS

`TLS(Transport Layer Security)`는 두 computers가 secure communication을 수행하도록 하는 cryptographic protocol이다. Web browsers와 web servers의 secure communication 표준이며, SSL(Secure Sockets Layer)에서 발전했다. TLS는 asymmetric cryptography를 사용해 client/server가 symmetric session key를 안전하게 만들고, 이후 session data는 faster symmetric encryption으로 보호한다. 동시에 man-in-the-middle과 replay attacks를 피하도록 random values, certificates, MACs를 함께 사용한다.

TLS handshake의 핵심 흐름은 다음과 같다.

| 단계 | 의미 |
|---|---|
| 1. Server certificate | Server는 CA가 sign한 certificate를 client에게 제공한다. Certificate에는 server attributes, public key, validity interval, CA signature가 포함된다. |
| 2. Certificate verification | Client는 browser 등에 포함된 CA public verification key로 certificate signature와 validity interval을 확인한다. |
| 3. Premaster secret | Client는 random premaster secret을 만들고 server public key로 encrypt해 보낸다. Server만 private key로 이를 recover할 수 있다. |
| 4. Master secret/session keys | Client와 server는 random values와 premaster secret으로 shared master secret을 계산하고, direction별 encryption/MAC keys를 만든다. |
| 5. Protected communication | Message와 MAC을 함께 encrypt하여 confidentiality와 integrity/authentication을 제공한다. |

TLS의 설계 이유는 asymmetric cryptography의 장점과 symmetric cryptography의 성능을 결합하는 것이다. Asymmetric encryption은 server identity 확인과 shared secret establishment에 사용하고, session data는 symmetric encryption으로 빠르게 처리한다. Session key는 session이 끝나면 버려지고, 다음 communication에서는 새 keys를 만든다. TLS VPN은 IPSec VPN보다 flexible하지만 일반적으로 point-to-point traffic encryption에는 IPSec이 더 efficient할 수 있다.

### 16.5 User Authentication

앞 절의 authentication은 messages/sessions에 관한 것이었다. 그러나 OS protection system은 결국 “현재 실행 중인 programs/processes가 어떤 user에 속하는가”를 알아야 하므로, `user authentication`이 핵심이다. User identity를 authenticate하지 못하면 그 user가 보낸 message를 authenticate하는 것도 의미가 약해진다.

User authentication은 보통 세 범주의 evidence 중 하나 이상에 기반한다.

| 기반 | 예 |
|---|---|
| something you have | key, card, hardware token |
| something you know | user identifier, password, PIN |
| something you are | fingerprint, retina pattern, signature, biometric feature |

#### 16.5.1 Passwords

가장 흔한 방식은 `password`다. User가 user ID/account name으로 자신을 식별하고 password를 제시하면, system은 stored password와 비교해 account owner라고 가정한다.

Passwords는 object protection에도 쓰일 수 있다. 예를 들어 file마다 password를 두고, read/append/update 권한별로 다른 passwords를 둘 수 있다. 이론적으로는 더 많은 passwords가 더 안전할 수 있지만, 실제 systems는 보통 user가 full rights를 얻는 하나의 password를 사용한다. 이유는 security와 convenience의 trade-off 때문이다. 불편한 security는 사용자가 우회하기 쉽다.

#### 16.5.2 Password Vulnerabilities

Passwords가 널리 쓰이는 이유는 이해하고 사용하기 쉽기 때문이다. 하지만 다음 방식으로 compromise될 수 있다.

| Vulnerability | 설명 |
|---|---|
| user-specific guessing | pet/spouse/name 같은 obvious information 사용 |
| `brute force` / enumeration | 가능한 character combinations를 모두 시도 |
| `dictionary attack` | words, word variations, common passwords를 시도 |
| `shoulder surfing` | keyboard 입력을 물리적으로 관찰 |
| network `sniffing` | network monitor로 IDs/passwords를 감청 |
| Trojan/keylogger/skimmer | keystrokes나 physical passcode entry를 capture |
| written/lost password | hard-to-remember passwords가 기록되어 노출 |
| illegal transfer/account sharing | authorized user가 password를 다른 사람에게 넘김 |

Password policy는 균형이 필요하다. 너무 짧고 단순한 password는 brute force/dictionary attack에 약하지만, 너무 자주 바꾸거나 너무 기억하기 어렵게 만들면 users가 기록하거나 재사용한다. Password aging은 오래된 password 사용을 줄이지만, users가 두 password를 번갈아 쓰는 식으로 우회할 수 있다. 그래서 systems는 `password history`를 저장해 최근 N passwords 재사용을 막기도 한다.

#### 16.5.3 Securing Passwords

System이 plaintext password를 저장하면 password file compromise가 곧 전체 compromise로 이어진다. UNIX는 password를 decrypt 가능한 형태로 저장하지 않고 `secure hashing`을 사용한다. Hash function은 계산은 쉽지만 invert하기 어렵다. User가 password를 입력하면 system은 입력값을 hash하고, stored encoded password와 비교한다. Stored hash를 보아도 original password를 복원할 수 없어야 한다.

하지만 hash만으로 충분하지 않다. Attacker가 password file copy를 얻으면 dictionary words를 빠르게 hash해 stored hashes와 비교할 수 있다. 또한 같은 password는 같은 hash를 만들기 때문에, previously cracked password cache도 사용할 수 있다.

이를 줄이기 위해 systems는 `salt`를 사용한다. Salt는 recorded random number로, password와 결합되어 hash된다. 같은 plaintext password라도 salt가 다르면 다른 hash가 나온다. Dictionary attack도 각 dictionary term을 각 salt와 결합해 계산해야 하므로 비용이 크게 증가한다. Newer UNIX는 hashed password entries를 superuser만 읽을 수 있는 file에 저장하고, 비교 program만 `setuid root`로 해당 file을 읽게 한다.

#### 16.5.4 One-Time Passwords

`one-time password`는 password sniffing과 shoulder surfing의 reuse 문제를 줄인다. Challenge-response 방식에서 system은 challenge `ch`를 제시하고, user와 system이 공유하는 secret `pw`를 직접 전송하지 않는다. 대신 user는 `H(pw, ch)`를 계산해 authenticator로 보낸다. System도 같은 computation을 수행해 결과를 비교한다. 다음 authentication에는 다른 challenge가 나오므로 intercepted response를 재사용할 수 없다.

One-time passwords는 hardware token, key-chain dongle, USB device, smartphone app 등으로 구현된다. User가 PIN을 입력해야 token이 correct response를 만들면, 이는 `two-factor authentication`이다. Something you have(token)와 something you know(PIN)가 모두 필요하므로 single-factor password보다 훨씬 강하다.

#### 16.5.5 Biometrics

`biometrics`는 user의 physical/behavioral attribute를 사용한다. Hand readers는 hand geometry, temperature map, line patterns를 비교할 수 있고, fingerprint readers는 ridge patterns를 numerical sequence로 변환해 저장된 sequences와 비교한다. Biometrics는 “무엇을 아는가”가 아니라 “누구인가”를 사용한다는 장점이 있지만, 비용·정확도·privacy·false accept/false reject 문제를 함께 고려해야 한다.

Biometric만으로 모든 문제가 끝나지는 않는다. Password, user name, fingerprint scan을 함께 요구하면 strong two-factor authentication이 될 수 있고, USB device, PIN, fingerprint를 함께 요구하면 multifactor authentication이 된다. 하지만 strong authentication만으로는 충분하지 않다. Authenticated session이 encryption 없이 hijack되면 attacker가 session을 가져갈 수 있다.

### 16.6 Implementing Security Defenses

Threats가 다양하듯 defenses도 다양하다. Security professionals가 자주 사용하는 관점은 `defense in depth`다. House security에서 lock 하나보다 lock+alarm이 나은 것처럼, computing security에서도 여러 layers를 겹쳐야 한다. 이 절의 defenses 중 일부는 Chapter 17의 protection mechanisms와도 겹친다.

#### 16.6.1 Security Policy

Security 개선의 첫 단계는 `security policy`다. Policy는 무엇을 보호하는지, 무엇이 허용되는지, 무엇이 금지되는지, 어떤 control이 필요한지 명시한다. 예를 들어 externally accessible applications는 deployment 전 code review를 거쳐야 한다거나, users는 passwords를 공유하지 않아야 한다거나, external connection points는 6개월마다 port scan을 해야 한다고 정할 수 있다.

Policy가 없으면 users와 administrators는 permissible/required/not allowed를 알 수 없다. Policy는 security roadmap이며, 주기적으로 review/update되어 실제 환경과 맞아야 한다.

#### 16.6.2 Vulnerability Assessment

`vulnerability assessment`는 security policy가 제대로 구현되었는지 확인하는 과정이다. Social engineering, risk assessment, port scans, penetration test 등을 포함할 수 있다. `risk assessment`는 assets value, incident probability, potential loss를 추정해 security effort에 어느 정도 비용을 들일지 판단하게 한다.

Operating-system/software 관점에서 핵심 활동은 `penetration test`다. Known vulnerabilities를 scan한다. Production impact를 줄이기 위해 낮은 사용 시간에 수행하거나 test systems에서 수행한다.

System-level scan은 다음 항목을 확인할 수 있다.

| Scan item | 보안 의미 |
|---|---|
| short/easy passwords | guessing/dictionary attack 위험 |
| unauthorized privileged programs | unexpected `setuid` 등 privilege escalation 위험 |
| unauthorized system-directory programs | system path compromise 가능성 |
| unexpectedly long-running processes | hidden daemon/malware 가능성 |
| improper directory/file protections | user/system files, password file, device files, kernel 보호 실패 |
| dangerous search path entries | current directory, writable `/tmp` 등이 Trojan horse 실행으로 이어질 수 있음 |
| checksum changes | system programs tampering 탐지 |
| hidden network daemons | unauthorized remote access service 가능성 |

Network vulnerability scans는 responding ports를 찾고, 불필요한 services를 disable/block하며, listening application details와 known vulnerabilities를 확인한다. 같은 tools는 defender와 attacker 모두 사용할 수 있다. `security through obscurity`는 유일한 방어가 되어서는 안 되지만, network configuration 같은 정보를 굳이 공개하지 않는 것은 defense layer 중 하나가 될 수 있다.

#### 16.6.3 Intrusion Prevention

`intrusion prevention`은 attempted/successful intrusions를 detect하고 response를 시작하는 기술이다. Detection 시점은 real time일 수도 있고 after the fact일 수도 있다. Inputs는 shell commands, process system calls, network packet headers/contents 등이 될 수 있다. Response는 administrator alert, suspicious process kill, traffic block, `honeypot`으로 diversion 등 다양하다.

`IPS(Intrusion-Prevention System)`는 self-modifying firewall처럼 동작할 수 있다. 평소에는 traffic을 pass하고, intrusion이 detect되면 해당 traffic을 block한다. 자동 IPS는 보통 두 접근을 사용한다.

| Detection approach | 핵심 아이디어 | 장점 | 한계 |
|---|---|---|---|
| `signature-based detection` | known attack patterns/signatures를 찾음 | known attacks에 명확하고 efficient | unknown/zero-day attacks에 약함 |
| `anomaly detection` | normal behavior에서 벗어난 activity를 찾음 | unknown methods 탐지 가능 | normal benchmark가 어렵고 false alarms/false negatives 위험 |

False alarms는 실제 운영에서 매우 큰 문제다. Audit records가 하루에 백만 개 생성되고 실제 intrusive records가 극히 적으면, false-alarm rate가 아주 낮아 보여도 alarms 대부분이 실제 intrusion이 아닐 수 있다. 원문은 Bayes’ theorem으로 이를 설명한다.

$$
P(I \mid A) = \frac{P(I)P(A \mid I)}{P(I)P(A \mid I) + P(\text{not } I)P(A \mid \text{not } I)}
$$

여기서 $P(I \mid A)$는 alarm이 울렸을 때 실제 intrusion일 확률이다. 실제 intrusions가 매우 희귀하면 $P(A \mid \text{not } I)$가 작아도 false positives가 alarms를 압도할 수 있다. 이로 인해 administrator가 alarms를 무시하게 되는 `Christmas tree effect`가 생긴다. 따라서 usable IPS/IDS는 extremely low false-alarm rate가 필요하다.

#### 16.6.4 Virus Protection

Antivirus programs는 known virus instruction patterns를 찾아 제거하는 방식에서 시작했다. 현대 antivirus는 단일 signature matching뿐 아니라 families of patterns, compressed virus decompression, process anomaly detection, sandbox execution, boot sectors/memory/email/download/removable media scanning 등을 결합한다.

가장 좋은 virus defense는 safe computing이다. Trusted sources에서 software를 받고, pirated/free unknown software와 suspicious attachments를 피하며, macro-capable documents는 조심해야 한다. Code signing과 sandboxing도 infection risk를 줄인다. 하지만 legitimate software나 hardware도 supply-chain compromise 가능성이 있으므로, 단일 방어에 의존하면 안 된다.

#### 16.6.5 Auditing, Accounting, and Logging

`auditing`, `accounting`, `logging`은 performance cost가 있지만 security에 유용하다. 모든 system calls를 log할 수도 있고, 보통은 suspicious events를 log한다. Authentication failures, authorization failures는 break-in attempts를 파악하는 데 중요하다. Accounting logs는 performance changes나 anomaly를 통해 security problem을 드러낼 수 있다.

#### 16.6.6 Firewalling to Protect Systems and Networks

`firewall`은 trusted systems와 untrusted network 사이에 위치해 access를 제한·감시·기록한다. Source/destination address, source/destination port, connection direction을 기준으로 허용/차단할 수 있다. 예를 들어 web server에는 외부에서 HTTP만 허용하고, finger 같은 위험한 protocols는 차단할 수 있다.

![Domain separation via firewall](@/assets/images/cs-operating-system-331-figure-16-10-page-794.png)
<p align="center"><sub>Figure 16.10 · PDF p. 794 · Internet, DMZ, company computers를 firewall로 분리해 trust domains를 나누는 구조</sub></p>

Figure 16.10의 구조는 three-domain separation이다. Internet은 untrusted, `DMZ(demilitarized zone)`는 semitrusted/semisecure, company computers는 trusted domain이다. Internet은 DMZ web servers에 접근할 수 있지만 company computers에는 접근하지 못한다. DMZ system이 compromise되어도 내부 company computers로 바로 들어가지 못하게 containment를 제공한다.

Firewall에도 한계가 있다. Firewall 자체가 secure해야 하고, allowed protocol 안에 tunnel된 attacks는 막기 어렵다. HTTP가 허용되어 있으면 web server에 대한 buffer-overflow payload가 HTTP connection 안에 들어올 수 있다. DoS는 firewall도 대상으로 삼을 수 있고, IP address 기반 rules는 spoofing에 취약할 수 있다.

Firewall variants는 다음과 같다.

| Firewall type | 역할 |
|---|---|
| network firewall | security domains 사이 network traffic 제한/감시 |
| `personal firewall` | 특정 host로 들어오거나 나가는 communication 제한 |
| `application proxy firewall` | SMTP 등 application protocol을 이해하고 command/traffic을 검사 |
| protocol-specific firewall | XML firewall처럼 특정 protocol payload를 검사 |
| `system-call firewall` | applications와 kernel 사이에서 system calls를 감시·제한 |

#### 16.6.7 Other Solutions

`ASLR(Address Space Layout Randomization)`은 stack/heap 같은 address space locations를 unpredictable하게 배치해 code-injection exploitation을 어렵게 한다. 완벽하지는 않지만, memory layout predictability에 의존하는 attacks의 비용을 높인다.

Mobile OS에서는 user data와 system files를 separate partitions로 두고, system partition을 read-only로 mount하는 방식이 흔하다. System files tampering을 어렵게 만들어 integrity를 높인다. Android는 `dm-verity`로 system partition을 cryptographic hash하여 modifications를 detect한다.

#### 16.6.8 Security Defenses Summarized

Defense layers는 다음처럼 정리할 수 있다.

| Defense layer | 핵심 내용 |
|---|---|
| user education | phishing/social engineering, unknown devices, password sharing 위험 교육 |
| secure communication | 가능하면 encrypted/authenticated communication 사용 |
| physical protection | hardware와 facility 보호 |
| OS hardening | unused services disable, attack surface 최소화 |
| secure configuration | daemons, privileged applications, services를 안전하게 구성 |
| patching | modern hardware/software 사용, systems/applications 최신 상태 유지 |
| trusted software | trusted/code-signed applications만 실행 |
| logging/auditing | events 기록, periodic review, automated alerts |
| antivirus/IPS/firewall | malware, intrusion, network attacks 방어 |
| vulnerability assessment | periodic testing과 incident response 점검 |
| encryption | mass-storage devices와 중요한 individual files encrypt |
| policy | security policy 수립·유지 |

### 16.7 An Example: Windows 10

Windows 10 security model은 `user accounts`를 기반으로 한다. User accounts는 groups로 묶일 수 있고, system objects에 대한 access는 허용/거부될 수 있다. User는 unique `SID(Security ID)`로 식별된다.

User가 log on하면 Windows 10은 `security access token`을 만든다. Token에는 user SID, user가 속한 groups의 SIDs, special privileges list가 들어 있다. Backup files/directories, shutdown, interactive logon, system clock 변경 같은 privileges가 예다. User behalf로 실행되는 processes는 access token copy를 받고, system은 object access 시 token의 SIDs로 allow/deny를 결정한다.

Windows 10은 `subject` 개념으로 user가 실행한 program이 user authorization보다 더 큰 access를 얻지 못하게 한다. Subject는 user access token과 user behalf로 동작하는 program으로 구성된다. Client-server model에서는 simple subjects와 server subjects가 구분된다. Server subject는 client behalf로 행동할 때 client security context를 사용한다.

Auditing은 Windows 10에서도 중요한 defense다. Login/logoff failure auditing은 random password break-in을 탐지하고, success auditing은 unusual hours login을 볼 수 있게 한다. Executable files에 대한 write-access auditing은 virus outbreak를 추적하는 데 도움이 되고, sensitive file access auditing은 중요한 data access를 감시한다.

Windows의 `mandatory integrity control`은 securable object와 subject에 integrity label을 부여한다. Subject가 object에 접근하려면 discretionary access-control list permission을 만족해야 할 뿐 아니라, integrity label도 operation에 충분해야 한다. Labels에는 untrusted, low, medium, high, system 등이 있고, lower-integrity subject가 higher-integrity object에 write하지 못하게 하는 `NoWriteUp`이 자동 enforce된다.

`UAC(User Account Control)`는 administrative account를 normal usage token과 elevated usage token으로 나눈다. Normal token은 Administrators group이 disabled되고 medium integrity를 가지며, elevated token은 Administrators group enabled와 high integrity를 가진다. 이는 everyday execution을 least privilege에 가깝게 만들기 위한 장치다.

Windows object의 security attributes는 `security descriptor`가 설명한다. Security descriptor는 owner SID, group SID, `DACL(discretionary access-control list)`, `SACL(system access-control list)`, optional integrity information을 포함한다. `ACL`은 `ACE(access-control entry)`들로 구성되고, 각 ACE는 SID와 access mask를 가진다. Windows files는 ReadData, WriteData, AppendData, Execute, ReadExtendedAttribute, WriteExtendedAttribute, ReadAttributes, WriteAttributes 같은 fine-grained access types를 가질 수 있다.

Windows objects는 container objects와 noncontainer objects로도 구분된다. Directories 같은 container objects 안에 object가 생성되면 기본적으로 parent permissions를 inherit한다. Copy된 file은 destination directory permissions를 inherit할 수 있다. Existing files/subdirectories는 parent directory permission 변경이 자동 적용되지 않을 수 있고, 사용자가 명시적으로 적용해야 할 수 있다.

Windows 10은 많은 security features를 제공하지만, 모든 기능이 default로 켜져 있는 것은 아니다. 또한 boot time에 시작되는 services와 설치 applications 수가 많으면 attack surface가 커진다. 따라서 실제 multiuser environment에서는 administrator가 security plan을 세우고 Windows-provided features와 external security tools를 함께 사용해야 한다. Code signing도 중요한 차별점이다. 일부 Windows 10 versions는 properly signed applications만 실행하게 할 수 있다.

### 16.8 Summary

Protection은 internal mechanisms 중심이고, security는 system이 사용되는 environment까지 포함한다. Data는 unauthorized access, malicious destruction/alteration, accidental inconsistency introduction에서 보호되어야 한다. Malicious abuse에 대한 absolute protection은 불가능하지만, attacker cost를 높여 대부분의 unauthorized attempts를 deter할 수 있다.

Program attacks에는 stack/buffer overflow, malware, viruses, worms, DoS 등이 포함된다. Buffer overflow는 attacker가 system access level을 바꾸게 할 수 있고, viruses/malware는 human interaction이 필요한 경우가 많으며, worms는 self-perpetuating한다. DoS는 target systems의 legitimate use를 방해한다.

Cryptography는 data receivers와 senders를 제한한다. Encryption은 confidentiality를 제공하고, authentication과 hashing은 data modification 여부와 sender identity를 검증한다. Symmetric encryption은 shared key를 요구하고, asymmetric encryption은 public/private key를 사용한다.

User authentication은 legitimate users를 식별한다. Password 외에도 one-time passwords, two-factor authentication, multifactor authentication, biometrics가 사용된다. One-time passwords는 replay attacks를 줄이고, two-factor/multifactor methods는 authentication forgery 가능성을 크게 낮춘다.

Security incidents를 막거나 탐지하는 방법에는 up-to-date security policy, intrusion-detection/prevention systems, antivirus software, auditing/logging, system-call monitoring, code signing, sandboxing, firewalls, vulnerability assessment, encryption, patching, user education이 있다.

## 연결 관계

- Chapter 17 Protection은 Chapter 16 Security를 구현하기 위한 access-control mechanisms를 자세히 다룬다. Security goal이 있다면 protection mechanism이 이를 enforce한다.
- Chapter 6 Synchronization과 consistency semantics는 shared resources를 안전하게 조정한다는 점에서 연결된다. 다만 security는 malicious actors를 가정한다.
- Chapter 12 I/O와 Chapter 15 File-System Internals는 storage/network/file sharing attack surface를 제공한다. Firewall, NFS, storage encryption, audit logs는 이 계층과 맞닿아 있다.
- Chapter 19 Networks and Distributed Systems는 DNS, TLS, IPSec, NFS, DDoS, distributed authentication의 배경이다.
- Chapter 9-10 Memory Management는 buffer overflow, ASLR, memory protection과 연결된다. Memory protection이 없으면 secure OS를 만들 수 없다.

## 오해하기 쉬운 내용

- `security`와 `protection`은 같은 말이 아니다. Protection은 access-control mechanisms이고, security는 system/data integrity를 지키는 broader confidence 문제다.
- Cryptography는 security를 자동으로 완성하지 않는다. Key distribution, certificate trust, endpoint compromise, user authentication, backup 같은 문제가 남는다.
- Firewall은 모든 attack을 막지 못한다. Allowed protocol 안에 들어온 malicious payload, spoofing, DoS, compromised DMZ host 문제는 별도 방어가 필요하다.
- Strong password policy가 항상 더 안전한 것은 아니다. 너무 불편하면 users가 적어 두거나 재사용해 security가 약해질 수 있다.
- Hash는 encryption이 아니다. Stored password hash는 decrypt되는 것이 아니라, 입력 password를 다시 hash해 비교한다.
- NFS/TLS 같은 network protocols의 authentication과 OS login의 user authentication은 연결되지만 같은 문제가 아니다.
- Signature-based detection은 unknown attack에 약하고, anomaly detection은 false alarms 관리가 어렵다. 어느 하나가 절대 우월한 것이 아니라 조합이 필요하다.
- Biometrics는 유출되면 password처럼 쉽게 바꿀 수 없고, authenticated session hijacking을 막으려면 communication encryption이 필요하다.

## 면접 질문

1. Security와 protection의 차이를 OS 관점에서 설명하라.
2. Confidentiality, integrity, availability 각각의 breach 예를 들어 설명하라.
3. Masquerading, replay attack, man-in-the-middle attack, privilege escalation을 구분하라.
4. Four-layered security model에서 physical, network, OS, application layer가 각각 왜 필요한지 설명하라.
5. Principle of least privilege가 malware 피해를 줄이는 이유를 설명하라.
6. Buffer overflow가 왜 control-flow hijacking으로 이어질 수 있는지 개념적으로 설명하라.
7. Virus와 worm의 차이, rootkit이 특히 위험한 이유를 설명하라.
8. DoS/DDoS가 예방하기 어려운 이유를 정상 traffic과의 구분 문제로 설명하라.
9. Symmetric encryption과 asymmetric encryption의 장단점과 TLS가 둘을 함께 쓰는 이유를 설명하라.
10. Hash, MAC, digital signature, certificate의 역할을 비교하라.
11. Password file을 plaintext가 아니라 salted hash로 저장하는 이유를 설명하라.
12. One-time password와 two-factor authentication이 replay/credential theft 위험을 줄이는 방식을 설명하라.
13. Signature-based detection과 anomaly detection의 trade-off를 false positive/zero-day attack 관점에서 비교하라.
14. Firewall, DMZ, application proxy firewall, system-call firewall의 방어 범위를 비교하라.
15. Windows 10의 security access token, SID, ACL, integrity label, UAC가 access control에 어떻게 연결되는지 설명하라.
