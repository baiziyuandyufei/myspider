const puppeteer = require('puppeteer');
const axios = require('axios');

async function loginAndSendMessage() {
    // 定义延迟函数
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

    // 启动浏览器，有头模式，最大化窗口
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null, // 使用系统默认窗口大小
        args: ['--start-maximized'] // 使用最大化选项
    });
    const page = await browser.newPage();
    try {
        console.log(`[${new Date().toLocaleString()}] 打开登录页`);
        await page.goto('https://www.zhipin.com/web/user/?ka=header-login');
        // console.log(`[${new Date().toLocaleString()}] 点击首页`);
        await page.waitForSelector('div.nav > ul > li:nth-child(1) > a', { timeout: 300000 });
        await page.click('div.nav > ul > li:nth-child(1) > a');
        // console.log(`[${new Date().toLocaleString()}] 点击信息页`);
        await page.waitForSelector('div.user-nav > ul > li:nth-child(1) > a', { timeout: 300000 });
        await page.click('div.user-nav > ul > li:nth-child(1) > a');

        // 定义要执行的函数
        const refreshAndSendMessage = async () => {
            try {
                // console.log(`[${new Date().toLocaleString()}] 刷新信息页`);
                await page.reload({ waitUntil: 'networkidle2' });
                // 检查对话框
                checkAndClick(page);
                // console.log(`[${new Date().toLocaleString()}] 点击信息页`);
                await page.waitForSelector('div.user-nav > ul > li:nth-child(1) > a', { timeout: 300000 });
                await page.click('div.user-nav > ul > li:nth-child(1) > a');

                await page.waitForSelector('div.user-list-content > ul:nth-child(2) > li');
                const hrElements = await page.$$('div.user-list-content > ul:nth-child(2) > li');
                const initialLength = hrElements.length;
                for (let i = 0; i < initialLength; i++) {
                    const hrElement = hrElements[i];
                    try {
                        await hrElement.click();
                    } catch (clickError) {
                        continue; // 出错时跳过当前元素，继续下一个
                    }
                    await delay(1000); // 等待1秒钟
                    // 读取 HR 姓名 公司名 职位
                    const hrName = await page.evaluate(() => {
                        const pElement = document.querySelector('div.user-info > p');
                        if (!pElement) {
                            return '';
                        }
                        return pElement.querySelector('.name').textContent.trim();
                    });
                    const hrCompany = await page.evaluate(() => {
                        const pElement = document.querySelector('div.user-info > p');
                        if (!pElement) {
                            return '';
                        }
                        return pElement.querySelector(':nth-child(2)').textContent.trim();
                    });
                    const hrPost = await page.evaluate(() => {
                        const pElement = document.querySelector('div.user-info > p');
                        if (!pElement) {
                            return '';
                        }
                        return pElement.querySelector('.base-title').textContent.trim();
                    });
                    // console.log(`[${new Date().toLocaleString()}] 获取 ${hrName}-${hrCompany}-${hrPost} 的全部聊天信息`)
                    // 获取所有聊天内容
                    await page.waitForSelector('div > ul.im-list > li');
                    // 获取所有的li元素
                    const liElements = await page.$$('div > ul.im-list > li');
                    // 创建一个数组来存储结果
                    const sessionList = [];
                    // 遍历每个li元素
                    for (let i = 0; i < liElements.length; i++) {
                        const li = liElements[i];
                        // 使用evaluate方法在页面上下文中获取文本内容和class属性
                        const liData = await page.evaluate(li => {
                            return {
                                textContent: li.textContent.trim(),  // 获取文本内容
                                class: li.className                  // 获取class属性值
                            };
                        }, li);
                        // 将获取的数据添加到数组中
                        sessionList.push(liData);
                    }
                    // console.log('与该hr所有会话内容:', sessionList);
                    // 从后向前遍历sessionList，根据条件处理
                    let lastHRMessage = '';
                    for (let i = sessionList.length - 1; i >= 0; i--) {
                        const item = sessionList[i];
                        if (item.class === 'item-myself') {
                            // 最后一条是我自己的消息，退出循环
                            break;
                        } else if (item.class === 'item-friend') {
                            // 最后一条是HR消息，将textContent赋值给最后一条HR消息变量
                            lastHRMessage = lastHRMessage + '\n' + item.textContent;
                        } else {
                            // 其他情况继续循环
                            continue;
                        }
                    }
                    // 判断lastHRMessage非空串时，执行发送消息的操作
                    lastHRMessage = lastHRMessage.trim();
                    if (lastHRMessage !== '') {
                        console.log(`[${new Date().toLocaleString()}] 收到 ${hrName}-${hrCompany}-${hrPost} 的最后一条消息内容:\n${lastHRMessage}`);
                        const messageContent = await sendMessageToService(lastHRMessage);
                        console.log(`[${new Date().toLocaleString()}]回复内容:\n${messageContent}`);
                        const inputElement = await page.$('div.chat-input');
                        await inputElement.type(messageContent);
                        const sendButton = await page.$('button.btn-send');
                        await sendButton.click();
                        console.log(`[${new Date().toLocaleString()}] 向 ${hrName}-${hrCompany}-${hrPost} 发送回复消息`);
                    }
                }
            } catch (error) {
                console.error(`[${new Date().toLocaleString()}] Error during refreshing and sending message: {error}`);
            }
        };
        // 立即执行一次函数
        await refreshAndSendMessage();
        // 设置定期执行
        setInterval(() => refreshAndSendMessage(), 15 * 60 * 1000); // 每15分钟执行一次
    } catch (error) {
        console.error(`[${new Date().toLocaleString()}] Error:, {error}`);
    }
}

async function checkAndClick(page) {
    const selector = 'div.dialog-title > a > i';
    const element = await page.$(selector);
    if (element) {
      await element.click();
      console.log(`[${new Date().toLocaleString()}] i clicked`);
    } else {
    //   console.log('Span not found, continuing...');
    }
  }

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
        console.error(`[${new Date().toLocaleString()}] 发送消息到服务时出错:', {error}`);
        return null; // 发生错误时返回 null 或适当的错误处理
    }
}

loginAndSendMessage();
