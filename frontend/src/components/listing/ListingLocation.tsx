interface City {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ListingLocationProps {
  cities: City[];
  categories: Category[];
  cityId: string;
  categoryId: string;
  onCityChange: (cityId: string) => void;
  onCategoryChange: (categoryId: string) => void;
}

export default function ListingLocation({
  cities,
  categories,
  cityId,
  categoryId,
  onCityChange,
  onCategoryChange,
}: ListingLocationProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
      <div className="mb-6">
        <p className="text-sm font-medium text-fuchsia-400">Localisation</p>
        <h2 className="mt-1 text-xl font-semibold">
          Où se trouve votre annonce ?
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          Sélectionnez une ville et une catégorie.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="cityId"
            className="mb-2 block text-sm font-medium text-zinc-200"
          >
            Ville
          </label>

          <select
            id="cityId"
            value={cityId}
            onChange={(event) => onCityChange(event.target.value)}
            required
            className="w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-white outline-none transition focus:border-fuchsia-500"
          >
            <option value="">Sélectionnez une ville</option>

            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="categoryId"
            className="mb-2 block text-sm font-medium text-zinc-200"
          >
            Catégorie
          </label>

          <select
            id="categoryId"
            value={categoryId}
            onChange={(event) => onCategoryChange(event.target.value)}
            required
            className="w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-white outline-none transition focus:border-fuchsia-500"
          >
            <option value="">Sélectionnez une catégorie</option>

            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
}
