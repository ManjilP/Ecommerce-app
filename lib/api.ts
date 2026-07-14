import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://192.168.18.218:8000";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

export const isTokenExpired = (token: string) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

api.interceptors.request.use(async (config) => {
  let token = sessionStorage.getItem("access_token");
  const refresh = sessionStorage.getItem("refresh_token");

  if (token && isTokenExpired(token) && refresh) {
    try {
      const { data } = await axios.post(`${BASE_URL}/api/auth/token/refresh/`, { refresh });
      token = data.access;
      sessionStorage.setItem("access_token", data.access);
      if (data.refresh) sessionStorage.setItem("refresh_token", data.refresh);
    } catch {
      sessionStorage.removeItem("access_token");
      sessionStorage.removeItem("refresh_token");
      window.location.href = "/login";
      return config;
    }
  }

  if (token) config.headers.Authorization = `Bearer ${token}`;

  const tenantSlug =
    sessionStorage.getItem("tenant_slug") ||
    process.env.NEXT_PUBLIC_TENANT_SLUG;
  if (tenantSlug) config.headers["X-Tenant-Slug"] = tenantSlug;

  return config;
});

let isRefreshing = false;
let refreshQueue: ((token: string) => void)[] = [];

const processQueue = (token: string) => {
  refreshQueue.forEach((cb) => cb(token));
  refreshQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const isAuthEndpoint = original.url?.includes("/auth/login") || original.url?.includes("/auth/register") || original.url?.includes("/auth/admin/login");
    if (error.response?.status === 401 && !original._retry && !isAuthEndpoint) {
      original._retry = true;
      const refresh = sessionStorage.getItem("refresh_token");
      if (!refresh) {
        sessionStorage.removeItem("access_token");
        window.location.href = "/login";
        return new Promise(() => { });
      }

      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshQueue.push((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          });
        });
      }

      isRefreshing = true;
      try {
        const { data } = await axios.post(`${BASE_URL}/api/auth/token/refresh/`, { refresh });
        sessionStorage.setItem("access_token", data.access);
        if (data.refresh) sessionStorage.setItem("refresh_token", data.refresh);
        processQueue(data.access);
        original.headers.Authorization = `Bearer ${data.access}`;
        return api(original);
      } catch {
        sessionStorage.removeItem("access_token");
        sessionStorage.removeItem("refresh_token");
        window.location.href = "/login";
        return new Promise(() => { });
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = (username: string, password: string) =>
  api.post("/api/auth/login/", { username, password });

export const adminLogin = (username: string, password: string) =>
  api.post("/api/auth/admin/login/", { username, password });

export const vendorLogin = (username: string, password: string) =>
  api.post("/api/auth/vendor/login/", { username, password });


export const register = (username: string, password: string, email: string, city?: string) =>
  api.post("/api/auth/register/", { username, password, email, ...(city ? { city } : {}) });

// Products
export const getProducts = () => api.get("/api/products/");
export const getProduct = (id: number) => api.get(`/api/products/${id}/`);
export const createProduct = (data: unknown) => api.post("/api/products/", data);
export const updateProduct = (id: number, data: unknown) => api.put(`/api/products/${id}/`, data);
export const deleteProduct = (id: number) => api.delete(`/api/products/${id}/`);
export const uploadProductImage = (id: number, file: File) => { const fd = new FormData(); fd.append("image", file); return api.post(`/api/products/${id}/upload-image/`, fd, { headers: { "Content-Type": "multipart/form-data" } }); };
export const fetchProductImage = (id: number) => api.post(`/api/products/${id}/fetch-image/`);

// Orders
export const getOrders = (params?: { search?: string; page?: number }) => api.get("/api/orders/", { params });
export const createOrder = (data: unknown) => api.post("/api/orders/", data);
export const deleteOrder = (id: number) => api.delete(`/api/orders/${id}/`);
export const cancelOrder = (id: number) => api.post(`/api/orders/${id}/cancel/`);
export const confirmPayment = (id: number, transaction_id?: string) => api.post(`/api/orders/${id}/confirm-payment/`, transaction_id ? { transaction_id } : {});
export const trackOrder = (id: number) => api.get(`/api/orders/${id}/track/`);
export const updateOrderStatus = (id: number, status: string) => api.patch(`/api/orders/${id}/update-status/`, { status });

// Prescriptions
export const getPrescriptionStatus = (id: number) => api.get(`/api/orders/${id}/prescription-status/`);
export const uploadPrescription = (id: number, image: File) => { const fd = new FormData(); fd.append("image", image); return api.post(`/api/orders/${id}/upload-prescription/`, fd, { headers: { "Content-Type": "multipart/form-data" } }); };

// Vendor Orders (admin panel)
export const getVendorOrders = (params?: { search?: string; page?: number }) => api.get("/api/vendor/orders/", { params });
export const updateVendorOrderStatus = (id: number, status: string) => api.patch(`/api/vendor/orders/${id}/update-status/`, { status });
export const deleteVendorOrder = (id: number) => api.delete(`/api/vendor/orders/${id}/`);

// Vendor Products (admin panel)
export const getVendorProducts = () => api.get("/api/vendor/products/");

// Inventory
export const getInventory = () => api.get("/api/inventory/");
export const getInventoryItem = (id: number) => api.get(`/api/inventory/${id}/`);
export const createInventoryItem = (data: unknown) => api.post("/api/inventory/", data);
export const updateInventoryItem = (id: number, data: unknown) => api.patch(`/api/inventory/${id}/`, data);
export const deleteInventoryItem = (id: number) => api.delete(`/api/inventory/${id}/`);

// Warehouses
export const getWarehouses = () => api.get("/api/warehouses/");
export const getWarehouse = (id: number) => api.get(`/api/warehouses/${id}/`);
export const createWarehouse = (data: unknown) => api.post("/api/warehouses/", data);
export const updateWarehouse = (id: number, data: unknown) => api.put(`/api/warehouses/${id}/`, data);
export const deleteWarehouse = (id: number) => api.delete(`/api/warehouses/${id}/`);

// Reports
export const getInventorySummary = () => api.get("/api/reports/inventory-summary/");

// Contact
export const submitContactMessage = (data: { first_name: string; last_name: string; email: string; subject: string; message: string }) =>
  api.post("/api/contact/", data);

// Cart
export const getCart = () => api.get("/api/cart/");
export const addToCart = (product: number, quantity: number) => api.post("/api/cart/add/", { product, quantity });
export const updateCartItem = (id: number, quantity: number) => api.patch(`/api/cart/item/${id}/`, { quantity });
export const removeCartItem = (id: number) => api.delete(`/api/cart/item/${id}/delete/`);
export const clearCart = () => api.delete("/api/cart/clear/");
export const checkoutCart = (data: { customer_name: string; payment_method: "COD" | "ESEWA" | "KHALTI"; delivery_city?: string }) =>
  api.post("/api/cart/checkout/", data);

// Coupons
export const getCoupons = () => api.get("/api/coupons/");
export const applyCoupon = (code: string, order_amount: string) => api.post("/api/coupons/apply/", { code, order_amount });
export const createCoupon = (data: unknown) => api.post("/api/coupons/", data);
export const updateCoupon = (id: number, data: unknown) => api.put(`/api/coupons/${id}/`, data);
export const deleteCoupon = (id: number) => api.delete(`/api/coupons/${id}/`);

// Notifications
export const getNotifications = () => api.get("/api/notifications/");
export const markNotificationRead = (id: number) => api.patch(`/api/notifications/${id}/read/`, { is_read: true });
export const markAllNotificationsRead = () => api.post("/api/notifications/mark-all-read/", { is_read: true });
export const getUnreadNotificationCount = () => api.get("/api/notifications/unread-count/");
export const deleteNotification = (id: number) => api.delete(`/api/notifications/${id}/`);
export const clearAllNotifications = async (ids: number[]) => Promise.all(ids.map((id) => api.delete(`/api/notifications/${id}/`)));

// Wishlist
export const getWishlist = () => api.get("/api/wishlist/");
export const addToWishlist = (product: number) => api.post("/api/wishlist/", { product });
export const removeFromWishlist = (id: number) => api.delete(`/api/wishlist/${id}/`);
export const clearWishlist = () => api.delete("/api/wishlist/clear/");

// Reports
export const getSalesChart = (period = "daily", days = 30) => api.get(`/api/reports/sales-chart/?period=${period}&days=${days}`);
export const getRevenueByCity = (days = 30) => api.get(`/api/reports/revenue-by-city/?days=${days}`);
export const getTopProducts = (days = 30) => api.get(`/api/reports/top-products/?days=${days}`);
export const getTopCustomers = (days = 30) => api.get(`/api/reports/top-customers/?days=${days}`);
export const getCouponUsage = () => api.get("/api/reports/coupon-usage/");

// Tenants
export const getTenantMe = () => api.get("/api/tenants/me/");

// Auth
export const logout = (refresh: string) => api.post("/api/auth/logout/", { refresh });
export const getMe = () => api.get("/api/auth/me/");
export const forgotPassword = (email: string) => api.post("/api/auth/forgot-password/", { email });
export const resetPassword = (token: string, password: string, confirm_password: string) =>
  api.post(`/api/auth/reset-password/${token}/`, { password, confirm_password });

// Reviews
export const getReviews = () => api.get("/api/reviews/");
export const createReview = (data: { product: number; rating: number; comment?: string }) => api.post("/api/reviews/", data);
export const updateReview = (id: number, data: { rating: number; comment?: string }) => api.patch(`/api/reviews/${id}/`, data);
export const deleteReview = (id: number) => api.delete(`/api/reviews/${id}/`);

export default api;

