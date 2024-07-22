import sqlite3
from scrapy.exceptions import DropItem

class GushufangDayuPipeline:

    def __init__(self):
        self.connection = sqlite3.connect('gushufang.db')
        self.cursor = self.connection.cursor()
        self.create_table()

    def create_table(self):
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS dayu (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT,
                url TEXT UNIQUE,
                content TEXT
            )
        ''')
        self.connection.commit()

    def process_item(self, item, spider):
        try:
            self.cursor.execute('''
                INSERT INTO dayu (title, url, content) VALUES (?, ?, ?)
            ''', (item['title'], item['url'], item['content']))
            self.connection.commit()
        except sqlite3.IntegrityError:
            raise DropItem(f"Duplicate item found: {item['url']}")
        return item

    def close_spider(self, spider):
        self.connection.close()
