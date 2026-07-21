import json
import random
from typing import List, Dict, Any, Optional
from openai import OpenAI
import google.generativeai as genai
from app.core.config import settings
from app.core.logger import logger

# Reusable prompts
SYSTEM_INTERVIEWER_PROMPT = """
You are an expert, empathetic, and professional AI Interviewer named InterviewAI.
Your goal is to conduct a highly realistic mock interview for a candidate.
Interview Type: {interview_type}
Difficulty: {difficulty}
Resume Context: {resume_context}
Job Description Context: {job_description_context}

Follow these guidelines:
1. Generate technical, behavioral, and practical questions suited for the role.
2. If this is a Coding interview, you should generate coding challenges with templates and test cases.
3. Be professional, structured, and polite.
"""

EVALUATION_PROMPT = """
You are a senior technical interviewer and communication coach.
Evaluate the following response for a mock interview:
Question: {question_text}
Candidate's Answer: {answer_text}

Provide your feedback in structured JSON format with the following fields:
- "score": Numeric value (0-100)
- "feedback": Brief constructive text critique
- "strengths": List of strings detailing what the candidate did well
- "weaknesses": List of strings detailing areas of improvement
- "suggested_answer": A high-quality model response that is brief and correct

Ensure the response is valid JSON and nothing else.
"""

REPORT_PROMPT = """
Analyze the complete transcript of the mock interview and provide a comprehensive evaluation report.
Candidate Profile Type: {interview_type}
Difficulty Level: {difficulty}

Transcript:
{transcript}

Provide the analysis strictly in JSON format matching the schema below:
{{
  "summary": "Overall assessment summary...",
  "scores": {{
    "overall": 85.0,
    "communication": 82.0,
    "technical": 88.0,
    "problem_solving": 85.0,
    "confidence": 80.0,
    "grammar": 90.0,
    "vocabulary": 85.0,
    "body_language": 80.0,
    "speaking_speed": 85.0,
    "response_quality": 86.0,
    "depth_of_knowledge": 88.0
  }},
  "strengths": ["list of key strengths"],
  "weaknesses": ["list of areas to improve"],
  "mistakes": ["specific errors or wrong assumptions made during the interview"],
  "recommended_topics": ["list of skills or concepts to review"],
  "recommended_resources": ["suggested articles, courses, or guides"],
  "actionable_improvement_plan": ["step-by-step checklist to prepare for real interviews"]
}}
Ensure the response is valid JSON and nothing else.
"""

