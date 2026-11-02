# Plataforma TEM — Gestión de redes sociales

Herramienta web + móvil de gestión de contenido social para **Elías Adolfo**,
fundador de **TEM (Tu Escuela de Marcas)**. Un solo usuario humano (el fundador)
asistido por un agente de IA: el asistente redacta y diseña propuestas; el
fundador revisa, edita, aprueba y publica.

Cubre Instagram (Reels) · TikTok · YouTube (Shorts + videos largos) · LinkedIn ·
Newsletter. Desde la **v2** la app acompaña toda la producción: cada pieza
recorre una **línea de producción** (Idea → Guion → Grabar → Editar → Listo →
Publicado) y el **tablero es la pantalla de entrada**. La especificación del
rediseño está en `docs/REDISENO.md`; lo que costó, en `docs/TRAMPAS.md`.

> Recreación en código del *design handoff* de Claude Design (alta fidelidad).
> Sin `.env` la app corre en **modo demostración**: datos mock y encargos de IA
> con ejemplos, para probar el flujo completo sin gastar API.

## Línea de producción (v2)

| Etapa | Qué pasa | Para avanzar hace falta |
|---|---|---|
| **Idea** | Título, por qué importa, de dónde salió | título + por qué importa |
| **Guion** | Gancho, desarrollo, cierre; formato, duración, lista de tomas | gancho, desarrollo y ≥1 toma |
| **Grabar** | Hoja de rodaje del formato (maqueta + directrices de la Oficina de Contenido), checklist, teleprompter, texto en pantalla por toma, modo de edición, link del bruto, **entrega al editor** | toda la entrega marcada: guion, tomas grabadas, texto en pantalla en cada toma, modo A/B/C, bruto y los ítems manuales del formato |
| **Editar** | Instrucciones de corte, caption + hashtags, links del final y la miniatura | link del video final + caption |
| **Listo** | Día, hora y redes elegidas (sale al calendario) | ≥1 red activa |
| **Publicado** | Resultados y aprendizaje → vuelve a Ideas | — |

Reglas: **hacia atrás siempre** se puede; hacia adelante solo si cumple el requisito y el
botón dice qué falta. **Toda acción de estado tiene Deshacer** (6 s). `status` se mantiene
por compatibilidad (`scheduled` ⇔ Listo/Publicado, `rejected` = descartada). La lógica vive
en `src/lib/stages.ts` (`missingFor`, `nextStage`, `stageSummary`, plantillas).

### Pantallas

- **Tablero** (entrada): 6 columnas por etapa con conteo; arrastrar o "Pasar a →"; vacíos que
  explican cada etapa; skeletons mientras carga.
- **Ficha de la pieza** (`desktop/Copilot.tsx`, `mobile/EditSheet.tsx`): copiloto a la
  izquierda con chips por etapa; al centro "Etapa N de 6" + barra de progreso y un acordeón
  con la etapa actual abierta y las demás resumidas; a la derecha la vista previa, estilos y
  descarga. Una sola primaria: **Pasar a →** (o **Programar publicación** al entrar en Listo).
- **Ideas**: entrada rápida (una línea + de dónde salió; la palabra clave entre `*asteriscos*`
  va en naranja) y **Generar ideas** con el tema de la semana.
- **Grabar** (sesión de grabación): piezas en Grabar en lote; cada una abre el
  **teleprompter** (texto grande, desplazamiento automático con velocidad, pantalla completa,
  espacio pausa, Esc cierra); **Grabada ✓** pide el link del bruto y pasa a Editar.
- **Calendario / Semana**: solo lo que está en Listo o Publicado.
- **Móvil**: Inicio = resumen del tablero + idea rápida + "Qué toca hoy" (sale hoy, por grabar,
  por editar); tab Grabar = sesión de grabación; el sheet sigue la misma lógica por etapa.
- Biblioteca, Métricas, Newsletter, Perfil: sin cambios funcionales.

### Campos de `tem_proposals` (v2)

`stage`, `source`, `script` jsonb `{hook, body, cta, duration_s, format}`, `shots` jsonb
`[{id,text,done,screen?}]` (`screen` = texto en pantalla de esa toma), `checklist` jsonb `[{id,text,done}]`, `raw_url`,
`edit_mode` (`A` reflexivo · `B` instructivo · `C` declaración), `delivery` jsonb `[{id,text,done}]`
(ítems manuales de la entrega al editor; los automáticos se calculan en `deliveryStatus`), `final_url`,
`thumbnail_url`, `notes` (por qué importa / instrucciones de edición), `recorded_at`,
`published_at`, `results` jsonb `{views, likes, saves, comments, learned}`. Mapeo en
`src/lib/db.ts` (`rowToProposal`, `proposalToRow`, `updateProposalFields`; `null` vacía un
campo, `undefined` no lo toca). Filas sin `stage` caen a Idea, o a Listo si `status` era
`scheduled`.

### Encargos de IA (`src/lib/ai.ts`)

Helper `ask(prompt, {system, json, max_tokens})` contra **`VITE_N8N_IA_URL`** (body
`text/plain` JSON `{token, system, prompt, max_tokens, json}` → `{ok, text, json}`). La voz
TEM va en el system del webhook; cada encargo solo añade su pedido y valida la respuesta.

