---
title: "Chapter 12. Binary Search Trees"
order: 12
pubDatetime: 2026-05-17T00:00:00+09:00
modDatetime: 2026-05-17T00:00:00+09:00
description: "CLRS 알고리즘 정리: Chapter 12. Binary Search Trees"
tags:
  - "Algorithm"
  - "CS"
  - "CLRS"
---

## 개요

Chapter 12는 `binary search tree`를 dynamic set을 저장하는 기본 search tree 구조로 다룬다. Search tree는 `SEARCH`, `MINIMUM`, `MAXIMUM`, `PREDECESSOR`, `SUCCESSOR`, `INSERT`, `DELETE` 같은 dynamic-set operations를 지원하므로 dictionary로도, priority queue의 기반 구조로도 쓸 수 있다.

이 장의 핵심 경고는 간단하다. Binary search tree의 기본 연산 시간은 tree의 node 수가 아니라 `height h`에 비례한다. 같은 key 집합이라도 tree가 균형 있게 생기면 높이가 `Θ(lg n)`이고, 한쪽으로 길게 늘어진 linear chain이 되면 높이가 `Θ(n)`이다. 따라서 plain BST는 자동으로 빠른 구조가 아니라, 입력 순서와 tree shape에 성능이 크게 의존하는 구조다.

이 장은 다음 흐름으로 진행된다.

- `binary-search-tree property`: 왼쪽 subtree key는 작거나 같고, 오른쪽 subtree key는 크거나 같다.
- `inorder tree walk`: BST property를 이용해 key를 sorted order로 출력한다.
- Query operations: `TREE-SEARCH`, `TREE-MINIMUM`, `TREE-MAXIMUM`, `TREE-SUCCESSOR`, `TREE-PREDECESSOR`.
- Update operations: `TREE-INSERT`, `TREE-DELETE`, `TRANSPLANT`.
- `randomly built binary search tree`: 무작위 삽입 순서에서는 expected height가 `O(lg n)`임을 보인다.

## 핵심 개념

| 용어 | 의미 | 검색 키워드 |
| --- | --- | --- |
| binary search tree | 각 node가 최대 두 child를 갖고 BST ordering property를 만족하는 linked tree | binary search tree, BST |
| binary-search-tree property | node `x`의 left subtree key는 `x.key` 이하, right subtree key는 `x.key` 이상 | binary-search-tree property |
| root | tree의 시작 node, parent가 `NIL`인 유일한 node | `T.root`, root |
| node fields | 각 node가 갖는 `key`, satellite data, `left`, `right`, `p` pointer | `x.left`, `x.right`, `x.p` |
| height `h` | root-to-leaf path 길이의 최대값, BST operation time의 기준 | height |
| inorder tree walk | left subtree, root, right subtree 순서로 방문하는 traversal | `INORDER-TREE-WALK` |
| search-tree operations | `SEARCH`, `MINIMUM`, `MAXIMUM`, `PREDECESSOR`, `SUCCESSOR`, `INSERT`, `DELETE` | dynamic-set operations |
| successor | 정렬 순서에서 특정 key 다음 원소 | `TREE-SUCCESSOR` |
| predecessor | 정렬 순서에서 특정 key 이전 원소 | `TREE-PREDECESSOR` |
| transplant | deletion에서 한 subtree를 다른 subtree로 부모 연결에 갈아끼우는 보조 연산 | `TRANSPLANT` |
| randomly built binary search tree | key들을 random order로 삽입해 만든 BST | randomly built binary search tree |

## 세부 정리

### 12.1 What is a binary search tree?

#### Binary search tree의 표현

`binary search tree`는 binary tree를 linked data structure로 표현한다. 각 node는 `key`와 satellite data 외에 세 pointer를 가진다.

| field | 의미 |
| --- | --- |
| `x.left` | node `x`의 left child |
| `x.right` | node `x`의 right child |
| `x.p` | node `x`의 parent |

Child나 parent가 없으면 해당 pointer는 `NIL`이다. Root node는 parent가 `NIL`인 유일한 node이며, tree object `T`는 root를 `T.root`로 가리킨다. Empty tree는 `T.root = NIL`이다.

#### Binary-search-tree property

BST를 BST답게 만드는 조건은 `binary-search-tree property`다.

```text
For any node x:
  if y is in the left subtree of x, then y.key <= x.key
  if y is in the right subtree of x, then y.key >= x.key
```

즉 `x`를 기준으로 왼쪽 subtree에는 `x.key` 이하의 key만, 오른쪽 subtree에는 `x.key` 이상의 key만 온다. 이 조건은 root에서만 성립하면 되는 것이 아니라 모든 node에 대해 재귀적으로 성립해야 한다. CLRS의 부등호가 `<=`, `>=`인 점도 중요하다. Plain BST 정의 자체는 duplicate keys를 배제하지 않으며, 같은 key를 어느 방향에 둘지는 구현 정책과 이후 문제에서 다시 다룬다.

![Figure 12.1](@/assets/images/049_figure_12-1_page_308.png)
*Figure 12.1 · PDF p. 308 · 같은 key 집합도 height가 다른 binary search tree로 표현될 수 있음을 보여주는 예*

