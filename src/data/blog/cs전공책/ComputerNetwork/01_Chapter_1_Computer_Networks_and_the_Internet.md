---
title: "Chapter 1. Computer Networks and the Internet"
order: 1
pubDatetime: 2026-05-17T00:00:00+09:00
modDatetime: 2026-05-17T00:00:00+09:00
description: "Computer Networking Top-Down 정리: Chapter 1. Computer Networks and the Internet"
tags:
  - "ComputerNetwork"
  - "CS"
  - "TopDown"
---

## 개요

이 장은 Internet을 단일 장비나 단일 서비스가 아니라, 서로 다른 end system, communication link, packet switch, ISP, protocol, application이 맞물린 거대한 packet-switched network로 보는 관점을 세운다. 앞부분은 실제 구성요소를 보는 nuts-and-bolts 관점에서 시작하고, 뒤로 갈수록 delay, loss, throughput, protocol layering, security처럼 네트워크를 분석하는 추상 모델로 이동한다.

최종적으로 기억해야 할 축은 세 가지다. 첫째, Internet은 hosts/end systems가 packet을 주고받도록 packet switches와 communication links가 연결된 network of networks다. 둘째, Internet은 distributed applications가 데이터를 주고받게 해 주는 service infrastructure이며, application은 network core가 아니라 end system에서 실행된다. 셋째, 이 모든 통신은 protocol이 정한 message format, message order, event별 action에 의해 진행된다.

## 핵심 개념

### 1.1 What Is the Internet?

#### Internet의 nuts-and-bolts 관점

Internet은 전 세계의 computing devices를 연결하는 computer network다. 전통적인 desktop, workstation, server뿐 아니라 smartphone, tablet, game console, thermostat, car, traffic control system 같은 비전통적 장치도 Internet에 붙는다. 이 장치들은 네트워크 용어로 host 또는 end system이라고 부른다.

end system은 communication links와 packet switches의 네트워크를 통해 서로 연결된다. communication link는 coaxial cable, copper wire, optical fiber, radio spectrum 같은 physical media로 만들어지며, link가 데이터를 밀어 넣는 속도는 transmission rate, 즉 bits/second 단위로 표현된다. 송신 end system은 긴 데이터를 그대로 흘려보내지 않고 segment로 나눈 뒤 각 segment에 header bytes를 붙여 packet을 만든다. 수신 end system은 도착한 packet을 다시 원래 데이터로 재조립한다.

![Some pieces of the Internet](@/assets/images/cs-computer-network-001-figure-1-1-page-14.png)
*Figure 1.1 · PDF p. 14 · Internet을 이루는 host, server, router, link-layer switch, ISP, datacenter, access network의 큰 그림*

packet switch는 들어온 packet을 적절한 outgoing communication link로 넘기는 장치다. 대표적인 packet switch는 router와 link-layer switch다. link-layer switch는 주로 access network에서, router는 주로 network core에서 사용된다. packet이 송신 end system에서 수신 end system까지 지나가는 communication links와 packet switches의 순서를 route 또는 path라고 한다.

Internet에 접속하려면 end system은 Internet Service Provider(ISP)를 통해 network edge에서 core 쪽으로 들어간다. residential ISP, corporate ISP, university ISP, public WiFi ISP, cellular data ISP 등이 모두 access를 제공한다. ISP 자체도 packet switches와 communication links로 구성된 network이며, end system끼리 연결되려면 하위 ISP들이 national/international upper-tier ISP와 서로 interconnect되어야 한다. 그래서 Internet은 하나의 단일 네트워크라기보다 독립적으로 관리되는 ISP network들이 IP protocol과 naming/addressing convention을 공유하며 이어진 network of networks다.

이 구성요소들이 상호운용되려면 protocol과 standard가 필요하다. Internet의 핵심 protocol에는 Transmission Control Protocol(TCP)와 Internet Protocol(IP)이 있고, 둘을 묶어 TCP/IP라고 부른다. IP는 routers와 end systems 사이에서 오가는 packet의 형식을 규정한다. Internet standards는 주로 Internet Engineering Task Force(IETF)가 Request for Comments(RFCs) 문서로 정의하며, Ethernet이나 WiFi 같은 link 기술은 IEEE 802 같은 표준화 기구에서 다룬다.

#### Internet의 service 관점

Internet은 hardware/software 부품의 집합이기도 하지만, distributed applications에 서비스를 제공하는 infrastructure이기도 하다. e-mail, Web, messaging, map, music/video streaming, social media, video conference, multiplayer game, location-based recommendation 같은 application은 여러 end system의 program들이 데이터를 교환하면서 동작한다.

중요한 분리는 application은 end system에서 실행되고 packet switch는 application의 의미를 해석하지 않는다는 점이다. network core의 packet switch는 데이터의 source/sink가 어떤 application인지에 관심을 두기보다 packet을 목적지 쪽으로 전달하는 역할에 집중한다. 이 분리 덕분에 새로운 application을 만들 때 network core를 매번 바꾸지 않고 end system의 program과 protocol 사용 방식으로 기능을 확장할 수 있다.

application program이 Internet에게 데이터를 보내 달라고 요청하는 접점은 socket interface다. socket interface는 송신 program이 destination program으로 데이터를 보내기 위해 따라야 하는 규칙들의 집합이다. 우편 서비스를 사용할 때 봉투, 주소, 우표, 우체통 같은 interface 규칙을 따라야 하는 것처럼, Internet application도 socket interface를 통해 어떤 transport service를 사용할지 선택하고 데이터를 넘긴다. 이 내용은 Chapter 2의 application layer와 socket programming으로 이어진다.

#### protocol의 의미

protocol은 단순히 “규칙”이라는 말보다 더 구체적이다. network protocol은 둘 이상의 communicating entities가 교환하는 message의 format과 order, 그리고 message 송수신이나 timeout 같은 event가 발생했을 때 수행할 action을 정의한다.

![Human protocol and network protocol](@/assets/images/cs-computer-network-002-figure-1-2-page-18.png)
*Figure 1.2 · PDF p. 18 · 사람의 인사/응답 흐름과 TCP connection request, HTTP GET 흐름을 나란히 보여주는 protocol 예시*

사람 사이의 “Hi”와 응답, 질문, 답변도 protocol처럼 볼 수 있다. 정해진 message가 있고, 각 message를 받았을 때 다음 action이 정해져 있으며, 응답이 없으면 포기하거나 다른 행동을 한다. networking에서도 마찬가지다. 예를 들어 Web browser가 URL을 요청할 때 먼저 server에 connection request message를 보내고 reply를 기다린다. 연결이 가능하다는 reply를 받은 뒤 HTTP GET message로 원하는 Web page 이름을 보내면 server가 file을 반환한다.

protocol이 중요한 이유는 Internet의 거의 모든 활동이 protocol에 의해 지배되기 때문이다. 물리적으로 연결된 network interface card 사이의 bit 흐름, end system 사이의 congestion-control, router의 packet path 결정은 모두 protocol의 예다. 따라서 computer networking을 이해한다는 것은 protocol이 무엇을 하는지(what), 왜 그런 설계를 택했는지(why), 실제로 어떤 message/action 흐름으로 동작하는지(how)를 이해하는 것에 가깝다.

### 1.2 The Network Edge

