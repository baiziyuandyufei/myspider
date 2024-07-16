const puppeteer = require('puppeteer');
const axios = require('axios');
const { initializeDatabase, 
        createTable, 
        checkCompanyInBlackList, 
        checkCompanyInGreetingTable,
        insertIntoGreetingTable,} = require('./dbHelper');
const { getLatLngAndDistance} = require('./baiduMap');


async function loginAndSendMessage() {
    await initializeDatabase();
    await createTable();
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized'],
    });
    const page = await browser.newPage();
    let send_cnt = 0;
    try {
        await login(page);
        const refreshInterval = 5 * 60 * 1000; // 5 minutes
        await refreshAndSendMessage(page);
        await greetAndCollectJobDetails(page);
        setInterval(async () => {
            await refreshAndSendMessage(page);
            send_cnt++;
            if (send_cnt % 6 === 0) {
                await greetAndCollectJobDetails(page);
                send_cnt = 0;
            }
        }, refreshInterval);

    } catch (error) {
        console.error(`[${new Date().toLocaleString()}] Error: ${error}`);
    }
}

async function login(page) {
    console.log(`[${new Date().toLocaleString()}] 打开登录页`);
    await page.goto('https://www.zhipin.com/web/user/?ka=header-login');
    await page.waitForSelector('div.nav > ul > li:nth-child(1) > a', { timeout: 300000 });
    await page.click('div.nav > ul > li:nth-child(1) > a');
    console.log(`[${new Date().toLocaleString()}] 登录成功`);
}

async function greetAndCollectJobDetails(page) {
    try {
        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
        await page.reload({ waitUntil: 'networkidle0' });
        await checkAndClick(page);
        await page.waitForSelector('div.nav > ul > li:nth-child(2)');
        await page.click('div.nav > ul > li:nth-child(2)');
        delay(3*1000);
        await page.goto('https://www.zhipin.com/web/geek/job-recommend?city=101010100&salary=406&jobType=1901')
        await page.waitForSelector('span.text-content');
        const textContentElements = await page.$$('span.text-content');
        for (const element of textContentElements) {
            await element.click();
            const recommendedJobName = await page.evaluate(el => el.textContent, element);
            for (let i = 0; i < 15; i++) {
                await page.waitForSelector('ul.rec-job-list > li');
                const jobListItems = await page.$$('ul.rec-job-list > li');
                const jobItem = jobListItems[i];
                await jobItem.click();
                await delay(1*1000);
                const bossNameElement = await jobItem.$('span.boss-name');
                const jobAddressElement = await page.$('p.job-address-desc');
                const jobNameElement = await page.$('span.job-name');
                const jobDescElement = await page.$('p.desc');
                const bossName = bossNameElement ? await page.evaluate(el => el.textContent, bossNameElement) : 'N/A';
                const jobAddress = jobAddressElement ? await page.evaluate(el => el.textContent, jobAddressElement) : 'N/A';
                const jobName = jobNameElement ? await page.evaluate(el => el.textContent, jobNameElement) : 'N/A';
                const jobDesc = jobDescElement ? await page.evaluate(el => {
                    const $el = $(el);
                    const clonedEl = $el.clone();
                    clonedEl.find('style').remove();
                    clonedEl.find('span.eMPxMPyFxMA').remove();
                    clonedEl.find('span.ZNrTrXbrMi').remove();
                    return clonedEl.text();
                }, jobDescElement) : 'N/A';
                // console.log(`[${new Date().toLocaleString()}] 读取了 ${bossName} 发布的 ${jobName} 职位信息`);
                const isCompanyBlacklisted = await checkCompanyInBlackList(bossName);
                const regexAddress = /^北京.*?(东城|西城|朝阳|丰台|石景山|门头沟)/i;
                const regexExcludeLocations = /(望京|西北旺|上地|清河|西二旗|来广营)/i;
                const regexJobName = /自然语言处理|nlp|大语言模型|大模型|爬虫|人工智能|AI|推荐|llm/i;
                if (!isCompanyBlacklisted && 
                    regexAddress.test(jobAddress) && 
                    !regexExcludeLocations.test(jobAddress) && 
                    regexJobName.test(jobName) &&
                    !(await checkCompanyInGreetingTable(jobName))) {
                    await page.waitForSelector('a.op-btn.op-btn-chat');
                    const buttonText = await page.$eval('a.op-btn.op-btn-chat', element => element.textContent.trim());
                    if (buttonText === '立即沟通') {
                        await page.click('a.op-btn.op-btn-chat');
                        await delay(1*1000);
                        const headerTextElement = await page.$('div.chat-block-header > h3');
                        const headerText = headerTextElement ? await page.evaluate(el => el.textContent, headerTextElement) : 'N/A';
                        if (headerText === "无法进行沟通") {
                            await page.click('a.default-btn.sure-btn');
                            console.log(`[${new Date().toLocaleString()}] 沟通次数达上限，无法申请 ${bossName}`);
                        } else {
                            await page.waitForSelector('div.greet-boss-footer > a:nth-child(1)');
                            await page.click('div.greet-boss-footer > a:nth-child(1)');
                            const risk = 0;
                            const dist = 0;
                            const currentDate = new Date().toISOString().split('T')[0];
                            await insertIntoGreetingTable(bossName, 
                                jobAddress, 
                                jobName, 
                                jobDesc, 
                                recommendedJobName, 
                                risk, 
                                dist, 
                                currentDate);
                            console.log(`[${new Date().toLocaleString()}] 申请了 ${bossName} 的 ${jobName} 职位`);
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error(`[${new Date().toLocaleString()}] Error during greeting and collecting job details: ${error}`);
    }
}

async function refreshAndSendMessage(page) {
    try {
        await page.reload({ waitUntil: 'networkidle0' });
        await checkAndClick(page);
        await page.waitForSelector('div.user-nav > ul > li:nth-child(1) > a');
        await page.click('div.user-nav > ul > li:nth-child(1) > a');
        await page.waitForSelector('div.user-list-content > ul:nth-child(2) > li');
        for (let i = 0; i < 10; i++) {
            const hrElements = await page.$$('div.user-list-content > ul:nth-child(2) > li');
            const hrElement = hrElements[i]; 
            await handleHRElement(page, hrElement);
        }
    } catch (error) {
        console.error(`[${new Date().toLocaleString()}] Error during refreshing and sending message: ${error}`);
    }
}

async function handleHRElement(page, hrElement) {
    try {
        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
        await hrElement.click();
        await delay(1000); // 等待1秒，可以根据需要调整
        const { hrName, hrCompany, hrPost } = await getHRDetails(page);
        const sessionList = await getSessionList(page);
        const lastHRMessage = getLastHRMessage(sessionList);
        const isCompanyBlacklisted = await checkCompanyInBlackList(hrCompany);
        const isInGreetingTable = await checkCompanyInGreetingTable(hrCompany);
        if (lastHRMessage !== '') {
            console.log(`[${new Date().toLocaleString()}] 收到 ${hrName}-${hrCompany}-${hrPost} 的最后一条消息内容`);
            let messageContent = "";
            if(!isCompanyBlacklisted && isInGreetingTable){
                messageContent = await sendMessageToService(lastHRMessage);
            }
            else{
                messageContent = "祝您找到其他合适人选！谢谢！";
            }
            // console.log(`[${new Date().toLocaleString()}]回复内容:${messageContent}`);
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
