import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";

const API_URL = "http://192.168.10.13:3000/api"; // IP LAN để chạy được trên iOS/Android và thiết bị thật

const formatMoney = (value) => `${Number(value).toLocaleString()} ₫`;

export default function App() {
  const [view, setView] = useState("home");

  // Product / search states
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [errorHtml, setErrorHtml] = useState("");
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState("1");
  const [added, setAdded] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  // Auth states
  const [token, setToken] = useState("");
  const [user, setUser] = useState(null);

  // Login states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Register states
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerError, setRegisterError] = useState("");

  // Forgot password states
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotStep, setForgotStep] = useState(1);
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [forgotMessage, setForgotMessage] = useState("");

  // Profile states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [orders, setOrders] = useState([]);

  // Cart / checkout states
  const [cart, setCart] = useState([]);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [editableTotal, setEditableTotal] = useState(0);
  const [couponCode, setCouponCode] = useState("");
  const [couponResult, setCouponResult] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [cart]);

  const goHome = () => {
    setView("home");
    setCheckoutSuccess(false);
  };

  const fetchProducts = async (query = "") => {
    setLoadingProducts(true);
    try {
      setErrorHtml("");
      const response = await fetch(`${API_URL}/products?search=${query}`);
      const text = await response.text();
      let data = text;
      try {
        data = JSON.parse(text);
      } catch (_) {
        // Giữ nguyên HTML/string lỗi từ backend nếu có.
      }

      if (typeof data === "string" && data.includes("<h1>")) {
        setErrorHtml(data);
        setProducts([]);
      } else {
        setProducts(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      setErrorHtml(String(error.message || error));
    }
    setLoadingProducts(false);
  };

  const handleSearch = () => {
    fetchProducts(search);
  };

  const openProductDetail = async (id) => {
    setProduct(null);
    setQuantity("1");
    setAdded(false);
    setClickCount(0);
    setView("productDetail");
    try {
      const response = await fetch(`${API_URL}/products/${id}`);
      const data = await response.json();
      setProduct(data);
    } catch (error) {
      console.error(error);
      setProduct({});
    }
  };

  const normalizeQuantity = (value) => {
    const parsed = parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  };

  const addToCart = (selectedProduct, selectedQuantity = 1) => {
    const safeQuantity = normalizeQuantity(selectedQuantity);
    const existingIndex = cart.findIndex(
      (item) => item.id === selectedProduct.id,
    );

    if (existingIndex >= 0) {
      const newCart = [...cart];
      newCart[existingIndex] = {
        ...newCart[existingIndex],
        quantity:
          normalizeQuantity(newCart[existingIndex].quantity) + safeQuantity,
      };
      setCart(newCart);
    } else {
      setCart([...cart, { ...selectedProduct, quantity: safeQuantity }]);
    }

    Alert.alert("Thành công", "Đã thêm vào giỏ hàng");
  };

  const removeFromCart = (index) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const logout = () => {
    setToken("");
    setUser(null);
    setName("");
    setPhone("");
    setShippingAddress("");
    setOrders([]);
    goHome();
  };

  const fetchOrders = async (currentToken = token) => {
    if (!currentToken) return;
    try {
      const response = await fetch(`${API_URL}/orders/my-orders`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      const data = await response.json();
      const parsedOrders = Array.isArray(data) ? data : data.orders || [];
      setOrders(parsedOrders);
    } catch (error) {
      console.error("Lỗi lấy đơn hàng:", error);
      setOrders([]);
    }
  };

  const handleLogin = async () => {
    setLoginError("");
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Đăng nhập thất bại.");

      setToken(data.token);
      setUser(data.user);
      setName(data.user?.name || "");
      setPhone(data.user?.phone || "");
      setShippingAddress(data.user?.shipping_address || "");
      fetchOrders(data.token);
      goHome();
    } catch (error) {
      setLoginError("Đăng nhập thất bại. Vui lòng kiểm tra lại.");
    }
  };

  const handleRegister = async () => {
    setRegisterError("");
    const strongPasswordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

    if (!strongPasswordRegex.test(registerPassword)) {
      setRegisterError(
        "Mật khẩu quá yếu! Phải dài tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số và KÝ TỰ ĐẶC BIỆT.",
      );
      return;
    }

    try {
      const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: registerName,
          email: registerEmail,
          password: registerPassword,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Đăng ký thất bại.");
      Alert.alert("Thành công", "Đăng ký tài khoản thành công.");
      setEmail(registerEmail);
      setPassword("");
      setView("login");
    } catch (error) {
      setRegisterError(error.message || "Đăng ký thất bại.");
    }
  };

  const handleForgotPasswordRequest = async () => {
    try {
      const response = await fetch(`${API_URL}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Không lấy được OTP.");
      setForgotMessage(
        "Nếu email tồn tại trong hệ thống, mã OTP đã được gửi đến email của bạn.",
      );
      setForgotStep(2);
    } catch (error) {
      Alert.alert("Lỗi", error.message || "Có lỗi xảy ra.");
    }
  };

  const handleResetPassword = async () => {
    const strongPasswordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
    if (!strongPasswordRegex.test(newPassword)) {
      Alert.alert(
        "Lỗi",
        "Mật khẩu quá yếu! Phải dài tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số và KÝ TỰ ĐẶC BIỆT.",
      );
      return;
    }

    try {
      const response = await fetch(`${API_URL}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail, resetToken, newPassword }),
      });
      if (!response.ok)
        throw new Error("Mã OTP không đúng hoặc có lỗi xảy ra.");
      Alert.alert("Thành công", "Đổi mật khẩu thành công!");
      setView("login");
    } catch (error) {
      Alert.alert("Lỗi", "Mã OTP không đúng hoặc có lỗi xảy ra.");
    }
  };

  const handleUpdateProfile = async () => {
    if (!/^[1-9][0-9]{8,9}$/.test(phone)) {
      Alert.alert(
        "Lỗi",
        "Số điện thoại không hợp lệ. Vui lòng nhập đúng 9-10 chữ số.",
      );
      return;
    }

    try {
      const response = await fetch(`${API_URL}/users/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, phone, shippingAddress }),
      });
      if (!response.ok) throw new Error("Lỗi cập nhật");
      Alert.alert("Thành công", "Cập nhật thành công!");
      setUser({ ...user, name, phone, shipping_address: shippingAddress });
    } catch (error) {
      Alert.alert("Lỗi", "Lỗi cập nhật");
    }
  };

  const cancelOrder = async (orderId) => {
    try {
      const response = await fetch(`${API_URL}/orders/${orderId}/cancel`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Không thể hủy đơn.");
      Alert.alert("Thành công", "Hủy đơn thành công!");
      fetchOrders(token);
    } catch (error) {
      Alert.alert("Lỗi", error.message || "Không thể hủy đơn.");
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
    return labels[status] || String(status).toUpperCase();
  };

  const openCheckout = () => {
    if (!user) {
      Alert.alert("Bạn cần đăng nhập để thanh toán!");
      setView("login");
      return;
    }
    setEditableTotal(cartTotal);
    setCouponCode("");
    setCouponResult(null);
    setCouponError("");
    setCheckoutSuccess(false);
    setView("checkout");
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponError("");
    setCouponResult(null);
    setApplyingCoupon(true);
    try {
      const response = await fetch(`${API_URL}/apply-coupon`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCode.trim().toUpperCase(),
          total_amount: cartTotal,
          user_id: user?.id || null,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Không thể áp dụng mã");
      setCouponResult(data);
    } catch (error) {
      setCouponError(error.message || "Không thể áp dụng mã");
    }
    setApplyingCoupon(false);
  };

  const handleConfirmCheckout = async () => {
    setCheckoutLoading(true);
    try {
      const finalAmount = couponResult ? couponResult.final_amount : cartTotal;
      const response = await fetch(`${API_URL}/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          items: cart.length > 1 ? cart.slice(0, -1) : cart,
          total_amount: finalAmount,
          coupon_id: couponResult?.coupon_id || null,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Lỗi khi thanh toán.");

      if (couponResult?.coupon_id && token) {
        await fetch(`${API_URL}/coupon-usage`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ coupon_id: couponResult.coupon_id }),
        });
      }

      setCheckoutSuccess(true);
      setCart([]);
      setCouponCode("");
      setCouponResult(null);
      setEditableTotal(0);
      fetchOrders(token);
    } catch (error) {
      Alert.alert("Lỗi khi thanh toán", error.message || "Có lỗi xảy ra.");
    }
    setCheckoutLoading(false);
  };

  const renderHeader = () => (
    <View style={styles.navBar}>
      <TouchableOpacity onPress={goHome}>
        <Text style={styles.brand}>EShop Mobile</Text>
      </TouchableOpacity>
      <View style={styles.navLinks}>
        <TouchableOpacity
          onPress={() => (user ? setView("profile") : setView("login"))}
        >
          <Text style={styles.navText}>
            {user ? `Chào, ${user.name}` : "Đăng nhập"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setView("cart")}>
          <Text style={styles.navText}>Giỏ ({cart.length})</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderScreen = (children) => (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      {renderHeader()}
      {children}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          © 2026 EShop SUT. Dành cho mục đích kiểm thử.
        </Text>
      </View>
    </SafeAreaView>
  );

  const renderProduct = ({ item }) => (
    <View style={styles.productCard}>
      <Image
        source={{ uri: item.imageUrl }}
        style={styles.productImage}
        resizeMode="stretch"
      />
      <Text style={styles.productName} numberOfLines={1}>
        {item.name}
      </Text>
      <Text style={styles.productPrice}>{formatMoney(item.price)}</Text>
      <View style={styles.productActions}>
        <TouchableOpacity
          style={[styles.secondaryButton, styles.actionFlex]}
          onPress={() => openProductDetail(item.id)}
        >
          <Text style={styles.secondaryButtonText}>Xem chi tiết</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.actionFlex]}
          onPress={() => addToCart(item, 1)}
        >
          <Text style={styles.buttonText}>Thêm vào giỏ</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderHome = () =>
    renderScreen(
      <View style={styles.container}>
        <View style={styles.searchSection}>
          <Text style={styles.header}>Danh sách sản phẩm</Text>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm..."
              value={search}
              onChangeText={setSearch}
            />
            <TouchableOpacity
              style={styles.searchButton}
              onPress={handleSearch}
            >
              <Text style={styles.buttonText}>Tìm</Text>
            </TouchableOpacity>
          </View>
          {!!search && !errorHtml && (
            <Text style={styles.searchResultText}>
              Kết quả tìm kiếm cho: {search}
            </Text>
          )}
        </View>

        {errorHtml ? (
          <ScrollView style={styles.errorBox}>
            <Text style={styles.errorText}>{errorHtml}</Text>
          </ScrollView>
        ) : (
          <>
            {loadingProducts && (
              <Text style={styles.mutedText}>Đang tải...</Text>
            )}
            <FlatList
              data={products}
              renderItem={renderProduct}
              keyExtractor={(item, index) =>
                item?.id ? item.id.toString() : index.toString()
              }
              contentContainerStyle={styles.productList}
            />
            {products.length > 0 && (
              <Text style={styles.resultCount}>
                Hiển thị {products.length} sản phẩm
              </Text>
            )}
          </>
        )}
      </View>,
    );

  const renderProductDetail = () => {
    if (!product) {
      return renderScreen(
        <View style={styles.padded}>
          <Text>Đang tải...</Text>
        </View>,
      );
    }
    if (Object.keys(product).length === 0) {
      return renderScreen(
        <View style={styles.padded}>
          <Text>Sản phẩm không tồn tại (Lỗi trắng trang do data rỗng)</Text>
        </View>,
      );
    }

    return renderScreen(
      <ScrollView style={styles.padded}>
        <View style={styles.detailCard}>
          <Image
            source={{ uri: product.imageUrl }}
            style={styles.detailImage}
            resizeMode="stretch"
          />
          <Text style={styles.detailName}>{product.name}</Text>
          <Text style={styles.detailPrice}>{formatMoney(product.price)}</Text>
          <Text style={styles.description}>{product.description}</Text>

          <Text style={styles.label}>Số lượng:</Text>
          <TextInput
            style={styles.quantityInput}
            keyboardType="numeric"
            value={quantity}
            onChangeText={setQuantity}
          />

          <TouchableOpacity
            style={styles.greenButton}
            onPress={() => {
              addToCart(product, quantity);
              setAdded(true);
              setClickCount(0);
              setTimeout(() => setAdded(false), 2000);
            }}
          >
            <Text style={styles.buttonText}>
              {added ? "Đã thêm" : "Thêm vào giỏ hàng"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>,
    );
  };

  const renderCart = () =>
    renderScreen(
      <View style={styles.paddedFlex}>
        <Text style={styles.header}>Giỏ Hàng</Text>
        {cart.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>Giỏ hàng của bạn đang trống</Text>
            <TouchableOpacity onPress={goHome}>
              <Text style={styles.linkText}>Tiếp tục mua sắm</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <ScrollView style={styles.cartList}>
              {cart.map((item, index) => (
                <View key={`${item.id}-${index}`} style={styles.cartItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cartProductName}>{item.name}</Text>
                    <Text>Giá: {formatMoney(item.price)}</Text>
                    <View style={styles.inlineRow}>
                      <Text>Số lượng:</Text>
                      <TextInput
                        style={styles.cartQuantityInput}
                        keyboardType="numeric"
                        value={String(item.quantity ?? "")}
                        onChangeText={(text) => {
                          const newCart = [...cart];
                          const parsed = parseInt(text, 10);
                          newCart[index].quantity =
                            Number.isFinite(parsed) && parsed > 0
                              ? parsed + 1
                              : 1;
                          setCart(newCart);
                        }}
                      />
                    </View>
                    <Text>
                      Thành tiền: {formatMoney(item.price * item.quantity)}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => removeFromCart(index)}>
                    <Text style={styles.deleteText}>Xóa</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            <Text style={styles.totalText}>
              Tổng tạm tính: {formatMoney(cartTotal)}
            </Text>
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.grayButton, styles.actionFlex]}
                onPress={goHome}
              >
                <Text style={styles.buttonText}>← Mua tiếp</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.checkoutBtn, styles.actionFlex]}
                onPress={openCheckout}
              >
                <Text style={styles.buttonText}>Tiến hành thanh toán</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>,
    );

  const renderCheckout = () =>
    renderScreen(
      <ScrollView style={styles.padded}>
        {checkoutSuccess ? (
          <View style={styles.successBox}>
            <Text style={styles.successTitle}>Thanh toán thành công!</Text>
            <Text style={styles.centerText}>
              Cảm ơn bạn đã mua sắm tại EShop.
            </Text>
            <TouchableOpacity onPress={goHome}>
              <Text style={styles.linkText}>Quay lại trang chủ</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.checkoutCard}>
            <Text style={styles.header}>Xác Nhận Đơn Hàng</Text>

            <Text style={styles.sectionTitle}>Sản phẩm:</Text>
            {cart.map((item, index) => (
              <Text key={`${item.id}-${index}`} style={styles.orderLine}>
                • {item.name} x {String(item.quantity)} —{" "}
                {formatMoney(item.price * item.quantity)}
              </Text>
            ))}

            <Text style={styles.label}>Tổng tiền thanh toán (VND):</Text>
            <TextInput
              style={[styles.textInput, styles.disabledInput, styles.redInput]}
              keyboardType="numeric"
              value={String(cartTotal)}
              editable={false}
            />

            <View style={styles.couponBox}>
              <Text style={styles.sectionTitle}>Mã Giảm Giá</Text>
              <View style={styles.searchRow}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Nhập mã giảm giá..."
                  value={couponCode}
                  onChangeText={(text) => {
                    setCouponCode(text);
                    setCouponResult(null);
                    setCouponError("");
                  }}
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  style={[
                    styles.orangeButton,
                    (!couponCode.trim() || applyingCoupon) &&
                      styles.disabledButton,
                  ]}
                  disabled={applyingCoupon || !couponCode.trim()}
                  onPress={handleApplyCoupon}
                >
                  <Text style={styles.buttonText}>
                    {applyingCoupon ? "..." : "Áp dụng"}
                  </Text>
                </TouchableOpacity>
              </View>
              {!!couponError && (
                <Text style={styles.errorSmall}>{couponError}</Text>
              )}
              {!!couponResult && (
                <View style={styles.couponResult}>
                  <Text>✅ {couponResult.message}</Text>
                  <Text>
                    Tiết kiệm: {formatMoney(couponResult.discount_amount)}
                  </Text>
                  <Text style={styles.finalAmount}>
                    Thành tiền: {formatMoney(couponResult.final_amount)}
                  </Text>
                </View>
              )}
            </View>

            <Text style={styles.finalTotal}>
              Tổng thanh toán:{" "}
              {formatMoney(
                couponResult ? couponResult.final_amount : cartTotal,
              )}
            </Text>
            <TouchableOpacity
              style={[
                styles.checkoutBtn,
                checkoutLoading && styles.disabledButton,
              ]}
              disabled={checkoutLoading}
              onPress={handleConfirmCheckout}
            >
              <Text style={styles.buttonText}>
                {checkoutLoading ? "Đang xử lý..." : "Xác Nhận Thanh Toán"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>,
    );

  const renderLogin = () =>
    renderScreen(
      <ScrollView contentContainerStyle={styles.formContainer}>
        <Text style={styles.headerCenter}>Đăng Nhập</Text>
        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />
        <Text style={styles.label}>Mật khẩu</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Mật khẩu"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TouchableOpacity onPress={() => setView("forgotPassword")}>
          <Text style={styles.forgotLink}>Quên mật khẩu?</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Sign In</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setView("register")}>
          <Text style={styles.centerSmall}>
            Chưa có tài khoản? <Text style={styles.linkText}>Đăng ký ngay</Text>
          </Text>
        </TouchableOpacity>
        {!!loginError && <Text style={styles.errorBoxText}>{loginError}</Text>}
        <TouchableOpacity style={styles.grayButtonFull} onPress={goHome}>
          <Text style={styles.buttonText}>Quay Lại</Text>
        </TouchableOpacity>
      </ScrollView>,
    );

  const renderRegister = () =>
    renderScreen(
      <ScrollView contentContainerStyle={styles.formContainer}>
        <Text style={styles.headerCenter}>Đăng Ký Tài Khoản</Text>
        {!!registerError && (
          <Text style={styles.errorBoxText}>{registerError}</Text>
        )}
        <Text style={styles.label}>Họ Tên</Text>
        <TextInput
          style={styles.textInput}
          value={registerName}
          onChangeText={setRegisterName}
        />
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.textInput}
          value={registerEmail}
          onChangeText={setRegisterEmail}
          autoCapitalize="none"
        />
        <Text style={styles.label}>Mật khẩu</Text>
        <TextInput
          style={styles.textInput}
          value={registerPassword}
          onChangeText={setRegisterPassword}
          secureTextEntry
        />
        <Text style={styles.hintText}>
          Yêu cầu: Tối thiểu 8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc
          biệt.
        </Text>
        <TouchableOpacity style={styles.redButton} onPress={handleRegister}>
          <Text style={styles.buttonText}>Đăng Ký</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setView("login")}>
          <Text style={styles.centerSmall}>
            Đã có tài khoản? <Text style={styles.linkText}>Đăng nhập</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>,
    );

  const renderForgotPassword = () =>
    renderScreen(
      <ScrollView contentContainerStyle={styles.formContainer}>
        <Text style={styles.headerCenter}>Quên Mật Khẩu</Text>
        {forgotStep === 1 ? (
          <>
            <Text style={styles.label}>Nhập Email của bạn</Text>
            <TextInput
              style={styles.textInput}
              value={forgotEmail}
              onChangeText={setForgotEmail}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.button}
              onPress={handleForgotPasswordRequest}
            >
              <Text style={styles.buttonText}>Lấy mã OTP</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.messageBox}>{forgotMessage}</Text>
            <Text style={styles.label}>Mã OTP (4 số)</Text>
            <TextInput
              style={styles.textInput}
              value={resetToken}
              onChangeText={setResetToken}
              keyboardType="numeric"
            />
            <Text style={styles.label}>Mật khẩu mới</Text>
            <TextInput
              style={styles.textInput}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
            <TouchableOpacity
              style={styles.greenButton}
              onPress={handleResetPassword}
            >
              <Text style={styles.buttonText}>Đặt lại mật khẩu</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.greenButton}
              onPress={() => setForgotStep(1)}
            >
              <Text style={styles.buttonText}>← Quay lại</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>,
    );

  const renderProfile = () =>
    renderScreen(
      <ScrollView style={styles.padded}>
        {!user ? (
          <View style={styles.emptyBox}>
            <Text>Vui lòng đăng nhập</Text>
            <TouchableOpacity onPress={() => setView("login")}>
              <Text style={styles.linkText}>Đăng nhập</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.profileCard}>
              <Text style={styles.header}>Hồ sơ của bạn</Text>
              <Text style={styles.label}>Email (Không đổi)</Text>
              <TextInput
                style={[styles.textInput, styles.disabledInput]}
                value={user.email || ""}
                editable={false}
              />
              <Text style={styles.label}>Họ Tên</Text>
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
              />
              <Text style={styles.label}>Số điện thoại</Text>
              <TextInput
                style={styles.textInput}
                value={phone}
                onChangeText={setPhone}
                placeholder="VD: 0912345678"
                keyboardType="phone-pad"
              />
              <Text style={styles.label}>Địa chỉ giao hàng</Text>
              <TextInput
                style={[styles.textInput, styles.addressInput]}
                value={shippingAddress}
                onChangeText={setShippingAddress}
                multiline
              />
              <TouchableOpacity
                style={styles.button}
                onPress={handleUpdateProfile}
              >
                <Text style={styles.buttonText}>Cập nhật</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.redButton} onPress={logout}>
                <Text style={styles.buttonText}>Thoát</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.profileCard}>
              <Text style={styles.header}>Lịch sử đơn hàng</Text>
              {orders.length === 0 ? (
                <Text>Bạn chưa có đơn hàng nào.</Text>
              ) : (
                orders.map((o) => (
                  <View key={o.id} style={styles.orderCard}>
                    <Text style={styles.orderTitle}>Đơn #{o.id}</Text>
                    <Text>
                      Ngày đặt:{" "}
                      {o.created_at
                        ? new Date(o.created_at).toLocaleDateString()
                        : ""}
                    </Text>
                    <Text>Tổng tiền: {formatMoney(o.total_amount || 0)}</Text>
                    <Text>Trạng thái: {statusLabel(o.status)}</Text>
                    {(o.status === "pending" || o.status === "confirmed") && (
                      <TouchableOpacity
                        style={styles.smallRedButton}
                        onPress={() => cancelOrder(o.id)}
                      >
                        <Text style={styles.smallButtonText}>Hủy đơn</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>,
    );

  if (view === "cart") return renderCart();
  if (view === "checkout") return renderCheckout();
  if (view === "login") return renderLogin();
  if (view === "register") return renderRegister();
  if (view === "forgotPassword") return renderForgotPassword();
  if (view === "profile") return renderProfile();
  if (view === "productDetail") return renderProductDetail();
  return renderHome();
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f5f5f5" },
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  padded: { flex: 1, padding: 20 },
  paddedFlex: { flex: 1, padding: 20 },
  navBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#2563eb",
  },
  brand: { fontSize: 20, fontWeight: "bold", color: "#fff" },
  navLinks: { flexDirection: "row", alignItems: "center", gap: 12 },
  navText: { fontSize: 14, color: "#fff" },
  header: { fontSize: 24, fontWeight: "bold", marginBottom: 12 },
  headerCenter: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  searchSection: { backgroundColor: "#fff", padding: 16, marginBottom: 8 },
  searchRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 6,
    padding: 10,
    backgroundColor: "#fff",
  },
  searchButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  searchResultText: { marginTop: 10, color: "#4b5563" },
  productList: { padding: 16, paddingBottom: 28 },
  productCard: {
    backgroundColor: "#fff",
    marginBottom: 15,
    padding: 15,
    borderRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  productImage: {
    width: "100%",
    height: 160,
    marginBottom: 10,
    borderRadius: 6,
  },
  productName: { fontSize: 18, fontWeight: "bold" },
  productPrice: {
    fontSize: 16,
    color: "#ef4444",
    fontWeight: "bold",
    marginVertical: 8,
  },
  productActions: { flexDirection: "row", gap: 8, marginTop: 6 },
  button: {
    backgroundColor: "#2563eb",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  greenButton: {
    backgroundColor: "#16a34a",
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 10,
  },
  orangeButton: {
    backgroundColor: "#f97316",
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  redButton: {
    backgroundColor: "#ef4444",
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 10,
  },
  grayButton: {
    backgroundColor: "#6b7280",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    flex: 1,
  },
  grayButtonFull: {
    backgroundColor: "#6b7280",
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 12,
  },
  secondaryButton: {
    backgroundColor: "#e5e7eb",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "bold", textAlign: "center" },
  secondaryButtonText: {
    color: "#374151",
    fontWeight: "bold",
    textAlign: "center",
  },
  disabledButton: { opacity: 0.5 },
  bugMobileHidden: { width: "100%", transform: [{ translateX: 75 }] },
  detailCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  detailImage: {
    width: "100%",
    height: 240,
    borderRadius: 8,
    marginBottom: 16,
  },
  detailName: { fontSize: 26, fontWeight: "bold", marginBottom: 8 },
  detailPrice: {
    fontSize: 22,
    color: "#dc2626",
    fontWeight: "bold",
    marginBottom: 12,
  },
  description: { color: "#374151", marginBottom: 18, lineHeight: 20 },
  label: { fontSize: 15, marginBottom: 6, color: "#374151" },
  quantityInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    width: 90,
    borderRadius: 6,
    padding: 10,
    backgroundColor: "#fff",
    marginBottom: 10,
  },
  cartList: { flex: 1 },
  cartItem: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
  },
  cartProductName: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  inlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginVertical: 6,
  },
  cartQuantityInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    width: 60,
    textAlign: "center",
    padding: 6,
    borderRadius: 5,
    backgroundColor: "#fff",
  },
  deleteText: { color: "#ef4444", fontWeight: "bold" },
  totalText: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "right",
    marginVertical: 20,
    color: "#dc2626",
  },
  actionRow: { flexDirection: "row", gap: 10 },
  actionFlex: { flex: 1 },
  checkoutBtn: {
    backgroundColor: "#16a34a",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  checkoutCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  sectionTitle: { fontWeight: "bold", marginBottom: 8, fontSize: 16 },
  orderLine: { marginBottom: 6 },
  textInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    backgroundColor: "#fff",
  },
  redInput: { color: "#dc2626", fontWeight: "bold" },
  couponBox: {
    padding: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginVertical: 16,
  },
  couponResult: { marginTop: 10, gap: 4 },
  finalAmount: { fontSize: 16, fontWeight: "bold" },
  finalTotal: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "right",
    marginBottom: 16,
  },
  formContainer: { padding: 24, justifyContent: "center" },
  forgotLink: {
    color: "#3b82f6",
    textAlign: "right",
    marginTop: -8,
    marginBottom: 14,
  },
  centerSmall: { textAlign: "center", marginTop: 14, color: "#374151" },
  linkText: { color: "#2563eb", fontWeight: "bold" },
  hintText: { fontSize: 12, color: "#9ca3af", marginTop: -8, marginBottom: 10 },
  messageBox: {
    backgroundColor: "#dcfce7",
    color: "#166534",
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
  },
  profileCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 16,
  },
  disabledInput: { backgroundColor: "#f3f4f6", color: "#6b7280" },
  addressInput: { minHeight: 88, textAlignVertical: "top" },
  orderCard: {
    backgroundColor: "#fff",
    padding: 12,
    marginBottom: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  orderTitle: { fontWeight: "bold", marginBottom: 4 },
  smallRedButton: {
    backgroundColor: "#ef4444",
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
    alignItems: "center",
    alignSelf: "flex-start",
  },
  smallButtonText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  errorBox: {
    backgroundColor: "#fee2e2",
    margin: 16,
    padding: 12,
    borderRadius: 8,
  },
  errorText: { color: "#991b1b" },
  errorSmall: { color: "#dc2626", marginTop: 8 },
  errorBoxText: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
  },
  mutedText: { textAlign: "center", color: "#6b7280", marginTop: 20 },
  resultCount: { textAlign: "center", color: "#9ca3af", marginBottom: 20 },
  emptyBox: {
    alignItems: "center",
    padding: 28,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginTop: 20,
  },
  emptyTitle: { fontSize: 20, marginBottom: 12, textAlign: "center" },
  successBox: {
    alignItems: "center",
    padding: 28,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginTop: 40,
  },
  successTitle: {
    fontSize: 26,
    color: "#16a34a",
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  centerText: { textAlign: "center", marginBottom: 16 },
  footer: { backgroundColor: "#1f2937", padding: 12, alignItems: "center" },
  footerText: { color: "#fff", fontSize: 12, textAlign: "center" },
});
