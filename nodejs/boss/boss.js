const puppeteer = require('puppeteer');
const axios = require('axios');

async function loginAndSendMessage() {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized']
    });
    const page = await browser.newPage();
    try {
        await navigateToMessages(page);
        await refreshAndSendMessage(page);
        setInterval(() => refreshAndSendMessage(page), 15 * 60 * 1000);
    } catch (error) {
        console.error(`[${new Date().toLocaleString()}] Error: ${error}`);
    }
}

async function navigateToMessages(page) {
    console.log(`[${new Date().toLocaleString()}] 打开登录页`);
    await page.goto('https://www.zhipin.com/web/user/?ka=header-login');
    await page.waitForSelector('div.nav > ul > li:nth-child(1) > a', { timeout: 300000 });
    await page.click('div.nav > ul > li:nth-child(1) > a');
    await page.waitForSelector('div.user-nav > ul > li:nth-child(1) > a', { timeout: 300000 });
    await page.click('div.user-nav > ul > li:nth-child(1) > a');
}

async function refreshAndSendMessage(page) {
    try {
        await page.reload({ waitUntil: 'networkidle2' });
        await checkAndClick(page);
        await page.waitForSelector('div.user-nav > ul > li:nth-child(1) > a', { timeout: 300000 });
        await page.click('div.user-nav > ul > li:nth-child(1) > a');
        await page.waitForSelector('div.user-list-content > ul:nth-child(2) > li');
        for (let i = 0; i < 40; i++) {
            const hrElements = await page.$$('div.user-list-content > ul:nth-child(2) > li');
            const hrElement = hrElements[i]; 
            await handleHRElement(page, hrElement);
        }
    } catch (error) {
        console.error(`[${new Date().toLocaleString()}] Error during refreshing and sending message: ${error}`);
    }
}

async function handleHRElement(page, hrElement) {
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
    try {
        await hrElement.click();
        await delay(1000);
        const { hrName, hrCompany, hrPost } = await getHRDetails(page);
        const sessionList = await getSessionList(page);
        const lastHRMessage = getLastHRMessage(sessionList);
        if (lastHRMessage !== '') {
            console.log(`[${new Date().toLocaleString()}] 收到 ${hrName}-${hrCompany}-${hrPost} 的最后一条消息内容:\n${lastHRMessage}`);
            const messageContent = await sendMessageToService(lastHRMessage);
            console.log(`[${new Date().toLocaleString()}]回复内容:\n${messageContent}`);
            await sendMessage(page, messageContent);
            console.log(`[${new Date().toLocaleString()}] 向 ${hrName}-${hrCompany}-${hrPost} 发送回复消息`);
        }
    } catch (clickError) {
        console.error(`[${new Date().toLocaleString()}] Error handling HR element: ${clickError}`);
    }
}

async function getHRDetails(page) {
    const hrName = await page.evaluate(() => {
        const pElement = document.querySelector('div.user-info > p');
        return pElement ? pElement.querySelector('.name').textContent.trim() : '';
    });
    const hrCompany = await page.evaluate(() => {
        const pElement = document.querySelector('div.user-info > p');
        return pElement ? pElement.querySelector(':nth-child(2)').textContent.trim() : '';
    });
    const hrPost = await page.evaluate(() => {
        const pElement = document.querySelector('div.user-info > p');
        return pElement ? pElement.querySelector('.base-title').textContent.trim() : '';
    });
    return { hrName, hrCompany, hrPost };
}

async function getSessionList(page) {
    await page.waitForSelector('div > ul.im-list > li');
    const liElements = await page.$$('div > ul.im-list > li');
    const sessionList = [];
    for (let li of liElements) {
        const liData = await page.evaluate(li => {
            return {
                textContent: li.textContent.trim(),
                class: li.className
            };
        }, li);
        sessionList.push(liData);
    }
    return sessionList;
}

function getLastHRMessage(sessionList) {
    let lastHRMessage = '';
    for (let i = sessionList.length - 1; i >= 0; i--) {
        const item = sessionList[i];
        if (item.class === 'item-myself') break;
        if (item.class === 'item-friend') lastHRMessage = lastHRMessage + '\n' + item.textContent;
    }
    return lastHRMessage.trim();
}

async function sendMessage(page, messageContent) {
    const inputElement = await page.$('div.chat-input');
    await inputElement.type(messageContent);
    const sendButton = await page.$('button.btn-send');
    await sendButton.click();
}

async function checkAndClick(page) {
    const selector = 'div.dialog-title > a > i';
    const element = await page.$(selector);
    if (element) {
        await element.click();
        console.log(`[${new Date().toLocaleString()}] i clicked`);
    }
}

async function sendMessageToService(message) {
    const serviceUrl = 'http://localhost:8000/job/invoke';
    try {
        const response = await axios.post(serviceUrl, { "input": { "question": message }, "config": {} });
        if (response.status !== 200) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.data.output;
    } catch (error) {
        console.error(`[${new Date().toLocaleString()}] 发送消息到服务时出错: ${error}`);
        return null;
    }
}

loginAndSendMessage();
