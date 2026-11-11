import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import * as authApi from '../api/auth';
import { configurarAuth } from '../api/client';
import type { DatosRegistro, Sesion, Usuario } from '../types/usuario';

const SESION_KEY = 'dancypet-session';

interface AuthContextValue {
  usuario: Usuario | null;
  autenticado: boolean;
  primerNombre: string;
  token: string | null;
  login: (email: string, password: string, recordar: boolean) => Promise<Sesion>;
  registrar: (datos: DatosRegistro) => Promise<Sesion>;
  cerrarSesion: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function cargarSesion(): Sesion | null {
  try {
    const guardada = localStorage.getItem(SESION_KEY) ?? sessionStorage.getItem(SESION_KEY);
    const sesion = guardada ? (JSON.parse(guardada) as Sesion) : null;
    return sesion?.token && sesion.usuario ? sesion : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<Sesion | null>(() => cargarSesion());

  const cerrarSesion = useCallback(() => {
    localStorage.removeItem(SESION_KEY);
    sessionStorage.removeItem(SESION_KEY);
    setSesion(null);
  }, []);

  useEffect(() => {
    configurarAuth(
      () => sesion?.token ?? null,
      () => cerrarSesion(),
    );
  }, [sesion, cerrarSesion]);

  const guardar = useCallback((nueva: Sesion, recordar: boolean) => {
    localStorage.removeItem(SESION_KEY);
    sessionStorage.removeItem(SESION_KEY);
    (recordar ? localStorage : sessionStorage).setItem(SESION_KEY, JSON.stringify(nueva));
    setSesion(nueva);
  }, []);

  const login = useCallback(
    async (email: string, password: string, recordar: boolean) => {
      const resultado = await authApi.login(email, password);
      guardar(resultado, recordar);
      return resultado;
    },
    [guardar],
  );

  const registrar = useCallback(
    async (datos: DatosRegistro) => {
      const resultado = await authApi.registrar(datos);
      guardar(resultado, true);
      return resultado;
    },
    [guardar],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      usuario: sesion?.usuario ?? null,
      autenticado: sesion !== null,
      primerNombre: sesion?.usuario.nombre.split(' ')[0] ?? '',
      token: sesion?.token ?? null,
      login,
      registrar,
      cerrarSesion,
    }),
    [sesion, login, registrar, cerrarSesion],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
