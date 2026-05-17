---
title: "Chapter 4. Transmission Media"
order: 4
pubDatetime: 2026-05-18T00:00:00+09:00
modDatetime: 2026-05-18T00:00:00+09:00
description: "Data and Computer Communications 정리: Chapter 4. Transmission Media"
tags:
  - "DataCommunication"
  - "CS"
---

> 원문 범위: PDF pp. 121-156  
> 과목: Data Communication  
> 주제: guided transmission media, wireless transmission, wireless propagation, line-of-sight transmission

## 4.0 장의 핵심 관점

Transmission medium은 송신기(transmitter)와 수신기(receiver) 사이에서 신호가 지나가는 물리적 경로다. 이 장은 통신 성능을 “어떤 매체를 쓰는가”와 “그 매체 위에서 신호가 어떻게 약해지고 왜곡되는가”로 설명한다.

전송 매체는 크게 guided media와 unguided media로 나뉜다. guided media는 twisted pair, coaxial cable, optical fiber처럼 신호가 물리적 도체나 광섬유 안을 따라 이동한다. unguided media는 공기, 진공, 물 같은 공간을 통해 안테나가 방사한 electromagnetic wave가 이동한다. guided media에서는 매체 자체의 특성이 전송 한계를 크게 결정하고, unguided media에서는 안테나가 만들어내는 signal bandwidth와 directionality가 특히 중요하다.

전송 매체를 고를 때 핵심 설계 변수는 data rate와 distance다. 같은 조건이라면 bandwidth가 클수록 가능한 data rate가 커진다. 그러나 실제 링크에서는 attenuation, noise, distortion, interference가 거리와 속도를 제한한다. twisted pair는 일반적으로 impairments가 가장 크고, coaxial cable은 그보다 낫고, optical fiber는 훨씬 낮은 attenuation과 electromagnetic isolation을 제공한다. multipoint link처럼 하나의 매체에 수신기가 여러 개 붙으면 각 attachment가 attenuation과 distortion을 추가하므로 거리와 data rate가 더 제한된다.

![Figure 4.1](@/assets/images/cs-data-communication-electromagnetic-spectrum-figure-4-1.png)
*Figure 4.1 · PDF p. 124 · 통신에서 쓰이는 electromagnetic spectrum과 guided/unguided transmission media의 위치*

Figure 4.1은 통신에서 다루는 주파수 범위가 매우 넓다는 점을 보여준다. twisted pair와 coaxial cable은 주로 전기 신호를, optical fiber는 infrared/visible light 영역의 광 신호를, wireless transmission은 radio/microwave 영역의 전자기파를 사용한다. 이 구분은 이후 장의 modulation, bandwidth, antenna, propagation 논의와 직접 연결된다.

## 4.1 Guided Transmission Media

Guided transmission media에서는 신호가 매체의 물리적 경계를 따라 이동한다. 매체의 종류, 케이블 길이, point-to-point인지 multipoint인지가 transmission capacity를 좌우한다. 이 장의 guided media는 twisted pair, coaxial cable, optical fiber 세 가지다.

![Figure 4.2](@/assets/images/cs-data-communication-guided-transmission-media-figure-4-2.png)
*Figure 4.2 · PDF p. 125 · twisted pair, coaxial cable, optical fiber의 물리적 구조 비교*

### Twisted Pair

Twisted pair는 절연된 구리선 두 가닥을 규칙적으로 꼬아 만든 매체다. 한 쌍(pair)이 하나의 통신 링크로 동작하고, 여러 쌍이 하나의 케이블로 묶인다. 두 선을 꼬는 이유는 인접한 pair 사이의 crosstalk와 외부 electromagnetic interference를 줄이기 위해서다. 인접 pair는 보통 twist length를 다르게 만들어 같은 간섭 패턴이 지속적으로 누적되지 않게 한다.

twisted pair는 analog transmission과 digital transmission 모두에 가장 널리 쓰인 guided medium이었다. 전통적인 telephone subscriber loop, office PBX/Centrex 배선, 건물 내부 digital signaling, 일부 LAN에서 사용된다. 장점은 값이 싸고, 이미 건물 안에 많이 깔려 있으며, 설치와 취급이 쉽다는 점이다. 반대로 distance, bandwidth, data rate 측면에서는 coaxial cable이나 optical fiber보다 제약이 크다.

