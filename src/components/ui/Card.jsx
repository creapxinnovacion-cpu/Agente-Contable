import React from 'react';

export function Card({ children, className = '', ...props }) {
  return (
    <div
      /* 
        NOTA SOBRE EL COLOR TRANSPARENTE:
        El efecto transparente y difuminado viene de la clase "glass".
        Puedes cambiar ese color base transparente directamente en el archivo src/index.css 
        buscando la regla ".glass" (para modo claro) o ".dark .glass" (para modo oscuro) 
        y modificando su propiedad 'background: rgba(...)'.
  
        */
      className={`bg-gray-100/40 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl p-6 shadow-xl shadow-gray-400/30 dark:shadow-black/40 ${className}`}
      {...props}
    >
      {children}

    </div >
  );
}
