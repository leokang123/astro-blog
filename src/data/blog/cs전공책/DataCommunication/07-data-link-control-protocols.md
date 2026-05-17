---
title: "Chapter 7. Data Link Control Protocols"
order: 7
pubDatetime: 2026-05-18T00:00:00+09:00
modDatetime: 2026-05-18T00:00:00+09:00
description: "Data and Computer Communications 정리: Chapter 7. Data Link Control Protocols"
tags:
  - "DataCommunication"
  - "CS"
---

## 메타데이터

- 과목: Data Communication
- 기준 교재: Data and Computer Communications 8e
- 원문 범위: PDF pp. 226-257
- 기준 규칙: `정리규칙/목차기준/DataCommunication/07_DataCommunicationChapter_7._Data_Link_Control_Protocols.md`
- 핵심 검색어: data link control protocol, frame synchronization, flow control, stop-and-wait flow control, bit length, propagation time, transmission time, acknowledgment, ACK, buffer overflow, HDLC, ARQ

## 개요

Chapter 6까지는 신호를 물리 매체 위에 어떻게 올릴지, 즉 physical layer 관점의 전송을 다뤘다. Chapter 7은 그 위에 얹히는 제어 논리인 `data link control protocol`을 다룬다. 직접 연결된 두 station이 단순히 bit stream을 주고받는 것만으로는 충분하지 않다. frame의 시작과 끝을 구분해야 하고, receiver가 감당 가능한 속도로만 보내야 하며, 오류가 난 frame을 복구해야 하고, 공유 링크에서는 어느 station 사이의 통신인지도 식별해야 한다.

데이터 링크 제어가 필요한 요구사항은 다음처럼 정리된다.

| 요구사항 | 핵심 의미 |
| --- | --- |
| `frame synchronization` | 데이터는 `frame` 단위로 전송되므로 각 frame의 시작과 끝을 알아야 한다. |
| `flow control` | sender가 receiver의 buffer와 처리 능력을 넘는 속도로 보내지 못하게 한다. |
| `error control` | 전송 중 bit error, loss, garbled frame을 감지하고 필요한 경우 재전송한다. |
| `addressing` | LAN처럼 shared link에서는 송신/수신 station을 구분한다. |
| `control and data on same link` | 별도 제어선을 두지 않고 같은 링크에서 control information과 user data를 구분한다. |
| `link management` | 데이터 교환의 시작, 유지, 종료를 양쪽 station이 협조해 관리한다. |

이 장의 흐름은 먼저 `flow control`과 `error control`이라는 두 기본 메커니즘을 이해하고, 그 위에서 대표적인 표준 프로토콜인 `High-Level Data Link Control (HDLC)`가 어떻게 frame 형식과 절차를 조직하는지 보는 것이다. 마지막 Appendix 7A에서는 stop-and-wait, sliding-window, ARQ의 utilization을 성능 관점에서 계산한다.

## 핵심 개념

### Data Link Control Protocol

`data link control protocol`은 physical layer 위에 추가되는 link-level control logic이다. 전송 매체 자체가 bit를 실어 나르는 역할을 한다면, data link control은 그 bit들을 frame으로 묶고, frame 단위의 순서/오류/흐름/연결 관리를 제공한다. 이 프로토콜이 사용될 때 두 시스템 사이의 transmission medium은 단순한 medium이 아니라 `data link`로 취급된다.

Figure 7.1은 이 장에서 반복해서 쓰이는 frame 전송 모델이다. 수직축은 time이고, 각 화살표는 한 frame이 source에서 destination으로 이동하는 과정을 나타낸다. 왼쪽은 error-free transmission, 오른쪽은 손실 또는 손상된 frame이 있는 상황이다. 뒤의 `error control` 논의는 이 오른쪽 모델을 복구 가능한 절차로 바꾸는 문제다.

![Figure 7.1](@/assets/images/data-communication-frame-transmission-model-figure-7-1.png)
*Figure 7.1 · PDF p. 229 · frame transmission의 error-free/error 상황 모델*

### Flow Control

`flow control`은 transmitting entity가 receiving entity를 data로 압도하지 않게 하는 기법이다. receiver는 보통 제한된 크기의 data buffer를 할당하고, 받은 frame을 higher-level software로 넘기기 전에 일정한 처리를 해야 한다. sender가 이 처리 속도를 무시하고 계속 보내면 buffer overflow가 발생한다.

이 절의 분석은 우선 error-free 상황을 가정한다. 즉, frame은 loss 없이 도착하고, error 없이 수신되며, 보낸 순서대로 도착한다고 본다. 다만 frame마다 reception까지 걸리는 delay는 있을 수 있다. 이 가정은 `flow control`만 떼어 설명하기 위한 것이고, 다음 절의 `error control`에서 손상/손실 상황을 다시 포함한다.

### Stop-and-Wait Flow Control

`stop-and-wait flow control`은 가장 단순한 흐름 제어 방식이다.

1. source가 frame 하나를 전송한다.
2. destination이 그 frame을 받으면 다음 frame을 받을 준비가 되었다는 뜻으로 `acknowledgment (ACK)`를 보낸다.
3. source는 ACK를 받기 전까지 다음 frame을 보내지 않는다.
4. destination은 ACK를 보류함으로써 sender의 흐름을 멈출 수 있다.

이 방식은 메시지가 몇 개의 큰 frame으로 끝나는 상황에서는 충분히 단순하고 안정적이다. 하지만 실제로는 큰 data block을 여러 작은 frame으로 나누는 경우가 많다. 그 이유는 receiver buffer가 제한되어 있고, 긴 frame일수록 error 발생 시 전체 frame을 다시 보내야 하며, LAN처럼 shared medium에서는 한 station이 너무 오래 medium을 점유하면 다른 station의 지연이 커지기 때문이다.

문제는 stop-and-wait가 한 번에 하나의 frame만 transit 상태로 허용한다는 점이다. link에 이미 더 많은 bit를 실을 수 있는데도 sender가 ACK를 기다리느라 쉬게 되면 utilization이 급격히 떨어진다.

