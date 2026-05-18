---
title: "Chapter 9. Application Development"
order: 9
pubDatetime: 2026-05-18T00:18:00+09:00
modDatetime: 2026-05-18T00:18:00+09:00
description: "Database System Concepts 정리: Chapter 9. Application Development"
tags:
  - "Database"
  - "CS"
---

## 개요

실제 database 사용은 대부분 사용자가 SQL prompt에서 직접 query를 입력하는 방식이 아니다. 거의 모든 user interaction은 `application program`을 통해 간접적으로 일어난다. Application은 front end에서 user interface를 제공하고, back end에서 database와 통신하며, 중간에는 task별 business rule을 실행하는 `business logic`을 둔다.

Chapter 9는 database-backed application을 만들 때 필요한 web/mobile interface, server-side framework, client-side JavaScript, web service, application architecture, performance, security, encryption을 다룬다. 핵심은 “database system을 안전하고 빠르게 사용자에게 노출하려면 어떤 application layer가 필요한가”다.

## 핵심 개념

- `application program`은 user input을 받아 database query/update로 변환하고, 결과를 user interface에 맞게 표시한다.
- Web/mobile application은 client가 database에 직접 접근하지 않고, backend API나 application server를 통해 database를 사용한다.
- `HTML`, `HTTP`, `URL`, `form`, `GET/POST`, `cookie`, `session`은 web application의 기본 구성 요소다.
- `servlet`, `JSP`, `PHP`, `Django` 같은 server-side framework는 HTTP request를 받아 dynamic response를 생성한다.
- `JavaScript`, `Ajax`, `web service`, `REST`, `SOAP`은 client-side interaction과 backend API 호출을 연결한다.
- Application architecture는 presentation, business logic, data-access layer를 분리해 유지보수성과 보안을 높인다.
- Performance에는 caching, connection pooling, parallel processing 같은 기법이 중요하다.
- Security에는 SQL injection, XSS, CSRF, password leakage, authentication, authorization, audit trail, privacy, encryption이 포함된다.

## 세부 정리

#### 9.1 Application Programs and User Interfaces

대부분의 사용자는 database query language를 직접 사용하지 않는다. 대신 application이 forms-based interface, menu, button, mobile UI 같은 front end를 제공하고, 사용자가 입력한 값을 database operation으로 변환한다. 예를 들어 university registration system은 username/password로 user를 authenticate한 뒤, 등록된 courses, course/instructor information을 database에서 읽어 보여주고, course registration request를 database update로 바꾼다.

Application program은 보통 세 부분으로 나뉜다.

| 구성 요소 | 역할 |
|---|---|
| front-end component | user interface를 처리하고 input/output을 담당 |
| middle layer / business logic | request를 해석하고 business rule, authorization, workflow를 적용 |
| backend component | database와 통신해 data를 fetch/store |

`business logic`은 단순 SQL 실행 이상의 규칙이다. 예를 들어 “누가 어떤 task를 수행할 수 있는가”, “등록 가능한 정원이 남았는가”, “한 transaction에서 어떤 update들이 함께 일어나야 하는가” 같은 application-specific rule을 처리한다.

초기 database application은 mainframe과 terminal 중심이었다. 이후 PC와 GUI가 보급되면서 client program이 shared database에 직접 접속하는 `client-server architecture`가 널리 쓰였다. 하지만 이 방식에는 두 문제가 있다.

| 문제 | 설명 |
|---|---|
| security risk | user machine이 database에 직접 접근하므로 database 노출면이 커진다 |
| deployment/update cost | application이나 database가 바뀌면 모든 client machine의 copy를 갱신해야 한다 |

이를 피하기 위해 두 접근이 발전했다.

첫째, `web browser`를 universal front end로 사용한다. Browser는 OS/browser에 독립적인 `HTML(HyperText Markup Language)`을 해석해 formatted display와 forms-based interface를 제공한다. Client machine에 application-specific software를 설치할 필요가 없고, web에 연결된 거의 모든 기기에서 접근할 수 있다.

단순 HTML만으로는 현대적 UI를 만들기 어렵기 때문에 browser는 `JavaScript`를 실행한다. JavaScript code는 browser에 투명하게 download되어 실행되며, C 같은 native code와 달리 안전 모드에서 실행되어 client machine 보안 위험을 줄인다. Browser front end의 request는 web server/application server로 전달되고, server-side program이 request를 처리해 response를 생성한다.

둘째, mobile device에 application program을 설치한다. Mobile app은 backend API와 통신하고 database에 직접 접근하지 않는다. Backend application은 authentication과 authorization을 담당하고, 사용자가 허용된 service만 호출하게 한다. Mobile app은 작은 화면에 맞춘 UI를 제공하고, 큰 application code를 고속 network에서 미리 download/update할 수 있다는 장점이 있다.

오늘날에는 web app과 mobile app의 경계가 많이 줄었다. Browser JavaScript도 backend API를 호출하고, mobile app도 같은 backend API를 호출한다. 하나의 backend가 web front end, Android, iOS 등 여러 client를 동시에 지원하는 구조가 흔하다.

#### 9.2 Web Fundamentals

Web application을 이해하려면 `URL`, `HTTP`, `HTML`, `form`, `web server`, `session`, `cookie`가 필요하다.

##### 9.2.1 Uniform Resource Locators

`URL(Uniform Resource Locator)`은 web에서 접근 가능한 document/resource의 globally unique name이다.

```text
http://www.acm.org/sigmod
```

URL의 첫 부분은 access method를 나타낸다. `http`는 HTML document 전송에 쓰이는 `HTTP(HyperText Transfer Protocol)`을 의미하고, `https`는 secure HTTP를 의미한다. 오늘날에는 `https`가 선호된다. 두 번째 부분은 web server machine 이름이고, 나머지는 server 안에서 document나 program을 식별하는 path/identifier다.

URL은 server-side program과 argument도 포함할 수 있다.

```text
https://www.google.com/search?q=silberschatz
```

이 URL은 `www.google.com`의 `search` program을 실행하고, argument `q=silberschatz`를 넘긴다는 뜻이다. Web server는 이 request를 받아 program을 실행하고, program이 생성한 HTML document를 browser로 돌려보낸다.

##### 9.2.2 HyperText Markup Language

`HTML`은 browser가 표시할 document의 구조와 formatting을 tag로 표현한다. Figure 9.1은 HTML table source를 보여주고, Figure 9.2는 browser가 이를 rendering한 결과를 보여준다.

![Figure 9.1](@/assets/images/cs-database-136-figure-9-1-page-435.png)
*Figure 9.1 · PDF p. 435 · table data를 HTML source로 표현한 예*

![Figure 9.2](@/assets/images/cs-database-137-figure-9-2-page-435.png)
*Figure 9.2 · PDF p. 435 · Figure 9.1 HTML table의 browser display*

기본 구조는 다음과 같다.

| HTML tag | 의미 |
|---|---|
| `<html>` | HTML page 전체 |
| `<body>` | page body |
| `<table>` | table |
| `<tr>` | table row |
| `<th>` | header cell |
| `<td>` | regular table cell |

HTML form은 user input을 server-side application으로 보내는 핵심 mechanism이다.

![Figure 9.3](@/assets/images/cs-database-138-figure-9-3-page-436.png)
*Figure 9.3 · PDF p. 436 · person type과 name을 입력받는 HTML form source*

![Figure 9.4](@/assets/images/cs-database-139-figure-9-4-page-436.png)
*Figure 9.4 · PDF p. 436 · Figure 9.3 form의 browser display*

Figure 9.3의 form은 `action="PersonQuery"`와 `method=get`을 가진다. 사용자가 submit하면 browser는 form field인 `persontype`, `name` 값을 URL `PersonQuery`로 전송한다. Web server는 이 URL에 대응되는 application program을 실행하고, program은 결과 HTML을 생성해 user에게 보여준다.

HTTP form data 전송 방식은 두 가지가 중요하다.

| method | 방식 | 특징 |
|---|---|---|
| `GET` | parameter를 URL query string에 encoding | bookmark/share가 쉽지만 URL에 값이 노출됨 |
| `POST` | parameter를 HTTP request body/protocol exchange에 포함 | URL에 값이 직접 드러나지 않고 큰 payload에 적합 |

예를 들어 `GET`은 다음처럼 query parameter를 URL에 붙인다.

```text
https://www.google.com/search?q=silberschatz
```

HTML은 style과 input type도 발전했다. `CSS(Cascading Style Sheets)`는 여러 HTML document에 같은 style을 적용해 site 전체의 look을 통일한다. `HTML5`는 date/time picker, file input, numeric constraints, regular expression pattern 같은 다양한 input type/constraint를 제공한다. 예를 들어 number input에 `min`, `max`, `step`, `value`를 지정해 허용값을 제한할 수 있다.

##### 9.2.3 Web Servers and Sessions

`web server`는 server machine에서 실행되며 browser request를 받아 HTML document 같은 response를 돌려주는 program이다. Browser와 web server는 `HTTP`로 통신한다. Web server는 static document를 전송할 뿐 아니라, user-supplied arguments로 application program을 실행하고 그 결과를 HTML response로 전달할 수 있다.

