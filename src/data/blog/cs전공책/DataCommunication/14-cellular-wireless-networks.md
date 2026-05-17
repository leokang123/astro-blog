---
title: "Chapter 14. Cellular Wireless Networks"
order: 14
pubDatetime: 2026-05-18T00:00:00+09:00
modDatetime: 2026-05-18T00:00:00+09:00
description: "Data and Computer Communications 정리: Chapter 14. Cellular Wireless Networks"
tags:
  - "DataCommunication"
  - "CS"
---

## 개요

**Cellular network**는 넓은 지역을 하나의 강한 송신기로 덮는 대신, 지역을 여러 **cell**로 나누고 각 cell을 낮은 전력의 **base station (BS)**이 담당하게 하는 무선 network 구조다. 핵심 효과는 같은 spectrum을 지리적으로 떨어진 cell에서 다시 쓰는 **frequency reuse**다. 이 덕분에 한정된 주파수 대역으로 훨씬 많은 mobile user를 동시에 지원할 수 있다.

이 장은 cellular wireless network를 세대별로 본다. 먼저 모든 cellular system에 공통인 cell geometry, frequency reuse, capacity increase, handoff, fading/multipath를 다룬다. 이후 first-generation analog system의 대표인 **AMPS**, second-generation digital system의 대표 기술인 **CDMA / IS-95**, 그리고 third-generation **3G / IMT-2000 / W-CDMA**로 이어진다.

| 세부 주제 | 핵심 질문 | 대표 용어 |
|---|---|---|
| Principles of Cellular Networks | cell을 어떻게 배치하고 같은 frequency를 어떻게 재사용하는가? | cell, BS, MTSO, frequency reuse, reuse factor, handoff, fading |
| First-Generation Analog | 1G analog cellular system은 어떤 구조와 한계를 가졌는가? | AMPS, FDMA, NAM, MIN, ESN |
| Second-Generation CDMA | digital cellular에서 CDMA는 multipath와 여러 user를 어떻게 다루는가? | CDMA, IS-95, RAKE receiver, Walsh code, PN sequence |
| Third-Generation Systems | 3G는 왜 등장했고 어떤 radio interface 계열로 발전했는가? | 3G, IMT-2000, W-CDMA, CDMA2000, TD-CDMA |

## 핵심 개념

### Cellular의 본질: high-power single cell에서 low-power many cells로

Cellular radio는 mobile radio telephone service의 capacity를 늘리기 위해 등장했다. Cellular 이전의 mobile radio telephone service는 하나의 high-power transmitter/receiver가 넓은 반경을 커버하는 방식이었다. 원문 예시는 effective radius 약 80 km, channel 약 25개 수준이다. Coverage는 넓지만, 같은 frequency를 가까운 곳에서 다시 쓰기 어렵기 때문에 capacity가 작다.

Cellular approach는 반대로 100 W 이하 수준의 multiple low-power transmitter를 사용한다. 각 transmitter의 range가 작으므로 전체 지역을 여러 cell로 나누고, 각 cell에 antenna와 base station을 둔다. Adjacent cells는 interference/crosstalk를 피하기 위해 서로 다른 frequency를 쓰지만, 충분히 떨어진 cell은 같은 frequency band를 다시 쓴다.

## 세부 정리

### 14.1 Principles of Cellular Networks

#### Cellular Network Organization

각 cell은 하나의 **base station (BS)**이 담당한다. BS는 transmitter, receiver, control unit으로 구성되며, cell 안의 mobile unit과 radio link를 만든다. Cellular design의 첫 문제는 coverage area를 어떤 cell shape로 나눌 것인가다.

![Figure 14.1](@/assets/images/data-communication-180-figure-14-1-page-434.png)
*Figure 14.1 · PDF p. 434 · square pattern과 hexagonal pattern의 cell geometry 비교*

Square cell matrix는 정의하기 쉽지만 handoff 판단에는 불리하다. Square width가 `d`이면 인접 cell center까지 거리가 `d`인 neighbor 4개와 `sqrt(2)d`인 neighbor 4개가 생긴다. Mobile user가 cell boundary로 이동할 때 adjacent antenna까지 거리가 균등하지 않아 어느 antenna로 넘길지 판단이 복잡해진다.

Hexagonal pattern은 adjacent cell center가 균등한 거리에 놓이도록 해 handoff decision을 단순화한다. Hexagon의 radius `R`은 중심에서 꼭짓점까지의 거리이며 side length와 같다. Cell radius가 `R`일 때 adjacent cell center 사이 거리는 다음과 같다.

$$
d = \sqrt{3}R
$$

실제 cellular layout은 완벽한 hexagon이 아니다. Topography, local signal propagation, antenna site 확보 같은 현실 조건 때문에 cell boundary는 이상적 도형에서 벗어난다. 그래도 hexagonal model은 frequency reuse와 capacity 계산을 설명하는 표준적인 추상화다.

#### Frequency Reuse

무선 신호는 wire처럼 경계에 갇히지 않기 때문에, 같은 frequency를 너무 가까이 쓰면 서로 간섭한다. **Frequency reuse**는 각 cell의 transmit power를 조절하여 cell 안에서는 특정 frequency로 통신하되, 그 frequency의 leakage가 adjacent cell에서 큰 interference를 만들지 않게 하고, 충분히 떨어진 cell에서 같은 frequency를 다시 쓰는 방법이다.

![Figure 14.2](@/assets/images/data-communication-181-figure-14-2-page-435.png)
*Figure 14.2 · PDF p. 435 · reuse factor N=4, N=7, N=19 frequency reuse pattern*

