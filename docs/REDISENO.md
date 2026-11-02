# Rediseño v2 — de "publicar" a "producir contenido"

Especificación para construir. Quien la ejecute (agente o persona) debe leer también `README.md`
(stack, Supabase, webhooks, deploy) y respetar el design system (`src/styles/tokens.css`).

## 1. Por qué

La v1 gira alrededor de **publicar**: la pieza nace lista y solo le falta salir. Pero el trabajo real de
Elías está **antes** (qué digo, cómo lo digo, qué grabo) y **después de grabar** (cortar, subtitular,
miniatura, versiones). La v2 acompaña **toda la producción**.

## 2. Lógica: la pieza recorre una línea de producción

Campo `stage` en `tem_proposals` (ya migrado en Supabase):

| stage | Nombre visible | Qué pasa | Para avanzar hace falta |
|---|---|---|---|
| `idea` | Idea | Material crudo: algo que dijo Elías, un caso, un dato | título (line) + por qué importa |
| `guion` | Guion | Gancho, desarrollo, cierre/CTA, formato, duración, **lista de tomas** | `script.hook` y `script.body` no vacíos; ≥1 toma |
| `grabar` | Grabar | Hoja de rodaje del formato (`src/lib/formatos.ts`: maqueta, zonas seguras, encuadre, luz, audio, ritmo, no hacer), checklist por formato, teleprompter, texto en pantalla por toma, modo de edición A/B/C, link del bruto y **entrega al editor** | `deliveryMissing(p) === null`: guion, todas las tomas `done`, `screen` en cada toma, `edit_mode`, `raw_url` y los ítems manuales (`delivery`) marcados. Como un editor: no se renderiza a medias (2-nov-2026, directrices de Producción y Arte de la Oficina de Contenido) |
| `editar` | Editar | Instrucciones de corte, subtítulos, miniatura, caption + hashtags, link del final | `final_url` + `caption` |
| `listo` | Listo | Día, hora y redes elegidas | ≥1 red activa |
| `publicado` | Publicado | Resultados y aprendizaje | — (cierra el ciclo: el aprendizaje vuelve a Ideas) |

Reglas (H03/H05): mover **hacia atrás** siempre se puede; **hacia adelante** solo si cumple el requisito, y
el botón explica qué falta. Toda acción tiene **Deshacer** (ya existe `flash(text, undo)` en el store).
`status` se mantiene por compatibilidad: `scheduled` ⇔ `listo`/`publicado`, `rejected` = descartada.

### Columnas nuevas (ya existen)
`stage`, `source`, `script` jsonb `{hook, body, cta, duration_s, format}`, `shots` jsonb `[{id,text,done}]`,
`checklist` jsonb `[{id,text,done}]`, `raw_url`, `final_url`, `thumbnail_url`, `notes`, `recorded_at`,
`published_at`, `results` jsonb `{views, likes, saves, comments, learned}`.

## 3. Pantallas (escritorio + móvil, mismos componentes)

1. **Tablero** (nueva pantalla de entrada, reemplaza al Calendario como `view` inicial): 6 columnas por
   etapa con la misma tarjeta de pieza. Encabezado de columna con conteo. Arrastrar o botón "Pasar a →".
   Vacío por columna explica la etapa (H10). Skeletons mientras carga (ya existe `loading`).
2. **Ficha de la pieza** (evoluciona `Copilot.tsx`): cabecera con "Etapa N de 6 · Nombre" y barra de
   progreso; **una pestaña por etapa** (solo se muestra la etapa actual expandida; las demás plegadas con
   resumen). Copiloto a la izquierda en todas las etapas; sus chips cambian por etapa.
   - Guion: campos gancho / desarrollo / cierre, formato, duración; botón "Escribir guion con IA";
     lista de tomas editable (añadir, marcar, borrar) y "Sugerir tomas".
   - Grabar: checklist (luz, mic, encuadre, batería, fondo), **teleprompter** (texto grande, scroll
     automático con velocidad, pantalla completa), tomas con casilla, campo "link del bruto".
   - Editar: instrucciones de edición (texto libre + "Proponer cortes"), campo "link del video final",
     "link de miniatura", caption + hashtags (reusar lo existente), "Descargar miniatura/imagen".
   - Listo: lo que hoy es "Programar" (día, hora, redes) + "Programar publicación".
   - Publicado: resultados (números) + "¿Qué aprendimos?" (IA) → botón "Crear idea a partir de esto".
