---
title: "Chapter 17. Protection"
order: 17
pubDatetime: 2026-05-13T00:17:00+09:00
modDatetime: 2026-05-13T00:17:00+09:00
description: "Chapter 17. Protection 정리 노트입니다."
tags:
  - CS
  - OperatingSystem
---

# Chapter 17. Protection

- 과목: Operating System
- 기준 교재: Operating System Concepts 10th
- 관련 페이지: PDF pp. 803-833
- 우선순위: 심화

## 개요

Chapter 16이 system과 data를 공격으로부터 지키는 broad security 문제를 다뤘다면, Chapter 17은 그 security 목표를 OS 내부에서 enforce하기 위한 `protection` mechanisms를 다룬다. Protection은 processes/users가 files, memory segments, CPU, networking, devices 같은 system resources에 접근하는 방식을 통제한다.

핵심은 두 가지다. 첫째, 어떤 subject가 어떤 object에 어떤 operation을 수행할 수 있는지 명확히 specify해야 한다. 둘째, OS와 hardware가 그 규칙을 실제로 enforce해야 한다. 이 장은 protection domains, access matrix, access lists, capabilities, revocation, RBAC/MAC, sandboxing, code signing, language-based protection을 하나의 access-control 흐름으로 연결한다.

## 핵심 개념

| 개념 | 핵심 의미 |
|---|---|
| `protection` | processes/users/programs가 system resources에 접근하는 방식을 specify하고 enforce하는 OS mechanisms. |
| `policy`, `mechanism` | 무엇을 허용/금지할지 결정하는 규칙과, 그것을 어떻게 구현·강제할지의 수단. |
| `principle of least privilege` | task 수행에 필요한 최소 privileges만 program/user/system에 부여해야 한다는 원칙. |
| `compartmentalization` | component별 permissions/access restrictions를 두어 한 부분이 compromise되어도 피해 확산을 막는 설계. |
| `audit trail` | allowed accesses에서 벗어난 행동이나 attack evidence를 추적할 수 있게 남기는 system log record. |
| `protection ring` | hardware-supported privilege separation model. Inner ring일수록 더 강한 privileges를 갖는다. |
| `kernel mode`, `user mode`, `hypervisor`, `TrustZone` | privileged execution levels의 대표 예. Kernel, user processes, virtual machine managers, trusted execution environment를 분리한다. |
| `gate`, `syscall`, `trap`, `interrupt` | user level에서 더 privileged ring으로 통제된 entry path를 제공하는 mechanisms. |
| `protection domain`, `object`, `access right` | process가 접근 가능한 objects와 operations의 집합, resource abstraction, `<object, rights-set>` 형태 권한. |
| `need-to-know principle` | process가 현재 task 수행에 필요한 objects에만 접근해야 한다는 정책. |
| `domain switching` | process가 실행 중 필요에 따라 다른 protection domain으로 이동하는 mechanism. |
| `setuid bit` | UNIX executable 실행 시 process가 file owner identity를 temporary로 assume하게 하는 domain/privilege transition mechanism. |
| `Android UID/GID isolation` | application마다 별도 UID/GID와 private data directory를 부여해 app 간 isolation을 구현하는 방식. |
| `access matrix` | rows는 domains, columns는 objects, entries는 access rights set으로 표현하는 abstract protection model. |
| `switch`, `copy`, `owner`, `control` | access matrix에서 domain switching과 권한 전파·추가·삭제·row control을 표현하는 special rights. |
| `confinement problem` | object 안의 information이 execution environment 밖으로 migrate하지 않음을 보장하는 문제. 일반적으로 해결 불가능하다. |
| `global table`, `access list`, `capability list`, `lock-key mechanism` | access matrix를 실제로 구현하는 대표 방식. |
| `capability` | object physical name/address와 allowed operations를 담는 protected pointer-like authority. |
| `revocation` | 이미 부여된 access rights를 회수하는 문제. Access list에서는 쉽고 capability에서는 어렵다. |
| `RBAC`, `role`, `privilege` | user가 role을 assume하고 role에 부여된 privileges로 task를 수행하게 하는 role-based access control. |
| `DAC`, `MAC`, `label` | owner discretion 기반 access control과, root도 우회할 수 없는 system policy/label 기반 mandatory access control. |
| `Linux capabilities` | root 권한을 여러 fine-grained capability bits로 나누어 process/thread별로 필요한 privilege만 허용하는 방식. |
| `Darwin entitlements` | app이 필요한 permissions를 XML property list로 선언하고, code signature에 포함해 검증하는 Apple capability-style model. |
| `SIP(System Integrity Protection)` | macOS/Darwin에서 root조차 system files/resources를 임의 변경하지 못하게 하는 global protection mechanism. |
| `system-call filtering`, `SECCOMP-BPF` | system-call gate 또는 arguments에서 process별 허용 system calls를 제한하는 protection mechanism. |
| `sandboxing`, `sandbox profile` | process를 제한된 execution environment에 가두어 허용된 operations 밖으로 나가지 못하게 하는 방식. |
| `code signing` | program/executable에 digital signature와 cryptographic hash를 붙여 source와 integrity를 확인하는 방식. |
| `language-based protection` | programming language의 type, object, compiler/runtime mechanisms로 application-level protection policy를 표현·강제하는 방식. |
| `compiler-based enforcement` | protection requirement를 language declaration으로 표현하고 compiler가 static check 또는 protection code generation으로 enforce하는 방식. |
| `software capability`, `seal`, `unseal` | language level에서 data structure 접근을 capability처럼 제어하기 위한 abstraction. |
| `JVM protection domain` | Java class가 loaded URL과 digital signature에 따라 배정되는 permissions 집합. |
| `stack inspection`, `doPrivileged`, `checkPermissions()` | Java runtime이 call stack을 검사해 protected resource 접근을 허용하거나 `AccessControlException`을 발생시키는 mechanism. |
| `type safety` | class가 integer를 pointer처럼 쓰거나 array 밖을 쓰거나 arbitrary memory에 접근하지 못하게 하는 Java protection의 기반. |

## 세부 정리

### 17.1 Goals of Protection

Protection은 원래 multiprogramming OS에서 untrustworthy users가 file directory 같은 common logical namespace 또는 memory 같은 common physical namespace를 안전하게 공유하도록 돕기 위해 등장했다. 현대에는 Internet 같은 insecure communication platform에 연결된 complex systems의 reliability를 높이는 핵심 구조가 되었다.

Protection이 필요한 이유는 malicious user가 access restriction을 의도적으로 깨는 것을 막기 위해서만이 아니다. 더 일반적으로는 각 process가 system resources를 stated policies와 consistent한 방식으로만 사용하도록 보장해야 한다. 이는 reliable system의 절대 조건이다.

Protection은 component subsystems 사이 interface errors를 조기에 detect해 reliability를 높인다. Faulty subsystem이 healthy subsystem을 오염시키기 전에 access violation을 잡아낼 수 있기 때문이다. 또한 unprotected resource는 unauthorized 또는 incompetent user의 misuse를 스스로 막을 수 없다.

Protection의 역할은 resource use policies를 enforce하는 mechanism을 제공하는 것이다. Policy는 system design에 fixed될 수도 있고, system management가 정할 수도 있으며, individual users가 자신이 owned한 resources를 보호하기 위해 정의할 수도 있다. 따라서 protection system은 다양한 policies를 enforce할 수 있을 만큼 flexible해야 한다.

여기서 `policy`와 `mechanism`의 분리가 중요하다.

