const puppeteer = require('puppeteer');

// 计算加权综合得分并归一化每项后加权求和
function calculateOverallScore(riskContent) {
    // 定义各项的最大值
    const maxValues = {
        '自身风险': 50,
        '关联风险': 50,
        '提示信息': 100
    };
    
    // 定义各项的权重
    const weights = {
        '自身风险': 0.5,
        '关联风险': 0.4,
        '提示信息': 0.1
    };
    
    // 归一化处理并加权求和
    let weightedSum = 0;
    let totalWeight = 0;

    for (let dimension in riskContent) {
        let score = Math.min(riskContent[dimension], maxValues[dimension]); // 最大值限定
        let maxValue = maxValues[dimension];
        
        if (dimension in weights && weights[dimension] > 0 && maxValue > 0) {
            // 归一化到 [0, 1] 范围内
            let normalizedScore = score / maxValue;
            
            weightedSum += normalizedScore * weights[dimension];
            totalWeight += weights[dimension];
        }
    }
    
    // 如果没有有效的权重或总权重为零，则返回默认值
    if (totalWeight === 0) {
        return 0;
    }
    
    return weightedSum;
}

// 获取公司信息
async function getCompanyInfo(companyName) {
    const browser = await puppeteer.launch({
        headless: true,
        defaultViewport: null,
        args: ['--start-maximized']
    });

    try {
        const page = await browser.newPage();
        await page.goto('https://aiqicha.baidu.com/');

        // 搜索并获取公司基本信息和风险内容
        const companyInfo = await searchAndRetrieveCompanyInfo(page, companyName);

        // 获取公司状态
        const companyStatus = await getCompanyStatus(page);

        // 如果公司状态为 "非开业"，直接设置风险值为 1
        if (companyStatus === "非开业") {
            companyInfo.riskContent = {
                '自身风险': 1,
                '关联风险': 1,
                '提示信息': 1
            };
        }

        // 计算综合得分
        const overallScore = calculateOverallScore(companyInfo.riskContent);
        
        // 将综合得分加入到返回的公司信息中
        companyInfo.overallScore = overallScore;

        return companyInfo;
        
    } catch (error) {
        console.error('出错了：', error);
        return null;
    } finally {
        await browser.close();
    }
}

// 搜索并提取公司信息
async function searchAndRetrieveCompanyInfo(page, input) {
    await page.waitForSelector('input', { timeout: 1000 });
    await page.type('input', input);
    await page.click('button.search-btn');

    const firstSearchResultSelector = 'div.company-list > div > a:nth-child(1)';
    await page.waitForSelector(firstSearchResultSelector, { timeout: 300000 });
    await page.click(firstSearchResultSelector);
    
    const companyName = await getCompanyName(page);
    const companyStatus = await getCompanyStatus(page);
    const riskContent = await getRiskContent(page);
    
    const companyInfo = {
        name: companyName,
        status: companyStatus,
        riskContent: riskContent
    };

    return companyInfo;
}

// 获取公司名称
async function getCompanyName(page) {
    const nameSelector = 'h1.name';
    await page.waitForSelector(nameSelector, { timeout: 300000 });
    return await page.$eval(nameSelector, element => element ? element.innerText : '未知');
}

// 获取公司状态
async function getCompanyStatus(page) {
    const statusSelector = 'div.tags-list > span:nth-child(1)';
    try {
        await page.waitForSelector(statusSelector, { timeout: 1000 });
        return await page.$eval(statusSelector, element => element.innerText);
    } catch (error) {
        return "非开业";
    }
}

// 获取风险内容
async function getRiskContent(page) {
    const riskSelector = 'div.content > a';
    return await page.$$eval(riskSelector, elements => {
        const riskDict = {};
        elements.forEach(element => {
            const text = element.innerText.trim();
            const match = text.match(/^(.*?)\s(\d+)$/);
            if (match) {
                const key = match[1];
                const value = parseInt(match[2], 10);
                riskDict[key] = value;
            }
        });
        return riskDict;
    });
}

// 执行测试函数
async function runTests() {
    const companies = [
        '北京乐开科技有限责任公司',
        '汉克时代',
        '迈动云智',
        '法本',
        '越跃科技',
        '海天瑞声'
    ];

    for (let company of companies) {
        console.log(`查询公司：${company}`);
        const companyInfo = await getCompanyInfo(company);
        console.log('企业详情：', companyInfo);
        console.log('-------------------------------------');
    }
}

// 执行测试
runTests();

module.exports = {
    getCompanyInfo
};
