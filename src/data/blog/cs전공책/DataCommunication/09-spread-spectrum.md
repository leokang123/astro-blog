---
title: "Chapter 9. Spread Spectrum"
order: 9
pubDatetime: 2026-05-18T00:09:00+09:00
modDatetime: 2026-05-18T00:09:00+09:00
description: "Data and Computer Communications 정리: Chapter 9. Spread Spectrum"
tags:
  - "DataCommunication"
  - "CS"
---

## 개요

`spread spectrum`은 wireless communication에서 중요한 encoding/transmission 기법이다. 일반적인 관점에서는 bandwidth를 아끼는 것이 좋아 보이지만, spread spectrum은 반대로 signal의 bandwidth를 의도적으로 크게 넓힌다. 이 “겉보기 낭비”의 목적은 `jamming`, `interception`, `multipath distortion`, 다중 사용자 간섭을 줄이는 데 있다.

Spread spectrum은 Chapter 5의 단순 analog/digital encoding 분류에 깔끔히 들어가지 않는다. analog data 또는 digital data를 analog signal로 전송할 때 쓸 수 있고, 정보 signal을 더 넓은 frequency band로 퍼뜨리는 추가 modulation을 포함하기 때문이다.

이 장의 네 흐름은 다음과 같다.

| 주제 | 핵심 질문 |
| --- | --- |
| `concept of spread spectrum` | 왜 bandwidth를 일부러 넓히며, spreading code가 어떤 역할을 하는가? |
| `frequency-hopping spread spectrum (FHSS)` | carrier frequency를 pseudorandom하게 바꿔가며 전송하면 어떤 이점이 생기는가? |
| `direct sequence spread spectrum (DSSS)` | data bit를 여러 chip으로 확장해 전송하면 spectrum이 어떻게 퍼지는가? |
| `code-division multiple access (CDMA)` | 같은 bandwidth를 여러 사용자가 code로 구분해 동시에 쓰는 원리는 무엇인가? |

## 핵심 개념

### Spread Spectrum의 기본 구조

Spread spectrum의 기본 idea는 정보 signal을 훨씬 넓은 bandwidth에 분산시키는 것이다. Figure 9.1의 흐름은 이를 잘 보여준다.

1. input data가 `channel encoder`를 거쳐 비교적 narrow bandwidth의 analog signal이 된다.
2. 이 signal을 `spreading code` 또는 `spreading sequence`로 다시 modulation한다.
3. 그 결과 transmitted signal의 spectrum이 크게 넓어진다.
4. receiver는 같은 spreading code를 사용해 de-modulation/despreading을 수행한다.
5. `channel decoder`가 원래 data를 복구한다.

![Figure 9.1](@/assets/images/data-communication-115-figure-9-1-page-295.png)
*Figure 9.1 · PDF p. 295 · spreading code로 송신 spectrum을 넓히고 수신 측에서 같은 code로 복구하는 일반 모델*

### Spreading Code와 Pseudonoise Generator

`spreading code`는 signal을 넓은 spectrum으로 퍼뜨릴 때 사용하는 digit sequence다. 보통 `pseudonoise (PN)` 또는 `pseudorandom number generator`가 만든다. 여기서 pseudorandom은 진짜 random이라는 뜻이 아니다. algorithm과 초기값인 `seed`가 정해지면 sequence는 deterministic하게 생성된다.

그럼에도 좋은 pseudorandom sequence는 여러 통계적 random test를 통과하고, algorithm과 seed를 모르면 다음 sequence를 예측하기 어렵다. 이 성질 때문에 transmitter와 receiver가 spreading code generation 정보를 공유할 때만 성공적으로 signal을 복구할 수 있다.

### Spread Spectrum의 이득

Spread spectrum은 spectrum을 더 많이 쓰기 때문에, 좁은 관점에서는 bandwidth를 낭비하는 것처럼 보인다. 그러나 다음 장점 때문에 wireless 환경에서 가치가 있다.

