---
title: "Chapter 13. Red-Black Trees"
order: 13
pubDatetime: 2026-05-17T00:09:00+09:00
modDatetime: 2026-05-17T00:09:00+09:00
description: "CLRS 알고리즘 정리: Chapter 13. Red-Black Trees"
tags:
  - "Algorithm"
  - "CS"
  - "CLRS"
---

## 개요

Chapter 12의 plain `binary search tree`는 height `h`에 따라 `SEARCH`, `MINIMUM`, `MAXIMUM`, `SUCCESSOR`, `PREDECESSOR`, `INSERT`, `DELETE`가 $O(h)$ time에 동작했다. 그래서 tree height가 작으면 빠르지만, insertion order가 나쁘면 linked list처럼 height가 $\Theta(n)$이 되어 기본 dynamic-set operations도 $\Theta(n)$까지 나빠진다.

`red-black tree`는 이 문제를 해결하기 위한 balanced search tree다. 각 node에 `color` bit 하나를 추가하고 red/black 색 조건을 강제하여, 어떤 root-to-leaf path도 다른 path보다 지나치게 길어지지 못하게 한다. 그 결과 `n`개 internal nodes를 가진 red-black tree의 height는 $O(\lg n)$으로 제한되고, 기본 dynamic-set operations는 worst case $O(\lg n)$ time을 보장한다.

이 장의 흐름은 다음과 같다.

- `red-black properties`: 색 조건과 `black-height`가 height bound를 만드는 이유.
- `rotations`: BST ordering을 보존하면서 local shape를 바꾸는 `LEFT-ROTATE`, `RIGHT-ROTATE`.
- `RB-INSERT`: plain BST insertion 뒤 red-black properties를 회복하는 fixup.
- `RB-DELETE`: deletion 후 생기는 black-height 문제를 `RB-DELETE-FIXUP`으로 회복하는 과정.

## 핵심 개념

| 용어 | 의미 | 검색 키워드 |
| --- | --- | --- |
| red-black tree | node color와 5가지 red-black properties를 만족하는 balanced BST | red-black tree |
| color | 각 node의 `RED` 또는 `BLACK` attribute | `x.color`, `RED`, `BLACK` |
| internal node | 실제 key를 저장하는 non-NIL node | internal node |
| external node / leaf | key를 저장하지 않는 `NIL` leaf | external node, leaf, `T.nil` |
| sentinel | 모든 `NIL` leaf와 root parent를 대표하는 하나의 black node | sentinel, `T.nil` |
| black-height | node에서 descendant leaves까지 가는 path에 포함되는 black nodes 수 | $bh(x)$, black-height |
| red-black properties | height를 $O(\lg n)$으로 제한하는 5가지 색/구조 조건 | red-black properties |
| rotation | BST property를 보존하면서 parent-child 관계를 국소적으로 바꾸는 연산 | `LEFT-ROTATE`, `RIGHT-ROTATE` |
| fixup | insertion/deletion 후 깨진 red-black properties를 복구하는 절차 | `RB-INSERT-FIXUP`, `RB-DELETE-FIXUP` |

## 세부 정리

### 13.1 Properties of red-black trees

#### Red-black tree의 정의

`red-black tree`는 각 node에 색 bit 하나를 추가한 `binary search tree`다. 각 node는 기존 BST field인 `key`, `left`, `right`, `p`에 더해 `color`를 가진다.

$$
\begin{aligned}
\text{x.key} \\
\text{x.left} \\
\text{x.right} \\
\text{x.p} \\
x.color \in {RED, BLACK}
\end{aligned}
$$

Child나 parent가 존재하지 않을 때 pointer는 `NIL`을 가리킨다. CLRS는 이 `NIL`을 단순한 null pointer가 아니라 black leaf, 즉 external node로 취급한다. 실제 key를 저장하는 node는 internal node다.

#### Red-black properties

Red-black tree는 다음 5가지 properties를 만족해야 한다.

| 번호 | property | 의미 |
| --- | --- | --- |
| 1 | Every node is either red or black. | 모든 node는 `RED` 또는 `BLACK`이다. |
| 2 | The root is black. | root는 항상 black이다. |
| 3 | Every leaf (`NIL`) is black. | 모든 external leaf는 black이다. |
| 4 | If a node is red, then both its children are black. | red node는 red child를 가질 수 없다. |
| 5 | For each node, all simple paths to descendant leaves contain the same number of black nodes. | 한 node에서 아래 leaf까지 가는 모든 path의 black node 수가 같다. |

Property 4는 red nodes가 연속으로 나타나는 것을 막는다. Property 5는 black nodes의 수를 path마다 같게 만든다. 이 둘이 결합되어 어떤 path도 다른 path보다 두 배 넘게 길어지지 못한다. 즉 red-black tree는 완벽히 균형 잡힌 tree는 아니지만, “대략 균형(approximately balanced)”이 되도록 강제된다.

#### Sentinel `T.nil`

Boundary condition 처리를 단순하게 하기 위해 CLRS는 하나의 sentinel object `T.nil`을 사용한다. `T.nil`은 ordinary node와 같은 attributes를 가지지만 $T.nil.color = BLACK$이고, `p`, `left`, `right`, `key` 값은 본질적으로 중요하지 않다.

모든 `NIL` leaf pointer와 root의 parent pointer는 이 하나의 `T.nil`을 가리킨다.

$$
\begin{aligned}
missing child \to T.nil \\
root.p \to T.nil \\
\text{T.nil.color} &= BLACK
\end{aligned}
$$

각 `NIL`마다 별도 sentinel node를 만들면 parent가 명확해지지만 공간을 낭비한다. 하나의 `T.nil`을 공유하면 공간을 아끼면서도 `NIL` child를 ordinary black node처럼 다룰 수 있다. 다만 procedure 중 편의를 위해 `T.nil.p` 같은 attribute가 임시로 설정될 수 있으므로, sentinel의 key나 child pointer 값에 의미를 두면 안 된다.

