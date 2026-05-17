---
title: "Chapter 6. Digital Data Communication Techniques"
order: 6
pubDatetime: 2026-05-18T00:00:00+09:00
modDatetime: 2026-05-18T00:00:00+09:00
description: "Data and Computer Communications 정리: Chapter 6. Digital Data Communication Techniques"
tags:
  - "DataCommunication"
  - "CS"
---

## 개요

앞의 Chapter 3-5가 data signal, transmission media, encoding, transmission performance처럼 “어떤 신호를 어떤 매체로 보낼 것인가”를 다뤘다면, Chapter 6은 두 장치가 실제로 data communication을 하려면 어떤 약속과 제어가 필요한지를 다룬다. 핵심은 synchronization, error handling, line configuration이다.

Digital data communication에서는 bit stream이 한 장치에서 다른 장치로 지나간다. receiver는 incoming bits의 rate, duration, spacing을 알아야 적절한 시점에 line을 sampling하고 각 bit value를 판정할 수 있다. 또한 transmission은 error-free process가 아니므로 single-bit error와 burst error를 이해하고, error detection 또는 error correction으로 대응해야 한다.

## 6.1 Asynchronous and Synchronous Transmission

이 책은 주로 serial transmission을 전제로 한다. serial transmission은 data가 single signal path를 따라 signaling element 단위로 하나씩 전달되는 방식이다. signaling element는 Manchester coding처럼 bit보다 작을 수도 있고, NRZ-L/FSK처럼 한 bit일 수도 있으며, QPSK처럼 여러 bit를 담을 수도 있다. 이 절에서는 단순화를 위해 signal element 하나가 bit 하나라고 보고 설명한다.

Digital data reception의 기본 동작은 bit time마다 incoming signal을 sampling해서 binary value를 판정하는 것이다. 문제는 transmitter clock과 receiver clock이 완전히 일치하지 않는다는 점이다. 예를 들어 1 Mbps에서는 bit time이 1 microsecond인데 receiver clock이 1% 빠르거나 느리면 sample position이 bit마다 0.01 bit time씩 밀린다. 충분히 긴 stream을 보내면 receiver는 결국 잘못된 bit interval을 sample하게 된다. 따라서 bit timing synchronization은 data communication의 가장 기본 요구다.

### Asynchronous Transmission

Asynchronous transmission은 긴 uninterrupted bit stream을 피함으로써 timing drift 문제를 줄인다. data를 보통 5-8 bits짜리 character 단위로 보내고, receiver는 각 character 시작에서 다시 synchronize한다. synchronization을 character 내부에서만 유지하면 되므로 clock 정확도 요구가 낮다.

![Figure 6.1](@/assets/images/cs-data-communication-079-figure-6-1-page-203.png)
*Figure 6.1 · PDF p. 203 · asynchronous transmission의 start bit, data bits, parity bit, stop element와 timing error 예*

line이 idle일 때는 binary 1에 해당하는 state를 유지한다. character가 시작되면 binary 0인 start bit가 먼저 온다. 그 뒤에 5-8 data bits가 오며, 보통 least significant bit부터 전송된다. IRA character 같은 경우 data bits 뒤에 parity bit가 올 수 있다. parity bit는 even parity 또는 odd parity convention에 따라 character 전체의 1 개수를 맞추는 단순 error detection용 bit다. 마지막에는 binary 1인 stop element가 오며, 길이는 보통 1, 1.5, 2 bit time 중 하나다. stop element는 idle state와 같으므로 transmitter는 다음 character를 보낼 준비가 될 때까지 stop/idle 상태를 계속 유지할 수 있다.

Asynchronous transmission의 장점은 simple and cheap하다는 점이다. 단점은 overhead가 크다는 점이다. 예를 들어 8-bit character에 parity가 없고 1-bit stop element를 쓰면 start bit와 stop bit 2개가 synchronization overhead다. 총 10 bits 중 2 bits가 payload가 아니므로 overhead는 20%다. 더 큰 block으로 보내면 overhead percentage는 줄지만, block이 길수록 cumulative timing error가 커져 asynchronous 방식의 장점이 사라진다.