Figure 12.1의 두 tree는 같은 key 집합 `{2, 5, 5, 6, 7, 8}`을 저장하지만 모양이 다르다. (a)는 height 2이고, (b)는 height 4인 덜 효율적인 모양이다. 이 그림이 말하는 것은 “BST property가 정렬 관계는 보장하지만 balance는 보장하지 않는다”는 점이다. 그래서 대부분의 search-tree operation의 worst-case running time은 node 수 `n`보다 height `h`에 의해 결정된다.

#### Inorder tree walk

BST property는 key를 sorted order로 출력하는 아주 단순한 traversal을 가능하게 한다. `inorder tree walk`는 subtree의 root를 왼쪽 subtree와 오른쪽 subtree 사이에 방문한다.

```text
INORDER-TREE-WALK(x)
1  if x != NIL
2      INORDER-TREE-WALK(x.left)
3      print x.key
4      INORDER-TREE-WALK(x.right)
```

Tree `T`의 모든 key를 출력하려면 `INORDER-TREE-WALK(T.root)`를 호출한다. Figure 12.1의 두 tree 모두 inorder walk 결과는 `2, 5, 5, 6, 7, 8`이다. 왼쪽 subtree의 모든 key가 root 이하이고, 오른쪽 subtree의 모든 key가 root 이상이므로, `left -> root -> right` 순서가 전체 sorted order와 정확히 맞아떨어진다.

`preorder tree walk`는 root를 두 subtree보다 먼저 출력하고, `postorder tree walk`는 root를 두 subtree보다 나중에 출력한다. 하지만 BST에서 sorted order가 필요한 경우에는 root를 중간에 두는 `inorder`가 핵심이다.

#### Theorem 12.1: Inorder walk의 running time

`Theorem 12.1`은 node `x`가 `n`-node subtree의 root일 때 `INORDER-TREE-WALK(x)`가 `Θ(n)` time을 쓴다고 말한다.

핵심 이유는 두 가지다.

- Lower bound: 모든 node의 key를 실제로 출력해야 하므로 적어도 `Ω(n)`이다.
- Upper bound: 각 non-NIL node에서 constant work를 하고, 각 node의 left child와 right child에 대해 정확히 두 번의 recursive call이 발생한다. Empty subtree 호출도 constant time이다.

CLRS의 proof는 recurrence를 세운다. 왼쪽 subtree가 `k`개 node를 갖고 오른쪽 subtree가 `n-k-1`개 node를 가지면,

```text
T(n) <= T(k) + T(n-k-1) + d
T(0) = c
```

이고 substitution method로 `T(n) <= (c+d)n + c`를 보여 `O(n)`을 얻는다. 따라서 전체적으로 `Θ(n)`이다. 중요한 결론은 inorder walk의 시간은 tree height에 의존하는 query/update operation과 달리, 모든 node를 방문해야 하므로 tree shape와 무관하게 linear time이라는 점이다.

#### 12.1 Exercises에서 남길 포인트

`binary-search-tree property`와 `min-heap property`는 둘 다 tree 위의 ordering constraint지만 성격이 다르다. BST는 각 node의 왼쪽/오른쪽 subtree 전체에 대해 상대적 순서를 보장하므로 inorder walk만으로 sorted order가 나온다. 반면 `min-heap property`는 parent가 children보다 작다는 국소 조건이므로, left subtree 전체가 root와 right subtree 사이에 온다는 보장이 없다. 따라서 heap에서 sorted order를 얻으려면 반복적으로 minimum을 꺼내는 `HEAPSORT` 같은 추가 과정이 필요하다.

또한 arbitrary list에서 comparison-based 방식으로 BST를 만들어 그 inorder traversal이 sorted list가 되게 하려면, 결과적으로 comparison sorting을 수행하는 것과 같으므로 worst case `Ω(n lg n)` lower bound를 피할 수 없다.

### 12.2 Querying a binary search tree

BST에서 query operation은 `SEARCH`, `MINIMUM`, `MAXIMUM`, `SUCCESSOR`, `PREDECESSOR`다. 이 절의 목표는 높이가 `h`인 임의의 BST에서 각 query를 `O(h)` time에 수행할 수 있음을 보이는 것이다.

![Figure 12.2](@/assets/images/050_figure_12-2_page_311.png)
*Figure 12.2 · PDF p. 311 · BST에서 search path, minimum/maximum, successor case를 보여주는 query 예*

#### Searching

`TREE-SEARCH(x, k)`는 subtree root `x`와 key `k`를 받아, key `k`를 가진 node pointer를 반환한다. 없으면 `NIL`을 반환한다.

```text
TREE-SEARCH(x, k)
1  if x == NIL or k == x.key
2      return x
3  if k < x.key
4      return TREE-SEARCH(x.left, k)
5  else return TREE-SEARCH(x.right, k)
```

