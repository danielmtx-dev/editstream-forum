import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import ProductPage from "./pages/ProductPage";
import AdminPage from "./pages/AdminPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import UserDashboard from "./pages/UserDashboard";
import MembrosPage from "./pages/MembrosPage";
import CategoriasPage from "./pages/CategoriasPage";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/produto/:id"} component={ProductPage} />
      <Route path={"/admin"} component={AdminPage} />
      <Route path={"/login"} component={LoginPage} />
      <Route path={"/registro"} component={RegisterPage} />
      <Route path={"/minha-conta"} component={UserDashboard} />
      <Route path={"/membros"} component={MembrosPage} />
      <Route path={"/categorias"} component={CategoriasPage} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
