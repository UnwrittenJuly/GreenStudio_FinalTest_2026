# 第一部分 · 排序编程
# 实现升序排序，无需读取输入或编写 main

def sort_array(arr):
    n = len(arr)
    for i in range(n - 1):
        for j in range(n - 1 - i):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
                snapshot(arr)
    return arr
