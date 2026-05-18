---
title: "Chapter 7. Wireless and Mobile Networks"
order: 7
pubDatetime: 2026-05-17T00:02:00+09:00
modDatetime: 2026-05-17T00:02:00+09:00
description: "Computer Networking Top-Down 정리: Chapter 7. Wireless and Mobile Networks"
tags:
  - "ComputerNetwork"
  - "CS"
  - "TopDown"
---

## 개요

Wireless and mobile networks는 wired network와 같은 Internet protocol stack 위에서 동작하지만, link layer와 network layer에서 완전히 다른 문제가 나타난다. Wireless는 전송 매체가 radio channel이라 signal attenuation, interference, multipath propagation, hidden terminal, 높은 bit error rate가 생기는 문제이고, mobility는 host의 point of attachment가 시간에 따라 바뀌어 addressing, routing, handoff/handover, session continuity가 어려워지는 문제다.

이 장은 두 문제를 분리해 본다. 먼저 wireless link의 물리적/링크 계층 특성과 Wi-Fi/IEEE 802.11, Bluetooth, 4G/5G cellular network를 살펴보고, 이후 mobile device가 home network를 떠나 visited network에 있을 때 datagram을 어떻게 찾아 보내는지, 4G/5G와 Mobile IP가 mobility management를 어떻게 구현하는지 정리한다.

## 핵심 개념

### 7.1 Introduction

Wireless network의 기본 구성 요소는 `wireless host`, `wireless link`, `base station`, `network infrastructure`다. Wireless host는 smartphone, laptop, tablet뿐 아니라 sensor, appliance, automobile 같은 IoT device일 수 있고, mobile일 수도 아닐 수도 있다. Wireless link는 host와 base station 또는 host와 host를 radio communication으로 연결하며, link technology마다 transmission rate, coverage range, channel condition이 다르다.

![Figure 7.1](@/assets/images/cs-computer-network-205-figure-7-1-page-544.png)
*Figure 7.1 · PDF p. 544 · wireless host, wireless access point, coverage area, network infrastructure의 관계*

`base station`은 wireless host와 larger network 사이의 relay 역할을 한다. Cellular network의 cell tower, 802.11 wireless LAN의 `access point (AP)`가 대표적인 base station이다. Wireless host가 어떤 base station과 `associated`되어 있다는 말은, host가 그 base station의 communication range 안에 있고, 그 base station을 통해 larger network와 데이터를 주고받는다는 뜻이다.

![Figure 7.2](@/assets/images/cs-computer-network-206-figure-7-2-page-545.png)
*Figure 7.2 · PDF p. 545 · WiFi, 4G/5G cellular, Bluetooth의 대략적 transmission rate와 coverage range 비교*

Base station을 통해 address assignment, routing 같은 traditional network services를 받는 방식을 `infrastructure mode`라고 한다. 반대로 `ad hoc networks`에서는 base station이 없으므로 wireless hosts가 routing, address assignment, DNS-like name translation 같은 기능을 스스로 제공해야 한다. 이 차이는 뒤에서 Bluetooth, wireless mesh, MANET, VANET을 이해할 때 중요한 기준이 된다.

Host가 한 base station의 범위를 벗어나 다른 base station 범위로 들어가면 point of attachment가 바뀐다. 이 과정을 `handoff` 또는 `handover`라고 한다. Mobility가 어려운 이유는 이때 host의 현재 위치를 찾아야 하고, addressing/routing이 바뀌어야 하며, TCP connection이나 phone call 같은 ongoing session이 끊기지 않아야 하기 때문이다.

Wireless network는 두 기준으로 분류할 수 있다. 첫째, packet이 wireless network 안에서 single wireless hop만 지나는가, multiple wireless hops를 지나는가. 둘째, base station 같은 infrastructure가 있는가 없는가.

| 분류 | 특징 | 대표 예 |
| --- | --- | --- |
| `single-hop, infrastructure-based` | base station이 wired network에 연결되고 host는 base station과 한 wireless hop으로 통신 | Wi-Fi access network, 4G LTE data network |
| `single-hop, infrastructure-less` | wired infrastructure는 없지만 한 node가 다른 node transmissions를 조정할 수 있음 | Bluetooth piconet |
| `multi-hop, infrastructure-based` | base station은 있지만 일부 wireless nodes가 relay를 거쳐야 함 | wireless sensor network, wireless mesh network |
| `multi-hop, infrastructure-less` | base station 없이 nodes가 서로 여러 hop으로 relay | `MANET`, `VANET` |

이 장의 대부분은 실제 일상에서 가장 흔한 `single-hop, infrastructure-based` wireless networks에 초점을 둔다. 즉 Wi-Fi AP나 cellular base station을 통해 Internet에 붙는 상황이 중심이다.

## 세부 정리

### 7.2 Wireless Links and Network Characteristics

Wireless link는 wired link보다 훨씬 불안정하다. 주요 원인은 세 가지다. 첫째, `decreasing signal strength` 또는 `path loss`다. Electromagnetic radiation은 벽 같은 물체를 통과할 때 약해지고, 자유 공간에서도 거리가 멀어질수록 퍼져 signal strength가 감소한다. 둘째, 같은 frequency band를 쓰는 다른 radio source나 microwave, motor 같은 environmental noise가 만드는 `interference`다. 예를 들어 2.4 GHz wireless phone과 802.11b wireless LAN은 같은 대역에서 서로 방해할 수 있다. 셋째, `multipath propagation`이다. 전파가 물체나 지면에 반사되어 서로 다른 길이의 path로 receiver에 도착하면 received signal이 blur되고, 움직이는 물체가 있으면 이 효과가 시간에 따라 변한다.

이 때문에 wireless link에서는 wired link보다 bit errors가 흔하다. 그래서 802.11 같은 wireless link protocol은 강한 `CRC error detection`뿐 아니라 corrupted frame을 다시 보내는 link-level reliable-data-transfer protocol, 즉 ACK/retransmission 기반 `ARQ`를 함께 사용한다. Chapter 6에서 wired Ethernet이 unreliable service로 충분했던 것과 대비된다.

Wireless receiver는 sender가 보낸 original signal의 약해지고 왜곡된 형태와 background noise가 합쳐진 electromagnetic signal을 받는다. `SNR (signal-to-noise ratio)`는 received signal strength와 noise strength의 상대적 비율이며 보통 `dB (decibel)`로 표현한다. SNR이 클수록 receiver가 noise 속에서 transmitted signal을 더 쉽게 추출한다.

![Figure 7.3](@/assets/images/cs-computer-network-207-figure-7-3-page-548.png)
*Figure 7.3 · PDF p. 548 · SNR, BER, modulation technique, transmission rate의 관계*

`BER (bit error rate)`는 전송된 bit가 receiver에서 잘못 수신될 확률에 가깝다. Figure 7.3은 higher-layer protocol을 이해하는 데 중요한 세 가지 원리를 보여준다.

| 조건 | 결과 | 설계상 의미 |
| --- | --- | --- |
| 같은 modulation scheme에서 SNR 증가 | BER 감소 | transmission power를 높이면 error를 줄일 수 있지만 battery 소모와 interference가 증가한다. |
| 같은 SNR에서 더 높은 bit rate modulation 사용 | BER 증가 | 빠른 modulation은 channel condition이 충분히 좋을 때만 유리하다. |
| SNR/BER가 시간에 따라 변함 | modulation/coding을 동적으로 선택 | Wi-Fi와 4G/5G는 `adaptive modulation and coding`으로 channel condition에 맞춰 rate와 reliability를 조절한다. |

Wireless multiple access가 어려운 또 다른 이유는 모든 node가 서로의 transmissions를 들을 수 없다는 점이다. Wired broadcast link에서는 모든 nodes가 같은 wire의 신호를 보지만, wireless에서는 obstacle과 fading 때문에 sender끼리 서로를 못 들어도 receiver에서 충돌할 수 있다.

![Figure 7.4](@/assets/images/cs-computer-network-208-figure-7-4-page-549.png)
*Figure 7.4 · PDF p. 549 · obstacle과 fading이 만드는 hidden terminal problem*

`hidden terminal problem`은 A와 C가 서로의 transmission을 감지하지 못하지만 둘 다 B에게 보내는 signal은 B에서 interfere하는 상황이다. Figure 7.4(a)는 물리적 장애물이 A와 C 사이를 막는 경우이고, Figure 7.4(b)는 signal strength가 distance/fading 때문에 A와 C 사이에서는 너무 약하지만 B에서는 서로 간섭할 만큼 강한 경우다. 이 문제 때문에 wireless MAC은 Ethernet처럼 collision detection에만 의존하기 어렵고, collision avoidance가 중요해진다.

#### 7.2.1 CDMA

`CDMA (code division multiple access)`는 shared medium에서 여러 senders가 동시에 전송하되, time이나 frequency가 아니라 `codespace`를 나누는 channel partitioning protocol이다. 각 sender에게 고유한 code를 주고, receiver는 원하는 sender의 code로 aggregate signal에서 해당 sender의 data를 뽑아낸다.

