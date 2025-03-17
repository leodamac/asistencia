import { db } from './Firebase/Firebase';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';

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
  const campoObservaciones = tipo === 'entrada' ? 'observaciones_entrada' : 'observaciones_salida';

  await setDoc(docRef, {
    [campoHora]: Timestamp.now(),
    [`quien_autoriza_${tipo}`]: quienAutorizaId,
    [campoObservaciones]: observaciones,
  }, { merge: true });

  return { success: true, message: `Asistencia de ${tipo} registrada correctamente.` };
};
