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
      resource: "international-construccion-costs",
      datasetName: "Costes internacionales de construcción",
      videoUrl: "",
      apis: [
        {
          version: "v1",
          apiUrl:
            "https://sos2526-24.onrender.com/api/v1/international-construccion-costs",
          docsUrl:
            "https://sos2526-24.onrender.com/api/v1/international-construccion-costs/docs"
        }
      ]
    },
    {
      name: "Elena Bejarano Periñán",
      githubUser: "@elenabejper",
      githubUrl: "https://github.com/elenabejper",
      resource: "recreation-culture-expenditure",
      datasetName: "Gasto en ocio y cultura",
      videoUrl: "",
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
      resource: "average-monthly-wages",
      datasetName: "Sueldos medios mensuales",
      videoUrl: "",
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
          <header class="member-header">
            <div class="member-main-info">
              <h3>{member.name}</h3>
              <a
                class="github-link"
                href={member.githubUrl}
                target="_blank"
                rel="noreferrer"
              >
                {member.githubUser}
              </a>
            </div>

            <span class="member-badge">Miembro</span>
          </header>

          <div class="resource-box">
            <span class="box-label">Fuente de datos</span>
            <strong>{member.datasetName}</strong>
            <small>{member.resource}</small>
          </div>

          <div class="card-block">
            <h4>Perfil</h4>

            <a
              class="button button-full"
              href={member.githubUrl}
              target="_blank"
              rel="noreferrer"
            >
              Ver perfil de GitHub
            </a>
          </div>

          <div class="card-block">
            <h4>APIs y documentación</h4>

            <div class="api-list">
              {#each member.apis as api}
                <div class="api-version-card">
                  <div class="api-version-title">{api.version.toUpperCase()}</div>

                  <div class="button-row">
                    <a
                      class="small-button"
                      href={api.apiUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      API {api.version}
                    </a>

                    <a
                      class="small-button"
                      href={api.docsUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Docs {api.version}
                    </a>
                  </div>
                </div>
              {/each}
            </div>
          </div>

          <div class="card-block">
            <h4>Vídeo individual</h4>

            {#if member.videoUrl}
              <a
                class="button button-full"
                href={member.videoUrl}
                target="_blank"
                rel="noreferrer"
              >
                Ver vídeo
              </a>
            {:else}
              <button class="button button-full button-disabled" type="button" disabled>
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
    margin: 0 auto 42px;
    text-align: center;
  }

  .eyebrow {
    margin: 0 0 10px;
    color: #546962;
    font-size: 0.8rem;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  h1,
  h2 {
    font-family: "Cormorant Garamond", Georgia, serif;
    color: #2f3e3a;
  }

  h1 {
    margin: 0 0 16px;
    font-size: clamp(2.8rem, 5vw, 4.8rem);
    line-height: 1;
    font-weight: 700;
  }

  h2 {
    margin: 0 0 10px;
    font-size: clamp(2.5rem, 4.5vw, 4.3rem);
    line-height: 1;
    font-weight: 700;
  }

  h3 {
    margin: 0;
    font-size: 1.18rem;
    line-height: 1.3;
    font-weight: 800;
    color: #2f3e3a;
  }

  h4 {
    margin: 0 0 12px;
    font-size: 0.98rem;
    color: #2f3e3a;
  }

  .intro-text {
    margin: 0 auto;
    max-width: 940px;
    color: #4d6059;
    line-height: 1.9;
    font-size: 1.02rem;
  }

  .main-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 14px;
    margin-top: 28px;
  }

  .button,
  .small-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    font-weight: 800;
    border-radius: 999px;
    border: 1px solid rgba(47, 62, 58, 0.22);
    cursor: pointer;
    background: transparent;
    color: #2f3e3a;
    transition:
      transform 0.16s ease,
      border-color 0.16s ease,
      box-shadow 0.16s ease;
  }

  .button {
    min-height: 46px;
    padding: 12px 20px;
  }

  .small-button {
    min-height: 38px;
    padding: 9px 14px;
    font-size: 0.92rem;
  }

  .button:hover,
  .small-button:hover {
    transform: translateY(-1px);
    border-color: rgba(47, 62, 58, 0.34);
    box-shadow: 0 8px 18px rgba(47, 62, 58, 0.08);
  }

  .button-primary {
    background: #3e5d55;
    border-color: #3e5d55;
    color: white;
  }

  .button-primary:hover {
    background: #355048;
  }

  .button-full {
    width: 100%;
  }

  .button-disabled,
  .button-disabled:hover {
    background: transparent;
    color: #60716b;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .section-heading {
    text-align: center;
    margin-bottom: 28px;
  }

  .team-section {
    margin-top: 10px;
  }

  .team-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 22px;
  }

  .member-card {
    display: flex;
    flex-direction: column;
    gap: 18px;
    min-height: 100%;
    padding: 22px;
    border-radius: 24px;
    border: 1px solid rgba(47, 62, 58, 0.16);
    background: transparent;
    box-shadow: none;
  }

  .member-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 14px;
  }

  .member-main-info {
    display: grid;
    gap: 8px;
  }

  .github-link {
    color: #5d716a;
    font-weight: 700;
    text-decoration: none;
    width: fit-content;
  }

  .github-link:hover {
    text-decoration: underline;
  }

  .member-badge {
    flex: 0 0 auto;
    padding: 7px 12px;
    border-radius: 999px;
    border: 1px solid rgba(47, 62, 58, 0.18);
    background: transparent;
    color: #4c625b;
    font-size: 0.76rem;
    font-weight: 800;
  }

  .resource-box,
  .card-block {
    padding: 16px;
    border-radius: 18px;
    border: 1px solid rgba(47, 62, 58, 0.16);
    background: transparent;
  }

  .resource-box {
    display: grid;
    gap: 8px;
  }

  .box-label {
    color: #61756d;
    font-size: 0.78rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .resource-box strong {
    font-size: 1rem;
    color: #2f3e3a;
  }

  .resource-box small {
    color: #61756d;
    font-weight: 700;
    overflow-wrap: anywhere;
  }

  .api-list {
    display: grid;
    gap: 12px;
  }

  .api-version-card {
    padding: 14px;
    border-radius: 16px;
    border: 1px solid rgba(47, 62, 58, 0.14);
    background: transparent;
    display: grid;
    gap: 12px;
  }

  .api-version-title {
    font-size: 0.95rem;
    font-weight: 800;
    color: #40524c;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .button-row {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  @media (max-width: 1050px) {
    .team-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 640px) {
    .about-page {
      width: min(100% - 20px, 1200px);
      padding-top: 26px;
    }

    .main-actions,
    .button-row {
      flex-direction: column;
      align-items: stretch;
    }

    .button,
    .small-button {
      width: 100%;
    }

    .member-header {
      flex-direction: column;
    }
  }
</style>