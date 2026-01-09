import { ApiResponse, Category, CategoryCreateRequest, CategoryEditRequest, UserAuthData } from './types';

// DIQQAT: Agar backend manzilingiz o'zgargan bo'lsa, ushbu URLni yangilang!
const BASE_URL = 'https://4bdf137143e3.ngrok-free.app';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': 'true',
  'Accept': 'application/json'
});

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'Noma\'lum xatolik');
    throw new Error(`Server xatosi (${response.status}): ${errorBody}`);
  }
  const json = await response.json();
  return json;
};

export const apiService = {
  async fetchUserByChatId(chatId: string): Promise<ApiResponse<UserAuthData>> {
    const response = await fetch(`${BASE_URL}/api/user/find-by-chat-id?chat_id=${chatId}`, { 
      headers: getHeaders() 
    });
    return handleResponse(response);
  },

  async getParentCategories(): Promise<ApiResponse<Category[]>> {
    const response = await fetch(`${BASE_URL}/api/category`, { headers: getHeaders() });
    return handleResponse(response);
  },

  async getCategoryById(id: string): Promise<ApiResponse<Category>> {
    const response = await fetch(`${BASE_URL}/api/category/find-by-id/${id}`, { headers: getHeaders() });
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
    const response = await fetch(`${BASE_URL}/api/category`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async editCategory(id: string, data: CategoryEditRequest): Promise<ApiResponse<Category>> {
    const response = await fetch(`${BASE_URL}/api/category/edit/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async deleteCategory(id: string): Promise<ApiResponse<boolean>> {
    const response = await fetch(`${BASE_URL}/api/category/delete/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(response);
  },
};