network edge는 사용자가 직접 만나는 end systems, 즉 hosts가 있는 영역이다. host=end system이며, application programs를 실행한다는 뜻에서 host라고도 부른다. host는 client와 server로 나눠 부를 수 있다. client는 보통 desktop, laptop, smartphone처럼 사용자가 조작하는 장치이고, server는 Web page, video, e-mail, search result, mobile app content를 저장하고 제공하는 더 강한 장치다. 현대 Internet에서는 많은 server가 대규모 data center 안에 모여 있으며, data center 내부에도 수많은 hosts를 연결하는 별도의 computer network가 있다.

#### access network의 역할

access network는 end system을 path상의 첫 router, 즉 edge router에 물리적으로 연결하는 네트워크다. 사용자가 보는 “인터넷 접속”은 대부분 이 access network를 통해 network core로 들어가는 과정이다. 같은 Internet이라도 home, enterprise, mobile wide-area 환경에서 access 방식이 다르며, 이 차이는 transmission rate, 공유 여부, 거리, 이동성, 비용, 장애 특성을 바꾼다.

![Access networks](@/assets/images/cs-computer-network-004-figure-1-4-page-23.png)
*Figure 1.4 · PDF p. 23 · home, enterprise, mobile network가 first router/ISP 쪽으로 연결되는 access network 위치*

home access의 대표 방식은 DSL, cable, FTTH, 5G fixed wireless다. DSL(digital subscriber line)은 기존 telephone line을 사용한다. DSL modem은 digital data를 전화선 위의 high-frequency tone으로 바꾸고, central office(CO)의 DSLAM(digital subscriber line access multiplexer)이 여러 집의 analog signal을 다시 digital format으로 변환해 Internet으로 보낸다. 한 전화선에서 ordinary telephone, upstream data, downstream data를 서로 다른 frequency band로 나누므로 frequency-division multiplexing(FDM)의 직관적 예가 된다. downstream rate가 upstream보다 큰 asymmetric access인 경우가 많고, CO와 집 사이 거리와 전기적 간섭이 실제 rate를 제한한다.

cable Internet access는 cable TV infrastructure를 사용한다. fiber가 cable head end에서 neighborhood junction까지 가고, 마지막 구간은 coaxial cable이 집까지 이어지는 hybrid fiber coax(HFC) 구조가 흔하다. cable modem termination system(CMTS)은 여러 cable modem에서 온 analog signal을 digital signal로 바꾸며, DSL처럼 downstream/upstream channel이 나뉘고 보통 asymmetric하다.

![Hybrid fiber-coaxial access network](@/assets/images/cs-computer-network-006-figure-1-6-page-25.png)
*Figure 1.6 · PDF p. 25 · fiber node와 coaxial cable을 함께 쓰는 HFC 구조와 CMTS 위치*

cable access의 핵심 특징은 shared broadcast medium이라는 점이다. head end가 보낸 downstream packet은 여러 집 방향의 link로 흘러가고, 집에서 보낸 upstream packet은 shared upstream channel을 사용한다. 따라서 동시에 많은 사용자가 큰 video file을 받으면 각 사용자가 체감하는 rate는 aggregate downstream rate보다 낮아질 수 있다. 반대로 소수 사용자가 Web browsing처럼 bursty하게 요청하면 각 사용자가 순간적으로 높은 rate를 누릴 수도 있다. shared upstream에서는 collision을 피하기 위한 multiple access protocol이 필요하며, 이는 Chapter 6의 link layer로 이어진다.

FTTH(fiber to the home)는 optical fiber path를 집까지 제공해 gigabits per second 범위의 access rate를 가능하게 한다. direct fiber는 집마다 CO에서 전용 fiber가 나가는 단순한 구조이고, PON(passive optical network)은 neighborhood splitter에서 여러 집의 fiber를 하나의 shared optical fiber로 모아 OLT(optical line terminator)에 연결한다. 5G fixed wireless는 집까지 cable을 새로 깔지 않고 provider base station에서 집의 modem으로 beam-forming 기반 wireless link를 제공하는 방식이다.

enterprise와 campus에서는 LAN(local area network)이 end system을 edge router로 연결한다. Ethernet은 twisted-pair copper wire로 end system을 Ethernet switch에 연결하고, 그 switch 또는 switch network가 larger Internet으로 이어진다. WiFi(IEEE 802.11)는 wireless user가 access point를 통해 enterprise/home network에 붙는 방식이다. WiFi는 보통 수십 미터 범위의 local-area wireless access이고, cellular 3G/4G LTE/5G는 base station을 통해 수십 킬로미터 범위의 wide-area wireless access를 제공한다.

![Typical home network](@/assets/images/cs-computer-network-009-figure-1-9-page-29.png)
*Figure 1.9 · PDF p. 29 · broadband access, home router, wireless access point, wired/wireless devices가 결합된 home network*

#### physical media의 관점

physical medium은 bit가 transmitter-receiver pair 사이를 이동할 때 실제로 electromagnetic wave 또는 optical pulse가 지나가는 매체다. end-to-end path 전체가 하나의 매체로만 구성될 필요는 없다. 한 bit는 source host에서 router로, router에서 다음 router로, 마지막 router에서 destination host로 넘어가며 각 hop마다 다른 physical medium을 통과할 수 있다.

physical media는 guided media와 unguided media로 나뉜다. guided media는 twisted-pair copper wire, coaxial cable, optical fiber처럼 solid medium을 따라 wave를 유도한다. unguided media는 wireless LAN이나 satellite channel처럼 atmosphere 또는 outer space로 wave가 퍼진다. 실제 비용에서는 cable 재료 자체보다 설치 labor cost가 훨씬 클 수 있으므로, 건물 시공 시 여러 매체를 미리 깔아 두는 전략이 경제적일 수 있다.

| 매체/접속 방식 | 핵심 특성 | 이해 포인트 |
|---|---|---|
| twisted-pair copper wire | 두 절연 copper wire를 꼬아 interference를 줄임 | LAN의 UTP, DSL에 사용; 거리와 선 두께가 rate에 영향 |
| coaxial cable | 동심 구조의 두 copper conductor와 shielding | cable TV/Internet에서 사용; shared guided medium으로 쓰기 쉬움 |
| optical fiber | light pulse가 bit를 표현 | 매우 높은 bit rate, 낮은 attenuation, EMI 내성, long-haul/backbone에 강함 |
| terrestrial radio | 전자기 spectrum을 공중으로 전파 | 이동성 제공, 벽 투과 가능, path loss/shadow/multipath/interference에 민감 |
| satellite radio | ground station과 satellite 사이 microwave link | geostationary는 coverage가 좋지만 약 280 ms propagation delay가 큼; LEO는 가까우나 constellation 필요 |

이 절의 큰 연결점은 access network와 physical media가 application 성능의 “바닥 조건”을 만든다는 것이다. 사용자는 application layer의 Web, video, game을 보지만, 실제 체감 성능은 마지막 수십 미터의 WiFi, shared HFC upstream, CO까지의 DSL 거리, backbone fiber, radio interference 같은 하위 계층 조건에 크게 좌우된다.

### 1.3 The Network Core

