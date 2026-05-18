---
title: "Internet Applications: Internet Directory Service and World Wide Web"
order: 23
pubDatetime: 2026-05-18T00:23:00+09:00
modDatetime: 2026-05-18T00:23:00+09:00
description: "Data and Computer Communications 정리: Internet Applications: Internet Directory Service and World Wide Web"
tags:
  - "DataCommunication"
  - "CS"
---

## 개요

Chapter 23은 Internet application이 실제로 작동하기 위해 필요한 두 기반 기술을 다룬다. 하나는 사람이 기억하는 이름을 network가 사용할 수 있는 주소로 바꾸는 `DNS(Domain Name System)`이고, 다른 하나는 Web browser와 Web server 사이에서 Web resource를 주고받는 `HTTP(Hypertext Transfer Protocol)`다.

이 장의 큰 흐름은 `DNS directory lookup → DNS distributed hierarchical database → DNS name resolution → HTTP client/server transaction → HTTP intermediaries → HTTP message structure`다. DNS는 "어디로 접속해야 하는가"를 해결하고, HTTP는 "그 resource를 어떤 request/response 형식으로 주고받을 것인가"를 해결한다.

## 핵심 개념

| 주제 | 핵심 질문 | 검색용 용어 |
|---|---|---|
| DNS | host name을 numerical address로 어떻게 mapping하는가? | DNS, domain name, IP address, name server, resolver |
| Domain name space | Internet name을 왜 tree-structured hierarchy로 구성하는가? | domain, root, top-level domain, label, zone |
| DNS database | DNS record는 어떤 정보 단위로 저장되는가? | resource record, RR, A, CNAME, MX, NS, SOA, TTL |
| Name resolution | Resolver와 name server가 어떻게 IP address를 찾아내는가? | recursive technique, iterative technique, cache, root name server |
| HTTP | Web browser와 Web server는 어떤 transaction으로 data를 교환하는가? | HTTP, Web browser, Web server, request, response, stateless |
| HTTP intermediaries | Proxy, gateway, tunnel은 request path에서 어떤 역할을 하는가? | HTTP proxy, HTTP gateway, HTTP tunnel, cache |
| HTTP messages | HTTP request/response는 어떤 공통 구조를 갖는가? | HTTP message, Request-Line, Status-Line, header field, entity body |

## 세부 정리

### 23.1 Internet Directory Service: DNS

`DNS(Domain Name System)`는 Internet host의 이름과 numerical address 사이의 mapping을 제공하는 directory lookup service다. 사용자는 `www.example.com` 같은 이름을 기억하지만, IP layer에서 packet을 전달하려면 numerical IP address가 필요하다. DNS는 이 간격을 메우는 Internet 필수 서비스이며, 원문은 RFC 1034와 RFC 1035로 정의된다고 설명한다.

DNS는 네 구성요소로 이루어진다.

| DNS element | 의미 |
|---|---|
| `Domain name space` | Internet resource를 식별하기 위한 tree-structured name space |
| `DNS database` | name tree의 node/leaf에 연결된 information을 `RR(Resource Record)` 형태로 저장한 distributed database |
| `Name servers` | domain name tree 일부와 associated RR 정보를 보유한 server program |
| `Resolvers` | client request에 응답하기 위해 name server에서 정보를 추출하는 program |

Typical client request는 주어진 domain name에 대응하는 IP address를 찾는 것이다. E-mail server를 찾거나 Web page에 접근할 때마다 DNS name lookup이 필요하다.

#### Domain Names

32-bit IP address는 Internet에 붙은 device를 unique하게 식별한다. 이 address는 network number와 host address로 해석된다. 하지만 IP address만으로 Internet을 운영하면 두 가지 문제가 생긴다.

| 문제 | 설명 |
|---|---|
| Routing table 관리 문제 | router가 모든 network와 preferred path를 master table로 유지해야 한다면 table management가 매우 번거롭다. Network를 group화해 routing function을 단순화할 필요가 있다. |
| Human usability 문제 | dotted decimal 형태의 numerical address는 computer processing에는 좋지만 사람이 기억하기 어렵다. 사용자는 numerical address보다 name을 더 쉽게 기억한다. |

`domain`은 이 문제를 해결하기 위한 개념이다. 일반적으로 domain은 회사, 정부 기관 같은 하나의 administrative entity가 관리하는 host group을 뜻한다. Domain은 hierarchy로 조직되며, 하나의 domain은 여러 subordinate domain을 가질 수 있다. Domain name은 이 hierarchy를 반영한다.

![Figure 23.1](@/assets/images/data-communication-305-figure-23-1-page-795.png)
*Figure 23.1 · PDF p. 795 · root에서 top-level domain, subordinate domain, host leaf로 내려가는 Internet domain tree 일부*

Figure 23.1에서 가장 위는 `root`이고, 그 아래에 Internet 전체를 포괄하는 소수의 top-level domain이 있다. 예를 들면 `com`, `edu`, `gov`, `mil`, `net`, `org`, `us`, country code domain 등이 있다. 하위 level은 바로 위 level name 앞에 subordinate name을 붙여 표현한다.

예시는 다음과 같다.

| Domain name | 의미 |
|---|---|
| `edu` | college-level U.S. educational institutions domain |
| `mit.edu` | MIT domain |
| `lcs.mit.edu` | MIT Laboratory for Computer Science domain |

Tree 아래로 내려가면 결국 Internet의 specific host를 식별하는 leaf node에 도달한다. Domain name이 Internet-wide하게 unique해야 하므로 전체적인 domain name assignment는 Internet-wide organization이 관리하고, 실제 address assignment는 hierarchy 아래로 delegation된다. 예를 들어 `mil` domain은 큰 address group을 받고, U.S. DoD가 이를 여러 DoD organization에 나눠 host에 할당한다.

