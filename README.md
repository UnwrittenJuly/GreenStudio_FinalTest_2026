# GreenExplore · 协作开发考核

这是一个供 18 名同学一起完成的本地开发项目。每人交付两项内容：一份验证通过的排序代码，以及自己的自我介绍页面。网页首页汇总所有成员的介绍，开发过程包括拉取项目、编码、验证、提交和审核。

**第一次使用 Git 和 GitHub：请从 [学生零基础操作指南](STUDENT_GUIDE.md) 开始。** 从安装 Git、注册账号，到 Fork、VS Code 克隆、配置提交身份、创建本地分支、提交上传和发起 PR，按界面逐步操作，无需手动输入 Git 终端命令。课程公开仓库为 [GreenStudio_FinalTest_2026](https://github.com/UnwrittenJuly/GreenStudio_FinalTest_2026)，公共分支为 `main`。**同学向课程仓库发起 PR 即完成提交流程，审核与合并由老师处理。**

## 1. Windows：双击启动

1. 获取项目：正式交作业请先 Fork 课程仓库，再用 VS Code 克隆自己的 Fork，具体步骤见学生指南；只想体验运行也可以下载 ZIP 并完整解压。
2. 在 Windows 文件资源管理器中双击项目里的 **`start.bat`**；VS Code 中则选择 **终端 → 运行任务 → 启动项目（Windows）**。脚本自动检测 Python，缺少时首次联网准备；无需提前安装 Python、Node.js 或配置环境变量。
3. 等待浏览器自动打开 [http://127.0.0.1:8000](http://127.0.0.1:8000)。使用期间保持启动窗口打开，关闭窗口即可结束服务。

排序默认选择 Python，即可完成全部考核。C / C++ 是可选语言，需要自行准备 GCC / G++。修改介绍页可以使用 VS Code，也可以用系统记事本打开自己的 HTML 文件，保存为 UTF-8。

**正式参与仓库协作还需安装 Git，并按第 4 节克隆项目、配置提交身份、创建个人分支后再开始修改。** 克隆会自动建立本地仓库并连接自己的 Fork，无需再初始化。ZIP 目录不包含 Git 提交记录，已有作业可复制到另外克隆的项目里继续。

离线机房可由老师在联网且 Windows 架构相同的电脑运行 `.\start.bat -Portable -PrepareOnly`，准备好 `.runtime/` 后，将包含该文件夹的完整项目压缩分发。同学解压后仍双击 `start.bat`；`.runtime/` 不提交到 Git。便携运行环境来自 [Python 官方发布包](https://www.python.org/downloads/release/python-31317/)，下载后校验 SHA-256，不修改系统 PATH，不需要管理员权限。

macOS / Linux 或已安装 Python 3.10+ 的电脑，可在项目目录运行 `python server.py`。需要更换端口时运行 `python server.py --port 8080`。

## 2. 第一部分：排序代码

1. 进入网页的排序部分，选择自己的成员身份，页面自动填入班级姓名；选择 Python、C 或 C++。
2. 在网页编辑器中完成 `sort_array`，将数组升序排列，保留重复元素并支持负数。
3. 点击运行并验证。当前测试数组验证通过后可以下载；可更换数组进一步验证。
4. 下载文件名为 `班级_姓名` 加语言扩展名，例如 `电子2602_任天灵.py`。将文件手动移动到仓库的 `submissions/` 文件夹。

| 语言 | 入口函数 | 记录排序过程 | 扩展名 |
| --- | --- | --- | --- |
| Python | `def sort_array(arr)` | `snapshot(arr)` | `.py` |
| C | `void sort_array(int arr[], int n)` | `snapshot(arr, n)` | `.c` |
| C++ | `void sort_array(vector<int>& arr)` | `snapshot(arr)` | `.cpp` |

Python 可以返回排序后的列表，也可以原地修改数组；C / C++ 原地修改数组。无需编写 `main` 或读取输入。交换或写入后调用 `snapshot`，网页就会播放代码产生的数组变化。编辑代码或切换语言后，需要重新验证才能下载。

每人选择一种语言提交即可。浏览器草稿和下载不会自动写入仓库。详见 [排序代码提交说明](submissions/README.md)。

## 3. 第二部分：成员介绍

查看 [18 人分工表](members/README.md)，找到自己的 `members/01.html` 到 `members/18.html`。每人只修改对应的一个 HTML 文件：结构、样式和自我介绍都写在这个文件里。保存并刷新浏览器，在首页查看效果。

介绍建议包含姓名、班级、一句话介绍、兴趣或技能，以及一个学习目标。可以调整自己页面的颜色和排版，做到简洁易读。保留文件路径和分工对应关系。例如任天灵负责 `members/01.html`，李嘉赢负责 `members/02.html`，完整名单以分工表为准。

## 4. 用 VS Code 完成 Git 协作与 PR

课程仓库是公开的。同学统一采用 **Fork → 克隆自己的 Fork → 个人分支开发 → 上传自己的 Fork → 向课程仓库发 PR** 的流程，无需获得课程仓库写权限。详细的按钮位置、配置方法和完成标志见 [学生零基础操作指南](STUDENT_GUIDE.md)。

以电子2602班任天灵为例，操作顺序如下：

1. 安装 Git 和桌面版 VS Code，注册 GitHub。在 VS Code 安装 GitHub 发布的 GitHub Pull Requests 扩展并登录自己的账号。
2. 浏览器打开课程仓库，点击 **Fork → Create fork**，将副本创建到自己账号下。在自己的 Fork 页面复制 **Code → HTTPS** 地址。
3. 在 VS Code 按 **Ctrl + Shift + P**，选择 **Git: Clone / 克隆**，粘贴自己的 Fork 地址，选择父文件夹，完成后点击“打开”。克隆会自动建立本地仓库，远程连接 `origin` 指向自己的 Fork。
4. 按学生指南在当前仓库的 `.git/config` 中配置自己的提交姓名和邮箱。GitHub 登录与提交身份是两项独立配置。
5. 左下角选择 `main`，通过 **Git: Pull / 拉取** 更新自己的主分支；再点击分支名 → **创建新分支**，输入 `student/电子2602-任天灵`。
6. 选择 **终端 → 运行任务 → 启动项目（Windows）**，完成并验证自己的介绍和排序代码。
7. 将最终下载的排序文件放进 `submissions`，保存介绍文件，按 **Ctrl + Shift + G** 打开源代码管理。
8. 检查差异，只对 `members/01.html` 和 `submissions/电子2602_任天灵.py` 分别点击 **＋** 暂存；填写提交说明，点击 **提交 / Commit**。
9. 点击 **发布分支 / Publish Branch**，选择 `origin`，上传到自己的 Fork。在 GitHub 选择个人分支，确认文件已经更新。
10. 在 VS Code 命令面板选择 **GitHub Pull Requests: Create Pull Request**。目标仓库选 `UnwrittenJuly/GreenStudio_FinalTest_2026`，目标分支选 `main`；来源选自己 Fork 中的个人分支。
11. 按模板填写班级姓名、文件路径、排序语言、实现思路和验证结果，核对只有自己的两个文件，点击 **Create / 创建**。在课程仓库看到 PR 编号和 Open 状态，即完成提交。

保存只更新本机文件，提交只写入本地历史，发布分支才会上传到自己的 GitHub。**上传后还需创建 PR，老师才能在课程仓库的审核列表中看到这次作业。**

收到修改意见后，在原个人分支修改、重新验证、暂存、提交，再选择 **Git: Push / 推送**，同一个 PR 会自动更新。同学无需自行合并 PR。第一次获取项目用“克隆”，以后打开原目录继续；新任务开始前，在 GitHub 的 Fork 主分支使用 **Sync fork → Update branch**，再回 VS Code 切换本地 `main` 并拉取。

**发布分支或推送失败：** 学生指南第 14 节提供权限与网络排查。`permission denied` 优先核对自己的 Fork、登录账号和 Windows 缓存凭据；连接超时、DNS、代理或 HTTP/2 错误按网络流程处理。网页可用但 Git 持续失败时，还可以按应急步骤在自己的 Fork 上传两个文件，再向课程仓库发起 PR。

## 项目结构与维护

```text
GreenExplore/
├─ index.html             # 团队首页与考核入口
├─ app.js                 # 页面交互与成员展示
├─ sorting.js             # 排序编辑、验证与下载
├─ styles.css             # 公共样式
├─ members/
│  ├─ README.md           # 18 人分工表
│  └─ 01.html … 18.html   # 每位同学独立编辑的介绍
├─ submissions/           # 班级_姓名.py / .c / .cpp
├─ server.py              # 本地服务与代码执行
├─ start.bat              # Windows 双击启动入口
├─ start.ps1              # 自动准备 Python 并启动
├─ STUDENT_GUIDE.md       # 从零开始的 VS Code 与 PR 操作指南
├─ .vscode/tasks.json     # 菜单启动任务
└─ test_server.py         # 执行服务测试
```

无需安装前端依赖。维护者可运行 `node --check app.js`、`node --check sorting.js` 和 `python -m unittest -v test_server.py` 检查代码。执行服务仅监听本机地址，提交程序以启动服务用户的权限运行，适用于可信代码的本地开发验证。