twisted pair의 전송 특성은 주파수에 민감하다. attenuation은 frequency가 높을수록 커지며, noise와 interference에도 취약하다. 대표적인 간섭원은 60-Hz power line, impulse noise, 인접 pair의 crosstalk다. 이를 줄이기 위해 shielding, twisting, 서로 다른 twist length가 사용된다. analog link에서는 몇 km마다 amplifier가 필요하고, digital link에서는 더 짧은 간격으로 repeater가 필요하다.

UTP(Unshielded Twisted Pair)는 일반 전화선 형태의 비차폐 twisted pair다. LAN에서 값싸고 다루기 쉬운 매체로 널리 쓰였지만, 외부 EMI와 인접 pair noise에 더 취약하다. STP(Shielded Twisted Pair)는 metallic braid나 sheath를 추가해 noise immunity와 high data rate 성능을 높이지만, 더 비싸고 설치가 까다롭다. Category 5, Category 6, Category 7 같은 UTP category는 attenuation과 crosstalk 성능, 즉 ACR(attenuation-to-crosstalk ratio)을 기준으로 더 높은 주파수와 data rate를 지원하도록 발전했다.

### Coaxial Cable

Coaxial cable은 중심 도체(inner conductor)를 원통형 외부 도체(outer conductor)가 둘러싸는 구조다. 두 도체 사이에는 dielectric material이 있고, 바깥에는 보호 jacket이 있다. Figure 4.2에서 보듯이 외부 도체가 shield 역할을 하므로 twisted pair보다 interference와 crosstalk에 강하다.

coaxial cable은 twisted pair보다 더 긴 거리와 더 높은 주파수 특성을 제공한다. 전통적으로 cable TV distribution, long-distance telephone transmission, short-run computer system links, LAN에 쓰였다. cable TV에서는 수십 km 범위에서 수많은 TV channel을 나르는 용도로 사용되었고, long-distance telephone에서는 FDM(Frequency Division Multiplexing)을 통해 많은 voice channel을 동시에 실었다.

전송 한계는 attenuation, thermal noise, intermodulation noise가 만든다. 특히 FDM으로 여러 frequency band를 동시에 쓰면 nonlinear effect 때문에 intermodulation noise가 문제가 될 수 있다. analog transmission에서는 몇 km마다 amplifier가 필요하고, 더 높은 주파수를 쓸수록 간격은 짧아진다. digital transmission에서는 repeater가 필요하며, data rate가 높을수록 repeater 간격이 줄어든다.

### Optical Fiber

Optical fiber는 매우 얇고 유연한 유리 또는 플라스틱 매체로, 빛을 이용해 정보를 전송한다. 기본 구조는 core, cladding, jacket이다. core는 빛이 실제로 지나가는 중심부이고, cladding은 core보다 굴절률이 낮아 core-cladding 경계에서 빛이 반사되도록 만든다. jacket은 moisture, abrasion, crushing 같은 환경적 손상으로부터 fiber를 보호한다.

optical fiber의 강점은 네트워크 설계에서 매우 결정적이다. 첫째, enormous capacity를 제공한다. 수십 km 거리에서 수백 Gbps급 전송이 가능할 만큼 bandwidth가 크다. 둘째, 케이블이 작고 가볍다. 셋째, attenuation이 낮아 repeater spacing이 길다. 넷째, electromagnetic isolation이 뛰어나 외부 electromagnetic field, crosstalk, impulse noise의 영향을 거의 받지 않는다. 또한 신호 방사가 거의 없어 tapping이 어렵고 보안 측면에서도 유리하다.

![Figure 4.3](@/assets/images/cs-data-communication-guided-media-attenuation-figure-4-3.png)
*Figure 4.3 · PDF p. 127 · twisted pair, coaxial cable, optical fiber의 attenuation 특성 비교*

Figure 4.3의 핵심은 매체별 attenuation 곡선이 다르다는 점이다. twisted pair는 frequency 증가에 따라 손실이 빠르게 증가한다. coaxial cable은 더 높은 주파수까지 견디지만 여전히 거리와 주파수의 영향을 받는다. optical fiber는 특정 optical window에서 매우 낮은 attenuation을 보이므로 long-haul trunk, metropolitan trunk, rural exchange trunk, subscriber loop, high-speed LAN에 적합하다.

Optical fiber transmission은 total internal reflection에 기반한다. 빛은 core 내부에서 반사되며 진행하고, fiber는 약 \(10^{14}\)~\(10^{15}\) Hz 범위의 infrared/visible light에 대한 waveguide처럼 동작한다. 전송 mode는 크게 step-index multimode, single mode, graded-index multimode로 구분된다.

