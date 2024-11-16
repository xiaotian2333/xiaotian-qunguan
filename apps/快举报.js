// 插件作者 xiaotian2333
// 开源地址 https://github.com/xiaotian2333/special-ability
// 灵感来源为简幻欢群机器人，但代码均为原创

import cfg from "../lib/cfg.js"
import YZcfg from "../../../lib/config/config.js"
import { post_msg } from "../lib/msg.js"
import fs from "node:fs"
import path from "node:path"
import { pluginData } from "../lib/path.js"
import { formatTimestamp } from "../lib/time.js"

// 定义日志文件路径
const kjb_log_path = path.join(pluginData, '快举报', 'log.json')

/** json解析函数
 * @param json_path json文件的路径
 * 返回已解析的json对象
 * 当访问的路径不存在时将自动创建并返回空json对象
 */
function getjson(json_path) {
  // 尝试访问文件，如果文件不存在则捕获错误
  try {
    fs.accessSync(json_path, fs.constants.F_OK) // F_OK 检查文件是否存在
  } catch (err) {
    // 如果捕获到错误，表示文件不存在
    // 创建必要的目录
    const dirPath = path.dirname(json_path)
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true }) // 使用 { recursive: true } 确保所有父目录都被创建
    }
    // 创建文件并写入初始内容（例如空对象）
    fs.writeFileSync(json_path, JSON.stringify({}))
  }
  // 初始化json数组
  let json = {}
  // 尝试解析文件，避免文件格式不正确导致无法解析
  try {
    json = JSON.parse(fs.readFileSync(json_path, 'utf8'))
  } catch (err) {
    // 文件格式不正确，初始化一下
    fs.writeFileSync(json_path, JSON.stringify({}))
    // 然后再次读取
    json = JSON.parse(fs.readFileSync(json_path, 'utf8'))
  }
  return json
}

/** 举报记录函数
 * @param opstlist 要写入的东西
 * 返回格式一个累加整数，表示是第几条记录
 */
function log_file(opstlist) {
  let kjb_log = getjson(kjb_log_path)

  // 获取日志条目的数量
  const log_len = Object.keys(kjb_log).length
  // 由于是从0开始的，无需加1即可使用
  kjb_log[log_len] = opstlist

  // 将修改后的对象转换回 JSON 字符串
  const updatedJson = JSON.stringify(kjb_log, null, 2) // 使用 2 个空格进行缩进，使 JSON 更易读

  // 同步写回文件
  fs.writeFileSync(kjb_log_path, updatedJson, 'utf8')

  return log_len
}

// 举报理由列表
const ly = cfg.getConfig().kjb.ly

// 用户举报信息存放
let list = {}

export class report extends plugin {
  constructor() {
    super({
      name: '快举报',
      event: 'message',
      rule: [
        {
          reg: "^#?快举报$",
          fnc: 'trigger',
          //permission: 'master'
        },
        {
          reg: '^#?快举报(记录|日志|log)',
          fnc: 'kjblog'
        }
      ]
    })
  }

  // 用户触发快举报
  async trigger(e) {
    let msg = '===快举报===\n'
    for (let tmp of Object.keys(ly)) {
      msg = `${msg}[${tmp}] ${ly[tmp]}\n`
    }
    msg = `${msg}------------------\n*发送对应序号来选择`
    e.reply(msg, true)

    this.setContext('Select') // 监听用户信息，触发选择理由流程
    return true
  }

  // 用户选择举报类型
  async Select(e) {
    e = this.e

    let num = parseInt(e.msg, 10)
    if (isNaN(num) || num > 8 || num < 0) {
      e.reply('请正确输入举报理由编号', true)
      return true
    }

    // 用户退出快举报
    if (e.msg == '0') {
      this.finish('Select') // 停止选择理由流程监听
      e.reply('快举报已退出', true)
      return true
    }

    // 初始化用户id空间
    list[e.user_id] = {}
    // 记录举报原因
    list[e.user_id]['Select'] = e.msg
    this.finish('Select') // 停止选择理由流程监听
    e.reply('请发送被举报人QQ，直接发送QQ号，可发送多个但请用空格断开', true)
    this.setContext('violator') // 开始举报者监听
    return true
  }

  // 用户发送被举报者QQ号
  async violator(e) {
    e = this.e

    // 记录被举报者
    list[e.user_id]['violator'] = e.msg
    this.finish('violator') // 停止举报者监听
    e.reply('现在开始证据提交流程，请发送相应的聊天记录截图，支持发送多张图片\n\n发送完成后发送 #结束证据提交', true)

    // 初始化图片记录数组
    list[e.user_id]['img_list'] = []
    // 初始化结束标记
    list[e.user_id]['stop'] = false

    this.setContext('Evidence') // 开始证据收集监听
    return true
  }

