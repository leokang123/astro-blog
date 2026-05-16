---
title: "Chapter 7. Firewalls and Network Address Translation"
order: 7
pubDatetime: 2026-05-16T00:00:00+09:00
modDatetime: 2026-05-16T00:00:00+09:00
description: "Chapter 7. Firewalls and Network Address Translation 정리 노트입니다."
tags:
  - "cs전공책"
  - "ComputerNetwork"
---
# Chapter 7. Firewalls and Network Address Translation

- 과목: Computer Network
- 기준 교재: TCP/IP Illustrated, Volume 1
- 관련 페이지: PDF pp. 338-391
- 우선순위: 필수

## 개요

이 장은 Internet edge에서 traffic을 제한하고 address realm을 연결하는 두 축, 즉 `firewall`과 `Network Address Translation (NAT)`을 다룬다. 초기 Internet은 연구망 성격이 강해 상호 신뢰를 전제로 한 설계가 많았지만, 대중화 이후에는 end host의 취약점과 운영체제 bug를 모두 즉시 고치는 것이 현실적으로 어려워졌다. 그래서 end host가 노출되는 traffic 자체를 network edge에서 제한하는 장치가 필요해졌고, 이것이 firewall의 기본 역할이다.

동시에 IPv4 address exhaustion 문제가 커지면서, 모든 host가 globally unique public IPv4 address를 가져야 한다는 모델도 부담이 되었다. NAT는 서로 다른 `address realm`에서 같은 private address를 재사용하게 해 IPv4 address 압박을 줄였다. 실제 home router나 small enterprise router는 firewall과 NAT를 함께 제공하는 경우가 많아서, 보안 정책과 주소 변환 정책이 같은 장치에서 얽힌다.

## 핵심 개념

- firewall: 특정 traffic을 forward하거나 drop하도록 policy를 적용하는 network boundary 장치다.
- packet-filtering firewall: IP router처럼 동작하면서 packet header 조건을 보고 datagram을 통과시키거나 버린다.
- proxy firewall: client와 server 사이에서 application-layer endpoint가 되어 connection/association을 relay하는 firewall이다.
- ALG(Application-Layer Gateway): application protocol을 이해하고 application layer에서 traffic을 중계하거나 수정하는 gateway다.
- NAT(Network Address Translation): 한 address realm의 IP address를 다른 realm의 address로 변환하는 기능이다.
- NAPT(Network Address and Port Translation): IP address뿐 아니라 transport-layer port까지 바꿔 여러 내부 host가 하나의 public address를 공유하게 하는 NAT 형태다.
- NAT traversal: NAT 뒤의 host들이 직접 통신하거나 외부에서 접근 가능하게 하기 위해 mapping을 만들고 발견하고 유지하는 기법이다.
- STUN, TURN, ICE: NAT traversal에서 server-reflexive address 발견, relay fallback, 후보 경로 선택을 담당하는 protocol/프레임워크다.

## 세부 정리

### 7.1 Introduction

firewall은 Internet router의 한 종류처럼 볼 수 있지만, 단순히 최단 경로나 forwarding만 고려하지 않는다. 핵심 목적은 traffic exposure를 줄이는 것이다. 한 site에 다양한 OS와 오래된 host가 섞여 있으면 모든 취약점을 빠르게 patch하기 어렵다. firewall은 그런 host들이 직접 마주하는 Internet traffic을 제한해 공격 표면을 줄인다.

NAT는 별도의 동기에서 등장했다. IPv4 address는 한정되어 있고, 모든 private host가 globally routable address를 갖는 것은 확장성이 떨어졌다. NAT는 내부 private realm과 외부 Internet realm 사이에서 address를 바꿔 같은 private address block이 여러 site에서 반복 사용될 수 있게 한다. 이 장에서는 NAT가 address exhaustion 완화뿐 아니라 firewall과 결합해 edge router의 기본 기능이 된 이유를 다룬다.

### 7.2 Firewalls

firewall의 공통 역할은 traffic을 선별하는 것이지만, 어디에서 어떤 단위로 선별하느냐가 다르다. 원문은 대표적으로 `packet-filtering firewall`과 `proxy firewall`을 구분한다.

| 구분 | packet-filtering firewall | proxy firewall |
|---|---|---|
| 동작 계층 | network/transport header 중심 | application layer 중심 |
| 장치 성격 | IP router에 가까움 | multihomed host/ALG에 가까움 |
| endpoint 여부 | TCP/UDP endpoint가 아님 | TCP connection/UDP association을 firewall에서 terminate |
| 정책 기준 | IP address, protocol, port, ICMP type, TCP flags 등 | application/service별 proxy 동작 |
| 장점 | 범용성, 성능, 투명성 | application-level 제어, 강한 분리 |
| 비용 | fragment/state 처리 어려움, 깊은 의미 파악 제한 | service마다 proxy 필요, brittle, client 설정 필요 |

### 7.2.1 Packet-Filtering Firewalls

`packet-filtering firewall`은 Internet router처럼 packet을 forward하지만, ACL/filter 조건에 따라 일부 packet을 drop한다. 가장 단순한 filter는 header field의 range comparison이다. 예를 들어 특정 source/destination IP address, IP option, ICMP message type, UDP/TCP port number를 기준으로 허용/차단할 수 있다.

중요한 구분은 `stateless firewall`과 `stateful firewall`이다. stateless packet filter는 각 datagram을 독립적으로 본다. 반면 stateful firewall은 이전 packet이나 앞으로 올 packet과의 관계를 추론해 transport association 또는 fragmented IP datagram의 문맥을 고려한다. IP fragmentation은 firewall을 특히 어렵게 만든다. fragment마다 transport header가 모두 보이지 않을 수 있고, stateless firewall은 fragment 조합을 이해하지 못해 쉽게 혼란스러워질 수 있다.

전형적인 packet-filtering firewall은 `inside`, `outside`, 그리고 optional `DMZ` interface를 가진 router다. inside에서 outside로 나가는 traffic은 비교적 넓게 허용하고, outside에서 inside로 들어오는 traffic은 보수적으로 막는 구성이 흔하다. DMZ에는 Internet에서 접근해야 하는 public-facing server를 두되, 허용된 service만 통과시킨다.

![Figure 7-1](@/assets/images/111_Figure_7_1_page_340.png)
<p align="center"><sub>Figure 7-1 · PDF p. 340 · inside/outside/DMZ 사이에서 ACL로 traffic을 선별하는 packet-filtering firewall</sub></p>

ACL은 "어떤 packet을 버릴지/통과시킬지"를 적은 policy list다. 예를 들어 outside에서 들어오는 임의 TCP connection은 막고, inside client가 시작한 DNS/HTTP/HTTPS에 대한 reply traffic이나 DMZ server로 향하는 특정 service만 허용할 수 있다. 이 모델은 단순하지만, "packet이 어떤 connection의 일부인가"라는 state 판단이 들어가면 rule 설계가 훨씬 중요해진다.

### 7.2.2 Proxy Firewalls

`proxy firewall`은 일반 IP router처럼 packet을 그대로 forwarding하지 않는다. firewall 자체가 multihomed Internet host가 되어 내부 client와 connection을 맺고, 외부 server와 별도 connection을 맺은 뒤 application layer에서 중계한다. 그래서 proxy firewall은 `Application-Layer Gateway (ALG)`로 이해하는 편이 정확하다.

![Figure 7-2](@/assets/images/112_Figure_7_2_page_341.png)
<p align="center"><sub>Figure 7-2 · PDF p. 341 · proxy firewall이 TCP/UDP association을 terminate하고 service별 proxy agent로 중계하는 구조</sub></p>

proxy firewall에서는 내부 client가 실제 외부 server가 아니라 proxy에 접속하도록 설정되는 경우가 많다. firewall의 IP forwarding은 대개 꺼져 있고, 외부 interface는 globally routable address, 내부 interface는 private address를 가진다. 이 구조는 private address realm 사용과도 잘 맞는다.

proxy firewall은 application protocol을 이해하므로 강한 제어가 가능하지만 유연성이 낮다. 새 service를 통과시키려면 해당 service용 proxy가 있어야 하고, client도 proxy 위치와 사용 방식을 알아야 한다. `Web Proxy Auto-Discovery Protocol (WPAD)`처럼 proxy를 자동 발견하는 방법이 있지만, 여전히 운영자가 지원 service를 알아야 한다. 일부 `capturing proxy`는 destination address와 관계없이 특정 종류의 traffic을 가로채 proxy로 처리한다.

대표적인 proxy firewall은 `HTTP proxy`와 `SOCKS proxy`다. HTTP proxy는 Web client에게는 Web server처럼, 외부 Web site에게는 Web client처럼 동작한다. cache를 겸하면 같은 Web page를 origin server 대신 proxy cache에서 제공해 latency를 줄일 수 있고, blacklist 기반 content filtering도 수행할 수 있다. 반대로 tunneling proxy는 content filter를 우회하는 데 쓰일 수도 있다.

`SOCKS`는 HTTP보다 일반적인 proxy access protocol이다. SOCKS version 4는 기본 proxy traversal을 제공하고, version 5는 stronger authentication, UDP traversal, IPv6 addressing을 추가한다. application이 SOCKS를 사용하도록 작성되거나 `socksified`되어야 하며, client는 proxy 위치와 SOCKS version을 알고 있어야 한다.

### 7.3 Network Address Translation (NAT)

