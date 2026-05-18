---
title: "Chapter 8. Multiplexing"
order: 8
pubDatetime: 2026-05-18T00:17:00+09:00
modDatetime: 2026-05-18T00:17:00+09:00
description: "Data and Computer Communications 정리: Chapter 8. Multiplexing"
tags:
  - "DataCommunication"
  - "CS"
---

## 개요

Chapter 7은 하나의 `data link`를 두 station이 무거운 부하에서 효율적으로 쓰는 문제를 다뤘다. Chapter 8은 반대 방향의 문제에서 출발한다. 개별 station이나 terminal은 보통 고속 link의 전체 capacity를 혼자 쓰지 못한다. 그러므로 여러 transmission source가 하나의 더 큰 transmission capacity를 공유하게 하는 `multiplexing`이 필요하다.

`multiplexing`은 long-haul communication에서 특히 중요하다. fiber, coaxial cable, microwave link 같은 trunk는 고용량이지만 비싸다. 큰 시설일수록 `cost per kbps` 또는 voice channel당 비용이 낮아지므로, 여러 voice/data stream을 합쳐 보내는 것이 경제적이다. 이 장의 큰 흐름은 세 가지 multiplexing 방식과 subscriber line 응용이다.

| 방식 | 핵심 아이디어 | 주로 다루는 신호/환경 |
| --- | --- | --- |
| `frequency-division multiplexing (FDM)` | source마다 다른 frequency band를 할당해 동시에 보낸다. | analog signal, radio/TV, carrier system, WDM |
| `synchronous time-division multiplexing (synchronous TDM)` | 반복 frame 안의 고정 time slot을 source별로 배정한다. | digital data, digitized voice, DS-1, SONET/SDH |
| `statistical time-division multiplexing (statistical TDM)` | slot을 고정 배정하지 않고, buffer에 data가 있는 source에게 동적으로 할당한다. | bursty terminal/data traffic |
| `ADSL/xDSL` | subscriber loop의 frequency band를 쪼개고 TDM/echo cancellation/DMT를 조합한다. | telephone subscriber line 기반 broadband access |

Figure 8.1은 multiplexing의 기본 구조를 보여준다. `MUX`는 여러 input line의 data를 하나의 고용량 link로 합치고, `DEMUX`는 channel별로 다시 분리해 output line으로 전달한다.

![Figure 8.1](@/assets/images/data-communication-096-figure-8-1-page-260.png)
*Figure 8.1 · PDF p. 260 · n개 input을 하나의 link 위 n개 channel로 공유하는 multiplexing 구조*

## 핵심 개념

### Multiplexing의 경제적 이유

Multiplexing이 널리 쓰이는 이유는 두 가지다.

1. 같은 거리와 용도에서 transmission facility의 data rate가 높아질수록 단위 kbps당 비용이 낮아진다. 송수신 장비도 고속으로 갈수록 단위 capacity당 비용이 줄어드는 경향이 있다.
2. 개별 data communication device가 요구하는 rate는 상대적으로 작다. 원문은 Web access나 intensive graphics가 아닌 terminal/PC application에서는 9600 bps에서 64 kbps 정도가 충분한 경우가 많다고 설명한다.

따라서 고속 line 하나를 여러 낮은-rate stream이 나누어 쓰면 전체 비용 효율이 좋아진다. voice communication에서도 같은 논리가 적용된다. 하나의 high-capacity trunk가 여러 modest voice channel을 운반할 때 channel당 비용이 낮아진다.

### FDM과 TDM의 직관적 차이

Figure 8.2는 FDM과 TDM의 차이를 한 그림으로 대비한다. `FDM`은 여러 channel이 같은 time에 존재하지만 frequency 축에서 분리된다. `TDM`은 같은 frequency resource를 쓰되 time slot을 나누어 channel들이 번갈아 등장한다.

![Figure 8.2](@/assets/images/data-communication-097-figure-8-2-page-261.png)
*Figure 8.2 · PDF p. 261 · FDM은 frequency를 나누고 TDM은 time을 나누는 구조*

요약하면 FDM은 “all of the time, some of the frequency”에 가깝고, TDM은 “all of the frequency, some of the time”에 가깝다. 실제 시스템은 이 둘을 조합하기도 한다. Chapter 8 후반의 `ADSL`은 이 조합이 subscriber line에서 어떻게 쓰이는지 보여준다.

## 세부 정리

### 8.1 Frequency-Division Multiplexing (FDM)

`frequency-division multiplexing (FDM)`은 transmission medium의 useful bandwidth가 전송하려는 signal들의 required bandwidth 합보다 클 때 가능하다. 각 signal을 서로 다른 `carrier frequency`에 modulation하고, 각 modulated signal의 bandwidth가 서로 크게 겹치지 않도록 carrier를 충분히 떨어뜨린다.

FDM에서 각 signal이 차지하는 frequency band를 `channel`이라고 한다. 인접 channel 사이에는 interference를 막기 위해 사용하지 않는 spectrum인 `guard band`를 둔다.

FDM의 중요한 조건은 다음과 같다.

| 조건 | 의미 |
| --- | --- |
| medium bandwidth가 충분히 커야 함 | 모든 channel bandwidth와 guard band를 담을 수 있어야 한다. |
| carrier frequency가 적절히 분리되어야 함 | channel spectrum이 겹치면 원래 signal을 복구하기 어렵다. |
| composite signal은 analog | input은 analog일 수도 digital일 수도 있지만, digital input은 modem 등을 거쳐 analog로 변환된 뒤 주파수 대역에 실린다. |
| modulation/demodulation 필요 | sender에서는 각 input을 subcarrier에 올리고, receiver에서는 bandpass filter와 demodulator로 분리/복구한다. |

