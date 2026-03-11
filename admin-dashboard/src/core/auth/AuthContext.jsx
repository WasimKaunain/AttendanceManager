import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
      const token = localStorage.getItem("access_token");
    
      if (token) {
        try {
          const decoded = jwtDecode(token);
        
          if (decoded.exp * 1000 < Date.now()) {
            logout();
          } else {
            setUser({
              id: decoded.sub,
              role: decoded.role,
              name: decoded.name || decoded.sub,
              site_id: decoded.site_id || null,
            });
          }
        } catch {
          logout();
        }
      }
    
      setLoading(false);
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
      name: decoded.name || decoded.sub,
      site_id: decoded.site_id || null,
    });
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
