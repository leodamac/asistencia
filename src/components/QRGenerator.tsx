import { QRCodeCanvas } from "qrcode.react";
import "./QRGenerator.css";

interface QRCodeItem {
  label: string;
  value: string;
}

interface QRCodeGeneratorProps {
  qrData: QRCodeItem[];
}

const QRCodeGenerator = ({ qrData }: QRCodeGeneratorProps) => {
  const handleDownload = (id: string, label: string) => {
    const canvas = document.getElementById(id) as HTMLCanvasElement;
    if (canvas) {
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `${label}.png`;
      link.click();
    }
  };

  return (
    <div className="qr-container">
      {qrData.map(({ label, value }, index) => {
        const qrId = `qr-canvas-${index}`;
        return (
          <div key={qrId} className="qr-item">
            <h4>{label}</h4>
            <QRCodeCanvas id={qrId} value={value} size={256} level="H" />
            <button onClick={() => handleDownload(qrId, label)} className="qr-download-button">
              Descargar QR
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default QRCodeGenerator;
