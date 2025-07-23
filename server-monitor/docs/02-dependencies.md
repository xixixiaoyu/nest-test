# 02 - 依赖安装

本章将指导您安装服务器监控 API 所需的所有依赖包，并详细解释每个依赖的作用和用途。

## 🎯 学习目标

- 了解项目所需的核心依赖
- 学会正确安装和配置依赖包
- 理解每个依赖包的作用
- 掌握依赖管理的最佳实践

## 📦 依赖分类

我们的服务器监控项目需要以下几类依赖：

### 1. 核心运行时依赖
- NestJS 框架核心包
- 系统信息获取库
- 基础工具库

### 2. 开发时依赖
- TypeScript 编译器
- 代码检查工具
- 测试框架

## 🚀 安装核心依赖

### NestJS 核心包

如果您在上一章没有安装，请运行：

```bash
npm install @nestjs/common @nestjs/core @nestjs/platform-express
```

**包说明：**
- `@nestjs/common` - NestJS 核心装饰器和工具
- `@nestjs/core` - NestJS 框架核心
- `@nestjs/platform-express` - Express 平台适配器

### 系统监控依赖

```bash
npm install node-disk-info
```

**包说明：**
- `node-disk-info` - 跨平台磁盘信息获取库，支持 Windows、Linux、macOS

### 基础运行时依赖

```bash
npm install reflect-metadata rxjs
```

**包说明：**
- `reflect-metadata` - 装饰器元数据支持，NestJS 必需
- `rxjs` - 响应式编程库，NestJS 内部使用

## 🛠️ 安装开发依赖

### TypeScript 相关

```bash
npm install -D typescript @types/node ts-node tsconfig-paths
```

**包说明：**
- `typescript` - TypeScript 编译器
- `@types/node` - Node.js 类型定义
- `ts-node` - 直接运行 TypeScript 文件
- `tsconfig-paths` - 路径映射支持

### NestJS 开发工具

```bash
npm install -D @nestjs/cli @nestjs/schematics @nestjs/testing
```

**包说明：**
- `@nestjs/cli` - NestJS 命令行工具
- `@nestjs/schematics` - 代码生成器
- `@nestjs/testing` - 测试工具包

### 测试框架

```bash
npm install -D jest @types/jest ts-jest supertest @types/supertest
```

**包说明：**
- `jest` - JavaScript 测试框架
- `@types/jest` - Jest 类型定义
- `ts-jest` - Jest 的 TypeScript 预处理器
- `supertest` - HTTP 断言库
- `@types/supertest` - Supertest 类型定义

### 代码质量工具

```bash
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install -D prettier eslint-config-prettier eslint-plugin-prettier
```

**包说明：**
- `eslint` - JavaScript/TypeScript 代码检查工具
- `@typescript-eslint/parser` - TypeScript ESLint 解析器
- `@typescript-eslint/eslint-plugin` - TypeScript ESLint 规则
- `prettier` - 代码格式化工具
- `eslint-config-prettier` - 禁用与 Prettier 冲突的 ESLint 规则
- `eslint-plugin-prettier` - 将 Prettier 作为 ESLint 规则运行

## 📋 完整的 package.json

安装完所有依赖后，您的 `package.json` 应该类似这样：

```json
{
  "name": "server-monitor",
  "version": "0.0.1",
  "description": "服务器监控 API",
  "author": "Your Name",
  "private": true,
  "license": "MIT",
  "scripts": {
    "build": "nest build",
    "format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\"",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/main",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
    "test:e2e": "jest --config ./test/jest-e2e.json"
  },
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "node-disk-info": "^1.3.0",
    "reflect-metadata": "^0.1.13",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@nestjs/schematics": "^10.0.0",
    "@nestjs/testing": "^10.0.0",
    "@types/jest": "^29.5.2",
    "@types/node": "^20.3.1",
    "@types/supertest": "^2.0.12",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.42.0",
    "eslint-config-prettier": "^9.0.0",
    "eslint-plugin-prettier": "^5.0.0",
    "jest": "^29.5.0",
    "prettier": "^3.0.0",
    "source-map-support": "^0.5.21",
    "supertest": "^6.3.3",
    "ts-jest": "^29.1.0",
    "ts-loader": "^9.4.3",
    "ts-node": "^10.9.1",
    "tsconfig-paths": "^4.2.0",
    "typescript": "^5.1.3"
  }
}
```

