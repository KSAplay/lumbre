# Lumbre

Aplicación web para la **gestión operativa y digitalización del flujo de comandas** en un restaurante. Conecta en tiempo real la mesa del cliente, la sala, la recepción, la cocina y el backoffice.

> **Lumbre no es un POS tradicional:** no gestiona cobros por pasarela de pago, ni facturación fiscal, ni stock avanzado. Su foco es la comunicación ágil entre sala y cocina.

---

## Módulos

| Módulo | Ruta | Descripción |
|--------|------|-------------|
| **Login staff** | `/` · `/login` | Acceso del personal mediante PIN |
| **Cliente (mesa)** | `/mesa/:tableId` | Carta por rondas, pedidos, ayuda y solicitud de cuenta tras escanear el QR |
| **Camarero** | `/camarero` | Avisos de sala, confirmación de rondas y comanda manual |
| **Recepción** | `/recepcion` | Plano de mesas, estados operativos y gestión del floor plan |
| **Cocina (KDS)** | `/cocina` | Tickets en tiempo real por rondas e ítems |
| **Backoffice** | `/admin` | Carta/productos, zonas/mesas y generación de códigos QR |

---

## Stack

| Capa | Tecnología |
|------|------------|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS v4, React Router 7, Lucide |
| Backend | Node.js 22 LTS, Express 5, TypeScript |
| Tiempo real | Socket.io 4 |
| Base de datos | MongoDB (Atlas o local) + Mongoose |
| Auth staff | JWT + PIN hasheado (bcrypt) |

---

## Arquitectura (visión general)

```
Cliente / Staff (React)
        │  REST  /api/*
        │  WS    Socket.io
        ▼
   Express + HTTP server
        │
        ├── REST: persiste mutaciones (MongoDB)
        └── Socket.io: notifica a rooms (mesa / rol staff)
```

**Regla de diseño:** toda mutación se persiste por HTTP. Socket.io solo propaga el cambio para que el resto de pantallas se actualicen sin recargar.

### Eventos en tiempo real (resumen)

| Evento | Uso |
|--------|-----|
| `floor:updated` | Plano de mesas/muros actualizado |
| `table:status` | Cambio de estado de una mesa |
| `tables:released` | Mesas en limpieza pasan a libres |
| `order:new` | Nueva ronda desde cliente |
| `order:status` | Confirmación, rechazo, envío a cocina, servido… |
| `order:item:done` | Ítem marcado en KDS |
| `order:alert` | Incidencia de cocina |
| `notification:new` / `notification:read` | Avisos de sala |
| `menu:updated` | Cambios de carta en backoffice |

Salas típicas: `mesa:{tableId}`, `staff:recepcion`, `staff:camarero`, `staff:cocina`, `staff:backoffice`.

---

## Requisitos previos

- **Node.js 22 LTS** (recomendado) y npm
- Una base **MongoDB** (Atlas o instancia local)
- Dos terminales (backend + frontend)

---

## Instalación

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd lumbre
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edita `backend/.env`:

```env
PORT=3000
MONGODB_URI=mongodb+srv://USUARIO:CONTRASEÑA@cluster.xxxxx.mongodb.net/lumbre?retryWrites=true&w=majority
JWT_SECRET=una-cadena-larga-aleatoria-y-secreta
```

| Variable | Obligatorio | Descripción |
|----------|-------------|-------------|
| `PORT` | No (default `3000`) | Puerto HTTP del API y de Socket.io |
| `MONGODB_URI` | Sí | URI de MongoDB (incluye el nombre de la base) |
| `JWT_SECRET` | Sí | Secreto para firmar tokens del personal |

### 3. Datos de demostración (seed)

El seed **vacía** las colecciones y carga zonas, mesas, carta, staff, rondas y avisos de ejemplo:

```bash
# desde backend/
npm run seed
```

**PINs de demo** (tras el seed):

| Rol | PIN |
|-----|-----|
| Recepción | `1111` |
| Cocina | `2222` |
| Camarero | `3333` |
| Backoffice | `9999` |

### 4. Frontend

```bash
cd ../frontend
npm install
```

