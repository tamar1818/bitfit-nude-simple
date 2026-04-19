import { createFileRoute, Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { Logo } from "@/components/bitfit/logo";
import { LanguageToggle } from "@/components/bitfit/language-toggle";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
  head: () => ({
    meta: [
      { title: "Privacy Policy — Bitfit" },
      {
        name: "description",
        content:
          "How Bitfit collects, stores and protects your personal data. Read our privacy policy.",
      },
    ],
  }),
});

function PrivacyPage() {
  const { lang } = useI18n();
  const c = lang === "ka" ? content.ka : content.en;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-2">
            <Logo size={28} showWordmark />
          </Link>
          <LanguageToggle />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-10">
        <h1 className="font-display text-4xl font-bold text-ink">{c.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{c.updated}</p>

        <div className="mt-8 space-y-8 text-[15px] leading-relaxed text-ink/85">
          {c.sections.map((s) => (
            <section key={s.heading}>
              <h2 className="font-display text-xl font-bold text-ink">{s.heading}</h2>
              <p className="mt-2 whitespace-pre-line">{s.body}</p>
            </section>
          ))}

          <section>
            <h2 className="font-display text-xl font-bold text-ink">{c.contactHeading}</h2>
            <p className="mt-2">
              {c.contactBody}{" "}
              <a
                href="mailto:hello@bitfit.app"
                className="font-medium text-primary underline underline-offset-2"
              >
                hello@bitfit.app
              </a>
            </p>
          </section>
        </div>

        <div className="mt-12 border-t border-border pt-6 text-center">
          <Link to="/" className="text-sm font-medium text-primary hover:underline">
            ← {c.back}
          </Link>
        </div>
      </main>
    </div>
  );
}

const content = {
  en: {
    title: "Privacy Policy",
    updated: "Last updated: April 2026",
    back: "Back to Bitfit",
    contactHeading: "Contact",
    contactBody: "Questions about your data? Email us at",
    sections: [
      {
        heading: "1. What we collect",
        body:
          "When you use Bitfit we collect only the information needed to run the app:\n• Account: email address and (if you provide them) your name and profile photo.\n• Health & fitness: age, gender, height, weight history, daily calorie goal, water, steps, meals and activities you log.\n• Coach data: if you join a coach, your basic stats are visible to that coach only.\n• Technical: anonymous error logs to help us fix bugs.",
      },
      {
        heading: "2. How we use your data",
        body:
          "We use your data exclusively to provide the Bitfit experience: showing your progress, calculating calorie targets, sending in-app suggestions, and connecting you with coaches or groups you choose to join. We do not sell your data and we do not use it for advertising.",
      },
      {
        heading: "3. Where your data is stored",
        body:
          "Your data is stored on secure cloud infrastructure provided by Supabase (powered by AWS, EU region). All traffic is encrypted in transit (HTTPS) and at rest. Access is restricted by row-level security so only you (and any coach you authorize) can read your records.",
      },
      {
        heading: "4. AI features",
        body:
          "When you request meal suggestions, the remaining calories and your goal are sent to an AI model via Lovable AI Gateway to generate ideas. We do not send your name, email, or weight history. AI providers do not retain prompts for training.",
      },
      {
        heading: "5. Your rights",
        body:
          "You can:\n• Export your data (request via email).\n• Correct any field from the Settings screen.\n• Delete your account and all related data permanently from Settings → Delete account. This is irreversible.",
      },
      {
        heading: "6. Children",
        body:
          "Bitfit is intended for users aged 16 and older. We do not knowingly collect data from children under 16. If you believe a child has created an account, contact us and we will remove it.",
      },
      {
        heading: "7. Changes",
        body:
          "We may update this policy. Material changes will be announced inside the app before they take effect.",
      },
    ],
  },
  ka: {
    title: "კონფიდენციალურობის პოლიტიკა",
    updated: "ბოლო განახლება: 2026 აპრილი",
    back: "უკან Bitfit-ზე",
    contactHeading: "კონტაქტი",
    contactBody: "შეკითხვები შენს მონაცემებთან დაკავშირებით? მოგვწერე",
    sections: [
      {
        heading: "1. რას ვაგროვებთ",
        body:
          "Bitfit-ის გამოყენებისას ვაგროვებთ მხოლოდ აპლიკაციის მუშაობისთვის საჭირო ინფორმაციას:\n• ანგარიში: ელ-ფოსტა და (სურვილისამებრ) სახელი და პროფილის ფოტო.\n• ჯანმრთელობა: ასაკი, სქესი, სიმაღლე, წონის ისტორია, კალორიების მიზანი, წყალი, ნაბიჯები, კერძები და აქტივობები.\n• მწვრთნელის მონაცემები: თუ შეუერთდი მწვრთნელს, შენი ძირითადი სტატისტიკა მხოლოდ მას ჩანს.\n• ტექნიკური: ანონიმური შეცდომების ლოგები ბაგების გასასწორებლად.",
      },
      {
        heading: "2. როგორ ვიყენებთ მონაცემებს",
        body:
          "მონაცემებს ვიყენებთ მხოლოდ Bitfit-ის სერვისის მისაწოდებლად: პროგრესის საჩვენებლად, კალორიების გამოსათვლელად, შემოთავაზებების გასაგზავნად და მწვრთნელ-ჯგუფებთან დასაკავშირებლად. არ ვყიდით მონაცემებს და არ ვიყენებთ რეკლამისთვის.",
      },
      {
        heading: "3. სად ინახება მონაცემები",
        body:
          "შენი მონაცემები ინახება უსაფრთხო ღრუბლოვან ინფრასტრუქტურაში (Supabase / AWS, ევროკავშირის რეგიონი). მთელი ტრაფიკი დაშიფრულია (HTTPS) და მონაცემები დაცულია row-level უსაფრთხოებით — მათ წვდომა აქვს მხოლოდ შენ და შენს მიერ არჩეულ მწვრთნელს.",
      },
      {
        heading: "4. AI ფუნქციები",
        body:
          "როცა ითხოვ კერძის შემოთავაზებებს, ჩვენ ვაგზავნით მხოლოდ დარჩენილ კალორიებს და შენს მიზანს AI მოდელთან Lovable AI Gateway-ს მეშვეობით. სახელი, ელ-ფოსტა ან წონის ისტორია არ იგზავნება. AI პროვაიდერი არ ინახავს მოთხოვნებს ტრენინგისთვის.",
      },
      {
        heading: "5. შენი უფლებები",
        body:
          "შეგიძლია:\n• მოითხოვო მონაცემების ექსპორტი ელ-ფოსტით.\n• პარამეტრების გვერდიდან შეცვალო ნებისმიერი ველი.\n• სამუდამოდ წაშალო ანგარიში პარამეტრები → ანგარიშის წაშლა. ეს ქმედება შეუქცევადია.",
      },
      {
        heading: "6. ბავშვები",
        body:
          "Bitfit განკუთვნილია 16 წლის და უფროსი მომხმარებლისთვის. ჩვენ შეგნებულად არ ვაგროვებთ მონაცემებს 16 წლამდე ბავშვებზე. თუ ფიქრობ, რომ ბავშვმა შექმნა ანგარიში, მოგვწერე და წავშლით.",
      },
      {
        heading: "7. ცვლილებები",
        body:
          "შეიძლება ეს პოლიტიკა განვაახლოთ. მნიშვნელოვანი ცვლილებები გამოცხადდება აპლიკაციაში ძალაში შესვლამდე.",
      },
    ],
  },
} as const;
