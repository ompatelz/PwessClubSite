// Text of public/documents/media-consent-agreement.pdf, for the readable web version.
// The wording must match the PDF exactly; tests/media-consent-text.test.mjs compares
// every word against it. **double asterisks** mark text set in bold in the PDF.
// If the PDF changes, update this file and regenerate the page images.

export type AgreementBlock =
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "h3"; id: string; text: string };

export type AgreementSection = {
  id: string;
  number: string;
  title: string;
  blocks: AgreementBlock[];
};

export const AGREEMENT_TITLE = "MEDIA CONSENT AND EDITORIAL INDEPENDENCE AGREEMENT";
export const AGREEMENT_PUBLISHER = "DAU Press Club";

export const AGREEMENT_INTRO =
  'This Agreement (the "Agreement") outlines the terms, conditions, and journalistic standards governing the interaction, interviews, and exchange of information between the DAU Press Club (hereinafter referred to as the "Publisher," which includes the DAU Press Club, its editors, reporters, photographers, contributors, office bearers, and duly authorized representatives acting within the scope of their journalistic responsibilities) and the designated Interviewee, Committee, Administrative Entity, or representative (hereinafter referred to as the "Subject"). By participating in an interview or providing official communications to the Publisher, and by signing or otherwise formally acknowledging this Agreement as set out in Section 12 (Acknowledgment and Consent), the Subject agrees to the following terms, which are modeled upon internationally recognized journalistic practices, editorial standards, and applicable legal principles.';

