<svelte:head>
  <title>SOS2526-24</title>
  <meta
    name="description"
    content="Global analysis of construction costs, wages and leisure expenditure."
  />
</svelte:head>

<script>
  const teamSections = [
    {
      short: 'MJP',
      member: 'María Jesús Jiménez-Espada Pallarés',
      resource: 'average-monthly-wages',
      frontend: '/MJP',
      api: '/api/v2/average-monthly-wages',
      docs: '/api/v2/average-monthly-wages/docs'
    },
    {
      short: 'IRG',
      member: 'Isaac Rodríguez Godino',
     
      resource: 'international-construction-costs',
      frontend: '/international-construction-costs',
      
      api: '/api/v2/international-construction-costs',
      docs: '/api/v2/international-construction-costs/docs'
    },
    {
      short: 'EBP',
      member: 'Elena Bejarano Periñán',
      resource: 'recreation-culture-expenditure',
      frontend: '/recreation-culture-expenditure',
      api: '/api/v1/recreation-culture-expenditure',
      docs: '/api/v1/recreation-culture-expenditure/docs'
    }
  ];
</script>

<div class="page">
  <section class="hero-shell">
    <div class="hero-card">
      <div class="hero-overlay"></div>

      <div class="hero-content" id="about">
        <div class="hero-text">
          <h1>
            Welcome to <br />
            SOS2526-24
          </h1>

          <p>
            Our project integrates global datasets on construction costs, household
            spending on leisure and culture, and average monthly wages. We analyze the
            economic impact of rising construction prices between 2020/21 and 2024,
            exploring the correlation between cost increases, purchasing power, and
            shifts in leisure expenditure to identify global trends and cross-country
            comparisons.
          </p>
        </div>
      </div>
    </div>
  </section>

  <section class="cards-section" id="cards">
    <div class="section-heading">
      <p class="eyebrow">Main project links</p>
      <h2>Team resources</h2>
      <p>
        Aquí se proporcionan los enlaces: front-end, URL base de la API,
        documentación de Postman; e información de cada integrante.
      </p>
    </div>

    <div class="cards-grid">
      {#each teamSections as section}
        <article class="team-card">
          <div class="card-top">
            <h3>{section.short}</h3>
            <span class="badge">{section.short}</span>
          </div>

          <p><strong>Integrante:</strong> {section.member}</p>
          <p><strong>Fuente de datos:</strong> <code>{section.resource}</code></p>

          <div class="card-links">
            <a href={section.frontend}>🎨 Front-end</a>
            <a href={section.api} target="_blank" rel="noreferrer">🔌 API Base</a>
            <a href={section.docs} target="_blank" rel="noreferrer">📄 Postman Docs</a>
          </div>
        </article>
      {/each}
    </div>
  </section>
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Cormorant+Garamond:wght@500;600;700&display=swap');

  :global(html) {
    scroll-behavior: smooth;
  }

  :global(body) {
    margin: 0;
    font-family: 'Inter', system-ui, sans-serif;
    color: #111827;
    background:
      radial-gradient(circle at 48% 38%, rgba(255, 255, 255, 0.92) 0%, rgba(255, 255, 255, 0.38) 18%, rgba(255, 255, 255, 0) 34%),
      linear-gradient(90deg, #8b0f45 0%, #b74263 22%, #f4d7cf 50%, #d98a67 76%, #c96b4b 100%);
    min-height: 100vh;
  }

  .page {
    padding: 14px 18px 40px;
  }

  .hero-shell {
    max-width: 1420px;
    margin: 0 auto;
  }

  .hero-card {
    position: relative;
    min-height: 760px;
    overflow: hidden;
    border-radius: 28px;
    background:
      linear-gradient(rgba(20, 16, 14, 0.28), rgba(20, 16, 14, 0.28)),
      url('/hero-campus.jpg') center/cover no-repeat;
    box-shadow: 0 22px 60px rgba(0, 0, 0, 0.22);
  }

  .hero-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      90deg,
      rgba(0, 0, 0, 0.52) 0%,
      rgba(0, 0, 0, 0.22) 40%,
      rgba(0, 0, 0, 0.12) 100%
    );
    pointer-events: none;
  }

  .hero-content {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: flex-start;
    min-height: 760px;
    padding: 110px 58px 58px;
  }

  .hero-text {
    max-width: 700px;
    color: #fffaf6;
  }

  .hero-text h1 {
    margin: 0 0 18px;
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: clamp(4.2rem, 8vw, 7rem);
    line-height: 0.88;
    font-weight: 600;
    letter-spacing: -0.03em;
  }

  .hero-text p {
    margin: 0;
    max-width: 860px;
    font-size: 1.12rem;
    line-height: 1.75;
    color: rgba(255, 248, 242, 0.96);
  }

  .cards-section {
    max-width: 1420px;
    margin: 30px auto 0;
  }

  .section-heading {
    margin-bottom: 20px;
    color: #fff7f2;
  }

  .eyebrow {
    margin: 0 0 8px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 0.82rem;
    font-weight: 700;
    color: rgba(255, 247, 241, 0.88);
  }

  .section-heading h2 {
    margin: 0 0 10px;
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: clamp(2.2rem, 4vw, 3.4rem);
    font-weight: 600;
    color: #fff9f5;
  }

  .section-heading p {
    margin: 0;
    max-width: 900px;
    line-height: 1.7;
    color: rgba(255, 245, 238, 0.95);
  }

  .cards-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 20px;
  }

  .team-card {
    background: rgba(250, 245, 239, 0.94);
    border: 1px solid rgba(255, 255, 255, 0.32);
    border-radius: 24px;
    padding: 22px;
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(8px);
  }

  .card-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
  }

  .team-card h3 {
    margin: 0;
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 2rem;
    line-height: 1;
    color: #111827;
  }

  .badge {
    background: #efe3b1;
    color: #111827;
    border-radius: 999px;
    padding: 7px 12px;
    font-size: 0.8rem;
    font-weight: 700;
  }

  .team-card p {
    margin: 0 0 10px;
    color: #374151;
    line-height: 1.6;
  }

  .team-card code {
    background: #f7eee7;
    color: #7a1837;
    padding: 0.14rem 0.42rem;
    border-radius: 8px;
    font-size: 0.84rem;
  }

  .card-links {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 18px;
  }

  .card-links a {
    display: block;
    text-decoration: none;
    color: #7a1837;
    font-weight: 700;
    padding: 11px 12px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.62);
    transition: transform 0.15s ease, background 0.15s ease;
  }

  .card-links a:hover {
    transform: translateY(-1px);
    background: #ffffff;
  }

  @media (max-width: 1100px) {
    .hero-card {
      min-height: 680px;
    }

    .cards-grid {
      grid-template-columns: 1fr;
    }

    .hero-text {
      max-width: 100%;
    }
  }

  @media (max-width: 820px) {
    .hero-content {
      padding: 70px 24px 28px;
      min-height: 560px;
    }

    .hero-text h1 {
      font-size: clamp(3.2rem, 12vw, 5rem);
    }

    .hero-text p {
      font-size: 1rem;
      line-height: 1.65;
    }
  }
</style>