초기 표준인 `CGI(Common Gateway Interface)`는 web server가 application program과 통신하는 방식을 정의했다. Application program은 보통 JDBC/ODBC 같은 protocol로 database server와 통신한다.

![Figure 9.5](@/assets/images/cs-database-140-figure-9-5-page-438.png)
*Figure 9.5 · PDF p. 438 · web server, application server, database server를 분리한 three-layer architecture*

Figure 9.5의 `three-layer web application architecture`는 web server, application server, database server를 분리한다. 이 구조는 역할 분리가 명확하지만 server level이 많아 system overhead가 증가한다. 특히 CGI 방식은 request마다 새 process를 시작해 overhead가 크다.

![Figure 9.6](@/assets/images/cs-database-141-figure-9-6-page-439.png)
*Figure 9.6 · PDF p. 439 · web server와 application server를 합친 two-layer architecture*

오늘날 많은 web application은 Figure 9.6처럼 web server와 application server를 결합한 `two-layer web application architecture`를 사용한다. Browser는 HTTP request를 보내고, combined web/application server가 application logic을 실행한 뒤 database server와 data를 주고받는다.

HTTP는 기본적으로 `connectionless`다. Request를 처리하기 위해 일시적으로 connection이 열리고 response가 전송되면 connection이 닫힐 수 있다. 이는 server의 simultaneous connections 한계를 피하는 데 유리하다. 다만 application 입장에서는 user login 상태, preferences, session options 같은 `session information`이 필요하다.

Connectionless HTTP 위에서 session을 구현하기 위해 client와 server가 추가 정보를 유지한다. 보통 client browser에는 `cookie`를 저장하고, server에는 session identifier와 관련 상태를 저장한다.

```text
1. user authenticates
2. server creates random session identifier
3. server sends cookie such as sessionid=<random-id>
4. browser includes cookie in later requests
5. server checks sessionid against active session table
6. match이면 ongoing session으로 처리
```

Cookie는 name이 붙은 작은 text 조각이다. 특정 domain이 set한 cookie는 그 domain만 retrieve할 수 있고, 다른 domain의 cookie를 읽을 수 없다. Security가 낮은 site는 cookie를 오래 유지해 재방문 시 사용자를 기억할 수 있다. Security가 중요한 application은 timeout이나 logout 때 session을 invalidate한다. Session invalidation은 application server의 active session list에서 session identifier를 제거하는 것이다.

#### 9.3 Servlets

`Java servlet specification`은 web/application server와 application program 사이의 communication API를 정의한다. Java의 `HttpServlet` class가 servlet API specification을 구현하며, 특정 기능을 수행하는 servlet class는 `HttpServlet`의 subclass로 정의된다.

Servlet의 역할은 HTTP request를 처리하고, 필요하면 database에 접근해 data를 가져오거나 저장한 뒤, client browser에 돌려줄 HTML response를 동적으로 생성하는 것이다. Servlet code는 web/application server가 시작될 때 또는 servlet에 대한 첫 HTTP request가 들어올 때 server에 load된다.

##### 9.3.1 A Servlet Example

Servlet은 HTML form으로 전달된 input을 읽고, business logic을 적용하고, database query를 실행하고, 결과 HTML을 생성하는 데 사용된다.

![Figure 9.7](@/assets/images/cs-database-142-figure-9-7-page-441.png)
*Figure 9.7 · PDF p. 441 · PersonQuery form을 처리하는 servlet code 예*

Figure 9.7의 `PersonQueryServlet`은 Figure 9.3의 form을 처리한다. Form은 `action="PersonQuery"`를 지정했고, servlet code는 annotation `@WebServlet("PersonQuery")`로 이 URL을 servlet에 mapping한다. Form이 `GET` method를 사용하므로 servlet의 `doGet()` method가 호출된다.

Servlet request 처리 흐름은 다음과 같다.

```text
browser submits HTML form
        ↓
web/application server maps URL to servlet
        ↓
new request thread invokes doGet() or doPost()
        ↓
HttpServletRequest carries parameters/cookies
        ↓
servlet applies business logic and JDBC database access
        ↓
HttpServletResponse receives generated HTML
        ↓
browser displays response
```

`HttpServletRequest` object는 form menu/input field 값과 cookie를 담는다. 예를 들어 `request.getParameter("persontype")`, `request.getParameter("name")`으로 form parameter를 읽는다. `HttpServletResponse` object는 browser로 나갈 response를 나타낸다. Servlet은 `response.getWriter()`로 `PrintWriter`를 얻고, 여기에 HTML text를 출력한다.

Query result를 HTML table로 출력하는 utility function은 Figure 9.8에 있다.

![Figure 9.8](@/assets/images/cs-database-143-figure-9-8-page-443.png)
*Figure 9.8 · PDF p. 443 · JDBC ResultSet을 HTML table로 출력하는 utility function*

Figure 9.8은 `ResultSetMetaData`로 column 수를 알아내고, `ResultSet`을 row by row로 순회하며 `<table>`, `<tr>`, `<th>`, `<td>`를 출력한다. Database column name을 그대로 display하지 않고 별도의 `headers` array를 받는 이유는 database 내부 이름이 user-facing label로 적절하지 않을 수 있기 때문이다.

##### 9.3.2 Servlet Sessions

Browser와 web/application server의 interaction은 기본적으로 stateless다. 각 request는 connect, request, response, disconnect 흐름을 따르며, server가 자동으로 이전 request의 context를 기억하지 않는다. Cookie는 같은 browser session에서 온 request임을 식별하는 low-level mechanism이지만, programmer에게는 더 높은 abstraction이 필요하다.

Servlet API는 `HttpSession` object를 제공한다. `HttpServletRequest.getSession(false)`는 현재 request에 대응되는 session이 있으면 그 `HttpSession`을 반환하고, 없으면 `null`을 반환한다. `getSession(true)`는 ongoing session이 없을 때 새 session을 만들라는 뜻이다.

Session 생성과 인증 흐름은 다음처럼 이해하면 된다.

```text
1. user submits login form with username/password
2. login servlet validates password
3. if valid, servlet calls getSession(true)
4. server creates session object and session identifier
5. server sets cookie such as sessionId=<id>
6. servlet stores session attribute such as userid
7. later request sends cookie
8. server maps sessionId to HttpSession
9. servlet reads session.getAttribute("userid")
```

Session object에는 `(attribute-name, value)` pair를 저장할 수 있다.

```java
session.setAttribute("userid", userid);
session.getAttribute("userid");
```

User가 login되어 있는지 확인하려면 `getSession(false)`로 session을 얻고, `userid` 같은 session attribute가 있는지 검사한다. 없으면 login page로 redirect하거나 error를 보여준다. 원문 예제는 5초 뒤 `login.html`로 refresh하는 방식으로 redirect한다.

원문 footnote는 password storage도 짚는다. Plaintext password를 database에 저장하는 것은 매우 위험하다. 대신 password에 user별 random `salt`를 붙이고 hashing function을 적용해 `passwordhash`를 저장한다. Login 시에도 입력 password에 같은 salt를 붙여 hash한 뒤 저장된 hash와 비교한다. 이 내용은 9.8/9.9의 security/encryption과 직접 연결된다.

##### 9.3.3 Servlet Life Cycle

Servlet life cycle은 web/application server가 관리한다.

```text
request for servlet arrives
        ↓
if no servlet instance:
    load servlet class into JVM
    create servlet instance
    call init()
        ↓
for each request:
    call service(request, response)
    service dispatches to doGet() or doPost()
        ↓
when no longer needed:
    call destroy()
```

중요한 점은 servlet instance가 load될 때 한 번만 `init()`되고, 각 request는 기본적으로 새 thread에서 `service()`를 실행한다는 점이다. 따라서 같은 servlet에 대한 여러 request가 parallel하게 처리될 수 있다. Servlet code가 shared state를 다룬다면 thread-safety를 고려해야 한다.

##### 9.3.4 Application Servers

`application server`는 servlet 실행 환경뿐 아니라 application deployment, stop/start, monitoring, performance statistics 같은 기능을 제공한다. Tomcat, Glassfish, JBoss, WebLogic, Oracle Application Server, WebSphere 같은 server들이 servlet을 지원한다.

Application server는 Java EE/J2EE platform을 통해 objects, distributed/parallel processing, server-side components 같은 다양한 service도 제공할 수 있다. 다만 최종 정리 관점에서는 특정 제품 암기보다 “web/application server가 servlet lifecycle과 application-level service를 관리한다”는 점이 핵심이다.

#### 9.4 Alternative Server-Side Frameworks

Servlet은 강력하지만, 단순한 dynamic page를 Java code로 모두 작성하면 HTML을 Java string으로 출력해야 해서 번거롭다. 그래서 server-side scripting과 web application framework가 등장했다.

##### 9.4.1 Server-Side Scripting

`server-side scripting`은 HTML document 안에 script code를 embedded하고, server가 page를 client에게 보내기 전에 그 script를 실행하는 방식이다. Script가 실행되며 text를 생성하면 그 text가 HTML output에 포함되고, script source 자체는 client에게 전달되지 않는다. Script는 database access SQL을 실행할 수도 있다.

대표 framework/language로 `JSP(Java Server Pages)`, ASP.NET, PHP, Ruby on Rails 등이 있다.

