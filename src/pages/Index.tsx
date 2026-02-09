import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { auctionItems, auctionHouses, featuredAuctions, searchCategories } from "@/data/mockData";
import ItemCard from "@/components/auction/ItemCard";

const categoryIcons = [
  { name: "Art", icon: "🎨" },
  { name: "Jewelry", icon: "💎" },
  { name: "Furniture", icon: "🪑" },
  { name: "Coins", icon: "🪙" },
  { name: "Fashion", icon: "👗" },
  { name: "Watches", icon: "⌚" },
];

const HomePage = () => {
  const [carouselIdx, setCarouselIdx] = useState(0);
  const featured = featuredAuctions[carouselIdx];

  return (
    <div>
      {/* Hero */}
      <section className="py-16 md:py-24 text-center bg-secondary">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-foreground mb-4">
            Let's go treasure-hunting.
          </h1>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Discover extraordinary items from the world's top auction houses
          </p>
          <div className="flex max-w-md mx-auto gap-2 mb-10">
            <input
              type="email"
              placeholder="Enter your email for updates"
              className="flex-1 h-11 px-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button className="h-11 px-6 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
              Subscribe
            </button>
          </div>
          <div className="flex justify-center gap-6 md:gap-10 flex-wrap">
            {categoryIcons.map((cat) => (
              <Link key={cat.name} to={`/search?category=${cat.name}`} className="flex flex-col items-center gap-2 group">
                <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center text-2xl shadow-sm group-hover:shadow-md transition-shadow">
                  {cat.icon}
                </div>
                <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Auctions Carousel */}
      <section className="bg-primary py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-serif font-bold text-primary-foreground mb-6">Featured Auctions</h2>
          <div className="relative">
            <div className="flex gap-6 items-stretch">
              {/* Mosaic images */}
              <div className="hidden md:grid grid-cols-2 gap-2 w-1/2 h-72">
                <img src={featured.images[0]} alt="" className="col-span-1 row-span-2 w-full h-full object-cover rounded-lg" />
                {featured.images[1] && <img src={featured.images[1]} alt="" className="w-full h-full object-cover rounded-lg" />}
                {featured.images[2] && <img src={featured.images[2]} alt="" className="w-full h-full object-cover rounded-lg" />}
              </div>
              <div className="md:hidden w-full h-48">
                <img src={featured.images[0]} alt="" className="w-full h-full object-cover rounded-lg" />
              </div>
              {/* Info */}
              <div className="flex flex-col justify-center text-primary-foreground">
                <p className="text-sm opacity-70 mb-1">{featured.auctioneer}</p>
                <h3 className="text-xl md:text-2xl font-serif font-bold mb-2">{featured.title}</h3>
                <p className="text-sm opacity-70 mb-1">{featured.date}</p>
                <p className="text-sm opacity-70 mb-4">{featured.location} • {featured.lotCount} Lots</p>
                <Link
                  to={`/search`}
                  className="inline-flex items-center gap-2 border border-primary-foreground/50 text-primary-foreground px-5 py-2 rounded-md text-sm font-medium hover:bg-primary-foreground/10 transition-colors w-fit"
                >
                  EXPLORE <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            {/* Nav */}
            <div className="flex items-center justify-center gap-3 mt-6">
              <button onClick={() => setCarouselIdx((i) => (i - 1 + featuredAuctions.length) % featuredAuctions.length)} className="text-primary-foreground/60 hover:text-primary-foreground">
                <ChevronLeft className="h-5 w-5" />
              </button>
              {featuredAuctions.map((_, i) => (
                <button key={i} onClick={() => setCarouselIdx(i)} className={`w-2 h-2 rounded-full transition-colors ${i === carouselIdx ? "bg-primary-foreground" : "bg-primary-foreground/30"}`} />
              ))}
              <button onClick={() => setCarouselIdx((i) => (i + 1) % featuredAuctions.length)} className="text-primary-foreground/60 hover:text-primary-foreground">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Auctioneers */}
      <section className="py-10 border-b border-border">
        <div className="container mx-auto px-4">
          <h2 className="text-xl font-serif font-bold text-foreground mb-6">Featured Auctioneers</h2>
          <div className="flex gap-8 overflow-x-auto pb-2">
            {auctionHouses.map((house) => (
              <div key={house.id} className="flex-shrink-0 flex flex-col items-center gap-2 grayscale hover:grayscale-0 transition-all cursor-pointer">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center text-2xl font-serif font-bold text-muted-foreground">
                  {house.logo}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{house.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Searches to Follow */}
      <section className="py-10 border-b border-border">
        <div className="container mx-auto px-4">
          <h2 className="text-xl font-serif font-bold text-foreground mb-6">Searches to Follow</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {searchCategories.map((cat) => (
              <div key={cat.id} className="border border-border rounded-lg overflow-hidden hover-lift">
                <div className="grid grid-cols-3 gap-0.5 h-28">
                  {cat.images.map((img, i) => (
                    <img key={i} src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
                  ))}
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm font-sans text-card-foreground">{cat.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{cat.itemCount.toLocaleString()} items • {cat.followerCount.toLocaleString()} followers</p>
                  <button className="mt-3 w-full h-9 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors">
                    FOLLOW THIS SEARCH
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trending Items */}
      <section className="py-10">
        <div className="container mx-auto px-4">
          <h2 className="text-xl font-serif font-bold text-foreground mb-6">Trending Items</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {auctionItems.slice(0, 8).map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
          <div className="text-center mt-8">
            <Link to="/search" className="inline-flex items-center gap-1 text-primary font-medium text-sm hover:underline">
              View All Items <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
