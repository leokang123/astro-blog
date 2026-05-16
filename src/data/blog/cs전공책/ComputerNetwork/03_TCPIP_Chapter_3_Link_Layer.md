---
title: "Chapter 3. Link Layer"
order: 3
pubDatetime: 2026-05-16T00:00:00+09:00
modDatetime: 2026-05-16T08:19:36+09:00
description: "Chapter 3. Link Layer 정리 노트입니다."
tags:
  - cs전공책
  - ComputerNetwork
---

# Chapter 3. Link Layer

- 과목: Computer Network
- 기준 교재: TCP/IP Illustrated, Volume 1
- 관련 페이지: PDF pp. 118-203
- 우선순위: 필수

## 개요

이 장은 IP datagram이 실제 네트워크 매체 위에서 어떻게 실려 가는지를 설명한다. TCP/IP 관점에서 link layer는 IP 모듈이 만든 datagram을 frame에 담아 전송하고, 수신한 frame에서 다시 IP datagram을 꺼내 위 계층으로 넘기는 계층이다. 단순히 "물리 선로 가까운 계층"이 아니라, frame format, address, media access control, MTU, switching, wireless MAC, point-to-point encapsulation, tunneling처럼 IP의 실제 전달 가능성을 결정하는 규칙들이 모여 있는 층이다.

핵심 흐름은 wired LAN의 대표인 Ethernet/IEEE 802.3에서 시작해, bridge/switch와 STP로 LAN이 커질 때 생기는 문제를 다루고, Wi-Fi/IEEE 802.11처럼 공유 무선 매체에서 충돌을 피하는 방식, PPP처럼 point-to-point link를 구성하는 방식, 마지막으로 MTU/path MTU/tunneling과 link-layer attack으로 이어진다.

## 핵심 개념

- link layer: IP datagram을 실제 매체에서 주고받도록 frame으로 캡슐화하는 계층이다. ARP 같은 보조 protocol도 이 계층과 긴밀히 연결된다.
- frame: link-layer PDU(protocol data unit)이다. IP datagram은 frame payload로 들어가며, 각 link layer마다 header/trailer와 최대 크기가 다르다.
- MTU(Maximum Transmission Unit): 한 frame에 담을 수 있는 upper-layer payload의 최대 크기이다. IP fragmentation, path MTU discovery, tunneling overhead와 직접 연결된다.
- MAC(Media Access Control): 공유 매체에서 누가 언제 전송할지 정하는 link-layer 하위 기능이다. Ethernet의 CSMA/CD, Wi-Fi의 CSMA/CA가 대표적이다.
- LLC(Logical Link Control): IEEE 802에서 여러 MAC 방식 위에 공통 link interface를 제공하려던 하위 계층이다. TCP/IP Ethernet에서는 Ethernet II encapsulation이 더 널리 쓰인다.
- switch/bridge: frame의 source address를 학습하고 destination address 기준으로 forwarding/filtering을 수행해 Ethernet LAN을 확장한다.

## 세부 정리

### 3.1 Introduction

TCP/IP에서 link layer는 IP module과 network interface hardware 사이를 잇는다. IP는 목적지 IP address를 보고 다음 hop을 고르지만, 실제 전송은 특정 link의 frame으로 이루어진다. 따라서 같은 IP datagram이라도 Ethernet, Wi-Fi, PPP, cellular, tunnel link 위에서는 서로 다른 frame format과 전송 규칙을 가진다.

이 계층을 이해할 때 중요한 축은 세 가지다.

- encapsulation: IP datagram 앞뒤에 link-layer header/trailer를 붙여 frame을 만든다.
- delivery scope: link-layer address는 보통 같은 link 또는 같은 LAN segment 안에서만 직접 의미가 있다.
- size constraint: link마다 MTU가 달라서 IP packet 크기와 fragmentation 여부에 영향을 준다.

이 장의 뒤쪽에서 다루는 tunneling은 이 구조를 한 번 더 겹친 것이다. 어떤 protocol packet을 다른 protocol의 payload로 넣어, 논리적으로는 새로운 link처럼 보이게 만든다.

### 3.2 Ethernet and the IEEE 802 LAN/MAN Standards

Ethernet은 처음에는 DIX(Digital, Intel, Xerox) Ethernet으로 출발했고, 이후 IEEE 802.3 표준 계열로 정리되었다. 초기 Ethernet은 하나의 cable을 여러 host가 공유하는 bus 형태였고, 모든 host가 같은 전송 매체를 바라보는 구조였다. 이때 필요한 규칙이 CSMA/CD(Carrier Sense Multiple Access with Collision Detection)이다.

CSMA/CD의 동작은 다음처럼 이해할 수 있다.

1. Carrier Sense: host는 전송 전에 매체가 idle인지 듣는다.
2. Multiple Access: 여러 host가 같은 매체를 공유하므로 동시에 전송을 시작할 수 있다.
3. Collision Detection: 동시에 전송이 발생하면 전기적 충돌을 감지한다.
4. Backoff: 충돌한 host들은 즉시 멈추고 random time을 기다린 뒤 재시도한다. 충돌이 반복되면 backoff window가 커져 재충돌 확률을 낮춘다.

![Figure 3-1](@/assets/images/026_Figure_3_1_page_119.png)
<p align="center"><sub>Figure 3-1 · PDF p. 119 · shared Ethernet에서 여러 station이 하나의 cable을 공유하고 CSMA/CD로 접근을 조정하는 구조</sub></p>

초기 shared Ethernet에서는 충돌이 정상적인 동작 일부였지만, 현대 Ethernet은 대부분 switched Ethernet이다. 각 host는 switch의 port에 point-to-point로 연결되고, switch가 frame을 적절한 port로 전달한다. 이 구조에서는 각 link가 full-duplex로 동작할 수 있으므로 전통적인 CSMA/CD의 필요성이 크게 줄어든다.

![Figure 3-2](@/assets/images/027_Figure_3_2_page_120.png)
<p align="center"><sub>Figure 3-2 · PDF p. 120 · switched Ethernet에서 host와 switch가 star 형태로 연결되고 switch가 frame forwarding을 담당하는 구조</sub></p>

Ethernet의 발전은 속도만 바뀐 것이 아니다. 10Mb/s shared cable에서 100Mb/s, 1Gb/s, 10Gb/s, 100Gb/s 이상의 switched full-duplex link로 이동하면서, LAN의 중심 문제도 "공유 매체 충돌 제어"에서 "switching, loop 방지, VLAN, QoS, aggregation" 쪽으로 이동했다.

### 3.2.1 The IEEE 802 LAN/MAN Standards

IEEE 802는 LAN(Local Area Network)과 MAN(Metropolitan Area Network)을 위한 표준 계열이다. 그중 IEEE 802.3은 Ethernet, IEEE 802.11은 Wi-Fi를 다룬다. 둘 다 link layer에 속하지만 매체 특성이 다르기 때문에 MAC 방식은 서로 다르다.

IEEE 802 계열에서는 link layer를 대략 두 하위 계층으로 나누어 본다.

| 하위 계층 | 역할 | 예시 |
|---|---|---|
| LLC(Logical Link Control) | 여러 MAC 위에서 공통 link-layer interface를 제공하려는 계층 | IEEE 802.2 LLC, SNAP |
| MAC(Media Access Control) | 실제 매체 접근, frame format, address 처리 | IEEE 802.3 Ethernet MAC, IEEE 802.11 WLAN MAC |

역사적으로 IEEE 802.2 LLC + IEEE 802.3 frame format은 Ethernet II frame과 달랐다. TCP/IP에서는 RFC 894의 Ethernet encapsulation이 널리 쓰였고, IPv6 over Ethernet은 RFC 2464에서 정의된다. LLC/SNAP encapsulation은 일부 환경에서 쓰였지만, 일반적인 TCP/IP Ethernet frame을 볼 때는 EtherType이 있는 Ethernet II 형식을 먼저 떠올리면 된다.

### 3.2.2 The Ethernet Frame Format

Ethernet frame은 preamble과 SFD(Start Frame Delimiter)로 수신 측 clock recovery와 frame 시작 인식을 돕고, 그 뒤에 MAC destination/source address, type/length, payload, FCS(Frame Check Sequence)가 이어지는 구조를 가진다. 구체적인 field 크기와 CRC 계산, frame size 제한은 다음 구간에서 Figure 3-3과 함께 정리한다.

![Figure 3-3](@/assets/images/028_Figure_3_3_page_124.png)
<p align="center"><sub>Figure 3-3 · PDF p. 124 · Ethernet/IEEE 802.3 frame format, 802.1p/q tag, FCS/CRC32, envelope frame 확장 위치</sub></p>

Ethernet frame의 주요 field는 다음처럼 해석하면 된다.

| Field | 크기 | 의미 |
|---|---:|---|
| Preamble | 7 bytes | 수신기가 bit timing을 맞추도록 돕는 반복 bit pattern |
| SFD(Start Frame Delimiter) | 1 byte | 실제 frame 시작을 알리는 경계 |
| Destination Address | 6 bytes | 수신 MAC address. unicast, broadcast, multicast가 가능 |
| Source Address | 6 bytes | 송신 MAC address. switch/bridge의 learning에도 사용 |
| Length/Type | 2 bytes | 값이 1500 이하이면 payload length, 1536 이상이면 EtherType |
| 802.1p/q Tag | 보통 4 bytes | VLAN ID, priority(QoS) 등을 담는 선택 field |
| Payload | 보통 최대 1500 bytes | IP datagram, ARP packet 같은 upper-layer PDU |
| FCS(Frame Check Sequence) | 4 bytes | CRC32 기반 오류 검출 값 |

MAC address는 Ethernet address, link-layer address, 802 address, hardware address, physical address라고도 부른다. broadcast는 ARP가 같은 LAN에서 IP address에 대응하는 link-layer address를 찾을 때 중요하고, multicast는 ICMPv6 등에서 neighbor discovery와 관련된다.

Length/Type field는 역사적 이유로 overloaded field이다. 값이 1500 이하이면 IEEE 802.3의 length 의미이고, 1536 이상이면 protocol type을 나타낸다. TCP/IP에서 자주 보는 EtherType은 IPv4 `0x0800`, ARP `0x0806`, IPv6 `0x86DD`, VLAN tagged frame `0x8100`이다.

### 3.2.2.1 Frame Check Sequence/Cyclic Redundancy Check (CRC)

FCS(Frame Check Sequence)는 Ethernet frame 끝의 32-bit CRC32 값이다. CRC는 암호학적 인증이 아니라 전송 중 bit pattern이 깨졌는지를 높은 확률로 잡아내는 오류 검출 방식이다. 송신 측은 message 뒤에 n개의 0 bit를 붙인 augmented message를 만들고, 정해진 generator polynomial로 modulo-2 division을 수행한다. 나머지(remainder)의 one's complement가 CRC field에 들어간다.

수신 측도 같은 계산을 수행한다. 계산 결과와 FCS가 맞지 않으면 frame은 손상되었을 가능성이 높으므로 보통 폐기된다. 이때 Ethernet 자체가 손상 frame을 재전송해 주는 것은 아니다. 재전송이 필요하면 상위 계층, 예를 들어 TCP 같은 reliability mechanism이 감지하고 처리한다.

![Figure 3-4](@/assets/images/029_Figure_3_4_page_126.png)
<p align="center"><sub>Figure 3-4 · PDF p. 126 · CRC4 예시로 보는 modulo-2 binary division과 remainder 계산</sub></p>

