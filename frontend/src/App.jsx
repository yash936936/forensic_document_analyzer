
import DocumentScanner from "./DocumentScanner";
import { ToastProvider } from "./context/ToastContext";
import "./index.css";

export default function App() {
  return (
    <ToastProvider>
      <DocumentScanner />
    </ToastProvider>
  );
}