Search는 root에서 시작해 simple path 하나만 따라 내려간다. 현재 node `x`에서 `k == x.key`이면 끝난다. `k < x.key`이면 BST property상 `k`는 right subtree에 있을 수 없으므로 left subtree로 내려간다. `k > x.key`이면 반대로 right subtree로 내려간다.

Figure 12.2에서 key `13`을 찾을 때 path는 `15 -> 6 -> 7 -> 13`이다. 이처럼 방문 node들은 root에서 아래로 향하는 하나의 simple path를 이루므로 running time은 `O(h)`이다.

Recursive search는 iterative version으로 바꿀 수 있다. 대부분의 실제 machine에서는 recursive call overhead가 없어 iterative version이 더 효율적이다.

```text
ITERATIVE-TREE-SEARCH(x, k)
1  while x != NIL and k != x.key
2      if k < x.key
3          x = x.left
4      else x = x.right
5  return x
```

#### Minimum and maximum

BST에서 minimum은 계속 left child pointer를 따라가면 나온다. 어떤 node `x`에 left subtree가 없으면, `x`의 right subtree에 있는 key는 모두 `x.key` 이상이므로 `x`가 그 subtree의 minimum이다. Left subtree가 있다면, root `x`나 right subtree보다 더 작은 key는 left subtree 안에만 있을 수 있다.

```text
TREE-MINIMUM(x)
1  while x.left != NIL
2      x = x.left
3  return x
```

Maximum은 완전히 대칭적으로 right child pointer를 따라간다.

```text
TREE-MAXIMUM(x)
1  while x.right != NIL
2      x = x.right
3  return x
```

Figure 12.2에서 minimum key는 root에서 left pointer를 따라가 얻는 `2`이고, maximum key는 right pointer를 따라가 얻는 `20`이다. `TREE-MINIMUM`과 `TREE-MAXIMUM`도 한 방향 simple path만 따라가므로 `O(h)` time이다.

#### Successor and predecessor

Node `x`의 `successor`는 inorder sorted order에서 `x` 다음에 오는 node다. Key가 모두 distinct라면 `x.key`보다 큰 key 중 가장 작은 key를 가진 node다. BST에서는 successor를 찾을 때 key comparison을 새로 할 필요가 없다. Tree 구조와 parent pointer만 이용한다.

```text
TREE-SUCCESSOR(x)
1  if x.right != NIL
2      return TREE-MINIMUM(x.right)
3  y = x.p
4  while y != NIL and x == y.right
5      x = y
6      y = y.p
7  return y
```

Successor는 두 경우로 나뉜다.

| 경우 | successor |
| --- | --- |
| `x.right != NIL` | `x`의 right subtree에서 가장 작은 node, 즉 `TREE-MINIMUM(x.right)` |
| `x.right == NIL` | 위로 올라가다가 처음으로 “현재 node가 parent의 left subtree 쪽에 놓이는” ancestor |

첫 번째 경우는 쉽다. Right subtree의 모든 key는 `x.key` 이상이고, 그중 가장 작은 key가 바로 `x` 다음이다. Figure 12.2에서 key `15`의 successor는 right subtree minimum인 `17`이다.

두 번째 경우에는 `x`보다 큰 key를 찾기 위해 parent 방향으로 올라간다. `x`가 계속 어떤 ancestor의 right child 쪽에 있으면, 그 ancestor의 key는 이미 `x`보다 작거나 같으므로 successor가 될 수 없다. 처음으로 `x`가 ancestor `y`의 left subtree에 속하게 되는 지점의 `y`가 successor다. Figure 12.2에서 key `13`은 right subtree가 없고, 가장 낮은 적절한 ancestor가 `15`이므로 successor는 `15`다.

`TREE-PREDECESSOR`는 대칭적이다. Left subtree가 있으면 `TREE-MAXIMUM(x.left)`이고, left subtree가 없으면 위로 올라가다가 처음으로 현재 node가 parent의 right subtree 쪽에 놓이는 ancestor를 찾는다.

CLRS는 key가 distinct하지 않아도 `successor`와 `predecessor`를 각각 `TREE-SUCCESSOR(x)`, `TREE-PREDECESSOR(x)`가 반환하는 node로 정의한다. 즉 duplicate key가 있을 때 “값이 엄격히 큰 다음 key”라는 설명은 조심해야 하고, 실제 정의는 tree position과 traversal order에 묶여 있다.

#### Theorem 12.2: Query operations의 running time

`Theorem 12.2`는 BST height가 `h`일 때 다음 dynamic-set query operations가 모두 `O(h)` time에 구현된다고 정리한다.

- `SEARCH`
- `MINIMUM`
- `MAXIMUM`
- `SUCCESSOR`
- `PREDECESSOR`

공통 이유는 모든 절차가 downward path, upward path, 또는 둘의 짧은 조합 하나만 따라가기 때문이다. 이 절의 `O(h)`는 balance 보장이 아니라 path length에 대한 bound다. 따라서 tree가 linear chain이면 `h = Θ(n)`이 되어 query도 worst case `Θ(n)`까지 나빠진다.

#### 12.2 Exercises에서 남길 포인트

