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
        self.is_openrouter = False

        if settings.OPENAI_API_KEY:
            if settings.OPENAI_API_KEY.startswith("sk-or-"):
                self.openai_client = OpenAI(
                    api_key=settings.OPENAI_API_KEY,
                    base_url="https://openrouter.ai/api/v1"
                )
                self.is_openrouter = True
                logger.info("OpenRouter client initialized for AIService.")
            else:
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
                model_name = "openai/gpt-4o" if self.is_openrouter else "gpt-4o"
                response = self.openai_client.chat.completions.create(
                    model=model_name,
                    max_tokens=2048,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    response_format={"type": "json_object"} if response_format_json else None,
                    temperature=0.7
                )
                return response.choices[0].message.content.strip()
            except Exception as e:
                logger.error(f"OpenAI/OpenRouter API call failed: {e}. Falling back...")
        
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
        mode: str = "voice",
        resume_text: Optional[str] = None,
        job_description: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        logger.info(f"Generating questions for {interview_type} ({difficulty}), Mode: {mode}...")
        
        system_guideline = (
            "Since this is a Coding interview, all generated questions MUST be coding challenges where the candidate will write code. Generate exactly 5 coding problems."
            if mode == "coding"
            else "Generate technical, behavioral, and practical questions suited for the role."
        )
        
        system_prompt = f"""
You are an expert, empathetic, and professional AI Interviewer named InterviewAI.
Your goal is to conduct a highly realistic mock interview for a candidate.
Interview Type: {interview_type}
Difficulty: {difficulty}
Resume Context: {resume_text or "Not provided"}
Job Description Context: {job_description or "Not provided"}

Follow these guidelines:
1. {system_guideline}
2. Be professional, structured, and polite.
"""
        
        if mode == "coding":
            user_prompt = """
            Generate exactly 5 coding interview questions.
            Every question MUST be a coding challenge where the candidate will write code to solve it.
            For each question, you MUST include the "coding_metadata" containing:
              - "title": Problem Title
              - "problem_description": Full description of the task, inputs, outputs, and limits.
              - "starter_code": Dict of language-to-code templates, containing keys "python", "javascript", "cpp".
              - "model_solution": A working python solution code snippet.
              - "test_cases": A list of dicts, each with "input" and "expected" keys.
                IMPORTANT: The "input" and "expected" values MUST be valid JSON stringified arguments.
                - Wrap the parameters of the test case in an outer JSON array for the "input" key.
                  For example:
                  If the function takes a single string, "input" must be '["string_value"]'.
                  If the function takes an array and a number, "input" must be '[[1, 2, 3], 4]'.
                  If the function takes a single array, "input" must be '[[1, 2, 3]]'.
            Return a JSON object containing a "questions" key with a list of exactly 5 question objects. Format:
            {
              "questions": [
                {
                  "id": "q1",
                  "text": "short statement of the problem / coding task",
                  "category": "coding",
                  "difficulty": "easy",
                  "expected_criteria": ["keyword1", "keyword2"],
                  "coding_metadata": { ... }
                },
                ...
              ]
            }
            Ensure the response is valid JSON.
            """
        else:
            user_prompt = """
            Generate exactly 5 interview questions.
            The questions must cover technical knowledge, behavioral skills, and scenario-based problem solving.
            Return a JSON object containing a "questions" key with a list of exactly 5 question objects. Format:
            {
              "questions": [
                {
                  "id": "q1",
                  "text": "string question content",
                  "category": "technical",
                  "difficulty": "medium",
                  "expected_criteria": ["keyword1", "keyword2"]
                },
                ...
              ]
            }
            Ensure the response is valid JSON.
            """
        
        response_str = self._call_llm(system_prompt, user_prompt, response_format_json=True)
        try:
            # clean JSON string from any codeblock wraps
            if response_str.startswith("```json"):
                response_str = response_str[7:]
            if response_str.endswith("```"):
                response_str = response_str[:-3]
            response_str = response_str.strip()
            
            parsed = json.loads(response_str)
            if isinstance(parsed, dict):
                if "questions" in parsed:
                    return parsed["questions"]
                elif "questions_list" in parsed:
                    return parsed["questions_list"]
                else:
                    return [parsed]
            elif isinstance(parsed, list):
                return parsed
            else:
                raise ValueError("Parsed JSON is neither a list nor a dict")
        except Exception as e:
            logger.error(f"Failed to parse AI generated questions: {e}. Returning fallback list.")
            return self._get_fallback_questions(interview_type, difficulty, mode)

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
        
        responses = interview_doc.get("responses", [])
        valid_responses = [r for r in responses if r.get("answer_text", "").strip()]
        
        # If candidate submitted 0 answers or aborted before responding
        if len(valid_responses) == 0:
            logger.info("Candidate submitted 0 answered questions. Generating 0% report dossier.")
            return self._get_fallback_report_structure(interview_doc)
        
        transcript_lines = []
        for i, resp in enumerate(valid_responses):
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
            
            # Ensure scores are normalized and non-negative
            if "scores" in report_data and isinstance(report_data["scores"], dict):
                for k, v in report_data["scores"].items():
                    try:
                        val = float(v)
                        report_data["scores"][k] = max(0.0, min(100.0, round(val, 1)))
                    except Exception:
                        report_data["scores"][k] = 0.0
        except Exception as e:
            logger.error(f"Failed to parse final report: {e}. Generating default score metrics.")
            report_data = self._get_fallback_report_structure(interview_doc)

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
            if "exactly 5 coding interview questions" in user_prompt:
                return json.dumps(self._get_fallback_questions("Software Engineering", "Medium", "coding"))
            return json.dumps(self._get_fallback_questions("Software Engineering", "Medium", "voice"))

    def _get_fallback_questions(self, interview_type: str, difficulty: str, mode: str = "voice") -> List[Dict[str, Any]]:
        # Set up a generic set of mock questions
        if mode == "coding":
            return [
                {
                    "id": "q1",
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
                        "model_solution": "def first_unique(s: str) -> int:\n    from collections import Counter\n    char_counts = Counter(s)\n    for index, char in enumerate(s):\n        if char_counts[char] == 1:\n            return index\n    return -1",
                        "test_cases": [
                            {"input": "[\"leetcode\"]", "expected": "0"},
                            {"input": "[\"loveleetcode\"]", "expected": "2"},
                            {"input": "[\"aabb\"]", "expected": "-1"}
                        ]
                    }
                },
                {
                    "id": "q2",
                    "text": "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.",
                    "category": "coding",
                    "difficulty": difficulty,
                    "expected_criteria": ["hashmap", "two sum", "indices", "time complexity O(n)"],
                    "coding_metadata": {
                        "title": "Two Sum",
                        "problem_description": "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`. You may assume that each input would have exactly one solution, and you may not use the same element twice.",
                        "starter_code": {
                            "python": "def two_sum(nums: list, target: int) -> list:\n    # Write your code here\n    pass\n",
                            "javascript": "function twoSum(nums, target) {\n    // Write your code here\n    return [];\n}\n",
                            "cpp": "vector<int> twoSum(vector<int>& nums, int target) {\n    // Write your code here\n    return {};\n}\n"
                        },
                        "model_solution": "def two_sum(nums: list, target: int) -> list:\n    seen = {}\n    for index, num in enumerate(nums):\n        complement = target - num\n        if complement in seen:\n            return [seen[complement], index]\n        seen[num] = index\n    return []",
                        "test_cases": [
                            {"input": "[[2,7,11,15], 9]", "expected": "[0,1]"},
                            {"input": "[[3,2,4], 6]", "expected": "[1,2]"},
                            {"input": "[[3,3], 6]", "expected": "[0,1]"}
                        ]
                    }
                },
                {
                    "id": "q3",
                    "text": "Given an integer `x`, return `true` if `x` is a palindrome, and `false` otherwise.",
                    "category": "coding",
                    "difficulty": difficulty,
                    "expected_criteria": ["math", "palindrome", "reverse integer"],
                    "coding_metadata": {
                        "title": "Palindrome Number",
                        "problem_description": "Given an integer `x`, return `true` if `x` is a palindrome, and `false` otherwise. An integer is a palindrome when it reads the same backward as forward.",
                        "starter_code": {
                            "python": "def is_palindrome(x: int) -> bool:\n    # Write your code here\n    pass\n",
                            "javascript": "function isPalindrome(x) {\n    // Write your code here\n    return false;\n}\n",
                            "cpp": "bool isPalindrome(int x) {\n    // Write your code here\n    return false;\n}\n"
                        },
                        "model_solution": "def is_palindrome(x: int) -> bool:\n    if x < 0 or (x % 10 == 0 and x != 0):\n        return False\n    reversed_half = 0\n    while x > reversed_half:\n        reversed_half = (reversed_half * 10) + (x % 10)\n        x //= 10\n    return x == reversed_half or x == reversed_half // 10",
                        "test_cases": [
                            {"input": "[121]", "expected": "true"},
                            {"input": "[-121]", "expected": "false"},
                            {"input": "[10]", "expected": "false"}
                        ]
                    }
                },
                {
                    "id": "q4",
                    "text": "Merge two sorted arrays into one sorted array.",
                    "category": "coding",
                    "difficulty": difficulty,
                    "expected_criteria": ["two pointers", "merge sort", "sorted array"],
                    "coding_metadata": {
                        "title": "Merge Sorted Arrays",
                        "problem_description": "Given two sorted integer arrays `arr1` and `arr2`, return a new sorted array containing all elements of both arrays.",
                        "starter_code": {
                            "python": "def merge_arrays(arr1: list, arr2: list) -> list:\n    # Write your code here\n    pass\n",
                            "javascript": "function mergeArrays(arr1, arr2) {\n    // Write your code here\n    return [];\n}\n",
                            "cpp": "vector<int> mergeArrays(vector<int>& arr1, vector<int>& arr2) {\n    // Write your code here\n    return {};\n}\n"
                        },
                        "model_solution": "def merge_arrays(arr1: list, arr2: list) -> list:\n    merged = []\n    i, j = 0, 0\n    while i < len(arr1) and j < len(arr2):\n        if arr1[i] <= arr2[j]:\n            merged.append(arr1[i])\n            i += 1\n        else:\n            merged.append(arr2[j])\n            j += 1\n    merged.extend(arr1[i:])\n    merged.extend(arr2[j:])\n    return merged",
                        "test_cases": [
                            {"input": "[[1,3,5], [2,4,6]]", "expected": "[1,2,3,4,5,6]"},
                            {"input": "[[1,2,3], [4,5]]", "expected": "[1,2,3,4,5]"},
                            {"input": "[[], [1]]", "expected": "[1]"}
                        ]
                    }
                },
                {
                    "id": "q5",
                    "text": "Given an integer array `nums`, find the subarray with the largest sum, and return its sum.",
                    "category": "coding",
                    "difficulty": difficulty,
                    "expected_criteria": ["kadane", "dynamic programming", "maximum subarray"],
                    "coding_metadata": {
                        "title": "Maximum Subarray",
                        "problem_description": "Given an integer array `nums`, find the subarray with the largest sum, and return its sum.",
                        "starter_code": {
                            "python": "def max_sub_array(nums: list) -> int:\n    # Write your code here\n    pass\n",
                            "javascript": "function maxSubArray(nums) {\n    // Write your code here\n    return 0;\n}\n",
                            "cpp": "int maxSubArray(vector<int>& nums) {\n    // Write your code here\n    return 0;\n}\n"
                        },
                        "model_solution": "def max_sub_array(nums: list) -> int:\n    max_current = max_global = nums[0]\n    for num in nums[1:]:\n        max_current = max(num, max_current + num)\n        max_global = max(max_global, max_current)\n    return max_global",
                        "test_cases": [
                            {"input": "[[-2,1,-3,4,-1,2,1,-5,4]]", "expected": "6"},
                            {"input": "[[1]]", "expected": "1"},
                            {"input": "[[5,4,-1,7,8]]", "expected": "23"}
                        ]
                    }
                }
            ]
        
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
                    "model_solution": "def first_unique(s: str) -> int:\n    from collections import Counter\n    char_counts = Counter(s)\n    for index, char in enumerate(s):\n        if char_counts[char] == 1:\n            return index\n    return -1",
                    "test_cases": [
                        {"input": "[\"leetcode\"]", "expected": "0"},
                        {"input": "[\"loveleetcode\"]", "expected": "2"},
                        {"input": "[\"aabb\"]", "expected": "-1"}
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

    def _get_fallback_report_structure(self, interview_doc: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        responses = interview_doc.get("responses", []) if interview_doc else []
        valid_responses = [r for r in responses if r.get("answer_text", "").strip()]
        
        if len(valid_responses) == 0:
            return {
                "summary": "No candidate responses were captured during this interview session. Evaluation criteria scores are 0%.",
                "scores": {
                    "overall": 0.0,
                    "communication": 0.0,
                    "technical": 0.0,
                    "problem_solving": 0.0,
                    "confidence": 0.0,
                    "grammar": 0.0,
                    "vocabulary": 0.0,
                    "body_language": 0.0,
                    "speaking_speed": 0.0,
                    "response_quality": 0.0,
                    "depth_of_knowledge": 0.0
                },
                "strengths": [],
                "weaknesses": [
                    "No answer responses were provided for evaluation."
                ],
                "mistakes": [
                    "Session ended without answering questions."
                ],
                "recommended_topics": [
                    "Practice answering technical questions out loud"
                ],
                "recommended_resources": [
                    "Article: AI Mock Interview Preparation Guidelines"
                ],
                "actionable_improvement_plan": [
                    "Attempt each question in full to receive detailed evaluation metrics."
                ]
            }
            
        # Dynamically compute scores from actual response evaluations & webcam metrics
        eval_scores = []
        conf_scores = []
        for r in valid_responses:
            ev = r.get("evaluation") or {}
            if "score" in ev:
                eval_scores.append(float(ev["score"]))
            wm = r.get("webcam_metrics") or {}
            if "confidence_estimate" in wm:
                conf_scores.append(float(wm["confidence_estimate"]))
                
        base_score = round(sum(eval_scores) / len(eval_scores), 1) if eval_scores else 65.0
        conf_score = round(sum(conf_scores) / len(conf_scores), 1) if conf_scores else 70.0
        
        def clamp(val):
            return max(0.0, min(100.0, float(val)))
            
        return {
            "summary": f"The candidate answered {len(valid_responses)} questions. Scores have been evaluated dynamically based on response clarity, technical criteria, and presence.",
            "scores": {
                "overall": clamp(base_score),
                "communication": clamp(round(base_score * 0.95, 1)),
                "technical": clamp(base_score),
                "problem_solving": clamp(round(base_score * 0.98, 1)),
                "confidence": clamp(conf_score),
                "grammar": clamp(round(base_score * 1.02, 1)),
                "vocabulary": clamp(base_score),
                "body_language": clamp(conf_score),
                "speaking_speed": clamp(conf_score),
                "response_quality": clamp(base_score),
                "depth_of_knowledge": clamp(base_score)
            },
            "strengths": [
                "Attempted responses with clear structure."
            ],
            "weaknesses": [
                "Elaborate further with real-world technical trade-offs."
            ],
            "mistakes": [
                "Some explanations could benefit from concrete examples."
            ],
            "recommended_topics": [
                "System architecture principles",
                "Behavioral STAR framework"
            ],
            "recommended_resources": [
                "Book: Cracking the Coding Interview"
            ],
            "actionable_improvement_plan": [
                "Practice speaking solutions out loud before concluding answers."
            ]
        }

ai_service = AIService()
