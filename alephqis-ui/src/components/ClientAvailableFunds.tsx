import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { fundApi } from '../utils/api';

interface ClientAvailableFundsProps {
  availableFundIds: string[];
}

export function ClientAvailableFunds({ availableFundIds }: ClientAvailableFundsProps) {
  const [funds, setFunds] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFunds();
  }, [availableFundIds]);

  const loadFunds = async () => {
    if (!availableFundIds || availableFundIds.length === 0) {
      setFunds([]);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fundApi.getAllFunds();
      const availableFunds = response.funds.filter((fund: any) =>
        availableFundIds.includes(fund.id)
      );
      setFunds(availableFunds);
    } catch (error) {
      console.error('Error loading funds:', error);
      setFunds([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading funds...</p>;
  }

  if (funds.length === 0) {
    return (
      <Card className="p-6 bg-white border-border">
        <p className="text-sm text-muted-foreground">
          No funds have been granted to this client yet
        </p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {funds.map((fund) => {
        const returnPercent = fund.returnPercent || 0;
        const isPositive = returnPercent >= 0;
        const currentPrice = fund.currentPrice || 0;
        
        return (
          <Card key={fund.id} className="p-6 bg-white border-border hover:shadow-md transition-shadow">
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="text-base" style={{ fontWeight: 600 }}>
                    {fund.name || 'Unnamed Fund'}
                  </h4>
                  <Badge variant="secondary" className="text-xs">
                    {fund.symbol || 'N/A'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {fund.description || 'No description available'}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Current Price</p>
                  <p className="text-lg" style={{ fontWeight: 600 }}>
                    ${currentPrice.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Performance</p>
                  <p className={`text-lg ${isPositive ? 'text-green-600' : 'text-red-600'}`} style={{ fontWeight: 600 }}>
                    {isPositive ? '+' : ''}{returnPercent.toFixed(2)}%
                  </p>
                </div>
              </div>

              {fund.strategy && (
                <div className="pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-1">Strategy</p>
                  <p className="text-xs">{fund.strategy}</p>
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
