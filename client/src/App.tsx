import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Sidebar from "@/components/sidebar";
import MobileNav from "@/components/mobile-nav";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Partners from "@/pages/partners";
import Contracts from "@/pages/contracts";
import Customers from "@/pages/customers";
import Opportunities from "@/pages/opportunities";
import Reports from "@/pages/reports";
import Wallet from "@/pages/wallet";

import NotFound from "@/pages/not-found";
import ContractSignature from "./pages/contract-signature";
import PartnerDashboard from "@/pages/partner-dashboard";
import PartnerLogin from "@/pages/partner-login";
import PartnerRegister from "@/pages/partner-register";
import Profile from "@/pages/profile";
import ContractPayment from "./pages/contract-payment";
import RatingForm from "./pages/rating-form";

function Router() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar se o usuário está logado
    const token = localStorage.getItem("apontt_token");
    setIsAuthenticated(!!token);
    setIsLoading(false);
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    // Preservar dados do usuário antes do logout
    const userData = JSON.parse(localStorage.getItem("apontt_user") || "{}");

    localStorage.removeItem("apontt_token");
    // NÃO remover apontt_user para manter os dados do perfil

    setIsAuthenticated(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Rota pública para assinatura de contratos
  if (window.location.pathname.startsWith('/sign/')) {
    const token = window.location.pathname.replace('/sign/', '');
    return <ContractSignature />;
  }

  // Rota pública para login do parceiro
  if (window.location.pathname === '/partner-login') {
    return <PartnerLogin />;
  }

  // Rota pública para cadastro do parceiro
  if (window.location.pathname === '/partner-register') {
    return <PartnerRegister />;
  }

  // Rota pública para dashboard do parceiro
  if (window.location.pathname.startsWith('/partner/') || window.location.pathname === '/partner') {
    return <PartnerDashboard />;
  }

  // Rota pública para pagamento de contrato
  if (window.location.pathname.startsWith('/contract-payment/')) {
    return <ContractPayment />;
  }

  // Rota pública para rating-form
  if (window.location.pathname.startsWith('/rating-form')) {
    return <RatingForm />;
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-gray-50">
      <MobileNav onLogout={handleLogout} />
      <Sidebar onLogout={handleLogout} />
      <main className="flex-1 overflow-y-auto w-full">
        <div className="min-h-full responsive-container py-4 md:py-6">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/partners" component={Partners} />
            <Route path="/contracts" component={Contracts} />
            <Route path="/customers" component={Customers} />
            <Route path="/opportunities" component={Opportunities} />
            <Route path="/reports" component={Reports} />
            <Route path="/wallet" component={Wallet} />
            <Route path="/rating-form/:contractId?" component={RatingForm} />

            <Route path="/profile" component={Profile} />
            <Route path="/sign/:token" component={ContractSignature} />
            <Route component={NotFound} />
          </Switch>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;