---
title: "TCP Congestion Control"
order: 16
pubDatetime: 2026-05-17T00:00:00+09:00
modDatetime: 2026-05-17T00:00:00+09:00
description: "TCP/IP Illustrated 정리: TCP Congestion Control"
tags:
  - "ComputerNetwork"
  - "CS"
  - "TCPIP"
---

## 개요

TCP congestion control은 여러 sender가 network path에 너무 많은 aggregate offered load를 밀어 넣어 router/switch queue가 감당하지 못하는 상황을 피하거나 완화하기 위한 TCP sender 측 알고리즘 집합이다. Chapter 15의 flow control이 receiver buffer를 넘치지 않게 하는 문제였다면, Chapter 16의 congestion control은 sender와 receiver 사이의 network path, 특히 bottleneck link와 router queue를 넘치지 않게 하는 문제다.

Router가 장기적으로 내보낼 수 있는 departure rate보다 더 높은 arrival rate를 계속 받으면 queue는 언젠가 꽉 차고 packet을 drop해야 한다. 이 상태가 congestion이며, 심하면 retransmission이 다시 congestion을 키우는 congestion collapse로 간다. TCP는 reliable delivery 때문에 loss를 retransmit해야 하지만, congestion collapse 상황에서 모든 TCP가 loss를 보고 더 많이 retransmit하면 불난 데 기름을 붓는 꼴이 된다. 그래서 TCP는 loss를 복구하는 동시에 sender rate를 줄여야 한다.

## 핵심 개념

### 16.1 Introduction

Congestion control의 핵심 질문은 세 가지다.

- TCP sender가 network congestion을 언제 감지할 것인가?
- 감지한 뒤 얼마나, 어떤 방식으로 slow down할 것인가?
- congestion이 줄었을 때 언제, 얼마나 speed up할 것인가?

전통적인 Internet에서는 intermediate router가 TCP sender에게 “지금 congestion임”을 직접 알려주는 명시적 signal이 없었다. 그래서 classic TCP는 packet loss를 congestion indicator로 해석한다. loss는 retransmission timeout(RTO)이나 fast retransmit으로 감지할 수 있다. 다만 wired network에서는 loss가 주로 queue overflow/congestion을 뜻하지만, wireless network에서는 transmission error도 중요한 loss 원인이므로 “loss = congestion” 가정이 항상 정확하지는 않다. 뒤에서 다루는 delay-based congestion control과 Explicit Congestion Notification(ECN)은 packet drop 전에 congestion을 감지하려는 대안이다.

### 16.1.1 Detection of Congestion in TCP

TCP가 loss를 감지하는 방법은 Chapter 14의 timer, ACK, duplicate ACK, SACK 기반 retransmission과 이어진다. 이 장의 초점은 “잃어버린 packet을 어떻게 다시 보내는가”보다 “loss를 congestion signal로 해석한 뒤 sender가 어떻게 window를 줄이고 다시 키우는가”다.

Classic TCP가 사용하는 가장 중요한 전제는 다음과 같다.

```text
packet loss observed by TCP sender
=> congestion probably occurred
=> sender must reduce sending rate
```

이 전제는 단순하지만, Internet에서 TCP들이 서로 양보하며 공유 bottleneck을 쓰게 만든 출발점이다. 문제는 network 상태가 explicit하게 보이지 않으므로, sender가 적절한 rate를 경험적으로 찾아야 한다는 점이다.

### 16.1.2 Slowing Down a TCP Sender

TCP sender를 늦추는 핵심 변수는 congestion window(`cwnd`)다. Chapter 15의 advertised window(`awnd`)는 receiver가 “내 buffer에 이만큼 받을 수 있다”고 알려주는 값이고, `cwnd`는 sender가 추정한 network capacity에 기반한 제한이다. 실제 sender usable window `W`는 둘 중 작은 값이다.

```text
W = min(cwnd, awnd)
flight size <= W
```

`flight size`는 sender가 network에 넣었지만 아직 ACK 받지 못한 data 양이다. TCP sender는 `flight size`가 `W`를 넘지 않도록 한다. SACK을 쓰지 않는 TCP에서는 highest acknowledged sequence number + `W`를 넘는 segment를 보낼 수 없다는 식으로 이해할 수 있고, SACK TCP에서는 `W`가 전체 flight size 제한으로 쓰인다.

좋은 `cwnd` 값은 path의 bandwidth-delay product(BDP), 즉 optimal window size에 가깝다.

```text
BDP = bottleneck bandwidth * RTT
```

`cwnd`가 BDP보다 너무 작으면 path capacity를 못 채워 throughput이 낮다. 반대로 BDP보다 크게 초과하면 router queue에 data가 쌓여 delay가 커지고 buffer bloat 같은 문제가 생긴다. 하지만 Internet path는 route, RTT, bottleneck capacity, statistical multiplexing 정도가 계속 변하므로 sender는 BDP를 정확히 알 수 없다. 따라서 TCP congestion control은 ACK/loss/delay/ECN 같은 관찰 가능한 signal로 `cwnd`를 동적으로 조정한다.

### 16.2 The Classic Algorithms

새 TCP connection은 처음에 적절한 `cwnd`를 모른다. `awnd`는 receiver와의 packet exchange로 알 수 있지만, network capacity는 명시적으로 알 수 없다. 처음부터 `awnd`만큼 full rate로 보내면 같은 bottleneck을 공유하는 다른 TCP connection에 큰 피해를 줄 수 있으므로, TCP는 처음에는 조심스럽게 시작하고 steady state에서는 다른 알고리즘으로 운용한다.

TCP congestion control은 ACK receipt에 의해 clocked된다. steady state에서 ACK 하나가 sender에 도착했다는 것은 network 안에 있던 packet 하나 이상이 receiver에 도착했고, 그만큼 network 안에 새 packet을 넣을 기회가 생겼다는 뜻이다. 이것이 ACK clock 또는 self-clocking이다.

![Figure 16-1](@/assets/images/cs-tcp-ip-illustrated-286-figure-16-1-page-770.png)
*Figure 16-1 · PDF p. 770 · packet conservation과 ACK clock이 sender 전송 타이밍을 만드는 구조*

Figure 16-1의 핵심은 conservation of packets다. Bottleneck link를 지나며 data packet은 시간적으로 벌어지고, receiver는 그 간격에 맞춰 ACK를 생성한다. ACK도 reverse path를 따라 sender에 도착하면서 비슷한 pacing signal을 제공한다. sender는 ACK arrival을 “새 packet을 넣어도 되는 시점”으로 사용하므로, steady state TCP는 network 자체가 clock을 제공하는 형태가 된다.

Classic TCP의 두 축은 slow start와 congestion avoidance다. 둘은 동시에 실행되는 것이 아니라, TCP가 현재 상태와 threshold에 따라 하나를 선택해 실행한다. Slow start는 connection 시작이나 RTO 이후처럼 `cwnd`를 다시 찾아야 할 때 ACK clock을 세우고 가용 capacity를 빠르게 탐색한다. Congestion avoidance는 steady state에서 더 조심스럽게 bandwidth를 probing한다.

### 16.2.1 Slow Start

Slow start는 이름과 달리 매우 빠른 exponential growth 알고리즘이다. “처음부터 full window로 보내지 않는다”는 의미에서 slow일 뿐이다. 새 connection, RTO로 loss가 감지된 뒤, 또는 sender가 오래 idle 상태였던 뒤에 실행될 수 있다.

TCP는 initial window(`IW`)만큼 시작한다. 과거에는 `IW = 1 SMSS`였고, RFC5681에서는 SMSS 크기에 따라 2-4 segments까지 허용한다. 단순화를 위해 `cwnd = 1 SMSS`로 시작한다고 보면, 첫 segment의 ACK가 돌아올 때 `cwnd`가 증가하고 다음 RTT에는 더 많은 segment를 보낸다.

Slow start에서 sender는 good ACK를 받을 때마다 `cwnd`를 증가시킨다. good ACK는 지금까지 본 것보다 더 높은 ACK number를 반환하는 ACK다. Appropriate Byte Counting(ABC)을 고려하면 증가량은 `min(N, SMSS)`이며, `N`은 해당 ACK가 새로 ACK한 byte 수다. ABC는 ACK division attack처럼 많은 작은 ACK로 sender를 부당하게 빠르게 만들려는 공격을 완화하는 목적도 있다.

ACK가 매 packet마다 온다고 가정하면 `cwnd`는 RTT마다 대략 1, 2, 4, 8 ...로 증가한다.

```text
W after k RTTs ~= 2^k
k ~= log2(W)
```

Delayed ACK로 두 packet마다 ACK 하나가 오면 증가 속도는 여전히 exponential이지만 더 느려진다. 일부 TCP가 slow start 동안 quick acknowledgments(quickack mode)를 쓰는 이유도 ACK clock을 더 촘촘히 세워 slow start 진행을 원활히 하기 위해서다.

![Figure 16-2](@/assets/images/cs-tcp-ip-illustrated-287-figure-16-2-page-773.png)
*Figure 16-2 · PDF p. 773 · slow start에서 ACK마다 전송 가능량이 늘어 exponential growth가 생기는 구조*

