const fs = require('fs');
const files = [
  'src/app/actions/admin.ts',
  'src/app/actions/teacher.ts',
  'src/app/actions/student.ts'
];
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/revalidatePath\('[^']+'\)/g, "revalidatePath('/', 'layout')");
  fs.writeFileSync(file, content);
  console.log('Updated ' + file);
}
