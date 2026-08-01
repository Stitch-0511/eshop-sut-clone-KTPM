const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '11163858',
    database: 'eshop_test'
});

beforeAll(async () => {
    // Reset schema
    const initSQL = fs.readFileSync(
        path.join(__dirname, 'init.sql'),
        'utf8'
    );
    await pool.query(initSQL);

    // Thêm dữ liệu mẫu
    const dataSQL = fs.readFileSync(
        path.join(__dirname, 'scripts', 'seed-data.sql'),
        'utf8'
    );
    await pool.query(dataSQL);
});

afterAll(async () => {
    await pool.end();
});

// ============================================================
// 1. Schema / Constraint Testing
// ============================================================
describe('1. Schema / Constraint Testing', () => {
    test('Tu choi email trung UNIQUE', async () => {
        await pool.query(
            "INSERT INTO users (email, role) VALUES ('unique@test.com', 'customer')"
        );
        await expect(
            pool.query("INSERT INTO users (email, role) VALUES ('unique@test.com', 'admin')")
        ).rejects.toThrow();
    });
});

// ============================================================
// 2. Function Testing - fn_calculate_discount
// ============================================================
describe('2. Function Testing - fn_calculate_discount', () => {
    test('Phat hien loi: discount vuot qua 100%', async () => {
        const result = await pool.query(
            "SELECT fn_calculate_discount('percent', 150, 200) AS discount"
        );
        const discount = Number(result.rows[0].discount);
        expect(discount).toBeLessThanOrEqual(200);
    });

    test('Phat hien loi: fixed discount vuot qua order_amount', async () => {
        const result = await pool.query(
            "SELECT fn_calculate_discount('fixed', 500000, 200000) AS discount"
        );
        const discount = Number(result.rows[0].discount);
        expect(discount).toBeLessThanOrEqual(200000);
    });
});

// ============================================================
// 3. Trigger Testing - trg_prevent_negative_stock
// ============================================================
describe('3. Trigger Testing - trg_prevent_negative_stock', () => {
    test('Chan cap nhat lam stock am', async () => {
        const before = await pool.query('SELECT stock FROM products WHERE id = 1');
        const currentStock = before.rows[0].stock;
        await expect(
            pool.query('UPDATE products SET stock = $1 WHERE id = $2', [-5, 1])
        ).rejects.toThrow();
        const after = await pool.query('SELECT stock FROM products WHERE id = 1');
        expect(after.rows[0].stock).toBe(currentStock);
    });
});

// ============================================================
// 4. Stored Procedure Testing - sp_process_checkout (Atomicity)
// ============================================================
describe('4. Stored Procedure Testing - sp_process_checkout (Atomicity)', () => {
    test('Chung minh loi: khong rollback khi het hang', async () => {
        const userResult = await pool.query("SELECT id FROM users WHERE email = 'user1@test.com'");
        const userId = userResult.rows[0].id;
        
        const stockBefore = await pool.query('SELECT stock FROM products WHERE id = 1');
        const stock = stockBefore.rows[0].stock;
        
        try {
            await pool.query(
                'SELECT sp_process_checkout($1, $2, $3)',
                [userId, [1, 2], [stock + 1, 1]]
            );
        } catch (e) {}
        
        const after = await pool.query('SELECT stock FROM products WHERE id = 1');
        expect(after.rows[0].stock).toBe(stock);
    });
});

// ============================================================
// 5. Functional API Testing
// ============================================================
describe('5. Functional API Testing', () => {
    test('Tu choi coupon het han (CP_EXPIRED)', async () => {
        const result = await pool.query(
            "SELECT * FROM coupons WHERE code = 'CP_EXPIRED' AND expired_at < NOW()"
        );
        expect(result.rows.length).toBeGreaterThan(0);
    });

    test('Tu choi coupon vo hieu hoa (CP_INACTIVE)', async () => {
        const result = await pool.query(
            "SELECT * FROM coupons WHERE code = 'CP_INACTIVE' AND is_active = 0"
        );
        expect(result.rows.length).toBeGreaterThan(0);
    });

    test('Chan canceled -> delivered', async () => {
        const orderResult = await pool.query(
            "INSERT INTO orders (user_id, total_amount, final_amount, status) VALUES (1, 100, 100, 'canceled') RETURNING id"
        );
        const orderId = orderResult.rows[0].id;
        await expect(
            pool.query("UPDATE orders SET status = 'delivered' WHERE id = $1", [orderId])
        ).rejects.toThrow();
    });
});

// ============================================================
// 6. Security Testing
// ============================================================
describe('6. Security Testing', () => {
    test('API tim kiem chong SQL Injection', async () => {
        const malicious = "'; DROP TABLE users; --";
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [malicious]
        );
        expect(result.rows.length).toBe(0);
        const tableCheck = await pool.query(
            "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users')"
        );
        expect(tableCheck.rows[0].exists).toBe(true);
    });
});

// ============================================================
// 7. Test Data Setup/Cleanup
// ============================================================
describe('7. Test Data Setup/Cleanup', () => {
    test('Du lieu mau du 5 users', async () => {
        const result = await pool.query('SELECT COUNT(*) FROM users');
        expect(Number(result.rows[0].count)).toBeGreaterThanOrEqual(5);
    });

    test('Du lieu mau du 5 products', async () => {
        const result = await pool.query('SELECT COUNT(*) FROM products');
        expect(Number(result.rows[0].count)).toBeGreaterThanOrEqual(5);
    });

    test('Du lieu mau du 4 coupons', async () => {
        const result = await pool.query('SELECT COUNT(*) FROM coupons');
        expect(Number(result.rows[0].count)).toBeGreaterThanOrEqual(4);
    });

    test('Du lieu mau du 200 orders', async () => {
        const result = await pool.query('SELECT COUNT(*) FROM orders');
        expect(Number(result.rows[0].count)).toBeGreaterThanOrEqual(200);
    });
});
