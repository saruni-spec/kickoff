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
}

interface LeaguesProps {
  name: string;
  id: string;
  members: userDetails[];
  owner: userDetails;
  leagueType: string;
  status: boolean;
  challenges: Challenge[];
}

const Leagues = () => {
  return <div></div>;
};

export default Leagues;
