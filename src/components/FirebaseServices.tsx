import { db } from './Firebase/Firebase';
import { collection, doc, getDoc, getDocs, query, setDoc, Timestamp, where } from 'firebase/firestore';

export const buscarDatoEnColeccion = async (valorBuscado: string, coleccion: string) => {
  const docRef = doc(db, coleccion, valorBuscado);
  const snapshot = await getDoc(docRef);
  return snapshot.exists() ? snapshot.data() : null;
};

export const registrarAsistencia = async (
  vacacionalId: string,
  voluntarioId: string,
  quienAutorizaId: string,
  hora_marca: Timestamp,
  observaciones: string,
  tipo: 'entrada' | 'salida'
) => {
  const fecha = new Date().toISOString().split('T')[0];
  const asistenciaId = `${vacacionalId}-${voluntarioId}|${fecha}`;
  const docRef = doc(db, 'asistencias-voluntarios', asistenciaId);

  const campoHora = tipo === 'entrada' ? 'hora_real_entrada' : 'hora_real_salida';
  const campoHora_marca = tipo === 'entrada' ? 'hora_marca_entrada' : 'hora_marca_salida';
  const campoObservaciones = tipo === 'entrada' ? 'observaciones_entrada' : 'observaciones_salida';

  await setDoc(docRef, {
    [campoHora]: Timestamp.now(),
    [campoHora_marca]: hora_marca,
    [`quien_autoriza_${tipo}`]: quienAutorizaId,
    [campoObservaciones]: observaciones,
  }, { merge: true });

  return { success: true, message: `Asistencia de ${tipo} registrada correctamente.` };
};

export const obtenerDiasActivos = async (vacacionalSeleccionado: string) => {
    const diasRef = collection(db, "dias-asistencia");
    const q = query(diasRef, where("vacacional", "==", vacacionalSeleccionado));

    const snapshot = await getDocs(q);
    const diasActivos = snapshot.docs.map((doc) => ({
    id: doc.id,
    fecha: doc.data().fecha.toDate().toLocaleDateString(),
    activo: doc.data().activo
    }));

    return diasActivos;
};

export const fetchAssignedPeople = async (userId: string) => {
    if (!userId) {
      return;
    }
    try {
      const q = query(collection(db, "people"), where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      const peopleList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as { nombre: string; apellido: string; fechaNacimiento: string })
      }));
      return peopleList;
    } catch (error) {
      console.error("Error fetching assigned people:", error);
    }
  };