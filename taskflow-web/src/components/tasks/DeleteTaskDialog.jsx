import Modal from '../ui/Modal';
import Button from '../ui/Button';

export default function DeleteTaskDialog({ task, onCancel, onConfirm, deleting }) {
  return (
    <Modal
      open={!!task}
      onClose={deleting ? () => {} : onCancel}
      title={task ? `Delete “${task.title}”?` : ''}
      footer={(
        <>
          <Button variant="secondary" onClick={onCancel} disabled={deleting}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm} loading={deleting} loadingText="Deleting…">Delete task</Button>
        </>
      )}
    >
      This will permanently remove the task from your list. This cannot be undone.
    </Modal>
  );
}
