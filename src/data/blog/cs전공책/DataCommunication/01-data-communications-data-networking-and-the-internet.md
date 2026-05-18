---
title: "Chapter 1. Data Communications, Data Networking, and the Internet"
order: 1
pubDatetime: 2026-05-18T00:00:00+09:00
modDatetime: 2026-05-18T00:00:00+09:00
description: "Data and Computer Communications 정리: Chapter 1. Data Communications, Data Networking, and the Internet"
tags:
  - "DataCommunication"
  - "CS"
---

## 개요

이 장은 `data communications`, `data networking`, `protocols`를 하나의 흐름으로 묶어 보는 입구다. 책의 핵심 관점은 컴퓨터 처리(`data processing`)와 통신 장비(`transmission and switching equipment`), 그리고 데이터·음성·영상 통신 사이의 경계가 점점 흐려졌다는 데 있다. 그래서 이후 장들은 단순히 “선을 통해 비트를 보낸다”가 아니라, 기업과 인터넷이 요구하는 서비스 품질, 용량, 이동성, 보안, 네트워크 구조를 함께 다룬다.

## 핵심 개념

- `Data communications`: 신호를 신뢰성 있고 효율적으로 전송하는 문제다. 전송 신호, 전송 매체(`transmission media`), 신호 부호화(`signal encoding`), 인터페이싱, 데이터 링크 제어(`data link control`), 다중화(`multiplexing`)가 핵심 범위다.
- `Networking`: 통신 장치를 서로 연결하는 네트워크의 기술과 구조다. 이 장에서는 큰 틀에서 `LAN(Local Area Network)`, `WAN(Wide Area Network)`, `Internet`으로 이어지는 구조를 소개한다.
- 기업 네트워크 설계의 압력은 `traffic growth`, `new services`, `technology advances` 세 가지가 서로 밀어 올리는 순환 구조에서 나온다. 용량이 커지면 새 서비스가 등장하고, 새 서비스는 다시 더 큰 용량과 더 낮은 지연을 요구한다.

## 세부 정리

### 1.1 Data Communications and Networking for Today's Enterprise

기업에서 통신 설비는 부가 기능이 아니라 업무 처리의 기반이다. 사무 자동화, 원격 접속, 온라인 거래, Web 기반 업무가 늘어나면서 로컬 트래픽과 장거리 트래픽이 모두 증가했고, 관리자는 더 큰 `capacity`를 확보하면서 `transmission cost`를 낮춰야 한다.

이 절은 기업 네트워크가 바뀌는 이유를 세 가지 힘으로 설명한다.

| 변화 요인 | 의미 | 네트워크에 주는 압력 |
| --- | --- | --- |
| `traffic growth` | 음성·데이터, 로컬·장거리 트래픽이 계속 증가 | 더 큰 전송 용량, 낮은 단가, 병목 제거 필요 |
| `new services` | 업무가 IT에 의존하면서 메시징, 이미지, Web, VPN, 영상 같은 서비스가 확장 | 서비스별 데이터율과 지연 요구가 달라짐 |
| `technology advances` | 더 빠르고 저렴한 컴퓨팅, 광섬유, DWDM, Gigabit Ethernet, 10-Gbps Ethernet | 예전에는 불가능했던 대역폭과 서비스 모델이 현실화 |

Figure 1.1은 서비스마다 필요한 `throughput rate`가 다르다는 점을 보여준다. 텍스트 메시징이나 단순 거래 처리보다 이미지 전송, 대용량 파일, 오디오, 영상, interactive entertainment가 훨씬 큰 전송률을 요구한다. 이 그림의 핵심은 “네트워크 속도”가 하나의 숫자로 끝나는 성질이 아니라, 서비스 품질(`QoS`)과 사용자 경험을 결정하는 조건이라는 점이다.

![Figure 1.1](@/assets/images/cs-data-communication-002-figure-1-1-page-32.png)
*Figure 1.1 · PDF p. 32 · 서비스 유형별 필요한 throughput rate*

현대 네트워크가 더 “지능적”이 되었다는 말은 두 가지 의미가 있다. 첫째, 네트워크가 최대 지연(`maximum delay`), 최소 처리량(`minimum throughput`) 같은 `QoS(Quality of Service)` 차등을 제공할 수 있다. 둘째, 네트워크 관리(`network management`)와 보안(`security`) 서비스가 사용 환경에 맞게 구성될 수 있다. 단순 연결성만 제공하던 회선에서, 업무 요구를 반영하는 서비스 플랫폼으로 이동한 것이다.

