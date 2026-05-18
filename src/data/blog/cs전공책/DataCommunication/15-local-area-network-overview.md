---
title: "Chapter 15. Local Area Network Overview"
order: 15
pubDatetime: 2026-05-18T00:15:00+09:00
modDatetime: 2026-05-18T00:15:00+09:00
description: "Data and Computer Communications 정리: Chapter 15. Local Area Network Overview"
tags:
  - "DataCommunication"
  - "CS"
---

## 개요

**Local Area Network (LAN)**는 조직이 소유하고 관리하는 제한된 지역의 network로, 일반적으로 shared transmission medium과 그 medium에 device를 연결하고 access를 조정하는 hardware/software로 구성된다. WAN이 public/private 모두 가능하고 넓은 지역을 대상으로 한다면, LAN은 조직 내부 장비를 높은 capacity로 상호 연결해 internal communication load를 처리하는 데 초점이 있다.

이 장은 LAN을 이해하는 기본 지도를 만든다. 먼저 LAN application 요구를 살펴보고, 그 다음 LAN topology와 transmission medium을 비교한다. 이후 IEEE 802 기반의 LAN protocol architecture, LLC/MAC 분리, bridge의 동작과 spanning tree, 마지막으로 hub, layer 2 switch, layer 3 switch를 다룬다.

| 세부 주제 | 핵심 질문 | 대표 용어 |
|---|---|---|
| Background | LAN은 어떤 application 요구에서 출발했는가? | PC LAN, backend network, SAN, high-speed office network, backbone LAN |
| Topologies and Transmission Media | station을 어떤 형태로 연결하고 어떤 medium을 쓰는가? | bus, tree, ring, star, twisted pair, coaxial cable, optical fiber |
| LAN Protocol Architecture | LAN protocol은 OSI model과 어떻게 대응되는가? | IEEE 802, LLC, MAC, MAC frame, LLC PDU |
| Bridges | 여러 LAN을 어떻게 MAC level에서 연결하는가? | bridge, forwarding, address learning, fixed routing, spanning tree |
| Layer 2 and Layer 3 Switches | hub, bridge, switch, router 성격의 장비는 어떻게 다른가? | hub, layer 2 switch, switching hub, layer 3 switch |

## 핵심 개념

### LAN은 shared medium과 medium access control의 결합이다

LAN의 핵심은 여러 station이 가까운 지역에서 높은 data rate로 통신한다는 점이다. 하지만 “가까운 지역”이라는 물리적 조건만으로 LAN이 정의되지는 않는다. LAN은 topology, transmission medium, wiring layout, **medium access control (MAC)**이 결합된 system이다. Shared medium에서는 한 station의 transmission이 다른 station에 영향을 주므로, 누가 언제 medium을 사용할지 정하는 MAC mechanism이 반드시 필요하다.

LAN은 일반적으로 WAN보다 organization-owned이고, 훨씬 큰 capacity를 제공한다. 그 대신 distance scope가 제한되어 있고, topology/medium/access method 선택이 cost, reliability, capacity, 지원 application을 직접 좌우한다.

## 세부 정리

### 15.1 Background

#### Personal Computer LANs

가장 흔한 LAN 구성은 personal computer와 workstation을 연결하는 network다. 개인/부서 단위 PC는 spreadsheet, project management, Internet access 같은 local application에는 충분하지만, 조직 전체의 요구를 모두 처리하지는 못한다. Corporate-wide accounting/payroll data, large forecasting model, shared specialized file, project team collaboration은 중앙 시설이나 다른 workstation과 연결되어야 한다.

PC LAN의 주요 목적은 다음과 같다.

| 목적 | 설명 |
|---|---|
| resource sharing | disk, laser printer 같은 expensive resource를 여러 user가 공유한다. |
| file/data sharing | team 단위 작업물과 corporate data에 digital access를 제공한다. |
| client/server application | processing load를 PC network로 분산하면서 server resource를 함께 쓴다. |
| larger network access | communications server를 통해 building-wide LAN, private WAN 같은 corporate network facility에 controlled access를 제공한다. |

PC LAN의 핵심 요구는 낮은 attachment cost다. Ordinary PC에 network interface를 붙이는 비용은 attached device 자체 비용보다 훨씬 낮아야 한다. 반대로 high-performance workstation은 device cost가 높으므로 더 큰 attachment cost를 감당할 수 있다.

#### Backend Networks와 Storage Area Networks

**Backend network**는 mainframe, supercomputer, mass storage device 같은 대형 system을 작은 지역에서 연결하기 위한 network다. PC LAN과 달리 device 수는 적고 비싸며, bulk data transfer와 high reliability가 핵심이다.

Backend network의 특징은 다음과 같다.

| 요구 | 의미 |
|---|---|
| high data rate | 대량 data transfer를 위해 100 Mbps 이상이 필요하다. |
| high-speed interface | host와 mass storage 사이 transfer는 느린 communication interface보다 high-speed parallel I/O 성격이 강하다. |
| distributed access | 여러 device가 medium을 효율적이고 reliable하게 공유하려면 distributed MAC technique이 필요하다. |
| limited distance | computer room 또는 인접한 몇 개 room 정도의 작은 범위에서 동작한다. |
| limited devices | mainframe/mass storage 등 expensive device 수가 보통 수십 대 수준이다. |

Backend network가 필요한 이유는 large data processing site의 운영 요구 때문이다. Multiple independent computer가 생기면 application을 backup system으로 빠르게 옮기고, production system을 방해하지 않고 test를 수행하며, large storage file을 여러 computer에서 접근하고, load leveling으로 utilization과 performance를 높여야 한다.

**Storage Area Network (SAN)**는 backend network와 관련된 개념으로, storage task를 특정 server에서 분리해 별도 high-speed network 위의 shared storage facility로 만든다. Hard disk, tape library, CD array 같은 networked storage device가 SAN에 연결된다. 원문은 대부분의 SAN이 Fibre Channel을 사용한다고 설명하며, 이는 Chapter 16과 연결된다.

![Figure 15.1](@/assets/images/data-communication-192-figure-15-1-page-469.png)
*Figure 15.1 · PDF p. 469 · server-based storage와 storage area network 구조 비교*

