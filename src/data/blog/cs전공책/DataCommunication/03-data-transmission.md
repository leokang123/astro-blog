---
title: "Chapter 3. Data Transmission"
order: 3
pubDatetime: 2026-05-18T00:00:00+09:00
modDatetime: 2026-05-18T00:00:00+09:00
description: "Data and Computer Communications 정리: Chapter 3. Data Transmission"
tags:
  - "DataCommunication"
  - "CS"
---

## 개요

이 장은 voice, data, image, video가 모두 전자기 신호(`electromagnetic signal`)로 표현되어 전송된다는 사실에서 출발한다. 전송 성공 여부는 크게 두 가지에 달려 있다. 하나는 보내는 신호의 품질이고, 다른 하나는 전송 매체(`transmission medium`)의 특성이다. 그래서 이 장은 신호를 시간 영역(`time domain`)과 주파수 영역(`frequency domain`)에서 보는 법, analog/digital data와 signal의 관계, attenuation/noise 같은 transmission impairment, 그리고 주어진 bandwidth와 noise에서 가능한 data rate를 설명한다.

## 핵심 개념

- `Bandwidth`: 신호를 구성하는 frequency range의 폭이다. 일반적으로 bandwidth가 클수록 정보 운반 능력과 가능한 data rate가 커진다.
- `Transmission impairment`: 전송 중 신호 품질을 망가뜨리는 요인이다. 대표적으로 `attenuation`, `attenuation distortion`, `delay distortion`, `noise`가 있다.
- `Data rate`: digital information이 초당 몇 bit로 전달되는지 나타낸다. 높은 data rate는 더 큰 effective bandwidth를 요구한다.
- `Channel capacity`: 주어진 조건에서 channel이 낼 수 있는 최대 data rate다. bandwidth, signal level, noise, acceptable error rate가 함께 결정한다.
- `Analog`와 `digital`은 data에도, signal에도, transmission 방식에도 각각 붙을 수 있다. “digital data라서 반드시 digital signal로만 간다”는 식으로 묶으면 안 된다.

## 세부 정리

### 3.1 Concepts and Terminology

#### Transmission Terminology

`Data transmission`은 transmitter와 receiver 사이에서 어떤 transmission medium을 통해 일어난다. Medium은 크게 `guided media`와 `unguided media`로 나뉜다. Guided media는 twisted pair, coaxial cable, optical fiber처럼 전자기파를 물리적 경로를 따라 안내한다. Unguided media는 wireless라고도 부르며, air, vacuum, seawater 같은 공간을 통해 전자기파를 전파하지만 물리적 경로로 guide하지 않는다.

전송 경로와 방향성도 기본 용어로 정리해야 한다.

| 용어 | 의미 |
| --- | --- |
| `Direct link` | transmitter와 receiver 사이에 signal이 직접 전파되는 경로. signal strength를 높이는 amplifier/repeater는 있을 수 있음 |
| `Point-to-point` | guided medium이 두 device만 공유하는 direct link를 제공 |
| `Multipoint` | 둘보다 많은 device가 같은 guided medium을 공유 |
| `Simplex` | 한 방향 전송만 가능 |
| `Half duplex` | 양쪽 모두 송신 가능하지만 동시에 송신하지 못하고 번갈아 사용 |
| `Full duplex` | 양쪽 station이 동시에 송신 가능 |

원문은 용어 사용의 지역 차이도 짚는다. 미국 ANSI 관점에서는 simplex/half duplex/full duplex를 위처럼 구분하지만, ITU-T 쪽에서는 simplex가 ANSI의 half duplex에 해당하고 duplex가 ANSI의 full duplex에 해당할 수 있다. 용어를 볼 때 문맥을 확인해야 하는 이유다.

#### Time Domain Concepts

전자기 신호는 시간의 함수 $s(t)$로 볼 수 있다. 이 관점에서 `analog signal`은 signal intensity가 시간에 따라 부드럽게 변하는 신호다. 끊김이나 불연속이 없다고 보는 모델이다. 반면 `digital signal`은 일정 시간 동안 constant level을 유지하다가 다른 constant level로 갑자기 바뀌는 신호다. 실제 회로에서는 전압 전이가 완전히 순간적이지 않지만, 모델상으로는 이 이상화가 유용하다.

![Figure 3.1](@/assets/images/cs-data-communication-023-figure-3-1-page-87.png)
*Figure 3.1 · PDF p. 87 · analog waveform과 digital waveform의 시간 영역 차이*

가장 단순한 신호는 같은 패턴이 반복되는 `periodic signal`이다. Periodic signal은 어떤 period $T$에 대해 다음 조건을 만족한다.

$$
s(t + T) = s(t)
$$

조건을 만족하는 가장 작은 $T$가 period이고, 그렇지 않은 신호는 `aperiodic signal`이다. `Sine wave`는 가장 기본적인 periodic signal이며, 일반형은 다음과 같다.

$$
s(t) = A \sin(2\pi f t + \phi)
$$

여기서 $A$는 peak amplitude, $f$는 frequency, $\phi$는 phase다. `frequency`는 초당 반복 횟수이며 Hertz(Hz)로 측정한다. Period와 frequency는 $T=1/f$ 관계를 가진다. `Phase`는 한 period 안에서 신호가 상대적으로 어디에 위치하는지를 나타낸다.

Figure 3.3은 같은 sine wave에서 amplitude, frequency, phase를 바꾸면 신호 모양이 어떻게 달라지는지 보여준다. Amplitude는 위아래 세기, frequency는 반복 속도, phase는 시간축상 이동으로 이해하면 된다.

