"""GreenExplore 排序考核提交

班级：电子2602
姓名：任天灵
语言：Python

入口函数：sort_array(arr)
要求：原地升序排列，保留重复元素，支持负数。
每完成一次写入就用 snapshot(arr) 记录当前数组，网页会据此播放排序过程。
"""


def sort_array(arr):
    """插入排序：把每个元素插入到左侧已排好序的部分。

    时间复杂度 O(n^2)，空间复杂度 O(1)，原地修改并返回同一个列表。
    """
    for i in range(1, len(arr)):
        value = arr[i]          # 待插入的元素
        j = i - 1
        # 从右往左，把比 value 大的元素统一后移一位
        while j >= 0 and arr[j] > value:
            arr[j + 1] = arr[j]
            j -= 1
            snapshot(arr)       # 每次后移后记录一帧
        # 元素没有移动时无需重复记录，避免多余的空帧
        if j + 1 != i:
            arr[j + 1] = value
            snapshot(arr)       # 落位后记录一帧
    return arr
