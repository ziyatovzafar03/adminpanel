
export type Status = 'OPEN' | 'CLOSED' | 'DELETED';
export type UserStatus = 'CONFIRMED' | 'PENDING' | 'REJECTED';
export type DiscountType = 'PERCENT' | 'NONE' | 'FIXED';
export type SellerStatus = 'TRIAL' | 'MONTHLY_PAID' | 'YEARLY_PAID' | 'EXPIRED';
export type UserLanguage = 'UZBEK_LATIN' | 'UZBEK_CYRILLIC' | 'ENGLISH' | 'RUSSIAN';

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

export interface Seller {
  id: string;
  firstname: string;
  lastname: string;
  username: string;
  chatId: number;
  lang: UserLanguage;
  phone: string;
  phoneTelegram?: string;
  status: SellerStatus;
  created: string;
}

export interface BotTokenData {
  token: string;
  username: string;
}

export interface ProductType {
  id: string;
  imgSize: number;
  imgName: string;
  imageUrl: string;
  nameUz: string;
  nameUzCyrillic: string;
  nameEn: string;
  nameRu: string;
  productId: string;
  price: number;
  stock: number;
  createdAt: string;
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
  types: ProductType[];
}

export interface EditProductRequest {
  nameUz: string;
  nameUzCyrillic: string;
  nameEn: string;
  nameRu: string;
  descriptionUz: string;
  descriptionUzCyrillic: string;
  descriptionEn: string;
  descriptionRu: string;
  status: Status;
  discountType: DiscountType;
  discountValue: number | null;
  discountStartAt: string | null;
  discountEndAt: string | null;
  orderIndex: number;
}

export interface AddProductTypeRequest {
  imgSize: number;
  imgName: string;
  imageUrl: string;
  nameUz: string;
  nameUzCyrillic: string;
  nameEn: string;
  nameRu: string;
  price: number;
  stock: number;
  productId: string;
}

export interface EditProductTypeRequest {
  imgSize: number;
  imgName: string;
  imageUrl: string;
  nameUz: string;
  nameUzCyrillic: string;
  nameEn: string;
  nameRu: string;
  price: number;
  stock: number;
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
