'use client'
interface DialogProps {
  title?: string;
  description?: string;
  variant?: string;
  message?: string | null;
}

export default function AlertDialog({ title, description, message }: DialogProps) {
  const handleCloseDialog = () => {
    window.history.back();
  };

  return (
    <dialog id="my_modal_1" className="modal" open>
      <div className="modal-box">
        {title && <h3 className="font-bold text-lg">{title}</h3>}
        <p className="py-4">{description ?? message}</p>
        <div className="modal-action">
          <form method="dialog">
            {/* if there is a button in form, it will close the modal */}
            <button className="btn" onClick={handleCloseDialog}>Close</button>
          </form>
        </div>
      </div>
    </dialog>
  );
}
