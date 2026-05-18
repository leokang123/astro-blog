---
title: "Internet Applications: Electronic Mail and Network Management"
order: 22
pubDatetime: 2026-05-18T00:22:00+09:00
modDatetime: 2026-05-18T00:22:00+09:00
description: "Data and Computer Communications 정리: Internet Applications: Electronic Mail and Network Management"
tags:
  - "DataCommunication"
  - "CS"
---

## 개요

Chapter 22는 TCP/IP application layer가 실제 distributed application을 어떻게 지원하는지 보여주는 두 사례를 다룬다. 하나는 가장 널리 쓰이는 사용자 application인 `electronic mail`이고, 다른 하나는 distributed system을 감시하고 제어하기 위한 support application인 `network management`다.

이 장의 핵심 흐름은 `SMTP → MIME → SNMPv1 → SNMPv2 → SNMPv3`다. `SMTP(Simple Mail Transfer Protocol)`는 기본 e-mail transfer를 담당하지만, 원래 simple text block 전송에 맞춰져 있다. `MIME(Multipurpose Internet Mail Extensions)`는 SMTP/RFC 822의 틀을 유지하면서 multimedia, non-ASCII text, binary data를 e-mail로 보낼 수 있게 확장한다. `SNMP(Simple Network Management Protocol)`는 management station과 managed device 사이에서 management information을 조회, 설정, 보고하게 하는 표준 protocol family다.

## 핵심 개념

| 주제 | 핵심 질문 | 검색용 용어 |
|---|---|---|
| Electronic mail | Mail이 user agent, queue, SMTP sender/receiver, mailbox 사이에서 어떻게 이동하는가? | electronic mail, user agent, outgoing mail queue, SMTP sender, SMTP receiver, mailbox |
| SMTP | Mail transfer를 위해 어떤 command/reply conversation을 수행하는가? | SMTP, RFC 821, TCP port 25, MAIL, RCPT, DATA, QUIT, SMTP replies |
| RFC 822 | SMTP가 옮기는 mail message의 header/body 형식은 어떻게 잡히는가? | RFC 822, envelope, header, body |
| MIME | 7-bit ASCII text 중심 SMTP의 한계를 어떻게 확장하는가? | MIME, Content-Type, Content-Transfer-Encoding, radix-64, quoted-printable |
| SNMP | Network management에서 manager/agent/MIB가 어떤 역할을 하는가? | SNMP, management station, agent, MIB, managed object |
| SNMPv2/SNMPv3 | SNMPv1의 단순성 이후 어떤 기능과 보안이 추가되는가? | SNMPv2, GetBulkRequest, InformRequest, SNMPv3, authentication, privacy, access control |

## 세부 정리

### 22.1 Electronic Mail: SMTP and MIME

전자우편(`electronic mail`)은 distributed system에서 가장 많이 쓰이는 application 중 하나다. TCP/IP suite에서 그 기본 전송 역할을 오래 맡아온 protocol이 `SMTP(Simple Mail Transfer Protocol)`이다. 하지만 전통적인 SMTP는 simple text message delivery에 맞춰져 있었고, voice, image, video clip 같은 다양한 data type을 mail로 보내려는 요구를 만족시키기 어렵다. 이 한계를 SMTP 위에서 확장한 표준이 `MIME(Multipurpose Internet Mail Extensions)`이다.

#### SMTP의 역할과 범위

`SMTP`는 TCP/IP suite에서 host 간 mail을 transfer하기 위한 standard protocol이며, 원문은 `RFC 821`로 정의된다고 설명한다. SMTP로 옮기는 message는 보통 `RFC 822` 형식을 따르지만, SMTP 자체는 message format/content를 거의 해석하지 않는다.

이 관계는 mail envelope 비유로 이해하면 좋다.

| 요소 | SMTP 관점 |
|---|---|
| Message header/envelope | recipient address 등 delivery에 필요한 정보를 사용한다. |
| Message body/content | SMTP는 원칙적으로 들여다보지 않는다. |
| 예외 1 | message character set을 `7-bit ASCII`로 표준화한다. |
| 예외 2 | delivered message 앞부분에 message가 지나온 path를 나타내는 log information을 추가한다. |

즉 SMTP는 "mail content의 의미"가 아니라 "mail을 어느 host의 어느 recipient 쪽으로 넘길 것인가"에 집중한다. Content 자체의 표현력 문제는 나중에 MIME이 맡는다.

#### Basic Electronic Mail Operation

Figure 22.1은 SMTP가 전체 mail system 안에서 어디에 위치하는지 보여준다. 이 그림에서 중요한 점은 SMTP protocol이 mail system 전체를 정의하지 않는다는 것이다. User agent, outgoing queue, local mailbox, forwarding policy 등은 SMTP 주변의 mail-handling apparatus이고, SMTP 자체는 `SMTP sender`와 `SMTP receiver` 사이의 conversation으로 제한된다.

![Figure 22.1](@/assets/images/data-communication-298-figure-22-1-page-765.png)
*Figure 22.1 · PDF p. 765 · outgoing mail queue에서 SMTP sender가 TCP port 25로 전송하고 SMTP receiver가 mailbox/queue로 넘기는 흐름*

Outgoing mail의 흐름은 다음과 같다.

1. User가 `user agent`를 통해 mail을 작성한다.
2. 생성된 message는 `header`와 `body`를 가진다.
3. User agent가 header에서 recipient를 해석해 destination list를 만든다.
4. Mailing list expansion, duplicate removal, mnemonic name을 실제 mailbox name으로 바꾸는 처리가 일어날 수 있다.
5. `BCC(blind carbon copy)`가 있으면 이를 만족하도록 별도 message를 준비한다.
6. Message text와 destination list가 `outgoing mail queue`에 들어간다.
7. `SMTP sender`가 queue에서 message를 꺼내 destination host의 `SMTP receiver`로 TCP connection을 열고 전송한다.

SMTP sender는 보통 target host의 TCP `port 25`에 접속한다. Host의 outgoing mail volume이 크면 여러 SMTP sender가 동시에 동작할 수 있고, incoming mail이 서로 지연되지 않도록 SMTP receiver를 필요할 때 생성할 수도 있다.

SMTP sender는 queue 처리에서 최적화를 수행할 수 있다.

| 상황 | 최적화 |
|---|---|
| 하나의 message가 같은 host의 여러 recipient에게 가는 경우 | message text는 한 번만 전송하고 recipient list만 처리한다. |
| 같은 host로 갈 여러 message가 queue에 있는 경우 | TCP connection을 한 번 열고 여러 message를 전송한 뒤 닫는다. |
| 일부 destination만 처리 완료된 경우 | 완료된 destination만 message destination list에서 제거한다. |

