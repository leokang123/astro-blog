---
title: "Chapter 16. High-Speed LANs"
order: 16
pubDatetime: 2026-05-18T00:00:00+09:00
modDatetime: 2026-05-18T00:00:00+09:00
description: "Data and Computer Communications 정리: Chapter 16. High-Speed LANs"
tags:
  - "DataCommunication"
  - "CS"
---

## 개요

Chapter 16은 Chapter 15의 LAN architecture 위에 실제 high-speed LAN 기술을 얹는다. 핵심 흐름은 세 가지다. 첫째, 기존 10-Mbps Ethernet과 16-Mbps token ring으로는 modern office/client-server traffic을 감당하기 어려워져 high-speed LAN이 등장했다. 둘째, Ethernet은 IEEE 802.3 안에서 10 Mbps, 100 Mbps, 1 Gbps, 10 Gbps로 확장되었고, 낮은 속도에서는 `CSMA/CD` MAC을, 높은 속도에서는 switched technique을 중심으로 사용한다. 셋째, `Fibre Channel`은 특히 storage area network(SAN)처럼 high-speed node interconnection이 필요한 환경을 위해 switched network로 설계되었다.

이 장의 appendix는 단순 부록이 아니라 high-speed LAN을 실제로 가능하게 하는 물리 계층의 핵심이다. `4B/5B`, `MLT-3`, `8B6T`, `8B/10B`, `64B/66B` 같은 signal encoding은 high data rate를 medium 위에서 안정적으로 운반하기 위한 장치이고, performance issue와 scrambling은 빠른 LAN에서 propagation delay, frame size, utilization, clock recovery가 왜 중요해지는지 설명한다.

## 핵심 개념

| 주제 | 핵심 질문 | 반드시 남길 영어 용어 |
|---|---|---|
| Emergence of High-Speed LANs | 왜 10-Mbps급 LAN이 부족해졌는가? | server farms, power workgroups, high-speed local backbone |
| Ethernet | IEEE 802.3 Ethernet은 어떻게 MAC과 physical layer를 확장했는가? | CSMA/CD, binary exponential backoff, MAC frame, Fast Ethernet, Gigabit Ethernet, 10-Gbps Ethernet |
| Fibre Channel | 왜 storage/network 양쪽 성격을 가진 switched network가 필요한가? | Fibre Channel, fabric, N_port, F_port, FC-0~FC-4 |
| Digital Signal Encoding | high data rate에서 왜 단순 bit 전송이 어렵고 encoding이 필요한가? | 4B/5B, MLT-3, 8B6T, 8B/10B, 64B/66B |
| Performance Issues | LAN utilization은 어떤 물리적 시간 비율에 민감한가? | propagation time, frame transmission time, parameter $a$, normalized throughput |
| Scrambling | 반복 bit pattern이 왜 문제이고 어떻게 섞는가? | scrambler, descrambler, shift register, polynomial |

## 세부 정리

### 16.1 The Emergence of High-Speed LANs

High-speed LAN의 등장은 단순히 “더 빠른 선로”가 필요해서가 아니다. Office LAN의 역할이 바뀌었다. 초기 office LAN은 personal computer와 terminal을 mainframe/midrange system에 연결하거나, 부서 단위 workgroup connectivity를 제공하는 정도였다. Traffic은 비교적 가볍고, 주 용도는 file transfer와 electronic mail이었다. 이 환경에서는 Ethernet과 token ring이 충분히 잘 맞았다.

이후 LAN 요구를 바꾼 흐름은 두 가지다.

| 변화 | LAN 요구에 미친 영향 |
|---|---|
| Personal computer의 speed/computing power 증가 | graphics-intensive application, elaborate GUI, large local data processing이 늘어났다. |
| MIS 조직이 LAN을 computing platform으로 인식 | client/server computing과 intranetwork가 확산되면서 transaction-oriented environment에서 큰 data volume이 자주 이동하게 되었다. |

결과적으로 LAN은 더 많은 data volume을 처리해야 하고, interactive application 때문에 acceptable delay는 더 작아졌다. 원문은 이 요구에 대해 기존 10-Mbps Ethernet과 16-Mbps token ring이 더 이상 충분하지 않다고 설명한다.

#### High-Speed LAN 요구가 두드러지는 예

| 요구 유형 | 의미 | 왜 고속 LAN이 필요한가 |
|---|---|---|
| `centralized server farms` | 여러 client가 중앙의 다수 server에서 대량 data를 끌어오는 구조 | server 성능이 올라가면 bottleneck이 network로 이동한다. Color publishing처럼 수백 GB image data를 workstation으로 내려야 하는 환경이 대표적이다. |
| `power workgroups` | 소수의 사용자가 대용량 file을 반복적으로 공유/처리하는 협업 집단 | software development test, CAD simulation처럼 data를 여러 workstation에 배포하고 수정하는 cycle이 빠르게 반복된다. |
| `high-speed local backbone` | 사이트 내부에 늘어난 여러 LAN을 고속으로 상호 연결하는 backbone | LAN 수와 processing demand가 늘면 부서별 LAN 사이를 묶는 backbone 자체가 병목이 된다. |

#### High-Speed LAN 접근의 큰 분류

원문은 high-speed local networking의 대표 접근을 `Fast Ethernet/Gigabit Ethernet`, `Fibre Channel`, `high-speed wireless LANs`로 나눈다. Chapter 16은 Ethernet과 Fibre Channel을 다루고, wireless LAN은 Chapter 17로 넘긴다.

| Approach | Data rate | Transmission media | Access method | Standard/association |
|---|---:|---|---|---|
| `Fast Ethernet` | 100 Mbps | UTP, STP, optical fiber | CSMA/CD | IEEE 802.3 |
| `Gigabit Ethernet` | 1 Gbps, 10 Gbps | UTP, shielded cable, optical fiber | switched | IEEE 802.3 |
| `Fibre Channel` | 100 Mbps-3.2 Gbps | optical fiber, coaxial cable, STP | switched | Fibre Channel Association |
| `Wireless LAN` | 1 Mbps-54 Mbps | 2.4-GHz, 5-GHz microwave | CSMA/polling | IEEE 802.11 |

여기서 Ethernet 계열의 설계 전략은 기존 10-Mbps CSMA/CD investment를 보존하면서 더 높은 data rate와 새로운 physical medium을 정의하는 것이다. 반면 Fibre Channel은 LAN이라기보다 high-speed switched interconnect에 가까우며, 특히 storage와 processor 사이의 고속 연결 요구를 염두에 둔다.

### 16.2 Ethernet

High-speed LAN에서 가장 널리 쓰이는 계열은 IEEE 802.3 committee가 발전시킨 `Ethernet`이다. IEEE 802.3은 다른 LAN 표준처럼 `medium access control (MAC)` layer와 physical layer를 함께 정의한다. 이 구간은 먼저 MAC, 특히 `CSMA/CD`가 왜 그런 모양이 되었는지부터 잡는다.

#### IEEE 802.3 Medium Access Control

`CSMA/CD (Carrier Sense Multiple Access with Collision Detection)`는 random access 또는 contention technique이다. Random access라는 말은 station마다 미리 정해진 transmission schedule이 없다는 뜻이고, contention이라는 말은 여러 station이 shared medium 사용 시간을 경쟁한다는 뜻이다.

CSMA/CD는 갑자기 등장한 것이 아니라 `ALOHA`, `slotted ALOHA`, `CSMA`의 비효율을 줄이는 방향으로 발전했다.

