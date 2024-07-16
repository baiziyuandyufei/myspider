import sqlite3
from scrapy.exceptions import DropItem
from fiction.items import SevenkTagsItem, FictionItem, SevenkBooksItem, SevenkChaptersItem

class SQLitePipeline:
    def open_spider(self, spider):
        self.conn = sqlite3.connect('fiction.db')
        self.cursor = self.conn.cursor()
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS sevenk (
                chapter_title TEXT,
                chapter_content TEXT,
                category TEXT,
                labels TEXT,
                introduction TEXT,
                book_name TEXT,
                word_count INTEGER,
                chapter_ser INTEGER,
                chapter_count INTEGER,
                chapter_url TEXT PRIMARY KEY,
                author TEXT
            )
        ''')
        self.conn.commit()

    def close_spider(self, spider):
        self.conn.commit()
        self.conn.close()

    def process_item(self, item, spider):
        if isinstance(item, FictionItem):
            chapter_url = item.get('chapter_url')
            if chapter_url:
                self.cursor.execute('''
                    SELECT 1 FROM sevenk WHERE chapter_url=?
                ''', (chapter_url,))
                exists = self.cursor.fetchone()

                if exists:
                    raise DropItem(f"Duplicate item found: {chapter_url}")
                else:
                    self.cursor.execute('''
                        INSERT INTO sevenk (chapter_title, chapter_content, category, labels, introduction, book_name, word_count, chapter_ser, chapter_count, chapter_url, author) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (
                        item.get('chapter_title'), 
                        item.get('chapter_content'), 
                        item.get('category'), 
                        item.get('labels'), 
                        item.get('introduction'), 
                        item.get('book_name'), 
                        item.get('word_count'), 
                        item.get('chapter_ser'), 
                        item.get('chapter_count'), 
                        chapter_url, 
                        item.get('author')
                    ))
                    self.conn.commit()
            else:
                raise DropItem("Missing chapter_url in item")
        
        return item


class SevenkTagsPipeline:
    def open_spider(self, spider):
        self.conn = sqlite3.connect('fiction.db')
        self.cursor = self.conn.cursor()
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS sevenk_tags (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tag_name TEXT,
                tag_link TEXT UNIQUE
            )
        ''')
        self.conn.commit()

    def close_spider(self, spider):
        self.conn.commit()
        self.conn.close()

    def process_item(self, item, spider):
        if isinstance(item, SevenkTagsItem):
            tag_link = item.get('tag_link')
            if tag_link:
                self.cursor.execute('SELECT 1 FROM sevenk_tags WHERE tag_link = ?', (tag_link,))
                result = self.cursor.fetchone()

                if result:
                    raise DropItem(f"Duplicate item found: {tag_link}")
                else:
                    self.cursor.execute('''
                        INSERT INTO sevenk_tags (tag_name, tag_link) VALUES (?, ?)
                    ''', (item.get('tag_name'), tag_link))
                    self.conn.commit()
            else:
                raise DropItem("Missing tag_link in item")
        
        return item


class SevenkBooksPipeline:
    def open_spider(self, spider):
        self.conn = sqlite3.connect('fiction.db')
        self.cursor = self.conn.cursor()
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS sevenk_books (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                book_name TEXT UNIQUE,
                labels TEXT,
                word_count TEXT,
                introduction TEXT,
                author TEXT,
                book_link TEXT UNIQUE,
                book_detail_info_link TEXT UNIQUE
            )
        ''')
        self.conn.commit()

    def close_spider(self, spider):
        self.conn.commit()
        self.conn.close()

    def process_item(self, item, spider):
        if isinstance(item, SevenkBooksItem):
            book_name = item.get('book_name')
            book_link = item.get('book_link')
            book_detail_info_link = item.get('book_detail_info_link')

            if not book_name or not book_link or not book_detail_info_link:
                raise DropItem("Missing one or more required fields (book_name, book_link, book_detail_info_link) in item")

            # 检查 book_name 是否唯一
            self.cursor.execute('SELECT 1 FROM sevenk_books WHERE book_name = ?', (book_name,))
            if self.cursor.fetchone():
                return None

            # 检查 book_link 是否唯一
            self.cursor.execute('SELECT 1 FROM sevenk_books WHERE book_link = ?', (book_link,))
            if self.cursor.fetchone():
                return None

            # 检查 book_detail_info_link 是否唯一
            self.cursor.execute('SELECT 1 FROM sevenk_books WHERE book_detail_info_link = ?', (book_detail_info_link,))
            if self.cursor.fetchone():
                return None

            # 插入数据
            self.cursor.execute('''
                INSERT INTO sevenk_books (
                    book_name, labels, word_count, introduction, author, book_link, book_detail_info_link
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (
                book_name,
                item.get('labels'),
                item.get('word_count'),
                item.get('introduction'),
                item.get('author'),
                book_link,
                book_detail_info_link
            ))
            self.conn.commit()
        
        return item


class SevenkChaptersPipeline:
    def open_spider(self, spider):
        self.conn = sqlite3.connect('fiction.db')
        self.cursor = self.conn.cursor()
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS sevenk_chapters (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                book_name TEXT,
                chapter_url TEXT UNIQUE,
                chapter_title TEXT
            )
        ''')
        self.conn.commit()

    def close_spider(self, spider):
        self.conn.commit()
        self.conn.close()

    def process_item(self, item, spider):
        if isinstance(item, SevenkChaptersItem):
            book_name = item.get('book_name')
            chapter_url = item.get('chapter_url')
            chapter_title = item.get('chapter_title')

            if not book_name or not chapter_url or not chapter_title:
                raise DropItem("Missing one or more required fields (book_name, chapter_url, chapter_title) in item")

            # 检查 chapter_url 是否唯一
            self.cursor.execute('SELECT 1 FROM sevenk_chapters WHERE chapter_url = ?', (chapter_url,))
            if self.cursor.fetchone():
                return None

            # 插入数据
            self.cursor.execute('''
                INSERT INTO sevenk_chapters (
                    book_name, chapter_url, chapter_title
                ) VALUES (?, ?, ?)
            ''', (
                book_name,
                chapter_url,
                chapter_title
            ))
            self.conn.commit()
        
        return item
