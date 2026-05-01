import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export interface VerificationResult {
  valid: boolean;
  reason: string;
}

/**
 * Verifies a task proof photo using Gemini AI.
 * @param taskTitle The title of the task (e.g. "Go to the Gym")
 * @param imageBase64 The base64 encoded image data
 * @returns Verification result with validity and reason
 */
export const verifyTaskProof = async (
  taskTitle: string,
  imageBase64: string
): Promise<VerificationResult> => {
  try {
    const prompt = `
      You are the AI judge for a gamified life app called ClimbIRL. 
      Your job is to verify if a user has actually completed their task based on a photo proof they provided.
      
      Task: "${taskTitle}"
      
      Instructions:
      1. Analyze the image and determine if it shows evidence of the task being completed.
      2. If the task is vague, be reasonably lenient but look for relevant context.
      3. Respond strictly in JSON format:
         {
           "valid": boolean,
           "reason": "Short explanation of why it is valid or invalid"
         }
    `;

    // Remove data:image/jpeg;base64, prefix if present
    const base64Data = imageBase64.split(",").pop() || imageBase64;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg",
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from the response (sometimes Gemini wraps it in markdown blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as VerificationResult;
    }

    return {
      valid: false,
      reason: "Could not parse AI response",
    };
  } catch (error) {
    console.error("Gemini Verification Error:", error);
    return {
      valid: false,
      reason: "AI Verification service failed",
    };
  }
};
