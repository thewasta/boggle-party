import { config } from 'dotenv';
import '@testing-library/jest-dom';

// Set test environment (evitamos asignar directamente a una propiedad readonly)
process.env = { ...process.env, NODE_ENV: 'test' };

// Load test environment variables
config({ path: '.env.test' });
