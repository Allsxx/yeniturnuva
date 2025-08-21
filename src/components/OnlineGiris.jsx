import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { UserContext } from "./UserContext";

function OnlineGiris() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { setUser } = useContext(UserContext);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError("Giriş hatası: " + error.message);
      return;
    }
    if (!data.user) {
      setError("Giriş başarısız! Kullanıcı bulunamadı.");
      return;
    }

    
    setUser(data.user);

    
    navigate("/");
  };

  
  const handleRegister = () => {
    navigate("/register");
  };

  return (
    <div className="elemination-container" style={{ maxWidth: 400, margin: "40px auto" }}>
      <h2 className="elemination-title">Online Giriş Yap</h2>
      <form onSubmit={handleLogin}>
        <label className="elemination-label">E-posta:</label>
        <input
          className="elemination-input"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="E-posta adresiniz"
          required
        />
        <label className="elemination-label" style={{ marginTop: 13 }}>Şifre:</label>
        <input
          className="elemination-input"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Şifreniz"
          required
        />
        <button className="elemination-btn" type="submit" style={{ marginTop: 22, width: "100%" }} disabled={loading}>
          {loading ? "Giriş Yapılıyor..." : "Online Giriş Yap"}
        </button>
        {error && <div style={{ color: "red", marginTop: 12 }}>{error}</div>}
      </form>
      {/* Kayıt Ol Butonu */}
      <button
        className="elemination-btn"
        type="button"
        style={{ marginTop: 18, width: "100%", background: "#2c302aff", color: "#fff" }}
        onClick={handleRegister}
      >
        Kayıt Ol
      </button>
    </div>
  );
}

export default OnlineGiris;