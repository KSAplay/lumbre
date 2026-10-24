import { StaffShell } from "../../components/ui/StaffShell";

export const AdminDashboardView = () => {
  return (
    <StaffShell>
      <div className="flex flex-1 flex-col p-5 md:p-6 lg:p-8">
        <p className="text-sm text-text-muted">
          Vista del dashboard de Administrador
        </p>
      </div>
    </StaffShell>
  );
};
