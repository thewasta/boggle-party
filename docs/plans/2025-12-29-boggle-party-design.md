# Boggle Party - Diseño del Sistema

**Fecha:** 2025-12-29
**Versión:** 1.0

## Resumen del Proyecto

Juego multijugador en línea de Boggle en español donde los jugadores encuentran palabras arrastrando el dedo sobre un tablero de letras. El juego incluye sincronización en tiempo real, validación instantánea de palabras y una fase final de revelación animada con puntuaciones.

---

## 1. Arquitectura General

### Enfoque Arquitectónico

**Servidor centralizado con Next.js + Pusher**

- Next.js maneja creación de salas, generación de tableros, validación de palabras
- Pusher sincroniza eventos en tiempo real (unirse, iniciar juego, resultados)
- Diccionario cargado en memoria del servidor (Set con 7.9MB de palabras)
- Validación server-side previene trampas

### Componentes Principales

**Servidor (Next.js):**
- **API Routes**: `/api/rooms/*`, `/api/games/*` para creación de salas, unión de jugadores, inicio de partidas, validación de palabras
- **Estado de salas**: Memoria en servidor con estructura Map
- **Diccionario**: Set de palabras en español cargado al inicio desde archivo local

**Cliente (Next.js App Router):**
- Landing page: Crear sala o unirse con código
- Sala de espera: Lista de jugadores, host inicia juego
- Juego: Tablero interactivo + HUD con tiempo y palabra actual
- Resultados: Ranking final con animación de revelación

**Pusher:**
- Canal privado por sala: `presence-game-{roomId}`
- Sincroniza eventos críticos del juego
- Revelación secuencial de palabras al final

---

## 2. Estructura de Datos

### Estado de Sala

```typescript
type Room = {
  id: string;
  code: string;
  host: string;
  players: Map<string, Player>;
  gridSize: 4 | 5 | 6;
  status: 'waiting' | 'playing' | 'finished';
  startTime?: number;
  duration: number;
}

type Player = {
  id: string;
  name: string;
  avatar: string;
  score: number;
  foundWords: string[];
  board: string[][];
}

type WordSubmission = {
  playerId: string;
  word: string;
  path: {row: number, col: number}[];
}
```

### Eventos Pusher

- `player-joined`: Nuevo jugador se une a la sala
- `player-left`: Jugador abandona la sala
- `game-started`: Juego inicia, incluye startTime, duration, board
- `game-ended`: Tiempo finalizado, transición a resultados
- `reveal-word`: Palabra revelada individualmente (secuencia)
- `results-complete`: Fin de revelación, mostrar ranking final

---

## 3. Mecánica de Juego

### Generación de Tableros

- Distribución de letras según frecuencias del español (similar a Scrabble)
- Vocales más frecuentes (E, A, O) que consonantes raras (W, K, X)
- Generación aleatoria ponderada por frecuencia
- Tablero único por jugador (cada uno tiene su propio tablero)

### Interacción Táctil

**Selección de letras:**
- Usuario toca primera letra → arrastra → levanta para confirmar
- Línea visual conectando letras seleccionadas mientras arrastra

**HUD Superior (30% pantalla):**
- Timer sincronizado
- Palabra actual siendo formada
- Indicador visual de validez: ✓ verde (válida) o ✗ rojo (inválida)

**Feedback al levantar dedo:**
- Válida y nueva → palabra añadida, animación de éxito
- Inválida → feedback visual (sacudida, flash rojo)
- Repetida → feedback específico ("Ya encontraste esta palabra")

**Validación:**
- Cliente valida en tiempo real para feedback instantáneo
- Servidor confirma validez definitiva y guarda la palabra

### Sistema de Puntuación

**Puntos por longitud:**
- 3 letras: 1pt
- 4 letras: 1pt
- 5 letras: 2pt
- 6 letras: 3pt
- 7+ letras: 5pt

**Bonificación palabra única (×2):**
- Calculada al finalizar el juego
- Solo un jugador encontró esa palabra
- Se muestra con indicador visual especial en revelación

---

## 4. Flujo de Partida

### Fase 1: Creación de Sala

- Usuario ve landing con opciones: "Crear sala" o "Unirse con código"
- Al crear sala:
  - Servidor genera código único de 6 caracteres (ej: "ABC123")
  - Crea estado inicial con host
  - Usuario recibe código para compartir
  - Redirige a sala de espera

### Fase 2: Sala de Espera

- Muestra: código de sala, lista de jugadores con avatares
- Solo host ve botón "Iniciar partida" y selecciona tamaño (4×4, 5×5, 6×6)
- Tiempo según tamaño:
  - 4×4: 2 minutos (120s)
  - 5×5: 3 minutos (180s)
  - 6×6: 4 minutos (240s)
