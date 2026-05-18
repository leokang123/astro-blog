---
title: "Chapter 1. The Role of Algorithms in Computing"
order: 1
pubDatetime: 2026-05-17T00:21:00+09:00
modDatetime: 2026-05-17T00:21:00+09:00
description: "CLRS 알고리즘 정리: Chapter 1. The Role of Algorithms in Computing"
tags:
  - "Algorithm"
  - "CS"
  - "CLRS"
---

## 개요

Chapter 1은 알고리즘(algorithm)을 단순한 코드 조각이 아니라, 명확히 정의된 계산 문제(computational problem)를 해결하는 절차적 기술로 위치시킨다. 핵심 흐름은 세 가지다. 먼저 problem statement가 원하는 input/output relationship을 정의하고, algorithm이 그 관계를 실제로 달성하는 computational procedure를 제시한다. 그다음 correctness, efficiency, problem instance 같은 기본 용어를 세워 이후 장의 sorting, graph, dynamic programming, linear programming, cryptography 분석으로 연결한다.

## 핵심 개념

| 용어 | 핵심 의미 | 검색 키워드 |
| --- | --- | --- |
| 알고리즘(algorithm) | 입력(input)을 받아 출력(output)을 만드는 잘 정의된 계산 절차(well-defined computational procedure) | algorithm, input, output |
| 계산 문제(computational problem) | 일반적인 input/output relationship을 요구사항으로 명시한 문제 | computational problem, problem statement |
| 문제 사례(instance) | 문제 statement의 제약을 만족하는 구체적 입력 | instance |
| 정당성(correctness) | 모든 input instance에 대해 멈추고(halt) 올바른 output을 내는 성질 | correctness, halt, correct output |
| 정렬(sorting) | 입력 sequence의 permutation을 nondecreasing order로 재배열하는 대표 문제 | sorting, permutation, nondecreasing order |

알고리즘은 “무엇을 계산해야 하는가”와 “어떻게 계산할 것인가”를 분리해서 이해해야 한다. problem statement는 목표 관계를 말하고, algorithm은 그 관계를 만족시키는 구체적 단계들의 sequence다. 이 구분 덕분에 같은 sorting problem에도 insertion sort, merge sort, heapsort, quicksort처럼 서로 다른 절차를 비교할 수 있다.

## 세부 정리

### 1.1 Algorithms

#### Algorithm, problem statement, instance

비형식적으로 알고리즘(algorithm)은 어떤 값 또는 값들의 집합을 input으로 받아, 어떤 값 또는 값들의 집합을 output으로 내는 잘 정의된 computational procedure다. 더 구조적으로 말하면, algorithm은 input을 output으로 변환하는 computational steps의 sequence다.

CLRS가 여기서 강조하는 점은 algorithm을 독립된 코드가 아니라 well-specified computational problem을 해결하는 도구로 본다는 것이다. 문제의 statement는 “일반적으로 어떤 입력이 들어오고 어떤 출력 관계가 만족되어야 하는가”를 정의한다. 반면 algorithm은 그 input/output relationship을 달성하기 위한 특정 계산 절차를 설명한다.

이 구분은 이후 모든 장의 분석 단위가 된다.

| 층위 | 질문 | 예: sorting problem |
| --- | --- | --- |
| problem statement | 어떤 입력과 출력 관계가 필요한가? | n개 숫자의 sequence를 입력받아 nondecreasing order의 permutation을 출력 |
| algorithm | 그 관계를 어떤 절차로 달성하는가? | insertion sort, merge sort 등 |
| instance | 문제 제약을 만족하는 구체 입력은 무엇인가? | `<31, 41, 59, 26, 41, 58>` |
| output | 해당 instance에 대한 해는 무엇인가? | `<26, 31, 41, 41, 58, 59>` |

정렬(sorting)의 formal definition은 다음과 같다. 입력은 $n$개의 숫자 sequence $\langle a_1, a_2, \ldots, a_n\rangle$이고, 출력은 입력의 재배열(permutation) $\langle a'_1, a'_2, \ldots, a'_n\rangle$ 중 $a'_1 \le a'_2 \le \cdots \le a'_n$을 만족하는 것이다. 여기서 $\langle 31, 41, 59, 26, 41, 58\rangle$ 같은 구체 입력이 sorting problem의 instance다.

#### Sorting이 기본 예제가 되는 이유