Configura la IP/host del backend en `frontend/src/config/api.ts` (constante `IP` / origen de la API) para que coincida con la máquina donde corre Express. Por defecto el frontend usa el puerto **3000**.

> Con `npm run dev` el frontend arranca con `vite --host`, accesible desde otros dispositivos de la red local (útil para probar el flujo de mesa en el móvil).

---

## Arranque en desarrollo

Abre **dos terminales**:

```bash
# Terminal 1 — API + Socket.io
cd backend
npm run dev
```

```bash
# Terminal 2 — UI
cd frontend
npm run dev
```

Comprobaciones rápidas:

- Health del API: [http://localhost:3000/api/health](http://localhost:3000/api/health)
- Frontend: la URL que imprime Vite (normalmente `http://localhost:5173`)

### Acceso desde el móvil / otra máquina

1. Backend y frontend en marcha en el PC del restaurante/desarrollo.
2. Misma Wi‑Fi en el dispositivo.
3. Abre la URL de Vite con la IP LAN del PC (p. ej. `http://192.168.x.x:5173`).
4. Asegúrate de que `frontend/src/config/api.ts` apunta a esa misma IP en el puerto del backend.

El cliente de mesa entra por `/mesa/:tableId` (el QR generado en backoffice apunta a esa ruta).

---

## Estructura del monorepo

```
lumbre/
├── backend/                 # API Express + Socket.io + Mongoose
│   ├── src/
│   │   ├── config/          # env, conexión MongoDB
│   │   ├── controllers/
│   │   ├── middleware/      # auth JWT, uploads
│   │   ├── models/
│   │   ├── routes/
│   │   ├── sockets/         # registro IO + catálogo de eventos
│   │   ├── scripts/         # seed
│   │   └── data/            # mock de demo
│   ├── uploads/             # imágenes de platos (estáticas)
│   ├── .env.example
│   └── package.json
├── frontend/                # React + Vite + Tailwind
│   ├── src/
│   │   ├── components/
│   │   ├── views/
│   │   ├── services/
│   │   ├── config/          # origen API
│   │   └── ...
│   └── package.json
├── .gitignore
└── README.md
```

---

## Scripts útiles

| Ubicación | Comando | Descripción |
|-----------|---------|-------------|
| `backend/` | `npm run dev` | API en modo watch (`tsx watch`) |
| `backend/` | `npm run seed` | Reinicia la BBDD con datos de demo |
| `frontend/` | `npm run dev` | Vite con HMR y `--host` |
| `frontend/` | `npm run build` | Build de producción |
| `frontend/` | `npm run preview` | Sirve el build localmente |

---

## API (orientación)

Prefijo base: `/api`

| Grupo | Ejemplos |
|-------|----------|
| Salud | `GET /api/health` |
| Auth | Login staff por PIN → JWT |
| Menú | Carta y categorías |
| Mesas | Plano, estados, liberación de mesas en limpieza |
| Pedidos | Rondas cliente/manual, confirmación, KDS, incidencias |
| Avisos | Ayuda, cuenta, notificaciones de sala |

Las imágenes de platos se sirven como estáticos bajo `/uploads/...`.

---

## Flujo operativo típico

1. Recepción / backoffice configura zonas, mesas y QRs.
2. El comensal escanea el QR → abre la carta en `/mesa/:tableId`.
3. Envía una ronda → aviso al camarero (`order:new` + notificación).
4. El camarero confirma → la ronda llega al KDS (`order:status`).
5. Cocina marca ítems / completa la ronda → aviso `plato_listo` en sala.
6. El cliente puede pedir ayuda o la cuenta; recepción y camarero ven el estado del plano en vivo.

---

## Notas

- No subas `backend/.env` al repositorio (ya está en `.gitignore`). Usa siempre `.env.example` como plantilla.
- El seed es **destructivo**: borra notificaciones, pedidos, mesas, zonas, carta y staff antes de volver a cargar el mock.
- Este proyecto forma parte del **Proyecto Final de DAW** (IES Fernando Wirtz).

---

## Licencia

Uso académico / Proyecto Final. Todos los derechos reservados salvo indicación contraria del autor.