## 🔧 依赖配置

### Jest 测试配置

在 `package.json` 中添加 Jest 配置：

```json
{
  "jest": {
    "moduleFileExtensions": [
      "js",
      "json",
      "ts"
    ],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": {
      "^.+\\.(t|j)s$": "ts-jest"
    },
    "collectCoverageFrom": [
      "**/*.(t|j)s"
    ],
    "coverageDirectory": "../coverage",
    "testEnvironment": "node"
  }
}
```

### ESLint 配置

创建 `.eslintrc.js` 文件：

```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: [
    '@typescript-eslint/recommended',
    'prettier',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
  },
};
```

### Prettier 配置

创建 `.prettierrc` 文件：

```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "tabWidth": 2,
  "semi": true,
  "printWidth": 80,
  "endOfLine": "lf"
}
```

## 🧪 验证依赖安装

### 检查依赖版本

```bash
npm list --depth=0
```

### 运行代码检查

```bash
npm run lint
```

### 运行代码格式化

```bash
npm run format
```

### 运行测试

```bash
npm run test
```

## 📊 依赖分析

### node-disk-info 详解

这是我们项目中最重要的第三方依赖，让我们深入了解它：

```typescript
// 基本用法示例
import * as nodeDiskInfo from 'node-disk-info';

async function getDiskInfo() {
  try {
    const disks = await nodeDiskInfo.getDiskInfo();
    console.log(disks);
  } catch (error) {
    console.error('获取磁盘信息失败:', error);
  }
}
```

**返回数据格式：**
```typescript
interface DiskInfo {
  filesystem: string;    // 文件系统类型，如 'NTFS', 'ext4'
  blocks: number;        // 总块数（字节）
  used: number;          // 已使用块数（字节）
  available: number;     // 可用块数（字节）
  capacity: string;      // 使用率百分比，如 '45%'
  mounted: string;       // 挂载点，如 'C:\' 或 '/'
}
```

**跨平台支持：**
- **Windows**: 支持所有驱动器（C:, D:, E: 等）
- **Linux**: 支持所有挂载点
- **macOS**: 支持所有卷

## 🔒 安全考虑

### 依赖安全检查

定期检查依赖包的安全漏洞：

```bash
npm audit
```

如果发现漏洞，可以尝试自动修复：

```bash
npm audit fix
```

### 锁定依赖版本

使用 `package-lock.json` 或 `pnpm-lock.yaml` 锁定依赖版本：

```bash
# 使用 npm
npm ci

# 使用 pnpm
pnpm install --frozen-lockfile
```

## 📈 性能优化

### 减少依赖体积

只安装必要的依赖，避免安装不需要的包：

```bash
# 检查未使用的依赖
npm install -g depcheck
depcheck
```

### 使用生产依赖

在生产环境中只安装生产依赖：

```bash
npm install --production
```

## 🎉 小结

在这一章中，我们学习了：

1. **依赖分类**：核心依赖和开发依赖的区别
2. **包管理**：如何正确安装和配置依赖包
3. **工具配置**：ESLint、Prettier、Jest 的配置
4. **安全实践**：依赖安全检查和版本锁定
5. **性能优化**：减少依赖体积的方法

## 🔗 下一步

现在您已经安装了所有必要的依赖，接下来我们将学习 [项目结构设计](./03-project-structure.md)，了解如何组织代码文件。

## 💡 常见问题

### Q: 为什么需要 reflect-metadata？

A: `reflect-metadata` 是 NestJS 装饰器系统的基础，它提供了运行时元数据支持，使得依赖注入和装饰器功能能够正常工作。

### Q: 可以使用 yarn 而不是 npm 吗？

A: 可以，但建议在整个项目中保持一致。如果使用 yarn，请删除 `package-lock.json` 并使用 `yarn.lock`。

### Q: node-disk-info 在某些环境下不工作怎么办？

A: 这通常是权限问题。确保应用有足够的权限访问系统信息，或者添加错误处理来优雅地处理失败情况。

### Q: 如何更新依赖到最新版本？

A: 使用以下命令检查和更新：

```bash
# 检查过时的包
npm outdated

# 更新所有包到最新版本
npm update

# 更新特定包
npm install package-name@latest
```
