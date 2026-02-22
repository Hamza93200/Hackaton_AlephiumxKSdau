import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner@2.0.3';
import { DollarSign } from 'lucide-react';

interface DepositDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientName: string;
  onDeposit: (amount: number, note: string) => Promise<void>;
}

export function DepositDialog({
  open,
  onOpenChange,
  clientName,
  onDeposit,
}: DepositDialogProps) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const depositAmount = parseFloat(amount);
    
    if (!amount || depositAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsSubmitting(true);
    try {
      await onDeposit(depositAmount, note);
      toast.success(`Successfully deposited $${depositAmount.toLocaleString()} to ${clientName}`);
      
      // Reset form
      setAmount('');
      setNote('');
      onOpenChange(false);
    } catch (error: any) {
      console.error('Deposit error:', error);
      toast.error(error.message || 'Failed to deposit funds');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Deposit Funds
          </DialogTitle>
          <DialogDescription>
            Add cash to {clientName}'s account. This will be immediately available for trading.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Deposit Amount (USD) *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id="amount"
                type="number"
                placeholder="1000.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-7"
                min="0"
                step="0.01"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Note (Optional)</Label>
            <Textarea
              id="note"
              placeholder="Add a note about this deposit..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          {amount && parseFloat(amount) > 0 && (
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-sm text-muted-foreground mb-1">Deposit Summary</p>
              <p className="text-2xl gradient-blue-purple" style={{ fontWeight: 600 }}>
                ${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="flex-1 bg-foreground hover:bg-foreground/90"
              disabled={isSubmitting || !amount || parseFloat(amount) <= 0}
            >
              <span className="gradient-blue-purple inline-flex items-center gap-2">
                {isSubmitting ? 'Processing...' : 'Deposit Funds'}
              </span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
