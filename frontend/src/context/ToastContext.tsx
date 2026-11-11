import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';

const DURACION_MS = 2800;

interface ToastContextValue {
  mensaje: string;
  visible: boolean;
  mostrar: (mensaje: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [mensaje, setMensaje] = useState('');
  const [visible, setVisible] = useState(false);
  const temporizador = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const mostrar = useCallback((texto: string) => {
    clearTimeout(temporizador.current);
    setMensaje(texto);
    setVisible(true);
    temporizador.current = setTimeout(() => setVisible(false), DURACION_MS);
  }, []);

  const value = useMemo(() => ({ mensaje, visible, mostrar }), [mensaje, visible, mostrar]);

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider');
  return ctx;
}
