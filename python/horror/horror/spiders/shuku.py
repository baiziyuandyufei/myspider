import scrapy
from horror.items import HorrorItem

class ShukuSpider(scrapy.Spider):
    name = "shuku"
    allowed_domains = ["www.52shuku.vip"]
    start_urls = ["https://www.52shuku.vip/kongbulingyi/"]

    def parse(self, response):
        # Extract links to detail pages
        for href in response.xpath('//h2/a/@href').extract():
            yield response.follow(href, self.parse_detail_page)

        # Extract the link to the next page
        next_page = response.xpath("//a[contains(text(), '下一页')]/@href").get()
        if next_page:
            yield response.follow(next_page, self.parse)

    def parse_detail_page(self, response):
        for href in response.xpath('//ul[@class="list clearfix"]/li/a/@href').extract():
            yield response.follow(href, self.parse_detail)
    
    def parse_detail(self, response):
        item = HorrorItem()
        item['title'] = response.xpath('//h1/text()').get()
        item['url'] = response.url
        item['content'] = ''.join(response.xpath('//article[@class="article-content"]//text()').extract()).strip()
        yield item
