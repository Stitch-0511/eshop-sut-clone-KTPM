const { Pool } = require('pg');

async function createDatabase() {
    const pool = new Pool({
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: '11163858',
        database: 'postgres'
    });

    try {
        // Check if database exists
        const check = await pool.query(
            "SELECT 1 FROM pg_database WHERE datname = 'eshop_test'"
        );

        if (check.rows.length > 0) {
            console.log('Database eshop_test đã tồn tại');
        } else {
            // Cannot use parameterized query for database name
            await pool.query('CREATE DATABASE eshop_test');
            console.log('Đã tạo database eshop_test thành công');
        }
    } catch (err) {
        console.error('Lỗi tạo database:', err.message);
    } finally {
        await pool.end();
    }
}

createDatabase();
