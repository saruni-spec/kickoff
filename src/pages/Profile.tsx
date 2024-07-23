import {
  collection,
  addDoc,
  getDocs,
  increment,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { auth, db } from "./firebase";
import "../styles/profile.css";
import axios from "axios";
import IntaSendButton from "../components/Intasend";
import { useNavigate } from "react-router-dom";
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

interface userDetails {
  email: string;
  phone: string;
  account: number;
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
}
interface profileProps {
  userEmail: string;
  userDetails: userDetails | null;
  joinedChallenges: Challenge[] | null;
  setUserDetails: (userDetails: userDetails | null) => void;
  setLoading: (loading: boolean) => void;
  setUser: (user: string) => void;
  setMainPage: (page: string) => void;
}

const Profile: React.FC<profileProps> = ({
  userEmail,
  userDetails,
  setUser,
  joinedChallenges,
  setUserDetails,
  setLoading,
  setMainPage,
}) => {
  const [phone, setPhone] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState(""); // Add state for withdrawal amount
  const [deposit, setDeposit] = useState(""); // Add state for deposit amount
  const [accountUpdated, setAccountUpdated] = useState(false);
  const [currentPage, setCurrentPage] = useState("profile");

  const navigate = useNavigate();

  const updateUserAccount = async (phone: string, email: string) => {
    try {
      await addDoc(collection(db, "KUsers"), {
        email: email,
        phone: phone,
        account: 0,
      });

      const newUserDetails = {
        email: email,
        phone: phone,
        account: 0,
      };
      setUserDetails(newUserDetails);
      setLoading(true);
    } catch (error) {
      console.error("Error updating user account:", error);
    }
  };

  const addPhone = (phone: string, email: string) => {
    updateUserAccount(phone, email);
  };

  const updateAmount = async (
    amount: number,
    userDetails: userDetails | null
  ) => {
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

  const handleWithdraw = async (userDetails: userDetails, amount: string) => {
    if (amount === "" || userDetails === null || userDetails === undefined) {
      alert("Please Enter Amount");
    } else {
      if (Number(amount) > Number(0.95) * Number(userDetails.account)) {
        if (
          Number(amount) === Number(userDetails.account) ||
          Number(amount) > Number(0.9) * Number(userDetails.account)
        ) {
          alert(
            "Insufficient Funds, You can only withdraw 95% of your account balance"
          );
        } else {
          alert("Insufficient Funds");
        }

        return;
      }
      const withdraw = Number(0.95) * Number(amount);
      try {
        const response = await axios.post(
          "https://uttermost-pointy-bearskin.glitch.me//api/withdraw",
          {
            email: userDetails?.email,
            phone: userDetails?.phone,
            amount: withdraw.toString(),
            narrative: "User withdrawal",
          }
        );

        console.log("Withdrawal response:", response.data);
        alert("Processing withdrawal");
        updateAmount(Number(withdrawAmount), userDetails);
      } catch (error) {
        console.error("Withdrawal error:", error);
        alert("Please try again later");
      }
    }
  };

  const logOut = () => {
    auth.signOut().then(
      () => {
        // Sign-out successful
        console.log("User signed out");
        setLoading(true);
        setUserDetails(null);
        setUser("");
        setMainPage("home");
        navigate("/");
      },
      (error) => {
        // An error happened.
        console.error("Sign out failed:", error);
      }
    );
  };

  useEffect(() => {
    if (userEmail === "" || userEmail === null || userEmail === undefined) {
      navigate("login");
    }
  }, []);

  const updateUserAccountDeposit = async (
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
      setDeposit("");
    } catch (error) {
      console.error("Error updating user account:", error);
    }
  };

  useEffect(() => {
    if (accountUpdated) {
      updateUserAccountDeposit(Number(deposit), userDetails);
    } else {
      console.log("Account not updated");
    }
  }, [accountUpdated]);

  return (
    <div className="profile">
      {userEmail === "" || userEmail === null || userEmail === undefined ? (
        <>
          <p>Login in to view profile</p>
        </>
      ) : (
        <>
          {currentPage === "profile" && <></>}
          {userDetails ? (
            <>
              <div className="profileCard">
                <h3>{userDetails.email}</h3>
                <h3>{userDetails.phone}</h3>
                <h3>Account : {userDetails.account}</h3>
              </div>

              <div>
                <div className="moneyBox">
                  <label>
                    Enter Amount to withdraw
                    <input
                      type="number"
                      placeholder="Withdraw Amount"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => handleWithdraw(userDetails, withdrawAmount)}
                  >
                    Withdraw
                  </button>
                </div>
                <div className="moneyBox">
                  <label>
                    Enter Amount to deposit
                    <input
                      type="number"
                      placeholder="Deposit Amount"
                      value={deposit}
                      onChange={(e) => setDeposit(e.target.value)}
                    />
                  </label>
                  {deposit && (
                    <IntaSendButton
                      setAccountUpdated={setAccountUpdated}
                      setCurrentPage={setCurrentPage}
                      page="profile"
                      amount={deposit}
                    />
                  )}
                </div>
              </div>
              <button type="button" onClick={logOut}>
                Log Out
              </button>

              {joinedChallenges && (
                <div>
                  <ul className="groupList">
                    {joinedChallenges.map((challenge, index) => (
                      <li key={index}>
                        <p>
                          {challenge.challenge}:{challenge.status}
                        </p>
                        <p>Stake : {challenge.stake}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <>
              <label>
                <input
                  required
                  type="text"
                  placeholder="phone Number"
                  name="phone"
                  onChange={(e) => setPhone(e.target.value)}
                />
              </label>
              <button type="button" onClick={() => addPhone(phone, userEmail)}>
                Add Phone Number
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Profile;
