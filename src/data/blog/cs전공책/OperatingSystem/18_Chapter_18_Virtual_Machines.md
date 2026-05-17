---
title: "Chapter 18. Virtual Machines"
order: 18
pubDatetime: 2026-05-16T00:00:00+09:00
modDatetime: 2026-05-16T00:00:00+09:00
description: "Chapter 18. Virtual Machines 정리 노트입니다."
tags:
  - "CS"
  - "OperatingSystem"
---
# Chapter 18. Virtual Machines

- 과목: Operating System
- 기준 교재: Operating System Concepts 10th
- 관련 페이지: PDF pp. 838-867
- 우선순위: 심화

## 개요

`virtualization`은 computing 전반에서 “한 물리 자원을 여러 logical execution environments로 보이게 만드는” indirection 기법이다. Chapter 18의 중심인 `virtual machine(VM)`은 guest operating system과 applications가 자신이 native hardware 위에서 실행되는 것처럼 보이게 하면서, 실제로는 `virtual machine manager(VMM)` 또는 `hypervisor`가 그 실행을 보호하고, 관리하고, 제한하는 구조다.

핵심 질문은 세 가지다. 첫째, 어떻게 guest OS에게 CPU, memory, disk, network 같은 hardware가 진짜처럼 보이게 할 것인가. 둘째, 여러 guests가 같은 physical host를 공유하면서 서로와 host를 침범하지 못하게 어떻게 isolation할 것인가. 셋째, virtualization이 OS scheduling, memory management, I/O, storage, migration 같은 기존 OS components를 어떻게 바꾸는가.

## 핵심 개념

| 개념 | 핵심 의미 |
|---|---|
| `virtualization` | physical hardware/resources 위에 logical execution environments를 만들어 각 환경이 독립적인 machine처럼 보이게 하는 기술. |
| `virtual machine(VM)` | guest OS/application이 native hardware처럼 인식하는 isolated execution environment. |
| `host` | VMs를 실행하는 underlying hardware system 또는 host operating system. |
| `guest` | VM 안에서 실행되는 operating system 또는 application environment. |
| `virtual machine manager(VMM)`, `hypervisor` | VMs를 생성·실행하고 host interface를 virtual form으로 제공하는 layer. |
| `type 0 hypervisor` | firmware/hardware 수준에서 partitioning과 VM 관리를 제공하는 hypervisor. |
| `type 1 hypervisor` | hardware 위에서 OS처럼 직접 실행되거나 OS kernel feature로 제공되는 hypervisor. |
| `type 2 hypervisor` | 일반 host OS 위에서 application처럼 실행되며 guest OS를 제공하는 hypervisor. |
| `paravirtualization` | guest OS를 수정해 VMM과 협력하게 함으로써 virtualization overhead를 줄이는 방식. |
| `programming-environment virtualization` | real hardware 대신 JVM/.NET 같은 optimized virtual execution environment를 제공하는 방식. |
| `emulation` | 한 hardware architecture용 program을 다른 architecture에서 실행하도록 instruction/environment를 모방하는 방식. |
| `application containment` | full VM은 아니지만 applications를 OS로부터 분리해 manageability/security를 높이는 virtualization-like mechanism. |
| `fidelity`, `performance`, `safety` | VMM 요구사항: 원래 machine과 거의 동일한 environment, 작은 성능 저하, system resources에 대한 완전한 control. |
| `snapshot`, `clone`, `suspend` | VM state를 중지·복제·복원 가능하게 만드는 VMM 기능. |
| `system consolidation` | 여러 underutilized physical systems를 하나의 host 위 여러 VMs로 합쳐 resource utilization을 높이는 방식. |
| `templating` | 미리 설치·설정된 VM image를 template로 저장해 여러 VMs를 빠르게 배포하는 방식. |
| `live migration` | running guest를 network connection과 operation interruption 없이 다른 physical server로 옮기는 기능. |
| `Open Virtual Machine Format(OVF)` | VM image format을 표준화해 여러 virtualization platforms에서 실행 가능하게 하려는 시도. |
| `VCPU(virtual CPU)` | guest가 믿고 있는 CPU state를 나타내는 VMM-maintained data structure. 실제 code를 실행하지 않고 context state를 표현한다. |
| `trap-and-emulate` | guest privileged instruction이 trap을 일으키면 VMM이 해당 동작을 emulate하고 guest로 return하는 방식. |
| `binary translation` | trap되지 않는 special instructions를 VMM이 동적으로 읽고 equivalent native code로 변환해 실행하는 방식. |
| `special instructions` | guest kernel mode에서는 privileged하게 동작해야 하지만 user mode에서 trap 없이 일부 효과만 내는 등 virtualization을 어렵게 하는 instructions. |
| `nested page table(NPT)` | guest page-table state와 host physical memory mapping을 함께 표현하기 위해 VMM 또는 hardware가 관리하는 추가 page table layer. |
| `VT-x`, `AMD-V`, `VMCS` | modern CPUs가 host/guest 또는 root/nonroot modes, guest CPU state save/restore, guest exit controls를 제공하는 virtualization hardware support. |
| `EPT`, `RVI` | Intel/AMD의 hardware-assisted nested paging 기능. Guest virtual address에서 host physical address까지의 translation을 hardware가 가속한다. |
| `VT-d`, `DMA remapping`, `interrupt remapping` | I/O device DMA와 interrupts가 올바른 guest에만 전달되도록 보호·재매핑하는 hardware assistance. |
| `hypercalls` | paravirtualized guest OS가 privileged operation을 VMM에게 명시적으로 요청하는 call. |
| `VM sprawl` | VM 생성이 쉬워져 너무 많은 VMs의 사용 목적, history, state 추적이 어려워지는 현상. |
| `container`, `zone`, `jail`, `LXC` | 하나의 kernel 위에서 applications/process groups를 분리해 virtualization-like manageability와 isolation을 제공하는 mechanism. |
| `orchestration` | Docker, Kubernetes처럼 containers와 services의 배포·조정·모니터링을 자동화하는 도구 계층. |
| `CPU overcommitment` | guests에 할당된 virtual CPUs 수가 physical CPUs 수보다 많은 상태. |
| `memory overcommitment` | guests에 할당한 총 memory가 actual physical memory보다 많은 상태. |
| `double paging` | guest paging 위에 VMM paging이 추가되어 VMM이 guest memory를 backing store로 page out하는 방식. |
| `balloon memory manager` | guest 안 pseudo-device driver/kernel module이 memory를 pin해 guest memory pressure를 만들고 VMM이 그 pages를 회수하는 방식. |
| page sharing | VMM이 identical pages를 hash/compare해 하나의 physical copy로 합치는 memory optimization. |
| `bridging`, `NAT`, virtual switch | VMM이 guest networking을 외부 network 또는 host-local network에 연결·라우팅하는 방식. |
| `P-to-V`, `V-to-P` | physical system을 VM으로 변환하거나, VM을 다시 physical system으로 변환하는 절차. |
| `bytecode`, `.class`, `class loader`, `verifier`, `JIT compiler` | JVM이 architecture-neutral Java code를 load, verify, interpret/compile하는 구성요소. |
| `unikernel` | application, libraries, needed kernel services를 single binary/one address space로 묶어 VM 또는 bare metal에서 실행하는 specialized machine image. |
| `partitioning hypervisor`, `separation hypervisor` | resources를 overcommit하지 않고 guest별로 physical resources를 partition해 real-time/security isolation을 노리는 hypervisor. |

## 세부 정리

### 18.1 Overview

