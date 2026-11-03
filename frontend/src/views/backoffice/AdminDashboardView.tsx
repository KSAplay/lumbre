import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { LogOut, Monitor } from "lucide-react";
import { AdminDashboardPanel } from "../../components/backoffice/AdminDashboardPanel";
import { AdminHistoryPanel } from "../../components/backoffice/AdminHistoryPanel";
import { AdminMenuPanel } from "../../components/backoffice/AdminMenuPanel";
import { AdminSettingsPanel } from "../../components/backoffice/AdminSettingsPanel";
import {
  AdminSidebar,
  type AdminSection,
} from "../../components/backoffice/AdminSidebar";
import { AdminStaffPanel } from "../../components/backoffice/AdminStaffPanel";
import { LiveDateTime } from "../../components/ui/LiveDateTime";
import { StaffShell } from "../../components/ui/StaffShell";
import { UserMenu, type UserMenuItem } from "../../components/ui/UserMenu";
import { useToast } from "../../components/ui/useToast";
import { clearStaffToken } from "../../config/api";
import { connectStaff, disconnectSocket } from "../../services/socketClient";

export const AdminDashboardView = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [section, setSection] = useState<AdminSection>("dashboard");

  useEffect(() => {
    connectStaff();
    return () => disconnectSocket();
  }, []);

  const logoutItem: UserMenuItem = {
    id: "logout",
    label: "Cerrar sesión",
    icon: LogOut,
    onSelect: () => {
      clearStaffToken();
      navigate("/login");
    },
  };

  const onFeedback = (message: string, tone: "green" | "red") => {
    showToast({ message, tone });
  };

  return (
    <StaffShell
      headerCenter={
        <>
          <LiveDateTime
            layout="time"
            showSeconds={false}
            className="text-base font-bold tracking-wide text-white tabular-nums md:hidden"
          />
          <LiveDateTime
            layout="stacked"
            showSeconds={false}
            className="hidden items-center gap-0.5 text-center text-[11px] font-medium text-white/85 md:flex md:text-sm [&>span:last-child]:text-2xl [&>span:last-child]:font-bold [&>span:last-child]:tracking-wide [&>span:last-child]:text-white md:[&>span:last-child]:text-3xl"
          />
        </>
      }
      headerRight={<UserMenu items={[logoutItem]} />}
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 py-12 text-center md:hidden">
        <div className="flex size-16 items-center justify-center rounded-full bg-canvas-muted text-text-muted">
          <Monitor className="size-8" strokeWidth={1.75} />
        </div>
        <div className="max-w-xs">
          <h2 className="text-lg font-bold text-text-main">
            Pantalla demasiado pequeña
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-text-muted">
            El backoffice de Lumbre está pensado para tablet u ordenador. Abre
            esta vista en un dispositivo más grande.
          </p>
        </div>
      </div>

      <div className="hidden min-h-0 flex-1 md:flex">
        <AdminSidebar active={section} onChange={setSection} />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
          <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col p-5 lg:p-6">
            {section === "dashboard" && <AdminDashboardPanel />}
            {section === "menu" && <AdminMenuPanel onFeedback={onFeedback} />}
            {section === "staff" && <AdminStaffPanel onFeedback={onFeedback} />}
            {section === "history" && (
              <AdminHistoryPanel onFeedback={onFeedback} />
            )}
            {section === "settings" && (
              <AdminSettingsPanel onFeedback={onFeedback} />
            )}
          </div>
        </div>
      </div>
    </StaffShell>
  );
};