`Internet`, `Web`, 그리고 관련 응용은 기업 네트워크 요구를 다시 키웠다. 기업은 외부 고객·공급자·파트너와 연결하기 위해 인터넷을 쓰는 동시에, 내부 정보 보호를 위해 `intranet`을 구성하고, 선별된 외부 주체에게 접근을 허용하기 위해 `extranet`을 둔다. `intranet`은 기업 내부로 격리된 Internet/Web 기술 기반 시설이고, `extranet`은 고객·공급자·이동 근무자에게 기업 사설 데이터와 응용을 제한적으로 열어 주는 확장이다.

이동성(`mobility`)도 중요한 요구다. 음성 메일, 원격 데이터 접속, pager, fax, e-mail, cordless phone, cellular network, Internet portal, high-speed wireless access는 근무자가 물리적 사무실 밖에서도 업무 맥락을 유지하게 한다. 따라서 네트워크는 고정된 사무실의 배선 문제가 아니라, 위치가 바뀌는 사용자와 장치를 계속 붙잡아 두는 인프라가 된다.

#### Data Transmission and Network Capacity Requirements

네트워크 기술 변화와 조직의 업무 방식 변화는 서로 원인과 결과가 된다. Web의 이미지 기반 서비스는 인터넷 사용자 수와 사용자당 트래픽을 늘렸고, 늘어난 트래픽은 다시 인터넷의 속도와 효율을 끌어올렸다. 반대로 그런 속도 향상 없이는 Web 기반 응용이 사용자에게 실용적으로 느껴지기 어렵다.

`High-speed LAN`이 먼저 중요해진 이유는 사무실 안에서 PC와 workstation이 업무의 기본 도구가 되었기 때문이다. 초기 LAN은 mainframe이나 midrange system에 연결하고 파일 전송, 전자우편 같은 비교적 가벼운 트래픽을 처리하는 데 충분했다. 그러나 PC 성능이 폭발적으로 증가하고, `client/server computing`과 Web 중심 `intranet`이 보급되면서 LAN은 자주, 많이, 지연 없이 데이터를 옮겨야 하는 플랫폼이 되었다. 그래서 10-Mbps Ethernet이나 16-Mbps token ring만으로는 interactive application과 대량 데이터 전송을 감당하기 어려워졌다.

고속 LAN이 필요한 대표 상황은 다음과 같다.

| 요구 상황 | 네트워크 병목이 생기는 이유 |
| --- | --- |
| `centralized server farms` | 여러 중앙 서버에서 workstation으로 거대한 이미지·문서·업무 데이터를 내려받음 |
| `power workgroups` | CAD, 소프트웨어 테스트처럼 큰 파일을 여러 사용자가 반복적으로 읽고 수정함 |
| `high-speed local backbone` | 사이트 안에 LAN이 많아지면서 LAN 사이를 묶는 백본이 전체 성능을 좌우함 |

`Corporate WAN` 요구도 함께 커졌다. 과거에는 몇몇 지역 사무소의 대형 시스템에 지점 단말을 연결하는 중앙 집중형 모델이 흔했지만, 조직이 여러 작은 사무소와 재택·원격 근무로 분산되고 응용 구조가 client/server 및 intranet 중심으로 바뀌면서, 더 많은 데이터가 사내 건물 밖의 `wide area`로 이동하게 되었다. 예전의 “트래픽 80%는 로컬, 20%는 WAN”이라는 경험칙은 많은 기업에서 더 이상 맞지 않는다.

마지막으로 `digital electronics`도 네트워크 수요를 키운다. DVD, digital camcorder, digital still camera처럼 아날로그 매체가 디지털 이미지·영상 파일로 바뀌면, 그 파일은 Web site, intranet, Internet을 통해 이동한다. 이 장에서 중요한 점은 특정 제품을 외우는 것이 아니라, 디지털화가 저장 매체와 사용자 장치를 넘어 네트워크 트래픽의 성질 자체를 바꾼다는 연결이다.

### 1.2 A Communications Model

통신 시스템의 근본 목적은 두 당사자 사이에서 데이터를 교환하는 것이다. Figure 1.2의 단순 모델은 `source system`과 `destination system` 사이에 `transmitter`, `transmission system`, `receiver`가 놓이는 구조를 보여준다. 예를 들어 workstation이 server와 공중 전화망(`public telephone network`)을 통해 통신할 때, 양쪽의 modem은 디지털 bit stream과 전화망이 처리할 수 있는 아날로그 신호 사이를 변환한다.

![Figure 1.2](@/assets/images/cs-data-communication-003-figure-1-2-page-35.png)
*Figure 1.2 · PDF p. 35 · source에서 destination까지 이어지는 단순 통신 모델*

구성요소별 역할은 다음과 같다.

