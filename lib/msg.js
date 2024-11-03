/** 统一主动信息发送
 * 成功true，失败false
 * @param msg 要发送的信息
 * @param source (group,private) 发到什么渠道
 * @param channel_id 渠道的标识ID
 */
function post_msg(msg, source, channel_id) {
    if (source == "group") {
        // 群
        Bot[Bot.uin].pickGroup(channel_id).sendMsg(msg)
        return true
    } else if (source == "private") {
        // 私聊
        Bot[Bot.uin].pickUser(channel_id).sendMsg(msg)
        return true
    } else {
        logger.error(`[小天群管][消息发送] 没有匹配的发送渠道，关键信息：source=${source},channel_id=${channel_id},msg=${msg}`)
        return false
    }
}

// 导出函数
export { post_msg }