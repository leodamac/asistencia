import { ReactNode } from "react";
import { UserProvider } from "../context/UserContext";
import { UltimoVacacionalProvider } from "../context/UltimoVacacionalContext";

interface Props {
  children: ReactNode;
}

// Lista de providers
const providers = [UserProvider, UltimoVacacionalProvider];

const Providers = ({ children }: Props) => {
  return providers.reduce(
    (acc, Provider) => <Provider>{acc}</Provider>,
    children
  );
};

export default Providers;