![Figure 3.3](@/assets/images/cs-data-communication-025-figure-3-3-page-89.png)
*Figure 3.3 · PDF p. 89 · sine wave의 amplitude, frequency, phase 변화 효과*

시간 함수로 본 sine wave와 공간 함수로 본 sine wave는 연결된다. wavelength $\lambda$는 한 cycle이 차지하는 거리, 즉 연속된 두 cycle의 같은 phase 지점 사이 거리다. 신호가 velocity $v$로 이동하면 다음 관계가 성립한다.

$$
\lambda = vT,\quad \lambda f = v
$$

자유공간에서 전자기파가 빛의 속도 $c \approx 3 \times 10^8\ \text{m/s}$로 전파되는 경우 이 관계는 무선 전송과 주파수 이해의 기본이 된다.

#### Frequency Domain Concepts

실제 전자기 신호는 하나의 frequency만으로 이루어지지 않고 여러 frequency component의 조합이다. 원문은 `Fourier analysis` 관점을 도입한다. 충분한 수의 sinusoid를 적절한 amplitude, frequency, phase로 더하면 어떤 전자기 신호도 구성할 수 있다. 따라서 신호는 시간 영역 함수 $s(t)$로도 볼 수 있고, 각 구성 주파수의 peak amplitude를 나타내는 frequency domain function $S(f)$로도 볼 수 있다.

Figure 3.5는 frequency domain representation의 두 예를 보여준다. 첫 예는 특정 discrete frequency component만 가진 신호이고, 두 번째 square pulse 예는 넓은 frequency range에 연속적인 component를 가진다. 실제 신호에서는 높은 frequency component의 크기가 작아지는 경우가 많지만, 수학적으로는 bandwidth가 무한할 수 있다.

![Figure 3.5](@/assets/images/cs-data-communication-027-figure-3-5-page-92.png)
*Figure 3.5 · PDF p. 92 · discrete/continuous frequency domain representation 예시*

관련 용어는 구분해서 기억해야 한다.

| 용어 | 의미 |
| --- | --- |
| `Fundamental frequency` | 다른 frequency component들이 그 정수배가 되는 기준 frequency |
| `Spectrum` | 신호가 포함하는 frequency range |
| `Absolute bandwidth` | spectrum의 전체 폭 |
| `Effective bandwidth` 또는 `bandwidth` | 신호 energy 대부분이 집중된 상대적으로 좁은 frequency band |
| `DC component` | zero frequency component. 시간 영역에서는 nonzero average amplitude로 나타남 |

#### Relationship between Data Rate and Bandwidth

Digital waveform은 이상적으로 보면 급격한 transition을 가지므로 무한한 bandwidth가 필요하다. 하지만 실제 transmission system은 제한된 frequency band만 통과시킬 수 있다. 그래서 digital information은 제한된 bandwidth의 analog-looking signal로 근사되어 전달되고, 이 제한은 distortion을 만든다.

Square wave를 생각하면 관계가 선명해진다. Positive pulse를 binary 0, negative pulse를 binary 1로 보면 alternating `0101...` bit stream이 된다. Square wave는 무한한 odd harmonic component를 가진다.

$$
s(t) = A {4 \over \pi}\sum_{k\ \mathrm{odd},\ k=1}^{\infty} {\sin(2\pi k f t) \over k}
$$

모든 component를 보내면 이상적인 square wave에 가까워지지만, 실제로는 첫 몇 개의 component만 보내도 receiver가 0과 1을 구분할 수 있을 정도의 waveform이 된다. Figure 3.7은 fundamental frequency $f$에 $3f$, $5f$, $7f$ 같은 odd multiple을 더할수록 square wave에 가까워지는 과정을 보여준다.

![Figure 3.7](@/assets/images/cs-data-communication-029-figure-3-7-page-94.png)
*Figure 3.7 · PDF p. 94 · square wave를 odd harmonic frequency component로 근사하는 과정*

원문은 bandwidth와 data rate의 관계를 세 case로 설명한다.

| Case | 조건 | 결과 |
| --- | --- | --- |
| I | bandwidth 4 MHz, $f=1\ \text{MHz}$, $f$, $3f$, $5f$ 사용 | data rate 2 Mbps |
| II | bandwidth 8 MHz, $f=2\ \text{MHz}$, $f$, $3f$, $5f$ 사용 | data rate 4 Mbps |
| III | bandwidth 4 MHz, $f=2\ \text{MHz}$, $f$, $3f$만으로 충분히 구분 가능 | data rate 4 Mbps |

Case I과 II는 다른 조건이 같다면 bandwidth를 두 배로 늘리면 potential data rate도 두 배가 될 수 있음을 보여준다. Case III는 같은 bandwidth라도 receiver가 noise와 impairment 속에서 0과 1을 얼마나 잘 구분할 수 있는지에 따라 지원 가능한 data rate가 달라질 수 있음을 보여준다.

Figure 3.8은 2000 bps digital bit stream이 서로 다른 bandwidth를 거친 뒤 어떻게 변형되는지 보여준다. Bandwidth가 낮을수록 pulse 모양이 더 심하게 둥글어지고, 높을수록 원래 pulse에 가까워진다. 일반적으로 digital signal의 data rate가 $W\ \text{bps}$이면 $2W\ \text{Hz}$ bandwidth로 매우 좋은 representation을 얻을 수 있지만, noise가 심하지 않으면 그보다 낮은 bandwidth로도 bit pattern을 복구할 수 있다.

