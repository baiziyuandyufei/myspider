"""
爬取17k小说网所有标签。
存储到表sevenk_tags，字段：标签名，标签链接。
ChatGPT扩展灵异相关标签（也可以用文本嵌入模型或自然语言推断模型），
可用的文本嵌入模型
- https://huggingface.co/BAAI/bge-large-zh-v1.5
可用的nli模型
- https://huggingface.co/MoritzLaurer/mDeBERTa-v3-base-xnli-multilingual-nli-2mil7
统计标签分布：
```{sql}
SELECT
    SUM(CASE WHEN tag_name LIKE '%恐怖%' THEN 1 ELSE 0 END) AS count_恐怖,
    SUM(CASE WHEN tag_name LIKE '%悬疑%' THEN 1 ELSE 0 END) AS count_悬疑,
    SUM(CASE WHEN tag_name LIKE '%神秘%' THEN 1 ELSE 0 END) AS count_神秘,
    SUM(CASE WHEN tag_name LIKE '%惊悚%' THEN 1 ELSE 0 END) AS count_惊悚,
    SUM(CASE WHEN tag_name LIKE '%刺激%' THEN 1 ELSE 0 END) AS count_刺激,
    SUM(CASE WHEN tag_name LIKE '%鬼怪%' THEN 1 ELSE 0 END) AS count_鬼怪,
    SUM(CASE WHEN tag_name LIKE '%灵魂%' THEN 1 ELSE 0 END) AS count_灵魂,
    SUM(CASE WHEN tag_name LIKE '%鬼神%' THEN 1 ELSE 0 END) AS count_鬼神,
    SUM(CASE WHEN tag_name LIKE '%僵尸%' THEN 1 ELSE 0 END) AS count_僵尸,
    SUM(CASE WHEN tag_name LIKE '%丧尸%' THEN 1 ELSE 0 END) AS count_丧尸,
    SUM(CASE WHEN tag_name LIKE '%亡灵%' THEN 1 ELSE 0 END) AS count_亡灵
FROM sevenk_tags
```
"""
import scrapy
from scrapy_splash import SplashRequest
from fiction.items import SevenkTagsItem


class SevenkTagsSpider(scrapy.Spider):
    name = "sevenk_tags"
    allowed_domains = ['17k.com', 'localhost']
    start_urls = ['https://h5.17k.com/tags/1.html']

    def start_requests(self):
        for url in self.start_urls:
            yield SplashRequest(url, self.parse, args={'wait': 1})

    def parse(self, response):
        tags = response.xpath('//div[@class="Tags"]/a')
        for tag in tags:
            tag_link = tag.xpath('.//@href').get()
            tag_link = response.urljoin(tag_link) if tag_link else None
            tag_name = tag.xpath('.//text()').get()

            if tag_link and tag_name:
                item = SevenkTagsItem()
                item['tag_link'] = tag_link
                item['tag_name'] = tag_name
                yield item

        next_page = response.xpath('//a[@class="btn" and contains(text(), "下一页")]/@href').get()
        if next_page:
            next_page_url = response.urljoin(next_page)
            yield SplashRequest(next_page_url, self.parse, args={'wait': 1})
