export interface Product {
  id: string;
  name: string;
  targetPrice: number;
  urls: Record<string, string>;
}

export interface Store {
  id: string;
  name: string;
  enabled: boolean;
}

export interface PriceData {
  productId: string;
  productName: string;
  store: string;
  storeName: string;
  price: number | null;
  url: string;
  timestamp: string;
  error?: string;
  available: boolean;
}

export interface PriceHistory {
  productId: string;
  store: string;
  prices: Array<{
    price: number;
    timestamp: string;
  }>;
}

export interface NotificationConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  to: string;
}
