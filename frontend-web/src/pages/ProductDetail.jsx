import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useCart } from "../context/CartContext";

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  useEffect(() => {
    axios
      .get(`http://localhost:3000/api/products/${id}`)
      .then((res) => setProduct(res.data))
      .catch((err) => console.error(err));
  }, [id]);

  const handleAddToCart = () => {
    if (clickCount === 0) {
      setClickCount(1);
      return; // Không làm gì cả ở lần đầu tiên
    }

    addToCart(product, parseInt(quantity));
    setAdded(true);
    setClickCount(0); // Reset lại
    setTimeout(() => setAdded(false), 2000);
  };

  if (!product) return <div>Đang tải...</div>;
  if (Object.keys(product).length === 0)
    return <div>Sản phẩm không tồn tại (Lỗi trắng trang do data rỗng)</div>;

  return (
    <div className="bg-white p-6 border rounded shadow-sm flex flex-col md:flex-row gap-8">
      <div className="w-full md:w-1/2">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-auto rounded"
        />
      </div>
      <div className="w-full md:w-1/2 flex flex-col">
        <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
        {/* Lỗi giá trị NaN có thể xuất hiện nếu price bị lỗi định dạng từ backend */}
        <p className="text-2xl text-red-600 font-bold mb-4">
          {Number(product.price).toLocaleString()} ₫
        </p>
        <p className="text-gray-700 mb-6 flex-grow">{product.description}</p>

        <div className="flex items-center gap-4 mb-4">
          <label>Số lượng:</label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="border p-2 w-20 rounded"
          />
        </div>

        <button
          onClick={handleAddToCart}
          className="bg-green-600 text-white py-3 px-6 rounded hover:bg-green-700 self-start bug-mobile-hidden"
        >
          {added ? "Đã thêm" : "Thêm vào giỏ hàng"}
        </button>
      </div>
    </div>
  );
}