Slow start가 너무 커진 `cwnd`로 network를 압박해 packet loss를 만나면, TCP는 `cwnd`를 크게 줄이고 slow start threshold(`ssthresh`)를 기준으로 다음 단계인 congestion avoidance로 넘어간다. `ssthresh`는 loss가 없던 마지막 operating window에 대한 TCP의 기억, 즉 optimal window size에 대한 lower bound 추정값처럼 동작한다.

### 16.2.2 Congestion Avoidance

Congestion avoidance는 이미 어느 정도 `cwnd`가 잡힌 뒤, 새로 생긴 network capacity를 너무 공격적으로 쓰지 않으면서 탐색하는 알고리즘이다. Slow start가 RTT마다 window를 대략 두 배로 키운다면, congestion avoidance는 window 하나 분량의 data가 성공적으로 전달될 때마다 `cwnd`를 약 1 SMSS 키운다. 그래서 시간에 대해 거의 linear growth를 보인다.

각 nonduplicate ACK에 대한 대표 update는 다음과 같다.

```text
cwnd(t+1) = cwnd(t) + SMSS * SMSS / cwnd(t)
```

예를 들어 `cwnd = k * SMSS`라면 ACK 하나가 올 때마다 증가량은 대략 `(1/k) * SMSS`다. 한 RTT 동안 k개의 ACK가 오면 전체적으로 약 1 SMSS 증가한다. 이 때문에 congestion avoidance는 additive increase라고도 부른다.

![Figure 16-3](@/assets/images/cs-tcp-ip-illustrated-288-figure-16-3-page-774.png)
*Figure 16-3 · PDF p. 774 · congestion avoidance에서 ACK마다 작은 비율로 증가해 linear growth가 되는 흐름*

Congestion avoidance는 packet loss가 congestion을 뜻한다는 가정에 의존한다. wired network에서는 대체로 맞지만, wireless error가 loss를 만드는 환경에서는 congestion이 아닌데도 TCP가 `cwnd`를 줄여 throughput을 잃을 수 있다. 또한 high-capacity/high-BDP network에서는 linear increase가 너무 느려 큰 `cwnd`까지 도달하는 데 많은 RTT가 필요하다. 이 한계가 뒤의 HSTCP, BIC, CUBIC, delay-based 방식이 등장한 배경이다.

### 16.2.3 Selecting between Slow Start and Congestion Avoidance

TCP는 정상 동작 중 slow start 또는 congestion avoidance 중 하나만 실행한다. 선택 기준은 `cwnd`와 `ssthresh`의 관계다.

| 조건 | 실행 알고리즘 |
|---|---|
| `cwnd < ssthresh` | slow start |
| `cwnd > ssthresh` | congestion avoidance |
| `cwnd == ssthresh` | 구현에 따라 둘 중 하나 가능 |

`ssthresh`는 고정값이 아니라 loss event에 따라 변한다. retransmission timeout이나 fast retransmit이 필요해지면 TCP는 현재 operating window가 network에 너무 컸다고 보고 다음과 같이 threshold를 조정한다.

```text
ssthresh = max(flight size / 2, 2 * SMSS)
```

즉 TCP는 loss를 만나면 “직전 flight size의 절반 정도가 더 안전한 operating point”라고 추정한다. 이 값은 대개 낮아지지만, congestion avoidance가 오랫동안 성공적으로 window를 키운 뒤라면 이전보다 커질 수도 있다. `cwnd`와 `ssthresh`의 상호작용이 TCP의 sawtooth-like behavior를 만든다.

### 16.2.4 Tahoe, Reno, and Fast Recovery

Tahoe TCP는 loss를 timeout 또는 fast retransmit으로 감지하면 항상 `cwnd`를 시작값, 당시에는 보통 1 SMSS로 낮추고 slow start를 다시 시작했다. 이 방식은 congestion collapse를 막는 데는 효과적이지만, large BDP path에서는 loss 한 번에 bandwidth utilization이 크게 떨어지는 문제가 있다.

Reno TCP는 duplicate ACK로 loss를 감지해 fast retransmit이 가능한 경우 timeout보다 덜 과격하게 반응한다. `cwnd`를 1 SMSS까지 떨어뜨리는 대신 `ssthresh` 근처, 즉 이전 rate의 절반 수준으로 낮추고 fast recovery에 들어간다. Timeout은 여전히 더 심각한 신호로 보고 slow start를 재시작한다.

Fast recovery의 직관은 conservation of packets와 연결된다. Recovery 중에도 duplicate ACK가 도착한다는 것은 어떤 packet은 network를 빠져나가 receiver에 도착했다는 뜻이므로, sender는 그 ACK를 새 packet을 넣을 기회로 볼 수 있다. 그래서 Reno는 recovery 중 duplicate ACK마다 `cwnd`를 임시로 1 SMSS씩 inflate하고, good ACK가 오면 recovery를 종료하며 `cwnd`를 pre-inflated value인 `ssthresh`로 deflate한다.

### 16.2.5 Standard TCP

RFC5681 관점의 standard TCP는 slow start, congestion avoidance, fast retransmit, fast recovery를 묶은 baseline이다. 정확히 같은 구현을 강제한다기보다, 어떤 TCP implementation도 이 알고리즘보다 더 aggressive해서는 안 된다는 안전 기준을 제공한다.

Good ACK가 도착할 때의 기본 `cwnd` update는 다음처럼 요약된다.

```text
if cwnd < ssthresh:
    cwnd += SMSS                  # slow start
elif cwnd > ssthresh:
    cwnd += SMSS * SMSS / cwnd    # congestion avoidance
```

Third duplicate ACK 등으로 fast retransmit이 호출되면 baseline 동작은 다음과 같다.

1. `ssthresh`를 `max(flight size/2, 2*SMSS)` 이하로 갱신한다.
2. fast retransmit을 수행하고 `cwnd = ssthresh + 3*SMSS`로 둔다.
3. duplicate ACK마다 `cwnd += SMSS`로 temporary inflation을 계속한다.
4. good ACK가 오면 recovery가 끝났다고 보고 `cwnd = ssthresh`로 deflation한다.

여기서 `cwnd`를 대략 절반으로 줄이는 부분이 multiplicative decrease다. Congestion avoidance의 additive increase와 합쳐져 classic TCP의 AIMD(Additive Increase Multiplicative Decrease) 성격이 만들어진다.

Slow start는 새 connection과 RTO 뒤에는 항상 쓰인다. 오래 idle이었던 sender도 현재 `cwnd`가 network state를 더 이상 반영하지 못한다고 보고 restart window(`RW`)로 slow start를 다시 시작할 수 있다. RFC5681의 권장값은 `RW = min(IW, cwnd)`다.

### 16.3 Evolution of the Standard Algorithms

Classic TCP algorithms는 1986-1988년 무렵의 Internet congestion collapse 문제를 해결하는 데 결정적이었다. 당시의 핵심 문제는 loss 시 aggressive retransmission이 congestion을 더 키워 massive packet loss와 낮은 throughput을 만들었다는 점이다. Slow start, congestion avoidance, fast retransmit/recovery가 도입되면서 이 붕괴 양상은 크게 완화되었다. 이후의 알고리즘들은 “기본 안전성은 유지하면서 다양한 path와 loss pattern에서 성능을 더 좋게 만들기”에 초점을 둔다.

### 16.3.1 NewReno

Reno fast recovery의 약점은 한 window 안에서 여러 packet이 lost될 때 드러난다. 하나의 lost packet이 recover되어 ACK되면 sender는 good ACK를 보고 fast recovery의 temporary inflation을 지워버릴 수 있다. 그런데 아직 다른 lost packet이 남아 있으면, non-SACK TCP는 다시 fast retransmit을 트리거할 만큼 duplicate ACK가 충분히 생기지 않아 RTO까지 idle해질 수 있다. 이런 ACK를 partial ACK라고 한다.

NewReno는 fast recovery 중 `recovery point`를 기억한다. recovery point는 loss recovery에 들어갈 때 마지막으로 전송했던 window의 highest sequence number다. ACK number가 이 recovery point 이상이 될 때까지 fast recovery를 끝내지 않는다. 그래서 partial ACK를 받아도 recovery를 유지하고, ACK 하나당 segment 하나를 계속 보낼 수 있다. 결과적으로 single window 안의 multiple loss에서 Reno보다 timeout 가능성이 줄어든다.

NewReno는 SACK보다 단순하면서 original Reno의 partial ACK 문제를 상당히 줄인다. 하지만 receiver가 어떤 hole을 이미 받았는지 상세히 알려주는 SACK TCP는 multiple loss recovery에서 더 잘할 수 있다.

### 16.3.2 TCP Congestion Control with SACK

SACK(Selective Acknowledgment)을 사용하면 sender는 receiver의 out-of-order block과 missing hole 정보를 알 수 있다. 이 정보 덕분에 lost segment를 순서대로 더 정확히 retransmit할 수 있다. 그러나 SACK이 있다고 해서 모든 missing segment를 즉시 한꺼번에 보내면 congestion control을 깨뜨릴 수 있다.

SACK TCP의 핵심 교훈은 다음이다.

```text
which packets to send  !=  when packets may be sent
```

