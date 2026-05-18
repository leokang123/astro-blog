---
title: "Chapter 17. Wireless LANs"
order: 17
pubDatetime: 2026-05-18T00:08:00+09:00
modDatetime: 2026-05-18T00:08:00+09:00
description: "Data and Computer Communications 정리: Chapter 17. Wireless LANs"
tags:
  - "DataCommunication"
  - "CS"
---

## 개요

Wireless LAN은 wired LAN을 단순히 선 없는 형태로 바꾼 기술이 아니다. 원문은 wireless LAN이 traditional wired LAN의 indispensable adjunct, 즉 보완재가 되었다고 설명한다. 이유는 `mobility`, `relocation`, `ad hoc networking`, `difficult-to-wire location coverage` 같은 요구가 유선 LAN만으로는 자연스럽지 않기 때문이다.

Chapter 17의 큰 흐름은 세 부분이다. 먼저 wireless LAN을 쓰는 application과 요구사항을 정리하고, 그 다음 transmission technology를 `infrared`, `spread spectrum`, `narrowband microwave`로 나눈다. 이후 대부분의 분량은 IEEE 802.11 standard의 architecture, services, medium access control, physical layer, security considerations로 이어진다.

## 핵심 개념

| 주제 | 핵심 질문 | 반드시 남길 영어 용어 |
|---|---|---|
| Overview | Wireless LAN은 어떤 문제를 해결하는가? | LAN extension, cross-building interconnect, nomadic access, ad hoc network |
| Wireless LAN Technology | 무선 전송 방식은 어떤 선택지가 있는가? | infrared, spread spectrum, narrowband microwave, omnidirectional, directed beam |
| IEEE 802.11 Architecture and Services | 802.11은 wireless station과 wired distribution system을 어떻게 모델링하는가? | STA, AP, BSS, ESS, DS, portal, association, reassociation, distribution |
| IEEE 802.11 MAC | 왜 Ethernet의 CSMA/CD를 그대로 쓰지 않는가? | CSMA/CA, DCF, PCF, RTS, CTS, ACK, SIFS, PIFS, DIFS, NAV |
| IEEE 802.11 Physical Layer | 802.11a/b/g의 PHY는 무엇이 다른가? | FHSS, DSSS, OFDM, Barker sequence, CCK, PLCP, PMD |
| Security Considerations | 무선에서 인증과 privacy가 왜 별도 service가 되는가? | authentication, deauthentication, privacy, WEP, 802.11i |

## 세부 정리

### 17.1 Overview

Wireless LAN은 wireless transmission medium을 사용하는 LAN이다. 초기에는 가격이 높고, data rate가 낮고, safety concern과 licensing requirement가 있어 널리 쓰이지 않았다. 이 문제가 완화되면서 wireless LAN은 빠르게 확산되었다.

#### Wireless LAN Applications

원문은 wireless LAN application을 네 가지로 나눈다.

| Application | 의미 | 핵심 포인트 |
|---|---|---|
| `LAN extension` | wired LAN을 완전히 대체하기보다 유선 배선이 어렵거나 비경제적인 곳을 무선으로 확장 | factory floor, warehouse, trading floor, historical building, small office처럼 cabling이 어렵거나 유연성이 필요한 곳에 적합 |
| `cross-building interconnect` | 가까운 두 building의 LAN을 point-to-point wireless link로 연결 | 보통 bridge/router가 양쪽 끝에 붙는다. 엄밀히는 link 하나지만 wireless LAN 범주에서 다룬다. |
| `nomadic access` | laptop/notepad 같은 mobile terminal이 office/campus 여러 위치에서 wired LAN server에 접속 | 직원이 이동하면서도 office server에 data를 전송하거나 campus 내 다양한 지점에서 access할 수 있다. |
| `ad hoc networking` | 중앙 server나 fixed infrastructure 없이 임시 peer-to-peer network 구성 | 회의실의 laptop들이 회의 동안만 temporary network를 만드는 식이다. |

LAN extension은 초기에 “wired LAN substitute”로 마케팅되었지만, 실제로는 대부분의 조직에서 wired backbone과 함께 쓰인다. 신축 건물은 data cabling을 고려해 prewiring되고, 기존 건물도 Category 3/5 UTP가 이미 풍부한 경우가 많기 때문이다. 따라서 wireless LAN의 현실적 역할은 wired LAN을 없애는 것이 아니라 wired LAN의 reach와 mobility를 늘리는 것이다.

#### Single-Cell과 Multiple-Cell

![Figure 17.1](@/assets/images/data-communication-224-figure-17-1-page-544.png)
*Figure 17.1 · PDF p. 544 · wired backbone LAN에 control module이 붙은 single-cell wireless LAN*

Figure 17.1은 single-cell wireless LAN 예다. Ethernet 같은 backbone wired LAN이 server, workstation, bridge/router를 지원하고, `control module (CM)`이 wireless LAN과 wired backbone 사이 interface 역할을 한다. CM에는 bridge/router 기능과 access control logic이 들어갈 수 있다. Wireless side에는 standalone workstation/server뿐 아니라 여러 station을 제어하는 `user module (UM)`도 붙을 수 있다. Single-cell이라는 말은 wireless end system 전체가 하나의 CM range 안에 있다는 뜻이다.

![Figure 17.2](@/assets/images/data-communication-225-figure-17-2-page-545.png)
*Figure 17.2 · PDF p. 545 · 여러 control module이 wired LAN으로 연결된 multiple-cell wireless LAN*

Figure 17.2는 multiple-cell wireless LAN이다. 여러 control module이 wired LAN으로 서로 연결되고, 각 CM이 자기 transmission range 안의 wireless end system을 지원한다. Infrared LAN처럼 한 room 밖으로 전송이 잘 나가지 않는 방식에서는 room마다 cell이 필요할 수 있다. Multiple-cell 구조에서는 frequency reuse, interference, roaming/handoff가 설계 쟁점이 된다.

![Figure 17.3](@/assets/images/data-communication-226-figure-17-3-page-546.png)
*Figure 17.3 · PDF p. 546 · infrastructure wireless LAN과 ad hoc LAN의 구조 차이*