class AIService:
    def __init__(self):
        self.openai_client = None
        self.gemini_enabled = False

        if settings.OPENAI_API_KEY:
            self.openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
            logger.info("OpenAI client initialized for AIService.")
        elif settings.GEMINI_API_KEY:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self.gemini_enabled = True
            logger.info("Gemini AI service configured.")
        else:
            logger.warning("No AI API credentials found. Operating in simulation mode.")

    def _call_llm(self, system_prompt: str, user_prompt: str, response_format_json: bool = False) -> str:
        if self.openai_client:
            try:
                response = self.openai_client.chat.completions.create(
                    model="gpt-4o",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    response_format={"type": "json_object"} if response_format_json else None,
                    temperature=0.7
                )
                return response.choices[0].message.content.strip()
            except Exception as e:
                logger.error(f"OpenAI API call failed: {e}. Falling back...")
        
        if self.gemini_enabled:
            try:
                model = genai.GenerativeModel("gemini-1.5-flash")
                chat = model.start_chat(history=[])
                full_prompt = f"{system_prompt}\n\n{user_prompt}"
                response = chat.send_message(full_prompt)
                return response.text.strip()
            except Exception as e:
                logger.error(f"Gemini API call failed: {e}. Falling back...")

        # Fallback simulated response
        return self._generate_simulated_response(system_prompt, user_prompt, response_format_json)

    async def generate_questions(
        self,
        interview_type: str,
        difficulty: str,
        resume_text: Optional[str] = None,
        job_description: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        logger.info(f"Generating questions for {interview_type} ({difficulty})...")
        system_prompt = SYSTEM_INTERVIEWER_PROMPT.format(
            interview_type=interview_type,
            difficulty=difficulty,
            resume_context=resume_text or "Not provided",
            job_description_context=job_description or "Not provided"
        )
        
        user_prompt = """
        Generate a list of exactly 5 interview questions.
        The questions must cover technical knowledge, behavioral skills, and scenario-based problem solving.
        For coding/frontend/backend/full stack, include at least one coding question with a schema containing "coding_metadata": {"title": "Problem Title", "problem_description": "...", "starter_code": {"python": "...", "javascript": "..."}, "test_cases": [{"input": "...", "expected": "..."}]}.
        Return a JSON array of objects, each object containing:
        - "id": a unique string key like "q1", "q2"
        - "text": string question content
        - "category": e.g. "technical", "coding", "behavioral", "system_design"
        - "difficulty": "easy", "medium", "hard"
        - "expected_criteria": list of strings (evaluation criteria keywords)
        - "coding_metadata": optional dict (for coding questions)
        Return ONLY the raw JSON array. Do not wrap in backticks.
        """
        
        response_str = self._call_llm(system_prompt, user_prompt, response_format_json=True)
        try:
            # clean JSON string from any codeblock wraps
            if response_str.startswith("```json"):
                response_str = response_str[7:]
            if response_str.endswith("```"):
                response_str = response_str[:-3]
            response_str = response_str.strip()
            return json.loads(response_str)
        except Exception as e:
            logger.error(f"Failed to parse AI generated questions: {e}. Returning fallback list.")
            return self._get_fallback_questions(interview_type, difficulty)

    async def generate_follow_up_question(self, question_text: str, user_answer: str) -> str:
        system_prompt = "You are a professional AI interviewer. You need to ask a brief follow-up question based on the candidate's last answer."
        user_prompt = f"Question: {question_text}\nAnswer: {user_answer}\nGenerate a single natural conversational follow-up question. Do not exceed 2 sentences."
        return self._call_llm(system_prompt, user_prompt, response_format_json=False)

    async def evaluate_response(self, question_text: str, answer_text: str) -> Dict[str, Any]:
        system_prompt = "You are an AI Interviewer evaluating answers."
        user_prompt = EVALUATION_PROMPT.format(question_text=question_text, answer_text=answer_text)
        
        response_str = self._call_llm(system_prompt, user_prompt, response_format_json=True)
        try:
            if response_str.startswith("```json"):
                response_str = response_str[7:]
            if response_str.endswith("```"):
                response_str = response_str[:-3]
            response_str = response_str.strip()
            return json.loads(response_str)
        except Exception as e:
            logger.error(f"Failed to evaluate response: {e}. Returning simulation score.")
            return {
                "score": float(random.randint(65, 88)),
                "feedback": "The response was structured reasonably but could cover more edge cases.",
                "strengths": ["Direct response", "Clear terminology"],
                "weaknesses": ["Lack of specific architectural details"],
                "suggested_answer": "In a professional setting, one should explain the trade-offs and structural implications clearly."
            }

    async def generate_final_report(self, interview_doc: Dict[str, Any]) -> Dict[str, Any]:
        logger.info(f"Generating final interview evaluation report for {interview_doc.get('_id')}...")
        
        transcript_lines = []
        for i, resp in enumerate(interview_doc.get("responses", [])):
            q_text = resp.get("question_text", "Question")
            ans = resp.get("answer_text", "")
            transcript_lines.append(f"Q{i+1}: {q_text}\nA{i+1}: {ans}")
        
        transcript = "\n\n".join(transcript_lines)
        system_prompt = "You are a senior interviewer generating a final hiring report."
        user_prompt = REPORT_PROMPT.format(
            interview_type=interview_doc.get("interview_type", "General"),
            difficulty=interview_doc.get("difficulty", "Medium"),
            transcript=transcript
        )
        
        response_str = self._call_llm(system_prompt, user_prompt, response_format_json=True)
        try:
            if response_str.startswith("```json"):
                response_str = response_str[7:]
            if response_str.endswith("```"):
                response_str = response_str[:-3]
            response_str = response_str.strip()
            report_data = json.loads(response_str)
        except Exception as e:
            logger.error(f"Failed to parse final report: {e}. Generating default score metrics.")
            report_data = self._get_fallback_report_structure()

        return report_data

    def _generate_simulated_response(self, system_prompt: str, user_prompt: str, response_format_json: bool) -> str:
        if "REPORT_PROMPT" in user_prompt or "actionable_improvement_plan" in user_prompt:
            return json.dumps(self._get_fallback_report_structure())
        elif "EVALUATION_PROMPT" in user_prompt or "suggested_answer" in user_prompt:
            return json.dumps({
                "score": float(random.randint(70, 95)),
                "feedback": "Strong vocabulary and accurate technical definition. Good communication structure.",
                "strengths": ["Demonstrates core conceptual knowledge", "Well-paced tone"],
                "weaknesses": ["Could outline practical scale limitations"],
                "suggested_answer": "A perfect response highlights both the direct theoretical implementation and practical trade-offs encountered in high-scale systems."
            })
        elif "follow-up question" in system_prompt.lower() or "follow-up" in user_prompt.lower():
            return "That's an interesting approach. How would you handle scaling that process across multiple distributed database instances?"
        else:
            # Question generation fallback
            return json.dumps(self._get_fallback_questions("Software Engineering", "Medium"))

    def _get_fallback_questions(self, interview_type: str, difficulty: str) -> List[Dict[str, Any]]:
        # Set up a generic set of mock questions
        return [
            {
                "id": "q1",
                "text": f"What are the core design principles you apply when building a modern scalable {interview_type} system?",
                "category": "technical",
                "difficulty": difficulty,
                "expected_criteria": ["coupling", "cohesion", "scalability", "microservices"]
            },
            {
                "id": "q2",
                "text": "Describe a scenario where you had a conflict with a product requirements change. How did you handle it?",
                "category": "behavioral",
                "difficulty": difficulty,
                "expected_criteria": ["collaboration", "negotiation", "empathy", "conflict resolution"]
            },
            {
                "id": "q3",
                "text": "Write a function to find the first non-repeating character in a string. Optimize for time complexity.",
                "category": "coding",
                "difficulty": difficulty,
                "expected_criteria": ["hashmap", "string traversal", "time complexity O(n)"],
                "coding_metadata": {
                    "title": "First Non-Repeating Character",
                    "problem_description": "Write a function `first_unique(s: str) -> int` that returns the 0-based index of the first non-repeating character in string `s`. If it does not exist, return -1.",
                    "starter_code": {
                        "python": "def first_unique(s: str) -> int:\n    # Write your code here\n    pass\n",
                        "javascript": "function firstUnique(s) {\n    // Write your code here\n    return -1;\n}\n",
                        "cpp": "int firstUnique(string s) {\n    // Write your code here\n    return -1;\n}\n"
                    },
                    "test_cases": [
                        {"input": "leetcode", "expected": "0"},
                        {"input": "loveleetcode", "expected": "2"},
                        {"input": "aabb", "expected": "-1"}
                    ]
                }
            },
            {
                "id": "q4",
                "text": "What is the difference between latency and throughput, and how do you optimize for both?",
                "category": "technical",
                "difficulty": difficulty,
                "expected_criteria": ["caching", "queues", "load balancing", "asynchronous tasks"]
            },
            {
                "id": "q5",
                "text": "Where do you see yourself in five years, and how does this role align with your career roadmap?",
                "category": "behavioral",
                "difficulty": difficulty,
                "expected_criteria": ["ambition", "learning path", "growth alignment", "sustainability"]
            }
        ]

    def _get_fallback_report_structure(self) -> Dict[str, Any]:
        return {
            "summary": "The candidate displayed strong technical foundations in coding and backend system architecture. Communication was clear and structured, though some behavioral responses lacked concrete examples using the STAR methodology. Performance was competitive and solid overall.",
            "scores": {
                "overall": 82.0,
                "communication": 80.0,
                "technical": 85.0,
                "problem_solving": 84.0,
                "confidence": 78.0,
                "grammar": 90.0,
                "vocabulary": 85.0,
                "body_language": 75.0,
                "speaking_speed": 82.0,
                "response_quality": 83.0,
                "depth_of_knowledge": 84.0
            },
            "strengths": [
                "Excellent grasp of Big-O notations and string array problems.",
                "Professional demeanor and concise explanation of distributed microservice architecture.",
                "Good technical grammar and vocabulary accuracy."
            ],
            "weaknesses": [
                "Behavioral answers should include concrete metrics and target results.",
                "Posture and eye-contact dropped slightly during hard coding challenges.",
                "A few moments of hesitation with filler words (e.g. 'um', 'like')."
            ],
            "mistakes": [
                "Initially overlooked empty string inputs in the coding question before corrected."
            ],
            "recommended_topics": [
                "STAR alignment for behavioral interviews",
                "Distributed consistency models (CAP Theorem, PACELC)",
                "Non-verbal interview confidence mechanics"
            ],
            "recommended_resources": [
                "Book: Cracking the Coding Interview by Gayle Laakmann McDowell",
                "Web: System Design Primer (github.com/donnemartin/system-design-primer)",
                "Article: 'The STAR Method Explained' on ResumeGenius"
            ],
            "actionable_improvement_plan": [
                "Practice writing coding solutions out loud to improve concurrent speaking speed.",
                "Structure project descriptions using: Situation, Task, Action, Result framework.",
                "Configure a steady desk height to ensure webcam posture remains neutral."
            ]
        }

ai_service = AIService()
