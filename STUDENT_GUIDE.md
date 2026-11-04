# 学生操作指南：从零开始，用 VS Code 提交第一个 Pull Request

适用环境：Windows 10 / 11、桌面版 VS Code。没有用过 Git 和 GitHub，也可以从第 1 步开始。

课程公开仓库：[UnwrittenJuly/GreenStudio_FinalTest_2026](https://github.com/UnwrittenJuly/GreenStudio_FinalTest_2026)，公共分支为 `main`。

**同学的完成标志：向课程仓库的 `main` 发起一个包含自己作业的 Pull Request（简称 PR）。** 审核和合并由老师或维护者处理。

本指南以“电子2602 任天灵”为例，其他同学替换成自己的班级、姓名和文件编号。全程以 VS Code 的按钮、菜单和命令面板为主，无需手动输入 Git 终端命令；注册、Fork 和登录授权会用到浏览器。

## 1. 先认识这次要做的事

完整顺序如下：

```text
安装 Git 和 VS Code，注册 GitHub
→ Fork 课程仓库到自己的 GitHub 账号
→ 用 VS Code 克隆自己的 Fork，建立本地仓库
→ 配置提交姓名和邮箱
→ 创建自己的本地分支
→ 完成、保存并验证作业
→ 暂存 → 提交 → 发布分支
→ 向原课程仓库的 main 发起 PR
```

先分清几个词，不需要背命令：

| 名称 | 在这次作业中是什么意思 |
| --- | --- |
| Git | 安装在电脑上的版本管理工具，记录每次提交。 |
| GitHub | 在线保存仓库、接收 PR 的网站。Git 与 GitHub 需要分别准备。 |
| 远程仓库 | GitHub 上的项目。课程仓库属于老师，你的 Fork 属于你。 |
| Fork | 在 GitHub 上建立一份属于自己的仓库副本，方便上传作业。 |
| Clone / 克隆 | 第一次把远程仓库和提交记录下载到电脑，建立本地仓库。 |
| 本地仓库 | 电脑上的项目文件夹及它的 Git 记录，可以在 VS Code 中修改。 |
| `origin` | 克隆时自动建立的远程连接名称；本指南中指向你自己的 Fork。 |
| Branch / 分支 | 同一仓库里的一条开发线。`main` 保存公共版本，个人分支保存你的作业。 |
| Pull / 拉取 | 在已有本地仓库中获取并整合远程更新，不会重新创建项目文件夹。 |
| Pull Request / PR | 请求老师把你的分支改动合入课程仓库，供老师查看和审核。 |

**公开仓库允许大家查看和克隆，但不表示每个人都能直接推送。** 因此这里统一使用“Fork → 上传到自己的仓库 → 向课程仓库发 PR”的流程，同学无需先成为课程仓库的协作者。

## 2. 第一次准备：安装软件、注册账号

### 2.1 安装 Git

1. 打开 [Git for Windows 官方下载页](https://git-scm.com/install/windows)，下载适合自己电脑的安装包。
2. 双击安装。通常保留默认选项即可。
3. 在 PATH 相关页面，保留包含 **Git from the command line and also from 3rd-party software** 的选项，让 VS Code 可以找到 Git。
4. 完成后，如果 VS Code 已经打开，先完全退出，再重新打开。

Git 安装后不需要单独打开 Git Bash，后续在 VS Code 中操作。

### 2.2 安装 VS Code 和所需扩展

1. 从 [VS Code 官方下载页](https://code.visualstudio.com/download) 安装桌面版 VS Code。
2. 打开 VS Code，按 `Ctrl + Shift + X` 进入“扩展”。
3. 如果希望使用中文，搜索 **Chinese (Simplified)**，安装 Microsoft 发布的简体中文语言包，按提示切换语言并重启。
4. 搜索 **GitHub Pull Requests**，安装 GitHub 发布的扩展，扩展 ID 为 `GitHub.vscode-pull-request-github`。官方文档中也称它为 GitHub Pull Requests and Issues。
5. 若安装后提示重新加载窗口，点击“重新加载”。

VS Code 内置基本的 Git 支持；PR 扩展用于在编辑器里创建和查看 PR。本次不需要安装 GitLens、GitHub Desktop 或其他 Git 插件。

### 2.3 注册并登录 GitHub

1. 浏览器打开 [GitHub](https://github.com)，已有账号就直接登录；没有账号则点击 **Sign up** 注册。
2. 按提示完成邮箱验证，记住自己的 GitHub 用户名。
3. 回到 VS Code，点击左侧 GitHub 图标，选择 **Sign In / 登录**。
4. 浏览器弹出授权页面后，确认登录的是自己的账号，按提示授权并返回 VS Code。
5. 后续推送时若再次出现浏览器登录提示，继续使用同一个账号。

**GitHub 登录负责证明“你能上传到哪个仓库”；Git 提交姓名和邮箱负责记录“这次修改是谁写的”。** 两者需要分别设置，提交身份会在第 5 步配置。

参考：[VS Code 的 GitHub 登录与扩展说明](https://code.visualstudio.com/docs/sourcecontrol/github)。

**完成标志：** VS Code 已安装 GitHub PR 扩展，并完成自己的 GitHub 账号登录。

## 3. 在 GitHub 上 Fork 课程仓库

这一步在浏览器完成。先建立自己的远程副本，再下载到电脑。

1. 登录 GitHub，打开 [课程仓库](https://github.com/UnwrittenJuly/GreenStudio_FinalTest_2026)。
2. 点击仓库页面右上方的 **Fork**；如果出现菜单，选择 **Create a new fork**。
3. **Owner / 所有者** 选择自己的 GitHub 账号。
4. 仓库名称保留 `GreenStudio_FinalTest_2026` 即可，其他选项通常保持默认。
5. 点击 **Create fork**，等待进入自己的仓库页面。
6. 看页面左上方，仓库路径应是 `你的GitHub用户名/GreenStudio_FinalTest_2026`，并有来源于课程仓库的提示。
7. 点击绿色 **Code** 按钮，选择 **HTTPS**，点击地址右侧的复制按钮。

复制出的地址应类似：

```text
https://github.com/你的GitHub用户名/GreenStudio_FinalTest_2026.git
```

这是地址格式示例。请从自己 Fork 的 **Code → HTTPS** 中复制真实地址，不要原样复制“你的GitHub用户名”。

如果以前已经 Fork 过，直接打开自己账号下的那个仓库。开始新作业前可在其 `main` 页面点击 **Sync fork → Update branch**，获取课程仓库的新内容。

参考：[GitHub 创建 Fork 的官方说明](https://docs.github.com/en/pull-requests/how-tos/work-with-forks/fork-a-repo)。

**完成标志：** 浏览器中打开的是属于自己的 Fork，手上复制的是自己的 HTTPS 地址。

## 4. 在 VS Code 克隆仓库，建立本地项目

### 4.1 找到“克隆”入口

1. 打开 VS Code。
2. 按 `Ctrl + Shift + P` 打开**命令面板**。
3. 搜索并选择 **Git: Clone / Git: 克隆**。
4. 在顶部“提供仓库 URL 或选择仓库源”输入框，粘贴刚复制的**自己的 Fork 地址**，按回车。

命令面板是 VS Code 的操作搜索框：输入的是“克隆、拉取”等操作名称，选中菜单项即可，无需输入 `git clone ...` 这类终端命令。

如果没有打开任何文件夹，也可以点击欢迎页或“源代码管理”里的 **Clone Repository / 克隆仓库**。

### 4.2 选择保存位置并打开

1. 在选择文件夹窗口中，选择保存项目的**父文件夹**，例如 `D:\课程项目`。没有该文件夹可以在窗口中先新建。
2. 点击“选择存储库位置 / Select Repository Location”。
3. VS Code 会在该位置自动创建 `GreenStudio_FinalTest_2026` 文件夹。
4. 等待下载完成，点击提示中的 **Open / 打开**。
5. 确认项目来自本次课程后，按工作区信任提示选择信任。

最终项目路径类似：

```text
D:\课程项目\GreenStudio_FinalTest_2026
```

不要把保存位置选在另一个 Git 项目内部。如果提示目标文件夹已经存在，换一个父文件夹，保留原目录。

### 4.3 确认本地仓库已经建好

打开后检查：

- 左侧“资源管理器”能看到 `index.html`、`start.bat`、`start.ps1`、`members`、`submissions`。
- 左下角状态栏能看到当前分支，通常为 `main`。
- 按 `Ctrl + Shift + G`，能打开“源代码管理”。

**克隆已经自动完成本地仓库初始化和远程连接。** 你不需要再点“初始化仓库”，也不用手动添加 `origin`。这个 `origin` 连接到自己刚克隆的 Fork。

仅新建一个普通文件夹，并不会自动下载课程项目。GitHub 的 **Download ZIP** 也不包含 Git 历史；如果之前下载过 ZIP，请保留文件，另找位置按本节克隆，再把自己写好的作业文件复制过去。

参考：[VS Code 克隆仓库与远程连接说明](https://code.visualstudio.com/docs/sourcecontrol/repos-remotes)。

**完成标志：** 项目根目录已在 VS Code 中打开，能看到项目文件和当前分支。

## 5. 配置本地 Git 的提交姓名和邮箱

这一步对当前本地仓库设置一次即可。即使已经登录 GitHub，也要确认提交身份已配置。

### 5.1 先找到自己的邮箱

1. 浏览器打开 GitHub，点击右上角头像 → **Settings / 设置**。
2. 左侧选择 **Emails / 邮箱**。
3. 使用自己已验证的邮箱；如果希望隐藏真实邮箱，可以启用 **Keep my email addresses private**，复制页面提供的 `noreply` 隐私邮箱。
4. 隐私邮箱请复制页面中的完整内容，每个人的地址可能不同。

邮箱用于关联提交与 GitHub 账号。不要填写 GitHub 密码。

### 5.2 在 VS Code 编辑当前仓库的配置

1. 在 VS Code 左侧资源管理器最上方的项目文件夹上右键，选择 **Copy Path / 复制路径**。
2. 按 `Ctrl + O`，在打开文件窗口中粘贴这个路径，在末尾加上 `\.git\config`，例如：

   ```text
   D:\课程项目\GreenStudio_FinalTest_2026\.git\config
   ```

3. 打开后，**保留原有内容**，在文件末尾另起一行添加：

   ```ini
   [user]
       name = 任天灵
       email = 替换为你刚复制的邮箱
   ```

4. 将 `name` 改成自己的姓名，将 `email` 改成自己真实的已验证邮箱或 GitHub 隐私邮箱。示例中的“替换为你刚复制的邮箱”不能原样保留。
5. 如果已有 `[user]`，只修改其中的 `name` 和 `email`，不用重复添加。
6. 按 `Ctrl + S` 保存，再关闭配置文件。

`.git` 可能默认隐藏，按完整路径仍可打开。这份配置属于 Git 本地记录，不是需要提交的作业文件；不要修改原有的 `[core]`、`[remote "origin"]`、`[branch "main"]` 等部分。

这里设置只影响当前本地仓库。在机房换电脑或重新克隆后，要在新的本地仓库再配置一次。Git 也支持整台电脑的默认配置，本指南使用当前仓库配置，方便各同学使用自己的身份。

参考：[Git 仓库配置文件说明](https://git-scm.com/docs/git-config)、[GitHub 提交邮箱说明](https://docs.github.com/en/account-and-profile/how-tos/email-preferences/setting-your-commit-email-address)。

**完成标志：** 配置中的姓名、邮箱都是自己的，文件已保存。

## 6. 从 main 创建自己的本地分支

先创建分支，再开始改作业。

1. 点击 VS Code 左下角的分支名称，选择本地 `main`。
2. 按 `Ctrl + Shift + P`，选择 **Git: Pull / Git: 拉取**，获取自己 Fork 的 `main` 更新。刚克隆完通常已经是最新版本。
3. 再次点击左下角 `main`，选择 **Create new branch... / 创建新分支**。也可以在命令面板选择 **Git: Create Branch...**。
4. 输入自己的分支名，例如：

   ```text
   student/电子2602-任天灵
   ```

5. 按回车。若提示从哪个分支创建，选择 `main`。
6. 检查左下角已显示自己的 `student/...` 分支。

分支名不要带空格，每位同学使用自己的班级和姓名。若这个名字已经存在，且就是自己之前做作业的分支，直接切换到它继续。

**创建分支不会新建一份项目文件夹。** 仍在当前目录编辑；此时分支只存在于本地，之后“发布分支”才会上传到自己的 Fork。不要用“新建文件夹”代替创建 Git 分支。

参考：[VS Code 创建和切换分支说明](https://code.visualstudio.com/docs/sourcecontrol/branches-worktrees)。

**完成标志：** 左下角显示自己的个人分支，后续作业都在这个分支上完成。

## 7. 从 VS Code 启动项目

项目已提供启动任务，不用自己配置运行命令。

1. 点击顶部菜单 **终端 → 运行任务**。
2. 选择 **启动项目（Windows）**。
3. 如果提示允许运行工作区任务，确认是当前课程项目后继续。
4. 底部会自动出现运行窗口。等待启动完成，无需在里面输入命令。
5. 第一次缺少 Python 时，启动器会联网下载并校验便携 Python；之后复用已准备的环境。
6. 浏览器通常会自动打开 [http://127.0.0.1:8000](http://127.0.0.1:8000)。未自动打开时，手动打开运行窗口显示的地址。

默认使用 Python 作答，无需提前安装 Python、Node.js、npm 或 VS Code 的 Python 扩展。只有选择 C / C++ 时才需要另外准备 GCC / G++。

运行窗口需要保持开启；可以收起面板。点击终端垃圾桶或“终止任务”会停止服务，下次再运行同一个任务即可。

在 VS Code 文件列表双击 `start.bat` 会打开代码编辑器。要用双击启动，请到 **Windows 文件资源管理器**双击它；在 VS Code 内使用上述运行任务入口。

**完成标志：** 浏览器能打开课程首页，排序区可以连接本地执行服务。

## 8. 完成自己的两项作业

本次只交自己的两个文件。任天灵的例子是：

```text
members/01.html
submissions/电子2602_任天灵.py
```

如果选择 C / C++，第二个文件的扩展名分别为 `.c` / `.cpp`，每人选择一种语言。

### 8.1 在网页完成排序并下载

1. 在网页顶部“选择你的班级和姓名”中选择自己。
2. 进入“排序编程”，初次使用建议选择 **Python 3**。
3. 在网页编辑器中补全 `sort_array` 函数，实现升序排序，保留重复元素并支持负数。无需读取输入或编写 `main`。
4. 如需记录过程，Python / C++ 在交换或写入后调用 `snapshot(arr)`，C 使用 `snapshot(arr, n)`。
5. 点击 **运行并验证**，根据结果修改，再运行。
6. 通过后，点击“更换数组”或使用“自定义测试数组”，检查负数、重复值、已排序、逆序等情况。
7. 确认当前版本通过验证、班级姓名正确，再点击 **下载已验证程序**。

**验证只代表当前测试数组通过。** 更改代码、语言或数组后，要重新运行验证。浏览器草稿和下载文件都不会自动保存到仓库。

### 8.2 把下载的排序文件放进本地仓库

1. 在浏览器下载列表中找到文件，点击“在文件夹中显示”。
2. 复制下载的源码文件。
3. 回到 VS Code，在 `submissions` 文件夹上右键，选择“在文件资源管理器中显示 / Reveal in File Explorer”。
4. 确认已进入当前项目的 `submissions` 文件夹；如果资源管理器只是选中了这个文件夹，先双击打开，再粘贴。
5. 回到 VS Code，展开 `submissions`，确认自己的文件已经出现，点击打开检查内容。

文件名应为 `班级_姓名.py`、`班级_姓名.c` 或 `班级_姓名.cpp`。若下载产生 `(1)` 后缀，在 VS Code 右键重命名，保留正确名称；不要留下重复副本，也不要保存成 `.py.txt`。

### 8.3 找到并修改自己的介绍文件

| 班级 | 姓名 | 自我介绍文件 |
| --- | --- | --- |
| 电子2602 | 任天灵 | `members/01.html` |
| 计2603 | 李嘉赢 | `members/02.html` |
| 电子2603 | 吴柏鑫 | `members/03.html` |
| 智能2601 | 李佳璐 | `members/04.html` |
| 电子2603 | 朱家铭 | `members/05.html` |
| 计2603 | 张亮琪 | `members/06.html` |
| 智能2602 | 叶斌铖 | `members/07.html` |
| 计2605 | 杨沁林 | `members/08.html` |
| 电子2603 | 崔建涛 | `members/09.html` |
| 通信2603 | 田子涵 | `members/10.html` |
| 智能2601 | 韩硕 | `members/11.html` |
| 计2601 | 周钰山 | `members/12.html` |
| 通信2601 | 蒲佳妮 | `members/13.html` |
| 计2602 | 谢宇轩 | `members/14.html` |
| 国电2602 | 张淇奥 | `members/15.html` |
| 通信2602 | 朱惠瑶 | `members/16.html` |
| 国电2602 | 夏源浩 | `members/17.html` |
| 智能2604 | 方君强 | `members/18.html` |

1. 在 VS Code 资源管理器中展开 `members`，打开自己对应的 HTML。
2. 将“待完成：用一句话介绍你自己。”换成自己的介绍。
3. 把三个兴趣或技能标签、学习目标占位文字换成自己的内容，保留正确的姓名、班级。
4. 如果调整颜色和排版，将个人样式写在自己的 HTML 中。
5. 按 `Ctrl + S` 保存。
6. 在网页“成员介绍”里点击“刷新介绍预览”，再点击“定位我的区域”，检查内容和窄屏阅读效果。

公共 `card.css`、其他同学的 HTML、`app.js` 和服务器文件由维护者管理。本次只需修改自己的介绍文件和排序文件。

**完成标志：** 本地仓库里有自己的两个最终文件，排序验证通过，介绍可以正常阅读。

## 9. 在 VS Code 检查改动并“暂存”

先弄清几个按钮各自做了什么：

| 操作 | 保存到了哪里 | 此时老师能否通过 PR 看到 |
| --- | --- | --- |
| 保存 `Ctrl + S` | 电脑上的文件。 | 不能。 |
| 暂存 `＋` | 选定本次准备提交的文件内容。 | 不能。 |
| 提交 Commit | 当前本地分支的 Git 历史。 | 不能。 |
| 推送 Push / 发布分支 | 自己 GitHub Fork 中的分支。 | 尚未发 PR 时，还没有审核申请。 |
| 创建 Pull Request | 在课程仓库建立审核入口。 | 可以查看 PR 里的改动。 |

暂存与提交的官方说明见 [VS Code 文件改动与提交指南](https://code.visualstudio.com/docs/sourcecontrol/staging-commits)。

具体操作：

1. 在 VS Code 选择 **文件 → 全部保存**，再按 `Ctrl + Shift + G` 打开“源代码管理”。
2. 看“更改 / Changes”列表，任天灵应找到：

   ```text
   members/01.html
   submissions/电子2602_任天灵.py
   ```

3. 点击介绍文件查看差异：通常左侧为修改前，右侧为修改后，确认内容和负责的文件都正确。
4. 点击排序文件，确认是最终验证后下载的源码。
5. 将鼠标移到介绍文件这一行，点击右侧 **＋ / Stage Changes / 暂存更改**。
6. 再对自己的排序文件点一次 **＋**。
7. 检查“暂存的更改 / Staged Changes”，里面只应有自己的两个文件。

暂存错了，在“暂存的更改”中点击该文件右侧的 **－**，即可取消暂存，编辑内容仍保留。不要把“放弃更改 / Discard Changes”当作取消暂存，它会丢弃尚未提交的编辑。

如果暂存后又修改了文件，要保存并再次暂存，才能把最新内容放进这次提交。运行生成的 `.runtime` 已被项目忽略，无需提交。

**完成标志：** “暂存的更改”里只有自己的两个作业文件，内容已核对。

## 10. 点击“提交”，记录自己的修改

1. 看左下角，确认仍是自己的 `student/...` 分支。
2. 在源代码管理顶部的提交消息框中填写一句清楚的说明，例如：

   ```text
   完成电子2602任天灵的自我介绍与排序作业
   ```

3. 点击 **Commit / 提交**。按钮有下拉菜单时，本步选择普通“提交”即可。
4. 如果出现单独的提交信息编辑器，写好说明后，按界面右上角的确认按钮完成。
5. 提交成功后，刚提交的两个文件会从更改列表中消失；文件本身仍在项目里。

若提示未设置 `user.name` 和 `user.email`，返回第 5 步配置。若提示“没有暂存的更改”，先回到第 9 步暂存文件。

**完成标志：** 作业已进入本地 Git 历史。此时还需要上传，不能直接关掉电脑当作已交作业。

## 11. 发布个人分支，上传到自己的 GitHub Fork

1. 确认当前仍是个人分支。
2. 在源代码管理中点击 **Publish Branch / 发布分支**。
3. 如需选择远程仓库，选择 `origin`。它应连接到 `你的GitHub用户名/GreenStudio_FinalTest_2026`。
4. 如果出现 GitHub 登录提示，使用自己的账号在浏览器完成授权，再回到 VS Code。
5. 等待上传结束。
6. 浏览器打开自己的 Fork，在文件列表上方的分支下拉框中选择自己的 `student/...` 分支，检查两个作业文件是否已是最新内容。

这是把**分支**发布到已经存在的 Fork。“Publish to GitHub / 发布到 GitHub”用于从本地新建另一个 GitHub 仓库，本次按前面的克隆流程操作就不需要它。

自己的 `main` 页面还没出现作业是正常的，因为上传的是个人分支。请切换到个人分支检查。

第一次上传叫“发布分支”；后面在这个分支继续修改，就按“保存 → 暂存 → 提交”，再在命令面板选择 **Git: Push / Git: 推送**。界面的“同步更改”会先拉取再推送，首次练习可以直接选“推送”。

**完成标志：** 在自己 GitHub Fork 的个人分支中，能看到两个作业文件的最新版本。

如果发布失败，先看第 14 节的权限与网络排查。错误含 `permission denied` 时，从第 14.2 节开始；连接超时、DNS 或代理错误从第 14.3 节开始。推送失败不会删除已经保存在本地的提交。

## 12. 用 VS Code 向课程仓库创建 Pull Request

PR 的方向要核对清楚：

| 表单项目 | 应选择什么 |
| --- | --- |
| Base repository / 目标仓库 | `UnwrittenJuly/GreenStudio_FinalTest_2026`，即老师的课程仓库。 |
| Base branch / 目标分支 | `main`。 |
| Head / Compare repository / 来源仓库 | `你的GitHub用户名/GreenStudio_FinalTest_2026`，即自己的 Fork。 |
| Head / Compare branch / 来源分支 | 自己刚上传的 `student/班级-姓名`。 |

操作步骤：

1. 回到已打开本地项目的 VS Code，确认当前是自己的个人分支。
2. 按 `Ctrl + Shift + P`，搜索并选择 **GitHub Pull Requests: Create Pull Request**。
3. 如果找不到这项操作，检查 GitHub PR 扩展已安装、启用并登录；也可以打开左侧 GitHub 视图，点击 **Create Pull Request / 创建拉取请求**。
4. 在创建页面核对上表。不同版本可能使用 Base、Head 或 Compare 等标签，按仓库归属和分支名检查。
5. 标题填写自己的班级姓名和完成内容，例如：

   ```text
   电子2602 任天灵：完成自我介绍与排序作业
   ```

6. 描述里会自动填入项目的 PR 模板。填写班级、姓名、介绍文件、排序语言、排序文件，以及自己算法的实现思路。
7. 按实际结果勾选“本地验证”；有未完成内容，在“需要说明的问题”中写明，没有则填“无”。
8. 查看改动文件，确认只有自己的两个文件。
9. 点击 **Create / 创建**，选择普通 PR，作为正式提交。
10. 创建成功后，打开 PR 详情，确认有编号（如 `#12`）、标题和 **Open / 打开** 状态，复制 PR 链接按老师要求交付。

目标仓库要选**老师的课程仓库**。如果目标也选成自己的 Fork，老师的课程仓库中就不会收到这份 PR。

**看到课程仓库中已创建的 PR 编号和 Open 状态，本次 Git 提交流程就完成了。** 无需自己点击 Merge，也无需把作业直接推送到课程仓库的 `main`。

参考：[VS Code 创建 Pull Request 官方说明](https://code.visualstudio.com/docs/sourcecontrol/github#creating-pull-requests)。

### 如果 VS Code 扩展暂时无法创建 PR

作业分支已上传时，可以在浏览器完成最后一步：

1. 打开自己的 Fork，选择已上传的个人分支。
2. 点击 **Contribute → Open pull request**，或页面出现的 **Compare & pull request**。
3. 如果找不到入口，打开课程仓库 **Pull requests → New pull request → compare across forks**。
4. 按本节表格选择目标课程仓库 `main` 和自己 Fork 中的个人分支。
5. 填好标题、模板和验证结果，检查两个文件，点击 **Create pull request**。
6. 确认 PR 出现在课程仓库的 Pull requests 列表，复制链接。

参考：[GitHub 从 Fork 创建 PR 的官方说明](https://docs.github.com/en/pull-requests/how-tos/create-pull-requests/creating-a-pull-request-from-a-fork)。

## 13. 发起 PR 后怎么补充修改、下次怎么继续

### 13.1 给同一个 PR 补充修改

老师提出修改意见后：

1. 用 VS Code **文件 → 打开文件夹**打开原来克隆的项目目录。
2. 在左下角选择原来的个人分支。
3. 修改作业并保存。排序改动要重新在网页验证，下载后覆盖 `submissions` 中的原文件。
4. 在源代码管理中检查、暂存、提交。
5. 选择 **Git: Push / Git: 推送**。
6. 回到原 PR，确认最新提交已显示。

**只要原 PR 仍在进行中，推送到同一个来源分支就会更新它，不用重复创建 PR。**

### 13.2 重新打开同一份本地项目

- 第一次获取项目才用“克隆”。以后用 **文件 → 打开最近的项目**，或“打开文件夹”打开同一个目录。
- 在已经发布的个人分支上，如果远程有新提交，先确认本地改动已提交，再执行 **Git: Pull / Git: 拉取**。
- “拉取”更新的是当前分支所跟踪的远程分支。个人分支上点拉取，不会自动把课程仓库 `main` 的更新合进来。

### 13.3 老师安排新的作业时

1. 先确认旧作业已按老师要求处理完成，本地改动已提交并推送。
2. 浏览器打开自己 Fork 的 `main`，点击 **Sync fork → Update branch**，同步课程仓库。
3. 回到 VS Code，切换到本地 `main`，选择 **Git: Pull / Git: 拉取**。
4. 从更新后的 `main` 创建新的个人任务分支，分支名按老师安排填写。
5. 按同样流程提交新作业。

如果同步或切换时出现冲突，保留当前文件和提示，请老师协助。GitHub 同步 Fork 的步骤可参考 [官方说明](https://docs.github.com/en/pull-requests/how-tos/work-with-forks/syncing-a-fork)。

## 14. 常见问题、权限与网络排查

| 遇到的情况 | 怎么处理 |
| --- | --- |
| 没有 Git: Clone，或提示找不到 Git | 安装 Git，完全退出并重开 VS Code；确认使用的是桌面版 VS Code。 |
| 找不到源代码管理 | 按 `Ctrl + Shift + G`。如果显示“初始化仓库”，先确认打开的是克隆出的项目根目录，而不是 ZIP 解压目录或父文件夹。 |
| 不知道哪个是项目根目录 | 打开后应直接看到 `index.html`、`start.ps1`、`members`、`submissions`。 |
| Fork 按钮提示已有副本 | 打开自己账号下已有的 Fork，在 `main` 同步后继续，无需重复创建。 |
| 克隆提示 Repository not found | 从自己的 Fork 页面重新复制 Code → HTTPS 地址，确认用户名和仓库名无误。课程仓库是公开的，查看无需仓库邀请。 |
| 克隆中断、下载很慢、连接超时 | 按第 14.3 节依次检查 GitHub 服务、网络和代理。如果已生成同名目录，保留它并选其他位置重新克隆，避免覆盖已有作业。 |
| 双击 start.bat 只显示代码 | 改用 VS Code 的“终端 → 运行任务 → 启动项目（Windows）”；系统文件资源管理器双击才会运行。 |
| 没有“启动项目（Windows）”任务 | 确认打开项目根目录，并已获得包含 `.vscode/tasks.json` 的课程版本。 |
| 下载 Python 失败 | 首次准备需要联网，检查网络后重新运行；离线机房使用老师提供的同架构 `.runtime` 文件夹。 |
| 8000 端口被占用 | 检查是否已经启动项目，保留一个运行任务；终止之前的重复任务后再启动。 |
| 页面能打开，排序却提示服务未连接 | 从项目任务启动，使用启动窗口显示的地址。排序题不要用 Live Server 的另一个端口打开。 |
| 下载按钮不能点 | 先选择自己的身份，再让当前代码通过当前数组验证。代码、语言、数组变化后都需要重验。 |
| 源代码管理没有自己的排序文件 | 浏览器下载还没放进项目；将文件复制到当前本地仓库的 `submissions`。 |
| 无法提交，提示配置 name / email | 按第 5 步设置当前仓库的 `[user]`，保存后重试；GitHub 登录不会代替该配置。 |
| 文件同时出现在“更改”和“暂存的更改” | 暂存后又修改过。保存后重新点该文件的 `＋`，将最新内容暂存。 |
| 提交后更改列表清空，文件是不是没了 | 提交已记录，文件还在。继续发布分支或推送。 |
| 推送提示 permission denied / 403 | 按第 14.2 节核对 Fork 所有者、远程地址、登录账号和缓存凭据。公开可读不代表可以直接上传。 |
| 浏览器能打开 GitHub，VS Code 一直转圈 | 先找被遮挡的登录窗口；若日志含网络错误，按第 14.3 节检查 Git 自己的代理设置。 |
| Git 一直传不上去，但网页正常 | 本次尚未创建 PR 时，可按第 14.4 节在自己的 Fork 网页上传两个作业文件，再向课程仓库发 PR。 |
| 自己 Fork 的 main 中没有作业 | 在 GitHub 分支下拉框里切换到已发布的个人分支查看。 |
| PR 显示没有差异 | 确认已暂存、提交、推送，且目标为课程仓库 `main`，来源为自己 Fork 的个人分支。 |
| PR 中出现很多不属于自己的文件 | 先不要创建，检查来源分支和目标分支，再请老师核对；不要把其他文件全部提交来消除提示。 |
| 提示冲突、合并失败或推送被拒绝 | 保留提示与本地文件，请老师协助处理，不要点击强制推送或放弃全部更改。 |
| 发起 PR 后还要自己合并吗 | 不需要。看到课程仓库中自己的 PR 编号及 Open 状态即可，合并由老师或维护者处理。 |

### 14.1 先找到真正的错误信息

1. 在 VS Code 按 `Ctrl + Shift + P`，选择 **Git: Show Git Output / Git: 显示 Git 输出**。也可以从“源代码管理 → … → 显示 Git 输出”打开。
2. 看最新一次 `push`、`pull` 或 `clone` 后面的报错。随后出现的 `git status`、`git for-each-ref` 通常只是 VS Code 刷新状态，不是失败原因。
3. 按下面的关键词选择处理路线：

| 日志中的关键词 | 优先检查 |
| --- | --- |
| `[remote rejected] ... (permission denied)`、`Permission to ... denied to ...`、`Authentication failed` | 账号、凭据、仓库写权限；见第 14.2 节。 |
| `403` | 已收到 HTTP 拒绝响应；结合完整报错检查身份、权限或网络策略，不能只凭状态码判断断网。 |
| `Could not resolve host: github.com` | 域名解析失败，检查网络登录、DNS 或代理；见第 14.3 节。 |
| `Failed to connect ... port 443`、`Connection timed out`、`Connection was reset` | 连接被阻断、超时或中断；见第 14.3 节。 |
| `Could not resolve proxy`、`Failed to connect to 127.0.0.1 port ...` | 代理地址错误，或对应代理程序没有运行；见第 14.3 节。 |
| `HTTP/2 stream ...`、`curl 92` | HTTP/2 传输异常，按第 14.3 节的对应处理尝试。 |
| `SSL certificate problem` | 系统时间或证书信任问题，按第 14.3 节检查。 |
| `non-fast-forward`、`fetch first` | 远程有本地没有的提交；先保留并提交本地改动，再拉取，冲突时找老师协助。 |
| `GH006`、`GH013`、`protected branch`、`repository rule violations` | 分支保护或仓库规则；把完整错误交给老师核对，不能靠反复推送解决。 |

如果需要老师帮助，提供“失败操作、远程仓库地址、当前分支、第一条完整报错”。发送日志前遮住令牌、密码等登录信息。

参考：[VS Code Git 输出与故障排查说明](https://code.visualstudio.com/docs/sourcecontrol/troubleshooting)。

### 14.2 本次 permission denied：先查账号和自己的 Fork

例如下面这次推送：

```text
To https://github.com/EchoesOfJune/GreenStudio_FinalTest_2026.git
! [remote rejected] 国电2602-张淇奥 -> 国电2602-张淇奥 (permission denied)
error: failed to push some refs
```

这段日志表明远端已经响应，并拒绝了分支更新；不能直接归为连接超时。**仅凭这几行，还无法确定是哪个账号或哪条规则造成拒绝。** 按以下顺序排查，不用先删项目或重新写作业。

**第一步：确认推送到谁的仓库。**

1. 浏览器打开 GitHub，点击右上角头像，查看自己当前登录的用户名。
2. 再打开自己的 Fork，看左上角的 `用户名/GreenStudio_FinalTest_2026`。
3. 日志示例中的 `EchoesOfJune` 是目标仓库的所有者。如果它不是你自己的 GitHub 用户名，就需要确认是否误用了别人的 Fork 地址；本次统一推送到自己账号下的 Fork。
4. 在 VS Code 按第 5.2 节的方法打开本项目 `.git/config`，找到 `[remote "origin"]`，检查 `url`。如果还有 `pushurl`，它会单独指定上传地址，也要核对。
5. 正确地址从**自己的 Fork 页面 → Code → HTTPS** 复制，应类似 `https://github.com/你的用户名/GreenStudio_FinalTest_2026.git`。
6. 如果只是远程地址填错，且自己的 Fork 确认来自同一个课程仓库，可将 `url` 改成自己的地址；若已有错误的 `pushurl`，也改成同一个地址。保留其他配置，保存后重新“发布分支”，并在提示中选择自己的 `origin`。
7. 如果还没有自己的 Fork，先按第 3 节创建。如果无法确认两个仓库来自同一个课程项目，使用本节末尾“已经误克隆课程仓库并写了作业怎么办”的保留与转移方法。

改成自己的 Fork 地址后，本地的文件、分支和提交仍然保留。**PR 的目标依然是 `UnwrittenJuly/GreenStudio_FinalTest_2026` 的 `main`，不要把推送目标和 PR 目标混在一起。**

**第二步：让 VS Code 和浏览器使用同一个正确账号。**

1. 点击 VS Code 的 **Accounts / 账户** 菜单，通常在左下角。如果登录了错误的 GitHub 账号，先退出该账号。
2. 浏览器确认登录的是拥有自己 Fork 的账号。
3. 回到 VS Code 的 GitHub 视图重新登录并授权；重新执行“发布分支”或“推送”。
4. 如果另有 Git Credential Manager 登录窗口，选择自己的账号并完成浏览器授权。可用 `Alt + Tab` 查看是否有登录窗口被遮挡。

`user.name` 和 `user.email` 只记录提交作者。把姓名改成仓库所有者，不能获得该仓库的上传权限。

**第三步：如果总是自动使用旧账号，清理对应的旧 GitHub 凭据。**

Windows 可能记住了以前的 GitHub 登录。仅退出 VS Code，不一定会清掉 Git 使用的缓存。

1. 按 Windows 键，搜索并打开 **凭据管理器 / Credential Manager**。
2. 选择 **Windows 凭据 → 普通凭据 / Generic Credentials**。
3. 查找 GitHub 对应的 Git 登录记录，名称可能含 `git:https://github.com` 或 `github.com`。展开并核对账号。
4. 只对确认属于错误账号或已失效的 GitHub Git 登录记录点击 **删除 / Remove**。这会让相关 Git 操作下次重新登录，不会删除本地文件；其他软件和账号的记录保留。
5. 重新打开 VS Code 项目，再次发布分支或推送，按浏览器提示登录拥有自己 Fork 的账号。
6. 如果没有找到对应条目，或同时使用多个账号且无法判断，保留现状，请老师协助核对，不要清空整个凭据管理器。

Git for Windows 包含 Git Credential Manager，可以使用浏览器登录。若安装过旧版 Git 且授权窗口无法正常工作，可从 Git 官方安装包更新后重开 VS Code。

参考：[GitHub 的 Windows 凭据缓存与重置说明](https://docs.github.com/en/get-started/git-basics/caching-your-github-credentials-in-git)。

**第四步：地址和账号都正确，仍被远端拒绝。**

再看完整输出是否包含仓库归档、只读、分支保护、规则编号或其他明确原因，交给老师核对。日志里的中文分支名 `国电2602-张淇奥` 本身不能说明失败原因；本课程建议沿用 `student/国电2602-张淇奥` 命名，但改名不能代替权限修复。

### 14.3 真正的网络错误：按这个顺序排查

**第一步：检查网页和 GitHub 服务。**

1. 在浏览器打开 [GitHub](https://github.com) 和自己的 Fork。
2. 如果校园网或 Wi-Fi 要求登录，先完成网络登录，再重试。
3. 查看 [GitHub Status](https://www.githubstatus.com)。若 Git 操作相关服务正在故障，保留本地提交，等待恢复后重试。
4. 若状态正常，可以切换到另一条可用网络，例如手机热点，再回到 VS Code 重试一次。换网络后成功，说明应优先检查原网络的访问限制，请老师或网络管理员协助。

**第二步：浏览器正常，VS Code 却连不上。**

浏览器能访问，不代表 Git 使用了相同的网络路径；VS Code 的网页请求、GitHub 扩展和底层 Git 也可能使用不同的代理配置。

1. 先用 `Alt + Tab` 检查 GitHub 登录窗口，完成授权；没有网络错误时，一直等待也可能是在等登录。
2. 通过 Windows **设置 → 网络和 Internet → 代理**，核对当前网络是否需要代理。不要随意改动学校统一管理的配置。
3. 如果电脑本来就在使用 HTTP 代理，确认代理程序已启动，并从它的界面查看实际的 **HTTP 代理地址和端口**；浏览器扩展中的代理不一定会自动提供给 Git。
4. 如需给 Git 单独配置，按第 5.2 节打开当前仓库 `.git/config`，保留已有内容，在 `[http]` 中填写实际地址。没有这个区段才新增：

   ```ini
   [http]
       proxy = http://127.0.0.1:替换为实际HTTP代理端口
   ```

5. 上面是配置格式，**不能原样粘贴占位文字**。请使用当前代理软件或老师提供的完整 HTTP 地址；端口必须来自实际配置，不要猜。如果已有 `[http]`，只修改对应 `proxy` 行。
6. 保存后在 VS Code 重试。此配置只影响当前仓库；使用期间对应代理必须运行。以后不再需要代理时，删除自己本次新增的 `proxy` 行，或恢复修改前的值。
7. 如果自己没有使用代理，不要凭空添加。日志出现 `127.0.0.1` 端口连接失败时，先检查是否残留了已关闭的旧代理配置。
8. 当前仓库里没有旧设置，或配置后仍连接旧代理时，可在 VS Code 按 `Ctrl + O` 打开 `%USERPROFILE%\.gitconfig`，查看用户级的 `[http]` 或 `[http "https://github.com"]` 代理配置。URL 专用配置可能优先于通用的 `[http]` 配置。只恢复自己以前添加、现已不用的条目；若文件不存在，直接跳过，机房统一配置请老师处理。

VS Code 设置里的 `http.proxy` 不应被当作 Git 代理已配置成功的依据。以重新操作后的 **Git 输出**是否成功为准。

**第三步：按具体报错处理，避免反复改无关设置。**

| 报错 | 建议操作 |
| --- | --- |
| `Could not resolve host` | 先完成网络登录、切换可用网络；仍失败时请网络管理员检查 DNS。无需为此重建仓库。 |
| `Failed to connect ... port 443`、超时、连接重置 | 检查网络访问限制和代理；稍后重试，或切换网络对比。 |
| `Could not resolve proxy`、本机代理端口无法连接 | 确认代理程序正在运行，地址和 HTTP 端口正确；不用代理时恢复自己添加的配置。 |
| `HTTP/2 stream ...` 或 `curl 92` | 可在本仓库 `.git/config` 的 `[http]` 下设置 `version = HTTP/1.1`；没有该区段才新建，已有该行则修改，保存后重试。这只是 HTTP/2 传输异常的兼容尝试，不能修复权限或 DNS；无效时恢复原值或删除新增行。 |
| `SSL certificate problem` | 核对 Windows 日期和时间是否正确，更新 Git；学校网络需要专用证书时，请管理员按要求安装可信证书。保持证书验证开启。 |

不必为了修网络改作业文件、重新提交或强制推送，也不要把 `origin` 换成不明下载镜像。网络恢复后，在原个人分支重试“发布分支 / 推送”即可；若曾连接超时，也先到自己 Fork 的对应分支确认是否实际已经上传成功。

参考：[GitHub 网络连接排查](https://docs.github.com/en/get-started/using-github/troubleshooting-connectivity-problems)、[Git HTTP 代理与协议配置](https://git-scm.com/docs/git-config)。

### 14.4 应急交作业：网页正常，但 Git 上传持续失败

如果本次还没有成功创建 PR，而 GitHub 网页可正常使用，可以把最终两个文件上传到**自己的 Fork**，再发起 PR。这个方法依然需要正确账号和仓库写权限，不能绕过权限或仓库规则。

1. 保留本地项目和已经验证的两个文件。
2. 浏览器打开自己的 Fork，从 `main` 的分支下拉框创建一个新的个人分支，例如 `student/国电2602-张淇奥-web`，并确认当前选中的是它。
3. 先进入网页仓库的 `members` 文件夹，再选择 **Add file → Upload files**，上传自己的 `15.html`（其他同学使用自己的编号）。
4. 填写提交说明，将文件提交到当前个人分支；核对它确实更新了 `members/15.html`，而不是根目录的同名文件。
5. 再进入 `submissions` 文件夹，用同样方法上传 `国电2602_张淇奥.py`，按所选语言使用对应扩展名，并提交到同一个个人分支。
6. 检查两个路径和文件内容，然后按第 12 节的浏览器流程，向课程仓库 `UnwrittenJuly/GreenStudio_FinalTest_2026` 的 `main` 发起 PR，来源选择这个带 `-web` 的分支。
7. 看到课程仓库中的 PR 编号和 Open 状态即完成提交。后续如需补交修改，可以在这个 PR 的同一来源分支继续网页上传。

网页上传会生成新的远程提交，不会自动同步回本地。**使用应急路线后，先不要继续推送原本地作业分支或强制覆盖远程。** 后续回到 VS Code 开发时，可另选目录重新克隆自己的 Fork，切换到 PR 的 `-web` 来源分支继续；原项目保留作备份。

参考：[GitHub 网页上传文件说明](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository)。

### 已经误克隆课程仓库并写了作业怎么办

1. 保留原项目目录，以及自己的介绍和排序文件。
2. 按第 3 步在 GitHub 建立自己的 Fork。
3. 另选一个父文件夹，用 VS Code 克隆自己的 Fork，不要覆盖原项目。
4. 在新克隆的项目中配置姓名邮箱、从 `main` 创建个人分支。
5. 将原目录里自己的两个作业文件复制到新项目对应位置，检查内容。
6. 按第 9～12 步完成暂存、提交、上传和 PR。

转移时只复制自己的作业文件，不要复制原目录的 `.git` 文件夹。

## 15. 提交完成前，最后核对一次

- [ ] GitHub 登录的是自己的账号，已 Fork 课程仓库。
- [ ] 本地仓库来自自己的 Fork，提交姓名和邮箱已配置。
- [ ] 使用自己的 `student/...` 分支完成作业。
- [ ] 自己的介绍文件已完成，姓名班级正确，网页和窄屏预览正常。
- [ ] 排序代码已验证多组数组，下载的是最终版本。
- [ ] `submissions` 中的文件名为自己的 `班级_姓名.py/c/cpp`，没有重复副本。
- [ ] 只提交了自己的一个介绍文件和一个排序文件。
- [ ] 个人分支已上传，在自己 GitHub 的对应分支能看到最新文件。
- [ ] PR 目标是 `UnwrittenJuly/GreenStudio_FinalTest_2026` 的 `main`，来源是自己 Fork 的个人分支。
- [ ] 已按实际情况填写 PR 模板，确认课程仓库里出现自己的 PR 编号和 Open 状态。

做到最后一项，同学的提交任务就完成了。
