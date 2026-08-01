-- ============================================================
-- SEED DATA - Dữ liệu mẫu cho testing
-- Database: eshop_test (PostgreSQL)
-- ============================================================

-- 1. Users (5 users)
INSERT INTO users (email, role) VALUES 
    ('user1@test.com', 'customer'),
    ('user2@test.com', 'customer'),
    ('user3@test.com', 'customer'),
    ('user4@test.com', 'admin'),
    ('user5@test.com', 'customer');

-- 2. Products (5 products)
INSERT INTO products (name, price, stock) VALUES 
    ('Laptop Dell', 15000000, 50),
    ('iPhone 15', 25000000, 30),
    ('Samsung Galaxy', 20000000, 40),
    ('iPad Pro', 18000000, 25),
    ('AirPods Pro', 5000000, 100);

-- 3. Coupons (4 coupons)
INSERT INTO coupons (code, discount_type, discount_value, expired_at, is_active) VALUES 
    ('CP_EXPIRED', 'percent', 10, '2020-01-01', 1),
    ('CP_INACTIVE', 'percent', 15, '2030-01-01', 0),
    ('CP_ACTIVE', 'percent', 20, '2030-01-01', 1),
    ('CP_FIXED', 'fixed', 50000, '2030-01-01', 1);

-- 4. Orders (200 orders)
DO $$
DECLARE
    i INT;
    v_user_id INT;
    v_status VARCHAR(20);
    v_statuses VARCHAR[] := ARRAY['pending', 'confirmed', 'shipping', 'delivered', 'canceled'];
BEGIN
    FOR i IN 1..200 LOOP
        v_user_id := ((i - 1) % 5) + 1;
        v_status := v_statuses[((i - 1) % 5) + 1];
        
        INSERT INTO orders (user_id, total_amount, final_amount, status)
        VALUES (v_user_id, 100 + (i * 10), 90 + (i * 10), v_status);
    END LOOP;
END $$;

-- 5. Order Items (mỗi order 1-2 items)
DO $$
DECLARE
    i INT;
    v_order_id INT;
    v_product_id INT;
    v_quantity INT;
BEGIN
    FOR i IN 1..200 LOOP
        v_product_id := ((i - 1) % 5) + 1;
        v_quantity := ((i % 3) + 1);
        
        INSERT INTO order_items (order_id, product_id, quantity)
        VALUES (i, v_product_id, v_quantity);
    END LOOP;
END $$;
