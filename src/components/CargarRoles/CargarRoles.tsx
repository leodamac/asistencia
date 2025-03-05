import { useState, useEffect } from 'react';
import { db } from '../Firebase/Firebase';
import { collection, getDocs, setDoc, Timestamp, doc } from 'firebase/firestore';
import Papa from 'papaparse';
import '../../styles/todo.css';

interface Rol {
    id: number;
    tipo: string;
}

interface RegistroRol {
    correo: string;
    rol: string;
    id: string;
    status?: string;
    rol_id?: number;
}

const CargarRoles = () => {
    const [roles, setRoles] = useState<Rol[]>([]);
    const [vacacionales, setVacacionales] = useState<string[]>([]);
    const [vacacionalSeleccionado, setVacacionalSeleccionado] = useState('');
    const [registros, setRegistros] = useState<RegistroRol[]>([]);
    const [archivoCargado, setArchivoCargado] = useState(false);

    useEffect(() => {
        cargarRolesDesdeFirestore();
        cargarVacacionalesDesdeFirestore();
    }, []);

    const cargarRolesDesdeFirestore = async () => {
        const rolesSnapshot = await getDocs(collection(db, 'roles'));
        const rolesObtenidos = rolesSnapshot.docs.map(doc => ({
            id: parseInt(doc.id),
            tipo: doc.data().tipo
        }));
        setRoles(rolesObtenidos);
    };

    const cargarVacacionalesDesdeFirestore = async () => {
        const vacacionalesSnapshot = await getDocs(collection(db, 'vacacionales'));
        const vacacionalesObtenidos = vacacionalesSnapshot.docs.map(doc => doc.id);
        setVacacionales(vacacionalesObtenidos);

        // Seleccionar automáticamente el último vacacional como el más reciente
        if (vacacionalesObtenidos.length > 0) {
            setVacacionalSeleccionado(vacacionalesObtenidos[vacacionalesObtenidos.length - 1]);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            Papa.parse<RegistroRol>(file, {
                header: true,
                skipEmptyLines: true,
                complete: (result) => {
                    const registrosConEstado = result.data.map((registro, index) => ({
                        ...registro,
                        id: `fila-${index}`,
                        status: 'Pendiente',
                        rol_id: obtenerIdRol(registro.rol)
                    }));

                    setRegistros(registrosConEstado.map(reg => ({
                        ...reg,
                        status: reg.rol_id === undefined ? '❌ Rol desconocido' : 'Pendiente'
                    })));

                    setArchivoCargado(true);
                },
            });
        }
    };

    const obtenerIdRol = (nombreRol: string): number | undefined => {
        const rol = roles.find(r => r.tipo.toLowerCase() === nombreRol.toLowerCase());
        return rol?.id;
    };

    const procesarCSV = () => {
        procesarRegistros(registros);
        setArchivoCargado(false);
        
    };

    const procesarRegistros = async (lista: RegistroRol[]) => {
        for (const registro of lista) {
            if (registro.rol_id === undefined) {
                actualizarEstado(registro.id, '❌ Rol desconocido');
                continue;
            }

            actualizarEstado(registro.id, '⏳ Procesando...');
            await registrarRolUsuario(registro);
        }
    };

    const registrarRolUsuario = async (registro: RegistroRol) => {
        const { correo, rol_id, id } = registro;

        try {
            const docRef = doc(collection(db, 'roles-usuarios'), `${correo}-${vacacionalSeleccionado}-${rol_id}`);
            await setDoc(docRef, {
                correo,
                vacacional: vacacionalSeleccionado,
                rol_id,
                fecha_registro: Timestamp.now()
            });

            actualizarEstado(id, '✅ Creado');
        } catch (error: any) {
            console.error('Error al registrar rol-usuario:', error);
            actualizarEstado(id, `❌ Error: ${error.message}`);
        }
    };

    const actualizarEstado = (id: string, nuevoEstado: string) => {
        setRegistros(prev => prev.map(r =>
            r.id === id ? { ...r, status: nuevoEstado } : r
        ));
    };

    return (
        <div>
            <h2>Cargar roles desde CSV</h2>

            <div className="contenedor-archivo">
                <select
                    aria-label="Seleccionar vacacional"
                    value={vacacionalSeleccionado}
                    onChange={(e) => setVacacionalSeleccionado(e.target.value)}
                    className="input-archivo"
                >
                    {vacacionales.map(vac => (
                        <option key={vac} value={vac}>{vac}</option>
                    ))}
                </select>

                <input
                    type="file"
                    accept=".csv"
                    id="archivoCSV"
                    onChange={handleFileUpload}
                    className="input-archivo"
                />

                <button
                    onClick={procesarCSV}
                    disabled={!archivoCargado || vacacionalSeleccionado === ''}
                    className="btn-registrar"
                >
                    Registrar Roles
                </button>
            </div>

            <table style={{ marginTop: '20px', width: '100%' }}>
                <thead>
                    <tr>
                        <th>Correo</th>
                        <th>Rol</th>
                        <th>Vacacional</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody>
                    {registros.map(r => (
                        <tr key={r.id}>
                            <td>{r.correo}</td>
                            <td>{r.rol} (ID: {r.rol_id ?? '❓'})</td>
                            <td>{vacacionalSeleccionado}</td>
                            <td>{r.status}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default CargarRoles;
