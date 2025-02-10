import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import './Register.css';

const Register = () => {
 const [name, setName] = useState("");
 const [email, setEmail] = useState("");
 const [password, setPassword] = useState("");
 const navigate = useNavigate();

 const handleRegister = async (e) => {
   e.preventDefault();
   try {
     const response = await axios.post(
       "http://localhost:8080/api/auth/register",
       { name, email, password },
       { withCredentials: true }
     );

     if (response.data.token) {
       navigate("/login");
     } else {
       alert(response.data.message);
     }
   } catch (error) {
     alert(error.response?.data?.message || "Registration failed!");
   }
 };

 return (
   <div className="login-container">
     <div className="animated-bg"></div>
     <div className="login-content">
       <div className="login-box">
         <div className="logo">
           <div className="music-note">♪</div>
           <h1>Melodify</h1>
         </div>
         <h2 className="login-title">Create your account</h2>
         <form onSubmit={handleRegister} className="login-form">
           <div className="form-group">
             <input 
               type="text"
               className="login-input"
               placeholder="Name"
               value={name}
               onChange={(e) => setName(e.target.value)}
               required
             />
           </div>
           <div className="form-group">
             <input 
               type="email"
               className="login-input"
               placeholder="Email"
               value={email}
               onChange={(e) => setEmail(e.target.value)}
               required
             />
           </div>
           <div className="form-group">
             <input 
               type="password"
               className="login-input"
               placeholder="Password"
               value={password}
               onChange={(e) => setPassword(e.target.value)}
               required
             />
           </div>
           <button type="submit" className="login-button">
             <span>Sign Up</span>
             <div className="button-glow"></div>
           </button>
         </form>
         <p className="signup-link">
           Already have an account? <a href="/login">Sign in</a>
         </p>
       </div>
     </div>
   </div>
 );
};

export default Register;