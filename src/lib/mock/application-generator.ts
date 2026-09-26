// Seeded generator for bulk sample applications. Deterministic, so the same
// rows appear on the server and the client and survive a refresh.
import { catalog, levelFor, type CatalogUniversity, type DeliveryMode } from "./course-catalog";
import type {
  ApplicationBlocker,
  ApplicationChannel,
  ApplicationDeadline,
  ApplicationStage,
  CourseOption,
  FundingStatus,
} from "./applications";

export interface GeneratedApplication {
  seq: number;
  applicant: string;
  phone: string;
  email: string;
  university: string;
  course: string;
  campus: string;
  intake: string;
  stage: ApplicationStage;
  funding: FundingStatus;
  branch: string;
  counsellor: string;
  source: string;
  channel: ApplicationChannel;
  createdAt: string;
  note: string;
  partner: string;
  mode: DeliveryMode;
  courseOptions: Omit<CourseOption, "id">[];
  deadlines?: ApplicationDeadline[];
  blockers?: ApplicationBlocker[];
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SNAPSHOT = Date.UTC(2026, 8, 17);
const DAY = 86400000;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const intakeMonths = [0, 2, 4, 8, 9]; // Jan, Mar, May, Sep, Oct

// --- Name pools ---------------------------------------------------------

const bdFirst = {
  m: ["Tanvir", "Rakib", "Sabbir", "Arif", "Nayeem", "Shakil", "Mehedi", "Fahim", "Rifat", "Sajid", "Tahsin", "Imtiaz", "Zubair", "Asif", "Rashedul", "Mahfuz", "Nafis", "Saiful", "Towhid", "Ashik", "Jubayer", "Ridwan", "Shahriar", "Mostafiz", "Anik", "Faisal", "Omar", "Abrar", "Minhaz", "Rafsan"],
  f: ["Nusrat", "Farzana", "Sadia", "Tasnim", "Mim", "Jannatul", "Sumaiya", "Rumana", "Afsana", "Tahmina", "Nabila", "Lamia", "Ishrat", "Fahmida", "Sharmin", "Anika", "Raisa", "Maliha", "Tanjila", "Nazifa", "Shirin", "Tamanna", "Sanjida", "Rubaiya"],
};
const bdLast = ["Hossain", "Rahman", "Ahmed", "Islam", "Chowdhury", "Hasan", "Akter", "Khan", "Uddin", "Sarker", "Talukder", "Miah", "Bhuiyan", "Mollah", "Siddique", "Karim", "Alam", "Haque", "Sultana", "Mahmud", "Roy", "Das", "Paul", "Biswas", "Majumder"];

// UK residents — the home-student market for the UK branches.
const ukPeople: { first: string[]; last: string[]; weight: number }[] = [
  { first: ["Andrei", "Ionut", "Mihai", "Elena", "Ioana", "Alexandra", "Florin", "Gabriela", "Bogdan", "Roxana"], last: ["Popescu", "Ionescu", "Stan", "Dumitru", "Munteanu", "Constantin", "Marin", "Tudor"], weight: 3 },
  { first: ["Chinedu", "Oluwaseun", "Adaeze", "Tunde", "Ngozi", "Emeka", "Folake", "Ifeoma", "Segun", "Bisi"], last: ["Okafor", "Adeyemi", "Okonkwo", "Balogun", "Eze", "Adebayo", "Nwosu", "Ogunleye"], weight: 3 },
  { first: ["Kwame", "Abena", "Kofi", "Akosua", "Yaw", "Efua", "Kwabena", "Ama"], last: ["Mensah", "Owusu", "Boateng", "Asante", "Osei", "Appiah", "Darko"], weight: 2 },
  { first: ["Abdi", "Hodan", "Faisal", "Ayaan", "Hamza", "Sagal", "Mahad", "Ifrah"], last: ["Farah", "Hassan", "Warsame", "Abdullahi", "Mohamud", "Ali", "Jama"], weight: 2 },
  { first: ["Aisha", "Bilal", "Zainab", "Usman", "Hira", "Imran", "Sana", "Adeel"], last: ["Khan", "Hussain", "Malik", "Iqbal", "Butt", "Qureshi", "Raza"], weight: 2 },
  { first: ["Shahana", "Jamal", "Rukhsana", "Sultan", "Rehana", "Abdul", "Salma", "Mizanur"], last: ["Begum", "Miah", "Ali", "Uddin", "Ahmed", "Rahman"], weight: 2 },
  { first: ["Kamila", "Piotr", "Agnieszka", "Tomasz", "Magdalena", "Krzysztof"], last: ["Nowak", "Kowalski", "Wiśniewska", "Wójcik", "Kamińska"], weight: 1 },
  { first: ["Tiago", "Ana", "Bruno", "Mariana", "Diogo"], last: ["Silva", "Santos", "Ferreira", "Pereira", "Costa"], weight: 1 },
  { first: ["Olena", "Dmytro", "Iryna", "Oleksandr", "Yulia"], last: ["Shevchenko", "Kovalenko", "Bondarenko", "Tkachenko", "Melnyk"], weight: 1 },
  { first: ["Daniel", "Sophie", "Liam", "Chloe", "Jordan", "Megan", "Ryan", "Jade", "Kieran", "Stacey"], last: ["Smith", "Taylor", "Walker", "Hughes", "Wright", "Robinson", "Clarke", "Hall"], weight: 2 },
  { first: ["Georgi", "Desislava", "Ivan", "Petya", "Nikolai"], last: ["Petrov", "Ivanova", "Georgiev", "Dimitrova", "Todorov"], weight: 1 },
];

const branchCounsellors: Record<string, string[]> = {
  "Dhaka HQ": ["Alif Tasnim", "Md. Shariful Islam", "Ummay Saiha Limu", "Youna"],
  Sylhet: ["Harunor Rashid", "Sadia Afrin"],
  London: ["Bickey Shah", "N. Bintay Zaman", "Farhan Kabir", "Nusrat Choudhury"],
  Manchester: ["S. Parappadan Sankaran", "Nusrat Choudhury"],
  "Milton Keynes": ["Yuliana Prokipchak"],
};

const agents = ["Gunjon Education", "Apex Global Edu Pathway", "Tarek Associates", "Beacon Overseas Studies", "Crown British Education", "Study Bridge Sylhet", "NextStep Consultancy"];
const ambassadors = ["Rahim Uddin", "Kemi Ade", "Sorin Pavel", "Abdi Warsame", "Priya Nair", "Marta Nowak"];

// Home students mostly go to London/Manchester/Birmingham partner providers.
const homeUniversities = [
  "UK Management College",
  "London School of Commerce",
  "University of the West of Scotland (London)",
  "London College of Contemporary Arts",
  "Anglia Ruskin University London",
  "Regent College London",
  "Oxford Business College",
  "University of Sunderland in London",
  "Coventry University",
  "University of Greenwich",
];
const homeWeights = [5, 4, 3, 1, 3, 4, 4, 2, 1, 1];

const intlUniversities = [
  "University of Hertfordshire",
  "Coventry University",
  "University of Greenwich",
  "Ulster University (Birmingham)",
  "De Montfort University",
  "Teesside University",
  "Anglia Ruskin University",
  "University of Sunderland in London",
  "National College of Ireland",
  "Australian Catholic University",
  "Deakin University",
  "York University",
  "Northeastern University",
  "Nanjing University of Information Science & Technology",
];
const intlWeights = [4, 4, 3, 4, 3, 3, 2, 2, 2, 2, 2, 1, 1, 1];

const homeSources: [string, number][] = [
  ["BHE UNI_UK_Website", 5], ["Health & Care Campaign", 3], ["Facebook Ads", 4], ["TikTok Ads", 2], ["Walk-in", 2], ["Boost Website", 2], ["WhatsApp", 1],
];
const intlSources: [string, number][] = [
  ["BD to UK Student Fair", 4], ["Facebook Ads", 4], ["WhatsApp", 2], ["Boost Website", 2], ["Walk-in", 2], ["Google Ads", 1],
];

const notesByStage: Partial<Record<ApplicationStage, string[]>> = {
  New: ["Passport copy and transcript missing", "Called — asked to send documents on WhatsApp", "Prefers evening classes", "Wants a campus close to home", "Needs guidance on course choice"],
  "App submitted": ["Waiting for share code", "Interview slot requested", "Personal statement uploaded", "LRS request sent — waiting for share code", "Awaiting admissions decision"],
  "Conditional offer": ["Offer conditional on English test", "Offer conditional on Level 3 certificate", "IELTS booked — result pending", "Awaiting final transcript"],
  "Unconditional offer": ["Offer accepted by student", "Deposit invoice sent", "Student Finance application in progress", "Scholarship being assessed"],
  "CAS issued": ["CAS received — booking visa appointment", "TB test certificate uploaded", "Visa appointment booked"],
  "Visa filed": ["Biometrics done", "Priority visa service requested", "Waiting for UKVI decision"],
  Enrolled: ["Enrolled and attended induction", "Arrived and completed enrolment", "Student ID issued"],
  Rejected: ["Did not meet English requirement", "Refused: academic gap not explained", "Course full for this intake"],
  Withdrawn: ["Withdrew — deferred to next intake", "Chose another provider", "Withdrew for personal reasons"],
};

// --- Helpers ------------------------------------------------------------

type Rand = () => number;
const pick = <T,>(r: Rand, xs: readonly T[]) => xs[Math.floor(r() * xs.length)];
function weighted<T>(r: Rand, xs: readonly T[], ws: readonly number[]) {
  const total = ws.reduce((a, b) => a + b, 0);
  let x = r() * total;
  for (let i = 0; i < xs.length; i++) {
    x -= ws[i];
    if (x < 0) return xs[i];
  }
  return xs[xs.length - 1];
}
const digits = (r: Rand, n: number) => Array.from({ length: n }, () => Math.floor(r() * 10)).join("");
const isoDay = (t: number) => new Date(t).toISOString().slice(0, 10);
const slug = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z]/g, "");

