import { useEffect } from "react";
import {db} from '../components/Firebase/Firebase'
import { collection, query, where, limit, getDocs} from "firebase/firestore";
import { useUltimoVacacional } from "../context/UltimoVacacionalContext";

const UltimoVacacionalLoader = () => {
  const { setUltimoVacacional} = useUltimoVacacional();

  useEffect(() => {
        console.log("Obteniendo último vacacional desde Firestore...");
        const collectionName = "vacacionales";
        const obtenerVacacionalActual = async ()  => {
            try {
                const q = query(collection(db, collectionName), where('activo', '==', true), limit(1));
                const querySnapshot = await getDocs(q);

                if (querySnapshot.empty) {
                console.log(`No se encontraron documentos activos en la colección "${collectionName}".`);
                }

                const lastActiveDoc = querySnapshot.docs[0];
                const ultimoVacacional = lastActiveDoc.id;
                setUltimoVacacional(ultimoVacacional);

            } catch (error) {
                console.error("Error al obtener el último documento activo:", error);
            }
        }
        console.log("Finalización de obtener el último vacacional desde Firestore...");
        obtenerVacacionalActual();
        
  }, [setUltimoVacacional]);

  return null;
};

export default UltimoVacacionalLoader;