Reuse pattern이 `N`개 cell로 구성되고 전체 system에 `K`개 frequency가 할당되어 있다면, 각 cell은 평균적으로 다음 개수의 frequency를 가진다.

$$
\frac{K}{N}
$$

`N`은 **reuse factor**다. `N`이 작으면 cell당 frequency 수가 많아져 capacity는 커지지만 cochannel interference가 강해질 수 있다. `N`이 크면 같은 frequency를 쓰는 cell 사이 거리가 멀어져 interference는 줄지만 cell당 frequency 수가 줄어든다.

Hexagonal pattern에서 자주 쓰는 parameter는 다음과 같다.

| Symbol | 의미 |
|---|---|
| `D` | 같은 frequency band를 쓰는 cell center 사이의 최소 거리, 즉 cochannel distance |
| `R` | cell radius |
| `d` | adjacent cell center 사이 거리, `d = sqrt(3)R` |
| `N` | 반복 pattern 안의 cell 수, reuse factor |

Hexagonal cell pattern에서 가능한 `N` 값은 다음 형태로 나온다.

$$
N = I^2 + J^2 + IJ,\quad I,J = 0,1,2,3,\ldots
$$

따라서 가능한 값은 `1, 3, 4, 7, 9, 12, 13, 16, 19, 21, ...`이다. Cochannel distance와 cell radius의 관계는 다음과 같다.

$$
\frac{D}{R} = \sqrt{3N}
$$

또는 adjacent center distance `d`를 쓰면 다음처럼 표현할 수 있다.

$$
\frac{D}{d} = \sqrt{N}
$$

원문 AMPS 예시에서 `K = 395`, `N = 7`이면 cell당 평균 frequency 수는 `395 / 7`, 즉 약 57개다. 이 숫자는 reuse factor가 capacity와 interference의 균형점임을 보여준다.

#### Increasing Capacity

System이 성장하면 특정 cell에 할당된 frequency만으로 call traffic을 감당하지 못할 수 있다. Capacity를 늘리는 대표 방법은 다음과 같다.

| 방법 | 동작 | Trade-off |
|---|---|---|
| Adding new channels | 초기에는 전체 channel을 다 쓰지 않고 남겨 두었다가 수요 증가에 따라 channel을 추가한다. | 계획적 확장에는 좋지만 spectrum 한계에 도달하면 부족하다. |
| Frequency borrowing | congested cell이 adjacent cell의 frequency를 빌리거나 dynamic assignment를 사용한다. | 주변 cell interference와 channel 관리가 복잡해진다. |
| Cell splitting | high-usage area의 cell을 더 작은 cell로 나눈다. | capacity는 늘지만 base station 수와 handoff 빈도가 증가한다. |
| Cell sectoring | 한 cell을 3개 또는 6개 wedge-shaped sector로 나누고 directional antenna를 쓴다. | interference를 줄이고 reuse 효율을 높이지만 antenna/control 구성이 복잡해진다. |
| Microcells | antenna를 낮은 건물, 건물 측면, lamp post 등에 배치해 작은 coverage를 만든다. | 도시 거리, highway, 대형 공공건물에 유용하지만 cell planning과 handoff가 더 촘촘해진다. |

![Figure 14.3](@/assets/images/data-communication-182-figure-14-3-page-437.png)
*Figure 14.3 · PDF p. 437 · 큰 cell을 더 작은 cell로 나누는 cell splitting*

Cell splitting의 capacity 효과는 면적 계산으로 볼 수 있다. Cell radius를 factor `F`만큼 줄이면 coverage area는 `F^2`만큼 줄어들고, 같은 지역을 덮기 위해 필요한 base station 수는 `F^2`만큼 증가한다. 예를 들어 radius를 절반으로 줄이면 같은 area에 필요한 cell 수가 4배가 되고, frequency reuse를 유지한다면 concurrent call capacity도 대략 4배로 늘 수 있다.

Macrocell과 microcell의 차이는 다음처럼 요약된다.

| 항목 | Macrocell | Microcell |
|---|---|---|
| Cell radius | 1-20 km | 0.1-1 km |
| Transmission power | 1-10 W | 0.1-1 W |
| Average delay spread | 0.1-10 microseconds | 10-100 ns |
| Maximum bit rate | 약 0.3 Mbps | 약 1 Mbps |

작은 cell은 낮은 transmit power와 더 좋은 propagation condition을 제공하지만, mobile unit이 더 자주 cell boundary를 지나므로 **handoff**가 훨씬 빈번해진다.

#### Frequency Reuse 예시

원문 예시는 같은 geographic area를 더 작은 cell로 나눌 때 capacity가 어떻게 늘어나는지 보여준다. Hexagon radius가 `R`일 때 면적은 다음과 같다.

$$
A = 1.5R^2\sqrt{3}
$$

32개 cell, radius `1.6 km`, total traffic channel `336`, reuse factor `N = 7`이면 cell당 channel은 `336 / 7 = 48`개이고, 전체 concurrent call capacity는 다음과 같다.

$$
48 \times 32 = 1536\ \text{channels}
$$

같은 area를 radius `0.8 km`인 128개 cell로 나누면 cell당 channel 수는 여전히 48개지만 전체 capacity는 다음처럼 증가한다.

$$
48 \times 128 = 6144\ \text{channels}
$$

즉 같은 spectrum과 같은 reuse factor를 쓰더라도 cell size를 줄이면 같은 지역 안의 cell 수가 늘고, 그만큼 total concurrent calls가 증가한다. 이것이 cellular design의 가장 중요한 capacity scaling 원리다.