![Figure 4.4](@/assets/images/cs-data-communication-optical-fiber-modes-figure-4-4.png)
*Figure 4.4 · PDF p. 134 · optical fiber의 step-index multimode, single mode, graded-index multimode 전송 방식*

step-index multimode에서는 여러 광선이 서로 다른 각도와 경로 길이로 이동한다. 이 때문에 같은 pulse의 일부가 서로 다른 시간에 도착해 pulse spreading이 발생하고, data rate와 distance가 제한된다. single mode는 core radius를 빛의 wavelength 수준으로 작게 만들어 하나의 축 방향 mode만 주로 전파되게 한다. multimode distortion이 거의 없어 장거리와 고속 전송에 적합하다. graded-index multimode는 core의 refractive index를 중심에서 바깥으로 갈수록 낮게 설계한다. 중심 근처를 지나는 광선은 경로가 짧지만 느리게, 바깥쪽을 지나는 광선은 경로가 길지만 빠르게 진행하므로 도착 시간 차이가 줄어든다.

광원으로는 LED와 ILD(Injection Laser Diode)가 쓰인다. LED는 저렴하고 온도 변화에 강하며 수명이 길지만 data rate와 distance가 제한된다. ILD는 더 효율적이고 higher data rate를 제공하지만 일반적으로 더 정밀한 제어와 비용이 필요하다. 대표 optical transmission window는 820-900 nm, 1280-1350 nm, 1528-1561 nm(C band), 1561-1620 nm(L band)이며, WDM(Wavelength Division Multiplexing)은 특히 C band와 L band에서 여러 wavelength를 동시에 실어 fiber capacity를 크게 높인다.

fiber에서 주의할 점은 wavelength 표기가 보통 vacuum wavelength 기준이라는 것이다. 신호의 frequency는 매체가 바뀌어도 유지되지만, fiber 내부에서는 propagation velocity가 낮아지므로 실제 wavelength는 짧아진다. 예를 들어 1550 nm vacuum wavelength는 약 193.4 THz에 해당하고, fiber 내부 속도가 약 \(2.04 \times 10^8\) m/s라면 fiber 내부 wavelength는 약 1055 nm가 된다.

## 4.2 Wireless Transmission

Wireless transmission에서는 물리적 선로가 아니라 antenna를 통해 electromagnetic energy를 방사하고 수집한다. 이 장의 wireless 주파수 범위는 크게 세 부류로 잡을 수 있다.

| 범위 | 원문 용어 | 대표 성격 |
|---|---|---|
| 약 1-40 GHz | microwave frequencies | highly directional beam이 가능해 point-to-point link와 satellite communication에 적합 |
| 약 30 MHz-1 GHz | radio range | omnidirectional application에 적합, FM radio와 VHF/UHF television 포함 |
| 약 \(3 \times 10^{11}\)-\(2 \times 10^{14}\) Hz | infrared | 한 방(room) 같은 confined area의 local point-to-point/multipoint application에 적합 |

### Antennas

Antenna는 electromagnetic energy를 방사하거나 수집하는 도체 또는 도체 시스템이다. 송신 시에는 transmitter의 radio-frequency electrical energy를 electromagnetic energy로 바꿔 주변 환경으로 방사하고, 수신 시에는 antenna에 도달한 electromagnetic energy를 radio-frequency electrical energy로 바꿔 receiver에 전달한다.

같은 frequency를 사용한다면 하나의 antenna가 transmission과 reception에 모두 쓰일 수 있다. antenna는 에너지를 주변 환경에서 입력 단자로 끌어오는 효율과 출력 단자에서 주변 환경으로 방사하는 효율이 본질적으로 같기 때문이다. 따라서 antenna characteristics는 송신과 수신에서 기본적으로 동일하게 취급된다.

radiation pattern은 antenna가 공간 방향별로 얼마나 잘 방사하는지 나타내는 그래프다. 이상적인 기준은 isotropic antenna다. isotropic antenna는 공간의 한 점에서 모든 방향으로 동일한 power를 방사하는 가상의 antenna이며, radiation pattern은 구 형태다. 실제 antenna는 특정 방향에 더 많은 power를 집중시키며, 이 directionality를 antenna gain으로 표현한다.

![Figure 4.5](@/assets/images/cs-data-communication-parabolic-reflective-antenna-figure-4-5.png)
*Figure 4.5 · PDF p. 137 · parabolic reflective antenna가 focus의 신호를 축 방향 beam으로 반사하는 원리*

