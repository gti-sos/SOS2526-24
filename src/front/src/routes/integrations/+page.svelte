<script>
  let members = [
    {
      id: 'isaac',
      name: 'Isaac',
      icon: '👨‍💻',
      color: '#3b82f6',
      href: '/integrations/isaac'
    },
    {
      id: 'elena',
      name: 'Elena',
      icon: '👩‍💻',
      color: '#8b5cf6',
      href: '/integrations/elena'
    },
    {
      id: 'mjp',
      name: 'María Jesús',
      icon: '💼',
      color: '#ec4899',
      href: '/integrations/mjp'
    }
  ];
</script>

<svelte:head>
  <title>Integraciones | SOS2526-24</title>
</svelte:head>

<div class="container">
  <header class="header">
    <h1>🔗 Integraciones del Grupo</h1>
    <p class="subtitle">SOS2526-24 - Proyecto D03.B</p>
  </header>

  <div class="members-grid">
    {#each members as member}
      <a href={member.href} class="member-card" style="--color: {member.color}">
        <div class="member-icon">{member.icon}</div>
        <h2>{member.name}</h2>
        <div class="member-arrow">→</div>
      </a>
    {/each}
  </div>
</div>

<style>
  .container {
    max-width: 900px;
    margin: 0 auto;
    padding: 3rem 2rem;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .header {
    text-align: center;
    margin-bottom: 4rem;
  }

  .header h1 {
    font-size: 2.5rem;
    color: #1e293b;
    margin: 0 0 0.5rem 0;
  }

  .header .subtitle {
    font-size: 1.1rem;
    color: #64748b;
    margin: 0;
  }

  .members-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem;
    margin-bottom: 2rem;
  }

  .member-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 2rem;
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    text-decoration: none;
    color: inherit;
    transition: all 0.3s ease;
    position: relative;
  }

  .member-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: var(--color);
    border-radius: 12px 12px 0 0;
  }

  .member-card:hover {
    border-color: var(--color);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    transform: translateY(-4px);
  }

  .member-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
  }

  .member-card h2 {
    font-size: 1.5rem;
    color: #1e293b;
    margin: 0;
    text-align: center;
  }

  .member-arrow {
    position: absolute;
    bottom: 1rem;
    right: 1rem;
    font-size: 1.5rem;
    color: var(--color);
    font-weight: bold;
    opacity: 0;
    transform: translateX(-8px);
    transition: all 0.3s ease;
  }

  .member-card:hover .member-arrow {
    opacity: 1;
    transform: translateX(0);
  }

  @media (max-width: 768px) {
    .members-grid {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }

    .header h1 {
      font-size: 2rem;
    }
  }
</style>