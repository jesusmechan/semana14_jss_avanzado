import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Entrega, Mascota } from '../types/mascota';

export interface SuscripcionPendiente {
  mascota: Mascota;
  entrega: Entrega;
}

interface MascotaContextValue {
  pendiente: SuscripcionPendiente | null;
  setPendiente: (valor: SuscripcionPendiente | null) => void;
}

const MascotaContext = createContext<MascotaContextValue | null>(null);

export function MascotaProvider({ children }: { children: ReactNode }) {
  const [pendiente, setPendiente] = useState<SuscripcionPendiente | null>(null);
  const value = useMemo(() => ({ pendiente, setPendiente }), [pendiente]);
  return <MascotaContext.Provider value={value}>{children}</MascotaContext.Provider>;
}

export function useMascotaPendiente(): MascotaContextValue {
  const ctx = useContext(MascotaContext);
  if (!ctx) throw new Error('useMascotaPendiente debe usarse dentro de MascotaProvider');
  return ctx;
}
