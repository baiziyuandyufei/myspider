const sqlite3 = require('sqlite3').verbose();

let db = null;

// 初始化数据库连接
function initializeDatabase() {
    return new Promise((resolve, reject) => {
        db = new sqlite3.Database('./db/boss.db', (err) => {
            if (err) {
                reject(err);
            } else {
                console.log('Connected to boss');
                resolve();
            }
        });
    });
}

// 创建表（如果不存在）
async function createTable() {
    try {
        // 创建黑表
        await runQuery(`CREATE TABLE IF NOT EXISTS black_company (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE
        )`);
        console.log('Table black_company ready');
        // 创建公司表 公司简称name类型text,风险risk类型实数,距离值dist类型实数,登记日期r_date
    } catch (error) {
        console.error('Could not create table', error);
    }
}

// 检查公司是否在黑名单中的函数
async function checkCompanyInBlackList(companyName) {
    try {
        const row = await runQuery('SELECT 1 FROM black_company WHERE name = ?', [companyName]);
        return !!row;
    } catch (error) {
        throw error;
    }
}

// 执行查询操作
function runQuery(sql, params) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject(new Error('Database connection not initialized.'));
            return;
        }
        
        db.get(sql, params, function (err, row) {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

// 关闭数据库连接
function closeDatabase() {
    return new Promise((resolve, reject) => {
        if (db) {
            db.close((err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log('Database connection closed');
                    resolve();
                }
            });
        } else {
            resolve(); // 如果数据库连接未初始化，则认为已经关闭
        }
    });
}

// 测试函数
async function testCheckCompanyInBlackList() {
    const companyName = '微软';

    try {
        await runQuery('INSERT OR IGNORE INTO black_company (name) VALUES (?)', [companyName]);
        console.log('微软 inserted');

        const isBlacklisted = await checkCompanyInBlackList(companyName);
        console.log(`Is "${companyName}" blacklisted?`, isBlacklisted);
    } catch (error) {
        console.error('Error testing company in blacklist', error);
    } finally {
        await runQuery('DELETE FROM black_company WHERE name = ?', [companyName]);
        console.log('微软 deleted');

        try {
            await closeDatabase();
        } catch (error) {
            console.error('Error closing database', error);
        }
    }
}

// 初始化和运行测试
async function main() {
    try {
        await initializeDatabase();
        await createTable();
        await testCheckCompanyInBlackList();
    } catch (error) {
        console.error('Error initializing database', error);
    }
}

// 运行主程序
if (require.main === module) {
    main();
}

module.exports = {
    checkCompanyInBlackList,
    initializeDatabase,
    createTable,
    closeDatabase
};

