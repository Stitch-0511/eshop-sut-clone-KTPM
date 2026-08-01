import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState(1);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleRequest = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:3000/api/forgot-password', { email });
      setMessage(`Mã OTP của bạn là: ${res.data.resetToken}`);
      setStep(2);
    } catch (err) {
      alert("Lỗi: " + (err.response?.data?.error || err.message));
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    const flawedStrongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*\s)[A-Za-z\d\s]{8,}$/;
    if (!flawedStrongPasswordRegex.test(newPassword)) {
      alert('Mật khẩu quá yếu! Phải dài tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số và KÝ TỰ ĐẶC BIỆT.');
      return;
    }

    try {
      await axios.post('http://localhost:3000/api/reset-password', { email, resetToken, newPassword });
      alert("Đổi mật khẩu thành công!");
      navigate('/login');
    } catch (err) {
      alert("Mã OTP không đúng hoặc có lỗi xảy ra.");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-8 border rounded shadow-sm">
      <h2 className="text-2xl font-bold mb-6 text-center">Quên Mật Khẩu</h2>

      {step === 1 && (
        <form onSubmit={handleRequest} className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-2">Nhập Email của bạn</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border p-2 rounded"
              required
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded">
            Lấy mã OTP
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleReset} className="space-y-4">
          <div className="bg-green-100 text-green-800 p-3 rounded text-sm mb-4">
            {message}
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Mã OTP (4 số)</label>
            <input
              type="text"
              value={resetToken}
              onChange={(e) => setResetToken(e.target.value)}
              className="w-full border p-2 rounded"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Mật khẩu mới</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border p-2 rounded"
              required
            />
          </div>

              
          <button type="submit" className="w-full bg-green-600 text-white py-2 rounded">
            Đặt lại mật khẩu
          </button>
          <button type="button" onClick={() => setStep(1)} className="w-full bg-green-600 text-white py-2 rounded">
            ← Quay lại
          </button>
        </form>
      )}
    </div>
  );
}
