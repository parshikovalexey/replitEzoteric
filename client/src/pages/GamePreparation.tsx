import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useCreateGoal, useGoals } from "@/hooks/use-game";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MobileLayout } from "@/components/MobileLayout";
import { AlertCircle, Sparkles } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const QUESTIONS = [
  "Что мне может помешать выйти на личный доход в размере {amount} в год?",
  "Что мне может помочь выйти на личный доход в размере {amount} в год?",
  "Что мне нужно осознать, чтобы выйти на личный доход в размере {amount} в год?"
];

export default function GamePreparation() {
  const [, setLocation] = useLocation();
  const createGoal = useCreateGoal();
  const { data: goals } = useGoals();
  
  const [step, setStep] = useState<"input" | "dice" | "warning">("input");
  const [amount, setAmount] = useState("");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [evenCount, setEvenCount] = useState(0);
  const [rejected, setRejected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  const existingGoal = goals?.find(g => g.status === 'accepted');

  useEffect(() => {
    if (existingGoal && step === "input") {
      setStep("warning");
    }
  }, [existingGoal]);

  const handleAmountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount.trim()) {
      setStep("dice");
      setQuestionIndex(0);
      setEvenCount(0);
      setRejected(false);
    }
  };

  const formatDisplayAmount = (val: string) => {
    const numbers = val.replace(/\D/g, "");
    return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    setAmount(formatDisplayAmount(raw));
  };

  const [rollValue, setRollValue] = useState<number | null>(null);

  const handleRoll = (value: number) => {
    if (isProcessing) return;
    setRollValue(value);
    setIsProcessing(true);
    
    const isEven = value % 2 === 0;

    setTimeout(() => {
      if (!isEven) {
        setResultMessage("Принято!");
        const finalQuestion = QUESTIONS[questionIndex].replace("{amount}", amount);
        setTimeout(() => {
          createGoal.mutate(
            { amount, question: finalQuestion, status: "accepted" },
            { onSuccess: () => setLocation("/training") }
          );
        }, 1000);
      } else {
        const newEvenCount = evenCount + 1;
        if (newEvenCount >= 3) {
          setRejected(true);
        } else {
          setResultMessage("Следующий вопрос");
          setTimeout(() => {
            setEvenCount(newEvenCount);
            setRollValue(null);
            setResultMessage(null);
            setIsProcessing(false);
            setQuestionIndex(prev => prev + 1);
          }, 1000);
        }
      }
    }, 800);
  };

  const resetGame = () => {
    setStep("input");
    setAmount("");
    setRejected(false);
    setQuestionIndex(0);
    setEvenCount(0);
    setRollValue(null);
    setResultMessage(null);
    setIsProcessing(false);
  };

  return (
    <MobileLayout title="Постановка Цели">
      <div className="flex flex-col gap-8 h-full justify-center">
        <AnimatePresence mode="wait">
          {step === "warning" && (
            <motion.div
              key="warning"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="glass-panel p-8 rounded-3xl flex flex-col gap-6 text-center"
            >
              <AlertCircle className="w-12 h-12 text-primary mx-auto" />
              <div className="space-y-2">
                <h2 className="font-display text-2xl font-bold text-foreground">У вас уже есть цель</h2>
                <p className="text-muted-foreground text-sm">Желаете продолжить с текущей целью или начать заново?</p>
              </div>
              <div className="space-y-3">
                <Button 
                  onClick={() => setLocation("/training")}
                  className="w-full py-6 text-lg font-bold bg-primary text-primary-foreground rounded-xl"
                >
                  Продолжить
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setAmount("");
                    setStep("input");
                  }}
                  className="w-full py-6 text-lg border-primary/30 text-primary"
                >
                  Начать заново
                </Button>
              </div>
            </motion.div>
          )}

          {step === "input" && (
            <motion.div 
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass-panel p-8 rounded-3xl flex flex-col gap-6"
            >
              <div className="text-center space-y-2">
                <h2 className="font-display text-2xl font-bold text-foreground">Намерение</h2>
                <p className="text-muted-foreground text-sm">Установите вашу финансовую цель для начала трансформации.</p>
              </div>

              <form onSubmit={handleAmountSubmit} className="space-y-6">
                <div className="space-y-4">
                  <label className="text-lg text-center block text-primary/80 font-medium">
                    Хочу иметь личный доход...
                  </label>
                  <Input 
                    value={amount}
                    onChange={handleAmountChange}
                    placeholder="Например: 5 000 000 ₽"
                    className="text-center text-xl py-6 bg-background/50 border-primary/30 focus-visible:ring-primary/50 placeholder:text-muted-foreground/30"
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground text-center italic mt-1">
                    (умножьте свой текущий доход на 2 или 3 и выберите сумму из этого диапазона)
                  </p>
                  <label className="text-lg text-center block text-primary/80 font-medium">
                    ...в год.
                  </label>
                </div>

                <Button 
                  type="submit" 
                  disabled={!amount.trim()}
                  className="w-full py-6 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-[0_0_20px_var(--primary)] hover:shadow-[0_0_30px_var(--primary)] transition-all"
                >
                  Продолжить
                </Button>
              </form>
            </motion.div>
          )}

          {step === "dice" && !rejected && (
            <motion.div 
              key="dice"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="flex flex-col items-center gap-12 py-8"
            >
              <div className="relative w-72 h-72 flex items-center justify-center">
                {/* Crystal Ball Effect */}
                <motion.div
                  animate={{
                    scale: [1, 1.05, 1],
                    boxShadow: [
                      "0 0 20px rgba(var(--primary), 0.3)",
                      "0 0 40px rgba(var(--primary), 0.6)",
                      "0 0 20px rgba(var(--primary), 0.3)"
                    ]
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className={`absolute inset-0 rounded-full border-2 border-primary/30 bg-gradient-to-br from-primary/20 via-background to-primary/10 backdrop-blur-xl flex items-center justify-center p-8 text-center transition-colors duration-500 ${
                    resultMessage === "Принято!" ? "border-green-500/50 bg-green-500/10" : 
                    resultMessage === "Следующий вопрос" ? "border-amber-500/50 bg-amber-500/10" : ""
                  }`}
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={resultMessage || questionIndex}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.2 }}
                      className="space-y-2"
                    >
                      {resultMessage ? (
                        <h3 className={`font-display text-2xl font-bold ${
                          resultMessage === "Принято!" ? "text-green-400" : "text-amber-400"
                        }`}>
                          {resultMessage}
                        </h3>
                      ) : (
                        <p className="font-display text-lg text-primary leading-tight">
                          {QUESTIONS[questionIndex].replace("{amount}", amount)}
                        </p>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </motion.div>

                {/* Orbiting Numbers */}
                {[1, 2, 3, 4, 5, 6].map((num, i) => {
                  const angle = (i * 60) * (Math.PI / 180);
                  const radius = 160;
                  const x = Math.cos(angle) * radius;
                  const y = Math.sin(angle) * radius;

                  return (
                    <motion.div
                      key={num}
                      className="absolute"
                      initial={{ x, y }}
                      animate={rollValue === num ? { x: 0, y: 0, scale: 0, opacity: 0 } : { x, y }}
                      transition={rollValue === num ? { duration: 0.5, ease: "backIn" } : {}}
                    >
                      <Button
                        variant="outline"
                        disabled={isProcessing}
                        onClick={() => handleRoll(num)}
                        className={`w-12 h-12 rounded-full border-primary/30 glass-panel font-display text-xl font-bold transition-all hover:scale-110 hover:border-primary ${
                          isProcessing && rollValue !== num ? "opacity-30" : ""
                        }`}
                      >
                        {num}
                      </Button>
                    </motion.div>
                  );
                })}
              </div>

              <div className="text-center space-y-2 max-w-[280px]">
                <div className="inline-flex items-center gap-2 text-primary/60 text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>Брось кубик и выбери выпавшее число</span>
                </div>
              </div>
            </motion.div>
          )}

          {rejected && (
            <motion.div 
              key="rejected"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <Alert variant="destructive" className="glass-panel border-destructive/50 bg-destructive/10">
                <AlertCircle className="h-5 w-5" />
                <AlertTitle className="text-lg font-display mb-2">Цель не принята</AlertTitle>
                <AlertDescription className="text-base leading-relaxed">
                  Игра не готова пустить тебя с этим запросом. Давай поменяем сумму или переосмыслим намерение.
                </AlertDescription>
              </Alert>

              <Button 
                onClick={resetGame}
                variant="outline"
                className="w-full py-6 text-lg border-primary/50 text-primary hover:bg-primary/20"
              >
                Изменить сумму
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MobileLayout>
  );
}
