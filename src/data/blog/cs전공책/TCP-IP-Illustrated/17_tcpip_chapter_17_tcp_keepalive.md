---
title: "TCP Keepalive"
order: 17
pubDatetime: 2026-05-17T00:00:00+09:00
modDatetime: 2026-05-17T00:00:00+09:00
description: "TCP/IP Illustrated 정리: TCP Keepalive"
tags:
  - "ComputerNetwork"
  - "CS"
  - "TCPIP"
---

## 개요

TCP keepalive는 idle TCP connection에서 상대 peer가 아직 살아 있는지 TCP layer가 probe하는 optional mechanism이다. 기본 TCP 설계에서는 idle connection 위로 아무 packet도 흐르지 않는다. 양쪽 application이 data를 보내지 않으면 TCP endpoint끼리도 polling을 하지 않으므로, 이론적으로는 router가 중간에 crash/reboot되거나 link가 잠시 내려갔다 올라와도 양 endpoint host가 reboot되거나 IP address를 바꾸지 않는 한 TCP connection state는 계속 ESTABLISHED로 남아 있을 수 있다.

이 설계는 “idle 상태에서는 network에 불필요한 traffic을 만들지 않는다”는 장점이 있지만, 현실의 Internet에서는 두 가지 문제가 생긴다. 하나는 peer host가 crash하거나 사라졌는데 local endpoint가 그 사실을 모르는 half-open connection이고, 다른 하나는 NAT 같은 stateful middlebox가 inactivity timeout으로 mapping state를 지워버리는 문제다. TCP keepalive는 이 두 상황에서 peer reachability를 확인하거나 최소한의 traffic을 흘려 state를 유지하기 위해 쓰인다.

## 핵심 개념

### 17.1 Introduction

TCP keepalive는 user data stream의 내용을 바꾸지 않고 peer를 건드려 보는 probe다. Keepalive timer가 만료되면 keepalive probe를 보내고, peer TCP는 ACK로 응답한다. 중요한 점은 keepalive가 TCP specification의 필수 기능이 아니라는 것이다. RFC1122는 keepalive가 transient Internet failure 중에도 정상 connection을 끊을 수 있고, 불필요한 bandwidth를 쓰며, packet 단위 과금 path에서는 비용을 만들 수 있다는 이유로 조심스럽게 다룬다. 그럼에도 대부분의 TCP implementation은 keepalive 기능을 제공한다.

Keepalive가 논쟁적인 이유는 계층 책임의 문제다. “상대가 살아 있는지 polling하는 것은 application이 해야 한다”는 입장에서는 TCP keepalive가 transport layer에 불필요한 정책을 넣는 것으로 보인다. 반대로 여러 application이 같은 기능을 반복 구현한다면 TCP가 공통 기능으로 제공하는 것이 편리하다. 이 때문에 keepalive는 보통 default off이고, application이 명시적으로 요청할 때만 활성화된다.

원래 keepalive는 server application이 dead client를 감지하기 위한 기능으로 유용했다. 예를 들어 Web, POP, IMAP처럼 비교적 짧은 대화형이 아닌 client를 상대하는 server가 client host crash 뒤에도 resource를 계속 묶어두는 일을 줄일 수 있다. 반면 ssh나 Windows Remote Desktop 같은 long-lived interactive session은 일시적 network failure 때문에 정상 session이 끊기는 것이 더 나쁠 수 있으므로 TCP keepalive 사용에 신중해야 한다.

오늘날 자주 나오는 예는 ssh connection과 NAT router다. 사용자가 ssh로 remote host에 접속한 뒤 노트북을 그냥 꺼버리면, server 쪽에는 client가 사라진 half-open connection이 남을 수 있다. 반대로 사용자가 밤새 ssh session을 열어두고 다음 날 계속 쓰려 할 때, NAT timeout이 TCP state mapping을 삭제하면 endpoint의 TCP state는 살아 있어도 path가 더 이상 session packet을 전달하지 못한다. TCP keepalive나 application-managed keepalive는 이런 idle gap 동안 connection 또는 NAT binding의 생존성을 확인/유지하는 데 쓰인다.

