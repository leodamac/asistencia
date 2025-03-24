import { Timestamp } from "firebase/firestore";
import "./AttendanceList.css";

interface AttendanceRecord {
  entrada?: Timestamp;
  salida?: Timestamp;
}

type AttendanceData = Record<string, Record<string, AttendanceRecord>>;

interface AttendanceListProps {
  attendances: AttendanceData;
}

const AttendanceList: React.FC<AttendanceListProps> = ({ attendances }) => {
  return (
    <div className="attendance-container">
      <h3>Asistencias Pasadas</h3>
      {Object.entries(attendances).map(([date, people]) => (
        <div key={date}>
          <h4 className="attendance-date">{date}</h4>
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Persona</th>
                <th>Entrada</th>
                <th>Salida</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(people).map(([name, record]) => (
                <tr key={name}>
                  <td>{name}</td>
                  <td>{record.entrada ? new Date(record.entrada.toDate()).toLocaleTimeString() : "—"}</td>
                  <td>{record.salida ? new Date(record.salida.toDate()).toLocaleTimeString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
};


export default AttendanceList;
