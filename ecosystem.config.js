/**
 * PM2 进程管理配置文件
 * 用于生产环境部署
 */
module.exports = {
  apps: [{
    name: 'huishi-ai',
    script: 'server.js',
    cwd: '/home/deploy/huishi-ai',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    // 日志配置
    error_file: '/home/deploy/huishi-ai/logs/error.log',
    out_file: '/home/deploy/huishi-ai/logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    // 合并日志
    merge_logs: true
  }]
};
