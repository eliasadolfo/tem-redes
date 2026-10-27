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
- **Descargar imagen** (copiloto y sheet móvil): `src/lib/exportCard.ts` rasteriza la pieza con `html-to-image` a PNG **1080×1920** (Reels/TikTok/Shorts) o **1920×1080** como miniatura si es video de YouTube. Solo incrusta Montserrat (base64 desde los TTF locales) — si se deja que escanee todas las fuentes del documento se cuelga.

> Nota técnica: la app envía los webhooks como `text/plain` para evitar el preflight CORS; n8n entrega entonces el body como **string**, así que los nodos Code hacen `JSON.parse` si hace falta. Si agregas un webhook nuevo, repite ese patrón.

## Acceso y seguridad

- **Login** con Supabase Auth (email + contraseña). Un solo usuario: Elías. La contraseña se cambia en **Perfil → Cambiar contraseña**.
- **RLS cerrada**: las tablas `tem_*` solo las lee/escribe el usuario autenticado cuyo correo es el de Elías (políticas `*_owner`).
- **Webhooks n8n protegidos**: la app envía el token de sesión en el body; el nodo "Armar prompt" lo verifica contra `/auth/v1/user` de Supabase y rechaza cualquier otra persona (evita que terceros gasten la API de Claude).

## UX — criterios aplicados (heurísticas de Nielsen, oct-2026)

Auditoría con la guía *Cimientos de UX* (10 heurísticas + escala 0-4). Lo corregido:

| H | Qué había | Qué hay ahora |
|---|---|---|
| 01 Estado del sistema | Pantalla gris sin nada al arrancar; "Generando…" sin contexto; botones sin bloqueo | Pantalla "Abriendo tu plataforma…", **skeletons** en calendario/bandeja/inicio, tarjeta "Redactando 5 propuestas… 10-20 s", spinner en Descargar, botones bloqueados mientras procesan |
| 02 Mundo real | Etiquetas internas `IG`, `in`, `Shorts` a la vista | Nombres reales: Instagram, LinkedIn, Shorts… (`PLATFORM_LABEL`) |
| 03 Control y libertad | Aprobar/Descartar/Programar eran irreversibles | Toast con **Deshacer** (6 s) en las tres; **Esc** cierra el copiloto; "se guarda solo" visible |
| 04 Consistencia | "Publicar ahora" (no publica) vs "Aprobar y programar"; móvil con botones distintos a escritorio | Una sola acción principal: **Programar publicación**, igual en escritorio y móvil |
| 05 Prevención | Hora "sugerir hora · editar" era decorativa; se podía programar sin redes | **Selector de día + hora** real; botón bloqueado si no hay ninguna red activa, con aviso |
| 06 Reconocer | 3 cuadritos de color sin nombre | Estilo **Blanca / Negra / Azul** con nombre visible y `aria-pressed` |
| 07 Eficiencia | Sin atajos | Enter envía al copiloto, Enter genera con tema, Esc vuelve |
| 08 Minimalismo | 3 botones del mismo peso al pie del copiloto, "Editor manual — próximamente" | 1 primaria + 1 secundaria; se quitó lo que no hacía nada |
| 09 Errores | "No pude generar la imagen", "Correo o contraseña incorrectos." | Dicen qué pasó y cómo seguir; **pantalla "Sin conexión" con Reintentar** si Supabase no responde en 8 s |
| 10 Ayuda | "Sin publicaciones", "Todo revisado" sin pista | Estados vacíos que explican qué va ahí y qué hacer; tooltips en acciones; nota "por ahora publicas tú" |

Checklist rápido de la guía para futuras pantallas: `¿sabe qué pasa? ¿habla su idioma? ¿puede deshacer? ¿es consistente? ¿evita el error? ¿lo ve o lo recuerda? ¿hay atajo? ¿sobra algo? ¿el error explica? ¿hay ayuda ahí?`

## Operación — no dejar que Supabase se pause

El plan Free pausa el proyecto tras ~7 días sin tráfico y la app queda en "Sin conexión". `.github/workflows/keepalive.yml` hace una consulta diaria (08:00 Chile) con los secretos `SUPABASE_URL` / `SUPABASE_ANON_KEY` del repo. Si igual se pausa, reactivar desde el panel de Supabase (o con el MCP: `restore_project`).

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
- Exportar video (hoy solo imagen PNG).

## Origen del diseño

Handoff en `~/Downloads/design_handoff_plataforma_tem/` (README con especificación
completa de pantallas, comportamiento y tokens). Voz de marca: español
latinoamericano neutro, tuteo, sin emoji, cierre **¡Hagamos que pase!**
