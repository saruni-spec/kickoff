import {
  addDoc,
  collection,
  getDocs,
  increment,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { db } from "./firebase";
import "../styles/createChallenge.css";
import IntaSendButton from "../components/Intasend";

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

interface userDetails {
  email: string;
  phone: string;
  account: number;
}
interface GamesInterface {
  gamesToday: GameDetails[] | null;
  gamesUpcoming: GameDetails[] | null;
  user: string;
  setMainPage: (page: string) => void;
  userDetails: userDetails | null;
  setUserDetails: (userDetails: userDetails | null) => void;
  setChallengeDetails: (ChallengeDetails: ChallengeDetails | null) => void;
  challengeDetails: ChallengeDetails | null;
  setLoading: (loading: boolean) => void;
}

type prediction = string;
type game = string;

interface UserPrediction {
  [game: game]: prediction;
}

interface Predictions {
  [key: string]: UserPrediction;
}

interface ChallengeDetails {
  name: string;
  stake: string;
  gamesChosen: GameDetails[];
  predictions: Predictions;
  challenge: string | null;
}

const CreateChallenge: React.FC<GamesInterface> = ({
  gamesToday,
  gamesUpcoming,
  user,
  setMainPage,
  userDetails,
  setUserDetails,
  setChallengeDetails,
  challengeDetails,
  setLoading,
}) => {
  const allGames = [...(gamesToday || []), ...(gamesUpcoming || [])];
  const [currentPage, setCurrentPage] = useState("predictions");
  const [challengeName, setChallengeName] = useState("");
  const [stake, setStake] = useState("0");
  const [gamesChosen, setGamesChosen] = useState<GameDetails[]>([]);
  const [phone, setPhone] = useState("");
  const [accountUpdated, setAccountUpdated] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  // Use URLSearchParams to parse the query parameters
  const queryParams = new URLSearchParams(location.search);
  const challenge = queryParams.get("challenge"); // 'challenge' is the name of the query parameter
  const [userPredictions, setUserPredictions] = useState<UserPrediction | null>(
    null
  );
  const [predictions, setPredictions] = useState<Predictions | null>(null);
  const [selectedPredictions, setSelectedPredictions] = useState<{
    [gameId: string]: string;
  }>({});
  const [homeGoals, setHomeGoals] = useState("");
  const [awayGoals, setAwayGoals] = useState("");

  const addPrediction = (
    user: string,
    newPredictionValue: string,
    newPredictionKey: GameDetails
  ) => {
    setUserPredictions((prevPredictions) => ({
      ...(prevPredictions || {}),
      [`${newPredictionKey.homeTeam.team} vs ${newPredictionKey.awayTeam.team}`]:
        newPredictionValue,
    }));

    setPredictions((prevPredictions) => {
      const updatedUserPredictions = {
        ...(userPredictions || {}),
        [`${newPredictionKey.homeTeam.team} vs ${newPredictionKey.awayTeam.team}`]:
          newPredictionValue,
      };
      return {
        ...(prevPredictions || {}),
        [user]: updatedUserPredictions,
      };
    });

    setGamesChosen((prevGames) => [...prevGames, newPredictionKey]);
  };

  const handleScores = (
    event: React.FormEvent<HTMLFormElement>,
    user: string,
    game: GameDetails,
    gameId: string
  ) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const homeGoals = formData.get("home goals");
    const awayGoals = formData.get("away goals");

    addPrediction(
      user,
      `${game.homeTeam} [${homeGoals}] vs ${game.awayTeam} [${awayGoals}]`,
      game
    );
    setSelectedPredictions((prev) => ({
      ...prev,
      [gameId]: `${game.homeTeam} [${homeGoals}] vs ${game.awayTeam} [${awayGoals}]`,
    }));
  };

  const addChallenge = async (
    challengeName: string,
    stake: string,
    predictions: Predictions,
    challenge: string | null,
    games: GameDetails[],
    user: string
  ) => {
    const earliestGameDate = checkEarliestGameInPredictions(games);
    try {
      await addDoc(collection(db, "challenges"), {
        name: challengeName,
        stake: stake,
        gamesInPrediction: games,
        challenge: challenge,
        predictions: predictions,
        status: "active",
        createdBy: user,
        members: [user],
        earliestGameDate: earliestGameDate?.date,
        earliestGameTime: earliestGameDate?.time,
      });
      alert("Challenge Created");
      setMainPage("view");
      setLoading(true);
    } catch (error) {
      console.log(error);
    }
  };

  const topUpStake = async (
    stake: string,
    userDetails: userDetails,
    challengeName: string,
    predictions: Predictions,
    challenge: string | null,
    games: GameDetails[]
  ) => {
    const myChallenge = {
      name: challengeName,
      stake: stake,
      gamesChosen: games,
      predictions: predictions,
      challenge: challenge,
    };
    if (Number(userDetails.account) >= Number(stake)) {
      addChallenge(
        challengeName,
        stake,
        predictions,
        challenge,
        games,
        userDetails.email
      );
      updateAmount(Number(stake), userDetails);
    } else {
      setChallengeDetails(myChallenge);
      setCurrentPage("payment");
    }
  };

  const makePayment = async (
    challengeName: string,
    stake: string,
    predictions: Predictions,
    challenge: string | null,
    games: GameDetails[],
    phone: string,
    userDetails: userDetails | null
  ) => {
    if (!userDetails || userDetails === undefined || userDetails === null) {
      createUserDetails(user, phone);
    } else {
      console.log("user details exist");
      topUpStake(
        stake,
        userDetails,
        challengeName,
        predictions,
        challenge,
        games
      );
    }
  };

  const checkEarliestGameInPredictions = (games: GameDetails[]) => {
    let earliestDateTime: Date | null = null;
    let earliestGame: GameDetails | null = null;

    if (games.length === 0) {
      return null;
    }

    games.forEach((game) => {
      const [hours, minutes] = game.time.split(":");
      const isPM = game.time.toLowerCase().includes("pm");

      const gameDateTime = new Date(game.date);
      gameDateTime.setHours(
        isPM ? parseInt(hours) + 12 : parseInt(hours),
        parseInt(minutes)
      );

      if (!earliestDateTime || gameDateTime < earliestDateTime) {
        earliestDateTime = gameDateTime;
        earliestGame = game;
      }
    });

    if (earliestGame === null) {
      return null;
    } else {
      return {
        date: (earliestGame as GameDetails).date,
        time: (earliestGame as GameDetails).time,
      };
    }
  };

  const createUserDetails = async (email: string, phone: string) => {
    try {
      await addDoc(collection(db, "KUsers"), {
        email: email,
        phone: phone,
        account: "0",
      });
      alert("User Details Created");
      setUserDetails({ email: email, phone: phone, account: 0 });
    } catch (error) {
      alert("Error creating user details");
      console.log(error);
    }
  };

  const cancelChallenge = () => {
    setMainPage("choose");
    setChallengeDetails(null);
  };

  const nextPage = (item: any, page: string, message: string) => {
    if (
      !item ||
      item === null ||
      item === undefined ||
      item === "" ||
      item.length === 0
    ) {
      console.log("item is not present");
      return alert(message);
    } else {
      setCurrentPage(page);
    }
  };

  const updateUserAccount = async (
    amount: number,
    userDetails: userDetails | null
  ) => {
    setCurrentPage("complete");
    if (!userDetails) return;

    try {
      // Query the collection to find the document with the specified email
      const userQuery = query(
        collection(db, "KUsers"),
        where("email", "==", userDetails.email)
      );

      const querySnapshot = await getDocs(userQuery);

      if (querySnapshot.empty) {
        console.error("No document found with the specified email.");
        await addDoc(collection(db, "KUsers"), {
          email: userDetails.email,
          phone: phone,
          account: 0,
        });

        alert("User Details Created");
        return;
      }

      // Assuming there's only one document per email
      const userDoc = querySnapshot.docs[0];

      // Update the document
      await updateDoc(userDoc.ref, {
        account: increment(amount),
      });

      const newUserDetails = {
        email: userDetails.email,
        phone: userDetails.phone,
        account: Number(userDetails.account) + Number(amount),
      };
      setUserDetails(newUserDetails);
    } catch (error) {
      console.error("Error updating user account:", error);
    }
  };

  const updateAmount = async (
    amount: number,
    userDetails: userDetails | null
  ) => {
    setCurrentPage("complete");
    if (!userDetails) return;

    try {
      // Query the collection to find the document with the specified email
      const userQuery = query(
        collection(db, "KUsers"),
        where("email", "==", userDetails.email)
      );

      const querySnapshot = await getDocs(userQuery);

      if (querySnapshot.empty) {
        console.error("No document found with the specified email.");
        await addDoc(collection(db, "KUsers"), {
          email: userDetails.email,
          phone: phone,
          account: 0,
        });

        alert("User Details Created");
        return;
      }

      // Assuming there's only one document per email
      const userDoc = querySnapshot.docs[0];

      // Update the document
      await updateDoc(userDoc.ref, {
        account: increment(-amount),
      });

      const newUserDetails = {
        email: userDetails.email,
        phone: userDetails.phone,
        account: Number(userDetails.account) + Number(amount),
      };
      setUserDetails(newUserDetails);
    } catch (error) {
      console.error("Error updating user account:", error);
    }
  };

  const giveUpChallenge = () => {
    setChallengeDetails(null);
    setGamesChosen([]);
  };

  useEffect(() => {
    if (user === "" && user === null && user === undefined) {
      navigate("/login");
    } else {
      if (accountUpdated) {
        updateUserAccount(Number(stake), userDetails);
      } else {
        console.log("Account not updated");
      }
      if (challengeDetails !== null) {
        console.log("complete page");
        setCurrentPage("complete");
      } else {
        console.log("predictions page");

        setCurrentPage("predictions");
      }
    }
  }, [accountUpdated]);

  return (
    <>
      {challengeDetails ? (
        <>
          {currentPage === "complete" && userDetails && (
            <div className="completeChallenge">
              <label>
                <p>{challengeDetails.name}</p>
              </label>
              <label>
                <p>{challengeDetails.stake}</p>
              </label>
              <label>
                {userDetails && <p>{userDetails.phone}</p>}
                {!userDetails && (
                  <input
                    required
                    type="text"
                    placeholder="phone"
                    onChange={(e) => setPhone(e.target.value)}
                  />
                )}
              </label>

              <button
                type="button"
                onClick={() =>
                  makePayment(
                    challengeDetails.name,
                    challengeDetails.stake,
                    challengeDetails.predictions,
                    challengeDetails.challenge,
                    challengeDetails.gamesChosen,
                    phone,
                    userDetails
                  )
                }
              >
                Create
              </button>
              <button type="button" onClick={cancelChallenge}>
                Cancel
              </button>
            </div>
          )}
          {currentPage === "payment" && challengeDetails && userDetails && (
            <>
              <button type="button" onClick={() => setCurrentPage("final")}>
                Back
              </button>
              <button type="button" onClick={giveUpChallenge}>
                Cancel
              </button>
              <p>Current Amount in Account : {userDetails.account}</p>
              <p>Amount needed for the stake : {challengeDetails.stake}</p>
              <p>
                Amount to Top Up :{" "}
                {Number(challengeDetails.stake) - Number(userDetails.account)}
              </p>

              <IntaSendButton
                amount={(
                  Number(challengeDetails.stake) - Number(userDetails.account)
                ).toString()}
                setAccountUpdated={setAccountUpdated}
                setCurrentPage={setCurrentPage}
                page="complete"
              />
            </>
          )}
        </>
      ) : (
        <>
          {currentPage === "predictions" && (
            <>
              <button type="button" onClick={() => setMainPage("choose")}>
                Back
              </button>
              <button
                onClick={() =>
                  nextPage(predictions, "final", "No predictions made")
                }
              >
                Next
              </button>

              <ul className="challengeType">
                {allGames.map((game, index) => {
                  const gameId = `${game.homeTeam.team}-vs-${game.awayTeam.team}`;
                  const selectedPrediction = selectedPredictions[gameId];

                  return (
                    <>
                      {challenge === "WinXLoose" && (
                        <li key={index}>
                          <div className="winXloose">
                            <p
                              onClick={() => {
                                const prediction = `${game.homeTeam.team} win`;
                                addPrediction(user, prediction, game);
                                setSelectedPredictions((prev) => ({
                                  ...prev,
                                  [gameId]: prediction,
                                }));
                              }}
                              className={
                                selectedPrediction ===
                                `${game.homeTeam.team} win`
                                  ? "selectedTeam"
                                  : ""
                              }
                            >
                              {game.homeTeam.team} {game.homeTeamScore}
                            </p>
                            <p
                              onClick={() => {
                                const prediction = "draw";
                                addPrediction(user, prediction, game);
                                setSelectedPredictions((prev) => ({
                                  ...prev,
                                  [gameId]: prediction,
                                }));
                              }}
                              className={
                                selectedPrediction === "draw"
                                  ? "selectedTeam"
                                  : ""
                              }
                            >
                              Draw
                            </p>
                            <p
                              onClick={() => {
                                const prediction = `${game.awayTeam.team} win`;
                                addPrediction(user, prediction, game);
                                setSelectedPredictions((prev) => ({
                                  ...prev,
                                  [gameId]: prediction,
                                }));
                              }}
                              className={
                                selectedPrediction ===
                                `${game.awayTeam.team} win`
                                  ? "selectedTeam"
                                  : ""
                              }
                            >
                              {game.awayTeam.team} {game.awayTeamScore}
                            </p>
                          </div>
                        </li>
                      )}
                      {challenge === "ScorePredictions" && (
                        <li key={index}>
                          <form
                            className="predictionForm"
                            onSubmit={(event) => {
                              handleScores(event, user, game, gameId);
                            }}
                          >
                            <label>
                              {game.homeTeam.team} {game.homeTeamScore}
                              <input
                                required
                                type="text"
                                placeholder="home goals"
                                name="home goals"
                                onChange={(e) => setHomeGoals(e.target.value)}
                              />
                            </label>
                            <p>vs</p>
                            <label>
                              {game.awayTeam.team} {game.awayTeamScore}
                              <input
                                required
                                type="text "
                                placeholder="away goals"
                                name="away goals"
                                onChange={(e) => setAwayGoals(e.target.value)}
                              ></input>
                            </label>
                            <button
                              type="submit"
                              className={
                                selectedPrediction ===
                                `${game.homeTeam} [${homeGoals}] vs ${game.awayTeam} [${awayGoals}]`
                                  ? "selectedTeam"
                                  : ""
                              }
                            >
                              Confirm
                            </button>
                          </form>
                        </li>
                      )}
                      {challenge === "TotalGoalsScored" && (
                        <li key={index}>
                          <p>
                            {game.homeTeam.team} {game.homeTeamScore}vs{" "}
                            {game.awayTeam.team} {game.awayTeamScore}
                          </p>

                          <div>
                            <button
                              onClick={() => {
                                addPrediction(user, "Under 0.5", game);
                                setSelectedPredictions((prev) => ({
                                  ...prev,
                                  [gameId]: "Under 0.5",
                                }));
                              }}
                              type="button"
                              className={
                                selectedPrediction === "Under 0.5"
                                  ? "selectedTeam"
                                  : ""
                              }
                            >
                              Under 0.5
                            </button>
                            <button
                              onClick={() => {
                                addPrediction(user, "Under 1.5", game);
                                setSelectedPredictions((prev) => ({
                                  ...prev,
                                  [gameId]: "Under 1.5",
                                }));
                              }}
                              type="button"
                              className={
                                selectedPrediction === "Under 1.5"
                                  ? "selectedTeam"
                                  : ""
                              }
                            >
                              Under 1.5
                            </button>
                            <button
                              onClick={() => {
                                addPrediction(user, "Under 2.5", game);
                                setSelectedPredictions((prev) => ({
                                  ...prev,
                                  [gameId]: "Under 2.5",
                                }));
                              }}
                              type="button"
                              className={
                                selectedPrediction === "Under 2.5"
                                  ? "selectedTeam"
                                  : ""
                              }
                            >
                              Under 2.5
                            </button>

                            <button
                              onClick={() => {
                                addPrediction(user, "Over 1.5", game);
                                setSelectedPredictions((prev) => ({
                                  ...prev,
                                  [gameId]: "Over 1.5",
                                }));
                              }}
                              type="button"
                              className={
                                selectedPrediction === "Over 1.5"
                                  ? "selectedTeam"
                                  : ""
                              }
                            >
                              Over 1.5
                            </button>
                            <button
                              onClick={() => {
                                addPrediction(user, "Over 2.5", game);
                                setSelectedPredictions((prev) => ({
                                  ...prev,
                                  [gameId]: "Over 2.5",
                                }));
                              }}
                              type="button"
                              className={
                                selectedPrediction === "Over 2.5"
                                  ? "selectedTeam"
                                  : ""
                              }
                            >
                              Over 2.5
                            </button>
                            <button
                              onClick={() => {
                                addPrediction(user, "Over 3.5", game);
                                setSelectedPredictions((prev) => ({
                                  ...prev,
                                  [gameId]: "Over 3.5",
                                }));
                              }}
                              type="button"
                              className={
                                selectedPrediction === "Over 3.5"
                                  ? "selectedTeam"
                                  : ""
                              }
                            >
                              Over 3.5
                            </button>
                          </div>
                        </li>
                      )}
                      {challenge === "WhoToScore" && (
                        <li key={index}>
                          <p>
                            {game.homeTeam.team} {game.homeTeamScore}vs{" "}
                            {game.awayTeam.team} {game.awayTeamScore}
                          </p>

                          <div>
                            {[
                              ...game.homeTeam.players,
                              ...game.awayTeam.players,
                            ].map((player, index) => (
                              <button
                                onClick={() => {
                                  addPrediction(user, player, game);
                                  setSelectedPredictions((prev) => ({
                                    ...prev,
                                    [gameId]: player,
                                  }));
                                }}
                                type="button"
                                key={index}
                                className={
                                  selectedPrediction === player
                                    ? "selectedTeam"
                                    : ""
                                }
                              >
                                {player}{" "}
                              </button>
                            ))}
                          </div>
                        </li>
                      )}
                    </>
                  );
                })}
              </ul>
            </>
          )}

          {currentPage === "final" && (
            <div className="viewChallenges">
              <button
                type="button"
                onClick={() => setCurrentPage("predictions")}
              >
                Back
              </button>
              <button
                type="button"
                onClick={() =>
                  nextPage(challengeName, "complete", "Name your challenge")
                }
              >
                Next
              </button>

              <label>
                <p>WHat would you like to name your group challenge</p>
                <input
                  required
                  type="text"
                  placeholder="Challenge name"
                  name="challengeName"
                  onChange={(e) => setChallengeName(e.target.value)}
                />
              </label>
              <label>
                <p>Would you like to set a stake</p>
                <input
                  required
                  type="number"
                  placeholder="stake"
                  name="stake"
                  onChange={(e) => {
                    setStake(e.target.value);
                  }}
                />
              </label>
            </div>
          )}

          {currentPage === "complete" && predictions && (
            <div className="completeChallenge">
              <label>
                <p>{challengeName}</p>
              </label>
              <label>
                <p>{stake}</p>
              </label>
              <label>
                {userDetails && <p>{userDetails.phone}</p>}
                {!userDetails && (
                  <input
                    required
                    type="text"
                    placeholder="phone"
                    onChange={(e) => setPhone(e.target.value)}
                  />
                )}
              </label>
              <button type="button" onClick={cancelChallenge}>
                Cancel
              </button>
              <button
                type="button"
                onClick={() =>
                  makePayment(
                    challengeName,
                    stake,
                    predictions,
                    challenge,
                    gamesChosen,
                    phone,
                    userDetails
                  )
                }
              >
                Create
              </button>
            </div>
          )}
          {currentPage === "payment" && userDetails && (
            <>
              <button type="button" onClick={() => setCurrentPage("final")}>
                Back
              </button>
              <button type="button" onClick={giveUpChallenge}>
                Cancel
              </button>
              <p>Current Amount in Account : {userDetails.account}</p>
              <p>Amount needed for the stake : {stake}</p>
              <p>Deficit : {Number(stake) - Number(userDetails.account)}</p>

              <IntaSendButton
                amount={(
                  Number(stake) - Number(userDetails.account)
                ).toString()}
                setAccountUpdated={setAccountUpdated}
                setCurrentPage={setCurrentPage}
                page="complete"
              />
            </>
          )}
        </>
      )}
    </>
  );
};

export default CreateChallenge;
