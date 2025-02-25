import { useState, useEffect } from "react";
import { Button, Card, Accordion, AccordionSummary, AccordionDetails, Typography, Collapse } from "@mui/material";
import { Html5QrcodeScanner } from "html5-qrcode";
import { QRCodeCanvas } from "qrcode.react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

interface Attendance {
  parentQR: string;
  childQR: string;
  entryTime: string;
  exitTime?: string;
}

const voluntarios = [
  { id: 1, nombre: "Juan Pérez", grupo: "Grupo 1", qr: "vol-1" },
  { id: 2, nombre: "Ana Gómez", grupo: "Grupo 2", qr: "vol-2" },
];

const kids = [
  { id: 1, nombre: "Carlos López", grupo: "Grupo 1", qr: "chi-1" },
  { id: 2, nombre: "María Torres", grupo: "Grupo 2", qr: "chi-2" },
  { id: 3, nombre: "Marcos Santos", grupo: "Grupo 2", qr: "chi-3" },
];

const padres = [
  { id: 1, nombre: "José López", kids: ["Carlos López", "Marcos Santos"], qr: "par-1" },
  { id: 2, nombre: "Luisa Torres", kids: ["María Torres"], qr: "par-2" },
];

export default function AttendanceCheck() {
    const [scannedParent, setScannedParent] = useState<string | null>(null);
    const [scannedChild, setScannedChild] = useState<string | null>(null);
    const [attendanceList, setAttendanceList] = useState<Attendance[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const [lastScanned, setLastScanned] = useState<string | null>(null);
    const [openKids, setOpenKids] = useState<{ [key: number]: boolean }>({});


    const toggleKidsVisibility = (parentId: number) => {
      setOpenKids((prev) => ({ ...prev, [parentId]: !prev[parentId] }));
    };

    const handleScan = (qrCode: string) => {
      if (qrCode.startsWith("par")) {
        setScannedParent(qrCode);
      } else if (qrCode.startsWith("chi")) {
        if (scannedParent) {
          registerEntry(scannedParent, qrCode);
          setScannedParent(null);
        } else {
          setScannedChild(qrCode);
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
            handleScan(decodedText);
            scanner?.clear();
          },
          (error) => {
            console.error("Error al escanear", error);
            setLastScanned(error);
            scanner?.clear();}
        );
      }
  
      return () => {
        if (scanner) {
          scanner.clear();
        }
      };
    }, [isScanning]);
  
    const registerEntry = (parentQR: string, childQR: string) => {
      const currentTime = new Date().toLocaleString();
      setAttendanceList((prevList) => [
        ...prevList,
        { parentQR, childQR, entryTime: currentTime },
      ]);
      console.log("Entrada registrada:", { parentQR, childQR, entryTime: currentTime });
    };
  
    const registerExit = (childQR: string) => {
      const childAttendance = attendanceList.find(
        (attendance) => attendance.childQR === childQR && !attendance.exitTime
      );
  
      if (childAttendance) {
        const currentTime = new Date().toLocaleString();
        const updatedAttendanceList = attendanceList.map((attendance) =>
          attendance.childQR === childQR && !attendance.exitTime
            ? { ...attendance, exitTime: currentTime }
            : attendance
        );
        setAttendanceList(updatedAttendanceList);
        console.log("Salida registrada:", { childQR, exitTime: currentTime });
      } else {
        alert("No se puede registrar la salida. El kid no tiene una entrada registrada o ya ha marcado salida.");
      }
    };

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
          </div>
        )}

      <div className="mt-5">
        <h3 className="text-lg font-semibold">Lista de Asistencia</h3>
        <ul>
          {attendanceList.map((attendance, index) => (
            <li key={index} className="mb-2">
              <strong>Padre QR:</strong> {attendance.parentQR}<br />
              <strong>Niño QR:</strong> {attendance.childQR}<br />
              <strong>Hora de entrada:</strong> {attendance.entryTime}
            </li>
          ))}
        </ul>
      </div>
            {/* Lista de códigos QR de padres y kids */}
            <div className="mt-5">
        <h3 className="text-lg font-semibold">Códigos QR de Padres y Niños</h3>
        <ul>
      {padres.map((padre) => (
        <li key={padre.id} className="mb-3">
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>{padre.nombre}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <div>
                <Typography variant="body2" component="span">
                  <strong>Código QR Padre:</strong>
                  <div>
                    <QRCodeCanvas value={padre.qr} />
                  </div>
                </Typography>
                
                {/* Botón para mostrar/ocultar niños */}
                <Button
                  variant="outlined"
                  size="small"
                  className="mt-2"
                  onClick={() => toggleKidsVisibility(padre.id)}
                >
                  {openKids[padre.id] ? "Ocultar Niños" : "Mostrar Niños"}
                </Button>

                {/* Collapse para ocultar/mostrar niños */}
                <Collapse in={openKids[padre.id]} timeout="auto" unmountOnExit>
                  <div className="mt-2">
                    {padre.kids.map((kidNombre) => {
                      const kid = kids.find((n) => n.nombre === kidNombre);
                      return (
                        kid && (
                          <Typography variant="body2" component="span" className="mt-2" key={kid.id}>
                            <strong>Código QR {kid.nombre}:</strong>
                            <div>
                              <QRCodeCanvas value={kid.qr} />
                            </div>
                          </Typography>
                        )
                      );
                    })}
                  </div>
                </Collapse>
              </div>
            </AccordionDetails>
          </Accordion>
        </li>
      ))}
    </ul>
      </div>
    </div>
  );
}