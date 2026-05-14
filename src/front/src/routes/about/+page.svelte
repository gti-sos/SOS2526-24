<svelte:head>
  <title>About | SOS2526-24</title>
  <meta
    name="description"
    content="Información del proyecto SOS2526-24: equipo, descripción, repositorio, despliegue, APIs, documentación y vídeos."
  />

  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link
    href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&display=swap"
    rel="stylesheet"
  />
</svelte:head>

<script>
  const repoUrl = "https://github.com/gti-sos/SOS2526-24";
  const renderUrl = "https://sos2526-24.onrender.com/";

  const projectDescription =
    "Our project integrates global datasets on construction costs, household spending on leisure and culture, and average monthly wages. We analyze the economic impact of rising construction prices between 2020/21 and 2024, exploring the correlation between cost increases, purchasing power, and shifts in leisure expenditure to identify global trends and cross-country comparisons.";

  const teamMembers = [
    {
      name: "Isaac Rodríguez Godino",
      githubUser: "@IsaacRg25",
      githubUrl: "https://github.com/IsaacRg25",
      icon: "🏗️",
      resource: "international-construction-costs",
      datasetName: "Costes internacionales de construcción",
      videoUrl: "https://youtu.be/m0RpH_ZxN38",
      apis: [
        {
          version: "v1",
          apiUrl:
            "https://sos2526-24.onrender.com/api/v1/international-construction-costs",
          docsUrl:
            "https://sos2526-24.onrender.com/api/v2/international-construction-costs/docs"
        }
      ]
    },
    {
      name: "Elena Bejarano Periñán",
      githubUser: "@elenabejper",
      githubUrl: "https://github.com/elenabejper",
      icon: "🎭",
      resource: "recreation-culture-expenditure",
      datasetName: "Gasto en ocio y cultura",
      videoUrl: "https://youtu.be/SWPj_xQpAWc",
      apis: [
        {
          version: "v1",
          apiUrl:
            "https://sos2526-24.onrender.com/api/v1/recreation-culture-expenditure",
          docsUrl:
            "https://sos2526-24.onrender.com/api/v1/recreation-culture-expenditure/docs"
        },
        {
          version: "v2",
          apiUrl:
            "https://sos2526-24.onrender.com/api/v2/recreation-culture-expenditure",
          docsUrl:
            "https://sos2526-24.onrender.com/api/v2/recreation-culture-expenditure/docs"
        }
      ]
    },
    {
      name: "María Jesús Jiménez-Espada Pallarés",
      githubUser: "@mariaajesuus",
      githubUrl: "https://github.com/mariaajesuus",
      icon: "💶",
      resource: "average-monthly-wages",
      datasetName: "Sueldos medios mensuales",
      videoUrl: "https://youtu.be/WIW1ByF1ISw",
      apis: [
        {
          version: "v1",
          apiUrl:
            "https://sos2526-24.onrender.com/api/v1/average-monthly-wages",
          docsUrl:
            "https://sos2526-24.onrender.com/api/v1/average-monthly-wages/docs"
        }
      ]
    }
  ];
</script>