#### Error Handling과 Responsibility Boundary

SMTP sender는 destination host unreachable, host down, TCP connection failure, 잘못된 destination address 같은 error를 처리해야 한다. 전송 실패 시 mail을 다시 queue에 넣고 나중에 delivery를 재시도할 수 있지만, 무한히 보관하지는 않는다. 일정 시간이 지나면 포기하고 originator에게 error notification을 돌려줄 수 있다. 사용자가 주소를 잘못 입력했거나 recipient가 다른 host로 이동한 경우에는 가능하면 redirect하고, 불가능하면 오류를 반환한다.

SMTP는 TCP connection 위에서 reliable transfer를 시도하지만, end-to-end delivery guarantee를 제공하지 않는다. SMTP receiver가 "transfer complete"라고 응답했다는 것은 message가 receiver host에 도착했다는 뜻이지, 최종 recipient가 mailbox에서 읽었다는 뜻이 아니다. 원문에 "SNMP does not guarantee"라고 보이는 문맥은 SMTP 설명 흐름상 SMTP의 error indication 한계를 말하는 것으로 이해해야 한다.

책임 경계는 다음처럼 정리할 수 있다.

| 구성요소 | 책임 |
|---|---|
| `SMTP sender` | receiver가 transfer complete를 표시할 때까지 message 전송과 대부분의 error recovery 책임을 진다. |
| `SMTP receiver` | arriving message를 local mailbox에 넣거나 forwarding이 필요하면 local outgoing queue로 복사한다. Local destination 검증과 storage 부족, connection failure 같은 오류를 처리한다. |
| `SMTP protocol` | sender와 receiver 사이의 command/reply conversation에 한정된다. User agent, mailbox UI, local queue 구조는 SMTP 범위 밖이다. |

Message는 보통 originator machine에서 destination machine으로 single TCP connection을 통해 직접 이동한다. 그러나 SMTP forwarding을 거쳐 intermediate machine들을 지날 수도 있다. 사용자가 server sequence 형태로 route를 지정하는 경우도 있고, 더 흔하게는 recipient가 이동해서 forwarding이 필요한 경우다.

SMTP operation은 이후 세부적으로 `command`와 `reply`의 연속으로 설명된다. Initiative는 SMTP sender에게 있으며, sender가 TCP connection을 만들고 command를 보내면 receiver는 각 command마다 정확히 하나의 reply를 반환한다.

#### SMTP Commands와 Replies

SMTP command는 한 줄의 text로 이루어지고, 보통 네 글자 command code로 시작한다. 뒤에 argument field가 붙을 수 있다. Reply도 대개 한 줄이지만, multi-line reply도 가능하다. 중요한 점은 "각 command마다 정확히 하나의 reply"가 온다는 command/response 구조다.

핵심 command는 다음과 같다.

| Command | Command form | 의미 |
|---|---|---|
| `HELO` | `HELO <SP> <domain> <CRLF>` | sender identification |
| `MAIL` | `MAIL <SP> FROM:<reverse-path> <CRLF>` | mail originator 식별 |
| `RCPT` | `RCPT <SP> TO:<forward-path> <CRLF>` | recipient 식별 |
| `DATA` | `DATA <CRLF>` | message text transfer 시작 |
| `RSET` | `RSET <CRLF>` | current mail transaction abort |
| `NOOP` | `NOOP <CRLF>` | no operation |
| `QUIT` | `QUIT <CRLF>` | TCP connection closing |
| `VRFY` | `VRFY <SP> <string> <CRLF>` | user name 확인 |
| `EXPN` | `EXPN <SP> <string> <CRLF>` | mailing list membership 반환 |
| `HELP` | `HELP [<SP> <string>] <CRLF>` | system-specific documentation |
| `TURN` | `TURN <CRLF>` | sender/receiver role reverse |

SMTP reply는 three-digit code로 시작한다. Leading digit는 reply category를 나타낸다.

| Reply category | 의미 | 대표 code |
|---|---|---|
| `Positive Completion reply` | 요청 action이 성공적으로 완료되었고 새 request를 시작할 수 있다. | `220`, `221`, `250`, `251` |
| `Positive Intermediate reply` | command는 accepted되었지만 추가 정보가 필요하다. | `354` |
| `Transient Negative Completion reply` | action이 수행되지 않았지만 error condition이 temporary라 다시 시도할 수 있다. | `421`, `450`, `451`, `452` |
| `Permanent Negative Completion reply` | action이 수행되지 않았고 같은 요청을 그대로 반복해도 실패할 가능성이 높다. | `500`, `501`, `502`, `503`, `550`, `551`, `552`, `553`, `554` |

SMTP의 error handling은 code만 외우는 문제가 아니라 "재시도 가능한 실패인가, permanent failure인가"를 구분하는 protocol design이다. Queue 기반 mail system에서는 transient error면 나중에 재시도할 수 있지만, permanent error면 originator에게 notification을 돌려줘야 한다.

#### SMTP Operation: Connection Setup, Mail Transfer, Connection Closing

SMTP operation은 세 phase로 나뉜다.

| Phase | 동작 |
|---|---|
| `connection setup` | SMTP sender가 target host와 TCP connection을 열고, receiver의 `220 Service Ready`와 sender의 `HELO`, receiver의 `250 OK`로 식별 절차를 수행한다. |
| `mail transfer` | 하나 이상의 message에 대해 `MAIL`, `RCPT`, `DATA` command sequence를 수행한다. |
| `connection termination` | sender가 `QUIT` command를 보내고 reply를 기다린 뒤 TCP close를 시작한다. |

Connection setup의 정상 흐름은 다음과 같다.

```text
Sender opens TCP connection
Receiver: 220 Service Ready
Sender:   HELO <domain>
Receiver: 250 OK
```

Destination mail service가 unavailable하면 receiver는 `421 Service Not Available`을 반환하고 process는 종료된다.

Mail transfer는 `MAIL → RCPT → DATA`의 세 logical phase로 구성된다.

| 단계 | 의미 | 설계 이유 |
|---|---|---|
| `MAIL FROM:<reverse-path>` | message originator와 reverse path를 알려준다. | error report를 돌려보낼 주소를 확보한다. |
| `RCPT TO:<forward-path>` | recipient를 하나씩 지정한다. Multiple recipients는 multiple `RCPT`로 표현한다. | recipient별 accept/forward/reject를 message body 전송 전에 확인한다. |
| `DATA` | message text를 ASCII line sequence로 전송한다. | receiver가 최소 한 recipient에 대해 accept한 뒤에야 큰 body를 보낸다. |

