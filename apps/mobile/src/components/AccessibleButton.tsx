import React from 'react';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
};

export const AccessibleButton: React.FC<Props> = ({
  label,
  ...props
}) => {
  return (
    <button
      {...props}
      aria-label={label}
      className="focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {props.children}
    </button>
  );
};