<main class="about-page">
  <section class="intro-section">
    <p class="eyebrow">Información del proyecto</p>
    <h1>Descripción del proyecto</h1>

    <p class="intro-text">
      {projectDescription}
    </p>

    <div class="main-actions" aria-label="Enlaces principales del proyecto">
      <a class="button button-primary" href={repoUrl} target="_blank" rel="noreferrer">
        Repositorio en GitHub
      </a>

      <a class="button" href={renderUrl} target="_blank" rel="noreferrer">
        Aplicación en Render
      </a>
    </div>
  </section>

  <section class="team-section">
    <div class="section-heading">
      <p class="eyebrow">Equipo, APIs y vídeos</p>
      <h2>Integrantes del equipo</h2>
    </div>

    <div class="team-grid">
      {#each teamMembers as member}
        <article class="member-card">
          <div class="member-icon" aria-hidden="true">
            {member.icon}
          </div>

          <h3>{member.name}</h3>

          <div class="info-box">
            <p>
              <strong>Desarrollador:</strong>
              <a
                class="github-link"
                href={member.githubUrl}
                target="_blank"
                rel="noreferrer"
              >
                {member.githubUser}
              </a>
            </p>

            <p>
              <strong>Fuente de datos:</strong>
            </p>

            <p class="dataset-name">{member.datasetName}</p>

            <span class="resource-pill">{member.resource}</span>
          </div>

          <div class="button-area">
            {#each member.apis as api}
              <a
                class="button"
                href={api.apiUrl}
                target="_blank"
                rel="noreferrer"
              >
                API {api.version}
              </a>

              <a
                class="button"
                href={api.docsUrl}
                target="_blank"
                rel="noreferrer"
              >
                Docs {api.version}
              </a>
            {/each}

            {#if member.videoUrl}
              <a
                class="button"
                href={member.videoUrl}
                target="_blank"
                rel="noreferrer"
              >
                Vídeo
              </a>
            {:else}
              <button class="button button-disabled" type="button" disabled>
                Vídeo pendiente
              </button>
            {/if}
          </div>
        </article>
      {/each}
    </div>
  </section>
</main>

<style>
  :global(*) {
    box-sizing: border-box;
  }

  .about-page {
    width: min(1200px, calc(100% - 32px));
    margin: 0 auto;
    padding: 46px 0 60px;
    font-family:
      Inter,
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      sans-serif;
    color: #2f3e3a;
    background: transparent;
  }

  .intro-section {
    max-width: 980px;
    margin: 0 auto 54px;
    text-align: center;
  }

  .eyebrow {
    margin: 0 0 10px;
    color: rgba(255, 255, 255, 0.72);
    font-size: 0.8rem;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  h1,
  h2 {
    font-family: "Cormorant Garamond", Georgia, serif;
    color: #062b28;
  }

  h1 {
    margin: 0 0 18px;
    font-size: clamp(2.8rem, 5vw, 4.8rem);
    line-height: 1;
    font-weight: 700;
  }

  h2 {
    margin: 0;
    font-size: clamp(2.5rem, 4.5vw, 4.3rem);
    line-height: 1;
    font-weight: 700;
  }

  h3 {
    margin: 8px 0 18px;
    text-align: center;
    font-size: 1.95rem;
    line-height: 1.15;
    font-weight: 800;
    color: #173a35;
  }

  .intro-text {
    margin: 0 auto;
    max-width: 940px;
    color: rgba(255, 255, 255, 0.86);
    line-height: 1.9;
    font-size: 1.02rem;
  }

  .main-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 14px;
    margin-top: 30px;
  }

  .button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 44px;
    padding: 11px 18px;
    border: none;
    border-radius: 999px;
    background: #ffffff;
    color: #3b5550;
    font: inherit;
    font-weight: 700;
    text-decoration: none;
    cursor: pointer;
    transition:
      transform 0.16s ease,
      box-shadow 0.16s ease,
      background 0.16s ease;
  }

  .button:hover {
    transform: translateY(-2px);
    background: #f8fbfa;
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.08);
  }

  .button-primary {
    background: #f97f78;
    color: #ffffff;
  }

  .button-primary:hover {
    background: #f26f68;
  }

  .button-disabled,
  .button-disabled:hover {
    background: #dfe8e4;
    color: #6a7b75;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .section-heading {
    text-align: center;
    margin-bottom: 30px;
  }

  .team-section {
    margin-top: 10px;
  }

  .team-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 24px;
  }

  .member-card {
    display: flex;
    flex-direction: column;
    min-height: 100%;
    padding: 30px 26px;
    border-radius: 28px;
    background: rgba(255, 255, 255, 0.78);
    border: 1px solid rgba(255, 255, 255, 0.42);
    box-shadow: 0 18px 42px rgba(0, 0, 0, 0.12);
  }

  .member-icon {
    text-align: center;
    font-size: 1.7rem;
    line-height: 1;
  }

  .info-box {
    flex: 1;
    display: grid;
    gap: 10px;
    padding: 20px;
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.58);
  }

  .info-box p {
    margin: 0;
    color: #36514b;
    line-height: 1.6;
  }

  .info-box strong {
    color: #173a35;
  }

  .github-link {
    color: #36514b;
    font-weight: 700;
    text-decoration: none;
  }

  .github-link:hover {
    text-decoration: underline;
  }

  .dataset-name {
    font-weight: 700;
  }

  .resource-pill {
    width: fit-content;
    max-width: 100%;
    display: inline-flex;
    align-items: center;
    padding: 7px 12px;
    border-radius: 999px;
    background: #c9dfd1;
    color: #2f6847;
    border: 1px solid rgba(47, 104, 71, 0.18);
    font-family:
      "Courier New",
      Courier,
      monospace;
    font-size: 0.93rem;
    overflow-wrap: anywhere;
  }

  .button-area {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 12px;
    margin-top: 22px;
  }

  @media (max-width: 1100px) {
    .team-grid {
      grid-template-columns: 1fr;
    }

    .member-card {
      max-width: 620px;
      width: 100%;
      margin: 0 auto;
    }
  }

  @media (max-width: 640px) {
    .about-page {
      width: min(100% - 22px, 1200px);
      padding-top: 28px;
    }

    .intro-section {
      margin-bottom: 42px;
    }

    .main-actions,
    .button-area {
      flex-direction: column;
      align-items: stretch;
    }

    .button {
      width: 100%;
    }

    .member-card {
      padding: 24px 20px;
    }

    h3 {
      font-size: 1.55rem;
    }
  }
</style>