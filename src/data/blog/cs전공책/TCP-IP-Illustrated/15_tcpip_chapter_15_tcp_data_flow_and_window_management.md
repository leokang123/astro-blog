---
title: "TCP Data Flow and Window Management"
order: 15
pubDatetime: 2026-05-17T00:00:00+09:00
modDatetime: 2026-05-17T00:00:00+09:00
description: "TCP/IP Illustrated 정리: TCP Data Flow and Window Management"
tags:
  - "ComputerNetwork"
  - "CS"
  - "TCPIP"
---

## 개요

Chapter 15는 TCP 연결이 이미 열린 뒤 실제 데이터가 어떻게 흐르는지 다룬다. Chapter 13이 connection establishment/termination, Chapter 14가 retransmission 기반 reliable delivery를 설명했다면, 여기서는 interactive connection의 작은 segment 처리와 bulk data transfer에서 receiver를 넘치게 하지 않는 flow control/window management를 본다. 그리고 Chapter 16의 congestion control은 이 flow control 개념을 receiver뿐 아니라 network path 보호로 확장한다.

Interactive TCP connection은 keystroke, short message, joystick/mouse movement처럼 사용자 입력을 지연 없이 전달해야 하는 연결이다. 작은 입력을 즉시 보내면 packet당 payload가 적어 header overhead가 커지지만, packet을 채우려고 기다리면 online game, collaboration tool, remote login 같은 delay-sensitive application이 느려진다. 이 장의 delayed ACK, Nagle algorithm, window management는 결국 `작은 packet 수를 줄일 것인가`와 `응답 지연을 줄일 것인가` 사이의 trade-off를 다룬다.

## 핵심 개념

### 15.1 Introduction

- TCP data transfer는 interactive communication과 bulk transfer에서 같은 TCP header/packet format을 쓰지만, 중요해지는 알고리즘이 다르다.
- interactive data는 보통 tens of bytes 수준의 user data를 담고, bulk data는 Web/file sharing/e-mail/backups처럼 상대적으로 큰 segment를 지속적으로 보낸다.
- flow control은 sender가 receiver buffer를 초과하지 않도록 Window Size/window advertisement를 조절하는 메커니즘이다. 이는 receiver 보호가 목적이고, congestion control은 network path 보호가 목적이라는 점에서 구분된다.

### 15.2 Interactive Communication

Interactive communication의 대표 예시는 ssh(Secure Shell)이다. 사용자가 client에서 문자를 입력하면 client가 이를 암호화해 server로 보내고, server는 shell(command interpreter)을 통해 입력을 처리한 뒤 echo나 command output을 다시 client로 보낸다. Telnet, rlogin, Windows Terminal Services 같은 remote login류도 같은 TCP 관점에서 이해할 수 있다.

많은 사람이 처음 헷갈리는 지점은 `interactive keystroke 하나가 보통 별도 TCP data packet을 만든다`는 점이다. 원격 shell이 typed character를 다시 echo하면, 이론적으로는 한 글자에 대해 다음 4개 segment가 생길 수 있다.

1. client -> server: keystroke data byte
2. server -> client: keystroke에 대한 ACK
3. server -> client: echoed byte
4. client -> server: echo에 대한 ACK

하지만 실제 TCP는 보통 2번 ACK와 3번 echo를 한 packet에 합친다. 이 방식이 delayed acknowledgment와 piggybacking이다. ACK만 따로 보내는 대신, 곧 보낼 reverse-direction data가 있으면 ACK를 그 data segment에 얹어 packet 수를 줄인다.

![Figure 15-1](@/assets/images/cs-tcp-ip-illustrated-268-figure-15-1-page-732.png)
*Figure 15-1 · PDF p. 732 · interactive keystroke에서 ACK와 echo가 분리되거나 piggyback되는 흐름*

Figures 15-2와 15-3의 ssh trace는 `date` 명령을 입력할 때 각 글자 `d`, `a`, `t`, `e`, Enter가 독립적인 작은 TCP data packet 흐름을 만든다는 점을 보여준다. 예시에서 각 입력 글자는 client-to-server data, server-to-client ACK+echo, client-to-server echo ACK의 3-packet 패턴에 가깝게 나타난다. Figure 15-3은 같은 trace를 TCP sequence number 중심으로 풀어 보여주며, TCP 연결에는 client -> server 방향 sequence space와 server -> client 방향 sequence space가 별도로 존재한다는 점을 드러낸다. ACK number는 `마지막으로 성공적으로 받은 byte의 다음 sequence number`를 가리키므로, 48-byte ssh encrypted payload를 받은 뒤 ACK number가 48로 진행한다.

이 구간의 중요한 감각은 TCP가 message boundary를 보존하지 않는 byte stream이지만, interactive application의 작은 write는 실제 packet trace에서 작은 TCP segment로 자주 관찰된다는 점이다. 따라서 interactive 성능을 이해하려면 application write, encryption block size, PSH bit, ACK, echo, delayed ACK가 packet 단위에서 어떻게 결합되는지 함께 봐야 한다.

본문의 ssh trace에서 data가 있는 packet에는 PSH bit가 설정되어 있었다. 관례적으로 PSH는 sender 쪽 송신 buffer가 해당 packet 전송 시점에 비워졌고, receiver가 data를 application 쪽으로 밀어 올려도 된다는 의미로 이해할 수 있다. 다만 이 장의 핵심은 PSH 자체보다 작은 write가 ACK/echo/delay 정책과 만나 packet 흐름을 어떻게 바꾸는가이다.

