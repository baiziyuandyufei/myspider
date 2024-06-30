import puppeteer from "puppeteer";

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await browser.close();
})();
