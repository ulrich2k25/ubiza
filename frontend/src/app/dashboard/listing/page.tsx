import ListingForm from "@/components/listing/ListingForm";

export default function ListingPage() {
  return (
    <main className="min-h-screen bg-[#09090b] text-white">
      <div className="mx-auto max-w-4xl px-5 py-8 sm:px-8">
        <div className="mb-8">
          <p className="mt-8 text-sm font-medium text-fuchsia-400">
            Gestion de l’annonce
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Mon annonce
          </h1>

          <p className="mt-3 text-sm text-zinc-400">
            Créez, modifiez, mettez en pause ou supprimez votre annonce.
          </p>
        </div>

        <ListingForm />
      </div>
    </main>
  );
}
