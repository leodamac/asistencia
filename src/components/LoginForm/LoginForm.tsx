import React, { useState } from "react";
import Input from "../Input";
import Button from "../Button";

interface LoginFormProps {
  onLogin: (email: string, password: string) => void;
  className?: string;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin, className }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email, password);
  };

  return (
    <form className={`login-form ${className}`} onSubmit={handleSubmit}>
      <Input type="email" value={email} onChange={setEmail} placeholder="Correo electrónico" required />
      <Input type="password" value={password} onChange={setPassword} placeholder="Contraseña" required />
      <Button text="Iniciar Sesión" type="submit" />
    </form>
  );
};

export default LoginForm;
