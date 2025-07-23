# 03 - 项目结构

本章将详细介绍服务器监控 API 项目的目录结构设计，帮助您理解如何组织代码文件以实现良好的可维护性和可扩展性。

## 🎯 学习目标

- 理解 NestJS 项目的标准结构
- 学会设计清晰的目录层次
- 掌握文件命名规范
- 了解模块化开发的最佳实践

## 📁 完整项目结构

```
server-monitor/
├── src/                          # 源代码目录
│   ├── app.controller.spec.ts    # 应用控制器测试
│   ├── app.controller.ts         # 应用控制器
│   ├── app.module.ts             # 根模块
│   ├── app.service.ts            # 应用服务
│   ├── main.ts                   # 应用入口文件
│   └── utils/                    # 工具函数目录
│       ├── system-info.ts        # 系统信息获取工具
│       └── demo.ts               # 演示代码
├── test/                         # 端到端测试目录
│   ├── app.e2e-spec.ts          # E2E 测试文件
│   └── jest-e2e.json            # E2E 测试配置
├── docs/                         # 文档目录
│   ├── README.md                 # 文档首页
│   ├── 01-project-setup.md      # 项目初始化文档
│   ├── 02-dependencies.md       # 依赖安装文档
│   └── ...                      # 其他文档文件
├── dist/                         # 编译输出目录（自动生成）
├── node_modules/                 # 依赖包目录
├── coverage/                     # 测试覆盖率报告（自动生成）
├── .eslintrc.js                 # ESLint 配置
├── .prettierrc                  # Prettier 配置
├── .gitignore                   # Git 忽略文件
├── nest-cli.json                # NestJS CLI 配置
├── package.json                 # 项目配置文件
├── package-lock.json            # 依赖锁定文件
├── README.md                    # 项目说明文档
├── tsconfig.json                # TypeScript 配置
└── tsconfig.build.json          # 构建配置
```

## 🏗️ 核心目录详解

### `src/` 源代码目录

这是项目的核心目录，包含所有的业务逻辑代码。

#### 主要文件说明

**`main.ts` - 应用入口文件**
```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 启用 CORS（如果需要）
  app.enableCors();
  
  // 设置全局前缀（可选）
  app.setGlobalPrefix('api');
  
  await app.listen(3000);
  console.log('服务器监控 API 启动成功，端口: 3000');
}
bootstrap();
```

**`app.module.ts` - 根模块**
```typescript
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [],           // 导入其他模块
  controllers: [AppController],  // 注册控制器
  providers: [AppService],       // 注册服务提供者
})
export class AppModule {}
```

**`app.controller.ts` - 应用控制器**
```typescript
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import {
  getCpuInfo,
  getMemInfo,
  getDiskInfo,
  getSysInfo,
  getDynamicCpuUsage,
} from './utils/system-info';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // 监控相关的路由将在这里定义
}
```

### `utils/` 工具函数目录

存放可复用的工具函数和辅助代码。

**目录结构：**
```
utils/
├── system-info.ts    # 系统信息获取函数
├── demo.ts          # 演示代码
├── constants.ts     # 常量定义（可选）
├── helpers.ts       # 辅助函数（可选）
└── types.ts         # 类型定义（可选）
```

### `test/` 测试目录

包含端到端（E2E）测试文件。

**`app.e2e-spec.ts` 示例：**
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  afterAll(async () => {
    await app.close();
  });
});
```

## 📋 文件命名规范

### NestJS 官方命名约定

| 文件类型 | 命名格式 | 示例 |
|---------|---------|------|
| 控制器 | `*.controller.ts` | `app.controller.ts` |
| 服务 | `*.service.ts` | `app.service.ts` |
| 模块 | `*.module.ts` | `app.module.ts` |
| 中间件 | `*.middleware.ts` | `auth.middleware.ts` |
| 守卫 | `*.guard.ts` | `auth.guard.ts` |
| 拦截器 | `*.interceptor.ts` | `logging.interceptor.ts` |
| 过滤器 | `*.filter.ts` | `http-exception.filter.ts` |
| 管道 | `*.pipe.ts` | `validation.pipe.ts` |
| 装饰器 | `*.decorator.ts` | `roles.decorator.ts` |
| DTO | `*.dto.ts` | `create-user.dto.ts` |
| 实体 | `*.entity.ts` | `user.entity.ts` |
| 接口 | `*.interface.ts` | `user.interface.ts` |
| 类型 | `*.type.ts` | `user.type.ts` |
| 常量 | `*.constants.ts` | `app.constants.ts` |
| 配置 | `*.config.ts` | `database.config.ts` |
| 测试 | `*.spec.ts` | `app.controller.spec.ts` |
| E2E测试 | `*.e2e-spec.ts` | `app.e2e-spec.ts` |

### 目录命名规范

- 使用 **kebab-case**（短横线分隔）
- 目录名应该简洁且具有描述性
- 避免使用缩写，除非是广泛认知的

**示例：**
```
src/
├── user-management/     # ✅ 好的命名
├── auth/               # ✅ 好的命名
├── system-monitor/     # ✅ 好的命名
├── usr-mgmt/          # ❌ 避免缩写
└── SystemMonitor/     # ❌ 避免 PascalCase
```

## 🔧 配置文件详解

### `nest-cli.json` - NestJS CLI 配置

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true,
    "webpack": false,
    "tsConfigPath": "tsconfig.build.json"
  },
  "generateOptions": {
    "spec": true,
    "flat": false
  }
}
```

