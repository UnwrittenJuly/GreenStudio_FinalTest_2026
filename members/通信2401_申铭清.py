# 第一部分 · 排序编程
# 实现升序排序，无需读取输入或编写 main

def sort_array(arr):
    # TODO: 在这里编写排序算法
    n = len(arr)
    
    for i in range(n):
        swapped = False 
        for j in range(0, n - i - 1):
            
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
                swapped = True
                
                snapshot(arr) 
        
        if not swapped:
            break
            
    return arr
    # 交换或写入后可调用 snapshot(arr) 记录可视化步骤
    return arr
