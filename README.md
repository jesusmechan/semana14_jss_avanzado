# DancyPet — Semana 14 (React)

Réplica en **React** de la tienda DancyPet de la Semana 09 (Angular + Express). Misma API REST, mismo diseño y la misma funcionalidad: catálogo, carrito, Mercado Pago, cuenta, mascotas y suscripción.

| Carpeta | Tecnología | Puerto | Responsabilidad |
|---|---|---|---|
| `frontend/` | React 19 + Vite + React Router | 5173 | Interfaz de usuario (SPA) |
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
├── api/           ← fetch hacia Express (+ token Bearer)
├── context/       ← Auth, Carrito, Toast, Mascota pendiente
├── components/    ← Navbar, Footer, CarritoPanel, ProductoCard, Toast
├── pages/         ← Inicio, Productos, Detalle, Pago, Cuenta, Mascotas, 404
├── types/         ← interfaces TypeScript
├── utils/         ← soles, filtros, imagen de respaldo
└── styles.css     ← mismos estilos de la Semana 09 / 05
```

Proyecto académico — Universidad Tecnológica del Perú (UTP), 2026.
