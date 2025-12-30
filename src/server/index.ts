// Room management
export { RoomsManager } from './rooms-manager';
export { roomsManager } from './rooms-manager';

// Types
export * from './types';

// Dictionary
export { getDictionary, esValida, getDictionaryStats, clearDictionary } from './dictionary';
export { ensureDictionaryLoaded, isDictionaryLoaded } from './dictionary-init';

// Word validation
export {
  validateWord,
  calculateScore,
  areAdjacent,
  isValidPath,
  type ValidationResult,
  type WordValidationInput,
  type Cell,
} from './word-validator';

// Board generation
export { generateBoard, getBoardStats, isValidBoard } from './board-generator';

// Validation schemas
export {
  wordSubmissionSchema,
  startGameSchema,
  type WordSubmissionInput,
} from './validation';
