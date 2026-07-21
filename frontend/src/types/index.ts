export interface User {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  skills: string[];
  experience_years: number;
  education: string[];
  projects: string[];
  avatar_url?: string;
  streak: number;
  last_interview_date?: string;
}

export interface Question {
  id: string;
  text: string;
  category: string;
  difficulty: string;
  expected_criteria?: string[];
  coding_metadata?: {
    title: string;
    problem_description: string;
    starter_code: Record<string, string>;
    test_cases: Array<{ input: string; expected: string }>;
  };
}

export interface WebcamMetrics {
  eye_contact_score: number;
  smile_frequency_score: number;
  posture_score: number;
  speaking_speed_wpm: number;
  confidence_estimate: number;
}

export interface ResponseItem {
  question_id: string;
  question_text: string;
  answer_text: string;
  audio_url?: string;
  code_details?: {
    code: string;
    language: string;
    sandbox_result: {
      status: string;
      passed_test_cases: number;
      total_test_cases: number;
      execution_time_ms: number;
    };
  };
  evaluation: {
    score: number;
    feedback: string;
    strengths: string[];
    weaknesses: string[];
    suggested_answer: string;
  };
  webcam_metrics: WebcamMetrics;
  timestamp: string;
}

export interface Interview {
  id: string;
  user_id: string;
  interview_type: string;
  difficulty: string;
  mode: string;
  status: string;
  questions: Question[];
  responses: ResponseItem[];
  current_question_index: number;
  created_at: string;
  completed_at?: string;
}

export interface ScoreBreakdown {
  overall: number;
  communication: number;
  technical: number;
  problem_solving: number;
  confidence: number;
  grammar: number;
  vocabulary: number;
  body_language: number;
  speaking_speed: number;
  response_quality: number;
  depth_of_knowledge: number;
}

export interface QuestionEvaluation {
  question_id: string;
  question_text: string;
  user_answer: string;
  score: number;
  feedback: string;
  strengths: string[];
  weaknesses: string[];
  suggested_answer: string;
}

export interface Report {
  id: string;
  interview_id: string;
  user_id: string;
  summary: string;
  scores: ScoreBreakdown;
  question_evaluations: QuestionEvaluation[];
  strengths: string[];
  weaknesses: string[];
  mistakes: string[];
  recommended_topics: string[];
  recommended_resources: string[];
  confidence_timeline: Array<{ label: string; value: number }>;
  speaking_speed_timeline: Array<{ label: string; value: number }>;
  actionable_improvement_plan: string[];
  created_at: string;
}