| 구분 | 의미 | 왜 분리하는가 |
|---|---|---|
| `policy` | 무엇을 허용/금지할지 결정 | 장소·시간·application에 따라 바뀔 수 있음 |
| `mechanism` | policy를 어떻게 구현하고 enforce할지 결정 | policy 변경마다 OS mechanism을 바꾸지 않기 위해 general하게 설계 |

### 17.2 Principles of Protection

Protection의 대표 원칙은 `principle of least privilege`다. Program, user, system은 task 수행에 필요한 privileges만 가져야 한다. Root/administrator 권한으로 항상 실행하면 human error나 malicious attack의 피해가 system 전체로 확산될 수 있다.

Least privilege가 중요한 이유는 공격을 완전히 막지 못하더라도 피해 범위를 줄일 수 있기 때문이다. 예를 들어 root-privileged process가 buffer overflow로 compromise되면 catastrophic할 수 있지만, limited privileges의 process라면 permissions가 일부 damaging operations를 차단할 수 있다. 이런 의미에서 permissions/protections는 OS-level immune system처럼 동작한다.

`compartmentalization`은 least privilege의 파생 원칙으로 볼 수 있다. 각 system component를 specific permissions/access restrictions로 보호하여 한 component가 subverted되어도 다음 line of defense가 system-wide compromise를 막는다. DMZ, virtualization, sandboxing 같은 구조가 이 원칙과 연결된다.

Access restrictions는 security뿐 아니라 `audit trail` 생성에도 중요하다. Audit trail은 system logs에 남는 hard record로, allowed access에서 벗어난 activity를 추적한다. 잘 관리되면 attack early warning이나 attack vector/damage assessment에 도움이 된다.

단일 원칙은 panacea가 아니다. `defense in depth`가 필요하다. Multiple layers of protection을 겹쳐야 하고, attacker도 여러 bypass techniques를 사용하므로 보호와 공격은 계속 arms race를 이룬다.

### 17.3 Protection Rings

Modern OS의 핵심 component인 kernel은 system resources와 hardware access를 관리한다. Kernel은 trusted/privileged component이므로 user processes보다 높은 privilege level에서 실행되어야 한다. 이 privilege separation에는 hardware support가 필요하다.

`protection rings` model은 execution levels를 concentric rings로 정의한다. Inner ring일수록 더 많은 privileges를 갖고, ring 0은 full privileges를 제공한다.

![Protection-ring structure](@/assets/images/cs-operating-system-332-figure-17-1-page-806.png)
<p align="center"><sub>Figure 17.1 · PDF p. 806 · ring 0이 가장 privileged하고 바깥 ring으로 갈수록 제한되는 protection-ring 구조</sub></p>

System boot는 가장 privileged level에서 시작해 initialization을 수행한 뒤 less privileged level로 내려간다. 다시 higher privilege level로 돌아가려면 `gate` 역할의 special instruction을 호출해야 한다. Intel의 `syscall` instruction은 user mode에서 kernel mode로 통제된 진입을 제공한다. System call은 caller가 arbitrary kernel address를 지정하지 못하게 하고, predefined address와 restricted code path로만 execution을 이동시킨다.

`trap`이나 `interrupt`도 higher-privilege ring으로 execution을 이동시킬 수 있다. 그러나 이 경우에도 execution path는 predefined되고 guarded된다. 중요한 점은 privilege 상승 경로가 “열려 있는 jump”가 아니라 “OS/hardware가 정한 좁은 entry path”라는 것이다.

Intel architecture는 user mode code를 ring 3, kernel mode code를 ring 0에 둔다. EFLAGS register의 bits로 privilege를 구분하고, ring 3에서는 해당 register access가 제한되어 malicious process가 임의로 privilege를 올릴 수 없다. Virtualization 이후 Intel은 hypervisor/virtual machine manager를 위해 guest OS kernel보다 더 강한 ring -1도 정의했다.

ARM architecture는 user/kernel mode에서 출발해 TrustZone과 exception levels로 확장되었다.

![Android uses of TrustZone](@/assets/images/cs-operating-system-333-figure-17-2-page-807.png)
<p align="center"><sub>Figure 17.2 · PDF p. 807 · Android에서 TrustZone이 password/key handling 같은 민감 기능을 kernel보다 더 trusted context에 두는 구조</sub></p>

TrustZone은 kernel조차 직접 읽을 수 없는 hardware-backed cryptographic features와 on-chip key를 제공한다. Kernel은 `SMC(Secure Monitor Call)` 같은 specialized instruction으로 TrustZone service를 요청할 뿐, TrustZone 내부 address로 직접 실행을 이동할 수 없다. Kernel이 compromise되어도 key가 kernel memory에 노출되지 않으므로 brute-force 제한, key verification 같은 민감 기능을 더 안전하게 둘 수 있다.

![ARM architecture](@/assets/images/cs-operating-system-334-figure-17-3-page-808.png)
<p align="center"><sub>Figure 17.3 · PDF p. 808 · ARMv8 exception levels에서 user, kernel, hypervisor, secure monitor가 서로 다른 privilege level에 위치하는 구조</sub></p>

ARMv8은 `EL0` user mode, `EL1` kernel mode, `EL2` hypervisor, `EL3` secure monitor를 제공한다. Secure monitor는 general-purpose kernel보다 높은 execution level이므로 kernel integrity checking 같은 기능을 배치하기에 적합하다.

### 17.4 Domain of Protection

Protection rings는 domains를 hierarchical하게 정렬한 모델이다. 더 일반적으로는 hierarchy 없이 `protection domains`를 사용할 수 있다. Computer system은 processes와 objects의 collection으로 볼 수 있다. `objects`는 CPU, memory segments, printers, disks 같은 hardware objects뿐 아니라 files, programs, semaphores 같은 software objects도 포함한다.

각 object는 unique name을 가지며, well-defined and meaningful operations를 통해서만 접근된다. CPU는 execute, memory words는 read/write, DVD-ROM은 read, tape drives는 read/write/rewind, data files는 create/open/read/write/close/delete 같은 operations를 가진다.

Process는 authorization을 가진 objects에만 접근해야 하며, 동시에 현재 task 수행에 필요한 objects에만 접근할 수 있어야 한다. 두 번째 요구가 `need-to-know principle`이다. Need-to-know는 policy에 가깝고, least privilege는 이를 달성하는 mechanism이라고 볼 수 있다.

예를 들어 compiler를 실행하는 process는 compile 대상 source file, output object file, 필요한 compiler private files 정도에만 접근해야 한다. Process의 다른 arbitrary files에는 접근하지 못해야 하며, 반대로 caller process도 compiler private accounting/optimization files를 읽지 못해야 한다.

#### 17.4.1 Domain Structure

`protection domain`은 process가 access할 수 있는 resources를 지정한다. 각 domain은 objects와 각 object에 대해 허용된 operations의 set을 정의한다. 어떤 operation을 object에 수행할 수 있는 능력이 `access right`다. Domain은 access rights의 collection이며, 각 right는 `<object-name, rights-set>` 형태다.

![System with three protection domains](@/assets/images/cs-operating-system-335-figure-17-4-page-809.png)
<p align="center"><sub>Figure 17.4 · PDF p. 809 · 세 protection domains가 서로 다른 objects/operations access rights를 갖고 일부 권한을 공유하는 예</sub></p>

