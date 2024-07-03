import Home from "./Home";
import AddGames from "./pages/AddGames";
import { BrowserRouter, Route, Routes } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/add-games" element={<AddGames />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