![Figure 3.8](@/assets/images/cs-data-communication-030-figure-3-8-page-96.png)
*Figure 3.8 · PDF p. 96 · bandwidth 제한이 digital signal pulse 모양에 주는 영향*

이 절의 결론은 간단하지만 중요하다. Data rate가 높아질수록 필요한 effective bandwidth도 커진다. 반대로 transmission system의 bandwidth가 클수록 보낼 수 있는 data rate의 잠재력이 커진다. 또한 어떤 signal이 center frequency 주변에 놓인다고 보면, center frequency가 높을수록 가능한 bandwidth도 커질 수 있어 더 높은 data rate 가능성이 열린다.

### 3.2 Analog and Digital Data Transmission

`Analog`와 `digital`은 대략 continuous와 discrete에 대응하지만, data communication에서는 최소 세 맥락에서 따로 쓰인다. `Data`는 의미를 전달하는 entity이고, `signal`은 data의 electric/electromagnetic representation이다. `Signaling`은 적절한 medium을 따라 signal이 물리적으로 propagation되는 것이며, `transmission`은 signal의 propagation과 processing으로 data를 communication하는 전체 과정이다.

#### Analog and Digital Data

`Analog data`는 어떤 interval 안에서 continuous value를 가진다. Voice, video, temperature, pressure 같은 sensor data가 대표적이다. `Digital data`는 discrete value를 가지며, text와 integer가 대표적이다.

Audio는 가장 익숙한 analog data다. Human speech의 frequency component는 대략 100 Hz에서 7 kHz 사이에 있지만, 음성 이해에 큰 영향을 주는 범위는 더 좁다. 원문은 600-700 Hz 아래의 frequency가 intelligibility에 기여하는 정도가 작다고 설명하고, 표준 voice channel이 300-3400 Hz로 정해지는 배경을 이어서 설명한다. Speech의 dynamic range는 약 25 dB이며, 가장 큰 shout의 power가 가장 작은 whisper보다 약 300배 클 수 있다.

![Figure 3.9](@/assets/images/cs-data-communication-031-figure-3-9-page-98.png)
*Figure 3.9 · PDF p. 98 · speech와 music의 acoustic spectrum 및 dynamic range*

Video도 analog data의 예다. TV screen에서 electron beam이 왼쪽에서 오른쪽, 위에서 아래로 scanning하면서 brightness를 만든다고 보면, 특정 순간의 beam intensity가 analog value를 가진다. 한 scan line 끝에서는 beam이 빠르게 왼쪽으로 돌아가는 `horizontal retrace`가 일어나고, 화면 아래에 도달하면 위로 돌아가는 `vertical retrace`가 일어난다. Retrace 중에는 beam이 꺼진다.

Flicker를 줄이면서 bandwidth 요구를 늘리지 않기 위해 `interlacing`이 사용된다. Odd numbered scan line과 even numbered scan line을 따로 scan하고, successive scan에서 odd/even field가 교대한다. 이렇게 하면 complete scan은 30회/초 수준이어도 화면 refresh는 60회/초처럼 느껴져 flicker를 줄일 수 있다.

![Figure 3.10](@/assets/images/cs-data-communication-032-figure-3-10-page-99.png)
*Figure 3.10 · PDF p. 99 · odd/even field를 나누어 scan하는 video interlaced scanning*

Text는 digital data의 익숙한 예다. 문자 자체는 사람이 읽기 편하지만, 저장과 전송에는 binary data가 필요하다. `IRA(International Reference Alphabet)`, 미국판으로는 `ASCII(American Standard Code for Information Interchange)`가 대표적이다. IRA는 각 character를 고유한 7-bit pattern으로 표현해 128개 character를 나타낼 수 있다. 실제 저장/전송에서는 보통 8 bits per character를 쓰고, eighth bit를 `parity bit`로 두어 error detection에 활용한다. Odd parity 또는 even parity를 맞추면 single-bit error나 odd number of bit errors를 검출할 수 있다.

#### Analog and Digital Signals

`Analog signal`은 continuously varying electromagnetic wave이고, medium의 특성에 따라 wire, fiber, atmosphere, space 등으로 propagation될 수 있다. `Digital signal`은 voltage pulse sequence다. 예를 들어 constant positive voltage는 binary 0, constant negative voltage는 binary 1을 나타낼 수 있다.

Digital signaling의 장점은 일반적으로 analog signaling보다 싸고 noise interference에 덜 민감하다는 점이다. 단점은 analog signal보다 attenuation에 더 취약하다는 점이다. Figure 3.11은 두 voltage level로 만든 pulse sequence가 conducting medium을 지나며 rounded and smaller pulse로 변형되는 모습을 보여준다. 고주파 성분의 signal strength가 줄면 pulse edge가 둥글어지고, 결국 0과 1을 구분하기 어려워진다.

![Figure 3.11](@/assets/images/cs-data-communication-033-figure-3-11-page-100.png)
*Figure 3.11 · PDF p. 100 · digital voltage pulse가 전송 중 attenuation으로 약해지고 둥글어지는 모습*

Voice는 acoustic analog data를 electromagnetic analog signal로 직접 바꾸기 쉽다. Telephone handset은 sound frequency의 loudness amplitude를 voltage amplitude로 변환한다. 다만 fidelity와 transmission cost 사이 trade-off가 있다. Speech spectrum은 약 100 Hz-7 kHz지만, 300-3400 Hz voice channel이면 intelligible speech transmission에 충분하고 필요한 transmission capacity와 전화기 비용을 줄일 수 있다.