| 요소 | 역할 | 예시와 주의점 |
| --- | --- | --- |
| `Source` | 전송할 데이터를 생성 | telephone, personal computer |
| `Transmitter` | 원래 데이터를 전송 가능한 electromagnetic signal로 변환·부호화 | modem이 digital bit stream을 analog signal로 변환 |
| `Transmission system` | 신호가 지나가는 회선 또는 네트워크 | 단일 transmission line일 수도 있고 복잡한 network일 수도 있음 |
| `Receiver` | 수신 신호를 목적 장치가 처리할 수 있는 형태로 변환 | modem이 analog signal을 digital bit stream으로 복원 |
| `Destination` | receiver가 넘겨준 데이터를 받아 사용 | server, telephone 등 |

이 모델은 단순하지만, 실제 시스템에서는 여러 통신 과제가 함께 해결되어야 한다. `transmission system utilization`은 공유 전송 설비를 효율적으로 쓰는 문제다. 여러 사용자가 하나의 전송 매체를 나누어 쓰기 때문에 `multiplexing`이 필요하고, 수요가 과하면 시스템이 압도되지 않도록 `congestion control`도 필요하다.

장치가 전송 시스템과 통신하려면 먼저 `interfacing`이 필요하고, 전자기 신호가 매체를 통해 전파될 수 있도록 `signal generation`이 이루어져야 한다. 신호의 형태와 세기는 전송 시스템을 통과할 수 있어야 하며, 수신자가 다시 데이터로 해석할 수 있어야 한다. 이때 `synchronization`은 송신자와 수신자가 신호의 시작, 끝, 각 signal element의 지속 시간을 맞추는 문제다.

`exchange management`는 양쪽 장치가 데이터를 어떤 방식으로 주고받을지 정하는 규칙 묶음이다. 동시에 보낼 수 있는지, 번갈아 보내야 하는지, 한 번에 얼마만큼 보낼지, 데이터 형식은 무엇인지, 오류가 나면 어떻게 할지 같은 약속이 필요하다. 뒤 장에서 배우는 protocol의 필요성이 여기서 자연스럽게 등장한다.

통신에서는 신호가 전송 중 왜곡될 수 있으므로 `error detection and correction`이 필요하다. 파일 전송처럼 데이터 변경을 허용할 수 없는 경우에는 특히 중요하다. `flow control`은 source가 destination이 처리할 수 있는 속도보다 빠르게 데이터를 보내 destination을 압도하지 않도록 하는 메커니즘이다.

`addressing`과 `routing`은 비슷해 보이지만 구분된다. 둘 이상의 장치가 전송 설비를 공유하면 source는 의도한 destination의 식별자를 표시해야 한다. 이것이 addressing이다. 반면 transmission system 자체가 여러 경로를 가진 network라면, 실제로 어느 경로로 보낼지 선택해야 한다. 이것이 routing이다.

`recovery`는 error correction과 다르다. error correction은 전송된 데이터의 오류를 고치는 문제이고, recovery는 database transaction이나 file transfer가 시스템 fault로 중단되었을 때 중단 지점에서 재개하거나 교환 전 상태로 되돌리는 문제다. 즉 비트 단위 정확성뿐 아니라 작업 전체의 상태 일관성까지 다룬다.

마지막으로 `message formatting`, `security`, `network management`가 필요하다. Message formatting은 문자 표현을 위한 binary code처럼 데이터 형식에 대한 합의다. Security는 의도한 수신자만 데이터를 받고, 전송 중 데이터가 바뀌지 않았으며, 송신자가 실제 주장한 송신자인지 보장하려는 요구다. Network management는 시스템 구성, 상태 감시, 장애와 overload 대응, 미래 성장 계획을 담당한다.

이 절의 핵심은 source-destination 사이의 단순한 데이터 전달이 실제로는 multiplexing, synchronization, addressing, routing, recovery, security, management 같은 문제로 분해된다는 점이다. 이후 장들의 세부 기술은 이 목록을 하나씩 구체화한다.

### 1.3 Data Communications

이 절의 `Data Communications`는 책 전체의 넓은 의미가 아니라 Part Two의 초점, 즉 신호를 신뢰성 있고 효율적으로 전송하는 기능을 가리킨다. 원문은 전자우편(electronic mail) 예시로 Figure 1.3의 흐름을 설명한다. 사용자가 keyboard로 메시지 $m$을 입력하면 PC 메모리에는 bit sequence $g$가 생기고, 이 데이터는 I/O 장치인 transmitter로 전달되면서 전압 변화 $g(t)$로 표현된다. Transmitter는 이를 전송 매체에 적합한 signal $s(t)$로 바꾼다.

