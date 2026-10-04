// pm2로 앱 서버를 항상 켜 둔다. 외부 주소는 Tailscale Funnel이 따로 유지한다 (README 참고).
module.exports = {
  apps: [{ name: "pokafinder", script: "npm", args: "start" }],
};
