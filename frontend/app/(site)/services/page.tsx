export const metadata = { title: "Services" };

const SERVICES = [
  {
    title: "Property buying assistance",
    body: "Guidance through shortlisting, site visits, and paperwork when you're buying a home in Thane.",
  },
  {
    title: "Property selling assistance",
    body: "Help pricing, presenting, and marketing your property to the right buyers.",
  },
  {
    title: "Rental assistance",
    body: "Support finding tenants or a rental home that fits your needs and budget.",
  },
  {
    title: "Property consultation",
    body: "One-on-one advice on locality, pricing, and timing based on local market familiarity.",
  },
  {
    title: "Site visit coordination",
    body: "Scheduling and accompanying visits so you can evaluate properties in person.",
  },
  {
    title: "Local property guidance",
    body: "Practical, ground-level insight into Thane's neighborhoods, from someone who works here.",
  },
];

export default function ServicesPage() {
  return (
    <main className="px-6 lg:px-16 py-16 max-w-4xl">
      <h1 className="font-display text-4xl text-ink mb-4">Services</h1>
      <p className="text-stone max-w-prose mb-12">
        HappyHouse works with buyers, sellers, and tenants across Thane. Here&apos;s how we can help —
        we don&apos;t offer legal or financial guarantees, but we do offer local experience and a
        straightforward process.
      </p>

      <div className="grid sm:grid-cols-2 gap-x-10 gap-y-10">
        {SERVICES.map((service) => (
          <div key={service.title} className="border-t border-line pt-4">
            <h2 className="font-display text-xl text-ink mb-2">{service.title}</h2>
            <p className="text-ink/80">{service.body}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
