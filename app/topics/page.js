import Link from "next/link";
import { getAllTopicGuides } from "@/lib/topic-guides";

export const metadata = {
  title: {
    absolute: "Topic Guides for Foreign Property Buyers in Turkey"
  },
  description:
    "Curated legal topic hubs on buying property, due diligence, citizenship, residence permits, and Mersin investment in Turkey."
};

export default function TopicsIndexPage() {
  const topics = getAllTopicGuides();

  return (
    <section className="section-space topic-index">
      <p className="topic-kicker">Topic Guides</p>
      <h1>Legal guides organized by topic</h1>
      <p className="topic-lead">
        Each hub starts with a main pillar article and links to related guides,
        so you can follow one clear path instead of searching through every
        article on the site.
      </p>

      <div className="topic-index-grid">
        {topics.map((topic) => (
          <article className="topic-index-card" key={topic.slug}>
            <h2>
              <Link href={`/topics/${topic.slug}`}>{topic.title}</Link>
            </h2>
            <p>{topic.intro}</p>
            <p>
              <Link href={`/topics/${topic.slug}`}>Open topic guide</Link>
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