### 15.3 Delayed Acknowledgments

Delayed ACK는 TCP가 들어오는 모든 packet마다 즉시 ACK를 보내지 않고, 짧은 시간 기다렸다가 reverse direction data와 ACK를 함께 보내려는 기법이다. 이것이 가능한 이유는 TCP ACK가 cumulative ACK이기 때문이다. ACK number는 지금까지 연속적으로 받은 byte 범위의 다음 byte를 가리키므로, receiver는 여러 segment를 받은 뒤 하나의 ACK로 누적 수신 상태를 알릴 수 있다.

Delayed ACK의 설계 이유는 분명하다. pure ACK packet을 줄이면 network traffic이 줄고, bulk transfer에서는 흔히 data segment 2개당 ACK 1개 정도의 비율이 가능하다. 하지만 ACK를 너무 오래 미루면 sender가 loss로 오해해 불필요한 retransmission을 시작할 수 있다. Host Requirements RFC는 delayed ACK를 구현할 수 있지만 delay는 500ms 미만이어야 한다고 요구하고, 많은 구현은 최대 약 200ms를 사용한다.

운영체제별 knob은 암기 대상은 아니지만, 구현이 단일하지 않다는 점은 중요하다. Linux는 ACK every segment에 가까운 quickack mode와 delayed ACK mode를 동적으로 오갈 수 있고, macOS는 `net.inet.tcp.delayed_ack`, Windows는 `TcpAckFrequency`, `TcpDelAckTicks` 같은 설정으로 ACK 빈도와 timer를 조절할 수 있다. 즉 delayed ACK는 TCP의 보편적 아이디어지만, 실제 packet trace에서는 host stack 설정에 따라 다르게 보인다.

### 15.4 Nagle Algorithm

Nagle algorithm은 tinygram 문제를 줄이기 위한 알고리즘이다. tinygram은 payload에 비해 header overhead가 큰 작은 TCP/IP packet이다. 예를 들어 ssh keystroke 하나가 IPv4에서 TCP/IP header 40 bytes와 encrypted payload 48 bytes를 포함한 약 88-byte packet으로 나가면, useful application data에 비해 overhead가 크다. LAN에서는 큰 문제가 아닐 수 있지만, WAN에서는 작은 packet이 congestion과 capacity 낭비를 키울 수 있다.

Nagle algorithm의 규칙은 간단하다.

- TCP connection에 아직 ACK되지 않은 outstanding data가 있으면, SMSS(Sender Maximum Segment Size)보다 작은 새 segment는 즉시 보내지 않는다.
- 작은 application write들은 TCP가 모아 두었다가 outstanding data에 대한 ACK가 도착하면 하나의 segment로 보낸다.
- 결과적으로 small-segment 전송은 stop-and-wait처럼 보이고, ACK가 돌아오는 속도, 즉 RTT가 small packet sending rate를 조절한다.

이 알고리즘의 장점은 self-clocking이다. ACK가 빠르게 돌아오는 low-RTT LAN에서는 사용자가 체감하기 어려울 만큼 빨리 진행되고, high-delay WAN에서는 자연스럽게 tinygram 수가 줄어든다. 단점은 명확하다. Nagle enabled 상태에서는 한 번에 outstanding small packet을 하나만 허용하므로, interactive exchange가 RTT 단위로 계단식 진행될 수 있다.

Figure 15-4와 Figure 15-5의 ssh 비교에서 RTT가 약 190ms일 때 Nagle disabled는 19 packets, 약 0.58s였고, Nagle enabled는 11 packets, 약 0.80s였다. packet 수는 줄었지만, request/response가 0.0, 0.19, 0.38, 0.57s처럼 RTT 간격에 맞춰 lockstep으로 진행되면서 총 지연은 늘었다. Figure 15-6은 이 차이를 한눈에 보여준다.

![Figure 15-6](@/assets/images/cs-tcp-ip-illustrated-273-figure-15-6-page-737.png)
*Figure 15-6 · PDF p. 737 · Nagle disabled/enabled에서 small packet 수와 delay가 달라지는 비교*

### 15.4.1 Delayed ACK and Nagle Algorithm Interaction

Delayed ACK와 Nagle algorithm은 각각 따로 보면 합리적이지만, 함께 쓰이면 나쁜 상호작용이 생길 수 있다. 핵심은 양쪽이 서로를 기다리는 상황이다.

1. client는 delayed ACK를 사용한다.
2. server는 Nagle algorithm을 사용한다.
3. client request에 대해 server response가 full-size packet 하나와 small packet 하나로 나뉜다.
4. client는 받은 packet에 대한 ACK를 잠깐 미루고, reverse direction data에 piggyback할 기회를 기다린다.
5. server는 outstanding small packet에 대한 ACK가 오기 전까지 Nagle 규칙 때문에 추가 small response를 보내지 못한다.
6. 결국 client는 ACK할 data를 미루고, server는 ACK가 올 때까지 data를 미루는 temporary deadlock에 들어간다.

이 deadlock은 영구적이지 않다. delayed ACK timer가 만료되면 client가 ACK를 보내고 server는 다시 보낼 수 있다. 문제는 timer가 깨질 때까지 transfer가 idle이 된다는 점이다. interactive application에서는 이 짧은 정지가 사용자에게 지연으로 보일 수 있다.

![Figure 15-7](@/assets/images/cs-tcp-ip-illustrated-274-figure-15-7-page-738.png)
*Figure 15-7 · PDF p. 738 · delayed ACK와 Nagle algorithm 조합이 만드는 temporary deadlock*