#### Operation of Cellular Systems

Cellular system의 주요 구성요소는 **base station (BS)**, **mobile telecommunications switching office (MTSO)**, 그리고 public telecommunications switching network다.

![Figure 14.5](@/assets/images/data-communication-183-figure-14-5-page-439.png)
*Figure 14.5 · PDF p. 439 · BS, MTSO, public network로 이루어진 cellular system 개요*

각 cell 중앙 근처에는 BS가 있고, BS는 antenna, controller, 여러 transceiver를 포함한다. Controller는 mobile unit과 network 나머지 부분 사이의 call process를 처리한다. 여러 mobile unit은 한 cell 안에서 움직이며 BS와 통신한다. 여러 BS는 하나의 MTSO에 연결되고, MTSO는 mobile unit 사이의 call, mobile subscriber와 fixed subscriber 사이의 call을 연결한다. 또한 MTSO는 voice channel assignment, handoff, billing information monitoring을 수행한다.

Mobile unit과 BS 사이에는 두 종류의 channel이 있다.

| Channel | 역할 |
|---|---|
| **Control channel** | call setup/maintenance, mobile unit과 가장 가까운 BS의 관계 설정, paging, registration에 사용된다. |
| **Traffic channel** | 사용자 voice 또는 data connection을 운반한다. |

![Figure 14.6](@/assets/images/data-communication-184-figure-14-6-page-440.png)
*Figure 14.6 · PDF p. 440 · mobile cellular call setup, paging, ongoing call, handoff 흐름*

Figure 14.6의 통화 흐름은 다음과 같다.

| 단계 | 동작 |
|---|---|
| Mobile unit initialization | 전원을 켜면 mobile unit이 strongest setup control channel을 scan/select한다. 이를 통해 현재 동작할 cell의 BS를 선택하고, MTSO와 handshake하여 user identification과 location registration을 수행한다. |
| Mobile-originated call | Calling mobile unit이 preselected setup channel로 called unit number를 보낸다. Mobile unit은 forward channel에서 setup channel idle 여부를 확인한 뒤 corresponding reverse channel로 request를 전송한다. |
| Paging | MTSO가 called mobile number를 기준으로 일부 BS에 paging message를 보내고, 각 BS는 자기 setup channel로 paging signal을 broadcast한다. |
| Call accepted | Called mobile unit이 자기 number를 인식해 BS에 응답하고, MTSO가 두 BS 사이 circuit을 설정한다. 각 BS cell 안에서 available traffic channel을 선택해 mobile unit에 알린다. |
| Ongoing call | 두 mobile unit은 각자의 BS와 MTSO를 경유해 voice/data signal을 교환한다. |
| Handoff | 이동 중 cell range가 바뀌면 traffic channel을 새 BS의 channel로 바꾼다. 이 전환은 call interruption이나 user notification 없이 수행되어야 한다. |

Cellular system은 이 밖에도 **call blocking**, **call termination**, **call drop**, fixed/remote mobile subscriber와의 연결을 처리한다. Call blocking은 nearest BS의 traffic channel이 모두 바쁠 때 일정 횟수 재시도 후 busy tone을 주는 경우다. Call drop은 interference나 weak signal 때문에 minimum required signal strength를 유지하지 못할 때 traffic channel을 끊고 MTSO에 알리는 경우다.

#### Mobile Radio Propagation Effects

Mobile radio communication은 wired communication이나 fixed wireless communication보다 propagation이 훨씬 불안정하다. 주요 concern은 signal strength와 fading이다.

**Signal strength**는 receiver에서 quality를 유지할 만큼 강해야 하지만, 같은 frequency band를 쓰는 다른 cell에 cochannel interference를 만들 만큼 강해서는 안 된다. Human-made noise, 자동차 ignition noise, 다른 signal source, BS와 mobile unit 사이 거리, mobile movement가 모두 signal level을 바꾼다. 따라서 cellular layout 설계자는 BS/mobile transmit power, mobile antenna height, BS antenna height, local propagation model을 함께 고려해야 한다.

원문은 cell size 추정을 위한 대표 empirical model로 **Okumura/Hata model**을 소개한다. Urban environment에서 path loss는 carrier frequency `fc`, transmitting antenna height `ht`, receiving antenna height `hr`, distance `d`, mobile antenna correction factor `A(hr)`의 함수다. 암기할 식이라기보다는, cellular planning이 단순 geometry가 아니라 empirical propagation model에 의존한다는 점이 중요하다.

#### Fading과 Multipath Propagation

**Fading**은 transmission medium이나 path 변화 때문에 received signal power가 시간에 따라 변하는 현상이다. Fixed environment에서는 rainfall 같은 atmospheric condition이 fading을 만들 수 있지만, mobile environment에서는 antenna 중 하나가 움직이므로 obstacle과 path 관계가 계속 변하고 훨씬 복잡한 fading이 생긴다.

![Figure 14.7](@/assets/images/data-communication-185-figure-14-7-page-443.png)
*Figure 14.7 · PDF p. 443 · reflection, scattering, diffraction propagation mechanism*

Multipath propagation의 세 mechanism은 다음과 같다.

| Mechanism | 조건 | 효과 |
|---|---|---|
| **Reflection** | signal wavelength보다 큰 surface를 만날 때 | ground/building 반사파가 LOS wave와 constructive/destructive interference를 만든다. |
| **Diffraction** | wavelength보다 큰 impenetrable body의 edge를 만날 때 | edge가 새로운 source처럼 작동해 LOS가 없어도 signal reception이 가능해진다. |
| **Scattering** | obstacle 크기가 wavelength와 비슷하거나 더 작을 때 | lamp post, traffic sign 같은 작은 물체가 여러 약한 outgoing signal을 만든다. |

