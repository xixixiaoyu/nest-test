# 01 - 项目初始化

本章将指导您如何从零开始创建一个 NestJS 项目，为服务器监控 API 的开发做好准备。

## 🎯 学习目标

- 了解 NestJS 框架的基本概念
- 学会创建和配置 NestJS 项目
- 理解项目的基本结构
- 配置开发环境

## 📋 前置条件

在开始之前，请确保您的系统已安装：

- **Node.js** (>= 16.0.0)
- **npm** (>= 7.0.0) 或 **pnpm** (>= 6.0.0)
- **Git** (用于版本控制)
- 代码编辑器（推荐 VS Code）

## 🚀 创建项目

### 方法一：使用 NestJS CLI（推荐）

```bash
# 全局安装 NestJS CLI
npm install -g @nestjs/cli

# 创建新项目
nest new server-monitor

# 进入项目目录
cd server-monitor
```

### 方法二：使用 npm 直接创建

```bash
# 创建项目目录
mkdir server-monitor
cd server-monitor

# 初始化 package.json
npm init -y

# 安装 NestJS 核心依赖
npm install @nestjs/common @nestjs/core @nestjs/platform-express reflect-metadata rxjs

# 安装开发依赖
npm install -D @nestjs/cli @nestjs/schematics @nestjs/testing typescript @types/node ts-node
```

## 📁 项目结构解析

创建完成后，您会看到以下目录结构：

```
server-monitor/
├── src/                    # 源代码目录
│   ├── app.controller.ts   # 应用控制器
│   ├── app.module.ts       # 应用模块
│   ├── app.service.ts      # 应用服务
│   └── main.ts            # 应用入口文件
├── test/                   # 测试文件目录
├── node_modules/           # 依赖包目录
├── package.json           # 项目配置文件
├── tsconfig.json          # TypeScript 配置
├── tsconfig.build.json    # 构建配置
└── nest-cli.json          # NestJS CLI 配置
```

### 核心文件说明

#### `src/main.ts` - 应用入口

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();
```

**关键点：**
- `NestFactory.create()` 创建应用实例
- `app.listen(3000)` 启动服务器，监听 3000 端口
- `bootstrap()` 函数是应用的启动入口

#### `src/app.module.ts` - 根模块

```typescript
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

**关键点：**
- `@Module()` 装饰器定义模块
- `controllers` 数组包含所有控制器
- `providers` 数组包含所有服务提供者
- `imports` 数组包含导入的其他模块

#### `src/app.controller.ts` - 应用控制器

```typescript
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
```

**关键点：**
- `@Controller()` 装饰器定义控制器
- `@Get()` 装饰器定义 GET 路由
- 构造函数注入依赖服务

#### `src/app.service.ts` - 应用服务

```typescript
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
}
```

**关键点：**
- `@Injectable()` 装饰器标记可注入的服务
- 包含业务逻辑的具体实现

## ⚙️ 配置文件详解

### `package.json` 脚本配置

```json
{
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
    "test:e2e": "jest --config ./test/jest-e2e.json"
  }
}
```

**常用命令：**
- `npm run start:dev` - 开发模式启动（热重载）
- `npm run build` - 构建项目
- `npm run test` - 运行测试
- `npm run lint` - 代码检查

### `tsconfig.json` TypeScript 配置

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "es2017",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": false,
    "noImplicitAny": false,
    "strictBindCallApply": false,
    "forceConsistentCasingInFileNames": false,
    "noFallthroughCasesInSwitch": false
  }
}
```

**重要配置项：**
- `experimentalDecorators: true` - 启用装饰器支持
- `emitDecoratorMetadata: true` - 生成装饰器元数据
- `target: "es2017"` - 编译目标版本

## 🧪 验证安装

### 启动开发服务器

```bash
npm run start:dev
```

您应该看到类似的输出：

```
[Nest] 12345  - 01/01/2024, 10:00:00 AM     LOG [NestFactory] Starting Nest application...
[Nest] 12345  - 01/01/2024, 10:00:00 AM     LOG [InstanceLoader] AppModule dependencies initialized +20ms
[Nest] 12345  - 01/01/2024, 10:00:00 AM     LOG [RoutesResolver] AppController {/}: +4ms
[Nest] 12345  - 01/01/2024, 10:00:00 AM     LOG [RouterExplorer] Mapped {/, GET} route +2ms
[Nest] 12345  - 01/01/2024, 10:00:00 AM     LOG [NestApplication] Nest application successfully started +2ms
```

### 测试默认接口

打开浏览器访问 `http://localhost:3000`，您应该看到 "Hello World!" 消息。

或者使用 curl 命令：

```bash
curl http://localhost:3000
# 输出: Hello World!
```

## 🔧 开发环境配置

### VS Code 扩展推荐

为了更好的开发体验，建议安装以下 VS Code 扩展：

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-json"
  ]
}
```

### 代码格式化配置

创建 `.prettierrc` 文件：

```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "tabWidth": 2,
  "semi": true,
  "printWidth": 80
}
```

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

## 🎉 小结

恭喜！您已经成功创建了一个 NestJS 项目。在这一章中，我们学习了：

1. **项目创建**：使用 NestJS CLI 创建项目
2. **项目结构**：了解各个文件的作用
3. **核心概念**：模块、控制器、服务的基本概念
4. **配置文件**：TypeScript 和项目配置
5. **开发环境**：代码格式化和编辑器配置

## 🔗 下一步

现在您已经有了一个基础的 NestJS 项目，接下来我们将学习如何 [安装必要的依赖包](./02-dependencies.md) 来支持服务器监控功能。

## 💡 常见问题

### Q: 为什么选择 NestJS 而不是 Express？

A: NestJS 提供了：
- 更好的代码组织结构
- 内置的依赖注入系统
- TypeScript 原生支持
- 丰富的装饰器系统
- 更好的测试支持

### Q: 可以使用 JavaScript 而不是 TypeScript 吗？

A: 虽然 NestJS 支持 JavaScript，但强烈推荐使用 TypeScript，因为：
- 更好的类型安全
- 更好的 IDE 支持
- 装饰器的完整支持
- 更好的代码维护性

### Q: 如何修改默认端口？

A: 在 `main.ts` 文件中修改：

```typescript
await app.listen(process.env.PORT || 3000);
```

或者使用环境变量：

```bash
PORT=8080 npm run start:dev
```
