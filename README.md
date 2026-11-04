# GreenExplore · 成员介绍与排序演示

首页保留原有的团队展示风格，列出 18 位成员的自我介绍。每张卡片可以打开完整介绍，并链接到该成员对应的排序源码与可视化演示。

原有 17 位成员已有排序源码；末尾新增的“新成员”使用 `members/18.html`，班级、介绍和排序源码待补充。成员的介绍设计及原有排序源码保留，介绍文件与展示顺序按 01–18 连续编号。

## 启动与查看

1. Windows 文件资源管理器中双击 **`start.bat`**；在 VS Code 中也可以选择 **终端 → 运行任务 → 启动项目（Windows）**。
2. 等待浏览器打开 [http://127.0.0.1:8000](http://127.0.0.1:8000)，保持启动窗口开启。
3. 浏览首页成员介绍，或选择姓名并点击“定位成员介绍”。“独立预览”打开完整个人页面，“排序演示”进入对应成员的排序展示。
4. 在演示页查看该成员的源码，运行排序并播放数组变化。

启动器自动检测 Python，缺少时首次联网准备，无需安装前端依赖。macOS / Linux 或已安装 Python 3.10+ 的电脑，可运行 `python server.py`；更换端口使用 `python server.py --port 8080`。排序演示需要使用这个本地服务，直接双击 HTML 无法运行源码。

大部分源码使用 Python；谢宇轩的源码使用 C++，运行时需要电脑上有 G++。新成员尚未配置源码时，页面会显示待补充状态。

详细操作见 [使用指南](STUDENT_GUIDE.md)，成员与源码对应关系见 [成员表](members/README.md)。

## 内容维护

- 个人介绍保存在 `members/NN.html`，可以在对应文件中修改文字与个人样式，保存后点击“刷新成员介绍”。
- `members.json` 统一维护成员身份、介绍编号和排序源码路径。介绍文件编号与首页顺序统一为连续的 01–18，新成员编号为 18。
- 排序源码保存在 `submissions/`。更新源码后，在对应成员的演示页重新查看和运行；补充新成员源码时同时更新 `members.json` 的对应路径。
- 旧 `sorting.js` 和原有执行服务保留供后续修改。当前页面以介绍和排序展示为主。

## 文件说明

```text
GreenExplore/
├─ index.html             # 成员介绍首页
├─ app.js                 # 成员展示、定位和刷新
├─ members.json           # 成员与排序源码映射
├─ sorting-view.html      # 个人排序演示页
├─ sorting-view.js        # 读取源码、运行与可视化
├─ styles.css             # 公共样式
├─ members/               # 个人介绍页面与成员表
├─ submissions/           # 保留的原排序源码
├─ sorting.js             # 保留的原排序程序
├─ server.py              # 本地预览与代码运行服务
├─ start.bat              # Windows 双击启动入口
├─ start.ps1              # Python 环境准备与启动
├─ STUDENT_GUIDE.md       # 使用指南
└─ test_server.py         # 执行服务测试
```

维护者可运行 `node --check app.js`、`node --check sorting-view.js` 和 `python -m unittest -v test_server.py` 检查脚本与服务。