### Bit Length와 Stop-and-Wait의 비효율

link의 `bit length`는 특정 순간 링크 전체를 채우는 bit 수다.

$$
B = R \times \frac{d}{V}
$$

| 기호 | 의미 |
| --- | --- |
| `B` | link length in bits, 즉 링크 위에 동시에 존재할 수 있는 bit 수 |
| `R` | data rate, bps |
| `d` | link distance, meters |
| `V` | propagation velocity, m/s |

frame 길이를 `L` bits라고 하면, 원문은 다음 비율을 사용한다.

$$
a = \frac{B}{L}
$$

이는 사실상 `propagation time / transmission time`으로 해석할 수 있다. `a < 1`이면 propagation time이 transmission time보다 짧아서 sender가 frame을 다 밀어 넣기 전에 앞부분이 receiver에 도착한다. `a > 1`이면 sender가 frame 전체를 다 보낸 뒤에도 첫 bit가 아직 receiver에 도착하지 않았을 수 있다. 즉 `a`가 클수록 long distance, high data rate, small frame 조합에서 stop-and-wait의 낭비가 커진다.

Figure 7.2는 transmission time을 1로 정규화하고 propagation time을 `a`로 둔 stop-and-wait utilization을 보여준다. 특히 `a > 1`인 satellite link 같은 경우, sender는 짧은 시간 동안 frame을 보내고 매우 긴 시간 동안 ACK를 기다린다.

![Figure 7.2](@/assets/images/data-communication-stop-and-wait-utilization-figure-7-2.png)
*Figure 7.2 · PDF p. 230 · stop-and-wait에서 propagation delay가 utilization을 제한하는 모습*

Example 7.1의 대비가 중요하다. 200 m optical fiber link, 1 Gbps, 8000-bit frame에서는 `B = 1000 bits`, `a = 0.125`라서 실제 frame transmission time 8 us에 대해 ACK까지 약 10 us 수준이다. 반면 1 Mbps satellite relay, 왕복에 해당하는 긴 propagation path, 8000-bit frame에서는 `B = 240,000 bits`, `a = 30`이 되고, frame 자체는 8 ms에 보내지만 ACK를 받을 때까지 약 488 ms를 기다린다. 같은 stop-and-wait 절차라도 링크의 `bandwidth-delay product`가 커질수록 사용률은 크게 나빠진다.

## 세부 정리

### 7.1 Flow Control: Stop-and-Wait까지의 결론

`stop-and-wait flow control`의 장점은 구현과 reasoning이 단순하다는 점이다. receiver는 ACK를 보낼지 말지만 결정하면 되고, sender는 ACK 전에는 다음 frame을 보내지 않으면 된다. 그러나 data rate가 높거나 propagation distance가 긴 링크에서는 링크가 수용할 수 있는 bit 수에 비해 in-flight frame이 하나뿐이라서 capacity를 채우지 못한다.

따라서 이 절의 결론은 단순하다. `flow control`의 목적은 receiver 보호이지만, 그 방식이 지나치게 보수적이면 link utilization을 희생한다. 다음 구간의 `sliding-window flow control`은 이 한계를 해결하기 위해 여러 frame을 동시에 outstanding 상태로 허용한다.

### Sliding-Window Flow Control

`sliding-window flow control`의 핵심은 링크를 하나의 pipeline으로 보고, ACK를 기다리는 동안에도 여러 frame을 계속 흘려보내는 것이다. full-duplex link에서 station B가 `W`개 frame을 담을 buffer를 준비했다면, station A는 ACK 없이도 최대 `W`개 frame을 연속 전송할 수 있다. 각 frame에는 `sequence number`가 붙고, ACK는 “다음에 기대하는 frame 번호”를 담는다.

예를 들어 receiver가 frame 2, 3, 4를 모두 받은 뒤 `ACK 5` 또는 HDLC식 표현으로 `RR 5`를 보내면, 이는 frame 4까지 누적 확인했고 다음 frame 5부터 받을 준비가 되었다는 의미다. 이처럼 sliding-window의 ACK는 보통 `cumulative acknowledgment`로 동작한다.

#### Sender Window와 Receiver Window

sender와 receiver는 각각 window를 유지한다.

| 관점 | window가 의미하는 것 | window가 줄어드는 순간 | window가 다시 커지는 순간 |
| --- | --- | --- | --- |
| sender perspective | 지금 전송해도 되는 sequence number 집합 | frame을 전송할 때 | ACK를 받을 때 |
| receiver perspective | 지금 수신해도 되는 sequence number 집합 | frame을 수신할 때 | ACK를 보낼 때 |

Figure 7.3은 3-bit sequence number를 가정한다. sequence number는 `0`부터 `7`까지 간 뒤 다시 `0`으로 돌아가므로 `modulo 8`로 번호가 붙는다. 일반적으로 sequence number field가 `k` bits이면 번호 범위는 `0`부터 `2^k - 1`이고, numbering은 `modulo 2^k`가 된다.

![Figure 7.3](@/assets/images/data-communication-sliding-window-depiction-figure-7-3.png)
*Figure 7.3 · PDF p. 232 · sender/receiver 관점의 sliding-window 이동*

sender window에서 이미 전송했지만 ACK를 받지 못한 frame은 재전송 가능성을 위해 buffer에 남아 있어야 한다. ACK가 도착하면 해당 frame들은 더 이상 보관할 필요가 없고 window가 앞으로 이동한다. receiver window는 받을 수 있는 frame 번호를 나타내며, 수신과 ACK에 따라 움직인다.

#### Sequence Number와 Maximum Window Size

원문은 `k-bit sequence number field`에서 maximum window size가 `2^k - 1`이라고 설명한다. 단순히 가능한 번호가 `2^k`개라고 해서 window를 `2^k`까지 열면, 번호가 한 바퀴 돈 뒤 이전 frame과 새 frame을 구분하기 어려운 ambiguity가 생길 수 있다. 뒤의 `sliding-window ARQ` 논의에서는 error recovery까지 고려해 이 제한이 더 중요해진다.

