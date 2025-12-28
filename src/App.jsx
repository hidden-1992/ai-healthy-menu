import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TabNavigation from './components/layout/TabNavigation';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import AssessmentPage from './pages/AssessmentPage';
import ScenePage from './pages/ScenePage';

function App() {
  return (
    <BrowserRouter>
      <div className="app-container max-w-[480px] mx-auto min-h-screen bg-gray-50 relative pb-16">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/assessment" element={<AssessmentPage />} />
          <Route path="/scene" element={<ScenePage />} />
        </Routes>
        <TabNavigation />
      </div>
    </BrowserRouter>
  );
}

export default App;