CDMA에서는 원래 data bit보다 훨씬 빠른 rate로 변하는 code를 사용한다. 이 빠른 rate를 `chipping rate`라고 한다. 하나의 data bit slot을 $M$개의 mini-slots로 나누고, sender code는 $M$개의 $+1$ 또는 $-1$ 값으로 이루어진 sequence다. 수학적으로 data bit $d_i$도 $+1$ 또는 $-1$로 표현한다. Sender는 각 mini-slot $m$에서 다음처럼 encoding한다.

$$
Z_{i,m} = d_i \cdot c_m
$$

Receiver가 다른 sender interference가 없는 상황에서 original data bit를 복원할 때는 received encoded values에 같은 code를 곱해 평균을 낸다.

$$
d_i = \frac{1}{M} \sum_{m=1}^{M} Z_{i,m} c_m
$$

![Figure 7.5](@/assets/images/cs-computer-network-209-figure-7-5-page-551.png)
*Figure 7.5 · PDF p. 551 · 단일 sender CDMA에서 code로 data bit를 encoding하고 같은 code로 decoding하는 예*

현실에서는 여러 senders가 동시에 전송하고, receiver는 각 mini-slot에서 모든 senders의 encoded signals가 더해진 aggregate signal을 받는다. CDMA가 성립하려면 sender들의 codes가 carefully chosen되어야 한다. 그러면 receiver는 aggregate signal $Z^*_{i,m}$에 원하는 sender의 code를 곱해 합산함으로써 다른 sender의 signal을 cancel하고 원하는 data를 복원할 수 있다.

![Figure 7.6](@/assets/images/cs-computer-network-210-figure-7-6-page-553.png)
*Figure 7.6 · PDF p. 553 · 두 sender의 signals가 더해져도 receiver가 한 sender의 code로 원래 data를 복원하는 예*

직관적으로 CDMA는 여러 사람이 같은 방에서 서로 다른 언어로 동시에 말하는 것과 비슷하다. 내가 이해하는 언어(code)에 집중하면 다른 언어의 대화는 배경 소음처럼 걸러진다. 단, 실제 CDMA에서는 codes 선택, sender별 received signal strength가 서로 다를 때의 near-far 문제, synchronization 같은 어려운 문제가 남는다.

### 7.3 WiFi: 802.11 Wireless LANs

`IEEE 802.11 wireless LAN`, 즉 `WiFi`는 workplace, home, school, café, airport에서 가장 널리 쓰이는 wireless access technology다. 802.11 family는 `802.11b/g/n/ac/ax` 같은 여러 generations를 포함한다. 이 standards는 같은 802.11 frame format과 `CSMA/CA` medium access protocol을 공유하고 backward compatible하지만, physical layer에서는 frequency range, maximum data rate, MIMO 사용 여부가 다르다. `802.11n/ac/ax`는 WiFi 4/5/6로도 불리며, `802.11af/ah`는 더 긴 거리의 IoT, sensor, metering applications에 초점을 둔다.

802.11 devices는 주로 `2.4 GHz`와 `5 GHz` ranges에서 동작한다. 2.4 GHz는 unlicensed band라 microwave oven, 2.4 GHz phone 같은 장치와 interference가 생길 수 있다. 5 GHz는 같은 power에서 transmission distance가 짧고 multipath propagation 영향을 더 받을 수 있다. 802.11n/ac/ax는 `MIMO (multiple input multiple-output)` antennas를 사용하고, 802.11ac/ax AP는 multiple stations로 동시에 transmit하거나 beamforming으로 receiver 방향에 맞춰 신호를 보내 interference를 줄이고 range/rate를 개선할 수 있다.

#### 7.3.1 The 802.11 Wireless LAN Architecture

802.11 architecture의 기본 building block은 `BSS (basic service set)`이다. BSS는 하나 이상의 wireless stations와 central base station인 `AP (access point)`로 구성된다. AP는 switch나 router 같은 interconnection device에 연결되어 Internet 또는 wired Ethernet infrastructure로 이어진다. Home network에서는 AP와 router가 하나의 장비로 통합되어 있는 경우가 많다.

![Figure 7.7](@/assets/images/cs-computer-network-211-figure-7-7-page-555.png)
*Figure 7.7 · PDF p. 555 · AP와 BSS가 switch/router를 통해 Internet에 연결되는 IEEE 802.11 LAN architecture*

802.11 wireless station과 AP의 wireless interface도 Ethernet처럼 6-byte `MAC address`를 가진다. 이 MAC addresses는 IEEE가 관리하고 이론적으로 globally unique하다. AP를 사용하는 WLAN을 `infrastructure wireless LAN`이라고 부르며, AP와 AP를 연결하는 wired Ethernet infrastructure가 여기서 말하는 infrastructure다.

802.11 stations는 AP 없이도 `ad hoc network`를 만들 수 있다. 이 경우 중앙 제어도 없고 outside world로의 연결도 없으며, 주변에 있는 devices가 즉석에서 network를 구성한다. 예를 들어 conference room이나 train 안에서 laptops끼리 AP 없이 data를 주고받는 상황이다. 이 장에서는 주로 infrastructure wireless LAN을 다룬다.

![Figure 7.8](@/assets/images/cs-computer-network-212-figure-7-8-page-556.png)
*Figure 7.8 · PDF p. 556 · 중앙 AP 없이 stations가 직접 구성하는 IEEE 802.11 ad hoc network*

##### Channels and Association

802.11 station은 network-layer data를 보내거나 받기 전에 AP와 `associate`해야 한다. AP 설치 시 administrator는 AP에 `SSID (Service Set Identifier)`와 channel number를 할당한다. 2.4 GHz 대역에서는 11개의 partially overlapping channels가 정의되어 있고, 두 channels가 4개 이상 떨어져야 non-overlapping이다. 특히 `channels 1, 6, 11`은 동시에 쓸 수 있는 세 non-overlapping channels의 대표 조합이다. 같은 장소에 세 AP를 두고 각각 1, 6, 11을 쓰게 하면 aggregate transmission capacity를 높일 수 있다.

`WiFi jungle`은 wireless station이 두 개 이상의 AP에서 충분히 강한 signal을 받는 장소다. Station은 Internet access를 위해 정확히 하나의 AP와 associate해야 한다. Association은 station과 AP 사이에 일종의 virtual wire를 만드는 것이다. Associated AP만 해당 station에게 data frames를 보내고, station도 Internet으로 향하는 data frames를 associated AP를 통해 보낸다.

AP는 주기적으로 `beacon frames`를 보낸다. Beacon frame에는 AP의 SSID와 MAC address가 들어 있다. Station은 channels를 scan하며 beacon frames를 듣고, 발견한 AP들 중 하나를 association 대상으로 선택한다. 802.11 standard는 AP selection algorithm을 정하지 않는다. 보통 firmware/software가 strongest signal AP를 고르지만, signal이 가장 강한 AP가 이미 overloaded일 수 있으므로 실제 performance와 항상 일치하지는 않는다.

![Figure 7.9](@/assets/images/cs-computer-network-213-figure-7-9-page-558.png)
*Figure 7.9 · PDF p. 558 · passive scanning과 active scanning으로 AP를 찾고 association하는 절차*

`passive scanning`에서는 station이 channels를 돌며 AP의 beacon frames를 기다린다. 이후 selected AP에 `Association Request frame`을 보내고, AP는 `Association Response frame`으로 응답한다. `active scanning`에서는 station이 먼저 `Probe Request frame`을 broadcast하고, range 안의 AP들이 `Probe Response frame`으로 답한다. 그 다음 station은 선택한 AP와 association request/response handshake를 수행한다. Active scanning에서도 두 번째 association handshake가 필요한 이유는, probe response를 보낸 여러 AP 중 station이 결국 어느 AP를 고를지 각 AP가 알 수 없기 때문이다.

Association이 끝나면 station은 AP가 속한 subnet에 들어가야 한다. 따라서 보통 AP를 통해 `DHCP discovery message`를 보내 subnet IP address를 얻는다. 이후 외부 세계는 이 wireless device를 그 subnet의 IP address를 가진 일반 host로 본다. 또한 AP와 association할 때 authentication이 필요할 수 있다. 인증 방식은 MAC address 기반 접근, username/password 기반 접근 등이 있고, AP는 보통 `RADIUS`나 `DIAMETER` 같은 protocol로 authentication server와 통신한다. Authentication server를 AP와 분리하면 여러 AP가 하나의 server를 공유하고, 민감한 authentication/access decision을 중앙화하면서 AP 비용과 복잡도를 낮출 수 있다.

#### 7.3.2 The 802.11 MAC Protocol

Associated wireless device가 AP와 data frame을 주고받으려면 같은 channel을 공유하는 여러 stations의 transmissions를 조정해야 한다. 802.11은 Ethernet의 성공에 영향을 받아 random access 계열의 `CSMA/CA (carrier sense multiple access with collision avoidance)`를 사용한다. `CSMA`는 보내기 전에 channel을 sensing하고 busy이면 전송하지 않는다는 뜻이고, `CA`는 collision을 detection 후 중단하는 것이 아니라 가능한 한 피하려는 설계다.