3-bit field라면 sequence number는 `0..7`이고, 보통 최대 window는 7 frame이다. 다만 실제 window size는 최대값보다 작게 설정할 수 있다. 예를 들어 3-bit field를 사용하면서 window size를 5로 구성할 수도 있다.

#### RR, RNR, Piggybacking

sliding-window는 흐름 제어를 위해 다음 control message 개념을 사용한다.

| 용어 | 의미 |
| --- | --- |
| `RR (Receive Ready)` | 지정한 번호 이전 frame들을 받았고, 지정한 번호부터 새 frame을 받을 준비가 되었음을 알린다. |
| `RNR (Receive Not Ready)` | 이전 frame들은 ACK하지만, 당장은 추가 frame을 받을 수 없다고 알린다. |
| `piggybacking` | data frame 안에 자신의 frame sequence number와 상대에게 보내는 ACK number를 함께 넣어 별도 ACK frame을 줄인다. |

Example 7.2의 sliding-window 흐름은 다음처럼 읽으면 된다.

| 단계 | A의 동작 | B의 응답/의미 |
| --- | --- | --- |
| 초기 | A는 3-bit numbering에서 최대 7개 frame 전송 가능 | B는 F0부터 받을 준비 |
| F0, F1, F2 전송 | A window는 4개 frame만 남고, F0-F2 사본을 buffer에 보관 | B는 받은 frame을 누적 |
| `RR 3` 수신 | A는 F0-F2를 ACK된 frame으로 보고 buffer에서 제거 | B는 F2까지 받았고 F3부터 받을 준비 |
| F3-F6 전송 | A는 window를 사용하며 계속 pipeline을 채움 | B가 `RR 4`를 보내면 F3까지 ACK |
| `RR 4` 도착 시점 | A가 이미 F4-F6도 보냈다면, 실제로 새로 열리는 여유는 F7부터 4개 수준 | ACK는 cumulative지만 이미 보낸 frame 수에 따라 sender window 크기가 결정됨 |

양방향 data exchange에서는 각 station이 두 개의 window를 갖는다. 하나는 자신이 보내는 frame을 위한 transmit window이고, 다른 하나는 상대가 보내는 frame을 받기 위한 receive window다. `piggybacking`은 이 full-duplex 상황에서 효율적이다. data와 ACK를 따로 보내지 않고 하나의 frame에 같이 실을 수 있기 때문이다. 보낼 data가 없고 ACK만 있다면 `RR` 또는 `RNR` 같은 별도 acknowledgment frame을 보낸다. 반대로 보낼 data는 있지만 새 ACK가 없다면 마지막 ACK number를 반복해서 넣고, receiver는 duplicate acknowledgment를 무시한다.

### 7.1 Flow Control: Sliding-Window까지의 결론

`sliding-window flow control`은 stop-and-wait의 핵심 병목인 “in-flight frame 하나” 제한을 없앤다. link의 `bit length`가 frame length보다 크고 `a`가 큰 환경에서는 여러 frame을 동시에 보내야 pipeline이 찬다. Example 7.3에서 짧은 optical fiber link는 window size 2만으로도 거의 연속 전송이 가능하지만, satellite link는 ACK까지 488 ms가 걸려 window가 61 frame 정도는 되어야 8 ms마다 frame을 계속 보낼 수 있다. 따라서 window size와 sequence number field 길이는 단순한 format 세부가 아니라 link utilization을 결정하는 설계 변수다.

### 7.2 Error Control

`error control`은 frame transmission 중 발생하는 error를 detect하고 correct하는 메커니즘이다. 이 절의 모델은 Figure 7.1b처럼 frame이 손실되거나 손상될 수 있는 링크다. 원문은 두 종류의 오류를 구분한다.

| 오류 | 의미 |
| --- | --- |
| `lost frame` | frame이 상대에게 도착하지 않는다. 예를 들어 noise burst 때문에 receiver가 frame이 전송되었는지조차 인식하지 못할 수 있다. |
| `damaged frame` | frame의 존재는 인식되지만 일부 bit가 바뀌어 error detection에 걸린다. |

link-level error control의 일반 재료는 네 가지다.

| 재료 | 역할 |
| --- | --- |
| `error detection` | Chapter 6의 error-detecting code처럼 frame 손상을 발견한다. |
| `positive acknowledgment` | 정상 수신된 frame에 대해 ACK를 돌려준다. |
| `retransmission after timeout` | 일정 시간 ACK가 없으면 sender가 frame을 다시 보낸다. |
| `negative acknowledgment and retransmission` | receiver가 오류 frame에 대해 `NAK`, `REJ`, `SREJ` 같은 부정 응답을 보내고 sender가 재전송한다. |

이 재료들을 묶어 `automatic repeat request (ARQ)`라고 부른다. ARQ의 효과는 unreliable data link를 reliable하게 보이도록 만드는 것이다. 이 장에서 표준화된 세 가지 ARQ는 `stop-and-wait ARQ`, `go-back-N ARQ`, `selective-reject ARQ`다.

#### Stop-and-Wait ARQ

`stop-and-wait ARQ`는 stop-and-wait flow control에 error recovery를 붙인 것이다. sender는 frame 하나를 보내고 ACK를 기다리며, ACK 전에는 다른 data frame을 보내지 않는다. frame이 손상되면 receiver는 error detection으로 이를 알아내고 frame을 버린다. sender는 timer를 두고, timeout까지 ACK가 오지 않으면 같은 frame을 다시 보낸다. 따라서 sender는 ACK를 받을 때까지 transmitted frame의 copy를 유지해야 한다.

ACK 자체가 손상되는 경우도 중요하다. A가 frame을 보내고 B가 정상 수신 후 ACK를 보냈는데, ACK가 깨져 A가 인식하지 못하면 A는 timeout 후 같은 frame을 다시 보낸다. 이 duplicate frame을 B가 새 frame으로 받아들이면 같은 data가 두 번 전달된다. 이를 막기 위해 stop-and-wait ARQ는 frame label을 `0`과 `1`로 번갈아 사용한다. `ACK0`은 “frame 1을 받았고 다음에는 frame 0을 기대한다”는 식으로, 다음 expected frame 번호를 알려준다.

