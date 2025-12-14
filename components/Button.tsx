import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({ children, className = '', ...props }) => {
  return (
    <button
      className={`px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-opacity-75 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
