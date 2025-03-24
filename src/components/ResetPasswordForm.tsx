import { useState } from "react";
import { useResetPassword } from "../hooks/useResetPassword";

const ResetPasswordForm = ({ email }: { email: string }) => {
  const { resetPassword } = useResetPassword();
  const [isSent, setIsSent] = useState(false);

  const handleReset = () => {
    resetPassword(email);
    setIsSent(true);
  };

  return (
    <div>
      <button onClick={handleReset} disabled={isSent}>
        {isSent ? "Correo enviado" : "Cambiar contraseña"}
      </button>
    </div>
  );
};

export default ResetPasswordForm;