### 17.2 Description

TCP connection의 양쪽 endpoint 중 어느 쪽이든 자신의 방향에 대해 keepalive를 요청할 수 있다. Keepalive는 한쪽만, 양쪽 모두, 또는 어느 쪽도 켜지 않을 수 있으며 기본값은 off다. 동작은 세 parameter로 이해하면 된다.

| parameter | 의미 |
|---|---|
| keepalive time | connection에 activity가 없을 때 첫 keepalive probe를 보내기까지 기다리는 시간 |
| keepalive interval | probe에 응답이 없을 때 다음 probe를 반복해서 보내는 간격 |
| keepalive probes | 응답 없는 probe를 몇 번까지 허용할지 정하는 횟수 |

흐름은 다음과 같다.

```text
idle for keepalive time
=> send keepalive probe
=> if ACK arrives: reset keepalive timer
=> if no ACK: retry every keepalive interval
=> after keepalive probes failures: peer unreachable, terminate connection
```

Keepalive probe는 보통 empty segment 또는 1-byte “garbage” segment이며, sequence number는 지금까지 peer에게서 본 가장 큰 ACK number보다 1 작은 값이다. 즉 receiver 입장에서는 이미 ACK한 sequence number 아래에 있는 old byte처럼 보인다. 그래서 data stream에는 새 data가 추가되지 않지만, TCP 규칙상 receiver는 ACK을 돌려주게 된다. Probe와 그 ACK은 user-level data를 싣지 않고, probe 자체가 loss되더라도 일반 data처럼 retransmitted되지 않는다. 이 때문에 RFC1122는 단일 probe 무응답만으로 connection이 죽었다고 판단하면 안 된다고 한다.

Keepalive를 사용하는 TCP는 peer를 네 가지 상태 중 하나로 관찰한다.

| 상태 | 관찰 결과 | local TCP/application에 보이는 결과 |
|---|---|---|
| peer host가 살아 있고 reachable | probe에 정상 ACK 응답 | keepalive timer 재설정, application에는 투명 |
| peer host가 crash/down/reboot 중 | ACK 없음 | 여러 probe 실패 뒤 timeout, connection terminated |
| peer host가 crash 후 reboot 완료 | probe에 RST 응답 | connection reset, application에 “Connection reset by peer”류 error |
| peer host는 살아 있으나 network가 unreachable | ACK 없음 또는 ICMP error | TCP 관점에서는 crash와 구분 어려움, timeout 또는 ICMP 기반 error |

Graceful shutdown은 keepalive로 감지할 필요가 없다. Peer system이 정상적으로 shutdown되면 application process가 종료되고 TCP가 FIN을 보내므로, local application은 EOF를 보고 빠져나갈 수 있다. Keepalive가 의미 있는 곳은 peer가 조용히 사라졌거나, network path가 조용히 끊겼거나, 중간 state가 사라진 경우다.

Keepalive는 application에 대체로 투명하다. 상태 1에서는 application이 probe 존재를 알 필요가 없다. 그러나 상태 2, 3, 4가 판정되면 TCP가 application의 blocking read 등에 error를 반환한다. Crash/down은 보통 “Connection timed out”, reboot 후 RST는 “Connection reset by peer”, unreachable path는 ICMP 처리 방식에 따라 timeout 또는 다른 error로 보일 수 있다.

운영체제마다 parameter 이름과 기본값은 다르다. Linux는 `net.ipv4.tcp_keepalive_time`, `net.ipv4.tcp_keepalive_intvl`, `net.ipv4.tcp_keepalive_probes`를 제공하며 전형적인 기본값은 7200초, 75초, 9 probes다. FreeBSD/Mac OS X는 `net.inet.tcp.keepidle`, `net.inet.tcp.keepintvl`, `net.inet.tcp.always_keepalive` 같은 sysctl을 제공한다. Windows는 registry의 `KeepAliveTime`, `KeepAliveInterval`을 사용하며, 예시에서는 기본적으로 2시간, 1초 interval, 10 probes가 언급된다.

