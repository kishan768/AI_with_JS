import express from "express";
import dotenv from "dotenv";
import { ChatGoogle } from "@langchain/google";
import { TavilySearch } from "@langchain/tavily";
import { createAgent, tool } from "langchain";
import z, { email } from "zod";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { MessagesAnnotation, StateGraph } from "@langchain/langgraph";

dotenv.config();
const app = express();
app.use(express.json());
const PORT = process.env.PORT || 5000;

//build in tool
const tool1 = tool(
  ({ email, content }) => {
    return `Email sent successfully to ${email} with content ${content}`;
  },
  {
    name: "sent_email",
    description: "use this tool to send the email with content",
    schema: z.object({
      email: z.email(),
      content: z.string(),
    }),
  },
);

// custom tools
const tool2 = tool(
  ({ a, b }) => {
    return `addition of ${a} and ${b} is ${a + b}`;
  },
  {
    name: "addition_tool",
    description: "use for addition of two number",
    schema: z.object({
      a: z.number(),
      b: z.number(),
    }),
  },
);

const tools = [tool1, tool2];
const model = new ChatGoogle("gemini-3.5-flash-lite").bindTools(tools);

const toolNode = new ToolNode(tools);

const agent = async (state) => {
  const result = await model.invoke(state.messages);

  return {
    messages: [result],
  };
};

const shouldContinue = async (state) => {
  console.log(state);
  if (state.messages[state.messages.length - 1].tool_calls.length > 0) {
    return "tool_node";
  } else {
    return "__end__";
  }
};

const graph = new StateGraph(MessagesAnnotation)
  .addNode("agent", agent)
  .addNode("tool_node", toolNode)
  .addEdge("__start__", "agent")
  .addConditionalEdges("agent", shouldContinue)
  .addEdge("tool_node", "agent")
  .compile();

app.post("/chat", async (req, res) => {
  const { prompt } = req.body;
  const result = await graph.invoke({
    messages: [
      {
        role: "human",
        content: prompt,
      },
    ],
  });
  console.log(result.messages);
  return res.json({
    result: result.messages[result.messages.length - 1].content,
  });
});

app.listen(PORT, () => {
  console.log(`server is listening on port ${PORT}`);
});