![Figure 13.1](@/assets/images/cs-algorithm-054-figure-13-1-page-331.png)
*Figure 13.1 · PDF p. 331 · red-black tree, `T.nil` sentinel, NIL leaves 생략 표기*

Figure 13.1은 같은 red-black tree를 세 방식으로 보여준다. (a)는 모든 `NIL` leaf를 표시하고 각 non-NIL node 옆에 black-height를 적는다. (b)는 모든 `NIL`을 하나의 sentinel `T.nil`로 대체한 모습을 보여준다. (c)는 이후 장에서 사용할 관례처럼 leaves와 root parent를 생략한 그림이다. 실제 알고리즘은 `T.nil`을 쓰지만, 이해용 그림에서는 보통 생략된다는 점을 기억해야 한다.

#### Black-height

Node `x`의 `black-height`, 즉 $bh(x)$는 `x` 자신은 제외하고 `x`에서 descendant leaf까지 내려가는 simple path 위의 black nodes 수다. Property 5 때문에 `x`에서 어떤 descendant leaf로 내려가도 black node 수가 같으므로 $bh(x)$가 well-defined된다.

Red-black tree 전체의 black-height는 root의 black-height로 정의한다.

$$
\text{black-height of tree T} = bh(T.root)
$$

#### Lemma 13.1: Height bound

`Lemma 13.1`은 `n`개 internal nodes를 가진 red-black tree의 height가 최대 $2 \lg(n + 1)$임을 보인다.

증명은 두 단계로 이해하면 된다.

첫째, subtree rooted at `x`에는 적어도 $2^{bh(x)} - 1$개의 internal nodes가 있다. 이는 height에 대한 induction으로 보인다. Leaf `T.nil`의 경우 $bh(T.nil) = 0$이고 internal node 수는 0이므로 성립한다. Internal node `x`의 children은 색에 따라 black-height가 $bh(x)$ 또는 $bh(x)-1$이므로, induction hypothesis를 적용하면 subtree size의 lower bound가 나온다.

둘째, red node는 red child를 가질 수 없으므로 root-to-leaf path에서 red node가 연속될 수 없다. 따라서 root를 제외한 path 위 node 중 적어도 절반은 black이다. Tree height를 `h`라 하면 root의 black-height는 적어도 $h/2$이고,

$$
\begin{aligned}
n &\ge 2^{h/2} - 1 \\
n + 1 &\ge 2^{h/2} \\
\lg(n + 1) &\ge h/2 \\
h &\le 2 \lg(n + 1)
\end{aligned}
$$

가 된다. 이 lemma가 red-black tree 전체 성능의 핵심이다.

#### Chapter 12 operations와의 연결

Red-black tree도 binary search tree이므로 Chapter 12의 `SEARCH`, `MINIMUM`, `MAXIMUM`, `SUCCESSOR`, `PREDECESSOR`를 그대로 쓸 수 있다. 단, `NIL` 참조는 `T.nil` sentinel로 바꿔야 한다. Lemma 13.1에 의해 height가 $O(\lg n)$이므로 이 query operations는 red-black tree에서 worst-case $O(\lg n)$ time이다.

반면 Chapter 12의 `TREE-INSERT`와 `TREE-DELETE`는 red-black tree를 입력으로 받으면 pointer상 BST update는 수행하지만, red-black properties를 보장하지 않는다. 그래서 insertion과 deletion에는 색 조정과 rotation을 포함하는 별도의 `RB-INSERT`, `RB-DELETE`가 필요하다.

#### 13.1 Exercises에서 남길 포인트

Red-black tree의 height bound는 root에 대해서만이 아니라 어떤 node `x`의 descendant paths에도 적용된다. Exercise 13.1-5의 핵심은 property 4와 5 때문에 `x`에서 leaf까지 가는 longest simple path가 shortest simple path의 최대 2배 길이라는 점이다. Shortest path는 black nodes 위주로 내려가고, longest path는 black nodes 사이에 red nodes가 최대한 끼어든 경우라고 보면 된다.

Red nodes를 black parent에 “흡수(absorb)”하면 black node 하나가 2-node, 3-node, 4-node처럼 여러 children을 갖는 구조로 볼 수 있다. 이 관점은 red-black tree가 2-3-4 tree와 연결된다는 직관을 준다. 즉 red-black properties는 binary tree 표현 안에서 multiway balanced tree의 균형을 흉내 내는 방식으로도 이해할 수 있다.

### 13.2 Rotations

`TREE-INSERT`와 `TREE-DELETE`는 red-black tree의 BST ordering은 유지할 수 있지만 red-black properties를 깨뜨릴 수 있다. 이를 복구하려면 node colors를 바꾸는 것만으로 부족할 때가 있고, tree의 pointer structure도 바꿔야 한다. 이때 쓰는 국소 구조 변경이 `rotation`이다.

Rotation은 `binary-search-tree property`를 보존한다. 즉 subtree의 모양과 parent-child 관계는 바뀌지만, inorder traversal 결과는 그대로다.

![Figure 13.2](@/assets/images/cs-algorithm-056-figure-13-2-page-334.png)
*Figure 13.2 · PDF p. 334 · BST property를 보존하는 left/right rotation의 기본 형태*

Figure 13.2에서 `LEFT-ROTATE(T, x)`는 `x`의 right child `y`를 subtree의 새 root로 올리고, `x`를 `y.left`로 내린다. 기존 `y.left`였던 subtree $\beta$는 `x.right`가 된다. 이때 key 순서는 항상 다음을 만족한다.

$$
keys in \alpha < x.key < keys in β < y.key < keys in γ
$$

따라서 rotation 전후에 inorder tree walk는 같은 key 순서를 출력한다. `RIGHT-ROTATE(T, y)`는 이 변환의 inverse operation이다.

#### LEFT-ROTATE