Figure 17.4에서 domain D2와 D3는 `<O4, {print}>` right를 공유하므로 둘 다 O4를 print할 수 있다. 반면 O1을 read/write하려면 D1에서 실행되어야 하고, O1을 execute하려면 D3에서 실행되어야 한다.

Process와 domain의 association은 static일 수도 있고 dynamic일 수도 있다. Static association에서는 process lifetime 동안 resources set이 고정된다. 그러나 need-to-know를 지키려면 phase별로 필요한 rights만 있어야 하므로 domain contents를 바꿀 mechanism이 필요하다. Dynamic association에서는 process가 domain switching을 통해 다른 domain으로 이동할 수 있다. Domain contents를 바꿀 수 없다면, changed content를 가진 새 domain을 만들고 그 domain으로 switch하는 방식으로 같은 효과를 낼 수 있다.

Domain은 여러 방식으로 실현될 수 있다.

| Domain realization | 의미 | Domain switching |
|---|---|---|
| each user as domain | accessible objects가 user identity에 따라 결정 | user logout/login |
| each process as domain | accessible objects가 process identity에 따라 결정 | process 간 message/send-wait |
| each procedure as domain | procedure local variables/formal parameters 중심 | procedure call |

Dual-mode OS의 kernel/user mode도 domain 분리의 단순한 예다. Kernel mode는 privileged instructions와 full control을 갖고, user mode는 nonprivileged instructions와 predefined memory space에 제한된다. 하지만 multiprogrammed OS에서는 users끼리도 보호되어야 하므로 두 domain만으로는 부족하다.

#### 17.4.2 Example: UNIX

UNIX에서 root user는 privileged commands를 실행할 수 있고 일반 users는 그렇지 않다. 그러나 password 변경처럼 일반 user가 제한적으로 privileged resource에 접근해야 하는 상황이 있다. Password database(`/etc/shadow`) 접근은 root 권한이 필요하지만, 모든 user에게 root 권한을 줄 수는 없다.

이를 해결하는 것이 `setuid bit`다. Executable file에 setuid bit가 enabled되어 있으면, 그 file을 실행하는 process는 실행 동안 file owner identity를 temporary로 assume한다. Root-owned setuid binary를 실행하면 제한된 기간 동안 root authority로 특정 operation을 수행할 수 있다.

Setuid는 강력하므로 위험하다. Setuid binaries는 필요한 files만 제한적으로 다루는 `sterile` behavior와, tamperproof/subversion-resistant한 `hermetic` property가 기대된다. Setuid program의 bug는 곧 privilege escalation 통로가 될 수 있다.

#### 17.4.3 Example: Android Application IDs

Android는 application마다 별도의 user ID를 부여한다. App 설치 시 `installd` daemon이 distinct UID/GID를 할당하고, `/data/data/<app-name>` private data directory의 ownership을 그 UID/GID에만 준다. 이 방식은 UNIX가 separate users를 보호하는 것과 비슷한 수준의 application isolation을 간단히 제공한다.

Android는 여기에 kernel modification을 더해 특정 operations를 특정 GID members에게만 허용한다. 예를 들어 networking sockets는 특정 GID가 있어야 사용할 수 있다. 또한 일부 UIDs를 `isolated`로 정의하여 최소한의 services를 제외한 RPC requests를 시작하지 못하게 한다. 즉 Android protection은 UNIX identity model을 application sandboxing에 활용한 사례다.

### 17.5 Access Matrix

Protection의 general model은 `access matrix`로 추상화할 수 있다. Matrix rows는 protection domains, columns는 objects를 나타내고, 각 entry는 access rights set이다. $\text{access}(i, j)$는 domain $D_i$에서 실행 중인 process가 object $O_j$에 수행할 수 있는 operations를 정의한다.

![Access matrix](@/assets/images/cs-operating-system-336-figure-17-5-page-812.png)
<p align="center"><sub>Figure 17.5 · PDF p. 812 · domains와 objects 사이 allowed operations를 matrix entries로 표현하는 access matrix</sub></p>

Figure 17.5에서 D1은 F1과 F3를 read할 수 있고, D4는 F1/F3를 read/write할 수 있다. Printer는 D2에서만 print할 수 있다. Access matrix는 “어떤 policy를 구현할지”를 표현하는 mechanism이며, OS는 process가 row i에 명시된 objects를 해당 entry의 operations로만 접근하게 enforce해야 한다.

Users는 보통 자신이 만든 object의 access-matrix column contents를 결정한다. Object $O_j$가 만들어지면 column $O_j$가 matrix에 추가되고, creator가 필요한 domains에 필요한 rights를 넣는다. Process가 어떤 domain에서 실행될지는 보통 OS policy가 결정한다.

Access matrix는 static/dynamic domain association을 모두 표현할 수 있다. Domain switching도 object operation으로 볼 수 있으므로 domains 자체를 matrix의 objects로 넣을 수 있다.

![Access matrix with domains as objects](@/assets/images/cs-operating-system-337-figure-17-6-page-813.png)
<p align="center"><sub>Figure 17.6 · PDF p. 813 · domains도 objects로 포함해 `switch` right로 domain switching을 통제하는 access matrix</sub></p>

$D_i$에서 $D_j$로 switch하려면 $\text{switch} \in \text{access}(i, j)$여야 한다. Figure 17.6에서는 $D_2$에서 $D_3$ 또는 $D_4$로 switch할 수 있고, $D_4$에서 $D_1$로, $D_1$에서 $D_2$로 switch할 수 있다.

Access matrix entries 자체를 바꾸는 권한도 control되어야 한다. 이를 위해 `copy`, `owner`, `control` rights가 사용된다.

| Special right | 적용 대상 | 의미 |
|---|---|---|
| `copy` | 같은 object column | 어떤 right를 같은 object의 다른 domain entry로 복사 가능 |
| `transfer` | copy 변형 | right를 복사한 뒤 원래 entry에서 제거 |
| `limited copy` | copy 변형 | 복사된 right는 다시 copy 권한 없이 전달 |
| `owner` | object column | 해당 object column의 rights를 add/remove 가능 |
| `control` | domain object row | 특정 domain row에서 rights를 remove 가능 |

![Access matrix with copy rights](@/assets/images/cs-operating-system-338-figure-17-7-page-813.png)
<p align="center"><sub>Figure 17.7 · PDF p. 813 · `read*`처럼 copy 가능한 right가 다른 domain entry로 전파되는 예</sub></p>

Figure 17.7은 `read*` right가 같은 object column 안에서 다른 domain entry로 복사될 수 있음을 보여 준다. Asterisk는 right 자체뿐 아니라 copy permission이 붙어 있음을 나타낸다. Limited copy를 쓰면 복사된 entry에는 `read`만 생기고 `read*`는 생기지 않아 further propagation을 막을 수 있다.

![Access matrix with owner rights](@/assets/images/cs-operating-system-339-figure-17-8-page-814.png)
<p align="center"><sub>Figure 17.8 · PDF p. 814 · `owner` right가 object column의 권한 추가·삭제를 허용하는 예</sub></p>

`owner` right가 있으면 해당 object column에서 valid rights를 add/remove할 수 있다. 예를 들어 D1이 F1의 owner이면 F1 column의 권한을 조정할 수 있고, D2가 F2/F3의 owner이면 두 object columns의 권한을 조정할 수 있다.

![Modified access matrix](@/assets/images/cs-operating-system-340-figure-17-9-page-815.png)
<p align="center"><sub>Figure 17.9 · PDF p. 815 · `control` right로 특정 domain row의 access rights를 제거할 수 있는 access matrix 수정 예</sub></p>

