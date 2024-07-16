import scrapy
from scrapy_splash import SplashRequest
import sqlite3
import re
from fiction.items import SevenkBooksItem

class SevenkBooksSpider(scrapy.Spider):
    name = "sevenk_books"
    allowed_domains = ['17k.com', 'localhost']

    def __init__(self, *args, **kwargs):
        super(SevenkBooksSpider, self).__init__(*args, **kwargs)
        self.start_urls = self.get_start_urls_from_db()

    def get_start_urls_from_db(self):
        conn = sqlite3.connect('fiction.db')
        cursor = conn.cursor()
        cursor.execute("SELECT tag_link FROM sevenk_tags")
        rows = cursor.fetchall()
        conn.close()
        return [row[0] for row in rows]

    def start_requests(self):
        for url in self.start_urls:
            yield SplashRequest(url, self.parse, args={'wait': 1})

    def parse(self, response):
        books = response.xpath('//div[@class="book"]')
        for book in books:
            book_link = book.xpath('.//a[@class="title"]/@href').get()
            book_link = response.urljoin(book_link) if book_link else None
            book_name = book.xpath('.//a[@class="title"]/text()').get()
            author = book.xpath('.//p[contains(text(), "作者")]/a/text()').get()
            word_count = book.xpath('.//p[contains(text(), "字数")]/text()').get()
            word_count = int(re.search(r'\d+', word_count).group()) if re.search(r'\d+', word_count) else 0
            labels_elements = book.xpath('.//div[@class="label"]/a')
            labels = []
            for label in labels_elements:
                label_name = label.xpath('.//text()').get()
                label_link = response.urljoin(label.xpath('.//@href').get())  # 使用response.urljoin处理标签链接
                labels.append(label_name)
            labels = ','.join(labels)
            introduction = book.xpath('.//p[@style="display: none"]/text()').get()
            introduction = introduction.strip() if introduction else ''

            if word_count > 0 and book_link:
                book_detail_info_link = re.sub(r'/book/(\d+)\.html', r'/ck/book/\1?appKey=1351550300', book_link)
                item = SevenkBooksItem()
                item['book_name'] = book_name
                item['labels'] = labels
                item['word_count'] = word_count
                item['introduction'] = introduction
                item['author'] = author
                item['book_link'] = book_link
                item['book_detail_info_link'] = book_detail_info_link
                yield item
                
        next_page = response.xpath('//a[@class="btn" and contains(text(), "下一页") and contains(@href, "html")]/@href').get()
        if next_page:
            next_page_url = response.urljoin(next_page)
            yield SplashRequest(next_page_url, 
                                self.parse, 
                                args={'wait': 1},
                                meta=response.meta
                                )
