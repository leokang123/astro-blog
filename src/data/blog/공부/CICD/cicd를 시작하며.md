---
title: "cicd를 시작하며"
order: 1
pubDatetime: 2026-05-28T15:52:36+09:00
modDatetime: 2026-05-28T16:50:38+09:00
description: "Continuous Integration, Continuous Delivery"
ogImage: "@/assets/images/2026-05-28-007.png"
tags:
  - general
---
최근에 CICD에 대해 이전에 진행한 '요엔' 이라는 여행 정산 앱 프로젝트를 가지고 다시 공부해보고 있다. ci 는 `Continuous Integration`의 뜻으로 지속적 통합이라는 뜻이다. 

모든 기업에서 cicd 경험을 우대하고, 중요시 여기는 이유가 뭘까? 하는 의문이 들었고, 이에 대해 직접 해보면서 겪어보면서 왜 중요한지 알아가려 한다. 

![2026-05-28-003](@/assets/images/2026-05-28-003.png)


### 왜 중요한가 

우선 CI 에 대한 셋업을 해보고 적용하면서 느낀 사실은 `협업을 하는 인원이 많으면 많아질 수록 이 효율이 압도적으로 올라갈 것`이다. 어쩌면 프로젝트의 일정량 이상을 cicd 구축에만 시간을 써도 될정도로 효율이 올라갈 수 있다는 생각을 하였는데, 그 이유는 개발 시스템이 휴먼에러로 인해 엇나가는 것을 미연에 방지할수 있다.

팀에서만 사용하는 코드 컨벤션이 있을수 있고, merge, rebase 방식이 있을 수 있다. 그리고 TDD기반 개발을 하는 팀이 있을 수도 있고, 엄격한 PR규칙을 적용하는 팀이 있을 수 있는데, 이 모든 제약 조건들을 CI를 통해 한번에 관리할 수 있고, 코드의 통일성을 부여할 수 있다. 따라서 개발자는 개발이외의 요소에 대한 신경을 덜 써도 되고, 더 자신의 도메인에 집중하여 작업을 할 수 있게 된다. 

우리 팀은 기존에 있던 Service 들에 대한 유닛테스트들을 작성하고, testDB를 통해 통합테스트까지 작성하여 ci에 대한 아주 기초적인 흐름을 잡았다. 

따라서 PR을 보내면, 유닛테스트, 통합테스트를 통과하고, 충돌이 없을시에 남은 인원의 리뷰 및 승인을 통해 main에 merge되게끔 흐름을 구성하였다.

![2026-05-28-001](@/assets/images/2026-05-28-001.png)

### CD 계획 


**초기 계획**


1. 현재 EC2 + Docker-Compose를 통해 서버를 배포한다. 
2. main merge 시 github action을 통해 서버 이미지를 빌드하여 GHCR에 push 한다. 
3. workflow_dispatch를 통해 수동으로 서버를 배포하게 한다.
4. 배포 workflow 작동시 ec2에 원격접속을 통해 ghcr 이미지를 pull하여 서버를 recreate한다.
5. .env나 google-service.json와 같은 파일들을 ec2서버에서 관리한다. 
6. workflow는 health check을 통해 통과 시에 완료됨으로 표시한다. 


**이후 계획**
1. 서버 배포 방식 blue-green 방식으로 변경
2. 서버 모니터링 방식 구축
3. staging 서버 구축하여 cd과정에서 workflow_dispatch 전 단계에 포함 


**추후 계획**
1. ECS/Fargate 방식으로 서버 배포를 변경
2. ECR에 이미지를 push 하고 pull하여 사용 
3. Code Deploy Blue-Green 사용 
