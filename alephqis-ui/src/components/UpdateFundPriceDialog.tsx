import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { fundApi } from '../utils/api';
import { useWallet } from '@alephium/web3-react';
import { QISFund } from '../artifacts/ts';

interface Fund {
  id: string;
  name: string;
  symbol: string;
  currentPrice: number;
  initialPrice: number;
  change24h?: number;
  priceHistory?: Array<{ price: number; timestamp: string }>;
  contractAddress?: string;
}

interface UpdateFundPriceDialogProps {
  fund: Fund | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPriceUpdated: () => void;
}

const ONE_ALPH = 10n ** 18n

// Convertit un prix en dollars (ex: 102.50) en attoALPH (18 décimales)
function priceToAttoAlph(price: number): bigint {
  return BigInt(Math.floor(price * 1_000_000)) * (10n ** 12n)
}

export function UpdateFundPriceDialog({
  fund,
  open,
  onOpenChange,
  onPriceUpdated,
}: UpdateFundPriceDialogProps) {
  const { signer, account } = useWallet()
  const [newPrice, setNewPrice] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!fund) return null

  const currentPrice = fund.currentPrice || fund.initialPrice || 0
  const parsedNew    = parseFloat(newPrice)
  const priceChange  = newPrice && !isNaN(parsedNew)
    ? ((parsedNew - currentPrice) / currentPrice * 100).toFixed(2)
    : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newPrice || isNaN(parsedNew) || parsedNew <= 0) {
      toast.error('Please enter a valid price')
      return
    }

    if (!signer || !account) {
      toast.error('Connect your Admin wallet first')
      return
    }

    setIsSubmitting(true)

    try {
      // 1. Mise à jour on-chain si le fund a un contrat déployé
      if (fund.contractAddress) {
        toast.info('Waiting for wallet signature...')

        await QISFund.at(fund.contractAddress).transact.updateNav({
          signer,                              // ✅ signer directement ici
          attoAlphAmount: ONE_ALPH,            // couvre gas + DUST
          args: { newNav: priceToAttoAlph(parsedNew) },
        })

        toast.success('NAV confirmed on-chain ✓')
      }

      // 2. Mise à jour dans la base de données
      const token = localStorage.getItem('accessToken')
      if (!token) throw new Error('Session expired — please log in again')

      await fundApi.updatePrice(token, fund.id, parsedNew)

      setNewPrice('')
      onOpenChange(false)
      onPriceUpdated()

    } catch (error: any) {
      console.error('UpdateNav error:', error)

      // Messages d'erreur lisibles
      if (error.message?.includes('NotEnoughBalance')) {
        toast.error('Insufficient ALPH for gas in your wallet')
      } else if (error.message?.includes('user rejected')) {
        toast.error('Transaction rejected in wallet')
      } else {
        toast.error(error.message || 'Transaction failed')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Update Fund NAV</DialogTitle>
          <DialogDescription>
            Synchronise the Net Asset Value on the Alephium blockchain.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">

          {/* Prix actuel */}
          <div className="p-4 bg-accent/50 rounded-lg border space-y-1">
            <p className="text-sm text-muted-foreground">Current NAV</p>
            <p className="text-3xl font-bold">${currentPrice.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">{fund.name} · {fund.symbol}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPrice">New NAV (USD)</Label>
              <Input
                id="newPrice"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="e.g. 105.00"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                required
                disabled={isSubmitting}
              />
              {/* Aperçu du changement */}
              {priceChange && (
                <p className={`text-xs font-medium ${
                  parseFloat(priceChange) >= 0
                    ? 'text-green-500'
                    : 'text-red-500'
                }`}>
                  {parseFloat(priceChange) >= 0 ? '+' : ''}{priceChange}% vs current NAV
                </p>
              )}
            </div>

            {/* Avertissement wallet non connecté */}
            {!account && (
              <p className="text-xs text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 rounded p-2">
                ⚠️ No wallet connected — connect your admin wallet to sign the transaction.
              </p>
            )}

            <div className="flex gap-3">
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
                className="flex-1 bg-foreground text-background"
                disabled={isSubmitting || !account}
              >
                {isSubmitting ? 'Signing...' : 'Update NAV'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}