Top-level domain은 기능과 관리 주체를 대략 드러낸다. `com`은 commercial organizations, `edu`는 educational institutions, `gov`는 U.S. federal government agencies, `net`은 network support centers/ISPs, `org`는 nonprofit organizations, country code는 `au`, `ca`, `uk` 같은 ISO 2-letter country-specific domain을 의미한다. 이 목록 자체를 암기하기보다, DNS가 administrative delegation과 naming hierarchy를 동시에 표현한다는 점이 중요하다.

#### DNS Database와 Resource Record(RR)

DNS database는 host의 name, IP address, 기타 정보를 담은 `RR(Resource Record)`들의 hierarchical database다. 핵심 특징은 세 가지다.

| 특징 | 의미 |
|---|---|
| `Variable-depth hierarchy for names` | name level을 사실상 제한 없이 둘 수 있고, printed name에서 period `.`를 level delimiter로 사용한다. |
| `Distributed database` | database가 Internet과 private intranet 곳곳의 DNS server에 분산되어 있다. |
| `Distribution controlled by the database` | DNS database는 수천 개의 separately managed `zone`으로 나뉘며, 각 zone은 별도 administrator가 관리한다. Database software가 record distribution/update를 제어한다. |

이 구조 덕분에 DNS는 전 세계 host name/address mapping을 중앙집중식 단일 파일이 아니라, hierarchical delegation과 distributed server로 유지한다.

![Figure 23.2](@/assets/images/data-communication-306-figure-23-2-page-796.png)
*Figure 23.2 · PDF p. 796 · DNS Resource Record(RR)의 Domain Name, Type, Class, TTL, Rdata 구조*

RR은 다음 field로 구성된다.

| RR field | 의미 |
|---|---|
| `Domain Name` | 사람이 읽는 domain name에 대응한다. Alphanumeric character 또는 hyphen으로 이루어진 label들이 period로 구분된다. |
| `Type` | RR의 resource type을 식별한다. 예: `A`, `CNAME`, `MX`, `NS`. |
| `Class` | protocol family를 식별한다. 일반적으로 Internet을 뜻하는 `IN`이 사용된다. |
| `Time to Live(TTL)` | 이 RR을 cache해도 되는 시간. 0이면 현재 transaction에만 사용하고 cache하지 않는다. |
| `Rdata Field Length` | Rdata field의 octet 단위 길이 |
| `Rdata` | resource를 설명하는 variable-length octet string. Type에 따라 형식이 달라진다. |

대표 RR type은 다음과 같다.

| RR type | 의미 |
|---|---|
| `A` | host name을 IP address로 mapping한다. Router처럼 address가 여러 개인 system은 address마다 별도 A RR을 가질 수 있다. |
| `CNAME` | alias name을 canonical(true) name으로 mapping한다. |
| `HINFO` | host processor와 operating system 정보를 나타낸다. |
| `MINFO` | mailbox 또는 mail list name을 host name으로 mapping한다. |
| `MX` | organization으로 들어오는 mail을 relay할 mail exchange system을 식별한다. |
| `NS` | 해당 domain의 authoritative name server를 나타낸다. |
| `PTR` | domain name space의 다른 부분을 가리킨다. |
| `SOA` | start of a zone of authority. Naming hierarchy의 어느 부분이 이 zone에 속하는지와 zone parameter를 담는다. |
| `SRV` | 특정 service를 제공하는 server name을 domain 안에서 제공한다. |
| `TXT` | database에 arbitrary text comment를 추가한다. |
| `WKS` | 이 host에서 사용 가능한 well-known services를 나열할 수 있다. |

RR에서 `TTL`은 DNS scalability와 freshness 사이의 trade-off를 직접 드러낸다. Cache 시간이 길면 반복 query가 줄어 성능과 traffic 측면에서 유리하지만, record가 바뀌었을 때 stale information이 오래 남을 수 있다. TTL이 0이면 freshness는 높지만 cache benefit은 사라진다.

#### DNS Operation과 Name Resolution

DNS operation은 사용자가 보지 못하는 곳에서 여러 단계로 진행된다. 핵심은 user program이 domain name에 대한 IP address를 요청하면, local resolver와 name server가 database/cache를 확인하고 필요하면 다른 name server를 조회한다는 점이다.

![Figure 23.3](@/assets/images/data-communication-307-figure-23-3-page-798.png)
*Figure 23.3 · PDF p. 798 · user query가 resolver, local name server, foreign name server, cache를 거쳐 response로 돌아오는 DNS name resolution 흐름*

일반적인 DNS lookup 흐름은 다음과 같다.

1. User program이 domain name에 대한 IP address를 요청한다.
2. Local host 또는 local ISP의 `resolver` module이 같은 domain의 local name server에 query를 만든다.
3. Local name server는 local database 또는 cache에 해당 name이 있는지 확인한다.
4. 있으면 즉시 IP address를 requestor에게 반환한다.
5. 없으면 root 또는 가능한 한 높은 위치의 name server에서 시작해 다른 name server들을 query한다.
6. Local name server가 response를 받으면 name/address mapping을 local cache에 저장한다. Cache 유지 시간은 retrieved RR의 `Time to Live(TTL)`을 따른다.
7. User program은 IP address 또는 error message를 받는다.

사용자 입장에서는 `telnet locis.loc.gov` 같은 command를 입력하면 DNS가 뒤에서 `locis.loc.gov`를 `140.147.254.3` 같은 IP address로 resolve한 뒤 connection이 진행된다. 이 예시는 DNS가 application protocol 자체가 아니라 application이 실제 server를 찾기 전에 호출하는 directory lookup service임을 보여준다.

#### Server Hierarchy와 Zone

DNS database는 Internet 곳곳의 DNS name server에 hierarchical하게 분산된다. Domain을 소유한 조직, 즉 domain name space의 subtree에 책임이 있는 조직은 name server를 운영할 수 있다. 각 name server는 domain name space의 subset인 `zone`으로 configured된다.