network core는 Internet의 end systems를 서로 연결하는 packet switches와 links의 mesh다. edge가 application을 실행하는 host 쪽이라면, core는 packet을 목적지 방향으로 계속 넘기는 switching/routing 인프라다. 이 절의 핵심 질문은 “긴 message가 어떻게 network 안에서 이동하는가”, “link capacity를 여러 통신이 어떻게 나누어 쓰는가”, “ISP들이 어떻게 하나의 Internet처럼 연결되는가”다.

#### packet switching과 store-and-forward

network application이 만든 message는 e-mail, image, audio file, control message처럼 어떤 데이터든 될 수 있다. source end system은 긴 message를 작은 packet으로 나누고, packet은 source에서 destination까지 communication links와 packet switches를 지난다. link의 transmission rate가 `R` bits/sec이고 packet 길이가 `L` bits이면, 해당 link 위에 packet 전체를 밀어 넣는 transmission delay는 `L / R` seconds다.

대부분의 packet switch는 store-and-forward transmission을 사용한다. 즉 router는 packet의 첫 bit가 도착하자마자 바로 다음 link로 흘려보내지 않고, packet 전체를 먼저 받은 뒤 buffer에 저장하고 나서 outbound link로 forwarding한다. router가 header를 검사하고 error/queue 처리와 forwarding 결정을 하기 위해 packet 단위의 처리가 필요하기 때문이다.

![Store-and-forward packet switching](@/assets/images/cs-computer-network-011-figure-1-11-page-35.png)
*Figure 1.11 · PDF p. 35 · router가 packet 전체를 받은 뒤 다음 link로 forwarding하는 store-and-forward 동작*

propagation delay를 무시하고 `N`개의 link가 모두 rate `R`이며 packet 하나의 길이가 `L`이면, store-and-forward만 고려한 end-to-end delay는 다음처럼 잡힌다.

$$
d_{end-to-end} = N \frac{L}{R}
$$

여러 packet을 연속으로 보내면 pipeline처럼 source가 다음 packet을 보내는 동안 router는 이전 packet을 forwarding할 수 있다. 그래서 단일 packet 지연과 여러 packet 전체 완료 시간은 다르게 계산해야 한다. 이 관점은 이후 transport layer의 pipelining, reliable data transfer, TCP throughput 감각에도 이어진다.

#### queuing delay, packet loss, forwarding table

packet switch의 각 outgoing link에는 output buffer 또는 output queue가 있다. 어떤 packet이 나가야 할 link가 이미 다른 packet을 전송 중이면, 새 packet은 output buffer에서 기다린다. 이때 발생하는 queuing delay는 traffic pattern에 따라 변하는 variable delay다. buffer는 유한하므로 congestion이 심해 buffer가 꽉 차면 arriving packet 또는 이미 queued packet 중 하나가 drop되어 packet loss가 발생한다.

![Packet switching and output queue](@/assets/images/cs-computer-network-012-figure-1-12-page-36.png)
*Figure 1.12 · PDF p. 36 · 빠른 access link에서 들어온 packet들이 더 느린 output link 앞에서 queue를 만드는 상황*

router는 packet header의 destination IP address를 보고 forwarding table을 검색한 뒤 적절한 outbound link로 packet을 보낸다. forwarding table은 destination address 또는 address prefix를 outbound link에 mapping한다. “각 router가 어떻게 forwarding table을 갖게 되는가”는 routing protocols의 문제이며, shortest path 등을 계산해 router의 forwarding table을 자동 설정하는 방식은 Chapter 5의 control plane 주제다.

#### circuit switching과 resource reservation

link와 switch를 통해 데이터를 옮기는 기본 방식에는 packet switching과 circuit switching이 있다. circuit-switched network에서는 end systems 간 communication session이 지속되는 동안 path상의 resource, 즉 buffer와 link transmission rate 일부가 미리 reserved된다. 전통적 telephone network가 대표적 예다. connection setup 단계에서 switches가 connection state를 만들고, 각 link에서 일정 transmission rate를 connection에 할당한다.

packet switching은 resource를 미리 예약하지 않는다. session의 packet은 필요할 때 link를 사용하고, link가 바쁘면 queue에서 기다린다. 그래서 Internet은 timely delivery를 위해 best effort를 하지만, delay나 bandwidth를 기본적으로 보장하지 않는다. 반대로 circuit switching은 reservation이 성공하면 constant rate를 얻지만, reserved resource가 silent period에도 다른 session에 쓰이지 못해 낭비될 수 있다.

FDM(frequency-division multiplexing)과 TDM(time-division multiplexing)은 circuit을 link 안에 구현하는 대표 방식이다. FDM은 link의 frequency spectrum을 여러 band로 나누고 각 connection에 band를 지속적으로 배정한다. TDM은 time을 frame과 slot으로 나누고 각 connection에 반복되는 slot을 배정한다.

![FDM and TDM](@/assets/images/cs-computer-network-014-figure-1-14-page-40.png)
*Figure 1.14 · PDF p. 40 · FDM은 주파수 일부를 계속 할당하고, TDM은 반복 frame의 특정 time slot을 할당한다*

circuit switching의 계산 감각은 reservation rate를 먼저 구하는 것이다. 예를 들어 link rate가 1.536 Mbps이고 TDM이 24 slots를 쓰면 circuit 하나의 rate는 `1.536 Mbps / 24 = 64 kbps`다. 640,000 bits file은 전송에 10초가 걸리고, connection setup 0.5초를 더하면 총 10.5초가 된다. 여기서 전송 시간은 path의 link 수와 무관하게 circuit rate로 결정되고, 별도로 propagation delay가 더해진다.

#### packet switching vs circuit switching

packet switching의 약점은 queuing delay 때문에 real-time service에서 delay가 variable하고 unpredictable할 수 있다는 점이다. 그러나 Internet traffic은 사용자가 항상 일정 rate로 보내지 않고, activity period와 inactivity period가 섞인 bursty traffic인 경우가 많다. packet switching은 link capacity를 packet-by-packet, on-demand로 공유하기 때문에 statistical multiplexing의 이점을 얻는다.

대표 예시는 1 Mbps link를 공유하는 users가 각자 active할 때 100 kbps를 만들고 active probability가 0.1인 상황이다. circuit switching은 user마다 항상 100 kbps를 예약하므로 10명까지만 지원한다. packet switching은 35명이 있어도 동시에 11명 이상 active할 확률이 매우 작다면, 대부분의 시간에 1 Mbps capacity 안에서 거의 delay 없이 처리하면서 훨씬 많은 user를 수용할 수 있다. 또 10명 중 한 명만 갑자기 많은 packet을 보내고 나머지가 조용하면, TDM circuit에서는 자기 slot만 써야 하지만 packet switching에서는 link 전체를 사용할 수 있다.

| 구분 | packet switching | circuit switching |
|---|---|---|
| resource allocation | 필요할 때 packet 단위로 사용 | session 동안 미리 reservation |
| delay 특성 | queue 때문에 variable | circuit setup 후 비교적 predictable |
| idle period | 다른 packet이 capacity 사용 가능 | reserved slot/band가 놀 수 있음 |
| 구현 부담 | packet forwarding, buffering, routing 중심 | setup signaling과 connection state 필요 |
| Internet에서의 의미 | bursty data traffic에 효율적 | guarantee가 필요한 전통 전화망 모델과 대비 |

#### network of networks