802.11 MAC이 Ethernet의 `CSMA/CD`와 다른 이유는 두 가지다. 첫째, wireless adapter가 transmit하면서 동시에 receive해 collision을 detect하려면, 자기 transmit signal이 received signal보다 훨씬 강한 상황에서 매우 작은 다른 signal을 감지해야 하므로 hardware cost가 크다. 둘째, 설령 transmit/listen을 동시에 할 수 있어도 hidden terminal problem과 fading 때문에 모든 collision을 detect할 수 없다. 따라서 802.11은 collision detection을 구현하지 않고, 일단 frame 전송을 시작하면 전체 frame을 끝까지 보낸다. Collision이 잦은 상황에서 긴 frame 전체가 낭비될 수 있으므로 collision avoidance가 더 중요해진다.

Wireless channel의 error probability가 높기 때문에 802.11은 link-layer ACK와 retransmission을 사용한다. Destination station이 frame을 받고 CRC check를 통과하면 짧은 시간인 `SIFS (Short Inter-frame Spacing)`를 기다린 뒤 ACK frame을 보낸다. Sender가 정해진 시간 안에 ACK를 받지 못하면 error 또는 collision이 발생했다고 보고 CSMA/CA를 통해 frame을 retransmit한다. 정해진 retransmission 횟수를 넘으면 frame을 포기하고 discard한다.

![Figure 7.10](@/assets/images/cs-computer-network-214-figure-7-10-page-560.png)
*Figure 7.10 · PDF p. 560 · DATA frame 후 SIFS를 지나 link-layer ACK를 보내는 802.11 ARQ 흐름*

802.11 `CSMA/CA`의 기본 흐름은 다음과 같다.

```text
1. Station이 frame을 보낼 준비가 되었고 channel이 idle이면 DIFS 후 frame을 전송한다.
2. Channel이 busy이면 binary exponential backoff로 random backoff value를 고른다.
3. Channel이 DIFS 동안 idle일 때만 backoff counter를 countdown한다.
4. Channel이 busy가 되면 counter를 freeze한다.
5. Counter가 0이 되면 전체 frame을 전송하고 ACK를 기다린다.
6. ACK를 받으면 성공, ACK가 없으면 더 큰 interval에서 backoff를 골라 재시도한다.
```

`DIFS (Distributed Inter-frame Space)`는 station이 channel idle을 확인하고 data 전송을 시작하기 전에 기다리는 시간이다. CSMA/CA가 channel이 idle이어도 바로 보내지 않고 backoff countdown을 하는 이유는 collision을 미리 피하기 위해서다. Ethernet CSMA/CD에서는 두 stations가 동시에 전송을 시작해도 collision을 detect하고 abort할 수 있지만, 802.11에서는 collision을 detect하지 못해 long frame 전체가 낭비된다. 따라서 busy channel이 idle로 바뀐 직후 여러 stations가 동시에 달려들지 않도록 random backoff로 순서를 분산한다. 한 station이 먼저 전송하면 다른 station은 그 signal을 듣고 counter를 freeze한다.

##### Dealing with Hidden Terminals: RTS and CTS

802.11 MAC에는 hidden terminals를 완화하기 위한 optional reservation scheme도 있다. `RTS (Request to Send)`와 `CTS (Clear to Send)` control frames를 사용해 long DATA frame 전송 전에 channel을 예약하는 방식이다.

![Figure 7.11](@/assets/images/cs-computer-network-215-figure-7-11-page-562.png)
*Figure 7.11 · PDF p. 562 · H1과 H2는 서로 hidden terminal이지만 둘 다 AP와 통신 가능한 상황*

Hidden terminal 상황에서 H1이 AP로 전송 중인데 H2가 H1을 듣지 못하면, H2는 channel이 idle이라고 생각하고 AP로 frame을 보내 충돌을 만든다. RTS/CTS는 긴 DATA frame을 보내기 전에 짧은 control frames로 예약을 걸어 이 비용을 줄인다.

![Figure 7.12](@/assets/images/cs-computer-network-216-figure-7-12-page-563.png)
*Figure 7.12 · PDF p. 563 · RTS/CTS로 hidden terminal의 전송을 defer시키고 DATA/ACK를 보호하는 흐름*

Sender는 DATA frame과 ACK에 필요한 total time을 담아 RTS를 AP에 보낸다. AP는 CTS를 broadcast한다. CTS는 sender에게 전송 허가를 주는 동시에, CTS를 들은 다른 stations에게 그 duration 동안 transmit하지 말라고 알린다. RTS/CTS의 장점은 hidden station problem을 완화하고, collision이 나더라도 짧은 RTS/CTS frame에서만 발생하게 해 긴 DATA frame 낭비를 막는 것이다. 단점은 delay와 channel resource overhead다. 그래서 실제로는 long DATA frame에만 쓰도록 `RTS threshold`를 둔다. 많은 devices에서는 default RTS threshold가 maximum frame length보다 커서 모든 DATA frames에서 RTS/CTS를 건너뛰기도 한다.

802.11은 directional antennas와 높은 transmission power를 쓰면 point-to-point wireless link처럼도 사용할 수 있다. 이 경우 multiple access setting보다 단순해지고, 저렴한 commodity 802.11 hardware로 수십 km 규모의 wireless point-to-point connection을 구성할 수 있다.

#### 7.3.3 The IEEE 802.11 Frame

802.11 frame은 Ethernet frame과 비슷하지만 wireless link와 AP/Ethernet interworking 때문에 추가 fields가 있다. Payload는 보통 IP datagram 또는 ARP packet이며 최대 2,312 bytes까지 가능하지만, 일반적으로 1,500 bytes보다 작다. Wireless LAN에서는 bit errors가 더 흔하므로 32-bit `CRC (cyclic redundancy check)`의 역할이 특히 중요하다.

![Figure 7.13](@/assets/images/cs-computer-network-217-figure-7-13-page-565.png)
*Figure 7.13 · PDF p. 565 · 802.11 frame format과 frame control subfields*

가장 눈에 띄는 차이는 802.11 frame에 6-byte MAC address fields가 네 개 있다는 점이다. Infrastructure network에서 핵심은 앞의 세 address fields다.

| Field | 의미 |
| --- | --- |
| `Address 1` | wireless channel에서 이 frame을 직접 receive할 station의 MAC address. Station이 AP로 보내면 AP MAC, AP가 station으로 보내면 destination station MAC이다. |
| `Address 2` | wireless channel에서 이 frame을 transmit하는 station의 MAC address. Station이 보내면 station MAC, AP가 보내면 AP MAC이다. |
| `Address 3` | BSS와 wired LAN을 interconnect하기 위한 주소. 보통 router interface 또는 wired side의 source/destination MAC을 보존하는 데 쓰인다. |
| `Address 4` | AP들이 ad hoc mode 등에서 서로 frame을 forward할 때 사용된다. 이 정리에서는 infrastructure network 중심이라 깊게 다루지 않는다. |

![Figure 7.14](@/assets/images/cs-computer-network-218-figure-7-14-page-566.png)
*Figure 7.14 · PDF p. 566 · H1과 router interface R1 사이 frame 전달에서 802.11 address fields가 쓰이는 방식*

AP는 link-layer device이므로 IP를 이해하거나 IP address로 routing하지 않는다. Router R1이 wireless station H1로 datagram을 보낼 때, router는 ARP로 H1의 MAC address를 얻고 Ethernet frame을 만든다. 이 Ethernet frame이 AP에 도착하면 AP는 이를 802.11 frame으로 변환한다. AP가 H1로 보낼 때 `Address 1`은 H1 MAC, `Address 2`는 AP MAC, `Address 3`은 R1 MAC이 된다. 반대로 H1이 R1로 보낼 때 H1은 `Address 1`에 AP MAC, `Address 2`에 H1 MAC, `Address 3`에 R1 MAC을 넣는다. AP는 이를 받아 Ethernet frame으로 바꾸면서 source를 H1 MAC, destination을 R1 MAC으로 채운다. 즉 `Address 3`은 wireless BSS와 wired LAN 사이에서 원래 router/interface MAC 정보를 잃지 않게 해 준다.

`Sequence number` field는 duplicate detection을 위해 필요하다. 802.11은 ACK가 손실되면 sender가 같은 frame을 재전송할 수 있으므로, receiver는 sequence number로 새 frame인지 이전 frame의 retransmission인지 구분한다. 이는 Chapter 3의 rdt2.1에서 sequence number가 하던 역할과 같다. `Duration` field는 RTS/CTS/DATA가 channel을 예약할 time duration을 나타낸다. `Frame control` field의 type/subtype은 association, RTS, CTS, ACK, data frames를 구분하고, `To AP`/`From AP` bits는 address fields의 의미를 해석하게 해 주며, `WEP` bit는 encryption 사용 여부를 표시한다.

#### 7.3.4 Mobility in the Same IP Subnet

하나의 organization은 wireless LAN coverage를 넓히기 위해 같은 IP subnet 안에 여러 BSSs를 배치할 수 있다. 이 경우 station이 BSS1에서 BSS2로 이동해도 IP address를 유지하므로 ongoing TCP sessions를 계속 유지할 수 있다. 반대로 interconnection device가 router이고 새 BSS가 다른 subnet이면 station은 새 IP address를 받아야 하고, 기존 TCP connections는 깨질 수 있다. 이런 경우에는 Section 7.5-7.6의 network-layer mobility management가 필요하다.

