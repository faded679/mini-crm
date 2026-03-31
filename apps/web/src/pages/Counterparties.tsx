import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createCounterparty,
  dadataFindParty,
  deleteCounterparty,
  getClients,
  getCounterparties,
  updateCounterparty,
  getCounterpartyFinanceSummary,
  type Client,
  type Counterparty,
  type CounterpartyPayload,
  type CounterpartyFinanceSummary,
} from "../api";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU");
}

function fmtMoney(n: number) {
  return n.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " \u20BD";
}

type FormState = CounterpartyPayload & { id?: number };

function toFormState(c?: Counterparty): FormState {
  if (!c) return { name: "", contactClientIds: [] };
  return {
    id: c.id,
    name: c.name,
    shortName: c.shortName,
    orgType: c.orgType,
    orgStatus: c.orgStatus,
    inn: c.inn,
    kpp: c.kpp,
    ogrn: c.ogrn,
    address: c.address,
    account: c.account,
    bik: c.bik,
    correspondentAccount: c.correspondentAccount,
    bank: c.bank,
    director: c.director,
    directorPost: c.directorPost,
    contract: c.contract,
    contactClientIds: c.contacts.map((x) => x.client.id),
  };
}

export default function Counterparties() {
  const navigate = useNavigate();
  const [counterparties, setCounterparties] = useState<Counterparty[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>({ name: "", contactClientIds: [] });
  const [dadataLoading, setDadataLoading] = useState(false);

  // Finance modal
  const [financeOpen, setFinanceOpen] = useState(false);
  const [financeCp, setFinanceCp] = useState<Counterparty | null>(null);
  const [financeSummary, setFinanceSummary] = useState<CounterpartyFinanceSummary | null>(null);
  const [financeLoading, setFinanceLoading] = useState(false);

  async function openFinance(c: Counterparty) {
    setFinanceCp(c);
    setFinanceSummary(null);
    setFinanceOpen(true);
    setFinanceLoading(true);
    try {
      const summary = await getCounterpartyFinanceSummary(c.id);
      setFinanceSummary(summary);
    } catch { /* ignore */ }
    setFinanceLoading(false);
  }

  const clientById = useMemo(() => {
    const m = new Map<number, Client>();
    for (const c of clients) m.set(c.id, c);
    return m;
  }, [clients]);

  async function reload() {
    setLoading(true);
    setError("");
    try {
      const [cp, cl] = await Promise.all([getCounterparties(), getClients()]);
      setCounterparties(cp);
      setClients(cl);
    } catch (e: any) {
      setError(e?.message || "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, []);

  function openCreate() {
    setForm({ name: "", contactClientIds: [] });
    setOpen(true);
  }

  function openEdit(c: Counterparty) {
    setForm(toFormState(c));
    setOpen(true);
  }

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function fillFromDadata() {
    const inn = (form.inn ?? "").trim();
    if (!inn) {
      setError("Введите ИНН для заполнения");
      return;
    }
    setDadataLoading(true);
    setError("");
    try {
      const result = await dadataFindParty(inn);
      if (!result.found) {
        setError(result.message || "Организация не найдена");
        return;
      }
      setForm((prev) => ({
        ...prev,
        name: result.name || prev.name,
        shortName: result.shortName ?? prev.shortName,
        orgType: result.orgType ?? prev.orgType,
        orgStatus: result.orgStatus ?? prev.orgStatus,
        inn: result.inn ?? prev.inn,
        kpp: result.kpp ?? prev.kpp,
        ogrn: result.ogrn ?? prev.ogrn,
        address: result.address ?? prev.address,
        director: result.director ?? prev.director,
        directorPost: result.directorPost ?? prev.directorPost,
      }));
    } catch (e: any) {
      setError(e?.message || "Ошибка запроса DaData");
    } finally {
      setDadataLoading(false);
    }
  }

  function toggleContact(id: number) {
    setForm((prev) => {
      const current = prev.contactClientIds ?? [];
      const exists = current.includes(id);
      return {
        ...prev,
        contactClientIds: exists ? current.filter((x) => x !== id) : [...current, id],
      };
    });
  }

  async function onSave() {
    setSaving(true);
    setError("");
    try {
      const payload: CounterpartyPayload = {
        name: form.name,
        shortName: form.shortName ?? null,
        orgType: form.orgType ?? null,
        orgStatus: form.orgStatus ?? null,
        inn: form.inn ?? null,
        kpp: form.kpp ?? null,
        ogrn: form.ogrn ?? null,
        address: form.address ?? null,
        account: form.account ?? null,
        bik: form.bik ?? null,
        correspondentAccount: form.correspondentAccount ?? null,
        bank: form.bank ?? null,
        director: form.director ?? null,
        directorPost: form.directorPost ?? null,
        contract: form.contract ?? null,
        contactClientIds: form.contactClientIds ?? [],
      };

      if (form.id) {
        await updateCounterparty(form.id, payload);
      } else {
        await createCounterparty(payload);
      }

      setOpen(false);
      await reload();
    } catch (e: any) {
      setError(e?.message || "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  }

  // async function onDelete(id: number) {
  //   const ok = confirm("Удалить организацию?");
  //   if (!ok) return;

  //   setSaving(true);
  //   setError("");
  //   try {
  //     await deleteCounterparty(id);
  //     await reload();
  //   } catch (e: any) {
  //     setError(e?.message || "Ошибка удаления");
  //   } finally {
  //     setSaving(false);
  //   }
  // }

  if (loading) {
    return <div className="text-center py-12 text-gray-500 dark:text-gray-400">Загрузка...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Организации</h1>
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

      {counterparties.length === 0 ? (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">Организаций нет</div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Наименование</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">ИНН</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Контакты</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {counterparties.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 font-medium">{c.shortName || c.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{c.inn || "—"}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {c.contacts.length === 0
                      ? "—"
                      : c.contacts
                          .map((x) => {
                            const cl = x.client;
                            const n = `${cl.firstName ?? ""} ${cl.lastName ?? ""}`.trim();
                            return n || cl.username || cl.telegramId;
                          })
                          .join(", ")}
                  </td>
                  <td className="px-4 py-3 text-sm text-right whitespace-nowrap">
                    <button
                      onClick={() => openFinance(c)}
                      className="px-3 py-1.5 rounded-lg text-sm bg-green-50 hover:bg-green-100 text-green-700 dark:bg-green-900/30 dark:hover:bg-green-900/50 dark:text-green-400 mr-2"
                    >
                      Финансы
                    </button>
                    <button
                      onClick={() => openEdit(c)}
                      className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100"
                    >
                      Изменить
                    </button>
                    {/* <button
                      onClick={() => onDelete(c.id)}
                      className="ml-2 px-3 py-1.5 rounded-lg text-sm bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/40 dark:text-red-200"
                      disabled={saving}
                    >
                      Удалить
                    </button> */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="font-semibold text-gray-900 dark:text-white">
                {form.id ? "Редактирование" : "Новая организация"}
              </div>
              <button
                className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                onClick={() => setOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto text-sm">
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">ИНН</label>
                <div className="flex gap-2">
                  <input
                    value={form.inn ?? ""}
                    onChange={(e) => setField("inn", e.target.value)}
                    placeholder="Введите ИНН и нажмите Заполнить"
                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-500"
                  />
                  <button
                    type="button"
                    onClick={fillFromDadata}
                    disabled={dadataLoading || !(form.inn ?? "").trim()}
                    className="px-4 py-1.5 rounded-lg text-sm font-medium bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 whitespace-nowrap"
                  >
                    {dadataLoading ? "Поиск...." : "Заполнить"}
                  </button>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Краткое наименование</label>
                <input
                  value={form.shortName ?? ""}
                  onChange={(e) => setField("shortName", e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Тип организации</label>
                <input
                  value={form.orgType ?? ""}
                  onChange={(e) => setField("orgType", e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Статус организации</label>
                <input
                  value={form.orgStatus ?? ""}
                  onChange={(e) => setField("orgStatus", e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">КПП</label>
                <input
                  value={form.kpp ?? ""}
                  onChange={(e) => setField("kpp", e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">ОГРН</label>
                <input
                  value={form.ogrn ?? ""}
                  onChange={(e) => setField("ogrn", e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Должность руководителя</label>
                <input
                  value={form.directorPost ?? ""}
                  onChange={(e) => setField("directorPost", e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">ФИО руководителя</label>
                <input
                  value={form.director ?? ""}
                  onChange={(e) => setField("director", e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Адрес</label>
                <input
                  value={form.address ?? ""}
                  onChange={(e) => setField("address", e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Договор</label>
                <input
                  value={form.contract ?? ""}
                  onChange={(e) => setField("contract", e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Р/счёт</label>
                <input
                  value={form.account ?? ""}
                  onChange={(e) => setField("account", e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">БИК</label>
                <input
                  value={form.bik ?? ""}
                  onChange={(e) => setField("bik", e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Корсчёт</label>
                <input
                  value={form.correspondentAccount ?? ""}
                  onChange={(e) => setField("correspondentAccount", e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Банк</label>
                <input
                  value={form.bank ?? ""}
                  onChange={(e) => setField("bank", e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div className="md:col-span-2">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Контактные лица</div>
                <div className="max-h-40 overflow-auto rounded-lg border border-gray-200 dark:border-gray-700">
                  {clients.map((c) => {
                    const checked = (form.contactClientIds ?? []).includes(c.id);
                    const name = `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim();
                    const label = name || (c.username ? `@${c.username}` : c.telegramId);
                    return (
                      <label
                        key={c.id}
                        className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0 text-sm text-gray-900 dark:text-gray-100"
                      >
                        <input type="checkbox" checked={checked} onChange={() => toggleContact(c.id)} />
                        <span>{label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
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
      {/* Finance modal */}
      {financeOpen && financeCp && (
        <div
          className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setFinanceOpen(false); }}
        >
          <div className="w-full max-w-3xl bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden max-h-[85vh] flex flex-col">
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  Финансы — {financeCp.shortName || financeCp.name}
                </div>
                {financeCp.inn && <div className="text-xs text-gray-400">ИНН: {financeCp.inn}</div>}
              </div>
              <button
                className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                onClick={() => setFinanceOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1">
              {financeLoading ? (
                <div className="text-center py-8 text-gray-500">Загрузка...</div>
              ) : !financeSummary ? (
                <div className="text-center py-8 text-gray-400">Нет данных</div>
              ) : (
                <>
                  {/* Balance cards */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="rounded-lg bg-gray-50 dark:bg-gray-700/50 p-4 text-center">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Выставлено</div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-gray-200">{fmtMoney(financeSummary.balance.totalBilled)}</div>
                    </div>
                    <div className="rounded-lg bg-gray-50 dark:bg-gray-700/50 p-4 text-center">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Оплачено</div>
                      <div className="text-lg font-semibold text-green-600 dark:text-green-400">{fmtMoney(financeSummary.balance.totalPaid)}</div>
                    </div>
                    <div className="rounded-lg bg-gray-50 dark:bg-gray-700/50 p-4 text-center">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {financeSummary.balance.balance > 0 ? "Долг" : financeSummary.balance.balance < 0 ? "Переплата" : "Баланс"}
                      </div>
                      <div className={`text-lg font-bold ${
                        financeSummary.balance.balance > 0
                          ? "text-red-600 dark:text-red-400"
                          : financeSummary.balance.balance < 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-gray-500"
                      }`}>
                        {financeSummary.balance.balance > 0 ? "+" : ""}{fmtMoney(financeSummary.balance.balance)}
                      </div>
                    </div>
                  </div>

                  {/* Payments */}
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Поступления ({financeSummary.payments.length})</h3>
                    {financeSummary.payments.length === 0 ? (
                      <div className="text-sm text-gray-400">Нет поступлений</div>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
                            <th className="pb-1.5 pr-3">Дата</th>
                            <th className="pb-1.5 pr-3 text-right">Сумма</th>
                            <th className="pb-1.5">Назначение</th>
                          </tr>
                        </thead>
                        <tbody>
                          {financeSummary.payments.map((p) => (
                            <tr key={p.id} className="border-b border-gray-100 dark:border-gray-700/50">
                              <td className="py-1.5 pr-3 whitespace-nowrap">{fmtDate(p.documentDate)}</td>
                              <td className="py-1.5 pr-3 text-right whitespace-nowrap font-medium text-green-600 dark:text-green-400">+{fmtMoney(p.amount)}</td>
                              <td className="py-1.5 text-gray-500 dark:text-gray-400 truncate max-w-[300px]" title={p.purpose}>{p.purpose}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* Invoices */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Счета ({financeSummary.invoices.length})</h3>
                    {financeSummary.invoices.length === 0 ? (
                      <div className="text-sm text-gray-400">Нет счетов</div>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
                            <th className="pb-1.5 pr-3">Номер</th>
                            <th className="pb-1.5 pr-3">Дата</th>
                            <th className="pb-1.5 pr-3 text-right">Сумма</th>
                            <th className="pb-1.5">Статус</th>
                          </tr>
                        </thead>
                        <tbody>
                          {financeSummary.invoices.map((inv) => {
                            const total = inv.items.reduce((s, it) => s + it.amount, 0);
                            return (
                              <tr key={inv.id} className="border-b border-gray-100 dark:border-gray-700/50">
                                <td className="py-1.5 pr-3 font-medium">{inv.number}</td>
                                <td className="py-1.5 pr-3 whitespace-nowrap">{fmtDate(inv.date)}</td>
                                <td className="py-1.5 pr-3 text-right whitespace-nowrap">{fmtMoney(total)}</td>
                                <td className="py-1.5">
                                  {inv.isPaid ? (
                                    <span className="text-green-600 dark:text-green-400 text-xs font-medium">Оплачен</span>
                                  ) : (
                                    <span className="text-yellow-600 dark:text-yellow-400 text-xs font-medium">Не оплачен</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <button
                onClick={() => { setFinanceOpen(false); navigate(`/finance/reconciliation/${financeCp.id}`); }}
                className="px-4 py-2 rounded-lg text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-400 font-medium"
              >
                Полная сверка →
              </button>
              <button
                onClick={() => setFinanceOpen(false)}
                className="px-4 py-2 rounded-lg text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
