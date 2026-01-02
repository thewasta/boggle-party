"use client";

import { useState } from "react";

export function SkipLink() {
  const [isFocused, setIsFocused] = useState(false);

  if (!isFocused) return null;

  return (
    <a
      href="#main-content"
      className="fixed top-4 left-4 z-50 bg-indigo-600 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    >
      Saltar al contenido principal
    </a>
  );
}