Virtual machine의 기본 아이디어는 하나의 computer hardware, 즉 CPU, memory, disk drives, network interface cards 등을 여러 execution environments로 추상화하는 것이다. 각 environment는 자기만의 private computer 위에서 실행되는 것처럼 보인다. Layered OS implementation처럼 중간 layer가 존재하지만, VM에서는 그 layer가 operating system이나 application이 실행될 수 있는 virtual system을 만든다.

VM implementation의 기본 구성은 다음과 같다.

| 구성요소 | 역할 |
|---|---|
| `host` | 실제 hardware system. VMs가 사용할 physical CPU, memory, disk, NIC를 제공한다. |
| `VMM/hypervisor` | host와 guests 사이에서 virtual hardware interface를 제공하고 guest 실행을 관리한다. |
| `guest` | virtual copy of host 위에서 실행되는 OS 또는 application environment. 대부분 guest process는 guest OS다. |

![System models](@/assets/images/346_Figure_18.1_page_839.png)
<p align="center"><sub>Figure 18.1 · PDF p. 839 · nonvirtual machine과 virtual machine model에서 kernel/processes와 VMM의 위치 차이</sub></p>

Figure 18.1의 핵심은 VMM이 physical hardware 위에 여러 virtual machines를 만들고, 각 VM이 자기 kernel과 processes를 갖는다는 점이다. Nonvirtual machine에서는 한 kernel이 hardware를 직접 관리하지만, virtual machine model에서는 VMM이 hardware를 multiplexing하고 각 guest OS가 자신만의 machine을 가진 것처럼 동작한다.

Virtualization은 “operating system”의 경계를 흐린다. 예를 들어 VMware ESX 같은 VMM은 hardware boot 시 실행되고 scheduling, memory management, application migration 같은 services를 제공한다. 그런데 그 “applications”는 guest operating systems다. 기능적으로는 OS처럼 보이지만, 이 장에서는 virtual environments를 제공하는 component를 명확히 `VMM`이라고 부른다.

VMM implementation은 다양하다.

| 방식 | 의미 | 예시/특징 |
|---|---|---|
| `type 0 hypervisor` | firmware/hardware 기반 VM creation/management | IBM LPARs, Oracle LDOMs, mainframe/server partitioning |
| `type 1 hypervisor` | hardware 위에서 직접 실행되는 OS-like VMM | VMware ESX, Joyent SmartOS, Citrix XenServer |
| kernel-integrated type 1 | general-purpose OS가 VMM 기능도 제공 | Windows Server Hyper-V, Linux KVM |
| `type 2 hypervisor` | standard OS 위 application처럼 실행 | VMware Workstation/Fusion, Parallels Desktop, VirtualBox |
| `paravirtualization` | guest OS를 VMM 협력용으로 수정 | 성능 최적화를 위해 guest가 hypercalls 등을 사용 |
| `programming-environment virtualization` | real hardware가 아닌 virtual runtime 제공 | Java, .NET |
| `emulation` | 다른 CPU/hardware용 program 실행 | 다른 hardware environment를 instruction 수준에서 모방 |
| `application containment` | VM은 아니지만 apps를 segregate | Solaris Zones, BSD Jails, AIX WPARs |

이 다양성은 virtualization이 data-center operations, application development, software testing, cloud computing 등에서 폭넓게 쓰이기 때문이다.

### 18.2 History

Virtual machines는 1972년 IBM mainframes에서 commercial하게 등장했다. IBM VM operating system은 mainframe을 여러 virtual machines로 나누고, 각 VM이 자기 operating system을 실행하도록 했다.

IBM VM/370의 중요한 문제는 disk였다. Physical machine에 disk drives가 3개뿐인데 7개 VMs를 지원하려면 각 VM에 physical disk를 하나씩 줄 수 없다. 해결책은 physical disk tracks 일부를 할당해 virtual disk인 `minidisk`를 제공하는 것이었다. Minidisk는 size를 제외하면 hard disk처럼 보였고, VM은 이를 자기 disk처럼 사용했다.

IBM VM 환경에서 사용자는 underlying machine이 제공하는 OS나 software packages를 실행할 수 있었다. 보통 사용자는 single-user interactive OS인 `CMS`를 사용했다.

Virtualization이 널리 확산되기 전에도 VMM의 formal requirements는 정리되었다.

| 요구사항 | 의미 |
|---|---|
| `fidelity` | VMM이 programs에 original machine과 본질적으로 동일한 environment를 제공해야 한다. |
| `performance` | VM 안의 programs는 only minor performance decreases만 보여야 한다. |
| `safety` | VMM은 system resources를 complete control해야 한다. |

이 세 요구사항은 지금도 virtualization 설계의 기준이다. 1990년대 말 Intel 80x86 CPUs가 common, fast, feature-rich해지면서 Xen과 VMware가 x86 guest OS virtualization 기술을 만들었고, 이후 virtualization은 common CPUs, commercial/open-source tools, host/guest OS 전반으로 확장되었다.

### 18.3 Benefits and Features

Virtualization의 장점은 같은 hardware를 공유하면서도 여러 execution environments, 즉 여러 operating systems를 동시에 실행할 수 있다는 데서 나온다.

가장 중요한 장점은 isolation이다. Host system은 VMs로부터 보호되고, VMs도 서로로부터 보호된다. Guest OS 안의 virus가 그 guest를 망가뜨릴 수는 있어도 host나 다른 guests에 영향을 주기는 어렵다. 이 isolation 덕분에 VM 사이 protection problems는 크게 줄어든다.

그러나 isolation은 sharing을 어렵게 만들 수 있다. 이를 해결하는 대표 방식은 두 가지다.

| sharing 방식 | 의미 |
|---|---|
| shared file-system volume | 여러 VMs가 같은 file volume을 사용해 files를 공유한다. |
| virtual communications network | software로 구현된 virtual network를 통해 VMs가 information을 주고받는다. |

VMM은 physical network connection 같은 physical resources를 여러 guests에 공유시킬 수도 있다. 이 경우 VMM이 physical resource sharing을 관리하고, guests는 physical network를 통해 서로 통신할 수 있다.

대부분 VMM은 running VM을 `freeze` 또는 `suspend`할 수 있다. 여기서 더 나아가 guest의 copies와 `snapshots`를 만든다. Copy는 새 VM 생성이나 VM 이동에 사용되고, guest는 original machine에서 계속 실행되는 것처럼 resume할 수 있다. Snapshot은 특정 시점의 state를 기록해 unwanted change가 생겼을 때 그 시점으로 reset할 수 있게 한다.

VM은 OS research and development에 특히 유용하다. OS는 크고 복잡하며 kernel mode에서 실행되므로 pointer 하나의 잘못된 변경도 file system 전체를 망가뜨릴 수 있다. Physical shared system에서 OS를 수정·테스트하려면 system-development time 동안 users가 system을 못 쓰는 문제가 생긴다. VM을 사용하면 system programmer가 자기 VM에서 OS changes를 개발하고 테스트한 뒤, 완성된 변경만 production에 적용할 수 있다.

Development와 QA에서도 VM은 여러 OS와 versions를 한 workstation에서 동시에 실행하게 해 준다. Porting, compatibility testing, application testing을 위해 physical machine을 OS별로 따로 구매·운영할 필요가 줄어든다.

Production data center에서는 `system consolidation`이 큰 장점이다. 여러 lightly used physical systems를 하나의 더 heavily used system 위 VMs로 합치면 resource utilization이 좋아진다. VMM management tools가 있으면 100 physical servers가 각각 20 virtual servers를 실행하는 환경도 적은 administrators가 관리할 수 있다.

Virtualization management 기능도 중요하다.

