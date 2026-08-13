import { useEffect } from "react";
import { BellRing, Loader2 } from "lucide-react";
import { Modal } from "../ui/Modal";
import { TextField, TextareaField } from "../ui/Field";
import { Button } from "../ui/Button";
import { useNotify, NOTIFY_TITLE_MAX, NOTIFY_BODY_MAX } from "../../hooks/useNotify";
import styles from "./NotifyModal.module.css";

export function NotifyModal({ password, onClose }) {
  const { form, setForm, enviando, enviar, historial, cargandoHistorial, cargarHistorial } = useNotify(password);

  useEffect(() => {
    cargarHistorial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Modal title="📢 Notificación personalizada" onClose={onClose} maxWidth="460px">
      <TextField
        id="notify-title"
        label="Título"
        rightSlot={
          <span className={[styles.count, form.title.length > NOTIFY_TITLE_MAX - 10 ? styles.warn : ""].join(" ")}>
            {form.title.length}/{NOTIFY_TITLE_MAX}
          </span>
        }
        placeholder="Ej: Encuentro especial esta noche"
        value={form.title}
        maxLength={NOTIFY_TITLE_MAX}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
      />

      <div style={{ height: 12 }} />

      <TextareaField
        id="notify-body"
        label="Mensaje"
        rightSlot={
          <span className={[styles.count, form.body.length > NOTIFY_BODY_MAX - 20 ? styles.warn : ""].join(" ")}>
            {form.body.length}/{NOTIFY_BODY_MAX}
          </span>
        }
        rows={3}
        placeholder="Mensaje que va a recibir la gente"
        value={form.body}
        maxLength={NOTIFY_BODY_MAX}
        onChange={(e) => setForm({ ...form, body: e.target.value })}
      />

      <div style={{ height: 12 }} />

      <TextField
        id="notify-url"
        label="URL de destino (opcional)"
        placeholder="/ (por defecto, la portada)"
        value={form.url}
        onChange={(e) => setForm({ ...form, url: e.target.value })}
      />

      <div className={styles.footer}>
        <Button variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={enviar} loading={enviando}>
          <BellRing size={15} />
          Enviar a todos
        </Button>
      </div>

      <div className={styles.history}>
        <div className={styles.historyTitle}>
          Últimas enviadas {cargandoHistorial && <Loader2 size={11} className="spinning" />}
        </div>

        {historial.length === 0 && !cargandoHistorial && (
          <p className={styles.emptyHistory}>Todavía no enviaste ninguna</p>
        )}

        {historial.map((n) => (
          <div key={n.id} className={styles.historyItem}>
            <div className={styles.historyTop}>
              <strong>{n.titulo}</strong>
              <span className={styles.historyDate}>
                {new Date(n.creado_en).toLocaleString("es-AR", {
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <p className={styles.historyBody}>{n.cuerpo}</p>
            <span className={styles.historyStat}>
              📤 {n.enviados} entregadas
              {n.eliminados > 0 ? ` · 🗑️ ${n.eliminados} bajas` : ""}
            </span>
          </div>
        ))}
      </div>
    </Modal>
  );
}
