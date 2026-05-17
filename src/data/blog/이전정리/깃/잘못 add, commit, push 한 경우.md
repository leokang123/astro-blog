---
title: "잘못 add, commit, push 한 경우"
pubDatetime: 2024-10-25T19:04:00+09:00
modDatetime: 2026-04-02T22:54:53+09:00
description: "add를 잘못한 경우는 비교적 간단하다"
tags:
  - "일반"
  - "깃"
banner: "@/assets/images/shared-cavemansitting.jpg"
---

# 잘못 Add, Commit, Push 한 경우

#깃

## 잘못 Add

add를 잘못한 경우는 비교적 간단하다
아직 staged 단계에서 있는것이기 때문에 staged만 제거해 주면된다

따라서 `git restore --staged <잘못 add한 파일>` 을 통해 add를 일부 취소할수 있다

## 잘못 Commit, Push

둘이 방법은 같다. 단지 commit을 푸시하기 전에 잘못되었다는것을 인지하는것과 푸시 한 후에 인지했다는 차이일 뿐이다

이미 저질르고 잘못을 바로잡기위해서는 github 레포지토리의 히스토리를 강제로 바꿔줘야하기 때문에 그냥 push 할때 `--force` 옵션으로 푸시를 해줄 뿐이다.

방법이 꽤나 있는 듯하지만 그냥 한가지 방법만 기억하자

`git rebase -i HEAD~n`

이 명령어를 통해 지금까지 커밋한 내용중 n개를 보여준다
거기서 pick, edit. drop 등 명령어를 사용할수 있는데
![Pasted image 20241123190831](@/assets/images/legacy-git-pasted-image-20241123190831.png)
위와 같이 생겼다

pick은 문제없이 사용하겠다는 의미이고,
drop은 해당 커밋을 완전히 없애겠다 (당연히 해당 수정사항들이 전부 날아간다)
edit은 해당 커밋에서 일부 수정하겠다는 의미로 작용한다

따라서 edit을 하게 되면 현재 commit이 edit을 하기로 한 커밋으로 이동하게 된다

그러면 거기서 수정할 파일을 수정하고 git add <수정된 파일> 을 해주고
`git commit --amend` 를 하게 되면 현재 커밋에 덮어쓰겠다는 의미가 된다.
그러면 이전에 커밋한 내용중 수정하고 싶은 내용만 수정하고 다른 파일들은 그대로 남길수 있게된다.

그리고 `git rebase --continue`를 통해 다음 단계로 가고

최종적으로 push를 이미 한내용을 수정하는것이라면
`git push origin <브랜치이름> --force` 아니라면 그냥 push를 하면 수정 완료가 된다
