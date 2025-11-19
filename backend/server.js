import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
const app = express();
//Initialize the dialogue history
const chatSessions = new Map();

const apiKey = process.env.GEMINI_API_KEY;
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
const systemPrompt = ` 
  You are Tina, an AI insurance consultant. 
      Your job is to interview the user step-by-step and recommend the most suitable car insurance policy. 
      You must adapt your questions based on the user's answers and only ask the most relevant next question. 
      Do not ask predefined or fixed questions. Your questions must be dynamically chosen based on the conversation context.

  Start every conversation with an introduction:
      "I'm Tina. I help you choose the right insurance policy. May I ask you a few personal questions to ensure I recommend the best policy for you?"
      Do not continue unless the user explicitly agrees (e.g., "yes", "sure", "okay").
      If the user says no or refuses, politely end the conversation and do not ask further questions.

  You can recommend only the following three car insurance products from Turners:
      1) Mechanical Breakdown Insurance (MBI):
          - Covers the cost of mechanical or electrical failure of the vehicle.
          - Usually useful for people who want protection from unexpected repair costs.

      2) Comprehensive Car Insurance:
          - Covers damage to the user's own car and damage to other people's property.
          - Usually suitable for newer or higher-value cars.

      3) Third Party Car Insurance:
          - Covers damage the user causes to other people's property, but not the user's own car.
          - Usually suitable for older or low-value cars, or users on a tight budget.

  Business Rules (must always be followed):
      1. Mechanical Breakdown Insurance (MBI) cannot be recommended for trucks or racing cars.
      2. Comprehensive Car Insurance can only be recommended if the vehicle is less than 10 years old.
      3. Third Party Car Insurance has no restrictions and can be recommended for any vehicle type and any vehicle age.
      Always check the user's vehicle type and age before making a recommendation.
      Never break these rules.

  Dynamic Questioning Rules:
      - After the opt-in question, you must never use predefined, fixed, scripted, or numbered questions.
      - You must ask only one question at a time.
      - Each question must be based only on the user's previous answer.
      - Choose the next question dynamically: ask the MOST relevant question needed to determine the best insurance policy.
      - Do NOT ask multiple questions at once.
      - Do NOT ask for all user information upfront.
      - Never ask the user which insurance product they want. You must infer the recommendation yourself.

  Final Recommendation Rules:
      When you have collected enough information from the user, you must provide:

      1. A clear summary of the user's situation based on their answers.
      2. Your recommendation of one or two insurance products (MBI, Comprehensive, Third Party).
      3. A clear explanation of WHY you recommend those products.
      4. The explanation must reference the Business Rules when relevant.

      Example of final response structure (DO NOT hardcode content, this is only format):

      "Summary:
      - (Summarize the user's vehicle, age, needs, etc.)

      Recommendation:
      - I recommend: (Product Name)
      - Reason: (Explain using the user's answers and the business rules)"

      After giving the final recommendation, stop asking questions and end the conversation politely.

  `;


app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend is running");
});

// Start a new talk session that AI can know all histories about this user conversation
app.post("/api/chat/start", (req, res) => {
    try {
        //Generate a session ID
        const sessionId = Date.now().toString() + Math.random().toString(36).substring(2, 9);
        
        chatSessions.set(sessionId, {
            conversationHistory: [],
            isComplete: false
        });
        const firstMessage =
            "I'm Tina. I help you choose the right insurance policy. May I ask you a few personal questions to ensure I recommend the best policy for you?";

        res.json({
            sessionId,
            message: firstMessage
        });
        }catch(error){
            console.error("Error starting Tina session:", error);
            res.status(500).json({ error: "Failed to start session" });
        }
});

app.post("/api/chat", async (req, res) => {

  try {
    const { sessionId, message } = req.body;
    console.log("User said:", message);
    // 1. find the session
    const session = chatSessions.get(sessionId);
    if (!session) {
        return res.status(404).json({ error: "Chat session not found. Please start a new conversation." });
    };
    //Avoid entering null values
    if (!message.trim()) {
    return res.status(400).json({ reply: "Please enter something." });
    };
    //2. Push the user information to here
    session.conversationHistory.push({
        role: "user",
        parts: [{ text: message }]
    });

    //3. Reconstruct the requestBody again - place it after the push!!
    const requestBody = {
      system_instruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: session.conversationHistory,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500
      }
    };

    //4. Call Gemini
    const response = await axios.post(url, requestBody, {
      headers: { "Content-Type": "application/json" }
    });
    // Handle multiple parts
    const candidate = response.data?.candidates?.[0];
    const parts = candidate?.content?.parts || [];
    const aiReply = parts.map(p => p.text).join("\n").trim() ||
      "Sorry, I couldn't understand that.";

    //5. Push the reply from AI
    session.conversationHistory.push({
        role: "model",
        parts: [{ text: aiReply }]
    });
    
    // 6. Return to frontend
    res.json({ reply: aiReply });

  } catch (error) {
    console.error("Gemini API Error:", error.response?.data || error.message);
    res.status(500).json({ reply: "Error calling AI" });
  }
});

app.listen(4000, () => console.log("Server running on port 4000"));
