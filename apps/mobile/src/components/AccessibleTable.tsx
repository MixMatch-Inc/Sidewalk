import React from 'react';

export const AccessibleTable = ({ children }: any) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border" role="table">
        {children}
      </table>
    </div>
  );
};