RFC1122가 요구하는 핵심 제약은 두 가지다. 첫째, keepalive time은 configurable해야 하며 default가 2시간보다 짧아서는 안 된다. 둘째, keepalive는 application이 요청하지 않는 한 켜져서는 안 된다. 모든 connection에 강제로 keepalive를 켜는 system-wide 설정은 편리할 수 있지만 이 원칙과 충돌할 수 있다.

### 17.2.1 Keepalive Examples

원문 예시는 앞에서 설명한 상태 2, 3, 4를 packet trace로 보여준다. 상태 1, 즉 peer가 살아 있고 reachable한 경우도 예시 안에 함께 나타난다. 핵심은 keepalive가 “새 data를 보내는 packet”이 아니라 “이미 ACK된 sequence number 주변을 건드려 ACK을 유도하는 probe”라는 점이다.

### 17.2.1.1 Other End Crashes

첫 예시는 server host가 crash하고 reboot하지 않는 상황을 흉내 낸다. Windows client에서 `KeepAliveTime`을 7000ms로 줄이고, `TCPKeepAlive=yes` 옵션으로 Linux server에 ssh 접속한 뒤, server network cable을 뽑아 client가 server crash처럼 보게 만든다. Windows의 `KeepAliveInterval` 기본값은 1초이고, 10개의 keepalive probe가 응답 없이 지나가면 connection을 죽인다.

Figure 17-1은 이 동작을 가장 잘 보여준다. Connection이 idle해진 뒤 ACK을 받는 동안에는 7초마다 keepalive가 나간다. Cable을 뽑은 뒤에는 keepalive ACK이 돌아오지 않으므로 sender는 1초 간격으로 빠르게 probe를 반복하고, 총 10개의 unacknowledged keepalives 뒤에 connection을 종료한다.

![Figure 17-1](@/assets/images/307_figure_17_1_page_837.png)
*Figure 17-1 · PDF p. 837 · server가 crash/down된 것처럼 보일 때 keepalive probe가 반복되고 최종 RST로 종료되는 흐름*

Trace에서 packets 1, 3, 5, 7, 14, 16, 18, 20, 22-31이 keepalive이고, packets 2, 4, 6, 8, 15, 17, 19, 21이 대응 ACK이다. ACK이 정상적으로 돌아오는 동안에는 7초 간격이 유지된다. Packet 22 이후 ACK이 없자 packet 23부터 1초 간격으로 probe가 반복된다. 마지막 packet 32는 connection termination을 알리는 RST지만, server cable이 빠져 있으므로 server는 이 RST를 듣지 못한다.

사용자는 다음처럼 본다.

```text
Write failed: Connection reset by peer
```

이 메시지는 connection이 끝났다는 점에서는 맞지만, 원인 표현은 정확하지 않다. 실제로는 peer가 reset을 보낸 것이 아니라, local sender가 peer 무응답을 근거로 connection을 종료한 것이다. 즉 keepalive error message는 운영자가 장애 방향을 해석할 때 약간 오해를 만들 수 있다.

이 trace에는 keepalive 외에도 두 가지 연결 포인트가 있다. 첫째, server는 Chapter 14의 DSACK을 사용해 이전에 받은 in-window segment 범위를 ACK에 싣는다. 둘째, time 26.09 근처의 작은 data exchange는 ssh key press 하나와 echo이며, encrypted data라 packet payload가 48 bytes로 보인다. Echoed character packet이 즉시 ACK되지 않아 Linux server가 200ms minimum RTO 뒤 spurious retransmission을 수행하는데, 이는 Chapter 15의 Nagle algorithm과 delayed ACK 상호작용에서 본 것과 비슷하게 작은 packet과 delayed ACK이 불필요한 지연/재전송을 만들 수 있음을 보여준다.

