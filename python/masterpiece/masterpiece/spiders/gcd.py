import scrapy


class GcdSpider(scrapy.Spider):
    name = "gcd"
    allowed_domains = ["www.12371.cn"]
    start_urls = ["https://www.12371.cn/2015/10/23/ARTI1445584325740788.shtml"]

    def parse(self, response):
        pass
