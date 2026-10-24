export default function Page2(){
        return (
            <>
                function Modal({ onClose, children }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,.5)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "#fff", padding: 24, borderRadius: 12, minWidth: 300 }}
      >
        {children}
      </div>
    </div>
  );
}



                    export default function App() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)}>Открыть</button>
      {open && (
        <Modal onClose={() => setOpen(false)}>
          <p>Привет!</p>
          <button onClick={() => setOpen(false)}>Закрыть</button>
        </Modal>
      )}
    </>
  );
}
            </>
        )
    }
