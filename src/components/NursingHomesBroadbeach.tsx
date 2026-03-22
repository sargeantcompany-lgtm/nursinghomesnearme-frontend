import NursingHomesSuburbGuide from "./NursingHomesSuburbGuide";

export default function NursingHomesBroadbeach() {
  return (
    <NursingHomesSuburbGuide
      suburb="Broadbeach"
      slug="nursing-homes-broadbeach"
      intro="Broadbeach and the surrounding precinct — including Mermaid Waters, Mermaid Beach and Miami — is one of the Gold Coast's most vibrant areas. Aged care facilities here benefit from proximity to the beach, shops, and dining, which matters for lifestyle and family visits. It is also well connected by light rail, making visits easier for families without a car."
      nearby={["Mermaid Waters", "Mermaid Beach", "Miami", "Robina", "Varsity Lakes", "Burleigh"]}
    />
  );
}
