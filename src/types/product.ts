export interface ProductColor {
  color: string;
  image_link: string;
  additional_image_link?: string[];
}

export interface ProductSize {
  size: string;
  price: number;
  sale_price?: number | null;
}

export interface ProductRating {
  count: number;
  average: number;
}

export interface ProductReviews {
  count: number;
}

export interface Product {
  item_group_id: string;
  title: string;
  description: string;
  availability: string;
  condition: string;
  brand: string;
  link: string;
  google_product_category: string;
  product_type: string;
  quantity_to_sell_on_facebook: number;
  custom_label_0: string;
  custom_label_1?: string;
  custom_label_2?: string;
  custom_label_3?: string;
  custom_label_4?: string;
  custom_label_5?: string;
  variant_color: ProductColor[];
  variant_size: ProductSize[];
  created_at: string;
  updated_at: string;
  main_features: string[];
  sub_features: string[];
  headline: string;
  rating: ProductRating;
  reviews: ProductReviews;
}

export interface ProductsAPIResponse {
  success: boolean;
  count: number;
  data: Product[];
}
