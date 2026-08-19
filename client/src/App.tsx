import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AdminDashboard from "./pages/AdminDashboard";
import AdminProductDetail from "./pages/AdminProductDetail";
import AdminProducts from "./pages/AdminProducts";
import AdminRequests from "./pages/AdminRequests";
import BrokerDetail from "./pages/BrokerDetail";
import BrokerNewRequest from "./pages/BrokerNewRequest";
import BrokerPortal from "./pages/BrokerPortal";
import BrokerProducts from "./pages/BrokerProducts";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/products" component={AdminProducts} />
      <Route path="/admin/products/:id" component={AdminProductDetail} />
      <Route path="/admin/requests" component={AdminRequests} />
      <Route path="/admin/brokers/:id" component={BrokerDetail} />
      <Route path="/portal" component={BrokerPortal} />
      <Route path="/portal/products" component={BrokerProducts} />
      <Route path="/portal/new-request" component={BrokerNewRequest} />
      <Route path="/portal/requests" component={BrokerNewRequest} />
      <Route path="/products" component={BrokerProducts} />
      <Route path="/broker" component={BrokerPortal} />
      <Route path="/" component={Login} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