`zone`은 domain 안의 하나 이상의 subdomain과 associated RR collection이다. 이 data set은 해당 name server가 domain hierarchy의 그 부분에 대해 accurate RR set을 유지할 책임이 있으므로 `authoritative`하다고 한다.

| 개념 | 의미 |
|---|---|
| `domain` | administrative naming hierarchy의 논리적 영역 |
| `zone` | 특정 name server가 authoritative하게 관리하는 domain tree의 일부 |
| `authoritative name server` | 특정 zone의 RR에 대해 정확한 정보를 유지할 책임이 있는 name server |
| `delegation` | name space 일부를 subordinate name server에 넘기는 것 |

Hierarchy는 임의 깊이까지 확장될 수 있다. 예를 들어 `ibm.com` domain을 담당하는 name server가 있고, 그 아래 `watson.ibm.com`에 대해서는 subordinate name server가 authoritative responsibility를 가질 수 있다.

Root level에는 top-level zones에 대한 책임을 공유하는 `root name server`들이 있다. 원문은 13개의 root name server가 replication되어 있다고 설명한다. 이 replication은 root server가 bottleneck이나 single point of failure가 되는 것을 막기 위한 구조다.

`watson.ibm.com` lookup 예시를 흐름으로 정리하면 다음과 같다.

1. User host의 program이 `watson.ibm.com`에 대한 query를 local server로 보낸다.
2. Local server cache에 있으면 IP address를 즉시 반환한다.
3. Cache에 없으면 root server에 query한다.
4. Root server는 `ibm.com`에 대한 NS record를 가진 server 쪽으로 request를 넘기거나 그 server 정보를 제공한다.
5. `ibm.com` server가 `watson.ibm.com` 정보를 알고 있으면 IP address를 반환한다.
6. 만약 `watson.ibm.com` 전용 delegated name server가 있으면 `ibm.com` server가 그 name server로 이어지게 하고, 최종적으로 해당 server가 IP address를 반환한다.

Typical single query는 UDP로 운반되고, group of names query는 TCP로 운반된다. DNS가 UDP와 TCP를 모두 사용할 수 있다는 점은 중요하다. 일반 조회는 작고 빠른 datagram이 유리하지만, 큰 응답이나 여러 이름 처리에는 reliable stream이 필요할 수 있다.

#### Recursive Technique과 Iterative Technique

Name resolution은 user host의 resolver에서 시작한다. Resolver는 local DNS name server의 name/address를 알고 있도록 configured된다. Resolver cache에 requested name이 없으면 local DNS server에 query를 보낸다. Local DNS server는 즉시 답을 주거나 다른 server들을 query한 뒤 답을 준다.

Name server A가 다른 name server B에게 DNS request를 보낸다고 하자. B가 local cache/database에서 답을 찾지 못하면 두 방식 중 하나를 사용할 수 있다.

| 방식 | 동작 | 직관 |
|---|---|---|
| `recursive technique` | B가 다시 다른 name server를 query해 원하는 결과를 얻은 뒤 A에게 결과를 돌려준다. | "내가 끝까지 찾아서 답을 줄게" |
| `iterative technique` | B가 A에게 다음으로 물어봐야 할 server C의 address를 돌려준다. A가 C에게 새 DNS request를 보낸다. | "나는 모르지만 다음에는 여기 물어봐" |

Name server 사이 exchange에서는 iterative 또는 recursive technique이 모두 가능하다. Resolver가 보내는 request에는 recursive technique이 사용된다. 이 구분은 DNS traffic과 server burden의 분배 방식과 연결된다. Recursive 방식은 요청자가 편하지만 중간 server가 더 많은 일을 하고, iterative 방식은 요청자가 여러 server를 따라가야 하지만 각 server 부담은 작아질 수 있다.

#### DNS Message Format

DNS message는 query와 response에 모두 같은 format을 사용한다. 가능한 section은 `header`, `question`, `answer`, `authority`, `additional records`의 다섯 가지다.

![Figure 23.5](@/assets/images/data-communication-309-figure-23-5-page-802.png)
*Figure 23.5 · PDF p. 802 · DNS message의 header, question, answer, authority, additional records section과 QR/AA/TC/RD/RA flag 구조*

Header section은 항상 존재하고 다음 field를 포함한다.

| Header field | 의미 |
|---|---|
| `Identifier` | query 생성 program이 할당한다. Response에도 같은 identifier를 써서 query/response matching을 가능하게 한다. |
| `QR(Query Response)` | message가 query인지 response인지 나타낸다. |
| `Opcode` | standard query, inverse query(address to name), server status request 등을 나타낸다. |
| `AA(Authoritative Answer)` | response에서 responding name server가 question domain에 authoritative한지 나타낸다. |
| `TC(Truncated)` | transmission channel 허용 길이를 넘어 response가 잘렸는지 나타낸다. 잘렸으면 requester는 TCP connection으로 query를 다시 보낸다. |
| `RD(Recursion Desired)` | server가 recursive하게 query를 추적하도록 요청한다. |
| `RA(Recursion Available)` | response에서 name server가 recursive query를 지원하는지 나타낸다. |
| `RCODE(Response Code)` | no error, format error, server failure, name error, not implemented, refused 등을 나타낸다. |
| `QDcount` | question section entry 수 |
| `ANcount` | answer section RR 수 |
| `NScount` | authority section RR 수 |
| `ARcount` | additional records section RR 수 |

Question section은 name server에 대한 query를 담는다. 일반적으로 entry 하나만 들어간다. 각 entry는 다음으로 구성된다.

| Question field | 의미 |
|---|---|
| `Domain Name` | label sequence로 표현된다. 각 label은 length octet 뒤에 해당 octet 수만큼의 label content가 오고, root의 null label을 뜻하는 zero length octet으로 끝난다. |
| `Query Type` | query type. RR의 Type field 값과 더 general한 query code를 포함할 수 있다. |
| `Query Class` | query class. 보통 Internet class다. |

나머지 section의 의미는 다음과 같다.

