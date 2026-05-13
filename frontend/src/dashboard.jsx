export default function Dashboard({ user }) {
  return (
    <div style={{ padding: 20 }}>
      <h1>Bienvenido {user.usuario}</h1>
      <p>Rol: {user.rol}</p>

      {user.rol === "admin" && <h2>Panel Admin</h2>}

      {user.rol === "supervisor" && <h2>Panel Supervisor</h2>}

      {user.rol === "empleado" && <h2>Panel Empleado</h2>}
    </div>
  );
}