# Define here the models for your scraped items
#
# See documentation in:
# https://docs.scrapy.org/en/latest/topics/items.html

import scrapy


class MasterpieceItem(scrapy.Item):
    # define the fields for your item here like:
    # name = scrapy.Field()
    pass

class MasterpieceSuiziItem(scrapy.Item):
    tao_name = scrapy.Field()
    ji_name = scrapy.Field()
    ji_url = scrapy.Field()
    yw = scrapy.Field()
    ay = scrapy.Field()
    zs = scrapy.Field()
    fy = scrapy.Field()
    ay_fy = scrapy.Field()
    sl_jd = scrapy.Field()
    jm_jx = scrapy.Field()
    jm_yc = scrapy.Field()
