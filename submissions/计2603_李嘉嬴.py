# 第一部分 · 排序编程
# 计2603 李嘉嬴
#
# 实现：插入排序（升序、稳定）
# - 从左到右把每个元素插入到前面已排好的有序区，逐步扩大有序区
# - 只做相邻的右移和落位，保留重复元素，负数同样适用
# - 每次移动或落位后调用 snapshot(arr)，网页据此播放排序过程


def sort_array(arr):
    """把 arr 升序排列，返回排好序的数组。"""
    for i in range(1, len(arr)):
        current = arr[i]
        j = i - 1
        # 比 current 大的元素依次右移一位，为 current 腾出位置
        while j >= 0 and arr[j] > current:
            arr[j + 1] = arr[j]
            j -= 1
            snapshot(arr)
        # 把 current 放到属于它的位置
        arr[j + 1] = current
        snapshot(arr)
    return arr
