import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import AllNotifications from "./pages/AllNotifications";
import PriorityNotifications from "./pages/PriorityNotifications";

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/" element={<AllNotifications />} />
        <Route
          path="/priority"
          element={<PriorityNotifications />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;