![Figure 1.3](@/assets/images/cs-data-communication-004-figure-1-3-page-38.png)
*Figure 1.3 · PDF p. 38 · input information이 signal을 거쳐 output information으로 복원되는 data communications model*

전송된 signal $s(t)$는 medium을 지나면서 감쇠, 잡음, 왜곡 같은 `transmission impairments`의 영향을 받는다. 따라서 receiver가 실제로 받는 $r(t)$는 $s(t)$와 같지 않을 수 있다. Receiver는 medium에 대한 지식과 받은 signal을 바탕으로 원래의 signal을 추정하고, bit sequence $g'(t)$를 만들어 destination PC로 넘긴다. 데이터 통신 시스템은 여기서 오류가 생겼는지 확인하고, 필요하면 source와 협력해 완전하고 오류 없는 block of data를 얻으려 한다. 최종적으로 사용자가 보는 message $m'$는 보통 원래 message $m$과 정확히 같아야 한다.

전화 통화 예시는 데이터 통신과 음성 통신의 차이를 보여준다. 전화에서는 입력 메시지 $m$이 sound wave이고, 전화기는 이를 같은 주파수의 electrical signal로 바꾼다. 이 경우 $g(t)$와 $s(t)$는 사실상 동일하게 다뤄지고, medium을 지나며 왜곡된 $r(t)$를 다시 sound wave로 바꿀 뿐 오류 정정이나 품질 개선을 시도하지 않는다. 그래서 $m'$는 $m$의 정확한 복제는 아니지만 대화가 이해 가능하면 목적을 달성한다. 반면 파일 전송이나 전자우편 같은 데이터 처리에서는 정확성이 훨씬 엄격하다.

#### The Transmission of Information

통신 시설의 기본 building block은 `transmission line`이다. 관리자가 모든 물리 계층 세부를 알 필요는 없지만, 시설이 필요한 capacity를 제공하는지, reliability가 충분한지, cost가 적절한지 판단하려면 전송 기술의 핵심 선택지를 이해해야 한다.

첫 번째 선택은 `transmission medium`이다. 구내에서는 기업이 medium을 직접 고를 수 있는 경우가 많고, 장거리 통신에서는 carrier가 선택하는 경우가 많다. 주요 매체는 `twisted-pair line`, `coaxial cable`, `optical fiber cable`, 지상 및 위성 `microwave`다. 매체와 신호의 성질은 achievable data rate와 error rate를 좌우한다.

`optical fiber`는 큰 용량과 낮아진 비용 때문에 장거리 trunk와 사무실 내부망 모두에서 중요해졌다. 특히 fiber는 도청이 매우 어렵다는 보안 특성도 가진다. 하지만 전송로 용량이 크게 늘면 다음 병목은 회선 자체가 아니라 switching 쪽으로 이동한다. 이 맥락에서 `ATM(Asynchronous Transfer Mode) switching`, 스위치 내부의 highly parallel processing, 통합 network management 같은 구조 변화가 등장한다.

`wireless transmission`은 universal personal telecommunications와 universal access to communications 요구에서 중요해진다. 전자는 사용자가 넓은 지역에서 하나의 계정으로 자신을 식별하고 통신 시스템을 쓸 수 있음을 뜻한다. 후자는 portable terminal이 사무실, 거리, 비행기 같은 다양한 환경에서 정보 서비스에 접속할 수 있음을 뜻한다. 즉 wireless는 단순한 케이블 대체물이 아니라 이동성과 접근성의 기반이다.

전송 설비 비용은 여전히 많은 기업 통신 예산의 큰 부분을 차지한다. 그래서 `transmission efficiency`가 중요하다. 두 가지 핵심 기술은 `multiplexing`과 `compression`이다. Multiplexing은 여러 장치가 같은 transmission facility를 공유하게 해 비용을 사용자 수로 나누는 방식이다. Compression은 데이터를 더 작게 표현해 더 낮은 capacity의 저렴한 전송 설비로도 같은 요구를 만족하게 한다. 두 기술은 따로 쓰이거나 함께 쓰일 수 있다.

#### Part Two로 이어지는 세부 기술

| 범위 | 핵심 질문 | 연결 장 |
| --- | --- | --- |
| `Transmission and Transmission Media` | 어떤 electromagnetic signal을 어떤 medium으로 보낼 것인가 | Chapter 3, Chapter 4 |
| `Communication Techniques` | 정보를 signal로 어떻게 encode하고, device-medium interface를 어떻게 맞출 것인가 | Chapter 5-7 |
| `Data link control protocol` | flow control, 손실·오염 데이터 복구, 오류 검출·정정을 어떻게 할 것인가 | Chapter 6-7 |
| `Transmission Efficiency` | 주어진 resource에 더 많은 정보를 싣거나 필요한 capacity를 줄이는 방법은 무엇인가 | Chapter 8 |

