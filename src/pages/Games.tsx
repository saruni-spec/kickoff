import { useState } from "react";
import "../styles/games.css";

interface GameDetails {
  homeTeam: string;
  homeTeamScore: string;
  awayTeam: string;
  awayTeamScore: string;
  date: string;
  time: string;
  level: string;
}

interface GamesInterface {
  games: GameDetails[];
  gamesToday: GameDetails[];
  gamesYesterday: GameDetails[];
  gamesUpcoming: GameDetails[];
}

const Games: React.FC<GamesInterface> = ({
  games,
  gamesToday,
  gamesUpcoming,
  gamesYesterday,
}) => {
  const [currentPage, setCurrentPage] = useState("all");

  return (
    <>
      <ul>
        <li onClick={() => setCurrentPage("all")}>All Games</li>
        <li onClick={() => setCurrentPage("today")}>Today</li>
        <li onClick={() => setCurrentPage("yesterday")}>Yesterday</li>
        <li onClick={() => setCurrentPage("upcoming")}>Upcoming</li>
      </ul>

      {currentPage === "all" && (
        <ul className="games">
          {games &&
            games.map((game, index) => (
              <li key={index}>
                <p>
                  {game.homeTeam} {game.homeTeamScore}vs {game.awayTeam}{" "}
                  {game.awayTeamScore}
                </p>
                <p>Date: {game.date}</p>
                <p>Time: {game.time}</p>
                <p>Level: {game.level}</p>
              </li>
            ))}
        </ul>
      )}
      {currentPage === "today" && (
        <ul className="games">
          {gamesToday &&
            gamesToday.map((game, index) => (
              <li key={index}>
                <p>
                  {game.homeTeam} vs {game.awayTeam}
                </p>
                <p>Date: {game.date}</p>
                <p>Time: {game.time}</p>
                <p>Level: {game.level}</p>
              </li>
            ))}
        </ul>
      )}
      {currentPage === "yesterday" && (
        <ul className="games">
          {gamesYesterday &&
            gamesYesterday.map((game, index) => (
              <li key={index}>
                <p>
                  {game.homeTeam} vs {game.awayTeam}
                </p>
                <p>Date: {game.date}</p>
                <p>Time: {game.time}</p>
                <p>Level: {game.level}</p>
              </li>
            ))}
        </ul>
      )}
      {currentPage === "upcoming" && (
        <ul className="games">
          {gamesUpcoming &&
            gamesUpcoming.map((game, index) => (
              <li key={index}>
                <p>
                  {game.homeTeam} vs {game.awayTeam}
                </p>
                <p>Date: {game.date}</p>
                <p>Time: {game.time}</p>
                <p>Level: {game.level}</p>
              </li>
            ))}
        </ul>
      )}
    </>
  );
};

export default Games;
