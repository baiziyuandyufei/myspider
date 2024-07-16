import scrapy
import sqlite3
from scrapy_splash import SplashRequest
import json
from fiction.items import SevenkChaptersItem
import re

class SevenkChaptersSpider(scrapy.Spider):
    name = "sevenk_chapters"
    allowed_domains = ['17k.com', 'localhost']

    def __init__(self, *args, **kwargs):
        super(SevenkChaptersSpider, self).__init__(*args, **kwargs)
        self.start_urls = self.get_start_urls_from_db()

    def get_start_urls_from_db(self):
        conn = sqlite3.connect('fiction.db')
        cursor = conn.cursor()

        # 获取 sevenk_books 表中的 book_link 和 book_name
        cursor.execute("SELECT book_link, book_name FROM sevenk_books")
        books = cursor.fetchall()

        # 获取 sevenk_chapters 表中的所有 book_name
        cursor.execute("SELECT DISTINCT book_name FROM sevenk_chapters")
        chapter_books = {row[0] for row in cursor.fetchall()}

        # 过滤出不在 sevenk_chapters 表中的 book_link，并转换 URL
        result_urls = [
            re.sub(r"https://h5\.17k\.com/book/(\d+)\.html", r"https://www.17k.com/list/\1.html", book[0])
            for book in books if book[1] not in chapter_books
        ]

        conn.close()
        return result_urls
    
    def start_requests(self):
        for url in self.start_urls:
            yield SplashRequest(url, self.parse, args={'wait': 1})

    def parse(self, response):
        book_name = response.xpath('//div/h1/text()').get()
        node_li = response.xpath('//dl[@class="Volume"]/dd/a')
        for node in node_li:
            chapter_url = node.xpath('./@href').get()
            chapter_url = response.urljoin(chapter_url) if chapter_url else None
            chapter_title = node.xpath('./span/text()').get()
            chapter_title = chapter_title.strip() if chapter_title else ''
            if book_name and chapter_url and chapter_title:
                item = SevenkChaptersItem()
                item['book_name'] = book_name
                item['chapter_url'] = chapter_url
                item['chapter_title'] = chapter_title
                yield item
