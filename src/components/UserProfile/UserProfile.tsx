import { useEffect, useState } from 'react';
import { db, auth } from '../Firebase/Firebase';
import { collection, query, where, getDocs, doc, setDoc, Timestamp, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, Typography, Button, Modal, Box, CircularProgress } from '@mui/material';
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
        const [open, setOpen] = useState(false);
        const [modalMessage, setModalMessage] = useState('');
        const [modalTitle, setModalTitle] = useState('');

        const [accionUsuario, setAccionUsuario] = useState<string | null>(null);
        const [isScanning, setIsScanning] = useState(false);
        const [isProcessing, setIsProcessing] = useState(false);
        const [lastScanned, setLastScanned] = useState<string | null>(null);

        const [openMessageModal, setOpenMessageModal] = useState(false);

        const [entradaHora, setEntradaHora] = useState<Timestamp | null>(null);
        const [salidaHora, setSalidaHora] = useState<Timestamp | null>(null);
        const [showEntryButton, setShowEntryButton] = useState(false);
        const [showExitButton, setShowExitButton] = useState(false);

        const [isLoading, setIsLoading] = useState(false);

        const abrirModal = (titulo: string, mensaje: string) => {
            setModalTitle(titulo);
            setModalMessage(mensaje);
            setOpen(true);
        };
        
        const cerrarModal = () => {
            setOpen(false);
            setModalTitle('');
            setModalMessage('');
            setAccionUsuario(null);
            setLastScanned(null);
            setShowEntryButton(false);
            setShowExitButton(false);
            setEntradaHora(null);
            setSalidaHora(null);
            setIsScanning(false);
        };

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
            setIsLoading(true);
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
            }

            setIsLoading(false);
        };

        useEffect(() => {
            if(accionUsuario){
                abrirModal(accionUsuario, "");
            } 
        }, [accionUsuario]);

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
        
                setIsProcessing(true);
                setModalTitle("Registrando Entrada");
                setModalMessage(`Registrando entrada para ${persona?.nombre}. Hora de entrada: ${horaActual}`);

                setOpenMessageModal(true);

                registrarAsistencia(
                    vacacionalSeleccionado,
                    qrCode,
                    lastScanned?.split("|")[0],
                    Timestamp.now(),
                    'entrada',
                    ""
                )
                .then(() => {
                    setIsProcessing(false);
                    setModalTitle("Entrada Registrada");
                    setModalMessage(`La entrada para ${persona?.nombre} ha sido registrada con éxito a las ${horaActual}.`);
                })
                .catch((error) => {
                    setIsProcessing(false);
                    setModalTitle("Error");
                    setModalMessage("Hubo un error al registrar la entrada. Por favor, inténtalo nuevamente. " + error);
                })
                .finally(() => {
                    setOpenMessageModal(false);
                    cerrarModal();
                    abrirModal(modalTitle, `La entrada para ${persona?.nombre} ha sido registrada con éxito a las ${horaActual}.`);
                });
            }
        }

        useEffect(() => {
            let scanner: Html5QrcodeScanner | null = null;
        
            if (isScanning) {
              scanner = new Html5QrcodeScanner("reader", {
                fps: 10,
                qrbox: 250,
              }, false);
              scanner.render(
                (decodedText) => {
                  setLastScanned(decodedText);
                  handleScan(decodedText);;
                },
                (error) => {
                  console.error("Error al escanear", error);
                  setLastScanned(error);}
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
                    return(
                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'black' }}>
                        <h2>Código QR para la asistencia del día {fecha}</h2>
                        
                        {idsUsuario.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
                                <div>
                                    <QRCodeCanvas 
                                    id="qr-canvas"
                                    value={idsUsuario[0]+"|"+fecha}
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
                        
                        ) : (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                            {isLoading ? (
                                <CircularProgress />
                            ) : (
                                <div>
                                    
                                </div>
                            )}
                        </div>
                        )}
                        
                        {/* Botón de descarga */}
                        
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
                            {isLoading ? (
                                <CircularProgress />
                            ) : (
                                <div>
                                    {entradaHora ? (
                                        <Button variant="outlined" disabled fullWidth className="hora-entry">
                                        Entrada: {formatTimestamp(entradaHora)}
                                        </Button>
                                    ) : showEntryButton ? (
                                        <button onClick={() => registrarAsistenciaEntradaAuto()} >
                                            Marcar Entrada
                                        </button>
                                    ) : null}

                                    {salidaHora ? (
                                        <Button variant="outlined" disabled fullWidth className="hora-exit">
                                        Salida: {formatTimestamp(salidaHora)}
                                        </Button>
                                    ) : showExitButton ? (
                                        <button onClick={() => registrarAsistenciaSalidaAuto()} >
                                            Marcar Salida
                                        </button>
                                    ) : null}
                                </div>
                            )}
                        </div>
                    </div>);
                    default:
                return null;
            };
        };

        function registrarAsistenciaSalidaAuto(){
            if (lastScanned) {
                const horaActual = new Date().toLocaleTimeString();
        
                setIsProcessing(true);
                setModalTitle("Registrando Salida");
                setModalMessage(`Registrando salida para ${persona?.nombre}. Hora de salida: ${horaActual}`);
        
                setOpenMessageModal(true);

                registrarAsistencia(vacacionalSeleccionado,
                    "vol-"+persona?.qr+"-"+vacacionalSeleccionado,
                    lastScanned?.split("|")[0],
                    Timestamp.now(),
                    'salida',
                    "")          
                .then(() => {
                    setIsProcessing(false);
                    setModalTitle("Registro Salida");
                    setModalMessage(`La salida para ${persona?.nombre} ha sido registrada con éxito a las ${horaActual}.`);
                })
                .catch((error) => {
                    setIsProcessing(false);
                    setModalTitle("Error");
                    setModalMessage("Hubo un error al registrar la salida. Por favor, inténtalo nuevamente. " + error);
                })
                .finally(() => {
                    setOpenMessageModal(false);
                    cerrarModal();
                    abrirModal(modalTitle, `La salida para ${persona?.nombre} ha sido registrada con éxito a las ${horaActual}.`);
                });
            }
        };


        const registrarAsistencia = async (vacacionalId: string, voluntarioId: string, quienPermiteId: string, hora: Timestamp, tipo: 'entrada' | 'salida', observaciones: string) => {
            const fecha = new Date().toISOString().split('T')[0];
            const asistenciaId = `${vacacionalId}-${voluntarioId}|${fecha}`;
        
            const q = query(collection(db, 'asistencias-voluntarios'), where('id_voluntario', '==', voluntarioId));
            const querySnapshot = await getDocs(q);
        
            if (!querySnapshot.empty) {
                querySnapshot.forEach(asistencia => {
                    const { hora_marca_entrada, hora_marca_salida } = asistencia.data();
        
                    if (tipo === 'entrada' && hora_marca_entrada) {
                        throw new Error('La hora de entrada ya está registrada.');
                    }
        
                    if (tipo === 'salida' && !hora_marca_entrada) {
                        throw new Error('No se puede marcar la salida si no se ha registrado la entrada.');
                    }
        
                    if (tipo === 'salida' && hora_marca_salida) {
                        throw new Error('La hora de salida ya está registrada.');
                    }
                });
            }
        
            const docRef = doc(collection(db, 'asistencias-voluntarios'), asistenciaId);
            const newAsistencia = tipo === 'entrada'
                ? { hora_real_entrada: Timestamp.now(), hora_marca_entrada: hora, observaciones_entrada: observaciones, quien_permite_id_entrada: quienPermiteId }
                : { hora_real_salida: Timestamp.now(), hora_marca_salida: hora, observaciones_salida: observaciones, quien_permite_id_salida: quienPermiteId };
        
            await setDoc(docRef, newAsistencia, { merge: true });
            return { success: true, message: 'Asistencia registrada correctamente.' };
        };
        
        return (
        <div className="user-profile">
            {/* Modal de mensaje (proceso o resultado) */}
            <Modal open={openMessageModal} onClose={() => setOpenMessageModal(false)}>
                <Box sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: 400,
                            bgcolor: 'black',
                            boxShadow: 24,
                            p: 4,
                            borderRadius: 2,
                        }}>
                    <Typography variant="h6">{modalTitle}</Typography>
                    <Typography variant="body1">{modalMessage}</Typography>
                    {isProcessing && <CircularProgress />}
                    <Button onClick={() => setOpenMessageModal(false)} variant="outlined">Cerrar</Button>
                </Box>
            </Modal>

        
                <Modal
                    open={open}
                    onClose={cerrarModal}
                >
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
                        <Typography variant="h6">{modalTitle}</Typography>
                        <Typography>{modalMessage}</Typography>
                        {realizarAcciones()}
                        
                        
                        <Button onClick={cerrarModal} variant="contained" sx={{ mt: 2 }}>Cerrar</Button>
                    </Box>
                </Modal>
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
                                            setAccionUsuario(accion);
                                        }} variant="contained" color="primary" fullWidth>
                                            Realizar Acción
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>
                        ))}
                    </div>
                    Vacacional {vacacionalSeleccionado}
                    <div className="profile-actions">
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
