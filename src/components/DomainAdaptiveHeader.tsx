import { getDomainConfig, isHendoDomain, isNebulaDomain } from '@/lib/domain-detection';

export default function DomainAdaptiveHeader() {
  const domainConfig = getDomainConfig();
  const isHendo = isHendoDomain();
  const isNebula = isNebulaDomain();

  return (
    <header
      className="header"
      style={{
        backgroundColor: domainConfig.primaryColor,
        color: 'white'
      }}
    >
      <div className="container">
        <div className="logo">
          <img src={domainConfig.logo} alt={domainConfig.displayName} />
          <h1>{domainConfig.displayName}</h1>
        </div>

        <nav className="nav">
          <a href="/">Home</a>
          <a href="/products">Products</a>
          <a href="/about">About</a>

          {/* Domain-specific navigation */}
          {isHendo && (
            <>
              <a href="/hendo-story">Hendo's Story</a>
              <a href="/legend">The Legend</a>
            </>
          )}

          {isNebula && (
            <>
              <a href="/cloud-services">Cloud Services</a>
              <a href="/technology">Technology</a>
            </>
          )}

          <a href="/login">Login</a>
        </nav>
      </div>
    </header>
  );
}