| 이득 | 설명 |
| --- | --- |
| `jamming resistance` | 특정 narrowband 주파수에 강한 방해가 있어도 signal energy가 넓게 퍼져 있고 receiver가 code로 despreading하므로 방해 효과를 줄일 수 있다. |
| `multipath resistance` | 여러 경로로 도착하는 delayed signal의 영향이 줄어 reception이 개선될 수 있다. |
| `interception difficulty` | spreading code를 모르면 signal이 noise처럼 보이거나 복구가 어렵다. |
| `signal hiding/encryption support` | code를 공유한 receiver만 정보 복구가 가능하므로 은닉/보안 성격을 일부 제공한다. |
| `multiple access` | 여러 사용자가 같은 wide bandwidth를 쓰되 서로 다른 code를 사용하면 간섭을 작게 유지할 수 있다. 이것이 `CDM` 또는 `CDMA`의 기반이다. |

이 장에서 다루는 두 주요 spread spectrum 방식은 `frequency hopping`과 `direct sequence`다. 둘 다 bandwidth를 넓히지만, FHSS는 carrier frequency를 시간에 따라 바꾸고, DSSS는 bit stream 자체를 더 빠른 chip stream과 결합한다.

## 세부 정리

### 9.2 Frequency-Hopping Spread Spectrum (FHSS)

`frequency-hopping spread spectrum (FHSS)`에서는 signal이 fixed interval마다 하나의 radio frequency에서 다른 radio frequency로 “hop”한다. transmitter와 receiver가 같은 spreading code를 공유하고 시간 동기화를 유지하면 receiver는 같은 순서로 frequency를 따라가며 message를 복구한다. 반대로 code와 timing을 모르는 eavesdropper에게는 짧고 이해할 수 없는 blips처럼 보이고, jammer가 특정 frequency 하나를 방해해도 전체 message 중 일부 bits만 손상된다.

#### Basic Approach

Figure 9.2는 FH signal의 예시다. 여러 channel이 FH signal을 위해 할당되고, 보통 $2^k$개의 carrier frequency가 $2^k$개의 channel을 만든다. carrier frequency 간 spacing과 각 channel width는 보통 input signal bandwidth에 맞춰진다. transmitter는 한 번에 하나의 channel에서 fixed interval 동안 동작하며, 그 interval 동안 일부 bits 또는 이후 설명할 경우 fraction of a bit을 전송한다.

![Figure 9.2](@/assets/images/data-communication-116-figure-9-2-page-296.png)
*Figure 9.2 · PDF p. 296 · PN sequence가 정한 순서로 carrier channel을 hop하는 FHSS 예*

FHSS의 channel selection은 `spreading code`가 지시한다. transmitter와 receiver는 같은 code를 사용해 같은 channel sequence에 동기화한다. 원문은 IEEE 802.11 FHSS 예에서 300 ms interval을 언급한다. 이 숫자 자체보다 중요한 점은, hop interval마다 PN-derived channel index가 바뀌고 송수신기가 함께 그 index를 따라간다는 점이다.

#### FHSS System Block

Figure 9.3은 FHSS transmitter/receiver 구조다. 송신 쪽에서는 binary data가 먼저 `FSK` 또는 `BPSK` 같은 digital-to-analog modulation을 거쳐 base frequency 주변의 signal $s_d(t)$가 된다. 별도로 `pseudonoise (PN) bit source`가 channel table의 index를 만들고, `frequency synthesizer`가 선택된 carrier tone $c(t)$를 생성한다. $s_d(t)$와 $c(t)$를 곱하면 원래 data signal의 shape는 유지하되 center frequency가 선택된 channel로 translate된다.

![Figure 9.3](@/assets/images/data-communication-117-figure-9-3-page-297.png)
*Figure 9.3 · PDF p. 297 · PN bit source와 channel table로 carrier를 선택하는 FHSS 송수신 구조*

수신 쪽은 같은 PN sequence와 channel table을 사용해 같은 carrier를 만들어 incoming spread signal에 곱한다. 송신 때 더해진 hopping frequency를 수신 때 다시 제거하면 원래 $s_d(t)$ 형태가 나오고, 마지막 demodulator가 binary data를 복구한다.

원문의 BFSK 예시는 이 frequency translation을 수식으로 설명한다. data modulation으로 만들어진 signal이 data bit에 따라 $f_0$ 또는 $f_0 + \Delta f$에 놓인다고 하자. hop interval $i$에서 PN sequence가 carrier $f_i$를 고르면, FHSS signal은 대략 $f_0 + f_i$ 또는 $f_0 + f_i + \Delta f$로 이동한다. receiver가 같은 $f_i$를 곱하고 bandpass filtering하면 다시 $f_0$ 또는 $f_0 + \Delta f$ signal을 얻는다. 즉 FHSS의 핵심은 정보 modulation 자체를 바꾸는 것이 아니라, information-bearing signal을 PN-controlled carrier frequency 위로 계속 옮기는 것이다.