`Network Address Translation (NAT)`는 서로 다른 Internet 영역에서 같은 IP address set을 재사용하게 하는 mechanism이다. 보통 private address realm의 여러 host가 하나의 Internet connection과 소수의 public IPv4 address를 공유할 때 사용된다. private side host가 client로 Internet에 접근하는 것은 비교적 쉽지만, private side host가 Internet에서 직접 접근 가능한 server가 되려면 별도 설정이 필요하다.

NAT의 원래 목적은 IPv4 address depletion과 routing scalability 문제를 완화하는 임시 수단이었다. routing scalability 쪽은 `CIDR (Classless Inter-Domain Routing)`가 담당했고, address 부족은 NAT가 크게 완화했다. 역설적으로 NAT가 널리 성공하면서 IPv6 도입이 늦어지는 효과도 생겼다.

NAT의 핵심 비용은 middlebox가 packet을 단순 forwarding하지 않는다는 점이다. NAT는 connection/association별 state를 유지하고, packet의 IP address를 바꾸며, transport pseudo-header checksum까지 맞춰야 한다. 이는 Internet protocol의 전통적 설계 원칙인 `smart edge, dumb middle`과 충돌한다. 또한 FTP, SIP처럼 application payload 안에 IP address/port를 담는 protocol은 NAT가 payload까지 이해하거나 application이 NAT traversal을 고려해야 한다.

기본적인 NAT forwarding은 다음처럼 보인다. 내부 host가 밖으로 나갈 때 source IP address가 NAT router의 public address로 바뀌고, 돌아오는 packet은 destination IP address가 다시 내부 private address로 바뀐다.

![Figure 7-3](@/assets/images/113_Figure_7_3_page_343.png)
<p align="center"><sub>Figure 7-3 · PDF p. 343 · private address realm과 public Internet 사이에서 NAT가 address를 변환하는 구조</sub></p>

대부분 NAT는 address translation과 packet filtering을 함께 수행한다. 특히 NAT state와 filtering policy가 얽힌다. 예를 들어 내부에서 시작한 flow의 reply는 허용하지만, 외부에서 처음 들어오는 unsolicited packet은 막는 식이다. 이 때문에 NAT는 자연스러운 firewall-like behavior를 제공하지만, NAT마다 filtering granularity와 state handling이 달라 application 입장에서는 예측하기 어려운 환경이 된다.

### 7.3.1 Traditional NAT: Basic NAT and NAPT

`traditional NAT`에는 `Basic NAT`와 `Network Address Port Translation (NAPT)`가 있다.

| 구분 | 변환 대상 | public address 필요량 | 특징 |
|---|---|---|---|
| Basic NAT | IP address만 변환 | 동시에 Internet을 쓰는 내부 host 수만큼 필요 | public address pool이 필요해 address 절약 효과가 제한적 |
| NAPT | IP address + transport identifier(port/query ID) 변환 | 하나 또는 소수 public address로 다수 host 처리 | home router에서 가장 흔한 NAT 형태 |

Basic NAT는 private address를 public address pool 중 하나로 바꾼다. 하지만 동시에 통신하는 내부 host 수만큼 public address가 필요하므로 IPv4 절약 효과가 크지 않다. 반면 NAPT는 TCP/UDP port 또는 ICMP query identifier까지 변환해 여러 내부 host를 하나의 public address 뒤에 multiplexing한다. 그래서 수천 개 내부 association이 하나의 public IPv4 address를 공유할 수 있다.

NAT 안쪽에서 쓰는 address는 local administrator가 정한다. 다른 사람이 실제 Internet에서 쓰는 global address를 내부에서 임의로 사용하면, 같은 address를 가진 진짜 외부 host가 local host에 가려져 도달 불가능해질 수 있다. 그래서 private realm에는 RFC 1918 block을 사용한다.

| private IPv4 block | 용도 |
|---|---|
| `10.0.0.0/8` | large private network에서 흔함 |
| `172.16.0.0/12` | medium private network |
| `192.168.0.0/16` | home/small office router 기본값으로 흔함 |

NAT는 보안 장치 자체는 아니지만, 기본 배치에서는 내부 host가 외부에서 직접 보이지 않는다. 내부에서 시작한 outgoing traffic과 그 returning traffic은 허용하고, 외부에서 새로 시작되는 incoming connection은 대부분 차단하는 policy가 흔하다. 이 동작은 probing attack을 줄이고 내부 address topology를 숨기는 `topology hiding` 효과를 만든다. 다만 이것은 강한 인증이나 종단 보안이 아니라 NAT state와 filtering policy가 만든 부수적 보호에 가깝다.

### 7.3.1.1 NAT and TCP

TCP NAT는 TCP connection의 4-tuple과 handshake state를 보고 mapping을 만든다. 내부 client `10.0.0.126:9200`이 외부 Web server `212.110.167.157:80`에 SYN을 보내면, NAT는 source address를 자신의 public address 예컨대 `63.204.134.177:9200`으로 바꿔 보낸다. 이때 NAT는 "external endpoint `63.204.134.177:9200`으로 돌아오는 packet은 internal endpoint `10.0.0.126:9200`으로 돌려보낸다"는 mapping을 만든다.

이 예시는 port를 바꾸지 않는 `port preservation`을 보여준다. 충돌이 없으면 NAT는 내부 client가 고른 source port를 external port로 그대로 쓸 수 있다. 외부 server의 response가 NAT public address와 port로 오면, NAT는 destination port를 mapping table에서 찾아 내부 host에게 rewrite해 전달한다.

TCP NAT에서 mapping 제거도 중요하다. FIN exchange가 보이면 정상 종료로 state를 지울 수 있지만, host 전원이 꺼지거나 packet이 유실되면 stale NAT mapping이 남는다. 그래서 NAT는 timer를 둔다. outgoing SYN을 보면 connection timer를 시작하고, ACK가 오지 않으면 state를 제거한다. ACK가 오면 더 긴 session timer로 바꾸고, 오래 idle한 connection은 probing이나 RST/무응답을 통해 죽은 것으로 판단한다. RFC 5382는 established TCP connection에 대해 최소 `2 hours and 4 minutes`, partially opened/closed connection에 대해 최소 `4 minutes`를 기다리도록 요구한다.

peer-to-peer application은 `simultaneous open` 때문에 어렵다. 양쪽 host가 모두 client처럼 SYN을 거의 동시에 보내는 경우 TCP 자체는 처리할 수 있지만, NAT가 incoming SYN을 무조건 모르는 connection으로 보고 버리면 연결이 깨질 수 있다. BEHAVE 요구사항은 NAT가 valid TCP exchange, 특히 simultaneous open을 제대로 처리하도록 요구한다.

### 7.3.1.2 NAT and UDP

UDP는 SYN/FIN/RST 같은 connection lifecycle signal이 없다. 그래서 UDP NAT는 "최근 사용된 binding인가"를 기준으로 mapping timer를 유지한다. RFC 4787은 UDP mapping timer를 최소 2분으로 요구하고 5분을 권장한다. timer refresh는 inside에서 outside로 packet이 나갈 때 반드시 갱신되어야 하며, outside에서 inside로 들어오는 packet으로 갱신할지는 NAT 구현에 따라 다를 수 있다.

UDP, TCP, ICMP 모두 IP fragmentation 때문에 NAT 처리에 문제가 생긴다. NAPT는 transport port나 ICMP identifier를 알아야 하는데, 첫 번째 fragment가 아닌 IP fragment에는 해당 transport header가 없을 수 있다. 단순 NAT/NAPT는 이런 fragment를 제대로 다루기 어렵다.

### 7.3.1.3 NAT and Other Transport Protocols (DCCP, SCTP)

TCP와 UDP 외에도 NAT behavior가 필요한 transport protocol이 있다. `DCCP (Datagram Congestion Control Protocol)`는 congestion-controlled datagram service를 제공하고, `SCTP (Stream Control Transmission Protocol)`는 reliable message service와 multihoming을 지원한다. 이런 protocol들은 port나 association 구조가 TCP/UDP와 다르거나 여러 address를 포함할 수 있어 NAT가 더 복잡해진다.

### 7.3.1.4 NAT and ICMP

ICMP NAT에는 두 문제가 있다. 첫째, ICMP error message는 보통 문제를 일으킨 원래 IP packet의 일부 또는 전체를 payload 안에 담는다. 이 `offending datagram` 안의 address도 NAT 관점에서 다시 rewrite되어야 end client가 이해할 수 있다. 이를 `ICMP fix-up`이라고 볼 수 있다.

둘째, ICMP informational message는 query/response 성격이 있으며 `Query ID` field를 TCP/UDP port처럼 사용할 수 있다. NAT는 outgoing informational request를 보고 Query ID 기반 mapping과 timer를 만들고, 돌아오는 response를 내부 host로 되돌릴 수 있다.

### 7.3.1.5 NAT and Tunneled Packets

tunneled packet은 NAT의 일을 더 어렵게 한다. NAT가 outer IP header만 바꾸면 충분하지 않을 수 있고, encapsulated header나 payload 안의 identifier도 바꿔야 할 수 있다. 예를 들어 PPTP에서 쓰는 GRE header의 `Call-ID`가 NAT 내부에서 충돌하면 communication이 깨질 수 있다. encapsulation layer가 늘어날수록 NAT는 더 많은 protocol knowledge나 ALG 도움을 필요로 한다.

### 7.3.1.6 NAT and Multicast

