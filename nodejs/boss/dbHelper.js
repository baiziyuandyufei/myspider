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
        
        // 创建招呼表 公司名，地址，职位名，职位描述，推荐类别，风险值，距离值，录入日期
        await runQuery(`CREATE TABLE IF NOT EXISTS greeting (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            boss_name TEXT NOT NULL UNIQUE,
            job_address TEXT NOT NULL,
            job_name TEXT NOT NULL,
            job_desc TEXT,
            recommended_job_name TEXT,
            risk REAL,
            dist REAL,
            r_date TEXT NOT NULL
        )`);
        console.log('Table greeting ready');
        
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

// 检查公司名是否在招呼表中的函数
async function checkCompanyInGreetingTable(companyName) {
    try {
        const row = await runQuery('SELECT 1 FROM greeting WHERE boss_name = ?', [companyName]);
        return !!row;
    } catch (error) {
        throw error;
    }
}

// 插入数据到greeting表的函数
async function insertIntoGreetingTable(companyName, jobAddress, jobName, jobDesc, recommendedJobName, risk, dist, r_date) {
    try {
        await runQuery(
            'INSERT OR IGNORE INTO greeting (boss_name, job_address, job_name, job_desc, recommended_job_name, risk, dist, r_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [companyName, jobAddress, jobName, jobDesc, recommendedJobName, risk, dist, r_date]
        );
        // console.log(`${companyName} inserted into greeting table`);
    } catch (error) {
        console.error('Error inserting data into greeting table', error);
    }
}

// 执行操作
function runQuery(sql, params) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject(new Error('Database connection not initialized.'));
            return;
        }

        // 检查SQL语句类型
        const queryType = sql.trim().split(' ')[0].toUpperCase();
        
        if (queryType === 'SELECT') {
            db.get(sql, params, function (err, row) {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        } else {
            db.run(sql, params, function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        }
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

// 测试函数，包含插入和检查公司名是否在招呼表中
async function testInsertAndCheckCompanyInGreetingTable() {
    const companyName = '微软';
    const jobAddress = '某地址';
    const jobName = '某职位';
    const jobDesc = '职位描述';
    const recommendedJobName = '推荐职位';
    const risk = 0.5;
    const dist = 10.0;
    const r_date = '2024-07-11';

    try {
        // 插入数据
        await insertIntoGreetingTable(companyName, jobAddress, jobName, jobDesc, recommendedJobName, risk, dist, r_date);
        console.log(`${companyName} inserted into greeting table`);

        // 检查是否在招呼表中
        const isInGreetingTable = await checkCompanyInGreetingTable(companyName);
        console.log(`Is "${companyName}" in greeting table?`, isInGreetingTable);
    } catch (error) {
        console.error('Error inserting or checking company in greeting table', error);
    } finally {
        // 清理数据
        await runQuery('DELETE FROM greeting WHERE boss_name = ?', [companyName]);
        console.log(`${companyName} deleted from greeting table`);

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
        // await testCheckCompanyInBlackList();
        await testInsertAndCheckCompanyInGreetingTable();
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
    checkCompanyInGreetingTable,
    insertIntoGreetingTable,
    initializeDatabase,
    createTable,
    closeDatabase
};