`control` right는 domain objects에만 적용된다. $\text{access}(i, j)$에 control이 있으면 domain $D_i$에서 실행 중인 process가 row $j$의 access rights를 remove할 수 있다. 즉 column-based right propagation과 달리 row-based domain rights를 조정하는 권한이다.

Access matrix는 dynamic protection requirements를 표현하는 강력한 모델이다. New objects/domains를 runtime에 만들고 matrix에 추가할 수 있다. 다만 matrix mechanism 자체가 policy를 결정하지는 않는다. 어떤 domain이 어떤 object에 어떤 방식으로 접근할지는 system designers/users가 정해야 한다.

Access rights propagation을 통제해도 information propagation을 완전히 막을 수는 없다. 특정 object에 있던 information이 execution environment 밖으로 이동하지 않음을 보장하는 문제가 `confinement problem`이며, 일반적으로 해결 불가능하다.

### 17.6 Implementation of the Access Matrix

Access matrix는 보통 sparse하다. 대부분 entries가 empty이므로 2차원 matrix 그대로 구현하기 어렵다. 실제 system은 global table, access lists, capability lists, lock-key mechanism 또는 이들의 조합을 사용한다.

#### 17.6.1 Global Table

가장 단순한 구현은 $\langle \text{domain}, \text{object}, \text{rights-set}\rangle$ triples의 `global table`이다. Domain $D_i$에서 object $O_j$에 operation $M$을 수행하려면 table에서 $\langle D_i, O_j, R_k\rangle$를 찾고 $M \in R_k$인지 확인한다. 찾으면 허용하고, 없으면 exception/error를 발생시킨다.

단점은 table이 매우 커서 main memory에 유지하기 어렵고, additional I/O가 필요할 수 있다는 점이다. 또한 “모두가 이 object를 read할 수 있음” 같은 grouping을 효율적으로 표현하기 어렵다.

#### 17.6.2 Access Lists for Objects

`access list`는 access matrix의 column을 object별 list로 구현한다. Object마다 $\langle \text{domain}, \text{rights-set}\rangle$ pairs를 저장하고 empty entries는 버린다. Default rights set을 함께 두면 list에 명시되지 않은 domains에 대한 default behavior도 표현할 수 있다.

Object owner 입장에서는 자연스럽다. Object를 만들 때 어떤 domains가 어떤 operations를 할 수 있는지 지정하기 쉽다. 그러나 domain 하나가 가진 모든 rights를 파악하려면 여러 objects의 access lists를 찾아야 하므로 domain-centric query에는 불리하다. 또한 object access마다 access list search가 필요할 수 있다.

#### 17.6.3 Capability Lists for Domains

`capability list`는 access matrix의 row를 domain별 list로 구현한다. Domain이 접근 가능한 objects와 allowed operations를 list로 가진다. Object는 physical name/address 같은 `capability`로 표현된다. Process가 object $O_j$에 operation $M$을 수행하려면 corresponding capability를 parameter로 제시한다. Capability possession 자체가 access authority가 된다.

Capability list는 domain/process 관점의 locality가 좋다. Protection system은 capability가 valid한지만 확인하면 된다. 그러나 capability는 user process가 직접 수정할 수 없어야 하므로 OS가 protected object로 관리해야 한다. Capabilities가 user-accessible address space로 흘러가면 위조/변조 위험이 생긴다.

Capabilities를 보호하는 방법은 두 가지가 대표적이다.

| 방법 | 의미 |
|---|---|
| tagged objects | object마다 capability인지 일반 data인지 나타내는 tag를 두고 hardware/firmware가 tag 접근을 통제 |
| split address space | program-accessible data/instructions 영역과 OS-only capability list 영역을 분리 |

#### 17.6.4 Lock-Key Mechanism

`lock-key mechanism`은 access lists와 capability lists의 절충이다. 각 object는 unique bit patterns인 locks list를 갖고, 각 domain은 keys list를 갖는다. Domain의 key가 object의 lock 중 하나와 match할 때만 access가 허용된다. Domain keys와 object locks는 OS가 관리하며 users가 직접 inspect/modify할 수 없다.

#### 17.6.5 Comparison

Access matrix 구현 방식은 서로 다른 trade-off를 갖는다.

| 구현 방식 | 장점 | 단점 |
|---|---|---|
| `global table` | 단순함 | table이 크고 groupings 활용이 어려움 |
| `access list` | object owner가 access policy를 표현하기 쉬움 | domain별 rights 파악이 어렵고 access list search 비용 |
| `capability list` | process/domain별 rights가 localize되고 access check가 빠름 | revocation이 어렵고 capability 보호가 필요 |
| `lock-key` | access list와 capability의 절충, lock 변경으로 revocation 가능 | key/lock 길이와 관리 방식에 따라 복잡도·유연성 결정 |

많은 systems는 access lists와 capabilities를 조합한다. Process가 object에 처음 접근할 때 access list를 검사하고, 허용되면 capability를 만들어 process에 attach한다. 이후 references는 capability로 빠르게 허용 여부를 증명한다. 마지막 access 후 capability는 destroyed된다.

UNIX file open이 좋은 예다. File open 시 directory search, access permission check, buffers allocation이 수행되고, process file table entry가 만들어진다. `open()`은 file table index를 반환하고, 이후 file operations는 이 index를 사용한다. File table entry는 OS가 관리하므로 user가 corrupt할 수 없고, entry에는 allowed operations만 capability처럼 기록된다. Read-only로 open한 file에 write를 시도하면 requested operation과 file-table capability가 맞지 않아 protection violation이 감지된다.

### 17.7 Revocation of Access Rights

Dynamic protection system에서는 이미 공유된 object access rights를 revoke해야 할 수 있다. Revocation은 다음 축으로 나뉜다.

| Revocation question | 선택지 |
|---|---|
| timing | immediate vs delayed |
| scope | selective vs general |
| extent | partial vs total |
| duration | temporary vs permanent |

Access-list scheme에서는 revocation이 쉽다. Object access list에서 해당 rights를 찾아 삭제하면 된다. Immediate/general/selective/partial/total/permanent/temporary revocation을 비교적 직접 구현할 수 있다.

Capabilities는 어렵다. Capabilities가 system 전체 domains에 distributed되어 있으므로 revoke하려면 capabilities를 찾아야 한다. 대표 방식은 다음과 같다.

| Capability revocation scheme | 의미 | trade-off |
|---|---|---|
| `reacquisition` | 주기적으로 domain capabilities를 삭제하고 필요 시 재획득하게 함 | delayed revocation, 단순하지만 즉시성 약함 |
| `back-pointers` | object마다 관련 capabilities를 가리키는 pointers list 유지 | general하지만 costly |
| `indirection` | capability가 object가 아니라 global table entry를 가리킴 | table entry 삭제로 revoke 가능, indirection 비용 |

`keys` 방식도 있다. Capability가 object master key와 matching되는 key를 포함할 때만 valid하다. Revocation은 object master key를 새 값으로 바꾸어 기존 capabilities를 invalid하게 만드는 식이다. 단일 master key는 selective revocation을 지원하지 않지만, object별 key list나 global key table을 사용하면 더 flexible하게 만들 수 있다. Key 정의·삽입·삭제 권한을 누구에게 줄지는 policy decision이다.

### 17.8 Role-Based Access Control