NAT는 주로 unicast traffic을 대상으로 논의되지만 multicast 지원도 가능하다. 다만 흔하지 않다. multicast NAT를 지원하려면 IGMP proxy 같은 기능이 필요하고, outside에서 inside로 들어오는 multicast packet의 destination address/port는 일반 unicast NAT처럼 변환되지 않는다. inside에서 outside로 나가는 traffic은 unicast UDP와 비슷한 source address/port translation behavior를 가질 수 있다.

### 7.3.1.7 NAT and IPv6

IPv6에서 NAT가 필요한지는 논쟁적이다. IPv6는 address space가 크므로 address saving 목적의 NAT는 필요하지 않다는 주장이 강하다. 또한 NAT가 모든 protocol 설계에 복잡도를 추가했기 때문에, IPv6에서는 firewall-like filtering, topology hiding, privacy 같은 요구를 `Local Network Protection (LNP)` 같은 다른 기술로 달성하자는 관점이 있다.

다만 NAT가 제공하던 address realm 분리와 provider 변경 시 renumbering 완화 요구는 IPv6에서도 완전히 사라지지 않는다. `Unique Local IPv6 Unicast Addresses (ULAs)`와 `NPTv6` 같은 prefix translation 아이디어가 이 맥락에 있다. NPTv6는 per-connection state를 유지하는 전통적 NAT가 아니라 prefix 기반 algorithmic translation을 사용하며, TCP/UDP checksum이 그대로 유지되도록 address를 바꾸는 것을 목표로 한다. 하지만 NPTv6 자체가 firewall filtering을 제공하는 것은 아니므로 별도 보안 policy가 필요하다.

### 7.3.2 Address and Port Translation Behavior

NAT 구현은 address와 port mapping을 어떻게 만드는지에 따라 크게 달라진다. 원문은 내부 host `X:x`가 외부 endpoint `Y1:y1`, `Y2:y2`와 통신할 때 NAT가 어떤 external endpoint `X1':x1'`, `X2':x2'`를 할당하는지로 behavior를 설명한다.

![Figure 7-5](@/assets/images/114_Figure_7_5_page_350.png)
<p align="center"><sub>Figure 7-5 · PDF p. 350 · NAT mapping이 내부/외부 endpoint 중 무엇에 의존하는지 비교하는 모델</sub></p>

| NAT behavior | translation behavior | 의미 |
|---|---|---|
| endpoint-independent mapping | `X1':x1' = X2':x2'` for all `Y2:y2` | 내부 `X:x`가 어디로 나가든 같은 external mapping 재사용 |
| address-dependent mapping | 같은 외부 address `Y`일 때만 mapping 재사용 | destination IP address가 달라지면 mapping이 달라질 수 있음 |
| address- and port-dependent mapping | 같은 외부 `Y:y`일 때만 mapping 재사용 | destination IP와 port까지 같아야 mapping 재사용 |

BEHAVE 기준에서 TCP/UDP 등 일반 transport에 권장/요구되는 mapping behavior는 `endpoint-independent`다. 이유는 NAT 뒤 application이 자신의 external address/port를 STUN 같은 방법으로 알아낸 뒤 다른 peer와 통신하려 할 때, destination이 바뀌어도 같은 mapping이 유지되어야 예측 가능하기 때문이다.

`port preservation`은 내부 source port `x`가 external port `x'`로 그대로 유지되는 behavior다. 충돌이 없으면 application 호환성에 유리하지만, 같은 external address에서 같은 port를 쓰려는 내부 flow가 둘 이상이면 충돌이 발생한다. `port parity`는 port 번호의 짝/홀 성질을 유지하는 약한 형태다. RTP처럼 전통적으로 port 번호 패턴을 가정한 application에 도움이 될 수 있지만, 현대 NAT traversal 기법이 보급될수록 중요도는 줄어든다.

NAT가 여러 external address를 가진 경우에는 `NAT address pool`을 사용한다. 여기서 말하는 NAT address pool은 Chapter 6의 DHCP address pool과 다르다. 한 내부 host가 여러 connection을 열 때 같은 external IP address를 계속 쓰면 `paired address pooling`, 임의 external address를 쓰면 `arbitrary address pooling`이다. paired behavior가 권장되는 이유는 상대방이 같은 내부 host의 여러 association을 서로 다른 host로 오해하지 않게 하기 위해서다.

반대로 `port overloading`은 여러 내부 host의 traffic을 같은 external IP address와 port number로 rewrite하는 매우 brittle한 방식이다. 외부에서 돌아오는 packet의 4-tuple이 모두 같아지면 어느 내부 host로 보낼지 알 수 없으므로, 현재는 허용되지 않는 behavior로 본다.

### 7.3.3 Filtering Behavior

translation behavior와 filtering behavior는 논리적으로 다르다. translation behavior는 어떤 external mapping을 만들지에 관한 것이고, filtering behavior는 mapping이 존재할 때 어떤 outside packet을 inside로 통과시킬지에 관한 것이다. 하지만 실제 NAT/firewall에서는 둘이 함께 구현되는 경우가 많아 같은 용어를 쓴다.

| filtering behavior | 허용 조건 | 투명성/보안 느낌 |
|---|---|---|
| endpoint-independent filtering | mapping만 있으면 어떤 outside source에서도 `X':x'`로 들어올 수 있음 | 가장 transparent하지만 느슨함 |
| address-dependent filtering | 내부 host가 이전에 contacted한 외부 address `Y`에서 온 traffic만 허용 | source IP 기준으로 더 엄격 |
| address- and port-dependent filtering | 내부 host가 이전에 contacted한 외부 `Y:y`에서 온 traffic만 허용 | 가장 엄격하지만 NAT traversal이 어려움 |

NAT가 address mapping을 전혀 만들지 않았다면 outside packet을 inside로 보낼 방법이 없다. outgoing traffic이 binding을 만들면, 그와 관련된 return traffic에 대해서만 filtering이 풀리는 것이 일반적이다. 이 filtering behavior는 뒤의 hole punching과 STUN/ICE 성공 가능성을 결정하는 핵심 조건이다.

### 7.3.4 Servers behind NATs

NAT 뒤의 host가 Internet-facing server가 되려면 `port forwarding` 또는 `port mapping`이 필요하다. 내부 server address `10.0.0.3`은 Internet에서 routable하지 않으므로, 외부 client는 NAT의 public address와 특정 port로 접속해야 한다. NAT는 그 incoming traffic을 미리 configured된 내부 server address/port로 rewrite해 전달한다.

port forwarding은 사실상 항상 존재하는 static NAT mapping이다. 예를 들어 NAT의 public TCP port 80을 내부 `10.0.0.3:80`으로 forward할 수 있다. 하지만 NAT의 external IP address가 하나뿐이라면 같은 transport protocol과 같은 external port 조합을 동시에 두 내부 server에 줄 수 없다. 내부 server의 IP address가 바뀌면 NAT 설정도 함께 갱신되어야 한다.

### 7.3.5 Hairpinning and NAT Loopback

`hairpinning` 또는 `NAT loopback`은 같은 private side에 있는 client가 server의 private address가 아니라 server의 external public mapping을 사용해 접근할 때 NAT가 traffic을 다시 inside로 꺾어 보내는 기능이다.

![Figure 7-6](@/assets/images/115_Figure_7_6_page_354.png)
<p align="center"><sub>Figure 7-6 · PDF p. 354 · 같은 NAT 내부의 client가 server의 external mapping을 사용해 접근하는 hairpinning</sub></p>

예를 들어 내부 host `X1`이 내부 server `X2:x2`의 private address를 알면 직접 연결하면 된다. 하지만 DNS나 rendezvous server를 통해 `X2':x2'`라는 public mapping만 알고 있으면, packet은 NAT로 향한다. NAT는 `X2':x2' -> X2:x2` mapping을 보고 packet을 다시 내부로 전달한다.

이때 server에게 보이는 source address가 중요하다. NAT가 source를 `X1':x1'`처럼 external source IP address and port로 제시하면, server는 peer를 globally routable address로 식별하는 application과 잘 맞는다. TCP NAT에서는 이런 external source hairpinning behavior가 요구된다.

### 7.3.6 NAT Editors

TCP/UDP header만 보고 처리할 수 있는 protocol은 NAT가 비교적 쉽게 지원한다. 문제는 application payload 안에 IP address, port number, connection identifier가 들어가는 protocol이다. 대표 예는 `FTP`다. FTP는 bulk data transfer를 위해 별도 connection을 만들 때 endpoint information을 application payload로 교환한다. NAT가 IP/TCP header만 바꾸면 payload 안의 address/port가 여전히 private value라서 외부 peer가 사용할 수 없다.

이런 경우 NAT가 application payload까지 수정해야 하며, 이를 수행하는 기능을 `NAT editor`라고 부른다. payload 크기가 바뀌면 TCP sequence number까지 보정해야 하므로 작업이 훨씬 복잡해진다. PPTP도 투명한 NAT 동작을 위해 NAT editor가 필요한 대표 protocol이다.

### 7.3.7 Service Provider NAT (SPNAT) and Service Provider IPv6 Transition

`Service Provider NAT (SPNAT)`는 NAT 기능을 customer premises가 아니라 ISP network 안으로 옮기는 방식이다. `Carrier-Grade NAT (CGN)` 또는 `Large-Scale NAT (LSN)`라고도 부른다. 목적은 더 많은 ISP customer가 더 적은 public IPv4 address를 공유하게 해 IPv4 depletion을 완화하는 것이다.

