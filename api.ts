
import { ApiResponse, Category, CategoryCreateRequest, CategoryEditRequest, Product, ProductCreateRequest, UserAuthData } from './types';

const BASE_URL = 'https://4bdf137143e3.ngrok-free.app';

const getHeaders = (isMultipart = false) => {
  const headers: any = {
    'ngrok-skip-browser-warning': 'true',
    'Accept': 'application/json'
  };
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
};

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'Noma\'lum xatolik');
    throw new Error(`Server xatosi (${response.status}): ${errorBody}`);
  }
  return response.json();
};

export const apiService = {
  // User & Category APIs
  async fetchUserByChatId(chatId: string): Promise<ApiResponse<UserAuthData>> {
    const response = await fetch(`${BASE_URL}/api/user/find-by-chat-id?chat_id=${chatId}`, { headers: getHeaders() });
    return handleResponse(response);
  },
  async getParentCategories(): Promise<ApiResponse<Category[]>> {
    const response = await fetch(`${BASE_URL}/api/category`, { headers: getHeaders() });
    return handleResponse(response);
  },
  async getCategoryChildren(id: string): Promise<ApiResponse<Category[]>> {
    const response = await fetch(`${BASE_URL}/api/category/${id}/children`, { headers: getHeaders() });
    return handleResponse(response);
  },
  async hasChildren(id: string): Promise<ApiResponse<boolean>> {
    const response = await fetch(`${BASE_URL}/api/category/${id}/has-children`, { headers: getHeaders() });
    return handleResponse(response);
  },
  async addCategory(data: CategoryCreateRequest): Promise<ApiResponse<Category>> {
    const response = await fetch(`${BASE_URL}/api/category`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) });
    return handleResponse(response);
  },
  async editCategory(id: string, data: CategoryEditRequest): Promise<ApiResponse<Category>> {
    const response = await fetch(`${BASE_URL}/api/category/edit/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(data) });
    return handleResponse(response);
  },
  async deleteCategory(id: string): Promise<ApiResponse<boolean>> {
    const response = await fetch(`${BASE_URL}/api/category/delete/${id}`, { method: 'DELETE', headers: getHeaders() });
    return handleResponse(response);
  },

  // Product APIs
  async getProductsByCategoryId(categoryId: string): Promise<ApiResponse<Product[]>> {
    const response = await fetch(`${BASE_URL}/api/product/products-by-category-id/${categoryId}`, { headers: getHeaders() });
    return handleResponse(response);
  },
  async uploadFile(file: File): Promise<ApiResponse<string>> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${BASE_URL}/api/file/upload-file`, {
      method: 'POST',
      headers: getHeaders(true),
      body: formData
    });
    return handleResponse(response);
  },
  async createProduct(data: ProductCreateRequest): Promise<ApiResponse<Product>> {
    // Assuming a standard POST endpoint for creation, otherwise use update with new ID if provided
    const response = await fetch(`${BASE_URL}/api/product/create`, { 
      method: 'POST', 
      headers: getHeaders(), 
      body: JSON.stringify(data) 
    });
    return handleResponse(response);
  },
  async updateProduct(id: string, data: ProductCreateRequest): Promise<ApiResponse<Product>> {
    const response = await fetch(`${BASE_URL}/api/product/update/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },
  async deleteProduct(id: string): Promise<ApiResponse<boolean>> {
    // Soft delete usually via update status to DELETED
    const response = await fetch(`${BASE_URL}/api/product/delete/${id}`, { method: 'DELETE', headers: getHeaders() });
    return handleResponse(response);
  }
};
