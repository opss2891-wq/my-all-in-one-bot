import { createRoot } from "react-dom/client";
import "./index.css";

const App = () => <div>Minimal App</div>;

createRoot(document.getElementById("root")!).render(<App />);
