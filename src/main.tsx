import React from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, MemoryRouter, Navigate, Route, Routes } from 'react-router-dom'
import { StoreProvider } from './data/store'
import Manage from './pages/manage'
import { Announcements, DisciplinePage, Disciplines, Home, Layout, Schedule, Welcome } from './pages/public'
import './styles.css'

// En la vista previa publicada como Artifact el hash de la URL no se puede usar: se navega en memoria.
const Router = import.meta.env.VITE_ROUTER === 'memory' ? MemoryRouter : HashRouter

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <StoreProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/delegados" element={<Manage />} />
          <Route element={<Layout />}>
            <Route path="/inicio" element={<Home />} />
            <Route path="/cronograma" element={<Schedule />} />
            <Route path="/competencias" element={<Disciplines />} />
            <Route path="/competencias/:id" element={<DisciplinePage />} />
            <Route path="/anuncios" element={<Announcements />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </StoreProvider>
  </React.StrictMode>,
)
