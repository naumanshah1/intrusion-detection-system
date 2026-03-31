import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Alerts from './pages/Alerts';
import Investigation from './pages/Investigation';
import Analytics from './pages/Analytics';
import Intelligence from './pages/Intelligence';
import Rules from './pages/Rules';
import Models from './pages/Models';
import Explorer from './pages/Explorer';
import Console from './pages/Console';
import Index from './pages/Index';
import NotFound from './pages/NotFound';
import Incidents from './pages/Incidents';
import Pipeline from './pages/Pipeline';
import Config from './pages/Config';
import Reports from './pages/Reports';
import APIHub from './pages/APIHub';
import AuditLogs from './pages/AuditLogs';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing & Auth */}
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />

        {/* App routes inside persistent layout */}
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/investigation" element={<Investigation />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/intelligence" element={<Intelligence />} />
          <Route path="/rules" element={<Rules />} />
          <Route path="/models" element={<Models />} />
          <Route path="/explorer" element={<Explorer />} />
          <Route path="/console" element={<Console />} />
          <Route path="/incidents" element={<Incidents />} />
          <Route path="/pipeline" element={<Pipeline />} />
          <Route path="/config" element={<Config />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/apihub" element={<APIHub />} />
          <Route path="/audit" element={<AuditLogs />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}