정렬은 많은 프로그램에서 intermediate step으로 쓰이는 fundamental operation이다. 그래서 좋은 sorting algorithms가 매우 많고, “어떤 알고리즘이 최선인가”는 하나로 고정되지 않는다. 선택 기준에는 항목 수(number of items), 이미 어느 정도 정렬되어 있는 정도(presortedness), item value에 대한 제한, 컴퓨터 architecture, storage device(main memory, disk, tape 등)가 포함된다.

이 문맥은 이후 장에서 반복되는 trade-off의 출발점이다. 같은 problem statement를 해결하더라도 입력 특성, 메모리 계층, 저장 장치, 하드웨어 조건에 따라 algorithm choice가 달라진다. 즉 알고리즘 분석은 추상적인 수학만이 아니라 실제 실행 환경과도 연결된다.

#### Correctness

알고리즘이 correct하다는 것은 모든 input instance에 대해 멈추며(halt), 그때 올바른 output을 낸다는 뜻이다. correct algorithm은 주어진 computational problem을 solve한다고 말한다. 반대로 incorrect algorithm은 어떤 입력에서 끝나지 않거나, 끝나더라도 틀린 답을 낼 수 있다.

원문은 흥미로운 예외도 남긴다. error rate를 통제할 수 있는 incorrect algorithm은 때때로 유용할 수 있으며, 큰 소수(large prime numbers)를 찾는 Chapter 31의 알고리즘이 예로 언급된다. 다만 일반적인 CLRS의 기본 흐름에서는 correct algorithms를 중심으로 다룬다.

알고리즘 명세(specification)는 English, computer program, hardware design 등 여러 형식으로 가능하다. 중요한 요구사항은 표현 형식이 아니라 따라야 할 computational procedure가 precise하게 기술되어야 한다는 점이다.

#### 알고리즘이 해결하는 문제의 폭

알고리즘은 sorting만을 위한 기술이 아니다. Chapter 1은 알고리즘의 적용 범위를 넓게 보여주면서, 뒤 장들의 주제가 실제 문제와 어떻게 이어지는지 미리 연결한다.

| 응용 영역 | 원문 예시 | 연결되는 알고리즘 주제 |
| --- | --- | --- |
| 생명정보학 | Human Genome Project의 gene identification, sequence 분석, database 저장 | sequence processing, efficient data analysis |
| 인터넷 | 데이터가 지나갈 좋은 route 찾기, search engine으로 관련 page 찾기 | graph algorithms, hashing/search, string matching |
| 전자상거래 | credit card number, password, bank statement의 privacy 보호 | public-key cryptography, digital signature, number theory |
| 자원 배분 | oil well 위치, campaign advertising, airline crew scheduling, ISP resource 배치 | linear programming |

여기서 중요한 메시지는 “문제를 컴퓨터가 풀 수 있는 형태로 model하고, 그 모델 위에서 효율적 algorithm을 설계한다”는 것이다. 예를 들어 도로 지도는 graph로 model되고, 교차로는 vertex, 인접 도로 거리는 edge weight가 되어 shortest path problem으로 바뀐다. 이런 모델링 덕분에 실제 도로 위의 모든 경로를 무식하게 세는 대신 Chapter 24의 graph algorithms로 효율적인 해를 찾을 수 있다.

PDF p. 28의 후반부에서는 longest common subsequence(LCS) 예시가 시작된다. 두 sequence $X = \langle x_1, x_2, \ldots, x_m\rangle$, $Y = \langle y_1, y_2, \ldots, y_n\rangle$에서 공통으로 나타나는 가장 긴 subsequence를 찾는 문제이며, DNA base pair similarity 같은 맥락으로 설명된다. 이 예시는 “brute force가 왜 곤란하고 dynamic programming으로 어떻게 이어지는가”를 보여주는 역할을 한다.

#### 후보 해 공간(candidate solution space)이 커지는 문제들

1.1의 후반부는 알고리즘 문제가 왜 어려워지는지를 “가능한 후보가 너무 많다”는 관점에서 보여준다. longest common subsequence(LCS)는 $X$와 $Y$의 모든 subsequence를 골라 서로 맞춰 보는 방식으로는 $m$, $n$이 조금만 커져도 감당하기 어렵다. $X$의 subsequence는 최대 $2^{m}$개, $Y$의 subsequence는 최대 $2^{n}$개가 될 수 있기 때문이다. CLRS는 Chapter 15에서 dynamic programming을 이용해 이 문제를 훨씬 효율적으로 푸는 방법을 제시한다고 예고한다.