| Section | 의미 |
|---|---|
| `Answer section` | question에 직접 답하는 RR을 담는다. |
| `Authority section` | authoritative name server 쪽으로 가리키는 RR을 담는다. |
| `Additional records section` | query와 관련은 있지만 question의 직접 답은 아닌 RR을 담는다. |

DNS message format의 핵심은 "작은 header flag와 count로 query/response matching, recursion, truncation, section별 RR 개수를 모두 표현한다"는 점이다. DNS는 단순 name-to-address lookup처럼 보이지만, 실제 message는 hierarchy traversal, caching, authoritative answer, delegation을 표현할 수 있게 설계되어 있다.

### 23.2 Web Access: HTTP

`HTTP(Hypertext Transfer Protocol)`는 World Wide Web(WWW)의 foundation protocol이다. 이름만 보면 hypertext 자체를 전송하는 protocol처럼 보이지만, 원문은 이 이름이 다소 misleading하다고 설명한다. HTTP는 hypertext jump를 효율적으로 만들기 위해 필요한 information transmission protocol이며, 전송 data는 plaintext, hypertext, audio, image 등 Internet-accessible information 전반이 될 수 있다.

#### HTTP Overview

HTTP는 `transaction-oriented client/server protocol`이다. 가장 전형적인 사용은 `Web browser`와 `Web server` 사이이며, reliability를 위해 TCP를 사용한다. 하지만 HTTP 자체는 `stateless protocol`이다. 각 transaction은 독립적으로 취급되며, 일반적인 구현은 transaction마다 TCP connection을 열고 transaction이 끝나면 닫을 수 있다. 다만 specification이 transaction lifetime과 connection lifetime을 반드시 1:1로 강제하지는 않는다.

HTTP가 stateless인 것은 Web 사용 패턴에 잘 맞는다. 사용자가 browser로 Web page와 document sequence를 빠르게 가져오고, 그 resource들이 여러 distributed server에 있을 수 있기 때문이다. Server가 모든 client interaction history를 protocol state로 유지하지 않아도 request 단위로 response를 만들 수 있다.

HTTP 관련 주요 용어는 다음과 같다.

| Term | 의미 |
|---|---|
| `client` | request를 보내기 위해 connection을 만드는 application program |
| `user agent` | request를 시작하는 client. Browser, editor, spider 등이 해당한다. |
| `server` | connection을 accept하고 request에 response를 돌려주는 application program |
| `origin server` | requested resource가 실제로 residing하거나 생성될 server |
| `resource` | URI로 식별 가능한 network data object 또는 service |
| `entity` | request/response message 안에 담길 수 있는 data resource representation 또는 service reply. Entity headers와 entity body로 구성된다. |
| `message` | HTTP communication의 basic unit. Connection을 통해 전송되는 structured octet sequence |
| `cache` | cacheable response를 저장해 같은 request에 대한 response time과 bandwidth consumption을 줄이는 local store/subsystem |
| `proxy` | 다른 client를 대신해 request를 server에 전달하는 intermediary. Client에게는 server처럼, server에게는 client처럼 동작한다. |
| `gateway` | 다른 server를 대신하는 server-side intermediary. Client에게는 origin server처럼 보일 수 있다. |
| `tunnel` | 두 connection 사이에서 blind relay처럼 동작하며 HTTP message를 해석하지 않는다. |

HTTP의 또 다른 중요한 특징은 data format flexibility다. Client는 자신이 처리할 수 있는 format의 prioritized list를 request에 넣을 수 있고, server는 적절한 format으로 응답한다. 예를 들어 image를 처리할 수 없는 text-based browser라면 server가 image를 보내지 않아 불필요한 transmission을 줄일 수 있다. 이 구조는 새로운 standardized/proprietary format 확장에도 유리하다.

#### HTTP Operation

Figure 23.6은 HTTP operation의 세 형태를 보여준다. Direct connection, intermediate relay chain, cache가 있는 구조를 비교해 볼 수 있다.

![Figure 23.6](@/assets/images/data-communication-310-figure-23-6-page-805.png)
*Figure 23.6 · PDF p. 805 · user agent와 origin server 사이의 direct HTTP operation, intermediary chain, cache 사용 예*

가장 단순한 경우는 user agent가 origin server와 direct TCP connection을 여는 것이다.

1. User agent가 origin server와 TCP connection을 연다.
2. Client가 HTTP request를 보낸다.
3. Request는 `method`, address인 `URL(Uniform Resource Locator)`, request parameter/client information/additional content information을 담은 MIME-like message로 구성된다.
4. Server는 requested action을 수행하려고 시도한다.
5. Server는 status information, success/error code, server/response information, possible body content를 담은 HTTP response를 반환한다.
6. TCP connection이 닫힌다.

두 번째 경우는 user agent와 origin server 사이에 end-to-end TCP connection이 없고, logically adjacent systems 사이에 여러 TCP connection이 있는 구조다. Intermediate system들은 relay 역할을 하며 request를 server 방향으로 전달하고 response를 client 방향으로 되돌린다.

세 번째 경우는 cache가 request/response transaction을 저장하는 구조다. 같은 request가 나중에 오면 origin server까지 가지 않고 cache가 stored response를 제공할 수 있다.

#### HTTP Intermediate Systems: Proxy, Gateway, Tunnel

HTTP specification은 세 종류의 intermediate system을 정의한다: `proxy`, `gateway`, `tunnel`.

![Figure 23.7](@/assets/images/data-communication-311-figure-23-7-page-806.png)
*Figure 23.7 · PDF p. 806 · HTTP proxy, gateway, tunnel이 firewall, non-HTTP server, blind relay 상황에서 동작하는 방식*

`HTTP proxy`는 다른 client를 대신해 server에 request를 제시한다. Client와 상호작용할 때는 server처럼, server와 상호작용할 때는 client처럼 동작한다.

Proxy가 필요한 대표 상황은 다음과 같다.

