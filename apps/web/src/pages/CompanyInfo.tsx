import { useEffect, useState } from "react";
import {
  getCompanyInfo,
  createCompanyInfo,
  updateCompanyInfo,
  deleteCompanyInfo,
  getFeedback,
  deleteFeedback,
  type CompanyInfoItem,
  type CompanyInfoPayload,
  type FeedbackItem,
} from "../api";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function CompanyInfo() {
  const [items, setItems] = useState<CompanyInfoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CompanyInfoPayload>({
    type: "info",
    title: "",
    content: "",
    isActive: true,
  });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await getCompanyInfo();
      setItems(data);
    } catch (e: any) {
      setError(e?.message || "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }

  async function loadFeedback() {
    try {
      const data = await getFeedback();
      setFeedback(data);
    } catch (e: any) {
      console.error("Feedback load error:", e);
    } finally {
      setFeedbackLoading(false);
    }
  }

  useEffect(() => {
    load();
    loadFeedback();
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm({ type: "info", title: "", content: "", isActive: true });
    setOpen(true);
  }

  function openEdit(item: CompanyInfoItem) {
    setEditingId(item.id);
    setForm({
      type: item.type,
      title: item.title,
      content: item.content,
      isActive: item.isActive,
    });
    setOpen(true);
  }

  async function onSave() {
    if (!form.title.trim() || !form.content.trim()) {
      setError("Заполните заголовок и текст");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (editingId) {
        await updateCompanyInfo(editingId, form);
      } else {
        await createCompanyInfo(form);
      }
      setOpen(false);
      await load();
    } catch (e: any) {
      setError(e?.message || "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: number) {
    if (!confirm("Удалить запись?")) return;
    try {
      await deleteCompanyInfo(id);
      await load();
    } catch (e: any) {
      setError(e?.message || "Ошибка удаления");
    }
  }

  async function onToggleActive(item: CompanyInfoItem) {
    try {
      await updateCompanyInfo(item.id, { isActive: !item.isActive });
      await load();
    } catch (e: any) {
      setError(e?.message || "Ошибка обновления");
    }
  }

  async function onDeleteFeedback(id: number) {
    if (!confirm("Удалить сообщение обратной связи?")) return;
    try {
      await deleteFeedback(id);
      await loadFeedback();
    } catch (e: any) {
      setError(e?.message || "Ошибка удаления");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Новости и информация</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Записи, которые видят клиенты на главной странице</p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
        >
          Добавить
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-200 dark:border-red-800">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">Загрузка...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">Записей нет</div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Тип</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Заголовок</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Текст</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Дата</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Статус</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.type === "news" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"}`}>
                      {item.type === "news" ? "Новость" : "Информация"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 font-medium">{item.title}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 max-w-md truncate">{item.content}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{fmtDate(item.createdAt)}</td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      onClick={() => onToggleActive(item)}
                      className={`px-2 py-1 rounded text-xs font-medium transition ${item.isActive ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300" : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"}`}
                    >
                      {item.isActive ? "Активно" : "Неактивно"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm text-right whitespace-nowrap">
                    <button
                      onClick={() => openEdit(item)}
                      className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100 mr-2"
                    >
                      Изменить
                    </button>
                    <button
                      onClick={() => onDelete(item.id)}
                      className="px-3 py-1.5 rounded-lg text-sm bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/40 dark:text-red-200"
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 dark:text-white">
                {editingId ? "Редактировать запись" : "Новая запись"}
              </h2>
              <button
                className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                onClick={() => setOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-sm">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Тип</label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 text-sm text-gray-900 dark:text-gray-100">
                    <input
                      type="radio"
                      name="type"
                      checked={form.type === "info"}
                      onChange={() => setForm((prev) => ({ ...prev, type: "info" }))}
                    />
                    Важная информация
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-900 dark:text-gray-100">
                    <input
                      type="radio"
                      name="type"
                      checked={form.type === "news"}
                      onChange={() => setForm((prev) => ({ ...prev, type: "news" }))}
                    />
                    Новость
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Заголовок</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Текст</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
                  rows={6}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 resize-none"
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-900 dark:text-gray-100">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                />
                Активно (видно клиентам)
              </label>
            </div>

            <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-2">
              <button
                className="px-4 py-2 rounded-lg text-sm bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100"
                onClick={() => setOpen(false)}
                disabled={saving}
              >
                Отмена
              </button>
              <button
                className="px-4 py-2 rounded-lg text-sm bg-blue-600 hover:bg-blue-700 text-white"
                onClick={onSave}
                disabled={saving}
              >
                {saving ? "Сохранение..." : "Сохранить"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-10">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Обратная связь от клиентов</h2>

        {feedbackLoading ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">Загрузка...</div>
        ) : feedback.length === 0 ? (
          <div className="text-center py-8 text-gray-400 dark:text-gray-500">Сообщений пока нет</div>
        ) : (
          <div className="space-y-4">
            {feedback.map((item) => (
              <div key={item.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.clientName || "Клиент"}
                      </span>
                      {item.organization && (
                        <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded">
                          {item.organization}
                        </span>
                      )}
                      <span className="text-xs text-gray-400 dark:text-gray-500">{fmtDate(item.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line mb-2">{item.message}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      {item.clientPhone && <span>Телефон: {item.clientPhone}</span>}
                      {item.clientEmail && (
                        <a href={`mailto:${item.clientEmail}`} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                          {item.clientEmail}
                        </a>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => onDeleteFeedback(item.id)}
                    className="px-3 py-1.5 rounded-lg text-sm bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/40 dark:text-red-200 flex-shrink-0"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
