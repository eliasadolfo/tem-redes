# Plataforma TEM — Gestión de redes sociales

Herramienta web + móvil de gestión de contenido social para **Elías Adolfo**,
fundador de **TEM (Tu Escuela de Marcas)**. Un solo usuario humano (el fundador)
asistido por un agente de IA: el asistente redacta y diseña propuestas; el
fundador revisa, edita, aprueba y publica.

Cubre Instagram (Reels) · TikTok · YouTube (Shorts + videos largos) · LinkedIn ·
Newsletter, con el **calendario semanal como pantalla de entrada**.

> Recreación en código del *design handoff* de Claude Design (alta fidelidad).
> Los datos son **mock determinístico**; en producción se reemplazan por las APIs
> reales de cada red.

## Stack

- **React 19 + TypeScript + Vite**
- CSS con tokens del **TEM Design System** (`src/styles/tokens.css`); UI en **Inter**, cards de marca en Montserrat
- Iconos `lucide-react` (stroke 2.4)
- **Supabase** (proyecto propio `tem-redes`, id `dnrtibaxaereffchibco`): tablas `tem_proposals`, `tem_connections`, `tem_newsletter_drafts`
- **Generación con Claude vía n8n**: workflow `TEM Redes — Generar propuestas con Claude (webhook)` (id `BAzg3DOxv8pXlJSX`) en devn8n.tuescuelademarcas.cl. La llave de Anthropic vive en n8n; el navegador solo llama al webhook.

## Correr en local

```bash
cp .env.example .env   # y rellena las variables (ver abajo)
npm install
npm run dev            # http://localhost:5173
```

Variables (`.env`, gitignored):

| Variable | Qué es |
|---|---|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase |
| `VITE_SUPABASE_ANON_KEY` | llave *publishable* (`sb_publishable_…`) |
| `VITE_N8N_GENERAR_URL` | webhook n8n que genera propuestas |

> Si cambias `.env`, reinicia Vite. Sin variables la app corre con los datos mock.

## Flujo de datos

- Al abrir, el store carga propuestas y conexiones desde Supabase (`src/lib/db.ts`).
- Aprobar / descartar / publicar / conectar red → se persiste en Supabase.
- **Generar propuestas** (bandeja y móvil, con campo "tema de la semana") → `src/lib/ai.ts` llama al webhook n8n → Claude redacta N piezas en la voz TEM (JSON) → se insertan en `tem_proposals` y aparecen en la bandeja.
- **Copiloto** (chat del lado izquierdo al abrir una pieza): cada mensaje o chip va al webhook `TEM Redes — Ajustar pieza con Claude (webhook)` (id `hMl6qfVAN5QaSwRC`) → Claude devuelve la pieza ajustada + una respuesta corta → se actualiza el card en vivo y se persiste.
- **Caption editable**: lo que escribes en el textarea se guarda solo (debounce 600 ms).

> Nota técnica: la app envía los webhooks como `text/plain` para evitar el preflight CORS; n8n entrega entonces el body como **string**, así que los nodos Code hacen `JSON.parse` si hace falta. Si agregas un webhook nuevo, repite ese patrón.

## Acceso y seguridad

- **Login** con Supabase Auth (email + contraseña). Un solo usuario: Elías. La contraseña se cambia en **Perfil → Cambiar contraseña**.
- **RLS cerrada**: las tablas `tem_*` solo las lee/escribe el usuario autenticado cuyo correo es el de Elías (políticas `*_owner`).
- **Webhooks n8n protegidos**: la app envía el token de sesión en el body; el nodo "Armar prompt" lo verifica contra `/auth/v1/user` de Supabase y rechaza cualquier otra persona (evita que terceros gasten la API de Claude).

## Deploy (GitHub Pages)

```bash
npm run deploy   # build de producción + push a la rama gh-pages
```

- Repo: `eliasadolfo/tem-redes` · URL pública: **https://eliasadolfo.github.io/tem-redes/**
- `vite.config.ts` usa `base: '/tem-redes/'` solo en producción.
- Las variables `VITE_*` se inyectan en el build desde tu `.env` local (la llave de Supabase es *publishable*; la seguridad real está en RLS + Auth).

El layout es **responsive**: escritorio (sidebar + 7 vistas) por defecto y
**app móvil** (tab bar + sheet) bajo 720px de ancho.

## Estructura

```
src/
  styles/        tokens.css (design system) + global.css (reset, animaciones)
  types.ts       tipos del dominio
  data/mock.ts   propuestas, biblioteca, temas, variantes (copy real)
  lib/
    dates.ts     fechas normalizadas a mediodía (evita saltos DST)
    metrics.ts   serie determinística de alcance + agregación en cliente
    platforms.ts nombres de plataforma
    useIsMobile.ts
  store.tsx      estado global + acciones (Context)
  components/    Card916, CalendarPopover, Toast (compartidos)
  desktop/       Sidebar, DesktopApp, Calendar, Copilot, Inbox, Library,
                 Metrics, Newsletter, Profile
  mobile/        MobileApp, MobileHome, MobileWeek, MobileMetrics,
                 MobileProfile, EditSheet
```

## Design tokens (resumen)

| Token | Valor | Uso |
|---|---|---|
| `--tem-bg` | `#EFEFEF` | canvas |
| `--tem-surface` | `#FFFFFF` | tarjetas/paneles |
| `--tem-ink` | `#111111` | texto principal / piezas programadas |
| `--tem-orange` | `#F47C3C` | acento único |
| `--tem-navy` | `#1D3557` | variante card |
| `--tem-handle` | `#9A9A9A` | único gris (metadatos) |

Dos tipografías con roles estrictos: **SF (system)** para la UI de la app,
**Montserrat 800–900** solo dentro de los cards 9:16. Regla dura: nunca gris para
texto de cuerpo; sobre claro `#111`, sobre oscuro `#FFF`.

## Pendiente (próximas fases)

- Supabase Auth (login de Elías) + cerrar RLS. **Requisito antes de deploy público.**
- Deploy a link público (Vercel).
- OAuth por red (Instagram Graph, TikTok Display, YouTube Data, LinkedIn Marketing) + métricas reales.
- Editor manual de piezas + programación/publicación real.
- Persistir el historial del chat del copiloto y el envío de newsletter.
- Exportar el card 9:16 como imagen/video real para publicar.

## Origen del diseño

Handoff en `~/Downloads/design_handoff_plataforma_tem/` (README con especificación
completa de pantallas, comportamiento y tokens). Voz de marca: español
latinoamericano neutro, tuteo, sin emoji, cierre **¡Hagamos que pase!**