Figure 17.3은 infrastructure wireless LAN과 ad hoc LAN의 차이를 잡아준다. Infrastructure wireless LAN은 하나 이상의 cell과 각 cell의 CM/AP로 이루어진 stationary infrastructure가 있다. Nomadic station은 cell 사이를 이동할 수 있다. 반대로 ad hoc LAN에는 fixed infrastructure가 없고, range 안의 peer stations가 임시로 스스로 network를 구성한다.

#### Wireless LAN Requirements

Wireless LAN은 일반 LAN 요구사항인 high capacity, short distance coverage, full connectivity, broadcast capability를 만족해야 한다. 여기에 wireless 환경 특유의 요구가 추가된다.

| Requirement | 설명 |
|---|---|
| `throughput` | wireless medium은 공유 자원이고 error/interference가 많으므로 MAC protocol이 medium을 효율적으로 사용해야 한다. |
| `number of nodes` | multiple cells 전체에서 hundreds of nodes를 지원할 수 있어야 한다. |
| `connection to backbone LAN` | 대부분 wired backbone과 연결되어야 하며, infrastructure WLAN은 CM/AP를 통해 이를 해결한다. |
| `service area` | typical coverage diameter는 약 100-300 m이다. |
| `battery power consumption` | mobile workstation은 battery 기반이므로 지속 monitoring이나 frequent handshake가 과도하면 부적합하다. Sleep mode 같은 절전 기능이 필요하다. |
| `transmission robustness and security` | interference와 eavesdropping에 취약하므로 noisy environment에서 reliable transmission과 privacy/security가 필요하다. |
| `collocated network operation` | 같은 area에 여러 wireless LAN이 있으면 interference와 unauthorized access 문제가 생길 수 있다. |
| `license-free operation` | 사용자는 별도 frequency license 없이 장비를 구매/운영하기를 선호한다. |
| `handoff/roaming` | mobile station이 cell 사이를 이동할 수 있어야 한다. |
| `dynamic configuration` | end system의 addition, deletion, relocation이 다른 사용자 disruption 없이 자동/동적으로 가능해야 한다. |

### 17.2 Wireless LAN Technology

Wireless LAN은 transmission technique에 따라 분류된다. Chapter key point는 `infrared`, `spread spectrum`, `narrowband microwave`를 principal technologies로 언급하지만, 본문 설명은 주로 infrared LANs와 spread spectrum LANs에 집중한다.

#### Infrared LANs

`infrared (IR) LAN`은 infrared spectrum의 optical wireless communication을 LAN에 적용한 것이다. IR cell은 보통 single room으로 제한된다. Infrared light가 opaque wall을 통과하지 못하기 때문이다.

IR LAN의 강점과 약점은 다음처럼 갈린다.

| 측면 | 장점 또는 단점 |
|---|---|
| Spectrum | infrared spectrum은 사실상 매우 넓어 extremely high data rate 가능성이 있다. 또한 worldwide unregulated이다. |
| Security/isolation | wall을 통과하지 않으므로 microwave보다 eavesdropping 방지가 쉽고, room마다 별도 IR installation을 운영해도 interference가 적다. |
| Room coverage | light-colored object에 diffuse reflection이 가능하므로 ceiling reflection으로 room 전체 coverage를 만들 수 있다. |
| Equipment simplicity | intensity modulation을 주로 쓰므로 receiver는 optical signal amplitude를 detect하면 된다. Microwave receiver처럼 frequency/phase detection이 복잡하지 않다. |
| Ambient noise | sunlight와 indoor lighting이 infrared background radiation을 만들어 receiver noise로 작용한다. |
| Power/safety | range를 늘리려면 transmitter power를 올려야 하지만 eye safety와 battery/power consumption 제약이 있다. |

IR data transmission 방식은 세 가지다.

| Technique | 동작 | 적합한 용도 |
|---|---|---|
| `directed-beam IR` | signal을 focused and aimed beam으로 보낸다 | point-to-point link. 충분히 focus하면 kilometer range도 가능하므로 cross-building bridge/router interconnect에 쓸 수 있다. |
| `omnidirectional IR` | ceiling mounted base station이 room 안의 station과 line-of-sight로 통신하고, base station이 multiport repeater처럼 동작 | 한 room 안의 station들이 ceiling base unit을 통해 통신하는 구조 |
| `diffused IR` | 모든 IR transmitter가 light-colored ceiling의 한 지점을 향하고, ceiling reflection이 omnidirectional reradiation을 만든다 | direct line-of-sight 의존을 줄인 room coverage |

IR은 room 단위 isolation과 security에는 유리하지만, room 밖 이동성이나 multi-cell roaming에는 spread spectrum radio 기반 방식보다 제약이 크다.

#### Spread Spectrum LANs

현재 가장 popular한 wireless LAN 유형은 `spread spectrum` 기법을 사용한다. 대부분 ISM(industrial, scientific, and medical) microwave band에서 동작해, 미국 기준 FCC license 없이 사용할 수 있다는 점이 확산에 중요했다.

Spread spectrum wireless LAN은 아주 작은 office를 제외하면 보통 Figure 17.2와 같은 multiple-cell arrangement를 쓴다. Adjacent cells는 같은 band 안에서 서로 다른 center frequency를 사용해 interference를 줄인다.

한 cell 안의 topology는 두 가지다.

| Topology | 구조 | 의미 |
|---|---|---|
| `hub topology` | ceiling 등에 mounted hub/AP가 wired backbone LAN에 연결되고, station들이 hub를 통해 통신 | hub가 IEEE 802.11의 `point coordination function (PCF)`처럼 access control을 담당하거나 multiport repeater처럼 동작할 수 있다. |
| `peer-to-peer topology` | hub 없이 station들이 직접 통신 | CSMA 같은 MAC algorithm으로 access를 제어하며 ad hoc LAN에 적합하다. |

Hub topology에서도 두 방식이 가능하다. 하나는 모든 station이 hub에게만 transmit하고 hub로부터만 receive하는 방식이다. 다른 하나는 각 station이 omnidirectional antenna로 broadcast하여 cell 안의 다른 station이 직접 receive하는 방식이며, 이는 logical bus configuration에 가깝다.

Hub/AP의 또 다른 역할은 automatic handoff이다. Station은 proximity에 따라 특정 hub에 dynamically assigned된다. Hub가 signal weakening을 감지하면 nearest adjacent hub로 handoff할 수 있다. 이 개념은 뒤의 IEEE 802.11 `association`/`reassociation` service와 연결된다.

