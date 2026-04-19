import { execSync } from "child_process";

const args = process.argv.slice(2);

const branch = args[0];
const message = args.slice(1).join(" ");

if (!branch || !message) {
  console.error("Usage: npm run branch <branch-name> <commit-message>");
  process.exit(1);
}

try {
  console.log(`➡ Switching to branch: ${branch}`);
  execSync(`git checkout -b ${branch}`, { stdio: "inherit" });

  console.log(`➡ Pulling latest`);
//   execSync(`git pull`, { stdio: "inherit" });

//   execSync(`git add .`, { stdio: "inherit" });

  execSync(`git commit -m "${message}"`, { stdio: "inherit" });

  execSync(`git push origin ${branch}`, { stdio: "inherit" });

  console.log("✅ Done");
} catch (err) {
  console.error("❌ Error:", err.message);
}