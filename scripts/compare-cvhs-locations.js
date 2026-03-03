#!/usr/bin/env node
/**
 * Compare user's 19 locations to NPPES 23. Find NPIs in NPPES not in user list.
 */
const nppes23 = [
  { npi: "1972631661", name: "CENTRAL VIRGINIA HEALTH SERVICES INC", address: "11814 KING WILLIAM RD", city: "AYLETT", state: "VA", zip: "230094103", phone: "804-769-3022" },
  { npi: "1134258601", name: "CENTRAL VIRGINIA HEALTH SERVICES INC", address: "25 S UNION ST", city: "PETERSBURG", state: "VA", zip: "238034221", phone: "804-957-9601" },
  { npi: "1215066782", name: "CENTRAL VIRGINIA HEALTH SERVICES INC", address: "833 BUFFALO STREET, SUITE 200", city: "FARMVILLE", state: "VA", zip: "23901", phone: "434-392-8177" },
  { npi: "1801411202", name: "CENTRAL VIRGINIA HEALTH SERVICES INC", address: "3101 JOHNSON RD", city: "PETERSBURG", state: "VA", zip: "238052338", phone: "804-861-4884" },
  { npi: "1891823498", name: "CENTRAL VIRGINIA HEALTH SERVICES INC", address: "165 LEGRANDE AVENUE", city: "CHARLOTTE COURTHOUSE", state: "VA", zip: "23923", phone: "434-542-5560" },
  { npi: "1730377706", name: "CENTRAL VIRGINIA HEALTH SERVICES INC", address: "1965 EMANCIPATION HWY, SUITE 100", city: "FREDERICKSBURG", state: "VA", zip: "224016213", phone: "540-735-0560" },
  { npi: "1902934680", name: "CENTRAL VIRGINIA HEALTH SERVICES INC", address: "4260 CROSSINGS BLVD, SUITE 2", city: "PRINCE GEORGE", state: "VA", zip: "238751400", phone: "434-542-5560" },
  { npi: "1235259607", name: "CENTRAL VIRGINIA HEALTH SERVICES INC", address: "25892 N. JAMES MADISON HWY", city: "NEW CANTON", state: "VA", zip: "23123", phone: "434-581-3271" },
  { npi: "1518095280", name: "CENTRAL VIRGINIA HEALTH SERVICES INC", address: "9950 COURTHOUSE RD", city: "CHARLES CITY", state: "VA", zip: "230303434", phone: "804-829-6600" },
  { npi: "1952535916", name: "CENTRAL VIRGINIA HEALTH SERVICES INC", address: "102 WEST BROADDUS AVENUE, SUITE 200", city: "BOWLING GREEN", state: "VA", zip: "224279404", phone: "804-632-1030" },
  { npi: "1306975875", name: "CENTRAL VIRGINIA HEALTH SERVICES INC", address: "18849 KINGS HIGHWAY", city: "MONTROSS", state: "VA", zip: "22520", phone: "804-493-9999" },
  { npi: "1992132682", name: "CENTRAL VIRGINIA HEALTH SERVICES INC", address: "17202 RICHMOND TURNPIKE", city: "MILFORD", state: "VA", zip: "22514", phone: "804-633-5465" },
  { npi: "1548632508", name: "CENTRAL VIRGINIA HEALTH SERVICES INC", address: "1101 E JEFFERSON ST STE 1", city: "CHARLOTTESVILLE", state: "VA", zip: "229025353", phone: "434-227-5624" },
  { npi: "1831228444", name: "CENTRAL VIRGINIA HEALTH SERVICES INC", address: "8380 BOYDTON PLANK ROAD", city: "ALBERTA", state: "VA", zip: "23821", phone: "434-949-7211" },
  { npi: "1972264869", name: "CENTRAL VIRGINIA HEALTH SERVICES INC", address: "400 S MESA DR", city: "HOPEWELL", state: "VA", zip: "238604138", phone: "804-452-5800" },
  { npi: "1588792162", name: "CENTRAL VIRGINIA HEALTH SERVICES INC", address: "2256 IRISH RD", city: "ESMONT", state: "VA", zip: "229371945", phone: "434-286-3602" },
  { npi: "1588878474", name: "CENTRAL VIRGINIA HEALTH SERVICES INC", address: "321C POPLAR DR", city: "PETERSBURG", state: "VA", zip: "238059306", phone: "804-733-5591" },
  { npi: "1104014703", name: "CENTRAL VIRGINIA HEALTH SERVICES INC", address: "410 INDUSTRIAL DRIVE", city: "LOUISA", state: "VA", zip: "23093", phone: "434-581-3271" },
  { npi: "1275512063", name: "CENTRAL VIRGINIA HEALTH SERVICES INC", address: "25892 N JAMES MADISON HWY", city: "NEW CANTON", state: "VA", zip: "231232234", phone: "434-581-3271" },
  { npi: "1568106458", name: "CENTRAL VIRGINIA HEALTH SERVICES, INC.", address: "541 S SYCAMORE ST", city: "PETERSBURG", state: "VA", zip: "238035039", phone: "804-835-6100" },
  { npi: "1245925106", name: "CENTRAL VIRGINIA HEALTH SERVICES, INC.", address: "120 DAVID BRUCE AVE", city: "CHARLOTTE COURT HOUSE", state: "VA", zip: "239233741", phone: "434-542-5171" },
  { npi: "1356302988", name: "CENTRAL VIRGINIA HEALTH SERVICES, INC.", address: "25892 N JAMES MADISON HWY", city: "NEW CANTON", state: "VA", zip: "231232234", phone: "434-581-3271" },
  { npi: "1205683208", name: "CENTRAL VIRGINIA HEALTH SERVICES, INC.", address: "410 INDUSTRIAL DR", city: "LOUISA", state: "VA", zip: "23093", phone: "540-967-9401" },
];