즉 retransmission selection, 곧 어떤 hole을 채울지는 SACK 정보로 결정하지만, 언제 얼마나 network에 더 넣을지는 congestion control로 제한해야 한다. Non-SACK TCP는 이 둘이 window 동작 안에 섞여 있었지만, SACK TCP는 분리해서 accounting해야 한다.

RFC3517 방식은 `pipe` variable로 network 안에 남아 있다고 추정되는 data 양, 즉 flight size를 별도로 추적한다. `pipe`는 lost로 알려지지 않은 original transmissions와 retransmissions를 포함한다. Sender는 다음 조건을 만족할 때 segment를 보낼 수 있다.

```text
cwnd - pipe >= SMSS
```

따라서 `cwnd`는 여전히 outstanding data의 상한이고, `pipe`가 실제 in-network data 추정치를 나타낸다. 이 구분이 SACK-based recovery의 핵심이다.

### 16.3.3 Forward Acknowledgment (FACK) and Rate Halving

Reno/NewReno 계열은 fast retransmit 직후 `cwnd`를 절반으로 줄이면, ACK가 현재 outstanding data의 절반 정도를 회수할 때까지 sender가 기다리는 pause가 생길 수 있다. 그러면 recovery RTT의 앞부분은 조용하고 뒤쪽에 burst가 몰리는 식으로 전송이 뭉친다. Burstiness는 router buffer에 불필요한 압력을 준다.

FACK(Forward Acknowledgment)은 SACK 정보를 이용해 receiver에 도달한 것으로 알려진 가장 높은 sequence number + 1을 추적한다. `SND.NXT - FACK`은 retransmission을 제외한 flight size 추정치가 된다. 이후 rate halving/RHBP(Rate-Halving with Bounding Parameters)는 recovery 중 duplicate ACK 두 개당 packet 하나를 보내는 식으로, recovery 기간 전체에 전송을 더 고르게 spread/pacing한다.

RHBP의 전송 허용 조건은 다음 관계로 표현된다.

```text
(SND.NXT - fack + retran_data + len) < cwnd
```

이 식은 retransmission까지 포함한 flight size에 새 packet 길이 `len`을 더해도 `cwnd`를 넘지 않는지 확인한다. 다만 FACK은 SACK hole을 lost로 해석하는 경향이 있어 packet reordering이 있는 path에서는 overly aggressive할 수 있다. 그래서 Linux도 reordering을 감지하면 FACK의 공격적 behavior를 비활성화한다.

### 16.3.4 Limited Transmit

Limited transmit은 usable window가 작을 때 fast retransmit이 아예 발동하지 못하는 문제를 완화한다. Fast retransmit은 보통 three duplicate ACKs가 필요하지만, window가 작으면 network 안 packet 수가 적어 duplicate ACK가 충분히 나오지 않는다. 그러면 sender는 RTO까지 기다려야 하고 throughput이 크게 떨어진다.

Limited transmit은 sender에게 unsent data가 있을 때, 연속 duplicate ACK 두 개 각각에 대해 새 packet을 하나 보낼 수 있게 한다. 목적은 최소한의 packet을 network에 유지해 세 번째 duplicate ACK와 fast retransmit이 가능하도록 돕는 것이다. RFC5681에서는 권장 동작이 되었고, rate halving도 넓은 의미에서 limited transmit의 한 형태로 볼 수 있다.

### 16.3.5 Congestion Window Validation (CWV)

`cwnd`는 최근 ACK feedback을 반영할 때 의미가 있다. Sender가 오래 idle하거나 application-limited 상태로 window를 충분히 쓰지 못하다가 갑자기 다시 보내면, 오래된 큰 `cwnd`가 현재 path 상태와 맞지 않을 수 있다. 그대로 쓰면 large burst를 network에 주입할 위험이 있다.

CWV(Congestion Window Validation)는 nonuse 기간 동안 `cwnd`를 decay시키고, `ssthresh`에는 이전 memory를 남겨두는 방식이다. 원문은 idle sender와 application-limited sender를 구분한다.

| 상태 | 의미 | CWV 동작 |
|---|---|---|
| idle sender | 보낼 data가 없고 이전 data의 ACK도 모두 받음 | idle RTT마다 `cwnd`를 절반으로 줄이되 최소 1 SMSS 유지 |
| application-limited sender | data는 더 있지만 CPU/하위 layer/다른 이유로 allowed window를 다 못 씀 | 실제 사용한 window `W_used`와 `cwnd` 평균 쪽으로 줄임 |

두 경우 모두 `ssthresh = max(ssthresh, 3/4*cwnd)` 형태로 줄이지 않고 memory를 보존한다. 충분히 긴 pause 뒤에는 `cwnd`가 작아져 sender가 slow start에 들어갈 수 있고, 이는 idle 뒤 burst를 줄여 router buffer pressure와 packet drop을 완화한다.

### 16.4 Handling Spurious RTOs: Eifel Response Algorithm

Spurious RTO는 packet이 실제로 lost되지 않았는데 delay spike 때문에 retransmission timeout이 발생하는 상황이다. Cellular handoff, link-layer 변화, 갑작스러운 RTT 증가, severe congestion으로 인한 delay spike 등이 원인이 될 수 있다. TCP는 RTO가 나면 보수적으로 `ssthresh`를 낮추고 `cwnd = IW`로 slow start에 들어가지만, loss가 없었다면 이 반응은 지나치게 보수적이다.

Eifel Response Algorithm은 DSACK, Eifel Detection, F-RTO 같은 spurious retransmission detection과 결합해 RTO 뒤 congestion control state 변화를 undo하는 response algorithm이다. Eifel은 detection과 response를 논리적으로 분리한다.

RTO 때문에 `ssthresh`를 바꾸기 전에 TCP는 다음 값을 저장한다.

```text
pipe_prev = min(flight size, ssthresh)
```

이후 detection algorithm이 RTO가 spurious였다고 판단하면 ACK 도착 시 다음을 수행한다.

1. good ACK에 ECN-Echo flag가 있으면 undo하지 않고 중단한다.
2. `cwnd = flight size + min(bytes_acked, IW)`로 복원한다.
3. `ssthresh = pipe_prev`로 RTO 이전 threshold memory를 되살린다.

ECN-Echo가 있으면 실제 congestion signal일 수 있으므로 reduction을 되돌리는 것이 안전하지 않다. ECN이 없다면 `cwnd`는 다시 traffic을 조금 넣을 수 있는 수준으로 복원하되, unknown congestion state에서 안전한 양인 `IW` 이상 새 data를 과하게 넣지 않도록 제한한다.

### 16.5 An Extended Example: Setup

이 장의 extended example은 Linux 2.6 sender가 FreeBSD 5.4 receiver로 약 2.5MB를 DSL line을 통해 upload하는 trace다. Sender 쪽 DSL 방향은 약 300Kb/s로 rate-limited되어 있고, minimum RTT는 약 15.9ms, path는 17 hops다. Receiver는 충분한 receive buffer와 큰 application read를 사용하므로, 주된 병목은 receiver flow control이 아니라 network/congestion control 동작이다.

tcptrace summary에서 sender는 총 2,621,440 unique bytes를 보냈고, retransmitted data는 37,800 bytes, 27 retransmitted packets였다. 전체 전송 시간은 약 100.476s이고 average goodput은 약 26,090 B/s, 약 209Kb/s다. 이 숫자는 이후 Figure 16-4 이후의 time-sequence graph에서 slow start, local congestion, SACK recovery, timeout, undo 같은 사건을 해석하는 기준이 된다.

![Figure 16-4](@/assets/images/cs-tcp-ip-illustrated-289-figure-16-4-page-787.png)
*Figure 16-4 · PDF p. 787 · 2.5MB upload trace에서 sequence progress, receiver window, ACK progress, 11개 congestion event를 함께 표시한 그래프*

Figure 16-4의 y-axis는 relative TCP sequence number, x-axis는 time이다. 짙은 선은 sender가 보낸 sequence range를 나타내고, 아래 선은 sender가 지금까지 본 highest ACK, 위 선은 receiver가 accept할 수 있는 highest advertised window edge다. 짙은 선의 slope는 특정 시간 구간의 achieved data rate를 뜻한다. 선이 lower right로 움직이면 retransmission이 있었다는 신호다.

이 그림을 읽는 기본 규칙은 간단하다.

- 짙은 선이 아래 ACK line에서 위 receiver window line 쪽으로 접근하면 sender가 window와 capacity를 probing하고 있다.
- 위 receiver window line에 계속 닿으면 receiver window가 bottleneck일 가능성이 높다.
- 위 line에 닿지 못하면 sender 또는 network usable capacity가 bottleneck일 가능성이 높다.
- slope가 급하면 순간 sending/goodput rate가 높고, slope가 완만해지면 congestion response나 pause로 rate가 낮아진 것이다.

### 16.5.1 Slow Start Behavior

Figure 16-5의 초기 flow graph는 실제 trace에서 slow start가 어떻게 보이는지 보여준다. 첫 data packet 두 개가 전송되고, receiver는 delayed ACK 성격으로 두 packet을 cumulative ACK 하나로 ACK한다. 이 ACK는 sender sliding window를 두 packet만큼 앞으로 밀고, slow start 때문에 `cwnd`도 증가시킨다. 그래서 ACK 하나가 새 packet 두세 개를 “liberate”하는 것처럼 보인다.