### 15.4.2 Disabling the Nagle Algorithm

Nagle algorithm은 작은 packet 수를 줄이는 좋은 기본값이지만, 모든 application에 맞지는 않는다. remote display의 mouse movement/keystroke, multiplayer online game의 character movement처럼 causality와 feedback delay가 중요한 경우에는 작은 update라도 즉시 보내야 한다. 이런 application은 packet efficiency보다 latency를 우선하므로 Nagle을 끄는 편이 낫다.

Berkeley sockets API에서는 application이 `TCP_NODELAY` option으로 Nagle algorithm을 disable할 수 있다. Host Requirements RFC도 이를 끌 수 있는 기능을 요구한다. Windows처럼 system-wide 설정이 있는 구현도 있지만, 정리 관점에서는 `TCP_NODELAY = latency-sensitive small writes에서 Nagle의 stop-and-wait 지연을 피하기 위한 선택지`로 기억하면 된다.

### 15.5 Flow Control and Window Management

TCP connection은 bidirectional이다. 한 방향으로 data가 흐르면 반대 방향 segment에는 그 data에 대한 ACK number와 window advertisement가 실려 돌아온다. 그리고 반대 방향 data도 동일하게 자기 Sequence Number, ACK Number, Window Size 정보를 가진다. connection establishment 뒤의 거의 모든 TCP segment는 유효한 Sequence Number, ACK Number, Window Size field를 포함한다.

![Figure 15-8](@/assets/images/cs-tcp-ip-illustrated-275-figure-15-8-page-739.png)
*Figure 15-8 · PDF p. 739 · TCP 양방향 data flow와 ACK/window advertisement의 대응*

Window Size field는 segment를 보내는 쪽이 `reverse direction으로 받아들일 수 있는 receive buffer의 빈 공간`을 byte 단위로 광고하는 값이다. TCP header의 Window Size field 자체는 16 bits라 기본적으로 65,535 bytes가 상한이지만, Chapter 13의 Window Scale option(WSCALE/WSOPT)을 사용하면 더 큰 advertised window를 표현할 수 있다.

중요한 관계식은 다음과 같다.

```text
receiver가 받아들일 수 있는 마지막 sequence 범위
= ACK Number + Window Size
  (Window Scale 사용 시 scale 적용)
```

application이 TCP receive queue에서 data를 빨리 consume하면 Window Size는 크게 변하지 않는다. 반대로 application이 느리거나 다른 일을 하느라 data를 읽지 않으면 TCP가 이미 ACK한 data가 receive buffer에 쌓이고, 새 data를 받을 빈 공간이 줄어든다. 이때 Window Size field가 감소한다. 빈 공간이 완전히 없어지면 receiver는 zero window를 광고해 sender가 새 data 전송을 멈추게 한다.

### 15.5.1 Sliding Windows

TCP endpoint는 각 active connection마다 send window structure와 receive window structure를 유지한다. 여기서 window는 packet 개수가 아니라 byte sequence number 범위로 관리된다. 그래서 TCP sliding window를 이해할 때는 `몇 개 packet을 보낼 수 있나`보다 `어떤 byte sequence range가 ACK됨/전송됨/전송 가능함/전송 불가함으로 나뉘는가`가 중요하다.

Sender-side sliding window는 다음 값을 중심으로 움직인다.

| 항목 | 의미 |
|---|---|
| `SND.UNA` | send unacknowledged, 아직 ACK되지 않은 가장 작은 sequence number이자 sender window의 left edge |
| `SND.WND` | receiver가 광고한 offered window 크기 |
| `SND.NXT` | 다음에 보낼 sequence number |
| `usable window` | 지금 즉시 더 보낼 수 있는 byte 수 |

```text
usable window = SND.UNA + SND.WND - SND.NXT
```

![Figure 15-9](@/assets/images/cs-tcp-ip-illustrated-276-figure-15-9-page-741.png)
*Figure 15-9 · PDF p. 741 · sender-side sliding window의 ACKed/in-flight/usable/cannot-send 영역*

Window edge의 움직임에는 세 용어가 붙는다.

- `window closes`: left edge가 오른쪽으로 이동한다. 이미 보낸 data가 ACK되며 acknowledged 영역이 늘어나는 상황이다.
- `window opens`: right edge가 오른쪽으로 이동한다. receiver application이 data를 읽어 receive buffer 공간이 생기고, sender가 더 보낼 수 있다.
- `window shrinks`: right edge가 왼쪽으로 이동한다. RFC1122는 이를 강하게 discouraged하지만 TCP는 처리할 수 있어야 한다. 뒤의 Silly Window Syndrome(SWS) 예시에서 관련 상황이 나온다.

incoming segment가 올 때마다 TCP sender는 ACK number와 window advertisement를 함께 보고 window를 조정한다. ACK number는 cumulative ACK라 뒤로 가지 않으므로 left edge는 왼쪽으로 이동할 수 없다. ACK가 전진하고 advertised window가 그대로면 window가 slide/advance한다. ACK가 전진하는데 advertised window가 줄면 left edge가 right edge에 가까워지고, 두 edge가 만나면 zero window가 된다.

Receiver-side sliding window는 sender 쪽보다 단순하다. receiver는 `이미 받았고 ACK한 byte`, `받으면 저장할 수 있는 byte`, `window 밖이라 받을 수 없는 byte`를 구분한다.

