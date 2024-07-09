import Home from "./Home";
import AddGames from "./pages/AddGames";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import JoinChallenge from "./pages/JoinChallenge";
import Login from "./pages/Login";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />}>
          <Route path="*" element={<Home />} />
        </Route>
        <Route path="/add-games" element={<AddGames />} />
        <Route path="/join" element={<JoinChallenge />}>
          <Route path="*" element={<JoinChallenge />} />
        </Route>
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
