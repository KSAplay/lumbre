import { BrowserRouter, Routes, Route } from "react-router";
import { ToastProvider } from "./components/ui/ToastProvider";
import { CustomerMenuView } from "./views/customer/CustomerMenuView";
import { AdminDashboardView } from "./views/backoffice/AdminDashboardView";
import { WaiterFloorMapView } from "./views/waiter/WaiterFloorMapView";
import { ReceptionDashboardView } from "./views/reception/ReceptionDashboardView";
import { KitchenKDSView } from "./views/kitchen/KitchenKDSView";
import { LoginView } from "./views/login/LoginView";
import { NotFoundView } from "./views/NotFoundView";

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginView />} />
          <Route path="/login" element={<LoginView />} />
          <Route path="/mesa/:tableId" element={<CustomerMenuView />} />
          <Route path="/admin" element={<AdminDashboardView />} />
          <Route path="/camarero" element={<WaiterFloorMapView />} />
          <Route path="/recepcion" element={<ReceptionDashboardView />} />
          <Route path="/cocina" element={<KitchenKDSView />} />

          <Route path="*" element={<NotFoundView />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
