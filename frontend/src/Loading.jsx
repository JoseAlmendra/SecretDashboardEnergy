import { useEffect, useState } from 'react'
// Importación directa de la imagen desde src
import logoCaracol from './Logoo.png' 

function Loading({ texto = "" }) {
  const [frameLoader, setFrameLoader] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setFrameLoader(prevFrame => (prevFrame + 1) % 8);
    }, 190);
    
    return () => clearInterval(intervalId);
  }, []);

  const positions = [
    { top: '10%', left: '50%' },   // 0 (arriba)
    { top: '18%', left: '78%' },   // 1
    { top: '50%', left: '90%' },   // 2
    { top: '82%', left: '78%' },   // 3
    { top: '90%', left: '50%' },   // 4
    { top: '82%', left: '22%' },   // 5
    { top: '50%', left: '10%' },   // 6
    { top: '18%', left: '22%' },   // 7
  ];

  const getCircleStyle = (index) => {
    const position = positions[index];
    const offset = (index + frameLoader) % 8; 
    
    let size, opacity;
    if (offset === 0) { size = '22%'; opacity = 1; }
    else if (offset === 1) { size = '18%'; opacity = 0.8; }
    else if (offset === 2) { size = '13%'; opacity = 0.6; }
    else if (offset === 3) { size = '8%'; opacity = 0.4; }
    else if (offset === 4) { size = '5%'; opacity = 0.2; }
    else { size = '0%'; opacity = 0; }

    return {
      ...position,
      width: size,
      height: size,
      opacity: opacity,
      transform: 'translate(-50%, -50%)',
      position: 'absolute',
      borderRadius: '50%',
      backgroundColor: 'white',
      transition: 'width 0.15s ease-out, height 0.15s ease-out, opacity 0.15s ease-out',
      boxShadow: '0 0 10px rgba(255, 255, 255, 0.4)',
    };
  };

  return (
    <div style={styles.cargandoWrapper}>
      <div style={styles.loaderContainer}>
        {/* Contenedor del logo corregido (sin fondo blanco rígido) */}
        <div style={styles.loaderLogoContainer}>
          <img src={logoCaracol} alt="Logo Caracol" style={styles.loaderLogoImage} />
        </div>
        {positions.map((_, index) => (
          <div key={index} style={getCircleStyle(index)} />
        ))}
      </div>
      {/* Texto con mejor contraste para el fondo `#d0ab65` */}
      <p style={styles.cargandoTexto}>{texto}</p>
    </div>
  );
}

const styles = {
  cargandoWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
    padding: '20px 0',
    width: '100%',
  },
  loaderContainer: {
    position: 'relative',
    width: '30vmin',  
    height: '30vmin',
    // Ajustamos los mínimos para que en pantallas pequeñas mantenga un tamaño imponente
    minWidth: '150px',
    minHeight: '150px',
    maxWidth: '240px',
    maxHeight: '240px'
  },
  loaderLogoContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '54%', 
    height: '54%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  loaderLogoImage: {
    width: '100%',
    height: '100%',
    objectFit: 'contain', // Fuerza a la imagen a adaptarse sin deformarse
    display: 'block'
  },
  cargandoTexto: {
    color: '#ffffff', // Cambiado a blanco para que resalte sobre el fondo café
    fontSize: '16px',
    fontWeight: 'bold',
    margin: 0,
    textAlign: 'center',
    textShadow: '0 1px 4px rgba(0,0,0,0.3)' // Sombra para mejorar legibilidad
  }
};

export default Loading;