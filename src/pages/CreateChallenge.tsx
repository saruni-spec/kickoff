import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

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

interface GamesInterface {
  gamesToday: GameDetails[];
  gamesUpcoming: GameDetails[];
}

const CreateChallenge: React.FC<GamesInterface> = ({
  gamesToday,
  gamesUpcoming,
}) => {
  const allGames = [...gamesToday, ...gamesUpcoming];
  const [currentPage, setCurrentPage] = useState("predictions");
  const [challengeName, setChallengeName] = useState("");
  const [stake, setStake] = useState(0);

  const location = useLocation();

  // Use URLSearchParams to parse the query parameters
  const queryParams = new URLSearchParams(location.search);
  const challenge = queryParams.get("challenge"); // 'challenge' is the name of the query parameter

  useEffect(() => {
    console.log(allGames);
  }, []);
  const players = ["s", "h", "r"];

  const [predictions, setPredictions] = useState({});

  const addPrediction = (
    newPredictionKey: string,
    newPredictionValue: string,
    game: GameDetails
  ) => {
    setPredictions((prevPredictions) => ({
      ...prevPredictions,
      [newPredictionKey]: `${newPredictionValue}-${game.homeTeam} vs ${game.awayTeam} on ${game.date}`,
    }));
    console.log(predictions);
  };

  const handleScores = (
    event: React.FormEvent<HTMLFormElement>,
    game: GameDetails
  ) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    console.log(formData);
    const homeGoals = formData.get("home goals");
    const awayGoals = formData.get("away goals");

    addPrediction(game.gameId, `${homeGoals} vs ${awayGoals}`, game);
  };

  return (
    <>
      {currentPage === "predictions" && (
        <>
          <button onClick={() => setCurrentPage("final")}>Next</button>
          <ul>
            {challenge === "WinXLoose" && (
              <>
                {allGames.map((game, index) => (
                  <li key={index}>
                    <p>
                      {game.homeTeam} {game.homeTeamScore}vs {game.awayTeam}{" "}
                      {game.awayTeamScore}
                    </p>
                    <p>Date: {game.date}</p>
                    <p>Time: {game.time}</p>
                    <p>Level: {game.level}</p>
                    <div>
                      Home Team
                      <button
                        onClick={() => {
                          addPrediction(game.gameId, "win", game);
                        }}
                        type="button"
                      >
                        Win
                      </button>
                      <button
                        onClick={() => {
                          addPrediction(game.gameId, "draw", game);
                        }}
                        type="button"
                      >
                        Draw
                      </button>
                      <button
                        onClick={() => {
                          addPrediction(game.gameId, "loose", game);
                        }}
                        type="button"
                      >
                        Loose
                      </button>
                    </div>
                  </li>
                ))}
              </>
            )}
            {challenge === "ScorePredictions" && (
              <>
                {allGames.map((game, index) => (
                  <li key={index}>
                    <p>
                      {game.homeTeam} {game.homeTeamScore}vs {game.awayTeam}{" "}
                      {game.awayTeamScore}
                    </p>
                    <p>Date: {game.date}</p>
                    <p>Time: {game.time}</p>
                    <p>Level: {game.level}</p>
                    <form
                      onSubmit={(event) => {
                        handleScores(event, game);
                      }}
                    >
                      <label>
                        <input
                          type="text"
                          placeholder="home goals"
                          name="home goals"
                        />
                      </label>
                      <p>vs</p>
                      <label>
                        <input
                          type="text "
                          placeholder="away goals"
                          name="away goals"
                        ></input>
                      </label>
                      <button type="submit">Set</button>
                    </form>
                  </li>
                ))}
              </>
            )}
            {challenge === "TotalGoalsScored" && (
              <>
                {allGames.map((game, index) => (
                  <li key={index}>
                    <p>
                      {game.homeTeam} {game.homeTeamScore}vs {game.awayTeam}{" "}
                      {game.awayTeamScore}
                    </p>
                    <p>Date: {game.date}</p>
                    <p>Time: {game.time}</p>
                    <p>Level: {game.level}</p>
                    <div>
                      <button
                        onClick={() => {
                          addPrediction(game.gameId, "Under 0.5", game);
                        }}
                        type="button"
                      >
                        Under 0.5
                      </button>
                      <button
                        onClick={() => {
                          addPrediction(game.gameId, "Under 1.5", game);
                        }}
                        type="button"
                      >
                        Under 1.5
                      </button>
                      <button
                        onClick={() => {
                          addPrediction(game.gameId, "Under 2.5", game);
                        }}
                        type="button"
                      >
                        Under 2.5
                      </button>

                      <button
                        onClick={() => {
                          addPrediction(game.gameId, "Over 1.5", game);
                        }}
                        type="button"
                      >
                        Over 1.5
                      </button>
                      <button
                        onClick={() => {
                          addPrediction(game.gameId, "Over 2.5", game);
                        }}
                        type="button"
                      >
                        Over 2.5
                      </button>
                      <button
                        onClick={() => {
                          addPrediction(game.gameId, "Over 3.5", game);
                        }}
                        type="button"
                      >
                        Over 3.5
                      </button>
                    </div>
                  </li>
                ))}
              </>
            )}
            {challenge === "WhoToScore" && (
              <>
                {allGames.map((game, index) => (
                  <li key={index}>
                    <p>
                      {game.homeTeam} {game.homeTeamScore}vs {game.awayTeam}{" "}
                      {game.awayTeamScore}
                    </p>
                    <p>Date: {game.date}</p>
                    <p>Time: {game.time}</p>
                    <p>Level: {game.level}</p>
                    <div>
                      {players.map((player, index) => (
                        <button
                          onClick={() => {
                            addPrediction(game.gameId, player, game);
                          }}
                          type="button"
                          key={index}
                        >
                          {player}{" "}
                        </button>
                      ))}
                    </div>
                  </li>
                ))}
              </>
            )}
          </ul>
        </>
      )}

      {currentPage === "final" && (
        <>
          <button type="button" onClick={() => setCurrentPage("predictions")}>
            Back
          </button>
          <button type="button" onClick={() => setCurrentPage("complete")}>
            Proceed
          </button>

          <label>
            <p>Name that will be visible when you share the challenge</p>
            <input
              type="text"
              placeholder="Challenge name"
              name="challengeName"
              onChange={(e) => setChallengeName(e.target.value)}
            />
          </label>
          <label>
            <p>How much would you like to set as stake?</p>
            <input
              type="number"
              placeholder="stake"
              name="stake"
              onChange={(e) => {
                setStake(e.target.value);
              }}
            />
          </label>
          <ul>
            {Object.keys(predictions).map((key, index) => (
              <li key={index}>
                <p>{key}</p>
                <p>{predictions[key]}</p>
              </li>
            ))}
          </ul>
        </>
      )}

      {currentPage === "complete" && (
        <div>
          <label>
            <p>{challengeName}</p>
          </label>
          <label>
            <p>{stake}</p>
          </label>

          <button
            type="button"
            onClick={() => makePayment(challengeName, stake, predictions)}
          >
            Create
          </button>
        </div>
      )}
    </>
  );
};

export default CreateChallenge;