| 기능 | 효과 |
|---|---|
| `templating` | installed/configured guest OS와 applications를 포함한 standard VM image를 source로 여러 VMs 생성 |
| patch management | 모든 guests의 patching을 중앙 관리 |
| backup/restore | guest images와 states를 관리·복구 |
| resource monitoring | guest별 CPU, memory, I/O 사용량 관찰 |
| `live migration` | running guest를 다른 physical server로 옮겨 overload 완화 또는 hardware maintenance 수행 |

Application deployment 방식도 바뀐다. Application을 host에 직접 설치하는 대신, tuned/customized guest OS가 포함된 VM에 preinstall한 뒤 VM image로 배포할 수 있다. 이 방식은 application management, technical support, redeployment를 단순하게 만든다. 다만 이를 널리 쓰려면 VM format이 standardized되어야 하며, `Open Virtual Machine Format(OVF)`가 그런 시도다.

Cloud computing도 virtualization 위에 세워진다. CPU, memory, I/O resources를 Internet technologies와 APIs로 service처럼 제공하고, program이 cloud facility에 thousands of VMs 생성을 요청할 수 있다. Desktop virtualization에서는 user가 remote data center의 VM에 접속해 local처럼 applications를 사용한다. Local disk에 data를 저장하지 않으므로 security가 좋아질 수 있고, endpoint device는 display/networking 중심의 더 저렴한 machine이 될 수 있다.

### 18.4 Building Blocks

VM 개념은 단순해 보이지만 구현은 어렵다. Guest에게 underlying machine의 exact duplicate를 제공해야 하기 때문이다. 특히 underlying machine이 user mode와 kernel mode만 가진 dual-mode system이면 문제가 커진다. Guest OS의 kernel도 “자기 기준 kernel mode”가 필요하지만, 실제 machine의 kernel mode를 guest에게 그대로 주면 host와 다른 guests를 보호할 수 없다.

Virtualization 가능 여부는 CPU가 제공하는 features에 크게 의존한다. CPU features가 충분하면 VMM이 guest environment를 만들 수 있고, 부족하면 virtualization 자체가 불가능하거나 binary translation 같은 복잡한 우회가 필요하다.

#### 18.4.1 Trap-and-Emulate

전형적 dual-mode system에서 guest는 physical user mode에서만 실행될 수 있다. Guest OS kernel도 physical kernel mode에서 직접 실행되면 안전하지 않으므로, virtual machine 안에는 `virtual user mode`와 `virtual kernel mode`가 있어야 하고 둘 다 실제로는 physical user mode에서 실행된다.

Real machine에서 user mode에서 kernel mode로 넘어가게 만드는 events, 예를 들어 system call, interrupt, privileged instruction 실행은 VM 안에서도 virtual user mode에서 virtual kernel mode로 넘어가는 효과를 내야 한다. `trap-and-emulate`는 이 전환을 다음처럼 구현한다.

1. Guest kernel이 privileged instruction을 실행하려 한다.
2. 실제 CPU 입장에서는 user mode에서 privileged instruction을 실행한 것이므로 trap이 발생한다.
3. VMM이 control을 얻는다.
4. VMM이 guest kernel이 하려던 action을 guest behalf로 emulate한다.
5. VCPU state를 update하고 guest에게 control을 돌려준다.

![Trap-and-emulate](@/assets/images/347_Figure_18.2_page_845.png)
<p align="center"><sub>Figure 18.2 · PDF p. 845 · guest privileged instruction이 trap을 일으키고 VMM이 emulate한 뒤 VCPU를 갱신하는 구조</sub></p>

Trap-and-emulate의 장점은 nonprivileged instructions가 hardware에서 native로 실행되어 성능이 좋다는 점이다. 단점은 privileged instructions마다 trap과 emulation overhead가 발생한다는 점이다. 또한 physical CPU가 여러 VMs 사이에서 multiprogrammed되므로 VM 성능이 예측하기 어렵게 느려질 수 있다.

현대 hardware는 이 overhead를 줄이기 위해 extra modes와 guest CPU state management를 제공한다. 일부 CPUs는 guest가 어떤 mode에 있는지 physical CPU가 직접 관리하고, guest context switch 시 CPU state save/restore도 hardware가 처리한다. 이 경우 VCPU가 직접 추적해야 하는 상태와 VMM overhead가 줄어든다.

#### 18.4.2 Binary Translation

Trap-and-emulate는 privileged/nonprivileged instructions가 clean하게 분리되어 있고, privileged behavior가 trap을 일으킨다는 전제가 필요하다. 그러나 오래된 Intel x86 계열은 virtualization을 고려해 설계되지 않았기 때문에 이 전제가 깨졌다.

대표 예가 `popf` instruction이다. `popf`는 stack contents로 flag register를 load한다. CPU가 privileged mode면 all flags가 바뀌지만, user mode면 일부 flags만 바뀌고 나머지는 무시된다. 문제는 user mode에서 trap이 발생하지 않는다는 점이다. Guest kernel은 flag가 바뀌었다고 기대하지만 실제로는 일부만 바뀌고, VMM은 trap을 받지 못해 emulate할 기회가 없다. 이런 instructions를 이 장에서는 `special instructions`라고 부른다.

`binary translation`은 이 문제를 해결한다. 개념은 단순하지만 구현은 어렵다.

| Guest VCPU 상태 | VMM 동작 |
|---|---|
| virtual user mode | guest instructions를 physical CPU에서 native로 실행 |
| virtual kernel mode | VMM이 guest의 다음 instructions를 읽고, special instructions는 equivalent native code로 변환 |

![Binary translation](@/assets/images/348_Figure_18.3_page_846.png)
<p align="center"><sub>Figure 18.3 · PDF p. 846 · VMM이 guest kernel instruction stream을 읽어 special instruction을 translation code로 대체하는 구조</sub></p>

VMM의 translation code는 guest binary instructions를 on demand로 읽고, 원래 code 대신 실행할 native binary code를 생성한다. 이 방식만 단순히 쓰면 느리지만, VMware 방식처럼 translated replacement code를 cache하면 성능을 크게 개선할 수 있다. 한 번 translated된 instruction은 이후 translation cache에서 실행되어 다시 번역할 필요가 없다.

Memory management도 별도 문제가 된다. Guest OS는 자신이 page tables를 관리한다고 믿고, VMM도 실제 host memory를 관리해야 한다. 이를 위해 `nested page tables(NPTs)`를 사용할 수 있다. Guest OS는 virtual-to-physical translation용 page tables를 유지하고, VMM은 guest page-table state를 나타내는 NPTs를 유지한다. Guest가 page table을 변경하려고 하면 VMM이 이를 intercept하고 NPT와 system page tables에 대응 변경을 반영한다.

Binary translation은 overhead가 커 보이지만 실제로는 산업을 열 만큼 충분히 동작했다. VMware는 Windows XP boot/shutdown 실험에서 약 950,000 translations, translation당 3 microseconds, 총 3 seconds 정도의 증가를 보였고, 이는 native execution 대비 약 5 percent 정도였다. 핵심은 대부분 instructions는 native로 실행되고, expensive한 부분은 caching과 최적화로 줄였다는 점이다.

#### 18.4.3 Hardware Assistance

현대 virtualization은 hardware assistance에 크게 의존한다. Hardware support가 많을수록 VMs는 feature-rich하고 stable해지며 performance도 좋아진다. Intel은 2005년부터 `VT-x` instructions를 추가했고, AMD는 2006년부터 `AMD-V`를 제공했다. 이로써 x86 virtualization에서 binary translation이 더 이상 필수적이지 않게 되었다.

AMD-V는 `host`와 `guest`라는 operation modes를 정의해 dual-mode processor를 multimode processor로 확장한다. VMM은 host mode에서 guest VM characteristics를 정의하고, guest mode로 전환해 guest OS에 control을 넘긴다. Intel VT-x도 비슷하게 `root`와 `nonroot` modes를 제공한다.