/** First intake month on or after `from`, up to a few ahead. */
function intakeAfter(r: Rand, from: number) {
  const d = new Date(from + 30 * DAY);
  let y = d.getUTCFullYear();
  let m = d.getUTCMonth();
  const options: { label: string; time: number }[] = [];
  while (options.length < 3) {
    if (intakeMonths.includes(m)) options.push({ label: `${MONTHS[m]} ${y}`, time: Date.UTC(y, m, 20) });
    m++;
    if (m === 12) {
      m = 0;
      y++;
    }
  }
  return weighted(r, options, [5, 3, 1]);
}

function stageFor(r: Rand, ageDays: number, intakeStarted: boolean, international: boolean): ApplicationStage {
  if (intakeStarted) return weighted<ApplicationStage>(r, ["Enrolled", "Rejected", "Withdrawn"], [70, 14, 16]);
  if (ageDays < 5) return weighted<ApplicationStage>(r, ["New", "App submitted"], [7, 3]);
  if (ageDays < 21) return weighted<ApplicationStage>(r, ["New", "App submitted", "Conditional offer", "Withdrawn"], [3, 6, 2, 0.3]);
  const flow: ApplicationStage[] = international
    ? ["App submitted", "Conditional offer", "Unconditional offer", "CAS issued", "Visa filed", "Rejected", "Withdrawn"]
    : ["App submitted", "Conditional offer", "Unconditional offer", "Rejected", "Withdrawn"];
  const weights = international ? [2, 3, 3, 2, 2, 1, 0.8] : [2, 3, 5, 1, 0.8];
  return weighted(r, flow, weights);
}

