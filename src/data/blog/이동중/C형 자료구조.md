---
title: "C형 자료구조"
order: 1
pubDatetime: 2026-09-02T20:20:42+09:00
modDatetime: 2026-09-02T20:20:46+09:00
description: ""
tags:
  - general
---
# C형 시험용 자료구조 최소 템플릿

> 목표: STL을 사용할 수 없는 시험장에서, 구현 방식을 하나로 통일해 바로 작성한다.

## 0. 시험장에서 지킬 원칙

1. 최대 크기를 보고 전역 배열을 미리 선언한다.
2. 동적 할당 대신 `배열 + 현재 크기` 또는 `배열 + 노드 개수`를 쓴다.
3. 정렬은 **병합 정렬** 하나로 통일한다.
4. 우선순위 큐는 **이진 최소 힙** 하나를 외우고 비교 함수만 바꾼다.
5. 해시는 **분리 연결법 + 배열 노드 풀**로 통일한다.
6. 그래프는 **간선 배열 + head 배열**로 통일한다.
7. 최대 크기 상수는 반드시 문제의 총 삽입 횟수까지 계산해서 정한다.

## 1. 어떤 구조를 고를까

| 필요한 기능 | 시험용 대표 구조 | 주요 복잡도 |
|---|---|---|
| 끝에 추가하고 인덱스로 접근 | 배열 + `size` | 추가 `O(1)`, 접근 `O(1)` |
| 마지막에 넣은 값부터 꺼내기 | 배열 스택 | `O(1)` |
| 먼저 넣은 값부터 꺼내기 | 원형 큐 | `O(1)` |
| 최솟값을 계속 꺼내기 | 이진 최소 힙 | 삽입·삭제 `O(log N)` |
| 키로 값을 빠르게 찾기 | 체이닝 해시 | 평균 `O(1)` |
| 그룹 합치기·같은 그룹 확인 | Union-Find | 거의 `O(1)` |
| 그래프의 연결 간선 저장 | 간선 배열 인접 리스트 | 전체 순회 `O(V+E)` |
| 문자열 접두사 탐색 | Trie | `O(문자열 길이)` |
| 점 갱신 + 구간합 | Fenwick Tree | `O(log N)` |
| 다양한 구간 정보·조건 탐색 | Segment Tree | `O(log N)` |
| 정렬 | Merge Sort | 항상 `O(N log N)` |
| 정렬 배열에서 경계 찾기 | Binary Search | `O(log N)` |

---

# 기본 컨테이너

## 2. `vector` 대체: 배열 + size

자동으로 용량이 늘어나는 기능만 없을 뿐, 시험에서는 보통 이것으로 충분하다.

```cpp
#define MAXN 100000

struct ArrayList {
    int data[MAXN];
    int size;

    void init() {
        size = 0;
    }

    void pushBack(int value) {
        data[size++] = value;
    }

    void popBack() {
        size--;
    }

    int back() {
        return data[size - 1];
    }
};
```

핵심 대응만 기억하면 된다.

| STL | 배열 방식 |
|---|---|
| `v.push_back(x)` | `v[vSize++] = x` |
| `v.pop_back()` | `vSize--` |
| `v.back()` | `v[vSize - 1]` |
| `v.size()` | `vSize` |
| `v[i]` | `v[i]` |

## 3. Stack: 배열 스택

```cpp
#define MAXN 100000

struct Stack {
    int data[MAXN];
    int size;

    void init() {
        size = 0;
    }

    void push(int value) {
        data[size++] = value;
    }

    void pop() {
        size--;
    }

    int top() {
        return data[size - 1];
    }

    bool empty() {
        return size == 0;
    }
};
```

## 4. Queue: 원형 큐

단순 BFS 전용 선형 큐보다 재사용이 쉬운 원형 큐 하나로 통일한다.