| 항목 | 의미 |
|---|---|
| `RCV.NXT` | 다음에 기대하는 sequence number, receive window의 left edge |
| `RCV.WND` | 받을 수 있는 receive window 크기 |
| `RCV.NXT + RCV.WND` | receive window의 right edge |

![Figure 15-10](@/assets/images/cs-tcp-ip-illustrated-277-figure-15-10-page-742.png)
*Figure 15-10 · PDF p. 742 · receiver-side sliding window와 duplicate/out-of-window discard 기준*

receiver는 `RCV.NXT`보다 작은 sequence number를 duplicate로 버리고, `RCV.NXT + RCV.WND`를 넘는 byte는 scope 밖이므로 버린다. window 안에 들어온 byte는 저장할 수 있지만, cumulative ACK number 자체는 left edge에서 연속적으로 채워진 data가 도착할 때만 전진한다. 중간 이후의 in-window segment는 SACK(Selective ACK) option으로 별도 표시할 수 있지만, 기본 ACK number가 전진하려면 contiguous byte stream이 left edge부터 채워져야 한다.

### 15.5.2 Zero Windows and the TCP Persist Timer

Zero window는 receiver가 advertised window를 0으로 보내 sender에게 새 data 전송을 멈추라고 알리는 상태다. receiver application이 다시 buffer를 비우면 receiver는 window update를 보내 data 전송을 재개할 수 있음을 알린다.

여기서 subtle한 문제가 생긴다. window update는 보통 data를 포함하지 않는 pure ACK 형태이고, TCP data처럼 별도의 reliable delivery 대상이 아니다. 만약 zero window 뒤에 receiver가 nonzero window update를 보냈는데 그 ACK가 손실되면 다음 deadlock이 생길 수 있다.

- receiver: “나는 window를 열었으니 sender가 data를 보내겠지”라고 기다린다.
- sender: “나는 아직 zero window 상태라고 알고 있으니 window update가 오기 전까지 못 보낸다”라고 기다린다.

TCP는 이를 막기 위해 sender 쪽에서 persist timer를 사용한다. persist timer가 만료되면 sender는 window probe를 보낸다. window probe는 receiver가 반드시 ACK를 보내게 만드는 segment이고, 그 ACK에는 현재 Window Size field가 포함된다. 이렇게 sender는 lost window update가 있었더라도 receiver의 현재 window 상태를 다시 확인할 수 있다.

Window probe는 보통 1 byte data를 포함한다. data segment이므로 손실되면 TCP retransmission 대상이 될 수 있어 pure window update 손실 문제를 우회한다. 첫 probe는 대개 one RTO 뒤, 이후 probe는 exponential backoff 간격으로 보내는 방식이 권장된다. 단, 일반 retransmission은 결국 포기할 수 있지만, 정상 TCP는 window probe를 계속 보낼 수 있다는 차이가 있다. 이 차이는 뒤의 window management 공격에서 resource exhaustion 지점이 된다.

Example trace에서는 Windows 7 receiver가 application read를 20초 지연시킨다. 처음에는 receive window auto adjustment 때문에 window가 64KB 근처로 유지되지만, application이 data를 consume하지 않으므로 결국 buffer가 차고 advertised window가 줄어든다.

![Figure 15-11](@/assets/images/cs-tcp-ip-illustrated-278-figure-15-11-page-744.png)
*Figure 15-11 · PDF p. 744 · receiver application이 읽지 않을 때 ACK는 전진하지만 advertised window가 감소하는 흐름*

receiver buffer가 꽉 차면 마지막 작은 window까지 채워지고, 약 200ms 뒤 zero window advertisement가 나온다. 이후 sender는 receiver의 window가 열렸는지 확인하기 위해 5초 간격으로 여러 번 probe한다. receiver application이 다시 읽기 시작하면 window update가 두 번 전송되고, sender는 최대 64KB까지 전송 가능한 상태로 돌아가 normal data transmission을 재개한다.

![Figure 15-12](@/assets/images/cs-tcp-ip-illustrated-279-figure-15-12-page-745.png)
*Figure 15-12 · PDF p. 745 · zero window 이후 application read와 window update로 전송이 재개되는 흐름*

Figures 15-11/15-12에서 얻어야 할 정리는 네 가지다.

- sender는 항상 full window만큼 data를 보낼 필요가 없다.
- receiver segment 하나는 ACK로 left edge를 밀고, 같은 segment의 window advertisement로 right edge를 조절한다.
- advertised window size는 줄 수 있지만, right edge가 왼쪽으로 이동하는 window shrinkage는 피해야 한다.
- receiver는 window가 꽉 찰 때까지 기다려야만 ACK를 보내는 것이 아니다.

Figure 15-13의 throughput graph는 receive buffer가 충분히 크면 application이 아직 read하지 않아도 일정 시간 동안 data transfer가 꽤 진행될 수 있음을 보여준다. 그러나 buffer가 다 차고 zero window가 되면 receiver가 consume하기 전까지 throughput은 사실상 0이 된다.

### 15.5.3 Silly Window Syndrome (SWS)

Silly Window Syndrome(SWS)은 TCP 같은 byte-stream/window-based flow control에서 full-size segment 대신 작은 data segment가 계속 오가는 비효율 상태다. 작은 segment는 header 대비 payload가 작으므로 overhead가 크고, connection 전체 throughput을 나쁘게 만든다.

SWS는 양쪽 어디서든 시작될 수 있다.