비슷한 패턴은 topological sorting에서도 나타난다. 어떤 mechanical design이 parts의 library로 주어지고, 어떤 part가 다른 part를 포함할 수 있다고 하자. 이때 각 part가 그것을 사용하는 part보다 먼저 오도록 순서를 나열해야 한다. $n$개의 part가 있으면 가능한 순서는 $n!$개이고, factorial function은 exponential function보다도 빠르게 커진다. 따라서 모든 순서를 생성한 뒤 조건을 확인하는 brute force는 작은 $n$에서만 가능하다. 이 문제는 Chapter 22의 graph algorithms에서 topological sorting으로 효율적으로 해결된다.

convex hull 문제도 후보가 많다. 평면 위 n개 points가 주어졌을 때, 이 점들을 모두 포함하는 가장 작은 convex polygon을 찾는 문제다. 원문은 board 위에 못(nail)을 박고 rubber band를 둘러 팽팽하게 만든 모습을 직관으로 제시한다. rubber band가 방향을 바꾸는 nail들이 convex hull의 vertices다. 가능한 point subset만 해도 $2^{n}$개이며, 어떤 점들이 vertex인지 아는 것만으로는 충분하지 않고 그 점들이 나타나는 order도 필요하다. CLRS는 이 예시를 Chapter 33의 computational geometry로 연결하며, 원문은 Figure 33.6을 예시 그림으로 참조한다.

이 예시들의 공통점은 두 가지다.

| 공통 특성 | 의미 | 알고리즘 관점 |
| --- | --- | --- |
| 많은 candidate solutions | 가능한 해 대부분은 조건을 만족하지 않거나 최적이 아니다 | 무차별 탐색보다 구조를 이용해야 한다 |
| 실용적 응용 | shortest path, LCS, scheduling, geometry 모두 실제 문제에서 등장한다 | 효율성(efficiency)이 비용, 시간, 자원 사용량과 직결된다 |

shortest path 예시는 특히 직관적이다. 운송 회사는 도로/철도 network에서 짧은 경로를 찾아 labor and fuel costs를 줄이고, Internet routing node는 message를 빠르게 보내기 위해 network상의 짧은 경로를 찾는다. 개인의 길찾기 서비스나 GPS도 같은 추상 문제의 응용이다.

#### 후보 해가 명확하지 않은 문제: DFT와 FFT

모든 알고리즘 문제가 “후보 해 목록 중 하나를 고르는 문제”처럼 보이는 것은 아니다. discrete Fourier transform(DFT)은 signal samples를 time domain에서 frequency domain으로 변환해 각 frequency의 강도를 나타내는 coefficients를 계산한다. 이는 signal processing의 핵심이며, data compression과 큰 polynomial/integer multiplication에도 쓰인다.

Chapter 30은 이 문제를 위한 efficient algorithm인 fast Fourier transform(FFT)을 다룬다. 원문은 FFT가 알고리즘으로 끝나지 않고 hardware circuit 설계로도 이어진다고 언급한다. 즉 알고리즘은 소프트웨어 절차일 수도 있지만, 계산 구조가 충분히 중요하면 hardware design으로도 구현될 수 있다.

#### Data structures

자료구조(data structure)는 데이터를 저장하고 조직해 access와 modification을 쉽게 만드는 방식이다. 중요한 점은 모든 목적에 잘 맞는 단일 data structure는 없다는 것이다. 따라서 여러 자료구조의 strengths and limitations를 이해해야 한다. 이 관점은 이후 CLRS의 Part III, 특히 elementary data structures, hash tables, binary search trees, red-black trees로 이어진다.

#### Technique: 알고리즘 책을 cookbook으로만 쓰지 않는 이유

CLRS는 이미 알려진 알고리즘을 찾아 쓰는 cookbook 역할도 하지만, 더 중요한 목표는 algorithm design and analysis의 technique을 익히게 하는 것이다. 현실에서는 공개된 알고리즘을 바로 찾을 수 없는 문제가 자주 생긴다. 이때 필요한 능력은 직접 algorithm을 개발하고, 그 algorithm이 correct answer를 낸다는 것을 보이며, efficiency를 이해하는 것이다.

책의 장들은 두 종류로 섞여 있다. 어떤 장은 specific problems를 다룬다. 예를 들어 Chapter 9는 medians and order statistics, Chapter 23은 minimum spanning trees, Chapter 26은 maximum flow를 다룬다. 다른 장은 설계 및 분석 기법을 다룬다. 예를 들어 Chapter 4는 divide-and-conquer, Chapter 15는 dynamic programming, Chapter 17은 amortized analysis를 다룬다.

