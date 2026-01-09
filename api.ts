
import { ApiResponse, Category, CategoryCreateRequest, CategoryEditRequest, UserAuthData } from './types';

// DIQQAT: Agar backend manzilingiz o'zgargan bo'lsa, ushbu URLni yangilang!
const BASE_URL = 'https://4bdf137143e3.ngrok-free.app';

// ngrok brauzer ogohlantirishini chetlab o'tish uchun maxsus header
const getHeaders = () => ({
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': '69420',
  'Accept': 'application/json'
});

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`API Error (${response.status}):`, errorText);
    throw new Error(`Server xatosi: ${response.status}`);
  }
  return response.json();
};

export const apiService = {
  async fetchUserByChatId(chatId: string): Promise<ApiResponse<UserAuthData>> {
    console.log(`Fetching user: ${chatId}`);
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
