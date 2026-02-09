import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Bell, Heart, ShoppingCart, User, Menu, X } from "lucide-react";
import { categories } from "@/data/mockData";
import AuthModal from "@/components/auth/AuthModal";

const Header = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        {/* Main header */}
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo */}
            <Link to="/" className="flex-shrink-0">
              <h1 className="text-xl font-bold font-sans tracking-tight text-foreground">
                live<span className="text-primary">bid</span>
              </h1>
            </Link>

            {/* Search - hidden on mobile */}
            <div className="hidden md:flex flex-1 max-w-xl mx-4">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Search items and auction houses"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-4 pr-10 rounded-lg border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <Link
                  to={`/search?q=${encodeURIComponent(searchQuery)}`}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <Search className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Action Icons */}
            <div className="hidden md:flex items-center gap-1">
              {[
                { icon: Bell, label: "Alerts" },
                { icon: Heart, label: "My Items" },
                { icon: ShoppingCart, label: "Won Items" },
              ].map(({ icon: Icon, label }) => (
                <button key={label} className="flex flex-col items-center px-3 py-1 text-muted-foreground hover:text-foreground transition-colors">
                  <Icon className="h-5 w-5" />
                  <span className="text-[10px] mt-0.5">{label}</span>
                </button>
              ))}
              <button
                onClick={() => setShowAuthModal(true)}
                className="flex flex-col items-center px-3 py-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <User className="h-5 w-5" />
                <span className="text-[10px] mt-0.5">Account</span>
              </button>
            </div>

            {/* Mobile menu toggle */}
            <button
              className="md:hidden text-foreground"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              {showMobileMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile search */}
          <div className="md:hidden pb-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search items and auction houses"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-4 pr-10 rounded-lg border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* Secondary nav */}
        <div className="border-t border-border bg-background">
          <div className="container mx-auto px-4">
            <div className="hidden md:flex items-center justify-between h-10 text-sm overflow-x-auto">
              <div className="flex items-center gap-6">
                {categories.map((cat) => (
                  <Link key={cat} to={`/search?category=${encodeURIComponent(cat)}`} className="text-muted-foreground hover:text-foreground whitespace-nowrap transition-colors">
                    {cat}
                  </Link>
                ))}
              </div>
              <div className="flex items-center gap-4 ml-4">
                <Link to="/search" className="text-muted-foreground hover:text-foreground whitespace-nowrap">📅 Upcoming</Link>
                <Link to="/search" className="text-muted-foreground hover:text-foreground whitespace-nowrap">📍 Near Me</Link>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-border bg-background animate-fade-in">
            <div className="p-4 space-y-3">
              {categories.map((cat) => (
                <Link key={cat} to={`/search?category=${encodeURIComponent(cat)}`} className="block py-2 text-sm text-muted-foreground hover:text-foreground" onClick={() => setShowMobileMenu(false)}>
                  {cat}
                </Link>
              ))}
              <div className="border-t border-border pt-3 flex gap-4">
                <button onClick={() => { setShowAuthModal(true); setShowMobileMenu(false); }} className="text-sm text-primary font-medium">Sign In</button>
              </div>
            </div>
          </div>
        )}
      </header>

      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </>
  );
};

export default Header;
