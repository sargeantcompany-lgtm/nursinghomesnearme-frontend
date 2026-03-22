import NursingHomesSuburbGuide from "./NursingHomesSuburbGuide";

export default function NursingHomesHelensvale() {
  return (
    <NursingHomesSuburbGuide
      suburb="Helensvale"
      slug="nursing-homes-helensvale"
      intro="Helensvale sits in the northern Gold Coast and is a growing area for aged care, with several facilities serving the expanding residential communities around Hope Island, Coomera and Oxenford. Families in the northern corridor often look to Helensvale as a central option that avoids the traffic congestion of the southern Gold Coast."
      nearby={["Coomera", "Hope Island", "Oxenford", "Runaway Bay", "Arundel", "Parkwood"]}
    />
  );
}
