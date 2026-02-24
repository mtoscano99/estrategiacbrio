import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  FilePlus,
  CalendarDays,
  CheckSquare,
  Target,
  FileBarChart,
  BarChart3,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { UserAvatar } from "@/components/UserAvatar";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/projetos", label: "Projetos", icon: FolderKanban },
  { to: "/novo-projeto", label: "Novo Projeto", icon: FilePlus },
  { to: "/calendario", label: "Calendário", icon: CalendarDays },
  { to: "/kpis", label: "KPIs", icon: BarChart3 },
  { to: "/aprovacoes", label: "Aprovações", icon: CheckSquare, coordOnly: true },
  { to: "/planejamento", label: "Planejamento Estratégico", icon: Target },
  { to: "/relatorios", label: "Relatórios", icon: FileBarChart },
];

export function AppSidebar() {
  const { profile, isCoordination, signOut } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-sidebar-border">
        {!collapsed && (
          <div>
            <h1 className="text-lg font-display font-bold text-sidebar-primary-foreground">CBRio</h1>
            <p className="text-xs text-sidebar-foreground/60">Gestão Estratégica</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md hover:bg-sidebar-accent text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto scrollbar-thin">
        {navItems
          .filter((item) => !item.coordOnly || isCoordination)
          .map((item) => {
            const isActive = location.pathname.startsWith(item.to);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
      </nav>

      {/* User info & Logout */}
      <div className="border-t border-sidebar-border p-3">
        {profile && (
          <NavLink
            to="/perfil"
            className="flex items-center gap-3 mb-2 px-2 py-1.5 rounded-lg hover:bg-sidebar-accent transition-colors cursor-pointer"
            title={collapsed ? profile.nome : undefined}
          >
            <UserAvatar avatarUrl={profile.avatar_url} nome={profile.nome} className="h-8 w-8 shrink-0" />
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">{profile.nome}</p>
                <p className="text-xs text-sidebar-foreground/50 truncate">{profile.email}</p>
              </div>
            )}
          </NavLink>
        )}
        <button
          onClick={signOut}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          title="Sair"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
}