- Mínimo 2 jugadores para iniciar
- `player-joined` actualiza lista en tiempo real

### Fase 3: Juego Activo

- Countdown: 3-2-1 sincronizado en todos los clientes
- Servidor genera tablero único por jugador
- Evento `game-started` con: `{startTime, duration, board}`
- Todos inician timer simultáneo
- Jugadores arrastran para formar palabras
- Cliente envía palabras a `POST /api/games/{roomId}/words`
- Servidor valida, guarda y responde éxito/error

### Fase 4: Fin del Juego

- Timer llega a 0 en todos los clientes
- Clientes bloquean interacción, muestran "Esperando resultados..."
- Servidor detecta fin del tiempo
- Evento `game-ended` → todos cambian a pantalla de resultados

### Fase 5: Revelación de Resultados

- Pantalla muestra: escaleras/escalones, avatares en la base
- Servidor emite eventos `reveal-word` uno por uno (delay 1-2s)
- Cada evento:
  1. Palabra aparece en UI
  2. Emoji del jugador sube N escalones (según puntos)
  3. Si es única, indica "¡ÚNICA! ×2"
  4. Puntuación del jugador se actualiza
- Después de todas las palabras → `results-complete`
- Muestra ranking final con ganador destacado

---

## 5. Tecnologías y Dependencias

### Stack Principal

**Frontend:**
- Next.js 16 (App Router)
- React 19
- TypeScript 5
- Tailwind CSS v4
- shadcn/ui (componentes base)

**Real-time:**
- Pusher Channels
- pusher (servidor)
- pusher-js (cliente)

**Validación:**
- Diccionario local: `data/dictionary.json`
- Cargado en Set para búsqueda O(1)
- Sin dependencias externas

**Utilidades:**
- Zod: Validación de esquemas
- nanoid: Generación de IDs únicos

### Dependencias a Instalar

```bash
pnpm add pusher pusher-js zod nanoid
pnpm add -D @types/pusher-js
```

### Variables de Entorno

```env
PUSHER_APP_ID=your_app_id
PUSHER_KEY=your_key
PUSHER_SECRET=your_secret
PUSHER_CLUSTER=your_cluster
PUSHER_USE_TLS=true

NEXT_PUBLIC_PUSHER_KEY=your_key
NEXT_PUBLIC_PUSHER_CLUSTER=your_cluster
```

---

## 6. Validación de Adyacencia

**Reglas:**
- Solo letras adyacentes (horizontal, vertical, diagonal)
- No se puede usar la misma casilla dos veces en una palabra
- Cliente valida visualmente mientras arrastra
- Servidor valida también al recibir (anti-trampas)

**Implementación:**
- DFS o BFS para verificar trayectoria válida
- Set de celdas visitadas en la palabra actual
- Validación de que cada paso sea adyacente al anterior

---

## 7. Diccionario Local

**Fuente:**
- Archivo JSON descargado de `an-array-of-spanish-words`
- Ubicación: `data/dictionary.json` (7.9MB)

**Carga en servidor:**
```typescript
// server/dictionary.ts
const fs = require('fs');
const path = require('path');

const palabrasArray = fs.readFileSync(
  path.join(process.cwd(), 'data', 'dictionary.json'),
  'utf-8'
);

const diccionario = new Set(JSON.parse(palabrasArray));

export const esValida = (palabra: string) =>
  diccionario.has(palabra.toLowerCase());

export const buscarPalabras = (lista: string[]) =>
  lista.filter(p => esValida(p));
```

---

## 8. Consideraciones de Performance

**Memoria:**
- 7.9MB en memoria para diccionario (acceptable)
- Set permite búsqueda O(1)
- Estado de salas en memoria del servidor

**Validación:**
- Instantánea con Set en servidor
- Opcional: subset optimizado en cliente para validación inmediata sin latencia

**Pusher:**
- Eventos ligeros (JSON pequeño)
- Rate limiting en envío de palabras
- Revelación secuencial controlada por servidor

---

## 9. Siguientes Pasos

1. Configurar Pusher y obtener credenciales
2. Descargar dictionary.json y colocar en `data/`
3. Instalar dependencias
4. Implementar servidor de salas (rooms-manager)
5. Implementar generación de tableros
6. Implementar validación de palabras
7. Crear UI components básicos
8. Implementar flujo de juego completo
9. Añadir animaciones y polishes
10. Testing multijugador

---

**Fin del documento de diseño v1.0**
