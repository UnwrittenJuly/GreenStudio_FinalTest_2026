# 第一部分 · 排序编程
# 实现升序排序，无需读取输入或编写 main

def sort_array(arr):
    for end in range(len(arr) - 1, 0, -1):
        swapped = False
        for i in range(end):
            if arr[i] > arr[i + 1]:
                arr[i], arr[i + 1] = arr[i + 1], arr[i]
                swapped = True
        if not swapped:
            break
    return arr