Parabolic reflective antenna는 terrestrial microwave와 satellite application에서 중요한 antenna다. parabolic surface의 focus에 전자기파 source를 두면 반사파가 축과 평행한 beam으로 나간다. 수신할 때는 축과 평행하게 들어온 wave가 focus에 모인다. 이 구조는 좁고 강한 directional beam을 만들며, antenna diameter가 커질수록 beam이 더 좁아진다.

Antenna gain은 특정 방향의 power output을 완전한 omnidirectional antenna, 즉 isotropic antenna가 같은 방향으로 내는 power와 비교한 값이다. gain이 크다는 말은 더 많은 에너지를 만들어낸다는 뜻이 아니라, 다른 방향으로 갈 power를 줄이고 특정 방향으로 집중시킨다는 뜻이다. effective area \(A_e\)와 gain \(G\)의 관계는 다음과 같다.

\[
G = \frac{4\pi A_e}{\lambda^2} = \frac{4\pi f^2 A_e}{c^2}
\]

여기서 \(f\)는 carrier frequency, \(\lambda\)는 carrier wavelength, \(c\)는 speed of light다. frequency가 높아져 wavelength가 짧아지면 같은 effective area에서도 antenna gain이 커질 수 있다. 이 때문에 microwave처럼 높은 frequency에서는 상대적으로 작은 antenna로도 높은 directionality를 얻을 수 있다.

### Terrestrial Microwave

Terrestrial microwave는 보통 parabolic dish antenna를 지상 높은 곳에 고정해 narrow beam을 보내는 point-to-point wireless link다. line-of-sight transmission이 필요하므로 antenna는 지표면 장애물을 넘고 지구 곡률의 영향을 줄이기 위해 높은 tower에 설치된다. 장거리에서는 여러 microwave relay tower를 이어붙여 원하는 거리를 커버한다.

주요 용도는 long-haul telecommunications에서 coaxial cable이나 optical fiber의 대안으로 쓰이는 것이다. 같은 거리에서 coaxial cable보다 amplifier/repeater 수가 적지만, line-of-sight 조건을 만족해야 한다. short point-to-point link로는 건물 간 CCTV, LAN interconnection, 또는 local telephone company를 우회하는 bypass application에도 쓰인다.

microwave transmission의 일반 범위는 1-40 GHz다. frequency가 높을수록 가능한 bandwidth와 data rate가 커지지만 attenuation도 커진다. microwave/free-space loss는 다음 식으로 표현된다.

\[
L = 10 \log \left(\frac{4 \pi d}{\lambda}\right)^2 \text{ dB}
\]

손실은 distance의 제곱에 비례하고 wavelength가 짧을수록 커진다. guided media의 손실이 거리와 함께 지수적으로 누적되는 것과 달리 microwave에서는 repeater/amplifier 간격을 10-100 km 정도로 둘 수 있다. 그러나 rainfall은 attenuation을 증가시키며, 특히 10 GHz 이상에서 rain attenuation이 두드러진다. 또한 microwave 사용이 많아지면 coverage area가 겹쳐 interference가 생기므로 frequency band assignment는 엄격히 규제된다.

### Satellite Microwave

Communication satellite는 본질적으로 우주에 있는 microwave relay station이다. ground station이 uplink frequency로 위성에 신호를 보내면, 위성은 이를 증폭 또는 반복해 다른 downlink frequency로 다시 지상에 보낸다. 위성 하나는 여러 frequency band를 transponder channel 또는 transponder로 운영할 수 있다.

![Figure 4.6](@/assets/images/cs-data-communication-satellite-communication-configurations-figure-4-6.png)
*Figure 4.6 · PDF p. 140 · satellite communication의 point-to-point link와 broadcast link 구성*

Figure 4.6의 첫 번째 구성은 두 지상 antenna 사이의 point-to-point link다. 두 번째 구성은 하나의 지상 transmitter에서 여러 receiver로 보내는 broadcast link다. 위성이 지상의 earth station과 계속 line of sight를 유지하려면 지구에 대해 정지해 보이는 orbit이 필요하다. 지구 자전 주기와 같은 주기로 도는 geostationary orbit은 적도 상공 약 35,863 km에서 가능하다.

위성 간 interference를 피하려면 같은 frequency band를 쓰는 위성 사이에 angular spacing이 필요하다. 원문은 4/6-GHz band에서 4도, 12/14 GHz에서 3도 spacing을 예로 든다. 따라서 geostationary orbit에 동시에 배치할 수 있는 위성 수는 무한하지 않다.

