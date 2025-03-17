import Button from "../../components/Button";
import Input from "../../components/Input";

import { useUser } from "../../context/UserContext";
import { QRScanner } from '../../components/QRScanner';
import { useState } from "react";
//import { registrarAsistencia } from "../../components/FirebaseServices";
//import { Timestamp } from 'firebase/firestore';

const Profile = () => {

  const { persona, rolesUsuario, logout, isLoading } = useUser();
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  console.log(rolesUsuario);
  const hoy = new Date();
  const año = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  const dia = String(hoy.getDate()).padStart(2, "0");
  const fechaActual = `${año}-${mes}-${dia}`;

  const horas = String(hoy.getHours()).padStart(2, "0");
  const minutos = String(hoy.getMinutes()).padStart(2, "0");
  const horaActual = `${horas}:${minutos}`;
  
  const [fecha, setFecha] = useState(fechaActual);
  const [hora, setHora] = useState(horaActual);

  const handleScan = async (qrCode: string) => {
    setLastScanned(qrCode);
    alert(lastScanned);
  };

  return (
    <div className="perfil-container">
      {isLoading ? (
        <p>Cargando...</p>
      ) : (
        <>
          <div className="perfil-data">
            <div className="perfil-info">
              <p>{persona?.nombre} {persona?.apellido}</p>
              <p>Email: {persona?.correo}</p>
            </div>
            <div className="profile-photo-container">
              <img src={persona?.url_foto} alt="imagen de perfil" className='profile-photo' />
            </div>
          </div>
          <QRScanner onScanSuccess={ handleScan }></QRScanner>
          <Button onClick={logout} text="Cerrar sesión"/>
          <Input type="date" value={fecha} onChange={setFecha}/>
          <Input type="time" value={hora} onChange={setHora}/>
        </>
      )}
    </div>
  );
};

export default Profile;