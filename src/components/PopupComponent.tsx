import React from "react";
import "./PopupComponent.css";

interface PopupProps {
  children: React.ReactNode;
  onClose: () => void;
}

const PopupComponent: React.FC<PopupProps> = ({ children, onClose }) => {
  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-content" onClick={(e) => e.stopPropagation()}>
        <button className="popup-close" onClick={onClose}>X</button>
        {children}
      </div>
    </div>
  );
};

export default PopupComponent;
