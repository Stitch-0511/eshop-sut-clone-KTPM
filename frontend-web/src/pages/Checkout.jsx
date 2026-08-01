import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function Checkout() {
  const { cart, cartTotal, clearCart } = useCart();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [editableTotal, setEditableTotal] = useState(cartTotal);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponResult, setCouponResult] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponError('');
    setCouponResult(null);
    setApplyingCoupon(true);
    try {
      const res = await axios.post('http://localhost:3000/api/apply-coupon', {
        code: couponCode.trim().toUpperCase(),
        total_amount: editableTotal,
        user_id: user?.id || null
      });
      setCouponResult(res.data);
    } catch (err) {
      setCouponError(err.response?.data?.error || 'Không thể áp dụng mã');
    }
    setApplyingCoupon(false);
  };

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const finalAmount = couponResult ? couponResult.final_amount : editableTotal;

      await axios.post('http://localhost:3000/api/checkout', {
        items: cart,
        total_amount: finalAmount,
        coupon_id: couponResult?.coupon_id || null
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      // Record coupon usage if applied
      if (couponResult?.coupon_id && token) {
        await axios.post('http://localhost:3000/api/coupon-usage',
          { coupon_id: couponResult.coupon_id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      setSuccess(true);
    } catch (err) {
      alert("Lỗi khi thanh toán: " + (err.response?.data?.error || err.message));
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="text-center mt-10">
        <h2 className="text-3xl text-green-600 font-bold mb-4">Thanh toán thành công!</h2>
        <p className="mb-4">Cảm ơn bạn đã mua sắm tại EShop.</p>
        <button onClick={() => navigate('/')} className="text-blue-600 hover:underline">Quay lại trang chủ</button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto bg-white p-6 border rounded shadow-sm">
      <h2 className="text-2xl font-bold mb-6">Xác Nhận Đơn Hàng</h2>

      <div className="mb-6">
        <h3 className="font-semibold mb-2">Sản phẩm:</h3>
        <ul className="list-disc pl-5">
          {cart.map((item, index) => (
            <li key={index}>{item.name} x {item.quantity} — {(item.price * item.quantity).toLocaleString()} ₫</li>
          ))}
        </ul>
      </div>

      <div className="mb-6 flex flex-col gap-2">
        <label className="font-semibold">Tổng tiền thanh toán (VND):</label>
        <input
          type="number"
          value={editableTotal}
          onChange={(e) => {
            setEditableTotal(Number(e.target.value));
            setCouponResult(null);
            setCouponError('');
          }}
          className="border p-2 rounded text-red-600 font-bold"
        />
      </div>

      {/* Coupon Section */}
      <div className="mb-6 p-4 bg-gray-50 border rounded">
        <label className="font-semibold block mb-2">Mã Giảm Giá</label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Nhập mã giảm giá..."
            value={couponCode}
            onChange={e => { setCouponCode(e.target.value); setCouponResult(null); setCouponError(''); }}
            className="flex-1 border p-2 rounded uppercase"
          />
          <button
            onClick={handleApplyCoupon}
            disabled={applyingCoupon || !couponCode.trim()}
            className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 disabled:opacity-50"
          >
            {applyingCoupon ? '...' : 'Áp dụng'}
          </button>
        </div>
        {couponError && (
          <p className="mt-2 text-red-600 text-sm">{couponError}</p>
        )}
        {couponResult && (
          <div className="mt-2 text-green-700 text-sm space-y-1">
            <p>✅ {couponResult.message}</p>
            <p>Tiết kiệm: <strong>{couponResult.discount_amount.toLocaleString()} ₫</strong></p>
            <p>Thành tiền: <strong className="text-lg">{couponResult.final_amount.toLocaleString()} ₫</strong></p>
          </div>
        )}
      </div>

      <div className="mb-4 text-right">
        <span className="font-bold text-xl">
          Tổng thanh toán: {(couponResult ? couponResult.final_amount : editableTotal).toLocaleString()} ₫
        </span>
      </div>

      <button
        onClick={handleCheckout}
        disabled={loading}
        className="w-full bg-green-600 text-white py-3 rounded hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? 'Đang xử lý...' : 'Xác Nhận Thanh Toán'}
      </button>
    </div>
  );
}
