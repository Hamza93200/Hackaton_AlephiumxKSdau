import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { toast } from 'sonner@2.0.3';
import { CheckCircle } from 'lucide-react';
import { fundApi } from '../utils/api';

interface AddFundToClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddFund: (fundId: string) => void;
  clientName: string;
}

export function AddFundToClientDialog({
  open,
  onOpenChange,
  onAddFund,
  clientName,
}: AddFundToClientDialogProps) {
  const [selectedFund, setSelectedFund] = useState('');
  const [availableFunds, setAvailableFunds] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadFunds();
      setSelectedFund(''); // Reset selection when dialog opens
    }
  }, [open]);

  const loadFunds = async () => {
    setIsLoading(true);
    try {
      const response = await fundApi.getAllFunds();
      setAvailableFunds(response.funds || []);
    } catch (error) {
      console.error('Error loading funds:', error);
      toast.error('Failed to load funds');
      setAvailableFunds([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = () => {
    if (selectedFund) {
      onAddFund(selectedFund);
      setSelectedFund('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="gradient-blue-purple">
            Authorize Fund Access
          </DialogTitle>
          <DialogDescription>
            Authorize {clientName} to trade a specific fund. They will be able to buy and sell shares using their cash balance.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>Select Fund</Label>
            <Select value={selectedFund} onValueChange={setSelectedFund} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue placeholder={isLoading ? "Loading funds..." : "Choose a fund..."} />
              </SelectTrigger>
              <SelectContent>
                {availableFunds.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    {isLoading ? 'Loading...' : 'No funds available. Create a fund first.'}
                  </div>
                ) : (
                  availableFunds.map((fund) => (
                    <SelectItem key={fund.id} value={fund.id}>
                      {fund.name} ({fund.symbol})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              The client will see this fund in their dashboard
            </p>
          </div>

          <div className="rounded-lg bg-accent/50 p-4 space-y-2">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm" style={{ fontWeight: 600 }}>
                  Client Trading Enabled
                </p>
                <p className="text-xs text-muted-foreground">
                  {clientName} will be able to buy and sell shares of this fund using their cash balance
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!selectedFund || isLoading || availableFunds.length === 0}
              className="bg-foreground hover:bg-foreground/90"
            >
              <span className="gradient-blue-purple inline-flex items-center">Authorize Fund</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