`RCPT` phase를 분리하는 것이 중요하다. Sender가 message body 전체를 먼저 보냈는데 recipient가 unknown이라는 사실을 뒤늦게 알면 bandwidth와 processing overhead가 낭비된다. SMTP는 recipient를 먼저 하나씩 확인하고, receiver가 적어도 한 명 이상의 recipient에 대해 message를 받을 준비가 되었을 때만 `DATA`로 body를 보낸다.

`DATA` 이후 receiver가 `354 Start mail input; end with <CRLF>.<CRLF>`를 반환하면 sender는 message를 ASCII line sequence로 전송한다. Message 끝은 period 하나만 있는 line, 즉 `<CRLF>.<CRLF>`로 표시된다. Receiver가 message를 accept하면 `250 OK`를 반환하고, 실패하면 적절한 error code를 반환한다.

원문의 RFC 821 예시는 이 흐름을 잘 보여준다.

```text
S: MAIL FROM:<Smith@Alpha.ARPA>
R: 250 OK
S: RCPT TO:<Jones@Beta.ARPA>
R: 250 OK
S: RCPT TO:<Green@Beta.ARPA>
R: 550 No such user here
S: RCPT TO:<Brown@Beta.ARPA>
R: 250 OK
S: DATA
R: 354 Start mail input; end with <CRLF>.<CRLF>
S: Blah blah blah...
S: ...etc. etc. etc.
S: <CRLF>.<CRLF>
R: 250 OK
```

여기서 `Smith@Alpha.ARPA`가 보낸 message는 `Beta.ARPA`의 Jones, Green, Brown에게 가려 한다. Receiver는 Jones와 Brown은 accept하지만 Green은 unknown recipient로 reject한다. 하지만 적어도 하나 이상의 recipient가 verified되었으므로 sender는 message text를 전송한다.

Connection closing은 두 단계다. Sender가 `QUIT`을 보내고 receiver reply를 기다린 뒤 TCP close를 시작한다. Receiver는 `QUIT` reply를 보낸 뒤 자신의 TCP close를 시작한다. SMTP는 TCP의 full-duplex capability 위에서 동작하지만, protocol conversation 자체는 command/reply 중심으로 순서화되어 있어 half-duplex처럼 보인다.

#### RFC 822 Message Format

`RFC 822`는 electronic mail에서 쓰이는 text message format을 정의한다. SMTP는 message 전송에 이 format을 채택한다. RFC 822 관점에서 message는 `envelope`과 `contents`로 나뉜다.

| 구분 | 의미 |
|---|---|
| `Envelope` | transmission과 delivery에 필요한 정보 |
| `Contents` | recipient에게 전달할 object |
| `RFC 822 standard` | 엄밀히는 contents에 적용되지만, contents 안의 header field가 mail system이 envelope 정보를 만들도록 돕는다. |

RFC 822 message는 text line sequence이며, memo framework를 사용한다. 먼저 rigid format을 따르는 header lines가 나오고, blank line 뒤에 arbitrary text body가 온다. Header line은 보통 `keyword: arguments` 형식이며, 긴 header line은 여러 줄로 접을 수 있다.

자주 쓰이는 header keyword는 다음과 같다.

| Header field | 의미 |
|---|---|
| `From` | sender |
| `To` | primary recipient |
| `Subject` | message subject |
| `Date` | 작성/전송 시각 |
| `Cc` | carbon copy recipient |
| `Message-ID` | message의 unique identifier |

간단한 구조는 다음처럼 볼 수 있다.

```text
Date: Tue, 16 Jan 1996 10:37:17 (EST)
From: "William Stallings" <ws@host.com>
Subject: The Syntax in RFC 822
To: Smith@Other-Host.com
Cc: Jones@Yet-Another-Host.com

Hello. This section begins the actual message body.
```

SMTP와 RFC 822의 관계를 정리하면, SMTP는 "어떻게 host 사이에서 mail을 넘길 것인가"이고 RFC 822는 "넘겨지는 text mail contents가 어떤 header/body 형식을 갖는가"다. 이후 MIME은 이 RFC 822 framework를 유지하면서 nontextual data와 다양한 character set을 다룰 수 있게 확장한다.

#### MIME이 필요한 이유

`MIME(Multipurpose Internet Mail Extensions)`은 RFC 822 framework를 확장해 SMTP/RFC 822 mail의 한계를 해결한다. 핵심 요구는 기존 RFC 822 implementation과 compatible하면서도 multimedia mail을 표준적으로 표현하고 운반하는 것이다.

SMTP/822 scheme의 한계는 다음과 같다.

| 한계 | 의미 |
|---|---|
| Binary object 전송 불가 | executable file, general binary data를 직접 전송할 수 없다. UUencode/UUdecode 같은 변환 방식이 있었지만 표준은 아니었다. |
| National language characters 처리 불가 | 8-bit code 값이 필요한 문자들이 있는데 SMTP는 `7-bit ASCII`에 제한된다. |
| Message size 제한 | 일부 SMTP server는 특정 크기 이상의 mail을 reject할 수 있다. |
| ASCII/EBCDIC gateway 문제 | gateway마다 character code mapping이 일관되지 않아 translation 문제가 생긴다. |
| X.400 gateway 문제 | X.400 mail network와의 gateway가 nontextual data를 제대로 다루지 못할 수 있다. |
| SMTP 구현 편차 | line break 삭제/추가/재정렬, 76자 초과 line wrapping, trailing white space 제거, tab 변환 등 mail system이 body를 바꿔버릴 수 있다. |

MIME의 목적은 "아무 data나 그냥 SMTP로 보내자"가 아니라, mail transport system이 변형하기 쉬운 환경에서도 content를 안전하게 표현할 수 있는 표준 header, content type, transfer encoding을 정의하는 것이다.

#### MIME Overview와 Header Fields

MIME specification은 세 요소로 이루어진다.

| 요소 | 역할 |
|---|---|
| New message header fields | RFC 822 header 안에 body 설명 정보를 추가한다. |
| Content formats | multimedia electronic mail을 위한 표준 content representation을 정의한다. |
| Transfer encodings | 어떤 content format이든 mail system에 의해 alter되지 않는 transport-safe form으로 바꾼다. |

MIME이 정의한 다섯 header field는 다음과 같다.