#### Hard problems와 NP-complete

CLRS 대부분은 efficient algorithms를 다루고, 보통 efficiency의 대표 척도는 speed, 즉 결과를 내는 데 걸리는 시간이다. 하지만 어떤 문제들은 efficient solution이 알려져 있지 않다. Chapter 34는 이 중 중요한 부류인 NP-complete problems를 다룬다.

NP-complete problems가 중요한 이유는 세 가지다. 첫째, 어떤 NP-complete problem에도 efficient algorithm은 발견된 적이 없지만, 그런 알고리즘이 존재할 수 없다는 증명도 없다. 둘째, NP-complete problem 중 하나라도 efficient algorithm이 발견되면 모든 NP-complete problems에 efficient algorithms가 존재하게 되는 특별한 관계가 있다. 셋째, 이미 efficient algorithm을 아는 문제와 매우 비슷하지만 problem statement의 작은 차이 때문에 best known algorithm의 efficiency가 크게 달라지는 경우가 있다.

실무적으로도 중요하다. 어떤 문제가 NP-complete임을 보이면, 존재 여부도 모르는 exact efficient algorithm을 오래 찾기보다 good but not necessarily optimal solution을 주는 방법으로 방향을 바꿀 수 있다. 원문 예시는 traveling-salesman problem(TSP)이다. 배송 회사의 truck이 depot에서 출발해 여러 주소에 물건을 배달하고 다시 depot으로 돌아와야 할 때, 총 이동 거리를 최소화하는 방문 순서를 고르는 문제다. TSP는 NP-complete이고 알려진 efficient exact algorithm은 없지만, 특정 가정 아래에서는 최적값에서 크게 벗어나지 않는 approximation algorithms를 설계할 수 있으며 Chapter 35에서 다룬다.

#### Parallelism

1.1의 마지막은 병렬성(parallelism)으로 넘어간다. 과거에는 processor clock speed가 꾸준히 증가할 것이라고 기대할 수 있었지만, clock speed가 올라가면 power density가 superlinear하게 증가해 물리적 한계에 부딪힌다. 그래서 더 많은 computation per second를 얻기 위해 하나의 chip에 여러 processing cores를 넣는 multicore computer가 보편화되었다.

이 맥락에서 multicore computer는 single chip 위의 여러 sequential computers처럼 볼 수 있고, 넓은 의미의 parallel computer다. 성능을 제대로 끌어내려면 algorithm도 parallelism을 고려해 설계해야 한다. CLRS는 Chapter 27에서 multiple cores를 활용하는 multithreaded algorithms의 model을 제시한다고 예고한다.

### 1.2 Algorithms as a technology

#### 왜 무한히 빠른 컴퓨터를 가정해도 algorithm을 공부해야 하는가

1.2는 사고실험으로 시작한다. 만약 computers가 infinitely fast이고 memory가 free라면 알고리즘을 공부할 이유가 있을까? 원문의 답은 yes다. 적어도 solution method가 terminate하며 correct answer를 낸다는 것을 보여야 하기 때문이다. 즉 correctness와 termination은 성능 이전의 요구사항이다.

하지만 실제 컴퓨터는 무한히 빠르지 않고, memory도 공짜가 아니다. computing time과 memory space는 bounded resources다. 따라서 알고리즘은 시간(time)과 공간(space)을 현명하게 쓰기 위한 기술이다. 이 관점에서 efficient algorithm은 단순한 “더 빠른 코드”가 아니라 제한된 자원을 절약하는 설계 선택이다.

#### Efficiency: insertion sort vs. merge sort

같은 sorting problem을 푸는 알고리즘이라도 efficiency는 극적으로 다를 수 있다. Chapter 2에서 다룰 insertion sort는 대략 $c_1 n^2$ 시간, merge sort는 대략 $c_2 n \lg n$ 시간이 걸린다. 여기서 $\lg n$은 $\log_2 n$이고, $c_1$, $c_2$는 $n$에 의존하지 않는 constant다. insertion sort는 보통 constant factor가 작아 $c_1 < c_2$일 수 있지만, 입력 크기 $n$이 커지면 constant factor보다 growth rate가 훨씬 중요해진다.

