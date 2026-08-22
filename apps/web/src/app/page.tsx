import { HeroActions } from "@/components/marketing/hero-actions";
import {
  MarketingIcon,
  type MarketingIconName,
} from "@/components/marketing/marketing-icon";
import { PricingSection } from "@/components/marketing/pricing-section";
import { PublicFooter } from "@/components/marketing/public-footer";
import { PublicHeader } from "@/components/marketing/public-header";
import { ReportPreview } from "@/components/marketing/report-preview";
import { SectionHeading } from "@/components/marketing/section-heading";

const values = [
  ["One search", "Start with a title deed number"],
  ["Consolidated view", "Review key property details together"],
  ["Portable result", "Downloadable report format"],
  ["Secure access", "Account-based session protection"],
] as const;

const features: Array<{
  icon: MarketingIconName;
  title: string;
  description: string;
}> = [
  {
    icon: "status",
    title: "Availability status",
    description:
      "See whether a seeded property record is marked available, sold, or under transaction.",
  },
  {
    icon: "rate",
    title: "Estimated land rate",
    description:
      "Review the recorded estimated land rate alongside the property details that give it context.",
  },
  {
    icon: "zoning",
    title: "Zoning classification",
    description:
      "Understand the current zoning category and any recorded notes or restrictions in one place.",
  },
  {
    icon: "lien",
    title: "Loans and liens",
    description:
      "Surface recorded loan, lien, active, clear, or overdue information before your next decision.",
  },
  {
    icon: "history",
    title: "Ownership history",
    description:
      "Follow dated ownership entries to understand how a title record has changed over time.",
  },
  {
    icon: "report",
    title: "Downloadable report",
    description:
      "Bring the available information into a clear PDF report for convenient review and discussion.",
  },
];

const steps = [
  ["01", "Create your account", "Set up secure access to your personal dashboard."],
  ["02", "Choose an access plan", "Select weekly, monthly, or annual access—the features stay the same."],
  ["03", "Enter a title deed number", "Use the exact title reference to begin a consolidated lookup."],
  ["04", "Review the result", "Read the available details together and download a report when supported."],
] as const;

const faqs = [
  {
    question: "Do I need an account?",
    answer:
      "Yes. An account provides secure dashboard access and will associate future searches with the correct user.",
  },
  {
    question: "What does a subscription unlock?",
    answer:
      "A subscription will unlock paid operations such as title deed searches and report access. Authentication alone still gives you dashboard access.",
  },
  {
    question: "Are all features included in every plan?",
    answer:
      "Yes. Weekly, Monthly, and Annual plans provide the same platform features. Only the access duration changes.",
  },
  {
    question: "Can I access the dashboard before paying?",
    answer:
      "Yes. You can create an account and enter the dashboard without a subscription. Paid operations will be gated in a later phase.",
  },
  {
    question: "Is Ardhi connected to an official land registry?",
    answer:
      "Not in the current MVP. The platform presently uses synthetic seeded development data. Real registry integrations may be added later.",
  },
];

export default function Home() {
  return (
    <div className="overflow-x-clip bg-[#fbfaf6] text-stone-950">
      <PublicHeader />

      <main>
        <section className="relative border-b border-stone-200">
          <div className="land-grid pointer-events-none absolute inset-0 opacity-35" />
          <div className="relative mx-auto grid max-w-7xl gap-14 px-5 py-16 sm:px-8 sm:py-22 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:px-10 lg:py-28">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-900/15 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-900">
                <span className="size-1.5 rounded-full bg-emerald-700" />
                Clearer land information, one title at a time
              </div>
              <h1 className="mt-6 max-w-2xl text-4xl font-bold leading-[1.08] tracking-[-0.05em] text-stone-950 sm:text-5xl lg:text-[3.65rem]">
                See the story behind a title deed in one clear view.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-stone-600">
                Search by title deed number and review availability, estimated
                land rate, zoning, loans or liens, and ownership history in a
                consolidated report.
              </p>
              <HeroActions />
              <p className="mt-5 flex items-start gap-2 text-xs leading-5 text-stone-500">
                <span aria-hidden="true" className="mt-1 text-emerald-700">●</span>
                The current MVP uses synthetic seeded data and is not connected
                to an official government registry.
              </p>
            </div>

            <ReportPreview />
          </div>
        </section>

        <section aria-label="Platform value" className="border-b border-stone-200 bg-white">
          <div className="mx-auto grid max-w-7xl grid-cols-2 px-5 sm:px-8 lg:grid-cols-4 lg:px-10">
            {values.map(([title, description], index) => (
              <div
                key={title}
                className={`py-7 pr-4 sm:py-8 ${
                  index % 2 === 0 ? "border-r border-stone-200" : "pl-5"
                } ${index > 1 ? "border-t border-stone-200 lg:border-t-0" : ""} ${
                  index > 0 ? "lg:border-l lg:pl-7" : "lg:border-r-0"
                }`}
              >
                <p className="text-sm font-bold text-stone-900">{title}</p>
                <p className="mt-1 text-xs leading-5 text-stone-500">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="features" className="scroll-mt-24 px-5 py-20 sm:px-8 sm:py-28 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              eyebrow="A complete view"
              title="The details that matter, organized for action."
              description="Bring core land information into one readable workspace instead of piecing together disconnected records."
            />
            <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-stone-200 bg-stone-200 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <article key={feature.title} className="bg-white p-7 sm:p-8">
                  <div className="grid size-11 place-items-center rounded-md bg-emerald-50 text-emerald-900">
                    <MarketingIcon name={feature.icon} />
                  </div>
                  <h3 className="mt-6 text-lg font-bold tracking-tight text-stone-950">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-stone-600">
                    {feature.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-24 bg-emerald-950 px-5 py-20 text-white sm:px-8 sm:py-28 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">How it works</p>
              <h2 className="mt-4 text-3xl font-bold tracking-[-0.035em] sm:text-4xl">
                From title number to a clearer next step.
              </h2>
              <p className="mt-4 text-base leading-7 text-emerald-100/65">
                A straightforward flow designed for everyday users and land professionals alike.
              </p>
            </div>
            <ol className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map(([number, title, description]) => (
                <li key={number} className="border-t border-emerald-700/60 pt-5">
                  <span className="font-mono text-xs font-bold text-amber-300">{number}</span>
                  <h3 className="mt-5 text-lg font-bold">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-emerald-100/60">{description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <PricingSection />

        <section className="px-5 py-20 sm:px-8 sm:py-28 lg:px-10">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
            <SectionHeading
              eyebrow="Common questions"
              title="Clear answers before you begin."
              description="What the platform does today, what access means, and where the MVP is headed."
            />
            <div className="divide-y divide-stone-200 border-y border-stone-200">
              {faqs.map((faq) => (
                <details key={faq.question} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 rounded-sm text-base font-bold text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 [&::-webkit-details-marker]:hidden">
                    {faq.question}
                    <span aria-hidden="true" className="text-xl font-normal text-emerald-800 transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="max-w-2xl pr-10 pt-3 text-sm leading-6 text-stone-600">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-stone-200 bg-white px-5 py-18 sm:px-8 lg:px-10">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-7 md:flex-row md:items-center">
            <div>
              <p className="text-2xl font-bold tracking-[-0.035em] text-stone-950 sm:text-3xl">
                Start with a clearer view of the land record.
              </p>
              <p className="mt-2 text-sm text-stone-600">Create an account now. Choose a plan when you are ready.</p>
            </div>
            <HeroActions />
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