![Figure 7.5](@/assets/images/data-communication-stop-and-wait-arq-figure-7-5.png)
*Figure 7.5 · PDF p. 237 · stop-and-wait ARQ의 lost frame과 lost ACK 처리*

Figure 7.5의 핵심은 두 가지다. PDU 0이 lost/damaged 되면 B가 ACK를 보내지 않고, A의 timeout이 재전송을 유발한다. 나중에 `ACK0`이 lost되면 A는 frame 1을 다시 보내지만, B는 같은 label의 duplicate PDU를 버리고 다시 `ACK0`을 보낸다. 단순하지만 stop-and-wait 자체의 utilization 한계를 그대로 가진다.

#### Go-Back-N ARQ

`go-back-N ARQ`는 sliding-window flow control 위에 error control을 얹은 가장 일반적인 방식이다. sender는 window size가 허용하는 범위에서 여러 frame을 연속 전송한다. 오류가 없으면 receiver는 `RR (Receive Ready)` 또는 piggybacked acknowledgment로 누적 ACK를 보낸다.

오류가 발생하면 receiver는 오류 frame과 그 뒤에 도착한 out-of-order frame들을 버리고, 오류 frame 번호에 대한 `REJ (Reject)`를 보낸다. sender가 `REJ i`를 받으면 frame `i`뿐 아니라 그 사이에 이미 보낸 모든 subsequent frame을 다시 보낸다. 그래서 이름이 go-back-N이다.

Go-back-N의 주요 contingency는 다음과 같다.

| 상황 | receiver 동작 | sender 동작 |
| --- | --- | --- |
| `damaged frame i`, 뒤이어 `i+1`이 도착 | `i+1`은 out of order이므로 버리고 `REJ i` 전송 | `i`와 이후 전송한 frame들을 재전송 |
| `damaged frame i`, 뒤이어 아무 frame도 안 옴 | receiver는 아무것도 보지 못하므로 `RR`/`REJ`도 못 보낼 수 있음 | timer 만료 후 `RR` command에 `P bit = 1`을 세워 receiver 상태를 poll하거나 frame `i`를 재전송 |
| `damaged RR` | cumulative ACK라서 이후 RR이 먼저 도착하면 문제 없음 | timer가 만료되면 `P bit`를 둔 RR command로 receiver에게 next expected frame을 묻고, 반복 실패 시 reset procedure |
| `damaged REJ` | lost REJ는 damaged frame 후 침묵 상황과 유사 | timeout과 poll 절차로 복구 |

Example 7.4의 흐름은 frame 4가 damaged 되는 상황이다. B는 frame 5와 6을 out-of-order로 보고 버리며 `REJ 4`를 보낸다. A가 `REJ 4`를 받으면 frame 4, 5, 6을 모두 재전송해야 한다. 따라서 transmitter는 모든 unacknowledged frame의 copy를 유지해야 한다.

#### Sliding-Window에서 `2^k - 1` 제한이 필요한 이유

Go-back-N에서는 `k-bit sequence number field`의 maximum window size가 `2^k - 1`로 제한된다. 이유는 error control과 cumulative acknowledgment가 결합될 때 sequence number가 한 바퀴 도는 ambiguity가 생기기 때문이다.

3-bit sequence number라면 번호 공간은 0..7이다. sender가 frame 0을 보내고 `RR 1`을 받은 뒤, frames 1,2,3,4,5,6,7,0을 또 보내고 다시 `RR 1`을 받았다고 하자. 이 `RR 1`은 “8개 frame 모두 정상 수신”이라는 cumulative ACK일 수도 있고, “새 frame들이 모두 손실되어 이전 `RR 1`을 반복”한 것일 수도 있다. window를 8이 아니라 7로 제한하면 이런 완전한 겹침을 피할 수 있다.

#### Selective-Reject ARQ

`selective-reject ARQ`는 오류가 난 frame만 골라 재전송하는 방식이다. negative acknowledgment는 보통 `SREJ (Selective Reject)`로 표현된다. Example 7.5에서 frame 4가 손실되고 frame 5가 먼저 도착하면, B는 `SREJ 4`를 보내면서도 frame 5 이후의 정상 frame들을 버리지 않고 buffer에 저장한다. frame 4가 재전송되어 도착하면 B는 buffer에 있던 frame들과 순서를 맞춰 higher-layer software에 전달한다.

Selective-reject는 재전송량을 줄이므로 긴 propagation delay가 있는 satellite link에서 특히 유리할 수 있다. 하지만 receiver는 out-of-order frame을 저장할 buffer와 재정렬 logic이 필요하고, sender도 sequence 밖의 특정 frame만 다시 보내는 복잡한 logic이 필요하다. 그래서 원문은 selective-reject가 go-back-N보다 덜 널리 쓰인다고 설명한다.

Selective-reject의 window 제한은 go-back-N보다 더 엄격하다. receive window와 send window가 겹치면 재전송된 old frame을 new frame으로 오해할 수 있기 때문이다. 3-bit sequence number의 번호 공간이 8일 때 window size를 7로 두면, A가 0..6을 보내고 B가 모두 받아 `RR 7`을 보냈지만 그 ACK가 lost된 뒤, A가 timeout으로 frame 0을 재전송하는 상황에서 B는 이미 receive window를 7,0,1,2,3,4,5로 옮겨 old frame 0을 new frame 0으로 받아들일 수 있다. 이를 피하려면 selective-reject의 maximum window size는 sequence number range의 절반 이하, 즉 `2^(k-1)` 이하가 되어야 한다.

### 7.2 Error Control: ARQ 비교

| 방식 | 재전송 단위 | 장점 | 비용/주의점 |
| --- | --- | --- | --- |
| `stop-and-wait ARQ` | frame 하나 | 가장 단순하고 duplicate 처리가 쉬움 | long-delay/high-rate link에서 utilization 낮음 |
| `go-back-N ARQ` | 오류 frame부터 이후 outstanding frame 전체 | receiver가 단순하고 널리 사용됨 | 오류 뒤에 정상 도착한 frame도 버리므로 재전송량 증가 |
| `selective-reject ARQ` | 오류 frame만 | 재전송량 최소화, satellite link에 유리 | receiver buffer, resequencing, sender logic이 복잡하고 window 제한이 더 엄격 |

