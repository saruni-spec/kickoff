import About from "./pages/About";
import Games from "./pages/Games";
import Challenges from "./pages/Challenges";
import ChooseChallenge from "./pages/ChooseChallenge";
import CreateChallenge from "./pages/CreateChallenge";
import Login from "./pages/Login";
import "./styles/nav.css";

import { db } from "./pages/firebase";
import { getDocs, collection, query } from "firebase/firestore";
import { useEffect, useState } from "react";

interface GameDetails {
  gameId: string;
  homeTeam: string;
  homeTeamScore: string;
  awayTeam: string;
  awayTeamScore: string;
  date: string;
  time: string;
  level: string;
}

function Home() {
  const [currentPage, setCurrentPage] = useState("home");

  const [games, setGames] = useState<GameDetails[]>();
  const [gamesToday, setGamesToday] = useState<GameDetails[]>();
  const [gamesYesterday, setGamesYesterday] = useState<GameDetails[]>();
  const [gamesUpcoming, setGamesUpcoming] = useState<GameDetails[]>();

  const checkGameDates = (games: GameDetails[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const todayGames: GameDetails[] = [];
    const yesterdayGames: GameDetails[] = [];
    const upcomingGames: GameDetails[] = [];

    games.forEach((game) => {
      const gameDate = new Date(game.date);
      gameDate.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison

      if (gameDate.getTime() === today.getTime()) {
        todayGames.push(game);
      } else if (gameDate.getTime() === yesterday.getTime()) {
        yesterdayGames.push(game);
      } else if (gameDate > today) {
        upcomingGames.push(game);
      }
    });

    setGamesToday(todayGames);
    setGamesYesterday(yesterdayGames);
    setGamesUpcoming(upcomingGames);
  };

  const loadGames = async () => {
    try {
      const gamesQuery = query(collection(db, "games"));
      const gamesSnapshot = await getDocs(gamesQuery);

      console.log(gamesSnapshot);

      const allGames: GameDetails[] = [];
      gamesSnapshot.forEach((doc) => {
        console.log(doc.data(), "doc.data()");
        console.log(doc.data().homeTeam, "doc.data().homeTeam");
        const entry = {
          gameId: doc.data().gameId,
          homeTeam: doc.data().homeTeam,
          homeTeamScore: doc.data().homeTeamScore,
          awayTeam: doc.data().awayTeam,
          awayTeamScore: doc.data().awayTeamScore,
          date: doc.data().date,
          time: doc.data().time,
          level: doc.data().level,
        };
        allGames.push(entry);
      });

      console.log(allGames);
      setGames(allGames);
      checkGameDates(allGames);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    loadGames();
  }, []);

  return (
    <>
      <ul>
        <li onClick={() => setCurrentPage("home")}>Home</li>
        <li onClick={() => setCurrentPage("choose")}>Create Challenge</li>
        <li onClick={() => setCurrentPage("view")}>View Challenges</li>
        <li onClick={() => setCurrentPage("about")}>About</li>
        <li onClick={() => setCurrentPage("login")}>Log In</li>
      </ul>
      <div>
        {currentPage === "home" && (
          <Games
            gamesToday={gamesToday}
            gamesUpcoming={gamesUpcoming}
            games={games}
            gamesYesterday={gamesYesterday}
          />
        )}
        {currentPage === "choose" && (
          <ChooseChallenge setCurrentPage={setCurrentPage} />
        )}
        {currentPage === "view" && <Challenges />}
        {currentPage === "about" && <About />}
        {currentPage === "login" && <Login />}
        {currentPage === "create" && (
          <CreateChallenge
            gamesToday={gamesToday}
            gamesUpcoming={gamesUpcoming}
          />
        )}
      </div>
    </>
  );
}

export default Home;
