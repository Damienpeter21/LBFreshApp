export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice: number;
  discountPercentage: number;
  unit: string;
  rating: number;
  reviewsCount: number;
  inStock: boolean;
  deliveryTime: string;
  description: string;
  imageUrl?: string;
  tags?: string[];
}

export interface Category {
  id: string;
  name: string;
  iconName?: string;
  itemCount: number;
}
