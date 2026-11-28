import { lazy, Suspense } from 'react';
import { NavLink, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import SampleEditor from './pages/SampleEditor.jsx';
import SampleDetail from './pages/SampleDetail.jsx';

// Keep the first-screen and sample-entry workflows in the initial bundle.
// Load specialist workspaces only when the user opens their route.
const MapPage = lazy(() => import('./pages/MapPage.jsx'));
const ImportPage = lazy(() => import('./pages/ImportPage.jsx'));
const SettingsPage = lazy(() => import('./pages/SettingsPage.jsx'));
const ReportsPage = lazy(() => import('./pages/ReportsPage.jsx'));
const GeophysicsPage = lazy(() => import('./pages/GeophysicsPage.jsx'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage.jsx'));
const DataBackupPage = lazy(() => import('./pages/DataBackupPage.jsx'));
const VulnerabilityPage = lazy(() => import('./pages/VulnerabilityPage.jsx'));
const GodPage = lazy(() => import('./pages/GodPage.jsx'));
const WQIPage = lazy(() => import('./pages/WQIPage.jsx'));
const HydrochemistryPage = lazy(() => import('./pages/HydrochemistryPage.jsx'));
const IDWPage = lazy(() => import('./pages/IDWPage.jsx'));

export default function App() {
  return (
    <div className="app-shell">
      <header className="topnav">
        <div className="brand">
          <span className="brand-mark">◉</span>
          <span>
            ND WATER QUALITY
            <small>Groundwater &amp; environmental monitoring</small>
          </span>
        </div>
        <nav>
          <NavLink to="/" end>Dashboard</NavLink>
          <NavLink to="/new">New sample</NavLink>
          <NavLink to="/map">GIS map</NavLink>
          <NavLink to="/geophysics">VES / ERT</NavLink>
          <NavLink to="/analytics">Analytics</NavLink>
          <NavLink to="/import">Import</NavLink>
          <NavLink to="/reports">Reports</NavLink>
          <NavLink to="/settings">Settings</NavLink>
          <NavLink to="/data-backup">Backup &amp; restore</NavLink>
          <NavLink to="/vulnerability">DRASTIC</NavLink>
          <NavLink to="/god">GOD</NavLink>
          <NavLink to="/wqi">WQI</NavLink>
          <NavLink to="/hydrochemistry">Hydrochemistry</NavLink>
          <NavLink to="/idw">IDW spatial analysis</NavLink>
        </nav>
      </header>
      <main>
        <Suspense fallback={
          <div className="page">
            <p className="notice" role="status">Loading workspace…</p>
          </div>
        }>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/new" element={<SampleEditor />} />
            <Route path="/sample/:id" element={<SampleDetail />} />
            <Route path="/edit/:id" element={<SampleEditor />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/geophysics" element={<GeophysicsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/import" element={<ImportPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/data-backup" element={<DataBackupPage />} />
            <Route path="/vulnerability" element={<VulnerabilityPage />} />
            <Route path="/god" element={<GodPage />} />
            <Route path="/wqi" element={<WQIPage />} />
            <Route path="/hydrochemistry" element={<HydrochemistryPage />} />
            <Route path="/idw" element={<IDWPage />} />
            <Route path="*" element={<Dashboard />} />
          </Routes>
        </Suspense>
      </main>
      <footer>
        ND Water Quality · Offline-first field data tool
        <span>Scientific outputs require professional review and locally validated standards.</span>
      </footer>
    </div>
  );
}
