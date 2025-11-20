import HomePage from "./pages/home/page"
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from "./pages/layout";
import LoginPage from "./pages/login/page";
import SignupPage from "./pages/signup/page";
import AdminLayout from "./pages/admin/layout";
import AdminDashboard from "./pages/admin/dashboard/page";
import TenantsPage from "./pages/admin/tenants/page";
import PaymentsPage from "./pages/admin/payments/page";
import MaintenancePage from "./pages/admin/maintenance/page";
import CreateProfilePage from "./pages/create-profile/page";
import BookingPage from "./pages/booking/page";
import PrivateRoute from "./components/auth/PrivateRoute";
import AdminRoute from "./components/auth/AdminRoute";
import UserRoute from "./components/auth/UserRoute";
import ProfilePage from "./pages/user/profile/page";
import UnitPage from "./pages/admin/unit/page";
import EditUnitPage from "./pages/admin/unit/edit/page";
import UserLayout from "./pages/user/layout";
import RentalRequestsPage from "./pages/admin/rental-requests/page";
import WaitingPage from "./pages/booking/waiting/page";
import BookedPage from "./pages/booking/booked/page";
import RentalRequestDetailPage from "./pages/admin/rental-requests/[id]/page";
import SendInvoicePage from "./pages/admin/unit/send_invoice/page";
import ContactTenantPage from "./pages/admin/unit/contact_tenant/page";
import PaymentsHistoryPage from "./pages/admin/unit/payment_history/page";
import LeaseAgreementPage from "./pages/admin/unit/lease_agreement/page";
import UserNotificationsPage from "./pages/user/notifications/page";
import AdminNotificationsPage from "./pages/admin/notifications/page";
import BillingPage from "./pages/user/billing/page";
import PaymentPage from "./pages/user/billing/payment/page";
import InvoiceDetailPage from "./pages/user/billing/detail/page";
import NotificationDetail from "./pages/user/notifications/detail/page";
import UserMaintenancePage from "./pages/user/maintenance/page";
import MaintenanceRequestsPage from "./pages/admin/maintenance-requests/page";  
import MaintenanceRequestsDetailPage from "./pages/admin/maintenance-requests/[id]/page";
import PaymentsRequestsPage from "./pages/admin/payment-requests/page";
import BulkImportPage from "./pages/admin/billing/bulk_import/page";
import ReportPage from "./pages/admin/report/page";
import HelpPage from "./pages/user/help/page";
import StockManagementPage from "./pages/admin/stock/page";
import LogPage from "./pages/admin/log/page";


function App() {

  return (
    <>
      <Router>
        <Routes>
          
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
          </Route>

          <Route path="/admin/" element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="tenants" element={<TenantsPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="payment-requests" element={<PaymentsRequestsPage />} />
            <Route path="maintenance" element={<MaintenancePage />} />
            <Route path="maintenance-requests" element={<MaintenanceRequestsPage />} />
            <Route path="maintenance-requests/:id" element={<MaintenanceRequestsDetailPage />} />
            <Route path="rental-requests" element={<RentalRequestsPage />} />
            <Route path="rental-requests/:id" element={<RentalRequestDetailPage />} />
            <Route path="unit/:id" element={<UnitPage />} />
            <Route path="unit/:id/edit" element={<EditUnitPage />} />
            <Route path="unit/:id/send-invoice" element={<SendInvoicePage />} />
            <Route path="unit/:id/contact-tenant" element={<ContactTenantPage />} />
            <Route path="unit/:id/lease-agreement" element={<LeaseAgreementPage />} />
            <Route path="unit/:id/payment-history" element={<PaymentsHistoryPage />} />
            <Route path="billing/bulk-import" element={<BulkImportPage />} />
            <Route path="notifications" element={<AdminNotificationsPage />} />
            <Route path="notifications/:id" element={<NotificationDetail />} />
            <Route path="report" element={<ReportPage />} />
            <Route path="stock" element={<StockManagementPage />} />
            <Route path="log" element={<LogPage />} />
          </Route>

          {/* Protected Routes - Require Authentication */}
          <Route path="/booking" element={
            <PrivateRoute>
              <BookingPage />
            </PrivateRoute>
          } />
          
          <Route path="/booking/waiting" element={
            <PrivateRoute>
              <WaitingPage />
            </PrivateRoute>
          } />

          <Route path="/booking/booked" element={
            <PrivateRoute>
              <BookedPage />
            </PrivateRoute>
          } />

          <Route path="/create-profile" element={
            <PrivateRoute>
              <CreateProfilePage />
            </PrivateRoute>
          } />

          <Route path="/user/:id" element={
            <UserRoute>
              <UserLayout />
            </UserRoute>
          }>
            <Route index element={<ProfilePage />} />
            <Route path="notifications" element={<UserNotificationsPage />} />
            <Route path="notifications/:id" element={<NotificationDetail />} />
            <Route path="billing" element={<BillingPage />} />
            <Route path="billing/payment/:invoiceId" element={<PaymentPage />} />
            <Route path="billing/detail/:invoiceId" element={<InvoiceDetailPage />} />
            <Route path="maintenance" element={<UserMaintenancePage />} />
            <Route path="help" element={<HelpPage />} />
          </Route>

          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
        </Routes>
      </Router>
    </>
  )
}

export default App
