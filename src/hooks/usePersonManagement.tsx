import { useState } from "react";
import { db, auth } from "../components/Firebase/Firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs } from "firebase/firestore";

// Definir el tipo de datos para una persona
interface Person {
  id: string; // Ahora id siempre será string
  nombre: string;
  apellido: string;
  fechaNacimiento: string;
  userId?: string;
  createdAt?: Date;
}

export const usePersonManagement = () => {
  const [loading, setLoading] = useState(false);
  const userId = auth.currentUser?.uid;

  const addPerson = async (person: Omit<Person, "id">) => {
    if (!userId) return;
    setLoading(true);
    try {
      await addDoc(collection(db, "people"), {
        ...person,
        userId,
        createdAt: new Date(),
      });
    } catch (error) {
      console.error("Error adding person:", error);
    } finally {
      setLoading(false);
    }
  };

  const updatePerson = async (id: string, updatedData: Partial<Omit<Person, "id" | "userId">>) => {
    setLoading(true);
    try {
      const personRef = doc(db, "people", id);
      await updateDoc(personRef, updatedData);
    } catch (error) {
      console.error("Error updating person:", error);
    } finally {
      setLoading(false);
    }
  };

  const deletePerson = async (id: string) => {
    setLoading(true);
    try {
      const personRef = doc(db, "people", id);
      await deleteDoc(personRef);
    } catch (error) {
      console.error("Error deleting person:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPeople = async (): Promise<Person[]> => {
    if (!userId) return [];
    setLoading(true);
    try {
      const q = query(collection(db, "people"), where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id, // Ahora garantizamos que id siempre sea string
        ...(doc.data() as Omit<Person, "id">),
      }));
    } catch (error) {
      console.error("Error fetching people:", error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return { addPerson, updatePerson, deletePerson, getPeople, loading };
};
