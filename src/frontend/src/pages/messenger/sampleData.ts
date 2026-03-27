import type { LocalGroup, LocalMessage, LocalUser } from "./types";

export const SAMPLE_USERS: LocalUser[] = [
  { id: "kavya", displayName: "Kavya Nair", username: "kavya.nair" },
  { id: "suresh", displayName: "Suresh Mehta", username: "suresh.mehta" },
  { id: "deepika", displayName: "Deepika Joshi", username: "deepika.joshi" },
  { id: "arjun", displayName: "Arjun Singh", username: "arjun.singh" },
];

export const AVATAR_COLORS = [
  "bg-orange-500",
  "bg-emerald-600",
  "bg-blue-600",
  "bg-purple-600",
  "bg-rose-600",
  "bg-teal-600",
  "bg-indigo-600",
  "bg-amber-600",
];

export const SAMPLE_DEMO_KEYS = {
  groupIds: ["g1", "g1-sub1", "g2"],
  chatKeys: [
    "group_g1",
    "group_g1-sub1",
    "group_g2",
    "dm_kavya",
    "dm_suresh",
    "dm_arjun",
  ],
  userIds: ["kavya", "suresh", "deepika", "arjun"],
};

export function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function makeSampleGroups(currentUserId: string): LocalGroup[] {
  return [
    {
      id: "g1",
      name: "Tattva Traders Team",
      description: "Main team group for all internal updates",
      creatorId: currentUserId,
      members: [currentUserId, "kavya", "suresh", "deepika", "arjun"],
      admins: [currentUserId],
      onlyAdminsCanPost: false,
      depth: 0,
      isDemo: true,
    },
    {
      id: "g1-sub1",
      name: "Accounts & GST",
      description: "GST filings, invoices, compliance tracking",
      creatorId: currentUserId,
      members: [currentUserId, "suresh"],
      admins: [currentUserId, "suresh"],
      onlyAdminsCanPost: false,
      parentGroupId: "g1",
      depth: 1,
      isDemo: true,
    },
    {
      id: "g2",
      name: "Client Projects",
      description: "Active client work and field coordination",
      creatorId: currentUserId,
      members: [currentUserId, "kavya", "arjun"],
      admins: [currentUserId, "kavya"],
      onlyAdminsCanPost: false,
      depth: 0,
      isDemo: true,
    },
  ];
}

