import { useState, useEffect, useMemo, useRef } from "react";
import {
  getCities,
  createCity,
  updateCity,
  deleteCity,
  getCitiesFbs,
  createCityFbs,
  updateCityFbs,
  deleteCityFbs,
  getBoxTypes,
  createBoxType,
  updateBoxType,
  deleteBoxType,
  getPalletTypes,
  createPalletType,
  updatePalletType,
  deletePalletType,
  getRates,
  createRate,
  updateRate,
  deleteRate,
  getServicePrices,
  createServicePrice,
  updateServicePrice,
  deleteServicePrice,
  getPriceFbs,
  createPriceFbs,
  updatePriceFbs,
  deletePriceFbs,
  type City,
  type CityFbs,
  type BoxType,
  type PalletType,
  type PriceRate,
  type RateUnit,
  type ServicePrice,
  type PriceFbsEntry,
} from "../api";
import { cn } from "../lib/utils";
import { Plus, Trash2, Pencil, X, Check } from "lucide-react";

const unitLabels: Record<RateUnit, string> = {
  pallet: "Паллеты",
  boxes: "Коробки",
};

export default function Prices() {
  const [cities, setCities] = useState<City[]>([]);
  const [citiesFbs, setCitiesFbs] = useState<CityFbs[]>([]);
  const [rates, setRates] = useState<PriceRate[]>([]);
  const [boxTypes, setBoxTypes] = useState<BoxType[]>([]);
  const [palletTypes, setPalletTypes] = useState<PalletType[]>([]);
  const [servicePrices, setServicePrices] = useState<ServicePrice[]>([]);
  const [priceFbsList, setPriceFbsList] = useState<PriceFbsEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCity, setFilterCity] = useState<number | "all">("all");

  // add form
  const [addCityId, setAddCityId] = useState<number | "">("");
  const [addUnit, setAddUnit] = useState<RateUnit>("pallet");
  const [addBoxTypeId, setAddBoxTypeId] = useState<number | "">("");
  const [addPalletTypeId, setAddPalletTypeId] = useState<number | "">("");
  const [addPrice, setAddPrice] = useState("");
  const [addComment, setAddComment] = useState("");
  const [adding, setAdding] = useState(false);

  // new city
  const [newCityName, setNewCityName] = useState("");
  const [creatingCity, setCreatingCity] = useState(false);
  const [newCityFullName, setNewCityFullName] = useState("");

  // box type management
  const [newBoxName, setNewBoxName] = useState("");
  const [newBoxMinVol, setNewBoxMinVol] = useState("");
  const [newBoxMaxVol, setNewBoxMaxVol] = useState("");
  const [addingBox, setAddingBox] = useState(false);
  const [boxEditId, setBoxEditId] = useState<number | null>(null);
  const [boxEditName, setBoxEditName] = useState("");
  const [boxEditMinVol, setBoxEditMinVol] = useState("");
  const [boxEditMaxVol, setBoxEditMaxVol] = useState("");
  const [savingBox, setSavingBox] = useState(false);

  // service price management
  const [newSpName, setNewSpName] = useState("");
  const [newSpPrice, setNewSpPrice] = useState("");
  const [newSpUnit, setNewSpUnit] = useState("");
  const [newSpComment, setNewSpComment] = useState("");
  const [addingSp, setAddingSp] = useState(false);
  const [spEditId, setSpEditId] = useState<number | null>(null);
  const [spEditName, setSpEditName] = useState("");
  const [spEditPrice, setSpEditPrice] = useState("");
  const [spEditUnit, setSpEditUnit] = useState("");
  const [spEditComment, setSpEditComment] = useState("");
  const [savingSp, setSavingSp] = useState(false);

  // pallet type management
  const [newPtName, setNewPtName] = useState("");
  const [newPtMin, setNewPtMin] = useState("");
  const [newPtMax, setNewPtMax] = useState("");
  const [addingPt, setAddingPt] = useState(false);
  const [ptEditId, setPtEditId] = useState<number | null>(null);
  const [ptEditName, setPtEditName] = useState("");
  const [ptEditMin, setPtEditMin] = useState("");
  const [ptEditMax, setPtEditMax] = useState("");
  const [savingPt, setSavingPt] = useState(false);

  // city edit
  const [cityEditId, setCityEditId] = useState<number | null>(null);
  const [cityEditShortName, setCityEditShortName] = useState("");
  const [cityEditFullName, setCityEditFullName] = useState("");
  const [savingCity, setSavingCity] = useState(false);

  // city fbs management
  const [newCityFbsName, setNewCityFbsName] = useState("");
  const [newCityFbsFullName, setNewCityFbsFullName] = useState("");
  const [creatingCityFbs, setCreatingCityFbs] = useState(false);
  const [cityFbsEditId, setCityFbsEditId] = useState<number | null>(null);
  const [cityFbsEditShortName, setCityFbsEditShortName] = useState("");
  const [cityFbsEditFullName, setCityFbsEditFullName] = useState("");
  const [savingCityFbs, setSavingCityFbs] = useState(false);

  // price fbs management
  const [pfbsAddDest, setPfbsAddDest] = useState("");
  const [pfbsAddVol, setPfbsAddVol] = useState("");
  const [pfbsAddPrice, setPfbsAddPrice] = useState("");
  const [pfbsAddComment, setPfbsAddComment] = useState("");
  const [pfbsAdding, setPfbsAdding] = useState(false);
  const [pfbsEditId, setPfbsEditId] = useState<number | null>(null);
  const [pfbsEditDest, setPfbsEditDest] = useState("");
  const [pfbsEditVol, setPfbsEditVol] = useState("");
  const [pfbsEditPrice, setPfbsEditPrice] = useState("");
  const [pfbsEditComment, setPfbsEditComment] = useState("");
  const [pfbsSaving, setPfbsSaving] = useState(false);

  // inline edit
  const [editId, setEditId] = useState<number | null>(null);
  const [editBoxTypeId, setEditBoxTypeId] = useState<number | "">("");
  const [editPalletTypeId, setEditPalletTypeId] = useState<number | "">("");
  const [editPrice, setEditPrice] = useState("");
  const [editComment, setEditComment] = useState("");
  const [saving, setSaving] = useState(false);

  const reload = async () => {
    const [c, cfbs, r, bt, pt, sp, pfbs] = await Promise.all([getCities(), getCitiesFbs(), getRates(), getBoxTypes(), getPalletTypes(), getServicePrices(), getPriceFbs()]);
    setCities(c);
    setCitiesFbs(cfbs);
    setRates(r);
    setBoxTypes(bt);
    setPalletTypes(pt);
    setServicePrices(sp);
    setPriceFbsList(pfbs);
  };

  useEffect(() => {
    reload().finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (filterCity === "all") return rates;
    return rates.filter((r) => r.cityId === filterCity);
  }, [rates, filterCity]);

  const handleAddRate = async () => {
    if (adding || addCityId === "" || !addPrice) return;
    if (addUnit === "boxes" && addBoxTypeId === "") return;
    setAdding(true);
    try {
      await createRate({
        cityId: addCityId as number,
        unit: addUnit,
        ...(addUnit === "boxes" ? { boxTypeId: addBoxTypeId as number } : { boxTypeId: null }),
        ...(addUnit === "pallet" && addPalletTypeId !== "" ? { palletTypeId: addPalletTypeId as number } : { palletTypeId: null }),
        price: Number(addPrice),
        comment: addComment.trim() || null,
      });
      setAddBoxTypeId("");
      setAddPalletTypeId("");
      setAddPrice("");
      setAddComment("");
      await reload();
    } finally {
      setAdding(false);
    }
  };

  const handleAddCity = async () => {
    if (creatingCity || !newCityName.trim()) return;
    setCreatingCity(true);
    try {
      const c = await createCity(newCityName.trim(), newCityFullName.trim() || undefined);
      setCities((prev) => [...prev, c].sort((a, b) => a.shortName.localeCompare(b.shortName, "ru")));
      setNewCityName("");
      setNewCityFullName("");
      setAddCityId(c.id);
    } finally {
      setCreatingCity(false);
    }
  };

  const handleSaveCityEdit = async () => {
    if (savingCity || cityEditId === null) return;
    if (!cityEditShortName.trim()) return;
    setSavingCity(true);
    try {
      await updateCity(cityEditId, {
        shortName: cityEditShortName.trim(),
        fullName: cityEditFullName.trim() || cityEditShortName.trim(),
      });
      setCityEditId(null);
      await reload();
    } finally {
      setSavingCity(false);
    }
  };

  const handleDeleteCity = async (id: number) => {
    if (!confirm("Удалить город?")) return;
    try {
      await deleteCity(id);
      await reload();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleSaveEdit = async () => {
    if (saving || editId === null) return;
    setSaving(true);
    try {
      const r = rates.find((x) => x.id === editId);
      if (r?.unit === "boxes" && editBoxTypeId === "") return;
      await updateRate(editId, {
        ...(r?.unit === "boxes" ? { boxTypeId: editBoxTypeId as number } : { boxTypeId: null }),
        ...(r?.unit === "pallet" && editPalletTypeId !== "" ? { palletTypeId: editPalletTypeId as number } : { palletTypeId: null }),
        price: Number(editPrice),
        comment: editComment.trim() || null,
      });
      setEditId(null);
      await reload();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Удалить тариф?")) return;
    await deleteRate(id);
    await reload();
  };

  // box type handlers
  const handleAddBoxType = async () => {
    if (addingBox || !newBoxName.trim() || !newBoxMaxVol) return;
    setAddingBox(true);
    try {
      await createBoxType({ name: newBoxName.trim(), minVolumeM3: newBoxMinVol ? Number(newBoxMinVol) : 0, maxVolumeM3: Number(newBoxMaxVol) });
      setNewBoxName("");
      setNewBoxMinVol("");
      setNewBoxMaxVol("");
      await reload();
    } catch (e) { alert((e as Error).message); } finally { setAddingBox(false); }
  };
  const handleSaveBoxEdit = async () => {
    if (savingBox || boxEditId === null || !boxEditName.trim() || !boxEditMaxVol) return;
    setSavingBox(true);
    try {
      await updateBoxType(boxEditId, { name: boxEditName.trim(), minVolumeM3: Number(boxEditMinVol) || 0, maxVolumeM3: Number(boxEditMaxVol) });
      setBoxEditId(null);
      await reload();
    } catch (e) { alert((e as Error).message); } finally { setSavingBox(false); }
  };
  const handleDeleteBoxType = async (id: number) => {
    if (!confirm("Удалить тип коробки?")) return;
    try { await deleteBoxType(id); await reload(); } catch (e) { alert((e as Error).message); }
  };

  // pallet type handlers
  const handleAddPalletType = async () => {
    if (addingPt || !newPtName.trim() || !newPtMin) return;
    setAddingPt(true);
    try {
      await createPalletType({
        name: newPtName.trim(),
        minValue: Number(newPtMin),
        maxValue: newPtMax ? Number(newPtMax) : null,
      });
      setNewPtName(""); setNewPtMin(""); setNewPtMax("");
      await reload();
    } catch (e) { alert((e as Error).message); } finally { setAddingPt(false); }
  };
  const handleSavePtEdit = async () => {
    if (savingPt || ptEditId === null || !ptEditName.trim() || !ptEditMin) return;
    setSavingPt(true);
    try {
      await updatePalletType(ptEditId, {
        name: ptEditName.trim(),
        minValue: Number(ptEditMin),
        maxValue: ptEditMax ? Number(ptEditMax) : null,
      });
      setPtEditId(null);
      await reload();
    } catch (e) { alert((e as Error).message); } finally { setSavingPt(false); }
  };
  const handleDeletePalletType = async (id: number) => {
    if (!confirm("Удалить тип паллеты?")) return;
    try { await deletePalletType(id); await reload(); } catch (e) { alert((e as Error).message); }
  };

  // service price handlers
  const handleAddSp = async () => {
    if (addingSp || !newSpName.trim() || !newSpPrice) return;
    setAddingSp(true);
    try {
      await createServicePrice({
        name: newSpName.trim(),
        price: Number(newSpPrice),
        unit: newSpUnit.trim() || "услуга",
        comment: newSpComment.trim() || null,
      });
      setNewSpName(""); setNewSpPrice(""); setNewSpUnit(""); setNewSpComment("");
      await reload();
    } catch (e) { alert((e as Error).message); } finally { setAddingSp(false); }
  };
  const handleSaveSpEdit = async () => {
    if (savingSp || spEditId === null || !spEditName.trim() || !spEditPrice) return;
    setSavingSp(true);
    try {
      await updateServicePrice(spEditId, {
        name: spEditName.trim(),
        price: Number(spEditPrice),
        unit: spEditUnit.trim() || "услуга",
        comment: spEditComment.trim() || null,
      });
      setSpEditId(null);
      await reload();
    } catch (e) { alert((e as Error).message); } finally { setSavingSp(false); }
  };
  const handleDeleteSp = async (id: number) => {
    if (!confirm("Удалить услугу?")) return;
    try { await deleteServicePrice(id); await reload(); } catch (e) { alert((e as Error).message); }
  };

  // city fbs handlers
  const handleAddCityFbs = async () => {
    if (creatingCityFbs || !newCityFbsName.trim()) return;
    setCreatingCityFbs(true);
    try {
      const c = await createCityFbs(newCityFbsName.trim(), newCityFbsFullName.trim() || undefined);
      setCitiesFbs((prev) => [...prev, c].sort((a, b) => a.shortName.localeCompare(b.shortName, "ru")));
      setNewCityFbsName("");
      setNewCityFbsFullName("");
    } finally {
      setCreatingCityFbs(false);
    }
  };

  const handleSaveCityFbsEdit = async () => {
    if (savingCityFbs || cityFbsEditId === null) return;
    if (!cityFbsEditShortName.trim()) return;
    setSavingCityFbs(true);
    try {
      await updateCityFbs(cityFbsEditId, {
        shortName: cityFbsEditShortName.trim(),
        fullName: cityFbsEditFullName.trim() || cityFbsEditShortName.trim(),
      });
      setCityFbsEditId(null);
      await reload();
    } finally {
      setSavingCityFbs(false);
    }
  };

  const handleDeleteCityFbs = async (id: number) => {
    if (!confirm("Удалить город FBS?")) return;
    try {
      await deleteCityFbs(id);
      await reload();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  // price fbs handlers
  const handleAddPriceFbs = async () => {
    if (pfbsAdding || !pfbsAddDest.trim() || !pfbsAddVol.trim() || !pfbsAddPrice.trim()) return;
    setPfbsAdding(true);
    try {
      await createPriceFbs({
        destination: pfbsAddDest.trim(),
        volume: pfbsAddVol.trim(),
        price: pfbsAddPrice.trim(),
        comment: pfbsAddComment.trim() || undefined,
      });
      setPfbsAddDest("");
      setPfbsAddVol("");
      setPfbsAddPrice("");
      setPfbsAddComment("");
      await reload();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setPfbsAdding(false);
    }
  };

  const handleSavePriceFbs = async () => {
    if (pfbsSaving || pfbsEditId === null) return;
    if (!pfbsEditDest.trim() || !pfbsEditVol.trim() || !pfbsEditPrice.trim()) return;
    setPfbsSaving(true);
    try {
      await updatePriceFbs(pfbsEditId, {
        destination: pfbsEditDest.trim(),
        volume: pfbsEditVol.trim(),
        price: pfbsEditPrice.trim(),
        comment: pfbsEditComment.trim() || undefined,
      });
      setPfbsEditId(null);
      await reload();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setPfbsSaving(false);
    }
  };

  const handleDeletePriceFbs = async (id: number) => {
    if (!confirm("Удалить запись прайса FBS?")) return;
    try {
      await deletePriceFbs(id);
      await reload();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500 dark:text-gray-400">Загрузка...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Прайс-лист</h1>

      {/* Add rate form */}
      <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Добавить тариф</p>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Направление</label>
            <div className="flex gap-1">
              <select
                value={addCityId}
                onChange={(e) => setAddCityId(e.target.value ? Number(e.target.value) : "")}
                className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              >
                <option value="">Выберите...</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>{c.shortName}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Единица</label>
            <select
              value={addUnit}
              onChange={(e) => setAddUnit(e.target.value as RateUnit)}
              className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            >
              <option value="pallet">Паллеты</option>
              <option value="boxes">Коробки</option>
            </select>
          </div>

          {addUnit === "boxes" && (
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Тип коробки</label>
              <select
                value={addBoxTypeId}
                onChange={(e) => setAddBoxTypeId(e.target.value ? Number(e.target.value) : "")}
                className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              >
                <option value="">Выберите</option>
                {boxTypes.map((bt) => (
                  <option key={bt.id} value={bt.id}>
                    {bt.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {addUnit === "pallet" && palletTypes.length > 0 && (
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Тип паллеты</label>
              <select
                value={addPalletTypeId}
                onChange={(e) => setAddPalletTypeId(e.target.value ? Number(e.target.value) : "")}
                className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              >
                <option value="">Выберите</option>
                {palletTypes.map((pt) => (
                  <option key={pt.id} value={pt.id}>
                    {pt.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Цена (руб.)</label>
            <input
              value={addPrice}
              onChange={(e) => setAddPrice(e.target.value)}
              inputMode="numeric"
              className="w-28 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Комментарий</label>
            <input
              value={addComment}
              onChange={(e) => setAddComment(e.target.value)}
              className="w-40 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            />
          </div>   

          <button
            onClick={handleAddRate}
            disabled={adding || addCityId === "" || !addPrice || (addUnit === "boxes" && addBoxTypeId === "")}
            className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition"
          >
            <Plus size={16} />
            Добавить
          </button>
        </div>
      </div>

      {/* Rates table */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">Тарифов нет</div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Направление</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Единица</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Тип коробки</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Тип паллеты</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Цена (руб.)</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Комментарий</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{r.city.shortName}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{unitLabels[r.unit]}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {editId === r.id ? (
                      r.unit === "boxes" ? (
                        <select
                          value={editBoxTypeId}
                          onChange={(e) => setEditBoxTypeId(e.target.value ? Number(e.target.value) : "")}
                          className="px-2 py-1 text-xs rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                        >
                          <option value="">Выберите</option>
                          {boxTypes.map((bt) => (
                            <option key={bt.id} value={bt.id}>
                              {bt.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )
                    ) : r.unit === "boxes" ? (
                      <span>{r.boxType?.name || "—"}</span>
                    ) : (
                      <span>—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {editId === r.id ? (
                      r.unit === "pallet" ? (
                        <select
                          value={editPalletTypeId}
                          onChange={(e) => setEditPalletTypeId(e.target.value ? Number(e.target.value) : "")}
                          className="px-2 py-1 text-xs rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                        >
                          <option value="">Выберите</option>
                          {palletTypes.map((pt) => (
                            <option key={pt.id} value={pt.id}>
                              {pt.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )
                    ) : r.unit === "pallet" && r.palletType ? (
                      <span>{r.palletType.name}</span>
                    ) : (
                      <span>—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    {editId === r.id ? (
                      <input
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        inputMode="numeric"
                        className="w-24 px-2 py-1 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                      />
                    ) : (
                      r.price.toLocaleString("ru-RU")
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {editId === r.id ? (
                      <input
                        value={editComment}
                        onChange={(e) => setEditComment(e.target.value)}
                        className="w-full px-2 py-1 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                      />
                    ) : (
                      r.comment || "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {editId === r.id ? (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={handleSaveEdit}
                          disabled={saving}
                          className="p-1 text-emerald-600 hover:text-emerald-800 dark:text-emerald-400"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={() => setEditId(null)}
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditId(r.id);
                            setEditPrice(String(r.price));
                            setEditComment(r.comment ?? "");
                            setEditBoxTypeId(r.unit === "boxes" ? (r.boxTypeId ?? "") : "");
                            setEditPalletTypeId(r.unit === "pallet" ? (r.palletTypeId ?? "") : "");
                          }}
                          className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Packaging types management */}
      <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Тип упаковки</p>

        {/* Box types */}
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-2">Коробки</p>
        <div className="flex flex-wrap items-end gap-2 mb-3">
          <input value={newBoxName} onChange={(e) => setNewBoxName(e.target.value)} placeholder="Название" className="w-40 px-2 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" />
          <input value={newBoxMinVol} onChange={(e) => setNewBoxMinVol(e.target.value)} placeholder="От (м³)" inputMode="decimal" className="w-24 px-2 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" />
          <input value={newBoxMaxVol} onChange={(e) => setNewBoxMaxVol(e.target.value)} placeholder="До (м³)" inputMode="decimal" className="w-24 px-2 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" />
          <button onClick={handleAddBoxType} disabled={addingBox || !newBoxName.trim() || !newBoxMaxVol} className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg font-medium bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100 disabled:opacity-50 transition">
            <Plus size={14} /> Добавить
          </button>
        </div>
        {boxTypes.length > 0 && (
          <div className="mb-5 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Название</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">От (м³)</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">До (м³)</th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {boxTypes.map((bt) => (
                  <tr key={bt.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                    <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100">
                      {boxEditId === bt.id ? (
                        <input value={boxEditName} onChange={(e) => setBoxEditName(e.target.value)} className="w-full px-2 py-1 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" />
                      ) : bt.name}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
                      {boxEditId === bt.id ? (
                        <input value={boxEditMinVol} onChange={(e) => setBoxEditMinVol(e.target.value)} inputMode="decimal" className="w-20 px-2 py-1 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" />
                      ) : bt.minVolumeM3}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
                      {boxEditId === bt.id ? (
                        <input value={boxEditMaxVol} onChange={(e) => setBoxEditMaxVol(e.target.value)} inputMode="decimal" className="w-20 px-2 py-1 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" />
                      ) : bt.maxVolumeM3}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {boxEditId === bt.id ? (
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={handleSaveBoxEdit} disabled={savingBox} className="p-1 text-emerald-600 hover:text-emerald-800 dark:text-emerald-400"><Check size={16} /></button>
                          <button onClick={() => setBoxEditId(null)} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X size={16} /></button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => { setBoxEditId(bt.id); setBoxEditName(bt.name); setBoxEditMinVol(String(bt.minVolumeM3)); setBoxEditMaxVol(String(bt.maxVolumeM3)); }} className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"><Pencil size={16} /></button>
                          <button onClick={() => handleDeleteBoxType(bt.id)} className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"><Trash2 size={16} /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pallet types */}
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-2">Паллеты</p>
        <div className="flex flex-wrap items-end gap-2 mb-3">
          <input value={newPtName} onChange={(e) => setNewPtName(e.target.value)} placeholder="Название (0–300)" className="w-36 px-2 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" />
          <input value={newPtMin} onChange={(e) => setNewPtMin(e.target.value)} placeholder="От" inputMode="numeric" className="w-20 px-2 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" />
          <input value={newPtMax} onChange={(e) => setNewPtMax(e.target.value)} placeholder="До" inputMode="numeric" className="w-20 px-2 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" />
          <button onClick={handleAddPalletType} disabled={addingPt || !newPtName.trim() || !newPtMin} className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg font-medium bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100 disabled:opacity-50 transition">
            <Plus size={14} /> Добавить
          </button>
        </div>
        {palletTypes.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Название</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">От</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">До</th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {palletTypes.map((pt) => (
                  <tr key={pt.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                    <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100">
                      {ptEditId === pt.id ? (
                        <input value={ptEditName} onChange={(e) => setPtEditName(e.target.value)} className="w-full px-2 py-1 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" />
                      ) : pt.name}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
                      {ptEditId === pt.id ? (
                        <input value={ptEditMin} onChange={(e) => setPtEditMin(e.target.value)} inputMode="numeric" className="w-16 px-2 py-1 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" />
                      ) : pt.minValue}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
                      {ptEditId === pt.id ? (
                        <input value={ptEditMax} onChange={(e) => setPtEditMax(e.target.value)} inputMode="numeric" className="w-16 px-2 py-1 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" />
                      ) : pt.maxValue ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {ptEditId === pt.id ? (
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={handleSavePtEdit} disabled={savingPt} className="p-1 text-emerald-600 hover:text-emerald-800 dark:text-emerald-400"><Check size={16} /></button>
                          <button onClick={() => setPtEditId(null)} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X size={16} /></button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => { setPtEditId(pt.id); setPtEditName(pt.name); setPtEditMin(String(pt.minValue)); setPtEditMax(pt.maxValue != null ? String(pt.maxValue) : ""); }} className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"><Pencil size={16} /></button>
                          <button onClick={() => handleDeletePalletType(pt.id)} className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"><Trash2 size={16} /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Service prices */}
      <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Дополнительные услуги</p>

        <div className="flex flex-wrap items-end gap-2 mb-3">
          <input value={newSpName} onChange={(e) => setNewSpName(e.target.value)} placeholder="Название" className="w-56 px-2 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" />
          <input value={newSpPrice} onChange={(e) => setNewSpPrice(e.target.value)} placeholder="Цена" inputMode="decimal" className="w-24 px-2 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" />
          <input value={newSpUnit} onChange={(e) => setNewSpUnit(e.target.value)} placeholder="Ед. изм." className="w-28 px-2 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" />
          <input value={newSpComment} onChange={(e) => setNewSpComment(e.target.value)} placeholder="Комментарий" className="w-52 px-2 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" />
          <button onClick={handleAddSp} disabled={addingSp || !newSpName.trim() || !newSpPrice} className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg font-medium bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100 disabled:opacity-50 transition">
            <Plus size={14} /> Добавить
          </button>
        </div>

        {servicePrices.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Название</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Цена</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Ед. изм.</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Комментарий</th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {servicePrices.map((sp) => (
                  <tr key={sp.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                    <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100">
                      {spEditId === sp.id ? (
                        <input value={spEditName} onChange={(e) => setSpEditName(e.target.value)} className="w-full px-2 py-1 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" />
                      ) : sp.name}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
                      {spEditId === sp.id ? (
                        <input value={spEditPrice} onChange={(e) => setSpEditPrice(e.target.value)} inputMode="decimal" className="w-20 px-2 py-1 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" />
                      ) : sp.price}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
                      {spEditId === sp.id ? (
                        <input value={spEditUnit} onChange={(e) => setSpEditUnit(e.target.value)} className="w-24 px-2 py-1 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" />
                      ) : sp.unit}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
                      {spEditId === sp.id ? (
                        <input value={spEditComment} onChange={(e) => setSpEditComment(e.target.value)} className="w-full px-2 py-1 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" />
                      ) : sp.comment || "—"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {spEditId === sp.id ? (
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={handleSaveSpEdit} disabled={savingSp} className="p-1 text-emerald-600 hover:text-emerald-800 dark:text-emerald-400"><Check size={16} /></button>
                          <button onClick={() => setSpEditId(null)} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X size={16} /></button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => { setSpEditId(sp.id); setSpEditName(sp.name); setSpEditPrice(String(sp.price)); setSpEditUnit(sp.unit); setSpEditComment(sp.comment ?? ""); }} className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"><Pencil size={16} /></button>
                          <button onClick={() => handleDeleteSp(sp.id)} className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"><Trash2 size={16} /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cities management */}
      <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Города / направления</p>

        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Короткое название</label>
            <input
              value={newCityName}
              onChange={(e) => setNewCityName(e.target.value)}
              placeholder="Например: ВБ Воронеж"
              className="w-56 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Полное название</label>
            <input
              value={newCityFullName}
              onChange={(e) => setNewCityFullName(e.target.value)}
              placeholder="(опционально)"
              className="w-72 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            />
          </div>

          <button
            onClick={handleAddCity}
            disabled={creatingCity || !newCityName.trim()}
            className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg font-medium bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100 disabled:opacity-50 transition"
          >
            <Plus size={16} />
            Добавить город
          </button>
        </div>

        {cities.length > 0 && (
          <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Короткое</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Полное</th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-24"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {cities.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                    <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100">
                      {cityEditId === c.id ? (
                        <input
                          value={cityEditShortName}
                          onChange={(e) => setCityEditShortName(e.target.value)}
                          className="w-full px-2 py-1 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                        />
                      ) : (
                        c.shortName
                      )}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
                      {cityEditId === c.id ? (
                        <input
                          value={cityEditFullName}
                          onChange={(e) => setCityEditFullName(e.target.value)}
                          className="w-full px-2 py-1 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                        />
                      ) : (
                        c.fullName
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {cityEditId === c.id ? (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={handleSaveCityEdit}
                            disabled={savingCity}
                            className="p-1 text-emerald-600 hover:text-emerald-800 dark:text-emerald-400"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setCityEditId(null)}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setCityEditId(c.id);
                              setCityEditShortName(c.shortName);
                              setCityEditFullName(c.fullName);
                            }}
                            className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCity(c.id)}
                            className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cities FBS management */}
      <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Города / направления FBS</p>

        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Короткое название</label>
            <input
              value={newCityFbsName}
              onChange={(e) => setNewCityFbsName(e.target.value)}
              placeholder="Например: ВБ Воронеж FBS"
              className="w-56 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Полное название</label>
            <input
              value={newCityFbsFullName}
              onChange={(e) => setNewCityFbsFullName(e.target.value)}
              placeholder="(опционально)"
              className="w-72 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            />
          </div>

          <button
            onClick={handleAddCityFbs}
            disabled={creatingCityFbs || !newCityFbsName.trim()}
            className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg font-medium bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100 disabled:opacity-50 transition"
          >
            <Plus size={16} />
            Добавить город FBS
          </button>
        </div>

        {citiesFbs.length > 0 && (
          <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Короткое</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Полное</th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-24"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {citiesFbs.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                    <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100">
                      {cityFbsEditId === c.id ? (
                        <input
                          value={cityFbsEditShortName}
                          onChange={(e) => setCityFbsEditShortName(e.target.value)}
                          className="w-full px-2 py-1 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                        />
                      ) : (
                        c.shortName
                      )}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
                      {cityFbsEditId === c.id ? (
                        <input
                          value={cityFbsEditFullName}
                          onChange={(e) => setCityFbsEditFullName(e.target.value)}
                          className="w-full px-2 py-1 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                        />
                      ) : (
                        c.fullName
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {cityFbsEditId === c.id ? (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={handleSaveCityFbsEdit}
                            disabled={savingCityFbs}
                            className="p-1 text-emerald-600 hover:text-emerald-800 dark:text-emerald-400"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setCityFbsEditId(null)}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setCityFbsEditId(c.id);
                              setCityFbsEditShortName(c.shortName);
                              setCityFbsEditFullName(c.fullName);
                            }}
                            className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCityFbs(c.id)}
                            className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Price FBS */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Прайс FBS</h2>

        {/* Add price FBS form */}
        <div className="mb-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Добавить запись</p>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Направление</label>
              <input
                value={pfbsAddDest}
                onChange={(e) => setPfbsAddDest(e.target.value)}
                placeholder="Например: WB Курск"
                className="w-48 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Объём</label>
              <input
                value={pfbsAddVol}
                onChange={(e) => setPfbsAddVol(e.target.value)}
                placeholder="Например: 1-5 м³"
                className="w-36 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Цена</label>
              <input
                value={pfbsAddPrice}
                onChange={(e) => setPfbsAddPrice(e.target.value)}
                placeholder="Например: 5000 ₽"
                className="w-36 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Комментарий</label>
              <input
                value={pfbsAddComment}
                onChange={(e) => setPfbsAddComment(e.target.value)}
                placeholder="Необязательно"
                className="w-48 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
            </div>
            <button
              type="button"
              onClick={handleAddPriceFbs}
              disabled={pfbsAdding || !pfbsAddDest.trim() || !pfbsAddVol.trim() || !pfbsAddPrice.trim()}
              className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition"
            >
              <Plus size={16} />
              Добавить
            </button>
          </div>
        </div>

        {priceFbsList.length === 0 ? (
          <div className="text-center py-12 text-gray-400 dark:text-gray-500">Нет данных</div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Направление</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Объём</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Цена</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Комментарий</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-24"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {priceFbsList.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                      {pfbsEditId === item.id ? (
                        <input value={pfbsEditDest} onChange={(e) => setPfbsEditDest(e.target.value)} className="w-full px-2 py-1 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" />
                      ) : item.destination}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                      {pfbsEditId === item.id ? (
                        <input value={pfbsEditVol} onChange={(e) => setPfbsEditVol(e.target.value)} className="w-full px-2 py-1 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" />
                      ) : item.volume}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                      {pfbsEditId === item.id ? (
                        <input value={pfbsEditPrice} onChange={(e) => setPfbsEditPrice(e.target.value)} className="w-full px-2 py-1 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" />
                      ) : item.price}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {pfbsEditId === item.id ? (
                        <input value={pfbsEditComment} onChange={(e) => setPfbsEditComment(e.target.value)} className="w-full px-2 py-1 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" />
                      ) : (item.comment || "—")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {pfbsEditId === item.id ? (
                        <div className="flex items-center justify-end gap-1">
                          <button type="button" onClick={handleSavePriceFbs} disabled={pfbsSaving} className="p-1 text-emerald-600 hover:text-emerald-800 dark:text-emerald-400">
                            <Check size={16} />
                          </button>
                          <button type="button" onClick={() => setPfbsEditId(null)} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setPfbsEditId(item.id);
                              setPfbsEditDest(item.destination);
                              setPfbsEditVol(item.volume);
                              setPfbsEditPrice(item.price);
                              setPfbsEditComment(item.comment || "");
                            }}
                            className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                          >
                            <Pencil size={16} />
                          </button>
                          <button type="button" onClick={() => handleDeletePriceFbs(item.id)} className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
