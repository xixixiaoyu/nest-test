// test-connection.js - Nacos 连接测试工具
import Nacos from 'nacos'

// 从环境变量获取配置
const NACOS_SERVER = process.env.NACOS_SERVER || '127.0.0.1:8848'
const NACOS_USERNAME = process.env.NACOS_USERNAME || 'nacos'
const NACOS_PASSWORD = process.env.NACOS_PASSWORD || 'nacos'
const NACOS_NAMESPACE = process.env.NACOS_NAMESPACE || 'public'

console.log('🔍 Nacos 连接测试工具')
console.log('=' .repeat(50))

async function testConnection() {
  console.log('📋 当前配置:')
  console.log(`   服务器地址: ${NACOS_SERVER}`)
  console.log(`   命名空间: ${NACOS_NAMESPACE}`)
  console.log(`   用户名: ${NACOS_USERNAME}`)
  console.log(`   密码: ${NACOS_PASSWORD.replace(/./g, '*')}`)
  console.log('')

  // 测试 1: 基本连接测试
  console.log('🧪 测试 1: 基本连接测试')
  try {
    const client = new Nacos.NacosNamingClient({
      serverList: NACOS_SERVER,
      namespace: NACOS_NAMESPACE,
      username: NACOS_USERNAME,
      password: NACOS_PASSWORD,
      logger: console,
    })

    await client.ready()
    console.log('✅ 连接成功！')
    
    // 测试 2: 获取服务列表
    console.log('\n🧪 测试 2: 获取服务列表')
    try {
      const services = await client.getServiceList()
      console.log(`✅ 获取服务列表成功，共 ${services.count} 个服务`)
      if (services.doms && services.doms.length > 0) {
        console.log('   现有服务:', services.doms.slice(0, 5).join(', '))
        if (services.doms.length > 5) {
          console.log(`   ... 还有 ${services.doms.length - 5} 个服务`)
        }
      }
    } catch (error) {
      console.log('⚠️  获取服务列表失败:', error.message)
    }

    // 测试 3: 注册测试服务
    console.log('\n🧪 测试 3: 注册测试服务')
    const testServiceName = 'test-connection-service'
    const testInstance = { 
      ip: '127.0.0.1', 
      port: 9999,
      metadata: { test: 'true', timestamp: Date.now().toString() }
    }

    try {
      await client.registerInstance(testServiceName, testInstance)
      console.log('✅ 测试服务注册成功')

      // 验证注册结果
      const instances = await client.getAllInstances(testServiceName)
      console.log(`✅ 验证成功，找到 ${instances.length} 个实例`)

      // 清理测试服务
      await client.deregisterInstance(testServiceName, testInstance)
      console.log('✅ 测试服务清理完成')
    } catch (error) {
      console.log('❌ 测试服务注册失败:', error.message)
    }

    console.log('\n🎉 所有测试完成！')
    
  } catch (error) {
    console.error('\n❌ 连接测试失败:', error.message)
    
    // 提供诊断建议
    console.log('\n🔧 故障排除建议:')
    
    if (error.status === 403 || error.message.includes('401')) {
      console.log('1. 认证问题:')
      console.log('   - 检查用户名和密码是否正确')
      console.log('   - 默认用户名/密码通常是 nacos/nacos')
      console.log('   - 确认 Nacos 服务器是否启用了认证')
    }
    
    if (error.message.includes('ECONNREFUSED') || error.message.includes('connect')) {
      console.log('2. 连接问题:')
      console.log('   - 检查 Nacos 服务器是否正在运行')
      console.log('   - 验证服务器地址和端口是否正确')
      console.log('   - 尝试在浏览器中访问: http://127.0.0.1:8848/nacos')
    }
    
    console.log('3. 通用检查:')
    console.log('   - 确认网络连接正常')
    console.log('   - 检查防火墙设置')
    console.log('   - 查看 Nacos 服务器日志')
    
    process.exit(1)
  }
}

// 运行测试
testConnection().catch(console.error)