CRC를 공부할 때 주의할 점은 "나머지를 붙이면 오류를 정정한다"가 아니라 "수신자가 오류 가능성을 검출하게 한다"는 것이다. CRC가 틀린 frame은 조용히 버려질 수 있으므로, link layer 위의 protocol은 loss 가능성을 항상 염두에 두어야 한다.

### 3.2.2.2 Frame Sizes

Ethernet에는 최소 frame size와 최대 frame size가 모두 있다. 기본 Ethernet frame은 64-1518 bytes 범위이며, 이 1518 bytes에는 14-byte Ethernet header와 4-byte CRC가 포함된다. payload 관점의 전통적 Ethernet MTU는 1500 bytes이다.

최소 64 bytes 제한은 초기 10Mb/s half-duplex Ethernet의 CSMA/CD와 연결된다. frame이 너무 짧으면 송신자가 frame 전송을 끝낸 뒤에야 먼 곳에서 발생한 collision을 알게 될 수 있다. 그래서 collision이 발생한 frame이 "지금 송신 중인 frame"임을 확실히 알 수 있도록 최소 길이가 필요했다. payload가 너무 작으면 pad byte를 붙여 최소 frame size를 맞춘다.

최대 frame size는 효율성과 오류 복구 비용의 trade-off이다.

| 선택 | 장점 | 단점 |
|---|---|---|
| 작은 frame | 오류가 나도 재전송할 단위가 작음, legacy 장비와 호환 쉬움 | header, FCS, preamble, IPG 같은 per-frame overhead가 자주 반복됨 |
| 큰 frame | 큰 데이터 전송 시 overhead 비율 감소 | 오류 시 손실 단위가 커짐, 모든 장비의 MTU 호환 필요 |

Ethernet II에는 7-byte preamble, 1-byte SFD, 12-byte-time IPG(Inter-Packet Gap)도 실질 overhead로 존재한다. payload 1500 bytes를 꽉 채워도 per-frame efficiency는 약 98%가 한계다. jumbo frame은 보통 9000 bytes 정도까지 frame을 키워 큰 데이터 전송 효율을 높이지만, 표준 Ethernet 장비와의 상호운용성 문제가 생길 수 있다.

### 3.2.3 802.1p/q: Virtual LANs and QoS Tagging

switched Ethernet이 커지면 모든 host를 하나의 거대한 LAN에 넣는 것이 쉬워진다. 장점은 host 간 직접 통신과 broadcast/multicast 전달이 단순하다는 것이다. 하지만 broadcast traffic이 모든 host로 퍼지고, 보안상 모든 station이 서로 직접 통신 가능한 구조가 바람직하지 않을 수 있다. VLAN(Virtual LAN)은 이 문제를 switch 내부의 논리적 분리로 해결한다.

VLAN에서 같은 switch에 물려 있어도 서로 다른 VLAN에 속한 host는 직접 link-layer forwarding으로 통신하지 못한다. 서로 다른 VLAN 사이의 통신에는 router 또는 L3 switch가 필요하다. 따라서 VLAN은 "물리 배선 구조"와 "논리적 broadcast domain"을 분리하는 장치로 볼 수 있다.

VLAN membership은 여러 방식으로 정할 수 있다.

| 방식 | 설명 | 주의점 |
|---|---|---|
| port-based VLAN | switch port마다 VLAN을 지정 | 단순하고 흔하지만 port 이동 시 설정 영향 |
| MAC-address-based VLAN | host MAC address를 VLAN에 매핑 | MAC 변경, 관리 table 유지가 부담 |
| IP-address-based VLAN | IP address 기준으로 VLAN 판단 | L2/L3 경계가 섞이고 정책 관리가 복잡 |

여러 switch 사이로 VLAN을 확장하려면 trunk link에서 frame이 어느 VLAN에 속하는지 표시해야 한다. IEEE 802.1q tag는 12-bit VLAN ID를 담아 최대 4096개의 값을 표현하지만, VLAN 0과 VLAN 4095는 예약되어 있다. 같은 tag 안에는 IEEE 802.1p priority 3 bits도 있어 8개의 service class를 표현할 수 있다. class 0은 일반 best-effort traffic, class 7은 routing/network management 같은 높은 우선순위 용도로 쓰일 수 있다. 다만 표준은 priority 값을 어떻게 표시할지를 정하고, 실제 scheduling/queuing 정책은 구현 또는 vendor 정책에 맡긴다.

![Figure 3-5](@/assets/images/030_Figure_3_5_page_130.png)
<p align="center"><sub>Figure 3-5 · PDF p. 130 · Wireshark에서 VLAN ID가 붙은 Q-tagged Ethernet frame을 확인한 예</sub></p>

Figure 3-5의 예시는 ARP packet이 VLAN 2 위에서 Ethernet II encapsulation으로 실린 모습이다. EtherType `0x8100`은 뒤에 VLAN header가 있음을 뜻하고, VLAN header가 VLAN ID와 priority를 제공한 뒤 실제 upper-layer protocol 정보가 이어진다.

### 3.2.4 802.1AX: Link Aggregation (Formerly 802.3ad)

link aggregation 또는 bonding은 둘 이상의 physical interface를 하나의 logical interface처럼 묶는 기법이다. 목적은 크게 두 가지다.

- redundancy: 한 link가 고장 나도 다른 link로 failover한다.
- performance: 여러 link에 traffic을 나누어 더 큰 aggregate bandwidth를 얻는다.

IEEE 802.1AX는 link aggregation의 표준 방식과 LACP(Link Aggregation Control Protocol)를 정의한다. LACP는 LACPDU라는 IEEE 802 frame을 주고받으며 어떤 member link들이 같은 LAG(Link Aggregation Group)에 들어갈 수 있는지 자동으로 판단한다. actor와 partner는 MAC address, port priority, port number, key 같은 정보를 교환하고, 조건이 맞는 port들을 aggregation한다.

운영 관점에서 중요한 제약은 flow ordering이다. 단순 round-robin으로 frame을 여러 link에 흩뿌리면 같은 flow의 packet 순서가 뒤바뀔 수 있다. 그래서 많은 aggregation 방식은 source/destination MAC address 등을 hash 또는 XOR하여 특정 flow를 특정 member link에 고정한다. 이렇게 하면 한 단일 flow가 여러 link의 총합 bandwidth를 반드시 다 쓰는 것은 아니지만, 여러 flow가 있을 때 전체 부하를 분산하면서 reordering을 줄일 수 있다.

### 3.3 Full Duplex, Power Save, Autonegotiation, and 802.1X Flow Control

초기 Ethernet은 shared cable 위의 half-duplex 방식이었다. 한 시점에 한 station만 의미 있게 전송할 수 있었고, collision detection이 필수였다. switched Ethernet에서는 host-switch 또는 switch-switch 사이가 point-to-point link가 되면서 여러 pair가 동시에 통신할 수 있고, full-duplex operation도 가능해졌다. full duplex에서는 송신과 수신이 동시에 가능하므로 collision detection 회로가 사실상 비활성화되고, half-duplex collision timing 때문에 생겼던 거리 제약도 완화된다.

autonegotiation은 link 양끝 interface가 speed, half/full duplex 같은 capability를 교환해 공통 동작 모드를 정하는 기능이다. 이 정보 교환은 data frame이 오가지 않을 때 physical layer signal로 수행된다. 운영체제에서는 Linux `ethtool`처럼 NIC의 supported link mode, advertised mode, negotiated speed, duplex, Wake-on capability를 확인하거나 설정하는 도구가 제공된다.

### 3.3.1 Duplex Mismatch

duplex mismatch는 한쪽은 full-duplex, 다른 한쪽은 half-duplex로 동작하는 불일치 상태이다. 이 상태가 골치 아픈 이유는 link가 완전히 끊어지지 않고 "느리고 이상한" 성능 저하로 나타난다는 점이다.

traffic이 적을 때는 문제가 눈에 잘 띄지 않는다. 하지만 양방향 대용량 전송처럼 한쪽이 보내는 동시에 받는 상황이 생기면 half-duplex 쪽은 들어오는 signal을 collision처럼 감지한다. 그러면 CSMA/CD의 exponential backoff가 작동하고, 동시에 해당 data는 손실되어 TCP 같은 상위 계층의 retransmission을 유발할 수 있다. 따라서 duplex mismatch는 단순 link up/down 문제가 아니라 throughput, retransmission, latency spike 형태로 드러난다.

### 3.3.2 Wake-on LAN (WoL), Power Saving, and Magic Packets

Wake-on LAN(WoL)은 host 또는 network interface가 저전력 상태에 있을 때 특정 frame을 수신하면 깨우는 기능이다. Linux의 Wake-On option은 어떤 종류의 frame이 wake-up trigger가 될지 bit로 표현한다. 예를 들어 physical-layer activity, unicast, multicast, broadcast, ARP, magic packet 등이 trigger가 될 수 있다.

magic packet은 가장 대표적인 WoL trigger이다. 보통 broadcast Ethernet frame 안에 UDP packet 형태로 실리지만, 핵심은 UDP port가 아니라 payload pattern이다. payload는 먼저 6 bytes의 `0xFF`로 시작하고, 이어서 깨울 대상의 MAC address를 16번 반복한다.

![Figure 3-7](@/assets/images/032_Figure_3_7_page_136.png)
<p align="center"><sub>Figure 3-7 · PDF p. 136 · magic packet이 6개의 0xFF 뒤에 대상 MAC address를 16회 반복하는 WoL payload pattern</sub></p>

WoL은 편리하지만 보안 관점에서는 "누가 어떤 네트워크 범위에서 깨울 수 있는가"를 함께 봐야 한다. 특히 broadcast로 전달되는 magic packet은 관리망, 방화벽, 스위치 정책과 맞물려 동작한다.

### 3.3.3 Link-Layer Flow Control

switched full-duplex Ethernet에서도 congestion이 사라지는 것은 아니다. 예를 들어 여러 station이 동시에 하나의 output port로 traffic을 보내면 output port contention이 생긴다. switch는 frame을 buffer에 저장하지만, 도착 rate가 나가는 link rate를 계속 초과하면 결국 frame drop이 발생한다.

802.3x flow control은 이를 완화하기 위해 PAUSE frame을 사용한다. PAUSE frame은 MAC control frame의 한 종류이며, Length/Type 값 `0x8808`, MAC control opcode `0x0001`로 식별된다. destination MAC address는 `01:80:C2:00:00:01`이고, full-duplex link에서만 사용된다. frame 안에는 송신자가 얼마나 멈춰야 하는지를 나타내는 hold-off time이 들어가며, 단위는 512 bit times이다.

다만 Ethernet-layer flow control은 부작용이 크다. switch buffer가 특정 flow 때문에 압박을 받더라도, switch가 여러 sender에게 PAUSE를 보내면 실제 원인이 아닌 host까지 같이 느려질 수 있다. 그래서 802.3x PAUSE는 존재하지만 항상 켜 두는 만능 해결책은 아니며, 상위 계층 congestion control이나 switch queue management와 함께 생각해야 한다.

### 3.4 Bridges and Switches

IEEE 802.1d는 bridge의 동작을 정의한다. switch는 본질적으로 고성능 multiport bridge로 볼 수 있다. bridge/switch는 여러 physical link-layer segment를 연결해 하나의 extended LAN처럼 보이게 하며, frame의 source MAC address를 관찰해 어느 address가 어느 port 뒤에 있는지 학습한다. 다음 구간에서는 이 learning/filtering database와 loop 방지를 위한 STP(Spanning Tree Protocol)를 자세히 정리한다.

