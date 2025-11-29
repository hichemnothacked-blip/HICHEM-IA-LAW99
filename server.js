// Copyright ©2025 Hicham. All rights reserved.

// --- 1. Import Required Libraries ---
// We use 'express' to create the server and handle routes.
// We use 'groq-sdk' to communicate with the Groq API.
// We use 'dotenv' to securely manage our API key.
// We use 'marked' to parse markdown from the AI's response into safe HTML.
// We use 'path' and 'url' to correctly locate our index.html file.
import express from 'express';
import Groq from 'groq-sdk';
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import { marked } from 'marked';

// --- 2. Server Setup ---
const app = express();
const port = process.env.PORT || 3000; // Use port from environment or default to 3000

// Helper to get the current directory name (required for ES Modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- 3. Initialize Groq Client ---
// SECURITY: The API key is loaded from a .env file and is NOT hardcoded here.
// This keeps your key secret and safe.
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// --- PRE-STARTUP CHECK ---
// This is a critical check to ensure the server doesn't start with a fatal configuration error.
if (!process.env.GROQ_API_KEY) {
  throw new Error("FATAL ERROR: GROQ_API_KEY environment variable is not set.");
}

// --- 4. Middleware ---
// This tells Express to automatically handle JSON data in requests.
app.use(express.json());

// --- 5. Define Routes ---

// This route serves your main 'index.html' page when someone visits your website.
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// This is the API endpoint that your frontend calls.
app.post('/ask', async (req, res) => {
  try {
    const { question, imageUrl } = req.body;

    // Groq does not support images, so we check for that.
    if (imageUrl) {
      return res.status(400).json({ error: 'Image processing is not supported.' });
    }

    if (!question) {
      return res.status(400).json({ error: 'A question is required.' });
    }

    const model = 'llama-3.1-8b-instant'; // Use the latest fast Llama 3.1 model from Groq
    const messages = [
      { role: 'system', content: 'You are a helpful legal assistant. Provide clear, concise, and accurate information. Your answers should be in the same language as the user\'s question (English, French, or Arabic).' },
      { role: 'user', content: question },
    ];

    // Send the user's question to the Groq API
    const completion = await groq.chat.completions.create({
      model: model,
      messages: messages,
    });

    const rawAnswer = completion.choices[0].message.content;

    // Parse the markdown response into HTML to handle code blocks and formatting safely
    const answer = marked.parse(rawAnswer);

    // Send the AI's answer back to the frontend
    res.json({ answer: answer });

  } catch (error) {
    console.error('Error calling Groq API:', error);
    res.status(500).json({ error: 'Failed to get a response from the AI.' });
  }
});

// --- 6. Global Error Handling Middleware ---
// This middleware will catch any errors that occur in your routes.
// It's a safety net to ensure your server always sends back a predictable JSON error.
app.use((err, req, res, next) => {
  console.error('An unexpected error occurred:', err);
  res.status(500).json({ error: 'An internal server error occurred.' });
});

// --- 6. Start the Server ---
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  console.log('Your Legal AI Assistant is ready!');
});
