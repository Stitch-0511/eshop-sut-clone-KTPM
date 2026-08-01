import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function Cart() {
  const { cart, removeFromCart, cartTotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (!user) {
      alert("Bạn cần đăng nhập để thanh toán!");
      navigate('/login');
      return;
    }
    navigate('/checkout');
  };

  if (cart.length === 0) {
    return (
      <div className="text-center mt-10">
        <h2 className="text-2xl mb-4">Giỏ hàng của bạn đang trống</h2>
        <Link to="/" className="text-blue-600 hover:underline">Tiếp tục mua sắm</Link>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 border rounded shadow-sm">
      <h2 className="text-2xl font-bold mb-6">Giỏ Hàng</h2>
      <table className="w-full text-left mb-6">
        <thead>
          <tr className="border-b">
            <th className="py-2">Sản phẩm</th>
            <th className="py-2">Giá</th>
            <th className="py-2">Số lượng</th>
            <th className="py-2">Thành tiền</th>
            <th className="py-2">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {cart.map((item, index) => (
            <tr key={index} className="border-b">
              <td className="py-4">{item.name}</td>
              <td>{Number(item.price).toLocaleString()} ₫</td>
              <td>{item.quantity}</td>
              <td>{(Number(item.price) * item.quantity).toLocaleString()} ₫</td>
              <td>
                <button
                  onClick={() => removeFromCart(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  Xóa
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex justify-between items-center">
        <div className="text-xl font-bold">
          Tổng tạm tính: <span className="text-red-600">{cartTotal.toLocaleString()} ₫</span>
        </div>
        <div className="flex gap-3">
          <Link to="/" className="border px-4 py-2 rounded text-gray-600 hover:bg-gray-50">
            ← Mua tiếp
          </Link>
          <button
            onClick={handleCheckout}
            className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600"
          >
            Tiến hành thanh toán
          </button>
        </div>
      </div>
    </div>
  );
}
