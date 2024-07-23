import { useEffect, useState } from "react";
import "../styles/createChallenge.css";
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
type prediction = string;
type game = string;

interface UserPrediction {
  [game: game]: prediction;
}

interface Predictions {
  [user: string]: UserPrediction;
}

interface Challenge {
  name: string;
  challenge: string;
  gamesInPrediction: gameDetails[];
  stake: number;
  predictions: Predictions;
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

  const [challengeObserved, setChallengeObserved] = useState<Predictions>();

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

  const viewThisChallenge = (challenge: Predictions) => {
    setChallengeObserved(challenge);
    setCurrentPage("observe");
  };

  const createNewChallenge = (user: string) => {
    if (user === "" || user === undefined || user === null) {
      navigate("/login");
    }
    setMainPage("choose");
  };
  useEffect(() => {
    if (user === "" || user === undefined || user === null) {
      setCurrentPage("new");
    }
  }, []);

  return (
    <>
      {user !== "" && user !== undefined && (
        <button
          type="button"
          onClick={() => createNewChallenge(user)}
          className="newChallenge"
        >
          Create New Challenge
          <FontAwesomeIcon icon={faPlus} />
        </button>
      )}

      {currentPage === "all" && (
        <>
          <ul className="filterChallenge">
            <li
              className={filteredChallenges === "others" ? "underlined" : ""}
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
                  There are no active challenges available at the moment, please
                  check back later
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
                      onClick={() => viewThisChallenge(challenge.predictions)}
                    >
                      View
                    </button>
                  </li>
                ))}
              </ul>
              {joinedChallenges.length <= 0 && user === "" ? (
                <div className="itemNotAvailable">
                  Login to view challenges you have joined
                </div>
              ) : (
                <div className="itemNotAvailable">Join New Challenges</div>
              )}
            </>
          )}
        </>
      )}
      {currentPage === "new" && (
        <>
          <h2>Available Challenges</h2>
          {filteredChallenges === "others" && notJoinedChallenges && (
            <>
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
                  There are no active challenges available at the moment, please
                  check back later
                </div>
              )}
            </>
          )}
        </>
      )}
      {currentPage === "observe" && challengeObserved && (
        <div>
          {Object.entries(challengeObserved || {}).map(
            ([user, userPredictions]) => (
              <div key={user}>
                <h3>{user}</h3>
                <ul>
                  {Object.entries(userPredictions).map(([game, prediction]) => (
                    <li key={game}>
                      <p>Game: {game}</p>
                      <p>Prediction: {prediction}</p>
                      {(prediction === "win" || prediction === "loose") && (
                        <p>
                          {game.split(" vs ")[0]} : {prediction}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )
          )}
        </div>
      )}
    </>
  );
};

export default Challenges;
