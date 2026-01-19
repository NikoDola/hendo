import { getDomainConfig, isHendoDomain, isNebulaDomain } from '@/lib/domain-detection';
import Link from 'next/link'

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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={domainConfig.logo} alt={domainConfig.displayName} />
          <h1 data-text={domainConfig.displayName}>{domainConfig.displayName}</h1>
        </div>

        <nav className="nav">
          <Link href="/">Home</Link>
          <Link href="/products">Products</Link>
          <Link href="/about">About</Link>

          {/* Domain-specific navigation */}
          {isHendo && (
            <>
              <Link href="/hendo-story">Hendo&apos;s Story</Link>
              <Link href="/legend">The Legend</Link>
            </>
          )}

          {isNebula && (
            <>
              <Link href="/cloud-services">Cloud Services</Link>
              <Link href="/technology">Technology</Link>
            </>
          )}

          <Link href="/login">Login</Link>
        </nav>
      </div>
    </header>
  );
}