Figure 15.1의 핵심은 storage access path다. Server-based storage에서는 client가 특정 storage device에 접근하려면 그 device를 control하는 server를 거쳐야 한다. SAN에서는 storage device와 server가 network에 직접 연결되어 client-to-storage access efficiency가 좋아지고, backup/replication 같은 storage-to-storage communication도 직접 수행하기 쉽다.

#### High-Speed Office Networks

Office environment는 전통적으로 low- to medium-speed device 중심이었지만, image processing과 desktop storage 확대로 traditional LAN 속도를 쉽게 압도하게 되었다. Fax, document image processor, graphics program은 큰 bit stream을 만든다. 예를 들어 200 pels/inch 해상도의 흑백 8.5 x 11 inch page는 압축 전 약 3,740,000 bits를 만든다. Compression을 써도 network load가 커진다.

또한 desktop disk capacity가 multiple gigabytes로 커지면서 office network도 더 많은 user, 더 넓은 geographic extent, 더 큰 data flow를 처리해야 한다. 따라서 office LAN은 단순 terminal traffic이 아니라 image, file, graphics 중심의 high-speed requirement를 갖게 된다.

#### Backbone LANs

Premises-wide data communication을 하나의 LAN으로 모두 해결하는 것은 대체로 비현실적이다. 단일 LAN 전략에는 다음 문제가 있다.

| 문제 | 설명 |
|---|---|
| reliability | 단일 LAN 장애가 전체 사용자에게 큰 service interruption을 만든다. |
| capacity | attached device가 늘수록 하나의 LAN이 쉽게 saturated된다. |
| cost/optimization | low-cost PC attachment와 high-capacity interconnection 요구를 하나의 LAN technology로 동시에 최적화하기 어렵다. |

더 현실적인 구조는 building/department 내부에는 lower-cost, lower-capacity LAN을 두고, 이 LAN들을 higher-capacity LAN으로 연결하는 방식이다. 이 higher-capacity LAN이 **backbone LAN**이다. 하나의 building 또는 building cluster 안에서 backbone function을 수행하며, 이후 bridge/switch/router 구성 논의와 이어진다.

### 15.2 Topologies and Transmission Media

LAN 설계의 key element는 **topology**, **transmission medium**, **wiring layout**, **medium access control**이다. 이 네 요소는 LAN의 cost/capacity뿐 아니라 어떤 data를 보낼 수 있는지, communication speed/efficiency가 어떤지, 어떤 application을 지원할 수 있는지를 함께 결정한다. 따라서 topology만 따로 떼어 “좋다/나쁘다”를 말하기 어렵고, medium과 MAC technique의 조합으로 판단해야 한다.

#### Topologies

Network topology는 network에 붙은 endpoint, 즉 station들이 서로 어떻게 연결되는지를 뜻한다. LAN의 대표 topology는 bus, tree, ring, star다. Bus는 branch가 없는 하나의 trunk만 가진 tree의 special case로 볼 수 있다.

![Figure 15.2](@/assets/images/data-communication-193-figure-15-2-page-471.png)
*Figure 15.2 · PDF p. 471 · bus, tree, ring, star LAN topology 비교*

#### Bus and Tree Topologies

**Bus topology**와 **tree topology**는 모두 multipoint medium을 사용한다. Bus에서는 모든 station이 tap을 통해 linear transmission medium, 즉 bus에 붙는다. Station과 tap 사이에서는 full-duplex operation이 가능하고, station은 bus로 data를 송신하거나 bus에서 data를 수신한다.

Bus에서 한 station이 transmission하면 signal은 medium 양방향으로 propagation되고 모든 station이 들을 수 있다. Bus 양 끝에는 **terminator**가 있어 signal을 흡수하고 bus에서 제거한다. Tree는 bus를 일반화한 구조다. Headend에서 시작한 cable이 branch를 만들고, branch가 다시 branch를 만들어 복잡한 layout이 가능하다. Tree에서도 한 station의 transmission은 medium 전체로 퍼져 다른 station이 수신할 수 있다.

이 구조에서는 두 문제가 생긴다.

| 문제 | 필요 mechanism |
|---|---|
| intended recipient 식별 | frame header에 destination address를 넣어 누가 받을 data인지 나타낸다. |
| transmission regulation | 두 station이 동시에 보내면 signal이 겹쳐 garbled되므로 medium access control이 필요하다. |

그래서 station은 data를 작은 block인 **frame**으로 나누어 보낸다. Frame은 data portion과 control information이 들어 있는 frame header로 구성된다. 각 station에는 unique address가 있고, destination address가 frame header에 포함된다.

![Figure 15.3](@/assets/images/data-communication-194-figure-15-3-page-473.png)
*Figure 15.3 · PDF p. 473 · bus LAN에서 frame이 모든 station을 지나가고 목적지만 copy하는 동작*

Figure 15.3에서 station C가 A에게 frame을 보낸다. Frame은 bus를 따라 전파되며 B를 지나지만, B는 destination address가 자기 것이 아니므로 무시한다. A는 자기 address를 보고 frame data를 copy한다. Frame 구조는 recipient identification을 해결하고, header의 추가 control information은 medium access regulation의 기반이 된다.

#### Ring Topology

**Ring topology**는 point-to-point link로 연결된 repeater들의 closed loop다. Repeater는 한 link에서 받은 bit를 다른 link로 거의 즉시 내보내는 비교적 단순한 장치다. Link는 unidirectional이므로 data는 ring을 한 방향으로 순환한다.

각 station은 repeater에 붙어 network로 frame을 넣는다. Frame은 ring을 따라 모든 station을 지나가며, destination station은 자기 address를 인식해 local buffer에 copy한다. 하지만 bus와 달리 frame은 terminator가 아니라 source station으로 돌아온 뒤 source가 제거한다.

![Figure 15.4](@/assets/images/data-communication-195-figure-15-4-page-474.png)
*Figure 15.4 · PDF p. 474 · ring LAN에서 destination copy 후 source가 돌아온 frame을 제거하는 과정*

Ring에서도 여러 station이 같은 ring을 공유하므로, 각 station이 언제 frame을 삽입할 수 있는지 정하는 MAC이 필요하다.

#### Star Topology

**Star topology**에서는 각 station이 central node에 직접 연결된다. 보통 station마다 central node로 가는 point-to-point link 두 개, 즉 transmit link와 receive link가 있다.

