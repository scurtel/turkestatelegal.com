import Image from "next/image";

export const metadata = {
  title: "Contact",
  description:
    "Contact Lawyer Ceren Sumer Cilli for legal guidance related to property purchase in Turkey."
};

export default function ContactPage() {
  return (
    <section>
      <h1>Contact</h1>
      <p>
        For legal guidance related to buying property in Turkey as a foreign
        client, contact Lawyer Ceren Sumer Cilli.
      </p>

      <section className="content-section info-block contact-card">
        <div className="contact-photo-wrap">
          <Image
            src="/images/ceren-sumer-cilli.webp"
            alt="Lawyer Ceren Sumer Cilli"
            width={420}
            height={520}
            className="contact-photo"
            priority
          />
        </div>
        <div className="contact-details">
          <p>
            <strong>Lawyer:</strong> Ceren Sumer Cilli
          </p>
          <p>
            <strong>Phone:</strong>{" "}
            <a href="tel:+905336342425">+90 533 634 24 25</a>
          </p>
          <p>
            <strong>Address:</strong> Gazipasa Mh, Ordu Cd. Dinckan Apt No:7 A
            Blok Daire:3, 01010 Seyhan/Adana
          </p>
          <p>
            <strong>Hours:</strong> Open 24 hours
          </p>
        </div>
      </section>

      <p>
        <a
          className="btn-primary"
          href="https://wa.me/905336342425"
          target="_blank"
          rel="noreferrer"
        >
          Start WhatsApp Conversation
        </a>
      </p>
    </section>
  );
}
