import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { user, token } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [shippingAddress, setShippingAddress] = useState(
    user?.shipping_address || "",
  );
  const [orders, setOrders] = useState([]);

  const fetchOrders = () => {
    if (!token) return;

    axios
      .get("http://localhost:3000/api/orders/my-orders", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data.orders || [];
        setOrders(data);
      })
      .catch((err) => {
        console.error("Lỗi lấy đơn hàng:", err);
        setOrders([]);
      });
  };

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone || "");
      setShippingAddress(user.shipping_address || "");
    }
    fetchOrders();
  }, [user, token]);

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!/^[1-9][0-9]{8,9}$/.test(phone)) {
      alert("Số điện thoại không hợp lệ. Vui lòng nhập đúng 9-10 chữ số.");
      return;
    }

    try {
      await axios.put(
        "http://localhost:3000/api/users/me",
        {
          name,
          phone,
          shipping_address: shippingAddress,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      alert("Cập nhật thành công!");
    } catch (err) {
      alert("Lỗi cập nhật");
    }
  };

  const cancelOrder = async (orderId) => {
    try {
      await axios.put(
        `http://localhost:3000/api/orders/${orderId}/cancel`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      alert("Hủy đơn thành công!");
      fetchOrders();
    } catch (err) {
      alert("Lỗi: " + (err.response?.data?.error || err.message));
    }
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

  const statusLabel = (status) => {
    const labels = {
      pending: "Chờ xác nhận",
      confirmed: "Đã xác nhận",
      shipping: "Đang giao",
      delivered: "Đã giao",
      canceled: "Đã hủy",
    };
    return labels[status] || status.toUpperCase();
  };

  if (!user) return <div className="text-center mt-10">Vui lòng đăng nhập</div>;

  return (
    <div className="flex flex-col md:flex-row gap-8">
      <div className="w-full md:w-1/3 bg-white p-6 border rounded shadow-sm">
        <h2 className="text-2xl font-bold mb-4">Hồ sơ của bạn</h2>
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-1">
              Email (Không đổi)
            </label>
            <input
              type="text"
              value={user.email}
              disabled
              className="w-full border p-2 rounded bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Họ Tên</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border p-2 rounded"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Số điện thoại</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border p-2 rounded"
              placeholder="VD: 0912345678"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">
              Địa chỉ giao hàng
            </label>
            <textarea
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              className="w-full border p-2 rounded h-24"
              placeholder="Nhập địa chỉ của bạn"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded"
          >
            Cập nhật
          </button>
        </form>
      </div>

      <div className="w-full md:w-2/3 bg-white p-6 border rounded shadow-sm">
        <h2 className="text-2xl font-bold mb-4">Lịch sử đơn hàng</h2>
        {orders.length === 0 ? (
          <p>Bạn chưa có đơn hàng nào.</p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="p-2">Mã ĐH</th>
                <th className="p-2">Ngày đặt</th>
                <th className="p-2">Tổng tiền</th>
                <th className="p-2">Trạng thái</th>
                <th className="p-2">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b">
                  <td className="p-2 font-mono">#{o.id}</td>
                  <td className="p-2">
                    {new Date(o.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-2 text-red-600 font-bold">
                    {Number(o.total_amount || 0).toLocaleString()} ₫
                  </td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-1 rounded text-sm ${statusStyle(o.status)}`}
                    >
                      {statusLabel(o.status)}
                    </span>
                  </td>
                  <td className="p-2">
                    {/* Nút hủy hiển thị khi chưa giao xong và chưa hủy (kể cả khi đang giao) */}
                    {o.status !== "delivered" && o.status !== "canceled" && (
                      <button
                        onClick={() => cancelOrder(o.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs"
                      >
                        Hủy đơn
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
