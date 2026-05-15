---
title: "Merge, Rebase"
pubDatetime: 2024-11-23T19:04:00+09:00
modDatetime: 2026-04-02T22:54:36+09:00
description: "지금 까지 Merge와 Rebase는 비슷한건줄 알고있었는데"
tags:
  - "일반"
  - "깃"
banner: "@/assets/images/woodfence.jpg"
---

# Merge, Rebase

#깃

지금 까지 Merge와 Rebase는 비슷한건줄 알고있었는데
아예 결이 다른 존재였다

merge는 두 브랜치를 병합한다 정도로 알고있었고, 그 때 커밋내용이 둘다 각각의 브랜치로 존재한다고 이해를 하고 있었다.

- *병합 커밋(Merge Commit)이 생성되어 히스토리가 분기된 흔적을 남는다*

### 잘못알고 있던 Rebase

그리고 rebase 또한 병합하긴 하는데. 커밋내용이 하나로 통일된다는 식으로 이해하고 있었는데 rebase에 대한 이해가 아예 틀렸다

### 제대로 알게된 Rebase

rebase는 그냥 커밋 히스토리의 선후관계를 rebase 시키려는 브랜치의 앞으로 재배치 시켜서 이후에 두 브랜치를 merge해도 충돌이 나지 않게 **선후관계를 바꿔주는 명령어**인것이다.

`````ad-multi-column
````ad-cyan
title:Original
```plaintext
main:    A --- B --- C
feature:         D --- E
```
````
````ad-blue
title: Merge
```plaintext
main:    A --- B --- C --- M
                  \       /
feature:           D --- E

```
````
````ad-orange
title: Rebase
```plaintext
main:    A --- B --- C
feature:               D' --- E'
```
````
`````

````ad-white
title: Rebase & Merge
```plaintext
main:    A --- B --- C --- D' --- E'
```
````

위 그림처럼 rebase는 그냥 선후관계를 조정해줄 뿐이다

따라서 내가 이해하고 있던 rebase를 실천하려면 rebase후 merge를 해줘야한다

#### **Rebase 후 Merge의 장점**

1. **히스토리 직선화**:
   - Rebase를 통해 작업 브랜치를 정리하면, 병합 후 히스토리가 직선형이 되어 분석과 디버깅이 더 쉬워집니다.
2. **충돌 최소화**:
   - Rebase를 통해 작업 브랜치와 기준 브랜치를 동기화한 후 병합하면, 충돌 가능성이 줄어듭니다.