LOS가 명확하면 diffraction/scattering은 보통 작고 reflection이 중요할 수 있다. Urban street level처럼 clear LOS가 없으면 diffraction과 scattering이 signal reception의 주요 수단이 된다.

#### Multipath가 만드는 ISI

Multipath의 첫 번째 문제는 여러 signal copy가 서로 다른 phase로 도착해 destructive addition을 만들 수 있다는 점이다. 그러면 signal-to-noise ratio가 낮아져 receiver detection이 어려워진다.

두 번째 문제는 digital transmission에서 특히 중요한 **intersymbol interference (ISI)**다.

![Figure 14.8](@/assets/images/data-communication-186-figure-14-8-page-444.png)
*Figure 14.8 · PDF p. 444 · time-variant multipath에서 delayed pulse가 다음 symbol을 방해하는 모습*

Figure 14.8은 narrow pulse가 한 번 전송되었을 때 receiver가 LOS pulse 외에도 reflection/diffraction/scattering으로 생긴 secondary pulse를 받는 상황을 보여준다. 이 pulse가 bit information을 담고 있다면, 지연된 copy가 다음 bit의 primary pulse와 겹쳐 noise처럼 작용한다. Mobile antenna가 움직이면 obstacle 위치 관계가 바뀌므로 secondary pulse의 개수, magnitude, timing도 계속 변한다. 그래서 multipath를 제거하는 signal processing은 고정 filter 하나로 해결되지 않는다.

#### Types of Fading

Fading은 변화 속도와 frequency 영향 범위로 나눌 수 있다.

| 분류 | 의미 |
|---|---|
| **Fast fading** | mobile unit이 약 반 wavelength 정도 이동하는 짧은 거리에서도 signal strength가 급격히 변한다. 900 MHz에서 wavelength는 약 0.33 m이고, amplitude가 짧은 거리에서 20-30 dB까지 바뀔 수 있다. |
| **Slow fading** | wavelength보다 훨씬 긴 거리를 이동하면서 건물 높이, 빈 공간, 교차로 같은 larger environment 변화에 따라 평균 received power가 변한다. |
| **Flat / nonselective fading** | received signal의 모든 frequency component가 같은 비율로 함께 변한다. |
| **Selective fading** | signal bandwidth의 일부 frequency component만 다르게 attenuate된다. Channel bandwidth와 fading spectrum의 상대적 크기에 따라 중요성이 결정된다. |

#### Error Compensation Mechanisms

Multipath fading으로 생기는 error/distortion을 줄이는 방법은 세 범주로 정리된다.

| Mechanism | 적용 | 핵심 아이디어 |
|---|---|---|
| **Forward Error Correction (FEC)** | digital data, digitized voice/video | redundancy를 많이 넣어 receiver가 error를 복구하게 한다. Mobile wireless에서는 total bits/data bits 비율이 2-3 정도로 클 수 있다. |
| **Adaptive equalization** | analog 또는 digital transmission | dispersed symbol energy를 원래 time interval로 모아 ISI를 줄인다. |
| **Diversity techniques** | fading event가 channel별로 독립적이라는 성질 활용 | 여러 logical/physical channel로 signal을 나누어 가장 나쁜 fading 하나에 전체 signal이 묶이지 않게 한다. |

Diversity에는 여러 nearby antenna를 쓰는 **space diversity**, directional antenna를 여러 방향으로 두는 방식, 그리고 **frequency diversity**나 **time diversity**가 있다. Frequency diversity의 대표 예가 spread spectrum이며, 이는 Chapter 9와 연결된다.

### 14.2 First-Generation Analog

First-generation cellular network는 traffic channel이 analog인 cellular telephone network다. 대표 예시는 **Advanced Mobile Phone Service (AMPS)**다. 이 절에서 중요한 점은 AMPS가 cellular principle을 analog voice와 frequency channelization으로 구현했다는 것이다.

#### Spectral Allocation

AMPS는 base station에서 mobile unit으로 가는 방향과 mobile unit에서 base station으로 가는 방향에 별도 band를 둔다. 즉 full-duplex 통화를 위해 forward/reverse 방향의 frequency가 분리된다.

Table 14.2의 핵심 parameter는 다음과 같다.

| Parameter | AMPS 값 |
|---|---|
| Base station transmission band | 869-894 MHz |
| Mobile unit transmission band | 824-849 MHz |
| Forward/reverse channel spacing | 45 MHz |
| Channel bandwidth | 30 kHz |
| Full-duplex voice channels | 790 |
| Full-duplex control channels | 42 |
| Mobile unit maximum power | 3 W |
| Cell radius | 2-20 km |
| Voice channel modulation | FM, 12-kHz peak deviation |
| Control channel modulation | FSK, 8-kHz peak deviation |
| Data transmission rate | 10 kbps |
| Error control coding | BCH (48,36,5), BCH (40,28,5) |

North American AMPS에서는 두 25-MHz band가 사용되고, operator별로 한 방향당 12.5 MHz가 할당된다. Channel spacing은 30 kHz이므로 operator당 416 channel을 만들 수 있다. 이 중 21개는 control channel이고, 나머지 395개가 call carrying channel이다. Voice conversation은 analog FM으로 운반되고, control information은 10 kbps digital data로 전송된다. Major market에서는 이 channel 수가 충분하지 않으므로 AMPS는 frequency reuse에 의존한다.

#### AMPS Operation

