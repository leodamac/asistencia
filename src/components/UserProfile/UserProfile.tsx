import { useEffect, useState } from 'react';
import { db, auth } from '../Firebase/Firebase';
import { collection, query, where, getDocs, doc, setDoc, Timestamp, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, Typography, Button, Box } from '@mui/material';
import './UserProfile.css';
import { Html5QrcodeScanner } from 'html5-qrcode';
import {QRCodeCanvas} from 'qrcode.react';

interface RolUsuario {
    correo: string;
    rol_id: number;
    vacacional: string;
}

interface Persona {
    apellido: string;
    cedula: string;
    correo: string;
    fecha_nacimiento: string;
    fecha_registro: string;
    nombre: string;
    qr: string;
    telefono: string;
    url_foto: string;
}

const UserProfile = () => {
        const [rolesUsuario, setRolesUsuario] = useState<RolUsuario[]>([]);
        const [persona, setPersona] = useState<Persona | null>(null);
        const [idsUsuario, setIdsUsuario] = useState<string[]>([]);
        const navigate = useNavigate();

        const [accionUsuario, setAccionUsuario] = useState<string | null>(null);
        const [isScanning, setIsScanning] = useState(false);
        const [lastScanned, setLastScanned] = useState<string | null>(null);

        const [divModal, setdivModal] = useState(false);

        const [entradaHora, setEntradaHora] = useState<Timestamp | null>(null);
        const [salidaHora, setSalidaHora] = useState<Timestamp | null>(null);
        const [showEntryButton, setShowEntryButton] = useState(false);
        const [showExitButton, setShowExitButton] = useState(false);

        var vacacionalSeleccionado: string = "2025-1";

        const buscarDatoPorQR = async (qrCompleto: string, coleccion: string) => {
            console.log(qrCompleto)
            return (await getDoc(doc(db, coleccion, qrCompleto))).data() || null;;
        };

        const formatTimestamp = (timestamp: Timestamp) => {
            if (timestamp) {
              const date = timestamp.toDate();
              return date.toLocaleString();
            }
            return null;
          };


        const handleScan = async (qrCode: string) => {
            const qrSinFecha = qrCode.split("|")[0];
            var existe = false;
            if (qrCode.startsWith("del")) {
                const delegado = await buscarDatoPorQR(qrSinFecha, "delegados");
                if (delegado) {
                    setIsScanning(false);
                    existe = true;
                }
            } else if (qrCode.startsWith("coo")) {
                const coordinador = await buscarDatoPorQR(qrSinFecha, "coordinadores"); 
                if (coordinador) {
                    setIsScanning(false);
                    existe = true;
                }
            }

            if(existe){
                const fecha = new Date().toISOString().split('T')[0];
                const asistenciaId = `${vacacionalSeleccionado}-vol-${persona?.qr}-${vacacionalSeleccionado}|${fecha}`;
                const asistencia = await buscarDatoPorQR(asistenciaId, "asistencias-voluntarios"); 
                if(asistencia){
                    setEntradaHora(asistencia.hora_real_entrada);
                    if(asistencia.hora_real_salida){
                        setSalidaHora(asistencia.hora_real_salida);
                    }else{
                        setShowExitButton(true);
                    }
                }else{
                    setShowEntryButton(true);
                }
            }else{
                alert("Codigo QR no válido");
            }
        };

        useEffect(() => {
            const fetchData = async () => {
                if (!auth.currentUser) {
                    navigate('/login');
                    return;
                }
        
                const correo = auth.currentUser.email;
                if (!correo) return;
        
                const personaSnapshot = await getDocs(query(collection(db, 'personas'), where('correo', '==', correo)));
                if (!personaSnapshot.empty) {
                    const personaData = personaSnapshot.docs[0].data() as Persona;
                    setPersona(personaData);
        
                    const qRoles = query(
                        collection(db, 'roles-usuarios'),
                        where('correo', '==', correo),
                        where('vacacional', '==', vacacionalSeleccionado)
                    );
                    const queryRolesSnapshot = await getDocs(qRoles);
                    setRolesUsuario(queryRolesSnapshot.docs.map(doc => doc.data() as RolUsuario));
                } else {
                    console.warn('No se encontró información de esa Persona.');
                }
            };
        
            fetchData();
        }, []);

        useEffect(() => {
            if (persona && rolesUsuario.length > 0) {
                prepararIDsUsuario(persona.qr);
            }
        }, [persona, rolesUsuario]);

        const prepararIDsUsuario = async (qr: string) => {
            const nuevosIDs: string[] = [];
        
            for (const rol of rolesUsuario) {
                switch (rol.rol_id) {
                    case 1:
                        nuevosIDs.push(`vol-${qr}-${vacacionalSeleccionado}`);
                        break;
                    case 2:
                        nuevosIDs.push(`pro-${qr}-${vacacionalSeleccionado}`);
                        break;
                    case 3:
                        nuevosIDs.push(`tra-${qr}-${vacacionalSeleccionado}`);
                        break;
                    case 4:
                        const qDelegados = query(
                            collection(db, 'delegados'),
                            where("__name__", ">=", `del-${qr}`),
                            where("__name__", "<", `del-${qr}\uf8ff`)
                        );
                        const delegados = await getDocs(qDelegados);
                        delegados.forEach(doc => {
                            if (doc.id.includes(vacacionalSeleccionado)) {
                                nuevosIDs.push(doc.id);
                            }
                        });
                        break;
                    case 6:
                        nuevosIDs.push(`coo-${qr}-${vacacionalSeleccionado}`);
                        break;
                }
            }
        
            setIdsUsuario(nuevosIDs);
        };
        
        const handleLogout = async () => {
            await signOut(auth);
            navigate('/login');
        };

        const renderAcciones = () => {
            const acciones: Set<string> = new Set();
            rolesUsuario.forEach(rol => {
                switch (rol.rol_id) {
                    case 0: // Admin
                        acciones.add('Gestionar Asistencia');
                        break;
                    case 1: // Voluntario
                        acciones.add('Marcar Asistencia');
                        break;
                    case 4: // Delegado
                    case 6: // Coordinador
                        acciones.add('Gestionar Asistencia');
                        break;
                    case 2:
                    case 3:
                        acciones.add('Nada');
                        break;
                }
            });
        
            return Array.from(acciones);
        };

        function registrarAsistenciaEntradaAuto() {
            if (lastScanned) {
                const qrCode = "vol-" + persona?.qr + "-" + vacacionalSeleccionado;
                const horaActual = new Date().toLocaleTimeString();
                alert(`Registrando entrada para ${persona?.nombre}. Hora de entrada: ${horaActual}`);
                registrarAsistenciaEntrada(
                    vacacionalSeleccionado,
                    qrCode,
                    lastScanned?.split("|")[0],
                    Timestamp.now(),
                    ""
                )
                .then(() => {
                    alert(`La entrada para ${persona?.nombre} ha sido registrada con éxito a las ${horaActual}.`);
                })
                .catch((error) => {
                    alert("Hubo un error al registrar la entrada. Por favor, inténtalo nuevamente. " + error);
                })
            }
        }

        async function registrarAsistenciaEntrada(vacacionalId: string, voluntarioId: string, quienPermiteId: string, horaEntrada: Timestamp, observaciones: string) {
            const fecha = new Date().toISOString().split('T')[0];
            const asistenciaId = `${vacacionalId}-${voluntarioId}|${fecha}`;

            const q =  query(collection(db, 'asistencias-voluntarios'), where('id_voluntario', '==', voluntarioId));
            const querySnapshot = await getDocs(q);    

            if (!querySnapshot.empty) {
                querySnapshot.forEach(asistencia => {
                    const {hora_marca_entrada } = asistencia.data();
                    if (hora_marca_entrada) {
                        return { success: false, message: 'La hora de entrada ya está registrada.' };
                    }
                });
            }
        
            const docRef =  doc(collection(db,'asistencias-voluntarios'), asistenciaId);
            const newAsistencia = {
                vacacionalId: vacacionalId,
                voluntarioId: voluntarioId,
                quien_permite_id_entrada: quienPermiteId,
                hora_real_entrada: Timestamp.now(),
                hora_marca_entrada: horaEntrada,
                observaciones_entrada: observaciones,
            };

            await setDoc(docRef, {
                            ...newAsistencia
                        }, { merge: true });
            return { success: true, message: 'Asistencia registrada correctamente.' };
        };

        useEffect(() => {
            let scanner: Html5QrcodeScanner | null = null;
        
            if (isScanning) {
              scanner = new Html5QrcodeScanner("reader", {
                fps: 5,
                qrbox: 250,
              }, false);
              scanner.render(
                (decodedText) => {
                  setLastScanned(decodedText);
                  handleScan(decodedText);;
                },
                (error) => {
                  console.error("Error al escanear", error);}
              );
            }
        
            return () => {
              if (scanner) {
                scanner.clear();
              }
            };
          }, [isScanning]);

          const handleDownload = () => {
            const canvas = document.getElementById('qr-canvas') as HTMLCanvasElement;
            if (canvas) {
              const link = document.createElement('a');
              link.href = canvas.toDataURL('image/png');
              link.download = 'codigo-qr.png';
              link.click();
            }
          };

        const realizarAcciones = () => {
            switch (accionUsuario) {
                case 'Gestionar Asistencia':
                    const fecha = new Date().toISOString().split('T')[0];
                    const coordinador = "coo";
                    const delegado = "del"

                    const regex = new RegExp(`^(${coordinador}|${delegado})`);

                    const idUsuario = idsUsuario.find(valor => regex.test(valor));
                    return(
                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'black' }}>
                        <h2>Código QR para la asistencia del día {fecha}</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
                            <div>
                                <QRCodeCanvas 
                                id="qr-canvas"
                                value={idUsuario+"|"+fecha}
                                size={256}
                                bgColor="#ffffff"
                                fgColor="#000000"
                                level="H"
                                />
                            </div>
                            <div>
                                <button onClick={handleDownload} style={{backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px' }}>
                                    Descargar QR
                                </button>
                            </div>
                        </div>                        
                    </div>
                    
                    );
                case 'Marcar Asistencia':
                    return(
                    <div style={{ display: 'flex', flexDirection:'column', justifyContent: 'center', alignItems: 'center'}}>
                        <Card style={{ display: 'flex', flexDirection:'column', padding: '15px' ,justifyContent: 'center', alignItems: 'center'}}>
                            <h2>Escanear Código QR</h2>
                            {isScanning ? <div id="reader" /> : null}
                            <Button  onClick={() => setIsScanning(!isScanning)}>
                            {isScanning ? "Detener escaneo" : "Escanear Código QR"}
                            </Button>
                        </Card>
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                                 <div>
                                    {entradaHora ? (
                                        <Button variant="outlined" disabled fullWidth className="hora-entry">
                                            Entrada Marcada: {formatTimestamp(entradaHora)}
                                        </Button>
                                    ) : showEntryButton ? (
                                        <button onClick={() => {
                                            registrarAsistenciaEntradaAuto();
                                            setShowEntryButton(!showEntryButton);
                                            setdivModal(false);}} >
                                            Marcar Entrada
                                        </button>
                                    ) : null}

                                    {salidaHora ? (
                                        <Button variant="outlined" disabled fullWidth className="hora-exit">
                                            Salida Marcada: {formatTimestamp(salidaHora)}
                                        </Button>
                                    ) : showExitButton ? (
                                        <button onClick={() => {
                                            registrarAsistenciaSalidaAuto();
                                            setShowExitButton(!showExitButton);
                                            setdivModal(false);
                                        }} >
                                            Marcar Salida
                                        </button>
                                    ) : null}
                                </div>

                        </div>
                    </div>);
                    default:
                return null;
            };
        };

        function registrarAsistenciaSalidaAuto(){
            if (lastScanned) {
                const horaActual = new Date().toLocaleTimeString();

                alert(`Registrando salida para ${persona?.nombre}. Hora de salida: ${horaActual}`);
                registrarAsistenciaSalida(vacacionalSeleccionado,
                    "vol-"+persona?.qr+"-"+vacacionalSeleccionado,
                    lastScanned?.split("|")[0], Timestamp.now(),
                    "")
                .then(() => {
                    alert(`La salida para ${persona?.nombre} ha sido registrada con éxito a las ${horaActual}.`);
                })
                .catch((error) => {
                    alert("Hubo un error al registrar la salida. Por favor, inténtalo nuevamente. " + error);
                })
            }
        };

        async function registrarAsistenciaSalida(vacacionalId: string, voluntarioId: string, quienPermiteId: string, horaSalida: Timestamp, observaciones: string) {
            const fecha = new Date().toISOString().split('T')[0];
            const asistenciaId = `${vacacionalId}-${voluntarioId}|${fecha}`;

            const q =  query(collection(db, 'asistencias-voluntarios'), where('id_voluntario', '==', voluntarioId));
            const querySnapshot = await getDocs(q);    

            if (!querySnapshot.empty) {
                querySnapshot.forEach(asistencia => {
                    const {hora_marca_salida, hora_marca_entrada } = asistencia.data();
                    if (hora_marca_salida) {
                        return { success: false, message: 'La hora de salida ya está registrada.' };
                    }

                    if (horaSalida && !hora_marca_entrada) {
                        console.log('No se puede marcar la salida si no se ha registrado la entrada.');
                        return { success: false, message: 'No se puede marcar la salida si no se ha registrado la entrada.' };
                    }
                });
            }
        
            const docRef =  doc(collection(db,'asistencias-voluntarios'), asistenciaId);
            const newAsistencia = {
                hora_real_salida: Timestamp.now(),
                quien_permite_id_salida: quienPermiteId,
                hora_marca_salida: horaSalida,
                observaciones_salida: observaciones,
            };

            await setDoc(docRef, {
                            ...newAsistencia
                        }, { merge: true });
            return { success: true, message: 'Asistencia registrada correctamente.' };
        };
        
        return (
        <div className="user-profile">
            <h1>Perfil de Usuario</h1>
            {persona ? (
                <>
                    <div className="profile-data">
                        <div className="profile-info">
                            <p><strong>Nombre:</strong> {persona.nombre} {persona.apellido}</p>
                            <p><strong>Correo:</strong> {persona.correo}</p>
                        </div>
                        <div className="profile-photo-container">
                            <img src={persona.url_foto} alt="imagen de perfil" className='profile-photo' />
                        </div>
                    </div>
                    <div className="cards-actions">
                        {renderAcciones().map((accion, index) => (
                            <div key={index} className="card-container">
                                <Card sx={{ maxWidth: 345 }}>
                                    <CardContent>
                                        <Typography variant="h5" component="div">
                                            {accion}
                                        </Typography>
                                        <Button onClick={() => {
                                            setdivModal(true);
                                            setAccionUsuario(accion);
                                        }} variant="contained" color="primary" fullWidth>
                                            Realizar Acción
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>
                        ))}
                    </div>
                    <p>Vacacional {vacacionalSeleccionado}</p>
                    <div className={`opciones ${divModal ? 'visible' : 'hidden'}`}>
                        <Box
                            sx={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                width: 400,
                                bgcolor: 'background.paper',
                                boxShadow: 24,
                                p: 4,
                                borderRadius: 2,
                                color: 'black'
                            }}
                        >
                            {realizarAcciones()}
                            <Button onClick={()=>{
                                setdivModal(false);
                                setIsScanning(false);
                                }} variant="contained" sx={{ mt: 2 }}>Cerrar</Button>
                        </Box>
                    </div>
                    <div className={`profile-actions ${!divModal ? 'visible' : 'hidden'}`}>
                        <Button variant="outlined" color="secondary" onClick={handleLogout}>
                            Cerrar Sesión
                        </Button>
                    </div>
                </>
            ) : (
                <p>Cargando datos...</p>
            )}
        </div>
    );
};

export default UserProfile;
