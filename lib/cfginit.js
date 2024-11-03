import Config from "./cfg.js"
import fs from 'fs'
import { pluginCfg } from './path.js'

class Init {
    constructor() {
        this.initConfig()
    }
    initConfig() {
        const config_default_path = `${pluginCfg}/Default/config.yaml`
        if (!fs.existsSync(config_default_path)) {
            logger.error('默认配置文件不存在，请检查或重新安装插件')
            return false
        }
        const config_path = `${pluginCfg}/config.yaml`
        if (!fs.existsSync(config_path)) {
            logger.warn('配置文件不存在，将使用默认配置文件')
            fs.copyFileSync(config_default_path, config_path)
        }
        const config_default_yaml = Config.getDefConfig()
        const config_yaml = Config.getConfig()
        for (const key in config_default_yaml) {
            if (!(key in config_yaml)) {
                config_yaml[key] = config_default_yaml[key]
            }
        }
        for (const key in config_yaml) {
            if (!(key in config_default_yaml)) {
                delete config_yaml[key]
            }
        }
        Config.setConfig(config_yaml)
    }
}
export default new Init()