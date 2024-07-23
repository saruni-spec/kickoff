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
import "../styles/createChallenge.css";
import IntaSendButton from "../components/Intasend";
import { useLocation, useNavigate } from "react-router-dom";
import LZString from "lz-string";

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
type prediction = string;
type game = string;

interface UserPrediction {
  [game: game]: prediction;
}

interface Predictions {
  [key: string]: UserPrediction;
}

interface Challenge {
  name: string;
  challenge: string;
  gamesInPrediction: GameDetails[];
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

const JoinChallenge = () => {
  const [currentPage, setCurrentPage] = useState("join");
  const [currentChallenge, setCurrentChallenge] = useState<Challenge>();
  const [userPredictions, setUserPredictions] = useState<UserPrediction | null>(
    null
  );
  const [predictions, setPredictions] = useState<Predictions | null>(null);
  const [phone, setPhone] = useState<string>("");
  const [accountUpdated, setAccountUpdated] = useState(false);
  const [user, setUser] = useState("");
  const [userDetails, setUserDetails] = useState<userDetails | null>(null);
  const [joinDetails, setJoinDetails] = useState<Challenge | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

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
  };
  const handleScores = (
    event: React.FormEvent<HTMLFormElement>,
    game: GameDetails
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
    predictions: Predictions
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
      const updatedPredictions = {
        ...currentChallenge.predictions,
        predictions, // Add the new prediction for this user
      };

      const updatedMembers = [...currentChallenge.members, userId];

      await updateDoc(doc(db, "challenges", challengeDoc.id), {
        predictions: updatedPredictions,
      });
      await updateDoc(doc(db, "challenges", challengeDoc.id), {
        members: updatedMembers,
      });

      alert(`You haved joined ${currentChallenge.name}`);
      setPredictions(null);
      navigate("/");
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

    predictions: Predictions
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
    predictions: Predictions,
    phone: string,
    userDetails: userDetails | null
  ) => {
    if (userDetails) {
      topUpStake(currentChallenge, userDetails, predictions);
    } else {
      createUserDetails(user, phone);
    }
  };

  const proceedToPredictions = (predictions: Predictions | null) => {
    if (currentChallenge && predictions) {
      if (
        Object.keys(predictions).length ===
        Object.keys(currentChallenge.predictions).length
      ) {
        setCurrentPage("view");
      } else {
        alert("Please make all predictions");
      }
    } else {
      alert("No challenge to join");
    }
  };

  const giveup = () => {
    setPredictions(null);
    navigate("/");
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

  const getCurrentChallenge = async (
    name: string,
    createdBy: string,
    date: string,
    challenge: string
  ) => {
    try {
      const challengesRef = collection(db, "challenges");
      const q = query(
        challengesRef,
        where("name", "==", name),
        where("createdBy", "==", createdBy),
        where("earliestGameDate", "==", date),
        where("challenge", "==", challenge)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.log("No matching document found");
        return;
      }

      // Assuming there's only one matching document
      const challengeDoc = querySnapshot.docs[0];
      const challengeData = challengeDoc.data();
      setCurrentChallenge(challengeData as Challenge);
    } catch (error) {
      console.error("Error getting challenge:", error);
    }
  };

  const joinChallengePage = () => {
    const searchParams = new URLSearchParams(location.search);
    const joinThisChallengeParam = searchParams.get("joinThisChallenge");
    const userEmailParam = searchParams.get("userEmail");
    const userDetailsParam = searchParams.get("userDetails");

    if (joinThisChallengeParam) {
      try {
        const challenge = JSON.parse(
          LZString.decompressFromEncodedURIComponent(joinThisChallengeParam)
        );

        console.log("Joining challenge:", challenge);
        getCurrentChallenge(
          challenge.name,
          challenge.createdBy,
          challenge.earliestGameDate,
          challenge.challenge
        );
        // Additional logic for joining the challenge
      } catch (error) {
        console.error("Error parsing challenge data:", error);
        // Handle the error (e.g., show an error message to the user)
      }
    } else {
      console.log("No challenge data in URL");
      // Handle the case where there's no challenge data in the URL
    }
    if (userEmailParam) {
      const userEmail = decodeURIComponent(userEmailParam);
      if (userEmail === "" || userEmail === undefined || userEmail === null) {
        navigate("/login");
      } else {
        setUser(userEmail);
      }
    } else {
      navigate("/login");
    }
    if (userDetailsParam) {
      console.log(userDetailsParam, "userd params");
      try {
        const userDetails = JSON.parse(decodeURIComponent(userDetailsParam));
        setUserDetails(userDetails);
      } catch (error) {
        console.log(error);
      }
    } else {
      setUserDetails(null);
    }
  };
  useEffect(() => {
    joinChallengePage();
  }, []);

  useEffect(() => {
    if (accountUpdated) {
      updateUserAccount(Number(joinDetails?.stake), userDetails);
      setAccountUpdated(false);
    } else {
      console.log("account not updated");
    }
  }, [accountUpdated]);

  return (
    <>
      <nav>
        <ul>
          <li onClick={() => navigate("/")}>
            <p id="pageName">Kick Off Challenge</p>
          </li>
          {userDetails && (
            <li>
              <p>Account : {userDetails.account}</p>
            </li>
          )}
          <li onClick={() => navigate("/login")}>
            <p>Log In</p>
          </li>
        </ul>
      </nav>
      <div className="challengePage">
        {joinDetails ? (
          <>
            {currentPage === "view" && (
              <div className="viewChallenges">
                <button
                  type="button"
                  onClick={() => setCurrentPage("complete")}
                >
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
                {userPredictions && (
                  <ul className="predictionsMade">
                    {Object.entries(userPredictions).map(
                      ([game, prediction], index) => (
                        <li key={index}>
                          <div className="predictedGames">
                            <p>
                              {game}: {prediction}
                            </p>
                          </div>
                        </li>
                      )
                    )}
                  </ul>
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
                  page="join"
                />
              </>
            )}
          </>
        ) : (
          <>
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
                {userPredictions && (
                  <ul className="predictionsMade">
                    {Object.entries(userPredictions).map(
                      ([game, prediction], index) => (
                        <li key={index}>
                          <div className="predictedGames">
                            <p>
                              {game}: {prediction}
                            </p>
                          </div>
                        </li>
                      )
                    )}
                  </ul>
                )}

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
                <button
                  type="button"
                  onClick={() => setCurrentPage("complete")}
                >
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
                {userPredictions && (
                  <ul className="predictionsMade">
                    {Object.entries(userPredictions).map(
                      ([game, prediction], index) => (
                        <li key={index}>
                          <div className="predictedGames">
                            <p>
                              {game}: {prediction}
                            </p>
                          </div>
                        </li>
                      )
                    )}
                  </ul>
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
                    makePayment(
                      currentChallenge,
                      predictions,
                      phone,
                      userDetails
                    )
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
      </div>
    </>
  );
};

export default JoinChallenge;
