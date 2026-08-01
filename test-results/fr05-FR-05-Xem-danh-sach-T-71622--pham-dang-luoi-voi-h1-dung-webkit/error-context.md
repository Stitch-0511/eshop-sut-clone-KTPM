# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: fr05.spec.ts >> FR-05: Xem danh sach & Tim kiem san pham >> FR05-TC001 - Trang chu hien thi danh sach san pham dang luoi voi h1 dung
- Location: tests\fr05.spec.ts:26:9

# Error details

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  locator('h1')
Expected: 1
Received: 2
Timeout:  5000ms

Call log:
  - Expect "toHaveCount" with timeout 5000ms
  - waiting for locator('h1')
    14 × locator resolved to 2 elements
       - unexpected value "2"

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - link "EShop" [ref=e5]:
      - /url: /
    - navigation [ref=e6]:
      - link "Giỏ hàng" [ref=e7]:
        - /url: /cart
      - link "Đăng nhập" [ref=e8]:
        - /url: /login
      - link "Đăng ký" [ref=e9]:
        - /url: /register
  - main [ref=e10]:
    - generic [ref=e11]:
      - generic [ref=e12]:
        - heading "Danh sách sản phẩm" [level=1] [ref=e13]
        - generic [ref=e14]:
          - textbox "Tìm kiếm..." [ref=e15]
          - button "Tìm" [ref=e16] [cursor=pointer]
      - generic [ref=e17]:
        - generic [ref=e18]:
          - heading "iPhone 15 Pro Max" [level=2] [ref=e19]
          - paragraph [ref=e20]: 30,000,000 VND
          - generic [ref=e21]:
            - link "Xem chi tiết" [ref=e22]:
              - /url: /product/1
            - button "Thêm vào giỏ" [ref=e23] [cursor=pointer]
        - generic [ref=e24]:
          - heading "Samsung Galaxy S24 Ultra" [level=2] [ref=e25]
          - paragraph [ref=e26]: 28,000,000 VND
          - generic [ref=e27]:
            - link "Xem chi tiết" [ref=e28]:
              - /url: /product/2
            - button "Thêm vào giỏ" [ref=e29] [cursor=pointer]
        - generic [ref=e30]:
          - heading "MacBook Pro M3" [level=2] [ref=e31]
          - paragraph [ref=e32]: 45,000,000 VND
          - generic [ref=e33]:
            - link "Xem chi tiết" [ref=e34]:
              - /url: /product/3
            - button "Thêm vào giỏ" [ref=e35] [cursor=pointer]
        - generic [ref=e36]:
          - heading "Tai nghe AirPods Pro 2" [level=2] [ref=e37]
          - paragraph [ref=e38]: 6,000,000 VND
          - generic [ref=e39]:
            - link "Xem chi tiết" [ref=e40]:
              - /url: /product/4
            - button "Thêm vào giỏ" [ref=e41] [cursor=pointer]
        - generic [ref=e42]:
          - heading "Bàn phím cơ Keychron Q1" [level=2] [ref=e43]
          - paragraph [ref=e44]: 4,000,000 VND
          - generic [ref=e45]:
            - link "Xem chi tiết" [ref=e46]:
              - /url: /product/5
            - button "Thêm vào giỏ" [ref=e47] [cursor=pointer]
      - heading "Hiển thị 5 sản phẩm" [level=1] [ref=e48]
  - contentinfo [ref=e49]: © 2026 EShop SUT. Dành cho mục đích kiểm thử.
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | import fs from "fs";
  3  | import path from "path";
  4  | 
  5  | interface TestData {
  6  |   id: string;
  7  |   action: string;
  8  |   description: string;
  9  |   expectedH1Count?: number;
  10 |   expectedH1Text?: string;
  11 |   expectedGridVisible?: boolean;
  12 |   expectedMinProducts?: number;
  13 |   expectedPriceFormat?: string;
  14 |   searchTerm?: string;
  15 |   expectedResultsVisible?: boolean;
  16 |   expectedEmptyResults?: boolean;
  17 |   expectedNoAlert?: boolean;
  18 | }
  19 | 
  20 | const rawData: TestData[] = JSON.parse(
  21 |   fs.readFileSync(path.join(__dirname, "../test-data/fr05-data.json"), "utf-8")
  22 | );
  23 | 
  24 | test.describe("FR-05: Xem danh sach & Tim kiem san pham", () => {
  25 |   for (const tc of rawData) {
  26 |     test(`${tc.id} - ${tc.description}`, async ({ page }) => {
  27 |       await page.goto("/");
  28 |       await page.waitForLoadState("networkidle");
  29 | 
  30 |       switch (tc.action) {
  31 |         case "verifyPageLoad": {
  32 |           const h1 = page.locator("h1");
  33 |           await expect(h1.first()).toBeVisible();
  34 |           await expect(h1.first()).toHaveText(tc.expectedH1Text!);
> 35 |           await expect(h1).toHaveCount(tc.expectedH1Count!);
     |                            ^ Error: expect(locator).toHaveCount(expected) failed
  36 |           const grid = page.locator(".grid");
  37 |           await expect(grid).toBeVisible();
  38 |           break;
  39 |         }
  40 | 
  41 |         case "verifyProductCard": {
  42 |           const cards = page.locator(".grid > div");
  43 |           await expect(cards.first()).toBeVisible({ timeout: 10000 });
  44 |           const count = await cards.count();
  45 |           expect(count).toBeGreaterThanOrEqual(tc.expectedMinProducts!);
  46 |           for (let i = 0; i < count; i++) {
  47 |             const img = cards.nth(i).locator("img");
  48 |             await expect(img).toBeVisible();
  49 |             const alt = await img.getAttribute("alt");
  50 |             expect(alt).not.toBeNull();
  51 |             const name = cards.nth(i).locator("h2");
  52 |             await expect(name).toBeVisible();
  53 |             const price = cards.nth(i).locator("p.text-red-500");
  54 |             await expect(price).toBeVisible();
  55 |             const priceText = await price.textContent();
  56 |             expect(priceText).toContain(tc.expectedPriceFormat!);
  57 |           }
  58 |           break;
  59 |         }
  60 | 
  61 |         case "searchProduct": {
  62 |           const input = page.locator('input[placeholder="Tìm kiếm..."]');
  63 |           await expect(input).toBeVisible();
  64 |           await input.fill(tc.searchTerm!);
  65 |           await page.locator('button:has-text("Tìm")').click();
  66 |           await page.waitForLoadState("networkidle");
  67 |           await page.waitForTimeout(500);
  68 | 
  69 |           if (tc.expectedResultsVisible) {
  70 |             await expect(page.locator("text=Kết quả tìm kiếm cho")).toBeVisible();
  71 |           }
  72 |           if (tc.expectedEmptyResults) {
  73 |             const cards = page.locator(".grid > div");
  74 |             await expect(cards).toHaveCount(0);
  75 |           }
  76 |           break;
  77 |         }
  78 | 
  79 |         case "verifyXSS": {
  80 |           let alertTriggered = false;
  81 |           page.on("dialog", async (d) => {
  82 |             alertTriggered = true;
  83 |             await d.dismiss();
  84 |           });
  85 |           const input = page.locator('input[placeholder="Tìm kiếm..."]');
  86 |           await input.fill(tc.searchTerm!);
  87 |           await page.locator('button:has-text("Tìm")').click();
  88 |           await page.waitForLoadState("networkidle");
  89 |           await page.waitForTimeout(2000);
  90 |           expect(alertTriggered).toBe(tc.expectedNoAlert ? false : true);
  91 |           break;
  92 |         }
  93 |       }
  94 |     });
  95 |   }
  96 | });
  97 | 
```