#### FHSS Using MFSK

FHSS는 `MFSK (multiple FSK)`와 자주 함께 사용된다. Chapter 5의 MFSK에서 $M = 2^L$개의 frequency가 $L$ bits per signal element를 나타낸다. FHSS에서는 이 MFSK signal을 $T_c$초마다 다른 FHSS channel로 translate한다.

| 기호 | 의미 |
| --- | --- |
| $R$ | data rate |
| $T = 1/R$ | bit duration |
| $L$ | bits per MFSK signal element |
| $T_s = LT$ | signal element duration |
| $T_c$ | hop duration |

slow/fast FHSS는 $T_c$와 $T_s$의 관계로 구분한다.

| 방식 | 조건 | 의미 |
| --- | --- | --- |
| `slow-frequency-hop spread spectrum` | $T_c \ge T_s$ | 하나의 hop 동안 하나 이상 signal element가 전송된다. |
| `fast-frequency-hop spread spectrum` | $T_c < T_s$ | 하나의 signal element가 여러 hop, 즉 여러 frequency chip에 걸쳐 전송된다. |

Slow FHSS 예시의 조건은 `M = 4`, `k = 2`다. 따라서 MFSK는 2 bits씩 한 signal element로 encode하고, FHSS는 `2^k = 4`개 channel 중 하나를 PN sequence 2 bits로 선택한다. slow 예에서는 한 channel이 두 signal elements, 즉 4 bits 동안 유지된다.

Figure 9.5는 fast FHSS 예시다. 같은 `M = 4`, `k = 2` 조건이지만, 하나의 signal element가 두 frequency tone에 의해 표현된다. 즉 `T_s = 2T_c`다.

![Figure 9.5](@/assets/images/data-communication-118-figure-9-5-page-300.png)
*Figure 9.5 · PDF p. 300 · MFSK 기반 fast FHSS에서 하나의 signal element가 여러 hop으로 나뉘는 모습*

fast FHSS는 noise/jamming에 대해 slow FHSS보다 나은 성능을 줄 수 있다. 예를 들어 하나의 signal element를 세 개 이상의 frequency chips로 보내면, 일부 chip이 jammed 되어도 receiver가 majority decision으로 어떤 signal element가 전송되었는지 결정할 수 있다.

#### FHSS Processing Gain

FHSS에서 많은 carrier frequencies를 사용하면 spread bandwidth $W_s$가 data modulation bandwidth $W_d$보다 훨씬 커진다. jammer가 고정 power로 모든 hop frequencies를 방해해야 한다면, 각 frequency band에 들어가는 jamming power가 줄어든다.

원문은 processing gain을 다음처럼 정리한다.

$$
G_P = 2^k = \frac{W_s}{W_d}
$$

즉 $k$가 클수록 channel 수가 늘고, jammer가 같은 power를 더 많은 channels에 나눠야 하므로 signal-to-noise ratio 측면의 gain이 커진다. 이 수식은 FHSS의 spread bandwidth가 단순히 넓은 spectrum 사용이 아니라 jamming resistance로 바뀌는 이유를 보여준다.

### 9.3 Direct Sequence Spread Spectrum (DSSS)

`direct sequence spread spectrum (DSSS)`에서는 original signal의 각 bit가 spreading code를 사용해 transmitted signal의 여러 bits로 표현된다. 이때 spreading code bit를 흔히 `chip`이라고 부르며, chip rate가 original data rate보다 훨씬 높기 때문에 transmitted signal의 bandwidth가 넓어진다.

예를 들어 10-bit spreading code로 data bit 하나를 표현하면, 1-bit code를 쓸 때보다 대략 10배 넓은 frequency band로 signal이 퍼진다. 즉 DSSS에서 bandwidth expansion은 data bit당 사용되는 chips 수에 직접 비례한다.

#### XOR 기반 직관

가장 단순한 DSSS 설명은 data bit stream과 spreading code bit stream을 `exclusive-OR (XOR)`로 결합하는 것이다.

