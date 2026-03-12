import { useState, useEffect } from "react";
import { getClients, sendBroadcast, type Client } from "../api";
import { Send, Users, CheckCircle } from "lucide-react";

export default function Broadcast() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number; total: number } | null>(null);
  const [sendAll, setSendAll] = useState(true);

  useEffect(() => {
    getClients().then(setClients).catch(() => setClients([]));
  }, []);

  const toggleClient = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleAll = () => {
    if (selectedIds.length === clients.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(clients.map((c) => c.id));
    }
  };

  const handleSend = async () => {
    if (!message.trim() || sending) return;
    setSending(true);
    setResult(null);
    try {
      const res = await sendBroadcast(message, sendAll ? undefined : selectedIds);
      setResult({ sent: res.sent, failed: res.failed, total: res.total });
    } catch (err) {
      setResult({ sent: 0, failed: 0, total: 0 });
    } finally {
      setSending(false);
    }
  };

  const clientName = (c: Client) =>
    [c.firstName, c.lastName].filter(Boolean).join(" ") || c.username || c.telegramId;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Рассылка</h1>

      {/* Message input */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Сообщение (поддерживает HTML: &lt;b&gt;, &lt;i&gt;, &lt;a&gt;)
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            placeholder="Введите текст рассылки..."
            className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
          />
        </div>

        {/* Target selection */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={sendAll}
              onChange={() => setSendAll(true)}
              className="text-blue-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Всем клиентам ({clients.length})
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={!sendAll}
              onChange={() => setSendAll(false)}
              className="text-blue-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Выбранным ({selectedIds.length})
            </span>
          </label>
        </div>

        {/* Send button */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSend}
            disabled={sending || !message.trim() || (!sendAll && selectedIds.length === 0)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition"
          >
            <Send size={16} />
            {sending ? "Отправка..." : "Отправить"}
          </button>

          {result && (
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle size={16} className="text-green-500" />
              <span className="text-gray-700 dark:text-gray-300">
                Отправлено: <b>{result.sent}</b> из {result.total}
                {result.failed > 0 && (
                  <span className="text-red-500 ml-2">Ошибок: {result.failed}</span>
                )}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Client list (for selective sending) */}
      {!sendAll && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <Users size={16} />
              Клиенты
            </div>
            <button
              onClick={toggleAll}
              className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              {selectedIds.length === clients.length ? "Снять все" : "Выбрать все"}
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
            {clients.map((c) => (
              <label
                key={c.id}
                className="flex items-center gap-3 px-5 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(c.id)}
                  onChange={() => toggleClient(c.id)}
                  className="rounded text-blue-600"
                />
                <span className="text-sm text-gray-900 dark:text-gray-100">
                  {clientName(c)}
                </span>
                {c.username && (
                  <span className="text-xs text-gray-400">@{c.username}</span>
                )}
              </label>
            ))}
            {clients.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-gray-400">Нет клиентов</div>
            )}
          </div>
        </div>
      )}

      {/* Preview */}
      {message.trim() && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase">Предпросмотр</div>
          <div
            className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: message }}
          />
        </div>
      )}
    </div>
  );
}
