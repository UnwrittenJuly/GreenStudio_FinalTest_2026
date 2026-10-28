
# 第一部分：排序编程
# 实现升序排序，无需读取输入或编写 main

def sort_array(arr):
    n = len(arr)

    # 使用冒泡排序，从小到大排列
    for i in range(n - 1):
        swapped = False

        for j in range(n - i - 1):
            if arr[j] > arr[j + 1]:
                # 交换相邻的两个元素
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
                swapped = True

                # 记录当前排序步骤，供网页可视化
                snapshot(arr)

        # 如果没有发生交换，说明数组已经有序
        if not swapped:
            break

    return arr