#### Generic FDM System

Figure 8.4는 일반적인 FDM transmitter/receiver 구조다. 입력 signal `m_i(t)`는 각각 subcarrier `f_i`에 modulation되어 `s_i(t)`가 된다. 이 modulated signals를 합하면 `composite baseband modulating signal m_b(t)`가 되고, 필요하면 다시 carrier `f_c`에 modulation되어 최종 `FDM signal s(t)`로 전송된다.

![Figure 8.4](@/assets/images/data-communication-099-figure-8-4-page-264.png)
*Figure 8.4 · PDF p. 264 · subcarrier modulation, composite baseband, bandpass filtering 기반 FDM 구조*

수신 측에서는 main receiver가 composite signal을 얻은 뒤, 각 `f_i` 중심의 `bandpass filter`로 component signal을 분리하고 demodulator로 원래 `m_i(t)`를 복구한다. 이 구조에서 `f_i` 선택이 잘못되어 bandwidth가 겹치면 crosstalk가 생기고, 복구가 어려워진다.

FDM signal의 전체 bandwidth `B`는 각 signal bandwidth의 합보다 커야 한다. 원문은 guard band까지 고려해 `B > ΣB_i`로 보는 관점을 제시한다.

#### Voiceband FDM 예시와 Crosstalk

Example 8.2는 세 개 voice signal을 동시에 전송하는 단순 FDM 예시다. voice signal은 보통 300-3400 Hz의 effective spectrum을 갖고, 4 kHz channel로 다루기 충분하다. 각각을 64 kHz, 68 kHz, 72 kHz subcarrier에 modulation하고 lower sideband만 취하면 세 voiceband signal이 인접한 4 kHz band에 배치된다.

![Figure 8.5](@/assets/images/data-communication-100-figure-8-5-page-265.png)
*Figure 8.5 · PDF p. 265 · 세 voiceband signal을 lower sideband로 인접 배치한 FDM 예시*

이 예시는 FDM이 해결해야 하는 두 문제를 잘 보여준다.

| 문제 | 원인 | 결과 |
| --- | --- | --- |
| `crosstalk` | 인접 component signal의 spectrum이 많이 overlap됨 | 한 channel의 signal이 다른 channel에 섞임 |
| `intermodulation noise` | long link의 amplifier nonlinearity | 한 channel의 signal이 다른 frequency component를 만들어 다른 channel을 오염시킴 |

TV broadcast/cable TV도 FDM의 친숙한 예다. 하나의 TV signal은 6 MHz band 안에 video carrier, color subcarrier, audio carrier를 배치한다. coaxial cable은 매우 넓은 bandwidth를 제공하므로 여러 TV signal을 6 MHz 단위 channel로 동시에 실을 수 있다. 이 예시는 FDM이 단순히 “여러 신호를 붙여 보낸다”가 아니라, 각 신호의 spectrum과 carrier 위치를 세심하게 설계해야 함을 보여준다.

#### Analog Carrier Systems

전통적인 long-distance carrier system은 voiceband signal을 high-capacity coaxial cable 또는 microwave system 위에 싣기 위해 FDM hierarchy를 사용했다. 암기해야 할 표준 숫자보다 중요한 것은 “작은 multiplexed group을 다시 하나의 signal처럼 보고 다음 단계에서 또 multiplexing한다”는 계층적 구조다.

| 계층 예 | 구성 | 의미 |
| --- | --- | --- |
| `group` | 12 voice channels, 48 kHz | voice channel 12개를 FDM으로 묶은 기본 단위 |
| `supergroup` | 5 groups, 60 voice channels | group signal들을 다시 subcarrier에 올려 multiplex |
| `mastergroup` | 10 supergroups, 600 voice channels | supergroup들을 다시 multiplex한 상위 단위 |

한 data signal은 여러 modulation/multiplexing stage를 거칠 수 있다. 예를 들어 data를 `QPSK`로 encoding해 analog voice signal처럼 만든 뒤, 이것을 group carrier에 올리고, 다시 supergroup carrier에 올릴 수 있다. 각 stage는 nonlinearities나 noise를 더할 수 있으므로, multiplexing hierarchy는 capacity를 높이는 대신 distortion 누적 가능성을 관리해야 한다.

#### Wavelength-Division Multiplexing (WDM)

`wavelength-division multiplexing (WDM)`은 optical fiber에서의 FDM이다. 여러 laser source가 서로 다른 wavelength, 즉 다른 color의 light beam을 만들고, 이를 하나의 fiber에 multiplex한다. 각 wavelength는 독립 data channel을 운반한다.

WDM 시스템의 일반 구조는 FDM과 같다. 여러 wavelength source가 multiplexer로 들어가고, single fiber line을 따라 전송되며, optical amplifier가 여러 wavelength를 동시에 증폭하고, destination의 demultiplexer가 channel을 분리한다. 대부분의 WDM system은 1550 nm range에서 동작한다.

`dense wavelength-division multiplexing (DWDM)`은 공식 표준 용어라기보다, ordinary WDM보다 더 많은 channel을 더 촘촘하게 배치하는 방식을 가리킨다. 원문은 대략 200 GHz 이하 channel spacing이면 dense라고 볼 수 있다고 설명한다. 핵심은 WDM/DWDM이 optical fiber의 huge bandwidth를 channel spacing과 optical amplification 기술로 실제 data capacity로 바꾸는 방식이라는 점이다.

### 8.2 Synchronous Time-Division Multiplexing (Synchronous TDM)

`synchronous time-division multiplexing`은 medium의 achievable data rate가 전송하려는 digital signals의 data rate 합보다 클 때 가능하다. 여러 digital signal 또는 digital data를 실은 analog signal을 시간 축에서 interleaving하여 하나의 transmission path에 싣는다. interleaving 단위는 bit일 수도 있고, byte/character 또는 더 큰 block일 수도 있다.

