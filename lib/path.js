import path from 'path'

// 云崽根目录
const YZpath = process.cwd().replace(/\\/g, '/')
// 插件名
const pluginName = path.basename(path.join(import.meta.url, '../../'))
// 插件根目录
const pluginRoot = path.join(YZpath, 'plugins', pluginName)
// 插件配置文件目录
const pluginCfg = path.join(pluginRoot, 'config').replace(/\\/g, '/')
// 插件数据目录
const pluginData = path.join(pluginRoot, 'data').replace(/\\/g, '/')

export { YZpath, pluginName, pluginRoot, pluginCfg, pluginData }