이 절의 핵심 연결은 분명하다. `flow control`은 receiver가 감당 가능한 양을 조절하고, `error control`은 손상/손실된 frame을 다시 보내 reliable link를 만든다. 실제 data link protocol은 둘을 별개로 두지 않고, sequence number, ACK number, window, timer, REJ/SREJ를 함께 사용한다.

### 7.3 High-Level Data Link Control (HDLC)

`High-Level Data Link Control (HDLC)`는 대표적인 data link control protocol이며, 많은 다른 link protocol이 HDLC의 frame format과 mechanism을 직접 또는 변형해서 사용한다. 이 장에서 HDLC가 중요한 이유는 특정 표준 하나를 외우기 위해서라기보다, 앞에서 배운 `flow control`, `error control`, `ARQ`, `link management`가 실제 protocol 안에서 어떻게 결합되는지 보여주는 기준점이기 때문이다.

#### Basic Characteristics: Station, Configuration, Mode

HDLC는 다양한 application을 수용하기 위해 station type, link configuration, transfer mode를 구분한다.

| 구분 | 항목 | 의미 |
| --- | --- | --- |
| station type | `primary station` | link operation을 제어한다. primary가 내보내는 frame은 `command`다. |
| station type | `secondary station` | primary의 제어 아래 동작한다. secondary가 내보내는 frame은 `response`다. |
| station type | `combined station` | primary와 secondary 기능을 모두 갖고 command와 response를 모두 낼 수 있다. |
| link configuration | `unbalanced configuration` | 하나의 primary와 하나 이상의 secondary로 구성된다. full-duplex와 half-duplex 모두 가능하다. |
| link configuration | `balanced configuration` | 두 combined station으로 구성된다. full-duplex와 half-duplex 모두 가능하다. |
| transfer mode | `NRM (Normal Response Mode)` | unbalanced configuration에서 사용한다. secondary는 primary command에 대한 응답으로만 전송한다. |
| transfer mode | `ABM (Asynchronous Balanced Mode)` | balanced configuration에서 사용한다. 양쪽 combined station이 상대 허락 없이 전송을 시작할 수 있다. |
| transfer mode | `ARM (Asynchronous Response Mode)` | unbalanced configuration이지만 secondary가 explicit permission 없이 전송을 시작할 수 있다. primary는 여전히 line 초기화, error recovery, disconnect 책임을 가진다. |

원문은 `ABM`이 세 mode 중 가장 널리 쓰인다고 설명한다. full-duplex point-to-point link에서 polling overhead가 없어 효율적이기 때문이다. `NRM`은 host가 여러 terminal을 poll하는 multidrop line에 어울리고, `ARM`은 일부 특수 상황을 제외하면 드물다.

#### HDLC Frame Structure

HDLC는 synchronous transmission을 사용하며 모든 전송을 frame 형태로 한다. 하나의 frame format이 data exchange와 control exchange를 모두 수용한다. Figure 7.7의 기본 구조는 다음과 같다.

![Figure 7.7](@/assets/images/data-communication-hdlc-frame-format-figure-7-7.png)
*Figure 7.7 · PDF p. 242 · HDLC frame format과 I/S/U control field 형식*

| field | 길이/형식 | 역할 |
| --- | --- | --- |
| `Flag` | 8 bits, `01111110` | frame의 시작과 끝을 구분한다. 하나의 flag가 앞 frame의 ending flag이자 다음 frame의 opening flag가 될 수 있다. |
| `Address` | 보통 8 bits, extendable | secondary station을 식별한다. point-to-point에서는 사실상 불필요하지만 uniformity 때문에 포함된다. |
| `Control` | 8 또는 16 bits | frame type, sequence number, ACK number, P/F bit, supervisory function 등을 담는다. |
| `Information` | variable | I-frame과 일부 U-frame에 존재하며 user data 또는 control information을 담는다. octet 단위여야 한다. |
| `FCS (Frame Check Sequence)` | 16 또는 32 bits | flag를 제외한 frame bits에 대해 계산하는 error-detecting code다. 일반적으로 16-bit CRC-CCITT를 사용하고, 필요하면 32-bit CRC-32를 쓴다. |

`Flag`, `Address`, `Control`은 information field 앞에 있으므로 header로 볼 수 있고, `FCS`와 마지막 `Flag`는 trailer로 볼 수 있다.

#### Flag, Bit Stuffing, Data Transparency

HDLC receiver는 계속 `01111110` flag pattern을 찾으며 frame boundary에 동기화한다. 문제는 information field에 임의 bit pattern이 들어갈 수 있으므로, data 안에도 우연히 `01111110`이 나타날 수 있다는 점이다. 그러면 receiver가 data를 frame boundary로 오해해 synchronization이 깨진다.

이를 막기 위해 HDLC는 `bit stuffing`을 사용한다. 시작 flag와 끝 flag 사이의 모든 bits에 대해 transmitter는 연속된 five 1s가 나타날 때마다 extra `0` bit를 삽입한다. receiver는 five 1s 뒤의 sixth bit를 검사한다.

| 수신 패턴 | receiver 해석 |
| --- | --- |
| `111110` | stuffed 0으로 보고 0을 삭제한다. |
| `1111110` | flag로 받아들인다. |
| `1111111` | abort condition으로 본다. |

![Figure 7.8](@/assets/images/data-communication-hdlc-bit-stuffing-figure-7-8.png)
*Figure 7.8 · PDF p. 243 · HDLC bit stuffing 예시*

`bit stuffing` 덕분에 data field에는 arbitrary bit pattern을 넣을 수 있다. 이 성질을 `data transparency`라고 한다. 즉 link protocol이 특정 bit sequence를 금지하지 않아도 frame boundary를 안정적으로 구분할 수 있다.

#### Address Field와 Control Field

