<script>
   let { sections = [], repoUrl = "https://github.com/gti-sos/SOS2526-24" } = $props();

  const fallbackSections = [
    {
      key: "ocio",
      label: "Ocio y cultura",
      short: "EBP",
      member: "Elena Bejarano Periñán",
      links: [
        { label: "Front-end", href: "/recreation-culture-expenditure" },
        { label: "API", href: "/api/v2/recreation-culture-expenditure" },
        { label: "Documentación", href: "/api/v2/recreation-culture-expenditure/docs" }
      ]
    },
    {
      key: "sueldos",
      label: "Sueldos",
      short: "MJP",
      member: "María Jesús Jiménez-Espada Pallarés",
      links: [
        { label: "Front-end", href: "/average-monthly-wages" },
        { label: "API", href: "/api/v1/average-monthly-wages" },
        { label: "Documentación", href: "/api/v1/average-monthly-wages/docs" }
      ]
    },
    {
      key: "construccion",
      label: "Construcción",
      short: "IRG",
      member: "Isaac Rodríguez Godino",
      links: [
        { label: "Front-end", href: "/international-construction-costs" },
        { label: "API", href: "/api/v1/international-construction-costs" },
        { label: "Documentación", href: "/api/v1/international-construction-costs/docs" }
      ]
    },
    {
      key: "analytics",
      label: "Análisis",
      short: "",
      member: "Visualizaciones",
      links: [
        { label: "Visualización grupal", href: "/analytics" },
        { label: "Ocio y cultura", href: "/analytics/recreation-culture-expenditure" },
        { label: "Sueldos", href: "/analytics/average-monthly-wages" },
        { label: "Construcción", href: "/analytics/international-construction-costs" }
      ]
    },
    {
      key: "integrations",
      label: "Integraciones",
      short: "",
      member: "APIs externas y SOS",
      links: [
        { label: "Vista general", href: "/integrations" },
        { label: "Ocio y cultura", href: "/integrations/recreation-culture-expenditure" },
        { label: "Sueldos", href: "/integrations/mjp" },
        { label: "Construcción", href: "/integrations/isaac" }
      ]
    }
  ];

  function normalizeSections(input) {
    const source = Array.isArray(input) && input.length > 0
      ? input
      : fallbackSections;

    return source.map((section, index) => ({
      key: section.key || section.resource || section.short || `section-${index}`,
      label: section.label || section.theme || section.resource || `Sección ${index + 1}`,
      short: section.short || "",
      member: section.member || "",
      links: section.links || [
        { label: "Front-end", href: section.frontend },
        { label: "API", href: section.apiBase },
        { label: "Documentación", href: section.docs }
      ].filter((link) => link.href)
    }));
  }

  const navSections = normalizeSections(sections);

  let openKey = null;
  let closeTimer = null;

  function clearCloseTimer() {
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }
  }

  function handleToggle(event, key) {
    const currentDetails = event.currentTarget;
    const isOpening = currentDetails.open;

    clearCloseTimer();

    const allDropdowns = document.querySelectorAll(".nav-dropdown");
    allDropdowns.forEach((dropdown) => {
      if (dropdown !== currentDetails) {
        dropdown.open = false;
      }
    });

    if (isOpening) {
      openKey = key;

      closeTimer = setTimeout(() => {
        currentDetails.open = false;
        if (openKey === key) {
          openKey = null;
        }
        closeTimer = null;
      }, 4000);
    } else if (openKey === key) {
      openKey = null;
    }
  }
</script>

