import { addDoc, collection } from "firebase/firestore";
import { useState } from "react";
import { db } from "./firebase";
import "../styles/addTeams.css";

const AddTeams = () => {
  const [team, setTeam] = useState("");

  const [players, setPlayers] = useState<string[]>([]);

  const takePlayers = (playersString: string) => {
    const list = playersString.replace(/[\[\]"']/g, "").split(",");

    setPlayers(list);
  };

  const addTeam = async (team: string, players: string[]) => {
    try {
      await addDoc(collection(db, "teams"), {
        team: team,
        players: players,
      });
      setTeam("");
      setPlayers([]);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="addTeams">
      <label>
        <input
          type="text"
          name="team"
          placeholder="team"
          value={team}
          onChange={(e) => setTeam(e.target.value)}
        />
      </label>
      {team !== "" && (
        <>
          <label>
            <input
              type="text"
              name="player"
              placeholder="player"
              onChange={(e) => takePlayers(e.target.value)}
            />
          </label>
        </>
      )}
      <button type="button" onClick={() => addTeam(team, players)}>
        Add Team
      </button>
    </div>
  );
};

export default AddTeams;