이 receiver는 ACK를 매 packet마다 보내지 않고, 한 packet 또는 두 packet 단위로 번갈아 ACK한다. 평균적으로 data packet 3개마다 ACK 2개가 돌아오는 셈이다. 따라서 slow start의 exponential growth는 유지되지만, ACK every packet인 이상적인 그림보다 약간 덜 촘촘하게 진행된다.

### 16.5.2 Sender Pause and Local Congestion (Event 1)

Figure 16-4에서 time 5.512 근처에 sender pause가 생기고 time 6.162 이후 burst가 다시 나온다. Figure 16-6은 이 pause를 확대해서 보여주고, Figure 16-7은 flow trace로 sender가 time 5.559에 사실상 sending demand를 멈췄다는 점을 보여준다. 마지막 segment에 PSH flag가 켜져 있어 sending buffer가 비었을 가능성이 있다.

흥미로운 점은 retransmission recovery가 아닌데도 pause 뒤 slope가 낮아진다는 것이다. Pause 직전 outstanding data는 약 137,200 bytes, 즉 98 packets였고 `cwnd`도 98 packets로 볼 수 있다. Pause 동안 11개 ACK가 도착해 outstanding data가 79 packets까지 줄었다. Sender가 다시 깨어났다면 98 - 79 = 19 packets를 보낼 수 있을 것 같지만 실제로는 8 packets만 보낸다.

원인은 local congestion이다. Linux sender가 lower-layer queue를 burst로 채웠고, TCP 아래 layer에서 packet drop/queue limit이 발생했다. 이 packet transmission attempt는 tcpdump capture 위치보다 아래/위 layer 차이 때문에 trace에는 직접 보이지 않는다. 즉 network core에서 drop된 것이 아니라 sender host 내부 local queue가 bottleneck이 된 것이다.

Linux TCP는 이런 local congestion을 감지하면 Congestion Window Reducing(CWR) state에 들어갈 수 있다. 이 예시에서는 `ssthresh = cwnd/2 = 49 packets`로 줄이고, `cwnd = min(cwnd, flight size + sent burst)`에 해당하는 식으로 87 packets 근처로 낮춘 뒤, ACK 두 개당 `cwnd`를 1 packet 줄이는 rate-halving식 동작을 한다. 그래서 time 8.364 근처까지 `cwnd`가 66 packets로 내려가며 sending rate가 줄어든다.

![Figure 16-8](@/assets/images/cs-tcp-ip-illustrated-293-figure-16-8-page-793.png)
*Figure 16-8 · PDF p. 793 · sender rate가 path forwarding rate를 넘으면 queue가 차 RTT가 증가하고, sender가 느려지면 queue가 비며 RTT가 감소하는 흐름*

Figure 16-8은 local congestion 이후 RTT가 어떻게 변하는지 보여준다. Sender가 bottleneck capacity보다 빠르게 보내면 router queue가 차서 RTT가 증가한다. Sender가 CWR state에서 rate를 낮추면 network에서 data가 빠져나가는 속도가 새로 들어오는 속도보다 커지고, queue가 drain되며 RTT가 내려간다. 다만 TCP는 “pipe를 비우는 것” 자체가 목표가 아니라 “pipe를 full로 유지하되 queue를 과도하게 채우지 않는 것”이 목표다.

### 16.5.3 Stretch ACKs and Recovery from Local Congestion

Figure 16-9의 stretch ACK는 한 ACK가 세 packet 분량의 sequence number를 한 번에 ACK하는 사건이다. Lost ACK, ACK coalescing, receiver behavior 등 원인은 여러 가지일 수 있지만, sender 입장에서는 flight size estimate가 갑자기 줄어들 수 있다. CWR state에서 Linux TCP는 `cwnd`와 flight size estimate를 강하게 맞추므로, stretch ACK 이후 `cwnd`가 68에서 66으로 내려간다.

CWR state에서 delayed ACK가 섞이면 “두 ACK가 도착하면 `cwnd`는 2 packets 줄고, ACKed packet은 3개라 결과적으로 packet 하나만 liberate”되는 식의 동작이 나온다. Sender는 time 9.37 근처에 `cwnd == ssthresh == 49`가 되며 CWR을 빠져나와 normal congestion avoidance로 돌아간다. Figure 16-10과 Figure 16-11은 이때 sender가 다시 ACK당 한두 packet을 보내는 정상 동작으로 복귀했음을 보여준다.

이후 time 17.232부터 severe network congestion이 형성되고 RTT가 약 2s에서 6.5s 수준까지 크게 증가한다. RTT 증가는 queue가 많이 찼다는 강한 힌트이고, 결국 packet drop과 첫 retransmission으로 이어진다.

### 16.5.4 Fast Retransmission and SACK Recovery (Event 2)

첫 fast retransmission은 time 21.209에 발생한다. ACK number는 690201에 머물러 있고, duplicate ACK 하나가 SACK block `[698601,700001]`을 싣고 와서 receiver가 뒤쪽 한 packet을 이미 받았음을 알려준다. 이때 sender는 sequence 690201부터의 packet을 retransmit한다.

![Figure 16-12](@/assets/images/cs-tcp-ip-illustrated-297-figure-16-12-page-797.png)
*Figure 16-12 · PDF p. 797 · 첫 fast retransmission과 SACK block 기반 recovery 시작*

이 시점에서 `cwnd = 52`, `ssthresh`는 49에서 26으로 줄고 TCP는 Recovery state로 들어간다. Recovery는 cumulative ACK가 recovery point인 763000 이상을 ACK할 때까지 유지된다.

SACK/FACK 기반 flight size 계산은 다음 구조다.

```text
flight size = packets_outstanding + packets_retransmitted - packets_removed
```

`packets_removed`는 receiver에 out-of-order로 저장된 packet과 network에서 lost된 packet의 추정 합이다. SACK은 receiver에 저장된 block을 알려주지만, lost packet 수는 여전히 추정해야 한다. FACK이 켜진 Linux는 SACK으로 보이는 hole을 lost로 추정해 `cwnd`를 더 적극적으로 조정한다.

Figure 16-13은 SACK option이 recovery 동안 ACK마다 어떤 block을 싣는지 보여준다. 이 구간에서 대부분의 ACK는 duplicate ACK이고, 일부 good ACK는 partial ACK라 recovery point 아래까지만 전진한다. NewReno 설명처럼 partial ACK는 recovery 종료 조건이 아니다. Sender는 time 23.301에 recovery point를 넘는 ACK 765801을 받고 recovery를 마친다. 이때 `cwnd = 20`, `ssthresh = 26`이라 다시 slow start에 들어가고, 곧 `cwnd`가 27이 되며 congestion avoidance로 복귀한다.

### 16.5.5 Additional Local Congestion and Fast Retransmit Events

이후 event 3-6은 이미 본 패턴의 반복이다. Event 3은 local congestion으로 CWR에 들어가 `ssthresh`를 15로 낮춘다. Event 4는 second fast retransmit이며, Figure 16-14는 Linux TCP가 SACK 정보나 duplicate ACK를 받으면 먼저 Disorder state로 들어가 limited-transmit처럼 new data를 보내고, 이후 Recovery state에서 retransmission을 수행하는 모습을 보여준다. Recovery 완료 후 `cwnd = 4`, `ssthresh = 8`이라 sender는 slow start 상태가 된다.

Events 5와 6은 local congestion이 반복되어 CWR이 다시 발생하는 구간이다. 특히 event 6은 CWR 도중 timeout이 끼어들어 Loss state로 넘어가며, 다음 subsection의 timeout 처리로 이어진다.

### 16.5.6 Timeouts, Retransmissions, and Undoing cwnd Changes

Timeout은 fast retransmit보다 더 심각한 신호로 취급된다. Duplicate ACK나 SACK 없이 RTO가 만료되면 sender는 Loss state로 들어가고 보통 `cwnd = 1`, `ssthresh`를 낮춘 뒤 slow start를 재시작한다. 또한 timeout 시 기존 SACK 정보는 receiver reneging 가능성 때문에 버리는 것이 원칙이다. Receiver가 예전에 SACK한 out-of-order data를 buffer 정책상 나중에 버릴 수도 있기 때문이다.

Event 7의 first timeout은 time 62.486에 sequence 1773801 retransmission으로 나타난다. 이때 sender는 `cwnd = 1`, `ssthresh = 5`로 slow start에 들어가지만, timestamp evidence로 timeout이 spurious였다고 판단해 Eifel-like response로 상태를 되돌린다.

![Figure 16-15](@/assets/images/cs-tcp-ip-illustrated-300-figure-16-15-page-802.png)
*Figure 16-15 · PDF p. 802 · first timeout이 spurious로 판정되어 congestion control state가 undo되는 흐름*

