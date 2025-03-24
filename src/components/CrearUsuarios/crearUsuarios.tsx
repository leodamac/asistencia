import { useState } from 'react';
import { auth, db } from '../Firebase/Firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs, setDoc, Timestamp, doc } from 'firebase/firestore';
import Papa from 'papaparse';
import '../../styles/todo.css';

interface Persona {
    nombre: string;
    apellido: string;
    correo: string;
    cedula: string;
    fecha_nacimiento: string;
    telefono: string;
    qr: string;
    url_foto: string;
    id: string;
    status?: string;
}

const CrearUsuarios = () => {
    const [personas, setPersonas] = useState<Persona[]>([]);
    const [archivoCargado, setArchivoCargado] = useState(false);

    const validarDuplicadosEnCSV = (personas: Persona[]) => {
        const correosVistos = new Set<string>();
        return personas.map(p => {
            if (correosVistos.has(p.correo)) {
                return { ...p, status: '⚠️ Duplicado en archivo' };
            }
            correosVistos.add(p.correo);
            return p;
        });
    };

    const limpiarGrupo = (persona: any) => {
        const { grupo, ...resto } = persona;
        return resto;
    };

    const procesarCSV = () =>{
        procesarPersonas(personas);
        setArchivoCargado(false);
    };

    const isDuplicado = async (correo: string): Promise<boolean> => {
        const q = query(collection(db, 'personas'), where('correo', '==', correo));
        const querySnapshot = await getDocs(q);
        return !querySnapshot.empty;
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            Papa.parse<Persona>(file, {
                header: true,
                skipEmptyLines: true,
                complete: (result) => {
                    const personasConEstado = validarDuplicadosEnCSV(result.data.map((p, index) => ({
                        ...limpiarGrupo(p), id: `fila-${index}`, status: 'Pendiente'
                    })));
                    setPersonas(personasConEstado);
                },
            });
            setArchivoCargado(true);
        }
    };

    const registrarUsuario = async (persona: Persona) => {
        const { correo, id } = persona;
        try {
            await createUserWithEmailAndPassword(auth, correo, correo);
            
        } catch (error: any) {
            console.error('Error al registrar USUARIO:', error);
            actualizarEstado(id, `❌ Error: ${error.message}`);
        }
        registrarPersona(persona);
    }

    const registrarPersona = async (persona: Persona) => {
        const { status, id, fecha_nacimiento, correo, ...personaSinExtras } = persona;
        try {
            if (await isDuplicado(correo)) {
                actualizarEstado(id, '⚠️ Duplicado (se omite)');
                return;
            }

            const docRef = doc(db, 'personas', persona.qr);
            await setDoc(docRef, {
                ...personaSinExtras,
                correo,
                fecha_nacimiento: Timestamp.fromDate(new Date(persona.fecha_nacimiento)),
                fecha_registro: Timestamp.now()
            });
            actualizarEstado(id, '✅ Creado');
        } catch (error: any) {
            console.error('Error al registrar PERSONA:', error);
            actualizarEstado(id, `❌ Error: ${error.message}`);
        }
    };

    const procesarPersonas = async (lista: Persona[]) => {
        for (const persona of lista) {
            actualizarEstado(persona.id, '⏳ Procesando...');
            await registrarUsuario(persona);
        }
    };

    const actualizarEstado = (id: string, nuevoEstado: string) => {
        setPersonas(prev => prev.map(p => 
            p.id === id ? { ...p, status: nuevoEstado } : p
        ));
    };

    return (
        <div>
            <h2>Cargar usuarios desde CSV</h2>
            <div className="contenedor-archivo">
                <input 
                    type="file" 
                    accept=".csv" 
                    id="archivoCSV"
                    onChange={handleFileUpload} 
                    className="input-archivo" 
                />
                <button 
                    onClick={procesarCSV}
                    disabled={!archivoCargado}
                    className="btn-registrar"
                >
                    Registrar Usuarios
                </button>
            </div>

            <table style={{ marginTop: '20px', width: '100%' }}>
                <thead>
                    <tr>
                        <th>Correo</th>
                        <th>Nombre</th>
                        <th>Apellido</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody>
                    {personas.map(p => (
                        <tr key={p.id}>
                            <td>{p.correo}</td>
                            <td>{p.nombre}</td>
                            <td>{p.apellido}</td>
                            <td>{p.status}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default CrearUsuarios;
