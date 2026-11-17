import type { Metadata } from "next";
import { getGallery } from "@/lib/data";
import { PageHero } from "@/components/sections";
import GalleryGrid from "@/components/GalleryGrid";
import { GALLERY_CATEGORIES } from "@/lib/settings-fields";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Galerie photos", description: "Locaux, salles de cours, travaux pratiques et réalisations beauté de Herman FASHION à Douala." };

export default async function GalleryPage() {
  const items = await getGallery();
  return (
    <>
      <PageHero eyebrow="Galerie" title="La vie de Herman FASHION en images." />
      <section className="section">
        <div className="container-x">
          <GalleryGrid
            categories={GALLERY_CATEGORIES}
            items={items.map((i) => ({ id: i.id, category: i.category, imageUrl: i.imageUrl, caption: i.caption, altText: i.altText }))}
          />
        </div>
      </section>
    </>
  );
}
