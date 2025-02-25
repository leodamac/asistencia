import { useState, useEffect } from "react";
import { Button, Card} from "@mui/material";
import { Html5QrcodeScanner } from "html5-qrcode";

interface Attendance {
  parentName: string;
  childName: string;
  group: string;
  entryTime: string;
  exitTime?: string;
}

interface AttendanceVolunteers {
  teacherName: string;
  volunteerName: string;
  group: string;
  entryTime: string;
  exitTime?: string;
}

const voluntarios = [
  { id: 1, nombre: "Juan Pérez", grupo: "Grupo 1", qr: "vol-1" , entryTime: "", exitTime: ""},
  { id: 2, nombre: "Ana Gómez", grupo: "Grupo 2", qr: "vol-2" , entryTime: "", exitTime: ""},
  { id: 3, nombre: "Cristiano Messi", grupo: "Futbol", qr: "vol-3" , entryTime: "", exitTime: ""},
]; // Comentado temporalmente

const profesores = [
  { id: 1, nombre: "Profesor 1", rol: "coordinador", qr: "pro-1" },
];

const kids = [
  { id: 1, nombre: "Carlos López", grupo: "Grupo 1", qr: "", entryTime: "", exitTime: ""},
  { id: 2, nombre: "María Torres", grupo: "Grupo 2", qr: "", entryTime: "", exitTime: ""},
  { id: 3, nombre: "Marcos Santos", grupo: "Grupo 2", qr: "", entryTime: "", exitTime: ""},
];

const padres = [
  { id: 1, nombre: "José López", kids: ["Carlos López", "Marcos Santos"], qr: "par-1", encargados: ["Tia maria"]},
  { id: 2, nombre: "Luisa Torres", kids: ["María Torres"], qr: "par-2", encargados: []},
];

const renderVoluntarios = () => (
  <div>
    <h3>Voluntarios</h3>
    {voluntarios.map((voluntario) => (
      <div key={voluntario.id}>
        <strong>Nombre:</strong> {voluntario.nombre} <br />
        <strong>Grupo:</strong> {voluntario.grupo} <br />
        <strong>QR:</strong> {voluntario.qr} <br />
        <hr />
      </div>
    ))}
  </div>
);

const renderProfesores = () => (
  <div>
    <h3>Profesores</h3>
    {profesores.map((profesor) => (
      <div key={profesor.id}>
        <strong>Nombre:</strong> {profesor.nombre} <br />
        <strong>Rol:</strong> {profesor.rol} <br />
        <strong>QR:</strong> {profesor.qr} <br />
        <hr />
      </div>
    ))}
  </div>
);

const renderNiños = () => (
  <div>
    <h3>Niños</h3>
    {kids.map((kid) => (
      <div key={kid.id}>
        <strong>Nombre:</strong> {kid.nombre} <br />
        <strong>Grupo:</strong> {kid.grupo} <br />
        <strong>QR:</strong> {kid.qr} <br />
        <hr />
      </div>
    ))}
  </div>
);

const renderPadres = () => (
  <div>
    <h3>Padres</h3>
    {padres.map((padre) => (
      <div key={padre.id}>
        <strong>Nombre:</strong> {padre.nombre} <br />
        <strong>Niños a cargo:</strong> {padre.kids.join(", ")} <br />
        <strong>Encargados:</strong> {padre.encargados.join(", ")} <br />
        <strong>QR:</strong> {padre.qr} <br />
        <hr />
      </div>
    ))}
  </div>
);

