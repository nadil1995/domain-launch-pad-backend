// Execute trades on Binance (or paper trades)

import ccxt from 'ccxt';
import { cache } from '../utils/cache.js';
import { saveTrade } from './auditLogger.js';

const binance = new ccxt.binance({
  apiKey: process.env.BINANCE_API_KEY,
  secret: process.env.BINANCE_SECRET,
});

const paperTrade = process.env.PAPER_TRADE === 'true';
const tradeQuantityUsdt = parseFloat(process.env.TRADE_QUANTITY_USDT || '10');

// Demo prices for paper trading (when Binance API unavailable)
const demoPrices = {
  'BTC/USDT': 67350,
  'ETH/USDT': 2021,
  'SOL/USDT': 83.85,
};

export async function executeTrade(pair, direction) {
  try {
    const timestamp = new Date().toISOString();

    if (paperTrade) {
      // Paper trade: simulate execution with demo prices
      const price = demoPrices[pair] || 50000;
      const quantity = tradeQuantityUsdt / price;

      console.log(`[PAPER TRADE] ${pair} ${direction} x${quantity.toFixed(8)} @ $${price}`);

      await saveTrade({
        pair,
        direction,
        quantity,
        price,
        paperTrade: true,
        status: 'completed',
      });

      cache.setLastTrade(pair);

      return {
        success: true,
        pair,
        direction,
        quantity,
        price,
        paperTrade: true,
        status: 'completed',
        timestamp,
      };
    }

    // Real trade: execute on Binance
    console.log(`[REAL TRADE] Executing ${pair} ${direction} x${tradeQuantityUsdt} USDT`);

    const orderParams = {
      type: 'market',
      side: direction.toLowerCase(),
      amount: undefined, // Will calculate from USDT amount
    };

    // Fetch current price to calculate quantity
    const ticker = await binance.fetchTicker(pair);
    const price = ticker.last;
    const quantity = tradeQuantityUsdt / price;

    orderParams.amount = quantity;

    // Execute order
    const order = await binance.createOrder(pair, 'market', direction.toLowerCase(), quantity);

    console.log(`✓ Trade executed: ${pair} ${direction} x${quantity} @ $${price}`);

    await saveTrade({
      pair,
      direction,
      quantity: order.amount || quantity,
      price: order.average || price,
      paperTrade: false,
      status: 'completed',
    });

    cache.setLastTrade(pair);

    return {
      success: true,
      pair,
      direction,
      quantity: order.amount || quantity,
      price: order.average || price,
      paperTrade: false,
      status: 'completed',
      timestamp,
    };
  } catch (error) {
    console.error(`Trade execution failed for ${pair}:`, error.message);

    await saveTrade({
      pair,
      direction,
      quantity: 0,
      price: 0,
      paperTrade,
      status: 'failed',
      error: error.message,
    });

    return {
      success: false,
      pair,
      direction,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}
