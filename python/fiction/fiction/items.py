# Define here the models for your scraped items
#
# See documentation in:
# https://docs.scrapy.org/en/latest/topics/items.html

import scrapy


class FictionItem(scrapy.Item):
    category = scrapy.Field()
    labels = scrapy.Field()
    introduction = scrapy.Field()
    book_name = scrapy.Field()
    word_count = scrapy.Field()
    author = scrapy.Field()
    chapter_title = scrapy.Field()
    chapter_content = scrapy.Field()
    chapter_url = scrapy.Field()
    chapter_ser = scrapy.Field()
    chapter_count = scrapy.Field()

class SevenkTagsItem(scrapy.Item):
    tag_name = scrapy.Field()
    tag_link = scrapy.Field()

class SevenkBooksItem(scrapy.Item):
    book_name = scrapy.Field()
    labels = scrapy.Field()
    word_count = scrapy.Field()
    introduction = scrapy.Field()
    author = scrapy.Field()
    book_link = scrapy.Field()
    book_detail_info_link = scrapy.Field()

class SevenkChaptersItem(scrapy.Item):
    book_name = scrapy.Field()
    chapter_url = scrapy.Field()
    chapter_title = scrapy.Field()
