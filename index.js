require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

app.post("/api/chatbot", async (req, res) => {
    try {
        const { question } = req.body;
        if (!question) return res.status(400).json({ error: "Question is required" });

        const { data, error } = await supabase.from("description").select("*");
        if (error) {
            console.error("Supabase error:", error.message);
            return res.status(500).json({ error: "Database query failed" });
        }

        const context = data.map((item) => `${item.short_desc}, ${item.description}`).join("\n");

        const response = await axios.post(
            `${process.env.AI_API_URL}key=${process.env.AI_API_KEY}`,
            {
                contents: 
                    [{ parts: 
                        [{ text: `Based on this (the context is about muhammad raihaan perdana (this website owner)): ${context}, 
                            answer this (answer the questions with the same question language and dont answer if the question is out of context from raihaan): ${question}` 
                        }] 
                }]
            }
        );

        const reply = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "I don't know.";
        res.json({ answer: reply });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Something went wrong." });
    }
});

app.get('/api/chatbot', (req, res) => {
    res.json({ message: "Chatbot API is running!" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