Modern CPU virtualization support의 핵심 기능은 다음과 같다.

| hardware support | 역할 |
|---|---|
| guest VCPU state structure | guest CPU state를 context switch 중 자동 save/load |
| `VMCS(Virtual Machine Control Structure)` | guest/host state, execution controls, exit controls, guest exit reason 관리 |
| guest exit mechanism | unavailable memory access 같은 event에서 guest가 host/VMM으로 exit |
| hardware nested paging | guest/host page tables를 hardware walk로 처리 |
| DMA/interrupt remapping | I/O가 올바른 guest memory와 guest CPU core에만 전달되도록 보호 |

Memory management에서도 AMD `RVI`와 Intel `EPT`가 VMM의 software NPT 부담을 줄인다. CPU가 nested page tables를 hardware로 구현해 guest virtual address에서 final host physical address까지 translation한다. 단, TLB miss가 발생하면 guest page tables와 host/VMM page tables를 모두 traverse해야 하므로 더 큰 penalty가 생길 수 있다.

![Nested page tables](@/assets/images/349_Figure_18.4_page_849.png)
<p align="center"><sub>Figure 18.4 · PDF p. 849 · guest virtual address가 guest paging structure와 VMM nested page table을 거쳐 host physical address로 변환되는 과정</sub></p>

I/O 역시 hardware assistance가 중요하다. 일반 DMA controller는 target memory address와 source I/O device만 받아 OS 개입 없이 data를 전송한다. Hardware assistance가 없다면 guest가 VMM이나 다른 guest memory를 건드리는 DMA transfer를 설정할 수 있다. Intel `VT-d` 같은 hardware-assisted DMA에서는 VMM이 protection domains를 설정해 각 guest가 소유한 physical memory regions와 I/O devices를 연결하고, hardware가 DMA request address를 올바른 host physical address로 변환한다.

Interrupt도 올바른 guest에게만 전달되어야 한다. `interrupt remapping`은 guest용 interrupt를 현재 그 guest thread를 실행 중인 core로 자동 전달한다. 이 기능이 없으면 malicious guest가 interrupts를 악용해 host control을 얻으려 할 수 있다.

ARM v8은 다른 방식으로 hardware virtualization을 지원한다. Kernel보다 더 privileged한 `EL2` exception level을 제공해 hypervisor가 secluded하게 실행되고, hypervisor 전용 MMU access와 interrupt trapping을 갖는다. Paravirtualization을 위해 `HVC` instruction도 제공되며, guest kernel mode인 EL1에서만 호출할 수 있다.

Hardware-assisted virtualization은 `thin hypervisor`도 가능하게 한다. macOS `HyperVisor.framework`는 OS-supplied library로, 실제 privileged virtualization instructions는 kernel이 system calls를 통해 대신 실행한다. Hypervisor process가 별도 kernel module을 load하지 않고도 VM을 관리할 수 있는 이유다.

### 18.5 Types of VMs and Their Implementations

#### 18.5.1 The Virtual Machine Life Cycle

VM creation 시 creator는 VMM에 parameters를 준다. 보통 virtual CPUs 수, memory 양, networking details, storage details가 포함된다. 예를 들어 2 virtual CPUs, 4 GB memory, 10 GB disk space, DHCP로 IP를 받는 network interface, DVD drive access 같은 식이다.

VMM은 이 parameters에 맞춰 VM을 만든다. Type 0 hypervisor에서는 resources가 보통 dedicated되므로, 필요한 virtual CPUs가 unallocated 상태로 없으면 creation request가 실패할 수 있다. 다른 hypervisor types에서는 resources가 dedicated되거나 virtualized된다. IP address는 공유할 수 없지만, virtual CPUs는 physical CPUs 위에서 multiplexed되는 경우가 많고, memory는 physical memory보다 더 많이 guest에 할당되는 overcommit 형태가 흔하다.

VM이 더 이상 필요 없으면 delete할 수 있다. VMM은 사용된 disk space를 free하고, VM configuration을 제거한다. Physical machine을 조립·설치·구성·폐기하는 것에 비해 VM lifecycle은 매우 단순하다.

그러나 VM 생성이 너무 쉬운 것이 문제를 만들기도 한다. `VM sprawl`은 너무 많은 VMs가 생겨 각 VM의 사용 목적, history, state 추적이 어려워지는 현상이다. Management convenience가 governance 문제로 바뀌는 대표 trade-off다.

#### 18.5.2 Type 0 Hypervisor

`type 0 hypervisor`는 오래전부터 partitions, domains 같은 이름으로 존재한 hardware feature다. VMM은 firmware에 encoded되어 boot time에 load되고, 각 partition에서 실행할 guest images를 load한다. Hardware/firmware 기반이므로 OS가 특별히 수정될 필요가 없고, guest는 자신에게 dedicated hardware가 있다고 믿는다.

![Type 0 hypervisor](@/assets/images/350_Figure_18.5_page_851.png)
<p align="center"><sub>Figure 18.5 · PDF p. 851 · firmware hypervisor가 CPUs, memory, I/O를 partition별 guest에 나누어 제공하는 type 0 구조</sub></p>

Type 0의 feature set은 hardware implementation 때문에 다른 hypervisor types보다 작을 수 있다. 예를 들어 system을 four virtual systems로 나누고 각 partition에 dedicated CPUs, memory, I/O devices를 줄 수 있다. 이 경우 guest는 실제로 dedicated hardware를 가지므로 구현이 단순하다.

문제는 I/O다. Ethernet ports가 2개인데 guests가 더 많다면 모든 guest에 dedicated I/O device를 줄 수 없다. 이때 hypervisor가 shared access를 관리하거나, 모든 devices를 `control partition`에 할당하고 그 안의 guest OS가 daemons를 통해 networking 같은 services를 다른 guests에 제공하게 할 수 있다.

일부 type 0 hypervisors는 running guests 사이에서 physical CPUs와 memory를 이동할 수 있다. 이 경우 guests는 paravirtualized되어 hardware/VMM signal을 감지하고, hardware devices를 probe해 CPUs나 memory를 추가·제거해야 한다.

Type 0은 raw hardware execution에 매우 가깝다. 각 hardware partition의 guest OS는 사실상 hardware subset 위에서 실행되는 native OS이므로, 그 guest OS 자체가 다시 VMM이 될 수도 있다. 즉 virtualization-within-virtualization이 가능하다.

#### 18.5.3 Type 1 Hypervisor

`type 1 hypervisor`는 data center에서 흔하며 “data-center operating system”처럼 동작한다. Hardware 위에서 native로 실행되는 special-purpose OS지만, 일반 programs를 위한 system calls보다 guest operating systems를 create, run, manage하는 기능이 중심이다.

Type 1 hypervisor는 kernel mode에서 실행되어 hardware protection을 활용한다. CPU가 허용하면 multiple modes를 사용해 guest OS에 더 많은 control과 더 나은 performance를 제공한다. 또한 자신이 실행되는 hardware의 device drivers를 직접 구현해야 한다. 따라서 CPU scheduling, memory management, I/O management, protection, security까지 제공해야 하며, backup/monitoring/security 같은 외부 management applications를 위한 APIs도 제공한다.

장점은 consolidation과 manageability다. 10개 systems가 각각 10 percent utilization으로 돌아가는 대신 하나의 server가 전체 load를 맡을 수 있다. Load가 올라가면 guests와 applications를 live migration으로 덜 바쁜 systems로 옮길 수 있고, snapshots/cloning으로 guest states를 쉽게 저장·복제할 수 있다. 비용은 commercial VMM 비용, 새 management tools 학습, 증가한 complexity다.

