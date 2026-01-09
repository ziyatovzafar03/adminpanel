
export type Status = 'OPEN' | 'CLOSED';
export type UserStatus = 'CONFIRMED' | 'PENDING' | 'REJECTED';

export interface Category {
  id: string;
  nameUz: string;
  nameUzCyrillic: string;
  nameRu: string;
  nameEn: string;
  orderIndex: number;
  status: Status;
  parentId: string | null;
}

export interface CategoryCreateRequest {
  nameUz: string;
  nameUzCyrillic: string;
  nameRu: string;
  nameEn: string;
  orderIndex: number;
  parentId: string | null;
}

export interface CategoryEditRequest {
  nameUz: string;
  nameUzCyrillic?: string;
  nameRu?: string;
  nameEn?: string;
  orderIndex: number;
  parentId: string | null;
  status: Status;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface UserAuthData {
  id: string;
  firstname: string;
  lastname: string;
  username: string;
  chatId: number;
  status: UserStatus;
  categoryId: string | null;
}