![Figure 3-8](@/assets/images/033_Figure_3_8_page_138.png)
<p align="center"><sub>Figure 3-8 · PDF p. 138 · 두 switch가 연결된 extended Ethernet LAN과 각 station/switch의 MAC address</sub></p>

switch가 처음 켜지면 filtering database 또는 forwarding database(FDB)는 비어 있다. 이때 목적지 MAC address의 위치를 모르는 frame은 수신 port를 제외한 모든 port로 flooding된다. 이후 switch는 들어오는 frame의 source MAC address를 보고 "이 address는 이 port 뒤에 있다"는 mapping을 학습한다.

![Figure 3-9](@/assets/images/034_Figure_3_9_page_138.png)
<p align="center"><sub>Figure 3-9 · PDF p. 138 · source address 관찰로 학습된 Switch A/B의 filtering database 예</sub></p>

bridge/switch learning의 핵심 규칙은 간단하다.

| 상황 | switch 동작 |
|---|---|
| frame 수신 | source MAC address와 수신 port를 FDB에 기록 또는 갱신 |
| destination을 FDB에서 찾음 | 해당 port로만 forwarding. 단, 들어온 port와 같으면 filtering |
| destination을 모름 | 수신 port를 제외하고 flooding |
| broadcast/multicast | 정책에 따라 여러 port로 전달. multicast 최적화는 뒤의 MMRP/IGMP/MLD와 연결 |
| entry ageing timeout | 오래 보이지 않은 MAC entry 삭제 후 다시 학습 |

![Figure 3-11](@/assets/images/036_Figure_3_11_page_140.png)
<p align="center"><sub>Figure 3-11 · PDF p. 140 · Linux PC가 두 Ethernet segment 사이에서 learning bridge로 동작하는 예</sub></p>

FDB entry에는 ageing timer가 붙는다. station이 이동하거나 NIC가 교체되거나 MAC address가 바뀔 수 있으므로, 한 번 배운 mapping을 영원히 믿으면 안 된다. entry가 만료되면 다음 destination frame은 다시 flooding되고, 이후 source address 관찰로 새 위치를 학습한다. 따라서 learning bridge는 table이 비어 있어도 동작은 하지만, overhead가 커진다.

### 3.4.1 Spanning Tree Protocol (STP)

redundant link는 장애 대응에는 좋지만 Ethernet bridge에서는 loop를 만든다. loop가 있는 상태에서 flooding이 발생하면 frame copy가 계속 증폭되고, broadcast storm처럼 LAN 전체를 마비시킬 수 있다. 더 나쁘게는 같은 source MAC address가 여러 port에서 반복 관측되어 FDB가 흔들린다.

![Figure 3-12](@/assets/images/037_Figure_3_12_page_142.png)
<p align="center"><sub>Figure 3-12 · PDF p. 142 · redundant link가 있는 extended LAN에서 단순 flooding이 broadcast storm을 만들 수 있는 구조</sub></p>

STP(Spanning Tree Protocol)는 일부 port를 forwarding하지 않도록 막아 graph의 loop를 제거한다. 목표는 전체 bridge graph를 spanning tree로 바꾸는 것이다. spanning tree는 모든 node가 연결되어 있지만 cycle은 없는 edge 집합이다. 즉, 모든 station은 도달 가능해야 하지만 두 station 사이의 활성 path는 하나만 남긴다.

![Figure 3-13](@/assets/images/038_Figure_3_13_page_142.png)
<p align="center"><sub>Figure 3-13 · PDF p. 142 · STP가 일부 port를 blocked 상태로 두어 loop 없는 forwarding topology를 만든 예</sub></p>

STP는 BPDU(Bridge Protocol Data Unit)를 교환해 분산 알고리즘으로 tree를 만든다. 먼저 root bridge를 선출하고, 각 bridge는 root bridge까지의 least-cost path를 계산한다. link cost는 권장값 기준으로 link speed에 반비례한다. 예를 들어 10Mb/s link는 cost 100, 100Mb/s link는 19, 1000Mb/s link는 4처럼 빠른 link일수록 낮은 cost를 갖는다.

### 3.4.1.1 Port States and Roles

전통적인 STP의 port state는 blocking, listening, learning, forwarding, disabled이다. 이 state machine은 "loop가 생기지 않도록 충분히 기다리면서도, 결국 필요한 port는 forwarding에 참여시키는" 절충이다.

![Figure 3-14](@/assets/images/039_Figure_3_14_page_144.png)
<p align="center"><sub>Figure 3-14 · PDF p. 144 · STP port state transition과 RSTP에서 대응되는 discarding/learning/forwarding 상태</sub></p>

| STP state | data forwarding | address learning | BPDU 처리 | 의미 |
|---|---|---|---|---|
| blocking | 안 함 | 안 함 | 수신 감시 | loop 방지를 위해 대기 |
| listening | 안 함 | 안 함 | 송수신 가능 | tree 참여 가능성을 확인 |
| learning | 안 함 | 함 | 송수신 가능 | FDB를 미리 채우되 data는 아직 차단 |
| forwarding | 함 | 함 | 송수신 가능 | active path로 data 전달 |
| disabled | 안 함 | 안 함 | 안 함 | 관리상 비활성 |

port role도 중요하다. root port는 해당 bridge에서 root bridge로 가는 최선 경로의 port이다. designated port는 특정 segment에서 root로 가는 least-cost path를 대표해 forwarding하는 port이다. alternate port는 root에 갈 수 있지만 더 비싼 대체 경로라 forwarding하지 않는다. backup port는 같은 bridge의 designated port와 같은 segment에 붙은 여분 port이다.

### 3.4.1.2 BPDU Structure

BPDU는 bridge들이 STP/RSTP 상태를 맞추기 위해 주고받는 control frame이다. BPDU는 bridge group address `01:80:C2:00:00:00`으로 전송되며, 일반 data frame처럼 bridge를 그대로 통과하지 않고 bridge가 처리하고 필요한 정보를 반영해 새로 전파한다.

![Figure 3-15](@/assets/images/040_Figure_3_15_page_145.png)
<p align="center"><sub>Figure 3-15 · PDF p. 145 · BPDU format과 Root ID, Root Path Cost, Bridge ID, Port ID, timer field의 위치</sub></p>

BPDU에서 특히 중요한 field는 다음과 같다.

| Field | 의미 |
|---|---|
| Root ID | 송신자가 현재 root bridge라고 믿는 bridge identifier |
| Bridge ID | BPDU를 보낸 bridge의 identifier |
| Root Path Cost | 송신자에서 root까지의 누적 cost |
| Port ID | BPDU가 나간 port identifier |
| Flags | TC/TCA, RSTP의 Proposal/Agreement, Port Role, Learning/Forwarding 표시 |
| Message Age | BPDU가 root에서 출발해 몇 bridge를 거쳤는지에 가까운 age 값 |
| Max Age, Hello Time, Forward Delay | timeout, 주기적 전송, state 전이 대기 시간 |

Bridge ID와 Root ID는 priority + MAC address 형태로 비교된다. root bridge는 가장 작은 identifier를 가진 bridge로 선출된다. 관리자는 priority를 조정해 특정 switch가 root가 되도록 설계할 수 있다.

### 3.4.1.3 Building the Spanning Tree

각 bridge는 처음에는 자신이 root라고 가정하고 BPDU를 보낸다. 더 작은 Root ID를 담은 BPDU를 받으면 자신이 root라는 주장을 중단하고, 그 정보를 기준으로 BPDU를 전파한다. 더 작은 root 정보를 받은 port는 root port 후보가 되고, 나머지 port들은 segment별 cost 비교를 통해 designated/blocked 계열로 결정된다.

결과적으로 STP는 다음 기준으로 tree를 만든다.

1. 가장 작은 Bridge ID를 가진 root bridge를 고른다.
2. 각 bridge는 root까지의 최소 cost path를 찾는다.
3. 각 segment마다 root로 가는 최선 port를 designated port로 둔다.
4. loop를 만들 수 있는 나머지 port는 forwarding하지 않는다.

### 3.4.1.4 Topology Changes

FDB ageing만으로 topology change를 처리하면 너무 느리다. 기본 ageing이 5분 수준이면, link 장애나 port 이동 뒤에도 잘못된 MAC-to-port mapping이 오래 남을 수 있다. STP는 topology change를 BPDU로 알리고, bridge들이 ageing time을 forward delay 수준으로 줄여 잘못된 entry를 더 빨리 지우게 한다.

전통 STP에서는 port가 blocking 또는 forwarding 상태로 들어가는 사건이 topology change가 될 수 있다. change를 감지한 bridge는 root 방향으로 TCN BPDU를 보내고, root bridge가 이후 configuration BPDU에 TC bit를 세워 전체 network에 알린다. 이 과정은 정확하지만 convergence가 수십 초까지 걸릴 수 있다.

### 3.4.1.5 Example

Linux bridge는 단순 topology를 가정해 STP를 기본으로 꺼 두는 경우가 있다. `brctl stp br0 on`처럼 STP를 켜면 bridge ID, designated root, root port, path cost, max age, hello time, forward delay, ageing time, 각 port state와 designated bridge 정보를 확인할 수 있다.

Wireshark로 보면 BPDU는 destination `01:80:C2:00:00:00`으로 가며, LLC/SNAP 영역과 STP version/type, root/bridge/cost/timer 정보가 들어 있다. 책의 예시에서는 BPDU length가 Ethernet minimum보다 작게 보이는데, 이는 capture facility가 padding을 제거했기 때문이다.

### 3.4.1.6 Rapid Spanning Tree Protocol (RSTP) (Formerly 802.1w)

RSTP(Rapid Spanning Tree Protocol)는 전통 STP의 느린 convergence를 개선한다. 핵심 개선은 timer 만료를 기다리는 대신 port 상태 변화를 더 직접 감지하고, BPDU flag의 추가 bit를 사용해 bridge 간 agreement를 빠르게 형성하는 것이다.

RSTP는 STP의 다섯 state를 discarding, learning, forwarding 세 상태로 압축한다. discarding은 전통 STP의 disabled, blocking, listening을 흡수한다. 또한 alternate port를 즉시 사용할 수 있는 backup 경로로 두어 root port 장애 시 빠르게 전환할 수 있게 한다.

전통 STP와 RSTP의 차이는 다음처럼 정리된다.

| 항목 | STP | RSTP |
|---|---|---|
| 상태 수 | blocking/listening/learning/forwarding/disabled | discarding/learning/forwarding |
| topology change 전파 | root 방향 TCN 후 root가 TC bit 전파 | 감지한 switch가 TC 표시 BPDU를 더 직접 전파 |
| 장애 감지 | BPDU timeout 의존이 큼 | neighbor keepalive 성격으로 빠른 감지 |
| edge port | 일반 STP 절차 영향 | end station port는 바로 forwarding 가능 |
| convergence | 수십 초 가능 | 대개 훨씬 빠름 |

RSTP는 edge port와 point-to-point link를 구분한다. edge port는 end station에 붙은 port라 loop를 만들 가능성이 낮으므로 listening/learning 지연 없이 forwarding으로 갈 수 있다. 다만 그 port에서 BPDU가 보이면 더 이상 단순 edge port로 보지 않는다. full-duplex link는 보통 point-to-point link로 추정된다.

