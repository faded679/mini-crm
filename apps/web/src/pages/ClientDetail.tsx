import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Trash2 } from "lucide-react";
import { cn } from "../lib/utils";
import {
  getClientById,
  deleteClient,
  updateClient,
  type ClientDetail as ClientDetailType,
  type RequestStatus,
} from "../api";

const statusLabels: Record<RequestStatus, string> = {
  new: "Новый",
  warehouse: "Склад",
  billed: "Счёт выставлен",
  shipped: "Отгружен",
  done: "Выполнена",
  archived: "Архив",
};

const statusColors: Record<RequestStatus, string> = {
  new: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  warehouse: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  billed: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  shipped: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  done: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  archived: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

function formatRuPhone(input?: string | null): string {
  if (!input) return "—";
  const digits = String(input).replace(/\D/g, "");

  // +7XXXXXXXXXX or 8XXXXXXXXXX
  const norm = digits.length === 11 && (digits.startsWith("7") || digits.startsWith("8")) ? `7${digits.slice(1)}` : digits;

  if (norm.length !== 11 || !norm.startsWith("7")) return input;

  const c = norm.slice(1, 4);
  const p1 = norm.slice(4, 7);
  const p2 = norm.slice(7, 9);
  const p3 = norm.slice(9, 11);
  return `+7 (${c}) ${p1}-${p2}-${p3}`;
}

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<ClientDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [emailValue, setEmailValue] = useState("");

  const handleDelete = async () => {
    if (!client) return;
    if (!confirm(`Удалить клиента ${client.firstName} ${client.lastName || ""}?\n\nВнимание: Будут удалены все заявки и связи с организациями!`)) return;
    
    setDeleting(true);
    try {
      await deleteClient(client.id);
      navigate("/admin/clients");
    } catch (err) {
      alert("Ошибка при удалении клиента: " + (err instanceof Error ? err.message : "Неизвестная ошибка"));
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    getClientById(Number(id))
      .then(setClient)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="text-center py-12 text-gray-500 dark:text-gray-400">Загрузка...</div>;
  }

  if (!client) {
    return <div className="text-center py-12 text-gray-500 dark:text-gray-400">Клиент не найден</div>;
  }

  const fullName = `${client.firstName ?? ""} ${client.lastName ?? ""}`.trim() || "—";
  const primaryCounterparty = client.counterparties?.[0]?.counterparty;
  const primaryCounterpartyName = primaryCounterparty?.shortName || primaryCounterparty?.name;
  const primaryCounterpartyInn = primaryCounterparty?.inn;

  return (
    <div className="max-w-5xl">
      <Link
        to="/clients"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-6 transition"
      >
        <ArrowLeft size={16} />
        Назад к клиентам
      </Link>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{fullName}</h1>
          {/* <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg font-medium bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 transition"
          >
            <Trash2 size={16} />
            {deleting ? "Удаление..." : "Удалить клиента"}
          </button> */}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="text-gray-600 dark:text-gray-400">
            <span className="text-gray-400 dark:text-gray-500">Telegram:</span>{" "}
            {client.username ? (
              <a
                href={`https://t.me/${client.username}`}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                onClick={(e) => e.stopPropagation()}
              >
                @{client.username}
              </a>
            ) : (
              <span className="text-gray-500 dark:text-gray-400">нет username</span>
            )}
          </div>
          <div className="text-gray-600 dark:text-gray-400">
            <span className="text-gray-400 dark:text-gray-500">Telegram ID:</span> <span className="font-mono">{client.telegramId}</span>
          </div>
          <div className="text-gray-600 dark:text-gray-400">
            <span className="text-gray-400 dark:text-gray-500">Телефон:</span>{" "}
            <span className="font-mono">{formatRuPhone(client.phone)}</span>
          </div>
          <div className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
            <span className="text-gray-400 dark:text-gray-500">Email:</span>{" "}
            {editingEmail ? (
              <form
                className="inline-flex items-center gap-1"
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    await updateClient(client.id, { email: emailValue || null });
                    setClient({ ...client, email: emailValue || null } as any);
                    setEditingEmail(false);
                  } catch (err) {
                    alert(err instanceof Error ? err.message : "Ошибка");
                  }
                }}
              >
                <input
                  type="email"
                  value={emailValue}
                  onChange={(e) => setEmailValue(e.target.value)}
                  className="px-2 py-0.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="email@example.com"
                  autoFocus
                />
                <button type="submit" className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400">✓</button>
                <button type="button" onClick={() => setEditingEmail(false)} className="text-xs text-gray-400 hover:text-gray-600">✕</button>
              </form>
            ) : (
              <>
                <span className="font-mono">{client.email || "—"}</span>
                <button
                  onClick={() => { setEmailValue(client.email || ""); setEditingEmail(true); }}
                  className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400"
                >✎</button>
              </>
            )}
          </div>
          <div className="text-gray-600 dark:text-gray-400">
            <span className="text-gray-400 dark:text-gray-500">Организация:</span>{" "}
            {primaryCounterparty ? (
              <Link
                to={`/counterparties${primaryCounterpartyInn ? `?inn=${encodeURIComponent(primaryCounterpartyInn)}` : ""}`}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                onClick={(e) => e.stopPropagation()}
              >
                {primaryCounterpartyName || "—"}
              </Link>
            ) : (
              "—"
            )}
          </div>
          <div className="text-gray-600 dark:text-gray-400">
            <span className="text-gray-400 dark:text-gray-500">Дата регистрации:</span> {new Date(client.createdAt).toLocaleString("ru-RU")}
          </div>
          <div className="text-gray-600 dark:text-gray-400">
            <span className="text-gray-400 dark:text-gray-500">Заявок:</span> {client.requests.length}
          </div>
        </div>
      </div>

      {client.requests.filter((r) => r.status !== "archived").length === 0 ? (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">Заявок нет</div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">#</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Город</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Дата доставки</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Статус</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Создана</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {client.requests.filter((r) => r.status !== "archived").map((r) => (
                <tr
                  key={r.id}
                  onClick={() => navigate(`/admin/requests/${r.id}`)}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer"
                >
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 font-medium">#{r.id}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{r.city}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {new Date(r.deliveryDate).toLocaleDateString("ru-RU")}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("px-2 py-1 rounded-full text-xs font-medium", statusColors[r.status])}>
                      {statusLabels[r.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {new Date(r.createdAt).toLocaleString("ru-RU")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
