import { getFirestore, collection, addDoc, getDocs, query, where, Timestamp } from "firebase/firestore";
import { useUser } from "../context/UserContext";
import { auth } from "../components/Firebase/Firebase";

interface AttendanceRecord {
  entrada?: Timestamp;
  salida?: Timestamp;
}

interface AttendanceData {
  [date: string]: {
    [name: string]: AttendanceRecord;
  };
}

export const useAttendance = () => {
  const db = getFirestore();
  const { persona } = useUser();

  const markAttendance = async (people: string[], type: "entrada" | "salida") => {
    if (!persona) return;

    const today = new Date().toISOString().split("T")[0];

    for (const personName of people) {
      const attendanceRef = collection(db, "attendances");
      
      // Verificar si ya se marcó la entrada
      const q = query(attendanceRef, where("date", "==", today), where("name", "==", personName), where("type", "==", type));
      const snapshot = await getDocs(q);

      if (!snapshot.empty && type === "entrada") {
        console.log(`${personName} ya tiene registrada la entrada.`);
        continue; // Si ya está registrada, no permite registrar otra vez
      }

      await addDoc(attendanceRef, {
        name: personName,
        type,
        date: today,
        timestamp: Timestamp.fromDate(new Date()),
        markedBy: persona.correo,
      });
    }
  };

  const getAttendances = async (): Promise<AttendanceData> => {
    const userEmail = auth.currentUser?.email;
    if (!userEmail) return {};
  
    try {
      const attendanceRef = collection(db, "attendances");
      const q = query(attendanceRef, where("markedBy", "==", userEmail));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => doc.data());
  
      return data.reduce<AttendanceData>((acc, entry) => {
        const { date, name, type, timestamp } = entry as { date: string; name: string; type: "entrada" | "salida"; timestamp: Timestamp };
  
        if (!acc[date]) acc[date] = {};
        if (!acc[date][name]) acc[date][name] = {};
        acc[date][name][type] = timestamp;
  
        return acc;
      }, {});
    } catch (error) {
      console.error("Error fetching attendances:", error);
      return {};
    }
  };
  

  return { markAttendance, getAttendances };
};
