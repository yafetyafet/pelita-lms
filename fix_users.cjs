const fs = require("fs");
let content = fs.readFileSync("src/app/admin/users/page.tsx", "utf8");
content = content.replace(/className=\{\\.*?\}/g, "className={`font-bold ${u.role === 'ADMIN' ? 'text-purple-600' : u.role === 'TEACHER' ? 'text-emerald-600' : 'text-blue-600'}`}");
fs.writeFileSync("src/app/admin/users/page.tsx", content);