![Figure 7.15](@/assets/images/cs-computer-network-219-figure-7-15-page-568.png)
*Figure 7.15 · PDF p. 568 · 같은 subnet 안에서 H1이 AP1/BSS1에서 AP2/BSS2로 이동하는 상황*

Same subnet mobility의 local flow는 다음과 같다. H1이 AP1에서 멀어지며 signal이 약해지는 것을 감지하고 scan을 시작한다. H1은 AP2의 beacon frames를 받고, AP1과 disassociate한 뒤 AP2와 associate한다. 이때 AP1과 AP2가 같은 SSID를 쓸 수 있고, H1은 IP address와 TCP sessions를 유지한다.

문제는 switch forwarding table이다. 이동 전 switch는 H1 MAC이 AP1 쪽 interface에 있다고 알고 있다. H1이 AP2로 옮긴 뒤에는 switch가 H1 MAC을 AP2 쪽으로 보내야 한다. 한 방법은 AP2가 new association 직후 H1의 source address를 가진 broadcast Ethernet frame을 switch로 보내는 것이다. Switch는 self-learning 기능으로 source MAC을 보고 H1 위치를 AP2 방향으로 update한다. 이 방식은 local subnet mobility에서는 잘 동작하지만, highly mobile users와 cross-subnet movement에는 충분하지 않다.

#### 7.3.5 Advanced Features in 802.11

`802.11 rate adaptation`은 current/recent channel characteristics에 따라 physical-layer modulation technique과 transmission rate를 바꾸는 기능이다. User가 AP 가까이에 있어 SNR이 높으면 high-rate modulation으로 낮은 BER을 유지할 수 있다. User가 AP에서 멀어져 SNR이 떨어지면 같은 modulation을 유지할 경우 BER이 커지고 frames가 깨진다. 따라서 implementation은 ACK 수신 여부를 implicit signal로 보고 rate를 조정한다.

대표적인 방식은 두 frames 연속 ACK를 받지 못하면 다음 lower rate로 fallback하고, 10 frames 연속 ACK를 받거나 last fallback 이후 timer가 expire되면 next higher rate로 올리는 식이다. 이는 TCP congestion control과 비슷한 probing 철학을 가진다. 좋은 조건에서는 rate를 올려 보고, ACK loss라는 나쁜 신호가 오면 rate를 낮춘다.

`Power management`는 battery-powered mobile device를 위해 radio circuitry가 켜져 있는 시간을 줄이는 기능이다. Node는 802.11 frame header의 `power-management bit`를 1로 설정해 AP에게 sleep 예정임을 알린다. AP는 sleeping node로 향하는 frames를 buffer한다. Node는 AP가 보통 100 ms마다 보내는 beacon frame 직전에 wake up하고, beacon에 자신을 위한 buffered frames가 있는지 확인한다. 없으면 다시 sleep하고, 있으면 polling message로 buffered frames 전송을 요청한다. Wakeup 시간이 약 250 microseconds 수준이면 send/receive할 것이 없는 node는 대부분의 시간을 sleep 상태로 보내 significant energy savings를 얻을 수 있다.

#### 7.3.6 Personal Area Networks: Bluetooth

`Bluetooth`는 keyboard, mouse, earbuds, speaker, watch, health monitoring band, car audio system처럼 짧은 거리의 personal devices를 낮은 전력과 낮은 비용으로 연결하는 cable replacement technology다. Bluetooth network는 수십 meters 이하 범위에서 동작하며, `WPAN (wireless personal area network)` 또는 `piconet`이라고 부른다.

Bluetooth는 작고 단순한 network처럼 보이지만, link layer 안에는 앞 장에서 배운 여러 기법이 들어 있다. TDM, frequency division, randomized backoff, polling, error detection/correction, ACK/NAK 기반 reliable data transfer가 모두 등장한다. Bluetooth는 2.4 GHz `ISM (Industrial, Scientific and Medical)` unlicensed band에서 동작하므로 microwave, garage door opener, cordless phone 같은 장치와 interference를 고려해야 한다.

Bluetooth wireless channel은 625 microseconds time slots를 사용하는 TDM 방식으로 동작한다. 각 slot에서 sender는 79 channels 중 하나를 사용하고, slot마다 frequency가 pseudo-random하게 바뀐다. 이 방식은 `FHSS (frequency-hopping spread spectrum)`라고 하며, ISM band의 interference가 일부 slots만 망치게 만들어 전체 통신을 더 견고하게 한다. Bluetooth data rate는 최대 약 3 Mbps 수준이다.

![Figure 7.16](@/assets/images/cs-computer-network-220-figure-7-16-page-572.png)
*Figure 7.16 · PDF p. 572 · master, active clients, parked devices로 구성된 Bluetooth piconet*

Bluetooth는 AP가 없는 ad hoc network다. 최대 8개의 active devices가 하나의 piconet을 이루며, 그중 하나가 `master`, 나머지가 `clients`가 된다. Master는 piconet의 time slot boundaries를 정하는 clock, slot-to-slot frequency hopping sequence, client admission, client transmit power, polling permission을 제어한다. 즉 802.11 AP처럼 infrastructure에 붙는 장비는 아니지만, piconet 내부에서는 매우 강한 coordinator 역할을 한다.

Piconet에는 active devices 외에 최대 255개의 `parked devices`가 있을 수 있다. Parked device는 energy saving을 위해 sleep mode에 가까운 상태로 있다가 master schedule에 맞춰 주기적으로 wake up해 beacon messages를 듣는다. Parked device는 master가 status를 active로 바꿔 주기 전까지 data communication을 할 수 없다.

Bluetooth piconet은 self-organizing이어야 하므로 bootstrap 절차가 중요하다. Master는 먼저 주변 Bluetooth devices를 찾는 `neighbor discovery`를 수행한다. Master가 32 inquiry messages를 서로 다른 frequencies로 broadcast하고, client는 자신이 듣는 frequency에서 inquiry를 들으면 collision을 피하기 위해 0-0.3 seconds random backoff 후 device ID를 담아 응답한다. 이후 `Bluetooth paging` phase에서 master는 초대할 client에게 paging invitation messages를 보내고, client가 ACK하면 frequency-hopping pattern, clock synchronization information, active member address를 알려 준다. 마지막으로 master가 새 hopping pattern을 사용해 client를 poll하면 client가 piconet에 연결된다.

### 7.4 Cellular Networks: 4G and 5G

Wi-Fi AP는 coverage area가 작고, moving user가 만나는 모든 AP에 자유롭게 associate할 수 있는 것도 아니다. 반면 `4G cellular network`는 훨씬 넓은 provider-managed coverage를 제공한다. `cellular`라는 말은 전체 coverage region이 여러 geographic coverage areas, 즉 `cells`로 나뉜다는 뜻이다. 각 cell에는 base station이 있고, 이 base station이 현재 cell 안의 mobile devices와 signals를 송수신한다. Cell coverage는 base station transmit power, device transmit power, buildings, antenna height/type 등에 좌우된다.

4G/5G cellular network는 telephony에서 출발했지만, 4G LTE부터는 all-IP core를 가진 packet-switched data network로 이해할 수 있다. 이 안에는 Chapter 1-6에서 본 protocol layering, edge/core distinction, provider networks의 interconnection, data plane/control plane separation, logically centralized control 같은 Internet architecture 원리가 다른 형태로 구현되어 있다.

#### 7.4.1 4G LTE Cellular Networks: Architecture and Elements

`4G LTE (Long-Term Evolution)` architecture는 크게 radio network at the edge와 all-IP core network로 나뉜다. 모든 network elements는 IP protocol로 서로 통신한다. Figure 7.17은 mobile device가 base station을 통해 LTE carrier network의 EPC core로 들어가고, gateway를 거쳐 Internet으로 나가는 구조를 보여준다.

![Figure 7.17](@/assets/images/cs-computer-network-221-figure-7-17-page-576.png)
*Figure 7.17 · PDF p. 576 · mobile device, base station, MME, HSS, S-GW, P-GW로 구성된 4G LTE architecture*

주요 LTE elements는 다음처럼 이해하면 된다.

| LTE element | 역할 | Wi-Fi와의 연결 |
| --- | --- | --- |
| `Mobile Device`, `UE (User Equipment)` | Smartphone, tablet, laptop, IoT device. full 5-layer Internet stack을 구현하고 IP address를 가진 endpoint다. SIM에 `IMSI (International Mobile Subscriber Identity)`와 service/encryption info가 저장된다. | host/end-system |
| `Base Station`, `eNode-B` | radio access network의 edge. wireless radio resources를 관리하고 device attach, authentication coordination, channel allocation, device mobility between cells, inter-cell interference coordination을 수행한다. | AP와 비슷하지만 훨씬 많은 기능 |
| `HSS (Home Subscriber Server)` | subscriber home network의 database. IMSI, service/access privileges, authentication 관련 정보를 저장한다. | 직접 대응 없음 |
| `S-GW (Serving Gateway)` | mobile device와 Internet 사이 data path의 LTE internal router/gateway. | access ISP 내부 router와 유사 |
| `P-GW (Packet Data Network Gateway)` | LTE network에서 Internet으로 나가기 전 마지막 gateway. mobile devices에 NAT IP address를 제공하고 NAT 기능을 수행한다. 외부 Internet에는 mobile device mobility가 P-GW 뒤로 숨겨진다. | gateway router |
| `MME (Mobility Management Entity)` | control-plane element. authentication, tunnel setup, active device cell location tracking, paging을 담당하지만 user datagram forwarding path에는 없다. | AP 일부 기능과 mobility controller를 합친 성격 |

