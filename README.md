# DancyPet — Semana 14 (React)

Réplica en **React** de la tienda DancyPet de la Semana 09 (Angular + Express). Misma API REST, mismo diseño y la misma funcionalidad: catálogo, carrito, Mercado Pago, cuenta, mascotas y suscripción.

Este proyecto concentra el temario de las **semanas 11 a 15** (introducción, elementos, hooks, servicios e integración).

| Carpeta | Tecnología | Puerto | Responsabilidad |
|---|---|---|---|
| `frontend/` | React 19 + Vite + TSX + Bootstrap 5 | 5173 | Interfaz de usuario (SPA) |
| `backend/` | Node.js 22 + Express 5 | 3001 | API REST, autenticación y persistencia en JSON |

## Cómo ejecutar

Requisito: **Node.js 22.9 o superior**.

```bash
# Solo la primera vez
cd backend
npm install
copy .env.example .env   # y configura TOKEN_SECRET / Mercado Pago

cd ../frontend
npm install

# Levantar API + React juntos
npm run dev
```

También por separado:

```bash
# Terminal 1
cd backend
npm run dev     # http://localhost:3001

# Terminal 2
cd frontend
npm start       # http://localhost:5173
```

## Cobertura del temario (semanas 11–15)

| Semana | Tema | Dónde se ve en este proyecto |
|---|---|---|
| **11** | React, Vite, **JSX/TSX**, **Bootstrap** | Todo el frontend en `.tsx`; Bootstrap en `main.tsx` + badges del footer |
| **12** | Navegación, componentes, formularios | `App.tsx` (React Router), `components/`, formularios en Cuenta / Mascotas / Pago |
| **13** | State / Context / Ref / **Resource Hooks** | Contextos en `context/`; `useRef` en Auth/Pago/Navbar; `hooks/useResource.ts` |
| **14** | **Fetch**, **Axios**, **Alova** + REST | Ver tabla de servicios abajo |
| **15** | Integración | Catálogo + carrito + auth + hooks + tres clientes HTTP en una sola SPA |

### Servicios HTTP (Semana 14)

| Cliente | Archivos | Uso en la app |
|---|---|---|
| **Fetch API** | `api/client.ts`, `api/productos.ts`, `api/auth.ts`, `api/mascotas.ts` | Productos, auth y mascotas |
| **Axios** | `api/axiosClient.ts`, `api/pedidos.ts` | Pedidos y config de pagos |
| **Alova** | `api/alovaClient.ts`, `api/categorias.ts` | Categorías con `useRequest` |

Los tres comparten el mismo Bearer token vía `configurarAuth` / `obtenerToken`.

## Funcionalidades

- **Catálogo:** categorías, búsqueda, orden y ficha de producto
- **Carrito:** panel lateral en `localStorage`, subtotal, IGV 18 % y total
- **Pago:** Mercado Pago (Payment Brick) o contra entrega
- **Cuenta:** registro, login (“Recordarme”) e historial de pedidos
- **Mascotas:** CRUD con foto opcional y suscripción mensual de alimento

Tarjeta de prueba: `5031 7557 3453 0604`, vence `11/30`, CVV `123`, titular `APRO`, DNI `12345678`.

## Arquitectura del frontend React

```text
frontend/src/
├── api/           ← Fetch + Axios + Alova hacia Express
├── hooks/         ← useResource (resource hook)
├── context/       ← Auth, Carrito, Toast, Mascota pendiente
├── components/    ← Navbar, Footer, CarritoPanel, ProductoCard, Toast
├── pages/         ← Inicio, Productos, Detalle, Pago, Cuenta, Mascotas, 404
├── types/         ← interfaces TypeScript (TSX)
├── utils/         ← soles, filtros, imagen de respaldo
└── styles.css     ← tema DancyPet (por encima de Bootstrap)
```

Proyecto académico — Universidad Tecnológica del Perú (UTP), 2026.
