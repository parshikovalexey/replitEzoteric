import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useCreateGoal } from "@/hooks/use-game";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MobileLayout } from "@/components/MobileLayout";
import { AlertCircle, Dices } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const QUESTIONS = [
  "Что мне может помешать выйти на личный доход в размере {amount} в год?",
  "Что мне может помочь выйти на личный доход в размере {amount} в год?",
  "Что мне нужно осознать, чтобы выйти на личный доход в размере {amount} в год?"
];

export default function GamePreparation() {
  const [, setLocation] = useLocation();
  const createGoal = useCreateGoal();
  
  const [step, setStep] = useState<"input" | "dice">("input");
  const [amount, setAmount] = useState("");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [evenCount, setEvenCount] = useState(0);
  const [rejected, setRejected] = useState(false);

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
    setRollValue(value);
    const isEven = value % 2 === 0;

    setTimeout(() => {
      if (!isEven) {
        // ODD -> Accept!
        createGoal.mutate(
          { amount, status: "accepted" },
          { onSuccess: () => setLocation("/training") }
        );
      } else {
        // EVEN -> Next question or Reject
        const newEvenCount = evenCount + 1;
        setEvenCount(newEvenCount);
        setRollValue(null);

        if (newEvenCount >= 3) {
          setRejected(true);
        } else {
          setQuestionIndex(prev => prev + 1);
        }
      }
    }, 600);
  };

  const resetGame = () => {
    setStep("input");
    setAmount("");
    setRejected(false);
  };

  return (
    <MobileLayout title="Постановка Цели">
      <div className="flex flex-col gap-8 h-full justify-center">
        <AnimatePresence mode="wait">
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
              className="flex flex-col gap-8"
            >
              <div className="glass-panel p-6 rounded-3xl text-center space-y-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 text-primary mb-2">
                  <Dices className="w-6 h-6" />
                </div>
                <h3 className="font-display text-xl text-primary leading-relaxed">
                  {QUESTIONS[questionIndex].replace("{amount}", amount)}
                </h3>
                <p className="text-muted-foreground text-sm">
                  Бросьте кубик и выберите число от 1 до 6. <br/>
                  (Нечетное - цель принята, Четное - следующий вопрос)
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map(num => (
                  <Button
                    key={num}
                    onClick={() => handleRoll(num)}
                    variant={rollValue === num ? "default" : "outline"}
                    className={`h-20 text-2xl font-display font-bold glass-panel border-primary/20 hover:bg-primary hover:text-primary-foreground hover:scale-105 transition-all ${rollValue === num ? 'bg-primary text-primary-foreground shadow-[0_0_15px_var(--primary)]' : ''}`}
                  >
                    {num}
                  </Button>
                ))}
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
