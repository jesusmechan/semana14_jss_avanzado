import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { CarritoPanel } from './components/CarritoPanel';
import { Footer } from './components/Footer';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ScrollManager } from './components/ScrollManager';
import { Toast } from './components/Toast';
import { AuthProvider } from './context/AuthContext';
import { CarritoProvider } from './context/CarritoContext';
import { MascotaProvider } from './context/MascotaContext';
import { ToastProvider } from './context/ToastContext';
import { Cuenta } from './pages/Cuenta';
import { Inicio } from './pages/Inicio';
import { Mascotas } from './pages/Mascotas';
import { NoEncontrado } from './pages/NoEncontrado';
import { Pago } from './pages/Pago';
import { ProductoDetalle } from './pages/ProductoDetalle';
import { Productos } from './pages/Productos';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <CarritoProvider>
            <MascotaProvider>
              <ScrollManager />
              <Navbar />
              <main className="app-main">
                <Routes>
                  <Route path="/" element={<Inicio />} />
                  <Route path="/productos" element={<Productos />} />
                  <Route path="/productos/:id" element={<ProductoDetalle />} />
                  <Route path="/pago" element={<Pago />} />
                  <Route path="/cuenta" element={<Cuenta />} />
                  <Route
                    path="/cuenta/mascotas"
                    element={
                      <ProtectedRoute>
                        <Mascotas />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="*" element={<NoEncontrado />} />
                </Routes>
              </main>
              <Footer />
              <CarritoPanel />
              <Toast />
            </MascotaProvider>
          </CarritoProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
