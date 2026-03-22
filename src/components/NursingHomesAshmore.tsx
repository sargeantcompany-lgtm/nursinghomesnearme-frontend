import NursingHomesSuburbGuide from "./NursingHomesSuburbGuide";

export default function NursingHomesAshmore() {
  return (
    <NursingHomesSuburbGuide
      suburb="Ashmore"
      slug="nursing-homes-ashmore"
      intro="Ashmore is a well-connected, quiet suburb in the heart of the Gold Coast, popular with families seeking aged care close to Southport and the major hospital precinct. It offers easy freeway access and proximity to Gold Coast University Hospital, making it a convenient base for families coordinating care after a hospital stay."
      nearby={["Southport", "Labrador", "Parkwood", "Molendinar", "Nerang", "Arundel"]}
    />
  );
}