| 방식 | 동작 | 핵심 한계 또는 개선 |
|---|---|---|
| `pure ALOHA` | station이 언제든 frame을 transmit하고 ACK를 기다린다. ACK가 없으면 collision/noise로 보고 재전송한다. | 단순하지만 collision이 load와 함께 급증해 maximum channel utilization이 약 18%에 그친다. |
| `slotted ALOHA` | channel time을 frame transmission time 크기의 slot으로 나누고, slot boundary에서만 transmit한다. | overlap이 완전 충돌 형태로 제한되어 utilization이 약 37%까지 오른다. 대신 station synchronization이 필요하다. |
| `CSMA` | transmit 전에 medium을 listen하여 carrier가 있는지 감지한다. Idle이면 transmit하고 busy이면 기다린다. | propagation delay가 frame transmission time보다 작을 때 ALOHA보다 훨씬 효율적이다. |
| `CSMA/CD` | transmit 중에도 medium을 계속 listen하여 collision을 detect하면 jam signal 후 중단한다. | damaged frame 전체를 끝까지 보내는 낭비를 줄인다. |

CSMA가 효과적인 이유는 LAN에서 station 간 propagation delay가 frame transmission time에 비해 작을 수 있기 때문이다. 한 station이 frame을 시작하면 다른 station이 비교적 빨리 medium busy 상태를 알게 되므로, collision은 주로 거의 동시에 transmit을 시작한 경우에 집중된다. 이때 frame이 길고 propagation delay가 짧을수록 utilization이 높아진다.

#### CSMA Persistence

CSMA에서는 “medium이 busy일 때 station이 어떻게 기다릴 것인가”가 별도 algorithm이다. Figure 16.1은 세 가지 persistence 전략을 비교한다.

![Figure 16.1](@/assets/images/data-communication-206-figure-16-1-page-506.png)
*Figure 16.1 · PDF p. 506 · nonpersistent, 1-persistent, p-persistent CSMA의 대기/backoff 차이*

| Persistence | Busy medium에서의 행동 | 장점 | 단점 |
|---|---|---|---|
| `nonpersistent CSMA` | random delay 후 다시 listen한다 | 같은 시점에 재시도할 확률을 낮춰 collision을 줄인다 | transmission 종료 후 기다리는 station이 있어도 medium이 idle로 남는 시간이 생긴다 |
| `1-persistent CSMA` | medium이 idle이 되는 순간 즉시 transmit한다 | idle channel time을 줄이고 low load에서 빠르다 | 여러 station이 기다리면 collision이 사실상 보장된다 |
| `p-persistent CSMA` | idle이 되면 probability `p`로 transmit하고, `1-p`로 one time unit delay한다 | nonpersistent와 1-persistent의 절충 | heavy load에서 `np > 1`이면 instability와 연쇄 collision이 생기고, `p`를 작게 하면 low load delay가 커진다 |

`p-persistent`의 핵심은 `np`이다. Transmission이 끝났을 때 `n`개 station이 대기 중이고 각 station이 probability `p`로 transmit한다면, 기대 transmit station 수는 `np`이다. `np > 1`이면 평균적으로 둘 이상이 동시에 transmit해 collision이 생긴다. Heavy load를 안정화하려면 `p`를 작게 해야 하지만, low load에서는 혼자 기다리는 station도 평균 `1/p`번의 slot 시도를 거쳐야 하므로 delay가 커진다.

#### CSMA/CD 동작

CSMA만 사용하면 두 frame이 collide한 뒤에도 두 damaged frame이 끝까지 medium을 차지할 수 있다. `CSMA/CD`는 station이 transmit하는 동안에도 medium을 감시하게 하여 이 낭비를 줄인다.

동작 규칙은 다음 순서로 볼 수 있다.

| Step | CSMA/CD rule |
|---|---|
| 1 | medium이 idle이면 transmit한다. Busy이면 계속 listen한다. |
| 2 | busy medium이 idle이 되면 즉시 transmit한다. IEEE 802.3은 기본적으로 1-persistent 방식이다. |
| 3 | transmission 중 collision이 detect되면 짧은 `jamming signal`을 보내 모든 station이 collision을 알게 한다. |
| 4 | 전송을 중단하고 random `backoff` 이후 다시 시도한다. |

![Figure 16.2](@/assets/images/data-communication-207-figure-16-2-page-508.png)
*Figure 16.2 · PDF p. 508 · baseband bus에서 propagation delay 때문에 collision detection이 늦게 일어나는 과정*

Figure 16.2의 핵심은 collision이 “즉시 모든 station에 보이는 사건”이 아니라는 점이다. Station A가 D 방향으로 transmit을 시작했는데, A의 signal leading edge가 아직 C에 도달하지 않았다면 C는 medium이 idle이라고 생각하고 transmit할 수 있다. C는 A의 signal을 받는 순간 collision을 detect하고 중단하지만, A가 collision을 알기까지는 collision effect가 A까지 다시 propagate해야 한다. 따라서 collision detection에 필요한 시간은 최대 `2 × end-to-end propagation delay`이다.

이 때문에 CSMA/CD LAN에서는 frame이 너무 짧으면 안 된다. Frame transmission이 collision이 되돌아오기 전에 끝나면 sender는 collision을 detect하지 못하고, CSMA/CD는 비효율적 CSMA처럼 동작한다. 즉 minimum frame length는 collision detection과 직접 연결된다.

#### Binary Exponential Backoff

IEEE 802.3이 1-persistent를 쓰는 것은 처음 보면 이상해 보인다. 1-persistent는 channel이 idle이 되면 모든 대기 station이 달려들어 collision을 만들 수 있기 때문이다. 이를 안정화하는 장치가 `binary exponential backoff`이다.

Repeated collision이 발생하면 station은 계속 재시도하되, 처음 10번의 retransmission attempt 동안 random delay의 mean value를 매번 두 배로 늘린다. 그 뒤 6번은 같은 mean value를 유지하고, 16번 실패하면 포기하고 error를 보고한다. Congestion이 심할수록 station들이 더 크게 물러나므로 collision probability가 줄어든다.

이 조합의 trade-off는 다음과 같다.

| 상황 | 효과 |
|---|---|
| Low load | 1-persistence 덕분에 station이 idle channel을 즉시 잡을 수 있다. |
| High load | binary exponential backoff가 collision 후 재시도를 분산시켜 stability를 높인다. |
| Fairness 문제 | backoff가 적게 걸린 station이 오래 기다린 station보다 먼저 transmit할 수 있어 last-in first-out 효과가 생길 수 있다. |

Collision detection 자체도 medium 구조에 따라 다르다. Baseband bus에서는 collision이 single transmitter보다 큰 voltage swing을 만들기 때문에 transmitter tap point의 signal level로 감지한다. 하지만 긴 coaxial cable에서는 멀리 있는 station의 signal이 attenuate되어 threshold를 넘지 못할 수 있으므로 segment length 제한이 중요하다. Twisted-pair star topology에서는 hub의 input activity를 logic으로 본다. 한 hub에서 둘 이상의 input에 signal이 있으면 collision으로 보고 `collision presence signal`을 내보낸다.

#### IEEE 802.3 MAC Frame

Figure 16.3은 IEEE 802.3 frame format을 보여준다. 이 format은 Chapter 15의 generic MAC frame을 Ethernet 방식으로 구체화한 것이다.

