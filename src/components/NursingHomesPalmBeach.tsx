import NursingHomesSuburbGuide from "./NursingHomesSuburbGuide";

export default function NursingHomesPalmBeach() {
  return (
    <NursingHomesSuburbGuide
      suburb="Palm Beach"
      slug="nursing-homes-palm-beach"
      intro="Palm Beach is a sought-after coastal suburb at the southern end of the Gold Coast, offering a relaxed lifestyle close to the beach and local cafes. Families looking for aged care in Palm Beach are often drawn to the lifestyle benefits for their loved one — a calm, beachside environment that contrasts with busier suburban facilities further north."
      nearby={["Currumbin", "Tugun", "Elanora", "Burleigh Heads", "Coolangatta", "Varsity Lakes"]}
    />
  );
}