| Proxy 사용 상황 | 의미 |
|---|---|
| `security intermediary` | Client network가 firewall로 보호되고 server가 외부에 있을 때, proxy가 firewall client-side에서 request/response를 중개한다. |
| `different versions of HTTP` | Client와 server가 서로 다른 HTTP version을 사용할 때 proxy가 양쪽 version을 구현하고 mapping한다. |

Proxy는 URL object에 대한 request를 받고, request를 interpret/rewrite/modify한 뒤 URL에 식별된 server 쪽으로 forwarding하는 agent다.

`HTTP gateway`는 client에게 origin server처럼 보이는 server-side intermediary다. Proxy와 달리 client는 gateway와 통신한다는 사실을 모를 수 있다. Gateway는 다른 server를 대신해 client request를 받고, 필요하면 non-HTTP system과 통신해 결과를 HTTP에 맞는 form으로 변환한다.

Gateway 사용 상황은 다음과 같다.

| Gateway 사용 상황 | 의미 |
|---|---|
| `security intermediary` | Server network가 firewall로 보호되고 client가 외부에 있을 때, gateway가 server-side에서 client authentication 후 내부 server로 request를 전달한다. |
| `non-HTTP server` | Client가 HTTP request를 gateway에 보내면 gateway가 FTP/Gopher 같은 non-HTTP server에 접근하고, 결과를 HTTP response form으로 변환해 client에게 돌려준다. |

`HTTP tunnel`은 proxy/gateway와 달리 HTTP request/response를 해석하거나 변경하지 않는다. 두 TCP connection 사이의 relay point로 동작하며, HTTP messages는 user agent와 origin server 사이에 single HTTP connection이 있는 것처럼 unchanged로 전달된다. Tunnel은 중간 system이 반드시 있어야 하지만 message contents를 이해하거나 해석하면 안 되는 상황에 쓰인다. 예를 들어 firewall을 통과하기 위해 authenticated connection을 만들고 그 connection을 HTTP transaction에 유지하는 경우가 있다.

세 intermediary를 비교하면 다음과 같다.

| Intermediary | Client에게 보이는 모습 | Message 해석/수정 | 주 용도 |
|---|---|---|---|
| `proxy` | client-side server처럼 보임 | request를 interpret/rewrite할 수 있음 | firewall client-side, HTTP version mapping |
| `gateway` | origin server처럼 보일 수 있음 | request/response를 변환할 수 있음 | firewall server-side, non-HTTP resource 접근 |
| `tunnel` | blind relay | 해석하지 않고 그대로 전달 | contents를 해석하면 안 되는 relay, authenticated connection 유지 |

#### Cache

`cache`는 이전 request/response를 저장해 새 request를 처리할 수 있는 facility다. 새 request가 stored request와 equivalent하면, cache는 URL이 가리키는 resource에 다시 접근하지 않고 stored response를 제공할 수 있다. Cache는 client, server, tunnel이 아닌 intermediate system에서 동작할 수 있다.

Cache의 장점은 response time과 network bandwidth consumption을 줄이는 것이다. 그러나 모든 transaction이 cacheable한 것은 아니며, client나 server가 특정 transaction을 일정 time limit 안에서만 cache하도록 제한할 수 있다. 이 점은 DNS의 TTL과 비슷하게 freshness와 performance 사이의 trade-off를 만든다.

#### HTTP Messages

HTTP message의 일반 구조는 `start line`, 여러 header, 빈 줄, 선택적 `Entity Body`로 생각하면 된다. Request에서는 첫 줄이 `Request Line`, response에서는 첫 줄이 `Status Line`이다.

![Figure 23.8](@/assets/images/data-communication-312-figure-23-8-page-808.png)
*Figure 23.8 · PDF p. 808 · HTTP message의 Request/Status line, header 계층, Entity Body 구조*

원문은 HTTP specification에서 쓰는 augmented BNF notation을 간단히 설명한 뒤 HTTP message를 다음처럼 정리한다. 여기서 `CRLF`는 carriage return + line feed, `SP`는 space, `*`는 repetition, `[...]`는 optional element를 뜻한다.

```text
HTTP-Message  = Simple-Request | Simple-Response | Full-Request | Full-Response

Full-Request  = Request-Line
                *( General-Header | Request-Header | Entity-Header )
                CRLF
                [ Entity-Body ]

Full-Response = Status-Line
                *( General-Header | Response-Header | Entity-Header )
                CRLF
                [ Entity-Body ]

Simple-Request  = "GET" SP Request-URL CRLF
Simple-Response = [ Entity-Body ]
```

`Simple-Request`와 `Simple-Response`는 HTTP/0.9의 단순 형식이다. Request는 URL을 붙인 단순 `GET` command이고, response는 해당 URL이 식별한 정보를 담은 block이다. HTTP/1.1에서는 이 단순 형식이 권장되지 않는다. 이유는 client가 content negotiation을 할 수 없고 server도 returned entity의 media type을 식별하기 어렵기 때문이다.

Full request/response에서 각 구성요소의 역할은 다음과 같다.

| Field | 사용 위치 | 핵심 역할 |
|---|---|---|
| `Request-Line` | request | message type과 requested resource를 식별한다. |
| `Status-Line` | response | received request에 대한 status information을 제공한다. |
| `General-Header` | request/response | request와 response 모두에 적용되지만 transferred entity 자체에는 직접 적용되지 않는 정보를 담는다. |
| `Request-Header` | request | request와 client에 관한 추가 정보를 담는다. |
| `Response-Header` | response | response에 관한 추가 정보를 담는다. |
| `Entity-Header` | request/response | request가 식별한 resource와 entity body에 관한 정보를 담는다. |
| `Entity-Body` | request/response | message body다. Resource representation, submitted data, action result 등이 들어갈 수 있다. |

모든 HTTP header는 RFC 822 스타일의 field sequence다. 각 field는 새 줄에서 시작하고, `field name: field value` 형태를 가진다. 이 단순한 generic format 위에 매우 많은 HTTP field와 parameter가 얹힌다.

