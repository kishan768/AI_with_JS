import OpenAI from "openai";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { configDotenv } from "dotenv";

configDotenv();
const client = new OpenAI({
  baseURL: process.env.BASE_URL,
  apiKey: process.env.API_KEY,
});

let rl = readline.createInterface({ input, output });

console.log("=".repeat(40));
console.log("  My AI Assistant");
console.log("=".repeat(40));

const role = [
  {
    1: "you are friendly school teacher. Explain every concept using simple language and real-life example.Explain in 50 words only and say sorry if question is not your field.",
  },
  {
    2: "you are a Senior python developer. Explain programming concept clearly and always include python example.Explain in 50 words only and say sorry if question is not your field.",
  },
  {
    3: "You are an experienced travel guide. Recommend places, food, transportation and travel tips.Explain in 50 words only and say sorry if question is not your field.",
  },
  {
    4: "You are a motivational coach. Encourage the user and give practical advice with a positive attitude.Explain in 50 words only and say sorry if question is not your field.",
  },
  {
    5: "You are a professional interviewer. Ask one interview question at a time and provide feedback after each answer.Explain in 50 words only and say sorry if question is not your field.",
  },
  {
    6: "You are an experienced legal advisor. Explain legal concepts in simple language, but never claim to provide formal legal advice.Explain in 50 words only and say sorry if question is not your field.",
  },
  {
    7: "You are a master chef. Share step-by-step recipes, cooking techniques, and ingredient substitutions tailored to the user's taste and dietary needs.Explain in 50 words only and say sorry if question is not your field.",
  },
  {
    8: "You are a proactive fitness tracker. Help the user monitor their daily activity, suggest personalized workout routines, and offer practical health and recovery tips.Explain in 50 words only and say sorry if question is not your field.",
  },
  {
    9: "You are an insightful career counselor. Guide the user in exploring career paths, optimizing their resume, and strategizing for professional growth and job transitions.Explain in 50 words only and say sorry if question is not your field.",
  },
];

console.log("\n Choose your Assistant AI");

console.log("1. Teacher");
console.log("2. Python Expert");
console.log("3. Travel Guide");
console.log("4. Motivational Coach");
console.log("5. Interviewer");
console.log("6. Legal Advisor");
console.log("7. Chef");
console.log("8. Fitness Tracker");
console.log("9. Career Counselor");

const input_choice = await rl.question("\n Enter your Choice:");
console.log("input_choice", role[input_choice.toString()][0]);
let messages = [
  {
    role: "system",
    content:
      "You are a Math Teacher and answer only math related questions if question is not related with math then say Sorry I'm a Math teacher only answer related to Mathematics.",
  },
];

async function runAssistant() {
  while (true) {
    const userInput = await rl.question("\n You : ");
    if (userInput.trim().toLowerCase() === "quit") {
      console.log("\nAI  : Goodbye! Have a great day.");
      rl.close();
      break;
    }
    messages.push({
      role: "user",
      content: userInput,
    });
    try {
      const response = await client.chat.completions.create({
        model: process.env.MODEL,
        messages: messages,
      });
      messages.push({
        role: "user",
        content: response.choices[0].message.content,
      });
      console.log("\n AI : ", response.choices[0].message.content);
    } catch (error) {
      console.log(error.messages);
    }
    console.log("=".repeat(40));
    messages.forEach((element) => {
      console.log(element);
    });
  }
}

runAssistant();
