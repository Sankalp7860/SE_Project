import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Logout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.removeItem("token"); // Remove token from local storage
    navigate("/login", { replace: true }); // Redirect to login page
  }, [navigate]);

  return null; // No need to render anything
};

export default Logout;
