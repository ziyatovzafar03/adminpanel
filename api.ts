
import { 
  ApiResponse, 
  Category, 
  CategoryCreateRequest, 
  CategoryEditRequest, 
  Product, 
  EditProductRequest, 
  AddProductTypeRequest, 
  EditProductTypeRequest,
  UserAuthData,
  Status
} from './types';
import { BASE_URL } from './consts';

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
  const data = await response.json().catch(() => null);
  
  if (!response.ok) {
    const errorMsg = data?.messageUz || data?.message || `Server xatosi (${response.status})`;
    throw new Error(errorMsg);
  }
  
  if (data && data.success === false) {
    throw new Error(data.messageUz || data.message || "Noma'lum xatolik yuz berdi");
  }
  
  return data;
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

  // Product APIs (Core)
  async getProductsByCategoryId(categoryId: string): Promise<ApiResponse<Product[]>> {
    const response = await fetch(`${BASE_URL}/api/product/products-by-category-id/${categoryId}`, { headers: getHeaders() });
    return handleResponse(response);
  },
  async createProduct(data: any): Promise<ApiResponse<Product>> {
    const response = await fetch(`${BASE_URL}/api/product`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },
  async updateProduct(id: string, data: EditProductRequest): Promise<ApiResponse<Product>> {
    const response = await fetch(`${BASE_URL}/api/product/update/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },
  async changeProductStatus(id: string, status: Status): Promise<ApiResponse<Product>> {
    const response = await fetch(`${BASE_URL}/api/product/change-product-status/${id}?status=${status}`, {
      method: 'PUT',
      headers: getHeaders()
    });
    return handleResponse(response);
  },
  async deleteProduct(id: string): Promise<ApiResponse<boolean>> {
    const response = await fetch(`${BASE_URL}/api/product/delete-product/${id}`, {
      method: 'PUT',
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  // Product Type (Variant) APIs
  async addProductType(data: AddProductTypeRequest): Promise<ApiResponse<any>> {
    const response = await fetch(`${BASE_URL}/api/product/add-product-type`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },
  async updateProductType(id: string, data: EditProductTypeRequest): Promise<ApiResponse<any>> {
    const response = await fetch(`${BASE_URL}/api/product/update-product-type/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },
  async deleteProductType(id: string): Promise<ApiResponse<boolean>> {
    const response = await fetch(`${BASE_URL}/api/product/product-type/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  // File APIs
  async uploadFile(file: File): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${BASE_URL}/api/file/upload-file`, {
      method: 'POST',
      headers: getHeaders(true),
      body: formData
    });
    return handleResponse(response);
  }
};