기능적으로는 일반 NAT와 비슷하지만, domain of use가 달라진다. NAT 위치가 customer edge에서 ISP edge로 이동하면 사용자는 incoming connection을 받을 수 있는지, Internet server를 운영할 수 있는지, firewall policy를 직접 통제할 수 있는지에서 제약을 받는다. 특히 peer-to-peer application처럼 incoming connection을 받는 사용자는 SPNAT의 영향을 크게 받을 수 있다.

IPv6는 장기적 해결책이지만, 실제 deployment가 늦어지면서 dual-stack, tunneling, address translation, SPNAT가 섞인 transition architecture가 등장했다. 이후 7.6에서 DS-Lite와 IPv4/IPv6 translation이 이 맥락에서 설명된다.

### 7.4 NAT Traversal

`NAT traversal`은 NAT 장비 안에 모든 application별 ALG/NAT editor를 넣는 대신, application이나 helper protocol이 NAT 바깥에서 보이는 address/port를 알아내고 그에 맞춰 통신을 시도하는 접근이다. server가 relay처럼 traffic을 복사해 줄 수도 있지만, 이는 bandwidth와 abuse 위험 때문에 보통 last resort로 취급된다. 가능한 경우에는 peer끼리 직접 통신하게 만드는 것이 목표다.

NAT traversal은 peer-to-peer file sharing, network game, VoIP/communication application에서 특히 중요하다. 문제는 NAT behavior가 다양하고 application마다 자체 해결책을 만들면 중복과 interoperability 문제가 커진다는 점이다. 그래서 STUN, TURN, ICE 같은 공통 building block이 등장했다.

### 7.4.1 Pinholes and Hole Punching

NAT mapping이 만들어지면 특정 application flow가 NAT를 통과할 수 있는 좁은 구멍이 생긴다. 이런 임시 mapping을 `pinhole`이라고 부른다. pinhole은 보통 하나의 application flow, 즉 특정 IP address/port pair에 제한되고, application 실행 중에 동적으로 만들어졌다가 사라진다.

`hole punching`은 NAT 뒤에 있는 두 client가 직접 통신하도록 각자의 NAT에 pinhole을 만드는 기법이다. 전형적인 절차는 다음과 같다.

1. client A가 public server S에 outbound traffic을 보내 NAT N1에 mapping을 만든다.
2. client B도 S에 outbound traffic을 보내 자기 NAT N2/N3에 mapping을 만든다.
3. S는 A와 B 각각의 external address/port를 알게 된다.
4. S가 A에게 B의 external address/port를, B에게 A의 external address/port를 알려 준다.
5. A와 B가 서로의 external endpoint로 직접 packet을 보내 각 NAT의 filtering 조건을 통과하려 한다.

![Figure 7-7](@/assets/images/116_Figure_7_7_page_357.png)
<p align="center"><sub>Figure 7-7 · PDF p. 357 · rendezvous server가 NAT 뒤 client들의 external endpoint 정보를 교환해 hole punching을 돕는 구조</sub></p>

hole punching이 성공하려면 NAT behavior가 중요하다. 모든 NAT가 `endpoint-independent mapping/filtering`에 가깝다면 server S를 통해 배운 external endpoint로 direct communication이 가능할 수 있다. 하지만 address-dependent 또는 address-and-port-dependent mapping/filtering이 있으면, NAT가 S가 아닌 peer에서 온 packet을 거부하거나 다른 mapping을 만들어 직접 통신이 실패할 수 있다. double NAT 환경에서는 어떤 server를 기준으로 보느냐에 따라 "외부 address"가 달라지는 문제도 생긴다.

### 7.4.2 UNilateral Self-Address Fixing (UNSAF)

application이 NAT와 직접 협의하지 않고, 외부 server와 traffic을 주고받으며 자신이 어떤 external address/port로 보이는지 추론하는 방식을 `UNilateral Self-Address Fixing (UNSAF)`라고 한다. "fixing"은 address를 고정한다는 뜻이라기보다, 자기 traffic이 NAT를 통과할 때 어떤 addressing information을 갖는지 배우고 유지한다는 뜻에 가깝다.

UNSAF는 장기적으로 바람직한 architectural solution은 아니지만, 다양한 NAT가 이미 배포된 현실에서는 필요한 임시 해법이다. 문제는 heuristic에 의존하므로 모든 NAT에서 보장되지 않는다는 점이다. NAT가 여러 단계로 겹치거나, server마다 보이는 external realm이 다르거나, NAT behavior가 시간에 따라 바뀌면 application이 얻은 정보가 실제 peer 통신에 맞지 않을 수 있다.

IAB는 UNSAF protocol proposal이 다음을 분명히 해야 한다고 요구했다.

| 요구사항 | 의미 |
|---|---|
| limited-scope problem | 이 임시 UNSAF가 해결하려는 문제 범위를 좁게 정의 |
| exit strategy/transition plan | 장기적으로 더 나은 구조로 빠져나갈 계획 |
| brittleness 설명 | 어떤 설계 결정이 깨지기 쉬운지 명시 |
| long-term requirements | 장기적이고 sound한 해결책이 만족해야 할 요구사항 |
| practical issues | 이미 알려진 운영 경험과 문제점 |

### 7.4.3 Session Traversal Utilities for NAT (STUN)

`Session Traversal Utilities for NAT (STUN)`은 UNSAF와 NAT traversal의 기본 도구다. 원래 `Simple Traversal of UDP through NATs` 성격의 classic STUN에서 발전했고, 현재는 여러 protocol이 NAT traversal을 수행할 때 사용할 수 있는 generic tool로 정리되었다. 완전한 NAT traversal solution은 보통 ICE나 SIP-Outbound 같은 framework가 담당하고, STUN은 그 안의 특정 `STUN usage`로 쓰인다.

STUN의 기본 역할은 client가 NAT 바깥에서 어떤 IP address/port로 보이는지 알아내게 하는 것이다. STUN server는 NAT 반대편, 즉 client가 알고 싶은 realm 쪽에 있어야 한다. client가 STUN request를 보내면 server는 자신이 관찰한 client의 external endpoint를 response에 담아 돌려준다. 이 external endpoint를 `reflexive transport address` 또는 `mapped address`라고 한다.

STUN은 UDP, TCP, TCP/TLS 위에서 동작할 수 있다. 기본 port는 UDP/TCP `3478`, TCP/TLS `3479`다. STUN base protocol의 transaction은 response가 필요한 `request/response transaction`과 response가 없는 `indication transaction`으로 나뉜다.

![Figure 7-8](@/assets/images/117_Figure_7_8_page_360.png)
<p align="center"><sub>Figure 7-8 · PDF p. 360 · STUN header: message type, length, magic cookie, transaction ID, attributes</sub></p>

STUN message는 항상 처음 2 bits가 0이고, 기본 header는 20 bytes다. 주요 field는 다음과 같다.

| STUN field | 크기/값 | 역할 |
|---|---|---|
| Message Type | method + class | binding/allocate/refresh 같은 method와 request/response/error/indication class 표현 |
| Message Length | 16 bits | header 20 bytes를 제외한 STUN message length, 4-byte alignment |
| Magic Cookie | `0x2112A442` | STUN 식별과 XOR-MAPPED-ADDRESS 계산에 사용 |
| Transaction ID | 96 bits random | request/response matching, indication debugging |
| Attributes | TLV list | MAPPED-ADDRESS, XOR-MAPPED-ADDRESS, USERNAME 등 |

UDP 위 STUN은 reliability가 없으므로 application이 retransmission을 구현해야 한다. retransmission timer는 peer까지의 `RTT (round-trip time)` 추정에 기반한다. TCP/TLS 위에서 동작하면 reliability는 TCP가 제공한다. UDP datagram은 fragmentation을 피하기 위해 path MTU보다 작게 유지해야 하며, path MTU를 모르면 IPv4는 전체 datagram 576 bytes 미만, IPv6는 1280 bytes 미만이 권장된다.

STUN attribute는 `Type-Length-Value (TLV)` 구조다. type과 length는 각각 16 bits이고, value는 4-byte boundary로 padding된다. type number가 `0x8000`보다 작으면 `comprehension-required attribute`, 크거나 같으면 `comprehension-optional attribute`다. receiver가 모르는 required attribute를 만나면 error를 생성해야 한다.

STUN의 핵심 attribute는 다음과 같다.

| attribute | 의미 |
|---|---|
| `MAPPED-ADDRESS` | server가 본 client의 reflexive transport address |
| `XOR-MAPPED-ADDRESS` | MAPPED-ADDRESS를 magic cookie/transaction ID로 XOR한 값 |
| `USERNAME` | integrity check에 필요한 credential 식별 |
| `MESSAGE-INTEGRITY` | STUN message에 대한 MAC |
| `ERROR-CODE` | error class/code와 설명 |
| `REALM` | long-term credential에서 authentication realm |
| `NONCE` | replay 방지를 위한 nonrepeated value |
| `SOFTWARE` | client/server software 식별 문자열 |
| `FINGERPRINT` | STUN message CRC-32 기반 fingerprint |

