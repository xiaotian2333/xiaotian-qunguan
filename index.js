import fs from 'node:fs'
import { pluginRoot } from './lib/path.js'
import cfginit from "./lib/cfginit.js"
logger.info(`---------=.=---------`)
logger.info(`群管插件载入中`)

// 初始化配置文件
cfginit.initConfig()

let ret = []

const files = fs
  .readdirSync(`${pluginRoot}/apps`)
  .filter((file) => file.endsWith('.js'))

files.forEach((file) => {
  ret.push(import(`./apps/${file}`))
})

ret = await Promise.allSettled(ret)

let apps = {}
for (let i in files) {
  let name = files[i].replace('.js', '')

  if (ret[i].status != 'fulfilled') {
    logger.error(`载入插件错误：${logger.red(name)}`)
    logger.error(ret[i].reason)
    continue
  }
  apps[name] = ret[i].value[Object.keys(ret[i].value)[0]]
}

logger.info(`群管插件载入成功^_^`)
logger.info(`作者-xiaotian2333`)
logger.info(`---------------------`)
export { apps }