Central node 동작에는 두 방식이 있다.

| Central node 방식 | 논리적 의미 | 특징 |
|---|---|---|
| broadcast 방식 | 물리적으로는 star지만 논리적으로는 bus | 한 station이 보낸 frame을 모든 outgoing link로 retransmit한다. 한 번에 하나의 station만 성공적으로 transmit할 수 있다. 이 central element가 hub다. |
| frame-switching 방식 | switch fabric에 가까움 | incoming frame을 buffer에 저장한 뒤 destination station으로 가는 outgoing link로 retransmit한다. Section 15.5의 switch 논의로 이어진다. |

#### Choice of Topology

Topology 선택은 reliability, expandability, performance와 관련된다. 또한 transmission medium, wiring layout, access control technique과 독립적으로 결정할 수 없다.

| Topology | 장점 | 한계 |
|---|---|---|
| bus | 초기 Ethernet처럼 baseband coaxial cable과 함께 널리 사용되었다. | cable tap 이동, cable segment rerouting 등 변경이 어렵고 새 설치는 거의 하지 않는다. |
| ring | high-speed link와 긴 distance에 적합할 수 있어 throughput potential이 크다. | single link/repeater failure가 전체 network를 disable할 수 있다. |
| star | building wiring의 자연스러운 layout을 활용한다. 짧은 거리와 high data rate, 소수 device에 적합하다. | central node 성능/신뢰성이 전체 network 특성에 큰 영향을 준다. |

Bus topology에 쓰일 수 있는 medium은 twisted pair, baseband coaxial cable, broadband coaxial cable, optical fiber가 논의되지만, 실제로 널리 사용된 것은 original Ethernet의 **baseband coaxial cable**이다. Voice-grade twisted pair bus는 고속 확장이 어렵고, broadband coaxial은 비싸고 관리가 어려우며, optical fiber bus는 tap 비용과 대안 기술 때문에 널리 채택되지 않았다.

#### Choice of Transmission Medium

Transmission medium 선택은 capacity, reliability, supported data type, environmental scope에 의해 결정된다. 또한 topology가 medium 선택을 제약한다.

| Medium | 특징 | 적합한 맥락 |
|---|---|---|
| **Category 3 UTP** | inexpensive, well-understood, 기존 telephone wiring 활용 가능 | single-building, low-traffic LAN에는 cost-effective하지만 data rate가 제한된다. |
| **Shielded twisted pair / baseband coaxial cable** | Category 3 UTP보다 비싸지만 더 큰 capacity 제공 | 더 높은 capacity가 필요한 설치 |
| **Broadband coaxial cable** | 더 큰 capacity 가능하지만 더 비싸고 설치/유지보수가 어렵다. | LAN에서는 널리 자리 잡지 못했다. |
| **Category 5 UTP** | high-performance UTP로 고속 data rate를 지원한다. | star topology와 switching element interconnection을 통해 큰 설치에도 확장 가능하다. |
| **Optical fiber** | electromagnetic isolation, high capacity, small size | component cost와 설치/유지보수 skill 문제가 있었지만 점차 확대되는 medium |

이 절의 메시지는 “topology와 medium은 같이 선택해야 한다”는 것이다. 예를 들어 bus+coaxial은 역사적으로 중요하지만 변화에 취약하고, star+high-performance UTP/switching은 modern LAN의 기반으로 이어진다.

### 15.3 LAN Protocol Architecture

LAN architecture는 LAN의 기본 기능을 protocol layer로 나누어 설명한다. LAN/MAN 전송에서 중요한 문제는 network 위로 data block을 보내는 lower-layer function이다. OSI 관점에서 layer 3 이상 protocol은 LAN/MAN/WAN에 공통으로 적용될 수 있으므로, LAN protocol 논의는 주로 physical, **medium access control (MAC)**, **logical link control (LLC)**에 집중한다.

#### IEEE 802 Reference Model

IEEE 802 reference model은 LAN protocol을 OSI model에 맞춰 정리한다.

![Figure 15.5](@/assets/images/data-communication-196-figure-15-5-page-477.png)
*Figure 15.5 · PDF p. 477 · IEEE 802 protocol layer와 OSI model의 대응*

IEEE 802의 physical layer는 OSI physical layer에 대응하며 다음 기능을 포함한다.

| Physical function | 설명 |
|---|---|
| signal encoding/decoding | bit를 medium에 맞는 signal로 바꾸고 다시 bit로 해석한다. |
| preamble generation/removal | synchronization을 위해 preamble을 만들고 제거한다. |
| bit transmission/reception | physical medium 위에서 bit를 송수신한다. |
| medium/topology specification | OSI model 아래로 볼 수도 있지만 LAN 설계에서 중요하므로 IEEE 802 physical scope에 포함된다. |

Data link 계층의 기능은 IEEE 802에서 **LLC**와 **MAC**으로 나뉜다. 전송 시 data를 address/error detection field가 있는 frame으로 조립하고, 수신 시 frame disassembly, address recognition, error detection을 수행하며, LAN transmission medium access를 제어한다. 또 higher layer interface와 flow/error control 기능도 제공한다.

이 분리의 이유는 두 가지다.

| 이유 | 의미 |
|---|---|
| shared-access medium 관리 logic | 전통적 point-to-point data link control에는 shared medium access management logic이 없다. |
| 동일 LLC 위의 여러 MAC option | LLC service는 유지하면서 Ethernet, token ring 등 서로 다른 MAC을 선택할 수 있다. |

![Figure 15.6](@/assets/images/data-communication-197-figure-15-6-page-478.png)
*Figure 15.6 · PDF p. 478 · application data가 TCP/IP, LLC PDU, MAC frame으로 encapsulation되는 맥락*

Figure 15.6은 higher-level data가 LLC로 내려와 LLC header가 붙고 **LLC protocol data unit (LLC PDU)**가 된 뒤, MAC layer에서 MAC header와 MAC trailer가 붙어 **MAC frame**이 되는 구조를 보여준다. TCP/IP stack과 함께 보면, LAN layer는 IP datagram을 local medium 위에서 운반하는 encapsulation layer다.

#### Logical Link Control (LLC)

