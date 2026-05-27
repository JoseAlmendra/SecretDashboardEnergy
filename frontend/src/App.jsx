import { useEffect, useState, lazy, Suspense } from 'react'
import Login from './Login'
import Loading from './Loading' // Importamos el componente de carga
const DashboardOperador = lazy(() => import('./DashboardOperador'))
const DashboardGestor = lazy(() => import('./DashboardGestor'))

function App() {
  const [mensaje, setMensaje] = useState("Conectando...");
  const [estado, setEstado] = useState(true);
  const [verificandoBackend, setVerificandoBackend] = useState(true);
  const [usuarioAutenticado, setUsuarioAutenticado] = useState(null);

  const [cerrandoSesion, setCerrandoSesion] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [faseLoginListoLector, setFaseLoginListoLector] = useState(false);

  useEffect(() => {
    fetch('http://192.168.1.65:5000/')
      .then(res => res.json())
      .then(data => {
        setMensaje(data.mensaje);
        setEstado(true);
      })
      .catch(() => {
        setMensaje("Error conectando con backend");
        setEstado(false);
      })
      .finally(() => {
        setTimeout(() => {
          setVerificandoBackend(false);
          setMensaje("");
        }, 100); 
      });
  }, []);

  const handleLoginSuccess = (usuarioData) => {
    setUsuarioAutenticado(usuarioData);
    setFaseLoginListoLector(false);
  };
  
  // Función para limpiar la sesión y regresar al formulario
  const handleLogout = () => {
    setMenuAbierto(false);
    setCerrandoSesion(true); // Activa la fase de cierre de sesión (El fondo empieza a bajar inmediatamente)
    setUsuarioAutenticado(null);        // 2. Quitamos el usuario YA para desmontar los dashboards al instante y que no estorben visualmente.
    setMensaje("Cerrando sesión de forma segura...");
    setEstado(true);

    // Paso 1: Esperamos 800ms a que el fondo dorado termine de bajar por completo
    setTimeout(() => {
      setFaseLoginListoLector(true);    // Activa el desvanecido hacia afuera del Loading (.animacion-fade-out)
      
      // 4. Damos 400ms para que la animación de salida (fade-out) del Loading termine de completarse
      setTimeout(() => {
        setCerrandoSesion(false);       // Apaga el estado intermedio para dar paso definitivo al Login
        setMensaje("");
      }, 400);

    }, 2000);
  };

  
  const mostrarBannerSuperior = usuarioAutenticado !== null && !cerrandoSesion;
  const esGestor = usuarioAutenticado && usuarioAutenticado.rol === 'gestor';

  return (
    <div style={styles.appWrapper}>
      
      {/* 🥞 INYECCIÓN DE ESTILOS CSS PARA TRANSICIONES DE ENTRADA Y SALIDA (FADE) */}
      <style>{`
        @keyframes fadeInEfecto {
          from { opacity: 0; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes fadeOutEfecto {
          from { opacity: 1; transform: scale(1); }
          to { opacity: 0; transform: scale(0.97); }
        }
        .animacion-fade-in {
          animation: fadeInEfecto 0.5s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
        .animacion-fade-out {
          animation: fadeOutEfecto 0.4s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
        @keyframes fadeInModulo {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .view-fade-in {
          animation: fadeInModulo 0.6s ease-out forwards;
        }
      `}</style>

      {/* 🥞 CAPA DE FONDO ANIMADA (Se mantiene fija arriba como cabecera global) */}
      <div 
        style={{
          ...styles.fondoAnimadoCapa,
          ...(mostrarBannerSuperior ? styles.fondoTransformadoEnBanner : styles.fondoPantallaCompleta),
          zIndex: mostrarBannerSuperior ? 10 : 1
        }}
      >
        {usuarioAutenticado && (
          <div style={styles.bannerContenido}>
            {/* Contenedor invisible izquierdo para equilibrar el Flexbox y centrar el título */}
            <button 
              onClick={() => {
                console.log("Abriendo menú..."); // Debug útil para tu consola
                setMenuAbierto(true);
              }} 
              style={styles.iconBarButton}
              title="Abrir menú"
            >
              <svg width="32px" height="32px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 6H20M4 12H20M4 18H20" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
            </button>
            
            
            
            <h1 style={styles.logoTexto}>Hotel Energy System ⚡</h1>
            
            <div style={{ width: '40px' }}></div> 
            
          </div>
        )}
      </div>

      {/* 👤 MENÚ LATERAL DESPLEGABLE (NUEVA ORIENTACIÓN: IZQUIERDA) */}
      {/* Fondo oscuro atenuado */}
      <div 
        onClick={() => setMenuAbierto(false)}
        style={{
          ...styles.menuOverlay,
          opacity: menuAbierto ? 1 : 0,
          pointerEvents: menuAbierto ? 'auto' : 'none'
        }}
      />
      
      {/* Contenedor del menú (Cambió de right:0 a left:0 y usa -100% en el Translate) */}
      <div 
        style={{
          ...styles.menuLateral,
          transform: menuAbierto ? 'translateX(0)' : 'translateX(-100%)'
        }}
      >
        {usuarioAutenticado && (
          <div style={styles.menuContenido}>
            <button onClick={() => setMenuAbierto(false)} style={styles.closeMenuButton}>✕</button>
            
            <div style={styles.menuUserSection}>
              <div style={styles.avatarPlaceholder}>👤</div>
              <h3 style={styles.menuUserName}>{usuarioAutenticado.nombre}</h3>
              <p style={styles.menuUserRole}>{usuarioAutenticado.rol.toUpperCase()}</p>
              <p style={styles.menuUserMail}>{usuarioAutenticado.correo}</p>
            </div>

            <hr style={styles.menuDivider} />

            <div style={{ flex: 1 }} /> 

            <button onClick={handleLogout} style={styles.buttonLogout}>
              Cerrar Sesión
            </button>
          </div>
        )}
      </div>

      {/* CONTENEDOR PRINCIPAL DE LAS VISTAS */}
      <div style={{
        ...styles.containerContenido,
        alignItems: usuarioAutenticado ? 'flex-start' : 'center',
        paddingTop: usuarioAutenticado ? '130px' : '0px'
      }}>
        {verificandoBackend ? (
          <Loading texto="Iniciando sistema energético..." />
        ) : cerrandoSesion ? (
          /* 🌟 FASE INTERMEDIA: Muestra el Loading de forma fluida mientras el fondo baja */
          <div className={faseLoginListoLector ? "animacion-fade-out" : "animacion-fade-in"}>
            <Loading texto={mensaje || "Cerrando sesión..."} />
          </div>
        ): usuarioAutenticado ? (
          <Suspense fallback={<Loading texto="Cargando panel de control..." />}>
            <div style={{
              ...styles.dashboardContainer,
              maxWidth: esGestor ? '1200px' : '600px'
            }} className="view-fade-in">
              
              <style>{`
                @keyframes fadeInModulo {
                  from { opacity: 0; transform: translateY(15px); }
                  to { opacity: 1; transform: translateY(0); }
                }
                .view-fade-in {
                  animation: fadeInModulo 0.6s ease-out forwards;
                }
              `}</style>
              
              {usuarioAutenticado.rol === 'operador' && (
                <DashboardOperador usuario={usuarioAutenticado} />
              )}

              {usuarioAutenticado.rol === 'gestor' && (
                <DashboardGestor usuario={usuarioAutenticado} />
              )}

              {usuarioAutenticado.rol === 'admin' && (
                <div style={{ color: '#000', textAlign: 'center' }}>
                  <h2>Panel de Administrador General</h2>
                </div>
              )}

            </div>
          </Suspense>
        ) : (
          <div className="animacion-fade-in">
            <Login 
              mensaje={mensaje}
              setMensaje={setMensaje}
              estado={estado}
              setEstado={setEstado}
              onLoginSuccess={handleLoginSuccess} 
            />
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  appWrapper: {
    width: '100vw',
    height: '100vh',
    backgroundColor: '#ffffff',
    position: 'fixed',     
    top: 0,
    left: 0,
    overflow: 'hidden',
    fontFamily: 'Arial, sans-serif',
    zIndex: 1              
  },
  fondoAnimadoCapa: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    backgroundColor: '#d0ab65',
    transition: 'all 0.8s cubic-bezier(0.25, 1, 0.5, 1)',
    display: 'flex',
    alignItems: 'center',
    boxSizing: 'border-box'
  },
  fondoPantallaCompleta: {
    height: '100vh', // Cubre todo durante el Login y Operador
    padding: '0px'
  },
  fondoTransformadoEnBanner: {
    height: '90px', 
    padding: '0 30px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.15)'
  },
  bannerContenido: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '100%'
  },
  closeMenuButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '20px',
    color: '#ffffff',
    cursor: 'pointer'
  },
  iconBarButton: {
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.2s ease',
    outline: 'none'
  },
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 90,
    backdropFilter: 'blur(2px)',
    transition: 'opacity 0.4s ease'
  },
  menuLateral: {
    position: 'absolute',
    top: 0,
    left: 0, 
    width: '230px',
    height: '100vh',
    backgroundColor: '#917646',
    boxShadow: '4px 0 25px rgba(0,0,0,0.15)', 
    zIndex: 100,
    transition: 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)'
  },
  menuContenido: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    padding: '25px',
    boxSizing: 'border-box',
    position: 'relative'
  },
  menuUserSection: {
    textAlign: 'center',
    marginTop: '30px'
  },
  avatarPlaceholder: {
    fontSize: '45px',
    backgroundColor: '#f1f3f5',
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 15px auto',
    border: '2px solid #d0ab65'
  },
  menuUserName: {
    margin: '0 0 5px 0',
    color: '#e8e8eb',
    fontSize: '20px'
  },
  menuUserRole: {
    margin: '0 0 10px 0',
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#20c997',
    backgroundColor: '#e6fcf5',
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: '10px'
  },
  menuUserMail: {
    margin: 0,
    fontSize: '13px',
    color: '#ffffff'
  },
  menuDivider: {
    border: 'none',
    borderTop: '1px solid #dee2e6',
    margin: '25px 0'
  },
  buttonLogout: {
    padding: '12px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#dc3545',
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: '15px',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    width: '100%'
  },
  containerContenido: {
    position: 'relative',
    zIndex: 2, // Asegura que las letras y cajas queden por encima de la capa dorada
    width: '100%',
    height: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    transition: 'all 0.8s ease'
  },
  dashboardContainer: {
    width: '100%',
    padding: '20px',
    transition: 'all 0.5s ease'
  }
}

export default App