#### Unlicensed Band와 Interference

Wireless LAN은 사용자가 license 절차 없이 운영할 수 있어야 널리 쓰이기 쉽다. 하지만 country마다 licensing regulation이 달라 전 세계 공통 제품 설계가 어려워질 수 있다. 미국 FCC는 ISM band에서 두 가지 unlicensed application을 허용했다. Spread spectrum system은 최대 1 watt, very low power system은 최대 0.5 watt까지 사용할 수 있다.

미국에서 unlicensed spread spectrum 용도로 지정된 microwave band는 다음과 같다.

| Band | 특징 |
|---|---|
| 902-928 MHz, 915-MHz band | cordless telephone, wireless microphone, amateur radio 등 주변 device가 많아 interference 가능성이 크다. |
| 2.4-2.4835 GHz, 2.4-GHz band | Europe/Japan에서도 유사하게 사용되어 국제적 활용성이 높다. Microwave oven interference가 있을 수 있다. |
| 5.725-5.825 GHz, 5.8-GHz band | potential bandwidth가 더 크고 경쟁 device가 적지만, 일반적으로 equipment cost가 높다. |

Frequency가 높을수록 potential bandwidth는 커지는 경향이 있지만 equipment cost와 propagation 특성, interference 환경도 함께 고려해야 한다.

### 17.3 IEEE 802.11 Architecture and Services

IEEE 802.11은 wireless LAN을 위해 MAC protocol과 physical medium specification을 정의하려고 만들어졌다. 이후 WLAN 요구가 다양한 frequency와 data rate로 확장되면서 802.11a/b/g/e/i/r/s 같은 여러 amendment가 붙었다. 암기할 표준 목록보다 중요한 것은 802.11이 wired IEEE 802 LAN과 compatibility를 유지하면서 wireless mobility를 어떻게 모델링하는가이다.

#### 핵심 용어

| Term | 의미 |
|---|---|
| `Station (STA)` | IEEE 802.11 conformant MAC과 physical layer를 가진 device |
| `Access Point (AP)` | station 기능을 가지면서, associated stations에게 wireless medium을 통해 distribution system 접근을 제공하는 entity |
| `Basic Service Set (BSS)` | 하나의 coordination function이 제어하는 stations 집합 |
| `Coordination Function` | BSS 안 station이 언제 transmit하고 PDU를 receive할 수 있는지 결정하는 logical function |
| `Distribution System (DS)` | 여러 BSS와 integrated LAN을 interconnect해 ESS를 만드는 system |
| `Extended Service Set (ESS)` | 하나 이상의 interconnected BSS와 integrated LAN이 LLC layer에는 single BSS처럼 보이는 집합 |
| `MSDU` | MAC user가 MAC layer로 넘기는 MAC service data unit, 보통 LLC PDU |
| `MPDU` | physical layer service를 이용해 peer MAC entity 사이에서 교환되는 MAC protocol data unit |

#### IEEE 802.11 Architecture

![Figure 17.4](@/assets/images/data-communication-227-figure-17-4-page-552.png)
*Figure 17.4 · PDF p. 552 · BSS, AP, distribution system, portal로 구성된 IEEE 802.11 architecture*

802.11 architecture의 가장 작은 building block은 `BSS (Basic Service Set)`이다. BSS는 같은 MAC protocol을 실행하고 같은 shared wireless medium 접근을 경쟁하는 station들의 집합이다. BSS는 isolated될 수도 있고, `AP (Access Point)`를 통해 backbone `DS (Distribution System)`에 연결될 수도 있다.

AP는 bridge와 relay point처럼 동작한다. Infrastructure BSS에서 client stations는 서로 직접 frame을 주고받지 않는다. 같은 BSS 안의 station끼리 통신하더라도 MAC frame은 먼저 source station에서 AP로 가고, AP가 destination station으로 relay한다. Remote station으로 가는 frame도 local station에서 AP로 가고, AP가 DS를 통해 target 쪽으로 넘긴다.

`IBSS (Independent BSS)`는 AP 없이 mobile stations만으로 구성된 BSS이며, 보통 ad hoc network다. IBSS에서는 station들이 직접 communicate하고 AP가 관여하지 않는다.

`ESS (Extended Service Set)`는 둘 이상의 BSS가 DS로 연결된 구조다. DS는 보통 wired backbone LAN이지만, standard 관점에서는 switch, wired network, wireless network 등 어떤 communication network도 될 수 있다. ESS는 LLC layer에는 하나의 logical LAN처럼 보인다. 이 점이 wired IEEE 802 LAN과의 상위 계층 호환성을 만든다.

`portal`은 802.11 architecture를 traditional wired IEEE 802.x LAN과 통합하기 위한 logic이다. 보통 bridge/router 같은 wired LAN 장비에 구현되며, DS에 붙어 integration service를 제공한다.

#### IEEE 802.11 Services

IEEE 802.11은 wired LAN이 자연스럽게 제공하는 기능을 wireless LAN에서도 제공하기 위해 9개 service를 정의한다.

| Service | Provider | Used to support | 핵심 의미 |
|---|---|---|---|
| `Association` | DS | MSDU delivery | station과 AP 사이 초기 association 설정 |
| `Reassociation` | DS | MSDU delivery | 이동 중 association을 한 AP에서 다른 AP로 이전 |
| `Disassociation` | DS | MSDU delivery | station 또는 AP가 association 종료를 알림 |
| `Distribution` | DS | MSDU delivery | BSS 간 frame delivery를 위해 DS를 통해 message를 전달 |
| `Integration` | DS | MSDU delivery | 802.11 LAN과 wired IEEE 802.x LAN 사이 address translation/media conversion |
| `MSDU delivery` | Station | MSDU delivery | MAC user data block을 station 사이 전달 |
| `Authentication` | Station | LAN access and security | station identity 확인 |
| `Deauthentication` | Station | LAN access and security | authentication 관계 종료 |
| `Privacy` | Station | LAN access and security | wireless medium에서 eavesdropping을 줄이기 위한 보호 |

서비스는 두 방식으로 분류된다. 첫째, service provider가 station인지 DS인지에 따라 station service와 distribution service로 나뉜다. Station service는 AP를 포함한 모든 802.11 station에 구현되고, distribution service는 BSS 사이에서 제공된다. 둘째, 목적에 따라 LAN access/security를 제어하는 세 service와 MSDU delivery를 지원하는 여섯 service로 나뉜다.