Internet은 access ISPs가 서로 직접 완전 mesh로 연결된 구조가 아니다. 전 세계의 수많은 access ISP가 모두 서로 direct link를 가지는 것은 비용상 불가능하므로, provider-customer hierarchy, regional ISP, tier-1 ISP, PoP, multi-homing, peering, IXP, content-provider network가 결합된 network of networks가 된다.

access ISP는 end users와 content providers를 Internet에 붙인다. 더 넓은 reachability를 위해 access ISP는 regional ISP나 tier-1 ISP 같은 provider에게 돈을 내고 연결한다. tier-1 ISPs는 hierarchy의 상단에 있으며 서로 settlement-free peering을 한다. PoP(points of presence)는 customer ISP가 provider network에 접속할 수 있는 router 집합의 위치다. multi-homing은 한 ISP가 둘 이상의 provider에 연결해 failure가 나도 Internet reachability를 유지하는 방식이다. peering은 같은 계층의 ISPs가 upstream provider를 거치지 않고 직접 traffic을 교환해 비용과 경로를 줄이는 방식이며, IXP(Internet Exchange Point)는 여러 ISP가 한 장소에서 peering할 수 있게 해 주는 meeting point다.

![Interconnection of ISPs](@/assets/images/cs-computer-network-015-figure-1-15-page-45.png)
*Figure 1.15 · PDF p. 45 · tier-1 ISP, regional ISP, access ISP, IXP, content-provider network가 결합된 Internet interconnection 구조*

최근의 큰 변화는 content-provider network다. Google 같은 대형 content provider는 전 세계 data centers를 private TCP/IP network로 연결하고, lower-tier ISP나 IXP와 직접 peering하여 upper-tier ISP를 우회하려 한다. 목적은 transit 비용을 줄이는 것뿐 아니라 end user에게 service가 전달되는 경로와 품질을 더 직접적으로 통제하는 것이다. 이 구조는 Chapter 2의 CDN, video streaming, large-scale content delivery와 연결된다.

### 1.4 Delay, Loss, and Throughput in Packet-Switched Networks

Internet service가 이상적이라면 임의의 두 end system 사이에 원하는 만큼의 데이터를 즉시, 손실 없이 보낼 수 있어야 한다. 실제 network는 physical law와 resource sharing 때문에 throughput을 제한하고, delay를 만들고, packet loss도 일으킨다. 이 절은 “성능 문제”를 감으로만 말하지 않고 계산 가능한 항목으로 나누는 출발점이다.

#### nodal delay의 네 구성요소

packet은 source host에서 여러 router를 거쳐 destination host에 도착한다. packet이 한 node(host 또는 router)에서 다음 node로 넘어갈 때마다 nodal processing delay, queuing delay, transmission delay, propagation delay가 누적된다. 이 네 항목의 합이 total nodal delay다.

![Nodal delay at router A](@/assets/images/cs-computer-network-016-figure-1-16-page-47.png)
*Figure 1.16 · PDF p. 47 · router A에서 processing, queueing, transmission, propagation delay가 생기는 위치*

processing delay(`d_proc`)는 packet header를 검사하고 outbound link를 결정하며 bit-level error를 확인하는 시간이다. 고속 router에서는 보통 microseconds 이하이지만, router가 초당 처리할 수 있는 packet 수, 즉 maximum throughput에는 영향을 준다.

queuing delay(`d_queue`)는 packet이 output link 앞 queue에서 전송 순서를 기다리는 시간이다. queue가 비어 있고 link도 놀고 있으면 0이지만, 앞서 도착한 packet이 많으면 길어진다. 가장 변동성이 큰 delay이고, traffic intensity와 burstiness에 강하게 좌우된다.

transmission delay(`d_trans`)는 packet의 모든 bit를 link로 밀어 넣는 시간이다. packet length가 `L` bits이고 link transmission rate가 `R` bits/sec이면 `d_trans = L / R`이다. 이 값은 packet 크기와 link rate의 함수이며, 두 router 사이 거리는 영향을 주지 않는다.

propagation delay(`d_prop`)는 link에 올라간 bit가 다음 node까지 물리적으로 전파되는 시간이다. 두 node 사이 거리가 `d`, propagation speed가 `s`이면 `d_prop = d / s`다. 이 값은 거리와 매체의 전파 속도에 의해 결정되며, packet 크기나 link rate와는 별개다. 같은 캠퍼스 안 link에서는 작지만, geostationary satellite link에서는 수백 milliseconds가 되어 지배적 요소가 될 수 있다.

따라서 nodal delay는 다음처럼 표현된다.

$$
d_{nodal} = d_{proc} + d_{queue} + d_{trans} + d_{prop}
$$

transmission delay와 propagation delay는 특히 헷갈리기 쉽다. transmission delay는 “출발지 router가 packet을 link에 전부 싣는 데 걸리는 시간”이고, propagation delay는 “이미 link에 실린 bit가 다음 router까지 이동하는 시간”이다. 빠른 link라도 먼 거리의 propagation delay는 줄이지 못하고, 가까운 거리라도 낮은 rate link에서는 큰 packet의 transmission delay가 커질 수 있다.

#### queuing delay와 traffic intensity

queuing delay는 packet마다 다르므로 평균, 분산, 특정 값을 넘을 확률 같은 statistical measure로 다룬다. 평균 packet arrival rate를 `a` packets/sec, packet length를 `L` bits, link transmission rate를 `R` bits/sec라고 하면, queue로 들어오는 평균 bit rate는 `La` bits/sec다. 이때

$$
\frac{La}{R}
$$

을 traffic intensity라고 한다. `La/R > 1`이면 평균 유입률이 link가 내보낼 수 있는 rate보다 커서 queue가 무한히 커지려 하고 delay는 폭발한다. 그래서 traffic engineering의 기본 규칙은 traffic intensity가 1을 넘지 않게 설계하는 것이다.

![Queuing delay and traffic intensity](@/assets/images/cs-computer-network-018-figure-1-18-page-51.png)
*Figure 1.18 · PDF p. 51 · traffic intensity가 1에 가까워질수록 average queuing delay가 급격히 증가하는 관계*

`La/R <= 1`이어도 arrival pattern이 중요하다. packet이 정확히 `L/R` 간격으로 주기적으로 오면 queue가 거의 생기지 않을 수 있다. 반면 여러 packet이 burst로 몰려오면 같은 평균 rate에서도 뒤쪽 packet은 앞 packet들이 전송될 때까지 기다린다. 실제 Internet traffic은 random하고 bursty하므로 `La/R` 하나만으로 delay를 완전히 설명할 수는 없지만, intensity가 1에 가까워질수록 작은 traffic 증가가 큰 delay 증가로 이어진다는 직관은 매우 중요하다.

#### packet loss

현실의 output queue는 finite capacity를 가진다. queue가 꽉 찬 순간 도착한 packet은 저장될 곳이 없으므로 router가 drop하고, end system 입장에서는 packet이 network core에 들어갔지만 destination에서 나타나지 않은 것처럼 보인다. lost packet은 transport layer에서 end-to-end retransmission될 수 있지만, retransmission은 추가 delay와 throughput 감소를 만든다. 그래서 node 성능은 delay뿐 아니라 packet loss probability로도 평가한다.

#### end-to-end delay와 Traceroute

