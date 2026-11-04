# 第一部分 · 排序编程
# 实现升序排序，无需读取输入或编写 main

def sort_array(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n-i-1):
            if arr[j] > arr[j+1]:
                arr[j],arr[j+1]=arr[j + 1],arr[j]
    return arr
