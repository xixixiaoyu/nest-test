# Nacos Node.js 服务注册示例

这个项目演示了如何使用 Node.js 客户端向 Nacos 注册服务实例。

## 问题解决

原始错误：`Code: 401, Message: User not found!` 表明 Nacos 服务器启用了认证，但客户端没有提供正确的用户名和密码。

## 解决方案

### 1. 快速修复

最简单的解决方案是在原始的 `register.js` 中添加认证信息：

```javascript
const client = new Nacos.NacosNamingClient({
  serverList: '127.0.0.1:8848',
  namespace: 'public',
  username: 'nacos',  // 添加用户名
  password: 'nacos',  // 添加密码
  logger: console,
})
```

### 2. 环境变量配置（推荐）

1. 复制环境变量模板：
   ```bash
   cp .env.example .env
   ```

2. 编辑 `.env` 文件，设置正确的配置：
   ```env
   NACOS_SERVER=127.0.0.1:8848
   NACOS_USERNAME=nacos
   NACOS_PASSWORD=nacos
   NACOS_NAMESPACE=public
   ```

## 可用脚本

### 连接测试
```bash
npm run test:connection
```
测试与 Nacos 服务器的连接，验证认证信息是否正确。

### 基础注册
```bash
npm run register
```
运行修复后的基础注册脚本。

### 增强注册
```bash
npm run register:enhanced
```
运行功能完整的增强版注册脚本，包含：
- 环境变量支持
- 详细的错误诊断
- 健康检查
- 优雅关闭

## 故障排除

### 1. 认证问题 (401/403 错误)

**症状：** `Code: 401, Message: User not found!`

**解决方案：**
- 确认 Nacos 默认用户名/密码（通常是 `nacos/nacos`）
- 检查 Nacos 服务器是否启用了认证
- 在浏览器中访问 `http://127.0.0.1:8848/nacos` 验证登录

### 2. 连接问题 (ECONNREFUSED)

**症状：** `Error: connect ECONNREFUSED`

**解决方案：**
- 确认 Nacos 服务器正在运行
- 检查服务器地址和端口是否正确
- 验证网络连接和防火墙设置

### 3. 版本兼容性

**症状：** API 调用失败或意外错误

**解决方案：**
- 确认 Nacos 服务器版本与客户端版本兼容
- 查看 Nacos 服务器日志获取详细错误信息

## 配置选项

### 环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `NACOS_SERVER` | `127.0.0.1:8848` | Nacos 服务器地址 |
| `NACOS_USERNAME` | `nacos` | 用户名 |
| `NACOS_PASSWORD` | `nacos` | 密码 |
| `NACOS_NAMESPACE` | `public` | 命名空间 |
| `SERVICE_NAME` | `order-service` | 服务名称 |
| `INSTANCE1_IP` | `192.168.1.10` | 实例1 IP |
| `INSTANCE1_PORT` | `8080` | 实例1 端口 |
| `INSTANCE2_IP` | `192.168.1.11` | 实例2 IP |
| `INSTANCE2_PORT` | `8081` | 实例2 端口 |

## 最佳实践

1. **使用环境变量** 管理配置，避免硬编码敏感信息
2. **实现优雅关闭** 确保服务实例在程序退出时正确注销
3. **添加健康检查** 监控服务实例状态
4. **错误处理** 提供详细的错误诊断信息
5. **日志记录** 记录关键操作和状态变化

## 生产环境注意事项

1. 使用强密码和安全的认证机制
2. 配置适当的网络安全策略
3. 监控服务注册状态和健康状况
4. 定期备份 Nacos 配置数据
5. 设置合适的日志级别和轮转策略