#### Distribution, Integration, Association의 흐름

`distribution` service는 frame이 DS를 지나야 할 때 핵심이다. 예를 들어 Figure 17.4에서 STA2가 STA7에게 frame을 보낸다면, frame은 STA2에서 자기 BSS의 AP인 STA1로 가고, AP는 DS에 frame을 넘긴다. DS는 target BSS의 AP인 STA5 쪽으로 frame을 보내고, STA5가 STA7에게 forward한다. DS 내부에서 frame을 어떻게 운반하는지는 IEEE 802.11 scope 밖이다.

`integration` service는 802.11 station과 wired IEEE 802.x LAN station 사이 data transfer를 가능하게 한다. 여기에는 address translation과 media conversion logic이 들어갈 수 있다.

Association-related services는 mobility 때문에 필요하다. Distribution service가 destination station에게 frame을 전달하려면 DS는 destination station이 어느 AP 뒤에 있는지 알아야 한다. 이를 위해 station은 현재 BSS의 AP와 association을 유지한다.

| Mobility transition | 의미 | 영향 |
|---|---|---|
| `No transition` | station이 stationary이거나 single BSS direct communication range 안에서만 움직임 | AP 위치 정보가 크게 변하지 않는다. |
| `BSS transition` | 같은 ESS 안에서 한 BSS에서 다른 BSS로 이동 | DS가 station의 새 AP location을 알아야 frame delivery가 가능하다. |
| `ESS transition` | 한 ESS의 BSS에서 다른 ESS의 BSS로 이동 | 이동 자체는 가능하지만 upper-layer connection 유지가 보장되지 않고 service disruption 가능성이 크다. |

`association`은 station과 AP 사이 initial association을 설정한다. `reassociation`은 mobile station이 한 BSS에서 다른 BSS로 이동할 때 association을 새 AP로 옮긴다. `disassociation`은 station 또는 AP가 association 종료를 알리는 notification이다. Station이 notification 없이 사라질 수 있으므로 MAC management facility는 이런 경우도 견딜 수 있어야 한다.

### 17.4 IEEE 802.11 Medium Access Control

IEEE 802.11 MAC layer는 세 영역을 다룬다. `reliable data delivery`, `access control`, `security`이다. 이 절은 앞의 두 가지를 설명하고, security는 17.6에서 따로 다룬다.

#### Reliable Data Delivery

Wireless LAN은 noise, interference, propagation effect 때문에 frame loss가 유선보다 흔하다. Higher layer인 TCP도 reliability를 제공하지만, TCP retransmission timer는 보통 seconds 단위라 wireless link의 짧은 error를 처리하기에는 느리다. 그래서 802.11은 MAC level에서 frame exchange protocol을 둔다.

기본 data transfer는 2-frame exchange다.

```text
source station -> data frame -> destination station
source station <- ACK        <- destination station
```

Destination이 data frame을 받으면 `ACK` frame을 source에게 보낸다. Source가 짧은 시간 안에 ACK를 받지 못하면 data frame 또는 ACK가 손상된 것으로 보고 retransmit한다. 이 data/ACK exchange는 다른 station의 transmission이 끼어들지 않는 atomic unit처럼 취급된다.

더 높은 reliability를 위해 optional 4-frame exchange를 사용할 수 있다.

```text
source      -> RTS  -> destination
source      <- CTS  <- destination
source      -> DATA -> destination
source      <- ACK  <- destination
```

`RTS (Request to Send)`는 source 근처 station들에게 exchange가 시작됨을 알려 transmission을 미루게 한다. `CTS (Clear to Send)`는 destination 근처 station들에게도 같은 효과를 준다. 이 방식은 source 쪽에서 들리는 station과 destination 쪽에서 들리는 station이 다를 수 있는 wireless 환경의 collision 위험을 줄인다. RTS/CTS 기능은 MAC에 required function이지만 disable될 수 있다.

#### DCF와 PCF

802.11 working group은 distributed access와 centralized access를 모두 고려했다. Distributed access는 Ethernet처럼 node들이 carrier sense로 스스로 transmit 여부를 결정하므로 ad hoc network나 bursty traffic에 적합하다. Centralized access는 base station/AP가 transmission을 조정하므로 time-sensitive 또는 high-priority traffic에 유리하다.

최종 MAC algorithm은 `DFWMAC (Distributed Foundation Wireless MAC)`이며, distributed access control 위에 optional centralized control을 얹는 구조다.

![Figure 17.5](@/assets/images/data-communication-228-figure-17-5-page-556.png)
*Figure 17.5 · PDF p. 556 · DCF 위에 PCF가 놓이는 IEEE 802.11 protocol architecture*

| Sublayer | 의미 | 제공 service |
|---|---|---|
| `DCF (Distributed Coordination Function)` | contention algorithm을 사용해 모든 traffic에 access 제공 | ordinary asynchronous traffic |
| `PCF (Point Coordination Function)` | DCF 위에 구현되는 centralized polling 방식 | contention-free service, time-sensitive/high-priority traffic |

#### 왜 CSMA/CD가 아니라 CSMA/CA인가

DCF는 간단한 `CSMA (carrier sense multiple access)` algorithm을 사용한다. Station은 transmit할 MAC frame이 있으면 medium을 listen하고, idle이면 transmit하며, busy이면 현재 transmission이 끝날 때까지 기다린다.

하지만 DCF는 `CSMA/CD`가 아니다. Wireless network에서는 collision detection이 실용적이지 않다. Transmitting station 입장에서는 자기 transmit signal이 매우 강하고, 다른 station의 incoming weak signal은 noise나 자기 transmission effect와 구별하기 어렵다. 따라서 802.11은 collision을 “detect”하기보다 IFS, random backoff, ACK, RTS/CTS로 collision을 “avoid/recover”하는 `CSMA/CA` 성격을 갖는다.

![Figure 17.6](@/assets/images/data-communication-229-figure-17-6-page-557.png)
*Figure 17.6 · PDF p. 557 · DCF에서 medium idle 확인, IFS 대기, exponential backoff 후 frame을 전송하는 흐름*

DCF access 흐름은 다음과 같다.

