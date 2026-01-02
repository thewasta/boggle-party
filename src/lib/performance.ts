/**
 * Performance utilities for development monitoring and production optimization
 */

/**
 * Measure component render time in development
 */
export function measureRender(componentName: string): () => void {
  if (process.env.NODE_ENV !== "development") return () => {};

  const startTime = performance.now();

  return () => {
    const endTime = performance.now();
    console.log(`${componentName} render time: ${endTime - startTime}ms`);
  };
}

/**
 * Debounce function execution
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | undefined;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function execution
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
