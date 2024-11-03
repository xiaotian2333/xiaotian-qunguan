import YAML from 'yaml'
import fs from 'fs'
import { pluginCfg } from './path.js'
class Config {
    getConfig() {
        try {
            const config = YAML.parse(
                fs.readFileSync(`${pluginCfg}/config.yaml`, 'utf-8')
            )
            return config
        } catch (err) {
            logger.error('读取配置文件失败', err)
            return false
        }
    }

    getDefConfig() {
        try {
            const config_default = YAML.parse(
                fs.readFileSync(`${pluginCfg}/Default/config.yaml`, 'utf-8')
            )
            return config_default
        } catch (err) {
            logger.error('读取默认配置文件失败失败', err)
            return false
        }
    }

    setConfig(config_data) {
        try {
            fs.writeFileSync(
                `${pluginCfg}/config.yaml`,
                YAML.stringify(config_data)
            )
            return true
        } catch (err) {
            logger.error('写入配置文件失败', err)
            return false
        }
    }
}

export default new Config()