| MIME header field | 의미 |
|---|---|
| `MIME-Version` | MIME RFC를 따르는 message임을 표시한다. 값은 `1.0`이어야 한다. |
| `Content-Type` | body에 들어 있는 data type과 subtype을 설명해 receiving user agent가 적절한 display/processing mechanism을 고르게 한다. |
| `Content-Transfer-Encoding` | body를 mail transport에 적합한 형태로 표현하기 위해 어떤 transformation을 적용했는지 나타낸다. |
| `Content-ID` | MIME entity를 여러 context에서 unique하게 식별한다. |
| `Content-Description` | body 안 object에 대한 plaintext description이다. Audio처럼 직접 display하기 어려운 object에 유용하다. |

Compliant implementation은 `MIME-Version`, `Content-Type`, `Content-Transfer-Encoding`을 지원해야 한다. `Content-ID`와 `Content-Description`은 optional이며 recipient implementation이 무시할 수도 있다.

#### MIME Content Types

MIME의 많은 부분은 content type 정의에 할애된다. Content type은 data의 general type을 나타내고, subtype은 해당 type 안의 specific format을 나타낸다.

| Major type | 대표 subtype | 의미 |
|---|---|---|
| `text` | `plain` | unformatted text. ASCII 또는 ISO 8859 character set을 사용할 수 있다. |
| `multipart` | `mixed`, `parallel`, `alternative`, `digest` | body가 여러 independent/related parts로 구성된다. |
| `message` | `rfc822`, `partial`, `external-body` | body 자체가 message이거나 message fragment, 또는 외부 object pointer다. |
| `image` | `jpeg`, `gif` | displayable image |
| `video` | `mpeg` | time-varying picture image |
| `audio` | `basic` | audio data. 원문은 8-bit ISDN μ-law PCM speech encoding을 예로 든다. |
| `application` | `PostScript`, `octet-stream` | binary data 또는 mail-based application이 처리할 data |

`multipart` type은 boundary parameter가 중요하다. `Content-Type: multipart/mixed; boundary="simple boundary"`처럼 boundary를 지정하면, body 안 각 part는 새 line에서 `--boundary`로 시작한다. 마지막 part 뒤에는 `--boundary--`처럼 boundary 뒤에 hyphen 두 개가 추가된다. 각 part 안에는 optional ordinary MIME header가 올 수 있다.

Multipart subtype은 용도가 다르다.

| Subtype | 의미 |
|---|---|
| `multipart/mixed` | 여러 independent body parts를 하나의 message로 묶고, 나타난 순서대로 제시한다. |
| `multipart/parallel` | mixed와 비슷하지만 receiver에게 delivery order 의미가 없다. 가능한 경우 text와 audio를 동시에 제시할 수 있다. |
| `multipart/alternative` | 같은 information의 alternative version들을 담는다. Parts는 original에 대한 faithfulness가 증가하는 순서로 놓이고, recipient system은 표시 가능한 "best" version을 선택한다. |
| `multipart/digest` | 각 body part가 기본적으로 `message/rfc822`로 해석되는 digest 형태다. 여러 e-mail message를 하나의 MIME message로 묶는 데 유용하다. |

`message` type은 mail 안에 또 다른 message 또는 message reference를 넣는 기능을 제공한다.

| Message subtype | 의미 |
|---|---|
| `message/rfc822` | body가 header와 body를 포함한 entire message다. 이름은 rfc822지만 encapsulated message는 MIME message일 수도 있다. |
| `message/partial` | 큰 message를 여러 fragment로 나눠 destination에서 reassembly한다. `id`, `number`, `total` parameter로 fragment grouping과 순서를 나타낸다. |
| `message/external-body` | 실제 data는 body에 없고, body는 외부 data 접근 정보를 담는다. Access type으로 FTP, TFTP, Anon-FTP, local-file, AFS, mail-server 등이 쓰일 수 있다. |

`application/octet-stream`은 general binary data를 나타낸다. RFC 2045는 receiving implementation이 이를 file로 저장하거나 program input으로 사용할 수 있게 제안한다. 이 subtype은 MIME이 "mail body는 사람이 읽는 text"라는 가정을 벗어나 binary payload까지 담는다는 점을 잘 보여준다.

#### MIME Transfer Encodings

`Content-Transfer-Encoding`은 content를 mail transport가 안전하게 운반할 수 있는 representation으로 바꾸는 방법을 표시한다. 이 field는 여섯 값을 가질 수 있다.

| Encoding value | 의미 |
|---|---|
| `7bit` | 짧은 ASCII line만 사용한다. SMTP transport에 안전하다. |
| `8bit` | line은 짧지만 high-order bit가 set된 non-ASCII octet이 있을 수 있다. |
| `binary` | non-ASCII character가 있을 수 있고 line length도 SMTP transport에 충분히 짧지 않을 수 있다. |
| `quoted-printable` | 대부분 ASCII text인 data를 사람이 대체로 알아볼 수 있게 유지하면서 unsafe octet만 encoding한다. |
| `base64` | 6-bit input block을 printable ASCII output character로 mapping한다. Arbitrary binary data에 안전하다. |
| `x-token` | named nonstandard encoding. Vendor/application-specific scheme을 나타낼 수 있다. |

`7bit`, `8bit`, `binary`는 실제 encoding을 수행했다기보다 data의 성질을 알려주는 값이다. MIME이 실제로 정의하는 두 encoding scheme은 `quoted-printable`과 `base64`다. 두 scheme은 서로 다른 trade-off를 가진다.

| Encoding | 적합한 data | 장점 | 비용 |
|---|---|---|---|
| `quoted-printable` | 대부분 printable ASCII인 text | 사람이 어느 정도 읽을 수 있고 ASCII 중심 text에서 compact하다. | binary data에는 비효율적일 수 있다. |
| `base64` / `radix-64` | arbitrary binary data | mail transport program의 text processing에 안전하다. | 24-bit input이 32-bit output으로 확장되어 size overhead가 있다. |

Quoted-printable은 unsafe character를 `=` 뒤에 two-digit hexadecimal octet value로 표현한다. 예를 들어 ASCII form feed의 8-bit 값 decimal 12는 `=0C`로 표현된다. Printable ASCII range의 많은 문자는 그대로 두지만, `=` 자체는 encoding 대상이다. Line 끝의 tab/space는 transport agent가 바꾸거나 제거할 수 있으므로 hex representation으로 표현해야 한다. Encoded line이 76 characters를 넘을 것 같으면 soft line break를 삽입한다.

`base64`, 즉 `radix-64 encoding`은 arbitrary binary input을 universally representable printable character output으로 바꾼다. Control character를 쓰지 않고, RFC 822에서 의미가 있는 hyphen도 character set에서 제외한다. Character set은 `A-Z`, `a-z`, `0-9`, `+`, `/`의 64개와 padding character `=`로 구성된다.

