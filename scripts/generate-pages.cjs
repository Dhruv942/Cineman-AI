#!/usr/bin/env node
/**
 * CineMan Programmatic SEO — Page Generator
 *
 * Reads movie JSON data from /data/movies/ and generates:
 * - /public/rating/[slug].html  — Movie rating pages
 * - /public/similar/[slug].html — Similar movies pages
 * - Updates sitemap.xml with all generated pages
 *
 * Usage: node scripts/generate-pages.cjs
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data', 'movies');
const RATING_DIR = path.join(__dirname, '..', 'public', 'rating');
const SIMILAR_DIR = path.join(__dirname, '..', 'public', 'similar');
const SITEMAP_PATH = path.join(__dirname, '..', 'public', 'sitemap.xml');

const STORE_URL = 'https://chromewebstore.google.com/detail/njcngpedlikhdhhakgippnpnhokgdjci?utm_source=item-share-cb';
const BASE_URL = 'https://www.cinemanai.com';
const TODAY = new Date().toISOString().split('T')[0];

const TMDB_GENRE_MAP = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
  80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
  14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
  9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi', 53: 'Thriller',
  10752: 'War', 37: 'Western',
};

function escHtml(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function generateRatingPage(movie) {
  const title = escHtml(movie.title);
  const year = movie.year || '';
  const genres = (movie.genres || []).join(', ');
  const director = escHtml(movie.director || 'Unknown');
  const cast = (movie.cast || []).map(escHtml).join(', ');
  const overview = escHtml(movie.overview || '');
  const imdb = movie.imdb || 'N/A';
  const rt = movie.rt || 'N/A';
  const runtime = movie.runtime ? `${movie.runtime} min` : 'N/A';
  const slug = movie.slug;
  const poster = movie.poster || '';
  const rated = movie.rated || 'NR';
  const voteCount = movie.vote_count || 0;
  const tagline = escHtml(movie.tagline || '');

  // Generate unique editorial content based on ratings
  const imdbNum = parseFloat(imdb) || 0;
  let verdict = '';
  if (imdbNum >= 8.0) verdict = `With an IMDb score of ${imdb}, ${title} is widely considered one of the best films in its genre. Critics and audiences agree this is essential viewing.`;
  else if (imdbNum >= 7.0) verdict = `${title} holds a solid ${imdb} on IMDb, placing it above average and earning strong audience approval. It is well worth your time if the genre appeals to you.`;
  else if (imdbNum >= 6.0) verdict = `At ${imdb} on IMDb, ${title} is a decent watch that divides opinions. It has its strengths but may not work for everyone.`;
  else verdict = `${title} sits at ${imdb} on IMDb, suggesting mixed reception. Check your personal taste match with CineMan before committing.`;

  if (rt && rt !== 'N/A') {
    const rtNum = parseInt(rt);
    if (rtNum >= 90) verdict += ` The ${rt} Rotten Tomatoes score signals near-universal critical acclaim.`;
    else if (rtNum >= 70) verdict += ` A ${rt} on Rotten Tomatoes indicates strong critical support.`;
    else if (rtNum >= 50) verdict += ` The ${rt} Rotten Tomatoes score suggests divided critical opinion.`;
  }

  // Similar movies section
  const similarHtml = (movie.similar || []).map(s => {
    const sSlug = s.title ? s.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + (s.year || '') : '';
    const sGenres = (s.genre_ids || []).map(id => TMDB_GENRE_MAP[id]).filter(Boolean).join(', ');
    return `
                <div class="related-card" style="text-align:center;">
                    ${s.poster ? `<img src="${s.poster}" alt="${escHtml(s.title)}" style="width:100%;border-radius:8px;aspect-ratio:2/3;object-fit:cover;margin-bottom:8px;" loading="lazy" />` : ''}
                    <h4 style="margin:4px 0;font-size:14px;"><a href="/rating/${sSlug}.html" style="color:#e2e8f0;text-decoration:none;">${escHtml(s.title)}</a></h4>
                    <p style="margin:0;font-size:12px;color:#94a3b8;">${s.year || ''} &middot; IMDb ${s.vote_average ? s.vote_average.toFixed(1) : 'N/A'}</p>
                    ${sGenres ? `<p style="margin:2px 0 0;font-size:11px;color:#64748b;">${sGenres}</p>` : ''}
                </div>`;
  }).join('');

  // FAQ
  const faq1Q = `What is ${title}'s IMDb rating?`;
  const faq1A = `${title} (${year}) has an IMDb rating of ${imdb} out of 10${voteCount ? ` based on ${voteCount.toLocaleString()} user votes` : ''}.`;
  const faq2Q = `Is ${title} worth watching?`;
  const faq2A = `With an IMDb score of ${imdb}${rt !== 'N/A' ? ` and a Rotten Tomatoes score of ${rt}` : ''}, ${title} is ${imdbNum >= 7 ? 'generally well-regarded and worth your time' : 'a mixed-reception film — check your CineMan taste match for a personalised verdict'}.`;
  const faq3Q = `How long is ${title}?`;
  const faq3A = `${title} has a runtime of ${runtime}. It is rated ${rated}.`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} (${year}) — IMDb ${imdb}, Rotten Tomatoes ${rt} | CineMan</title>
    <meta name="description" content="${title} (${year}) ratings: IMDb ${imdb}/10, Rotten Tomatoes ${rt}. Directed by ${director}. ${genres}. ${runtime}. See if it matches your taste with CineMan.">
    <meta name="keywords" content="${title.toLowerCase()} rating, ${title.toLowerCase()} imdb, ${title.toLowerCase()} rotten tomatoes, is ${title.toLowerCase()} good, ${title.toLowerCase()} review">
    <link rel="canonical" href="${BASE_URL}/rating/${slug}.html">
    <meta property="og:type" content="article">
    <meta property="og:title" content="${title} (${year}) — IMDb ${imdb} | RT ${rt}">
    <meta property="og:description" content="Should you watch ${title}? IMDb ${imdb}, RT ${rt}. See your personal taste match.">
    <meta property="og:url" content="${BASE_URL}/rating/${slug}.html">
    <meta property="og:site_name" content="CineMan AI">
    <meta property="og:image" content="${poster || `${BASE_URL}/icons/icon128.png`}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title} (${year}) — IMDb ${imdb} | RT ${rt}">
    <meta name="twitter:description" content="Should you watch ${title}? IMDb ${imdb}, RT ${rt}. See your personal taste match with CineMan.">
    <meta name="twitter:image" content="${poster || `${BASE_URL}/icons/icon128.png`}">
    <link rel="icon" type="image/png" href="/icons/icon48.png">
    <link href="https://fonts.googleapis.com/css2?family=Kumbh+Sans:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/blogs/blog.css">
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "Movie",
                "name": "${title}",
                "datePublished": "${year}",
                "director": { "@type": "Person", "name": "${director}" },
                "genre": ${JSON.stringify(movie.genres || [])},
                "aggregateRating": {
                    "@type": "AggregateRating",
                    "ratingValue": "${imdb}",
                    "bestRating": "10",
                    "ratingCount": "${voteCount}"
                },
                "description": "${overview.substring(0, 200).replace(/"/g, '\\"')}",
                "image": "${poster}",
                "duration": "PT${movie.runtime || 0}M"
            },
            {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    { "@type": "ListItem", "position": 1, "name": "Home", "item": "${BASE_URL}" },
                    { "@type": "ListItem", "position": 2, "name": "Ratings", "item": "${BASE_URL}/rating/" },
                    { "@type": "ListItem", "position": 3, "name": "${title}" }
                ]
            },
            {
                "@type": "FAQPage",
                "mainEntity": [
                    { "@type": "Question", "name": "${faq1Q}", "acceptedAnswer": { "@type": "Answer", "text": "${faq1A}" } },
                    { "@type": "Question", "name": "${faq2Q}", "acceptedAnswer": { "@type": "Answer", "text": "${faq2A}" } },
                    { "@type": "Question", "name": "${faq3Q}", "acceptedAnswer": { "@type": "Answer", "text": "${faq3A}" } }
                ]
            }
        ]
    }
    </script>
</head>
<body>
    <nav class="blog-nav">
        <div class="blog-nav-inner">
            <a href="/" class="blog-nav-logo"><img src="/icons/icon48.png" alt="CineMan AI"> CineMan AI</a>
            <div class="blog-nav-links">
                <a href="/">Home</a>
                <a href="/blogs/">Blog</a>
                <a href="${STORE_URL}" class="blog-cta-button" target="_blank" rel="noopener">Add to Chrome &mdash; Free</a>
            </div>
        </div>
    </nav>

    <div class="breadcrumbs">
        <a href="/">Home</a> <span>&rsaquo;</span>
        <a href="/rating/">Ratings</a> <span>&rsaquo;</span>
        ${title} (${year})
    </div>

    <article class="blog-article">
        <h1>${title} (${year}) &mdash; IMDb, Rotten Tomatoes &amp; Audience Ratings</h1>
        <div class="blog-meta">
            <span>Last updated: ${TODAY}</span>
            <span>3 min read</span>
        </div>

        <!-- Quick Facts -->
        <div class="tldr-box">
            <h3>Quick Facts</h3>
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
                <tr><td style="padding:4px 0;color:#94a3b8;">IMDb</td><td style="padding:4px 0;font-weight:700;color:#f5c518;">${imdb}/10</td></tr>
                <tr><td style="padding:4px 0;color:#94a3b8;">Rotten Tomatoes</td><td style="padding:4px 0;font-weight:700;color:#ff4d2d;">${rt}</td></tr>
                ${movie.metacritic ? `<tr><td style="padding:4px 0;color:#94a3b8;">Metacritic</td><td style="padding:4px 0;font-weight:700;color:#66cc33;">${movie.metacritic}/100</td></tr>` : ''}
                <tr><td style="padding:4px 0;color:#94a3b8;">Director</td><td style="padding:4px 0;">${director}</td></tr>
                <tr><td style="padding:4px 0;color:#94a3b8;">Genre</td><td style="padding:4px 0;">${genres}</td></tr>
                <tr><td style="padding:4px 0;color:#94a3b8;">Runtime</td><td style="padding:4px 0;">${runtime}</td></tr>
                <tr><td style="padding:4px 0;color:#94a3b8;">Rated</td><td style="padding:4px 0;">${rated}</td></tr>
                ${cast ? `<tr><td style="padding:4px 0;color:#94a3b8;">Cast</td><td style="padding:4px 0;">${cast}</td></tr>` : ''}
            </table>
        </div>

        ${tagline ? `<p style="font-style:italic;color:#94a3b8;text-align:center;margin:20px 0;">"${tagline}"</p>` : ''}

        <h2>Should You Watch ${title}?</h2>
        <p>${verdict}</p>
        <p>${overview}</p>
        <p>Want to know if ${title} matches YOUR specific taste? <a href="${STORE_URL}" target="_blank" rel="noopener">Install CineMan</a> to see a personal taste match score based on your viewing history &mdash; not just the world average.</p>

        <h2>Ratings Breakdown</h2>
        <ul>
            <li><strong>IMDb:</strong> ${imdb}/10 from ${voteCount ? voteCount.toLocaleString() : 'N/A'} votes &mdash; the broad audience consensus.</li>
            <li><strong>Rotten Tomatoes:</strong> ${rt} &mdash; ${rt !== 'N/A' ? (parseInt(rt) >= 60 ? 'Certified Fresh by critics.' : 'mixed critical reception.') : 'score not available.'}</li>
            ${movie.metacritic ? `<li><strong>Metacritic:</strong> ${movie.metacritic}/100 &mdash; weighted critic average.</li>` : ''}
            <li><strong>TMDB:</strong> ${movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}/10 from ${voteCount ? voteCount.toLocaleString() : 'N/A'} votes.</li>
        </ul>

        ${movie.similar && movie.similar.length > 0 ? `
        <h2>Similar Movies</h2>
        <p>If you enjoyed ${title}, you might also like these films. <a href="/similar/${slug}.html">See all similar movies ranked by taste match &rarr;</a></p>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:16px;margin:16px 0;">
            ${similarHtml}
        </div>` : ''}

        <section class="faq-section">
            <h2>Frequently Asked Questions</h2>
            <div class="faq-item"><h3>${faq1Q}</h3><p>${faq1A}</p></div>
            <div class="faq-item"><h3>${faq2Q}</h3><p>${faq2A}</p></div>
            <div class="faq-item"><h3>${faq3Q}</h3><p>${faq3A}</p></div>
        </section>

        <div class="cta-box">
            <h2>See If ${title} Matches Your Taste</h2>
            <p>IMDb and RT tell you what the world thinks. CineMan tells you what YOU will think.</p>
            <a href="${STORE_URL}" class="blog-cta-button" target="_blank" rel="noopener">Add CineMan to Chrome &mdash; Free</a>
        </div>
    </article>

    <footer class="blog-footer">
        <p>&copy; 2026 <a href="/">CineMan AI</a>. All rights reserved.</p>
    </footer>
</body>
</html>`;
}

function generateSimilarPage(movie) {
  const title = escHtml(movie.title);
  const year = movie.year || '';
  const slug = movie.slug;
  const similar = movie.similar || [];

  if (similar.length === 0) return null;

  const similarRows = similar.map((s, i) => {
    const sSlug = s.title ? s.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + (s.year || '') : '';
    const sGenres = (s.genre_ids || []).map(id => TMDB_GENRE_MAP[id]).filter(Boolean).join(', ');
    return `
                <tr>
                    <td>${i + 1}</td>
                    <td><strong><a href="/rating/${sSlug}.html" style="color:#e2e8f0;text-decoration:none;">${escHtml(s.title)}</a></strong></td>
                    <td>${s.year || ''}</td>
                    <td>${s.vote_average ? s.vote_average.toFixed(1) : 'N/A'}</td>
                    <td>${sGenres}</td>
                </tr>`;
  }).join('');

  const quickAnswer = similar.length >= 3
    ? `If you loved ${title}, start with ${escHtml(similar[0].title)}, ${escHtml(similar[1].title)}, and ${escHtml(similar[2].title)}.`
    : `If you loved ${title}, try ${similar.map(s => escHtml(s.title)).join(', ')}.`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Movies Like ${title} — ${similar.length} Similar Picks With Ratings | CineMan</title>
    <meta name="description" content="Loved ${title}? Here are ${similar.length} similar movies ranked by ratings. Find your next watch with CineMan.">
    <meta name="keywords" content="movies like ${title.toLowerCase()}, films similar to ${title.toLowerCase()}, ${title.toLowerCase()} recommendations">
    <link rel="canonical" href="${BASE_URL}/similar/${slug}.html">
    <meta property="og:type" content="article">
    <meta property="og:title" content="Movies Like ${title} — ${similar.length} Similar Picks">
    <meta property="og:description" content="${quickAnswer}">
    <meta property="og:url" content="${BASE_URL}/similar/${slug}.html">
    <meta property="og:site_name" content="CineMan AI">
    <meta property="og:image" content="${movie.poster || `${BASE_URL}/icons/icon128.png`}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="Movies Like ${title}">
    <meta name="twitter:description" content="${quickAnswer}">
    <link rel="icon" type="image/png" href="/icons/icon48.png">
    <link href="https://fonts.googleapis.com/css2?family=Kumbh+Sans:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/blogs/blog.css">
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "ItemList",
                "name": "Movies Similar to ${title}",
                "numberOfItems": ${similar.length},
                "itemListElement": [${similar.map((s, i) => `
                    { "@type": "ListItem", "position": ${i + 1}, "name": "${escHtml(s.title)}" }`).join(',')}
                ]
            },
            {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    { "@type": "ListItem", "position": 1, "name": "Home", "item": "${BASE_URL}" },
                    { "@type": "ListItem", "position": 2, "name": "Similar", "item": "${BASE_URL}/similar/" },
                    { "@type": "ListItem", "position": 3, "name": "Movies Like ${title}" }
                ]
            },
            {
                "@type": "FAQPage",
                "mainEntity": [
                    { "@type": "Question", "name": "What movie is most similar to ${title}?", "acceptedAnswer": { "@type": "Answer", "text": "${escHtml(similar[0]?.title || 'N/A')} is the closest match based on genre, themes, and audience reception." } },
                    { "@type": "Question", "name": "Are there movies like ${title} on Netflix?", "acceptedAnswer": { "@type": "Answer", "text": "Streaming availability changes monthly. Install CineMan to see which similar titles are currently on Netflix, Prime Video, or Disney+ in your region." } }
                ]
            }
        ]
    }
    </script>
</head>
<body>
    <nav class="blog-nav">
        <div class="blog-nav-inner">
            <a href="/" class="blog-nav-logo"><img src="/icons/icon48.png" alt="CineMan AI"> CineMan AI</a>
            <div class="blog-nav-links">
                <a href="/">Home</a>
                <a href="/blogs/">Blog</a>
                <a href="${STORE_URL}" class="blog-cta-button" target="_blank" rel="noopener">Add to Chrome &mdash; Free</a>
            </div>
        </div>
    </nav>

    <div class="breadcrumbs">
        <a href="/">Home</a> <span>&rsaquo;</span>
        <a href="/similar/">Similar</a> <span>&rsaquo;</span>
        Movies Like ${title}
    </div>

    <article class="blog-article">
        <h1>Movies Like ${title} &mdash; ${similar.length} Similar Picks With Ratings</h1>
        <div class="blog-meta">
            <span>Last updated: ${TODAY}</span>
            <span>2 min read</span>
        </div>

        <div class="tldr-box">
            <h3>Quick Answer</h3>
            <p>${quickAnswer} Use <a href="${STORE_URL}" target="_blank" rel="noopener">CineMan's Similar Search</a> to find more titles ranked by your personal taste.</p>
        </div>

        <h2>${similar.length} Movies Similar to ${title}</h2>
        <div style="overflow-x:auto;">
        <table class="comparison-table">
            <thead>
                <tr><th>#</th><th>Title</th><th>Year</th><th>Rating</th><th>Genres</th></tr>
            </thead>
            <tbody>
                ${similarRows}
            </tbody>
        </table>
        </div>

        <h2>Find More Like ${title} With CineMan</h2>
        <p>These recommendations are based on genre and audience overlap. CineMan goes further &mdash; it re-ranks similar titles by YOUR personal taste profile. A hidden gem with a 95% taste match is worth more than a famous film that does not fit your style.</p>
        <p>Open CineMan, go to Similar Search, type "${title}", and see results ranked by what you will actually enjoy.</p>

        <section class="faq-section">
            <h2>Frequently Asked Questions</h2>
            <div class="faq-item">
                <h3>What movie is most similar to ${title}?</h3>
                <p>${escHtml(similar[0]?.title || 'N/A')} is the closest match based on genre, themes, and audience reception.</p>
            </div>
            <div class="faq-item">
                <h3>Are there movies like ${title} on Netflix?</h3>
                <p>Streaming availability changes monthly. Install CineMan to see which similar titles are currently on Netflix, Prime Video, or Disney+ in your region.</p>
            </div>
        </section>

        <div class="cta-box">
            <h2>Find Your Perfect Match</h2>
            <p>CineMan's Similar Search finds titles like ${title} and ranks them by your taste. Not generic lists &mdash; personal picks.</p>
            <a href="${STORE_URL}" class="blog-cta-button" target="_blank" rel="noopener">Add CineMan to Chrome &mdash; Free</a>
        </div>

        <section class="related-posts">
            <h2>Related</h2>
            <div class="related-grid">
                <a href="/rating/${slug}.html" class="related-card">
                    <h3>${title} (${year}) &mdash; Full Ratings</h3>
                    <p>IMDb ${movie.imdb || 'N/A'}, RT ${movie.rt || 'N/A'}. Director, cast, and more.</p>
                </a>
                <a href="/blogs/how-to-find-similar-movies-cineman.html" class="related-card">
                    <h3>How to Find Similar Movies With CineMan</h3>
                    <p>Search any title and get results ranked by your taste profile.</p>
                </a>
                <a href="/genre/" class="related-card">
                    <h3>Browse by Genre</h3>
                    <p>Explore the best movies across 19 genres, ranked by ratings.</p>
                </a>
            </div>
        </section>
    </article>

    <footer class="blog-footer">
        <p>&copy; 2026 <a href="/">CineMan AI</a>. All rights reserved.</p>
    </footer>
</body>
</html>`;
}

function main() {
  console.log('🎬 CineMan Page Generator');

  // Read all movie JSON files
  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json') && !f.startsWith('_'));
  console.log(`📂 Found ${files.length} movie data files`);

  if (files.length === 0) {
    console.log('❌ No movie data found. Run fetch-movie-data.cjs first.');
    process.exit(1);
  }

  fs.mkdirSync(RATING_DIR, { recursive: true });
  fs.mkdirSync(SIMILAR_DIR, { recursive: true });

  let ratingCount = 0;
  let similarCount = 0;
  const sitemapEntries = [];

  for (const file of files) {
    const movie = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8'));

    // Generate rating page
    const ratingHtml = generateRatingPage(movie);
    fs.writeFileSync(path.join(RATING_DIR, `${movie.slug}.html`), ratingHtml);
    ratingCount++;
    sitemapEntries.push(`  <url><loc>${BASE_URL}/rating/${movie.slug}.html</loc><lastmod>${TODAY}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>`);

    // Generate similar page (only if has similar movies)
    const similarHtml = generateSimilarPage(movie);
    if (similarHtml) {
      fs.writeFileSync(path.join(SIMILAR_DIR, `${movie.slug}.html`), similarHtml);
      similarCount++;
      sitemapEntries.push(`  <url><loc>${BASE_URL}/similar/${movie.slug}.html</loc><lastmod>${TODAY}</lastmod><changefreq>monthly</changefreq><priority>0.5</priority></url>`);
    }
  }

  // Update sitemap — append programmatic pages
  let sitemap = fs.readFileSync(SITEMAP_PATH, 'utf8');

  // Remove old programmatic entries if re-running
  sitemap = sitemap.replace(/\n\s*<!-- Programmatic Pages -->[\s\S]*?(?=<\/urlset>)/, '\n');

  // Add new entries before closing tag
  const programmaticBlock = `\n  <!-- Programmatic Pages (auto-generated from TMDB data) -->\n${sitemapEntries.join('\n')}\n`;
  sitemap = sitemap.replace('</urlset>', programmaticBlock + '</urlset>');

  fs.writeFileSync(SITEMAP_PATH, sitemap);

  console.log(`\n✅ Generated:`);
  console.log(`   📄 ${ratingCount} rating pages in /public/rating/`);
  console.log(`   📄 ${similarCount} similar pages in /public/similar/`);
  console.log(`   🗺️  Sitemap updated with ${sitemapEntries.length} new entries`);
}

main();