Figure 8.6은 synchronous TDM의 일반 구조다. 각 source의 data는 짧게 buffer에 들어가고, multiplexer가 buffer를 순서대로 scan하여 composite digital data stream `m_c(t)`를 만든다. scan은 충분히 빨라야 하므로 `m_c(t)`의 data rate는 입력 stream들의 data rate 합 이상이어야 한다.

![Figure 8.6](@/assets/images/data-communication-101-figure-8-6-page-268.png)
*Figure 8.6 · PDF p. 268 · buffer scan으로 TDM stream을 만들고 receiver에서 demultiplex하는 구조*

전송 data는 반복되는 `frame`으로 조직된다. 각 frame은 time slot들의 cycle이고, 각 source에는 frame마다 하나 이상의 slot이 고정 배정된다. 한 source에 배정된 slot들의 frame-to-frame sequence를 `channel`이라고 한다. slot 길이는 transmitter buffer 길이와 같고, 보통 bit 또는 byte(character) 단위다.

#### Byte Interleaving과 Bit Interleaving

| interleaving | slot 내용 | 쓰임 |
| --- | --- | --- |
| `byte-interleaving` | 한 character 또는 byte | asynchronous/synchronous source 모두에 사용 가능. start/stop bits를 제거하고 receiver에서 재삽입해 효율을 높일 수 있다. |
| `bit-interleaving` | 한 bit | synchronous source에 흔하고, asynchronous source에도 사용 가능하다. |

여기서 `synchronous TDM`이라는 이름은 반드시 synchronous transmission을 쓴다는 뜻이 아니다. 핵심은 time slot이 source에 미리 고정 배정되어 있다는 점이다. source가 data를 보내지 않아도 그 source의 slot은 frame 안에 그대로 존재한다. FDM에서 특정 frequency band가 비어도 다른 source가 쓰지 못하는 것처럼, synchronous TDM도 빈 slot이 capacity waste를 만든다. 대신 implementation이 단순하고 timing이 예측 가능하다. 서로 다른 data rate의 source는 느린 source에 slot 하나, 빠른 source에 여러 slot을 배정하는 방식으로 처리할 수 있다.

#### TDM Link Control: 왜 전체 TDM Link에 HDLC를 붙이지 않는가

Figure 8.6b의 TDM stream은 Chapter 7의 HDLC frame처럼 header/trailer를 갖지 않는다. 전체 multiplexed line 관점에서는 flow control과 error control을 적용하는 방식이 다르기 때문이다.

| 제어 | 전체 TDM frame에 적용하기 어려운 이유 | 해결 |
| --- | --- | --- |
| `flow control` | 한 output device가 data를 못 받는다고 전체 TDM frame transmission을 멈추면, 다른 channel들도 정해진 시간에 data를 못 받는다. | 해당 output과 대응되는 input source의 흐름을 멈춘다. 그 channel은 빈 slot을 싣지만 frame rate는 유지한다. |
| `error control` | 한 channel의 error 때문에 전체 TDM frame을 재전송하면 다른 channel device들은 원하지 않는 duplicate data를 받게 된다. | `HDLC` 같은 data link control protocol을 per-channel basis로 적용한다. |

Figure 8.7은 두 source가 각자 HDLC frame을 만들고, TDM이 그 octet들을 character-interleaving하는 예다. line 위에서는 HDLC frame의 octet들이 서로 섞여 보이고 FCS도 연속된 덩어리처럼 보이지 않는다. 그러나 demultiplexer가 channel별로 조각을 정확히 재조립한 뒤 endpoint device에게 전달하므로, 각 communicating pair에는 dedicated link처럼 보인다.

![Figure 8.7](@/assets/images/data-communication-102-figure-8-7-page-270.png)
*Figure 8.7 · PDF p. 270 · TDM channel별로 HDLC frame 조각을 투명하게 운반하는 예*

실제 full-duplex 구성에서는 양 끝 장비가 multiplexer/demultiplexer 조합이어야 한다. 각 channel은 양방향 slot set을 갖고, 연결된 device pair가 자기 channel 안에서 HDLC로 flow/error control을 수행한다. MUX/DEMUX는 그 내부 의미를 몰라도 된다.

#### Framing과 Pulse Stuffing

Synchronous TDM에는 전체 TDM frame의 synchronization이 반드시 필요하다. source와 destination이 frame boundary를 잃으면 모든 channel의 data가 잘못 분배된다. HDLC flag처럼 frame을 감싸는 문자를 쓰지 않는 경우, 흔한 방법은 `added-digit framing`이다. 각 TDM frame에 control bit 하나를 더하고, frame마다 `101010...` 같은 식별 가능한 pattern을 만든다. receiver는 특정 bit position이 예상 pattern을 지속적으로 만족하는지 확인해 frame sync를 잡고, pattern이 깨지면 다시 search mode에 들어간다.

또 다른 문제는 여러 input source의 clock 차이다. 각 source가 별도 clock을 갖고 있으면 미세한 rate 차이로 synchronization이 어긋날 수 있고, input rates가 단순한 rational relation이 아닐 수도 있다. `pulse stuffing`은 multiplexer의 outgoing rate를 input rates 합보다 약간 높게 잡고, 남는 capacity에 dummy bit/pulse를 고정 위치에 넣어 input stream을 local clock rate에 맞춘다. demultiplexer는 그 fixed location을 알고 있으므로 stuffed pulse를 제거한다.