Video signal의 bandwidth는 scanning과 resolution에서 추정할 수 있다. 원문은 525 lines 중 vertical retrace로 약 42 lines가 손실되어 실제 visible line이 약 483개이고, subjective resolution을 약 70%로 잡아 vertical resolution을 338 lines로 본다. 화면 비율 4:3을 고려하면 horizontal resolution은 약 450 elements가 되고, 최악의 black/white alternating scan line은 225 cycles를 52.5 microseconds 안에 담는다. 여기서 maximum frequency는 약 4.2 MHz로 추정되며, video signal bandwidth는 대략 4 MHz다.

Binary data는 terminal, computer, data processing equipment에서 만들어져 digital voltage pulse로 바뀐다. Figure 3.13의 예처럼 binary one과 zero를 서로 다른 voltage level로 나타낼 수 있다. 이 방식은 Chapter 5에서 `NRZ(Nonreturn to Zero)` 같은 encoding alternative로 더 자세히 다룬다.

#### Data and Signals

Data와 signal은 1:1로만 묶이지 않는다. Analog data는 analog signal로 직접 표현될 수도 있고, digital signal로도 표현될 수 있다. Digital data도 digital signal로 표현될 수 있고, analog signal로도 표현될 수 있다. Figure 3.14는 이 네 조합을 한 장으로 보여준다.

![Figure 3.14](@/assets/images/cs-data-communication-036-figure-3-14-page-103.png)
*Figure 3.14 · PDF p. 103 · analog/digital data를 analog/digital signal로 표현하는 네 가지 조합*

| Data type | Signal type | 변환 장치/방식 | 핵심 의미 |
| --- | --- | --- | --- |
| Analog data | Analog signal | telephone 등 | data와 같은 spectrum 또는 다른 spectrum으로 analog representation |
| Digital data | Analog signal | `modem(modulator/demodulator)` | binary voltage pulse를 carrier frequency에 encode해 voice-grade line 등으로 전송 |
| Analog data | Digital signal | `codec(coder-decoder)` | voice analog signal을 bit stream으로 근사하고 수신 측에서 analog data 복원 |
| Digital data | Digital signal | digital transceiver 등 | binary value를 voltage level sequence로 표현하거나 원하는 특성을 가진 digital signal로 encode |

#### Analog and Digital Transmission

`Analog transmission`은 signal content와 무관하게 analog signal을 그대로 전송하는 방식이다. Analog signal이 voice 같은 analog data를 담든, modem을 거친 digital data를 담든 같은 방식으로 다룬다. 거리가 멀어져 attenuation이 생기면 amplifier가 signal energy를 키운다. 문제는 amplifier가 noise component도 함께 키운다는 점이다. 여러 amplifier를 cascade하면 distortion이 누적된다. Voice 같은 analog data는 상당한 distortion이 있어도 intelligible할 수 있지만, digital data는 누적 distortion이 bit error로 이어질 수 있다.

`Digital transmission`은 signal에 binary content가 있다고 보고 처리한다. Digital signal이나 digital data를 담은 analog signal이 일정 거리 이상 가면 attenuation, noise, impairment로 data integrity가 위험해진다. 이때 amplifier 대신 `repeater`를 둔다. Repeater는 inbound signal에서 1과 0의 pattern을 recover하고, 새 clean outbound signal을 생성한다. 그래서 noise가 cumulative하게 쌓이지 않는다.

Digital transmission이 선호되는 이유는 다음과 같다.

| 이유 | 설명 |
| --- | --- |
| `Digital technology` | LSI/VLSI로 digital circuitry의 cost와 size가 계속 감소 |
| `Data integrity` | amplifier 대신 repeater를 사용해 noise/impairment 누적을 막음 |
| `Capacity utilization` | high-bandwidth link를 효율적으로 쓰기 위한 multiplexing이 digital time division에서 더 쉽고 저렴 |
| `Security and privacy` | encryption을 digital data와 digitized analog data에 쉽게 적용 |
| `Integration` | voice, video, digital data를 모두 같은 digital form으로 처리해 scale economy와 convenience 확보 |

### 3.3 Transmission Impairments

수신 신호는 전송 신호와 같지 않을 수 있다. Analog signal에서는 impairment가 signal quality를 낮춰 음성·영상 품질을 떨어뜨리고, digital signal에서는 binary 1이 0으로 또는 0이 1로 바뀌는 bit error를 만들 수 있다. 이 절의 핵심 impairment는 `attenuation`, `attenuation distortion`, `delay distortion`, `noise`다.

#### Attenuation and Attenuation Distortion

`Attenuation`은 transmission medium을 지나며 signal strength가 distance에 따라 줄어드는 현상이다. Guided media에서는 대체로 exponential하게 줄어들기 때문에 unit distance당 decibel로 표현하는 경우가 많다. Unguided media에서는 distance뿐 아니라 atmosphere 구성 등에도 의존한다.

Transmission engineer가 attenuation에서 신경 써야 하는 문제는 세 가지다.