![Figure 22.2](@/assets/images/data-communication-299-figure-22-2-page-779.png)
*Figure 22.2 · PDF p. 779 · 24-bit binary input을 네 개의 radix-64 printable character, 즉 32-bit output으로 mapping하는 방식*

Base64의 기본 단위는 3 octets = 24 bits다. 이를 6-bit group 네 개로 나누고, 각 6-bit value를 printable character 하나로 mapping한다. 각 output character는 실제 저장/전송 시 보통 8-bit ASCII로 표현되므로 24-bit input이 32-bit output이 된다.

원문 예시는 다음과 같다.

```text
Input binary: 00100011 01011100 10010001
Input hex:    235C91

Split into 6-bit groups:
001000 110101 110010 010001

Decimal values:
8, 53, 50, 17

Radix-64 characters:
I1yR

ASCII bytes with zero parity:
01001001 00110001 01111001 01010010
Hex output:
49317952
```

MIME의 핵심 설계 감각은 "content semantics"와 "transport safety"를 분리하는 것이다. `Content-Type`은 body가 무엇인지 말하고, `Content-Transfer-Encoding`은 그 body를 낡고 다양한 mail transport system을 통과해도 안전한 byte/text representation으로 어떻게 포장했는지 말한다.

### 22.2 Network Management: SNMP

조직의 network와 distributed processing system이 커질수록 두 가지 사실이 분명해진다. 첫째, network와 관련 resources/applications는 조직 운영에 필수적이다. 둘째, 규모가 커질수록 장애 지점이 늘어나고, network 전체 또는 일부가 중단되거나 performance가 수용 불가능한 수준으로 떨어질 가능성도 커진다.

대규모 reliable network는 사람이 수동으로만 관리하기 어렵다. 특히 multi-vendor equipment가 섞이면 monitoring, control, management information을 표준화한 automated network management tools가 필요하다. 이 요구에 대응하는 가장 널리 쓰이는 표준이 `SNMP(Simple Network Management Protocol)`다.

#### Network Management System

`network management system`은 network monitoring과 control을 위한 tool들의 집합이다. 원문은 통합의 의미를 두 가지로 설명한다.

| 통합 요소 | 의미 |
|---|---|
| Single operator interface | 대부분의 network management task를 수행할 수 있는 powerful but user-friendly command/interface를 제공한다. |
| Minimal additional equipment | management에 필요한 hardware/software 대부분을 existing user equipment에 포함시킨다. |

Network management system은 기존 network component 위에 incremental hardware/software addition을 올리는 방식이다. Host computer, communication processor, network switch, router 등에 management software가 들어가고, system은 network 전체를 unified architecture로 바라본다. 각 point에는 address/label이 부여되고, element/link attribute가 system에 알려져 있으며, active elements는 network control center에 status information을 정기적으로 feedback한다.

#### SNMPv1 Basic Concepts

`SNMPv1`은 원래 TCP/IP network와 internetwork를 관리하기 위한 tool로 개발되었지만, 이후 여러 networking environment로 확장되었다. SNMP라는 이름은 protocol 하나만 가리키기보다 protocol, database definition, associated concepts를 포함한 network management specification collection을 가리킨다.

SNMP network management model의 key elements는 다음 네 가지다.

| 요소 | 역할 |
|---|---|
| `management station` / `manager` | human network manager가 network management system에 접근하는 interface다. |
| `agent` | host, bridge, router, hub 같은 managed platform에서 management station의 요청에 응답하고 event를 보고하는 software/process다. |
| `MIB(Management Information Base)` | managed resource를 나타내는 standardized managed objects의 collection이다. |
| `network management protocol` | management station과 agent 사이의 get/set/notify exchange를 수행한다. TCP/IP에서는 SNMP가 이 역할을 한다. |

Management station은 standalone device일 수도 있고 shared system 위 capability일 수도 있다. 최소한 management applications, human manager interface, manager 요구를 remote element monitoring/control로 바꾸는 capability, managed entities에서 추출한 management information database를 가진다. 이 중 SNMP standardization의 직접 대상은 remote monitoring/control로 변환하는 capability와 management information database 쪽이다.

Agent는 management station으로부터 information request와 action request를 받고, 중요한 event를 unsolicited information 형태로 management station에 비동기적으로 제공할 수 있다.

#### MIB와 Managed Object

SNMP에서 network resource는 `object`로 표현된다. Object는 managed agent의 한 aspect를 나타내는 data variable이다. 이 object들의 collection이 `MIB(Management Information Base)`다.

MIB는 management station이 agent에 접근하는 access point collection처럼 동작한다.

| Management action | MIB 관점 |
|---|---|
| Monitoring | management station이 MIB object value를 retrieve한다. |
| Control/action | management station이 특정 variable value를 modify하거나 action을 유발한다. |
| Standardization | 같은 class의 system은 같은 management objects를 지원해야 한다. 예: bridges는 공통 bridge management objects를 지원한다. |

SNMP protocol family가 제공하는 기본 capability는 세 가지다.

| Capability | 의미 |
|---|---|
| `Get` | management station이 agent의 object value를 retrieve한다. |
| `Set` | management station이 agent의 object value를 set한다. |
| `Notify` | agent가 significant event를 unsolicited notification으로 management station에 보낸다. |

#### Centralized vs Distributed Network Management

전통적인 centralized management에서는 하나의 host가 network management station 역할을 하고, 나머지 device들은 agent software와 MIB를 가진다. 그러나 network가 커지고 traffic load가 커지면 이 구조는 부담이 커진다. 모든 agent report가 central headquarters까지 가야 하므로 management station의 processing burden과 network traffic이 증가한다.

이때 더 적합한 방식이 decentralized/distributed management다.

![Figure 22.3](@/assets/images/data-communication-300-figure-22-3-page-782.png)
*Figure 22.3 · PDF p. 782 · top-level management server, intermediate manager, agent로 나뉜 distributed network management 구성*

Distributed scheme에서는 여러 top-level management station, 즉 management server가 network 일부를 직접 관리한다. 많은 agent에 대해서는 intermediate manager에게 책임을 위임한다. Intermediate manager는 아래쪽 agent에 대해서는 manager 역할을 하고, 위쪽 management server에 대해서는 agent 역할을 한다. 이 architecture는 processing burden을 분산하고 total network traffic을 줄인다.

#### SNMPv1 Protocol Architecture

SNMP는 TCP/IP suite의 application-level protocol이며, `UDP(User Datagram Protocol)` 위에서 동작하도록 의도되었다. Standalone management station에는 central MIB 접근을 제어하고 network manager에게 interface를 제공하는 manager process가 있다. Manager process는 UDP, IP, network-dependent protocol 위에서 SNMP를 사용해 network management를 수행한다.