Figure 6.1c의 핵심은 receiver clock이 조금만 빠르거나 느려도 긴 character 끝에서는 sample point가 밀린다는 것이다. 마지막 data bit를 잘못 sample하면 data error가 생기고, 더 나쁘게는 bit count alignment가 깨져 다음 bit를 start bit로 오인하는 framing error가 생길 수 있다. idle 중 noise가 start bit처럼 보이는 경우에도 framing error가 발생한다.

### Synchronous Transmission

Synchronous transmission은 start/stop bit 없이 긴 block of bits를 steady stream으로 보낸다. block이 길기 때문에 transmitter와 receiver clock을 계속 동기화해야 한다. 방법은 두 가지다. 하나는 separate clock line을 두는 방식인데, short distance에서는 잘 동작하지만 long distance에서는 clock pulse도 data signal과 같은 impairment를 겪는다. 다른 하나는 clocking information을 data signal 안에 embed하는 것이다. digital signal에서는 Manchester 또는 Differential Manchester encoding이 이런 역할을 할 수 있고, analog signal에서는 carrier frequency의 phase 등을 synchronization에 사용할 수 있다.

Synchronous transmission에서는 bit timing뿐 아니라 block boundary synchronization도 필요하다. receiver가 frame의 beginning과 end를 알아야 하므로 block은 preamble bit pattern으로 시작하고 postamble bit pattern으로 끝난다. 여기에 data link control procedure가 사용하는 control information도 포함된다. data와 preamble, postamble, control fields를 합친 단위가 frame이다.

![Figure 6.2](@/assets/images/cs-data-communication-080-figure-6-2-page-204.png)
*Figure 6.2 · PDF p. 204 · synchronous transmission의 flag, control fields, data field로 구성된 frame format*

일반적인 synchronous frame은 8-bit flag로 시작하고 같은 flag로 끝난다. receiver는 flag pattern을 찾아 frame start를 인식한다. flag 사이에는 control fields, variable-length data field, 추가 control fields가 들어간다. exact frame format은 Chapter 7의 data link control protocol에 따라 달라진다.

큰 data block을 보낼 때 synchronous transmission은 asynchronous transmission보다 훨씬 효율적이다. 원문 예시는 HDLC frame에서 control, preamble, postamble overhead가 48 bits이고, 1000-character payload가 8000 bits라면 overhead가 \(48/8048 \times 100 \approx 0.6\%\)에 불과하다고 계산한다. 같은 payload를 character별 asynchronous로 보내는 것과 비교하면 overhead 차이가 매우 크다.

## 6.2 Types of Errors

Digital transmission에서 error는 transmitted bit와 received bit가 달라지는 것이다. 즉 1이 0으로, 또는 0이 1로 바뀐다. Error는 크게 single-bit error와 burst error로 나뉜다.

Single-bit error는 하나의 bit만 바뀌고 주변 bit는 영향을 받지 않는 isolated error다. white noise 때문에 순간적으로 SNR이 악화되어 receiver decision이 한 bit에서만 틀릴 때 생길 수 있다.

Burst error는 contiguous sequence 안에서 여러 bit error가 cluster로 발생하는 경우다. burst length \(B\)는 first erroneous bit부터 last erroneous bit까지의 길이를 뜻한다. 이 범위 안의 모든 bit가 틀려야 하는 것은 아니다. 중요한 점은 error가 한 지점에 고립되지 않고 묶여 나타난다는 것이다. impulse noise나 mobile wireless fading이 대표 원인이다.

Burst error는 single-bit error보다 흔하고 다루기 어렵다. 특히 data rate가 높을수록 같은 시간 길이의 noise event가 더 많은 bit를 덮는다. duration이 \(\tau\) seconds인 impulse noise 또는 fading event가 있으면 대략 \(R\tau\) bits가 영향을 받는다. 원문 Example 6.3의 취지는 10 Mbps에서는 10-bit burst, 100 Mbps에서는 100-bit burst처럼, 같은 impairment duration이라도 data rate가 10배가 되면 affected bits도 10배가 된다는 점이다.

## 6.3 Error Detection

Frame 단위 digital transmission에서는 어떤 frame이 error 없이 도착했는지, error가 있었지만 detection algorithm이 잡았는지, 또는 error가 있었는데도 undetected로 지나갔는지를 구분해야 한다. 원문은 다음 확률을 정의한다.