<header class="site-header">
  <div class="brand">
    <a href="/" aria-label="Ir a la página principal">
      <span class="brand-emoji">🌿</span>
      <span class="brand-text">SOS2526-24</span>
    </a>
  </div>

  <nav class="center-nav" aria-label="Secciones del proyecto">
    {#each navSections as section (section.key)}
      <details
        class="nav-dropdown"
        ontoggle={(event) => handleToggle(event, section.key)}
      >
        <summary class="nav-trigger">
          <span>{section.label}</span>
          <span class="chevron">▾</span>
        </summary>

        <div class="dropdown-menu">
          {#if section.short || section.member}
            <p class="dropdown-member">
              {#if section.short}
                <strong>{section.short}</strong>
              {/if}

              {#if section.short && section.member}
                {" · "}
              {/if}

              {#if section.member}
                {section.member}
              {/if}
            </p>
          {/if}

          {#each section.links as link}
            <a href={link.href}>{link.label}</a>
          {/each}
        </div>
      </details>
    {/each}
  </nav>

  <div class="actions">
    <a class="info-link" href="/about">Información</a>

    <a class="repo-button" href={repoUrl} target="_blank" rel="noreferrer">
      GitHub ↗
    </a>
  </div>
</header>

<style>
  .site-header {
    width: 100%;
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 1.25rem;
    padding: 0.9rem 1.5rem;
    background: transparent;
  }

  .brand {
    min-width: max-content;
  }

  .brand a {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    color: #f4f7f5;
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

  .center-nav {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    min-width: 0;
    flex-wrap: wrap;
  }

  .nav-dropdown {
    position: relative;
  }

  .nav-trigger {
    list-style: none;
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.72rem 1rem;
    border-radius: 999px;
    cursor: pointer;
    background: rgba(255, 255, 255, 0.12);
    color: #f6faf8;
    font-size: 0.95rem;
    font-weight: 500;
    line-height: 1;
    backdrop-filter: blur(6px);
    transition: background 0.2s ease, transform 0.2s ease;
    user-select: none;
  }

  .nav-trigger:hover {
    background: rgba(255, 255, 255, 0.18);
    transform: translateY(-1px);
  }

  .nav-trigger::-webkit-details-marker {
    display: none;
  }

  .chevron {
    font-size: 0.82rem;
    transition: transform 0.2s ease;
  }

  .nav-dropdown[open] .chevron {
    transform: rotate(180deg);
  }

  .dropdown-menu {
    position: absolute;
    top: calc(100% + 0.65rem);
    left: 50%;
    transform: translateX(-50%);
    min-width: 250px;
    padding: 0.95rem;
    display: grid;
    gap: 0.55rem;
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.97);
    border: 1px solid rgba(37, 53, 49, 0.08);
    box-shadow: 0 18px 40px rgba(24, 35, 32, 0.18);
    z-index: 100;
  }

  .dropdown-member {
    margin: 0 0 0.25rem;
    color: #294741;
    font-size: 0.84rem;
    line-height: 1.45;
  }

  .dropdown-menu a {
    color: #26413c;
    text-decoration: none;
    font-size: 0.88rem;
    transition: color 0.2s ease, transform 0.2s ease;
  }

  .dropdown-menu a:hover {
    color: #e86f66;
    transform: translateX(2px);
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 0.9rem;
    justify-self: end;
  }

  .info-link {
    color: rgba(255, 255, 255, 0.88);
    text-decoration: none;
    font-size: 0.95rem;
    font-weight: 500;
    transition: opacity 0.2s ease;
  }

  .info-link:hover {
    opacity: 0.75;
    text-decoration: underline;
  }

  .repo-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.78rem 1.15rem;
    border-radius: 999px;
    text-decoration: none;
    color: #fffaf7;
    background: linear-gradient(135deg, #ec7a70, #f28d84);
    box-shadow: 0 12px 24px rgba(236, 122, 112, 0.22);
    font-size: 0.9rem;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .repo-button:hover {
    transform: translateY(-1px);
    box-shadow: 0 16px 30px rgba(236, 122, 112, 0.28);
  }

  @media (max-width: 1100px) {
    .site-header {
      grid-template-columns: 1fr;
      justify-items: center;
      text-align: center;
    }

    .actions {
      justify-self: center;
    }
  }

  @media (max-width: 700px) {
    .site-header {
      padding: 0.85rem 1rem;
    }

    .center-nav {
      gap: 0.7rem;
    }

    .dropdown-menu {
      width: min(86vw, 280px);
    }

    .actions {
      flex-wrap: wrap;
      justify-content: center;
    }
  }
</style>