import { useEffect, useState } from 'react';
import { db, auth } from '../Firebase/Firebase';
import { collection, query, where, getDocs, doc, setDoc, Timestamp, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, Typography, Button, Box } from '@mui/material';
import './UserProfile.css';
import { Html5QrcodeScanner } from 'html5-qrcode';
import {QRCodeCanvas} from 'qrcode.react';
import { useUltimoVacacional } from "../../context/UltimoVacacionalContext";
import Input from '../Input';
import ButtonSimple from '../Button';
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

        const {ultimoVacacional} = useUltimoVacacional();
        const [vacacionalSeleccionado, setVacacionalSeleccionado] = useState("");
        const [asistenciaManual, setAsistenciaManual] = useState(false);

        const hoy = new Date();
        const año = hoy.getFullYear();
        const mes = String(hoy.getMonth() + 1).padStart(2, "0");
        const dia = String(hoy.getDate()).padStart(2, "0");
        const fechaActual = `${año}-${mes}-${dia}`;
      
        const horas = String(hoy.getHours()).padStart(2, "0");
        const minutos = String(hoy.getMinutes()).padStart(2, "0");
        const horaActual = `${horas}:${minutos}`;
        
        const [fecha, setFecha] = useState(fechaActual);
        const [hora, setHora] = useState(horaActual);

        const [codigoQRManual, setCodigoQRManual] = useState("");
        const [idAsistenciaManual, setidAsistenciaManual] = useState("");

        const [dias, setDias] = useState<{ id: string; fecha: string ; activo: boolean}[]>([]);
        const [nuevoDia, setNuevoDia] = useState("");
        const [diasHoy, setDiasHoy] = useState<{ id: string; fecha: string; activo: boolean }[]>([]);
        
        useEffect(() => {
            const hoy = new Date().toLocaleDateString("es-ES", {
                year: "numeric",
                month: "numeric",
                day: "numeric",
            });
        
            setDiasHoy(dias.filter(dia => dia.fecha === hoy && dia.activo));
        }, [dias]);
      
        useEffect(() => {
          obtenerDiasActivos();
        }, [vacacionalSeleccionado]);

        const obtenerDiasActivos = async () => {
            const diasRef = collection(db, "dias-asistencia");
            const q = query(diasRef, where("vacacional", "==", vacacionalSeleccionado));

            const snapshot = await getDocs(q);
            const diasActivos = snapshot.docs.map((doc) => ({
            id: doc.id,
            fecha: doc.data().fecha.toDate().toLocaleDateString(),
            activo: doc.data().activo
            }));

            setDias(diasActivos);
        };

        const eliminarDia = async (id: string) => {
            const diaRef = doc(db, "dias-asistencia", id);
          
            await deleteDoc(diaRef); // Elimina el documento
          
            obtenerDiasActivos(); // Refrescar la lista después de eliminar
          };

        const agregarDia = async () => {
            if (!nuevoDia) return;
          
            // Extraer la fecha ingresada (YYYY-MM-DD) y dividirla
            const [year, month, day] = nuevoDia.split("-").map(Number);
          
            // Crear la fecha con la hora en local (evita problemas con UTC)
            const fechaNueva = new Date(year, month - 1, day, 12, 0, 0); // Poner la hora en el mediodía local evita cambios inesperados
          
            // Convertir la fecha a "DD-MM-AAAA"
            const idFecha = `${day.toString().padStart(2, "0")}-${month.toString().padStart(2, "0")}-${year}`;
          
            const diasRef = collection(db, "dias-asistencia");
            const diaDocRef = doc(diasRef, idFecha);
          
            // Verificar si ya existe
            const docSnap = await getDoc(diaDocRef);
            if (docSnap.exists()) {
              alert("El día ya existe en la base de datos");
              return;
            }
          
            // Guardar con Timestamp sin errores de zona horaria
            await setDoc(diaDocRef, {
              fecha: Timestamp.fromDate(fechaNueva),
              activo: true,
              vacacional: vacacionalSeleccionado,
              id_genero: persona?.qr
            });
          
            setNuevoDia("");
            obtenerDiasActivos();
          };
          

          const alternarEstadoDia = async (id: string, estadoActual: boolean) => {
            const diaRef = doc(db, "dias-asistencia", id);
            console.log(id);
            console.log(estadoActual);
            try {
              await updateDoc(diaRef, { activo: !estadoActual }); // Cambia el estado en Firestore
              obtenerDiasActivos(); // Vuelve a obtener los días para actualizar la UI
            } catch (error) {
              console.error("Error al cambiar el estado:", error);
            }
          };

        const obtenerTimestamp = () => {
            const [year, month, day] = fecha.split("-").map(Number);
            const [hour, minute] = hora.split(":").map(Number);
        
            const fechaHora = new Date(year, month - 1, day, hour, minute); // Crear el objeto Date
            const timestamp = Timestamp.fromDate(fechaHora); // Convertir a Timestamp
        
            console.log("Timestamp generado:", timestamp);
            return timestamp;
          };

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
            console.log("No cambia");
            if(ultimoVacacional){
                console.log("Si cambia");
                setVacacionalSeleccionado(ultimoVacacional);
            }
        }, [ultimoVacacional]);

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
        }, [vacacionalSeleccionado]);

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
                        acciones.add('Gestionar Días');
                        break;
                    case 1: // Voluntario
                        acciones.add('Marcar Asistencia');
                        break;
                    case 4: // Delegado
                    case 6: // Coordinador
                        acciones.add('Gestionar Asistencia');
                        acciones.add('Gestionar Días');
                        break;
                    case 2:
                        acciones.add('Nada');
                        break;
                    case 3: // Trabajador
                        acciones.add('Marcar Asistencia Niños');
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

        const handleSubmitManual = async (e: React.FormEvent) => {
            e.preventDefault();
            const codigoVoluntario = `${codigoQRManual.split("@")[0]}-${vacacionalSeleccionado}`;
            const voluntario = await buscarDatoPorQR(codigoVoluntario, "voluntarios");
            if(voluntario){
                const asistenciaId = `vol-${codigoVoluntario}|${fecha}`;
                const asistencia = await buscarDatoPorQR(asistenciaId, "asistencias-voluntarios");
                setidAsistenciaManual(codigoVoluntario);
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
                setEntradaHora(null);
                setSalidaHora(null);
                alert(`El usuario con correo ${codigoQRManual} no se encuentra registrado como voluntario.`);
            }
        };

        const realizarAcciones = () => {
            switch (accionUsuario) {
                case 'Gestionar Días':
                    return(
                        <div className="dias-container">
                        <h2>Días de asistencia</h2>
                  
                        <div className="nuevo-dia">
                          <input type="date" value={nuevoDia} onChange={(e) => setNuevoDia(e.target.value)} />
                          <button onClick={agregarDia}>Agregar Día</button>
                        </div>
                  
                        <ul className="lista-dias">
                          {dias.map(({ id, fecha, activo }) => (
                            <li key={id}>
                              {fecha}
                              <button className="desactivar-btn" onClick={() => alternarEstadoDia(id, activo)}>
                                {activo?'Desactivar':'Activar'}
                              </button>
                              <button className="desactivar-btn" onClick={() => eliminarDia(id)}>
                              ❌
                            </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                case 'Gestionar Asistencia':
                    const fecha = new Date().toISOString().split('T')[0];
                    const coordinador = "coo";
                    const delegado = "del"

                    const regex = new RegExp(`^(${coordinador}|${delegado})`);

                    const idUsuario = idsUsuario.find(valor => regex.test(valor));
                    return(
                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'black' }}>
                            {asistenciaManual ? (
                                <div>
                                    <h2>Asistencia manual día {fecha}</h2>
                                    <form onSubmit={handleSubmitManual}>
                                    <Input type='text' value={codigoQRManual} onChange={setCodigoQRManual} placeholder='correo@espol.edu.ec'/>
                                    <Input type="date" value={fecha} onChange={setFecha}/>
                                    <Input type="time" value={hora} onChange={setHora}/>
                                    <ButtonSimple  text="Verificar usuario" type="submit" />
                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                                    <div>
                                        {entradaHora ? (
                                            <Button variant="outlined" disabled fullWidth className="hora-entry">
                                                Entrada Marcada: {formatTimestamp(entradaHora)}
                                            </Button>
                                        ) : showEntryButton ? (
                                            <button onClick={() => {
                                                registrarAsistenciaEntrada(
                                                    vacacionalSeleccionado,
                                                    idAsistenciaManual,
                                                    idUsuario?idUsuario:"",
                                                    obtenerTimestamp(),
                                                    "registrado manualmente")
                                                    .then(() => {
                                                        alert(`La entrada para ${persona?.nombre} ha sido registrada con éxito a las ${horaActual}.`);
                                                    })
                                                    .catch((error) => {
                                                        alert("Hubo un error al registrar la entrada. Por favor, inténtalo nuevamente. " + error);
                                                    });
                                                setShowEntryButton(!showEntryButton);
                                                setdivModal(false);
                                                setAsistenciaManual(false);
                                                }} >
                                                Marcar Entrada
                                            </button>
                                        ) : null}

                                        {salidaHora ? (
                                            <Button variant="outlined" disabled fullWidth className="hora-exit">
                                                Salida Marcada: {formatTimestamp(salidaHora)}
                                            </Button>
                                        ) : showExitButton ? (
                                            <button onClick={() => {
                                                registrarAsistenciaSalida(vacacionalSeleccionado,
                                                    idAsistenciaManual,
                                                    idUsuario?idUsuario:"",
                                                    obtenerTimestamp(), 
                                                    "registrado manualmente").
                                                    then(() => {
                                                        alert(`La salida para ${persona?.nombre} ha sido registrada con éxito a las ${horaActual}.`);
                                                    })
                                                    .catch((error) => {
                                                        alert("Hubo un error al registrar la salida. Por favor, inténtalo nuevamente. " + error);
                                                    });
                                                setShowExitButton(!showExitButton);
                                                setdivModal(false);
                                                setAsistenciaManual(false);
                                            }} >
                                                Marcar Salida
                                            </button>
                                        ) : null}
                                    </div>
                            </div>
                                    </form>
                                </div>
                                ):(
                                    <div>
                                        <h2>Código QR para la asistencia del día {fecha}</h2>
                                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
                                            <div>
                                                <QRCodeCanvas 
                                                id="qr-canvas"
                                                value={idUsuario?idUsuario:""}
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
                                )}

                            <button  onClick={() => setAsistenciaManual(!asistenciaManual)}>
                            {asistenciaManual ? "Escanear Código QR":"Asistencia Manual"}
                            </button>
                    </div>                        
                    );
                case 'Marcar Asistencia':
                    console.log(diasHoy);
                    console.log(dias);
                    return(
                    <div style={{ display: 'flex', flexDirection:'column', justifyContent: 'center', alignItems: 'center'}}>
                        {diasHoy.length>0 ? (<div>
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
                        </div>):(<div>
                            <p>NO HAY DÍAS ACTIVOS HABLE CON ALGÚN ENCARGADO DE LA ASISTENCIA</p>
                        </div>)}
                    </div>);
                    case 'Marcar Asistencia Niños':
                        console.log(diasHoy);
                        console.log(dias);
                        return(
                        <div style={{ display: 'flex', flexDirection:'column', justifyContent: 'center', alignItems: 'center'}}>
                            {diasHoy.length>0 ? (<div>
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
                            </div>):(<div>
                                <p>NO HAY DÍAS ACTIVOS HABLE CON ALGÚN ENCARGADO DE LA ASISTENCIA</p>
                            </div>)}
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
                     {vacacionalSeleccionado && (<p>Vacacional {vacacionalSeleccionado}</p>)}
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
                                setCodigoQRManual("");
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
