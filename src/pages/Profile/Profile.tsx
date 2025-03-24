import ResetPasswordForm from "../../components/ResetPasswordForm";
import Button from "../../components/Button";
import { useUser } from "../../context/UserContext";
import { useState, useEffect } from "react";
import AttendanceForm from "../../components/AttendanceForm";
import { auth} from "../../components/Firebase/Firebase";
import {Timestamp } from "firebase/firestore";
import { fetchAssignedPeople, obtenerDiasActivos } from "../../components/FirebaseServices";
import { useUltimoVacacional } from "../../context/UltimoVacacionalContext";
import AttendanceList from "../../components/AttendanceList";
import { useAttendance } from "../../hooks/useAttendance";

const Profile = () => {
  interface AttendanceRecord {
    entrada?: Timestamp;
    salida?: Timestamp;
  }
  
  type AttendanceData = Record<string, Record<string, AttendanceRecord>>;
  
  const { persona, logout, isLoading } = useUser();
  const [assignedPeople, setAssignedPeople] = useState<{ id: string; nombre: string; apellido: string; fechaNacimiento: string }[]>([]);
  const [isLoadingPeople, setIsLoadingPeople] = useState(true);
  const [dias, setDias] = useState<{ id: string; fecha: string ; activo: boolean}[]>([]);
  const {ultimoVacacional} = useUltimoVacacional();
  const [diasHoy, setDiasHoy] = useState<{ id: string; fecha: string; activo: boolean }[]>([]);
  const { getAttendances } = useAttendance();
  const [attendances, setAttendances] = useState<AttendanceData>({});


  useEffect(() => {
      const fAssignedPeople = async () => {
        const userId = auth.currentUser?.uid;
        if(userId){
          const updatedPeople = await fetchAssignedPeople(userId);
          if(updatedPeople){
            setAssignedPeople(updatedPeople);
          }
        }
      };
    
      fAssignedPeople();
      setIsLoadingPeople(false);
  }, []);

  useEffect(() => {
    const ddd = async () => {
      if(ultimoVacacional){
        setDias(await obtenerDiasActivos(ultimoVacacional));
        refreshAttendances();
      }
    }
    ddd();
  }, [ultimoVacacional]);
  

  useEffect(() => {
    const hoy = new Date().toLocaleDateString("es-ES", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
    });
    setDiasHoy(dias.filter(dia => dia.fecha === hoy && dia.activo));

  }, [dias]);

  const refreshAttendances = async () => {
    const updatedAttendances = await getAttendances(); // Obtiene las asistencias actualizadas
    setAttendances(updatedAttendances); // Actualiza el estado
  };

  return (
    <div className="perfil-container">
      {isLoading || isLoadingPeople? (
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
          {diasHoy.length>0?<>
          <AttendanceForm onAttendanceSubmit={refreshAttendances} assignedPeople={assignedPeople.map(person => `${person.nombre} ${person.apellido}`) }/>
          </>:<>
            <p>NO HAY DÍAS ACTIVOS HABLE CON ALGÚN ENCARGADO DE LA ASISTENCIA</p>
          </>}

          <AttendanceList attendances={attendances}/>
          {persona?.correo && <ResetPasswordForm email={persona.correo} />}
          <Button onClick={logout} text="Cerrar sesión"/>
        </>
      )}
    </div>
  );
};

export default Profile;