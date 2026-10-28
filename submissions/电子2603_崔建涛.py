# 第一部分 · 排序编程
# 实现升序排序，无需读取输入或编写 main
def sort_array(arr):    
    """对列表 arr 进行原地升序排序（插入排序），并记录可视化步骤。
        每完成一轮插入（一个元素归位）调用一次 snapshot(arr)，    
    方便以快照方式展示排序过程。    
    """    
    # 插入排序：将第 i 个元素插入到前面已有序的子序列中    
    # 先记录初始状态，作为可视化的第一帧    
    snapshot(arr)    
    for i in range(1, len(arr)):        
        key = arr[i]        
        j = i - 1        
        # 把大于 key 的元素依次后移        
        while j >= 0 and arr[j] > key:            
            arr[j + 1] = arr[j]            
            j -= 1        
        # 将 key 放到正确位置        
        arr[j + 1] = key        
        # 每轮插入完成后记录一次可视化快照        
        snapshot(arr)    
    return arr
