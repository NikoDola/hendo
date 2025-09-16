import "@/components/pages/Form.css";

export default function Contact() {
  return (
    <section className="section-regular">
      <form className="formWrapper">
        <div className="inputWrapper">
          <label>Name *</label>
          <input placeholder="Enter your name" required />
        </div>
        <div className="inputWrapper">
          <label>Email *</label>
          <input placeholder="Enter your email" type="email" required />
        </div>
        <div className="inputWrapper">
          <label>Message *</label>
          <textarea placeholder="Enter your message" rows={6} required></textarea>
        </div>
        <button type="submit">Submit</button>
      </form>
    </section>
  );
}
