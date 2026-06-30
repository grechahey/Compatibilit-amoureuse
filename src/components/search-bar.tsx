import { Search } from "lucide-react";
import { MIN_PRICE_PER_NIGHT } from "@/lib/constants";

// Formulaire GET natif : soumet les filtres en query-string vers /properties.
export function SearchBar({ compact = false }: { compact?: boolean }) {
  return (
    <form
      action="/properties"
      method="get"
      className={`flex flex-col gap-3 rounded-2xl border border-sand-200 bg-white p-3 shadow-luxe sm:flex-row sm:items-end ${
        compact ? "" : "sm:p-4"
      }`}
    >
      <div className="flex-1">
        <label className="label-luxe" htmlFor="q">
          Destination
        </label>
        <input
          id="q"
          name="q"
          placeholder="Saint-Tropez, Paris, Megève…"
          className="input-luxe border-transparent bg-sand-50"
        />
      </div>
      <div className="w-full sm:w-36">
        <label className="label-luxe" htmlFor="guests">
          Voyageurs
        </label>
        <input
          id="guests"
          name="guests"
          type="number"
          min={1}
          placeholder="2"
          className="input-luxe border-transparent bg-sand-50"
        />
      </div>
      <div className="w-full sm:w-40">
        <label className="label-luxe" htmlFor="minPrice">
          Budget min / nuit
        </label>
        <input
          id="minPrice"
          name="minPrice"
          type="number"
          min={MIN_PRICE_PER_NIGHT}
          placeholder={`${MIN_PRICE_PER_NIGHT}`}
          className="input-luxe border-transparent bg-sand-50"
        />
      </div>
      <button type="submit" className="btn-gold h-[46px] whitespace-nowrap">
        <Search className="h-4 w-4" />
        Rechercher
      </button>
    </form>
  );
}
