import { useState, useEffect } from 'react';
import { db } from '../Firebase/Firebase';
import { collection, setDoc, doc, getDocs } from 'firebase/firestore';
import Papa from 'papaparse';
import '../../styles/todo.css';

interface Delegado {
    id_delegado: string; // ID único del delegado (QR)
    id_persona: string;  // ID de la persona asociada en la colección "personas"
    id_representante: string; // ID del representante (coordinador)
    id_tipo_delegado: string; // ID del tipo de delegado (por ejemplo, 'asistencia')
    id_vacacional: string;    // ID del vacacional (vacacional 2025, por ejemplo)
    estado: string;           // Estado del delegado (activo o inactivo)
    id: string;               // Identificador visual (fila-x)
}

const CargarDelegados = () => {
    const [delegados, setDelegados] = useState<Delegado[]>([]);
    const [vacacionalSeleccionado, setVacacionalSeleccionado] = useState('');
    const [archivoCargado, setArchivoCargado] = useState(false);

    
    useEffect(() => {
        cargarVacacionalesDesdeFirestore();
    }, []);

    const cargarVacacionalesDesdeFirestore = async () => {
        const vacacionalesSnapshot = await getDocs(collection(db, 'vacacionales'));
        const vacacionalesObtenidos = vacacionalesSnapshot.docs.map(doc => doc.id);

        // Seleccionar automáticamente el último vacacional como el más reciente
        if (vacacionalesObtenidos.length > 0) {
            setVacacionalSeleccionado(vacacionalesObtenidos[vacacionalesObtenidos.length - 1]);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            Papa.parse<Delegado>(file, {
                header: true,
                skipEmptyLines: true,
                complete: (result) => {
                    const delegadosConEstado = result.data.map((d, index) => ({
                        ...d,
                        id_vacacional: vacacionalSeleccionado,
                        id: `fila-${index}`,
                        estado: 'Pendiente'
                    }));
                    setDelegados(delegadosConEstado);
                    setArchivoCargado(true);
                },
            });
        }
    };

    const registrarDelegados = async () => {
        for (const delegado of delegados) {
            actualizarEstado(delegado.id, '⏳ Procesando...');
            await registrarDelegado(delegado);
        }
    };

    const registrarDelegado = async (delegado: Delegado) => {
        const { id_delegado, id, id_persona, id_representante, id_tipo_delegado, id_vacacional, estado } = delegado;

        try {
            const docRef = doc(collection(db, 'delegados'), `${id_delegado}-${vacacionalSeleccionado}`);
            await setDoc(docRef, {
                id_persona,        // ID de la persona asociada
                id_representante,  // ID del representante
                id_tipo_delegado,  // ID del tipo de delegado (asistencia, etc.)
                id_vacacional,     // ID del vacacional
                estado,            // Estado del delegado (activo/inactivo)
                fecha_asignacion: new Date() // Fecha de asignación
            });

            actualizarEstado(id, '✅ Creado');
        } catch (error: any) {
            console.error('Error al registrar delegado:', error);
            actualizarEstado(id, `❌ Error: ${error.message}`);
        }
    };

    const actualizarEstado = (id: string, nuevoEstado: string) => {
        setDelegados(prev => prev.map(d =>
            d.id === id ? { ...d, estado: nuevoEstado } : d
        ));
    };

    return (
        <div>
            <h2>Cargar Delegados desde CSV</h2>

            <div className="contenedor-archivo">
                <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="input-archivo"
                />
                <button
                    onClick={registrarDelegados}
                    disabled={!archivoCargado}
                    className="btn-registrar"
                >
                    Registrar Delegados
                </button>
            </div>

            <table style={{ marginTop: '20px', width: '100%' }}>
                <thead>
                    <tr>
                        <th>ID Persona</th>
                        <th>ID Delegado</th>
                        <th>ID Representante</th>
                        <th>ID Tipo Delegado</th>
                        <th>ID Vacacional</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody>
                    {delegados.map(d => (
                        <tr key={d.id}>
                            <td>{d.id_persona}</td>
                            <td>{d.id_delegado}</td>
                            <td>{d.id_representante}</td>
                            <td>{d.id_tipo_delegado}</td>
                            <td>{d.id_vacacional}</td>
                            <td>{d.estado}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default CargarDelegados;
