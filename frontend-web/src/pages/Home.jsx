import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useCart } from "../context/CartContext";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [errorHtml, setErrorHtml] = useState("");
  const { addToCart } = useCart();

  const fetchProducts = async (query = "") => {
    try {
      setErrorHtml("");
      const res = await axios.get(
        `http://localhost:3000/api/products?search=${query}`,
      );
      if (typeof res.data === "string" && res.data.includes("<h1>")) {
        setErrorHtml(res.data);
        setProducts([]);
      } else {
        setProducts(res.data);
      }
    } catch (err) {
      if (err.response && typeof err.response.data === "string") {
        setErrorHtml(err.response.data);
      }
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts(search);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Danh sách sản phẩm</h1>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border p-2 rounded"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Tìm
          </button>
        </form>
      </div>

      {search && !errorHtml && (
        <div className="mb-4 text-gray-600">
          Kết quả tìm kiếm cho:{" "}
          <span dangerouslySetInnerHTML={{ __html: search }} />
        </div>
      )}

      {errorHtml ? (
        <div
          className="bg-red-100 p-4 rounded overflow-auto"
          dangerouslySetInnerHTML={{ __html: errorHtml }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {products.map((p) => (
            <div
              key={p.id}
              className="border rounded shadow-sm p-4 flex flex-col bg-white"
            >
              <img
                src={p.imageUrl}
                alt=""
                className="w-full h-48 object-cover mb-4 rounded"
              />
              <h2 className="text-xl font-semibold mb-2 truncate">{p.name}</h2>
              <p className="text-red-500 font-bold mb-2">
                {Number(p.price).toLocaleString()} VND
              </p>
              <div className="mt-auto flex gap-2">
                <Link
                  to={`/product/${p.id}`}
                  className="flex-1 text-center bg-gray-200 py-2 rounded hover:bg-gray-300 text-sm"
                >
                  Xem chi tiết
                </Link>

                <button
                  onClick={() => addToCart({ ...p, quantity: 1 }, 1)}
                  className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 text-sm"
                >
                  Thêm vào giỏ
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {products.length > 0 && (
        <h1 className="text-center text-gray-400 mt-8 text-sm">
          Hiển thị {products.length} sản phẩm
        </h1>
      )}
    </div>
  );
}