export default function AttendanceCheck() {
    const [scannedParent, setScannedParent] = useState<number | null>(null);
    const [attendanceListVolunteers, setAttendanceListVolunteers] = useState<AttendanceVolunteers[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const [lastScanned, setLastScanned] = useState<string | null>(null);
    const [selectedChild, setSelectedChild] = useState<number | null>(null);
    const [childFilter, setChildFilter] = useState("");
    const [scannedTeacher, setScannedTeacher] = useState<number | null>(null);
    const [scannedVolunteer, setScannedVolunteer] = useState<number | null>(null);

    const [message, setMessage] = useState<string | null>(null);

    const filteredChildren = padres
    .find((parent) => parent.id === scannedParent)
    ?.kids.map((kidName) => {
      // Buscar los niños por nombre
      return kids.find((kid) => kid.nombre === kidName);
    })
    .filter((child) => child && child.nombre.toLowerCase().includes(childFilter.toLowerCase())) || [];
  

    const [openGroups, setOpenGroups] = useState<{ [key: string]: boolean }>({}); // Estado para manejar la visibilidad de los grupos

    const toggleGroupVisibility = (group: string) => {
      setOpenGroups((prev) => ({
        ...prev,
        [group]: !prev[group], // Cambia la visibilidad del grupo específico
      }));
    };

    const handleScan = (qrCode: string) => {
      console.log(attendanceListVolunteers);
      if (qrCode.startsWith("par")) {
        // Escaneo del padre
        const parent = padres.find((p) => p.qr === qrCode);
        if (parent) {
          setScannedParent(parent.id);
          setMessage(`Padre Escaneado: ${parent.nombre}`);
          setSelectedChild(null);
          setChildFilter("");
        }
      }else  if (qrCode.startsWith("vol")) {
        // Escaneo del voluntario
        const volunteer = voluntarios.find((v) => v.qr === qrCode);
        if (volunteer) {
          setScannedVolunteer(volunteer.id); // Guardamos al voluntario escaneado
          setMessage(`Voluntario Escaneado: ${volunteer.nombre}`);
        }
      } else if (qrCode.startsWith("pro")) {
        // Escaneo del profesor
        const teacher = profesores.find((e) => e.qr === qrCode);
        if (teacher) {
          setScannedTeacher(teacher.id); // Guardamos al profesor escaneado
          setMessage(`Profesor Escaneado: ${teacher.nombre}`);
        }
      }
    };
  
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
  
    const registerEntry = () => {
      if (scannedParent && selectedChild) {
        const parent = padres.find((p) => p.id === scannedParent);
        const child = kids.find((n) => n.id === selectedChild); // Buscar por ID
        if (parent && child && !child.entryTime) {
          const currentTime = new Date().toLocaleString();
          // Marcar la entrada del niño
          child.entryTime = currentTime;
          setMessage(`Entrada registrada para ${child.nombre} con ${parent.nombre}`);
          setSelectedChild(null); // Limpiar selección después de registrar
        }
      } else {
        setMessage("Escanea el código del padre y selecciona un niño.");
      }

      if (scannedVolunteer && scannedTeacher) {
        const volunteer = voluntarios.find((v) => v.id === scannedVolunteer);
        const teacher = profesores.find((t) => t.id === scannedTeacher);

        if (volunteer && teacher && !volunteer.entryTime) {
          const currentTime = new Date().toLocaleString();
          volunteer.entryTime = currentTime;
          // Registrar la entrada para el voluntario
          setAttendanceListVolunteers((prevList) => [
            ...prevList,
            { volunteerName: volunteer.nombre, teacherName: teacher.nombre, group: volunteer.grupo, entryTime: currentTime },
          ]);
          setMessage(`Entrada registrada para ${volunteer.nombre} con ${teacher.nombre}`);
        }
      } else {
        setMessage("Escanea el código del voluntario y del profesor.");
      }
      
    };
    
    const registerExit = () => {
      if (scannedParent && selectedChild) {
        const parent = padres.find((p) => p.id === scannedParent);
        const child = kids.find((n) => n.id === selectedChild); // Buscar por ID
        if (parent && child && child.entryTime && !child.exitTime) {
          const currentTime = new Date().toLocaleString();
          // Marcar la salida del niño
          child.exitTime = currentTime;
          setMessage(`Salida registrada para ${child.nombre} con ${parent.nombre}`);
          setSelectedChild(null); // Limpiar selección después de registrar
        }
      } else {
        setMessage("Escanea el código del padre y selecciona un niño.");
      }

      if (scannedVolunteer && scannedTeacher) {
        const volunteer = voluntarios.find((v) => v.id === scannedVolunteer);
        const teacher = profesores.find((t) => t.id === scannedTeacher);
    
        if (volunteer && teacher && !volunteer.exitTime) {
          const currentTime = new Date().toLocaleString();
          // Registrar la salida para el voluntario
          volunteer.exitTime = currentTime;
          setAttendanceListVolunteers((prevList) => [
            ...prevList,
            { volunteerName: volunteer.nombre, teacherName: teacher.nombre, group: volunteer.grupo, entryTime: volunteer.entryTime, exitTime: currentTime },
          ]);
          setMessage(`Salida registrada para ${volunteer.nombre} con ${teacher.nombre}`);
        }
      } else {
        setMessage("Escanea el código del voluntario y del profesor.");
      }
    };

    const groupByGroupAndParent = () => {
      return kids.reduce((acc, kid) => {
        // Buscar al padre correspondiente al niño
        const parent = padres.find(p => p.kids.includes(kid.nombre));
    
        if (!parent) return acc; // Si no hay un padre, no agregamos el niño
    
        const record = {
          childName: kid.nombre,
          group: kid.grupo,
          entryTime: kid.entryTime || "No registrada",  // Si no tiene hora de entrada
          exitTime: kid.exitTime || "No registrada",    // Si no tiene hora de salida
          parentName: parent.nombre,
        };
    
        // Agrupar por grupo
        if (!acc[kid.grupo]) {
          acc[kid.grupo] = [];
        }
    
        acc[kid.grupo].push(record);
        return acc;
      }, {} as Record<string, Attendance[]>);
    };
  
    const groupedAttendance = groupByGroupAndParent();

    const groupByGroupVolunteers = () => {
      return voluntarios.reduce((acc, voluntario) => {
    
        const record = {
          volunteerName: voluntario.nombre,
          teacherName: "Profesor",
          group: voluntario.grupo,
          entryTime: voluntario.entryTime || "No registrada",  // Si no tiene hora de entrada
          exitTime: voluntario.exitTime || "No registrada",    // Si no tiene hora de salida
        };
    
        // Agrupar por grupo
        if (!acc[voluntario.grupo]) {
          acc[voluntario.grupo] = [];
        }
    
        acc[voluntario.grupo].push(record);
        return acc;
      }, {} as Record<string, AttendanceVolunteers[]>);
    };
  
    const groupedAttendanceVolunteers = groupByGroupVolunteers();

  return (


    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Marcar Asistencia</h1>
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-2">Escanear Código QR</h2>
        {isScanning ? <div id="reader" /> : null}
        <Button className="mt-3 w-full" onClick={() => setIsScanning(!isScanning)}>
          {isScanning ? "Detener escaneo" : "Escanear Código QR"}
        </Button>
        
      </Card>

      {/* Mostrar el último código escaneado */}
      {lastScanned && (
        <div className="mt-4 p-3 border border-gray-300 rounded">
          <strong>Último código escaneado:</strong> {lastScanned}
          <button 
            onClick={() => {setLastScanned(null)
              setScannedParent(null)
              setMessage(null)
            }} 
            className="ml-4 text-red-500"
          >
            Borrar
          </button>
        </div>
      )}
      
      {/* Mostrar el mensaje cuando se escaneó un código QR */}
      {message && <div className="mt-4 text-lg">{message}</div>}

      {/* Mostrar los padres y sus niños */}
      {scannedParent && (
        <div className="mt-5">
          <h3 className="text-lg font-semibold">Selecciona un Niño</h3>
          {/* Filtro para los niños */}
          <input
            type="text"
            placeholder="Buscar niño..."
            value={childFilter}
            onChange={(e) => setChildFilter(e.target.value)}
            className="p-2 border rounded w-full mb-3"
          />

          {/* Mostrar niños filtrados */}
          <ul>
          {filteredChildren.map((child, index) => {
            if (!child) return null;
            const isCheckedIn = child.entryTime ? " (Entrada)" : " (Sin entrada)";
            const isCheckedOut = child.exitTime ? " (Salida)" : " (Sin salida)";
            return (
              <li key={index} className="mb-2">
                <button
                  className={`p-2 ${selectedChild === child.id ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}
                  onClick={() => setSelectedChild(child.id)}
                >
                  {child.nombre} {isCheckedIn} {isCheckedOut}
                </button>
              </li>
            );
          })}
        </ul>
        </div>
      )}

      {/* Mostrar el nombre del niño seleccionado */}
      {selectedChild && <div className="mt-3">Niño seleccionado: {selectedChild}</div>}

      {/* Botones para registrar entrada y salida */}
      <div className="mt-4">
        <button onClick={registerEntry} className="p-2 bg-green-500 text-white rounded mr-2">
          Marcar Entrada
        </button>
        <button onClick={registerExit} className="p-2 bg-red-500 text-white rounded">
          Marcar Salida
        </button>
      </div>

      {/* Lista asistencia Niños */}
      <h1 className="text-2xl font-bold mb-4">Lista de Asistencia Niños</h1>
      <div className="overflow-x-auto">
        {Object.entries(groupedAttendance).map(([group, records]) => (
          <div key={`child-${group}`} className="mb-4">
            <button
              className="text-lg font-semibold mb-2 text-blue-500"
              onClick={() => toggleGroupVisibility(`child-${group}`)}
            >
              {openGroups[`child-${group}`] ? `Ocultar ${group}` : `Mostrar ${group}`}
            </button>

            {openGroups[`child-${group}`] && (
              <div>
                <h3 className="font-semibold text-xl mb-2">Grupo: {group}</h3>
                <table className="min-w-full bg-white border border-gray-200">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="py-2 px-4 border-b">Niño</th>
                      <th className="py-2 px-4 border-b">Grupo</th>
                      <th className="py-2 px-4 border-b">Hora de Entrada</th>
                      <th className="py-2 px-4 border-b">Hora de Salida</th>
                      <th className="py-2 px-4 border-b">Nombre del Padre</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((attendance, index) => (
                      <tr key={index} className="odd:bg-gray-50">
                        <td className="py-2 px-4 border-b">{attendance.childName}</td>
                        <td className="py-2 px-4 border-b">{attendance.group}</td>
                        <td className="py-2 px-4 border-b">{attendance.entryTime}</td>
                        <td className="py-2 px-4 border-b">{attendance.exitTime}</td>
                        <td className="py-2 px-4 border-b">{attendance.parentName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lista asistencia Voluntarios */}
      <h1 className="text-2xl font-bold mb-4">Lista de Asistencia Voluntarios</h1>
      <div className="overflow-x-auto">
        {Object.entries(groupedAttendanceVolunteers).map(([group, records]) => (
          <div key={`volunteer-${group}`} className="mb-4">
            <button
              className="text-lg font-semibold mb-2 text-blue-500"
              onClick={() => toggleGroupVisibility(`volunteer-${group}`)}
            >
              {openGroups[`volunteer-${group}`] ? `Ocultar ${group}` : `Mostrar ${group}`}
            </button>

            {openGroups[`volunteer-${group}`] && (
              <div>
                <h3 className="font-semibold text-xl mb-2">Grupo: {group}</h3>
                <table className="min-w-full bg-white border border-gray-200">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="py-2 px-4 border-b">Voluntario</th>
                      <th className="py-2 px-4 border-b">Grupo</th>
                      <th className="py-2 px-4 border-b">Hora de Entrada</th>
                      <th className="py-2 px-4 border-b">Hora de Salida</th>
                      <th className="py-2 px-4 border-b">Profesor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((attendance, index) => (
                      <tr key={index} className="odd:bg-gray-50">
                        <td className="py-2 px-4 border-b">{attendance.volunteerName}</td>
                        <td className="py-2 px-4 border-b">{attendance.group}</td>
                        <td className="py-2 px-4 border-b">{attendance.entryTime}</td>
                        <td className="py-2 px-4 border-b">{attendance.exitTime}</td>
                        <td className="py-2 px-4 border-b">{attendance.teacherName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>


      {scannedVolunteer && scannedTeacher ? (
        <div className="mt-4 p-3 border border-gray-300 rounded">
          <strong>Voluntario y Profesor escaneados:</strong> Listo para marcar la entrada o salida.
        </div>
      ) : (
        <div className="mt-4 p-3 border border-gray-300 rounded">
          <strong>Faltan escanear los siguientes códigos:</strong>
          {scannedVolunteer ? "Profesor" : "Voluntario"} no escaneado aún.
        </div>
      )}

      <div>
      <h1>Lista de Personas</h1>
      <div>
        {renderVoluntarios()}
        {renderProfesores()}
        {renderNiños()}
        {renderPadres()}
      </div>
      </div>
    </div>
  );
}