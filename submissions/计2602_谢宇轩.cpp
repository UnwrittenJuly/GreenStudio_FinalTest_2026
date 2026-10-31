// 第一部分 · 排序编程
// 已提供 vector、algorithm、iostream，无需 main

void sort_array(vector<int>& arr) {
    int n = arr.size();
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - 1 - i; j++) {
            if (arr[j] > arr[j + 1]) {
                int h = arr[j + 1];
                arr[j + 1] = arr[j];
                arr[j] = h;
                snapshot(arr);
            }
        }
    }
}