export const AGREEMENT_SECTIONS: AgreementSection[] = [
  {
    id: "definitions",
    number: "1",
    title: "Definitions",
    blocks: [
      { type: "p", text: "For the purposes of this Agreement, the following terms shall have the meanings set out below. Where a term is not defined here, it shall be given its ordinary, good-faith meaning in the context of student journalism." },
      {
        type: "ul",
        items: [
          '"Material factual error" means a factual claim in published material that is objectively incorrect and that would reasonably affect a reader\'s understanding of the substance of the report.',
          '"Reasonable opportunity to comment" means a request for comment delivered with sufficient time, given the complexity and public interest of the story, for the Subject to meaningfully respond — **no less than twenty-four (24) hours for time-sensitive matters and forty-eight (48) hours otherwise**, unless both parties agree to a shorter or longer period.',
          '"Private student" means a student who does not hold, or is not acting in the capacity of, an official institutional or organizational role in connection with the subject matter of the report.',
          "A Subject who holds both statuses shall be treated as a private student for any communications unrelated to their official role, and as an office bearer only for communications made in that official capacity.",
        ],
      },
    ],
  },
  {
    id: "attribution",
    number: "2",
    title: "Scope of Attribution and Material Use",
    blocks: [
      { type: "h3", id: "record-status", text: "2.1 Record Status & Discretion" },
      { type: "p", text: "Unless expressly agreed otherwise by both the Publisher and the Subject before the relevant communication begins, all communications made for journalistic purposes, including interviews and official communications, shall be presumed to be **on the record.**" },
      { type: "p", text: 'An **"off the record"** designation is a **mutual agreement** and not a **unilateral declaration**. The Publisher reserves the right to accept or refuse any request to treat information as off the record. Silence, ambiguity, or the absence of an express agreement shall not constitute acceptance. **Requests made after disclosure or after the communication has concluded shall have no retrospective effect.**' },
      { type: "h3", id: "interviewer-statements", text: "2.2 Interviewer Statements" },
      { type: "p", text: "Questions, hypotheses, devil's-advocate arguments, contextual statements, or investigative prompts made by the interviewer are intended solely to facilitate reporting and gather information. Such statements shall not constitute official factual assertions, admissions, opinions, or positions of the Publisher." },
      { type: "h3", id: "identity-attribution", text: "2.3 Identity and Attribution" },
      { type: "p", text: "The Publisher retains sole editorial discretion regarding attribution, subject to the classifications in Section 1." },
      { type: "p", text: "As a matter of editorial policy, the Publisher will ordinarily protect the identities of private students unless identification is reasonably necessary for accurate reporting or expressly authorized." },
      { type: "p", text: "Students in positions of power may ordinarily be identified in connection with their official responsibilities unless anonymity is expressly agreed upon before disclosure." },
      { type: "p", text: 'Where anonymity has been agreed upon, attribution may instead be made through institutional affiliation or official role (e.g., "The Committee," "The Club," "The Student Body Convener").' },
      { type: "p", text: "The Publisher reserves the right to use, quote, paraphrase, summarize, and publish statements, actions, and materials provided by the Subject." },
      { type: "p", text: "**The Publisher maintains full editorial control and is under no obligation to redact, alter, suppress, or delay publication of any interview material or related journalistic content, provided that the Publisher does not knowingly or recklessly alter the substantive meaning of any statement through editing, omission, or presentation.**" },
      { type: "p", text: "**The Subject possesses no right to review, edit, approve, veto, or delay the draft, headline, formatting, publication date, or final article prior to publication. The Publisher is under no obligation to provide advance drafts, preview copies, or publication links.**" },
    ],
  },
  {
    id: "correspondence",
    number: "3",
    title: "Multi-Channel Correspondences & Digital Communications",
    blocks: [
      { type: "p", text: "The Subject acknowledges and agrees that communications provided to the Publisher or its accredited representatives — including but not limited to email, telephone, messaging applications, written correspondence, or verbal communications conducted on the record — constitute journalistic material eligible for quotation, citation, paraphrasing, and publication where relevant to the Subject's professional, institutional, or administrative role." },
      { type: "p", text: "Administrative or logistical communications, including scheduling, venue coordination, or interview arrangements, are exempt from publication unless they themselves become materially relevant to the subject of the reporting." },
    ],
  },
  {
    id: "right-of-reply",
    number: "4",
    title: "Right of Reply and Non-Response Waiver",
    blocks: [
      { type: "h3", id: "pre-publication", text: "4.1 Pre-Publication" },
      { type: "p", text: "The Publisher is committed to offering the Subject a reasonable opportunity to comment, as defined in Section 1, upon allegations, events, or matters directly concerning them." },
      { type: "p", text: "Requests for comment shall ordinarily be issued through recorded communication channels, with a response deadline determined by the Publisher after considering the urgency, complexity, public interest, and publication schedule of the story, and in no case shorter than the minimum periods set out in Section 1." },
      { type: "p", text: "Delivery of the request to the Subject's designated, official, or publicly recognized communication channel, together with reasonable confirmation of transmission (such as a reply via email for an organization, personal message for an individual), shall constitute sufficient notice." },
      { type: "p", text: "Failure to acknowledge, respond, or provide a statement within the specified period, once sufficient notice has been given, shall constitute a waiver of the Subject's pre-publication opportunity to comment." },
      { type: "p", text: "The Publisher may proceed using independently verified information while stating that the Subject declined or failed to respond within the allotted timeframe." },
      { type: "p", text: "Responses received after the deadline may, at the sole discretion of the Publisher, be treated as post-publication correspondence." },
      { type: "h3", id: "post-publication", text: "4.2 Post-Publication & Editorial Autonomy" },
      { type: "p", text: "The Subject possesses no right of prior restraint, prior approval, editorial veto, or authorization over any published material." },
      { type: "p", text: "Requests for clarification, correction, or response submitted after publication shall be reviewed by the Publisher in accordance with Section 6 (Standards of Complaint & Contextual Integrity)." },
      { type: "p", text: "Where a material factual error is established under Section 6, the Publisher shall issue a correction, clarification, or editor's note addressing that error within a reasonable time. The form and placement of the correction remain within the Publisher's editorial discretion; the obligation to correct an established material factual error does not." },
      { type: "p", text: "**Publication of a correction, clarification, update, or follow-up report shall not itself constitute an admission of liability, negligence, or wrongdoing beyond the specific error corrected.**" },
    ],
  },
  {
    id: "grievances",
    number: "5",
    title: "Editorial Protocol and Grievance Governance Framework",
    blocks: [
      { type: "h3", id: "official-channels", text: "5.1 Official Channels and Individual Immunity" },
      { type: "p", text: "To preserve editorial integrity and protect individual student journalists, all grievances, correction requests, or editorial disputes shall be submitted in writing through the designated Press Club channels." },
      { type: "p", text: "Personal messages, informal conversations, social media communications, or verbal complaints directed toward individual members shall not, by themselves, constitute official procedural notice." },
      { type: "p", text: "Such communications shall be treated as formal notice if expressly acknowledged as such by the leader(s) of the respective organization , where the Convener or Editor-in-Chief declines to make that acknowledgment within seven (7) days, by the independent reviewer designated under Section 5.4." },
      { type: "p", text: "Nothing in this provision prevents the Publisher from voluntarily considering information received informally." },
      { type: "p", text: "Harassment, intimidation, coercion, threats, or attempts to pressure individual journalists outside the prescribed process remain strictly prohibited and may result in immediate dismissal of the grievance and referral through appropriate institutional procedures." },
      { type: "h3", id: "complaint-standards", text: "5.2 Standards of Complaint & Contextual Integrity" },
      { type: "p", text: "Complaints shall identify the alleged factual inaccuracy or material omission and, where reasonably possible, provide supporting evidence." },
      { type: "p", text: "Grievances must evaluate the publication, including its title, captions, visual elements, and accompanying text, in its entirety and within its proper context. Objections based solely upon editorial style, rhetorical framing, sequencing, emphasis, or subjective disagreement shall not constitute grounds for correction or withdrawal." },
      { type: "p", text: 'Selective extraction or isolation of individual words, phrases, or statements ("cherry-picking") shall not, by itself, constitute evidence of factual inaccuracy.' },
      { type: "p", text: "The burden of demonstrating a material factual error rests upon the complainant. Mere disagreement with editorial judgment or conclusions reasonably drawn from accurately reported facts shall not constitute a valid grievance." },
      { type: "h3", id: "review-timelines", text: "5.3 Timelines for Review" },
      { type: "p", text: "The Publisher shall acknowledge receipt of a formal grievance within three (3) days and shall provide a substantive response, including any determination on the merits, within twelve (12) days of acknowledgment, absent exceptional circumstances communicated to the complainant in writing." },
      { type: "h3", id: "harassment", text: "5.4 Prohibition of Harassment & Forfeiture" },
      { type: "p", text: "The editorial process shall remain free from coercion or improper external influence. Attempts by the Subject or associated parties to harass, threaten, intimidate, pressure, or deliberately circumvent the established grievance process may result in immediate dismissal of the grievance without prejudice to any further institutional remedies available to the Publisher." },
      { type: "h3", id: "escalation", text: "5.5 Exhaustion of Remedy & Escalation" },
      { type: "p", text: "Editorial disputes involving student organizations should first be addressed in a joint-review involving:" },
      { type: "ul", items: ["The Subject Organization;", "The DAU Press Club;", "The Student Body Government"] },
      { type: "p", text: "A Subject's decision to escalate the matter beyond the said parties constitutes as abandonment of the proess and will be considered **“bad faith”**. The Publisher may treat such escalation as a waiver of the Subject's continued participation and may consider the process concluded on that basis." },
      { type: "p", text: "The Publisher reserves the right to seek institutional remedies or request public corrections where bad-faith misrepresentation of its reporting or procedures has occurred." },
    ],
  },
  {
    id: "disclosure",
    number: "6",
    title: "Subject Responsibility for Disclosure",
    blocks: [
      { type: "p", text: "The interview, request for comment, or official communication constitutes the Subject's opportunity to present all facts, explanations, qualifications, corrections, and contextual information that the Subject considers relevant." },
      { type: "p", text: "The Publisher is under no obligation to identify, anticipate, or solicit every possible explanation, defense, clarification, or mitigating circumstance, provided that the Subject was given a reasonable opportunity to comment as defined in Section 1." },
      { type: "p", text: "Where the Subject has been afforded a reasonable opportunity to comment but elects not to disclose relevant information, fails to clarify a material fact, or omits contextual information within their knowledge, such omission shall not subsequently constitute grounds to allege unfairness, incomplete reporting, bias, or journalistic misconduct solely because the Publisher did not independently request that specific information." },
      { type: "p", text: "Nothing in this provision limits the Publisher's commitment to fair, accurate, and good-faith reporting, or its correction obligations under Section 4.2." },
    ],
  },
  {
    id: "factuality",
    number: "7",
    title: "Commitment to Factuality and Objective Reporting",
    blocks: [
      { type: "p", text: "The Publisher conducts its reporting using verified information, documentary evidence, credible sources, and on-the-record testimony, while adhering to accepted journalistic standards." },
      { type: "p", text: "Editorial decisions shall remain independent of personal relationships, organizational affiliations, external influence, or administrative pressure." },
      { type: "p", text: "The Publisher's primary obligation is to factual accuracy, contextual integrity, and the public interest." },
    ],
  },
  {
    id: "prior-restraint",
    number: "8",
    title: "Waiver of Prior Restraint and Final Review",
    blocks: [
      { type: "p", text: "The Subject acknowledges that participation in an interview or official communication does not create any contractual or procedural entitlement to prior review, prior restraint, editorial approval, or publication veto." },
      { type: "p", text: "The Subject is not entitled to review, edit, approve, or delay any draft, headline, formatting, publication timing, or final published material before public release." },
    ],
  },
  {
    id: "data-handling",
    number: "9",
    title: "Data Handling",
    blocks: [
      { type: "p", text: "Recordings, notes, and other materials collected in the course of an interview or communication shall be retained by the Publisher only as long as reasonably necessary for verification, editorial review, and response to any grievance, and shall be handled with reasonable care to prevent unauthorized access or disclosure." },
    ],
  },
  {
    id: "term",
    number: "10",
    title: "Term and Duration",
    blocks: [
      { type: "p", text: "This Agreement applies to the communication or interview in connection with which it is presented and, where the Subject holds an ongoing institutional or organizational role, to subsequent communications with the Publisher during the academic year in which it is executed, unless earlier superseded in writing by the Publisher." },
    ],
  },
  {
    id: "governing-framework",
    number: "11",
    title: "Governing Framework",
    blocks: [
      { type: "p", text: "This Agreement shall be interpreted in accordance with the policies of the University and applicable law. Disputes not resolved through the escalation process in Section 5.6 may be referred to any competent institutional or legal authority available to the parties." },
    ],
  },
  {
    id: "acknowledgment",
    number: "12",
    title: "Acknowledgment and Consent",
    blocks: [
      { type: "p", text: "The Subject acknowledges having read and understood this Agreement and confirms agreement to its terms by a dated written or electronic acknowledgment sent to the Publisher no later than the time of the communication." },
    ],
  },
  {
    id: "entire-agreement",
    number: "13",
    title: "Entire Agreement",
    blocks: [
      { type: "p", text: "This Agreement constitutes the complete understanding between the Publisher and the Subject regarding interviews, communications, attribution, and editorial use of materials. No oral statement, informal assurance, or prior communication shall modify this Agreement unless confirmed in writing by the Publisher." },
    ],
  },
  {
    id: "severability",
    number: "14",
    title: "Severability",
    blocks: [
      { type: "p", text: "If any provision of this Agreement is determined to be invalid, unlawful, or unenforceable, the remaining provisions shall remain in full force and effect." },
    ],
  },
  {
    id: "non-waiver",
    number: "15",
    title: "Non-Waiver",
    blocks: [
      { type: "p", text: "Failure by the Publisher to enforce any provision of this Agreement shall not constitute a waiver of that provision or any future enforcement thereof." },
    ],
  },
  {
    id: "interpretation",
    number: "16",
    title: "Interpretation",
    blocks: [
      { type: "p", text: "Section headings are provided solely for convenience and shall not affect the interpretation of this Agreement." },
    ],
  },
];
