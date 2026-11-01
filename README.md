# 记账小账本 · Expense Tracker

一个**纯前端、零依赖**的个人记账 Web 应用。所有数据保存在浏览器本地（localStorage），无需注册登录、无需后端服务器，打开即用，可一键部署到 GitHub Pages。

> 适合作为前端入门 / 作品集（portfolio）项目：使用原生 HTML + CSS + JavaScript 实现，不依赖任何框架或第三方库。

## ✨ 功能特性

- **记一笔**：支出 / 收入切换，金额、分类、日期、备注
- **流水列表**：按月展示，可单条删除
- **本月收支汇总**：收入 / 支出 / 结余三张卡片
- **筛选**：按月份、按分类快速过滤
- **汇总分析看板**（纯 SVG 手绘图表，无任何图表库）：
  - 支出分类占比（饼图）
  - 分类支出排行（横向条形）
  - 近 12 个月收支趋势（柱状图）
- **多账本切换**：基于「账本密钥」的本地命名空间，可在同一浏览器内切换多个独立账本
- **导出 / 导入备份**：把当前账本导出为 JSON 文件，换设备或清缓存后可导入恢复

## 🛠 技术栈

| 类别 | 实现 |
| --- | --- |
| 结构 | 原生 HTML5 |
| 样式 | 原生 CSS3（响应式，移动端友好） |
| 逻辑 | 原生 JavaScript（ES5 语法，兼容性好） |
| 图表 | 纯 SVG 手写绘制（饼图 / 条形 / 柱状），零依赖 |
| 存储 | localStorage + JSON 文件备份 |

**无任何外部依赖、无构建步骤、无网络请求。**

## 🚀 本地运行

直接用浏览器打开 `index.html` 即可；或启动一个本地静态服务：

```bash
# Python
python3 -m http.server 8000
# 然后访问 http://localhost:8000

# 或 Node
npx serve .
```

## 📦 部署到 GitHub Pages

1. 把本仓库 Fork / 克隆到你的 GitHub 账号
2. 在仓库 **Settings → Pages** 中，选择部署来源为 `main` 分支的 `/root`（或 `gh-pages` 分支）
3. 等待片刻，访问 `https://jingwen100.github.io/expense-tracker/`

由于是纯静态站点，也可以部署到任何静态托管平台（Vercel、Netlify、Cloudflare Pages 等）。

## 📁 目录结构

```
.
├── index.html    # 页面结构
├── style.css     # 样式
├── app.js        # 业务逻辑与图表绘制
├── LICENSE       # MIT
└── README.md
```

## ⚠️ 数据说明

数据保存在**当前浏览器**的 localStorage 中：

- 清浏览器缓存、换设备后，本地账本会丢失；
- 请养成**定期导出备份**的习惯，在需要时通过「导入备份」恢复。

## 📄 License

[MIT](LICENSE)
