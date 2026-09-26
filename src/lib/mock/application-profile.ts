// Full student profile behind an application: personal details, education,
// work, language tests, declaration, documents and contract. Derived from the
// application with a seeded generator so the same student always gets the
// same profile; edits are kept for the session.
import type { ApplicationRow, ApplicationStage } from "./applications";

export interface Address {
  line1: string;
  line2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
}

export interface PersonalProfile {
  title: string;
  fullName: string;
  gender: string;
  dob: string;
  nationality: string;
  ethnicOrigin: string;
  firstLanguage: string;
  maritalStatus: string;
  residentialStatus: string;
  ukEntryDate: string;
  shareCode: string;
  passportNo: string;
  passportIssue: string;
  passportExpiry: string;
}

export interface Qualification {
  id: string;
  level: string;
  qualification: string;
  institute: string;
  subject: string;
  grade: string;
  year: string;
  status: "Completed" | "Ongoing" | "Awaiting result";
}

export interface WorkItem {
  id: string;
  employer: string;
  role: string;
  type: string;
  start: string;
  end: string;
  duties: string;
}

export interface LanguageTest {
  id: string;
  test: string;
  status: "Completed" | "Booked" | "Not required";
  overall: string;
  bands?: { listening: string; reading: string; writing: string; speaking: string };
  date: string;
  note?: string;
}

export interface DeclarationItem {
  question: string;
  answer: "Yes" | "No";
  detail?: string;
}

export type DocumentStatus = "Verified" | "Pending review" | "Missing" | "Rejected";
export interface StudentDocument {
  id: string;
  type: string;
  fileName: string;
  size: string;
  uploadedAt: string;
  status: DocumentStatus;
}

export interface SentEmail {
  id: string;
  subject: string;
  body: string;
  to: string;
  by: string;
  at: string;
}

export interface StatusEvent {
  stage: ApplicationStage;
  at: string;
  by: string;
}

export interface ApplicationProfile {
  applicationType: "Home" | "EU/Home" | "International";
  personal: PersonalProfile;
  presentAddress: Address;
  permanentAddress: Address;
  sameAddress: boolean;
  education: Qualification[];
  work: WorkItem[];
  languages: LanguageTest[];
  declaration: DeclarationItem[];
  feesPayment: string;
  documents: StudentDocument[];
  contract: { status: "Not sent" | "Awaiting signature" | "Approved"; token: string; sentAt?: string };
  emails: SentEmail[];
  history: StatusEvent[];
}

