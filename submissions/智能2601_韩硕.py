# 第一部分 · 排序编程
# 实现升序排序，无需读取输入或编写 main

def sort_array(arr):
    # TODO: 在这里编写排序算法
    # 交换或写入后可调用 snapshot(arr) 记录可视化步骤
    n=len(arr)
    for i in range(n):
        for j in range(n-i-1):
            if arr[j]>arr[j+1]:
                arr[j],arr[j+1]=arr[j+1],arr[j]
    snapshot(arr)
    return arr
