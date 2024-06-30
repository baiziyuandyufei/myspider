import scrapy
from horror.items import HorrorItem


class LingyizhiSpider(scrapy.Spider):
    name = "lingyizhi"
    allowed_domains = ["www.lingyizhi.com"]
    start_urls = ["https://www.lingyizhi.com/jingli"]

    def parse(self, response):
        # Extract links to detail pages
        for href in response.xpath('//div[@class="post-info"]/h2/a/@href').extract():
            yield response.follow(href, self.parse_detail)

        # Extract the link to the next page
        next_page = response.xpath('//div[@class="btn-pager"]/a[2]/@href').get()
        if next_page:
            yield response.follow(next_page, self.parse)

    def parse_detail(self, response):
        item = HorrorItem()
        item['title'] = response.xpath('//h1/text()').get()
        item['url'] = response.url
        item['content'] = ''.join(response.xpath('//div[@class="entry-content"]//text()').extract()).strip()
        yield item