**LLC**는 두 station 사이에 link-level PDU를 전송하는 기능을 담당한다. 일반 link layer와 비슷하지만 LAN 특성 때문에 두 차이가 있다. 첫째, multiaccess/shared-medium nature를 지원해야 한다. 둘째, medium access의 세부는 MAC layer가 담당하므로 LLC는 그 부담에서 벗어난다.

LLC addressing은 source/destination LLC user를 지정한다. LLC user는 보통 higher-layer protocol 또는 network management function이며, OSI 용어로 **service access point (SAP)**라고 부른다. IEEE 802에서는 LLC service access point를 **LSAP**라고도 한다.

LLC가 제공하는 service는 세 가지다.

| LLC service | 특징 | 적합한 상황 |
|---|---|---|
| **Unacknowledged connectionless service** | datagram-style service. flow/error control 없이 data를 보내며 delivery guarantee가 없다. | reliability를 TCP 같은 higher layer가 맡거나, sensor/self-test report처럼 occasional loss가 큰 문제가 아닌 경우 |
| **Connection-mode service** | HDLC와 유사하게 logical connection을 설정하고 flow control/error control을 제공한다. | terminal controller처럼 higher-layer software가 거의 없는 단순 장치 |
| **Acknowledged connectionless service** | logical connection 없이 datagram을 보내지만 acknowledgment를 요구한다. | 많은 destination에 guaranteed delivery가 필요하거나, urgent alarm/control signal처럼 connection setup 시간을 아끼고 싶은 경우 |

원문은 대부분의 경우 unacknowledged connectionless service가 preferred option이라고 설명한다. 이유는 reliability/flow control을 higher layer가 이미 제공할 때 LLC에서 중복 구현하면 비효율적이고, 일부 monitoring application은 occasional data unit loss를 감당할 수 있기 때문이다.

#### LLC Protocol과 LLC PDU

LLC protocol은 HDLC를 model로 하지만 LAN에 맞춰 다음 차이가 있다.

| LLC operation | 설명 |
|---|---|
| **Type 1 operation** | unacknowledged connectionless service. unnumbered information (UI) PDU로 user data를 전송한다. |
| **Type 2 operation** | connection-mode LLC service. HDLC의 asynchronous balanced mode(ABM)를 사용하며 extended 7-bit sequence number가 mandatory다. |
| **Type 3 operation** | acknowledged connectionless service. HDLC에는 없는 acknowledged connectionless information PDU를 사용한다. |
| LSAP multiplexing | LLC service access point를 사용해 여러 higher-layer user를 multiplexing한다. |

![Figure 15.7](@/assets/images/data-communication-198-figure-15-7-page-481.png)
*Figure 15.7 · PDF p. 481 · generic MAC frame 안의 LLC PDU와 DSAP/SSAP/control field*

LLC PDU는 네 field로 구성된다.

| Field | 의미 |
|---|---|
| **DSAP (Destination Service Access Point)** | destination LLC user를 지정하는 7-bit address와 Individual/Group bit |
| **SSAP (Source Service Access Point)** | source LLC user를 지정하는 7-bit address와 Command/Response bit |
| **LLC control** | HDLC control field와 동일한 형식, extended 7-bit sequence number 사용 |
| **Information** | higher-layer data 또는 management 정보 |

Type 1은 UI PDU를 사용하고 acknowledgment/flow control/error control은 없지만, MAC level에서 error detection과 discard는 수행된다. XID PDU는 지원 operation type과 window size를 교환하고, TEST PDU는 두 LLC entity 사이 transmission path의 loopback test에 사용된다.

Type 2에서는 LLC SAP pair 사이에 data link connection을 설정한다. Connection request에는 **SABME** PDU를 사용하고, destination이 accept하면 **UA** PDU를 반환한다. Reject하면 **DM** PDU를 반환한다. 이후 data는 HDLC처럼 information PDU와 supervisory PDU를 통해 sequencing, flow control, error control을 수행하며, **DISC** PDU로 connection을 종료할 수 있다.

Type 3에서는 각 transmitted PDU가 acknowledge된다. **AC Information PDU**를 사용하며, 1-bit sequence number로 lost PDU를 방지한다. 각 방향에 outstanding PDU는 하나만 허용된다.

#### Medium Access Control (MAC)

모든 LAN/MAN은 여러 device가 network transmission capacity를 공유하므로 orderly and efficient use를 위해 **MAC protocol**이 필요하다. MAC technique의 핵심 parameter는 `where`와 `how`다.

`where`는 access control이 centralized인지 distributed인지다.

| 방식 | 장점 | 단점 |
|---|---|---|
| Centralized control | priority, override, guaranteed capacity 같은 access policy를 강하게 제어할 수 있고 station access logic이 단순하다. | controller failure가 single point of failure가 되고, controller가 performance bottleneck이 될 수 있다. |
| Distributed control | single controller failure/bottleneck 문제가 작고 peer station들이 access order를 동적으로 결정한다. | station 간 coordination logic이 복잡해질 수 있다. |

`how`는 topology에 의해 제약되며 cost, performance, complexity 사이 trade-off다. Synchronous technique은 connection에 fixed capacity를 할당하는 방식으로 circuit switching, FDM, synchronous TDM과 유사하지만, LAN/MAN의 unpredictable traffic에는 일반적으로 최적이 아니다. 그래서 capacity를 immediate demand에 따라 dynamic하게 할당하는 asynchronous approach가 더 적합하다.

Asynchronous access control은 세 범주로 나뉜다.

| 방식 | 동작 | 적합한 traffic |
|---|---|---|
| **Round robin** | 각 station이 순서대로 transmit opportunity를 받는다. 보내지 않으면 turn을 넘기고, 보낼 때도 data/time upper bound가 있을 수 있다. | 많은 station이 장기간 data를 보낼 때 효율적이다. |
| **Reservation** | medium time을 slot으로 나누고, station이 future slot을 reserve한다. | voice, telemetry, bulk file transfer 같은 stream traffic에 적합하다. |
| **Contention** | 누구 차례인지 미리 정하지 않고 station들이 medium access를 경쟁한다. | short, sporadic bursty traffic에 적합하고 light/moderate load에서 단순하고 효율적이지만 heavy load에서 성능 collapse 가능성이 있다. |

#### MAC Frame Format

MAC layer는 LLC layer에서 받은 data block을 medium access와 transmission에 필요한 MAC frame으로 만든다. 구체 format은 MAC protocol마다 다르지만, 일반적으로 Figure 15.7과 비슷한 field를 가진다.