`RBAC(Role-Based Access Control)`는 least privilege를 OS에 명시적으로 넣는 방식이다. Solaris 10의 예처럼, protection은 `privileges`를 중심으로 구성된다. Privilege는 system call을 실행하거나 system call option을 사용할 권리다. 예를 들어 file을 write access로 여는 능력도 privilege로 볼 수 있다.

RBAC에서는 privileges를 processes에 직접 줄 수도 있고, programs와 roles에 부여할 수도 있다. Users는 roles를 assigned받거나 role password를 통해 role을 assume한다. 그러면 user는 특정 task를 수행하기 위한 privilege를 가진 role로 program을 실행할 수 있다.

![Role-based access control](@/assets/images/cs-operating-system-341-figure-17-10-page-820.png)
<p align="center"><sub>Figure 17.10 · PDF p. 820 · user가 role을 통해 필요한 privileges를 얻어 process를 실행하는 Solaris RBAC 구조</sub></p>

Figure 17.10의 핵심은 superuser/setuid binary에 모든 힘을 집중하지 않고, task별 privileges를 role로 나누는 것이다. 이렇게 하면 setuid programs의 bug나 root 권한의 과도한 범위를 줄일 수 있다. RBAC는 access matrix와도 닮아 있다. Role은 domain처럼 볼 수 있고, privilege set은 rights set처럼 볼 수 있다.

### 17.9 Mandatory Access Control (MAC)

전통적 OS는 `DAC(Discretionary Access Control)`를 사용했다. DAC에서는 individual users/groups identity를 기준으로 access를 제한하고, resource owner가 permissions를 설정하거나 변경할 수 있다. UNIX file permissions(`chmod`, `chown`, `chgrp`)나 Windows/UNIX ACLs가 대표적이다.

DAC의 약점은 “discretionary”라는 점이다. Owner가 resource permissions를 마음대로 바꿀 수 있고, root/administrator는 너무 강하다. Attacker가 root privileges를 얻으면 DAC만으로는 방어가 어렵다.

`MAC(Mandatory Access Control)`는 더 강한 protection을 제공한다. MAC은 system policy로 enforced되며, root user도 policy를 마음대로 바꾸지 못한다. MAC policy restrictions는 root보다 강한 제약으로 동작하여, intended owners 외에는 resources를 inaccessible하게 만들 수 있다.

MAC의 중심은 `labels`다. Label은 files/devices 같은 objects에 붙는 identifier이고, processes 같은 subjects에도 붙을 수 있다. Subject가 labeled object에 operation을 요청하면 OS가 policy를 검사하여 subject label이 object label에 대해 해당 operation을 수행할 수 있는지 판단한다.

예를 들어 labels가 `unclassified`, `secret`, `top secret` 순서로 privilege level을 가진다고 하자. `secret` clearance user는 `unclassified`와 `secret` files에 접근할 수 있지만 `top secret` files는 볼 수 없다. OS는 top-secret files를 directory listing에서도 걸러낼 수 있다. Similarly, `unclassified` process는 `secret` process에 IPC request를 보낼 수 없다. 이런 labels는 access matrix의 implementation으로 이해할 수 있다.

### 17.10 Capability-Based Systems

Capability-based protection은 1970년대 연구 systems인 Hydra, CAP 등에서 출발했다. 현대 systems도 root 권한의 과도함을 줄이기 위해 capability-like mechanisms를 제공한다.

#### 17.10.1 Linux Capabilities

Linux capabilities는 전통적 UNIX root model의 한계를 줄이기 위해 root powers를 여러 distinct areas로 “slice”한다. 각 capability는 bitmask의 bit로 표현된다.

![Capabilities in POSIX.1e](@/assets/images/cs-operating-system-342-figure-17-11-page-822.png)
<p align="center"><sub>Figure 17.11 · PDF p. 822 · POSIX.1e/Linux capabilities가 root 권한을 여러 bit 영역으로 나누는 개념</sub></p>

Linux는 permitted, effective, inheritable 세 bitmasks를 사용한다. Bitmasks는 process 또는 thread 단위로 적용될 수 있다. 보통 process/thread는 permitted capabilities set을 가지고 시작한 뒤 execution 중 자발적으로 줄인다. 예를 들어 network port를 연 뒤에는 더 이상 port를 열 capability를 제거할 수 있다.

이 방식은 least privilege의 직접적 구현이다. Application/user는 정상 동작에 필요한 rights만 가져야 한다. Android도 Linux 기반 capabilities를 활용해 system processes가 root ownership 대신 필요한 operations만 selectively enable하도록 한다.

한계도 있다. Capability마다 bit를 쓰는 bitmap model은 dynamic capability 추가가 어렵고, 새 capability를 추가하려면 kernel recompile이 필요할 수 있다. 또한 kernel-enforced capabilities에만 적용된다.

#### 17.10.2 Darwin Entitlements

Apple Darwin의 `entitlements`는 declaratory permissions다. Program이 필요한 permissions를 XML property list로 선언한다.

![Apple Darwin entitlements](@/assets/images/cs-operating-system-343-figure-17-12-page-823.png)
<p align="center"><sub>Figure 17.12 · PDF p. 823 · Apple Darwin에서 app이 필요한 privileged operations를 entitlements로 선언하는 예</sub></p>

Process가 privileged operation을 시도하면 OS는 필요한 entitlement가 있는지 확인하고, 있으면 허용한다. App이 임의로 entitlement를 주장하지 못하게 하기 위해 Apple은 entitlements를 `code signature`에 포함한다. Process가 load된 뒤에는 자신의 code signature에 직접 접근할 수 없지만, kernel과 다른 processes는 signature와 entitlements를 query할 수 있다. Verification은 string matching처럼 단순해지고, authenticated apps만 entitlements를 claim할 수 있다. `com.apple.*` system entitlements는 Apple binaries로 제한된다.

### 17.11 Other Protection Improvement Methods

OS protection은 access matrix 같은 abstract model만으로 끝나지 않는다. 실제 system에서는 kernel/user boundary, application boundary, binary trust boundary가 모두 공격 지점이 되므로 여러 levels에서 protection mechanisms가 추가된다. 이 절은 SIP, system-call filtering, sandboxing, code signing처럼 현대 OS가 protection을 강화하는 대표 방식을 다룬다.

#### 17.11.1 System Integrity Protection

Apple의 `System Integrity Protection(SIP)`은 macOS 10.11에서 도입된 Darwin 기반 protection mechanism이다. 핵심은 root user도 system files와 resources를 마음대로 tamper하지 못하게 하는 것이다. 전통적 UNIX 모델에서는 root가 거의 모든 것을 할 수 있었지만, SIP는 root보다 강한 system-wide restriction layer를 둔다.

SIP는 files의 extended attributes를 사용해 restricted files를 표시하고, system binaries가 debugged, scrutinized, tampered되는 것을 제한한다. 특히 code-signed kernel extensions만 허용하고, 설정에 따라 code-signed binaries만 허용하도록 할 수 있다.

SIP 아래에서도 root는 여전히 강력하다. Users' files를 관리하고 programs를 install/remove할 수 있다. 그러나 OS components를 replace하거나 modify하는 방향으로는 행동할 수 없다. 즉 root 권한의 범위를 system administration에는 남겨 두되, platform integrity를 깨는 경로는 막는다.

SIP는 all processes에 적용되는 global, inescapable screen처럼 동작한다. 예외는 `fsck`, `kextload` 같은 system binaries처럼 designated purpose에 맞는 entitlements를 가진 경우다. 이 점에서 SIP는 Darwin entitlements와 code signing이 결합된 “platform-wide mandatory profile”로 볼 수 있다.

