import { useToast } from '../context/ToastContext';

export function Toast() {
  const { mensaje, visible } = useToast();
  return (
    <div className={`toast${visible ? ' show' : ''}`} role="status" aria-live="polite">
      {mensaje}
    </div>
  );
}
