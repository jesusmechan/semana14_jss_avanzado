import axios, { type AxiosRequestConfig } from 'axios';
import { API_URL } from '../config';
import { ApiError, avisarNoAutorizado, obtenerToken } from './client';

/**
 * Cliente HTTP con Axios (Semana 14).
 * Comparte el mismo Bearer token que Fetch y Alova.
 */
export const axiosClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

axiosClient.interceptors.request.use((config) => {
  const token = obtenerToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosClient.interceptors.response.use(
  (respuesta) => respuesta,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status ?? 0;
      const token = obtenerToken();
      if (status === 401 && token) {
        avisarNoAutorizado();
      }

      const cuerpo = error.response?.data as
        | { error?: string; detalles?: Record<string, string> }
        | undefined;

      throw new ApiError(
        cuerpo?.error || error.message || 'Error en la API',
        status,
        cuerpo?.detalles,
      );
    }

    throw new ApiError('No se pudo conectar con la API. Ejecuta "npm run api".', 0);
  },
);

export async function apiAxios<T>(ruta: string, config: AxiosRequestConfig = {}): Promise<T> {
  const respuesta = await axiosClient.request<T>({ url: ruta, ...config });
  return respuesta.data;
}