| XOR | 결과 |
| --- | --- |
| `0 ⊕ 0` | 0 |
| `0 ⊕ 1` | 1 |
| `1 ⊕ 0` | 1 |
| `1 ⊕ 1` | 0 |

Figure 9.6에서는 spreading code가 data rate의 4배로 clocked된다. data bit가 0이면 spreading code bits가 그대로 전송되고, data bit가 1이면 spreading code bits가 inverted된다. receiver는 같은 PN bit stream을 다시 XOR하여 original data bit를 복구한다.

![Figure 9.6](@/assets/images/data-communication-119-figure-9-6-page-302.png)
*Figure 9.6 · PDF p. 302 · data bit와 PN bit stream을 XOR해 chip stream을 만들고 다시 복구하는 DSSS 예*

이 예시의 핵심은 transmitted bit stream이 original information stream의 rate가 아니라 spreading code sequence의 rate를 갖는다는 것이다. 따라서 transmitted signal은 information stream보다 더 넓은 bandwidth를 차지한다.

#### DSSS Using BPSK

DSSS를 BPSK로 구현할 때는 binary 1/0 대신 $+1$과 $-1$ 표현이 더 편하다. BPSK data signal은 다음처럼 표현된다.

$$
s_d(t) = A d(t)\cos(2\pi f_c t)
$$

여기서 $d(t)$는 bit interval 동안 1이면 $+1$, 0이면 $-1$을 갖는 discrete function이다. DSSS signal은 여기에 PN sequence $c(t)$를 곱한다.

$$
s(t) = A d(t)c(t)\cos(2\pi f_c t)
$$

receiver가 같은 $c(t)$를 다시 곱하면,

$$
s(t)c(t) = A d(t)c(t)c(t)\cos(2\pi f_c t) = s_d(t)
$$

가 된다. $c(t)$는 $+1$ 또는 $-1$이므로 $c(t)^2=1$이다. 이것이 DSSS despreading의 핵심 대칭성이다.

Figure 9.7은 BPSK data signal을 만든 뒤 PN sequence와 곱해 spread signal을 만들고, receiver에서 같은 PN sequence로 despread한 뒤 BPSK demodulator로 binary data를 복구하는 구현을 보여준다.

![Figure 9.7](@/assets/images/data-communication-120-figure-9-7-page-303.png)
*Figure 9.7 · PDF p. 303 · BPSK signal에 PN sequence를 곱하는 DSSS 송수신 구조*

Figure 9.8은 이 BPSK 기반 DSSS의 waveform 예시다. data waveform $d(t)$보다 spreading code $c(t)$의 chip interval $T_c$가 짧고, 최종 transmitted signal은 $d(t)$와 $c(t)$의 부호 변화가 결합된 형태가 된다.

![Figure 9.8](@/assets/images/data-communication-121-figure-9-8-page-304.png)
*Figure 9.8 · PDF p. 304 · BPSK 기반 DSSS에서 data와 spreading code가 결합되는 예*

#### DSSS Spectrum과 Processing Gain

DSSS의 spectrum spreading은 chip duration으로 바로 해석할 수 있다. information bit width가 $T$이면 data rate는 $1/T$이고, data signal spectrum은 encoding 방식에 따라 대략 $2/T$ 범위로 잡을 수 있다. PN signal의 chip width가 $T_c$이면 PN spectrum은 대략 $2/T_c$다. $T_c$가 $T$보다 훨씬 작으므로 PN sequence와 곱한 signal의 spectrum은 훨씬 넓어진다.

![Figure 9.9](@/assets/images/data-communication-122-figure-9-9-page-305.png)
*Figure 9.9 · PDF p. 305 · data spectrum, PN spectrum, 결합 후 spread spectrum의 관계*

Jamming 관점에서도 FHSS와 유사한 processing gain을 얻는다. center frequency에 simple jammer가 있다고 하면, receiver의 despreader가 received signal에 $c(t)$를 곱할 때 jammer 성분도 PN sequence에 의해 spread된다. 이후 BPSK demodulator의 bandpass filter는 원래 BPSK data bandwidth $2/T$에 맞춰져 있으므로, spread된 jammer power 중 일부만 통과한다.

원문은 DSSS processing gain을 다음처럼 근사한다.