`XOR-MAPPED-ADDRESS`가 중요한 이유는 generic ALG가 payload 안의 IP address를 무작정 찾아 rewrite하는 문제를 피하기 위해서다. STUN은 application payload 안의 address를 정확히 보존해야 하는데, brittle ALG가 이를 바꿔버리면 address discovery 결과가 망가진다. XOR encoding은 그런 ALG가 address를 IP address로 오인해 바꾸는 일을 줄인다.

STUN binding request/response 예시에서는 client가 random Transaction ID와 `SOFTWARE` attribute를 넣어 request를 보내고, response의 `MAPPED-ADDRESS`와 `XOR-MAPPED-ADDRESS`를 통해 server-reflexive address를 얻는다. 원문 예시에서는 server가 client를 `71.134.182.214:33294`로 보았고, 이 값이 NAT 바깥에서 peer에게 알려 줄 후보 address가 된다.

STUN은 authentication과 message integrity도 제공한다. `short-term credential mechanism`은 단일 session 동안 유효한 credential을 사용하고, `USERNAME`과 `MESSAGE-INTEGRITY`가 request에 포함된다. `long-term credential mechanism`은 account/login 같은 오래 지속되는 credential을 사용하며, server가 먼저 `REALM`과 `NONCE`를 돌려주고 client가 이를 포함한 authenticated request를 다시 보낸다. NONCE는 replay attack을 막는 데 사용된다.

### 7.4.4 Traversal Using Relays around NAT (TURN)

`Traversal Using Relays around NAT (TURN)`은 직접 통신이 어려운 NAT 환경에서 public relay server를 통해 traffic을 중계하는 방법이다. 모든 NAT가 BEHAVE 권고처럼 잘 동작한다면 TURN은 거의 필요 없겠지만, 실제에는 endpoint-dependent filtering, double NAT, restrictive NAT가 존재하므로 last resort가 필요하다.

TURN client는 보통 public Internet의 TURN server에 접속하고, server는 client를 대신해 peer와 통신할 `relayed transport address`를 할당한다. client 자신이 NAT 밖에서 어떻게 보이는지는 `server-reflexive transport address`이고, TURN server가 peer에게 알려 줄 중계 endpoint가 relayed transport address다. peer들도 각각 host transport address와 server-reflexive transport address를 가질 수 있다. 이 주소들을 어떻게 교환할지는 TURN 자체의 범위가 아니며, 보통 ICE 같은 signaling/framework가 담당한다.

![Figure 7-11](@/assets/images/120_Figure_7_11_page_366.png)
<p align="center"><sub>Figure 7-11 · PDF p. 366 · TURN server가 client와 peer 사이 traffic을 relay하는 last-resort NAT traversal 구조</sub></p>

TURN server에는 `allocation`이 만들어진다. allocation은 multiway NAT binding과 비슷하며, client에게 할당된 unique relayed transport address와 그 주소로 통신할 peer 관련 state를 포함한다. client-server 구간은 UDP, TCP, TCP/TLS가 가능하고, server-peer 구간은 UDP 중심이다. 확장으로 TCP와 IPv6, IPv4/IPv6 간 relaying도 지원된다.

TURN의 기본 운용 흐름은 다음과 같다.

| 단계 | TURN/STUN method 또는 동작 | 의미 |
|---|---|---|
| 1 | `Allocate` request | client가 relayed transport address allocation 요청 |
| 2 | 401 Unauthorized + `REALM`, `NONCE` | long-term credential mechanism에 따라 인증 challenge |
| 3 | authenticated `Allocate` request | `USERNAME`, `REALM`, `NONCE`, `MESSAGE-INTEGRITY` 포함 |
| 4 | success + `XOR-RELAYED-ADDRESS` | server가 relayed transport address 할당 |
| 5 | `Refresh` | allocation lifetime 유지, 0 lifetime이면 삭제 |
| 6 | `CreatePermission` | 특정 peer IP address에서 온 traffic만 client로 forward 허용 |
| 7 | `Send`/`Data` indication 또는 `ChannelBind` | data relay 수행, channel은 overhead가 더 작음 |

allocation은 client/server 사이 transport 5-tuple로 식별된다. client 관점에서는 client host transport address/port, server transport address/port, transport protocol이 포함된다. server 관점에서는 client host address 대신 client의 server-reflexive address/port가 쓰인다.

TURN allocation은 refresh하지 않으면 기본적으로 10분 정도 후 만료된다. permission은 더 짧아 5분 안에 refresh되지 않으면 삭제된다. allocation이 삭제되면 관련 channel도 사라진다. 이 timeout 구조는 relay resource를 무한히 점유하지 않기 위한 장치다.

TURN은 STUN을 확장해 다음 method를 추가한다.

| TURN method | 역할 |
|---|---|
| `Allocate` | allocation 생성 |
| `Refresh` | allocation 갱신 또는 lifetime 0으로 삭제 |
| `Send` | client -> server -> peer data indication |
| `Data` | peer -> server -> client data indication |
| `CreatePermission` | peer source address 제한 permission 생성/갱신 |
| `ChannelBind` | peer와 16-bit channel number 연결 |

`Send`와 `Data`는 STUN-formatted indication이라 authentication이 붙지 않고 header overhead가 크다. `channel`은 4-byte header를 사용해 overhead가 작고, VoIP처럼 작은 packet을 자주 보내 latency와 overhead에 민감한 application에 유리하다. 하나의 allocation에는 최대 약 16K channel을 연결할 수 있다.

TURN의 단점은 분명하다. 모든 media/data가 relay server를 지나므로 경로가 비효율적일 수 있고, bandwidth 비용과 abuse 위험이 커진다. 또한 TURN client는 STUN long-term credential mechanism을 구현하고 TURN server operator가 제공한 account/login credential을 가져야 한다. 이는 open relay 남용을 막는 데 필요하지만 configuration complexity를 높인다. ICMP value, TTL/Hop Limit, IP DS Field 같은 일부 IP-level 정보는 peer에서 client로 그대로 전달되지 않는다.

### 7.4.5 Interactive Connectivity Establishment (ICE)

`Interactive Connectivity Establishment (ICE)`는 여러 NAT traversal 수단을 조합해 UDP-based application이 가능한 최선의 경로를 찾게 하는 framework다. ICE는 STUN과 TURN을 함께 사용하고, 다양한 NAT behavior에서 비교적 예측 가능한 방식으로 UNSAF를 수행한다. 실무에서는 SIP/SDP 기반 VoIP에서 media stream의 NAT traversal에 많이 쓰이지만, Jingle/XMPP 같은 다른 application에도 적용된다.

ICE의 핵심은 candidate transport address를 모으고 우선순위를 매긴 뒤, 실제 STUN check로 usable pair를 찾는 것이다.

| ICE candidate type | 의미 | 선호도 |
|---|---|---|
| host candidate | local interface에 직접 assigned된 transport address | 직접 연결 가능하면 가장 좋음 |
| server-reflexive candidate | STUN server가 관찰한 NAT external address/port | NAT를 통과하되 relay는 없음 |
| relayed candidate | TURN server가 할당한 relayed transport address | 가장 잘 통하지만 relay 비용이 큼 |
| peer-reflexive candidate | connectivity check 과정에서 새로 발견된 reflexive address | 경로에 따라 동적으로 추가 |

ICE 절차는 보통 다음 순서로 진행된다.

1. 각 agent가 host, server-reflexive, relayed candidate를 수집한다.
2. candidate마다 priority를 계산한다. 직접성이 높은 주소가 relayed address보다 높은 priority를 받는다.
3. offer/answer protocol, 예를 들어 SDP를 통해 candidate list를 peer에게 보낸다.
4. 각 agent는 local/remote candidate를 짝지어 candidate pair 목록을 만든다.
5. STUN binding request/response로 connectivity check를 수행한다.
6. valid pair가 발견되면 controlling agent가 사용할 pair를 nominate한다.
7. 선택된 candidate pair가 media/data path로 사용된다.

ICE에는 `controlling agent`와 `controlled agent`가 있다. controlling agent가 어떤 valid candidate pair를 최종 사용할지 nominate한다. 모든 pair를 확인한 뒤 선택하는 방식은 `regular nomination`, 처음 viable pair를 바로 선택하는 방식은 `aggressive nomination`이다. nomination은 STUN message의 flag/attribute로 표현된다.

ICE check는 STUN binding request로 수행되고, STUN short-term credential mechanism과 `FINGERPRINT` attribute를 사용해 integrity를 확인한다. peer가 보낸 check 때문에 일정이 앞당겨지는 `triggered check`도 있다. TURN을 사용하는 경우에는 TURN permission을 remote candidate address에 맞춰 제한해 relay binding을 좁힌다.

ICE implementation에는 `Full`과 `Lite`가 있다. Lite implementation은 NAT가 없는 system에 배치되는 것을 가정하고, 보통 STUN server처럼만 동작하며 full connectivity check를 수행하지 않는다. Full implementation은 candidate 수집, pair 생성, check, nomination을 수행한다. ICE가 STUN에 추가하는 attribute는 `PRIORITY`, `USE-CANDIDATE`, `ICE-CONTROLLED`, `ICE-CONTROLLING`이다.

### 7.5 Configuring Packet-Filtering Firewalls and NATs

NAT는 port forwarding을 쓰지 않는 단순 client-side 사용에서는 설정이 거의 필요 없을 수 있지만, firewall은 대개 명시적 policy가 필요하다. home network에서는 같은 box가 NAT, IP routing, firewall을 모두 제공하므로 Web UI나 command-line에서 설정이 섞여 보일 수 있다. 하지만 논리적으로는 routing, translation, filtering은 서로 다른 기능이다.