MSTP(Multiple Spanning Tree Protocol)는 RSTP를 VLAN 환경으로 확장해 VLAN별 또는 VLAN 그룹별로 다른 spanning tree를 구성할 수 있게 한다. backward compatibility를 위해 BPDU format 계열은 유지한다.

### 3.4.2 802.1ak: Multiple Registration Protocol (MRP)

MRP(Multiple Registration Protocol)는 bridged LAN에서 attribute를 등록하고 전파하는 일반 메커니즘이다. 대표 application은 MVRP와 MMRP이다.

| Protocol | 등록 대상 | 목적 |
|---|---|---|
| MVRP(Multiple VLAN Registration Protocol) | VLAN membership | station이 속한 VLAN 정보를 switch들에 전파해 VLAN filtering table을 동적으로 보강 |
| MMRP(Multiple MAC Registration Protocol) | group MAC address, multicast interest | multicast traffic을 필요한 port로만 보내도록 switch가 delivery port를 학습 |

MVRP는 VLAN topology 변화가 있을 때 무조건 STP 재계산으로 몰고 가지 않고, VLAN membership 정보를 bridge들에 전파해 filtering table을 갱신할 수 있게 한다. MMRP는 layer 2 multicast 관심 등록이라는 점에서 layer 3의 IGMP/MLD 및 switch의 IGMP/MLD snooping과 개념적으로 연결된다. multicast를 모두 broadcast처럼 뿌리면 overhead가 커지기 때문에, switch가 어느 port로 multicast를 보내야 하는지 아는 것이 중요하다.

### 3.5 Wireless LANs--IEEE 802.11 (Wi-Fi)

Wi-Fi, 즉 IEEE 802.11은 Ethernet과 같은 link-layer 계열이지만 매체가 무선이라는 점 때문에 훨씬 복잡하다. 무선에서는 송신 중 충돌을 신뢰성 있게 감지하기 어렵고, interference, signal strength, hidden terminal, power saving 같은 문제가 직접 성능과 correctness에 영향을 준다.

![Figure 3-17](@/assets/images/042_Figure_3_17_page_151.png)
<p align="center"><sub>Figure 3-17 · PDF p. 151 · IEEE 802.11의 STA, AP, BSS, DS, ESS 용어와 infrastructure mode 구조</sub></p>

IEEE 802.11 용어는 다음처럼 정리된다.

| 용어 | 의미 |
|---|---|
| STA(station) | 802.11을 사용하는 endpoint. client device와 AP 모두 station에 포함 |
| AP(access point) | wireless station들을 DS에 연결하는 infrastructure node |
| BSS(basic service set) | 하나의 AP와 그에 연결된 station들의 집합 |
| DS(distribution service) | 여러 AP/BSS를 이어 주는 backbone. 보통 wired Ethernet |
| ESS(extended service set) | DS로 연결된 여러 BSS의 집합 |
| SSID/service set identifier | service set을 식별하는 이름 |
| ESSID | 여러 BSS를 포괄하는 ESS의 이름으로 쓰이는 SSID |
| IBSS(independent BSS) | AP 없이 station들이 직접 통신하는 ad hoc mode |

infrastructure mode에서는 station이 AP에 association을 맺고, AP는 DS를 통해 다른 network와 연결한다. 반면 ad hoc mode에서는 AP 없이 station들이 peer-to-peer로 통신한다.

### 3.5.1 802.11 Frames

802.11에는 공통적인 frame 골격이 있지만 management, control, data frame에 따라 실제 field 사용이 달라진다. Ethernet frame과 비슷하게 MAC address와 FCS가 있지만, DS 방향, QoS, 802.11n high-throughput 기능, aggregation 여부 때문에 field 수가 더 많다.

![Figure 3-18](@/assets/images/043_Figure_3_18_page_152.png)
<p align="center"><sub>Figure 3-18 · PDF p. 152 · 802.11 physical-layer PDU와 MPDU/MAC header의 기본 data frame format</sub></p>

802.11 frame은 크게 physical-layer PDU와 MAC PDU(MPDU)로 볼 수 있다. preamble은 synchronization을 담당하고, PLCP(Physical Layer Convergence Procedure) header는 특정 PHY 정보를 PHY-independent하게 제공한다. PLCP 부분은 보통 낮은 rate로 전송되어 legacy 장비와의 호환 및 간섭 방지에 도움을 준다.

MPDU의 Frame Control Word에는 2-bit Type field가 있어 frame type을 구분한다.

| Frame type | 역할 |
|---|---|
| management frame | AP 탐색, association/authentication, beacon, SSID/rate/security 정보 교환 |
| control frame | RTS/CTS, ACK 등 매체 접근 조정과 수신 확인 |
| data frame | upper-layer data 전달, fragmentation/aggregation 가능 |

### 3.5.1.1 Management Frames

management frame은 station과 AP 사이의 association을 만들고 유지하고 끝내는 데 사용된다. 또한 SSID/ESSID, encryption 사용 여부, 지원 rate, channel, common time base 같은 정보를 전달한다. Wi-Fi interface가 주변 AP를 찾는 scan 동작도 management frame에 의존한다.

scan은 두 방식으로 이루어진다.

- passive scan: station이 각 frequency/channel을 돌며 beacon 등 기존 traffic을 듣는다.
- active scan: station이 probe request management frame을 보내고 AP의 응답을 기다린다.

scan 결과에는 AP MAC address, ESSID, mode, channel/frequency, signal quality, encryption(WPA 등), supported bit rates, TSF(time synchronization function) 값이 나타난다. SSID를 숨기는 것은 보안을 크게 높이지 못한다. SSID는 추측되거나 다른 management traffic에서 드러날 수 있으므로, 실질적 보안은 link encryption과 authentication/password에 기대야 한다.

### 3.5.1.2 Control Frames: RTS/CTS and ACKs

control frame은 wireless medium을 안정적으로 공유하기 위한 조정 장치다. 대표적으로 RTS(Request To Send), CTS(Clear To Send), ACK가 있다. RTS/CTS는 hidden terminal problem을 줄이기 위해 사용된다. 서로를 직접 듣지 못하는 station들이 동시에 AP 또는 같은 receiver로 보내면 충돌이 생길 수 있으므로, 짧은 RTS/CTS 교환으로 "이 시간 동안 누가 전송할지"를 주변 station에게 알린다.

RTS/CTS는 overhead가 있으므로 항상 이득이 아니다. hidden terminal 가능성이 낮은 작은 WLAN에서는 RTS/CTS threshold를 높게 두어 사실상 비활성화하는 편이 나을 수 있다. 반대로 큰 frame은 실패 시 비용이 크기 때문에 일정 크기 이상에서 RTS/CTS를 켜는 정책이 쓰인다.

802.11은 unicast frame에 ACK를 기대한다. 유선 Ethernet에서는 collision이 없으면 수신 가능성이 높다고 볼 수 있지만, 무선에서는 signal attenuation, interference, noise 때문에 frame이 조용히 깨질 수 있다. ACK가 정해진 시간 안에 오지 않으면 sender는 frame을 재전송한다. retransmission frame에는 Retry bit가 설정되며, receiver는 최근에 본 address + sequence/fragment number cache를 이용해 duplicate frame을 버릴 수 있다. multicast/broadcast frame에는 ACK를 붙이지 않는데, 그렇지 않으면 여러 receiver가 동시에 ACK를 보내는 ACK implosion 문제가 생긴다.

### 3.5.1.3 Data Frames, Fragmentation, and Aggregation

data frame은 IP 같은 upper-layer traffic을 운반한다. 802.11은 data frame을 여러 fragment로 쪼개거나, 반대로 여러 frame을 aggregation해 한 번에 보낼 수 있다. 두 기능은 반대 방향의 trade-off를 가진다.

fragmentation은 interference가 많은 환경에서 frame error probability를 낮추기 위한 기능이다. 큰 frame 하나를 보내면 bit error 하나만 있어도 전체 frame이 실패하지만, 작은 fragment로 나누면 일부 fragment만 재전송할 수 있다. 각 fragment는 자체 MAC header와 CRC를 가지며, unicast frame에만 적용된다. Sequence Control field에는 12-bit sequence number와 4-bit fragment number가 들어가고, More Frag bit가 뒤 fragment 존재 여부를 나타낸다.

fragmentation의 직관은 bit error rate(BER)로 설명된다. bit 하나가 성공할 확률이 `1 - P`라면 N bit frame 전체가 오류 없이 도착할 확률은 `(1 - P)^N`이다. N이 커질수록 성공 확률은 줄어든다. 하지만 fragment마다 header/ACK overhead가 생기므로, BER이 낮은 환경에서는 fragmentation이 오히려 성능을 낮출 수 있다.

802.11n의 aggregation은 overhead를 줄여 throughput을 높이는 방향이다.

![Figure 3-19](@/assets/images/044_Figure_3_19_page_157.png)
<p align="center"><sub>Figure 3-19 · PDF p. 157 · 802.11n의 A-MSDU와 A-MPDU frame aggregation 구조와 FCS/ACK 차이</sub></p>

| Aggregation | 구성 | 장점 | 약점 |
|---|---|---|---|
| A-MSDU | 여러 802.3 frame/MSDU를 하나의 802.11 frame 안에 묶음 | 802.11 MAC header를 한 번만 써서 효율적 | aggregate 전체가 하나의 FCS를 공유하므로 오류 시 전체 재전송 |
| A-MPDU | 여러 802.11 MPDU를 짧은 간격으로 묶음 | 각 subframe이 자체 FCS를 가지며 block ACK로 선택적 재전송 가능 | header/delimiter overhead가 더 큼 |

A-MSDU는 error-free network에서 작은 packet을 많이 묶을 때 이론적으로 효율적이다. 하지만 하나의 FCS에 묶이므로 aggregate가 커질수록 오류 시 손실 비용이 커진다. A-MPDU는 각 subframe을 개별 확인하고 block ACK로 실패 subframe만 재전송할 수 있어 실제 환경에서 더 좋은 성능을 내기 쉽다. 이 selective feedback의 목적은 TCP selective acknowledgment와 비슷하지만, 동작 계층과 세부 방식은 다르다.

### 3.5.2 Power Save Mode and the Time Sync Function (TSF)

PSM(Power Save Mode)은 station의 radio receive circuitry를 일부 시간 동안 꺼서 전력을 절약하는 기능이다. PSM에 들어간 STA는 outgoing frame의 Frame Control Word에 power-save 관련 bit를 설정한다. AP는 이를 보고 해당 STA로 갈 frame을 buffer에 저장한다. STA는 AP의 beacon time에 맞춰 깨어나 pending frame 존재 여부를 확인하고, 필요하면 저장된 frame을 요청한다.

PSM은 배터리 절약에 도움이 될 수 있지만 throughput에는 손해를 줄 수 있다. radio를 끄고 켜는 idle period가 생기고 mode switching 시간이 들어가기 때문이다. 또 모바일 기기에서는 화면, storage 등 다른 전력 소비원이 더 클 수 있어 NIC 절전만으로 전체 battery life가 크게 늘지 않을 수도 있다.

TSF(Time Synchronization Function)는 AP와 station들이 beacon timing을 공유하게 하는 64-bit microsecond counter 기반 시간 동기화 기능이다. station은 받은 TSF update 값이 자기 counter보다 크면 자기 시간을 그 값으로 맞춘다. 이 방식은 clock이 뒤로 가지 않게 하지만, clock rate가 조금씩 다른 station들이 있을 때 더 빠른 clock 쪽으로 동기화되는 경향을 만든다.

