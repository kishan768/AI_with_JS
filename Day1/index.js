import OpenAI from "openai";
import dotenv from "dotenv";
import express from "express";
import { GoogleGenAI } from "@google/genai";
// import { initChatModel } from "langchain";
import { ChatGoogle } from "@langchain/google/node";
import { ChatGroq } from "@langchain/groq";

dotenv.config();

const PORT = process.env.PORT || 5000;

const app = express();

app.use(express.json());

const ai = new GoogleGenAI({});

// const main = async () => {
//   const response = await ai.interactions.create({
//     model: "gemini-3.5-flash-lite",
//     input: "what is gen ai",
//   });
// };

// app.post("/chat", async (req, res) => {
//   const { prompt } = req.body;
//   try {
//     const result = await ai.interactions.create({
//       model: "gemini-3.5-flash-lite",
//       input: prompt,
//     });

//     return res.json({ result: result?.output_text });
//   } catch (error) {
//     console.log(error);
//     res.json({ error: "An error occurred while processing the request." });
//   }
// });

// langchain

app.post("/chat", async (req, res) => {
  const { prompt } = req.body;
  try {
    const model = new ChatGroq({
      model: "openai/gpt-oss-120b",
      //   apiKey: process.env.GOOGLE_API_KEY,
      temperature: 0.7,
      //   maxOutputTokens: 100,
    });
    const response = await model.invoke([
      {
        role: "system",
        content:
          "You are a math teacher.only answer match related questions.say sorry that are not related to math.",
      },
      {
        role: "human",
        content: prompt,
      },
    ]);
    res.json({ result: response.content });
  } catch (error) {
    console.log(error);
    res.json({ error: "An error occurred while processing the request." });
  }
});
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