### 7.5.1 Firewall Rules

packet-filtering firewall은 traffic을 drop하거나 forward하기 위한 instruction set을 가져야 한다. 보통 이 instruction set을 `ACL (Access Control List)`이라고 부른다. ACL은 rule list이고, 각 rule은 match criteria와 action으로 구성된다.

| rule 구성 요소 | 예시 |
|---|---|
| network-layer field | source/destination IP address, protocol number |
| transport-layer field | TCP/UDP source/destination port, TCP flags |
| ICMP field | ICMP type/code |
| direction | incoming, outgoing, interface별 방향 |
| processing point | routing decision 전/후, 특정 interface/chain |
| action | ACCEPT/FORWARD, DROP/BLOCK, LOG, QUEUE 등 |

대부분 firewall은 ACL을 위에서 아래로 순서대로 검사하고, 첫 번째 matching rule의 action을 적용한다. 따라서 rule 순서가 policy의 일부다. 예를 들어 넓은 allow rule을 위에 두면 뒤의 세밀한 deny rule이 도달하지 않을 수 있다. match되지 않은 packet에 적용할 default policy도 중요하며, 보수적 구성에서는 default DROP이 흔하다.

Linux의 `iptables`는 `NetFilter` 기반 firewall/NAT 도구다. iptables는 table과 chain 개념을 사용한다.

| iptables table | 주요 chain | 역할 |
|---|---|---|
| `filter` | `INPUT`, `FORWARD`, `OUTPUT` | 기본 packet filtering |
| `nat` | `PREROUTING`, `OUTPUT`, `POSTROUTING` | NAT/NAPT address/port rewriting |
| `mangle` | 여러 chain | packet의 arbitrary rewriting/marking |

`INPUT`은 firewall/router 자신이 destination인 packet, `FORWARD`는 router를 통과해 routing되는 packet, `OUTPUT`은 firewall machine이 생성한 packet에 적용된다. rule의 action은 `target`이라고 부르며, 대표 target은 다음과 같다.

| target | 의미 |
|---|---|
| `ACCEPT` | packet 허용 |
| `DROP` | packet 폐기 |
| `QUEUE` | user program으로 넘겨 임의 처리 |
| `RETURN` | 이전 chain으로 돌아가 processing 계속 |

원문의 iptables 예시는 default policy를 INPUT/OUTPUT/FORWARD 모두 DROP으로 두고, loopback traffic은 허용하며, 내부 interface로 들어오는 DHCP broadcast traffic을 허용하고, TCP flags가 모두 0인 이상한 TCP segment를 DROP한다. 구체 syntax보다 중요한 점은 firewall이 interface, protocol, address, port, TCP flags를 조합해 rule을 만들 수 있다는 것이다.

### 7.5.2 NAT Rules

NAT rule은 firewall rule과 함께 설정되는 경우가 많다. Windows에서는 단순 NAT 공유 기능이 `Internet Connection Sharing (ICS)`로 제공되었고, Linux에서는 `IP masquerading`이라는 이름으로 흔히 쓰였다.

ICS는 internal IPv4 address를 `192.168.0.1`로 설정하고 DHCP server와 DNS server를 함께 켜는 식으로 동작할 수 있다. 따라서 이미 다른 DHCP/DNS/router가 있는 network에서 켜면 address pool, DNS, routing policy가 충돌할 수 있다. Windows firewall의 service definition은 port forwarding과 같은 역할을 하며, external interface port와 internal server/port를 지정해 incoming connection용 NAPT를 구성한다.

Linux masquerading 예시는 `nat` table의 `POSTROUTING` chain에서 external interface로 나가는 `192.168.0.0/24` source traffic에 `MASQUERADE` target을 적용한다. 이후 stateful filtering을 이용해 외부 interface에서 들어오는 `NEW` 또는 `INVALID` traffic을 DROP한다. 핵심은 NAT가 만든 state를 firewall filtering에 활용할 수 있다는 점이다.

| iptables/NAT 개념 | 의미 |
|---|---|
| `POSTROUTING` | routing decision 후, 외부 interface로 나가기 직전 source NAT 적용 가능 |
| `MASQUERADE` | external address가 동적으로 변할 수 있는 환경에서 source address를 interface address로 변환 |
| `NEW` | 기존 state에 속하지 않는 새 traffic |
| `INVALID` | connection tracking state와 맞지 않는 traffic |

### 7.5.3 Direct Interaction with NATs and Firewalls: UPnP, NAT-PMP, and PCP

일부 application은 firewall/NAT에 직접 요청해 pinhole이나 port mapping을 만들고 싶어 한다. 예를 들어 game, P2P, media server는 외부 peer가 자신에게 들어올 수 있게 NAT에 port forwarding을 자동 등록하려 한다. 이를 위한 대표 방식이 `UPnP`, `NAT-PMP`, `PCP`다.

`Universal Plug and Play (UPnP)`는 넓은 home network device control framework이고, NAT/firewall 제어는 그중 `Internet Gateway Device (IGD)` protocol로 제공된다. UPnP device는 먼저 DHCP로 address를 얻고, DHCP가 없으면 dynamic link-local address configuration을 쓸 수 있다. 이후 `SSDP (Simple Service Discovery Protocol)`가 device presence를 알리고 control point가 추가 정보를 질의한다. SSDP는 UDP 기반 HTTP 변형인 `HTTPU`, `HTTPMU`를 사용하며, IPv4 multicast `239.255.255.250:1900`이 자주 등장한다.

UPnP의 control/event notification은 `GENA (General Event Notification Architecture)`와 `SOAP (Simple Object Access Protocol)`를 사용한다. SOAP는 XML message 기반 RPC mechanism이다. IGD는 NAT mapping 조회와 port forwarding 설정을 지원한다. UPnP IGD version 2는 IPv6 지원을 추가한다.

`NAT Port Mapping Protocol (NAT-PMP)`는 UPnP보다 좁게 NAT 장치와 programmatic하게 통신하기 위한 Apple Bonjour 계열 protocol이다. 별도 discovery를 하지 않고, 보통 DHCP로 알게 된 default gateway를 managed NAT로 본다. NAT-PMP는 NAT의 outside address를 알아내고 port mapping을 설정하는 request/response protocol을 제공한다. outside address change event를 listener에게 알리는 multicast notification도 있다. 원문은 client/server interaction과 multicast event notification port를 `5350`, `5351`로 구분해 설명한다.

`Port Control Protocol (PCP)`는 NAT-PMP 아이디어를 SPNAT 환경까지 확장하려는 흐름에서 등장한다. 핵심은 client가 NAT/firewall에 명시적으로 "이 external mapping/pinhole을 만들어 달라"고 요청할 수 있게 해, application이 UNSAF heuristic에만 의존하지 않도록 하는 것이다.

| 방식 | 범위 | 특징 | 주의점 |
|---|---|---|---|
| UPnP IGD | home gateway device control framework 일부 | device discovery, NAT mapping/port forwarding 제어 | broad framework라 attack surface와 policy 통제가 중요 |
| NAT-PMP | NAT port mapping 전용 | default gateway 대상, 단순 request/response, address-change event | 주로 local network trust 가정 |
| PCP | NAT-PMP 확장 방향 | SPNAT/large-scale NAT까지 고려 | provider NAT policy와 인증/권한 문제가 중요 |

### 7.6 NAT for IPv4/IPv6 Coexistence and Transition

IPv4 address depletion 이후 IPv6 도입은 빨라졌지만, IPv4와 IPv6는 오랜 기간 함께 존재할 가능성이 크다. 모든 host와 service가 동시에 IPv6-only로 이동하지 않기 때문이다. 따라서 IPv4-only, IPv6-only, dual-stack system 사이의 communication을 지원하는 mechanism이 필요하다.

큰 접근은 두 가지다.

| 접근 | 의미 | 대표 |
|---|---|---|
| tunneling | 한 address family packet을 다른 address family packet 안에 캡슐화 | Teredo, DS-Lite, 6rd |
| translation | IPv4 packet과 IPv6 packet의 header/address를 실제로 변환 | SIIT, NAT64, ALG/DNS64 계열 |

### 7.6.1 Dual-Stack Lite (DS-Lite)

`Dual-Stack Lite (DS-Lite)`는 service provider가 core network를 IPv6-only로 운영하면서도 customer에게 IPv4 connectivity를 제공하기 위한 architecture다. 핵심은 customer side에서 IPv4 traffic을 IPv6 tunnel에 실어 provider edge로 보내고, provider edge에서 SPNAT를 수행하는 것이다.

![Figure 7-16](@/assets/images/125_Figure_7_16_page_379.png)
<p align="center"><sub>Figure 7-16 · PDF p. 379 · IPv6-only provider core에서 B4와 AFTR가 IPv4-in-IPv6 tunnel과 SPNAT를 제공하는 DS-Lite 구조</sub></p>

DS-Lite의 구성 요소는 다음과 같다.

| 구성 요소 | 위치 | 역할 |
|---|---|---|
| customer IPv4/IPv6 network | customer premises | 내부 host는 IPv4/IPv6 조합으로 동작 가능 |
| `B4 (Basic Bridging BroadBand)` element | customer edge | IPv4 service, DHCP/DNS proxy, IPv4-in-IPv6 tunnel 시작 |
| service provider IPv6 network | ISP core | IPv6 routing으로 tunnel packet 전달 |
| `AFTR (Address Family Transition Router)` element | provider edge | tunnel decapsulation/encapsulation, SPNAT 수행 |

