-- ============================================================
-- PERFORMANCE ANALYSIS - EXPLAIN ANALYZE (PostgreSQL)
-- Phân tích hiệu năng trước và sau khi tạo Index
-- Database: eshop_test
-- ============================================================

-- ============================================================
-- PHẦN 1: Đo hiệu năng TRƯỚC KHI tạo Index
-- ============================================================

-- 1.1. Truy vấn tổng hợp: Tổng final_amount theo user_id
EXPLAIN (ANALYZE, BUFFERS)
SELECT user_id, SUM(final_amount) AS total_spent
FROM orders
GROUP BY user_id
ORDER BY total_spent DESC;

-- 1.2. Đánh giá kết quả trước index:
-- Với ~200 bản ghi, PostgreSQL thường chọn Seq Scan (đọc toàn bộ bảng)
-- vì chi phí Seq Scan thấp hơn Index Scan cho bảng nhỏ.
-- Expected: Seq Scan on orders, cost=0.00..3.50, rows=200
-- Execution Time: ~0.5-2ms (tùy phần cứng)
-- Buffers: shared hit ~8-16 (đọc toàn bộ data pages)

-- ============================================================
-- PHẦN 2: Tạo Index và cập nhật thống kê
-- ============================================================

-- 2.1. Tạo Index trên cột user_id
CREATE INDEX idx_orders_user_id ON orders(user_id);

-- 2.2. Cập nhật thống kê cho Planner
ANALYZE orders;

-- ============================================================
-- PHẦN 3: Đo hiệu năng SAU KHI tạo Index
-- ============================================================

-- 3.1. Truy vấn lại cùng câu query
EXPLAIN (ANALYZE, BUFFERS)
SELECT user_id, SUM(final_amount) AS total_spent
FROM orders
GROUP BY user_id
ORDER BY total_spent DESC;

-- 3.2. Đánh giá kết quả sau index:
-- Với ~200 bản ghi, Planner CÓ THỂ VẪN chọn Seq Scan vì:
-- - Bảng quá nhỏ, Index Scan không tối ưu hơn
-- - Chi phí random I/O của Index cao hơn sequential I/O
-- - Planner dựa vào thống kê (statistics) để quyết định
--
-- Nếu Planner chọn Index Scan:
-- - Execution Time có thể tăng nhẹ do random I/O
-- - Buffers: shared hit tăng (đọc index pages + data pages)
--
-- Nếu Planner vẫn chọn Seq Scan (đúng预期 với bảng nhỏ):
-- - Execution Time: tương đương hoặc chậm hơn nhẹ
-- - Buffers: tương đương

-- ============================================================
-- PHẦN 4: Truy vấn bổ sung để kiểm tra Index
-- ============================================================

-- 4.1. Truy vấn lọc theo user_id cụ thể (Index hữu ích hơn)
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM orders WHERE user_id = 1;

-- 4.2. Truy vấn tổng hợp với điều kiện
EXPLAIN (ANALYZE, BUFFERS)
SELECT user_id, COUNT(*) AS order_count, AVG(final_amount) AS avg_amount
FROM orders
WHERE user_id IN (1, 2, 3)
GROUP BY user_id;

-- ============================================================
-- PHẦN 5: Nhận xét về PostgreSQL Planner
-- ============================================================

/*
NHẬN XÉT VỀ POSTGRESQL PLANNER:

1. Với bảng orders có ~200 bản ghi:
   - PostgreSQL Planner thường CHỌN Seq Scan thay vì Index Scan
   - Lý do: Bảng quá nhỏ, chi phí đọc toàn bộ (sequential I/O)
     thấp hơn chi phí đọc ngẫu nhiên qua Index (random I/O)

2. Planner dựa vào:
   - Thống kê (statistics) trong pg_statistic
   - Cost model (seq_page_cost, random_page_cost)
   - Dự kiến số dòng trả về (estimated rows)

3. Index sẽ HỮU ÍCH hơn khi:
   - Bảng có hàng nghìn hoặc hàng triệu bản ghi
   - Truy vấn lọc theo một phần nhỏ dữ liệu (selectivity thấp)
   - Cần truy cập ngẫu nhiên nhiều bản ghi

4. Trong trường hợp này (~200 rows):
   - Seq Scan là LỰA CHỌN HỢP LÝ của Planner
   - Tạo Index không cải thiện hiệu năng đáng kể
   - Execution Time có thể GIẢM NHẸ hoặc TĂNG NHẸ tùy truy vấn

5. Kết luận:
   - Không phải lúc nào cũng tạo Index là tốt
   - Cần dựa vào EXPLAIN ANALYZE thực tế để quyết định
   - Với bảng nhỏ, Planner thông minh hơn ta tưởng
*/
