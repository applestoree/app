import { Product, ProductsAPIResponse } from '../types/product.ts';
import { isIWatchProduct, formatIWatchColor } from '../utils/colorFormatter.ts';

const PRODUCTS_API_ENDPOINT = 'https://jhpbtooefyzdndstlzva.supabase.co/functions/v1/app-products';

let cachedProducts: Product[] | null = null;
let ongoingPromise: Promise<Product[]> | null = null;

export async function fetchProducts(forceRefresh = false): Promise<Product[]> {
  if (!forceRefresh && cachedProducts) {
    return cachedProducts;
  }

  if (ongoingPromise && !forceRefresh) {
    return ongoingPromise;
  }

  ongoingPromise = (async () => {
    try {
      const response = await fetch(PRODUCTS_API_ENDPOINT, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      const json: ProductsAPIResponse = await response.json();

      if (!json || json.success !== true || !Array.isArray(json.data)) {
        throw new Error('Invalid response structure from products API');
      }

      // Sanitize product data so null or invalid sale_price becomes undefined
      // and format variant_color for iWatch as "Case {warna case} | Strap {warna strap}"
      const sanitizedData: Product[] = json.data.map((p) => {
        const isWatch = isIWatchProduct(p.product_type, p.title);
        return {
          ...p,
          variant_color: Array.isArray(p.variant_color)
            ? p.variant_color.map((col) => ({
                ...col,
                color: isWatch ? formatIWatchColor(col.color) : col.color,
              }))
            : [],
          variant_size: Array.isArray(p.variant_size)
            ? p.variant_size.map((sz) => ({
                ...sz,
                price: typeof sz.price === 'number' && !isNaN(sz.price) ? sz.price : Number(sz.price) || 0,
                sale_price:
                  sz.sale_price !== null &&
                  sz.sale_price !== undefined &&
                  !isNaN(Number(sz.sale_price)) &&
                  Number(sz.sale_price) > 0
                    ? Number(sz.sale_price)
                    : undefined,
              }))
            : [],
        };
      });

      cachedProducts = sanitizedData;
      return sanitizedData;
    } catch (error) {
      cachedProducts = null;
      throw error;
    } finally {
      ongoingPromise = null;
    }
  })();

  return ongoingPromise;
}

export async function fetchProductById(id: string, forceRefresh = false): Promise<Product | null> {
  const products = await fetchProducts(forceRefresh);
  const found = products.find((p) => p.item_group_id === id);
  return found || null;
}

export function clearProductsCache(): void {
  cachedProducts = null;
  ongoingPromise = null;
}
