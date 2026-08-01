# BÁO CÁO KẾT QUẢ KIỂM THỬ - MINI LAB DATABASE TESTING (PostgreSQL + AI/MCP)

## 1. Tổng quan Test Run

| Thông số | Giá trị |
|----------|---------|
| Môi trường | **Node.js + Jest + PostgreSQL** |
| Database | eshop_test (localhost:5432) |
| Tổng số test case | 13 |
| Số lượng Pass | 10 |
| Số lượng Fail (phát hiện bug) | 3 |
| Tỷ lệ phát hiện lỗi | 23.1% |
| Thời gian chạy | ~1.5s |

### Kết quả chi tiết theo khía cạnh

| Khía cạnh | Pass | Fail | Ghi chú |
|-----------|------|------|---------|
| Schema/Constraint | 1 | 0 | UNIQUE constraint hoạt động đúng |
| Function Testing | 0 | 2 | Phát hiện lỗi fn_calculate_discount |
| Trigger Testing | 1 | 0 | trg_prevent_negative_stock hoạt động đúng trên PostgreSQL |
| Stored Procedure | 1 | 0 | sp_process_checkout thiếu atomicity (test xác nhận lỗi) |
| Functional API | 2 | 1 | CHECK constraint không enforce trên UPDATE |
| Security Testing | 1 | 0 | SQL Injection được chống |
| Test Data Setup | 4 | 0 | Dữ liệu mẫu đầy đủ |

---

## 2. Danh sách Lỗi Phát hiện

### BUG-01: Hàm fn_calculate_discount cho phép giảm giá vượt quá 100%

| Thuộc tính | Chi tiết |
|------------|----------|
| **Mức độ** | Cao |
| **Vị trí** | `init.sql` - Function `fn_calculate_discount` |
| **Input** | `fn_calculate_discount('percent', 150, 200)` |
| **Expected** | `discount <= 200` (tối đa bằng tổng đơn hàng) |
| **Actual** | `discount = 300` (vượt quá 200) |
| **Nguyên nhân** | Hàm không kiểm tra giá trị `discount_value` > 100% và không giới hạn `discount` không vượt quá `order_amount` |
| **Bằng chứng test** | Test case "Phat hien loi: discount vuot qua 100%" FAIL |
| **Code Fix Patch** | |

```sql
-- Sửa hàm fn_calculate_discount:
CREATE OR REPLACE FUNCTION fn_calculate_discount(
    p_discount_type VARCHAR,
    p_discount_value NUMERIC,
    p_order_amount NUMERIC
) RETURNS NUMERIC AS $$
DECLARE
    v_discount NUMERIC;
BEGIN
    IF p_discount_type = 'percent' THEN
        -- Giới hạn percent tối đa 100%
        v_discount := p_order_amount * LEAST(p_discount_value, 100) / 100;
    ELSE
        v_discount := p_discount_value;
    END IF;
    
    -- Giới hạn discount không vượt quá order_amount
    RETURN LEAST(v_discount, p_order_amount);
END;
$$ LANGUAGE plpgsql;
```

---

### BUG-02: CHECK constraint không enforce trên UPDATE (canceled -> delivered)

| Thuộc tính | Chi tiết |
|------------|----------|
| **Mức độ** | Cao |
| **Vị trí** | `init.sql` - CHECK constraint trên bảng `orders` |
| **Input** | `UPDATE orders SET status = 'delivered' WHERE id = X` (đơn hàng đã canceled) |
| **Expected** | Throw error: status không hợp lệ |
| **Actual** | Update thành công, status = 'delivered' |
| **Nguyên nhân** | PostgreSQL CHECK constraint chỉ validate khi INSERT, không validate khi UPDATE (cần trigger để enforce) |
| **Bằng chứng test** | Test case "Chan canceled -> delivered" FAIL |
| **Code Fix Patch** | |

```sql
-- Tạo trigger để enforce status transition:
CREATE OR REPLACE FUNCTION fn_validate_status_transition()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'canceled' AND NEW.status != 'canceled' THEN
        RAISE EXCEPTION 'Cannot change status from canceled to %', NEW.status;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_status_transition
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION fn_validate_status_transition();
```

---

### BUG-03: Stored Procedure sp_process_checkout thiếu Atomicity

| Thuộc tính | Chi tiết |
|------------|----------|
| **Mức độ** | Cao |
| **Vị trí** | `init.sql` - Function `sp_process_checkout` |
| **Input** | Checkout với sản phẩm hết hàng (stock = 0) |
| **Expected** | Toàn bộ transaction rollback, stock giữ nguyên |
| **Actual** | Stock sản phẩm đầu tiên bị trừ dở dang, không rollback |
| **Nguyên nhân** | Không có kiểm tra tồn kho trước khi trừ và không có exception handling |
| **Bằng chứng test** | Test case "Chung minh loi: khong rollback khi het hang" PASSED (xác nhận lỗi) |
| **Code Fix Patch** | |

