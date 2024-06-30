# Define your item pipelines here
#
# Don't forget to add your pipeline to the ITEM_PIPELINES setting
# See: https://docs.scrapy.org/en/latest/topics/item-pipeline.html


# useful for handling different item types with a single interface
from itemadapter import ItemAdapter
import sqlite3


class HorrorPipeline:

    def open_spider(self, spider):
        self.connection = sqlite3.connect("horror.db")
        self.cursor = self.connection.cursor()
        self.table_name = spider.name
        self.cursor.execute(f'''
            CREATE TABLE IF NOT EXISTS {self.table_name} (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT,
                url TEXT UNIQUE,
                content TEXT
            )
        ''')
        self.connection.commit()

    def close_spider(self, spider):
        self.connection.close()

    def process_item(self, item, spider):
        # Check if the URL already exists in the database
        self.cursor.execute(f'SELECT 1 FROM {self.table_name} WHERE url = ?', (item['url'],))
        exists = self.cursor.fetchone()
        
        if exists:
            # If the URL exists, do not insert the item
            spider.logger.info(f"Item with URL {item['url']} already exists in the database.")
        else:
            # If the URL does not exist, insert the item
            self.cursor.execute(f'''
                INSERT INTO {self.table_name} (title, url, content) VALUES (?, ?, ?)
            ''', (item['title'], item['url'], item['content']))
            self.connection.commit()
        
        return item
