/** @jsxImportSource react */
import { createRoot } from "react-dom/client"
import { Toaster, toast } from "./toast"

function App() {
  return (
    <main className="p-8">
      <button
        type="button"
        id="plain"
        onClick={() =>
          toast.add({ title: "Saved", description: "Your changes were saved." })
        }
      >
        Plain
      </button>
      <button
        type="button"
        id="success"
        onClick={() =>
          toast.add({
            title: "Done",
            type: "success",
            actionProps: { children: "Undo" },
          })
        }
      >
        Success
      </button>
      <Toaster />
    </main>
  )
}
createRoot(document.getElementById("root") as HTMLElement).render(<App />)