| 기호 | 의미 |
|---|---|
| \(P_b\) | bit가 error로 수신될 확률, 즉 BER(Bit Error Rate) |
| \(P_1\) | frame이 bit error 없이 도착할 확률 |
| \(P_2\) | error-detecting algorithm을 쓰는데도 frame에 undetected error가 있을 확률 |
| \(P_3\) | frame에 detected bit error는 있지만 undetected error는 없을 확률 |

error detection이 없다면 \(P_3=0\)이다. bit error가 독립이고 각 bit의 error probability가 \(P_b\), frame length가 \(F\) bits라면 error 없는 frame의 확률은 다음과 같다.

\[
P_1=(1-P_b)^F
\]

error detection이 없는 상황에서 frame에 하나 이상의 error가 있을 확률은 \(P_2=1-P_1\)이다. 이 식은 frame이 길수록 error-free frame probability가 빠르게 낮아진다는 점을 보여준다. 작은 BER도 긴 frame과 지속적 전송에서는 충분히 문제가 된다.

### Error Detection Process

Error detection의 공통 원리는 transmitter가 data bits의 function으로 check bits를 계산해 frame에 붙이고, receiver가 같은 function을 다시 계산해 수신된 check bits와 비교하는 것이다.

![Figure 6.3](@/assets/images/cs-data-communication-081-figure-6-3-page-207.png)
*Figure 6.3 · PDF p. 207 · transmitter와 receiver가 같은 error-detecting code function을 계산해 비교하는 과정*