```sql
-- Sửa sp_process_checkout:
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
    
    -- Kiểm tra tồn kho TRƯỚC khi xử lý
    FOR i IN 1..array_length(p_product_ids, 1) LOOP
        v_product_id := p_product_ids[i];
        v_quantity := p_quantities[i];
        
        SELECT stock INTO v_current_stock FROM products WHERE id = v_product_id;
        
        IF v_current_stock < v_quantity THEN
            RAISE EXCEPTION 'Product % out of stock (available: %, requested: %)', 
                v_product_id, v_current_stock, v_quantity;
        END IF;
    END LOOP;
    
    -- Nếu tất cả OK, mới trừ tồn kho
    FOR i IN 1..array_length(p_product_ids, 1) LOOP
        v_product_id := p_product_ids[i];
        v_quantity := p_quantities[i];
        
        UPDATE products SET stock = stock - v_quantity WHERE id = v_product_id;
        
        INSERT INTO order_items (order_id, product_id, quantity)
        VALUES (v_order_id, v_product_id, v_quantity);
    END LOOP;
END;
$$ LANGUAGE plpgsql;
```

---

## 3. Kết quả Hiệu năng

### Thực thi trên PostgreSQL

| Chỉ số | Trước Index | Sau Index |
|--------|-------------|-----------|
| Execution Time | ~0.5-2ms | ~0.5-2ms |
| Scan Type | Seq Scan | Seq Scan (bảng nhỏ) |
| Buffers | ~8-16 pages | ~8-16 pages |

### Nhận xét về PostgreSQL Planner

1. **Với ~200 bản ghi**: PostgreSQL Planner thường **CHỌN Seq Scan** thay vì Index Scan vì:
   - Bảng quá nhỏ, chi phí sequential I/O thấp hơn random I/O
   - Planner dựa vào statistics để quyết định

2. **Index sẽ hữu ích hơn khi**:
   - Bảng có hàng nghìn+ bản ghi
   - Truy vấn lọc theo một phần nhỏ dữ liệu
   - Cần truy cập ngẫu nhiên nhiều bản ghi

3. **Kết luận**: Không phải lúc nào tạo Index cũng tốt. Cần dựa vào EXPLAIN ANALYZE thực tế.

---

## 4. Nhật ký MCP (AI/MCP Integration Log)

### Prompt tra cứu schema

```
"Liệt kê danh sách bảng, khóa ngoại, ràng buộc, trigger, function 
và stored procedure trong schema hiện tại. Với mỗi đối tượng, nêu 
tên, bảng liên quan và mục đích chính."
```

### Tóm tắt phản hồi từ AI

| Đối tượng | Tên | Bảng | Mục đích |
|-----------|-----|------|----------|
| Bảng | `users` | - | Lưu thông tin người dùng |
| Bảng | `products` | - | Lưu thông tin sản phẩm |
| Bảng | `coupons` | - | Lưu mã giảm giá |
| Bảng | `orders` | - | Lưu đơn hàng |
| Bảng | `order_items` | - | Chi tiết đơn hàng |
| FK | `orders.user_id` | users | Liên kết đơn hàng với người dùng |
| FK | `order_items.order_id` | orders | Liên kết chi tiết với đơn hàng |
| FK | `order_items.product_id` | products | Liên kết chi tiết với sản phẩm |
| CHECK | `stock >= 0` | products | Ngăn tồn kho âm |
| CHECK | `status IN (...)` | orders | Kiểm tra trạng thái hợp lệ |
| Function | `fn_calculate_discount` | - | Tính giảm giá (có BUG) |
| Trigger | `trg_prevent_negative_stock` | products | Kiểm tra stock âm |

### Cách kiểm chứng

1. **Schema verification**: Chạy `SELECT * FROM information_schema.table_constraints` để kiểm tra các ràng buộc
2. **Function testing**: Gọi hàm với dữ liệu biên và kiểm tra kết quả
3. **Trigger testing**: Thử cập nhật dữ liệu vi phạm ràng buộc
4. **Kết quả**: Đã phát hiện 3 bugs thông qua test tự động

---

## 5. Kết luận và Khuyến nghị

### Kết luận

1. **Phát hiện thành công 3 bugs** thông qua kiểm thử tự động:
   - Lỗi logic trong hàm tính giảm giá (fn_calculate_discount)
   - CHECK constraint không enforce trên UPDATE (cần trigger)
   - Lỗi thiếu atomicity trong stored procedure (sp_process_checkout)

2. **7 khía cạnh kiểm thử đều đã được thực hiện**:
   - Schema/Constraint: UNIQUE hoạt động đúng
   - Function: Phát hiện lỗi logic
   - Trigger: trg_prevent_negative_stock hoạt động đúng
   - Stored Procedure: Phát hiện lỗi atomicity
   - Functional API: CHECK constraint cần trigger để enforce
   - Security: SQL Injection được chống
   - Test Data: Dữ liệu mẫu đầy đủ

3. **Hiệu năng**: Với bảng nhỏ (~200 rows), Seq Scan vẫn tối ưu hơn Index Scan

### Khuyến nghị

1. **Ưu tiên cao**: Sửa ngay BUG-01 (fn_calculate_discount) và BUG-02 (CHECK constraint trigger) vì ảnh hưởng trực tiếp đến nghiệp vụ

2. **Bổ sung trigger**: Tạo trigger `trg_validate_status_transition` để enforce status flow

3. **Bổ sung test cases**:
   - Test với dữ liệu lớn hơn (hàng nghìn bản ghi)
   - Test race condition khi đồng thời cập nhật
   - Test hiệu năng với nhiều index

4. **Code Review**: Thiết lập quy trình review cho mọi thay đổi function/stored procedure

5. **CI/CD**: Tích hợp test suite vào pipeline tự động

---

*Ngày: 27/07/2026*
*Môi trường: Node.js + Jest + PostgreSQL*
