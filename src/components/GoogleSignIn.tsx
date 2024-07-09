import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../pages/firebase";
import "../styles/google-button.css";
import { useNavigate } from "react-router-dom";

interface GoogleSignInProps {
  agree: boolean;
}

const GoogleSignInButton: React.FC<GoogleSignInProps> = ({ agree }) => {
  const provider = new GoogleAuthProvider();
  const navigate = useNavigate();

  const handleSignIn = async (agree: boolean) => {
    if (agree) {
      try {
        await signInWithPopup(auth, provider);
        navigate("/");
      } catch (error) {
        console.error("Error signing in:", error);
        alert("Error signing in");
      }
    } else {
      alert("Agree to terms and conditions");
    }
  };

  return (
    <button
      type="button"
      className="google-button"
      onClick={() => handleSignIn(agree)}
    >
      Sign in with Google
    </button>
  );
};

export default GoogleSignInButton;
