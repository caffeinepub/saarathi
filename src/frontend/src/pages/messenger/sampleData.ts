import type { LocalGroup, LocalMessage, LocalUser } from "./types";

export const SAMPLE_USERS: LocalUser[] = [
  { id: "priya", displayName: "Priya Sharma", username: "priya.sharma" },
  { id: "rajesh", displayName: "Rajesh Kumar", username: "rajesh.kumar" },
  { id: "meena", displayName: "Meena Iyer", username: "meena.iyer" },
  { id: "ankit", displayName: "Ankit Verma", username: "ankit.verma" },
  { id: "sunita", displayName: "Sunita Patel", username: "sunita.patel" },
  { id: "ravi", displayName: "Ravi Kumar", username: "ravi.kumar" },
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
      name: "Sales Team",
      description: "All sales discussions and updates",
      creatorId: currentUserId,
      members: [currentUserId, "priya", "rajesh", "ankit"],
      admins: [currentUserId],
      onlyAdminsCanPost: false,
    },
    {
      id: "g1-sub1",
      name: "North Zone",
      description: "North India territory updates",
      creatorId: currentUserId,
      members: [currentUserId, "priya", "rajesh"],
      admins: [currentUserId, "priya"],
      onlyAdminsCanPost: false,
      parentGroupId: "g1",
    },
    {
      id: "g2",
      name: "Operations",
      description: "Ops coordination and daily standups",
      creatorId: "meena",
      members: [currentUserId, "meena", "sunita"],
      admins: ["meena"],
      onlyAdminsCanPost: true,
    },
    {
      id: "g3",
      name: "Finance & GST",
      description: "Invoices, tax filings, GST compliance",
      creatorId: currentUserId,
      members: [currentUserId, "meena", "rajesh"],
      admins: [currentUserId, "meena"],
      onlyAdminsCanPost: false,
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
        senderId: "priya",
        senderName: "Priya Sharma",
        content:
          "Good morning team! Q1 targets reviewed — we're at 87% achievement. Strong push needed for remaining 2 weeks.",
        msgType: "text",
        timestamp: h(5),
      },
      {
        id: "m2",
        senderId: "rajesh",
        senderName: "Rajesh Kumar",
        content:
          "Maharashtra accounts are looking solid. Pune closed 3 new clients this week.",
        msgType: "text",
        timestamp: h(4),
      },
      {
        id: "m3",
        senderId: currentUserId,
        senderName: currentDisplayName,
        content:
          "Great work Rajesh! Let's ensure invoices are raised before month end. Priya, can you share the updated pipeline report?",
        msgType: "text",
        timestamp: h(3),
      },
      {
        id: "m4",
        senderId: "priya",
        senderName: "Priya Sharma",
        content: "Sharing the Q1 pipeline report now.",
        msgType: "file",
        blobUrl: "",
        fileName: "Q1_Pipeline_Report.xlsx",
        fileSize: "248 KB",
        timestamp: h(2),
      },
      {
        id: "m5",
        senderId: "ankit",
        senderName: "Ankit Verma",
        content:
          "Delhi NCR update: 2 proposals submitted, follow-up calls scheduled for Friday.",
        msgType: "text",
        timestamp: m(45),
      },
      // Received task request in Sales Team from Ravi Kumar
      {
        id: "m_task_1",
        senderId: "ravi",
        senderName: "Ravi Kumar",
        content: "Task Request: GST Filing Review",
        msgType: "task_request",
        timestamp: m(20),
        taskPayload: {
          activityId: "ext_1",
          title: "GST Filing Review",
          taskType: "groupTask",
          assignees: [currentDisplayName],
          dateTime: new Date(now + 2 * 24 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 16),
          deadline: new Date(now + 3 * 24 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 10),
          location: "Accounts Office",
          notes:
            "Please review Q3 GST returns and highlight any discrepancies before filing deadline this Friday.",
        },
        taskStatus: "pending",
      },
    ],
    "group_g1-sub1": [
      {
        id: "ns1",
        senderId: "priya",
        senderName: "Priya Sharma",
        content:
          "North zone weekly review: Chandigarh and Jaipur are performing above target! 🎯",
        msgType: "text",
        timestamp: h(8),
      },
      {
        id: "ns2",
        senderId: "rajesh",
        senderName: "Rajesh Kumar",
        content:
          "Confirmed — Jaipur closed the Sharma Industries deal. ₹4.2L order.",
        msgType: "text",
        timestamp: h(6),
      },
      {
        id: "ns3",
        senderId: currentUserId,
        senderName: currentDisplayName,
        content: "Excellent! Please ensure GST invoice is raised today itself.",
        msgType: "text",
        timestamp: h(5),
      },
    ],
    group_g2: [
      {
        id: "op1",
        senderId: "meena",
        senderName: "Meena Iyer",
        content:
          "Daily standup: Warehouse stock reconciliation complete. Dispatch team on schedule.",
        msgType: "text",
        timestamp: h(7),
      },
      {
        id: "op2",
        senderId: "sunita",
        senderName: "Sunita Patel",
        content: "Vendor payment batch processed. 12 invoices cleared.",
        msgType: "text",
        timestamp: h(3),
      },
    ],
    group_g3: [
      {
        id: "fin1",
        senderId: "meena",
        senderName: "Meena Iyer",
        content:
          "GSTR-1 filing deadline is 11th. Please ensure all B2B invoices are uploaded.",
        msgType: "text",
        timestamp: h(24),
      },
      {
        id: "fin2",
        senderId: currentUserId,
        senderName: currentDisplayName,
        content:
          "I've raised the invoice for Patel Enterprises. GST applied at 18%. Rajesh please verify before sending.",
        msgType: "text",
        timestamp: h(20),
      },
      {
        id: "fin3",
        senderId: "rajesh",
        senderName: "Rajesh Kumar",
        content: "Verified and approved. You can send it.",
        msgType: "text",
        timestamp: h(19),
      },
    ],
    dm_priya: [
      {
        id: "d1",
        senderId: "priya",
        senderName: "Priya Sharma",
        content:
          "Hi! Can we sync on the Mumbai client presentation? I have some questions on pricing.",
        msgType: "text",
        timestamp: h(2),
      },
      {
        id: "d2",
        senderId: currentUserId,
        senderName: currentDisplayName,
        content:
          "Sure Priya, let's connect at 3 PM today. I'll send the latest pricing deck.",
        msgType: "text",
        timestamp: h(1.5),
      },
      {
        id: "d3",
        senderId: "priya",
        senderName: "Priya Sharma",
        content: "Perfect, thanks! See you at 3.",
        msgType: "text",
        timestamp: h(1),
      },
      // Received task request in DM from Priya
      {
        id: "d_task_1",
        senderId: "priya",
        senderName: "Priya Sharma",
        content: "Task Request: Client Presentation",
        msgType: "task_request",
        timestamp: m(10),
        taskPayload: {
          activityId: "ext_2",
          title: "Client Presentation",
          taskType: "meeting",
          assignees: [currentDisplayName],
          dateTime: new Date(now + 1 * 24 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 16),
          deadline: new Date(now + 1 * 24 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 10),
          location: "Conference Room A",
          notes:
            "Prepare slides for Patel Industries demo tomorrow. Include product roadmap and pricing options.",
        },
        taskStatus: "pending",
      },
    ],
    dm_rajesh: [
      {
        id: "r1",
        senderId: "rajesh",
        senderName: "Rajesh Kumar",
        content:
          "The Pune client wants a revised estimate with 15% volume discount included.",
        msgType: "text",
        timestamp: h(3),
      },
      {
        id: "r2",
        senderId: currentUserId,
        senderName: currentDisplayName,
        content:
          "I'll update the estimate and share by EOD. Discount is applicable for orders above ₹2L.",
        msgType: "text",
        timestamp: h(2),
      },
    ],
    dm_ravi: [
      {
        id: "rv1",
        senderId: "ravi",
        senderName: "Ravi Kumar",
        content:
          "Hey, I've sent you a GST filing task request in the Sales Team group. Please accept at your earliest.",
        msgType: "text",
        timestamp: m(25),
      },
    ],
  };
}