Search path 검증 문제는 BST에서 이동할 때 가능한 key interval이 계속 좁아진다는 사실을 이용한다. 예를 들어 어떤 node에서 왼쪽으로 내려갔다면 이후 key는 그 node보다 작아야 하고, 오른쪽으로 내려갔다면 그 node보다 커야 한다. 따라서 search path는 단순히 “숫자가 목표에 가까워지는 순서”가 아니라, 지금까지 만난 ancestors가 만든 lower bound와 upper bound를 모두 만족해야 한다.

`TREE-SUCCESSOR`를 반복 호출해 inorder order를 만들면 각 호출이 개별적으로는 `O(h)`이지만 전체 traversal은 `Θ(n)`이 될 수 있다. 각 edge가 아래로 내려가거나 위로 올라가는 방향으로 전체 과정에서 제한된 횟수만 지나가기 때문이다. 이 관찰은 amortized reasoning의 작은 예고편이다.

### 12.3 Insertion and deletion

`INSERT`와 `DELETE`는 BST가 표현하는 dynamic set 자체를 바꾸는 update operations다. 따라서 단순히 node를 찾는 것으로 끝나지 않고, pointer를 고쳐도 `binary-search-tree property`가 유지되어야 한다. Insertion은 search가 실패한 `NIL` 위치에 새 node를 붙이면 되므로 비교적 직접적이다. Deletion은 삭제 node의 children 수와 successor 위치에 따라 pointer 재배치가 달라져 더 섬세하다.

#### TREE-INSERT

`TREE-INSERT(T, z)`는 key가 이미 `z.key`에 들어 있고, `z.left = NIL`, `z.right = NIL`인 새 node `z`를 BST `T`에 삽입한다.

```text
TREE-INSERT(T, z)
1   y = NIL
2   x = T.root
3   while x != NIL
4       y = x
5       if z.key < x.key
6           x = x.left
7       else x = x.right
8   z.p = y
9   if y == NIL
10      T.root = z
11  elseif z.key < y.key
12      y.left = z
13  else y.right = z
```

`x`는 현재 내려가고 있는 node이고, `y`는 `x`의 parent를 추적하는 trailing pointer다. Search처럼 root에서 시작해 `z.key`와 현재 key를 비교하며 left 또는 right로 내려간다. 결국 `x`가 `NIL`이 되면 그 자리가 새 node가 들어갈 leaf position이다. 이미 `x`는 `NIL`이라 parent를 알 수 없으므로, 한 단계 뒤를 따라오던 `y`가 필요하다.

![Figure 12.3](@/assets/images/051_figure_12-3_page_316.png)
*Figure 12.3 · PDF p. 316 · key 13을 삽입할 위치까지 내려가는 path와 새 link*

Figure 12.3에서 lightly shaded nodes는 root에서 insertion position까지 내려간 simple path를 나타낸다. Dashed line은 삽입으로 새로 추가되는 parent-child link다. 삽입도 하나의 downward path만 따라가므로 `O(h)` time이다.

#### Deletion의 세 기본 상황

Node `z`를 BST에서 삭제할 때는 `z`의 children 수가 핵심이다.

| 상황 | 처리 아이디어 |
| --- | --- |
| `z` has no children | parent가 `z` 대신 `NIL`을 child로 가리키게 한다 |
| `z` has one child | `z`의 child를 들어 올려 `z`의 자리를 차지하게 한다 |
| `z` has two children | `z`의 successor `y`를 찾아 `z`의 자리로 옮긴다 |

두 child가 있는 경우가 까다롭다. Successor `y`는 `z`의 right subtree 안에 있고, right subtree의 minimum이므로 left child가 없다. `y`를 현재 자리에서 빼내고 `z`의 자리로 옮기되, `z.left`와 `z.right`가 올바르게 `y`에게 붙어야 한다. 특히 `y`가 바로 `z.right`인지, 아니면 `z.right` subtree 안쪽에 있는지에 따라 필요한 pointer 조정이 달라진다.

#### TRANSPLANT

CLRS는 subtree를 갈아끼우는 보조 연산 `TRANSPLANT(T, u, v)`를 정의한다. 이 연산은 subtree root `u`가 parent에게 연결되어 있던 자리를 subtree root `v`로 대체한다.

```text
TRANSPLANT(T, u, v)
1  if u.p == NIL
2      T.root = v
3  elseif u == u.p.left
4      u.p.left = v
5  else u.p.right = v
6  if v != NIL
7      v.p = u.p
```

`u`가 root이면 `T.root`를 `v`로 바꾼다. 그렇지 않으면 `u`가 parent의 left child였는지 right child였는지에 따라 parent의 해당 pointer를 `v`로 바꾼다. `v`가 `NIL`이 아니면 `v.p`도 `u.p`로 갱신한다.

주의할 점은 `TRANSPLANT`가 `v.left`와 `v.right`를 건드리지 않는다는 것이다. Subtree 내부 구조를 어떻게 붙일지는 `TRANSPLANT`의 caller가 책임진다. 이 제한 덕분에 `TRANSPLANT`는 parent 연결을 바꾸는 작은 primitive로 남고, 삭제의 각 case에서 필요한 child pointer 조정이 명시적으로 드러난다.

