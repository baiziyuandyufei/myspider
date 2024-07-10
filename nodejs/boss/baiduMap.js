const puppeteer = require('puppeteer');

let browser; // 声明全局变量存储浏览器实例

async function launchBrowser() {
    browser = await puppeteer.launch({
        headless: true, // 设置为 false 表示使用有头模式
        defaultViewport: null,
        args: ['--start-maximized']
    });
}

async function closeBrowser() {
    if (browser) {
        await browser.close();
    }
}

async function getLatLng(address) {
    try {
        const page = await browser.newPage();
        await page.goto('https://map.yanue.net/');

        // 输入地址
        await page.waitForSelector('#addr');
        await page.$eval('#addr', textarea => textarea.value = '');
        await page.type('#addr', address);

        // 点击转换为经纬度按钮
        await page.waitForSelector('#toLatLngBtn');
        await page.click('#toLatLngBtn');

        // 等待结果显示
        await page.waitForSelector('#showResults');

        // 确保结果已加载
        await page.waitForFunction(() => {
            const result = document.querySelector('#showResults').innerText;
            return result && result.trim().length > 0 && result.includes(':');
        });

        // 获取解析结果
        const result = await page.evaluate(() => {
            return document.querySelector('#showResults').innerText;
        });

        // 解析经纬度结果
        const [_, lat, lng] = result.match(/(\d+\.\d+),(\d+\.\d+)/);
        if (!lat || !lng) {
            throw new Error('无法解析经纬度信息');
        }

        await page.close(); // 关闭页面

        return {
            lat: parseFloat(lat),
            lng: parseFloat(lng)
        };

    } catch (error) {
        console.error('获取经纬度失败：', error);
        return null;
    }
}

async function getLatLngAndDistance(address1, address2) {
    try {
        await launchBrowser(); // 打开浏览器

        // 获取第一个地址的经纬度
        const latLng1 = await getLatLng(address1);

        // 获取第二个地址的经纬度
        const latLng2 = await getLatLng(address2);

        // 计算两个经纬度之间的直线距离（这里简化为直线距离的计算）
        let distance = null;
        if (latLng1 && latLng2) {
            const radLat1 = (Math.PI / 180) * latLng1.lat;
            const radLat2 = (Math.PI / 180) * latLng2.lat;
            const deltaLat = radLat1 - radLat2;
            const deltaLng = (Math.PI / 180) * (latLng1.lng - latLng2.lng);
            const distanceInKm = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(deltaLat / 2), 2) + Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(deltaLng / 2), 2))) * 6371.01;
            distance = distanceInKm.toFixed(2); // 返回保留两位小数的结果
        } else {
            throw new Error('无法计算距离，获取经纬度失败。');
        }

        return {
            address1: latLng1,
            address2: latLng2,
            distance: distance
        };
    } catch (error) {
        console.error('计算距离时出错：', error);
        return null;
    } finally {
        await closeBrowser(); // 关闭浏览器
    }
}

// 示例使用
async function runExample() {
    const address_pairs = [
        ["广渠门", "西二旗"],
        ["广渠门", "上地"],
        ["广渠门", "国贸郎家园"]
    ];
    for (const row of address_pairs) {
        const address1 = row[0];
        const address2 = row[1];
        try {
          const result = await getLatLngAndDistance(address1, address2);
          if (result !== null) {
            console.log(`"${address1}" 和 "${address2}" 的经纬度及直线距离：`, result);
          } else {
            console.log('无法获取经纬度及计算距离。');
          }
        } catch (error) {
          console.error(`处理地址 "${address1}" 和 "${address2}" 时出错：`, error);
        }
    }
}

// 运行主程序
if (require.main === module) {
    runExample();
}

module.exports = {
    getLatLngAndDistance
};
