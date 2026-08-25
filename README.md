# CSSummerCampDDL

国内计算机保研 · 夏令营 / 预推免 截止日期速查表，部署在 [ddl.csbaoyan.top](https://ddl.csbaoyan.top)。

数据来源于 CS-BAOYAN 社区维护的 [BoardCaster](https://github.com/CS-BAOYAN/BoardCaster) 数据库与 [CSSummerCamp](https://github.com/CS-BAOYAN/CSSummerCamp2024) 仓库。

## 技术栈

- **Svelte 5**（runes 模式）+ **Vite 6** + **Tailwind CSS v4**
- TypeScript
- 全部数据于构建时打包进 bundle，运行时无 API 调用
- 单一 1Hz 时钟驱动全部倒计时（不再 1 秒重 fetch JSON）

## 主要功能

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
- 跟随系统 / 浅色 / 深色三态主题循环 · 移动端筛选抽屉

## 本地开发

```bash
pnpm install   # 或 npm i / bun i
pnpm run dev   # http://localhost:5180
pnpm run build # → dist/
pnpm run preview
pnpm run deploy   # 推送 dist/ 到 gh-pages 分支
```

`predev` / `prebuild` 钩子会从 `scripts/source/universities.json` 抽取 logo 映射，写入 `src/data/logos.json`，避免完整的 2400+ 学校排名数据进 bundle。

## 数据贡献

请在本仓库提 Issue，或到 [BoardCaster](https://github.com/CS-BAOYAN/BoardCaster) 提 Issue / PR。

## 许可

[MIT License](LICENSE)。
