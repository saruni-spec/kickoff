import { useEffect, useRef } from "react";
import "intasend-inlinejs-sdk";
import { useNavigate } from "react-router-dom";

interface IntaSend {
  new (options: { publicAPIKey: string; live: boolean }): IntaSendInstance;
}

interface IntaSendInstance {
  on(
    event: "COMPLETE" | "FAILED" | "IN-PROGRESS",
    callback: (response: Response) => void
  ): IntaSendInstance;
}

interface Response {
  status: string;
  message: string;
}

declare global {
  interface Window {
    IntaSend: IntaSend;
  }
}

interface IntaSendButtonProps {
  amount: string;
  setCurrentPage: (page: string) => void;
  setAccountUpdated: (updated: boolean) => void;
  page: string;
}

const IntaSendButton = ({
  amount,
  setCurrentPage,
  setAccountUpdated,
  page,
}: IntaSendButtonProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeIntaSend = () => {
      if (window.IntaSend && buttonRef.current) {
        new window.IntaSend({
          publicAPIKey: import.meta.env.VITE_ISPUBKEY_LIVE,
          live: true,
        })
          .on("COMPLETE", (response: Response) => {
            console.log("COMPLETE:", response);
            // Instead of an alert, update your UI here
            setAccountUpdated(true);
            setCurrentPage(page);
            console.log(navigate);
            // Attempt to close IntaSend window (if it's in a popup)
            if (window.opener) {
              window.close();
            }
          })
          .on("FAILED", (response: Response) => {
            console.log("FAILED", response);
            // Instead of an alert, update your UI here
            console.log(navigate);
            setCurrentPage(page);
            // Attempt to close IntaSend window (if it's in a popup)
            if (window.opener) {
              window.close();
            }
          })
          .on("IN-PROGRESS", () => {
            console.log("INPROGRESS ...");
          });

        // Manually initialize the button
        const intaSendButton = buttonRef.current as any;
        if (intaSendButton.intaSend) {
          intaSendButton.intaSend.init();
        }
      } else {
        console.error("IntaSend not available");
      }
    };

    // Add a small delay before initializing
    const timeoutId = setTimeout(initializeIntaSend, 500);
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <div>
      <button
        ref={buttonRef}
        className="intaSendPayButton"
        data-amount={amount}
        data-currency="KES"
      >
        Top Up Account
      </button>
    </div>
  );
};

export default IntaSendButton;
