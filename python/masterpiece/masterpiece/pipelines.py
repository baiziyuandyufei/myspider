import sqlite3
from scrapy.exceptions import DropItem
from masterpiece.items import MasterpieceSuiziItem

class MasterpieceSuiziPipeline:

    def open_spider(self, spider):
        self.conn = sqlite3.connect('masterpiece.db')
        self.cursor = self.conn.cursor()
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS sunzi (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tao_name TEXT,
                ji_name TEXT,
                ji_url TEXT UNIQUE,
                yw TEXT,
                ay TEXT,
                zs TEXT,
                fy TEXT,
                ay_fy TEXT,
                jm_jx TEXT,
                jm_yc TEXT
            )
        ''')
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS sunzi_sl (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ji_url TEXT,
                ji_name TEXT,
                sl_name TEXT UNIQUE,
                sl_content TEXT,
                FOREIGN KEY (ji_url) REFERENCES sunzi(ji_url),
                FOREIGN KEY (ji_name) REFERENCES sunzi(ji_name)
            )
        ''')
        self.conn.commit()

    def close_spider(self, spider):
        self.conn.commit()
        self.conn.close()

    def process_item(self, item, spider):
        if isinstance(item, MasterpieceSuiziItem):
            tao_name = item.get('tao_name')
            ji_name = item.get('ji_name')
            ji_url = item.get('ji_url')
            yw = item.get('yw')
            ay = item.get('ay')
            zs = item.get('zs')
            fy = item.get('fy')
            ay_fy = item.get('ay_fy')
            jm_jx = item.get('jm_jx')
            jm_yc = item.get('jm_yc')
            sl_jd = item.get('sl_jd')

            if not (tao_name and ji_name and ji_url):
                raise DropItem("Missing one or more required fields (tao_name, ji_name, ji_url) in item")

            # 检查 ji_url 是否唯一
            self.cursor.execute('SELECT 1 FROM sunzi WHERE ji_url = ?', (ji_url,))
            if self.cursor.fetchone():
                return None

            # 插入 sunzi 表数据
            self.cursor.execute('''
                INSERT INTO sunzi (
                    tao_name, ji_name, ji_url, yw, ay, zs, fy, ay_fy, jm_jx, jm_yc
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                tao_name,
                ji_name,
                ji_url,
                yw,
                ay,
                zs,
                fy,
                ay_fy,
                jm_jx,
                jm_yc
            ))
            self.conn.commit()

            # 插入 sunzi_sl 表数据
            if sl_jd and isinstance(sl_jd, dict):
                for sl_name, sl_content in sl_jd.items():
                    # 检查 sl_name 是否唯一
                    self.cursor.execute('SELECT 1 FROM sunzi_sl WHERE sl_name = ?', (sl_name,))
                    if self.cursor.fetchone():
                        continue
                    self.cursor.execute('''
                        INSERT INTO sunzi_sl (
                            ji_url, ji_name, sl_name, sl_content
                        ) VALUES (?, ?, ?, ?)
                    ''', (
                        ji_url,
                        ji_name,
                        sl_name,
                        sl_content
                    ))
                self.conn.commit()
        
        return item
