import { useState, useRef, useEffect } from "react";
import "./App.css";

function App() {

  const chatWindowRef = useRef(null);
  const [messages, setMessages] = useState([
    { sender: "tina", text: "Hi, I'm Tina!🥰" },
  ]);
  const [input, setInput] = useState("");
  
  //Use useEffect to listen for messages and scroll each time there is an update
  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages]);

  function handleSubmit() {
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { sender: "user", text: input }]);

    setInput("");

    setTimeout(() => {
      setMessages((prev) => [...prev, { sender: "tina", text: "Let me think..."}]);
    }, 500)
  }

  return (
    <>
      <div className="chat-window" ref={chatWindowRef}>
        {messages.map((message, index) => {
          // Use the different className to render different style
          return <div key={index} className={message.sender === "user" ? "message user" : "message tina"}>
            {message.text}
            {message.user}
                </div>;
        })}
      </div>

      <div className="input-area">
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)}/>
        <button onClick={handleSubmit}>Send</button>
      </div>
    </>
  );
}

export default App;
