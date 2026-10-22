# Plataforma de Gestión y Coordinación de Emergencias (SIGEM)

Canal digital unificado compuesto por **API Centralizada**, **Base de Datos Única (PostgreSQL)**, **Dashboard Web (Next.js)** y **App Móvil (React Native/Expo)**.

---

## 🏛️ Arquitectura y Principio Rector: Registro Único de Datos (RNF-07)

El sistema garantiza que la información capturada en el reporte inicial por el ciudadano fluye automáticamente por las etapas operativas sin necesidad de re-digitarla:

```
[ CIUDADANO ] (RF-01)
     │ Reporta emergencia (descripcion, latitud, longitud, foto/video)
     ▼
[ REPORTADO ] ──► Operador valida y tipifica (RF-03)
     │
     ▼
[ CLASIFICADO ] ──► Despachador asigna unidad de respuesta (RF-05)
     │
     ▼
[ ASIGNADO ] ──► Unidad parte hacia la escena
     │
     ▼
[ EN_ATENCION ] ──► Personal en campo arriba y atiende en escena
     │
     ▼
[ CERRADO ] ──► Se registra resolución final y se libera la unidad
```

Cada transición genera un registro inmutable en **`LogAuditoria`** (**RNF-09**), capturando el usuario actor, la acción, el cambio de estado y los datos sensibles modificados.

---

## 📂 Estructura del Proyecto

```
c:\P.I-de-Gestion-y-Cordinacion-de-Emergencia\
├── backend/                  # API REST Node.js + Express + TypeScript + Prisma ORM
│   ├── prisma/
│   │   ├── schema.prisma     # Esquema Relacional de Base de Datos
│   │   ├── schema.sql        # DDL SQL explícito para PostgreSQL
│   │   └── seed.ts           # Datos iniciales (Admin, Operadores, Catálogos, Unidades)
│   └── src/
│       ├── app.ts
│       ├── server.ts
│       ├── middlewares/      # Auth JWT, RBAC por rol, validación Zod, error handling
│       └── modules/
│           ├── auth/         # Login y Registro
│           ├── emergencias/  # Transacciones de cambio de estado y trazabilidad
│           ├── catalogo/     # Catálogo administrable de tipos de emergencia (RF-09)
│           ├── unidades/     # Gestión de flota y recursos de respuesta
│           └── usuarios/     # Administración de actores del sistema
│
├── web-dashboard/            # Panel Operativo Next.js 14 + Tailwind CSS (Operador/Despachador/Admin)
│   └── src/
│       ├── app/
│       │   ├── login/        # Acceso con autenticación por rol
│       │   └── dashboard/    # Triage, Despacho, Unidades, Catálogo y Auditoría
│       └── components/       # Modales de clasificación y asignación, timeline, badges
│
└── mobile-app/               # App Móvil Expo / React Native (Ciudadano / Personal de Campo)
    ├── app/
    │   ├── (auth)/           # Login y Registro de Ciudadanos
    │   ├── (ciudadano)/      # Reportar SOS con GPS y cámara, mis reportes, mapa
    │   └── (campo)/          # Asignaciones de la unidad, inicio de atención, cierre
    └── src/
        ├── components/       # Formulario con captura automática de GPS y fotos
        ├── contexts/         # Sesión persistida con AsyncStorage
        └── hooks/            # useLocation, useAuth
```

---

## 🚀 Guía de Puesta en Marcha (Comandos)

### 1. Prerrequisitos
- Node.js >= 18
- PostgreSQL corriendo localmente o en Docker (ej. puerto 5432)

### 2. Base de Datos y Backend API

```bash
cd backend

# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
# Copiar .env.example a .env y ajustar DATABASE_URL con tus credenciales
cp .env.example .env

# 3. Generar cliente Prisma y aplicar migraciones
npx prisma generate
npx prisma migrate dev --name init

# 4. Poblar datos iniciales (Usuarios de prueba, Catálogo RF-09 y Unidades)
npm run seed

# 5. Iniciar la API en modo desarrollo
npm run dev
# -> Disponible en http://localhost:3001/api/v1
```

#### Credenciales Semilla Creadas:
| Rol | Email | Contraseña |
| --- | --- | --- |
| **Administrador** | `admin@emergencias.gob` | `admin123` |
| **Operador** | `operador1@emergencias.gob` | `operador123` |
| **Despachador** | `despachador1@emergencias.gob` | `despachador123` |
| **Personal Campo** | `campo1@emergencias.gob` | `campo123` |

---

### 3. Dashboard Web Operativo

```bash
cd ../web-dashboard

# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.local.example .env.local

# 3. Iniciar entorno de desarrollo Next.js
npm run dev
# -> Disponible en http://localhost:3000
```

---

### 4. Aplicación Móvil (React Native / Expo)

```bash
cd ../mobile-app

# 1. Instalar dependencias
npm install

# 2. Iniciar bundler de Expo
npx expo start
# Escanea el código QR con Expo Go en Android/iOS o presiona 'w' para web
```
