import { ReactNode } from 'react';

// Simple passthrough provider - Dynamic SDK packages not available
export default function DynamicProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
