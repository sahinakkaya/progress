// src/App.tsx - Updated with routing
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import HabitDetailPage from './components/detail/HabitDetailPage';
import TargetDetailPage from './components/detail/TargetDetailPage';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/habit/:id" element={<HabitDetailPage />} />
        <Route path="/target/:id" element={<TargetDetailPage />} />
      </Routes>
    </Router>
  );
}

export default App;
