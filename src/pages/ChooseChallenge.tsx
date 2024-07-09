import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import "../styles/chooseChallenge.css";

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

interface UserPrediction {
  game: string;
  prediction: string;
}

interface Predictions {
  [key: string]: UserPrediction;
}

interface ChallengeDetails {
  name: string;
  stake: string;
  gamesChosen: GameDetails[];
  predictions: Predictions[];
  challenge: string | null;
}

interface ChooseInterface {
  setCurrentPage: (page: string) => void;
  challengeDetails: ChallengeDetails | null;
}

const ChooseChallenge: React.FC<ChooseInterface> = ({
  setCurrentPage,
  challengeDetails,
}) => {
  const navigate = useNavigate();

  const handleChallengeClick = (selectedChallenge: string) => {
    navigate(`/?challenge=${selectedChallenge}`);
    setCurrentPage("create");
  };

  useEffect(() => {
    if (challengeDetails) {
      setCurrentPage("create");
    } else {
      setCurrentPage("choose");
    }
  }, []);

  return (
    <div className="chooseChallenge">
      <ul>
        <li onClick={() => handleChallengeClick("WinXLoose")}>Win X Loose</li>
        <li onClick={() => handleChallengeClick("ScorePredictions")}>
          Score Predictions
        </li>
        <li onClick={() => handleChallengeClick("TotalGoalsScored")}>
          Total goals Scored
        </li>
        <li onClick={() => handleChallengeClick("WhoToScore")}>Who To Score</li>
      </ul>
    </div>
  );
};

export default ChooseChallenge;
