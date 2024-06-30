import scrapy
from horror.items import HorrorItem

class WangyiSpider(scrapy.Spider):
    name = "wangyi"
    allowed_domains = ["www.163.com"]
    start_urls = ["https://www.163.com/search?keyword=%E7%81%B5%E5%BC%82%E6%95%85%E4%BA%8B"]

    def parse(self, response):
        # Extract links to detail pages
        for href in response.xpath('//h3/a[contains(@href, "article")]/@href').extract():
            yield response.follow(href, self.parse_detail)

    def parse_detail(self, response):
        item = HorrorItem()
        item['title'] = response.xpath('//h1/text()').get()
        item['url'] = response.url
        item['content'] = ''.join(response.xpath('//div[@class="post_body"]//text()').extract()).strip()
        yield item
