import NursingHomesSuburbGuide from "./NursingHomesSuburbGuide";

export default function NursingHomesNerang() {
  return (
    <NursingHomesSuburbGuide
      suburb="Nerang"
      slug="nursing-homes-nerang"
      intro="Nerang is a well-established suburb in the Gold Coast hinterland, offering families a quieter alternative to coastal aged care placements. It sits close to major arterials and is within easy reach of Gold Coast University Hospital, making it a practical choice for families coordinating hospital-to-care transitions."
      nearby={["Molendinar", "Carrara", "Worongary", "Mudgeeraba", "Robina", "Ashmore"]}
    />
  );
}