| Step | 동작 |
|---|---|
| 1 | transmit할 frame이 있으면 medium을 sense한다. Medium이 idle이면 `IFS` 동안 계속 idle인지 확인한 뒤 transmit한다. |
| 2 | medium이 busy이면 current transmission이 끝날 때까지 defer하고 계속 monitor한다. |
| 3 | current transmission이 끝나면 다시 IFS를 기다린다. 여전히 idle이면 random backoff를 수행한 뒤 transmit한다. Backoff 중 medium이 busy가 되면 timer를 멈추고, 다시 idle이 되면 재개한다. |
| 4 | ACK가 없으면 unsuccessful transmission으로 보고 collision이 있었다고 가정한다. |

802.11도 Chapter 16의 `binary exponential backoff`를 사용한다. Repeated failed attempts가 길어진 backoff를 만들고, heavy load에서 collision 반복을 완화한다.

#### IFS Priority: SIFS, PIFS, DIFS

DCF는 세 가지 `IFS (Interframe Space)` 값을 사용해 priority를 만든다.

![Figure 17.7](@/assets/images/data-communication-230-figure-17-7-page-558.png)
*Figure 17.7 · PDF p. 558 · SIFS/PIFS/DIFS와 PCF superframe timing*

| IFS | 길이/우선순위 | 사용 |
|---|---|---|
| `SIFS (Short IFS)` | 가장 짧음, 최고 priority | ACK, CTS, poll response 같은 immediate response |
| `PIFS (PCF IFS)` | 중간 | PCF의 point coordinator가 poll을 발행할 때 |
| `DIFS (DCF IFS)` | 가장 김 | ordinary asynchronous traffic의 minimum delay |

SIFS가 가장 짧기 때문에 ACK/CTS 같은 즉시 응답은 일반 contention traffic보다 먼저 medium을 얻는다. 예를 들어 unicast frame을 받은 station은 SIFS 후 ACK를 보낸다. Fragmented LLC PDU를 보낼 때도 source는 ACK를 받은 뒤 SIFS 후 다음 fragment를 이어 보낼 수 있어, 한 번 channel contention에서 이긴 station이 fragment sequence를 효율적으로 끝낼 수 있다.

`PCF`는 DCF 위에 있는 optional access method다. Point coordinator가 PIFS를 사용해 poll을 발행하므로, DIFS를 기다리는 asynchronous traffic보다 먼저 medium을 잡을 수 있다. 하지만 PCF가 계속 poll만 하면 asynchronous traffic이 굶을 수 있으므로 `superframe`이 정의된다. Superframe의 앞부분은 contention-free period로 PCF poll이 사용하고, 나머지는 contention period로 DCF traffic이 사용한다. Medium이 superframe 경계에서 busy이면 다음 superframe은 foreshortened될 수 있다.

#### IEEE 802.11 MAC Frame Format

![Figure 17.8](@/assets/images/data-communication-231-figure-17-8-page-560.png)
*Figure 17.8 · PDF p. 560 · IEEE 802.11 MAC frame field 구성*

802.11 MAC frame format은 data/control frame에 공통으로 쓰이지만, 모든 context에서 모든 field가 쓰이는 것은 아니다.

| Field | 의미 |
|---|---|
| `Frame Control (FC)` | frame type(control/management/data), DS 방향, fragmentation, privacy 등 control information |
| `Duration/Connection ID` | channel이 successful MAC frame transmission을 위해 할당될 microsecond time, 또는 일부 control frame의 association/connection identifier |
| `Address fields` | transmitter/receiver MAC address, SSID, ultimate source/destination address 등 context에 따라 의미가 달라지는 48-bit address fields |
| `Sequence Control (SC)` | 4-bit fragment number와 12-bit sequence number. fragmentation/reassembly와 frame numbering에 사용 |
| `Frame Body` | MSDU 또는 MSDU fragment. LLC PDU나 MAC control information을 담는다. |
| `Frame Check Sequence (FCS/CRC)` | 32-bit CRC |

802.11 frame의 address field가 복잡한 이유는 wireless hop의 transmitter/receiver와 ultimate source/destination이 다를 수 있기 때문이다. AP를 거치는 infrastructure BSS에서는 wireless medium에서 frame을 보내는 station과 최종 source/destination이 반드시 같지 않다.

#### MAC Frame Types

802.11 MAC frame은 크게 control, data, management frame으로 나뉜다.

| Frame type | 역할 | 예 |
|---|---|---|
| `Control frame` | data frame의 reliable delivery와 medium reservation 보조 | `RTS`, `CTS`, `ACK`, `PS-Poll`, `CF-End`, `CF-End + CF-Ack` |
| `Data frame` | upper-level data 운반 또는 contention-free period의 ACK/Poll 조합 | `Data`, `Data + CF-Ack`, `Data + CF-Poll`, `Data + CF-Ack + CF-Poll`, `Null Function` |
| `Management frame` | station과 AP 사이 communication 관리 | association request/response, reassociation, disassociation, authentication |

`PS-Poll`은 power-saving mode 동안 AP가 buffer해 둔 frame을 요청하는 control frame이다. `Null Function` data frame은 user data를 실지로 운반하지 않고, station이 low-power state로 들어감을 AP에 알리는 power management bit 운반에 쓰인다. 이 둘은 wireless LAN에서 battery power consumption 요구가 MAC frame type에 직접 반영된 예다.

### 17.5 IEEE 802.11 Physical Layer

IEEE 802.11 physical layer는 여러 단계로 확장되었다. Original IEEE 802.11은 1 Mbps와 2 Mbps에서 동작하는 세 가지 physical layer를 포함했다. 두 개는 2.4-GHz ISM band의 spread spectrum 방식이고, 하나는 infrared 방식이다. 이후 IEEE 802.11a는 5-GHz band에서 최대 54 Mbps, IEEE 802.11b는 2.4-GHz band에서 5.5/11 Mbps, IEEE 802.11g는 2.4-GHz band에서 최대 54 Mbps를 제공한다.

#### Original IEEE 802.11 Physical Layer

Original 802.11의 세 physical media는 다음과 같다.