AMPS-capable cellular telephone에는 read-only memory에 **numeric assignment module (NAM)**이 들어 있다. NAM은 service provider가 부여한 telephone number, 즉 **Mobile Identification Number (MIN)**와 manufacturer가 부여한 serial number, 즉 **Electronic Serial Number (ESN)**를 담는다. Phone이 켜지면 ESN과 MIN을 MTSO에 전송한다. MTSO는 stolen unit database를 확인해 도난 단말을 차단할 수 있고, MIN을 billing에 사용한다.

AMPS에서 call placement는 다음 흐름으로 이루어진다.

| 단계 | 동작 |
|---|---|
| 1 | Subscriber가 called party의 telephone number를 입력하고 send key를 누른다. |
| 2 | MTSO가 telephone number validity와 user authorization을 확인한다. 일부 service provider는 theft 방지를 위해 PIN도 요구한다. |
| 3 | MTSO가 user cell phone에 sending/receiving에 사용할 traffic channel을 알려 준다. |
| 4 | MTSO가 called party에 ringing signal을 보낸다. 원문은 2-4단계가 call initiation 후 약 10초 안에 일어난다고 설명한다. |
| 5 | Called party가 응답하면 MTSO가 두 party 사이 circuit을 설정하고 billing information을 시작한다. |
| 6 | 한쪽이 끊으면 MTSO가 circuit을 release하고 radio channel을 해제하며 billing information을 완료한다. |

#### AMPS Control Channels

각 AMPS service는 21개의 full-duplex 30-kHz control channel을 포함한다. 이는 subscriber에서 base station으로 가는 **reverse control channel (RCC)** 21개와 base station에서 subscriber로 가는 **forward control channel** 21개로 구성된다. Control channel은 FSK로 digital data frame을 전송한다.

통화 중에도 control information은 voice channel 위로 보낼 수 있다. Mobile unit이나 base station이 약 100 ms 동안 voice FM transmission을 끄고 FSK-encoded message를 burst로 삽입한다. 이런 message는 power level change나 handoff 같은 urgent control에 사용된다.

### 14.3 Second-Generation CDMA

Second-generation cellular system은 1G의 capacity 압박과 analog 한계를 해결하기 위해 digital traffic channel을 도입했다. 핵심 변화는 voice도 digital form으로 encode한 뒤 전송하고, digital data service를 더 자연스럽게 지원하며, encryption/error correction/multiple access를 digital processing으로 처리한다는 점이다.

1G와 2G의 차이는 다음처럼 정리된다.

| 구분 | 1G cellular | 2G cellular |
|---|---|---|
| Traffic channel | 거의 analog, voice는 FM | digital traffic channel |
| Digital data | modem을 통해 analog form으로 변환 | digital data를 직접 지원 |
| Voice | analog voice channel | digitized voice 후 전송 |
| Encryption | user traffic이 clear로 전송되어 보안 약함 | user/control traffic digitization 덕분에 encryption이 쉬움 |
| Error control | analog 중심이라 제한적 | error detection/correction 적용 가능 |
| Channel access | channel 하나를 한 user에게 할당 | TDMA 또는 CDMA로 channel을 여러 user가 동적으로 공유 |

#### Code Division Multiple Access (CDMA)

Cellular CDMA도 FDMA처럼 cell에 frequency bandwidth가 할당되고, reverse direction과 forward direction이 분리된다. Full-duplex communication에서는 mobile unit이 reverse channel과 forward channel을 모두 사용한다. 차이는 transmission이 **direct-sequence spread spectrum (DS-SS)** 형태라는 점이다. DS-SS는 **chipping code**로 data rate를 높여 signal bandwidth를 넓히고, 여러 user에게 orthogonal chipping code를 할당해 receiver가 individual transmission을 분리하도록 한다.

CDMA의 장점은 다음과 같다.

| 장점 | 설명 |
|---|---|
| **Frequency diversity** | 넓은 bandwidth로 spread되어 noise burst나 selective fading 같은 frequency-dependent impairment 영향을 줄인다. |
| **Multipath resistance** | CDMA chipping code는 low cross-correlation뿐 아니라 low autocorrelation도 가져, 한 chip interval보다 더 지연된 multipath copy가 dominant signal을 덜 방해한다. |
| **Privacy** | user별 unique code와 noise-like spread spectrum 때문에 기본적인 privacy 성질이 있다. |
| **Graceful degradation** | FDMA/TDMA는 동시 user 수가 fixed limit을 넘으면 급격히 막히지만, CDMA는 user가 늘수록 noise level/error rate가 점진적으로 증가한다. |

단점도 분명하다.

| 단점 | 설명 |
|---|---|
| **Self-jamming** | mobile users가 완전히 synchronized되지 않으면 chip boundary가 맞지 않아 spreading sequence orthogonality가 깨지고 cross-correlation interference가 생긴다. |
| **Near-far problem** | receiver에 가까운 transmitter의 signal이 덜 attenuate되어 멀리 있는 mobile unit signal 복구를 어렵게 만든다. Power control이 중요해지는 이유다. |

#### RAKE Receiver

CDMA는 multipath를 단순 noise로만 보지 않고, 경우에 따라 여러 path의 signal energy를 모아 성능을 높인다. Multipath signal copy들이 한 chip interval보다 더 떨어져 도착하면 receiver는 dominant signal에 chipping sequence를 correlate하여 복구할 수 있다. 더 나은 방법은 여러 path의 signal을 각각 recover한 뒤 적절한 delay와 weight로 combine하는 것이다. 이것이 **RAKE receiver**의 원리다.

