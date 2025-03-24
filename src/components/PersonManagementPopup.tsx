import { useState, useEffect } from "react";
import { usePersonManagement } from "../hooks/usePersonManagement";
import "./PersonManagementPopup.css";

interface Person {
  id: string;
  nombre: string;
  apellido: string;
  fechaNacimiento: string;
}
interface Props {
  onClose: () => void;
  onPeopleUpdated: () => void;
}


const PersonManagementPopup = ({ onClose, onPeopleUpdated }: Props) => {
  const { getPeople, addPerson, updatePerson, deletePerson } = usePersonManagement();
  const [people, setPeople] = useState<Person[]>([]);
  const [formData, setFormData] = useState<Person>({
    id: "",
    nombre: "",
    apellido: "",
    fechaNacimiento: "",
  });

  useEffect(() => {
    const fetchPeople = async () => {
      const data: Person[] = await getPeople();
      setPeople(data);
    };
    fetchPeople();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.id) {
      await updatePerson(formData.id, {
        nombre: formData.nombre,
        apellido: formData.apellido,
        fechaNacimiento: formData.fechaNacimiento,
      });
    } else {
      await addPerson({
        nombre: formData.nombre,
        apellido: formData.apellido,
        fechaNacimiento: formData.fechaNacimiento,
      });
    }
    setFormData({ id: "", nombre: "", apellido: "", fechaNacimiento: "" });
    setPeople(await getPeople());
    onPeopleUpdated();
  };

  const handleEdit = (person: Person) => {
    setFormData(person);
    onPeopleUpdated();
  };

  const handleDelete = async (id: string) => {
    await deletePerson(id);
    setPeople(await getPeople());
    onPeopleUpdated();
  };

  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <h3>Gestionar Niños</h3>
        <form onSubmit={handleSubmit} className="person-form">
            <div>
                <label htmlFor="nombre">Nombre:</label>
                <input id="nombre" type="text" name="nombre" placeholder="Nombre" value={formData.nombre} onChange={handleChange} required />
            </div>

            <div>
                <label htmlFor="apellido">Apellido:</label>
                <input id="apellido" type="text" name="apellido" placeholder="Apellido" value={formData.apellido} onChange={handleChange} required />
            </div>

            <div>
                <label htmlFor="fechaNacimiento">Fecha de Nacimiento:</label>
                <input id="fechaNacimiento" type="date" name="fechaNacimiento" value={formData.fechaNacimiento} onChange={handleChange} required />
            </div>

            <button type="submit" className="save-button">{formData.id ? "Actualizar" : "Agregar"}</button>
            </form>

        <ul className="person-list">
          {people.map((person) => (
            <li key={person.id} className="popup-actions">
              {person.nombre} {person.apellido} ({person.fechaNacimiento})
                <button onClick={() => handleEdit(person)} >Editar</button>
                <button onClick={() => handleDelete(person.id)} className="delete-button">Eliminar</button>
            </li>
          ))}
        </ul>
        <button onClick={()=>{onClose();
          onPeopleUpdated();
        }}>Cerrar</button>
      </div>
    </div>
  );
};

export default PersonManagementPopup;
