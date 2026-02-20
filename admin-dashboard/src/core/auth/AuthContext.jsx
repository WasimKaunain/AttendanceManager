import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUser({
          id: decoded.sub,
          role: decoded.role,
        });
      } catch (err) {
        console.error("Invalid token");
        logout();
      }
    }
  }, []);

  const login = async (username, password) => {
    const res = await api.post("/auth/login", {
      username,
      password,
    });

    const token = res.data.access_token;
    localStorage.setItem("access_token", token);

    const decoded = jwtDecode(token);

    setUser({
      id: decoded.sub,
      role: decoded.role,
    });
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
