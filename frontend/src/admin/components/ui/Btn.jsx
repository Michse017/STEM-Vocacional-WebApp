import React from 'react';

export const Btn = ({ children, variant = 'primary', size='sm', ...rest }) => {
  const base = 'btn';
  const cls = [base, `${base}-${variant}`, `${base}-${size}`].join(' ');
  return (
    <button className={cls} {...rest}>{children}</button>
  );
};