![Figure 14.9](@/assets/images/data-communication-187-figure-14-9-page-450.png)
*Figure 14.9 · PDF p. 450 · multipath copy를 여러 correlator로 모아 결합하는 RAKE receiver*

Figure 14.9의 흐름은 다음과 같다. Transmitter는 binary data를 자기 chipping code와 XOR해 spread sequence를 만들고 modulation한다. Wireless multipath channel은 서로 다른 delay `T1`, `T2`, `T3`와 attenuation factor `a1`, `a2`, `a3`를 가진 copy를 만든다. Receiver는 demodulated chip stream을 delay가 다른 여러 correlator에 넣고, channel estimate에서 얻은 weight로 output을 combine한다. 따라서 multipath가 반드시 손실만이 아니라 diversity source로도 사용된다.

#### IS-95 Channel Structure

**IS-95**는 대표적인 second-generation CDMA system이다. Forward link와 reverse link의 structure가 다르다.

![Figure 14.10](@/assets/images/data-communication-188-figure-14-10-page-451.png)
*Figure 14.10 · PDF p. 451 · IS-95 forward/reverse logical CDMA channel structure*

Forward link는 같은 `1.228 MHz` bandwidth를 공유하는 최대 64개 logical CDMA channel로 구성된다. Forward channel의 code는 64 x 64 **Walsh matrix**에서 나온 64개 orthogonal 64-bit code다.

| Forward channel | 역할 |
|---|---|
| **Pilot channel (0)** | continuous all-zero signal. Mobile unit이 timing information을 획득하고, demodulation phase reference와 handoff 판단용 signal strength comparison에 사용한다. |
| **Synchronization channel (32)** | 1200 bps. Mobile station이 system time, long code state, protocol revision 등 cellular system identification을 얻는다. |
| **Paging channels (1-7)** | 하나 이상의 mobile station에 message를 전달한다. |
| **Traffic channels (8-31, 33-63)** | 최대 55개 traffic channel. Rate set 1은 최대 9600 bps, 이후 revision은 rate set 2로 최대 14,400 bps를 지원한다. |

Reverse link는 같은 `1.228 MHz` bandwidth를 공유하는 최대 94개 logical CDMA channel로 구성된다. 최대 32개 access channel과 62개 traffic channel을 지원한다. Reverse traffic channel은 mobile-unique하며, 각 station은 electronic serial number 기반의 unique long code mask를 사용한다. Access channel은 call initiation, paging response, location update에 사용된다.

#### IS-95 Forward Link Transmission

Forward traffic channel processing의 핵심은 variable-rate voice/data를 일정한 spread spectrum chip rate로 변환하는 것이다. 원문 Figure 14.11은 manifest에 없지만, processing 흐름은 다음과 같다.

| 단계 | 동작 |
|---|---|
| Voice/data input | Voice는 8550 bps로 encode되고, error detection bit가 붙어 9600 bps가 된다. Quiet period에는 1200 bps까지 낮아질 수 있고, 2400/4800 bps도 사용된다. |
| 20-ms frame | Data/digitized speech는 20-ms block 단위로 처리된다. |
| Convolutional encoder | rate 1/2 encoder가 FEC를 제공해 최대 effective data rate를 19.2 kbps로 만든다. 낮은 rate에서는 symbol repetition으로 19.2 kbps에 맞춘다. |
| Block interleaver | burst error 영향을 줄이기 위해 error를 시간상 분산시킨다. |
| Scrambling | 42-bit shift register 기반 long code가 privacy mask 역할을 하고 repetitive pattern을 줄인다. User electronic serial number로 initialized된다. |
| Power control insertion | base station이 800 bps power control bit를 traffic channel에 삽입해 mobile output power를 increment/decrement/stable로 지시한다. |
| Walsh spreading | 64 x 64 Walsh matrix의 한 row로 19.2 kbps를 1.2288 Mbps로 spread한다. |
| QPSK modulation | I/Q channel로 나누고 short code와 XOR한 뒤 carrier에 QPSK modulation한다. |

여기서 중요한 설계 이유는 세 가지다. FEC와 interleaving은 mobile channel error를 줄이고, scrambling과 long code는 privacy 및 interference pattern 완화를 돕고, Walsh code는 forward channel 내부 logical channel orthogonality를 제공한다.

#### IS-95 Reverse Link Transmission

Reverse link는 forward link와 비슷해 보이지만 목적과 code 사용 방식이 다르다.

![Figure 14.12](@/assets/images/data-communication-189-figure-14-12-page-455.png)
*Figure 14.12 · PDF p. 455 · IS-95 reverse traffic channel transmission processing*

Reverse traffic channel processing은 다음과 같다.

| 단계 | 동작 |
|---|---|
| Convolutional encoder | rate 1/3 encoder를 사용해 최대 effective data rate를 28.8 kbps로 만든다. |
| Block interleaver | forward link와 마찬가지로 error burst 영향을 분산한다. |
| 64-ary orthogonal modulation | interleaver output을 6-bit unit으로 묶고, 각 6-bit value를 64 x 64 Walsh matrix의 한 row index로 사용한다. 64-bit row가 6-bit input을 대체하므로 data rate가 `64/6`배 확장되어 307.2 kbps가 된다. |
| Data burst randomizer | long code mask를 사용해 20-ms frame 안에서 burst를 smoothing하고 다른 mobile station과의 interference를 줄인다. |
| Long code spreading | mobile-unique long code를 randomizer output과 XOR하여 최종 1.2288 Mbps stream을 만든다. |
| OQPSK modulation | Offset QPSK로 carrier에 modulation한다. |