$$
G_P = \frac{T}{T_c} = \frac{R_c}{R} \approx \frac{W_s}{W_d}
$$

여기서 $R_c$는 spreading bit/chip rate, $R$은 original data rate, $W_s$는 spread spectrum signal bandwidth, $W_d$는 original data signal bandwidth다. 즉 DSSS에서 processing gain은 data bit 하나를 몇 개 chip으로 퍼뜨렸는가, 또는 chip rate가 data rate보다 얼마나 빠른가에 의해 결정된다.

### FHSS와 DSSS 비교

| 구분 | FHSS | DSSS |
| --- | --- | --- |
| spreading 방식 | carrier frequency를 PN sequence에 따라 hop한다. | data bit stream에 PN chip stream을 직접 곱하거나 XOR한다. |
| receiver 동기화 | 같은 hop sequence와 hop timing 필요 | 같은 PN chip sequence와 chip timing 필요 |
| bandwidth expansion | `2^k`개의 hop channels 사용 | chip rate $R_c$가 data rate $R$보다 큼 |
| jamming 대응 | jammer power가 여러 hop frequencies로 분산되어야 함 | despreading 후 jammer가 spread되고 narrow filter에서 대부분 제거됨 |
| 핵심 수식 | $G_P=2^k=W_s/W_d$ | `G_P = T/T_c = R_c/R ≈ W_s/W_d` |

### 9.4 Code-Division Multiple Access (CDMA)

`code-division multiple access (CDMA)`는 spread spectrum을 이용한 multiplexing/multiple access 기법이다. 여러 사용자가 같은 bandwidth를 동시에 사용하지만, 각 사용자는 서로 다른 code를 사용한다. receiver는 관심 사용자의 code로 correlation/despreading을 수행해 해당 사용자의 data를 복구하고, 다른 사용자의 signal은 ideally 0 또는 low-level noise처럼 남는다.

#### Basic Principles

CDMA의 기본 절차는 다음과 같다.

1. data signal의 bit data rate를 `D`라고 한다.
2. 각 bit를 사용자별 fixed code에 따라 $k$개의 chips로 나눈다.
3. resulting channel의 chip data rate는 `kD chips/s`가 된다.
4. data bit 1을 보낼 때는 user code 자체를 전송하고, data bit 0을 보낼 때는 code의 complement를 전송한다.
5. receiver는 찾고 싶은 user의 code와 received chip pattern의 내적을 계산한다.

Figure 9.10은 user A, B, C가 각각 길이 6인 code를 갖는 예다. 예를 들어 user A의 code는 `[1, -1, -1, 1, -1, 1]`이다. A가 data bit 1을 보내면 이 code를 그대로 보내고, 0을 보내면 `[-1, 1, 1, -1, 1, -1]`처럼 부호를 뒤집은 complement를 보낸다.

![Figure 9.10](@/assets/images/data-communication-123-figure-9-10-page-306.png)
*Figure 9.10 · PDF p. 306 · 사용자별 code와 message bit가 chip pattern으로 encoding되는 CDMA 예*

receiver가 user `u`의 code `c = [c_1, ..., c_6]`를 알고 있고 received chip pattern이 `d = [d_1, ..., d_6]`라면, decoder는 다음 값을 계산한다.

$$
S_u(d) = d_1c_1 + d_2c_2 + d_3c_3 + d_4c_4 + d_5c_5 + d_6c_6
$$

길이가 6인 code에서 user A가 자신의 code를 그대로 보냈고 receiver가 A의 code로 계산하면 `+6`이 나온다. A가 complement를 보냈다면 `-6`이 나온다. 따라서 `+6`은 A의 data bit 1, `-6`은 A의 data bit 0으로 해석된다.

#### Orthogonal Code와 Unwanted Signal 제거

CDMA가 작동하는 이유는 사용자 code들이 ideally `orthogonal`하기 때문이다. A의 receiver가 A code로 B의 code를 내적하면 0이 된다면, B의 transmission은 A decoder 결과에 기여하지 않는다. 본문 예에서 B가 1 bit를 보내 `[1, 1, -1, -1, 1, 1]`을 전송했을 때, A code와의 내적은 0이다.

