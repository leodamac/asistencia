import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { auth} from '../Firebase/Firebase';
import { FormEvent, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import './Login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();


    useEffect(() => {
      onAuthStateChanged(auth, (user) => {
        if (user) {
          navigate('/user-profile');
        }
      });
    });

    const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault(); 
      try {
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/user-profile');

      } catch (error) {
        console.error('Error en el inicio de sesión:', error);
      }
    };
 
    return (
        <div>
          <form onSubmit={handleLogin} className="formulario-login">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Correo electrónico"
              required
              autoComplete="off"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              required
              autoComplete="off"
            />
            <button type="submit">Iniciar Sesión</button>
          </form>
        </div>
    );
  };
  
  export default Login;