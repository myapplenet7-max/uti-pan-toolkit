import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ToolkitPage from "@/pages/Toolkit";
import AdminPage from "@/pages/Admin";
import CouponsPage from "@/pages/Coupons";
import MyCouponsPage from "@/pages/MyCoupons";
import MobileCheckPage from "@/pages/MobileCheck";
import A4CropToolPage from "@/pages/A4CropTool";
import LoginPage from "@/pages/Login";
import AboutUs from "@/pages/legal/AboutUs";
import ContactUs from "@/pages/legal/ContactUs";
import PrivacyPolicy from "@/pages/legal/PrivacyPolicy";
import TermsConditions from "@/pages/legal/TermsConditions";
import RefundPolicy from "@/pages/legal/RefundPolicy";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={ToolkitPage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/coupons" component={CouponsPage} />
      <Route path="/my-coupons" component={MyCouponsPage} />
      <Route path="/check" component={MobileCheckPage} />
      <Route path="/a4-crop" component={A4CropToolPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/about" component={AboutUs} />
      <Route path="/contact" component={ContactUs} />
      <Route path="/privacy" component={PrivacyPolicy} />
      <Route path="/terms" component={TermsConditions} />
      <Route path="/refund" component={RefundPolicy} />
      <Route>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui" }}>
          <div style={{ textAlign: "center" }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1a3a6b" }}>404 — Not Found</h1>
            <a href="/" style={{ marginTop: 16, display: "inline-block", color: "#1a3a6b", textDecoration: "underline" }}>Go Home</a>
          </div>
        </div>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Router />
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
