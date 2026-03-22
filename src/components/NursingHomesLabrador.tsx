import NursingHomesSuburbGuide from "./NursingHomesSuburbGuide";

export default function NursingHomesLabrador() {
  return (
    <NursingHomesSuburbGuide
      suburb="Labrador"
      slug="nursing-homes-labrador"
      intro="Labrador is one of the Gold Coast's most established suburbs for aged care, sitting between Southport and Biggera Waters along the Broadwater. Its central location, flat terrain, and strong public transport links make it a practical choice for families — particularly those with a loved one who values being close to the water and local shops."
      nearby={["Southport", "Biggera Waters", "Runaway Bay", "Ashmore", "Parkwood", "Arundel"]}
    />
  );
}