### 1.4 Networks

컴퓨터 수와 처리 능력이 늘어나면, 사용자는 자연스럽게 모든 기계가 서로 통신하기를 요구한다. 이 연결성 요구는 두 방향으로 나타난다. 하나는 다음 절과 다음 장으로 이어지는 communications software/protocol 요구이고, 다른 하나는 실제 장치들을 묶는 `network` 요구다.

`LAN(Local Area Network)`은 중대형 사무실에서 거의 기본 시설이 되었다. 장치 수와 성능이 늘어나면서 LAN의 수와 capacity도 증가했고, 한 사무실 안에도 여러 종류의 LAN이 공존할 수 있다. 따라서 문제는 단순히 LAN 하나를 설치하는 것이 아니라, 다양한 network, computer, terminal을 상호 연결하고 관리하는 일이 된다.

사무실 범위를 넘어서면 voice, data, image, video를 함께 다루는 광역 네트워크가 중요해진다. 원문이 말하는 `integration`은 고객 장비와 네트워크가 음성·데이터·이미지·영상 서비스를 동시에 처리하는 능력이다. 예를 들어 report에 voice commentary, presentation graphics, short video summary가 붙을 수 있다. 이런 서비스는 WAN transmission과 switching에 큰 부담을 준다. Fiber optic transmission은 전송 capacity를 제공하지만, 그 capacity를 빠르게 처리하는 switching system은 별도의 도전 과제다.

#### Wide Area Networks

`WAN(Wide Area Network)`은 넓은 지리적 범위를 덮고, public right-of-way를 지나며, common carrier가 제공하는 회선에 적어도 일부 의존한다. 일반적으로 WAN은 여러 switching node가 상호 연결된 구조다. 내부 node는 데이터 내용에는 관심이 없고, 데이터를 node에서 node로 옮겨 destination에 도달하게 하는 switching facility 역할을 한다.

| WAN 기술 | 핵심 방식 | 장점과 한계 |
| --- | --- | --- |
| `circuit switching` | 두 station 사이에 dedicated communications path를 설정하고, 각 link에서 logical channel을 연결에 전용 | 설정된 경로에서는 빠르게 전달되지만, 전용 capacity를 잡아 두므로 bursty data에는 비효율적일 수 있음 |
| `packet switching` | 데이터를 작은 `packet` sequence로 나누어 node마다 전체 packet을 받아 잠시 저장한 뒤 다음 node로 전달 | 전용 경로가 필요 없고 computer-to-computer 통신에 적합하지만, 초기 설계는 오류 제어 overhead가 큼 |
| `frame relay` | 낮아진 오류율을 전제로 packet switching의 error-control overhead를 대부분 제거 | 64 kbps 수준을 전제로 한 전통 packet switching보다 높은 user data rate, 최대 약 2 Mbps 운용을 목표 |
| `ATM(Asynchronous Transfer Mode)` | 고정 길이 `cell`을 사용하며, error-control overhead를 줄이고 작은 fixed-size cell로 처리 overhead를 낮춤 | 10s/100s Mbps 및 Gbps 범위를 목표로 하며, circuit switching처럼 constant-data-rate channel 성격도 제공 |

`Frame relay`가 등장한 이유는 전송 환경 변화 때문이다. 예전 digital long-distance transmission facility는 오류율이 높았기 때문에 packet마다 redundancy bit와 중간 node의 오류 검출·복구 처리가 필요했다. 현대 고속 통신 시스템에서는 오류율이 크게 낮아졌고, 남은 오류는 packet-switching logic보다 위의 end system logic에서 처리할 수 있다. 그래서 예전 overhead는 불필요할 뿐 아니라, 고속 network capacity를 잡아먹는 역효과가 된다.

`ATM`은 packet switching과 circuit switching의 발전이 만나는 지점이다. Frame relay가 variable-length `frame`을 쓰는 데 비해 ATM은 fixed-length `cell`을 사용한다. 고정 길이는 switch 처리 비용을 낮춘다. 동시에 ATM은 virtual channel을 만들 때 data rate를 동적으로 정의할 수 있어, circuit switching의 고정 data rate 한계를 완화한다. 작은 fixed-size cell 덕분에 packet-switching technique을 쓰면서도 constant-data-rate channel을 제공할 수 있다는 점이 핵심이다.

#### Local Area Networks

`LAN`도 여러 장치를 상호 연결하고 정보 교환 수단을 제공한다는 점에서는 WAN과 같지만, 세 가지 차이가 중요하다.

