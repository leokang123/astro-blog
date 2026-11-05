---
title: "DispatcherServlet - 요청 처리 구조의 통합 "
order: 5
pubDatetime: 2026-11-05T14:27:48+09:00
modDatetime: 2026-11-05T14:44:19+09:00
description: ""
ogImage: "@/assets/images/2026-11-05-002.png"
tags:
  - general
---
## ① 기존 Servlet 방식의 문제
Spring MVC가 없다면 Servlet을 직접 작성해서 요청을 처리해야 해.

예를 들어 사용자 조회와 주문 조회 API를 구현한다고 해보자.
```java
@WebServlet("/users")
public class UserServlet extends HttpServlet {

    @Override
    protected void doGet(
        HttpServletRequest req,
        HttpServletResponse resp
    ) throws IOException {
        // 파라미터 추출
        // 사용자 조회
        // JSON 변환
        // HTTP 응답 작성
    }
}
```

```java
@WebServlet("/orders")
public class OrderServlet extends HttpServlet {

    @Override
    protected void doGet(
        HttpServletRequest req,
        HttpServletResponse resp
    ) throws IOException {
        // 파라미터 추출
        // 주문 조회
        // JSON 변환
        // HTTP 응답 작성
    }
}
```

문제는 API가 많아질수록 다음과 같은 공통 작업을 반복하기 쉽다는 거야.
- URL과 Servlet 연결
- 요청 파라미터 추출 및 타입 변환
- JSON 직렬화와 응답 작성
- 예외 처리와 HTTP 상태 코드 설정
결국 비즈니스 로직 외에도 HTTP 처리와 관련된 코드가 반복돼.
## ② DispatcherServlet을 도입한 구조

![2026-11-05-002](@/assets/images/2026-11-05-002.png)
Spring MVC에서는 공통 진입점인 DispatcherServlet이 요청을 받고, Spring MVC 구성 요소들과 협력해 적절한 Controller로 전달해.

```
@RestController
@RequestMapping("/users")
public class UserController {

    @GetMapping("/{id}")
    public UserDto getUser(@PathVariable Long id) {
        return userService.findById(id);
    }
}
```

개발자는 URL 매핑이나 파라미터 변환을 직접 구현하지 않고, 어노테이션으로 선언할 수 있어.

### ③ 실제 내부 동작

```
Client
   ↓
Tomcat
   ↓
DispatcherServlet
   │
   ├─ ① HandlerMapping
   │     → 어떤 Controller 메서드인가?
   │
   ├─ ② HandlerAdapter
   │     → 파라미터를 준비하고 메서드 호출
   │
   ├─ ③ Controller
   │     → 비즈니스 로직 수행
   │
   └─ ④ HttpMessageConverter
         → 객체를 JSON으로 변환
   ↓
HTTP Response
```

여기서 중요한 점은 DispatcherServlet 혼자 모든 일을 처리하는 게 아니라 요청 처리 흐름을 관리하고 각 컴포넌트에 작업을 위임한다는 거야.

또한 `@ResponseBody` 기반 JSON 응답에서는 `HttpMessageConverter`가 사용되고, 화면을 반환하는 MVC 방식에서는 `ViewResolver`와 View 렌더링 과정이 사용될 수 있어.

### DispatcherServlet의 핵심 이점

요청을 받는 구조와 실제 비즈니스 로직을 분리했다는 것이야.

새로운 API를 추가할 때 Servlet을 직접 작성하는 대신 Controller 메서드만 추가하면 Spring MVC가 공통 요청 처리 작업을 지원해.

### 내 질문 
```
근데 결국 100개의 서비스가 있으면 100개 servlet을 만든다거나 
100개의 controller를 만든다는 점에서는 똑같은거아니야? 

거기서 이제 연결과 종료만 자동화했다 말고 뭐가있지?

그리고 그건 AOP로도 자동화 가능한거아닌가?
```

## 결국 진짜 차이는 무엇인가?

| 비교          | Servlet 직접 사용            | Spring MVC                  |
| ----------- | ------------------------ | --------------------------- |
| 요청 처리 메서드 수 | 기능만큼 필요                  | 기능만큼 필요                     |
| URL과 메서드 연결 | Servlet 매핑 및 내부 분기 등을 작성 | `@GetMapping` 등 선언          |
| 요청 데이터 변환   | 직접 처리하거나 별도 구성           | ArgumentResolver, Converter |
| 응답 직렬화      | 직접 처리하거나 별도 구성           | HttpMessageConverter        |
| 공통 예외 처리    | 직접 구축                    | `@ControllerAdvice` 등 제공    |
| AOP 사용      | 별도 AOP 프레임워크 등을 구성 가능    | Spring AOP와 통합              |

따라서 핵심은 코드의 개수를 줄이는 게 아니라, HTTP 프로토콜을 다루는 코드와 비즈니스 코드를 분리한다는 것이야.

그리고 이 편의 기능의 상당수는 DispatcherServlet 혼자 제공하는 게 아니라 Spring MVC 전체의 역할이야.

## 5. 최종 정리

네 질문을 기준으로 보면 세 가지를 기억하면 돼.

첫째, DispatcherServlet이 등장했다고 Controller 개수나 비즈니스 로직의 양이 줄어드는 건 아니야.

둘째, Servlet에서도 공통 기능을 분리할 수 있고 AOP도 사용할 수 있어. Spring MVC가 제공하는 건 단순 중복 제거를 넘어 요청 매핑, 인자 해석, 검증, 응답 변환 등이 결합된 표준 처리 구조야.

셋째, AOP는 이미 호출 대상이 정해진 메서드의 실행을 가로채는 데 적합하고, DispatcherServlet은 HTTP 요청을 어떤 메서드로 보낼지 결정하는 앞단의 조정자야.

결론적으로 DispatcherServlet 자체가 마법 같은 기능을 제공한다기보다, DispatcherServlet을 중심으로 Spring MVC가 HTTP 요청 처리의 복잡성을 개발자로부터 감춰 주는 것이 가장 큰 가치라고 이해하면 돼.