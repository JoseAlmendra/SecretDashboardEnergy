import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom'; // 📦 Importamos ReactDOM para usar Portals
import Loading from './Loading';

function NotificacionToast({ tipo, mensaje, alCerrar, ocultando }) {
  if (!mensaje) return null;

  const esError = tipo === 'error';
  const icono = esError ? '⚠️' : '✅';
  const titulo = esError ? 'Error de Envío' : 'Registro subido exitosamente';
  
  // Paletas de color según el estado
  const backgroundColor = esError ? '#fff3f3' : '#f0fdf4';
  const borderColor = esError ? '#f5c2c2' : '#bbf7d0';
  const tituloColor = esError ? '#d9383a' : '#15803d';
  const shadowColor = esError ? 'rgba(217, 56, 58, 0.15)' : 'rgba(21, 128, 61, 0.12)';

  return ReactDOM.createPortal(
    <div 
      style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: backgroundColor,
        border: `1px solid ${borderColor}`,
        borderRadius: '8px',
        padding: '14px 20px',
        width: '90%',
        maxWidth: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: `0 8px 20px ${shadowColor}`,
        boxSizing: 'border-box',
        zIndex: 100000
      }} 
      className={ocultando ? "toast-salida" : "toast-entrada"}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
        <span style={{ fontSize: '20px' }}>{icono}</span>
        <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
          <strong style={{ fontSize: '14px', color: tituloColor }}>{titulo}</strong>
          <span style={{ fontSize: '12px', color: '#495057' }}>{mensaje}</span>
        </div>
      </div>
      <button 
        onClick={alCerrar} 
        style={{
          backgroundColor: 'transparent',
          border: 'none',
          fontSize: '16px',
          color: '#868e96',
          cursor: 'pointer',
          padding: '4px 8px',
          fontWeight: 'bold'
        }}
      >✕</button>
    </div>,
    document.body
  );
}