#### 17.11.2 System-Call Filtering

Monolithic kernel에서는 kernel 기능 전체가 single address space에서 실행되고, 일반적으로 kernel은 trusted computing base로 취급된다. 따라서 trust boundary는 kernel mode와 user mode 사이, 즉 system-call boundary에 놓인다. Attacker가 kernel integrity를 깨려 한다면 user mode에서 취약한 system call을 호출하는 식으로 접근할 가능성이 높다.

`system-call filtering`은 system-call gate에서 caller가 사용할 수 있는 system calls subset을 제한하는 방식이다. Process마다 필요한 기능이 다르므로 individual process용 system-call profiles를 만들 수 있다. Linux의 `SECCOMP-BPF`는 Berkeley Packet Filter language를 사용해 custom profile을 load하고, `prctl` system call을 통해 filtering을 적용한다. Filtering은 voluntary일 수 있지만, run-time library initialization이나 loader가 program entry point로 넘기기 전에 호출하면 사실상 강제할 수 있다.

더 강한 형태는 system call의 존재 여부뿐 아니라 arguments까지 검사하는 것이다. 겉으로 harmless해 보이는 system call도 특정 arguments와 race condition 때문에 kernel compromise로 이어질 수 있기 때문이다. Linux `futex(fast mutex)` system call 취약점은 mutex처럼 필수적인 call을 통째로 막을 수 없고, 더 세밀한 validation이 필요하다는 점을 보여준다.

System-call filtering의 trade-off는 flexibility와 kernel complexity다. 취약점은 계속 발견되고 process별 요구도 다르므로 filter를 바꿀 때마다 kernel을 rebuild하면 현실성이 떨어진다. 그래서 kernel에는 callouts만 두고, 실제 filtering logic은 Windows driver, Linux kernel module, Darwin extension 같은 modular component가 맡게 할 수 있다. Profile language, parser/interpreter, trusted user-mode daemon을 조합하면 filter code와 policy profile을 분리해 update를 쉽게 만들 수 있다.

#### 17.11.3 Sandboxing

`sandboxing`은 process를 제한된 environment에서 실행해 할 수 있는 일을 좁히는 practice다. 기본 OS 모델에서는 process가 자신을 시작한 user의 credentials로 실행되고, 그 user가 접근 가능한 모든 것에 접근할 수 있다. Root로 실행되면 system 전체를 바꿀 수 있다. 그러나 실제로 대부분의 process는 full user/system privileges가 필요 없다. Word processor가 incoming network connections를 받을 필요가 없고, time-of-day network service가 넓은 file system을 읽을 필요도 없다.

Sandboxing은 process startup 초기에 제거할 수 없는 restrictions를 부여한다. 보통 `main()` 실행 전, 때로는 `fork`로 생성되는 순간부터 적용한다. 일단 sandboxed process가 되면 allowed set 밖의 operations를 수행할 수 없다. 이렇게 process가 compromise되어도 다른 system components와 communication하거나 unauthorized resources에 접근하지 못하게 하여 damage를 compartmentalize한다.

Sandboxing 구현 방식은 다양하다.

| Sandboxing level | 예 | 의미 |
|---|---|---|
| virtual machine level | Java, .NET | VM이 bytecode/runtime operations를 제한 |
| MAC policy level | Android SELinux | labels와 policy로 files, services, properties 접근 제한 |
| system-call level | Android `SECCOMP-BPF` | process가 사용할 수 있는 system calls를 제한 |
| vendor profile level | Apple Seatbelt/SIP | per-binary 또는 platform-wide sandbox profile 적용 |

Android는 SELinux만으로 individual system calls를 충분히 제한하기 어렵다고 보고, 최신 Android에서 `SECCOMP-BPF`를 함께 사용한다. Android C runtime library인 `Bionic`이 startup 중 system-call restrictions를 적용하여 Android processes와 third-party applications를 제한한다.

Apple의 sandboxing은 macOS 10.5의 `Seatbelt`에서 시작했다. 초기에는 opt-in 방식이었고, Scheme language로 작성된 dynamic profiles를 사용해 operations뿐 아니라 arguments까지 제어할 수 있었다. 이 덕분에 Apple은 system binaries마다 custom-fit profiles를 만들 수 있었다.

![Sandbox profile](@/assets/images/cs-operating-system-344-figure-17-13-page-826.png)
<p align="center"><sub>Figure 17.13 · PDF p. 826 · macOS daemon이 대부분의 operations를 deny하고 일부 file/sysctl/mach lookup만 allow하는 sandbox profile 예</sub></p>

Figure 17.13의 profile은 `(deny default)`로 대부분의 operations를 막고 필요한 operations만 allow한다. 이 구조는 least privilege를 policy file 수준에서 표현한 것이다. iOS와 macOS App Store apps에서는 sandbox가 mandatory로 적용되며, iOS에서는 code signing과 함께 untrusted third-party code에 대한 핵심 protection이 된다. SIP는 더 넓은 관점에서 system-wide platform profile처럼 동작한다.

#### 17.11.4 Code Signing

`code signing`은 program이나 executable이 author가 만든 이후 변경되지 않았는지 확인하기 위해 digital signature를 붙이는 방식이다. Protection 관점에서 문제는 “system이 어떤 program을 trust할 수 있는가?”이다. OS에 포함된 binary나 official update는 신뢰할 수 있지만, 중간에 변경되었거나 third-party tool이 배포 과정에서 tampered되었다면 실행을 막거나 special permission을 요구해야 한다.

Code signing은 `cryptographic hash`를 사용해 integrity와 authenticity를 확인한다. OS distributions, patches, third-party tools에 모두 사용될 수 있다. iOS, Windows, macOS 같은 OS는 code-signing check에 실패한 programs의 실행을 거부할 수 있다.

Code signing은 단순한 tamper detection을 넘어 platform control에도 쓰인다. 예를 들어 Apple은 오래된 iOS version용 programs에 대한 signing을 중단함으로써 App Store download 시점에 해당 programs를 disable할 수 있다. Darwin entitlements와 SIP도 code signing에 의존한다. Entitlement가 code signature에 묶여 있기 때문에 app이 나중에 임의로 더 강한 권한을 주장할 수 없다.

### 17.12 Language-Based Protection

전통적으로 protection은 OS kernel이 protected resource 접근 시도를 inspect하고 validate하는 방식으로 구현된다. 그러나 OS가 커지고 user interface와 application subsystems가 복잡해지면서 protection 요구도 더 세밀해졌다. 이제 protection은 단지 “어떤 file을 열 수 있는가”만이 아니라 “어떤 function을 어떤 방식으로 호출할 수 있는가”, “user-defined resource를 어떤 순서로 사용할 수 있는가”까지 다뤄야 한다.

이 때문에 protection은 OS designer만의 문제가 아니라 application designer가 사용할 수 있는 tool이어야 한다. Application subsystem 내부 resources도 tampering이나 error propagation으로부터 보호되어야 하기 때문이다. `language-based protection`은 programming language의 type, object, capability, runtime checks를 사용해 이런 고수준 protection requirements를 표현한다.

#### 17.12.1 Compiler-Based Enforcement

Programming language가 protection에 들어오는 이유는 access control specification이 결국 resource에 대한 declarative statement이기 때문이다. 어떤 data type/resource에 대해 어떤 operations를 허용할지 language의 typing facility와 함께 선언할 수 있다. 그러면 subsystem designer는 protection requirements와 resource-use needs를 program이 작성되는 바로 그 언어 안에서 표현할 수 있다.

