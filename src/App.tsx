import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from "./components/Login/Login";
import UserProfile from './components/UserProfile/UserProfile';
import CrearUsuarios from './components/CrearUsuarios/crearUsuarios';
import CargarRoles from './components/CargarRoles/CargarRoles';
import AsignarVoluntarios from './components/AsignarVoluntarios/AsignarVoluntarios';
import AsignarDelegados from './components/AsignarDelegados/AsignarDelegados';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login/>} />
        <Route path="/user-profile" element={<UserProfile/>} />
        <Route path="/crearUsuarios" element={<CrearUsuarios/>} />
        <Route path="/cargarRoles" element={<CargarRoles/>} />
        <Route path="/asignarVoluntarios" element={<AsignarVoluntarios/>}/>
        <Route path="/asignarDelegados" element={<AsignarDelegados/>}/>
        
        <Route path="*" element={<Login/>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App
