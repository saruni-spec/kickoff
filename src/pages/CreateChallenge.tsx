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
import "../styles/challenges.css";
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

  const [predictions, setPredictions] = useState<Predictions[]>([]);

  const addPrediction = (
    user: string,
    newPredictionValue: string,
    newPredictionKey: GameDetails
  ) => {
    const newPrediction = {
      [user]: {
        game: `${newPredictionKey.homeTeam.team} vs ${newPredictionKey.awayTeam.team}`,
        prediction: newPredictionValue,
      },
    };

    const alreadyExists = predictions.some((prediction) => {
      const key = Object.keys(prediction)[0];
      return prediction[key].game === newPrediction[user].game;
    });

    if (alreadyExists) {
      const updatedPredictions = predictions.map((prediction) => {
        const key = Object.keys(prediction)[0];
        if (prediction[key].game === newPrediction[user].game) {
          if (prediction[key].prediction !== newPrediction[user].prediction) {
            // Update the prediction value
            return {
              [key]: {
                ...prediction[key],
                prediction: newPredictionValue,
              },
            };
          }
          // Return the original prediction if the value hasn't changed
          return prediction;
        }
        return prediction;
      });

      setPredictions(updatedPredictions);
    } else {
      setPredictions((prevPredictions) => [...prevPredictions, newPrediction]);
      setGamesChosen((prevGames) => [...prevGames, newPredictionKey]);
    }
  };

  const handleScores = (
    event: React.FormEvent<HTMLFormElement>,
    user: string,
    game: GameDetails
  ) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const homeGoals = formData.get("home goals");
    const awayGoals = formData.get("away goals");

    addPrediction(user, `${homeGoals} vs ${awayGoals}`, game);
  };

  const addChallenge = async (
    challengeName: string,
    stake: string,
    predictions: Predictions[],
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
    predictions: Predictions[],
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
    predictions: Predictions[],
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
    if (user !== "" && user !== null && user !== undefined) {
      navigate("/login");
    } else {
      if (accountUpdated) {
        updateUserAccount(Number(stake), userDetails);
      } else {
        console.log("Account not updated");
      }
      if (challengeDetails !== null) {
        setCurrentPage("complete");
      } else {
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
                Give Up
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
              <button
                onClick={() =>
                  nextPage(predictions, "final", "No predictions made")
                }
              >
                Next
              </button>
              <button type="button" onClick={() => setMainPage("choose")}>
                Back
              </button>
              {predictions && (
                <ul className="predictionsMade">
                  {predictions.map((prediction, index) => (
                    <li key={index}>
                      {Object.keys(prediction).map((key) => (
                        <div key={key} className="predictedGames">
                          {challenge === "WinXLoose" && (
                            <p>
                              {prediction[key].game.split(" vs ")[0]} <br />
                              {prediction[key].prediction}
                            </p>
                          )}
                          {challenge !== "WinXLoose" && (
                            <>
                              <p>{prediction[key].game}</p>
                              <p>{prediction[key].prediction}</p>
                            </>
                          )}
                          <p></p>
                        </div>
                      ))}
                    </li>
                  ))}
                </ul>
              )}
              <ul className="challengeType">
                {challenge === "WinXLoose" && (
                  <>
                    {allGames.map((game, index) => (
                      <li key={index}>
                        <p>
                          {game.homeTeam.team} {game.homeTeamScore}vs{" "}
                          {game.awayTeam.team} {game.awayTeamScore}
                        </p>

                        <div>
                          Home Team
                          <button
                            onClick={() => {
                              addPrediction(user, "win", game);
                            }}
                            type="button"
                          >
                            Win
                          </button>
                          <button
                            onClick={() => {
                              addPrediction(user, "draw", game);
                            }}
                            type="button"
                          >
                            Draw
                          </button>
                          <button
                            onClick={() => {
                              addPrediction(user, "loose", game);
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
                          {game.homeTeam.team} {game.homeTeamScore}vs{" "}
                          {game.awayTeam.team} {game.awayTeamScore}
                        </p>

                        <form
                          onSubmit={(event) => {
                            handleScores(event, user, game);
                          }}
                        >
                          <label>
                            <input
                              required
                              type="text"
                              placeholder="home goals"
                              name="home goals"
                            />
                          </label>
                          <p>vs</p>
                          <label>
                            <input
                              required
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
                          {game.homeTeam.team} {game.homeTeamScore}vs{" "}
                          {game.awayTeam.team} {game.awayTeamScore}
                        </p>

                        <div>
                          <button
                            onClick={() => {
                              addPrediction(user, "Under 0.5", game);
                            }}
                            type="button"
                          >
                            Under 0.5
                          </button>
                          <button
                            onClick={() => {
                              addPrediction(user, "Under 1.5", game);
                            }}
                            type="button"
                          >
                            Under 1.5
                          </button>
                          <button
                            onClick={() => {
                              addPrediction(user, "Under 2.5", game);
                            }}
                            type="button"
                          >
                            Under 2.5
                          </button>

                          <button
                            onClick={() => {
                              addPrediction(user, "Over 1.5", game);
                            }}
                            type="button"
                          >
                            Over 1.5
                          </button>
                          <button
                            onClick={() => {
                              addPrediction(user, "Over 2.5", game);
                            }}
                            type="button"
                          >
                            Over 2.5
                          </button>
                          <button
                            onClick={() => {
                              addPrediction(user, "Over 3.5", game);
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
                Proceed
              </button>

              <label>
                <p>Name that will be visible when you share the challenge</p>
                <input
                  required
                  type="text"
                  placeholder="Challenge name"
                  name="challengeName"
                  onChange={(e) => setChallengeName(e.target.value)}
                />
              </label>
              <label>
                <p>How much would you like to set as stake?</p>
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
              {predictions && (
                <>
                  <ul>
                    {predictions.map((prediction, index) => (
                      <li key={index}>
                        {Object.keys(prediction).map((key) => (
                          <div key={key}>
                            <p>{key}:</p>
                            <p>{prediction[key].game}</p>
                            <p>{prediction[key].prediction}</p>
                          </div>
                        ))}
                      </li>
                    ))}
                  </ul>
                </>
              )}
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
              <button type="button" onClick={cancelChallenge}>
                Cancel
              </button>
            </div>
          )}
          {currentPage === "payment" && userDetails && (
            <>
              <button type="button" onClick={() => setCurrentPage("final")}>
                Back
              </button>
              <button type="button" onClick={giveUpChallenge}>
                Give Up
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