| PHY | Band/rate | 핵심 방식 |
|---|---|---|
| `DSSS (Direct Sequence Spread Spectrum)` | 2.4-GHz ISM, 1/2 Mbps | chipping code로 bandwidth를 확산한다. 1 Mbps는 DBPSK, 2 Mbps는 DQPSK를 사용한다. |
| `FHSS (Frequency-Hopping Spread Spectrum)` | 2.4-GHz ISM, 1/2 Mbps | pseudonoise sequence에 따라 1-MHz channel 사이를 hopping한다. |
| `Infrared` | 850-950 nm, 1/2 Mbps | omnidirectional IR, 1 Mbps는 16-PPM, 2 Mbps는 4-PPM 성격의 pulse position modulation 사용 |

`DSSS`에서는 Chapter 9의 spread spectrum 개념처럼 chipping code 또는 pseudonoise sequence가 data rate와 signal bandwidth를 확산한다. IEEE 802.11 DSSS는 `11-chip Barker sequence`를 사용한다. Binary 1은 `+ - + + - + + + - - -` sequence로, binary 0은 그 반대 sequence로 mapping된다. Barker sequence의 중요한 성질은 interference에 robust하고 multipath propagation에 덜 민감하다는 점이다.

`FHSS`는 signal이 여러 channel을 pseudonoise sequence에 따라 옮겨 다니는 방식이다. IEEE 802.11에서는 1-MHz channel을 사용한다. 1 Mbps는 two-level Gaussian FSK, 2 Mbps는 four-level GFSK를 사용한다.

Infrared PHY는 point-to-point가 아니라 omnidirectional이다. 최대 약 20 m range를 지원할 수 있다. `PPM (pulse position modulation)`에서는 input value가 clocking time 대비 narrow pulse의 위치를 결정한다. PPM의 장점은 IR source의 required output power를 줄일 수 있다는 점이다.

#### IEEE 802.11a

IEEE 802.11a는 5-GHz band의 `UNNI` 대역을 사용한다. UNNI-1은 indoor, UNNI-2는 indoor/outdoor, UNNI-3는 outdoor 용도로 설명된다. 802.11a는 802.11b/g에 비해 더 많은 available bandwidth를 사용하고, 5-GHz의 비교적 덜 혼잡한 spectrum을 쓴다.

802.11a는 2.4-GHz 계열과 달리 spread spectrum이 아니라 `OFDM (Orthogonal Frequency Division Multiplexing)`을 사용한다. OFDM은 여러 subcarrier frequency에 bits를 나누어 싣는다. FDM과 비슷해 보이지만, OFDM의 subchannels는 한 data source에 전용된다. 802.11a는 최대 48 subcarriers를 쓰고, BPSK, QPSK, 16-QAM, 64-QAM과 convolutional coding rate 1/2, 2/3, 3/4 조합으로 data rate를 결정한다.

![Figure 17.9](@/assets/images/data-communication-232-figure-17-9-page-565.png)
*Figure 17.9 · PDF p. 565 · IEEE 802.11a와 802.11b physical-level PDU 구조 비교*

Figure 17.9a의 802.11a physical PDU는 `PLCP Preamble`, `Signal`, `Data`로 볼 수 있다. Preamble은 receiver가 OFDM signal을 acquire하고 demodulator를 synchronize하게 한다. Signal field는 data field rate와 MAC PDU length 같은 정보를 담고, BPSK 6 Mbps로 전송된다. Data field는 Signal field가 지정한 data rate로 전송되며, 내부에 Service, MAC PDU, Tail, Pad를 포함한다. Data bits는 transmission 전에 scrambling된다.

#### IEEE 802.11b

IEEE 802.11b는 original DSSS scheme의 확장으로, ISM band에서 5.5 Mbps와 11 Mbps를 제공한다. Chipping rate는 original DSSS와 같은 11 MHz이므로 occupied bandwidth는 유지된다. 같은 bandwidth와 chipping rate에서 더 높은 data rate를 얻기 위해 `CCK (Complementary Code Keying)`를 사용한다.

![Figure 17.10](@/assets/images/data-communication-233-figure-17-10-page-566.png)
*Figure 17.10 · PDF p. 566 · 11-Mbps CCK modulation에서 8-bit input block을 code selection과 differential modulation으로 보내는 흐름*

Figure 17.10은 11-Mbps CCK의 개략 흐름이다. Input data는 8-bit block 단위로 처리되고, 1.375 MHz symbol rate에서 `8 bits/symbol × 1.375 MHz = 11 Mbps`가 된다. 이 중 6 bits는 Walsh matrix에서 유도된 64 complex code 중 하나를 선택하고, 추가 2 bits와 함께 QPSK 계열 modulation 입력을 만든다.

802.11b physical-layer frame은 long preamble과 short preamble 두 format을 정의한다. Long preamble은 legacy DSSS와 interoperability를 제공하고, short preamble은 throughput efficiency를 높인다. Figure 17.9b는 short preamble 구조를 보여준다. `PLCP Preamble`은 56-bit Sync와 16-bit SFD로 구성되고, 1 Mbps DBPSK/Barker spreading으로 전송된다. `PLCP Header`는 Signal, Service, Length, CRC로 구성되고 2 Mbps DQPSK로 전송된다.

#### IEEE 802.11g

IEEE 802.11g는 802.11b를 20 Mbps 이상, 최대 54 Mbps까지 확장한다. 802.11b처럼 2.4-GHz range에서 동작하므로 compatibility가 중요하다. 802.11b device는 802.11g AP에 붙을 수 있고, 802.11g device도 802.11b AP에 붙을 수 있다. 이때 lower 802.11b data rate를 사용한다.

802.11g는 1, 2, 5.5, 11 Mbps에서는 802.11/802.11b와 같은 modulation/framing scheme을 사용해 compatibility를 제공한다. 6, 9, 12, 18, 24, 36, 48, 54 Mbps에서는 802.11a의 OFDM scheme을 2.4-GHz에 맞게 적용한 `ERP-OFDM`을 사용한다. 또한 `ERP-PBCC`는 22 Mbps와 33 Mbps를 제공한다.

#### PHY 비교 감각

| Standard | Band | Main PHY idea | Data rate 감각 | Compatibility |
|---|---|---|---|---|
| `IEEE 802.11` | 2.4 GHz 또는 IR | DSSS, FHSS, infrared | 1/2 Mbps | baseline |
| `IEEE 802.11a` | 5 GHz | OFDM | 6-54 Mbps | Wi-Fi5 |
| `IEEE 802.11b` | 2.4 GHz | DSSS + CCK | 1/2/5.5/11 Mbps | Wi-Fi |
| `IEEE 802.11g` | 2.4 GHz | DSSS/CCK compatibility + OFDM extension | 1-54 Mbps | 802.11b와 하위 호환 |

