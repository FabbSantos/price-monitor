'use client';

import { PriceHistory as PriceHistoryType } from '@/lib/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PriceHistoryProps {
  history: PriceHistoryType[];
  productId: string;
}

export function PriceHistory({ history, productId }: PriceHistoryProps) {
  const productHistory = history.filter((h) => h.productId === productId);

  if (productHistory.length === 0) {
    return (
      <div className="glass rounded-xl p-6 text-center text-gray-400">
        Sem histórico disponível ainda
      </div>
    );
  }

  // Prepara dados para o gráfico
  const chartData = productHistory.flatMap((h) =>
    h.prices.map((p) => ({
      timestamp: new Date(p.timestamp).getTime(),
      price: p.price,
      store: h.store,
      date: format(new Date(p.timestamp), 'dd/MM HH:mm', { locale: ptBR }),
    }))
  );

  // Ordena por timestamp
  chartData.sort((a, b) => a.timestamp - b.timestamp);

  return (
    <div className="glass rounded-xl p-6">
      <h3 className="text-xl font-bold mb-6 text-white">Histórico de Preços</h3>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="date"
            stroke="rgba(255,255,255,0.5)"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="rgba(255,255,255,0.5)"
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => `R$ ${value}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(0,0,0,0.8)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
            }}
            labelStyle={{ color: '#fff' }}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#22c55e"
            strokeWidth={2}
            dot={{ fill: '#22c55e', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Tabela de preços por loja */}
      <div className="mt-6 space-y-2">
        <h4 className="text-sm font-semibold text-gray-400 mb-3">Últimos preços por loja:</h4>
        {productHistory.map((h) => {
          const lastPrice = h.prices[h.prices.length - 1];
          return (
            <div
              key={h.store}
              className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
            >
              <span className="text-white capitalize">{h.store}</span>
              <div className="text-right">
                <div className="text-white font-semibold">
                  R$ {lastPrice.price.toFixed(2).replace('.', ',')}
                </div>
                <div className="text-xs text-gray-500">
                  {format(new Date(lastPrice.timestamp), "dd/MM 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