General-purpose OS가 VMM 기능을 제공하는 type 1도 있다. Red Hat Enterprise Linux, Windows, Oracle Solaris 같은 OS가 일반 duties를 수행하면서 guest OS도 process처럼 실행한다. 다만 extra duties 때문에 dedicated type 1 hypervisors보다 virtualization features는 적을 수 있다.

#### 18.5.4 Type 2 Hypervisor

`type 2 hypervisor`는 host OS 위에서 application-level VMM으로 실행된다. Host 입장에서는 그저 하나의 process이며, host OS는 그 process 내부에서 virtualization이 일어난다는 사실을 특별히 알 필요가 없다.

한계는 성능과 권한이다. Modern CPU hardware assistance에 접근하려면 administrative privileges가 필요한 경우가 많다. Standard user로 실행되는 type 2 VMM은 그런 기능을 충분히 활용하지 못할 수 있다. 또한 general-purpose host OS와 guest OS를 함께 돌리는 overhead 때문에 type 0/1보다 overall performance가 낮은 편이다.

하지만 type 2의 장점은 접근성이다. Host OS를 바꾸지 않고 다양한 general-purpose OS에서 실행할 수 있다. 학생이나 개발자는 native OS를 지우지 않고 Windows, Linux, Unix, 기타 OS를 실험할 수 있다.

#### 18.5.5 Paravirtualization

`paravirtualization`은 guest OS를 속이는 대신, guest OS가 자신이 virtualized environment에서 실행됨을 알고 VMM과 협력하게 만든다. Guest에는 preferred hardware와 비슷하지만 동일하지는 않은 system이 제공되며, guest OS는 그 paravirtualized virtual hardware 위에서 실행되도록 수정되어야 한다. 추가 작업의 대가는 resource use efficiency와 smaller virtualization layer다.

Xen은 paravirtualization의 대표 사례였다. Xen은 real device처럼 보이는 virtual devices 대신 clean/simple device abstractions를 제공해 efficient I/O와 guest-VMM communication을 가능하게 했다. 각 guest/device마다 shared memory의 circular buffer를 두고, read/write data를 그 buffer에 넣었다.

![Xen I/O circular buffer](@/assets/images/351_Figure_18.6_page_853.png)
<p align="center"><sub>Figure 18.6 · PDF p. 853 · Xen이 guest와 VMM 사이 I/O requests/responses를 shared circular buffer로 주고받는 구조</sub></p>

Memory management에서도 Xen은 nested page tables를 쓰지 않았다. Guest마다 read-only page tables를 두고, page-table change가 필요할 때 guest가 hypervisor VMM에 `hypercall`을 호출하도록 했다. Guest kernel code를 Xen-specific methods로 수정해야 했지만, multiple page-table changes를 asynchronously queue한 뒤 완료를 확인하는 방식으로 성능을 최적화할 수 있었다.

Xen은 binary translation 없이 x86 CPU virtualization을 가능하게 했지만, 시간이 지나면서 hardware virtualization features를 활용하게 되었다. 그 결과 modified guests가 필수는 아니게 되었고, paravirtualization 자체의 필요성도 줄었다. 그래도 type 0 hypervisors 등에서는 여전히 쓰인다.

#### 18.5.6 Programming-Environment Virtualization

`programming-environment virtualization`은 real hardware duplication이 아니라 language/runtime을 위한 virtual environment를 제공한다. Java는 대표 사례다. Java는 `JVM(Java Virtual Machine)` 안에서 실행되도록 설계되었고, security와 memory management의 많은 기능이 JVM에 의존한다.

Strict하게 hardware duplication만 virtualization이라고 정의하면 JVM은 VM이 아닐 수 있다. 그러나 APIs 기반 virtual environment가 특정 language와 programs에 필요한 features를 제공한다는 넓은 의미에서는 virtualization으로 볼 수 있다. Java program은 JVM environment 안에서 실행되고, JVM은 각 host system에서 native program으로 compiled/implemented된다. 따라서 Java program은 한 번 작성되면 JVM이 있는 major OS에서 실행될 수 있다. Interpreted languages도 program이 각 instruction을 읽고 native operations로 interpret한다는 점에서 비슷한 execution environment를 제공한다.

#### 18.5.7 Emulation

Virtualization은 같은 CPU instruction set을 쓰는 다른 OS용 applications를 실행할 때 효율적이다. 하지만 application이나 OS가 다른 CPU architecture용으로 compiled되어 있다면 instruction set 자체가 다르므로, source CPU의 instructions를 target CPU의 equivalent instructions로 번역해야 한다. 이 환경은 더 이상 hardware virtualization이 아니라 `emulation`이다.

Emulation은 legacy programs의 수명을 늘리고, 실제 old machine 없이 old architectures를 탐구하게 해 준다. 예를 들어 회사가 outdated system을 새 system으로 교체했지만 old system용 important programs를 계속 실행해야 한다면, emulator가 outdated system instructions를 new system native instruction set으로 번역해 실행할 수 있다.

주요 trade-off는 performance와 correctness다. Instruction-set emulation은 old instruction 하나를 read, parse, simulate하기 위해 new system instructions 여러 개가 필요할 수 있다. 원문은 대략 한 old instruction을 처리하는 데 10 instructions가 필요할 수 있다고 설명한다. 따라서 new machine이 old machine보다 충분히 빠르지 않으면 native old hardware보다 느려진다. 또한 emulator writer는 사실상 software로 entire CPU를 작성해야 하므로 correct emulator를 만들기 어렵다.

#### 18.5.8 Application Containment

어떤 경우 virtualization의 목표는 complete hardware duplication이 아니라 applications를 segregate하고, performance/resource use를 관리하며, start/stop/move/manage를 쉽게 만드는 것이다. 모든 applications가 같은 OS용으로 compiled되어 있다면 full VM이 필요 없고, `application containment`로 충분할 수 있다.

Solaris `containers` 또는 `zones`가 대표 예다. Solaris 10부터 하나의 kernel만 설치하고 hardware는 virtualize하지 않는다. 대신 OS와 devices를 virtualize하여 zone 안 processes가 자신들만 system에 있는 것처럼 느끼게 한다. 각 zone은 applications, network stacks, network addresses/ports, user accounts 등을 가질 수 있고, CPU/memory resources를 zones와 system-wide processes 사이에서 나눌 수 있다.

![Solaris zones](@/assets/images/352_Figure_18.7_page_856.png)
<p align="center"><sub>Figure 18.7 · PDF p. 856 · 하나의 Solaris kernel 위에서 global zone과 두 zones가 virtual platform을 공유하는 구조</sub></p>

Containers는 full VM보다 훨씬 lightweight하다. System resources를 덜 쓰고 instantiate/destroy가 빠르며, VM보다는 processes에 더 가깝다. 그래서 cloud computing에서 널리 쓰인다. FreeBSD `jails`, AIX의 유사 기능, Linux `LXC`가 같은 계열이다.

Containers가 쉬워지면서 `orchestration` tools도 중요해졌다. Docker와 Kubernetes 같은 tools는 distributed applications 전체를 빠르게 deploy하고, many processes within containers를 조정하며, monitoring과 administration을 제공한다. OS가 single program 실행을 단순화하듯, orchestration은 distributed services 실행을 단순화하려는 계층이다.

### 18.6 Virtualization and Operating-System Components

Virtualization은 단지 guest OS를 실행시키는 기술이 아니라, VMM이 scheduling, I/O, memory management 같은 core OS functions를 다시 제공해야 하는 구조다. Guest OS는 자신이 dedicated CPU와 memory를 가진다고 믿지만, 실제로는 VMM이 physical resources를 여러 guests 사이에서 multiplexing한다.