```cpp
#define MAXN 100000

struct Queue {
    int data[MAXN];
    int front;
    int rear;
    int count;

    void init() {
        front = 0;
        rear = 0;
        count = 0;
    }

    void push(int value) {
        data[rear] = value;
        rear = (rear + 1) % MAXN;
        count++;
    }

    void pop() {
        front = (front + 1) % MAXN;
        count--;
    }

    int getFront() {
        return data[front];
    }

    bool empty() {
        return count == 0;
    }

    int size() {
        return count;
    }
};
```

문제에서 큐에 동시에 들어갈 수 있는 원소가 `MAXN` 미만인지 확인한다.

---

# 검색과 우선순위

## 5. `priority_queue` 대체: 이진 최소 힙

`cost`가 작은 것이 먼저 나오고, 같으면 `id`가 작은 것이 먼저 나온다.

```cpp
#define MAX_HEAP 100000

struct HeapItem {
    int cost;
    int id;
};

bool better(const HeapItem& a, const HeapItem& b) {
    if (a.cost != b.cost) return a.cost < b.cost;
    return a.id < b.id;
}

struct MinHeap {
    HeapItem heap[MAX_HEAP + 1];
    int size;

    void init() {
        size = 0;
    }

    void push(HeapItem value) {
        int idx = ++size;

        while (idx > 1 && better(value, heap[idx / 2])) {
            heap[idx] = heap[idx / 2];
            idx /= 2;
        }

        heap[idx] = value;
    }

    HeapItem top() {
        return heap[1];
    }

    HeapItem pop() {
        HeapItem ret = heap[1];
        HeapItem last = heap[size--];

        if (size == 0) return ret;

        int parent = 1;
        int child = 2;

        while (child <= size) {
            if (child < size && better(heap[child + 1], heap[child])) {
                child++;
            }

            if (!better(heap[child], last)) break;

            heap[parent] = heap[child];
            parent = child;
            child *= 2;
        }

        heap[parent] = last;
        return ret;
    }

    bool empty() {
        return size == 0;
    }
};
```

최대 힙이나 다른 정렬 기준이 필요해도 힙 코드는 건드리지 않고 `better()`만 바꾼다.

```cpp
// cost가 큰 것이 우선인 예시
bool better(const HeapItem& a, const HeapItem& b) {
    if (a.cost != b.cost) return a.cost > b.cost;
    return a.id < b.id;
}
```

## 6. `unordered_map<int, int>` 대체: 체이닝 해시

충돌은 같은 버킷의 연결 리스트로 처리한다. 포인터 대신 노드 인덱스를 저장한다.

```cpp
#define HASH_SIZE 100003
#define MAX_HASH_NODE 100000

struct HashNode {
    int key;
    int value;
    int next;
    bool alive;
};

struct HashMap {
    int head[HASH_SIZE];
    HashNode node[MAX_HASH_NODE];
    int nodeCount;

    void init() {
        for (int i = 0; i < HASH_SIZE; i++) {
            head[i] = -1;
        }
        nodeCount = 0;
    }

    int hashFunc(int key) {
        int h = key % HASH_SIZE;
        return h < 0 ? h + HASH_SIZE : h;
    }

    void set(int key, int value) {
        int h = hashFunc(key);

        for (int i = head[h]; i != -1; i = node[i].next) {
            if (node[i].key == key) {
                node[i].value = value;
                node[i].alive = true;
                return;
            }
        }

        node[nodeCount] = {key, value, head[h], true};
        head[h] = nodeCount++;
    }

    int* find(int key) {
        int h = hashFunc(key);

        for (int i = head[h]; i != -1; i = node[i].next) {
            if (node[i].key == key && node[i].alive) {
                return &node[i].value;
            }
        }

        return 0;
    }

    void erase(int key) {
        int h = hashFunc(key);

        for (int i = head[h]; i != -1; i = node[i].next) {
            if (node[i].key == key && node[i].alive) {
                node[i].alive = false;
                return;
            }
        }
    }
};
```

사용 예시:

```cpp
HashMap map;
map.init();
map.set(10, 500);

int* value = map.find(10);
if (value != 0) {
    int result = *value;
}
```

주의할 점:

- `MAX_HASH_NODE`는 현재 원소 수가 아니라 **서로 다른 key가 처음 등장하는 총횟수** 이상이어야 한다.
- `HASH_SIZE`는 예상 key 개수보다 여유 있는 소수를 사용한다.
- 문자열 key라면 `hashFunc()`에서 문자를 순회해 정수 해시값을 만들고, 충돌 확인 시 문자열도 직접 비교한다.

## 7. Linked List: 배열 노드 풀

연결 리스트를 단독으로 쓰기보다는 해시 체이닝이나 그래프의 부품으로 주로 사용한다.

```cpp
#define MAX_NODE 100000

struct ListNode {
    int value;
    int next;
};

ListNode listNode[MAX_NODE];
int listNodeCount;
int listHead;

void listInit() {
    listNodeCount = 0;
    listHead = -1;
}

void pushFront(int value) {
    listNode[listNodeCount] = {value, listHead};
    listHead = listNodeCount++;
}

void traverse() {
    for (int i = listHead; i != -1; i = listNode[i].next) {
        int value = listNode[i].value;
        // value 처리
    }
}
```

## 8. `set/map`이 필요해 보일 때

시험장에서 균형 이진 탐색 트리를 직접 구현하는 방식으로 통일하는 것은 추천하지 않는다.

| 실제로 필요한 기능 | 대체 구조 |
|---|---|
| 존재 여부, key 검색 | Hash Table |
| 최솟값·최댓값 반복 추출 | Heap |
| 값 범위가 작음 | 값 자체를 인덱스로 쓰는 배열 |
| 데이터가 먼저 모두 주어짐 | Merge Sort + Binary Search |
| 순위·구간 집계 | Fenwick Tree 또는 Segment Tree |

즉, `set/map`의 모든 기능이 정말 필요한지 먼저 분해한다.

---

# 그룹과 그래프

## 9. Union-Find

경로 압축과 크기 기준 합치기를 함께 사용한다.

```cpp
#define MAXN 100000

struct UnionFind {
    int parent[MAXN + 1];
    int groupSize[MAXN + 1];

    void init(int n) {
        for (int i = 0; i <= n; i++) {
            parent[i] = i;
            groupSize[i] = 1;
        }
    }

    int find(int x) {
        if (parent[x] == x) return x;
        return parent[x] = find(parent[x]);
    }

    void unite(int a, int b) {
        a = find(a);
        b = find(b);

        if (a == b) return;

        if (groupSize[a] < groupSize[b]) {
            int temp = a;
            a = b;
            b = temp;
        }

        parent[b] = a;
        groupSize[a] += groupSize[b];
    }

    bool connected(int a, int b) {
        return find(a) == find(b);
    }
};
```

## 10. 그래프 인접 리스트: 간선 배열 + head

`vector<vector<pair<int, int>>>`를 대체하는 대표 구현이다.

```cpp
#define MAX_VERTEX 100000
#define MAX_EDGE 200000

struct Edge {
    int to;
    int cost;
    int next;
};

struct Graph {
    int head[MAX_VERTEX + 1];
    Edge edge[MAX_EDGE];
    int edgeCount;

    void init(int vertexCount) {
        for (int i = 0; i <= vertexCount; i++) {
            head[i] = -1;
        }
        edgeCount = 0;
    }

    void addEdge(int from, int to, int cost) {
        edge[edgeCount] = {to, cost, head[from]};
        head[from] = edgeCount++;
    }
};
```

간선 순회:

```cpp
for (int e = graph.head[cur]; e != -1; e = graph.edge[e].next) {
    int next = graph.edge[e].to;
    int cost = graph.edge[e].cost;
}
```

무방향 간선은 양방향으로 두 번 넣는다.

```cpp
graph.addEdge(a, b, cost);
graph.addEdge(b, a, cost);
```

따라서 무방향 간선이 `M`개라면 `MAX_EDGE`는 최소 `2 * M` 이상이어야 한다.

---

# 문자열

## 11. Trie: 영문 소문자용

