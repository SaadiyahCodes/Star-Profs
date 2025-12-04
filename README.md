This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

# Rate My Professor

An AI-powered search tool that helps students find the best professors based on natural language queries and a knowledge base (RAG).  
Users can ask questions like:

- "Who is the best calculus professor?"
- "Which professor explains concepts clearly?"
- "Who is good for easy grading?"

The system retrieves real review data stored currently in a JSON file embedded in Pinecone, and uses an LLM to generate ranked professor recommendations.

---

### Features

✅ Natural-language professor search

✅ Top 3 ranked professor recommendations per query

✅ Review summarization using AI

✅ Follow-up questions on individual professors

✅ Retrieval-Augmented Generation (RAG) pipeline

---

### Tech Stack

**Frontend**
- Next.js / React
- Tailwind CSS

**Backend**
- Node.js
- Vector database (Pinecone)
- RAG pipeline for semantic search

**AI**
- Openrouter API LLM responses (llama-3.3-70b-instruct:free)
- Gemini embeddings model for document retrieval (text-embedding-004)

---

### DEMO
Get started

<img width="557" height="431" alt="image" src="https://github.com/user-attachments/assets/5d2fa793-8942-4da7-b1ba-700a042768dc" />


Ask questions and follow-ups

<img width="561" height="438" alt="image" src="https://github.com/user-attachments/assets/36debb06-fed4-44a3-92de-0f5774e529d1" />

<img width="561" height="409" alt="image" src="https://github.com/user-attachments/assets/0e994738-e101-4deb-9687-7f96c0d40246" />



---

### Requirements

Make sure you have:

- Node.js v18+
- NPM or Yarn
- OpenRouter, Gemini Google Studio, Pinecone accounts and API Key

---

### Setup Instructions

#### 1. Clone the repository

#### 2. Open terminal in project directory and run:
```bash
npm run dev
```

