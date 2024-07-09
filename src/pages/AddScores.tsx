import { db } from "./firebase";
import {
  getDocs,
  collection,
  query,
  where,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import "../styles/addScores.css";

interface Team {
  team: string;
  players: string[];
}

interface GameDetails {
  gameId: string;
  homeTeam: Team;
  homeTeamScore: string;
  awayTeam: Team;
  awayTeamScore: string;
  date: string;
  time: string;
  level: string;
  played: boolean;
}

const AddScores = () => {
  const [games, setGames] = useState<GameDetails[]>();

  const loadGames = async () => {
    try {
      const gamesQuery = query(
        collection(db, "games"),
        where("played", "==", false)
      );

      const gamesSnapshot = await getDocs(gamesQuery);

      const allGames: GameDetails[] = [];
      gamesSnapshot.forEach((doc) => {
        const entry = {
          gameId: doc.data().gameId,
          homeTeam: doc.data().homeTeam,
          homeTeamScore: doc.data().homeTeamScore,
          awayTeam: doc.data().awayTeam,
          awayTeamScore: doc.data().awayTeamScore,
          date: doc.data().date,
          time: doc.data().time,
          level: doc.data().level,
          played: doc.data().played,
        };
        allGames.push(entry);
      });

      setGames(allGames);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    loadGames();
  }, []);

  const updateGame = async (
    gameId: string,
    homeTeamScore: string,
    awayTeamScore: string
  ) => {
    try {
      // Query for the document with the matching gameId
      const gamesRef = collection(db, "games");
      const q = query(gamesRef, where("gameId", "==", gameId));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Get the first (and should be only) matching document
        const gameDoc = querySnapshot.docs[0];
        await updateDoc(gameDoc.ref, {
          homeTeamScore: homeTeamScore,
          awayTeamScore: awayTeamScore,
          played: true,
        });
      } else {
        console.log("No matching document found");
      }
    } catch (error) {
      console.error("Error updating document: ", error);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const gameId = formData.get("gameId");
    const homeTeamScore = formData.get("homeTeamScore");
    const awayTeamScore = formData.get("awayTeamScore");
    if (gameId && homeTeamScore && awayTeamScore) {
      updateGame(
        gameId.toString(),
        homeTeamScore.toString(),
        awayTeamScore.toString()
      );
    } else {
      console.error("Invalid form data");
    }
  };

  return (
    <ul className="addScores">
      {games &&
        games.map((game, index) => (
          <li key={index}>
            <form onSubmit={handleSubmit}>
              <label>
                <input
                  type="text"
                  value={game.gameId}
                  placeholder={game.gameId}
                  name="gameId"
                  onChange={() => {}}
                />
              </label>
              <div>Date: {game.date}</div>
              <div>Time: {game.time}</div>
              <div>Level: {game.level}</div>
              <div>
                Home Team: {game.homeTeam.team} - Score: {game.homeTeamScore}
              </div>
              <div>
                Away Team: {game.awayTeam.team} - Score: {game.awayTeamScore}
              </div>
              <label>
                <input
                  type="number"
                  placeholder="Home Team Score"
                  name="homeTeamScore"
                />
              </label>
              <label>
                <input
                  type="number"
                  placeholder="Away Team Score"
                  name="awayTeamScore"
                />
              </label>
              <button type="submit">Submit</button>
            </form>
          </li>
        ))}
    </ul>
  );
};

export default AddScores;
