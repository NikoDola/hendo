export default function SSLTest() {
  return (
    <div style={{
      padding: '2rem',
      fontFamily: 'Arial, sans-serif',
      background: 'linear-gradient(135deg, #5227FF, #FF9FFC)',
      minHeight: '100vh',
      color: 'white',
      textAlign: 'center'
    }}>
      <h1>🔒 SSL Test Page</h1>
      <p>If you can see this page, SSL is working!</p>

      <div style={{
        background: 'rgba(255,255,255,0.1)',
        padding: '2rem',
        borderRadius: '10px',
        margin: '2rem 0',
        maxWidth: '600px',
        marginLeft: 'auto',
        marginRight: 'auto'
      }}>
        <h2>Domain Test Results:</h2>
        <p><strong>Current URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'Loading...'}</p>
        <p><strong>Protocol:</strong> {typeof window !== 'undefined' ? window.location.protocol : 'Loading...'}</p>
        <p><strong>Host:</strong> {typeof window !== 'undefined' ? window.location.host : 'Loading...'}</p>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h3>Test Links:</h3>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a
            href="https://thelegendofhendo.com/ssl-test"
            style={{
              background: 'white',
              color: '#5227FF',
              padding: '0.5rem 1rem',
              borderRadius: '5px',
              textDecoration: 'none',
              display: 'inline-block'
            }}
          >
            Test: thelegendofhendo.com
          </a>
          <a
            href="https://www.thelegendofhendo.com/ssl-test"
            style={{
              background: 'white',
              color: '#5227FF',
              padding: '0.5rem 1rem',
              borderRadius: '5px',
              textDecoration: 'none',
              display: 'inline-block'
            }}
          >
            Test: www.thelegendofhendo.com
          </a>
        </div>
      </div>

      <div style={{ marginTop: '2rem', fontSize: '0.9rem', opacity: 0.8 }}>
        <p>✅ If you can access this page without SSL errors, use this domain for verification links.</p>
        <p>❌ If you get SSL errors, try the other domain or use localhost for development.</p>
      </div>
    </div>
  );
}