##### 9.4.1.1 Java Server Pages

`JSP(Java Server Pages)`는 static HTML과 dynamically generated HTML을 섞어 쓸 수 있게 한다. 많은 dynamic web page는 대부분이 static HTML이고 일부만 request parameter나 database result에 따라 달라진다. Servlet만 사용하면 static HTML까지 Java string으로 출력해야 하는데, JSP는 HTML 안에 Java code를 삽입해 dynamic 부분만 code로 생성하게 한다.

![Figure 9.9](@/assets/images/cs-database-144-figure-9-9-page-446.png)
*Figure 9.9 · PDF p. 446 · HTML 안에 Java code가 embedded된 JSP page*

Figure 9.9에서 Java code는 `<% ... %>` 안에 들어간다. Browser가 JSP page를 request하면 application server는 JSP를 처리해 HTML output을 만든다. Static HTML은 그대로 output되고, embedded Java code는 실행되어 `out` object에 print한 text로 대체된다.

JSP는 내부적으로 servlet code로 translate되고 compile된다. Programmer는 servlet 생성 boilerplate를 직접 작성하지 않아도 된다. JSP는 tag library도 지원해, HTML tag처럼 보이지만 server에서 해석되는 custom tag를 사용할 수 있다. Iterator, if-then-else, date/time display, paginated table 같은 기능을 tag library로 제공할 수 있다.

##### 9.4.1.2 PHP

`PHP`도 server-side scripting language로, HTML 안에 PHP code를 섞어 쓴다. PHP code는 `<?php ... ?>` 사이에 들어가며, request parameter는 `$REQUEST` array에서 읽는다. `echo`는 HTML output에 text를 출력하고, `.` operator는 string concatenation을 수행한다.

PHP file은 보통 `.php` extension을 가지며, configured web server는 이를 PHP file로 해석해 server에서 실행한 뒤 generated HTML을 browser로 보낸다. PHP도 ODBC 기반 database access library를 포함한 여러 library를 제공한다.

##### 9.4.2 Web Application Frameworks

`web application framework`는 web application에 반복적으로 필요한 기능을 통합 제공한다.

| framework feature | 역할 |
|---|---|
| HTML/HTTP/session library | request/response, form, cookie, session 처리 |
| template scripting system | view/page를 template 기반으로 생성 |
| controller | form submit 같은 event를 적절한 handler function에 mapping |
| authentication/session management | login/session 흐름을 framework가 지원 |
| authorization tools | user가 어떤 action/resource에 접근 가능한지 관리 |
| declarative form/validation | form과 validation constraint를 선언하면 HTML/JavaScript/Ajax 생성 |
| object model and ORM | relational database에 object를 저장/조회 |

이런 framework는 boilerplate code를 줄이고, CRUD(create, read, update, delete) web interface를 빠르게 만들 수 있게 한다. Generated code는 간단한 application을 빨리 시작하게 해 주고, 필요하면 수정해 더 정교한 interface로 발전시킬 수 있다.

##### 9.4.3 The Django Framework

`Django`는 Python 기반 web application framework다. Django에서 `view`는 Java의 servlet과 비슷하게 HTTP request를 처리하는 function이다. URL-to-view mapping은 보통 `urls.py`에 정의된다. Django application server는 HTTP request를 받으면 URL mapping을 보고 어떤 view function을 호출할지 결정한다.

![Figure 9.10](@/assets/images/cs-database-145-figure-9-10-page-449.png)
*Figure 9.10 · PDF p. 449 · Django view로 구현한 person query application*

Figure 9.10의 `person_query_view()`는 servlet 예제와 같은 person query task를 수행한다. 흐름은 다음과 같다.

```text
1. request.session에서 username이 있는지 확인
2. 없으면 login view로 redirect
3. request.GET에서 persontype/personname parameter 읽기
4. persontype에 따라 student 또는 instructor query template 선택
5. connection.cursor()로 database cursor 열기
6. cursor.execute(query_tmpl, [personname])로 parameterized query 실행
7. result_set_to_html()로 result를 HTML table string으로 변환
8. HttpResponse로 browser에 반환
```

여기서 `cursor.execute(query_tmpl, [personname])`처럼 query와 parameter 값을 분리해 전달하는 방식은 뒤의 SQL injection 방어와도 연결된다. Django는 form creation, form validation, authentication annotation, template system, ORM도 제공한다. Django ORM은 9.6.2에서 application architecture의 data-access layer와 함께 다시 등장한다.

#### 9.5 Client-Side Code and Web Services

오늘날 user interface의 큰 축은 web interface와 mobile application interface다. 초기 browser는 HTML display만 했지만, 곧 browser 안에서 code를 실행해 더 flexible한 interaction을 제공할 필요가 생겼다. `client-side scripting language`는 client browser에서 실행되는 언어이며, HTML form만으로 어려운 responsive UI를 가능하게 한다.

Client-side code가 중요한 이유는 두 가지다.

| 이유 | 설명 |
|---|---|
| flexible interaction | browser에서 DOM을 조작해 dynamic UI를 만들 수 있다 |
| responsiveness | 모든 interaction을 server에 보내지 않고 client에서 즉시 처리할 수 있다 |

하지만 client가 database에 직접 접근하는 것은 좋지 않다. Low-level database details가 노출되고, database가 attack surface가 되기 때문이다. 따라서 backend는 database를 직접 노출하지 않고 `web services` 형태로 data fetch/update 기능을 제공한다.

##### 9.5.1 JavaScript

`JavaScript`는 가장 널리 쓰이는 client-side scripting language다. Validation, responsive user interface, web service interaction을 담당한다.

##### 9.5.1.1 Input Validation

JavaScript function은 user input이 server로 전송되기 전에 browser에서 validation을 수행할 수 있다. 예를 들어 date format이 맞는지, age가 허용 범위 안인지, start date가 end date보다 늦지 않은지 등을 검사한다. Server round trip 전에 오류를 잡으므로 user experience가 좋아지고 server load도 줄어든다.

HTML5 input tag만으로도 일부 validation constraint를 지정할 수 있다.

```html
<input type="number" name="credits" size="2" min="1" max="15">
```

이 input은 `credits` 값이 1부터 15 사이의 number여야 함을 browser에 알린다. HTML5로 표현하기 어려운 복잡한 validation은 JavaScript로 처리한다.

![Figure 9.11](@/assets/images/cs-database-146-figure-9-11-page-451.png)
*Figure 9.11 · PDF p. 451 · JavaScript로 start/end date form input을 validation하는 예*

Figure 9.11은 form의 `onsubmit`에서 `validate()` function을 호출한다. Function은 DOM에서 `start`, `end` input value를 읽고, `startdate > enddate`이면 alert를 띄우고 `false`를 반환해 form submission을 막는다.

중요한 주의점은 client-side validation만 믿으면 안 된다는 것이다. Browser code는 user가 수정하거나 우회할 수 있으므로, security와 data integrity가 필요한 validation은 server-side에서도 반드시 다시 수행해야 한다. Client-side validation은 편의와 빠른 feedback을 위한 장치다.

##### 9.5.1.2 Responsive User Interfaces

JavaScript의 큰 장점은 browser 안에서 표시 중인 HTML을 동적으로 바꿀 수 있다는 점이다. Browser는 HTML을 `DOM(Document Object Model)`이라는 in-memory tree structure로 parsing한다. JavaScript는 DOM tree를 수정해 table row를 추가하거나, field를 숨기거나, menu/tab/widget을 갱신할 수 있다.

예를 들어 bill에 여러 item row를 입력해야 할 때, 처음에는 몇 개 row만 보여주고 사용자가 `Add Item`을 누르면 JavaScript가 DOM에 table row를 추가할 수 있다. 이 작업은 server request 없이 client에서 즉시 일어난다.

Browser마다 DOM detail이 다를 수 있으므로, 직접 browser-specific JavaScript를 작성하면 호환성 문제가 생길 수 있다. 이를 줄이기 위해 `jQuery` 같은 JavaScript library를 사용한다. Library는 browser 차이를 내부에서 처리하고, menu, tabs, sliders, autocomplete 같은 UI element를 function call로 만들 수 있게 한다.

HTML5도 rich interaction을 지원한다. Drag-and-drop, geolocation, Server-Side Events(SSE) 등이 대표적이다. `SSE(Server-Side Events)`는 backend가 어떤 event가 발생했을 때 front end에 notification을 보낼 수 있게 한다.

##### 9.5.1.3 Interfacing with Web Services

`Ajax`는 JavaScript code가 browser interaction을 block하지 않고 background에서 web server와 비동기적으로 통신해 data를 가져오고 화면을 갱신하는 기술들의 묶음이다. 오늘날 Ajax에서 가장 흔한 data format은 Chapter 8의 `JSON(JavaScript Object Notation)`이다. XML도 쓰일 수 있지만, web API에서는 JSON이 일반적이다.

Ajax의 기본 흐름은 다음과 같다.

```text
user action in browser
        ↓
JavaScript starts asynchronous request
        ↓
backend web service receives request
        ↓
server fetches/updates database
        ↓
server returns JSON/XML data
        ↓
callback updates DOM without full page reload
```

Backend에서 이런 data-fetching function 역할을 하는 component를 `web service`라고 부른다. Web service는 Java Servlet, Python framework 등으로 구현될 수 있다.