#### General Header Fields

`General-Header`는 request와 response 양쪽에서 쓸 수 있고, transferred entity 자체가 아니라 message 처리 경로와 connection/control 성격을 설명한다.

| General Header | 의미 |
|---|---|
| `Cache-Control` | request/response chain의 cache mechanisms가 따라야 할 directive를 지정한다. 특정 request/response에서 cache가 부적절하게 개입하는 것을 막기 위한 장치다. |
| `Connection` | 이 TCP connection에서 sender와 nearest nontunnel recipient 사이에만 적용되는 keyword/header field name 목록을 담는다. |
| `Date` | message가 originated한 date/time을 나타낸다. |
| `Forwarded` | gateway/proxy가 request/response chain의 intermediate step을 표시할 때 쓴다. 각 intermediary는 자신이 거친 URL 정보를 붙일 수 있다. |
| `Keep-Alive` | persistent connection을 얼마나 유지할지, 현재 connection에서 추가 request를 몇 개까지 허용할지 같은 정보를 줄 수 있다. |
| `MIME-Version` | message가 해당 MIME version을 따른다는 것을 나타낸다. |
| `Pragma` | request/response chain의 recipient에게 적용될 수 있는 implementation-specific directive를 담는다. |
| `Upgrade` | client가 사용할 수 있는 추가 protocol을 request에서 제안하거나, response에서 실제 사용할 protocol을 알린다. |

#### Request Messages

Full request message는 `Request-Line`으로 시작하고, 그 뒤에 general/request/entity header가 오며, 마지막에 optional `Entity-Body`가 붙는다.

```text
Request-Line = Method SP Request-URL SP HTTP-Version CRLF
```

`Method`는 HTTP request command이고, `Request-URL`은 requested resource의 URL이며, `HTTP-Version`은 sender가 사용하는 HTTP version이다.

HTTP/1.1 request methods는 다음처럼 구분된다.

| Method | 의미 |
|---|---|
| `OPTIONS` | 특정 URL이 식별하는 request/response chain에서 사용 가능한 options 정보를 요청한다. |
| `GET` | URL이 식별한 정보를 retrieve하여 entity body로 돌려달라는 요청이다. `If-Modified-Since`가 있으면 conditional GET, `Range`가 있으면 partial GET 성격을 가진다. |
| `HEAD` | `GET`과 같지만 response에 entity body를 포함하지 않는다. Body 전송 없이 resource metadata/header를 확인할 때 유용하다. |
| `POST` | attached entity를 URL이 식별한 resource의 subordinate로 받아들이도록 요청한다. File이 directory 아래에 있거나 article이 newsgroup에 posted되는 관계와 비슷하다. |
| `PUT` | attached entity를 supplied URL 아래에 저장하라는 요청이다. 새 resource 생성 또는 기존 resource content replacement가 될 수 있다. |
| `PATCH` | `PUT`과 유사하지만 entity가 original resource content와의 differences list를 담는다. |
| `COPY` | Request-Line의 URL이 식별한 resource를 Entity-Header의 URL-Header location으로 복사한다. |
| `MOVE` | Resource를 Entity-Header의 URL-Header location으로 이동한다. Conceptually `COPY` followed by `DELETE`다. |
| `DELETE` | Origin server가 Request-Line URL의 resource를 삭제하도록 요청한다. |
| `LINK` | Request-Line resource에서 하나 이상의 link relationships를 설정한다. Link 정의는 Entity-Header의 `Link` field에 있다. |
| `UNLINK` | Request-Line resource에서 하나 이상의 link relationships를 제거한다. |
| `TRACE` | Server가 받은 내용을 response entity body로 되돌리도록 요청한다. Testing/diagnostic 목적이다. |
| `WRAPPED` | Client가 하나 이상의 encapsulated requests를 보낼 수 있게 한다. Request는 encrypted 또는 otherwise processed될 수 있으며 server는 unwrap 후 처리한다. |
| `Extension-method` | Protocol 변경 없이 추가 method를 정의할 수 있게 한다. 단, recipient가 인식한다고 가정할 수는 없다. |

`Request-Header`는 request modifier처럼 동작한다. 즉 request와 client에 관한 추가 정보와 parameter를 제공한다.

| Request Header | 의미 |
|---|---|
| `Accept` | Response로 받을 수 있는 media types/ranges 목록 |
| `Accept-Charset` | Response에서 허용 가능한 character sets |
| `Accept-Encoding` | Entity body에 허용 가능한 content encodings. Compression/encryption 같은 encoding 협상에 쓰인다. |
| `Accept-Language` | Response에서 선호하는 natural languages 제한 |
| `Authorization` | Client가 server에 자신을 authenticate하기 위해 보내는 credentials |
| `From` | Requesting user agent를 제어하는 human user의 Internet e-mail address |
| `Host` | Requested resource가 속한 Internet host |
| `If-Modified-Since` | `GET`과 함께 사용되며, 지정 date/time 이후 resource가 변경된 경우에만 transfer한다. Cache update를 효율화한다. |
| `Proxy-Authorization` | Authentication을 요구하는 proxy에게 client identity를 제공한다. |
| `Range` | `GET`에서 identified resource의 일부만 요청하려는 field다. |
| `Referrer` | `Request-URL`을 얻은 resource의 URL. Server가 back-links를 생성할 수 있게 한다. |
| `Unless` | `If-Modified-Since`와 비슷하지만 `GET`에 제한되지 않고, date/time이 아니라 임의의 `Entity-Header` field value를 기준으로 비교한다. |
| `User-Agent` | Request를 만든 user agent 정보를 담는다. Statistics, protocol violation tracing, user agent limitation에 맞춘 response tailoring에 쓰인다. |

#### Response Messages

Full response message는 `Status-Line`으로 시작하고 general/response/entity header, optional entity body가 뒤따른다.

```text
Status-Line = HTTP-Version SP Status-Code SP Reason-Phrase CRLF
```