- receiver-caused SWS: receiver가 application read로 아주 조금 공간이 생길 때마다 작은 advertised window를 계속 보낸다.
- sender-caused SWS: sender application이 작은 write를 반복하고 TCP가 이를 작은 segment로 계속 보낸다.

TCP는 peer가 어떤 방식으로 동작할지 미리 알 수 없으므로 sender와 receiver 양쪽 모두 SWS avoidance 규칙을 가져야 한다.

Receiver-side SWS avoidance의 규칙은 `작은 window를 광고하지 않는다`이다. 현재 advertised window보다 큰 window를 새로 광고하려면, 증가분이 다음 둘 중 작은 값 이상이 될 때까지 기다린다.

```text
min(receive MSS, receiver buffer space의 1/2)
```

이 규칙은 application이 buffer를 소비해 공간이 생겼을 때뿐 아니라, TCP가 window probe에 응답해야 할 때도 중요하다.

Sender-side SWS avoidance는 `작은 segment를 보내지 않는다`에 가깝고, Nagle algorithm과 연결된다. sender는 다음 조건 중 하나가 만족될 때만 전송한다.

| 조건 | 의미 |
|---|---|
| full-size segment 가능 | send MSS bytes를 보낼 수 있으면 보낸다. 가장 직접적인 SWS 회피 조건 |
| peer의 최대 advertised window 절반 이상 가능 | peer가 항상 작은 window를 광고하는 오래된/제한된 host도 고려 |
| 가진 data를 모두 보낼 수 있고 ACK 대기 조건이 맞음 | outstanding unacknowledged data가 없거나, 이 connection에서 Nagle algorithm이 disabled인 경우 |

여기서 “small”은 SMSS보다 작은 segment를 뜻한다. SMSS는 PMTU와 receiver MSS를 넘지 않는 최대 TCP segment payload 크기다. 즉 SWS avoidance와 Nagle algorithm은 둘 다 tiny segment를 줄이지만, SWS는 window advertisement와 application read/write 패턴까지 포함한 더 넓은 문제다.

Example에서는 Windows XP sender가 2048-byte write를 3번 수행하고, FreeBSD receiver는 3000-byte receive buffer, 15초 initial pause, 2초 간격의 256-byte read를 사용한다. receiver buffer를 일부러 채운 뒤 조금씩 읽게 만들어 receiver-side SWS avoidance와 sender-side SWS avoidance를 함께 관찰한다.

![Figure 15-14](@/assets/images/cs-tcp-ip-illustrated-281-figure-15-14-page-749.png)
*Figure 15-14 · PDF p. 749 · sender/receiver SWS avoidance와 persist timer가 얽힌 TCP transfer trace*

초기 흐름은 다음과 같다.

- connection establishment 동안 receiver는 window 3000 bytes, MSS 1460 bytes를 광고한다.
- sender는 1460-byte segment와 588-byte segment를 보내 2048-byte application write 하나를 채운다.
- receiver는 두 segment를 ACK하면서 window 952 bytes를 광고한다.
- 952 bytes는 full MSS보다 작기 때문에 sender-side SWS avoidance/Nagle 규칙이 즉시 채우지 못하게 막는다.
- sender는 persist timer가 만료될 때까지 약 5초 기다린 뒤 952 bytes를 보내 window를 채우고, receiver는 zero window를 광고한다.

이후 window probe는 1-byte segment로 나타난다. probe에 대한 ACK가 ACK number를 전진시키지 않으면 receiver가 그 byte를 보관하지 않았다는 뜻이고, ACK number가 전진하면 약간의 buffer space가 있어 probe byte가 accepted되었다는 뜻이다. 예시에서는 probe 간격이 약 2s, 4s, 8s처럼 exponential backoff를 보인다.

긴 Table 15-1의 핵심 dynamics를 압축하면 다음과 같다.

| 시점/사건 | 의미 |
|---|---|
| window 952 광고 | full MSS보다 작아 sender가 바로 채우지 않음 |
| zero window 후 probe 반복 | persist timer가 lost/nonzero window update deadlock을 방지 |
| application이 256-byte씩 read | receiver buffer가 조금씩 비지만 SWS avoidance 때문에 window update를 바로 보내지 않음 |
| 1535 bytes free | 3000-byte buffer의 절반을 넘으므로 receiver가 window update 가능 |
| 75-byte advertisement | SWS avoidance만 보면 작지만, right edge를 왼쪽으로 당기는 window shrinkage를 피하기 위해 허용 |
| sender가 75/767 bytes 전송을 지연 | sender-side SWS avoidance가 작은 offered window를 즉시 채우지 않음 |

이 예시에서 가장 중요한 우선순위는 `window shrinkage 회피가 SWS avoidance보다 강할 수 있다`는 점이다. receiver가 작은 window를 0으로 숨기고 싶어도, 이미 광고한 right edge보다 왼쪽으로 되돌아가야 한다면 TCP는 window shrinkage를 피하기 위해 작은 window advertisement를 내보낼 수 있다.

마지막으로, sender application이 세 번의 2048-byte write 뒤 close를 수행하면 sender는 ESTABLISHED에서 FIN_WAIT_1, 이어 FIN_WAIT_2로 간다. 이 상태에서 receiver가 뒤늦게 window update를 보내도 sender는 이미 FIN을 보냈고 ACK까지 받았으므로 더 보낼 data가 없다. 따라서 window update가 와도 sender가 침묵하는 이유는 flow control 문제가 아니라 TCP connection state 때문이다.

### 15.5.4 Large Buffers and Auto-Tuning

