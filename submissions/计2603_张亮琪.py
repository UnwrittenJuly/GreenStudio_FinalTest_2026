def sort_array(arr):
      # TODO: 在这里编写排序算法
      # 交换或写入后可调用 snapshot(arr) 记录可视化步骤
      n = len(arr)
      for i in range(n):
          for j in range(n - 1 - i):
              if arr[j] > arr[j + 1]:
                  arr[j], arr[j + 1] = arr[j + 1], arr[j]
                  snapshot(arr)
      return arr