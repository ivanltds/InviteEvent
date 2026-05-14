"use client";

import React from 'react';
import styles from './SearchControl.module.css';

interface SearchControlProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  children?: React.ReactNode;
}

export const SearchControl: React.FC<SearchControlProps> = ({
  value,
  onChange,
  placeholder = "Buscar...",
  className = "",
  children
}) => {
  return (
    <div className={`${styles.controlsRow} ${className}`}>
      <input
        type="text"
        className={styles.searchBox}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {children}
    </div>
  );
};
