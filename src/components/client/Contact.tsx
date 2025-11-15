import "@/components/client/Contact.css"

export default function Contact() {
  return (
    <section id="contact" className="section-regular contactWrapper">
      <div>
        <h1 className="contactHeadline"> Dream Station <br /> hotline<br /> </h1>
        <h3>straight to T. Hendo HQ</h3>
      </div>
      <form className="formWrapper">
        <div className="inputWrapper">
          <label>Name *</label>
          <input className="input" placeholder="Enter your name" required />
        </div>
        <div className="inputWrapper">
          <label>Email *</label>
          <input className="input" placeholder="Enter your email" type="email" required />
        </div>
        <div className="inputWrapper">
          <label>Message *</label>
          <textarea className="input" placeholder="Enter your message" rows={6} required></textarea>
        </div>
        <button type="submit">Submit</button>
      </form>
    </section>
  );
}