single router의 nodal delay가 path 전체에 누적되면 end-to-end delay가 된다. source와 destination 사이에 `N - 1` routers가 있고, queuing delay가 negligible하며 각 node의 processing delay가 `d_proc`, 각 link의 transmission delay가 `d_trans`, propagation delay가 `d_prop`로 같다고 단순화하면 다음처럼 쓸 수 있다.

$$
d_{end-to-end} = N(d_{proc} + d_{trans} + d_{prop})
$$

Traceroute는 실제 Internet path와 round-trip delay를 관찰하는 도구다. source host가 destination을 향해 특수 packet들을 보내고, path상의 nth router가 nth packet에 대해 source로 짧은 message를 돌려보내게 하여 router name/address와 round-trip time을 기록한다. 같은 router에 대해 여러 번 측정하면 queuing delay 변동 때문에 round-trip time이 달라질 수 있고, 더 먼 router의 RTT가 더 가까운 router보다 작게 나오는 현상도 가능하다. transatlantic fiber link처럼 먼 구간을 지날 때 RTT가 크게 뛰는 것은 propagation delay의 흔적이다.

end system 자체의 delay도 있다. WiFi나 cable modem처럼 shared medium에 packet을 내보내기 전 protocol상 기다리는 시간이 있을 수 있고, VoIP에서는 speech sample을 packet에 채우는 packetization delay가 체감 품질에 영향을 줄 수 있다. 즉 network delay는 router 내부만의 문제가 아니라 access protocol과 application packetization에도 걸쳐 있다.

#### throughput과 bottleneck link

throughput은 receiver가 데이터를 받는 rate다. instantaneous throughput은 특정 순간의 수신 rate이고, `F` bits file을 `T` seconds에 받았다면 average throughput은 `F/T` bits/sec다. file transfer에서는 높은 throughput이 중요하고, Internet telephony/video처럼 실시간 application은 낮은 delay와 일정 threshold 이상의 instantaneous throughput이 중요하다.

경로에 다른 traffic이 없고 server-to-client path의 link rates가 `R_1, R_2, ..., R_N`이면 large file transfer의 throughput은 대략 다음과 같다.

$$
throughput = \min\{R_1, R_2, ..., R_N\}
$$

가장 작은 rate의 link가 bottleneck link다. 예를 들어 server access link가 2 Mbps이고 client access link가 1 Mbps이면, core가 충분히 빠르더라도 throughput은 1 Mbps이고 32 million bits MP3 file은 약 32초가 걸린다. 실제 계산에는 store-and-forward, processing, protocol overhead가 더해질 수 있지만, bottleneck 직관은 변하지 않는다.

![End-to-end throughput](@/assets/images/cs-computer-network-020-figure-1-20-page-57.png)
*Figure 1.20 · PDF p. 57 · access link가 bottleneck인 경우와 여러 download가 core link를 공유해 bottleneck이 바뀌는 경우*

현대 Internet core는 많은 경우 high-speed link로 over-provisioned되어 있어 단일 download의 bottleneck은 server/client access network가 되는 일이 많다. 그러나 여러 flows가 같은 core link를 공유하면 이야기가 달라진다. 예를 들어 10개의 downloads가 모두 rate `R = 5 Mbps`인 common core link를 지나고 그 link가 공평하게 나뉜다면 각 download는 500 kbps만 얻는다. 따라서 throughput은 path의 link rates뿐 아니라 intervening traffic, 즉 같은 link를 공유하는 다른 flow의 존재에도 의존한다.

### 1.5 Protocol Layers and Their Service Models

Internet은 applications, protocols, end systems, packet switches, physical media가 뒤섞인 복잡한 시스템이다. 이를 한 번에 이해하려고 하면 구조가 무너진다. protocol layering은 복잡한 network architecture를 기능별 layer로 나누고, 각 layer가 위 layer에 제공하는 service model을 중심으로 시스템을 설명하게 해 준다.

#### layered architecture의 의미

layered architecture의 핵심은 각 layer가 자기 layer 안의 action을 수행하면서 바로 아래 layer의 service를 사용해 위 layer에 service를 제공한다는 점이다. airline analogy에서 baggage layer는 이미 ticketed passenger에게 baggage transfer service를 제공하고, gate layer는 아래의 runway/takeoff service를 사용해 passenger loading/unloading service를 제공한다. networking에서도 같은 구조가 반복된다.

layering의 장점은 modularity다. 어떤 layer의 implementation을 바꾸더라도 위 layer에 제공하는 service와 아래 layer를 사용하는 방식이 유지되면 나머지 system은 그대로 둘 수 있다. 예를 들어 link layer의 WiFi 구현이 바뀌어도 network layer가 받는 datagram delivery service가 유지되면 IP layer의 기본 구조는 유지된다.

단점도 있다. 첫째, 서로 다른 layer가 비슷한 기능을 중복 구현할 수 있다. 예를 들어 link layer와 transport layer가 모두 reliable delivery 또는 error recovery를 제공하는 경우가 있다. 둘째, 한 layer가 필요한 정보가 다른 layer에만 있어 separation of layers를 깨고 싶어지는 상황이 있다. 실제 system에서는 순수한 계층화와 성능/실용성 사이의 trade-off가 계속 생긴다.

#### Internet protocol stack

Internet protocol stack은 application, transport, network, link, physical의 다섯 layer로 구성된다. 여러 layer의 protocols를 합쳐 protocol stack이라고 부르며, 이 책도 top-down 방식으로 application layer부터 아래로 내려가며 설명한다.

![Internet protocol stack](@/assets/images/cs-computer-network-023-figure-1-23-page-61.png)
*Figure 1.23 · PDF p. 61 · Internet의 five-layer protocol stack: application, transport, network, link, physical*

| Layer | PDU 이름 | 대표 protocol/기능 | 핵심 service model |
|---|---|---|---|
| application layer | message | HTTP, SMTP, FTP, DNS | network applications 사이의 의미 있는 message 교환 |
| transport layer | segment | TCP, UDP | application endpoints 사이 message 운반 |
| network layer | datagram | IP, routing protocols | host-to-host datagram delivery와 route 결정 |
| link layer | frame | Ethernet, WiFi, DOCSIS, PPP | 한 node에서 다음 adjacent node까지 frame 전달 |
| physical layer | bit | medium별 signaling | link 위로 individual bits 전송 |

application layer에는 network applications와 application-layer protocols가 있다. HTTP는 Web document request/transfer, SMTP는 e-mail transfer, FTP는 file transfer를 담당한다. DNS(domain name system)는 사람이 읽기 쉬운 hostname을 network address로 바꾸는 기능을 application-layer protocol로 제공한다. application-layer protocol은 여러 end systems에 분산되어 실행되며, 이 layer의 정보 단위를 message라고 부른다.

transport layer는 application-layer message를 application endpoints 사이에서 운반한다. Internet의 대표 transport protocols는 TCP와 UDP다. TCP는 connection-oriented service를 제공하며 guaranteed delivery, flow control, long message segmentation, congestion control을 포함한다. UDP는 connectionless service이며 reliability, flow control, congestion control이 없는 no-frills transport를 제공한다. transport-layer packet은 segment라고 부른다.