`LEFT-ROTATE(T, x)`는 `x.right != T.nil`이라고 가정한다. 또한 root의 parent는 `T.nil`이다.

```text
LEFT-ROTATE(T, x)
1   y = x.right
2   x.right = y.left
3   if y.left != T.nil
4       y.left.p = x
5   y.p = x.p
6   if x.p == T.nil
7       T.root = y
8   elseif x == x.p.left
9       x.p.left = y
10  else x.p.right = y
11  y.left = x
12  x.p = y
```

Pointer 변화는 네 묶음으로 읽으면 쉽다.

| 단계 | 의미 |
| --- | --- |
| line 1 | $y = x.right$로 pivot node를 잡는다 |
| lines 2-4 | `y.left` subtree를 `x.right`로 옮기고 parent pointer를 고친다 |
| lines 5-10 | `x`의 parent가 이제 `y`를 child로 가리키게 한다 |
| lines 11-12 | `x`를 `y.left`로 붙이고 $x.p = y$로 만든다 |

Rotation은 node의 `key`, `color`, satellite data 같은 attributes를 바꾸지 않는다. 바뀌는 것은 constant number of pointers뿐이다. 따라서 `LEFT-ROTATE`와 `RIGHT-ROTATE`는 모두 $O(1)$ time이다.

![Figure 13.3](@/assets/images/cs-algorithm-057-figure-13-3-page-335.png)
*Figure 13.3 · PDF p. 335 · `LEFT-ROTATE(T, x)` 전후에도 inorder key order가 유지되는 예*

Figure 13.3은 $x = 11$, $y = 18$인 곳에서 left rotation을 수행한다. Rotation 후 `18`이 해당 subtree의 root로 올라가고 `11`은 그 left child가 된다. 하지만 input tree와 modified tree의 inorder traversal은 같은 key listing을 만든다. Red-black insertion/deletion fixup이 rotation을 안심하고 쓰는 이유가 바로 이 ordering 보존성이다.

#### Rotation이 depth에 주는 영향

Figure 13.2의 right tree에서 `LEFT-ROTATE(T, x)`를 수행한다고 보면, subtree $\alpha$의 nodes는 한 단계 더 깊어지고, subtree $\gamma$의 nodes는 한 단계 얕아지며, subtree $\beta$의 nodes는 depth가 변하지 않는다. Rotation은 전체 tree를 다시 만드는 연산이 아니라, 특정 link 주변에서 일부 subtree depth를 한 칸 조절하는 local balancing primitive다.

#### 13.2 Exercises에서 남길 포인트

`n`-node BST에는 가능한 rotation이 정확히 $n-1$개다. 각 rotation은 parent-child edge 하나를 중심으로 수행되며, root를 제외한 모든 node는 parent와 연결된 edge 하나를 가진다. 따라서 edge 수가 $n-1$이고, 각 edge는 적절한 방향의 rotation 하나에 대응한다.

또한 arbitrary `n`-node BST는 $O(n)$ rotations로 다른 arbitrary BST로 바꿀 수 있다. 한쪽 방향 rotation으로 먼저 right-going chain 같은 표준 형태를 만들고, 다시 목표 tree로 회전해 가는 식이다. 이 사실은 rotation이 red-black tree fixup에서 작은 국소 수정에 쓰이지만, 충분히 반복하면 tree shape 전체도 바꿀 수 있음을 보여준다.

### 13.3 Insertion

Red-black tree insertion은 두 단계로 구성된다.

1. Chapter 12의 BST insertion처럼 새 node `z`를 leaf position에 삽입한다.
2. `z`를 `RED`로 칠한 뒤 `RB-INSERT-FIXUP`으로 red-black properties를 복구한다.

새 node를 red로 칠하는 이유는 property 5, 즉 black-height를 깨뜨리지 않기 위해서다. 새 node가 기존 black sentinel `T.nil`을 대체하더라도 red node 자체는 path의 black count를 늘리지 않는다. 대신 새 node의 parent가 red라면 property 4가 깨질 수 있고, 이 violation을 fixup에서 해결한다.

#### RB-INSERT

```text
RB-INSERT(T, z)
1   y = T.nil
2   x = T.root
3   while x != T.nil
4       y = x
5       if z.key < x.key
6           x = x.left
7       else x = x.right
8   z.p = y
9   if y == T.nil
10      T.root = z
11  elseif z.key < y.key
12      y.left = z
13  else y.right = z
14  z.left = T.nil
15  z.right = T.nil
16  z.color = RED
17  RB-INSERT-FIXUP(T, z)
```

`TREE-INSERT`와의 차이는 네 가지다.

- `NIL` 대신 red-black tree sentinel `T.nil`을 쓴다.
- 새 node의 children을 $z.left = T.nil$, $z.right = T.nil$로 명시한다.
- 새 node `z`를 `RED`로 칠한다.
- `RB-INSERT-FIXUP(T, z)`를 호출해 깨진 red-black properties를 복구한다.

Insertion 직후 property 1과 3은 유지된다. 새 node와 sentinel children은 각각 red/black으로 색이 정해져 있기 때문이다. Property 5도 유지된다. 새 red node가 black sentinel 자리를 대체하므로 path의 black node 수가 변하지 않는다. 문제가 될 수 있는 것은 두 가지뿐이다.

| 깨질 수 있는 property | 언제 깨지는가 |
| --- | --- |
| property 2 | 새 node `z`가 root인데 red로 칠했을 때 |
| property 4 | `z`와 `z.p`가 모두 red일 때 |

#### RB-INSERT-FIXUP의 invariant

`RB-INSERT-FIXUP`은 `z.p.color == RED`인 동안 반복한다.

