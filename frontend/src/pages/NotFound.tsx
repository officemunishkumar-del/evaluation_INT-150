import { Link } from "react-router-dom";
import { Search, Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        {/* Large 404 */}
        <div className="relative mb-6">
          <span className="text-[120px] md:text-[160px] font-bold text-muted-foreground/10 leading-none select-none">
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Search className="h-10 w-10 text-primary" />
            </div>
          </div>
        </div>

        <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-3">
          Page Not Found
        </h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          The page you're looking for doesn't exist or has been moved.
          Let's get you back on track.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="h-11 px-6 rounded-md bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
          >
            <Home className="h-4 w-4" /> Go Home
          </Link>
          <Link
            to="/search"
            className="h-11 px-6 rounded-md border border-input bg-background text-sm font-semibold flex items-center justify-center gap-2 hover:bg-muted transition-colors"
          >
            <Search className="h-4 w-4" /> Browse Auctions
          </Link>
        </div>

        <button
          onClick={() => window.history.back()}
          className="mt-4 text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mx-auto transition-colors"
        >
          <ArrowLeft className="h-3 w-3" /> Go back
        </button>
      </div>
    </div>
  );
};

export default NotFound;