3. **Sesión de grabación** (nueva, pensada para el teléfono): lista de piezas en `grabar`, cada una abre el
   teleprompter; al terminar, "Grabada ✓" pide el link del bruto y pasa a `editar`.
4. **Calendario**: igual que hoy pero solo muestra `listo`/`publicado` (lo programado).
5. **Ideas**: entrada rápida (una línea + de dónde salió) y "Convertir en guion". Botón "Generar ideas"
   usa el tema de la semana.
6. **Biblioteca, Métricas, Newsletter, Perfil**: sin cambios funcionales en esta fase.

Móvil: Inicio = resumen del tablero (cuántas por etapa + "qué toca hoy"); tab "Grabar" = sesión de
grabación; el sheet de edición sigue la misma lógica por etapa.

## 4. IA

Webhook genérico **`VITE_N8N_IA_URL`** (`POST`, body como `text/plain` JSON — ver README):
`{ token, system?, prompt, max_tokens?, json?: true }` → `{ ok, text, json }`. La voz TEM ya va en el
system del webhook; solo añadir el encargo. Helper sugerido `src/lib/ai.ts: ask(prompt, {system, json})`
que agrega el token de sesión (ya existe `getToken()`).

Encargos por etapa (todos con `json: true` salvo "aprendizaje"):
- Ideas: `{ideas:[{line:{pre,key,post}, why, source}]}` a partir de notas + tema.
- Guion: `{hook, body, cta, duration_s, format, shots:[string]}` a partir de la idea y el formato.
- Tomas: `{shots:[string]}`.
- Cortes: `{cuts:[{t:"mm:ss", note}], subtitles_style}` a partir de la duración y el guion.
- Caption: reusar `adjustPiece` o pedir `{caption, tags}`.
- Aprendizaje: texto corto (3 líneas) + `{idea:{line, why}}` para alimentar Ideas.

Los webhooks existentes (`generar-propuestas`, `ajustar-pieza`) siguen funcionando.

## 5. Video pesado (fuera del navegador)

Cortes, subtítulos y versiones NO se hacen en la app: la app guarda el bruto (link de Google Drive), las
instrucciones y el resultado (link). El motor de edición (ffmpeg, estilo TEM) corre aparte; más adelante
en el VPS y disparado desde la app. No construir uploads de video a Supabase (1 GB gratis).

## 6. Criterios de calidad (las 10 heurísticas — guía *Cimientos de UX*)

01 estado siempre visible (etapa, qué falta, spinners/skeletons, botones bloqueados mientras procesan) ·
02 palabras de producción, nunca nombres de columnas · 03 Deshacer y mover atrás siempre · 04 misma
tarjeta y mismo botón primario "Pasar a →" en todas partes · 05 selectores, no texto libre, para día/hora/
formato; requisitos visibles antes de bloquear · 06 plantillas de ganchos y de tomas a la vista · 07 Esc
cierra, Enter envía, sesión de grabación en lote · 08 una acción primaria por pantalla · 09 errores que
dicen qué pasó y cómo seguir · 10 estados vacíos y tooltips que explican cada etapa.

## 7. Orden de construcción (commits pequeños; cada uno pasa `npx tsc --noEmit` y `npm run build`)

1. Tipos + `db.ts` + store: `stage`, `script`, `shots`, `checklist`, urls, `results`; `setStage(id, stage)`
   con validación y undo; `updateFields`.
2. Tablero + tarjeta unificada + estados vacíos; `view` inicial = `tablero`; Sidebar actualizado.
3. Ficha por etapas (Guion, Grabar, Editar, Listo, Publicado) con copiloto contextual.
4. `ai.ts: ask()` + encargos de Guion, Tomas, Ideas.
5. Sesión de grabación + teleprompter (escritorio y móvil).
6. Editar: instrucciones + cortes IA + miniatura; Publicado: resultados + aprendizaje → idea.
7. README actualizado (pantallas, campos, encargos de IA). Memoria de trampas en `docs/TRAMPAS.md`.

Lo que NO hacer: tocar las políticas RLS, los webhooks existentes, ni subir binarios a Supabase.
