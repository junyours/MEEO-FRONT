import React from 'react';
import { HashRouter  as Router, Routes, Route } from 'react-router-dom';

// import SectionManager from './admin/SectionManager';
import PrivateRoute from './Auth/PrivateRoute';
import Login from './Auth/Login';
import AdminDashboard from './admin/Dashboard';
import VendorDashboard from './vendor/VendorDashboard';
import InchargeDashboard from './incharge_collector/Dashboard';
import MainDashboard from './main_collector/Dashboard';
import Homepage from './Auth/Homepage';
import AutoLogoutProvider from './components/AutoLogoutProvider';

// New Market Management Components

// import Dashboard from './components/Dashboard';

function App() {
  return (
    <div className="App">
      <Router basename="/">
        <AutoLogoutProvider>
          <Routes>
      <Route path="/" element={<Homepage />} />

          <Route path="/login" element={<Login />} />

        

          <Route
            path="/admin/dashboard"
            element={
              <PrivateRoute>
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/vendor-management"
            element={
              <PrivateRoute>
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/product-management"
            element={
              <PrivateRoute>
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/cash-ticket"
            element={
              <PrivateRoute>
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/vendor-payment-calendar"
            element={
              <PrivateRoute>
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/market-section-stalls"
            element={
              <PrivateRoute>
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/stall-rate-dashboard"
            element={
              <PrivateRoute>
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/vendor-payment"
            element={
              <PrivateRoute>
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/payment-management"
            element={
              <PrivateRoute>
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/target"
            element={
              <PrivateRoute>
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/remaining-balance"
            element={
              <PrivateRoute>
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/rental-report"
            element={
              <PrivateRoute>
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/estimated_collection"
            element={
              <PrivateRoute>
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/market-open-space-collections"
            element={
              <PrivateRoute>
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/profile"
            element={
              <PrivateRoute>
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          
          {/* Event Management Routes */}
          <Route
            path="/admin/event-activities"
            element={
              <PrivateRoute>
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/event-stalls"
            element={
              <PrivateRoute>
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/event-payments"
            element={
              <PrivateRoute>
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/event-vendors"
            element={
              <PrivateRoute>
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/event-sales-reports"
            element={
              <PrivateRoute>
                <AdminDashboard />
              </PrivateRoute>
            }
          />


             <Route
            path="/vendor/dashboard"
            element={
              <PrivateRoute>
                <VendorDashboard />
              </PrivateRoute>
            }
          />

         

            <Route
            path="/incharge_collector/dashboard"
            element={
              <PrivateRoute>
                <InchargeDashboard />
              </PrivateRoute>
            }
          />

             <Route
            path="/main_collector/dashboard"
            element={
              <PrivateRoute>
                <MainDashboard />
              </PrivateRoute>
            }
          />

   
          </Routes>
        </AutoLogoutProvider>
      </Router>
    </div>
  );
}

export default App;