Figure 8.8은 analog source와 digital source를 함께 synchronous TDM으로 묶는 예다. analog sources는 PCM으로 digital화되고, 7.2 kbps digital sources는 pulse stuffing으로 8 kbps에 맞춰진다. 이렇게 rate와 형식을 맞춘 뒤 scan operation으로 128 kbps output stream을 만든다.

![Figure 8.8](@/assets/images/data-communication-103-figure-8-8-page-272.png)
*Figure 8.8 · PDF p. 272 · analog PCM 변환과 digital pulse stuffing을 결합한 TDM 예*

#### Digital Carrier Systems와 DS-1

Digital carrier system은 high-capacity optical fiber, coaxial cable, microwave link 위에 voice/data를 싣기 위해 synchronous TDM hierarchy를 사용한다. North America/Japan 계층과 ITU-T 계층은 비슷하지만 완전히 같지는 않다. 암기 포인트는 표준명보다 “낮은-rate TDM stream을 상위 TDM stream으로 다시 interleaving한다”는 구조다.

North America/Japan 계층의 기본은 `DS-1` format이다. DS-1은 24 channel을 multiplex한다. 각 frame은 channel마다 8 bits, 그리고 framing bit 1개를 포함하므로 `24 * 8 + 1 = 193 bits`다. voice는 PCM으로 초당 8000 samples가 생성되므로 frame도 초당 8000번 반복된다. 따라서 line rate는 다음과 같다.

$$
8000 \times 193 = 1.544 \text{ Mbps}
$$

![Figure 8.9](@/assets/images/data-communication-104-figure-8-9-page-273.png)
*Figure 8.9 · PDF p. 273 · 24 channel과 framing bit로 구성된 DS-1 transmission format*

DS-1에서 voice transmission은 보통 다섯 frame마다 8-bit PCM sample을 쓰고, 여섯 번째 frame마다 각 channel의 8번째 bit를 signaling bit로 사용한다. 이 signaling bit stream은 connection establishment, call termination 같은 network control/routing information을 운반한다.

Digital data service에서도 같은 1.544 Mbps format을 compatibility 때문에 사용한다. 이 경우 23 data channel을 제공하고, 24번째 channel position은 빠르고 안정적인 reframing을 위한 sync byte로 예약할 수 있다. 각 channel에서 7 bits/frame을 user data로 쓰면 `7 * 8000 = 56 kbps` service가 된다. 더 낮은 data rate는 `subrate multiplexing`으로 제공되며, 추가 control bit를 써서 9.6 kbps, 4.8 kbps, 2.4 kbps 같은 subchannel들을 한 DS-1 channel 안에 나눠 넣을 수 있다.

DS-1보다 높은 rate는 DS-1 input들을 bit interleaving하여 만든다. 예를 들어 `DS-2`는 네 DS-1 input을 결합한다. 단순 합 `1.544 * 4 = 6.176 Mbps`보다 실제 DS-2 rate가 더 큰 이유는 framing/control bits가 추가되기 때문이다.

#### SONET/SDH

`SONET (Synchronous Optical Network)`은 optical fiber의 high-speed digital transmission capability를 활용하기 위한 optical transmission interface다. BellCore가 제안하고 ANSI가 표준화했으며, ITU-T의 호환 규격이 `SDH (Synchronous Digital Hierarchy)`다.

SONET의 최소 단위는 `STS-1 (Synchronous Transport Signal level 1)` 또는 optical equivalent인 `OC-1`이고, rate는 `51.84 Mbps`다. `STS-N`은 서로 synchronized된 N개의 STS-1 signal에서 byte를 interleaving해 만든다. SDH의 최소 단위 `STM-1`은 155.52 Mbps로, SONET `STS-3`에 대응한다.

Figure 8.10은 SONET/SDH frame format을 보여준다. STS-1 frame은 810 octets로 구성되고, 매 125 us마다 전송되어 51.84 Mbps가 된다. 논리적으로는 9 rows × 90 octets matrix이며, 왼쪽 overhead 영역과 payload 영역으로 나뉜다.

![Figure 8.10](@/assets/images/data-communication-105-figure-8-10-page-275.png)
*Figure 8.10 · PDF p. 275 · STS-1과 STM-N의 overhead/payload frame 구조*

SONET overhead는 크게 `section overhead`, `line overhead`, `path overhead`로 나뉜다.

| overhead | 담당 범위 | 대표 기능 |
| --- | --- | --- |
| `section overhead` | 인접 section terminating equipment 사이 | framing, section-level monitoring, orderwire, management channel |
| `line overhead` | line level 구간 | pointer, line error monitoring, automatic protection switching, line management |
| `path overhead` | end-to-end path | path integrity check, payload type/label, path status, path-level monitoring |

여기서 pointer가 중요하다. SONET payload에는 `SPE (Synchronous Payload Envelope)`가 들어가며, path overhead column이 반드시 payload의 첫 column 위치에 고정되는 것은 아니다. line overhead의 pointer가 path overhead 시작 위치를 알려 주어 payload alignment와 frequency adjustment를 가능하게 한다.

### 8.3 Statistical Time-Division Multiplexing (Statistical TDM)

`statistical TDM`은 synchronous TDM의 빈 slot 낭비를 줄이기 위해 등장한다. terminal traffic처럼 attached device가 항상 data를 보내는 것이 아니라 bursty하게 동작하는 경우, synchronous TDM은 많은 frame slot을 비워서 보낸다. Statistical multiplexer는 이 통계적 성질을 이용해 time slot을 on demand로 동적 할당한다.