LTE에서 data plane과 control plane은 분명히 분리된다. `S-GW`와 `P-GW`는 user data path 위에 있는 routers이고, `MME`와 `HSS`는 control plane에서 attach/authentication/location/tunnel setup을 담당한다.

![Figure 7.18](@/assets/images/cs-computer-network-222-figure-7-18-page-578.png)
*Figure 7.18 · PDF p. 578 · LTE data-plane elements와 control-plane elements의 분리*

MME는 세 가지 핵심 기능을 한다. 첫째, `authentication`에서 mobile device와 network가 서로 legitimate한지 확인하도록 HSS와 mobile device 사이의 middleman 역할을 한다. Roaming 중이면 visited network의 MME가 home network의 HSS에 접촉한다. 둘째, `path setup`에서 mobile device와 P-GW 사이 data path에 필요한 tunnels를 설정한다. Mobile device와 base station 사이 wireless first hop 뒤에는 base station-S-GW, S-GW-P-GW 사이 IP tunnels가 이어진다. 이 tunnel 구조 덕분에 device가 이동해도 base station 쪽 tunnel endpoint만 바꾸면 되고, 나머지 tunnel/QoS 설정은 유지할 수 있다. 셋째, `cell location tracking`에서 active device의 cell 위치를 관리한다. Device가 sleep mode라 base stations가 위치를 직접 추적하지 못하면 MME가 `paging`으로 device를 찾아 wake up시킨다.

#### 7.4.2 LTE Protocols Stacks

4G LTE는 all-IP architecture이므로 application/transport/network layer에서는 IP, TCP, UDP, application protocols가 그대로 등장한다. 새롭고 중요한 부분은 wireless radio link의 link layer/physical layer와 mobility management다. Figure 7.21은 mobile device, base station, S-GW, P-GW 사이 user-plane protocol stacks를 보여준다.

![Figure 7.21](@/assets/images/cs-computer-network-225-figure-7-21-page-581.png)
*Figure 7.21 · PDF p. 581 · LTE user-plane data path와 PDCP/RLC/MAC link-layer sublayers*

LTE mobile device의 link layer는 세 sublayers로 나뉜다.

| LTE link sublayer | 핵심 기능 |
| --- | --- |
| `PDCP (Packet Data Convergence Protocol)` | IP 바로 아래에서 IP header compression을 수행해 wireless link로 보내는 bits를 줄이고, attach 과정에서 설정된 keys로 IP datagram encryption/decryption을 수행한다. |
| `RLC (Radio Link Control)` | 큰 IP datagram을 link-layer frames에 맞게 fragmentation/reassembly하고, ACK/NAK 기반 `ARQ`로 link-layer reliable data transfer를 수행한다. |
| `MAC (Medium Access Control)` | radio transmission slots의 requesting/use, transmission scheduling을 담당하고, redundant bit transmission 같은 `FEC (forward error correction)` 기반 error correction을 channel condition에 맞게 조정한다. |

Figure 7.21의 user data path에는 tunnels도 보인다. Mobile device가 network에 attach할 때 MME control 아래 tunnels가 설정된다. Tunnel endpoints 사이에는 unique `TEID (tunnel endpoint identifier)`가 있다. Base station이 mobile device에서 온 datagram을 받으면 `GTP-U (GPRS Tunneling Protocol - User plane)`로 encapsulate하고, TEID를 포함해 UDP segment에 담아 S-GW로 보낸다. 반대로 mobile device로 가는 방향에서는 tunneled UDP datagram을 decapsulate해 IP datagram을 꺼낸 뒤 wireless hop으로 보낸다.

#### 7.4.3 LTE Radio Access Network

`LTE Radio Access Network`의 downstream channel은 `OFDM (orthogonal frequency division multiplexing)`을 사용한다. 이름의 orthogonal은 서로 다른 frequency channels가 촘촘히 배치되어도 interference가 작도록 signal을 구성한다는 뜻이다. LTE는 frequency division multiplexing과 time division multiplexing을 함께 사용해, active mobile device에 하나 이상의 frequency에서 하나 이상의 0.5 ms time slot을 할당한다.

![Figure 7.22](@/assets/images/cs-computer-network-226-figure-7-22-page-583.png)
*Figure 7.22 · PDF p. 583 · 각 frequency에서 10 ms frame이 20개의 0.5 ms slots로 나뉘고, shaded slots가 한 device에 할당된 예*

전송률은 두 축에서 조절된다. 첫째, mobile device에 더 많은 time slots를 주면 같은 시간 안에 더 많은 data를 보낼 수 있다. 이 slots는 같은 frequency에 있을 수도 있고, 여러 frequencies에 흩어져 있을 수도 있다. LTE에서는 slot reallocation이 최대 1 ms마다 일어날 수 있다. 둘째, Wi-Fi의 rate adaptation처럼 modulation scheme을 channel condition에 맞춰 바꿀 수 있다.

LTE standard는 특정 scheduling algorithm을 강제하지 않는다. 어느 mobile device가 어느 frequency/time slot을 쓸지는 LTE equipment vendor나 network operator의 scheduling algorithm이 결정한다. `opportunistic scheduling`은 sender-receiver 사이 channel condition이 좋은 receiver에게 자원을 배정해 wireless medium을 더 잘 활용하려는 방식이다. 다만 scheduling은 channel 상태만 보지 않고 user priorities, contracted service level 같은 정책 요소도 반영할 수 있다. `LTE-Advanced`는 aggregated channels를 할당해 downstream bandwidth를 hundreds of Mbps 수준까지 높일 수 있다.

#### 7.4.4 Additional LTE Functions: Network Attachment and Power Management

`Network attachment`는 mobile device가 carrier network에 처음 붙어 IP datagrams를 주고받을 수 있게 되는 절차다. 큰 흐름은 세 단계다.

| 단계 | 핵심 동작 | 의미 |
| --- | --- | --- |
| Attachment to a Base Station | Mobile device가 모든 channels/frequency bands에서 base station이 5 ms마다 broadcast하는 `primary synchronization signal`을 찾고, 이어 `secondary synchronization signal`과 추가 정보를 통해 channel bandwidth, channel configuration, carrier information을 얻는다. | 802.11 association과 목적은 비슷하지만 cellular bootstrap 절차는 훨씬 체계적이다. |
| Mutual Authentication | Base station이 local `MME`에 접촉하고, MME는 device의 `IMSI`와 subscriber information을 근거로 device와 network 사이 mutual authentication을 수행한다. | Network는 device가 legitimate subscriber인지 알고, device는 자신이 legitimate carrier network에 붙었는지 확인한다. |
| Mobile-device-to-PDN-gateway Data Path Configuration | MME가 `P-GW`, `S-GW`, base station에 접촉해 Figure 7.21의 tunnels를 설정하고, P-GW는 mobile device에 NAT address를 제공한다. | 이후 mobile device는 base station과 tunnels를 거쳐 Internet과 IP datagrams를 주고받는다. |

`Power management`는 radio가 켜져 있는 시간을 줄이는 문제다. 4G LTE의 sleep은 크게 두 단계로 볼 수 있다. `discontinuous reception`은 수백 milliseconds의 inactivity 뒤 들어가는 light sleep이다. Mobile device와 base station은 미리 정한 periodic wake-up times를 공유하고, device는 그때만 channel을 monitor해 downstream transmission이 있는지 본다.

`Idle state`는 5-10 seconds 이상의 inactivity 뒤 들어가는 deep sleep이다. 이 상태의 mobile device는 더 드물게 wake up하며, 이동해서 새로운 cell에 들어가도 이전 base station에 굳이 알리지 않는다. 대신 device가 wake up할 때는 자신이 마지막으로 연결되어 있던 base station 주변으로 MME가 보낸 `paging messages`를 확인한다. Paging message에 자신이 있으면 device는 fully wake up하고 새 data-plane connection을 base station과 다시 세운다. 즉 LTE power saving은 battery life와 reachability 사이의 trade-off다.

#### 7.4.5 The Global Cellular Network: A Network of Networks

Cellular network도 Internet처럼 `network of networks`다. 한 사용자의 `home cellular carrier network`는 HSS와 gateway를 갖고, 다른 carrier networks 및 public Internet과 연결된다. Carrier networks는 public Internet을 통해 연결될 수도 있고, cellular carriers 사이 interconnection을 위해 관리되는 `IPX (Internet Protocol Packet eXchange)` network를 통해 연결될 수도 있다.

![Figure 7.23](@/assets/images/cs-computer-network-227-figure-7-23-page-585.png)
*Figure 7.23 · PDF p. 585 · home cellular carrier network, visited mobile carrier network, public Internet/IPX가 연결된 global cellular data network*