### 17.2.1.2 Other End Crashes and Reboots

두 번째 예시는 peer가 crash한 뒤 reboot까지 끝난 경우다. 처음에는 이전 예시처럼 TCP keepalive가 켜진 connection을 만들고, `KeepAliveTime`을 120,000ms, 즉 2분으로 둔다. 첫 keepalive probe는 정상 ACK된다. 그 뒤 server를 network에서 분리하고 reboot한 다음 다시 연결한다. 이때 server의 TCP stack은 reboot 전 connection state를 잃었으므로, 같은 4-tuple에 대해 들어온 keepalive probe를 기존 connection의 일부로 인식하지 못한다.

![Figure 17-2](@/assets/images/308_figure_17_2_page_839.png)
*Figure 17-2 · PDF p. 839 · server가 reboot되어 connection state를 잃은 뒤 keepalive probe에 RST로 응답하는 흐름*

Figure 17-2에서 client는 time 123.47에 첫 keepalive probe를 보내고 ACK을 받는다. 이후 server가 disconnect/reboot/reconnect된다. 120초 뒤 time 243.47에 두 번째 keepalive probe가 server에 도달하지만, server는 이 connection을 알지 못하므로 RST를 보낸다. Client는 RST를 보고 connection이 더 이상 active하지 않음을 알며, 사용자에게는 앞 예시와 같은 “Connection reset by peer”류 error가 보인다.

이 예시의 핵심은 crash/down과 crash-reboot가 TCP 관찰 결과에서 다르다는 점이다. Peer가 완전히 down되어 있거나 path가 끊기면 아무 응답이 없어서 timeout 경로로 간다. 반면 peer가 reboot 후 살아 있으면, 해당 connection state가 없다는 사실을 RST로 명확히 알릴 수 있다.

### 17.2.1.3 Other End Is Unreachable

세 번째 예시는 server host 자체는 crash하지 않았지만, keepalive probe가 오가는 동안 network path가 unreachable해진 경우다. 중간 router가 crash했거나 phone line/WAN link가 일시적으로 내려간 상황과 같다. 원문은 Mac OS X client에서 `net.inet.tcp.keepidle=75000`으로 첫 keepalive time을 75초로 줄이고, `sock -K`로 LDAP server(port 389)에 연결한 뒤 network를 끊는 방식으로 이를 보여준다.

![Figure 17-3](@/assets/images/309_figure_17_3_page_840.png)
*Figure 17-3 · PDF p. 840 · WAN path가 끊긴 뒤 keepalive probe가 ACK 없이 반복되고 timeout으로 종료되는 흐름*

Figure 17-3에서는 initial three-way handshake 뒤 connection이 idle 상태가 된다. 약 75초에 첫 keepalive가 나가고 ACK된다. 이것은 `net.inet.tcp.keepidle` 값으로 트리거된 정상 상태 확인이다. 곧이어 network가 끊기고, 다음 keepalive는 75초 뒤, 즉 `net.inet.tcp.keepintvl` 값에 맞춰 time 150에 전송된다. 이후 packets 7-14도 ACK 없이 반복된다. Server는 실제로 살아 있지만 network가 packet을 전달하지 못하므로 client 입장에서는 server crash와 구분할 수 없다.

마지막에는 아홉 번째 unacknowledged keepalive probe 뒤 75초가 더 지나 client가 포기하고 RST를 보낸다. 하지만 이 RST도 network가 끊긴 상태이므로 server에는 도달하지 않는다. Client application에는 `recv error: Operation timed out`처럼 timeout error가 반환된다.

이 예시는 keepalive의 가장 중요한 한계를 보여준다. TCP keepalive는 “peer process가 죽었는지”, “peer host가 죽었는지”, “network path만 끊겼는지”를 본질적으로 구분하지 못한다. TCP가 직접 볼 수 있는 것은 probe에 대한 response가 있느냐, response가 RST냐, 또는 ICMP error가 오느냐뿐이다. 따라서 keepalive는 liveness oracle이 아니라, 일정 시간 이상 통신 확인이 안 되면 connection을 정리하는 보수적 heuristic에 가깝다.

