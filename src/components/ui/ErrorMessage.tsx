"use client";

import { motion } from "framer-motion";

interface ErrorMessageProps {
  error?: Error;
  onRetry?: () => void;
}

export function ErrorMessage({ error, onRetry }: ErrorMessageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="min-h-screen flex items-center justify-center bg-gray-50"
    >
      <div className="text-center p-8">
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
          className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4"
        >
          <span className="text-4xl">⚠️</span>
        </motion.div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          ¡Ups! Algo salió mal
        </h1>

        <p className="text-gray-600 mb-6">
          Ha ocurrido un error inesperado. Por favor, intenta recargar la página.
        </p>

        {error?.message && (
          <details className="mb-6 text-left">
            <summary className="cursor-pointer text-sm text-gray-500">
              Ver detalles del error
            </summary>
            <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto max-w-md mx-auto">
              {error.message}
            </pre>
          </details>
        )}

        {onRetry && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onRetry}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium"
          >
            <span>↻</span>
            Reintentar
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