| 문제 | 의미 | 대응 |
| --- | --- | --- |
| 충분한 수신 강도 | receiver circuitry가 signal을 detect할 수 있어야 함 | transmitter power, amplifier/repeater 배치 |
| noise 대비 충분한 level | signal이 noise보다 충분히 커야 error 없이 수신 가능 | signal-to-noise 관점 설계 |
| frequency별 attenuation 차이 | 어떤 frequency component가 더 많이 약해져 waveform이 왜곡됨 | equalization, loading coil, frequency-dependent amplifier |

Point-to-point link에서는 transmitter signal strength가 너무 약하면 intelligible하게 수신되지 않고, 너무 강하면 transmitter/receiver circuitry를 overload해 distortion을 일으킨다. Multipoint line에서는 transmitter-receiver distance가 다양해서 이 문제가 더 복잡해진다.

`Attenuation distortion`은 attenuation이 frequency의 함수이기 때문에 생긴다. Voice-grade telephone line에서는 upper voice band frequency가 lower frequency보다 더 많이 attenuate될 수 있고, 그 결과 speech signal이 왜곡된다. `Equalization`은 frequency band 전체의 attenuation을 평탄하게 맞추는 기법이다. Voice-grade line에서는 loading coil이나 high frequency를 더 많이 증폭하는 amplifier를 쓸 수 있다.

![Figure 3.15](@/assets/images/cs-data-communication-037-figure-3-15-page-107.png)
*Figure 3.15 · PDF p. 107 · voice channel에서 equalization 전후 attenuation과 delay distortion 곡선*

Figure 3.15a에서 attenuation은 1000 Hz에서의 attenuation을 기준으로 상대값을 dB로 나타낸다. 주파수 $f$에서 출력 power를 $P_f$, 1000 Hz 출력 power를 $P_{1000}$이라 하면 상대 attenuation은 다음처럼 표현된다.

$$
N_f = -10 \log_{10} {P_f \over P_{1000}}
$$

Solid line은 equalization이 없을 때 upper frequency가 더 많이 attenuate되는 모습을 보여주고, dashed line은 equalization으로 response curve가 평탄해진 모습을 보여준다. 이는 voice quality를 높이고, modem을 통해 digital data를 voice line으로 보낼 때 가능한 data rate도 높여 준다.

#### Delay Distortion

`Delay distortion`은 guided medium에서 propagation velocity가 frequency에 따라 달라지기 때문에 생긴다. Bandlimited signal에서는 보통 center frequency 부근의 velocity가 가장 높고, band edge 쪽으로 갈수록 낮아진다. 따라서 signal의 frequency component들이 receiver에 서로 다른 시간에 도착하고, component 사이 phase shift가 생긴다.

Digital data에서는 delay distortion이 특히 중요하다. Bit sequence를 analog 또는 digital signal로 보내면, 어떤 bit position의 signal component가 이웃 bit position으로 번질 수 있다. 이것이 `intersymbol interference`이며, transmission channel의 maximum bit rate를 제한하는 주요 요인이다. Figure 3.15b는 equalization이 delay curve를 어떻게 평탄하게 만드는지 보여준다.

#### Noise

`Noise`는 transmitted signal이 transmission system에서 변형된 것 외에, transmission과 reception 사이 어딘가에서 추가로 삽입되는 unwanted signal이다. Communications system performance를 제한하는 가장 큰 요인 중 하나다.

| Noise type | 원인과 특징 | 설계상 의미 |
| --- | --- | --- |
| `Thermal noise` | electron의 thermal agitation. 모든 electronic device와 transmission media에 존재하며 temperature의 함수 | 제거할 수 없어서 performance upper bound를 만든다. 넓은 bandwidth에 균일해 `white noise`라고도 함 |
| `Intermodulation noise` | 서로 다른 frequency signal이 nonlinear system에서 섞이며 sum/difference frequency 생성 | component malfunction이나 excessive signal strength로 nonlinearity가 커지면 문제 |
| `Crosstalk` | signal path 사이 unwanted coupling | 전화 중 다른 대화가 들리는 현상, nearby twisted pair나 microwave antenna에서 발생 |
| `Impulse noise` | 짧고 높은 amplitude의 irregular pulse/noise spike | analog voice에는 click/crackle 정도지만 digital data에는 bit error의 주요 원인 |

Thermal noise는 bandwidth 1 Hz에서 noise power density가 다음과 같다.

$$
N_0 = kT\quad (\text{W/Hz})
$$

여기서 $k = 1.38 \times 10^{-23}\ \text{J/K}$는 Boltzmann constant, $T$는 kelvin 단위 absolute temperature다. Bandwidth $B$ Hz에서 thermal noise power는 다음처럼 표현된다.

$$
N = kTB
$$

Decibel-watts로는 다음 형태를 쓴다.

$$
N = -228.6\ \text{dBW} + 10\log T + 10\log B
$$

원문 예시에서 room temperature 290 K의 thermal noise power density는 약 $4 \times 10^{-21}\ \text{W/Hz} = -204\ \text{dBW/Hz}$다. Receiver effective noise temperature가 294 K이고 bandwidth가 10 MHz이면 output thermal noise level은 약 $-133.9\ \text{dBW}$가 된다.

Intermodulation noise는 예를 들어 $f_1$과 $f_2$가 섞여 $f_1+f_2$에 energy를 만들고, 마침 그 frequency를 쓰는 intended signal을 방해할 수 있다. 이는 transmitter, receiver, medium이 완전히 linear하지 않기 때문에 생긴다. Crosstalk는 같은 케이블 주변 pair 사이의 electrical coupling이나 microwave energy spread 때문에 생길 수 있으며, 보통 thermal noise와 비슷하거나 더 작은 크기다.

