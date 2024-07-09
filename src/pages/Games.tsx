import { useState } from "react";
import "../styles/games.css";

interface TeamDetails {
  team: string;
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

interface GamesInterface {
  games: GameDetails[] | null;
  gamesToday: GameDetails[] | null;
  gamesYesterday: GameDetails[] | null;
  gamesUpcoming: GameDetails[] | null;
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
      <ul className="gameDates">
        <li
          className={currentPage === "all" ? "underlined" : ""}
          onClick={() => setCurrentPage("all")}
        >
          All
        </li>
        <li
          className={currentPage === "today" ? "underlined" : ""}
          onClick={() => setCurrentPage("today")}
        >
          Today
        </li>
        <li
          className={currentPage === "yesterday" ? "underlined" : ""}
          onClick={() => setCurrentPage("yesterday")}
        >
          Yesterday
        </li>
        <li
          className={currentPage === "upcoming" ? "underlined" : ""}
          onClick={() => setCurrentPage("upcoming")}
        >
          Upcoming
        </li>
      </ul>

      {currentPage === "all" && games && (
        <>
          <ul className="games">
            {games &&
              games.map((game, index) => (
                <li key={index}>
                  <p>
                    {game.homeTeam.team} {game.homeTeamScore}&nbsp;vs{" "}
                    {game.awayTeam.team} {game.awayTeamScore}
                  </p>
                </li>
              ))}
          </ul>
          {games?.length <= 0 && (
            <div className="itemNotAvailable">
              <p>No games available</p>
            </div>
          )}
        </>
      )}
      {currentPage === "today" && gamesToday && (
        <>
          <ul className="games">
            {gamesToday &&
              gamesToday.map((game, index) => (
                <li key={index}>
                  <p>
                    {game.homeTeam.team} vs {game.awayTeam.team}
                  </p>

                  <p>Time: {game.time}</p>
                </li>
              ))}
          </ul>
          {gamesToday?.length <= 0 && (
            <div className="itemNotAvailable">
              <p>No games available today</p>
            </div>
          )}
        </>
      )}
      {currentPage === "yesterday" && gamesYesterday && (
        <>
          <ul className="games">
            {gamesYesterday &&
              gamesYesterday.map((game, index) => (
                <li key={index}>
                  <p>
                    {game.homeTeam.team} {game.homeTeamScore}&nbsp;vs{" "}
                    {game.awayTeam.team} {game.awayTeamScore}
                  </p>
                </li>
              ))}
          </ul>
          {gamesYesterday?.length <= 0 && (
            <div className="itemNotAvailable">
              <p>No games available yesterday</p>
            </div>
          )}
        </>
      )}
      {currentPage === "upcoming" && gamesUpcoming && (
        <>
          <ul className="games">
            {gamesUpcoming &&
              gamesUpcoming.map((game, index) => (
                <li key={index}>
                  <p>
                    {game.homeTeam.team} vs {game.awayTeam.team}
                  </p>
                  <p>{game.date}</p>
                  <p>{game.time}</p>
                </li>
              ))}
          </ul>
          {gamesUpcoming?.length <= 0 && (
            <div className="itemNotAvailable">
              <p>No games available upcoming</p>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default Games;