Spurious 판정의 핵심은 TSOPT timestamp다. Retransmission을 덮는 ACK의 TSER 값이 retransmission의 TSV보다 이르면, ACK가 실제 retransmitted packet이 아니라 original transmission을 보고 생성되었음을 뜻한다. 즉 “hole”은 진짜 hole이 아니었고 RTO가 잘못 발생했다. 그래서 Linux TCP는 `cwnd`와 `ssthresh`를 이전 값 10으로 복원하고 normal state/congestion avoidance로 돌아간다.

Event 8은 다시 fast retransmit이며, SACK block과 duplicate ACK로 Disorder -> Recovery가 진행된다. Event 9는 local congestion으로 CWR에 들어가지만, event 10 timeout이 끼어들어 다시 Loss state를 만든다. Event 10도 timestamp evidence로 spurious timeout이었음이 확인되어 undo된다. 다만 이전 `cwnd`를 그대로 복원하면 ACK 하나에 여러 packet burst가 나갈 수 있으므로, Linux는 `maxburst = 3` 같은 congestion window moderation으로 `cwnd = flight size + maxburst` 수준으로 제한한다.

Event 11은 undo되지 않는 timeout이다. time 88.929에 retransmission timer가 만료되어 sequence 2185401을 retransmit하고, sender는 slow start로 진행한다.

![Figure 16-16](@/assets/images/cs-tcp-ip-illustrated-301-figure-16-16-page-804.png)
*Figure 16-16 · PDF p. 804 · undo되지 않는 retransmission timeout 뒤 slow start가 재개되는 흐름*

Figure 16-17은 이 timeout 뒤 ACK 하나가 두세 packet을 liberate하는 slow start 패턴이 다시 나타남을 보여준다. `cwnd`가 `ssthresh = 5`에 도달하면 sender는 congestion avoidance로 넘어간다.

### 16.5.7 Connection Completion

Connection completion은 time 99.757의 FIN 전송으로 시작한다. Sender는 아직 20 packets가 outstanding인 상태였고, receiver는 13 pure ACKs로 전체 remaining window를 ACK한다. 마지막 ACK는 1400-byte segment와 640-byte final data를 함께 ACK한다. Figure 16-18은 final FIN-ACK exchange까지 보여주며, FIN segment도 유효한 ACK number를 포함한다는 점을 확인시킨다.

Extended example 전체는 slow start, congestion avoidance, CWR/rate halving, SACK recovery, Disorder/Recovery state, spurious RTO detection/undo, final non-undo timeout까지 이 장의 핵심 mechanism을 실제 trace에 겹쳐 보여준다. 중요한 감각은 하나의 TCP connection이 단순히 “loss가 나면 반으로 줄인다”가 아니라, local queue, delayed ACK, SACK block, timestamp, receiver window, Linux implementation state가 함께 영향을 주는 동적 시스템이라는 점이다.

### 16.6 Sharing Congestion State

지금까지는 single TCP connection이 자기 ACK/loss history로 `cwnd`와 `ssthresh`를 학습하는 과정을 봤다. 하지만 같은 host가 같은 destination으로 여러 connection을 만들면, 이전 connection 또는 동시에 active한 connection의 congestion state를 재사용할 수 있다. 이 생각이 TCP Control Block Interdependence(RFC2140)다.

공유 방식은 두 가지로 나눌 수 있다.

- temporal sharing: 이미 CLOSED된 과거 connection의 정보를 새 connection이 사용한다.
- ensemble sharing: 현재 active한 다른 connection의 정보를 새 connection이 사용한다.

Linux에서는 routing subsystem의 destination metrics에 이 아이디어가 반영된다. Connection이 CLOSED 상태가 될 때 `srtt`, `rttvar`, reordering estimate, `cwnd`, `ssthresh` 같은 값을 저장하고, 같은 destination으로 새 connection이 시작될 때 초기 추정에 활용할 수 있다. Chapter 14에서 본 destination metrics와 연결되는 부분이다.

### 16.7 TCP Friendliness

TCP friendliness는 새로운 transport protocol이나 modified TCP가 standard TCP와 같은 bottleneck을 공유할 때 부당하게 더 많은 bandwidth를 차지하지 않도록 하는 기준이다. Internet에서는 여러 TCP flow가 router queue를 함께 쓰므로, 새 congestion control은 “빠른가”만이 아니라 “TCP와 공정하게 공존하는가”를 평가받는다.

TFRC(TCP Friendly Rate Control)는 packet size, RTT, loss event rate, RTO 등을 사용해 conventional TCP가 해당 환경에서 쓸 수 있는 sending rate 상한을 equation으로 계산한다. Streaming application처럼 bandwidth variation이 너무 큰 TCP sawtooth가 부담스러운 경우, TFRC는 TCP-friendly하면서 더 stable한 rate profile을 제공하려는 목적을 가진다.

Standard TCP의 congestion avoidance는 AIMD로 볼 수 있다.

```text
# additive increase
cwnd(t+1) = cwnd(t) + a / cwnd(t)

# multiplicative decrease
cwnd(t+1) = cwnd(t) - b * cwnd(t)
```

Regular TCP는 대략 `a = 1`, `b = 0.5`다. 이 response function은 packet drop rate `p`와 TCP sending rate를 연결한다. 새 알고리즘이 이 response function보다 훨씬 공격적이면 standard TCP flow를 밀어낼 수 있다. 그래서 relative fairness는 modified congestion control의 속도를 standard TCP 속도와 비교한 ratio로 평가한다.

### 16.8 TCP in High-Speed Environments

High-speed, large-BDP network에서는 standard TCP congestion avoidance의 fixed additive increase가 너무 느릴 수 있다. 예를 들어 10Gb/s long-distance link에서 1500-byte packets, RTT 100ms라면 path를 채우기 위해 약 83,000 segments outstanding이 필요할 수 있다. Standard TCP가 loss 없이 congestion avoidance로 이 window까지 도달하는 데는 매우 오래 걸릴 수 있다.

이 문제의 목표는 섬세하다.

- low/moderate-speed Internet에서는 standard TCP와 friendly해야 한다.
- low packet loss rate, large window, high BDP 환경에서는 standard TCP보다 빠르게 window를 키워야 한다.
- 같은 high-speed algorithm끼리도 RTT unfairness를 과도하게 키우지 않아야 한다.

### 16.8.1 HighSpeed TCP (HSTCP) and Limited Slow Start

HSTCP(HighSpeed TCP)는 `cwnd`가 일정 기준, 예를 들어 Low_Window = 38 MSS-size segments보다 커진 뒤에는 standard TCP response function을 바꿔 더 aggressive하게 동작한다. Packet drop rate가 충분히 낮고 window가 큰 영역에서는 더 큰 throughput을 허용하지만, drop rate가 큰 일반 환경에서는 standard TCP와 같은 response를 유지한다.

![Figure 16-19](@/assets/images/cs-tcp-ip-illustrated-304-figure-16-19-page-810.png)
*Figure 16-19 · PDF p. 810 · HSTCP가 낮은 packet drop rate와 큰 window 영역에서 더 aggressive한 response function을 쓰는 모습*

HSTCP는 additive increase와 multiplicative decrease 계수를 고정하지 않고 current window size의 함수로 둔다.

```text
cwnd(t+1) = cwnd(t) + a(cwnd) / cwnd(t)
cwnd(t+1) = cwnd(t) - b(cwnd) * cwnd(t)
```

즉 high-speed 영역에서는 `a()`와 `b()`를 조정해 standard TCP보다 더 빠르게 큰 window에 도달한다. 단, slow start도 large window에서 무작정 RTT마다 두 배로 커지면 위험하므로 limited slow start가 제안된다. `max_ssthresh`보다 작은 동안은 regular slow start를 쓰고, `cwnd`가 그보다 커지면 RTT당 증가량을 제한해 수천/수만 packet window가 한 RTT에 두 배가 되는 일을 막는다.

### 16.8.2 Binary Increase Congestion Control (BIC and CUBIC)

BIC-TCP는 high BDP 환경과 RTT fairness 문제를 고려해 Linux에서 한동안 기본으로 쓰였던 scalable TCP다. 핵심은 loss가 없던 마지막 safe window를 minimum, loss가 발생했던 window를 maximum으로 두고, 그 사이의 saturation point를 binary search로 찾는 것이다.

BIC의 window growth는 세 동작으로 이해할 수 있다.

| 동작 | 의미 |
|---|---|
| binary search increase | min/max window 사이 midpoint를 trial window로 선택해 saturation point를 빠르게 찾음 |
| additive increase/window clamping | midpoint까지 거리가 너무 크면 한 RTT에 너무 큰 burst가 생기지 않도록 증가량을 `Smax`로 제한 |
| max probing | current maximum을 넘어 새 capacity가 있는지 작은 증가에서 큰 증가로 탐색 |

BIC은 saturation point 근처에서 작은 변화만 주어 안정성을 얻지만, 어떤 상황에서는 너무 aggressive하다는 우려가 있었다. 이를 단순화하고 다듬은 알고리즘이 CUBIC이다.

CUBIC은 window growth function을 cubic function으로 정의한다.

```text
W(t) = C(t - K)^3 + Wmax
```

여기서 `Wmax`는 마지막 window reduction 전의 window size, `t`는 마지막 reduction 이후 경과 시간, `C`는 상수, `K`는 loss가 없으면 다시 `Wmax`에 도달하는 데 걸리는 시간이다.