![Figure 22.4](@/assets/images/data-communication-301-figure-22-4-page-783.png)
*Figure 22.4 · PDF p. 783 · management station, host, router에서 SNMP가 UDP/IP 위에 배치되는 SNMPv1 configuration*

Agent device도 SNMP, UDP, IP를 구현해야 한다. 또한 SNMP message를 해석하고 agent의 MIB를 제어하는 agent process가 필요하다. 해당 device가 FTP 같은 다른 application도 지원하면 TCP도 함께 필요할 수 있다. Figure 22.4에서 shaded 부분은 managed operational environment이고, unshaded 부분은 network management function을 지원하는 protocol/process다.

SNMP가 UDP에 의존하기 때문에 SNMP 자체도 connectionless다. Management station과 agent 사이에 ongoing connection을 유지하지 않는다. 대신 각 exchange가 별도의 transaction이다. 이 단순성은 overhead를 낮추지만, reliable stream이나 session state에 기대지 않는 방식으로 management operation을 설계해야 한다는 뜻이기도 하다.

#### SNMPv1 Message Role

Figure 22.5는 management application과 SNMP manager/agent 사이에서 message가 어떤 역할을 하는지 더 직접적으로 보여준다.

![Figure 22.5](@/assets/images/data-communication-302-figure-22-5-page-784.png)
*Figure 22.5 · PDF p. 784 · SNMP manager가 GetRequest, GetNextRequest, SetRequest를 보내고 agent가 GetResponse/Trap으로 응답·보고하는 구조*

Management station은 management application을 대신해 세 종류의 SNMP message를 발행한다.

| SNMPv1 message | 방향 | 역할 |
|---|---|---|
| `GetRequest` | manager → agent | 특정 MIB object value를 조회한다. |
| `GetNextRequest` | manager → agent | MIB object sequence를 탐색할 때 다음 object value를 조회한다. |
| `SetRequest` | manager → agent | 특정 MIB object value를 설정한다. |
| `GetResponse` | agent → manager | Get/Set 계열 request에 대한 acknowledgement와 result를 전달한다. |
| `Trap` | agent → manager | MIB와 underlying managed resource에 영향을 주는 event를 unsolicited notification으로 전달한다. |

Port 번호도 role을 반영한다. Management request는 UDP `port 161`로 보내고, agent의 trap은 UDP `port 162`로 보낸다.

SNMPv1의 장점은 이름 그대로 단순성이다. Limited and easily implemented MIB, streamlined protocol, scalar variables와 two-dimensional tables 중심 구조 덕분에 다양한 vendor의 management station과 agent software가 interoperability를 달성하기 쉽다. 단점도 여기서 나온다. 기능이 제한적이고, security facility가 부족하다. 이 기능적/보안적 결함이 SNMPv2와 SNMPv3로 이어진다.

#### SNMPv2 Elements

`SNMPv2`는 SNMPv1처럼 network management application을 만들기 위한 framework를 제공한다. Fault management, performance monitoring, accounting 같은 application 자체는 표준 범위 밖이고, SNMPv2는 management information을 표현하고 교환하는 infrastructure를 제공한다.

SNMPv2의 essence는 management information exchange protocol이다. Network management system의 각 player는 local `MIB`를 유지한다. SNMPv2 standard는 이 information의 structure와 allowable data types를 정의하며, 이 정의를 `SMI(Structure of Management Information)`라고 부른다. SMI는 management information을 정의하기 위한 language처럼 볼 수 있다.

![Figure 22.6](@/assets/images/data-communication-303-figure-22-6-page-785.png)
*Figure 22.6 · PDF p. 785 · manager server, element manager, agent가 SNMPv2 manager/agent role로 연결되는 managed configuration*

SNMPv2는 centralized management와 distributed management를 모두 지원한다. Distributed strategy에서는 일부 system이 manager와 agent 역할을 모두 수행한다.

| 역할 | 동작 |
|---|---|
| `manager server` | network management applications를 host하고 전체 또는 일부 network를 관리한다. |
| `agent` | local information을 수집해 MIB에 저장하고 manager 접근을 기다린다. |
| `manager/agent` | 위쪽 superior management system에는 agent처럼 보이고, 아래쪽 remote devices에는 manager처럼 동작한다. |
| `proxy agent` | superior manager의 command 중 일부를 remote device에 대해 대신 수행하고 결과를 다시 agent 역할로 전달한다. |

SNMPv2 exchange도 simple request/response type protocol이며, 보통 UDP 위에서 구현된다. Exchange가 discrete request-response pair 성격이므로 ongoing reliable connection이 필요하지 않다.

#### SMI: Structure of Management Information

`SMI`는 MIB를 정의하고 구성하는 general framework다. 세 가지를 정한다.

| SMI 요소 | 역할 |
|---|---|
| Data types | MIB에 저장할 수 있는 data type을 제한한다. |
| Object/table definition technique | object와 object table을 formal하게 정의하는 방법을 제공한다. |
| Unique identifier scheme | 실제 system의 각 object를 unique identifier로 참조할 수 있게 한다. |

SMI의 철학은 simplicity와 extensibility다. MIB는 simple data types만 저장할 수 있고, 복잡한 data structure 생성/검색을 지원하지 않는다. Scalar와 scalar의 two-dimensional array인 table을 중심으로 한다. 이는 더 풍부한 기능을 제공하는 OSI systems management와 대비된다. SNMPv2가 complex data type을 피하는 이유는 implementation을 단순화하고 interoperability를 높이기 위해서다. Vendor-created data type이 inevitable한 상황에서 제한을 느슨하게 두면 interoperability가 무너지기 쉽다.

대표 allowable data types는 다음과 같다.

| Data type | 의미 |
|---|---|
| `INTEGER` | signed integer range |
| `UInteger32` | 0부터 `2^32 - 1`까지의 unsigned integer |
| `Counter32`, `Counter64` | modulo `2^32` 또는 `2^64`로 증가할 수 있는 nonnegative counter |
| `Gauge32` | 증가/감소 가능하지만 maximum value를 넘지 않는 nonnegative integer |
| `TimeTicks` | 1/100초 단위 time value |
| `OCTET STRING` | arbitrary binary/textual data |
| `IpAddress` | 32-bit internet address |
| `Opaque`, `BIT STRING` | arbitrary bit field 또는 named bits |
| `OBJECT IDENTIFIER` | object 또는 standardized element에 부여되는 administratively assigned name |

#### SNMPv2 PDU Format과 Protocol Operation