Compiler-based enforcement의 장점은 다음과 같다.

| 장점 | 의미 |
|---|---|
| declarative specification | OS procedure calls를 직접 나열하지 않고 protection needs를 선언 |
| OS independence | 특정 OS가 제공하는 facility와 독립적으로 protection requirement 표현 |
| enforcement abstraction | subsystem designer가 enforcement mechanism 자체를 구현하지 않아도 됨 |
| type-system affinity | access privileges가 data type 개념과 가까워 language notation으로 표현하기 자연스러움 |

하지만 language-level protection도 hardware와 OS support에 어느 정도 의존한다. Cambridge `CAP` system처럼 모든 storage reference가 hardware capability를 통해 indirect하게 이루어지는 system에서는 process가 protection environment 밖 resource에 접근하지 못한다. 이 위에서 language implementation은 software capabilities와 protected procedures를 사용해 language-level policy를 구현할 수 있다.

Hydra나 CAP처럼 강한 protection kernel이 없는 system에서도 compiler는 일부 protection을 제공할 수 있다. Compiler는 protection violation이 불가능하다고 증명할 수 있는 references와 violation 가능성이 있는 references를 구분하고 다르게 처리할 수 있다. 다만 이 방식의 security는 compiler가 올바르고, generated code가 실행 전후에 modified되지 않으며, compiled code segments와 program files가 보호된다는 가정에 기대어 있다.

Kernel-based enforcement와 compiler-based enforcement는 다음 trade-off를 가진다.

| 기준 | kernel/hardware 중심 enforcement | compiler/language 중심 enforcement |
|---|---|---|
| security | kernel, tagged capability, hardware/microcode support가 있으면 더 강함 | translator correctness, code/file integrity, memory protection 가정에 의존 |
| flexibility | user-defined policy를 표현하는 데 한계가 있을 수 있음 | language extension/replacement로 policy 표현을 더 쉽게 바꿀 수 있음 |
| efficiency | hardware/microcode direct enforcement가 가장 빠름 | static checks를 compile time에 처리하고 fixed kernel-call overhead를 줄일 수 있음 |

Language-based protection의 또 다른 형태는 `software capability`다. 특정 program component만 `seal` 또는 `unseal` privilege를 가지고 data structure를 봉인하거나 해제한다. Seal된 data structure는 address를 전달하거나 복사할 수는 있어도, seal/unseal privilege가 없으면 contents에 접근하지 못한다. 다만 seal/unseal은 procedural style이라, resource policy를 더 자연스럽게 표현하려면 nonprocedural/declarative notation이 더 바람직하다.

실용적인 language-level access control은 세 가지 기능을 제공해야 한다.

| 기능 | 필요한 이유 |
|---|---|
| capabilities를 safe/efficient하게 distribute | process가 grant받은 resource capability가 있을 때만 managed resource를 사용하도록 보장 |
| operation type restrictions 지정 | file reader는 read만, writer는 read/write처럼 process별 rights를 다르게 부여 |
| operation order restrictions 지정 | file은 read 전에 open되어야 하는 식의 protocol을 enforcement |

이 접근은 distributed architectures와 더 강한 data security 요구가 커질수록 중요해진다. OS protection만으로는 application-specific resource semantics를 충분히 알 수 없기 때문이다.

#### 17.12.2 Run-Time-Based Enforcement - Protection in Java

Java는 distributed environment에서 실행되도록 설계되었기 때문에 `JVM(Java Virtual Machine)`에 protection mechanisms가 많이 들어 있다. Java program은 classes로 구성되고, JVM은 object instance를 만들 요청이 들어오면 class를 load한다. Java의 중요한 특징은 network를 통해 untrusted classes를 dynamically load하고, 서로 distrust하는 classes를 같은 JVM 안에서 실행할 수 있다는 점이다.

이 환경에서는 OS process 단위 protection만으로 부족하다. 같은 JVM process 안에 서로 다른 source와 trust level을 가진 classes가 있을 수 있으므로, file open이나 network connection 허용 여부는 “어떤 class가 요청했는가”에 따라 달라져야 한다. OS는 그 class-level context를 모르기 때문에 JVM이 protection decision을 처리한다.

JVM은 class를 load할 때 class를 `protection domain`에 배정한다. Domain은 class permissions를 나타내며, class가 load된 URL과 class file의 digital signature에 따라 결정된다. Configurable policy file은 각 domain과 그 classes에 어떤 permissions를 줄지 정한다. 예를 들어 trusted server에서 온 classes는 user home directory file access를 받을 수 있고, untrusted server에서 온 classes는 file access가 전혀 없을 수 있다.

문제는 protected resource 접근이 indirect하게 일어난다는 점이다. File open이나 network open은 application class가 직접 호출하기도 하지만 system library를 거쳐 호출될 수도 있다. Java의 철학은 resource access를 수행하는 library class가 privilege를 명시적으로 assert해야 한다는 것이다. 어떤 method가 `doPrivileged`로 privilege를 assert하면, 그 method가 request에 책임을 지고 필요한 safety checks를 했다고 본다. 단, 아무 method나 privilege를 assert할 수는 없고, 그 class가 속한 protection domain 자체가 해당 privilege를 exercise할 수 있어야 한다.

이 방식이 `stack inspection`이다. JVM의 각 thread는 ongoing method invocations stack을 가진다. Caller가 신뢰되지 않을 수 있을 때 method는 protected resource 접근을 `doPrivileged` block 안에서 수행한다. `doPrivileged()`는 `AccessController` class의 static method이며, run() method를 가진 class를 받아 실행한다. Block에 들어가면 해당 stack frame이 annotated된다.

Protected resource 접근이 요청되면 `checkPermissions()`가 stack inspection을 실행한다. 가장 최근 stack frame부터 오래된 frame 방향으로 검사한다.

| stack inspection 결과 | 의미 |
|---|---|
| `doPrivileged()` annotation을 먼저 발견 | 즉시 조용히 return하고 access 허용 |
| disallowed protection domain frame을 먼저 발견 | `AccessControlException` throw |
| 둘 다 찾지 못하고 stack exhausted | JVM implementation에 따라 허용 또는 거부 |

![Stack inspection](@/assets/images/cs-operating-system-345-figure-17-14-page-831.png)
<p align="center"><sub>Figure 17.14 · PDF p. 831 · untrusted applet, URL loader, networking library 사이에서 stack inspection이 privilege assertion을 검사하는 흐름</sub></p>

Figure 17.14에서 untrusted applet의 `gui()` method는 `get()`과 `open()`을 호출한다. `get()`은 URL loader protection domain의 method이고, 이 method는 `doPrivileged` block 안에서 proxy server(`proxy.lucent.com:80`)로 network connection을 연다. 따라서 networking library의 `checkPermissions()`가 stack을 검사할 때 URL loader의 `doPrivileged` frame을 발견하고 access를 허용한다. 반면 untrusted applet이 직접 `open()`을 호출하면 `doPrivileged` annotation을 만나기 전에 untrusted applet domain frame을 만나므로 exception이 발생한다.

Stack inspection이 성립하려면 program이 자신의 stack frame annotation을 조작하거나 stack inspection 자체를 우회할 수 없어야 한다. Java는 C++와 달리 memory에 직접 접근하지 못하고, reference가 있는 object만 조작할 수 있다. References는 forge할 수 없으며, well-defined interfaces를 통해서만 manipulation이 가능하다. Load-time과 run-time checks가 이 compliance를 enforce한다.