| Encargo | Dónde | Devuelve |
|---|---|---|
| `aiIdeas` | Ideas → Generar ideas; Inicio móvil | `{ideas:[{line:{pre,key,post}, why, source}]}` |
| `aiScript` | Guion → Escribir guion con IA | `{hook, body, cta, duration_s, format, shots:[string]}` |
| `aiShots` | Guion → Sugerir tomas | `{shots:[string]}` |
| `aiCuts` | Editar → Proponer cortes | `{cuts:[{t:"mm:ss", note}], subtitles_style}` (se añade a las instrucciones) |
| `aiCaption` | Editar → Escribir caption | `{caption, tags}` |
| `aiLearning` | Publicado → ¿Qué aprendimos? | `{learned, idea:{line, why}}` (la idea se usa en "Crear idea a partir de esto") |

Todos corren por `runAi` en el store: estado visible (`aiBusy`), mensaje en el copiloto,
**Deshacer** y error que dice cómo seguir. Los webhooks anteriores (`generar-propuestas`,
`ajustar-pieza`) siguen funcionando: el copiloto ajusta titular/etiqueta/caption/hashtags, y
si no existe `VITE_N8N_IA_URL` "Generar ideas" usa el generador de propuestas.

### Video pesado

Cortes, subtítulos y versiones **no** se hacen en la app: se guarda el bruto (link de Drive),
las instrucciones y el resultado (link). No hay uploads de video a Supabase.

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
| `VITE_N8N_AJUSTAR_URL` | webhook n8n del copiloto (ajusta una pieza) |
| `VITE_N8N_IA_URL` | webhook n8n genérico para los encargos por etapa (`ask`) |

> Si cambias `.env`, reinicia Vite. Sin variables la app corre en modo demostración (mock).

## Flujo de datos

- Al abrir, el store carga propuestas y conexiones desde Supabase (`src/lib/db.ts`).
- Mover de etapa / descartar / programar / conectar red → se persiste en Supabase.
- **Generar ideas** (Ideas y móvil, con campo "tema de la semana") → `aiIdeas` (o el webhook de propuestas, que ahora deja las piezas en Idea) → se insertan en `tem_proposals`.
- **Copiloto** (chat del lado izquierdo de la ficha): cada mensaje o chip va al webhook `TEM Redes — Ajustar pieza con Claude (webhook)` (id `hMl6qfVAN5QaSwRC`) → Claude devuelve la pieza ajustada + una respuesta corta → se actualiza el card en vivo y se persiste.
- **Campos que se guardan solos**: todo texto de la ficha (título, notas, guion, caption, links…) se guarda con debounce 600 ms (`components/stages/ui.tsx`).
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

El layout es **responsive**: escritorio (sidebar + 8 vistas) por defecto y
**app móvil** (tab bar de 5 + sheet) bajo 720px de ancho.

## Estructura

```
src/
  styles/        tokens.css (design system) + global.css (reset, animaciones)
  types.ts       tipos del dominio (Proposal, Stage, Script, CheckItem, Results)
  data/mock.ts   piezas de ejemplo en cada etapa, biblioteca, temas, variantes
  lib/
    stages.ts    orden de etapas, nombres, requisitos (missingFor), resúmenes, plantillas
    ai.ts        webhooks + ask() + encargos por etapa (con ejemplos en modo demo)
    db.ts        Supabase: mapeo fila ⇄ Proposal, updateProposalFields
    dates.ts     fechas normalizadas a mediodía (evita saltos DST)
    metrics.ts   serie determinística de alcance + agregación en cliente
    platforms.ts nombres de plataforma (PLATFORM_LABEL: nunca "IG" ni "in" a la vista)
    exportCard.ts PNG 9:16 / miniatura 16:9
  store.tsx      estado global + acciones (setStage, updateFields, finishRecording, run*)
  components/
    PieceCard      la tarjeta única de pieza (tablero, calendario, ideas, móvil)
    Teleprompter   texto grande, auto-scroll, pantalla completa
    RecordSession  sesión de grabación (escritorio y móvil)
    stages/        ui.tsx (campos que se guardan solos, casillas), panels.tsx (6 paneles),
                   StageFlow.tsx (cabecera, acordeón, barra "Pasar a →")
    Card916, CalendarPopover, Toast
  desktop/       Sidebar, DesktopApp, Tablero, Ideas, Calendar, Copilot (ficha),
                 Library, Metrics, Newsletter, Profile
  mobile/        MobileApp, MobileHome, MobileWeek, MobileMetrics,
                 MobileProfile, EditSheet (ficha)
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

- Motor de edición (ffmpeg, estilo TEM) en el VPS, disparado desde la app con el bruto y las instrucciones.
- OAuth por red (Instagram Graph, TikTok Display, YouTube Data, LinkedIn Marketing) + métricas reales en Publicado.
- Programación/publicación real (hoy "Listo" solo programa; publicas tú).
- Persistir el historial del chat del copiloto y el envío de newsletter.
- Exportar video (hoy solo imagen PNG).

## Origen del diseño

Handoff en `~/Downloads/design_handoff_plataforma_tem/` (README con especificación
completa de pantallas, comportamiento y tokens). Voz de marca: español
latinoamericano neutro, tuteo, sin emoji, cierre **¡Hagamos que pase!**
