<svelte:head>
  <title>Información | SOS2526-24</title>
  <meta
    name="description"
    content="Información del proyecto SOS2526-24"
  />
</svelte:head>

<script>
  const repoUrl = 'https://github.com/gti-sos/SOS2526-24';
  const renderUrl = 'https://sos2526-24.onrender.com/';

  const teamMembers = [
    {
      name: 'Isaac Rodríguez Godino',
      githubUser: '@IsaacRg25',
      githubUrl: 'https://github.com/IsaacRg25',
      apiUrl: 'https://sos2526-24.onrender.com/api/v1/international-construccion-costs',
      docs: [
        {
          label: 'Documentación v1',
          url: 'https://sos2526-24.onrender.com/api/v1/international-construccion-costs/docs'
        }
      ]
    },
    {
      name: 'Elena Bejarano Periñán',
      githubUser: '@elenabejper',
      githubUrl: 'https://github.com/elenabejper',
      apiUrl: 'https://sos2526-24.onrender.com/api/v1/recreation-culture-expenditure',
      docs: [
        {
          label: 'Documentación v1',
          url: 'https://sos2526-24.onrender.com/api/v1/recreation-culture-expenditure/docs'
        },
        {
          label: 'Documentación v2',
          url: 'https://sos2526-24.onrender.com/api/v2/recreation-culture-expenditure/docs'
        }
      ]
    },
    {
      name: 'María Jesús Jiménez-Espada Pallarés',
      githubUser: '@mariaajesuus',
      githubUrl: 'https://github.com/mariaajesuus',
      apiUrl: 'https://sos2526-24.onrender.com/api/v1/average-monthly-wages',
      docs: [
        {
          label: 'Documentación v1',
          url: 'https://sos2526-24.onrender.com/api/v1/average-monthly-wages/docs'
        }
      ]
    }
  ];
</script>