```cpp
#define MAX_TRIE_NODE 200000

struct TrieNode {
    int child[26];
    bool isEnd;
};

struct Trie {
    TrieNode node[MAX_TRIE_NODE];
    int nodeCount;

    void init() {
        nodeCount = 1;

        for (int i = 0; i < MAX_TRIE_NODE; i++) {
            node[i].isEnd = false;
            for (int c = 0; c < 26; c++) {
                node[i].child[c] = 0;
            }
        }
    }

    void insert(const char str[]) {
        int cur = 0;

        for (int i = 0; str[i] != '\0'; i++) {
            int c = str[i] - 'a';

            if (node[cur].child[c] == 0) {
                node[cur].child[c] = nodeCount++;
            }

            cur = node[cur].child[c];
        }

        node[cur].isEnd = true;
    }

    bool find(const char str[]) {
        int cur = 0;

        for (int i = 0; str[i] != '\0'; i++) {
            int c = str[i] - 'a';

            if (node[cur].child[c] == 0) return false;
            cur = node[cur].child[c];
        }

        return node[cur].isEnd;
    }
};
```

전역 객체로 선언하면 처음에는 0으로 초기화된다. 여러 테스트 케이스에서 다시 쓸 때는 위 `init()`처럼 초기화한다. 노드 수가 매우 크면 이전 테스트에서 사용한 노드까지만 초기화하도록 최적화할 수 있다.

---

# 구간 자료구조

## 12. Fenwick Tree: 점 더하기 + 구간합

구간합만 필요하면 Segment Tree보다 이 구현을 먼저 선택한다.

```cpp
#define MAXN 100000

struct FenwickTree {
    long long tree[MAXN + 1];
    int n;

    void init(int size) {
        n = size;
        for (int i = 1; i <= n; i++) {
            tree[i] = 0;
        }
    }

    void add(int idx, long long value) {
        while (idx <= n) {
            tree[idx] += value;
            idx += idx & -idx;
        }
    }

    long long prefixSum(int idx) {
        long long result = 0;

        while (idx > 0) {
            result += tree[idx];
            idx -= idx & -idx;
        }

        return result;
    }

    long long rangeSum(int left, int right) {
        return prefixSum(right) - prefixSum(left - 1);
    }
};
```

기존 값을 `newValue`로 바꾸려면 원본 배열도 두고 차이만 더한다.

```cpp
long long diff = newValue - arr[idx];
arr[idx] = newValue;
fenwick.add(idx, diff);
```

Fenwick Tree는 인덱스를 **1부터 시작**한다.

## 13. Segment Tree: 점 대입 + 구간합

기본형은 합으로 외우되, 문제에 따라 `+`와 범위 밖 반환값만 바꾼다.

```cpp
#define MAXN 100000

struct SegmentTree {
    long long tree[MAXN * 4];

    void init(int node, int start, int end) {
        tree[node] = 0;

        if (start == end) return;

        int mid = (start + end) / 2;
        init(node * 2, start, mid);
        init(node * 2 + 1, mid + 1, end);
    }

    void update(int node, int start, int end, int idx, long long value) {
        if (idx < start || end < idx) return;

        if (start == end) {
            tree[node] = value;
            return;
        }

        int mid = (start + end) / 2;
        update(node * 2, start, mid, idx, value);
        update(node * 2 + 1, mid + 1, end, idx, value);

        tree[node] = tree[node * 2] + tree[node * 2 + 1];
    }

    long long query(int node, int start, int end, int left, int right) {
        if (right < start || end < left) return 0;

        if (left <= start && end <= right) {
            return tree[node];
        }

        int mid = (start + end) / 2;
        return query(node * 2, start, mid, left, right)
             + query(node * 2 + 1, mid + 1, end, left, right);
    }
};
```

| 저장 정보 | 부모 계산 | 범위 밖 반환값 |
|---|---|---|
| 합 | `left + right` | `0` |
| 최솟값 | `min(left, right)` | 매우 큰 값 |
| 최댓값 | `max(left, right)` | 매우 작은 값 |

`min`, `max`도 못 쓰는 조건이라면 삼항 연산자로 직접 비교한다.

