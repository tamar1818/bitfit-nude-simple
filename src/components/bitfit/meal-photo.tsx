import { useMemo } from "react";
import { emojiForMeal } from "./meal-emoji";

import breakfast from "@/assets/meals/breakfast.jpg";
import salad from "@/assets/meals/salad.jpg";
import meat from "@/assets/meals/meat.jpg";
import chicken from "@/assets/meals/chicken.jpg";
import fish from "@/assets/meals/fish.jpg";
import soup from "@/assets/meals/soup.jpg";
import rice from "@/assets/meals/rice.jpg";
import pasta from "@/assets/meals/pasta.jpg";
import bread from "@/assets/meals/bread.jpg";
import fruit from "@/assets/meals/fruit.jpg";
import smoothie from "@/assets/meals/smoothie.jpg";
import khinkali from "@/assets/meals/khinkali.jpg";
import lobio from "@/assets/meals/lobio.jpg";
import yogurt from "@/assets/meals/yogurt.jpg";
import eggs from "@/assets/meals/eggs.jpg";

/**
 * Map meal name keywords to a realistic food photograph thumbnail.
 * Falls back to an emoji-on-gradient tile when nothing matches.
 */
const PHOTO_RULES: Array<[RegExp, string]> = [
  [/(ხინკალი|khinkali|dumpl)/i, khinkali],
  [/(ლობიო|lobio|bean)/i, lobio],
  [/(მჭადი|mchadi|cornbread)/i, bread],
  [/(პური|ხაჭაპური|bread|toast|sandwich|baguette)/i, bread],
  [/(სალათი|salad)/i, salad],
  [/(კვერცხი|egg|omelet|ომლეტი|avocado toast)/i, eggs],
  [/(ქათამი|chicken|turkey)/i, chicken],
  [/(თევზი|fish|salmon|tuna|seafood)/i, fish],
  [/(ხორცი|meat|steak|beef|pork|lamb|ცხვარი)/i, meat],
  [/(ბრინჯი|rice|pilaf|plov)/i, rice],
  [/(მაკარონი|pasta|noodle|spaghetti|penne)/i, pasta],
  [/(სუპი|soup|ხარჩო|kharcho|stew|borscht)/i, soup],
  [/(იოგურტი|yogurt|მაცონი|matsoni|kefir)/i, yogurt],
  [/(წვენი|juice|smoothie|shake)/i, smoothie],
  [/(ხილ|fruit|apple|banana|berry|strawberry|orange|ვაშლი|ბანანი|ფორთოხალი|ბერი)/i, fruit],
  [/(საუზმე|breakfast|oats|granola|porridge|cereal|muesli)/i, breakfast],
];

function photoForMeal(name: string): string | null {
  for (const [re, src] of PHOTO_RULES) if (re.test(name)) return src;
  return null;
}

export function MealPhoto({
  name,
  size = 44,
  rounded = 12,
}: {
  name: string;
  size?: number;
  rounded?: number;
}) {
  const src = useMemo(() => photoForMeal(name), [name]);

  if (src) {
    return (
      <div
        className="overflow-hidden bg-secondary"
        style={{ width: size, height: size, borderRadius: rounded }}
      >
        <img
          src={src}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  // Fallback: emoji on warm gradient
  return (
    <div
      className="flex items-center justify-center bg-gradient-to-br from-brand-soft to-secondary"
      style={{
        width: size,
        height: size,
        borderRadius: rounded,
        fontSize: size * 0.55,
      }}
      aria-hidden
    >
      <span style={{ lineHeight: 1 }}>{emojiForMeal(name)}</span>
    </div>
  );
}

/** Photo source for use as a background image (e.g. quick-add tiles). */
export function mealBackgroundFor(name: string): string | null {
  return photoForMeal(name);
}
