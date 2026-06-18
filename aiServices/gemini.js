import { initChatModel } from "langchain";
import { ChatMistralAI } from "@langchain/mistralai";
import {chat} from "../controllers/chat.js";
import {runInteractiveAgent} from "../readline/index.js"
// import {humanChatMessage} from "langchain/schema.js"
import {HumanMessage,SystemMessage , AIMessage} from "langchain"

process.env.GOOGLE_API_KEY = process.env.GEMENI_API_KEY;

let model 
  model = new ChatMistralAI({
      model: "mistral-large-latest",
      apiKey: process.env.MISTRAL_API_KEY,
    });
    let TiitleModelGenetaor;
    TiitleModelGenetaor = new ChatMistralAI({
        model: "mistral-small-latest",
        apiKey : process.env.MISTRAL_API_KEY,
    })
export async function generateResponse(currentMessage, previousMessages, webContext = "") {

  const history = previousMessages.map(msg => {
    if (msg.role === "userMessage") return new HumanMessage(msg.Message);
    if (msg.role === "Ai") return new AIMessage(msg.Message);
  }).filter(Boolean);

  // If web search context is provided, inject it as a system message
  if (webContext) {
    history.push(new SystemMessage(
      `You have access to the following real-time web search results. Use them to answer accurately and cite sources where appropriate.\n\n${webContext}`
    ));
  }

  history.push(new HumanMessage(currentMessage));

  const response = await model.invoke(history);
  return response.text;
}

// this function will going to generate the tittle for the chats
 export async function genTiitle(tittle) {
    const response = await TiitleModelGenetaor.invoke([
  new SystemMessage(`
You are a helpful assistant that generates concise and descriptive titles for chat conversations.

User will provide you with the first message of a chat conversation, and you will generate a title that captures the essence of the conversation in 2–4 words. The title should be clear, relevant, and engaging, giving users a quick understanding of the chat's topic.
  `),

  new HumanMessage(`
Generate a title for a chat conversation based on the following first message:

"${tittle}"
  `),
]);
    return response.text 
}

   