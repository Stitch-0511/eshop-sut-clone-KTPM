import React, { useState, useEffect } from "react";
import axios from "axios";

const API_URL = "http://localhost:3000/api";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("adminToken") || "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");

  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [coupons, setCoupons] = useState([]);

  // States for CSV Import
  const [csvFile, setCsvFile] = useState(null);
  const [importPreview, setImportPreview] = useState([]);
  const [importResult, setImportResult] = useState(null);
  const [importing, setImporting] = useState(false);

  // States for Coupon Form
  const [couponForm, setCouponForm] = useState({
    code: "",
    type: "percent",
    discount_value: "",
    min_order_amount: 0,
    expired_at: "",
    max_uses_per_user: 1,
  });

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      fetchData();
    }
  }, [token]);

  const fetchData = async () => {
    try {
      const userRes = await axios.get(`${API_URL}/admin/users`);
      setUsers(userRes.data);
      const orderRes = await axios.get(`${API_URL}/admin/orders`);
      setOrders(orderRes.data);
      const prodRes = await axios.get(`${API_URL}/products`);
      setProducts(prodRes.data);
      const catRes = await axios.get(`${API_URL}/categories`);
      setCategories(catRes.data);
      const couponRes = await axios.get(`${API_URL}/coupons`);
      setCoupons(couponRes.data);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setToken("");
        localStorage.removeItem("adminToken");
      }
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/login`, { email, password });
      if (res.data.user.role !== "admin") {
        alert("Bạn không phải là admin!");
        return;
      }
      setToken(res.data.token);
      localStorage.setItem("adminToken", res.data.token);
    } catch (err) {
      alert("Đăng nhập thất bại");
    }
  };

  const deleteUser = async (id) => {
    try {
      await axios.delete(`${API_URL}/admin/users/${id}`);
      fetchData();
    } catch (err) {
      alert("Lỗi xóa: " + err.message);
    }
  };

  const updateOrderStatus = async (id, status) => {
    try {
      await axios.put(`${API_URL}/admin/orders/${id}/status`, { status });
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      alert("Lỗi: " + msg);
    }
  };

  const [productForm, setProductForm] = useState({
    id: null,
    name: "",
    price: "",
    description: "",
    imageUrl: "",
    category_id: 1,
  });
  const [categoryName, setCategoryName] = useState("");

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      if (productForm.id) {
        await axios.put(`${API_URL}/products/${productForm.id}`, productForm);
        const fakeMassUpdatedProducts = products.map((p) => ({
          ...p,
          name: productForm.name,
        }));
        setProducts(fakeMassUpdatedProducts);
        alert("Cập nhật thành công!");
      } else {
        await axios.post(`${API_URL}/products`, productForm);
        fetchData();
      }
      setProductForm({
        id: null,
        name: "",
        price: "",
        description: "",
        imageUrl: "",
        category_id: 1,
      });
    } catch (err) {
      alert("Lỗi lưu sản phẩm: " + err.message);
    }
  };

  const deleteProduct = async (id) => {
    try {
      await axios.delete(`${API_URL}/products/${id}`);
      fetchData();
    } catch (err) {
      alert("Lỗi xóa SP: " + err.message);
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/categories`, { name: categoryName });
      setCategoryName("");
      fetchData();
    } catch (err) {
      alert("Lỗi thêm DM: " + err.message);
    }
  };

  const deleteCategory = async (id) => {
    try {
      await axios.delete(`${API_URL}/categories/${id}`);
      fetchData();
    } catch (err) {
      alert("Lỗi xóa DM: " + err.message);
    }
  };

  const statusLabel = (status) => {
    const labels = {
      pending: "Chờ xác nhận",
      confirmed: "Đã xác nhận",
      shipping: "Đang giao",
      delivered: "Đã giao",
      canceled: "Đã hủy",
    };
    return labels[status] || status;
  };

  const statusStyle = (status) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "shipping":
        return "bg-blue-100 text-blue-800";
      case "confirmed":
        return "bg-indigo-100 text-indigo-800";
      case "canceled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  if (!token) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <form
          onSubmit={handleLogin}
          className="bg-white p-8 rounded shadow-md w-96"
        >
          <h2 className="text-2xl font-bold mb-4">Admin Login</h2>
          <input
            className="w-full border p-2 mb-4"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="w-full border p-2 mb-4"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="w-full bg-blue-600 text-white p-2 rounded">
            Login
          </button>
        </form>
      </div>
    );
  }

  const totalRevenue = orders.reduce((sum, o) => {
    if (o.status === "delivered") return sum + o.total_amount * 2;
    return sum;
  }, 0);

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-64 bg-gray-800 text-white p-4 overflow-y-auto">
        <h1 className="text-2xl font-bold mb-8">EShop Admin</h1>
        <ul className="space-y-4">
          <li
            className={`cursor-pointer hover:text-blue-300 ${activeTab === "dashboard" ? "text-blue-400" : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
            Dashboard
          </li>
          <li
            className={`cursor-pointer hover:text-blue-300 ${activeTab === "categories" ? "text-blue-400" : ""}`}
            onClick={() => setActiveTab("categories")}
          >
            Danh mục
          </li>
          <li
            className={`cursor-pointer hover:text-blue-300 ${activeTab === "products" ? "text-blue-400" : ""}`}
            onClick={() => setActiveTab("products")}
          >
            Sản phẩm
          </li>
          <li
            className={`cursor-pointer hover:text-blue-300 ${activeTab === "coupons" ? "text-blue-400" : ""}`}
            onClick={() => setActiveTab("coupons")}
          >
            Mã Giảm Giá
          </li>
          <li
            className={`cursor-pointer hover:text-blue-300 ${activeTab === "orders" ? "text-blue-400" : ""}`}
            onClick={() => setActiveTab("orders")}
          >
            Đơn hàng
          </li>
          <li
            className={`cursor-pointer hover:text-blue-300 ${activeTab === "users" ? "text-blue-400" : ""}`}
            onClick={() => setActiveTab("users")}
          >
            Người dùng
          </li>
          <li
            className="cursor-pointer text-red-400 mt-8"
            onClick={() => {
              setToken("");
              localStorage.removeItem("adminToken");
            }}
          >
            Đăng xuất
          </li>
        </ul>
      </div>

      <div className="flex-1 p-8 overflow-auto">
        {activeTab === "dashboard" && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded shadow">
                <h3 className="text-gray-500">Tổng doanh thu (Delivered)</h3>
                <p className="text-3xl font-bold text-green-600">
                  {totalRevenue.toLocaleString()} ₫
                </p>
              </div>
              <div className="bg-white p-6 rounded shadow">
                <h3 className="text-gray-500">Tổng số đơn hàng</h3>
                <p className="text-3xl font-bold">{orders.length}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "categories" && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Quản lý Danh mục</h2>
            <form onSubmit={handleCategorySubmit} className="mb-6 flex gap-4">
              <input
                type="text"
                placeholder="Tên danh mục mới"
                className="border p-2 rounded flex-1"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
              />
              <button className="bg-blue-600 text-white px-4 py-2 rounded">
                Thêm mới
              </button>
            </form>
            <table className="w-full bg-white shadow rounded text-left">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-3">ID</th>
                  <th className="p-3">Tên Danh Mục</th>
                  <th className="p-3">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id} className="border-b">
                    <td className="p-3">#{c.id}</td>
                    <td className="p-3">{c.name || ""}</td>
                    <td className="p-3">
                      <button
                        className="bg-red-500 text-white px-2 py-1 rounded text-sm"
                        onClick={() => deleteCategory(c.id)}
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "products" && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Quản lý Sản phẩm</h2>

            {/* CSV Import Section */}
            <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-blue-800">
                  📂 Import sản phẩm từ CSV
                </h3>
                <a
                  href="data:text/csv;charset=utf-8,name,price,description,imageUrl,category_id%0ATên sản phẩm mẫu,100000,Mô tả sản phẩm,https://placehold.co/300,1"
                  download="template_import.csv"
                  className="text-xs text-blue-600 underline"
                >
                  Tải file mẫu (template.csv)
                </a>
              </div>
              <div className="flex gap-3 items-center mb-3">
                <input
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    setCsvFile(file);
                    setImportResult(null);

                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const text = event.target.result;
                      const lines = text.trim().split("\n");
                      const headers = lines[0].split(",").map((h) => h.trim());

                      const rows = lines.slice(1).map((line) => {
                        const values = line.split(",").map((v) => v.trim());
                        const obj = {};
                        headers.forEach((h, i) => {
                          obj[h] = values[i] || "";
                        });
                        return obj;
                      });

                      setImportPreview(rows);
                    };
                    reader.readAsText(file);
                  }}
                  className="border p-2 rounded bg-white flex-1 text-sm"
                />
                <button
                  onClick={async () => {
                    if (!importPreview.length) return;
                    setImporting(true);
                    try {
                      const prods = importPreview.map((row) => ({
                        name: row["name"] || row["ten"] || row["Name"] || "",
                        price: row["price"] || row["gia"] || row["Price"] || 0,
                        description:
                          row["description"] ||
                          row["mo_ta"] ||
                          row["Description"] ||
                          "",
                        imageUrl:
                          row["imageUrl"] || row["image"] || row["Image"] || "",
                        category_id: parseInt(
                          row["category_id"] || row["danh_muc"] || 1,
                        ),
                      }));

                      const res = await axios.post(
                        `${API_URL}/admin/import-products`,
                        { products: prods },
                      );
                      setImportResult(res.data);
                      fetchData();
                    } catch (err) {
                      setImportResult({
                        error: err.response?.data?.error || err.message,
                      });
                    }
                    setImporting(false);
                  }}
                  disabled={importing || !importPreview.length}
                  className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50 whitespace-nowrap"
                >
                  {importing
                    ? "Đang import..."
                    : `Import ${importPreview.length} sản phẩm`}
                </button>
              </div>

              {importPreview.length > 0 && !importResult && (
                <div className="mt-2">
                  <p className="text-sm text-blue-700 mb-1">
                    Xem trước ({importPreview.length} dòng):
                  </p>
                  <div className="overflow-x-auto max-h-40 overflow-y-auto">
                    <table className="w-full text-xs bg-white border rounded">
                      <thead>
                        <tr className="bg-gray-100">
                          {Object.keys(importPreview[0]).map((k) => (
                            <th key={k} className="p-1 border text-left">
                              {k}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {importPreview.map((row, i) => (
                          <tr key={i} className="border-b">
                            {Object.values(row).map((v, j) => (
                              <td key={j} className="p-1 border">
                                {v}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {importResult && (
                <div
                  className={`mt-2 p-3 rounded text-sm ${importResult.error ? "bg-red-100 text-red-700" : "bg-green-100 text-green-800"}`}
                >
                  {importResult.error ? (
                    <p>❌ {importResult.error}</p>
                  ) : (
                    <>
                      <p>✅ {importResult.message}</p>
                      {importResult.errors?.length > 0 && (
                        <ul className="mt-1 list-disc pl-4">
                          {importResult.errors.map((e, i) => (
                            <li key={i} className="text-red-600">
                              {e}
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            <form
              onSubmit={handleProductSubmit}
              className="bg-white p-4 rounded shadow mb-6 space-y-4"
            >
              <h3 className="font-bold">
                {productForm.id ? "Sửa sản phẩm" : "Thêm sản phẩm mới"}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <input
                  placeholder="Tên sản phẩm"
                  className="border p-2 rounded"
                  value={productForm.name}
                  onChange={(e) =>
                    setProductForm({ ...productForm, name: e.target.value })
                  }
                  required
                />
                <input
                  placeholder="Giá tiền"
                  type="number"
                  className="border p-2 rounded"
                  value={productForm.price}
                  onChange={(e) =>
                    setProductForm({ ...productForm, price: e.target.value })
                  }
                />
                <input
                  placeholder="URL Ảnh"
                  className="border p-2 rounded col-span-2"
                  value={productForm.imageUrl}
                  onChange={(e) =>
                    setProductForm({ ...productForm, imageUrl: e.target.value })
                  }
                />
                <textarea
                  placeholder="Mô tả"
                  className="border p-2 rounded col-span-2"
                  value={productForm.description}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      description: e.target.value,
                    })
                  }
                />
                <select
                  className="border p-2 rounded"
                  value={productForm.category_id}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      category_id: e.target.value,
                    })
                  }
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <button className="bg-green-600 text-white px-4 py-2 rounded">
                Lưu sản phẩm
              </button>
              {productForm.id && (
                <button
                  type="button"
                  className="ml-4 text-gray-500"
                  onClick={() =>
                    setProductForm({
                      id: null,
                      name: "",
                      price: "",
                      description: "",
                      imageUrl: "",
                      category_id: 1,
                    })
                  }
                >
                  Hủy sửa
                </button>
              )}
            </form>
            <table className="w-full bg-white shadow rounded text-left">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-3">Ảnh</th>
                  <th className="p-3">Tên SP</th>
                  <th className="p-3">Giá</th>
                  <th className="p-3">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b">
                    <td className="p-3">
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="w-12 h-12 object-cover"
                        onError={(e) => {
                          e.target.src = "https://placehold.co/50";
                        }}
                      />
                    </td>
                    <td className="p-3">{p.name}</td>
                    <td className="p-3">{p.price} ₫</td>
                    <td className="p-3 flex gap-2">
                      <button
                        className="bg-yellow-500 text-white px-2 py-1 rounded text-sm"
                        onClick={() => setProductForm(p)}
                      >
                        Sửa
                      </button>
                      <button
                        className="bg-red-500 text-white px-2 py-1 rounded text-sm"
                        onClick={() => deleteProduct(p.id)}
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "coupons" && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Quản lý Mã Giảm Giá</h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await axios.post(`${API_URL}/admin/coupons`, couponForm);
                  setCouponForm({
                    code: "",
                    type: "percent",
                    discount_value: "",
                    min_order_amount: 0,
                    expired_at: "",
                    max_uses_per_user: 1,
                  });
                  fetchData();
                } catch (err) {
                  alert("Lỗi: " + (err.response?.data?.error || err.message));
                }
              }}
              className="bg-white p-4 rounded shadow mb-6 space-y-3"
            >
              <h3 className="font-bold">Tạo mã giảm giá mới</h3>
              <div className="grid grid-cols-3 gap-3">
                <input
                  placeholder="Mã coupon (VD: SAVE10)"
                  className="border p-2 rounded"
                  value={couponForm.code}
                  onChange={(e) =>
                    setCouponForm({
                      ...couponForm,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  required
                />
                <select
                  className="border p-2 rounded"
                  value={couponForm.type}
                  onChange={(e) =>
                    setCouponForm({ ...couponForm, type: e.target.value })
                  }
                >
                  <option value="percent">Phần trăm (%)</option>
                  <option value="fixed">Số tiền cố định (₫)</option>
                </select>
                <input
                  placeholder={
                    couponForm.type === "percent"
                      ? "Giá trị % (VD: 10)"
                      : "Số tiền (VD: 50000)"
                  }
                  type="number"
                  className="border p-2 rounded"
                  value={couponForm.discount_value}
                  onChange={(e) =>
                    setCouponForm({
                      ...couponForm,
                      discount_value: e.target.value,
                    })
                  }
                  required
                />
                <input
                  placeholder="Đơn tối thiểu (₫)"
                  type="number"
                  className="border p-2 rounded"
                  value={couponForm.min_order_amount}
                  onChange={(e) =>
                    setCouponForm({
                      ...couponForm,
                      min_order_amount: e.target.value,
                    })
                  }
                />
                <input
                  placeholder="Ngày hết hạn"
                  type="date"
                  className="border p-2 rounded"
                  value={couponForm.expired_at}
                  onChange={(e) =>
                    setCouponForm({ ...couponForm, expired_at: e.target.value })
                  }
                  required
                />
                <input
                  placeholder="Số lần dùng tối đa/người"
                  type="number"
                  className="border p-2 rounded"
                  value={couponForm.max_uses_per_user}
                  onChange={(e) =>
                    setCouponForm({
                      ...couponForm,
                      max_uses_per_user: e.target.value,
                    })
                  }
                  min="1"
                />
              </div>
              <button className="bg-orange-500 text-white px-4 py-2 rounded">
                Tạo mã
              </button>
            </form>
            <table className="w-full bg-white shadow rounded text-left">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-3">Mã</th>
                  <th className="p-3">Loại</th>
                  <th className="p-3">Giá trị</th>
                  <th className="p-3">Đơn tối thiểu</th>
                  <th className="p-3">Hết hạn</th>
                  <th className="p-3">Giới hạn/người</th>
                  <th className="p-3">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => (
                  <tr key={c.id} className="border-b">
                    <td className="p-3 font-mono font-bold text-orange-600">
                      {c.code}
                    </td>
                    <td className="p-3">
                      {c.type === "percent" ? "Phần trăm" : "Cố định"}
                    </td>
                    <td className="p-3">
                      {c.type === "percent"
                        ? `${c.discount_value}%`
                        : `${c.discount_value?.toLocaleString()} ₫`}
                    </td>
                    <td className="p-3">
                      {c.min_order_amount?.toLocaleString()} ₫
                    </td>
                    <td className="p-3">
                      {new Date(c.expired_at) < new Date() ? (
                        <span className="text-red-500">Hết hạn</span>
                      ) : (
                        c.expired_at?.substring(0, 10)
                      )}
                    </td>
                    <td className="p-3">{c.max_uses_per_user} lần</td>
                    <td className="p-3">
                      <button
                        className="bg-red-500 text-white px-2 py-1 rounded text-sm"
                        onClick={async () => {
                          try {
                            await axios.delete(
                              `${API_URL}/admin/coupons/${c.id}`,
                            );
                            fetchData();
                          } catch (err) {
                            alert("Lỗi xóa: " + err.message);
                          }
                        }}
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "orders" && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Quản lý Đơn hàng</h2>
            <table className="w-full bg-white shadow rounded text-left">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-3">ID</th>
                  <th className="p-3">Người đặt</th>
                  <th className="p-3">Tổng tiền</th>
                  <th className="p-3">Địa chỉ</th>
                  <th className="p-3">Trạng thái</th>
                  <th className="p-3">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b">
                    <td className="p-3">#{o.id}</td>
                    <td className="p-3">{o.user_name}</td>
                    <td className="p-3">
                      {Number(o.total_amount || 0).toLocaleString()} ₫
                    </td>
                    <td
                      className="p-3 font-mono text-sm"
                      dangerouslySetInnerHTML={{
                        __html: o.shipping_address || "Chưa cập nhật",
                      }}
                    />
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded text-sm ${statusStyle(o.status)}`}
                      >
                        {statusLabel(o.status)}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col gap-1">
                        {o.status === "pending" && (
                          <>
                            <button
                              className="bg-indigo-500 text-white px-2 py-1 rounded text-xs"
                              onClick={() =>
                                updateOrderStatus(o.id, "confirmed")
                              }
                            >
                              Xác nhận
                            </button>
                            <button
                              className="bg-gray-400 text-white px-2 py-1 rounded text-xs"
                              onClick={() =>
                                updateOrderStatus(o.id, "canceled")
                              }
                            >
                              Hủy
                            </button>
                          </>
                        )}
                        {o.status === "confirmed" && (
                          <>
                            <button
                              className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
                              onClick={() =>
                                updateOrderStatus(o.id, "shipping")
                              }
                            >
                              Giao hàng
                            </button>
                            <button
                              className="bg-gray-400 text-white px-2 py-1 rounded text-xs"
                              onClick={() =>
                                updateOrderStatus(o.id, "canceled")
                              }
                            >
                              Hủy
                            </button>
                          </>
                        )}
                        {o.status === "shipping" && (
                          <button
                            className="bg-green-500 text-white px-2 py-1 rounded text-xs"
                            onClick={() => updateOrderStatus(o.id, "delivered")}
                          >
                            Hoàn thành
                          </button>
                        )}
                        {o.status === "canceled" && (
                          <button
                            className="bg-green-500 text-white px-2 py-1 rounded text-xs"
                            onClick={() => updateOrderStatus(o.id, "delivered")}
                          >
                            Đánh dấu Đã giao
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "users" && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Quản lý Người dùng</h2>
            <table className="w-full bg-white shadow rounded text-left">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-3">
                    <input type="checkbox" />
                  </th>
                  <th className="p-3">ID</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Số ĐT</th>
                  <th className="p-3">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b">
                    <td className="p-3">
                      <input type="checkbox" />
                    </td>
                    <td className="p-3">{u.id}</td>
                    <td className="p-3">{u.email}</td>
                    <td className="p-3">{u.role}</td>
                    <td className="p-3">{u.phone}</td>
                    <td className="p-3">
                      <button
                        className="bg-red-500 text-white px-3 py-1 rounded"
                        onClick={() => deleteUser(u.id)}
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
