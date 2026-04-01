import React from 'react';

export function Input({ 
  label, 
  error, 
  className = '', 
  ...props 
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {label}
        </label>
      )}
      <input 
        className={`
          w-full px-4 py-2.5 rounded-xl border bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm
          transition-all duration-300 outline-none
          placeholder:text-neutral-400
          ${error 
            ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
            : 'border-neutral-200 dark:border-neutral-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:border-blue-300 dark:hover:border-blue-600'}
        `}
        {...props}
      />
      {error && <span className="text-xs text-red-500 font-medium">{error}</span>}
    </div>
  );
}
