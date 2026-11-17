# DancyPet — Frontend (React + TSX)

SPA en **React 19 + Vite + TypeScript + Bootstrap 5**. Consume la API Express de `../backend` con **Fetch**, **Axios** y **Alova**.

## Scripts

| Script | Descripción |
| --- | --- |
| `npm run dev` | Levanta la API y React a la vez |
| `npm start` | Solo Vite en `http://localhost:5173` |
| `npm run api` | Solo la API en `http://localhost:3001` |
| `npm run build` | Build de producción |

Antes del primer `npm run dev`, instala el backend y crea su `.env` a partir de `.env.example`.

## Clientes HTTP

| Cliente | Módulo | Consumido por |
| --- | --- | --- |
| Fetch | `src/api/client.ts` | productos, auth, mascotas |
| Axios | `src/api/axiosClient.ts` | pedidos / pagos |
| Alova | `src/api/alovaClient.ts` | categorías (`useRequest`) |

Resource hook propio: `src/hooks/useResource.ts`.
