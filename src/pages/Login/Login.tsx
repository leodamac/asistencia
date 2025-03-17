import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import LoginForm from "../../components/LoginForm/LoginForm";
import { auth } from "../../components/Firebase/Firebase";
import { useUltimoVacacional } from "../../context/UltimoVacacionalContext";
import MensajeDeCarga from "../../components/MensajeDeCarga/MensajeDeCarga";
import './Login.css';
import '../../styles/todo.css'

const Login: React.FC = () => {
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();
  const {ultimoVacacional} = useUltimoVacacional();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate("/user");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleLogin = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/user");
    } catch (error) {
      setError("Credenciales incorrectas");
    }
  };

  return (
    <div>
      {ultimoVacacional?
      (
        <>
          <h1>Iniciar Sesión</h1>
          {error && <p className="error">{error}</p>}
          <LoginForm onLogin={handleLogin} />
          <p>Vacacional {ultimoVacacional}</p>
        </>
      ):(
        <MensajeDeCarga mensaje="Cargando App del Vacacional..."/>
      )}
    </div>
  );
};

export default Login;
