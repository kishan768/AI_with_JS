import OpenAI from "openai";
import dotenv from "dotenv";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
// Load configuration from the .env file
dotenv.config();

// Create AI client
const client = new OpenAI({
  baseURL: process.env.BASE_URL,
  apiKey: process.env.API_KEY,
});
// Create readline interface for terminal input
const rl = readline.createInterface({ input, output });

console.log("=".repeat(40));
console.log("      My AI Assistant");
console.log("=".repeat(40));
async function runAssistant() {
  while (true) {
    const userInput = await rl.question("\nYou : ");

    if (userInput.trim().toLowerCase() === "quit") {
      console.log("\nAI  : Goodbye! Have a great day.");
      rl.close();
      break;
    }

    try {
      const response = await client.chat.completions.create({
        model: process.env.MODEL,
        // Must be an array of objects
        messages: [
          {
            role: "user",
            content: userInput,
          },
        ],
      });

      console.log("\nAI :", response.choices[0].message.content);
    } catch (error) {
      console.error("\nError:", error.message);
    }
  }
}

runAssistant();
