interface ListingDetailsProps {
  title: string;
  description: string;
  age: string;
  availableNow: boolean;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onAgeChange: (value: string) => void;
  onAvailableNowChange: (value: boolean) => void;
}

export default function ListingDetails({
  title,
  description,
  age,
  availableNow,
  onTitleChange,
  onDescriptionChange,
  onAgeChange,
  onAvailableNowChange,
}: ListingDetailsProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
      <div className="mb-6">
        <p className="text-sm font-medium text-fuchsia-400">
          Informations principales
        </p>

        <h2 className="mt-1 text-xl font-semibold">Présentez votre annonce</h2>

        <p className="mt-2 text-sm text-zinc-400">
          Ajoutez les informations qui permettront aux visiteurs de mieux
          comprendre votre profil.
        </p>
      </div>

      <div className="space-y-5">
        <div>
          <label
            htmlFor="title"
            className="mb-2 block text-sm font-medium text-zinc-200"
          >
            Titre de l’annonce
          </label>

          <input
            id="title"
            type="text"
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            placeholder="Exemple : Bella, disponible à Douala"
            required
            minLength={5}
            maxLength={100}
            className="w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-fuchsia-500"
          />

          <p className="mt-2 text-right text-xs text-zinc-500">
            {title.length}/100
          </p>
        </div>

        <div>
          <label
            htmlFor="description"
            className="mb-2 block text-sm font-medium text-zinc-200"
          >
            Description
          </label>

          <textarea
            id="description"
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
            placeholder="Présentez-vous, indiquez vos disponibilités et ce que vous proposez."
            required
            minLength={20}
            maxLength={1500}
            rows={8}
            className="w-full resize-none rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-fuchsia-500"
          />

          <p className="mt-2 text-right text-xs text-zinc-500">
            {description.length}/1500
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="age"
              className="mb-2 block text-sm font-medium text-zinc-200"
            >
              Âge
            </label>

            <input
              id="age"
              type="number"
              value={age}
              onChange={(event) => onAgeChange(event.target.value)}
              placeholder="Exemple : 25"
              min={18}
              max={99}
              required
              className="w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-fuchsia-500"
            />
          </div>

          <div className="flex items-end">
            <label className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-zinc-950 px-4 py-3">
              <div>
                <p className="font-medium text-white">Disponible maintenant</p>

                <p className="mt-1 text-xs text-zinc-500">
                  Affiche votre disponibilité aux visiteurs.
                </p>
              </div>

              <input
                type="checkbox"
                checked={availableNow}
                onChange={(event) => onAvailableNowChange(event.target.checked)}
                className="h-5 w-5 accent-fuchsia-500"
              />
            </label>
          </div>
        </div>
      </div>
    </section>
  );
}

