---
title: "옵시디언 css 설정"
pubDatetime: 2024-08-04T23:57:00+09:00
modDatetime: 2026-04-15T19:58:35+09:00
description: "옵시디언에서 원하는 기능이 있다면 CSS 를 찾아보자"
tags:
  - "일반"
  - "옵시디언"
---

# 옵시디언 Css 설정

#옵시디언

---

옵시디언에서 원하는 기능이 있다면 CSS 를 찾아보자

내가 보기엔 DataView 로 원하는대로 표현하는데에는 어느정도 제한이 있음

- 내 목적은 이 공간이 밋밋하지 않게만 하기 위함이기 때문
- 적절한 사진과 적절한 편의성만 갖추면 됨.

==적절한 CSS 를 찾아서 Snippets 에서 활성화 시켜주면 됨==

## 제목

- ### 리스트 1 #mcl/list-card
  ![univercity](@/assets/images/shared-univercity.jpg)
- ### 리스트 2
  내용 1
  내용 2
- ### 리스트 3

mcl/list-card 를 통해 이렇게 만들수 있다 (카드)

## List Grid Example - Goals and Objectives

- #### Core Work
  - [Main Goal 1](app://obsidian.md/00%20Home)
  - [Main Goal 2](app://obsidian.md/00%20Home)
  - [Main Goal 3](app://obsidian.md/00%20Home) - Collaboration with Jane
  - [Main Goal 4](app://obsidian.md/00%20Home)
- #### Learning & System
  - [Learning Goal 1](app://obsidian.md/00%20Home)
  - [Initiative 1](app://obsidian.md/00%20Home)
  - [Initiative 2](app://obsidian.md/00%20Home)
- #### Personal
  - [Personal Goal 1](app://obsidian.md/00%20Home)
  - [Personal Goal 2](app://obsidian.md/00%20Home)

mcl/list-grid 를 통해 이렇게 만들 수 있다

### 사진

> [!white|left-side]
> ![univercity](@/assets/images/shared-univercity.jpg)

**고양이**(cat) 는 [식육목](https://namu.wiki/w/%EC%8B%9D%EC%9C%A1%EB%AA%A9 '식육목') [고양이과](https://namu.wiki/w/%EA%B3%A0%EC%96%91%EC%9D%B4%EA%B3%BC '고양이과') 고양이속의 한 종 (*Felis catus*) 이다. 고양이의 신체적 특성과 습성은 다른 고양이과 동물들과 유사하게 빠른 반사신경, 탁월한 유연성, 날카로운 이빨, 넣고 꺼낼 수 있는 발톱 등이 있다.

매우 긴 수면 시간을 가지고 있어 하루 종일 자는 시간이 굉장히 많으나 기본적으로 야생에서는 포식자 동물이라는 특성상 박명박모성 ([薄](https://namu.wiki/w/%E8%96%84 '薄')[明](https://namu.wiki/w/%E6%98%8E '明') 薄 [暮](https://namu.wiki/w/%E6%9A%AE '暮')[性](https://namu.wiki/w/%E6%80%A7 '性')) 으로, 해 뜰 녘과 해 질 녘에 주로 행동한다. 또한 여타 고양잇과 동물들과 같이 고양이는 육식동물로, 야생에 사는 들고양이는 [쥐](https://namu.wiki/w/%EC%A5%90 '쥐'), [다람쥐](https://namu.wiki/w/%EB%8B%A4%EB%9E%8C%EC%A5%90 '다람쥐'), 작은 [새](https://namu.wiki/w/%EC%83%88 '새') 등을 사냥해 잡아먹는다.

[한국](https://namu.wiki/w/%EB%8C%80%ED%95%9C%EB%AF%BC%EA%B5%AD '대한민국') 에서는 사는 곳에 따라 [들고양이](https://namu.wiki/w/%EB%93%A4%EA%B3%A0%EC%96%91%EC%9D%B4 '들고양이'), [길고양이](https://namu.wiki/w/%EA%B8%B8%EA%B3%A0%EC%96%91%EC%9D%B4 '길고양이'), [집고양이](https://namu.wiki/w/%EC%A7%91%EA%B3%A0%EC%96%91%EC%9D%B4 '집고양이') 등으로 구분된다. 고양이는 19 세기 후반 이후 인간에 의해 품종이 개량 되어 다양한 [묘종](https://namu.wiki/w/%EB%AC%98%EC%A2%85 '묘종') 이 있으며, 품종 등록을 관장하는 국제고양이협회 (TICA) 는 71 개 묘종을 인정한다.

==[!callout|left-side] or [!callout|right-side] 로 위와같이 만들 수 있다==

---

<br><br><br>

# H1

## H2

### H3

#### H4

##### H5

###### H6

asdasd
`asda`
asdasd

> asdadsad
> asdasd

> **warning**
>
> asd
> asd

## MultiColumn 제목있는경우

> [!multi-column]
>
> ```ad-white
> title: 하얀색
> 내용1
> ~~~ js
> const a = 1;
> ~~~
> ```
>
> ```ad-cyan
> title:하늘색
> 내용2
> ```

## MultiColumn 제목 없는 경우

> [!multi-column]
>
> ```ad-white
> 내용1
> ```
>
> ```ad-cyan
> 내용2
> ```

## Multi-Column 으로 DataView 를 쓰는게 좋아보임

> [!multi-column]
>
> ```ad-blue
> ~~~ dataview
> TABLE WITHOUT ID
> link(file.path,file.name) AS "옵시디언",
> dateformat(file.mtime, "yyyy년 MM월 dd일- HH:mm") AS ""
> FROM #옵시디언 AND "Studied"
> SORT series ASC
> ~~~
> ```
>
> ```ad-white
> ~~~ dataview
> TABLE WITHOUT ID
> link(file.path,file.name) AS "학습정리",
> dateformat(file.mtime, "yyyy년 MM월 dd일- HH:mm") AS ""
> FROM #학습정리 AND "Studied"
> SORT series ASC
> ~~~
> ```

### 커스텀 CSS

대부분의 내 커스텀 CSS 는 wide-page.css 의 커스텀 부분에 전부 작성해 두었다.

이상이 생기면 거기서 하나씩 확인해보자
