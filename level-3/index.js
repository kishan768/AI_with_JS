import express from "express";
import dotenv from "dotenv";
import z, { email } from "zod";
import { ChatGroq } from "@langchain/groq";
import { StateSchema, interrupt, Command } from "@langchain/langgraph";
import { StateGraph, MemorySaver } from "@langchain/langgraph";
import { randomUUID } from "node:crypto";
dotenv.config();
const app = express();
app.use(express.json());
const PORT = process.env.PORT || 5000;

const checkpointer = new MemorySaver();

//build in tool
// const tool1 = tool(
//   ({ email, content }) => {
//     return `Email sent successfully to ${email} with content ${content}`;
//   },
//   {
//     name: "sent_email",
//     description: "use this tool to send the email with content",
//     schema: z.object({
//       email: z.email(),
//       content: z.string(),
//     }),
//   },
// );

// custom tools
// const tool2 = tool(
//   ({ a, b }) => {
//     return `addition of ${a} and ${b} is ${a + b}`;
//   },
//   {
//     name: "addition_tool",
//     description: "use for addition of two number",
//     schema: z.object({
//       a: z.number(),
//       b: z.number(),
//     }),
//   },
// );

// const tools = [tool1, tool2];
// const model = new ChatGoogle("gemini-3.5-flash-lite").bindTools(tools);

// const toolNode = new ToolNode(tools);

// const agent = async (state) => {
//   const result = await model.invoke(state.messages);

//   return {
//     messages: [result],
//   };
// };

// const shouldContinue = async (state) => {
//   console.log(state);
//   if (state.messages[state.messages.length - 1].tool_calls.length > 0) {
//     return "tool_node";
//   } else {
//     return "__end__";
//   }
// };

// const graph = new StateGraph(MessagesAnnotation)
//   .addNode("agent", agent)
//   .addNode("tool_node", toolNode)
//   .addEdge("__start__", "agent")
//   .addConditionalEdges("agent", shouldContinue)
//   .addEdge("tool_node", "agent")
//   .compile({ checkpointer });

// app.post("/chat", async (req, res) => {
//   const { prompt } = req.body;
//   const result = await graph.invoke(
//     {
//       messages: [
//         {
//           role: "human",
//           content: prompt,
//         },
//       ],
//     },
//     {
//       configurable: { thread_id: "1" },
//     },
//   );
//   console.log(result.messages);
//   return res.json({
//     result: result.messages[result.messages.length - 1].content,
//   });
// });

//custom state
const customState = new StateSchema({
  prompt: z.string(),
  approvalRequires: z.boolean(),
  aiResponse: z.string(),
  approved: z.boolean(),
  result: z.string(),
});

const model = new ChatGroq({
  model: "openai/gpt-oss-120b",
  temperature: 0.7,
});

const agent = async (state) => {
  const result = await model.invoke([
    {
      role: "system",
      content: `you are a helpfull assistant.
        
        If the user is greeting or asking a normal question,
        respond normally and set approvalRequires to false.

        If the request require a sensitivity external action,
        such as sending a email or deleting a file ,
        set approvalRequires to true.

        return JSON with:
        {
        "response":"your response",
        "approvalRequires":true or false
        }
        `,
    },
    {
      role: "human",
      content: state.prompt,
    },
  ]);

  const parsed = JSON.parse(result.content);
  return {
    aiResponse: parsed.response,
    approvalRequires: parsed.approvalRequires,
  };
};
const approvalNode = (state) => {
  // console.log(customState);
  const answer = interrupt({
    message: "Do you approve this action?",
    prompt: state.prompt,
    aiResponse: state.aiResponse,
  });

  return {
    approved: String(answer).trim().toLowerCase() === "yes",
  };
};
const actionNode = (state) => {
  const output = state.approved
    ? `action approved `
    : `action rejected by human `;

  return {
    result: output,
  };
};

const shouldContinue = (state) => {
  if (state.approvalRequires) {
    return "approval";
  } else {
    return "__end__";
  }
};

// create langgraph and connect all

const graph = new StateGraph(customState)
  .addNode("agent", agent)
  .addNode("approval", approvalNode)
  .addNode("action", actionNode)
  .addEdge("__start__", "agent")
  .addConditionalEdges("agent", shouldContinue)
  .addEdge("approval", "action")
  .addEdge("action", "__end__")
  .compile({ checkpointer }); //checkpointer for memory

app.post("/chat", async (req, res) => {
  const { prompt } = req.body;
  const threadId = randomUUID();
  //invoke graph
  const result = await graph.invoke(
    {
      prompt,
    },
    {
      configurable: { thread_id: threadId },
    },
  );

  return res.json({
    threadId,
    result: result.result,
    ai: result.aiResponse,
  });
});

app.post("/chat/resume", async (req, res) => {
  const { threadId, answer } = req.body;
  //invoke graph
  const result = await graph.invoke(
    new Command({
      resume: String(answer),
    }),
    {
      configurable: { thread_id: threadId },
    },
  );

  return res.json({
    threadId,
    result: result.result,
  });
});

app.listen(PORT, () => {
  console.log(`server is listening on port ${PORT}`);
});
