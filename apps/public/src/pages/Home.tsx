import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="fade-in">
      <section className="bg-card rounded-[22px] p-4 shadow-[0_10px_22px_rgba(39,56,74,0.1)] mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-[42px] h-[42px] rounded-xl bg-accent text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
            СЭ
          </div>
          <div>
            <p className="text-muted text-xs m-0">Логистический сервис</p>
            <h1 className="text-heading text-[21px] font-bold m-0">Соловьев-Экспресс</h1>
          </div>
        </div>
      </section>

      <section className="bg-card rounded-[22px] shadow-[0_10px_22px_rgba(39,56,74,0.1)] mb-3 overflow-hidden">
        <div className="relative rounded-[20px] overflow-hidden border border-gray-200">
          <img
            src={`${import.meta.env.VITE_API_URL}/assets/examples/logistics-app/hero-main.jpg`}
            alt="Маршрут доставки"
            className="w-full block"
          />
          {/* Кнопка FBS в точке A (верхняя часть маршрута) */}
          <button
            onClick={() => navigate("/fbs")}
            className="absolute top-[35%] left-[50%] -translate-x-1/2 rounded-[14px] w-40 h-12 bg-accent text-white font-bold text-xs shadow-lg active:bg-accent-dark transition flex items-center justify-center"
            style={{ boxShadow: '0 4px 12px rgba(216, 75, 85, 0.4)' }}
          >
            Оставить заявку на FBS
          </button>
          {/* Кнопка FBO в точке B (нижняя часть маршрута) */}
          <button
            onClick={() => navigate("/fbo")}
            className="absolute bottom-[35%] left-[50%] -translate-x-1/2 rounded-[14px] w-40 h-12 bg-accent text-white font-bold text-xs shadow-lg active:bg-accent-dark transition flex items-center justify-center"
            style={{ boxShadow: '0 4px 12px rgba(216, 75, 85, 0.4)' }}
          >
            Оставить заявку на FBO
          </button>
        </div>
      </section>
    </div>
  );
}
