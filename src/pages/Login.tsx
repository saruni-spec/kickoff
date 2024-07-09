import { auth } from "./firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import "../styles/login.css";
import GoogleSignInButton from "../components/GoogleSignIn";

import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [agree, setAgree] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // User is signed in, handle success (optional)
      navigate("/");
    } catch (error) {
      alert("Invalid email or password. Please try again.");
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
    }
  };

  return (
    <>
      <nav>
        <ul>
          <li onClick={() => navigate("/")}>
            <p id="pageName">Kick Off Challenge</p>
          </li>

          <li onClick={() => navigate("/login")}>
            <p>Log In</p>
          </li>
        </ul>
      </nav>
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
        <GoogleSignInButton agree={agree} />
      </form>
    </>
  );
};

export default Login;
