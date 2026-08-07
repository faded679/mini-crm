import type { ClientOrganization } from "../api";
import { setSelectedOrgId } from "../auth";

interface Props {
  organizations: ClientOrganization[];
  onSelected: () => void;
}

export default function SelectOrganization({ organizations, onSelected }: Props) {
  const handleSelect = (id: number) => {
    setSelectedOrgId(id);
    onSelected();
  };

  return (
    <div className="min-h-[100dvh] bg-bg">
      <div className="max-w-[420px] mx-auto min-h-[100dvh] px-3.5 pt-10 pb-10">
        <section className="bg-card rounded-[22px] p-4 shadow-[0_10px_22px_rgba(39,56,74,0.1)] mb-3">
          <img src="/logotip.jpg" alt="Логотип" className="w-[42px] h-[42px] rounded-xl object-contain mb-3" />
          <h1 className="text-heading text-[19px] font-bold m-0 mb-1">Выберите организацию</h1>
          <p className="text-muted text-sm m-0">
            У вас несколько организаций. Каждая имеет свой кабинет: заявки, баланс и счета.
          </p>
        </section>

        <div className="space-y-2.5">
          {organizations.map((org) => (
            <button
              key={org.id}
              type="button"
              onClick={() => handleSelect(org.id)}
              className="w-full text-left bg-card rounded-[22px] p-4 shadow-[0_10px_22px_rgba(39,56,74,0.1)] transition active:opacity-80 border border-transparent hover:border-accent/30"
            >
              <div className="text-heading text-base font-semibold">{org.name}</div>
              {org.fullName && org.fullName !== org.name && (
                <div className="text-muted text-xs mt-0.5 truncate">{org.fullName}</div>
              )}
              {org.inn && (
                <div className="text-muted text-xs mt-1">ИНН {org.inn}</div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
