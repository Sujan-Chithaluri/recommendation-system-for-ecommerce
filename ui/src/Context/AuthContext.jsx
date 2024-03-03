import React, { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem("isLoggedIn") === "true"
  );

  const [userDetails, setUserDetails] = useState(
    JSON.parse(localStorage.getItem("userData"))
  );

  const login = (data) => {
    localStorage.setItem("isLoggedIn", true);
    localStorage.setItem("userData", JSON.stringify(data));
    setIsLoggedIn(true);
    setUserDetails(data);
  };

  const logout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userData");
    setIsLoggedIn(false);
    setUserDetails(null);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout, userDetails }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
