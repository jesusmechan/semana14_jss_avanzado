import { useCallback, useEffect, useRef, useState } from 'react';

export interface ResourceState<T> {
  data: T | undefined;
  loading: boolean;
  error: string;
  reload: () => void;
}

/**
 * Resource Hook (Semana 13): carga asíncrona con loading / error / data / reload.
 * Encapsula el patrón fetch + useEffect + useState usado en catálogo y detalle.
 */
export function useResource<T>(
  loader: () => Promise<T>,
  deps: unknown[] = [],
  mapError: (err: unknown) => string = () => 'Ocurrió un error inesperado.',
): ResourceState<T> {
  const [data, setData] = useState<T>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  useEffect(() => {
    let cancelado = false;
    setLoading(true);
    setError('');

    loaderRef
      .current()
      .then((resultado) => {
        if (!cancelado) {
          setData(resultado);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelado) {
          setError(mapError(err));
          setLoading(false);
        }
      });

    return () => {
      cancelado = true;
    };
    // deps + tick controlan cuándo recargar el recurso
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  return { data, loading, error, reload };
}
