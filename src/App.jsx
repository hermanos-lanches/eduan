import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Overview from './pages/Overview'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* / → redirect to /overview */}
        <Route path="/" element={<Navigate to="/overview" replace />} />
        <Route path="/overview" element={<Overview />} />
      </Routes>
    </BrowserRouter>
  )
}
