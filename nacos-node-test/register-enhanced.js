// register-enhanced.js - 增强版服务注册脚本
import Nacos from 'nacos'
import { readFileSync } from 'fs'
import { join } from 'path'

// 尝试加载 .env 文件（如果存在）
try {
  const envPath = join(process.cwd(), '.env')
  const envContent = readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=')
    if (key && value && !process.env[key]) {
      process.env[key] = value.trim()
    }
  })
  console.log('📄 已加载 .env 配置文件')
} catch (error) {
  console.log('ℹ️  未找到 .env 文件，使用默认配置')
}

// 配置参数
const config = {
  server: process.env.NACOS_SERVER || '127.0.0.1:8848',
  username: process.env.NACOS_USERNAME || 'nacos',
  password: process.env.NACOS_PASSWORD || 'nacos',
  namespace: process.env.NACOS_NAMESPACE || 'public',
  serviceName: process.env.SERVICE_NAME || 'order-service',
  instances: [
    {
      ip: process.env.INSTANCE1_IP || '192.168.1.10',
      port: parseInt(process.env.INSTANCE1_PORT || '8080'),
      weight: parseFloat(process.env.INSTANCE1_WEIGHT || '1.0'),
      metadata: {
        version: process.env.INSTANCE1_VERSION || '1.0.0',
        env: process.env.NODE_ENV || 'development'
      }
    },
    {
      ip: process.env.INSTANCE2_IP || '192.168.1.11',
      port: parseInt(process.env.INSTANCE2_PORT || '8081'),
      weight: parseFloat(process.env.INSTANCE2_WEIGHT || '1.0'),
      metadata: {
        version: process.env.INSTANCE2_VERSION || '1.0.0',
        env: process.env.NODE_ENV || 'development'
      }
    }
  ]
}

// 创建 Nacos 客户端
const client = new Nacos.NacosNamingClient({
  serverList: config.server,
  namespace: config.namespace,
  username: config.username,
  password: config.password,
  logger: console,
})

// 优雅关闭处理
let isShuttingDown = false
const registeredInstances = []

async function gracefulShutdown() {
  if (isShuttingDown) return
  isShuttingDown = true
  
  console.log('\n🛑 正在优雅关闭...')
  
  // 注销所有已注册的实例
  for (const instance of registeredInstances) {
    try {
      await client.deregisterInstance(config.serviceName, instance)
      console.log(`✅ 实例 ${instance.ip}:${instance.port} 注销成功`)
    } catch (error) {
      console.error(`❌ 实例 ${instance.ip}:${instance.port} 注销失败:`, error.message)
    }
  }
  
  console.log('👋 程序已退出')
  process.exit(0)
}

// 注册信号处理器
process.on('SIGINT', gracefulShutdown)
process.on('SIGTERM', gracefulShutdown)

// 主注册函数
async function registerServices() {
  try {
    console.log('🚀 启动服务注册程序')
    console.log('=' .repeat(50))
    console.log('📋 配置信息:')
    console.log(`   服务器: ${config.server}`)
    console.log(`   命名空间: ${config.namespace}`)
    console.log(`   用户名: ${config.username}`)
    console.log(`   服务名: ${config.serviceName}`)
    console.log(`   实例数量: ${config.instances.length}`)
    console.log('')

    // 连接 Nacos
    console.log('🔗 正在连接 Nacos 服务器...')
    await client.ready()
    console.log('✅ Nacos 客户端连接成功！')

    // 注册所有实例
    console.log('\n📝 开始注册服务实例...')
    for (let i = 0; i < config.instances.length; i++) {
      const instance = config.instances[i]
      try {
        await client.registerInstance(config.serviceName, instance)
        registeredInstances.push(instance)
        console.log(`✅ 实例 ${i + 1} 注册成功: ${instance.ip}:${instance.port} (权重: ${instance.weight})`)
      } catch (error) {
        console.error(`❌ 实例 ${i + 1} 注册失败: ${instance.ip}:${instance.port}`, error.message)
        throw error
      }
    }

    console.log('\n🎉 所有服务实例注册成功！')

    // 验证注册结果
    console.log('\n🔍 验证注册结果...')
    const allInstances = await client.getAllInstances(config.serviceName)
    console.log(`📊 服务 "${config.serviceName}" 当前有 ${allInstances.length} 个实例:`)
    
    allInstances.forEach((inst, index) => {
      const status = inst.healthy ? '🟢' : '🔴'
      console.log(`   ${index + 1}. ${status} ${inst.ip}:${inst.port} (权重: ${inst.weight})`)
    })

    // 健康检查循环
    console.log('\n💓 开始健康检查循环...')
    setInterval(async () => {
      try {
        const instances = await client.getAllInstances(config.serviceName)
        const healthyCount = instances.filter(inst => inst.healthy).length
        console.log(`💓 健康检查: ${healthyCount}/${instances.length} 个实例健康`)
      } catch (error) {
        console.error('❌ 健康检查失败:', error.message)
      }
    }, 30000) // 每30秒检查一次

    console.log('\n✨ 服务注册完成，程序将保持运行...')
    console.log('💡 按 Ctrl+C 优雅退出')

  } catch (error) {
    console.error('\n❌ 服务注册失败:', error.message)
    
    // 详细错误诊断
    if (error.status === 403 || error.message.includes('401')) {
      console.error('\n🔐 认证失败诊断:')
      console.error('   1. 检查用户名和密码是否正确')
      console.error('   2. 确认 Nacos 服务器认证配置')
      console.error('   3. 尝试在浏览器中登录 Nacos 控制台')
      console.error(`   4. 控制台地址: http://${config.server.split(':')[0]}:${config.server.split(':')[1]}/nacos`)
    } else if (error.message.includes('ECONNREFUSED')) {
      console.error('\n🌐 连接失败诊断:')
      console.error('   1. 确认 Nacos 服务器正在运行')
      console.error('   2. 检查服务器地址和端口')
      console.error('   3. 验证网络连接')
      console.error('   4. 检查防火墙设置')
    }
    
    await gracefulShutdown()
  }
}

// 启动程序
registerServices().catch(console.error)