IPv6 Internet 접근은 provider의 IPv6 routing으로 바로 처리된다. IPv4 Internet 접근은 B4가 customer IPv4 packet을 IPv6 tunnel로 encapsulate해 AFTR로 보내고, AFTR가 decapsulation 후 IPv4 Internet으로 NAT 처리해 보낸다. 돌아오는 IPv4 traffic은 AFTR가 customer tunnel endpoint identity를 이용해 어느 B4로 보낼지 구분한다. 이 덕분에 여러 customer가 같은 private IPv4 address space를 써도 provider edge에서 구분할 수 있다.

Chapter 6의 `6rd`와 DS-Lite는 방향이 반대다. 6rd는 provider IPv4 network 위에서 customer에게 IPv6 access를 제공하고, DS-Lite는 provider IPv6 network 위에서 customer에게 IPv4 access를 제공한다. 둘 다 tunnel과 address mapping을 사용하지만, 6rd는 stateless address-mapping algorithm 성격이 강하고, DS-Lite는 AFTR의 SPNAT state가 중요하다.

### 7.6.2 IPv4/IPv6 Translation Using NATs and ALGs

tunneling의 단점은 서로 다른 address family의 host/service가 직접 reachable하지 않다는 점이다. IPv6-only host가 IPv4-only server를 바로 사용할 수 없으면 legacy IPv4 Internet의 많은 service가 IPv6-only system에 닫힌다. 이를 해결하기 위해 IPv4/IPv6 direct translation framework가 만들어졌다.

과거 `NAT-PT`는 brittle하고 scalable하지 않다고 판단되어 deprecated되었다. 이후 framework는 `RFC 6144` 계열에서 stateful/stateless translation, DNS translation, ICMP/FTP 같은 protocol-specific ALG 필요성을 함께 다룬다.

### 7.6.2.1 IPv4-Converted and IPv4-Translatable Addresses

IPv4/IPv6 translation은 `IPv4-embedded IPv6 address`를 사용한다. IPv6 address 안에 IPv4 address를 algorithmically 넣고 빼는 구조다. 주소 범주는 다음 포함 관계로 기억할 수 있다.

```text
IPv4-translatable ⊂ IPv4-converted ⊂ IPv4-embedded ⊂ IPv6
```

translation 함수 표기는 원문 기준으로 다음처럼 이해하면 된다.

| 표기 | 의미 |
|---|---|
| `To4(A6, P)` | IPv6 address `A6`와 prefix `P`로부터 IPv4 address를 얻음 |
| `To6(A4, P)` | IPv4 address `A4`와 prefix `P`로부터 IPv6 address를 만듦 |

대부분의 경우 `A6 = To6(To4(A6, P), P)`와 `A4 = To4(To6(A4, P), P)`가 성립하도록 설계된다. 여기서 prefix `P`는 `Well-Known Prefix (WKP) 64:ff9b::/96` 또는 provider가 가진 `Network-Specific Prefix`다. WKP는 ordinary globally routable IPv4 address 표현에 사용되며 RFC 1918 private address나 IPv4-translatable address 생성에는 쓰지 않는다.

`64:ff9b::/96` WKP는 Internet checksum 관점에서 checksum-neutral하다. prefix를 16-bit word로 더하면 one's complement에서 0과 같은 `ffff`가 되어, IPv4 address를 WKP 뒤에 붙여 IPv6 address를 만들 때 TCP/UDP checksum 영향이 줄어든다. 적절한 Network-Specific Prefix도 checksum-neutral하게 고를 수 있다.

### 7.6.2.2 Stateless Translation

`Stateless IP/ICMP Translation (SIIT)`은 state table 없이 IPv4와 IPv6 packet을 변환하는 방식이다. table lookup 없이 IPv4-translatable address와 정해진 header translation rule을 사용한다. IPv4 options는 대부분 무시되고, IPv6 extension header도 Fragment header를 제외하면 대부분 변환되지 않는다. unexpired IPv4 Source Route option이 있으면 packet을 drop하고 ICMP Destination Unreachable/Source Route Failed error를 생성한다.

IPv4 -> IPv6 translation의 핵심 rule은 다음과 같다.

| IPv6 header field | IPv4에서 오는 값/처리 |
|---|---|
| Version | 6 |
| DS Field/ECN | IPv4의 같은 field 복사 |
| Flow Label | 0 |
| Payload Length | IPv4 Total Length - IPv4 header length |
| Next Header | IPv4 Protocol field, ICMPv4면 58, fragment 필요 시 Fragment header |
| Hop Limit | IPv4 TTL - 1, 0이면 drop 후 ICMP Time Exceeded |
| Source/Destination Address | `To6(IPv4 address, P)` |

IPv4 datagram이 너무 크고 DF bit가 set되어 있지 않거나, arriving IPv4 datagram 자체가 fragment이면 IPv6 Fragment header를 만들 수 있다. Fragment header의 offset, More Fragments bit, Identification low 16 bits는 IPv4 fragment 정보를 반영한다.

IPv6 -> IPv4 translation에서는 IPv6 header를 기반으로 새 IPv4 header를 만든다. unfragmented IPv6 datagram이라면 IPv4 IHL은 5, Total Length는 IPv6 Payload Length + 20, TTL은 Hop Limit - 1, Protocol은 적절한 Next Header에서 가져오며 ICMPv6(58)는 ICMPv4(1)로 바꾼다. IPv4 header checksum은 새로 계산한다. IPv6 Fragment header가 있으면 IPv4 fragment field를 Fragment header에서 가져오고 DF는 0으로 설정한다.

stateless translation은 per-flow state가 없다는 장점이 있지만, IPv4 address로 algorithmically 대응 가능한 IPv6 address 범위에서만 자연스럽다. IPv6 address space 전체의 host를 IPv4-only host가 임의로 접근할 수 있게 해 주지는 않는다.

### 7.6.2.3 Stateful Translation

`NAT64`는 IPv6-only client가 IPv4 server와 통신하게 하는 stateful translation 방식이다. header translation은 SIIT와 유사하지만, IPv6-to-IPv4 방향에서는 scarce IPv4 address pool을 동적으로 공유해야 하므로 NAPT 성격의 state가 필요하다. 즉 여러 IPv6 address가 하나의 IPv4 address와 port space를 공유할 수 있다.

NAT64는 BEHAVE specification에 맞춰 `endpoint-independent mapping`을 지원하고, filtering은 endpoint-independent 또는 address-dependent filtering을 지원한다. 그래서 STUN, TURN, ICE 같은 NAT traversal technique과의 호환성을 고려한다. 다만 별도 protocol이 없으면 NAT64는 기본적으로 IPv6 host가 먼저 IPv4 host로 통신을 시작하는 dynamic translation을 지원한다.

NAT64는 TCP, UDP, ICMP message translation을 정의한다. ICMP query/response의 경우 transport-layer port 대신 ICMP Identifier field를 사용한다. fragment 처리도 중요하다. NAT64는 TCP/UDP fragment를 처리해야 하며, fragment가 순서대로 오지 않아도 다뤄야 한다. fragment cache는 DoS 공격 표면이 될 수 있으므로 cache time limit을 둘 수 있고, 원문은 최소 2초 이상을 언급한다.

### 7.7 Attacks Involving Firewalls and NATs

firewall은 공격 노출을 줄이기 위해 배치되지만, 설정과 구현이 잘못되면 오히려 공격 표면이 된다. 원문이 강조하는 가장 흔한 문제는 incomplete/incorrect configuration이다. 특히 enterprise처럼 service가 많고 rule이 복잡한 환경에서는 rule order, default policy, stale exception을 관리하기 어렵다.

| 문제 유형 | 원리 | 결과 |
|---|---|---|
| misconfiguration | allow/drop rule 순서, interface, direction, default policy 오류 | 막아야 할 traffic 허용 또는 허용해야 할 traffic 차단 |
| NAT masquerade hijacking | 외부 interface에서 들어온 traffic까지 masquerade 대상이 됨 | attacker traffic이 NAT device에서 나온 것처럼 보임 |
| stale hole/port forwarding | 더 이상 쓰지 않는 service용 port forwarding/pinhole이 남음 | 폐기된 service 또는 host로 불필요한 접근 경로 유지 |
| rule merge confusion | 새 rule이 기존 rule set과 병합되는 동작을 운영자가 오해 | 예상과 다른 policy 형성 |
| IP fragment handling weakness | non-first fragment에는 transport header/port 정보가 없음 | filtering 우회, legitimate fragment drop, state exhaustion |

특히 오래된 Linux `ipchains` 기반 NAT/firewall에서 default forwarding policy를 masquerade로 두는 단순 설정은 위험하다. NAT 입장에서는 "들어온 packet의 source를 NAT address로 바꿔 forwarding"하는 정상 동작이지만, 그 packet이 inside가 아니라 outside에서 들어온 것이라면 attacker가 NAT를 자기 masquerading proxy처럼 악용할 수 있다.

