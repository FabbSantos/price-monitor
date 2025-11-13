import fs from 'fs';
import path from 'path';
import { PriceData, PriceHistory } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const HISTORY_FILE = path.join(DATA_DIR, 'prices-history.json');
const LATEST_FILE = path.join(DATA_DIR, 'latest-prices.json');

/**
 * Garante que o diretório de dados existe
 */
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * Salva os preços mais recentes
 */
export function saveLatestPrices(prices: PriceData[]) {
  ensureDataDir();
  fs.writeFileSync(LATEST_FILE, JSON.stringify(prices, null, 2));
}

/**
 * Carrega os preços mais recentes
 */
export function loadLatestPrices(): PriceData[] {
  if (!fs.existsSync(LATEST_FILE)) {
    return [];
  }

  const data = fs.readFileSync(LATEST_FILE, 'utf-8');
  return JSON.parse(data);
}

/**
 * Adiciona preços ao histórico
 */
export function addToHistory(prices: PriceData[]) {
  ensureDataDir();

  let history: PriceHistory[] = [];

  if (fs.existsSync(HISTORY_FILE)) {
    const data = fs.readFileSync(HISTORY_FILE, 'utf-8');
    history = JSON.parse(data);
  }

  // Atualiza o histórico com novos preços
  prices.forEach((priceData) => {
    if (priceData.price === null) return;

    const key = `${priceData.productId}-${priceData.store}`;
    let entry = history.find(
      (h) => h.productId === priceData.productId && h.store === priceData.store
    );

    if (!entry) {
      entry = {
        productId: priceData.productId,
        store: priceData.store,
        prices: [],
      };
      history.push(entry);
    }

    // Adiciona o novo preço
    entry.prices.push({
      price: priceData.price,
      timestamp: priceData.timestamp,
    });

    // Mantém apenas os últimos 100 registros por produto/loja
    if (entry.prices.length > 100) {
      entry.prices = entry.prices.slice(-100);
    }
  });

  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
}

/**
 * Carrega o histórico de preços
 */
export function loadHistory(): PriceHistory[] {
  if (!fs.existsSync(HISTORY_FILE)) {
    return [];
  }

  const data = fs.readFileSync(HISTORY_FILE, 'utf-8');
  return JSON.parse(data);
}

/**
 * Carrega o histórico de um produto específico em uma loja
 */
export function getProductHistory(
  productId: string,
  store: string
): PriceHistory | null {
  const history = loadHistory();
  return (
    history.find((h) => h.productId === productId && h.store === store) || null
  );
}