Java protection의 기반은 `type safety`다. Type safety는 class가 integer를 pointer로 취급하거나, array 끝을 넘어 쓰거나, arbitrary memory를 access하는 일을 막는다. Program은 object class가 정의한 methods를 통해서만 object에 접근한다. 따라서 class는 자신의 data와 methods를 encapsulate하고, `private`, `protected`, package visibility 같은 restrictions를 JVM 안의 다른 classes에 대해 enforce할 수 있다.

### 17.13 Summary

Protection의 흐름은 `need-to-know`와 `least privilege`에서 출발한다. System에는 hardware objects(memory, CPU time, I/O devices)와 software objects(files, programs, semaphores)가 있고, 각 object에는 operations가 있다. `access right`는 object에 대해 operation을 수행할 permission이며, `domain`은 access rights의 집합이다. Process는 domain 안에서 실행되고, lifetime 중 하나의 domain에 묶이거나 다른 domain으로 switch할 수 있다.

`protection rings`는 privilege separation을 hardware-supported levels로 표현한다. User mode는 kernel mode보다 제한되고, ARM TrustZone이나 Intel ring -1처럼 더 privileged levels가 추가될 수 있다. Higher privilege로 이동하는 경로는 system call, trap, interrupt 같은 guarded entry path로 제한된다.

`access matrix`는 policy를 강요하지 않는 general protection model이다. Rows는 domains, columns는 objects, entries는 rights set이다. Sparse matrix라서 실제 구현에서는 object별 `access lists`나 domain별 `capability lists`가 흔하다. Dynamic protection을 위해 domains와 access matrix 자체도 objects처럼 다룰 수 있고, revocation은 access-list scheme에서 capability-list scheme보다 일반적으로 쉽다.

Real systems는 이 model의 일부를 실용적으로 선택한다. Older UNIX는 owner/group/public별 read/write/execute 같은 DAC를 제공했고, modern systems는 RBAC, MAC, Linux capabilities, Darwin entitlements, SIP, system-call filtering, sandboxing, code signing 같은 여러 protection features를 조합한다.

Language-based protection은 OS가 알기 어려운 application-level context까지 다룬다. Java는 한 JVM 안에 서로 다른 protection domains의 classes를 실행하고, stack inspection과 type safety로 resource requests를 enforce한다. 따라서 Chapter 17의 결론은 “OS protection과 language/runtime protection은 경쟁 관계가 아니라 서로 다른 granularity를 맡는 layer”라는 점이다.

## 연결 관계

Chapter 16의 Security가 threat, cryptography, authentication, attack vector를 다뤘다면, Chapter 17의 Protection은 그 위협을 OS 내부 mechanisms로 어떻게 막을지 설명한다. 특히 code signing, digital signatures, cryptographic hash는 Chapter 16의 암호 개념을 protection enforcement에 연결한다.

Chapter 2의 system calls와 kernel/user mode 개념은 system-call filtering과 protection rings를 이해하는 기반이다. Monolithic kernel의 trust boundary가 system-call gate에 있기 때문에 `SECCOMP-BPF` 같은 filtering이 의미를 가진다.

Chapter 3의 process, Chapter 4의 threads는 protection domains와 Java stack inspection에 연결된다. Process/thread가 어떤 domain에서 실행되는지, thread stack이 어떻게 method invocation을 쌓는지가 access decision의 기준이 된다.

Chapter 13-15의 files/file systems는 access rights, UNIX permissions, access lists, capabilities, open file table 예시와 직접 연결된다. `open()` 이후 file table entry가 capability처럼 동작한다는 점은 file-system interface와 protection implementation을 이어 준다.

## 오해하기 쉬운 내용

`protection`은 `security`와 같지 않다. Security는 공격과 방어 전체를 포함하는 더 넓은 문제이고, protection은 OS가 resources에 대한 allowed operations를 enforce하는 mechanism 중심 개념이다.

`policy`와 `mechanism`을 섞으면 안 된다. Access matrix는 mechanism model이며, 어떤 rights를 줄지는 policy다. 좋은 protection system은 policy가 바뀌어도 mechanism을 크게 바꾸지 않게 설계된다.

`root`가 항상 모든 것을 할 수 있다고 생각하면 현대 OS protection을 놓친다. MAC, SIP, entitlements, sandboxing은 root나 administrator보다 강한 system policy layer를 만들 수 있다.

`capability`는 단순한 permission name이 아니라 protected authority다. Capability list 방식에서는 capability 자체가 위조·변조되지 않아야 하며, revocation이 access list보다 어렵다.

`sandboxing`과 `system-call filtering`은 같은 것이 아니다. Sandboxing은 process environment 전체를 제한하는 broader concept이고, system-call filtering은 그 구현에 쓰일 수 있는 한 mechanism이다.

`code signing`은 program이 안전하다는 보증이 아니다. Signing은 “누가 만들었고 이후 변경되지 않았는지”를 확인한다. Signed program에도 bug나 vulnerability는 있을 수 있다.

`stack inspection`은 call stack 전체를 무조건 허용하는 방식이 아니다. `doPrivileged` annotation과 protection domain permissions의 조합으로 request 책임 지점을 찾고, 허용되지 않는 frame을 만나면 exception을 발생시킨다.

## 면접 질문

1. `protection`과 `security`의 차이를 OS 관점에서 설명하라.
2. `principle of least privilege`와 `need-to-know principle`은 어떻게 다르며 어떻게 연결되는가?
3. `protection rings`에서 user mode가 kernel mode로 들어갈 때 왜 gate나 `syscall` 같은 통제된 entry path가 필요한가?
4. `protection domain`과 `access right`를 정의하고, domain switching이 필요한 상황을 예로 들어라.
5. UNIX `setuid bit`는 어떤 문제를 해결하며 어떤 위험을 만들 수 있는가?
6. `access matrix`의 rows, columns, entries가 각각 무엇을 의미하는가?
7. `access list`와 `capability list`를 access check 비용, 권한 조회, revocation 관점에서 비교하라.
8. Capability revocation이 어려운 이유와 `reacquisition`, `back-pointers`, `indirection`, `keys` 방식의 차이를 설명하라.
9. `RBAC`가 superuser/setuid 중심 모델보다 least privilege에 유리한 이유는 무엇인가?
10. `DAC`와 `MAC`의 차이를 root user의 권한 관점에서 설명하라.
11. Linux capabilities와 Darwin entitlements는 모두 root 권한을 줄이는 방향이지만 어떤 방식으로 다르게 동작하는가?
12. `SIP(System Integrity Protection)`이 root보다 강한 restriction으로 볼 수 있는 이유는 무엇인가?
13. `system-call filtering`에서 system call 자체만 막는 방식과 arguments까지 검사하는 방식의 trade-off를 설명하라.
14. `sandboxing`이 process compromise 이후 피해 확산을 줄이는 원리를 설명하라.
15. `code signing`이 integrity/authenticity를 확인하는 방식과 한계를 설명하라.
16. OS-level protection만으로 JVM 내부 class-level access decisions를 처리하기 어려운 이유는 무엇인가?
17. Java `stack inspection`에서 `doPrivileged`와 `checkPermissions()`는 각각 어떤 역할을 하는가?
18. Java `type safety`가 protection mechanism의 기반이 되는 이유를 설명하라.