TCP throughput은 buffer 크기에 크게 영향을 받는다. receive buffer가 작으면 receiver가 빨리 window를 닫아 sender가 멈추고, send buffer가 작아도 sender가 충분히 많은 outstanding data를 유지하지 못해 성능이 나빠진다. 그래서 현대 TCP stack은 application이 지정한 receive buffer 크기를 그대로 믿기보다 OS가 큰 고정값이나 동적 계산값을 사용해 실제 buffer/window를 조절하는 경우가 많다.

Receive window auto-tuning은 connection의 bandwidth-delay product(BDP)를 계속 추정하고, advertised window가 이 값 이상이 되도록 조정하려는 기법이다. BDP는 “path에 동시에 떠 있어야 최대 처리량을 낼 수 있는 data 양”이다. Chapter 16에서 congestion control과 연결되지만, 여기서는 receiver가 sender의 전송을 불필요하게 막지 않도록 충분한 receive window를 유지하는 원리로 이해하면 된다.

```text
BDP ~= bandwidth * RTT
필요 receive window >= BDP
```

auto-tuning의 장점은 sender/receiver가 처음부터 과도하게 큰 buffer를 예약하지 않아도, connection 상태를 보며 window를 키워 최대 throughput에 접근할 수 있다는 점이다. 단, 큰 advertised window를 쓰려면 TCP Window Scale option이 제대로 동작해야 한다. 일부 firewall/site가 Window Scale option을 잘못 처리하면 aggressive auto-tuning이 오히려 문제가 될 수 있다.

Windows Vista/7과 Linux는 receive window auto-tuning을 지원한다. Linux는 sender/receiver buffer 최대값과 `tcp_rmem`, `tcp_wmem`의 min/default/max 값에 의해 auto-tuning 범위가 제한된다. 운영체제 명령 자체는 암기보다 “auto-tuning이 무한히 커지는 magic이 아니라 OS buffer limit 안에서 동작한다”는 점이 중요하다.

Example에서는 Windows XP sender가 large window/window scaling을 사용하고, Linux 2.6.11 receiver가 auto-tuning을 수행한다. receiver application은 20초 동안 read를 미룬다. connection establishment 때 receiver는 initial window 1460 bytes와 MSS 1412 bytes로 시작하고, Window Scale shift 2를 사용해 최대 usable window를 256KB 수준까지 표현할 수 있다.

![Figure 15-15](@/assets/images/cs-tcp-ip-illustrated-282-figure-15-15-page-756.png)
*Figure 15-15 · PDF p. 756 · Linux receiver auto-tuning이 ACK 진행에 맞춰 advertised window를 키우는 흐름*

trace에서 advertised window는 10712, 13536, 16360, 19184처럼 ACK마다 두 MSS 정도씩 증가한다. 이는 sender의 congestion control이 ACK를 받을수록 outstanding data를 늘리는 흐름을 따라잡기 위한 receiver 측 조정이다. 이상적인 경우 receiver advertised window는 sender의 congestion control limit보다 항상 넉넉해서, sender가 receiver window 때문에 막히지 않는다.

하지만 receiver buffer가 다 차면 auto-tuning도 제한된다. 예시에서는 application이 20초 동안 읽지 않기 때문에 window 증가가 어느 순간 멈추고 감소하다가 zero window로 간다. application이 다시 읽기 시작하면 window update가 보내지고, advertised window가 다시 증가해 이전 최고값을 넘어선다.

![Figure 15-16](@/assets/images/cs-tcp-ip-illustrated-283-figure-15-16-page-757.png)
*Figure 15-16 · PDF p. 757 · application pause로 auto-tuning이 막혔다가 read 재개 후 window가 다시 커지는 흐름*

이 Linux 구현은 인접한 application read completion 사이의 시간과 estimated RTT를 비교해 buffer size를 조정한다. RTT estimate가 증가하면 BDP가 커졌을 가능성이 있으므로 buffer도 키우지만, RTT가 작아졌다고 즉시 줄이지는 않는다. 이렇게 해야 receiver advertised window가 sender window보다 앞서가며 path capacity 증가를 막지 않는다.

작은 buffer가 왜 치명적인지는 숫자로도 보인다. RTT가 약 100ms인 cross-country path에서 64KB window로 1Gb/s network를 쓰면, 가능한 최대 130MB/s 수준 대신 약 640KB/s 정도로 제한될 수 있다. 빠른 WAN에서는 limited buffer에서 large/auto-tuned buffer로 바꾸는 것만으로 throughput이 수십 배에서 100배까지 차이 날 수 있다.

### 15.6 Urgent Mechanism

TCP urgent mechanism은 TCP header의 URG bit와 Urgent Pointer field를 사용해 일부 data를 “urgent data”로 표시하는 기능이다. Berkeley sockets API에서는 `MSG_OOB`라는 이름으로 urgent data를 보낼 수 있지만, 현대적으로는 사용이 권장되지 않는다. 특히 이름이 out-of-band(OOB)라서 헷갈리지만, TCP는 진짜 별도 out-of-band data path를 제공하지 않는다. urgent data도 TCP byte stream 안에 inline으로 실린다.

Sender application이 urgent write를 요청하면 sender TCP는 urgent mode에 들어가고, application이 urgent로 지정한 마지막 byte를 기록한다. 이후 sender가 만드는 TCP header에는 URG bit와 Urgent Pointer field가 설정된다. 이 상태는 application이 더 이상 urgent data를 쓰지 않고, urgent pointer까지의 sequence number가 receiver에게 ACK될 때까지 유지된다.

