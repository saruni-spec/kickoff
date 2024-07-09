import { auth, db } from "./firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import "../styles/login.css";
import GoogleSignInButton from "../components/GoogleSignIn";
import { query, collection, where, getDocs } from "firebase/firestore";
import { useState } from "react";

interface UserDetails {
  email: string;
  phone: string;
  account: number;
}

interface LoginProps {
  setUserDetails: (UserDetails: UserDetails | null) => void;
  setUser: (User: string) => void;
  setCurrentPage: (page: string) => void;
  setLoading: (loading: boolean) => void;
}

const Login: React.FC<LoginProps> = ({
  setUserDetails,
  setUser,
  setCurrentPage,
  setLoading,
}) => {
  const [agree, setAgree] = useState(false);
  const handleLogin = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // User is signed in, handle success (optional)
      setUser(email);
    } catch (error) {
      alert("Invalid email or password. Please try again.");
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
    } else {
      const userDetails = querySnapshot.docs.map((doc) => doc.data());
      setUserDetails(
        userDetails[0] as {
          email: string;
          phone: string;
          account: number;
        }
      );
      setLoading(true);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = formData.get("email");
    const password = formData.get("password");
    const termsChecked = formData.get("terms") === "on";

    if (!termsChecked) {
      alert("You must agree to the terms and conditions.");
      return;
    } else {
      handleLogin(email as string, password as string);
      loadUserDetails(email as string);
    }
  };

  return (
    <form className="loginForm" onSubmit={handleSubmit}>
      <label>
        Username:
        <input required type="email" name="email" />
      </label>
      <label>
        Password:
        <input required type="password" name="password" />
      </label>

      <label id="checkBox">
        <p>I have read and agree to the Terms and Conditions</p>
        <input
          required
          type="checkbox"
          name="terms"
          onChange={() => setAgree(true)}
        />
      </label>
      <button type="submit">Login</button>
      <GoogleSignInButton setCurrentPage={setCurrentPage} agree={agree} />
    </form>
  );
};

export default Login;