`Status-Code`는 received request에 대한 결과를 나타내는 three-digit integer이고, `Reason-Phrase`는 그 status code에 대한 짧은 textual explanation이다.

HTTP/1.1 status code category는 다음과 같다.

| Category | 의미 |
|---|---|
| `1xx Informational` | Request가 received되었고 processing이 계속된다. Entity body는 동반되지 않는다. |
| `2xx Successful` | Request가 성공적으로 received, understood, accepted되었다. |
| `3xx Redirection` | Request를 완료하려면 추가 action이 필요하다. |
| `4xx Client Error` | Request에 syntax error가 있거나 fulfill할 수 없다. |
| `5xx Server Error` | Server가 apparently valid request를 fulfill하지 못했다. |

Successful response에서 entity body의 의미는 method에 따라 달라진다. `GET`이면 requested resource content, `HEAD`이면 entity body 없음, `POST`이면 action result를 설명하거나 포함하는 entity, `TRACE`이면 request message 자체, 그 밖의 method에서는 action result 설명이 된다.

`Response-Header`는 `Status-Line`에 넣기 어려운 response 관련 정보를 제공한다.

| Response Header | 의미 |
|---|---|
| `Location` | `Request-URL`이 식별한 resource의 exact location |
| `Proxy-Authenticate` | Proxy Authentication Required 상태에서 proxy가 요구하는 authentication scheme/parameter challenge |
| `Public` | Server가 지원하는 nonstandard methods 목록 |
| `Retry-After` | Service Unavailable일 때 service가 unavailable할 것으로 예상되는 기간 |
| `Server` | Request를 처리한 origin server software product |
| `WWW-Authenticate` | Unauthorized 상태에서 server가 요구하는 authentication scheme/parameter challenge |

#### Entities

`entity`는 request 또는 response message 안의 `Entity-Header`와 `Entity-Body`로 구성된다. Entity는 data resource를 represent할 수도 있고, request/response에 딸려 가는 추가 정보를 구성할 수도 있다. 여기서 중요한 점은 HTTP message가 단지 “문서 한 개”를 실어 나르는 구조가 아니라, method/action/status에 맞춰 resource representation, submitted data, diagnostic echo, action result 등을 담을 수 있는 envelope라는 것이다.

`Entity-Header`는 entity body 자체 또는 body가 없을 때 request가 식별한 resource에 대한 optional information을 제공한다.

| Entity Header | 의미 |
|---|---|
| `Allow` | `Request-URL`이 식별한 resource가 지원하는 methods를 나열한다. Method Not Allowed response에는 반드시 포함된다. |
| `Content-Encoding` | Resource에 적용된 content encodings를 나타낸다. 원문 범위에서는 zip compression이 대표 예다. |
| `Content-Language` | Enclosed entity의 intended audience에 해당하는 natural language를 식별한다. |
| `Content-Length` | Entity body의 size를 octets 단위로 나타낸다. |
| `Content-MD5` | MD5 hash code function 관련 field로, 장 21의 network security 내용과 연결된다. |
| `Content-Range` | Response에 포함된 identified resource의 portion을 나타내려는 field다. |
| `Content-Type` | Entity body의 media type을 나타낸다. Body octets를 어떻게 해석할지 결정하는 핵심 field다. |
| `Content-Version` | Evolving entity에 연결된 version tag다. |
| `Derived-From` | Sender가 수정하기 전 이 entity가 derived된 resource version tag를 나타낸다. `Content-Version`과 함께 group update 관리에 쓰일 수 있다. |
| `Expires` | 이 entity를 stale로 간주해야 하는 date/time이다. HTTP cache freshness와 직접 연결된다. |
| `Last-Modified` | Sender가 믿는 resource의 last modification date/time이다. |
| `Link` | 다른 resource로의 links를 정의한다. |
| `Title` | Entity의 textual title이다. |
| `Transfer-Encoding` | Sender와 recipient 사이에서 message body를 safe transfer하기 위해 어떤 transformation을 적용했는지 나타낸다. Standard 예는 `chunked`다. |
| `URL-Header` | Recipient에게 이 resource를 식별할 수 있는 other URLs를 알려준다. |
| `Extension-Header` | Protocol 자체를 바꾸지 않고 추가 field를 정의할 수 있게 한다. 단 recipient가 이해한다고 가정할 수 없다. |

`Entity Body`는 arbitrary sequence of octets다. HTTP는 text뿐 아니라 binary data, audio, images, video까지 어떤 content type도 전송할 수 있도록 설계되었다. Body octets의 의미는 세 field가 순서 있는 encoding model로 결정한다.

```text
entity-body := Transfer-Encoding(
                 Content-Encoding(
                   Content-Type(data)
                 )
               )
```

`data`는 URL이 식별한 resource content다. `Content-Type`은 data를 해석하는 방식을 정하고, `Content-Encoding`은 저장된 representation에 적용될 수 있으며, `Transfer-Encoding`은 전송 과정에서 message body를 만들기 위해 적용된다. 따라서 `Content-Type`과 `Transfer-Encoding`은 둘 다 body와 관련되지만 역할이 다르다. 전자는 “무엇인가”를, 후자는 “어떻게 안전하게 실어 보냈는가”를 설명한다.

### 장 전체 연결 관계

이 장은 DNS와 HTTP를 별개의 application처럼 나열하지만, 실제 Web access path에서는 둘이 연속된다.

| 단계 | 관여 기술 | 핵심 질문 |
|---|---|---|
| 1 | `DNS` | 사람이 입력한 domain name을 어떤 IP address로 보낼 것인가? |
| 2 | `TCP` | User agent와 origin server 또는 intermediary 사이에 reliable connection을 만들 것인가? |
| 3 | `HTTP request` | 어떤 URL/resource에 어떤 method를 적용할 것인가? |
| 4 | `HTTP intermediary/cache` | Proxy/gateway/tunnel/cache가 request path에서 개입하거나 단축할 수 있는가? |
| 5 | `HTTP response` | Status-Code, headers, Entity-Body로 결과와 representation을 어떻게 돌려줄 것인가? |

