import scrapy
from gushufang.items import GushufangDayuItem


class DayuSpider(scrapy.Spider):
    name = "dayu"
    allowed_domains = ["www.gushufang.com"]
    start_urls = ["http://www.gushufang.com/ertong/dayushenmijingqixilie/"]

    def parse(self, response):
        node_li = response.xpath('//div[@class="mulu"]//li/a')
        for node in node_li:
            url = node.xpath('./@href').get()
            title = node.xpath('.//text()').get()
            if url:
                yield response.follow(url, self.parse_content, meta={'title': title})

    def parse_content(self, response):
        title = response.meta['title']
        content = response.xpath('//div[@id="content"]//text()').getall()
        content = ''.join(content).strip()
        if title and content:
            item = GushufangDayuItem()
            item['title'] = title
            item['url'] = response.url
            item['content'] = content
            yield item

