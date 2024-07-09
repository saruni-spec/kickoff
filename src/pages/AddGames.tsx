import { db } from "./firebase";
import { addDoc, collection, getDocs, query } from "firebase/firestore";

import { useEffect, useState } from "react";

import AddScores from "./AddScores";
import AddTeams from "./AddTeams";

import "../styles/addGames.css";

interface TeamDetails {
  teamName: string;
  players: string[];
}

interface GameDetails {
  gameId: string;
  homeTeam: TeamDetails;
  homeTeamScore: string;
  awayTeam: TeamDetails;
  awayTeamScore: string;
  date: string;
  time: string;
  level: string;
  played: boolean;
}
interface Team {
  team: string;
  players: string[];
}

const AddGames = () => {
  const [currentPage, setCurrentPage] = useState("games");

  const [teams, setTeams] = useState<Team[]>();

  const getTeams = async () => {
    try {
      const teamsQuery = query(collection(db, "teams"));
      const teamsSnapshot = await getDocs(teamsQuery);

      const allTeams: Team[] = [];
      teamsSnapshot.forEach((doc) => {
        const entry = {
          team: doc.data().team,
          players: doc.data().players,
        };
        allTeams.push(entry);
      });

      setTeams(allTeams);
    } catch (error) {
      console.log(error);
    }
  };

  const addGame = async (gameDetails: GameDetails | null) => {
    if (!gameDetails) return;
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

      alert("Game added");
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

    const newGameDetails: GameDetails = {
      gameId: GameId(),
      homeTeam: JSON.parse(formData.get("homeTeam") as string),
      homeTeamScore: "",
      awayTeam: JSON.parse(formData.get("awayTeam") as string),
      awayTeamScore: "",
      date: formData.get("date") as string,
      time: formData.get("time") as string,
      level: formData.get("level") as string,
      played: false,
    };

    addGame(newGameDetails);
  };

  useEffect(() => {
    getTeams();
  }, []);

  return (
    <>
      <ul className="add-gamesNav">
        <li onClick={() => setCurrentPage("games")}>Add Games</li>
        <li onClick={() => setCurrentPage("scores")}>Update Scores</li>
        <li onClick={() => setCurrentPage("teams")}>Add Teams</li>
      </ul>

      {currentPage === "games" && (
        <form onSubmit={handleSubmit} className="addGamesForm">
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
            <select title="homeTeam" name="homeTeam" onChange={() => {}}>
              <option value="">Select Team</option>
              {teams?.map((team, index) => (
                <option key={index} value={JSON.stringify(team)}>
                  {team.team}
                </option>
              ))}
            </select>
          </label>
          <p>Vs</p>
          <label>
            <select title="awayTeam" name="awayTeam" onChange={() => {}}>
              <option value="">Select Team</option>
              {teams?.map((team, index) => (
                <option key={index} value={JSON.stringify(team)}>
                  {team.team}
                </option>
              ))}
            </select>
          </label>
          <button type="submit">Add</button>
        </form>
      )}
      {currentPage === "scores" && <AddScores />}
      {currentPage === "teams" && <AddTeams />}
    </>
  );
};

export default AddGames;
