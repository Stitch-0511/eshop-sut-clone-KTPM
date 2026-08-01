const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function setupSchema() {
    const pool = new Pool({
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: '11163858',
        database: 'eshop_test'
    });

    try {
        const initSQL = fs.readFileSync(
            path.join(__dirname, '..', 'init.sql'),
            'utf8'
        );
        await pool.query(initSQL);
        console.log('Schema đã được khởi tạo thành công trên PostgreSQL');
    } catch (err) {
        console.error('Lỗi khởi tạo schema:', err.message);
    } finally {
        await pool.end();
    }
}

setupSchema();
