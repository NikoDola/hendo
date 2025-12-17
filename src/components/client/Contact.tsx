import "@/components/client/Contact.css"

export default function Contact() {
  return (
    <section id="contact" className="section-regular contactWrapper">
      <div>
        <h2 className="contactHeadline"> Dreamstation<br />  hotline </h2>
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