| 구분 | LAN | WAN |
| --- | --- | --- |
| 범위 | 보통 한 건물 또는 건물 cluster | 넓은 지리적 범위 |
| 소유와 관리 | 대개 연결 장치를 가진 조직이 LAN도 소유 | carrier나 외부 네트워크 자산에 의존하는 경우가 많음 |
| data rate | 내부 data rate가 보통 WAN보다 큼 | 장거리 전송과 switching 제약의 영향이 큼 |

LAN은 소유 조직이 직접 투자하고 관리하기 때문에, 구매·유지보수 비용과 network management 책임이 사용자에게 온다. 대표 구성은 `switched LAN`과 `wireless LAN`이다. `switched Ethernet LAN`은 단일 switch에 여러 장치가 붙거나 여러 switch가 상호 연결된 구조일 수 있다. 그 밖에 local area에서 ATM을 쓰는 ATM LAN, `Fibre Channel`, 다양한 wireless LAN 기술이 언급된다.

`Wireless network`는 LAN뿐 아니라 wide area voice/data network에서도 중요하다. 핵심 장점은 mobility, installation 용이성, configuration 용이성이다. 원문은 wireless WAN과 wireless LAN을 각각 Chapter 14와 Chapter 17에서 더 깊게 다룬다고 연결한다.

### 1.5 The Internet

인터넷의 기원은 ARPA가 1969년에 개발한 `ARPANET`이다. ARPANET은 최초의 operational packet-switching network였고, 이후 packet radio와 satellite communication(`SATNET`)처럼 서로 다른 환경의 packet-switched network를 연결해야 하는 문제가 생겼다. 이 문제에서 `internetworking`, 즉 임의의 여러 packet-switched network를 가로질러 통신하는 방법과 protocol이 발전했다. Vint Cerf와 Bob Kahn의 Transmission Control Protocol 접근이 다듬어져 `TCP(Transmission Control Protocol)`와 `IP(Internet Protocol)`, 그리고 `TCP/IP protocol suite`의 기반이 되었다.

#### Key Elements

인터넷의 목적은 `host`라고 부르는 end system을 상호 연결하는 것이다. Host에는 PC, workstation, server, mainframe뿐 아니라 오늘날의 mobile phone이나 자동차 같은 컴퓨터화된 장치도 포함될 수 있다. 대부분의 host는 `LAN` 또는 `WAN`에 붙고, 이 네트워크들은 `router`로 서로 연결된다. Router는 둘 이상의 network에 붙어 packet을 다음 경로로 넘긴다.

![Figure 1.4](@/assets/images/cs-data-communication-005-figure-1-4-page-45.png)
*Figure 1.4 · PDF p. 45 · host, LAN/WAN, router가 인터넷을 이루는 핵심 요소*

인터넷에서 source host는 보낼 데이터를 `IP datagram` 또는 `IP packet`이라는 작은 packet sequence로 나눈다. 각 packet에는 destination host의 고유 numeric address, 즉 `IP address`가 들어간다. 각 router는 packet을 받을 때 destination address를 보고 routing decision을 내리고, 다음 network 또는 router로 packet을 forwarding한다. 따라서 인터넷은 하나의 거대한 단일 회선이 아니라, packet들이 여러 router와 network를 거쳐 destination으로 이동하는 구조다.

#### Internet Architecture

현대 인터넷은 수천 개의 overlapping hierarchical network로 구성되어 있어 정확한 topology를 한 장의 고정 그림으로 설명하기 어렵다. Figure 1.5는 residential subscriber, corporate LAN, regional ISP, backbone ISP, NAP, POP, private peering이 어떻게 얽히는지 단순화해서 보여준다.

![Figure 1.5](@/assets/images/cs-data-communication-006-figure-1-5-page-46.png)
*Figure 1.5 · PDF p. 46 · regional ISP, backbone ISP, NAP, POP가 연결된 인터넷 일부 구조*

사용자나 조직의 host/LAN은 일반적으로 `ISP(Internet Service Provider)`에 연결된다. 연결은 customer site에 있는 `CPE(Customer Premises Equipment)`에서 시작해 `local loop` 또는 `last mile`을 지나 provider 쪽 시설에 도달한다. 가정 사용자의 CPE는 56-kbps modem일 수도 있고, 더 높은 capacity를 제공하는 DSL, cable modem, satellite 장비일 수도 있다. 회사 사용자는 employer-owned LAN에서 shared organizational trunk를 통해 ISP로 나가며, 예시로 T-1(1.544 Mbps), 대규모 조직의 T-3(44.736 Mbps), 또는 frame relay WAN 연결이 언급된다.