802.11e/802.11n은 PSM을 확장한다. APSD(Automatic Power Save Delivery)는 beacon마다 매번 깨지 않고, QoS Control field의 일부를 사용해 buffered frame을 주기적 batch로 받을 수 있게 한다. 802.11n의 spatial multiplexing power save mode는 MIMO처럼 여러 radio circuit을 쓰는 STA가 필요할 때까지 일부 회로를 꺼 둘 수 있게 한다. PSMP(Power Save Multi-Poll)는 AP와 STA 양방향 frame 전송 시점을 함께 schedule하는 방식이다.

### 3.5.3 802.11 Media Access Control

무선에서는 Ethernet처럼 충돌을 감지하기가 어렵다. 같은 장비가 송신하면서 동시에 자기 신호 밖의 다른 전송을 듣기 어렵고, hidden terminal처럼 서로 못 듣는 station들이 같은 receiver로 보내는 경우도 있다. 그래서 802.11은 CSMA/CD가 아니라 CSMA/CA(Carrier Sense Multiple Access with Collision Avoidance)를 중심으로 설계된다.

802.11의 medium sharing 방식은 세 가지 이름으로 등장한다.

| 방식 | 의미 | 비고 |
|---|---|---|
| PCF(Point Coordination Function) | 중앙 조정 방식 | optional, 널리 쓰이지 않음 |
| DCF(Distributed Coordination Function) | contention 기반 CSMA/CA | 모든 STA/AP에서 mandatory |
| HCF(Hybrid Coordination Function) | QoS를 위한 hybrid 방식 | 802.11e/n, EDCA/HCCA 포함 |

DCF에서는 station이 medium이 idle인지 보고, idle이면 일정 대기 후 backoff 절차를 거쳐 전송한다. busy이면 random time을 기다린 뒤 다시 확인한다. 전송 성공은 unicast ACK 수신으로 판단하고, ACK가 없으면 실패로 보고 재전송/backoff를 수행한다.

### 3.5.3.1 Virtual Carrier Sense, RTS/CTS, and the Network Allocation Vector (NAV)

virtual carrier sense는 frame의 Duration field를 보고 medium이 앞으로 얼마나 바쁠지 추정하는 방식이다. 각 station은 NAV(Network Allocation Vector)라는 local counter를 유지한다. 다른 station의 frame을 엿들었을 때 Duration 값이 현재 NAV보다 크면 NAV를 그 값으로 갱신한다. NAV가 0이 아니면 medium은 busy로 간주된다.

RTS와 CTS에도 Duration field가 있으므로, sender 주변 station과 receiver 주변 station 모두 앞으로의 예약 시간을 알 수 있다. 이는 hidden terminal problem을 줄이는 데 중요하다. ACK를 받으면 NAV는 0으로 reset될 수 있다.

### 3.5.3.2 Physical Carrier Sense (CCA)

physical carrier sense는 PHY가 실제 channel의 energy나 waveform을 보고 busy/idle을 판단하는 기능이다. 802.11에서는 이를 CCA(Clear Channel Assessment)라고 한다. CCA는 PHY마다 구현이 다르며, 보통 energy detection과 올바른 PLCP 인식 등을 사용한다. 실제 전송 가능 여부는 NAV(virtual sense)와 CCA(physical sense)를 함께 보고 판단한다.

### 3.5.3.3 DCF Collision Avoidance/Backoff Procedure

station은 NAV가 0이고 CCA가 idle이라고 판단해도 즉시 보내지 않는다. 많은 station이 같은 순간 channel이 비었다고 볼 수 있으므로, DIFS(Distributed Inter-Frame Space)를 기다린 뒤 backoff를 수행한다. backoff time은 `random number x slot time`이며, random number는 `[0, CW]`에서 고른다. CW(Contention Window)는 aCWmin에서 시작해 실패가 반복될수록 2의 거듭제곱 계열로 커져 aCWmax까지 증가한다.

ACK는 일반 data frame보다 우선되어야 하므로 SIFS(Short Interframe Space) 뒤에 전송된다. SIFS는 DIFS보다 짧다. 따라서 data frame을 받은 station은 다른 station들의 contention보다 먼저 ACK를 보낼 수 있다. 이 우선순위가 없으면 ACK 자체가 지연되거나 충돌해 불필요한 재전송이 늘어난다.

### 3.5.3.4 HCF and 802.11e/n QoS

802.11e QoS, Wi-Fi QoS, WMM(Wi-Fi Multimedia)은 voice over IP(VoIP), streaming video처럼 low jitter가 중요한 traffic을 지원하기 위한 MAC-layer 확장이다. 혼잡이 낮은 WLAN에서는 QoS MAC이 큰 차이를 만들지 않을 수 있지만, 혼잡한 환경에서 voice/video를 지원하려면 우선순위가 의미를 가진다.

HCF에는 두 접근이 있다.

| 방식 | 접근 방식 | 특징 |
|---|---|---|
| EDCA(Enhanced DCF Channel Access) | contention-based | 네 가지 access category별 MAC parameter로 priority 차등 |
| HCCA(HCF Controlled Channel Access) | reservation/polling-based | AP 내부 hybrid coordinator가 TXOP를 할당, 널리 쓰이진 않음 |

EDCA는 8개 UP(User Priority)을 4개 AC(Access Category)로 매핑한다. AC는 background, best-effort, video, voice를 의도한다. 높은 priority traffic은 더 유리한 contention parameter를 받아 TXOP(Transmit Opportunity)를 얻기 쉽다. 반면 HCCA는 TSPEC(traffic specification)과 admission control을 사용해 일정한 전송 기회를 예약하는 성격이 강하다.

### 3.5.4 Physical-Layer Details: Rates, Channels, and Frequencies

802.11 계열은 amendment마다 frequency band, modulation, channel width, data rate가 다르다. 802.11b/g는 2.4GHz ISM band를 사용하고, 802.11a는 5GHz U-NII band를 사용하며, 802.11n은 2.4GHz와 5GHz 모두에서 동작할 수 있다. 따라서 802.11b/g 장비는 802.11a와 직접 간섭하지 않지만, 802.11n은 배치 방식에 따라 양쪽과 간섭 가능성이 있다.

실무적으로 중요한 것은 "표시된 channel 번호가 독립된 선 하나를 뜻하지 않는다"는 점이다. channel center frequency는 5MHz 간격으로 번호가 붙을 수 있지만, 실제 channel width는 20MHz 또는 40MHz처럼 훨씬 넓을 수 있다. 따라서 인접 channel이 서로 겹쳐 간섭한다.

### 3.5.4.1 Channels and Frequencies

2.4GHz 802.11b/g channel은 각 channel이 22MHz 폭을 가지며 서로 많이 overlap된다.

![Figure 3-20](@/assets/images/045_Figure_3_20_page_164.png)
<p align="center"><sub>Figure 3-20 · PDF p. 164 · 2.4GHz ISM band의 802.11b/g 14개 overlapping channel과 1/6/11 비중첩 배치</sub></p>

미국 기준으로 흔히 channel 1, 6, 11을 함께 쓰는 이유는 세 channel이 서로 겹치지 않는 대표 조합이기 때문이다. 여러 AP가 같은 공간에서 동작하면 같은 channel뿐 아니라 인접 overlapping channel도 성능을 떨어뜨릴 수 있다.

5GHz 계열은 channel set이 더 복잡하지만 nonoverlapping channel을 더 많이 제공한다.

![Figure 3-21](@/assets/images/046_Figure_3_21_page_165.png)
<p align="center"><sub>Figure 3-21 · PDF p. 165 · 5GHz U-NII 중심의 802.11a/n/y channel number와 center frequency 범위</sub></p>

AP는 설치 시 operating channel을 정하고, client station은 AP에 association하기 위해 channel을 바꾼다. ad hoc mode에서는 조정 AP가 없으므로 station이 channel을 직접 맞춰야 한다. 사용 가능한 channel과 power는 국가별 regulatory domain, hardware capability, driver software에 의해 제한된다.

### 3.5.4.2 802.11 Higher Throughput/802.11n

802.11n은 higher throughput을 위해 여러 기술을 결합한다.

- MIMO(Multiple Input, Multiple Output): 여러 antenna와 spatial stream을 동시에 사용한다. 최대 4 spatial streams가 가능하다.
- 40MHz channel: 인접한 두 20MHz channel을 묶어 channel width를 키운다.
- OFDM 개선: 20MHz/40MHz channel에서 더 많은 data subcarrier를 사용한다.
- FEC(Forward Error Correction) code rate 개선: 더 효율적인 coding으로 useful data 비율을 높인다.
- short GI(Guard Interval): legacy 800ns 대신 400ns GI를 사용해 symbol 사이 idle time을 줄인다.
- frame aggregation: 앞에서 본 A-MSDU/A-MPDU로 MAC overhead를 줄인다.

802.11n의 modulation and coding scheme(MCS)은 BPSK, QPSK, 16-QAM, 64-QAM, FEC code rate, spatial stream 수, channel width, GI를 조합한다. 높은 modulation은 data rate를 높이지만 noise와 interference에 더 취약하다. FEC는 redundant bit를 넣어 bit error를 검출/수정할 수 있게 하며, code rate `1/2`는 channel에 실은 2 bit 중 1 bit가 useful data라는 뜻이다.

802.11n에는 greenfield mode, non-HT mode, HT-mixed mode가 있다. greenfield mode는 802.11n 장비만 있는 환경에서 legacy compatibility overhead를 줄일 수 있지만 상호운용성이 없다. HT-mixed mode는 legacy STA 보호를 위해 PLCP에 legacy 정보도 담고, self-directed CTS 또는 RTS/CTS를 legacy rate로 보내 shared channel 사용을 알린다. 이 보호 절차는 compatibility를 제공하지만 802.11n throughput을 줄인다.

40MHz channel은 특히 2.4GHz band에서 주의가 필요하다. 2.4GHz에는 여유 spectrum이 부족하므로 넓은 channel은 주변 AP와 강하게 겹칠 수 있다. 5GHz U-NII band에서 40MHz 운용이 더 현실적이다. 또한 802.11n AP는 전력 요구량이 커서 기본 802.3af PoE(15W)보다 PoE+(802.3at, 30W)가 필요할 수 있다.

### 3.5.5 Wi-Fi Security

Wi-Fi security는 WEP에서 WPA, WPA2/802.11i로 발전했다. 핵심 변화는 약한 encryption/key handling을 버리고, 더 강한 cipher와 per-frame keying/integrity를 제공하는 쪽이다.

| 이름/표준 | Cipher | Key stream/integrity | Authentication |
|---|---|---|---|
| WEP(pre-RSNA) | RC4 | WEP | PSK, 802.1X/EAP 가능 |
| WPA | RC4 | TKIP, Michael integrity check | PSK, 802.1X/EAP |
| WPA2/802.11i | AES | CCMP, TKIP optional | PSK, 802.1X/EAP |

WEP(Wired Equivalent Privacy)는 매우 약한 것으로 판명되어 대체가 필요했다. WPA(Wi-Fi Protected Access)는 임시 현실 해법으로 TKIP(Temporal Key Integrity Protocol)를 도입해 frame마다 다른 encryption key를 쓰고, Michael message integrity check로 WEP의 약점을 일부 보완했다. WPA2는 AES 기반 CCMP를 사용한다. CCMP는 AES counter mode(CCM)로 confidentiality를 제공하고 CBC-MAC으로 authentication/integrity를 제공한다.