핵심 비교는 $n$ 대 $\lg n$이다. insertion sort의 running time은 $c_1 n^2$처럼 볼 수 있고, merge sort는 $c_2 n \lg n$처럼 볼 수 있다. $n = 1000$일 때 $\lg n$은 약 10, $n = 1{,}000{,}000$일 때도 $\lg n$은 약 20에 불과하다. 그래서 작은 input size에서는 insertion sort가 더 빠를 수 있지만, 충분히 큰 $n$ 이후에는 merge sort가 constant factor의 불리함을 이긴다. 이 지점을 crossover point라고 볼 수 있다.

원문의 concrete example은 알고리즘 선택의 힘을 숫자로 보여준다.

| 항목 | Computer A + insertion sort | Computer B + merge sort |
| --- | --- | --- |
| raw speed | 10 billion instructions/second | 10 million instructions/second |
| 상대 속도 | B보다 1000배 빠름 | A보다 1000배 느림 |
| 구현 가정 | machine language, $2n^{2}$ instructions | high-level language, inefficient compiler, $50n \lg n$ instructions |
| $n = 10,000,000$ | 20,000 seconds, 5.5 hours 초과 | 약 1163 seconds, 20 minutes 미만 |
| 결론 | 빠른 하드웨어와 장인급 구현에도 느림 | 느린 하드웨어와 비효율 구현에도 17배 이상 빠름 |

이 예시는 “하드웨어가 빠르면 알고리즘은 덜 중요하다”는 직관을 뒤집는다. $n$이 더 커져 100 million numbers가 되면 insertion sort는 23 days 이상 걸리는 반면, merge sort는 4 hours 미만으로 끝난다. problem size가 커질수록 asymptotic growth의 차이가 시스템 성능의 지배 요인이 된다.

#### Algorithms and other technologies

CLRS는 알고리즘을 computer hardware와 같은 technology로 보아야 한다고 말한다. total system performance는 빠른 hardware 선택만큼이나 efficient algorithms 선택에 의존한다. 알고리즘도 hardware, architecture, networking처럼 계속 발전하는 기술이다.

현대 컴퓨팅에는 advanced computer architectures, fabrication technologies, graphical user interfaces(GUIs), object-oriented systems, integrated Web technologies, fast networking 같은 기술이 있다. 그런데 이런 기술이 algorithm의 중요성을 없애지는 않는다.

예를 들어 Web 기반 길찾기 서비스는 fast hardware, GUI, wide-area networking, object orientation을 사용할 수 있다. 동시에 route를 찾기 위해 shortest-path algorithm이 필요하고, maps를 rendering하며, addresses를 interpolating하는 알고리즘도 필요하다. 즉 application level에서 직접 algorithmic content가 있는 서비스다.

더 나아가 application level에서 알고리즘을 직접 구현하지 않는 단순 Web application도 알고리즘에 의존한다. hardware design에는 알고리즘이 쓰이고, GUI design에도 알고리즘이 들어가며, network routing은 알고리즘에 크게 의존한다. machine code가 아닌 언어로 작성되었다면 compiler, interpreter, assembler가 source를 처리하는데, 이 도구들도 extensive algorithms를 사용한다. 그래서 algorithms are at the core of most technologies used in contemporary computers라는 결론이 나온다.

#### 큰 문제일수록 알고리즘 지식이 더 중요해진다

컴퓨터의 capacity가 커질수록 사람들은 더 큰 문제를 풀려고 한다. 그런데 insertion sort와 merge sort 비교에서 보았듯, algorithmic efficiency의 차이는 작은 입력보다 큰 problem size에서 훨씬 두드러진다. 따라서 하드웨어가 좋아질수록 알고리즘이 덜 중요해지는 것이 아니라, 더 큰 문제를 다루게 되면서 효율적인 알고리즘의 가치가 다시 커진다.

CLRS의 교육적 메시지는 분명하다. solid base of algorithmic knowledge and technique은 truly skilled programmers와 novices를 가르는 특성 중 하나다. 현대 기술만으로도 일부 작업은 할 수 있지만, 좋은 알고리즘 배경을 갖추면 훨씬 더 많은 일을 할 수 있다.

## 복잡도

Chapter 1에서 아직 asymptotic notation을 본격적으로 정의하지는 않지만, 이미 growth rate의 직관을 세운다.

| running time 형태 | 직관 | Chapter 1에서의 역할 |
| --- | --- | --- |
| $c_1 n^2$ | 입력이 10배 커지면 대략 100배 커지는 quadratic growth | insertion sort의 대표적 성장 형태 |
| $c_2 n \lg n$ | linear보다 조금 더 크지만 $n^{2}$보다 훨씬 느리게 성장 | merge sort의 대표적 성장 형태 |
| $2^{n}$ | subset을 모두 고려할 때 자주 등장하는 exponential growth | LCS, convex hull 후보 폭발 설명 |
| $n!$ | 가능한 순열(order)을 모두 고려할 때 등장하는 factorial growth | topological sorting brute force의 비현실성 설명 |