### 17.3 Attacks Involving TCP Keepalives

TCP keepalive와 application-managed keepalive는 보안 성질이 다르다. 예를 들어 ssh version 2에는 server alive messages와 client alive messages라는 application-level keepalive가 있다. 이 message들은 encrypted channel 위에서 application data로 전달된다. 반면 TCP keepalive는 user-level data를 거의 또는 전혀 포함하지 않는 TCP-level probe이므로, application encryption의 보호를 받기 어렵다.

그 결과 TCP keepalive와 keepalive ACK은 spoofing될 수 있다. 공격자가 keepalive response를 위조하면 victim endpoint는 peer가 아직 살아 있다고 믿고 resource를 더 오래 유지할 수 있다. 이 공격은 connection을 직접 탈취하는 공격만큼 극적이지는 않지만, server resource exhaustion이나 stale connection 유지 같은 운영 문제를 만들 수 있다.

또 다른 문제는 fingerprinting이다. TCP keepalive는 data segment retransmission에 쓰는 dynamically adjusted retransmission timer(RTO)가 아니라, 앞에서 본 `keepalive time`, `keepalive interval`, `keepalive probes` 같은 configuration parameter 기반 timer로 동작한다. Passive observer는 keepalive의 존재와 inter-arrival time을 보고 sender system 종류나 설정, 또는 downstream router가 traffic을 forwarding하고 있는지 같은 network topology hint를 추정할 수 있다.

| 비교 | TCP keepalive | application-managed keepalive |
|---|---|---|
| 계층 | TCP layer | application layer |
| data 포함 | user-level data 없음 또는 garbage byte | application-defined data |
| 암호화 보호 | TCP 자체는 기본 encryption 없음 | TLS/ssh 등 encrypted channel 보호 가능 |
| spoofing 저항성 | 낮음 | channel authentication이 있으면 높음 |
| 주요 용도 | TCP state/liveness 확인, NAT binding 유지 | application semantic에 맞춘 heartbeat/session check |

### 17.4 Summary

TCP keepalive는 transport layer에 heartbeat를 둘 것인지 application layer가 직접 관리할 것인지에 대한 논쟁을 남긴 기능이다. 하지만 현실적으로 popular TCP implementation은 keepalive를 제공하고, application은 필요할 때 이를 켤 수 있다. Server는 nonresponsive client를 감지해 resource를 회수할 수 있고, client는 idle connection을 유지하거나 NAT state를 살리는 데 도움을 받을 수 있다.

Keepalive의 기본 동작은 일정 시간 idle한 connection에 probe packet을 보내는 것이다. 이 probe는 보통 “garbage” byte를 포함하거나 zero-length일 수 있고, sequence number는 receiver window의 왼쪽 경계보다 1 작은 already-ACKed 위치를 사용한다. 정상 peer는 ACK으로 응답하고, reboot되어 state를 잃은 peer는 RST로 응답하며, crash 또는 unreachable path에서는 응답이 없다.

다만 keepalive는 실패 원인을 정확히 판별하는 mechanism이 아니다. 첫 두 예시에서는 keepalive가 없었다면 TCP는 peer crash 또는 crash-reboot를 영원히 모를 수 있었다. 그러나 세 번째 예시에서는 peer가 멀쩡한데 network path만 일시적으로 내려갔고, keepalive는 이를 peer crash와 유사하게 처리했다. 따라서 keepalive를 켜면 dead connection cleanup에는 도움이 되지만, transient outage 중 정상 connection을 끊을 위험도 함께 생긴다.

## 세부 정리

