import {
  BrowserRouter,
  Routes,
  Route,
  Link,
} from "react-router-dom";

import Navbar from "./components/Navbar";

import AllNotifications from "./pages/AllNotifications";

import PriorityNotifications from "./pages/PriorityNotifications";

import {
  Container,
  Button,
} from "@mui/material";

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Container sx={{ mt: 3 }}>
        <Button
          component={Link}
          to="/"
        >
          All Notifications
        </Button>

        <Button
          component={Link}
          to="/priority"
        >
          Priority Inbox
        </Button>

        <Routes>
          <Route
            path="/"
            element={<AllNotifications />}
          />

          <Route
            path="/priority"
            element={
              <PriorityNotifications />
            }
          />
        </Routes>
      </Container>
    </BrowserRouter>
  );
}

export default App;