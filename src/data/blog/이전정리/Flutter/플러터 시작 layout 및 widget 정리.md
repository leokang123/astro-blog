---
title: "플러터 시작 layout 및 widget 정리"
pubDatetime: 2025-06-10T22:04:00+09:00
modDatetime: 2025-06-11T00:00:23+09:00
description: "Flutter의 UI를 구성하는 모든 요소는 위젯(Widget)이다"
tags:
  - "일반"
  - "Flutter"
banner: "@/assets/images/cavemansitting.jpg"
---

# 플러터 시작 Layout 및 Widget 정리

#Flutter

Flutter의 UI를 구성하는 모든 요소는 위젯(Widget)이다

- **Stateless** Widget: 상태가 변하지 않는 위젯 (단순 텍스트)
- **Stateful** Widget: 상태가 변하는 위젯 (버튼이나 입력 필드)

**레이아웃(Layout)** 또한 위젯의 한 종류인데 Column, Stack, Row, Container, Padding 등 위젯들을 어떻게 정렬하고 배치할지를 결정하는 위젯이다.

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(const MyApp());
}

// stateful -> can refresh
// stateless -> can't refresh
// setstate

String? title = 'Flutter Mapp';

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: Colors.teal,
          brightness: Brightness.dark,
        ),
      ),
      home: MyHomePage(),
    );
  }
}

class MyHomePage extends StatefulWidget {
  const MyHomePage({super.key});

  @override
  State<MyHomePage> createState() => _MyHomePageState();
}

class _MyHomePageState extends State<MyHomePage> {
  int currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title ?? "기본값"), centerTitle: true),
      body: currentIndex == 0
          ? Center(child: Text('1'))
          : Center(child: Text('2')),
      bottomNavigationBar: NavigationBar(
        destinations: [
          NavigationDestination(icon: Icon(Icons.home), label: 'Home'),
          NavigationDestination(icon: Icon(Icons.person), label: 'Profile'),
        ],
        onDestinationSelected: (int value) {
          setState(() {
            currentIndex = value;
          });
        },
        selectedIndex: currentIndex,
      ),
    );
  }
}
```

Kotlin으로 안드로이드 개발을 좀 하다가 Flutter로 오니까 Kotlin도 나름 체계적이고, 이해하기 쉬웠지만 Flutter는 더욱 더 직관적이라는 느낌을 받았다.

Drawer 같은경우도 그냥 Scaffold에서 Drawer 위젯과 DrawerHeader 위젯으로 쉽게 구현할수 있었고, FloatingActionButton 또한 코틀린에서 개발할때는 모종의 이유로 제한되었었는데 여기서는 너무나도 쉽게 활용 가능했다.

**stateful widget에서 선언하는 변수는 모두 상태변수**로 관리되고 Kotlin과 다른점은 상태변수가 수정된다 해서 자동으로 리빌드를 하는것이 아니고 **setState 함수를 사용해야지만 stateful 위젯을 리빌드** 한다.

그러면 너무 비효율 아니냐 할수있는데, 내부적으로 바뀌지 않은 내용은 일종의 캐싱을 통해 수정된 부분에 대해서만 리빌드되는 식으로 효율적으로 가능하다고 한다

_다시 빌드하는 문제로 Stateful 위젯은 작게 나눌수록 좋다고 한다_

---

그리고 또 든 의문은 그러면 **매번 api호출을 화면 component에서 해야하는거 아니야??** 인데
이 말은 어느정도 맞는 말인듯 하다. **try catch도 stateful 위젯**에서 해야한다. 그러면 데이터타입이 api마다 다를텐데 이거 화면마다 맞추어주는것도 너무나도 어려운 일이라서 찾아보니

**Riverpod**이라는 라이브러리를 통해 flutter 또한 **MVVM** 방식으로 repository를 따로 두어 개발할 수 있다고 한다.

### 디렉토리 구조

![Pasted image 20250610234830](@/assets/images/pasted-image-20250610234830.png)

#### Notifiers

data는 **ValueNotifier**라고 React의 상태관리와 매우 비슷한 역할을 한다. 페이지 끼리 공유하는 상태변수를 만드는 것이다.

```dart
// ValueNotifier : hold the data
// ValueListenableBuilder : listen to the data (don't need the setstate)

import 'package:flutter/material.dart';

ValueNotifier<int> selectedPageNotifier = ValueNotifier(0);
ValueNotifier<bool> isDarkModeNotifier = ValueNotifier(true);
```

위와 같이 변수를 선언할수 있고, 사용시에는 아래와 같이 사용할수있다.

```dart
ValueListenableBuilder(
	valueListenable: valueListener,
	builder: (context, value, child) {
		// value가 상태관리되는 변수 값
		return // 위젯
	}
)
```

조심해야할점은 **ValueListenableBuilder**는 결국 Builder 이기 때문에 **Widget 단위로 return을 받아야한다**

예시

```dart
class _MyAppState extends State<MyApp> {

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder(valueListenable: isDarkModeNotifier, builder: (context, isDark, child) {
      return MaterialApp(
          debugShowCheckedModeBanner: false,
          theme: ThemeData(
            colorScheme: ColorScheme.fromSeed(
              seedColor: Colors.teal,
              brightness: isDark ? Brightness.dark : Brightness.light,
            ),
          ),
          home: WidgetTree()
      );
    },);
  }
}
```

isDark라는 전역으로 관리되는 상태변수 떄문에 MaterialApp이라는 **위젯 전부를 반환 받는 모습**

저 변수를 갱신하는건 매우 간단하다

```dart
 AppBar(
  title: Text('Flutter Mapp'),
  actions: [IconButton(onPressed: () {
    isDarkModeNotifier.value = !isDarkModeNotifier.value;
    },
    ...
  )
```

그냥 isDarkNotifier**.value** 의 값을 바꾸어주면 알아서 **ListenableBuilder가 리빌드**를 해준다. (이 경우 setState도 없어도 됨)

그리고 위에서 언급했다시피 **Stateful Widget은 쪼갤수록 리빌딩하는 효율이 올라**가기 때문에 pages 별, 개별 widgets별 디렉토리를 나누어주는 것이 **성능상 유리**하다

#### WidgetTree

**모든 화면들의 부모격인 화면**, Scaffold와 Appbar에 대한 선언이 이루어진다. 라우팅될 페이지들 또한

```dart
List<Widget> pages = [HomePage(), ProfilePage()];
```

위와 같이 선언되어 Scaffold의 body에 사용된다.

```dart
body: ValueListenableBuilder(
  valueListenable: selectedPageNotifier,
  builder: (context, selectedPage, child) {
    return pages.elementAt(selectedPage);
  },
),
```