구조적으로 statistical multiplexer도 한쪽에는 여러 I/O line, 다른 쪽에는 higher-speed multiplexed line을 가진다. 차이는 frame slot 수다. I/O line이 `n`개라도 frame의 time slot은 `k`개만 둘 수 있고, 보통 `k < n`이다. input 방향에서는 multiplexer가 input buffer들을 scan해 data가 있는 source에서 slot을 채우고 frame이 찰 때 전송한다. output 방향에서는 frame 안의 slot을 적절한 output buffer로 분배한다.

Figure 8.12는 synchronous TDM과 statistical TDM의 차이를 직접 보여준다. synchronous TDM은 source C와 D가 data를 만들지 않아도 C1, D1 slot을 보낸다. statistical TDM은 data가 있는 A1, B1, B2, C2만 싣고 빈 slot을 보내지 않는다.

![Figure 8.12](@/assets/images/data-communication-107-figure-8-12-page-278.png)
*Figure 8.12 · PDF p. 278 · synchronous TDM의 빈 slot과 statistical TDM의 동적 slot 사용 비교*

#### Dynamic Slot Allocation의 대가: Address Overhead

Statistical TDM은 빈 slot을 줄이지만, slot의 위치만 보고 어느 source의 data인지 알 수 없게 된다. synchronous TDM에서는 “frame의 세 번째 slot은 source C”처럼 positional significance가 있었지만, statistical TDM에서는 각 slot이 어느 source의 것인지 달라질 수 있다. 따라서 각 data unit에는 `address information`이 필요하다.

Figure 8.13은 statistical TDM frame format의 두 가지 방향을 보여준다. 전체 frame은 HDLC 같은 synchronous protocol frame 안에 들어갈 수 있고, 그 payload에 statistical TDM subframe을 둔다.

![Figure 8.13](@/assets/images/data-communication-108-figure-8-13-page-278.png)
*Figure 8.13 · PDF p. 278 · statistical TDM에서 address/length를 포함하는 subframe 형식*

| subframe 방식 | 장점 | 단점 |
| --- | --- | --- |
| one source per frame | address 하나만 붙이면 되고 구조가 단순하다. light load에서 괜찮다. | heavy load에서는 frame마다 한 source만 실어 비효율적이다. |
| multiple sources per frame | 한 frame에 여러 source data를 넣어 효율을 높인다. | 각 data field마다 address와 length가 필요하다. |

오버헤드를 줄이는 기법도 있다. `relative addressing`은 full address 대신 previous source에 대한 상대 위치를 modulo 방식으로 표현해 address field 길이를 줄인다. 또 length가 1, 2, 3 bytes인 흔한 경우는 2-bit label로 표현하고, 특별한 값일 때만 별도 length field를 붙일 수 있다. 또는 frame 시작에 source 수만큼의 `bit map`을 두고, 해당 frame에서 character를 보낸 source의 bit를 1로 세우는 방식도 가능하다.

#### Performance: Buffer, Delay, Utilization

Statistical multiplexer의 output rate는 input devices의 maximum data rate 합보다 작을 수 있다. 평균적으로는 모든 device가 동시에 active하지 않기 때문이다. 하지만 순간적으로 aggregate input이 output capacity를 넘는 peak period가 생길 수 있다. 이때 필요한 것이 buffer다.

원문 Table 8.6은 10 sources, 각 1000 bps, 평균 activity 50%인 경우를 비교한다. 평균 input load는 5000 bps다.

| output capacity | 평균 load와의 관계 | 결과 |
| --- | --- | --- |
| 5000 bps | 평균 load와 같음 | peak input이 조금만 높아져도 backlog가 빠르게 쌓인다. |
| 7000 bps | 평균보다 여유 있음 | backlog가 훨씬 작고 빨리 사라진다. |

여기서 trade-off는 단순한 “buffer는 싸다” 문제가 아니다. buffer가 커질수록 loss는 줄지만, data가 queue에서 기다리는 시간이 늘어 response time이 나빠진다. 따라서 statistical TDM의 핵심 설계 trade-off는 `buffer size`와 `multiplexed line speed`, 그리고 `delay` 사이의 균형이다.

원문은 다음 parameters를 사용한다.

| 기호 | 의미 |
| --- | --- |
| `I` | input sources 수 |
| `R` | 각 source의 data rate, bps |
| `M` | overhead를 제외한 multiplexed line의 effective data capacity, bps |
| `a` | 각 source가 transmitting 상태인 평균 시간 비율, `0 < a < 1` |
| `K = M/(IR)` | total maximum input 대비 multiplexed line capacity 비율 |

`K`는 multiplexer가 달성한 compression의 척도다. `K = 1`이면 모든 input device가 동시에 maximum rate로 보내도 감당하므로 synchronous TDM에 해당한다. `K <= a`이면 평균 input조차 capacity를 넘기므로 안정적 운용이 어렵다. 따라서 일반적으로 `a < K < 1` 영역에서 statistical gain을 얻는다.

Queueing model로 보면 arrival rate와 service time은 다음처럼 연결된다.

$$
\lambda = aIR,\qquad T_s = \frac{1}{M}
$$

server utilization `r`는

$$
r = \lambda T_s = \frac{aIR}{M} = \frac{a}{K}
$$

이다. `r`이 높아질수록 평균 buffer occupancy와 delay가 증가한다.

Figure 8.14는 이 trade-off를 보여준다. utilization이 올라가면 평균 buffer size와 mean delay가 모두 증가한다. 같은 utilization이라도 line capacity `M`이 클수록 bit/frame을 서비스하는 시간이 짧아져 delay가 작아질 수 있다.

![Figure 8.14](@/assets/images/data-communication-109-figure-8-14-page-282.png)
*Figure 8.14 · PDF p. 282 · statistical multiplexer의 utilization 증가에 따른 buffer size와 delay 증가*