이 구조는 Chapter 1의 ISP interconnection과 연결된다. Internet의 ISPs가 peering과 transit을 통해 하나의 global Internet을 만들듯, cellular carriers도 gateways와 IPX/public Internet을 통해 서로 붙는다. 4G network는 3G voice/data networks나 이전 voice-only networks와도 interwork할 수 있다. 뒤의 mobility management와 security는 이 network-of-networks 구조 위에서 동작한다.

#### 7.4.6 5G Cellular Networks

`5G`는 궁극적으로 ubiquitous gigabit speed, extremely low latency, 지역 내 매우 많은 users/devices 수용을 목표로 한다. 이 목표가 가능해지면 mobile AR/VR, autonomous vehicle control, factory robot control, fixed wireless residential Internet 같은 application이 현실적인 use case가 된다. 책의 기준으로 5G는 4G 대비 peak bitrate 약 10배, latency 약 10배 감소, traffic capacity 약 100배 증가를 지향한다.

좁은 의미의 5G는 3GPP의 `5G NR (New Radio)`를 가리킨다. 5G frequency range는 `FR1 (450 MHz-6 GHz)`과 `FR2 (24 GHz-52 GHz)`로 나뉜다. FR2는 흔히 `millimeter wave`라고 부르며 높은 data rate를 가능하게 하지만, range가 짧고 foliage, rain, buildings 같은 atmospheric/physical blockage에 약하다. 그래서 rural coverage에는 불리하고, urban area에서는 base stations와 `small cell stations`를 더 조밀하게 배치해야 한다.

5G는 하나의 단일 기능이 아니라 세 use-case family가 함께 있는 표준군에 가깝다.

| 5G family | 목적 | 대표 application |
| --- | --- | --- |
| `eMBB (Enhanced Mobile Broadband)` | 더 큰 bandwidth와 더 높은 download/upload speed, 4G보다 낮은 latency | mobile AR/VR, 4K/360-degree video |
| `URLLC (Ultra Reliable Low-Latency Communications)` | 극단적으로 낮은 latency와 높은 reliability, 목표 latency는 1 ms 수준 | factory automation, autonomous driving |
| `mMTC (Massive Machine Type Communications)` | sensing, metering, monitoring을 위한 narrowband access와 IoT 연결 비용/전력 요구 감소 | IoT devices, monitoring systems |

5G capacity는 다음 식으로 직관화할 수 있다.

$$
\text{capacity} = \text{cell density} \cdot \text{available spectrum} \cdot \text{spectral efficiency}
$$

FR2에서는 range가 짧아 더 많은 base stations가 필요하므로 `cell density`가 커진다. 24-52 GHz 대역은 4G LTE 대역보다 훨씬 넓어 `available spectrum`이 커진다. `spectral efficiency`는 단순히 power를 크게 올리는 대신 `MIMO`와 `beam forming`으로 높인다. 여러 antennas가 signal을 모든 방향으로 뿌리지 않고 user 쪽으로 지향시키면, 한 base station이 같은 frequency band에서 10-20 users에게 동시에 전송할 수 있다.

`5G Core Network`는 mobile voice/data/Internet connections를 관리하는 data network이며, Internet과 cloud services에 더 잘 통합되도록 재설계된다. Distributed servers/caches를 network 전반에 배치해 latency를 낮추고, `NFV (network function virtualization)`와 `network slicing`을 core에서 관리한다. 4G core와 마찬가지로 device authentication, data relay, mobility management를 수행하지만, architecture는 control plane과 user plane을 더 완전히 분리하고 software-based virtualized network functions 중심으로 간다.

5G Core의 대표 functions는 다음과 같다.

| 5G Core function | 역할 | 4G와의 연결 |
| --- | --- | --- |
| `UPF (User-Plane Function)` | Control/user plane separation을 바탕으로 packet processing을 network edge 가까이에 분산한다. | S-GW/P-GW의 user-plane 역할 일부와 연결 |
| `AMF (Access and Mobility Management Function)` | UE의 connection/session information을 받지만, connection and mobility management에 집중한다. | 4G `MME`의 기능 일부 |
| `SMF (Session Management Function)` | Session management, decoupled data plane interaction, IP address management를 담당하고 DHCP 역할도 수행한다. | 4G `MME`와 gateway control 기능 일부 |

핵심은 5G가 단순히 radio speed만 올리는 세대가 아니라는 점이다. 5G는 millimeter wave, dense small cells, MIMO/beam forming 같은 radio-side 변화와, cloud/NFV/network slicing/control-user plane separation 같은 core-side 변화를 동시에 묶어 다양한 service class를 지원하려는 architecture다.

### 7.5 Mobility Management: Principles

`Mobility`는 mobile device가 시간이 지나며 network에 붙는 `point of attachment`를 바꾸는 성질이다. 하지만 network layer 관점에서 중요한 mobility는 물리적으로 움직인다는 사실 자체가 아니라, IP datagrams와 higher-layer connections를 유지한 채 attachment point가 바뀌는지다.

#### 7.5.1 Device Mobility: a Network-layer Perspective

Figure 7.24는 mobility를 network-layer 관점에서 네 단계로 나눈다.

![Figure 7.24](@/assets/images/cs-computer-network-228-figure-7-24-page-590.png)
*Figure 7.24 · PDF p. 590 · access network 이동, 같은 provider 내 이동, 여러 providers 사이 이동으로 나뉘는 mobility degrees*

| 경우 | network-layer 관점 | 필요한 기능 |
| --- | --- | --- |
| (a) Access networks 사이를 이동하지만 이동 중 device power down | 켜져 있는 동안에는 한 access network에만 붙으므로 network-layer mobility가 아니다. | 기존 association/disassociation 절차로 충분 |
| (b) 같은 wireless access network 안에서만 이동 | IP 관점에서는 같은 access network에 남아 있으므로 network-layer mobility가 아니다. 같은 AP/base station을 유지하면 link-layer mobility도 아니다. | 같은 subnet/AP 내부 관리 |
| (c) 한 provider 안의 여러 access networks 사이를 ongoing connections 유지하며 이동 | network-layer mobility가 본격적으로 필요하다. | `handover`, datagram forwarding responsibility transfer |
| (d) 여러 provider networks 사이를 ongoing connections 유지하며 이동 | 가장 복잡하다. | provider 간 coordination, roaming support |

핵심 용어는 `handover`다. Handover는 mobile device가 WLANs나 LTE cells 사이를 움직일 때, datagrams를 어느 AP/base station으로 forwarding할지에 대한 책임을 이전하는 절차다. 같은 provider 안에서는 provider가 자체적으로 조율할 수 있지만, multiple provider networks 사이의 roaming은 서로 다른 administrative domains가 협력해야 해서 훨씬 어렵다.

#### 7.5.2 Home Networks and Roaming on Visited Networks

Cellular network에는 가입자의 `home network` 개념이 강하게 존재한다. `HSS (Home Subscriber Server)`는 subscriber의 globally unique device ID, service/access privileges, cryptographic keys, billing/charging information을 저장한다. Device가 자신의 home network가 아닌 carrier network에 붙으면 그 device는 `visited network`에서 `roaming` 중이라고 한다.

Internet architecture에는 cellular처럼 강한 home/visited network 개념이 내장되어 있지 않다. `Mobile IP`는 home/visited network 개념을 IP 쪽에 강하게 도입하려던 제안이지만 실제 deployment는 제한적이었다. 대신 Eduroam처럼 기존 IP infrastructure 위에서 visited IP networks에 authenticated access를 제공하는 활동들이 있다.

Home network가 중요한 이유는 두 가지다. 첫째, mobile device에 대한 정보를 찾을 수 있는 single location을 제공한다. 둘째, roaming device와 통신하기 위한 coordination point가 된다. Correspondent가 mobile device의 현재 위치를 모르더라도, home network를 먼저 조회하거나 home network를 경유해 통신하게 만들 수 있다.

#### 7.5.3 Direct and Indirect Routing to/from a Mobile Device

Mobility architecture의 기본 구성요소는 correspondent, home network, visited network, mobility manager, HSS, gateway다. Mobile device에는 cellular에서는 `IMSI`와 phone number 같은 permanent identifier가 있고, Mobile IP 관점에서는 home network address range에 속한 `permanent IP address`가 있을 수 있다.

![Figure 7.25](@/assets/images/cs-computer-network-229-figure-7-25-page-592.png)
*Figure 7.25 · PDF p. 592 · permanent IP/IMSI를 가진 mobile device와 home/visited network, mobility managers, correspondent*

가장 단순한 접근은 기존 IP addressing infrastructure를 그대로 써서 visited network가 mobile device의 full 32-bit permanent IP address에 대한 매우 specific route를 BGP로 advertise하는 것이다. Longest prefix matching 때문에 datagrams는 visited network로 향하게 된다. 이 방식은 architectural change가 적지만, routers가 billions of mobile devices 각각에 대한 forwarding table entries를 유지하고 이동할 때마다 update해야 하므로 scalability가 치명적으로 나쁘다. 그래서 실제적인 해결은 mobility 기능을 core routers가 아니라 network edge와 home network 쪽으로 밀어내는 것이다.