대표 예가 autocomplete다. 사용자가 text box에 문자를 입력할 때마다 JavaScript가 partial input을 backend에 보내고, backend는 가능한 completion 목록을 JSON array로 반환한다. Drop-down list로 모든 값을 한 번에 보여주기 어려운 큰 value set에서 유용하다.

![Figure 9.12](@/assets/images/cs-database-147-figure-9-12-page-454.png)
*Figure 9.12 · PDF p. 454 · jQuery autocomplete와 DataTables를 사용하는 Ajax HTML page*

Figure 9.12의 code는 jQuery와 DataTables plug-in을 사용한다. `$("#name")`은 id가 `name`인 DOM node를 찾고, 여기에 autocomplete function을 붙인다. `source: "/autocomplete_name"`은 completion 후보를 가져올 web service URL을 지정한다.

또한 `loadTableAsync()`는 `persontype`과 `name` parameter로 URL을 만들고, `myTable.ajax.url(url).load()`로 web service에서 JSON data를 가져와 table row를 채운다. Function은 즉시 반환되고, data가 도착하면 table이 asynchronously 채워진다.

![Figure 9.13](@/assets/images/cs-database-148-figure-9-13-page-455.png)
*Figure 9.13 · PDF p. 455 · Figure 9.12 Ajax code가 browser에 표시한 결과*

Ajax는 dependent dropdown에도 자주 쓰인다. 예를 들어 country를 선택하면 그 country의 states list를 background에서 download해 state dropdown을 채운다. Full page reload 없이 필요한 data만 가져오기 때문에 더 responsive하다.

##### 9.5.2 Web Services

`web service`는 web을 통해 호출할 수 있는 application component이며, 사실상 application programming interface(API)처럼 동작한다. Web service request는 HTTP protocol로 전송되고, application server에서 실행되며, 결과가 calling program으로 반환된다.

널리 쓰이는 접근은 두 가지다.

| 방식 | 특징 |
|---|---|
| `REST(Representational State Transfer)` | URL에 대한 표준 HTTP request로 function call을 표현, parameter는 HTTP parameter로 전달, JSON/XML로 결과 반환 |
| `Big Web Services` / SOAP 계열 | XML로 parameter/result encoding, formal API definition, HTTP 위에 별도 protocol layer 사용 |

RESTful web service는 단순하고 널리 쓰인다. JavaScript running in browser가 RESTful service를 호출해 화면을 갱신하는 것이 일반적이다. 예를 들어 web map에서 화면을 scroll하면 새로 보여야 할 map tile/data를 JavaScript가 RESTful interface로 가져와 표시한다.

Web service는 public API로 문서화되어 외부 application이 호출할 수도 있고, 특정 application 내부에서만 쓰일 수도 있다. 사용 조건도 다양하다. 아무 제한이 없을 수도 있고, login이 필요할 수도 있으며, API provider에게 비용을 지불해야 할 수도 있다.

Frontend뿐 아니라 backend 간 통신에도 web service가 널리 쓰인다. 예를 들어 object storage service, text-to-speech API, speech recognition API, vision API 같은 backend service를 application이 호출해 기능을 빌려 쓸 수 있다. 이 구조는 centralized database 하나로 직접 처리하기 어려운 scalability와 specialized functionality를 제공한다.

##### 9.5.3 Disconnected Operation

`disconnected operation`은 client가 application server와 연결되어 있지 않아도 일부 작업을 계속할 수 있게 하는 기능이다. 예를 들어 student가 offline 상태에서 application form을 작성하고, network가 복구되면 server에 저장할 수 있다. Web-based email client도 offline에서 email을 작성해 두고, reconnect 후 전송할 수 있다.

이를 위해 client machine에 local storage가 필요하다. HTML5는 JavaScript로 접근 가능한 local storage를 제공한다.

```javascript
localStorage.setItem(key, value)
localStorage.getItem(key)
localStorage.deleteItem(key)
```

`localStorage`는 key/value pair만 저장한다. 특정 value를 찾으려면 key를 알아야 하므로, 여러 attribute로 tuple을 검색해야 하는 application에는 부족하다. HTML5의 `IndexedDB`는 JSON objects를 저장하고 여러 attribute에 index를 둘 수 있다. 또한 schema version과 schema migration code를 지원한다.

Browser는 storage abuse를 막기 위해 site별 storage limit을 둘 수 있다. 원문은 default maximum이 보통 약 5MB라고 설명한다.

##### 9.5.4 Mobile Application Platforms

Mobile app은 작은 touch-screen device에 맞는 GUI를 제공하고, menu, list, button, checkbox, progress bar, text/image/video display 같은 standard UI component를 사용한다. Android와 iOS가 대표 platform이다.

Mobile app의 장점은 다음과 같다.

| 장점 | 설명 |
|---|---|
| ahead-of-time download | 고속 network에서 미리 download/update하고 나중에 사용 가능 |
| small-device optimized UI | 작은 화면과 touch interaction에 맞게 설계 가능 |
| compiled execution | machine code로 compile되어 web app보다 전력 효율이 좋을 수 있음 |
| local storage/offline usage | network 없이도 data를 저장하고 나중에 sync 가능 |
| device feature access | location, camera, contacts 등을 user authorization 하에 사용 |

단점은 platform fragmentation이다. Android code는 iOS에서 그대로 실행되지 않고, iOS code도 Android에서 실행되지 않는다. 같은 application을 두 번 작성해야 할 수 있다. React Native와 Flutter 같은 cross-platform framework는 high-level code의 상당 부분을 Android/iOS에서 공통으로 쓰게 해 이 문제를 줄인다.

고속 mobile network가 널리 보급되면서 web app의 약점 일부가 줄었고, `Progressive Web Apps(PWA)`가 등장했다. PWA는 JavaScript/HTML5 기반으로 mobile device에 맞춰진 web app이며, mobile app의 일부 장점과 web app의 배포 편의성을 결합한다.

PWA를 가능하게 하는 핵심 기능은 다음과 같다.

| PWA enabling feature | 의미 |
|---|---|
| HTML5 local data storage | offline에서도 app 사용 가능 |
| JavaScript compilation/JIT | 제한된 JavaScript subset을 효율적으로 실행해 CPU/energy cost 감소 |
| service workers | web page와 별도로 background script 실행 |
| background synchronization | local store와 backend web service를 나중에 sync |
| push notifications | backend service로부터 notification 수신 |
| geolocation | user authorization 후 location 기반 기능 제공 |

PWA는 많은 mobile app use case를 대체할 수 있지만, 모든 native mobile app을 대체하는 것은 아니다. Platform-specific 기능이나 고성능 native 기능이 필요한 경우에는 native app이 여전히 필요하다.

### 9.6 Application Architectures

큰 애플리케이션은 복잡도를 낮추기 위해 여러 layer로 나눈다. Chapter 1의 three-tier architecture가 여기서는 실제 웹 애플리케이션 내부 구조로 구체화된다.

| Layer | 역할 | 주의점 |
|---|---|---|
| `presentation layer` / `user-interface layer` | 사용자와 상호작용하는 화면. 웹 브라우저, 모바일 UI처럼 여러 버전이 있을 수 있음 | 화면 크기와 입력 방식에 따라 view가 달라질 수 있음 |
| `business-logic layer` | 데이터와 작업을 application domain 수준의 개념으로 표현하고 business rule을 적용 | DB tuple 조작이 아니라 "수강 신청", "입학 승인" 같은 작업 단위로 생각 |
| `data-access layer` | business logic과 database 사이의 인터페이스 제공 | relational database와 object-oriented code 사이의 mapping을 담당할 수 있음 |

presentation layer는 흔히 Model-View-Controller(MVC) 구조로 다시 나뉜다. `model`은 business-logic layer에 해당하고, `view`는 데이터를 사용자에게 보여 주는 방식을 정의하며, `controller`는 user action/event를 받아 model 작업을 실행하고 적절한 view를 반환한다. 같은 model이라도 데스크톱 브라우저, 작은 모바일 화면, 다른 접근 장치에 따라 view는 달라질 수 있다.

![Figure 9.14](@/assets/images/cs-database-149-figure-9-14-page-459.png)
*Figure 9.14 · PDF p. 459 · controller, model, view, data-access layer가 요청을 처리하는 web application architecture*

Figure 9.14의 흐름은 다음처럼 읽을 수 있다.

| 단계 | 흐름 |
|---|---|
| 1 | web browser가 application server의 controller에 요청 전송 |
| 2 | controller가 model에 작업 요청 |
| 3-4 | model이 business logic을 수행하며 data-access layer를 통해 database 조회/갱신 |
| 5-6 | model이 result object를 만들고 view module에 전달 |
| 7-8 | view가 HTML view를 만들고 browser에 반환 |

점점 더 많은 애플리케이션에서 view layer 일부는 서버가 아니라 client-side JavaScript에서 실행된다. 이 경우 서버는 완성된 HTML보다 JSON 같은 데이터를 반환하고, 브라우저가 DOM을 갱신한다. 그래도 business logic과 data access의 책임을 분리해야 한다는 원칙은 유지된다.

#### 9.6.1 The Business-Logic Layer