IEEE 802.11 standard 자체는 speed-versus-distance objective를 고정하지 않는다. 실제 도달 거리와 data rate는 office layout, walls, interference, antenna, vendor implementation에 따라 달라진다. 원문 Table 17.5는 일반 office 환경에서 data rate가 올라갈수록 estimated distance가 줄어드는 경향을 보여준다.

### 17.6 IEEE 802.11 Security Considerations

유선 LAN에서는 물리적으로 케이블에 접속해야 프레임을 주고받을 수 있으므로, 어느 정도의 인증(authentication)과 프라이버시(privacy)가 물리 접근 통제에 기대어 성립한다. 그러나 wireless LAN은 전파 범위 안에 있는 장치가 매체를 수신할 수 있고, 경우에 따라 송신도 시도할 수 있다. 그래서 IEEE 802.11에서는 LAN 서비스와 별개로 보안 서비스를 명시한다.

| 관점 | 유선 LAN의 기본 가정 | wireless LAN에서 깨지는 지점 |
|---|---|---|
| 접근 제어 | 물리 케이블, 포트, 건물 접근이 일차 방어선 | 전파 범위 안의 장치가 매체를 관찰하거나 접속을 시도할 수 있음 |
| 인증 | 포트에 연결된 장치를 내부 장치로 간주하기 쉬움 | AP와 station이 서로 정당한 주체인지 별도 확인이 필요 |
| 프라이버시 | 케이블 신호를 직접 탭해야 하므로 공격 난도가 상대적으로 높음 | 무선 신호는 공간으로 퍼지므로 암호화 없이는 수신 가능성이 커짐 |

IEEE 802.11 보안 고려사항에서 핵심 서비스는 다음 세 가지다.

| 서비스 | 의미 | 동작상 위치 |
|---|---|---|
| `Authentication` | 통신 주체의 identity를 확인하는 서비스. station이 AP와 association하기 전에 성공해야 한다. | association 전에 수행되는 접근 허가의 전제 조건 |
| `Deauthentication` | 기존 authentication 관계를 종료하는 서비스 | station 또는 AP가 인증 상태를 끊을 때 사용 |
| `Privacy` | 의도하지 않은 수신자가 데이터를 읽지 못하도록 암호화하는 선택 서비스 | wireless medium의 개방성을 보완 |

초기 IEEE 802.11의 보안 메커니즘은 `WEP`(Wired Equivalent Privacy)를 중심으로 했지만, 이름과 달리 유선 LAN 수준의 안전성을 충분히 제공하지 못했다. 원문은 이 장에서 세부 공격 방식을 길게 다루기보다, 원래 802.11 보안 기능이 여러 중요한 약점을 가졌고 이후 보완 표준이 필요했다는 흐름을 강조한다. 이 보완 흐름이 `IEEE 802.11i`이며, Wi-Fi Alliance는 802.11i 표준화가 완료되기 전 당시의 802.11i 초안을 기반으로 `WPA`(Wi-Fi Protected Access)를 도입했다. 책의 상세 보안 논의는 이후 Chapter 21에서 이어진다.

정리하면 Chapter 17의 보안 관점은 “무선은 공유 매체이므로 매체 접근 제어(MAC)만으로 충분하지 않다”는 데 있다. `DCF`, `PCF`, `RTS/CTS`, `ACK`는 충돌 회피와 신뢰성에 초점이 있고, `Authentication`, `Privacy`, `802.11i`, `WPA`는 누가 접속할 수 있고 누가 내용을 읽을 수 있는가를 다룬다.

## 연결 관계

| 연결 대상 | 이 장과의 관계 |
|---|---|
| Chapter 9 `Spread Spectrum` | IEEE 802.11의 `DSSS`, `FHSS`, `ISM band`, interference 내성 이해에 직접 연결된다. |
| Chapter 15 `Local Area Network Overview` | LAN의 MAC, bridge, shared medium 개념이 wireless LAN의 AP, BSS, DS, ESS 구조로 확장된다. |
| Chapter 16 `High-Speed LANs` | IEEE 802 계열의 frame, medium access, physical layer 확장 흐름 위에 802.11 PHY/MAC가 놓인다. |
| Chapter 21 보안 | `WEP`, `WPA`, `IEEE 802.11i`의 상세 보안 메커니즘과 취약점 논의가 이어진다. |

## 오해하기 쉬운 내용

| 오해 | 바로잡기 |
|---|---|
| wireless LAN은 단순히 Ethernet cable을 없앤 것이다 | 응용 목표는 LAN extension일 수 있지만, hidden terminal, unreliable wireless link, mobility, power management 때문에 MAC/PHY 설계가 달라진다. |
| AP는 항상 portal이다 | `AP`는 BSS 내부 station을 DS에 연결하는 장치이고, `portal`은 802.11 LAN과 non-802.11 LAN 사이의 논리적 통합 지점이다. 같은 장비에 함께 구현될 수는 있지만 개념은 다르다. |
| DS는 반드시 무선망이다 | `Distribution System`은 802.11 표준이 추상적으로 정의한 backbone 역할이며, 실제 구현은 유선 LAN일 수도 있고 다른 방식일 수도 있다. |
| IEEE 802.11은 CSMA/CD를 쓴다 | 무선에서는 송신 중 충돌 검출이 어렵고 hidden station 문제가 있으므로 `CSMA/CD`가 아니라 collision avoidance 계열의 `DCF`가 중심이다. |
| RTS/CTS는 모든 전송에서 필수다 | `RTS/CTS`는 hidden terminal 완화와 긴 프레임 보호에 유용하지만 오버헤드가 있어 항상 쓰는 것은 아니다. |
| 802.11b/g는 같은 2.4 GHz이므로 성능 차이가 작다 | 같은 대역을 쓰더라도 `CCK`, `OFDM`, backward compatibility, protection mechanism 때문에 실제 동작과 효율이 크게 달라진다. |
| WEP는 이름 그대로 유선 수준 보안이다 | 초기 802.11 보안은 여러 취약점 때문에 `IEEE 802.11i`, `WPA` 같은 보완이 필요했다. |

