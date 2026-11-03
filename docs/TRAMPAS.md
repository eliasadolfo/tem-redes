# Trampas — lo que costó construir la v2

Memoria de errores y decisiones no obvias, para que quien siga no vuelva a caer.

## Datos y estado

- **`undefined` no vacía un campo en Supabase.** `updateProposalFields` ignora `undefined`
  (significa "no tocar"). Para deshacer un encargo de IA que llenó `script` o `shots` hay que
  mandar `null`. Por eso `ProposalFields` admite `null` y `applyFields` convierte `null` →
  `undefined` solo para la copia en memoria.
- **`setStage` lee `sRef.current`, que es el estado del último render.** Si marcas tomas y
  en el mismo tick mueves de etapa, la validación ve las tomas viejas. Solución:
  `finishRecording` hace todo en una sola actualización; no encadenar `updateFields` +
  `setStage` con `setTimeout(0)`.
- **Dentro del objeto de acciones no existe `actions`.** Las acciones que llaman a otras
  (`ideaFromLearning` → `addIdea`/`reject`, `generateIdeas` → `generate`) se definen como
  `const` antes del `return` del `useMemo`.
- **Un solo campo `notes`** sirve para "por qué importa" (Idea) y para las instrucciones de
  edición (Editar). Es a propósito: una sola nota corrida por pieza; "Proponer cortes" la
  amplía en vez de pisarla. Si algún día estorba, añadir `edit_notes` jsonb aparte.
- **`day` de una idea nueva** = día de la semana de hoy (lunes = 0); los fines de semana cae a
  lunes. El calendario solo la muestra cuando llega a Listo, así que no molesta antes.
- **Filas de la v1 sin `stage`**: `defaultStage(status)` → `scheduled` cae a Listo, lo demás a
  Idea. No se migraron datos; se resuelve al leer.

## UI

- **El espejo del estado (`sRef`) tiene que ser sincrónico.** Al principio se actualizaba
  solo al renderizar (`sRef.current = s`). Dos guardados seguidos (campos con debounce de 600 ms,
  "texto en pantalla" de varias tomas) leían un estado viejo y se pisaban: la segunda escritura
  borraba la primera, en pantalla y en Supabase. Ahora `patch()` calcula el estado nuevo a
  partir de `sRef.current`, lo guarda ahí en el acto y se lo pasa a React; `flash` también usa
  `patch`. Además `useDebounced` llama siempre a la última versión de `onCommit` (ref), y las
  tomas se editan con `actions.updateShot` (una toma, estado fresco), no reescribiendo la lista.
- **Listas por defecto con ids aleatorios.** `checklist`/`delivery` vacíos se reemplazan por la
  lista del formato en cada render; el primer clic la persiste (ids estables desde ahí). Tratar
  `[]` como "sin lista", no solo `null`.
- **Campos que se guardan solos y la IA.** Un `useState` local con debounce pisa lo que
  escribe la IA si no se sincroniza. `useDebounced` (en `stages/ui.tsx`) guarda el último
  valor confirmado en un ref y solo reemplaza el texto local cuando el valor externo cambia
  de verdad.
- **`.press:disabled` tiene `pointer-events: none`**: el `title` de un botón bloqueado no se
  ve. Por eso el motivo ("Falta el link del video final") se escribe al lado del botón, no
  solo en el tooltip.
- **El texto "qué falta" junto al botón** de la tarjeta se puso en una línea aparte (columna),
  no al lado: en columnas de 190 px el botón se iba a tres líneas.
- **Esc tiene dos dueños.** La ficha cierra con Esc y el teleprompter también. El
  teleprompter escucha en fase de captura y hace `stopPropagation`; la ficha además ignora
  Esc mientras `tele` está abierto.
- **Pantalla completa** (`requestFullscreen`) falla en iframes y en algunos navegadores sin
  gesto del usuario; se captura el error y se avisa con un toast, no se rompe nada.
- **Nombres internos a la vista.** `PLAT_FILTER_LABEL` del calendario mostraba "IG". Siempre
  `PLATFORM_LABEL`. Las etapas se nombran con `STAGE_LABEL`, nunca con la clave.
- **`react-refresh` y exportar tipos desde `store.tsx`.** Al exportar `AiTask` desde el mismo
  archivo que el provider, Vite invalida el módulo entero y en caliente aparece "useStore
  debe usarse dentro de StoreProvider". Es solo HMR: recargar la página. Si molesta, mover el
  tipo a `types.ts`.

## IA

- **Modo demostración.** Sin `.env` (ni Supabase ni `VITE_N8N_IA_URL`), los encargos
  devuelven ejemplos fijos (`demo*` en `ai.ts`) para poder recorrer el flujo. Con Supabase
  configurado pero sin `VITE_N8N_IA_URL`, el botón avisa que el asistente no está configurado
  (no inventa datos en producción).
- **El JSON puede venir como texto.** `ask()` acepta `json` ya parseado o lo saca de `text`
  quitando las vallas ```` ``` ````. Si igual no hay JSON, lanza error y el toast dice cómo
  seguir.
- **"Generar ideas" tiene dos caminos.** Si solo existe el webhook de propuestas
  (`VITE_N8N_GENERAR_URL`), lo usa y deja las piezas en Idea con `source`. Si existe el
  webhook genérico, usa `aiIdeas`. En ambos casos hay Deshacer (descarta las nuevas).
- **Aprendizaje** se pide en un solo JSON `{learned, idea}` (el diseño hablaba de texto +
  JSON): menos llamadas y una sola validación. La idea queda en un ref (`pendingIdea`) hasta
  que se toca "Crear idea a partir de esto".

## Sistema v2 (3-nov-2026)

- **`src/styles/tem/` es copia de `Marca/Sistema_v2`.** No se edita aquí: un valor que falta se
  agrega primero allá y se vuelve a copiar. La composición de pantallas vive en `styles/app.css`.
- **La grilla de la ficha necesita `grid-template-rows: minmax(0, 1fr)`.** Con la fila implícita
  (`auto`) crece con el contenido y la barra de avance queda bajo el borde de la pantalla.
- **Una pieza no sigue el tema.** `Card916` y `exportCard` usan colores fijos; la interfaz sí
  cambia con el modo oscuro. Las medidas de ambas salen de `lib/pieza.ts`.
- **El formato de una pieza sin guion es su `type`.** Usar `pieceFormat(p)`, nunca
  `p.script?.format` directo: si no, una Historia o un Carrusel en Idea caen en la guía de Reel.
- **Historia:** una sola frase vale (`body` vacío) y no lleva modo de edición.
- **Sin datos de ejemplo con Supabase configurado.** Si fallan las piezas, se avisa con
  Reintentar. `data/mock.ts` solo corre sin `.env`.

## Entorno

- **El sandbox no deja abrir puertos**: `vite` falla con `EPERM`. Hay que levantarlo fuera del
  sandbox o permitir `allowLocalBinding`.
- **`.claude/launch.json` está versionado**: no borrarlo ni reemplazarlo para probar; usar
  `npx vite --port 5174` aparte.
- **Worktree + guard de comandos**: los heredocs largos con `python3 - <<EOF` o `cat >>` se
  rechazan como "demasiado complejos"; escribir archivos con la herramienta de edición.
