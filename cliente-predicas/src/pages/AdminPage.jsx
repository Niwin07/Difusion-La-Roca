import { useState } from "react";
import { useAdminAuth } from "../hooks/useAdminAuth";
import { useAdminPredicas } from "../hooks/useAdminPredicas";
import { useSync } from "../hooks/useSync";
import { AdminLogin } from "../components/admin/AdminLogin";
import { AdminTopbar } from "../components/admin/AdminTopbar";
import { SyncProgressBar, SyncLog } from "../components/admin/SyncLog";
import { PredicasTable } from "../components/admin/PredicasTable";
import { NotifyModal } from "../components/admin/NotifyModal";
import { ToastViewport } from "../components/ui/ToastViewport";
import { LoadingState } from "../components/ui/LoadingState";
import styles from "../components/admin/AdminDashboard.module.css";

function AdminDashboard({ password, onLogout }) {
  const admin = useAdminPredicas(password);
  const sync = useSync(password, admin.recargar);
  const [showNotify, setShowNotify] = useState(false);

  if (admin.cargando && admin.predicas.length === 0) {
    return (
      <div className={styles.page}>
        <LoadingState label="Cargando base de datos..." />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <AdminTopbar
        totalMensajes={admin.predicas.length}
        totalPredicadores={admin.predicadoresUnicos}
        syncState={sync.syncState}
        onSync={sync.sincronizar}
        repairState={sync.repairState}
        repairResult={sync.repairResult}
        onRepair={sync.reparar}
        onOpenNotify={() => setShowNotify(true)}
        onLogout={onLogout}
      />

      <SyncProgressBar syncState={sync.syncState} progress={sync.progress} />
      <SyncLog log={sync.log} visible={sync.showLog} />

      <div className={styles.content}>
        <PredicasTable
          predicas={admin.predicasFiltradas}
          busqueda={admin.busqueda}
          onBuscar={admin.setBusqueda}
          sortConfig={admin.sortConfig}
          toggleSort={admin.toggleSort}
          editandoId={admin.editandoId}
          form={admin.form}
          setForm={admin.setForm}
          onEditar={admin.empezarEdicion}
          onGuardar={admin.guardarCambios}
          onCancelar={admin.cancelarEdicion}
          guardando={admin.guardando}
        />

        <div className={styles.footer}>
          <span>
            {admin.predicasFiltradas.length} / {admin.predicas.length} registros
            {admin.busqueda && ` — filtrando por "${admin.busqueda}"`}
          </span>
          <div className={styles.pulse} title="Conectado" />
        </div>
      </div>

      {showNotify && <NotifyModal password={password} onClose={() => setShowNotify(false)} />}
      <ToastViewport />
    </div>
  );
}

export default function AdminPage() {
  const { autenticado, password, error, verificando, intentarEntrar, salir, clearError } = useAdminAuth();

  return autenticado ? (
    <AdminDashboard password={password} onLogout={salir} />
  ) : (
    <AdminLogin error={error} verificando={verificando} onSubmit={intentarEntrar} clearError={clearError} />
  );
}
