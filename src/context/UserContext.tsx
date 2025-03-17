import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../components/Firebase/Firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { useNavigate } from "react-router-dom";

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

interface RolUsuario {
  correo: string;
  rol_id: number;
  vacacional: string;
}

interface UserContextType {
  persona: Persona | null;
  rolesUsuario: RolUsuario[];
  isLoading: boolean;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [persona, setPersona] = useState<Persona | null>(null);
  const [rolesUsuario, setRolesUsuario] = useState<RolUsuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        await cargarUsuario(user.email!);
      } else {
        setPersona(null);
        setRolesUsuario([]);
        navigate("/login");
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const cargarUsuario = async (correo: string) => {
    setIsLoading(true);

    const personaSnapshot = await getDocs(
      query(collection(db, "personas"), where("correo", "==", correo))
    );
    if (!personaSnapshot.empty) {
      setPersona(personaSnapshot.docs[0].data() as Persona);
    }

    const rolesSnapshot = await getDocs(
      query(collection(db, "roles-usuarios"), where("correo", "==", correo))
    );
    setRolesUsuario(rolesSnapshot.docs.map((doc) => doc.data() as RolUsuario));

    setIsLoading(false);
  };

  const logout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  return (
    <UserContext.Provider value={{ persona, rolesUsuario, isLoading, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser debe usarse dentro de UserProvider");
  return context;
};
