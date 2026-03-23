<script>
  const sections = [
    {
      short: 'MJP',
      frontend: '/MJP',
      api: '/api/v1/average-monthly-wages',
      docs: '/api/v1/average-monthly-wages/docs',
      resource: 'average-monthly-wages',
      member: 'María Jesús Jiménez-Espada Pallarés'
    },
    {
      short: 'IRG',
      frontend: '/international-construction-costs',
      
      api: '/api/v1/international-construction-costs',
      docs: '/api/v1/international-construction-costs/docs',
      resource: 'international-construction-costs',
      member: 'Isaac Rodríguez Godino'
    },
    {
      short: 'EBP',
      frontend: '/recreation-culture-expenditure',
      api: '/api/v1/recreation-culture-expenditure',
      docs: '/api/v1/recreation-culture-expenditure/docs',
      resource: 'recreation-culture-expenditure',
      member: 'Elena Bejarano Periñán'
    }
  ];
</script>

<header class="main-header">
  <nav class="nav-container">
    <div class="brand">
      <a href="/">SOS2526-24</a>
    </div>

    <ul class="nav-menu">
      {#each sections as section}
        <li class="dropdown">
          <button class="dropbtn" type="button">
            {section.short} <span class="arrow">▾</span>
          </button>

          <div class="dropdown-content">
            <div class="dropdown-info">
              <p><strong>Integrante:</strong> {section.member}</p>
              <p><strong>Fuente de datos:</strong> <code>{section.resource}</code></p>
            </div>

            <hr />

            <a href={section.frontend}>🎨 Front-end</a>
            <a href={section.api} target="_blank" rel="noreferrer">🔌 API Base</a>
            <a href={section.docs} target="_blank" rel="noreferrer">📄 Postman Docs</a>
          </div>
        </li>
      {/each}
    </ul>

    <div class="nav-actions">
      <a href="/about" class="about-link">About</a>

      <a
        href="https://github.com/gti-sos/SOS2526-24"
        target="_blank"
        rel="noreferrer"
        class="github-link"
      >
        GitHub 📂
      </a>
    </div>
  </nav>
</header>

<style>
  .main-header {
    background: transparent;
    padding: 1.5rem 1.5rem 0;
    font-family: Inter, system-ui, sans-serif;
  }

  .nav-container {
    max-width: 1380px;
    margin: 0 auto;
    min-height: 72px;
    padding: 0.9rem 1.4rem;
    background: #f3eee8;
    border-radius: 999px;
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 1.5rem;
    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.08);
  }

  .brand a {
    text-decoration: none;
    color: #111827;
    font-weight: 800;
    font-size: 1.15rem;
    letter-spacing: -0.01em;
  }

  .nav-menu {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2rem;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .dropdown {
    position: relative;
  }

  .dropbtn {
    text-decoration: none;
    color: #111827;
    font-size: 0.98rem;
    font-weight: 500;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.4rem 0.2rem;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-family: inherit;
  }

  .dropbtn:hover {
    opacity: 0.75;
  }

  .arrow {
    font-size: 0.8rem;
    color: #6b7280;
  }

  .dropdown-content {
    display: none;
    position: absolute;
    top: calc(100% + 12px);
    left: 50%;
    transform: translateX(-50%);
    min-width: 290px;
    background: #ffffff;
    border-radius: 18px;
    box-shadow: 0 18px 45px rgba(0, 0, 0, 0.14);
    padding: 0.9rem;
    z-index: 20;
    border: 1px solid #ece7e2;
  }

  .dropdown:hover .dropdown-content {
    display: block;
  }

  .dropdown-info {
    padding: 0.25rem 0.35rem 0.55rem;
  }

  .dropdown-info p {
    margin: 0.35rem 0;
    color: #374151;
    font-size: 0.9rem;
    line-height: 1.45;
  }

  .dropdown-info code {
    background: #f7f3ee;
    color: #7a1837;
    padding: 0.15rem 0.45rem;
    border-radius: 8px;
    font-size: 0.82rem;
  }

  hr {
    border: 0;
    border-top: 1px solid #ece7e2;
    margin: 0.4rem 0 0.55rem;
  }

  .dropdown-content a {
    display: block;
    text-decoration: none;
    color: #111827;
    font-size: 0.92rem;
    padding: 0.75rem 0.85rem;
    border-radius: 12px;
    transition: background 0.2s ease, color 0.2s ease;
  }

  .dropdown-content a:hover {
    background: #f7f3ee;
    color: #7a1837;
  }

  .nav-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .about-link {
    text-decoration: none;
    color: #111827;
    font-size: 0.98rem;
    font-weight: 500;
    transition: opacity 0.2s ease;
  }

  .about-link:hover {
    opacity: 0.75;
  }

  .github-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    white-space: nowrap;
    text-decoration: none;
    background: #111827;
    color: #ffffff;
    padding: 0.7rem 1rem;
    border-radius: 999px;
    font-size: 0.92rem;
    font-weight: 600;
    transition: transform 0.2s ease, opacity 0.2s ease;
  }

  .github-link:hover {
    transform: translateY(-1px);
    opacity: 0.9;
  }

  @media (max-width: 980px) {
    .nav-container {
      grid-template-columns: 1fr;
      border-radius: 28px;
      justify-items: center;
    }

    .nav-menu {
      flex-wrap: wrap;
      gap: 1rem;
    }

    .nav-actions {
      flex-wrap: wrap;
      justify-content: center;
    }
  }

  @media (max-width: 640px) {
    .main-header {
      padding: 1rem 1rem 0;
    }

    .nav-container {
      padding: 1rem;
    }

    .dropdown-content {
      left: 0;
      transform: none;
      min-width: 260px;
    }
  }
</style>