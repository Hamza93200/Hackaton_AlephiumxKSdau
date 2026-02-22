import { Card } from './ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface PortfolioDataPoint {
  timestamp: string;
  value: number;
}

interface PortfolioChartProps {
  data: PortfolioDataPoint[];
  title?: string;
}

export function PortfolioChart({ data, title = 'Portfolio Value Over Time' }: PortfolioChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="p-6 bg-white border-border">
        <h3 className="mb-4 gradient-blue-purple" style={{ fontWeight: 600, letterSpacing: '-0.02em' }}>
          {title}
        </h3>
        <div className="h-64 flex items-center justify-center">
          <p className="text-muted-foreground text-sm">
            No portfolio history available yet. Make your first investment to start tracking.
          </p>
        </div>
      </Card>
    );
  }

  // Calculate overall change
  const firstValue = data[0]?.value || 0;
  const lastValue = data[data.length - 1]?.value || 0;
  const totalChange = lastValue - firstValue;
  const totalChangePercent = firstValue > 0 ? ((totalChange / firstValue) * 100) : 0;
  const isPositive = totalChange >= 0;

  // Format data for chart
  const chartData = data.map(point => ({
    date: new Date(point.timestamp).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    }),
    fullDate: new Date(point.timestamp).toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    }),
    value: point.value,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-border rounded-lg shadow-lg p-3">
          <p className="text-sm text-muted-foreground mb-1">{payload[0].payload.fullDate}</p>
          <p className="text-lg" style={{ fontWeight: 600 }}>
            ${payload[0].value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="p-6 bg-white border-border">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="mb-2 gradient-blue-purple" style={{ fontWeight: 600, letterSpacing: '-0.02em' }}>
            {title}
          </h3>
          <div className="flex items-center gap-3">
            <p className="text-3xl" style={{ fontWeight: 600 }}>
              ${lastValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <div className={`flex items-center gap-1 px-2 py-1 rounded ${
              isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {isPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span className="text-sm" style={{ fontWeight: 600 }}>
                {isPositive ? '+' : ''}{totalChangePercent.toFixed(2)}%
              </span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {isPositive ? '+' : ''}${totalChange.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} total
          </p>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <defs>
              <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4169e1" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#4169e1" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" />
            <XAxis 
              dataKey="date" 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `$${value.toLocaleString()}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#4169e1" 
              strokeWidth={2}
              dot={{ fill: '#4169e1', r: 4 }}
              activeDot={{ r: 6 }}
              fill="url(#portfolioGradient)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