#### TREE-DELETE

```text
TREE-DELETE(T, z)
1   if z.left == NIL
2       TRANSPLANT(T, z, z.right)
3   elseif z.right == NIL
4       TRANSPLANT(T, z, z.left)
5   else y = TREE-MINIMUM(z.right)
6       if y.p != z
7           TRANSPLANT(T, y, y.right)
8           y.right = z.right
9           y.right.p = y
10      TRANSPLANT(T, z, y)
11      y.left = z.left
12      y.left.p = y
```

![Figure 12.4](@/assets/images/052_figure_12-4_page_318.png)
*Figure 12.4 · PDF p. 318 · BST node deletion의 네 가지 pointer 재배치 case*

CLRS의 code는 deletion을 다음 네 case로 조직한다.

| code case | 그림 | 의미 | 처리 |
| --- | --- | --- | --- |
| `z.left == NIL` | Figure 12.4(a) | left child가 없음. right child도 없으면 leaf deletion, 있으면 right-only deletion | `TRANSPLANT(T, z, z.right)` |
| `z.right == NIL` | Figure 12.4(b) | left child만 있음 | `TRANSPLANT(T, z, z.left)` |
| two children, `y == z.right` | Figure 12.4(c) | successor가 바로 right child | `z`를 `y`로 대체하고 `y.left = z.left` |
| two children, `y != z.right` | Figure 12.4(d) | successor가 right subtree 내부에 있음 | 먼저 `y`를 `y.right`로 대체한 뒤, `y`를 `z` 자리로 옮김 |

두 children case에서 `y = TREE-MINIMUM(z.right)`인 이유는 successor가 `z`보다 큰 key 중 가장 작은 key여야 하기 때문이다. `y`는 right subtree의 minimum이므로 left child가 없다. 그래서 `y`를 원래 자리에서 제거할 때 `y.right`만 위로 올리면 된다.

`y.p != z`인 경우 line 7-9가 먼저 `y`를 원래 자리에서 빼낸다.

```text
TRANSPLANT(T, y, y.right)
y.right = z.right
y.right.p = y
```

이 단계가 필요한 이유는 `y`가 `z.right` subtree 내부에 있었기 때문이다. `y`를 빼낸 뒤에도 `z`의 원래 right subtree 전체가 `y.right`로 붙어야 한다. 이후 line 10-12가 `z`를 `y`로 대체하고 left subtree를 붙인다.

```text
TRANSPLANT(T, z, y)
y.left = z.left
y.left.p = y
```

`y == z.right`이면 line 7-9를 건너뛴다. 이미 `y.right`는 그대로 두면 되고, `y`가 `z`의 자리를 차지한 뒤 `z.left`만 `y.left`로 붙이면 된다.

#### Theorem 12.3: Insert/Delete의 running time

`Theorem 12.3`은 BST height가 `h`일 때 `INSERT`와 `DELETE`를 각각 `O(h)` time에 구현할 수 있다고 말한다.

- `TREE-INSERT`는 root에서 insertion position까지 내려가는 simple path 하나를 따라가므로 `O(h)`이다.
- `TREE-DELETE`는 대부분 constant pointer manipulation이고, 두 children case에서 필요한 `TREE-MINIMUM(z.right)`만 `O(h)`이다.
- `TRANSPLANT` 자체는 parent/child pointer 몇 개만 바꾸므로 `O(1)`이다.

따라서 update operation도 query operation과 마찬가지로 tree shape가 성능을 결정한다. Balanced shape면 `O(lg n)`에 가깝고, linear chain이면 `O(n)`까지 나빠진다.

#### 12.3 Exercises에서 남길 포인트

BST에 distinct values를 반복 삽입해 만든 뒤 어떤 value를 search하면, search에서 검사하는 node 수는 그 value를 처음 삽입할 때 검사한 node 수보다 정확히 하나 많다. 삽입 당시에는 새 node가 들어갈 `NIL` 위치까지 내려가고, 이후 search는 그 `NIL` 대신 실제 node를 만나 끝나기 때문이다.

BST sort는 `TREE-INSERT`를 반복해 tree를 만들고 `INORDER-TREE-WALK`로 출력하는 sorting method다. Best case에는 삽입 순서가 tree를 균형 있게 만들어 build가 `Θ(n lg n)`이고 inorder walk가 `Θ(n)`이라 전체 `Θ(n lg n)`이다. Worst case에는 삽입 순서가 chain을 만들어 build가 `Θ(n^2)`이고, inorder walk까지 합쳐도 `Θ(n^2)`이다.

Deletion은 일반적으로 commutative하지 않다. 두 node를 어떤 순서로 삭제하느냐에 따라 successor를 끌어올리는 위치와 이후 subtree shape가 달라질 수 있기 때문이다. 또한 두 children case에서 successor 대신 predecessor를 쓰는 대칭적인 deletion도 가능하며, predecessor와 successor를 번갈아 또는 무작위로 선택하는 fair strategy는 한쪽 방향으로만 bias가 누적되는 것을 줄이려는 경험적 개선 아이디어다.

