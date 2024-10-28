'use client'
interface DialogProps {
  message: string | null;
}

export default function AlertDialog({ message }: DialogProps) {
  const handleCloseDialog = () => {
    window.history.back();
  };

  return (
    <dialog id="my_modal_1" className="modal" open>
      <div className="modal-box">
        <h3 className="font-bold text-lg">Hello!</h3>
        <p className="py-4">{message}</p>
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
