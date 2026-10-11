import Modal from "./Modal.jsx";
import Button from "./Button.jsx";

export default function ConfirmDialog({ open, title, message, confirmLabel = "אישור", loading, onConfirm, onCancel }) {
  return (
    <Modal open={open} title={title} onClose={onCancel}>
      <p>{message}</p>
      <div className="row">
        <Button variant="danger" loading={loading} onClick={onConfirm}>{confirmLabel}</Button>
        <Button variant="secondary" onClick={onCancel}>ביטול</Button>
      </div>
    </Modal>
  );
}