| MAC frame field | 의미 |
|---|---|
| **MAC Control** | priority level 등 MAC protocol 동작에 필요한 control information |
| **Destination MAC Address** | 이 frame의 destination physical attachment point |
| **Source MAC Address** | 이 frame의 source physical attachment point |
| **LLC** | higher layer에서 내려온 LLC data |
| **CRC / FCS** | error-detecting code. HDLC처럼 damaged frame detection에 사용 |

LAN architecture에서 error 처리 책임은 MAC과 LLC로 나뉜다. MAC layer는 CRC로 error를 detect하고 error frame을 discard한다. LLC layer는 선택적으로 successful reception을 추적하고 unsuccessful frame을 retransmit한다. 즉 “detect/discard는 MAC, optional recovery는 LLC”로 기억하면 된다.

### 15.4 Bridges

조직 network는 거의 항상 단일 LAN의 범위를 넘어 확장되어야 한다. 이를 위해 여러 LAN끼리 또는 LAN과 WAN을 interconnect해야 한다. 대표 장비는 **bridge**와 **router**다. Bridge는 더 단순한 장비로, 주로 비슷한 LAN을 연결한다. Router는 더 일반적인 장비로 다양한 LAN/WAN을 interconnect하며 Part Five에서 다룬다.

Bridge는 physical/link layer protocol이 동일한 LAN, 예를 들어 모두 IEEE 802.3 계열인 LAN 사이에서 쓰기 쉽다. 같은 protocol을 쓰면 bridge가 해야 할 processing이 작다. 더 sophisticated한 bridge는 Ethernet과 token ring처럼 서로 다른 MAC format 사이 mapping도 할 수 있다.

여러 LAN을 bridge로 나누어 연결하는 이유는 다음과 같다.

| 이유 | 설명 |
|---|---|
| reliability | 하나의 큰 LAN에 fault가 생기면 모든 device communication이 멈출 수 있다. Bridge로 partition하면 self-contained unit 단위로 장애 영향을 줄일 수 있다. |
| performance | LAN의 device 수와 wire length가 늘면 performance가 감소한다. Local traffic이 많은 device를 cluster하면 smaller LAN 여러 개가 더 좋은 성능을 낼 수 있다. |
| security | accounting, personnel, strategic planning처럼 다른 security need를 가진 traffic을 physical medium별로 분리하고, bridge를 통해 controlled/monitored communication을 제공할 수 있다. |
| geography | 멀리 떨어진 building/device cluster는 별도 LAN으로 두고 microwave bridge link 같은 방식으로 연결하는 것이 현실적일 수 있다. |

#### Functions of a Bridge

Bridge의 기본 동작은 “한 LAN에서 다른 LAN으로 가야 하는 MAC frame을 읽고 반복 전송한다”다.

![Figure 15.8](@/assets/images/data-communication-199-figure-15-8-page-486.png)
*Figure 15.8 · PDF p. 486 · LAN A와 LAN B 사이 bridge frame forwarding 동작*

Figure 15.8처럼 bridge가 LAN A와 LAN B를 연결하면, bridge는 LAN A에서 전송되는 모든 frame을 읽고 destination이 LAN B의 station이면 accept하여 LAN B에 retransmit한다. 반대 방향도 동일하다.

Bridge 설계에서 중요한 점은 다음과 같다.

| 측면 | 의미 |
|---|---|
| no frame modification | bridge는 받은 frame의 content/format을 수정하지 않고 추가 header로 encapsulate하지도 않는다. 같은 bit pattern을 다른 LAN에 반복한다. |
| buffering | 짧은 시간 동안 arrival rate가 retransmission rate보다 클 수 있으므로 peak demand를 견딜 buffer가 필요하다. |
| addressing/routing intelligence | 최소한 어떤 address가 어느 LAN에 있는지 알아야 하고, 여러 bridge가 있으면 어떤 방향으로 forward할지도 결정해야 한다. |
| multi-LAN support | bridge는 두 개보다 많은 LAN을 연결할 수도 있다. |

Bridge를 쓰면 station 입장에서는 software 수정이 필요 없다. 모든 station이 하나의 logical LAN 위에 있는 것처럼 보이고, station은 destination이 같은 LAN인지 다른 LAN인지 구분하지 않아도 된다. Bridge가 MAC address를 보고 필요한 relay를 처리한다.

#### Bridge Protocol Architecture

IEEE 802.1D는 MAC bridge protocol architecture를 정의한다. IEEE 802 architecture에서 endpoint/station address는 MAC level에 있으므로 bridge도 MAC level에서 동작한다.

![Figure 15.9](@/assets/images/data-communication-200-figure-15-9-page-487.png)
*Figure 15.9 · PDF p. 487 · bridge가 LLC peer dialogue를 유지한 채 MAC frame을 relay하는 구조*

Figure 15.9에서 두 LAN은 같은 MAC/LLC protocol을 쓴다. Bridge는 immediate LAN에 없는 destination을 가진 MAC frame을 capture하고, 잠시 buffer한 뒤 다른 LAN에 transmit한다. LLC layer 관점에서는 endpoint station의 peer LLC entity끼리 직접 대화하는 것처럼 보인다. Bridge는 LLC layer를 포함할 필요가 없다. Bridge는 MAC frame을 strip하거나 새 LLC를 해석하지 않고, MAC frame intact relay를 수행한다.

멀리 떨어진 LAN을 연결할 때는 두 bridge 사이에 WAN packet-switching network나 point-to-point link 같은 communication facility가 들어갈 수 있다. 이때 bridge는 MAC frame을 facility에 맞게 encapsulate해 target bridge로 보내고, target bridge가 extra field를 제거한 뒤 original unmodified MAC frame을 destination LAN에 transmit한다.

#### Fixed Routing

Bridge로 연결된 LAN 수가 늘면 alternate path가 필요해진다. Redundancy는 load balancing과 failure recovery에 유용하지만, bridge는 incoming frame을 보고 forward 여부와 output LAN을 결정해야 한다.

![Figure 15.10](@/assets/images/data-communication-201-figure-15-10-page-488.png)
*Figure 15.10 · PDF p. 488 · 여러 LAN과 bridge가 alternate route를 갖는 구성*