![Figure 16.3](@/assets/images/data-communication-208-figure-16-3-page-510.png)
*Figure 16.3 · PDF p. 510 · IEEE 802.3 MAC frame field와 octet 길이*

| Field | 길이 | 의미 |
|---|---:|---|
| `Preamble` | 7 octets | alternating 0/1 pattern으로 receiver가 bit synchronization을 잡는다. |
| `Start Frame Delimiter (SFD)` | 1 octet | `10101011` pattern으로 실제 frame 시작을 표시한다. |
| `Destination Address (DA)` | 6 octets | unique physical address, group address, global address가 될 수 있다. |
| `Source Address (SA)` | 6 octets | frame을 보낸 station을 지정한다. |
| `Length/Type` | 2 octets | IEEE 802.3이면 LLC data 길이, 기존 Ethernet이면 EtherType 성격으로 쓰인다. |
| `LLC data` | 0-1500 octets | LLC가 제공한 data unit이다. |
| `Pad` | 0 octets 이상 | proper collision detection을 위해 frame이 충분히 길도록 채운다. |
| `Frame Check Sequence (FCS)` | 4 octets | preamble, SFD, FCS를 제외한 field에 대한 32-bit CRC이다. |

Preamble과 SFD를 제외한 maximum frame size는 1518 octets이다. 여기서 `Pad`가 있는 이유는 단순 정렬이 아니라 CSMA/CD의 collision detection 시간 조건을 만족시키기 위해서다.

#### IEEE 802.3 10-Mbps Specifications

IEEE 802.3의 10-Mbps Ethernet physical configuration은 여러 대안으로 정의된다. 이것은 장점과 단점이 동시에 있다. 장점은 standard가 evolving technology와 다양한 site requirement에 대응할 수 있다는 점이고, 단점은 customer/vendor가 많은 option을 이해해야 한다는 점이다.

표기법은 대체로 다음 구조를 가진다.

```text
<data rate in Mbps><signaling method><maximum segment length in hundreds of meters>
```

예를 들어 `10BASE5`는 10 Mbps, baseband signaling, maximum segment length 500 m를 뜻한다. 다만 `10BASE-T`의 `T`는 twisted pair, `10BASE-F`의 `F`는 optical fiber를 뜻해 엄밀히는 거리 숫자를 따르지 않는다.

| Option | Medium/topology | 핵심 의미 |
|---|---|---|
| `10BASE5` | 50-ohm coaxial cable, bus, Manchester, 500 m segment | Thick Ethernet. Repeater로 길이를 늘릴 수 있지만 MAC level에서는 segment를 isolate하지 못하므로 collision domain은 이어진다. |
| `10BASE2` | thinner coaxial cable, bus, 185 m segment | 10BASE5보다 저렴하지만 tap 수와 거리가 줄어든다. |
| `10BASE-T` | UTP, star, 100 m link | Chapter 15의 hub/star wiring과 연결된다. UTP 품질 때문에 link length가 제한된다. |
| `10BASE-F` | optical fiber, star 또는 point-to-point | optical fiber를 이용해 station/repeater 연결 거리를 늘린다. |

Repeater는 MAC level에서 transparent하고 buffering을 하지 않는다. 따라서 다른 segment의 station들이 동시에 transmit하면 여전히 collision이 발생한다. 이 점은 bridge/switch와 repeater/hub의 경계를 이해할 때 중요하다.

#### IEEE 802.3 100-Mbps Specifications: Fast Ethernet

`Fast Ethernet`은 IEEE 802.3이 정의한 100-Mbps Ethernet-compatible LAN specification이며, blanket designation은 `100BASE-T`이다. 핵심 목표는 low-cost migration이다. 즉 기존 Ethernet MAC protocol과 frame format을 유지하면서 physical layer를 바꾸어 100 Mbps를 제공한다.

| Option | Medium | Encoding/signaling | 의도 |
|---|---|---|---|
| `100BASE-TX` | 2-pair STP 또는 Category 5 UTP | MLT-3 | 고품질 twisted pair에서 100 Mbps 제공 |
| `100BASE-FX` | 2 optical fibers | 4B/5B, NRZI 후 optical intensity modulation | fiber link에서 100 Mbps 제공 |
| `100BASE-T4` | 4-pair Category 3/4/5 UTP | 8B6T, NRZ | 이미 깔린 voice-grade Category 3 cable을 활용 |

`100BASE-X`는 transmission과 reception에 각각 하나씩, 두 physical link를 쓰는 option 집합이다. `100BASE-TX`는 한 쌍을 transmit, 한 쌍을 receive에 쓰고, `100BASE-FX`는 optical fiber 두 가닥을 쓴다.

`100BASE-T4`는 낮은 품질의 Category 3 cable에서도 100 Mbps를 달성하기 위해 네 twisted pair를 쓰고, 한 방향 전송에 세 pair를 동시에 사용한다. 단일 twisted pair로 100 Mbps를 기대하기 어렵기 때문에 data stream을 세 stream으로 나누어 각 pair에 약 `33 1/3 Mbps` effective data rate를 맡기는 방식이다.

#### Full-Duplex Operation과 Mixed Configuration

Traditional Ethernet은 `half duplex`이다. Station은 frame을 transmit하거나 receive할 수 있지만 동시에 둘 다 할 수 없다. `full-duplex operation`에서는 transmit과 receive가 동시에 가능하다. 따라서 100-Mbps Ethernet이 full-duplex라면 이론적 transfer rate는 200 Mbps가 된다.

Full-duplex가 가능하려면 단순히 adapter만 빨라져서는 안 된다.

| 필요 조건 | 이유 |
|---|---|
| full-duplex adapter card | station이 동시에 send/receive해야 한다. |
| central point가 simple multiport repeater가 아니라 `switching hub` | repeater/hub는 shared collision domain을 만들지만, switch는 station별 separate collision domain을 만든다. |
| no contention | 각 station이 dedicated link를 가지므로 collision이 없고 CSMA/CD algorithm이 더 이상 필요하지 않다. |

그래도 802.3 MAC frame format은 유지된다. Attached station은 논리적으로 같은 frame을 쓰므로 migration이 쉽다. Fast Ethernet의 장점 중 하나는 기존 10-Mbps LAN과 100-Mbps LAN의 mixed configuration을 지원하는 점이다. 예를 들어 100-Mbps technology를 building backbone으로 쓰고, 기존 station은 10BASE-T hub에 남겨 두며, high-capacity workstation/server만 10/100 switch에 직접 붙이는 식의 단계적 전환이 가능하다.

#### Gigabit Ethernet

`Gigabit Ethernet`의 전략은 Fast Ethernet과 같다. 새로운 medium과 transmission specification을 정의하되, 10-Mbps/100-Mbps predecessor의 CSMA/CD protocol과 Ethernet frame format을 유지한다. 이 compatibility가 migration path의 핵심이다.

![Figure 16.4](@/assets/images/data-communication-209-figure-16-4-page-515.png)
*Figure 16.4 · PDF p. 515 · 1-Gbps switching hub를 backbone으로 쓰는 Gigabit Ethernet 구성 예*

