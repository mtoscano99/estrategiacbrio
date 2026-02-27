import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { NotificacoesDropdown } from "@/components/NotificacoesDropdown";

export function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <div className="print:hidden">
        <AppSidebar />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-end px-6 py-2 border-b bg-background shrink-0 print:hidden">
          <NotificacoesDropdown />
        </header>
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