<div class="page">
  <section class="intro-section">
    <p class="eyebrow">Información del proyecto</p>
    <h1>Información</h1>

    <p class="intro-text">
      En esta página se recoge la información principal del proyecto:
      repositorio, despliegue, integrantes del equipo, APIs y documentación.
    </p>

    <div class="main-links">
      <a href={repoUrl} target="_blank" rel="noreferrer">
        Repositorio en GitHub
      </a>

      <a href={renderUrl} target="_blank" rel="noreferrer">
        Despliegue en Render
      </a>
    </div>
  </section>

  <section class="cards-section">
    <div class="section-heading">
      <p class="eyebrow">Equipo y recursos</p>
      <h2>Integrantes del equipo</h2>
      <p>
        Nuestro proyecto integra datasets mundiales sobre costes de construcción,
        gasto de los hogares en ocio y cultura y salarios medios mensuales, con
        el objetivo de analizar tendencias y relaciones entre estas variables.
      </p>
    </div>

    <div class="cards-grid">
      {#each teamMembers as member}
        <article class="team-card">
          <div class="card-top">
            <h3>{member.name}</h3>
            <span class="badge">Miembro</span>
          </div>

          <div class="info-list">
            <div class="info-item">
              <p class="item-title">Perfil de GitHub</p>
              <a href={member.githubUrl} target="_blank" rel="noreferrer">
                {member.githubUser}
              </a>
            </div>

            <div class="info-item">
              <p class="item-title">API</p>
              <a href={member.apiUrl} target="_blank" rel="noreferrer">
                {member.apiUrl}
              </a>
            </div>

            <div class="info-item">
              <p class="item-title">Documentación</p>
              <div class="docs-list">
                {#each member.docs as doc}
                  <a href={doc.url} target="_blank" rel="noreferrer">
                    {doc.label}
                  </a>
                {/each}
              </div>
            </div>
          </div>
        </article>
      {/each}
    </div>
  </section>
</div>

<style>
  :global(body) {
    font-family:
      Inter,
      ui-monospace,
      SFMono-Regular,
      Menlo,
      Monaco,
      Consolas,
      "Liberation Mono",
      "Courier New",
      monospace;
    color: #2f3e3a;
  }

  .page {
    padding: 32px 20px 40px;
    max-width: 1420px;
    margin: 0 auto;
  }

  .intro-section {
    text-align: center;
    margin-bottom: 42px;
    padding: 24px 0 8px;
  }

  .eyebrow {
    margin: 0 0 10px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 0.82rem;
    font-weight: 700;
    color: #4f645e;
  }

  .intro-section h1 {
    margin: 0 0 18px;
    font-size: clamp(2.8rem, 6vw, 4.2rem);
    line-height: 1.05;
    font-weight: 800;
    color: #2f3e3a;
  }

  .intro-text {
    margin: 0 auto;
    max-width: 820px;
    font-size: 1rem;
    line-height: 1.8;
    color: #41514c;
  }

  .main-links {
    margin-top: 24px;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 14px;
  }

  .main-links a {
    display: inline-block;
    text-decoration: none;
    color: #2f3e3a;
    font-weight: 700;
    padding: 12px 16px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.72);
    border: 1px solid rgba(47, 62, 58, 0.12);
    transition:
      transform 0.15s ease,
      background 0.15s ease,
      box-shadow 0.15s ease;
  }

  .main-links a:hover {
    transform: translateY(-1px);
    background: #ffffff;
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.08);
  }

  .cards-section {
    margin-top: 18px;
  }

  .section-heading {
    text-align: center;
    margin-bottom: 22px;
  }

  .section-heading h2 {
    margin: 0 0 12px;
    font-size: clamp(1.8rem, 4vw, 2.6rem);
    font-weight: 800;
    color: #2f3e3a;
  }

  .section-heading p {
    margin: 0 auto;
    max-width: 950px;
    line-height: 1.8;
    color: #41514c;
  }

  .cards-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 20px;
  }

  .team-card {
    background: rgba(255, 255, 255, 0.68);
    border: 1px solid rgba(47, 62, 58, 0.1);
    border-radius: 20px;
    padding: 22px;
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.06);
    backdrop-filter: blur(6px);
  }

  .card-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-bottom: 14px;
  }

  .team-card h3 {
    margin: 0;
    font-size: 1.2rem;
    line-height: 1.35;
    font-weight: 800;
    color: #2f3e3a;
  }

  .badge {
    background: #dfe8e4;
    color: #2f3e3a;
    border-radius: 999px;
    padding: 7px 12px;
    font-size: 0.78rem;
    font-weight: 700;
    white-space: nowrap;
  }

  .info-list {
    display: grid;
    gap: 14px;
  }

  .info-item {
    background: rgba(255, 255, 255, 0.72);
    border: 1px solid rgba(47, 62, 58, 0.08);
    border-radius: 14px;
    padding: 14px;
  }

  .item-title {
    font-weight: 700;
    color: #2f3e3a;
    margin: 0 0 8px;
  }

  .info-item a {
    display: inline-block;
    text-decoration: none;
    color: #384844;
    font-weight: 700;
    padding: 10px 12px;
    border-radius: 10px;
    background: #f8fbfa;
    border: 1px solid rgba(47, 62, 58, 0.08);
    transition:
      transform 0.15s ease,
      background 0.15s ease,
      box-shadow 0.15s ease;
    word-break: break-word;
    margin-top: 6px;
  }

  .info-item a:hover {
    transform: translateY(-1px);
    background: #ffffff;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
  }

  .docs-list {
    display: grid;
    gap: 10px;
  }

  @media (max-width: 1100px) {
    .cards-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 820px) {
    .page {
      padding: 20px 12px 30px;
    }

    .main-links {
      flex-direction: column;
      width: 100%;
    }

    .main-links a {
      width: 100%;
      box-sizing: border-box;
    }

    .team-card {
      padding: 18px;
    }
  }
</style>