business-logic layer는 데이터베이스의 relation을 그대로 노출하지 않고, 애플리케이션 도메인의 높은 수준 개념을 제공한다. 대학 애플리케이션이라면 `student`, `instructor`, `course`, `section` 같은 entity abstraction과 "학생 입학 처리", "수강 신청", "선수 과목 확인" 같은 action을 포함한다.

이 layer의 핵심은 business rule을 지키는 것이다. 예를 들어 학생이 수강 신청을 할 때는 prerequisite을 이수했는지, tuition fee를 냈는지 같은 조건을 검사해야 한다. 이런 규칙을 UI나 SQL 조각마다 흩어 놓으면 일관성이 깨지므로, domain action을 처리하는 코드에 모아 두는 것이 좋다.

business logic에는 workflow도 포함된다. 입학 지원서 처리처럼 여러 참여자가 순서대로 검토해야 하는 작업은 누가 먼저 승인하고, 승인 후 누구에게 넘어가며, 거절 또는 최종 합격 통지는 언제 나가는지의 흐름을 가진다. deadline을 놓친 경우 supervisor에게 알리는 것처럼 error situation 처리도 workflow management의 일부다.

#### 9.6.2 The Data-Access Layer and Object-Relational Mapping

data-access layer는 application code가 database와 직접 맞닿는 세부사항을 감춘다. business logic이 database와 같은 relational model을 쓰는 단순한 경우에는 JDBC/ODBC 연결, SQL 실행, 결과 처리 같은 세부 구현을 숨기는 정도면 충분하다.

하지만 business logic이 Java, Python 같은 object-oriented programming language로 작성되면 데이터는 object와 method 중심으로 모델링된다. 반면 저장소는 relational database인 경우가 많다. 이때 object를 만들기 위해 tuple을 읽고, object update를 다시 relation update로 바꾸는 작업을 매번 수동으로 작성하면 번거롭고 오류가 많다.

Object-Relational Mapping(ORM)은 이 변환을 자동화한다. 필요한 object는 demand에 따라 database에서 읽어 만들고, 수정된 object는 commit 시점에 relation update로 반영한다. object-oriented database가 이 문제의 한 해법이 될 수 있었지만, 실제로는 기존 relational database 위에 ORM layer를 얹는 방식이 더 널리 쓰인다.

##### 9.6.2.1 Hibernate ORM

Hibernate는 Java object와 relation 사이의 mapping을 제공하며 Java Persistence API(JPA)를 구현한다. mapping file 또는 annotation으로 Java class와 relation, class attribute와 relation attribute의 대응을 지정한다. database host, user name, password 같은 연결 정보는 properties file에 둔다.

예를 들어 `Student` class를 `student` relation에 mapping하고, `ID` attribute를 `student.ID`에 mapping할 수 있다. Java code에서 `session.save(stud)`를 호출하면 Hibernate가 필요한 SQL insert를 생성한다. 객체를 primary key로 가져올 때는 `session.get(Student.class, "12328")`처럼 호출하고, object를 memory에서 수정한 뒤 transaction commit을 하면 Hibernate가 해당 relation update를 자동으로 수행한다.

Hibernate의 annotation 예는 ORM의 의도를 잘 보여 준다.

```java
@Entity public class Student {
    @Id String ID;
    String name;
    String department;
    int tot_cred;
}
```

`@Entity`는 class가 database relation에 mapping됨을 나타내고, `@Id`는 primary key attribute를 지정한다. 기본 relation/attribute 이름은 class/field 이름을 따르지만, `@Table`, `@Column` annotation으로 바꿀 수 있다.

관계(relationship) mapping은 단순 entity보다 더 까다롭다. 예를 들어 `takes` relationship은 각 student에 section set을 붙이고, 각 section에 student set을 붙이는 방식으로 object model에 표현할 수 있다. mapping이 지정되면 Hibernate는 `takes` relation에서 이 set을 채우고, set update를 commit 시 database에 반영한다.

Hibernate Query Language(HQL)는 SQL과 비슷하지만 object를 직접 대상으로 삼도록 설계된 query language다. 예를 들어 `"from Student as s order by s.ID asc"` 같은 HQL query는 Hibernate가 SQL로 번역하고, 결과 tuple은 `Student` object list로 변환된다. 다만 복잡한 query에는 ORM을 우회해 relation에 직접 SQL을 쓰는 것이 더 적절할 수 있다.

##### 9.6.2.2 The Django ORM

Django ORM은 Python class로 model을 정의하고, 이를 database relation으로 mapping한다. SQLAlchemy도 Python에서 널리 쓰이는 ORM이지만, 이 절의 예시는 Django를 사용한다.

![Figure 9.15](@/assets/images/cs-database-150-figure-9-15-page-463.png)
*Figure 9.15 · PDF p. 463 · Django에서 Student, Instructor model과 many-to-many advisor 관계를 정의하는 예*

Figure 9.15에서는 `student`와 `instructor` relation의 field가 각각 `models.Model` class의 field로 표현된다. `id`는 `primary_key=True`로 지정되고, 문자열/숫자 field에는 길이와 자릿수 같은 type constraint가 붙는다. `advisor` relation은 `Instructor`의 `advisees = models.ManyToManyField(student, related_name="advisors")`로 표현된다. `advisees`는 instructor에서 student set을 보는 attribute이고, `related_name="advisors"`는 student에서 instructor set을 보는 reverse relationship 이름을 만든다.

![Figure 9.16](@/assets/images/cs-database-151-figure-9-16-page-464.png)
*Figure 9.16 · PDF p. 464 · SQL 없이 Django model object를 filter하고 관계 attribute를 따라가는 view 예*

Figure 9.16의 `Student.objects.filter(name=personname)`은 조건을 만족하는 student object들을 반환한다. 각 student의 `advisors.all()`은 advisor object 목록을 돌려주고, code는 그 object들의 `name`을 모아 HTML로 반환한다. instructor 쪽도 `Instructor.objects.filter()`와 `advisees.all()`을 사용한다. 이 예시는 SQL 문자열을 직접 만들지 않고도 database object를 Python code에서 다룰 수 있음을 보여 준다.

Django의 `migrate` 도구는 model 정의에서 database relation을 생성한다. model version이 바뀌면 기존 schema에서 새 schema로 데이터를 옮기는 SQL migration code도 생성할 수 있다. 반대로 기존 database schema에서 Django model을 만드는 것도 가능하다.

### 9.7 Application Performance

큰 웹 사이트는 전 세계 사용자가 초당 수천 개 이상의 요청을 보낼 수 있다. 응답 시간을 낮게 유지하려면 개별 request 처리 비용을 줄이고, 여러 서버가 병렬로 요청을 나눠 처리하게 해야 한다. 데이터베이스 애플리케이션 성능 튜닝은 Chapter 25와도 연결된다.

#### 9.7.1 Reducing Overhead by Caching

매 요청마다 새 JDBC connection을 만들면 수 ms 수준의 overhead가 반복된다. 초당 수천 요청을 처리해야 하는 환경에서는 이 비용이 병목이 된다.

`connection pooling`은 열린 ODBC/JDBC connection의 pool을 미리 유지한다. servlet 같은 request handler는 새 connection을 열지 않고 pool에서 connection을 빌려 쓰고, 처리가 끝나면 close를 통해 실제 연결을 끊는 대신 pool에 반환한다. pool에 빈 connection이 없으면 새 connection을 열 수 있지만, database가 동시에 지원하는 최대 connection 수를 넘지 않도록 관리해야 한다. 오래 쓰이지 않은 connection은 pool manager가 닫을 수 있다.

JDBC에서는 보통 database machine, port, database name, user-id, password, pooling parameter를 사용해 `DataSource` object를 만들고, `getConnection()`으로 pool의 connection을 얻는다. 코드가 connection을 close하면 pool로 반환된다.

Caching은 같은 계산이나 query를 반복하지 않게 하는 기법이다.

| Cache 대상 | 절감되는 비용 | 조건/주의점 |
|---|---|---|
| `query-result cache` | database 통신과 query execution 비용 | underlying data가 바뀌면 discard/recompute/incremental update 필요 |
| `web page cache` | HTML 생성 비용 | 같은 parameter, update 없는 request, cache hit일 때만 재사용 가능 |
| `fragment cache` | page 일부 생성 비용 | fragment를 조합해 complete page 생성 |
| `connection pool` | connection 생성 비용 | connection 수 상한과 유휴 connection 정리 필요 |

Cached query result와 cached web page는 materialized view의 한 형태로 볼 수 있다. underlying database data가 바뀌면 cache를 버리거나 다시 계산하거나 incremental update해야 한다. 일부 DBMS는 application server가 query를 등록해 두면 결과가 바뀔 때 notification을 보내는 기능을 제공하며, 이를 이용해 application-side cache의 최신성을 유지할 수 있다.

memcached와 Redis는 널리 쓰이는 main-memory caching system이다. 둘 다 key에 data를 저장하고 key로 가져오는 hash-map 같은 구조를 제공하며, 잘 쓰이지 않는 data를 eviction할 수 있다. 예를 들어 relation `r`에서 key `key1`의 user data를 찾을 때 application은 먼저 `fetch("r:"+key1)`을 호출하고, cache miss이면 database query를 실행한 뒤 결과를 `memcached.add(key, data)`로 저장한다.

