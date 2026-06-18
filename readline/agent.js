import llm from "../readline/index.js";
import {createAgent} from "langchain";
import emailTool from "./tool.js";
const agent = createAgent({
llm,
tools: [emailTool],

})
export default agent;