Figure 8.15는 finite buffer에서 overflow probability가 utilization에 얼마나 민감한지 보여준다. utilization이 높을수록 queue size variance가 커져 더 큰 buffer가 필요하며, 충분한 buffer를 두어도 overflow probability는 0이 되지 않는다. 원문은 Figure 8.14와 Figure 8.15를 근거로 utilization이 약 0.8을 넘는 운용은 바람직하지 않다고 정리한다.

![Figure 8.15](@/assets/images/data-communication-110-figure-8-15-page-283.png)
*Figure 8.15 · PDF p. 283 · buffer size와 utilization에 따른 overflow probability*

### 8.3 Statistical TDM: 정리 포인트

Statistical TDM은 bursty traffic에서 synchronous TDM보다 효율적이다. 하지만 그 효율은 `address/length overhead`, buffer memory, queueing delay, overflow risk를 대가로 얻는다. 그러므로 “동적 할당이라 항상 좋다”가 아니라, traffic의 average activity `a`, required response time, acceptable overflow probability, line capacity `M`을 함께 보고 설계해야 한다.

#### Cable Modem에서의 Statistical TDM 연결

ADSL로 넘어가기 직전, 원문은 cable modem을 statistical TDM의 응용으로 소개한다. cable TV provider는 upstream/downstream 각각에 channel을 할당하고, 그 channel을 여러 subscriber가 공유한다. downstream에서는 cable headend scheduler가 작은 packet 형태로 data를 내려보낸다. 여러 subscriber가 active하면 각 subscriber는 downstream capacity의 일부만 얻는다.

upstream은 충돌을 피하기 위한 scheduling이 더 중요하다. subscriber가 data를 보내려면 먼저 shared upstream channel에서 time slot을 요청한다. 각 subscriber에게는 request purpose의 dedicated time slot이 있고, headend scheduler는 request packet을 받은 뒤 해당 subscriber가 사용할 future time slot을 grant한다. 즉 cable modem access는 FDM으로 방향별 channel을 만들고, 그 channel 내부 capacity는 statistical TDM 방식으로 나누는 구조다.

### 8.4 Asymmetric Digital Subscriber Line (ADSL)

`digital subscriber line`에서 가장 어려운 부분은 subscriber와 network 사이의 마지막 link다. 전 세계의 residential/business customer에게 새 cable을 새로 까는 것은 비용과 규모 면에서 부담이 크다. 그래서 `ADSL (Asymmetric Digital Subscriber Line)`은 이미 설치된 telephone network의 twisted-pair wire를 활용한다. 이 wire는 원래 0-4 kHz voice-grade signal용으로 설치되었지만, 실제로는 1 MHz 이상까지 더 넓은 spectrum에서 signal을 전송할 수 있다.

`asymmetric`이라는 이름은 downstream capacity가 upstream capacity보다 크다는 뜻이다. 원래는 video on demand 같은 서비스를 염두에 두었지만, Internet access에서도 잘 맞는다. 사용자는 keyboard stroke나 짧은 e-mail처럼 작은 upstream traffic을 보내고, Web page, image, video 같은 큰 downstream traffic을 받는 경우가 많기 때문이다.

#### ADSL Channel Configuration

ADSL은 twisted pair의 약 1 MHz capacity를 FDM으로 나누어 사용한다. Figure 8.17은 두 가지 channel allocation 방식을 보여준다.

![Figure 8.17](@/assets/images/data-communication-112-figure-8-17-page-285.png)
*Figure 8.17 · PDF p. 285 · POTS, upstream, downstream을 분리하는 ADSL channel configuration*

ADSL strategy는 세 요소로 정리된다.

| 요소 | 설명 |
| --- | --- |
| `POTS (plain old telephone service)` | 가장 낮은 25 kHz를 voice용으로 예약한다. 실제 voice는 0-4 kHz를 쓰지만, voice/data crosstalk를 막기 위해 여유 대역을 둔다. |
| upstream/downstream band 분리 | `FDM`으로 작은 upstream band와 큰 downstream band를 분리하거나, `echo cancellation`으로 일부 band를 겹쳐 쓴다. |
| band 내부의 FDM | upstream/downstream bit stream을 여러 parallel bit stream으로 나누고, 각각을 별도 frequency subchannel에 싣는다. |

`echo cancellation`을 쓰면 upstream band 전체가 downstream의 lower portion과 overlap한다. 장점은 두 가지다. 첫째, 높은 frequency일수록 attenuation이 커지므로 downstream bandwidth를 더 좋은 low-frequency spectrum에 많이 배치할 수 있다. 둘째, upstream capacity를 늘리고 싶을 때 downstream과의 경계에 부딪히지 않고 overlap 영역을 늘리는 방식으로 유연하게 조정할 수 있다. 단점은 line 양 끝에 echo cancellation logic이 필요하다는 점이다. transmitter는 자기 transmission의 echo를 incoming signal에서 빼야 상대가 보낸 signal을 복구할 수 있다.

ADSL은 cable diameter와 품질에 따라 약 5.5 km까지를 목표 range로 삼는다. 원문은 이것이 미국 subscriber line의 약 95%를 cover할 수 있는 수준이라고 설명한다. 여기서 중요한 설계 감각은 “기존 wire를 최대한 재사용하되, voice band와 data band를 spectrum에서 분리하고, line 품질에 따라 data rate를 조절한다”는 것이다.

#### Discrete Multitone (DMT)

`Discrete multitone (DMT)`는 ADSL의 핵심 modulation/multiplexing 기술이다. DMT는 upstream 또는 downstream transmission band를 여러 4-kHz `subchannel`로 나누고, 각 subchannel에 서로 다른 수의 bits를 싣는다.

