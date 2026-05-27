import React from 'react';

function DashboardGestor({ usuario, onLogout }) {
  return (
    <div style={styles.cardInfo}>
      <h2 style={styles.welcomeTitle}>Panel de Gestión y Análisis 📈</h2>
      <p style={styles.userMeta}><strong>Gestor:</strong> {usuario.nombre}</p>
      <span style={{ ...styles.badgeRol, backgroundColor: '#0d6efd' }}>{usuario.rol}</span>
      
      <hr style={styles.divider} />
      
      {/* Espacio para tus gráficos históricos y reportes de base de datos */}
      <div style={styles.moduloContenedor}>
        <h4 style={{ color: '#ffffff', margin: '0 0 10px 0' }}>Reportes de Eficiencia y Consumo Diario</h4>
        <p style={styles.placeholderText}>
          Aquí se renderizarán las gráficas de consumo, costos calculados de electricidad e históricos mensuales.
        </p>
      </div>

      <button onClick={onLogout} style={styles.buttonLogout}>
        Cerrar Sesión
      </button>
    </div>
  );
}

const styles = {
  // Copiamos los mismos estilos base para mantener consistencia visual
  cardInfo: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    padding: '30px',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    backdropFilter: 'blur(4px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    textAlign: 'center'
  },
  welcomeTitle: { color: '#ffffff', margin: '0 0 10px 0', fontSize: '24px' },
  userMeta: { color: 'rgba(255, 255, 255, 0.8)', margin: '5px 0', fontSize: '14px' },
  badgeRol: {
    display: 'inline-block',
    padding: '5px 12px',
    borderRadius: '20px',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginTop: '5px'
  },
  divider: { border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.2)', margin: '20px 0' },
  moduloContenedor: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: '15px',
    borderRadius: '8px',
    textAlign: 'left',
    marginBottom: '20px',
    border: '1.5px solid rgba(255, 255, 255, 0.1)'
  },
  placeholderText: { color: 'rgba(255, 255, 255, 0.6)', fontSize: '13px', lineHeight: '1.5', margin: 0 },
  buttonLogout: {
    padding: '10px 20px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: '#e63946',
    color: '#ffffff',
    fontWeight: 'bold',
    cursor: 'pointer'
  }
};

export default DashboardGestor;