Impulse noise는 analog data에는 비교적 작은 annoyance일 수 있다. Voice transmission에서는 짧은 click이나 crackle로 들리고 intelligibility가 유지될 수 있다. 그러나 digital communication에서는 치명적이다. 예를 들어 0.01 s duration의 sharp energy spike는 voice를 완전히 망치지는 않지만, 56 kbps digital data에서는 약 560 bits를 씻어낼 수 있다.

Figure 3.16은 digital receiver가 bit time마다 received waveform을 sampling할 때 noise가 threshold 판단을 바꾸어 bit error를 만드는 모습을 보여준다. Thermal noise에 occasional impulse spike가 더해지면 어떤 sampling instant에서 1이 0으로, 0이 1로 판단될 수 있다.

![Figure 3.16](@/assets/images/cs-data-communication-038-figure-3-16-page-110.png)
*Figure 3.16 · PDF p. 110 · noise spike가 digital signal sampling 결과를 바꾸어 bit error를 만드는 과정*

### 3.4 Channel Capacity

`Channel capacity`는 주어진 communication path 또는 channel에서 주어진 조건 아래 전송 가능한 최대 data rate다. Digital data에서 impairment가 data rate를 어느 정도까지 제한하는지를 묻는 개념이다.

이 절은 네 요소의 관계를 다룬다.

| 요소 | 의미 |
| --- | --- |
| `Data rate` | data가 전달되는 속도, bps |
| `Bandwidth` | transmitter와 medium 특성에 의해 제한되는 transmitted signal의 bandwidth, Hz |
| `Noise` | communication path 전체의 average noise level |
| `Error rate` | 0을 보냈는데 1로 받거나, 1을 보냈는데 0으로 받는 오류 비율 |

통신 설비는 bandwidth가 클수록 보통 비용이 커지고, 모든 practical channel은 물리적 특성이나 interference 방지를 위한 의도적 제한 때문에 finite bandwidth를 가진다. 따라서 목표는 주어진 bandwidth 안에서 acceptable error rate를 지키며 가능한 data rate를 높이는 것이다. 이 효율을 제한하는 주요 요인이 noise다.

#### Nyquist Bandwidth

`Nyquist bandwidth` 결과는 먼저 noise-free channel을 가정한다. 이 환경에서는 data rate의 한계가 signal bandwidth에서 온다. Nyquist의 formulation은 bandwidth $B$가 주어졌을 때 최대 signal rate가 $2B$라는 것이다. 반대로 signal transmission rate가 $2B$이면, frequency가 $B$보다 크지 않은 signal로 충분하다.

Binary signaling처럼 signal element가 두 level만 가지면, bandwidth $B\ \text{Hz}$가 지원하는 data rate는 $2B\ \text{bps}$다. 하지만 signal element가 $M$개의 discrete level을 가질 수 있으면, 한 signal element가 $\log_2 M$ bits를 담을 수 있다. 이때 Nyquist 공식은 다음과 같다.

$$
C = 2B \log_2 M
$$

여기서 $C$는 capacity 또는 data rate, $B$는 bandwidth, $M$은 discrete signal/voltage level 수다. 예를 들어 bandwidth가 3100 Hz인 voice channel에서 binary signaling이면 $2B=6200\ \text{bps}$지만, $M=8$이면 $C=2 \times 3100 \times \log_2 8 = 18{,}600\ \text{bps}$가 된다.

다만 $M$을 무작정 키울 수는 없다. Receiver는 각 signal time마다 가능한 level 중 하나를 구분해야 하는데, M이 커질수록 level 간 간격이 좁아지고 noise와 impairment에 취약해진다. 즉 Nyquist 공식은 bandwidth와 signal level 수의 이상적 관계를 보여주지만, practical system에서는 noise가 M의 유효한 상한을 만든다.

#### Shannon Capacity Formula

Nyquist가 noise-free bandwidth 한계를 다뤘다면, `Shannon capacity formula`는 noise가 있는 channel의 이론적 최대 capacity를 제시한다. Data rate가 높아지면 bit duration이 짧아지고, Figure 3.16처럼 같은 noise spike가 더 많은 bit를 망가뜨릴 수 있다. 반대로 signal power가 noise power보다 충분히 크면 수신자가 data를 더 잘 복구할 수 있다.

이 관계의 핵심 parameter는 SNR(Signal-to-Noise Ratio) 또는 $S/N$이다. SNR은 특정 지점, 보통 receiver에서 signal power와 noise power의 비율이다. Decibel 표현은 다음과 같다.

$$
SNR_{dB} = 10 \log_{10} {signal\ power \over noise\ power}
$$

SNR이 높다는 것은 intended signal이 noise보다 충분히 크다는 뜻이고, high-quality signal과 낮은 repeater 요구로 이어진다. Shannon의 결과는 다음과 같다.

$$
C = B \log_2(1 + SNR)
$$

여기서 $C$는 bits per second 단위 channel capacity, $B$는 Hz 단위 bandwidth다. 이 공식은 theoretical maximum이다. 실제 system은 impulse noise, attenuation distortion, delay distortion을 모두 완벽히 반영하지 못하고, coding length/complexity 같은 encoding issue 때문에 Shannon capacity보다 낮은 rate를 달성한다.