DNS는 layer architecture 관점에서 application-level directory service지만, transport와 network layer의 주소 결정에 선행된다. HTTP는 TCP 위의 application protocol이며, MIME/RFC 822 스타일 header 구조와 Chapter 22의 message format 개념을 이어받는다. `Content-MD5`는 Chapter 21의 hash/security 개념과 연결되고, cache freshness는 DNS `TTL`과 비슷한 design trade-off를 가진다.

### 오해하기 쉬운 내용

| 오해 | 바로잡기 |
|---|---|
| DNS는 하나의 중앙 서버가 모든 이름을 아는 구조다. | DNS는 hierarchical, distributed database다. Root/name server hierarchy와 zone delegation으로 확장성을 얻는다. |
| `domain`과 `zone`은 같은 말이다. | Domain은 naming tree의 subtree 개념이고, zone은 특정 administrator/name server가 authoritative하게 관리하는 database portion이다. |
| Recursive lookup은 항상 root server가 최종 답을 찾아준다는 뜻이다. | Recursive technique에서는 query를 받은 server가 answer 또는 error를 반환할 책임을 진다. 하지만 root server는 보통 delegation/referral 중심으로 동작하고 full recursion을 제공하지 않을 수 있다. |
| HTTP는 connectionless protocol이다. | HTTP 자체는 stateless지만, request/response는 일반적으로 TCP connection 위에서 수행된다. Stateless는 server가 transaction 사이 상태를 유지하지 않는다는 뜻이다. |
| Proxy, gateway, tunnel은 모두 같은 intermediary다. | Proxy는 client-side relay처럼, gateway는 origin server처럼, tunnel은 contents를 해석하지 않는 blind relay처럼 동작한다. |
| `Content-Encoding`과 `Transfer-Encoding`은 같다. | `Content-Encoding`은 resource representation 자체의 encoding이고, `Transfer-Encoding`은 safe transfer를 위한 message body transformation이다. |

### 핵심 용어 정리

| Term | 정리 |
|---|---|
| `Backus-Naur Form(BNF)` | Protocol grammar를 형식적으로 표현하는 notation. HTTP message structure를 설명할 때 사용된다. |
| `domain` | DNS hierarchy에서 administrative entity가 관리하는 name subtree 또는 host group 개념 |
| `domain name` | Period-separated labels로 구성된 hierarchical name |
| `Domain Name System(DNS)` | Domain name과 IP address 등 resource information을 mapping하는 distributed directory service |
| `Domain Name Service(DNS)` | 원문 key terms에 나온 표현. 보통 DNS service를 가리키며 `Domain Name System`과 함께 검색성을 위해 유지한다. |
| `name server` | DNS database의 일부 zone/RR 정보를 보유하고 query에 응답하는 server program |
| `resolver` | Client request를 받아 name server와 상호작용해 DNS 정보를 추출하는 program |
| `resource record(RR)` | DNS database의 기본 정보 단위. `Domain Name`, `Type`, `Class`, `TTL`, `Rdata` 등을 가진다. |
| `root name server` | DNS hierarchy 최상단에서 top-level domain delegation의 출발점이 되는 name server |
| `zone` | DNS database에서 특정 administrator가 관리하고 authoritative server가 책임지는 portion |
| `recursive technique` | Query를 받은 DNS server가 최종 answer/error를 반환할 책임을 지는 lookup 방식 |
| `iterative technique` | DNS server가 자신이 아는 best next server/referral을 돌려주고 resolver가 다음 query를 이어가는 방식 |
| `Hypertext Transfer Protocol(HTTP)` | Web resource access를 위한 stateless, transaction-oriented client/server application protocol |
| `Uniform Resource Locator(URL)` | Resource location을 식별하는 address form. HTTP request의 `Request-URL`에 쓰인다. |
| `HTTP method` | `GET`, `HEAD`, `POST`, `PUT`, `PATCH`, `DELETE`, `TRACE` 등 request action을 나타내는 command |
| `HTTP proxy` | Client를 대신해 server에 request를 전달하는 intermediary |
| `HTTP gateway` | Client에게 origin server처럼 보이며 다른 server/system과의 변환을 담당할 수 있는 intermediary |
| `HTTP tunnel` | HTTP message를 해석하지 않고 두 connection 사이에서 그대로 relay하는 intermediary |
| `origin server` | Requested resource가 실제로 residing하거나 생성되는 server |
| `Request-Line` | HTTP request의 시작 줄. `Method SP Request-URL SP HTTP-Version CRLF` |
| `Status-Line` | HTTP response의 시작 줄. `HTTP-Version SP Status-Code SP Reason-Phrase CRLF` |
| `Entity-Body` | Request/response message의 optional body. Arbitrary octet sequence로 구성된다. |
| `Content-Type` | Entity body의 media type을 나타내며 data interpretation을 결정한다. |
| `Transfer-Encoding` | Message body를 전송하기 위해 적용된 transformation을 나타낸다. |

### 확인 질문

1. DNS가 centralized `HOSTS.TXT` 방식보다 확장성 있는 이유는 무엇인가?
2. `RR(Resource Record)`의 `TTL`은 DNS cache에서 어떤 trade-off를 만드는가?
3. `recursive technique`과 `iterative technique`에서 책임을 지는 주체는 어떻게 다른가?
4. HTTP가 `stateless protocol`이라는 말은 TCP connection을 쓰지 않는다는 뜻인가?
5. `HTTP proxy`, `HTTP gateway`, `HTTP tunnel`은 client/server에게 각각 어떻게 보이는가?
6. `Request-Line`과 `Status-Line`은 HTTP message에서 각각 무엇을 식별하는가?
7. `Content-Type`, `Content-Encoding`, `Transfer-Encoding`은 entity body 해석에서 어떤 순서와 역할을 가지는가?