## 면접 질문

1. `BSS`, `IBSS`, `ESS`, `DS`, `AP`, `portal`을 구분해서 설명하라.
2. wireless LAN에서 `CSMA/CD`가 적합하지 않은 이유와 `DCF`가 충돌을 줄이는 방식을 설명하라.
3. `RTS/CTS/DATA/ACK` 네 프레임 교환이 hidden terminal 문제를 어떻게 완화하는가?
4. `SIFS`, `PIFS`, `DIFS`의 우선순위가 IEEE 802.11 MAC에서 어떤 의미를 갖는가?
5. `Association`, `Reassociation`, `Disassociation`의 차이와 mobility 지원 관계를 설명하라.
6. `DSSS`, `FHSS`, `OFDM`, `CCK`가 각각 어떤 PHY 계열에서 중요하게 등장하는가?
7. `WEP`의 한계 때문에 `IEEE 802.11i`와 `WPA`가 필요해진 배경을 설명하라.

## 핵심 용어 정리

| 용어 | 의미 |
|---|---|
| `wireless LAN` | 제한된 영역에서 무선 매체로 LAN 서비스를 제공하는 네트워크 |
| `LAN extension` | 기존 wired LAN의 범위를 무선으로 확장하는 응용 |
| `cross-building interconnect` | 건물 사이 LAN을 point-to-point wireless link로 연결하는 응용 |
| `nomadic access` | 이동 사용자가 특정 위치에서 임시로 LAN/Internet에 접속하는 방식 |
| `ad hoc networking` | infrastructure 없이 peer station들이 직접 형성하는 임시 네트워크 |
| `infrared LAN` | infrared light를 이용하는 무선 LAN 기술 |
| `spread spectrum LAN` | 넓은 대역에 신호를 확산해 간섭과 도청에 상대적으로 강한 무선 LAN |
| `narrowband microwave LAN` | 좁은 microwave 대역을 사용하는 무선 LAN 방식 |
| `STA` | IEEE 802.11 MAC/PHY를 구현한 station |
| `AP` | wireless station과 distribution system 사이 접속점을 제공하는 access point |
| `BSS` | 하나의 coordination function 아래에서 통신하는 station 집합 |
| `IBSS` | AP 없이 station들이 직접 구성하는 independent BSS |
| `ESS` | 여러 BSS가 DS로 연결되어 하나의 논리 LAN처럼 보이는 구조 |
| `DS` | BSS들 사이에서 MSDU 전달을 지원하는 distribution system |
| `portal` | IEEE 802.11 LAN과 non-802.11 LAN 사이의 논리적 통합 지점 |
| `MSDU` | MAC service data unit, MAC 서비스 경계에서 전달되는 데이터 단위 |
| `MPDU` | MAC protocol data unit, 802.11 MAC 계층에서 실제 전송되는 프로토콜 데이터 단위 |
| `Association` | station이 특정 AP와 연결되어 DS 서비스를 이용할 수 있게 되는 절차 |
| `Reassociation` | 이동 등으로 AP 연결을 갱신하는 절차 |
| `Disassociation` | 기존 association 관계를 종료하는 절차 |
| `Authentication` | station과 AP 등 통신 주체의 identity를 확인하는 서비스 |
| `Deauthentication` | 인증 관계를 종료하는 서비스 |
| `Privacy` | 무선 프레임 내용을 의도하지 않은 수신자로부터 보호하는 서비스 |
| `DCF` | Distributed Coordination Function, contention 기반 IEEE 802.11 MAC 방식 |
| `PCF` | Point Coordination Function, polling 기반 contention-free MAC 방식 |
| `DFWMAC` | DCF와 PCF를 함께 포괄하는 Distributed Foundation Wireless MAC |
| `CSMA/CA` | carrier sensing과 backoff로 충돌 가능성을 줄이는 collision avoidance 방식 |
| `RTS` | Request to Send, 송신 예약을 요청하는 제어 프레임 |
| `CTS` | Clear to Send, 수신 측이 송신 가능을 알리는 제어 프레임 |
| `ACK` | 수신 성공을 알리는 acknowledgment 프레임 |
| `SIFS` | Short Interframe Space, ACK/CTS 등 즉시 응답에 쓰이는 가장 짧은 간격 |
| `PIFS` | PCF가 contention-free 접근을 얻기 위해 사용하는 간격 |
| `DIFS` | DCF contention station이 매체 유휴를 확인할 때 사용하는 간격 |
| `NAV` | Network Allocation Vector, 다른 전송의 예상 점유 시간을 기반으로 한 virtual carrier sensing 값 |
| `DSSS` | Direct-Sequence Spread Spectrum |
| `FHSS` | Frequency-Hopping Spread Spectrum |
| `Barker sequence` | 802.11 DSSS에서 1/2 Mbps 전송에 사용되는 11-chip 확산 sequence |
| `Infrared PHY` | 850-950 nm infrared 신호를 이용하는 802.11 물리 계층 |
| `PPM` | Pulse Position Modulation, pulse 위치로 값을 표현하는 변조 방식 |
| `OFDM` | Orthogonal Frequency Division Multiplexing, 802.11a/g 고속 PHY의 핵심 방식 |
| `UNNI` | Unlicensed National Information Infrastructure, 802.11a가 사용하는 5 GHz 대역 |
| `PLCP` | Physical Layer Convergence Protocol, MAC과 PMD 사이를 맞추는 PHY 하위 계층 |
| `PMD` | Physical Medium Dependent, 실제 매체 의존 송수신 기능 |
| `CCK` | Complementary Code Keying, 802.11b의 5.5/11 Mbps 전송에 쓰이는 변조 방식 |
| `ERP-OFDM` | 802.11g의 Extended Rate PHY OFDM 방식 |
| `ERP-PBCC` | 802.11g에서 선택적으로 정의된 PBCC 기반 확장 방식 |
| `WEP` | Wired Equivalent Privacy, 초기 IEEE 802.11 보안 방식 |
| `WPA` | Wi-Fi Protected Access, 802.11i 기반 보안 개선을 조기 도입한 Wi-Fi Alliance 규격 |
| `IEEE 802.11i` | 802.11 보안을 강화하기 위해 정의된 표준 확장 |
