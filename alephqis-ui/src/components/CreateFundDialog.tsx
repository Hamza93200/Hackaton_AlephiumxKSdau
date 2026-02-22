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

interface CreateFundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateFund: (fundData: any) => void;
}

export function CreateFundDialog({
  open,
  onOpenChange,
  onCreateFund,
}: CreateFundDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    fundId: '',
    description: '',
    strategy: '',
    initialPrice: '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.symbol || !formData.fundId || !formData.initialPrice) {
      toast.error('Please fill in all required fields');
      return;
    }

    const fundData = {
      ...formData,
      initialPrice: parseFloat(formData.initialPrice),
      createdAt: new Date().toISOString(),
    };

    onCreateFund(fundData);
    toast.success(`Fund "${formData.name}" created successfully`);
    
    // Reset form
    setFormData({
      name: '',
      symbol: '',
      fundId: '',
      description: '',
      strategy: '',
      initialPrice: '',
    });
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Create New Fund</DialogTitle>
          <DialogDescription>
            Add a new investment fund to the platform. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Fund Name *</Label>
              <Input
                id="name"
                placeholder="Delta Neutral Fund"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="symbol">Symbol *</Label>
              <Input
                id="symbol"
                placeholder="BQ-DN"
                value={formData.symbol}
                onChange={(e) => handleChange('symbol', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fundId">Fund ID *</Label>
            <Input
              id="fundId"
              placeholder="fund-001"
              value={formData.fundId}
              onChange={(e) => handleChange('fundId', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="strategy">Strategy Type</Label>
            <Input
              id="strategy"
              placeholder="Delta Neutral, Trend Following, etc."
              value={formData.strategy}
              onChange={(e) => handleChange('strategy', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of the fund's investment strategy..."
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="initialPrice">Initial Price (USD) *</Label>
            <Input
              id="initialPrice"
              type="number"
              placeholder="100.00"
              value={formData.initialPrice}
              onChange={(e) => handleChange('initialPrice', e.target.value)}
              min="0"
              step="0.01"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="flex-1 bg-foreground hover:bg-foreground/90"
            >
              <span className="gradient-blue-purple inline-flex items-center">Create Fund</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
