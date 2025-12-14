import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id?: string;
  type: string;
}

export const Input: React.FC<InputProps> = ({ label, id, type, ...props }) => {
  const inputId = id || `input-${label.toLowerCase().replace(/\s/g, '-')}`;
  return (
    <div className="flex flex-col">
      <label htmlFor={inputId} className="mb-2 text-lg font-semibold text-gray-700">
        {label}
      </label>
      <input
        id={inputId}
        type={type}
        className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition duration-200 outline-none text-gray-800"
        {...props}
      />
    </div>
  );
};