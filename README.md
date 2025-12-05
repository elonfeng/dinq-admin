# Dinq Admin - 后台管理系统

Dinq 后台管理系统是一个现代化的 Web 管理界面，用于监控和管理 Dinq Tools 服务，包括实时系统监控、成就网络权重调试和任务历史查询功能。

## ✨ 功能特性

### 🎯 核心功能

- **系统监控** - 实时查看 Dinq Tools 服务运行状态
  - 队列状态监控（活跃任务、排队任务）
  - 系统资源监控（CPU、内存）
  - 7天统计数据和峰值分析
  - 自动刷新（可配置间隔）

- **权重配置** - 调整权重参数
  - 26个可调权重参数（关系、成就类别、拓扑、影响力、时间、评分）
  - 配置保存和加载（localStorage）
  - 实时网络图谱预览（ECharts 力导向图）
  - 参数验证和未保存警告

- **任务历史** - 查询和管理异步任务
  - 任务列表分页展示
  - 状态筛选和日期范围筛选
  - 任务详情查看（参数、结果、错误信息）
  - 失败任务重试
  - 任务状态轮询

### 🎨 设计特点

- 浅色系简约风格
- 响应式设计，支持桌面和平板
- 暗黑模式切换
- 流畅的交互动画
- 友好的错误提示

## 🛠️ 技术栈

- **框架**: Vue 3.4+ (Composition API)
- **语言**: TypeScript 5.x
- **构建工具**: Vite 5.x
- **UI 组件**: Ant Design Vue 4.2.6+
- **状态管理**: Pinia
- **路由**: Vue Router 4
- **数据可视化**: ECharts 5.x + vue-echarts
- **HTTP 客户端**: Axios
- **工具库**: @vueuse/core

## 📦 安装

### 环境要求

- Node.js >= 18.x
- npm >= 9.x 或 pnpm >= 8.x

### 安装依赖

```bash
cd dinq_admin
npm install
```

## 🚀 开发

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173/

### 环境配置

创建 `.env.local` 文件（可选）：

```env
# API 基础 URL（默认代理到 localhost:8081）
VITE_API_BASE_URL=http://localhost:8081
```

### 项目结构

```
dinq_admin/
├── src/
│   ├── assets/          # 静态资源
│   │   └── styles/      # 全局样式
│   ├── components/      # 可复用组件
│   │   ├── layout/      # 布局组件
│   │   ├── monitor/     # 监控组件
│   │   ├── weight/      # 权重配置组件
│   │   └── task/        # 任务历史组件
│   ├── composables/     # 组合式函数
│   ├── router/          # 路由配置
│   ├── services/        # API 服务
│   ├── stores/          # Pinia 状态管理
│   ├── types/           # TypeScript 类型定义
│   ├── utils/           # 工具函数
│   ├── views/           # 页面组件
│   ├── App.vue          # 根组件
│   └── main.ts          # 入口文件
├── public/              # 公共静态资源
├── .env.development     # 开发环境变量
├── .env.production      # 生产环境变量
├── vite.config.ts       # Vite 配置
├── tsconfig.json        # TypeScript 配置
└── package.json         # 依赖配置
```

## 🏗️ 构建

### 构建生产版本

```bash
npm run build
```

构建产物输出到 `dist/` 目录。

### 预览生产构建

```bash
npm run preview
```

## 📝 代码规范

### 运行 Lint

```bash
npm run lint
```

### 格式化代码

```bash
npm run format
```

## 🔧 配置说明

### API 代理配置

`vite.config.ts` 中配置了开发环境 API 代理：

```typescript
export default defineConfig({
  server: {
    proxy: {
      '/tool': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
    },
  },
})
```

### 路由配置

支持以下路由：

- `/monitor` - 系统监控
- `/weight-config` - 权重配置
- `/task-history` - 任务历史

## 🚢 部署

### 部署到 Nginx

1. 构建生产版本：
   ```bash
   npm run build
   ```

2. 将 `dist/` 目录内容复制到 Nginx 网站根目录

3. 配置 Nginx（参考 `nginx.conf.example`）

### Docker 部署

```bash
# 构建镜像
docker build -t dinq-admin .

# 运行容器
docker run -p 8080:80 dinq-admin
```

## 🤝 开发指南

### 添加新页面

1. 在 `src/views/` 创建页面组件
2. 在 `src/router/index.ts` 添加路由
3. 在 `src/components/layout/AppLayout.vue` 添加菜单项

### 添加新的 API 服务

1. 在 `src/types/` 定义类型
2. 在 `src/services/` 创建 API 服务
3. 在 `src/stores/` 创建 Store（如需要）
4. 在 `src/composables/` 创建 Composable（如需要）

### 主题定制

修改 `src/assets/styles/variables.css` 中的 CSS 变量。

## 📋 待办事项

- [ ] 添加单元测试
- [ ] 添加 E2E 测试
- [ ] 性能优化（Lighthouse 分数 > 90）
- [ ] 多语言支持

## 📄 License

MIT

## 👥 贡献者

本项目由 Claude Code 辅助开发。

## 📧 联系方式

如有问题或建议，请提交 Issue。
