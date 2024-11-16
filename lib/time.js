/** 时间戳转可视化日期函数
 * @param timestamp 毫秒级时间戳
 * 返回格式参考：2023-10-05-14:30:45
 */
function formatTimestamp(timestamp = Date.now()) {
    const date = new Date(timestamp)
    
    // 获取年、月、日、小时、分钟和秒
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0') // 月份从0开始，需要加1，并确保是两位数
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    
    // 格式化日期字符串
    const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    
    return formattedDate
}

export { formatTimestamp }

// 使用示例
//const timestamp = Date.now() // 取当前时间戳
//const formattedTimestamp = formatTimestamp(timestamp) // 调用
//console.log(formattedTimestamp) // 输出类似 "2023-10-05-14:30:45" 的格式