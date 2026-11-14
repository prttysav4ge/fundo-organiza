import React from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { StoreProvider } from './data/store'
import Manage from './pages/manage'
import { Announcements, DisciplinePage, Disciplines, Home, Layout, Schedule, Welcome } from './pages/public'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <StoreProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/delegados" element={<Manage />} />
          <Route element={<Layout />}>
            <Route path="/inicio" element={<Home />} />
            <Route path="/cronograma" element={<Schedule />} />
            <Route path="/disciplinas" element={<Disciplines />} />
            <Route path="/disciplinas/:id" element={<DisciplinePage />} />
            <Route path="/anuncios" element={<Announcements />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </StoreProvider>
  </React.StrictMode>,
)
