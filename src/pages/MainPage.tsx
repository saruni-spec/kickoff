import "../styles/hero.css";

const MainPage = () => {
  return (
    <>
      <header className="hero-section">
        <h1>Challenge Your Friends: Compete, Predict, Win!</h1>
        <p>Engage in friendly competition and test your sports knowledge.</p>
        <a href="/login" className="cta-button">
          Get Started
        </a>
      </header>

      <section className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps">
          <div className="step">
            <h3>1. Register</h3>
            <p>Create your account to join the fun.</p>
          </div>
          <div className="step">
            <h3>2. Invite Your Friends</h3>
            <p>Invite your friends to join and compete.</p>
          </div>
          <div className="step">
            <h3>3. Start Making Predictions</h3>
            <p>Predict game outcomes and place your stakes.</p>
          </div>
        </div>
      </section>

      <section className="rewards">
        <h2>Earn Rewards and Bragging Rights</h2>
        <p>
          Make accurate predictions to earn rewards and show off your sports
          knowledge.
        </p>
        <div className="rewards-details">
          <div className="reward-item">
            <h3>Accurate Predictions</h3>
            <p>Winner takes all</p>
          </div>
          <div className="reward-item">
            <h3>Compete with Friends</h3>
            <p>See how you rank against your friends and other users.</p>
          </div>
          <div className="reward-item">
            <h3>Bragging Rights</h3>
            <p>Show off your sports instincts and claim bragging rights.</p>
          </div>
        </div>
      </section>

      <footer className="footer">
        <p>Join Kick-Off Challenge today and start making your predictions!</p>
        <a href="/login" className="cta-button">
          Sign Up Now
        </a>
      </footer>
    </>
  );
};

export default MainPage;