memcached client는 여러 machine의 memcached instance에 연결할 수 있고, 어떤 key를 어느 instance에 저장할지는 client code가 결정한다. 이렇게 data를 여러 machine에 partition하면 전체 main memory 용량을 합쳐 사용할 수 있다. 다만 memcached는 cached data의 automatic invalidation을 지원하지 않으므로, application이 database update를 추적해 `memcached set(key, newvalue)` 또는 `memcached delete(key)`를 호출해야 한다. Redis도 유사한 기능을 제공하며 여러 언어 API를 제공한다.

#### 9.7.2 Parallel Processing

매우 큰 부하를 처리하는 일반적인 방법은 여러 application server를 병렬로 두고 각 서버가 요청 일부를 처리하게 하는 것이다. web server나 network router가 client request를 여러 application server 중 하나로 라우팅한다.

주의할 점은 session state다. 특정 client session의 모든 request가 같은 application server로 가야 서버가 유지하는 session state를 올바르게 사용할 수 있다. 예를 들어 같은 IP address에서 온 요청을 같은 server로 보내는 방식이 가능하다. underlying database는 모든 application server가 공유하므로, 사용자는 일관된 database view를 보게 된다.

이 구조는 application server 병목을 줄이지만 database server가 단일 병목이 되는 문제까지 없애지는 못한다. 그래서 caching으로 database 요청 수를 줄이고, 필요하면 Chapter 21-23의 parallel database system을 사용한다. 매우 큰 사용자 수를 대상으로 하는 애플리케이션은 web service API로 접근 가능한 parallel data storage system도 활용한다.

### 9.8 Application Security

application security는 SQL authorization만으로 해결되지 않는다. 데이터베이스가 안전하더라도 application code가 잘못 작성되면 인증(authentication), 권한 검사(authorization), 세션 관리, 입력 처리의 허점을 통해 공격자가 우회할 수 있다. 특히 웹 애플리케이션은 사용자가 보내는 모든 값이 조작 가능하다고 가정해야 한다.

#### 9.8.1 SQL Injection

SQL injection은 공격자가 애플리케이션이 실행할 SQL query를 자기 뜻대로 만들게 하는 공격이다. 위험한 패턴은 사용자 입력을 SQL 문자열에 그대로 이어 붙이는 것이다.

```java
String query = "select * from student where name like '%"
             + name + "%'";
```

공격자가 `name`에 `'; <some SQL statement>; --` 같은 값을 넣으면 query 문자열은 다음과 같은 형태가 된다.

```sql
select * from student where name like '%'; <some SQL statement>; -- %'
```

공격자가 넣은 quote가 문자열을 닫고, semicolon이 원래 query를 끝내며, 이후 내용은 별도 SQL statement로 실행된다. 뒤쪽 quote는 comment 처리되어 문법 오류를 피한다. 이렇게 되면 application code의 인증·권한 검사와 무관하게 database에 직접 피해를 줄 수 있다.

가장 좋은 방어는 prepared statement를 사용하는 것이다. parameterized query에서 사용자 입력은 SQL code가 아니라 parameter value로 전달되므로, quote가 문자열을 종료시키는 문법 요소로 해석되지 않는다. JDBC는 parameter 설정 시 필요한 escape 처리를 수행한다. prepared statement를 쓰지 않는 경우에도 입력 문자열에 escape character를 추가하는 함수를 적용해야 하지만, 가능하면 query와 parameter를 구조적으로 분리하는 편이 안전하다.

동적으로 order 조건이나 selection 조건을 만드는 경우도 위험하다.

```java
String query = "select * from takes order by " + orderAttribute;
```

HTML form에서 menu로 선택지를 제한해도 공격자는 HTTP request를 직접 조작할 수 있다. `orderAttribute`처럼 SQL syntax의 일부가 되는 값은 allowed list에 있는 attribute name인지 서버에서 반드시 확인한 뒤 이어 붙여야 한다.

#### 9.8.2 Cross-Site Scripting and Request Forgery

Cross-Site Scripting(XSS)은 사용자가 입력한 comment, name 같은 텍스트가 나중에 다른 사용자에게 표시될 때, 그 안에 들어간 JavaScript/Flash 같은 client-side script가 실행되는 공격이다. 악성 script는 cookie 정보를 공격자에게 보내거나, 사용자가 로그인해 둔 다른 사이트에 요청을 보낼 수 있다.

Cross-Site Request Forgery(XSRF 또는 CSRF)는 사용자가 의도하지 않은 요청을 사용자의 인증 상태로 보내게 하는 공격이다. 예를 들어 어떤 은행 사이트가 GET 요청으로 송금을 수행한다면, 악성 페이지의 이미지 태그 하나만으로도 요청이 발생할 수 있다.

```html
&lt;img src="https://mybank.com/transfermoney?amount=1000&toaccount=14523"&gt;
```

방어는 두 방향에서 필요하다.

| 목표 | 방어 |
|---|---|
| 내 사이트가 XSS/XSRF 발사대가 되지 않게 하기 | 사용자 입력에서 HTML tag를 금지하거나, 허용 가능한 제한된 HTML만 careful parsing 후 저장/표시 |
| 다른 사이트에서 온 XSS/XSRF로부터 내 사이트 보호 | `referer` 검사, session을 원래 IP address에 제한, update에는 GET method 금지, framework의 CSRF protection 사용 |

중요한 규칙은 "GET method는 update를 수행하지 않아야 한다"는 것이다. HTTP standard도 GET을 안전한 조회 성격으로 가정한다. update에는 POST 같은 method를 쓰고, Django 같은 framework가 제공하는 XSRF/CSRF protection token을 사용해야 한다.

#### 9.8.3 Password Leakage

JSP script나 application code에 database password를 clear text로 넣어 두면, source file이 web server를 통해 노출되는 순간 database account까지 노출된다. 많은 application server는 password를 encrypted form으로 저장하고, database 연결 직전에 server가 decrypt하는 기능을 제공한다. 하지만 decryption key까지 노출되면 효과가 제한된다.

추가 방어로 database 접속을 application server machine의 internet address로 제한할 수 있다. 이렇게 하면 password가 유출되어도 공격자가 application server에 로그인하지 못하는 한 database에 직접 접속하기 어렵다.

#### 9.8.4 Application-Level Authentication

Authentication은 애플리케이션에 접속하는 사람이나 software의 identity를 확인하는 작업이다. 가장 단순한 방식은 password지만, password는 추측, 재사용, packet sniffing, 악성코드에 취약하다. 중요한 애플리케이션에서는 더 강한 방식이 필요하고, encryption이 그 기반이 된다.

`two-factor authentication`은 서로 독립적인 두 factor를 사용한다. 단순히 password 두 개를 요구하는 것은 두 factor가 같은 취약점, 예를 들어 network sniffing이나 사용자 PC의 virus에 함께 노출될 수 있어 약하다.

| Second factor | 동작 방식 | 주의점 |
|---|---|---|
| smart card / encryption device | USB 등으로 연결된 장치가 encryption 기반 인증 수행 | private key가 장치 밖으로 노출되지 않는 구조가 중요 |
| one-time password device | 매분 pseudo-random number를 생성하고 server가 같은 sequence로 검증 | device clock과 server clock의 동기화 필요 |
| SMS one-time password | 등록된 전화번호로 random OTP를 보내고 password와 함께 입력 | 사용자가 해당 phone number를 소유해야 함 |

two-factor authentication도 man-in-the-middle attack을 완전히 막지는 못한다. 사용자가 가짜 사이트에 접속해 password와 second factor를 입력하면, 공격자는 그 값을 즉시 진짜 사이트에 전달해 로그인할 수 있다. HTTPS는 사이트가 진짜인지 인증하고 통신을 암호화해 이런 공격을 막는 데 사용된다.

여러 application에서 각각 로그인하는 불편을 줄이기 위해 central authentication과 single sign-on(SSO)이 쓰인다. LDAP는 조직 내부에서 user name/password와 사용자 정보를 중앙 서버에 두고 application이 이를 통해 인증하는 데 널리 사용된다. Kerberos는 네트워크 인증에서 오래 쓰인 SSO 방식이다.

SAML(Security Assertion Markup Language)은 서로 다른 security domain 사이에서 authentication과 authorization 정보를 교환해 cross-organization SSO를 제공한다. 예를 들어 외부 application이 `joe@yale.edu` 사용자를 직접 인증하지 않고 Yale의 authentication service로 보내면, Yale이 인증한 뒤 사용자 category 같은 정보를 application에 전달할 수 있다. 사용자의 password는 application에 공개되지 않는다. OpenID도 조직 간 single sign-on에 쓰이고, OAuth는 authorization token을 공유해 특정 resource 접근을 허가하는 protocol이다.

#### 9.8.5 Application-Level Authorization

SQL standard의 role 기반 authorization은 relation, view, attribute 수준에는 유용하지만, 많은 웹 애플리케이션의 end user 권한을 표현하기에는 부족하다. 대표 예는 "학생은 자기 성적만 볼 수 있다"는 요구다.

문제는 두 가지다.

