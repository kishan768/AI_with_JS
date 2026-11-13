import dotenv from "dotenv";
import express from "express";
import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";

import { ChatGroq } from "@langchain/groq";

dotenv.config();

const PORT = process.env.PORT || 5000;

const app = express();

app.use(express.json());

const client = new Client({
  name: "client",
  version: "1.0.0",
});

const model = new ChatGroq({
  model: "openai/gpt-oss-120b",
  temperature: 0.7,
});
async function start() {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ["server.js"],
  });
  await client.connect(transport);

  const tools = (await client.listTools()).tools;
  const modelWithTools = model.bindTools(
    tools.map((tool) => ({
      type: "function",
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema,
      },
    })),
  );

  app.post("/chat", async (req, res) => {
    const { prompt } = req.body;
    try {
      const response = await modelWithTools.invoke([
        // {
        //   role: "system",
        //   content:
        //     "You are a math teacher.only answer match related questions.say sorry that are not related to math.",
        // },
        {
          role: "human",
          content: prompt,
        },
      ]);
      if (response.tool_calls.length) {
        const tools = response.tool_calls[0];
        const result = await client.callTool({
          name: tools.name,
          arguments: tools.args,
        });
        res.json({ result: result.content[0].text });
      }
      res.json({ result: response.content });
    } catch (error) {
      console.log(error);
      res.json({ error: "An error occurred while processing the request." });
    }
  });
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

start();