`local loop`는 provider 설치 지점과 host가 있는 site 사이의 물리 인프라다. 56K modem 사용자의 경우 집에서 telephone company의 `CO(Central Office)`까지 가는 copper pair가 local loop가 된다. Cable modem의 경우 집에서 cable company facility까지 가는 coaxial cable이 local loop가 된다. 중간에서 여러 가정의 선이 aggregation되고 fiber 같은 다른 매체로 바뀌더라도, 개념상 customer site에서 CO 또는 cable facility까지의 경로를 local loop라고 부른다. Local loop provider와 ISP는 같을 수도 있고 다를 수도 있다.

`POP(Point of Presence)`는 고객이 ISP network에 접속하는 ISP network의 edge다. 작은 POP는 CO rack에 설치된 modem bank와 access server일 수도 있고, 큰 ISP는 서비스 지역 곳곳에 POP를 둔다. ISP는 사용자에게 internet gateway 역할을 하며, 많은 경우 unique numeric `IP address`, name resolution, 기타 필수 network service를 제공한다. 그러나 가장 중요한 서비스는 다른 ISP network에 접근하게 해 주는 것이다.

ISP/NSP 사이의 연결은 `peering agreement`와 물리적 interconnection으로 이루어진다. POP가 같은 장소에 있으면 local connection으로 직접 연결할 수 있고, 떨어져 있으면 leased line을 쓸 수 있다. 더 일반적인 메커니즘은 `NAP(Network Access Point)`다. NAP는 연결된 network 사이에서 데이터를 이동시키는 물리 시설이며, NSP들이 NAP에 router를 설치하고 NAP infrastructure에 연결한다. Routing은 NSP 장비가 담당하고, NAP infrastructure는 router 사이의 physical access path를 제공한다.

원문의 가상 예시는 인터넷의 원리를 작게 보여준다. Small, Inc.의 네 host는 LAN 안에서 서로 통신하다가 ISP Y에 T-1 line으로 연결되고, Bob의 home computer는 modem으로 ISP Z의 POP에 접속한다. 처음에는 두 ISP가 서로 닿지 않으므로 Bob과 Small, Inc.는 통신할 수 없다. 이후 ISP Y와 ISP Z가 각각 NSP A, NSP B와 계약하고, NSP A와 B가 peering agreement를 맺어 NAP 두 곳에서 연결하면 두 쪽 host가 통신할 수 있다. 실제 인터넷은 이 원리가 수백만 host, 수천 network, satellite, radio, leased T-1, DSL 같은 다양한 access technology로 확장된 것이다.

#### Internet 용어 요약

| 용어 | 의미 |
| --- | --- |
| `CO(Central Office)` | 전화 회사가 customer line을 종단하고 switching equipment를 두는 장소 |
| `CPE(Customer Premises Equipment)` | customer premises에 있는 통신 장비. modem, cable TV set-top box, DSL router 등이 해당 |
| `ISP(Internet Service Provider)` | 개인이나 조직에 인터넷 access 또는 presence를 제공하는 회사 |
| `NAP(Network Access Point)` | ISP/NSP network를 서로 묶는 주요 interconnection facility |
| `NSP(Network Service Provider)` | ISP에 backbone service를 제공하는 회사 |
| `POP(Point of Presence)` | 사용자의 connection을 받아 인증하는 ISP network edge site |

### 1.6 An Example Configuration

Figure 1.6은 Part Two에서 Part Four까지 다룰 통신·네트워크 요소를 하나의 예시 구성으로 보여준다. 왼쪽 위에는 residential user가 subscriber connection을 통해 `ISP(Internet Service Provider)`에 접속한다. Subscriber connection의 대표 예는 public telephone network를 통한 dial-up modem, telephone line 위의 `DSL(Digital Subscriber Line)`과 DSL modem, cable TV facility와 cable modem이다. 각각은 signal encoding, error control, subscriber network 내부 구조 같은 별도 설계 문제를 가진다.

![Figure 1.6](@/assets/images/cs-data-communication-007-figure-1-6-page-49.png)
*Figure 1.6 · PDF p. 49 · residential user, ISP, Internet, firewall, ATM network, Ethernet LAN, private WAN이 연결된 예시 구성*

ISP는 보통 여러 interconnected server와 Internet으로 나가는 high-speed link를 가진다. 그림에는 하나의 server만 보이지만, 실제로는 여러 server가 있을 수 있다. High-speed link의 예로 `SONET(Synchronous Optical Network)` line이 언급된다. Internet 내부는 전 세계에 걸친 interconnected router들의 집합이며, router는 source에서 destination까지 packet을 forwarding한다.

