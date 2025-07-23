// register.js
import Nacos from 'nacos'

// 从环境变量获取配置，提供默认值
const NACOS_SERVER = process.env.NACOS_SERVER || '127.0.0.1:8848'
const NACOS_USERNAME = process.env.NACOS_USERNAME || 'nacos'
const NACOS_PASSWORD = process.env.NACOS_PASSWORD || 'nacos'
const NACOS_NAMESPACE = process.env.NACOS_NAMESPACE || 'public'

// 创建 Nacos 客户端（添加认证信息）
const client = new Nacos.NacosNamingClient({
  serverList: NACOS_SERVER,
  namespace: NACOS_NAMESPACE,
  username: NACOS_USERNAME,
  password: NACOS_PASSWORD,
  logger: console,
})

// 主函数：处理服务注册逻辑
async function registerServices() {
  try {
    console.log('正在连接 Nacos 服务器...')
    console.log(`服务器地址: ${NACOS_SERVER}`)
    console.log(`命名空间: ${NACOS_NAMESPACE}`)
    console.log(`用户名: ${NACOS_USERNAME}`)

    // 等待客户端准备就绪
    await client.ready()
    console.log('✅ Nacos 客户端连接成功！')

    // 定义服务名称和实例信息
    const serviceName = 'order-service'
    const instance1 = { ip: '192.168.1.10', port: 8080 }
    const instance2 = { ip: '192.168.1.11', port: 8081 }

    // 注册服务实例
    console.log('正在注册服务实例...')
    await client.registerInstance(serviceName, instance1)
    console.log(`✅ 实例 1 注册成功: ${instance1.ip}:${instance1.port}`)

    await client.registerInstance(serviceName, instance2)
    console.log(`✅ 实例 2 注册成功: ${instance2.ip}:${instance2.port}`)

    console.log('🎉 所有服务实例注册成功！')

    // 查询已注册的实例（验证注册结果）
    const instances = await client.getAllInstances(serviceName)
    console.log(
      '📋 当前已注册的实例:',
      instances.map((inst) => `${inst.ip}:${inst.port}`)
    )
  } catch (error) {
    console.error('❌ 服务注册失败:', error.message)

    // 提供详细的错误诊断信息
    if (error.status === 403 || error.message.includes('401')) {
      console.error('🔐 认证失败，请检查：')
      console.error('   1. Nacos 服务器是否启用了认证')
      console.error('   2. 用户名和密码是否正确')
      console.error('   3. 当前配置:')
      console.error(`      - 服务器: ${NACOS_SERVER}`)
      console.error(`      - 用户名: ${NACOS_USERNAME}`)
      console.error(`      - 密码: ${NACOS_PASSWORD.replace(/./g, '*')}`)
    } else if (error.message.includes('ECONNREFUSED')) {
      console.error('🌐 连接失败，请检查：')
      console.error('   1. Nacos 服务器是否正在运行')
      console.error('   2. 服务器地址是否正确')
      console.error(`   3. 当前地址: ${NACOS_SERVER}`)
    }

    process.exit(1)
  }
}

// 执行注册
registerServices()

// 防止程序立即退出，保持服务注册状态
setTimeout(() => {
  console.log('程序结束')
  process.exit(0)
}, 60000)