![Figure 16-20](@/assets/images/cs-tcp-ip-illustrated-305-figure-16-20-page-815.png)
*Figure 16-20 · PDF p. 815 · CUBIC window growth가 Wmax 전에는 concave, 이후에는 convex로 capacity를 탐색하는 구조*

CUBIC의 좋은 점은 ACK arrival pattern이 아니라 elapsed time since last reduction을 중심으로 window를 조정한다는 것이다. 이 때문에 RTT가 짧은 flow가 ACK를 더 자주 받아 과도하게 유리해지는 문제를 줄이는 데 도움이 된다. `W(t) < Wmax` 영역에서는 saturation point를 조심스럽게 찾아가고, `W(t) > Wmax`가 되면 더 적극적으로 max probing을 한다.

CUBIC은 small/ordinary window 영역에서 standard TCP보다 불리해지지 않도록 TCP-friendly region도 가진다. `cwnd < Wtcp(t)`이면 CUBIC은 standard TCP가 같은 시간 동안 가졌을 법한 window `Wtcp(t)`로 맞춘다. Linux는 kernel 2.6.18 이후 CUBIC을 기본 congestion control로 사용했고, pluggable congestion avoidance module 구조로 Reno 등 다른 알고리즘도 선택할 수 있게 했다.

### 16.9 Delay-Based Congestion Control

지금까지 본 classic TCP, Reno/NewReno, SACK recovery, HSTCP, BIC, CUBIC은 대부분 loss-based congestion control이다. Loss, duplicate ACK, SACK, RTO, 또는 ECN 같은 signal을 보고 반응한다. 반면 delay-based congestion control은 packet drop이 나기 전 RTT 증가를 congestion이 형성되는 early signal로 본다.

기본 관찰은 Figure 16-8과 같다. Sender가 path forwarding rate보다 많이 보내면 packet이 router queue에 쌓이고, drop이 발생하기 전에 RTT가 먼저 증가한다. Delay-based algorithm은 이 queueing delay를 보고 `cwnd`를 조정하려고 한다.

| 방식 | congestion signal | 장점 | 약점 |
|---|---|---|---|
| loss-based | packet loss, duplicate ACK, RTO | 기존 Internet에서 단순하고 강건 | queue가 꽉 차 drop될 때까지 기다려 delay가 커질 수 있음 |
| ECN-based | router의 ECN mark | drop 전 signal 가능 | router/host 양쪽 지원 필요 |
| delay-based | RTT 증가, expected/actual throughput 차이 | drop 전 queue buildup 감지 가능 | reverse-path congestion, rerouting, loss-based TCP와 경쟁 시 불리할 수 있음 |

### 16.9.1 Vegas

TCP Vegas는 대표적인 delay-based TCP다. Vegas는 일정 시간 동안 기대한 throughput과 실제 달성한 throughput을 비교한다. 기대 throughput은 window size를 connection에서 관찰된 minimum RTT로 나눈 값이고, 실제 throughput은 해당 RTT 동안 실제 전송된 data로 계산한다. 실제 throughput이 기대보다 낮으면 data가 bottleneck queue에 쌓이고 있다고 추정한다.

Vegas는 두 threshold `alpha(α)`와 `beta(β)`를 둔다.

- expected - actual < `α`: queue가 너무 비어 있다고 보고 `cwnd`를 증가시킨다.
- expected - actual > `β`: queue가 너무 차 있다고 보고 `cwnd`를 감소시킨다.
- `α <= diff <= β`: 적절한 operating range로 보고 `cwnd`를 유지한다.

Vegas의 window 변화는 additive increase/additive decrease(AIAD)다. 원문에서 `α=1`, `β=3`은 bottleneck queue에 최소 1 packet은 유지해 pipe를 비우지 않고, 최대 몇 packet 정도의 여유 범위 안에서 oscillation을 줄이려는 의미다. Slow start에도 변형을 적용할 수 있는데, 매 RTT마다 무조건 늘리는 대신 증가하지 않는 RTT에 throughput 증가 여부를 측정해, 더 이상 증가하지 않으면 Vegas congestion avoidance로 전환한다.

Vegas의 큰 약점은 RTT measurement가 forward path queue만 반영하지 않는다는 점이다. Reverse path에서 ACK가 밀려도 sender는 RTT 증가로 본다. 그러면 sender 자신이 만든 congestion이 아닌데도 `cwnd`를 줄인다. 또한 standard TCP와 경쟁하면 standard TCP가 queue를 채우고 Vegas는 delay 증가를 보고 물러나므로, loss-based TCP에 bandwidth를 빼앗기기 쉽다.

### 16.9.2 FAST

FAST TCP는 Vegas와 비슷하게 expected throughput과 experienced throughput의 차이를 사용하지만, large BDP/high-speed 환경을 더 염두에 둔다. Window size뿐 아니라 현재 성능과 기대 성능의 차이 자체를 반영하고, every other RTT 단위로 rate-pacing을 사용해 sending rate를 조정한다. Delay가 threshold보다 충분히 낮으면 적극적으로 window를 키운 뒤 증가를 완만하게 하고, delay가 커지면 반대로 줄인다. 원문은 FAST가 안정성과 fairness가 괜찮다는 평가도 있지만, 특허와 상용화 맥락 때문에 연구 커뮤니티 검증이 상대적으로 덜했다고 설명한다.

### 16.9.3 TCP Westwood and Westwood+

TCP Westwood/TCP Westwood+(TCPW/TCPW+)는 NewReno sender를 수정해 large BDP path를 더 잘 다루려는 방식이다. Sender는 ACK arrival dynamics를 바탕으로 available bandwidth estimate인 eligible rate estimate(ERE)를 계속 계산한다. Congestion이 적으면 측정 interval을 짧게, congestion이 크면 길게 잡는 식으로 rate estimate를 조정한다.

Loss가 감지되면 standard TCP처럼 `cwnd`를 단순히 절반으로 줄이는 대신, 다음 값을 새 `ssthresh`로 사용한다.

```text
ssthresh ~= ERE * minimum RTT
```

즉 estimated BDP에 가까운 값을 threshold로 삼는다. Agile probing은 otherwise slow start로 동작할 구간에서 `ssthresh`를 적응적으로 반복 설정해 `cwnd`가 더 알맞게 커지게 돕는다.

### 16.9.4 Compound TCP

Compound TCP(CTCP)는 loss-based와 delay-based를 결합한 방식이다. Windows Vista 이후 congestion provider로 선택 가능하며, Windows Server 2008에서는 기본값으로 쓰인 맥락이 있다. CTCP는 standard TCP식 `cwnd`에 delay-based component인 `dwnd(delay window)`를 더한다.

```text
W = min(cwnd + dwnd, awnd)
```

`cwnd`는 standard TCP처럼 loss-based로 관리되고, `dwnd`는 Vegas와 유사하게 queueing delay를 추정해 관리된다. CTCP는 minimum RTT를 `baseRTT`로 유지하고, 현재 RTT와 비교해 network에 queueing된 것으로 보이는 data 양 `diff`를 계산한다.

```text
diff = W * (1 - baseRTT / RTT)
```

`diff`가 목표 threshold `γ`보다 작으면 network가 덜 찼다고 보고 `dwnd`를 키워 더 aggressive하게 보낸다. `diff >= γ`이면 queue가 목표보다 차 있다고 보고 `dwnd`를 줄인다. Loss가 발생하면 `dwnd`에도 multiplicative decrease를 적용한다. `dwnd`는 음수가 될 수 없으며, 0이면 CTCP는 standard TCP처럼 동작한다.

CTCP의 의도는 delay-based 방식의 낮은 loss/빠른 convergence 장점과 loss-based 방식의 TCP competition 능력을 결합하는 것이다. 하지만 buffer가 너무 작거나, many CTCP flows가 같은 bottleneck에서 각자 `γ` packets를 유지하려 하면 성능이 나빠질 수 있다. Vegas처럼 rerouting이나 persistent congestion에 취약할 수 있다는 점도 주의해야 한다.

### 16.10 Buffer Bloat

Buffer bloat는 network device의 buffer가 너무 커서 packet drop signal이 늦게 발생하고, 그동안 queueing delay가 크게 증가하는 문제다. 직관적으로는 “buffer가 크면 packet loss가 줄어 좋다”고 생각하기 쉽지만, standard TCP는 bottleneck buffer를 채우는 경향이 있으므로 큰 buffer는 loss를 늦추는 대신 latency를 키운다.

특히 home/small office의 residential gateway나 access point uplink에서 문제가 잘 드러난다. Uplink bandwidth는 수백 Kb/s에서 몇 Mb/s인데 commodity router buffer가 수십-수백 KB 이상이면, 대용량 upload가 buffer를 가득 채운 동안 interactive application의 packet도 긴 queue 뒤에 서게 된다.

![Figure 16-21](@/assets/images/cs-tcp-ip-illustrated-306-figure-16-21-page-821.png)
*Figure 16-21 · PDF p. 821 · buffer size와 link rate에 따라 fully congested queue가 만드는 queueing delay*

