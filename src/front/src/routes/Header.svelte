<script>
  let { sections = [], repoUrl = "#" } = $props();
</script>

<header class="site-header">
  <div class="brand">
    <a href="/" aria-label="Ir a la página principal">
      <span class="brand-emoji">🌿</span>
      <span class="brand-text">SOS2526-24</span>
    </a>
  </div>

  <nav class="desktop-nav" aria-label="Navegación principal">
    <a href="#inicio">Inicio</a>
    <a href="#integrantes">Integrantes</a>
    <a href="#enlaces">Enlaces</a>
    <a href="#footer-info">Información</a>
  </nav>

  <div class="dataset-dropdowns" aria-label="Bases de datos del proyecto">
    {#each sections as section}
      <details class="dropdown">
        <summary>{section.resource}</summary>
        <div class="dropdown-menu">
          <p class="dropdown-member">
            <strong>{section.short}</strong> · {section.member}
          </p>
          <a href={section.frontend}>Abrir front-end</a>
          <a href={section.apiBase}>Abrir API</a>
          <a href={section.docs}>Ver documentación</a>
        </div>
      </details>
    {/each}
  </div>

  <a class="repo-button" href={repoUrl} target="_blank" rel="noreferrer">
    GitHub ↗
  </a>
</header>

<style>
  .site-header {
    position: sticky;
    top: 0;
    z-index: 30;
    width: min(1200px, calc(100% - 2rem));
    margin: 1.2rem auto 0;
    padding: 0.9rem 1.2rem;
    display: grid;
    grid-template-columns: auto 1fr auto auto;
    gap: 1rem;
    align-items: center;
    border: 1px solid rgba(37, 53, 49, 0.08);
    border-radius: 24px;
    background:
      linear-gradient(180deg, rgba(223, 238, 232, 0.82), rgba(223, 238, 232, 0.72));
    backdrop-filter: blur(10px);
    box-shadow: 0 14px 40px rgba(55, 79, 72, 0.08);
  }

  .brand a {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
    color: #16302c;
    text-decoration: none;
    font-weight: 700;
    letter-spacing: 0.02em;
  }

  .brand-emoji {
    font-size: 1rem;
  }

  .brand-text {
    font-size: 0.95rem;
  }

  .desktop-nav {
    display: flex;
    justify-content: center;
    gap: 1.25rem;
    flex-wrap: wrap;
  }

  .desktop-nav a {
    color: #24423d;
    text-decoration: none;
    font-size: 0.92rem;
    transition: opacity 0.2s ease, transform 0.2s ease;
  }

  .desktop-nav a:hover {
    opacity: 0.8;
    transform: translateY(-1px);
  }

  .dataset-dropdowns {
    display: flex;
    gap: 0.7rem;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .dropdown {
    position: relative;
  }

  .dropdown summary {
    list-style: none;
    cursor: pointer;
    padding: 0.65rem 0.9rem;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.55);
    border: 1px solid rgba(37, 53, 49, 0.08);
    color: #1f3a35;
    font-size: 0.82rem;
    white-space: nowrap;
  }

  .dropdown summary::-webkit-details-marker {
    display: none;
  }

  .dropdown[open] summary {
    background: rgba(245, 141, 134, 0.14);
    border-color: rgba(240, 115, 105, 0.3);
  }

  .dropdown-menu {
    position: absolute;
    right: 0;
    top: calc(100% + 0.55rem);
    min-width: 250px;
    padding: 0.9rem;
    display: grid;
    gap: 0.55rem;
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.96);
    border: 1px solid rgba(37, 53, 49, 0.08);
    box-shadow: 0 18px 40px rgba(40, 60, 54, 0.12);
  }

  .dropdown-member {
    margin: 0 0 0.35rem;
    color: #294741;
    font-size: 0.84rem;
    line-height: 1.45;
  }

  .dropdown-menu a {
    color: #26413c;
    text-decoration: none;
    font-size: 0.84rem;
  }

  .dropdown-menu a:hover {
    color: #e86f66;
  }

  .repo-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.8rem 1.15rem;
    border-radius: 999px;
    text-decoration: none;
    color: #fffaf7;
    background: linear-gradient(135deg, #ec7a70, #f28d84);
    box-shadow: 0 12px 24px rgba(236, 122, 112, 0.22);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    font-size: 0.9rem;
  }

  .repo-button:hover {
    transform: translateY(-1px);
    box-shadow: 0 16px 30px rgba(236, 122, 112, 0.28);
  }

  @media (max-width: 1100px) {
    .site-header {
      grid-template-columns: 1fr;
      justify-items: center;
    }

    .desktop-nav,
    .dataset-dropdowns {
      justify-content: center;
    }
  }

  @media (max-width: 700px) {
    .site-header {
      width: min(100% - 1rem, 1200px);
      padding: 1rem;
    }

    .desktop-nav {
      gap: 0.8rem;
    }

    .dropdown-menu {
      left: 50%;
      right: auto;
      transform: translateX(-50%);
      width: min(85vw, 280px);
    }

    .repo-button {
      width: 100%;
    }
  }
</style>