satellite의 주요 application은 television distribution, long-distance telephone transmission, private business networks, global positioning이다. television distribution에서는 위성의 broadcast 성격이 큰 장점이다. direct broadcast satellite(DBS)는 위성 video signal을 home user에게 직접 전달한다. long-distance telephone에서는 international trunk나 장거리 trunk에 쓰이고, business network에서는 위성 capacity를 여러 channel로 나누어 private network 용도로 임대할 수 있다.

![Figure 4.7](@/assets/images/cs-data-communication-vsat-configuration-figure-4-7.png)
*Figure 4.7 · PDF p. 142 · VSAT 가입자 station들이 satellite와 hub station을 공유하는 구성*

VSAT(Very Small Aperture Terminal)는 작은 저가 satellite antenna를 여러 subscriber station에 배치하고, 이들이 satellite transmission capacity를 공유해 hub station과 통신하게 하는 구성이다. hub는 각 subscriber와 메시지를 교환하고 subscriber 사이의 relay 역할도 한다. VSAT는 고가의 전용 satellite network를 대규모 조직만 쓰던 상황에서 더 낮은 비용의 private data network 대안이 된다.

GPS(Global Positioning System)는 satellite microwave의 또 다른 대표 응용이다. GPS receiver는 여러 위성이 보내는 고유 digital code sequence를 내부에서 생성한 code와 맞춰 signal travel time을 구하고, speed of light를 이용해 satellite까지의 distance로 변환한다. 네 개 이상의 satellite까지의 distance와 각 satellite의 정확한 위치를 알면 receiver는 latitude, longitude, height를 계산하고 동시에 GPS time standard에 맞춰 clock synchronization을 수행한다.

satellite transmission의 최적 frequency range는 대략 1-10 GHz다. 1 GHz 아래에서는 natural noise와 human-made interference가 크고, 10 GHz 위에서는 atmospheric absorption과 precipitation attenuation이 심해진다. 전통적 4/6-GHz band는 uplink 5.925-6.425 GHz, downlink 3.7-4.2 GHz를 사용한다. satellite는 같은 frequency로 동시에 송수신할 수 없으므로 uplink와 downlink frequency가 달라야 한다. 4/6-GHz band가 포화되면서 12/14-GHz band와 20/30-GHz band가 고려되지만, frequency가 높아질수록 attenuation 문제는 커진다.

satellite communication의 중요한 특성은 propagation delay와 broadcast nature다. geostationary satellite를 거치는 지상국 간 전송은 약 0.25초 수준의 delay를 만들며, 이는 전화 통화에서도 체감되고 이후 error control과 flow control 설계에도 영향을 준다. 또한 위성은 본질적으로 broadcast facility라서 많은 station이 위성으로 송신할 수 있고, 위성에서 내려오는 전송도 많은 station이 수신할 수 있다.

### Broadcast Radio

Broadcast radio와 microwave의 가장 큰 차이는 directionality다. microwave가 directional beam을 쓰는 반면 broadcast radio는 omnidirectional transmission에 적합하다. 따라서 dish-shaped antenna나 정밀한 alignment가 필요하지 않다.

원문에서 broadcast radio는 30 MHz-1 GHz 범위의 VHF와 UHF 일부를 가리킨다. 이 범위는 FM radio, UHF/VHF television, 여러 data networking application을 포함한다. 30 MHz 이상에서는 ionosphere가 radio wave를 반사하지 않고 거의 통과시키므로 transmission은 line of sight로 제한된다. 그 대신 멀리 떨어진 transmitter가 대기 반사 때문에 서로 간섭하는 문제는 줄어든다.

broadcast radio는 microwave보다 wavelength가 길기 때문에 같은 free-space loss 식에서 상대적으로 attenuation이 작고, rainfall attenuation에도 덜 민감하다. 하지만 land, water, building, aircraft 같은 물체에서 반사된 신호가 여러 경로로 도착하면 multipath interference가 발생한다. TV 화면에 겹친 image가 보이는 현상은 이런 multipath의 직관적 예다.

### Infrared

Infrared communication은 noncoherent infrared light를 modulate하는 transmitter/receiver, 즉 transceiver를 사용한다. transceiver는 서로 직접 line of sight에 있거나, 방 천장처럼 밝은 표면에서 반사된 경로를 통해 서로 볼 수 있어야 한다.

infrared가 microwave와 다른 중요한 점은 wall penetration이 없다는 것이다. 벽을 통과하지 못하므로 microwave에서 문제가 되는 일부 security problem과 외부 interference problem이 자연스럽게 줄어든다. 또한 infrared는 일반적으로 licensing이 필요하지 않아 frequency allocation 문제가 없다. 대신 방이나 제한된 공간 안의 local application에 적합하고, 넓은 지역 커버리지에는 맞지 않는다.

