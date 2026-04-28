import React from 'react';

type Props = {
  id: string;
  label: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

export const AccessibleInput: React.FC<Props> = ({
  id,
  label,
  ...props
}) => {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        {...props}
        className="border rounded px-3 py-2 focus:ring-2"
      />
    </div>
  );
};