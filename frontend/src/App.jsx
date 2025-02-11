import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "../pages/login.jsx";
import RegistrationPage from "../pages/register.jsx";
import Logout from "../pages/logout.jsx";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegistrationPage />} />
        <Route path="/logout" element={<Logout />} />
      </Routes>
    </Router>
  );
}

export default App;