import { useParams, useNavigate } from "react-router-dom";

export default function Success() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="fade-in flex flex-col items-center justify-center min-h-[60vh]">
      <div className="bg-card rounded-[22px] p-6 shadow-[0_10px_22px_rgba(39,56,74,0.1)] text-center w-full">
        <p className="text-4xl mb-3">✅</p>
        <h1 className="text-heading text-xl font-bold mb-2">Заявка #{id} принята</h1>
        <p className="text-muted text-sm mb-6">Мы свяжемся с вами для уточнения деталей</p>
        <div className="space-y-2">
          <button
            onClick={() => navigate("/")}
            className="w-full py-3 rounded-2xl bg-accent text-white text-sm font-semibold transition active:bg-accent-dark"
          >
            На главную
          </button>
          <button
            onClick={() => navigate("/orders")}
            className="w-full py-3 rounded-2xl bg-bg text-heading text-sm font-semibold border border-gray-200 transition active:opacity-80"
          >
            Мои заявки
          </button>
        </div>
      </div>
    </div>
  );
}
