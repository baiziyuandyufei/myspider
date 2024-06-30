const axios = require('axios');

async function sendMessageToService(message) {
    const serviceUrl = 'http://localhost:8000/job/invoke'; // 替换成实际的服务地址
    try {
        const response = await axios.post(serviceUrl, {"input":{"question":message},"config":{}});

        if (response.status !== 200) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const responseData = response.data;
        const resultString = responseData.output; // 提取 result 字段的字符串值
        // console.log(`调用服务成功，返回结果:`, resultString);
        return resultString; // 返回 result 字段的字符串值
    } catch (error) {
        console.error('发送消息到服务时出错:', error);
        return null; // 发生错误时返回 null 或适当的错误处理
    }
}

(async () => {
    const result = await sendMessageToService("你好。介绍一下自己吧！test_job_assistant");
    console.log(result);
})();
