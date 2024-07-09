type MessageBoxProps = {
  message: string;
  onClose: () => void;
};

const MessageBox: React.FC<MessageBoxProps> = ({ message, onClose }) => {
  return (
    <div className="message-box">
      <p>{message}</p>
      <button onClick={onClose}>Close</button>
    </div>
  );
};

export default MessageBox;
