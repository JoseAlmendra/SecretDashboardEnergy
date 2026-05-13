import { useState } from "react";

export default function Login({ setUser }) {
  const [nombre, setNombre] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    const res = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, password })
    });

    const data = await res.json();

    if (res.ok) {
      setUser(data);
    } else {
      alert(data.mensaje);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Login</h2>

      <input
        placeholder="usuario"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
      />

      <br />

      <input
        type="password"
        placeholder="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <br />

      <button onClick={handleLogin}>
        Entrar
      </button>
    </div>
  );
}