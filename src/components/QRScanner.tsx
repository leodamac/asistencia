import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import Button from './Button';

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
}

export const QRScanner = ({ onScanSuccess }: QRScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;
  
    if (isScanning) {
      scanner = new Html5QrcodeScanner("reader", { fps: 5, qrbox: 250 }, false);
      scanner.render(onScanSuccess, error => console.error("Error al escanear", error));
    }
  
    return () => {
      if (scanner) {
        scanner.clear().catch(err => console.error("Error al limpiar el escáner", err));
      }
    };
  }, [isScanning, onScanSuccess]); 

  return (
    <div>
      {isScanning && <div id="reader" />}
      <Button onClick={() => setIsScanning(!isScanning)} text={isScanning ? "Detener escaneo" : "Escanear Código QR"}/>
    </div>
  );
};
