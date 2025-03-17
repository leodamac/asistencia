import { createContext, useContext, useState } from "react";
import UltimoVacacionalLoader from '../components/UltimoVacacional';

interface UltimoVacacionalContextType {
  ultimoVacacional: string | null;
  setUltimoVacacional: (ultimoVacacional: string) => void;
}

const UltimoVacacionalContext = createContext<UltimoVacacionalContextType | undefined>(undefined);

export const UltimoVacacionalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ultimoVacacional, setUltimoVacacional] = useState<string | null>(null);

  return (
    <UltimoVacacionalContext.Provider value={{ ultimoVacacional, setUltimoVacacional }}>
      <UltimoVacacionalLoader/>
      {children}
    </UltimoVacacionalContext.Provider>
  );
};

export const useUltimoVacacional = () => {
  const context = useContext(UltimoVacacionalContext);
  if (!context) throw new Error("useUltimoVacacioanl debe usarse dentro de un UltimoVacacionalProvider");
  return context;
};
