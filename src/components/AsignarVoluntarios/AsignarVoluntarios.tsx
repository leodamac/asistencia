import React, { useState } from 'react';
import Papa from 'papaparse';
import { collection, setDoc, doc } from 'firebase/firestore';
import { db } from '../Firebase/Firebase';

import '../../styles/todo.css';

interface Voluntario {
    id_persona: string; 
    id_voluntario: string; 
    id_vacacional: string;
    estado: string;
    id: string;
    status?: string;
}

const AsignarVoluntarios = () => {
    const [voluntarios, setVoluntarios] = useState<Voluntario[]>([]);
    const [archivoCargado, setArchivoCargado] = useState(false);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            Papa.parse<Voluntario>(file, {
                header: true,
                skipEmptyLines: true,
                complete: (result) => {
                    const voluntariosConEstado = result.data.map((v, index) => ({
                        ...v,
                        id: `fila-${index}`,
                        status: 'Pendiente',
                    }));
                    setVoluntarios(voluntariosConEstado);
                    setArchivoCargado(true);
                },
            });
        }
    };

    const registrarVoluntarios = async () => {
        for (const voluntario of voluntarios) {
            actualizarEstado(voluntario.id, '⏳ Procesando...');
            await registrarVoluntario(voluntario);
        }
    };

    const registrarVoluntario = async (voluntario: Voluntario) => {
        const { id_voluntario, id,  status, ...datosVoluntario } = voluntario;
        try {
            const docRef = doc(collection(db, 'voluntarios'), id_voluntario);
            await setDoc(docRef, {
                ...datosVoluntario,
                fecha_asignacion: new Date()
            });

            actualizarEstado(id, '✅ Creado');
        } catch (error: any) {
            console.error('Error al registrar voluntario:', error);
            actualizarEstado(id, `❌ Error: ${error.message}`);
        }
    };

    const actualizarEstado = (id: string, nuevoEstado: string) => {
        setVoluntarios(prev => prev.map(v => 
            v.id === id ? { ...v, status: nuevoEstado } : v
        ));
    };

    return (
        <div>
            <h2>Asignar Voluntarios</h2>
            <div className="contenedor-archivo">
                <input type="file" accept=".csv" onChange={handleFileUpload} className="input-archivo"/>
                <button onClick={registrarVoluntarios} disabled={!archivoCargado} className="btn-registrar">Registrar Voluntarios</button>
            </div>
            {archivoCargado && (
                <>
                    <table border={1}>
                        <thead>
                            <tr>
                                <th>ID Persona</th>
                                <th>ID Voluntario</th>
                                <th>ID Vacacional</th>
                                <th>Estado del Proceso</th>
                            </tr>
                        </thead>
                        <tbody>
                            {voluntarios.map(v => (
                                <tr key={v.id}>
                                    <td>{v.id_persona}</td>
                                    <td>{v.id_voluntario}</td>
                                    <td>{v.id_vacacional}</td>
                                    <td>{v.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            )}
        </div>
    );
};

export default AsignarVoluntarios;