function DashboardOperador({ usuario }) {
  const [diasRevisados, setDiasRevisados] = useState([]);
  const [conteoDias, setConteoDias] = useState({});
  const [mostrarDialogo, setMostrarDialogo] = useState(false); 
  const [mostrarDialogoFiltros, setMostrarDialogoFiltros] = useState(false);

  const [enviandoDatos, setEnviandoDatos] = useState(false);
  const [toastConfig, setToastConfig] = useState({ tipo: '', mensaje: null }); // { tipo: 'error'|'exito', mensaje: '...' }
  const [ocultandoToast, setOcultandoToast] = useState(false);

  const [formLectura, setFormLectura] = useState({
    kwh: '',
    kvarh: '',
    kw: ''
  });
  const [imagenMedidor, setImagenMedidor] = useState(null);
  const [vistaPreviaUrl, setVistaPreviaUrl] = useState('');

  const fechaActual = new Date();
  const añoActual = fechaActual.getFullYear();
  const mesActual = fechaActual.getMonth(); 
  const hoyStr = fechaActual.toISOString().split('T')[0]; 

  const mesesNombres = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  useEffect(() => {
    fetch('http://192.168.1.65:5000/api/mes')
      .then(res => {
        if (!res.ok) throw new Error('Error en la respuesta del servidor');
        return res.json();
      })
      .then(data => {
        // Reducimos el arreglo agrupando por fecha_id y contando los registros de ese día
        const mapaConteo = data.reduce((acc, lectura) => {
          const fecha = lectura.fecha_id;
          acc[fecha] = (acc[fecha] || 0) + 1;
          return acc;
        }, {});
        
        setConteoDias(mapaConteo);
      })
      .catch(err => {
        console.error("Error al traer las lecturas del medidor:", err);
      });
  }, []);

  useEffect(() => {
    // Tomamos el rol directamente del usuario autenticado (ej: 'operador' o 'administrador')
    const rolUsuario = usuario?.rol || 'operador';
    
    // Abrimos el canal persistente HTTP inyectándole la query string con el sector correspondiente
    const eventSource = new EventSource(`http://192.168.1.65:5000/api/alertas/stream?rol=${rolUsuario}`);

    eventSource.onmessage = (event) => {
      try {
        const datosAlerta = JSON.parse(event.data);
        
        // Disparar nuestro Toast dinámicamente según lo dictado por el Servidor
        setToastConfig({
          tipo: datosAlerta.tipo,     // 'exito' o 'error'
          mensaje: datosAlerta.mensaje // Mensaje personalizado de la alerta hotelera
        });
      } catch (err) {
        console.error("Error decodificando alerta SSE:", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("Fallo o reconexión automática en el canal de alertas SSE:", err);
    };

    // Limpieza de hilos de red al desmontar el dashboard
    return () => {
      eventSource.close();
    };
  }, [usuario]);

  // --- LÓGICA DE CALENDARIO NATIVO ---
  const primerDiaSemana = new Date(añoActual, mesActual, 1).getDay();
  const offsetDias = primerDiaSemana === 0 ? 6 : primerDiaSemana - 1;
  const totalDiasMes = new Date(añoActual, mesActual + 1, 0).getDate();

  const celdasCalendario = [];
  
  for (let i = 0; i < offsetDias; i++) {
    celdasCalendario.push({ esVacio: true, id: `vacio-${i}` });
  }

  for (let d = 1; d <= totalDiasMes; d++) {
    const mesFormateado = String(mesActual + 1).padStart(2, '0');
    const diaFormateado = String(d).padStart(2, '0');
    const fechaID = `${añoActual}-${mesFormateado}-${diaFormateado}`;
    
    celdasCalendario.push({
      esVacio: false,
      diaNumero: d,
      fechaID: fechaID,
      esHoy: fechaID === hoyStr
    });
  }

  // Manejador de cambios en los inputs numéricos
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormLectura(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const procesarYComprimirImagen = (archivo) => {
    return new Promise((resolve) => {
      const lector = new FileReader();
      lector.readAsDataURL(archivo);
      lector.onload = (evento) => {
        const img = new Image();
        img.src = evento.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_ANCHO = 900; // Redolución óptima para visualización rápida en sistema
          let ancho = img.width;
          let alto = img.height;

          if (ancho > MAX_ANCHO) {
            alto = Math.round((alto * MAX_ANCHO) / ancho);
            ancho = MAX_ANCHO;
          }

          canvas.width = ancho;
          canvas.height = alto;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, ancho, alto);

          // Exportación comprimida al 60% de calidad en formato JPEG
          let base64Comprimido = canvas.toDataURL('image/avif', 0.35);

          if (base64Comprimido.startsWith('data:image/png')) {
            console.warn("--> El navegador no soporta AVIF nativo. Aplicando respaldo en WebP.");
            base64Comprimido = canvas.toDataURL('image/webp', 0.40);
          } else {
            console.log("--> ¡Imagen comprimida exitosamente usando AVIF experimental!");
          }
          resolve(base64Comprimido);
        };
      };
    });
  };

  // Manejador del archivo de imagen adjunto
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setVistaPreviaUrl(URL.createObjectURL(file)); // Muestra la previsualización al instante
      
      // Iniciamos compresión en background y guardamos el String de texto resultante
      const bitsComprimidos = await procesarYComprimirImagen(file);
      setImagenMedidor(bitsComprimidos);
    }
  };

  const cerrarToast = () => {
    setOcultandoToast(true);
    setTimeout(() => {
      setToastConfig({ tipo: '', mensaje: null });
      setOcultandoToast(false);
    }, 400); 
  };
  // Manejador del envío del formulario
  const handleFormSubmit = (e) => {
    e.preventDefault();
    setEnviandoDatos(true); // Activa el loading y oscurece el modal
    setToastConfig({ tipo: '', mensaje: null });

    console.log("Datos de lectura enviados:", formLectura);
    console.log("Archivo de imagen adjunto:", imagenMedidor);
    
    const payload = {
      kwh: formLectura.kwh,
      kvarh: formLectura.kvarh,
      kw: formLectura.kw,
      fecha_id: hoyStr,
      operador_id: usuario?.id || null,
      foto_b64: imagenMedidor // Aquí van los bits comprimidos en formato string
    };

    fetch('http://192.168.1.65:5000/api/registrar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
      .then(res => {
        if (!res.ok) {
          return res.json().then(err => { throw new Error(err.error || 'Error al guardar el registro') });
        }
        return res.json();
      })
      .then(data => {
        console.log("¡Éxito!", data.mensaje);

        // Actualizamos visualmente el mapa de conteos sumando +1 al día actual de forma segura
        setConteoDias(prev => ({
          ...prev,
          [hoyStr]: Math.min((prev[hoyStr] || 0) + 1, 3)
        }));

        setToastConfig({
          tipo: 'exito',
          mensaje: 'Los datos del medidor se guardaron con éxito.'
        });

        // Resetear estados y cerrar diálogo modal[cite: 3]
        setFormLectura({ kwh: '', kvarh: '', kw: '' }); //[cite: 3]
        setImagenMedidor(null); //[cite: 3]
        setVistaPreviaUrl(''); //[cite: 3]
        setMostrarDialogo(false); //[cite: 3]
      })
      .catch(err => {
        console.error("Error al guardar el registro en el servidor:", err);
        alert(`No se pudo guardar el registro: ${err.message}`);
        setToastConfig({
          tipo: 'error',
          mensaje: err.message
        });
      })
      .finally(() => {
        setEnviandoDatos(false); 
      });
  };

  const obtenerColorCelda = (cantidad) => {
    if (!cantidad || cantidad === 0) return '#ebedf0'; // Sin checar (Gris)
    if (cantidad === 1) return '#c6e48b';             // 1 Chequeo (Verde Claro)
    if (cantidad === 2) return '#7bc96f';             // 2 Chequeos (Verde Medio)
    return '#239a3b';                                 // 3 Chequeos (Verde Completo)
  };
  
  const handleCeldaClick = (celda) => {
    if (diasRevisados.includes(celda.fechaID)) {
      setDiasRevisados(diasRevisados.filter(id => id !== celda.fechaID));
    } else {
      setDiasRevisados([...diasRevisados, celda.fechaID]);
    }
  };

  return (
    <>
      <style>{`
        @keyframes slideInToast {
          from { transform: translate(-50%, -100px); opacity: 0; }
          to { transform: translate(-50%, 20px); opacity: 1; }
        }
        @keyframes slideOutToast {
          from { transform: translate(-50%, 20px); opacity: 1; }
          to { transform: translate(-50%, -100px); opacity: 0; }
        }
        .toast-entrada {
          animation: slideInToast 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        .toast-salida {
          animation: slideOutToast 0.4s ease-in forwards;
        }
      `}</style>

      <NotificacionToast 
        tipo={toastConfig.tipo}
        mensaje={toastConfig.mensaje}
        alCerrar={cerrarToast}
        ocultando={ocultandoToast}
      />

      <div style={styles.heatmapCardContenedor}>
        <button 
          style={styles.botonAccionSuperior} 
          onClick={() => setMostrarDialogo(true)}
        >
          Registrar Medidor
        </button>

        <div style={styles.heatmapHeader}>
          <h4 style={styles.heatmapTitle}>{mesesNombres[mesActual]}</h4>
        </div>

        <div style={styles.heatmapWrapperInterno}>
          <div style={styles.diasSemanaGrid}>
            <div style={styles.diaSemanaCelda}>L</div>
            <div style={styles.diaSemanaCelda}>M</div>
            <div style={styles.diaSemanaCelda}>M</div>
            <div style={styles.diaSemanaCelda}>J</div>
            <div style={styles.diaSemanaCelda}>V</div>
            <div style={styles.diaSemanaCelda}>S</div>
            <div style={styles.diaSemanaCelda}>D</div>
          </div>

          <div style={styles.heatmapGrid}>
            {celdasCalendario.map((celda) => {
              if (celda.esVacio) {
                return <div key={celda.id} style={styles.cuadritoVacio} />;
              }

              const cantidadChequeos = conteoDias[celda.fechaID] || 0;
              
              const estiloDinamicoCuadrito = {
                ...styles.cuadritoDia,
                backgroundColor: obtenerColorCelda(cantidadChequeos),
                border: celda.esHoy ? '3px solid #65cdd0' : '1px solid rgba(0,0,0,0.03)',
                boxShadow: celda.esHoy ? '0 0 6px rgba(101, 205, 208, 0.6)' : 'none',
                transform: celda.esHoy ? 'translateX(-1px)' : 'none', 
                zIndex: celda.esHoy ? 2 : 1
              };

              return (
                <div 
                  key={celda.fechaID} 
                  style={estiloDinamicoCuadrito}
                  title={`${celda.fechaID} — ${cantidadChequeos} de 3 chequeos completados ${celda.esHoy ? '(Hoy)' : ''}`}
                />
              );
            })}
          </div>

          
        </div>

        <div style={styles.leyendaContenedor}>
            <span style={styles.leyendaTexto}>Menos</span>
            <div style={{ ...styles.leyendaCuadro, backgroundColor: '#ebedf0' }} title="0 chequeos (Sin registrar)" />
            <div style={{ ...styles.leyendaCuadro, backgroundColor: '#c6e48b' }} title="1 chequeo realizado" />
            <div style={{ ...styles.leyendaCuadro, backgroundColor: '#7bc96f' }} title="2 chequeos realizados" />
            <div style={{ ...styles.leyendaCuadro, backgroundColor: '#239a3b' }} title="3 chequeos (Día Completo)" />
            <span style={styles.leyendaTexto}>Más</span>
        </div>
      </div>

      <div style={styles.cardInfo}>
        <h2 style={styles.welcomeTitle}>Monitoreo y Cargas en Tiempo Real ⚙️</h2>
        <span style={styles.badgeRol}>{usuario.rol}</span>
        <hr style={styles.divider} />
        
        <div style={styles.moduloContenedor}>
          <h4 style={{ color: '#2b2d42', margin: '0 0 10px 0' }}>Tablero General de Control</h4>
          <p style={styles.placeholderText}>
            Aquí irán las lecturas directas de energía, estados de interruptores o el control de tableros del hotel. El sistema está listo para operar.
          </p>
        </div>
      </div>

      {/* 🥞 PORTAL PARA EL DIÁLOGO DE LECTURAS (HOY) */}
      {mostrarDialogo && ReactDOM.createPortal(
        <div style={styles.overlayModal} onClick={() => !enviandoDatos && setMostrarDialogo(false)}>
          <div style={{
            ...styles.dialogoBox,
            position: 'relative',
            transition: 'all 0.3s ease',
            backgroundColor: enviandoDatos ? '#e9ecef' : '#ffffff', // Se oscurece sutilmente al enviar
            opacity: enviandoDatos ? 0.9 : 1
          }} onClick={(e) => e.stopPropagation()}>
            
            {/* 🌟 CAPA LOADER INTERNA */}
            {enviandoDatos && (
              <div style={styles.capaBloqueoLector}>
                <Loading texto="Guardando registros..." />
              </div>
            )}

            <h3 style={styles.dialogoTitulo}>Ingresar Lecturas del Día</h3>
            <p style={styles.dialogoTexto}>Por favor, introduce los valores actuales medidos en el tablero principal.</p>
            
            <form onSubmit={handleFormSubmit} style={styles.formularioGrid}>
              <div style={styles.grupoInput}>
                <label style={styles.labelForm}>Consumo Energía Activa (kWh)</label>
                <input type="number" step="any" name="kwh" required disabled={enviandoDatos} value={formLectura.kwh} onChange={handleInputChange} style={styles.inputStyle} />
              </div>
              <div style={styles.grupoInput}>
                <label style={styles.labelForm}>Energía Reactiva (kVArh)</label>
                <input type="number" step="any" name="kvarh" required disabled={enviandoDatos} value={formLectura.kvarh} onChange={handleInputChange} style={styles.inputStyle} />
              </div>
              <div style={styles.grupoInput}>
                <label style={styles.labelForm}>Demanda Máxima (kW)</label>
                <input type="number" step="any" name="kw" required disabled={enviandoDatos} value={formLectura.kw} onChange={handleInputChange} style={styles.inputStyle} />
              </div>

              <div style={styles.grupoInput}>
                <label style={styles.labelForm}>Evidencia Fotográfica del Medidor</label>
                <div style={styles.contenedorUpload}>
                  <input type="file" accept="image/*" id="foto-medidor" disabled={enviandoDatos} onChange={handleFileChange} style={styles.fileInputOculto} />
                  <label htmlFor="foto-medidor" style={{...styles.labelUploadBoton, cursor: enviandoDatos ? 'not-allowed' : 'pointer'}}>
                    {imagenMedidor ? '🔄 Cambiar Imagen' : '📷 Tomar Foto / Evidencia'}
                  </label>
                  {vistaPreviaUrl && (
                    <div style={styles.wrapperVistaPrevia}>
                      <img src={vistaPreviaUrl} alt="Vista previa del tablero" style={styles.imagenVistaPrevia} />
                    </div>
                  )}
                </div>
              </div>

              <div style={styles.contenedorAccionesForm}>
                <button type="button" disabled={enviandoDatos} style={styles.botonCancelar} onClick={() => setMostrarDialogo(false)}>
                  Cancelar
                </button>
                <button type="submit" disabled={enviandoDatos} style={styles.botonEnviar}>
                  Guardar Registro
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

const styles = {
  cardInfo: {
    backgroundColor: '#f8f9fa',
    width: '100%',
    padding: '30px',
    borderRadius: '12px',
    boxShadow: '0 6px 18px rgba(0, 0, 0, 0.06)',
    border: '1px solid rgba(0, 0, 0, 0.05)',
    boxSizing: 'border-box'
  },
  welcomeTitle: { color: '#2b2d42', margin: '0 0 10px 0', fontSize: '24px', textAlign: 'center' },
  badgeRol: {
    display: 'inline-block',
    padding: '5px 12px',
    borderRadius: '20px',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    backgroundColor: '#20c997',
    margin: '0 auto 10px auto'
  },
  divider: { border: 'none', borderTop: '1px solid rgba(0, 0, 0, 0.1)', margin: '20px 0' },
  
  heatmapCardContenedor: {
    backgroundColor: '#ffffff',
    padding: '20px',
    borderRadius: '10px',
    marginBottom: '25px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center' 
  },
  heatmapHeader: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%', 
    maxWidth: '232px',
    marginBottom: '15px'
  },
  heatmapTitle: {
    color: '#2b2d42',
    margin: 0,
    fontSize: '16px',
    fontWeight: 'bold',
  },
  heatmapWrapperInterno: {
    width: '100%',
    maxWidth: '232px' 
  },
  diasSemanaGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 28px)', 
    gap: '6px',
    justifyContent: 'center',
    marginBottom: '8px'
  },
  diaSemanaCelda: {
    width: '28px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '12px',
    color: '#a1a6ab',
    fontWeight: 'bold',
  },
  heatmapGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 28px)', 
    gap: '6px',
    justifyContent: 'center'
  },
  cuadritoDia: {
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    userSelect: 'none',
    boxSizing: 'border-box'
  },
  cuadritoVacio: {
    width: '28px',
    height: '28px',
    backgroundColor: 'transparent',
    boxSizing: 'border-box'
  },
  moduloContenedor: {
    backgroundColor: '#ffffff',
    padding: '20px',
    borderRadius: '8px',
    textAlign: 'left',
    border: '1px solid rgba(0, 0, 0, 0.08)'
  },
  placeholderText: { color: '#6c757d', fontSize: '14px', lineHeight: '1.6', margin: 0 },
  botonAccionSuperior: {
    backgroundColor: '#2b2d42',
    color: '#ffffff',
    border: 'none',
    padding: '10px 18px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '13px',
    marginBottom: '18px',
    boxShadow: '0 4px 10px rgba(43, 45, 66, 0.15)',
    transition: 'transform 0.15s ease, background-color 0.15s ease',
    outline: 'none',
  },

  // Estilos limpios y absolutos para el viewport global
  overlayModal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    backdropFilter: 'blur(3px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999 // Asegura superponerse al banner superior (z-index: 10) y al menú lateral (z-index: 100)
  },
  dialogoBox: {
    backgroundColor: '#ffffff',
    padding: '24px',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '360px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
    textAlign: 'center',
  },
  dialogoTitulo: {
    margin: '0 0 12px 0',
    color: '#2b2d42',
    fontSize: '18px',
    fontWeight: 'bold'
  },
  dialogoTexto: {
    color: '#6c757d',
    fontSize: '14px',
    margin: '0 0 20px 0',
    lineHeight: '1.5'
  },
  botonCerrar: {
    backgroundColor: '#2b2d42',
    color: '#ffffff',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '13px',
    transition: 'background-color 0.2s',
  },
  formularioGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  grupoInput: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  labelForm: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#495057'
  },
  inputStyle: {
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid #ced4da',
    fontSize: '14px',
    color: '#2b2d42',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
    backgroundColor: '#f8f9fa'
  },
  contenedorUpload: {
    border: '2px dashed #dee2e6',
    borderRadius: '8px',
    padding: '15px',
    textAlign: 'center',
    backgroundColor: '#f8f9fa',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px'
  },
  fileInputOculto: {
    display: 'none'
  },
  labelUploadBoton: {
    backgroundColor: '#ebedf0',
    color: '#495057',
    padding: '8px 14px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    border: '1px solid #ced4da',
    display: 'inline-block',
    transition: 'background-color 0.2s'
  },
  wrapperVistaPrevia: {
    width: '100%',
    maxWidth: '180px',
    height: '110px',
    borderRadius: '6px',
    overflow: 'hidden',
    border: '1px solid #dee2e6',
    boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
    backgroundColor: '#ffffff'
  },
  imagenVistaPrevia: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  contenedorAccionesForm: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '10px'
  },
  botonCancelar: {
    backgroundColor: 'transparent',
    color: '#6c757d',
    border: '1px solid #ced4da',
    padding: '10px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '13px',
    transition: 'background-color 0.2s'
  },
  botonEnviar: {
    backgroundColor: '#2b2d42',
    color: '#ffffff',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '13px',
    boxShadow: '0 4px 10px rgba(43, 45, 66, 0.15)',
    transition: 'background-color 0.2s'
  },

  leyendaContenedor: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end', // Lo empuja a la esquina inferior derecha
    gap: '4px',                 // Espaciado corto entre cuadritos al estilo GitHub
    marginTop: '12px',          // Separa la leyenda de la cuadrícula
    paddingRight: '2px'
  },
  leyendaTexto: {
    fontSize: '11px',
    color: '#868e96',           // Color gris suave para las palabras "Menos" y "Más"
    margin: '0 3px',
    userSelect: 'none'
  },
  leyendaCuadro: {
    width: '12px',              // Cuadritos sutiles y más pequeños que las celdas principales
    height: '12px',
    borderRadius: '3px',
    border: '1px solid rgba(0,0,0,0.05)',
    transition: 'transform 0.1s ease'
  },
  capaBloqueoLector: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: '12px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10
  },
  toastErrorNotificacion: {
    position: 'fixed',
    top: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#fff3f3',
    border: '1px solid #f5c2c2',
    borderRadius: '8px',
    padding: '14px 20px',
    width: '90%',
    maxWidth: '400px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 8px 20px rgba(217, 56, 58, 0.15)',
    boxSizing: 'border-box'
  },
  botonCerrarToast: {
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '16px',
    color: '#868e96',
    cursor: 'pointer',
    padding: '4px 8px',
    fontWeight: 'bold',
    transition: 'color 0.2s'
  }
};

export default DashboardOperador;