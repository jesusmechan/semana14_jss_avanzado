import { createAlova } from 'alova';
import adapterFetch from 'alova/fetch';
import ReactHook from 'alova/react';
import { API_URL } from '../config';
import { ApiError, avisarNoAutorizado, obtenerToken } from './client';

/**
 * Instancia Alova (Semana 14): estrategias useRequest / resource hooks.
 * Reutiliza el mismo token Bearer que Fetch y Axios.
 */
export const alova = createAlova({
  baseURL: API_URL,
  statesHook: ReactHook,
  requestAdapter: adapterFetch(),
  beforeRequest(method) {
    const token = obtenerToken();
    if (token) {
      method.config.headers = {
        ...method.config.headers,
        Authorization: `Bearer ${token}`,
      };
    }
  },
  responded: {
    async onSuccess(response) {
      if (response.status === 204) {
        return undefined;
      }

      const cuerpo = await response.json().catch(() => null);

      if (!response.ok) {
        const token = obtenerToken();
        if (response.status === 401 && token) {
          avisarNoAutorizado();
        }
        throw new ApiError(
          (cuerpo as { error?: string } | null)?.error || 'Error en la API',
          response.status,
          (cuerpo as { detalles?: Record<string, string> } | null)?.detalles,
        );
      }

      return cuerpo;
    },
    onError() {
      throw new ApiError('No se pudo conectar con la API. Ejecuta "npm run api".', 0);
    },
  },
});
