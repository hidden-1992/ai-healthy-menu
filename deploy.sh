#!/bin/bash
# 慧食 AI 部署脚本
# 在腾讯云 CVM (TencentOS Server 4) 上执行

set -e

echo "=========================================="
echo "  慧食 AI 部署脚本"
echo "=========================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 部署目录
DEPLOY_DIR="/home/deploy/huishi-ai"

# ==================== Step 1: 安装 Node.js ====================
echo -e "\n${YELLOW}[1/6] 安装 Node.js 18.x LTS...${NC}"

if command -v node &> /dev/null; then
    echo -e "${GREEN}Node.js 已安装: $(node -v)${NC}"
else
    echo "使用 nvm 安装 Node.js..."
    
    # 安装 nvm
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    
    # 创建 .bashrc（如果不存在）
    touch ~/.bashrc
    
    # 直接加载 nvm（不依赖 .bashrc）
    export NVM_DIR="$HOME/.nvm"
    source "$NVM_DIR/nvm.sh"
    
    # 安装 Node.js 18 LTS
    nvm install 18
    nvm use 18
    nvm alias default 18
    
    # 确保 .bashrc 包含 nvm 配置
    if ! grep -q "NVM_DIR" ~/.bashrc 2>/dev/null; then
        cat >> ~/.bashrc << 'EOF'
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
EOF
    fi
    
    echo -e "${GREEN}Node.js 安装完成: $(node -v)${NC}"
fi

# ==================== Step 2: 安装 Nginx ====================
echo -e "\n${YELLOW}[2/6] 安装 Nginx...${NC}"

if command -v nginx &> /dev/null; then
    echo -e "${GREEN}Nginx 已安装: $(nginx -v 2>&1)${NC}"
else
    sudo dnf install -y nginx
    sudo systemctl enable nginx
    sudo systemctl start nginx
    echo -e "${GREEN}Nginx 安装完成${NC}"
fi

# ==================== Step 3: 安装 PM2 ====================
echo -e "\n${YELLOW}[3/6] 安装 PM2...${NC}"

if command -v pm2 &> /dev/null; then
    echo -e "${GREEN}PM2 已安装: $(pm2 -v)${NC}"
else
    sudo npm install -g pm2
    echo -e "${GREEN}PM2 安装完成: $(pm2 -v)${NC}"
fi

# ==================== Step 4: 创建部署目录 ====================
echo -e "\n${YELLOW}[4/6] 准备部署目录...${NC}"

sudo mkdir -p $DEPLOY_DIR
sudo mkdir -p $DEPLOY_DIR/logs
sudo chown -R $(whoami):$(whoami) $DEPLOY_DIR

echo -e "${GREEN}部署目录已创建: $DEPLOY_DIR${NC}"

# ==================== Step 5: 提示配置 ====================
echo -e "\n${YELLOW}[5/6] 配置说明${NC}"
echo "=========================================="
echo -e "${RED}重要: 请手动完成以下配置:${NC}"
echo ""
echo "1. 将项目代码复制到 $DEPLOY_DIR"
echo ""
echo "2. 创建 .env 文件:"
echo "   cd $DEPLOY_DIR"
echo "   cp .env.example .env"
echo "   vim .env  # 填入你的 OPENROUTER_API_KEY"
echo ""
echo "3. 安装依赖并构建:"
echo "   cd $DEPLOY_DIR"
echo "   npm install"
echo "   npm run build"
echo ""
echo "4. 配置 Nginx:"
echo "   sudo cp nginx.conf.example /etc/nginx/conf.d/huishi-ai.conf"
echo "   sudo vim /etc/nginx/conf.d/huishi-ai.conf  # 修改域名"
echo "   sudo nginx -t"
echo "   sudo systemctl reload nginx"
echo ""
echo "5. 启动应用:"
echo "   cd $DEPLOY_DIR"
echo "   pm2 start ecosystem.config.js"
echo "   pm2 save"
echo "   pm2 startup  # 设置开机自启"
echo ""
echo "=========================================="

# ==================== Step 6: 验证安装 ====================
echo -e "\n${YELLOW}[6/6] 验证安装结果${NC}"
echo "Node.js: $(node -v)"
echo "npm: $(npm -v)"
echo "PM2: $(pm2 -v)"
nginx -v 2>&1

echo ""
echo -e "${GREEN}基础环境安装完成!${NC}"
echo "请按照上述步骤完成剩余配置。"