Figure 16-21의 의미는 단순하다. 같은 buffer size라도 link rate가 낮으면 queue를 비우는 데 오래 걸린다. Residential upload rate 범위에서 수백 KB buffer가 꽉 차 있으면 multiple-second latency가 생길 수 있다. Interactive application은 대체로 one-way delay가 150ms 이하일 때 좋은 사용자 경험을 제공하므로, 큰 competing upload 하나가 voice/video/game/remote desktop 같은 traffic을 크게 망칠 수 있다.

Buffer bloat 대응은 여러 방향이 있다.

- protocol side: Vegas 같은 delay-based congestion control로 queue buildup을 drop 전에 감지한다.
- device side: access device의 dynamic buffer sizing으로 불필요하게 큰 queue를 줄인다.
- queue management side: AQM/ECN처럼 router/switch가 queue를 더 능동적으로 관리하고 endpoint에 signal을 준다.

### 16.11 Active Queue Management and ECN

전통적인 passive router는 FIFO/drop tail 방식으로 동작한다. Queue가 찰 때까지 packet을 받아 FIFO로 내보내다가, 더 이상 buffer가 없으면 새 packet을 drop한다. 이 방식에서는 TCP sender가 congestion을 packet loss 뒤에야 알 수 있다.

AQM(Active Queue Management)은 FIFO/drop tail보다 적극적인 scheduling/buffer management policy를 사용해 queue를 관리하는 방식이다. AQM 자체도 도움이 되지만, endpoint가 congestion 상태를 알 수 있도록 signal까지 제공하면 더 유용하다. TCP에서 이 역할을 하는 대표 mechanism이 ECN(Explicit Congestion Notification)이다.

RED(Random Early Detection)는 AQM 예시다. RED는 average queue occupancy를 측정하고 다음처럼 marking/drop probability를 조절한다.

| queue 상태 | RED 동작 |
|---|---|
| average < `minthresh` | mark/drop하지 않음 |
| `minthresh <= average < maxthresh` | queue가 커질수록 증가하는 probability로 mark/drop |
| average >= `maxthresh` | 최대 probability `MaxP`까지 mark/drop, 설정에 따라 1.0 가능 |

ECN은 router가 packet을 drop하지 않고 IP header의 ECN bits를 Congestion Experienced(CE)로 mark해 “persistent congestion이 시작됨”을 알려주는 방식이다. ECN 흐름은 다음과 같다.

1. Sender transport가 ECN을 이해하면 IP header에 ECT(ECN-Capable Transport) indication을 설정한다.
2. ECN-capable router가 persistent congestion을 감지하면 packet을 drop하지 않고 CE mark를 설정해 forwarding한다.
3. TCP receiver는 CE-marked data packet을 받으면 ACK에 ECN-Echo(ECE) bit를 설정해 sender에게 echo한다.
4. ACK는 unreliable하므로 receiver는 sender의 CWR(Congestion Window Reduced) bit를 볼 때까지 ACK마다 ECE를 반복한다.
5. Sender는 ECE를 받으면 packet drop을 본 것처럼 `cwnd`를 줄이되, 실제 retransmission은 하지 않는다.
6. Sender는 이후 data packet에 CWR bit를 설정해 “나 `cwnd` 줄였음”을 receiver에게 알린다.

중요한 제약은 sender가 같은 window of data에 대해 ECN signal에 여러 번 과잉 반응하면 안 된다는 점이다. 그러면 ECN-capable TCP가 non-ECN flow보다 과도하게 penalized된다.

ECN은 IP layer와 transport layer가 함께 참여하는 mechanism이므로 TCP 외 transport에도 원리상 적용 가능하지만, 실제 논의는 TCP 중심으로 이루어졌다. Internet-wide deployment는 RED parameter tuning 어려움, 이익에 대한 인식 부족, 중간 장비 호환성 등의 이유로 제한적이었다. 다만 DCTCP(Data Center TCP)는 data center라는 통제된 환경에서 layer 2 switch의 simplified RED/ECN marking과 TCP receiver behavior 변경을 사용해 buffer occupancy를 크게 줄이면서 throughput을 유지한 사례다.

### 16.12 Attacks Involving TCP Congestion Control

TCP는 connection state machine을 깨뜨리는 공격뿐 아니라, ESTABLISHED 상태에서도 congestion control 동작을 왜곡당할 수 있다. 이 절의 공격들은 대부분 TCP sender가 정상적인 congestion signal을 본 것처럼 착각하게 만들거나, 반대로 congestion signal을 보지 못하게 만들어 sender가 보통보다 빠르거나 느리게 보내게 하는 데 목적이 있다.

초기 형태의 공격은 ICMPv4 Source Quench message를 위조하는 것이다. TCP host가 Source Quench를 받으면 해당 ICMP message 안의 offending datagram이 가리키는 destination으로 향하는 connection을 늦출 수 있었다. Router가 Source Quench를 congestion control에 사용하는 것은 RFC1812 이후 사실상 deprecated되었지만, RFC1122는 end host가 Source Quench에 반응해야 한다고 했기 때문에 과거에는 취약점이 될 수 있었다. 현실적인 대응은 router나 host에서 ICMP Source Quench traffic을 차단하는 것이고, 현재는 흔한 설정이다.

더 중요한 공격군은 misbehaving receiver가 ACK stream을 조작하는 방식이다. TCP congestion control은 receiver가 정직하게 ACK을 보낸다는 가정에 강하게 기대며, sender는 ACK 도착을 clock으로 삼아 `cwnd`를 늘리거나 recovery를 진행한다. 이 가정을 악용하면 Web client 같은 receiver가 competing clients보다 불공정한 이득을 얻을 수 있다. 원문은 ACK division, DupACK spoofing, Optimistic ACKing을 설명하고, 이를 구현한 변종을 “TCP Daytona”라고 부른다.

| 공격 | 핵심 조작 | sender가 속는 지점 | 완화 방향 |
|---|---|---|---|
| ACK division | 한 byte range에 대해 여러 ACK을 생성 | ACK packet 수가 많아져 `cwnd` 증가가 빨라짐 | ACK packet 수가 아니라 acknowledged bytes 기준으로 계산하는 ABC |
| DupACK spoofing | duplicate ACK을 과도하게 생성 | fast recovery 중 DupACK마다 `cwnd`가 inflation됨 | recovery 동안 outstanding data를 제한, nonce류 검증 |
| Optimistic ACKing | 아직 받지 않은 segment를 미리 ACK | RTT가 실제보다 짧아 보이고 sender가 더 빨리 반응 | cumulative nonce, segment size 변화로 ACK 대응성 확인 |

ACK division은 TCP sender가 “ACK 하나가 왔다”는 사건을 기준으로 `cwnd`를 증가시키는 점을 찌른다. 예를 들어 receiver가 실제로는 하나의 byte range를 ACK해야 하는데 이를 여러 ACK으로 쪼개 보내면, sender는 같은 양의 data에 대해 여러 번 `cwnd` 증가 기회를 얻는다. ABC(Appropriate Byte Counting)는 ACK packet 개수가 아니라 실제로 새롭게 acknowledged된 byte 수를 기준으로 congestion control 계산을 하므로 이 공격을 줄인다.

DupACK spoofing은 fast recovery 절차를 노린다. Standard fast recovery에서는 duplicate ACK을 받을 때마다 network에 packet 하나가 빠져나갔다고 보고 `cwnd`를 increment한다. Receiver가 가짜 duplicate ACK을 많이 만들면 sender는 recovery 중 보낼 수 있는 양을 정상보다 빠르게 늘릴 수 있다. 이 공격은 각 duplicate ACK이 어떤 segment와 대응되는지 깨끗하게 확인하기 어렵기 때문에 방어가 더 까다롭다. Timestamps option이 관련 단서를 줄 수는 있지만 optional이고 connection별로 꺼질 수 있다. 원문은 sender side에서 recovery 동안 outstanding data를 제한하는 접근이 현실적인 완화책이라고 본다.

Optimistic ACKing은 아직 도착하지 않은 data에 대해 미리 ACK을 보내는 공격이다. Sender는 end-to-end RTT를 ACK 도착 시점으로 추정하므로, 미리 온 ACK은 실제 RTT가 더 짧다고 속인다. 그러면 sender는 path가 더 빠르고 여유 있다고 보고 `cwnd` 증가와 전송을 앞당긴다. 이 방식은 TCP layer의 reliability를 스스로 깨뜨릴 수 있다. 하지만 HTTP/1.1처럼 application/session layer가 missing data를 재요청하거나 복원할 수 있는 경우, 공격 receiver는 이 손실을 감수하고 더 높은 sending rate를 유도할 수 있다.

ECN도 receiver가 정직하게 congestion indication을 되돌려준다는 가정이 필요하다. ECN-capable router가 CE mark를 설정했는데 receiver가 ACK에 ECN-Echo(ECE)를 싣지 않거나, network 중간에서 ECN indicator를 지워버리면 sender는 congestion을 알지 못해 `cwnd`를 줄이지 않는다.

