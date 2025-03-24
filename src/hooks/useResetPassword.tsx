import { getAuth, sendPasswordResetEmail } from "firebase/auth";

export const useResetPassword = () => {
  const resetPassword = async (email: string) => {
    try {
      const auth = getAuth();
      await sendPasswordResetEmail(auth, email);
      alert("Se ha enviado un enlace de recuperación a tu correo.");
    } catch (error) {
      console.error("Error al enviar el correo:", error);
      alert("No se pudo enviar el correo. Verifica el email.");
    }
  };

  return { resetPassword };
};