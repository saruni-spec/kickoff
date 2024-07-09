import React, { useState } from "react";
import axios from "axios";

const MpesaPayment: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const authResponse = await axios.get("/.netlify/functions/mpesaAuth");
      const accessToken = authResponse.data.accessToken;

      const paymentResponse = await axios.post(
        "/.netlify/functions/mpesaSTKPush",
        { phoneNumber, amount },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      setResult(JSON.stringify(paymentResponse.data, null, 2));
    } catch (error) {
      setResult("Error: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>M-Pesa Payment</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="Phone Number"
          required
        />
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount"
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Processing..." : "Pay"}
        </button>
      </form>
      {result && <pre>{result}</pre>}
    </div>
  );
};

export default MpesaPayment;