```text
RB-INSERT-FIXUP(T, z)
1   while z.p.color == RED
2       if z.p == z.p.p.left
3           y = z.p.p.right
4           if y.color == RED
5               z.p.color = BLACK          // case 1
6               y.color = BLACK            // case 1
7               z.p.p.color = RED          // case 1
8               z = z.p.p                  // case 1
9           else if z == z.p.right
10              z = z.p                    // case 2
11              LEFT-ROTATE(T, z)          // case 2
12          z.p.color = BLACK              // case 3
13          z.p.p.color = RED              // case 3
14          RIGHT-ROTATE(T, z.p.p)         // case 3
15      else same as then clause with "right" and "left" exchanged
16  T.root.color = BLACK
```

Loop 시작 시 유지되는 핵심 invariant는 다음과 같다.

- `z`는 red다.
- `z.p`가 root이면 `z.p`는 black이다.
- red-black properties 중 깨진 것이 있다면 property 2 또는 property 4 중 하나뿐이다.
- property 4 violation이라면 반드시 `z`와 `z.p`가 둘 다 red인 형태다.

이 invariant 덕분에 loop 안에서 `z.p.p`를 안전하게 참조할 수 있다. Loop에 들어왔다는 것은 `z.p`가 red라는 뜻이고, root가 red parent일 수는 없으므로 `z.p`는 root가 아니다. 따라서 grandparent `z.p.p`가 존재한다.

![Figure 13.4](@/assets/images/cs-algorithm-058-figure-13-4-page-338.png)
*Figure 13.4 · PDF p. 338 · `RB-INSERT-FIXUP`이 case 1, 2, 3을 거쳐 red-red violation을 복구하는 예*

Figure 13.4는 insertion 후 `z`와 parent가 모두 red인 상태에서 시작해, case 1로 violation을 위로 올리고, case 2로 모양을 바꾼 뒤, case 3으로 rotation과 recoloring을 수행해 legal red-black tree가 되는 과정을 보여준다.

#### Case 1: uncle `y` is red

Case 1은 `z.p`와 uncle `y`가 모두 red일 때다. 이때 grandparent `z.p.p`는 black이어야 한다. 그렇지 않으면 insertion 전 tree가 이미 property 4를 위반했기 때문이다.

$$
\begin{aligned}
\text{z.p.color} &= BLACK \\
\text{y.color} &= BLACK \\
z.p.p.color &= RED \\
\text{z} &= z.p.p
\end{aligned}
$$

![Figure 13.5](@/assets/images/cs-algorithm-059-figure-13-5-page-341.png)
*Figure 13.5 · PDF p. 341 · uncle이 red인 insertion fixup case 1의 recoloring*

Case 1은 rotation 없이 recoloring만 한다. Parent와 uncle을 black으로 바꾸면 `z`와 `z.p` 사이의 red-red violation은 사라진다. Grandparent를 red로 바꾸는 이유는 property 5를 유지하기 위해서다. Local subtree에서 아래 path들이 보는 black count가 그대로 유지된다.

대신 grandparent가 red가 되었으므로, grandparent와 그 parent 사이에 새로운 property 4 violation이 생길 수 있다. 그래서 $z = z.p.p$로 pointer를 두 단계 위로 올리고 while loop를 반복한다. 즉 case 1은 문제를 해결했다기보다, violation 가능성을 위쪽으로 밀어 올리는 case다.

#### Case 2 and Case 3: uncle `y` is black

Uncle `y`가 black이면 rotation을 통해 violation을 국소적으로 끝낼 수 있다. `z.p`가 grandparent의 left child인 쪽만 보면 두 case가 있다. 반대쪽은 left/right를 바꾼 symmetric case다.

| case | 조건 | 목적 |
| --- | --- | --- |
| case 2 | `y` is black and `z == z.p.right` | left rotation으로 case 3 모양으로 바꾼다 |
| case 3 | `y` is black and `z == z.p.left` | recoloring + right rotation으로 violation을 제거한다 |

![Figure 13.6](@/assets/images/cs-algorithm-060-figure-13-6-page-342.png)
*Figure 13.6 · PDF p. 342 · insertion fixup에서 uncle이 black인 case 2와 case 3*

Case 2는 삼각형 모양을 직선형으로 바꾸는 준비 단계다.

$$
\begin{aligned}
z &= z.p \\
LEFT-ROTATE(T, z)
\end{aligned}
$$

이 rotation은 black-height를 바꾸지 않고, 이후 case 3을 적용할 수 있는 모양으로 만든다. Case 2는 곧바로 case 3으로 이어지므로 두 case는 mutually exclusive한 종료 case가 아니다. CLRS도 case 2 falls through into case 3라고 설명한다.

Case 3에서는 parent를 black, grandparent를 red로 바꾸고 grandparent에서 right rotation을 수행한다.

$$
\begin{aligned}
\text{z.p.color} &= BLACK \\
z.p.p.color &= RED \\
RIGHT-ROTATE(T, z.p.p)
\end{aligned}
$$

이렇게 하면 더 이상 red node가 red child를 갖지 않으며, property 5도 유지된다. Case 2/3가 실행되면 `z.p`가 black이 되므로 while loop는 다음 test에서 종료된다.

#### Termination and analysis

Loop가 종료되는 이유는 `z.p.color == BLACK`이 되었기 때문이다. 이때 property 4 violation은 없다. 남아 있을 수 있는 것은 root가 red인 property 2 violation뿐이며, line 16의

$$
T.root.color = BLACK
$$

이 이를 복구한다.

`RB-INSERT`의 running time은 $O(\lg n)$이다. BST insertion 부분은 red-black tree height가 $O(\lg n)$이므로 $O(\lg n)$이고, fixup loop는 case 1에서만 반복되며 그때마다 `z`가 두 levels 위로 올라간다. 따라서 반복 횟수도 $O(\lg n)$이다. Rotation은 case 2/3에서만 수행되고, 실행되면 loop가 종료되므로 insertion 하나당 rotations는 최대 2번이다.

#### 13.3 Exercises에서 남길 포인트

새 node를 black으로 넣지 않는 이유는 property 5 때문이다. Black node를 leaf 위치에 삽입하면 그 node를 지나는 paths의 black count만 증가하므로 여러 path의 black-height가 달라진다. Red로 넣으면 property 5는 유지하고, red-red violation만 fixup하면 된다.

