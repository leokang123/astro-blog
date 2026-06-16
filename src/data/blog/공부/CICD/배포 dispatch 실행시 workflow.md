---
title: "배포 dispatch 실행시 workflow"
order: 3
pubDatetime: 2026-06-16T14:34:27+09:00
modDatetime: 2026-06-16T15:07:13+09:00
description: "ec2에 원격으로 접속하여 실행파일을 실행하는 방식으로 blue green 배포 전략 구현"
ogImage: "@/assets/images/2026-06-16-001.png"
tags:
  - general
  - cicd
---
### 1차 마일스톤 
일단 자동배포되게 만들기 (Recreate방식) 

서버의 docker image를 main병합시 workflow를 통해 빌드해놓아 GHCR에 저장한 것을 사용하여 
배포 workflow dispatch를 실행할 시 EC2 서버에 원격으로 접속하여 GHCR의 이미지를 pull 하여 컨테이너 빌드없이 컨테이너를 띄워는 방식으로 배포를 하였다. 

초기에는 Recreate방식으로 가장 간단한 형태의 배포 전략을 취하였다. 처음에는 git clone을 통해 EC2에서 docker build를 하여 진행하였는데 EC2의 메모리 문제로 잘 이루어지지 않았다.

따라서 가상메모리 방식을 사용하여 메모리 용량을 늘려서 docker build를 하여 서버를 띄웠다. 하지만 이 또한 결국 GHCR을 통해 이미지 pull을 하면 따로 build 해줄 필요가 없개된다는 것을 알게되면서 이미지를 받아오는 방식으로 바뀌었다. 

github의 action variable을 통해 비밀키를 등록하여 EC2에 ssh 연결이 가능하게끔 설계하였고, 기존 springboot 서버에 actuator/health-check 의존성을 추가하여 git actions에서 서버 배포를 마치고 마무리로 헬스체크를 통과하면 workflow가 마무리되게끔 구조를 짰다. 


### 2차 마일스톤 
다듬기 (Blue-Green 배포, Https) 

사실 1차 마일스톤을 마치고 의문이 들었던 것은 recreate 방식으로 배포하여도 서비스 불가한 시간적 손실이 몇 초에 불과하다는 점이었다. 여기서 무중단 배포 방식을 고려하는것이 과연 의미가 있을까하는 근본적인 고민이 생겼다. 

하지만 결국 nginx를 통해 https reverse proxy 서버가 필요하다는 내부적인 결론이 나왔고 (앱 숨김, 로드밸런싱, 선제적 조치), 기왕 프록시 서버를 사용하는 김에 트래픽을 바꿀수 있는 기능인 무중단 배포 방식으로 `blue-green` 배포를 고려해보기로 한다. 

![2026-06-16-001](@/assets/images/2026-06-16-001.png)

따라서 nginx 설정파일이 하드코딩 방식에서 읽은값에 따라처리되게 바뀌었고,

```shell
proxy http://app:8080;
->
include /etc/nginx/includes/active_upstream.conf;
```

`deploy.sh`인 배포 실행파일은 현재 배포 색을 보고 다음 색을 기준으로 실행하게 하는 로직이 추가되었다.


```sh
#!/bin/bash
set -euo pipefail

...

if [[ ! "$IMAGE_TAG" =~ ^[A-Za-z0-9_][A-Za-z0-9_.-]{0,127}$ ]]; then
  echo "Invalid Docker image tag: $IMAGE_TAG" >&2
  exit 1
fi

cd "$APP_DIR"

CURRENT="$(cat "$CURRENT_FILE" 2>/dev/null || echo blue)"

if [[ "$CURRENT" == "blue" ]]; then
  NEXT="green"
  NEXT_SERVICE="app-green"
  NEXT_ENV="GREEN_IMAGE_TAG"
  PREVIOUS_SERVICE="app-blue"
elif [[ "$CURRENT" == "green" ]]; then
  NEXT="blue"
  NEXT_SERVICE="app-blue"
  NEXT_ENV="BLUE_IMAGE_TAG"
  PREVIOUS_SERVICE="app-green"
else
  echo "Invalid current color: $CURRENT" >&2
  exit 1
fi

echo "Current active color: $CURRENT"
echo "Deploying next color: $NEXT"
echo "Image tag: $IMAGE_TAG"

# 버전에 맞게 docker container 실행 
if [[ "$NEXT_ENV" == "BLUE_IMAGE_TAG" ]]; then
  BLUE_IMAGE_TAG="$IMAGE_TAG" sudo docker compose pull "$NEXT_SERVICE"
  BLUE_IMAGE_TAG="$IMAGE_TAG" sudo docker compose up -d --no-build "$NEXT_SERVICE"
else
  GREEN_IMAGE_TAG="$IMAGE_TAG" sudo docker compose pull "$NEXT_SERVICE"
  GREEN_IMAGE_TAG="$IMAGE_TAG" sudo docker compose up -d --no-build "$NEXT_SERVICE"
fi

echo "Waiting for $NEXT_SERVICE health check..."

# 트래픽을 바꿔주기 전 새 버전이 떴는지 확인 
...

```


#### 배포 시 green -> blue로 트래픽이 옮겨지는 로그 

![2026-06-16-002](@/assets/images/2026-06-16-002.png)
