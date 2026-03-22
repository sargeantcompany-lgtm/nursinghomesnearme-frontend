import NursingHomesSuburbGuide from "./NursingHomesSuburbGuide";

export default function NursingHomesCoomera() {
  return (
    <NursingHomesSuburbGuide
      suburb="Coomera"
      slug="nursing-homes-coomera"
      intro="Coomera is one of the fastest-growing corridors on the Gold Coast, and aged care capacity in the area is expanding to meet demand. Families in Ormeau, Pimpama and Upper Coomera often look here first. The new Coomera Hospital has also improved care pathways for residents transitioning from acute care into residential aged care."
      nearby={["Helensvale", "Oxenford", "Hope Island", "Pimpama", "Ormeau", "Upper Coomera"]}
    />
  );
}