```cpp
tree[node] = tree[node * 2] < tree[node * 2 + 1]
           ? tree[node * 2]
           : tree[node * 2 + 1];
```

---

# 정렬과 이분 탐색

## 14. 정렬은 Merge Sort 하나로 통일

Quick Sort보다 코드가 조금 길지만 최악의 경우에도 `O(N log N)`이다.

```cpp
#define MAXN 100000

int mergeTemp[MAXN];

void mergeSort(int arr[], int left, int right) {
    if (left >= right) return;

    int mid = (left + right) / 2;
    mergeSort(arr, left, mid);
    mergeSort(arr, mid + 1, right);

    int i = left;
    int j = mid + 1;
    int k = left;

    while (i <= mid && j <= right) {
        if (arr[i] <= arr[j]) {
            mergeTemp[k++] = arr[i++];
        } else {
            mergeTemp[k++] = arr[j++];
        }
    }

    while (i <= mid) mergeTemp[k++] = arr[i++];
    while (j <= right) mergeTemp[k++] = arr[j++];

    for (int x = left; x <= right; x++) {
        arr[x] = mergeTemp[x];
    }
}
```

사용:

```cpp
mergeSort(arr, 0, n - 1);
```

구조체를 정렬할 때도 정렬 본체는 유지하고 비교만 함수로 뺀다.

```cpp
struct SortItem {
    int score;
    int id;
};

bool comesFirst(const SortItem& a, const SortItem& b) {
    if (a.score != b.score) return a.score > b.score;
    return a.id < b.id;
}
```

병합 부분의 조건만 다음처럼 바꾼다.

```cpp
if (comesFirst(arr[i], arr[j])) {
    temp[k++] = arr[i++];
} else {
    temp[k++] = arr[j++];
}
```

## 15. `lower_bound` 대체: Binary Search

`value 이상인 첫 위치`를 반환한다. 결과가 `n`이면 조건을 만족하는 값이 없다는 뜻이다.

```cpp
int lowerBound(int arr[], int n, int value) {
    int left = 0;
    int right = n;

    while (left < right) {
        int mid = (left + right) / 2;

        if (arr[mid] >= value) {
            right = mid;
        } else {
            left = mid + 1;
        }
    }

    return left;
}
```

`upper_bound`가 필요하면 비교 하나만 바꾼다.

```cpp
// value 초과인 첫 위치
if (arr[mid] > value) right = mid;
else left = mid + 1;
```

---

# 최종 암기 우선순위

## 1순위: 손이 바로 움직여야 함

1. 배열 + size
2. 원형 Queue
3. Binary Heap
4. Hash Table
5. 그래프 간선 배열
6. Merge Sort

## 2순위: 문제를 보면 바로 변형 가능해야 함

1. Union-Find
2. Binary Search
3. Fenwick Tree
4. Segment Tree
5. Trie

## 시험 직전 한 줄 대응표

```text
vector          -> 배열 + size
stack           -> 배열 + size
queue           -> 원형 큐
priority_queue  -> 이진 힙
unordered_map   -> 체이닝 해시
linked list     -> 배열 노드 풀
graph           -> edge 배열 + head
set/map         -> 필요한 기능을 해시·힙·정렬 배열로 분해
sort            -> 병합 정렬
lower_bound     -> 이분 탐색
구간합           -> Fenwick Tree
복잡한 구간 정보  -> Segment Tree
문자열 접두사     -> Trie
그룹 합치기       -> Union-Find
```

## 마지막 점검

- 빈 구조에서 `top()`, `pop()`을 호출하지 않았는가?
- 배열 최대 크기가 총 삽입 횟수보다 충분히 큰가?
- 무방향 그래프라면 간선 배열을 `2 * M` 이상 잡았는가?
- Fenwick Tree의 인덱스가 1부터 시작하는가?
- 해시의 삭제된 key를 다시 삽입할 때 `alive`를 복구했는가?
- 힙의 우선순위가 반대로 구현되지 않았는가?
- 구조체 정렬에서 동점 기준까지 정했는가?
- 합과 거리 자료형에 `long long`이 필요한지 확인했는가?
