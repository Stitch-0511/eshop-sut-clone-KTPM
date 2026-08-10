# Test Design - Mini Exercise API Testing

## 1. Prompt Used

> "Tao bo 5 test case danh cho API GET /api/products cua du an eshop-sut. Bao gom: lay danh sach mac dinh, tim kiem san pham ton tai, tim kiem san pham khong ton tai, phan trang, va kiem tra SQL Injection. Moi test case can chi dinh expected_status code."

---

## 2. Audit 12 Test Cases

| # | Test Case | Label | Ghi chu |
|---|-----------|-------|---------|
| 1 | GET /api/products (mac dinh) | VALID | Happy path - lay danh sach san pham |
| 2 | GET /api/products?search=iPhone | VALID | Tim kiem san pham ton tai |
| 3 | GET /api/products?search=nonexistingproduct123 | VALID | Tim kiem tra ve trong |
| 4 | GET /api/products?page=1&limit=2 | VALID | Phan trang co ban |
| 5 | GET /api/products?search=' OR '1'='1 | VALID | SQL Injection test |
| 6 | GET /api/products/:id (id ton tai) | INCOMPLETE | Chua test - can parameterized URL |
| 7 | GET /api/products/:id (id khong ton tai) | INCOMPLETE | Chua test truong hop 404 hoac tra ve {} |
| 8 | GET /api/products?search= (empty search) | INCOMPLETE | Chua test search trong |
| 9 | GET /api/products?page=0&limit=-1 | INVALID | Thieu validation input tren server |
| 10 | GET /api/products (sai HTTP method POST) | INCOMPLETE | Chua test method khong ho tro |
| 11 | GET /api/products?search=<script>alert(1)</script> | INCOMPLETE | Chua test XSS injection |
| 12 | GET /api/products (khong co header X-Student-Id) | INCOMPLETE | API public nen pass nhung can log |

### Giai thich nhan

- **VALID**: Test case hop le, duoc thuc hien trong data-driven file
- **INVALID**: Test case khong hop le hoac server khong validate dung (can fix server-side)
- **INCOMPLETE**: Test case hop ly nhung chua duoc dua vao scope bai tap

---

## 3. Two Additional Test Cases (Self-Written)

### EXT-01: Content-Type Header Check

| Thuoc tinh | Chi tiet |
|------------|----------|
| **Muc dich** | Dam bao API tra ve dung Content-Type: application/json |
| **Test** | `pm.test("Content-Type is application/json", ...)` |
| **Ly do bo sung** | AI chi tap trung kiem tra status code ma bo qua viec xac nhan dinh dang response. Neu API tra ve HTML loi thay vi JSON thi client se crash khi parse. |

### EXT-02: Response Time < 500ms

| Thuoc tinh | Chi tiet |
|------------|----------|
| **Muc dich** | Dam bao API phan hoi trong thoi gian chap nhan duoc |
| **Test** | `pm.test("Response time is less than 500ms", ...)` |
| **Ly do bo sung** | AI khong de cap performance testing. Kiem tra thoi gian phan hoi giup phat hien bottleneck som, dac biet quan trong khi API chay tren server yeu hoac co query cham. |

### Tai sao AI bo qua 2 test cases tren?

AI thuong tap trung vao functional testing (status code, response body) ma bo qua non-functional aspects:
- **Content-Type**: Duoc coi la "implicit" nhung thuc te nhieu API sai header gay ra client-side bugs
- **Response time**: Thuoc performance testing, thuong nam ngoai scope functional test nhung cuc ky quan trong trong production

---

## 4. Postman Features Checklist

| Feature | Co/Khong | Ghi chu |
|---------|----------|---------|
| Collections | Co | File `mini-products.postman_collection.json` |
| Environment Variables | Co | File `mini-local.postman_environment.json` voi baseUrl, studentId |
| Pre-request Scripts | Co | Tu dong them header X-Student-Id |
| Test Scripts | Co | Kiem tra status code, Content-Type, response time |
| Data-driven Runs | Co | File `mini-products.data.json` voi 5 iterations |
| Newman CLI | Co | Lenh `newman run` trong CI workflow |
| Workspaces | Khong | Khong su dung Postman Workspaces (chay CLI) |
| Monitors | Khong | Khong su dung Postman Monitors |
| Mock Servers | Khong | Khong su dung Mock Servers |

---

*Student ID: 23127459*
*Date: 2026-08-10*
