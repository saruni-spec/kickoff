import { useEffect, useState } from "react";
import "../styles/challenges.css";
import LZString from "lz-string";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";

interface TeamDetails {
  team: string;
  players: string[];
}

interface gameDetails {
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
interface UserPrediction {
  game: string;
  prediction: string;
}

interface Predictions {
  [key: string]: UserPrediction;
}

interface Challenge {
  name: string;
  challenge: string;
  gamesInPrediction: gameDetails[];
  stake: number;
  predictions: Predictions[];
  status: "active" | "closed";
  createdBy: string;
  members: string[];
  winner: string | null;
  earliestGameDate: string;
  earliestGameTime: string;
}
interface userDetails {
  email: string;
  phone: string;
  account: number;
}

interface ChallengesProps {
  user: string;
  userDetails: userDetails | null;
  setMainPage: (page: string) => void;
  joinedChallenges: Challenge[] | null;
  notJoinedChallenges: Challenge[] | null;
}

const Challenges: React.FC<ChallengesProps> = ({
  user,
  userDetails,
  setMainPage,
  joinedChallenges,
  notJoinedChallenges,
}) => {
  const [currentPage, setCurrentPage] = useState("all");

  const [filteredChallenges, setFilteredChallenges] = useState("others");

  const [challengeObserved, setChallengeObserved] = useState<{
    [key: string]: UserPrediction[];
  }>();

  const navigate = useNavigate();

  const joinChallenge = (
    challenge: Challenge,
    user: string,
    userDetails: userDetails | null
  ) => {
    if (user === "" || user === undefined || user === null) {
      navigate("/login");
    } else {
      const encodedChallenge = LZString.compressToEncodedURIComponent(
        JSON.stringify({
          challenge: challenge.challenge,
          createdBy: challenge.createdBy,
          name: challenge.name,
          earliestGameDate: challenge.earliestGameDate,
        })
      );
      const encodedEmail = encodeURIComponent(user);
      const encodeUser = encodeURIComponent(JSON.stringify(userDetails));

      navigate(
        `/join/?joinThisChallenge=${encodedChallenge}&userEmail=${encodedEmail}&userDetails=${encodeUser}`
      );
    }
  };

  const groupPredictions = (predictions: Predictions[]) => {
    const groupedPredictions: { [key: string]: UserPrediction[] } = {};

    predictions.forEach((prediction) => {
      Object.entries(prediction).forEach(([key, value]) => {
        if (!groupedPredictions[key]) {
          groupedPredictions[key] = [];
        }
        groupedPredictions[key].push(value);
      });
    });

    return groupedPredictions;
  };

  const viewThisChallenge = (challenge: Predictions[]) => {
    const groupedPredictions = groupPredictions(challenge);
    setChallengeObserved(groupedPredictions);
    setCurrentPage("observe");
  };

  useEffect(() => {
    if (user === "" || user === null || user === undefined) {
      console.log(user, "challengers");
      navigate("/login");
    }
  }, []);

  return (
    <>
      {user === "" || user === null || user === undefined ? (
        <div>
          <p>Log in to view available groups</p>
        </div>
      ) : (
        <>
          {currentPage === "all" && (
            <>
              <ul className="filterChallenge">
                <li
                  className={
                    filteredChallenges === "others" ? "underlined" : ""
                  }
                  onClick={() => setFilteredChallenges("others")}
                >
                  All Challenges
                </li>
                <li
                  className={filteredChallenges === "user" ? "underlined" : ""}
                  onClick={() => setFilteredChallenges("user")}
                >
                  My Challenges
                </li>
              </ul>
              {filteredChallenges === "others" && notJoinedChallenges && (
                <>
                  <p>List of groups you can currently join</p>
                  <ul className="challengesList">
                    {notJoinedChallenges.map((challenge, index) => (
                      <li key={index}>
                        <p>{challenge.name}</p>
                        <p>Stake: {challenge.stake} Ksh</p>
                        <p>Members : {challenge.members.length}</p>
                        <p>Type of Challenge : {challenge.challenge}</p>
                        <button
                          type="button"
                          onClick={() =>
                            joinChallenge(challenge, user, userDetails)
                          }
                        >
                          Join
                        </button>
                      </li>
                    ))}
                  </ul>
                  {notJoinedChallenges.length <= 0 && (
                    <div className="itemNotAvailable">
                      <button
                        type="button"
                        onClick={() => setMainPage("create")}
                      >
                        Create New Challenge
                        <FontAwesomeIcon icon={faPlus} />
                      </button>
                    </div>
                  )}
                </>
              )}
              {filteredChallenges === "user" && joinedChallenges && (
                <>
                  <ul className="challengesList">
                    {joinedChallenges.map((challenge, index) => (
                      <li key={index}>
                        <p>{challenge.name}</p>
                        <p>Stake: {challenge.stake} Ksh</p>
                        <p>Members : {challenge.members.length}</p>
                        <p>Type of Challenge : {challenge.challenge}</p>
                        <button
                          type="button"
                          onClick={() =>
                            viewThisChallenge(challenge.predictions)
                          }
                        >
                          View
                        </button>
                      </li>
                    ))}
                  </ul>
                  {joinedChallenges.length <= 0 && (
                    <div className="itemNotAvailable">
                      <button
                        type="button"
                        onClick={() => setMainPage("create")}
                      >
                        Create New Challenge <FontAwesomeIcon icon={faPlus} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
          {currentPage === "observe" && challengeObserved && (
            <div>
              {Object.entries(challengeObserved).map(([key, predictions]) => (
                <div key={key}>
                  <h3>{key}</h3>
                  <ul>
                    {predictions.map((prediction, index) => (
                      <li key={index}>
                        <p>Game: {prediction.game}</p>
                        <p>Prediction: {prediction.prediction}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
};

export default Challenges;
