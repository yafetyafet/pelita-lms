const fs = require("fs");
function fix(file) {
  let content = fs.readFileSync(file, "utf8");
  content = content.replace(/confirm\(\\\s*Apakah.*?\\\)/g, "confirm(`Apakah Anda yakin ingin menghapus ${name}?`)");
  fs.writeFileSync(file, content);
}
fix("src/app/admin/users/page.tsx");
fix("src/app/admin/subjects/page.tsx");
fix("src/app/admin/classes/page.tsx");