### 12.4 Randomly built binary search trees

지금까지 BST 기본 연산은 모두 `O(h)` time이었다. 따라서 남은 핵심 질문은 height `h`가 얼마나 커지는가다. `n`개 key를 strictly increasing order로 삽입하면 tree는 height `n-1`인 chain이 된다. 반대로 어떤 binary tree든 height는 적어도 `⌊lg n⌋` 이상이다. 평균적 동작은 quicksort처럼 worst case보다 best case에 훨씬 가깝다.

CLRS는 분석을 단순화하기 위해 insertion만으로 만들어진 tree를 다룬다. `randomly built binary search tree`는 initially empty tree에 `n`개 distinct keys를 random order로 삽입해 얻은 BST다. 여기서 모든 `n!`개의 input permutations가 equally likely라고 가정한다.

중요한 구분이 있다. Randomly built BST는 “모든 n-node BST shape가 equally likely”라는 뜻이 아니다. 삽입 순서가 만드는 shape distribution은 shape마다 대응되는 permutation 수가 다르기 때문에 uniform random tree shape와 다르다.

#### Theorem 12.4: Randomly built BST의 expected height

`Theorem 12.4`는 `n`개 distinct keys로 만든 randomly built binary search tree의 expected height가 `O(lg n)`이라고 말한다.

증명의 큰 흐름은 height를 직접 다루기보다 exponential height를 다룬 뒤 logarithm으로 되돌아오는 것이다.

| 기호 | 의미 |
| --- | --- |
| `X_n` | `n`개 key로 만든 randomly built BST의 height |
| `Y_n = 2^{X_n}` | exponential height |
| `R_n` | root key의 rank, 즉 sorted order에서 root가 몇 번째 key인지 |
| `Z_{n,i} = I{R_n = i}` | root rank가 `i`인지 나타내는 indicator random variable |

Root는 random insertion order의 첫 key이므로 rank `R_n`은 `{1, 2, ..., n}`에서 균등하다. 만약 `R_n = i`이면 left subtree는 rank가 작은 `i-1`개 key로, right subtree는 rank가 큰 `n-i`개 key로 randomly built BST가 된다. Height는 두 subtree height 중 큰 값에 1을 더한 것이므로 exponential height는 다음처럼 쓸 수 있다.

```text
Y_n = 2 * max(Y_{i-1}, Y_{n-i})   when R_n = i
Y_1 = 1,  Y_0 = 0
```

Indicator를 이용하면 한 식으로 묶을 수 있다.

```text
Y_n = Σ_{i=1}^n Z_{n,i} * (2 * max(Y_{i-1}, Y_{n-i}))
E[Z_{n,i}] = 1/n                         (12.1)
```

`Z_{n,i}`는 root rank 선택을 나타내고, left/right subtree의 내부 random shape는 해당 rank가 정해진 뒤에도 같은 크기의 randomly built BST처럼 분포한다. 이 독립성과 linearity of expectation을 이용해,

```text
E[Y_n]
  <= (2/n) Σ_{i=1}^n (E[Y_{i-1}] + E[Y_{n-i}])
  =  (4/n) Σ_{i=0}^{n-1} E[Y_i]          (12.2)
```

를 얻는다. 이후 substitution method와 조합 항등식

```text
Σ_{i=0}^{n-1} C(i+3, 3) = C(n+3, 4)      (12.3)
```

을 이용해

```text
E[Y_n] <= (1/4) * C(n+3, 3)
```

임을 보인다. 오른쪽은 `Θ(n^3)`인 polynomial bound다.

마지막 단계에서 Jensen's inequality를 쓴다. `f(x) = 2^x`는 convex이므로,

```text
2^{E[X_n]} <= E[2^{X_n}] = E[Y_n] <= (1/4) * C(n+3, 3) = O(n^3)
```

양변에 logarithm을 취하면

```text
E[X_n] = O(lg n)
```

이 된다. 이 증명의 미묘한 점은 `E[X_n]`를 직접 recurrence로 잡지 않고 `E[2^{X_n}]`를 polynomial로 억제한 뒤 convexity로 height expectation을 끌어낸다는 것이다.

#### 12.4 Exercises에서 남길 포인트

Average depth가 `Θ(lg n)`이어도 height가 반드시 `Θ(lg n)`인 것은 아니다. 대부분의 node가 얕은 곳에 있고, 소수 node만 긴 tail을 이루면 average depth는 작게 유지되면서 height는 더 커질 수 있다. 따라서 average depth bound와 height bound는 같은 말이 아니다.

`randomly built binary search tree`와 uniformly chosen BST shape의 차이는 `n = 3`만 보아도 드러난다. 같은 shape라도 몇 개의 insertion permutations가 그 shape를 만드는지 다르기 때문에, 삽입 순서가 균등하다고 해서 shape가 균등해지지 않는다.