SNMPv2의 basic unit of exchange는 `message`다. Message는 outer message wrapper와 inner `PDU(Protocol Data Unit)`로 구성된다. Outer message header는 security와 관련되고, inner PDU는 management operation 자체를 담는다.

![Figure 22.7](@/assets/images/data-communication-304-figure-22-7-page-787.png)
*Figure 22.7 · PDF p. 787 · SNMPv2 PDU의 request-id, error-status, GetBulk field, variable-bindings 구조*

SNMPv2 PDU에서 자주 등장하는 field는 다음과 같다.

| Field | 의미 |
|---|---|
| `PDU type` | PDU 종류 |
| `request-id` | outstanding request를 unique하게 식별하는 integer. Response correlation과 duplicate PDU 처리에 사용된다. |
| `error-status` | response에서 error 상태를 나타낸다. |
| `error-index` | error를 일으킨 variable 위치를 가리킨다. |
| `variable-bindings` | object identifier list이며, PDU에 따라 각 object value도 함께 포함한다. |
| `non-repeaters`, `max-repetitions` | `GetBulkRequest-PDU`에서 bulk retrieval 방식을 지정한다. |

SNMPv2가 운반할 수 있는 주요 PDU는 다음과 같다.

| PDU | 방향/성격 | 핵심 의미 |
|---|---|---|
| `GetRequest-PDU` | manager → agent | 하나 이상의 object name에 대해 value를 요청한다. |
| `GetNextRequest-PDU` | manager → agent | named object 다음의 lexicographic order object value를 요청한다. MIB view structure를 동적으로 발견하는 데 유용하다. |
| `GetBulkRequest-PDU` | manager → agent | 큰 양의 management information을 적은 protocol exchange로 가져오기 위해 가능한 큰 response를 요청한다. |
| `SetRequest-PDU` | manager → agent | 하나 이상의 object value 변경을 요청한다. Atomic operation이다. |
| `Response-PDU` | agent/manager → requester | 같은 request-id로 request 결과를 반환한다. |
| `SNMPv2-Trap-PDU` | agent role → manager | unusual/significant event를 asynchronous notification으로 보낸다. Response를 요구하지 않는 unconfirmed message다. |
| `InformRequest-PDU` | manager role → manager role | 다른 manager에게 management information을 전달한다. Receiver는 Response-PDU로 acknowledge한다. |

SNMPv2의 중요한 개선점은 partial response와 bulk retrieval이다. SNMPv1에서는 GetRequest 안 변수 중 하나라도 unsupported이면 `noSuchName` error로 전체가 실패할 수 있었다. SNMPv2는 relevant MIB view에 없는 variable에 대해 identifier와 error code를 variable-bindings list에 넣으면서 가능한 값은 함께 반환할 수 있다. `GetBulkRequest`는 large table이나 많은 object를 가져올 때 request-response 횟수를 줄인다.

`SetRequest`는 atomic하다. Variable-bindings list의 모든 variable을 update할 수 있으면 모두 반영하고 Response-PDU에 값을 포함한다. 하나라도 실패하면 아무 값도 update하지 않으며, `error-status`와 `error-index`가 실패 이유와 위치를 나타낸다.

#### SNMPv3 Security

SNMPv2는 SNMPv1의 많은 functional deficiency를 해결했지만, security deficiency는 남아 있었다. 이를 보완하기 위해 `SNMPv3`가 정의되었다. SNMPv3는 완전히 새로운 management protocol을 제공한다기보다, 기존 SNMPv2와 함께 사용할 overall SNMP architecture와 security capabilities를 정의한다.

SNMPv3의 중요한 service는 세 가지다.

| Service | Model | 의미 |
|---|---|---|
| `authentication` | `USM(User-Based Security Model)` | message가 header source로 표시된 principal에게서 왔고, transit 중 altered/delayed/replayed되지 않았음을 확인한다. |
| `privacy` | `USM(User-Based Security Model)` | manager와 agent 사이 message를 encrypt한다. 원문은 DES 기반 encryption을 설명한다. |
| `access control` | `VACM(View-Based Access Control Model)` | manager principal별로 agent MIB의 어느 부분에 어떤 operation을 허용할지 제한한다. |

SNMPv3 security service는 service를 요청하는 user identity에 의해 governed된다. 이 identity는 `principal`로 표현되며, individual, application, group일 수 있다.

Authentication은 message authentication code를 사용한다. Sender principal은 SNMP message에 authentication code를 포함한다. 이 code는 message contents, sending/receiving party identity, transmission time, sender/receiver만 알아야 하는 secret key의 function이다. Receiver는 같은 secret key로 code를 다시 계산해 incoming value와 비교한다. 일치하면 authorized manager가 보낸 message이며 transit 중 변경되지 않았다고 판단할 수 있다. 실제 authentication code는 Internet-standard authentication mechanism인 `HMAC`이다.

중요한 practical point는 shared secret key가 USM 내부에서 자동으로 생성/분배되는 것이 아니라 preconfigured되어야 한다는 점이다. Configuration manager나 network manager가 SNMP manager와 agent database에 secret key를 넣어야 하며, 수동 또는 USM 외부 secure data transfer를 사용할 수 있다.

Privacy facility도 manager principal과 agent principal이 shared secret key를 가져야 한다. Privacy를 사용하도록 configured되면 양자 사이 traffic은 `DES(Data Encryption Standard)`로 encrypted된다.

Access control은 agent가 manager별로 MIB access level을 다르게 제공하게 한다. 제한은 두 가지 방향으로 이루어진다.

| Access control 제한 | 예 |
|---|---|
| MIB portion 제한 | 대부분의 manager에게는 performance statistics view만 허용하고, 특정 manager에게만 configuration parameter view/update를 허용한다. |
| Operation 제한 | 특정 manager를 read-only access로 제한한다. |

Agent는 manager별 access policy를 preconfigured table로 유지한다. 이 점에서 SNMPv3는 Chapter 21의 `authentication`, `privacy/confidentiality`, `access control` 개념을 network management protocol에 직접 적용한 사례다.

## 연결 관계

Chapter 22의 두 application은 서로 성격이 다르지만 application-layer protocol 설계의 공통 원칙을 보여준다.

| 축 | SMTP/MIME | SNMP |
|---|---|---|
| Application 목적 | 사용자 간 electronic mail delivery | network resource monitoring/control |
| Transport | SMTP는 TCP port 25 사용 | SNMP는 주로 UDP 사용 |
| 기본 구조 | sender/receiver command-reply | manager/agent request-response + trap |
| Data 표현 문제 | RFC 822, MIME Content-Type, transfer encoding | MIB, SMI, object identifier, data type |
| Reliability 관점 | TCP 위 transfer지만 end-to-end recipient retrieval 보장은 아님 | UDP 위 connectionless transaction, request-id로 response correlation |
| 확장 방향 | MIME으로 multimedia/non-ASCII/binary 지원 | SNMPv2로 기능 개선, SNMPv3로 security 추가 |

