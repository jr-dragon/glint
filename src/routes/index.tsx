import { createFileRoute } from "@tanstack/react-router";
import {
  Search,
  Play,
  Library,
  ArrowLeft,
  ArrowRight,
  Share2,
} from "lucide-react";
import { Button } from "#/components/ui/button";

export const Route = createFileRoute("/")({ component: App });

function App() {
  return (
    <div className="dark bg-surface text-on-surface font-sans selection:bg-primary/30 min-h-screen">
      {/* TopAppBar */}
      <nav className="fixed top-0 w-full z-50 bg-surface/60 backdrop-blur-xl shadow-[0_20px_40px_rgba(0,0,0,0.4)] flex justify-between items-center px-8 py-4 tracking-tight">
        <div className="text-2xl font-bold tracking-tighter text-primary">
          Glint
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden lg:flex items-center bg-surface-container-high rounded-full px-4 py-1.5 gap-2 border border-outline-variant/10">
            <Search className="text-on-surface-variant w-4 h-4" />
            <input
              className="bg-transparent border-none focus:ring-0 text-sm w-48 placeholder-on-surface-variant/50 outline-none"
              placeholder="Explore masterpieces..."
              type="text"
            />
          </div>
        </div>
      </nav>

      <main className="pt-16">
        {/* Hero Featured Carousel Section */}
        <section className="relative w-full h-[80vh] min-h-[600px] overflow-hidden group">
          <div className="absolute inset-0">
            <img
              alt="Europe Trip 2024"
              className="w-full h-full object-cover"
              src="https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1920&q=80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/20 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-surface via-transparent to-transparent" />
          </div>

          {/* Carousel Content Overlay */}
          <div className="absolute bottom-0 left-0 w-full p-12 md:p-24 flex flex-col items-start max-w-4xl">
            <div className="flex items-center gap-3 mb-6">
              <span className="px-3 py-1 rounded-sm bg-secondary/20 text-secondary text-[10px] font-bold tracking-[0.2em] uppercase border border-secondary/30">
                FEATURED COLLECTION
              </span>
              <span className="h-[1px] w-12 bg-outline-variant/30" />
              <span className="text-on-surface-variant text-sm font-medium">
                SUMMER MEMORIES
              </span>
            </div>
            <h1 className="text-6xl md:text-8xl font-extrabold tracking-tighter text-on-surface mb-6 leading-[0.9] max-w-3xl">
              EUROPE TRIP <br />
              <span className="text-primary drop-shadow-[0_0_15px_rgba(143,245,255,0.3)]">
                2024
              </span>
            </h1>
            <p className="text-on-surface-variant text-lg md:text-xl max-w-xl mb-10 leading-relaxed font-light">
              A visual journey through the heart of the continent. Relive the
              cobblestone streets, sunset vistas, and architectural wonders of
              the Grand Tour.
            </p>
            <div className="flex items-center gap-4">
              <Button className="bg-gradient-to-r from-primary to-primary-container text-on-primary-container h-auto px-10 py-4 rounded-full font-bold flex items-center gap-3 hover:scale-105 transition-transform border-none">
                <Play className="fill-current w-5 h-5" />
                PLAY SLIDESHOW
              </Button>
              <Button
                variant="outline"
                className="bg-surface-container-highest text-on-surface h-auto px-10 py-4 rounded-full font-bold flex items-center gap-3 hover:bg-surface-bright transition-colors border-none"
              >
                <Library className="w-5 h-5" />
                VIEW ALL
              </Button>
            </div>
          </div>

          {/* Carousel Navigation Arrows */}
          <div className="absolute right-12 bottom-24 flex gap-4">
            <button className="w-14 h-14 rounded-full border border-outline-variant/30 flex items-center justify-center hover:bg-surface-bright transition-all text-on-surface">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <button className="w-14 h-14 rounded-full border border-outline-variant/30 flex items-center justify-center hover:bg-surface-bright transition-all text-on-surface">
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>

          {/* Indicators */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-3">
            <div className="h-1 w-12 bg-primary rounded-full" />
            <div className="h-1 w-6 bg-outline-variant/40 rounded-full" />
            <div className="h-1 w-6 bg-outline-variant/40 rounded-full" />
          </div>
        </section>

        {/* Collections Grid */}
        <section className="px-8 md:px-12 py-24 max-w-7xl mx-auto">
          {/* Header Section */}
          <header className="mb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-2">
                <h2 className="text-5xl font-extrabold tracking-tighter text-on-surface leading-tight uppercase">
                  Your{" "}
                  <span className="bg-gradient-to-r from-primary to-primary-container bg-clip-text text-transparent">
                    Collections
                  </span>
                </h2>
                <p className="text-on-surface-variant max-w-xl text-lg">
                  Curated memories organized by life's most significant moments.
                  High-fidelity cinematic playback for every chapter.
                </p>
              </div>
            </div>
            {/* Filters */}
            <div className="flex flex-wrap gap-3 mt-10">
              <button className="bg-secondary text-on-secondary px-5 py-2 rounded-sm text-sm font-medium">
                All Events
              </button>
              <button className="bg-surface-container-high hover:bg-surface-container-highest text-on-surface px-5 py-2 rounded-sm text-sm font-medium transition-colors">
                Celebrations
              </button>
              <button className="bg-surface-container-high hover:bg-surface-container-highest text-on-surface px-5 py-2 rounded-sm text-sm font-medium transition-colors">
                Travel
              </button>
              <button className="bg-surface-container-high hover:bg-surface-container-highest text-on-surface px-5 py-2 rounded-sm text-sm font-medium transition-colors">
                Workshops
              </button>
            </div>
          </header>

          {/* Bento Grid Collections */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {COLLECTIONS.map((collection) => (
              <div
                key={collection.id}
                className="group relative aspect-[4/5] rounded-xl overflow-hidden bg-surface-container transition-all duration-300 hover:scale-[1.02] hover:bg-surface-bright cursor-pointer shadow-lg shadow-black/20 border border-outline-variant/10"
              >
                <img
                  className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                  src={collection.image}
                  alt={collection.title}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-transparent to-transparent opacity-90" />
                <div className="absolute bottom-0 left-0 p-8 w-full">
                  <span
                    className={`inline-block px-3 py-1 ${collection.tagColor} border ${collection.tagBorder} rounded-full text-[10px] uppercase tracking-widest font-bold mb-3`}
                  >
                    {collection.category}
                  </span>
                  <h3 className="text-2xl font-bold text-on-surface mb-1">
                    {collection.title}
                  </h3>
                  <p className="text-on-surface-variant text-sm flex items-center gap-2">
                    <Library className="w-4 h-4" /> {collection.assets} Assets
                  </p>
                </div>
                <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white">
                    <Play className="fill-current w-5 h-5" />
                  </div>
                </div>
              </div>
            ))}
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

const COLLECTIONS = [
  {
    id: "1",
    title: "30th Birthday Party",
    category: "Celebration",
    assets: "142",
    image:
      "https://images.unsplash.com/photo-1530103043960-ef38714abb15?auto=format&fit=crop&w=800&q=80",
    tagColor: "bg-secondary/20 text-secondary",
    tagBorder: "border-secondary/30",
  },
  {
    id: "2",
    title: "Summer Vacation",
    category: "Travel",
    assets: "854",
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
    tagColor: "bg-tertiary/20 text-tertiary",
    tagBorder: "border-tertiary/30",
  },
  {
    id: "3",
    title: "Wedding Day",
    category: "Celebration",
    assets: "2,105",
    image:
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80",
    tagColor: "bg-secondary/20 text-secondary",
    tagBorder: "border-secondary/30",
  },
  {
    id: "4",
    title: "Japan Autumn Tour",
    category: "Travel",
    assets: "562",
    image:
      "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80",
    tagColor: "bg-tertiary/20 text-tertiary",
    tagBorder: "border-tertiary/30",
  },
  {
    id: "5",
    title: "Jazz Night Workshop",
    category: "Workshops",
    assets: "48",
    image:
      "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=800&q=80",
    tagColor: "bg-primary/20 text-primary",
    tagBorder: "border-primary/30",
  },
  {
    id: "6",
    title: "Alps Expedition",
    category: "Travel",
    assets: "312",
    image:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80",
    tagColor: "bg-tertiary/20 text-tertiary",
    tagBorder: "border-tertiary/30",
  },
];