초기화 시 DMT modem은 각 subchannel에 test signal을 보내 `signal-to-noise ratio (SNR)`를 측정한다. 품질이 좋은 subchannel에는 더 많은 bits를 배정하고, 품질이 나쁜 subchannel에는 적은 bits를 배정하거나 0 bit를 배정한다. 각 subchannel은 0-60 kbps 범위의 data rate를 가질 수 있다. 높은 frequency로 갈수록 attenuation이 커져 SNR이 떨어지는 경우가 많으므로, higher-frequency subchannel은 더 적은 load를 담당한다.

![Figure 8.18](@/assets/images/data-communication-113-figure-8-18-page-286.png)
*Figure 8.18 · PDF p. 286 · line gain/SNR에 따라 DMT subchannel별 bit 수를 다르게 배정하는 방식*

Figure 8.19는 DMT transmitter의 일반 구조다. binary input stream `x(t)`는 `serial-to-parallel converter`를 거쳐 subchannel별 substream `x_i(t)`로 나뉜다. 각 substream은 Chapter 5의 `QAM (quadrature amplitude modulation)`으로 analog signal이 되고, 각 QAM signal은 서로 다른 carrier `f_i`의 distinct frequency band를 차지한다. 이 signals를 더하면 전송할 composite DMT signal `y(t)`가 된다.

![Figure 8.19](@/assets/images/data-communication-114-figure-8-19-page-287.png)
*Figure 8.19 · PDF p. 287 · serial-to-parallel, subchannel QAM, summation으로 구성된 DMT transmitter*

현재 ADSL/DMT 설계는 downstream에 256개 subchannel을 사용한다. 이론적으로 각 4-kHz subchannel이 60 kbps를 운반하면 `256 * 60 kbps = 15.36 Mbps`가 가능하지만, 실제로는 line distance와 line quality, attenuation, noise 때문에 더 낮다. 원문은 practical implementation이 약 1.5-9 Mbps 범위에서 동작한다고 설명한다.

### 8.5 xDSL

`xDSL`은 subscriber line에서 high-speed digital transmission을 제공하는 DSL 계열 기술을 묶어 부르는 말이다. ADSL은 그중 하나이며, 원문은 `HDSL`, `SDSL`, `VDSL`을 비교한다. 각 기술의 차이는 크게 asymmetry 여부, 필요한 copper pair 수, reach, line code, frequency 사용 범위에서 나온다.

| 기술 | mode | 대표 data rate | copper pairs | range | 핵심 특징 |
| --- | --- | --- | --- | --- | --- |
| `ADSL` | asymmetric | 1.5-9 Mbps downstream, 16-640 kbps upstream | 1 | 3.7-5.5 km | Internet access처럼 downstream-heavy traffic에 적합. CAP/DMT, analog signaling |
| `HDSL (High Data Rate DSL)` | symmetric | 1.544 또는 2.048 Mbps | 2 | 약 3.7 km | T1/E1급 service를 repeater 없이 더 경제적으로 제공하기 위해 등장. `2B1Q` 사용 |
| `SDSL (Single Line DSL)` | symmetric | 1.544 또는 2.048 Mbps | 1 | 약 3.0 km | HDSL과 비슷한 service를 single twisted pair로 제공. echo cancellation으로 full-duplex |
| `VDSL (Very High Data Rate DSL)` | asymmetric | 13-52 Mbps downstream, 1.5-2.3 Mbps upstream | 1 | 약 1.4 km | ADSL보다 훨씬 높은 rate를 목표로 하며, distance를 희생한다. DMT/QAM 가능성이 큼 |

#### HDSL

`HDSL`은 표준 T1 line의 비용 문제에서 출발한다. 기존 T1은 `AMI (alternate mark inversion)` coding을 사용하고 약 1.5 MHz bandwidth를 차지한다. 높은 frequency를 쓰면 attenuation이 커져 repeater 간 거리가 약 1 km로 제한되고, subscriber line에서는 repeater 설치/유지 비용이 부담이 된다.

HDSL은 `2B1Q` coding으로 두 twisted-pair line 위에서 최대 2 Mbps급 data rate를 제공하고, bandwidth를 약 196 kHz까지로 낮춘다. 낮은 frequency range를 쓰므로 reach가 약 3.7 km까지 늘어난다.

#### SDSL

`SDSL`은 HDSL과 비슷한 service를 single twisted-pair line으로 제공하려는 방식이다. residential subscriber는 보통 twisted pair 하나만 갖고 있으므로, 두 pair가 필요한 HDSL은 가정용으로 적합하지 않다. SDSL도 `2B1Q` coding을 쓰며, single pair에서 full-duplex transmission을 위해 `echo cancellation`을 사용한다.

#### VDSL

`VDSL`은 ADSL과 비슷한 방향, 즉 asymmetric high-speed access를 목표로 하지만 훨씬 높은 data rate를 제공하려고 한다. 대신 reach가 짧다. 원문 기준 tentative allocation은 다음과 같다.

| band | 용도 |
| --- | --- |
| 0-4 kHz | `POTS` |
| 4-80 kHz | `ISDN` |
| 300-700 kHz | upstream |
| 1 MHz 이상 | downstream |

VDSL은 echo cancellation을 쓰지 않고 service별로 별도 band를 제공하는 방향이다. likely signaling technique은 `DMT/QAM`이다. 핵심 trade-off는 ADSL보다 높은 downstream rate를 얻는 대신 usable distance를 줄인다는 점이다.

## 연결 관계