data block이 \(k\) bits이고 error-detecting code가 \(n-k\) bits라면, transmitter는 \(k\)-bit data 뒤에 \(n-k\)-bit code를 append해 \(n\)-bit frame을 만든다. receiver는 incoming frame을 data part와 check part로 나누고, data part에 대해 같은 function \(f(data')\)를 계산한다. 계산 결과와 수신된 code가 다르면 detected error다.

여기서 중요한 한계는 error detection이 error의 존재를 알려줄 뿐, 어떤 bit가 틀렸는지 또는 어떻게 고칠지는 알려주지 않을 수 있다는 점이다. \(P_2\)는 residual error rate, 즉 error-detecting scheme을 쓰고도 error가 undetected로 남는 확률이다.

### Parity Check

가장 단순한 error-detecting code는 parity bit다. data block 끝에 1 bit를 추가해 전체 1의 개수가 even parity 또는 odd parity 조건을 만족하게 한다. 예를 들어 7-bit IRA character `1110001`을 odd parity로 보낼 때 1의 개수가 이미 4개라면 parity bit 1을 붙여 전체 1의 개수를 5개로 만든다.

Parity check는 single-bit error나 odd number of bit errors를 검출할 수 있다. 하지만 두 bit, 네 bit처럼 even number of bits가 뒤집히면 parity가 그대로라 undetected error가 된다. 특히 impulse noise는 여러 bit를 한꺼번에 손상시킬 수 있으므로 parity bit만으로는 high data rate 또는 burst-prone link에서 충분하지 않다.

### Cyclic Redundancy Check (CRC)

CRC(Cyclic Redundancy Check)는 가장 널리 쓰이고 강력한 error-detecting code 중 하나다. \(k\)-bit message \(D\)에 대해 transmitter는 \(n-k\)-bit FCS(Frame Check Sequence) \(F\)를 만들어 붙인다. resulting frame \(T\)가 미리 정한 divisor pattern \(P\)로 정확히 나누어떨어지도록 \(F\)를 고른다. receiver는 incoming frame을 같은 \(P\)로 나누고, remainder가 0이면 error가 없다고 가정한다.

CRC의 계산은 modulo 2 arithmetic으로 수행된다. modulo 2 addition/subtraction은 carry 없는 binary 연산이고, 실제로는 XOR(exclusive-OR)이다. CRC에서 사용하는 값은 다음과 같다.

| 기호 | 의미 |
|---|---|
| \(T\) | 전송할 \(n\)-bit frame |
| \(D\) | \(k\)-bit data block/message, \(T\)의 앞 \(k\) bits |
| \(F\) | \(n-k\)-bit FCS, \(T\)의 뒤 \(n-k\) bits |
| \(P\) | \(n-k+1\)-bit predetermined divisor pattern |

목표는 \(T/P\)의 remainder가 0이 되게 하는 것이다. \(D\) 뒤에 \(n-k\)개의 0을 붙인 값은 \(2^{n-k}D\)다. 이를 \(P\)로 나누면 quotient \(Q\)와 remainder \(R\)이 생긴다.

\[
\frac{2^{n-k}D}{P}=Q+\frac{R}{P}
\]

CRC는 이 remainder \(R\)을 FCS로 사용한다.

\[
T=2^{n-k}D+R
\]

그러면 \(T/P\)는 다음처럼 remainder가 사라진다. modulo 2에서는 \(R+R=0\)이기 때문이다.

\[
\frac{T}{P}=\frac{2^{n-k}D+R}{P}=Q+\frac{R}{P}+\frac{R}{P}=Q
\]

따라서 transmitter는 `D 뒤에 0 채우기 → P로 modulo 2 division → remainder R을 FCS로 붙이기`를 수행하고, receiver는 `received frame T를 P로 나누어 remainder 확인`을 수행한다.

CRC는 polynomial view로도 표현된다. bit string은 binary coefficient를 가진 polynomial로 본다. 예를 들어 \(D=110011\)이면 \(D(X)=X^5+X^4+X+1\), \(P=11001\)이면 \(P(X)=X^4+X^3+1\)이다. CRC의 핵심 식은 동일하다.

\[
\frac{X^{n-k}D(X)}{P(X)}=Q(X)+\frac{R(X)}{P(X)}
\]

\[
T(X)=X^{n-k}D(X)+R(X)
\]

전송 중 error pattern을 \(E\)라고 하면 received frame은 \(T_r=T \oplus E\)다. receiver가 error를 놓치는 경우는 \(T_r\)도 \(P\)로 나누어떨어지는 경우이고, 이는 결국 \(E\)가 \(P\)로 나누어떨어지는 경우다. 좋은 generator polynomial \(P(X)\)를 선택하는 이유가 바로 여기에 있다.

CRC generator polynomial을 잘 고르면 다음 유형의 error를 검출할 수 있다.

- \(P(X)\)가 둘 이상의 nonzero term을 가지면 all single-bit errors를 검출한다.
- 적절한 primitive polynomial을 쓰고 frame length 조건을 만족하면 all double-bit errors를 검출할 수 있다.
- \(P(X)\)가 \((X+1)\) factor를 포함하면 odd number of errors를 검출한다.
- FCS length 이하의 burst error는 모두 검출한다.
- 더 긴 burst error도 매우 높은 확률로 검출한다.

대표 polynomial은 CRC-12, CRC-16, CRC-CCITT, CRC-32다. CRC-12는 6-bit character stream에, CRC-16과 CRC-CCITT는 8-bit character에 널리 쓰였고, CRC-32는 point-to-point synchronous transmission 일부와 IEEE 802 LAN standards에서 사용된다. 특정 polynomial을 암기하는 것보다, FCS 길이와 generator polynomial 선택이 detection capability를 결정한다는 점이 중요하다.

### CRC Digital Logic

CRC는 수학적 나눗셈으로만 구현되는 것이 아니라 XOR gates와 shift register로 직접 구현할 수 있다. shift register는 1-bit storage device들의 줄이며, 각 clock time마다 전체 register가 동시에 shift된다. CRC circuit의 구조는 divisor polynomial \(P(X)\)에 의해 결정된다.

구현 규칙은 간단하다.

- shift register는 FCS length와 같은 \(n-k\) bits를 가진다.
- XOR gate는 최대 \(n-k\)개까지 필요하다.
- \(P(X)\)의 중간 term 존재 여부가 XOR gate의 존재 여부를 결정한다. 단, 양 끝 term인 \(1\)과 \(X^{n-k}\)는 제외하고 본다.

![Figure 6.5](@/assets/images/cs-data-communication-082-figure-6-5-page-214.png)
*Figure 6.5 · PDF p. 214 · polynomial division을 XOR gate와 shift register로 구현한 CRC 회로 예*

Figure 6.5는 앞의 CRC 예시 \(D=1010001101\), \(P=110101\), 즉 \(P(X)=X^5+X^4+X^2+1\)을 shift-register circuit으로 계산하는 과정을 보여준다. register는 처음에 all zeros로 clear된다. message bit는 most significant bit부터 하나씩 들어간다. 각 clock step에서 register 값과 XOR output이 다음 register state를 만든다.

송신 측 동작은 다음처럼 이해하면 된다.

```text
1. Switches = A position
2. message bits D를 shift register에 넣으면서 동시에 output으로 보냄
3. 마지막 data bit 처리 후 shift register 안에는 remainder R(FCS)이 남음
4. Switches = B position
5. XOR gates를 pass-through처럼 만들고 shift를 계속하여 FCS bits를 output
```

수신 측에서는 같은 logic을 사용한다. received message bits가 먼저 들어오면, error가 없을 경우 message 끝에서 shift register에는 송신자가 계산했던 \(R\) pattern이 들어 있다. 이어서 transmitted FCS bits가 들어오면 이 값들이 register를 zero out한다. 최종 register가 all zeros이면 no detected error로 본다. 최종 register에 nonzero value가 남으면 error detected다.

Figure 6.6은 manifest에는 추출되어 있지 않지만, 원문은 이를 일반화된 CRC architecture로 제시한다. 일반 divisor가

\[
P(X)=\sum_{i=0}^{n-k}A_iX^i,\quad A_0=A_{n-k}=1
\]

일 때 각 \(A_i\)가 1이면 해당 위치에 feedback XOR connection을 두고, 0이면 두지 않는다. 즉 CRC 회로는 generator polynomial을 그대로 hardware feedback topology로 옮긴 것이다.

## 6.4 Error Correction

Error detection은 HDLC 같은 data link control protocol이나 TCP 같은 transport protocol에서 유용하다. 하지만 detection만으로 error를 처리하려면 잘못된 block을 retransmission해야 한다. Wireless link에서는 이 접근이 비효율적일 수 있다.

첫째, wireless bit error rate가 높으면 retransmission이 너무 자주 발생한다. 둘째, satellite link처럼 propagation delay가 긴 경우에는 한 frame의 transmission time보다 round-trip delay가 훨씬 커서 retransmission 기반 방식이 비효율적이다. 특히 Chapter 7에서 다루는 일반적 retransmission 방식은 error frame뿐 아니라 그 이후 frame까지 다시 보내야 할 수 있다.

이 때문에 receiver가 incoming transmission bits만 보고 error를 고칠 수 있게 하는 FEC(Forward Error Correction)가 필요하다.

![Figure 6.7](@/assets/images/cs-data-communication-083-figure-6-7-page-215.png)
*Figure 6.7 · PDF p. 215 · k-bit data를 n-bit codeword로 바꾸고 receiver가 FEC decoder로 correction하는 흐름*

FEC에서는 transmitter가 \(k\)-bit data block을 \(n\)-bit codeword로 mapping한다. \(n>k\)이므로 redundancy가 추가된다. receiver의 FEC decoder는 incoming \(n\)-bit block을 보고 네 가지 결과 중 하나를 낸다.

1. no bit errors: original codeword 그대로 들어와 original data block을 출력한다.
2. correctable error: incoming block이 codeword와 다르지만 decoder가 original data block으로 mapping할 수 있다.
3. detectable but not correctable error: error가 있음을 알지만 어느 codeword였는지 결정할 수 없다.
4. undetected error: 드문 경우지만 decoder가 error를 감지하지 못하고 wrong data block으로 mapping한다.

Error correction은 redundancy를 추가해 receiver가 어느 original message가 가장 그럴듯한지 추론할 수 있게 만든다. 이 절의 중심은 block error-correcting code다.

### Block Code와 Hamming Distance

Hamming distance \(d(v_1,v_2)\)는 두 \(n\)-bit binary sequence가 서로 다른 bit position의 개수다. 예를 들어 \(v_1=011011\), \(v_2=110001\)이면 서로 다른 위치가 3개이므로 \(d(v_1,v_2)=3\)이다.

\((n,k)\) block code는 \(k\)-bit data block을 \(n\)-bit codeword로 바꾼다. 가능한 \(2^n\)개의 \(n\)-bit sequence 중 valid codeword는 \(2^k\)개뿐이다. 나머지는 invalid codeword다. receiver가 invalid codeword를 받으면, 가장 가까운 valid codeword를 선택하는 minimum-distance rule로 correction을 시도할 수 있다.

원문 예시는 \(k=2, n=5\)인 code를 사용한다.

| Data block | Codeword |
|---|---|
| 00 | 00000 |
| 01 | 00111 |
| 10 | 11001 |
| 11 | 11110 |

예를 들어 `00100`이 수신되면 valid codeword가 아니므로 error는 detected된다. 이 값은 `00000`과 Hamming distance 1, `00111`과 distance 2, `11110`과 distance 3, `11001`과 distance 4다. 가장 가까운 valid codeword가 유일하게 `00000`이므로 receiver는 original data block이 `00`이었다고 correction할 수 있다.

하지만 모든 invalid codeword에서 closest valid codeword가 유일한 것은 아니다. 어떤 invalid codeword는 두 valid codeword에서 같은 minimum distance를 가질 수 있다. 이 경우 error는 detected되지만 correctable하지 않다. 위 예시 code는 모든 single-bit error를 correct할 수 있지만, double-bit error는 항상 correct할 수 없다.

### \(d_{min}\), Code Rate, Redundancy

Code의 minimum distance \(d_{min}\)은 valid codeword들 사이의 pairwise Hamming distance 중 최솟값이다.

\[
d_{min}=\min_{i\ne j} d(w_i,w_j)
\]

\((n,k)\) block code에서 redundancy는 \((n-k)/k\), code rate는 \(k/n\)이다. code rate는 같은 input data rate를 유지하기 위해 추가로 필요한 transmission capacity를 나타낸다. 예를 들어 code rate \(1/2\)는 uncoded system과 같은 data rate를 유지하려면 channel bit rate가 두 배 필요하다는 뜻이다. 원문 예시 \((5,2)\) code는 code rate가 \(2/5\)라서 1 Mbps input data를 따라가려면 encoder output은 2.5 Mbps가 되어야 한다.

\(d_{min}\)과 correction/detection 능력의 관계는 다음과 같다.

| 목적 | 필요한 minimum distance |
|---|---|
| 모든 \(t\)-bit errors까지 correct | \(d_{min} \ge 2t+1\) |
| 모든 \(t-1\)-bit errors correct + 모든 \(t\)-bit errors detect | \(d_{min} \ge 2t\) |
| correction 없이 detection만 할 때 \(t\)-bit errors detect | \(t=d_{min}-1\) |

보장 가능한 correctable error 수는 다음과 같다.

\[
t=\left\lfloor\frac{d_{min}-1}{2}\right\rfloor
\]

직관은 간단하다. \(d_{min}\)개 이상의 bit가 바뀌면 한 valid codeword가 다른 valid codeword로 변할 수 있다. \(d_{min}\)보다 적게 바뀌면 다른 valid codeword에 정확히 도달할 수 없으므로 적어도 error detection은 가능하다. correction은 더 엄격해서, error로 생긴 received word가 original codeword에 가장 가까운 유일한 valid codeword여야 한다.

Block code 설계에는 상충 목표가 있다. 같은 \(n,k\)에서 \(d_{min}\)은 크게 하고 싶고, encoding/decoding은 쉬워야 하며, bandwidth 절약을 위해 extra bits \(n-k\)는 작게 하고 싶다. 하지만 error rate를 낮추려면 extra bits를 크게 하고 싶다. 즉 bandwidth overhead와 error performance 사이의 trade-off가 본질이다.

### Coding Gain

![Figure 6.8](@/assets/images/cs-data-communication-084-figure-6-8-page-220.png)
*Figure 6.8 · PDF p. 220 · rate 1/2 coding이 uncoded system 대비 required Eb/N0를 낮추는 효과*

Figure 6.8은 error-correcting code가 system performance를 어떻게 개선하는지 보여준다. uncoded modulation system의 BER curve와 rate 1/2 coding system의 curve를 비교하면, 특정 BER을 달성하는 데 필요한 \(E_b/N_0\)가 줄어드는 영역이 있다. 이 required \(E_b/N_0\) 감소량을 coding gain이라고 한다.

원문 예시에서는 BER \(10^{-6}\)에서 coding을 쓰면 required \(E_b/N_0\)가 2.77 dB 감소한다. 단, rate 1/2 code에서는 data bit 하나당 channel bit 두 개가 전송되므로 coded bit당 energy는 data bit energy의 절반, 즉 3 dB 낮아진다. Figure 6.8의 second curve에서 BER은 uncorrected errors rate이고, \(E_b\)는 data bit당 energy를 뜻한다는 점을 헷갈리면 안 된다.

또 하나 중요한 점은 coding이 항상 이득을 주지는 않는다는 것이다. \(E_b/N_0\)가 어떤 threshold보다 낮으면 extra check bits가 overhead로 작용해 성능을 악화시킬 수 있다. threshold 위에서는 code의 error-correcting power가 reduced energy per coded bit의 손실을 보상하고도 남아 coding gain이 생긴다.

## 6.5 Line Configurations

Data link configuration을 구분하는 두 축은 topology와 duplex mode다. topology는 station들이 transmission medium 위에 어떻게 물리적으로 배치되는지, duplex mode는 양방향 통신이 동시에 가능한지 여부를 뜻한다.

### Topology: Point-to-Point와 Multipoint

Data link topology에서 station이 두 개뿐이면 point-to-point link다. 예를 들어 terminal과 computer, 또는 두 computer 사이의 직접 link가 이에 해당한다. station이 셋 이상이면 multipoint topology다.

![Figure 6.9](@/assets/images/cs-data-communication-085-figure-6-9-page-221.png)
*Figure 6.9 · PDF p. 221 · primary host와 secondary terminals를 point-to-point 또는 multipoint로 연결하는 전통적 구성*

전통적인 multipoint link는 computer가 primary station이고 여러 terminal이 secondary stations인 환경에서 쓰였다. 오늘날에는 LAN(Local Area Network)에서도 multipoint topology를 볼 수 있다. Multipoint가 가능한 이유는 각 terminal이 항상 전송하는 것이 아니라 시간의 일부에서만 전송하기 때문이다.

Figure 6.9의 비용 관점이 중요하다. 모든 terminal이 point-to-point로 host에 연결되면 host에는 terminal마다 I/O port가 필요하고, terminal마다 separate transmission line이 필요하다. Multipoint configuration에서는 host가 single I/O port와 single transmission line으로 여러 terminal을 공유할 수 있어 비용을 줄인다. 대신 여러 station이 medium을 공유하므로 access control이나 polling 같은 제어 문제가 뒤따른다. 이런 문제는 이후 LAN과 data link control에서 더 중요해진다.

### Full Duplex와 Half Duplex

Half-duplex transmission은 point-to-point link의 두 station 중 한 번에 하나만 transmit할 수 있는 방식이다. two-way alternate라고도 하며, 한 차선짜리 양방향 다리에 비유할 수 있다. Terminal-to-computer interaction에서는 사용자가 data를 입력하고 전송하는 동안 computer가 terminal screen에 동시에 data를 보내면 혼란이 생길 수 있어 half-duplex가 쓰일 수 있다.

Full-duplex transmission은 두 station이 동시에 send와 receive를 할 수 있는 방식이다. two-way simultaneous라고도 하며, 두 차선짜리 양방향 다리에 비유할 수 있다. Computer-to-computer data exchange에서는 full duplex가 half duplex보다 효율적이다.

Digital signaling에서 full-duplex operation은 보통 두 개의 separate transmission paths가 필요하다. 예를 들어 두 twisted pairs를 사용해 한 pair는 한 방향, 다른 pair는 반대 방향으로 쓴다. Half duplex는 하나의 path만으로 가능하다.

Analog signaling에서는 frequency 사용 방식이 중요하다. 같은 frequency로 transmit과 receive를 한다면 wireless에서는 half-duplex가 필요하다. guided transmission에서는 separate lines를 쓰면 full duplex가 가능하다. 반대로 station이 한 frequency로 transmit하고 다른 frequency로 receive한다면 wireless에서도 full duplex가 가능하고, guided transmission에서도 single line 위에서 full duplex가 가능할 수 있다.

Single transmission line에서 digital signals를 양방향 동시에 보내는 기술로 echo cancellation이 있다. 이는 자기 송신 신호의 echo를 제거해 반대 방향 신호를 분리하는 signal processing technique이며, 원문은 상세 설명을 범위 밖으로 둔다.

## 연결 관계

Asynchronous/synchronous transmission은 Chapter 5의 encoding과 직접 연결된다. Manchester나 Differential Manchester처럼 clocking information을 signal에 포함하는 encoding은 synchronous transmission에서 bit timing을 유지하는 데 도움이 된다. Chapter 7의 data link control은 여기서 설명한 synchronous frame, flag, control fields, error detection을 기반으로 동작한다.

Error detection과 error correction은 “error가 생긴 뒤 무엇을 할 것인가”의 두 전략이다. Error detection은 CRC나 parity로 error를 발견한 뒤 retransmission을 요구한다. Error correction은 FEC redundancy로 receiver가 일부 error를 직접 고친다. 따라서 propagation delay가 길거나 retransmission 비용이 큰 wireless/satellite 환경에서는 FEC가 더 매력적이다.

CRC와 ECC는 둘 다 redundancy를 사용하지만 목적이 다르다. CRC의 목표는 residual error rate를 낮추는 detection이고, ECC의 목표는 codeword space를 넓게 배치해 nearest valid codeword를 찾을 수 있게 하는 correction이다. CRC에서는 generator polynomial이 detection capability를 결정하고, block code에서는 \(d_{min}\), code rate, redundancy가 correction/detection trade-off를 결정한다.

## 오해하기 쉬운 내용

- asynchronous transmission은 “clock이 필요 없다”는 뜻이 아니다. character마다 start bit로 resynchronize할 뿐, character 내부에서는 timing을 유지해야 한다.
- synchronous transmission은 start/stop overhead가 없지만, frame boundary와 bit timing synchronization이 별도로 필요하다.
- parity bit는 single-bit error detection에는 유용하지만 even number of bit errors를 놓칠 수 있다.
- CRC는 error를 고치는 code가 아니라 detection code다. receiver가 remainder nonzero를 보고 error를 알 수 있지만, 어느 bit가 틀렸는지는 일반적으로 알지 못한다.
- CRC에서 modulo 2 arithmetic은 ordinary binary arithmetic이 아니다. carry 없는 XOR 연산이다.
- FEC는 bandwidth를 공짜로 얻는 방법이 아니다. redundancy 때문에 code rate가 낮아지고 channel bit rate 또는 bandwidth 요구가 증가한다.
- \(d_{min}\)이 크면 correction 능력은 좋아지지만, 같은 \(n,k\) 조건에서 code 설계와 decoding complexity, redundancy trade-off가 생긴다.
- full duplex는 단순히 양방향 통신 가능이라는 뜻이 아니라 simultaneous two-way transmission을 뜻한다. half duplex도 양방향은 가능하지만 alternate 방식이다.

## 면접 질문

1. Asynchronous transmission에서 start bit와 stop element가 각각 어떤 역할을 하는지 설명하라.
2. Synchronous frame에서 flag, control fields, data field가 왜 필요한지 설명하라.
3. Single-bit error와 burst error의 차이를 설명하고, data rate가 높을수록 burst error가 더 부담스러운 이유를 말하라.
4. Parity check가 검출할 수 있는 error와 놓치는 error를 예로 설명하라.
5. CRC에서 \(D\), \(P\), \(R\), FCS가 무엇이며, receiver가 remainder 0을 확인하는 이유를 설명하라.
6. CRC가 parity bit보다 강력한 이유를 generator polynomial과 burst error 관점에서 설명하라.
7. Shift register와 XOR gate로 CRC를 구현할 수 있는 이유를 polynomial division과 연결해 설명하라.
8. FEC와 retransmission 기반 error recovery의 trade-off를 wireless/satellite link 관점에서 설명하라.
9. Hamming distance와 \(d_{min}\)이 block error-correcting code의 correction 능력을 어떻게 결정하는지 설명하라.
10. Point-to-point와 multipoint, half duplex와 full duplex를 각각 비교하라.