// --- Seeded helpers -------------------------------------------------------

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
type Rand = () => number;
const pick = <T,>(r: Rand, xs: readonly T[]) => xs[Math.floor(r() * xs.length)];
const int = (r: Rand, min: number, max: number) => min + Math.floor(r() * (max - min + 1));
const digits = (r: Rand, n: number) => Array.from({ length: n }, () => int(r, 0, 9)).join("");
const letters = (r: Rand, n: number) => Array.from({ length: n }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ"[int(r, 0, 23)]).join("");
const iso = (y: number, m: number, d: number) => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
const addDays = (isoDate: string, days: number) => new Date(Date.parse(isoDate) + days * 86400000).toISOString();
/** Sample dates never run past the data snapshot (17 Sep 2026, 10:00). */
const capAtSnapshot = (value: string, floor: string) =>
  new Date(Math.max(Date.parse(floor), Math.min(Date.parse(value), Date.parse("2026-09-17T10:00:00Z")))).toISOString().replace(/\.\d{3}Z$/, "Z");

// --- Reference data -------------------------------------------------------

const female = new Set(
  "Nusrat Farzana Sadia Tasnim Mim Jannatul Sumaiya Rumana Afsana Tahmina Nabila Lamia Ishrat Fahmida Sharmin Anika Raisa Maliha Tanjila Nazifa Shirin Tamanna Sanjida Rubaiya Elena Ioana Alexandra Gabriela Roxana Adaeze Ngozi Folake Ifeoma Bisi Abena Akosua Efua Ama Hodan Ayaan Sagal Ifrah Aisha Zainab Hira Sana Shahana Rukhsana Rehana Salma Kamila Agnieszka Magdalena Ana Mariana Olena Iryna Yulia Sophie Chloe Megan Jade Stacey Desislava Petya Vanya Ahlam Shamima Grace Priyanka Amina Laura Hannah Farhana Sina".split(" ")
);

type Origin = { nationality: string; ethnic: string; language: string; eu?: boolean; passport: (r: Rand) => string };
const origins: Record<string, Origin> = {
  Bangladeshi: { nationality: "Bangladeshi", ethnic: "Asian or Asian British – Bangladeshi", language: "Bengali", passport: (r) => `A${digits(r, 8)}` },
  Romanian: { nationality: "Romanian", ethnic: "White – Other White background", language: "Romanian", eu: true, passport: (r) => digits(r, 9) },
  Bulgarian: { nationality: "Bulgarian", ethnic: "White – Other White background", language: "Bulgarian", eu: true, passport: (r) => digits(r, 9) },
  Polish: { nationality: "Polish", ethnic: "White – Other White background", language: "Polish", eu: true, passport: (r) => `${letters(r, 2)}${digits(r, 7)}` },
  Portuguese: { nationality: "Portuguese", ethnic: "White – Other White background", language: "Portuguese", eu: true, passport: (r) => `${letters(r, 1)}${digits(r, 6)}` },
  Ukrainian: { nationality: "Ukrainian", ethnic: "White – Other White background", language: "Ukrainian", passport: (r) => `${letters(r, 2)}${digits(r, 6)}` },
  Nigerian: { nationality: "Nigerian", ethnic: "Black or Black British – African", language: "English", passport: (r) => `A${digits(r, 8)}` },
  Ghanaian: { nationality: "Ghanaian", ethnic: "Black or Black British – African", language: "English", passport: (r) => `G${digits(r, 7)}` },
  Somali: { nationality: "British", ethnic: "Black or Black British – African", language: "Somali", passport: (r) => digits(r, 9) },
  Pakistani: { nationality: "British", ethnic: "Asian or Asian British – Pakistani", language: "Urdu", passport: (r) => digits(r, 9) },
  BritishBangladeshi: { nationality: "British", ethnic: "Asian or Asian British – Bangladeshi", language: "English", passport: (r) => digits(r, 9) },
  British: { nationality: "British", ethnic: "White – British", language: "English", passport: (r) => digits(r, 9) },
  Filipino: { nationality: "Filipino", ethnic: "Asian or Asian British – Other Asian background", language: "Tagalog", passport: (r) => `P${digits(r, 7)}${letters(r, 1)}` },
};

const surnameOrigin: Record<string, keyof typeof origins> = {};
const assign = (key: keyof typeof origins, names: string) => names.split(" ").forEach((n) => (surnameOrigin[n] = key));
assign("Romanian", "Popescu Ionescu Stan Dumitru Munteanu Constantin Marin Tudor Petrova");
assign("Bulgarian", "Petrov Ivanova Georgiev Dimitrova Todorov");
assign("Polish", "Nowak Kowalski Wiśniewska Wójcik Kamińska");
assign("Portuguese", "Silva Santos Ferreira Pereira Costa Dacosta");
assign("Ukrainian", "Shevchenko Kovalenko Bondarenko Tkachenko Melnyk");
assign("Nigerian", "Okafor Adeyemi Okonkwo Balogun Eze Adebayo Nwosu Ogunleye Yusuf");
assign("Ghanaian", "Mensah Owusu Boateng Asante Osei Appiah Darko");
assign("Somali", "Farah Hassan Warsame Abdullahi Mohamud Jama Mohammed");
assign("Pakistani", "Khan Hussain Malik Iqbal Butt Qureshi Raza Anwer");
assign("BritishBangladeshi", "Begum Miah Uddin Ali Karim");
assign("British", "Smith Taylor Walker Hughes Wright Robinson Clarke Hall");
assign("Filipino", "Sinkamba");

const ukAddresses: Record<string, { streets: string[]; areas: [string, string][]; city: string; county: string }> = {
  London: {
    streets: ["Whitechapel Road", "Commercial Road", "Romford Road", "High Street North", "Green Street", "Mile End Road", "Cranbrook Road", "Lewisham Way", "Walworth Road", "Seven Sisters Road"],
    areas: [["Whitechapel", "E1 1BJ"], ["Stratford", "E15 4QS"], ["East Ham", "E6 2JA"], ["Ilford", "IG1 2EL"], ["Lewisham", "SE4 1UT"], ["Tottenham", "N15 5QN"], ["Walworth", "SE17 1RW"], ["Barking", "IG11 8TU"]],
    city: "London",
    county: "Greater London",
  },
  Manchester: {
    streets: ["Wilmslow Road", "Oldham Road", "Cheetham Hill Road", "Stockport Road", "Great Ancoats Street", "Princess Road"],
    areas: [["Rusholme", "M14 5TQ"], ["Cheetham Hill", "M8 8HD"], ["Levenshulme", "M19 3BP"], ["Moss Side", "M16 7AJ"], ["Ancoats", "M4 6DE"]],
    city: "Manchester",
    county: "Greater Manchester",
  },
  "Milton Keynes": {
    streets: ["Midsummer Boulevard", "Silbury Boulevard", "Queensway", "Saxon Gate", "Watling Street"],
    areas: [["Central Milton Keynes", "MK9 3BN"], ["Bletchley", "MK2 2HB"], ["Wolverton", "MK12 5ND"], ["Newport Pagnell", "MK16 8AA"]],
    city: "Milton Keynes",
    county: "Buckinghamshire",
  },
};
const bdAddresses: Record<string, { areas: [string, string][]; city: string; division: string }> = {
  "Dhaka HQ": { areas: [["Dhanmondi", "1209"], ["Mirpur 10", "1216"], ["Uttara Sector 7", "1230"], ["Mohammadpur", "1207"], ["Bashundhara R/A", "1229"], ["Banani", "1213"]], city: "Dhaka", division: "Dhaka Division" },
  Sylhet: { areas: [["Zindabazar", "3100"], ["Ambarkhana", "3100"], ["Shibganj", "3100"], ["Subid Bazar", "3100"], ["Beanibazar", "3170"]], city: "Sylhet", division: "Sylhet Division" },
};

const bdColleges = ["Notre Dame College", "Dhaka College", "Viqarunnisa Noon School & College", "Sylhet Govt. Model School & College", "MC College, Sylhet", "Rajuk Uttara Model College", "Adamjee Cantonment College", "Holy Cross College"];
const bdUniversities = ["University of Dhaka", "North South University", "BRAC University", "Shahjalal University of Science & Technology", "East West University", "Independent University, Bangladesh", "Leading University, Sylhet", "Daffodil International University"];
const ukColleges = ["Newham College", "Tower Hamlets College", "The Manchester College", "Milton Keynes College", "Lewisham College", "Barking & Dagenham College", "City of Westminster College", "Bury College"];
const subjectsFor = (course: string) =>
  /computer|data|cyber|information|artificial|robot|engineering|electronic|fintech/i.test(course)
    ? ["Computer Science and Engineering", "Electrical and Electronic Engineering", "Mathematics"]
    : /health|nursing|care/i.test(course)
    ? ["Public Health", "Biology", "Health and Social Care"]
    : /law/i.test(course)
    ? ["Law", "Political Science"]
    : /design|art|fashion/i.test(course)
    ? ["Fine Arts", "Graphic Design"]
    : ["Business Administration", "Accounting", "Economics", "Marketing"];

const ukJobs = [
  ["Care assistant", "Sunrise Care Homes"],
  ["Customer assistant", "Tesco"],
  ["Warehouse operative", "Amazon UK"],
  ["Sales assistant", "Primark"],
  ["Delivery driver", "Evri"],
  ["Receptionist", "NHS GP Surgery"],
  ["Team member", "McDonald's"],
  ["Support worker", "Mencap"],
];
const bdJobs = [
  ["Junior executive", "BRAC Bank"],
  ["Customer service officer", "Grameenphone"],
  ["Sales executive", "Walton Group"],
  ["Trainee software engineer", "Brain Station 23"],
  ["Accounts assistant", "Square Pharmaceuticals"],
  ["Teaching assistant", "Scholastica School"],
];

// --- Generator ------------------------------------------------------------

function originFor(app: ApplicationRow, r: Rand): Origin {
  if (app.branch === "Dhaka HQ" || app.branch === "Sylhet" || app.phone.startsWith("+880")) return origins.Bangladeshi;
  const last = app.applicant.split(" ").slice(-1)[0];
  const key = surnameOrigin[last];
  if (key) return origins[key];
  return r() < 0.5 ? origins.British : origins.BritishBangladeshi;
}

function buildProfile(app: ApplicationRow): ApplicationProfile {
  const r = rng(hash(app.id));
  const origin = originFor(app, r);
  const international = origin.nationality === "Bangladeshi" && !app.phone.startsWith("07") && !app.phone.startsWith("+44");
  const applicationType: ApplicationProfile["applicationType"] = international ? "International" : origin.eu ? "EU/Home" : "Home";
  const first = app.applicant.split(" ")[0];
  const gender = female.has(first) ? "Female" : "Male";
  const pg = app.level === "Postgraduate" || app.level === "PhD";
  const age = pg ? int(r, 22, 34) : app.level === "Foundation" && !international ? int(r, 19, 42) : int(r, 18, 24);
  const dob = iso(2026 - age, int(r, 1, 12), int(r, 1, 28));
  const issueYear = int(r, 2019, 2025);
  const passportIssue = iso(issueYear, int(r, 1, 12), int(r, 1, 28));
  const passportExpiry = `${issueYear + (origin.nationality === "British" ? 10 : 10)}${passportIssue.slice(4)}`;

  const personal: PersonalProfile = {
    title: gender === "Female" ? (r() < 0.8 ? "Ms" : "Mrs") : "Mr",
    fullName: app.applicant,
    gender,
    dob,
    nationality: origin.nationality,
    ethnicOrigin: origin.ethnic,
    firstLanguage: origin.language,
    maritalStatus: age > 27 && r() < 0.45 ? "Married" : "Single",
    residentialStatus: international
      ? "Overseas – applying for Student visa"
      : origin.nationality === "British"
      ? "British citizen"
      : origin.eu
      ? pick(r, ["EU Settled Status", "EU Pre-settled Status"])
      : pick(r, ["Indefinite Leave to Remain", "Refugee status", "Limited leave – Family visa"]),
    ukEntryDate: international || origin.nationality === "British" ? "" : iso(int(r, 2012, 2022), int(r, 1, 12), int(r, 1, 28)),
    shareCode: international || origin.nationality === "British" ? "" : `${letters(r, 1)}${digits(r, 1)}${letters(r, 1)} ${letters(r, 1)}${digits(r, 1)}${letters(r, 1)} ${digits(r, 1)}${letters(r, 2)}`,
    passportNo: origin.passport(r),
    passportIssue,
    passportExpiry,
  };

  let presentAddress: Address;
  if (international) {
    const bd = bdAddresses[app.branch] ?? bdAddresses["Dhaka HQ"];
    const [area, post] = pick(r, bd.areas);
    presentAddress = { line1: `House ${int(r, 2, 88)}, Road ${int(r, 1, 27)}`, line2: area, city: bd.city, state: bd.division, postcode: post, country: "Bangladesh" };
  } else {
    const uk = ukAddresses[app.branch] ?? ukAddresses.London;
    const [area, post] = pick(r, uk.areas);
    presentAddress = { line1: `${int(r, 1, 240)} ${pick(r, uk.streets)}`, line2: r() < 0.4 ? `Flat ${int(r, 1, 30)}` : area, city: uk.city, state: uk.county, postcode: post, country: "United Kingdom" };
  }
  const sameAddress = international || r() < 0.85;
  const permanentAddress = sameAddress
    ? presentAddress
    : { ...presentAddress, line1: `${int(r, 1, 120)} ${pick(r, (ukAddresses[app.branch] ?? ukAddresses.London).streets)}`, line2: "" };

  // Education
  const gradYear = 2026 - (age - 18);
  const education: Qualification[] = [];
  const subjects = subjectsFor(app.course);
  if (international) {
    education.push({ id: "ed-1", level: "Secondary", qualification: "SSC", institute: pick(r, bdColleges), subject: pick(r, ["Science", "Business Studies"]), grade: `GPA ${(4 + r()).toFixed(2)} / 5.00`, year: String(gradYear - 2), status: "Completed" });
    education.push({ id: "ed-2", level: "Higher Secondary", qualification: "HSC", institute: pick(r, bdColleges), subject: pick(r, ["Science", "Business Studies", "Humanities"]), grade: `GPA ${(3.5 + r() * 1.5).toFixed(2)} / 5.00`, year: String(gradYear), status: "Completed" });
    if (pg) {
      education.push({ id: "ed-3", level: "Undergraduate Degree", qualification: `Bachelor of ${pick(r, ["Science", "Business Administration", "Arts"])}`, institute: pick(r, bdUniversities), subject: pick(r, subjects), grade: `CGPA ${(2.8 + r() * 1.1).toFixed(2)} / 4.00`, year: String(Math.min(2026, gradYear + 4 + int(r, 0, 1))), status: app.stage === "New" && r() < 0.3 ? "Awaiting result" : "Completed" });
    }
  } else {
    education.push({ id: "ed-1", level: "Secondary", qualification: "GCSE", institute: pick(r, ["Local secondary academy", ...ukColleges]), subject: "English, Maths and 3 others", grade: `${int(r, 4, 9)} GCSEs at grade 4–${int(r, 5, 7)}`, year: String(gradYear - 2), status: "Completed" });
    if (app.level !== "Foundation") {
      education.push({ id: "ed-2", level: "Level 3", qualification: pick(r, ["Access to HE Diploma", "BTEC Extended Diploma", "A Levels"]), institute: pick(r, ukColleges), subject: pick(r, subjects), grade: pick(r, ["Distinction", "Merit", "D*DD", "BBC", "MMM"]), year: String(Math.min(2026, gradYear + int(r, 0, 6))), status: app.stage === "Conditional offer" && r() < 0.5 ? "Awaiting result" : "Completed" });
    }
    if (origin.eu || origin.nationality === "Ukrainian") {
      education.push({ id: "ed-3", level: "Overseas qualification", qualification: "High school diploma (baccalaureate)", institute: `${pick(r, ["National", "Municipal", "Technical"])} College, ${origin.nationality.replace(/n$/, "")}`, subject: "General studies", grade: `${(6.5 + r() * 3).toFixed(2)} / 10`, year: String(gradYear), status: "Completed" });
    }
  }

  // Work experience
  const work: WorkItem[] = [];
  const workChance = international ? (pg ? 0.55 : 0.1) : age > 21 ? 0.8 : 0.35;
  if (r() < workChance) {
    const jobs = international ? bdJobs : ukJobs;
    const n = !international && age > 26 && r() < 0.5 ? 2 : 1;
    for (let k = 0; k < n; k++) {
      const [role, employer] = pick(r, jobs);
      const startYear = 2026 - int(r, 1, Math.max(1, age - 18));
      const current = k === 0 && r() < 0.6;
      work.push({
        id: `wk-${k}`,
        employer,
        role,
        type: international ? "Full-time" : pick(r, ["Full-time", "Part-time", "Zero-hours contract"]),
        start: iso(startYear, int(r, 1, 12), 1),
        end: current ? "" : iso(Math.min(2026, startYear + int(r, 1, 3)), int(r, 1, 8), 1),
        duties: role.includes("Care") || role.includes("Support")
          ? "Personal care, medication rounds and daily care notes for residents."
          : role.includes("software")
          ? "Built and tested web features; wrote API integrations."
          : "Served customers, handled payments and managed stock.",
      });
    }
  }

  // Language tests
  const languages: LanguageTest[] = [];
  if (international) {
    const booked = app.stage === "New" || (app.stage === "Conditional offer" && r() < 0.5);
    const overall = pg ? pick(r, ["6.0", "6.5", "6.5", "7.0"]) : pick(r, ["5.5", "6.0", "6.0", "6.5"]);
    const band = () => pick(r, ["5.5", "6.0", "6.5", "7.0"]);
    languages.push(
      booked
        ? { id: "ln-1", test: pick(r, ["IELTS Academic (UKVI)", "PTE Academic"]), status: "Booked", overall: "—", date: iso(2026, 10, int(r, 1, 28)), note: "Result expected 13 days after test date" }
        : { id: "ln-1", test: pick(r, ["IELTS Academic (UKVI)", "IELTS Academic (UKVI)", "PTE Academic", "Duolingo English Test"]), status: "Completed", overall, bands: { listening: band(), reading: band(), writing: band(), speaking: band() }, date: iso(int(r, 2025, 2026), int(r, 1, 8), int(r, 1, 28)) }
    );
  } else {
    languages.push({
      id: "ln-1",
      test: origin.language === "English" || origin.nationality === "British" ? "Not required – UK schooling" : pick(r, ["Oxford ELLT", "Internal English assessment", "Functional Skills English Level 2"]),
      status: origin.language === "English" || origin.nationality === "British" ? "Not required" : "Completed",
      overall: origin.language === "English" || origin.nationality === "British" ? "—" : pick(r, ["Pass", "B2", "Level 2 pass"]),
      date: iso(int(r, 2023, 2026), int(r, 1, 8), int(r, 1, 28)),
    });
  }

  const feesPayment = international
    ? app.funding === "Scholarship"
      ? "Scholarship + family sponsor"
      : pick(r, ["Self-funded (family sponsor)", "Self-funded (parents' savings)", "Education loan – Bangladesh bank"])
    : app.funding === "Self-funded"
    ? "Self-funded"
    : "Student Finance England (tuition fee loan)";

  const refused = international && r() < 0.08;
  const declaration: DeclarationItem[] = [
    { question: "Have you ever been refused a visa?", answer: refused ? "Yes" : "No", detail: refused ? "Canada study permit refused in 2024 (funds)." : undefined },
    { question: "Have you studied abroad before?", answer: international && r() < 0.1 ? "Yes" : "No" },
    { question: "Have you applied to other universities?", answer: app.courseOptions.length ? "Yes" : "No" },
    { question: "Are your funds arranged?", answer: ["New", "App submitted"].includes(app.stage) && r() < 0.4 ? "No" : "Yes" },
    { question: "Do you have any dependants?", answer: personal.maritalStatus === "Married" && r() < 0.6 ? "Yes" : "No" },
    { question: "Have you lived in the UK or EU for the last 3 years?", answer: international ? "No" : "Yes" },
    { question: "Do you have any disabilities or learning difficulties?", answer: r() < 0.06 ? "Yes" : "No", detail: undefined },
    { question: "Do you have any criminal convictions?", answer: "No" },
  ];

  // Documents — how far along the application is decides what's in
  const order = ["New", "App submitted", "Conditional offer", "Unconditional offer", "CAS issued", "Visa filed", "Enrolled"];
  const progress = Math.max(0, order.indexOf(app.stage));
  const created = app.createdAt;
  const docStatus = (need: number): DocumentStatus => (progress >= need ? "Verified" : progress === need - 1 ? "Pending review" : "Missing");
  const slug = app.applicant.replace(/\s+/g, "_");
  const docs: [string, string, number][] = [
    ["Passport", `${slug}_passport.pdf`, 1],
    ["Photo", `${slug}_photo.jpg`, 1],
    ["Academic transcript", `${slug}_transcripts.pdf`, 1],
    ["Personal statement", `${slug}_personal_statement.docx`, 1],
    ["CV / Resume", `${slug}_CV.pdf`, 2],
  ];
  if (international) {
    docs.push(["English test certificate", `${slug}_${languages[0].test.split(" ")[0]}_TRF.pdf`, 2], ["Bank statement", `${slug}_bank_statement.pdf`, 3], ["TB test certificate", `${slug}_TB_certificate.pdf`, 4]);
  } else if (personal.shareCode) {
    docs.push(["Share code", `${slug}_share_code.pdf`, 1], ["Proof of address", `${slug}_council_tax.pdf`, 1]);
  } else {
    docs.push(["Proof of address", `${slug}_utility_bill.pdf`, 1]);
  }
  const documents: StudentDocument[] = docs.map(([type, fileName, need], i) => {
    let status = docStatus(need);
    if (app.stage === "Rejected" || app.stage === "Withdrawn") status = i < 4 ? "Verified" : "Missing";
    if (status === "Verified" && r() < 0.04) status = "Rejected";
    return {
      id: `doc-${i}`,
      type,
      fileName,
      size: `${(0.2 + r() * 3.4).toFixed(1)} MB`,
      uploadedAt: status === "Missing" ? "" : capAtSnapshot(addDays(created, int(r, 0, 6) + need * 3), created),
      status,
    };
  });

  const contract: ApplicationProfile["contract"] =
    app.stage === "New"
      ? { status: "Not sent", token: "" }
      : {
          status: app.stage === "App submitted" && r() < 0.5 ? "Awaiting signature" : "Approved",
          token: Array.from({ length: 24 }, () => "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"[int(r, 0, 55)]).join(""),
          sentAt: capAtSnapshot(addDays(created, 2), created),
        };

  // Status history: each stage reached along the way, spread between creation and the snapshot
  const path: ApplicationStage[] =
    app.stage === "Rejected" || app.stage === "Withdrawn"
      ? ["New", "App submitted", app.stage]
      : (order.slice(0, progress + 1) as ApplicationStage[]);
  const start = Date.parse(created);
  const end = Math.min(Date.parse("2026-09-17T10:00:00Z"), start + path.length * 18 * 86400000);
  const history: StatusEvent[] = path.map((stage, i) => ({
    stage,
    at: new Date(i === 0 ? start : start + ((end - start) * i) / Math.max(1, path.length - 1)).toISOString().replace(/\.\d{3}Z$/, "Z"),
    by: i === 0 ? "System" : app.counsellor,
  }));

  return { applicationType, personal, presentAddress, permanentAddress, sameAddress, education, work, languages, declaration, feesPayment, documents, contract, emails: [], history };
}

const profiles = new Map<string, ApplicationProfile>();

export function getProfile(app: ApplicationRow): ApplicationProfile {
  let p = profiles.get(app.id);
  if (!p) {
    p = buildProfile(app);
    profiles.set(app.id, p);
  }
  return p;
}

export function saveProfile(id: string, profile: ApplicationProfile) {
  profiles.set(id, profile);
}

/** Share of profile sections that are filled in, for the overview. */
export function completeness(p: ApplicationProfile) {
  const personalFields = Object.entries(p.personal).filter(([k]) => !["ukEntryDate", "shareCode"].includes(k));
  const checks = [
    { label: "Personal details", done: personalFields.every(([, v]) => v) },
    { label: "Address", done: !!(p.presentAddress.line1 && p.presentAddress.postcode) },
    { label: "Academic qualifications", done: p.education.length > 0 },
    { label: "Language proficiency", done: p.languages.some((l) => l.status !== "Booked") },
    { label: "Declaration", done: p.declaration.every((d) => d.answer) },
    { label: "Documents", done: p.documents.every((d) => d.status === "Verified") },
    { label: "Student contract", done: p.contract.status === "Approved" },
  ];
  return { checks, percent: Math.round((checks.filter((c) => c.done).length / checks.length) * 100) };
}