Shannon capacity는 `error-free capacity`라고도 불린다. 실제 information rate가 이 capacity보다 낮으면, 이론적으로는 적절한 signal code를 사용해 error-free transmission이 가능하다. 하지만 Shannon theorem은 그런 code를 찾는 방법을 알려 주지는 않는다. 대신 practical communication scheme의 성능을 재는 yardstick을 제공한다.

Nyquist와 Shannon의 관계는 예제로 이해하기 좋다. Channel spectrum이 3-4 MHz라면 $B=1\ \text{MHz}$다. $SNR_{dB}=24\ \text{dB}$이면 $SNR=251$이고, Shannon 공식에 따라 다음과 같다.

$$
C = 10^6 \log_2(1 + 251) \approx 8\ \text{Mbps}
$$

이 theoretical limit을 달성한다고 가정하면, Nyquist 공식에서 필요한 signaling level 수는 다음처럼 계산된다.

$$
8 \times 10^6 = 2 \times 10^6 \times \log_2 M
$$

$$
\log_2 M = 4,\quad M = 16
$$

즉 이 조건에서 8 Mbps를 내려면 16-level signaling이 필요하다. 하지만 signal strength를 키우면 nonlinear effect와 intermodulation noise가 늘 수 있고, bandwidth를 넓히면 white noise도 더 많이 들어온다. $B$를 늘리면 용량이 늘 가능성이 있지만 동시에 SNR이 낮아질 수 있다는 trade-off가 있다.

#### The Expression Eb/N0

Digital communication에서는 $E_b/N_0$도 중요하다. 이는 bit당 signal energy($E_b$)와 Hertz당 noise power density($N_0$)의 비율이며, bit error rate를 판단하는 표준 quality measure다.

Bit rate를 $R$, signal power를 $S$, bit time을 $T_b$라 하면 $R=1/T_b$이고, bit당 energy는 다음과 같다.

$$
E_b = S T_b = {S \over R}
$$

Thermal noise power density가 $N_0=kT$이므로,

$$
{E_b \over N_0} = {S/R \over N_0} = {S \over kTR}
$$

Decibel 표기로는 다음과 같다.

$$
\left({E_b \over N_0}\right)_{dB}
= S_{dBW} - 10\log R + 228.6\ \text{dBW} - 10\log T
$$

$E_b/N_0$가 중요한 이유는 digital data의 bit error rate가 이 비율의 decreasing function이기 때문이다. 원하는 error rate를 달성하는 데 필요한 $E_b/N_0$가 주어지면, signal power, data rate, temperature 같은 parameter를 설계할 수 있다. 특히 data rate $R$이 커지면 같은 $E_b/N_0$를 유지하기 위해 noise 대비 transmitted signal power가 커져야 한다.

SNR과 $E_b/N_0$는 다음 관계로 연결된다. Bandwidth $B$에서 noise power가 $N=N_0B$이고 data rate가 $R$이면,

$$
{E_b \over N_0} = {S \over N} {B \over R}
$$

Shannon 결과와 연결하면 spectral efficiency $C/B$와 $E_b/N_0$의 관계도 얻는다.

$$
{E_b \over N_0} = {B \over C}(2^{C/B} - 1)
$$

예를 들어 spectral efficiency가 $6\ \text{bps/Hz}$라면 필요한 최소 $E_b/N_0$는 $\frac{1}{6}(2^6-1)=10.5$, 즉 약 $10.21\ \text{dB}$다.

### Appendix 3A Decibels and Signal Strength

전송 시스템에서 signal strength는 중요한 parameter다. Signal이 medium을 따라 propagation되면 signal strength가 줄어드는 `loss` 또는 `attenuation`이 생기고, 이를 보상하기 위해 중간에 amplifier를 넣어 `gain`을 줄 수 있다. Gain, loss, relative level을 `decibel(dB)`로 표현하는 이유는 두 가지다. 첫째, signal strength가 exponential하게 줄어드는 경우가 많아 logarithmic unit이 다루기 쉽다. 둘째, cascaded transmission path의 net gain/loss를 곱셈 대신 단순 덧셈과 뺄셈으로 계산할 수 있다.

#### Decibel Gain and Loss

Decibel은 두 signal level 사이의 ratio를 나타내는 상대 단위다. Power 기준 gain은 다음과 같다.

$$
G_{dB} = 10\log_{10}{P_{out} \over P_{in}}
$$

$G_{dB}$가 positive이면 actual power gain이고, negative이면 actual power loss다. 예를 들어 $+3\ \text{dB}$는 power가 대략 2배, $-3\ \text{dB}$ gain은 power가 절반이라는 뜻이다. 보통은 이를 “3 dB loss”라고 말한다. Loss를 positive quantity로 쓰면 다음과 같다.

$$
L_{dB} = -10\log_{10}{P_{out} \over P_{in}}
= 10\log_{10}{P_{in} \over P_{out}}
$$

예를 들어 transmission line 입력이 10 mW이고 어느 지점에서 측정한 power가 5 mW이면,

$$
L_{dB} = 10\log_{10}(10/5) \approx 3\ \text{dB}
$$

Decibel은 상대 차이이므로 1000 mW에서 500 mW로 줄어도 동일하게 3 dB loss다.

Voltage 기준으로도 dB를 쓸 수 있다. 같은 resistance $R$에 대해 $P = V^2/R$이므로 power ratio의 log 계산은 voltage ratio에 대해 20을 곱한 형태가 된다.

$$
L_{dB} = 20\log_{10}{V_{in} \over V_{out}}
$$

