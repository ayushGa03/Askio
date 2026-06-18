// this tool will search the web and provide the data to the agent to answer the question of the user
import {tavily} from "@tavily/core";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "../.env") });
import { tool } from "@langchain/core/tools";
import { z } from "zod";

const SearchWebOnline = tool(
  async ({ query }) => {
    const tvly = tavily({
      apiKey: process.env.TAVVILY_API_KEY
    });
console.log("Tavvily Client Initialized:")
    const response = await tvly.search(query);
// console.log("Tavvily Search Response:", response);
// console.log(`the respose from the online ${response.results[0].content}`)
// console.log(response)
   return response.results[0].content;
//       .map(
//         r => `
// Title: ${r.title}
// Content: ${r.content}
// Source: ${r.url}
// `
//       )
//       .join("\n\n");
  },
  {
    name: "search_web",
    description: "Search the internet for information",
    schema: z.object({
      query: z.string()
    })
  }
);


// this line is just for testing the tool and to check if it is working or not, you can remove it later
// const result = await SearchWebOnline.invoke({

//   query: "what is the date today?"
// });

// console.log(result);

export default SearchWebOnline;