import React from "react";

interface InputProps {
  type: "text" | "email" | "password" | "number" | "date" | "time";
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

const Input: React.FC<InputProps> = ({ type, value, onChange, placeholder, required = false }) => {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
    />
  );
};

export default Input;
