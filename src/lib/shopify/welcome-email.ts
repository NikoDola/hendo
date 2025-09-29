// Custom welcome email template for newsletter subscribers
export const createWelcomeEmail = (customerEmail: string, domain: string) => {
  return {
    to: customerEmail,
    subject: "Welcome to HENDO Music Newsletter! 🎵",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #5227FF;">Welcome to HENDO Music!</h1>
        <p>Thank you for subscribing to our newsletter. You'll be the first to hear about:</p>
        <ul>
          <li>🎵 New music releases</li>
          <li>👕 Exclusive clothing drops</li>
          <li>🎬 Behind-the-scenes content</li>
          <li>🚀 Site launch notifications</li>
        </ul>
        <p>Visit our website: <a href="${domain}" style="color: #5227FF;">${domain}</a></p>
        <p>Best regards,<br>HENDO Music Team</p>
      </div>
    `
  };
};