Cascade된 요소에서는 dB gain/loss를 더하면 된다. 예를 들어 input power가 4 mW이고, 첫 transmission line이 12 dB loss, amplifier가 35 dB gain, 다음 line이 10 dB loss라면 net gain은 $-12+35-10=13\ \text{dB}$다.

$$
13 = 10\log_{10}(P_{out}/4\ \text{mW})
$$

$$
P_{out} = 4 \times 10^{1.3}\ \text{mW} \approx 79.8\ \text{mW}
$$

#### Absolute Decibel Units

Decibel 자체는 상대 단위지만, 기준 power나 voltage를 정하면 absolute level처럼 사용할 수 있다.

| 단위 | 기준 | 공식 | 예 |
| --- | --- | --- | --- |
| `dBW` | 1 W = 0 dBW | $Power_{dBW}=10\log_{10}(Power_W/1\text{W})$ | 1000 W = 30 dBW, 1 mW = -30 dBW |
| `dBm` | 1 mW = 0 dBm | $Power_{dBm}=10\log_{10}(Power_{mW}/1\text{mW})$ | 0 dBm = -30 dBW, +30 dBm = 0 dBW |
| `dBmV` | 1 mV = 0 dBmV | $Voltage_{dBmV}=20\log_{10}(Voltage_{mV}/1\text{mV})$ | cable TV, broadband LAN에서 사용 |

이 appendix의 핵심은 dB가 “절대 크기”가 아니라 ratio를 편하게 다루는 로그 단위라는 점이다. 절대 기준이 필요한 경우에만 dBW, dBm, dBmV처럼 reference를 붙인다.

## 연결 관계

- Chapter 3의 time/frequency domain 개념은 Chapter 4의 transmission media 비교와 Chapter 5의 signal encoding techniques를 이해하는 기반이다.
- `Bandwidth`와 `effective bandwidth` 개념은 Chapter 8 multiplexing, Chapter 9 spread spectrum, 그리고 이후 Internet traffic/QoS 논의와 계속 연결된다.
- `Attenuation`, `delay distortion`, `noise`는 Chapter 5의 encoding 선택과 Chapter 6의 error detection/correction 필요성을 설명하는 물리적 원인이다.
- `Nyquist bandwidth`와 `Shannon capacity formula`는 “왜 bandwidth만 넓힌다고 끝나지 않는가”, “왜 SNR과 error rate가 data rate를 제한하는가”를 정량적으로 보여준다.
- $E_b/N_0$는 digital communication system의 bit error rate 설계 지표로, modulation/encoding 방식 비교에서 반복해서 등장한다.
- `Decibel`, `dBW`, `dBm`은 attenuation, gain, SNR, noise power를 계산할 때 쓰이는 공통 언어다.

## 오해하기 쉬운 내용

- `Analog data`, `analog signal`, `analog transmission`은 같은 말이 아니다. Data의 성격, signal representation, transmission system의 처리 방식은 분리해서 봐야 한다.
- Digital signal은 noise에 덜 민감하다는 장점이 있지만 attenuation에는 취약할 수 있다. 그래서 repeater로 1/0 pattern을 복구해 새 signal을 만든다.
- Bandwidth가 제한되면 digital waveform이 “조금 예쁘지 않게” 보이는 수준이 아니라, receiver의 bit decision이 어려워지고 error 가능성이 커진다.
- `Nyquist` 공식은 noise-free bandwidth 한계를, `Shannon` 공식은 noise가 있는 channel의 theoretical capacity를 말한다. 둘은 같은 조건의 같은 공식이 아니다.
- `SNR`을 높이기 위해 signal power를 무조건 키우면 nonlinear effect와 intermodulation noise가 증가할 수 있다.
- `dB`는 상대 ratio다. Absolute power를 말하려면 `dBW`나 `dBm`처럼 기준 단위를 붙여야 한다.
- `Impulse noise`는 voice에서는 짧은 잡음일 수 있지만 digital data에서는 많은 bit error를 만들 수 있다.

## 면접 질문

1. `Guided media`와 `unguided media`의 차이를 예와 함께 설명하라.
2. `Analog signal`과 `digital signal`을 time domain에서 어떻게 구분하는가?
3. Sine wave의 `amplitude`, `frequency`, `phase`, `wavelength`는 각각 무엇이며 어떤 관계를 가지는가?
4. `Spectrum`, `absolute bandwidth`, `effective bandwidth`의 차이를 설명하라.
5. Digital square wave가 infinite bandwidth를 요구한다는 말의 의미는 무엇인가?
6. Bandwidth 제한이 digital data rate와 bit error 가능성에 어떤 영향을 주는가?
7. `Analog data`, `digital data`, `analog signal`, `digital signal`의 네 가지 조합을 modem/codec 예로 설명하라.
8. `Analog transmission`에서 amplifier를 cascade하면 왜 digital data에 문제가 생길 수 있는가?
9. `Attenuation distortion`과 `delay distortion`은 각각 어떤 방식으로 신호를 망가뜨리는가?
10. `Thermal noise`, `intermodulation noise`, `crosstalk`, `impulse noise`의 원인과 digital data에 대한 영향을 비교하라.
11. Nyquist 공식 $C = 2B \log_2 M$과 Shannon 공식 $C = B \log_2(1 + SNR)$의 가정과 의미를 구분하라.
12. $E_b/N_0$가 bit error rate 설계에서 중요한 이유는 무엇인가?
13. `dB`, `dBW`, `dBm`의 차이를 설명하고 cascade gain/loss를 어떻게 계산하는지 말하라.
