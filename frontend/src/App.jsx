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

  async function handleSubmit() {
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { sender: "user", text: input }]);
    setInput("");

    // Connect from frontend to backend
    const response = await fetch("http://localhost:4000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input })
    });
    const data = await response.json();
    setMessages((prev) => [...prev, { sender: "tina", text: data.reply }]);
  }
  return (
    <>
      <div className="chat-window" ref={chatWindowRef}>
        {messages.map((message, index) => {
          // Use the different className to render different style
          return <div key={index} className={message.sender === "user" ? "message user" : "message tina"}>
            {message.text}
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
