import { useEffect, useState } from "react";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from "./services";

export function useUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  const addUser = async (payload) => {
    const newUser = await createUser(payload);
    setUsers((prev) => [...prev, newUser]);
  };

  const editUser = async (id, payload) => {
    const updated = await updateUser(id, payload);
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? updated : u))
    );
  };

  const removeUser = async (id) => {
    await deleteUser(id);
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    loading,
    addUser,
    editUser,
    removeUser,
    refresh: fetchUsers,
  };
}
