import { Routes, Route, Navigate } from "react-router-dom";
import Prices from "./pages/Prices";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import { useState } from "react";

export default function App() {
  const [isAuthed, setIsAuthed] = useState(
    localStorage.getItem("cedars_admin_auth") === "true"
  );

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/prices" />} />
      <Route path="/prices" element={<Prices />} />
      <Route path="/login" element={<Login setIsAuthed={setIsAuthed} />} />
      <Route
        path="/admin"
        element={
          isAuthed ? <Admin setIsAuthed={setIsAuthed} /> : <Navigate to="/login" />
        }
      />
    </Routes>
  );
}
