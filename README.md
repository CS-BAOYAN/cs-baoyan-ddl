# CSSummerCampDDL

国内计算机保研 · 夏令营 / 预推免 截止日期速查表，部署在 [ddl.csbaoyan.top](https://ddl.csbaoyan.top)。

数据来源于 CS-BAOYAN 社区维护的 [BoardCaster](https://github.com/CS-BAOYAN/BoardCaster) 数据库与 [CSSummerCamp](https://github.com/CS-BAOYAN/CSSummerCamp2024) 仓库。

## 技术栈

- **Svelte 5**（runes 模式）+ **Vite 6** + **Tailwind CSS v4**
- TypeScript
- 全部数据于构建时打包进 bundle，运行时无 API 调用
- 单一 1Hz 时钟驱动全部倒计时（不再 1 秒重 fetch JSON）

## 主要功能

### 基础功能

- 数据源切换（夏令营 2026 / 2025 / 2024 / 预推免 2024）
- 学校档次（TOP2 / 港三 / 华五 / C9 / 985 / 211 / 双非 / 四非 / 研究院 / 联培）OR 筛选
- 状态（已开营 / 已结营）AND 筛选
- 31 个省份按学校精确匹配筛选
- 即时搜索（学校 + 学院）
- 实时倒计时（紧迫度色阶：红 / 琥珀 / 青 / 翠）
- **列表 / 月历** 双视图
- 详情侧滑面板（替代旧版模态弹窗）
- URL 状态同步（筛选条件可分享、刷新不丢失）
- 键盘快捷键：`/` 聚焦搜索 · `j/k` 上下移动 · `Enter` 详情 · `Esc` 关闭 · `?` 帮助
- 深色 / 浅色主题切换 · 移动端筛选抽屉

### 个人进度跟踪

- **关注院校**（🔖）：标记感兴趣的院校，支持「仅显示关注」筛选
- **加入行程**（📅）：将关注的院校加入行程表，用于营期规划和冲突检测
- **申请进度**：为每所院校记录申请状态（未申请 / 已报名 / 已入营 / 优营 / 待录取 / 已拒 / 放弃 / 待确认）
- **个人备注**：支持申请日期、备注、附件链接
- **导入 / 导出**：JSON 格式备份，支持合并或覆盖导入

### 智能信息提取

- **大模型解析**（✨）：调用 LLM API 解析学校官网，自动提取开营时间、报销信息等
- **手动粘贴解析**：对于 CORS 无法抓取的页面（如微信公众号文章），支持手动粘贴通知正文进行精准提取
- **提取结果修正**：提取后可手动修正不准确的数据，确认后保存
- **扩展数据存储**：提取的扩展信息（开营时间、报销等）存储在浏览器 localStorage，不影响原始公共数据

### 夏令营行程表

- **日历视图**：以月历形式展示所有行程院校的营期，支持月份切换
- **冲突检测**：自动检测时间重叠的营期，显示冲突对和建议
- **甘特图色条**：营期在日历上以彩色方块展示，冲突标红、进行中标金
- **一键粘贴解析**：在行程表内直接对每所院校粘贴通知正文，精准提取营期

## 本地开发

```bash
pnpm install   # 或 npm i / bun i
pnpm run dev   # http://localhost:5180
pnpm run build # → dist/
pnpm run preview
pnpm run deploy   # 推送 dist/ 到 gh-pages 分支
```

`predev` / `prebuild` 钩子会从 `scripts/source/universities.json` 抽取 logo 映射，写入 `src/data/logos.json`，避免完整的 2400+ 学校排名数据进 bundle。

### 构建时 LLM 提取（可选）

```bash
OPENAI_API_KEY=sk-xxx tsx scripts/extract-extended.ts
```

读取 `schools.json` 中学校的官网链接，调用 LLM 提取扩展信息，输出到 `src/data/extended.json`。支持增量更新（跳过 30 天内已验证的数据）。

## 数据贡献

请在本仓库提 Issue，或到 [BoardCaster](https://github.com/CS-BAOYAN/BoardCaster) 提 Issue / PR。

## 许可

[MIT License](LICENSE)。