#### 18.6.1 CPU Scheduling

Virtualized system은 single-CPU system이라도 multiprocessor처럼 행동할 수 있다. VMM은 각 VM에 하나 이상의 `virtual CPUs`를 보여 주고, physical CPUs 사용을 VMs 사이에서 schedule한다.

VMM scheduling의 일반 구조는 다음과 같다.

| 상황 | VMM 동작 | guest가 보는 모습 |
|---|---|---|
| 충분한 physical CPUs 있음 | guest별 CPUs를 dedicated처럼 배정 | native CPUs 위 OS처럼 동작 |
| VMM management 필요 | VMM threads가 guest cycles 일부를 사용 | 영향은 비교적 작음 |
| `CPU overcommitment` | virtual CPUs 수가 physical CPUs보다 많아 proportional/fair scheduling 필요 | guest는 자신이 가진 virtual CPUs가 모두 있다고 믿음 |

Overcommitment에서는 guest OS scheduling assumptions가 깨질 수 있다. 예를 들어 time-sharing OS가 100 milliseconds time slice를 제공하려 해도, VM이 실제 physical CPU cycles를 충분히 받지 못하면 virtual CPU time 100 ms가 real time으로는 1초 이상 걸릴 수 있다. User response time은 나빠지고, real-time OS에서는 더 심각한 문제가 생긴다.

또한 VM 안 time-of-day clocks가 틀어질 수 있다. Timers가 dedicated CPU에서보다 늦게 trigger되기 때문이다. 이를 보정하려고 VMM은 guest OS별 application/tools를 제공해 clock drift를 교정하고 virtual device management 같은 기능을 수행하게 한다.

#### 18.6.2 Memory Management

Virtualized environment에서는 guests와 applications뿐 아니라 VMM도 memory를 사용한다. 게다가 VMM은 흔히 `memory overcommitment`를 한다. 즉 guests에 할당한 total memory가 actual physical memory보다 많다. VMM은 guests가 요청한 full memory를 가진 것처럼 보이게 하면서 실제 memory pressure를 관리해야 한다.

VMware ESX 예시는 VMM memory management의 대표 기법을 보여 준다. 먼저 VMM은 각 guest의 maximum memory size와 configured memory를 평가하고, overcommitment/system load 등을 고려해 target real-memory allocation을 계산한다. 이후 guest memory를 회수하기 위해 세 가지 low-level mechanisms를 사용한다.

| memory mechanism | 동작 | 장점/단점 |
|---|---|---|
| `double paging` | VMM이 nested page table indirection을 이용해 guest가 physical memory라고 믿는 backing store로 pages를 page out | guest 도움 없이 가능하지만, VMM은 guest access patterns를 잘 몰라 효율이 낮음 |
| `balloon memory manager` | guest 안 pseudo-device driver가 pages를 allocate/pin해 guest에 memory pressure를 만들고, VMM은 그 pinned pages를 다른 guest에 재할당 | guest OS의 자체 paging algorithm을 활용하므로 더 효율적 |
| page sharing | VMM이 identical pages를 hash와 byte-by-byte comparison으로 찾아 하나의 physical page로 합침 | 같은 OS/application을 여러 guests가 실행할 때 효과 큼 |

`balloon memory manager`는 특히 중요하다. VMM이 guest 안 balloon driver에게 memory allocate를 지시하면, driver는 pages를 physical memory에 pin한다. Guest OS는 usable memory가 줄었다고 보고 자기 memory-management algorithm으로 다른 memory를 free한다. VMM은 balloon이 pin한 pages가 실제 workload에 쓰이지 않을 것임을 알기 때문에 그 physical pages를 회수해 다른 guest에 줄 수 있다. System-wide memory pressure가 줄면 balloon을 deflate하여 pages를 guest에 돌려준다.

Page sharing은 여러 guests가 같은 OS나 같은 applications를 실행할 때 강력하다. VMM은 randomly sampled guest memory page의 hash를 만들고, hash table의 다른 hashes와 비교한다. Match가 있으면 byte-by-byte로 확인한 뒤 identical이면 한 copy만 남기고 logical addresses를 같은 physical page에 map한다.

#### 18.6.3 I/O

I/O virtualization은 device 다양성 때문에 복잡하지만, OS의 device-driver abstraction 덕분에 어느 정도 유연하게 구현할 수 있다. VMM은 guest에게 specific virtualized devices를 제공할 수 있고, guest OS는 이를 device driver를 통해 다룬다.

I/O 제공 방식은 크게 세 가지로 볼 수 있다.

| I/O 방식 | 의미 | trade-off |
|---|---|---|
| dedicated device | 특정 guest에 device를 직접 할당 | 성능 좋지만 다른 guests는 해당 device 사용 불가 |
| VMM-mediated shared device | VMM이 모든 I/O를 검사·라우팅 | protection 가능하지만 overhead 증가 |
| idealized virtual device | guest는 단순 device driver를 보고, VMM이 복잡한 real driver로 변환 | guest driver 단순화, VMM 구현 복잡 |

Direct device access는 성능을 높인다. Type 0 hypervisor에서는 native OS와 비슷한 속도까지 가능하다. Type 1/2에서도 `VT-d` 같은 DMA pass-through와 direct interrupt delivery가 있으면 native에 가까워질 수 있다. Hardware support가 없으면 interrupts가 빈번하게 VMM을 거쳐야 하므로 성능이 나빠진다.

Shared device에서는 VMM이 protection을 제공해야 한다. 예를 들어 여러 guests가 하나의 disk drive에 접근하면 VMM은 guest가 configuration에서 허용된 blocks만 접근하도록 검사하고, data를 올바른 device/guest로 route해야 한다.

Networking에서는 VMM이 virtual switch처럼 동작한다. 각 guest는 적어도 하나의 IP address가 필요하므로 VMM을 실행하는 server가 dozens of addresses를 가질 수 있다. Guest networking 방식은 `bridging` 또는 `NAT`로 나뉜다. Bridging은 guest IP가 broader network에 직접 보이는 방식이고, NAT는 guest address가 host-local이며 VMM이 broader network와 guest 사이 routing을 제공하는 방식이다. VMM은 guests 사이와 external systems 사이 firewalling도 제공할 수 있다.

#### 18.6.4 Storage Management

Multiple OS가 설치된 VM 환경에서는 boot disk가 어디에 있는지부터 문제가 된다. Traditional multiboot처럼 physical boot disk를 partitions로 나누는 방식은 tens/hundreds of VMs에 적합하지 않다.

Hypervisor type별 storage 방식은 다르다.

| hypervisor type | storage management |
|---|---|
| type 0 | root disk partitioning 또는 control partition의 disk manager가 다른 partitions에 disk space 제공 |
| type 1 | guest root disk와 configuration을 VMM file systems의 one or more files에 저장 |
| type 2 | guest root disk와 configuration을 host OS file systems에 저장 |

Type 1/2의 disk image 방식은 performance overhead 가능성이 있지만 copying/moving guests를 매우 쉽게 만든다. Guest의 root disk contents가 VMM 안 one file에 들어 있으므로, duplicate가 필요하면 disk image를 copy하고 VMM에 새 copy를 등록하면 된다. 같은 VMM을 실행하는 다른 system으로 이동할 때도 guest를 halt하고 image를 copy한 뒤 start하면 된다.

Database server처럼 여러 disks/file systems를 쓰는 workload는 root disk image만으로 부족할 수 있다. 이 경우 VMM은 여러 files를 만들고 guest에게 disks처럼 보여 준다. Guest는 평소처럼 disk I/O를 수행하고, VMM은 guest disk I/O requests를 correct files에 대한 file I/O commands로 translate한다.

