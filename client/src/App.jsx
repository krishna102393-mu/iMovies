
import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import MovieCard from "./components/MovieCard";
import "./App.css";

function App() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;

    fetch("http://localhost:5000/api/movies")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Movies are temporarily unavailable.");
        }
        return response.json();
      })
      .then((data) => {
        if (!active) return;
        setMovies(Array.isArray(data.movies) ? data.movies : []);
        setError("");
      })
      .catch((err) => {
        if (!active) return;
        console.error("Error fetching movies:", err);
        setError("We couldn't connect to the movie collection.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredMovies = movies.filter((movie) =>
    movie.title?.toLowerCase().includes(search.toLowerCase().trim())
  );

  const scrollToMovies = () => {
    document.getElementById("movies")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className="imovies-app">
      <Navbar />

      <main>
        <section className="cinema-hero">
          <div className="hero-backdrop" />

          <div className="hero-content">
            <span className="hero-eyebrow">
              <span className="live-dot" />
              YOUR NEXT MOVIE NIGHT STARTS HERE
            </span>

            <h1>
              Every story.
              <br />
              <span>One destination.</span>
            </h1>

            <p className="hero-description">
              Discover unforgettable movies, find your perfect seats,
              and make every movie night special.
            </p>

            <div className="hero-actions">
              <button className="primary-button" onClick={scrollToMovies}>
                Explore movies <span aria-hidden="true">↗</span>
              </button>

              <button className="secondary-button" onClick={scrollToMovies}>
                Discover what's showing
              </button>
            </div>

            <div className="hero-footnote">
              <span>✦</span> Your cinema experience, reimagined.
            </div>
          </div>

          <div className="hero-bottom-fade" />
        </section>

        <section className="movies-section" id="movies">
          <div className="section-heading">
            <div>
              <div className="section-kicker">FIND YOUR NEXT FAVORITE</div>
              <h2>
                Now <span>showing</span>
              </h2>
              <p className="section-subtitle">
                Stories worth watching on the big screen.
              </p>
            </div>

            <div className="movie-count">
              <span>{loading ? "—" : filteredMovies.length}</span>
              <span className="count-label">MOVIES</span>
            </div>
          </div>

          <div className="movie-toolbar">
            <label className="movie-search">
              <span aria-hidden="true">⌕</span>
              <input
                type="search"
                placeholder="Search for a movie..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Search movies by title"
              />
              {search && (
                <button
                  className="clear-search"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </label>

            <span className="toolbar-note">
              <span className="live-dot" /> THE BIG SCREEN EXPERIENCE
            </span>
          </div>

          {loading && (
            <div className="movie-message">
              <div className="loading-spinner" />
              <h3>Finding your next favorite</h3>
              <p>Getting the latest movies ready for you...</p>
            </div>
          )}

          {!loading && error && (
            <div className="movie-message error-message">
              <div className="message-icon">◈</div>
              <h3>The show must go on.</h3>
              <p>{error} Please try again in a moment.</p>
              <button
                className="primary-button"
                onClick={() => window.location.reload()}
              >
                Try again ↻
              </button>
            </div>
          )}

          {!loading && !error && filteredMovies.length === 0 && (
            <div className="movie-message">
              <div className="message-icon">⌕</div>
              <h3>
                {search ? "No matching movies" : "The screen is quiet"}
              </h3>
              <p>
                {search
                  ? "Try another movie title."
                  : "There are no movies to display right now."}
              </p>
              {search && (
                <button
                  className="secondary-button"
                  onClick={() => setSearch("")}
                >
                  Clear search
                </button>
              )}
            </div>
          )}

          {!loading && !error && filteredMovies.length > 0 && (
            <div className="movies-grid">
              {filteredMovies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          )}
        </section>

        <section className="experience-banner">
          <div className="experience-symbol">✦</div>
          <div>
            <span className="section-kicker">MAKE IT A MOVIE NIGHT</span>
            <h2>Great movies. Better memories.</h2>
            <p>Your next favourite film is just a ticket away.</p>
          </div>
          <button className="primary-button" onClick={scrollToMovies}>
            Find a movie ↗
          </button>
        </section>
      </main>

      <footer className="site-footer">
        <a href="/" className="footer-brand">
          i<span>Movies</span>
        </a>
        <p>Made for the love of cinema.</p>
        <span>© {new Date().getFullYear()} iMovies</span>
      </footer>
    </div>
  );
}

export default App;