**配置说明：**
- `sourceRoot`: 源代码根目录
- `deleteOutDir`: 构建前清空输出目录
- `generateOptions.spec`: 生成代码时是否创建测试文件
- `generateOptions.flat`: 是否在平级目录生成文件

### `tsconfig.json` - TypeScript 配置

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
    "noFallthroughCasesInSwitch": false,
    "paths": {
      "@/*": ["src/*"],
      "@utils/*": ["src/utils/*"]
    }
  }
}
```

**路径映射说明：**
- `@/*`: 映射到 `src/*`，方便导入
- `@utils/*`: 映射到 `src/utils/*`，简化工具函数导入

### `tsconfig.build.json` - 构建配置

```json
{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "test", "dist", "**/*spec.ts"]
}
```

## 🎨 代码组织最佳实践

### 1. 单一职责原则

每个文件应该只负责一个特定的功能：

```typescript
// ✅ 好的做法 - system-info.ts
export function getCpuInfo() { /* ... */ }
export function getMemInfo() { /* ... */ }
export function getDiskInfo() { /* ... */ }

// ❌ 避免的做法 - 在同一个文件中混合不同职责
export function getCpuInfo() { /* ... */ }
export function sendEmail() { /* ... */ }
export function validateUser() { /* ... */ }
```

### 2. 模块化设计

将相关功能组织到模块中：

```typescript
// monitoring.module.ts
@Module({
  controllers: [MonitoringController],
  providers: [MonitoringService],
  exports: [MonitoringService],
})
export class MonitoringModule {}
```

### 3. 依赖注入

使用 NestJS 的依赖注入系统：

```typescript
@Injectable()
export class MonitoringService {
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: Logger,
  ) {}
}
```

### 4. 接口定义

为复杂的数据结构定义接口：

```typescript
// interfaces/system-info.interface.ts
export interface CpuInfo {
  cpuNum: number;
  sys: string;
  used: string;
  free: string;
}

export interface MemInfo {
  total: string;
  used: string;
  free: string;
  usage: string;
}
```

## 📊 项目扩展结构

随着项目的发展，您可能需要以下扩展结构：

```
src/
├── common/                    # 公共模块
│   ├── decorators/           # 自定义装饰器
│   ├── filters/              # 异常过滤器
│   ├── guards/               # 守卫
│   ├── interceptors/         # 拦截器
│   ├── pipes/                # 管道
│   └── middleware/           # 中间件
├── config/                   # 配置文件
│   ├── database.config.ts    # 数据库配置
│   ├── app.config.ts         # 应用配置
│   └── validation.config.ts  # 验证配置
├── modules/                  # 功能模块
│   ├── monitoring/           # 监控模块
│   ├── auth/                 # 认证模块
│   └── users/                # 用户模块
├── shared/                   # 共享资源
│   ├── constants/            # 常量
│   ├── enums/                # 枚举
│   ├── interfaces/           # 接口
│   └── types/                # 类型定义
└── utils/                    # 工具函数
    ├── helpers/              # 辅助函数
    ├── validators/           # 验证器
    └── transformers/         # 数据转换器
```

## 🎉 小结

在这一章中，我们学习了：

1. **项目结构**：标准的 NestJS 项目目录组织
2. **文件命名**：遵循官方命名规范
3. **配置文件**：各种配置文件的作用和设置
4. **最佳实践**：代码组织的原则和方法
5. **扩展结构**：项目成长时的目录规划

## 🔗 下一步

现在您已经了解了项目结构，接下来我们将开始实现核心功能。让我们从 [CPU 监控](./04-cpu-monitoring.md) 开始，学习如何获取和处理 CPU 使用率信息。

## 💡 常见问题

### Q: 为什么要使用这样的目录结构？

A: 这种结构有以下优势：
- **清晰的职责分离**：每个目录都有明确的用途
- **易于维护**：相关文件组织在一起
- **便于扩展**：新功能可以轻松添加
- **团队协作**：标准化的结构便于团队成员理解

### Q: 可以自定义目录结构吗？

A: 可以，但建议遵循 NestJS 的约定，这样可以：
- 利用 CLI 工具的自动生成功能
- 便于其他开发者理解项目
- 获得更好的工具支持

### Q: 如何处理大型项目的结构？

A: 对于大型项目，建议：
- 使用功能模块划分
- 采用微服务架构
- 实施代码分层
- 使用共享库

### Q: 测试文件应该放在哪里？

A: NestJS 推荐两种方式：
- **单元测试**：与源文件同目录，使用 `.spec.ts` 后缀
- **E2E 测试**：放在 `test/` 目录下，使用 `.e2e-spec.ts` 后缀