Chapter 8은 Chapter 3-6의 signal/modulation/encoding 지식과 Chapter 7의 link control 지식을 실제 transmission facility 공유 문제에 연결한다. `FDM`은 Chapter 3의 spectrum, bandwidth, modulation, noise 개념이 직접 쓰이고, `WDM`은 optical fiber의 enormous bandwidth를 wavelength channel로 쪼개는 응용이다. `synchronous TDM`은 digital data stream과 frame timing을 다루며, per-channel `HDLC`와 Chapter 7의 flow/error control이 어떻게 multiplexed environment에서 보존되는지 보여준다. `statistical TDM`은 traffic이 bursty할 때 capacity를 더 효율적으로 쓰지만, queueing delay와 overflow probability라는 성능 문제가 생긴다. `ADSL/xDSL`은 FDM, TDM, QAM, echo cancellation, DMT를 subscriber loop라는 현실적 제약에 맞춰 조합한 사례다.

## 오해하기 쉬운 내용

| 오해 | 바로잡기 |
| --- | --- |
| multiplexing은 단순히 여러 선을 하나로 합치는 것이다. | 실제 핵심은 shared transmission capacity를 channel, frequency band, time slot, wavelength, buffer scheduling 등으로 나누고 다시 복구하는 규칙이다. |
| FDM은 analog input만 처리한다. | composite FDM signal은 analog지만, digital input도 modem을 거쳐 analog signal로 변환한 뒤 FDM에 실을 수 있다. |
| guard band는 낭비이므로 없애는 것이 항상 좋다. | guard band는 adjacent channel interference와 crosstalk를 줄이기 위한 비용이다. 너무 줄이면 channel 복구가 어려워진다. |
| synchronous TDM은 source가 data를 보낼 때만 slot을 준다. | synchronous TDM의 slot은 preassigned/fixed다. source가 data를 보내지 않아도 빈 slot이 전송될 수 있다. |
| synchronous TDM의 전체 link에 하나의 data link control protocol을 걸면 된다. | flow/error control은 per-channel basis로 처리해야 한다. 한 channel 문제 때문에 전체 TDM frame을 멈추거나 재전송하면 다른 channel이 망가진다. |
| statistical TDM은 overhead 없이 효율만 좋아진다. | positional significance를 잃으므로 address/length overhead가 필요하고, buffer delay 및 overflow probability가 생긴다. |
| utilization이 높을수록 statistical TDM은 항상 좋다. | utilization이 약 0.8을 넘으면 buffer requirement, delay, overflow probability가 급격히 나빠진다. |
| ADSL의 asymmetry는 기술적 결함이다. | Internet access처럼 downstream demand가 upstream보다 큰 traffic pattern에 맞춘 설계 선택이다. |
| DMT는 모든 subchannel에 같은 bit rate를 준다. | DMT는 subchannel별 SNR을 측정해 좋은 channel에 더 많은 bits를 싣고 나쁜 channel에는 적게 또는 0 bits를 싣는다. |

## 핵심 용어

`multiplexing`, `multiplexer (MUX)`, `demultiplexer (DEMUX)`, `channel`, `frequency-division multiplexing (FDM)`, `time-division multiplexing (TDM)`, `synchronous TDM`, `statistical TDM`, `asynchronous TDM`, `intelligent TDM`, `carrier frequency`, `subcarrier`, `guard band`, `baseband`, `composite baseband`, `bandpass filter`, `crosstalk`, `intermodulation noise`, `single sideband`, `analog carrier system`, `group`, `supergroup`, `mastergroup`, `wavelength-division multiplexing (WDM)`, `dense WDM (DWDM)`, `time slot`, `frame`, `byte-interleaving`, `bit-interleaving`, `added-digit framing`, `pulse stuffing`, `digital carrier system`, `DS-1`, `T1`, `PCM`, `subrate multiplexing`, `SONET`, `SDH`, `STS-1`, `OC-1`, `STM-1`, `SPE`, `section overhead`, `line overhead`, `path overhead`, `statistical multiplexer`, `relative addressing`, `bit map`, `buffer`, `queueing delay`, `overflow probability`, `cable modem`, `headend scheduler`, `upstream`, `downstream`, `ADSL`, `POTS`, `echo cancellation`, `Discrete multitone (DMT)`, `signal-to-noise ratio (SNR)`, `QAM`, `xDSL`, `HDSL`, `SDSL`, `VDSL`, `2B1Q`, `AMI`

## 면접 질문

1. Multiplexing이 long-haul communication에서 cost-effective한 이유를 설명하라.
2. `FDM`에서 `guard band`가 필요한 이유와 `crosstalk`, `intermodulation noise`의 차이를 설명하라.
3. `FDM`과 `TDM`을 time/frequency resource 관점에서 비교하라.
4. `synchronous TDM`에서 time slot이 비어도 전송되는 이유와, 이 방식의 장단점을 설명하라.
5. TDM link 전체가 아니라 per-channel basis로 `HDLC` 같은 link control을 적용해야 하는 이유를 설명하라.
6. `added-digit framing`과 `pulse stuffing`이 각각 어떤 synchronization 문제를 해결하는지 설명하라.
7. `DS-1`의 193-bit frame과 1.544 Mbps rate가 어떻게 계산되는지 설명하라.
8. `statistical TDM`이 synchronous TDM보다 효율적인 이유와, address/length overhead 및 buffer delay trade-off를 설명하라.
9. Statistical multiplexer에서 utilization이 약 0.8 이상으로 올라가면 왜 문제가 되는지 buffer size, delay, overflow probability 관점에서 설명하라.
10. ADSL에서 `POTS`, upstream, downstream band를 어떻게 나누며, `echo cancellation`을 쓰는 장단점은 무엇인가?
11. `DMT`가 subchannel별 SNR에 따라 bit allocation을 다르게 하는 이유를 설명하라.
12. `ADSL`, `HDSL`, `SDSL`, `VDSL`을 symmetry, copper pair 수, range, target use 관점에서 비교하라.
