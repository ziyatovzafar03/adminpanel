
import { ApiResponse, Category, CategoryCreateRequest, CategoryEditRequest, UserAuthData } from './types';

const BASE_URL = 'https://codebyz.com';

export const apiService = {
  async fetchUserByChatId(chatId: string): Promise<ApiResponse<UserAuthData>> {
    const response = await fetch(`${BASE_URL}/api/user/find-by-chat-id?chat_id=${chatId}`);
    return response.json();
  },

  async getParentCategories(): Promise<ApiResponse<Category[]>> {
    const response = await fetch(`${BASE_URL}/api/category`);
    return response.json();
  },

  async getCategoryById(id: string): Promise<ApiResponse<Category>> {
    const response = await fetch(`${BASE_URL}/api/category/find-by-id/${id}`);
    return response.json();
  },

  async getCategoryChildren(id: string): Promise<ApiResponse<Category[]>> {
    const response = await fetch(`${BASE_URL}/api/category/${id}/children`);
    return response.json();
  },

  async hasChildren(id: string): Promise<ApiResponse<boolean>> {
    const response = await fetch(`${BASE_URL}/api/category/${id}/has-children`);
    return response.json();
  },

  async addCategory(data: CategoryCreateRequest): Promise<ApiResponse<Category>> {
    const response = await fetch(`${BASE_URL}/api/category`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async editCategory(id: string, data: CategoryEditRequest): Promise<ApiResponse<Category>> {
    const response = await fetch(`${BASE_URL}/api/category/edit/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async deleteCategory(id: string): Promise<ApiResponse<boolean>> {
    const response = await fetch(`${BASE_URL}/api/category/delete/${id}`, {
      method: 'DELETE',
    });
    return response.json();
  },
};
