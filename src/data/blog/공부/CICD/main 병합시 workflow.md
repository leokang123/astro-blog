---
title: "main 병합시 workflow"
order: 2
pubDatetime: 2026-05-28T17:40:29+09:00
modDatetime: 2026-06-16T15:07:08+09:00
description: ""
ogImage: "@/assets/images/2026-05-28-002.png"
tags:
  - general
  - cicd
---

PR이 `main` 브랜치에 병합되면 GitHub Actions의 `Docker Publish` workflow가 자동으로 실행된다.

이 workflow는 먼저 GitHub Actions runner에서 현재 `main` 브랜치의 코드를 checkout한다. 이후 Docker Buildx를 설정하고, GHCR에 로그인한다.

GHCR 로그인에는 별도의 Personal Access Token을 직접 만들지 않고, GitHub Actions가 자동으로 제공하는 `GITHUB_TOKEN`을 사용한다.

```yaml
permissions:
  contents: read
  packages: write
```
이 권한을 통해 workflow는 GitHub Container Registry에 image를 push할 수 있다.

로그인이 끝나면 Dockerfile을 기준으로 Docker image build를 시작한다.

우리 Dockerfile은 multi-stage build 구조이다.

첫 번째 stage에서는 JDK 이미지를 사용해서 Spring Boot 프로젝트를 빌드한다.

```
./gradlew clean bootJar --no-daemon
```

두 번째 stage에서는 실행에 필요한 JRE 이미지만 사용하고, 첫 번째 stage에서 생성된 jar 파일만 최종 image에 포함한다.

즉 최종 Docker image에는 소스코드 전체나 Gradle 캐시가 들어가는 것이 아니라, 실행에 필요한 Java runtime과 빌드된 jar 파일만 들어간다.

빌드된 image는 두 개의 tag를 가진다.

```text
ghcr.io/project-yoen/yoen_back:main
ghcr.io/project-yoen/yoen_back:<commit-sha>
```

main tag는 항상 최신 main 브랜치의 image를 의미한다.
commit-sha tag는 특정 commit 시점의 image를 의미한다.

따라서 production 서버에서는 최신 버전을 배포할 때 main tag를 pull하면 되고, 특정 버전으로 rollback하고 싶을 때는 commit SHA tag를 pull하면 된다.

정리하면 main 병합 시 흐름은 다음과 같다.

```text
PR merge to main
-> Docker Publish workflow 실행
-> main 코드 checkout
-> GHCR 로그인
-> Docker image build
   -> Spring Boot jar 빌드
   -> jar를 runtime image에 복사
-> main tag와 commit SHA tag 부여
-> GHCR에 image push
```

이 구조 덕분에 EC2 서버에서는 직접 Gradle build나 Docker build를 하지 않아도 된다. EC2는 이미 GHCR에 올라간 image를 pull해서 container로 실행하기만 하면 된다.

![2026-05-28-002](@/assets/images/2026-05-28-002.png)