앞 장과의 연결도 뚜렷하다. SMTP는 TCP의 reliable byte stream을 사용하지만 application-level acknowledgement는 제한적이다. SNMP는 UDP의 low-overhead datagram model을 사용해 management exchange를 discrete transaction으로 처리한다. MIME의 base64/radix-64는 data representation과 line-oriented mail transport의 제약을 맞추는 encoding 문제이며, SNMPv3의 HMAC/DES는 Chapter 21의 MAC과 symmetric encryption이 실제 protocol security에 쓰이는 예다.

## 오해하기 쉬운 내용

| 오해 | 정리 |
|---|---|
| SMTP가 mail system 전체를 정의한다 | SMTP는 SMTP sender와 SMTP receiver 사이의 transfer conversation이 핵심이다. User agent, mailbox, local queue 구조는 범위 밖일 수 있다. |
| SMTP receiver의 accept는 recipient가 mail을 읽었다는 뜻이다 | 아니다. Receiver host에 message transfer가 완료되었다는 뜻이다. Final recipient retrieval 보장은 별도 문제다. |
| RFC 821과 RFC 822는 같은 역할이다 | RFC 821은 SMTP transfer protocol, RFC 822는 mail message content format이다. |
| MIME은 SMTP를 대체한다 | MIME은 RFC 822 framework를 확장해 body type과 transfer encoding을 추가하는 방식이며, SMTP를 기반으로 한다. |
| Content-Type과 Content-Transfer-Encoding은 같은 뜻이다 | Content-Type은 body가 무엇인지, Content-Transfer-Encoding은 transport-safe representation으로 어떻게 바꿨는지 나타낸다. |
| SNMP의 MIB는 하나의 고정 파일만 뜻한다 | MIB는 전체 management information database를 뜻할 수도 있고, 특정 defined collection을 뜻할 수도 있다. |
| SNMPv2는 보안을 완성했다 | SNMPv2는 기능 개선이 핵심이고, security deficiency를 보완하는 것은 SNMPv3다. |
| Trap은 request-response처럼 반드시 응답을 받는다 | SNMPv2-Trap-PDU는 response를 요구하지 않는 unconfirmed asynchronous notification이다. |

## 면접 질문

1. `SMTP`의 책임 범위와 user agent/mailbox/local queue의 책임을 구분해 설명하라.
2. SMTP에서 `MAIL`, `RCPT`, `DATA` command를 분리한 이유를 설명하라.
3. SMTP reply code의 leading digit가 의미하는 category를 설명하라.
4. `RFC 821`과 `RFC 822`의 차이를 설명하라.
5. MIME이 SMTP/RFC 822의 어떤 한계를 해결하는지 예를 들어 설명하라.
6. `Content-Type`과 `Content-Transfer-Encoding`의 차이를 설명하라.
7. `quoted-printable`과 `base64(radix-64)` encoding의 사용 상황과 trade-off를 설명하라.
8. SNMP의 `management station`, `agent`, `MIB`, `network management protocol`의 역할을 설명하라.
9. SNMP가 UDP 위에서 동작할 때 얻는 장점과 설계상 주의점을 설명하라.
10. SNMPv1의 `GetRequest`, `GetNextRequest`, `SetRequest`, `GetResponse`, `Trap`의 차이를 설명하라.
11. SNMPv2에서 `GetBulkRequest-PDU`와 partial response가 왜 개선점인지 설명하라.
12. SNMPv3의 `USM`, `VACM`, `HMAC`, `DES`가 각각 어떤 보안 서비스를 제공하는지 설명하라.

## 핵심 용어 정리

| Term | 의미 |
|---|---|
| `electronic mail` | distributed system에서 host/user 사이 message를 전달하는 application |
| `SMTP(Simple Mail Transfer Protocol)` | TCP/IP host 사이 mail transfer를 담당하는 protocol |
| `RFC 821` | SMTP transfer protocol 정의 |
| `RFC 822` | electronic mail text message format 정의 |
| `SMTP sender`, `SMTP receiver` | SMTP command/reply로 mail을 보내고 받는 protocol entity |
| `MAIL`, `RCPT`, `DATA`, `QUIT` | SMTP mail transfer와 connection closing의 핵심 command |
| `MIME(Multipurpose Internet Mail Extensions)` | RFC 822 mail에 multimedia, binary, non-ASCII content 표현을 추가하는 extension |
| `Content-Type` | MIME body의 data type/subtype을 나타내는 header field |
| `Content-Transfer-Encoding` | MIME body를 mail transport에 안전한 representation으로 바꾸는 encoding 정보 |
| `quoted-printable` | 대부분 ASCII text인 data를 readable하게 유지하며 unsafe octet만 encoding하는 방식 |
| `base64`, `radix-64 encoding` | binary data를 printable ASCII character sequence로 mapping하는 MIME transfer encoding |
| `network management system` | network monitoring/control을 위한 integrated tool set |
| `SNMP(Simple Network Management Protocol)` | manager/agent/MIB 기반 network management protocol family |
| `management station`, `manager` | network manager interface와 management application을 제공하는 system |
| `agent` | managed device에서 MIB를 유지하고 SNMP request/trap을 처리하는 entity |
| `MIB(Management Information Base)` | managed object collection 또는 management information database |
| `managed object` | agent의 한 관리 대상 aspect를 나타내는 data variable |
| `SMI(Structure of Management Information)` | SNMPv2 MIB data type, object/table definition, identifier scheme |
| `GetRequest`, `GetNextRequest`, `SetRequest` | manager가 agent에 보내는 SNMP 조회/탐색/설정 PDU |
| `GetBulkRequest` | 많은 management information을 적은 exchange로 가져오기 위한 SNMPv2 PDU |
| `Response-PDU` | request-id에 대응하는 SNMPv2 response |
| `Trap` | agent가 event를 비동기적으로 알리는 notification |
| `InformRequest` | manager role entity 사이에서 management information을 전달하고 acknowledgement를 받는 SNMPv2 PDU |
| `SNMPv3` | SNMPv2에 authentication, privacy, access control security architecture를 더한 version |
| `USM(User-Based Security Model)` | SNMPv3 authentication/privacy model |
| `VACM(View-Based Access Control Model)` | SNMPv3 access control model |
