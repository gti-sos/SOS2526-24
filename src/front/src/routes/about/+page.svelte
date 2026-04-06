<svelte:head>
  <title>About | SOS2526-24</title>
  <meta
    name="description"
    content="Project information, team members, repository, live URL and APIs for SOS2526-24."
  />
</svelte:head>

<script>
  const teamMembers = [
    {
      name: 'Isaac Rodríguez Godino',
      githubUser: '@IsaacRg25',
      githubUrl: 'https://github.com/IsaacRg25'
    },
    {
      name: 'Elena Bejarano Periñán',
      githubUser: '@elenabejper',
      githubUrl: 'https://github.com/elenabejper'
    },
    {
      name: 'María Jesús Jiménez-Espada Pallarés',
      githubUser: '@mariaajesuus',
      githubUrl: 'https://github.com/mariaajesuus'
    }
  ];

  const apiSections = [
    {
      member: 'María Jesús Jiménez-Espada Pallarés',
      url: 'https://sos2526-24.onrender.com/api/v1/average-monthly-wages'
    },
    {
      member: 'Isaac Rodríguez Godino',
      url: 'https://sos2526-24.onrender.com/api/v1/international-construccion-costs'
    },
    {
      member: 'Elena Bejarano Periñán',
      url: 'https://sos2526-24.onrender.com/api/v1/recreation-culture-expenditure'
    }
  ];
</script>

<div class="page">
  <section class="hero-shell">
    <div class="hero-card small-hero">
      <div class="hero-overlay"></div>

      <div class="hero-content">
        <div class="hero-text">
          <p class="eyebrow">Project overview</p>
          <h1>
            About<br />
            SOS2526-24
          </h1>

          <p>
            This page gathers the main information about our project: team members,
            project scope, repository, deployment, and API endpoints.
          </p>
        </div>
      </div>
    </div>
  </section>

  <section class="cards-section">
    <div class="section-heading">
      <p class="eyebrow">Project information</p>
      <h2>General overview</h2>
      <p>
        Our project integrates global datasets on construction costs, household spending
        on leisure and culture, and average monthly wages. We analyze the economic
        impact of rising construction prices between 2020/21 and 2024, exploring the
        correlation between cost increases, purchasing power, and shifts in leisure
        expenditure to identify global trends and cross-country comparisons.
      </p>
    </div>

    <div class="cards-grid">
      <article class="team-card">
        <div class="card-top">
          <h3>Team</h3>
          <span class="badge">3 members</span>
        </div>

        <div class="info-list">
          {#each teamMembers as member}
            <div class="info-item">
              <p class="item-title">{member.name}</p>
              <a href={member.githubUrl} target="_blank" rel="noreferrer">
                {member.githubUser}
              </a>
            </div>
          {/each}
        </div>
      </article>

      <article class="team-card">
        <div class="card-top">
          <h3>Repository</h3>
          <span class="badge">GitHub</span>
        </div>

        <p>
          Main source code repository for the SOS2526-24 project.
        </p>

        <div class="card-links">
          <a href="https://github.com/gti-sos/SOS2526-24" target="_blank" rel="noreferrer">
            gti-sos/SOS2526-24
          </a>
        </div>
      </article>

      <article class="team-card">
        <div class="card-top">
          <h3>Live URL</h3>
          <span class="badge">Deploy</span>
        </div>

        <p>
          Public deployment of the application.
        </p>

        <div class="card-links">
          <a href="https://sos2526-24.onrender.com/" target="_blank" rel="noreferrer">
            sos2526-24.onrender.com
          </a>
        </div>
      </article>
    </div>

    <div class="api-card">
      <div class="card-top">
        <h3>APIs</h3>
        <span class="badge">Endpoints</span>
      </div>

      <div class="api-grid">
        {#each apiSections as api}
          <article class="api-item">
            <p class="item-title">{api.member}</p>
            <a href={api.url} target="_blank" rel="noreferrer">
              {api.url}
            </a>
          </article>
        {/each}
      </div>
    </div>
  </section>
</div>

<style>

  .page {
    padding: 14px 18px 40px;
  }

  .hero-shell,
  .cards-section {
    max-width: 1420px;
    margin: 0 auto;
  }

  .hero-card {
    position: relative;
    overflow: hidden;
    border-radius: 28px;
    background:
      linear-gradient(rgba(20, 16, 14, 0.28), rgba(20, 16, 14, 0.28)),
      url('/hero-campus.jpg') center/cover no-repeat;
    box-shadow: 0 22px 60px rgba(0, 0, 0, 0.22);
  }

  .small-hero {
    min-height: 420px;
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
    min-height: 420px;
    padding: 78px 58px 48px;
  }

  .hero-text {
    max-width: 760px;
    color: #fffaf6;
  }

  .hero-text h1 {
    margin: 0 0 18px;
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: clamp(3.4rem, 6vw, 5.6rem);
    line-height: 0.92;
    font-weight: 600;
    letter-spacing: -0.03em;
  }

  .hero-text p {
    margin: 0;
    font-size: 1.08rem;
    line-height: 1.75;
    color: rgba(255, 248, 242, 0.96);
  }

  .cards-section {
    margin-top: 30px;
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
    max-width: 950px;
    line-height: 1.7;
    color: rgba(255, 245, 238, 0.95);
  }

  .cards-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 20px;
    margin-bottom: 24px;
  }

  .team-card,
  .api-card {
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
    margin-bottom: 14px;
  }

  .team-card h3,
  .api-card h3 {
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
    white-space: nowrap;
  }

  .team-card p,
  .api-card p {
    margin: 0 0 10px;
    color: #374151;
    line-height: 1.7;
  }

  .info-list,
  .api-grid {
    display: grid;
    gap: 14px;
  }

  .info-item,
  .api-item {
    background: rgba(255, 255, 255, 0.58);
    border-radius: 16px;
    padding: 14px;
  }

  .item-title {
    font-weight: 700;
    color: #111827;
    margin-bottom: 8px;
  }

  .card-links {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 18px;
  }

  .card-links a,
  .info-item a,
  .api-item a {
    display: inline-block;
    text-decoration: none;
    color: #7a1837;
    font-weight: 700;
    padding: 11px 12px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.62);
    transition: transform 0.15s ease, background 0.15s ease;
    word-break: break-word;
  }

  .card-links a:hover,
  .info-item a:hover,
  .api-item a:hover {
    transform: translateY(-1px);
    background: #ffffff;
  }

  @media (max-width: 1100px) {
    .cards-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 820px) {
    .page {
      padding: 12px 12px 30px;
    }

    .hero-content {
      padding: 54px 24px 30px;
      min-height: 340px;
    }

    .hero-text h1 {
      font-size: clamp(2.8rem, 12vw, 4.5rem);
    }

    .hero-text p {
      font-size: 1rem;
      line-height: 1.65;
    }

    .team-card,
    .api-card {
      padding: 18px;
    }
  }
</style>