| 한계 | 설명 |
|---|---|
| lack of end-user information | database에는 application server 하나의 DB user만 보이고, 실제 학생 ID는 application layer에만 있을 수 있음 |
| lack of fine-grained authorization | SQL standard authorization은 tuple-level 조건을 직접 표현하기 어렵고, relation/view/attribute 중심임 |

학생마다 `takes` relation의 자기 tuple만 보이는 view를 만들 수는 있지만, 학생 수만큼 view를 만들면 비현실적이다. 대신 `syscontext.user_id()` 같은 application user identifier를 query에서 참조하는 view를 만들 수도 있다.

```sql
create view studentTakes as
select *
from takes
where takes.ID = syscontext.user_id()
```

그러나 student용 query는 `studentTakes` view에, instructor용 query는 다른 view에 작성해야 하므로 application code가 복잡해진다. 그래서 실제 애플리케이션은 권한 검사를 application layer에서 직접 수행하는 경우가 많다.

application-level authorization은 유연하지만 위험도 크다. authorization check code가 application logic과 뒤섞이고, 어떤 interface 하나가 검사를 빼먹으면 confidential data가 노출될 수 있다. 애플리케이션의 surface area가 넓기 때문에 모든 code path가 올바른 권한 검사를 수행하는지 검증하기 어렵다.

row-level authorization은 이 문제를 database 쪽에서 줄이려는 접근이다. Oracle Virtual Private Database(VPD)는 relation에 function을 연결해, 그 relation을 사용하는 query마다 predicate를 자동으로 추가한다. 예를 들어 `takes` relation에 `ID = syscontext.user_id()` predicate를 붙이면 학생은 자기 ID에 해당하는 tuple만 보게 된다. PostgreSQL과 Microsoft SQL Server도 유사한 row-level authorization 기능을 제공한다.

주의할 점은 predicate 자동 추가가 query 의미를 바꿀 수 있다는 것이다. 사용자가 전체 course의 평균 grade를 구한다고 생각했지만, predicate가 붙어 자기 grade 평균만 계산될 수 있다. 보안상 "맞는" 결과와 사용자가 의도한 질의 의미가 다를 수 있다.

#### 9.8.6 Audit Trails

audit trail은 application data에 대한 insert, delete, update와 함께 누가, 언제 변경했는지를 기록한 log다. 보안 침해나 실수로 잘못된 update가 발생했을 때, audit trail은 무엇이 일어났는지 추적하고 피해를 복구하는 데 도움을 준다.

예를 들어 학생 grade가 잘못되어 있으면 audit log를 확인해 언제 어떤 user가 grade를 바꿨는지 찾고, 같은 user가 수행한 다른 update도 추적할 수 있다. 사용자가 로그인할 때 최근 자기 계정으로 수행된 update 목록을 보여 주면, 계정 탈취 여부를 사용자가 발견할 수도 있다.

Database-level audit trail은 trigger나 DBMS 내장 기능으로 만들 수 있다. 하지만 application end user가 누구였는지 알기 어렵고, 기록이 relation tuple update 같은 낮은 수준에 머문다. 따라서 애플리케이션은 보통 "어떤 business action이, 누구에 의해, 언제, 어느 IP address에서 수행되었는지"를 기록하는 higher-level audit trail을 별도로 만든다.

audit trail 자체도 보호해야 한다. 침입자가 log를 수정하거나 삭제하면 추적이 무력화된다. 한 방법은 log record가 생길 때마다 침입자가 접근할 수 없는 다른 machine으로 복사하는 것이다. 더 강한 방식으로는 Chapter 26의 blockchain techniques처럼 여러 machine에 log를 저장하고 hashing mechanism으로 변조를 어렵게 만드는 방법이 있다.

#### 9.8.7 Privacy

privacy는 보안과 겹치지만 초점이 다르다. 보안이 허가되지 않은 접근을 막는 문제라면, privacy는 허가된 목적과 범위 안에서만 개인 데이터를 사용하게 하는 문제다. 의료 데이터는 의사와 응급 의료진에게는 필요하지만 공개되어서는 안 되며, 많은 국가에서는 이런 데이터 공개 범위를 법으로 정한다.

집계된 private data는 약물 부작용 탐지, 전염병 확산 탐지 같은 연구에 매우 중요하다. 하지만 이름을 지워도 date of birth와 postal code만으로 외부 데이터와 결합해 개인을 식별할 수 있다. 그래서 생년월일 대신 출생 연도만 제공하거나, 매우 고령자는 `90 years or older`처럼 범위를 제공하는 식으로 재식별 위험을 줄인다.

웹 사이트가 주소, 전화번호, email, credit-card information을 수집할 때도 privacy preference를 지켜야 한다. 예를 들어 거래가 끝난 뒤 credit-card number를 일정 기간 후 삭제하길 원하는 고객이 있을 수 있다. 애플리케이션은 이런 선호를 단순 약속이 아니라 실제 데이터 보존·삭제 정책으로 구현해야 한다.

### 9.9 Encryption and Its Applications

Encryption은 데이터를 읽을 수 없는 형태로 바꾸는 과정이고, decryption은 이를 원래 데이터로 되돌리는 과정이다. encryption algorithm은 encryption key를 사용하고, decryption에는 decryption key가 필요하다. 두 key가 같을 수도 있고 다를 수도 있다.

데이터베이스 맥락에서 encryption은 저장된 sensitive data를 보호한다. laptop이나 backup tape가 도난당해도 decryption key 없이는 데이터를 읽을 수 없게 하는 것이 목표다. credit-card number, fingerprint, signature, identification number 같은 정보가 유출되면 identity theft로 이어질 수 있으므로, 여러 국가와 주에서는 이런 민감 정보를 encrypted form으로 저장하도록 요구한다.

#### 9.9.1 Encryption Techniques

좋은 encryption technique은 algorithm 자체의 비밀성에 의존하지 않고 key의 비밀성에 의존한다. 공격자가 encrypted data를 보더라도 decryption key를 알아내기 극도로 어려워야 한다.

| 방식 | key 구조 | 특징 |
|---|---|---|
| `symmetric-key encryption` | encryption key와 decryption key가 같음 | 빠르지만 key를 안전하게 공유해야 함 |
| `public-key encryption` / `asymmetric-key encryption` | public key와 private key가 다름 | public key는 공개, private key는 소유자만 보관 |

Advanced Encryption Standard(AES)는 널리 쓰이는 symmetric-key encryption algorithm이다. 128-bit block 단위로 동작하고 key 길이는 128, 192, 256 bits일 수 있다. AES는 encryption key에서 round key를 만들고 여러 단계의 bit scrambling과 XOR를 수행한다. 이전 표준인 Data Encryption Standard(DES)는 과거에 널리 쓰였지만 더 오래된 방식이다.

symmetric-key 방식의 약점은 authorized user에게 key를 안전하게 전달해야 한다는 점이다. key 전달 mechanism이 약하면 encryption 자체도 약해진다.

public-key encryption은 각 사용자 `Ui`가 public key `Ei`와 private key `Di`를 가진다. public key는 공개되고 private key는 해당 사용자만 안다. `U1`이 `U2`에게 비밀 데이터를 보내려면 `U2`의 public key `E2`로 encrypt한다. decrypt는 `U2`의 private key `D2`로만 가능하다.

public-key encryption의 고전적 근거는 큰 수의 prime factorization이 어렵다는 점이다. public key는 두 큰 prime number `P1`, `P2`의 곱 `P1P2`로 만들고, private key는 `P1`, `P2` 자체다. 곱만 보고 두 prime factor를 찾는 효율적 알고리즘이 알려져 있지 않기 때문에, 충분히 큰 prime을 쓰면 private key를 추론하기 어렵다.

public-key encryption은 안전하지만 계산 비용이 크다. 그래서 실제 secure communication에서는 보통 hybrid scheme을 쓴다. 먼저 public-key encryption으로 무작위 symmetric key를 안전하게 교환하고, 이후 데이터 전송은 AES 같은 symmetric-key encryption으로 처리한다.

작은 값에는 dictionary attack 위험이 있다. date of birth처럼 가능한 값 범위가 작으면 공격자가 가능한 모든 값을 encrypt해 보고 encrypted value와 비교할 수 있다. age나 address처럼 분포가 치우친 데이터도 통계적으로 추론될 수 있다. 이를 막기 위해 encryption 전에 random bits를 덧붙인다. AES 문맥에서는 initialization vector, 다른 문맥에서는 salt bits라고 부르는 extra bits가 dictionary attack을 어렵게 한다.

#### 9.9.2 Encryption Support in Databases

database encryption은 여러 수준에서 적용될 수 있다.

| 수준 | 설명 | 장점/제약 |
|---|---|---|
| disk-block-level encryption | database data가 담긴 disk block을 암호화하고 읽을 때 decrypt | disk나 backup 탈취 방어에 유용, application 수정 적음 |
| attribute-level encryption | relation의 특정 attribute 또는 전체 relation을 encrypted form으로 저장 | sensitive attribute만 보호해 overhead를 줄일 수 있음 |
| application-side encryption | application이 DB로 보내기 전에 encrypt하고 가져온 뒤 decrypt | DB 밖에서도 보호 가능하지만 application 수정 비용 큼 |

