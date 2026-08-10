import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createClient,
  createCounterparty,
  dadataFindParty,
  deleteCounterparty,
  getClients,
  getCounterparties,
  updateCounterparty,
  getCounterpartyFinanceSummary,
  updateClientBlockStatus,
  blockCounterparty,
  type Client,
  type Counterparty,
  type CounterpartyPayload,
  type CounterpartyFinanceSummary,
} from "../api";
import {
  PREFERRED_PAYMENT_METHODS,
  PREFERRED_PAYMENT_LABELS,
  normalizePreferredPayment,
  parsePreferredPayment,
  serializePreferredPayment,
} from "../lib/preferredPayment";

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
    preferredPayment: normalizePreferredPayment(c.preferredPayment) ?? "",
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

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>({ name: "", contactClientIds: [] });
  const [dadataLoading, setDadataLoading] = useState(false);

  // New contact form inside counterparty modal
  const [showNewContact, setShowNewContact] = useState(false);
  const [newContactFirstName, setNewContactFirstName] = useState("");
  const [newContactLastName, setNewContactLastName] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");
  const [newContactEmail, setNewContactEmail] = useState("");
  const [creatingContact, setCreatingContact] = useState(false);
  const [blockLoadingId, setBlockLoadingId] = useState<number | null>(null);
  const [cpBlockLoadingId, setCpBlockLoadingId] = useState<number | null>(null);

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

  const filteredCounterparties = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return counterparties;
    return counterparties.filter((c) => {
      const name = (c.shortName ?? c.name ?? "").toLowerCase();
      const fullName = (c.name ?? "").toLowerCase();
      const inn = (c.inn ?? "").toLowerCase();
      const contacts = c.contacts.map((x) => {
        const cl = x.client;
        return `${cl.firstName ?? ""} ${cl.lastName ?? ""} ${cl.username ?? ""}`.toLowerCase();
      }).join(" ");
      return name.includes(q) || fullName.includes(q) || inn.includes(q) || contacts.includes(q);
    });
  }, [counterparties, search]);

  async function reload() {
    setLoading(true);
    setError("");
    try {
      const [cp, cl] = await Promise.all([getCounterparties(), getClients()]);
      
      // Sort counterparties alphabetically by name (extract surname from "ИП Фамилия" format)
      cp.sort((a, b) => {
        const nameA = a.shortName || a.name || "";
        const nameB = b.shortName || b.name || "";
        
        // Extract surname from "ИП Фамилия" format
        const surnameA = nameA.match(/^ИП\s+([А-ЯЁ][а-яё]+)/i)?.[1] || nameA;
        const surnameB = nameB.match(/^ИП\s+([А-ЯЁ][а-яё]+)/i)?.[1] || nameB;
        
        return surnameA.localeCompare(surnameB, 'ru');
      });
      
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
    setShowNewContact(false);
    setNewContactFirstName("");
    setNewContactLastName("");
    setNewContactPhone("");
    setNewContactEmail("");
    setOpen(true);
  }

  function openEdit(c: Counterparty) {
    setForm(toFormState(c));
    setShowNewContact(false);
    setNewContactFirstName("");
    setNewContactLastName("");
    setNewContactPhone("");
    setNewContactEmail("");
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

  async function toggleClientBlock(client: Client) {
    if (blockLoadingId) return;
    setBlockLoadingId(client.id);
    try {
      await updateClientBlockStatus(client.id, !client.isBlocked);
      const updatedClients = await getClients();
      setClients(updatedClients);
    } catch (e: any) {
      setError(e?.message || "Ошибка изменения статуса блокировки");
    } finally {
      setBlockLoadingId(null);
    }
  }

  async function toggleCounterpartyBlock(cp: Counterparty, block: boolean) {
    if (cpBlockLoadingId) return;
    setCpBlockLoadingId(cp.id);
    try {
      await blockCounterparty(cp.id, block);
      const [updatedCounterparties, updatedClients] = await Promise.all([
        getCounterparties(),
        getClients(),
      ]);
      setCounterparties(updatedCounterparties);
      setClients(updatedClients);
    } catch (e: any) {
      setError(e?.message || "Ошибка изменения статуса блокировки");
    } finally {
      setCpBlockLoadingId(null);
    }
  }

  async function createNewContact() {
    if (creatingContact) return;
    if (!newContactFirstName.trim() && !newContactPhone.trim() && !newContactEmail.trim()) {
      setError("Укажите хотя бы имя, телефон или email нового контакта");
      return;
    }
    setCreatingContact(true);
    setError("");
    try {
      const newClient = await createClient({
        firstName: newContactFirstName.trim() || undefined,
        lastName: newContactLastName.trim() || undefined,
        phone: newContactPhone.trim() || undefined,
        email: newContactEmail.trim() || undefined,
      });
      // Refresh clients list and auto-select the new one
      const updatedClients = await getClients();
      setClients(updatedClients);
      setForm(prev => ({
        ...prev,
        contactClientIds: [...(prev.contactClientIds ?? []), newClient.id],
      }));
      setNewContactFirstName("");
      setNewContactLastName("");
      setNewContactPhone("");
      setNewContactEmail("");
      setShowNewContact(false);
    } catch (e: any) {
      setError(e?.message || "Ошибка создания контакта");
    } finally {
      setCreatingContact(false);
    }
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
        preferredPayment: normalizePreferredPayment(form.preferredPayment),
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Организации</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Найдено: {filteredCounterparties.length} из {counterparties.length}</p>
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

      <div className="mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по названию, ИНН, контактам..."
          className="w-full max-w-sm px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 placeholder:text-gray-400"
        />
      </div>

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
              {filteredCounterparties.map((c) => {
                const hasContacts = c.contacts.length > 0;
                const allBlocked = hasContacts && c.contacts.every((x) => x.client.isBlocked);
                const someBlocked = hasContacts && c.contacts.some((x) => x.client.isBlocked);
                const cpBlocking = cpBlockLoadingId === c.id;
                return (
                <tr key={c.id} className={`transition ${allBlocked ? "bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20" : "hover:bg-gray-50 dark:hover:bg-gray-700"}`}>
                  <td className="px-4 py-3 text-sm font-medium">
                    <span className={allBlocked ? "text-red-700 dark:text-red-300" : "text-gray-900 dark:text-gray-100"}>
                      {c.shortName || c.name}
                    </span>
                    {allBlocked && (
                      <span className="ml-2 px-1.5 py-0.5 rounded text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                        заблокирована
                      </span>
                    )}
                    {someBlocked && !allBlocked && (
                      <span className="ml-2 px-1.5 py-0.5 rounded text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                        частично
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{c.inn || "—"}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {c.contacts.length === 0
                      ? "—"
                      : c.contacts
                          .map((x) => {
                            const cl = x.client;
                            const n = `${cl.firstName ?? ""} ${cl.lastName ?? ""}`.trim();
                            const phoneFromId = cl.telegramId?.startsWith("phone_") ? `+${cl.telegramId.split("_")[1]}` : null;
                            return n || (cl.username ? `@${cl.username}` : null) || cl.phone || phoneFromId || cl.telegramId;
                          })
                          .join(", ")}
                  </td>
                  <td className="px-4 py-3 text-sm text-right whitespace-nowrap">
                    {hasContacts && (
                      <>
                        <button
                          onClick={() => toggleCounterpartyBlock(c, true)}
                          disabled={cpBlocking || allBlocked}
                          className="px-3 py-1.5 rounded-lg text-sm bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-300 mr-1 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {cpBlocking ? "..." : "Заблокировать"}
                        </button>
                        <button
                          onClick={() => toggleCounterpartyBlock(c, false)}
                          disabled={cpBlocking || !someBlocked}
                          className="px-3 py-1.5 rounded-lg text-sm bg-green-50 hover:bg-green-100 text-green-700 dark:bg-green-900/30 dark:hover:bg-green-900/50 dark:text-green-300 mr-1 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {cpBlocking ? "..." : "Разблокировать"}
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => openFinance(c)}
                      className="px-3 py-1.5 rounded-lg text-sm bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 dark:text-emerald-400 mr-1"
                    >
                      Финансы
                    </button>
                    <button
                      onClick={() => openEdit(c)}
                      className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100"
                    >
                      Изменить
                    </button>
                  </td>
                </tr>
                );
              })}
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

              <div className="md:col-span-2">
                <div className="block text-xs text-gray-500 dark:text-gray-400 mb-2">Предпочтительная оплата</div>
                <div className="flex flex-wrap gap-3 mb-2">
                  {PREFERRED_PAYMENT_METHODS.map((val) => {
                    const { methods, other } = parsePreferredPayment(form.preferredPayment);
                    const checked = methods.has(val);
                    return (
                      <label key={val} className="flex items-center gap-2 cursor-pointer text-sm text-gray-900 dark:text-gray-100">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            const parsed = parsePreferredPayment(form.preferredPayment);
                            if (parsed.methods.has(val)) parsed.methods.delete(val);
                            else parsed.methods.add(val);
                            setField("preferredPayment", serializePreferredPayment(parsed.methods, parsed.other));
                          }}
                          className="rounded"
                        />
                        {PREFERRED_PAYMENT_LABELS[val]}
                      </label>
                    );
                  })}
                  {(() => {
                    const { methods, other } = parsePreferredPayment(form.preferredPayment);
                    const otherChecked = other !== null;
                    return (
                      <>
                        <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-900 dark:text-gray-100">
                          <input
                            type="checkbox"
                            checked={otherChecked}
                            onChange={() => {
                              setField(
                                "preferredPayment",
                                serializePreferredPayment(methods, otherChecked ? null : "")
                              );
                            }}
                            className="rounded"
                          />
                          Другое
                        </label>
                        {otherChecked && (
                          <input
                            type="text"
                            value={other ?? ""}
                            onChange={(e) => {
                              setField(
                                "preferredPayment",
                                serializePreferredPayment(methods, e.target.value)
                              );
                            }}
                            placeholder="Комментарий..."
                            className="flex-1 min-w-[160px] px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
                          />
                        )}
                      </>
                    );
                  })()}
                </div>
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
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Контактные лица</div>
                  <button
                    type="button"
                    onClick={() => setShowNewContact((v) => !v)}
                    className="text-xs px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-300"
                  >
                    {showNewContact ? "Отмена" : "+ Новый контакт"}
                  </button>
                </div>

                {showNewContact && (
                  <div className="mb-2 p-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 space-y-2">
                    <p className="text-xs font-medium text-blue-700 dark:text-blue-300">Создать нового контакта</p>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        value={newContactFirstName}
                        onChange={(e) => setNewContactFirstName(e.target.value)}
                        placeholder="Имя"
                        className="px-2 py-1.5 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                      />
                      <input
                        value={newContactLastName}
                        onChange={(e) => setNewContactLastName(e.target.value)}
                        placeholder="Фамилия"
                        className="px-2 py-1.5 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                      />
                      <input
                        value={newContactPhone}
                        onChange={(e) => setNewContactPhone(e.target.value)}
                        placeholder="Телефон"
                        className="px-2 py-1.5 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                      />
                      <input
                        value={newContactEmail}
                        onChange={(e) => setNewContactEmail(e.target.value)}
                        placeholder="Email"
                        className="px-2 py-1.5 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={createNewContact}
                      disabled={creatingContact}
                      className="w-full px-3 py-1.5 text-sm rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                    >
                      {creatingContact ? "Создание..." : "Создать и привязать"}
                    </button>
                  </div>
                )}

                <div className="max-h-40 overflow-auto rounded-lg border border-gray-200 dark:border-gray-700">
                  {clients.map((c) => {
                    const checked = (form.contactClientIds ?? []).includes(c.id);
                    const name = `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim();
                    const label = name || (c.username ? `@${c.username}` : c.telegramId);
                    const blocking = blockLoadingId === c.id;
                    return (
                      <label
                        key={c.id}
                        className={`flex items-center gap-2 px-3 py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0 text-sm ${c.isBlocked ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300" : "text-gray-900 dark:text-gray-100"}`}
                      >
                        <input type="checkbox" checked={checked} onChange={() => toggleContact(c.id)} />
                        <div className="flex-1 flex items-center justify-between">
                          <span>{label}</span>
                          <span className="flex items-center gap-2 text-xs">
                            {c.phone && <span className="text-gray-500 dark:text-gray-400">📱 {c.phone}</span>}
                            <span className="text-gray-500 dark:text-gray-400">TG: {c.telegramId}</span>
                            <button
                              type="button"
                              onClick={() => toggleClientBlock(c)}
                              disabled={blocking}
                              className={`px-2 py-1 rounded text-xs font-medium transition disabled:opacity-50 ${
                                c.isBlocked
                                  ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300"
                                  : "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300"
                              }`}
                            >
                              {blocking ? "..." : c.isBlocked ? "Разблокировать" : "Заблокировать"}
                            </button>
                          </span>
                        </div>
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
                        {financeSummary.balance.balance > 0 ? "Долг" : financeSummary.balance.balance < 0 ? "Предоплата" : "Баланс"}
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
                onClick={() => { setFinanceOpen(false); navigate(`/admin/finance/reconciliation/${financeCp.id}`); }}
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
