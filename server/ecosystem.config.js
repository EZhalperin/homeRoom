export default {
  apps: [
    {
      name: "homeroom-server",
      script: "src/app.js",
      interpreter: "node",
      node_args: "--env-file=.env",
      autorestart: true,
      max_memory_restart: "300M",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
