import { Card } from './ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface PriceHistoryPoint {
  price: number;
  timestamp: string;
}

interface FundPriceChartProps {
  fundName: string;
  fundSymbol: string;
  currentPrice: number;
  initialPrice: number;
  priceHistory: PriceHistoryPoint[];
  compact?: boolean;
}

export function FundPriceChart({ 
  fundName, 
  fundSymbol, 
  currentPrice, 
  initialPrice,
  priceHistory,
  compact = false
}: FundPriceChartProps) {
  // Combine initial price with price history
  const allPrices = [
    { price: initialPrice, timestamp: priceHistory[0]?.timestamp || new Date().toISOString() },
    ...priceHistory
  ];

  if (allPrices.length < 2) {
    return (
      <Card className="p-6 bg-white border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Activity className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 style={{ fontWeight: 600, letterSpacing: '-0.01em' }}>
              {fundName} <span className="text-muted-foreground">({fundSymbol})</span>
            </h3>
            <p className="text-sm text-muted-foreground">Price History</p>
          </div>
        </div>
        <div className="h-48 flex items-center justify-center">
          <p className="text-muted-foreground text-sm">
            No price updates yet. Update the price to start tracking history.
          </p>
        </div>
      </Card>
    );
  }

  // Calculate change
  const firstPrice = allPrices[0].price;
  const lastPrice = allPrices[allPrices.length - 1].price;
  const priceChange = lastPrice - firstPrice;
  const priceChangePercent = firstPrice > 0 ? ((priceChange / firstPrice) * 100) : 0;
  const isPositive = priceChange >= 0;

  // Format data for chart
  const chartData = allPrices.map(point => ({
    date: new Date(point.timestamp).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    fullDate: new Date(point.timestamp).toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    price: point.price,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-border rounded-lg shadow-lg p-3">
          <p className="text-sm text-muted-foreground mb-1">{payload[0].payload.fullDate}</p>
          <p className="text-lg" style={{ fontWeight: 600 }}>
            ${payload[0].value.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  const chartHeight = compact ? 200 : 280;

  return (
    <Card className="p-6 bg-white border-border">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Activity className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 style={{ fontWeight: 600, letterSpacing: '-0.01em' }}>
              {fundName} <span className="text-muted-foreground">({fundSymbol})</span>
            </h3>
            <p className="text-sm text-muted-foreground">Price History</p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="flex items-center gap-2 justify-end mb-1">
            <p className="text-2xl" style={{ fontWeight: 600 }}>
              ${currentPrice.toFixed(2)}
            </p>
            <div className={`flex items-center gap-1 px-2 py-1 rounded text-sm ${
              isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span style={{ fontWeight: 600 }}>
                {isPositive ? '+' : ''}{priceChangePercent.toFixed(2)}%
              </span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {isPositive ? '+' : ''}${priceChange.toFixed(2)} from ${initialPrice.toFixed(2)}
          </p>
        </div>
      </div>

      <div style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <defs>
              <linearGradient id={`priceGradient-${fundSymbol}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" />
            <XAxis 
              dataKey="date" 
              stroke="#6b7280"
              style={{ fontSize: '11px' }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              stroke="#6b7280"
              style={{ fontSize: '11px' }}
              tickFormatter={(value) => `$${value}`}
              domain={['dataMin - 5', 'dataMax + 5']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="price"
              stroke={isPositive ? "#10b981" : "#ef4444"}
              strokeWidth={2}
              fill={`url(#priceGradient-${fundSymbol})`}
              dot={{ fill: isPositive ? "#10b981" : "#ef4444", r: 3 }}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground mb-1">Initial Price</p>
            <p style={{ fontWeight: 600 }}>${initialPrice.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Current Price</p>
            <p style={{ fontWeight: 600 }}>${currentPrice.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Updates</p>
            <p style={{ fontWeight: 600 }}>{priceHistory.length}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