Figure 16.4에서는 1-Gbps switching hub가 central servers와 high-speed workgroup hubs를 묶는 backbone 역할을 한다. Workgroup LAN switch는 backbone 쪽 1-Gbps link와 station/server 쪽 100-Mbps link를 함께 지원한다. 이 그림은 Gigabit Ethernet이 처음부터 모든 desktop을 1 Gbps로 바꾸는 기술이라기보다 backbone과 server/workgroup aggregation 병목을 줄이는 기술로 쓰인다는 점을 보여준다.

Gigabit Ethernet의 `media access layer`는 10/100 Mbps IEEE 802.3과 같은 frame format과 MAC protocol을 부른다. 다만 shared-medium hub operation에서는 1 Gbps에서 CSMA/CD 조건을 맞추기 위해 두 가지 보강이 필요하다.

| Enhancement | 동작 | 이유 |
|---|---|---|
| `carrier extension` | 짧은 MAC frame 뒤에 special symbols를 붙여 block duration을 최소 4096 bit-times로 늘린다 | 1 Gbps에서도 transmission duration이 propagation time보다 충분히 길어 collision detection이 가능하게 한다 |
| `frame bursting` | 한 station이 여러 short frame을 연속 전송하되, frame 사이에 CSMA/CD control을 놓지 않는다 | short frame마다 carrier extension overhead가 생기는 것을 줄인다 |

Switching hub를 써서 dedicated access를 제공하면 carrier extension과 frame bursting은 필요하지 않다. Data transmission/reception이 동시에 가능하고 shared medium contention이 없기 때문이다. 이 점은 Gigabit Ethernet이 실질적으로 switched LAN으로 이동하는 흐름과 맞물린다.

![Figure 16.5](@/assets/images/data-communication-210-figure-16-5-page-516.png)
*Figure 16.5 · PDF p. 516 · Gigabit Ethernet의 medium option과 최대 거리 비교*

| Option | Medium | 거리/용도 감각 |
|---|---|---|
| `1000BASE-SX` | short-wavelength multimode fiber | 62.5-um multimode 약 275 m, 50-um multimode 약 550 m |
| `1000BASE-LX` | long-wavelength multimode/single-mode fiber | multimode 약 550 m, 10-um single-mode 약 5 km |
| `1000BASE-CX` | shielded copper jumper | 같은 방이나 equipment rack 내부, 약 25 m |
| `1000BASE-T` | four-pair Category 5 UTP | 일반 building wiring에서 약 100 m |

처음 세 option은 `8B/10B` encoding을 사용하고, `1000BASE-T`는 더 복잡한 `4D-PAM5`를 사용한다. 8B/10B의 원리는 Appendix 16A에서 다시 등장한다.

#### 10-Gbps Ethernet

`10-Gbps Ethernet`의 driving requirement는 Internet/intranet traffic 증가다. Connection 수 증가, end-station connection speed 증가, high-quality video 같은 bandwidth-intensive application, Web/application hosting traffic 증가가 모두 backbone capacity를 밀어 올린다.

초기 사용처는 large-capacity switch 사이의 high-speed local backbone interconnection이다. 이후 server farm, campuswide connectivity, ISP/NSP의 co-located carrier-class switch/router 연결로 확장된다. 10-Gbps Ethernet은 LAN을 넘어 MAN/WAN transport에서도 ATM 같은 기술과 경쟁한다. 이유는 customer requirement가 data와 TCP/IP transport라면 Ethernet end-to-end 구성이 비용과 관리 측면에서 유리하기 때문이다.

![Figure 16.6](@/assets/images/data-communication-211-figure-16-6-page-518.png)
*Figure 16.6 · PDF p. 518 · workgroup switch, backbone switch, server farm을 10-Gbps Ethernet으로 묶는 예*

Figure 16.6은 10-Gbps Ethernet이 어디서 병목을 풀어 주는지 보여준다. Workgroup switch에는 10/100 Mbps station traffic과 1-Gbps uplink가 몰리고, server farm에는 1-Gbps NIC가 다수 붙는다. 이들을 backbone switch 사이 10-Gbps pipe로 묶으면 aggregation congestion을 줄일 수 있다.

10-Gbps Ethernet은 full-duplex mode only이며, 다양한 optical fiber physical media를 사용한다. Link distance target은 약 300 m에서 40 km까지로, LAN부터 MAN/WAN까지 염두에 둔다.

![Figure 16.7](@/assets/images/data-communication-212-figure-16-7-page-519.png)
*Figure 16.7 · PDF p. 519 · 10-Gbps Ethernet physical option별 거리 범위*

| Option | Medium/wavelength | 특징 |
|---|---|---|
| `10GBASE-S` | 850 nm, multimode fiber | short reach, 최대 약 300 m. `10GBASE-SR`, `10GBASE-SW`가 있다. |
| `10GBASE-L` | 1310 nm, single-mode fiber | long reach, 최대 약 10 km. `10GBASE-LR`, `10GBASE-LW`가 있다. |
| `10GBASE-E` | 1550 nm, single-mode fiber | extended reach, 최대 약 40 km. `10GBASE-ER`, `10GBASE-EW`가 있다. |
| `10GBASE-LX4` | 1310 nm, single-mode 또는 multimode fiber | WDM으로 bit stream을 네 light wave에 multiplexing한다. |

`R` suboption은 dark fiber 위에서 `64B/66B` signaling을 쓰는 physical layer family이고, `W` suboption은 64B/66B signaling 후 SONET equipment에 연결되도록 encapsulation하는 family이다.

Ethernet 계열의 성공은 순수 기술 성능만으로 설명되지 않는다. ATM이나 Fibre Channel이 high-speed backbone 관점에서 더 flexible/scalable한 선택일 수 있지만, Ethernet은 installed LAN, network management software, application과의 compatibility를 제공한다. 이 compatibility가 30년 가까운 CSMA/CD 계열 기술이 계속 살아남은 중요한 이유다.

### 16.3 Fibre Channel

`Fibre Channel`은 processor 주변의 I/O channel 요구와 network communication 요구를 결합하려는 기술이다. Personal computer, workstation, server의 speed와 memory capacity가 커지고 graphics/video application이 복잡해지면서, data를 processor까지 빠르게 전달하는 능력이 중요해졌다. 이 요구는 두 경로에 걸린다.

| 경로 | 성격 | 장점 | 한계 |
|---|---|---|---|
| `I/O channel` | hardware 중심의 direct point-to-point 또는 multipoint communication link | 아주 짧은 거리에서 high speed. Source buffer와 destination buffer 사이 user contents를 빠르게 이동 | data format/meaning에 무관하고, 보통 processor-peripheral 사이에 제한된다 |
| `network` | interconnected access point와 software protocol structure | 다양한 end system, data type, local/metropolitan/wide area distance를 지원 | flow control, error recovery, protocol processing이 software 중심이라 overhead가 커질 수 있다 |

Fibre Channel의 설계 목표는 channel communication의 simplicity/speed와 network communication의 flexibility/interconnectivity를 함께 얻는 것이다. 그래서 peripheral connection, host-to-host internetworking, loosely coupled processor clustering, multimedia application을 single multiprotocol interface 안에 수용하려 한다.

#### Channel-Oriented 기능과 Network-Oriented 기능

Fibre Channel이 “channel과 network의 결합”이라는 말은 다음 기능에서 구체화된다.

| 성격 | Fibre Channel에 들어간 기능 |
|---|---|
| Channel-oriented facilities | frame payload를 특정 interface buffer로 route하기 위한 data-type qualifier, individual I/O operation에 관련된 link-level construct, SCSI 같은 기존 I/O channel architecture 지원 |
| Network-oriented facilities | multiple destination 사이 traffic multiplexing, Fibre Channel network의 임의 port pair 사이 peer-to-peer connectivity, 다른 connection technology와 internetworking |