이 표의 핵심은 constant factor가 중요하지 않다는 뜻이 아니다. 작은 $n$에서는 constant factor와 구현 세부가 실제 실행시간을 지배할 수 있다. 다만 $n$이 충분히 커지면 $n^{2}$와 $n \lg n$, $2^{n}$, $n!$처럼 input size에 대한 의존성이 결정적 차이를 만든다.

## 연결 관계

Chapter 1은 이후 장들의 지도 역할을 한다. sorting은 Chapter 2의 insertion sort와 merge sort로 이어지고, growth rate 비교는 Chapter 3의 asymptotic notation으로 정교해진다. divide-and-conquer는 Chapter 4, dynamic programming은 Chapter 15, amortized analysis는 Chapter 17에서 technique으로 다뤄진다.

문제 영역별 연결도 중요하다. shortest path는 Chapter 24의 graph algorithms, topological sorting은 Chapter 22, minimum spanning trees는 Chapter 23, maximum flow는 Chapter 26으로 이어진다. public-key cryptography와 digital signatures는 Chapter 31의 number-theoretic algorithms, linear programming은 Chapter 29, FFT는 Chapter 30, NP-completeness는 Chapter 34, approximation algorithms는 Chapter 35로 이어진다. 병렬성(parallelism)과 multithreaded algorithms는 Chapter 27에서 본격화된다.

이 장의 근본 메시지는 “알고리즘은 문제를 모델링하고, 올바름을 보장하며, 제한된 자원 안에서 효율적으로 계산하게 해 주는 기술”이라는 것이다. 따라서 이후의 각 장은 새로운 문제 하나를 외우는 것이 아니라, problem statement, input instance, correctness, efficiency, data structure, design technique 사이의 연결을 더 정밀하게 배우는 과정이다.

## 오해하기 쉬운 내용

- algorithm은 반드시 programming language로 작성된 code만 뜻하지 않는다. English 설명, program, hardware design 모두 precise computational procedure를 제공하면 algorithm specification이 될 수 있다.
- correctness는 “대부분 맞는다”가 아니다. 기본적으로 모든 input instance에 대해 halt하고 correct output을 내야 한다. 다만 controlled error rate를 갖는 probabilistic/number-theoretic algorithm 같은 예외적 맥락은 별도로 다룬다.
- fastest hardware가 항상 fastest system을 만들지는 않는다. growth rate가 나쁜 algorithm은 느린 기계 위의 더 좋은 algorithm에게 쉽게 진다.
- approximation algorithm은 틀린 알고리즘을 대충 쓰는 것이 아니다. NP-complete problem처럼 exact efficient algorithm이 알려지지 않은 상황에서, 품질 보장을 갖춘 good solution을 효율적으로 찾는 설계 전략이다.
- data structure는 부수적 구현 세부가 아니다. access와 modification을 어떻게 지원하느냐가 algorithm의 efficiency와 직접 연결된다.
- GUI, networking, compiler 같은 “다른 기술”은 알고리즘의 대체재가 아니다. 그 기술들 자체가 내부적으로 algorithms에 의존한다.

## 면접 질문

1. algorithm, computational problem, instance의 차이를 sorting problem 예시로 설명하라.
2. 어떤 algorithm이 correct하다는 말은 무엇이며, “halt” 조건이 왜 포함되는가?
3. insertion sort의 $c_1 n^2$와 merge sort의 $c_2 n \lg n$에서 constant factor보다 growth rate가 더 중요해지는 이유를 설명하라.
4. fastest hardware에서 나쁜 알고리즘을 돌리는 것보다 느린 hardware에서 좋은 알고리즘을 돌리는 것이 더 빠를 수 있는 이유를 CLRS의 예시와 함께 설명하라.
5. LCS, topological sorting, convex hull 예시가 공통적으로 보여주는 candidate solution explosion은 무엇인가?
6. NP-complete problem임을 아는 것이 실무적으로 왜 유용한가?
7. modern computing technologies(GUI, networking, compiler, hardware design)가 알고리즘과 무관하지 않은 이유를 설명하라.
8. data structure의 strengths and limitations를 이해해야 하는 이유를 algorithm efficiency 관점에서 설명하라.