authentication은 작은 환경에서는 PSK(Pre-Shared Key)로 단순하게 구성할 수 있다. 하지만 사용자가 많거나 권한 회수가 필요한 환경에서는 PSK가 잘 확장되지 않는다. 한 사용자를 제거하려면 key를 바꾸고 모든 합법 사용자에게 다시 배포해야 하기 때문이다. 그래서 enterprise 환경에서는 802.1X/EAP가 중요하다. 802.1X는 port-based network access control을 제공하고, EAPOL(EAP over LAN)을 통해 IEEE 802 LAN에서 EAP를 운반한다. EAP는 여러 authentication protocol과 key establishment를 담을 수 있으며, 뒤의 PPP와 Chapter 18의 security 논의와 연결된다.

RSN(Robust Security Network)은 TKIP/CCMP 기반의 Wi-Fi security architecture이고, RSNA(Robust Security Network Access)는 그 접근 방식이다. WEP 같은 이전 방식은 pre-RSNA로 분류된다. RSNA compliance는 CCMP 지원을 요구하며, TKIP는 optional이다. 802.11n은 TKIP를 배제하고 더 강한 보안 조합을 요구하는 방향으로 이동한다.

### 3.5.6 Wi-Fi Mesh (802.11s)

Wi-Fi mesh는 station이 단순 client가 아니라 data-forwarding agent처럼 동작하는 802.11s 계열 기능이다. mesh STA는 이웃 mesh node와 link를 만들고, traffic을 다음 hop으로 전달할 수 있다. 책의 시점에서는 802.11s가 draft 상태였고, HWRP(Hybrid Wireless Routing Protocol)가 AODV(Ad-Hoc On-Demand Distance Vector)와 OLSR(Optimized Link State Routing)의 영향을 받은 routing protocol로 설명된다.

mesh 용어는 다음처럼 잡으면 된다.

| 용어 | 의미 |
|---|---|
| mesh STA | mesh routing/forwarding에 참여하는 QoS STA |
| MP(mesh point) | neighbor와 mesh link를 형성하는 node |
| MAP(mesh AP) | mesh 기능과 AP 기능을 함께 가진 node |
| airtime link metric | wireless link 비용을 airtime 관점에서 평가하는 metric |
| SAE(Simultaneous Authentication of Equals) | 동등한 station들 사이의 mesh 보안 인증 방식 |

mesh는 AP 중심 infrastructure mode와 달리 path selection/routing 문제가 link layer 가까이 내려온다. 따라서 wired Ethernet의 switch/STP와는 다른 방식으로 loop와 route quality를 다뤄야 한다.

### 3.6 Point-to-Point Protocol (PPP)

PPP(Point-to-Point Protocol)는 serial link 위에서 IP datagram을 운반하는 대표 link-layer protocol이다. dial-up modem부터 DSL, optical link까지 다양한 point-to-point 환경에서 쓰였고, 단순 frame format 하나가 아니라 LCP, NCP, compression, encryption, authentication을 포함하는 protocol suite에 가깝다.

PPP의 큰 흐름은 다음과 같다.

1. LCP(Link Control Protocol)가 두 endpoint 사이의 기본 link를 설정하고 option을 협상한다.
2. 필요하면 authentication protocol로 peer를 검증한다.
3. NCP(Network Control Protocol)가 IPv4, IPv6 같은 network-layer protocol별 설정을 협상한다.
4. data가 PPP frame payload로 전송된다.
5. 종료 시 LCP termination 절차로 link를 닫는다.

### 3.6.1 Link Control Protocol (LCP)

LCP는 point-to-point link의 low-level 양방향 communication path를 만들고 유지한다. Ethernet/Wi-Fi와 달리 공유 매체 접근을 중재할 필요가 없으므로 MAC contention 문제는 없다. 대신 framing, option negotiation, peer liveness, looped line detection, authentication 선택 같은 문제를 다룬다.

PPP의 기본 framing은 HDLC 계열에서 빌려왔다.

![Figure 3-22](@/assets/images/047_Figure_3_22_page_170.png)
<p align="center"><sub>Figure 3-22 · PDF p. 170 · HDLC에서 차용한 PPP basic frame format, Protocol field, payload, FCS, Flag 구조</sub></p>

PPP frame field는 다음처럼 이해하면 된다.

| Field | 값/크기 | 의미 |
|---|---:|---|
| Flag | `0x7E`, 1 byte | frame 시작/끝 marker |
| Address | `0xFF`, 1 byte | PPP는 단일 peer link라 all-stations 고정값 |
| Control | `0x03`, 1 byte | PPP는 보통 HDLC식 sequencing/retransmission을 쓰지 않아 고정값 |
| Protocol | 1 또는 2 bytes | payload protocol 식별. LCP, NCP, IPv4/IPv6 등 |
| Data | variable | PPP control packet 또는 network-layer data |
| Pad | variable | compression/encryption block size 등 필요 시 padding |
| FCS | 2 또는 4 bytes | CRC16 기본, option으로 CRC32 가능 |

Flag 값 `0x7E`가 payload 안에 나타나면 frame boundary와 혼동된다. 비동기 link에서는 byte stuffing(character stuffing)을 사용한다. `0x7E`는 `0x7D5E`, escape byte `0x7D`는 `0x7D5D`로 보낸다. 동기 link에서는 bit stuffing을 사용해 flag bit pattern `01111110`과 혼동되지 않도록 다섯 개의 연속 `1` 뒤에 `0`을 삽입한다.

Address와 Control field는 PPP에서 항상 고정값이므로 ACFC(Address and Control Field Compression) option으로 생략할 수 있다. Protocol field도 일부 값에 대해 PFC(Protocol Field Compression)로 1 byte로 줄일 수 있지만, LCP의 protocol value `0xC021`은 ambiguity를 줄이기 위해 압축하지 않는다.

PPP는 일반적으로 link-layer retransmission을 제공하지 않는다. Ethernet도 일정 조건에서 MAC-level retry가 있고, Wi-Fi는 ACK/retry가 있지만, PPP는 보통 오류 검출 후 상위 계층에 맡기는 쪽이다. 이 trade-off는 delay, duplicate, 상위 계층 reliability와 맞물린다.

### 3.6.1.1 LCP Operation

LCP packet은 PPP frame의 Protocol field가 `0xC021`일 때 payload로 들어간다.

![Figure 3-23](@/assets/images/048_Figure_3_23_page_172.png)
<p align="center"><sub>Figure 3-23 · PDF p. 172 · PPP frame 안에 들어가는 LCP packet format과 Code/Ident/Length/Data field</sub></p>

LCP의 핵심 field는 Code, Ident, Length, LCP Data이다. Ident는 request와 response를 대응시키는 sequence number 역할을 한다. sender가 configure-request를 보낼 때 Ident를 넣고, peer가 configure-ACK/NACK/REJECT를 만들 때 같은 Ident를 복사한다.

대표 LCP Code는 다음과 같다.

| Code | 의미 |
|---:|---|
| `0x01` | configure-request |
| `0x02` | configure-ACK |
| `0x03` | configure-NACK |
| `0x04` | configure-REJECT |
| `0x05` / `0x06` | terminate-request / terminate-ACK |
| `0x07` / `0x08` | code-REJECT / protocol-REJECT |
| `0x09` / `0x0A` | echo-request / echo-reply |
| `0x0B` | discard-request |
| `0x0C` / `0x0D` | identification / time-remaining |

ACK는 제안 option을 그대로 수락한다는 뜻이고, NACK는 일부 option에 대해 대안을 제시한다는 뜻이며, REJECT는 option 자체를 받아들일 수 없다는 뜻이다. Echo Request/Reply는 active link에서 peer 동작 확인에 쓰이고, Discard Request는 performance measurement에 쓸 수 있다.

LCP는 looped line detection도 지원한다. 전화망 같은 WAN circuit은 시험을 위해 loopback mode가 될 수 있는데, 이 상태에서는 한쪽에서 보낸 data가 그대로 돌아온다. LCP는 magic number를 보내고 같은 message type으로 즉시 되돌아오는지 확인해 line이 looped인지 판단할 수 있다.

![Figure 3-24](@/assets/images/049_Figure_3_24_page_174.png)
<p align="center"><sub>Figure 3-24 · PDF p. 174 · LCP configure request/ACK, authentication, data exchange, termination으로 이어지는 PPP link establishment 흐름</sub></p>

PPP link는 underlying layer가 active라고 알려 주면 Establish 단계로 들어가고, LCP configure exchange로 option을 맞춘다. 필요한 경우 Auth 단계에서 authentication을 수행한 뒤 Network 단계에서 NCP가 network-layer 설정을 진행한다. 종료는 carrier loss 같은 하위 신호 또는 terminate-request/terminate-ACK 교환으로 이루어진다.

### 3.6.1.2 LCP Options

LCP option은 PPP link의 실제 동작 방식을 협상한다. 이 구간에서 중요한 option은 다음과 같다.

| Option | 의미 | 주의점 |
|---|---|---|
| ACCM/asyncmap | 어떤 ASCII control character를 escape할지 지정 | XON/XOFF 같은 software flow control과 충돌 방지 |
| MRU(Maximum Receive Unit) | peer에게 보내지 말라고 요청하는 data field 최대 크기 | hard limit라기보다 권고. IPv6에는 최소 1280 필요 |
| Link Quality Report(LQR) | periodic quality report 교환 | packet/byte/error/discard count, sequence number로 품질 추세 확인 |
| Callback | 인증 후 server가 client에게 다시 전화 | 과금/보안 목적 |
| self-describing padding | padding byte 수를 수신자가 알 수 있게 함 | PPP frame에 일반 Length field가 없다는 점 보완 |
| PPPMux | 여러 payload를 한 PPP frame에 multiplex | small packet overhead 감소 |
| 32-bit FCS | 기본 CRC16 대신 CRC32 사용 | Ethernet CRC32와 같은 polynomial 사용 |
| PFC/ACFC | Protocol 또는 Address/Control field 압축 | fixed header overhead 감소 |

MRU는 PPP의 MTU 감각과 연결된다. 작은 interactive packet과 큰 data packet이 낮은 bandwidth PPP link를 공유하면, 큰 packet이 serialization delay를 만들어 jitter를 키울 수 있다. MRU/MTU를 줄이면 overhead는 늘지만 VoIP나 remote login 같은 interactive traffic의 지연 변동을 줄일 수 있다.

### 3.6.2 Multilink PPP (MP)

Multilink PPP(MP)는 여러 point-to-point link를 하나의 logical bundle로 묶는 기능이다. Ethernet의 link aggregation과 비슷하지만, PPP 환경에서는 여러 circuit-switched channel이나 여러 serial link를 하나의 virtual link처럼 다룬다.

단순히 packet을 member link에 번갈아 보내는 bank teller's algorithm은 reordering을 만들 수 있다. TCP/IP는 packet reordering을 견딜 수 있지만 성능은 나빠질 수 있다. 그래서 MP는 fragment마다 sequencing header를 붙이고, 수신 측이 순서를 복원한다.

![Figure 3-25](@/assets/images/050_Figure_3_25_page_177.png)
<p align="center"><sub>Figure 3-25 · PDF p. 177 · Multilink PPP fragment header의 Begin/End bit와 sequence number 구조</sub></p>

MP fragment header에는 B(Begin) bit, E(End) bit, Sequence Number가 있다. fragment되지 않은 frame이 이 형식으로 전송되면 B와 E가 모두 1이다. 첫 fragment는 `B=1, E=0`, 마지막 fragment는 `B=0, E=1`, 중간 fragment는 `B=0, E=0`이다. short sequence number option을 협상하면 2-byte header를 쓰고, 그렇지 않으면 4-byte header를 사용할 수 있다.

