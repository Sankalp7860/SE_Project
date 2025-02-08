import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "../pages/login.jsx";
import RegistrationPage from "../pages/register.jsx";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegistrationPage />} />
      </Routes>
    </Router>
  );
}

export default App;