RFC6093 기준으로 Urgent Pointer는 `urgent data의 마지막 byte`가 아니라 `urgent data 다음의 첫 nonurgent byte sequence number`를 가리킨다. 오래된 RFC들 사이에는 이 의미가 모호했지만, 실제 구현 대부분이 “첫 nonurgent byte” 해석을 따랐기 때문에 RFC6093이 이를 정리했다. IPv6 jumbogram처럼 16-bit Urgent Pointer로 표현하기 어려운 경우에는 65535 값이 특별한 의미를 가질 수 있다.

Receiving TCP는 URG bit가 설정된 segment를 받으면 urgent mode에 들어간다. application은 `select()` 같은 socket API로 urgent 상태를 감지할 수 있고, receiver 쪽에서는 `MSG_OOB`로 별도 byte를 꺼내거나 `MSG_OOBINLINE`으로 regular data stream 안에 남기도록 처리할 수 있다. 현재 요구되는 방식은 urgent byte를 inline stream에 남기는 쪽이다.

Example에서는 Linux receiver의 receive window auto-tuning을 4KB 정도로 제한하고, receiver application이 10초 동안 read를 멈추게 한다. Mac OS X sender는 1024-byte write를 여러 번 수행하고, 마지막 직전에 1 byte urgent data를 쓴다. sender의 send buffer가 충분히 크므로 application은 즉시 끝나지만, 실제 TCP 전송은 receiver window/zero window 때문에 멈췄다가 재개된다.

Figure 15-17은 여섯 번의 write 뒤 receiver window가 더 이상 증가하지 않아 sender가 멈추고, time 10 이후 receiver가 읽기 시작하면서 window update로 전송이 재개되는 배경을 보여준다. 전체 packet 흐름과 urgent pointer는 Figure 15-18에서 더 잘 드러난다.

![Figure 15-18](@/assets/images/cs-tcp-ip-illustrated-285-figure-15-18-page-761.png)
*Figure 15-18 · PDF p. 761 · zero window 중 urgent mode 진입, URG bit, Urgent Pointer exit point가 보이는 전체 전송 흐름*

Urgent mode의 exit point는 TCP segment의 `Sequence Number + Urgent Pointer`로 계산된다. 중요한 제약은 TCP connection당 urgent point가 하나뿐이라는 점이다. 새 valid Urgent Pointer가 도착하면 이전 urgent pointer 정보는 덮인다. 또한 urgent pointer가 설정된 segment 자체가 반드시 urgent byte를 포함해야 하는 것은 아니다. 어떤 segment는 data 없이 urgent pointer만 포함할 수도 있고, 실제 urgent byte는 뒤/앞 흐름의 다른 segment와 연결해 해석해야 한다.

예시에서 1 byte urgent data는 relative sequence number 6145에 있고, Urgent Pointer 값 1과 Sequence Number 6145의 조합은 exit point 6146을 만든다. 즉 이 구현도 “urgent pointer는 urgent data 다음의 첫 nonurgent byte”라는 해석을 따른다.

정리하면 TCP urgent mechanism은 `빠른 별도 통로`가 아니다. byte stream 안의 특정 위치를 urgent point로 표시해 application이 특별히 처리할 수 있게 하는 낡은 메커니즘이다. 진짜 별도 OOB channel이 필요하면 일반적으로 두 번째 TCP connection을 쓰는 편이 훨씬 명확하다.

### 15.7 Attacks Involving Window Management

TCP window management 공격은 주로 resource exhaustion 형태다. 핵심 아이디어는 작은 window 또는 zero window를 이용해 상대 TCP가 connection state, send buffer, timer, memory를 오래 붙잡고 있게 만드는 것이다.

LaBrea tarpit은 TCP three-way handshake를 완료한 뒤 거의 응답하지 않거나 아주 작은 response만 보내 sender TCP를 계속 느리게 만든다. 원문에서는 이를 “attacks on attacking traffic”으로 설명한다. worm 같은 나쁜 traffic을 일부러 tarpit에 붙잡아 propagation을 늦추는 방어적 공격이다.

더 직접적인 취약점은 persist timer의 무한성이다. zero window 뒤 sender는 normal retransmission처럼 어느 순간 포기하지 않고 window probe를 계속할 수 있다. 공격자는 client-side “SYN cookies”와 비슷한 방식으로 connection state 부담을 victim server 쪽에 떠넘기고, 자신은 적은 자원으로 많은 connection을 유지하게 만들 수 있다. 여러 connection에서 persist timer 기반 대기를 강요하면 victim은 memory 같은 system resource가 고갈될 수 있다.

근본 해결은 TCP window mechanism 내부만으로 깔끔하지 않다. 원문이 언급한 실용적 대응은 resource exhaustion 징후가 보이면 다른 process나 policy가 오래 붙잡힌 TCP connection을 종료하도록 허용하는 것이다. 즉 persist timer는 correctness를 위해 필요하지만, 운영 환경에서는 connection lifetime/resource policy와 함께 관리해야 한다.

## 세부 정리

