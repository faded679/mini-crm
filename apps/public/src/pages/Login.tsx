import { useState, useEffect } from "react";
import { requestVerification, checkVerification } from "../api";
import { saveAuth } from "../auth";
import ProfileCompletion from "./ProfileCompletion";

interface LoginProps {
  onSuccess: () => void;
}

export default function Login({ onSuccess }: LoginProps) {
  const [phone, setPhone] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [verificationNumber, setVerificationNumber] = useState("");
  const [step, setStep] = useState<"phone" | "waiting" | "profile">("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    // Убираем все кроме цифр
    const digits = input.replace(/\D/g, "");
    // Ограничиваем 10 цифрами (после +7)
    setPhone(digits.slice(0, 10));
  };

  const handleRequestVerification = async () => {
    if (!phone || phone.length < 10) {
      setError("Введите корректный номер телефона");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await requestVerification("+7" + phone);
      setSessionId(response.sessionId);
      setVerificationNumber(response.verificationNumber);
      setStep("waiting");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  // Polling для проверки статуса верификации
  useEffect(() => {
    if (step !== "waiting" || !sessionId) return;

    console.log("Starting verification polling for sessionId:", sessionId);

    // Первая проверка сразу
    const checkStatus = async () => {
      try {
        console.log("Checking verification status...");
        const status = await checkVerification(sessionId);
        console.log("Verification status:", status);
        
        if (status.verified && status.client) {
          console.log("Verification successful!");
          saveAuth(status.client.phone, status.token || "verified");
          
          // Проверяем нужно ли заполнить профиль
          if (status.requiresProfileCompletion) {
            console.log("Profile completion required");
            setStep("profile");
          } else {
            console.log("Profile complete, redirecting...");
            onSuccess();
          }
          return true;
        }
        return false;
      } catch (err) {
        console.error("Verification check error:", err);
        return false;
      }
    };

    // Проверяем сразу
    checkStatus();

    // Затем каждые 3 секунды
    const interval = setInterval(async () => {
      const verified = await checkStatus();
      if (verified) {
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [step, sessionId, onSuccess]);

  // Если нужно заполнить профиль, показываем форму ProfileCompletion
  if (step === "profile") {
    return <ProfileCompletion onSuccess={onSuccess} />;
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-[380px] fade-in">
        <div className="bg-card rounded-[22px] p-6 shadow-[0_10px_22px_rgba(39,56,74,0.1)]">
          <div className="flex items-center gap-2.5 mb-6">
            <img src="/logotip.jpg" alt="Логотип" className="w-[42px] h-[42px] rounded-xl object-contain flex-shrink-0" />
            <div>
              <p className="text-muted text-xs m-0">Логистический сервис</p>
              <h1 className="text-heading text-[21px] font-bold m-0">Доставка на маркетплейсы</h1>
            </div>
          </div>

          {step === "phone" ? (
            <>
              <h2 className="text-heading text-base font-bold mb-3">Вход по телефону</h2>
              <p className="text-muted text-sm mb-4">Введите ваш номер телефона для получения номера для звонка</p>
              <div className="flex items-center h-12 px-4 rounded-2xl bg-bg border border-gray-200 mb-3 transition-all focus-within:border-accent">
                <span className="text-heading text-sm mr-1">+7</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="(___) ___-__-__"
                  className="flex-1 outline-none text-heading text-sm bg-transparent"
                />
              </div>
              {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
              <button
                onClick={handleRequestVerification}
                disabled={loading}
                className="w-full h-12 rounded-2xl bg-accent text-white font-semibold text-sm disabled:opacity-50 transition active:bg-accent-dark"
              >
                {loading ? "Загрузка..." : "Продолжить"}
              </button>
            </>
          ) : (
            <>
              <h2 className="text-heading text-base font-bold mb-3">Позвоните на номер</h2>
              <p className="text-muted text-sm mb-4">
                Для подтверждения позвоните на указанный номер с телефона <strong>+7{phone}</strong>
              </p>
              <div className="bg-accent/10 rounded-2xl p-4 mb-4 text-center">
                <p className="text-muted text-xs mb-1">Номер для звонка</p>
                <a 
                  href={`tel:${verificationNumber}`}
                  className="text-accent text-2xl font-bold tracking-wider"
                >
                  {verificationNumber}
                </a>
              </div>
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                <p className="text-muted text-sm">Ожидание звонка...</p>
              </div>
              {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
              <button
                onClick={() => { setStep("phone"); setSessionId(""); setError(""); }}
                className="w-full mt-2 text-muted text-xs underline"
              >
                Изменить номер
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