export function makeSampleMessages(
  currentUserId: string,
  currentDisplayName: string,
): Record<string, LocalMessage[]> {
  const now = Date.now();
  const h = (hrs: number) => now - hrs * 60 * 60 * 1000;
  const m = (mins: number) => now - mins * 60 * 1000;

  return {
    group_g1: [
      {
        id: "m1",
        senderId: "kavya",
        senderName: "Kavya Nair",
        content:
          "Good morning team! We have a big week ahead — Verma Industries follow-up call is tomorrow, and Kapoor Exports proposal needs to go out by Thursday.",
        msgType: "text",
        timestamp: h(5),
      },
      {
        id: "m2",
        senderId: "suresh",
        senderName: "Suresh Mehta",
        content:
          "GST return for Q4 is due in 3 days. I'll need all purchase invoices from Arjun by today evening.",
        msgType: "text",
        timestamp: h(4),
      },
      {
        id: "m3",
        senderId: currentUserId,
        senderName: currentDisplayName,
        content:
          "Noted Suresh. Arjun, please share the vendor bills from last month ASAP. Kavya, let's also confirm the meeting time with Verma today.",
        msgType: "text",
        timestamp: h(3),
      },
      {
        id: "m4",
        senderId: "arjun",
        senderName: "Arjun Singh",
        content:
          "Will share by 5 PM today. Also visited Bharat Tech Solutions office yesterday — they are interested in our Annual Compliance Package.",
        msgType: "text",
        timestamp: h(2),
      },
      {
        id: "m_task_1",
        senderId: "kavya",
        senderName: "Kavya Nair",
        content: "Task Request: Follow-up Call — Verma Industries",
        msgType: "task_request",
        timestamp: m(20),
        taskPayload: {
          activityId: "a2",
          title: "Follow-up Call — Verma Industries",
          taskType: "meeting",
          assignees: [currentDisplayName],
          dateTime: new Date(now + 1 * 24 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 16),
          deadline: new Date(now + 1 * 24 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 10),
          location: "Phone / Google Meet",
          notes:
            "Discuss revised pricing and timeline for the import consulting engagement. Key contact: Mr. Rajan Verma, MD.",
        },
        taskStatus: "pending",
      },
      {
        id: "m_sys_1",
        senderId: "system",
        senderName: "System",
        content: "📌 Task created: GST Return Filing Q4",
        msgType: "text",
        timestamp: m(10),
      },
    ],
    "group_g1-sub1": [
      {
        id: "gs1",
        senderId: "suresh",
        senderName: "Suresh Mehta",
        content:
          "GSTR-1 deadline is this Friday. Total B2B invoices this quarter: 8. All uploaded to portal except INV-003 which is still pending client's GSTIN confirmation.",
        msgType: "text",
        timestamp: h(8),
      },
      {
        id: "gs2",
        senderId: currentUserId,
        senderName: currentDisplayName,
        content:
          "Kavya is following up with that client for GSTIN. Should have it by tomorrow. Let's file by Thursday to be safe.",
        msgType: "text",
        timestamp: h(6),
      },
      {
        id: "gs3",
        senderId: "suresh",
        senderName: "Suresh Mehta",
        content:
          "Sounds good. Also flagging — INV-001 from Verma Industries (₹35,000) is due in 10 days. Should we send a payment reminder this week?",
        msgType: "text",
        timestamp: h(4),
      },
      {
        id: "gs4",
        senderId: currentUserId,
        senderName: currentDisplayName,
        content: "Yes, send a polite reminder on Wednesday.",
        msgType: "text",
        timestamp: h(3),
      },
    ],
    group_g2: [
      {
        id: "cp1",
        senderId: "kavya",
        senderName: "Kavya Nair",
        content:
          "Kapoor Exports reviewed our draft proposal and had a few questions on the documentation process. I've updated the estimate — can you review before we send?",
        msgType: "text",
        timestamp: h(6),
      },
      {
        id: "cp2",
        senderId: "arjun",
        senderName: "Arjun Singh",
        content:
          "Bharat Tech meeting went well! They want a detailed proposal for Annual Compliance Package. Said they'll sign if we can start by next month.",
        msgType: "text",
        timestamp: h(4),
      },
      {
        id: "cp3",
        senderId: currentUserId,
        senderName: currentDisplayName,
        content:
          "Great news Arjun! Let's prioritize the Bharat Tech proposal. Kavya, once Kapoor draft is approved, I'll send it. Please loop in Suresh for GST applicability.",
        msgType: "text",
        timestamp: h(2),
      },
      {
        id: "cp4",
        senderId: "kavya",
        senderName: "Kavya Nair",
        content:
          "Will do! Also reminder — we need to collect advance from Verma Industries before starting their project. They agreed to 30% upfront.",
        msgType: "text",
        timestamp: h(1),
      },
    ],
    dm_kavya: [
      {
        id: "dk1",
        senderId: "kavya",
        senderName: "Kavya Nair",
        content:
          "Quick update — Verma Industries called. They want to move the meeting to 11 AM tomorrow instead of 3 PM. Are you available?",
        msgType: "text",
        timestamp: h(3),
      },
      {
        id: "dk2",
        senderId: currentUserId,
        senderName: currentDisplayName,
        content:
          "Yes, 11 AM works. Please confirm with them and share the Meet link.",
        msgType: "text",
        timestamp: h(2.5),
      },
      {
        id: "dk3",
        senderId: "kavya",
        senderName: "Kavya Nair",
        content:
          "Done! Also, do you want me to prepare a revised pricing sheet for Kapoor Exports? They mentioned budget is around ₹80-90k.",
        msgType: "text",
        timestamp: h(2),
      },
      {
        id: "dk4",
        senderId: currentUserId,
        senderName: currentDisplayName,
        content:
          "Good idea. Keep it around ₹96,000 with our standard 18% GST. We can offer 5% discount if they sign before month end.",
        msgType: "text",
        timestamp: h(1.5),
      },
    ],
    dm_suresh: [
      {
        id: "ds1",
        senderId: "suresh",
        senderName: "Suresh Mehta",
        content:
          "Here's the Q4 reconciliation summary — total inward: ₹2.4L, total outward: ₹3.1L. Net ITC available: ₹18,200. Filing by Thursday should be fine.",
        msgType: "text",
        timestamp: h(5),
      },
      {
        id: "ds2",
        senderId: currentUserId,
        senderName: currentDisplayName,
        content:
          "Thanks Suresh. Please ensure Verma Industries' invoice (INV-001) reflects correctly in GSTR-1. Payment is still pending from them.",
        msgType: "text",
        timestamp: h(4),
      },
      {
        id: "ds3",
        senderId: "suresh",
        senderName: "Suresh Mehta",
        content:
          "Yes it's included. Sending payment reminder today via SAARATHI. Will post update here.",
        msgType: "text",
        timestamp: h(3),
      },
    ],
    dm_arjun: [
      {
        id: "da1",
        senderId: "arjun",
        senderName: "Arjun Singh",
        content:
          "Reached Bharat Tech office. Very good meeting — MD was impressed with our service portfolio. Sharing visit notes now.",
        msgType: "text",
        timestamp: h(10),
      },
      {
        id: "da2",
        senderId: currentUserId,
        senderName: currentDisplayName,
        content:
          "Excellent! Please also collect their GSTIN and authorized signatory details for the proposal.",
        msgType: "text",
        timestamp: h(9),
      },
      {
        id: "da3",
        senderId: "arjun",
        senderName: "Arjun Singh",
        content:
          "Got it. GSTIN: 27AABCB1234K1ZX, Contact: Ms. Priya Bhosale, CFO. Sending the vendor bills from last month also.",
        msgType: "text",
        timestamp: h(8),
      },
    ],
  };
}