MP 관련 option은 다음처럼 기억하면 좋다.

| 항목 | 의미 |
|---|---|
| MRRU(Multilink Maximum Received Reconstructed Unit) | bundle 전체에서 재조립 가능한 최대 frame 크기 |
| endpoint discriminator | member link들이 같은 bundle에 속함을 식별 |
| BAP/BACP | bandwidth on demand를 위해 member link를 동적으로 추가/삭제 |
| link discriminator | bundle 안에서 각 member link를 구분하는 16-bit 값 |

BAP(Bandwidth Allocation Protocol)와 BACP(Bandwidth Allocation Control Protocol)는 traffic 사용량에 따라 link를 추가하거나 제거하는 bandwidth on demand(BOD)를 지원한다. 예를 들어 통화료가 connection 수에 따라 부과되는 환경에서는 traffic이 많을 때만 추가 회선을 열고, 낮을 때는 닫는 식의 정책이 가능하다.

### 3.6.3 Compression Control Protocol (CCP)

CCP(Compression Control Protocol)는 PPP link에서 compression algorithm을 협상하는 protocol이다. PPP가 느린 dial-up modem 환경에서 많이 쓰였기 때문에, payload compression은 실제 체감 성능에 중요했다. 단, CCP의 compression은 modem hardware compression(V.42bis, V.44 등)이나 뒤에서 보는 protocol header compression과 구분된다.

CCP는 NCP처럼 Network state에서 협상되며, LCP와 비슷한 packet exchange/format을 사용한다. PPP Protocol field는 CCP negotiation에 `0x80FD`, compressed datagram에는 `0x00FD`, MP member link별 compression에는 `0x00FB`가 쓰일 수 있다. compressed frame 오류가 감지되면 reset-request/reset-ACK로 dictionary나 state machine을 초기화할 수 있다.

### 3.6.4 PPP Authentication

PPP는 기본적으로 authentication을 요구하지 않지만, ISP dial-in이나 enterprise remote access에서는 보통 peer identity 검증이 필요하다.

| 방식 | 특징 | 위험/용도 |
|---|---|---|
| PAP(Password Authentication Protocol) | peer가 password를 그대로 보냄 | password가 평문으로 노출되어 권장되지 않음 |
| CHAP(Challenge-Handshake Authentication Protocol) | authenticator가 random challenge를 보내고 peer가 shared secret 기반 one-way function 결과를 응답 | password 자체는 보내지 않지만 man-in-the-middle 위험은 남음 |
| EAP(Extensible Authentication Protocol) | 여러 authentication method를 담는 framework | RADIUS 같은 authentication server와 결합해 enterprise/ISP에서 확장성 좋음 |

CHAP의 핵심은 매번 다른 random challenge를 사용한다는 점이다. eavesdropper가 한 번의 response를 캡처해도 다음 challenge에는 재사용할 수 없다. EAP는 PPP뿐 아니라 802.1X/EAPOL 기반 Wi-Fi enterprise authentication과도 연결된다.

### 3.6.5 Network Control Protocols (NCPs)

NCP(Network Control Protocol)는 LCP와 authentication이 끝난 뒤 Network state에서 network-layer protocol을 실제로 사용할 수 있게 설정한다. 하나의 PPP link에서 여러 NCP가 동시에 쓰일 수 있지만, TCP/IP 관점에서는 IPCP와 IPV6CP가 중요하다.

| NCP | 대상 | Protocol field | 주요 기능 |
|---|---|---:|---|
| IPCP(IP Control Protocol) | IPv4 | `0x8021` | IPv4 address, VJ compression, DNS option 등 협상 |
| IPV6CP | IPv6 | 표준 IPv6CP 값 | 64-bit interface identifier, IPv6 compression protocol 등 협상 |

IPV6CP의 interface identifier option은 link-local IPv6 address 형성에 쓰인다. 이는 Chapter 2의 IPv6 address architecture와 연결된다. link-local address는 local link 안에서만 의미가 있으므로 global uniqueness까지 요구하지 않는다.

### 3.6.6 Header Compression

느린 PPP link에서는 작은 TCP/IP packet의 header overhead가 크다. 예를 들어 IPv4 header 20 bytes와 TCP header 20 bytes만 합쳐도 40 bytes이다. TCP ACK처럼 payload가 작거나 없는 packet에서는 header가 대부분을 차지한다.

VJ compression(Van Jacobson header compression)은 같은 TCP connection에서 거의 변하지 않는 TCP/IP header 값을 한 번 저장해 두고, 이후 packet에서는 작은 connection identifier와 변한 값의 delta만 보낸다. 그래서 흔한 40-byte TCP/IPv4 header를 3-4 bytes 수준으로 줄일 수 있다.

이후 IP header compression은 TCP/UDP와 IPv4/IPv6 조합으로 일반화되었고, ROHC(Robust Header Compression)는 더 많은 transport protocol과 여러 compression form을 지원한다. header compression을 사용할 때는 link-layer error detection이 중요하다. 압축된 header 정보가 손상되면 수신 측에서 잘못된 packet을 복원할 수 있기 때문이다.

### 3.6.7 Example

책의 PPP 예시는 Windows Vista client가 Linux PPP server에 dial-in하는 debug log를 보여 준다. 핵심은 PPP negotiation이 매우 유연하지만 그만큼 왕복 메시지가 많다는 점이다.

흐름을 압축하면 다음과 같다.

1. server가 `ppp0` virtual interface를 만들고 serial port `ttyS0`에서 incoming connection을 기다린다.
2. server가 LCP ConfReq로 `asyncmap 0x0`, EAP authentication, PFC, ACFC, magic number를 제안한다.
3. client가 EAP 대신 MS-CHAP-v2를 ConfNak로 제안하고, server가 이를 받아 다시 ConfReq를 보낸다.
4. client가 CBCP, MRRU, endpoint ID를 포함해 요청하지만, server는 callback과 multilink operation을 ConfRej한다.
5. CHAP challenge/response가 성공해 Auth 단계가 끝나고 Network state로 이동한다.
6. CCP가 MPPE(Microsoft Point-to-Point Encryption)를 협상한다. MPPE는 이름상 compression 쪽에서 협상되지만 실제로는 encryption이며 4 bytes를 늘릴 수 있다.
7. IPCP와 IPV6CP가 IPv4/IPv6 address, VJ compression, DNS 관련 option 등을 협상한다.

이 예시에서 보듯 PPP는 option이 거절되고 다시 제안되는 ConfReq/ConfAck/ConfNak/ConfRej 흐름이 자연스럽다. delay가 작은 link에서는 크게 문제되지 않지만, satellite link처럼 RTT가 긴 환경에서는 link establishment 자체가 사용자에게 길게 느껴질 수 있다.

### 3.7 Loopback

loopback은 같은 host 안의 client와 server가 TCP/IP 같은 Internet protocol로 통신할 수 있게 하는 virtual interface이다. 실제 network hardware로 packet이 나가지 않지만, 운영체제는 이를 network interface처럼 제공한다. IPv4에서는 `127.0.0.0/8` 전체가 loopback 용도로 예약되어 있고, 관례적으로 `127.0.0.1`이 `localhost`에 매핑된다. IPv6에서는 `::1` 단일 address가 loopback이다.

중요한 점은 loopback traffic이 물리 network에 나타나면 안 된다는 것이다. 많은 구현은 transport layer와 network layer 처리를 실제처럼 수행한 뒤, network layer 아래쪽에서 다시 위로 돌려보낸다. 덕분에 hardware overhead 없이 stack software의 처리 비용을 측정하는 데도 유용하다.

Linux의 loopback interface는 보통 `lo`이며, `127.0.0.1`, `::1/128`, 큰 MTU를 가진다. Windows도 IP loopback은 지원하며, Microsoft Loopback Adapter를 설치하면 virtual Ethernet device처럼 테스트용 interface를 만들 수 있다. IPv4에서는 `127.1.2.3`처럼 127로 시작하는 여러 주소가 loopback되지만, IPv6 loopback은 `::1` 하나라는 차이를 기억해야 한다. multicast/broadcast datagram을 송신 host로 다시 loopback할지는 application별 선택과 관련되며 Chapter 9의 multicast 논의와 이어진다.

### 3.8 MTU and Path MTU

MTU(Maximum Transmission Unit)는 link layer가 upper-layer PDU를 payload로 실을 수 있는 최대 byte 수이다. Ethernet은 보통 payload 1500 bytes가 MTU이고, PPP도 Ethernet과의 호환을 위해 1500 근처를 많이 사용한다. IP datagram이 outgoing link의 MTU보다 크면 IP fragmentation이 필요하다.

같은 LAN의 두 host가 통신할 때는 local link MTU가 직접적인 제한이다. 하지만 여러 network를 거치는 통신에서는 path에 있는 각 link의 MTU가 다를 수 있다. 이때 전체 path에서 가장 작은 MTU가 path MTU이다.

path MTU는 고정값이 아니다.

- routing 변화나 link 장애로 path 자체가 바뀌면 path MTU도 바뀔 수 있다.
- A에서 B로 가는 path와 B에서 A로 오는 path가 다를 수 있으므로 방향별 path MTU도 다를 수 있다.
- tunnel이 끼면 outer header overhead 때문에 effective MTU가 줄어든다.

PMTUD(Path MTU Discovery)는 특정 시점의 path MTU를 찾는 메커니즘이다. IPv4는 RFC 1191, IPv6는 RFC 1981에서 설명되며, IPv6 구현에서는 필요하다. 실제 동작은 ICMP와 IP fragmentation을 다룬 뒤 더 잘 이해된다. 여기서는 link-layer MTU가 transport performance, 특히 TCP/UDP 성능과 연결된다는 점을 잡아 두면 된다.

### 3.9 Tunneling Basics

tunneling은 어떤 protocol packet을 다른 protocol packet 안에 넣어 virtual link를 만드는 기법이다. strict layering을 뒤집어, lower-layer traffic을 higher-layer 또는 같은 layer packet의 payload로 운반한다. 예를 들어 IPv4를 IPv4/IPv6 안에 넣거나, Ethernet frame을 UDP/IPv4/IPv6 안에 넣을 수 있다. VPN과 overlay network가 이 원리를 활용한다.

대표 tunnel protocol은 GRE(Generic Routing Encapsulation), PPTP(Point-to-Point Tunneling Protocol), L2TP(Layer 2 Tunneling Protocol), IP-in-IP 등이 있다. GRE와 L2TP는 각각 IP-in-IP와 PPTP의 표준적 대체/발전으로 볼 수 있지만, 실제 환경에서는 여러 방식이 함께 남아 있다.

![Figure 3-26](@/assets/images/051_Figure_3_26_page_188.png)
<p align="center"><sub>Figure 3-26 · PDF p. 188 · GRE header의 C/K/S bit, Protocol Type, optional Checksum/Key/Sequence Number 구조</sub></p>

GRE 기본 header는 4 bytes로 단순하다. C bit가 set이면 checksum이 있고, RFC 2890 확장에서는 K bit와 S bit로 optional Key field와 Sequence Number field를 표시한다. Key는 여러 packet이 같은 flow에 속함을 나타내는 식별자로 쓸 수 있고, Sequence Number는 서로 다른 link를 거치며 순서가 바뀐 packet을 재정렬하는 데 도움을 준다.

