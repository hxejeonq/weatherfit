import { Routes, Route } from 'react-router-dom'
import WeatherPage from './pages/WeatherPage.jsx'
import OutfitPage from './pages/OutfitPage.jsx'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<WeatherPage />} />
      <Route path="/outfit" element={<OutfitPage />} />
    </Routes>
  )
}

export default App