function fundingFor(r: Rand, stage: ApplicationStage, international: boolean): FundingStatus {
  if (stage === "New") return "N/A";
  if (!international) {
    if (stage === "Enrolled") return weighted<FundingStatus>(r, ["SFE approved", "Self-funded"], [9, 1]);
    if (stage === "Unconditional offer") return weighted<FundingStatus>(r, ["SFE approved", "SFE applied", "Self-funded"], [5, 4, 1]);
    if (stage === "Rejected" || stage === "Withdrawn") return weighted<FundingStatus>(r, ["N/A", "SFE applied"], [2, 1]);
    return weighted<FundingStatus>(r, ["SFE applied", "N/A", "Self-funded"], [6, 3, 1]);
  }
  if (["CAS issued", "Visa filed", "Enrolled"].includes(stage)) return weighted<FundingStatus>(r, ["Deposit paid", "Scholarship"], [8, 2]);
  if (stage === "Unconditional offer") return weighted<FundingStatus>(r, ["Deposit paid", "Self-funded", "Scholarship"], [4, 4, 2]);
  if (stage === "Rejected" || stage === "Withdrawn") return weighted<FundingStatus>(r, ["N/A", "Self-funded"], [1, 1]);
  return weighted<FundingStatus>(r, ["Self-funded", "N/A"], [3, 2]);
}

