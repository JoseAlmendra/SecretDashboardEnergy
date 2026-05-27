import { useState } from 'react'
import Loading from './Loading' // Importamos el componente de carga
import SecretsLogo from './logoLogin.jpg'

function Login({ mensaje, setMensaje, estado, setEstado, onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false); // Controla la carga del login
  const [verPassword, setVerPassword] = useState(false);


  const handleLogin = (e) => {
    e.preventDefault();
    setCargando(true);
    setMensaje("Autenticando...");
    
    fetch('http://192.168.1.65:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) {
          setMensaje(data.error);
          setEstado(false);
          setCargando(false);
        } else {
          setMensaje("¡Acceso concedido!");
          setEstado(true);
          
          // Esperamos un momento breve para que el usuario vea el mensaje de éxito
          setTimeout(() => {
            onLoginSuccess(data.usuario); // Enviamos el objeto {id, nombre, correo, rol} a App.jsx
            setCargando(false);
          }, 1000);
        }
    })
    .catch(() => {
        setMensaje("Error de autenticación. Verifica tus datos.");
        setEstado(false);
        setCargando(false);
    });
  };

  return (
    <div style={styles.pantallaLogin}>
        <style>{`
        input::-ms-reveal,
        input::-ms-clear {
          display: none !important;
        }
        input::-webkit-password-reveal {
          display: none !important;
        }
      `}</style>
      {cargando ? (
        <Loading texto="Verificando credenciales..." />
      ) : (
        <div style={styles.loginContent}>
          {/* Encabezado con imagen del logotipo y título */}
          <div style={styles.headerContainer}>
            <img src={SecretsLogo} alt="Secrets Logo" style={styles.logoImage} />
          </div>

          <h3 style={styles.loginActionText}>Iniciar Sesión</h3>

          {mensaje && (
            <div
              style={{
                color: '#ff4d4d',         // Rojo brillante y legible sobre fondos oscuros
                fontSize: '0.9em',        // Tamaño del texto
                fontWeight: 'bold',       // Texto en negrita para resaltar
                textAlign: 'center',      // Centrado debajo del título
                marginBottom: '25px',     // Mantiene la separación con el input de usuario
                width: '100%'
              }}
            >
              {mensaje}
            </div>
          )}

          <form onSubmit={handleLogin} style={styles.form}>
            {/* Campo de Usuario */}
            <div style={styles.inputGroup}>
              <label htmlFor="username" style={styles.label}>Usuario</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={styles.inputMinimalist}
                required
              />
            </div>

            {/* Campo de Contraseña */}
            <div style={styles.inputGroup}>
              <label htmlFor="password" style={styles.label}>Contraseña</label>
              <div style={styles.passwordContainer}>
                <input
                  type={verPassword ? "text" : "password"} // Cambia dinámicamente entre texto y password
                  id="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={styles.inputMinimalistPassword}
                  required
                />
                
                {/* Botón interactivo con el SVG del ojo */}
                <button
                  type="button"
                  onClick={() => setVerPassword(!verPassword)}
                  style={styles.eyeButton}
                  title={verPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {verPassword ? (
                    // Ícono de Ojo Abierto
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  ) : (
                    // Ícono de Ojo Cerrado / Tachado
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Botón de enviar estilo pastilla blanca */}
            <button type="submit" style={styles.buttonWhite}>
              Iniciar Sesión
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

// ... (Mismo objeto styles que tenías en tu Login.jsx)
const styles = {
  pantallaLogin: {
    width: '100%',
    maxWidth: '360px', 
    padding: '10px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginContent: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  headerContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '10px',
  },
  logoImage: {
    // CAMBIO: Incrementado de 65px a 110px para darle mayor impacto visual
    width: '20em', 
    height: 'auto',
    objectFit: 'contain'
  },
  mainTitle: {
    color: '#ffffff',
    fontSize: '36px',
    fontFamily: 'serif', 
    fontWeight: 'normal',
    letterSpacing: '4px',
    margin: '0px',
    textAlign: 'center',
  },
  subTitle: {
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 'bold',
    letterSpacing: '1.5px',
    margin: '5px 0 0 0',
    textAlign: 'center',
  },
  loginActionText: {
    color: '#ffffff',
    fontSize: '2em',
    fontWeight: 'bold',
    marginBottom: '35px',
  },
  form: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '30px', 
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start', // CAMBIO: Fuerza a que los labels e inputs se alineen al inicio izquierdo
    gap: '6px',
    width: '100%'
  },
  label: {
    color: '#ffffff',
    fontSize: '1.2em',
    fontWeight: 'bold',
    opacity: 0.95,
    textAlign: 'left' // Asegura la alineación del texto
  },
  inputMinimalist: {
    width: '100%',
    padding: '8px 0px',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '1.5px solid rgba(255, 255, 255, 0.7)', 
    color: '#ffffff',
    fontSize: '1.5em',
    outline: 'none',
  },
  // Contenedor especial relativo para posicionar el ojo encima del input
  passwordContainer: {
    position: 'relative',
    width: '100%',
    display: 'flex',
    alignItems: 'center'
  },
  inputMinimalistPassword: {
    width: '100%',
    padding: '8px 35px 8px 0px', // Añadimos padding a la derecha para que el texto no tape al ojo
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '1.5px solid rgba(255, 255, 255, 0.7)',
    color: '#ffffff',
    fontSize: '1.5em',
    outline: 'none',
  },
  eyeButton: {
    position: 'absolute',
    right: '0px',
    bottom: '8px',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'rgba(255, 255, 255, 0.7)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0px',
    outline: 'none',
  },
  buttonWhite: {
    width: '100%',
    padding: '14px',
    borderRadius: '8px', 
    border: 'none',
    backgroundColor: '#ffffff', 
    color: '#d0ab65', 
    fontSize: '15px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '15px',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
  },
  status: {
    padding: '10px 15px',
    borderRadius: '8px',
    fontSize: '13px',
    border: '1px solid',
    textAlign: 'center',
    marginTop: '5px',
    width: '100%'
  }
};

export default Login;