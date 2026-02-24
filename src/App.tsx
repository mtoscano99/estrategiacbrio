import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import KPIs from "./pages/KPIs";
import KPIDetalhe from "./pages/KPIDetalhe";
import Projetos from "./pages/Projetos";
import ProjetoDetalhe from "./pages/ProjetoDetalhe";
import NovoProjeto from "./pages/NovoProjeto";
import Aprovacoes from "./pages/Aprovacoes";
import PlanejamentoEstrategico from "./pages/PlanejamentoEstrategico";
import Relatorios from "./pages/Relatorios";
import RelatorioFinanceiro from "./pages/RelatorioFinanceiro";
import MeuPerfil from "./pages/MeuPerfil";
import SelecionarPerfil from "./pages/SelecionarPerfil";
import Calendario from "./pages/Calendario";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading, needsRole } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen text-muted-foreground">Carregando...</div>;
  if (!session) return <Navigate to="/login" replace />;
  if (needsRole) return <Navigate to="/selecionar-perfil" replace />;
  return <>{children}</>;
}

function RoleRoute({ children }: { children: React.ReactNode }) {
  const { session, loading, needsRole } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen text-muted-foreground">Carregando...</div>;
  if (!session) return <Navigate to="/login" replace />;
  if (!needsRole) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { session, loading, needsRole } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen text-muted-foreground">Carregando...</div>;
  if (session && needsRole) return <Navigate to="/selecionar-perfil" replace />;
  if (session) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/selecionar-perfil" element={<RoleRoute><SelecionarPerfil /></RoleRoute>} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/kpis" element={<KPIs />} />
              <Route path="/kpis/:id" element={<KPIDetalhe />} />
              <Route path="/projetos" element={<Projetos />} />
              <Route path="/projetos/:id" element={<ProjetoDetalhe />} />
              <Route path="/novo-projeto" element={<NovoProjeto />} />
              <Route path="/calendario" element={<Calendario />} />
              <Route path="/aprovacoes" element={<Aprovacoes />} />
              <Route path="/planejamento" element={<PlanejamentoEstrategico />} />
              <Route path="/relatorios" element={<Relatorios />} />
              <Route path="/relatorios/financeiro" element={<RelatorioFinanceiro />} />
              <Route path="/perfil" element={<MeuPerfil />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