`RB-INSERT-FIXUP`이 `T.nil.color`를 red로 만들 수 있다는 걱정은 성립하지 않는다. Fixup에서 red로 칠하는 대상은 grandparent `z.p.p` 같은 internal node이고, loop에 들어온 상황에서는 `z.p`가 red이므로 `z.p`는 root나 sentinel이 아니다. Sentinel은 black으로 유지된다.

### 13.4 Deletion

Red-black tree deletion도 $O(\lg n)$ time에 가능하지만 insertion보다 복잡하다. 이유는 black node를 제거하거나 이동하면 property 5, 즉 black-height 균형이 깨질 수 있기 때문이다. CLRS의 `RB-DELETE`는 Chapter 12의 `TREE-DELETE` 구조를 유지하되, 제거 또는 이동된 node의 색과 그 자리를 대신 차지한 node를 추적한다.

#### RB-TRANSPLANT

`RB-TRANSPLANT(T, u, v)`는 Chapter 12의 `TRANSPLANT`를 red-black tree용으로 바꾼 것이다.

```text
RB-TRANSPLANT(T, u, v)
1  if u.p == T.nil
2      T.root = v
3  elseif u == u.p.left
4      u.p.left = v
5  else u.p.right = v
6  v.p = u.p
```

`TRANSPLANT`와의 차이는 두 가지다.

- `NIL` 대신 sentinel `T.nil`을 쓴다.
- $v.p = u.p$를 무조건 수행한다. `v == T.nil`이어도 `T.nil.p`를 설정할 수 있다.

이 무조건 parent assignment가 중요하다. Deletion fixup에서 `x`가 sentinel `T.nil`일 수 있는데, 그래도 `x.p`를 통해 sibling `w`를 찾아야 한다. 따라서 sentinel도 parent pointer를 임시로 가져야 한다.

#### RB-DELETE의 추적 변수

`RB-DELETE(T, z)`는 삭제 대상 `z` 외에 세 가지를 추적한다.

| 변수 | 의미 |
| --- | --- |
| `y` | 실제로 tree에서 제거되거나, tree 안에서 이동되는 node |
| `y-original-color` | `y`가 제거/이동되기 전의 color |
| `x` | `y`의 original position으로 이동한 node |

`z`의 child가 0개 또는 1개이면 실제로 제거되는 node는 `z`이므로 $y = z$다. `z`가 two children을 가지면 `y`는 `z`의 successor이고, `y`가 `z`의 자리로 이동한다. 이때 `x`는 `y`의 원래 자리로 올라오는 node이며, `y`가 child가 없으면 $x = T.nil$일 수 있다.

```text
RB-DELETE(T, z)
1   y = z
2   y-original-color = y.color
3   if z.left == T.nil
4       x = z.right
5       RB-TRANSPLANT(T, z, z.right)
6   elseif z.right == T.nil
7       x = z.left
8       RB-TRANSPLANT(T, z, z.left)
9   else y = TREE-MINIMUM(z.right)
10      y-original-color = y.color
11      x = y.right
12      if y.p == z
13          x.p = y
14      else RB-TRANSPLANT(T, y, y.right)
15          y.right = z.right
16          y.right.p = y
17      RB-TRANSPLANT(T, z, y)
18      y.left = z.left
19      y.left.p = y
20      y.color = z.color
21  if y-original-color == BLACK
22      RB-DELETE-FIXUP(T, x)
```

Line 20에서 $y.color = z.color$로 만드는 이유는 `y`가 `z`의 자리를 차지할 때 그 위치의 red-black 역할을 이어받게 하기 위해서다. 하지만 `y`가 원래 있던 자리에서 빠져나가는 효과는 별도로 봐야 한다. 그래서 `y-original-color`를 저장해 두고, 원래 제거/이동된 `y`가 black이었을 때만 `RB-DELETE-FIXUP`을 호출한다.

`y`가 red였다면 fixup이 필요 없다.

- Black-height가 변하지 않는다.
- Red node끼리 새로 adjacent하게 만들지 않는다.
- Red `y`는 root일 수 없으므로 root black property도 유지된다.

반대로 `y`가 black이었다면 path 하나에서 black node 하나가 사라진 것이므로 property 5가 깨질 수 있다.

#### Extra black

Black `y`가 제거되거나 이동되면, `y`의 original position을 차지한 `x`가 blackness 하나를 추가로 떠안았다고 해석한다. 이 관점에서 `x`는 `extra black`을 가진다.

