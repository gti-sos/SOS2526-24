<script>
  const teamSections = [
    {
      title: "Ocio y cultura",
      emoji: "🎭",
      developer: "Elena Bejarano Periñán",
      resource: "recreation-culture-expenditure",
      frontend: "/recreation-culture-expenditure",
      apiBase: "/api/v2/recreation-culture-expenditure",
      docs: "/api/v2/recreation-culture-expenditure/docs"
    },
    {
      title: "Sueldos",
      emoji: "💶",
      developer: "María Jesús Jiménez-Espada Pallarés",
      resource: "average-monthly-wages",
      frontend: "/MJP",
      apiBase: "/api/v1/average-monthly-wages",
      docs: "/api/v1/average-monthly-wages/docs"
    },
    {
      title: "Construcción",
      emoji: "🏗️",
      developer: "Isaac Rodríguez Godino",
      resource: "international-construction-costs",
      frontend: "/international-construction-costs",
      apiBase: "/api/v1/international-construccion-costs",
      docs: "/api/v1/international-construccion-costs/docs"
    }
  ];

  const repoUrl = "https://github.com/gti-sos/SOS2526-24";
</script>

<svelte:head>
  <title>SOS2526-24 | Página Principal</title>
  <meta
    name="description"
    content="Portada del proyecto SOS2526-24 con acceso a los frontends, APIs y documentación del equipo."
  />
</svelte:head>

<section class="landing-shell">
  <div class="landing-card">
    <div class="hero-copy">
      <p class="eyebrow">API REST · JAVASCRIPT · SOS</p>
      <h1>Grupo SOS2526-24</h1>
      <p class="hero-text">
        Este proyecto expone datos de ámbito mundial relacionados con el gasto en ocio,
        los salarios y los costes de construcción, permitiendo su análisis y comparación
        a lo largo de los últimos cuatro años.
      </p>
    </div>

    <div class="hero-features">
      {#each teamSections as section}
        <article class="feature-card">
          <span class="feature-icon">{section.emoji}</span>
          <h2>{section.title}</h2>
          <p class="feature-description">{section.description}</p>

          <div class="feature-meta">
            <p><strong>Desarrollador:</strong> {section.developer}</p>
            <p><strong>Fuente de datos:</strong> {section.resource}</p>
          </div>

          <div class="card-links">
            <a href={section.frontend}>Front-end</a>
            <a href={section.apiBase}>API</a>
            <a href={section.docs}>Documentación</a>
          </div>
        </article>
      {/each}
    </div>

    <div class="hero-actions">
      <a class="primary-btn" href={repoUrl} target="_blank" rel="noreferrer">GitHub</a>
      <a class="secondary-btn" href="/about">About</a>
    </div>
  </div>
</section>

<style>
  :global(html) {
    scroll-behavior: smooth;
  }

  :global(body) {
    margin: 0;
    font-family:
      "Cascadia Code",
      "Cascadia Mono",
      "Consolas",
      "Lucida Console",
      monospace;
    background: radial-gradient(circle at top, #edf3ef 0%, #ddebe4 38%, #cfe2d8 100%);
    color: #16302c;
  }

  :global(*) {
    box-sizing: border-box;
  }

  .landing-shell {
    min-height: 100vh;
    padding: 1rem 1rem 2rem;
  }

  .landing-card {
    width: min(1500px, 100%);
    margin: 0 auto;
    padding: 3rem 2rem 3rem;
    border-radius: 28px;
    background: linear-gradient(180deg, rgba(206, 226, 220, 0.94), rgba(198, 220, 214, 0.92));
    box-shadow: 0 25px 60px rgba(61, 93, 84, 0.14);
    border: 1px solid rgba(37, 53, 49, 0.07);
  }

  .hero-copy {
    max-width: 900px;
    margin: 0 auto;
    text-align: center;
  }

  .eyebrow {
    margin: 0 0 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.16em;
    font-size: 0.95rem;
    color: #5b746e;
  }

  h1 {
    margin: 0;
    font-size: clamp(3rem, 7vw, 5.8rem);
    line-height: 1.05;
    color: #0f2d29;
  }

  .hero-text {
    max-width: 900px;
    margin: 1.5rem auto 0;
    font-size: 1rem;
    line-height: 2;
    color: #385650;
  }

  .hero-features {
    margin: 3.5rem auto 0;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1.3rem;
    max-width: 1180px;
  }

  .feature-card {
    padding: 1.8rem 1.4rem;
    text-align: center;
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.32);
    border: 1px solid rgba(37, 53, 49, 0.06);
    backdrop-filter: blur(6px);
  }

  .feature-icon {
    display: inline-flex;
    font-size: 1.6rem;
    margin-bottom: 0.8rem;
  }

  .feature-card h2 {
    margin: 0 0 0.8rem;
    font-size: 1.1rem;
    color: #193733;
  }

  .feature-description {
    margin: 0;
    color: #45615b;
    font-size: 0.95rem;
    line-height: 1.8;
  }

  .feature-meta {
    margin-top: 1rem;
    text-align: left;
    padding: 0.9rem 1rem;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.35);
    border: 1px solid rgba(37, 53, 49, 0.06);
  }

  .feature-meta p {
    margin: 0.4rem 0;
    color: #2a4641;
    font-size: 0.88rem;
    line-height: 1.6;
    word-break: break-word;
  }

  .card-links {
    margin-top: 1.2rem;
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 0.65rem;
  }

  .card-links a {
    text-decoration: none;
    padding: 0.65rem 0.95rem;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.72);
    color: #1f3d38;
    border: 1px solid rgba(37, 53, 49, 0.08);
    font-size: 0.84rem;
    transition: transform 0.2s ease, background 0.2s ease;
  }

  .card-links a:hover {
    transform: translateY(-2px);
    background: rgba(255, 255, 255, 0.9);
  }

  .hero-actions {
    display: flex;
    justify-content: center;
    gap: 1rem;
    flex-wrap: wrap;
    margin-top: 2.6rem;
  }

  .primary-btn,
  .secondary-btn {
    text-decoration: none;
    transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
    padding: 0.92rem 1.45rem;
    border-radius: 999px;
    font-size: 0.95rem;
  }

  .primary-btn {
    background: linear-gradient(135deg, #ec7a70, #f29a90);
    color: #fffaf7;
    box-shadow: 0 14px 28px rgba(236, 122, 112, 0.25);
  }

  .secondary-btn {
    background: rgba(255, 255, 255, 0.55);
    color: #21403b;
    border: 1px solid rgba(37, 53, 49, 0.08);
  }

  .primary-btn:hover,
  .secondary-btn:hover {
    transform: translateY(-2px);
  }

  @media (max-width: 960px) {
    .hero-features {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 640px) {
    .landing-card {
      padding: 2.2rem 1rem 2.2rem;
      border-radius: 22px;
    }

    h1 {
      font-size: 2.4rem;
    }

    .hero-text {
      font-size: 0.95rem;
      line-height: 1.8;
    }

    .feature-meta {
      text-align: left;
    }
  }
</style>