RFC3540의 experimental ECN nonce는 이 문제를 줄이려는 방법이다. Sender는 IP packet의 ECN field 중 ECT bit field에 random binary value를 넣고, receiver는 시간에 따라 받은 값들의 1-bit sum, 즉 XOR 결과를 ACK의 reserved bit에 되돌려준다. Misbehaving receiver가 실제 packet을 받지 않았거나 CE 정보를 숨기려면 이 sum을 맞혀야 하는데, packet마다 성공 확률이 `1/2`이고 `k` packets 모두 맞출 확률은 `1/2^k`로 작아진다. 즉 nonce는 receiver가 “봤다고 주장하는 packet stream”이 실제 packet stream과 맞는지 확률적으로 검증하는 장치다.

### 16.13 Summary

TCP는 reliable transport protocol로 설계될 때 receiver를 보호하는 flow control은 포함했지만, network 중간을 congestion으로부터 보호하는 mechanism은 처음부터 충분하지 않았다. 이후 slow start와 congestion avoidance가 도입되면서 sender는 `cwnd(congestion window)`를 사용해 network에 넣는 data 양을 조절하게 되었다. 실제 sending window는 receiver가 광고한 `awnd(advertised window)`와 `cwnd` 중 작은 값이다.

Slow start는 `cwnd`를 RTT마다 대략 exponential하게 키워 path capacity를 빠르게 탐색한다. Congestion avoidance는 `cwnd`를 RTT마다 대략 linear하게 키워 loss 이후 더 조심스럽게 bandwidth를 탐색한다. 두 algorithm 중 어느 쪽이 동작할지는 `cwnd`와 `ssthresh(slow start threshold)` 비교로 결정된다. `cwnd <= ssthresh`이면 slow start, `cwnd > ssthresh`이면 congestion avoidance가 담당한다. Timeout이나 idle restart 뒤에도 slow start가 사용될 수 있고, `ssthresh`는 connection 중 동적으로 바뀐다.

Reno/NewReno/SACK TCP는 여러 packet loss 상황에서 recovery stall을 줄이기 위해 발전했다. Reno는 fast retransmit/fast recovery로 timeout 없이 일부 loss를 복구하지만, 한 window 안의 multiple losses에서 취약하다. NewReno는 partial ACK을 이용해 여러 손실을 한 RTT당 하나씩 복구한다. SACK TCP는 receiver가 받은 block을 명시해 sender가 한 RTT에 여러 손실을 더 지능적으로 복구할 수 있게 한다. 대신 SACK sender는 pipe 추정, outstanding data accounting을 보수적으로 해야 다른 TCP flow에 비해 과도하게 공격적이지 않다.

이후의 개선은 크게 세 갈래다. Rate halving은 loss 뒤 `cwnd`를 한 번에 크게 줄이지 않고 ACK 흐름에 맞춰 점진적으로 줄인다. CWV(Congestion Window Validation)는 application-limited/idle flow가 실제로 network를 검증하지 않은 큰 `cwnd`를 계속 들고 있지 못하게 한다. Eifel Response Algorithm 같은 undo mechanism은 spurious timeout이나 false loss signal로 잘못 줄인 congestion state를 가능한 한 복원한다.

High-speed/large BDP path에서는 standard TCP의 additive increase가 너무 느릴 수 있다. HSTCP는 큰 window와 낮은 loss 영역에서 더 공격적으로 증가하고 덜 급격하게 감소한다. BIC-TCP와 CUBIC은 loss 직전 window를 기준점으로 삼아 concave/convex growth를 조합하며, 특히 CUBIC은 Linux에서 널리 쓰인 high-speed TCP variant다. Vegas/FAST/Westwood/Compound TCP는 RTT delay, bandwidth estimate, loss signal을 조합해 packet drop 전에 congestion을 추정하려는 흐름에 속한다.

Buffer bloat는 큰 buffer가 loss를 늦추는 대신 latency를 크게 키우는 문제다. AQM과 ECN은 router/switch가 queue 상태를 더 능동적으로 관리하고, packet drop 없이 endpoint에 congestion signal을 주려는 접근이다. ECN은 CE mark, ECE, CWR을 통해 sender가 `cwnd`를 줄였음을 왕복 확인한다. 하지만 deployment는 parameter tuning, middlebox 호환성, incentive 문제 때문에 제한적이었고, DCTCP처럼 통제된 data center 환경에서 더 뚜렷한 성공 사례가 나왔다.

마지막으로 TCP congestion control은 보안 mechanism이 아니다. ACK stream, duplicate ACK, optimistic ACK, ECN echo를 조작하면 sender의 `cwnd` 계산을 왜곡할 수 있다. 또한 sender가 congestion control rule 자체를 어기는 것을 TCP가 물리적으로 막지는 못한다. 그래서 fairness는 protocol 규칙, endpoint 구현, router policy, measurement/diagnostic tool이 함께 유지해야 하는 운영적 속성에 가깝다.

## 세부 정리

| 구분 | 핵심 signal | 대표 mechanism | 기억할 점 |
|---|---|---|---|
| Classic TCP | loss, DupACK, RTO | slow start, congestion avoidance, fast retransmit, fast recovery | `cwnd`와 `ssthresh`가 중심 |
| SACK 계열 | SACK block, pipe estimate | SACK recovery, FACK, rate halving | multiple losses를 더 효율적으로 복구 |
| Validation/undo | idle, spurious loss | CWV, CWM, Eifel Response Algorithm | 잘못 크거나 잘못 줄어든 `cwnd`를 보정 |
| High-speed TCP | large window, low loss | HSTCP, BIC-TCP, CUBIC | large BDP에서 standard TCP보다 빠르게 탐색 |
| Delay-based TCP | RTT/queueing delay | Vegas, FAST, CTCP 일부 | drop 전 congestion을 보려 하지만 reverse path delay와 경쟁성 문제가 있음 |
| Queue signaling | queue occupancy | AQM, RED, ECN, DCTCP | network device와 endpoint 협력이 필요 |
| 공격/오용 | forged ACK/ECN | ACK division, DupACK spoofing, Optimistic ACKing, ECN nonce | receiver 정직성 가정이 깨지면 fairness가 무너짐 |

## 연결 관계

- Chapter 13 TCP Connection Management와 연결: congestion control은 ESTABLISHED 상태에서 핵심이고, SYN/FIN/RST 같은 state machine 공격과 별개로 ACK stream 조작 공격도 가능하다.
- Chapter 14 TCP Timeout and Retransmission과 연결: RTO, spurious timeout, Eifel detection/response는 `cwnd` reduction과 recovery 성능을 직접 좌우한다.
- Chapter 15 TCP Data Flow and Window Management와 연결: advertised window `awnd`, send window, receive window는 flow control이고, `cwnd`는 congestion control이다. 실제 전송 가능량은 `min(cwnd, awnd)`다.
- Chapter 5 Internet Protocol과 연결: ECN은 IP header의 ECN bits를 사용하고, router가 CE mark를 설정한다.
- Router/queueing 내용과 연결: drop tail, RED, AQM, buffer bloat는 TCP sender가 보는 loss/delay/ECN signal을 만든다.

## 오해하기 쉬운 내용

- `cwnd`는 receiver가 광고하는 window가 아니다. Receiver buffer 보호는 `awnd`, network 보호는 `cwnd`가 맡는다.
- Slow start는 “천천히 시작”이라는 이름과 달리 exponential growth다. Conservative한 것은 시작 window가 작다는 점이다.
- Packet loss는 congestion의 강한 signal이지만 항상 congestion은 아니다. Wireless error나 spurious timeout도 loss처럼 보일 수 있다.
- SACK은 receiver가 data를 재조립해주는 기능이 아니라 sender에게 어떤 byte block이 도착했는지 알려 recovery를 돕는 option이다.
- ECN은 retransmission을 유발하지 않는다. Drop 없이 congestion을 알리고, sender는 congestion response만 수행한다.
- Buffer가 크면 loss는 줄 수 있지만 latency가 커져 interactive traffic에는 더 나쁠 수 있다.
- High-speed TCP가 빠르다는 말은 모든 상황에서 공정하다는 뜻이 아니다. TCP friendliness와 convergence는 별도의 설계 목표다.

## 면접 질문

1. TCP에서 `cwnd`와 `awnd`의 역할 차이는 무엇이며, 실제 sending window는 어떻게 결정되는가?
2. Slow start와 congestion avoidance는 각각 언제 동작하고 `cwnd`를 어떻게 증가시키는가?
3. Reno fast recovery가 multiple packet losses에서 취약한 이유와 NewReno/SACK이 이를 개선하는 방식은 무엇인가?
4. Spurious timeout이 발생했을 때 Eifel Response Algorithm이 왜 필요한가?
5. CUBIC이 standard TCP보다 high-speed/large BDP path에 더 적합한 이유는 무엇인가?
6. Vegas 같은 delay-based congestion control이 loss-based TCP와 경쟁할 때 불리해질 수 있는 이유는 무엇인가?
7. Buffer bloat가 throughput 문제가 아니라 latency 문제로 체감되는 이유는 무엇인가?
8. ECN에서 CE, ECE, CWR이 각각 어떤 역할을 하는가?
9. ACK division, DupACK spoofing, Optimistic ACKing은 각각 TCP sender의 어떤 가정을 악용하는가?
10. TCP congestion control만으로 overly aggressive sender를 완전히 막기 어려운 이유는 무엇인가?