## 4.3 Wireless Propagation

antenna에서 방사된 signal은 주파수와 환경에 따라 ground wave, sky wave, line of sight(LOS) 중 하나의 방식으로 전파된다. 이 책의 이후 논의는 거의 LOS communication에 집중하지만, 세 mode의 차이를 알아야 wireless system의 거리, 장애물, 간섭 조건을 이해할 수 있다.

![Figure 4.8](@/assets/images/cs-data-communication-wireless-propagation-modes-figure-4-8.png)
*Figure 4.8 · PDF p. 146 · ground wave, sky wave, line-of-sight propagation의 경로 비교*

### Ground Wave Propagation

Ground wave propagation은 전파가 지표면의 윤곽을 어느 정도 따라가는 방식이다. visual horizon을 넘어 상당한 거리까지 전달될 수 있으며, 대략 2 MHz 이하에서 나타난다. 이 주파수 범위의 electromagnetic wave는 지표면에 current를 유도하고, 지표면 가까이의 wavefront가 느려져 아래로 기울어지면서 지구 곡률을 따라간다. 또한 diffraction과 atmospheric scattering도 wave가 상층 대기로 빠져나가지 않고 지표면을 따라가도록 돕는다.

대표 예는 AM radio다. ground wave는 긴 wavelength 덕분에 지형을 따라가고 장애물 주변으로 휘어질 수 있지만, 높은 frequency 통신에는 주된 방식이 아니다.

### Sky Wave Propagation

Sky wave propagation은 지상 antenna가 보낸 signal이 상층 대기의 ionosphere에서 굴절되어 다시 지표면으로 돌아오는 방식이다. 겉보기에는 ionosphere에서 반사되는 것처럼 보이지만 실제 물리적 원인은 refraction이다. signal은 ionosphere와 지표면 사이를 여러 번 hop하면서 수천 km 떨어진 곳에서도 수신될 수 있다.

이 방식은 amateur radio, CB radio, BBC나 Voice of America 같은 international broadcast에 쓰인다. 다만 propagation quality는 시간대, 계절, frequency에 따라 변할 수 있다.

### Line-of-Sight Propagation

30 MHz 이상에서는 ground wave와 sky wave propagation이 주된 방식으로 동작하지 않는다. 따라서 communication은 line of sight(LOS)에 의존한다. satellite communication에서는 30 MHz 이상의 signal이 ionosphere에 반사되지 않으므로, horizon 밖에 있지 않은 위성과 earth station 사이에 직접 경로가 생긴다. 지상 microwave link에서는 transmitting antenna와 receiving antenna가 effective line of sight 안에 있어야 한다.

여기서 effective라는 표현이 중요한데, microwave는 atmosphere에 의해 약간 굴절되기 때문이다. 일반적으로 대기의 refractive index는 고도가 높아질수록 낮아져, radio wave가 지표면 쪽으로 조금 휘어진다. 그래서 radio line of sight는 optical line of sight보다 약간 더 멀리 간다.

### Refraction과 Radio Horizon

Refraction은 electromagnetic wave가 밀도가 다른 medium으로 이동할 때 propagation velocity가 달라져 진행 방향이 휘는 현상이다. 진공에서 electromagnetic wave는 \(c \approx 3 \times 10^8\) m/s로 이동하지만, air, water, glass 같은 medium에서는 이보다 느리다. 한 medium에서 다른 medium으로 갑자기 넘어가면 경계에서 한 번 꺾이고, refractive index가 서서히 변하는 medium을 통과하면 signal이 연속적으로 조금씩 휜다.

refractive index는 wavelength에 따라 달라지므로, 같은 경로라도 frequency가 다른 signal은 refraction 효과가 다를 수 있다. 대기에서는 정상 조건에서 지표면 근처의 radio wave가 더 느리게 이동해 wave가 지구 쪽으로 약간 구부러진다.

![Figure 4.9](@/assets/images/cs-data-communication-optical-radio-horizons-figure-4-9.png)
*Figure 4.9 · PDF p. 147 · optical horizon보다 radio horizon이 더 멀리 형성되는 이유*

장애물이 없을 때 antenna height \(h\)가 meter 단위라면 optical horizon까지의 거리 \(d\)는 km 단위로 다음과 같이 근사된다.

\[
d = 3.57\sqrt{h}
\]

radio horizon은 refraction 보정 계수 \(K\)를 포함해 다음처럼 표현한다.

\[
d = 3.57\sqrt{Kh}
\]