Randomized quicksort와 randomly built BST는 같은 구조를 공유한다. Quicksort는 random pivot이 set을 left/right partition으로 나누고, BST 삽입에서는 root가 된 첫 key가 나머지 key를 left/right subtree로 나눈다. 각 node가 그 subtree에 들어온 key set을 partition한다는 점에서 두 분석의 recurrence가 닮아 있다.

### Problems for Chapter 12

#### 12-1 Binary search trees with equal keys

Equal keys는 plain `TREE-INSERT`에서 나쁜 shape를 만들기 쉽다. CLRS pseudocode는 `z.key < x.key`가 아니면 right로 가므로, identical keys를 계속 삽입하면 모두 한쪽으로 이어진 chain이 되어 총 insertion time이 `Θ(n^2)`가 된다.

개선 전략은 다음처럼 비교할 수 있다.

| strategy | 핵심 아이디어 | identical keys 삽입 성능 감각 |
| --- | --- | --- |
| alternating boolean flag `x.b` | 같은 key를 만날 때 left/right를 번갈아 선택 | 더 균형 잡힌 shape를 유도해 height를 낮춤 |
| equal-key list at `x` | 같은 key node들을 tree 아래로 내려보내지 않고 한 node의 list에 저장 | tree height 증가를 막아 insertion이 빠름 |
| random left/right | 같은 key에서 left/right를 random 선택 | worst case는 여전히 나쁠 수 있지만 expected behavior는 균형에 가까워짐 |

핵심은 “BST property가 duplicate keys를 허용한다”와 “duplicate keys를 어떻게 배치할지는 성능에 큰 영향을 준다”를 분리해서 보는 것이다.

#### 12-2 Radix trees

`radix tree`는 문자열, 특히 bit strings를 lexicographic order로 정렬할 때 등장하는 tree 구조다. Depth `i`의 node에서 key의 `i`번째 bit가 `0`이면 left, `1`이면 right로 간다. Node 자체에 key 문자열을 저장하지 않아도 root에서 그 node까지의 path가 key를 결정한다.

![Figure 12.5](@/assets/images/053_figure_12-5_page_326.png)
*Figure 12.5 · PDF p. 326 · bit strings를 path로 표현하는 radix tree 예*

Figure 12.5는 bit strings `1011`, `10`, `011`, `100`, `0`을 저장한다. Heavily shaded nodes는 실제 key가 아니라 다른 key로 가는 path를 만들기 위해 필요한 내부 node다. Lexicographic sort는 radix tree를 왼쪽부터 traversal하면서 실제 key가 있는 node를 출력하면 된다. 모든 string 길이의 합이 `n`이면 tree를 만들고 traversal하는 총 작업도 `Θ(n)` time에 가능하다.

#### 12-3 Average node depth in a randomly built BST

이 문제는 Theorem 12.4보다 약한 결과인 average node depth `O(lg n)`을 보인다. `P(T)`를 tree `T`의 total path length, 즉 모든 node depth의 합이라고 하면 average depth는 `P(T)/n`이다.

Left/right subtrees를 `T_L`, `T_R`라 할 때, root를 제외한 모든 node는 subtree 안에서보다 depth가 1 증가하므로

```text
P(T) = P(T_L) + P(T_R) + n - 1
```

이다. Root rank가 균등하다는 사실을 쓰면 expected total path length `P(n)`에 대해 quicksort와 같은 모양의 recurrence가 나온다.

```text
P(n) = (1/n) Σ_{i=0}^{n-1} (P(i) + P(n-i-1) + n - 1)
     = (2/n) Σ_{k=1}^{n-1} P(k) + Θ(n)
```

따라서 `P(n) = O(n lg n)`이고 average depth는 `O(lg n)`이다. 이는 random pivot quicksort의 comparison recurrence와 본질적으로 같은 구조다.

#### 12-4 Number of different binary trees

`b_n`을 `n`개 node를 가진 서로 다른 binary tree 수라고 하자. Root의 left subtree 크기가 `k`이면 right subtree 크기는 `n-1-k`이므로,

```text
b_0 = 1
b_n = Σ_{k=0}^{n-1} b_k b_{n-1-k}
```

를 얻는다. Generating function `B(x) = Σ_{n=0}^{∞} b_n x^n`를 쓰면

```text
B(x) = xB(x)^2 + 1
B(x) = (1 - sqrt(1 - 4x)) / (2x)
```

이고 coefficient는 Catalan number다.

```text
b_n = (1/(n+1)) * C(2n, n)
b_n = 4^n / sqrt(π n^3) * (1 + O(1/n))
```

BST shape 수가 Catalan scale로 폭발적으로 많다는 사실은 “randomly built”와 “uniform over all tree shapes”를 구분해야 하는 이유와도 연결된다.

### Chapter notes

Radix trees는 흔히 `tries`라고도 부르며, retrieval의 가운데 글자에서 온 이름이다. BST deletion에는 더 단순한 구현도 있다. 두 children을 가진 node `z`를 삭제할 때 successor `y`의 key와 satellite data를 `z`에 복사하고 실제로는 `y`를 삭제하는 방식이다. 하지만 이 방식은 delete procedure에 넘긴 node `z` 자체가 삭제되지 않을 수 있다. 다른 program component가 tree node pointer를 들고 있다면 stale pointer 문제가 생길 수 있다. CLRS 3판의 `TREE-DELETE`는 조금 더 복잡하지만, 호출자가 삭제하라고 넘긴 node `z`를 정확히 삭제한다는 장점이 있다.