Figure 15.10에서 LAN A의 station 1이 LAN F의 station 6에게 frame을 보낸다고 하자. LAN A에 붙은 여러 bridge가 frame을 읽지만, 실제로는 bridge 102가 LAN C로 forward하고, 이후 bridge 105가 LAN F로 forward해야 한다. 모든 bridge가 무작정 retransmit하면 duplicate와 loop 문제가 생긴다.

**Fixed routing**은 각 source-destination LAN pair에 대해 route를 미리 선택하는 방식이다. Alternate route가 있으면 보통 least hop route를 선택한다. Central routing matrix를 만들고, 각 row에서 bridge별 routing table을 추출한다. Bridge는 incoming frame의 destination MAC address가 table entry와 일치하면 적절한 LAN으로 retransmit한다.

Fixed routing의 장점은 simplicity와 minimal processing requirement다. 작은 internet이나 topology가 안정적인 LAN interconnection에는 충분하다. 하지만 bridge가 동적으로 추가되거나 failure recovery가 필요한 복잡한 environment에서는 network manager가 manual table을 관리하는 방식이 한계가 된다.

#### The Spanning Tree Approach

**Spanning tree approach**는 bridge가 routing table을 자동으로 만들고 topology change에 따라 update하도록 하는 mechanism이다. 원문은 세 mechanism으로 설명한다.

| Mechanism | 역할 |
|---|---|
| frame forwarding | forwarding database를 보고 destination MAC address를 어느 port로 내보낼지 결정한다. |
| address learning | incoming frame의 source MAC address와 incoming port를 이용해 station 방향을 자동 학습한다. |
| loop resolution | alternate route가 만드는 closed loop를 제거하기 위해 spanning tree를 만든다. |

##### Frame Forwarding

Bridge는 LAN에 붙은 각 port마다 forwarding database를 유지한다. 각 entry는 “이 destination station은 bridge의 어느 port 방향에 있다”를 나타낸다. Bridge가 port `x`로 MAC frame을 받으면 다음 rules를 적용한다.

| Step | Rule |
|---|---|
| 1 | destination MAC address가 port `x`를 제외한 다른 port database에 있는지 찾는다. |
| 2 | destination이 없으면 incoming port를 제외한 모든 port로 forward한다. 이는 learning process의 일부다. |
| 3 | destination이 port `y`에 있으면, port `y`가 blocking state인지 forwarding state인지 확인한다. |
| 4 | port `y`가 blocked가 아니면 해당 LAN으로 frame을 transmit한다. |

##### Address Learning

Address learning은 source address field를 이용한다. 어떤 frame이 특정 port로 들어왔다는 것은 source station이 그 port 방향에 있다는 뜻이다. Bridge는 incoming frame의 source MAC address를 보고 forwarding database를 update한다. Topology change에 대응하기 위해 각 entry에는 timer가 붙는다. Timer가 expire되면 entry를 제거하고, 같은 source에서 frame이 다시 들어오면 direction을 갱신하고 timer를 reset한다.

##### Loop 문제와 Spanning Tree Algorithm

Address learning은 topology가 tree일 때 효과적이다. Alternate route가 있으면 closed loop가 생기고, learning bridge가 잘못 학습하거나 duplicate frame을 만들 수 있다.

![Figure 15.11](@/assets/images/data-communication-202-figure-15-11-page-491.png)
*Figure 15.11 · PDF p. 491 · bridge loop가 duplicate frame과 잘못된 address learning을 만드는 예*

Figure 15.11에서 station A가 station B로 frame을 보내면 두 bridge가 모두 frame을 capture하고 LAN Y로 retransmit할 수 있다. B는 두 copy를 받는다. 더 심각하게, 각 bridge는 다른 bridge가 LAN Y에 내보낸 frame을 다시 보고 source address가 A인 frame이 LAN Y 방향에서 왔다고 잘못 학습한다. 그러면 이후 station A로 가는 frame을 제대로 forward하지 못한다.

이를 막기 위해 graph theory의 spanning tree를 사용한다. Connected graph에서 connectivity는 유지하면서 closed loop가 없는 edge subset을 만들 수 있다. LAN은 graph node, bridge는 graph edge로 볼 수 있다. IEEE 802.1 spanning tree algorithm은 bridge들이 message를 짧게 교환해 minimum-cost spanning tree를 만들고, tree 밖의 redundant port를 blocking 상태로 두어 loop를 제거한다.

Algorithm이 동작하려면 각 bridge에는 unique identifier가 있고, 각 bridge port에는 cost가 있어야 한다. 특별한 policy가 없으면 모든 cost를 같게 두어 minimum-hop tree를 만들 수 있다. Topology change가 생기면 bridge들이 자동으로 spanning tree를 다시 계산한다.

### 15.5 Layer 2 and Layer 3 Switches

Bridge와 router만으로 LAN interconnection을 설명하기에는 실제 LAN 장비가 더 다양해졌다. 이 절의 핵심은 `hub`, `layer 2 switch`, `layer 3 switch`를 같은 배선 구조 안에서 비교하는 것이다. 이름은 비슷하지만 각 장비가 보는 주소 계층과 forward 방식이 다르다.

| Device | 주로 보는 정보 | 동작 계층 | 핵심 효과 |
|---|---|---|---|
| `hub` | bit/signal | physical 반복 | 물리적으로 star, 논리적으로 shared bus |
| `layer 2 switch` | MAC address | data link/MAC | frame을 목적지 port로 switching |
| `layer 3 switch` | IP address 등 network-layer address | network layer | router forwarding을 hardware로 고속 처리 |

#### Hubs

`hub`는 star-topology LAN의 active central element이다. 각 station은 보통 transmit line과 receive line의 두 선으로 hub에 붙고, hub는 repeater처럼 동작한다. 한 station이 전송하면 hub는 그 signal을 모든 outgoing line으로 반복한다.

중요한 점은 물리 구조와 논리 구조가 다르다는 것이다. Hub LAN은 배선상으로는 star지만, transmission from any one station이 모든 station에 도달하므로 논리적으로는 bus이다. 따라서 두 station이 동시에 transmit하면 collision이 발생한다. 이 구조에서는 전체 LAN capacity를 station들이 공유한다.