실무적 rule of thumb은 \(K = 4/3\)이다. 두 antenna 높이가 각각 \(h_1, h_2\)이면 LOS maximum distance는 다음처럼 잡을 수 있다.

\[
d_{\max} = 3.57(\sqrt{Kh_1} + \sqrt{Kh_2})
\]

이 식의 설계적 의미는 분명하다. 송신 antenna만 높이는 것보다 수신 antenna도 지면에서 들어 올리면 같은 거리 조건을 훨씬 낮은 transmitter height로 만족할 수 있다. 원문 Example 4.3은 receiver antenna를 10 m만 올려도 필요한 transmitter height가 크게 줄어드는 것을 보여준다.

## 4.4 Line-of-Sight Transmission

Line-of-sight transmission에서는 Chapter 3의 일반적 transmission impairments에 더해 wireless LOS 환경 특유의 손실과 왜곡을 고려해야 한다. 핵심 항목은 free space loss, atmospheric absorption, multipath, refraction이다.

### Free Space Loss

Wireless communication에서는 신호가 거리가 멀어질수록 더 넓은 면적으로 퍼진다. 따라서 다른 attenuation source가 전혀 없다고 가정해도, 고정된 면적의 receiving antenna가 잡는 signal power는 거리가 멀수록 줄어든다. 이 손실이 free space loss다. satellite communication에서는 이 free space loss가 가장 지배적인 손실 원인이다.

isotropic antenna를 가정하면 radiated power \(P_t\)와 received power \(P_r\)의 비는 다음과 같다.

\[
\frac{P_t}{P_r} = \left(\frac{4\pi d}{\lambda}\right)^2 = \left(\frac{4\pi f d}{c}\right)^2
\]

여기서 \(d\)는 antenna 사이의 propagation distance, \(\lambda\)는 carrier wavelength, \(f\)는 carrier frequency, \(c\)는 speed of light다. dB 형태로 쓰면 손실은 거리와 주파수의 log 함수로 커진다.

\[
L_{dB} = 20\log\left(\frac{4\pi d}{\lambda}\right)
\]

![Figure 4.10](@/assets/images/cs-data-communication-free-space-loss-figure-4-10.png)
*Figure 4.10 · PDF p. 150 · distance와 carrier frequency에 따른 free space loss 증가*

Figure 4.10만 보면 frequency가 높을수록 free space loss가 커지는 것처럼 보인다. 하지만 실제 antenna 설계에서는 antenna gain과 effective area를 함께 봐야 한다. 같은 antenna dimensions와 separation을 고정하면 higher frequency에서는 더 큰 antenna gain을 얻을 수 있어, free-space path loss 증가를 보상하거나 오히려 net gain을 만들 수 있다. 즉 wireless 링크 예산(link budget)에서는 frequency, distance, antenna gain, effective area를 분리해서 암기하기보다 함께 계산해야 한다.

### Atmospheric Absorption

transmitting antenna와 receiving antenna 사이에는 대기 흡수로 인한 추가 손실도 있다. 주요 원인은 water vapor와 oxygen이다. water vapor는 약 22 GHz 부근에서 absorption peak를 만들고, oxygen은 약 60 GHz 부근에서 absorption peak를 만든다. 15 GHz 아래에서는 water vapor attenuation이 상대적으로 작고, 30 GHz 아래에서는 oxygen의 영향도 제한적이다.

rain과 fog는 suspended water droplets 때문에 radio wave를 scattering시켜 attenuation을 만든다. 여기서 scattering은 radio wave가 matter를 만났을 때 방향이나 frequency가 변한 wave가 생기는 현상이다. 강수량이 큰 지역에서는 path length를 짧게 잡거나 lower-frequency band를 써야 한다. 따라서 higher frequency는 bandwidth와 antenna size 측면에서 매력적이지만, precipitation attenuation과 atmospheric absorption이라는 trade-off를 가진다.

### Multipath

multipath는 하나의 송신 신호가 direct path뿐 아니라 reflection path를 통해 여러 copy로 수신되는 현상이다. 각 copy는 path length가 다르므로 delay가 다르고, 합쳐진 composite signal은 direct signal보다 커질 수도 작아질 수도 있다. 경로 차이에 따라 reinforcement와 cancellation이 일어나기 때문이다.

fixed microwave나 satellite-to-fixed-ground-station처럼 antenna 위치를 잘 고를 수 있는 시스템에서는 multipath를 어느 정도 제어할 수 있다. 그러나 mobile telephony처럼 building, 지형, 차량 등 반사체가 많은 환경에서는 multipath가 핵심 impairments가 된다. 극단적으로는 direct signal이 거의 없고 reflected signal만 수신될 수도 있다.

