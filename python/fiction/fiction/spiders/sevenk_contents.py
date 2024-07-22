import scrapy
from scrapy_splash import SplashRequest
import sqlite3
from fiction.items import SevenkContentsItem

class SevenkContentsSpider(scrapy.Spider):
    name = "sevenk_contents"
    allowed_domains = ['17k.com', 'localhost']

    def __init__(self, *args, **kwargs):
        super(SevenkContentsSpider, self).__init__(*args, **kwargs)
        self.start_urls = self.get_start_urls_from_db()

    def get_start_urls_from_db(self):
        conn = sqlite3.connect('fiction.db')
        cursor = conn.cursor()

        # 获取 sevenk_contents 表中的所有已下载的 chapter_url
        cursor.execute("SELECT chapter_url FROM sevenk_contents")
        downloaded_chapter_urls = set(url[0] for url in cursor.fetchall())

        # 获取这些 chapter_url 对应的 book_name（去重）
        cursor.execute(
            "SELECT DISTINCT book_name FROM sevenk_chapters WHERE chapter_url IN ({})"
            .format(','.join('?' * len(downloaded_chapter_urls))), 
            tuple(downloaded_chapter_urls)
        )
        downloaded_book_names = set(name[0] for name in cursor.fetchall())

        # 获取 sevenk_chapters 表中未下载书名的所有 chapter_url
        cursor.execute(
            "SELECT chapter_url FROM sevenk_chapters WHERE book_name NOT IN ({})"
            .format(','.join('?' * len(downloaded_book_names))), 
            tuple(downloaded_book_names)
        )
        result_urls = [chapter[0] for chapter in cursor.fetchall()]

        # 打印还要下载多少本书，以及还要下载多少个chapter_url
        self.logger.info(f"还有 {len(downloaded_book_names)} 本书要下载。")
        self.logger.info(f"还有 {len(result_urls)} 个章节要下载。")

        conn.close()
        return result_urls


    def start_requests(self):
        for url in self.start_urls:
            yield SplashRequest(url, self.parse, args={'wait': 1},meta={'chapter_url':url})

    def parse(self, response):
        chapter_url = response.meta['chapter_url']
        chapter_content_li = response.xpath('//div[@class="p"]/p/text()').getall()
        chapter_content_li = [chapter_content.strip() for chapter_content in chapter_content_li]
        chapter_content = '\n'.join([chapter_content for chapter_content in chapter_content_li if len(chapter_content)>0])
        if chapter_url and chapter_content:
            item = SevenkContentsItem()
            item['chapter_url'] = chapter_url
            item['chapter_content'] = chapter_content
            yield item