const user19 = [
  { npi: "1972631661", address: "11814 KING WILLIAM RD", city: "AYLETT", state: "VA", zip: "230094103", phone: "804-769-3022" },
  { npi: "1134258601", address: "25 S UNION ST", city: "PETERSBURG", state: "VA", zip: "238034221", phone: "804-957-9601" },
  { npi: "1215066782", address: "833 BUFFALO STREET SUITE 200", city: "FARMVILLE", state: "VA", zip: "23901", phone: "434-392-8177" },
  { npi: "1801411202", address: "3101 JOHNSON RD", city: "PETERSBURG", state: "VA", zip: "238052338", phone: "804-861-4884" },
  { npi: "1891823498", address: "165 LEGRANDE AVENUE", city: "CHARLOTTE COURTHOUSE", state: "VA", zip: "23923", phone: "434-542-5560" },
  { npi: "1730377706", address: "1965 EMANCIPATION HWY SUITE 100", city: "FREDERICKSBURG", state: "VA", zip: "224016213", phone: "540-735-0560" },
  { npi: "1902934680", address: "4260 CROSSINGS BLVD SUITE 2", city: "PRINCE GEORGE", state: "VA", zip: "238751400", phone: "434-542-5560" },
  { npi: "1235259607", address: "25892 N. JAMES MADISON HWY", city: "NEW CANTON", state: "VA", zip: "23123", phone: "434-581-3271" },
  { npi: "1518095280", address: "9950 COURTHOUSE RD", city: "CHARLES CITY", state: "VA", zip: "230303434", phone: "804-829-6600" },
  { npi: "1952535916", address: "102 WEST BROADDUS AVENUE SUITE 200", city: "BOWLING GREEN", state: "VA", zip: "224279404", phone: "804-632-1030" },
  { npi: "1306975875", address: "18849 KINGS HIGHWAY", city: "MONTROSS", state: "VA", zip: "22520", phone: "804-493-9999" },
  { npi: "1992132682", address: "17202 RICHMOND TURNPIKE", city: "MILFORD", state: "VA", zip: "22514", phone: "804-633-5465" },
  { npi: "1548632508", address: "1101 E JEFFERSON ST STE 1", city: "CHARLOTTESVILLE", state: "VA", zip: "229025353", phone: "434-227-5624" },
  { npi: "1831228444", address: "8380 BOYDTON PLANK ROAD", city: "ALBERTA", state: "VA", zip: "23821", phone: "434-949-7211" },
  { npi: "1972264869", address: "400 S MESA DR", city: "HOPEWELL", state: "VA", zip: "238604138", phone: "804-452-5800" },
  { npi: "1588792162", address: "2256 IRISH RD", city: "ESMONT", state: "VA", zip: "229371945", phone: "434-286-3602" },
  { npi: "1588878474", address: "321C POPLAR DR", city: "PETERSBURG", state: "VA", zip: "238059306", phone: "804-733-5591" },
  { npi: "1104014703", address: "410 INDUSTRIAL DRIVE", city: "LOUISA", state: "VA", zip: "23093", phone: "434-581-3271" },
  { npi: "1275512063", address: "25892 N JAMES MADISON HWY", city: "NEW CANTON", state: "VA", zip: "231232234", phone: "434-581-3271" },
];

const userNpis = new Set(user19.map((r) => r.npi));
const inNppesNotInUser = nppes23.filter((r) => !userNpis.has(r.npi));

console.log("Your list: 19 locations. NPPES (zip-first): 23 locations.\n");
console.log("--- In NPPES but NOT in your list (4 locations) ---\n");
inNppesNotInUser.forEach((r, i) => {
  console.log(`${i + 1}. NPI ${r.npi}`);
  console.log(`   ${r.address}, ${r.city}, ${r.state} ${r.zip} | ${r.phone}`);
  console.log("");
});
