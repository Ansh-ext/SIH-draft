import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';

// Layout Components
import Navbar from './components/layout/Navbar';
import GlobalFooter from './components/layout/GlobalFooter';

// Pages
import Home from './pages/Home';
import About from './pages/About';
import Pricing from './pages/Pricing'; // <--- Added Pricing Import
import Workbench from './pages/Workbench';
import Contact from './pages/Contact';
import ThankYou from './pages/ThankYou';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Terms from './pages/Terms';
import NotFound from './pages/NotFound';

// Standard Layout with Navbar & Footer
function MainLayout() {
  return (
    <div className="min-h-screen bg-[#0B0C0E] text-[#F7F8F8] flex flex-col font-sans selection:bg-[#35E6A4] selection:text-[#0B0C0E]">
      <Navbar />
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
      <GlobalFooter />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* All routes share MainLayout */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/workbench" element={<Workbench />} />
          <Route path="/about" element={<About />} />
          <Route path="/pricing" element={<Pricing />} /> {/* <--- Added Route */}
          <Route path="/contact" element={<Contact />} />
          <Route path="/thank-you" element={<ThankYou />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Router>
  );
}