Mobile device가 visited network에 붙으면, visited network와 home network 사이 protocol이 HSS에 device의 현재 visited network를 등록한다. Device는 permanent identifier 외에 visited network에서 쓸 transient identifier를 가질 수 있다. 예를 들어 visited network address range에서 새 IP를 받거나, NAT address를 받을 수 있다.

##### Indirect Routing to a Mobile Device

`Indirect routing`에서는 correspondent가 mobile device의 이동 여부를 모른다. Correspondent는 permanent address로 datagram을 보내고, datagram은 평소처럼 home network로 간다. Home network gateway는 HSS를 조회해 mobile device가 현재 어느 visited network에 있는지 확인한 뒤, original datagram을 더 큰 datagram 안에 encapsulate해 visited network gateway로 tunnel한다. Visited network gateway는 decapsulation과 필요 시 NAT translation을 수행하고 mobile device로 전달한다.

![Figure 7.26](@/assets/images/cs-computer-network-230-figure-7-26-page-594.png)
*Figure 7.26 · PDF p. 594 · correspondent datagram이 home network를 거쳐 visited network로 tunnel되는 indirect routing*

Indirect routing에 필요한 기능은 세 가지다.

| 기능 | 왜 필요한가 |
| --- | --- |
| Mobile-device-to-visited-network association protocol | Device가 visited network에 attach/disassociate해야 한다. |
| Visited-network-to-home-network-HSS registration protocol | Visited network가 device 위치를 HSS에 등록하고, HSS information으로 authentication을 수행할 수 있어야 한다. |
| Home gateway-to-visited gateway datagram tunneling protocol | Home gateway가 correspondent의 original datagram을 encapsulate하고, visited gateway가 decapsulate해 mobile device로 전달해야 한다. |

Mobile device가 다른 visited network로 이동하면 HSS의 visited network 정보와 tunnel endpoint를 새 visited gateway로 update한다. 이동 중 잠깐 datagrams가 손실될 수 있지만, Chapter 3의 관점에서 이는 congestion loss와 마찬가지로 upper-layer reliable transport가 회복할 수 있는 사건이다. Indirect routing은 Mobile IP와 4G LTE의 기본 아이디어와 연결된다.

##### Direct Routing to a Mobile Device

`Direct routing`은 `triangle routing problem`을 피하려는 방식이다. Indirect routing에서는 correspondent와 mobile device가 물리적으로 가까워도 datagram이 먼저 home network로 갔다가 visited network로 되돌아올 수 있다. Direct routing에서는 correspondent가 먼저 HSS에 query해 mobile device의 visited network를 알아낸 뒤, correspondent 쪽에서 visited network gateway로 직접 tunnel한다.

![Figure 7.27](@/assets/images/cs-computer-network-231-figure-7-27-page-597.png)
*Figure 7.27 · PDF p. 597 · correspondent가 HSS를 조회한 뒤 visited network로 직접 tunnel하는 direct routing*

Direct routing의 장점은 path inefficiency를 줄인다는 점이다. 하지만 complexity가 늘어난다. Correspondent가 HSS에 mobile-user location을 query하는 protocol이 필요하고, session 도중 mobile device가 새 visited network로 이동하면 correspondent에게 새 tunnel endpoint를 알려야 한다. Indirect routing에서는 HSS update와 home gateway tunnel endpoint 변경으로 충분했지만, direct routing에서는 correspondent까지 proactive update해야 하므로 ongoing session mobility 처리가 더 어렵다.

정리하면 indirect routing은 correspondent transparency가 좋지만 triangle routing 때문에 비효율적이고, direct routing은 route 효율이 좋지만 correspondent involvement와 mobility update protocol이 필요하다.

### 7.6 Mobility Management in Practice

앞 절의 원리는 실제 4G/5G network에서 home/visited network, HSS/MME, tunnels, handover로 구현된다. 예시는 사용자가 visited 4G/5G network에 attach하고, remote streaming server에서 HD video를 보다가 다른 base station coverage로 이동하는 상황이다.

![Figure 7.28](@/assets/images/cs-computer-network-232-figure-7-28-page-599.png)
*Figure 7.28 · PDF p. 599 · visited network에 attach한 mobile device가 streaming 중 handover하는 4G/5G mobility scenario*

#### 7.6.1 Mobility Management in 4G/5G Networks

4G/5G mobility scenario는 네 단계로 볼 수 있다.

| 단계 | 핵심 동작 | 관련 요소 |
| --- | --- | --- |
| 1. Mobile device and base station association | Device가 주변 base station의 synchronization signals를 듣고 association할 base station을 고른 뒤 control-signaling channel을 bootstrap한다. Device는 `IMSI`를 제공한다. | UE, base station |
| 2. Control-plane configuration | Base station이 visited network의 `MME`에 접촉한다. MME는 IMSI로 authentication/encryption/service 정보를 얻고, HSS에 device가 visited network에 있음을 알린다. | MME, HSS, base station |
| 3. Data-plane tunnel configuration | MME가 data plane을 구성해 tunnels를 만든다. | S-GW, P-GW, GTP, TEID |
| 4. Handover | Device가 source base station에서 target base station으로 point of attachment를 바꾼다. | source/target base stations, MME, S-GW |

Data-plane 구성에서는 두 tunnels가 핵심이다. 하나는 visited network 안의 base station과 `S-GW (Serving Gateway)` 사이, 다른 하나는 visited network의 S-GW와 mobile device home network의 `P-GW (PDN Gateway)` 사이에 생긴다. 이것은 symmetric indirect routing이다. Mobile device로 오고 가는 traffic은 home network의 P-GW를 거친다.

![Figure 7.29](@/assets/images/cs-computer-network-233-figure-7-29-page-600.png)
*Figure 7.29 · PDF p. 600 · visited network의 S-GW와 home network의 P-GW 사이 4G/5G tunneling*

4G/5G tunnel은 `GTP (GPRS Tunneling Protocol)`을 사용한다. GTP header의 `TEID (Tunnel Endpoint ID)`는 datagram이 어느 tunnel에 속하는지 나타내므로, tunnel endpoints 사이에서 여러 flows를 multiplex/demultiplex할 수 있다. Figure 7.29는 mobile device가 visited network에 roaming 중인 경우이고, Figure 7.18은 home network 안에서만 mobility가 있는 경우다. 두 경우 모두 S-GW는 mobile device와 같은 network에 있지만, P-GW는 항상 device의 home network에 있으므로 visited network roaming에서는 indirect routing 구조가 된다. `Local breakout`은 visited network의 local P-GW로 tunnel을 만드는 대안이지만 널리 쓰이지 않는다.

Handover는 mobile device가 현재 base station과의 association을 끊고 다른 base station에 붙는 절차다. 현재 base station을 `source base station`, 새 base station을 `target base station`이라고 부른다. Handover의 결과는 wireless link만 바뀌는 것이 아니라, S-GW-to-base-station tunnel의 base-station-side endpoint도 source에서 target으로 바뀐다는 점이 중요하다.

![Figure 7.30](@/assets/images/cs-computer-network-234-figure-7-30-page-601.png)
*Figure 7.30 · PDF p. 601 · source base station에서 target base station으로 handover할 때의 tunnel 재구성 단계*

Handover가 발생하는 이유는 단순히 사용자가 움직이기 때문만은 아니다. Current base station과 mobile device 사이 signal이 나빠질 수도 있고, cell이 overloaded되어 nearby cell로 일부 mobile devices를 넘기는 편이 나을 수도 있다. Mobile device는 current base station과 nearby base stations의 beacon signal characteristics를 주기적으로 측정해 source base station에 보고한다. Source base station은 이 measurements, nearby cell load, 기타 factors를 바탕으로 handover 여부와 target base station을 결정한다. 4G/5G standards는 구체적인 handover decision algorithm을 정하지 않는다.

Figure 7.30의 handover 흐름은 다음과 같다.

| 단계 | 동작 |
| --- | --- |
| 1 | Source base station이 target base station을 선택하고 `Handover Request`를 보낸다. |
| 2 | Target base station이 radio/time slot 등 resources와 QoS 수용 가능성을 확인하고, 가능하면 resources를 pre-allocate한 뒤 `Handover Request Acknowledge`를 보낸다. |
| 3 | Source base station이 mobile device에게 target base station identity와 channel access information을 알려 준다. Device 관점에서는 이 시점에 새 base station과 send/receive할 수 있다. |
| 4 | Source base station은 mobile device로 직접 보내던 datagrams를 멈추고, handover 중 받은 tunneled datagrams를 target base station으로 forward한다. |
| 5 | Target base station이 MME에 자신이 새 serving base station임을 알리고, MME는 S-GW와 target base station에 tunnel endpoint reconfiguration을 지시한다. |
| 6 | Target base station이 source base station에게 tunnel reconfiguration 완료를 확인해 주고, source base station은 해당 device resources를 release한다. |
| 7 | Target base station이 forwarded datagrams와 새 tunnel로 들어온 datagrams를 mobile device에 전달하고, mobile device에서 나온 outgoing datagrams를 S-GW tunnel로 보낸다. |