network layer는 datagram을 한 host에서 다른 host로 이동시킨다. source host의 TCP 또는 UDP는 segment와 destination address를 network layer에 넘기고, network layer는 이를 destination host의 transport layer로 전달하려 한다. IP protocol은 datagram fields와 end system/router가 그 fields를 어떻게 처리할지 정의한다. routing protocols는 datagram이 source에서 destination까지 어떤 route를 지날지 결정한다. IP가 Internet 전체를 묶는 glue 역할을 하므로 network layer를 IP layer라고도 부른다.

link layer는 network layer의 datagram을 route상의 한 node에서 다음 node까지 전달한다. link-layer service는 link마다 다르며, 어떤 link-layer protocol은 한 link 위에서 reliable delivery를 제공할 수도 있다. 하지만 이는 TCP의 end-to-end reliable delivery와 범위가 다르다. 한 datagram은 source에서 destination까지 가는 동안 Ethernet, WiFi, PPP처럼 서로 다른 link-layer protocols에 의해 여러 번 frame으로 감싸져 전달될 수 있다.

physical layer는 frame 안의 individual bits를 다음 node까지 실제 medium 위로 이동시킨다. physical-layer protocol은 link와 transmission medium에 의존한다. Ethernet만 해도 twisted-pair copper, coaxial cable, fiber 등 매체별로 bit를 표현하고 보내는 방식이 달라진다.

#### encapsulation

encapsulation은 상위 layer의 data unit을 하위 layer의 payload로 넣고, 하위 layer가 자기 header를 붙이는 과정이다. sending host에서 application-layer message `M`은 transport layer로 내려가고, transport layer는 transport header `Ht`를 붙여 segment를 만든다. network layer는 여기에 network header `Hn`을 붙여 datagram을 만들고, link layer는 link header `Hl`을 붙여 frame을 만든다.

![Encapsulation across hosts, switches, and routers](@/assets/images/cs-computer-network-024-figure-1-24-page-63.png)
*Figure 1.24 · PDF p. 63 · host, link-layer switch, router가 구현하는 layer 차이와 encapsulation/de-encapsulation 흐름*

간단한 구조는 다음처럼 볼 수 있다.

```text
Application:              M
Transport segment:     Ht M
Network datagram:   Hn Ht M
Link frame:      Hl Hn Ht M
```

각 layer의 packet에는 header fields와 payload field가 있다. payload는 보통 바로 위 layer의 packet이다. receiver 쪽에서는 반대로 de-encapsulation이 일어나며, 각 layer가 자기 header를 해석하고 payload를 위 layer로 넘긴다.

장비별로 구현하는 layer도 다르다. hosts는 application까지 포함해 five layers를 모두 구현한다. routers는 physical, link, network layers를 구현하므로 IP datagram을 보고 forwarding할 수 있다. link-layer switches는 physical과 link layers만 구현하므로 IP address가 아니라 Ethernet address 같은 layer 2 address를 보고 동작한다. 이 차이는 Internet architecture가 많은 복잡성을 edge의 hosts에 두고, core 장비는 forwarding에 집중하게 만든다는 점과 연결된다.

### 1.6 Networks Under Attack

Internet은 기업, 대학, 정부기관, 개인 활동, IoT devices에 mission critical infrastructure가 되었지만, 원래의 설계 가정은 “mutually trusting users attached to a transparent network”에 가까웠다. 현대 Internet에서는 사용자가 서로를 신뢰하지 않고, 중간 장비나 무선 매체도 신뢰할 수 없으며, 공격자는 malware, DoS/DDoS, packet sniffing, IP spoofing, man-in-the-middle 같은 방식으로 network와 host를 공격한다. network security는 공격을 이해하고 방어하거나, 애초에 공격에 강한 architecture를 설계하는 분야다.

#### malware와 botnet

malware는 Internet을 통해 host에 들어와 file 삭제, spyware 설치, password/keystroke 수집 같은 피해를 만든다. 감염된 host는 attacker가 제어하는 botnet의 일부가 될 수 있고, botnet은 spam distribution이나 DDoS 공격에 동원된다. self-replicating malware는 한 host를 감염시킨 뒤 Internet을 통해 다른 host로 전파되어 exponential하게 확산될 수 있다. 이 관점은 network가 단순히 data delivery path가 아니라 공격 확산 경로도 된다는 점을 보여준다.

#### DoS와 DDoS

denial-of-service(DoS) attack은 legitimate users가 network, host, service를 사용할 수 없게 만드는 공격이다. 대표 유형은 세 가지다. vulnerability attack은 취약한 application/OS에 잘 조작된 packet sequence를 보내 service 중단이나 crash를 유발한다. bandwidth flooding은 target access link를 넘칠 만큼 많은 packet을 보내 legitimate packet이 server까지 도달하지 못하게 한다. connection flooding은 half-open 또는 fully open TCP connections를 대량 생성해 target host가 legitimate connection을 받지 못하게 만든다.

bandwidth flooding은 Section 1.4의 traffic intensity와 직접 연결된다. server access rate가 `R` bps이면 공격자는 대략 `R` bps에 가까운 aggregate traffic을 target으로 보내 access link를 clog하려 한다. 단일 source 공격은 upstream router가 차단하기 쉬울 수 있지만, DDoS(distributed DoS)는 attacker가 여러 compromised hosts, 즉 zombies를 제어하여 target으로 동시에 traffic을 보낸다.

![Distributed denial-of-service attack](@/assets/images/cs-computer-network-025-figure-1-25-page-67.png)
*Figure 1.25 · PDF p. 67 · attacker가 여러 zombie hosts를 동원해 victim으로 traffic을 집중시키는 DDoS 구조*

DDoS가 어려운 이유는 공격 traffic이 여러 위치에서 분산되어 오고, 각 source만 보면 정상적인 traffic처럼 보일 수 있기 때문이다. defense도 공격 유형에 따라 달라진다. vulnerability attack은 patching/input validation이 중요하고, bandwidth flooding은 filtering, rate limiting, traffic scrubbing, over-provisioning이 관여하며, connection flooding은 transport protocol state 관리와 SYN flood 방어 같은 Chapter 3/8의 주제로 이어진다.

#### packet sniffing

packet sniffer는 channel을 지나가는 packet copy를 passive하게 기록하는 receiver다. wireless medium에서는 근처에 수신기를 두는 것만으로 packet을 복사할 수 있고, wired broadcast LAN이나 cable access처럼 broadcast 특성이 있는 환경에서도 sniffing 위험이 있다. institution의 access router나 access link에 공격자가 접근하면 조직으로 들어오고 나가는 packet을 대량 수집할 수도 있다.

sniffing은 passive attack이라 탐지가 어렵다. 공격자가 packet을 주입하지 않고 듣기만 하기 때문이다. 그래서 방어의 핵심은 “도청되지 않게 만들기”보다 “도청되어도 내용과 인증 정보가 노출되지 않게 만들기”에 가깝다. encryption, cryptographic authentication, secure transport는 Chapter 8의 핵심 기반이 된다.

#### IP spoofing과 end-point authentication

IP spoofing은 공격자가 arbitrary source address, packet content, destination address를 가진 packet을 만들어 Internet에 주입하는 것이다. receiver가 source address를 그대로 믿으면, 공격자가 신뢰된 사용자나 router인 것처럼 masquerade할 수 있다. 예를 들어 router가 false source address를 믿고 forwarding table을 바꾸는 command를 수행한다면 심각한 문제가 된다.

