import { useState, useRef, useEffect } from "react";
import "./App.css";

function App() {

  const chatWindowRef = useRef(null);
  
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState(null);
  
  //Use useEffect to listen for messages and scroll each time there is an update
  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages]);

   //When component loads -> start a new session
   useEffect(() => {
    async function startSession() {
      const response = await fetch("http://localhost:4000/api/chat/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      const data = await response.json();
      setSessionId(data.sessionId);

      // Add Tina's first greeting
      setMessages([{ sender: "tina", text: data.message }]);
    }

    startSession();
   }, []);

  async function handleSubmit() {
    if (!input.trim() || !sessionId) return;

    // Add user's message to UI
    setMessages((prev) => [...prev, { sender: "user", text: input }]);

    const userMessage = input;
    setInput("");

    // Call backend with sessionId + message
    const response = await fetch("http://localhost:4000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, message: userMessage })
    });
    const data = await response.json();

    //Add AI reply
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
