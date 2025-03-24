import { useState, useEffect } from "react";
import { useAttendance } from "../hooks/useAttendance";
import { Timestamp } from "firebase/firestore";
import "./AttendanceForm.css";
import PersonManagementPopup from "./PersonManagementPopup";
import { fetchAssignedPeople } from "./FirebaseServices";
import { auth } from "./Firebase/Firebase";

interface Props {
  assignedPeople: string[];
  onAttendanceSubmit: () => void; 
}

const AttendanceForm = ({ assignedPeople, onAttendanceSubmit}: Props) => {
  const { markAttendance, getAttendances } = useAttendance();
  const [attendanceData, setAttendanceData] = useState<Record<string, { entrada?: Timestamp; salida?: Timestamp }>>({});
  const [selectedPeopleEntry, setSelectedPeopleEntry] = useState<string[]>([]);
  const [selectedPeopleExit, setSelectedPeopleExit] = useState<string[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [people, setPeople] = useState<string[]>(assignedPeople);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getAttendances();
      const today = new Date().toISOString().split("T")[0];
      setAttendanceData(data[today] || {});
    };
    setPeople(assignedPeople);
    fetchData();
  }, []);

  const todayDate = new Date().toLocaleDateString();



  const updateAssignedPeople = async () => {
    const userId = auth.currentUser?.uid;
        if(userId){
          const updatedPeople = await fetchAssignedPeople(userId);
          if(updatedPeople){
            setPeople(updatedPeople.map(person => `${person.nombre} ${person.apellido}`));
          }
        }
  };

  const handleMarkAttendance = async (type: "entrada" | "salida", people: string[]) => {
    await markAttendance(people, type);
    const updatedData = await getAttendances();
    const today = new Date().toISOString().split("T")[0];
    setAttendanceData(updatedData[today] || {});
    onAttendanceSubmit();
  };

  const toggleSelection = (person: string, type: string) => {
    if (type.match("entry")) {
      setSelectedPeopleEntry((prev) =>
        prev.includes(person) ? prev.filter((p) => p !== person) : [...prev, person]
      );
    } else if (type.match("exit")) {
      setSelectedPeopleExit((prev) =>
        prev.includes(person) ? prev.filter((p) => p !== person) : [...prev, person]
      );
    }
  };

  return (
    <>
    <button onClick={() => setShowPopup(true)}>Gestionar Niños</button>
    {showPopup && <PersonManagementPopup onClose={() => setShowPopup(false)} onPeopleUpdated={updateAssignedPeople}/>}
    {people.length>0?(
      <div className="attendance-form">
        <div className="attendance-header">
          <h3>Marcar Asistencia - {todayDate}</h3>
        </div>
        
        <div className="attendance-sections">
          {/* Sección Entrada */}
          <div className="attendance-section">
            <h4>Entrada</h4>
            {people.map((person) => (
              <div key={person} className="attendance-item">
                {attendanceData[person]?.entrada ? (
                  <p>{person}: {new Date(attendanceData[person].entrada.toDate()).toLocaleTimeString()}</p>
                ) : (
                  <label className="attendance-label">
                    <input
                      type="checkbox"
                      checked={selectedPeopleEntry.includes(person)}
                      onChange={() => toggleSelection(person, "entry")}
                    />
                    <span>{person}</span>
                  </label>
                )}
              </div>
            ))}
            <button 
              onClick={() => handleMarkAttendance("entrada", selectedPeopleEntry)} 
              disabled={selectedPeopleEntry.length === 0 || people.every(person => attendanceData[person]?.entrada)}
            >
              Marcar Entrada
            </button>
          </div>

          {/* Sección Salida */}
          <div className="attendance-section">
            <h4>Salida</h4>
            {people.map((person) => (
              <div key={person} className="attendance-item">
                {attendanceData[person]?.salida ? (
                  <p>{person}: {new Date(attendanceData[person].salida.toDate()).toLocaleTimeString()}</p>
                ) : attendanceData[person]?.entrada ? (
                  <label className="attendance-label">
                    <input
                      type="checkbox"
                      checked={selectedPeopleExit.includes(person)}
                      onChange={() => toggleSelection(person, "exit")}
                    />
                    <span>{person}</span>
                  </label>
                ) : (
                  <p>{person}: No ha registrado entrada</p>
                )}
              </div>
            ))}
            <button 
              onClick={() => handleMarkAttendance("salida", selectedPeopleExit)} 
              disabled={selectedPeopleExit.length === 0 || people.every(person => attendanceData[person]?.salida)}
            >
              Marcar Salida
            </button>
          </div>
        </div>

      </div>
      ):(<div>
                  <p>NO HAY NIÑOS A SU CARGO REGISTRADOS</p>
        </div>)
    }
      
    </>
  );
};

export default AttendanceForm;