![Figure 4.11](@/assets/images/cs-data-communication-multipath-interference-figure-4-11.png)
*Figure 4.11 · PDF p. 152 · fixed microwave와 mobile radio에서 나타나는 multipath interference 예*

Figure 4.11의 fixed microwave 예에서는 direct line-of-sight path 외에 대기 refraction으로 휜 path와 지표면 reflection path가 함께 도착할 수 있다. mobile radio 예에서는 structure와 topographic feature가 reflection surface가 되어 더 복잡한 multipath를 만든다. 이후 wireless networking이나 cellular system에서 다루는 fading, diversity, equalization, spread spectrum 같은 기법은 이런 multipath 문제와 연결된다.

### Refraction in LOS Links

LOS link에서 radio wave는 atmosphere를 지나며 refraction을 겪는다. 일반적으로 signal speed는 altitude가 높아질수록 증가하므로 radio wave가 아래쪽으로 휜다. 이 효과 때문에 radio horizon이 optical horizon보다 멀어질 수 있다는 점은 4.3에서 이미 보았다.

하지만 weather condition이 비정상적이면 고도에 따른 speed 변화가 평소와 달라질 수 있다. 이 경우 line-of-sight wave의 일부만 receiving antenna에 도달하거나, 심하면 거의 도달하지 않을 수 있다. 따라서 LOS라는 말은 단순히 두 antenna가 기하학적으로 서로 보인다는 뜻에 그치지 않고, 실제 atmospheric condition에서 충분한 signal path가 유지되는지도 포함한다.

## 장 끝 핵심 연결

이 장의 guided media 비교는 “capacity, attenuation, interference immunity, cost, installation difficulty”의 trade-off로 정리할 수 있다. twisted pair는 싸고 설치가 쉽지만 bandwidth와 noise immunity가 제한된다. coaxial cable은 shielded structure 덕분에 twisted pair보다 고주파 성능과 interference immunity가 낫지만, optical fiber와 비교하면 capacity와 attenuation에서 밀린다. optical fiber는 high capacity, low attenuation, electromagnetic isolation, long repeater spacing이 강점이지만 광원, connector, splicing, installation 측면의 정밀성이 필요하다.

wireless transmission의 비교 축은 “directionality, frequency, range, licensing, propagation environment”다. terrestrial microwave와 satellite microwave는 directional antenna와 LOS 조건에 크게 의존한다. broadcast radio는 omnidirectional이라 정밀 alignment가 덜 필요하지만 multipath interference가 중요하다. infrared는 confined area에서 wall penetration이 없는 점이 장점이자 한계다.

antenna 관련 문제를 풀 때는 isotropic antenna, parabolic reflective antenna, antenna gain, effective area를 함께 봐야 한다. parabolic antenna는 focus의 energy를 축 방향 parallel beam으로 모으거나, 축 방향으로 들어온 wave를 focus에 집중시킨다. antenna gain은 power를 새로 만드는 것이 아니라 특정 방향으로 집중하는 정도다.

satellite communication에서는 uplink와 downlink frequency가 달라야 한다. 같은 frequency로 동시에 receive/transmit하면 self-interference가 생기기 때문이다. 또한 geostationary satellite의 긴 거리 때문에 propagation delay가 커지고, 이 delay는 단순 음성 통화 품질뿐 아니라 error control, flow control 같은 protocol design에도 영향을 준다.

wireless propagation에서는 ground wave, sky wave, LOS를 frequency band와 함께 기억해야 한다. ground wave는 낮은 frequency에서 지표면을 따라가고, sky wave는 ionosphere refraction으로 장거리 hop을 만들며, 30 MHz 이상에서는 주로 LOS가 지배적이다. LOS에서도 optical horizon과 radio horizon은 같지 않다. atmospheric refraction 때문에 radio horizon이 더 멀어질 수 있고, antenna height는 link distance를 직접 좌우한다.

line-of-sight impairment는 free space loss 하나로 끝나지 않는다. free space loss는 signal spreading 때문에 생기고 distance와 frequency의 함수로 커진다. 그러나 antenna gain과 effective area를 고려하면 higher frequency가 항상 불리한 것은 아니다. atmospheric absorption은 water vapor, oxygen, rain, fog가 만들고, multipath는 reflection path의 delay 차이로 reinforcement/cancellation을 만든다. 이 항목들은 이후 wireless/cellular 장의 link budget, fading, diversity, modulation 설계와 이어진다.