fragment 문제는 TCP/IP layering에서 온다. IP datagram이 fragment되면 TCP/UDP header는 첫 fragment에만 있고, 이후 fragment에는 port number가 없다. stateless firewall은 non-first fragment만 보고 어떤 service traffic인지 판단하기 어렵다. stateful firewall은 first fragment를 기억해 연결할 수 있지만, reassembly 전 filtering, out-of-order fragment, fragment cache resource exhaustion 같은 문제가 남는다. 일부 firewall은 식별할 수 없는 fragment를 drop하는데, 이는 큰 datagram을 사용하는 legitimate traffic에도 영향을 줄 수 있다.

### 7.8 Summary

firewall은 end system을 직접 모두 고치기 어려운 현실에서 network boundary에서 harmful traffic flow를 제한하는 mechanism이다. 주요 유형은 packet-filtering firewall과 proxy firewall이다. packet-filtering firewall은 IP router처럼 동작하고, stateless/stateful로 나뉜다. stateful firewall은 transport association과 fragment 문맥을 더 잘 이해하지만 더 많은 state와 resource를 필요로 한다. proxy firewall은 ALG처럼 동작해 application-layer service마다 별도 proxy handler가 필요하지만 payload-level control이 가능하다.

NAT는 많은 host가 하나 이상의 globally routable IP address를 공유하게 하는 mechanism이다. home/enterprise NAT-firewall 조합에서는 내부 host가 Internet으로 나가는 traffic은 허용하고, 그 reply만 다시 들여보내는 policy가 흔하다. NAT 뒤 server는 port forwarding이 필요하고, SPNAT/CGN이 널리 쓰이면 home user가 Internet service를 직접 제공하기 더 어려워질 수 있다.

NAT traversal은 NAT 뒤 host가 사용할 수 있는 address/port candidate를 찾아 연결성을 확보하는 기술 묶음이다. UNSAF는 NAT 도움 없이 external mapping을 추론하는 heuristic이고, STUN은 server-reflexive address를 얻는 기본 도구다. TURN은 direct path가 안 될 때 relay server를 사용하는 last resort이며, ICE는 host/server-reflexive/relayed candidate를 모아 priority와 STUN check로 최선의 pair를 고른다.

firewall/NAT 설정은 home user에게는 단순 UI처럼 보일 수 있지만, 실제로는 ACL, stateful filtering, NAT table, port forwarding, direct control protocol이 얽혀 있다. UPnP와 NAT-PMP는 application이 NAT mapping을 자동으로 만들 수 있게 해 편의성을 높이지만, policy 통제와 attack surface도 함께 고려해야 한다. dynamic public address 뒤에서 server를 운영하려면 port forwarding뿐 아니라 dynamic DNS 같은 이름 관리도 필요할 수 있다.

### 7.9 References

이 장의 표준 축은 다음처럼 묶어 기억하면 된다.

| 주제 | 대표 reference | 연결되는 내용 |
|---|---|---|
| private address/NAT 기본 | RFC 1918, RFC 3022, RFC 3027, RFC 3235 | private IPv4 block, traditional NAT/NAPT, NAT-friendly application |
| proxy/application protocols | RFC 0959, RFC 1928, RFC 2616, RFC 5411 | FTP, SOCKS, HTTP, SIP와 NAT/ALG 문제 |
| NAT behavior | RFC 4787, RFC 5382, RFC 5508, RFC 5135 | UDP/TCP/ICMP/multicast NAT behavior |
| NAT traversal | RFC 3424, RFC 5128, RFC 5389, RFC 5766, RFC 5245, RFC 5780 | UNSAF, hole punching, STUN, TURN, ICE |
| media/session signaling | RFC 3264, RFC 3550, RFC 3711, RFC 5626 | SDP offer/answer, RTP/SRTP, SIP Outbound |
| IPv6/NAT transition | RFC 4193, RFC 4213, RFC 4864, RFC 5902, RFC 6296, RFC 6333, RFC 6334 | ULA, dual stack, LNP, IPv6 NAT thoughts, NPTv6, DS-Lite |
| IPv4/IPv6 translation | RFC 6052, RFC 6144, RFC 6145, RFC 6146 | IPv4-embedded IPv6 address, SIIT, NAT64 |
| direct NAT control | UPnP IGD, NAT-PMP, PCP drafts | port mapping/pinhole control |

## 연결 관계

이 장은 Chapter 2의 IP address architecture, Chapter 5의 IP header/checksum/fragmentation, Chapter 6의 DHCP/PPPoE/edge configuration을 실제 Internet edge 장비 관점에서 묶는다. NAT는 address realm을 연결하고, firewall은 어떤 traffic이 그 realm 사이를 지나갈지 결정한다.

transport layer와도 강하게 연결된다. TCP NAT는 SYN/ACK/FIN/RST와 timer를 보고 state를 관리하고, UDP NAT는 lifecycle signal이 없으므로 mapping timeout에 의존한다. ICMP는 error message 안의 offending datagram까지 rewrite해야 하므로 Chapter 8과 직접 이어진다.

application layer와의 연결도 중요하다. FTP, SIP, RTP/VoIP, HTTP proxy, SOCKS, STUN/TURN/ICE는 모두 NAT/firewall이 transport endpoint와 payload를 어떻게 다루는지에 영향을 받는다. application이 payload 안에 address/port를 넣으면 NAT-friendly design이나 ALG/NAT editor가 필요해진다.

IPv6 transition에서는 Chapter 6의 6rd, 이 장의 DS-Lite, NAT64/SIIT가 이어진다. 6rd는 IPv4 provider network 위에 IPv6를 얹고, DS-Lite는 IPv6 provider core 위에 IPv4를 얹으며, NAT64/SIIT는 address family를 직접 변환한다.

## 오해하기 쉬운 내용

| 헷갈리는 지점 | 정확한 이해 |
|---|---|
| NAT는 firewall이다 | NAT는 address/port translation이고, firewall-like filtering은 흔한 결합 기능 또는 부수 효과다 |
| private address는 Internet에서 절대 쓸 수 없다 | private realm 내부에서는 쓸 수 있지만 public Internet routing에는 쓰이지 않는다 |
| Basic NAT와 NAPT는 같다 | Basic NAT는 IP address만 바꾸고, NAPT는 port/query ID까지 바꿔 다수 host를 multiplexing한다 |
| endpoint-independent mapping이면 filtering도 endpoint-independent다 | mapping behavior와 filtering behavior는 별개이며, 같은 용어를 쓰지만 의미가 다르다 |
| port forwarding은 동적 NAT와 같다 | port forwarding은 외부 port를 내부 server로 고정 연결하는 static mapping에 가깝다 |
| STUN만 있으면 NAT traversal이 항상 된다 | restrictive NAT나 double NAT에서는 실패할 수 있고 TURN/ICE가 필요할 수 있다 |
| TURN이 가장 좋은 traversal 방식이다 | TURN은 성공률은 높지만 relay 비용이 커서 last resort다 |
| ICE는 하나의 새 transport protocol이다 | ICE는 STUN/TURN과 signaling을 조합해 candidate pair를 선택하는 framework다 |
| UPnP/NAT-PMP는 항상 켜도 안전하다 | 자동 port mapping은 편리하지만 local trust, 권한, attack surface를 고려해야 한다 |
| IPv6에서는 NAT가 완전히 사라진다 | address 절약용 NAT는 덜 필요하지만 prefix translation, NAT64, provider transition 기술은 여전히 존재한다 |

## 면접 질문

1. packet-filtering firewall과 proxy firewall을 동작 계층, endpoint 여부, 장단점 관점에서 비교하라.
2. stateless firewall이 IP fragment에 취약하거나 곤란한 이유를 설명하라.
3. NAT가 `smart edge, dumb middle` 원칙과 충돌하는 이유를 state, checksum, application payload 관점에서 설명하라.
4. Basic NAT와 NAPT의 차이를 public IPv4 address 절약 효과 중심으로 설명하라.
5. TCP NAT가 SYN/ACK/FIN/RST와 timer를 이용해 NAT mapping을 만들고 제거하는 방식을 설명하라.
6. UDP NAT에서 mapping timeout과 outbound/inbound refresh behavior가 중요한 이유를 설명하라.
7. endpoint-independent mapping, address-dependent mapping, address-and-port-dependent mapping을 예로 구분하라.
8. mapping behavior와 filtering behavior가 NAT traversal에 미치는 영향을 설명하라.
9. server behind NAT를 외부에 공개하려면 왜 port forwarding이 필요한가?
10. hairpinning/NAT loopback이 필요한 상황과 source address behavior가 중요한 이유를 설명하라.
11. FTP나 SIP 같은 protocol이 NAT editor/ALG를 필요로 하는 이유를 설명하라.
12. STUN의 `MAPPED-ADDRESS`, `XOR-MAPPED-ADDRESS`, `Transaction ID`, `Magic Cookie`의 역할을 설명하라.
13. TURN allocation, permission, channel이 각각 무엇이며 왜 TURN은 last resort인가?
14. ICE에서 host, server-reflexive, relayed, peer-reflexive candidate가 무엇인지 설명하라.
15. iptables의 `filter`, `nat`, `mangle` table과 `INPUT`, `FORWARD`, `OUTPUT`, `POSTROUTING` chain의 의미를 설명하라.
16. UPnP IGD, NAT-PMP, PCP가 NAT traversal heuristic과 어떻게 다른지 설명하라.
17. DS-Lite에서 B4와 AFTR가 맡는 역할을 설명하고, 6rd와 방향이 어떻게 다른지 비교하라.
18. SIIT와 NAT64의 차이를 stateless/stateful, address pool, IPv6-only client 관점에서 설명하라.