`P-to-V(physical-to-virtual)` conversion은 현재 physical system disk blocks를 읽어 VMM이 관리할 VM files로 저장한다. 반대로 `V-to-P(virtual-to-physical)` conversion은 guest data files를 physical disk blocks로 생성해 guest를 native OS/applications 형태로 재현한다. V-to-P는 문제가 VMM 때문인지 확인하려는 debugging에 유용하다.

#### 18.6.5 Live Migration

`live migration`은 type 0/1 hypervisors에서 제공되는 기능으로, running guest를 한 system에서 다른 system으로 거의 끊김 없이 옮긴다. Users와 network connections는 noticeable impact 없이 계속 유지된다. Overloaded host의 load를 줄이거나 hardware maintenance를 downtime 없이 수행할 수 있다.

Live migration이 가능한 이유는 guest와 VMM 사이 interface가 well-defined이고, VMM이 guest에 대해 유지하는 state가 제한적이기 때문이다. Migration은 다음 단계로 진행된다.

| 단계 | 동작 |
|---|---|
| 1 | source VMM이 target VMM과 connection을 만들고 guest 전송 허용 여부를 확인 |
| 2 | target이 new VCPU, new nested page table, other state storage를 만들어 new guest 준비 |
| 3 | source가 read-only memory pages를 target에 전송 |
| 4 | source가 read-write pages를 target에 보내고 clean으로 mark |
| 5 | guest 실행 중 수정된 dirty pages를 반복해서 다시 전송하고 clean으로 mark |
| 6 | 반복 주기가 충분히 짧아지면 source가 guest를 freeze하고 final VCPU state, other state, final dirty pages를 보낸 뒤 target에서 guest 실행 |
| 7 | target이 guest running을 acknowledge하면 source가 original guest를 terminate |

![Live migration](@/assets/images/353_Figure_18.8_page_862.png)
<p align="center"><sub>Figure 18.8 · PDF p. 862 · source VMM이 memory pages와 final CPU state를 target VMM에 넘겨 running guest를 이전하는 단계</sub></p>

Figure 18.8은 live migration이 “한 번에 복사하고 끝”이 아니라 read-write pages와 dirty pages를 여러 번 반복 전송한 뒤, 마지막 짧은 freeze window에서 final state를 넘기는 방식임을 보여 준다.

Live migration의 중요한 제한은 disk state를 옮기지 않는다는 점이다. Guest의 open file tables, system-call state, kernel state 등 대부분 execution state는 guest memory 안에 있지만, disk I/O는 memory보다 훨씬 느리고 used disk space는 used memory보다 훨씬 크다. 따라서 guest disks는 migration 과정에서 함께 copy하지 않고, guest가 network를 통해 접근하는 remote storage에 있어야 한다. 일반적으로 `NFS`, `CIFS`, `iSCSI` 같은 network-based storage에 VM images와 guest storage를 두면, network connections가 유지되는 한 migration 후에도 disk access가 계속된다.

Live migration은 data center 운영 방식을 바꾼다. Virtualization management tools가 여러 VMMs의 resource use를 모니터링하고 guests를 자동 이동시켜 load balancing할 수 있다. 또한 electricity/cooling 최적화를 위해 일부 servers의 guests를 다른 servers로 몰아낸 뒤 해당 servers를 power down하고, load가 증가하면 다시 power up하여 guests를 되돌릴 수 있다.

### 18.7 Examples

#### 18.7.1 VMware

`VMware Workstation`은 Intel x86-compatible hardware를 isolated VMs로 abstract하는 commercial application이며, 전형적 `type 2 hypervisor`다. Windows나 Linux 같은 host OS 위 application으로 실행되고, 여러 guest operating systems를 independent VMs로 동시에 실행하게 한다.

![VMware Workstation architecture](@/assets/images/354_Figure_18.9_page_864.png)
<p align="center"><sub>Figure 18.9 · PDF p. 864 · Linux host OS 위 virtualization layer가 FreeBSD, Windows NT, Windows XP guests를 각각 virtual CPU/memory/devices와 함께 실행하는 구조</sub></p>

Figure 18.9에서 virtualization layer는 physical hardware를 abstract하여 각 VM에 virtual CPU, virtual memory, virtual disk drives, virtual network interfaces를 제공한다. Guest가 소유하고 관리한다고 믿는 physical disk는 실제로는 host file system 안의 file이다. 따라서 identical guest를 만들려면 그 file을 copy하면 되고, disaster protection이나 relocation도 file copy/move로 단순해진다. 이 점이 VM이 system administration과 resource management를 쉽게 만드는 핵심이다.

#### 18.7.2 The Java Virtual Machine

`Java Virtual Machine(JVM)`은 programming-environment virtualization의 예다. Java compiler는 각 Java class에 대해 architecture-neutral `bytecode`가 담긴 `.class` file을 만든다. 이 bytecode는 JVM implementation이 있는 어떤 architecture/OS에서도 실행될 수 있다.

JVM은 abstract computer specification이다. 주요 구성은 `class loader`와 Java interpreter다. Class loader는 Java program과 Java API의 compiled `.class` files를 load하고, `verifier`는 `.class` file이 valid Java bytecode인지 확인한다. Verifier는 stack overflow/underflow를 막고, pointer arithmetic 같은 illegal memory access 가능성을 차단한다.

![Java virtual machine](@/assets/images/355_Figure_18.10_page_865.png)
<p align="center"><sub>Figure 18.10 · PDF p. 865 · Java program과 Java API의 .class files가 class loader를 거쳐 Java interpreter에서 실행되는 JVM 구조</sub></p>

JVM은 memory도 자동 관리한다. `garbage collection`은 더 이상 사용되지 않는 objects의 memory를 reclaim해 system에 돌려준다. Java performance 연구에서 garbage collection algorithms는 큰 비중을 차지한다.

JVM 구현 방식은 여러 가지다.

| JVM 구현 방식 | 의미 | trade-off |
|---|---|---|
| software interpreter | bytecode operations를 하나씩 interpret | portable하지만 느릴 수 있음 |
| `JIT(just-in-time) compiler` | method 최초 호출 시 bytecode를 host native machine language로 변환하고 cache | 반복 호출 성능 향상 |
| hardware JVM | Java bytecode를 native code처럼 실행하는 special chip | interpreter/JIT overhead 제거 가능하지만 범용성 낮음 |

### 18.8 Virtualization Research

Virtualization research는 system compatibility 해결을 넘어 cloud computing, microservices, embedded systems, secure partitioning으로 확장되고 있다.

Cloud 환경에서는 같은 application을 thousands of systems에서 실행하는 일이 흔하다. 하지만 “application + service-rich general-purpose OS + VM + hypervisor” stack은 무겁다. `unikernel`은 이 문제를 줄이기 위해 등장한 library operating system 기반 specialized machine image다. Application, 호출하는 system libraries, 필요한 kernel services를 one address space의 single binary로 compile하여 VM 또는 bare metal에서 실행한다.

Unikernel의 목표는 두 가지다.

| 목표 | 이유 |
|---|---|
| efficiency | 필요한 library/kernel services만 포함해 resource footprint를 줄임 |
| security | 불필요한 OS services를 제거해 attack surface를 줄임 |

Modern CPU virtualization instructions는 hardware 효율뿐 아니라 process control 연구도 촉진했다. `partitioning hypervisors`는 machine physical resources를 guests 사이에 fully commit하여 나눈다. Traditional cloud VMM처럼 overcommit하지 않고, guest마다 allocated hardware를 관리하게 해 real-time/security-sensitive workloads에 유리하게 만든다.

