import { auth, db } from "./firebase";
import { addDoc, collection } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import Login from "./Login";
import AddScores from "./AddScores";

interface GameDetails {
  gameId: string;
  homeTeam: string;
  homeTeamScore: string;
  awayTeam: string;
  awayTeamScore: string;
  date: string;
  time: string;
  level: string;
  played: boolean;
}

const AddGames = () => {
  const [currentPage, setCurrentPage] = useState("games");
  const [gameDetails, setGameDetails] = useState<GameDetails>({
    gameId: "",
    homeTeam: "",
    homeTeamScore: "",
    awayTeam: "",
    awayTeamScore: "",
    date: "",
    time: "",
    level: "",
    played: false,
  });
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(true);

  const addGame = async (gameDetails: GameDetails) => {
    try {
      await addDoc(collection(db, "games"), {
        gameId: gameDetails.gameId,
        homeTeam: gameDetails.homeTeam,
        homeTeamScore: gameDetails.homeTeamScore,
        awayTeam: gameDetails.awayTeam,
        awayTeamScore: gameDetails.awayTeamScore,
        date: gameDetails.date,
        time: gameDetails.time,
        level: gameDetails.level,
        played: gameDetails.played,
      });
    } catch (error) {
      console.log(error);
    }
  };

  const GameId = () => {
    return Math.random().toString(36).substr(2, 9);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    console.log(formData);

    const newGameDetails: GameDetails = {
      gameId: GameId(),
      homeTeam: formData.get("homeTeam") as string,
      homeTeamScore: "",
      awayTeam: formData.get("awayTeam") as string,
      awayTeamScore: "",
      date: formData.get("date") as string,
      time: formData.get("time") as string,
      level: formData.get("level") as string,
      played: false,
    };

    setGameDetails(newGameDetails);

    addGame(gameDetails);
  };

  return (
    <>
      <ul>
        <li onClick={() => setCurrentPage("games")}>Add Games</li>
        <li onClick={() => setCurrentPage("scores")}>Update Scores</li>
      </ul>
      {isUserAuthenticated ? (
        <>
          {currentPage === "games" && (
            <form onSubmit={handleSubmit}>
              <label>
                <input type="string" placeholder="level" name="level" />
              </label>
              <label>
                <input type="date" placeholder="date" name="date" />
              </label>
              <label>
                <input type="time" title="HH:MM" name="time" />
              </label>
              <label>
                <input type="text" placeholder="Team" name="homeTeam" />
              </label>
              <p>Vs</p>
              <label>
                <input type="text" placeholder="Team" name="awayTeam" />
              </label>
              <button type="submit">Add</button>
            </form>
          )}
          {currentPage === "scores" && <AddScores />}
        </>
      ) : (
        <Login />
      )}
    </>
  );
};

export default AddGames;
