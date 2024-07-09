import { useState } from "react";
import "../styles/alert.css";

const AlertBox = ({ message }: { message: string }) => {
  const [isVisible, setIsVisible] = useState(true);

  const closeAlert = () => setIsVisible(false);

  if (!isVisible) return null;

  return (
    <div>
      <p>{message}</p>
      <button onClick={closeAlert}>Close</button>
    </div>
  );
};

export default AlertBox;