Fibre Channel Industry Association이 내세운 요구에는 full-duplex two-fiber link, single line 기준 100-800 Mbps 성능, link 기준 full-duplex 200-1600 Mbps, 최대 10 km 거리, high-capacity utilization, 여러 cost/performance level 지원, 기존 channel/network protocol command set 운반 등이 포함된다.

핵심 해결책은 point-to-point links와 switching network에 기반한 simple generic transport mechanism이다. 이 infrastructure 위에 simple encoding/framing scheme을 두고, 그 위에서 여러 channel/network protocol을 운반한다.

#### Fibre Channel Elements

Fibre Channel network의 핵심 요소는 `node`와 `fabric`이다. Node는 end system이고, fabric은 하나 이상의 switching element 모음이다. Node와 switch는 port 사이 point-to-point link로 연결되며, communication은 frame을 이 link들을 따라 전송하는 방식으로 일어난다.

![Figure 16.8](@/assets/images/data-communication-213-figure-16-8-page-521.png)
*Figure 16.8 · PDF p. 521 · N_port와 F_port가 fabric을 통해 연결되는 Fibre Channel network*

| 요소 | 의미 |
|---|---|
| `N_port` | node가 fabric에 붙기 위해 가지는 port |
| `F_port` | fabric switching element가 제공하는 port |
| `fabric` | buffering과 frame routing을 담당하는 switching element 집합 |
| point-to-point link | N_port와 F_port, 또는 switch port 사이를 잇는 bidirectional link |

Any node는 같은 fabric에 붙은 any other node와 fabric service를 이용해 communicate할 수 있다. `N_port` 사이의 frame routing은 node가 아니라 fabric이 담당한다. Fabric 내부에서 frame buffering이 가능하므로 서로 다른 data rate의 node를 연결할 수도 있다.

이 구조는 IEEE 802 LAN과 다르다. Fibre Channel은 shared-medium LAN이라기보다 circuit-switching 또는 packet-switching network에 가깝다. 따라서 CSMA/CD 같은 medium access control 문제를 걱정하지 않는다. Switching network 기반이므로 N_port 수, data rate, covered distance 측면에서 scale하기 쉽다.

#### Fibre Channel Protocol Architecture

Fibre Channel standard는 다섯 level로 정리된다. 원문은 이 level이 실제 구현 interface를 강제하는 계층이라기보다는 related functions를 묶는 “document artifice”라고 설명한다.

| Level | 이름 | 기능 |
|---|---|---|
| `FC-0` | Physical Media | long-distance optical fiber, short-distance high-speed coaxial cable, lower-speed shielded twisted pair 등 physical media |
| `FC-1` | Transmission Protocol | signal encoding scheme |
| `FC-2` | Framing Protocol | topology, frame format, flow/error control, frame을 sequence/exchange로 묶는 기능 |
| `FC-3` | Common Services | multicasting 같은 공통 서비스 |
| `FC-4` | Mapping | IEEE 802, ATM, IP, SCSI 같은 channel/network protocol을 Fibre Channel로 mapping |

이 layered architecture 덕분에 새로운 media/data rate를 fabric에 추가하면서도 기존 protocol investment를 유지할 수 있다. Chapter 16의 Ethernet compatibility와 비교하면, Ethernet은 MAC frame compatibility를 중심으로 진화하고, Fibre Channel은 multiprotocol mapping과 fabric abstraction으로 확장성을 얻는 쪽에 가깝다.

#### Physical Media와 Topologies

Fibre Channel의 강점은 physical medium, data rate, topology 선택지가 넓다는 점이다. Transmission media에는 shielded twisted pair, video coaxial cable, optical fiber가 포함된다. Standardized data rate는 100 Mbps에서 3.2 Gbps까지, point-to-point link distance는 약 33 m에서 10 km까지 걸친다.

Topology는 세 가지로 정리된다.

| Topology | 구조 | 특징 |
|---|---|---|
| `fabric` 또는 switched topology | 하나 이상의 switch가 end system들을 연결 | 가장 일반적이다. Edge switch가 destination port address로 frame을 routing하고, port 추가 시 aggregate capacity가 증가한다. |
| `point-to-point topology` | 두 port가 fabric switch 없이 직접 연결 | routing이 필요 없다. |
| `arbitrated loop topology` | 최대 126 nodes를 loop로 연결 | low-cost topology이며 token ring과 대략 비슷한 방식으로 arbitration한다. |

Fabric topology에서는 routing이 node에 transparent하다. Node는 자신과 fabric 사이의 simple point-to-point connection만 관리하고, fabric이 routing, buffering, error detection을 맡는다. 따라서 node의 부담은 줄고, fabric 내부 switch/link 기술은 전체 configuration을 깨지 않고 바뀔 수 있다.

![Figure 16.9](@/assets/images/data-communication-214-figure-16-9-page-524.png)
*Figure 16.9 · PDF p. 524 · Fibre Channel fabric이 workstation cluster, mainframe, server farm, disk farm, LAN/WAN backbone 연결에 쓰이는 예*

Figure 16.9는 Fibre Channel의 대표 application을 한 fabric 주변에 모아 보여준다. High-performance workstation cluster 연결, mainframe 상호 연결, server farm high-speed pipe, disk farm clustering, LAN/WAN backbone 연결이 모두 같은 switched fabric 모델로 설명된다. 실제 수용 측면에서는 improved peripheral device interconnect, 특히 SCSI를 대체하거나 보강하는 storage 연결에서 가장 널리 받아들여졌다.

### Appendix 16A Digital Signal Encoding for LANs

High-speed LAN에서 encoding은 부가 기능이 아니라 data rate를 실제 medium에서 성립시키는 핵심 설계다. 단순 `NRZ (nonreturn to zero)`는 1과 0을 각각 하나의 signal state로 표현하므로 효율은 좋지만, 긴 0 또는 긴 1이 나오면 transition이 없어 receiver가 clock synchronization을 잡기 어렵다. 반대로 `Manchester encoding`은 transition을 보장하지만 100 Mbps를 보내려면 최대 200 Mbaud가 필요해 비용과 기술 부담이 커진다. 이 appendix의 encoding들은 synchronization, bandwidth efficiency, radiated emission, DC balance, error detection 사이의 trade-off를 조정한다.

#### 4B/5B-NRZI

`4B/5B-NRZI`는 `100BASE-X`에서 사용된다. 이름 그대로 두 단계다. 먼저 4 data bits를 5 code bits의 `code group`으로 바꾸고, 그 5-bit stream을 다시 `NRZI (nonreturn to zero inverted)`로 encode한다.

| 단계 | 목적 |
|---|---|
| `4B/5B` | 4 bits를 5 bits로 바꾸어 transition을 보장할 수 있는 code group을 선택한다. Efficiency는 4/5 = 80%이고, 100 Mbps에는 125 Mbaud가 필요하다. |
| `NRZI` | binary 1은 bit interval 시작의 transition, binary 0은 no transition으로 표현한다. Differential encoding이므로 noise/distortion 환경에서 absolute threshold보다 transition detection이 유리하다. |

