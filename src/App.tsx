import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoadingSpinner from './components/ui/LoadingSpinner';

// Route-level code splitting keeps the public landing bundle small.
const HomePage = lazy(() => import('./pages/HomePage'));
const ExplorePage = lazy(() => import('./pages/ExplorePage'));
const BusinessDetailPage = lazy(() => import('./pages/BusinessDetailPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const PricingPage = lazy(() => import('./pages/PricingPage'));
const MyAppointmentsPage = lazy(() => import('./pages/MyAppointmentsPage'));
const SupportPage = lazy(() => import('./pages/SupportPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const MyBusinessPage = lazy(() => import('./pages/MyBusinessPage'));
const ServicesPage = lazy(() => import('./pages/ServicesPage'));
const StaffPage = lazy(() => import('./pages/StaffPage'));
const BusinessAppointmentsPage = lazy(
  () => import('./pages/BusinessAppointmentsPage'),
);
const SchedulesPage = lazy(() => import('./pages/SchedulesPage'));
const CrmPage = lazy(() => import('./pages/CrmPage'));
const RemindersPage = lazy(() => import('./pages/RemindersPage'));
const PoliciesPage = lazy(() => import('./pages/PoliciesPage'));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'));
const AdminDashboardPage = lazy(
  () => import('./pages/admin/AdminDashboardPage'),
);
const AdminBusinessesPage = lazy(
  () => import('./pages/admin/AdminBusinessesPage'),
);
const AdminPlansPage = lazy(() => import('./pages/admin/AdminPlansPage'));
const AdminSubscriptionsPage = lazy(
  () => import('./pages/admin/AdminSubscriptionsPage'),
);
const AdminOperationsPage = lazy(
  () => import('./pages/admin/AdminOperationsPage'),
);

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
      <Route element={<MainLayout />}>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/explorar" element={<ExplorePage />} />
        <Route path="/negocio/:id" element={<BusinessDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/planes" element={<PricingPage />} />

        {/* Client routes */}
        <Route
          path="/mis-citas"
          element={
            <ProtectedRoute roles={['CLIENT']}>
              <MyAppointmentsPage />
            </ProtectedRoute>
          }
        />

        {/* Support routes */}
        <Route
          path="/soporte"
          element={
            <ProtectedRoute roles={['CLIENT', 'BUSINESS']}>
              <SupportPage />
            </ProtectedRoute>
          }
        />

        {/* Business routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute roles={['BUSINESS']}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mi-negocio"
          element={
            <ProtectedRoute roles={['BUSINESS']}>
              <MyBusinessPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/servicios"
          element={
            <ProtectedRoute roles={['BUSINESS']}>
              <ServicesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff"
          element={
            <ProtectedRoute roles={['BUSINESS']}>
              <StaffPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/citas"
          element={
            <ProtectedRoute roles={['BUSINESS']}>
              <BusinessAppointmentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/horarios"
          element={
            <ProtectedRoute roles={['BUSINESS']}>
              <SchedulesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/clientes"
          element={
            <ProtectedRoute roles={['BUSINESS']}>
              <CrmPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/politicas"
          element={
            <ProtectedRoute roles={['BUSINESS']}>
              <PoliciesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recordatorios"
          element={
            <ProtectedRoute roles={['BUSINESS']}>
              <RemindersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute roles={['BUSINESS']}>
              <OnboardingPage />
            </ProtectedRoute>
          }
        />

        {/* Admin routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/negocios"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <AdminBusinessesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/planes"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <AdminPlansPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/suscripciones"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <AdminSubscriptionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/operaciones"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <AdminOperationsPage />
            </ProtectedRoute>
          }
        />
      </Route>
      </Routes>
    </Suspense>
  );
}

export default App;
