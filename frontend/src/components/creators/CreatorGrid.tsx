import CreatorCard from "@/components/creators/CreatorCard";
import type { PublicCreator } from "@/services/public-profile.service";

interface CreatorGridProps {
  creators: PublicCreator[];
  columns?: 3 | 4;
}

export default function CreatorGrid({
  creators,
  columns = 3,
}: CreatorGridProps) {
  if (!creators.length) {
    return null;
  }

  const gridColumns =
    columns === 4
      ? "sm:grid-cols-2 lg:grid-cols-4"
      : "sm:grid-cols-2 lg:grid-cols-3";

  return (
    <div className={`grid gap-7 ${gridColumns}`}>
      {creators.map((creator) => (
        <CreatorCard key={creator.username} creator={creator} />
      ))}
    </div>
  );
}
