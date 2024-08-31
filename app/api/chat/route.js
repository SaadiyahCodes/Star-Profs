import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

const systemPrompt = `
You are an intelligent assistant for a "Rate My Professor" search system designed to help students find the most suitable professors based on their queries. Your task is to understand the user's question and provide the top 3 professors that best match their request.

For each user query, follow these steps:

1. **Understand the Query:** Carefully read and analyze the user's query to understand their specific needs or criteria for finding a professor.

2. **Retrieve Relevant Professors:** Use retrieval-augmented generation (RAG) to search through the database of professor reviews and identify the most relevant professors based on the user's query.

3. **Rank Professors:** Rank the retrieved professors based on their relevance to the query. Consider factors such as the quality of reviews, ratings, and the match between the professor’s subject expertise and the user’s request.

4. **Provide Top Recommendations:** Present the top 3 professors to the user. For each professor, include the following details:
   - **Name:** The professor's name.
   - **Subject:** The subject the professor teaches.
   - **Rating:** The average rating given by students.
   - **Review Summary:** A brief summary of the most relevant review highlighting why this professor is a good fit based on the query.

5. **Be Clear and Concise:** Ensure that the information is presented in a clear and concise manner. If necessary, include brief explanations of why each professor was selected as a top recommendation.

Here is an example format for your response:
- **Professor Name:** Dr. Jane Doe
  - **Subject:** Mathematics
  - **Rating:** 4.5
  - **Review Summary:** "Dr. Doe is known for her clear explanations and engaging teaching style, making complex topics easier to understand."

- **Professor Name:** Dr. John Smith
  - **Subject:** Physics
  - **Rating:** 4.7
  - **Review Summary:** "Dr. Smith's practical examples and interactive lectures help students grasp difficult concepts effectively."

- **Professor Name:** Dr. Emily Johnson
  - **Subject:** Chemistry
  - **Rating:** 4.3
  - **Review Summary:** "Dr. Johnson provides in-depth knowledge and is highly approachable for students needing extra help."

Always ensure that the recommendations are tailored to the user's query and provide the most relevant and helpful information possible.
`
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function getEmbeddingsFromGemini(text) {
    try {
        const model = genAI.getGenerativeModel({model: "text-embedding-004"});
        const result = await model.embedContent(text);
        return result.embedding.values;
    } catch (error) {
        console.error("error fetching embeddings from gemini: ", error);
        throw error;
    }
}

export async function POST(req) {
    try {
        const data = await req.json();
        console.log('Received data:', data);

        const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
        const index = pc.index('rag').namespace('ns1');

        const text = data[data.length - 1].content;
        console.log('Query text:', text);

        // Get embedding
        const embedding = await getEmbeddingsFromGemini(text);
        console.log('Embedding:', embedding);

        if (!embedding) {
            throw new Error('Embedding is undefined. Cannot proceed with Pinecone query.');
        }        

        // Query Pinecone
        const results = await index.query({
            topK: 3,
            includeMetadata: true,
            vector: embedding
        });
        console.log('Pinecone results:', results);

        // Process results and send to OpenRouter
        let resultString = "\n\nReturned results from vector db:";
        results.matches.forEach((match) => {
            resultString += `\n
            Professor: ${match.metadata.id}
            Review: ${match.metadata.review}
            Subject: ${match.metadata.subject}
            Stars: ${match.metadata.stars}
            \n\n
            `;
        });

        const lastMessage = data[data.length - 1];
        const lastMessageContent = lastMessage.content + resultString;
        const lastDataWithoutLastMessage = data.slice(0, data.length - 1);

        const openai = new OpenAI({
            baseURL: "https://openrouter.ai/api/v1",
            apiKey: process.env.OPENROUTER_API_KEY,
        })

        const completion = await openai.chat.completions.create({
            model: 'meta-llama/llama-3.1-8b-instruct:free',
            messages: [
                { role: 'system', content: systemPrompt },
                ...lastDataWithoutLastMessage,
                { role: 'user', content: lastMessageContent }
            ],
            stream: true
        });
        
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of completion) {
                        const content = chunk.choices[0]?.delta?.content;
                        if (content) {
                            const text = new TextEncoder().encode(content);
                            controller.enqueue(text);
                        }
                    }
                } catch (err) {
                    console.error('Error processing completion:', err);
                    controller.error(err);
                } finally {
                    controller.close();
                }
            }
        });
        
        return new NextResponse(stream);        

    } catch (err) {
        console.error('Error in POST handler:', err);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}



