"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Editor from "@monaco-editor/react";
import {
    Loader2,
    CheckCircle2,
    Send,
    Code2,
    CheckSquare,
    AlignLeft
} from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function CandidateTestPage() {
    const params = useParams();
    const token = params.token as string;
    
    // Core state
    const [isLoading, setIsLoading] = useState(true);
    const [isValid, setIsValid] = useState<boolean | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [sessionData, setSessionData] = useState<any>(null);
    
    // Question State
    const [isFetchingQuestion, setIsFetchingQuestion] = useState(false);
    const [currentTopic, setCurrentTopic] = useState("");
    const [currentQuestion, setCurrentQuestion] = useState<any>(null);
    const [isComplete, setIsComplete] = useState(false);
    
    // Answer State
    const [selectedOption, setSelectedOption] = useState<string>("");
    const [textAnswer, setTextAnswer] = useState<string>("");
    const [codeAnswer, setCodeAnswer] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Timer
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Initial Token Verification
    useEffect(() => {
        async function verifyAndStart() {
            if (!token) return;

            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/assessment/start`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token }),
                });

                const data = await res.json();

                if (res.ok) {
                    setIsValid(true);
                    setSessionData(data);
                    fetchNextQuestion(data.session_id);
                } else {
                    setIsValid(false);
                    setErrorMsg(data.detail || "Invalid or expired token");
                }
            } catch (error) {
                setIsValid(false);
                setErrorMsg("Failed to connect to assessment server.");
            } finally {
                setIsLoading(false);
            }
        }

        verifyAndStart();
    }, [token]);

    // Timer effect
    useEffect(() => {
        if (currentQuestion && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current!);
                        handleForceSubmit();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [currentQuestion, timeLeft]);


    const fetchNextQuestion = async (sessionId: string) => {
        setIsFetchingQuestion(true);
        resetInputs();
        
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/assessment/${sessionId}/question`);
            const data = await res.json();
            
            if (data.status === "completed" || !data.question) {
                setIsComplete(true);
            } else {
                setCurrentTopic(data.topic);
                setCurrentQuestion(data.question);
                // Null-safe: only set starter code if present and non-empty
                setCodeAnswer(data.question.starter_code || "");
                const timeMinutes = data.question.time_limit_minutes || 5;
                setTimeLeft(timeMinutes * 60);
            }
        } catch (error) {
            console.error("Failed to fetch next question", error);
        } finally {
            setIsFetchingQuestion(false);
        }
    };

    const resetInputs = () => {
        setSelectedOption("");
        setTextAnswer("");
        setCodeAnswer("");
    };

    const handleSubmit = async () => {
        if (!sessionData?.session_id) return;
        setIsSubmitting(true);
        if (timerRef.current) clearInterval(timerRef.current);

        const payload = {
            selected_option: selectedOption || null,
            text_answer: textAnswer || null,
            final_code: codeAnswer || null,
            elapsed_seconds: (currentQuestion?.time_limit_minutes * 60) - timeLeft
        };

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/assessment/${sessionData.session_id}/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();

            if (data.assessment_complete) {
                setIsComplete(true);
            } else {
                await fetchNextQuestion(sessionData.session_id);
            }
        } catch (error) {
            console.error("Submit failed", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleForceSubmit = () => {
        handleSubmit();
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? "0" : ""}${s}`;
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-zinc-950 text-white">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-zinc-400" />
                    <p className="text-zinc-500 font-mono">Initializing Assessment Platform...</p>
                </div>
            </div>
        );
    }

    if (!isValid) {
        return (
            <div className="flex h-screen items-center justify-center bg-zinc-950 p-4">
                <Card className="w-full max-w-md bg-zinc-900 border-red-900/50">
                    <CardHeader>
                        <CardTitle className="text-red-500 font-mono">ACCESS DENIED</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-zinc-400">{errorMsg}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (isComplete) {
        return (
            <div className="flex flex-col h-screen bg-zinc-950 items-center justify-center p-4">
                <Card className="w-full max-w-lg bg-zinc-900 border-zinc-800">
                    <CardHeader className="text-center">
                        <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                        <CardTitle className="text-2xl text-zinc-100 font-mono">Assessment Complete</CardTitle>
                        <CardDescription className="text-zinc-400 mt-2">
                            Thank you for completing the assessment, {sessionData?.candidate_name}.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center text-sm text-zinc-500">
                        Your results have been submitted securely to the hiring team. You may now close this tab.
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center">
            {/* Minimalist Top Header */}
            <header className="w-full border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <Code2 className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                            <h1 className="text-sm font-semibold text-zinc-100 tracking-tight uppercase font-mono">
                                Assessment
                            </h1>
                            <p className="text-[10px] text-zinc-500 font-mono tracking-widest">
                                {sessionData?.job_title}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-8">
                        {currentQuestion && (
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-widest">Time Remaining</span>
                                <div className={`font-mono text-xl font-bold tabular-nums ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-zinc-200'}`}>
                                    {formatTime(timeLeft)}
                                </div>
                            </div>
                        )}
                        <div className="h-8 w-px bg-zinc-800" />
                        <div className="text-right">
                            <p className="text-[10px] text-zinc-500 uppercase font-mono tracking-widest">Candidate</p>
                            <p className="text-xs font-medium text-zinc-300">{sessionData?.candidate_name}</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="w-full max-w-[1600px] mx-auto p-6 flex flex-col gap-6 flex-1">
                {isFetchingQuestion ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-6 opacity-50">
                        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                        <p className="text-xs text-zinc-500 font-mono uppercase tracking-[0.2em]">Synchronizing Next Topic...</p>
                    </div>
                ) : currentQuestion && (
                    <div className={`flex flex-col gap-6 h-[calc(100vh-140px)] ${currentQuestion.modality === 'CODE' ? 'lg:flex-row' : 'max-w-4xl mx-auto w-full'}`}>
                        {/* Prompt Panel */}
                        <div className={`flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar ${currentQuestion.modality === 'CODE' ? 'w-full lg:w-1/3' : 'w-full flex-1'}`}>
                            <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-8 backdrop-blur-sm">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className={`p-3 rounded-xl ${
                                        currentQuestion.modality === 'CODE' ? 'bg-emerald-500/10 text-emerald-500' :
                                        currentQuestion.modality === 'MCQ' ? 'bg-blue-500/10 text-blue-500' :
                                        'bg-amber-500/10 text-amber-500'
                                    }`}>
                                        {currentQuestion.modality === "MCQ" && <CheckSquare className="w-6 h-6" />}
                                        {currentQuestion.modality === "TEXT" && <AlignLeft className="w-6 h-6" />}
                                        {currentQuestion.modality === "CODE" && <Code2 className="w-6 h-6" />}
                                    </div>
                                    <h2 className="text-xl font-semibold text-zinc-200">{currentTopic}</h2>
                                </div>
                                
                                <div className="prose prose-invert max-w-none">
                                    <p className="text-lg text-zinc-300 leading-relaxed font-sans subpixel-antialiased">
                                        {currentQuestion.prompt}
                                    </p>
                                </div>
                            </div>

                            {/* Options/Textarea for non-code modalities below prompt on small, OR for Text answer if wanted */}
                            {currentQuestion.modality === "MCQ" && currentQuestion.options && (
                                <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-2xl p-6">
                                    <RadioGroup value={selectedOption} onValueChange={setSelectedOption} className="gap-3">
                                        {currentQuestion.options.map((option: string, idx: number) => (
                                            <div 
                                                key={idx} 
                                                className={`flex items-start space-x-3 p-4 rounded-xl border transition-all cursor-pointer ${
                                                    selectedOption === option 
                                                    ? 'bg-emerald-500/5 border-emerald-500/50 text-emerald-50' 
                                                    : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                                                }`}
                                                onClick={() => setSelectedOption(option)}
                                            >
                                                <RadioGroupItem value={option} id={`opt-${idx}`} className="mt-1" />
                                                <Label htmlFor={`opt-${idx}`} className="text-sm leading-relaxed cursor-pointer font-medium">
                                                    {option}
                                                </Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                </div>
                            )}

                            {currentQuestion.modality === "TEXT" && (
                                <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-2xl p-6 flex-1 flex flex-col">
                                    <Textarea 
                                        value={textAnswer}
                                        onChange={(e) => setTextAnswer(e.target.value)}
                                        placeholder="Type your response here..."
                                        className="flex-1 min-h-[300px] bg-transparent border-none text-zinc-200 text-lg p-0 resize-none font-sans focus-visible:ring-0 placeholder:text-zinc-700"
                                    />
                                </div>
                            )}

                            <div className="mt-auto pt-6 flex flex-col gap-4">
                                <Button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || 
                                        (currentQuestion.modality === "MCQ" && !selectedOption) ||
                                        (currentQuestion.modality === "TEXT" && textAnswer.trim().length < 10) ||
                                        (currentQuestion.modality === "CODE" && !codeAnswer.trim())
                                    }
                                    className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-base shadow-lg shadow-emerald-900/20 transition-all active:scale-[0.98]"
                                >
                                    {isSubmitting ? (
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>Processing...</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <span>Submit Solution</span>
                                            <Send className="w-4 h-4" />
                                        </div>
                                    )}
                                </Button>
                                <p className="text-[10px] text-center text-zinc-600 font-mono uppercase tracking-widest">
                                    Avoid refreshing during active sessions
                                </p>
                            </div>
                        </div>

                        {/* Workspace Panel (for CODE) */}
                        {currentQuestion.modality === "CODE" ? (
                            <div className="flex-1 bg-[#1e1e1e] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
                                <div className="px-4 py-2 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-red-500/20" />
                                        <div className="w-3 h-3 rounded-full bg-amber-500/20" />
                                        <div className="w-3 h-3 rounded-full bg-emerald-500/20" />
                                        <span className="ml-4 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Monaco Solution Environment</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-mono text-zinc-600">v1.84.0</span>
                                    </div>
                                </div>
                                <Editor
                                    key={currentTopic}
                                    height="100%"
                                    defaultLanguage="python"
                                    theme="vs-dark"
                                    value={codeAnswer ?? ""}
                                    onChange={(val) => setCodeAnswer(val || "")}
                                    options={{
                                        minimap: { enabled: false },
                                        fontSize: 16,
                                        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                        lineNumbers: 'on',
                                        roundedSelection: true,
                                        scrollBeyondLastLine: false,
                                        readOnly: false,
                                        cursorStyle: 'line',
                                        automaticLayout: true,
                                        padding: { top: 20 },
                                        smoothScrolling: true,
                                        cursorBlinking: 'smooth',
                                        renderLineHighlight: 'all',
                                        fontLigatures: true,
                                    }}
                                    loading={
                                        <div className="flex items-center justify-center h-full gap-3">
                                            <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                                            <span className="text-xs font-mono text-zinc-500">Loading editor...</span>
                                        </div>
                                    }
                                />
                            </div>
                        ) : null}
                    </div>
                )}
            </main>
        </div>
    );
}