| 항목 | 핵심 내용 |
|---|---|
| idle TCP 기본 동작 | application data가 없으면 TCP endpoint끼리도 아무 packet을 보내지 않는다 |
| keepalive 목적 | peer liveness 확인, half-open connection cleanup, NAT/stateful middlebox binding 유지 |
| keepalive probe | already ACKed sequence number 근처를 건드리는 empty 또는 1-byte garbage segment |
| 정상 응답 | peer TCP가 ACK을 보내고 local TCP는 keepalive timer를 재설정 |
| crash/down | probe ACK이 없고, 일정 횟수 반복 뒤 timeout으로 connection 종료 |
| crash 후 reboot | peer가 connection state를 잃어 RST를 보내고 local TCP가 reset 처리 |
| unreachable network | peer는 살아 있어도 ACK이 없어 crash와 비슷하게 보일 수 있음 |
| 보안 주의 | TCP keepalive는 spoofing/fingerprinting에 취약하고, encrypted application keepalive와 다르다 |

Keepalive 판단 흐름은 다음처럼 압축할 수 있다.

```text
idle connection
=> keepalive time expires
=> send keepalive probe
   => ACK: peer reachable, timer reset
   => RST: peer reachable but connection state gone, reset local connection
   => no response: retry keepalive probes times
      => still no response: timeout/unreachable, terminate connection
```

## 연결 관계

- Chapter 7 NAT와 연결: idle connection의 NAT binding이 timeout으로 사라질 수 있어 keepalive가 binding 유지 수단으로 쓰인다.
- Chapter 13 TCP Connection Management와 연결: half-open connection, RST, FIN/EOF 차이를 이해해야 keepalive 결과를 해석할 수 있다.
- Chapter 14 TCP Timeout and Retransmission과 연결: keepalive probe는 일반 data retransmission timer(RTO)와 다르게 keepalive-specific timer를 따른다.
- Chapter 15 TCP Data Flow and Window Management와 연결: keepalive probe가 receiver left window edge 아래 sequence number를 사용해 data stream을 오염시키지 않는다는 점이 window/sequence number 이해와 이어진다.
- Chapter 18 Security와 연결: TCP keepalive는 기본적으로 encrypted/authenticated data가 아니므로, ssh의 server alive/client alive message 같은 application-level encrypted keepalive와 보안 성질이 다르다.

## 오해하기 쉬운 내용

- Idle TCP connection은 주기적으로 상태 확인 packet을 보내지 않는다. 아무 data도 없으면 TCP는 조용히 유지된다.
- TCP keepalive는 TCP 표준 필수 기능이 아니라 optional implementation feature다.
- Keepalive ACK이 없다고 peer host가 반드시 죽은 것은 아니다. Network path가 끊겼거나 ICMP가 차단되었을 수도 있다.
- “Connection reset by peer” 메시지가 항상 peer가 능동적으로 reset했다는 뜻은 아니다. Local TCP가 keepalive 실패를 근거로 connection을 정리하며 그렇게 보일 수 있다.
- Keepalive는 user data retransmission과 다르다. Probe와 ACK은 user data를 싣지 않고, probe 하나의 loss만으로 connection death를 판정하지 않는다.
- Application-managed keepalive와 TCP keepalive는 같지 않다. Application keepalive는 encrypted channel 안의 authenticated data일 수 있지만, TCP keepalive는 spoofing에 더 약하다.

## 면접 질문

1. Idle TCP connection에서는 왜 아무 packet도 흐르지 않는가?
2. TCP keepalive가 필요한 대표 상황 두 가지는 무엇인가?
3. `keepalive time`, `keepalive interval`, `keepalive probes`는 각각 무엇을 제어하는가?
4. Keepalive probe가 “largest ACK number - 1” 근처의 sequence number를 사용하는 이유는 무엇인가?
5. Peer crash, peer crash 후 reboot, network unreachable은 keepalive 결과에서 어떻게 다르게 보이는가?
6. TCP keepalive가 transient network failure 중 정상 connection을 끊을 수 있는 이유는 무엇인가?
7. TCP keepalive와 ssh의 application-level keepalive는 보안 측면에서 어떻게 다른가?
8. Keepalive spoofing과 fingerprinting은 어떤 식으로 가능해지는가?