전송 매체로는 보통 `unshielded twisted pair` 두 쌍을 쓰며, 고속 전송과 UTP의 전송 품질 때문에 한 line 길이는 약 100 m로 제한된다. Optical fiber link를 쓰면 약 500 m까지 늘릴 수 있다. Hub는 building wiring practice와 잘 맞는다. 층별 wiring closet에 intermediate hub를 두고, 상위 header hub로 묶으면 사무실 건물의 물리 배선을 자연스럽게 LAN 구조로 바꿀 수 있다.

![Figure 15.12](@/assets/images/data-communication-203-figure-15-12-page-493.png)
*Figure 15.12 · PDF p. 493 · header hub와 intermediate hub로 구성한 two-level star topology*

Figure 15.12의 two-level star topology에서는 `HHUB` 아래에 여러 `IHUB`가 붙고, 각 IHUB 아래에 stations가 붙는다. Hub는 단순 bus보다 관리가 쉽다. 예를 들어 malfunctioning station이 network를 jam하면 해당 station을 network에서 분리하도록 설정할 수 있다. 하지만 collision domain을 나누지는 못한다.

#### Layer 2 Switches

`layer 2 switch`는 high-speed LAN에서 hub를 대체한 장비이며 `switching hub`라고도 부른다. Hub와 겉모습은 비슷하게 중앙 장비에 station이 붙지만, 내부 동작은 전혀 다르다. Hub는 들어온 signal을 모두에게 반복하고, layer 2 switch는 incoming MAC frame의 destination MAC address를 보고 적절한 output line으로 switch한다.

![Figure 15.13](@/assets/images/data-communication-204-figure-15-13-page-494.png)
*Figure 15.13 · PDF p. 494 · shared medium bus, shared medium hub, layer 2 switch의 capacity 차이*

Figure 15.13a의 shared medium bus에서는 B가 transmit하면 signal이 bus 양방향으로 퍼지고 모든 station의 access line으로 들어간다. 전체 bus capacity가 10 Mbps라면 모든 station이 그 10 Mbps를 공유한다.

Figure 15.13b의 shared medium hub도 wiring은 star지만 전송 논리는 같다. B의 frame은 hub로 들어간 뒤 다른 모든 station의 receive line으로 재전송된다. Collision을 피하려면 한 번에 한 station만 transmit해야 하므로 전체 capacity는 여전히 10 Mbps이다.

Figure 15.13c의 layer 2 switch에서는 B가 A로 frame을 보내는 동안 C가 D로 frame을 보낼 수 있다. 각 device의 link rate가 10 Mbps여도, switch 내부 capacity가 충분하면 전체 throughput은 동시에 여러 frame을 처리해 20 Mbps 이상이 될 수 있다. 이 차이가 hub와 switch를 가르는 핵심이다.

Layer 2 switch의 장점은 다음처럼 정리된다.

| 장점 | 의미 |
|---|---|
| Attached device 변경 없음 | Ethernet LAN에서는 station이 계속 Ethernet MAC protocol을 사용하므로 hardware/software를 바꾸지 않고 switched LAN으로 이전할 수 있다. |
| Dedicated capacity | switch capacity가 충분하면 각 device가 기존 전체 LAN과 같은 전용 capacity를 갖는 것처럼 동작한다. |
| Scalability | switch capacity를 키우면 device를 더 붙일 수 있고, 여러 frame을 병렬로 처리할 수 있다. |

상용 layer 2 switch는 크게 두 방식으로 구현된다.

| 방식 | 동작 | 장점 | 위험 또는 비용 |
|---|---|---|---|
| `store-and-forward switch` | input line에서 frame 전체를 받아 buffer에 저장한 뒤 output line으로 전달 | CRC를 확인할 수 있어 network integrity가 높다 | sender와 receiver 사이에 forwarding delay가 생긴다 |
| `cut-through switch` | MAC frame 앞부분의 destination address를 읽자마자 output line으로 반복 시작 | 가능한 가장 낮은 latency와 높은 throughput | CRC 확인 전에 내보내므로 bad frame을 전파할 수 있다 |

Layer 2 switch는 full-duplex version of the hub로 볼 수도 있고, multiport bridge로 볼 수도 있다. Bridge와 비교하면 layer 2 switch는 address recognition과 frame forwarding을 hardware로 처리하고, 여러 parallel data paths를 통해 multiple frames를 동시에 처리할 수 있다. 반면 전통적 bridge는 보통 software로 frame을 분석하고 한 번에 하나의 frame을 store-and-forward 방식으로 처리한다.

따라서 새 LAN 설치에서는 독립 bridge보다 bridge functionality를 포함한 layer 2 switch가 더 자연스럽다. Bridge의 개념은 여전히 중요하지만, 실제 장비 구현에서는 switch가 그 역할을 고성능으로 흡수한다.

#### Layer 3 Switches

Layer 2 switch는 PC, workstation, server가 만드는 high-volume traffic에 잘 대응하지만, 큰 campus나 building complex에서는 한계가 드러난다. 책은 특히 두 문제를 지적한다.

| 문제 | 원인 | 결과 |
|---|---|---|
| `broadcast overload` | layer 2 switch/bridge로 연결된 장비 집합은 flat address space를 공유한다 | MAC broadcast frame이 전체 switched LAN으로 퍼져 overhead가 커지고, malfunctioning device는 broadcast storm을 만들 수 있다 |
| Multiple links 부족 | 표준 bridge protocol은 closed loop를 허용하지 않는다 | 두 device 사이에 하나의 path만 남기므로 성능과 reliability를 위해 redundant path를 쓰기 어렵다 |

자연스러운 해결책은 큰 local network를 여러 subnetwork로 나누고 router로 연결하는 것이다. 그러면 MAC broadcast frame은 자기 subnetwork 안에 제한되고, IP router는 routing algorithm을 통해 여러 path를 활용할 수 있다. 하지만 software-based router는 IP-level processing을 software로 수행하므로 high-speed LAN과 layer 2 switch가 밀어 넣는 millions of packets per second를 따라가지 못할 수 있다.

`layer 3 switch`는 이 병목을 줄이기 위해 router의 packet-forwarding logic을 hardware로 구현한 장비다. 즉, layer 2 switch의 switching performance와 router의 subnet/routing 기능을 결합한다.

Layer 3 switching 방식은 크게 두 범주로 나뉜다.