5G에서는 cells가 더 작고 base stations가 더 조밀하므로 handover는 더 자주, 더 낮은 latency로 처리되어야 한다. URLLC 같은 real-time 5G application에서는 handover latency가 application 품질에 직접 영향을 준다. 그래서 5G control plane에서는 SDN framework, higher-capacity/lower-latency control-plane implementation이 중요한 연구 주제가 된다.

#### 7.6.2 Mobile IP

`Mobile IP`는 Internet에서 cellular network와 비슷한 mobility service를 제공하려던 standardized architecture다. IPv4에서는 주로 `RFC 5944`로 정의된다. 실제 Internet에 널리 배포되지는 않았는데, cellular networks가 mobile voice/data의 주된 use case를 먼저 해결했고, 사용자가 stationary/local movement일 때는 802.11이나 wired Internet으로 충분한 경우가 많았기 때문이다.

Mobile IP와 4G/5G는 구조가 매우 닮았다.

| 4G/5G element | Mobile IP element | 의미 |
| --- | --- | --- |
| Home network | Home network | permanent identity가 속한 기준 network |
| Visited network | `Foreign network` | mobile device가 현재 roaming 중인 network |
| `IMSI` | `Permanent IP address` | globally unique routable identity |
| `HSS` | `Home agent` | mobile device 위치를 추적하고 home-side coordination 수행 |
| `MME` | `Foreign agent` | foreign network에서 mobile device를 지원하고 home agent에 등록 |
| Indirect forwarding via home network | Indirect forwarding via home network | home/visited 사이 tunneling으로 datagrams 전달 |
| Base station/eNode-B | Access Point | Mobile IP는 특정 AP 기술을 지정하지 않는다. |

Mobile IP standard의 핵심은 세 부분이다.

| 구성 | 기능 |
| --- | --- |
| `Agent discovery` | Foreign agent가 자신의 mobility services를 advertise한다. Care-of-address 제공, home agent registration, datagram forwarding 같은 서비스를 알린다. |
| `Registration with the home agent` | Mobile device 또는 foreign agent가 care-of-address를 home agent에 register/deregister한다. |
| `Indirect routing of datagrams` | Home agent가 mobile device로 향하는 datagrams를 forwarding하고, tunneling과 error handling 규칙을 적용한다. |

즉 Mobile IP는 cellular와 같은 원리를 IP network에 적용한 사례다. 다만 현실에서는 4G/5G cellular mobility가 더 넓게 배포되었고, Internet 자체에는 강한 home/visited network 개념이 깊게 들어오지 않았다.

### 7.7 Wireless and Mobility: Impact on Higher-Layer Protocols

Wireless와 mobility는 link layer와 network layer 문제처럼 보이지만, performance 관점에서는 transport/application layer에도 영향을 준다. TCP와 UDP는 wireless links 위에서도 그대로 동작한다. 문제는 TCP가 loss의 원인을 구분하지 못한다는 점이다.

TCP sender는 segment loss나 corruption을 보면 retransmission하고, congestion control에 따라 congestion window를 줄인다. Wired network에서는 loss가 congestion 때문인 경우가 많으므로 이 가정이 그럭저럭 맞는다. 하지만 wireless network에서는 high BER, fading, multipath, hidden terminal, handover delay 때문에 loss가 생길 수 있다. 이때 router buffers가 비어 있고 실제 congestion이 없는데도 TCP가 congestion window를 줄이면 sending rate가 불필요하게 낮아진다.

Wireless TCP performance 문제에 대한 접근은 세 부류로 나눌 수 있다.

| 접근 | 핵심 아이디어 | 예 |
| --- | --- | --- |
| `Local recovery` | Loss가 발생한 wireless link 근처에서 바로 회복해 TCP sender가 loss를 덜 보게 한다. | 802.11 ARQ, 4G/5G ARQ + FEC |
| `TCP sender awareness of wireless links` | TCP sender/receiver가 wireless link의 존재를 알고 congestion loss와 corruption/handover loss를 구분하려 한다. | LTE-friendly transport/application mechanisms |
| `Split-connection approaches` | End-to-end transport connection을 mobile host-AP wireless segment와 AP-wired host segment로 나눈다. | split TCP, wireless segment 전용 recovery protocol |

Application layer에서는 bandwidth가 scarce commodity라는 점이 중요하다. 특히 cellular wireless links에서는 wired connection과 같은 image-rich content를 그대로 제공하면 user experience가 나빠질 수 있다. 반대로 mobility는 location-aware, context-aware applications라는 새로운 application class를 가능하게 한다. Wireless/mobile networks는 단순히 기존 Internet access를 cable 없이 제공하는 기술이 아니라, ubiquitous computing 환경을 만드는 기반이다.

### 7.8 Summary

이 장의 큰 구조는 `wireless`와 `mobility`를 분리해 이해하는 것이다. Wireless는 radio channel의 특성 때문에 link layer에서 path loss, interference, multipath propagation, hidden terminal, high BER, rate adaptation, ARQ/FEC 같은 문제가 생긴다. Mobility는 device의 point of attachment가 바뀌기 때문에 network layer에서 location tracking, routing, tunneling, handover, home/visited network coordination이 필요해진다.

Wi-Fi/IEEE 802.11은 작은 coverage의 LAN에서 AP/BSS, CSMA/CA, link-layer ACK, RTS/CTS, 802.11 frame address fields, same-subnet mobility, rate adaptation, power management를 제공한다. Bluetooth는 WPAN/piconet에서 master가 polling과 FHSS를 조율하는 짧은 거리 저전력 network다. 4G/5G는 provider-managed wide-area mobility를 위해 UE, base station/eNode-B, HSS, MME, S-GW, P-GW, PDCP/RLC/MAC, GTP/TEID tunnels, RAN scheduling, attachment, power management, global cellular interconnection, 5G NR/Core를 결합한다.

Mobility management의 원리는 home network와 visited network를 나누고, mobile device 위치를 home-side coordination point에 등록한 뒤, indirect/direct routing 중 하나로 correspondent와 mobile device 사이 datagrams를 전달하는 것이다. 실제 4G/5G는 indirect routing과 GTP tunneling, base-station handover, MME/S-GW tunnel reconfiguration으로 이를 구현한다. Mobile IP도 home agent, foreign agent, care-of-address, indirect routing으로 같은 원리를 IP architecture에 적용한다.

## 연결 관계

이 장은 앞 장들과 계속 연결된다. Chapter 3의 reliable data transfer, ARQ, TCP congestion control은 802.11 ACK, LTE RLC ARQ, wireless TCP performance에서 다시 등장한다. Chapter 4의 forwarding, NAT, tunneling, longest prefix matching, IP addressing은 mobility routing과 Mobile IP의 핵심 배경이다. Chapter 5의 routing/control plane, SDN, network management는 MME/HSS/5G Core/control-user plane separation과 이어진다. Chapter 6의 link layer, MAC, Ethernet switching은 802.11 MAC, frame addressing, same-subnet mobility의 switch table update와 직접 연결된다.

## 오해하기 쉬운 내용

`Wireless`와 `mobile`은 같은 말이 아니다. 고정된 wireless host도 있고, 이동하지만 power down 상태라 network-layer mobility가 없는 device도 있다. Network-layer mobility는 ongoing IP datagrams와 higher-layer connections를 유지하면서 access network가 바뀔 때 본격적으로 문제가 된다.

`CSMA/CA`는 `CSMA/CD`의 wireless 버전이 아니다. Wireless station은 송신 중 collision을 안정적으로 detect하기 어렵고 hidden terminal 문제도 있으므로, collision을 detect하기보다 sensing, random backoff, ACK, optional RTS/CTS로 collision 가능성을 줄인다.

`5G`는 단순한 faster radio가 아니다. 5G NR, millimeter wave, dense small cells, MIMO/beam forming 같은 radio-side 변화와 UPF/AMF/SMF, NFV, network slicing, control-user plane separation 같은 core-side 변화가 같이 묶인다.

`Indirect routing`은 비효율적이지만 단순하고 transparent하다. `Direct routing`은 path는 효율적이지만 correspondent가 mobility에 관여해야 하므로 location query와 handover 중 tunnel endpoint update가 복잡해진다.

## 면접 질문

1. Wireless link에서 `SNR`, `BER`, `multipath propagation`, `hidden terminal`이 각각 어떤 문제를 만들고, rate adaptation이나 RTS/CTS가 어떤 부분을 완화하는가?
2. 802.11에서 왜 `CSMA/CD`가 아니라 `CSMA/CA`, link-layer ACK, optional RTS/CTS를 사용하는가?
3. 802.11 frame의 Address 1/2/3는 왜 필요하며, AP를 거쳐 router로 나가는 상황에서 각각 무엇을 가리키는가?
4. LTE에서 `MME`, `HSS`, `S-GW`, `P-GW`, `GTP-U`, `TEID`가 attach와 data forwarding에서 어떤 역할을 하는가?
5. `Indirect routing`과 `direct routing`의 trade-off를 triangle routing problem과 correspondent transparency 관점에서 설명하라.
6. 4G/5G handover에서 source base station, target base station, MME, S-GW가 어떤 순서로 tunnel endpoint를 바꾸는가?
7. TCP가 wireless loss를 congestion loss로 오해하면 어떤 문제가 생기며, local recovery/split connection 방식은 어떻게 이를 완화하는가?
