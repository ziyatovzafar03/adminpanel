
export type Status = 'OPEN' | 'CLOSED' | 'DELETED';
export type UserStatus = 'CONFIRMED' | 'PENDING' | 'REJECTED';
export type DiscountType = 'PERCENT' | 'NONE' | 'FIXED';

export interface Category {
  id: string;
  nameUz: string;
  nameUzCyrillic: string;
  nameRu: string;
  nameEn: string;
  orderIndex: number;
  status: 'OPEN' | 'CLOSED';
  parentId: string | null;
}

export interface Product {
  id: string;
  nameUz: string;
  nameUzCyrillic: string;
  nameEn: string;
  nameRu: string;
  descriptionUz: string;
  descriptionUzCyrillic: string;
  descriptionEn: string;
  descriptionRu: string;
  price: number;
  stock: number;
  imageUrl: string;
  categoryId: string;
  status: Status;
  createdAt: string;
  updatedAt: string;
  sellerChatId: number | null;
  discountType: DiscountType;
  discountValue: number | null;
  discountStartAt: string | null;
  discountEndAt: string | null;
  orderIndex: number;
}

export interface ProductCreateRequest {
  nameUz: string;
  nameUzCyrillic: string;
  nameEn: string;
  nameRu: string;
  descriptionUz: string;
  descriptionUzCyrillic: string;
  descriptionEn: string;
  descriptionRu: string;
  price: number;
  stock: number;
  imageUrl: string;
  categoryId: string;
  status: Status;
  discountType: DiscountType;
  discountValue: number | null;
  discountStartAt: string | null;
  discountEndAt: string | null;
  orderIndex: number;
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
  status: 'OPEN' | 'CLOSED';
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  code?: number;
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
  exists?: boolean;
}
