import {
  addDoc,
  collection,
  doc,
  getDocs,
  increment,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import { useEffect, useState } from "react";
import "../styles/challenges.css";
import IntaSendButton from "../components/Intasend";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";

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
interface GamesInterface {
  user: string;
  setMainPage: (page: string) => void;
  userDetails: userDetails | null;
  setUserDetails: (userDetails: userDetails | null) => void;
  setJoinDetails: (joinDetails: Challenge | null) => void;
  joinDetails: Challenge | null;
  joinedChallenges: Challenge[] | null;
  notJoinedChallenges: Challenge[] | null;
  setLoading: (loading: boolean) => void;
}

const Challenges: React.FC<GamesInterface> = ({
  user,
  setMainPage,
  userDetails,
  setUserDetails,
  setJoinDetails,
  joinDetails,
  joinedChallenges,
  notJoinedChallenges,
  setLoading,
}) => {
  const [currentPage, setCurrentPage] = useState("all");
  const [currentChallenge, setCurrentChallenge] = useState<Challenge>();

  const [filteredChallenges, setFilteredChallenges] = useState("others");
  const [predictions, setPredictions] = useState<Predictions[]>([]);
  const [phone, setPhone] = useState<string>("");
  const [challengeObserved, setChallengeObserved] = useState<Predictions[]>();
  const [accountUpdated, setAccountUpdated] = useState(false);

  const addPrediction = (
    user: string,
    newPredictionValue: string,
    newPredictionKey: gameDetails
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
    }
  };

  const handleScores = (
    event: React.FormEvent<HTMLFormElement>,
    game: gameDetails
  ) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const homeGoals = formData.get("home goals");
    const awayGoals = formData.get("away goals");

    addPrediction(user, `${homeGoals} vs ${awayGoals}`, game);
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

  const joinCurrentChallenge = async (
    currentChallenge: Challenge,
    userId: string,
    predictions: Predictions[]
  ) => {
    try {
      const queryBy = {
        name: currentChallenge.name,
        createdBy: currentChallenge.createdBy,
        challenge: currentChallenge.challenge,
      };

      // Create a compound query
      const challengesRef = collection(db, "challenges");
      const q = query(
        challengesRef,
        where("name", "==", queryBy.name),
        where("createdBy", "==", queryBy.createdBy),
        where("challenge", "==", queryBy.challenge)
      );

      // Execute the query
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.log("No matching document found");
        return;
      }

      // Assuming there's only one matching document
      const challengeDoc = querySnapshot.docs[0];

      // Update the document with the new prediction
      const updatedPredictions = [
        ...currentChallenge.predictions,
        ...predictions, // Add the new prediction for this user
      ];

      const updatedMembers = [...currentChallenge.members, userId];

      await updateDoc(doc(db, "challenges", challengeDoc.id), {
        predictions: updatedPredictions,
      });
      await updateDoc(doc(db, "challenges", challengeDoc.id), {
        members: updatedMembers,
      });

      alert(`You haved joined ${currentChallenge.name}`);
      setPredictions([]);
      setMainPage("view");
      setLoading(true);
    } catch (error) {
      console.error("Error adding prediction:", error);
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

  const topUpStake = async (
    currentChallenge: Challenge,
    userDetails: userDetails,

    predictions: Predictions[]
  ) => {
    if (Number(userDetails.account) >= Number(currentChallenge.stake)) {
      joinCurrentChallenge(currentChallenge, userDetails.email, predictions);
      updateAmount(Number(currentChallenge.stake), userDetails);
    } else {
      setJoinDetails(currentChallenge);
      setCurrentPage("payment");
    }
  };

  const makePayment = async (
    currentChallenge: Challenge,
    predictions: Predictions[],
    phone: string,
    userDetails: userDetails | null
  ) => {
    if (userDetails) {
      topUpStake(currentChallenge, userDetails, predictions);
    } else {
      createUserDetails(user, phone);
    }
  };

  const joinChallenge = (challenge: Challenge, user: string) => {
    if (user === "" || user === undefined) {
      setMainPage("login");
    } else {
      setCurrentPage("join");
      setCurrentChallenge(challenge);
    }
  };

  const proceedToPredictions = (predictions: Predictions[]) => {
    if (predictions.length > 0) {
      setCurrentPage("view");
    } else {
      alert("Please make a prediction first");
    }
  };

  const giveup = () => {
    setPredictions([]);
    setCurrentPage("all");
  };

  const viewThisChallenge = (challenge: Predictions[]) => {
    setChallengeObserved(challenge);
    setCurrentPage("observe");
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

  useEffect(() => {
    if (user === "" || user === undefined || user === null) {
      setMainPage("login");
    } else {
      if (accountUpdated) {
        updateUserAccount(Number(joinDetails?.stake), userDetails);
        setAccountUpdated(false);
      } else {
        console.log("account not updated");
      }
      if (joinDetails !== null) {
        setCurrentPage("view");
      } else {
        setCurrentPage("all");
      }
    }
  }, [accountUpdated]);

  return (
    <>
      {joinDetails ? (
        <>
          {currentPage === "view" && (
            <div className="viewChallenges">
              <button type="button" onClick={() => setCurrentPage("complete")}>
                Proceed
              </button>
              <button type="button" onClick={() => setCurrentPage("join")}>
                Change Predictions
              </button>

              <button type="button" onClick={giveup}>
                Give up
              </button>

              <label>
                <p>Name of the challenge</p>
                <p>{joinDetails.name}</p>
              </label>
              <label>
                <p>The Stake set in this Challenge is</p>
                <p>{joinDetails.stake} </p>
              </label>
              {predictions && (
                <>
                  <ul className="predictionsMade">
                    {predictions.map((prediction, index) => (
                      <li key={index}>
                        {Object.keys(prediction).map((key) => (
                          <div key={key} className="predictedGames">
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
                <p>{joinDetails.name}</p>
              </label>
              <label>
                <p>{joinDetails.stake}</p>
              </label>
              <label>
                {userDetails ? (
                  <p>{userDetails.phone}</p>
                ) : (
                  <input
                    type="text"
                    placeholder="phone"
                    name="phone"
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                )}
              </label>

              <button
                type="button"
                onClick={() =>
                  makePayment(joinDetails, predictions, phone, userDetails)
                }
              >
                Join
              </button>
              <button type="button" onClick={() => setCurrentPage("join")}>
                Change Predictions
              </button>
              <button type="button" onClick={giveup}>
                Give up
              </button>
            </div>
          )}
          {currentPage === "payment" && userDetails && (
            <>
              <p>Current Amount in Account : {userDetails.account}</p>
              <p>
                Deficit :{" "}
                {Number(joinDetails.stake) - Number(userDetails.account)}
              </p>

              <IntaSendButton
                amount={(
                  Number(joinDetails.stake) - Number(userDetails.account)
                ).toString()}
                setCurrentPage={setCurrentPage}
                setAccountUpdated={setAccountUpdated}
              />
            </>
          )}
        </>
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
                  <ul className="challengesList">
                    {notJoinedChallenges.map((challenge, index) => (
                      <li key={index}>
                        <p>{challenge.name}</p>
                        <p>Stake: {challenge.stake} Ksh</p>

                        <p>Type of Challenge : {challenge.challenge}</p>
                        <button
                          type="button"
                          onClick={() => joinChallenge(challenge, user)}
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
            <ul>
              {challengeObserved.map((prediction, index) => (
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
          )}
          {currentPage === "join" && currentChallenge && (
            <>
              <div className="joinChallenge">
                <p>{currentChallenge.name}</p>
                <button
                  type="button"
                  onClick={() => {
                    proceedToPredictions(predictions);
                  }}
                >
                  Proceed
                </button>
                <button type="button" onClick={giveup}>
                  Give up
                </button>
              </div>
              <ul className="challengeType">
                {currentChallenge.challenge === "WinXLoose" && (
                  <>
                    {currentChallenge.gamesInPrediction.map((game, index) => (
                      <li key={index}>
                        <p>
                          {game.homeTeam.team} {game.homeTeamScore}vs{" "}
                          {game.awayTeam.team} {game.awayTeamScore}
                        </p>
                        <p>Date: {game.date}</p>
                        <p>Time: {game.time}</p>
                        <p>Level: {game.level}</p>
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
                {currentChallenge.challenge === "ScorePredictions" && (
                  <>
                    {currentChallenge.gamesInPrediction.map((game, index) => (
                      <li key={index}>
                        <p>
                          {game.homeTeam.team} {game.homeTeamScore}vs{" "}
                          {game.awayTeam.team} {game.awayTeamScore}
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
                {currentChallenge.challenge === "TotalGoalsScored" && (
                  <>
                    {currentChallenge.gamesInPrediction.map((game, index) => (
                      <li key={index}>
                        <p>
                          {game.homeTeam.team} {game.homeTeamScore}vs{" "}
                          {game.awayTeam.team} {game.awayTeamScore}
                        </p>
                        <p>Date: {game.date}</p>
                        <p>Time: {game.time}</p>
                        <p>Level: {game.level}</p>
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
                {currentChallenge.challenge === "WhoToScore" && (
                  <>
                    {currentChallenge.gamesInPrediction.map((game, index) => (
                      <li key={index}>
                        <p>
                          {game.homeTeam.team} {game.homeTeamScore}vs{" "}
                          {game.awayTeam.team} {game.awayTeamScore}
                        </p>
                        <p>Date: {game.date}</p>
                        <p>Time: {game.time}</p>
                        <p>Level: {game.level}</p>
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

          {currentPage === "view" && currentChallenge && (
            <div className="viewChallenges">
              <button type="button" onClick={() => setCurrentPage("complete")}>
                Proceed
              </button>
              <button type="button" onClick={() => setCurrentPage("join")}>
                Change Predictions
              </button>

              <button type="button" onClick={giveup}>
                Give up
              </button>

              <label>
                <p>Name of the challenge</p>
                <p>{currentChallenge.name}</p>
              </label>
              <label>
                <p>The Stake set in this Challenge is</p>
                <p>{currentChallenge.stake} </p>
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
          {currentPage === "complete" && predictions && currentChallenge && (
            <div className="completeChallenge">
              <label>
                <p>{currentChallenge.name}</p>
              </label>
              <label>
                <p>{currentChallenge.stake}</p>
              </label>
              <label>
                {userDetails ? (
                  <p>{userDetails.phone}</p>
                ) : (
                  <input
                    required
                    type="text"
                    placeholder="phone"
                    name="phone"
                    onChange={(e) => setPhone(e.target.value)}
                  />
                )}
              </label>

              <button
                type="button"
                onClick={() =>
                  makePayment(currentChallenge, predictions, phone, userDetails)
                }
              >
                Join
              </button>
              <button type="button" onClick={() => setCurrentPage("join")}>
                Change Predictions
              </button>
              <button type="button" onClick={giveup}>
                Give up
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default Challenges;