`Address field`는 frame을 보낸 secondary 또는 받을 secondary를 식별한다. extended address format에서는 실제 address 길이가 7-bit 단위로 늘어나며, 각 octet의 leftmost bit가 마지막 octet 여부를 나타낸다. single-octet `11111111`은 `all-stations address`로 해석되어 primary가 모든 secondary에게 broadcast frame을 보낼 때 사용된다.

`Control field`는 HDLC의 동작을 실제로 좌우한다. HDLC frame은 control field format에 따라 세 종류로 나뉜다.

| frame type | 이름 | 핵심 역할 |
| --- | --- | --- |
| `I-frame` | Information frame | user data를 운반하며, `N(S)`와 `N(R)`로 flow/error control 정보를 piggyback한다. |
| `S-frame` | Supervisory frame | piggybacking할 data가 없을 때 RR, RNR, REJ, SREJ 등 ARQ 관련 제어를 수행한다. |
| `U-frame` | Unnumbered frame | set mode, disconnect, reset, test 등 supplemental link control 기능을 수행한다. |

모든 control field format에는 `P/F (Poll/Final) bit`가 있다. command frame에서는 `P bit`로 불리며 peer HDLC entity에게 response frame을 요구하는 poll 의미가 강하다. response frame에서는 `F bit`로 불리며 soliciting command에 대한 응답임을 나타낸다. 기본 I/S-frame control field는 3-bit sequence number를 사용하고, set-mode command로 extended control field를 선택하면 7-bit sequence number를 사용할 수 있다. U-frame은 항상 8-bit control field를 사용한다.

#### HDLC Commands and Responses

Table 7.1의 세부 명령을 모두 암기하기보다, 동작 흐름과 연결되는 명령을 우선 기억하면 좋다.

| 분류 | 이름 | Command/Response | 의미 |
| --- | --- | --- | --- |
| Information | `I` | C/R | user data exchange |
| Supervisory | `RR` | C/R | positive acknowledgment, I-frame 수신 준비 |
| Supervisory | `RNR` | C/R | positive acknowledgment이지만 당장은 추가 I-frame 수신 불가 |
| Supervisory | `REJ` | C/R | negative acknowledgment, go-back-N 재전송 요구 |
| Supervisory | `SREJ` | C/R | negative acknowledgment, selective reject 재전송 요구 |
| Unnumbered | `SNRM/SNRME`, `SARM/SARME`, `SABM/SABME` | C | mode 설정, extended는 7-bit sequence number 사용 |
| Unnumbered | `DISC` | C | logical link connection 종료 |
| Unnumbered | `UA` | R | set-mode 또는 disconnect 수락 |
| Unnumbered | `DM` | R | disconnected mode 상태 또는 요청 거절 |
| Unnumbered | `RSET` | C | recovery용 reset, `N(R)`, `N(S)` 재설정 |
| Unnumbered | `FRMR` | R | unacceptable frame 수신 보고 |

#### HDLC Operation: Initialization, Data Transfer, Disconnect

HDLC operation은 세 phase로 이해하면 된다.

| phase | 핵심 절차 |
| --- | --- |
| `Initialization` | 한쪽이 set-mode command를 보내 data link 초기화를 요청한다. 이 command는 mode(NRM/ABM/ARM)와 sequence number 길이(3-bit/7-bit)를 지정한다. 상대가 수락하면 `UA`, 거절하면 `DM`을 보낸다. |
| `Data Transfer` | logical connection이 세워진 뒤 양쪽은 sequence number 0부터 I-frame을 보낸다. `N(S)`는 send sequence number, `N(R)`는 다음에 기대하는 receive sequence number로 ACK 역할을 한다. |
| `Disconnect` | 어느 HDLC module이든 fault 또는 higher-layer 요청으로 `DISC`를 보내 disconnect를 시작할 수 있다. 상대는 `UA`로 수락하고 layer 3 user에게 종료를 알린다. outstanding unacknowledged I-frame의 복구는 higher layer 책임이 될 수 있다. |

Data transfer 중에는 I-frame과 S-frame이 앞 절의 flow/error control을 구현한다. `RR`은 다음 expected I-frame 번호를 알려 positive ACK를 수행한다. `RNR`은 ACK와 동시에 peer에게 I-frame 전송을 멈추라고 요구한다. 이후 ready 상태가 되면 `RR`을 보내 window를 다시 연다. `REJ`는 `N(R)`부터 모든 I-frame 재전송을 요구하는 go-back-N ARQ이고, `SREJ`는 특정 single frame의 재전송만 요구한다.

![Figure 7.9](@/assets/images/data-communication-hdlc-operation-examples-figure-7-9.png)
*Figure 7.9 · PDF p. 246 · HDLC setup, data exchange, busy condition, recovery 예시*

Figure 7.9의 각 subfigure는 HDLC의 행동 패턴을 압축해서 보여준다.

| subfigure | 상황 | 핵심 해석 |
| --- | --- | --- |
| Figure 7.9a | link setup and disconnect | `SABM` 후 timer를 시작하고, 상대가 `UA`를 보내면 logical connection이 active가 된다. `DISC`는 `UA`로 수락된다. |
| Figure 7.9b | two-way data exchange | I-frame의 `N(S)`는 자신이 보내는 sequence, `N(R)`는 상대에게 보내는 cumulative ACK다. 새 ACK가 없으면 receive sequence number가 반복될 수 있다. |
| Figure 7.9c | busy condition | buffer나 higher-layer 처리 지연 때문에 `RNR`로 incoming I-frame을 멈춘다. 상대는 `P bit`가 있는 `RR`로 주기적으로 poll하고, busy가 끝나면 `RR`로 재개한다. |
| Figure 7.9d | reject recovery | frame 4가 lost/error이면 B가 out-of-order frame 5를 버리고 `REJ 4`를 보내며, A는 frame 4부터 재전송한다. |
| Figure 7.9e | timeout recovery | damaged frame을 receiver가 frame으로 신뢰할 수 없으면 REJ도 못 보낼 수 있다. sender timer 만료 후 `P bit`가 있는 `RR`로 상대 상태를 묻고, `N(R)` 응답을 보고 lost frame을 재전송한다. |

