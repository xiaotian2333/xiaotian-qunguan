// 插件作者 xiaotian2333
// 开源地址 https://github.com/xiaotian2333/special-ability
// 灵感来源为简幻欢群机器人，但代码均为原创

import cfg from "../lib/cfg.js"
import YZcfg from "../../../lib/config/config.js"
import { post_msg } from "../lib/msg.js"

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
    return true //返回这个可能会存在bug，但是先留着
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
    e.reply('举报成功，请等待管理组审核', true)

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
}