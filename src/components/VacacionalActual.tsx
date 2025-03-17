import { collection, query, where, limit, getDocs} from "firebase/firestore";
import {db} from '../components/Firebase/Firebase'
import { useEffect, useState } from "react";

const useVacacionalActual = () => {
    const [vacacional, setVacacional] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        console.log("Obteniendo versión desde Firestore...");
        const collectionName = "vacacionales";
        const obtenerVacacionalActual = async ()  => {
            try {
                const q = query(collection(db, collectionName), where('activo', '==', true), limit(1));
                const querySnapshot = await getDocs(q);

                if (querySnapshot.empty) {
                console.log(`No se encontraron documentos activos en la colección "${collectionName}".`);
                }

                const lastActiveDoc = querySnapshot.docs[0];
                setVacacional(lastActiveDoc.id);

            } catch (error) {
                console.error("Error al obtener el último documento activo:", error);
            } finally {
                setLoading(false);
            }
        };

        obtenerVacacionalActual();
      }, []);
      return {vacacional, loading};
};
export default useVacacionalActual;