import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./lib/auth.jsx";
import Layout from "./components/Layout.jsx";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Onboarding from "./pages/Onboarding.jsx";
import Home from "./pages/Home.jsx";
import Market from "./pages/Market.jsx";
import ProductDetail from "./pages/ProductDetail.jsx";
import Listings from "./pages/Listings.jsx";
import ListingForm from "./pages/ListingForm.jsx";
import Kyc from "./pages/Kyc.jsx";
import Deals from "./pages/Deals.jsx";
import DealRoom from "./pages/DealRoom.jsx";
import Profile from "./pages/Profile.jsx";
import Verify from "./pages/Verify.jsx";
import AdminKyc from "./pages/AdminKyc.jsx";
import NotFound from "./pages/NotFound.jsx";

function Only({ role, children }) {
  const { user } = useAuth();
  return user?.role === role ? children : <Navigate to="/app" replace />;
}

export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={user ? <Navigate to="/app" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/app" replace /> : <Register />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/verify" element={<Verify />} />

      <Route path="/app" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="market" element={<Market />} />
        <Route path="market/:productId" element={<ProductDetail />} />
        <Route path="listings" element={<Only role="FARMER"><Listings /></Only>} />
        <Route path="listings/new" element={<Only role="FARMER"><ListingForm /></Only>} />
        <Route path="listings/:productId/edit" element={<Only role="FARMER"><ListingForm /></Only>} />
        <Route path="kyc" element={<Kyc />} />
        <Route path="deals" element={<Deals />} />
        <Route path="deals/:dealId" element={<DealRoom />} />
        <Route path="profile" element={<Profile />} />
        <Route path="admin/kyc" element={<Only role="ADMIN"><AdminKyc /></Only>} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
