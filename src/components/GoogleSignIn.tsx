import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../pages/firebase";
import { db } from "../pages/firebase"; // Make sure to import Firestore
import { doc, setDoc, getDoc } from "firebase/firestore";
import "../styles/google-button.css";

interface GoogleSignInProps {
  setCurrentPage: (page: string) => void;
  agree: boolean;
}

const GoogleSignInButton: React.FC<GoogleSignInProps> = ({
  setCurrentPage,
  agree,
}) => {
  const provider = new GoogleAuthProvider();

  const handleSignIn = async (agree: boolean) => {
    if (agree) {
      try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        if (user.email) {
          // Check if the user document already exists
          const userDocRef = doc(db, "KUsers", user.email);
          const userDoc = await getDoc(userDocRef);

          if (!userDoc.exists()) {
            // Create a new user document if it doesn't exist
            await setDoc(userDocRef, {
              email: user.email,

              // Add any other user information you want to store
            });
          } else {
            console.log("User document already exists in Firestore");
          }
        }

        setCurrentPage("view");
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
