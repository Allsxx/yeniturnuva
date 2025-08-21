import React, { useState } from "react";
import { supabase } from "../supabaseClient";

function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirm) {
      setError("Şifreler eşleşmiyor!");
      return;
    }
    if (!username.trim() || !email.trim() || !password.trim()) {
      setError("Tüm alanları doldurun!");
      return;
    }

    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username }
      }
    });

    if (error) {
      setError("Kayıt hatası: " + error.message);
      return;
    }
    setSuccess("Kayıt başarılı! Lütfen e-postanı kontrol ederek hesabını doğrula.");
    setUsername("");
    setEmail("");
    setPassword("");
    setConfirm("");
  };

  return (
    <div className="elemination-container" style={{ maxWidth: 440, margin: "40px auto" }}>
      <h2 className="elemination-title">Kayıt Ol</h2>
      <form onSubmit={handleRegister}>
        <label className="elemination-label">Kullanıcı Adı:</label>
        <input
          className="elemination-input"
          type="text"
          value={username}
          onChange={e => setUsername(e.target.value)}
          placeholder="Kullanıcı adınızı girin"
          required
        />
        <label className="elemination-label" style={{ marginTop: 13 }}>E-posta:</label>
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
          placeholder="Şifre oluşturun"
          required
        />
        <label className="elemination-label" style={{ marginTop: 13 }}>Şifre Tekrar:</label>
        <input
          className="elemination-input"
          type="password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          placeholder="Şifrenizi tekrar girin"
          required
        />
        <button className="elemination-btn" type="submit" style={{ marginTop: 22, width: "100%" }}>
          Kayıt Ol
        </button>
        {error && <div style={{ color: "red", marginTop: 12 }}>{error}</div>}
        {success && <div style={{ color: "green", marginTop: 12 }}>{success}</div>}
      </form>
    </div>
  );
}

export default Register;