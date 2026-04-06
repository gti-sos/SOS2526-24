<svelte:head>
  <title>Grupo SOS2526-24</title>
  <meta
    name="description"
    content="Proyecto SOS2526-24 sobre ocio y cultura, sueldos y costes internacionales de construcción."
  />
</svelte:head>

<script>
  const teamSections = [
    {
      short: "EBP",
      emoji: "🎭",
      member: "Elena Bejarano Periñán",
      resource: "recreation-culture-expenditure",
      frontend: "/recreation-culture-expenditure",
      apiBase: "/api/v2/recreation-culture-expenditure",
      docs: "/api/v2/recreation-culture-expenditure/docs",
      label: "Ocio y cultura"
    },
    {
      short: "MJP",
      emoji: "💶",
      member: "María Jesús Jiménez-Espada Pallarés",
      resource: "average-monthly-wages",
      frontend: "/MJP",
      apiBase: "/api/v1/average-monthly-wages",
      docs: "/api/v1/average-monthly-wages/docs",
      label: "Sueldos"
    },
    {
      short: "IRG",
      emoji: "🏗️",
      member: "Isaac Rodríguez Godino",
      resource: "international-construction-costs",
      frontend: "/international-construction-costs",
      apiBase: "/api/v1/international-construction-costs",
      docs: "/api/v1/international-construction-costs/docs",
      label: "Construcción"
    }
  ];

  const repoUrl = "https://github.com/gti-sos/SOS2526-24";
</script>

<section class="landing-page">
  <section class="hero-block">
    <p class="hero-eyebrow">API REST · JAVASCRIPT · SOS</p>
    <h1>Grupo SOS2526-24</h1>
    <p class="hero-description">
      Este proyecto expone datos de ámbito mundial relacionados con el gasto en ocio,
      los salarios y los costes de construcción, permitiendo su análisis y comparación
      a lo largo de los últimos cuatro años.
    </p>
  </section>

  <section class="cards-section">
    {#each teamSections as section}
      <article class="team-card">
        <div class="card-icon">{section.emoji}</div>
        <h2>{section.label}</h2>

        <div class="card-meta">
          <p><strong>Desarrollador:</strong> {section.member}</p>
          <p>
            <strong>Fuente de datos:</strong>
            <span class="dataset-badge">{section.resource}</span>
          </p>
        </div>

        <div class="card-links">
          <a href={section.frontend}>Front-end</a>
          <a href={section.apiBase}>API</a>
          <a href={section.docs}>Documentación</a>
        </div>
      </article>
    {/each}
  </section>

  <div class="bottom-links">
    <a class="repo-button" href={repoUrl} target="_blank" rel="noreferrer">GitHub</a>
    <a class="about-button" href="/about">About</a>
  </div>
</section>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Cormorant+Garamond:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

  .landing-page {
    width: min(1280px, calc(100% - 3rem));
    margin: 0 auto;
    padding: 2.2rem 0 3.2rem;
    color: #193634;
    font-family: "Inter", sans-serif;
    font-weight: 400;
  }

  .hero-block {
    text-align: center;
    padding: 1.4rem 0 2.2rem;
  }

  .hero-eyebrow {
    margin: 0 0 1rem;
    font-size: 1rem;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: #56716d;
  }

  .hero-block h1 {
    margin: 0 0 1.3rem;
    font-family: "Cormorant Garamond", serif;
    font-size: clamp(3.8rem, 6.5vw, 5.8rem);
    line-height: 1.08;
    font-weight: 700;
    color: #062b28;
    letter-spacing: -0.015em;
    text-wrap: balance;
  }

  .hero-description {
    width: min(920px, 100%);
    margin: 0 auto;
    font-size: 1.2rem;
    line-height: 1.75;
    color: #385754;
  }

  .cards-section {
    display: grid;
    grid-template-columns: repeat(3, minmax(260px, 1fr));
    gap: 1.35rem;
    margin-top: 2rem;
  }

  .team-card {
    padding: 1.7rem 1.35rem 1.5rem;
    border-radius: 24px;
    background: rgba(237, 244, 241, 0.72);
    box-shadow: 0 12px 28px rgba(63, 87, 81, 0.08);
    backdrop-filter: blur(4px);
    text-align: center;
  }

  .card-icon {
    font-size: 1.8rem;
    margin-bottom: 0.8rem;
  }

  .team-card h2 {
    margin: 0 0 1rem;
    font-size: 1.85rem;
    color: #1d3c39;
    font-weight: 700;
  }

  .card-meta {
    background: rgba(226, 236, 232, 0.9);
    border-radius: 18px;
    padding: 1rem 1rem 0.9rem;
    margin-bottom: 1.1rem;
    text-align: left;
    line-height: 1.7;
    color: #36524e;
    font-size: 0.98rem;
  }

  .card-meta strong {
    color: #173632;
  }

  .dataset-badge {
    display: inline-block;
    margin-left: 0.35rem;
    padding: 0.12rem 0.55rem;
    border-radius: 999px;
    background: rgba(111, 168, 128, 0.22);
    border: 1px solid rgba(82, 136, 98, 0.22);
    color: #245f36;
    font-family: "IBM Plex Mono", monospace;
    font-size: 0.95rem;
    font-weight: 500;
    word-break: break-word;
  }

  .card-links {
    display: flex;
    justify-content: center;
    gap: 0.7rem;
    flex-wrap: wrap;
  }

  .card-links a,
  .repo-button,
  .about-button {
    text-decoration: none;
    border-radius: 999px;
    padding: 0.82rem 1.05rem;
    font-size: 0.95rem;
    transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
  }

  .card-links a {
    background: rgba(255, 255, 255, 0.86);
    color: #37524d;
  }

  .card-links a:hover,
  .repo-button:hover,
  .about-button:hover {
    transform: translateY(-1px);
  }

  .bottom-links {
    display: flex;
    justify-content: center;
    gap: 0.9rem;
    margin-top: 2rem;
    flex-wrap: wrap;
  }

  .repo-button {
    background: linear-gradient(135deg, #ec7a70, #f28d84);
    color: #fffaf7;
    box-shadow: 0 12px 24px rgba(236, 122, 112, 0.2);
  }

  .about-button {
    background: rgba(255, 255, 255, 0.76);
    color: #3d5b56;
  }

  @media (max-width: 1000px) {
    .cards-section {
      grid-template-columns: 1fr;
    }

    .landing-page {
      width: min(100% - 1.4rem, 1280px);
    }

    .hero-block h1 {
      font-size: clamp(3.2rem, 11vw, 4.8rem);
      line-height: 1.1;
    }
  }
</style>