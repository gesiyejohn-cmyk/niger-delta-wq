import { lazy, Suspense } from 'react';
import { NavLink, Routes, Route } from 'react-router-dom';

const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const SampleEditor = lazy(() => import('./pages/SampleEditor.jsx'));
const SampleDetail = lazy(() => import('./pages/SampleDetail.jsx'));
const MapPage = lazy(() => import('./pages/MapPage.jsx'));
const ImportPage = lazy(() => import('./pages/ImportPage.jsx'));
const SettingsPage = lazy(() => import('./pages/SettingsPage.jsx'));
const ReportsPage = lazy(() => import('./pages/ReportsPage.jsx'));
const GeophysicsPage = lazy(() => import('./pages/GeophysicsPage.jsx'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage.jsx'));
const DataBackupPage = lazy(() => import('./pages/DataBackupPage.jsx'));
const VulnerabilityPage = lazy(() => import('./pages/VulnerabilityPage.jsx'));
const WQIPage = lazy(() => import('./pages/WQIPage.jsx'));
const ExternalValidationPage = lazy(() => import('./pages/ExternalValidationPage.jsx'));
const HydrochemistryPage = lazy(() => import('./pages/HydrochemistryPage.jsx'));
const SpatialAnalysisPage = lazy(() => import('./pages/SpatialAnalysisPage.jsx'));

function RouteLoadingFallback() {
  return (
    <div className="route-loading" role="status" aria-live="polite">
      Loading page…
    </div>
  );
}

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
        <nav aria-label="Primary navigation">
          <div tabIndex={0} aria-label="Scroll primary navigation links" style={{ display: 'flex', flexWrap: 'nowrap', overflowX: 'auto', overflowY: 'hidden', maxWidth: '100%', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'thin' }}>
          <NavLink to="/" end style={{ flex: '0 0 auto' }}>Dashboard</NavLink>
          <NavLink to="/new" style={{ flex: '0 0 auto' }}>New sample</NavLink>
          <NavLink to="/map" style={{ flex: '0 0 auto' }}>GIS map</NavLink>
          <NavLink to="/geophysics" style={{ flex: '0 0 auto' }}>VES / ERT</NavLink>
          <NavLink to="/analytics" style={{ flex: '0 0 auto' }}>Analytics</NavLink>
          <NavLink to="/import" style={{ flex: '0 0 auto' }}>Import</NavLink>
          <NavLink to="/reports" style={{ flex: '0 0 auto' }}>Reports</NavLink>
          <NavLink to="/settings" style={{ flex: '0 0 auto' }}>Settings</NavLink>
          <NavLink to="/data-backup" style={{ flex: '0 0 auto' }}>Backup &amp; restore</NavLink>
          <NavLink to="/vulnerability" style={{ flex: '0 0 auto' }}>Vulnerability</NavLink>
          <NavLink to="/wqi" style={{ flex: '0 0 auto' }}>WQI</NavLink>
          <NavLink to="/external-validation" style={{ flex: '0 0 auto' }}>External validation</NavLink>
          <NavLink to="/hydrochemistry" style={{ flex: '0 0 auto' }}>Hydrochemistry diagrams</NavLink>
          <NavLink to="/spatial-analysis" style={{ flex: '0 0 auto' }}>IDW spatial analysis</NavLink>
          </div>
        </nav>
      </header>
      <main>
        <Suspense fallback={<RouteLoadingFallback />}>
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
            <Route path="/wqi" element={<WQIPage />} />
            <Route path="/external-validation" element={<ExternalValidationPage />} />
            <Route path="/hydrochemistry" element={<HydrochemistryPage />} />
            <Route path="/spatial-analysis" element={<SpatialAnalysisPage />} />
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
