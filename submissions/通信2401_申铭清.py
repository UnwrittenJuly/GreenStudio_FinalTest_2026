def sort_array(arr):
    # 冒泡排序，每次交换后 snapshot
    n = len(arr)
    for i in range(n - 1):
        for j in range(n - 1 - i):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
                snapshot(arr)
    return arr
