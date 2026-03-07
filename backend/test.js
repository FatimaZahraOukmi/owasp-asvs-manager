const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = "AIzaSyAU9GvCFM3hsB7HGCd4DjbOl6KUU8XqIJM";

async function test() {
  console.log("Démarrage test...");
  const genAI = new GoogleGenerativeAI(API_KEY);
  try {
    const result = await genAI
      .getGenerativeModel({ model: "gemini-2.0-flash-lite" })
      .generateContent("Bonjour");
    console.log("✅ MARCHE:", result.response.text());
  } catch (e) {
    console.log("❌ FAIL:", e.message);
  }
  console.log("Fin test.");
}

test().then(() => process.exit(0));