### 7.3 HDLC: 정리 포인트

HDLC는 “frame format + sequence/acknowledgment numbering + ARQ supervisory frames + link management U-frames”의 조합이다. `I-frame`은 data와 ACK를 piggyback하고, `S-frame`은 data 없이 flow/error control을 수행하며, `U-frame`은 mode 설정과 연결 관리를 맡는다. 따라서 HDLC를 이해할 때는 command 이름만 외우기보다, 각 frame이 앞 절의 `sliding-window`, `RR/RNR`, `REJ/SREJ`, `timeout`, `poll/final` 메커니즘 중 무엇을 구현하는지 연결해야 한다.

## 성능 관점: Appendix 7A Performance Issues

### Stop-and-Wait Utilization

Appendix 7A는 `sliding-window flow control`을 왜 쓰는지 수식으로 확인한다. 먼저 half-duplex point-to-point line에서 stop-and-wait를 생각한다. 긴 message를 frame `F1, F2, ..., Fn`으로 나누어 보내고, 각 frame 뒤에 ACK를 받는다고 하자.

frame 하나를 보내고 ACK를 받을 때까지의 시간은 다음 요소로 구성된다.

$$
T_F = t_{prop} + t_{frame} + t_{proc} + t_{prop} + t_{ack} + t_{proc}
$$

processing time과 ACK transmission time이 data frame에 비해 작다고 보면,

$$
T \approx n(2t_{prop} + t_{frame})
$$

실제로 data frame을 밀어 넣는 데 쓴 시간은 `n * t_frame`뿐이므로 maximum utilization은 다음과 같다.

$$
U = \frac{t_{frame}}{2t_{prop} + t_{frame}}
$$

여기서

$$
a = \frac{t_{prop}}{t_{frame}}
$$

라고 두면 stop-and-wait의 최대 utilization은

$$
U = \frac{1}{1 + 2a}
$$

이 된다. 이 식은 Chapter 7 앞부분의 Figure 7.2를 수식으로 다시 읽은 것이다. `a`가 커질수록 sender가 ACK를 기다리는 시간이 길어지고, utilization은 빠르게 떨어진다.

`a`는 다음처럼도 쓸 수 있다.

$$
a = \frac{d/V}{L/R} = \frac{Rd}{VL}
$$

따라서 fixed-length frame에서 `a`는 data rate `R`과 link distance `d`에 비례하고, propagation velocity `V`와 frame length `L`에 반비례한다. 직관적으로는 `bandwidth-delay product`를 frame length와 비교한 값이다.

Example 7.6의 결론은 시험용으로도 중요하다. 1000 km optical fiber WAN에서 ATM cell size 424 bits, 155.52 Mbps라면 transmission time은 매우 짧고 propagation time은 상대적으로 길어 `a ≈ 1850`, stop-and-wait utilization은 약 `0.00027`로 거의 쓸 수 없는 수준이다. 반면 10 Mbps LAN에서 1000-bit frame과 짧은 거리라면 `a`가 0.005-0.5 범위라 utilization이 0.5-0.99까지 가능하다. 즉 stop-and-wait의 효율은 protocol 자체보다도 link의 rate-distance-frame-size 조합에 크게 좌우된다.

### Error-Free Sliding-Window Utilization

sliding-window에서는 throughput이 `a`뿐 아니라 window size `W`에도 의존한다. frame transmission time을 1로 정규화하면 propagation time은 `a`다. A가 frame 1을 보낸 뒤, 그 ACK가 A로 돌아오는 시점은 대략 `2a + 1`이다. 이때 두 경우가 생긴다.

| 조건 | 의미 | utilization |
| --- | --- | --- |
| `W >= 2a + 1` | 첫 frame의 ACK가 돌아오기 전에 sender window가 고갈되지 않는다. 계속 전송 가능하다. | `U = 1` |
| `W < 2a + 1` | sender가 window를 다 써서 ACK가 오기 전까지 멈춘다. | `U = W / (2a + 1)` |

따라서 error-free sliding-window utilization은 다음처럼 쓸 수 있다.

$$
U =
\begin{cases}
1, & W \ge 2a + 1 \\
\frac{W}{2a + 1}, & W < 2a + 1
\end{cases}
$$

Figure 7.11은 이 타이밍을 보여준다. `W`가 충분히 크면 ACK가 도착하기 전에 sender가 보낼 frame이 계속 남아 있어 line이 비지 않는다. `W`가 작으면 sender가 window를 모두 소진한 뒤 `2a + 1` 시점까지 기다리게 된다.

![Figure 7.11](@/assets/images/data-communication-sliding-window-timing-figure-7-11.png)
*Figure 7.11 · PDF p. 254 · sliding-window에서 W와 2a+1의 타이밍 관계*

Figure 7.12는 window size가 1, 7, 127일 때 `a`에 따른 utilization 변화를 보여준다. `W = 1`은 stop-and-wait와 같고, `W = 7`은 3-bit sequence number에서 흔한 최대 window이며, `W = 127`은 7-bit sequence number에서 큰 `a`를 가진 high-speed WAN에 더 적합하다.

![Figure 7.12](@/assets/images/data-communication-sliding-window-utilization-figure-7-12.png)
*Figure 7.12 · PDF p. 255 · a와 window size에 따른 sliding-window utilization*

### ARQ Utilization with Error Probability

Appendix 7A는 error probability `P`가 있을 때 ARQ utilization도 근사한다. `P`는 single frame이 error일 확률이고, ACK/NAK error는 무시한다고 가정한다. frame 하나가 성공할 때까지 필요한 expected transmission count는

$$
N_r = \frac{1}{1-P}
$$

이다.

`stop-and-wait ARQ`는 error-free utilization을 이 expected retransmission factor로 나눈 형태가 된다.

$$
U = \frac{1-P}{1 + 2a}
$$

`selective-reject ARQ`는 오류 frame만 재전송하므로 같은 직관을 sliding-window 식에 적용한다.