GRE와 PPTP는 관련 있지만 목적이 다르다.

| 항목 | GRE | PPTP |
|---|---|---|
| 주 용도 | ISP/enterprise 내부, branch office 연결, infrastructure tunnel | 사용자-ISP/기업 intranet remote access |
| 계층 감각 | IPv4/IPv6 위에서 다른 packet을 운반하는 layer 3 tunneling | GRE 위에 PPP를 얹어 virtual point-to-point link 제공 |
| 보안 | 자체 encryption은 일반적으로 없음. IPsec과 결합 가능 | MPPE 등 PPP 쪽 encryption과 결합되는 경우가 많음 |
| 표준성 | IETF RFC 기반 | Microsoft proprietary 성격, nonstandard GRE 변형 사용 |

![Figure 3-27](@/assets/images/053_Figure_3_27_page_189.png)
<p align="center"><sub>Figure 3-27 · PDF p. 189 · PPTP가 사용하는 nonstandard GRE 기반 header와 sequence/acknowledgment field</sub></p>

PPTP header는 오래된 nonstandard GRE header에서 왔고, K/S/A bit로 Key, Sequence Number, Acknowledgment Number 존재 여부를 나타낸다. Sequence/Acknowledgment는 PPTP가 data delivery와 flow control을 추적하는 데 쓰이며, adaptive timeout으로 RTT를 추정한다. 이 개념은 나중에 TCP의 timeout/RTT 추정과 연결된다.

PPTP session establishment는 앞의 PPP 예시와 비슷하지만, dial-up link 대신 PPTP가 PPP에게 "raw link" 역할을 제공한다. `pptpd`는 control connection, outgoing call, GRE packet relay, echo request 같은 PPTP 자체 기능을 처리하고, 실제 PPP negotiation은 기존 `pppd`가 수행한다. 즉 PPTP는 PPP packet을 GRE tunnel로 실어 나르는 agent처럼 동작하므로, 기존 PPP implementation을 그대로 활용할 수 있다.

### 3.9.1 Unidirectional Links

UDL(Unidirectional Link)은 한 방향으로만 traffic을 보낼 수 있는 link이다. 많은 protocol은 양방향 exchange를 가정하므로, UDL만으로는 PPP configuration message 같은 절차가 제대로 동작하지 않는다.

대표 예는 위성 Internet이다. downstream은 satellite로 받고, upstream은 dial-up modem 같은 별도 link를 쓰는 구조가 가능하다. RFC 3077 방식은 secondary Internet interface 위의 tunnel을 UDL과 결합한다. downstream으로는 multicast Hello message를 보내 receiver가 UDL의 MAC/IP address와 tunnel endpoint 목록을 알게 하고, receiver가 선택한 endpoint로 upstream layer 2 frame을 GRE-encapsulated IP packet에 담아 보낸다.

이 접근은 upper-layer protocol에게 link asymmetry를 숨긴다. 하지만 실제 latency와 bandwidth는 양방향이 크게 다를 수 있으므로 TCP 같은 상위 protocol 성능에 악영향을 줄 수 있다. tunnel은 편리하지만 endpoint 선택, peer IP address, protocol selection, authentication 같은 설정 부담이 크기 때문에 6to4, Teredo 같은 자동 tunnel 구성 기법도 등장했다. 6to4는 IPv6 packet을 IPv4 network 위에 tunnel하고, Teredo는 NAT 환경을 고려해 IPv6 packet을 UDP/IPv4 위에 실어 보낸다.

### 3.10 Attacks on the Link Layer

link layer attack은 TCP/IP 상위 계층이 직접 보지 못하는 정보와 제어면을 건드린다. 그래서 공격이 상위 계층 증상으로는 packet loss, route 이상, throughput 저하, 인증 우회, DoS처럼 보일 수 있다.

대표 공격면은 다음과 같다.

| 대상 | 공격 방식 | 영향 | 방어/완화 방향 |
|---|---|---|---|
| wired Ethernet sniffing | promiscuous mode로 다른 station frame 관찰 | password, session data 노출 | switched Ethernet, TLS/SSH/IPsec 등 상위 encryption |
| switch FDB | 많은 fake source MAC address로 table을 채움 | legitimate entry eviction, flooding 증가, service interruption | port security, MAC limit, monitoring |
| STP | 낮은 cost/root path를 가진 switch처럼 가장 | traffic을 attacker 쪽으로 유도 | BPDU guard/root guard, STP control plane 보호 |
| Wi-Fi monitoring | monitor mode로 air traffic sniffing | open/WEP network traffic 노출 | WPA2/CCMP, WPA-Enterprise/802.1X |
| captive portal | 합법 사용자의 registration을 관찰 후 MAC impersonation | portal 우회, session hijacking | 강한 authentication, MAC-only trust 회피 |
| PPP PAP | password를 평문으로 capture | credential replay | CHAP/EAP, encryption |
| tunnel endpoint | endpoint DoS, unauthorized tunnel 생성, 설정 탈취 | private network로 link-layer 접근 | endpoint authentication, IPsec, tunnel policy/ACL |
| nonencrypted GRE tunnel | tunnel 안에 traffic 삽입 | private side에 local traffic처럼 주입 | GRE over IPsec, filtering, endpoint validation |

wireless attack은 유선보다 sniffing과 masquerading이 더 쉬운 면이 있다. frame이 공중으로 퍼지기 때문이다. 초기 WEP 공격은 표준 개정을 촉진할 만큼 치명적이었고, WPA/WPA2가 등장한 배경이 된다. 다만 WPA2를 쓰더라도 잘못된 PSK 관리, weak password, rogue AP, captive portal 설계 문제는 별개로 남는다.

tunneling은 target이면서 tool이 될 수 있다. tunnel endpoint가 공격받으면 tunnel 자체가 뚫리고, 반대로 공격자가 unauthorized tunnel을 만들 수 있으면 내부 private network로 들어가는 link-layer 우회로가 된다. GRE처럼 자체 encryption이 없는 tunnel은 특히 보호된 transport나 IPsec 같은 별도 보안 장치가 필요하다.

### 3.11 Summary

이 장의 중심은 IP가 어떤 link 위에서도 동작할 수 있게 만드는 link-layer 추상화이다. Ethernet은 shared CSMA/CD LAN에서 switched full-duplex LAN으로 진화했고, 그 위에 VLAN, QoS tag, link aggregation, bridge/switch learning, STP/RSTP/MRP 같은 확장 기능이 얹혔다.

Wi-Fi는 Ethernet과 같은 LAN 범주에 있지만 무선 매체 특성 때문에 CSMA/CA, RTS/CTS, NAV, CCA, ACK/retransmission, power save, channel planning, security가 훨씬 중요하다. 802.11n은 MIMO, wider channel, short GI, aggregation으로 throughput을 높이지만 legacy compatibility와 spectrum overlap이라는 현실적 trade-off를 가진다.

PPP는 point-to-point link의 대표 protocol suite이다. HDLC-like framing, LCP option negotiation, PAP/CHAP/EAP authentication, IPCP/IPV6CP, CCP, Multilink PPP, header compression을 통해 단순 serial link 위에서도 IP를 실을 수 있게 한다.

Loopback은 같은 host 내부 통신을 network stack으로 처리하게 해 주고, MTU/path MTU는 IP fragmentation과 transport performance에 직접 연결된다. Tunneling은 virtual link와 overlay network를 만들지만, header overhead와 MTU 감소, endpoint security, path asymmetry 같은 비용을 동반한다.

## 연결 관계

- Chapter 2 IPv6 address architecture: IPv6 link-local address, interface identifier, `::1`, multicast address가 이 장의 link-local delivery와 연결된다.
- Chapter 4 ARP: Ethernet broadcast와 MAC address resolution이 ARP의 핵심 배경이다.
- Chapter 5/10 IP fragmentation: MTU/path MTU와 PMTUD가 IP fragmentation 및 UDP payload sizing으로 이어진다.
- Chapter 8 ICMPv6: IPv6 neighbor discovery와 multicast 사용은 link-layer multicast capability에 기대고 있다.
- Chapter 9 broadcast/multicast: Ethernet/Wi-Fi broadcast, multicast, MMRP, loopback multicast 정책과 연결된다.
- Chapter 14/15 TCP: Wi-Fi block ACK, PPP header compression, path asymmetry, PMTUD failure는 TCP performance에 영향을 준다.
- Chapter 18 security: WPA2/CCMP, 802.1X/EAP, IPsec, tunnel security, CHAP/EAP가 다시 등장한다.

## 오해하기 쉬운 내용

- MAC address는 Internet-wide address가 아니다. 보통 같은 link/LAN segment 안에서 직접 delivery를 위한 address이다.
- switch는 모든 traffic을 막아 주는 보안 장비가 아니다. broadcast/multicast, flooding, FDB overflow, STP 공격, port mirroring 같은 예외가 있다.
- VLAN은 router가 아니다. VLAN 간 통신에는 routing/L3 기능이 필요하다.
- STP는 redundant link를 제거하는 것이 아니라 forwarding topology에서 loop를 만들 port를 차단한다. 장애 시 다시 계산될 수 있다.
- Wi-Fi의 CSMA/CA는 Ethernet CSMA/CD의 무선판이 아니다. collision detection 대신 avoidance, ACK, NAV, CCA, RTS/CTS가 결합된다.
- MTU와 MRU는 비슷하지만 관점이 다르다. MTU는 transmit 가능한 최대 payload, MRU는 peer에게 받을 수 있다고 알리는 최대 receive unit이다.
- tunnel은 "그냥 포장"이 아니다. encapsulation overhead 때문에 effective MTU가 줄고, 보안 경계와 routing/visibility가 바뀐다.
- PPP의 CCP는 이름은 compression이지만 MPPE처럼 encryption 협상에 사용되는 예외적 사례도 있다.

## 면접 질문

1. shared Ethernet에서 CSMA/CD가 필요한 이유와 switched full-duplex Ethernet에서 필요성이 줄어든 이유를 설명하라.
2. Ethernet frame의 Length/Type field가 overloaded field라는 말은 무슨 뜻인가?
3. VLAN trunk에서 802.1q tag가 필요한 이유와 VLAN 간 통신에 router가 필요한 이유를 설명하라.
4. switch의 filtering database가 비어 있을 때 frame forwarding은 어떻게 동작하는가?
5. STP가 broadcast storm을 막는 원리를 root bridge, root port, designated port 관점에서 설명하라.
6. RSTP가 전통 STP보다 convergence가 빠른 이유는 무엇인가?
7. Wi-Fi에서 hidden terminal problem이 무엇이고 RTS/CTS/NAV가 어떻게 완화하는가?
8. A-MSDU와 A-MPDU의 FCS/ACK 차이가 오류 환경에서 어떤 성능 차이를 만드는가?
9. 2.4GHz Wi-Fi에서 channel 1, 6, 11을 많이 쓰는 이유를 설명하라.
10. WEP, WPA, WPA2의 핵심 차이를 cipher/key management/authentication 관점에서 설명하라.
11. PPP에서 LCP와 NCP의 역할을 구분하라.
12. PAP, CHAP, EAP의 보안성과 확장성 차이를 설명하라.
13. MTU, path MTU, PMTUD가 TCP 성능에 영향을 주는 경로를 설명하라.
14. GRE와 PPTP의 관계와 차이를 설명하라.
15. link-layer attack이 상위 계층에서 탐지하기 어려운 이유를 예로 들어 설명하라.