| 주제 | 핵심 |
|---|---|
| interactive communication | 작은 keystroke/write가 작은 TCP segment로 자주 나타나며 ACK, echo, PSH, encryption block size와 함께 trace를 만든다 |
| delayed ACK | cumulative ACK 덕분에 ACK를 잠깐 미뤄 data와 piggyback할 수 있지만, 너무 오래 미루면 불필요한 retransmission/latency를 만든다 |
| Nagle algorithm | outstanding unacknowledged data가 있으면 small segment를 모아 tinygram을 줄인다. WAN에서는 packet 수를 줄이지만 RTT 단위 delay를 만들 수 있다 |
| delayed ACK + Nagle | client는 ACK를 미루고 server는 ACK 전까지 small response를 못 보내 temporary deadlock이 생길 수 있다 |
| flow control | receiver가 Window Size/window advertisement로 receive buffer 여유를 알리고 sender를 제한한다 |
| sliding window | sender는 `SND.UNA`, `SND.WND`, `SND.NXT`; receiver는 `RCV.NXT`, `RCV.WND` 중심으로 byte range를 관리한다 |
| zero window/persist timer | lost window update로 deadlock이 생기지 않도록 sender가 window probe를 반복한다 |
| SWS | 작은 window 광고와 작은 segment 전송이 반복되는 비효율이며 sender-side/receiver-side avoidance가 모두 필요하다 |
| auto-tuning | BDP 추정에 맞춰 advertised window를 키워 high bandwidth/high RTT path에서 buffer 부족으로 sender가 막히지 않게 한다 |
| urgent mechanism | URG bit/Urgent Pointer로 byte stream 안의 urgent point를 표시하지만 true OOB channel은 아니다 |
| attacks | persist timer/window management의 장기 state 유지 특성이 resource exhaustion 공격면이 된다 |

## 연결 관계

- Chapter 12의 sliding window, variable window, TCP header field 개념이 이 장의 `SND.UNA`, `SND.NXT`, `SND.WND`, `RCV.NXT`, `RCV.WND` 설명으로 구체화된다.
- Chapter 13의 connection state는 SWS 예시의 FIN_WAIT_1/FIN_WAIT_2와 연결된다. window update가 와도 이미 FIN을 보낸 sender가 침묵하는 이유는 window가 아니라 state 때문이다.
- Chapter 14의 retransmission/RTO/Karn’s algorithm과 persist timer가 연결된다. persist timer도 exponential backoff를 쓰지만, normal retransmission과 달리 window probe를 계속할 수 있다.
- Chapter 16의 congestion control은 이 장의 flow control과 구분된다. flow control은 receiver buffer 보호, congestion control은 network path 보호다. auto-tuning의 BDP와 sender congestion window(cwnd) 관계가 다음 장으로 이어진다.
- Chapter 18의 security/encryption은 ssh example의 encrypted payload size, 그리고 공격 관점에서는 resource exhaustion과 연결된다.

## 오해하기 쉬운 내용

- Delayed ACK는 ACK를 생략하는 것이 아니라, cumulative ACK를 이용해 잠깐 늦추는 것이다. timer가 만료되면 ACK는 보내야 한다.
- Nagle algorithm은 “느리게 보내는 알고리즘”이 아니라 tinygram을 줄이기 위한 self-clocking 알고리즘이다. 다만 high RTT interactive flow에서는 지연으로 체감될 수 있다.
- `TCP_NODELAY`는 TCP reliability를 끄는 옵션이 아니다. Nagle algorithm을 끄는 옵션이다.
- Window Size는 sender의 send buffer 여유가 아니라, segment를 보낸 쪽이 reverse direction으로 받을 수 있는 receive buffer 여유를 광고하는 값이다.
- zero window는 connection 종료가 아니다. receiver buffer가 꽉 찼다는 flow control 신호이며, window update나 window probe 응답으로 다시 열린다.
- window update는 pure ACK일 수 있으므로 data처럼 reliable delivery가 보장되지 않는다. 그래서 persist timer/window probe가 필요하다.
- SWS avoidance와 window shrinkage avoidance가 충돌하면, window shrinkage를 피하는 쪽이 우선될 수 있다.
- TCP urgent data는 이름과 달리 진짜 out-of-band(OOB) data가 아니다. 같은 TCP byte stream 안에 있으며, Urgent Pointer는 urgent data 다음의 첫 nonurgent byte를 가리키는 것으로 이해해야 한다.

## 면접 질문

1. Delayed ACK가 가능한 이유를 cumulative ACK와 연결해서 설명해보라.
2. Nagle algorithm의 규칙과, 왜 WAN에서 packet 수는 줄이지만 interactive delay는 늘릴 수 있는지 설명해보라.
3. Delayed ACK와 Nagle algorithm이 함께 쓰일 때 temporary deadlock이 생기는 과정을 설명해보라.
4. `TCP_NODELAY`는 어떤 상황에서 쓰고, 무엇을 끄는 옵션인가?
5. TCP Window Size field는 어느 방향의 data flow를 제어하는 값인가?
6. sender-side sliding window에서 `SND.UNA`, `SND.NXT`, `SND.WND`, `usable window`의 관계식을 설명해보라.
7. receiver-side sliding window에서 `RCV.NXT`보다 작은 byte와 `RCV.NXT + RCV.WND`보다 큰 byte는 어떻게 처리되는가?
8. zero window 이후 window update가 손실되면 왜 deadlock이 생기고, persist timer가 어떻게 해결하는가?
9. Silly Window Syndrome(SWS)의 receiver-side 원인과 sender-side 원인을 각각 설명해보라.
10. receive window auto-tuning이 bandwidth-delay product(BDP)와 어떤 관계가 있는가?
11. TCP urgent mechanism이 true OOB가 아닌 이유와 Urgent Pointer의 의미를 설명해보라.
12. persist timer가 resource exhaustion 공격에 이용될 수 있는 이유는 무엇인가?