4B/5B에서 가능한 5-bit pattern은 32개인데 data encoding에는 16개만 필요하다. 남는 pattern은 invalid code 또는 control symbol로 쓴다. Data code group은 한 code group 안에서 최소 두 번 transition이 나오고, 여러 code group을 걸쳐서도 zero가 세 개를 넘지 않도록 골라 synchronization을 유지한다.

주요 nondata symbol은 다음과 같다.

| Symbol class | 의미 |
|---|---|
| `Idle` | data sequence 사이에 보내는 fill pattern. NRZI에서는 signal level이 계속 번갈아 synchronization을 유지하고, CSMA/CD에서는 shared medium이 idle임을 나타낸다. |
| `Start of stream delimiter` | data transmission sequence의 시작 boundary를 표시한다. |
| `End of stream delimiter` | 정상 data transmission sequence의 끝을 표시한다. |
| `Transmit error` | signaling error indicator로, repeater가 received error를 propagate할 때 쓸 수 있다. |

#### MLT-3

`4B/5B-NRZI`는 optical fiber에는 효과적이지만 twisted pair에는 그대로 쓰기 어렵다. Signal energy가 undesirable radiated emissions를 만들 수 있기 때문이다. `MLT-3`는 `100BASE-TX`에서 이 문제를 줄이기 위해 사용된다.

MLT-3 처리 흐름은 다음과 같다.

| Step | 처리 |
|---|---|
| 1 | 4B/5B NRZI signal을 다시 NRZ로 변환한다. |
| 2 | bit stream을 scrambling하여 spectrum distribution을 더 균일하게 만든다. |
| 3 | scrambled bit stream을 MLT-3로 encode한다. |
| 4 | resulting encoding을 driver가 medium에 전송한다. |

MLT-3의 효과는 transmitted signal energy의 대부분을 30 MHz 아래로 집중시켜 radiated emission과 interference 문제를 줄이는 것이다.

![Figure 16.10](@/assets/images/data-communication-216-figure-16-10-page-530.png)
*Figure 16.10 · PDF p. 530 · input bit에 따라 +V, 0, -V state를 순환하는 MLT-3 encoder*

MLT-3는 세 voltage level `+V`, `0`, `-V`를 사용한다. Rule은 단순하다. Input bit가 0이면 output level을 유지한다. Input bit가 1이면 transition이 발생한다. 직전 output이 `+V` 또는 `-V`이면 다음 output은 `0`이고, 직전 output이 `0`이면 마지막 nonzero output과 반대 부호의 nonzero output으로 간다. 따라서 1이 들어올 때마다 transition이 생기고, `+V`와 `-V`는 번갈아 나타난다.

![Figure 16.11](@/assets/images/data-communication-217-figure-16-11-page-530.png)
*Figure 16.11 · PDF p. 530 · input 1마다 transition이 일어나는 MLT-3 waveform 예*

#### 8B6T

`8B6T`는 `100BASE-T4`에서 사용되는 ternary signaling 기반 block code이다. Ternary signaling은 각 signal element가 positive voltage, negative voltage, zero voltage 중 하나를 가질 수 있다. 순수 ternary code를 쓰면 synchronization 문제가 다시 생기므로, 8B6T는 block-coding으로 ternary의 효율에 접근하면서 synchronization과 DC balance를 확보한다.

![Figure 16.12](@/assets/images/data-communication-218-figure-16-12-page-531.png)
*Figure 16.12 · PDF p. 531 · 8-bit block을 6 ternary symbols로 바꾸고 세 channel에 round-robin 전송하는 8B6T scheme*

8B6T에서는 8-bit block 하나가 6 ternary symbols의 code group으로 mapping된다. Code group stream은 세 output channel에 round-robin으로 분배된다. 100BASE-T4가 세 pair를 한 방향 전송에 쓰는 이유와 연결된다. 8-bit stream 전체가 100 Mbps일 때 각 channel의 ternary transmission rate는 다음과 같이 25 Mbaud가 된다.

$$
\left(\frac{6}{8}\right)\left(\frac{1}{3}\right) \times 100\ \text{Mbps} = 25\ \text{Mbaud}
$$

8B6T mapping은 두 요구를 만족하도록 선택된다.

| 요구 | 의미 |
|---|---|
| synchronization | code group당 평균 transition 수를 크게 하여 clock recovery를 돕는다. |
| DC balance | line의 average voltage가 0에 가깝도록 positive/negative symbol 균형을 맞춘다. |

각 selected code group은 weight 0 또는 1을 갖고, DC balancing algorithm은 cumulative weight를 추적한다. 필요하면 transmitted code group의 모든 `+`와 `-`를 뒤집어 cumulative weight가 code group 끝에서 항상 0 또는 1이 되도록 한다.

#### 8B/10B

`8B/10B`는 Fibre Channel과 Gigabit Ethernet에서 사용된다. 8 data bits를 10 transmission bits로 바꾸므로 overhead는 25%다. 철학은 4B/5B와 비슷하지만, transmission characteristic과 error detection capability가 더 강하다.

| 장점 | 설명 |
|---|---|
| simple/reliable transceiver | relatively low cost로 구현 가능하다. |
| balance | 긴 sequence에서도 1과 0의 개수가 크게 치우치지 않는다. |
| transition density | clock recovery에 충분한 transition을 제공한다. |
| error detection | 허용되지 않는 code pattern 등을 통해 error detection에 도움을 준다. |

8B/10B는 일반적 `mBnB` code의 예다. `m` source bits를 `n` transmission bits로 mapping하며, `n > m`인 redundancy를 이용해 원하는 전송 특성을 얻는다. 실제 정의는 `5B/6B`와 `3B/4B` 조합으로 구성되며, `disparity control`이 excess zeros/ones 또는 excess ones/zeros를 추적한다. Current code block이 기존 disparity를 더 키울 경우 10-bit code block을 complement하여 disparity를 줄이거나 반대 방향으로 이동시킨다.

#### 64B/66B

`64B/66B`는 10-Gbps Ethernet에서 사용된다. 8B/10B overhead가 25%인 반면, 64B/66B는 64 bits를 66-bit output block으로 바꾸므로 overhead가 약 3%에 불과하다. 높은 data rate에서 encoding overhead를 줄이는 것이 핵심이다.

![Figure 16.13](@/assets/images/data-communication-219-figure-16-13-page-532.png)
*Figure 16.13 · PDF p. 532 · data-only block과 mixed data/control block의 64B/66B encoding 구조*

64B/66B는 두 종류의 block을 구분한다.

| Block type | 구성 |
|---|---|
| data octets only | 64-bit data field를 scramble하고, synchronization bits `01`을 앞에 붙인다. |
| mixed data/control block | 56-bit data/control field를 scramble하고, synchronization bits `10`과 8-bit type field를 앞에 붙인다. |

Scrambling polynomial은 $1 + X^{39} + X^{58}$이다. 64B/66B는 transition을 보장하기 위한 specific coding technique에 의존하지 않고, scrambling이 long bit stream에서 필요한 transition/frequency characteristic을 제공한다. Two-bit synchronization field는 block alignment와 long bit stream synchronization에 쓰인다.

### Appendix 16B Performance Issues

LAN/MAN architecture 선택에서 performance는 핵심 기준이다. 특히 heavy load에서 `throughput`과 `response time`이 어떻게 변하는지가 중요하다. 이 appendix는 세부 queueing model보다, propagation delay와 transmission rate가 LAN utilization을 어떻게 제한하는지 보여준다.

#### Parameter $a$

