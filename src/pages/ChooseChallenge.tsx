import { useNavigate } from "react-router-dom";

const ChooseChallenge = ({ setCurrentPage }) => {
  const navigate = useNavigate();

  const handleChallengeClick = (selectedChallenge: string) => {
    navigate(`/?challenge=${selectedChallenge}`);
    setCurrentPage("create");
  };

  return (
    <div>
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
