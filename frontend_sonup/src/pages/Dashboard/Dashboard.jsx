import { useNavigate } from 'react-router-dom'
import './Dashboard.css'

const Dashboard = () => {
  const navigate = useNavigate()

  return (
    <div className="dashboard">
      <h1 className="dashboard__title">Dashboard</h1>
      <p className="dashboard__subtitle">Aquí irá el contenido principal de la aplicación.</p>
      <button className="dashboard__back" onClick={() => navigate('/login')}>
        ← Volver al login
      </button>
    </div>
  )
}

export default Dashboard
