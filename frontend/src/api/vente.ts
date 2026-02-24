import apiClient from './axios';

export type ProductType = 'film' | 'bd' | 'goodie';

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  type: ProductType;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFilters {
  type?: ProductType;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  userId: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  total: number;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export const venteApi = {
  getProducts: (filters?: ProductFilters) =>
    apiClient.get<Product[]>('/vente/products', { params: filters }).then((r) => r.data),

  getProduct: (id: string) =>
    apiClient.get<Product>(`/vente/products/${id}`).then((r) => r.data),

  createProduct: (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) =>
    apiClient.post<Product>('/vente/products', data).then((r) => r.data),

  updateProduct: (id: string, data: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>) =>
    apiClient.put<Product>(`/vente/products/${id}`, data).then((r) => r.data),

  deleteProduct: (id: string) =>
    apiClient.delete(`/vente/products/${id}`),

  getOrders: () =>
    apiClient.get<Order[]>('/vente/orders').then((r) => r.data),

  createOrder: (items: { productId: string; quantity: number }[]) =>
    apiClient.post<Order>('/vente/orders', { items }).then((r) => r.data),
};
