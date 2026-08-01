-- ============================================================
-- DATABASE SCHEMA - E-Commerce System (PostgreSQL Edition)
-- Chứa các đối tượng với lỗi logic có chủ đích
-- ============================================================

-- Xóa các đối tượng cũ nếu tồn tại
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP FUNCTION IF EXISTS fn_calculate_discount CASCADE;
DROP FUNCTION IF EXISTS sp_process_checkout CASCADE;
DROP TRIGGER IF EXISTS trg_prevent_negative_stock ON products;

-- 1. Bảng Người dùng
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(20) DEFAULT 'customer'
);

-- 2. Bảng Sản phẩm
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    stock INT DEFAULT 0 CHECK (stock >= 0)
);

-- 3. Bảng Mã giảm giá
CREATE TABLE coupons (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_type VARCHAR(20) CHECK (discount_type IN ('percent', 'fixed')) NOT NULL,
    discount_value NUMERIC(10, 2) NOT NULL,
    expired_at TIMESTAMP NOT NULL,
    is_active INT DEFAULT 1
);

-- 4. Bảng Đơn hàng
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    total_amount NUMERIC(10, 2) NOT NULL,
    final_amount NUMERIC(10, 2) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('pending', 'confirmed', 'shipping', 'delivered', 'canceled')) DEFAULT 'pending'
);

-- 5. Bảng Chi tiết Đơn hàng
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id),
    quantity INT NOT NULL DEFAULT 1
);

-- ============================================================
-- FUNCTION: Tính giảm giá
-- LỖI: Cho phép mức giảm vượt quá 100% hoặc vượt quá tổng đơn hàng
-- ============================================================
CREATE OR REPLACE FUNCTION fn_calculate_discount(
    p_discount_type VARCHAR,
    p_discount_value NUMERIC,
    p_order_amount NUMERIC
) RETURNS NUMERIC AS $$
DECLARE
    v_discount NUMERIC;
BEGIN
    IF p_discount_type = 'percent' THEN
        -- LỖI: Không kiểm tra giá trị percent > 100
        v_discount := p_order_amount * p_discount_value / 100;
    ELSE
        v_discount := p_discount_value;
    END IF;
    
    -- LỖI: Không giới hạn discount không vượt quá order_amount
    RETURN v_discount;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- STORED PROCEDURE: Xử lý checkout
-- LỖI: Không rollback toàn bộ khi có sản phẩm hết hàng
-- ============================================================
CREATE OR REPLACE FUNCTION sp_process_checkout(
    p_user_id INT,
    p_product_ids INT[],
    p_quantities INT[]
) RETURNS VOID AS $$
DECLARE
    i INT;
    v_product_id INT;
    v_quantity INT;
    v_current_stock INT;
    v_order_id INT;
BEGIN
    -- Tạo đơn hàng mới
    INSERT INTO orders (user_id, total_amount, final_amount, status)
    VALUES (p_user_id, 0, 0, 'pending')
    RETURNING id INTO v_order_id;
    
    -- LỖI: Không kiểm tra tồn kho trước khi trừ
    -- và không có rollback khi hết hàng
    FOR i IN 1..array_length(p_product_ids, 1) LOOP
        v_product_id := p_product_ids[i];
        v_quantity := p_quantities[i];
        
        -- Lấy tồn kho hiện tại (nhưng không dùng để kiểm tra)
        SELECT stock INTO v_current_stock FROM products WHERE id = v_product_id;
        
        -- Trừ tồn kho ngay lập tức (không kiểm tra đủ hàng)
        UPDATE products SET stock = stock - v_quantity WHERE id = v_product_id;
        
        -- Thêm vào chi tiết đơn
        INSERT INTO order_items (order_id, product_id, quantity)
        VALUES (v_order_id, v_product_id, v_quantity);
    END LOOP;
    
    -- Cập nhật tổng tiền (đơn giản hóa)
    UPDATE orders SET total_amount = 100, final_amount = 100 WHERE id = v_order_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TRIGGER: Kiểm tra tồn kho âm
-- Ghi chú: Trigger này cần được kiểm tra xem có thực sự hoạt động không
-- ============================================================
CREATE OR REPLACE FUNCTION fn_check_negative_stock()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.stock < 0 THEN
        RAISE EXCEPTION 'Stock cannot be negative: %', NEW.stock;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_negative_stock
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION fn_check_negative_stock();

-- ============================================================
-- TẠO APP USER CHO RBAC TESTING
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_user') THEN
        CREATE ROLE app_user WITH LOGIN PASSWORD 'test_password';
    END IF;
END
$$;

-- Cấp quyền cơ bản cho app_user
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO app_user;
