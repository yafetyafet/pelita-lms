const fs = require("fs");
let content = fs.readFileSync("prisma/schema.prisma", "utf8");
content = content.replace("assignments    Assignment[]", "assignments    Assignment[]\n  userAssignments UserAssignment[]");
fs.writeFileSync("prisma/schema.prisma", content);