이를 막으려면 end-point authentication이 필요하다. end-point authentication은 message가 우리가 생각하는 그 endpoint에서 왔는지 확실히 판단하게 해 주는 mechanism이다. 이 장에서는 방향만 제시하고, 실제 cryptography, authentication, message integrity는 Chapter 8에서 다룬다.

이 절의 중요한 결론은 security가 “추가 기능”이 아니라 network architecture의 기본 가정과 맞물린다는 점이다. 원래의 Internet은 자유롭게 packet을 보내고 선언된 identity를 믿는 쪽에 가까웠지만, 현대 Internet에서는 mutually trusted users가 예외다. 따라서 protocol과 system은 loss/delay/throughput뿐 아니라 adversary가 있는 환경에서도 동작해야 한다.

### 1.7 History of Computer Networking and the Internet

Internet history는 단순 연표라기보다 traffic 성격, resource sharing 방식, internetworking 필요성, application 생태계 변화가 쌓인 결과로 보는 편이 좋다. 이 장의 기술 개념과 연결하면 흐름은 `circuit switching의 한계 → packet switching → multiple packet-switched networks → TCP/IP 기반 internetworking → Web과 commercialization → broadband/wireless/cloud/content-provider networks`다.

#### packet switching의 등장: 1961-1972

1960년대 초 dominant communication network는 telephone network였고, telephone network는 voice처럼 constant rate traffic에 잘 맞는 circuit switching을 사용했다. 그러나 time-shared computers를 geographically distributed users가 함께 쓰려면 traffic이 bursty해진다. 사용자가 command를 보내고, 응답을 기다리거나 생각하는 동안 inactive period가 생기기 때문이다. 이 traffic pattern에는 항상 circuit을 예약하는 방식보다 packet switching이 더 자연스럽다.

Leonard Kleinrock은 queuing theory로 bursty traffic source에 packet switching이 효과적임을 보였고, Paul Baran은 military network의 secure voice 관점에서 packet switching을 연구했으며, Donald Davies와 Roger Scantlebury도 영국 National Physical Laboratory에서 유사한 아이디어를 발전시켰다. 이 흐름은 “link capacity를 필요할 때 공유한다”는 Section 1.3의 statistical multiplexing 직관과 직접 연결된다.

ARPAnet은 packet-switched computer network의 직접적인 조상이다. 1969년 UCLA, SRI, UC Santa Barbara, University of Utah에 packet switches가 설치되며 시작했고, 1972년쯤 약 15 nodes 규모로 성장해 공개 시연되었다. 초기 host-to-host protocol인 NCP(network-control protocol)가 완성되면서 application을 작성할 수 있게 되었고, 1972년 첫 e-mail program도 등장했다. 중요한 포인트는 network가 단순 link 실험을 넘어 end-to-end applications를 올릴 수 있는 platform이 되기 시작했다는 점이다.

#### proprietary networks와 internetworking: 1972-1980

초기 ARPAnet은 단일 closed network였다. 하지만 1970년대에는 ALOHANet, packet-satellite network, packet-radio network, Telenet, Cyclades, Tymnet, IBM SNA 등 여러 stand-alone packet-switching networks가 등장했다. 네트워크가 많아지자 문제는 “하나의 packet network를 만드는 것”에서 “서로 다른 networks를 연결하는 architecture를 만드는 것”으로 바뀌었다. 이 작업을 internetting이라고 불렀고, Vinton Cerf와 Robert Kahn의 TCP 설계로 이어졌다.

초기 TCP는 오늘날의 TCP와 IP 기능을 함께 포함했다. 이후 실험을 통해 reliable in-sequence delivery와 forwarding 기능을 분리할 필요가 드러났고, IP가 TCP에서 분리되었다. packetized voice처럼 reliable, flow-controlled service가 꼭 필요하지 않은 application을 위해 UDP도 등장했다. 그래서 1970년대 말에는 오늘날 Internet의 핵심인 TCP, UDP, IP가 개념적으로 자리 잡았다.

같은 시기 ALOHA protocol은 shared broadcast radio medium을 여러 사용자가 나누어 쓰는 첫 multiple-access protocol이 되었고, Ethernet은 이 아이디어를 wired shared broadcast network로 발전시켰다. 이 흐름은 Chapter 6의 link layer와 multiple access protocols의 역사적 배경이다.

#### networks의 확산: 1980-1990

1980년대에는 ARPAnet의 수백 hosts 수준에서 public Internet의 십만 hosts 수준으로 성장했다. BITNET은 e-mail/file transfer를, CSNET은 ARPAnet access가 없는 university researchers 연결을, NSFNET은 NSF-sponsored supercomputing centers access를 제공했다. NSFNET backbone은 56 kbps에서 시작해 1.5 Mbps로 성장하며 regional networks를 잇는 primary backbone 역할을 했다.

1983년 1월 1일 ARPAnet은 NCP에서 TCP/IP로 공식 전환했다. 이 “flag day”는 host protocol을 TCP/IP로 통일해 internetworking 기반을 확정한 사건이다. 1980년대 후반에는 TCP congestion control이 추가되어 Internet stability에 중요한 기반이 생겼고, DNS가 개발되어 human-readable Internet name과 32-bit IP address 사이 mapping을 제공했다.

#### Web과 commercial Internet: 1990s

1990년대에는 ARPAnet이 종료되고, NSFNET의 commercial use restrictions가 풀렸으며, 1995년 NSFNET이 decommission되면서 commercial ISPs가 backbone traffic을 담당하게 되었다. Internet은 research network 중심에서 commercial/public infrastructure로 이동했다.

World Wide Web은 Internet을 대중화한 결정적 application이다. Tim Berners-Lee와 동료들은 HTML, HTTP, Web server, browser의 초기 버전을 만들었다. Web은 search, Internet commerce, social networks 같은 수많은 application의 deployment platform이 되었고, browser와 GUI 환경은 Internet access를 연구자/전문가의 도구에서 일반 사용자 도구로 바꾸었다. 1990년대 말의 killer applications는 e-mail, Web, instant messaging, peer-to-peer file sharing이었다.

#### new millennium: broadband, wireless, social, cloud, private networks

2000년대 이후의 변화는 Internet이 “접속하는 곳”에서 “항상 연결된 생활/산업 기반”으로 바뀐 것이다. cable modem, DSL, FTTH, 5G fixed wireless 같은 broadband home access는 YouTube, Netflix, video conference 같은 video applications의 기반이 되었다. high-speed wireless Internet access는 smartphone과 mobile applications를 폭발적으로 성장시켰고, wireless devices 수는 wired devices를 넘어섰다.

online social networks는 Internet 위에 massive people networks를 만들었고, API를 통해 messaging, photo sharing, mobile payments, distributed games 같은 application platform이 되었다. 동시에 Google, Microsoft 같은 online service providers는 globally distributed data centers와 private networks를 구축해 lower-tier ISPs와 직접 peering하고, service delivery control을 강화했다. cloud providers는 scalable compute/storage와 high-performance private network를 application에게 제공하면서 Internet application deployment 방식을 바꾸었다.

## 세부 정리

### 장 요약에서 다시 묶는 핵심 축