attribute-level encryption에서는 attribute마다 다른 key를 사용할 수 있다. 여러 decryption key는 file이나 relation에 저장될 수 있는데, 이 저장소를 흔히 `wallet`이라고 부르며 master key로 다시 암호화한다. encrypted attribute에 접근하는 database connection은 master key를 제공해야 한다.

database-level encryption의 장점은 time/space overhead가 비교적 낮고 application 수정이 거의 없다는 점이다. laptop DB나 backup tape 보호처럼 저장 매체 탈취에 대한 방어에 특히 적합하다.

제약도 있다. encrypted attribute는 dictionary attack을 막기 위해 random bits를 사용해야 하고, 많은 DBMS는 primary key와 foreign key attribute encryption을 허용하지 않으며 encrypted attribute에 대한 indexing도 지원하지 않는다. 값이 암호화되면 순서 비교나 equality lookup을 일반 index처럼 처리하기 어렵기 때문이다.

#### 9.9.3 Encryption and Authentication

password-based authentication은 네트워크에서 password가 sniffing될 수 있다는 약점이 있다. challenge-response system은 password 자체를 보내지 않는다. database system이 challenge string을 보내면 사용자는 secret password를 encryption key로 challenge를 encrypt해 반환하고, database system은 같은 secret으로 확인한다.

public-key 기반 challenge-response도 가능하다. database system이 사용자의 public key로 challenge string을 encrypt해 보내고, 사용자는 private key로 decrypt해 결과를 반환한다. 이 방식은 database가 secret password를 저장하지 않아도 되므로, system administrator에게 password가 노출될 위험을 줄인다.

private key를 일반 컴퓨터에 저장하면 컴퓨터가 compromise될 때 key가 노출될 수 있다. smart card는 embedded chip 안에 key를 저장하고 key 자체는 읽을 수 없게 하며, 카드에 데이터를 보내 encryption/decryption만 수행하게 한다.

##### 9.9.3.1 Digital Signatures

Digital signature는 public-key encryption을 이용해 데이터의 authenticity를 검증하는 방법이다. 일반 encryption과 역할이 뒤집혀 private key로 sign, 즉 encrypt하고, 누구나 public key로 decrypt해 signature를 검증한다. private key를 가진 사람만 만들 수 있으므로 해당 사람이 데이터를 만들었다는 증거가 된다.

Digital signature는 nonrepudiation도 제공한다. 데이터를 만든 사람이 나중에 "내가 만든 것이 아니다"라고 주장해도, private key가 유출되지 않았다는 전제 아래 그 사람이 생성했다는 것을 증명할 수 있다.

##### 9.9.3.2 Digital Certificates

인증은 양방향 과정이다. 사용자가 web site에 로그인할 때도 사용자가 사이트를 인증해야 한다. 그렇지 않으면 malicious site가 합법 사이트인 척하고 password를 받아낼 수 있다.

문제는 사용자가 진짜 site의 public key를 어떻게 신뢰하느냐다. digital certificate는 public key를 certification authority(CA)가 sign한 구조다. root certification authority의 public key는 표준 web browser에 저장되어 있고, browser는 이 key로 certificate chain을 검증한다.

Digital certificate는 certificate를 발급받은 party의 이름과 public key를 포함하고, 발급 authority의 private key로 sign된다. 중간 CA가 있으면 certificate 안에는 그 CA의 certificate도 포함되어 root authority까지 recursively 검증된다. 이 과정을 통해 특정 web site의 이름과 authenticated public key가 연결된다.

HTTPS는 HTTP의 secure version으로, site가 browser에 digital certificate를 제공한다. 사용자가 certificate를 받아들이면 browser는 certificate의 public key를 사용해 데이터를 encrypt한다. 악성 사이트가 certificate 파일을 복사할 수는 있어도 private key가 없으면 browser가 보낸 데이터를 decrypt할 수 없다. public/private-key 연산은 비싸기 때문에 HTTPS는 인증 후 one-time symmetric key를 만들고, 나머지 session 데이터는 symmetric-key encryption으로 암호화한다.

Digital certificate는 사용자 인증에도 사용될 수 있다. 사용자가 자기 public key가 담긴 certificate를 site에 제출하면, site는 trusted authority의 signature를 검증하고 challenge-response를 통해 사용자가 해당 private key를 실제로 소유하고 있는지 확인한다.

### 9.10 Summary

Chapter 9는 database-backed application을 단순 SQL 실행 프로그램이 아니라, UI, application server, web service, business logic, data-access layer, security, encryption이 결합된 시스템으로 본다. 핵심 흐름은 다음과 같다.

| 영역 | 핵심 |
|---|---|
| interface | HTML form, JavaScript, Ajax, mobile app, PWA로 사용자 입력과 화면 반응을 구성 |
| server execution | CGI보다 servlet/application server/server-side framework가 connection과 process overhead를 줄임 |
| architecture | presentation, controller, model/business logic, data-access layer, ORM으로 책임을 분리 |
| performance | connection pooling, query-result caching, web page caching, memcached/Redis, parallel application server 사용 |
| security | SQL injection, XSS, CSRF, password leakage, authentication, authorization, audit trail, privacy를 application level에서 다룸 |
| encryption | AES, public-key encryption, challenge-response, digital signature, digital certificate, HTTPS로 저장 데이터와 통신·인증 보호 |

## 연결 관계

- Chapter 1의 database architecture와 three-tier architecture가 Chapter 9에서 web/browser, application server, database server 구조로 구체화된다.
- Chapter 3-5의 SQL 지식은 servlet, JSP, Django, ORM 뒤쪽에서 실제 query 실행으로 사용된다. 특히 prepared statement와 parameterized query는 SQL injection 방어의 핵심이다.
- Chapter 4의 SQL authorization은 application-level authorization과 대비된다. SQL role은 coarse-grained이고, 웹 애플리케이션의 tuple-level end-user 권한은 application layer나 row-level authorization이 필요하다.
- Chapter 6-8의 data model 지식은 ORM에서 다시 등장한다. E-R entity와 relationship은 object class와 object reference/set으로 mapping된다.
- Chapter 16의 materialized view maintenance는 query-result cache와 web page cache의 invalidation/recompute 문제와 연결된다.
- Chapter 21-23의 parallel database system은 application server 병렬화 이후 database bottleneck을 해결하는 다음 단계다.
- Chapter 25의 tuning과 authentication infrastructure, Chapter 26의 blockchain techniques는 성능, audit trail 보호, 보안 운영으로 이어진다.

## 오해하기 쉬운 내용

- client-side validation은 편의 기능이지 보안 경계가 아니다. 모든 중요한 검증은 server-side validation으로 반복해야 한다.
- HTML form의 hidden field, dropdown menu, disabled input은 공격자가 수정할 수 있다. 서버는 form이 보낸 값을 신뢰하면 안 된다.
- `GET`은 조회에 써야 하며 update를 수행하면 CSRF/XSRF 공격 표면이 커진다.
- cookie는 session state를 직접 모두 담는 저장소라기보다 보통 session id를 담는 식별자다. 실제 session data는 server side에 둘 수 있다.
- ORM은 SQL을 몰라도 되게 하는 마법이 아니다. 복잡한 query, 성능, transaction, mapping 결과를 이해해야 하며 때로는 direct SQL이 더 적절하다.
- connection pooling의 `close()`는 물리적 연결 종료가 아니라 pool 반환일 수 있다.
- cache는 빠르지만 stale data 문제가 생긴다. query-result cache와 web page cache는 materialized view처럼 invalidation 정책이 필요하다.
- two-factor authentication은 stolen password 위험을 줄이지만 man-in-the-middle attack을 자동으로 막지는 못한다. HTTPS와 site authentication이 함께 필요하다.
- database encryption은 disk/backup 탈취에는 강하지만, 권한 있는 connection이 master key를 제공한 뒤 실행하는 부적절한 query까지 막아 주지는 않는다.
- public-key encryption은 보통 모든 데이터를 직접 암호화하는 데 쓰기보다, symmetric key 교환과 digital signature/certificate에 핵심적으로 쓰인다.

## 면접 질문

1. CGI보다 servlet이 성능상 유리한 이유는 무엇인가?
2. HTTP가 connectionless protocol이기 때문에 session과 cookie가 필요한 이유를 설명하라.
3. `GET`과 `POST`를 HTML form 처리와 security 관점에서 비교하라.
4. SQL injection이 문자열 결합에서 어떻게 발생하며, prepared statement가 왜 방어가 되는가?
5. XSS와 CSRF/XSRF의 차이를 예시와 함께 설명하라.
6. MVC에서 model, view, controller가 각각 어떤 책임을 가지며, business-logic layer와 어떻게 연결되는가?
7. ORM이 해결하는 object-relational impedance mismatch는 무엇이며, ORM 사용의 trade-off는 무엇인가?
8. connection pooling, query-result caching, web page caching의 차이를 설명하라.
9. application-level authorization이 SQL authorization보다 필요한 경우와 그 위험을 설명하라.
10. audit trail을 database-level과 application-level로 만들 때 각각 무엇을 놓칠 수 있는가?
11. symmetric-key encryption과 public-key encryption의 차이와 실제 HTTPS에서 둘을 함께 쓰는 이유를 설명하라.
12. digital signature와 digital certificate가 각각 무엇을 인증하는지 설명하라.