$$
U =
\begin{cases}
1-P, & W \ge 2a + 1 \\
\frac{W(1-P)}{2a + 1}, & W < 2a + 1
\end{cases}
$$

`go-back-N ARQ`는 오류 하나가 frame 하나만이 아니라 대략 `K`개 frame 재전송을 유발하므로 selective-reject보다 불리하다. window가 충분히 크면 `K ≈ 2a + 1`, window가 작으면 `K = W`로 근사한다. 그래서 `P`가 작아도 `a`가 크고 `W`가 큰 환경에서는 go-back-N의 낭비가 커질 수 있다.

Figure 7.13은 `P = 10^-3`에서 stop-and-wait, go-back-N, selective-reject를 비교한다. 결론은 다음과 같다.

| 상황 | 적합한 해석 |
| --- | --- |
| `W = 1` | go-back-N과 selective-reject 모두 stop-and-wait로 축소된다. |
| 작은 `a` | propagation delay가 작으므로 단순 방식도 비교적 괜찮다. |
| 큰 `a`, 충분한 `W` | sliding-window가 stop-and-wait보다 압도적으로 유리하다. |
| 큰 `a`, error 존재 | selective-reject는 필요한 frame만 재전송하므로 go-back-N보다 유리하지만 구현 복잡도가 증가한다. |

## 연결 관계

이 장은 Chapter 6의 physical layer 전송 위에 실제 link protocol이 필요한 이유를 붙인다. Chapter 6에서 배운 synchronous frame, error detection, CRC 개념은 여기서 `frame synchronization`, `FCS`, `ARQ`로 사용된다. 반대로 이후 LAN, WAN, packet switching, transport protocol을 볼 때는 HDLC식 `sliding-window`, `sequence number`, `acknowledgment`, `flow control`, `error control`이 반복해서 등장한다. 예를 들어 TCP의 ACK/window 개념은 layer와 세부 목적은 다르지만, “보낸 것과 받은 것을 번호로 추적하고 window로 흐름을 제한한다”는 사고방식은 이 장과 연결된다.

## 오해하기 쉬운 내용

| 오해 | 바로잡기 |
| --- | --- |
| `flow control`과 `error control`은 같은 것이다. | flow control은 receiver buffer overflow 방지, error control은 lost/damaged frame 복구가 목적이다. 실제 protocol에서는 같은 sequence/ACK/window field를 공유할 뿐 목적은 다르다. |
| stop-and-wait는 항상 비효율적이다. | `a`가 작고 message가 몇 개의 큰 frame으로 끝나면 단순하고 충분할 수 있다. 비효율은 high data rate, long distance, small frame에서 심해진다. |
| ACK number는 마지막으로 받은 frame 번호다. | 이 장의 sliding-window/HDLC 관례에서는 보통 “다음에 기대하는 frame 번호”다. `RR 5`는 frame 4까지 받았다는 cumulative ACK다. |
| sequence number가 `k` bits면 window size를 항상 `2^k`로 잡을 수 있다. | go-back-N에서는 ambiguity를 피하려고 최대 `2^k - 1`, selective-reject에서는 receive/send window overlap을 피하려고 최대 `2^(k-1)` 이하가 필요하다. |
| `RNR`은 error를 뜻한다. | `RNR (Receive Not Ready)`는 오류가 아니라 receiver가 현재 추가 I-frame을 받을 수 없다는 flow control 신호다. |
| `REJ`와 `SREJ`는 같은 재전송이다. | `REJ`는 go-back-N으로 `N(R)`부터 이후 frame들을 재전송하게 하고, `SREJ`는 특정 frame 하나만 재전송하게 한다. |
| bit stuffing은 data를 바꾸므로 transparency를 해친다. | transmitter가 삽입한 stuffed 0은 receiver가 제거한다. 따라서 상위 계층 data에는 arbitrary bit pattern을 유지할 수 있어 오히려 `data transparency`를 제공한다. |

## 핵심 용어

`data link`, `data link control protocol`, `frame`, `frame synchronization`, `data frame`, `acknowledgment frame`, `flow control`, `stop-and-wait flow control`, `sliding-window flow control`, `piggybacking`, `error control`, `automatic repeat request (ARQ)`, `stop-and-wait ARQ`, `go-back-N ARQ`, `selective-reject ARQ`, `RR`, `RNR`, `REJ`, `SREJ`, `HDLC`, `High-Level Data Link Control`, `primary station`, `secondary station`, `combined station`, `unbalanced configuration`, `balanced configuration`, `NRM`, `ABM`, `ARM`, `flag field`, `address field`, `control field`, `information field`, `FCS`, `header`, `trailer`, `bit stuffing`, `data transparency`, `I-frame`, `S-frame`, `U-frame`, `P/F bit`, `N(S)`, `N(R)`, `SABM`, `SABME`, `DISC`, `UA`, `DM`, `RSET`, `FRMR`, `utilization`, `bandwidth-delay product`, `a = tprop/tframe`, `window size W`, `error probability P`

## 면접 질문

1. `flow control`과 `error control`의 목적을 구분하고, sliding-window protocol에서 둘이 어떤 field를 공유하는지 설명하라.
2. `a = tprop/tframe`가 큰 링크에서 stop-and-wait utilization이 왜 나빠지는지 `U = 1/(1+2a)`로 설명하라.
3. `RR 5`가 의미하는 바를 cumulative acknowledgment 관점에서 설명하라.
4. go-back-N ARQ와 selective-reject ARQ의 재전송 범위, receiver buffer 요구사항, 적합한 링크 환경을 비교하라.
5. HDLC의 `I-frame`, `S-frame`, `U-frame`이 각각 어떤 역할을 맡는지 설명하라.
6. HDLC에서 `bit stuffing`이 필요한 이유와 receiver가 stuffed bit, flag, abort를 구분하는 규칙을 설명하라.
7. `P/F bit`가 command frame과 response frame에서 각각 어떤 의미로 해석되는지 설명하라.
8. selective-reject ARQ에서 maximum window size가 sequence number range의 절반 이하로 제한되는 이유를 예로 설명하라.
