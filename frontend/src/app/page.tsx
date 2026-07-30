import HomeRegisterCta from "@/components/home/HomeRegisterCta";
import HomeNavbar from "@/components/home/HomeNavbar";
import HomeHero from "@/components/home/HomeHero";
import HomeStories from "@/components/home/HomeStories";
import BoostedCreators from "@/components/home/BoostedCreators";
import FeaturedCreators from "@/components/home/FeaturedCreators";
import PopularCities from "@/components/home/PopularCities";

import { publicProfileService } from "@/services/public-profile.service";
import { storyService } from "@/services/story.service";
import SiteFooter from "@/components/layout/SiteFooter";

export default async function Home() {
  const [creators, stories] = await Promise.all([
    publicProfileService.getPublicProfiles(),
    storyService.getPublicStories(),
  ]);

  return (
    <main className="min-h-screen bg-black text-white">
      <HomeNavbar />

      <HomeHero />

      <HomeStories stories={stories} />

      <BoostedCreators creators={creators} />

      <FeaturedCreators creators={creators} />

      <PopularCities showViewAll />

      <HomeRegisterCta />

      <SiteFooter />
    </main>
  );
}