const branchCity: Record<string, string> = { London: "London", Manchester: "Manchester", "Milton Keynes": "London" };

// --- Generator ----------------------------------------------------------

export function generateApplications(count: number, seed = 20260917): GeneratedApplication[] {
  const r = mulberry32(seed);
  const emails = new Set<string>();
  const rows: GeneratedApplication[] = [];

  for (let i = 0; i < count; i++) {
    const international = r() < 0.55;
    const branch = international ? weighted(r, ["Dhaka HQ", "Sylhet"], [3, 2]) : weighted(r, ["London", "Manchester", "Milton Keynes"], [5, 3, 2]);
    const counsellor = pick(r, branchCounsellors[branch]);

    // Name, phone and email
    let first: string;
    let last: string;
    let phone: string;
    if (international) {
      first = pick(r, r() < 0.55 ? bdFirst.m : bdFirst.f);
      last = pick(r, bdLast);
      const op = pick(r, ["13", "14", "15", "16", "17", "18", "19"]);
      phone = `+880 1${op.slice(1)}${digits(r, 2)}-${digits(r, 6)}`;
    } else {
      const group = weighted(r, ukPeople, ukPeople.map((g) => g.weight));
      first = pick(r, group.first);
      last = pick(r, group.last);
      const body = `7${1 + Math.floor(r() * 9)}${digits(r, 2)} ${digits(r, 6)}`;
      phone = r() < 0.5 ? `0${body}` : `+44 ${body}`;
    }
    const applicant = `${first} ${last}`;
    const domain = weighted(r, ["gmail.com", "outlook.com", "yahoo.com", "hotmail.com", "icloud.com"], [10, 3, 2, 2, 1]);
    let local = r() < 0.5 ? `${slug(first)}.${slug(last)}` : `${slug(first)}${slug(last).slice(0, 1)}${digits(r, 2)}`;
    while (emails.has(`${local}@${domain}`)) local += digits(r, 1);
    const email = `${local}@${domain}`;
    emails.add(email);

    // Created date — skewed towards recent months
    const ageDays = Math.floor(Math.pow(r(), 1.35) * 380);
    const created = SNAPSHOT - ageDays * DAY + Math.floor((7 + r() * 11) * 3600000) + Math.floor(r() * 3600000);
    const createdAt = new Date(created).toISOString().replace(/\.\d{3}Z$/, "Z");

    // Programme
    const uniName = international ? weighted(r, intlUniversities, intlWeights) : weighted(r, homeUniversities, homeWeights);
    const uni: CatalogUniversity = catalog.find((u) => u.name === uniName)!;
    const courseEntry = international
      ? pick(r, uni.courses.filter((c) => c.level !== "Foundation").length ? uni.courses.filter((c) => c.level !== "Foundation") : uni.courses)
      : pick(r, uni.courses);
    const preferred = branchCity[branch];
    const campus = !international && preferred && uni.campuses.includes(preferred) && r() < 0.7 ? preferred : pick(r, uni.campuses);
    const intake = intakeAfter(r, created);
    const intakeStarted = intake.time <= SNAPSHOT;
    const mode: DeliveryMode = international ? "Full time" : weighted<DeliveryMode>(r, ["Full time", "Blended", "Weekend", "Part time"], [6, 3, 2, 1]);

    const stage = stageFor(r, ageDays, intakeStarted, international);
    const funding = fundingFor(r, stage, international);

    // Channel and source
    let channel: ApplicationChannel = "Direct";
    let partner = "";
    let source: string;
    const c = r();
    if (international && c < 0.22) {
      channel = "Agent";
      partner = pick(r, agents);
      source = "Agent Partner";
    } else if (!international && c < 0.1) {
      channel = "Affiliate";
      partner = `Ambassador: ${pick(r, ambassadors)}`;
      source = "Personal Referral";
    } else if (!international && c < 0.14) {
      channel = "Agent";
      partner = pick(r, agents.slice(0, 3));
      source = "Agent Partner";
    } else {
      const [names, weights] = [(international ? intlSources : homeSources).map((s) => s[0]), (international ? intlSources : homeSources).map((s) => s[1])];
      source = r() < 0.08 ? "Personal Referral" : weighted(r, names, weights);
    }

    const note = r() < 0.4 ? pick(r, notesByStage[stage] ?? [""]) : "";

    // Alternative course choices
    const courseOptions: Omit<CourseOption, "id">[] = [];
    if (r() < 0.16) {
      const pool = catalog.filter((u) => u.name !== uni.name && (international ? intlUniversities : homeUniversities).includes(u.name));
      const extra = r() < 0.3 ? 2 : 1;
      for (let k = 0; k < extra; k++) {
        const alt = pick(r, pool);
        const altCourse = pick(r, alt.courses);
        courseOptions.push({
          country: alt.country,
          university: alt.name,
          course: altCourse.name,
          level: altCourse.level ?? levelFor(altCourse.name),
          mode,
          campus: pick(r, alt.campuses),
          intake: intake.label,
          stage: stage === "New" ? "New" : weighted<ApplicationStage>(r, ["New", "App submitted", "Rejected"], [3, 4, 1]),
          funding: "N/A",
        });
      }
    }

    // A few open applications carry deadlines and blockers for the dashboard
    const open = !["Enrolled", "Rejected", "Withdrawn"].includes(stage);
    let deadlines: ApplicationDeadline[] | undefined;
    let blockers: ApplicationBlocker[] | undefined;
    if (open && r() < 0.05) {
      const type = stage === "CAS issued" || stage === "Visa filed" ? "Visa" : stage === "Unconditional offer" ? (international ? "CAS" : "Deposit") : "Application";
      deadlines = [{ type, dueDate: isoDay(SNAPSHOT + Math.floor(r() * 36 - 6) * DAY) }];
    }
    if (open && r() < 0.035) {
      const category = weighted<ApplicationBlocker["category"]>(r, ["Documents", "Payment", "University response"], [3, 2, 2]);
      const reason = {
        Documents: pick(r, ["Passport copy missing", "Transcript not certified", "Share code outstanding", "Bank statement older than 28 days"]),
        Payment: pick(r, ["Tuition deposit outstanding", "Application fee unpaid"]),
        "University response": pick(r, ["Awaiting admissions decision", "Interview result pending"]),
      }[category];
      blockers = [{ category, reason, since: isoDay(SNAPSHOT - Math.floor(2 + r() * 14) * DAY) }];
    }

    rows.push({
      seq: i,
      applicant,
      phone,
      email,
      university: uni.name,
      course: courseEntry.name,
      campus,
      intake: intake.label,
      stage,
      funding,
      branch,
      counsellor,
      source,
      channel,
      createdAt,
      note,
      partner,
      mode,
      courseOptions,
      deadlines,
      blockers,
    });
  }
  return rows;
}
