/**
 * Map meal name keywords to a fun emoji thumbnail.
 * Avoids per-meal AI image gen costs while still being visual.
 */
const RULES: Array<[RegExp, string]> = [
  [/(პური|ხაჭაპური|bread|toast|sandwich)/i, "🥖"],
  [/(მჭადი|mchadi)/i, "🌽"],
  [/(ხინკალი|khinkali|dumpl)/i, "🥟"],
  [/(ლობიო|lobio|bean|ლობიოსა)/i, "🫘"],
  [/(სალათი|salad)/i, "🥗"],
  [/(მწვანილი|herb|spinach)/i, "🥬"],
  [/(კიტრი|cucumber)/i, "🥒"],
  [/(პომიდორი|tomato)/i, "🍅"],
  [/(ვაშლი|apple)/i, "🍎"],
  [/(ბანანი|banana)/i, "🍌"],
  [/(ფორთოხალი|orange)/i, "🍊"],
  [/(ბერი|berry|strawberry)/i, "🍓"],
  [/(კვერცხი|egg|omelet|ომლეტი)/i, "🍳"],
  [/(ქათამი|chicken)/i, "🍗"],
  [/(ხორცი|meat|steak|beef)/i, "🥩"],
  [/(თევზი|fish|salmon|tuna)/i, "🐟"],
  [/(ბრინჯი|rice)/i, "🍚"],
  [/(მაკარონი|pasta|noodle)/i, "🍝"],
  [/(პიცა|pizza)/i, "🍕"],
  [/(ბურგერი|burger)/i, "🍔"],
  [/(სუპი|soup|ხარჩო|kharcho)/i, "🍲"],
  [/(იოგურტი|yogurt|მაცონი|matsoni)/i, "🥛"],
  [/(ყველი|cheese)/i, "🧀"],
  [/(კარტოფილი|potato)/i, "🥔"],
  [/(კაკაო|chocolate|შოკოლადი)/i, "🍫"],
  [/(ნაყინი|ice cream)/i, "🍨"],
  [/(ნაცარი|nut|almond|walnut|ნიგოზი)/i, "🌰"],
  [/(კოფე|coffee|ყავა)/i, "☕"],
  [/(ჩაი|tea)/i, "🍵"],
  [/(წვენი|juice|smoothie)/i, "🥤"],
  [/(კარალიოკი|carrot|ქარალიოკი)/i, "🥕"],
];

export function emojiForMeal(name: string): string {
  for (const [re, e] of RULES) if (re.test(name)) return e;
  return "🍽️";
}

export function MealAvatar({ name, size = 40 }: { name: string; size?: number }) {
  const e = emojiForMeal(name);
  return (
    <div
      className="flex items-center justify-center rounded-[10px] bg-brand-soft"
      style={{ width: size, height: size, fontSize: size * 0.55 }}
      aria-hidden
    >
      <span style={{ lineHeight: 1 }}>{e}</span>
    </div>
  );
}