예를 들어 Linux system에 safety/security-critical tasks를 위한 real-time capability가 부족하다면, lightweight real-time OS를 별도 guest VM domain에서 실행해 기능을 확장할 수 있다. Hypervisor는 system initialization과 task start만 담당하고 ongoing operation에는 관여하지 않는다. 각 VM은 자기 allocated hardware를 interference 없이 관리하므로 real-time properties와 security isolation이 좋아진다.

`separation hypervisors`인 Quest-V, eVM, Xtratum, Siemens Jailhouse 같은 projects는 virtualization으로 system components를 chip-level distributed system처럼 partition한다. Hardware extended page tables를 사용해 sandboxed guests 사이 secure shared memory channels를 만들 수 있다. 주요 target은 robotics, self-driving cars, Internet of Things처럼 mixed criticality와 isolation이 중요한 영역이다.

### 18.9 Summary

Virtualization은 guest에게 underlying hardware의 duplicate를 제공해 여러 guests가 하나의 system에서 동시에 실행되게 한다. 각 guest는 자신이 native OS이고 full control을 가진다고 믿지만, 실제로는 VMM/hypervisor가 CPU, memory, I/O, storage를 multiplexing하고 보호한다.

초기 virtualization은 IBM mainframes에서 users를 segregate하고 각자 execution environment를 제공하기 위해 등장했다. CPU 성능 향상, software techniques, hardware virtualization support가 서로 강화되면서 data centers와 personal computers 모두에서 일반 기술이 되었다.

Hypervisor types는 서로 다른 trade-off를 갖는다. Type 0은 hardware/firmware partitioning에 가깝고, type 1은 data center OS처럼 guest VMs를 직접 관리하며, type 2는 host OS 위 application으로 실행된다. Paravirtualization은 guest OS 수정으로 performance를 얻고, programming-environment virtualization은 language/runtime이 제공하는 virtual environment다. Emulation은 다른 architecture용 guest instructions를 target native instructions로 번역한다.

Virtualization implementation은 hardware support가 적을수록 어렵다. Trap-and-emulate, binary translation, nested page tables, hardware-assisted virtualization, DMA/interrupt remapping은 모두 VMM이 guests를 속도·안전성·정확성 사이에서 균형 있게 실행하기 위한 building blocks다.

VMM은 CPU scheduling, memory management, I/O management, storage management를 guest 관점과 host reality 사이에서 조정한다. Overcommitment, ballooning, page sharing, virtual networking, disk images, live migration은 VM이 실제 data center에서 유용해지는 핵심 mechanisms다.

연구 흐름은 VM을 더 가볍고 안전하게 만드는 방향으로 간다. Unikernels는 cloud deployments의 footprint와 attack surface를 줄이려 하고, partitioning/separation hypervisors는 real-time, embedded, safety-critical domains에서 stronger isolation과 deterministic behavior를 목표로 한다.

## 연결 관계

Chapter 2의 OS 구조와 layered approach는 virtualization의 “한 layer가 다른 execution environment를 제공한다”는 관점을 이해하는 기반이다. 또한 system call, privileged instruction, kernel/user mode는 trap-and-emulate와 hardware assistance의 전제가 된다.

Chapter 3-5의 processes, threads, CPU scheduling은 VMM scheduling과 직접 연결된다. Guest OS도 scheduling을 하고 VMM도 scheduling을 하므로, time slice와 real-time assumptions가 virtualization에서 왜 깨질 수 있는지 설명할 수 있다.

Chapter 9-10의 memory management와 virtual memory는 NPT, EPT/RVI, double paging, ballooning, page sharing을 이해하는 기반이다. Guest page tables와 host physical memory 사이에 한 단계가 더 들어간다는 점이 핵심이다.

Chapter 12의 I/O systems와 Chapter 11의 storage structure는 DMA pass-through, interrupt remapping, virtual devices, disk images, P-to-V/V-to-P conversion을 이해하는 데 필요하다.

Chapter 16-17의 security/protection은 VM isolation, application containment, containers, sandboxing, partitioning hypervisors와 연결된다. VM은 protection domain을 더 큰 단위로 만든다고 볼 수 있다.

## 오해하기 쉬운 내용

`VM`과 `container`는 같지 않다. VM은 guest OS와 virtual hardware를 제공하고, container는 보통 하나의 kernel을 공유하면서 process/application environment를 분리한다.

`type 1 hypervisor`와 `type 2 hypervisor`의 차이는 단순히 성능만이 아니다. Type 1은 hardware 위에서 OS처럼 guest management를 담당하고, type 2는 host OS 위 process로 실행되므로 hardware access, scheduling, I/O path가 다르다.

`paravirtualization`은 guest를 속이는 기술이 아니다. Guest OS를 수정해 VMM과 협력하게 하므로 성능을 얻지만 guest portability와 수정 비용이 생긴다.

`emulation`은 virtualization보다 넓은 호환성을 주지만 보통 더 느리다. 다른 CPU instruction set을 software로 번역해야 하므로 performance penalty와 correctness 문제가 크다.

`memory overcommitment`는 공짜가 아니다. Ballooning과 page sharing으로 효율화할 수 있지만, double paging이나 excessive pressure가 생기면 guest performance가 크게 떨어질 수 있다.

`live migration`은 disk까지 통째로 실시간 복사하는 기능이 아니다. Disk state는 보통 shared/network storage에 남아 있고, migration은 memory/CPU/device-visible state와 network continuity를 유지하는 방식으로 동작한다.

`JVM`은 hardware VM과 다르지만, programming-environment virtualization이라는 의미에서 VM이다. Java bytecode와 JVM API가 hardware-independent execution environment를 제공한다.

## 면접 질문

1. `virtual machine`, `guest`, `host`, `VMM/hypervisor`를 각각 정의하라.
2. VMM의 `fidelity`, `performance`, `safety` 요구사항을 설명하라.
3. Type 0, type 1, type 2 hypervisor를 실행 위치와 resource management 관점에서 비교하라.
4. `trap-and-emulate`가 동작하는 과정을 privileged instruction 예시로 설명하라.
5. x86의 `popf` 같은 special instruction이 trap-and-emulate를 어렵게 만든 이유는 무엇인가?
6. `binary translation`은 언제 필요하며 translation cache가 성능에 중요한 이유는 무엇인가?
7. `VCPU`와 `PCB`의 유사점을 설명하라.
8. `nested page table(NPT)`, Intel `EPT`, AMD `RVI`가 해결하는 문제는 무엇인가?
9. DMA pass-through와 `VT-d`가 없을 때 virtualized I/O에서 어떤 보안·성능 문제가 생기는가?
10. `paravirtualization`과 full virtualization을 guest OS 수정 여부와 성능 관점에서 비교하라.
11. `container`와 full VM의 차이를 kernel sharing, isolation, startup cost 관점에서 설명하라.
12. CPU overcommitment가 guest OS scheduler와 time-of-day clock에 미치는 영향을 설명하라.
13. VMM memory reclaim 방식인 `double paging`, `balloon memory manager`, page sharing을 비교하라.
14. Guest networking에서 `bridging`과 `NAT`의 차이를 설명하라.
15. VM disk image가 copying, cloning, migration을 쉽게 만드는 이유는 무엇인가?
16. `P-to-V`와 `V-to-P` conversion은 각각 언제 필요한가?
17. `live migration`의 단계와 dirty pages 반복 전송이 필요한 이유를 설명하라.
18. Live migration에서 disk state를 직접 전송하지 않는 이유와 remote storage가 필요한 이유를 설명하라.
19. JVM의 `class loader`, `verifier`, `JIT compiler`, `garbage collection` 역할을 설명하라.
20. `unikernel`과 `partitioning hypervisor`가 cloud/security/real-time 연구에서 주목받는 이유는 무엇인가?