| 상황 | receiver가 사용하는 code | 결과 해석 |
| --- | --- | --- |
| A가 1을 전송 | A code | `+6`, A의 1 |
| A가 0을 전송 | A code | `-6`, A의 0 |
| B가 1을 전송 | A code | `0`, A 입장에서는 제거됨 |
| C가 1을 전송 | B code | 예시에서는 `2`, 완전 orthogonal은 아니어서 small contribution |
| B와 C가 동시에 전송 | B code | B signal은 크게 남고 C contribution은 작게 섞임 |

완전 orthogonal code는 매우 유용하지만 충분히 많이 얻기 어렵다. 실제로는 관심 사용자와 다른 사용자의 code correlation이 0에 가깝도록 설계한다. correlation의 absolute value가 작으면 receiver는 desired user의 signal과 others의 contribution을 구분할 수 있다.

CDMA receiver는 원치 않는 사용자들의 contribution을 filtering하거나 low-level noise처럼 취급한다. 하지만 사용자 수가 너무 많거나, receiver 근처의 competing transmitter power가 너무 크면 시스템이 무너질 수 있다. 이 문제가 `near/far problem`이다. 가까운 송신자의 강한 signal이 먼 송신자의 약한 signal을 압도해 code separation만으로는 충분하지 않게 된다.

#### CDMA for DSSS

Figure 9.11은 DSSS/BPSK 관점에서 CDMA를 보여준다. $n$명의 사용자가 각각 서로 다른 orthogonal PN sequence $c_i(t)$를 사용한다. 각 user의 data stream $d_i(t)$는 BPSK로 modulated되고, 자기 spreading code $c_i(t)$와 곱해져 spread signal $s_i(t)$가 된다. 모든 users의 signals와 noise가 receiver antenna에 동시에 도착한다.

![Figure 9.11](@/assets/images/data-communication-124-figure-9-11-page-309.png)
*Figure 9.11 · PDF p. 309 · 여러 DSSS 사용자가 같은 bandwidth를 code로 구분해 공유하는 CDMA 구조*

receiver가 user 1의 data를 복구하려면 incoming signal에 user 1의 spreading code $c_1(t)$를 곱하고 demodulate한다. user 1에 해당하는 부분은 despread되어 original unspread bandwidth로 좁아진다. 다른 users의 signals는 $c_1(t)$로 despread되지 않으므로 여전히 spread bandwidth $W_s$에 퍼져 있다. demodulator의 bandpass filter는 desired signal이 집중된 narrow bandwidth를 통과시키고, unwanted signal energy 대부분은 넓은 bandwidth에 남아 attenuate된다.

### 9.4 CDMA: 정리 포인트

CDMA는 “사용자마다 다른 frequency나 time slot을 주는” FDM/TDM과 다르다. 모든 사용자가 같은 frequency band와 같은 time을 공유하되, code domain에서 분리된다. 따라서 CDMA의 성능은 code orthogonality/correlation, synchronization, power control, user 수에 크게 의존한다. 특히 `near/far problem` 때문에 practical CDMA system에서는 power control이 핵심 설계 요소가 된다.

## 연결 관계

Spread spectrum은 앞 장들의 여러 개념을 한 번에 묶는다. Chapter 5의 `FSK`, `MFSK`, `BPSK`, `QAM` 같은 modulation 사고방식은 FHSS/DSSS의 기본 modulation으로 쓰인다. Chapter 8의 multiplexing 관점에서 보면 `CDMA`는 FDM처럼 frequency를 나누거나 TDM처럼 time slot을 나누지 않고, code domain을 사용해 같은 bandwidth를 공유한다. 이후 wireless LAN과 cellular system에서는 FHSS, DSSS, CDMA 계열 방식이 실제 medium access와 physical layer 설계에 연결된다.

Spread spectrum을 이해할 때는 “bandwidth expansion = 낭비”라는 직관을 넘어야 한다. 넓은 bandwidth는 jamming resistance, interception difficulty, multipath resistance, multiple access capacity를 얻기 위해 쓰는 resource다. 즉 spectrum을 더 쓰는 대신 code synchronization과 processing gain을 얻는 설계다.

## 오해하기 쉬운 내용

