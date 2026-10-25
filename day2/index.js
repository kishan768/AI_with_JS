import { configDotenv } from "dotenv";
import { stdin as input, stdout as output } from "node:process";
import readline from "node:readline/promises";
import { OpenAI } from "openai/client.js";
configDotenv();

// create client
const client = new OpenAI({
  baseURL: process.env.BASE_URL,
  apiKey: process.env.API_KEY,
});

// for getting terminal input

const rl = readline.createInterface({ input, output });

console.log("=".repeat(40));
console.log("   My AI Assistant");
console.log("=".repeat(40));

let messages = [];
async function runAssistant() {
  while (true) {
    const userInput = await rl.question("\nYOU : ");
    messages.push({
      role: "user",
      content: userInput,
    });
    if (userInput.trim().toLowerCase() === "quit") {
      console.log("\nAI  : Goodbye! Have a great day.");
      rl.close();
      break;
    }

    try {
      const resp = await client.chat.completions.create({
        model: process.env.MODEL,
        messages: messages,
      });
      messages.push({
        role: "user",
        content: resp.choices[0].message.content,
      });
      console.log("\nAI: ", resp.choices[0].message.content);
    } catch (error) {
      console.log("\n Error: ", error.message);
    }
  }
}

runAssistant();
