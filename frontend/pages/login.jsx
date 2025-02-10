import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Mail, Lock } from 'lucide-react';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "http://localhost:8080/api/auth/login",
        { email, password },
        { withCredentials: true }
      );

      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        navigate("/dashboard");
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      alert(error.response?.data?.message || "Login failed!");
    }
  };

  return (
    <div className="login-container">
      <div className="animated-bg"></div>
      <div className="login-content">
        <div className="login-box">
          <div className="logo">
            <div className="music-note">♪</div>
            <h1>MoodTunes</h1>
          </div>
          <h2 className="login-title">Sign in to your account</h2>
          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <div className="input-with-icon">
                <Mail className="input-icon" size={20} />
                <input 
                  type="email"
                  className="login-input"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <div className="input-with-icon">
                <Lock className="input-icon" size={20} />
                <input 
                  type="password"
                  className="login-input"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <button type="submit" className="login-button">
              <span>Login</span>
              <div className="button-glow"></div>
            </button>
          </form>
          <p className="signup-link">
            Don't have an account? <a href="/register">Sign Up</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;