#!/usr/bin/env node
/**
 * CineMan Programmatic SEO — Movie Data Fetcher
 *
 * Fetches top 200 popular movies from TMDB with full metadata.
 * Saves as individual JSON files in /data/movies/
 * Respects TMDB rate limit (40 req/10s) with built-in throttling.
 *
 * Usage: node scripts/fetch-movie-data.js
 */

const fs = require('fs');
const path = require('path');

const TMDB_KEY = '15f507cbb262b78f877220a541ed6ca3';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const OMDB_KEY = 'a2e700b9';
const OMDB_URL = 'https://www.omdbapi.com';
const DATA_DIR = path.join(__dirname, '..', 'data', 'movies');
const TOTAL_PAGES = 10; // 20 movies per page × 10 = 200 movies

// Rate limiting
let requestCount = 0;
let windowStart = Date.now();

async function throttledFetch(url) {
  // TMDB: 40 requests per 10 seconds
  requestCount++;
  if (requestCount >= 35) { // Leave headroom
    const elapsed = Date.now() - windowStart;
    if (elapsed < 10000) {
      const wait = 10000 - elapsed + 500;
      console.log(`  ⏳ Rate limit pause (${Math.round(wait/1000)}s)...`);
      await new Promise(r => setTimeout(r, wait));
    }
    requestCount = 0;
    windowStart = Date.now();
  }

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const resp = await fetch(url);
      if (!resp.ok) {
        if (resp.status === 429) {
          console.log('  ⚠️ Rate limited, waiting 15s...');
          await new Promise(r => setTimeout(r, 15000));
          requestCount = 0;
          windowStart = Date.now();
          return throttledFetch(url);
        }
        throw new Error(`HTTP ${resp.status}`);
      }
      return await resp.json();
    } catch (err) {
      if (attempt < 2) {
        console.log(`  🔄 Retry ${attempt + 1}/3: ${err.message}`);
        await new Promise(r => setTimeout(r, 2000));
      } else {
        throw err;
      }
    }
  }
}

function slugify(title, year) {
  const slug = (title || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return year ? `${slug}-${year}` : slug;
}

async function fetchOMDB(title) {
  try {
    const resp = await fetch(`${OMDB_URL}?t=${encodeURIComponent(title)}&apikey=${OMDB_KEY}`);
    const data = await resp.json();
    if (data.Response === 'False') return null;

    let rt = null;
    if (data.Ratings) {
      const rtEntry = data.Ratings.find(r => r.Source === 'Rotten Tomatoes');
      if (rtEntry) rt = rtEntry.Value;
    }

    return {
      imdb: data.imdbRating !== 'N/A' ? data.imdbRating : null,
      rt: rt,
      metacritic: data.Metascore !== 'N/A' ? data.Metascore : null,
      imdbVotes: data.imdbVotes,
      rated: data.Rated,
      awards: data.Awards,
      boxOffice: data.BoxOffice,
    };
  } catch (e) {
    return null;
  }
}

async function fetchMovieDetails(id) {
  const [details, credits, similar] = await Promise.all([
    throttledFetch(`${TMDB_BASE}/movie/${id}?api_key=${TMDB_KEY}&language=en-US`),
    throttledFetch(`${TMDB_BASE}/movie/${id}/credits?api_key=${TMDB_KEY}&language=en-US`),
    throttledFetch(`${TMDB_BASE}/movie/${id}/recommendations?api_key=${TMDB_KEY}&language=en-US&page=1`),
  ]);

  const director = credits.crew?.find(c => c.job === 'Director');
  const cast = (credits.cast || []).slice(0, 5).map(c => c.name);
  const similarMovies = (similar.results || []).slice(0, 8).map(s => ({
    id: s.id,
    title: s.title,
    year: (s.release_date || '').substring(0, 4),
    poster: s.poster_path ? `https://image.tmdb.org/t/p/w185${s.poster_path}` : null,
    vote_average: s.vote_average,
    genre_ids: s.genre_ids,
  }));

  return {
    id: details.id,
    title: details.title,
    year: (details.release_date || '').substring(0, 4),
    overview: details.overview,
    poster: details.poster_path ? `https://image.tmdb.org/t/p/w342${details.poster_path}` : null,
    backdrop: details.backdrop_path ? `https://image.tmdb.org/t/p/w780${details.backdrop_path}` : null,
    genres: (details.genres || []).map(g => g.name),
    runtime: details.runtime,
    vote_average: details.vote_average,
    vote_count: details.vote_count,
    tagline: details.tagline,
    original_language: details.original_language,
    production_countries: (details.production_countries || []).map(c => c.name),
    director: director?.name || null,
    cast,
    similar: similarMovies,
    slug: slugify(details.title, (details.release_date || '').substring(0, 4)),
  };
}

async function main() {
  console.log('🎬 CineMan Movie Data Fetcher');
  console.log(`📂 Output: ${DATA_DIR}`);
  console.log(`🎯 Target: ${TOTAL_PAGES * 20} movies\n`);

  fs.mkdirSync(DATA_DIR, { recursive: true });

  // Check for existing data to allow resuming
  const existing = new Set(
    fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''))
  );
  console.log(`📦 ${existing.size} movies already fetched\n`);

  const allMovies = [];

  // Fetch popular movies from TMDB
  for (let page = 1; page <= TOTAL_PAGES; page++) {
    console.log(`📄 Page ${page}/${TOTAL_PAGES}...`);
    const data = await throttledFetch(
      `${TMDB_BASE}/discover/movie?api_key=${TMDB_KEY}&language=en-US&sort_by=popularity.desc&page=${page}&vote_count.gte=1000&include_adult=false`
    );

    for (const movie of data.results) {
      const year = (movie.release_date || '').substring(0, 4);
      const slug = slugify(movie.title, year);

      // Skip if already fetched
      if (existing.has(slug)) {
        console.log(`  ⏭️  ${movie.title} (${year}) — cached`);
        const cached = JSON.parse(fs.readFileSync(path.join(DATA_DIR, `${slug}.json`), 'utf8'));
        allMovies.push(cached);
        continue;
      }

      console.log(`  🎬 ${movie.title} (${year})...`);

      try {
        // Fetch TMDB details + OMDB ratings
        const [tmdbData, omdbData] = await Promise.all([
          fetchMovieDetails(movie.id),
          fetchOMDB(movie.title),
        ]);

        const movieData = {
          ...tmdbData,
          imdb: omdbData?.imdb || (movie.vote_average ? movie.vote_average.toFixed(1) : null),
          rt: omdbData?.rt || null,
          metacritic: omdbData?.metacritic || null,
          imdbVotes: omdbData?.imdbVotes || null,
          rated: omdbData?.rated || null,
          fetchedAt: new Date().toISOString(),
        };

        // Save individual JSON
        fs.writeFileSync(
          path.join(DATA_DIR, `${slug}.json`),
          JSON.stringify(movieData, null, 2)
        );

        allMovies.push(movieData);
      } catch (err) {
        console.error(`  ❌ Failed: ${movie.title} — ${err.message}`);
      }
    }
  }

  // Save index file
  const index = allMovies.map(m => ({
    slug: m.slug,
    title: m.title,
    year: m.year,
    imdb: m.imdb,
    rt: m.rt,
    genres: m.genres,
    poster: m.poster,
  }));

  fs.writeFileSync(
    path.join(DATA_DIR, '_index.json'),
    JSON.stringify(index, null, 2)
  );

  console.log(`\n✅ Done! ${allMovies.length} movies saved to ${DATA_DIR}`);
  console.log(`📋 Index: ${path.join(DATA_DIR, '_index.json')}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
