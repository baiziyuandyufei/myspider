import scrapy
from horror.items import HorrorItem

class TianyaSpider(scrapy.Spider):
    name = "tianya"
    allowed_domains = ["tianya.im"]
    start_urls = ["https://tianya.im/?cid=4"]

    def parse(self, response):
        # Extract links to detail pages
        for href in response.xpath('//a[@title="在新窗口中打开帖子"]/@href').extract():
            href = response.urljoin(href)
            yield response.follow(href, self.parse_detail)
        
        # Extract the link to the next page
        next_page = response.xpath('//a[contains(text(), "下一页")]/@href').get()
        if next_page:
            next_page = response.urljoin(next_page)
            yield response.follow(next_page, self.parse)

    def parse_detail(self, response):
        item = HorrorItem()
        item['title'] = ""
        item['url'] = response.url
        item['content'] = ''.join(response.xpath('//p[@class="topic-message"]//text()').extract()).strip()
        yield item
