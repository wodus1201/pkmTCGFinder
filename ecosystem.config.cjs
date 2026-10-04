// pm2로 앱 서버와 고정 터널을 항상 켜 둔다 (재부팅 후 자동 시작은 README 참고)
module.exports = {
  apps: [
    { name: "pokafinder", script: "npm", args: "start" },
    { name: "pokafinder-tunnel", script: "npx", args: "cloudflared tunnel run --url http://localhost:3000 pokafinder" },
  ],
};
