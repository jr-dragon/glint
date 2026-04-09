import { createFileRoute, useParams } from "@tanstack/react-router";
import {
  Search,
  Filter,
  ChevronDown,
  Heart,
  Play,
  Plus,
  Share2,
  Rss,
} from "lucide-react";
import { Button } from "#/components/ui/button";

export const Route = createFileRoute("/category/$categoryName")({
  component: CategoryPage,
});

function CategoryPage() {
  const { categoryName } = useParams({ from: "/category/$categoryName" });

  // Format category name for display
  const displayName = categoryName
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return (
    <div className="dark bg-surface text-on-surface font-sans selection:bg-primary/30 min-h-screen">
      {/* TopAppBar - Reused from Index */}
      <nav className="fixed top-0 w-full z-50 bg-surface/60 backdrop-blur-xl shadow-[0_20px_40px_rgba(0,0,0,0.4)] flex justify-between items-center px-8 py-4 tracking-tight">
        <div className="text-2xl font-bold tracking-tighter text-primary">
          Glint
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden lg:flex items-center bg-surface-container-high rounded-full px-4 py-1.5 gap-2 border border-outline-variant/10">
            <Search className="text-on-surface-variant w-4 h-4" />
            <input
              className="bg-transparent border-none focus:ring-0 text-sm w-48 placeholder-on-surface-variant/50 outline-none"
              placeholder="Search archives..."
              type="text"
            />
          </div>
        </div>
      </nav>

      <main className="pt-16">
        {/* Category Hero Section */}
        <header className="relative h-[520px] flex items-end px-12 pb-20 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img
              alt="Category background"
              className="w-full h-full object-cover opacity-60"
              src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1920&q=80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent" />
          </div>
          <div className="relative z-10 max-w-4xl">
            <div className="flex items-center gap-2 mb-6">
              <span className="px-3 py-1 rounded-full bg-primary text-on-primary-container text-[10px] tracking-widest uppercase font-bold">
                Event Collection
              </span>
              <span className="text-on-surface-variant text-sm tracking-wide">
                June 15, 2024 • 342 Artifacts
              </span>
            </div>
            <h1 className="text-6xl md:text-8xl font-extrabold tracking-tighter text-on-surface mb-6 leading-tight">
              {displayName}
            </h1>
            <p className="text-on-surface-variant text-xl max-w-2xl leading-relaxed font-light">
              Celebrating three decades of brilliance. A curated archive of
              candid moments, grand toasts, and the electric atmosphere of the
              milestone evening.
            </p>
          </div>
        </header>

        {/* Filter Bar */}
        <section className="px-12 py-8 flex flex-wrap items-center justify-between gap-6 border-b border-outline-variant/10 sticky top-16 bg-surface/80 backdrop-blur-md z-40">
          <div className="flex items-center gap-3">
            <button className="bg-primary text-on-primary-container px-6 py-2 rounded-full text-sm font-semibold flex items-center gap-2 transition-all hover:opacity-90">
              <Filter className="w-4 h-4" />
              All Moments
            </button>
            <button className="bg-surface-container-high text-on-surface px-6 py-2 rounded-full text-sm font-medium hover:bg-surface-container-highest transition-all">
              Speeches
            </button>
            <button className="bg-surface-container-high text-on-surface px-6 py-2 rounded-full text-sm font-medium hover:bg-surface-container-highest transition-all">
              Dancing
            </button>
            <button className="bg-surface-container-high text-on-surface px-6 py-2 rounded-full text-sm font-medium hover:bg-surface-container-highest transition-all">
              Candids
            </button>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-on-surface-variant text-sm">Sort by</span>
            <div className="relative group">
              <button className="bg-surface-container-low border border-outline-variant/20 px-4 py-2 rounded-lg text-sm flex items-center gap-8 min-w-[160px] justify-between text-on-surface">
                Timeline
                <ChevronDown className="w-4 h-4 text-primary" />
              </button>
            </div>
          </div>
        </section>

        {/* Media Grid */}
        <section className="px-12 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
            {ARTIFACTS.map((artifact) => (
              <div
                key={artifact.id}
                className={`group cursor-pointer ${artifact.featured ? "md:col-span-2" : ""}`}
              >
                <div
                  className={`relative ${artifact.featured ? "aspect-[16/9]" : "aspect-[4/5]"} rounded-2xl overflow-hidden mb-4 bg-surface-container-low transition-transform duration-500 group-hover:scale-[1.02] border border-outline-variant/10`}
                >
                  <img
                    alt={artifact.title}
                    className="w-full h-full object-cover"
                    src={artifact.image}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest to-transparent opacity-60" />

                  {!artifact.featured && (
                    <div className="absolute top-4 right-4 bg-surface-container-lowest/40 backdrop-blur-md p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <Heart className="w-5 h-5 text-white" />
                    </div>
                  )}

                  <div className="absolute bottom-4 left-4 flex items-center gap-2">
                    <span
                      className={`${artifact.tagBg} backdrop-blur-md ${artifact.tagText} text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider`}
                    >
                      {artifact.category}
                    </span>
                  </div>

                  {artifact.featured && (
                    <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                      <div>
                        <span className="text-primary text-xs font-bold tracking-[0.2em] uppercase mb-1 block">
                          Highlight Gallery
                        </span>
                        <h3 className="text-on-surface font-bold text-2xl leading-tight">
                          {artifact.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10 text-white">
                        <Play className="fill-current w-4 h-4" />
                        <span className="text-sm font-bold">WATCH MONTAGE</span>
                      </div>
                    </div>
                  )}
                </div>
                {!artifact.featured && (
                  <div>
                    <h3 className="text-on-surface font-bold text-lg leading-tight group-hover:text-primary transition-colors">
                      {artifact.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-2 text-on-surface-variant text-xs tracking-wide">
                      <span>{artifact.author}</span>
                    </div>
                  </div>
                )}
                {artifact.featured && (
                  <div className="flex items-center gap-3 mt-2 text-on-surface-variant text-xs tracking-wide">
                    <span>{artifact.author}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination / Load More */}
          <div className="mt-20 flex justify-center">
            <button className="group flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full border border-outline-variant/30 flex items-center justify-center group-hover:bg-primary/10 group-hover:border-primary/50 transition-all">
                <Plus className="text-primary w-6 h-6" />
              </div>
              <span className="text-on-surface-variant text-sm tracking-widest uppercase font-bold">
                Load More Moments
              </span>
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface w-full py-12 border-t border-outline-variant/15">
        <div className="flex flex-col md:flex-row justify-between items-center px-8 max-w-7xl mx-auto w-full gap-8">
          <div className="flex flex-col gap-2">
            <div className="text-lg font-bold text-on-surface">Glint</div>
            <p className="text-sm tracking-wide text-on-surface-variant">
              © {new Date().getFullYear()} {window.location.host}. All rights
              reserved.
            </p>
          </div>
          <div className="flex gap-4">
            <button className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

const ARTIFACTS = [
  {
    id: "1",
    title: "The Grand Entrance",
    author: "@alex_walker",
    image:
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80",
    category: "Portrait",
    tagBg: "bg-primary/20",
    tagText: "text-primary",
    featured: false,
  },
  {
    id: "2",
    title: "Toast to Sarah",
    author: "@sarah_j",
    image:
      "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80",
    category: "Candid",
    tagBg: "bg-secondary/20",
    tagText: "text-secondary",
    featured: false,
  },
  {
    id: "3",
    title: "The Midnight Celebration",
    author: "@marcus_v",
    image:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80",
    category: "Highlight",
    tagBg: "bg-primary/20",
    tagText: "text-primary",
    featured: true,
  },
  {
    id: "4",
    title: "The Skyloft View",
    author: "@elena_m",
    image:
      "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=800&q=80",
    category: "Cityscape",
    tagBg: "bg-primary/20",
    tagText: "text-primary",
    featured: false,
  },
  {
    id: "5",
    title: "Gilded Confections",
    author: "@david_k",
    image:
      "https://images.unsplash.com/photo-1535232142137-733efeded1ba?auto=format&fit=crop&w=800&q=80",
    category: "Still Life",
    tagBg: "bg-tertiary/20",
    tagText: "text-tertiary",
    featured: false,
  },
  {
    id: "6",
    title: "Rhythm of the Night",
    author: "@jess_w",
    image:
      "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=800&q=80",
    category: "Action",
    tagBg: "bg-tertiary/20",
    tagText: "text-tertiary",
    featured: false,
  },
];
