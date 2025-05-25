import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import DashboardLayout from "./DashboardLayout";
import AdminDashboardLayout from "./AdminDashboardLayout";
import Overview from "./userPages/Overview";
import Purchase from "./userPages/Purchase";
import ClaimToken from "./userPages/ClaimToken";
import ClaimRewards from "./userPages/ClaimRewards";
import Transactions from "./userPages/Transactions";
import Settings from "./userPages/Settings";
import AdminOverview from "./adminPages/Overview";
import ControlsPage from "./adminPages/Controls";
import ParticipantsPage from "./adminPages/Particiants";
import FundManagementPage from "./adminPages/Funds";
import SettingsPage from "./adminPages/Settings";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<Overview />} />
        <Route path="purchase" element={<Purchase />} />
        <Route path="claim" element={<ClaimToken />} />
        <Route path="rewards" element={<ClaimRewards />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="/admin" element={<AdminDashboardLayout />}>
        <Route index element={<AdminOverview />} />
        <Route path="controls" element={<ControlsPage />} />
        <Route path="participants" element={<ParticipantsPage />} />
        <Route path="funds" element={<FundManagementPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
