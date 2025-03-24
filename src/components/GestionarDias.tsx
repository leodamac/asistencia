import React, { useEffect, useState } from "react";
import { Timestamp, collection, deleteDoc, doc, getDoc, setDoc, updateDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "./Firebase/Firebase";
import "./GestionarDias.css";
import { useUltimoVacacional } from "../context/UltimoVacacionalContext";
import { useUser } from "../context/UserContext";

interface Dia {
  id: string;
  fecha: string;
  activo: boolean;
}

interface GestionarDiasProps {
  obtenerDiasActivos: (vacacionalSeleccionado: string) => Promise<Dia[]>;
}

const GestionarDias: React.FC<GestionarDiasProps> = ({
  
  obtenerDiasActivos,
}) => {
  const { ultimoVacacional } = useUltimoVacacional();
  const [vacacionalSeleccionado, setVacacionalSeleccionado] = useState("");
  const [dias, setDias] = useState<Dia[]>([]);
  const [nuevoDia, setNuevoDia] = useState("");
  var { persona } = useUser();

  // Obtener los días activos cuando cambia el vacacionalSeleccionado
  useEffect(() => {
    const fetchDias = async () => {
      if (ultimoVacacional) {
        setVacacionalSeleccionado(ultimoVacacional);
        const diasActivos = await obtenerDiasActivos(ultimoVacacional);
        setDias(diasActivos); // Actualizar el estado de los días
      }
    };
    fetchDias();
  }, [ultimoVacacional, obtenerDiasActivos]);



  const agregarDia = async () => {
    const fechaNueva = new Date(nuevoDia);
  
    const desfaseHorarios = fechaNueva.getTimezoneOffset();

    fechaNueva.setMinutes(fechaNueva.getMinutes() + desfaseHorarios);
  
    const yNuevo = fechaNueva.getFullYear();
    const dNuevo = fechaNueva.getDate();
    const mNuevo = fechaNueva.getMonth(); // Recuerda que los meses van de 0 (enero) a 11 (diciembre)
  
    const idFecha = `${dNuevo.toString().padStart(2, "0")}-${(mNuevo + 1).toString().padStart(2, "0")}-${yNuevo}`;
  
    const diasRef = collection(db, "dias-asistencia");
    const diaDocRef = doc(diasRef, idFecha);
  
    const docSnap = await getDoc(diaDocRef);
    if (docSnap.exists()) {
      alert("El día ya existe en la base de datos");
      return;
    }

    await setDoc(diaDocRef, {
      fecha: Timestamp.fromDate(fechaNueva),
      activo: true,
      vacacional: vacacionalSeleccionado,
      id_genero: persona?.qr,
    });
  
    setNuevoDia("");

    const diasActivos = await obtenerDiasActivos(vacacionalSeleccionado);
    setDias(diasActivos);
  };
  

  const alternarEstadoDia = async (id: string, estadoActual: boolean) => {
    const diaRef = doc(db, "dias-asistencia", id);
    try {
      // Cambiar el estado en Firestore
      await updateDoc(diaRef, { activo: !estadoActual });

      // Actualizar el estado local de los días inmediatamente
      const diasActivos = await obtenerDiasActivos(vacacionalSeleccionado);
      setDias(diasActivos); // Vuelve a actualizar el estado local con los días actualizados
    } catch (error) {
      console.error("Error al cambiar el estado:", error);
    }
  };

  const eliminarDia = async (id: string) => {
    const diaRef = doc(db, "dias-asistencia", id);
    await deleteDoc(diaRef);

    // Actualizar el estado local inmediatamente después de eliminar
    const diasActivos = await obtenerDiasActivos(vacacionalSeleccionado);
    setDias(diasActivos); // Actualiza el estado local con los días restantes
  };

  const obtenerFechaFormateada = (fechaString: string) => {
    const [day, month, year] = fechaString.split("/").map(Number);
    const fecha = new Date(year, month - 1, day);
    if (isNaN(fecha.getTime())) {
      console.error("Fecha inválida");
      return "Fecha inválida";
    }
    return `${fecha.getDate().toString().padStart(2, "0")}/${(fecha.getMonth() + 1).toString().padStart(2, "0")}/${fecha.getFullYear()}`;
  };

  return (
    <div className="dias-container">
      <h2>Días de asistencia</h2>
      <div className="nuevo-dia">
        <input type="date" value={nuevoDia} onChange={(e) => setNuevoDia(e.target.value)} />
        <button onClick={agregarDia}>Agregar Día</button>
      </div>
      <ul className="lista-dias">
        {dias.map(({ id, fecha, activo }) => (
          <li key={id}>
            {obtenerFechaFormateada(fecha)}
            <button 
              className={`desactivar-btn ${activo ? "activo" : "inactivo"}`}
              onClick={() => alternarEstadoDia(id, activo)}
            >
              {activo ? "Desactivar" : "Activar"}
            </button>
            <button className="desactivar-btn" onClick={() => eliminarDia(id)}>❌</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GestionarDias;