Chapter 1의 summary와 review questions는 이 장을 “mini-course”처럼 다시 묶는다. 앞으로의 장들은 top-down 순서로 application layer, transport layer, network layer data plane/control plane, link layer/LANs, wireless/mobile, security로 내려간다. 이 순서의 이유는 application을 먼저 이해해야 application이 network에 요구하는 service를 알고, 그 service가 transport/network/link layer에서 어떻게 구현되는지 추적할 수 있기 때문이다.

이 장에서 다음 장들로 반복 사용될 계산/분류 축은 다음과 같다.

| 축 | 반드시 남길 식/용어 | 이후 연결 |
|---|---|---|
| store-and-forward | `L/R`, `N L/R` | transport pipelining, router forwarding |
| nodal delay | `d_proc + d_queue + d_trans + d_prop` | performance analysis, Traceroute |
| traffic intensity | `La/R` | congestion, queuing delay, packet loss |
| throughput | `min{R_1, ..., R_N}` | bottleneck link, TCP throughput |
| layering | message/segment/datagram/frame/bit | application, transport, network, link chapters |
| security | malware, DDoS, sniffing, IP spoofing | cryptography, authentication, operational security |

### message segmentation의 재등장

본문 초반에는 source host가 long message를 segments/packets로 나눈다고 설명했고, 문제 P31은 message segmentation이 왜 중요한지 다시 묻는다. 핵심은 store-and-forward network에서 큰 message 하나를 통째로 보내면 각 switch가 message 전체를 받은 뒤 다음 link로 보내야 하므로 pipeline이 거의 생기지 않는다는 점이다. 반대로 message를 smaller packets로 나누면 첫 packet이 다음 link로 forwarded되는 동안 source는 둘째 packet을 보낼 수 있어 links가 겹쳐 일한다.

![Message segmentation](@/assets/images/cs-computer-network-027-figure-1-27-page-86.png)
*Figure 1.27 · PDF p. 86 · message를 통째로 보내는 경우와 작은 packets로 segmentation해 pipeline되는 경우*

segmentation의 장점은 end-to-end delay 감소, link 활용도 증가, packet loss 시 재전송 범위 축소다. 단점은 각 packet마다 header가 붙어 overhead가 늘고, receiver가 reassembly를 해야 하며, packet ordering/loss 처리 같은 transport-layer logic이 필요해진다는 점이다. 이 trade-off는 Chapter 3의 TCP segment, sequence number, reliable data transfer에서 본격적으로 다룬다.

### Wireshark Lab의 의미

Wireshark Lab은 새 개념을 추가한다기보다 protocol을 “문서 속 정의”에서 “실제 host가 주고받는 fields와 message sequence”로 바꾸는 실습이다. packet sniffer는 passively copies messages being sent from and received by your computer 하고, captured packet list, selected packet header details, packet contents를 보여준다. 이 도구는 Section 1.6의 sniffing 위험과도 연결된다. 학습 도구로는 protocol field를 관찰하게 해 주지만, 공격자가 쓰면 passive eavesdropping 도구가 된다.

## 연결 관계

이 장의 각 절은 이후 장의 입구 역할을 한다. `socket interface`, distributed applications, HTTP/SMTP/DNS는 Chapter 2 application layer로 이어진다. TCP/UDP, segment, reliable delivery, flow control, congestion control은 Chapter 3 transport layer의 중심이다. IP address, datagram, forwarding table, routing protocols, router layer 범위는 Chapter 4 data plane과 Chapter 5 control plane으로 이어진다. Ethernet, WiFi, DOCSIS, shared broadcast medium, multiple access protocol은 Chapter 6과 Chapter 7의 바탕이다. malware, DDoS, packet sniffer, IP spoofing, end-point authentication은 Chapter 8 security의 문제의식이다.

Internet architecture의 큰 설계 감각은 edge와 core의 역할 분리다. application은 hosts/end systems에서 실행되고, network core의 routers는 packet forwarding에 집중한다. 이 분리는 application innovation을 빠르게 만들지만, best-effort delivery, congestion, security, authentication 같은 문제를 transport/application/security mechanisms가 함께 해결해야 한다.

performance 관점에서는 access network, core link, queue, packet size, traffic burstiness가 함께 작동한다. “내 인터넷이 느리다”는 말은 실제로 access link bottleneck, shared HFC/WiFi contention, router queuing, propagation distance, server-side bottleneck, competing traffic 중 어느 하나 또는 조합일 수 있다. Chapter 1의 delay/loss/throughput 모델은 이 현상을 분해하는 기본 언어다.

## 오해하기 쉬운 내용

- host와 end system은 이 장에서 같은 의미로 쓴다. server도 Web page나 video를 제공하는 end system이다.
- router와 link-layer switch는 둘 다 packet switch지만 보는 주소와 구현 layer가 다르다. router는 IP/network layer까지, link-layer switch는 link layer까지 처리한다.
- transmission delay와 propagation delay는 다르다. `L/R`은 packet을 link에 밀어 넣는 시간이고, `d/s`는 bit가 물리적으로 이동하는 시간이다.
- packet switching이 항상 circuit switching보다 delay가 작다는 뜻은 아니다. packet switching은 bursty traffic에서 capacity sharing이 효율적이지만, congestion이 생기면 queuing delay와 packet loss가 생긴다.
- traffic intensity가 1보다 작아도 bursty arrivals에서는 queuing delay가 생길 수 있다. 평균만으로 순간 queue를 완전히 설명할 수 없다.
- throughput은 단순히 내 access link rate와 같지 않다. path의 bottleneck link와 intervening traffic이 함께 결정한다.
- link layer reliable delivery와 TCP reliable delivery는 범위가 다르다. 전자는 한 link, 후자는 end-to-end 범위다.
- sniffing은 passive라 탐지가 어렵다. 그래서 encryption과 authentication이 중요하다.

## 면접 질문

1. Internet을 nuts-and-bolts 관점과 service 관점에서 각각 설명해 보라.
2. protocol이 정의하는 세 가지 요소(message format, message order, action/event)를 Web request 예로 설명해 보라.
3. access network와 network core의 차이를 설명하고, DSL, cable, FTTH, WiFi, cellular 중 두 가지를 비교해 보라.
4. store-and-forward packet switching에서 `N`개 link, packet length `L`, rate `R`일 때 delay가 왜 `N L/R`로 잡히는가?
5. packet switching과 circuit switching의 resource allocation 방식과 traffic burstiness에 대한 효율 차이를 설명해 보라.
6. queuing delay가 traffic intensity `La/R`에 따라 왜 급격히 증가하는지 설명해 보라.
7. transmission delay와 propagation delay를 식과 예시로 구분해 보라.
8. bottleneck link가 throughput을 어떻게 결정하는지, 다른 traffic이 있을 때 왜 달라지는지 설명해 보라.
9. Internet five-layer protocol stack의 각 layer와 PDU(message, segment, datagram, frame, bit)를 말해 보라.
10. encapsulation 과정에서 header와 payload가 어떻게 쌓이고, router와 link-layer switch는 어떤 layer까지만 보는지 설명해 보라.
11. DDoS, packet sniffing, IP spoofing이 각각 어떤 네트워크 특성이나 신뢰 가정을 악용하는지 설명해 보라.
12. TCP/IP가 등장한 역사적 이유를 “여러 packet-switched networks를 연결하는 internetworking” 관점에서 설명해 보라.
