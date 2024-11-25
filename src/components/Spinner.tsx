// Spinner.tsx

import React from 'react';

interface SpinnerProps {
  className?: string;
}

export function Spinner({ className }: SpinnerProps) {
  return (
    <svg
      className={`animate-spin ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25 text-gray-300"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75 text-[#E85B4E]"
        fill="currentColor"
        d="M12 2a10 10 0 00-2 19.584V12H2A10 10 0 0012 2z"
      ></path>
    </svg>
  );
}
