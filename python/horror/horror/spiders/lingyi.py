import scrapy
from horror.items import HorrorItem

class LingyiSpider(scrapy.Spider):
    name = "lingyi"
    allowed_domains = ["www.lingyi.org"]
    start_urls = ["http://www.lingyi.org/topics/lingyijingli"]
    custom_settings = {
        'DEFAULT_REQUEST_HEADERS': {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Encoding': 'gzip, deflate',
            'Accept-Language': 'zh-CN,zh;q=0.9',
            'Cache-Control': 'max-age=0',
            'Connection': 'keep-alive',
            'Cookie': 't=4d697417e7f0cda1a0947596f98ba98f; r=6056',
            'Host': 'www.lingyi.org',
            'Referer': 'http://www.lingyi.org/topics/lingyijingli',
            'Upgrade-Insecure-Requests': '1',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        }
    }
    
    def parse(self, response):
        # Extract links to detail pages
        for href in response.xpath('//h2/a/@href').extract():
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
