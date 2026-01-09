
import { ApiResponse, Category, CategoryCreateRequest, CategoryEditRequest, UserAuthData } from './types';

// Siz taqdim etgan ngrok BASE URL
const BASE_URL = 'https://4bdf137143e3.ngrok-free.app';

// ngrok sahifasini chetlab o'tish va JSON olish uchun kerakli header
const headers = {
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': '69420'
};

export const apiService = {
  async fetchUserByChatId(chatId: string): Promise<ApiResponse<UserAuthData>> {
    const response = await fetch(`${BASE_URL}/api/user/find-by-chat-id?chat_id=${chatId}`, { headers });
    return response.json();
  },

  async getParentCategories(): Promise<ApiResponse<Category[]>> {
    const response = await fetch(`${BASE_URL}/api/category`, { headers });
    return response.json();
  },

  async getCategoryById(id: string): Promise<ApiResponse<Category>> {
    const response = await fetch(`${BASE_URL}/api/category/find-by-id/${id}`, { headers });
    return response.json();
  },

  async getCategoryChildren(id: string): Promise<ApiResponse<Category[]>> {
    const response = await fetch(`${BASE_URL}/api/category/${id}/children`, { headers });
    return response.json();
  },

  async hasChildren(id: string): Promise<ApiResponse<boolean>> {
    const response = await fetch(`${BASE_URL}/api/category/${id}/has-children`, { headers });
    return response.json();
  },

  async addCategory(data: CategoryCreateRequest): Promise<ApiResponse<Category>> {
    const response = await fetch(`${BASE_URL}/api/category`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async editCategory(id: string, data: CategoryEditRequest): Promise<ApiResponse<Category>> {
    const response = await fetch(`${BASE_URL}/api/category/edit/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async deleteCategory(id: string): Promise<ApiResponse<boolean>> {
    const response = await fetch(`${BASE_URL}/api/category/delete/${id}`, {
      method: 'DELETE',
      headers
    });
    return response.json();
  },
};