| 오해 | 바로잡기 |
| --- | --- |
| Spread spectrum은 전송 전 data compression과 비슷하다. | 반대다. 정보 signal을 더 넓은 bandwidth로 퍼뜨린다. 목적은 압축이 아니라 jamming/interception/multipath 대응과 multiple access다. |
| Spreading code는 진짜 random이어야 한다. | 보통 deterministic한 `pseudonoise (PN)` 또는 pseudorandom sequence를 사용한다. receiver가 같은 algorithm/seed를 알아야 동기 복구가 가능하다. |
| FHSS에서는 data modulation이 사라진다. | data는 여전히 FSK/BPSK/MFSK 등으로 modulation된다. FHSS는 그 information-bearing signal의 carrier frequency를 PN sequence에 따라 translate한다. |
| Fast FHSS는 단순히 더 빠른 data rate를 뜻한다. | fast/slow는 data rate 자체가 아니라 hop duration $T_c$와 signal element duration $T_s$의 관계다. $T_c < T_s$이면 fast FHSS다. |
| DSSS에서 chip은 original data bit와 같은 의미다. | chip은 spreading code의 더 빠른 단위다. data bit 하나가 여러 chips로 표현되며, chip rate $R_c$가 bandwidth expansion을 만든다. |
| DSSS receiver는 PN sequence를 몰라도 BPSK만 demodulate하면 된다. | 같은 $c(t)$로 despreading하지 않으면 signal energy가 넓은 bandwidth에 퍼져 있어 원래 data를 제대로 복구하기 어렵다. |
| CDMA는 사용자가 서로 다른 frequency를 쓰는 방식이다. | CDMA 사용자는 같은 bandwidth를 동시에 쓴다. 구분 기준은 frequency/time이 아니라 user-specific code다. |
| Orthogonal code만 있으면 CDMA는 무한히 많은 사용자를 받을 수 있다. | orthogonal code 수, synchronization, noise, correlation, near/far problem, power control 때문에 실제 capacity는 제한된다. |

## 핵심 용어

`spread spectrum`, `spreading code`, `spreading sequence`, `pseudonoise (PN)`, `pseudorandom number generator`, `seed`, `chip`, `chipping signal`, `frequency-hopping spread spectrum (FHSS)`, `slow FHSS`, `fast FHSS`, hop duration $T_c$, signal element duration $T_s$, `frequency synthesizer`, `channel table`, `MFSK`, `FSK`, `BPSK`, `processing gain`, $G_P$, spread bandwidth $W_s$, data bandwidth $W_d$, `direct sequence spread spectrum (DSSS)`, `exclusive-OR (XOR)`, chip rate $R_c$, `despreading`, `code division multiplexing (CDM)`, `code-division multiple access (CDMA)`, `orthogonal`, `correlation`, `near/far problem`, `power control`, `jamming`, `interception`, `multipath distortion`

## 면접 질문

1. Spread spectrum이 bandwidth를 일부러 넓히는 이유를 `jamming`, `interception`, `multipath`, `multiple access` 관점에서 설명하라.
2. `spreading code`, `spreading sequence`, `pseudonoise (PN)`의 관계를 설명하라.
3. FHSS에서 transmitter와 receiver가 같은 PN sequence에 동기화되어야 하는 이유를 설명하라.
4. FHSS transmitter에서 `frequency synthesizer`와 `channel table`이 하는 역할을 설명하라.
5. `slow FHSS`와 `fast FHSS`를 $T_c$와 $T_s$의 관계로 구분하고, fast FHSS가 jamming에 강할 수 있는 이유를 설명하라.
6. FHSS processing gain $G_P=2^k=W_s/W_d$의 의미를 설명하라.
7. DSSS에서 data bit와 PN chip stream을 XOR하거나 곱하면 bandwidth가 왜 넓어지는지 설명하라.
8. BPSK 기반 DSSS에서 receiver가 같은 $c(t)$를 곱하면 $c(t)^2=1$ 때문에 data signal이 복구되는 과정을 설명하라.
9. DSSS processing gain $G_P=T/T_c=R_c/R$이 의미하는 바를 설명하라.
10. CDMA에서 user-specific code와 orthogonality가 unwanted user signal을 줄이는 원리를 설명하라.
11. CDMA의 `near/far problem`이 무엇이며, 왜 power control이 필요한지 설명하라.
12. FDM/TDM/CDMA를 각각 frequency domain, time domain, code domain의 multiplexing으로 비교하라.