  // 用户发送被举报者违规行为
  async Evidence(e) {
    e = this.e

    // 用户结束证据提交
    if (e?.msg) {

      if (!/^#?结束证据提交$/.test(e.msg)) {
        // 如果用户发送的文本信息不符合则提示
        e.reply('请继续发送图片或结束提交\n\n所有证据发送完成后发送 #结束证据提交')
        return true
      } else {
        // 发了结束提交，更改标记符
        list[e.user_id]['stop'] = true
      }
      // 如果结束信息则继续执行下列代码
    }

    // 判断用户发的信息里有没有图片
    if (e?.img) {
      // 有图片，记录
      e.img.forEach(img => {
        list[e.user_id].img_list.push(img)
      })

      // 用户还没有结束
      if (!list[e.user_id]['stop']) {
        e.reply('图片已记录，请继续发送图片或结束提交\n\n所有证据发送完成后发送 #结束证据提交')
        return true
      }
    }

    // 用户一张图片都没发
    if (list[e.user_id].img_list.length === 0) {
      e.reply('没有提交证据，请发送相应的聊天记录截图')
      return true
    }

    this.finish('Evidence') // 停止证据收集监听

    // 取默认通知人
    let Default_user = YZcfg.masterQQ
    if (cfg.getConfig().kjb.Default != 'master') {
      Default_user = cfg.getConfig().kjb.Default
    }

    // 构建举报信息
    let msg = ['===快举报信息===\n']
    // 私聊举报
    if (e.message_type == 'private') {
      msg.push(
        `举报人：${e.user_id}(私聊举报)\n`
      )
    }
    // 群聊举报
    else {
      msg.push(
        `来源群号：${e.group_id}\n`,
        `举报人：${e.user_id}\n`
      )
    }
    // 追加通用信息
    msg.push(
      `举报理由：${ly[list[e.user_id]['Select']]}\n`,
      `被举报者：${list[e.user_id]['violator']}\n`,
      `聊天记录：\n`
    )
    // 追加聊天记录
    list[e.user_id].img_list.forEach(img => {
      msg.push(
        segment.image(img)
      )
    })

    // 记录到日志文件
    const opstlist = {
      user_id: e.user_id,
      group_id: e.group_id, // 这个不一定会有，如果没有值则不会写入
      ly: `${ly[list[e.user_id]['Select']]}`,
      violator: `${list[e.user_id]['violator']}`,
      img: list[e.user_id].img_list,
      date: formatTimestamp(Date.now())
    }

    const log_len = log_file(opstlist)

    msg.push(
      `\n举报编号：${log_len}\n使用 #快举报记录${log_len} 即可查询举报信息`
    )

    e.reply(`举报成功，请等待管理组审核\n使用 #快举报记录${log_len} 即可查询举报信息`, true)

    // 发送到指定地点
    // 来源不是群，直接私发给默认通知人
    if (e.message_type == 'private') {
      post_msg(msg, 'private', Default_user)
      return true
    }
    // 来源是群
    // 能匹配到相应的发送规则
    if (cfg.getConfig().kjb.group[e.group_id]) {
      const msg_cfg = cfg.getConfig().kjb.group[e.group_id].split(':')
      post_msg(msg, msg_cfg[1], msg_cfg[0])
      return true
    }
    // 匹配不到发送规则，发给默认通知人
    post_msg(msg, 'private', Default_user)
    return true
  }

  async kjblog(e) {
    let sum = e.msg
    sum = sum.replace(/^#?快举报(记录|日志|log)/, '')

    let kjb_log = getjson(kjb_log_path)
    // 获取日志条目的数量
    const log_len = parseInt(Object.keys(kjb_log).length, 10)

    // 如果为空则返回
    if (!sum) {
      e.reply(`当前一共有${log_len}条举报记录，发送具体编号即可查看记录`)
      return true
    }
    // 校验编号是否符合格式
    let num = parseInt(sum, 10)
    if (isNaN(num) || num > log_len || num < 0) {
      e.reply('请正确输入编号', true)
      return true
    }

    // 简化一下调用
    const log = kjb_log[sum]

    // 构建举报信息
    let msg = [`==快举报编号${sum}的信息==\n`]

    // 判断举报来源
    if ('group_id' in log) {
      // 群聊举报
      msg.push(
        `来源群号：${log.group_id}\n`,
        `举报人：${log.user_id}\n`
      )
    } else {
      // 私聊举报
      msg.push(
        `举报人：${log.user_id}(私聊举报)\n`
      )
    }

    // 追加通用信息
    msg.push(
      `举报理由：${log.ly}\n`,
      `被举报者：${log.violator}\n`,
      `举报时间：${log.date}\n`,
      `聊天记录：\n`
    )
    // 追加聊天记录
    log.img.forEach(img => {
      msg.push(
        segment.image(img)
      )
    })
    e.reply(msg)
    return true
  }
}