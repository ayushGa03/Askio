import { stdin as input, stdout as output } from "process";
import { createAgent, HumanMessage } from "langchain";
import emailTool from "./tool.js";
// import { ChatMistralAI } from "@langchain/mistralai";
import SearchWebOnline from "./TavvilyTool.js";
import { createInterface } from "readline/promises";
import { pathToFileURL, fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { config } from "dotenv";

// Load .env from the project root (one level up from readline/)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, "../.env") });

// Color codes (defined early for error messages)
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  bgBlue: "\x1b[44m",
  bgCyan: "\x1b[46m"
};

// readline setup - moved into runInteractiveAgent to avoid TTY requirement when importing
let rl;
let model;
let agent;

// this is to rember the message history of the conversation
let message = [];

// main function
async function runInteractiveAgent(question) {
  // Re-initialize message history for each session
  message = [];
  
  // Check TTY again before creating readline
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    console.error(`${colors.red}❌ Error: This script requires an interactive terminal (TTY).${colors.reset}`);
    console.error(`${colors.yellow}Please run directly in a terminal: node readline/index.js${colors.reset}`);
    process.exit(1);
  }
  
  // Initialize Mistral model only when needed
  if (!model) {
    model = new ChatMistralAI({
      model: "mistral-large-latest",
      apiKey: process.env.MISTRAL_API_KEY,
    });
  }
  
  // Initialize agent only when needed
  if (!agent) {
    agent = createAgent({
      model,
      tools: [emailTool, SearchWebOnline]
    });
  }
  
  // Create readline interface for this session
  rl = createInterface({
    input,
    output
  });

  while (true) {

      const question = await rl.question(`${question}${colors.cyan}You: ${colors.reset}`);

      if (question.toLowerCase() === 'exit') {
        console.log(`\n${colors.green}✓ Goodbye!${colors.reset}\n`);
        break;
      }
      
message.push(new HumanMessage(question));// ek bar user ka message push kar diya
      // const response = await llm.invoke(message);
      // after creating the agent i am invoking the agent instead of directly invoking the llm because now the agent will decide which tool to use and how to use it based on the user input and the message history
      const response = await agent.invoke({
      messages: message, // message history pass kar diya agent ko taki agent ko pata chale ki pehle kya kya bola gaya hai aur uske hisab se hi response de
      });
      message.push( response.messages[response.messages.length - 1]);// jo ai ne response diya usko bhi push kar diya result input+ai response dono message array me hai

      // Extract text from response
      // const text =JSON.stringify(response.messages[response.messages.length - 1].text);
      const text =response.messages[response.messages.length - 1].text;

      // Format and display the response
      console.log(`\n${colors.blue}${colors.bright}${"─".repeat(50)}${colors.reset}`);
      console.log(`${colors.magenta}${colors.bright}🤖 MistralAI:${colors.reset}`);
      console.log(`${colors.blue}${colors.bright}${"─".repeat(50)}${colors.reset}`);
      console.log(`${colors.green}${text}${colors.reset}`);
      console.log(`${colors.blue}${colors.bright}${"─".repeat(50)}${colors.reset}\n`);
  }
  rl.close();
}

// Only run interactively if this file is executed directly
const currentFile = pathToFileURL(process.argv[1]).href;
if (import.meta.url === currentFile || process.argv[1].includes('index.js')) {
  runInteractiveAgent().catch(err => {
    console.error(`${colors.red}Error in interactive agent:${colors.reset}`, err.message);
    process.exit(1);
  });
}

// Export for use as a module (agent will be initialized on first run)
function getAgent() { return agent; }
function getModel() { return model; }
export { getAgent as agent, getModel as model, runInteractiveAgent };
