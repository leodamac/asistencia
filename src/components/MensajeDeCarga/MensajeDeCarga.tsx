import "./MensajeDeCarga.css";

interface MensajeDeCargaProps {
  mensaje?: string;
}

const MensajeDeCarga = ({ mensaje = "Cargando... Por favor, espere." }: MensajeDeCargaProps) => {
  return (
    <div className="mensaje-de-carga">
      <div className="spinner"></div>
      <p>{mensaje}</p>
    </div>
  );
};

export default MensajeDeCarga;