$$
\begin{aligned}
\text{black y removed} \\
\Rightarrow \text{push y's blackness onto } x \\
\Rightarrow x is doubly black or red-and-black
\end{aligned}
$$

`x.color` attribute 자체는 여전히 `RED` 또는 `BLACK` 중 하나다. Extra black은 color field에 저장되는 값이 아니라, pointer `x`가 “현재 이 node가 black 하나를 더 갖고 있다고 해석해야 한다”는 상태를 나타낸다.

- `x.color == BLACK`이고 extra black이 있으면 `x`는 `doubly black`처럼 동작한다.
- `x.color == RED`이고 extra black이 있으면 `x`는 `red-and-black`처럼 동작한다.

`RB-DELETE-FIXUP`의 목표는 이 extra black을 없애 property 1, 2, 4, 5를 모두 회복하는 것이다.

#### RB-DELETE-FIXUP

```text
RB-DELETE-FIXUP(T, x)
1   while x != T.root and x.color == BLACK
2       if x == x.p.left
3           w = x.p.right
4           if w.color == RED
5               w.color = BLACK              // case 1
6               x.p.color = RED              // case 1
7               LEFT-ROTATE(T, x.p)          // case 1
8               w = x.p.right                // case 1
9           if w.left.color == BLACK and w.right.color == BLACK
10              w.color = RED                // case 2
11              x = x.p                      // case 2
12          else if w.right.color == BLACK
13              w.left.color = BLACK         // case 3
14              w.color = RED                // case 3
15              RIGHT-ROTATE(T, w)           // case 3
16              w = x.p.right                // case 3
17          w.color = x.p.color              // case 4
18          x.p.color = BLACK                // case 4
19          w.right.color = BLACK            // case 4
20          LEFT-ROTATE(T, x.p)              // case 4
21          x = T.root                       // case 4
22      else same as then clause with "right" and "left" exchanged
23  x.color = BLACK
```

Loop 안에서 `x`는 nonroot doubly black node를 가리킨다. Code는 `x`가 left child인 경우만 보여주며, right child인 경우는 left/right를 바꾼 symmetric version이다. `w`는 `x`의 sibling이다. `x`가 extra black을 갖고 있으므로 `w`는 `T.nil`일 수 없다. 만약 `w`가 sentinel leaf라면 `x.p`에서 `w`로 가는 path의 black count가 `x`로 가는 path보다 작아져 property 5 해석이 맞지 않기 때문이다.

Loop의 종료 목표는 세 가지 중 하나다.

- `x`가 red-and-black node라면 line 23에서 singly black으로 만든다.
- `x`가 root라면 extra black을 제거한다.
- 적절한 rotation/recoloring으로 extra black을 없애고 loop를 끝낸다.

![Figure 13.7](@/assets/images/cs-algorithm-061-figure-13-7-page-350.png)
*Figure 13.7 · PDF p. 350 · `RB-DELETE-FIXUP`의 네 가지 extra black 처리 case*

Figure 13.7의 `x`는 extra black을 갖고 있다. 각 case의 변환은 `x`의 extra black까지 포함해 subtree root에서 $\alpha, \beta, \ldots, ζ$로 내려가는 black count를 보존하도록 설계되어 있다.

#### Deletion fixup cases

| case | 조건 | 처리 목표 |
| --- | --- | --- |
| case 1 | `w` is red | sibling을 black으로 바꾸는 모양으로 변환해 case 2/3/4로 보낸다 |
| case 2 | `w` is black and both children of `w` are black | `w`를 red로 만들고 extra black을 parent로 올린다 |
| case 3 | `w` is black, near child red, far child black | rotation으로 case 4 모양을 만든다 |
| case 4 | `w` is black and far child red | recoloring + rotation으로 extra black을 제거한다 |

Case 1은 sibling `w`가 red일 때다. Red node의 children은 black이므로 `w`의 children은 black이다. `w`와 `x.p`의 colors를 바꾸고 `LEFT-ROTATE(T, x.p)`를 수행하면, `x`의 새 sibling은 black이 된다. 즉 case 1 자체가 extra black을 제거하지는 않고, 이후 case 2, 3, 4 중 하나로 들어갈 수 있게 변환한다.

Case 2는 `w`와 `w`의 두 children이 모두 black일 때다. `x`와 `w` 양쪽에서 black 하나씩을 빼고, 그 extra black을 parent `x.p`로 올린다고 해석한다. 코드상으로는 $w.color = RED$, $x = x.p$가 된다. 이 case만 loop를 반복할 수 있다.

Case 3은 `w`가 black이고 near child는 red, far child는 black인 경우다. 왼쪽 case 기준으로 `w.left`가 red이고 `w.right`가 black이다. `w`와 `w.left`의 colors를 바꾸고 `RIGHT-ROTATE(T, w)`를 수행해 case 4의 조건, 즉 far child가 red인 모양을 만든다.

Case 4는 `w`가 black이고 far child가 red인 경우다. $w.color = x.p.color$, $x.p.color = BLACK$, $w.right.color = BLACK$으로 색을 조정하고 `LEFT-ROTATE(T, x.p)`를 수행한다. 이 변환은 `x`의 extra black을 제거하고 red-black properties를 회복한다. 이후 $x = T.root$로 설정해 loop를 종료시킨다.

#### Deletion analysis

`RB-DELETE`의 total running time은 $O(\lg n)$이다. `RB-DELETE-FIXUP`을 제외한 deletion 구조는 tree height에 비례하므로 $O(\lg n)$이다. Fixup에서는 case 2만 반복될 수 있고, 그때마다 `x`가 parent로 올라간다. 따라서 반복 횟수는 $O(\lg n)$이다. Cases 1, 3, 4는 constant number of color changes와 rotations를 수행한 뒤 종료로 이어진다.

`RB-DELETE-FIXUP`에서 수행되는 rotations는 최대 3번이다. 따라서 red-black tree deletion은 worst-case $O(\lg n)$ time이며, structural changes는 제한된 수의 rotations로 끝난다.

#### 13.4 Exercises에서 남길 포인트

`RB-DELETE-FIXUP`이 끝난 뒤 root는 반드시 black이다. Loop가 root까지 extra black을 밀어 올리면 extra black을 제거하고, 마지막 line 23에서 $x.color = BLACK$을 수행한다. 따라서 root가 `x`로 끝나든 아니든 최종 root black property가 회복된다.

Sentinel `T.nil`은 deletion fixup에서 실제로 검사되거나 parent pointer가 수정될 수 있다. 특히 `x`가 `T.nil`일 때도 `x.p`를 통해 sibling `w`를 찾기 때문에, `RB-TRANSPLANT`가 $v.p = u.p$를 unconditional하게 수행하는 설계가 필요하다.

`RB-INSERT`로 node를 넣고 바로 같은 node를 `RB-DELETE`로 삭제한다고 해서 항상 원래 tree shape로 돌아가는 것은 아니다. Insertion과 deletion 모두 rotations와 recoloring을 수행할 수 있고, 균형 조건을 만족하는 red-black tree는 유일하지 않기 때문이다.

### Problems for Chapter 13

#### 13-1 Persistent dynamic sets

`persistent dynamic set`은 update 이후에도 과거 버전을 계속 사용할 수 있는 set이다. 가장 단순한 방법은 update마다 전체 tree를 복사하는 것이지만, 이는 시간과 공간을 크게 낭비한다. Binary search tree에서는 update path만 새로 복사하고 나머지 subtree는 공유하는 방식으로 훨씬 효율적으로 persistent set을 만들 수 있다.

![Figure 13.8](@/assets/images/cs-algorithm-062-figure-13-8-page-352.png)
*Figure 13.8 · PDF p. 352 · key 5 삽입 후 update path만 복사해 이전 BST version과 공유하는 persistent tree*

Figure 13.8에서 key `5`를 삽입할 때 기존 node들을 직접 수정하지 않는다. Root `4`, 그 아래 `8`, 그 아래 `7`처럼 insertion path 위 node들만 새로 복사하고, 삽입과 무관한 subtree는 이전 version과 공유한다. 각 version은 별도의 root pointer를 가진다.

Parent pointer가 없는 persistent BST에서 height가 `h`이면 insertion은 $O(h)$ time과 $O(h)$ new nodes로 가능하다. Red-black tree를 사용하면 height가 $O(\lg n)$으로 보장되므로 persistent insertion/deletion도 worst-case $O(\lg n)$ time/space per update로 만들 수 있다. 반대로 parent pointer를 모든 node에 유지하면, shared subtree 내부 node들의 parent가 새 복사 node를 가리키도록 바뀌어야 하므로 추가 복사가 연쇄되어 $\Omega(n)$ time/space가 필요할 수 있다.

#### 13-2 Join operation on red-black trees

`RB-JOIN(T1, x, T2)`는 모든 `T1` key가 `x.key` 이하이고 모든 `T2` key가 `x.key` 이상일 때,

$$
T = T1 \cup {x} \cup T2
$$

를 하나의 red-black tree로 합치는 operation이다. 핵심은 black-height를 맞추는 것이다. 예를 들어 $T1.bh \ge T2.bh$이면 `T1`에서 key가 가장 크면서 black-height가 `T2.bh`인 black node `y`를 찾고, 그 subtree $T_{y}$ 자리에 $T_{y} \cup {x} \cup T2$를 끼워 넣는다. `x`의 color를 적절히 정해 properties 1, 3, 5를 유지하고, property 2와 4는 insertion fixup과 유사하게 $O(\lg n)$ 안에 복구한다. 대칭적으로 $T1.bh \le T2.bh$인 경우에는 `T2` 쪽에서 대응되는 node를 찾는다.

이 문제는 red-black tree에서 `black-height`가 단순한 증명 도구가 아니라, tree를 붙이는 알고리즘의 위치 결정 기준으로도 쓰일 수 있음을 보여준다.

#### 13-3 AVL trees

`AVL tree`는 각 node에서 left/right subtree heights의 차이가 최대 1이 되도록 유지하는 height-balanced BST다. 각 node는 height attribute `x.h`를 저장한다.

$$
\lvert x.right.h - x.left.h \rvert \le 1
$$

AVL tree의 height가 $O(\lg n)$임은 height `h`인 AVL tree가 적어도 Fibonacci 수만큼의 nodes를 가져야 함을 보이면 된다. Insertion 후 어떤 node에서 child heights 차이가 2가 되면 rotations로 balance를 회복한다. Red-black tree보다 더 엄격한 height balance를 유지하므로 search는 빠른 편이지만, update에서 height 유지와 rotations가 더 까다로울 수 있다.

#### 13-4 Treaps

`treap`은 `tree + heap`의 결합이다. 각 node는 `key`와 random `priority`를 가지며, key에 대해서는 BST property를, priority에 대해서는 min-heap order property를 만족한다.

![Figure 13.9](@/assets/images/cs-algorithm-063-figure-13-9-page-355.png)
*Figure 13.9 · PDF p. 355 · key와 random priority를 함께 갖는 treap 예*

Treap의 ordering rules는 다음과 같다.

$$
\begin{aligned}
\text{if v is left child of u:} v.key &< u.key \\
\text{if v is right child of u:} v.key &> u.key \\
\text{if v is child of u:} v.priority &> u.priority
\end{aligned}
$$

Priority가 작을수록 heap에서 위에 온다. 모든 keys와 priorities가 distinct라면 treap shape는 유일하다. 또한 treap은 “priority가 작은 순서대로 ordinary BST에 삽입했다면 생겼을 tree”와 같다. Priorities가 random이므로 randomly built BST의 균형 효과를 online insertion 상황에서도 얻는 구조라고 볼 수 있다.

![Figure 13.10](@/assets/images/cs-algorithm-064-figure-13-10-page-356.png)
*Figure 13.10 · PDF p. 356 · `TREAP-INSERT`가 BST insertion 후 rotations로 heap priority를 복구하는 과정*

`TREAP-INSERT`는 먼저 key 기준으로 ordinary BST insertion을 수행한다. 그런 다음 새 node의 priority가 parent보다 작으면 rotations를 반복해 min-heap order property를 회복한다.

```text
TREAP-INSERT(T, x)
1  assign random x.priority
2  insert x by ordinary BST insertion using x.key
3  while x.p != NIL and x.priority < x.p.priority
4      if x == x.p.left
5          RIGHT-ROTATE(T, x.p)
6      else LEFT-ROTATE(T, x.p)
```

Treap의 expected height는 $\Theta(\lg n)$이고, search expected time도 $\Theta(\lg n)$이다. Insert는 search path를 따라 내려간 뒤 rotations로 올라오므로 expected running time도 $\Theta(\lg n)$이다.

![Figure 13.11](@/assets/images/cs-algorithm-065-figure-13-11-page-357.png)
*Figure 13.11 · PDF p. 357 · treap insertion rotation 수 분석에 쓰이는 left spine과 right spine*

Treap insertion에서 search는 읽기 중심이고 rotation은 pointer write를 발생시킨다. 실제 machine에서는 write가 더 비싸므로 rotations 수가 중요하다. CLRS 문제는 삽입된 node `x`의 left subtree의 right spine 길이 `C`와 right subtree의 left spine 길이 `D`를 정의하고, insertion 중 rotations 수가 `C + D`임을 보인다. 기대값 계산 결과 `E[C] < 1`, `E[D] < 1`이 되어, treap insertion의 expected rotations 수는 2보다 작다.

### Chapter notes

Balanced search tree 계열에는 red-black trees 외에도 여러 변형이 있다. `AVL trees`는 height difference를 직접 제한한다. `2-3 trees`와 그 일반화인 `B-trees`는 node degree를 조절해 balance를 유지하며, B-trees는 Chapter 18에서 disk storage에 적합한 구조로 등장한다. `AA-trees`는 red-black tree와 비슷하지만 left child가 red일 수 없게 제한해 구현을 단순화한 변형이다.

`splay trees`는 color나 height 같은 명시적 balance condition을 유지하지 않고, access마다 rotations를 수행해 self-adjusting한다. 각 operation의 amortized cost는 $O(\lg n)$이다. `skip lists`는 balanced binary tree의 대안으로, 여러 forward pointers를 가진 linked list 구조에서 dictionary operations를 expected $O(\lg n)$ time에 수행한다.

## 복잡도

| Operation / 구조 | Running time | Rotation bound / 비고 |
| --- | --- | --- |
| `SEARCH`, `MINIMUM`, `MAXIMUM`, `SUCCESSOR`, `PREDECESSOR` | $O(\lg n)$ | Chapter 12 BST operations + red-black height bound |
| `LEFT-ROTATE`, `RIGHT-ROTATE` | $O(1)$ | constant number of pointers 변경 |
| `RB-INSERT` | $O(\lg n)$ | rotations at most 2 |
| `RB-INSERT-FIXUP` | $O(\lg n)$ | case 1만 반복, `z`가 2 levels씩 올라감 |
| `RB-DELETE` | $O(\lg n)$ | rotations at most 3 |
| `RB-DELETE-FIXUP` | $O(\lg n)$ | case 2만 반복, `x`가 parent로 올라감 |
| persistent red-black tree update | $O(\lg n)$ time/space | update path copying |
| treap search/insert expected time | $\Theta(\lg n)$ | random priority 기반 |
| treap insertion expected rotations | `< 2` | spine length expectation |

## 연결 관계

- Chapter 12의 `binary search tree`는 ordering과 기본 operations를 제공하고, Chapter 13의 red-black tree는 height를 $O(\lg n)$으로 보장한다.
- `rotation`은 red-black tree뿐 아니라 AVL trees, treaps, splay trees 같은 balanced BST 계열의 공통 primitive다.
- `black-height`는 Lemma 13.1의 증명 도구이면서 `RB-JOIN` 같은 고급 operation의 위치 결정에도 쓰인다.
- Persistent tree 문제는 immutable/persistent data structure의 path copying 아이디어와 연결된다.
- Treap은 Chapter 12의 randomly built BST와 Chapter 6의 heap property를 결합한 randomized balanced BST다.
- Chapter 18의 `B-trees`는 2-3 tree 계열을 disk storage에 맞게 일반화한 search tree다.

## 오해하기 쉬운 내용

- Red-black tree는 완전 균형 tree가 아니다. Path 길이가 완전히 같지는 않지만, longest path가 shortest path의 2배를 넘지 못하게 제한한다.
- `T.nil`은 단순 null이 아니라 black sentinel node다. 특히 deletion에서는 `T.nil.p`가 의미 있게 설정될 수 있다.
- $bh(x)$는 node `x` 자신을 포함하지 않고, descendant leaf까지의 black nodes 수를 센다.
- Rotation은 BST key order를 바꾸지 않는다. Inorder traversal 결과는 rotation 전후 동일하다.
- `RB-INSERT`에서 새 node를 red로 넣는 이유는 black-height를 유지하기 위해서다. Black으로 넣으면 property 5가 즉시 깨진다.
- Insertion case 2는 독립적으로 끝나는 case가 아니라 case 3으로 넘어가기 위한 shape 변환이다.
- Deletion의 `extra black`은 color attribute 값이 아니다. Fixup 분석을 위한 상태이며 `x` pointer에 붙어 있는 해석이다.
- `RB-DELETE-FIXUP`에서 반복되는 case는 case 2뿐이다. Cases 1, 3, 4는 변환 후 종료 방향으로 간다.

## 면접 질문

1. Red-black tree의 5가지 red-black properties를 말하고, 각각이 왜 필요한지 설명하라.
2. `black-height bh(x)`의 정의와 `Lemma 13.1`의 height bound 증명 아이디어를 설명하라.
3. `T.nil` sentinel을 쓰는 이유와 deletion에서 `T.nil.p`가 필요한 이유는 무엇인가?
4. `LEFT-ROTATE(T, x)`가 BST property를 보존하는 이유를 $\alpha, \beta, \gamma$ key order로 설명하라.
5. `RB-INSERT`에서 새 node를 red로 칠하는 이유는 무엇인가?
6. `RB-INSERT-FIXUP`의 case 1, 2, 3을 uncle color와 node shape 기준으로 구분하라.
7. `RB-INSERT`가 최대 2 rotations만 수행하는 이유는 무엇인가?
8. `RB-DELETE`에서 `y`, `y-original-color`, `x`가 각각 무엇을 추적하는지 설명하라.
9. Deletion fixup의 `extra black`, `doubly black`, `red-and-black`이 의미하는 바를 설명하라.
10. `RB-DELETE-FIXUP`의 네 case 중 loop를 반복할 수 있는 case는 무엇이며, 왜 그런가?
11. AVL tree, red-black tree, treap의 균형 유지 방식 차이를 비교하라.
12. Persistent BST에서 path copying이 전체 복사보다 효율적인 이유는 무엇인가?