뒤의 Section 15.5는 search frequency를 미리 알고 있을 때 expected search cost를 최소화하는 `optimal binary search tree`를 다룬다. Chapter 13의 `red-black trees`는 이 장의 plain BST가 갖는 height 의존성을 worst-case `O(lg n)`으로 보장하는 균형 search tree다.

## 복잡도

| Operation / 구조 | Running time | 이유 |
| --- | --- | --- |
| `INORDER-TREE-WALK` | `Θ(n)` | 모든 node를 한 번씩 방문하고 출력 |
| `TREE-SEARCH` | `O(h)` | root에서 아래로 simple path 하나를 따라감 |
| `ITERATIVE-TREE-SEARCH` | `O(h)` | recursive search와 같은 path, call overhead만 줄임 |
| `TREE-MINIMUM` / `TREE-MAXIMUM` | `O(h)` | left 또는 right pointer만 따라감 |
| `TREE-SUCCESSOR` / `TREE-PREDECESSOR` | `O(h)` | 내려가거나 parent pointer로 올라가는 path |
| `TREE-INSERT` | `O(h)` | 삽입 위치까지 downward path를 따라감 |
| `TRANSPLANT` | `O(1)` | parent/child pointer 상수 개만 수정 |
| `TREE-DELETE` | `O(h)` | successor를 찾는 `TREE-MINIMUM`이 지배 |
| randomly built BST expected height | `O(lg n)` | Theorem 12.4 |
| worst-case BST height | `Θ(n)` | increasing order insertion 등으로 chain 가능 |

## 연결 관계

- Chapter 10의 linked representation과 pointer fields가 BST node 표현의 기반이다.
- Chapter 11의 dictionary operations `INSERT`, `SEARCH`, `DELETE`를 tree 기반으로 구현하는 장이 Chapter 12다.
- Chapter 7의 `RANDOMIZED-QUICKSORT`와 randomly built BST는 random root/pivot이 set을 partition한다는 점에서 같은 recurrence 구조를 공유한다.
- Chapter 13의 `red-black trees`는 plain BST의 height가 입력 순서에 취약하다는 문제를 worst-case balance guarantee로 해결한다.
- Chapter 15.5의 `optimal binary search tree`는 key별 search frequency를 알고 있을 때 평균 search cost가 최소가 되도록 BST를 설계한다.

## 오해하기 쉬운 내용

- BST는 자동으로 balanced tree가 아니다. `binary-search-tree property`는 ordering만 보장하고 height는 보장하지 않는다.
- `inorder tree walk`는 sorted order를 주지만, query/update operation이 빠르다는 뜻은 아니다. Query/update는 `height h`에 묶인다.
- `successor`는 항상 parent가 아니다. Right subtree가 있으면 right subtree의 minimum이고, 없을 때만 ancestor 방향으로 올라간다.
- `TRANSPLANT`는 subtree root의 parent 연결만 바꾼다. `v.left`, `v.right` 재배치는 caller가 직접 해야 한다.
- Two-child deletion에서 successor `y`는 left child가 없다. 그래서 `y`를 원래 자리에서 뺄 때 `y.right`만 고려하면 된다.
- Randomly built BST는 uniform random BST shape가 아니다. Random insertion permutation에서 온 distribution이다.
- Duplicate keys는 정의상 가능하지만, 배치 정책을 잘못 잡으면 identical keys만으로도 chain이 만들어진다.

## 면접 질문

1. `binary-search-tree property`를 정확히 말하고, duplicate keys가 있을 때 어떤 점을 조심해야 하는가?
2. 같은 key set을 저장하는 두 BST의 operation time이 달라질 수 있는 이유는 무엇인가?
3. `INORDER-TREE-WALK`가 sorted order를 출력하는 이유를 induction 관점에서 설명하라.
4. `TREE-SEARCH`의 recursive version과 iterative version은 어떤 path를 따라가며, 왜 `O(h)`인가?
5. `TREE-MINIMUM`과 `TREE-MAXIMUM`이 단순히 left/right pointer만 따라가도 되는 이유는 무엇인가?
6. `TREE-SUCCESSOR`에서 right subtree가 있는 경우와 없는 경우를 나누어 설명하라.
7. `TRANSPLANT(T, u, v)`가 바꾸는 pointer와 바꾸지 않는 pointer는 무엇인가?
8. `TREE-DELETE`에서 삭제 node가 two children을 가질 때 successor를 사용하는 이유는 무엇인가?
9. Randomly built BST의 expected height가 `O(lg n)`이라는 증명의 핵심 random variables `X_n`, `Y_n`, `R_n`은 무엇인가?
10. Randomized quicksort와 randomly built BST의 분석이 닮은 이유는 무엇인가?
