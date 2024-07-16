import scrapy
from scrapy_splash import SplashRequest
import re
import json
from fiction.items import FictionItem

class FictionSpider(scrapy.Spider):
    name = 'sevenk'
    allowed_domains = ['17k.com', 'localhost']
    start_urls = ['https://h5.17k.com/tags/1.html']

    def start_requests(self):
        for url in self.start_urls:
            yield SplashRequest(url, self.parse, args={'wait': 1})

    # 解析类别页
    def parse(self, response):
        tags = response.xpath('//div[@class="Tags"]/a')
        for tag in tags:
            category_link = tag.xpath('.//@href').get()
            category = tag.xpath('.//text()').get()

            # 访问类别链接
            if category_link:
                meta_data = {
                    'category':category
                }
                category_link = response.urljoin(category_link)
                yield SplashRequest(category_link, 
                                    self.parse_works_list, 
                                    args={'wait': 1}, 
                                    meta=meta_data)
                

        # 提取下一页链接
        next_page = response.xpath('//a[@class="btn" and contains(text(), "下一页")]/@href').get()
        if next_page:
            next_page_url = response.urljoin(next_page)
            yield SplashRequest(next_page_url, self.parse, args={'wait': 1})

    # 解析书目页
    def parse_works_list(self, response):
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

            # 访问书本信息链接
            if word_count > 0 and book_link:
                meta_data = {
                    'book_name': book_name,
                    'category':response.meta['category'],
                    'labels': labels,
                    'word_count': word_count,
                    'introduction': introduction,
                    'author': author,
                    'book_link':book_link
                }
                book_link = re.sub(r'/book/(\d+)\.html', r'/ck/book/\1?appKey=1351550300', book_link)
                yield SplashRequest(book_link, 
                        self.parse_chapter_url, 
                        args={'wait': 1}, 
                        meta=meta_data
                )
                
        
        # 提取下一页链接
        next_page = response.xpath('//a[@class="btn" and contains(text(), "下一页")]/@href').get()
        if next_page:
            next_page_url = response.urljoin(next_page)
            yield SplashRequest(next_page_url, 
                                self.parse_works_list, 
                                args={'wait': 1},
                                meta=response.meta
                                )
    
    # 解析书本信息
    def parse_chapter_url(self, response):
        json_text = response.xpath('//pre/text()').get()
        if json_text:
            book_link = response.meta['book_link']
            book_id = book_link.split('/')[-1].split('.')[0]
            json_data = json.loads(json_text)
            first_chapter_id = json_data['data']['firstChapterId'] if 'data' in json_data and 'firstChapterId' in json_data['data'] else None
            first_chapter_id = int(first_chapter_id) if first_chapter_id else None
            chapter_count = json_data['data']['chapterCount'] if 'data' in json_data and 'chapterCount' in json_data['data'] else None
            chapter_count = int(chapter_count) if chapter_count else None
            if first_chapter_id and chapter_count:
                chapter_ids = list(range(first_chapter_id, first_chapter_id + chapter_count * 2, 2))
                chapter_urls = [f"https://www.17k.com/chapter/{book_id}/{chapter_id}.html" for chapter_id in chapter_ids]

                # 遍历章节链接，依次请求章节内容
                for i, chapter_url in enumerate(chapter_urls):
                    meta_data = {
                        'book_name': response.meta['book_name'],
                        'category':response.meta['category'],
                        'labels': response.meta['labels'],
                        'word_count': response.meta['word_count'],
                        'introduction': response.meta['introduction'],
                        'author': response.meta['author'],
                        'chapter_count':chapter_count,
                        'chapter_url':chapter_url,
                        'chapter_ser':i+1
                    }
                    yield SplashRequest(chapter_url, 
                                        callback=self.parse_chapter_content, 
                                        endpoint='render.html',
                                        args={'wait': 1}, 
                                        meta=meta_data)

    def parse_chapter_content(self, response):
        # 提取章节标题
        chapter_title = response.xpath('//h1/text()').get()
        chapter_title = chapter_title.strip() if chapter_title else None
        # 提取章节内容
        chapter_content = '\n'.join(response.xpath('//div[@class="p"]/p[not(@class)]/text()').getall())

        if chapter_title and chapter_content:
            meta_data = {
                'chapter_title':chapter_title,
                'chapter_content':chapter_content,
                'category':response.meta['category'],
                'labels': response.meta['labels'],
                'introduction': response.meta['introduction'],
                'book_name': response.meta['book_name'],
                'word_count': response.meta['word_count'],
                'chapter_ser':response.meta['chapter_ser'],
                'chapter_count':response.meta['chapter_count'],
                'chapter_url':response.meta['chapter_url'],
                'author': response.meta['author']
            }
            item = FictionItem()
            item.update(meta_data)
            yield item
