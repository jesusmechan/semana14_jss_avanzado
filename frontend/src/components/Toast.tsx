import { useToast } from '../context/ToastContext';

export function Toast() {
  const { mensaje, visible } = useToast();
  // Clase propia para no chocar con el Toast de Bootstrap
  return (
    <div className={`app-toast${visible ? ' show' : ''}`} role="status" aria-live="polite">
      {mensaje}
    </div>
  );
}