아래쪽은 소규모 조직의 `Ethernet switch` 기반 LAN 예시다. LAN은 security service를 제공하는 `firewall host`를 통해 Internet에 연결된다. 이 예시에서는 firewall이 `ATM network`를 거쳐 Internet에 붙는다. 또한 LAN에서 별도 router가 `private WAN`에 연결되어 있는데, 이 WAN은 private ATM network나 frame relay network일 수 있다.

이 구성에서 설계 문제는 한 계층이나 한 장비에만 갇히지 않는다. 인접 요소 사이의 link, 예를 들어 Internet router 사이, ATM switch 사이, subscriber와 ISP 사이에서는 signal encoding과 error control 문제가 생긴다. Telephone, ATM, Ethernet 같은 각 network의 내부 구조도 별도 설계 문제를 만든다. 따라서 Chapter 1의 예시는 이후 Part Two의 전송 기술, Part Three의 WAN, Part Four의 LAN을 한 장면으로 연결해 준다.

## 연결 관계

- Chapter 1의 communications model은 Chapter 2의 `protocol architecture`, `TCP/IP`, `OSI model`로 이어진다. 여기서 본 exchange management, addressing, routing, error control, flow control은 protocol layer로 조직된다.
- `Data Communications`의 signal, medium, encoding, data link control, multiplexing은 Part Two의 Chapter 3-9에서 물리적·링크 수준 문제로 자세히 다뤄진다.
- `Networks`에서 본 circuit switching, packet switching, frame relay, ATM은 Part Three의 WAN 주제로 이어진다. 특히 전송 오류율이 낮아지면 네트워크 내부 error-control overhead를 줄이고 end system이나 상위 계층에 맡기는 설계 trade-off가 반복된다.
- `LAN`, `switched Ethernet LAN`, `wireless LAN`, `Fibre Channel`은 Part Four에서 구체적인 topology, protocol architecture, bridge/switch 구조로 확장된다.
- `Internet`의 IP packet, router, ISP, POP, NAP, NSP, peering은 이후 Internet Protocol, routing protocol, transport protocol, Internet application을 이해하기 위한 기본 지도다.

## 오해하기 쉬운 내용

- `Data communications`는 넓게 보면 책 전체 범위를 포함할 수 있지만, 이 장의 1.3에서는 주로 Part Two의 전송 신호·매체·효율 문제를 가리킨다.
- `Error correction`과 `recovery`는 다르다. Error correction은 전송 데이터 오류를 고치는 문제이고, recovery는 file transfer나 transaction이 중단되었을 때 작업 상태를 재개하거나 되돌리는 문제다.
- `Addressing`과 `routing`도 다르다. Addressing은 destination을 식별하는 일이고, routing은 network 안의 가능한 경로 중 실제 전달 경로를 고르는 일이다.
- `Frame relay`와 `ATM`이 error-control overhead를 줄인 것은 오류를 무시해서가 아니라, 현대 전송 시설의 낮은 error rate와 end system/higher layer logic을 활용하는 설계 판단 때문이다.
- `POP`, `NAP`, `ISP`, `NSP`는 모두 “인터넷 연결 지점”처럼 보이지만 역할이 다르다. POP는 사용자가 ISP edge에 붙는 지점이고, NAP는 여러 provider network가 물리적으로 interconnect되는 시설이며, NSP는 backbone service를 제공한다.
- `LAN`은 단지 좁은 범위의 network가 아니다. 대개 조직이 직접 소유·관리하고 내부 data rate가 높다는 점 때문에 구매, 유지보수, management 책임이 WAN과 다르게 나타난다.

## 면접 질문

1. `Data communications`와 `networking`의 차이를 이 장의 관점에서 설명하라.
2. Communications model에서 `source`, `transmitter`, `transmission system`, `receiver`, `destination`의 역할은 무엇인가?
3. `multiplexing`과 `compression`은 각각 어떤 방식으로 transmission efficiency를 높이는가?
4. `circuit switching`, `packet switching`, `frame relay`, `ATM`의 핵심 차이와 등장 배경을 설명하라.
5. `addressing`과 `routing`은 왜 구분해야 하는가?
6. Internet에서 host가 데이터를 보낼 때 `IP packet`, `IP address`, `router`는 각각 어떤 역할을 하는가?
7. `CPE`, `local loop`, `POP`, `ISP`, `NAP`, `NSP`를 사용자 접속부터 provider interconnection까지의 흐름으로 설명하라.
8. Figure 1.6의 예시 configuration에서 residential user, ISP, Internet, firewall host, Ethernet LAN, private WAN은 어떻게 연결되는가?
