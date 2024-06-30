// 爬取https://map.yanue.net/获取地址坐标
const puppeteer = require('puppeteer');

(async () => {
    // 启动浏览器，有头模式，最大化窗口
    const browser = await puppeteer.launch({ 
        headless: false, 
        defaultViewport: null, // 使用系统默认窗口大小
        args: ['--start-maximized'] // 使用最大化选项
    });
    const page = await browser.newPage();
    
    // 访问指定页面
    await page.goto('https://map.yanue.net/');

    // 在#addr的textarea中填入地址名
    const address = '北京市朝阳区'; // 替换为你想要查询的地址
    await page.waitForSelector('#addr');
    await page.$eval('#addr', textarea => textarea.value = '');
    await page.type('#addr', address);

    // 点击#toLatLngBtn的button
    await page.waitForSelector('#toLatLngBtn');
    await page.click('#toLatLngBtn');

    // 等待#showResults的div出现并获取解析结果
    await page.waitForSelector('#showResults');
    
    // 确保结果已加载
    await page.waitForFunction(() => {
        const result = document.querySelector('#showResults').innerText;
        return result && result.trim().length > 0;
    });

    const result = await page.evaluate(() => {
        return document.querySelector('#showResults').innerText;
    });

    console.log('解析结果:', result);

    // 保持浏览器打开一段时间以便查看结果
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 关闭浏览器
    // await browser.close();
})();
