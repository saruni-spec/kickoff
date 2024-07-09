import About from "./pages/About";
import Games from "./pages/Games";
import Challenges from "./pages/Challenges";
import ChooseChallenge from "./pages/ChooseChallenge";
import CreateChallenge from "./pages/CreateChallenge";

import "./styles/home.css";

import { auth, db } from "./pages/firebase";
import { getDocs, collection, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import Profile from "./pages/Profile";
import Loading from "./components/Loading";
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
  predictions: Predictions[];
  status: "active" | "closed";
  createdBy: string;
  members: string[];
  winner: string | null;
  earliestGameDate: string;
  earliestGameTime: string;
}

function Home() {
  const [currentPage, setCurrentPage] = useState("home");

  const [games, setGames] = useState<GameDetails[] | null>(null);
  const [gamesToday, setGamesToday] = useState<GameDetails[] | null>(null);
  const [gamesYesterday, setGamesYesterday] = useState<GameDetails[] | null>(
    null
  );
  const [gamesUpcoming, setGamesUpcoming] = useState<GameDetails[] | null>(
    null
  );
  const [user, setUser] = useState<string>("");
  const [userDetails, setUserDetails] = useState<userDetails | null>(null);
  const [challengeDetails, setChallengeDetails] =
    useState<ChallengeDetails | null>(null);

  const [notJoinedChallenges, setNotJoinedChallenges] = useState<Challenge[]>(
    []
  );
  const [joinedChallenges, setJoinedChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  const checkGameDates = (games: GameDetails[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const todayGames: GameDetails[] = [];
    const yesterdayGames: GameDetails[] = [];
    const upcomingGames: GameDetails[] = [];

    games.forEach((game) => {
      const gameDate = new Date(game.date);
      gameDate.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison

      if (gameDate.getTime() === today.getTime()) {
        todayGames.push(game);
      } else if (gameDate.getTime() === yesterday.getTime()) {
        yesterdayGames.push(game);
      } else if (gameDate > today) {
        upcomingGames.push(game);
      }
    });

    setGamesToday(todayGames);
    setGamesYesterday(yesterdayGames);
    setGamesUpcoming(upcomingGames);
  };

  const loadGames = async () => {
    try {
      const gamesQuery = query(collection(db, "games"));
      const gamesSnapshot = await getDocs(gamesQuery);

      const allGames: GameDetails[] = [];
      gamesSnapshot.forEach((doc) => {
        const entry = {
          gameId: doc.data().gameId,
          homeTeam: doc.data().homeTeam,
          homeTeamScore: doc.data().homeTeamScore,
          awayTeam: doc.data().awayTeam,
          awayTeamScore: doc.data().awayTeamScore,
          date: doc.data().date,
          time: doc.data().time,
          level: doc.data().level,
          played: doc.data().played,
        };
        allGames.push(entry);
      });

      setGames(allGames);
      checkGameDates(allGames);
    } catch (error) {
      console.log(error);
    }
  };

  const loadUserDetails = async (email: string | null) => {
    const userQuery = query(
      collection(db, "KUsers"),
      where("email", "==", email)
    );

    const querySnapshot = await getDocs(userQuery);

    if (querySnapshot.empty) {
      setUserDetails(null);
      console.log("user not found");
    } else {
      const userDetails = querySnapshot.docs.map((doc) => doc.data());
      setUserDetails(
        userDetails[0] as {
          email: string;
          phone: string;
          account: number;
        }
      );
      console.log("user loaded");
    }
  };

  const getFIlteredChallanges = (user: string, challenges: Challenge[]) => {
    const otherChallenges = challenges.filter(
      (challenge) => challenge.createdBy !== user
    );

    const notJoinedChallenges = otherChallenges.filter(
      (challenge) => !challenge.members.includes(user)
    );
    setNotJoinedChallenges(notJoinedChallenges);

    const userChallenges = challenges.filter(
      (challenge) => challenge.createdBy === user
    );
    const memberChallenges = challenges.filter((challenge) =>
      challenge.members.includes(user)
    );
    const allUserChallenges = [...userChallenges, ...memberChallenges];
    setJoinedChallenges(allUserChallenges);
  };

  const getChallenges = async (user: string) => {
    try {
      const now = new Date();
      const twoMinutesFromNow = new Date(now.getTime() + 2 * 60 * 1000);

      const todayFormatted = now.toISOString().split("T")[0];

      const challengesQuery = query(
        collection(db, "challenges"),
        where("earliestGameDate", ">=", todayFormatted)
      );

      const challengesSnapshot = await getDocs(challengesQuery);
      const challengesData: Challenge[] = [];

      challengesSnapshot.forEach((doc) => {
        const data = doc.data() as Challenge;

        // Parse the time correctly
        const [time, period] = data.earliestGameTime.split(" ");
        const [hours, minutes] = time.split(":");
        let gameHours = parseInt(hours);

        if (period.toLowerCase() === "pm" && gameHours !== 12) {
          gameHours += 12;
        } else if (period.toLowerCase() === "am" && gameHours === 12) {
          gameHours = 0;
        }

        const gameDateTime = new Date(
          `${data.earliestGameDate}T${gameHours
            .toString()
            .padStart(2, "0")}:${minutes}:00`
        );

        console.log(gameDateTime, "gameDateTime");

        if (gameDateTime > twoMinutesFromNow) {
          challengesData.push(data);
        }
      });

      getFIlteredChallanges(user, challengesData);
    } catch (error) {
      console.error("Error fetching challenges:", error);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        if (user) {
          if (user.email) {
            setUser(user.email);

            loadGames();

            loadUserDetails(user.email);
            getChallenges(user.email);
          }
        } else {
          loadGames();
        }
        setLoading(false);
      });

      return () => unsubscribe();
    }, 1500);

    return () => clearTimeout(timeoutId);
  }, [loading]);

  return (
    <>
      <nav>
        <ul>
          <li onClick={() => setCurrentPage("home")}>
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
      <div className="container">
        <ul className="sideMenu">
          <li
            className={currentPage === "choose" ? "selected" : ""}
            onClick={() => setCurrentPage("choose")}
          >
            Create
          </li>
          <li
            className={currentPage === "view" ? "selected" : ""}
            onClick={() => setCurrentPage("view")}
          >
            View
          </li>
          <li
            className={currentPage === "profile" ? "selected" : ""}
            onClick={() => setCurrentPage("profile")}
          >
            Profile
          </li>
          <li
            className={currentPage === "about" ? "selected" : ""}
            onClick={() => setCurrentPage("about")}
          >
            About
          </li>
        </ul>
        <div className="home-div">
          {loading ? (
            <Loading />
          ) : (
            <>
              {currentPage === "home" && games && (
                <Games
                  gamesToday={gamesToday}
                  gamesUpcoming={gamesUpcoming}
                  games={games}
                  gamesYesterday={gamesYesterday}
                />
              )}
              {currentPage === "choose" && (
                <ChooseChallenge
                  user={user}
                  setCurrentPage={setCurrentPage}
                  challengeDetails={challengeDetails}
                />
              )}
              {currentPage === "view" && (
                <Challenges
                  user={user}
                  userDetails={userDetails}
                  setMainPage={setCurrentPage}
                  joinedChallenges={joinedChallenges}
                  notJoinedChallenges={notJoinedChallenges}
                />
              )}
              {currentPage === "about" && <About />}

              {currentPage === "create" && (
                <CreateChallenge
                  user={user}
                  gamesToday={gamesToday}
                  gamesUpcoming={gamesUpcoming}
                  setMainPage={setCurrentPage}
                  userDetails={userDetails}
                  setUserDetails={setUserDetails}
                  setChallengeDetails={setChallengeDetails}
                  challengeDetails={challengeDetails}
                  setLoading={setLoading}
                />
              )}
              {currentPage === "profile" && (
                <>
                  <Profile
                    joinedChallenges={joinedChallenges}
                    userDetails={userDetails}
                    setUserDetails={setUserDetails}
                    userEmail={user}
                    setLoading={setLoading}
                    setMainPage={setCurrentPage}
                  />
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default Home;