Reverse link에서 Walsh matrix는 forward link처럼 channel separation용 orthogonal code만으로 쓰이는 것이 아니다. Reverse에서는 6-bit symbol을 64-bit orthogonal codeword로 바꾸는 block coding에 가까우며, base station receiver의 decision-making을 개선한다. 이를 `(n, k) = (64, 6)`, `d_min = 32`인 block error-correcting code처럼 볼 수 있다.

Forward link와 reverse link의 modulator가 다른 이유도 중요하다. Forward link에서는 Walsh matrix에서 나온 spreading code들이 orthogonal하다. Reverse link에서는 여러 mobile unit의 transmissions가 chip boundary에 완전히 맞지 않으므로 spreading code orthogonality가 보장되지 않는다. 따라서 long code, randomization, power control, OQPSK 같은 장치가 interference를 줄이는 데 더 중요하다.

### 14.4 Third-Generation Systems

**Third-generation (3G)** wireless communication의 목표는 voice뿐 아니라 multimedia, data, video를 지원할 수 있는 비교적 high-speed wireless communication이다. ITU의 **IMT-2000** initiative는 3G capability를 다음 방향으로 정의했다.

| Capability | 의미 |
|---|---|
| voice quality | public switched telephone network와 comparable한 voice quality |
| high mobility data | large area에서 high-speed vehicle user에게 144 kbps 제공 |
| pedestrian data | small area에서 stationary 또는 slow-moving pedestrian에게 384 kbps 제공 |
| office use | 단계적으로 2.048 Mbps 지원 |
| data symmetry | symmetrical/asymmetrical data transmission rate 모두 지원 |
| service mode | packet-switched data service와 circuit-switched data service 모두 지원 |
| Internet adaptation | inbound/outbound traffic asymmetry를 효율적으로 반영하는 adaptive Internet interface |
| spectrum efficiency | available spectrum의 더 효율적 사용 |
| equipment/service flexibility | 다양한 mobile equipment, 새로운 service/technology 도입 지원 |

3G의 배경에는 **universal personal telecommunications**와 **universal communications access**라는 목표가 있다. 전자는 사용자가 하나의 account로 넓은 지역 또는 전 세계에서 자신을 식별하고 통신 서비스를 쓰는 개념이고, 후자는 사무실, 거리, 비행기 같은 다양한 환경에서 같은 terminal로 information service에 접속하는 개념이다. 따라서 3G는 단순히 voice channel을 더 많이 만드는 것이 아니라, mobile computing과 Internet access를 wireless로 확장하려는 방향이다.

#### Alternative Interfaces: IMT-2000 Radio Interfaces

IMT-2000은 하나의 radio interface만 강제하지 않고 여러 interface를 포함한다. 중요한 이유는 1G/2G system에서 3G로 부드럽게 진화할 수 있는 upgrade path를 제공하기 위해서다.

![Figure 14.13](@/assets/images/data-communication-190-figure-14-13-page-457.png)
*Figure 14.13 · PDF p. 457 · IMT-2000 terrestrial radio interface 계열*

Figure 14.13의 interface 계열은 다음처럼 정리된다.

| Interface | 계열 | 설명 |
|---|---|---|
| **IMT-DS** | CDMA-based | Direct Spread, 즉 **W-CDMA**. UMTS의 한 축이며 high data rate와 bandwidth efficiency를 목표로 한다. |
| **IMT-MC** | CDMA-based | Multicarrier, 즉 **cdma2000**. North American origin이며 W-CDMA와 유사하지만 incompatible하고 chip rate 등이 다르다. |
| **IMT-TC** | CDMA/TDMA hybrid | Time Code, 즉 **TD-CDMA**. W-CDMA와 TDMA를 결합해 GSM 계열의 upgrade path를 제공한다. |
| **IMT-SC** | TDMA-based | Single Carrier, TDMA-only network를 위한 interface다. |
| **IMT-FT** | FDMA/TDMA-based | Frequency-Time, DECT 계열에서 발전해 일부 3G service를 제공할 수 있다. |

#### W-CDMA Parameters와 3G CDMA Design Issues

3G의 dominant technology는 CDMA 계열이다. W-CDMA의 key parameter는 다음처럼 요약된다.

| Parameter | W-CDMA 값/방식 |
|---|---|
| Channel bandwidth | 5 MHz |
| Forward RF channel structure | Direct spread |
| Chip rate | 3.84 Mcps |
| Frame length | 10 ms |
| Slots per frame | 15 |
| Spreading modulation | balanced QPSK(forward), dual channel QPSK(reverse), complex spreading circuit |
| Data modulation | QPSK(forward), BPSK(reverse) |
| Coherent detection | pilot symbols |
| Multirate | variable spreading과 multicode |
| Spreading factors | 4-256 |
| Power control | open loop와 fast closed loop, 1.6 kHz |
| Forward spreading | variable length orthogonal sequences로 channel separation, Gold sequences로 cell/user separation |
| Reverse spreading | forward와 유사하되 I/Q channel에서 다른 time shift 사용 |

3G CDMA design에서 bandwidth 목표가 5 MHz인 이유는 균형점이다. 5 MHz 이상이면 narrower bandwidth보다 multipath resolution이 좋아진다. 하지만 spectrum은 제한된 resource이므로 너무 넓게 잡을 수 없다. 또한 5 MHz는 144 kbps와 384 kbps라는 3G 주요 target data rate를 지원하기에 충분하다.