Chapter 7에서 나온 parameter $a$는 여기서도 중심 역할을 한다.

$$
a = \frac{\text{propagation time}}{\text{transmission time}}
$$

LAN 문맥에서는 다음처럼 볼 수 있다.

$$
a = \frac{\text{length of data link in bits}}{\text{length of frame in bits}}
$$

즉 $a$는 frame 하나를 밀어 넣는 시간에 비해 signal이 network 끝까지 퍼지는 시간이 얼마나 큰지를 나타낸다. Data rate $R$, maximum station distance $d$, propagation velocity $V$, frame length $L$을 쓰면 다음 관계가 된다.

$$
a = \frac{d/V}{L/R} = \frac{Rd}{LV}
$$

Perfect access mechanism을 가정해도 utilization upper bound는 $a$에 제한된다. 한 frame을 보내는 데 실제 transmission time $L/R$뿐 아니라 propagation delay $d/V$가 붙기 때문이다.

$$
U = \frac{1}{1+a}
$$

여기서 $U$는 normalized utilization, 즉 network throughput을 data rate로 나눈 값이다. $a$가 작으면 propagation delay가 frame transmission time에 비해 작으므로 utilization이 높고, $a$가 커지면 한 frame의 효과가 network 전체에 퍼지기까지 빈 시간이 커져 utilization이 떨어진다.

#### Baseband Bus와 Ring에서의 직관

![Figure 16.14](@/assets/images/data-communication-220-figure-16-14-page-534.png)
*Figure 16.14 · PDF p. 534 · baseband bus에서 propagation time $a$가 utilization을 제한하는 과정*

Figure 16.14는 가장 멀리 떨어진 두 station이 번갈아 frame을 보내는 worst-case bus를 가정한다. Frame transmission time을 1로 normalize하면 propagation time은 $a$이다. 한 station이 $t_0$에 전송을 시작하고, 상대 station에서 reception이 $t_0+a$에 시작되며, transmission은 $t_0+1$에 끝난다. 결국 한 turn이 끝나는 시간은 $1+a$이고, 그중 실제 transmit time은 1이므로 utilization은 $1/(1+a)$가 된다.

![Figure 16.15](@/assets/images/data-communication-221-figure-16-15-page-535.png)
*Figure 16.15 · PDF p. 535 · ring network에서도 $a$가 utilization에 같은 방식으로 영향을 주는 예*

Figure 16.15는 ring에서도 같은 직관이 적용됨을 보여준다. 한 station이 transmit한 뒤 자기 transmission이 ring을 돌아오는 것을 기다린다고 보면, turn의 길이는 여전히 transmission time과 propagation time의 합으로 제한된다. LAN에서는 $a$가 대략 0.01-0.1인 경우가 많지만, MAN에서는 0.1에서 1.0을 훨씬 넘을 수 있다. Network가 더 크고 빠를수록 $R$과 $d$가 커져 $a$가 커지기 쉽고, utilization이 떨어진다. 그래서 high-speed LAN에서는 “한 번에 frame 하나만”이라는 제약을 완화하는 switched/full-duplex 구조가 중요해진다.

#### CSMA/CD의 Simple Performance Model

CSMA/CD 성능을 직관적으로 보려면 time을 slot으로 나눈다. Slot length는 $2 \times \text{end-to-end propagation delay}$이고, 이는 transmission 시작 후 collision을 detect하는 데 걸릴 수 있는 maximum time이다.

Model의 단순화 가정은 다음과 같다.

| 가정 | 의미 |
|---|---|
| $N$ active stations | 모든 station이 항상 보낼 frame을 가지고 있다고 본다. |
| maximum normalized propagation delay $a$ | propagation delay가 frame transmission time에 비해 얼마나 큰지 나타낸다. |
| station transmit probability $P$ | available slot에서 각 station이 probability $P$로 transmit한다. |

모든 station이 항상 transmit하면 line은 collision뿐이므로, 각 station은 offered load를 restraint해야 한다. 한 slot에서 정확히 하나의 station만 transmit하여 medium을 잡을 probability를 $A$라고 하면,

$$
A = NP(1-P)^{N-1}
$$

이 값은 $P=1/N$일 때 최대가 된다. Heavy usage에서는 station이 자기 offered load를 대략 $1/N$으로 제한해야 successful seizure probability가 최대가 된다는 뜻이다.

Transmission interval은 $1/(2a)$ slots이고, contention interval은 collision 또는 no transmission slot들이 이어진 뒤 successful transmission slot이 나오는 기간이다. 이 단순 model에서 maximum utilization은 다음 꼴이다.

$$
U = \frac{1}{1 + 2a(1-A)/A}
$$

$N$이 매우 커질 때는 근사적으로 다음 한계가 나온다.

$$
\lim U = \frac{1}{1+3.44a}
$$

![Figure 16.16](@/assets/images/data-communication-222-figure-16-16-page-538.png)
*Figure 16.16 · PDF p. 538 · CSMA/CD normalized throughput이 $a$와 active station 수 $N$에 따라 감소하는 모습*

Figure 16.16의 메시지는 두 가지다. 첫째, $a$가 커질수록 throughput은 떨어진다. Propagation delay가 상대적으로 크면 collision detection과 contention에 쓰이는 시간이 커지기 때문이다. 둘째, $N$이 늘면 collision 또는 no transmission slot 가능성이 커져 CSMA/CD performance가 떨어진다. 이 결과는 high-speed Ethernet이 shared-medium CSMA/CD보다 switched full-duplex 구조로 이동한 이유를 뒷받침한다.

### Appendix 16C Scrambling

일부 digital data encoding에서는 긴 binary zeros 또는 ones string이 system performance를 떨어뜨린다. 또 constant/repetitive data보다 random-looking data가 spectral property 측면에서 유리하다. `scrambling`은 data를 더 random하게 보이도록 바꾸어 signal quality를 높이고, `descrambling`은 receiver에서 원래 data를 복원한다.

#### Scrambler와 Descrambler

Scrambler는 보통 `feedback shift register`로 구성되고, matching descrambler는 `feedforward shift register`로 구성된다.

![Figure 16.17](@/assets/images/data-communication-223-figure-16-17-page-538.png)
*Figure 16.17 · PDF p. 538 · feedback shift register scrambler와 feedforward shift register descrambler*

Figure 16.17의 예에서 scrambled sequence는 다음처럼 표현된다.

$$
B_m = A_m \oplus B_{m-3} \oplus B_{m-5}
$$

여기서 $A_m$은 original input bit, $B_m$은 scrambled output bit이다. Descrambler는 같은 tap 위치를 이용해 다음처럼 original bit를 되찾는다.

$$
C_m = B_m \oplus B_{m-3} \oplus B_{m-5}
    = A_m
$$

Polynomial 관점에서는 예제 polynomial이 다음과 같다.

$$
P(X) = 1 + X^3 + X^5
$$

Input을 이 polynomial로 나누어 scrambled sequence를 만들고, receiver에서는 같은 polynomial을 곱해 original input을 복원한다. 원문 예시는 input `101010100000111`처럼 periodic sequence와 long zero string을 포함하는 data가 scrambler를 거치며 반복 패턴이 제거되는 모습을 보여준다.

#### LAN Encoding에서의 Scrambling 위치

Scrambling은 encoding scheme마다 다른 방식으로 들어간다.

