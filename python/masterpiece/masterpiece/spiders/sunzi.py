import scrapy
import re
from masterpiece.items import MasterpieceSuiziItem


class SunziSpider(scrapy.Spider):
    name = "sunzi"
    allowed_domains = ["sunzi.5000yan.com"]
    start_urls = ["https://sunzi.5000yan.com/36/"]

    def parse(self, response):
        current_tao = ''
        node_li = response.xpath('//div[@class="p-2 my-2 bg-white rounded"]/h3/a | //div[@class="p-2 my-2 bg-white rounded"]/ul/li/a')
        for node in node_li:
            text = node.xpath('./text()').get()
            if re.search('^第.*套',text):
                current_tao = text
            elif re.search('^第.*计',text):
                ji_url = node.xpath('./@href').get()
                ji_name = node.xpath('./text()').get()
                if ji_url:
                    yield response.follow(ji_url, self.parse_content,meta={'tao_name': current_tao,
                                                                           'ji_name':ji_name,
                                                                           'ji_url':ji_url})
            else:
                continue

    def parse_content(self, response):
        result_dict = {}
        shili_dict = {}
        current_field_name = ''
        current_field_value = ''
        node_li = response.xpath('//div[@class="grap"]/div')
        for node in node_li:
            strong_node = node.xpath('./strong')
            if strong_node:
                if current_field_name:
                    if re.search('原文|按语|注释|翻译|按语翻译|按语译文|实例解读|计名解析|计名源出',current_field_name):
                        current_field_name = re.sub('【|】','',current_field_name)
                        current_field_name = re.sub('按语译文','按语翻译',current_field_name)
                        if current_field_name == '按语翻译' and  '按语翻译' in result_dict:
                            result_dict['按语'] = result_dict['按语翻译']
                            result_dict['按语翻译'] = current_field_value
                        elif current_field_name == '按语' and  '按语' in result_dict:
                            result_dict['按语翻译'] = current_field_value
                        else:
                            result_dict[current_field_name] = current_field_value
                    else:
                        shili_dict[current_field_name] = current_field_value
                current_field_name = strong_node.xpath('./text()').get()
                current_field_value = ''.join([text.strip() for text in node.xpath('.//text()').getall() if text.strip()])
                if not re.search('【|】',current_field_value):
                    current_field_value = '《' + current_field_value + '》 '

            else:
                current_field_value += ''.join([w.strip() for w in node.xpath('.//text()').getall()])
        if current_field_value and current_field_name:
            shili_dict[current_field_name] = current_field_value
        result_dict['实例解读'] = shili_dict
        item = MasterpieceSuiziItem()
        item['tao_name'] = response.meta['tao_name']
        item['ji_name'] = response.meta['ji_name']
        item['ji_url'] = response.meta['ji_url']
        item['yw'] = result_dict.get('原文','')
        item['ay'] = result_dict.get('按语','')
        item['zs'] = result_dict.get('注释','')
        item['fy'] = result_dict.get('翻译','')
        item['ay_fy'] = result_dict.get('按语翻译','')
        item['sl_jd'] = result_dict.get('实例解读','')
        item['jm_jx'] = result_dict.get('计名解析','')
        item['jm_yc'] = result_dict.get('计名源出','')
        yield item