| 방식 | 동작 | 특징 |
|---|---|---|
| `packet-by-packet switch` | traditional router처럼 각 packet을 독립적으로 forwarding하되 forwarding logic을 hardware로 처리 | software-based router보다 order of magnitude 수준의 성능 향상을 얻을 수 있다 |
| `flow-based switch` | source와 destination이 같은 IP packet sequence를 flow로 식별하고 predefined route를 설정 | ongoing traffic 관찰이나 packet header의 flow label을 활용한다. IPv6는 flow label을 허용하지만 IPv4는 허용하지 않는다 |

![Figure 15.14](@/assets/images/data-communication-205-figure-15-14-page-497.png)
*Figure 15.14 · PDF p. 497 · layer 2 switch, layer 3 switch, router를 조합한 premises network configuration*

Figure 15.14는 대규모 조직의 typical premises network configuration을 보여준다. Desktop systems는 10 Mbps 또는 100 Mbps link로 layer 2 switch에 붙고, wireless LAN은 mobile user에게 access를 제공한다. Local network core에는 layer 3 switches가 있어 local backbone을 구성하며, 이들은 보통 1 Gbps로 상호 연결되고 layer 2 switch와 100 Mbps에서 1 Gbps로 연결된다. Servers는 layer 2 또는 layer 3 switch에 1 Gbps 또는 100 Mbps로 직접 붙을 수 있다. WAN connection은 상대적으로 저렴한 software-based router가 담당한다.

그림의 circle은 separate LAN subnetworks를 나타낸다. 이 구획 덕분에 MAC broadcast frame은 자기 subnetwork 안에만 머문다. 이 점이 layer 2 switching만으로 큰 LAN을 평평하게 확장하는 방식과 layer 3 switching을 core에 둔 설계의 차이다.

## 장 전체 연결 관계

Chapter 15는 LAN을 하나의 장비 목록이 아니라 `topology`, `transmission medium`, `LAN protocol architecture`, `bridge/switch` 설계의 조합으로 설명한다. Chapter 14의 wireless cellular network가 wide-area wireless mobility를 다뤘다면, Chapter 15는 건물과 campus 안에서 station들이 shared medium 또는 switched medium을 어떻게 공유하는지 다룬다. 뒤의 Chapter 16 High-Speed LANs에서는 이 구조 위에서 Ethernet과 Fibre Channel 같은 구체적 LAN technology가 이어진다.

| 연결 지점 | 이 장에서 잡아야 할 의미 |
|---|---|
| OSI model | IEEE 802는 data link layer를 `LLC`와 `MAC`으로 쪼갠다. |
| Data link control | LLC Type 2는 HDLC와 유사한 connection-mode service를 제공하지만, LAN에서는 MAC이 shared medium access를 따로 맡는다. |
| Switching/routing | Bridge와 layer 2 switch는 MAC address 기반이고, router와 layer 3 switch는 network-layer address 기반이다. |
| Reliability/performance | Spanning tree는 loop를 막지만 redundant path 활용을 제한한다. Layer 3 switching은 subnet 분리와 고속 forwarding으로 이 문제를 완화한다. |

## 오해하기 쉬운 내용

| 오해 | 바로잡기 |
|---|---|
| Star topology이면 항상 collision이 없다 | Hub 기반 star는 물리적으로 star일 뿐 논리적으로 shared bus라 collision이 생긴다. |
| Bridge와 router는 같은 장비다 | Bridge는 MAC frame을 forward하고, router는 network-layer packet을 forward한다. Broadcast 제한과 routing path 선택에서 차이가 크다. |
| Layer 2 switch는 router처럼 broadcast를 자동으로 막는다 | Layer 2 switched LAN은 flat MAC broadcast space를 만들 수 있다. Broadcast 범위 제한은 subnet/router/layer 3 switch 설계가 필요하다. |
| Cut-through가 항상 store-and-forward보다 좋다 | Cut-through는 빠르지만 CRC 확인 전에 frame을 내보내 bad frame propagation 위험이 있다. |
| Spanning tree는 redundant link를 없애는 나쁜 기능이다 | Link를 물리적으로 제거하는 것이 아니라 loop 방지를 위해 일부 port를 blocking 상태로 두고, topology 변화 시 다시 계산한다. |

## 핵심 용어 정리

| Term | 한국어 중심 의미 |
|---|---|
| `local area network (LAN)` | 건물, floor, campus 같은 제한된 범위에서 station들이 고속 통신하는 network |
| `topology` | station과 link가 연결된 논리적/물리적 구조 |
| `bus topology` | 하나의 shared cable을 station들이 함께 쓰는 구조 |
| `tree topology` | bus에서 branching을 허용한 구조 |
| `ring topology` | repeater들이 closed loop를 만들고 frame이 ring을 순환하는 구조 |
| `star topology` | 중앙 node 또는 hub/switch에 station들이 붙는 구조 |
| `logical link control (LLC)` | IEEE 802에서 MAC 위에 놓이는 data link control 계층 |
| `medium access control (MAC)` | shared medium 접근 방식, MAC frame format, address handling을 담당하는 계층 |
| `DSAP`, `SSAP` | LLC PDU에서 destination/source service access point를 식별하는 field |
| `CRC`, `FCS` | frame error detection을 위한 cyclic redundancy check / frame check sequence |
| `bridge` | 여러 LAN을 MAC layer에서 연결하고 frame을 forward/filter하는 장비 |
| `spanning tree` | bridge loop를 제거하면서 connectivity를 유지하는 loop-free topology |
| `hub` | signal을 모든 port로 반복하는 central repeater |
| `layer 2 switch` | MAC address를 보고 frame을 port 간 switching하는 고성능 multiport bridge 성격의 장비 |
| `store-and-forward switch` | frame 전체를 받은 뒤 검사하고 forward하는 switch |
| `cut-through switch` | destination address를 읽는 즉시 frame forwarding을 시작하는 switch |
| `layer 3 switch` | router의 packet forwarding logic을 hardware로 구현한 switch |
| `broadcast storm` | broadcast frame이 과도하게 발생해 legitimate traffic을 밀어내는 상태 |
| `flat address space` | layer 2 network 전체가 같은 MAC broadcast domain을 공유하는 구조 |
| `storage area networks (SAN)` | server와 storage system 사이의 고속 전용 network |