| Scheme | Scrambling 역할 |
|---|---|
| `64B/66B` | specific code mapping으로 transition을 보장하지 않고, polynomial $1 + X^{39} + X^{58}$ scrambling이 필요한 randomness/transition characteristic을 제공한다. |
| `MLT-3` / `100BASE-TX` | MLT-3 encoding 전 bit stream을 scramble하여 spectrum distribution을 균일하게 하고 radiated emission을 줄인다. |
| `4D-PAM5` / `1000BASE-T` | 양방향에 서로 다른 scrambling equation을 사용해 high-speed twisted-pair transmission의 signal property를 조정한다. |

MLT-3에서 scrambler shift register가 all zeros가 되면 scrambling이 일어나지 않는다. 이 때문에 standard는 shift register를 all ones로 initialize하고, all zeros 상태가 되면 다시 all ones로 re-initialize하도록 한다. 이 세부는 scrambling이 단순 난수화가 아니라 receiver가 복원 가능한 deterministic transformation이라는 점을 보여준다.

## 연결 관계

Chapter 16은 Chapter 15의 LAN overview를 실제 high-speed LAN 기술로 확장한다. Chapter 15에서 배운 `MAC`, `LLC`, `hub`, `layer 2 switch`, `layer 3 switch`, `SAN` 개념이 여기서 그대로 쓰인다.

| 연결 지점 | 의미 |
|---|---|
| Chapter 15의 shared medium | Ethernet의 CSMA/CD, collision detection, minimum frame length, propagation delay 분석으로 구체화된다. |
| Chapter 15의 layer 2 switch | Fast/Gigabit/10G Ethernet에서 full-duplex switched operation이 왜 CSMA/CD를 밀어내는지 설명한다. |
| Chapter 15의 SAN | Fibre Channel이 storage area network에서 널리 쓰인 이유와 연결된다. |
| Chapter 5의 signal encoding | Manchester, NRZ, NRZI 개념이 4B/5B, MLT-3, 8B/10B, 64B/66B 이해의 전제다. |
| Chapter 7의 performance parameter $a$ | Propagation delay와 transmission time 비율이 LAN utilization을 제한하는 방식으로 재등장한다. |

## 오해하기 쉬운 내용

| 오해 | 바로잡기 |
|---|---|
| Ethernet은 항상 CSMA/CD를 사용한다 | 10/100 Mbps shared medium에서는 중요하지만, full-duplex switched Ethernet에서는 collision이 없으므로 CSMA/CD가 실질적으로 필요하지 않다. |
| Gigabit Ethernet은 단순히 100 Mbps Ethernet을 10배 빠르게 한 것이다 | Frame/MAC compatibility는 유지하지만, carrier extension, frame bursting, 8B/10B, 다양한 physical option 등 별도 보강이 필요하다. |
| 10-Gbps Ethernet도 shared medium collision 기반이다 | 10-Gbps Ethernet은 full-duplex mode only이며 optical fiber physical media를 중심으로 한다. |
| Fibre Channel은 그냥 빠른 Ethernet이다 | Fibre Channel은 shared-medium LAN이 아니라 point-to-point link와 switching fabric 기반의 multiprotocol transport에 가깝다. |
| Encoding overhead는 무조건 낭비다 | Redundancy는 synchronization, clock recovery, DC balance, error detection, spectral property를 얻기 위한 비용이다. |
| $a$는 링크 길이만의 문제다 | $a = Rd/LV$이므로 data rate가 높아지거나 frame length가 짧아져도 커진다. |
| Scrambling은 암호화다 | Scrambling은 보안이 아니라 signal quality와 spectral property 개선을 위한 deterministic 변환이다. |

## 면접 질문

1. `CSMA`, `CSMA/CD`, `ALOHA`, `slotted ALOHA`의 차이를 collision 낭비 관점에서 설명하라.
2. IEEE 802.3이 1-persistent CSMA/CD와 `binary exponential backoff`를 함께 쓰는 이유는 무엇인가?
3. Ethernet minimum frame length와 `2 × end-to-end propagation delay`는 어떤 관계가 있는가?
4. `shared hub` 환경과 `full-duplex switching hub` 환경에서 CSMA/CD 필요성이 어떻게 달라지는가?
5. `Fast Ethernet`, `Gigabit Ethernet`, `10-Gbps Ethernet`이 Ethernet compatibility를 유지한다는 말은 정확히 무엇을 뜻하는가?
6. `carrier extension`과 `frame bursting`은 Gigabit Ethernet의 어떤 문제를 해결하려는가?
7. `Fibre Channel fabric`에서 `N_port`, `F_port`, fabric의 역할을 설명하라.
8. Fibre Channel이 shared-medium LAN과 다른 이유를 MAC/access control 관점에서 설명하라.
9. `4B/5B-NRZI`, `MLT-3`, `8B6T`, `8B/10B`, `64B/66B`를 각각 한 문장씩 비교하라.
10. LAN performance parameter $a$가 커지면 utilization이 떨어지는 이유를 bus 또는 ring 예로 설명하라.
11. CSMA/CD simple performance model에서 active station 수 $N$이 커질수록 throughput이 낮아지는 이유는 무엇인가?
12. Scrambling이 필요한 이유를 long zero/one string, clock recovery, spectral property 관점에서 설명하라.

## 핵심 용어 정리

| Term | 한국어 중심 의미 |
|---|---|
| `Ethernet` | IEEE 802.3 기반 LAN 계열로, MAC frame compatibility를 유지하며 10 Mbps에서 10 Gbps까지 확장되었다. |
| `CSMA/CD` | carrier sense 후 transmit하고, transmission 중 collision을 detect하면 jam/backoff하는 contention MAC 방식 |
| `binary exponential backoff` | repeated collision 후 random delay 평균을 단계적으로 키워 congestion 시 collision probability를 낮추는 방식 |
| `Fast Ethernet` | 100 Mbps Ethernet-compatible IEEE 802.3 specification |
| `Gigabit Ethernet` | 1 Gbps Ethernet 계열. shared operation 보강과 switched backbone 사용이 중요하다. |
| `10-Gbps Ethernet` | full-duplex optical Ethernet으로 LAN/MAN/WAN backbone까지 염두에 둔다. |
| `Fibre Channel` | high-speed channel/network 기능을 결합한 switched fabric 기반 transport |
| `fabric` | Fibre Channel에서 frame buffering/routing을 맡는 switching element 집합 |
| `N_port`, `F_port` | node port와 fabric switching element port |
| `4B/5B` | 4 data bits를 5 code bits로 mapping해 synchronization transition을 확보하는 block code |
| `NRZI` | binary 1을 transition으로 표현하는 differential encoding |
| `MLT-3` | +V, 0, -V 세 level을 사용해 energy를 낮은 frequency 쪽에 집중시키는 encoding |
| `8B6T` | 8 bits를 6 ternary symbols로 mapping하는 100BASE-T4 encoding |
| `8B/10B` | 8 bits를 10 bits로 mapping하여 balance, transition density, error detection을 얻는 encoding |
| `64B/66B` | 64 bits에 2-bit sync header를 붙여 낮은 overhead로 10-Gbps Ethernet에 쓰이는 encoding |
| `parameter a` | propagation time과 frame transmission time의 비율 |
| `scrambler` | 반복 bit pattern을 random-like sequence로 바꾸는 shift-register 기반 변환 |
| `descrambler` | scrambled sequence에서 original bit stream을 복원하는 matching 변환 |