Chip rate는 desired data rate, error control 필요성, bandwidth limit의 결과로 정해진다. W-CDMA의 3.84 Mcps처럼 3 Mcps 이상 chip rate가 3G design parameter에 합리적이라고 본다.

#### Multirate: Time Multiplexing과 Code Multiplexing

**Multirate**는 한 user에게 여러 fixed-data-rate logical channel을 제공하고, 각 logical channel이 서로 다른 data rate와 destination을 가질 수 있게 하는 기능이다. 이는 한 사용자가 동시에 여러 application을 쓰는 상황을 지원한다. 예를 들어 voice, file transfer, background signaling이 서로 다른 logical channel로 움직일 수 있고, system은 각 service가 필요한 capacity만 제공해 spectrum을 더 효율적으로 쓴다.

![Figure 14.14](@/assets/images/data-communication-191-figure-14-14-page-459.png)
*Figure 14.14 · PDF p. 459 · 3G multirate 지원을 위한 time multiplexing과 code multiplexing*

Figure 14.14는 multirate를 구현하는 두 방법을 보여준다.

| 방식 | 동작 | 특징 |
|---|---|---|
| **Time multiplexing** | 하나의 CDMA channel 안에서 TDMA처럼 frame의 slot 수를 다르게 배정해 data rate를 조절한다. | 같은 data rate의 subchannel들이 error correction과 interleaving으로 보호된다. |
| **Code multiplexing** | 여러 CDMA code를 사용하고, 각 service를 별도 coding/interleaving 후 별도 CDMA channel에 map한다. | parallel service를 분리하기 쉽고, service별 coding/interleaving을 독립적으로 적용할 수 있다. |

3G의 중요한 변화는 cellular network가 더 이상 “mobile voice telephone”만이 아니라 packet/circuit service, asymmetrical Internet traffic, multimedia service를 함께 수용해야 하는 wireless access infrastructure가 되었다는 점이다.

## 연결 관계

Cellular wireless network는 앞 장들의 여러 개념과 직접 연결된다.

| 연결 대상 | 연결 내용 |
|---|---|
| Chapter 5 Signal Encoding | AMPS의 FM/FSK, IS-95의 QPSK/OQPSK/BPSK modulation 이해에 필요하다. |
| Chapter 6 Digital Data Communication Techniques | FEC, interleaving, convolutional coding, error compensation이 mobile fading 대응에 쓰인다. |
| Chapter 8 Multiplexing | FDMA, TDMA, CDMA, channel allocation, frequency reuse를 이해하는 기반이다. |
| Chapter 9 Spread Spectrum | CDMA, DS-SS, chipping code, PN sequence, Walsh code, RAKE receiver와 직접 연결된다. |
| Chapter 13 Congestion Control | 3G 이후 packet data service와 Internet asymmetry를 고려하는 traffic management와 이어진다. |

## 오해하기 쉬운 내용

| 오해 | 정리 |
|---|---|
| Hexagonal cell은 실제 지형 그대로다 | 실제 coverage는 지형, 건물, antenna 위치, propagation condition에 따라 불규칙하다. Hexagon은 설계와 계산을 위한 model이다. |
| `N`이 작을수록 항상 좋다 | `N`이 작으면 cell당 frequency 수는 늘지만 cochannel interference가 증가한다. Capacity와 interference의 trade-off다. |
| Cell splitting은 공짜 capacity 증가다 | capacity는 늘지만 base station 수, handoff frequency, planning complexity가 증가한다. |
| CDMA는 user 수 제한이 없다 | fixed hard limit은 약하지만 user가 늘면 noise level과 error rate가 증가해 graceful degradation을 겪는다. |
| Multipath는 항상 버려야 할 noise다 | RAKE receiver처럼 resolvable multipath energy를 결합해 diversity gain으로 활용할 수 있다. |
| Forward/reverse link CDMA 구조는 같다 | IS-95에서 forward link는 Walsh orthogonality가 강하고, reverse link는 mobile 간 synchronization이 완벽하지 않아 long code/power control/randomization이 더 중요하다. |

## 핵심 용어 정리

| 용어 | 정리 |
|---|---|
| **cellular network** | coverage area를 여러 cell로 나누고 low-power BS를 배치해 spectrum reuse로 capacity를 높이는 network |
| **base station (BS)** | cell 안 mobile unit과 radio channel로 통신하고 MTSO에 연결되는 transmitter/receiver/control unit |
| **MTSO** | BS들을 연결하고 channel assignment, handoff, call setup, billing monitoring을 수행하는 switching office |
| **frequency reuse / reuse factor** | 충분히 떨어진 cell에서 같은 frequency를 다시 쓰는 방식과 반복 pattern size `N` |
| **handoff** | 이동 중 serving BS/traffic channel을 새 cell로 넘기는 절차 |
| **fading / multipath / ISI** | mobile propagation에서 signal power variation, 여러 path copy, delayed symbol interference |
| **AMPS** | first-generation analog cellular system, analog FM voice와 FSK control channel 사용 |
| **CDMA / DS-SS** | chipping code로 bandwidth를 spread하고 code로 user/channel을 구분하는 multiple access |
| **RAKE receiver** | resolvable multipath copy를 여러 correlator로 복구해 weighted combine하는 CDMA receiver |
| **IS-95** | second-generation CDMA cellular system, 1.228 MHz channel과 Walsh/long code 구조 사용 |
| **Walsh code / PN sequence** | CDMA channel separation, spreading, scrambling에 쓰이는 orthogonal/pseudorandom code |
| **3G / IMT-2000 / W-CDMA** | high-speed multimedia/data/video 지원을 목표로 한 third-generation wireless interface 계열 |
